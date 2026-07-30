// ============================================================================
// ACHIEVEMENT PERSISTENCE — global vs run unlock state
// ============================================================================
// Storage shape (v2):
// {
//   version: 2,
//   global: { [id]: { unlockedAt?, progress? } },
//   run:    { [id]: { unlockedAt?, progress? } },
// }
// Legacy v1 was a flat Achievement[] under 'untold-achievements'.
// ============================================================================

import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
  type AchievementScope,
} from '@/lib/achievementCatalog';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export interface AchievementProgressState {
  unlockedAt?: number;
  progress?: number;
}

export interface AchievementStorageV2 {
  version: 2;
  global: Record<string, AchievementProgressState>;
  run: Record<string, AchievementProgressState>;
}

/** Runtime achievement row merged with catalog definition */
export interface Achievement extends AchievementDefinition {
  unlockedAt?: number;
  progress?: number;
}

const LEGACY_STORAGE_KEY = 'untold-achievements';
const STORAGE_VERSION = 2 as const;

/** Achievements that were historically treated as account-level */
const LEGACY_GLOBAL_IDS = new Set([
  'dust_off_the_cover',
  'dedicated',
  'night_owl',
  'early_bird',
  'weekend_warrior',
  'daily_player',
  'weekly_streak',
  'monthly_dedication',
  'comeback_kid',
  'cheater',
  'perfectionist',
]);

function emptyStorage(): AchievementStorageV2 {
  return { version: STORAGE_VERSION, global: {}, run: {} };
}

function getPrimaryKey(): string {
  return STORAGE_KEYS.ACHIEVEMENTS;
}

function readRaw(): unknown | null {
  try {
    const primary = localStorage.getItem(getPrimaryKey());
    if (primary) return JSON.parse(primary);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return JSON.parse(legacy);
  } catch (e) {
    console.error('[Achievements] Failed to parse storage:', e);
  }
  return null;
}

function writeStorage(data: AchievementStorageV2): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(getPrimaryKey(), json);
    // Keep legacy key in sync for older readers / backups
    localStorage.setItem(LEGACY_STORAGE_KEY, json);
  } catch (e) {
    console.error('[Achievements] Failed to save storage:', e);
  }
}

function migrateFromLegacyArray(arr: Array<{ id: string; unlockedAt?: number; progress?: number }>): AchievementStorageV2 {
  const storage = emptyStorage();
  for (const row of arr) {
    if (!row?.id) continue;
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === row.id);
    const scope: AchievementScope = def?.scope ?? (LEGACY_GLOBAL_IDS.has(row.id) ? 'global' : 'run');
    const state: AchievementProgressState = {};
    if (row.unlockedAt) state.unlockedAt = row.unlockedAt;
    if (typeof row.progress === 'number') state.progress = row.progress;
    if (state.unlockedAt || state.progress !== undefined) {
      storage[scope][row.id] = state;
    }
  }
  return storage;
}

function migrateFromV2Like(raw: Record<string, unknown>): AchievementStorageV2 {
  const storage = emptyStorage();
  const global = (raw.global && typeof raw.global === 'object' ? raw.global : {}) as Record<string, AchievementProgressState>;
  const run = (raw.run && typeof raw.run === 'object' ? raw.run : {}) as Record<string, AchievementProgressState>;
  storage.global = { ...global };
  storage.run = { ...run };
  return storage;
}

export function loadAchievementStorage(): AchievementStorageV2 {
  const raw = readRaw();
  if (!raw) return emptyStorage();

  if (Array.isArray(raw)) {
    const migrated = migrateFromLegacyArray(raw);
    writeStorage(migrated);
    return migrated;
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.version === 2 || obj.global || obj.run) {
      return migrateFromV2Like(obj);
    }
    // Unknown object shape — treat as empty rather than wipe user data blindly
  }

  return emptyStorage();
}

export function saveAchievementStorage(storage: AchievementStorageV2): void {
  writeStorage({ ...storage, version: STORAGE_VERSION });
}

export function mergeAchievementsWithCatalog(storage: AchievementStorageV2 = loadAchievementStorage()): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const state = storage[def.scope][def.id] || {};
    return {
      ...def,
      unlockedAt: state.unlockedAt,
      progress: state.progress,
    };
  });
}

export function persistAchievements(achievements: Achievement[]): AchievementStorageV2 {
  const storage = emptyStorage();
  for (const a of achievements) {
    if (!a.unlockedAt && a.progress === undefined) continue;
    const state: AchievementProgressState = {};
    if (a.unlockedAt) state.unlockedAt = a.unlockedAt;
    if (typeof a.progress === 'number') state.progress = a.progress;
    storage[a.scope][a.id] = state;
  }
  saveAchievementStorage(storage);
  return storage;
}

/**
 * Clear all run-scoped unlocks and progress. Global unlocks are preserved.
 * Also clears run progress counters used by useAchievementTriggers.
 */
export function resetRunAchievementStorage(): AchievementStorageV2 {
  const storage = loadAchievementStorage();
  storage.run = {};
  saveAchievementStorage(storage);

  try {
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS);
  } catch {
    // ignore
  }

  // Notify React providers / hooks listening in this tab
  try {
    window.dispatchEvent(new CustomEvent('achievements-run-reset'));
  } catch {
    // ignore (SSR / tests)
  }

  console.log('[Achievements] Run-scoped unlocks reset; global unlocks preserved');
  return storage;
}

/**
 * Start a new adventure: reset run unlocks, then notify listeners to apply
 * global genre / first-adventure unlocks (so UI toasts still fire).
 */
export function beginNewAdventureAchievements(genre: string): AchievementStorageV2 {
  const storage = resetRunAchievementStorage();

  try {
    window.dispatchEvent(
      new CustomEvent('achievement-genre-started', { detail: { genre } })
    );
  } catch {
    // ignore
  }

  return storage;
}

export function clearAllAchievementStorage(): void {
  try {
    localStorage.removeItem(getPrimaryKey());
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS);
  } catch {
    // ignore
  }
}

export function getScopeBucket(storage: AchievementStorageV2, scope: AchievementScope): Record<string, AchievementProgressState> {
  return storage[scope];
}
