// ============================================================================
// RANDOMIZED SPEECH SYSTEM - Every personality creates a unique voice
// ============================================================================
// Makes every NPC/companion sound distinct based on their traits, mood, and background

import { PersonalityTrait, MentalState, ExperienceLevel, SocialDisposition } from './npcPersonalityTemplates';
import { CompanionMood, PersonalityTrait as CompanionTrait } from './companionSystem';

// ============================================================================
// SPEECH COMPONENTS - Building blocks for unique voices
// ============================================================================

export type SpeechRhythm = 
  | 'staccato' | 'flowing' | 'halting' | 'measured' | 'rapid-fire' 
  | 'drawling' | 'clipped' | 'melodic' | 'monotone' | 'breathless';

export type WordChoice = 
  | 'simple' | 'elaborate' | 'crude' | 'refined' | 'technical'
  | 'poetic' | 'slang-heavy' | 'archaic' | 'modern' | 'mixed';

export type EmotionalExpression = 
  | 'restrained' | 'explosive' | 'subtle' | 'dramatic' | 'deadpan'
  | 'sincere' | 'guarded' | 'theatrical' | 'understated' | 'volatile';

export type HumorStyle =
  | 'dry' | 'dark' | 'slapstick' | 'witty' | 'sardonic' | 'none'
  | 'self-deprecating' | 'observational' | 'absurdist' | 'sarcastic';

export type ConfidenceLevel =
  | 'cocky' | 'assured' | 'uncertain' | 'humble' | 'arrogant'
  | 'defensive' | 'quiet' | 'boastful' | 'modest' | 'nervous';

// ============================================================================
// VOICE PROFILE - Complete speech DNA for a character
// ============================================================================

export interface VoiceProfile {
  id: string;
  
  // Core speech patterns
  rhythm: SpeechRhythm;
  wordChoice: WordChoice;
  emotionalExpression: EmotionalExpression;
  humorStyle: HumorStyle;
  confidenceLevel: ConfidenceLevel;
  
  // Sentence construction
  averageSentenceLength: 'very-short' | 'short' | 'medium' | 'long' | 'varied';
  usesContractions: boolean;
  usesQuestions: boolean;
  usesExclamations: boolean;
  usesEllipses: boolean;
  usesInterruptions: boolean;
  
  // Verbal quirks (randomly selected)
  signaturePhrase: string;
  verbalTic: string | null;
  filler: string | null;
  exclamation: string;
  curse: string;
  greeting: string;
  farewell: string;
  agreement: string;
  disagreement: string;
  thinking: string;
  
  // Physical/behavioral tells
  nervousHabit: string;
  thinkingHabit: string;
  angryTell: string;
  lyingTell: string;
  
  // Accent/dialect hints
  accentHint: string | null;
  dialectWords: string[];
  
  // Emotional modifiers
  moodModifiers: Record<string, string>;
}

// ============================================================================
// RANDOMIZATION POOLS - Rich variety for unique combinations
// ============================================================================

const SIGNATURE_PHRASES = [
  // Philosophical
  "The way I see it...", "Here's the thing...", "Truth be told...",
  "Mark my words...", "Between us...", "Consider this...",
  "Let me put it plainly...", "You want honesty?", "Here's what I know...",
  
  // Casual
  "Look...", "So here's the deal...", "Thing is...",
  "Okay but listen...", "Right, so...", "Fair enough but...",
  
  // Formal
  "If I may...", "One might observe...", "It bears mentioning...",
  "Allow me to explain...", "Permit me a thought...", "In my estimation...",
  
  // Rough/Street
  "Word of advice?", "No lie...", "Real talk...",
  "Straight up...", "I ain't gonna sugarcoat it...", "Listen here...",
  
  // Military/Professional
  "Situation is...", "Here's the intel...", "Let's be clear...",
  "Bottom line...", "Mission parameters are...", "Understood, but...",
  
  // Cryptic/Mysterious
  "The patterns suggest...", "There are things unseen...", "Watch carefully...",
  "Not all is as it seems...", "The signs are there...", "Curious, isn't it...",
  
  // Weary/Experienced
  "I've seen this before...", "Trust me on this...", "Learn from my mistakes...",
  "Same story, different day...", "You remind me of...", "Back in my time...",
  
  // Emotional
  "I just feel like...", "You know what hurts?", "Can I be honest?",
  "From the heart...", "I never told anyone but...", "It's complicated...",
];

const VERBAL_TICS = [
  // Question tags
  "you know?", "right?", "see?", "get me?", "yeah?", "understand?",
  "wouldn't you say?", "don't you think?", "make sense?", "follow?",
  
  // Fillers
  "like", "basically", "literally", "honestly", "actually", "obviously",
  "anyway", "whatever", "supposedly", "apparently", "evidently",
  
  // Sounds
  "hmm", "mm", "eh", "ah", "er", "uh", "well", "so", "now then",
  
  // Self-reference
  "if you ask me", "in my opinion", "from what I gather", "as I understand it",
  
  // Trailing
  "or something", "and stuff", "and whatnot", "if that makes sense", "or whatever",
];

const FILLER_WORDS = [
  null, null, null, // Many characters have no filler
  "um", "uh", "er", "well", "like", "so", "anyway",
  "basically", "you know", "I mean", "right",
];

const EXCLAMATIONS = [
  // Mild
  "Oh!", "Ah!", "Well!", "My!", "Goodness!", "Dear me!",
  
  // Strong
  "Damn!", "Hell!", "Blast!", "Fire and fury!", "By the gods!",
  
  // Unique
  "Stars above!", "Blood and ashes!", "Seven hells!", "Great spirits!",
  "Mother of mercy!", "Saints preserve us!", "Ancestors witness!",
  
  // Crude
  "Shit!", "Son of a—!", "What the—!", "For fuck's sake!",
  
  // Archaic
  "Zounds!", "Egads!", "By my troth!", "Forsooth!",
];

const CURSES = [
  // Mild
  "Dammit.", "Blast it.", "Confound it.", "Curses.",
  
  // Moderate
  "Son of a bitch.", "To hell with this.", "Bloody hell.",
  
  // Creative
  "Rot and ruin.", "Ash and cinders.", "Plague take it.",
  "May the crows feast on this day.", "Dark winds carry this away.",
  
  // Character-specific styles
  "This displeases me greatly.", "How... unfortunate.",
  "I expected nothing and I'm still disappointed.",
  "[mutters something unprintable]", "[long string of profanity]",
];

const GREETINGS = [
  // Casual
  "Hey.", "Hi there.", "Oh, it's you.", "What's up?", "Yo.",
  
  // Formal
  "Greetings.", "Good day.", "Salutations.", "Well met.", "A pleasure.",
  
  // Warm
  "There you are!", "Good to see you!", "Ah, my friend!", "Welcome!",
  
  // Cold
  "You.", "What do you want?", "Oh. It's you.", "...Yes?", "Hmm.",
  
  // Unique
  "*nods*", "*raises eyebrow*", "*waves dismissively*", "*grins*",
  "I was hoping you'd come.", "Right on time.", "Finally.",
];

const FAREWELLS = [
  // Casual
  "Later.", "See ya.", "Take care.", "Bye.", "Catch you around.",
  
  // Formal
  "Farewell.", "Until next time.", "Be well.", "Safe travels.", "Godspeed.",
  
  // Warm
  "Take care of yourself.", "Stay safe out there.", "Don't be a stranger!",
  
  // Cold
  "...Mm.", "*turns away*", "We're done here.", "Go.", "Leave me.",
  
  // Unique
  "Watch your back.", "Don't die.", "Try not to get killed.",
  "The road is long. Walk well.", "May fortune favor you.",
];

const AGREEMENTS = [
  // Strong
  "Absolutely.", "Exactly.", "Precisely.", "Indeed.", "Damn right.",
  
  // Moderate
  "Yeah.", "Right.", "True.", "Fair point.", "Can't argue with that.",
  
  // Hesitant
  "I suppose...", "Maybe...", "Perhaps.", "If you say so.", "Could be.",
  
  // Unique
  "*nods firmly*", "You speak truth.", "This is the way.", "Wisdom.",
  "My thoughts exactly.", "Finally, someone gets it.", "*grunts in agreement*",
];

const DISAGREEMENTS = [
  // Strong
  "No.", "Absolutely not.", "Out of the question.", "Never.", "Wrong.",
  
  // Moderate
  "I don't think so.", "That's not how I see it.", "Disagree.", "Nope.",
  
  // Gentle
  "Well, actually...", "Not quite...", "I see it differently.", "Perhaps, but...",
  
  // Unique
  "*shakes head*", "You're mistaken.", "Think again.", "That's where you're wrong.",
  "I've seen otherwise.", "*gives skeptical look*", "Hmm. No.",
];

const THINKING_SOUNDS = [
  "Hmm...", "Let me think...", "Well...", "Consider this...",
  "*strokes chin*", "*pauses*", "Now...", "Ah...",
  "*looks thoughtful*", "Give me a moment...", "Interesting...",
  "*furrows brow*", "*stares into distance*", "Hmm. Hmm.",
];

const NERVOUS_HABITS = [
  "fidgets with hands", "shifts weight constantly", "avoids eye contact",
  "speaks faster", "voice goes higher", "laughs nervously",
  "touches face repeatedly", "crosses and uncrosses arms", "looks around constantly",
  "picks at fingernails", "taps foot", "clears throat often",
  "rubs back of neck", "plays with hair", "bites lip",
  "drums fingers", "adjusts clothing", "checks exits",
];

const THINKING_HABITS = [
  "looks up and to the left", "closes eyes briefly", "steeples fingers",
  "taps chin", "furrows brow deeply", "mutters to self",
  "paces in small circles", "stares at a fixed point", "hums quietly",
  "traces invisible patterns", "counts on fingers", "tilts head",
];

const ANGRY_TELLS = [
  "voice drops dangerously low", "speaks through gritted teeth",
  "goes very still", "muscles tense visibly", "eyes narrow",
  "hands clench into fists", "nostrils flare", "jaw clenches",
  "speaks with forced calm", "words become clipped", "paces aggressively",
  "slams or throws something", "invades personal space", "laughs coldly",
];

const LYING_TELLS = [
  "avoids eye contact", "touches nose", "speaks more formally",
  "adds unnecessary details", "repeats the question first", "pauses too long",
  "becomes overly defensive", "changes subject quickly", "speaks faster",
  "maintains TOO much eye contact", "fidgets with hands", "clears throat",
  "voice pitch changes", "uses distancing language", "becomes vague",
];

const ACCENT_HINTS = [
  null, null, null, null, // Many have no special accent
  "rough, working-class inflection",
  "refined, educated pronunciation",
  "slight foreign lilt",
  "regional drawl",
  "clipped military precision",
  "musical, lilting quality",
  "gruff, gravelly undertone",
  "soft, whispery delivery",
  "booming, theatrical projection",
  "quiet, intimate volume",
];

const DIALECT_WORD_SETS: string[][] = [
  [], [], [], // Many have no special dialect
  ["ain't", "gonna", "wanna", "gotta"],
  ["shan't", "ought", "rather", "quite"],
  ["mate", "bloody", "brilliant", "cheers"],
  ["reckon", "fixing to", "y'all", "might could"],
  ["indeed", "precisely", "naturally", "certainly"],
  ["hm", "ah", "well now", "I see"],
];

// ============================================================================
// TRAIT-BASED MODIFIERS - How traits influence speech
// ============================================================================

const TRAIT_SPEECH_INFLUENCES: Record<string, Partial<VoiceProfile>> = {
  // Personality traits
  honorable: {
    wordChoice: 'refined',
    emotionalExpression: 'sincere',
    usesContractions: false,
  },
  ruthless: {
    wordChoice: 'simple',
    emotionalExpression: 'restrained',
    rhythm: 'clipped',
  },
  kind: {
    emotionalExpression: 'sincere',
    humorStyle: 'self-deprecating',
    confidenceLevel: 'humble',
  },
  cruel: {
    humorStyle: 'dark',
    emotionalExpression: 'dramatic',
    confidenceLevel: 'arrogant',
  },
  brave: {
    confidenceLevel: 'assured',
    rhythm: 'measured',
  },
  cowardly: {
    confidenceLevel: 'nervous',
    rhythm: 'halting',
    usesEllipses: true,
  },
  greedy: {
    wordChoice: 'elaborate',
    rhythm: 'rapid-fire',
  },
  generous: {
    emotionalExpression: 'sincere',
    confidenceLevel: 'humble',
  },
  loyal: {
    emotionalExpression: 'sincere',
    confidenceLevel: 'quiet',
  },
  treacherous: {
    emotionalExpression: 'guarded',
    wordChoice: 'elaborate',
  },
  romantic: {
    wordChoice: 'poetic',
    emotionalExpression: 'dramatic',
    rhythm: 'flowing',
  },
  pragmatic: {
    wordChoice: 'simple',
    emotionalExpression: 'restrained',
    rhythm: 'clipped',
  },
  spiritual: {
    wordChoice: 'poetic',
    rhythm: 'measured',
    emotionalExpression: 'sincere',
  },
  skeptical: {
    humorStyle: 'dry',
    confidenceLevel: 'quiet',
    usesQuestions: true,
  },
  vengeful: {
    emotionalExpression: 'restrained',
    rhythm: 'measured',
    confidenceLevel: 'quiet',
  },
  forgiving: {
    emotionalExpression: 'sincere',
    wordChoice: 'refined',
    confidenceLevel: 'humble',
  },
  ambitious: {
    confidenceLevel: 'assured',
    rhythm: 'rapid-fire',
    wordChoice: 'elaborate',
  },
  humble: {
    confidenceLevel: 'modest',
    wordChoice: 'simple',
    emotionalExpression: 'understated',
  },
  
  // Extended traits from npcPersonalityTemplates
  chaotic: {
    rhythm: 'varied' as any,
    emotionalExpression: 'volatile',
    usesInterruptions: true,
  },
  lawful: {
    rhythm: 'measured',
    wordChoice: 'refined',
    usesContractions: false,
  },
  optimistic: {
    emotionalExpression: 'sincere',
    humorStyle: 'witty',
    usesExclamations: true,
  },
  pessimistic: {
    humorStyle: 'dark',
    emotionalExpression: 'understated',
    rhythm: 'drawling',
  },
  nihilistic: {
    humorStyle: 'absurdist',
    emotionalExpression: 'deadpan',
    confidenceLevel: 'quiet',
  },
  compassionate: {
    emotionalExpression: 'sincere',
    wordChoice: 'simple',
    rhythm: 'flowing',
  },
  indifferent: {
    emotionalExpression: 'deadpan',
    rhythm: 'monotone',
    averageSentenceLength: 'short',
  },
  reckless: {
    rhythm: 'rapid-fire',
    confidenceLevel: 'cocky',
    usesExclamations: true,
  },
  deceptive: {
    wordChoice: 'elaborate',
    emotionalExpression: 'theatrical',
  },
  manipulative: {
    wordChoice: 'refined',
    emotionalExpression: 'guarded',
    rhythm: 'measured',
  },
  patient: {
    rhythm: 'measured',
    averageSentenceLength: 'long',
    emotionalExpression: 'restrained',
  },
  impulsive: {
    rhythm: 'rapid-fire',
    usesInterruptions: true,
    averageSentenceLength: 'short',
  },
  calculating: {
    rhythm: 'measured',
    wordChoice: 'technical',
    emotionalExpression: 'restrained',
  },
  arrogant: {
    confidenceLevel: 'arrogant',
    wordChoice: 'elaborate',
    usesContractions: false,
  },
  narcissistic: {
    confidenceLevel: 'boastful',
    emotionalExpression: 'dramatic',
  },
  curious: {
    usesQuestions: true,
    rhythm: 'rapid-fire',
    emotionalExpression: 'sincere',
  },
  apathetic: {
    emotionalExpression: 'deadpan',
    rhythm: 'monotone',
    averageSentenceLength: 'very-short',
  },
  obsessive: {
    rhythm: 'rapid-fire',
    wordChoice: 'technical',
    usesInterruptions: true,
  },
  grudging: {
    emotionalExpression: 'restrained',
    rhythm: 'halting',
    usesEllipses: true,
  },
};

// ============================================================================
// MOOD SPEECH MODIFIERS - How current mood affects speech
// ============================================================================

const MOOD_SPEECH_MODIFIERS: Record<string, {
  rhythmShift: SpeechRhythm | null;
  expressionShift: EmotionalExpression | null;
  volumeHint: string;
  paceHint: string;
}> = {
  joyful: {
    rhythmShift: 'flowing',
    expressionShift: 'sincere',
    volumeHint: 'slightly louder',
    paceHint: 'animated and quick',
  },
  content: {
    rhythmShift: 'measured',
    expressionShift: 'understated',
    volumeHint: 'relaxed',
    paceHint: 'unhurried',
  },
  neutral: {
    rhythmShift: null,
    expressionShift: null,
    volumeHint: 'normal',
    paceHint: 'steady',
  },
  annoyed: {
    rhythmShift: 'clipped',
    expressionShift: 'restrained',
    volumeHint: 'terse',
    paceHint: 'curt and quick',
  },
  angry: {
    rhythmShift: 'staccato',
    expressionShift: 'explosive',
    volumeHint: 'raised',
    paceHint: 'intense, controlled fury',
  },
  sad: {
    rhythmShift: 'halting',
    expressionShift: 'understated',
    volumeHint: 'quiet',
    paceHint: 'slow, with pauses',
  },
  fearful: {
    rhythmShift: 'breathless',
    expressionShift: 'volatile',
    volumeHint: 'hushed or erratic',
    paceHint: 'rushed, nervous',
  },
  disgusted: {
    rhythmShift: 'clipped',
    expressionShift: 'restrained',
    volumeHint: 'sharp',
    paceHint: 'dismissive',
  },
  romantic: {
    rhythmShift: 'flowing',
    expressionShift: 'sincere',
    volumeHint: 'soft',
    paceHint: 'gentle, lingering',
  },
  betrayed: {
    rhythmShift: 'halting',
    expressionShift: 'guarded',
    volumeHint: 'strained',
    paceHint: 'measured with emotion bleeding through',
  },
};

// ============================================================================
// CORE GENERATION FUNCTIONS
// ============================================================================

/**
 * Seeded random number generator for consistent randomization per character
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate a unique hash from a string for seeding
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Pick random item from array using seeded random
 */
function pickRandom<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)];
}

/**
 * Generate a completely randomized voice profile for a character
 */
export function generateVoiceProfile(
  characterId: string,
  traits: (PersonalityTrait | CompanionTrait | string)[] = [],
  options?: {
    experienceLevel?: ExperienceLevel;
    mentalState?: MentalState;
    socialDisposition?: SocialDisposition;
    genre?: string;
  }
): VoiceProfile {
  // Create seeded random for consistent generation per character
  const seed = hashString(characterId);
  const random = seededRandom(seed);
  
  // Start with base randomized profile
  const profile: VoiceProfile = {
    id: characterId,
    
    // Core speech patterns - fully randomized
    rhythm: pickRandom(['staccato', 'flowing', 'halting', 'measured', 'rapid-fire', 'drawling', 'clipped', 'melodic', 'monotone', 'breathless'] as SpeechRhythm[], random),
    wordChoice: pickRandom(['simple', 'elaborate', 'crude', 'refined', 'technical', 'poetic', 'slang-heavy', 'archaic', 'modern', 'mixed'] as WordChoice[], random),
    emotionalExpression: pickRandom(['restrained', 'explosive', 'subtle', 'dramatic', 'deadpan', 'sincere', 'guarded', 'theatrical', 'understated', 'volatile'] as EmotionalExpression[], random),
    humorStyle: pickRandom(['dry', 'dark', 'slapstick', 'witty', 'sardonic', 'none', 'self-deprecating', 'observational', 'absurdist', 'sarcastic'] as HumorStyle[], random),
    confidenceLevel: pickRandom(['cocky', 'assured', 'uncertain', 'humble', 'arrogant', 'defensive', 'quiet', 'boastful', 'modest', 'nervous'] as ConfidenceLevel[], random),
    
    // Sentence construction
    averageSentenceLength: pickRandom(['very-short', 'short', 'medium', 'long', 'varied'] as const, random),
    usesContractions: random() > 0.4,
    usesQuestions: random() > 0.5,
    usesExclamations: random() > 0.6,
    usesEllipses: random() > 0.7,
    usesInterruptions: random() > 0.75,
    
    // Verbal quirks - randomized from pools
    signaturePhrase: pickRandom(SIGNATURE_PHRASES, random),
    verbalTic: random() > 0.4 ? pickRandom(VERBAL_TICS, random) : null,
    filler: pickRandom(FILLER_WORDS, random),
    exclamation: pickRandom(EXCLAMATIONS, random),
    curse: pickRandom(CURSES, random),
    greeting: pickRandom(GREETINGS, random),
    farewell: pickRandom(FAREWELLS, random),
    agreement: pickRandom(AGREEMENTS, random),
    disagreement: pickRandom(DISAGREEMENTS, random),
    thinking: pickRandom(THINKING_SOUNDS, random),
    
    // Physical/behavioral tells
    nervousHabit: pickRandom(NERVOUS_HABITS, random),
    thinkingHabit: pickRandom(THINKING_HABITS, random),
    angryTell: pickRandom(ANGRY_TELLS, random),
    lyingTell: pickRandom(LYING_TELLS, random),
    
    // Accent/dialect
    accentHint: pickRandom(ACCENT_HINTS, random),
    dialectWords: pickRandom(DIALECT_WORD_SETS, random),
    
    // Will be populated based on mood
    moodModifiers: {},
  };
  
  // Apply trait-based modifications
  for (const trait of traits) {
    const traitLower = (typeof trait === 'string' ? trait : trait).toLowerCase();
    const influence = TRAIT_SPEECH_INFLUENCES[traitLower];
    if (influence) {
      Object.assign(profile, influence);
    }
  }
  
  // Apply experience level modifications
  if (options?.experienceLevel) {
    switch (options.experienceLevel) {
      case 'green':
      case 'novice':
        profile.confidenceLevel = random() > 0.5 ? 'uncertain' : 'nervous';
        profile.usesQuestions = true;
        break;
      case 'veteran':
      case 'elite':
        profile.confidenceLevel = random() > 0.5 ? 'quiet' : 'assured';
        profile.averageSentenceLength = 'short';
        break;
      case 'legendary':
        profile.wordChoice = 'poetic';
        profile.rhythm = 'measured';
        break;
      case 'burnt-out':
        profile.emotionalExpression = 'deadpan';
        profile.humorStyle = 'dark';
        break;
    }
  }
  
  // Apply mental state modifications
  if (options?.mentalState) {
    switch (options.mentalState) {
      case 'anxious':
        profile.rhythm = 'halting';
        profile.usesEllipses = true;
        profile.filler = pickRandom(['um', 'uh', 'er'], random);
        break;
      case 'manic':
        profile.rhythm = 'rapid-fire';
        profile.usesInterruptions = true;
        profile.usesExclamations = true;
        break;
      case 'depressed':
        profile.rhythm = 'monotone';
        profile.averageSentenceLength = 'short';
        profile.emotionalExpression = 'deadpan';
        break;
      case 'paranoid':
        profile.usesQuestions = true;
        profile.emotionalExpression = 'guarded';
        break;
      case 'psychotic':
        profile.rhythm = random() > 0.5 ? 'rambling' as any : 'staccato';
        profile.usesInterruptions = true;
        break;
    }
  }
  
  // Build mood modifiers for later dynamic application
  for (const [mood, modifiers] of Object.entries(MOOD_SPEECH_MODIFIERS)) {
    profile.moodModifiers[mood] = `${modifiers.volumeHint}, ${modifiers.paceHint}`;
  }
  
  return profile;
}

/**
 * Build a complete speech instruction for AI prompts based on voice profile
 */
export function buildSpeechInstructions(
  profile: VoiceProfile,
  currentMood?: CompanionMood | string,
  characterName?: string
): string {
  const lines: string[] = [];
  const name = characterName || profile.id;
  
  lines.push(`## VOICE PROFILE FOR ${name.toUpperCase()}`);
  lines.push('');
  
  // Core speech style
  lines.push(`**Speech Rhythm:** ${profile.rhythm} - Their words come in a ${profile.rhythm} pattern`);
  lines.push(`**Word Choice:** ${profile.wordChoice} - They prefer ${profile.wordChoice} vocabulary`);
  lines.push(`**Emotional Expression:** ${profile.emotionalExpression} - Their emotions are ${profile.emotionalExpression}`);
  lines.push(`**Humor Style:** ${profile.humorStyle === 'none' ? 'Rarely jokes' : `Uses ${profile.humorStyle} humor`}`);
  lines.push(`**Confidence:** ${profile.confidenceLevel}`);
  lines.push('');
  
  // Sentence construction rules
  lines.push('### SENTENCE CONSTRUCTION');
  lines.push(`- Average sentence length: ${profile.averageSentenceLength}`);
  lines.push(`- ${profile.usesContractions ? 'Uses contractions (can\'t, won\'t, etc.)' : 'Avoids contractions (cannot, will not)'}`);
  lines.push(`- ${profile.usesQuestions ? 'Often phrases things as questions' : 'Prefers statements over questions'}`);
  lines.push(`- ${profile.usesExclamations ? 'Uses exclamation marks when emotional' : 'Rarely uses exclamation marks'}`);
  lines.push(`- ${profile.usesEllipses ? 'Trails off with ellipses...' : 'Finishes thoughts completely'}`);
  lines.push(`- ${profile.usesInterruptions ? 'Interrupts self, changes mid-thought' : 'Speaks in complete thoughts'}`);
  lines.push('');
  
  // Signature verbal elements
  lines.push('### SIGNATURE PHRASES & VERBAL QUIRKS');
  lines.push(`**Signature phrase (use regularly):** "${profile.signaturePhrase}"`);
  if (profile.verbalTic) lines.push(`**Verbal tic:** Frequently says "${profile.verbalTic}"`);
  if (profile.filler) lines.push(`**Filler word:** Uses "${profile.filler}" when thinking`);
  lines.push(`**When surprised:** "${profile.exclamation}"`);
  lines.push(`**When frustrated:** "${profile.curse}"`);
  lines.push(`**Greeting style:** "${profile.greeting}"`);
  lines.push(`**Farewell style:** "${profile.farewell}"`);
  lines.push(`**Agreement:** "${profile.agreement}"`);
  lines.push(`**Disagreement:** "${profile.disagreement}"`);
  lines.push(`**Thinking aloud:** "${profile.thinking}"`);
  lines.push('');
  
  // Behavioral tells
  lines.push('### BEHAVIORAL TELLS (show through action beats)');
  lines.push(`**When nervous:** ${profile.nervousHabit}`);
  lines.push(`**When thinking:** ${profile.thinkingHabit}`);
  lines.push(`**When angry:** ${profile.angryTell}`);
  lines.push(`**When lying:** ${profile.lyingTell}`);
  lines.push('');
  
  // Accent/dialect if present
  if (profile.accentHint || profile.dialectWords.length > 0) {
    lines.push('### ACCENT & DIALECT');
    if (profile.accentHint) lines.push(`**Voice quality:** ${profile.accentHint}`);
    if (profile.dialectWords.length > 0) {
      lines.push(`**Dialect words to use:** ${profile.dialectWords.join(', ')}`);
    }
    lines.push('');
  }
  
  // Current mood modifications
  if (currentMood && MOOD_SPEECH_MODIFIERS[currentMood]) {
    const moodMod = MOOD_SPEECH_MODIFIERS[currentMood];
    lines.push('### CURRENT MOOD EFFECTS');
    lines.push(`**Current mood:** ${currentMood}`);
    lines.push(`**Voice quality:** ${moodMod.volumeHint}`);
    lines.push(`**Speaking pace:** ${moodMod.paceHint}`);
    if (moodMod.rhythmShift) lines.push(`**Rhythm shifts to:** ${moodMod.rhythmShift}`);
    if (moodMod.expressionShift) lines.push(`**Expression becomes:** ${moodMod.expressionShift}`);
    lines.push('');
  }
  
  lines.push('### VOICE RULES');
  lines.push('- This character should be recognizable by dialogue alone');
  lines.push('- Use their signature phrase naturally (not every line, but regularly)');
  lines.push('- Match their speech rhythm and sentence length');
  lines.push('- Show behavioral tells through action beats');
  lines.push('- Every trait influences how they express themselves');
  lines.push('- Mood temporarily modifies their baseline voice');
  
  return lines.join('\n');
}

// ============================================================================
// VOICE PROFILE REGISTRY - Stores and retrieves profiles
// ============================================================================

export interface VoiceProfileRegistry {
  profiles: Record<string, VoiceProfile>;
}

let globalRegistry: VoiceProfileRegistry = { profiles: {} };

export function getOrCreateVoiceProfile(
  characterId: string,
  traits: (PersonalityTrait | CompanionTrait | string)[] = [],
  options?: {
    experienceLevel?: ExperienceLevel;
    mentalState?: MentalState;
    socialDisposition?: SocialDisposition;
    genre?: string;
    forceRegenerate?: boolean;
  }
): VoiceProfile {
  if (!options?.forceRegenerate && globalRegistry.profiles[characterId]) {
    return globalRegistry.profiles[characterId];
  }
  
  const profile = generateVoiceProfile(characterId, traits, options);
  globalRegistry.profiles[characterId] = profile;
  return profile;
}

export function clearVoiceProfiles(): void {
  globalRegistry = { profiles: {} };
}

export function serializeVoiceProfiles(): string {
  return JSON.stringify(globalRegistry);
}

export function deserializeVoiceProfiles(data: string): void {
  try {
    globalRegistry = JSON.parse(data);
  } catch {
    globalRegistry = { profiles: {} };
  }
}

export function getVoiceProfileCount(): number {
  return Object.keys(globalRegistry.profiles).length;
}

// ============================================================================
// QUICK HELPERS FOR COMMON USE CASES
// ============================================================================

/**
 * Get a quick speech summary for inline use
 */
export function getQuickSpeechSummary(profile: VoiceProfile): string {
  return `Speaks in ${profile.rhythm} ${profile.wordChoice} sentences with ${profile.emotionalExpression} emotion. Says "${profile.signaturePhrase}" often.${profile.verbalTic ? ` Uses "${profile.verbalTic}" as verbal tic.` : ''}`;
}

/**
 * Get mood-adjusted dialogue hints
 */
export function getMoodDialogueHints(profile: VoiceProfile, mood: string): string {
  const moodMod = MOOD_SPEECH_MODIFIERS[mood] || MOOD_SPEECH_MODIFIERS.neutral;
  return `Currently ${mood}: voice is ${moodMod.volumeHint}, pace is ${moodMod.paceHint}`;
}
