// ============================================================================
// VISUAL PROFILE STORE
// ----------------------------------------------------------------------------
// Every important character (player, companions, recurring NPCs) keeps a
// persistent Visual Profile so illustrations never re-invent a face that has
// already been approved. Reference images always beat a text description.
// ============================================================================
import {
  createEmptyVisualProfile,
  VISUAL_PROFILE_SCHEMA_VERSION,
  type VisualProfileV2,
} from '@/types/visualProfile';


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

// ============================================================================
// V2 STRUCTURED PROFILES
// ----------------------------------------------------------------------------
// The legacy record above stays untouched (the illustration pipeline reads it),
// while the full structured VisualProfileV2 lives alongside it. Both are kept
// in sync so old saves keep working and new saves gain exact customization.
// ============================================================================

const V2_KEY_PREFIX = 'lwe_visual_profiles_v2_';

function v2Key(campaignId: string): string {
  return `${V2_KEY_PREFIX}${campaignId}`;
}

function readAllV2(campaignId: string): Record<string, VisualProfileV2> {
  if (!campaignId) return {};
  try {
    const raw = localStorage.getItem(v2Key(campaignId));
    return raw ? (JSON.parse(raw) as Record<string, VisualProfileV2>) : {};
  } catch {
    return {};
  }
}

function writeAllV2(campaignId: string, profiles: Record<string, VisualProfileV2>): void {
  if (!campaignId) return;
  try {
    localStorage.setItem(v2Key(campaignId), JSON.stringify(profiles));
  } catch {
    /* storage pressure must never break a turn */
  }
}

export function getVisualProfileV2(campaignId: string, id: string): VisualProfileV2 | null {
  return readAllV2(campaignId)[id] ?? null;
}

export function listVisualProfilesV2(campaignId: string): VisualProfileV2[] {
  return Object.values(readAllV2(campaignId));
}

/** Save a structured profile and mirror the fields the legacy store needs. */
export function saveVisualProfileV2(campaignId: string, profile: VisualProfileV2): VisualProfileV2 {
  const all = readAllV2(campaignId);
  all[profile.identity.characterId] = profile;
  writeAllV2(campaignId, all);

  upsertVisualProfile(campaignId, {
    id: profile.identity.characterId,
    name: profile.identity.name,
    canonicalPortraitUrl: profile.references.canonicalPortraitUrl,
    fullBodyUrl: profile.references.fullBodyUrl,
    permanentDescription: profile.permanentDescription,
    lockedTraits: profile.lockedTraits,
    currentClothing: profile.wardrobe.currentOutfit,
    currentEquipment: profile.wardrobe.weapons?.join(', '),
    currentInjuries: profile.details.currentInjuries?.join(', '),
  });

  return profile;
}

/** Patch mutable state (outfit, injuries, dirt) without touching identity. */
export function updateVisualProfileState(
  campaignId: string,
  id: string,
  patch: {
    currentOutfit?: string;
    weapons?: string[];
    currentInjuries?: string[];
    dirtOrBloodLevel?: VisualProfileV2['details']['dirtOrBloodLevel'];
  }
): VisualProfileV2 | null {
  const profile = getVisualProfileV2(campaignId, id);
  if (!profile) return null;
  const next: VisualProfileV2 = {
    ...profile,
    updatedAt: Date.now(),
    wardrobe: {
      ...profile.wardrobe,
      currentOutfit: patch.currentOutfit ?? profile.wardrobe.currentOutfit,
      weapons: patch.weapons ?? profile.wardrobe.weapons,
    },
    details: {
      ...profile.details,
      currentInjuries: patch.currentInjuries ?? profile.details.currentInjuries,
      dirtOrBloodLevel: patch.dirtOrBloodLevel ?? profile.details.dirtOrBloodLevel,
    },
  };
  return saveVisualProfileV2(campaignId, next);
}

/**
 * Appearance edits bump the version and invalidate canonical references so a
 * fresh approved portrait is generated for the new look.
 */
export function bumpVisualProfileVersion(
  campaignId: string,
  id: string,
  { invalidateReferences = true }: { invalidateReferences?: boolean } = {}
): VisualProfileV2 | null {
  const profile = getVisualProfileV2(campaignId, id);
  if (!profile) return null;
  const next: VisualProfileV2 = {
    ...profile,
    visualProfileVersion: profile.visualProfileVersion + 1,
    updatedAt: Date.now(),
    references: invalidateReferences
      ? { ...profile.references, canonicalPortraitUrl: undefined, fullBodyUrl: undefined }
      : profile.references,
  };
  return saveVisualProfileV2(campaignId, next);
}

/** Attach a validated image as the approved reference for this character. */
export function approveReferenceImage(
  campaignId: string,
  id: string,
  kind: 'portrait' | 'fullBody' | 'sideProfile' | 'expressionSheet',
  imageUrl: string,
  imageId?: string
): VisualProfileV2 | null {
  const profile = getVisualProfileV2(campaignId, id);
  if (!profile) return null;
  const references = { ...profile.references };
  if (kind === 'portrait') {
    references.canonicalPortraitUrl = imageUrl;
    references.lastApprovedPortraitId = imageId ?? imageUrl;
  } else if (kind === 'fullBody') {
    references.fullBodyUrl = imageUrl;
    references.lastApprovedFullBodyId = imageId ?? imageUrl;
  } else if (kind === 'sideProfile') {
    references.sideProfileUrl = imageUrl;
  } else {
    references.expressionSheetUrl = imageUrl;
  }
  return saveVisualProfileV2(campaignId, { ...profile, references, updatedAt: Date.now() });
}

/**
 * Old saves only have the legacy flat profile (or nothing at all). Promote
 * whatever exists into the v2 shape so every character has a profile.
 */
export function migrateVisualProfiles(campaignId: string): number {
  if (!campaignId) return 0;
  const legacy = readAll(campaignId);
  const v2 = readAllV2(campaignId);
  let migrated = 0;

  for (const [id, old] of Object.entries(legacy)) {
    if (v2[id]) continue;
    const promoted = createEmptyVisualProfile(id, old.name);
    promoted.permanentDescription = old.permanentDescription || '';
    promoted.lockedTraits = old.lockedTraits || [];
    promoted.wardrobe.currentOutfit = old.currentClothing;
    promoted.wardrobe.weapons = old.currentEquipment ? [old.currentEquipment] : undefined;
    promoted.details.currentInjuries = old.currentInjuries ? [old.currentInjuries] : undefined;
    promoted.references.canonicalPortraitUrl = old.canonicalPortraitUrl;
    promoted.references.fullBodyUrl = old.fullBodyUrl;
    promoted.visualProfileVersion = old.version || 1;
    v2[id] = promoted;
    migrated += 1;
  }

  // Bring forward anything written by an earlier v2 draft.
  for (const [id, profile] of Object.entries(v2)) {
    if (profile.schemaVersion !== VISUAL_PROFILE_SCHEMA_VERSION) {
      v2[id] = {
        ...createEmptyVisualProfile(id, profile.identity?.name || 'Unknown'),
        ...profile,
        schemaVersion: VISUAL_PROFILE_SCHEMA_VERSION,
      };
      migrated += 1;
    }
  }

  if (migrated > 0) writeAllV2(campaignId, v2);
  return migrated;
}

export function clearVisualProfilesV2(campaignId: string): void {
  try {
    localStorage.removeItem(v2Key(campaignId));
  } catch {
    /* nothing to clean */
  }
}
