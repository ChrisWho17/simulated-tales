// Needs System - Sims-style physical and psychological needs with decay and effects
// Phase 9.1

import {
  PhysicalNeeds,
  PsychologicalNeeds,
  PlayerNeeds,
  NeedLevel,
  NeedEffect,
  createDefaultPlayerNeeds,
} from '@/types/lifeSim';

// ============= NEED DECAY RATES =============
// These are per-hour rates

export const NEED_DECAY_RATES = {
  // Physical needs
  hunger: 5,          // drops ~5/hour
  thirst: 8,          // drops ~8/hour (faster than hunger)
  energy: 3,          // drops ~3/hour (more with activity)
  bladder: -6,        // fills ~6/hour (inverted - higher = more urgent)
  hygiene: 1,         // drops ~1/hour (faster with activity)
  health: 0,          // doesn't decay naturally, only from events
  
  // Psychological needs
  stress: -2,         // slowly recovers (inverted - negative = recovery)
  tension: 2,         // slowly builds
  comfort: 1,         // slowly drops
  social: 2,          // drops in isolation
  fulfillment: 1,     // drops over time
};

// ============= NEED LEVEL THRESHOLDS =============

export function getNeedLevel(value: number, inverted: boolean = false): NeedLevel {
  const effectiveValue = inverted ? 100 - value : value;
  
  if (effectiveValue <= 20) return 'critical';
  if (effectiveValue <= 40) return 'low';
  if (effectiveValue <= 60) return 'moderate';
  if (effectiveValue <= 80) return 'good';
  return 'excellent';
}

export function getNeedLevelForBladder(value: number): NeedLevel {
  // Bladder is inverted - higher = more urgent
  if (value >= 90) return 'critical';
  if (value >= 70) return 'low';
  if (value >= 50) return 'moderate';
  if (value >= 30) return 'good';
  return 'excellent';
}

export function getNeedLevelForStress(value: number): NeedLevel {
  // Stress is inverted - higher = worse
  if (value >= 80) return 'critical';
  if (value >= 60) return 'low';
  if (value >= 40) return 'moderate';
  if (value >= 20) return 'good';
  return 'excellent';
}

// ============= NEED EFFECTS =============

export const NEED_EFFECTS: NeedEffect[] = [
  // Physical effects
  { need: 'hunger', threshold: 20, effect: 'reduced_energy_recovery', modifier: -50 },
  { need: 'hunger', threshold: 20, effect: 'irritability', modifier: 10 },
  { need: 'hunger', threshold: 10, effect: 'health_damage', modifier: -2 },
  
  { need: 'thirst', threshold: 20, effect: 'reduced_energy_recovery', modifier: -30 },
  { need: 'thirst', threshold: 10, effect: 'health_damage', modifier: -3 },
  { need: 'thirst', threshold: 30, effect: 'concentration_penalty', modifier: -20 },
  
  { need: 'energy', threshold: 20, effect: 'limited_actions', modifier: -50 },
  { need: 'energy', threshold: 20, effect: 'worse_outcomes', modifier: -30 },
  { need: 'energy', threshold: 10, effect: 'vulnerability', modifier: 30 },
  
  { need: 'hygiene', threshold: 30, effect: 'npc_reaction_penalty', modifier: -20 },
  { need: 'hygiene', threshold: 20, effect: 'confidence_penalty', modifier: -30 },
  { need: 'hygiene', threshold: 10, effect: 'social_rejection', modifier: -50 },
  
  { need: 'health', threshold: 30, effect: 'energy_cap', modifier: -30 },
  { need: 'health', threshold: 20, effect: 'action_restriction', modifier: -50 },
  { need: 'health', threshold: 10, effect: 'critical_condition', modifier: -80 },
  
  // Psychological effects (inverted thresholds - higher value = worse)
  { need: 'stress', threshold: 70, effect: 'stress_recovery_slower', modifier: -50 },
  { need: 'stress', threshold: 80, effect: 'breakdown_risk', modifier: 30 },
  
  { need: 'tension', threshold: 50, effect: 'distraction', modifier: -20 },
  { need: 'tension', threshold: 75, effect: 'dialogue_options_change', modifier: 30 },
  { need: 'tension', threshold: 90, effect: 'reduced_agency', modifier: -40 },
  
  { need: 'comfort', threshold: 30, effect: 'stress_recovery_slower', modifier: -30 },
  { need: 'comfort', threshold: 20, effect: 'mood_penalty', modifier: -20 },
  
  { need: 'social', threshold: 30, effect: 'stress_increases_faster', modifier: 20 },
  { need: 'social', threshold: 20, effect: 'mood_penalty', modifier: -30 },
  { need: 'social', threshold: 10, effect: 'loneliness_damage', modifier: -10 },
  
  { need: 'fulfillment', threshold: 20, effect: 'depression_risk', modifier: 20 },
  { need: 'fulfillment', threshold: 30, effect: 'motivation_penalty', modifier: -20 },
];

// ============= CRITICAL NEEDS EXTRACTION =============

/**
 * Extract list of critical needs from PlayerNeeds state
 * Used by Director system for priority context
 */
export function getCriticalNeeds(needs: PlayerNeeds): string[] {
  const critical: string[] = [];
  
  // Physical needs - low values are critical
  if (needs.physical.hunger <= 20) critical.push('hunger');
  if (needs.physical.thirst <= 20) critical.push('thirst');
  if (needs.physical.energy <= 20) critical.push('energy');
  if (needs.physical.health <= 30) critical.push('health');
  if (needs.physical.hygiene <= 15) critical.push('hygiene');
  
  // Bladder - high value is critical (inverted)
  if (needs.physical.bladder >= 80) critical.push('bladder');
  
  // Psychological needs
  if (needs.psychological.stress >= 70) critical.push('stress');
  if (needs.psychological.social <= 20) critical.push('social');
  if (needs.psychological.fulfillment <= 15) critical.push('fulfillment');
  
  return critical;
}

/**
 * Check if any need is at critical level
 */
export function hasAnyCriticalNeed(needs: PlayerNeeds): boolean {
  return getCriticalNeeds(needs).length > 0;
}

// ============= NEED PROCESSING =============

export function processNeedDecay(needs: PlayerNeeds, hours: number = 1, activityModifiers?: Partial<Record<keyof PhysicalNeeds | keyof PsychologicalNeeds, number>>): PlayerNeeds {
  const updated: PlayerNeeds = {
    physical: { ...needs.physical },
    psychological: { ...needs.psychological },
  };
  
  // Process physical needs
  for (const [need, rate] of Object.entries(NEED_DECAY_RATES)) {
    const modifier = activityModifiers?.[need as keyof PhysicalNeeds] ?? 0;
    const totalRate = (rate + modifier) * hours;
    
    if (need in updated.physical) {
      const key = need as keyof PhysicalNeeds;
      if (need === 'bladder') {
        // Bladder fills up
        updated.physical[key] = Math.min(100, Math.max(0, updated.physical[key] - totalRate));
      } else {
        // Other physical needs drop
        updated.physical[key] = Math.min(100, Math.max(0, updated.physical[key] - totalRate));
      }
    } else if (need in updated.psychological) {
      const key = need as keyof PsychologicalNeeds;
      updated.psychological[key] = Math.min(100, Math.max(0, updated.psychological[key] - totalRate));
    }
  }
  
  return updated;
}

// ============= NEED RESTORATION =============

export interface NeedRestoration {
  need: keyof PhysicalNeeds | keyof PsychologicalNeeds;
  amount: number;
  source: string;
}

export function restoreNeed(needs: PlayerNeeds, restoration: NeedRestoration): PlayerNeeds {
  const updated: PlayerNeeds = {
    physical: { ...needs.physical },
    psychological: { ...needs.psychological },
  };
  
  if (restoration.need in updated.physical) {
    const key = restoration.need as keyof PhysicalNeeds;
    updated.physical[key] = Math.min(100, Math.max(0, updated.physical[key] + restoration.amount));
  } else if (restoration.need in updated.psychological) {
    const key = restoration.need as keyof PsychologicalNeeds;
    updated.psychological[key] = Math.min(100, Math.max(0, updated.psychological[key] + restoration.amount));
  }
  
  return updated;
}

export function restoreMultipleNeeds(needs: PlayerNeeds, restorations: NeedRestoration[]): PlayerNeeds {
  let updated = needs;
  for (const restoration of restorations) {
    updated = restoreNeed(updated, restoration);
  }
  return updated;
}

// ============= NEED-BASED ACTION AVAILABILITY =============

export interface ActionAvailability {
  available: boolean;
  reason?: string;
  modifiedSuccess?: number;
}

export function checkActionAvailability(needs: PlayerNeeds, actionType: string): ActionAvailability {
  // Critical energy prevents complex actions
  if (needs.physical.energy <= 10 && ['work', 'exercise', 'combat', 'seduce'].includes(actionType)) {
    return { available: false, reason: 'Too exhausted to attempt this action.' };
  }
  
  // Critical hunger affects physical actions
  if (needs.physical.hunger <= 10 && ['combat', 'exercise', 'work'].includes(actionType)) {
    return { available: true, modifiedSuccess: -40, reason: 'Hunger weakens your performance.' };
  }
  
  // Critical bladder creates urgency
  if (needs.physical.bladder >= 90) {
    return { available: true, modifiedSuccess: -30, reason: 'You need to find facilities urgently.' };
  }
  
  // High stress affects social actions
  if (needs.psychological.stress >= 80 && ['negotiate', 'seduce', 'persuade'].includes(actionType)) {
    return { available: true, modifiedSuccess: -30, reason: 'Your stress is affecting your composure.' };
  }
  
  // High tension affects focus
  if (needs.psychological.tension >= 75 && ['study', 'work', 'investigate'].includes(actionType)) {
    return { available: true, modifiedSuccess: -20, reason: 'Your mind keeps wandering.' };
  }
  
  // Low health restricts physical actions
  if (needs.physical.health <= 20 && ['combat', 'exercise', 'flee'].includes(actionType)) {
    return { available: false, reason: 'You are too injured to attempt this.' };
  }
  
  return { available: true };
}

// ============= NEED PROSE GENERATION =============

export function generateNeedProse(needs: PlayerNeeds): string[] {
  const descriptions: string[] = [];
  
  // Physical needs prose
  if (needs.physical.hunger <= 20) {
    descriptions.push('Your stomach aches with hunger, making it hard to focus.');
  } else if (needs.physical.hunger <= 40) {
    descriptions.push('You feel a gnawing emptiness in your stomach.');
  }
  
  if (needs.physical.thirst <= 20) {
    descriptions.push('Your throat is parched, your lips cracked.');
  } else if (needs.physical.thirst <= 40) {
    descriptions.push('You could really use a drink.');
  }
  
  if (needs.physical.energy <= 20) {
    descriptions.push('Exhaustion weighs on you like a physical burden. Every movement is an effort.');
  } else if (needs.physical.energy <= 40) {
    descriptions.push('Weariness tugs at your limbs.');
  }
  
  if (needs.physical.bladder >= 80) {
    descriptions.push('You urgently need to find facilities.');
  } else if (needs.physical.bladder >= 60) {
    descriptions.push('A growing pressure reminds you to find a restroom soon.');
  }
  
  if (needs.physical.hygiene <= 20) {
    descriptions.push('You are acutely aware of your own unwashed state.');
  } else if (needs.physical.hygiene <= 40) {
    descriptions.push('You could use a bath.');
  }
  
  if (needs.physical.health <= 30) {
    descriptions.push('Pain reminds you of your injuries with every movement.');
  }
  
  // Psychological needs prose
  if (needs.psychological.stress >= 80) {
    descriptions.push('Anxiety claws at your chest. Everything feels overwhelming.');
  } else if (needs.psychological.stress >= 60) {
    descriptions.push('A persistent tension hums beneath your thoughts.');
  }
  
  if (needs.psychological.tension >= 75) {
    descriptions.push('A distracting warmth makes it hard to concentrate on anything else.');
  } else if (needs.psychological.tension >= 50) {
    descriptions.push('You feel... restless in a way that is hard to ignore.');
  }
  
  if (needs.psychological.social <= 20) {
    descriptions.push('Loneliness weighs heavily on you.');
  } else if (needs.psychological.social <= 40) {
    descriptions.push('You find yourself craving human connection.');
  }
  
  if (needs.psychological.comfort <= 30) {
    descriptions.push('Nothing about your current situation feels comfortable.');
  }
  
  if (needs.psychological.fulfillment <= 20) {
    descriptions.push('A hollow emptiness pervades your days. What is the point of it all?');
  }
  
  return descriptions;
}

// ============= ACTIVITY EFFECTS ON NEEDS =============

export interface ActivityNeedEffects {
  activityType: string;
  effects: Partial<Record<keyof PhysicalNeeds | keyof PsychologicalNeeds, number>>;
  duration: number; // hours
}

export const ACTIVITY_EFFECTS: ActivityNeedEffects[] = [
  // Restorative activities
  {
    activityType: 'sleep',
    effects: { energy: 30, stress: -20, tension: -10 },
    duration: 8,
  },
  {
    activityType: 'eat_meal',
    effects: { hunger: 40, energy: 5 },
    duration: 1,
  },
  {
    activityType: 'drink',
    effects: { thirst: 30 },
    duration: 0.25,
  },
  {
    activityType: 'bathe',
    effects: { hygiene: 50, comfort: 20, stress: -10 },
    duration: 1,
  },
  {
    activityType: 'use_facilities',
    effects: { bladder: -80 },
    duration: 0.25,
  },
  {
    activityType: 'rest',
    effects: { energy: 10, stress: -5, comfort: 10 },
    duration: 1,
  },
  
  // Social activities
  {
    activityType: 'socialize',
    effects: { social: 20, stress: -10, energy: -5 },
    duration: 2,
  },
  {
    activityType: 'intimate_encounter',
    effects: { tension: -50, social: 30, stress: -20, energy: -20, fulfillment: 20 },
    duration: 1,
  },
  
  // Work activities
  {
    activityType: 'work_physical',
    effects: { energy: -20, hygiene: -10, hunger: -10, thirst: -15, fulfillment: 10 },
    duration: 4,
  },
  {
    activityType: 'work_mental',
    effects: { energy: -10, stress: 10, fulfillment: 15 },
    duration: 4,
  },
  
  // Entertainment
  {
    activityType: 'entertainment',
    effects: { fulfillment: 15, stress: -15, social: 5 },
    duration: 2,
  },
  
  // Exercise
  {
    activityType: 'exercise',
    effects: { energy: -25, hygiene: -20, hunger: -10, thirst: -15, stress: -20, tension: -15 },
    duration: 1,
  },
];

export function getActivityEffects(activityType: string): ActivityNeedEffects | null {
  return ACTIVITY_EFFECTS.find(a => a.activityType === activityType) || null;
}

export function applyActivityEffects(needs: PlayerNeeds, activityType: string): PlayerNeeds {
  const activity = getActivityEffects(activityType);
  if (!activity) return needs;
  
  let updated = needs;
  for (const [need, amount] of Object.entries(activity.effects)) {
    updated = restoreNeed(updated, {
      need: need as keyof PhysicalNeeds | keyof PsychologicalNeeds,
      amount: amount as number,
      source: activityType,
    });
  }
  
  return updated;
}

// ============= DESPERATION SYSTEM =============

export interface DesperationState {
  isDesparate: boolean;
  desperateNeeds: string[];
  unlockedOptions: string[];
}

export function checkDesperation(needs: PlayerNeeds): DesperationState {
  const desperateNeeds: string[] = [];
  const unlockedOptions: string[] = [];
  
  // Physical desperation
  if (needs.physical.hunger <= 10) {
    desperateNeeds.push('hunger');
    unlockedOptions.push('steal_food', 'beg', 'dangerous_work');
  }
  
  if (needs.physical.health <= 20) {
    desperateNeeds.push('health');
    unlockedOptions.push('risky_treatment', 'desperate_plea');
  }
  
  if (needs.physical.energy <= 10) {
    desperateNeeds.push('energy');
    unlockedOptions.push('stimulants', 'unsafe_rest');
  }
  
  // Economic desperation (would need economy state too)
  // This is handled in the economy system
  
  return {
    isDesparate: desperateNeeds.length > 0,
    desperateNeeds,
    unlockedOptions,
  };
}

// ============= NPC NOTICE SYSTEM =============

export interface VisibleNeedState {
  visibleToNPCs: boolean;
  observableNeeds: string[];
  npcReactionModifier: number;
}

export function calculateVisibleNeedState(needs: PlayerNeeds): VisibleNeedState {
  const observableNeeds: string[] = [];
  let reactionModifier = 0;
  
  // Visible exhaustion
  if (needs.physical.energy <= 30) {
    observableNeeds.push('exhaustion');
    reactionModifier -= 10;
  }
  
  // Visible hunger (gaunt, weak)
  if (needs.physical.hunger <= 20) {
    observableNeeds.push('hunger');
    reactionModifier -= 5;
  }
  
  // Poor hygiene is very noticeable
  if (needs.physical.hygiene <= 30) {
    observableNeeds.push('poor_hygiene');
    reactionModifier -= 20;
  }
  
  // Visible injuries
  if (needs.physical.health <= 40) {
    observableNeeds.push('injured');
    reactionModifier -= 5; // Some NPCs might offer help, others exploit
  }
  
  // High stress visible
  if (needs.psychological.stress >= 70) {
    observableNeeds.push('stressed');
    reactionModifier -= 10;
  }
  
  // High tension might be noticeable
  if (needs.psychological.tension >= 60) {
    observableNeeds.push('tension_visible');
    // This can attract certain NPCs
  }
  
  // Visible distress from low social
  if (needs.psychological.social <= 20) {
    observableNeeds.push('lonely');
    reactionModifier += 5; // Some NPCs might approach
  }
  
  return {
    visibleToNPCs: observableNeeds.length > 0,
    observableNeeds,
    npcReactionModifier: reactionModifier,
  };
}
