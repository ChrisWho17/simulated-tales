// ============================================================================
// STORY-LANGUAGE ORIGIN SETTINGS
// Decides the campaign's primary story language and the character's relationship
// to it (native vs foreigner), plus the translation-assistance policy.
// ============================================================================

import {
  CharacterLanguageProfile,
  ProficiencyLevel,
  getLanguageCatalog,
  getLanguageDisplayName,
  getSkillForLanguage,
  proficiencyRank,
} from './languageSystem';

export type LanguageRelationship = 'native' | 'foreigner';
export type PrimaryLanguageMode = 'automatic' | 'manual';
export type TranslationAssistance = 'off' | 'partial' | 'full';

export interface StoryLanguageSetup {
  relationship: LanguageRelationship;
  primaryMode: PrimaryLanguageMode;
  /** Resolved campaign story language code (empty = resolve at generation). */
  primaryLanguage: string;
  translationAssistance: TranslationAssistance;
  /** Foreign role seed chosen for foreigner campaigns. */
  foreignRole?: string;
}

export const DEFAULT_STORY_LANGUAGE_SETUP: StoryLanguageSetup = {
  relationship: 'native',
  primaryMode: 'automatic',
  primaryLanguage: '',
  translationAssistance: 'partial',
};

export const FOREIGN_ROLES = [
  'immigrant',
  'traveler',
  'refugee',
  'prisoner',
  'operative',
  'merchant',
  'diplomat',
  'mercenary',
  'exile',
  'contract worker',
] as const;

/** Human labels for the requested proficiency ladder. */
export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  native: 'Native',
  fluent: 'Fluent',
  conversational: 'Conversational',
  broken: 'Limited',
  basic: 'Rudimentary',
  unknown: 'Unknown',
};

export const PROFICIENCY_DESCRIPTIONS: Record<ProficiencyLevel, string> = {
  native: 'Complete fluency, natural expression, cultural phrasing, reading and writing.',
  fluent: 'Reliable speaking and understanding with minor non-native differences.',
  conversational: 'Understands ordinary speech and communicates basic or familiar ideas.',
  broken: 'Recognizes common words and short phrases but frequently misses meaning.',
  basic: 'Isolated words, greetings, warnings, numbers, or memorized phrases only.',
  unknown: 'Cannot meaningfully understand or speak the language.',
};

export function proficiencyLabel(level: ProficiencyLevel): string {
  return PROFICIENCY_LABELS[level] || level;
}

/**
 * Languages a player may pick as the campaign's primary story language.
 * Under "foreigner" the character's native tongue is excluded.
 */
export function getSelectablePrimaryLanguages(
  genre: string,
  profile: CharacterLanguageProfile,
  relationship: LanguageRelationship
): Array<{ code: string; name: string }> {
  return getLanguageCatalog(genre)
    .filter(l => relationship === 'native' || l.code !== profile.nativeLanguage)
    .map(l => ({ code: l.code, name: l.name }));
}

/**
 * Resolve the primary story language.
 * - Native: the character's native tongue.
 * - Foreigner: a supported language that is NOT the character's native tongue,
 *   preferring one the character partly knows so the story has traction.
 */
export function resolvePrimaryStoryLanguage(
  setup: StoryLanguageSetup,
  profile: CharacterLanguageProfile,
  genre: string
): string {
  const catalog = getLanguageCatalog(genre);
  const codes = catalog.map(l => l.code);

  if (setup.relationship === 'native') {
    if (setup.primaryMode === 'manual' && setup.primaryLanguage) return setup.primaryLanguage;
    return profile.nativeLanguage || codes[0] || 'common';
  }

  // Foreigner — never the native tongue.
  if (
    setup.primaryMode === 'manual' &&
    setup.primaryLanguage &&
    setup.primaryLanguage !== profile.nativeLanguage
  ) {
    return setup.primaryLanguage;
  }

  const partiallyKnown = profile.known
    .filter(k => k.language !== profile.nativeLanguage && proficiencyRank(k.speaking) > 0)
    .sort((a, b) => proficiencyRank(b.speaking) - proficiencyRank(a.speaking))[0];

  if (partiallyKnown && codes.includes(partiallyKnown.language)) return partiallyKnown.language;

  return codes.find(c => c !== profile.nativeLanguage) || 'common';
}

export function pickForeignRole(seed?: string): string {
  if (!seed) return FOREIGN_ROLES[Math.floor(Math.random() * FOREIGN_ROLES.length)];
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return FOREIGN_ROLES[n % FOREIGN_ROLES.length];
}

export interface StoryLanguageSummary {
  relationship: LanguageRelationship;
  characterLanguage: string;
  characterLanguageName: string;
  primaryLanguage: string;
  primaryLanguageName: string;
  speaking: ProficiencyLevel;
  literacy: ProficiencyLevel;
  comprehension: string;
  translationAssistance: TranslationAssistance;
  foreignRole?: string;
}

/** Everything shown to the player before campaign generation begins. */
export function summarizeStoryLanguage(
  setup: StoryLanguageSetup,
  profile: CharacterLanguageProfile,
  genre: string
): StoryLanguageSummary {
  const primary = resolvePrimaryStoryLanguage(setup, profile, genre);
  const skill = getSkillForLanguage(profile, primary);
  const speaking: ProficiencyLevel =
    primary === profile.nativeLanguage ? 'native' : skill?.speaking || 'unknown';
  const literacy: ProficiencyLevel =
    primary === profile.nativeLanguage ? (skill?.literacy || 'conversational') : skill?.literacy || 'unknown';

  const comprehension =
    speaking === 'native' || speaking === 'fluent'
      ? 'You understand nearly everything spoken around you.'
      : speaking === 'conversational'
        ? 'You follow ordinary conversation but lose nuance, slang, and fast speech.'
        : speaking === 'broken'
          ? 'You catch common words and short phrases; much of the meaning slips past.'
          : speaking === 'basic'
            ? 'You recognize greetings, warnings, and numbers only. Most speech is noise.'
            : 'You cannot understand the local tongue. You will need interpreters, gestures, or study.';

  return {
    relationship: setup.relationship,
    characterLanguage: profile.nativeLanguage,
    characterLanguageName: getLanguageDisplayName(profile.nativeLanguage),
    primaryLanguage: primary,
    primaryLanguageName: getLanguageDisplayName(primary),
    speaking,
    literacy,
    comprehension,
    translationAssistance: setup.translationAssistance,
    foreignRole:
      setup.relationship === 'foreigner'
        ? setup.foreignRole || pickForeignRole(profile.nativeLanguage + primary)
        : undefined,
  };
}

/** Prompt block used for campaign generation and every narrative turn. */
export function buildStoryLanguagePromptBlock(summary: StoryLanguageSummary): string {
  const lines: string[] = [
    '## STORY LANGUAGE',
    `Primary story language: ${summary.primaryLanguageName}`,
    `Character native language: ${summary.characterLanguageName}`,
    `Character proficiency in the story language: ${proficiencyLabel(summary.speaking)} speaking / ${proficiencyLabel(summary.literacy)} literacy`,
    `Comprehension: ${summary.comprehension}`,
    '',
    '## LANGUAGE PROFICIENCY RULES',
    '- A character may only speak or understand a language to their established proficiency.',
    '- Partial proficiency produces partial comprehension: missed details, missing words, uncertain meaning, imperfect speech.',
    '- Never translate unknown dialogue through narration unless translation assistance allows it or another character interprets.',
    '- The player cannot decipher what the character does not know. NPCs, interpreters, documents, items, spells, or investigation can.',
    '- Translation attempts may call for an Intelligence check (Investigation, History, Arcana, or a contextual proficiency). Poor rolls give incomplete or uncertain readings — not deliberate lies unless the fiction supports deceit.',
    '- Record newly learned words, exposure, and training with [LANGUAGE_EXPOSURE:code:amount] or [LEARN_LANGUAGE:code:reason].',
  ];

  lines.push(
    '',
    '## TRANSLATION ASSISTANCE: ' + summary.translationAssistance.toUpperCase(),
    summary.translationAssistance === 'off'
      ? '- Untranslated dialogue stays in its original language or reads as incomprehensible sound.'
      : summary.translationAssistance === 'partial'
        ? '- Show only what the character actually understands. Fragments stay fragments.'
        : '- Full interface translation: give the translated line clearly labeled as interface translation, then state separately what the character actually understood. Interface translation NEVER grants the character knowledge.'
  );

  if (summary.relationship === 'native') {
    lines.push(
      '',
      '## LANGUAGE RELATIONSHIP: NATIVE',
      `- The story opens in a region where ${summary.primaryLanguageName} is dominant.`,
      '- Culture, names, locations, factions, signage, and documents reflect that language and region.',
      '- The character reads the room, the slang, and the social cues as a local.'
    );
  } else {
    lines.push(
      '',
      '## LANGUAGE RELATIONSHIP: FOREIGNER',
      `- The character is an outsider${summary.foreignRole ? ` (${summary.foreignRole})` : ''} in a region where ${summary.primaryLanguageName} is dominant.`,
      `- Their native ${summary.characterLanguageName} marks them as foreign in accent, paperwork, habits, and expectations.`,
      '- Being foreign shapes communication, trust, cultural knowledge, social checks, available help, and story opportunities.',
      '- Foreignness is not universal hostility: some people help, some exploit, some simply do not care.'
    );
  }

  lines.push(
    '',
    '## CAMPAIGN GENERATION USE',
    '- The language choice must have narrative purpose: the opening location, local population, factions, naming conventions, signs, documents, dialogue, and the initial conflict all follow from it.',
    '- Do not simply swap English words for foreign words. Build a setting where the language gap or fluency actually matters.'
  );

  return lines.join('\n');
}
