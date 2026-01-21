/**
 * Narrative Genre Enforcement System
 * 
 * Ensures AI narration stays true to genre conventions
 * across all supported genres with specific vocabulary,
 * tone, and thematic requirements.
 */

// ============= GENRE TONE PROFILES =============

export interface GenreToneProfile {
  id: string;
  name: string;
  
  // Core atmosphere
  primaryTone: string;
  atmosphericKeywords: string[];
  
  // Vocabulary guidance
  encouragedVocab: string[];
  discouragedVocab: string[];
  
  // Sentence style
  preferredSentenceStyle: 'terse' | 'flowing' | 'punchy' | 'lyrical' | 'clinical';
  dialogueStyle: string;
  
  // Thematic requirements
  thematicElements: string[];
  forbiddenTones: string[];
  
  // Sensory focus
  primarySenses: ('sight' | 'sound' | 'smell' | 'touch' | 'taste')[];
  atmosphericDetails: string[];
  
  // Narrative voice
  narratorStance: 'intimate' | 'distant' | 'omniscient' | 'sardonic' | 'neutral';
  emotionalRegister: 'heightened' | 'restrained' | 'intense' | 'matter-of-fact';
  
  // Pacing
  defaultPacing: 'slow' | 'moderate' | 'fast' | 'variable';
  tensionProfile: 'building' | 'sustained' | 'spiking' | 'undulating';
}

export const GENRE_TONE_PROFILES: Record<string, GenreToneProfile> = {
  fantasy: {
    id: 'fantasy',
    name: 'High Fantasy',
    primaryTone: 'wonder and peril intertwined',
    atmosphericKeywords: ['ancient', 'mystical', 'legendary', 'fabled', 'enchanted', 'cursed', 'prophesied'],
    encouragedVocab: ['blade', 'realm', 'quest', 'forge', 'oath', 'grimoire', 'artifact', 'destiny', 'shadow', 'flame'],
    discouragedVocab: ['computer', 'phone', 'car', 'electricity', 'modern', 'technology', 'internet'],
    preferredSentenceStyle: 'flowing',
    dialogueStyle: 'formal with archaic touches, but not Shakespeare',
    thematicElements: ['heroism', 'sacrifice', 'corruption', 'redemption', 'legacy', 'power'],
    forbiddenTones: ['ironic detachment', 'modern cynicism', 'scientific rationalism'],
    primarySenses: ['sight', 'touch', 'smell'],
    atmosphericDetails: ['torchlight', 'stone walls', 'ancient dust', 'cold metal', 'forest mist'],
    narratorStance: 'omniscient',
    emotionalRegister: 'heightened',
    defaultPacing: 'moderate',
    tensionProfile: 'building',
  },

  scifi: {
    id: 'scifi',
    name: 'Science Fiction',
    primaryTone: 'vast isolation and technological wonder',
    atmosphericKeywords: ['sterile', 'infinite', 'automated', 'alien', 'synthetic', 'calculated', 'void'],
    encouragedVocab: ['hull', 'corridor', 'terminal', 'sector', 'protocol', 'containment', 'anomaly', 'frequency', 'vector'],
    discouragedVocab: ['magic', 'spell', 'wizard', 'dragon', 'curse', 'enchantment'],
    preferredSentenceStyle: 'clinical',
    dialogueStyle: 'clipped technical jargon mixed with human tension',
    thematicElements: ['isolation', 'discovery', 'hubris', 'evolution', 'survival', 'humanity'],
    forbiddenTones: ['fairy tale wonder', 'pastoral peace'],
    primarySenses: ['sight', 'sound', 'touch'],
    atmosphericDetails: ['humming systems', 'recycled air', 'indicator lights', 'metal surfaces', 'viewport stars'],
    narratorStance: 'neutral',
    emotionalRegister: 'restrained',
    defaultPacing: 'variable',
    tensionProfile: 'building',
  },

  horror: {
    id: 'horror',
    name: 'Survival Horror',
    primaryTone: 'creeping dread and mortal vulnerability',
    atmosphericKeywords: ['rotting', 'silent', 'watching', 'wrong', 'cold', 'hungry', 'patient'],
    encouragedVocab: ['shadow', 'silence', 'breathing', 'heartbeat', 'darkness', 'threshold', 'beneath', 'approach'],
    discouragedVocab: ['safe', 'comfortable', 'cozy', 'relaxed', 'carefree'],
    preferredSentenceStyle: 'terse',
    dialogueStyle: 'whispered, fragmented, fearful',
    thematicElements: ['vulnerability', 'isolation', 'madness', 'contamination', 'the unknown'],
    forbiddenTones: ['comedy', 'romance', 'heroic triumph', 'safety'],
    primarySenses: ['sound', 'touch', 'smell'],
    atmosphericDetails: ['creaking floors', 'distant sounds', 'cold spots', 'decay smell', 'oppressive silence'],
    narratorStance: 'intimate',
    emotionalRegister: 'intense',
    defaultPacing: 'slow',
    tensionProfile: 'building',
  },

  mystery: {
    id: 'mystery',
    name: 'Detective Mystery',
    primaryTone: 'suspicion and hidden truths',
    atmosphericKeywords: ['concealed', 'suspicious', 'deliberate', 'calculated', 'revealing', 'contradictory'],
    encouragedVocab: ['evidence', 'alibi', 'motive', 'suspect', 'testimony', 'discrepancy', 'timeline', 'witness'],
    discouragedVocab: ['magic', 'supernatural', 'miracle', 'impossible'],
    preferredSentenceStyle: 'punchy',
    dialogueStyle: 'probing questions and evasive answers',
    thematicElements: ['deception', 'justice', 'truth', 'guilt', 'observation'],
    forbiddenTones: ['supernatural horror', 'slapstick'],
    primarySenses: ['sight', 'sound', 'smell'],
    atmosphericDetails: ['rain on windows', 'clock ticking', 'cigarette smoke', 'dim lighting', 'paper shuffling'],
    narratorStance: 'neutral',
    emotionalRegister: 'matter-of-fact',
    defaultPacing: 'moderate',
    tensionProfile: 'undulating',
  },

  noir: {
    id: 'noir',
    name: 'Noir',
    primaryTone: 'moral ambiguity and fatalistic beauty',
    atmosphericKeywords: ['shadow', 'rain', 'smoke', 'neon', 'desperate', 'doomed', 'seductive'],
    encouragedVocab: ['dame', 'trouble', 'joint', 'gat', 'racket', 'heel', 'patsy', 'mark', 'grift'],
    discouragedVocab: ['happy', 'innocent', 'pure', 'hopeful', 'bright'],
    preferredSentenceStyle: 'punchy',
    dialogueStyle: 'hard-boiled, world-weary, double-meaning',
    thematicElements: ['corruption', 'temptation', 'betrayal', 'fate', 'cynicism'],
    forbiddenTones: ['optimism', 'innocence', 'heroic clarity'],
    primarySenses: ['sight', 'smell', 'touch'],
    atmosphericDetails: ['rain-slicked streets', 'neon reflections', 'cigarette glow', 'jazz in distance', 'venetian blind shadows'],
    narratorStance: 'sardonic',
    emotionalRegister: 'heightened',
    defaultPacing: 'moderate',
    tensionProfile: 'sustained',
  },

  western: {
    id: 'western',
    name: 'Frontier Western',
    primaryTone: 'harsh beauty and moral reckoning',
    atmosphericKeywords: ['dusty', 'weathered', 'distant', 'unforgiving', 'endless', 'silent', 'scorched'],
    encouragedVocab: ['trail', 'saddle', 'iron', 'sunset', 'frontier', 'outlaw', 'territory', 'bounty'],
    discouragedVocab: ['modern', 'electricity', 'computer', 'technology'],
    preferredSentenceStyle: 'terse',
    dialogueStyle: 'laconic, measured, few words that mean everything',
    thematicElements: ['justice', 'survival', 'honor', 'revenge', 'solitude', 'civilization'],
    forbiddenTones: ['modern irony', 'sci-fi wonder'],
    primarySenses: ['sight', 'touch', 'smell'],
    atmosphericDetails: ['creaking leather', 'distant coyotes', 'heat shimmer', 'dust devils', 'campfire crackle'],
    narratorStance: 'distant',
    emotionalRegister: 'restrained',
    defaultPacing: 'slow',
    tensionProfile: 'building',
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    primaryTone: 'neon-soaked desperation and chrome dreams',
    atmosphericKeywords: ['chrome', 'neon', 'rain', 'wired', 'corporate', 'synthetic', 'glitching', 'underground'],
    encouragedVocab: ['jack', 'deck', 'chrome', 'rig', 'cred', 'flatline', 'corpo', 'street', 'neural', 'ice'],
    discouragedVocab: ['natural', 'organic', 'wholesome', 'pastoral', 'traditional'],
    preferredSentenceStyle: 'punchy',
    dialogueStyle: 'street slang mixed with tech jargon',
    thematicElements: ['identity', 'corporate control', 'rebellion', 'augmentation', 'addiction', 'humanity'],
    forbiddenTones: ['pastoral peace', 'naive optimism', 'medieval'],
    primarySenses: ['sight', 'sound', 'touch'],
    atmosphericDetails: ['neon reflections', 'rain on chrome', 'humming implants', 'holographic ads', 'synthwave bass'],
    narratorStance: 'intimate',
    emotionalRegister: 'intense',
    defaultPacing: 'fast',
    tensionProfile: 'spiking',
  },

  war: {
    id: 'war',
    name: 'Theater of War',
    primaryTone: 'chaos and camaraderie under fire',
    atmosphericKeywords: ['thunder', 'mud', 'blood', 'steel', 'smoke', 'screaming', 'silence'],
    encouragedVocab: ['flank', 'cover', 'sector', 'objective', 'casualty', 'extract', 'hostile', 'ordnance'],
    discouragedVocab: ['peaceful', 'serene', 'calm', 'relaxed', 'safe'],
    preferredSentenceStyle: 'terse',
    dialogueStyle: 'military brevity, shouted commands, whispered fears',
    thematicElements: ['duty', 'sacrifice', 'brotherhood', 'horror', 'survival', 'command'],
    forbiddenTones: ['romantic war', 'glory without cost', 'clean victory'],
    primarySenses: ['sound', 'sight', 'touch'],
    atmosphericDetails: ['artillery rumble', 'mud squelch', 'gunpowder smell', 'radio static', 'labored breathing'],
    narratorStance: 'intimate',
    emotionalRegister: 'intense',
    defaultPacing: 'variable',
    tensionProfile: 'spiking',
  },

  pirate: {
    id: 'pirate',
    name: 'High Seas',
    primaryTone: 'salt-spray freedom and ruthless ambition',
    atmosphericKeywords: ['salt', 'wind', 'timber', 'horizon', 'treasure', 'storm', 'cannon'],
    encouragedVocab: ['deck', 'rigging', 'bow', 'stern', 'crew', 'plunder', 'captain', 'port', 'bounty'],
    discouragedVocab: ['modern', 'engine', 'motor', 'electricity'],
    preferredSentenceStyle: 'flowing',
    dialogueStyle: 'salty curses, sea metaphors, hearty declarations',
    thematicElements: ['freedom', 'greed', 'loyalty', 'adventure', 'legend', 'treachery'],
    forbiddenTones: ['landlocked mundanity', 'modern corporate'],
    primarySenses: ['smell', 'touch', 'sight'],
    atmosphericDetails: ['creaking timbers', 'salt spray', 'cannon smoke', 'rum and tar', 'seagull cries'],
    narratorStance: 'omniscient',
    emotionalRegister: 'heightened',
    defaultPacing: 'moderate',
    tensionProfile: 'undulating',
  },

  postapoc: {
    id: 'postapoc',
    name: 'Post-Apocalyptic',
    primaryTone: 'desperate survival in ruins of the before',
    atmosphericKeywords: ['rusted', 'abandoned', 'irradiated', 'scavenged', 'hollow', 'silent', 'crumbling'],
    encouragedVocab: ['wasteland', 'salvage', 'ration', 'shelter', 'filter', 'rad', 'settlement', 'caravan'],
    discouragedVocab: ['abundant', 'plentiful', 'safe', 'comfortable', 'secure'],
    preferredSentenceStyle: 'terse',
    dialogueStyle: 'economical, suspicious, trading-focused',
    thematicElements: ['survival', 'scarcity', 'trust', 'hope', 'tribalism', 'memory of before'],
    forbiddenTones: ['abundance', 'casual safety', 'modern convenience'],
    primarySenses: ['smell', 'touch', 'sight'],
    atmosphericDetails: ['Geiger clicks', 'rusted metal', 'dust and ash', 'empty windows', 'distant howls'],
    narratorStance: 'neutral',
    emotionalRegister: 'matter-of-fact',
    defaultPacing: 'slow',
    tensionProfile: 'sustained',
  },

  cosmic_horror: {
    id: 'cosmic_horror',
    name: 'Cosmic Horror',
    primaryTone: 'insignificance before incomprehensible vastness',
    atmosphericKeywords: ['impossible', 'ancient', 'vast', 'watching', 'wrong', 'alien', 'cyclopean', 'nameless'],
    encouragedVocab: ['threshold', 'geometry', 'aeons', 'dimensions', 'void', 'whisper', 'sanity', 'forbidden'],
    discouragedVocab: ['safe', 'understood', 'logical', 'explainable', 'comfortable'],
    preferredSentenceStyle: 'lyrical',
    dialogueStyle: 'fragmented, prophetic, touched by madness',
    thematicElements: ['insignificance', 'forbidden knowledge', 'corruption', 'inevitability', 'truth destroys'],
    forbiddenTones: ['heroic victory', 'simple solutions', 'comprehension'],
    primarySenses: ['sight', 'sound', 'touch'],
    atmosphericDetails: ['impossible angles', 'whispers from beyond', 'stars that move wrong', 'cold from nowhere', 'colors unnamed'],
    narratorStance: 'omniscient',
    emotionalRegister: 'heightened',
    defaultPacing: 'slow',
    tensionProfile: 'building',
  },

  modern_life: {
    id: 'modern_life',
    name: 'Modern Life',
    primaryTone: 'quiet drama of everyday consequences',
    atmosphericKeywords: ['familiar', 'routine', 'pressure', 'connection', 'opportunity', 'deadline', 'relationship'],
    encouragedVocab: ['meeting', 'deadline', 'notification', 'rent', 'coffee', 'commute', 'text', 'message'],
    discouragedVocab: ['magic', 'monster', 'dragon', 'spaceship', 'quest'],
    preferredSentenceStyle: 'flowing',
    dialogueStyle: 'naturalistic, interrupted, realistic',
    thematicElements: ['ambition', 'relationships', 'work-life', 'identity', 'social pressure'],
    forbiddenTones: ['fantasy escapism', 'action spectacle', 'supernatural'],
    primarySenses: ['sight', 'sound', 'smell'],
    atmosphericDetails: ['phone buzzing', 'traffic hum', 'coffee aroma', 'office fluorescents', 'city sounds'],
    narratorStance: 'intimate',
    emotionalRegister: 'heightened',
    defaultPacing: 'moderate',
    tensionProfile: 'undulating',
  },
};

// ============= ENFORCEMENT FUNCTIONS =============

/**
 * Get genre-specific writing instructions for AI
 */
export function getGenreWritingInstructions(genre: string): string {
  const profile = GENRE_TONE_PROFILES[genre];
  if (!profile) return '';

  return `
===== GENRE ENFORCEMENT: ${profile.name.toUpperCase()} =====

CORE TONE: ${profile.primaryTone}

ATMOSPHERE KEYWORDS (use naturally throughout):
${profile.atmosphericKeywords.join(', ')}

VOCABULARY GUIDANCE:
✓ ENCOURAGED: ${profile.encouragedVocab.slice(0, 8).join(', ')}
✗ DISCOURAGED: ${profile.discouragedVocab.slice(0, 5).join(', ')}

SENTENCE STYLE: ${profile.preferredSentenceStyle}
${getStyleDescription(profile.preferredSentenceStyle)}

DIALOGUE STYLE: ${profile.dialogueStyle}

THEMATIC ELEMENTS (weave into scenes):
${profile.thematicElements.join(', ')}

FORBIDDEN TONES (never include):
${profile.forbiddenTones.join(', ')}

SENSORY FOCUS (prioritize these senses):
Primary: ${profile.primarySenses.join(', ')}
Atmospheric details: ${profile.atmosphericDetails.join(', ')}

NARRATIVE VOICE: ${profile.narratorStance}
EMOTIONAL REGISTER: ${profile.emotionalRegister}
PACING: ${profile.defaultPacing}
TENSION: ${profile.tensionProfile}
`;
}

function getStyleDescription(style: string): string {
  switch (style) {
    case 'terse':
      return 'Short, punchy sentences. No wasted words. Impact over elegance.';
    case 'flowing':
      return 'Longer sentences with rhythm. Descriptive passages. Immersive depth.';
    case 'punchy':
      return 'Varied length with emphasis on impactful moments. Snappy dialogue.';
    case 'lyrical':
      return 'Beautiful, almost poetic language. Metaphor and imagery rich.';
    case 'clinical':
      return 'Precise, technical language. Observation over emotion.';
    default:
      return '';
  }
}

/**
 * Validate narrative against genre expectations
 */
export function validateGenreCompliance(
  narrative: string,
  genre: string
): { compliant: boolean; issues: string[]; score: number } {
  const profile = GENRE_TONE_PROFILES[genre];
  if (!profile) {
    return { compliant: true, issues: [], score: 1.0 };
  }

  const issues: string[] = [];
  let score = 1.0;
  const lowerNarrative = narrative.toLowerCase();

  // Check for discouraged vocabulary
  for (const word of profile.discouragedVocab) {
    if (lowerNarrative.includes(word.toLowerCase())) {
      issues.push(`Contains discouraged word: "${word}"`);
      score -= 0.1;
    }
  }

  // Check for atmospheric keywords (bonus if present)
  let atmosphericCount = 0;
  for (const keyword of profile.atmosphericKeywords) {
    if (lowerNarrative.includes(keyword.toLowerCase())) {
      atmosphericCount++;
    }
  }
  if (atmosphericCount < 2) {
    issues.push('Low atmospheric keyword density');
    score -= 0.05;
  }

  // Check thematic presence
  let thematicHits = 0;
  const thematicIndicators: Record<string, string[]> = {
    heroism: ['brave', 'courage', 'hero', 'save', 'protect'],
    isolation: ['alone', 'isolated', 'empty', 'vast', 'silent'],
    corruption: ['corrupt', 'rot', 'decay', 'twisted', 'tainted'],
    survival: ['survive', 'endure', 'struggle', 'desperate', 'scarce'],
    betrayal: ['betray', 'trust', 'deceive', 'lie', 'backstab'],
    // Add more as needed
  };

  for (const theme of profile.thematicElements) {
    const indicators = thematicIndicators[theme.toLowerCase()] || [];
    if (indicators.some(i => lowerNarrative.includes(i))) {
      thematicHits++;
    }
  }

  if (thematicHits === 0 && profile.thematicElements.length > 0) {
    issues.push('No thematic elements detected');
    score -= 0.1;
  }

  return {
    compliant: issues.length === 0,
    issues,
    score: Math.max(0, score),
  };
}

/**
 * Generate genre-specific micro-events
 */
export function getGenreMicroEvents(genre: string): string[] {
  const microEvents: Record<string, string[]> = {
    fantasy: [
      'A raven watches from a crooked branch, unnaturally still',
      'The wind carries a fragment of distant song—or perhaps screaming',
      'Your sword-hand tingles, a sensation you\'ve learned to heed',
      'Old symbols carved into stone catch the light just so',
    ],
    horror: [
      'The corner of your vision catches movement—nothing there when you look',
      'The temperature drops several degrees without explanation',
      'A smell reaches you—wrong, familiar, impossible here',
      'The silence becomes aware of itself',
    ],
    scifi: [
      'A status light blinks from green to amber, then back',
      'The deck plating vibrates at a frequency you haven\'t noticed before',
      'Your HUD flickers with a symbol not in the standard lexicon',
      'Distant, the ship groans like something alive',
    ],
    cyberpunk: [
      'A glitched advertisement repeats your name—coincidence, probably',
      'Static crackles across your neural link for half a heartbeat',
      'A street kid watches you pass—surveillance or opportunity?',
      'The neon flickers in a pattern that almost makes sense',
    ],
    western: [
      'A tumbleweed crosses your path—an old man once called that an omen',
      'The wind shifts, bringing with it the smell of distant smoke',
      'A coyote howls—answered by silence that feels deliberate',
      'Your horse\'s ears flatten; it senses something you don\'t',
    ],
    war: [
      'Artillery rumbles—too regular to be random fire',
      'A bird takes flight from the treeline ahead',
      'The radio crackles with fragments of a voice not on your frequency',
      'Someone\'s bootprint in the mud—fresh, heading your direction',
    ],
    mystery: [
      'The witness glances at someone behind you—no one there when you turn',
      'A receipt in the evidence bag—the ink is smudged, but legible',
      'The clock on the wall is two hours behind; the victim\'s watch said the same',
      'Someone was here recently—the chair is still warm',
    ],
    postapoc: [
      'Your Geiger clicks faster—then stops. That\'s worse.',
      'A can of food sits on a shelf, unopened. Nothing is unopened anymore.',
      'Tire tracks in the dust, fresh enough to follow.',
      'The wind carries voices—raiders, or memories playing tricks.',
    ],
    cosmic_horror: [
      'The geometry of the room seems different than when you entered',
      'Stars visible through the window do not match any constellation you know',
      'Your shadow moves—a half-beat delayed',
      'Something in the book you\'re reading wasn\'t there before',
    ],
  };

  return microEvents[genre] || microEvents.fantasy;
}

// ============= EXPORTS =============

export function getGenreToneProfile(genre: string): GenreToneProfile | undefined {
  return GENRE_TONE_PROFILES[genre];
}

export function getAllGenreIds(): string[] {
  return Object.keys(GENRE_TONE_PROFILES);
}
