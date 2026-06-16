// ============================================================================
// LANGUAGE BARRIER SYSTEM
// Realistic language understanding + accent rendering. Couples with nationalitySystem.
// ============================================================================

import { formatNationalityForAI, getNationality } from './nationalitySystem';

export type LanguageProficiency = 'rough' | 'moderate' | 'perfected' | 'native';

export interface LanguageEntry {
  code: string;
  proficiency: LanguageProficiency;
}

export interface LanguageProfile {
  primary: string;
  known: string[];
  fluency: Record<string, number>; // 0-1 fluency level
  proficiency?: Record<string, LanguageProficiency>;
  nationality?: string;
  accentLabel?: string;
}

export interface LanguageSystemState {
  playerLanguage: string;            // Detected from browser (fallback)
  playerKnownLanguages: string[];
  translateEnabled: boolean;
  // Player profile (set from character creation)
  playerNationality?: string;
  playerPrimaryLanguage?: string;
  playerProficiency?: Record<string, LanguageProficiency>;
}

export type UnderstandingLevel = 'full' | 'partial' | 'none';

export interface UnderstandingResult {
  understood: boolean;
  level: UnderstandingLevel;
  proficiency?: LanguageProficiency;
}

// Proficiency -> fluency number
export const PROFICIENCY_FLUENCY: Record<LanguageProficiency, number> = {
  rough: 0.35,
  moderate: 0.65,
  perfected: 0.95,
  native: 1.0,
};

export const PROFICIENCY_LABELS: Record<LanguageProficiency, string> = {
  rough: 'Rough',
  moderate: 'Moderate',
  perfected: 'Perfected',
  native: 'Native',
};

// Language families for partial understanding
export const LANGUAGE_FAMILIES: Record<string, string[]> = {
  romance: ['es', 'fr', 'it', 'pt', 'ro', 'ca'],
  germanic: ['en', 'de', 'nl', 'sv', 'no', 'da', 'is'],
  slavic: ['ru', 'pl', 'cs', 'uk', 'bg', 'sr', 'hr'],
  eastAsian: ['zh', 'ja', 'ko'],
  arabic: ['ar', 'he', 'fa', 'ur'],
  indic: ['hi', 'bn', 'pa', 'gu', 'mr'],
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
  mediterranean: { primary: 'it', secondary: ['es', 'fr', 'en'] },
  north_america: { primary: 'en', secondary: ['es', 'fr'] },
  oceania: { primary: 'en', secondary: [] },
  africa: { primary: 'en', secondary: ['fr', 'ar'] },
  fantasy_common: { primary: 'common', secondary: [] },
  fantasy_elven: { primary: 'elvish', secondary: ['common'] },
  fantasy_dwarven: { primary: 'dwarven', secondary: ['common'] },
  fantasy_orcish: { primary: 'orcish', secondary: ['common'] },
  fantasy_mixed: { primary: 'common', secondary: ['elvish', 'dwarven'] },
};

const PHONEME_SETS: Record<string, string[]> = {
  es: ['el', 'la', 'que', 'de', 'no', 'es', 'un', 'por', 'con', 'para', 'pero', 'más'],
  fr: ['le', 'la', 'de', 'que', 'est', 'pas', 'vous', 'ce', 'qui', 'dans', 'mais', 'oui'],
  de: ['der', 'die', 'und', 'ist', 'nicht', 'ein', 'das', 'mit', 'sie', 'auf', 'auch', 'ich'],
  it: ['il', 'la', 'che', 'di', 'è', 'un', 'per', 'non', 'con', 'sono', 'ma', 'cosa'],
  pt: ['o', 'a', 'que', 'de', 'não', 'é', 'um', 'para', 'com', 'mas', 'sim', 'tudo'],
  ru: ['да', 'нет', 'это', 'что', 'как', 'вы', 'мы', 'он', 'она', 'они', 'быть', 'весь'],
  pl: ['tak', 'nie', 'to', 'co', 'jak', 'wy', 'my', 'on', 'ona', 'być', 'mieć', 'kurwa'],
  zh: ['是', '的', '在', '有', '这', '了', '不', '人', '中', '大', '国', '我'],
  ja: ['です', 'ます', 'を', 'に', 'は', 'の', 'と', 'も', 'が', 'から', 'まで', 'そう'],
  ko: ['네', '아니요', '이', '그', '저', '하다', '있다', '없다', '오빠', '왜'],
  ar: ['هذا', 'في', 'من', 'على', 'إلى', 'أن', 'هو', 'لا', 'ما', 'كان', 'لم', 'قد'],
  hi: ['है', 'का', 'की', 'के', 'में', 'से', 'पर', 'और', 'या', 'नहीं', 'हाँ', 'मैं'],
  sv: ['ja', 'nej', 'och', 'är', 'inte', 'en', 'det', 'med', 'på', 'för', 'men', 'jag'],
  elvish: ['mel', 'ara', 'sil', 'wen', 'nor', 'tal', 'ith', 'elen', 'mir', 'cal', 'nín', 'loth'],
  dwarven: ['khaz', 'dum', 'baruk', 'moria', 'gund', 'bad', 'thrak', 'azan', 'durin', 'kheled'],
  orcish: ['gakh', 'uruk', 'nazg', 'ash', 'ghash', 'burzum', 'krimpat', 'throqu', 'gimbat', 'nar'],
  common: [],
  draconic: ['shar', 'vex', 'korth', 'ixen', 'vignar', 'thrae', 'aurix', 'malsvir', 'usk', 'sthyr'],
};

export function createLanguageSystemState(): LanguageSystemState {
  const browserLang = typeof navigator !== 'undefined'
    ? navigator.language?.split('-')[0] || 'en'
    : 'en';

  return {
    playerLanguage: browserLang,
    playerKnownLanguages: ['en', 'common'],
    translateEnabled: false,
    playerProficiency: { en: 'native', common: 'native' },
  };
}

/**
 * Update the player's language profile (called from character creation)
 */
export function applyPlayerLanguageProfile(
  state: LanguageSystemState,
  profile: {
    nationality?: string;
    primaryLanguage?: string;
    additionalLanguages?: LanguageEntry[];
  }
): LanguageSystemState {
  const primary = profile.primaryLanguage || state.playerPrimaryLanguage || state.playerLanguage;
  const extras = profile.additionalLanguages || [];

  const known = new Set<string>([primary, ...extras.map(e => e.code), 'common']);
  const proficiency: Record<string, LanguageProficiency> = {
    [primary]: 'native',
    common: 'native',
  };
  for (const e of extras) {
    proficiency[e.code] = e.proficiency;
  }

  return {
    ...state,
    playerNationality: profile.nationality ?? state.playerNationality,
    playerPrimaryLanguage: primary,
    playerKnownLanguages: Array.from(known),
    playerProficiency: { ...(state.playerProficiency || {}), ...proficiency },
  };
}

/**
 * Create NPC language profile based on region/nationality
 */
export function createNPCLanguageProfile(
  region: string = 'fantasy_common',
  education: 'none' | 'basic' | 'moderate' | 'high' | 'scholar' = 'basic',
  nationalityId?: string
): LanguageProfile {
  const langConfig = REGIONAL_LANGUAGES[region] || REGIONAL_LANGUAGES.fantasy_common;

  const languageCount: Record<string, number> = { none: 1, basic: 1, moderate: 2, high: 3, scholar: 4 };
  const count = languageCount[education] || 1;
  const known = [langConfig.primary, ...langConfig.secondary.slice(0, count - 1)];

  const fluency: Record<string, number> = { [langConfig.primary]: 1.0 };
  const proficiency: Record<string, LanguageProficiency> = { [langConfig.primary]: 'native' };

  langConfig.secondary.slice(0, count - 1).forEach((lang, i) => {
    fluency[lang] = 0.7 - (i * 0.15);
    proficiency[lang] = i === 0 ? 'moderate' : 'rough';
  });

  const nat = getNationality(nationalityId);

  return {
    primary: langConfig.primary,
    known,
    fluency,
    proficiency,
    nationality: nationalityId,
    accentLabel: nat?.accentLabel,
  };
}

/**
 * Check if a listener can understand a speaker's language
 */
export function canUnderstand(
  listenerLanguages: string[],
  speakerLanguage: string,
  allowPartial: boolean = true,
  listenerProficiency?: Record<string, LanguageProficiency>
): UnderstandingResult {
  if (listenerLanguages.includes(speakerLanguage)) {
    const prof = listenerProficiency?.[speakerLanguage];
    if (prof === 'rough') return { understood: true, level: 'partial', proficiency: prof };
    return { understood: true, level: 'full', proficiency: prof };
  }

  if (allowPartial) {
    for (const [, familyLanguages] of Object.entries(LANGUAGE_FAMILIES)) {
      if (familyLanguages.includes(speakerLanguage) &&
          familyLanguages.some(lang => listenerLanguages.includes(lang))) {
        return { understood: true, level: 'partial' };
      }
    }
  }

  return { understood: false, level: 'none' };
}

export function generateForeignPlaceholder(text: string, language: string): string {
  if (language === 'common') return text;
  const phonemes = PHONEME_SETS[language] || PHONEME_SETS.elvish;
  if (!phonemes.length) return text;

  const words = text.split(' ');
  const result: string[] = [];
  for (let i = 0; i < words.length; i++) {
    result.push(phonemes[Math.floor(Math.random() * phonemes.length)]);
  }
  return result.join(' ');
}

export function partiallyObscureText(text: string, obscureRatio: number = 0.4): string {
  return text.split(' ').map(word => {
    if (Math.random() < obscureRatio && word.length > 3) return '[...]';
    return word;
  }).join(' ');
}

/**
 * Format NPC dialogue based on the listener's understanding.
 * When the listener does NOT understand:
 *   *foreign text* (English translation)
 */
export function formatNPCDialogue(
  text: string,
  npcLanguage: string,
  languageState: LanguageSystemState
): string {
  const understanding = canUnderstand(
    languageState.playerKnownLanguages,
    npcLanguage,
    true,
    languageState.playerProficiency
  );

  if (understanding.level === 'full') return text;
  if (understanding.level === 'partial') return partiallyObscureText(text, 0.35);

  const foreignText = generateForeignPlaceholder(text, npcLanguage);
  // Italics for the foreign rendering, English translation in parens after
  return `*${foreignText}* (${text})`;
}

/**
 * Build the language context block injected into the AI prompt.
 */
export function buildLanguageContext(
  languageState: LanguageSystemState,
  activeNPCs?: Array<{ name: string; languageProfile?: LanguageProfile; nationality?: string }>,
  narrativeLanguage: string = 'en'
): string {
  const nat = getNationality(languageState.playerNationality);
  const playerLangs = (languageState.playerKnownLanguages || []).map(code => {
    const prof = languageState.playerProficiency?.[code];
    return prof ? `${getLanguageDisplayName(code)} (${prof})` : getLanguageDisplayName(code);
  });

  const playerPrimary = languageState.playerPrimaryLanguage || languageState.playerLanguage || 'en';
  const playerProfInNarrative: LanguageProficiency | undefined =
    languageState.playerProficiency?.[narrativeLanguage];
  // If narrative tongue isn't the player's native/primary, what is their proficiency in it?
  const speaksNarrativeNatively =
    playerPrimary === narrativeLanguage ||
    playerProfInNarrative === 'native' ||
    playerProfInNarrative === 'perfected';

  let context = `\n=== LANGUAGE & ACCENT SYSTEM (MANDATORY — TOP PRIORITY, OVERRIDES ALL OTHER STYLE RULES) ===\n`;
  context += `Narrative tongue (what everyone is presumed to be speaking unless tagged): ${getLanguageDisplayName(narrativeLanguage)}\n`;
  context += `Player primary (native) language: ${getLanguageDisplayName(playerPrimary)}\n`;
  context += `Player understands: ${playerLangs.join(', ') || 'none specified'}\n`;
  if (nat) {
    context += `Player nationality: ${formatNationalityForAI(nat.id)}\n`;
  }

  // ----- PLAYER-SIDE BROKEN SPEECH RULES (NON-NEGOTIABLE) -----
  if (!speaksNarrativeNatively) {
    const prof = playerProfInNarrative || 'rough';
    const playerLangName = getLanguageDisplayName(playerPrimary);
    const narrName = getLanguageDisplayName(narrativeLanguage);
    context += `\n### ⚠️ HARD RULE — PLAYER SPEAKS ${narrName.toUpperCase()} AT PROFICIENCY: ${prof.toUpperCase()}\n`;
    context += `The player is a NATIVE ${playerLangName} speaker. ${narrName} is a FOREIGN language to them.\n`;
    context += `The player's typed input is the META INTENT of what they want their character to say. It is NOT the literal dialogue. You MUST translate that intent into broken, accented ${narrName} BEFORE quoting the character.\n`;
    context += `If the player types "I greet them politely and ask where the market is" — that is intent. Their character's actual spoken line must be rendered in broken ${narrName}.\n`;
    if (prof === 'rough') {
      context += `→ The player's spoken dialogue in ${narrName} MUST always be rendered as BROKEN, halting, heavily accented speech. NO EXCEPTIONS, not even once.\n`;
      context += `  - Drop articles ("the", "a"), drop auxiliary verbs ("is", "are", "do"), wrong tense, wrong word order.\n`;
      context += `  - Sprinkle native-tongue interjections in *italics* with translation in parens, e.g. *Da* (Yes), *Nyet* (No), *Suka* (damn it).\n`;
      context += `  - Search for simple words, sometimes substitute with the wrong one. NPCs visibly react: confusion, slowing down, repeating themselves, mockery, sympathy, suspicion.\n`;
      context += `  - Player thoughts/internal narration remain fluent — only SPOKEN dialogue between quotes is broken.\n`;
      context += `  - Example for a Russian native attempting English: "I... how you say... I look for man. Big man. He owe money, *da*?"\n`;
      context += `  - FORBIDDEN: rendering the player's spoken ${narrName} as grammatical, smooth, or native-sounding. If you find yourself writing a clean English sentence between the player's quote marks, STOP and rewrite it broken.\n`;
      context += `  - FORBIDDEN: letting NPCs treat the player as a fluent speaker. They MUST notice the foreigner accent and broken grammar every single time.\n`;
    } else if (prof === 'moderate') {
      context += `→ The player's spoken ${narrName} is functional but clearly non-native. Every single line.\n`;
      context += `  - Grammar mostly correct, occasional dropped article or wrong preposition, the odd missing connective.\n`;
      context += `  - Reach for words sometimes ("the... how you say... document"). Occasional native-tongue word in *italics* (translation).\n`;
      context += `  - Accent stays present per nationality rules below. NPCs may comment on the accent but understand fine.\n`;
      context += `  - FORBIDDEN: rendering the player's spoken ${narrName} as flawless native speech.\n`;
    }
    context += `\nThis rule is PERMANENT for the entire campaign until the player explicitly LEARNS ${narrName} in-game via [LEARN_LANGUAGE]. Do not "forget" the barrier after the opening scene. Do not let the player become eloquent over time without an in-fiction reason.\n`;
  } else if (nat) {
    context += `\n→ Player speaks ${getLanguageDisplayName(narrativeLanguage)} natively/fluently, but with their ${nat.accentLabel || nat.id} accent. Render the accent in cadence + sparse phonetic tells, not broken grammar.\n`;
  }

  if (activeNPCs && activeNPCs.length > 0) {
    context += '\nNPCs in scene:\n';
    for (const npc of activeNPCs) {
      const accent = npc.languageProfile?.accentLabel || (npc.nationality ? getNationality(npc.nationality)?.accentLabel : undefined);
      const speaks = npc.languageProfile?.known?.join(', ') || 'common';
      const understanding = npc.languageProfile
        ? canUnderstand(languageState.playerKnownLanguages, npc.languageProfile.primary, true, languageState.playerProficiency)
        : { understood: true, level: 'full' as const };
      context += `- ${npc.name}: speaks ${speaks}${accent ? `, ${accent} accent` : ''} — player ${understanding.understood ? `understands (${understanding.level})` : 'CANNOT understand'}\n`;
    }
  }

  context += `
ACCENT RENDERING RULES (intensity-scaled):
- On FIRST meeting an NPC with a strong accent, describe the cadence in prose ("her words came out clipped, every R rolled hard against her teeth"), THEN sprinkle 1–2 light phonetic tells in their first line.
- On subsequent lines, drop the prose description and use only sparse phonetic tells / signature words. Keep dialogue READABLE.
- The further the listener's nationality is from the speaker's, the heavier the perceived accent. Same nationality = no accent rendering.
- Never replace entire words with phonetic spelling. Keep accents flavorful, not garbled.

LANGUAGE BARRIER RULES (NPC -> Player):
- If an NPC speaks a language the player does NOT know, prefix the dialogue with [LANGUAGE: <code>] and write the line in plain English. Example: [LANGUAGE: fr] "Hello, my friend"
- The post-processor will render unknown speech as *foreign text* (English translation in parens) in italics — DO NOT do this yourself.
- If the player has 'rough' proficiency in the speaker's language, render the dialogue with occasional [...] gaps to simulate gist-only comprehension.
- If the player has 'moderate' proficiency, dialogue is fully readable but flag any nuanced/idiomatic phrases with a brief aside (e.g. "— a phrase you can't quite place —").
- If the player has 'perfected' or 'native' proficiency, dialogue reads cleanly with no markers.
- NPCs speaking a language the PLAYER doesn't know should react to misunderstandings, gesture, or seek a translator. The player character must visibly struggle (confusion, raised brows, asking "what?") when language fails.
- Translators, shared secondary languages, or a companion who knows the tongue can bridge the gap mid-scene.

CRITICAL: These are not flavor. A Russian character with 'rough' English MUST sound broken every time they open their mouth in English. Do not "forget" this rule after the opening scene. Do not let the player suddenly become eloquent. The barrier is permanent until they learn the language in-game.
`;

  return context;
}

/**
 * Post-process AI response: convert [LANGUAGE: xx] "..." tags into the final
 * italic-foreign + (English) format when the player cannot understand.
 */
export function postProcessLanguageInResponse(
  response: string,
  languageState: LanguageSystemState
): string {
  const languagePattern = /\[LANGUAGE:\s*([\w-]+)\]\s*"([^"]+)"/g;

  return response.replace(languagePattern, (_match, lang, dialogue) => {
    const understanding = canUnderstand(
      languageState.playerKnownLanguages,
      lang.toLowerCase(),
      true,
      languageState.playerProficiency
    );

    if (understanding.level === 'full') return `"${dialogue}"`;
    if (understanding.level === 'partial') return `"${partiallyObscureText(dialogue, 0.3)}"`;

    const foreignText = generateForeignPlaceholder(dialogue, lang.toLowerCase());
    // Italic foreign rendering followed by parenthesized English translation.
    return `*${foreignText}* (${dialogue})`;
  });
}

export function learnLanguage(state: LanguageSystemState, language: string, proficiency: LanguageProficiency = 'moderate'): LanguageSystemState {
  if (state.playerKnownLanguages.includes(language)) return state;
  return {
    ...state,
    playerKnownLanguages: [...state.playerKnownLanguages, language],
    playerProficiency: { ...(state.playerProficiency || {}), [language]: proficiency },
  };
}

export function serializeLanguageState(state: LanguageSystemState): string {
  return JSON.stringify(state);
}

export function deserializeLanguageState(data: string): LanguageSystemState {
  try {
    const parsed = JSON.parse(data);
    return {
      playerLanguage: parsed.playerLanguage || 'en',
      playerKnownLanguages: parsed.playerKnownLanguages || ['en', 'common'],
      translateEnabled: parsed.translateEnabled ?? false,
      playerNationality: parsed.playerNationality,
      playerPrimaryLanguage: parsed.playerPrimaryLanguage,
      playerProficiency: parsed.playerProficiency || {},
    };
  } catch {
    return createLanguageSystemState();
  }
}

export function getLanguageDisplayName(code: string): string {
  const displayNames: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
    pt: 'Portuguese', ru: 'Russian', pl: 'Polish', zh: 'Chinese', ja: 'Japanese',
    ko: 'Korean', ar: 'Arabic', hi: 'Hindi', sv: 'Swedish', no: 'Norwegian',
    da: 'Danish', nl: 'Dutch', tr: 'Turkish', fa: 'Persian', he: 'Hebrew',
    common: 'Common Tongue', elvish: 'Elvish', dwarven: 'Dwarven',
    orcish: 'Orcish', draconic: 'Draconic',
  };
  return displayNames[code] || code.charAt(0).toUpperCase() + code.slice(1);
}

// List of selectable languages for UI dropdowns
export const SELECTABLE_LANGUAGES: { code: string; label: string }[] = [
  'en','es','fr','de','it','pt','ru','pl','zh','ja','ko','ar','hi','sv','tr','fa','he','nl','common','elvish','dwarven','orcish','draconic'
].map(code => ({ code, label: getLanguageDisplayName(code) }));
