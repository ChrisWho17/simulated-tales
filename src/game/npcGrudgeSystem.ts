// NPC Grudge & Debt System - Tracks grudges, debts, and behavioral modifiers
// Based on the Grudges and Memory Overhaul specification

// Utility function
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============= RELATIONSHIP METRICS =============

export interface NPCRelationshipMetrics {
  trust: number;        // -100 to 100
  respect: number;      // -100 to 100
  fear: number;         // 0 to 100
  affection: number;    // -100 to 100
  familiarity: number;  // 0 to 100 (how well they know player)
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

// ============= GRUDGE SYSTEM =============

export interface Grudge {
  id: string;
  reason: string;          // What caused the grudge
  event: string;           // Original event type
  intensity: number;       // 1-10 severity
  created: number;         // Turn/tick when created
  resolved: boolean;
  resolutionPath: string;  // How to resolve (e.g., 'sincere_apology_and_gift')
  decayRate: number;       // How fast intensity fades (0 = permanent)
}

// Events that can create grudges
export const GRUDGE_EVENTS = [
  'attacked', 'insulted', 'stole', 'betrayed', 'humiliated',
  'threatened_family', 'killed_friend', 'destroyed_property',
  'lied', 'cheated', 'abandoned', 'disrespected', 'mocked',
  'broke_promise', 'exposed_secret', 'sabotaged'
] as const;

export type GrudgeEvent = typeof GRUDGE_EVENTS[number];

// Resolution paths for grudges
const RESOLUTION_PATHS: Record<string, string> = {
  insulted: 'sincere_apology',
  attacked: 'sincere_apology_and_compensation',
  stole: 'return_item_and_compensation',
  betrayed: 'prove_loyalty_over_time',
  humiliated: 'public_apology',
  threatened_family: 'protect_family_or_major_gift',
  killed_friend: 'nearly_impossible', // Some grudges are very hard to resolve
  destroyed_property: 'full_compensation',
  lied: 'admit_truth_and_apology',
  cheated: 'compensation_and_apology',
  abandoned: 'prove_reliability',
  disrespected: 'show_respect',
  mocked: 'sincere_apology',
  broke_promise: 'fulfill_promise_and_more',
  exposed_secret: 'extremely_difficult',
  sabotaged: 'compensation_and_apology',
};

export function createGrudge(
  reason: string,
  event: string,
  intensity: number,
  currentTick: number
): Grudge {
  const baseEvent = GRUDGE_EVENTS.find(e => event.toLowerCase().includes(e)) || 'disrespected';
  
  return {
    id: `grudge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    reason,
    event,
    intensity: clamp(intensity, 1, 10),
    created: currentTick,
    resolved: false,
    resolutionPath: RESOLUTION_PATHS[baseEvent] || 'sincere_apology',
    decayRate: intensity >= 8 ? 0 : 0.01, // High intensity grudges don't decay
  };
}

// ============= DEBT SYSTEM =============

export interface Debt {
  id: string;
  type: 'life_debt' | 'favor' | 'gratitude' | 'obligation';
  reason: string;
  intensity: number;      // 1-10
  created: number;
  willingness: 'anything' | 'significant_help' | 'favor' | 'small_favor';
  fulfilled: boolean;
  fulfilledWith?: string;
}

// Events that create debts
export const DEBT_EVENTS = [
  'saved_life', 'saved_family', 'major_gift', 'cleared_debt',
  'protected', 'healed', 'rescued', 'helped_achieve_goal',
  'defended_honor', 'gave_shelter', 'shared_secret', 'trusted_completely'
] as const;

export type DebtEvent = typeof DEBT_EVENTS[number];

export function createDebt(
  reason: string,
  event: string,
  intensity: number,
  currentTick: number
): Debt {
  const isLifeDebt = event.includes('saved_life') || event.includes('saved_family') || intensity >= 9;
  
  let willingness: Debt['willingness'] = 'small_favor';
  if (intensity >= 9) willingness = 'anything';
  else if (intensity >= 7) willingness = 'significant_help';
  else if (intensity >= 5) willingness = 'favor';
  
  return {
    id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: isLifeDebt ? 'life_debt' : intensity >= 7 ? 'gratitude' : 'favor',
    reason,
    intensity: clamp(intensity, 1, 10),
    created: currentTick,
    willingness,
    fulfilled: false,
  };
}

// ============= BEHAVIOR MODIFIERS =============

export interface BehaviorModifiers {
  willHelpPlayer: boolean;
  willingToTrade: boolean;
  sharesInformation: 'none' | 'partial' | 'full';
  greetingTone: 'hostile' | 'cold' | 'neutral' | 'warm' | 'enthusiastic';
  priceModifier: number;  // 0.7 = 30% discount, 1.5 = 50% markup
  combatStance: 'enemy' | 'hostile' | 'neutral' | 'friendly' | 'ally' | 'submissive';
}

export function calculateBehaviorModifiers(
  rel: NPCRelationshipMetrics,
  grudges: Grudge[],
  debts: Debt[]
): BehaviorModifiers {
  const activeGrudge = grudges.some(g => !g.resolved && g.intensity > 3);
  const hasDebt = debts.some(d => !d.fulfilled && d.intensity >= 5);
  
  // Greeting tone
  let greetingTone: BehaviorModifiers['greetingTone'] = 'neutral';
  if (activeGrudge && grudges.some(g => !g.resolved && g.intensity >= 7)) {
    greetingTone = 'hostile';
  } else if (rel.affection < -50 || activeGrudge) {
    greetingTone = 'cold';
  } else if (rel.affection < -20) {
    greetingTone = 'cold';
  } else if (rel.affection < 20) {
    greetingTone = 'neutral';
  } else if (rel.affection < 60) {
    greetingTone = 'warm';
  } else {
    greetingTone = 'enthusiastic';
  }
  
  // Price modifier
  let priceModifier = 1.0;
  if (hasDebt) priceModifier = 0.7;
  else if (rel.trust < -50) priceModifier = 1.5;
  else if (rel.trust < 0) priceModifier = 1.2;
  else if (rel.trust > 50) priceModifier = 0.85;
  
  // Combat stance
  let combatStance: BehaviorModifiers['combatStance'] = 'neutral';
  if (rel.fear > 70 && rel.trust < 0) {
    combatStance = 'submissive';
  } else if (activeGrudge && rel.trust < -50) {
    combatStance = 'enemy';
  } else if (rel.trust < -30) {
    combatStance = 'hostile';
  } else if (rel.trust < 30) {
    combatStance = 'neutral';
  } else if (rel.trust < 70) {
    combatStance = 'friendly';
  } else {
    combatStance = 'ally';
  }
  
  // Information sharing
  let sharesInformation: BehaviorModifiers['sharesInformation'] = 'partial';
  if (rel.trust < -20 || activeGrudge) {
    sharesInformation = 'none';
  } else if (rel.trust >= 30 && rel.familiarity >= 40) {
    sharesInformation = 'full';
  }
  
  return {
    willHelpPlayer: rel.trust > -30 && !activeGrudge,
    willingToTrade: rel.trust > -50 && !grudges.some(g => !g.resolved && g.intensity >= 8),
    sharesInformation,
    greetingTone,
    priceModifier,
    combatStance,
  };
}

// ============= RELATIONSHIP UPDATES FROM MEMORY =============

const SENTIMENT_IMPACTS = {
  positive: { trust: 5, respect: 3, affection: 4, fear: -2 },
  negative: { trust: -8, respect: -3, affection: -5, fear: 3 },
  traumatic: { trust: -15, respect: -5, affection: -10, fear: 10 },
  neutral: { trust: 0, respect: 0, affection: 0, fear: 0 },
} as const;

export function updateRelationshipFromEvent(
  rel: NPCRelationshipMetrics,
  sentiment: 'positive' | 'negative' | 'traumatic' | 'neutral',
  intensity: number
): NPCRelationshipMetrics {
  const multiplier = intensity / 5; // Scale impact by intensity
  const impact = SENTIMENT_IMPACTS[sentiment] || SENTIMENT_IMPACTS.neutral;
  
  return {
    trust: clamp(rel.trust + (impact.trust * multiplier), -100, 100),
    respect: clamp(rel.respect + (impact.respect * multiplier), -100, 100),
    affection: clamp(rel.affection + (impact.affection * multiplier), -100, 100),
    fear: clamp(rel.fear + (impact.fear * multiplier), 0, 100),
    // Always increase familiarity with interaction
    familiarity: clamp(rel.familiarity + 2, 0, 100),
  };
}

// ============= GRUDGE/DEBT EVALUATION =============

export function evaluateForGrudge(
  event: string,
  sentiment: 'positive' | 'negative' | 'traumatic' | 'neutral',
  intensity: number,
  currentTick: number
): Grudge | null {
  if (sentiment !== 'negative' && sentiment !== 'traumatic') return null;
  if (intensity < 6) return null;
  
  const isGrudgeWorthy = GRUDGE_EVENTS.some(e => event.toLowerCase().includes(e));
  if (!isGrudgeWorthy) return null;
  
  return createGrudge(event, event, intensity, currentTick);
}

export function evaluateForDebt(
  event: string,
  sentiment: 'positive' | 'negative' | 'traumatic' | 'neutral',
  intensity: number,
  currentTick: number
): Debt | null {
  if (sentiment !== 'positive') return null;
  if (intensity < 7) return null;
  
  const isDebtWorthy = DEBT_EVENTS.some(e => event.toLowerCase().includes(e));
  if (!isDebtWorthy) return null;
  
  return createDebt(event, event, intensity, currentTick);
}

// ============= GRUDGE DECAY =============

export function processGrudgeDecay(grudges: Grudge[], hoursElapsed: number = 1): Grudge[] {
  return grudges.map(grudge => {
    if (grudge.resolved || grudge.decayRate === 0) return grudge;
    
    const newIntensity = grudge.intensity - (grudge.decayRate * hoursElapsed);
    
    // Grudge fades away if intensity drops below 1
    if (newIntensity < 1) {
      return { ...grudge, resolved: true, intensity: 0 };
    }
    
    return { ...grudge, intensity: newIntensity };
  }).filter(g => !g.resolved || g.intensity > 0);
}

// ============= AI PROMPT CONTEXT =============

export interface NPCGrudgeContext {
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
  
  // Format active grudges
  const activeGrudges = ctx.grudges.filter(g => !g.resolved);
  const grudgeText = activeGrudges.length > 0
    ? activeGrudges.map(g => `- ${g.reason} (intensity: ${g.intensity}/10, can resolve via: ${g.resolutionPath})`).join('\n')
    : 'None';
  
  // Format debts
  const activeDebts = ctx.debts.filter(d => !d.fulfilled);
  const debtText = activeDebts.length > 0
    ? activeDebts.map(d => `- ${d.type}: ${d.reason} (willing to: ${d.willingness})`).join('\n')
    : 'None';
  
  return `
=== NPC RELATIONSHIP: ${npcName} ===
FEELINGS TOWARD PLAYER:
- Trust: ${rel.trust}/100
- Respect: ${rel.respect}/100
- Fear: ${rel.fear}/100
- Affection: ${rel.affection}/100
- Familiarity: ${rel.familiarity}/100

ACTIVE GRUDGES:
${grudgeText}

DEBTS OWED TO PLAYER:
${debtText}

CURRENT DISPOSITION:
- Greeting: ${mods.greetingTone}
- Will help: ${mods.willHelpPlayer}
- Shares info: ${mods.sharesInformation}
- Price modifier: ${mods.priceModifier > 1 ? '+' : ''}${Math.round((mods.priceModifier - 1) * 100)}%
- Combat stance: ${mods.combatStance}

${npcName} should act according to these feelings. Grudges make them cold, refuse help, or hostile. Debts make them more helpful and willing to go out of their way.
`;
}
