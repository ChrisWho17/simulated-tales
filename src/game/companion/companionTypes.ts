// ============================================================================
// COMPANION TYPES - All type definitions for the companion system
// ============================================================================

export type CompanionMood = 
  | 'joyful' | 'content' | 'neutral' | 'annoyed' | 'angry' 
  | 'sad' | 'fearful' | 'disgusted' | 'romantic' | 'betrayed';

export type CompanionStatus = 
  | 'active' // In party, traveling with player
  | 'waiting' // Left at a location
  | 'left' // Left voluntarily due to disagreement
  | 'hostile' // Turned on the player
  | 'dead' // Killed in combat or story
  | 'romance' // In a romantic relationship
  | 'rejected'; // Player rejected their advances

export type PersonalityTrait = 
  | 'honorable' | 'ruthless' | 'kind' | 'cruel' | 'brave' | 'cowardly'
  | 'greedy' | 'generous' | 'loyal' | 'treacherous' | 'romantic' | 'pragmatic'
  | 'spiritual' | 'skeptical' | 'vengeful' | 'forgiving' | 'ambitious' | 'humble';

export type PlayerActionType = 
  | 'combat_kill' | 'combat_spare' | 'theft' | 'charity' 
  | 'lie' | 'truth' | 'violence' | 'diplomacy'
  | 'betrayal' | 'loyalty' | 'cowardice' | 'bravery'
  | 'romance_flirt' | 'romance_reject' | 'insult' | 'compliment'
  | 'greed' | 'sacrifice' | 'mercy' | 'cruelty';

export interface CompanionPersonality {
  // Core traits (3-5 per companion)
  traits: PersonalityTrait[];
  
  // What they value (-100 to 100)
  values: {
    honor: number;
    wealth: number;
    power: number;
    love: number;
    freedom: number;
    justice: number;
    knowledge: number;
    family: number;
  };
  
  // What actions they approve/disapprove of
  approves: PlayerActionType[];
  disapproves: PlayerActionType[];
  
  // Romantic preferences
  romanticInterest: {
    enabled: boolean;
    preferredGender?: 'male' | 'female' | 'any';
    attractedToPlayer: boolean;
    romanceThreshold: number; // Affinity needed to confess
  };
  
  // Breaking points
  betrayalThreshold: number; // Affinity below this = they turn hostile
  departureThreshold: number; // Affinity below this = they leave
  
  // Dialogue style
  speechPattern: string;
  catchphrases: string[];
  quirks: string[]; // Known quirks (visible to player)
  hiddenQuirks: string[]; // Quirks that are revealed as relationship deepens
}

// Quirk discovery thresholds - what trust/affinity level reveals each hidden quirk
export interface QuirkDiscoveryState {
  discoveredQuirks: string[]; // Quirks that have been revealed
  pendingDiscovery?: {
    quirk: string;
    discoveryDialogue: string;
  };
  lastDiscoveryCheck: number;
}

// ========== CONVERSATION MEMORY SYSTEM ==========
// Tracks what personal topics the player has shared with EACH companion (isolated per companion)

export type ConversationTopic = 
  | 'dreams' | 'relationships' | 'memories' | 'fears' | 'future'
  | 'loss' | 'origin' | 'philosophy' | 'secrets' | 'regrets'
  | 'motivation' | 'love' | 'courage' | 'peace' | 'wanderlust';

export interface SharedTopicMemory {
  topic: ConversationTopic;
  sharedAt: number; // timestamp
  responseType: 'honest' | 'emotional' | 'deflect' | 'lie';
  playerSummary?: string; // Optional player-provided context
  companionReaction: string; // How they reacted
  referencedCount: number; // How many times companion has referenced this
  lastReferenced?: number; // Last time companion brought it up
}

export interface ConversationMemoryState {
  companionId: string; // Ties memory to specific companion
  sharedTopics: SharedTopicMemory[];
  askedTopics: ConversationTopic[]; // Topics this companion has already asked about
  lastAskedAt: number;
  conversationDepth: number; // 0-100, increases as more is shared
}

export type SituationType = 
  | 'combat_start' | 'combat_losing' | 'combat_won' | 'near_death'
  | 'difficult_choice' | 'moral_dilemma' | 'negotiation' | 'intimidation'
  | 'emotional_moment' | 'failure' | 'success' | 'danger_ahead'
  | 'meeting_stranger' | 'facing_enemy' | 'moment_of_doubt' | 'celebration';

export interface CompanionMemory {
  timestamp: number;
  type: 'action' | 'dialogue' | 'event' | 'gift' | 'betrayal';
  description: string;
  affinityChange: number;
  playerAction?: PlayerActionType;
  forgotten: boolean;
}

export interface CompanionState {
  id: string;
  name: string;
  portrait?: string; // URL to generated portrait
  
  // Status
  status: CompanionStatus;
  mood: CompanionMood;
  moodIntensity: number; // 0-100
  
  // Relationship with player
  affinity: number; // -100 to 100 (hate to love)
  trust: number; // 0-100
  respect: number; // 0-100
  fear: number; // 0-100 (if player is cruel)
  romanticInterest: number; // 0-100
  
  // Their personality
  personality: CompanionPersonality;
  
  // Quirk discovery system
  quirkDiscovery: QuirkDiscoveryState;
  
  // Conversation memory - what personal topics player has shared with THIS companion
  conversationMemory: ConversationMemoryState;
  
  // Memories of player actions
  memories: CompanionMemory[];
  
  // Current internal state
  internalThoughts: string; // What they're thinking
  pendingReaction?: string; // Reaction to recent event
  wantsToSpeak: boolean; // Has something to say
  
  // Gameplay
  combatRole?: 'tank' | 'damage' | 'support' | 'ranged';
  skills: string[];
  equipment: string[];
  
  // PERMANENT Combat Attributes (set once on creation, never change)
  combatAttributes?: {
    baseStrength: number;       // 1-100 (permanent)
    baseAgility: number;        // 1-100 (permanent)
    baseEndurance: number;      // 1-100 (permanent)
    baseCombatSkill: number;    // 1-100 (permanent)
    size: 'small' | 'medium' | 'large' | 'huge';  // permanent
  };
  
  // Timers and flags
  joinedAt: number;
  lastSpoke: number;
  confessedLove: boolean;
  wasBetrayed: boolean;
  hasSecret: boolean;
  secretRevealed: boolean;
}

// Bonding event types
export type BondingEventType = 
  | 'survived_combat_together'
  | 'player_saved_companion'
  | 'companion_saved_player'
  | 'shared_campfire_moment'
  | 'player_confided_in_companion'
  | 'celebrated_victory'
  | 'mourned_loss_together'
  | 'overcame_challenge';

// Reaction calculation result
export interface ReactionResult {
  affinityChange: number;
  description: string;
  dialogue: string;
}

// Contextual support result
export interface ContextualSupportResult {
  canSupport: boolean;
  dialogue: string;
  basedOnTopic?: ConversationTopic;
  supportType: 'supportive' | 'hostile' | 'generic';
}

// All conversation topics constant
export const ALL_CONVERSATION_TOPICS: ConversationTopic[] = [
  'dreams', 'relationships', 'memories', 'fears', 'future',
  'loss', 'origin', 'philosophy', 'secrets', 'regrets',
  'motivation', 'love', 'courage', 'peace', 'wanderlust'
];

console.log('[CompanionTypes] Types module loaded');
