// Comprehensive Three-Tier NPC Memory System
// Handles short-term, medium-term, and long-term memory with decay, promotion, and triggering

import { NPC, GameState } from '@/types/game';

// ============= MEMORY TYPES =============

export type MemoryType = 'witnessed' | 'experienced' | 'heard' | 'caused' | 'felt';
export type MemorySentiment = 'positive' | 'negative' | 'neutral' | 'complex';
export type MemoryReliability = 'certain' | 'probable' | 'uncertain' | 'distorted';
export type MemorySource = 'firsthand' | 'told_by_trusted' | 'rumor' | 'assumed';
export type MemoryTier = 'short' | 'medium' | 'long';

export interface EnhancedMemory {
  id: string;
  tick: number; // when it happened
  type: MemoryType;
  
  // Content
  summary: string; // what happened
  details: string; // full description
  entities: string[]; // who was involved
  location: string;
  
  // Emotional weight
  emotionalIntensity: number; // 0-100, how impactful
  sentiment: MemorySentiment;
  emotionTags: string[]; // "fear", "joy", "betrayal", "gratitude", etc.
  
  // Reliability
  reliability: MemoryReliability;
  source: MemorySource;
  
  // Memory behavior
  tier: MemoryTier;
  salience: number; // 0-100, how "present" it is in mind (decays)
  accessCount: number; // times recalled
  lastAccessed: number; // tick
  
  // Flags
  traumatic: boolean;
  secret: boolean;
  sharable: boolean;
  triggered: boolean; // currently activated
}

// Impression formed from multiple memories about an entity
export interface ImpressionMemory {
  entityId: string;
  entityName: string;
  overallSentiment: MemorySentiment;
  trustLevel: number; // -100 to 100
  reliability: number; // how consistent is this person
  traits: string[]; // "helpful", "dishonest", "violent"
  basedOnCount: number; // how many memories formed this
  lastUpdated: number;
}

// Pattern detected from repeated events
export interface PatternMemory {
  pattern: string; // "player always lies", "guards patrol at dawn"
  confidence: number; // 0-100
  occurrences: number;
  lastOccurrence: number;
  relatedEntities: string[];
  relatedLocations: string[];
}

// Full memory store for an NPC
export interface NPCMemoryStore {
  shortTerm: EnhancedMemory[]; // capacity: ~20
  mediumTerm: EnhancedMemory[]; // capacity: ~50
  longTerm: EnhancedMemory[]; // capacity: ~100
  impressions: Record<string, ImpressionMemory>;
  patterns: PatternMemory[];
}

// ============= MEMORY CAPACITY LIMITS - Designed for 100k+ turn games =============

const CAPACITY = {
  short: 10,  // Reduced for long-term sustainability
  medium: 25, // Reduced from 40
  long: 50,   // Reduced from 75 - core memories only
};

// Maximum total memories across all NPCs to prevent runaway memory usage
const MAX_TOTAL_NPC_MEMORIES = 300;

// Maximum impressions per NPC (limit character relationships tracked)
const MAX_IMPRESSIONS_PER_NPC = 30;

// Maximum patterns an NPC can track
const MAX_PATTERNS_PER_NPC = 15;

// Decay acceleration factor for very old memories (age in ticks)
const ACCELERATED_DECAY_THRESHOLD = 10000; // ~10k turns
const ACCELERATED_DECAY_MULTIPLIER = 2.0;

// ============= DECAY RATES =============

// Salience decay per hour
const DECAY_RATES = {
  short: 10, // rapid decay
  medium: 0.083, // ~2 per day (2/24 per hour)
  long: 0.006, // ~1 per week (1/168 per hour)
};

// Salience threshold below which memories are forgotten
const FORGET_THRESHOLD = 5;

// Boost to salience when memory is accessed
const ACCESS_BOOST = 15;

// ============= EMOTION TAGS =============

export const EMOTION_TAGS = [
  'fear', 'joy', 'betrayal', 'gratitude', 'anger', 'sadness', 'surprise',
  'disgust', 'trust', 'anticipation', 'shame', 'guilt', 'pride', 'love',
  'jealousy', 'envy', 'relief', 'hope', 'despair', 'humiliation', 'respect'
];

// ============= CORE MEMORY FUNCTIONS =============

/**
 * Initialize an empty memory store for an NPC
 */
export function initializeMemoryStore(): NPCMemoryStore {
  return {
    shortTerm: [],
    mediumTerm: [],
    longTerm: [],
    impressions: {},
    patterns: [],
  };
}

/**
 * Create a new memory and add it to the appropriate tier
 */
export function createMemory(
  memoryStore: NPCMemoryStore,
  event: {
    type: MemoryType;
    summary: string;
    details: string;
    entities: string[];
    location: string;
    emotionalIntensity: number;
    sentiment: MemorySentiment;
    emotionTags: string[];
    source?: MemorySource;
    traumatic?: boolean;
    secret?: boolean;
    sharable?: boolean;
  },
  currentTick: number
): NPCMemoryStore {
  // Determine initial tier based on intensity
  let tier: MemoryTier = 'short';
  if (event.emotionalIntensity >= 80 || event.traumatic) {
    tier = 'long'; // Very intense or traumatic goes straight to long-term
  } else if (event.emotionalIntensity >= 50) {
    tier = 'medium'; // Moderately intense goes to medium-term
  }
  
  const memory: EnhancedMemory = {
    id: `mem_${currentTick}_${Math.random().toString(36).substr(2, 9)}`,
    tick: currentTick,
    type: event.type,
    summary: event.summary,
    details: event.details,
    entities: event.entities,
    location: event.location,
    emotionalIntensity: event.emotionalIntensity,
    sentiment: event.sentiment,
    emotionTags: event.emotionTags,
    reliability: event.source === 'firsthand' ? 'certain' : 
                 event.source === 'told_by_trusted' ? 'probable' :
                 event.source === 'rumor' ? 'uncertain' : 'probable',
    source: event.source || 'firsthand',
    tier,
    salience: event.emotionalIntensity, // Initial salience equals intensity
    accessCount: 0,
    lastAccessed: currentTick,
    traumatic: event.traumatic || false,
    secret: event.secret || false,
    sharable: event.sharable !== false, // Default true
    triggered: false,
  };
  
  const newStore = { ...memoryStore };
  
  // Add to appropriate tier
  if (tier === 'short') {
    newStore.shortTerm = [memory, ...memoryStore.shortTerm];
  } else if (tier === 'medium') {
    newStore.mediumTerm = [memory, ...memoryStore.mediumTerm];
  } else {
    newStore.longTerm = [memory, ...memoryStore.longTerm];
  }
  
  // Handle overflow
  return handleOverflow(newStore);
}

/**
 * Handle memory tier overflow by promoting or forgetting
 */
function handleOverflow(store: NPCMemoryStore): NPCMemoryStore {
  const newStore = { ...store };
  
  // Short-term overflow
  while (newStore.shortTerm.length > CAPACITY.short) {
    // Sort by salience (lowest first)
    const sorted = [...newStore.shortTerm].sort((a, b) => a.salience - b.salience);
    const toRemove = sorted[0];
    
    // If high enough intensity, promote to medium; otherwise forget
    if (toRemove.emotionalIntensity >= 40 || toRemove.accessCount >= 3) {
      newStore.mediumTerm = [{ ...toRemove, tier: 'medium' }, ...newStore.mediumTerm];
    }
    
    newStore.shortTerm = newStore.shortTerm.filter(m => m.id !== toRemove.id);
  }
  
  // Medium-term overflow
  while (newStore.mediumTerm.length > CAPACITY.medium) {
    const sorted = [...newStore.mediumTerm].sort((a, b) => a.salience - b.salience);
    const toRemove = sorted[0];
    
    // If high enough intensity or frequently accessed, promote to long-term
    if (toRemove.emotionalIntensity >= 60 || toRemove.accessCount >= 5 || toRemove.traumatic) {
      newStore.longTerm = [{ ...toRemove, tier: 'long' }, ...newStore.longTerm];
    }
    
    newStore.mediumTerm = newStore.mediumTerm.filter(m => m.id !== toRemove.id);
  }
  
  // Long-term overflow (rare, only forget truly forgotten memories)
  while (newStore.longTerm.length > CAPACITY.long) {
    const sorted = [...newStore.longTerm]
      .filter(m => !m.traumatic) // Never forget traumatic memories
      .sort((a, b) => a.salience - b.salience);
    
    if (sorted.length === 0) break; // All memories are traumatic
    
    newStore.longTerm = newStore.longTerm.filter(m => m.id !== sorted[0].id);
  }
  
  return newStore;
}

/**
 * Recall relevant memories based on context
 */
export function recallMemories(
  memoryStore: NPCMemoryStore,
  context: {
    entities?: string[];
    location?: string;
    emotionTags?: string[];
    keywords?: string[];
  },
  limit: number = 5,
  currentTick: number
): { memories: EnhancedMemory[]; store: NPCMemoryStore } {
  const allMemories = [
    ...memoryStore.shortTerm,
    ...memoryStore.mediumTerm,
    ...memoryStore.longTerm,
  ];
  
  // Score each memory by relevance
  const scored = allMemories.map(memory => {
    let relevance = 0;
    
    // Entity match (highest weight)
    if (context.entities) {
      const entityMatch = memory.entities.filter(e => 
        context.entities!.some(ce => e.toLowerCase().includes(ce.toLowerCase()) || 
                                     ce.toLowerCase().includes(e.toLowerCase()))
      ).length;
      relevance += entityMatch * 30;
    }
    
    // Location match
    if (context.location && memory.location.toLowerCase().includes(context.location.toLowerCase())) {
      relevance += 20;
    }
    
    // Emotion tag match
    if (context.emotionTags) {
      const emotionMatch = memory.emotionTags.filter(e => context.emotionTags!.includes(e)).length;
      relevance += emotionMatch * 15;
    }
    
    // Keyword match in summary/details
    if (context.keywords) {
      const text = `${memory.summary} ${memory.details}`.toLowerCase();
      const keywordMatch = context.keywords.filter(k => text.includes(k.toLowerCase())).length;
      relevance += keywordMatch * 10;
    }
    
    // Weight by salience
    relevance *= (memory.salience / 100);
    
    // Recency bonus
    const ticksAgo = currentTick - memory.lastAccessed;
    const recencyBonus = Math.max(0, 20 - ticksAgo * 0.1);
    relevance += recencyBonus;
    
    // Traumatic memories are always relevant when triggered
    if (memory.traumatic && memory.triggered) {
      relevance += 50;
    }
    
    return { memory, relevance };
  });
  
  // Sort by relevance and take top N
  const topMemories = scored
    .filter(s => s.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(s => s.memory);
  
  // Boost salience of recalled memories
  const updatedStore = boostAccessedMemories(memoryStore, topMemories.map(m => m.id), currentTick);
  
  return { memories: topMemories, store: updatedStore };
}

/**
 * Boost salience when memories are accessed
 */
function boostAccessedMemories(
  store: NPCMemoryStore,
  memoryIds: string[],
  currentTick: number
): NPCMemoryStore {
  const updateMemory = (m: EnhancedMemory): EnhancedMemory => {
    if (!memoryIds.includes(m.id)) return m;
    return {
      ...m,
      salience: Math.min(100, m.salience + ACCESS_BOOST),
      accessCount: m.accessCount + 1,
      lastAccessed: currentTick,
    };
  };
  
  return {
    ...store,
    shortTerm: store.shortTerm.map(updateMemory),
    mediumTerm: store.mediumTerm.map(updateMemory),
    longTerm: store.longTerm.map(updateMemory),
  };
}

/**
 * Decay memories over time - called each game tick
 * Enhanced for 100k+ turn games with accelerated decay for very old memories
 */
export function decayMemories(
  memoryStore: NPCMemoryStore,
  hoursElapsed: number = 1,
  currentTick: number = Date.now()
): NPCMemoryStore {
  const decayAndFilter = (memories: EnhancedMemory[], tier: MemoryTier): EnhancedMemory[] => {
    return memories
      .map(m => {
        // Traumatic memories don't decay
        if (m.traumatic) return m;
        
        // Frequently accessed memories decay slower
        const accessModifier = Math.max(0.5, 1 - (m.accessCount * 0.1));
        
        // Accelerate decay for very old memories (100k+ turn sustainability)
        const age = currentTick - m.tick;
        const ageMultiplier = age > ACCELERATED_DECAY_THRESHOLD 
          ? ACCELERATED_DECAY_MULTIPLIER 
          : 1.0;
        
        const decay = DECAY_RATES[tier] * hoursElapsed * accessModifier * ageMultiplier;
        const newSalience = Math.max(0, m.salience - decay);
        
        return { ...m, salience: newSalience };
      })
      .filter(m => m.salience > FORGET_THRESHOLD || m.traumatic);
  };
  
  // Prune impressions if over limit
  let prunedImpressions = memoryStore.impressions;
  const impressionKeys = Object.keys(prunedImpressions);
  if (impressionKeys.length > MAX_IMPRESSIONS_PER_NPC) {
    // Keep impressions with highest trust levels or most recent
    const sorted = impressionKeys
      .map(k => ({ key: k, imp: prunedImpressions[k] }))
      .sort((a, b) => Math.abs(b.imp.trustLevel) - Math.abs(a.imp.trustLevel));
    
    prunedImpressions = {};
    for (const { key, imp } of sorted.slice(0, MAX_IMPRESSIONS_PER_NPC)) {
      prunedImpressions[key] = imp;
    }
  }
  
  // Prune patterns if over limit
  let prunedPatterns = memoryStore.patterns;
  if (prunedPatterns.length > MAX_PATTERNS_PER_NPC) {
    prunedPatterns = [...prunedPatterns]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_PATTERNS_PER_NPC);
  }
  
  return {
    ...memoryStore,
    shortTerm: decayAndFilter(memoryStore.shortTerm, 'short'),
    mediumTerm: decayAndFilter(memoryStore.mediumTerm, 'medium'),
    longTerm: decayAndFilter(memoryStore.longTerm, 'long'),
    impressions: prunedImpressions,
    patterns: prunedPatterns,
  };
}

/**
 * Promote a memory to a higher tier
 */
export function promoteMemory(
  memoryStore: NPCMemoryStore,
  memoryId: string
): NPCMemoryStore {
  const newStore = { ...memoryStore };
  
  // Check short-term
  const shortIdx = newStore.shortTerm.findIndex(m => m.id === memoryId);
  if (shortIdx >= 0) {
    const memory = { ...newStore.shortTerm[shortIdx], tier: 'medium' as MemoryTier };
    newStore.shortTerm = newStore.shortTerm.filter(m => m.id !== memoryId);
    newStore.mediumTerm = [memory, ...newStore.mediumTerm];
    return handleOverflow(newStore);
  }
  
  // Check medium-term
  const medIdx = newStore.mediumTerm.findIndex(m => m.id === memoryId);
  if (medIdx >= 0) {
    const memory = { ...newStore.mediumTerm[medIdx], tier: 'long' as MemoryTier };
    newStore.mediumTerm = newStore.mediumTerm.filter(m => m.id !== memoryId);
    newStore.longTerm = [memory, ...newStore.longTerm];
    return handleOverflow(newStore);
  }
  
  return newStore;
}

/**
 * Distort a memory over time (reliability decreases, details shift)
 */
export function distortMemory(memory: EnhancedMemory): EnhancedMemory {
  // Chance of distortion based on age and tier
  if (Math.random() > 0.1) return memory; // 10% chance per call
  
  const reliabilityOrder: MemoryReliability[] = ['certain', 'probable', 'uncertain', 'distorted'];
  const currentIdx = reliabilityOrder.indexOf(memory.reliability);
  
  return {
    ...memory,
    reliability: reliabilityOrder[Math.min(currentIdx + 1, reliabilityOrder.length - 1)],
    // Emotional intensity may drift
    emotionalIntensity: Math.max(10, Math.min(100, 
      memory.emotionalIntensity + (Math.random() > 0.5 ? 5 : -5)
    )),
  };
}

/**
 * Trigger memories based on a stimulus
 */
export function triggerMemory(
  memoryStore: NPCMemoryStore,
  stimulus: {
    entities?: string[];
    location?: string;
    emotionTags?: string[];
    keywords?: string[];
  },
  currentTick: number
): {
  triggeredMemories: EnhancedMemory[];
  store: NPCMemoryStore;
  traumaTriggered: boolean;
  moodEffect: number; // -100 to 100
} {
  const allMemories = [
    ...memoryStore.shortTerm,
    ...memoryStore.mediumTerm,
    ...memoryStore.longTerm,
  ];
  
  const triggeredMemories: EnhancedMemory[] = [];
  let traumaTriggered = false;
  let moodEffect = 0;
  
  allMemories.forEach(memory => {
    let triggered = false;
    
    // Check entity match
    if (stimulus.entities) {
      triggered = triggered || memory.entities.some(e => 
        stimulus.entities!.some(se => 
          e.toLowerCase().includes(se.toLowerCase()) ||
          se.toLowerCase().includes(e.toLowerCase())
        )
      );
    }
    
    // Check location match
    if (stimulus.location) {
      triggered = triggered || memory.location.toLowerCase().includes(stimulus.location.toLowerCase());
    }
    
    // Check emotion tags
    if (stimulus.emotionTags) {
      triggered = triggered || memory.emotionTags.some(e => stimulus.emotionTags!.includes(e));
    }
    
    // Check keywords
    if (stimulus.keywords) {
      const text = `${memory.summary} ${memory.details}`.toLowerCase();
      triggered = triggered || stimulus.keywords.some(k => text.includes(k.toLowerCase()));
    }
    
    if (triggered) {
      triggeredMemories.push({ ...memory, triggered: true });
      
      if (memory.traumatic) {
        traumaTriggered = true;
        moodEffect -= 30; // Trauma causes significant mood drop
      } else if (memory.sentiment === 'positive') {
        moodEffect += Math.floor(memory.emotionalIntensity / 10);
      } else if (memory.sentiment === 'negative') {
        moodEffect -= Math.floor(memory.emotionalIntensity / 10);
      }
    }
  });
  
  // Update triggered status in store
  const updateTriggered = (m: EnhancedMemory): EnhancedMemory => {
    const isTriggered = triggeredMemories.some(tm => tm.id === m.id);
    return { ...m, triggered: isTriggered };
  };
  
  const updatedStore: NPCMemoryStore = {
    ...memoryStore,
    shortTerm: memoryStore.shortTerm.map(updateTriggered),
    mediumTerm: memoryStore.mediumTerm.map(updateTriggered),
    longTerm: memoryStore.longTerm.map(updateTriggered),
  };
  
  return {
    triggeredMemories,
    store: updatedStore,
    traumaTriggered,
    moodEffect: Math.max(-100, Math.min(100, moodEffect)),
  };
}

// ============= IMPRESSION SYSTEM =============

/**
 * Update or create an impression about an entity based on a memory
 */
export function updateImpression(
  store: NPCMemoryStore,
  entityId: string,
  entityName: string,
  memory: EnhancedMemory,
  currentTick: number
): NPCMemoryStore {
  const existing = store.impressions[entityId];
  
  // Calculate trust change based on memory sentiment and intensity
  const trustDelta = memory.sentiment === 'positive' ? memory.emotionalIntensity / 5 :
                     memory.sentiment === 'negative' ? -memory.emotionalIntensity / 5 : 0;
  
  // Extract traits from emotion tags
  const traitMap: Record<string, string[]> = {
    'gratitude': ['helpful', 'kind'],
    'betrayal': ['dishonest', 'untrustworthy'],
    'fear': ['dangerous', 'threatening'],
    'trust': ['reliable', 'trustworthy'],
    'anger': ['frustrating', 'annoying'],
    'respect': ['respectable', 'admirable'],
    'humiliation': ['cruel', 'mean'],
  };
  
  const newTraits = memory.emotionTags.flatMap(tag => traitMap[tag] || []);
  
  if (existing) {
    // Update existing impression
    const combinedTraits = [...new Set([...existing.traits, ...newTraits])].slice(0, 10);
    return {
      ...store,
      impressions: {
        ...store.impressions,
        [entityId]: {
          ...existing,
          trustLevel: Math.max(-100, Math.min(100, existing.trustLevel + trustDelta)),
          traits: combinedTraits,
          basedOnCount: existing.basedOnCount + 1,
          lastUpdated: currentTick,
          overallSentiment: calculateOverallSentiment(existing.trustLevel + trustDelta),
        },
      },
    };
  } else {
    // Create new impression
    return {
      ...store,
      impressions: {
        ...store.impressions,
        [entityId]: {
          entityId,
          entityName,
          overallSentiment: memory.sentiment === 'complex' ? 'neutral' : memory.sentiment,
          trustLevel: trustDelta,
          reliability: 50, // Unknown initially
          traits: newTraits,
          basedOnCount: 1,
          lastUpdated: currentTick,
        },
      },
    };
  }
}

function calculateOverallSentiment(trustLevel: number): MemorySentiment {
  if (trustLevel > 30) return 'positive';
  if (trustLevel < -30) return 'negative';
  return 'neutral';
}

// ============= PATTERN DETECTION =============

/**
 * Check for and update patterns in NPC behavior observations
 */
export function detectPattern(
  store: NPCMemoryStore,
  event: {
    pattern: string;
    entities: string[];
    locations: string[];
  },
  currentTick: number
): NPCMemoryStore {
  const existingPattern = store.patterns.find(p => p.pattern === event.pattern);
  
  if (existingPattern) {
    return {
      ...store,
      patterns: store.patterns.map(p => 
        p.pattern === event.pattern
          ? {
              ...p,
              confidence: Math.min(100, p.confidence + 10),
              occurrences: p.occurrences + 1,
              lastOccurrence: currentTick,
            }
          : p
      ),
    };
  } else {
    return {
      ...store,
      patterns: [
        ...store.patterns,
        {
          pattern: event.pattern,
          confidence: 30,
          occurrences: 1,
          lastOccurrence: currentTick,
          relatedEntities: event.entities,
          relatedLocations: event.locations,
        },
      ],
    };
  }
}

// ============= MEMORY SHARING (GOSSIP) =============

/**
 * Share a memory from one NPC to another (gossip)
 */
export function shareMemory(
  sourceMemory: EnhancedMemory,
  targetStore: NPCMemoryStore,
  sourceNpcName: string,
  currentTick: number
): NPCMemoryStore {
  // Can't share secrets or non-sharable memories
  if (sourceMemory.secret || !sourceMemory.sharable) {
    return targetStore;
  }
  
  // Reliability drops when passed on
  const reliabilityOrder: MemoryReliability[] = ['certain', 'probable', 'uncertain', 'distorted'];
  const currentIdx = reliabilityOrder.indexOf(sourceMemory.reliability);
  const newReliability = reliabilityOrder[Math.min(currentIdx + 1, reliabilityOrder.length - 1)];
  
  // Convert to "heard" type with reduced intensity
  const sharedMemory = {
    type: 'heard' as MemoryType,
    summary: `${sourceNpcName} told me: ${sourceMemory.summary}`,
    details: sourceMemory.details,
    entities: sourceMemory.entities,
    location: sourceMemory.location,
    emotionalIntensity: Math.floor(sourceMemory.emotionalIntensity * 0.7), // Reduced impact
    sentiment: sourceMemory.sentiment,
    emotionTags: sourceMemory.emotionTags,
    source: 'rumor' as MemorySource,
    sharable: true,
    secret: false,
    traumatic: false, // Heard trauma isn't personal trauma
  };
  
  return createMemory(targetStore, sharedMemory, currentTick);
}

/**
 * Process NPC-to-NPC gossip when NPCs are at the same location
 * Returns updated memory stores for all NPCs involved
 */
export function processNPCGossip(
  npcMemories: Record<string, NPCMemoryStore>,
  npcsAtLocation: Array<{ id: string; name: string }>,
  currentTick: number,
  gossipChance: number = 0.3
): Record<string, NPCMemoryStore> {
  // Need at least 2 NPCs to gossip
  if (npcsAtLocation.length < 2) return npcMemories;
  
  const updatedMemories = { ...npcMemories };
  
  // Each pair of NPCs has a chance to gossip
  for (let i = 0; i < npcsAtLocation.length; i++) {
    for (let j = i + 1; j < npcsAtLocation.length; j++) {
      if (Math.random() > gossipChance) continue;
      
      const npc1 = npcsAtLocation[i];
      const npc2 = npcsAtLocation[j];
      
      const store1 = updatedMemories[npc1.id] || initializeMemoryStore();
      const store2 = updatedMemories[npc2.id] || initializeMemoryStore();
      
      // Find shareable memories about the player
      const sharableFromNpc1 = [...store1.shortTerm, ...store1.mediumTerm, ...store1.longTerm]
        .filter(m => m.sharable && !m.secret && m.entities.includes('player'))
        .sort((a, b) => b.emotionalIntensity - a.emotionalIntensity);
      
      const sharableFromNpc2 = [...store2.shortTerm, ...store2.mediumTerm, ...store2.longTerm]
        .filter(m => m.sharable && !m.secret && m.entities.includes('player'))
        .sort((a, b) => b.emotionalIntensity - a.emotionalIntensity);
      
      // Share top memory from each
      if (sharableFromNpc1.length > 0) {
        updatedMemories[npc2.id] = shareMemory(sharableFromNpc1[0], store2, npc1.name, currentTick);
      }
      
      if (sharableFromNpc2.length > 0) {
        updatedMemories[npc1.id] = shareMemory(sharableFromNpc2[0], store1, npc2.name, currentTick);
      }
    }
  }
  
  return updatedMemories;
}

/**
 * Get gossip events for display to the player
 */
export function generateGossipEvents(
  npcMemories: Record<string, NPCMemoryStore>,
  npcsAtLocation: Array<{ id: string; name: string }>,
  currentTick: number
): Array<{ npc1: string; npc2: string; topic: string }> {
  const gossipEvents: Array<{ npc1: string; npc2: string; topic: string }> = [];
  
  if (npcsAtLocation.length < 2) return gossipEvents;
  
  for (let i = 0; i < npcsAtLocation.length; i++) {
    for (let j = i + 1; j < npcsAtLocation.length; j++) {
      if (Math.random() > 0.15) continue; // 15% visible gossip chance
      
      const npc1 = npcsAtLocation[i];
      const npc2 = npcsAtLocation[j];
      
      const store1 = npcMemories[npc1.id];
      if (!store1) continue;
      
      const playerMemories = [...store1.shortTerm, ...store1.mediumTerm, ...store1.longTerm]
        .filter(m => m.sharable && !m.secret && m.entities.includes('player'));
      
      if (playerMemories.length > 0) {
        const memory = playerMemories[Math.floor(Math.random() * playerMemories.length)];
        gossipEvents.push({
          npc1: npc1.name,
          npc2: npc2.name,
          topic: memory.summary,
        });
      }
    }
  }
  
  return gossipEvents;
}

// ============= MEMORY SUMMARY FOR DIALOGUE =============

/**
 * Get a summary of relevant memories for dialogue generation
 */
export function getMemorySummaryForDialogue(
  store: NPCMemoryStore,
  context: {
    talkingTo: string;
    location: string;
    recentTopics?: string[];
  },
  currentTick: number
): {
  recentMemories: string[];
  impression: ImpressionMemory | null;
  relevantPatterns: PatternMemory[];
  activeTrauma: boolean;
  moodFromMemories: number;
} {
  // Get memories about the person they're talking to
  const { memories, store: updatedStore } = recallMemories(
    store,
    {
      entities: [context.talkingTo, 'player'],
      location: context.location,
      keywords: context.recentTopics,
    },
    5,
    currentTick
  );
  
  // Check for triggered trauma
  const traumaResult = triggerMemory(
    store,
    { entities: [context.talkingTo], location: context.location },
    currentTick
  );
  
  // Get impression of who they're talking to
  const impression = store.impressions[context.talkingTo] || 
                     store.impressions['player'] || null;
  
  // Get relevant patterns
  const relevantPatterns = store.patterns.filter(p => 
    p.relatedEntities.some(e => 
      e.toLowerCase().includes(context.talkingTo.toLowerCase()) ||
      context.talkingTo.toLowerCase().includes(e.toLowerCase())
    )
  );
  
  return {
    recentMemories: memories.map(m => 
      `[${m.tier}] ${m.summary} (${m.sentiment}, salience: ${Math.floor(m.salience)})`
    ),
    impression,
    relevantPatterns,
    activeTrauma: traumaResult.traumaTriggered,
    moodFromMemories: traumaResult.moodEffect,
  };
}

/**
 * Convert memory store to a format suitable for AI dialogue context
 */
export function formatMemoriesForAI(
  store: NPCMemoryStore,
  targetEntity: string,
  limit: number = 10
): string {
  const allMemories = [
    ...store.longTerm, // Priority to long-term
    ...store.mediumTerm,
    ...store.shortTerm,
  ].filter(m => 
    m.entities.some(e => 
      e.toLowerCase().includes(targetEntity.toLowerCase()) ||
      targetEntity.toLowerCase().includes(e.toLowerCase())
    ) ||
    m.triggered
  );
  
  const impression = store.impressions[targetEntity] || store.impressions['player'];
  
  let context = '';
  
  if (impression) {
    context += `Overall impression of ${impression.entityName}: ${impression.overallSentiment}, trust level: ${impression.trustLevel}/100. `;
    if (impression.traits.length > 0) {
      context += `You think they are: ${impression.traits.slice(0, 5).join(', ')}. `;
    }
  }
  
  const topMemories = allMemories.slice(0, limit);
  if (topMemories.length > 0) {
    context += '\n\nRelevant memories:\n';
    topMemories.forEach(m => {
      const marker = m.traumatic ? '[TRAUMA]' : 
                     m.tier === 'long' ? '[CORE]' :
                     m.tier === 'medium' ? '[RECENT]' : '[JUST NOW]';
      context += `- ${marker} ${m.summary}`;
      if (m.sentiment !== 'neutral') {
        context += ` (felt: ${m.sentiment})`;
      }
      context += '\n';
    });
  }
  
  const patterns = store.patterns.filter(p => 
    p.relatedEntities.some(e => e.toLowerCase().includes(targetEntity.toLowerCase()))
  );
  if (patterns.length > 0) {
    context += '\nPatterns noticed: ';
    context += patterns.map(p => `"${p.pattern}" (${p.confidence}% confident)`).join('; ');
  }
  
  return context;
}
