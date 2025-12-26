// Ripple Effect System - Actions cascade through the world over time
// Based on the Grudges and Memory Overhaul specification
// Research-backed timing from social cascade studies and news propagation research

// ============= REALISTIC TIMING CONSTANTS =============
// Based on research on information spread, social consequences, and institutional response times

const RIPPLE_TIMING = {
  // Witness reactions (immediate to minutes)
  IMMEDIATE_REACTION: 0,
  
  // Word of mouth spread (hours)
  LOCAL_GOSSIP_HOURS: 2,
  DISTRICT_AWARENESS_HOURS: 6,
  CITY_AWARENESS_HOURS: 24,
  
  // Institutional responses (hours to days)
  GUARD_RESPONSE_HOURS: 1,        // Guards respond quickly to reports
  INVESTIGATION_START_HOURS: 4,   // Organized investigation begins
  MANHUNT_HOURS: 8,              // Full manhunt for serious crimes
  
  // Social consequences (days)
  REPUTATION_SPREAD_DAYS: 2,      // Reputation changes take time
  FACTION_RESPONSE_DAYS: 3,       // Organizations deliberate
  POLITICAL_RESPONSE_DAYS: 7,     // Political consequences are slow
  
  // Economic effects (days to weeks)
  PRICE_ADJUSTMENT_DAYS: 1,       // Markets react relatively quickly
  ECONOMIC_CASCADE_DAYS: 5,       // Broader economic effects
  
  // Regional spread (weeks)
  REGIONAL_NEWS_DAYS: 14,         // News travels to other regions
  LEGEND_FORMATION_DAYS: 30,      // Stories become legend
};

// ============= RIPPLE TYPES =============

export type RippleEffectType = 
  | 'immediate'      // Happens now
  | 'awareness'      // People learn about it
  | 'social'         // Social consequences
  | 'economic'       // Market/trade effects
  | 'authority'      // Law enforcement/guards
  | 'political'      // Power structure responses
  | 'faction'        // Organized group responses
  | 'regional';      // Spreads beyond local area

export type RippleSeverity = 'trivial' | 'minor' | 'moderate' | 'major' | 'severe' | 'catastrophic';

export interface RipplePhase {
  phase: number;
  delay: number;           // Hours after trigger
  type: RippleEffectType;
  target: string;          // Who/what is affected
  effect: string;          // What happens
  magnitude: number;       // 1-100 intensity
  triggered: boolean;
  scheduledTurn?: number;
  description: string;     // Narrative description
  conditionalOn?: string;  // Only triggers if condition met
}

export interface ActiveRipple {
  id: string;
  triggerEvent: string;
  triggerTurn: number;
  severity: RippleSeverity;
  source: {
    type: 'player_action' | 'npc_action' | 'world_event';
    location: string;
    actor?: string;
    witnesses: number;
  };
  effects: RipplePhase[];
  interruptible: boolean;
  interruptedBy?: string;
  expired: boolean;
}

// ============= RIPPLE TEMPLATES =============
// Realistic consequence chains based on action types

interface RippleTemplate {
  severity: RippleSeverity;
  phases: Omit<RipplePhase, 'triggered' | 'scheduledTurn'>[];
  interruptible: boolean;
  interruptConditions?: string[];
}

// ============= THEFT RIPPLES =============
const THEFT_TEMPLATES: Record<string, RippleTemplate> = {
  pickpocket: {
    severity: 'trivial',
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'victim', effect: 'may_notice', magnitude: 20, description: 'The victim might notice their lighter purse' },
      { phase: 2, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'nearby_npcs', effect: 'slightly_wary', magnitude: 10, description: 'A few people seem more watchful of their belongings' },
    ],
    interruptible: true,
  },
  
  shoplifting: {
    severity: 'minor',
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'merchant', effect: 'suspicious', magnitude: 30, description: 'The merchant eyes you with suspicion' },
      { phase: 2, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'nearby_merchants', effect: 'warned', magnitude: 20, description: 'Word spreads among nearby merchants to watch for thieves' },
      { phase: 3, delay: RIPPLE_TIMING.GUARD_RESPONSE_HOURS * 2, type: 'authority', target: 'guards', effect: 'patrol_increase', magnitude: 15, description: 'Guards make more frequent rounds through the market' },
    ],
    interruptible: true,
    interruptConditions: ['return_item', 'pay_for_item', 'not_discovered'],
  },
  
  burglary: {
    severity: 'moderate',
    phases: [
      { phase: 1, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'awareness', target: 'victim', effect: 'discovers_theft', magnitude: 50, description: 'The victim discovers the burglary' },
      { phase: 2, delay: RIPPLE_TIMING.GUARD_RESPONSE_HOURS, type: 'authority', target: 'guards', effect: 'investigation', magnitude: 40, description: 'Guards begin investigating the break-in' },
      { phase: 3, delay: RIPPLE_TIMING.DISTRICT_AWARENESS_HOURS, type: 'social', target: 'district', effect: 'neighborhood_watch', magnitude: 30, description: 'Neighbors become vigilant, watching for strangers' },
      { phase: 4, delay: RIPPLE_TIMING.PRICE_ADJUSTMENT_DAYS * 24, type: 'economic', target: 'local_merchants', effect: 'security_costs', magnitude: 20, description: 'Local businesses invest in better security' },
    ],
    interruptible: true,
    interruptConditions: ['item_returned', 'criminal_caught'],
  },
  
  major_heist: {
    severity: 'major',
    phases: [
      { phase: 1, delay: 0, type: 'immediate', target: 'witnesses', effect: 'alarm', magnitude: 60, description: 'Alarms are raised immediately' },
      { phase: 2, delay: RIPPLE_TIMING.GUARD_RESPONSE_HOURS, type: 'authority', target: 'all_guards', effect: 'lockdown', magnitude: 70, description: 'The district is locked down as guards search' },
      { phase: 3, delay: RIPPLE_TIMING.CITY_AWARENESS_HOURS, type: 'awareness', target: 'city', effect: 'news_spreads', magnitude: 50, description: 'The entire city buzzes with news of the heist' },
      { phase: 4, delay: RIPPLE_TIMING.FACTION_RESPONSE_DAYS * 24, type: 'faction', target: 'victim_faction', effect: 'bounty', magnitude: 60, description: 'A significant bounty is placed on the thief' },
      { phase: 5, delay: RIPPLE_TIMING.ECONOMIC_CASCADE_DAYS * 24, type: 'economic', target: 'market', effect: 'insurance_costs', magnitude: 40, description: 'Trade costs increase as merchants fear further theft' },
      { phase: 6, delay: RIPPLE_TIMING.REGIONAL_NEWS_DAYS * 24, type: 'regional', target: 'region', effect: 'infamous', magnitude: 35, description: 'Tales of the heist spread to neighboring towns' },
    ],
    interruptible: false,
  },
};

// ============= VIOLENCE RIPPLES =============
const VIOLENCE_TEMPLATES: Record<string, RippleTemplate> = {
  scuffle: {
    severity: 'trivial',
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'witnesses', effect: 'attention', magnitude: 20, description: 'Onlookers pause to watch the altercation' },
      { phase: 2, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'local_npcs', effect: 'gossip', magnitude: 15, description: 'People whisper about the fight they saw' },
    ],
    interruptible: true,
  },
  
  assault: {
    severity: 'moderate',
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'witnesses', effect: 'shock', magnitude: 40, description: 'Witnesses cry out in alarm' },
      { phase: 2, delay: RIPPLE_TIMING.GUARD_RESPONSE_HOURS / 2, type: 'authority', target: 'guards', effect: 'respond', magnitude: 50, description: 'Guards rush to investigate the disturbance' },
      { phase: 3, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'district', effect: 'fear', magnitude: 35, description: 'People in the area become nervous about the violence' },
      { phase: 4, delay: RIPPLE_TIMING.INVESTIGATION_START_HOURS, type: 'authority', target: 'investigators', effect: 'questioning', magnitude: 40, description: 'Guards question witnesses about the attacker' },
    ],
    interruptible: true,
    interruptConditions: ['victim_forgives', 'self_defense_proven'],
  },
  
  killing: {
    severity: 'severe',
    phases: [
      { phase: 1, delay: 0, type: 'immediate', target: 'witnesses', effect: 'trauma', magnitude: 80, description: 'Witnesses scream in horror' },
      { phase: 2, delay: 0, type: 'authority', target: 'guards', effect: 'emergency_response', magnitude: 90, description: 'Guards converge on the scene immediately' },
      { phase: 3, delay: RIPPLE_TIMING.GUARD_RESPONSE_HOURS, type: 'authority', target: 'all_guards', effect: 'manhunt', magnitude: 80, description: 'A city-wide manhunt begins' },
      { phase: 4, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'victim_family', effect: 'grief_and_rage', magnitude: 100, description: 'The victim\'s family is devastated' },
      { phase: 5, delay: RIPPLE_TIMING.FACTION_RESPONSE_DAYS * 24, type: 'faction', target: 'victim_faction', effect: 'vendetta', magnitude: 75, description: 'The victim\'s allies swear vengeance' },
      { phase: 6, delay: RIPPLE_TIMING.POLITICAL_RESPONSE_DAYS * 24, type: 'political', target: 'city', effect: 'crackdown', magnitude: 50, description: 'Authorities increase security measures' },
      { phase: 7, delay: RIPPLE_TIMING.REGIONAL_NEWS_DAYS * 24, type: 'regional', target: 'region', effect: 'wanted', magnitude: 60, description: 'Your description appears on wanted posters' },
    ],
    interruptible: false,
  },
  
  massacre: {
    severity: 'catastrophic',
    phases: [
      { phase: 1, delay: 0, type: 'immediate', target: 'area', effect: 'chaos', magnitude: 100, description: 'Chaos erupts as people flee in terror' },
      { phase: 2, delay: 0, type: 'authority', target: 'all_forces', effect: 'martial_response', magnitude: 100, description: 'Every available guard mobilizes' },
      { phase: 3, delay: RIPPLE_TIMING.GUARD_RESPONSE_HOURS, type: 'authority', target: 'city', effect: 'martial_law', magnitude: 90, description: 'The city goes into lockdown' },
      { phase: 4, delay: RIPPLE_TIMING.CITY_AWARENESS_HOURS, type: 'social', target: 'city', effect: 'mass_panic', magnitude: 85, description: 'The city is gripped by fear' },
      { phase: 5, delay: RIPPLE_TIMING.FACTION_RESPONSE_DAYS * 24, type: 'political', target: 'ruling_power', effect: 'emergency_measures', magnitude: 80, description: 'The ruling power declares a state of emergency' },
      { phase: 6, delay: RIPPLE_TIMING.REGIONAL_NEWS_DAYS * 24 / 2, type: 'regional', target: 'region', effect: 'international_incident', magnitude: 70, description: 'News of the massacre spreads rapidly' },
      { phase: 7, delay: RIPPLE_TIMING.LEGEND_FORMATION_DAYS * 24, type: 'regional', target: 'world', effect: 'infamy', magnitude: 90, description: 'Your name becomes synonymous with horror' },
    ],
    interruptible: false,
  },
};

// ============= HEROIC RIPPLES =============
const HEROIC_TEMPLATES: Record<string, RippleTemplate> = {
  small_help: {
    severity: 'trivial',
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'helped_person', effect: 'gratitude', magnitude: 25, description: 'The person you helped thanks you warmly' },
      { phase: 2, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'local_npcs', effect: 'good_impression', magnitude: 10, description: 'A few people note your kindness' },
    ],
    interruptible: false,
  },
  
  rescue: {
    severity: 'moderate',
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'rescued', effect: 'profound_gratitude', magnitude: 60, description: 'Those you saved express overwhelming gratitude' },
      { phase: 2, delay: RIPPLE_TIMING.DISTRICT_AWARENESS_HOURS, type: 'social', target: 'district', effect: 'hero_talk', magnitude: 40, description: 'People speak of your bravery' },
      { phase: 3, delay: RIPPLE_TIMING.REPUTATION_SPREAD_DAYS * 24, type: 'social', target: 'city', effect: 'growing_reputation', magnitude: 30, description: 'Your name becomes known as a helper' },
    ],
    interruptible: false,
  },
  
  save_many: {
    severity: 'major',
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'saved_parties', effect: 'life_debts', magnitude: 80, description: 'Those you saved owe you their lives' },
      { phase: 2, delay: RIPPLE_TIMING.CITY_AWARENESS_HOURS, type: 'awareness', target: 'city', effect: 'hero_news', magnitude: 60, description: 'Word of your heroism spreads through the city' },
      { phase: 3, delay: RIPPLE_TIMING.FACTION_RESPONSE_DAYS * 24, type: 'political', target: 'authorities', effect: 'recognition', magnitude: 50, description: 'The authorities take notice of your deeds' },
      { phase: 4, delay: RIPPLE_TIMING.REGIONAL_NEWS_DAYS * 24, type: 'regional', target: 'region', effect: 'legend_grows', magnitude: 45, description: 'Tales of your heroism spread to other towns' },
    ],
    interruptible: false,
  },
  
  legendary_deed: {
    severity: 'severe',
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'witnesses', effect: 'awe', magnitude: 90, description: 'Witnesses stand in awe of what you\'ve done' },
      { phase: 2, delay: RIPPLE_TIMING.CITY_AWARENESS_HOURS, type: 'awareness', target: 'city', effect: 'celebration', magnitude: 75, description: 'The city celebrates your achievement' },
      { phase: 3, delay: RIPPLE_TIMING.FACTION_RESPONSE_DAYS * 24, type: 'political', target: 'nobility', effect: 'invitation', magnitude: 60, description: 'Important people wish to meet you' },
      { phase: 4, delay: RIPPLE_TIMING.REGIONAL_NEWS_DAYS * 24, type: 'regional', target: 'region', effect: 'fame', magnitude: 70, description: 'Your name is known throughout the region' },
      { phase: 5, delay: RIPPLE_TIMING.LEGEND_FORMATION_DAYS * 24, type: 'regional', target: 'world', effect: 'legend', magnitude: 80, description: 'Songs and stories are written about your deeds' },
    ],
    interruptible: false,
  },
};

// ============= ECONOMIC RIPPLES =============
const ECONOMIC_TEMPLATES: Record<string, RippleTemplate> = {
  generous_gift: {
    severity: 'minor',
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'recipient', effect: 'grateful', magnitude: 40, description: 'The recipient is touched by your generosity' },
      { phase: 2, delay: RIPPLE_TIMING.LOCAL_GOSSIP_HOURS, type: 'social', target: 'local_npcs', effect: 'admiration', magnitude: 20, description: 'Others hear of your generosity' },
    ],
    interruptible: false,
  },
  
  major_purchase: {
    severity: 'minor',
    phases: [
      { phase: 1, delay: 0, type: 'economic', target: 'merchant', effect: 'pleased', magnitude: 30, description: 'The merchant is delighted with the large sale' },
      { phase: 2, delay: RIPPLE_TIMING.PRICE_ADJUSTMENT_DAYS * 24, type: 'economic', target: 'similar_goods', effect: 'price_increase', magnitude: 15, description: 'Prices for similar items rise slightly' },
    ],
    interruptible: false,
  },
  
  market_disruption: {
    severity: 'moderate',
    phases: [
      { phase: 1, delay: RIPPLE_TIMING.PRICE_ADJUSTMENT_DAYS * 24, type: 'economic', target: 'market', effect: 'volatility', magnitude: 45, description: 'Market prices become unstable' },
      { phase: 2, delay: RIPPLE_TIMING.ECONOMIC_CASCADE_DAYS * 24, type: 'economic', target: 'merchants', effect: 'adaptation', magnitude: 35, description: 'Merchants adjust their strategies' },
      { phase: 3, delay: RIPPLE_TIMING.FACTION_RESPONSE_DAYS * 24, type: 'faction', target: 'merchant_guild', effect: 'investigation', magnitude: 40, description: 'The merchant guild looks into the disruption' },
    ],
    interruptible: true,
    interruptConditions: ['market_stabilizes'],
  },
};

// ============= TEMPLATE MAPS =============

export type ActionCategory = 'theft' | 'violence' | 'heroic' | 'economic' | 'social' | 'political';

const TEMPLATE_MAPS: Record<ActionCategory, Record<string, RippleTemplate>> = {
  theft: THEFT_TEMPLATES,
  violence: VIOLENCE_TEMPLATES,
  heroic: HEROIC_TEMPLATES,
  economic: ECONOMIC_TEMPLATES,
  social: {}, // Custom handling
  political: {}, // Custom handling
};

// ============= RIPPLE CREATION =============

export function createRipple(
  triggerEvent: string,
  category: ActionCategory,
  templateKey: string,
  location: string,
  currentTurn: number,
  actor?: string,
  witnesses: number = 1
): ActiveRipple | null {
  const templates = TEMPLATE_MAPS[category];
  const template = templates?.[templateKey];
  
  if (!template) {
    console.warn(`No ripple template for ${category}/${templateKey}`);
    return null;
  }
  
  // Scale effects based on witnesses
  const witnessMultiplier = Math.min(1 + Math.log10(witnesses + 1) * 0.5, 2);
  
  const ripple: ActiveRipple = {
    id: `ripple_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    triggerEvent,
    triggerTurn: currentTurn,
    severity: template.severity,
    source: {
      type: actor ? 'player_action' : 'world_event',
      location,
      actor,
      witnesses,
    },
    effects: template.phases.map(phase => ({
      ...phase,
      magnitude: Math.round(phase.magnitude * witnessMultiplier),
      triggered: false,
      scheduledTurn: currentTurn + phase.delay,
    })),
    interruptible: template.interruptible,
    expired: false,
  };
  
  return ripple;
}

// ============= DETECT ACTION CATEGORY AND TEMPLATE =============

interface ActionDetection {
  category: ActionCategory;
  templateKey: string;
  witnesses: number;
}

export function detectActionCategory(action: string, context: { isPublic?: boolean; crowdSize?: number } = {}): ActionDetection | null {
  const lowerAction = action.toLowerCase();
  const witnesses = context.isPublic ? (context.crowdSize || 10) : 1;
  
  // Violence detection (most serious first)
  if (/\b(massacre|slaughter|rampage)\b/.test(lowerAction)) {
    return { category: 'violence', templateKey: 'massacre', witnesses: witnesses * 10 };
  }
  if (/\b(kill|murder|slay|execute|assassinate)\b/.test(lowerAction)) {
    return { category: 'violence', templateKey: 'killing', witnesses };
  }
  if (/\b(attack|fight|beat|stab|slash|wound|injure)\b/.test(lowerAction)) {
    return { category: 'violence', templateKey: 'assault', witnesses };
  }
  if (/\b(push|shove|hit|slap|punch)\b/.test(lowerAction)) {
    return { category: 'violence', templateKey: 'scuffle', witnesses };
  }
  
  // Theft detection
  if (/\b(heist|rob the bank|steal everything|vault)\b/.test(lowerAction)) {
    return { category: 'theft', templateKey: 'major_heist', witnesses };
  }
  if (/\b(break in|burgle|burglar|rob house|rob home)\b/.test(lowerAction)) {
    return { category: 'theft', templateKey: 'burglary', witnesses };
  }
  if (/\b(steal|take|swipe|grab)\b/.test(lowerAction) && /\b(shop|store|merchant)\b/.test(lowerAction)) {
    return { category: 'theft', templateKey: 'shoplifting', witnesses };
  }
  if (/\b(pickpocket|lift|snatch purse)\b/.test(lowerAction)) {
    return { category: 'theft', templateKey: 'pickpocket', witnesses };
  }
  
  // Heroic detection
  if (/\b(save the|rescue everyone|protect the city|legendary|defeat the)\b/.test(lowerAction)) {
    return { category: 'heroic', templateKey: 'legendary_deed', witnesses: witnesses * 5 };
  }
  if (/\b(save|rescue|protect)\b/.test(lowerAction) && /\b(people|everyone|villagers|citizens)\b/.test(lowerAction)) {
    return { category: 'heroic', templateKey: 'save_many', witnesses: witnesses * 2 };
  }
  if (/\b(save|rescue|protect|defend)\b/.test(lowerAction)) {
    return { category: 'heroic', templateKey: 'rescue', witnesses };
  }
  if (/\b(help|assist|aid)\b/.test(lowerAction)) {
    return { category: 'heroic', templateKey: 'small_help', witnesses };
  }
  
  // Economic detection
  if (/\b(corner the market|monopoly|manipulate prices)\b/.test(lowerAction)) {
    return { category: 'economic', templateKey: 'market_disruption', witnesses };
  }
  if (/\b(buy|purchase)\b/.test(lowerAction) && /\b(everything|all|massive|huge)\b/.test(lowerAction)) {
    return { category: 'economic', templateKey: 'major_purchase', witnesses };
  }
  if (/\b(give|donate|gift)\b/.test(lowerAction)) {
    return { category: 'economic', templateKey: 'generous_gift', witnesses };
  }
  
  return null;
}

// ============= RIPPLE PROCESSING =============

export interface RippleProcessResult {
  updatedRipples: ActiveRipple[];
  triggeredEffects: RipplePhase[];
  narrativeQueue: string[];
}

export function processRipples(
  ripples: ActiveRipple[],
  currentTurn: number
): RippleProcessResult {
  const triggeredEffects: RipplePhase[] = [];
  const narrativeQueue: string[] = [];
  
  const updatedRipples = ripples.map(ripple => {
    if (ripple.expired) return ripple;
    
    const updatedEffects = ripple.effects.map(effect => {
      if (effect.triggered) return effect;
      if ((effect.scheduledTurn ?? 0) > currentTurn) return effect;
      
      // Trigger this effect
      triggeredEffects.push(effect);
      narrativeQueue.push(effect.description);
      
      return { ...effect, triggered: true };
    });
    
    // Check if ripple is complete
    const allTriggered = updatedEffects.every(e => e.triggered);
    
    return {
      ...ripple,
      effects: updatedEffects,
      expired: allTriggered,
    };
  });
  
  return {
    updatedRipples: updatedRipples.filter(r => !r.expired),
    triggeredEffects,
    narrativeQueue,
  };
}

// ============= WORLD STATE CHANGES =============

export interface WorldStateChanges {
  guardAlertLevel: number;
  priceModifiers: Record<string, number>;
  reputationChanges: Array<{ target: string; change: number }>;
  activeInvestigations: Array<{ type: string; target: string; intensity: number; hoursRemaining: number }>;
  activeManhunts: Array<{ target: string; intensity: number }>;
  publicMood: 'peaceful' | 'uneasy' | 'fearful' | 'panicked';
  securityLevel: 'normal' | 'elevated' | 'high' | 'lockdown';
}

export function createDefaultWorldState(): WorldStateChanges {
  return {
    guardAlertLevel: 0,
    priceModifiers: {},
    reputationChanges: [],
    activeInvestigations: [],
    activeManhunts: [],
    publicMood: 'peaceful',
    securityLevel: 'normal',
  };
}

export function applyRippleEffect(
  effect: RipplePhase,
  currentState: WorldStateChanges
): WorldStateChanges {
  const updated = { ...currentState };
  
  switch (effect.type) {
    case 'authority':
      if (effect.effect.includes('manhunt')) {
        updated.guardAlertLevel = Math.min(100, updated.guardAlertLevel + effect.magnitude);
        updated.activeManhunts.push({ target: 'player', intensity: effect.magnitude });
        updated.securityLevel = effect.magnitude > 70 ? 'lockdown' : 'high';
      } else if (effect.effect.includes('investigation')) {
        updated.guardAlertLevel = Math.min(100, updated.guardAlertLevel + effect.magnitude * 0.5);
        updated.activeInvestigations.push({
          type: effect.effect,
          target: 'player',
          intensity: effect.magnitude,
          hoursRemaining: 72,
        });
      } else if (effect.effect.includes('patrol') || effect.effect.includes('respond')) {
        updated.guardAlertLevel = Math.min(100, updated.guardAlertLevel + effect.magnitude * 0.3);
        if (updated.securityLevel === 'normal') updated.securityLevel = 'elevated';
      }
      break;
      
    case 'economic':
      updated.priceModifiers[effect.target] = (updated.priceModifiers[effect.target] || 0) + effect.magnitude * 0.5;
      break;
      
    case 'social':
      if (effect.effect.includes('panic') || effect.effect.includes('fear')) {
        updated.publicMood = effect.magnitude > 60 ? 'panicked' : 'fearful';
      } else if (effect.effect.includes('uneasy') || effect.effect.includes('nervous')) {
        if (updated.publicMood === 'peaceful') updated.publicMood = 'uneasy';
      }
      
      // Reputation changes
      if (effect.effect.includes('hero') || effect.effect.includes('gratitude')) {
        updated.reputationChanges.push({ target: effect.target, change: effect.magnitude });
      } else if (effect.effect.includes('fear') || effect.effect.includes('distrust')) {
        updated.reputationChanges.push({ target: effect.target, change: -effect.magnitude });
      }
      break;
      
    case 'political':
      if (effect.effect.includes('martial_law') || effect.effect.includes('lockdown')) {
        updated.securityLevel = 'lockdown';
        updated.guardAlertLevel = 100;
      }
      break;
  }
  
  return updated;
}

// ============= AI PROMPT CONTEXT =============

export function buildConsequenceContext(narrativeQueue: string[]): string {
  if (narrativeQueue.length === 0) return '';
  
  let context = '\n=== RIPPLE EFFECTS TO WEAVE INTO NARRATIVE ===\n';
  context += 'These consequences of past actions should be naturally incorporated:\n\n';
  
  for (const effect of narrativeQueue.slice(0, 3)) {
    context += `• ${effect}\n`;
  }
  
  context += `
INSTRUCTIONS:
- Show these effects through environmental details and NPC behavior
- Don't announce consequences directly - let the player notice them
- Effects should feel like natural world reactions, not punishments
`;
  
  return context;
}

export function buildWorldStateContext(state: WorldStateChanges): string {
  let context = '\n=== CURRENT WORLD STATE ===\n';
  
  // Security level
  if (state.securityLevel !== 'normal') {
    const securityDescriptions = {
      elevated: 'Guards are more visible and watchful than usual',
      high: 'Security is tight - guards question strangers and patrol frequently',
      lockdown: 'The area is in lockdown - movement is restricted, guards are everywhere',
    };
    context += `SECURITY: ${state.securityLevel.toUpperCase()} - ${securityDescriptions[state.securityLevel]}\n`;
  }
  
  // Guard alert
  if (state.guardAlertLevel > 20) {
    const alertLevel = state.guardAlertLevel > 70 ? 'CRITICAL' :
                       state.guardAlertLevel > 40 ? 'HIGH' : 'ELEVATED';
    context += `GUARD ALERT: ${alertLevel} (${state.guardAlertLevel}%)\n`;
  }
  
  // Public mood
  if (state.publicMood !== 'peaceful') {
    const moodDescriptions = {
      uneasy: 'People seem on edge, conversations are hushed',
      fearful: 'Fear is palpable - people hurry home, shops close early',
      panicked: 'Panic grips the populace - few venture outside',
    };
    context += `PUBLIC MOOD: ${state.publicMood} - ${moodDescriptions[state.publicMood]}\n`;
  }
  
  // Active manhunts
  if (state.activeManhunts.length > 0) {
    context += `ACTIVE MANHUNTS: ${state.activeManhunts.length} - Guards actively searching\n`;
  }
  
  // Investigations
  if (state.activeInvestigations.length > 0) {
    context += `INVESTIGATIONS: ${state.activeInvestigations.length} ongoing\n`;
  }
  
  // Price effects
  const priceEffects = Object.entries(state.priceModifiers).filter(([, v]) => Math.abs(v) > 5);
  if (priceEffects.length > 0) {
    context += 'MARKET CONDITIONS:\n';
    for (const [target, mod] of priceEffects.slice(0, 3)) {
      const direction = mod > 0 ? 'increased' : 'decreased';
      context += `  • ${target} prices ${direction} by ~${Math.abs(Math.round(mod))}%\n`;
    }
  }
  
  return context;
}

// Export timing constants for external use
export { RIPPLE_TIMING };
