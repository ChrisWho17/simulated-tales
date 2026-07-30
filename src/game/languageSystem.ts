// Language Barrier System - Realistic language understanding based on player and NPC profiles

export interface LanguageProfile {
  primary: string;
  known: string[];
  fluency: Record<string, number>; // 0-1 fluency level
}

export interface LanguageSystemState {
  playerLanguage: string; // Detected from browser
  playerKnownLanguages: string[];
  translateEnabled: boolean;
}

export type UnderstandingLevel = 'full' | 'partial' | 'none';

export interface UnderstandingResult {
  understood: boolean;
  level: UnderstandingLevel;
}

// Language families for partial understanding
export const LANGUAGE_FAMILIES: Record<string, string[]> = {
  romance: ['es', 'fr', 'it', 'pt', 'ro', 'ca'],
  germanic: ['en', 'de', 'nl', 'sv', 'no', 'da', 'is'],
  slavic: ['ru', 'pl', 'cs', 'uk', 'bg', 'sr', 'hr'],
  eastAsian: ['zh', 'ja', 'ko'],
  arabic: ['ar', 'he', 'fa', 'ur'],
  indic: ['hi', 'bn', 'pa', 'gu', 'mr'],
  // Fantasy language families
  common: ['common', 'trade'],
  elvish: ['elvish', 'sindarin', 'quenya'],
  dwarven: ['dwarven', 'khuzdul'],
  orcish: ['orcish', 'black-speech'],
  draconic: ['draconic', 'wyrm-tongue'],
};

// Regional language mappings for NPC generation
export const REGIONAL_LANGUAGES: Record<string, { primary: string; secondary: string[] }> = {
  western_europe: { primary: 'en', secondary: ['fr', 'de', 'es', 'it'] },
  eastern_europe: { primary: 'ru', secondary: ['pl', 'uk', 'de', 'cs'] },
  east_asia: { primary: 'zh', secondary: ['ja', 'ko', 'en'] },
  middle_east: { primary: 'ar', secondary: ['fa', 'he', 'en', 'tr'] },
  latin_america: { primary: 'es', secondary: ['pt', 'en'] },
  south_asia: { primary: 'hi', secondary: ['bn', 'en', 'ur'] },
  nordic: { primary: 'sv', secondary: ['no', 'da', 'en', 'fi'] },
  // Fantasy regions
  fantasy_common: { primary: 'common', secondary: [] },
  fantasy_elven: { primary: 'elvish', secondary: ['common'] },
  fantasy_dwarven: { primary: 'dwarven', secondary: ['common'] },
  fantasy_orcish: { primary: 'orcish', secondary: ['common'] },
  fantasy_mixed: { primary: 'common', secondary: ['elvish', 'dwarven'] },
};

// Phoneme sets for generating foreign-sounding text
const PHONEME_SETS: Record<string, string[]> = {
  es: ['el', 'la', 'que', 'de', 'no', 'es', 'un', 'por', 'con', 'para', 'pero', 'más'],
  fr: ['le', 'la', 'de', 'que', 'est', 'pas', 'vous', 'ce', 'qui', 'dans', 'mais', 'oui'],
  de: ['der', 'die', 'und', 'ist', 'nicht', 'ein', 'das', 'mit', 'sie', 'auf', 'auch', 'ich'],
  ru: ['да', 'нет', 'это', 'что', 'как', 'вы', 'мы', 'он', 'она', 'они', 'быть', 'весь'],
  zh: ['是', '的', '在', '有', '这', '了', '不', '人', '中', '大', '国', '我'],
  ja: ['です', 'ます', 'を', 'に', 'は', 'の', 'と', 'も', 'が', 'から', 'まで', 'そう'],
  ar: ['هذا', 'في', 'من', 'على', 'إلى', 'أن', 'هو', 'لا', 'ما', 'كان', 'لم', 'قد'],
  elvish: ['mel', 'ara', 'sil', 'wen', 'nor', 'tal', 'ith', 'elen', 'mir', 'cal', 'nín', 'loth'],
  dwarven: ['khaz', 'dum', 'baruk', 'moria', 'gund', 'bad', 'thrak', 'azan', 'durin', 'kheled'],
  orcish: ['gakh', 'uruk', 'nazg', 'ash', 'ghash', 'burzum', 'krimpat', 'throqu', 'gimbat', 'nar'],
  common: [], // Empty = just use the text
  draconic: ['shar', 'vex', 'korth', 'ixen', 'vignar', 'thrae', 'aurix', 'malsvir', 'usk', 'sthyr'],
};

/**
 * Create initial language system state
 */
export function createLanguageSystemState(): LanguageSystemState {
  // Detect browser language
  const browserLang = typeof navigator !== 'undefined' 
    ? navigator.language?.split('-')[0] || 'en'
    : 'en';
  
  return {
    playerLanguage: browserLang,
    playerKnownLanguages: ['en', 'common'], // Default: English and fantasy common tongue
    translateEnabled: false,
  };
}

/**
 * Create NPC language profile based on region and education
 */
export function createNPCLanguageProfile(
  region: string = 'fantasy_common',
  education: 'none' | 'basic' | 'moderate' | 'high' | 'scholar' = 'basic'
): LanguageProfile {
  const langConfig = REGIONAL_LANGUAGES[region] || REGIONAL_LANGUAGES.fantasy_common;
  
  const languageCount: Record<string, number> = {
    none: 1,
    basic: 1,
    moderate: 2,
    high: 3,
    scholar: 4,
  };
  
  const count = languageCount[education] || 1;
  const known = [langConfig.primary, ...langConfig.secondary.slice(0, count - 1)];
  
  // Build fluency map
  const fluency: Record<string, number> = {
    [langConfig.primary]: 1.0,
  };
  
  langConfig.secondary.slice(0, count - 1).forEach((lang, i) => {
    fluency[lang] = 0.7 - (i * 0.15);
  });
  
  return {
    primary: langConfig.primary,
    known,
    fluency,
  };
}

/**
 * Check if player can understand an NPC's language
 */
export function canUnderstand(
  playerLanguages: string[],
  npcLanguage: string,
  allowPartial: boolean = true
): UnderstandingResult {
  // Direct match
  if (playerLanguages.includes(npcLanguage)) {
    return { understood: true, level: 'full' };
  }
  
  // Partial understanding from same language family
  if (allowPartial) {
    for (const [, familyLanguages] of Object.entries(LANGUAGE_FAMILIES)) {
      if (familyLanguages.includes(npcLanguage) && 
          familyLanguages.some(lang => playerLanguages.includes(lang))) {
        return { understood: true, level: 'partial' };
      }
    }
  }
  
  return { understood: false, level: 'none' };
}

/**
 * Generate foreign-sounding placeholder text
 */
export function generateForeignPlaceholder(text: string, language: string): string {
  // If language is 'common' or player's language, return as-is
  if (language === 'common') {
    return text;
  }
  
  const phonemes = PHONEME_SETS[language] || PHONEME_SETS.elvish;
  
  if (phonemes.length === 0) {
    return text; // No transformation needed
  }
  
  // Generate approximate-length foreign-looking text
  const words = text.split(' ');
  const result: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const phoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
    result.push(phoneme);
  }
  
  return `"${result.join(' ')}"`;
}

/**
 * Partially obscure text for partial understanding
 */
export function partiallyObscureText(text: string, obscureRatio: number = 0.4): string {
  const words = text.split(' ');
  return words.map(word => {
    if (Math.random() < obscureRatio && word.length > 3) {
      return '[...]';
    }
    return word;
  }).join(' ');
}

/**
 * Format NPC dialogue based on language understanding
 */
export function formatNPCDialogue(
  text: string,
  npcLanguage: string,
  languageState: LanguageSystemState
): string {
  const understanding = canUnderstand(languageState.playerKnownLanguages, npcLanguage);
  
  if (understanding.level === 'full') {
    return text;
  }
  
  if (understanding.level === 'partial') {
    return partiallyObscureText(text, 0.4);
  }
  
  // No understanding
  const foreignText = generateForeignPlaceholder(text, npcLanguage);
  
  if (languageState.translateEnabled) {
    return `<span class="foreign-text">${foreignText}</span> <span class="translation">*${text}*</span>`;
  }
  
  return `<span class="foreign-text">${foreignText}</span>`;
}

/**
 * Build language context for AI prompt
 */
export function buildLanguageContext(
  languageState: LanguageSystemState,
  activeNPCs?: Array<{ name: string; languageProfile?: LanguageProfile }>
): string {
  let context = `\n=== LANGUAGE SYSTEM ===
Player understands: ${languageState.playerKnownLanguages.join(', ')}
`;

  if (activeNPCs && activeNPCs.length > 0) {
    context += '\nNPCs in scene:\n';
    for (const npc of activeNPCs) {
      if (npc.languageProfile) {
        const speaks = npc.languageProfile.known.join(', ');
        const understanding = canUnderstand(
          languageState.playerKnownLanguages, 
          npc.languageProfile.primary
        );
        context += `- ${npc.name}: speaks ${speaks} (player ${understanding.understood ? 'understands' : 'cannot understand'})\n`;
      }
    }
  }

  context += `
LANGUAGE RULES:
- If an NPC speaks a language the player doesn't understand, mark it with [LANGUAGE: XX] before dialogue
- For example: [LANGUAGE: elvish] "Mel ithilien nór"
- The player character should react with confusion if they can't understand
- NPCs may try to communicate through gestures or simple words
- Translators or shared languages can bridge communication gaps
`;

  return context;
}

/**
 * Post-process AI response to format language tags
 */
export function postProcessLanguageInResponse(
  response: string,
  languageState: LanguageSystemState
): string {
  // Find language tags: [LANGUAGE: XX] "dialogue"
  const languagePattern = /\[LANGUAGE:\s*(\w+)\]\s*"([^"]+)"/g;
  
  return response.replace(languagePattern, (match, lang, dialogue) => {
    const understanding = canUnderstand(
      languageState.playerKnownLanguages,
      lang.toLowerCase()
    );
    
    if (understanding.level === 'full') {
      return `"${dialogue}"`;
    }
    
    if (understanding.level === 'partial') {
      const partialText = partiallyObscureText(dialogue, 0.35);
      return `"${partialText}"`;
    }
    
    const foreignText = generateForeignPlaceholder(dialogue, lang.toLowerCase());
    
    if (languageState.translateEnabled) {
      return `<span class="foreign-text">${foreignText}</span> <span class="translation">*${dialogue}*</span>`;
    }
    
    return `<span class="foreign-text">${foreignText}</span>`;
  });
}

/**
 * Add a language to player's known languages
 */
export function learnLanguage(
  state: LanguageSystemState,
  language: string
): LanguageSystemState {
  if (state.playerKnownLanguages.includes(language)) {
    return state;
  }
  
  return {
    ...state,
    playerKnownLanguages: [...state.playerKnownLanguages, language],
  };
}

/**
 * Serialize language state for storage
 */
export function serializeLanguageState(state: LanguageSystemState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize language state from storage
 */
export function deserializeLanguageState(data: string): LanguageSystemState {
  try {
    const parsed = JSON.parse(data);
    return {
      playerLanguage: parsed.playerLanguage || 'en',
      playerKnownLanguages: parsed.playerKnownLanguages || ['en', 'common'],
      translateEnabled: parsed.translateEnabled ?? false,
    };
  } catch {
    return createLanguageSystemState();
  }
}

/**
 * Get display name for a language code
 */
export function getLanguageDisplayName(code: string): string {
  const displayNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    common: 'Common Tongue',
    elvish: 'Elvish',
    dwarven: 'Dwarven',
    orcish: 'Orcish',
    draconic: 'Draconic',
  };
  
  return displayNames[code] || code.charAt(0).toUpperCase() + code.slice(1);
}
