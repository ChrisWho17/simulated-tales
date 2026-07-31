// Scene cast resolution — figures out WHO is actually in the illustrated moment
// and, critically, their gender, so generated illustrations stop inventing
// men where the story has women (and vice versa).

export interface SceneCastMember {
  name: string;
  gender: 'male' | 'female' | 'nonbinary' | 'unknown';
  role: 'player' | 'companion' | 'npc';
  appearance?: string;
}

const FEMALE_WORDS = /\b(she|her|hers|herself|woman|women|girl|lady|female|sister|mother|daughter|wife|madam|ma'am|queen|princess)\b/gi;
const MALE_WORDS = /\b(he|him|his|himself|man|men|boy|guy|lad|male|brother|father|son|husband|sir|king|prince)\b/gi;

/**
 * Infer a character's gender from how the prose refers to them.
 * Scores pronouns/gendered nouns that appear in the same sentence as the name.
 */
export function inferGenderFromText(
  name: string,
  texts: string[]
): SceneCastMember['gender'] {
  if (!name) return 'unknown';
  const first = name.split(/\s+/)[0];
  const escaped = first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRe = new RegExp(`\\b${escaped}\\b`, 'i');

  let female = 0;
  let male = 0;

  for (const text of texts) {
    if (!text) continue;
    // Sentence-level windows keep other characters' pronouns out of the count.
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if (!nameRe.test(sentence)) continue;
      female += (sentence.match(FEMALE_WORDS) || []).length;
      male += (sentence.match(MALE_WORDS) || []).length;
    }
  }

  if (female > male) return 'female';
  if (male > female) return 'male';
  return 'unknown';
}

/** Is this character actually mentioned in the moment being illustrated? */
function mentionedIn(name: string, text: string): boolean {
  if (!name || !text) return false;
  const first = name.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${first}\\b`, 'i').test(text);
}

export interface CompanionLike {
  id?: string;
  name: string;
  gender?: string;
  backstory?: string;
  description?: string;
  appearance?: string;
  portraitDescription?: string;
}

/**
 * Build the cast for the current illustration: the player (always, when they're
 * in frame) plus any companions the narrator actually mentions.
 */
export function resolveSceneCast(options: {
  playerName?: string;
  playerGender?: string;
  playerAppearance?: string;
  companions?: CompanionLike[];
  narratorText: string;
  recentText?: string[];
}): SceneCastMember[] {
  const { playerName, playerGender, playerAppearance, companions = [], narratorText, recentText = [] } = options;
  const cast: SceneCastMember[] = [];

  const normalizedPlayerGender = normalizeGender(playerGender);
  if (normalizedPlayerGender !== 'unknown' || playerAppearance) {
    cast.push({
      name: playerName || 'the protagonist',
      gender: normalizedPlayerGender,
      role: 'player',
      appearance: playerAppearance,
    });
  }

  const corpus = [narratorText, ...recentText];

  for (const companion of companions) {
    if (!companion?.name) continue;
    if (!mentionedIn(companion.name, narratorText)) continue;

    const declared = normalizeGender(companion.gender);
    const gender =
      declared !== 'unknown'
        ? declared
        : inferGenderFromText(companion.name, [
            companion.backstory || '',
            companion.description || '',
            ...corpus,
          ]);

    cast.push({
      name: companion.name,
      gender,
      role: 'companion',
      appearance: companion.portraitDescription || companion.appearance || companion.description,
    });
  }

  return cast;
}

export function normalizeGender(value?: string): SceneCastMember['gender'] {
  if (!value) return 'unknown';
  const v = value.toLowerCase();
  if (v.startsWith('f') || v === 'woman' || v === 'girl') return 'female';
  if (v.startsWith('m') || v === 'man' || v === 'boy') return 'male';
  if (v.startsWith('n') || v.includes('binary')) return 'nonbinary';
  return 'unknown';
}
