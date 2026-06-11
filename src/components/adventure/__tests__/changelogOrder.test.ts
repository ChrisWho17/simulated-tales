import { describe, it, expect } from 'vitest';
import {
  ORDERED_CHANGELOG,
  ORDERED_VERSIONS,
  buildExpectedSequence,
} from '../changelogOrder';

describe('changelog timeline order', () => {
  it('starts at 0.1.0 and ends at the latest patch', () => {
    expect(ORDERED_VERSIONS[0]).toBe('0.1.0');
    expect(ORDERED_VERSIONS.length).toBeGreaterThan(1);
  });

  it('is strictly ascending numerically with no duplicates', () => {
    const seen = new Set<string>();
    for (let i = 0; i < ORDERED_VERSIONS.length; i++) {
      const v = ORDERED_VERSIONS[i];
      expect(seen.has(v), `duplicate version ${v}`).toBe(false);
      seen.add(v);
      if (i > 0) {
        const prev = ORDERED_VERSIONS[i - 1];
        expect(
          prev.localeCompare(v, undefined, { numeric: true }),
          `expected ${prev} < ${v}`
        ).toBeLessThan(0);
      }
    }
  });

  it('includes every patch from 0.1.0 to the latest with no gaps', () => {
    const expected = buildExpectedSequence(ORDERED_VERSIONS);
    expect(ORDERED_VERSIONS).toEqual(expected);
  });

  it('ORDERED_CHANGELOG entries match ORDERED_VERSIONS order', () => {
    expect(ORDERED_CHANGELOG.map((e) => e.version)).toEqual(ORDERED_VERSIONS);
  });
});
