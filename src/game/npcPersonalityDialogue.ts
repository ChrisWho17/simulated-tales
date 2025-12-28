// NPC Personality-Driven Dialogue System
// Uses personality templates to flavor NPC speech patterns, quirks, and mental states

import { 
  NPCPersonalityTemplate, 
  PersonalityTrait, 
  MentalState, 
  ExperienceLevel,
  SocialDisposition,
  getRandomPersonalityForGenre,
  getPersonalityById,
  generateNPCPersonalityProfile,
} from './npcPersonalityTemplates';

// ============= TYPES =============

export interface PersonalityDialogueContext {
  npcName: string;
  personalityId: string;
  currentEmotion?: string;
  recentEvents?: string[];
  playerRelationship?: 'stranger' | 'acquaintance' | 'friend' | 'rival' | 'enemy';
  stressLevel?: number; // 0-100
  genre?: string;
}

export interface DialogueModifiers {
  speechPattern: string;
  toneDescriptor: string;
  quirk: string;
  internalThought: string;
  sentenceStructure: 'terse' | 'measured' | 'rambling' | 'fragmented';
  emotionalLeakage: string[];
  verbalTics: string[];
}

// ============= MENTAL STATE SPEECH MODIFIERS =============

const MENTAL_STATE_MODIFIERS: Record<MentalState, {
  toneDescriptor: string;
  sentenceStructure: 'terse' | 'measured' | 'rambling' | 'fragmented';
  emotionalLeakage: string[];
  verbalTics: string[];
}> = {
  stable: {
    toneDescriptor: 'even and controlled',
    sentenceStructure: 'measured',
    emotionalLeakage: [],
    verbalTics: [],
  },
  unstable: {
    toneDescriptor: 'shifting between calm and intensity',
    sentenceStructure: 'fragmented',
    emotionalLeakage: ['sudden laughter', 'abrupt mood shifts', 'unpredictable reactions'],
    verbalTics: ['hesitations', 'self-corrections', 'trailing off'],
  },
  deteriorating: {
    toneDescriptor: 'strained, barely holding together',
    sentenceStructure: 'rambling',
    emotionalLeakage: ['exhaustion showing through', 'bitterness creeping in', 'dark observations'],
    verbalTics: ['sighs', 'bitter laughs', 'long pauses'],
  },
  depressed: {
    toneDescriptor: 'flat and emotionless',
    sentenceStructure: 'terse',
    emotionalLeakage: ['resignation', 'lack of enthusiasm', 'dismissiveness about self'],
    verbalTics: ['trailing off', 'quiet voice', 'monotone delivery'],
  },
  manic: {
    toneDescriptor: 'rapid and energetic',
    sentenceStructure: 'rambling',
    emotionalLeakage: ['infectious energy', 'grandiose statements', 'sudden topic changes'],
    verbalTics: ['fast speech', 'interrupting self', 'tangents'],
  },
  anxious: {
    toneDescriptor: 'nervous and watchful',
    sentenceStructure: 'fragmented',
    emotionalLeakage: ['worry bleeding through', 'over-explaining', 'seeking reassurance'],
    verbalTics: ['um', 'uh', 'you know', 'checking surroundings'],
  },
  traumatized: {
    toneDescriptor: 'guarded with occasional cracks',
    sentenceStructure: 'fragmented',
    emotionalLeakage: ['flinching at triggers', 'thousand-yard stare', 'dissociating'],
    verbalTics: ['sudden silences', 'incomplete thoughts', 'topic avoidance'],
  },
  dissociative: {
    toneDescriptor: 'detached and distant',
    sentenceStructure: 'fragmented',
    emotionalLeakage: ['speaking of self in third person', 'emotional numbness', 'confusion about time'],
    verbalTics: ['where was I', 'I suppose', 'does it matter'],
  },
  paranoid: {
    toneDescriptor: 'suspicious and probing',
    sentenceStructure: 'measured',
    emotionalLeakage: ['questioning motives', 'reading into statements', 'seeing patterns'],
    verbalTics: ['why do you ask', 'who sent you', 'checking exits'],
  },
  suicidal: {
    toneDescriptor: 'eerily calm or desperately manic',
    sentenceStructure: 'terse',
    emotionalLeakage: ['giving away possessions', 'final statements', 'peace after decision'],
    verbalTics: ['take care of yourself', 'you were good to me', 'it does not matter anymore'],
  },
  homicidal: {
    toneDescriptor: 'cold and predatory',
    sentenceStructure: 'measured',
    emotionalLeakage: ['sizing up targets', 'calculating statements', 'chilling calm'],
    verbalTics: ['clinical descriptions', 'objectifying others', 'dark humor'],
  },
  psychotic: {
    toneDescriptor: 'disconnected from consensus reality',
    sentenceStructure: 'rambling',
    emotionalLeakage: ['responding to hallucinations', 'impossible certainties', 'private jokes'],
    verbalTics: ['do you hear that', 'they told me', 'the signs are clear'],
  },
  recovering: {
    toneDescriptor: 'cautiously hopeful',
    sentenceStructure: 'measured',
    emotionalLeakage: ['small joys', 'self-awareness', 'gratitude'],
    verbalTics: ['one day at a time', 'I am trying', 'it helps to'],
  },
  coping: {
    toneDescriptor: 'held together by routine',
    sentenceStructure: 'measured',
    emotionalLeakage: ['dark humor as defense', 'compartmentalizing', 'controlled vulnerability'],
    verbalTics: ['anyway', 'it is what it is', 'moving on'],
  },
  thriving: {
    toneDescriptor: 'warm and open',
    sentenceStructure: 'measured',
    emotionalLeakage: ['genuine smiles', 'easy laughter', 'generosity'],
    verbalTics: ['tell me more', 'that is wonderful', 'I remember when'],
  },
};

// ============= EXPERIENCE LEVEL MODIFIERS =============

const EXPERIENCE_MODIFIERS: Record<ExperienceLevel, {
  confidenceLevel: string;
  knowledgeDisplay: string;
  adviceStyle: string;
}> = {
  green: {
    confidenceLevel: 'uncertain, second-guessing',
    knowledgeDisplay: 'asks many questions, defers to others',
    adviceStyle: 'hesitant, often wrong, admits ignorance',
  },
  novice: {
    confidenceLevel: 'eager but unsure',
    knowledgeDisplay: 'knows basics, gaps in knowledge',
    adviceStyle: 'textbook answers, limited practical insight',
  },
  experienced: {
    confidenceLevel: 'solid, acknowledges limits',
    knowledgeDisplay: 'practical knowledge, earned wisdom',
    adviceStyle: 'speaks from experience, includes caveats',
  },
  veteran: {
    confidenceLevel: 'weary confidence',
    knowledgeDisplay: 'deep expertise, has seen it all',
    adviceStyle: 'brief, direct, often dark humor',
  },
  elite: {
    confidenceLevel: 'quiet mastery',
    knowledgeDisplay: 'legendary skill, teaches by example',
    adviceStyle: 'few words, each one counts',
  },
  legendary: {
    confidenceLevel: 'beyond concern with proving self',
    knowledgeDisplay: 'speaks in parables, profound insights',
    adviceStyle: 'enigmatic, transformative, memorable',
  },
  'washed-up': {
    confidenceLevel: 'defensive about past glory',
    knowledgeDisplay: 'outdated expertise, living in the past',
    adviceStyle: 'references old times, bitter about present',
  },
  'burnt-out': {
    confidenceLevel: 'hollow, going through motions',
    knowledgeDisplay: 'capable but exhausted',
    adviceStyle: 'pessimistic, warns against trying',
  },
  retired: {
    confidenceLevel: 'at peace with stepping back',
    knowledgeDisplay: 'wisdom of hindsight',
    adviceStyle: 'reflective, regretful, sage-like',
  },
};

// ============= SOCIAL DISPOSITION MODIFIERS =============

const DISPOSITION_MODIFIERS: Record<SocialDisposition, {
  approachStyle: string;
  firstImpressionBehavior: string;
  trustBuilding: string;
}> = {
  friendly: {
    approachStyle: 'warm, welcoming, initiates conversation',
    firstImpressionBehavior: 'smiles, offers help, shares freely',
    trustBuilding: 'quick to trust, forgives easily',
  },
  hostile: {
    approachStyle: 'aggressive, confrontational, dismissive',
    firstImpressionBehavior: 'glares, challenges, threatens',
    trustBuilding: 'trust must be fought for, tests constantly',
  },
  wary: {
    approachStyle: 'cautious, observes before engaging',
    firstImpressionBehavior: 'keeps distance, short answers, watches carefully',
    trustBuilding: 'slow, requires consistent proof',
  },
  aloof: {
    approachStyle: 'distant, occupied with own concerns',
    firstImpressionBehavior: 'barely acknowledges, seems preoccupied',
    trustBuilding: 'indifferent, trust not priority',
  },
  gregarious: {
    approachStyle: 'enthusiastic, storyteller, center of attention',
    firstImpressionBehavior: 'talks a lot, asks personal questions, shares stories',
    trustBuilding: 'surface-level easy, deeper trust harder',
  },
  reclusive: {
    approachStyle: 'avoids contact, uncomfortable with people',
    firstImpressionBehavior: 'minimal words, looks for exits, anxious',
    trustBuilding: 'extremely slow, prefers being alone',
  },
  protective: {
    approachStyle: 'nurturing but defensive of charges',
    firstImpressionBehavior: 'assesses threat level, shields others',
    trustBuilding: 'based on how you treat those they protect',
  },
  predatory: {
    approachStyle: 'calculating, sizing up weaknesses',
    firstImpressionBehavior: 'charming but probing, finding leverage',
    trustBuilding: 'uses trust as tool, never truly trusts',
  },
  parasitic: {
    approachStyle: 'needy, attaches quickly, draining',
    firstImpressionBehavior: 'overly familiar, seeks support, complains',
    trustBuilding: 'trusts anyone who provides',
  },
  mentor: {
    approachStyle: 'teaching, evaluating potential',
    firstImpressionBehavior: 'tests, challenges, offers lessons',
    trustBuilding: 'based on student growth and respect',
  },
  student: {
    approachStyle: 'deferential, seeking guidance',
    firstImpressionBehavior: 'asks questions, shows eagerness to learn',
    trustBuilding: 'trusts teachers quickly, loyal to mentors',
  },
  rival: {
    approachStyle: 'competitive, measuring against self',
    firstImpressionBehavior: 'assesses skills, makes comparisons',
    trustBuilding: 'respect through competition, grudging admiration',
  },
  indifferent: {
    approachStyle: 'detached, transactional',
    firstImpressionBehavior: 'neutral, neither welcoming nor hostile',
    trustBuilding: 'trust is irrelevant, only utility matters',
  },
};

// ============= PERSONALITY TRAIT SPEECH FLAVORS =============

const TRAIT_SPEECH_FLAVORS: Record<PersonalityTrait, string[]> = {
  chaotic: ['unpredictable word choices', 'sudden topic changes', 'contradicts self casually'],
  lawful: ['references rules and order', 'structured speech', 'appeals to authority'],
  neutral: ['balanced perspective', 'sees all sides', 'avoids extremes'],
  optimistic: ['finds bright side', 'encouraging words', 'hopeful phrasing'],
  pessimistic: ['expects the worst', 'cynical observations', 'warns of failure'],
  nihilistic: ['questions meaning', 'detached from outcomes', 'philosophical darkness'],
  compassionate: ['asks about feelings', 'offers comfort', 'shows concern'],
  cruel: ['enjoys suffering', 'mocking tone', 'twists knife with words'],
  indifferent: ['minimal emotional investment', 'clinical descriptions', 'what is it to me'],
  brave: ['faces fear openly', 'volunteers for danger', 'encourages courage'],
  cowardly: ['looks for exits', 'deflects responsibility', 'makes excuses'],
  reckless: ['dismisses consequences', 'acts impulsively', 'lives in the moment'],
  honest: ['direct answers', 'admits faults', 'uncomfortable with lies'],
  deceptive: ['calculated truth', 'misdirection', 'plausible deniability'],
  manipulative: ['uses emotions', 'creates obligations', 'plants suggestions'],
  loyal: ['references commitments', 'defends allies', 'keeps promises'],
  treacherous: ['undermines subtly', 'feigns loyalty', 'bides time'],
  opportunistic: ['assesses advantage', 'flexible allegiances', 'practical above principle'],
  patient: ['waits for right moment', 'long view', 'measured responses'],
  impulsive: ['reacts immediately', 'regrets later', 'emotional decisions'],
  calculating: ['weighs options aloud', 'probability assessment', 'strategic thinking'],
  humble: ['deflects praise', 'credits others', 'underestimates self'],
  arrogant: ['assumes superiority', 'condescending tone', 'expects deference'],
  narcissistic: ['turns conversations to self', 'requires validation', 'dismisses others'],
  curious: ['asks many questions', 'wants to understand', 'fascinated by details'],
  apathetic: ['why should I care', 'minimal engagement', 'nothing matters'],
  obsessive: ['returns to topic repeatedly', 'cannot let go', 'consumed by focus'],
  forgiving: ['offers second chances', 'understands mistakes', 'moves on'],
  vengeful: ['remembers every slight', 'plans retribution', 'holds grudges forever'],
  grudging: ['forgives but remembers', 'brings up old wounds', 'conditional mercy'],
};

// ============= DIALOGUE GENERATION FUNCTIONS =============

/**
 * Generate dialogue modifiers based on NPC personality template
 */
export function generateDialogueModifiers(
  personality: NPCPersonalityTemplate,
  context?: Partial<PersonalityDialogueContext>
): DialogueModifiers {
  const mentalMods = MENTAL_STATE_MODIFIERS[personality.mentalState];
  const experienceMods = EXPERIENCE_MODIFIERS[personality.experienceLevel];
  const dispositionMods = DISPOSITION_MODIFIERS[personality.socialDisposition];
  
  // Select a speech pattern from the template
  const speechPattern = personality.speechPatterns[
    Math.floor(Math.random() * personality.speechPatterns.length)
  ];
  
  // Select a quirk
  const quirk = personality.quirks[
    Math.floor(Math.random() * personality.quirks.length)
  ];
  
  // Build internal thought from motivations/fears
  const motivationOrFear = Math.random() > 0.5 
    ? personality.motivations[Math.floor(Math.random() * personality.motivations.length)]
    : personality.fears[Math.floor(Math.random() * personality.fears.length)];
  const internalThought = `Thinking about: ${motivationOrFear}`;
  
  // Apply stress modifiers
  let sentenceStructure = mentalMods.sentenceStructure;
  if (context?.stressLevel && context.stressLevel > 70) {
    sentenceStructure = 'fragmented';
  }
  
  return {
    speechPattern,
    toneDescriptor: mentalMods.toneDescriptor,
    quirk,
    internalThought,
    sentenceStructure,
    emotionalLeakage: mentalMods.emotionalLeakage,
    verbalTics: mentalMods.verbalTics,
  };
}

/**
 * Build a comprehensive AI prompt context for an NPC's personality-driven dialogue
 */
export function buildPersonalityDialoguePrompt(
  npcName: string,
  personality: NPCPersonalityTemplate,
  context?: Partial<PersonalityDialogueContext>
): string {
  const modifiers = generateDialogueModifiers(personality, context);
  const experienceMods = EXPERIENCE_MODIFIERS[personality.experienceLevel];
  const dispositionMods = DISPOSITION_MODIFIERS[personality.socialDisposition];
  
  // Gather trait flavors
  const traitFlavors: string[] = [];
  for (const trait of personality.primaryTraits) {
    const flavors = TRAIT_SPEECH_FLAVORS[trait];
    if (flavors) {
      traitFlavors.push(flavors[Math.floor(Math.random() * flavors.length)]);
    }
  }
  
  // Select backstory hook
  const backstoryHook = personality.backstoryHooks[
    Math.floor(Math.random() * personality.backstoryHooks.length)
  ];
  
  const lines: string[] = [
    `=== ${npcName} PERSONALITY VOICE ===`,
    `Archetype: ${personality.name}`,
    ``,
    `SPEECH CHARACTERISTICS:`,
    `- Pattern: ${modifiers.speechPattern}`,
    `- Tone: ${modifiers.toneDescriptor}`,
    `- Sentence structure: ${modifiers.sentenceStructure}`,
    `- Confidence: ${experienceMods.confidenceLevel}`,
    ``,
    `BEHAVIORAL TELLS:`,
    `- Quirk: ${modifiers.quirk}`,
    `- Approach: ${dispositionMods.approachStyle}`,
    `- First impression: ${dispositionMods.firstImpressionBehavior}`,
  ];
  
  if (modifiers.emotionalLeakage.length > 0) {
    lines.push(`- Emotional leakage: ${modifiers.emotionalLeakage.join(', ')}`);
  }
  
  if (modifiers.verbalTics.length > 0) {
    lines.push(`- Verbal tics: ${modifiers.verbalTics.join(', ')}`);
  }
  
  if (traitFlavors.length > 0) {
    lines.push(`- Trait expression: ${traitFlavors.join(', ')}`);
  }
  
  lines.push(``);
  lines.push(`INTERNAL STATE:`);
  lines.push(`- ${modifiers.internalThought}`);
  lines.push(`- Backstory: ${backstoryHook}`);
  lines.push(`- Mental state: ${personality.mentalState}`);
  lines.push(`- Experience: ${personality.experienceLevel} (${experienceMods.adviceStyle})`);
  
  // Add relationship context if provided
  if (context?.playerRelationship) {
    lines.push(``);
    lines.push(`RELATIONSHIP WITH PLAYER: ${context.playerRelationship}`);
    lines.push(`- Trust building: ${dispositionMods.trustBuilding}`);
  }
  
  lines.push(``);
  lines.push(`DIALOGUE INSTRUCTIONS:`);
  lines.push(`Write ${npcName}'s dialogue to reflect these characteristics.`);
  lines.push(`Their ${modifiers.sentenceStructure} speech and ${modifiers.toneDescriptor} tone should be evident.`);
  lines.push(`Show their ${personality.mentalState} mental state through word choice and behavior.`);
  
  return lines.join('\n');
}

/**
 * Generate a quick personality flavor line for dialogue attribution
 */
export function getPersonalityFlavorLine(personality: NPCPersonalityTemplate): string {
  const mentalMods = MENTAL_STATE_MODIFIERS[personality.mentalState];
  const quirk = personality.quirks[Math.floor(Math.random() * personality.quirks.length)];
  const speechPattern = personality.speechPatterns[Math.floor(Math.random() * personality.speechPatterns.length)];
  
  return `(${mentalMods.toneDescriptor} tone, ${speechPattern.toLowerCase()}, ${quirk.toLowerCase()})`;
}

/**
 * Get sample dialogue lines that match a personality
 */
export function getSampleDialogueForPersonality(personality: NPCPersonalityTemplate): string[] {
  const samples: string[] = [];
  
  // Generate samples based on mental state and traits
  switch (personality.mentalState) {
    case 'depressed':
      samples.push("Does it matter? ...I suppose not.");
      samples.push("*stares at nothing* You should leave. Everyone does.");
      samples.push("*sighs* Fine. If you insist.");
      break;
    case 'manic':
      samples.push("Oh! Yes! We can absolutely do that and ALSO—wait, have you considered—");
      samples.push("*laughs too loudly* Everything is POSSIBLE today!");
      samples.push("No time to explain! Come with me! NOW!");
      break;
    case 'paranoid':
      samples.push("*glances around* Who sent you? Really?");
      samples.push("Keep your voice down. They're always listening.");
      samples.push("How do I know you're not one of them?");
      break;
    case 'traumatized':
      samples.push("*flinches* Sorry, I... what were we talking about?");
      samples.push("*goes silent, staring at something only they can see*");
      samples.push("Not that. Anything but that. Please.");
      break;
    case 'stable':
      samples.push("I understand. Let me think about the best approach.");
      samples.push("*nods calmly* Reasonable. What else do you need?");
      break;
    default:
      samples.push("*expression shifts* Interesting...");
  }
  
  // Add trait-based samples
  if (personality.primaryTraits.includes('vengeful')) {
    samples.push("They'll pay. Every last one of them.");
  }
  if (personality.primaryTraits.includes('compassionate')) {
    samples.push("Are you alright? Truly?");
  }
  if (personality.primaryTraits.includes('chaotic')) {
    samples.push("Rules? *laughs* Those are just suggestions.");
  }
  if (personality.primaryTraits.includes('honest')) {
    samples.push("I won't lie to you. The truth is...");
  }
  
  return samples;
}

// ============= PERSONALITY STORAGE FOR NPCS =============

export interface StoredNPCPersonality {
  npcId: string;
  personalityId: string;
  assignedAt: number;
  genre: string;
  selectedBackstory: string;
  selectedQuirk: string;
  selectedMotivation: string;
  selectedFear: string;
  selectedSecret: string;
}

const npcPersonalityMap = new Map<string, StoredNPCPersonality>();

/**
 * Assign a personality to an NPC
 */
export function assignPersonalityToNPC(
  npcId: string,
  personalityId: string,
  genre: string = 'fantasy'
): StoredNPCPersonality {
  const personality = getPersonalityById(personalityId);
  if (!personality) {
    throw new Error(`Personality not found: ${personalityId}`);
  }
  
  const profile = generateNPCPersonalityProfile(personality, npcId);
  
  const stored: StoredNPCPersonality = {
    npcId,
    personalityId,
    assignedAt: Date.now(),
    genre,
    selectedBackstory: profile.selectedBackstory,
    selectedQuirk: profile.selectedQuirk,
    selectedMotivation: profile.selectedMotivation,
    selectedFear: profile.selectedFear,
    selectedSecret: profile.selectedSecret,
  };
  
  npcPersonalityMap.set(npcId, stored);
  return stored;
}

/**
 * Get or create a personality for an NPC
 */
export function getOrAssignPersonality(
  npcId: string,
  genre: string = 'fantasy'
): StoredNPCPersonality {
  const existing = npcPersonalityMap.get(npcId);
  if (existing) return existing;
  
  // Assign random personality for genre
  const personality = getRandomPersonalityForGenre(genre);
  return assignPersonalityToNPC(npcId, personality.id, genre);
}

/**
 * Get stored personality for an NPC
 */
export function getNPCPersonality(npcId: string): StoredNPCPersonality | undefined {
  return npcPersonalityMap.get(npcId);
}

/**
 * Build dialogue prompt for an NPC using stored personality
 */
export function buildNPCDialoguePrompt(
  npcId: string,
  npcName: string,
  context?: Partial<PersonalityDialogueContext>
): string | null {
  const stored = npcPersonalityMap.get(npcId);
  if (!stored) return null;
  
  const personality = getPersonalityById(stored.personalityId);
  if (!personality) return null;
  
  return buildPersonalityDialoguePrompt(npcName, personality, context);
}

/**
 * Clear all personality assignments (for campaign changes)
 */
export function clearPersonalityAssignments(): void {
  npcPersonalityMap.clear();
  console.log('[NPCPersonalityDialogue] Cleared all personality assignments');
}

/**
 * Export personality map for serialization
 */
export function exportPersonalityMap(): Record<string, StoredNPCPersonality> {
  const exported: Record<string, StoredNPCPersonality> = {};
  npcPersonalityMap.forEach((value, key) => {
    exported[key] = value;
  });
  return exported;
}

/**
 * Import personality map from serialized data
 */
export function importPersonalityMap(data: Record<string, StoredNPCPersonality>): void {
  npcPersonalityMap.clear();
  Object.entries(data).forEach(([key, value]) => {
    npcPersonalityMap.set(key, value);
  });
  console.log(`[NPCPersonalityDialogue] Imported ${npcPersonalityMap.size} personality assignments`);
}
