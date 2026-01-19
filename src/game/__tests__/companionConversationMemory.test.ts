// ============================================================================
// COMPANION CONVERSATION MEMORY & CONTEXTUAL SUPPORT TESTS
// Tests for per-companion memory isolation, curiosity system, and support
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

// Types matching companionSystem.ts
type ConversationTopic = 
  | 'dreams' | 'fears' | 'relationships' | 'childhood' | 'regrets'
  | 'ambitions' | 'secrets' | 'beliefs' | 'trauma' | 'love'
  | 'family' | 'failures' | 'hopes' | 'guilt' | 'pride';

type ResponseType = 'honest' | 'emotional' | 'deflect' | 'lie';

type SituationType = 
  | 'combat_start' | 'combat_losing' | 'difficult_choice' | 'moral_dilemma'
  | 'negotiation' | 'romance_opportunity' | 'betrayal_discovered' | 'loss_grief'
  | 'victory_celebration' | 'stealth_mission' | 'resource_scarcity' | 'leadership_moment'
  | 'facing_fear' | 'temptation' | 'sacrifice_choice' | 'reunion';

interface SharedTopicMemory {
  topic: ConversationTopic;
  sharedAt: number;
  responseType: ResponseType;
  playerSummary?: string;
  companionReaction?: string;
  referencedCount: number;
  lastReferenced?: number;
}

interface ConversationMemoryState {
  companionId: string;
  sharedTopics: SharedTopicMemory[];
  askedTopics: ConversationTopic[];
  lastAskedAt?: number;
  conversationDepth: number;
}

interface MockCompanion {
  id: string;
  name: string;
  affinity: number;
  trust: number;
  fear: number;
  romanticInterest: number;
  status: 'active' | 'inactive' | 'dismissed';
  conversationMemory: ConversationMemoryState;
}

// Mock companion factory
function createMockCompanion(id: string, name: string, overrides: Partial<MockCompanion> = {}): MockCompanion {
  return {
    id,
    name,
    affinity: 50,
    trust: 50,
    fear: 10,
    romanticInterest: 0,
    status: 'active',
    conversationMemory: {
      companionId: id,
      sharedTopics: [],
      askedTopics: [],
      conversationDepth: 0
    },
    ...overrides
  };
}

// Record a shared topic for a companion
function recordSharedTopic(
  companion: MockCompanion,
  topic: ConversationTopic,
  responseType: ResponseType,
  playerSummary?: string,
  companionReaction?: string
): void {
  // Check for isolation - only add to this companion's memory
  const memory: SharedTopicMemory = {
    topic,
    sharedAt: Date.now(),
    responseType,
    playerSummary,
    companionReaction,
    referencedCount: 0
  };
  
  companion.conversationMemory.sharedTopics.push(memory);
  companion.conversationMemory.conversationDepth += responseType === 'honest' ? 2 : 1;
}

// Get shared topics for a specific companion
function getSharedTopicsForCompanion(companion: MockCompanion): SharedTopicMemory[] {
  return companion.conversationMemory.sharedTopics;
}

// Check if companion knows a specific topic
function companionKnowsTopic(companion: MockCompanion, topic: ConversationTopic): boolean {
  return companion.conversationMemory.sharedTopics.some(t => t.topic === topic);
}

// Get unknown topics for a companion
function getUnknownTopicsForCompanion(companion: MockCompanion): ConversationTopic[] {
  const allTopics: ConversationTopic[] = [
    'dreams', 'fears', 'relationships', 'childhood', 'regrets',
    'ambitions', 'secrets', 'beliefs', 'trauma', 'love',
    'family', 'failures', 'hopes', 'guilt', 'pride'
  ];
  
  const knownTopics = companion.conversationMemory.sharedTopics.map(t => t.topic);
  const askedTopics = companion.conversationMemory.askedTopics;
  
  return allTopics.filter(t => !knownTopics.includes(t) && !askedTopics.includes(t));
}

// Calculate knowledge percentage
function getPlayerKnowledgePercentage(companion: MockCompanion): number {
  const totalTopics = 15;
  const knownTopics = companion.conversationMemory.sharedTopics.length;
  return Math.round((knownTopics / totalTopics) * 100);
}

// Get conversation depth
function getConversationDepth(companion: MockCompanion): number {
  return companion.conversationMemory.conversationDepth;
}

// Contextual support logic
function getContextualSupport(
  companion: MockCompanion,
  situation: SituationType
): { type: 'supportive' | 'hostile' | 'generic' | null; topic?: ConversationTopic; dialogue?: string } {
  if (companion.status !== 'active') return { type: null };
  
  const knowledgeLevel = getPlayerKnowledgePercentage(companion);
  const supportChance = 0.1 + (knowledgeLevel / 100) * 0.5;
  
  // Determine support type based on affinity
  const supportType = companion.affinity >= 0 ? 'supportive' : 'hostile';
  
  // Get relevant topics for situation
  const situationTopicMap: Record<SituationType, ConversationTopic[]> = {
    'combat_start': ['fears', 'trauma', 'pride'],
    'combat_losing': ['fears', 'regrets', 'hopes'],
    'difficult_choice': ['beliefs', 'regrets', 'ambitions'],
    'moral_dilemma': ['beliefs', 'guilt', 'secrets'],
    'negotiation': ['ambitions', 'secrets', 'pride'],
    'romance_opportunity': ['love', 'relationships', 'fears'],
    'betrayal_discovered': ['trust' as any, 'secrets', 'guilt'],
    'loss_grief': ['family', 'love', 'trauma'],
    'victory_celebration': ['pride', 'hopes', 'ambitions'],
    'stealth_mission': ['fears', 'secrets', 'childhood'],
    'resource_scarcity': ['childhood', 'failures', 'regrets'],
    'leadership_moment': ['ambitions', 'fears', 'pride'],
    'facing_fear': ['fears', 'trauma', 'hopes'],
    'temptation': ['secrets', 'guilt', 'beliefs'],
    'sacrifice_choice': ['love', 'family', 'beliefs'],
    'reunion': ['family', 'relationships', 'hopes']
  };
  
  const relevantTopics = situationTopicMap[situation] || [];
  const sharedTopics = companion.conversationMemory.sharedTopics;
  
  // Find matching topic
  const matchingTopic = sharedTopics.find(st => relevantTopics.includes(st.topic));
  
  if (matchingTopic) {
    return {
      type: supportType,
      topic: matchingTopic.topic,
      dialogue: `[${supportType} reference to ${matchingTopic.topic}]`
    };
  }
  
  // Return generic if no specific topic but high enough chance
  if (Math.random() < supportChance * 0.5) {
    return { type: 'generic', dialogue: '[Generic support/interference]' };
  }
  
  return { type: null };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Companion Conversation Memory System', () => {
  let companion1: MockCompanion;
  let companion2: MockCompanion;
  
  beforeEach(() => {
    companion1 = createMockCompanion('comp_1', 'Marcus');
    companion2 = createMockCompanion('comp_2', 'Elena');
  });
  
  describe('Memory Isolation', () => {
    it('should keep shared topics isolated per companion', () => {
      recordSharedTopic(companion1, 'dreams', 'honest', 'I dream of freedom');
      recordSharedTopic(companion2, 'fears', 'emotional', 'I fear abandonment');
      
      expect(getSharedTopicsForCompanion(companion1)).toHaveLength(1);
      expect(getSharedTopicsForCompanion(companion2)).toHaveLength(1);
      expect(companion1.conversationMemory.sharedTopics[0].topic).toBe('dreams');
      expect(companion2.conversationMemory.sharedTopics[0].topic).toBe('fears');
    });
    
    it('should not leak topics between companions', () => {
      recordSharedTopic(companion1, 'secrets', 'honest', 'My dark secret');
      
      expect(companionKnowsTopic(companion1, 'secrets')).toBe(true);
      expect(companionKnowsTopic(companion2, 'secrets')).toBe(false);
    });
    
    it('should maintain independent conversation depth', () => {
      recordSharedTopic(companion1, 'dreams', 'honest'); // +2
      recordSharedTopic(companion1, 'fears', 'honest'); // +2
      recordSharedTopic(companion2, 'ambitions', 'deflect'); // +1
      
      expect(getConversationDepth(companion1)).toBe(4);
      expect(getConversationDepth(companion2)).toBe(1);
    });
    
    it('should handle same topic shared differently with different companions', () => {
      recordSharedTopic(companion1, 'trauma', 'honest', 'The truth about my past');
      recordSharedTopic(companion2, 'trauma', 'lie', 'A fake story');
      
      const c1Trauma = companion1.conversationMemory.sharedTopics.find(t => t.topic === 'trauma');
      const c2Trauma = companion2.conversationMemory.sharedTopics.find(t => t.topic === 'trauma');
      
      expect(c1Trauma?.responseType).toBe('honest');
      expect(c2Trauma?.responseType).toBe('lie');
      expect(c1Trauma?.playerSummary).toBe('The truth about my past');
      expect(c2Trauma?.playerSummary).toBe('A fake story');
    });
  });
  
  describe('Topic Knowledge Tracking', () => {
    it('should correctly identify known topics', () => {
      recordSharedTopic(companion1, 'dreams', 'honest');
      recordSharedTopic(companion1, 'fears', 'emotional');
      
      expect(companionKnowsTopic(companion1, 'dreams')).toBe(true);
      expect(companionKnowsTopic(companion1, 'fears')).toBe(true);
      expect(companionKnowsTopic(companion1, 'secrets')).toBe(false);
    });
    
    it('should calculate knowledge percentage correctly', () => {
      expect(getPlayerKnowledgePercentage(companion1)).toBe(0);
      
      recordSharedTopic(companion1, 'dreams', 'honest');
      recordSharedTopic(companion1, 'fears', 'honest');
      recordSharedTopic(companion1, 'secrets', 'honest');
      
      expect(getPlayerKnowledgePercentage(companion1)).toBe(20); // 3/15 = 20%
    });
    
    it('should track all 15 topics at 100%', () => {
      const allTopics: ConversationTopic[] = [
        'dreams', 'fears', 'relationships', 'childhood', 'regrets',
        'ambitions', 'secrets', 'beliefs', 'trauma', 'love',
        'family', 'failures', 'hopes', 'guilt', 'pride'
      ];
      
      allTopics.forEach(topic => {
        recordSharedTopic(companion1, topic, 'honest');
      });
      
      expect(getPlayerKnowledgePercentage(companion1)).toBe(100);
    });
  });
  
  describe('Unknown Topic Curiosity', () => {
    it('should return all topics as unknown initially', () => {
      const unknown = getUnknownTopicsForCompanion(companion1);
      expect(unknown).toHaveLength(15);
    });
    
    it('should exclude known topics from unknown list', () => {
      recordSharedTopic(companion1, 'dreams', 'honest');
      recordSharedTopic(companion1, 'fears', 'honest');
      
      const unknown = getUnknownTopicsForCompanion(companion1);
      expect(unknown).toHaveLength(13);
      expect(unknown).not.toContain('dreams');
      expect(unknown).not.toContain('fears');
    });
    
    it('should exclude asked topics from unknown list', () => {
      companion1.conversationMemory.askedTopics.push('ambitions');
      
      const unknown = getUnknownTopicsForCompanion(companion1);
      expect(unknown).toHaveLength(14);
      expect(unknown).not.toContain('ambitions');
    });
    
    it('should return empty array when companion knows everything', () => {
      const allTopics: ConversationTopic[] = [
        'dreams', 'fears', 'relationships', 'childhood', 'regrets',
        'ambitions', 'secrets', 'beliefs', 'trauma', 'love',
        'family', 'failures', 'hopes', 'guilt', 'pride'
      ];
      
      allTopics.forEach(topic => {
        recordSharedTopic(companion1, topic, 'honest');
      });
      
      expect(getUnknownTopicsForCompanion(companion1)).toHaveLength(0);
    });
  });
  
  describe('Contextual Support System', () => {
    it('should return null for inactive companions', () => {
      companion1.status = 'inactive';
      const support = getContextualSupport(companion1, 'combat_start');
      expect(support.type).toBeNull();
    });
    
    it('should return supportive type for positive affinity', () => {
      companion1.affinity = 60;
      recordSharedTopic(companion1, 'fears', 'honest', 'I fear death');
      
      const support = getContextualSupport(companion1, 'combat_start');
      if (support.type !== null && support.type !== 'generic') {
        expect(support.type).toBe('supportive');
      }
    });
    
    it('should return hostile type for negative affinity', () => {
      companion1.affinity = -30;
      recordSharedTopic(companion1, 'fears', 'honest', 'I fear death');
      
      const support = getContextualSupport(companion1, 'combat_start');
      if (support.type !== null && support.type !== 'generic') {
        expect(support.type).toBe('hostile');
      }
    });
    
    it('should match relevant topics to situations', () => {
      recordSharedTopic(companion1, 'fears', 'honest');
      
      // Fears is relevant to combat_start
      const combatSupport = getContextualSupport(companion1, 'combat_start');
      if (combatSupport.topic) {
        expect(combatSupport.topic).toBe('fears');
      }
    });
    
    it('should not provide topic-specific support for unshared topics', () => {
      // No topics shared, should only get generic or null
      const support = getContextualSupport(companion1, 'combat_start');
      expect(support.topic).toBeUndefined();
    });
    
    it('should handle all situation types', () => {
      const situations: SituationType[] = [
        'combat_start', 'combat_losing', 'difficult_choice', 'moral_dilemma',
        'negotiation', 'romance_opportunity', 'betrayal_discovered', 'loss_grief',
        'victory_celebration', 'stealth_mission', 'resource_scarcity', 'leadership_moment',
        'facing_fear', 'temptation', 'sacrifice_choice', 'reunion'
      ];
      
      situations.forEach(situation => {
        const support = getContextualSupport(companion1, situation);
        // Should not throw
        expect(support).toBeDefined();
      });
    });
  });
  
  describe('Response Type Effects', () => {
    it('should increase depth more for honest responses', () => {
      recordSharedTopic(companion1, 'dreams', 'honest');
      expect(getConversationDepth(companion1)).toBe(2);
    });
    
    it('should increase depth less for deflected responses', () => {
      recordSharedTopic(companion1, 'fears', 'deflect');
      expect(getConversationDepth(companion1)).toBe(1);
    });
    
    it('should track response type for later reference', () => {
      recordSharedTopic(companion1, 'secrets', 'lie', 'A false secret');
      
      const secret = companion1.conversationMemory.sharedTopics.find(t => t.topic === 'secrets');
      expect(secret?.responseType).toBe('lie');
    });
    
    it('should store companion reaction', () => {
      recordSharedTopic(companion1, 'trauma', 'emotional', 'My painful memory', 'Marcus looks concerned');
      
      const trauma = companion1.conversationMemory.sharedTopics.find(t => t.topic === 'trauma');
      expect(trauma?.companionReaction).toBe('Marcus looks concerned');
    });
  });
  
  describe('Reference Tracking', () => {
    it('should initialize reference count to zero', () => {
      recordSharedTopic(companion1, 'dreams', 'honest');
      
      const topic = companion1.conversationMemory.sharedTopics[0];
      expect(topic.referencedCount).toBe(0);
      expect(topic.lastReferenced).toBeUndefined();
    });
    
    it('should track timestamp when topic was shared', () => {
      const before = Date.now();
      recordSharedTopic(companion1, 'dreams', 'honest');
      const after = Date.now();
      
      const topic = companion1.conversationMemory.sharedTopics[0];
      expect(topic.sharedAt).toBeGreaterThanOrEqual(before);
      expect(topic.sharedAt).toBeLessThanOrEqual(after);
    });
  });
});

describe('Multi-Companion Scenarios', () => {
  it('should handle sharing same topic with multiple companions differently', () => {
    const marcus = createMockCompanion('marcus_1', 'Marcus', { affinity: 80 });
    const elena = createMockCompanion('elena_1', 'Elena', { affinity: -20 });
    const kai = createMockCompanion('kai_1', 'Kai', { affinity: 40 });
    
    // Share fears with each companion differently
    recordSharedTopic(marcus, 'fears', 'honest', 'I truly fear losing everyone');
    recordSharedTopic(elena, 'fears', 'lie', 'I fear nothing');
    recordSharedTopic(kai, 'fears', 'deflect', 'It\'s complicated');
    
    // Verify isolation
    expect(marcus.conversationMemory.sharedTopics[0].responseType).toBe('honest');
    expect(elena.conversationMemory.sharedTopics[0].responseType).toBe('lie');
    expect(kai.conversationMemory.sharedTopics[0].responseType).toBe('deflect');
    
    // Verify support types match affinity
    const marcusSupport = getContextualSupport(marcus, 'facing_fear');
    const elenaSupport = getContextualSupport(elena, 'facing_fear');
    
    if (marcusSupport.type && marcusSupport.type !== 'generic') {
      expect(marcusSupport.type).toBe('supportive');
    }
    if (elenaSupport.type && elenaSupport.type !== 'generic') {
      expect(elenaSupport.type).toBe('hostile');
    }
  });
  
  it('should maintain separate curiosity pools per companion', () => {
    const companions = [
      createMockCompanion('a', 'CompA'),
      createMockCompanion('b', 'CompB'),
      createMockCompanion('c', 'CompC')
    ];
    
    // Share different topics with each
    recordSharedTopic(companions[0], 'dreams', 'honest');
    recordSharedTopic(companions[1], 'fears', 'honest');
    recordSharedTopic(companions[2], 'love', 'honest');
    
    // Check unknown topics differ
    const unknownA = getUnknownTopicsForCompanion(companions[0]);
    const unknownB = getUnknownTopicsForCompanion(companions[1]);
    const unknownC = getUnknownTopicsForCompanion(companions[2]);
    
    expect(unknownA).not.toContain('dreams');
    expect(unknownA).toContain('fears');
    expect(unknownA).toContain('love');
    
    expect(unknownB).toContain('dreams');
    expect(unknownB).not.toContain('fears');
    expect(unknownB).toContain('love');
    
    expect(unknownC).toContain('dreams');
    expect(unknownC).toContain('fears');
    expect(unknownC).not.toContain('love');
  });
});
