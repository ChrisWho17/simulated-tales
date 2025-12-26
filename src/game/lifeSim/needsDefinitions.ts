// Life Simulation Needs Definitions - Enhanced Sims-like needs system
// This complements the existing needsSystem.ts with Life Sim-specific needs

export interface LifeSimNeed {
  id: string;
  name: string;
  icon: string;
  color: string;
  current: number;
  decayRate: number;  // per hour
  criticalThreshold: number;
  effects: {
    low: Record<string, number>;
    critical: Record<string, number | boolean>;
  };
}

export interface LifeSimNeedsState {
  hunger: LifeSimNeed;
  energy: LifeSimNeed;
  social: LifeSimNeed;
  fun: LifeSimNeed;
  hygiene: LifeSimNeed;
  bladder: LifeSimNeed;
  comfort: LifeSimNeed;
}

// Default Life Sim needs initialization
export function createLifeSimNeeds(): LifeSimNeedsState {
  return {
    hunger: {
      id: 'hunger',
      name: 'Hunger',
      icon: '🍔',
      color: '#22c55e',
      current: 100,
      decayRate: 2,
      criticalThreshold: 20,
      effects: {
        low: { mood: -20, energy: -10 },
        critical: { mood: -40, energy: -30, health: -5 }
      }
    },
    energy: {
      id: 'energy',
      name: 'Energy',
      icon: '⚡',
      color: '#eab308',
      current: 100,
      decayRate: 3,
      criticalThreshold: 15,
      effects: {
        low: { mood: -15, productivity: -30 },
        critical: { mood: -30, productivity: -60, passOut: true }
      }
    },
    social: {
      id: 'social',
      name: 'Social',
      icon: '💬',
      color: '#3b82f6',
      current: 100,
      decayRate: 1.5,
      criticalThreshold: 25,
      effects: {
        low: { mood: -25, charisma: -10 },
        critical: { mood: -50, depression: true }
      }
    },
    fun: {
      id: 'fun',
      name: 'Fun',
      icon: '🎮',
      color: '#ec4899',
      current: 100,
      decayRate: 2,
      criticalThreshold: 20,
      effects: {
        low: { mood: -20, productivity: -15 },
        critical: { mood: -40, stress: 30 }
      }
    },
    hygiene: {
      id: 'hygiene',
      name: 'Hygiene',
      icon: '🚿',
      color: '#06b6d4',
      current: 100,
      decayRate: 1,
      criticalThreshold: 30,
      effects: {
        low: { charisma: -10, confidence: -15 },
        critical: { charisma: -30, socialRepulsion: true }
      }
    },
    bladder: {
      id: 'bladder',
      name: 'Bladder',
      icon: '🚽',
      color: '#f97316',
      current: 100,
      decayRate: 4,
      criticalThreshold: 10,
      effects: {
        low: { comfort: -30, focus: -20 },
        critical: { embarrassment: true, hygiene: -50 }
      }
    },
    comfort: {
      id: 'comfort',
      name: 'Comfort',
      icon: '🛋️',
      color: '#a855f7',
      current: 100,
      decayRate: 0.5,
      criticalThreshold: 25,
      effects: {
        low: { mood: -10, stress: 10 },
        critical: { mood: -25, stress: 25 }
      }
    }
  };
}

// Activity effects on Life Sim needs
export interface LifeSimActivity {
  id: string;
  name: string;
  duration: number;  // in hours
  effects: Partial<Record<keyof LifeSimNeedsState, number>>;
  requirements?: Partial<Record<keyof LifeSimNeedsState, number>>;
  cost?: number;
  skillBoosts?: Record<string, number>;
}

export const LIFESIM_ACTIVITIES: LifeSimActivity[] = [
  // Eating activities
  { id: 'eat_quick', name: 'Quick Snack', duration: 0.5, effects: { hunger: 30 } },
  { id: 'eat_meal', name: 'Home Cooked Meal', duration: 1, effects: { hunger: 60, social: 5 }, skillBoosts: { cooking: 2 } },
  { id: 'eat_gourmet', name: 'Gourmet Dining', duration: 2, effects: { hunger: 80, social: 15, fun: 10 }, cost: 50 },
  
  // Sleep activities
  { id: 'sleep_nap', name: 'Power Nap', duration: 2, effects: { energy: 30 } },
  { id: 'sleep_full', name: 'Full Night\'s Sleep', duration: 8, effects: { energy: 100, comfort: 20 } },
  
  // Social activities
  { id: 'socialize_chat', name: 'Friendly Chat', duration: 1, effects: { social: 20, fun: 10 } },
  { id: 'socialize_party', name: 'Throw Party', duration: 4, effects: { social: 50, fun: 40, energy: -20 }, cost: 100 },
  { id: 'socialize_date', name: 'Romantic Date', duration: 3, effects: { social: 40, fun: 30 }, cost: 75 },
  
  // Entertainment
  { id: 'fun_tv', name: 'Watch TV', duration: 2, effects: { fun: 20, energy: -5 } },
  { id: 'fun_gaming', name: 'Play Video Games', duration: 3, effects: { fun: 40, social: 10, energy: -10 }, skillBoosts: { gaming: 3 } },
  { id: 'fun_hobby', name: 'Practice Hobby', duration: 2, effects: { fun: 30 }, skillBoosts: { creativity: 5 } },
  
  // Hygiene
  { id: 'hygiene_shower', name: 'Quick Shower', duration: 0.5, effects: { hygiene: 80, comfort: 10 } },
  { id: 'hygiene_bath', name: 'Relaxing Bath', duration: 1, effects: { hygiene: 100, comfort: 30, fun: 10 } },
  
  // Bathroom
  { id: 'bathroom', name: 'Use Bathroom', duration: 0.1, effects: { bladder: 100 } },
  
  // Work
  { id: 'work_regular', name: 'Regular Work Day', duration: 8, effects: { energy: -30, fun: -20 } },
  { id: 'work_overtime', name: 'Overtime', duration: 10, effects: { energy: -50, fun: -40 } },
  
  // Exercise
  { id: 'exercise', name: 'Workout', duration: 1, effects: { energy: -20, hygiene: -20, fun: 10 }, skillBoosts: { fitness: 5 } },
  
  // Relax
  { id: 'relax', name: 'Relax', duration: 1, effects: { comfort: 30, energy: 10 } },
];

// Process needs decay over time
export function processLifeSimNeedsDecay(
  needs: LifeSimNeedsState, 
  hoursElapsed: number = 1
): { needs: LifeSimNeedsState; effects: Array<{ needId: string; status: 'low' | 'critical' | 'depleted'; effects: Record<string, number | boolean> }> } {
  const updated = JSON.parse(JSON.stringify(needs)) as LifeSimNeedsState;
  const effects: Array<{ needId: string; status: 'low' | 'critical' | 'depleted'; effects: Record<string, number | boolean> }> = [];
  
  for (const [needId, need] of Object.entries(updated) as [keyof LifeSimNeedsState, LifeSimNeed][]) {
    // Apply decay
    need.current = Math.max(0, need.current - (need.decayRate * hoursElapsed));
    
    // Check thresholds and add effects
    if (need.current <= 0) {
      effects.push({ needId, status: 'depleted', effects: need.effects.critical });
    } else if (need.current <= need.criticalThreshold) {
      effects.push({ needId, status: 'critical', effects: need.effects.critical });
    } else if (need.current <= 40) {
      effects.push({ needId, status: 'low', effects: need.effects.low });
    }
  }
  
  return { needs: updated, effects };
}

// Fulfill a specific need
export function fulfillLifeSimNeed(
  needs: LifeSimNeedsState, 
  needId: keyof LifeSimNeedsState, 
  amount: number
): LifeSimNeedsState {
  const updated = JSON.parse(JSON.stringify(needs)) as LifeSimNeedsState;
  if (updated[needId]) {
    updated[needId].current = Math.min(100, Math.max(0, updated[needId].current + amount));
  }
  return updated;
}

// Apply activity effects to needs
export function applyLifeSimActivity(
  needs: LifeSimNeedsState, 
  activityId: string
): LifeSimNeedsState {
  const activity = LIFESIM_ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return needs;
  
  let updated = JSON.parse(JSON.stringify(needs)) as LifeSimNeedsState;
  
  for (const [needId, amount] of Object.entries(activity.effects)) {
    const key = needId as keyof LifeSimNeedsState;
    if (updated[key]) {
      updated[key].current = Math.min(100, Math.max(0, updated[key].current + amount));
    }
  }
  
  return updated;
}

// Calculate overall mood from all needs
export function calculateLifeSimMood(needs: LifeSimNeedsState): number {
  let moodScore = 50; // Base mood
  
  for (const need of Object.values(needs)) {
    if (need.current >= 80) {
      moodScore += 5;
    } else if (need.current >= 50) {
      moodScore += 0;
    } else if (need.current >= 30) {
      moodScore -= 10;
    } else {
      moodScore -= 20;
    }
  }
  
  return Math.max(0, Math.min(100, moodScore));
}

// Get overall needs status
export function getLifeSimNeedsStatus(needs: LifeSimNeedsState): {
  mood: number;
  moodLabel: string;
  moodEmoji: string;
  criticalNeeds: LifeSimNeed[];
  lowNeeds: LifeSimNeed[];
  allNeeds: LifeSimNeedsState;
} {
  const mood = calculateLifeSimMood(needs);
  
  const criticalNeeds = Object.values(needs).filter(n => n.current <= n.criticalThreshold);
  const lowNeeds = Object.values(needs).filter(n => n.current > n.criticalThreshold && n.current <= 40);
  
  let moodLabel: string;
  let moodEmoji: string;
  
  if (mood >= 80) {
    moodLabel = 'Ecstatic';
    moodEmoji = '😄';
  } else if (mood >= 60) {
    moodLabel = 'Happy';
    moodEmoji = '😊';
  } else if (mood >= 40) {
    moodLabel = 'Okay';
    moodEmoji = '😐';
  } else if (mood >= 20) {
    moodLabel = 'Unhappy';
    moodEmoji = '😞';
  } else {
    moodLabel = 'Miserable';
    moodEmoji = '😢';
  }
  
  return { mood, moodLabel, moodEmoji, criticalNeeds, lowNeeds, allNeeds: needs };
}

// Genre-specific need multipliers
export const LIFESIM_NEED_MULTIPLIERS = {
  hunger: 1.0,
  energy: 1.0,
  social: 1.2,  // Social is more important in life sim
  fun: 1.2,     // Entertainment is key
  hygiene: 1.0,
  bladder: 1.0,
  comfort: 1.0,
};
