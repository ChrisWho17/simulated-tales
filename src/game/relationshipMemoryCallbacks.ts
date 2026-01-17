// ============================================================================
// RELATIONSHIP MEMORY CALLBACKS - NPCs reference specific past interactions
// ============================================================================

import { NPC, Memory } from '@/types/game';
import { EnhancedMemory, NPCMemoryStore, recallMemories, triggerMemory } from './memorySystem';

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryReference {
  memoryId: string;
  npcId: string;
  npcName: string;
  type: 'direct' | 'indirect' | 'rumor';
  sentiment: 'positive' | 'negative' | 'neutral';
  dialogueOptions: string[];
  used: boolean;
  lastUsed?: number;
  cooldownTicks: number;
}

export interface ContextualMemoryTrigger {
  keywords: string[];
  emotionTags: string[];
  locationTriggers: string[];
  entityTriggers: string[];
}

export interface DialogueMemoryContext {
  currentTopic?: string;
  recentPlayerActions: string[];
  currentLocation: string;
  presentEntities: string[];
  playerRelationshipLevel: 'stranger' | 'acquaintance' | 'friend' | 'close' | 'intimate' | 'enemy';
}

// ============================================================================
// MEMORY DIALOGUE TEMPLATES
// ============================================================================

const POSITIVE_MEMORY_TEMPLATES: Record<string, string[]> = {
  helped: [
    "You know, I still remember when you helped me with {event}. I won't forget that.",
    "After what you did for me at {location}... I'm grateful.",
    "Remember {event}? That meant a lot to me.",
    "I've been meaning to thank you again for {event}.",
    "Not many people would have done what you did. {event} proved you're good people."
  ],
  saved: [
    "You saved my life. I'll never forget that day at {location}.",
    "If it weren't for you, I wouldn't be standing here. Thank you.",
    "I owe you my life. What happened at {location}... I still have nightmares, but I'm alive because of you.",
    "My family doesn't know how close they came to losing me. You saved me.",
    "Every day I wake up, I remember you're the reason I'm still breathing."
  ],
  gift: [
    "That {item} you gave me? Still using it. Thanks again.",
    "I still have what you gave me. It means more than you know.",
    "Generous of you to share that {item}. Not everyone would."
  ],
  defended: [
    "You stood up for me when no one else would. I remember.",
    "When everyone turned their backs, you defended me. That takes courage.",
    "I haven't forgotten how you took my side at {location}."
  ],
  trusted: [
    "You trusted me when you had no reason to. I appreciate that.",
    "Most people don't give second chances. You did.",
    "You believed in me. I'm trying to live up to that."
  ]
};

const NEGATIVE_MEMORY_TEMPLATES: Record<string, string[]> = {
  betrayed: [
    "I haven't forgotten what you did. {event}. That hurt.",
    "We both know what happened at {location}. Don't pretend otherwise.",
    "Trust is hard to rebuild after {event}.",
    "I thought you were different. Then {event} happened.",
    "Every time I see you, I remember {event}."
  ],
  abandoned: [
    "You left when I needed you most. {event} proved that.",
    "I called for help at {location}. Where were you?",
    "Some friend you turned out to be. {event} showed your true colors.",
    "When things got hard, you disappeared. I remember."
  ],
  harmed: [
    "The {injury} still hurts sometimes. Thanks for that.",
    "What you did at {location}... that wasn't right.",
    "I carry scars because of you. Literal scars.",
    "You hurt me. I'm not sure I can move past that."
  ],
  stole: [
    "I know you took my {item}. Don't play innocent.",
    "Thieves don't make good friends. Remember that.",
    "What happened to my {item}? We both know the answer."
  ],
  lied: [
    "You lied to me about {event}. I found out.",
    "How many of your words were true? I wonder now.",
    "The truth came out eventually. It always does.",
    "I believed you. That was my mistake."
  ]
};

const NEUTRAL_MEMORY_TEMPLATES: Record<string, string[]> = {
  met: [
    "We first met at {location}, remember? Seems like ages ago.",
    "I recall running into you at {location}. Strange how paths cross.",
    "You probably don't remember, but we met once at {location}."
  ],
  witnessed: [
    "I saw what happened at {location}. Interesting times.",
    "Were you at {location} during {event}? I thought I saw you.",
    "That whole business at {location}... you were there too, weren't you?"
  ],
  shared: [
    "Remember that time at {location}? With the {event}? Wild.",
    "We've been through some things together, haven't we?",
    "At least we can say we survived {event}. That's something."
  ]
};

// ============================================================================
// MEMORY ANALYSIS
// ============================================================================

/**
 * Analyze a memory and determine what kind of reference it generates
 */
export function analyzeMemoryForReference(
  memory: EnhancedMemory,
  npcId: string,
  npcName: string
): MemoryReference | null {
  // Only process memories involving the player
  if (!memory.entities.includes('player')) return null;
  
  // Determine the memory type based on summary/details
  const text = `${memory.summary} ${memory.details}`.toLowerCase();
  
  let type: 'direct' | 'indirect' | 'rumor' = 'direct';
  if (memory.source === 'rumor' || memory.source === 'told_by_trusted') {
    type = memory.source === 'rumor' ? 'rumor' : 'indirect';
  }
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (memory.sentiment === 'positive' || memory.emotionTags.includes('gratitude') || memory.emotionTags.includes('joy')) {
    sentiment = 'positive';
  } else if (memory.sentiment === 'negative' || memory.emotionTags.includes('anger') || memory.emotionTags.includes('betrayal')) {
    sentiment = 'negative';
  }
  
  // Generate dialogue options
  const dialogueOptions = generateDialogueFromMemory(memory, sentiment);
  
  if (dialogueOptions.length === 0) return null;
  
  return {
    memoryId: memory.id,
    npcId,
    npcName,
    type,
    sentiment,
    dialogueOptions,
    used: false,
    cooldownTicks: 100 // Don't repeat for a while
  };
}

/**
 * Generate dialogue lines from a memory
 */
function generateDialogueFromMemory(
  memory: EnhancedMemory,
  sentiment: 'positive' | 'negative' | 'neutral'
): string[] {
  const text = `${memory.summary} ${memory.details}`.toLowerCase();
  const templates = sentiment === 'positive' ? POSITIVE_MEMORY_TEMPLATES :
                   sentiment === 'negative' ? NEGATIVE_MEMORY_TEMPLATES :
                   NEUTRAL_MEMORY_TEMPLATES;
  
  // Detect what kind of event it was
  let eventType: string | null = null;
  
  if (text.includes('help') || text.includes('assist')) eventType = 'helped';
  else if (text.includes('save') || text.includes('rescue')) eventType = 'saved';
  else if (text.includes('gift') || text.includes('gave')) eventType = 'gift';
  else if (text.includes('defend') || text.includes('stood up')) eventType = 'defended';
  else if (text.includes('trust')) eventType = 'trusted';
  else if (text.includes('betray') || text.includes('backstab')) eventType = 'betrayed';
  else if (text.includes('abandon') || text.includes('left')) eventType = 'abandoned';
  else if (text.includes('hurt') || text.includes('attack') || text.includes('wound')) eventType = 'harmed';
  else if (text.includes('stole') || text.includes('theft')) eventType = 'stole';
  else if (text.includes('lied') || text.includes('deceive')) eventType = 'lied';
  else if (text.includes('met') || text.includes('first time')) eventType = 'met';
  else if (text.includes('saw') || text.includes('witness')) eventType = 'witnessed';
  else eventType = 'shared';
  
  const eventTemplates = templates[eventType] || templates[Object.keys(templates)[0]];
  if (!eventTemplates) return [];
  
  // Replace placeholders
  return eventTemplates.map(template => {
    return template
      .replace('{event}', memory.summary)
      .replace('{location}', memory.location)
      .replace('{item}', extractItemFromMemory(memory))
      .replace('{injury}', extractInjuryFromMemory(memory));
  });
}

function extractItemFromMemory(memory: EnhancedMemory): string {
  const text = `${memory.summary} ${memory.details}`;
  // Simple extraction - could be more sophisticated
  const match = text.match(/(?:gave|stole|took|received)\s+(?:a\s+)?([a-z\s]+?)(?:\.|,|$)/i);
  return match ? match[1].trim() : 'item';
}

function extractInjuryFromMemory(memory: EnhancedMemory): string {
  const text = `${memory.summary} ${memory.details}`;
  const match = text.match(/(?:wound|injury|hurt|damage)\s+(?:to\s+)?(?:my\s+)?([a-z\s]+?)(?:\.|,|$)/i);
  return match ? match[1].trim() : 'injury';
}

// ============================================================================
// MEMORY CALLBACK SYSTEM
// ============================================================================

export interface NPCMemoryCallbackState {
  references: MemoryReference[];
  lastMemoryMention: number;
  mentionCooldown: number; // Ticks between mentions
}

export function initializeCallbackState(): NPCMemoryCallbackState {
  return {
    references: [],
    lastMemoryMention: 0,
    mentionCooldown: 50 // Don't spam memories
  };
}

/**
 * Check if NPC should reference a memory based on context
 */
export function shouldReferenceMemory(
  state: NPCMemoryCallbackState,
  context: DialogueMemoryContext,
  currentTick: number
): { shouldReference: boolean; reference: MemoryReference | null } {
  // Check cooldown
  if (currentTick - state.lastMemoryMention < state.mentionCooldown) {
    return { shouldReference: false, reference: null };
  }
  
  // Filter to unused references
  const availableRefs = state.references.filter(r => !r.used || 
    (r.lastUsed && currentTick - r.lastUsed > r.cooldownTicks));
  
  if (availableRefs.length === 0) {
    return { shouldReference: false, reference: null };
  }
  
  // Prioritize based on context
  let bestRef: MemoryReference | null = null;
  let bestScore = 0;
  
  for (const ref of availableRefs) {
    let score = 0;
    
    // Higher scores for more emotional memories
    score += ref.sentiment === 'positive' ? 2 : ref.sentiment === 'negative' ? 3 : 1;
    
    // Boost if relationship is appropriate
    if (context.playerRelationshipLevel === 'friend' || context.playerRelationshipLevel === 'close') {
      score += 2;
    }
    
    // Small random factor
    score += Math.random() * 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestRef = ref;
    }
  }
  
  // Only reference if score is high enough (don't always mention memories)
  const referenceChance = context.playerRelationshipLevel === 'stranger' ? 0.1 :
                         context.playerRelationshipLevel === 'acquaintance' ? 0.2 :
                         context.playerRelationshipLevel === 'friend' ? 0.35 :
                         context.playerRelationshipLevel === 'close' ? 0.5 : 0.15;
  
  if (Math.random() > referenceChance) {
    return { shouldReference: false, reference: null };
  }
  
  return { shouldReference: !!bestRef, reference: bestRef };
}

/**
 * Get a random dialogue line from a memory reference
 */
export function getMemoryDialogue(reference: MemoryReference): string {
  if (reference.dialogueOptions.length === 0) return '';
  return reference.dialogueOptions[Math.floor(Math.random() * reference.dialogueOptions.length)];
}

/**
 * Mark a reference as used
 */
export function markReferenceUsed(
  state: NPCMemoryCallbackState,
  referenceId: string,
  currentTick: number
): NPCMemoryCallbackState {
  return {
    ...state,
    lastMemoryMention: currentTick,
    references: state.references.map(r => 
      r.memoryId === referenceId 
        ? { ...r, used: true, lastUsed: currentTick }
        : r
    )
  };
}

/**
 * Process NPC memories and generate references
 */
export function processMemoriesForReferences(
  memoryStore: NPCMemoryStore,
  npcId: string,
  npcName: string
): MemoryReference[] {
  const allMemories = [
    ...memoryStore.shortTerm,
    ...memoryStore.mediumTerm,
    ...memoryStore.longTerm
  ];
  
  const references: MemoryReference[] = [];
  
  for (const memory of allMemories) {
    // Only process memorable events with player involvement
    if (memory.emotionalIntensity < 30) continue;
    if (!memory.entities.includes('player')) continue;
    
    const reference = analyzeMemoryForReference(memory, npcId, npcName);
    if (reference) {
      references.push(reference);
    }
  }
  
  return references;
}

// ============================================================================
// DIALOGUE INTEGRATION
// ============================================================================

/**
 * Inject memory references into NPC dialogue
 */
export function injectMemoryIntoDialogue(
  baseDialogue: string,
  reference: MemoryReference,
  position: 'before' | 'after' | 'replace' = 'before'
): string {
  const memoryLine = getMemoryDialogue(reference);
  if (!memoryLine) return baseDialogue;
  
  const connector = reference.sentiment === 'positive' ? 
    ['Speaking of which...', 'You know...', 'By the way...'][Math.floor(Math.random() * 3)] :
    ['Hmph.', '...', 'You know what?'][Math.floor(Math.random() * 3)];
  
  switch (position) {
    case 'before':
      return `${memoryLine} ${connector} ${baseDialogue}`;
    case 'after':
      return `${baseDialogue} ${connector} ${memoryLine}`;
    case 'replace':
      return memoryLine;
    default:
      return baseDialogue;
  }
}

// ============================================================================
// PROACTIVE MEMORY TRIGGERS
// ============================================================================

export interface ProactiveMemoryTrigger {
  triggerType: 'location' | 'entity' | 'topic' | 'time' | 'emotion';
  triggerValue: string;
  memoryIds: string[];
  priority: number;
}

/**
 * Build triggers from memories for proactive callbacks
 */
export function buildMemoryTriggers(memories: EnhancedMemory[]): ProactiveMemoryTrigger[] {
  const triggers: ProactiveMemoryTrigger[] = [];
  
  for (const memory of memories) {
    if (!memory.entities.includes('player')) continue;
    
    // Location trigger
    if (memory.location) {
      triggers.push({
        triggerType: 'location',
        triggerValue: memory.location.toLowerCase(),
        memoryIds: [memory.id],
        priority: memory.emotionalIntensity
      });
    }
    
    // Entity triggers (other people involved)
    for (const entity of memory.entities) {
      if (entity === 'player') continue;
      triggers.push({
        triggerType: 'entity',
        triggerValue: entity.toLowerCase(),
        memoryIds: [memory.id],
        priority: memory.emotionalIntensity
      });
    }
    
    // Emotion triggers
    for (const emotion of memory.emotionTags) {
      triggers.push({
        triggerType: 'emotion',
        triggerValue: emotion,
        memoryIds: [memory.id],
        priority: memory.emotionalIntensity / 2
      });
    }
  }
  
  return triggers;
}

/**
 * Check if current context matches any memory triggers
 */
export function checkMemoryTriggers(
  triggers: ProactiveMemoryTrigger[],
  context: {
    currentLocation?: string;
    mentionedEntities?: string[];
    currentTopic?: string;
    emotionalContext?: string[];
  }
): ProactiveMemoryTrigger[] {
  const matchedTriggers: ProactiveMemoryTrigger[] = [];
  
  for (const trigger of triggers) {
    let matched = false;
    
    switch (trigger.triggerType) {
      case 'location':
        if (context.currentLocation?.toLowerCase().includes(trigger.triggerValue)) {
          matched = true;
        }
        break;
      case 'entity':
        if (context.mentionedEntities?.some(e => e.toLowerCase().includes(trigger.triggerValue))) {
          matched = true;
        }
        break;
      case 'topic':
        if (context.currentTopic?.toLowerCase().includes(trigger.triggerValue)) {
          matched = true;
        }
        break;
      case 'emotion':
        if (context.emotionalContext?.includes(trigger.triggerValue)) {
          matched = true;
        }
        break;
    }
    
    if (matched) {
      matchedTriggers.push(trigger);
    }
  }
  
  // Sort by priority
  return matchedTriggers.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// SINGLETON MANAGER - Designed for 100k+ turn games
// ============================================================================

// Memory callback limits
const CALLBACK_LIMITS = {
  maxNPCStates: 50,      // Max NPCs with callback states
  maxReferences: 20,     // Max memory references per NPC
  maxTriggers: 30,       // Max triggers per NPC
} as const;

class RelationshipMemoryManager {
  private npcStates: Map<string, NPCMemoryCallbackState> = new Map();
  private triggers: Map<string, ProactiveMemoryTrigger[]> = new Map();
  
  initializeNPC(npcId: string, memoryStore: NPCMemoryStore, npcName: string) {
    // Prune old NPC states if over limit
    if (this.npcStates.size >= CALLBACK_LIMITS.maxNPCStates) {
      this.pruneOldestStates();
    }
    
    const allReferences = processMemoriesForReferences(memoryStore, npcId, npcName);
    const references = allReferences.slice(0, CALLBACK_LIMITS.maxReferences);
    
    const allMemories = [
      ...memoryStore.shortTerm,
      ...memoryStore.mediumTerm,
      ...memoryStore.longTerm
    ];
    const allTriggers = buildMemoryTriggers(allMemories);
    const npcTriggers = allTriggers.slice(0, CALLBACK_LIMITS.maxTriggers);
    
    this.npcStates.set(npcId, {
      references,
      lastMemoryMention: 0,
      mentionCooldown: 50
    });
    
    this.triggers.set(npcId, npcTriggers);
  }
  
  private pruneOldestStates(): void {
    // Remove oldest 25% of states
    const toRemove = Math.ceil(this.npcStates.size * 0.25);
    const keys = Array.from(this.npcStates.keys());
    for (let i = 0; i < toRemove && i < keys.length; i++) {
      this.npcStates.delete(keys[i]);
      this.triggers.delete(keys[i]);
    }
    console.log(`[RelationshipMemory] Pruned ${toRemove} old NPC callback states`);
  }
  
  shouldReference(npcId: string, context: DialogueMemoryContext, currentTick: number) {
    const state = this.npcStates.get(npcId);
    if (!state) return { shouldReference: false, reference: null };
    return shouldReferenceMemory(state, context, currentTick);
  }
  
  markUsed(npcId: string, memoryId: string, currentTick: number) {
    const state = this.npcStates.get(npcId);
    if (!state) return;
    this.npcStates.set(npcId, markReferenceUsed(state, memoryId, currentTick));
  }
  
  checkTriggers(npcId: string, context: Parameters<typeof checkMemoryTriggers>[1]) {
    const npcTriggers = this.triggers.get(npcId);
    if (!npcTriggers) return [];
    return checkMemoryTriggers(npcTriggers, context);
  }
  
  reset() {
    this.npcStates.clear();
    this.triggers.clear();
  }
  
  // Get current memory usage stats
  getStats() {
    return {
      npcStatesCount: this.npcStates.size,
      triggersCount: Array.from(this.triggers.values()).reduce((sum, t) => sum + t.length, 0),
    };
  }
}

export const relationshipMemoryManager = new RelationshipMemoryManager();
