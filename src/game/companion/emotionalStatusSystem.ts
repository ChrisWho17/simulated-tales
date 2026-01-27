// ============================================================================
// EMOTIONAL STATUS SYSTEM - Companions dynamically select emotional states
// ============================================================================
// Allows companions to evaluate their emotional status based on relationships,
// likes, dislikes, recent actions, and their personality.

import { CompanionState, CompanionMood, PersonalityTrait, PlayerActionType } from './companionTypes';

// ============================================================================
// EMOTIONAL EVALUATION FACTORS
// ============================================================================

export interface EmotionalContext {
  // Recent player actions
  recentPlayerActions: PlayerActionType[];
  // NPCs in scene
  npcsPresent: { id: string; name: string; relationship?: 'friend' | 'enemy' | 'neutral' }[];
  // Environmental factors
  inCombat: boolean;
  inDanger: boolean;
  justWonVictory: boolean;
  justSufferedLoss: boolean;
  // Time/Setting
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
  weather: string;
}

export interface EmotionalEvaluation {
  primaryMood: CompanionMood;
  intensity: number; // 0-100
  reason: string;
  voiceModifier: MoodVoiceModifier;
  willVoiceOpinion: boolean;
  opinionToVoice?: string;
}

// ============================================================================
// MOOD VOICE MODIFIERS - How mood changes speaking style
// ============================================================================

export interface MoodVoiceModifier {
  rhythmShift: string | null;
  toneShift: string;
  volumeLevel: 'whisper' | 'quiet' | 'normal' | 'loud' | 'shouting';
  pacingShift: string;
  emotionalBleed: string[];
  verbalPatterns: string[];
}

const MOOD_VOICE_MODIFIERS: Record<CompanionMood, MoodVoiceModifier> = {
  joyful: {
    rhythmShift: 'flowing and animated',
    toneShift: 'warm, bright, enthusiastic',
    volumeLevel: 'normal',
    pacingShift: 'quicker with bursts of energy',
    emotionalBleed: ['laughter in voice', 'genuine warmth', 'infectious enthusiasm'],
    verbalPatterns: ['uses more exclamations', 'shares positive observations', 'compliments freely'],
  },
  content: {
    rhythmShift: 'measured and relaxed',
    toneShift: 'calm, pleasant, at ease',
    volumeLevel: 'normal',
    pacingShift: 'unhurried and comfortable',
    emotionalBleed: ['subtle satisfaction', 'quiet contentment'],
    verbalPatterns: ['reflective comments', 'appreciative remarks', 'peaceful observations'],
  },
  neutral: {
    rhythmShift: null,
    toneShift: 'standard, unaffected',
    volumeLevel: 'normal',
    pacingShift: 'steady',
    emotionalBleed: [],
    verbalPatterns: [],
  },
  annoyed: {
    rhythmShift: 'clipped and terse',
    toneShift: 'irritated, sharp edges',
    volumeLevel: 'normal',
    pacingShift: 'faster with abrupt endings',
    emotionalBleed: ['sighs frequently', 'eye rolls implied', 'forced patience'],
    verbalPatterns: ['sarcastic undertones', 'dismissive phrases', 'cutting remarks'],
  },
  angry: {
    rhythmShift: 'staccato and forceful',
    toneShift: 'heated, dangerous, barely controlled',
    volumeLevel: 'loud',
    pacingShift: 'intense bursts, controlled fury',
    emotionalBleed: ['voice drops low', 'jaw clenched', 'words through teeth', 'dangerous calm before explosion'],
    verbalPatterns: ['short declarative sentences', 'accusations', 'ultimatums', 'profanity breaks through'],
  },
  sad: {
    rhythmShift: 'halting with long pauses',
    toneShift: 'melancholic, subdued, distant',
    volumeLevel: 'quiet',
    pacingShift: 'slow, with trailing silences',
    emotionalBleed: ['voice catches', 'sighs heavily', 'looks away', 'distant stare'],
    verbalPatterns: ['incomplete thoughts', 'self-deprecating', 'reminiscing about better times'],
  },
  fearful: {
    rhythmShift: 'breathless and erratic',
    toneShift: 'high, strained, trembling',
    volumeLevel: 'whisper',
    pacingShift: 'rushed, stuttering, nervous',
    emotionalBleed: ['voice shakes', 'swallows hard', 'eyes dart around', 'flinches at sounds'],
    verbalPatterns: ['questions everything', 'seeks reassurance', 'warns constantly', 'catastrophizes'],
  },
  disgusted: {
    rhythmShift: 'clipped with distancing',
    toneShift: 'cold, repulsed, dismissive',
    volumeLevel: 'normal',
    pacingShift: 'quick to disengage',
    emotionalBleed: ['nose wrinkles', 'steps back', 'looks away in revulsion'],
    verbalPatterns: ['monosyllabic responses', 'refusal to engage', 'moral judgments'],
  },
  romantic: {
    rhythmShift: 'flowing and lingering',
    toneShift: 'soft, warm, intimate',
    volumeLevel: 'quiet',
    pacingShift: 'gentle, with meaningful pauses',
    emotionalBleed: ['voice softens', 'eyes linger', 'unconscious leaning in', 'nervous touching of hair'],
    verbalPatterns: ['more personal questions', 'compliments appearance', 'shares vulnerabilities', 'uses names more'],
  },
  betrayed: {
    rhythmShift: 'strained and guarded',
    toneShift: 'bitter, hurt, accusatory',
    volumeLevel: 'quiet',
    pacingShift: 'measured with painful pauses',
    emotionalBleed: ['voice breaks', 'bitter laugh', 'looks away wounded', 'walls going up'],
    verbalPatterns: ['references the betrayal', 'trust-based accusations', 'cold formality', 'refuses eye contact'],
  },
};

// ============================================================================
// EMOTIONAL TRIGGERS - What causes mood shifts
// ============================================================================

interface EmotionalTrigger {
  condition: (companion: CompanionState, context: EmotionalContext) => boolean;
  moodResult: CompanionMood;
  intensityModifier: number;
  reason: string;
}

const EMOTIONAL_TRIGGERS: EmotionalTrigger[] = [
  // Combat/Danger triggers
  {
    condition: (c, ctx) => ctx.inCombat && c.personality.traits.includes('cowardly'),
    moodResult: 'fearful',
    intensityModifier: 30,
    reason: 'Their cowardly nature makes them terrified in combat',
  },
  {
    condition: (c, ctx) => ctx.inCombat && c.personality.traits.includes('brave'),
    moodResult: 'joyful',
    intensityModifier: 20,
    reason: 'The brave thrill of battle excites them',
  },
  {
    condition: (c, ctx) => ctx.justWonVictory,
    moodResult: 'joyful',
    intensityModifier: 40,
    reason: 'Victory brings elation',
  },
  {
    condition: (c, ctx) => ctx.justSufferedLoss,
    moodResult: 'sad',
    intensityModifier: 50,
    reason: 'The loss weighs heavily on them',
  },
  
  // Player action triggers
  {
    condition: (c, ctx) => ctx.recentPlayerActions.some(a => c.personality.approves.includes(a as any)),
    moodResult: 'content',
    intensityModifier: 20,
    reason: 'Pleased by recent actions they approve of',
  },
  {
    condition: (c, ctx) => ctx.recentPlayerActions.some(a => c.personality.disapproves.includes(a as any)),
    moodResult: 'annoyed',
    intensityModifier: 25,
    reason: 'Upset by recent actions they disapprove of',
  },
  {
    condition: (c, ctx) => ctx.recentPlayerActions.includes('cruelty') && c.personality.traits.includes('kind'),
    moodResult: 'disgusted',
    intensityModifier: 40,
    reason: 'Deeply disturbed by witnessed cruelty',
  },
  {
    condition: (c, ctx) => ctx.recentPlayerActions.includes('betrayal'),
    moodResult: 'betrayed',
    intensityModifier: 60,
    reason: 'Feels personally betrayed',
  },
  
  // Relationship-based triggers
  {
    condition: (c) => c.affinity > 70 && c.romanticInterest > 50,
    moodResult: 'romantic',
    intensityModifier: 30,
    reason: 'Strong romantic feelings color their interactions',
  },
  {
    condition: (c) => c.affinity < -30,
    moodResult: 'annoyed',
    intensityModifier: 20,
    reason: 'Low relationship creates constant friction',
  },
  {
    condition: (c) => c.trust < 20 && c.wasBetrayed,
    moodResult: 'betrayed',
    intensityModifier: 50,
    reason: 'Trust shattered, wound still raw',
  },
  {
    condition: (c) => c.fear > 50,
    moodResult: 'fearful',
    intensityModifier: 60,
    reason: 'High fear dominates their emotional state',
  },
  
  // Personality-based baselines
  {
    condition: (c) => c.personality.traits.includes('pessimistic' as any),
    moodResult: 'annoyed',
    intensityModifier: 15,
    reason: 'Natural pessimism colors their outlook',
  },
  {
    condition: (c) => c.personality.traits.includes('optimistic' as any),
    moodResult: 'content',
    intensityModifier: 15,
    reason: 'Natural optimism brightens their mood',
  },
];

// ============================================================================
// CORE EVALUATION FUNCTION
// ============================================================================

export function evaluateEmotionalStatus(
  companion: CompanionState,
  context: EmotionalContext
): EmotionalEvaluation {
  // Start with current mood as baseline
  let resultMood: CompanionMood = companion.mood;
  let highestIntensity = companion.moodIntensity;
  let reason = 'Maintaining current emotional state';
  
  // Check each trigger
  for (const trigger of EMOTIONAL_TRIGGERS) {
    try {
      if (trigger.condition(companion, context)) {
        const intensity = trigger.intensityModifier;
          
        // Use the highest intensity trigger
        if (intensity > highestIntensity ||
            (intensity >= highestIntensity - 10 && trigger.moodResult !== resultMood)) {
          resultMood = trigger.moodResult;
          highestIntensity = Math.min(100, intensity);
          reason = trigger.reason;
        }
      }
    } catch (e) {
      console.warn('[EmotionalStatus] Trigger evaluation error:', e);
    }
  }
  
  // Get voice modifier for this mood
  const voiceModifier = MOOD_VOICE_MODIFIERS[resultMood] || MOOD_VOICE_MODIFIERS.neutral;
  
  // Determine if they'll voice an opinion
  const willVoiceOpinion = highestIntensity > 40 && resultMood !== 'neutral';
  const opinionToVoice = willVoiceOpinion 
    ? generateMoodOpinion(companion, resultMood, reason)
    : undefined;
  
  return {
    primaryMood: resultMood,
    intensity: highestIntensity,
    reason,
    voiceModifier,
    willVoiceOpinion,
    opinionToVoice,
  };
}

// ============================================================================
// OPINION GENERATION
// ============================================================================

function generateMoodOpinion(
  companion: CompanionState,
  mood: CompanionMood,
  reason: string
): string {
  const name = companion.name;
  
  const opinionTemplates: Record<CompanionMood, string[]> = {
    joyful: [
      `${name}'s eyes light up with genuine excitement.`,
      `A rare, unguarded smile crosses ${name}'s face.`,
      `${name} seems energized, their usual guard momentarily down.`,
    ],
    content: [
      `${name} seems at ease, a subtle satisfaction in their demeanor.`,
      `There's a quiet peace about ${name} right now.`,
    ],
    neutral: [],
    annoyed: [
      `${name}'s jaw tightens with barely concealed irritation.`,
      `A flash of frustration crosses ${name}'s features.`,
      `${name} lets out a weighted sigh, clearly displeased.`,
    ],
    angry: [
      `${name}'s hands clench into fists, fury barely contained.`,
      `The temperature seems to drop around ${name} as their anger crystallizes.`,
      `${name}'s voice drops to a dangerous quiet. Someone will answer for this.`,
    ],
    sad: [
      `${name} falls quiet, a distant look in their eyes.`,
      `Something in ${name}'s expression dims, a weight settling on their shoulders.`,
      `${name} turns away slightly, hiding whatever emotion threatens to surface.`,
    ],
    fearful: [
      `${name}'s eyes dart nervously, tension coiling in their frame.`,
      `${name} edges closer to you, seeking unconscious protection.`,
      `A tremor runs through ${name}'s hands despite their effort to hide it.`,
    ],
    disgusted: [
      `${name} physically recoils, unable to mask their revulsion.`,
      `A cold disdain settles over ${name}'s features.`,
      `${name} looks away, unwilling to witness any more.`,
    ],
    romantic: [
      `${name}'s gaze lingers a moment longer than necessary.`,
      `A slight flush colors ${name}'s cheeks when your eyes meet.`,
      `${name} finds reasons to stand closer, their presence warm.`,
    ],
    betrayed: [
      `${name}'s expression closes off, walls going up brick by brick.`,
      `The hurt in ${name}'s eyes is quickly masked by cold distance.`,
      `${name} takes a deliberate step back, the space suddenly heavy between you.`,
    ],
  };
  
  const templates = opinionTemplates[mood] || [];
  return templates[Math.floor(Math.random() * templates.length)] || '';
}

// ============================================================================
// BUILD MOOD-AWARE SPEECH INSTRUCTIONS
// ============================================================================

export function buildMoodAwareSpeechInstructions(
  companion: CompanionState,
  evaluation: EmotionalEvaluation
): string {
  const modifier = evaluation.voiceModifier;
  
  const instructions: string[] = [
    `CURRENT EMOTIONAL STATE: ${evaluation.primaryMood.toUpperCase()} (intensity: ${evaluation.intensity}/100)`,
    `Reason: ${evaluation.reason}`,
    '',
    'VOICE MODIFICATION FOR THIS MOOD:',
  ];
  
  if (modifier.rhythmShift) {
    instructions.push(`- Rhythm: ${modifier.rhythmShift}`);
  }
  instructions.push(`- Tone: ${modifier.toneShift}`);
  instructions.push(`- Volume: ${modifier.volumeLevel}`);
  instructions.push(`- Pacing: ${modifier.pacingShift}`);
  
  if (modifier.emotionalBleed.length > 0) {
    instructions.push('');
    instructions.push('EMOTIONAL TELLS (incorporate these physical cues):');
    modifier.emotionalBleed.forEach(bleed => {
      instructions.push(`  - ${bleed}`);
    });
  }
  
  if (modifier.verbalPatterns.length > 0) {
    instructions.push('');
    instructions.push('VERBAL PATTERNS (adjust speech accordingly):');
    modifier.verbalPatterns.forEach(pattern => {
      instructions.push(`  - ${pattern}`);
    });
  }
  
  return instructions.join('\n');
}

// ============================================================================
// QUICK MOOD CHECK
// ============================================================================

export function getQuickMoodDescription(mood: CompanionMood, intensity: number): string {
  const modifier = MOOD_VOICE_MODIFIERS[mood];
  if (!modifier || mood === 'neutral') {
    return 'Speaking normally';
  }
  
  const intensityWord = intensity > 70 ? 'intensely' : intensity > 40 ? 'noticeably' : 'slightly';
  return `${intensityWord} ${mood}: ${modifier.toneShift}`;
}

// Export voice modifiers for external use
export { MOOD_VOICE_MODIFIERS };

console.log('[EmotionalStatusSystem] Module loaded');
