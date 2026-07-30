// Shared types for adventure components

export interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
  imageUrl?: string;
  /** When true, skip typewriter replay (e.g. content already streamed live). */
  skipTypewriter?: boolean;
}

export interface GameMechanics {
  rollRequired?: { stat: string; difficulty: number; reason: string };
  xpGained?: { amount: number; reason: string };
  goldGained?: number;
  lootGained?: string | string[];
  itemsDropped?: string[];  // Items removed from inventory (left behind, sold, given away, etc.)
  itemsUsed?: string[];     // Items consumed via [USE:] tag (Phase 2)
  damage?: number;
  heal?: number;
  skillImprovements?: Array<{ skill: string; amount: number; reason: string }>;
  relationshipMoments?: Array<{ npcName: string; momentType: string; description: string }>;
  milestoneChanges?: Array<{ npcName: string; milestoneType: string }>;
  /** Names from [RECRUIT:] / [COMPANION_JOIN:] story tags */
  companionsRecruited?: string[];
}
