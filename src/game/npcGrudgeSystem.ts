// NPC Grudge & Debt System - Tracks grudges, debts, and behavioral modifiers
// Based on the Grudges and Memory Overhaul specification
// Research-backed values from psychological studies on forgiveness, trust, and relationship repair

// Utility function
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============= REALISTIC PSYCHOLOGY CONSTANTS =============
// Based on McCullough et al. (2007) forgiveness research and relationship psychology

// Forgiveness timeline research: Most grudges show 50% intensity reduction within 2-4 weeks
// High-severity offenses (betrayal, violence) can persist for months to years
// Reference: "Rumination, Emotion, and Forgiveness" - Journal of Personality and Social Psychology

const PSYCHOLOGY_CONSTANTS = {
  // Grudge decay rates (intensity reduction per in-game hour)
  // Based on natural forgiveness curves - faster initial decay, slower as it lingers
  GRUDGE_DECAY_RATES: {
    minor: 0.15,      // Minor offenses (insults) - ~50% gone in 3-4 hours
    moderate: 0.05,   // Moderate offenses (theft, lies) - ~50% gone in 10+ hours
    severe: 0.02,     // Severe offenses (betrayal, violence) - takes days
    traumatic: 0,     // Traumatic (murder, assault) - never naturally decays
  },
  
  // Trust rebuilding is slower than trust destruction (research shows 3:1 ratio)
  TRUST_REBUILD_RATIO: 0.33,  // Takes 3x as long to rebuild as to destroy
  
  // Fear conditioning - persists longer than other emotions
  FEAR_DECAY_RATE: 0.008,  // Fear fades very slowly
  
  // Familiarity builds slowly through consistent positive contact
  FAMILIARITY_GAIN_PER_INTERACTION: 2,
  
  // Affection changes are proportional to emotional intensity of event
  AFFECTION_INTENSITY_MULTIPLIER: 1.5,
  
  // Minimum intensity for grudge formation (minor slights don't create lasting grudges)
  GRUDGE_FORMATION_THRESHOLD: 5,
  
  // Debt formation requires significant positive action
  DEBT_FORMATION_THRESHOLD: 6,
  
  // Research: Rumination increases grudge persistence by 40-60%
  RUMINATION_PERSISTENCE_MULTIPLIER: 1.5,
};

// ============= RELATIONSHIP METRICS =============

export interface NPCRelationshipMetrics {
  trust: number;        // -100 to 100 (research: trust is binary at extremes, gradient in middle)
  respect: number;      // -100 to 100 (built through competence/status displays)
  fear: number;         // 0 to 100 (conditioned response, very persistent)
  affection: number;    // -100 to 100 (warm feelings, changes gradually)
  familiarity: number;  // 0 to 100 (how well they know player - builds slowly)
}

export function createDefaultRelationshipMetrics(): NPCRelationshipMetrics {
  return {
    trust: 0,
    respect: 0,
    fear: 0,
    affection: 0,
    familiarity: 0,
  };
}

// Create relationship starting point based on NPC personality
export function createRelationshipFromPersonality(
  personality: { openness: number; agreeableness: number; neuroticism: number }
): NPCRelationshipMetrics {
  // Research: Agreeable people start more trusting, neurotic people more fearful
  return {
    trust: Math.round((personality.agreeableness - 50) * 0.3), // -15 to +15 based on agreeableness
    respect: 0,
    fear: Math.round(personality.neuroticism * 0.1), // Neurotic people more fearful
    affection: Math.round((personality.agreeableness - 50) * 0.2),
    familiarity: 0,
  };
}

// ============= GRUDGE SYSTEM =============

export interface Grudge {
  id: string;
  reason: string;          // What caused the grudge
  event: string;           // Original event type
  intensity: number;       // 1-10 severity (research: emotional intensity predicts persistence)
  created: number;         // Turn/tick when created
  resolved: boolean;
  resolutionPath: string;  // How to resolve (e.g., 'sincere_apology_and_gift')
  decayRate: number;       // How fast intensity fades (0 = permanent)
  ruminationLevel: number; // 0-1: How much NPC dwells on it (increases persistence)
  witnessed: boolean;      // If others saw it (increases shame/anger)
  wasPublic: boolean;      // If it was public humiliation
}

// Events that can create grudges - severity ratings based on social psychology research
export const GRUDGE_EVENTS = {
  // Minor (1-3): Social slights that are forgiven quickly
  'disrespected': { baseSeverity: 2, category: 'minor' },
  'mocked': { baseSeverity: 3, category: 'minor' },
  'ignored': { baseSeverity: 2, category: 'minor' },
  
  // Moderate (4-6): Trust violations requiring apology
  'insulted': { baseSeverity: 4, category: 'moderate' },
  'lied': { baseSeverity: 5, category: 'moderate' },
  'cheated': { baseSeverity: 6, category: 'moderate' },
  'stole': { baseSeverity: 6, category: 'moderate' },
  'broke_promise': { baseSeverity: 5, category: 'moderate' },
  'abandoned': { baseSeverity: 6, category: 'moderate' },
  
  // Severe (7-8): Major betrayals requiring significant repair
  'betrayed': { baseSeverity: 8, category: 'severe' },
  'humiliated': { baseSeverity: 7, category: 'severe' },
  'sabotaged': { baseSeverity: 7, category: 'severe' },
  'exposed_secret': { baseSeverity: 8, category: 'severe' },
  'destroyed_property': { baseSeverity: 7, category: 'severe' },
  
  // Traumatic (9-10): Permanent or near-permanent damage
  'attacked': { baseSeverity: 9, category: 'traumatic' },
  'threatened_family': { baseSeverity: 9, category: 'traumatic' },
  'killed_friend': { baseSeverity: 10, category: 'traumatic' },
} as const;

export type GrudgeEvent = keyof typeof GRUDGE_EVENTS;

// Resolution paths for grudges - based on relationship repair research
const RESOLUTION_PATHS: Record<string, { method: string; difficulty: number; requirements: string[] }> = {
  disrespected: { method: 'show_respect', difficulty: 1, requirements: ['respectful_behavior'] },
  mocked: { method: 'sincere_apology', difficulty: 2, requirements: ['apology'] },
  ignored: { method: 'acknowledgment', difficulty: 1, requirements: ['attention'] },
  insulted: { method: 'sincere_apology', difficulty: 3, requirements: ['apology', 'time'] },
  lied: { method: 'admit_truth_and_apology', difficulty: 4, requirements: ['confession', 'apology', 'time'] },
  cheated: { method: 'compensation_and_apology', difficulty: 5, requirements: ['compensation', 'apology', 'consistency'] },
  stole: { method: 'return_item_and_compensation', difficulty: 4, requirements: ['return_item', 'compensation'] },
  broke_promise: { method: 'fulfill_promise_and_more', difficulty: 5, requirements: ['fulfill_original', 'extra_effort'] },
  abandoned: { method: 'prove_reliability', difficulty: 6, requirements: ['consistent_presence', 'time', 'apology'] },
  betrayed: { method: 'prove_loyalty_over_time', difficulty: 8, requirements: ['consistent_loyalty', 'sacrifice', 'long_time'] },
  humiliated: { method: 'public_apology', difficulty: 7, requirements: ['public_apology', 'restore_reputation'] },
  sabotaged: { method: 'compensation_and_apology', difficulty: 6, requirements: ['fix_damage', 'compensation', 'apology'] },
  exposed_secret: { method: 'extremely_difficult', difficulty: 9, requirements: ['major_sacrifice', 'very_long_time'] },
  destroyed_property: { method: 'full_compensation', difficulty: 5, requirements: ['replace_item', 'compensation', 'apology'] },
  attacked: { method: 'nearly_impossible', difficulty: 10, requirements: ['save_their_life', 'long_time', 'consistent_peace'] },
  threatened_family: { method: 'protect_family_or_major_gift', difficulty: 9, requirements: ['protect_family', 'major_gift'] },
  killed_friend: { method: 'impossible', difficulty: 10, requirements: ['unforgivable'] },
};

export function createGrudge(
  reason: string,
  event: string,
  contextIntensity: number, // Context-based intensity modifier
  currentTick: number,
  options: { wasPublic?: boolean; wasWitnessed?: boolean; npcNeuroticism?: number } = {}
): Grudge {
  // Find matching event type
  const eventKey = Object.keys(GRUDGE_EVENTS).find(e => 
    event.toLowerCase().includes(e)
  ) as GrudgeEvent | undefined;
  
  const eventData = eventKey ? GRUDGE_EVENTS[eventKey] : { baseSeverity: 4, category: 'moderate' as const };
  
  // Calculate final intensity
  // Research: Public humiliation increases intensity by ~40%, witnessed events by ~20%
  let intensity = eventData.baseSeverity;
  intensity += (contextIntensity - 5) * 0.5; // Context modifier
  if (options.wasPublic) intensity *= 1.4;
  if (options.wasWitnessed && !options.wasPublic) intensity *= 1.2;
  
  // Neurotic individuals hold grudges more intensely
  if (options.npcNeuroticism) {
    intensity *= 1 + (options.npcNeuroticism / 200); // Up to 50% increase for highly neurotic
  }
  
  intensity = clamp(intensity, 1, 10);
  
  // Determine decay rate based on severity category
  const decayRates = PSYCHOLOGY_CONSTANTS.GRUDGE_DECAY_RATES;
  let decayRate = decayRates[eventData.category as keyof typeof decayRates] || decayRates.moderate;
  
  // Research: Rumination increases persistence - neurotic individuals ruminate more
  const ruminationLevel = options.npcNeuroticism 
    ? clamp(options.npcNeuroticism / 100, 0.1, 0.9)
    : 0.3;
  
  if (ruminationLevel > 0.5) {
    decayRate *= (1 - (ruminationLevel - 0.5)); // Reduce decay for high ruminators
  }
  
  const resolutionData = RESOLUTION_PATHS[eventKey || 'disrespected'] || RESOLUTION_PATHS.disrespected;
  
  return {
    id: `grudge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    reason,
    event,
    intensity: Math.round(intensity * 10) / 10,
    created: currentTick,
    resolved: false,
    resolutionPath: resolutionData.method,
    decayRate,
    ruminationLevel,
    witnessed: options.wasWitnessed || false,
    wasPublic: options.wasPublic || false,
  };
}

// ============= DEBT SYSTEM =============

export interface Debt {
  id: string;
  type: 'life_debt' | 'major_favor' | 'favor' | 'gratitude' | 'small_favor';
  reason: string;
  intensity: number;      // 1-10
  created: number;
  willingness: 'anything' | 'significant_help' | 'favor' | 'small_favor' | 'verbal_thanks';
  fulfilled: boolean;
  fulfilledWith?: string;
  decayRate: number;      // Gratitude fades, but slower than grudges
}

// Events that create debts - based on reciprocity research
export const DEBT_EVENTS = {
  // Small (1-3): Creates gratitude but not obligation
  'helped': { baseMagnitude: 2, type: 'small_favor' as const },
  'gave_gift': { baseMagnitude: 3, type: 'gratitude' as const },
  'gave_shelter': { baseMagnitude: 4, type: 'gratitude' as const },
  'shared_information': { baseMagnitude: 3, type: 'small_favor' as const },
  
  // Moderate (4-6): Creates real obligation
  'protected': { baseMagnitude: 5, type: 'favor' as const },
  'healed': { baseMagnitude: 5, type: 'favor' as const },
  'cleared_debt': { baseMagnitude: 6, type: 'favor' as const },
  'trusted_completely': { baseMagnitude: 5, type: 'favor' as const },
  'defended_honor': { baseMagnitude: 6, type: 'favor' as const },
  
  // Major (7-8): Significant indebtedness
  'rescued': { baseMagnitude: 7, type: 'major_favor' as const },
  'helped_achieve_goal': { baseMagnitude: 7, type: 'major_favor' as const },
  'major_gift': { baseMagnitude: 8, type: 'major_favor' as const },
  
  // Life debt (9-10): Will do almost anything
  'saved_life': { baseMagnitude: 10, type: 'life_debt' as const },
  'saved_family': { baseMagnitude: 10, type: 'life_debt' as const },
} as const;

export type DebtEvent = keyof typeof DEBT_EVENTS;

export function createDebt(
  reason: string,
  event: string,
  contextIntensity: number,
  currentTick: number
): Debt {
  const eventKey = Object.keys(DEBT_EVENTS).find(e => 
    event.toLowerCase().includes(e)
  ) as DebtEvent | undefined;
  
  const eventData = eventKey 
    ? DEBT_EVENTS[eventKey] 
    : { baseMagnitude: 4, type: 'gratitude' as const };
  
  let intensity = eventData.baseMagnitude;
  intensity += (contextIntensity - 5) * 0.3;
  intensity = clamp(intensity, 1, 10);
  
  // Determine willingness based on intensity
  let willingness: Debt['willingness'] = 'verbal_thanks';
  if (intensity >= 9) willingness = 'anything';
  else if (intensity >= 7) willingness = 'significant_help';
  else if (intensity >= 5) willingness = 'favor';
  else if (intensity >= 3) willingness = 'small_favor';
  
  // Gratitude decay: Research shows positive emotions fade faster than negative
  // But life debts create lasting obligation
  let decayRate = 0.03; // Base decay
  if (intensity >= 9) decayRate = 0; // Life debts don't decay
  else if (intensity >= 7) decayRate = 0.01;
  else if (intensity >= 5) decayRate = 0.02;
  
  return {
    id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: eventData.type,
    reason,
    intensity: Math.round(intensity * 10) / 10,
    created: currentTick,
    willingness,
    fulfilled: false,
    decayRate,
  };
}

// ============= BEHAVIOR MODIFIERS =============

export interface BehaviorModifiers {
  willHelpPlayer: boolean;
  willingToTrade: boolean;
  sharesInformation: 'none' | 'partial' | 'full' | 'misleading';
  greetingTone: 'hostile' | 'cold' | 'wary' | 'neutral' | 'polite' | 'warm' | 'enthusiastic';
  priceModifier: number;  // 0.7 = 30% discount, 1.5 = 50% markup
  combatStance: 'enemy' | 'hostile' | 'wary' | 'neutral' | 'friendly' | 'ally' | 'submissive';
  cooperationChance: number; // 0-100
  betrayalRisk: number;     // 0-100
}

export function calculateBehaviorModifiers(
  rel: NPCRelationshipMetrics,
  grudges: Grudge[],
  debts: Debt[]
): BehaviorModifiers {
  const activeGrudges = grudges.filter(g => !g.resolved && g.intensity > 2);
  const severeGrudge = activeGrudges.some(g => g.intensity >= 7);
  const moderateGrudge = activeGrudges.some(g => g.intensity >= 4);
  
  const activeDebts = debts.filter(d => !d.fulfilled);
  const majorDebt = activeDebts.some(d => d.intensity >= 7);
  const minorDebt = activeDebts.some(d => d.intensity >= 4);
  
  // Calculate composite relationship score
  const relationshipScore = (rel.trust * 0.4) + (rel.affection * 0.3) + (rel.respect * 0.2) - (rel.fear * 0.1);
  
  // Greeting tone - more nuanced
  let greetingTone: BehaviorModifiers['greetingTone'] = 'neutral';
  if (severeGrudge) {
    greetingTone = 'hostile';
  } else if (moderateGrudge || relationshipScore < -40) {
    greetingTone = 'cold';
  } else if (relationshipScore < -20) {
    greetingTone = 'wary';
  } else if (relationshipScore < 20) {
    greetingTone = 'neutral';
  } else if (relationshipScore < 40) {
    greetingTone = 'polite';
  } else if (relationshipScore < 60 || majorDebt) {
    greetingTone = 'warm';
  } else {
    greetingTone = 'enthusiastic';
  }
  
  // Price modifier - based on trust and debts
  let priceModifier = 1.0;
  if (majorDebt) priceModifier = 0.7;
  else if (minorDebt) priceModifier = 0.85;
  else if (severeGrudge) priceModifier = 2.0; // May refuse to trade at all
  else if (moderateGrudge) priceModifier = 1.5;
  else if (rel.trust < -50) priceModifier = 1.4;
  else if (rel.trust < -20) priceModifier = 1.2;
  else if (rel.trust > 60 && rel.familiarity > 40) priceModifier = 0.8;
  else if (rel.trust > 30) priceModifier = 0.9;
  
  // Combat stance
  let combatStance: BehaviorModifiers['combatStance'] = 'neutral';
  if (rel.fear > 70 && rel.trust < 0) {
    combatStance = 'submissive';
  } else if (severeGrudge) {
    combatStance = 'enemy';
  } else if (moderateGrudge || rel.trust < -50) {
    combatStance = 'hostile';
  } else if (rel.trust < -20) {
    combatStance = 'wary';
  } else if (rel.trust < 40) {
    combatStance = 'neutral';
  } else if (rel.trust < 70 || majorDebt) {
    combatStance = 'friendly';
  } else {
    combatStance = 'ally';
  }
  
  // Information sharing
  let sharesInformation: BehaviorModifiers['sharesInformation'] = 'partial';
  if (severeGrudge) {
    sharesInformation = 'misleading'; // Will actively deceive
  } else if (moderateGrudge || rel.trust < -30) {
    sharesInformation = 'none';
  } else if (rel.trust >= 50 && rel.familiarity >= 40) {
    sharesInformation = 'full';
  }
  
  // Cooperation and betrayal chances
  let cooperationChance = 50 + (rel.trust * 0.4) + (majorDebt ? 30 : minorDebt ? 15 : 0);
  if (severeGrudge) cooperationChance -= 50;
  if (moderateGrudge) cooperationChance -= 25;
  cooperationChance = clamp(cooperationChance, 0, 100);
  
  let betrayalRisk = 10 - (rel.trust * 0.1);
  if (severeGrudge) betrayalRisk += 40;
  if (moderateGrudge) betrayalRisk += 20;
  if (majorDebt) betrayalRisk -= 30;
  betrayalRisk = clamp(betrayalRisk, 0, 100);
  
  return {
    willHelpPlayer: cooperationChance > 40 && !severeGrudge,
    willingToTrade: !severeGrudge && rel.trust > -60,
    sharesInformation,
    greetingTone,
    priceModifier: Math.round(priceModifier * 100) / 100,
    combatStance,
    cooperationChance: Math.round(cooperationChance),
    betrayalRisk: Math.round(betrayalRisk),
  };
}

// ============= RELATIONSHIP UPDATES FROM MEMORY =============

// Research-backed impact values
const SENTIMENT_IMPACTS = {
  positive: { trust: 4, respect: 2, affection: 3, fear: -1 },
  negative: { trust: -10, respect: -4, affection: -6, fear: 4 }, // 2.5x stronger than positive
  traumatic: { trust: -25, respect: -8, affection: -15, fear: 15 }, // Severe and lasting
  neutral: { trust: 0, respect: 0, affection: 0, fear: 0 },
} as const;

export function updateRelationshipFromEvent(
  rel: NPCRelationshipMetrics,
  sentiment: 'positive' | 'negative' | 'traumatic' | 'neutral',
  intensity: number,
  options: { isRepeatBehavior?: boolean; timesSeen?: number } = {}
): NPCRelationshipMetrics {
  const multiplier = intensity / 5;
  const impact = SENTIMENT_IMPACTS[sentiment] || SENTIMENT_IMPACTS.neutral;
  
  // Repeated behavior has diminishing returns for positive, increasing for negative
  let repeatModifier = 1;
  if (options.isRepeatBehavior && options.timesSeen) {
    if (sentiment === 'positive') {
      repeatModifier = 1 / Math.log2(options.timesSeen + 1); // Diminishing
    } else if (sentiment === 'negative') {
      repeatModifier = Math.log2(options.timesSeen + 1); // Increasing
    }
  }
  
  // Trust rebuilding is slower (research: 3:1 ratio)
  const trustChange = sentiment === 'positive' && rel.trust < 0
    ? impact.trust * multiplier * PSYCHOLOGY_CONSTANTS.TRUST_REBUILD_RATIO
    : impact.trust * multiplier * repeatModifier;
  
  return {
    trust: clamp(rel.trust + trustChange, -100, 100),
    respect: clamp(rel.respect + (impact.respect * multiplier), -100, 100),
    affection: clamp(rel.affection + (impact.affection * multiplier * PSYCHOLOGY_CONSTANTS.AFFECTION_INTENSITY_MULTIPLIER), -100, 100),
    fear: clamp(rel.fear + (impact.fear * multiplier), 0, 100),
    familiarity: clamp(rel.familiarity + PSYCHOLOGY_CONSTANTS.FAMILIARITY_GAIN_PER_INTERACTION, 0, 100),
  };
}

// ============= GRUDGE/DEBT EVALUATION =============

export function evaluateForGrudge(
  event: string,
  sentiment: 'positive' | 'negative' | 'traumatic' | 'neutral',
  intensity: number,
  currentTick: number,
  options?: { wasPublic?: boolean; wasWitnessed?: boolean; npcNeuroticism?: number }
): Grudge | null {
  if (sentiment !== 'negative' && sentiment !== 'traumatic') return null;
  if (intensity < PSYCHOLOGY_CONSTANTS.GRUDGE_FORMATION_THRESHOLD) return null;
  
  const isGrudgeWorthy = Object.keys(GRUDGE_EVENTS).some(e => 
    event.toLowerCase().includes(e)
  );
  if (!isGrudgeWorthy) return null;
  
  return createGrudge(event, event, intensity, currentTick, options);
}

export function evaluateForDebt(
  event: string,
  sentiment: 'positive' | 'negative' | 'traumatic' | 'neutral',
  intensity: number,
  currentTick: number
): Debt | null {
  if (sentiment !== 'positive') return null;
  if (intensity < PSYCHOLOGY_CONSTANTS.DEBT_FORMATION_THRESHOLD) return null;
  
  const isDebtWorthy = Object.keys(DEBT_EVENTS).some(e => 
    event.toLowerCase().includes(e)
  );
  if (!isDebtWorthy) return null;
  
  return createDebt(event, event, intensity, currentTick);
}

// ============= GRUDGE DECAY =============

export function processGrudgeDecay(grudges: Grudge[], hoursElapsed: number = 1): Grudge[] {
  return grudges.map(grudge => {
    if (grudge.resolved || grudge.decayRate === 0) return grudge;
    
    // Research: Decay follows exponential curve, not linear
    // Intensity drops faster early, slower as it persists
    const decayFactor = grudge.decayRate * hoursElapsed;
    const exponentialDecay = grudge.intensity * Math.exp(-decayFactor);
    
    // But there's a floor based on rumination - some resentment lingers
    const ruminationFloor = grudge.intensity * grudge.ruminationLevel * 0.2;
    const newIntensity = Math.max(exponentialDecay, ruminationFloor);
    
    // Grudge fades away if intensity drops below 1
    if (newIntensity < 1) {
      return { ...grudge, resolved: true, intensity: 0 };
    }
    
    return { ...grudge, intensity: Math.round(newIntensity * 10) / 10 };
  }).filter(g => !(g.resolved && g.intensity <= 0));
}

export function processDebtDecay(debts: Debt[], hoursElapsed: number = 1): Debt[] {
  return debts.map(debt => {
    if (debt.fulfilled || debt.decayRate === 0) return debt;
    
    const newIntensity = debt.intensity - (debt.decayRate * hoursElapsed);
    
    // Debts fade but don't disappear - minimum gratitude remains
    if (newIntensity < 2) {
      return { ...debt, intensity: 2, willingness: 'verbal_thanks' };
    }
    
    // Update willingness as intensity fades
    let willingness = debt.willingness;
    if (newIntensity < 3) willingness = 'verbal_thanks';
    else if (newIntensity < 5) willingness = 'small_favor';
    else if (newIntensity < 7) willingness = 'favor';
    
    return { ...debt, intensity: Math.round(newIntensity * 10) / 10, willingness };
  });
}

// ============= AI PROMPT CONTEXT =============

export interface NPCGrudgeContext {
  npcId: string;
  relationship: NPCRelationshipMetrics;
  grudges: Grudge[];
  debts: Debt[];
  behaviorModifiers: BehaviorModifiers;
}

export function buildNPCGrudgeContext(
  npcName: string,
  ctx: NPCGrudgeContext
): string {
  const rel = ctx.relationship;
  const mods = ctx.behaviorModifiers;
  
  // Format active grudges with severity indicators
  const activeGrudges = ctx.grudges.filter(g => !g.resolved);
  let grudgeText = 'None';
  if (activeGrudges.length > 0) {
    grudgeText = activeGrudges.map(g => {
      const severity = g.intensity >= 8 ? 'SEVERE' : g.intensity >= 5 ? 'moderate' : 'minor';
      const publicNote = g.wasPublic ? ' (public humiliation)' : '';
      return `- [${severity}] ${g.reason}${publicNote} (intensity: ${g.intensity}/10, resolution: ${g.resolutionPath})`;
    }).join('\n');
  }
  
  // Format debts with obligation level
  const activeDebts = ctx.debts.filter(d => !d.fulfilled);
  let debtText = 'None';
  if (activeDebts.length > 0) {
    debtText = activeDebts.map(d => 
      `- ${d.type.toUpperCase()}: ${d.reason} (will do: ${d.willingness.replace(/_/g, ' ')})`
    ).join('\n');
  }
  
  // Calculate overall disposition
  const disposition = (rel.trust + rel.affection) / 2;
  const dispositionLabel = disposition > 50 ? 'FAVORABLE' : 
                          disposition > 0 ? 'positive' :
                          disposition > -30 ? 'neutral' :
                          disposition > -60 ? 'negative' : 'HOSTILE';
  
  return `
=== NPC PSYCHOLOGY: ${npcName} ===
RELATIONSHIP METRICS (affects behavior):
- Trust: ${rel.trust}/100 ${rel.trust < -30 ? '⚠️ DISTRUSTFUL' : rel.trust > 50 ? '✓ Trusting' : ''}
- Respect: ${rel.respect}/100
- Fear: ${rel.fear}/100 ${rel.fear > 50 ? '⚠️ AFRAID' : ''}
- Affection: ${rel.affection}/100
- Familiarity: ${rel.familiarity}/100 ${rel.familiarity < 20 ? '(stranger)' : rel.familiarity > 60 ? '(knows well)' : ''}
OVERALL DISPOSITION: ${dispositionLabel}

ACTIVE GRUDGES AGAINST PLAYER:
${grudgeText}

DEBTS OWED TO PLAYER:
${debtText}

CURRENT BEHAVIORAL STATE:
- Greeting style: ${mods.greetingTone}
- Will help player: ${mods.willHelpPlayer ? 'Yes' : 'No'}
- Information sharing: ${mods.sharesInformation}${mods.sharesInformation === 'misleading' ? ' ⚠️ WILL LIE' : ''}
- Trade prices: ${mods.priceModifier > 1 ? `+${Math.round((mods.priceModifier - 1) * 100)}% markup` : mods.priceModifier < 1 ? `${Math.round((1 - mods.priceModifier) * 100)}% discount` : 'normal'}
- Combat stance: ${mods.combatStance}
- Cooperation chance: ${mods.cooperationChance}%
- Betrayal risk: ${mods.betrayalRisk}%

ROLEPLAY INSTRUCTIONS:
${activeGrudges.length > 0 ? `${npcName} holds resentment. Their behavior reflects unresolved grievances - cold demeanor, reluctance to help, possible hostility.` : ''}
${activeDebts.length > 0 ? `${npcName} feels indebted. They are more willing to help, offer discounts, share information, or go out of their way for the player.` : ''}
${mods.sharesInformation === 'misleading' ? `${npcName} may actively provide false or misleading information to harm the player.` : ''}
`;
}

// Build context for multiple NPCs in scene
export function buildSceneNPCContext(npcs: NPCGrudgeContext[]): string {
  if (npcs.length === 0) return '';
  
  let context = '\n=== NPCS IN SCENE - PSYCHOLOGICAL STATE ===\n';
  
  for (const npc of npcs.slice(0, 4)) { // Limit to 4 NPCs to not overwhelm prompt
    context += buildNPCGrudgeContext(npc.npcId, npc);
  }
  
  return context;
}
