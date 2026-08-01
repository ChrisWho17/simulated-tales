// Language Barriers 2.0 — contextual communication by proficiency, dialect, and world logic.
// Game knows the truth; the player sees PC comprehension.

export type LanguageBarrierMode = 'disabled' | 'light' | 'immersive';

export type ProficiencyLevel =
  | 'unknown'
  | 'basic'
  | 'broken'
  | 'conversational'
  | 'fluent'
  | 'native';

export const PROFICIENCY_ORDER: ProficiencyLevel[] = [
  'unknown',
  'basic',
  'broken',
  'conversational',
  'fluent',
  'native',
];

export const LANGUAGE_POINT_POOL = 5;

/** Speaking/literacy cost above unknown (native tongue speaking is free at creation). */
export const PROFICIENCY_POINT_COST: Record<ProficiencyLevel, number> = {
  unknown: 0,
  basic: 1,
  broken: 2,
  conversational: 3,
  fluent: 4,
  native: 5,
};

export interface LanguageSkill {
  language: string;
  dialect: string;
  speaking: ProficiencyLevel;
  literacy: ProficiencyLevel;
}

export interface CharacterLanguageProfile {
  nativeLanguage: string;
  nativeDialect: string;
  known: LanguageSkill[];
  languagePointsSpent: number;
}

export interface LocationLanguageProfile {
  dominantLanguage: string;
  dominantDialect: string;
  secondaryLanguages: string[];
  tradeLanguage?: string;
  /** Why a foreign speaker might appear here (empty = rare/none). */
  foreignSpeakerReasons: string[];
}

export interface NPCLanguageProfile {
  primary: string;
  dialect: string;
  known: string[];
  fluency: Record<string, number>;
  /** Why this NPC knows non-local tongues. */
  foreignReason?: string;
}

/** @deprecated Prefer NPCLanguageProfile — kept for older call sites. */
export type LanguageProfile = NPCLanguageProfile;

export interface MisunderstandingRecord {
  id: string;
  timestamp: number;
  npcName?: string;
  language: string;
  trueMeaning: string;
  understoodAs: string;
  believed: string;
  playerResponse?: string;
  interpreterId?: string;
  interpreterName?: string;
  interpreterBias?: 'loyal' | 'neutral' | 'hostile' | 'agenda';
  corrected?: boolean;
}

export interface LanguageSystemState {
  mode: LanguageBarrierMode;
  playerLanguage: string;
  playerKnownLanguages: string[];
  translateEnabled: boolean;
  characterProfile?: CharacterLanguageProfile;
  locationLanguages: Record<string, LocationLanguageProfile>;
  misunderstandings: MisunderstandingRecord[];
  /** Exposure progress toward learning (0–100 per language). */
  exposure: Record<string, number>;
}

export type UnderstandingLevel = 'full' | 'partial' | 'none';

export interface UnderstandingResult {
  understood: boolean;
  level: UnderstandingLevel;
  proficiency: ProficiencyLevel;
}

export interface InterpretedSpeech {
  proficiency: ProficiencyLevel;
  /** What the PC perceives (may be foreign, fragments, paraphrase). */
  perceived: string;
  /** Partial gloss beneath foreign speech when earned. */
  partialGloss?: string;
  /** True meaning — only for italics assist or internal memory. */
  trueMeaning: string;
  /** HTML/display string for narrative post-process. */
  displayHtml: string;
  confirmed: boolean;
}

export interface CompanionTranslationResult {
  companionName: string;
  companionId: string;
  claimedMeaning: string;
  bias: 'loyal' | 'neutral' | 'hostile' | 'agenda';
  displayHtml: string;
  isAccurate: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  dialects: { id: string; name: string; isolated?: boolean }[];
}

// ─── Catalogs ────────────────────────────────────────────────────────────────

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
  galactic: ['galactic', 'trade-cant', 'old-earth'],
};

/** Genre-aware language catalogs for creation + world assignment. */
export const GENRE_LANGUAGE_CATALOGS: Record<string, LanguageOption[]> = {
  fantasy: [
    { code: 'common', name: 'Common Tongue', dialects: [
      { id: 'heartland', name: 'Heartland' },
      { id: 'coastal', name: 'Coastal' },
      { id: 'highland', name: 'Highland', isolated: true },
      { id: 'border', name: 'Border Cant' },
    ]},
    { code: 'elvish', name: 'Elvish', dialects: [
      { id: 'wood', name: 'Wood-tongue' },
      { id: 'high', name: 'High Elvish', isolated: true },
      { id: 'sea', name: 'Sea Elvish' },
    ]},
    { code: 'dwarven', name: 'Dwarven', dialects: [
      { id: 'mountain', name: 'Mountain' },
      { id: 'deep', name: 'Deep Holds', isolated: true },
    ]},
    { code: 'orcish', name: 'Orcish', dialects: [
      { id: 'clan', name: 'Clan' },
      { id: 'warband', name: 'Warband' },
    ]},
    { code: 'draconic', name: 'Draconic', dialects: [
      { id: 'ancient', name: 'Ancient', isolated: true },
      { id: 'cult', name: 'Cult Speech' },
    ]},
    { code: 'trade', name: 'Trade Cant', dialects: [
      { id: 'caravan', name: 'Caravan' },
      { id: 'port', name: 'Port' },
    ]},
  ],
  scifi: [
    { code: 'galactic', name: 'Galactic Standard', dialects: [
      { id: 'core', name: 'Core Worlds' },
      { id: 'rim', name: 'Rim' },
      { id: 'colony', name: 'Colony', isolated: true },
    ]},
    { code: 'old-earth', name: 'Old Earth', dialects: [
      { id: 'angolian', name: 'Angolian' },
      { id: 'sino', name: 'Sino-Dialect' },
    ]},
    { code: 'xeno', name: 'Xeno Tongue', dialects: [
      { id: 'hive', name: 'Hive' },
      { id: 'nomad', name: 'Nomad', isolated: true },
    ]},
    { code: 'machine-cant', name: 'Machine Cant', dialects: [
      { id: 'protocol', name: 'Protocol' },
      { id: 'scrap', name: 'Scrap Code' },
    ]},
  ],
  cyberpunk: [
    { code: 'en', name: 'Street English', dialects: [
      { id: 'metro', name: 'Metro' },
      { id: 'corp', name: 'Corp-speak' },
      { id: 'slum', name: 'Slum Cant', isolated: true },
    ]},
    { code: 'ja', name: 'Japanese', dialects: [
      { id: 'neo-tokyo', name: 'Neo-Tokyo' },
      { id: 'yakuza', name: 'Underground' },
    ]},
    { code: 'zh', name: 'Mandarin', dialects: [
      { id: 'coastal', name: 'Coastal' },
      { id: 'triad', name: 'Triad Cant' },
    ]},
    { code: 'ru', name: 'Russian', dialects: [
      { id: 'bratva', name: 'Bratva' },
      { id: 'net', name: 'Net-slang' },
    ]},
    { code: 'netspeak', name: 'Netspeak', dialects: [
      { id: 'global', name: 'Global' },
    ]},
  ],
  horror: [
    { code: 'en', name: 'English', dialects: [
      { id: 'local', name: 'Local' },
      { id: 'old-country', name: 'Old Country', isolated: true },
    ]},
    { code: 'latin', name: 'Latin', dialects: [
      { id: 'church', name: 'Church' },
      { id: 'occult', name: 'Occult', isolated: true },
    ]},
    { code: 'old-tongue', name: 'Old Tongue', dialects: [
      { id: 'forgotten', name: 'Forgotten', isolated: true },
    ]},
  ],
  mystery: [
    { code: 'en', name: 'English', dialects: [
      { id: 'city', name: 'City' },
      { id: 'dock', name: 'Dockside' },
      { id: 'uptown', name: 'Uptown' },
    ]},
    { code: 'es', name: 'Spanish', dialects: [{ id: 'latin', name: 'Latin American' }, { id: 'spain', name: 'Spain' }] },
    { code: 'fr', name: 'French', dialects: [{ id: 'parisian', name: 'Parisian' }] },
    { code: 'de', name: 'German', dialects: [{ id: 'high', name: 'High German' }] },
    { code: 'it', name: 'Italian', dialects: [{ id: 'roman', name: 'Roman' }] },
    { code: 'ru', name: 'Russian', dialects: [{ id: 'standard', name: 'Standard' }] },
  ],

  pirate: [
    { code: 'en', name: 'Sailor\'s English', dialects: [
      { id: 'caribbean', name: 'Caribbean' },
      { id: 'bristol', name: 'Bristol' },
      { id: 'pirate', name: 'Pirate Cant' },
    ]},
    { code: 'es', name: 'Spanish', dialects: [
      { id: 'caribbean', name: 'Caribbean' },
      { id: 'castilian', name: 'Castilian' },
    ]},
    { code: 'fr', name: 'French', dialects: [{ id: 'creole', name: 'Creole' }] },
    { code: 'pt', name: 'Portuguese', dialects: [{ id: 'brasil', name: 'Brasil' }] },
    { code: 'trade', name: 'Port Cant', dialects: [{ id: 'freeport', name: 'Freeport' }] },
  ],
  western: [
    { code: 'en', name: 'English', dialects: [
      { id: 'frontier', name: 'Frontier' },
      { id: 'southern', name: 'Southern' },
      { id: 'eastern', name: 'Eastern' },
    ]},
    { code: 'es', name: 'Spanish', dialects: [
      { id: 'border', name: 'Border' },
      { id: 'mexican', name: 'Mexican' },
    ]},
    { code: 'native-sign', name: 'Plains Sign', dialects: [{ id: 'plains', name: 'Plains' }] },
  ],
  postapoc: [
    { code: 'en', name: 'Wasteland English', dialects: [
      { id: 'settler', name: 'Settler' },
      { id: 'raider', name: 'Raider Cant', isolated: true },
      { id: 'vault', name: 'Vault' },
    ]},
    { code: 'es', name: 'Spanish', dialects: [{ id: 'caravan', name: 'Caravan' }] },
    { code: 'sign', name: 'Trade Sign', dialects: [{ id: 'road', name: 'Road' }] },
  ],
  war: [
    { code: 'en', name: 'English', dialects: [
      { id: 'military', name: 'Military' },
      { id: 'civilian', name: 'Civilian' },
    ]},
    { code: 'de', name: 'German', dialects: [{ id: 'field', name: 'Field' }] },
    { code: 'ru', name: 'Russian', dialects: [{ id: 'front', name: 'Front' }] },
    { code: 'fr', name: 'French', dialects: [{ id: 'local', name: 'Local' }] },
    { code: 'it', name: 'Italian', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'pl', name: 'Polish', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'es', name: 'Spanish', dialects: [{ id: 'standard', name: 'Standard' }] },
  ],
  modern_life: [
    { code: 'en', name: 'English', dialects: [
      { id: 'general', name: 'General' },
      { id: 'regional', name: 'Regional' },
      { id: 'urban', name: 'Urban' },
    ]},
    { code: 'es', name: 'Spanish', dialects: [{ id: 'latin', name: 'Latin American' }, { id: 'spain', name: 'Spain' }] },
    { code: 'fr', name: 'French', dialects: [{ id: 'standard', name: 'Standard' }, { id: 'quebec', name: 'Québécois' }] },
    { code: 'de', name: 'German', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'it', name: 'Italian', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'pt', name: 'Portuguese', dialects: [{ id: 'brasil', name: 'Brazilian' }, { id: 'europe', name: 'European' }] },
    { code: 'ru', name: 'Russian', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'zh', name: 'Chinese', dialects: [{ id: 'mandarin', name: 'Mandarin' }, { id: 'cantonese', name: 'Cantonese', isolated: true }] },
    { code: 'ja', name: 'Japanese', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'ko', name: 'Korean', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'pl', name: 'Polish', dialects: [{ id: 'standard', name: 'Standard' }] },
    { code: 'asl', name: 'Sign Language', dialects: [{ id: 'standard', name: 'Standard' }] },
  ],

  custom: [
    { code: 'common', name: 'Common', dialects: [
      { id: 'standard', name: 'Standard' },
      { id: 'regional', name: 'Regional' },
      { id: 'isolated', name: 'Isolated', isolated: true },
    ]},
    { code: 'trade', name: 'Trade Speech', dialects: [{ id: 'caravan', name: 'Caravan' }] },
    { code: 'old-tongue', name: 'Old Tongue', dialects: [{ id: 'liturgical', name: 'Liturgical', isolated: true }] },
  ],
};

export const REGIONAL_LANGUAGES: Record<string, { primary: string; secondary: string[] }> = {
  western_europe: { primary: 'en', secondary: ['fr', 'de', 'es', 'it'] },
  eastern_europe: { primary: 'ru', secondary: ['pl', 'uk', 'de', 'cs'] },
  east_asia: { primary: 'zh', secondary: ['ja', 'ko', 'en'] },
  middle_east: { primary: 'ar', secondary: ['fa', 'he', 'en', 'tr'] },
  latin_america: { primary: 'es', secondary: ['pt', 'en'] },
  south_asia: { primary: 'hi', secondary: ['bn', 'en', 'ur'] },
  nordic: { primary: 'sv', secondary: ['no', 'da', 'en', 'fi'] },
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
  ru: ['да', 'нет', 'это', 'что', 'как', 'вы', 'мы', 'он', 'она', 'они', 'быть', 'весь'],
  zh: ['是', '的', '在', '有', '这', '了', '不', '人', '中', '大', '国', '我'],
  ja: ['です', 'ます', 'を', 'に', 'は', 'の', 'と', 'も', 'が', 'から', 'まで', 'そう'],
  ar: ['هذا', 'في', 'من', 'على', 'إلى', 'أن', 'هو', 'لا', 'ما', 'كان', 'لم', 'قد'],
  elvish: ['mel', 'ara', 'sil', 'wen', 'nor', 'tal', 'ith', 'elen', 'mir', 'cal', 'nín', 'loth'],
  dwarven: ['khaz', 'dum', 'baruk', 'moria', 'gund', 'bad', 'thrak', 'azan', 'durin', 'kheled'],
  orcish: ['gakh', 'uruk', 'nazg', 'ash', 'ghash', 'burzum', 'krimpat', 'throqu', 'gimbat', 'nar'],
  common: [],
  trade: [],
  galactic: ['kor', 'vel', 'ashi', 'dran', 'nox', 'pel', 'tari', 'mek', 'sul', 'vra'],
  'old-earth': ['the', 'and', 'was', 'old', 'earth', 'remember', 'home'],
  xeno: ['kth', 'rrii', 'vok', 'ssha', 'n\'ga', 'tlak', 'hrr', 'zix'],
  'machine-cant': ['0x', 'ACK', 'SYNC', 'PING', 'NULL', 'HEAP', 'CORE', 'BOOT'],
  draconic: ['shar', 'vex', 'korth', 'ixen', 'vignar', 'thrae', 'aurix', 'malsvir', 'usk', 'sthyr'],
  latin: ['et', 'non', 'est', 'quod', 'hoc', 'ad', 'per', 'cum', 'sed', 'aut'],
  'old-tongue': ['ul', 'thar', 'goth', 'nahl', 'mir', 'vek', 'osh', 'rael'],
  netspeak: ['ping', 'frag', 'jack', 'ice', 'chrome', 'flatline', 'deck', 'ghost'],
  sign: ['[gesture]', '[point]', '[wave]', '[tap]', '[hold]'],
  'native-sign': ['[sign]', '[point]', '[circle]', '[strike]'],
  en: [],
};

const CONTENT_WORDS = /^(the|a|an|and|or|but|to|of|in|on|at|for|with|is|are|was|were|be|been|that|this|it|as|by|from|they|you|i|he|she|we|not|no|yes|do|does|did|have|has|had|will|would|can|could|my|your|their)$/i;

// ─── Proficiency helpers ─────────────────────────────────────────────────────

export function proficiencyRank(level: ProficiencyLevel): number {
  return PROFICIENCY_ORDER.indexOf(level);
}

export function rankToProficiency(rank: number): ProficiencyLevel {
  const clamped = Math.max(0, Math.min(PROFICIENCY_ORDER.length - 1, rank));
  return PROFICIENCY_ORDER[clamped];
}

export function lowerProficiency(level: ProficiencyLevel, steps = 1): ProficiencyLevel {
  return rankToProficiency(proficiencyRank(level) - steps);
}

export function getLanguageCatalog(genre: string): LanguageOption[] {
  return GENRE_LANGUAGE_CATALOGS[genre] || GENRE_LANGUAGE_CATALOGS.custom;
}

export function getDefaultNativeForGenre(genre: string): { language: string; dialect: string } {
  const catalog = getLanguageCatalog(genre);
  const first = catalog[0];
  return {
    language: first?.code || 'common',
    dialect: first?.dialects[0]?.id || 'standard',
  };
}

export function isIsolatedDialect(genre: string, language: string, dialect: string): boolean {
  const lang = getLanguageCatalog(genre).find(l => l.code === language);
  return !!lang?.dialects.find(d => d.id === dialect)?.isolated;
}

export function areDistantDialects(
  genre: string,
  language: string,
  knownDialect: string,
  heardDialect: string
): boolean {
  if (!heardDialect || !knownDialect) return false;
  if (knownDialect === heardDialect) return false;
  // Isolated dialects always penalize; otherwise adjacent regions are milder (no penalty).
  return (
    isIsolatedDialect(genre, language, knownDialect) ||
    isIsolatedDialect(genre, language, heardDialect)
  );
}

/**
 * Effective speaking proficiency for a heard utterance, applying dialect penalty (~1 tier).
 */
export function getEffectiveProficiency(
  profile: CharacterLanguageProfile | undefined,
  speechLanguage: string,
  speechDialect: string | undefined,
  genre = 'fantasy'
): ProficiencyLevel {
  if (!profile) {
    return 'unknown';
  }
  const skill = profile.known.find(k => k.language === speechLanguage);
  if (!skill || skill.speaking === 'unknown') {
    // Same family → treat as basic in immersive? Keep unknown; family handled in light mode.
    return 'unknown';
  }
  let level: ProficiencyLevel = skill.speaking;
  if (
    speechDialect &&
    skill.dialect &&
    areDistantDialects(genre, speechLanguage, skill.dialect, speechDialect)
  ) {
    level = lowerProficiency(level, 1);
  } else if (speechDialect && skill.dialect && speechDialect !== skill.dialect) {
    // Nearby dialect: no penalty (same language ≠ gibberish when traveling nearby).
  }
  return level;
}

export function getSkillForLanguage(
  profile: CharacterLanguageProfile | undefined,
  language: string
): LanguageSkill | undefined {
  return profile?.known.find(k => k.language === language);
}

// ─── Point budget ────────────────────────────────────────────────────────────

export function costForSecondaryLanguage(skill: LanguageSkill, isNative: boolean): number {
  if (isNative) {
    // Native speaking free; literacy above conversational costs extra.
    const litRank = proficiencyRank(skill.literacy);
    const freeLit = proficiencyRank('conversational');
    return Math.max(0, litRank - freeLit);
  }
  return (
    PROFICIENCY_POINT_COST[skill.speaking] +
    Math.max(0, PROFICIENCY_POINT_COST[skill.literacy] - 1) // literacy slightly cheaper
  );
}

export function calculateLanguagePointsSpent(profile: CharacterLanguageProfile): number {
  return profile.known.reduce((sum, skill) => {
    const isNative = skill.language === profile.nativeLanguage;
    return sum + costForSecondaryLanguage(skill, isNative);
  }, 0);
}

export function createDefaultCharacterLanguageProfile(
  genre: string
): CharacterLanguageProfile {
  const { language, dialect } = getDefaultNativeForGenre(genre);
  const known: LanguageSkill[] = [
    {
      language,
      dialect,
      speaking: 'native',
      literacy: 'conversational',
    },
  ];
  return {
    nativeLanguage: language,
    nativeDialect: dialect,
    known,
    languagePointsSpent: 0,
  };
}

export function profileToKnownLanguageCodes(profile: CharacterLanguageProfile): string[] {
  return profile.known
    .filter(k => proficiencyRank(k.speaking) >= proficiencyRank('basic'))
    .map(k => k.language);
}

// ─── Location / NPC world logic ──────────────────────────────────────────────

const PORT_ZONE_HINTS = /port|harbor|harbour|dock|market|bazaar|caravan|station|spaceport|inn|tavern|frontier|border|embassy|camp/i;
const MILITARY_ZONE_HINTS = /barracks|fort|camp|outpost|trench|base|garrison/i;
const SCHOLAR_ZONE_HINTS = /library|university|temple|archive|academy|lab/i;

/**
 * Genre-aware location language assignment — NOT random polyglot spam.
 */
export function generateLocationLanguages(
  genre: string,
  zoneType: string,
  zoneName: string
): LocationLanguageProfile {
  const catalog = getLanguageCatalog(genre);
  const primary = catalog[0];
  const trade = catalog.find(l => l.code === 'trade' || l.code === 'galactic' || l.code === 'en') || primary;

  const dominantLanguage = primary.code;
  const dialects = primary.dialects;
  let dominantDialect = dialects[0]?.id || 'standard';

  const nameLower = `${zoneName} ${zoneType}`.toLowerCase();
  if (/highland|mountain|deep|vault|rim|colony|isolated|ruins/i.test(nameLower) && dialects.some(d => d.isolated)) {
    dominantDialect = dialects.find(d => d.isolated)!.id;
  } else if (/coast|port|sea|dock/i.test(nameLower)) {
    dominantDialect = dialects.find(d => /coast|port|sea|dock|rim|caribbean/i.test(d.id))?.id || dominantDialect;
  }

  const secondaryLanguages: string[] = [];
  const foreignSpeakerReasons: string[] = [];

  if (PORT_ZONE_HINTS.test(nameLower)) {
    if (trade.code !== dominantLanguage) secondaryLanguages.push(trade.code);
    foreignSpeakerReasons.push('merchant', 'sailor', 'traveler');
  }
  if (MILITARY_ZONE_HINTS.test(nameLower)) {
    foreignSpeakerReasons.push('soldier', 'officer', 'prisoner');
    const enemy = catalog[1];
    if (enemy && enemy.code !== dominantLanguage) {
      secondaryLanguages.push(enemy.code);
    }
  }
  if (SCHOLAR_ZONE_HINTS.test(nameLower)) {
    foreignSpeakerReasons.push('scholar', 'pilgrim');
    const liturgical = catalog.find(l => /latin|old-tongue|draconic|elvish|machine/i.test(l.code));
    if (liturgical && liturgical.code !== dominantLanguage) {
      secondaryLanguages.push(liturgical.code);
    }
  }
  if (/refugee|slum|camp|quarter|ghetto/i.test(nameLower)) {
    foreignSpeakerReasons.push('refugee', 'exile');
  }

  // Quiet village / residential: almost no foreign reasons
  if (
    foreignSpeakerReasons.length === 0 &&
    /village|hamlet|farm|homestead|suburb|residential/i.test(nameLower)
  ) {
    // intentionally empty — locals only
  } else if (foreignSpeakerReasons.length === 0 && /city|capital|metro|nexus/i.test(nameLower)) {
    foreignSpeakerReasons.push('merchant', 'diplomat');
    if (trade.code !== dominantLanguage) secondaryLanguages.push(trade.code);
  }

  return {
    dominantLanguage,
    dominantDialect,
    secondaryLanguages: [...new Set(secondaryLanguages)].slice(0, 2),
    tradeLanguage: trade.code !== dominantLanguage ? trade.code : undefined,
    foreignSpeakerReasons,
  };
}

export type NPCRoleHint =
  | 'local'
  | 'merchant'
  | 'soldier'
  | 'refugee'
  | 'scholar'
  | 'sailor'
  | 'diplomat'
  | 'traveler'
  | 'priest'
  | 'raider';

/**
 * Assign NPC languages from location + role — not random language stacks.
 */
export function assignNPCLanguages(opts: {
  genre: string;
  location: LocationLanguageProfile;
  role?: NPCRoleHint | string;
  education?: 'none' | 'basic' | 'moderate' | 'high' | 'scholar';
}): NPCLanguageProfile {
  const { genre, location, education = 'basic' } = opts;
  const role = (opts.role || 'local').toLowerCase();
  const catalog = getLanguageCatalog(genre);

  let primary = location.dominantLanguage;
  let dialect = location.dominantDialect;
  const known: string[] = [primary];
  const fluency: Record<string, number> = { [primary]: 1 };
  let foreignReason: string | undefined;

  const isForeignRole = /merchant|soldier|refugee|sailor|diplomat|traveler|exile|priest|raider|officer|prisoner|scholar|pilgrim/i.test(role);
  const locationAllowsForeign = location.foreignSpeakerReasons.length > 0;

  if (isForeignRole && locationAllowsForeign) {
    const reasonMatch = location.foreignSpeakerReasons.find(r => role.includes(r) || r.includes(role.replace(/_.*/, '')));
    foreignReason = reasonMatch || location.foreignSpeakerReasons[0];

    // Merchants/sailors: local + trade
    if (/merchant|sailor|traveler|diplomat/i.test(role) && location.tradeLanguage) {
      known.push(location.tradeLanguage);
      fluency[location.tradeLanguage] = 0.75;
    }
    // Refugees/soldiers: may have different primary from secondary catalog
    if (/refugee|exile|soldier|prisoner|raider/i.test(role) && catalog[1]) {
      primary = catalog[1].code;
      dialect = catalog[1].dialects[0]?.id || 'standard';
      known.length = 0;
      known.push(primary, location.dominantLanguage);
      fluency[primary] = 1;
      fluency[location.dominantLanguage] = education === 'none' ? 0.35 : 0.55;
      foreignReason = foreignReason || role;
    }
  }

  // Education adds trade/scholar tongues only when justified
  const eduCount = { none: 0, basic: 0, moderate: 1, high: 1, scholar: 2 }[education] ?? 0;
  if (eduCount > 0) {
    const extras = [
      ...location.secondaryLanguages,
      ...(location.tradeLanguage ? [location.tradeLanguage] : []),
    ].filter(l => !known.includes(l));
    for (let i = 0; i < Math.min(eduCount, extras.length); i++) {
      known.push(extras[i]);
      fluency[extras[i]] = 0.6 - i * 0.1;
    }
  }

  // Cap: villagers don't speak 7 languages
  const maxKnown = education === 'scholar' ? 3 : education === 'high' ? 3 : 2;
  const trimmed = known.slice(0, maxKnown);

  return {
    primary,
    dialect,
    known: trimmed,
    fluency: Object.fromEntries(trimmed.map(l => [l, fluency[l] ?? 0.5])),
    foreignReason,
  };
}

/** Legacy helper used by older code paths. */
export function createNPCLanguageProfile(
  region: string = 'fantasy_common',
  education: 'none' | 'basic' | 'moderate' | 'high' | 'scholar' = 'basic'
): NPCLanguageProfile {
  const langConfig = REGIONAL_LANGUAGES[region] || REGIONAL_LANGUAGES.fantasy_common;
  const location: LocationLanguageProfile = {
    dominantLanguage: langConfig.primary,
    dominantDialect: 'standard',
    secondaryLanguages: langConfig.secondary.slice(0, 2),
    foreignSpeakerReasons: langConfig.secondary.length ? ['traveler', 'merchant'] : [],
  };
  return assignNPCLanguages({ genre: 'fantasy', location, education, role: 'local' });
}

// ─── Interpretation ──────────────────────────────────────────────────────────

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickContentWords(text: string): string[] {
  return text
    .replace(/["""'']/g, '')
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z\-']/g, ''))
    .filter(w => w.length > 2 && !CONTENT_WORDS.test(w));
}

/** Basic: key fragments only. */
export function interpretAsFragments(trueText: string): string {
  const words = pickContentWords(trueText);
  if (words.length === 0) return '…';
  const seed = hashSeed(trueText);
  const keep = Math.max(1, Math.min(4, Math.ceil(words.length * 0.35)));
  const selected: string[] = [];
  for (let i = 0; i < keep; i++) {
    selected.push(words[(seed + i * 7) % words.length]);
  }
  return selected.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('… ') + '…';
}

const BROKEN_ASSUMPTIONS = [
  'something about payment',
  'a warning of some kind',
  'a request for help',
  'mention of family or kin',
  'directions somewhere nearby',
  'an offer of trade',
  'a threat, maybe',
  'news from the road',
];

/** Broken: approximate paraphrase that may include wrong assumptions. */
export function interpretAsBroken(trueText: string): string {
  const fragments = pickContentWords(trueText).slice(0, 3);
  const seed = hashSeed(trueText);
  const assumption = BROKEN_ASSUMPTIONS[seed % BROKEN_ASSUMPTIONS.length];
  if (fragments.length === 0) {
    return `(You gather it's ${assumption}.)`;
  }
  return `(Rough sense: ${fragments.join(', ')}… — ${assumption}.)`;
}

export function partiallyObscureText(text: string, obscureRatio = 0.35): string {
  const words = text.split(' ');
  const seed = hashSeed(text);
  return words
    .map((word, i) => {
      if (word.length > 3 && ((seed + i * 13) % 100) / 100 < obscureRatio) {
        return '[...]';
      }
      return word;
    })
    .join(' ');
}

export function generateForeignPlaceholder(text: string, language: string): string {
  if (language === 'common' || language === 'trade' || language === 'en' || language === 'galactic') {
    // Still mark as foreign-sounding if phonemes empty — use generic syllables
  }
  const phonemes = PHONEME_SETS[language] || PHONEME_SETS.elvish;
  if (phonemes.length === 0) {
    // Accented same-language: return as-is for light mode callers
    return text;
  }
  const words = text.split(/\s+/).filter(Boolean);
  const seed = hashSeed(text + language);
  const result: string[] = [];
  for (let i = 0; i < Math.max(1, words.length); i++) {
    result.push(phonemes[(seed + i * 3) % phonemes.length]);
  }
  return result.join(' ');
}

/**
 * Interpret NPC speech for the PC's comprehension level.
 */
export function interpretSpeech(
  trueText: string,
  proficiency: ProficiencyLevel,
  opts: {
    mode?: LanguageBarrierMode;
    language?: string;
    translateEnabled?: boolean;
    companionLabel?: string;
  } = {}
): InterpretedSpeech {
  const mode = opts.mode ?? 'immersive';
  const language = opts.language || 'unknown';
  const translateEnabled = opts.translateEnabled ?? false;

  if (mode === 'disabled' || proficiency === 'native' || proficiency === 'fluent') {
    return {
      proficiency,
      perceived: trueText,
      trueMeaning: trueText,
      displayHtml: `"${trueText}"`,
      confirmed: true,
    };
  }

  if (mode === 'light') {
    // Light: accents / occasional misses — never full gibberish for known families
    if (proficiency === 'conversational' || proficiency === 'broken') {
      const lightly = partiallyObscureText(trueText, 0.12);
      return {
        proficiency,
        perceived: lightly,
        trueMeaning: trueText,
        displayHtml: `"${lightly}"`,
        confirmed: false,
      };
    }
    if (proficiency === 'basic') {
      const frag = interpretAsFragments(trueText);
      const foreign = generateForeignPlaceholder(trueText, language);
      let displayHtml = `<span class="foreign-text">"${foreign}"</span>`;
      displayHtml += ` <span class="partial-gloss">(${frag})</span>`;
      if (translateEnabled) {
        displayHtml += ` <span class="translation">*${trueText}*</span>`;
      }
      return {
        proficiency,
        perceived: frag,
        partialGloss: frag,
        trueMeaning: trueText,
        displayHtml,
        confirmed: false,
      };
    }
    // unknown in light: foreign + optional italics
    const foreign = generateForeignPlaceholder(trueText, language);
    let displayHtml = `<span class="foreign-text">"${foreign}"</span>`;
    if (translateEnabled) {
      displayHtml += ` <span class="translation">*${trueText}*</span>`;
    }
    return {
      proficiency: 'unknown',
      perceived: foreign,
      trueMeaning: trueText,
      displayHtml,
      confirmed: false,
    };
  }

  // Immersive
  if (proficiency === 'conversational') {
    const partial = partiallyObscureText(trueText, 0.28);
    return {
      proficiency,
      perceived: partial,
      trueMeaning: trueText,
      displayHtml: `"${partial}"`,
      confirmed: false,
    };
  }

  if (proficiency === 'broken') {
    const broken = interpretAsBroken(trueText);
    const foreign = generateForeignPlaceholder(trueText, language);
    let displayHtml = `<span class="foreign-text">"${foreign}"</span> <span class="partial-gloss">${broken}</span>`;
    if (translateEnabled) {
      displayHtml += ` <span class="translation">*${trueText}*</span>`;
    }
    return {
      proficiency,
      perceived: broken,
      partialGloss: broken,
      trueMeaning: trueText,
      displayHtml,
      confirmed: false,
    };
  }

  if (proficiency === 'basic') {
    const frag = interpretAsFragments(trueText);
    const foreign = generateForeignPlaceholder(trueText, language);
    let displayHtml = `<span class="foreign-text">"${foreign}"</span> <span class="partial-gloss">(${frag})</span>`;
    if (translateEnabled) {
      displayHtml += ` <span class="translation">*${trueText}*</span>`;
    }
    return {
      proficiency,
      perceived: frag,
      partialGloss: frag,
      trueMeaning: trueText,
      displayHtml,
      confirmed: false,
    };
  }

  // unknown
  const foreign = generateForeignPlaceholder(trueText, language);
  let displayHtml = `<span class="foreign-text">"${foreign}"</span>`;
  if (translateEnabled) {
    displayHtml += ` <span class="translation">*${trueText}*</span>`;
  }
  return {
    proficiency: 'unknown',
    perceived: foreign,
    trueMeaning: trueText,
    displayHtml,
    confirmed: false,
  };
}

/**
 * Companion claims a translation — biased by loyalty/agenda, not objective truth.
 */
export function companionTranslate(
  trueText: string,
  companion: {
    id: string;
    name: string;
    affinity: number;
    trust: number;
    knownLanguages?: string[];
  },
  speechLanguage: string
): CompanionTranslationResult {
  const knows =
    !companion.knownLanguages ||
    companion.knownLanguages.length === 0 ||
    companion.knownLanguages.includes(speechLanguage);

  let bias: CompanionTranslationResult['bias'] = 'neutral';
  if (companion.affinity >= 40 && companion.trust >= 40) bias = 'loyal';
  else if (companion.affinity < -10 || companion.trust < 25) bias = 'hostile';
  else if (companion.affinity < 15 && companion.trust < 40) bias = 'agenda';

  let claimed = trueText;
  let isAccurate = true;

  if (!knows) {
    claimed = '(They shrug — they don\'t actually speak this tongue.)';
    isAccurate = false;
    bias = 'neutral';
  } else if (bias === 'hostile') {
    // Twist: omit danger / reframe as insult or demand
    claimed = trueText
      .replace(/help|aid|warn|danger|careful|trust/gi, 'nothing important')
      .replace(/friend|ally|welcome/gi, 'fool');
    if (claimed === trueText) {
      claimed = `${trueText} (They make it sound more hostile than it was.)`;
    }
    isAccurate = false;
  } else if (bias === 'agenda') {
    claimed = `${trueText} — though ${companion.name} steers you toward what benefits them.`;
    isAccurate = false;
  }

  const displayHtml =
    `<span class="companion-translation">[${companion.name} translates]: "${claimed}"</span>`;

  return {
    companionName: companion.name,
    companionId: companion.id,
    claimedMeaning: claimed,
    bias,
    displayHtml,
    isAccurate,
  };
}

// ─── Understanding (legacy + extended) ───────────────────────────────────────

export function canUnderstand(
  playerLanguages: string[],
  npcLanguage: string,
  allowPartial: boolean = true
): UnderstandingResult {
  if (playerLanguages.includes(npcLanguage)) {
    return { understood: true, level: 'full', proficiency: 'fluent' };
  }
  if (allowPartial) {
    for (const [, familyLanguages] of Object.entries(LANGUAGE_FAMILIES)) {
      if (
        familyLanguages.includes(npcLanguage) &&
        familyLanguages.some(lang => playerLanguages.includes(lang))
      ) {
        return { understood: true, level: 'partial', proficiency: 'basic' };
      }
    }
  }
  return { understood: false, level: 'none', proficiency: 'unknown' };
}

export function formatNPCDialogue(
  text: string,
  npcLanguage: string,
  languageState: LanguageSystemState,
  npcDialect?: string,
  genre = 'fantasy'
): string {
  if (languageState.mode === 'disabled') return text;

  const proficiency = languageState.characterProfile
    ? getEffectiveProficiency(languageState.characterProfile, npcLanguage, npcDialect, genre)
    : canUnderstand(languageState.playerKnownLanguages, npcLanguage).proficiency;

  return interpretSpeech(text, proficiency, {
    mode: languageState.mode,
    language: npcLanguage,
    translateEnabled: languageState.translateEnabled,
  }).displayHtml;
}

// ─── Prompt context ──────────────────────────────────────────────────────────

export function buildLanguageContext(
  languageState: LanguageSystemState,
  activeNPCs?: Array<{ name: string; languageProfile?: NPCLanguageProfile }>,
  opts?: {
    genre?: string;
    location?: LocationLanguageProfile;
    companions?: Array<{ id: string; name: string; affinity: number; trust: number; knownLanguages?: string[] }>;
    recentMisunderstandings?: MisunderstandingRecord[];
  }
): string {
  if (languageState.mode === 'disabled') {
    return `\n=== LANGUAGE SYSTEM ===
Language Barriers: DISABLED
Everyone communicates normally. Do not apply language barriers, foreign speech tags, or misunderstanding stakes.
`;
  }

  const profile = languageState.characterProfile;
  const knownList = profile
    ? profile.known
        .map(
          k =>
            `${getLanguageDisplayName(k.language)} (${k.dialect || 'standard'}: speak ${k.speaking}, read ${k.literacy})`
        )
        .join('; ')
    : languageState.playerKnownLanguages.join(', ');

  let context = `\n=== LANGUAGE BARRIERS (${languageState.mode.toUpperCase()}) ===
PC languages: ${knownList}
Native: ${profile ? `${getLanguageDisplayName(profile.nativeLanguage)} / ${profile.nativeDialect}` : languageState.playerLanguage}
Translated in Italics assist: ${languageState.translateEnabled ? 'ON (client may show true meaning in italics — still roleplay PC comprehension)' : 'OFF'}
`;

  if (opts?.location) {
    context += `\nLocation tongue: ${getLanguageDisplayName(opts.location.dominantLanguage)} (${opts.location.dominantDialect})`;
    if (opts.location.secondaryLanguages.length) {
      context += `\nSecondary/trade: ${opts.location.secondaryLanguages.map(getLanguageDisplayName).join(', ')}`;
    }
    context += `\nForeign speakers only with reason: ${opts.location.foreignSpeakerReasons.join(', ') || 'none (locals only)'}`;
  }

  if (activeNPCs && activeNPCs.length > 0) {
    context += '\n\nNPCs in scene:\n';
    for (const npc of activeNPCs) {
      if (npc.languageProfile) {
        const speaks = npc.languageProfile.known.map(getLanguageDisplayName).join(', ');
        const eff = profile
          ? getEffectiveProficiency(
              profile,
              npc.languageProfile.primary,
              npc.languageProfile.dialect,
              opts?.genre
            )
          : canUnderstand(languageState.playerKnownLanguages, npc.languageProfile.primary).proficiency;
        context += `- ${npc.name}: speaks ${speaks} [${npc.languageProfile.dialect}] — PC hears at ${eff}`;
        if (npc.languageProfile.foreignReason) {
          context += ` (foreign reason: ${npc.languageProfile.foreignReason})`;
        }
        context += '\n';
      }
    }
  }

  if (opts?.companions && opts.companions.length > 0) {
    context += '\nCompanions as interpreters:\n';
    for (const c of opts.companions) {
      const bias =
        c.affinity >= 40 && c.trust >= 40
          ? 'loyal'
          : c.affinity < -10 || c.trust < 25
            ? 'hostile/biased'
            : 'neutral (may spin)';
      context += `- ${c.name}: may translate; bias=${bias}. Translation is what they CLAIM, not objective truth.\n`;
    }
  }

  const openMis = (opts?.recentMisunderstandings || languageState.misunderstandings)
    .filter(m => !m.corrected)
    .slice(-5);
  if (openMis.length > 0) {
    context += '\nUnresolved misunderstandings (may resurface):\n';
    for (const m of openMis) {
      context += `- Believed "${m.believed}" but truth was related to: ${m.trueMeaning.slice(0, 80)}\n`;
    }
  }

  if (languageState.mode === 'light') {
    context += `
LIGHT MODE RULES:
- Most speech is understandable; use accents, dialect color, and occasional missed words
- Only rare full barriers (isolated dialects, truly foreign tongues)
- Tag rare foreign lines: [LANGUAGE: code|dialect] "true dialogue in English for the GM"
- Player response options must match what the PC understood
- NPCs: simplify, gesture, or grow frustrated based on personality — not random gibberish
`;
  } else {
    context += `
IMMERSIVE MODE RULES:
- Core: game knows truth; player sees PC comprehension only
- Tag foreign/partial speech: [LANGUAGE: code|dialect] "true meaning in clear English"
- Client/interpreter will obscure by proficiency — you still write the TRUE line inside the tag
- Proficiency effects: Basic=fragments, Broken=wrong assumptions possible, Conversational=mostly clear, Fluent/Native=full
- Distant/isolated dialects lower effective proficiency by ~1
- Same language in nearby regions is NOT gibberish
- NPCs react by personality: simplify speech, gesture, fetch a translator, exploit confusion, assume understood, grow frustrated
- Player choices MUST match what they understood — nodding along risks goats/marriage/wrong deals
- Companions translate with loyalty/agenda bias — label as their claim
- Do NOT give every villager 7 languages; foreign speakers need a reason (merchant, refugee, soldier, port, etc.)
- Learning: rare [LEARN_LANGUAGE:code:reason] or [LANGUAGE_EXPOSURE:code:amount] after immersion/study
`;
  }

  return context;
}

const LANGUAGE_TAG_PATTERN =
  /\[LANGUAGE:\s*([a-z0-9_-]+)(?:\|([a-z0-9_-]+))?\]\s*"([^"]+)"(?:\s*\[TRANSLATED_BY:\s*([^\]]+)\])?/gi;

/**
 * Capture misunderstandings that matter (basic/broken/unknown) for later correction.
 */
export function collectMisunderstandingsFromTaggedSpeech(
  response: string,
  languageState: LanguageSystemState,
  genre = 'fantasy'
): MisunderstandingRecord[] {
  if (languageState.mode === 'disabled') return [];
  const out: MisunderstandingRecord[] = [];
  const re = new RegExp(LANGUAGE_TAG_PATTERN.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(response)) !== null) {
    const code = match[1].toLowerCase();
    const dial = match[2]?.toLowerCase();
    const dialogue = match[3];
    const translator = match[4]?.trim();
    const proficiency = languageState.characterProfile
      ? getEffectiveProficiency(languageState.characterProfile, code, dial, genre)
      : canUnderstand(languageState.playerKnownLanguages, code).proficiency;
    if (proficiencyRank(proficiency) >= proficiencyRank('conversational')) continue;
    const interpreted = interpretSpeech(dialogue, proficiency, {
      mode: languageState.mode,
      language: code,
      translateEnabled: false,
    });
    out.push({
      id: `mis_${Date.now()}_${out.length}`,
      timestamp: Date.now(),
      language: code,
      trueMeaning: dialogue,
      understoodAs: interpreted.perceived,
      believed: interpreted.partialGloss || interpreted.perceived,
      interpreterName: translator,
      interpreterBias: translator ? 'neutral' : undefined,
    });
  }
  return out;
}

/**
 * Post-process AI response language tags into PC-comprehension display.
 * Supports: [LANGUAGE: code] "dialogue" and [LANGUAGE: code|dialect] "dialogue"
 * Optional companion: [TRANSLATED_BY: companionName]
 */
export function postProcessLanguageInResponse(
  response: string,
  languageState: LanguageSystemState,
  genre = 'fantasy'
): string {
  if (languageState.mode === 'disabled') {
    return response
      .replace(/\[LANGUAGE:\s*[^\]]+\]\s*/gi, '')
      .replace(/\[TRANSLATED_BY:\s*[^\]]+\]\s*/gi, '');
  }

  return response.replace(LANGUAGE_TAG_PATTERN, (_match, lang, dialect, dialogue, translator) => {
    const code = String(lang).toLowerCase();
    const dial = dialect ? String(dialect).toLowerCase() : undefined;
    const proficiency = languageState.characterProfile
      ? getEffectiveProficiency(languageState.characterProfile, code, dial, genre)
      : canUnderstand(languageState.playerKnownLanguages, code).proficiency;

    const interpreted = interpretSpeech(dialogue, proficiency, {
      mode: languageState.mode,
      language: code,
      translateEnabled: languageState.translateEnabled,
    });

    if (translator && translator.trim()) {
      return `${interpreted.displayHtml} <span class="companion-translation">[${translator.trim()} translates — their claim]</span>`;
    }
    return interpreted.displayHtml;
  });
}

// ─── Learning & misunderstandings ────────────────────────────────────────────

export function recordMisunderstanding(
  state: LanguageSystemState,
  record: Omit<MisunderstandingRecord, 'id' | 'timestamp'>
): LanguageSystemState {
  const entry: MisunderstandingRecord = {
    ...record,
    id: `mis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  return {
    ...state,
    misunderstandings: [...state.misunderstandings.slice(-39), entry],
  };
}

export function addLanguageExposure(
  state: LanguageSystemState,
  language: string,
  amount: number
): LanguageSystemState {
  if (state.mode === 'disabled') return state;
  const prev = state.exposure[language] || 0;
  const next = Math.min(100, prev + amount);
  let profile = state.characterProfile;
  let playerKnownLanguages = state.playerKnownLanguages;

  // Thresholds: 25 → basic, 50 → broken, 75 → conversational bump
  if (profile) {
    const existing = profile.known.find(k => k.language === language);
    const thresholds: Array<{ at: number; level: ProficiencyLevel }> = [
      { at: 25, level: 'basic' },
      { at: 50, level: 'broken' },
      { at: 75, level: 'conversational' },
      { at: 100, level: 'fluent' },
    ];
    const highest = [...thresholds].reverse().find(t => next >= t.at);
    let known = [...profile.known];
    if (highest) {
      if (!existing) {
        known.push({
          language,
          dialect: 'standard',
          speaking: highest.level,
          literacy: 'unknown',
        });
      } else if (proficiencyRank(existing.speaking) < proficiencyRank(highest.level)) {
        known = known.map(k =>
          k.language === language ? { ...k, speaking: highest.level } : k
        );
      }
    }
    const byLang = new Map<string, LanguageSkill>();
    for (const k of known) {
      const prevK = byLang.get(k.language);
      if (!prevK || proficiencyRank(k.speaking) > proficiencyRank(prevK.speaking)) {
        byLang.set(k.language, k);
      }
    }
    profile = { ...profile, known: [...byLang.values()] };
    playerKnownLanguages = profileToKnownLanguageCodes(profile);
  } else if (next >= 50 && !playerKnownLanguages.includes(language)) {
    playerKnownLanguages = [...playerKnownLanguages, language];
  }

  return {
    ...state,
    exposure: { ...state.exposure, [language]: next },
    characterProfile: profile,
    playerKnownLanguages,
  };
}

export function learnLanguage(
  state: LanguageSystemState,
  language: string
): LanguageSystemState {
  return addLanguageExposure(state, language, 50);
}

// ─── State lifecycle ─────────────────────────────────────────────────────────

export function createLanguageSystemState(
  partial?: Partial<LanguageSystemState>
): LanguageSystemState {
  const browserLang =
    typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] || 'en' : 'en';

  return {
    mode: 'disabled',
    playerLanguage: browserLang,
    playerKnownLanguages: ['en', 'common'],
    translateEnabled: false,
    locationLanguages: {},
    misunderstandings: [],
    exposure: {},
    ...partial,
  };
}

export function applyCharacterProfileToState(
  state: LanguageSystemState,
  profile: CharacterLanguageProfile,
  mode?: LanguageBarrierMode
): LanguageSystemState {
  return {
    ...state,
    mode: mode ?? state.mode,
    characterProfile: profile,
    playerLanguage: profile.nativeLanguage,
    playerKnownLanguages: profileToKnownLanguageCodes(profile),
  };
}

export function ensureLocationLanguage(
  state: LanguageSystemState,
  zoneId: string,
  genre: string,
  zoneType: string,
  zoneName: string
): LanguageSystemState {
  if (state.locationLanguages[zoneId]) return state;
  return {
    ...state,
    locationLanguages: {
      ...state.locationLanguages,
      [zoneId]: generateLocationLanguages(genre, zoneType, zoneName),
    },
  };
}

export function serializeLanguageState(state: LanguageSystemState): string {
  return JSON.stringify(state);
}

export function deserializeLanguageState(data: string): LanguageSystemState {
  try {
    const parsed = JSON.parse(data);
    return createLanguageSystemState({
      mode: parsed.mode === 'light' || parsed.mode === 'immersive' || parsed.mode === 'disabled'
        ? parsed.mode
        : 'disabled',
      playerLanguage: parsed.playerLanguage || 'en',
      playerKnownLanguages: parsed.playerKnownLanguages || ['en', 'common'],
      translateEnabled: parsed.translateEnabled ?? false,
      characterProfile: parsed.characterProfile,
      locationLanguages: parsed.locationLanguages || {},
      misunderstandings: parsed.misunderstandings || [],
      exposure: parsed.exposure || {},
    });
  } catch {
    return createLanguageSystemState();
  }
}

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
    trade: 'Trade Cant',
    elvish: 'Elvish',
    dwarven: 'Dwarven',
    orcish: 'Orcish',
    draconic: 'Draconic',
    galactic: 'Galactic Standard',
    'old-earth': 'Old Earth',
    xeno: 'Xeno Tongue',
    'machine-cant': 'Machine Cant',
    latin: 'Latin',
    'old-tongue': 'Old Tongue',
    netspeak: 'Netspeak',
    sign: 'Trade Sign',
    'native-sign': 'Plains Sign',
  };
  return displayNames[code] || code.charAt(0).toUpperCase() + code.slice(1).replace(/-/g, ' ');
}

/** NPC reaction hints for prompts / UI. */
export const NPC_LANGUAGE_REACTIONS = [
  'simplify speech',
  'gesture and point',
  'fetch a translator',
  'grow frustrated',
  'assume understood and continue',
  'exploit the confusion',
  'switch to trade tongue',
  'speak louder (uselessly)',
] as const;
