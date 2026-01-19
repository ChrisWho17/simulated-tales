// ============================================================================
// CAMPAIGN MEMORY SYSTEM TESTS
// Tests for the three-tier memory architecture
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

// Types
type MemoryType = 'witnessed' | 'experienced' | 'heard' | 'caused' | 'felt';
type MemorySource = 'firsthand' | 'trusted' | 'rumor' | 'assumed';
type MemoryReliability = 'certain' | 'probable' | 'uncertain' | 'distorted';

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  source: MemorySource;
  reliability: MemoryReliability;
  emotionalIntensity: number; // 0-100
  sentiment: 'positive' | 'negative' | 'neutral';
  salience: number; // How present in mind
  accessCount: number;
  createdAt: number;
  lastAccessedAt: number;
  decayRate: number;
  isTraumatic: boolean;
  isSecret: boolean;
  isSharable: boolean;
  entities: string[]; // NPCs or objects involved
  location?: string;
}

interface MemoryTier {
  name: string;
  capacity: number;
  decayPerHour: number;
  memories: Map<string, Memory>;
}

// Campaign Memory System implementation for testing
class CampaignMemorySystem {
  private shortTerm: MemoryTier = {
    name: 'short-term',
    capacity: 20,
    decayPerHour: 10,
    memories: new Map(),
  };

  private mediumTerm: MemoryTier = {
    name: 'medium-term',
    capacity: 50,
    decayPerHour: 2,
    memories: new Map(),
  };

  private longTerm: MemoryTier = {
    name: 'long-term',
    capacity: 100,
    decayPerHour: 0.1,
    memories: new Map(),
  };

  private lastTickTime: number = Date.now();

  createMemory(config: Partial<Memory> & { content: string; type: MemoryType }): Memory {
    const memory: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: config.content,
      type: config.type,
      source: config.source || 'firsthand',
      reliability: config.reliability || 'certain',
      emotionalIntensity: config.emotionalIntensity ?? 50,
      sentiment: config.sentiment || 'neutral',
      salience: config.emotionalIntensity ?? 50,
      accessCount: 0,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      decayRate: this.shortTerm.decayPerHour,
      isTraumatic: config.isTraumatic || false,
      isSecret: config.isSecret || false,
      isSharable: config.isSharable ?? true,
      entities: config.entities || [],
      location: config.location,
    };

    // Traumatic memories go straight to long-term
    if (memory.isTraumatic) {
      memory.decayRate = 0;
      this.longTerm.memories.set(memory.id, memory);
    } else {
      this.shortTerm.memories.set(memory.id, memory);
      this.enforceCapacity(this.shortTerm);
    }

    return memory;
  }

  accessMemory(memoryId: string): Memory | null {
    // Search all tiers
    for (const tier of [this.shortTerm, this.mediumTerm, this.longTerm]) {
      const memory = tier.memories.get(memoryId);
      if (memory) {
        memory.accessCount++;
        memory.lastAccessedAt = Date.now();
        memory.salience = Math.min(100, memory.salience + 10);
        this.checkPromotion(memory, tier);
        return memory;
      }
    }
    return null;
  }

  private checkPromotion(memory: Memory, currentTier: MemoryTier): void {
    // Promote from short-term to medium-term
    if (currentTier === this.shortTerm) {
      if (memory.emotionalIntensity >= 70 || memory.accessCount >= 3) {
        this.shortTerm.memories.delete(memory.id);
        memory.decayRate = this.mediumTerm.decayPerHour;
        this.mediumTerm.memories.set(memory.id, memory);
        this.enforceCapacity(this.mediumTerm);
      }
    }
    // Promote from medium-term to long-term
    else if (currentTier === this.mediumTerm) {
      if (memory.emotionalIntensity >= 85 || memory.accessCount >= 5) {
        this.mediumTerm.memories.delete(memory.id);
        memory.decayRate = this.longTerm.decayPerHour;
        this.longTerm.memories.set(memory.id, memory);
        this.enforceCapacity(this.longTerm);
      }
    }
  }

  private enforceCapacity(tier: MemoryTier): void {
    while (tier.memories.size > tier.capacity) {
      // Remove lowest salience non-traumatic memory
      let lowestMemory: Memory | null = null;
      let lowestKey: string | null = null;

      for (const [key, memory] of tier.memories) {
        if (memory.isTraumatic) continue;
        if (!lowestMemory || memory.salience < lowestMemory.salience) {
          lowestMemory = memory;
          lowestKey = key;
        }
      }

      if (lowestKey) {
        tier.memories.delete(lowestKey);
      } else {
        break; // All memories are traumatic, can't remove
      }
    }
  }

  processDecay(hoursElapsed: number): number {
    let decayedCount = 0;

    for (const tier of [this.shortTerm, this.mediumTerm, this.longTerm]) {
      for (const [key, memory] of tier.memories) {
        if (memory.isTraumatic) continue;

        memory.salience -= tier.decayPerHour * hoursElapsed;

        if (memory.salience <= 0) {
          tier.memories.delete(key);
          decayedCount++;
        }
      }
    }

    return decayedCount;
  }

  getMemoriesForNPC(npcId: string): Memory[] {
    const memories: Memory[] = [];
    
    for (const tier of [this.shortTerm, this.mediumTerm, this.longTerm]) {
      for (const memory of tier.memories.values()) {
        if (memory.entities.includes(npcId)) {
          memories.push(memory);
        }
      }
    }

    return memories.sort((a, b) => b.salience - a.salience);
  }

  getRecentMemories(count: number = 10): Memory[] {
    const allMemories: Memory[] = [];

    for (const tier of [this.shortTerm, this.mediumTerm, this.longTerm]) {
      allMemories.push(...tier.memories.values());
    }

    return allMemories
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, count);
  }

  getSalientMemories(count: number = 10): Memory[] {
    const allMemories: Memory[] = [];

    for (const tier of [this.shortTerm, this.mediumTerm, this.longTerm]) {
      allMemories.push(...tier.memories.values());
    }

    return allMemories
      .sort((a, b) => b.salience - a.salience)
      .slice(0, count);
  }

  getTraumaticMemories(): Memory[] {
    const traumatic: Memory[] = [];

    for (const tier of [this.shortTerm, this.mediumTerm, this.longTerm]) {
      for (const memory of tier.memories.values()) {
        if (memory.isTraumatic) {
          traumatic.push(memory);
        }
      }
    }

    return traumatic;
  }

  spreadAsRumor(memoryId: string, newNpcId: string): Memory | null {
    const original = this.accessMemory(memoryId);
    if (!original || original.isSecret || !original.isSharable) return null;

    // Create a degraded copy for the new NPC
    const rumor = this.createMemory({
      content: original.content,
      type: 'heard',
      source: 'rumor',
      reliability: this.degradeReliability(original.reliability),
      emotionalIntensity: Math.max(20, original.emotionalIntensity - 20),
      sentiment: original.sentiment,
      entities: [...original.entities, newNpcId],
      location: original.location,
    });

    return rumor;
  }

  private degradeReliability(current: MemoryReliability): MemoryReliability {
    const order: MemoryReliability[] = ['certain', 'probable', 'uncertain', 'distorted'];
    const currentIndex = order.indexOf(current);
    return order[Math.min(order.length - 1, currentIndex + 1)];
  }

  buildContextForAI(maxMemories: number = 20): string {
    const salient = this.getSalientMemories(maxMemories);
    
    if (salient.length === 0) {
      return 'No significant memories.';
    }

    const lines = salient.map(m => {
      const reliability = m.reliability !== 'certain' ? ` (${m.reliability})` : '';
      const traumatic = m.isTraumatic ? ' [TRAUMATIC]' : '';
      return `- [${m.type}${reliability}${traumatic}] ${m.content}`;
    });

    return `Key Memories:\n${lines.join('\n')}`;
  }

  getStats(): { shortTerm: number; mediumTerm: number; longTerm: number; total: number } {
    return {
      shortTerm: this.shortTerm.memories.size,
      mediumTerm: this.mediumTerm.memories.size,
      longTerm: this.longTerm.memories.size,
      total: this.shortTerm.memories.size + this.mediumTerm.memories.size + this.longTerm.memories.size,
    };
  }

  serialize(): Record<string, any> {
    return {
      shortTerm: Object.fromEntries(this.shortTerm.memories),
      mediumTerm: Object.fromEntries(this.mediumTerm.memories),
      longTerm: Object.fromEntries(this.longTerm.memories),
      lastTickTime: this.lastTickTime,
    };
  }

  deserialize(data: Record<string, any>): void {
    this.shortTerm.memories = new Map(Object.entries(data.shortTerm || {}));
    this.mediumTerm.memories = new Map(Object.entries(data.mediumTerm || {}));
    this.longTerm.memories = new Map(Object.entries(data.longTerm || {}));
    this.lastTickTime = data.lastTickTime || Date.now();
  }

  clear(): void {
    this.shortTerm.memories.clear();
    this.mediumTerm.memories.clear();
    this.longTerm.memories.clear();
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Campaign Memory System', () => {
  let system: CampaignMemorySystem;

  beforeEach(() => {
    system = new CampaignMemorySystem();
  });

  describe('createMemory', () => {
    it('should create a memory with default values', () => {
      const memory = system.createMemory({
        content: 'Saw the king enter the castle',
        type: 'witnessed',
      });

      expect(memory.content).toBe('Saw the king enter the castle');
      expect(memory.type).toBe('witnessed');
      expect(memory.source).toBe('firsthand');
      expect(memory.reliability).toBe('certain');
      expect(memory.accessCount).toBe(0);
    });

    it('should store in short-term by default', () => {
      system.createMemory({
        content: 'A normal event',
        type: 'experienced',
      });

      const stats = system.getStats();
      expect(stats.shortTerm).toBe(1);
      expect(stats.mediumTerm).toBe(0);
      expect(stats.longTerm).toBe(0);
    });

    it('should store traumatic memories directly in long-term', () => {
      system.createMemory({
        content: 'Witnessed a murder',
        type: 'witnessed',
        isTraumatic: true,
        emotionalIntensity: 95,
      });

      const stats = system.getStats();
      expect(stats.shortTerm).toBe(0);
      expect(stats.longTerm).toBe(1);
    });

    it('should assign entities and location', () => {
      const memory = system.createMemory({
        content: 'Met the merchant',
        type: 'experienced',
        entities: ['npc_merchant_1'],
        location: 'market_square',
      });

      expect(memory.entities).toContain('npc_merchant_1');
      expect(memory.location).toBe('market_square');
    });
  });

  describe('accessMemory', () => {
    it('should increment access count', () => {
      const memory = system.createMemory({
        content: 'Test memory',
        type: 'experienced',
      });

      system.accessMemory(memory.id);
      system.accessMemory(memory.id);

      const accessed = system.accessMemory(memory.id);
      expect(accessed?.accessCount).toBe(3);
    });

    it('should increase salience on access', () => {
      const memory = system.createMemory({
        content: 'Test memory',
        type: 'experienced',
        emotionalIntensity: 30,
      });

      const initialSalience = memory.salience;
      system.accessMemory(memory.id);

      expect(memory.salience).toBeGreaterThan(initialSalience);
    });

    it('should return null for non-existent memory', () => {
      const result = system.accessMemory('nonexistent_id');
      expect(result).toBeNull();
    });
  });

  describe('memory promotion', () => {
    it('should promote high-intensity memories to medium-term', () => {
      const memory = system.createMemory({
        content: 'Intense experience',
        type: 'experienced',
        emotionalIntensity: 75,
      });

      system.accessMemory(memory.id);

      const stats = system.getStats();
      expect(stats.shortTerm).toBe(0);
      expect(stats.mediumTerm).toBe(1);
    });

    it('should promote frequently accessed memories', () => {
      const memory = system.createMemory({
        content: 'Frequently recalled',
        type: 'experienced',
        emotionalIntensity: 40,
      });

      system.accessMemory(memory.id);
      system.accessMemory(memory.id);
      system.accessMemory(memory.id); // 3rd access triggers promotion

      const stats = system.getStats();
      expect(stats.shortTerm).toBe(0);
      expect(stats.mediumTerm).toBe(1);
    });

    it('should promote from medium to long-term with high access', () => {
      const memory = system.createMemory({
        content: 'Very important',
        type: 'experienced',
        emotionalIntensity: 75,
      });

      // Access to promote to medium-term
      system.accessMemory(memory.id);
      
      // Access more to promote to long-term
      for (let i = 0; i < 5; i++) {
        system.accessMemory(memory.id);
      }

      const stats = system.getStats();
      expect(stats.longTerm).toBe(1);
    });
  });

  describe('capacity enforcement', () => {
    it('should remove lowest salience memory when over capacity', () => {
      // Fill up short-term (capacity 20)
      for (let i = 0; i < 22; i++) {
        system.createMemory({
          content: `Memory ${i}`,
          type: 'experienced',
          emotionalIntensity: i * 4, // Varying salience
        });
      }

      const stats = system.getStats();
      expect(stats.shortTerm).toBeLessThanOrEqual(20);
    });

    it('should not remove traumatic memories during capacity enforcement', () => {
      system.createMemory({
        content: 'Traumatic event',
        type: 'witnessed',
        isTraumatic: true,
      });

      // Add many more memories
      for (let i = 0; i < 25; i++) {
        system.createMemory({
          content: `Regular memory ${i}`,
          type: 'experienced',
        });
      }

      const traumatic = system.getTraumaticMemories();
      expect(traumatic).toHaveLength(1);
    });
  });

  describe('decay processing', () => {
    it('should reduce salience over time', () => {
      const memory = system.createMemory({
        content: 'Decaying memory',
        type: 'experienced',
        emotionalIntensity: 50,
      });

      const initialSalience = memory.salience;
      system.processDecay(1); // 1 hour

      expect(memory.salience).toBeLessThan(initialSalience);
    });

    it('should remove fully decayed memories', () => {
      system.createMemory({
        content: 'Will decay',
        type: 'experienced',
        emotionalIntensity: 10, // Low salience
      });

      const decayed = system.processDecay(10); // 10 hours - should fully decay

      expect(decayed).toBe(1);
      expect(system.getStats().total).toBe(0);
    });

    it('should not decay traumatic memories', () => {
      system.createMemory({
        content: 'Permanent trauma',
        type: 'witnessed',
        isTraumatic: true,
        emotionalIntensity: 90,
      });

      system.processDecay(100); // Long time

      expect(system.getTraumaticMemories()).toHaveLength(1);
    });
  });

  describe('memory queries', () => {
    beforeEach(() => {
      system.createMemory({
        content: 'Met the blacksmith',
        type: 'experienced',
        entities: ['npc_blacksmith'],
        emotionalIntensity: 40,
      });
      system.createMemory({
        content: 'Traded with blacksmith',
        type: 'experienced',
        entities: ['npc_blacksmith'],
        emotionalIntensity: 30,
      });
      system.createMemory({
        content: 'Met the wizard',
        type: 'experienced',
        entities: ['npc_wizard'],
        emotionalIntensity: 60,
      });
    });

    it('should get memories for specific NPC', () => {
      const memories = system.getMemoriesForNPC('npc_blacksmith');
      expect(memories).toHaveLength(2);
      expect(memories.every(m => m.entities.includes('npc_blacksmith'))).toBe(true);
    });

    it('should get most salient memories', () => {
      const salient = system.getSalientMemories(2);
      expect(salient).toHaveLength(2);
      expect(salient[0].emotionalIntensity).toBeGreaterThanOrEqual(salient[1].emotionalIntensity);
    });

    it('should get recent memories', () => {
      const recent = system.getRecentMemories(10);
      expect(recent.length).toBeGreaterThan(0);
    });
  });

  describe('rumor spreading', () => {
    it('should create degraded copy when spreading as rumor', () => {
      const original = system.createMemory({
        content: 'The king is planning war',
        type: 'witnessed',
        reliability: 'certain',
        emotionalIntensity: 70,
        entities: ['npc_spy'],
      });

      const rumor = system.spreadAsRumor(original.id, 'npc_gossiper');

      expect(rumor).not.toBeNull();
      expect(rumor?.type).toBe('heard');
      expect(rumor?.source).toBe('rumor');
      expect(rumor?.reliability).toBe('probable'); // Degraded from certain
      expect(rumor?.entities).toContain('npc_gossiper');
    });

    it('should not spread secret memories', () => {
      const secret = system.createMemory({
        content: 'Secret plan',
        type: 'experienced',
        isSecret: true,
      });

      const rumor = system.spreadAsRumor(secret.id, 'npc_other');
      expect(rumor).toBeNull();
    });

    it('should not spread non-sharable memories', () => {
      const private_ = system.createMemory({
        content: 'Private thought',
        type: 'felt',
        isSharable: false,
      });

      const rumor = system.spreadAsRumor(private_.id, 'npc_other');
      expect(rumor).toBeNull();
    });
  });

  describe('AI context building', () => {
    it('should build context string', () => {
      system.createMemory({
        content: 'Important event happened',
        type: 'witnessed',
        emotionalIntensity: 80,
      });
      system.createMemory({
        content: 'Traumatic experience',
        type: 'experienced',
        isTraumatic: true,
      });

      const context = system.buildContextForAI();

      expect(context).toContain('Key Memories:');
      expect(context).toContain('[witnessed]');
      expect(context).toContain('[TRAUMATIC]');
    });

    it('should include reliability markers for uncertain memories', () => {
      system.createMemory({
        content: 'Heard a rumor',
        type: 'heard',
        reliability: 'uncertain',
        emotionalIntensity: 60,
      });

      const context = system.buildContextForAI();
      expect(context).toContain('(uncertain)');
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize all tiers', () => {
      system.createMemory({
        content: 'Short-term memory',
        type: 'experienced',
      });
      system.createMemory({
        content: 'Traumatic memory',
        type: 'witnessed',
        isTraumatic: true,
      });

      const serialized = system.serialize();
      
      const newSystem = new CampaignMemorySystem();
      newSystem.deserialize(serialized);

      const stats = newSystem.getStats();
      expect(stats.shortTerm).toBe(1);
      expect(stats.longTerm).toBe(1);
    });
  });

  describe('memory types', () => {
    it('should correctly categorize memory types', () => {
      const witnessed = system.createMemory({ content: 'Saw it', type: 'witnessed' });
      const experienced = system.createMemory({ content: 'Did it', type: 'experienced' });
      const heard = system.createMemory({ content: 'Heard about it', type: 'heard' });
      const caused = system.createMemory({ content: 'Made it happen', type: 'caused' });
      const felt = system.createMemory({ content: 'Felt something', type: 'felt' });

      expect(witnessed.type).toBe('witnessed');
      expect(experienced.type).toBe('experienced');
      expect(heard.type).toBe('heard');
      expect(caused.type).toBe('caused');
      expect(felt.type).toBe('felt');
    });
  });
});
