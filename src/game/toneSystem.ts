// Tone Adaptation System - Tracks and adapts to player's emotional intensity and style

export type ToneCategory = 'calm' | 'tense' | 'chaotic' | 'violent' | 'emotional' | 'neutral';

export interface ToneAnalysis {
  tone: ToneCategory;
  intensity: number; // 1-10
}

export interface ToneState {
  currentTone: ToneCategory;
  toneHistory: ToneCategory[];
  intensity: number;
  playerChaosLevel: number; // 0-10 tracks erratic behavior
  lastActionTone: ToneCategory;
}

// Tone signal patterns
const TONE_SIGNALS: Record<ToneCategory, RegExp> = {
  chaotic: /(!{2,}|stop!|no!|help!|please!|fuck|shit|damn|scream|yell|fight|run|escape|panic|frantic|wild|crazy)/i,
  violent: /(kill|attack|hit|punch|stab|shoot|hurt|destroy|break|murder|slash|smash|crush|rip|tear|beat|strangle|choke)/i,
  emotional: /(cry|tear|sob|please|beg|desperate|scared|afraid|trauma|grief|mourn|weep|tremble|shake|fear|terrified)/i,
  calm: /(wait|look|observe|think|consider|sit|rest|breathe|relax|examine|study|ponder|meditate|reflect)/i,
  tense: /(careful|sneak|hide|watch|listen|quiet|slowly|cautious|wary|alert|suspicious|ready|prepare)/i,
  neutral: /.*/,
};

// Tone shift distances (higher = more dramatic shift)
const TONE_DISTANCES: Record<string, number> = {
  'calm-chaotic': 4,
  'calm-violent': 4,
  'calm-emotional': 2,
  'calm-tense': 1,
  'tense-chaotic': 2,
  'tense-violent': 2,
  'neutral-chaotic': 3,
  'neutral-violent': 3,
  'emotional-violent': 3,
  'chaotic-calm': 3,
  'violent-calm': 4,
  'emotional-calm': 2,
};

/**
 * Create initial tone state
 */
export function createInitialToneState(): ToneState {
  return {
    currentTone: 'neutral',
    toneHistory: [],
    intensity: 5,
    playerChaosLevel: 0,
    lastActionTone: 'neutral',
  };
}

/**
 * Analyze player input for emotional tone and intensity
 */
export function analyzePlayerTone(input: string): ToneAnalysis {
  const lowerInput = input.toLowerCase();
  
  let detectedTone: ToneCategory = 'neutral';
  let intensity = 5;
  
  // Check for tone signals in priority order
  const priorityOrder: ToneCategory[] = ['chaotic', 'violent', 'emotional', 'tense', 'calm'];
  
  for (const tone of priorityOrder) {
    if (TONE_SIGNALS[tone].test(lowerInput)) {
      detectedTone = tone;
      break;
    }
  }
  
  // Calculate intensity from markers
  const exclamations = (input.match(/!/g) || []).length;
  const capsWords = (input.match(/[A-Z]{2,}/g) || []).length;
  const questionMarks = (input.match(/\?/g) || []).length;
  const ellipses = (input.match(/\.{2,}/g) || []).length;
  
  // Base intensity varies by detected tone
  const baseIntensity: Record<ToneCategory, number> = {
    chaotic: 7,
    violent: 7,
    emotional: 6,
    tense: 5,
    calm: 3,
    neutral: 5,
  };
  
  intensity = baseIntensity[detectedTone];
  intensity += exclamations;
  intensity += capsWords * 2;
  intensity -= ellipses; // Ellipses suggest hesitation
  
  // Clamp to 1-10
  intensity = Math.max(1, Math.min(10, intensity));
  
  return { tone: detectedTone, intensity };
}

/**
 * Calculate the magnitude of tone shift between states
 */
export function calculateToneShift(previousTone: ToneCategory, newTone: ToneCategory): number {
  if (previousTone === newTone) return 0;
  
  const key1 = `${previousTone}-${newTone}`;
  const key2 = `${newTone}-${previousTone}`;
  
  return TONE_DISTANCES[key1] || TONE_DISTANCES[key2] || 1;
}

/**
 * Update tone state based on player action
 */
export function updateToneState(state: ToneState, playerTone: ToneAnalysis): ToneState {
  const newHistory = [...state.toneHistory, playerTone.tone].slice(-5);
  
  // Update chaos level
  let newChaosLevel = state.playerChaosLevel;
  if (playerTone.tone === 'chaotic' || playerTone.tone === 'violent') {
    newChaosLevel = Math.min(10, newChaosLevel + 2);
  } else if (playerTone.tone === 'calm' || playerTone.tone === 'neutral') {
    newChaosLevel = Math.max(0, newChaosLevel - 1);
  }
  
  return {
    currentTone: playerTone.tone,
    toneHistory: newHistory,
    intensity: playerTone.intensity,
    playerChaosLevel: newChaosLevel,
    lastActionTone: playerTone.tone,
  };
}

/**
 * Build tone context instructions for AI prompt
 */
export function buildToneContext(state: ToneState, playerTone: ToneAnalysis): string {
  const shift = calculateToneShift(state.currentTone, playerTone.tone);
  
  let toneInstructions = '';
  
  // Major tone shift detected
  if (shift >= 3) {
    toneInstructions = `
=== MAJOR TONE SHIFT DETECTED ===
The scene is shifting dramatically from ${state.currentTone.toUpperCase()} to ${playerTone.tone.toUpperCase()}.
- Acknowledge this shift naturally in the narrative
- Other characters should REACT to the sudden change in atmosphere/behavior
- Don't resist the player's emotional direction - flow WITH it
- Match intensity level: ${playerTone.intensity}/10
- If the player is being chaotic, the WORLD reacts to their chaos
- Do NOT try to calm the situation artificially - let the drama unfold
`;
  } else if (playerTone.intensity >= 7) {
    // High intensity scene
    toneInstructions = `
=== HIGH INTENSITY SCENE ===
Intensity Level: ${playerTone.intensity}/10
- Match the player's energy in your response
- Use shorter, punchier sentences
- Include sensory details (sounds, physical sensations, visceral reactions)
- NPCs react with appropriate urgency
- Consequences happen quickly
`;
  } else if (playerTone.intensity <= 3) {
    // Low intensity scene
    toneInstructions = `
=== CONTEMPLATIVE MOMENT ===
Intensity Level: ${playerTone.intensity}/10
- Allow the scene to breathe
- Include atmospheric details
- NPCs may be patient or curious
- Build subtle tension through environment
`;
  }
  
  // Track chaos level effects
  if (state.playerChaosLevel >= 6) {
    toneInstructions += `
PLAYER CHAOS LEVEL: ${state.playerChaosLevel}/10 (HIGH)
- The player has been acting erratically/intensely
- World should show mounting consequences for chaotic behavior
- NPCs remember and react to this pattern
- Don't lecture or moralize - show consequences through narrative
- Guards may be alerted, citizens may flee, opportunities may close
`;
  } else if (state.playerChaosLevel >= 3) {
    toneInstructions += `
PLAYER BEHAVIOR: Somewhat unpredictable (${state.playerChaosLevel}/10)
- NPCs may be wary or uncertain
- Small consequences beginning to accumulate
`;
  }
  
  // Add tone-specific narrative guidance
  const toneNarrativeGuide: Record<ToneCategory, string> = {
    chaotic: 'The world spins with urgency - describe rapid movements, competing sounds, overlapping sensations.',
    violent: 'Blood and adrenaline - describe impact, pain, primal reactions. Steel and bone and will.',
    emotional: 'Raw feeling rises - describe internal sensations, the weight of emotion made physical.',
    tense: 'Every shadow holds possibility - describe small sounds, subtle movements, pregnant pauses.',
    calm: 'The moment stretches - describe textures, ambient sounds, the simple act of existing.',
    neutral: 'The story flows - match the narrative needs of the scene.',
  };
  
  toneInstructions += `
NARRATIVE TONE: ${playerTone.tone.toUpperCase()}
${toneNarrativeGuide[playerTone.tone]}
`;
  
  return toneInstructions;
}

/**
 * Get tone decay for calm scenes
 */
export function decayToneState(state: ToneState): ToneState {
  return {
    ...state,
    intensity: Math.max(3, state.intensity - 1),
    playerChaosLevel: Math.max(0, state.playerChaosLevel - 0.5),
  };
}

/**
 * Serialize tone state for storage
 */
export function serializeToneState(state: ToneState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize tone state from storage
 */
export function deserializeToneState(data: string): ToneState {
  try {
    const parsed = JSON.parse(data);
    return {
      currentTone: parsed.currentTone || 'neutral',
      toneHistory: parsed.toneHistory || [],
      intensity: parsed.intensity || 5,
      playerChaosLevel: parsed.playerChaosLevel || 0,
      lastActionTone: parsed.lastActionTone || 'neutral',
    };
  } catch {
    return createInitialToneState();
  }
}
