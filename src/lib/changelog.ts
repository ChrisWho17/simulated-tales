/** Shared changelog loader — powers What's New, version badge, hotfix history. */

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
}

export interface ChangelogFile {
  entries: ChangelogEntry[];
}

let cached: ChangelogEntry[] | null = null;

/** Chronological origin → latest (changelog.json is newest-first). */
export function chronologicalEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].reverse();
}

export function getLatestEntry(entries: ChangelogEntry[]): ChangelogEntry | undefined {
  return entries[0];
}

/**
 * Fetch /changelog.json with cache-busting.
 * Falls back to last successful fetch; never throws to callers (returns []).
 */
export async function fetchChangelog(force = false): Promise<ChangelogEntry[]> {
  if (cached && !force) return cached;

  try {
    const res = await fetch(`/changelog.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store' },
    });
    if (!res.ok) throw new Error(`changelog ${res.status}`);
    const data = (await res.json()) as ChangelogFile;
    const entries = Array.isArray(data?.entries) ? data.entries : [];
    cached = entries;
    return entries;
  } catch (err) {
    console.warn('[changelog] Failed to load changelog.json', err);
    return cached ?? [];
  }
}

/** Validate minimal schema — used by tests / optional runtime checks. */
export function validateChangelogEntries(entries: unknown): entries is ChangelogEntry[] {
  if (!Array.isArray(entries)) return false;
  return entries.every(
    (e) =>
      e &&
      typeof e === 'object' &&
      typeof (e as ChangelogEntry).version === 'string' &&
      typeof (e as ChangelogEntry).title === 'string' &&
      Array.isArray((e as ChangelogEntry).highlights) &&
      Array.isArray((e as ChangelogEntry).fixes),
  );
}
