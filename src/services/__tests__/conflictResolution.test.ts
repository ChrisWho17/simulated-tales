import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveConflict,
  getConflictPolicy,
  setConflictPolicy,
} from '../conflictResolution';
import type { CampaignData } from '@/types/campaign';

function campaign(partial: Partial<CampaignData> & { tick: number; updatedAt?: number; name?: string }): CampaignData {
  return {
    id: 'c',
    meta: {
      name: partial.name ?? 'Test',
      primaryGenre: 'Fantasy',
      secondaryGenres: [],
      createdAt: 0,
      updatedAt: partial.updatedAt ?? 0,
      playTime: 0,
      chapterCount: 0,
    },
    worldBible: {} as never,
    player: { name: 'Hero', level: 1 } as never,
    chapters: [],
    currentChapter: { number: 1, title: 'I', startedAt: 0 },
    narrativeHistory: [],
    escalationTier: 0,
    currentTick: partial.tick,
    scenario: '',
    checkpoints: [],
    ...partial,
  } as CampaignData;
}

describe('conflictResolution', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to merge-by-tick', () => {
    expect(getConflictPolicy()).toBe('merge-by-tick');
  });

  it('persists policy changes', () => {
    setConflictPolicy('last-write-wins');
    expect(getConflictPolicy()).toBe('last-write-wins');
    setConflictPolicy('merge-by-tick');
    expect(getConflictPolicy()).toBe('merge-by-tick');
  });

  it('returns local when server is null (first sync)', () => {
    const local = campaign({ tick: 3 });
    const r = resolveConflict(local, null);
    expect(r.winner).toBe('local');
    expect(r.merged).toBe(local);
  });

  it('merge-by-tick picks higher tick', () => {
    const local = campaign({ tick: 10, name: 'local' });
    const server = campaign({ tick: 7, name: 'server' });
    const r = resolveConflict(local, server, 'merge-by-tick');
    expect(r.winner).toBe('local');
    expect(r.merged.meta.name).toBe('local');
    expect(r.merged.currentTick).toBe(10);
  });

  it('merge-by-tick falls back to updatedAt on tick tie', () => {
    const local = campaign({ tick: 5, updatedAt: 1000, name: 'local' });
    const server = campaign({ tick: 5, updatedAt: 2000, name: 'server' });
    const r = resolveConflict(local, server, 'merge-by-tick');
    expect(r.winner).toBe('server');
    expect(r.merged.meta.name).toBe('server');
  });

  it('last-write-wins uses updatedAt regardless of tick', () => {
    const local = campaign({ tick: 1, updatedAt: 200, name: 'local' });
    const server = campaign({ tick: 50, updatedAt: 100, name: 'server' });
    const r = resolveConflict(local, server, 'last-write-wins');
    expect(r.winner).toBe('local');
    expect(r.merged.meta.name).toBe('local');
  });

  it('merge keeps highest tick on the result so simulation never regresses', () => {
    const local = campaign({ tick: 4 });
    const server = campaign({ tick: 9 });
    const r = resolveConflict(local, server, 'merge-by-tick');
    expect(r.merged.currentTick).toBe(9);
  });

  it('deep-merges nested objects from both sides under merge-by-tick', () => {
    const local = campaign({ tick: 10 });
    (local as unknown as Record<string, unknown>).extras = { hp: 100, mp: 5 };
    const server = campaign({ tick: 7 });
    (server as unknown as Record<string, unknown>).extras = { mp: 999, gold: 42 };
    const r = resolveConflict(local, server, 'merge-by-tick');
    const extras = (r.merged as unknown as Record<string, Record<string, number>>).extras;
    // Local won (higher tick) → its values override server on overlap, server-only fields preserved.
    expect(extras.hp).toBe(100);
    expect(extras.mp).toBe(5);
    expect(extras.gold).toBe(42);
  });
});
