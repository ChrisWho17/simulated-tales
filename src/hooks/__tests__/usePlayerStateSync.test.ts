import { describe, it, expect, vi } from 'vitest';
import { usePlayerStateSync } from '../usePlayerStateSync';
import { playerStateManager } from '@/game/playerStateManager';

describe('usePlayerStateSync', () => {
  describe('exports', () => {
    it('should export the hook function', () => {
      expect(typeof usePlayerStateSync).toBe('function');
    });
  });

  describe('playerStateManager integration', () => {
    it('should have syncFromCharacter method', () => {
      expect(typeof playerStateManager.syncFromCharacter).toBe('function');
    });

    it('should have subscribe method', () => {
      expect(typeof playerStateManager.subscribe).toBe('function');
    });

    it('should support HP subscription', () => {
      const unsubscribe = playerStateManager.subscribe('hp', () => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should support XP subscription', () => {
      const unsubscribe = playerStateManager.subscribe('xp', () => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should support currency subscription', () => {
      const unsubscribe = playerStateManager.subscribe('currency', () => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});
