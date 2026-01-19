// ============================================================================
// PRESSURE CLOCK SYSTEM TESTS
// Tests for the pressure clock / urgency system
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

// Types
interface PressureClock {
  id: string;
  name: string;
  description: string;
  currentSegments: number;
  maxSegments: number;
  tickRate: number; // Segments to advance per tick
  isPaused: boolean;
  consequence: string;
  triggerType: 'immediate' | 'gradual' | 'cascade';
  startTick: number;
  lastTickedAt: number;
}

interface PressureState {
  clocks: Map<string, PressureClock>;
  totalPressure: number;
  atmosphereLevel: 'calm' | 'tense' | 'urgent' | 'critical';
}

// Pressure Clock System implementation for testing
class PressureClockSystem {
  private state: PressureState = {
    clocks: new Map(),
    totalPressure: 0,
    atmosphereLevel: 'calm',
  };

  createClock(config: Omit<PressureClock, 'startTick' | 'lastTickedAt' | 'isPaused'>): PressureClock {
    const clock: PressureClock = {
      ...config,
      isPaused: false,
      startTick: Date.now(),
      lastTickedAt: Date.now(),
    };
    this.state.clocks.set(config.id, clock);
    this.updateAtmosphere();
    return clock;
  }

  getClock(id: string): PressureClock | undefined {
    return this.state.clocks.get(id);
  }

  getAllClocks(): PressureClock[] {
    return Array.from(this.state.clocks.values());
  }

  advanceClock(id: string, segments: number = 1): { completed: boolean; consequence?: string } {
    const clock = this.state.clocks.get(id);
    if (!clock || clock.isPaused) return { completed: false };

    clock.currentSegments = Math.min(clock.maxSegments, clock.currentSegments + segments);
    clock.lastTickedAt = Date.now();
    this.updateAtmosphere();

    if (clock.currentSegments >= clock.maxSegments) {
      return { completed: true, consequence: clock.consequence };
    }
    return { completed: false };
  }

  reduceClock(id: string, segments: number): number {
    const clock = this.state.clocks.get(id);
    if (!clock) return -1;

    clock.currentSegments = Math.max(0, clock.currentSegments - segments);
    this.updateAtmosphere();
    return clock.currentSegments;
  }

  pauseClock(id: string): boolean {
    const clock = this.state.clocks.get(id);
    if (!clock) return false;
    clock.isPaused = true;
    return true;
  }

  resumeClock(id: string): boolean {
    const clock = this.state.clocks.get(id);
    if (!clock) return false;
    clock.isPaused = false;
    return true;
  }

  removeClock(id: string): boolean {
    const result = this.state.clocks.delete(id);
    this.updateAtmosphere();
    return result;
  }

  processTick(): Array<{ clockId: string; consequence: string }> {
    const triggered: Array<{ clockId: string; consequence: string }> = [];

    for (const clock of this.state.clocks.values()) {
      if (clock.isPaused) continue;

      const result = this.advanceClock(clock.id, clock.tickRate);
      if (result.completed && result.consequence) {
        triggered.push({ clockId: clock.id, consequence: result.consequence });
      }
    }

    return triggered;
  }

  private updateAtmosphere(): void {
    const clocks = Array.from(this.state.clocks.values());
    if (clocks.length === 0) {
      this.state.atmosphereLevel = 'calm';
      this.state.totalPressure = 0;
      return;
    }

    // Calculate pressure based on how filled each clock is
    let totalPressure = 0;
    for (const clock of clocks) {
      if (!clock.isPaused) {
        const fillPercentage = clock.currentSegments / clock.maxSegments;
        totalPressure += fillPercentage * 100;
      }
    }
    
    this.state.totalPressure = totalPressure / clocks.length;

    // Determine atmosphere based on average pressure
    if (this.state.totalPressure >= 80) {
      this.state.atmosphereLevel = 'critical';
    } else if (this.state.totalPressure >= 60) {
      this.state.atmosphereLevel = 'urgent';
    } else if (this.state.totalPressure >= 30) {
      this.state.atmosphereLevel = 'tense';
    } else {
      this.state.atmosphereLevel = 'calm';
    }
  }

  getAtmosphere(): { level: string; pressure: number } {
    return {
      level: this.state.atmosphereLevel,
      pressure: this.state.totalPressure,
    };
  }

  getPressureContext(): string {
    const clocks = this.getAllClocks().filter(c => !c.isPaused);
    if (clocks.length === 0) return 'No active pressure clocks.';

    const lines = clocks.map(c => {
      const percentage = Math.round((c.currentSegments / c.maxSegments) * 100);
      return `- ${c.name}: ${c.currentSegments}/${c.maxSegments} (${percentage}%) - ${c.description}`;
    });

    return `Active Pressure Clocks:\n${lines.join('\n')}\nAtmosphere: ${this.state.atmosphereLevel}`;
  }

  processNarrativeForPressure(narrative: string): string[] {
    const effects: string[] = [];

    // Look for narrative cues that might advance clocks
    const urgencyPatterns = [
      { pattern: /time is running out/gi, effect: 'urgency_detected' },
      { pattern: /enemy.*approach/gi, effect: 'threat_advancing' },
      { pattern: /deadline/gi, effect: 'deadline_mentioned' },
      { pattern: /too late/gi, effect: 'failure_imminent' },
    ];

    for (const { pattern, effect } of urgencyPatterns) {
      if (pattern.test(narrative)) {
        effects.push(effect);
      }
    }

    return effects;
  }

  serialize(): Record<string, any> {
    return {
      clocks: Object.fromEntries(this.state.clocks),
      totalPressure: this.state.totalPressure,
      atmosphereLevel: this.state.atmosphereLevel,
    };
  }

  deserialize(data: Record<string, any>): void {
    this.state.clocks = new Map(Object.entries(data.clocks || {}));
    this.state.totalPressure = data.totalPressure || 0;
    this.state.atmosphereLevel = data.atmosphereLevel || 'calm';
  }

  clear(): void {
    this.state.clocks.clear();
    this.state.totalPressure = 0;
    this.state.atmosphereLevel = 'calm';
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Pressure Clock System', () => {
  let system: PressureClockSystem;

  beforeEach(() => {
    system = new PressureClockSystem();
  });

  describe('createClock', () => {
    it('should create a clock with default values', () => {
      const clock = system.createClock({
        id: 'doom_clock',
        name: 'Impending Doom',
        description: 'The dark ritual nears completion',
        currentSegments: 0,
        maxSegments: 6,
        tickRate: 1,
        consequence: 'The demon is summoned!',
        triggerType: 'immediate',
      });

      expect(clock.id).toBe('doom_clock');
      expect(clock.currentSegments).toBe(0);
      expect(clock.maxSegments).toBe(6);
      expect(clock.isPaused).toBe(false);
    });

    it('should allow clocks with different segment counts', () => {
      const clock4 = system.createClock({
        id: 'clock_4', name: 'Four Segment', description: '', 
        currentSegments: 0, maxSegments: 4, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });
      const clock8 = system.createClock({
        id: 'clock_8', name: 'Eight Segment', description: '',
        currentSegments: 0, maxSegments: 8, tickRate: 1,
        consequence: '', triggerType: 'gradual',
      });

      expect(clock4.maxSegments).toBe(4);
      expect(clock8.maxSegments).toBe(8);
    });
  });

  describe('advanceClock', () => {
    beforeEach(() => {
      system.createClock({
        id: 'test_clock',
        name: 'Test',
        description: 'Test clock',
        currentSegments: 0,
        maxSegments: 4,
        tickRate: 1,
        consequence: 'Test consequence',
        triggerType: 'immediate',
      });
    });

    it('should advance clock by specified segments', () => {
      system.advanceClock('test_clock', 2);
      const clock = system.getClock('test_clock');
      expect(clock?.currentSegments).toBe(2);
    });

    it('should not exceed max segments', () => {
      system.advanceClock('test_clock', 10);
      const clock = system.getClock('test_clock');
      expect(clock?.currentSegments).toBe(4);
    });

    it('should trigger consequence when completed', () => {
      system.advanceClock('test_clock', 3);
      const result = system.advanceClock('test_clock', 1);
      
      expect(result.completed).toBe(true);
      expect(result.consequence).toBe('Test consequence');
    });

    it('should not advance paused clocks', () => {
      system.pauseClock('test_clock');
      system.advanceClock('test_clock', 2);
      
      const clock = system.getClock('test_clock');
      expect(clock?.currentSegments).toBe(0);
    });
  });

  describe('reduceClock', () => {
    it('should reduce clock segments', () => {
      system.createClock({
        id: 'test_clock',
        name: 'Test', description: '',
        currentSegments: 4, maxSegments: 6, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });

      const remaining = system.reduceClock('test_clock', 2);
      expect(remaining).toBe(2);
    });

    it('should not go below zero', () => {
      system.createClock({
        id: 'test_clock',
        name: 'Test', description: '',
        currentSegments: 2, maxSegments: 6, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });

      const remaining = system.reduceClock('test_clock', 5);
      expect(remaining).toBe(0);
    });
  });

  describe('pause and resume', () => {
    beforeEach(() => {
      system.createClock({
        id: 'test_clock',
        name: 'Test', description: '',
        currentSegments: 0, maxSegments: 4, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });
    });

    it('should pause a clock', () => {
      system.pauseClock('test_clock');
      expect(system.getClock('test_clock')?.isPaused).toBe(true);
    });

    it('should resume a paused clock', () => {
      system.pauseClock('test_clock');
      system.resumeClock('test_clock');
      expect(system.getClock('test_clock')?.isPaused).toBe(false);
    });
  });

  describe('processTick', () => {
    it('should advance all active clocks', () => {
      system.createClock({
        id: 'clock_1', name: 'Clock 1', description: '',
        currentSegments: 0, maxSegments: 4, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });
      system.createClock({
        id: 'clock_2', name: 'Clock 2', description: '',
        currentSegments: 0, maxSegments: 4, tickRate: 2,
        consequence: '', triggerType: 'immediate',
      });

      system.processTick();

      expect(system.getClock('clock_1')?.currentSegments).toBe(1);
      expect(system.getClock('clock_2')?.currentSegments).toBe(2);
    });

    it('should return triggered consequences', () => {
      system.createClock({
        id: 'near_complete', name: 'Near Complete', description: '',
        currentSegments: 3, maxSegments: 4, tickRate: 1,
        consequence: 'Doom arrives!', triggerType: 'immediate',
      });

      const triggered = system.processTick();
      
      expect(triggered).toHaveLength(1);
      expect(triggered[0].consequence).toBe('Doom arrives!');
    });

    it('should skip paused clocks', () => {
      system.createClock({
        id: 'paused_clock', name: 'Paused', description: '',
        currentSegments: 0, maxSegments: 4, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });
      system.pauseClock('paused_clock');

      system.processTick();

      expect(system.getClock('paused_clock')?.currentSegments).toBe(0);
    });
  });

  describe('atmosphere', () => {
    it('should be calm with no clocks', () => {
      const atmosphere = system.getAtmosphere();
      expect(atmosphere.level).toBe('calm');
      expect(atmosphere.pressure).toBe(0);
    });

    it('should become tense with partially filled clocks', () => {
      system.createClock({
        id: 'test', name: 'Test', description: '',
        currentSegments: 2, maxSegments: 6, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });

      const atmosphere = system.getAtmosphere();
      expect(atmosphere.level).toBe('tense');
    });

    it('should become urgent with mostly filled clocks', () => {
      system.createClock({
        id: 'test', name: 'Test', description: '',
        currentSegments: 4, maxSegments: 6, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });

      const atmosphere = system.getAtmosphere();
      expect(atmosphere.level).toBe('urgent');
    });

    it('should become critical with nearly complete clocks', () => {
      system.createClock({
        id: 'test', name: 'Test', description: '',
        currentSegments: 5, maxSegments: 6, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });

      const atmosphere = system.getAtmosphere();
      expect(atmosphere.level).toBe('critical');
    });
  });

  describe('getPressureContext', () => {
    it('should return context string for AI', () => {
      system.createClock({
        id: 'ritual', name: 'Dark Ritual', description: 'Evil approaches',
        currentSegments: 3, maxSegments: 6, tickRate: 1,
        consequence: '', triggerType: 'immediate',
      });

      const context = system.getPressureContext();
      
      expect(context).toContain('Dark Ritual');
      expect(context).toContain('3/6');
      expect(context).toContain('50%');
      expect(context).toContain('Evil approaches');
    });
  });

  describe('processNarrativeForPressure', () => {
    it('should detect urgency patterns', () => {
      const effects = system.processNarrativeForPressure(
        'The enemy approaches from the north. Time is running out!'
      );

      expect(effects).toContain('urgency_detected');
      expect(effects).toContain('threat_advancing');
    });

    it('should return empty array for calm narrative', () => {
      const effects = system.processNarrativeForPressure(
        'The peaceful village sits quietly under the afternoon sun.'
      );

      expect(effects).toHaveLength(0);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize state', () => {
      system.createClock({
        id: 'persistent', name: 'Persistent Clock', description: 'Test',
        currentSegments: 3, maxSegments: 8, tickRate: 1,
        consequence: 'Boom!', triggerType: 'cascade',
      });
      system.advanceClock('persistent', 2);

      const serialized = system.serialize();
      
      const newSystem = new PressureClockSystem();
      newSystem.deserialize(serialized);

      const restored = newSystem.getClock('persistent');
      expect(restored?.name).toBe('Persistent Clock');
      expect(restored?.currentSegments).toBe(5);
    });
  });

  describe('multiple clocks interaction', () => {
    it('should manage multiple independent clocks', () => {
      system.createClock({
        id: 'clock_a', name: 'A', description: '',
        currentSegments: 0, maxSegments: 4, tickRate: 1,
        consequence: 'A triggers', triggerType: 'immediate',
      });
      system.createClock({
        id: 'clock_b', name: 'B', description: '',
        currentSegments: 0, maxSegments: 6, tickRate: 2,
        consequence: 'B triggers', triggerType: 'immediate',
      });

      system.advanceClock('clock_a', 2);
      system.processTick();

      expect(system.getClock('clock_a')?.currentSegments).toBe(3);
      expect(system.getClock('clock_b')?.currentSegments).toBe(2);
    });
  });
});
