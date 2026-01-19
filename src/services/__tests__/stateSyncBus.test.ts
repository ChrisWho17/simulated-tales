// ============================================================================
// STATE SYNC BUS TESTS - Ensure cross-context synchronization works
// Phase 5: Critical Test Coverage
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateSyncBus } from '@/services/stateSyncBus';
import { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';

describe('StateSyncBus', () => {
  beforeEach(() => {
    StateSyncBus.clearHistory();
  });

  describe('emit and subscribe', () => {
    it('should emit events to subscribers', () => {
      const callback = vi.fn();
      const unsubscribe = StateSyncBus.subscribe('campaign:loaded', callback);

      StateSyncBus.emit('campaign:loaded', {
        campaignId: 'test-123',
        campaignName: 'Test Campaign',
      }, 'test');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'campaign:loaded',
          payload: {
            campaignId: 'test-123',
            campaignName: 'Test Campaign',
          },
          source: 'test',
        })
      );

      unsubscribe();
    });

    it('should not call subscriber after unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = StateSyncBus.subscribe('campaign:saved', callback);

      unsubscribe();

      StateSyncBus.emit('campaign:saved', {
        campaignId: 'test',
        timestamp: Date.now(),
        syncedToCloud: false,
      }, 'test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = StateSyncBus.subscribe('settings:director-updated', callback1);
      const unsub2 = StateSyncBus.subscribe('settings:director-updated', callback2);

      StateSyncBus.emit('settings:director-updated', {
        directorSettings: DEFAULT_DIRECTOR_SETTINGS,
        source: 'campaign',
      }, 'test');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsub1();
      unsub2();
    });

    it('should only call subscribers of matching event type', () => {
      const loadedCallback = vi.fn();
      const savedCallback = vi.fn();

      const unsub1 = StateSyncBus.subscribe('campaign:loaded', loadedCallback);
      const unsub2 = StateSyncBus.subscribe('campaign:saved', savedCallback);

      StateSyncBus.emit('campaign:loaded', {
        campaignId: 'test',
        campaignName: 'Test',
      }, 'test');

      expect(loadedCallback).toHaveBeenCalledTimes(1);
      expect(savedCallback).not.toHaveBeenCalled();

      unsub1();
      unsub2();
    });
  });

  describe('subscribeAll', () => {
    it('should receive all events', () => {
      const callback = vi.fn();
      const unsubscribe = StateSyncBus.subscribeAll(callback);

      StateSyncBus.emit('campaign:loaded', { campaignId: 'a', campaignName: 'A' }, 'test');
      StateSyncBus.emit('campaign:saved', { campaignId: 'b', timestamp: 1, syncedToCloud: true }, 'test');
      StateSyncBus.emit('campaign:deleted', { campaignId: 'c' }, 'test');

      expect(callback).toHaveBeenCalledTimes(3);

      unsubscribe();
    });
  });

  describe('event history', () => {
    it('should store events in history', () => {
      StateSyncBus.emit('campaign:loaded', { campaignId: 'a', campaignName: 'A' }, 'test');
      StateSyncBus.emit('campaign:saved', { campaignId: 'b', timestamp: 1, syncedToCloud: false }, 'test');

      const history = StateSyncBus.getHistory();

      expect(history.length).toBe(2);
      expect(history[0].type).toBe('campaign:loaded');
      expect(history[1].type).toBe('campaign:saved');
    });

    it('should retrieve last event of specific type', () => {
      StateSyncBus.emit('campaign:loaded', { campaignId: 'first', campaignName: 'First' }, 'test');
      StateSyncBus.emit('campaign:saved', { campaignId: 'save1', timestamp: 1, syncedToCloud: false }, 'test');
      StateSyncBus.emit('campaign:loaded', { campaignId: 'second', campaignName: 'Second' }, 'test');

      const lastLoaded = StateSyncBus.getLastEvent('campaign:loaded');

      expect(lastLoaded?.payload.campaignId).toBe('second');
    });

    it('should return null for event type not in history', () => {
      StateSyncBus.emit('campaign:loaded', { campaignId: 'test', campaignName: 'Test' }, 'test');

      const lastDeleted = StateSyncBus.getLastEvent('campaign:deleted');

      expect(lastDeleted).toBeNull();
    });
  });

  describe('deduplication', () => {
    it('should dedupe rapid-fire identical events', async () => {
      const callback = vi.fn();
      const unsubscribe = StateSyncBus.subscribe('campaign:loaded', callback);

      // Emit same event multiple times rapidly
      StateSyncBus.emit('campaign:loaded', { campaignId: 'test', campaignName: 'Test' }, 'test');
      StateSyncBus.emit('campaign:loaded', { campaignId: 'test', campaignName: 'Test' }, 'test');
      StateSyncBus.emit('campaign:loaded', { campaignId: 'test', campaignName: 'Test' }, 'test');

      // Should only receive first event due to deduplication
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it('should not dedupe different payloads', () => {
      const callback = vi.fn();
      const unsubscribe = StateSyncBus.subscribe('campaign:loaded', callback);

      StateSyncBus.emit('campaign:loaded', { campaignId: 'test1', campaignName: 'Test1' }, 'test');
      StateSyncBus.emit('campaign:loaded', { campaignId: 'test2', campaignName: 'Test2' }, 'test');

      expect(callback).toHaveBeenCalledTimes(2);

      unsubscribe();
    });
  });

  describe('error handling', () => {
    it('should continue notifying other subscribers if one throws', () => {
      const throwingCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      const unsub1 = StateSyncBus.subscribe('campaign:loaded', throwingCallback);
      const unsub2 = StateSyncBus.subscribe('campaign:loaded', normalCallback);

      // Should not throw
      expect(() => {
        StateSyncBus.emit('campaign:loaded', { campaignId: 'test', campaignName: 'Test' }, 'test');
      }).not.toThrow();

      // Both should have been called
      expect(throwingCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);

      unsub1();
      unsub2();
    });
  });

  describe('subscriber counts', () => {
    it('should track subscriber counts correctly', () => {
      const unsub1 = StateSyncBus.subscribe('campaign:loaded', () => {});
      const unsub2 = StateSyncBus.subscribe('campaign:loaded', () => {});
      const unsub3 = StateSyncBus.subscribe('campaign:saved', () => {});
      const unsub4 = StateSyncBus.subscribeAll(() => {});

      const counts = StateSyncBus.getSubscriberCounts();

      expect(counts['campaign:loaded']).toBe(2);
      expect(counts['campaign:saved']).toBe(1);
      expect(counts.global).toBe(1);

      unsub1();
      unsub2();
      unsub3();
      unsub4();
    });
  });
});
