/**
 * Narrative Quality System
 * 
 * Comprehensive quality enforcement for AAA-level narrative generation.
 * Ensures consistency, prevents drift, and maintains peak quality
 * across 24+ hour sessions for all genres.
 */

// ============= QUALITY METRICS =============

export interface NarrativeQualityMetrics {
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  dialogueRatio: number;  // % of text that is dialogue
  sensoryDetails: number; // Count of sensory words
  actionDensity: number;  // Verbs per 100 words
  repetitionScore: number; // 0-1, lower is better
  coherenceScore: number;  // 0-1, higher is better
}

export interface QualityGates {
  minWords: number;
  minParagraphs: number;
  maxRepetitionScore: number;
  minSensoryDetails: number;
  minDialogueRatio: number;
  maxEchoSimilarity: number;
}

// Genre-specific quality gates
export const GENRE_QUALITY_GATES: Record<string, QualityGates> = {
  fantasy: {
    minWords: 150,
    minParagraphs: 3,
    maxRepetitionScore: 0.25,
    minSensoryDetails: 4,
    minDialogueRatio: 0.15,
    maxEchoSimilarity: 0.35,
  },
  scifi: {
    minWords: 140,
    minParagraphs: 3,
    maxRepetitionScore: 0.25,
    minSensoryDetails: 5,
    minDialogueRatio: 0.12,
    maxEchoSimilarity: 0.35,
  },
  horror: {
    minWords: 160,
    minParagraphs: 3,
    maxRepetitionScore: 0.20,
    minSensoryDetails: 6,
    minDialogueRatio: 0.08, // Less dialogue, more atmosphere
    maxEchoSimilarity: 0.30,
  },
  mystery: {
    minWords: 150,
    minParagraphs: 3,
    maxRepetitionScore: 0.22,
    minSensoryDetails: 4,
    minDialogueRatio: 0.20, // More dialogue for investigation
    maxEchoSimilarity: 0.35,
  },
  western: {
    minWords: 140,
    minParagraphs: 3,
    maxRepetitionScore: 0.25,
    minSensoryDetails: 5,
    minDialogueRatio: 0.15,
    maxEchoSimilarity: 0.35,
  },
  cyberpunk: {
    minWords: 150,
    minParagraphs: 3,
    maxRepetitionScore: 0.25,
    minSensoryDetails: 5,
    minDialogueRatio: 0.15,
    maxEchoSimilarity: 0.35,
  },
  war: {
    minWords: 150,
    minParagraphs: 3,
    maxRepetitionScore: 0.22,
    minSensoryDetails: 6,
    minDialogueRatio: 0.12,
    maxEchoSimilarity: 0.35,
  },
  pirate: {
    minWords: 140,
    minParagraphs: 3,
    maxRepetitionScore: 0.25,
    minSensoryDetails: 5,
    minDialogueRatio: 0.18,
    maxEchoSimilarity: 0.35,
  },
  postapoc: {
    minWords: 150,
    minParagraphs: 3,
    maxRepetitionScore: 0.22,
    minSensoryDetails: 5,
    minDialogueRatio: 0.12,
    maxEchoSimilarity: 0.35,
  },
  cosmic_horror: {
    minWords: 170,
    minParagraphs: 4,
    maxRepetitionScore: 0.18,
    minSensoryDetails: 7,
    minDialogueRatio: 0.05, // Minimal dialogue, maximum dread
    maxEchoSimilarity: 0.25,
  },
  noir: {
    minWords: 160,
    minParagraphs: 3,
    maxRepetitionScore: 0.22,
    minSensoryDetails: 5,
    minDialogueRatio: 0.18,
    maxEchoSimilarity: 0.30,
  },
  modern_life: {
    minWords: 130,
    minParagraphs: 3,
    maxRepetitionScore: 0.28,
    minSensoryDetails: 3,
    minDialogueRatio: 0.25, // High dialogue for social scenarios
    maxEchoSimilarity: 0.40,
  },
};

const DEFAULT_QUALITY_GATES: QualityGates = {
  minWords: 140,
  minParagraphs: 3,
  maxRepetitionScore: 0.25,
  minSensoryDetails: 4,
  minDialogueRatio: 0.10,
  maxEchoSimilarity: 0.35,
};

// ============= SENSORY VOCABULARY =============

const SENSORY_WORDS = {
  sight: [
    'gleam', 'glint', 'shimmer', 'glow', 'flash', 'flicker', 'shadow', 'silhouette',
    'bright', 'dark', 'dim', 'pale', 'vivid', 'crimson', 'azure', 'emerald', 'amber',
    'golden', 'silver', 'black', 'white', 'gray', 'red', 'blue', 'green', 'violet',
    'murky', 'clear', 'transparent', 'opaque', 'hazy', 'stark', 'piercing', 'blinding',
  ],
  sound: [
    'whisper', 'murmur', 'rumble', 'roar', 'crack', 'snap', 'creak', 'groan', 'hiss',
    'buzz', 'hum', 'ring', 'clang', 'thud', 'boom', 'echo', 'silence', 'quiet',
    'screech', 'wail', 'sigh', 'gasp', 'growl', 'snarl', 'whine', 'shriek', 'moan',
    'click', 'rattle', 'rustle', 'splash', 'drip', 'thunder', 'footsteps', 'heartbeat',
  ],
  smell: [
    'scent', 'aroma', 'stench', 'odor', 'fragrance', 'perfume', 'reek', 'stink',
    'musty', 'fresh', 'acrid', 'sweet', 'sour', 'metallic', 'earthy', 'smoky',
    'rotting', 'floral', 'spicy', 'pungent', 'foul', 'clean', 'damp', 'mold',
  ],
  touch: [
    'rough', 'smooth', 'cold', 'hot', 'warm', 'cool', 'wet', 'dry', 'sticky',
    'slick', 'sharp', 'soft', 'hard', 'firm', 'tender', 'brittle', 'supple',
    'coarse', 'silky', 'gritty', 'slimy', 'velvety', 'prickly', 'numb', 'tingle',
  ],
  taste: [
    'bitter', 'sweet', 'sour', 'salty', 'savory', 'bland', 'spicy', 'tangy',
    'metallic', 'copper', 'blood', 'iron', 'acid', 'alkaline', 'umami', 'rotten',
  ],
};

const ALL_SENSORY_WORDS = new Set([
  ...SENSORY_WORDS.sight,
  ...SENSORY_WORDS.sound,
  ...SENSORY_WORDS.smell,
  ...SENSORY_WORDS.touch,
  ...SENSORY_WORDS.taste,
]);

// ============= ANALYSIS FUNCTIONS =============

/**
 * Analyze narrative quality metrics
 */
export function analyzeNarrativeQuality(narrative: string): NarrativeQualityMetrics {
  if (!narrative) {
    return {
      wordCount: 0,
      paragraphCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      dialogueRatio: 0,
      sensoryDetails: 0,
      actionDensity: 0,
      repetitionScore: 1,
      coherenceScore: 0,
    };
  }

  // Clean mechanic tags for analysis
  const cleanedNarrative = narrative.replace(/\[[^\]]+\]/g, '').trim();
  
  // Word analysis
  const words = cleanedNarrative.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Paragraph analysis
  const paragraphs = cleanedNarrative.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  
  // Sentence analysis
  const sentences = cleanedNarrative.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Dialogue analysis
  const dialogueMatches = cleanedNarrative.match(/"[^"]*"/g) || [];
  const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length;
  const dialogueRatio = wordCount > 0 ? dialogueWords / wordCount : 0;
  
  // Sensory detail count
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
  const sensoryDetails = lowerWords.filter(w => ALL_SENSORY_WORDS.has(w)).length;
  
  // Action density (verbs per 100 words) - simplified detection
  const actionVerbs = [
    'run', 'walk', 'move', 'jump', 'climb', 'fall', 'strike', 'hit', 'throw',
    'grab', 'push', 'pull', 'drop', 'take', 'give', 'look', 'see', 'hear',
    'feel', 'touch', 'smell', 'taste', 'speak', 'say', 'ask', 'tell', 'shout',
    'whisper', 'fight', 'attack', 'defend', 'dodge', 'block', 'shoot', 'fire',
  ];
  const actionCount = lowerWords.filter(w => actionVerbs.some(v => w.startsWith(v))).length;
  const actionDensity = wordCount > 0 ? (actionCount / wordCount) * 100 : 0;
  
  // Repetition score - check for repeated phrases
  const repetitionScore = calculateRepetitionScore(sentences);
  
  // Coherence score - based on sentence variety and flow
  const coherenceScore = calculateCoherenceScore(sentences, avgSentenceLength);
  
  return {
    wordCount,
    paragraphCount,
    sentenceCount,
    avgSentenceLength,
    dialogueRatio,
    sensoryDetails,
    actionDensity,
    repetitionScore,
    coherenceScore,
  };
}

function calculateRepetitionScore(sentences: string[]): number {
  if (sentences.length < 2) return 0;
  
  const phraseSet = new Set<string>();
  let duplicates = 0;
  
  for (const sentence of sentences) {
    // Extract 3-word phrases
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (phraseSet.has(phrase)) {
        duplicates++;
      } else {
        phraseSet.add(phrase);
      }
    }
  }
  
  // Normalize by phrase count
  const totalPhrases = phraseSet.size + duplicates;
  return totalPhrases > 0 ? duplicates / totalPhrases : 0;
}

function calculateCoherenceScore(sentences: string[], avgLength: number): number {
  if (sentences.length < 2) return 0.5;
  
  // Check sentence length variety (good writing has varied sentence lengths)
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const variance = calculateVariance(lengths);
  const varietyScore = Math.min(1, variance / 25); // Good variety around 25 word variance
  
  // Check for transition words
  const transitionWords = ['however', 'meanwhile', 'then', 'next', 'suddenly', 'finally', 
    'therefore', 'consequently', 'furthermore', 'additionally', 'moreover', 'thus',
    'instead', 'although', 'because', 'since', 'while', 'before', 'after'];
  const lowerSentences = sentences.map(s => s.toLowerCase());
  const transitionCount = lowerSentences.filter(s => 
    transitionWords.some(t => s.includes(t))
  ).length;
  const transitionScore = Math.min(1, transitionCount / Math.max(3, sentences.length / 3));
  
  // Combined score
  return (varietyScore * 0.6) + (transitionScore * 0.4);
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

// ============= QUALITY VALIDATION =============

export interface QualityValidationResult {
  passed: boolean;
  metrics: NarrativeQualityMetrics;
  violations: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate narrative against quality gates
 */
export function validateNarrativeQuality(
  narrative: string,
  genre: string,
  previousNarratives: string[] = []
): QualityValidationResult {
  const gates = GENRE_QUALITY_GATES[genre] || DEFAULT_QUALITY_GATES;
  const metrics = analyzeNarrativeQuality(narrative);
  
  const violations: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check word count
  if (metrics.wordCount < gates.minWords) {
    violations.push(`Word count (${metrics.wordCount}) below minimum (${gates.minWords})`);
    suggestions.push('Add more descriptive detail and environmental context');
  } else if (metrics.wordCount < gates.minWords * 1.2) {
    warnings.push(`Word count (${metrics.wordCount}) near minimum`);
  }
  
  // Check paragraph count
  if (metrics.paragraphCount < gates.minParagraphs) {
    violations.push(`Paragraph count (${metrics.paragraphCount}) below minimum (${gates.minParagraphs})`);
    suggestions.push('Break narrative into clear paragraph blocks');
  }
  
  // Check repetition
  if (metrics.repetitionScore > gates.maxRepetitionScore) {
    violations.push(`Repetition score (${metrics.repetitionScore.toFixed(2)}) exceeds limit`);
    suggestions.push('Vary sentence structure and vocabulary');
  }
  
  // Check sensory details
  if (metrics.sensoryDetails < gates.minSensoryDetails) {
    warnings.push(`Low sensory detail count (${metrics.sensoryDetails})`);
    suggestions.push('Add more sight, sound, smell, touch descriptions');
  }
  
  // Check dialogue ratio for social genres
  if (gates.minDialogueRatio > 0.15 && metrics.dialogueRatio < gates.minDialogueRatio * 0.5) {
    warnings.push(`Low dialogue ratio for ${genre} genre`);
    suggestions.push('Include more character dialogue and interaction');
  }
  
  // Check coherence
  if (metrics.coherenceScore < 0.3) {
    warnings.push(`Low coherence score (${metrics.coherenceScore.toFixed(2)})`);
    suggestions.push('Add transition phrases and vary sentence structure');
  }
  
  // Cross-narrative repetition check
  if (previousNarratives.length > 0) {
    const crossRepetition = checkCrossNarrativeRepetition(narrative, previousNarratives);
    if (crossRepetition > gates.maxEchoSimilarity) {
      violations.push(`High similarity to previous narrative (${(crossRepetition * 100).toFixed(0)}%)`);
      suggestions.push('Generate fresh content without echoing previous responses');
    }
  }
  
  return {
    passed: violations.length === 0,
    metrics,
    violations,
    warnings,
    suggestions,
  };
}

function checkCrossNarrativeRepetition(current: string, previous: string[]): number {
  const currentWords = new Set(current.toLowerCase().split(/\s+/));
  
  let maxSimilarity = 0;
  for (const prev of previous.slice(-3)) { // Check last 3
    const prevWords = new Set(prev.toLowerCase().split(/\s+/));
    
    // Jaccard similarity on 3-grams
    const currentGrams = getWordNGrams(current.toLowerCase(), 3);
    const prevGrams = getWordNGrams(prev.toLowerCase(), 3);
    
    const intersection = [...currentGrams].filter(g => prevGrams.has(g)).length;
    const union = new Set([...currentGrams, ...prevGrams]).size;
    
    const similarity = union > 0 ? intersection / union : 0;
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  return maxSimilarity;
}

function getWordNGrams(text: string, n: number): Set<string> {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const grams = new Set<string>();
  
  for (let i = 0; i <= words.length - n; i++) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  
  return grams;
}

// ============= SESSION DRIFT PREVENTION =============

export interface SessionState {
  turnCount: number;
  lastNarratives: string[];
  usedOpenings: Set<string>;
  usedDescriptors: Map<string, number>;
  characterFacts: Map<string, string>;
  worldFacts: Map<string, string>;
  lastUpdate: number;
}

export function createSessionState(): SessionState {
  return {
    turnCount: 0,
    lastNarratives: [],
    usedOpenings: new Set(),
    usedDescriptors: new Map(),
    characterFacts: new Map(),
    worldFacts: new Map(),
    lastUpdate: Date.now(),
  };
}

export function updateSessionState(
  state: SessionState,
  narrative: string
): SessionState {
  // Extract opening line
  const firstLine = narrative.split(/[.!?]/)[0]?.trim() || '';
  const opening = firstLine.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
  
  // Track used descriptors
  const descriptors = narrative.match(/\b(dark|cold|hot|quiet|loud|dim|bright|ancient|modern|small|large|narrow|wide)\b/gi) || [];
  for (const desc of descriptors) {
    const d = desc.toLowerCase();
    state.usedDescriptors.set(d, (state.usedDescriptors.get(d) || 0) + 1);
  }
  
  return {
    ...state,
    turnCount: state.turnCount + 1,
    lastNarratives: [...state.lastNarratives.slice(-5), narrative],
    usedOpenings: new Set([...state.usedOpenings, opening]),
    usedDescriptors: state.usedDescriptors,
    lastUpdate: Date.now(),
  };
}

/**
 * Generate anti-drift directives based on session state
 */
export function generateAntiDriftDirectives(state: SessionState): string[] {
  const directives: string[] = [];
  
  // Check for overused descriptors
  const overused = [...state.usedDescriptors.entries()]
    .filter(([_, count]) => count > 3)
    .map(([word]) => word);
  
  if (overused.length > 0) {
    directives.push(`AVOID overused descriptors: ${overused.join(', ')}. Use fresh vocabulary.`);
  }
  
  // Check for repeated openings
  if (state.usedOpenings.size > 0 && state.turnCount > 5) {
    const openingWarning = [...state.usedOpenings].slice(-3).join(' | ');
    directives.push(`VARY opening style. Recent openings used: ${openingWarning}`);
  }
  
  // Long session fatigue prevention
  if (state.turnCount > 20) {
    directives.push('LONG SESSION: Introduce fresh environmental details and new micro-events.');
  }
  
  if (state.turnCount > 50) {
    directives.push('EXTENDED SESSION: Major world events should occur. Time should feel significant.');
  }
  
  return directives;
}

// ============= QUALITY ENHANCEMENT PROMPTS =============

/**
 * Generate quality enhancement instructions for AI
 */
export function buildQualityEnhancementPrompt(
  genre: string,
  sessionState?: SessionState
): string {
  const gates = GENRE_QUALITY_GATES[genre] || DEFAULT_QUALITY_GATES;
  const antiDrift = sessionState ? generateAntiDriftDirectives(sessionState) : [];
  
  let prompt = `
===== NARRATIVE QUALITY ENFORCEMENT (${genre.toUpperCase()}) =====

HARD REQUIREMENTS:
- Minimum ${gates.minWords} words per response
- Minimum ${gates.minParagraphs} distinct paragraphs
- Include ${gates.minSensoryDetails}+ sensory details (sight, sound, smell, touch, temperature)
- Dialogue ratio approximately ${Math.round(gates.minDialogueRatio * 100)}% of text

STYLE REQUIREMENTS:
- Vary sentence length (mix short punchy with longer flowing)
- Use transitions between paragraphs (Meanwhile, However, Then, Suddenly)
- Never repeat a 3-word phrase within the same response
- Each paragraph serves a distinct purpose (action, dialogue, atmosphere, internal state)

LIVELINESS GATES (your response MUST pass these):
☐ Does every named NPC have body language described?
☐ Does the environment react to player actions?
☐ Are there sounds beyond dialogue?
☐ Is there at least one unexpected detail or micro-event?
☐ Does the response end with forward momentum (not a dead stop)?

EMOTIONAL COMMITMENT GATES:
☐ Is the player's emotional state reflected in perception?
☐ Do NPCs have visible emotional tells?
☐ Are consequences emotionally weighted, not just mechanical?
`;

  if (antiDrift.length > 0) {
    prompt += `
===== SESSION DRIFT PREVENTION =====
${antiDrift.map(d => `⚠️ ${d}`).join('\n')}
`;
  }

  return prompt;
}

// ============= EXPORTS =============

export {
  SENSORY_WORDS,
  ALL_SENSORY_WORDS,
};
