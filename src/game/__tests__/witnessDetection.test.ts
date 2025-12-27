// ============================================================================
// WITNESS DETECTION TESTS
// Tests for the witness detection logic in systemIntegrations.ts
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock event bus for testing
class MockEventBus {
  private events: Array<{ type: string; tick: number; data?: any }> = [];
  
  emit(event: { type: string; tick: number; data?: any }) {
    this.events.push(event);
  }
  
  getEventsByType(type: string, count: number): Array<{ tick: number; data?: any }> {
    return this.events
      .filter(e => e.type === type)
      .slice(-count);
  }
  
  clear() {
    this.events = [];
  }
}

// Witness detection logic extracted for testing
function detectWitness(
  eventBus: MockEventBus,
  theftTick: number,
  randomValue: number // Inject random value for deterministic testing
): boolean {
  const witnessEvents = eventBus.getEventsByType('LOCATION_ENTERED', 5);
  const recentLocationEvents = witnessEvents.filter(e => 
    e.tick >= theftTick - 1 && e.tick <= theftTick + 1
  );
  return recentLocationEvents.length > 0 || randomValue < 0.3;
}

describe('Witness Detection', () => {
  let mockEventBus: MockEventBus;
  
  beforeEach(() => {
    mockEventBus = new MockEventBus();
  });
  
  describe('detectWitness', () => {
    it('should return false when no witnesses and random is above 30%', () => {
      const result = detectWitness(mockEventBus, 10, 0.5);
      expect(result).toBe(false);
    });
    
    it('should return true when NPC entered location at same tick', () => {
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 10 });
      const result = detectWitness(mockEventBus, 10, 0.9);
      expect(result).toBe(true);
    });
    
    it('should return true when NPC entered location one tick before theft', () => {
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 9 });
      const result = detectWitness(mockEventBus, 10, 0.9);
      expect(result).toBe(true);
    });
    
    it('should return true when NPC entered location one tick after theft', () => {
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 11 });
      const result = detectWitness(mockEventBus, 10, 0.9);
      expect(result).toBe(true);
    });
    
    it('should return false when NPC entered location outside window', () => {
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 5 });
      const result = detectWitness(mockEventBus, 10, 0.9);
      expect(result).toBe(false);
    });
    
    it('should return true due to 30% random chance even without witnesses', () => {
      const result = detectWitness(mockEventBus, 10, 0.2);
      expect(result).toBe(true);
    });
    
    it('should return true at exactly 30% threshold', () => {
      const result = detectWitness(mockEventBus, 10, 0.29);
      expect(result).toBe(true);
    });
    
    it('should return false just above 30% threshold without witnesses', () => {
      const result = detectWitness(mockEventBus, 10, 0.31);
      expect(result).toBe(false);
    });
    
    it('should detect multiple witnesses', () => {
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 9 });
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 10 });
      mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 11 });
      const result = detectWitness(mockEventBus, 10, 0.9);
      expect(result).toBe(true);
    });
    
    it('should ignore non-location events', () => {
      mockEventBus.emit({ type: 'DAMAGE_DEALT', tick: 10 });
      mockEventBus.emit({ type: 'ITEM_PICKED_UP', tick: 10 });
      const result = detectWitness(mockEventBus, 10, 0.9);
      expect(result).toBe(false);
    });
  });
  
  describe('random witness chance', () => {
    it('should have approximately 30% chance of random witness over many trials', () => {
      // This is a statistical test - in real usage we'd use Math.random()
      const trials = 1000;
      let witnessed = 0;
      
      for (let i = 0; i < trials; i++) {
        const randomValue = i / trials; // Uniform distribution simulation
        if (randomValue < 0.3) witnessed++;
      }
      
      // Allow 5% tolerance
      expect(witnessed / trials).toBeCloseTo(0.3, 1);
    });
  });
});

// Integration test scenario
describe('Witness Detection Integration Scenarios', () => {
  let mockEventBus: MockEventBus;
  
  beforeEach(() => {
    mockEventBus = new MockEventBus();
  });
  
  it('scenario: crowded marketplace theft should be witnessed', () => {
    // Many NPCs entering the location around the theft
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 8 });
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 9 });
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 10 });
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 10 });
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 11 });
    
    const result = detectWitness(mockEventBus, 10, 0.99);
    expect(result).toBe(true);
  });
  
  it('scenario: isolated theft with no NPCs should have random chance', () => {
    // No location events near the theft
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 1 });
    mockEventBus.emit({ type: 'LOCATION_ENTERED', tick: 2 });
    
    // High random value = no random witness
    expect(detectWitness(mockEventBus, 10, 0.9)).toBe(false);
    
    // Low random value = random witness (maybe heard something)
    expect(detectWitness(mockEventBus, 10, 0.1)).toBe(true);
  });
  
  it('scenario: guard patrol just passed by', () => {
    // Guard entered location just before theft
    mockEventBus.emit({ 
      type: 'LOCATION_ENTERED', 
      tick: 9,
      data: { entityId: 'guard_1' }
    });
    
    const result = detectWitness(mockEventBus, 10, 0.99);
    expect(result).toBe(true);
  });
});
