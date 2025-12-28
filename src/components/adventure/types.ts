// Shared types for adventure components

export interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

export interface GameMechanics {
  rollRequired?: { stat: string; difficulty: number; reason: string };
  xpGained?: { amount: number; reason: string };
  goldGained?: number;
  lootGained?: string | string[];
  itemsDropped?: string[];  // Items removed from inventory (left behind, sold, given away, etc.)
  damage?: number;
  heal?: number;
  skillImprovements?: Array<{ skill: string; amount: number; reason: string }>;
  relationshipMoments?: Array<{ npcName: string; momentType: string; description: string }>;
  milestoneChanges?: Array<{ npcName: string; milestoneType: string }>;
}
