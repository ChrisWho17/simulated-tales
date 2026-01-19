import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  shouldCompanionAppearNow,
  getNextReadyCompanion,
  getReadyCompanions,
  buildCompanionIntroductionContext,
  PendingCompanionWithTiming,
  AppearanceTimingType,
} from '../companionTimingSystem';

// Helper to create mock companions with specific timing
function createMockCompanion(
  timing: AppearanceTimingType,
  overrides: Partial<PendingCompanionWithTiming> = {}
): PendingCompanionWithTiming {
  return {
    companionId: `companion-${timing}-${Date.now()}`,
    name: `Test ${timing} Companion`,
    introduction: `A mysterious stranger who appears ${timing}`,
    portraitUrl: null,
    origin: 'mysterious_stranger',
    appearanceTiming: timing,
    timestamp: Date.now(),
    displayed: false,
    contextTriggers: {
      turnsSinceCreated: 0,
    },
    ...overrides,
  };
}

describe('Companion Timing System', () => {
  describe('shouldCompanionAppearNow', () => {
    describe('immediately timing', () => {
      it('should always return true for immediate companions', () => {
        const companion = createMockCompanion('immediately');
        
        expect(shouldCompanionAppearNow(companion, { turnNumber: 0 })).toBe(true);
        expect(shouldCompanionAppearNow(companion, { turnNumber: 1 })).toBe(true);
        expect(shouldCompanionAppearNow(companion, { turnNumber: 100 })).toBe(true);
      });

      it('should return false if already displayed', () => {
        const companion = createMockCompanion('immediately', { displayed: true });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 0 })).toBe(false);
      });
    });

    describe('next_scene timing', () => {
      it('should return true on new scene', () => {
        const companion = createMockCompanion('next_scene');
        expect(shouldCompanionAppearNow(companion, { turnNumber: 1, isNewScene: true })).toBe(true);
      });

      it('should return true on location change', () => {
        const companion = createMockCompanion('next_scene');
        expect(shouldCompanionAppearNow(companion, { turnNumber: 1, locationChanged: true })).toBe(true);
      });

      it('should return true when player rests', () => {
        const companion = createMockCompanion('next_scene');
        expect(shouldCompanionAppearNow(companion, { turnNumber: 1, justRested: true })).toBe(true);
      });

      it('should return true after 3+ turns as fallback', () => {
        const companion = createMockCompanion('next_scene', {
          contextTriggers: { turnsSinceCreated: 3 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 5 })).toBe(true);
      });

      it('should return false before 3 turns without scene change', () => {
        const companion = createMockCompanion('next_scene', {
          contextTriggers: { turnsSinceCreated: 2 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 2 })).toBe(false);
      });
    });

    describe('contextual timing', () => {
      it('should return true after combat ends', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 1 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 2, justFinishedCombat: true })).toBe(true);
      });

      it('should return true after resting', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 1 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 2, justRested: true })).toBe(true);
      });

      it('should return true on location change with 2+ turns delay', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 2 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 3, locationChanged: true })).toBe(true);
      });

      it('should return false on location change without enough delay', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 1 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 2, locationChanged: true })).toBe(false);
      });

      it('should return true after 5+ turns as fallback', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 5 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 6 })).toBe(true);
      });

      it('should return true when narrative contains good moment phrases', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 1 },
        });
        
        expect(shouldCompanionAppearNow(companion, {
          turnNumber: 2,
          narrativeContext: 'You notice a figure approaches from the shadows',
        })).toBe(true);

        expect(shouldCompanionAppearNow(companion, {
          turnNumber: 2,
          narrativeContext: 'Someone calls out your name from across the street',
        })).toBe(true);

        expect(shouldCompanionAppearNow(companion, {
          turnNumber: 2,
          narrativeContext: 'The door opens and a stranger enters the tavern',
        })).toBe(true);
      });

      it('should return false without triggers or narrative cues', () => {
        const companion = createMockCompanion('contextual', {
          contextTriggers: { turnsSinceCreated: 1 },
        });
        expect(shouldCompanionAppearNow(companion, { turnNumber: 2 })).toBe(false);
      });

      it('should return false without contextTriggers initialized', () => {
        const companion = createMockCompanion('contextual');
        delete (companion as any).contextTriggers;
        expect(shouldCompanionAppearNow(companion, { turnNumber: 2 })).toBe(false);
      });
    });
  });

  describe('getReadyCompanions', () => {
    it('should return all companions ready to appear', () => {
      // Mock localStorage for this test
      const companions = [
        createMockCompanion('immediately'),
        createMockCompanion('next_scene', { contextTriggers: { turnsSinceCreated: 3 } }),
        createMockCompanion('contextual', { contextTriggers: { turnsSinceCreated: 5 } }),
      ];

      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(JSON.stringify(companions));

      const ready = getReadyCompanions({ turnNumber: 5 });
      expect(ready.length).toBe(3);

      mockGetItem.mockRestore();
    });

    it('should not return displayed companions', () => {
      const companions = [
        createMockCompanion('immediately', { displayed: true }),
        createMockCompanion('immediately', { displayed: false }),
      ];

      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(JSON.stringify(companions));

      const ready = getReadyCompanions({ turnNumber: 1 });
      expect(ready.length).toBe(1);

      mockGetItem.mockRestore();
    });
  });

  describe('getNextReadyCompanion', () => {
    it('should prioritize immediately over next_scene over contextual', () => {
      const companions = [
        createMockCompanion('contextual', { contextTriggers: { turnsSinceCreated: 5 }, name: 'Contextual Guy' }),
        createMockCompanion('immediately', { name: 'Immediate Guy' }),
        createMockCompanion('next_scene', { contextTriggers: { turnsSinceCreated: 3 }, name: 'Scene Guy' }),
      ];

      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(JSON.stringify(companions));

      const next = getNextReadyCompanion({ turnNumber: 5 });
      expect(next?.name).toBe('Immediate Guy');

      mockGetItem.mockRestore();
    });

    it('should return next_scene when no immediate companions', () => {
      const companions = [
        createMockCompanion('contextual', { contextTriggers: { turnsSinceCreated: 5 }, name: 'Contextual Guy' }),
        createMockCompanion('next_scene', { contextTriggers: { turnsSinceCreated: 3 }, name: 'Scene Guy' }),
      ];

      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(JSON.stringify(companions));

      const next = getNextReadyCompanion({ turnNumber: 5 });
      expect(next?.name).toBe('Scene Guy');

      mockGetItem.mockRestore();
    });

    it('should return null when no companions are ready', () => {
      const companions = [
        createMockCompanion('contextual', { contextTriggers: { turnsSinceCreated: 1 } }),
        createMockCompanion('next_scene', { contextTriggers: { turnsSinceCreated: 1 } }),
      ];

      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(JSON.stringify(companions));

      const next = getNextReadyCompanion({ turnNumber: 2 });
      expect(next).toBe(null);

      mockGetItem.mockRestore();
    });
  });

  describe('buildCompanionIntroductionContext', () => {
    it('should build context for immediately timing', () => {
      const companion = createMockCompanion('immediately', { name: 'Test Hero' });
      const context = buildCompanionIntroductionContext(companion);
      
      expect(context).toContain('Test Hero');
      expect(context).toContain('RIGHT NOW');
      expect(context).toContain('mysterious stranger');
    });

    it('should build context for next_scene timing', () => {
      const companion = createMockCompanion('next_scene', { name: 'Scene Arrival' });
      const context = buildCompanionIntroductionContext(companion);
      
      expect(context).toContain('Scene Arrival');
      expect(context).toContain('scene transitions');
    });

    it('should build context for contextual timing', () => {
      const companion = createMockCompanion('contextual', { name: 'Natural Encounter' });
      const context = buildCompanionIntroductionContext(companion);
      
      expect(context).toContain('Natural Encounter');
      expect(context).toContain('feels natural');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage gracefully', () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue(null);

      const ready = getReadyCompanions({ turnNumber: 5 });
      expect(ready).toEqual([]);

      mockGetItem.mockRestore();
    });

    it('should handle malformed localStorage data', () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockReturnValue('not valid json{');

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const ready = getReadyCompanions({ turnNumber: 5 });
      expect(ready).toEqual([]);

      consoleError.mockRestore();
      mockGetItem.mockRestore();
    });

    it('should handle unknown timing type gracefully', () => {
      const companion = createMockCompanion('immediately');
      (companion as any).appearanceTiming = 'unknown_timing';
      
      expect(shouldCompanionAppearNow(companion, { turnNumber: 1 })).toBe(false);
    });
  });
});
