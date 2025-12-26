// Ripple Effect System - Actions cascade through the world over time
// Based on the Grudges and Memory Overhaul specification

// ============= RIPPLE TYPES =============

export type RippleEffectType = 
  | 'immediate' 
  | 'awareness' 
  | 'social' 
  | 'economic' 
  | 'authority' 
  | 'political' 
  | 'world';

export type RippleSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';

export interface RipplePhase {
  phase: number;
  delay: number;           // Turns after trigger
  type: RippleEffectType;
  target: string;          // Who/what is affected
  effect: string;          // What happens
  magnitude: number;       // 1-100 intensity
  triggered: boolean;
  scheduledTurn?: number;
  description?: string;
}

export interface ActiveRipple {
  id: string;
  triggerEvent: string;
  triggerTurn: number;
  source: {
    type: 'player_action' | 'npc_action' | 'world_event';
    location: string;
    actor?: string;
  };
  effects: RipplePhase[];
  interruptible: boolean;
  interruptConditions?: string[];
  expired: boolean;
}

// ============= RIPPLE TEMPLATES =============

interface RippleTemplate {
  phases: Omit<RipplePhase, 'triggered' | 'scheduledTurn'>[];
  interruptible: boolean;
}

// Theft templates
const THEFT_TEMPLATES: Record<string, RippleTemplate> = {
  small: {
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'victim', effect: 'alert', magnitude: 10 },
      { phase: 2, delay: 3, type: 'social', target: 'local_npcs', effect: 'wariness', magnitude: 5, description: 'Locals become more watchful of strangers' },
    ],
    interruptible: true,
  },
  large: {
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'victim', effect: 'alert', magnitude: 30 },
      { phase: 2, delay: 2, type: 'authority', target: 'guards', effect: 'investigation', magnitude: 20, description: 'Guards begin asking questions about the theft' },
      { phase: 3, delay: 5, type: 'economic', target: 'local_merchants', effect: 'price_increase', magnitude: 15, description: 'Merchants raise prices citing security concerns' },
      { phase: 4, delay: 10, type: 'social', target: 'district', effect: 'distrust_strangers', magnitude: 20, description: 'Locals eye outsiders with suspicion' },
      { phase: 5, delay: 20, type: 'political', target: 'city', effect: 'new_security_measures', magnitude: 10, description: 'New patrols and checkpoints appear' },
    ],
    interruptible: true,
  },
};

// Violence templates
const VIOLENCE_TEMPLATES: Record<string, RippleTemplate> = {
  minor: {
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'witnesses', effect: 'shock', magnitude: 20 },
      { phase: 2, delay: 1, type: 'social', target: 'local_npcs', effect: 'wariness', magnitude: 15, description: 'People give you a wide berth' },
    ],
    interruptible: true,
  },
  major: {
    phases: [
      { phase: 1, delay: 0, type: 'awareness', target: 'witnesses', effect: 'panic', magnitude: 40 },
      { phase: 2, delay: 0, type: 'authority', target: 'guards', effect: 'manhunt', magnitude: 50, description: 'Guards actively search for the attacker' },
      { phase: 3, delay: 3, type: 'social', target: 'victim_faction', effect: 'vendetta', magnitude: 60, description: 'The victim\'s allies seek revenge' },
      { phase: 4, delay: 7, type: 'political', target: 'ruling_power', effect: 'bounty', magnitude: 30, description: 'A bounty is placed on the attacker' },
      { phase: 5, delay: 15, type: 'world', target: 'region', effect: 'reputation_spreads', magnitude: 25, description: 'Word of violence spreads to neighboring areas' },
    ],
    interruptible: false,
  },
  murder: {
    phases: [
      { phase: 1, delay: 0, type: 'immediate', target: 'witnesses', effect: 'trauma', magnitude: 80 },
      { phase: 2, delay: 0, type: 'authority', target: 'all_guards', effect: 'active_manhunt', magnitude: 90, description: 'All guards are on high alert' },
      { phase: 3, delay: 1, type: 'social', target: 'victim_family', effect: 'blood_vendetta', magnitude: 100, description: 'The victim\'s family swears vengeance' },
      { phase: 4, delay: 5, type: 'political', target: 'city', effect: 'martial_law', magnitude: 40, description: 'The city tightens security significantly' },
      { phase: 5, delay: 10, type: 'world', target: 'neighboring_regions', effect: 'wanted_posters', magnitude: 50, description: 'Your description appears on wanted posters' },
    ],
    interruptible: false,
  },
};

// Heroic templates
const HEROIC_TEMPLATES: Record<string, RippleTemplate> = {
  minor: {
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'witnesses', effect: 'gratitude', magnitude: 15 },
      { phase: 2, delay: 5, type: 'social', target: 'local_npcs', effect: 'positive_rumors', magnitude: 10, description: 'People speak well of you' },
    ],
    interruptible: false,
  },
  major: {
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'saved_parties', effect: 'life_debt', magnitude: 50 },
      { phase: 2, delay: 3, type: 'social', target: 'district', effect: 'hero_reputation', magnitude: 30, description: 'You\'re recognized as a local hero' },
      { phase: 3, delay: 10, type: 'political', target: 'faction', effect: 'favor', magnitude: 25, description: 'Important people take notice of your deeds' },
      { phase: 4, delay: 20, type: 'world', target: 'region', effect: 'legend_grows', magnitude: 20, description: 'Tales of your heroism spread far' },
    ],
    interruptible: false,
  },
};

// Economic templates
const ECONOMIC_TEMPLATES: Record<string, RippleTemplate> = {
  market_manipulation: {
    phases: [
      { phase: 1, delay: 0, type: 'economic', target: 'specific_good', effect: 'price_change', magnitude: 30 },
      { phase: 2, delay: 5, type: 'social', target: 'affected_merchants', effect: 'suspicion', magnitude: 20, description: 'Merchants grow suspicious of market changes' },
      { phase: 3, delay: 10, type: 'economic', target: 'market', effect: 'instability', magnitude: 25, description: 'Market prices fluctuate unpredictably' },
    ],
    interruptible: true,
  },
  generous_donation: {
    phases: [
      { phase: 1, delay: 0, type: 'social', target: 'recipient', effect: 'gratitude', magnitude: 30 },
      { phase: 2, delay: 3, type: 'social', target: 'local_npcs', effect: 'admiration', magnitude: 15, description: 'Word of your generosity spreads' },
    ],
    interruptible: false,
  },
};

// ============= RIPPLE CREATION =============

export type ActionCategory = 'theft' | 'violence' | 'heroic' | 'economic';

const TEMPLATE_MAPS: Record<ActionCategory, Record<string, RippleTemplate>> = {
  theft: THEFT_TEMPLATES,
  violence: VIOLENCE_TEMPLATES,
  heroic: HEROIC_TEMPLATES,
  economic: ECONOMIC_TEMPLATES,
};

export function createRipple(
  triggerEvent: string,
  category: ActionCategory,
  severity: RippleSeverity,
  location: string,
  currentTurn: number,
  actor?: string
): ActiveRipple | null {
  // Map severity to template key
  const severityMap: Record<RippleSeverity, string> = {
    minor: 'minor',
    moderate: 'small',
    major: 'major',
    catastrophic: 'murder',
  };
  
  const templateKey = severityMap[severity] || 'minor';
  const templates = TEMPLATE_MAPS[category];
  const template = templates?.[templateKey] || templates?.minor;
  
  if (!template) {
    console.warn(`No ripple template for ${category}/${severity}`);
    return null;
  }
  
  const ripple: ActiveRipple = {
    id: `ripple_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    triggerEvent,
    triggerTurn: currentTurn,
    source: {
      type: actor ? 'player_action' : 'world_event',
      location,
      actor,
    },
    effects: template.phases.map(phase => ({
      ...phase,
      triggered: false,
      scheduledTurn: currentTurn + phase.delay,
    })),
    interruptible: template.interruptible,
    expired: false,
  };
  
  return ripple;
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
      
      if (effect.description) {
        narrativeQueue.push(effect.description);
      }
      
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

// ============= APPLY RIPPLE EFFECTS =============

export interface WorldStateChanges {
  guardAlertLevel: number;
  priceModifiers: Record<string, number>;
  reputationChanges: Array<{ target: string; change: number }>;
  activeInvestigations: Array<{ type: string; target: string; intensity: number }>;
}

export function applyRippleEffect(
  effect: RipplePhase,
  currentState: WorldStateChanges
): WorldStateChanges {
  const updated = { ...currentState };
  
  switch (effect.type) {
    case 'authority':
      if (effect.effect.includes('manhunt') || effect.effect.includes('investigation')) {
        updated.guardAlertLevel = Math.min(100, (updated.guardAlertLevel || 0) + effect.magnitude);
        updated.activeInvestigations.push({
          type: effect.effect,
          target: 'player',
          intensity: effect.magnitude,
        });
      }
      break;
      
    case 'economic':
      if (effect.effect.includes('price')) {
        updated.priceModifiers[effect.target] = (updated.priceModifiers[effect.target] || 0) + effect.magnitude;
      }
      break;
      
    case 'social':
      if (effect.effect.includes('vendetta') || effect.effect.includes('distrust')) {
        updated.reputationChanges.push({ target: effect.target, change: -effect.magnitude });
      } else if (effect.effect.includes('hero') || effect.effect.includes('gratitude')) {
        updated.reputationChanges.push({ target: effect.target, change: effect.magnitude });
      }
      break;
  }
  
  return updated;
}

// ============= AI PROMPT CONTEXT =============

export function buildConsequenceContext(narrativeQueue: string[]): string {
  if (narrativeQueue.length === 0) return '';
  
  // Take highest priority pending narrative (first one for now)
  const toMention = narrativeQueue[0];
  
  return `
=== CONSEQUENCE TO WEAVE INTO NARRATIVE ===
${toMention}

Naturally incorporate this consequence into your response. Show, don't tell. 
The player should notice the effect of their past actions through the world's reaction.
`;
}

export function buildWorldStateContext(state: Partial<WorldStateChanges>): string {
  let context = '\n=== CURRENT WORLD STATE ===\n';
  
  if ((state.guardAlertLevel || 0) > 30) {
    context += `- Guard alert level: ${state.guardAlertLevel}% (${
      state.guardAlertLevel! > 70 ? 'HIGH - guards actively searching' :
      state.guardAlertLevel! > 50 ? 'ELEVATED - increased patrols' :
      'HEIGHTENED - guards are watchful'
    })\n`;
  }
  
  if (state.activeInvestigations && state.activeInvestigations.length > 0) {
    context += `- Active investigations: ${state.activeInvestigations.length}\n`;
    for (const inv of state.activeInvestigations.slice(0, 2)) {
      context += `  • ${inv.type} (intensity: ${inv.intensity})\n`;
    }
  }
  
  const priceChanges = Object.entries(state.priceModifiers || {}).filter(([, v]) => v !== 0);
  if (priceChanges.length > 0) {
    context += `- Price modifications in effect:\n`;
    for (const [target, mod] of priceChanges.slice(0, 3)) {
      context += `  • ${target}: ${mod > 0 ? '+' : ''}${mod}%\n`;
    }
  }
  
  return context;
}

// ============= DETECT ACTION CATEGORY =============

export function detectActionCategory(action: string): { category: ActionCategory; severity: RippleSeverity } | null {
  const lowerAction = action.toLowerCase();
  
  // Violence detection
  if (/\b(kill|murder|slay|execute|assassinate)\b/.test(lowerAction)) {
    return { category: 'violence', severity: 'catastrophic' };
  }
  if (/\b(attack|fight|beat|punch|stab|slash|wound)\b/.test(lowerAction)) {
    return { category: 'violence', severity: 'major' };
  }
  if (/\b(push|shove|hit|slap)\b/.test(lowerAction)) {
    return { category: 'violence', severity: 'minor' };
  }
  
  // Theft detection
  if (/\b(steal|rob|heist|burgle)\b/.test(lowerAction)) {
    if (/\b(bank|vault|treasury|massive|fortune)\b/.test(lowerAction)) {
      return { category: 'theft', severity: 'catastrophic' };
    }
    return { category: 'theft', severity: 'major' };
  }
  if (/\b(pickpocket|snatch|pilfer|swipe)\b/.test(lowerAction)) {
    return { category: 'theft', severity: 'minor' };
  }
  
  // Heroic detection
  if (/\b(save|rescue|protect|defend)\b/.test(lowerAction)) {
    if (/\b(life|lives|town|village|city|everyone)\b/.test(lowerAction)) {
      return { category: 'heroic', severity: 'major' };
    }
    return { category: 'heroic', severity: 'minor' };
  }
  
  // Economic detection
  if (/\b(donate|gift|charity|give away)\b/.test(lowerAction)) {
    return { category: 'economic', severity: 'minor' };
  }
  if (/\b(corner the market|monopoly|price fixing|manipulate)\b/.test(lowerAction)) {
    return { category: 'economic', severity: 'major' };
  }
  
  return null;
}
