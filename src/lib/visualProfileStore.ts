// ============================================================================
// VISUAL PROFILE STORE
// ----------------------------------------------------------------------------
// Every important character (player, companions, recurring NPCs) keeps a
// persistent Visual Profile so illustrations never re-invent a face that has
// already been approved. Reference images always beat a text description.
// ============================================================================

export interface VisualProfile {
  /** Stable id: player id, companion id or NPC id. */
  id: string;
  name: string;
  /** Approved head-and-shoulders reference. */
  canonicalPortraitUrl?: string;
  /** Approved full-body reference. */
  fullBodyUrl?: string;
  /** Permanent, never-rewritten physical description. */
  permanentDescription: string;
  /** Traits that must never drift between illustrations. */
  lockedTraits: string[];
  /** Mutable state — changes as the story does. */
  currentClothing?: string;
  currentEquipment?: string;
  currentInjuries?: string;
  /** Bumped whenever any field changes, so stale jobs can be detected. */
  version: number;
  updatedAt: number;
}

const KEY_PREFIX = 'lwe_visual_profiles_';

function storageKey(campaignId: string): string {
  return `${KEY_PREFIX}${campaignId}`;
}

function readAll(campaignId: string): Record<string, VisualProfile> {
  if (!campaignId) return {};
  try {
    const raw = localStorage.getItem(storageKey(campaignId));
    return raw ? (JSON.parse(raw) as Record<string, VisualProfile>) : {};
  } catch {
    return {};
  }
}

function writeAll(campaignId: string, profiles: Record<string, VisualProfile>): void {
  if (!campaignId) return;
  try {
    localStorage.setItem(storageKey(campaignId), JSON.stringify(profiles));
  } catch {
    /* storage pressure must never break a turn */
  }
}

export function getVisualProfile(campaignId: string, id: string): VisualProfile | null {
  return readAll(campaignId)[id] ?? null;
}

export function listVisualProfiles(campaignId: string): VisualProfile[] {
  return Object.values(readAll(campaignId));
}

/**
 * Create or update a profile. Locked traits and the permanent description are
 * only ever written once — later calls can refine mutable state (clothing,
 * equipment, injuries) and add reference images.
 */
export function upsertVisualProfile(
  campaignId: string,
  input: Partial<VisualProfile> & { id: string; name: string }
): VisualProfile {
  const all = readAll(campaignId);
  const prev = all[input.id];

  const next: VisualProfile = {
    id: input.id,
    name: input.name || prev?.name || 'Unknown',
    canonicalPortraitUrl: input.canonicalPortraitUrl ?? prev?.canonicalPortraitUrl,
    fullBodyUrl: input.fullBodyUrl ?? prev?.fullBodyUrl,
    // Established identity is immutable once set.
    permanentDescription: prev?.permanentDescription || input.permanentDescription || '',
    lockedTraits: prev?.lockedTraits?.length ? prev.lockedTraits : (input.lockedTraits ?? []),
    currentClothing: input.currentClothing ?? prev?.currentClothing,
    currentEquipment: input.currentEquipment ?? prev?.currentEquipment,
    currentInjuries: input.currentInjuries ?? prev?.currentInjuries,
    version: (prev?.version ?? 0) + 1,
    updatedAt: Date.now(),
  };

  all[next.id] = next;
  writeAll(campaignId, all);
  return next;
}

/** Approved reference images for this cast, portraits first. */
export function collectReferenceImages(
  campaignId: string,
  ids: Array<string | undefined>
): string[] {
  const all = readAll(campaignId);
  const urls: string[] = [];
  for (const id of ids) {
    if (!id) continue;
    const profile = all[id];
    if (!profile) continue;
    if (profile.canonicalPortraitUrl) urls.push(profile.canonicalPortraitUrl);
    if (profile.fullBodyUrl) urls.push(profile.fullBodyUrl);
  }
  return Array.from(new Set(urls)).slice(0, 4);
}

/** Highest profile version in the referenced cast — used for staleness checks. */
export function referenceVersion(campaignId: string, ids: Array<string | undefined>): number {
  const all = readAll(campaignId);
  return ids.reduce<number>((max, id) => {
    const v = id ? all[id]?.version ?? 0 : 0;
    return v > max ? v : max;
  }, 0);
}

export function clearVisualProfiles(campaignId: string): void {
  try {
    localStorage.removeItem(storageKey(campaignId));
  } catch {
    /* nothing to clean */
  }
}
