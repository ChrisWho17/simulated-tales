import { describe, it, expect } from 'vitest';
import { entryList, type ChangelogEntry } from '../changelog';

describe('entryList', () => {
  const base: ChangelogEntry = {
    version: '0.0.1',
    date: '2026-01-01',
    title: 'Test',
    highlights: ['a'],
    features: [],
    improvements: [],
    fixes: [],
  };

  it('returns an empty array for an empty section', () => {
    expect(entryList(base, 'fixes')).toEqual([]);
  });

  it('returns an empty array when the section is missing entirely', () => {
    const partial = { version: '0.0.2' } as Partial<ChangelogEntry>;
    expect(entryList(partial, 'fixes')).toEqual([]);
    expect(entryList(partial, 'highlights')).toEqual([]);
  });

  it('returns an empty array for null / undefined entries', () => {
    expect(entryList(null, 'fixes')).toEqual([]);
    expect(entryList(undefined, 'improvements')).toEqual([]);
  });

  it('filters out non-string and blank values from malformed payloads', () => {
    const malformed = {
      ...base,
      fixes: ['real fix', '', '   ', 42, null, undefined] as unknown as string[],
    };
    expect(entryList(malformed, 'fixes')).toEqual(['real fix']);
  });

  it('ignores a non-array section', () => {
    const malformed = { ...base, fixes: 'not an array' as unknown as string[] };
    expect(entryList(malformed, 'fixes')).toEqual([]);
  });

  it('preserves valid entries in order', () => {
    expect(entryList({ ...base, fixes: ['one', 'two'] }, 'fixes')).toEqual(['one', 'two']);
  });
});
