// ============================================================================
// COMPANION SYSTEM TESTS
// Tests for companion creation, persistence, and interaction memory
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock companion data types
interface CompanionPersonality {
  traits: string[];
  preferredTopics: string[];
  avoidedTopics: string[];
  speechStyle: string;
}

interface CompanionState {
  id: string;
  name: string;
  affinity: number;
  trust: number;
  discoveredQuirks: string[];
  sharedTopics: Map<string, { type: string; response: string }>;
  personality: CompanionPersonality;
  introduced: boolean;
  lastInteractionTick: number;
}

// Companion system implementation for testing
class CompanionSystem {
  private companions: Map<string, CompanionState> = new Map();
  private hiddenQuirks: Map<string, { quirk: string; threshold: { trust?: number; affinity?: number; trigger?: string } }[]> = new Map();

  createCompanion(config: {
    id: string;
    name: string;
    personality: CompanionPersonality;
    quirks?: { quirk: string; threshold: { trust?: number; affinity?: number; trigger?: string } }[];
  }): CompanionState {
    const companion: CompanionState = {
      id: config.id,
      name: config.name,
      affinity: 50, // Neutral starting affinity
      trust: 50,    // Neutral starting trust
      discoveredQuirks: [],
      sharedTopics: new Map(),
      personality: config.personality,
      introduced: false,
      lastInteractionTick: 0,
    };
    this.companions.set(config.id, companion);
    
    if (config.quirks) {
      this.hiddenQuirks.set(config.id, config.quirks);
    }
    
    return companion;
  }

  getCompanion(id: string): CompanionState | undefined {
    return this.companions.get(id);
  }

  updateAffinity(companionId: string, delta: number): number {
    const companion = this.companions.get(companionId);
    if (!companion) return -1;
    companion.affinity = Math.max(0, Math.min(100, companion.affinity + delta));
    this.checkQuirkDiscovery(companionId);
    return companion.affinity;
  }

  updateTrust(companionId: string, delta: number): number {
    const companion = this.companions.get(companionId);
    if (!companion) return -1;
    companion.trust = Math.max(0, Math.min(100, companion.trust + delta));
    this.checkQuirkDiscovery(companionId);
    return companion.trust;
  }

  private checkQuirkDiscovery(companionId: string): void {
    const companion = this.companions.get(companionId);
    const quirks = this.hiddenQuirks.get(companionId);
    if (!companion || !quirks) return;

    for (const { quirk, threshold } of quirks) {
      if (companion.discoveredQuirks.includes(quirk)) continue;
      
      if (threshold.trust !== undefined && companion.trust >= threshold.trust) {
        companion.discoveredQuirks.push(quirk);
      } else if (threshold.affinity !== undefined && companion.affinity >= threshold.affinity) {
        companion.discoveredQuirks.push(quirk);
      }
    }
  }

  triggerBondingMoment(companionId: string, trigger: string): string[] {
    const companion = this.companions.get(companionId);
    const quirks = this.hiddenQuirks.get(companionId);
    if (!companion || !quirks) return [];

    const newQuirks: string[] = [];
    for (const { quirk, threshold } of quirks) {
      if (companion.discoveredQuirks.includes(quirk)) continue;
      
      if (threshold.trigger === trigger) {
        companion.discoveredQuirks.push(quirk);
        newQuirks.push(quirk);
      }
    }
    return newQuirks;
  }

  sharePersonalTopic(companionId: string, topic: string, responseType: 'honest' | 'emotional' | 'lie'): boolean {
    const companion = this.companions.get(companionId);
    if (!companion) return false;

    companion.sharedTopics.set(topic, { type: topic, response: responseType });
    
    // Trust changes based on response type
    if (responseType === 'honest') {
      this.updateTrust(companionId, 5);
    } else if (responseType === 'lie') {
      this.updateTrust(companionId, -3); // Slightly negative (might be discovered later)
    }
    
    return true;
  }

  getSharedTopics(companionId: string): Map<string, { type: string; response: string }> {
    const companion = this.companions.get(companionId);
    return companion?.sharedTopics || new Map();
  }

  getContextualSupport(companionId: string, situation: string): { advice?: string; willInterfere: boolean } {
    const companion = this.companions.get(companionId);
    if (!companion) return { willInterfere: false };

    const situationTypes = [
      'combat', 'difficult_choice', 'social_conflict', 'moral_dilemma',
      'romance', 'negotiation', 'puzzle', 'exploration', 'rest', 'crafting',
      'trading', 'stealth', 'magic', 'healing', 'investigation', 'escape'
    ];

    if (!situationTypes.includes(situation)) return { willInterfere: false };

    // High trust companions give better advice
    if (companion.trust >= 75) {
      return { 
        advice: `${companion.name} offers trusted insight based on their experience.`,
        willInterfere: companion.affinity >= 80 
      };
    } else if (companion.trust >= 50) {
      return { 
        advice: `${companion.name} shares a cautious suggestion.`,
        willInterfere: false 
      };
    }
    
    return { willInterfere: false };
  }

  markIntroduced(companionId: string, tick: number): boolean {
    const companion = this.companions.get(companionId);
    if (!companion) return false;
    companion.introduced = true;
    companion.lastInteractionTick = tick;
    return true;
  }

  serialize(): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [id, companion] of this.companions) {
      data[id] = {
        ...companion,
        sharedTopics: Object.fromEntries(companion.sharedTopics),
      };
    }
    return data;
  }

  deserialize(data: Record<string, any>): void {
    this.companions.clear();
    for (const [id, companionData] of Object.entries(data)) {
      const companion = companionData as any;
      companion.sharedTopics = new Map(Object.entries(companion.sharedTopics || {}));
      this.companions.set(id, companion);
    }
  }

  clear(): void {
    this.companions.clear();
    this.hiddenQuirks.clear();
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Companion System', () => {
  let system: CompanionSystem;

  beforeEach(() => {
    system = new CompanionSystem();
  });

  describe('createCompanion', () => {
    it('should create a companion with default values', () => {
      const companion = system.createCompanion({
        id: 'companion_1',
        name: 'Elena',
        personality: {
          traits: ['brave', 'loyal'],
          preferredTopics: ['adventure', 'combat'],
          avoidedTopics: ['family'],
          speechStyle: 'direct',
        },
      });

      expect(companion.id).toBe('companion_1');
      expect(companion.name).toBe('Elena');
      expect(companion.affinity).toBe(50);
      expect(companion.trust).toBe(50);
      expect(companion.discoveredQuirks).toEqual([]);
      expect(companion.introduced).toBe(false);
    });

    it('should register hidden quirks', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Marcus',
        personality: {
          traits: ['quiet'],
          preferredTopics: [],
          avoidedTopics: [],
          speechStyle: 'terse',
        },
        quirks: [
          { quirk: 'secretly_fears_water', threshold: { trust: 80 } },
          { quirk: 'loves_poetry', threshold: { affinity: 70 } },
          { quirk: 'saved_village', threshold: { trigger: 'combat_survival' } },
        ],
      });

      const companion = system.getCompanion('companion_1');
      expect(companion).toBeDefined();
      expect(companion?.discoveredQuirks).toHaveLength(0);
    });
  });

  describe('affinity and trust', () => {
    beforeEach(() => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Test',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
        quirks: [
          { quirk: 'high_trust_secret', threshold: { trust: 75 } },
          { quirk: 'high_affinity_hobby', threshold: { affinity: 80 } },
        ],
      });
    });

    it('should update affinity within bounds', () => {
      const newAffinity = system.updateAffinity('companion_1', 30);
      expect(newAffinity).toBe(80);

      const cappedAffinity = system.updateAffinity('companion_1', 50);
      expect(cappedAffinity).toBe(100);

      const reducedAffinity = system.updateAffinity('companion_1', -150);
      expect(reducedAffinity).toBe(0);
    });

    it('should update trust within bounds', () => {
      const newTrust = system.updateTrust('companion_1', 25);
      expect(newTrust).toBe(75);
    });

    it('should discover quirks when threshold is met', () => {
      system.updateTrust('companion_1', 25); // trust = 75
      const companion = system.getCompanion('companion_1');
      expect(companion?.discoveredQuirks).toContain('high_trust_secret');
    });

    it('should not discover quirks before threshold', () => {
      system.updateTrust('companion_1', 20); // trust = 70
      const companion = system.getCompanion('companion_1');
      expect(companion?.discoveredQuirks).not.toContain('high_trust_secret');
    });
  });

  describe('bonding moments', () => {
    it('should discover trigger-based quirks', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Warrior',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
        quirks: [
          { quirk: 'battle_cry', threshold: { trigger: 'combat_survival' } },
          { quirk: 'campfire_story', threshold: { trigger: 'rest_together' } },
        ],
      });

      const discovered = system.triggerBondingMoment('companion_1', 'combat_survival');
      expect(discovered).toContain('battle_cry');
      expect(discovered).not.toContain('campfire_story');
    });

    it('should not re-discover already discovered quirks', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Test',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
        quirks: [{ quirk: 'unique_quirk', threshold: { trigger: 'special_event' } }],
      });

      const first = system.triggerBondingMoment('companion_1', 'special_event');
      const second = system.triggerBondingMoment('companion_1', 'special_event');

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(0);
    });
  });

  describe('personal topic sharing', () => {
    beforeEach(() => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Confidant',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
      });
    });

    it('should track shared topics with response types', () => {
      system.sharePersonalTopic('companion_1', 'dreams', 'honest');
      system.sharePersonalTopic('companion_1', 'fears', 'emotional');
      system.sharePersonalTopic('companion_1', 'past', 'lie');

      const topics = system.getSharedTopics('companion_1');
      expect(topics.size).toBe(3);
      expect(topics.get('dreams')?.response).toBe('honest');
      expect(topics.get('past')?.response).toBe('lie');
    });

    it('should increase trust for honest responses', () => {
      const initialTrust = system.getCompanion('companion_1')?.trust || 0;
      system.sharePersonalTopic('companion_1', 'secrets', 'honest');
      const newTrust = system.getCompanion('companion_1')?.trust || 0;

      expect(newTrust).toBeGreaterThan(initialTrust);
    });

    it('should decrease trust for lies', () => {
      const initialTrust = system.getCompanion('companion_1')?.trust || 0;
      system.sharePersonalTopic('companion_1', 'background', 'lie');
      const newTrust = system.getCompanion('companion_1')?.trust || 0;

      expect(newTrust).toBeLessThan(initialTrust);
    });
  });

  describe('contextual support', () => {
    it('should provide advice based on trust level', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Advisor',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
      });

      // Low trust - no advice
      const lowTrustSupport = system.getContextualSupport('companion_1', 'combat');
      expect(lowTrustSupport.advice).toBeUndefined();

      // High trust - gives advice
      system.updateTrust('companion_1', 30); // trust = 80
      const highTrustSupport = system.getContextualSupport('companion_1', 'combat');
      expect(highTrustSupport.advice).toBeDefined();
      expect(highTrustSupport.advice).toContain('trusted insight');
    });

    it('should interfere when affinity is very high', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Best Friend',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
      });

      system.updateTrust('companion_1', 30); // trust = 80
      system.updateAffinity('companion_1', 35); // affinity = 85

      const support = system.getContextualSupport('companion_1', 'difficult_choice');
      expect(support.willInterfere).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize companion state', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Persistent',
        personality: { traits: ['loyal'], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
      });

      system.updateAffinity('companion_1', 20);
      system.sharePersonalTopic('companion_1', 'dream', 'honest');
      system.markIntroduced('companion_1', 100);

      const serialized = system.serialize();
      
      // Create new system and restore
      const newSystem = new CompanionSystem();
      newSystem.deserialize(serialized);

      const restored = newSystem.getCompanion('companion_1');
      expect(restored?.name).toBe('Persistent');
      expect(restored?.affinity).toBe(70);
      expect(restored?.introduced).toBe(true);
      expect(restored?.sharedTopics.get('dream')?.response).toBe('honest');
    });
  });

  describe('companion isolation', () => {
    it('should keep companion memories isolated', () => {
      system.createCompanion({
        id: 'companion_1',
        name: 'Alice',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
      });
      system.createCompanion({
        id: 'companion_2',
        name: 'Bob',
        personality: { traits: [], preferredTopics: [], avoidedTopics: [], speechStyle: 'normal' },
      });

      system.sharePersonalTopic('companion_1', 'secret', 'honest');
      system.updateAffinity('companion_2', 30);

      const aliceTopics = system.getSharedTopics('companion_1');
      const bobTopics = system.getSharedTopics('companion_2');

      expect(aliceTopics.size).toBe(1);
      expect(bobTopics.size).toBe(0);
      expect(system.getCompanion('companion_1')?.affinity).toBe(50);
      expect(system.getCompanion('companion_2')?.affinity).toBe(80);
    });
  });
});
