import { CHANGELOG, orderChangelog, type ChangelogEntry } from './changelog';

/**
 * Single shared source of truth for the patch ordering used by:
 *  - the hotfix history timeline
 *  - the per-release side panel
 *
 * Ascending chronological order (origin → now), numerically by version.
 * Importing this guarantees both views stay in sync.
 */
export const ORDERED_CHANGELOG: ChangelogEntry[] = orderChangelog(CHANGELOG);

export const ORDERED_VERSIONS: string[] = ORDERED_CHANGELOG.map((e) => e.version);

/** Parse "x.y.z" into a numeric tuple for gap checks. */
export function parseVersion(v: string): [number, number, number] {
  const [a, b, c] = v.split('.').map((n) => parseInt(n, 10));
  return [a ?? 0, b ?? 0, c ?? 0];
}

/**
 * Builds the full expected patch sequence from the earliest to the latest
 * version present in the changelog, walking every (major, minor) group from
 * .0 up to the highest patch seen for that group.
 *
 * Used by tests to assert no patch versions are skipped.
 */
export function buildExpectedSequence(versions: string[]): string[] {
  if (versions.length === 0) return [];
  const parsed = versions.map(parseVersion);

  // Group max patch by "major.minor"
  const maxPatchByMinor = new Map<string, number>();
  const minorsByMajor = new Map<number, Set<number>>();
  for (const [maj, min, patch] of parsed) {
    const key = `${maj}.${min}`;
    maxPatchByMinor.set(key, Math.max(maxPatchByMinor.get(key) ?? 0, patch));
    if (!minorsByMajor.has(maj)) minorsByMajor.set(maj, new Set());
    minorsByMajor.get(maj)!.add(min);
  }

  const majors = [...minorsByMajor.keys()].sort((a, b) => a - b);
  const expected: string[] = [];
  for (const maj of majors) {
    const minors = [...minorsByMajor.get(maj)!].sort((a, b) => a - b);
    for (const min of minors) {
      const maxPatch = maxPatchByMinor.get(`${maj}.${min}`)!;
      for (let p = 0; p <= maxPatch; p++) {
        expected.push(`${maj}.${min}.${p}`);
      }
    }
  }
  return expected;
}
