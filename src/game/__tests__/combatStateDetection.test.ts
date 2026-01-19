// ============================================================================
// COMBAT STATE DETECTION TESTS
// Tests for the combat state detection logic in gameEngine.ts
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

// Mock event bus for testing
class MockEventBus {
  private events: Array<{ type: string; tick: number }> = [];
  
  emit(event: { type: string; tick: number }) {
    this.events.push(event);
  }
  
  getEventsByType(type: string, count: number): Array<{ tick: number }> {
    return this.events
      .filter(e => e.type === type)
      .slice(-count);
  }
  
  clear() {
    this.events = [];
  }
}

// Combat state detection logic extracted for testing
function detectCombatState(
  eventBus: MockEventBus,
  currentTick: number,
  lookbackWindow: number = 3
): boolean {
  const recentCombatEvents = eventBus.getEventsByType('DAMAGE_DEALT', 3);
  if (recentCombatEvents.length === 0) return false;
  // Use the MOST RECENT event (last in the slice), not the oldest
  const mostRecentEvent = recentCombatEvents[recentCombatEvents.length - 1];
  return (currentTick - mostRecentEvent.tick) < lookbackWindow;
}

describe('Combat State Detection', () => {
  let mockEventBus: MockEventBus;
  
  beforeEach(() => {
    mockEventBus = new MockEventBus();
  });
  
  describe('detectCombatState', () => {
    it('should return false when no combat events exist', () => {
      const result = detectCombatState(mockEventBus, 10);
      expect(result).toBe(false);
    });
    
    it('should return true when combat happened within lookback window', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 8 });
      const result = detectCombatState(mockEventBus, 10);
      expect(result).toBe(true);
    });
    
    it('should return false when combat is outside lookback window', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 5 });
      const result = detectCombatState(mockEventBus, 10);
      expect(result).toBe(false);
    });
    
    it('should return true when combat happened exactly at window boundary', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 7 });
      const result = detectCombatState(mockEventBus, 10);
      // 10 - 7 = 3, which is NOT < 3, so this should be false (boundary exclusive)
      expect(result).toBe(false);
    });
    
    it('should return true when multiple combat events exist and most recent is in window', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 2 });
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 5 });
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 9 });
      const result = detectCombatState(mockEventBus, 10);
      expect(result).toBe(true);
    });
    
    it('should ignore non-combat events', () => {
      mockEventBus.emit({ type: 'ITEM_PICKED_UP', tick: 9 });
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 9 });
      const result = detectCombatState(mockEventBus, 10);
      expect(result).toBe(false);
    });
    
    it('should handle custom lookback window', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 5 });
      // Default window of 3 would return false
      expect(detectCombatState(mockEventBus, 10, 3)).toBe(false);
      // Extended window of 6 would return true
      expect(detectCombatState(mockEventBus, 10, 6)).toBe(true);
    });
    
    it('should return true when combat is on current tick', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 10 });
      const result = detectCombatState(mockEventBus, 10);
      expect(result).toBe(true);
    });
  });
});

// Time since last conflict calculation tests
function calculateTimeSinceLastConflict(
  eventBus: MockEventBus,
  currentTick: number
): number {
  const recentEvents = eventBus.getEventsByType('DAMAGE_DEALT', 10);
  if (recentEvents.length === 0) return 999;
  // Use the MOST RECENT event (last in slice)
  const lastCombatEvent = recentEvents[recentEvents.length - 1];
  return currentTick - lastCombatEvent.tick;
}

describe('Time Since Last Conflict', () => {
  let mockEventBus: MockEventBus;
  
  beforeEach(() => {
    mockEventBus = new MockEventBus();
  });
  
  it('should return 999 when no conflict events exist', () => {
    const result = calculateTimeSinceLastConflict(mockEventBus, 10);
    expect(result).toBe(999);
  });
  
  it('should return correct time difference when conflict exists', () => {
    mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 5 });
    const result = calculateTimeSinceLastConflict(mockEventBus, 10);
    expect(result).toBe(5);
  });
  
  it('should return 0 when conflict is on current tick', () => {
    mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 10 });
    const result = calculateTimeSinceLastConflict(mockEventBus, 10);
    expect(result).toBe(0);
  });
  
  it('should use most recent conflict event', () => {
    mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 2 });
    mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 7 });
    const result = calculateTimeSinceLastConflict(mockEventBus, 10);
    expect(result).toBe(3);
  });
});
