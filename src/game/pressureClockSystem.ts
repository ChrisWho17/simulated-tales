// ============================================================================
// THE UNTOLD STORY ENGINE - Pressure Clocks System
// Creates world tension through advancing clocks that track Heat, Resources, 
// Rumors, and Dread. The world pushes back when the player hesitates.
// ============================================================================

export type ClockType = 'heat' | 'hunger' | 'rumors' | 'dread';

export interface PressureClock {
  type: ClockType;
  name: string;
  description: string;
  ticks: number; // 0-6
  maxTicks: number; // Always 6
  lastAdvanceTick: number;
  triggers: string[]; // What causes advancement
  consequences: ClockConsequence[];
  icon: string;
  color: string;
}

export interface ClockConsequence {
  threshold: number; // Ticks required to trigger
  effect: string;
  narrative: string;
  triggered: boolean;
}

export interface PressureState {
  clocks: Record<ClockType, PressureClock>;
  lastUpdate: number;
  activeEffects: string[];
  worldPressureLevel: number; // 0-100 overall tension
}

// ============================================================================
// CLOCK DEFINITIONS
// ============================================================================

const CLOCK_DEFINITIONS: Record<ClockType, Omit<PressureClock, 'ticks' | 'lastAdvanceTick'>> = {
  heat: {
    type: 'heat',
    name: 'Heat',
    description: 'Authorities, rivals, or predators closing in',
    maxTicks: 6,
    triggers: [
      'combat', 'violence', 'noise', 'witnesses', 'crime',
      'attention', 'failure', 'discovered', 'wanted'
    ],
    consequences: [
      { threshold: 2, effect: 'suspicious_npcs', narrative: 'Strangers watch you a moment too long.', triggered: false },
      { threshold: 4, effect: 'active_search', narrative: 'You hear footsteps that pause when you do.', triggered: false },
      { threshold: 6, effect: 'confrontation', narrative: 'They found you. Whatever happens next, running won\'t be easy.', triggered: false }
    ],
    icon: '🔥',
    color: 'hsl(0, 84%, 60%)'
  },
  hunger: {
    type: 'hunger',
    name: 'Resources',
    description: 'Supplies, shelter, ammo, medicine running low',
    maxTicks: 6,
    triggers: [
      'time_passes', 'travel', 'rest', 'combat', 'injury',
      'usage', 'lost_item', 'theft'
    ],
    consequences: [
      { threshold: 2, effect: 'rationing', narrative: 'Your pack feels lighter than it should.', triggered: false },
      { threshold: 4, effect: 'desperate', narrative: 'You count what remains. It\'s not enough.', triggered: false },
      { threshold: 6, effect: 'depleted', narrative: 'Nothing left. Every choice now costs something you can\'t spare.', triggered: false }
    ],
    icon: '🎒',
    color: 'hsl(45, 93%, 47%)'
  },
  rumors: {
    type: 'rumors',
    name: 'Rumors',
    description: 'Your name spreads, for better or worse',
    maxTicks: 6,
    triggers: [
      'public_action', 'heroism', 'infamy', 'witnessed',
      'talked_to_npc', 'notable_deed', 'betrayal', 'promise'
    ],
    consequences: [
      { threshold: 2, effect: 'whispers', narrative: 'You catch your name on the wind, spoken by mouths you don\'t recognize.', triggered: false },
      { threshold: 4, effect: 'reputation', narrative: 'Doors open that were closed. Others slam shut.', triggered: false },
      { threshold: 6, effect: 'legend', narrative: 'Everyone knows. The stories they tell may or may not be true.', triggered: false }
    ],
    icon: '👁️',
    color: 'hsl(271, 91%, 65%)'
  },
  dread: {
    type: 'dread',
    name: 'Dread',
    description: 'Strange events escalate, nightmares bleed through',
    maxTicks: 6,
    triggers: [
      'weird_event', 'supernatural', 'nightmare', 'darkness',
      'isolation', 'death_witnessed', 'corruption', 'forbidden'
    ],
    consequences: [
      { threshold: 2, effect: 'unease', narrative: 'Something feels wrong. The shadows move differently here.', triggered: false },
      { threshold: 4, effect: 'manifestation', narrative: 'You\'re not sure if you\'re seeing things, or if the things are seeing you.', triggered: false },
      { threshold: 6, effect: 'breach', narrative: 'The boundary between what is real and what shouldn\'t be grows thin.', triggered: false }
    ],
    icon: '🌑',
    color: 'hsl(280, 100%, 30%)'
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export function createPressureState(): PressureState {
  const clocks: Record<ClockType, PressureClock> = {} as any;
  
  for (const [type, def] of Object.entries(CLOCK_DEFINITIONS)) {
    clocks[type as ClockType] = {
      ...def,
      ticks: 0,
      lastAdvanceTick: 0,
      consequences: def.consequences.map(c => ({ ...c, triggered: false }))
    };
  }
  
  return {
    clocks,
    lastUpdate: Date.now(),
    activeEffects: [],
    worldPressureLevel: 0
  };
}

// ============================================================================
// CLOCK ADVANCEMENT
// ============================================================================

export interface ClockAdvanceResult {
  clock: ClockType;
  previousTicks: number;
  newTicks: number;
  consequence?: ClockConsequence;
  narrative?: string;
}

/**
 * Advance a clock by a given amount
 */
export function advanceClock(
  state: PressureState,
  clockType: ClockType,
  amount: number = 1,
  reason?: string
): { state: PressureState; result: ClockAdvanceResult } {
  const clock = state.clocks[clockType];
  const previousTicks = clock.ticks;
  const newTicks = Math.min(clock.maxTicks, clock.ticks + amount);
  
  // Check for newly triggered consequences
  let triggeredConsequence: ClockConsequence | undefined;
  for (const consequence of clock.consequences) {
    if (!consequence.triggered && newTicks >= consequence.threshold && previousTicks < consequence.threshold) {
      consequence.triggered = true;
      triggeredConsequence = consequence;
      break; // Only trigger one consequence per advance
    }
  }
  
  const updatedClock: PressureClock = {
    ...clock,
    ticks: newTicks,
    lastAdvanceTick: Date.now()
  };
  
  const newActiveEffects = triggeredConsequence
    ? [...state.activeEffects, triggeredConsequence.effect]
    : state.activeEffects;
  
  const newState: PressureState = {
    ...state,
    clocks: {
      ...state.clocks,
      [clockType]: updatedClock
    },
    activeEffects: newActiveEffects,
    worldPressureLevel: calculateWorldPressure(state.clocks),
    lastUpdate: Date.now()
  };
  
  const result: ClockAdvanceResult = {
    clock: clockType,
    previousTicks,
    newTicks,
    consequence: triggeredConsequence,
    narrative: triggeredConsequence?.narrative
  };
  
  console.log(`[PressureClocks] ${clock.icon} ${clock.name}: ${previousTicks} → ${newTicks}${reason ? ` (${reason})` : ''}`);
  
  return { state: newState, result };
}

/**
 * Reduce a clock by a given amount
 */
export function reduceClock(
  state: PressureState,
  clockType: ClockType,
  amount: number = 1,
  reason?: string
): PressureState {
  const clock = state.clocks[clockType];
  const newTicks = Math.max(0, clock.ticks - amount);
  
  const updatedClock: PressureClock = {
    ...clock,
    ticks: newTicks
  };
  
  console.log(`[PressureClocks] ${clock.icon} ${clock.name}: ${clock.ticks} → ${newTicks}${reason ? ` (${reason})` : ''}`);
  
  return {
    ...state,
    clocks: {
      ...state.clocks,
      [clockType]: updatedClock
    },
    worldPressureLevel: calculateWorldPressure(state.clocks),
    lastUpdate: Date.now()
  };
}

/**
 * Calculate overall world pressure level (0-100)
 */
function calculateWorldPressure(clocks: Record<ClockType, PressureClock>): number {
  let total = 0;
  let maxPossible = 0;
  
  for (const clock of Object.values(clocks)) {
    total += clock.ticks;
    maxPossible += clock.maxTicks;
  }
  
  return Math.round((total / maxPossible) * 100);
}

// ============================================================================
// NARRATIVE PARSING
// ============================================================================

/**
 * Parse narrative for clock triggers
 */
export function parseNarrativeForClockTriggers(
  narrative: string,
  state: PressureState
): { state: PressureState; advances: ClockAdvanceResult[] } {
  const lowerNarrative = narrative.toLowerCase();
  const advances: ClockAdvanceResult[] = [];
  let currentState = state;
  
  // Check each clock type for triggers
  for (const [clockType, clock] of Object.entries(currentState.clocks) as [ClockType, PressureClock][]) {
    let shouldAdvance = false;
    let reason = '';
    
    for (const trigger of clock.triggers) {
      if (lowerNarrative.includes(trigger)) {
        shouldAdvance = true;
        reason = trigger;
        break;
      }
    }
    
    // Special trigger patterns
    if (clockType === 'heat') {
      if (/\b(guard|soldier|police|hunter|tracker)\b/i.test(narrative) && 
          /\b(spot|see|notice|find|chase)\b/i.test(narrative)) {
        shouldAdvance = true;
        reason = 'spotted';
      }
    }
    
    if (clockType === 'dread') {
      if (/\b(shadow|whisper|chill|wrong|fear|terror|horror)\b/i.test(narrative)) {
        shouldAdvance = true;
        reason = 'atmospheric_dread';
      }
    }
    
    if (shouldAdvance) {
      const result = advanceClock(currentState, clockType, 1, reason);
      currentState = result.state;
      advances.push(result.result);
    }
  }
  
  return { state: currentState, advances };
}

/**
 * Advance clocks based on time passing (hesitation penalty)
 */
export function tickTimeBasedClocks(
  state: PressureState,
  hoursPassed: number
): { state: PressureState; advances: ClockAdvanceResult[] } {
  const advances: ClockAdvanceResult[] = [];
  let currentState = state;
  
  // Resources deplete with time
  if (hoursPassed >= 4) {
    const result = advanceClock(currentState, 'hunger', 1, 'time passing');
    currentState = result.state;
    advances.push(result.result);
  }
  
  // Heat slowly increases if already > 0 (they're looking for you)
  if (currentState.clocks.heat.ticks > 0 && hoursPassed >= 6) {
    const result = advanceClock(currentState, 'heat', 1, 'search intensifies');
    currentState = result.state;
    advances.push(result.result);
  }
  
  return { state: currentState, advances };
}

// ============================================================================
// CONTEXT BUILDING FOR AI
// ============================================================================

/**
 * Build pressure context for AI prompts
 */
export function buildPressureContext(state: PressureState): string {
  const lines: string[] = ['### WORLD PRESSURE (Clocks 0-6)'];
  
  for (const clock of Object.values(state.clocks)) {
    if (clock.ticks > 0) {
      const ticksDisplay = '●'.repeat(clock.ticks) + '○'.repeat(clock.maxTicks - clock.ticks);
      lines.push(`${clock.icon} ${clock.name}: [${ticksDisplay}] (${clock.ticks}/${clock.maxTicks})`);
      
      // Add active consequence if any
      const activeConsequence = clock.consequences.find(c => c.triggered && clock.ticks >= c.threshold);
      if (activeConsequence) {
        lines.push(`   → ${activeConsequence.effect}: ${activeConsequence.narrative}`);
      }
    }
  }
  
  if (lines.length === 1) {
    lines.push('All clocks at 0 - relative calm.');
  }
  
  // Add pressure flavor
  if (state.worldPressureLevel >= 75) {
    lines.push('');
    lines.push('**The world is pressing in. Every action has consequences.**');
  } else if (state.worldPressureLevel >= 50) {
    lines.push('');
    lines.push('*Tension is building. The calm won\'t last.*');
  }
  
  return lines.join('\n');
}

/**
 * Get atmospheric lines for current pressure state
 */
export function getPressureAtmosphere(state: PressureState): string[] {
  const lines: string[] = [];
  
  // Heat atmosphere
  if (state.clocks.heat.ticks >= 4) {
    lines.push('Somewhere nearby, a door slams. Your name gets said by the wrong mouth.');
  } else if (state.clocks.heat.ticks >= 2) {
    lines.push('A flicker of movement at the edge of your vision. Someone is watching.');
  }
  
  // Hunger atmosphere
  if (state.clocks.hunger.ticks >= 4) {
    lines.push('Your stomach reminds you that survival is not guaranteed.');
  } else if (state.clocks.hunger.ticks >= 2) {
    lines.push('You take stock of what remains. It won\'t last forever.');
  }
  
  // Rumors atmosphere
  if (state.clocks.rumors.ticks >= 4) {
    lines.push('Strangers study your face like they\'ve seen it before.');
  } else if (state.clocks.rumors.ticks >= 2) {
    lines.push('Whispers follow in your wake. Stories grow in the telling.');
  }
  
  // Dread atmosphere
  if (state.clocks.dread.ticks >= 4) {
    lines.push('The darkness has weight here. It watches with something like hunger.');
  } else if (state.clocks.dread.ticks >= 2) {
    lines.push('A chill that has nothing to do with temperature settles in your bones.');
  }
  
  return lines;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

export function serializePressureState(state: PressureState): string {
  return JSON.stringify(state);
}

export function deserializePressureState(data: string): PressureState {
  try {
    return JSON.parse(data);
  } catch {
    return createPressureState();
  }
}
