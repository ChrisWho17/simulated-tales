// ============================================================================
// EMOTIONAL STATE MACHINE - Character mood tracking and narrative integration
// Based on the Interconnected Game Prompt System Design
// ============================================================================

import { RPGCharacter } from '@/types/rpgCharacter';

// ============================================================================
// MOOD STATES
// ============================================================================

export type MoodState = 
  | 'neutral'
  | 'happy'
  | 'confident'
  | 'proud'
  | 'loving'
  | 'determined'
  | 'curious'
  | 'calm'
  | 'anxious'
  | 'afraid'
  | 'terrified'
  | 'sad'
  | 'desperate'
  | 'heartbroken'
  | 'angry'
  | 'enraged'
  | 'pained'
  | 'exhausted'
  | 'greedy'
  | 'suspicious';

export interface MoodTransition {
  from: MoodState;
  to: MoodState;
  trigger: string;
  intensity: number; // 0-1, how strong the transition is
}

export interface EmotionalState {
  currentMood: MoodState;
  moodIntensity: number; // 0-1, how strongly they feel it
  moodHistory: MoodTransition[];
  baselinePersonality: 'optimist' | 'realist' | 'pessimist' | 'stoic' | 'volatile';
  emotionalResilience: number; // 0-1, how quickly they return to neutral
}

// LIMIT for mood history
const MAX_MOOD_HISTORY = 15;

// ============================================================================
// MOOD MODIFIERS BY EVENT TYPE
// ============================================================================

interface MoodEffect {
  mood: MoodState;
  intensity: number;
  conditions?: {
    healthBelow?: number; // percentage
    healthAbove?: number;
    goldBelow?: number;
    goldAbove?: number;
    personalityNot?: string[];
  };
}

const EVENT_MOOD_EFFECTS: Record<string, MoodEffect[]> = {
  // Combat events
  'combat_victory': [
    { mood: 'confident', intensity: 0.7 },
    { mood: 'proud', intensity: 0.5 }
  ],
  'combat_victory_easy': [
    { mood: 'confident', intensity: 0.4 }
  ],
  'combat_victory_hard': [
    { mood: 'determined', intensity: 0.8 },
    { mood: 'proud', intensity: 0.7 }
  ],
  'combat_defeat': [
    { mood: 'pained', intensity: 0.6 },
    { mood: 'desperate', intensity: 0.4, conditions: { healthBelow: 25 } }
  ],
  'combat_fled': [
    { mood: 'anxious', intensity: 0.5 },
    { mood: 'afraid', intensity: 0.3 }
  ],
  
  // Health events
  'took_damage': [
    { mood: 'pained', intensity: 0.4 }
  ],
  'took_critical_damage': [
    { mood: 'pained', intensity: 0.8 },
    { mood: 'desperate', intensity: 0.6 }
  ],
  'healed': [
    { mood: 'calm', intensity: 0.3 }
  ],
  'fully_healed': [
    { mood: 'confident', intensity: 0.4 },
    { mood: 'calm', intensity: 0.5 }
  ],
  'near_death': [
    { mood: 'terrified', intensity: 0.9 },
    { mood: 'desperate', intensity: 0.8 }
  ],
  
  // Wealth events
  'gained_gold': [
    { mood: 'happy', intensity: 0.4 }
  ],
  'gained_treasure': [
    { mood: 'proud', intensity: 0.6 },
    { mood: 'greedy', intensity: 0.3 }
  ],
  'lost_gold': [
    { mood: 'anxious', intensity: 0.4 }
  ],
  'became_wealthy': [
    { mood: 'confident', intensity: 0.6 },
    { mood: 'proud', intensity: 0.5 }
  ],
  'became_poor': [
    { mood: 'desperate', intensity: 0.5 },
    { mood: 'anxious', intensity: 0.6 }
  ],
  
  // Social events
  'made_friend': [
    { mood: 'happy', intensity: 0.6 },
    { mood: 'loving', intensity: 0.3 }
  ],
  'betrayed': [
    { mood: 'heartbroken', intensity: 0.8 },
    { mood: 'angry', intensity: 0.6 }
  ],
  'helped_someone': [
    { mood: 'proud', intensity: 0.4 },
    { mood: 'happy', intensity: 0.3 }
  ],
  'was_helped': [
    { mood: 'happy', intensity: 0.5 }
  ],
  'insulted': [
    { mood: 'angry', intensity: 0.5 }
  ],
  'praised': [
    { mood: 'proud', intensity: 0.5 },
    { mood: 'happy', intensity: 0.4 }
  ],
  'romantic_success': [
    { mood: 'loving', intensity: 0.8 },
    { mood: 'happy', intensity: 0.7 }
  ],
  'romantic_rejection': [
    { mood: 'heartbroken', intensity: 0.6 },
    { mood: 'sad', intensity: 0.5 }
  ],
  
  // Discovery events
  'discovered_secret': [
    { mood: 'curious', intensity: 0.6 },
    { mood: 'determined', intensity: 0.4 }
  ],
  'discovered_threat': [
    { mood: 'afraid', intensity: 0.5 },
    { mood: 'anxious', intensity: 0.6 }
  ],
  'discovered_ally': [
    { mood: 'happy', intensity: 0.5 },
    { mood: 'calm', intensity: 0.3 }
  ],
  
  // Rest events
  'rested': [
    { mood: 'calm', intensity: 0.5 }
  ],
  'rested_safely': [
    { mood: 'calm', intensity: 0.7 }
  ],
  
  // Horror/danger events
  'witnessed_horror': [
    { mood: 'terrified', intensity: 0.8 },
    { mood: 'anxious', intensity: 0.6 }
  ],
  'survived_danger': [
    { mood: 'determined', intensity: 0.6 }
  ],
  
  // Achievement events
  'completed_quest': [
    { mood: 'proud', intensity: 0.7 },
    { mood: 'happy', intensity: 0.5 }
  ],
  'failed_quest': [
    { mood: 'sad', intensity: 0.5 },
    { mood: 'determined', intensity: 0.3, conditions: { personalityNot: ['pessimist'] } }
  ],
  'leveled_up': [
    { mood: 'proud', intensity: 0.6 },
    { mood: 'confident', intensity: 0.5 }
  ]
};

// ============================================================================
// MOOD DESCRIPTIONS FOR NARRATIVE
// ============================================================================

export const MOOD_NARRATIVE_DESCRIPTORS: Record<MoodState, {
  internalState: string[];
  physicalSigns: string[];
  dialogueTone: string;
  actionFlavor: string;
}> = {
  neutral: {
    internalState: ['calm and collected', 'composed', 'steady'],
    physicalSigns: ['steady gaze', 'relaxed posture'],
    dialogueTone: 'measured',
    actionFlavor: 'methodically'
  },
  happy: {
    internalState: ['a warm feeling blooms in your chest', 'spirits lifted', 'joy bubbles within'],
    physicalSigns: ['a smile plays on your lips', 'eyes bright with joy'],
    dialogueTone: 'cheerful',
    actionFlavor: 'eagerly'
  },
  confident: {
    internalState: ['certainty fills you', 'you know you can handle this', 'nothing can stop you now'],
    physicalSigns: ['standing tall', 'chin held high', 'steady hands'],
    dialogueTone: 'assured',
    actionFlavor: 'boldly'
  },
  proud: {
    internalState: ['chest swelling with pride', 'satisfaction warms you', 'you have proven yourself'],
    physicalSigns: ['shoulders squared', 'bearing regal'],
    dialogueTone: 'dignified',
    actionFlavor: 'triumphantly'
  },
  loving: {
    internalState: ['heart full of warmth', 'tender feelings overflow', 'deep affection stirs'],
    physicalSigns: ['soft eyes', 'gentle expression', 'warm gaze'],
    dialogueTone: 'tender',
    actionFlavor: 'gently'
  },
  determined: {
    internalState: ['resolve hardens within', 'nothing will stop you', 'you will see this through'],
    physicalSigns: ['jaw set', 'eyes focused', 'fists clenched'],
    dialogueTone: 'resolute',
    actionFlavor: 'resolutely'
  },
  curious: {
    internalState: ['questions burn in your mind', 'you need to know more', 'intrigue pulls at you'],
    physicalSigns: ['leaning forward', 'eyes scanning', 'head tilted'],
    dialogueTone: 'inquisitive',
    actionFlavor: 'carefully'
  },
  calm: {
    internalState: ['peace settles over you', 'tranquility fills the moment', 'at ease'],
    physicalSigns: ['breathing slow and even', 'relaxed shoulders'],
    dialogueTone: 'serene',
    actionFlavor: 'peacefully'
  },
  anxious: {
    internalState: ['worry gnaws at you', 'unease coils in your stomach', 'something feels wrong'],
    physicalSigns: ['restless movements', 'darting eyes', 'fidgeting hands'],
    dialogueTone: 'nervous',
    actionFlavor: 'hesitantly'
  },
  afraid: {
    internalState: ['fear grips your heart', 'dread creeps through you', 'instincts scream danger'],
    physicalSigns: ['wide eyes', 'trembling slightly', 'pale face'],
    dialogueTone: 'shaky',
    actionFlavor: 'fearfully'
  },
  terrified: {
    internalState: ['primal terror seizes you', 'every fiber screams to flee', 'paralyzed by fear'],
    physicalSigns: ['shaking uncontrollably', 'frozen in place', 'gasping breaths'],
    dialogueTone: 'panicked',
    actionFlavor: 'desperately'
  },
  sad: {
    internalState: ['sorrow weighs heavy', 'melancholy clouds your thoughts', 'grief lingers'],
    physicalSigns: ['downcast eyes', 'slumped shoulders', 'heavy sighs'],
    dialogueTone: 'somber',
    actionFlavor: 'wearily'
  },
  desperate: {
    internalState: ['no other choice remains', 'pushed to the limit', 'everything hangs by a thread'],
    physicalSigns: ['wild-eyed', 'ragged breathing', 'frantic movements'],
    dialogueTone: 'pleading',
    actionFlavor: 'frantically'
  },
  heartbroken: {
    internalState: ['your heart shatters', 'betrayal cuts deep', 'loss consumes you'],
    physicalSigns: ['tear-stained cheeks', 'hollow expression', 'chest aching'],
    dialogueTone: 'broken',
    actionFlavor: 'numbly'
  },
  angry: {
    internalState: ['rage simmers beneath the surface', 'frustration boils over', 'offense burns'],
    physicalSigns: ['clenched jaw', 'narrowed eyes', 'tight fists'],
    dialogueTone: 'sharp',
    actionFlavor: 'aggressively'
  },
  enraged: {
    internalState: ['fury consumes all thought', 'blinding rage takes hold', 'wrath demands release'],
    physicalSigns: ['face flushed with anger', 'veins visible', 'muscles tensed'],
    dialogueTone: 'thunderous',
    actionFlavor: 'violently'
  },
  pained: {
    internalState: ['agony pulses through you', 'every movement hurts', 'wounds cry out'],
    physicalSigns: ['grimacing', 'clutching wounds', 'labored breathing'],
    dialogueTone: 'strained',
    actionFlavor: 'painfully'
  },
  exhausted: {
    internalState: ['weariness seeps into your bones', 'fatigue clouds your mind', 'rest calls to you'],
    physicalSigns: ['drooping eyelids', 'sluggish movements', 'yawning'],
    dialogueTone: 'tired',
    actionFlavor: 'sluggishly'
  },
  greedy: {
    internalState: ['desire for more consumes you', 'avarice whispers', 'never enough'],
    physicalSigns: ['eyes gleaming', 'hands reaching', 'possessive stance'],
    dialogueTone: 'eager',
    actionFlavor: 'greedily'
  },
  suspicious: {
    internalState: ['distrust colors every thought', 'something is not right', 'watching for betrayal'],
    physicalSigns: ['narrowed eyes', 'guarded stance', 'watching carefully'],
    dialogueTone: 'wary',
    actionFlavor: 'cautiously'
  }
};

// ============================================================================
// EMOTIONAL STATE FUNCTIONS
// ============================================================================

export function createInitialEmotionalState(personality?: string): EmotionalState {
  const baselineMap: Record<string, EmotionalState['baselinePersonality']> = {
    'cheerful': 'optimist',
    'brooding': 'pessimist',
    'stoic': 'stoic',
    'hot-headed': 'volatile',
    'balanced': 'realist'
  };
  
  return {
    currentMood: 'neutral',
    moodIntensity: 0.5,
    moodHistory: [],
    baselinePersonality: baselineMap[personality || 'balanced'] || 'realist',
    emotionalResilience: 0.5
  };
}

export function processEventForMood(
  state: EmotionalState,
  eventType: string,
  character: RPGCharacter
): EmotionalState {
  const effects = EVENT_MOOD_EFFECTS[eventType];
  if (!effects || effects.length === 0) return state;
  
  // Calculate health and wealth percentages
  const healthPercent = (character.currentHealth / character.maxHealth) * 100;
  
  // Find the best matching effect
  let bestEffect: MoodEffect | null = null;
  let highestIntensity = 0;
  
  for (const effect of effects) {
    // Check conditions
    if (effect.conditions) {
      if (effect.conditions.healthBelow && healthPercent >= effect.conditions.healthBelow) continue;
      if (effect.conditions.healthAbove && healthPercent <= effect.conditions.healthAbove) continue;
      if (effect.conditions.goldBelow && character.gold >= effect.conditions.goldBelow) continue;
      if (effect.conditions.goldAbove && character.gold <= effect.conditions.goldAbove) continue;
      if (effect.conditions.personalityNot?.includes(state.baselinePersonality)) continue;
    }
    
    // Personality modifiers
    let adjustedIntensity = effect.intensity;
    if (state.baselinePersonality === 'stoic') {
      adjustedIntensity *= 0.6; // Stoic characters feel less intensely
    } else if (state.baselinePersonality === 'volatile') {
      adjustedIntensity *= 1.4; // Volatile characters feel more intensely
    }
    
    if (adjustedIntensity > highestIntensity) {
      highestIntensity = adjustedIntensity;
      bestEffect = effect;
    }
  }
  
  if (!bestEffect) return state;
  
  // Record the transition
  const transition: MoodTransition = {
    from: state.currentMood,
    to: bestEffect.mood,
    trigger: eventType,
    intensity: highestIntensity
  };
  
  return {
    ...state,
    currentMood: bestEffect.mood,
    moodIntensity: Math.min(1, highestIntensity),
    moodHistory: [...state.moodHistory.slice(-(MAX_MOOD_HISTORY - 1)), transition] // Keep limited transitions
  };
}

export function getMoodNarrativeContext(state: EmotionalState): {
  internalDescription: string;
  physicalDescription: string;
  dialogueTone: string;
  actionFlavor: string;
} {
  const descriptors = MOOD_NARRATIVE_DESCRIPTORS[state.currentMood];
  const randomIndex = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  return {
    internalDescription: randomIndex(descriptors.internalState),
    physicalDescription: randomIndex(descriptors.physicalSigns),
    dialogueTone: descriptors.dialogueTone,
    actionFlavor: descriptors.actionFlavor
  };
}

export function formatMoodForAI(state: EmotionalState, characterName: string): string {
  const context = getMoodNarrativeContext(state);
  const intensityWord = state.moodIntensity > 0.7 ? 'intensely' : 
                        state.moodIntensity > 0.4 ? 'noticeably' : 'slightly';
  
  return `[CHARACTER EMOTIONAL STATE]
${characterName} is currently feeling ${intensityWord} ${state.currentMood}.
Internal state: ${context.internalDescription}
Physical signs: ${context.physicalDescription}
Dialogue should be ${context.dialogueTone}
Actions should be performed ${context.actionFlavor}

Use this emotional context to flavor narrative descriptions, dialogue options, and NPC reactions. The character's mood should subtly influence how scenes unfold.`;
}

export function shouldMoodDecay(state: EmotionalState, ticksSinceChange: number): boolean {
  // More resilient characters recover faster
  const decayThreshold = Math.floor(5 / state.emotionalResilience);
  return ticksSinceChange >= decayThreshold && state.currentMood !== 'neutral';
}

export function decayMoodTowardsNeutral(state: EmotionalState): EmotionalState {
  if (state.currentMood === 'neutral') return state;
  
  // Reduce intensity, and if low enough, return to neutral
  const newIntensity = state.moodIntensity - (0.2 * state.emotionalResilience);
  
  if (newIntensity <= 0.2) {
    return {
      ...state,
      currentMood: 'neutral',
      moodIntensity: 0.5,
      moodHistory: [...state.moodHistory.slice(-(MAX_MOOD_HISTORY - 1)), {
        from: state.currentMood,
        to: 'neutral',
        trigger: 'natural_decay',
        intensity: 0.5
      }]
    };
  }
  
  return {
    ...state,
    moodIntensity: newIntensity
  };
}

// ============================================================================
// HEALTH/CURRENCY MOOD TRIGGERS
// ============================================================================

export function checkHealthMoodTrigger(
  previousHealth: number,
  currentHealth: number,
  maxHealth: number
): string | null {
  const prevPercent = (previousHealth / maxHealth) * 100;
  const currPercent = (currentHealth / maxHealth) * 100;
  
  // Near death
  if (currPercent <= 10 && prevPercent > 10) return 'near_death';
  
  // Took critical damage
  if (currentHealth < previousHealth && (previousHealth - currentHealth) > maxHealth * 0.3) {
    return 'took_critical_damage';
  }
  
  // Took damage
  if (currentHealth < previousHealth) return 'took_damage';
  
  // Fully healed
  if (currPercent >= 100 && prevPercent < 100) return 'fully_healed';
  
  // Healed
  if (currentHealth > previousHealth) return 'healed';
  
  return null;
}

export function checkWealthMoodTrigger(
  previousGold: number,
  currentGold: number
): string | null {
  const diff = currentGold - previousGold;
  
  // Became wealthy
  if (currentGold >= 1000 && previousGold < 1000) return 'became_wealthy';
  
  // Became poor
  if (currentGold <= 10 && previousGold > 10) return 'became_poor';
  
  // Gained treasure (large amount)
  if (diff >= 100) return 'gained_treasure';
  
  // Gained gold
  if (diff > 0) return 'gained_gold';
  
  // Lost gold
  if (diff < 0) return 'lost_gold';
  
  return null;
}
