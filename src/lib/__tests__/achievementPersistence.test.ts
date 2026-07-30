// ============================================================================
// ACHIEVEMENT PERSISTENCE TESTS — global vs run scope
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_GENRES,
  genreFirstPlayId,
} from '@/lib/achievementCatalog';
import {
  beginNewAdventureAchievements,
  clearAllAchievementStorage,
  loadAchievementStorage,
  mergeAchievementsWithCatalog,
  persistAchievements,
  resetRunAchievementStorage,
  type Achievement,
} from '@/lib/achievementPersistence';
import { STORAGE_KEYS } from '@/lib/storageKeys';

describe('achievementCatalog', () => {
  it('assigns every definition a global or run scope', () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(['global', 'run']).toContain(def.scope);
    }
  });

  it('has first-play achievements for every standard genre', () => {
    for (const g of ACHIEVEMENT_GENRES) {
      const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === genreFirstPlayId(g.id));
      expect(def).toBeDefined();
      expect(def?.scope).toBe('global');
      expect(def?.category).toBe('genre');
    }
  });

  it('marks combat/exploration achievements as run-scoped', () => {
    expect(ACHIEVEMENT_DEFINITIONS.find((a) => a.id === 'first_blood')?.scope).toBe('run');
    expect(ACHIEVEMENT_DEFINITIONS.find((a) => a.id === 'first_steps')?.scope).toBe('run');
    expect(ACHIEVEMENT_DEFINITIONS.find((a) => a.id === 'night_owl')?.scope).toBe('global');
    expect(ACHIEVEMENT_DEFINITIONS.find((a) => a.id === 'first_adventure')?.scope).toBe('global');
  });
});

describe('achievementPersistence', () => {
  beforeEach(() => {
    clearAllAchievementStorage();
    localStorage.clear();
  });

  afterEach(() => {
    clearAllAchievementStorage();
    localStorage.clear();
  });

  it('merges catalog with empty storage', () => {
    const list = mergeAchievementsWithCatalog();
    expect(list.length).toBe(ACHIEVEMENT_DEFINITIONS.length);
    expect(list.every((a) => !a.unlockedAt)).toBe(true);
  });

  it('persists unlocks into scoped buckets', () => {
    const list = mergeAchievementsWithCatalog();
    const updated: Achievement[] = list.map((a) => {
      if (a.id === 'first_adventure') return { ...a, unlockedAt: 1000 };
      if (a.id === 'first_blood') return { ...a, unlockedAt: 2000, progress: 1 };
      return a;
    });
    persistAchievements(updated);

    const storage = loadAchievementStorage();
    expect(storage.version).toBe(2);
    expect(storage.global.first_adventure?.unlockedAt).toBe(1000);
    expect(storage.run.first_blood?.unlockedAt).toBe(2000);
    expect(storage.global.first_blood).toBeUndefined();
  });

  it('resetRunAchievementStorage clears run but keeps global', () => {
    const list = mergeAchievementsWithCatalog().map((a) => {
      if (a.id === 'night_owl') return { ...a, unlockedAt: 111 };
      if (a.id === 'first_blood') return { ...a, unlockedAt: 222 };
      return a;
    });
    persistAchievements(list);
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS, JSON.stringify({ combatsWon: 5 }));

    resetRunAchievementStorage();

    const storage = loadAchievementStorage();
    expect(storage.global.night_owl?.unlockedAt).toBe(111);
    expect(storage.run.first_blood).toBeUndefined();
    expect(Object.keys(storage.run)).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS)).toBeNull();
  });

  it('beginNewAdventureAchievements clears run and emits genre-started', () => {
    const list = mergeAchievementsWithCatalog().map((a) => {
      if (a.id === 'first_blood') return { ...a, unlockedAt: 99 };
      return a;
    });
    persistAchievements(list);

    const spy = vi.fn();
    window.addEventListener('achievement-genre-started', spy);

    beginNewAdventureAchievements('horror');

    const storage = loadAchievementStorage();
    expect(storage.run.first_blood).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.genre).toBe('horror');

    window.removeEventListener('achievement-genre-started', spy);
  });

  it('migrates legacy flat array storage', () => {
    const legacy = [
      { id: 'night_owl', unlockedAt: 55 },
      { id: 'first_blood', unlockedAt: 66, progress: 1 },
      { id: 'dust_off_the_cover', unlockedAt: 77 },
    ];
    localStorage.setItem('untold-achievements', JSON.stringify(legacy));

    const storage = loadAchievementStorage();
    expect(storage.global.night_owl?.unlockedAt).toBe(55);
    expect(storage.global.dust_off_the_cover?.unlockedAt).toBe(77);
    expect(storage.run.first_blood?.unlockedAt).toBe(66);
  });
});
