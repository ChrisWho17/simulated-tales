// Clothing Item System - Defines all clothing items, stats, and acquisition logic

export type ClothingSlot = 'head' | 'torso' | 'legs' | 'feet' | 'hands' | 'accessory' | 'outfit';
export type ClothingRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ClothingStyle = 'casual' | 'formal' | 'military' | 'streetwear' | 'vintage' | 'athletic' | 'punk' | 'elegant';
export type ClothingSource = 'shop' | 'loot' | 'quest' | 'craft' | 'gift' | 'starting';

export interface ClothingStats {
  charisma?: number;
  intimidation?: number;
  defense?: number;
  stealth?: number;
  perception?: number;
  luck?: number;
  genreBonus?: { genre: string; stat: string; value: number };
}

export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  slot: ClothingSlot;
  style: ClothingStyle;
  rarity: ClothingRarity;
  stats: ClothingStats;
  value: number;
  sources: ClothingSource[];
  requirements?: {
    level?: number;
    reputation?: number;
    quest?: string;
  };
  visualDetails?: {
    color?: string;
    material?: string;
    condition?: string;
  };
  setId?: string;
}

export interface ClothingSet {
  id: string;
  name: string;
  description: string;
  pieces: string[];
  bonuses: {
    piecesRequired: number;
    stats: ClothingStats;
  }[];
}

// Sample clothing database
export const CLOTHING_DATABASE: ClothingItem[] = [
  // HEAD
  {
    id: 'worn_cap',
    name: 'Worn Baseball Cap',
    description: 'A faded cap that has seen better days.',
    slot: 'head',
    style: 'casual',
    rarity: 'common',
    stats: { perception: 1 },
    value: 15,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'fedora_noir',
    name: 'Noir Fedora',
    description: 'A classic detective hat that commands respect.',
    slot: 'head',
    style: 'vintage',
    rarity: 'uncommon',
    stats: { charisma: 2, perception: 1 },
    value: 75,
    sources: ['shop', 'quest'],
  },
  {
    id: 'tactical_helmet',
    name: 'Tactical Combat Helmet',
    description: 'Military-grade head protection with integrated comms.',
    slot: 'head',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 3, intimidation: 1 },
    value: 250,
    sources: ['loot', 'quest'],
  },
  {
    id: 'crown_shadows',
    name: 'Crown of Shadows',
    description: 'A mysterious circlet that seems to absorb light.',
    slot: 'head',
    style: 'elegant',
    rarity: 'legendary',
    stats: { charisma: 4, stealth: 3, intimidation: 2 },
    value: 2500,
    sources: ['quest'],
    requirements: { level: 10 },
  },

  // TORSO
  {
    id: 'plain_tshirt',
    name: 'Plain T-Shirt',
    description: 'A simple cotton shirt. Nothing special.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 10,
    sources: ['shop', 'starting'],
  },
  {
    id: 'leather_jacket',
    name: 'Classic Leather Jacket',
    description: 'A timeless leather jacket that exudes cool confidence.',
    slot: 'torso',
    style: 'streetwear',
    rarity: 'uncommon',
    stats: { charisma: 2, defense: 1 },
    value: 120,
    sources: ['shop', 'loot'],
  },
  {
    id: 'tactical_vest',
    name: 'Tactical Combat Vest',
    description: 'Heavy-duty vest with multiple pouches and armor plates.',
    slot: 'torso',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 4, intimidation: 2 },
    value: 350,
    sources: ['loot', 'quest'],
  },
  {
    id: 'silk_suit',
    name: 'Italian Silk Suit',
    description: 'Impeccably tailored suit that commands attention.',
    slot: 'torso',
    style: 'formal',
    rarity: 'epic',
    stats: { charisma: 5, luck: 2 },
    value: 800,
    sources: ['shop'],
    requirements: { reputation: 50 },
  },

  // LEGS
  {
    id: 'worn_jeans',
    name: 'Worn Jeans',
    description: 'Comfortable jeans with a few holes.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['shop', 'starting'],
  },
  {
    id: 'cargo_pants',
    name: 'Tactical Cargo Pants',
    description: 'Durable pants with lots of pockets.',
    slot: 'legs',
    style: 'military',
    rarity: 'uncommon',
    stats: { stealth: 1, defense: 1 },
    value: 85,
    sources: ['shop', 'loot'],
  },
  {
    id: 'dress_pants',
    name: 'Tailored Dress Pants',
    description: 'Sharp, professional trousers.',
    slot: 'legs',
    style: 'formal',
    rarity: 'uncommon',
    stats: { charisma: 2 },
    value: 95,
    sources: ['shop'],
  },

  // FEET
  {
    id: 'sneakers',
    name: 'Running Sneakers',
    description: 'Comfortable athletic shoes.',
    slot: 'feet',
    style: 'athletic',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 45,
    sources: ['shop', 'starting'],
  },
  {
    id: 'combat_boots',
    name: 'Steel-Toe Combat Boots',
    description: 'Heavy-duty boots built for action.',
    slot: 'feet',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2, intimidation: 1 },
    value: 110,
    sources: ['shop', 'loot'],
  },
  {
    id: 'dress_shoes',
    name: 'Italian Leather Oxfords',
    description: 'Polished shoes that complete any formal look.',
    slot: 'feet',
    style: 'formal',
    rarity: 'rare',
    stats: { charisma: 3 },
    value: 200,
    sources: ['shop'],
  },

  // HANDS
  {
    id: 'fingerless_gloves',
    name: 'Fingerless Gloves',
    description: 'Practical gloves that leave fingers free.',
    slot: 'hands',
    style: 'punk',
    rarity: 'common',
    stats: { intimidation: 1 },
    value: 25,
    sources: ['shop', 'loot'],
  },
  {
    id: 'tactical_gloves',
    name: 'Tactical Combat Gloves',
    description: 'Reinforced gloves with armored knuckles.',
    slot: 'hands',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 1, intimidation: 1 },
    value: 75,
    sources: ['shop', 'loot'],
  },
  {
    id: 'silk_gloves',
    name: 'White Silk Gloves',
    description: 'Elegant gloves for formal occasions.',
    slot: 'hands',
    style: 'elegant',
    rarity: 'rare',
    stats: { charisma: 2, luck: 1 },
    value: 150,
    sources: ['shop', 'gift'],
  },

  // ACCESSORIES
  {
    id: 'dog_tags',
    name: 'Military Dog Tags',
    description: 'Metal identification tags on a chain.',
    slot: 'accessory',
    style: 'military',
    rarity: 'common',
    stats: { intimidation: 1 },
    value: 30,
    sources: ['loot', 'starting'],
  },
  {
    id: 'gold_watch',
    name: 'Gold Chronograph Watch',
    description: 'An expensive timepiece that shows your status.',
    slot: 'accessory',
    style: 'formal',
    rarity: 'epic',
    stats: { charisma: 4, luck: 2 },
    value: 1200,
    sources: ['shop', 'loot'],
    requirements: { reputation: 30 },
  },
  {
    id: 'lucky_coin',
    name: 'Lucky Silver Coin',
    description: 'A worn coin that seems to bring good fortune.',
    slot: 'accessory',
    style: 'vintage',
    rarity: 'legendary',
    stats: { luck: 5, perception: 2 },
    value: 5000,
    sources: ['quest'],
  },
];

// Clothing sets for bonus effects
export const CLOTHING_SETS: ClothingSet[] = [
  {
    id: 'tactical_operator',
    name: 'Tactical Operator',
    description: 'Full military combat gear.',
    pieces: ['tactical_helmet', 'tactical_vest', 'cargo_pants', 'combat_boots', 'tactical_gloves'],
    bonuses: [
      { piecesRequired: 2, stats: { defense: 2 } },
      { piecesRequired: 4, stats: { defense: 3, intimidation: 2 } },
      { piecesRequired: 5, stats: { defense: 5, intimidation: 4, perception: 2 } },
    ],
  },
  {
    id: 'sharp_dressed',
    name: 'Sharp Dressed',
    description: 'Complete formal attire.',
    pieces: ['silk_suit', 'dress_pants', 'dress_shoes', 'gold_watch', 'silk_gloves'],
    bonuses: [
      { piecesRequired: 2, stats: { charisma: 2 } },
      { piecesRequired: 3, stats: { charisma: 4, luck: 1 } },
      { piecesRequired: 5, stats: { charisma: 8, luck: 3 } },
    ],
  },
];

// Helper functions
export function getClothingById(id: string): ClothingItem | undefined {
  return CLOTHING_DATABASE.find(item => item.id === id);
}

export function getClothingByStyle(style: ClothingStyle): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.style === style);
}

export function getClothingBySlot(slot: ClothingSlot): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.slot === slot);
}

export function getClothingByRarity(rarity: ClothingRarity): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.rarity === rarity);
}

export function getShopInventory(playerLevel: number = 1, playerRep: number = 0): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => {
    if (!item.sources.includes('shop')) return false;
    if (item.requirements?.level && item.requirements.level > playerLevel) return false;
    if (item.requirements?.reputation && item.requirements.reputation > playerRep) return false;
    return true;
  });
}

export function rollLootDrop(context: { location?: string; enemy?: string; difficulty?: number }): ClothingItem | null {
  const lootableItems = CLOTHING_DATABASE.filter(item => item.sources.includes('loot'));
  if (lootableItems.length === 0) return null;

  const difficulty = context.difficulty || 1;
  
  // Weight by rarity - higher difficulty = better chance at rare items
  const weights: Record<ClothingRarity, number> = {
    common: 50 - difficulty * 5,
    uncommon: 30,
    rare: 15 + difficulty * 2,
    epic: 4 + difficulty,
    legendary: 1 + Math.floor(difficulty / 3),
  };

  const roll = Math.random() * 100;
  let cumulative = 0;
  let targetRarity: ClothingRarity = 'common';

  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll <= cumulative) {
      targetRarity = rarity as ClothingRarity;
      break;
    }
  }

  const rarityItems = lootableItems.filter(item => item.rarity === targetRarity);
  if (rarityItems.length === 0) {
    // Fallback to any lootable item
    return lootableItems[Math.floor(Math.random() * lootableItems.length)];
  }

  return rarityItems[Math.floor(Math.random() * rarityItems.length)];
}

export function calculateTotalStats(items: ClothingItem[]): ClothingStats {
  const total: ClothingStats = {};

  for (const item of items) {
    for (const [key, value] of Object.entries(item.stats)) {
      if (key === 'genreBonus') continue;
      const statKey = key as keyof Omit<ClothingStats, 'genreBonus'>;
      total[statKey] = (total[statKey] || 0) + (value as number);
    }
  }

  return total;
}

export function getStatDescription(stat: keyof Omit<ClothingStats, 'genreBonus'>): string {
  const descriptions: Record<string, string> = {
    charisma: 'Improves social interactions and persuasion',
    intimidation: 'Makes NPCs more likely to back down or comply',
    defense: 'Reduces damage from physical attacks',
    stealth: 'Makes it easier to sneak and avoid detection',
    perception: 'Improves awareness and chance to notice details',
    luck: 'Affects random outcomes and loot quality',
  };
  return descriptions[stat] || 'Unknown stat';
}

export function getRarityColor(rarity: ClothingRarity): string {
  const colors: Record<ClothingRarity, string> = {
    common: 'text-muted-foreground',
    uncommon: 'text-green-500',
    rare: 'text-blue-500',
    epic: 'text-purple-500',
    legendary: 'text-amber-500',
  };
  return colors[rarity];
}

export function getRarityBgColor(rarity: ClothingRarity): string {
  const colors: Record<ClothingRarity, string> = {
    common: 'bg-muted/30 border-border',
    uncommon: 'bg-green-500/10 border-green-500/30',
    rare: 'bg-blue-500/10 border-blue-500/30',
    epic: 'bg-purple-500/10 border-purple-500/30',
    legendary: 'bg-amber-500/10 border-amber-500/30',
  };
  return colors[rarity];
}
