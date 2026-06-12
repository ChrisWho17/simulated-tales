// Nationality / Accent System
// Drives speech accents for the player & NPCs. Tied to languageSystem.ts.

export type NationalityRegion =
  | 'western_europe' | 'eastern_europe' | 'nordic' | 'mediterranean'
  | 'east_asia' | 'south_asia' | 'middle_east' | 'africa'
  | 'north_america' | 'latin_america' | 'oceania'
  | 'fantasy_common' | 'fantasy_elven' | 'fantasy_dwarven' | 'fantasy_orcish';

export interface Nationality {
  id: string;
  label: string;
  region: NationalityRegion;
  defaultLanguage: string;       // language code from languageSystem
  accentLabel: string;           // short name for the accent ("Parisian French", "Brooklyn")
  accentDescriptor: string;      // 1-line prose hint for the AI ("clipped vowels, dropped Hs")
  signatureMarkers: string[];    // phonetic / lexical tells the AI may sprinkle in
}

export const NATIONALITIES: Nationality[] = [
  // North America
  { id: 'american_general',   label: 'American (General)',  region: 'north_america',  defaultLanguage: 'en', accentLabel: 'General American', accentDescriptor: 'flat vowels, rhotic Rs, casual contractions', signatureMarkers: ['gonna', 'y\'all', 'kinda'] },
  { id: 'american_southern',  label: 'American (Southern)', region: 'north_america',  defaultLanguage: 'en', accentLabel: 'Southern drawl', accentDescriptor: 'slow drawl, dropped Gs, soft vowels', signatureMarkers: ['darlin\'', 'fixin\' to', 'y\'all', 'reckon'] },
  { id: 'american_newengland', label: 'American (New England)', region: 'north_america',  defaultLanguage: 'en', accentLabel: 'New England', accentDescriptor: 'non-rhotic Rs (\"pahk the cah\"), broad As, clipped cadence', signatureMarkers: ['wicked', 'pissah', 'down the cape', 'bubblah'] },
  { id: 'canadian',           label: 'Canadian',            region: 'north_america',  defaultLanguage: 'en', accentLabel: 'Canadian', accentDescriptor: 'rounded Os, polite tags, soft consonants', signatureMarkers: ['eh', 'sorry', 'aboot'] },
  // British isles
  { id: 'british_rp',         label: 'British (RP)',        region: 'western_europe', defaultLanguage: 'en', accentLabel: 'Received Pronunciation', accentDescriptor: 'crisp consonants, non-rhotic Rs, formal register', signatureMarkers: ['rather', 'quite', 'I daresay'] },
  { id: 'british_cockney',    label: 'British (Cockney)',   region: 'western_europe', defaultLanguage: 'en', accentLabel: 'Cockney', accentDescriptor: 'dropped Hs, glottal stops, rhyming slang', signatureMarkers: ['\'ello guv', 'innit', 'bloody'] },
  { id: 'scottish',           label: 'Scottish',            region: 'western_europe', defaultLanguage: 'en', accentLabel: 'Scottish', accentDescriptor: 'rolled Rs, hard consonants, melodic up-down cadence', signatureMarkers: ['wee', 'aye', 'ken', 'cannae'] },
  { id: 'irish',              label: 'Irish',               region: 'western_europe', defaultLanguage: 'en', accentLabel: 'Hiberno-English', accentDescriptor: 'lilting cadence, soft Ts, inverted phrasing', signatureMarkers: ['feckin\'', 'grand', 'tis'] },
  { id: 'australian',         label: 'Australian',          region: 'oceania',        defaultLanguage: 'en', accentLabel: 'Strine', accentDescriptor: 'rising terminals, clipped Is, casual diminutives', signatureMarkers: ['mate', 'reckon', 'crikey', 'arvo'] },
  // Western Europe
  { id: 'french',             label: 'French',              region: 'western_europe', defaultLanguage: 'fr', accentLabel: 'French', accentDescriptor: 'soft Rs from the throat, dropped Hs, melodic intonation', signatureMarkers: ['oui', 'non', 'mon ami', 'voilà'] },
  { id: 'german',             label: 'German',              region: 'western_europe', defaultLanguage: 'de', accentLabel: 'German', accentDescriptor: 'hard consonants, V-for-W, precise diction', signatureMarkers: ['ja', 'nein', 'achtung'] },
  { id: 'spanish',            label: 'Spanish',             region: 'mediterranean',  defaultLanguage: 'es', accentLabel: 'Castilian', accentDescriptor: 'rolled Rs, lisped Cs, warm cadence', signatureMarkers: ['sí', 'vale', 'hombre'] },
  { id: 'italian',            label: 'Italian',             region: 'mediterranean',  defaultLanguage: 'it', accentLabel: 'Italian', accentDescriptor: 'sing-song melody, vowel-heavy endings, expressive hand-cues', signatureMarkers: ['ciao', 'mamma mia', 'bene'] },
  // Eastern Europe / Slavic
  { id: 'russian',            label: 'Russian',             region: 'eastern_europe', defaultLanguage: 'ru', accentLabel: 'Russian', accentDescriptor: 'flat affect, hard Ts, dropped articles', signatureMarkers: ['da', 'nyet', 'tovarisch'] },
  { id: 'polish',             label: 'Polish',              region: 'eastern_europe', defaultLanguage: 'pl', accentLabel: 'Polish', accentDescriptor: 'consonant clusters, stress on second-to-last syllable', signatureMarkers: ['tak', 'kurwa', 'dzień dobry'] },
  // Nordic
  { id: 'swedish',            label: 'Swedish',             region: 'nordic',         defaultLanguage: 'sv', accentLabel: 'Swedish', accentDescriptor: 'sing-song pitch, soft consonants, melodic up-glide', signatureMarkers: ['ja', 'jävla', 'tack'] },
  // East Asia
  { id: 'japanese',           label: 'Japanese',            region: 'east_asia',      defaultLanguage: 'ja', accentLabel: 'Japanese', accentDescriptor: 'flat L/R distinction, particle-final inflection, polite tags', signatureMarkers: ['hai', 'sumimasen', '-san'] },
  { id: 'chinese_mandarin',   label: 'Chinese (Mandarin)',  region: 'east_asia',      defaultLanguage: 'zh', accentLabel: 'Mandarin', accentDescriptor: 'tonal pitch, dropped articles, compressed plurals', signatureMarkers: ['ni hao', 'aiyah'] },
  { id: 'korean',             label: 'Korean',              region: 'east_asia',      defaultLanguage: 'ko', accentLabel: 'Korean', accentDescriptor: 'verb-final order, honorific tails, fricative Ss', signatureMarkers: ['ne', 'aish', 'oppa'] },
  // South Asia / Middle East
  { id: 'indian',             label: 'Indian',              region: 'south_asia',     defaultLanguage: 'hi', accentLabel: 'Indian English', accentDescriptor: 'retroflex Ts and Ds, sing-song lilt, present-continuous favored', signatureMarkers: ['yaar', 'na', 'kindly'] },
  { id: 'arabic',             label: 'Arabic',              region: 'middle_east',    defaultLanguage: 'ar', accentLabel: 'Arabic', accentDescriptor: 'guttural Hs and Qs, emphatic consonants, poetic flourishes', signatureMarkers: ['habibi', 'inshallah', 'yallah'] },
  // Latin America
  { id: 'mexican',            label: 'Mexican',             region: 'latin_america',  defaultLanguage: 'es', accentLabel: 'Mexican Spanish', accentDescriptor: 'warm rolled Rs, soft Js, diminutive endings', signatureMarkers: ['órale', 'wey', 'ándale'] },
  { id: 'brazilian',          label: 'Brazilian',           region: 'latin_america',  defaultLanguage: 'pt', accentLabel: 'Brazilian Portuguese', accentDescriptor: 'nasal vowels, melodic rhythm, soft sibilants', signatureMarkers: ['cara', 'beleza', 'né'] },
  // Africa
  { id: 'south_african',      label: 'South African',       region: 'africa',         defaultLanguage: 'en', accentLabel: 'South African', accentDescriptor: 'clipped vowels, K-sound clicks, hard Rs', signatureMarkers: ['ja', 'lekker', 'bru'] },
  // Fantasy archetypes
  { id: 'fantasy_human',      label: 'Common Folk (Fantasy)', region: 'fantasy_common', defaultLanguage: 'common', accentLabel: 'Common', accentDescriptor: 'neutral trade-tongue cadence, plain phrasing', signatureMarkers: [] },
  { id: 'fantasy_elf',        label: 'Elven',               region: 'fantasy_elven',  defaultLanguage: 'elvish', accentLabel: 'Elven lilt', accentDescriptor: 'flowing vowels, archaic word order, breath-soft consonants', signatureMarkers: ['mellon', 'aiya'] },
  { id: 'fantasy_dwarf',      label: 'Dwarven',             region: 'fantasy_dwarven', defaultLanguage: 'dwarven', accentLabel: 'Dwarven', accentDescriptor: 'gravel-deep timbre, rolled Rs, blunt phrasing', signatureMarkers: ['aye', 'lad', 'by my beard'] },
  { id: 'fantasy_orc',        label: 'Orcish',              region: 'fantasy_orcish', defaultLanguage: 'orcish', accentLabel: 'Orcish', accentDescriptor: 'guttural growl, clipped syllables, dropped articles', signatureMarkers: ['grakh', 'urrgh'] },
];

export function getNationality(id?: string | null): Nationality | undefined {
  if (!id) return undefined;
  return NATIONALITIES.find(n => n.id === id);
}

export function getDefaultLanguageForNationality(id?: string | null): string {
  return getNationality(id)?.defaultLanguage || 'en';
}

export function getRegionForNationality(id?: string | null): NationalityRegion {
  return getNationality(id)?.region || 'fantasy_common';
}

export function formatNationalityForAI(id?: string | null): string {
  const n = getNationality(id);
  if (!n) return '';
  const markers = n.signatureMarkers.length ? ` Signature tells: ${n.signatureMarkers.join(', ')}.` : '';
  return `${n.label} — ${n.accentLabel}: ${n.accentDescriptor}.${markers}`;
}
