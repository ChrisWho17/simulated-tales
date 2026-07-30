import type { RPGCharacter } from '@/types/rpgCharacter';

/**
 * Strip large base64 portrait payloads and cap appearance text before AI requests.
 * Shared by AdventureGame + useNarrativeGeneration (was duplicated).
 */
export function sanitizeCharacterForAPI(char: RPGCharacter): RPGCharacter {
  const charAny = char as RPGCharacter & {
    portraitUrl?: string | null;
    appearanceDescription?: string | null;
  };
  return {
    ...char,
    portraitUrl:
      charAny.portraitUrl && charAny.portraitUrl.length > 500 ? null : charAny.portraitUrl,
    appearanceDescription: charAny.appearanceDescription?.slice(0, 2000) || null,
  } as RPGCharacter;
}
