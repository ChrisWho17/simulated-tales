// Voice Signature System - Make NPCs recognizable by dialogue alone
// "A favorite phrase, a speech tempo, a tell"

export type SpeechTempo = 'clipped' | 'measured' | 'flowing' | 'rambling' | 'staccato';
export type VoiceTrait = 
  | 'formal' | 'casual' | 'archaic' | 'modern' | 'technical'
  | 'poetic' | 'blunt' | 'evasive' | 'precise' | 'vague';

export interface VoiceSignature {
  npcId: string;
  // What they always say
  favoritePhrase: string;        // "Well, that's the thing..."
  verbalTic?: string;            // Filler words, repeated sounds
  greeting?: string;             // How they say hello
  farewell?: string;             // How they say goodbye
  exclamation?: string;          // What they say when surprised
  curse?: string;                // How they express frustration
  
  // How they speak
  tempo: SpeechTempo;
  voiceTrait: VoiceTrait;
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  usesContractions: boolean;
  usesQuestions: boolean;        // Tends to phrase things as questions?
  
  // Physical/behavioral tells
  tell: string;                  // "Avoids eye contact when lying"
  nervousHabit?: string;         // "Taps fingers when anxious"
  thinkingHabit?: string;        // "Looks up and to the left"
  comfortGesture?: string;       // "Touches old scar on wrist"
}

// Template voice signatures by archetype
export const VOICE_ARCHETYPES: Record<string, Partial<VoiceSignature>> = {
  merchant: {
    favoritePhrase: "Let me make you a deal...",
    tempo: 'flowing',
    voiceTrait: 'casual',
    sentenceLength: 'medium',
    usesContractions: true,
    usesQuestions: true,
    tell: "Rubs thumb against fingers when calculating",
    nervousHabit: "Straightens already-straight merchandise"
  },
  soldier: {
    favoritePhrase: "Copy that.",
    verbalTic: "Sir/Ma'am",
    tempo: 'clipped',
    voiceTrait: 'formal',
    sentenceLength: 'short',
    usesContractions: false,
    usesQuestions: false,
    tell: "Stands at parade rest even in casual conversation",
    nervousHabit: "Hand drifts toward weapon"
  },
  scholar: {
    favoritePhrase: "Fascinating, if you consider...",
    tempo: 'measured',
    voiceTrait: 'technical',
    sentenceLength: 'long',
    usesContractions: false,
    usesQuestions: true,
    tell: "Adjusts spectacles when thinking",
    thinkingHabit: "Steeples fingers"
  },
  criminal: {
    favoritePhrase: "Here's how it works...",
    tempo: 'staccato',
    voiceTrait: 'blunt',
    sentenceLength: 'short',
    usesContractions: true,
    usesQuestions: false,
    tell: "Never sits with back to door",
    nervousHabit: "Checks exits constantly"
  },
  noble: {
    favoritePhrase: "One must understand...",
    tempo: 'measured',
    voiceTrait: 'formal',
    sentenceLength: 'long',
    usesContractions: false,
    usesQuestions: false,
    tell: "Looks down nose even at taller people",
    comfortGesture: "Smooths expensive fabric"
  },
  trickster: {
    favoritePhrase: "Now, the interesting part...",
    verbalTic: "Right?",
    tempo: 'rambling',
    voiceTrait: 'casual',
    sentenceLength: 'varied',
    usesContractions: true,
    usesQuestions: true,
    tell: "Makes constant eye contact to seem honest",
    nervousHabit: "Talks faster when lying"
  },
  healer: {
    favoritePhrase: "Let me see what we can do...",
    tempo: 'flowing',
    voiceTrait: 'precise',
    sentenceLength: 'medium',
    usesContractions: true,
    usesQuestions: true,
    tell: "Unconsciously examines people for injuries",
    thinkingHabit: "Touches stethoscope/medical tools"
  },
  mystic: {
    favoritePhrase: "The patterns suggest...",
    tempo: 'measured',
    voiceTrait: 'poetic',
    sentenceLength: 'long',
    usesContractions: false,
    usesQuestions: true,
    tell: "Eyes unfocus when speaking of fate",
    thinkingHabit: "Traces invisible symbols in air"
  }
};

// Favorite phrases pool for variety
const FAVORITE_PHRASES = [
  "Well, that's the thing...",
  "Listen carefully now...",
  "Between you and me...",
  "Here's what I know...",
  "Mark my words...",
  "Truth be told...",
  "You want to hear something interesting?",
  "Let me put it this way...",
  "The way I see it...",
  "Word of advice?",
  "Don't say I didn't warn you...",
  "This stays between us...",
  "I've seen this before...",
  "People don't understand...",
  "Here's what they don't tell you..."
];

// Verbal tics pool
const VERBAL_TICS = [
  "you know?",
  "right?",
  "see?",
  "understand?",
  "yeah?",
  "hmm",
  "well",
  "look",
  "listen",
  "anyway",
  "basically",
  "honestly",
  "literally"
];

// Tells pool
const BEHAVIORAL_TELLS = [
  "Avoids eye contact when nervous",
  "Talks faster when excited",
  "Goes quiet when angry",
  "Jokes when uncomfortable",
  "Repeats your last words when stalling",
  "Touches face when lying",
  "Crosses arms when defensive",
  "Leans in when interested",
  "Steps back when threatened",
  "Laughs at inappropriate times",
  "Goes very still when afraid",
  "Smiles that doesn't reach their eyes",
  "Voice drops to whisper for emphasis",
  "Uses your name too often when nervous",
  "Changes subject when cornered"
];

// Generate a random voice signature
export function generateVoiceSignature(
  npcId: string,
  archetype?: string,
  seed?: number
): VoiceSignature {
  const base = archetype && VOICE_ARCHETYPES[archetype] 
    ? { ...VOICE_ARCHETYPES[archetype] } 
    : {};

  // Use seed for consistent generation if provided
  const random = seed !== undefined 
    ? () => ((seed * 9301 + 49297) % 233280) / 233280
    : Math.random;

  return {
    npcId,
    favoritePhrase: base.favoritePhrase || FAVORITE_PHRASES[Math.floor(random() * FAVORITE_PHRASES.length)],
    verbalTic: base.verbalTic || (random() > 0.6 ? VERBAL_TICS[Math.floor(random() * VERBAL_TICS.length)] : undefined),
    tempo: base.tempo || (['clipped', 'measured', 'flowing', 'rambling', 'staccato'] as SpeechTempo[])[Math.floor(random() * 5)],
    voiceTrait: base.voiceTrait || (['formal', 'casual', 'blunt', 'poetic', 'precise'] as VoiceTrait[])[Math.floor(random() * 5)],
    sentenceLength: base.sentenceLength || (['short', 'medium', 'long', 'varied'] as const)[Math.floor(random() * 4)],
    usesContractions: base.usesContractions ?? random() > 0.4,
    usesQuestions: base.usesQuestions ?? random() > 0.5,
    tell: base.tell || BEHAVIORAL_TELLS[Math.floor(random() * BEHAVIORAL_TELLS.length)],
    nervousHabit: base.nervousHabit,
    thinkingHabit: base.thinkingHabit,
    comfortGesture: base.comfortGesture
  };
}

// Build voice signature context for AI
export function buildVoiceSignatureContext(signatures: VoiceSignature[]): string {
  if (signatures.length === 0) return '';

  const lines = ['## NPC VOICE SIGNATURES - RECOGNIZABLE SPEECH PATTERNS'];
  lines.push('');
  lines.push('Each NPC should be recognizable by their dialogue alone. Use these traits consistently:');
  lines.push('');

  for (const sig of signatures) {
    lines.push(`### ${sig.npcId}`);
    lines.push(`**Signature phrase:** "${sig.favoritePhrase}"`);
    if (sig.verbalTic) lines.push(`**Verbal tic:** Uses "${sig.verbalTic}" frequently`);
    lines.push(`**Speech style:** ${sig.tempo} tempo, ${sig.voiceTrait} tone, ${sig.sentenceLength} sentences`);
    lines.push(`**Contractions:** ${sig.usesContractions ? 'Uses them' : 'Avoids them'}`);
    lines.push(`**Tell:** ${sig.tell}`);
    if (sig.nervousHabit) lines.push(`**When nervous:** ${sig.nervousHabit}`);
    if (sig.thinkingHabit) lines.push(`**When thinking:** ${sig.thinkingHabit}`);
    lines.push('');
  }

  lines.push('VOICE RULES:');
  lines.push('- Use the signature phrase naturally (not every time, but regularly)');
  lines.push('- Match speech tempo to their pattern');
  lines.push('- Show tells through action beats in dialogue');
  lines.push('- Players should recognize NPCs by speech alone');
  lines.push('- Consistency creates character');

  return lines.join('\n');
}

// Registry for storing voice signatures
export interface VoiceSignatureRegistry {
  signatures: Record<string, VoiceSignature>;
}

export function createVoiceSignatureRegistry(): VoiceSignatureRegistry {
  return { signatures: {} };
}

export function getOrCreateVoiceSignature(
  registry: VoiceSignatureRegistry,
  npcId: string,
  archetype?: string
): { registry: VoiceSignatureRegistry; signature: VoiceSignature } {
  if (registry.signatures[npcId]) {
    return { registry, signature: registry.signatures[npcId] };
  }

  const signature = generateVoiceSignature(npcId, archetype);
  return {
    registry: {
      signatures: { ...registry.signatures, [npcId]: signature }
    },
    signature
  };
}

export function serializeVoiceRegistry(registry: VoiceSignatureRegistry): string {
  return JSON.stringify(registry);
}

export function deserializeVoiceRegistry(data: string): VoiceSignatureRegistry {
  try {
    return JSON.parse(data);
  } catch {
    return createVoiceSignatureRegistry();
  }
}
