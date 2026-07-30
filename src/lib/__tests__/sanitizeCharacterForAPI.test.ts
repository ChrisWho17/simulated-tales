import { describe, expect, it } from 'vitest';
import { sanitizeCharacterForAPI } from '@/lib/sanitizeCharacterForAPI';
import type { RPGCharacter } from '@/types/rpgCharacter';

describe('sanitizeCharacterForAPI', () => {
  it('nulls oversized portraitUrl payloads', () => {
    const char = {
      name: 'Test',
      portraitUrl: 'x'.repeat(501),
      appearanceDescription: 'short',
    } as unknown as RPGCharacter;
    const out = sanitizeCharacterForAPI(char) as RPGCharacter & {
      portraitUrl?: string | null;
      appearanceDescription?: string | null;
    };
    expect(out.portraitUrl).toBeNull();
    expect(out.appearanceDescription).toBe('short');
  });

  it('caps appearanceDescription length', () => {
    const char = {
      name: 'Test',
      portraitUrl: 'ok',
      appearanceDescription: 'a'.repeat(2500),
    } as unknown as RPGCharacter;
    const out = sanitizeCharacterForAPI(char) as RPGCharacter & {
      appearanceDescription?: string | null;
    };
    expect(out.appearanceDescription?.length).toBe(2000);
  });
});
