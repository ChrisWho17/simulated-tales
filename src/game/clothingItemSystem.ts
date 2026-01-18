// Clothing Item System - Core clothing items with variants
// Use /command system from itemPromptCommands.ts for custom clothing creation

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
  // Variant system - base item ID this is derived from
  variantOf?: string;
  variantType?: string; // e.g., 'worn', 'pristine', 'military', 'fancy'
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

// ============================================================================
// CORE CLOTHING DATABASE - Base items with variants
// ============================================================================
export const CLOTHING_DATABASE: ClothingItem[] = [
  // ============== HEAD - Core Items ==============
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
    stats: { defense: 3, intimidation: 1, stealth: -1 },
    value: 250,
    sources: ['loot', 'quest'],
  },
  {
    id: 'leather_hood',
    name: 'Leather Hood',
    description: 'A soft leather hood that shadows your features.',
    slot: 'head',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 20,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'cowboy_hat',
    name: 'Cowboy Hat',
    description: 'A wide-brimmed leather hat for the frontier.',
    slot: 'head',
    style: 'vintage',
    rarity: 'common',
    stats: { perception: 1 },
    value: 35,
    sources: ['shop', 'starting'],
  },
  {
    id: 'tricorn_hat',
    name: 'Tricorn Hat',
    description: 'A three-cornered hat favored by sailors and pirates.',
    slot: 'head',
    style: 'vintage',
    rarity: 'common',
    stats: { charisma: 1 },
    value: 30,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'bandana',
    name: 'Worn Bandana',
    description: 'A faded cloth bandana.',
    slot: 'head',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 10,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'goggles',
    name: 'Tactical Goggles',
    description: 'Protective eyewear for harsh conditions.',
    slot: 'head',
    style: 'military',
    rarity: 'uncommon',
    stats: { perception: 1 },
    value: 45,
    sources: ['shop', 'loot'],
  },
  // Head variants
  {
    id: 'wizard_hat',
    name: 'Pointed Wizard Hat',
    description: 'A tall pointed hat adorned with arcane symbols.',
    slot: 'head',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { perception: 2 },
    value: 60,
    sources: ['shop', 'quest'],
    variantOf: 'leather_hood',
    variantType: 'magical',
  },
  {
    id: 'iron_helm',
    name: 'Iron Helm',
    description: 'A sturdy iron helmet with nose guard.',
    slot: 'head',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2, perception: -1 },
    value: 80,
    sources: ['shop', 'loot'],
    variantOf: 'tactical_helmet',
    variantType: 'medieval',
  },
  {
    id: 'steel_helm',
    name: 'Steel Knight Helm',
    description: 'A polished steel helmet with visor.',
    slot: 'head',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 4, perception: -2 },
    value: 180,
    sources: ['shop', 'loot'],
    variantOf: 'tactical_helmet',
    variantType: 'knight',
  },
  
  // ============== TORSO - Core Items ==============
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
    stats: { defense: 4, intimidation: 2, stealth: -1 },
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
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Supple leather armor offering protection without sacrificing mobility.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 2, stealth: 1 },
    value: 50,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'chainmail_shirt',
    name: 'Chainmail Shirt',
    description: 'Interlocking metal rings form this protective garment.',
    slot: 'torso',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 4, stealth: -1 },
    value: 150,
    sources: ['shop', 'loot'],
  },
  {
    id: 'travel_cloak',
    name: 'Travel Cloak',
    description: 'A hooded cloak for long journeys in all weather.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 35,
    sources: ['shop', 'starting'],
  },
  {
    id: 'hoodie',
    name: 'Hooded Sweatshirt',
    description: 'A comfortable hoodie for warmth and anonymity.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 40,
    sources: ['shop', 'starting'],
  },
  // Torso variants
  {
    id: 'mage_robes',
    name: 'Mage Robes',
    description: 'Flowing robes embroidered with arcane symbols.',
    slot: 'torso',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { perception: 2 },
    value: 75,
    sources: ['shop', 'quest'],
    variantOf: 'travel_cloak',
    variantType: 'magical',
  },
  {
    id: 'plate_armor',
    name: 'Plate Armor',
    description: 'Full plate armor forged from tempered steel.',
    slot: 'torso',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 7, intimidation: 2, stealth: -3 },
    value: 400,
    sources: ['shop', 'loot', 'quest'],
    variantOf: 'tactical_vest',
    variantType: 'medieval',
  },
  {
    id: 'flight_suit',
    name: 'Flight Suit',
    description: 'A practical jumpsuit for pilots and spacers.',
    slot: 'torso',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 1 },
    value: 85,
    sources: ['shop', 'loot'],
    variantOf: 'tactical_vest',
    variantType: 'scifi',
  },
  
  // ============== LEGS - Core Items ==============
  {
    id: 'worn_jeans',
    name: 'Worn Jeans',
    description: 'Faded blue jeans with character.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 25,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'cargo_pants',
    name: 'Cargo Pants',
    description: 'Durable pants with many pockets.',
    slot: 'legs',
    style: 'military',
    rarity: 'common',
    stats: { defense: 1 },
    value: 45,
    sources: ['shop', 'loot'],
  },
  {
    id: 'wool_pants',
    name: 'Wool Breeches',
    description: 'Warm woolen pants suitable for travel.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 30,
    sources: ['shop', 'starting'],
  },
  {
    id: 'leather_pants',
    name: 'Leather Pants',
    description: 'Tough leather pants offering protection.',
    slot: 'legs',
    style: 'streetwear',
    rarity: 'uncommon',
    stats: { defense: 1, stealth: 1 },
    value: 65,
    sources: ['shop', 'loot'],
  },
  {
    id: 'dress_pants',
    name: 'Dress Pants',
    description: 'Formal trousers for professional occasions.',
    slot: 'legs',
    style: 'formal',
    rarity: 'uncommon',
    stats: { charisma: 1 },
    value: 55,
    sources: ['shop'],
  },
  {
    id: 'cloth_pants',
    name: 'Cloth Pants',
    description: 'Simple cloth pants for everyday wear.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['shop', 'starting'],
  },
  // Legs variants
  {
    id: 'chainmail_leggings',
    name: 'Chainmail Leggings',
    description: 'Metal ring leggings for armored protection.',
    slot: 'legs',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 3, stealth: -1 },
    value: 120,
    sources: ['shop', 'loot'],
    variantOf: 'cargo_pants',
    variantType: 'medieval',
  },
  
  // ============== FEET - Core Items ==============
  {
    id: 'sneakers',
    name: 'Sneakers',
    description: 'Comfortable athletic shoes for running.',
    slot: 'feet',
    style: 'athletic',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 40,
    sources: ['shop', 'starting'],
  },
  {
    id: 'leather_boots',
    name: 'Leather Boots',
    description: 'Sturdy leather boots for travel.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 1 },
    value: 50,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'combat_boots',
    name: 'Combat Boots',
    description: 'Heavy-duty military boots with steel toes.',
    slot: 'feet',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2, intimidation: 1 },
    value: 85,
    sources: ['shop', 'loot'],
  },
  {
    id: 'dress_shoes',
    name: 'Dress Shoes',
    description: 'Polished leather shoes for formal occasions.',
    slot: 'feet',
    style: 'formal',
    rarity: 'uncommon',
    stats: { charisma: 1 },
    value: 70,
    sources: ['shop'],
  },
  {
    id: 'soft_boots',
    name: 'Soft Boots',
    description: 'Quiet leather boots for stealthy movement.',
    slot: 'feet',
    style: 'casual',
    rarity: 'uncommon',
    stats: { stealth: 2 },
    value: 60,
    sources: ['shop', 'loot'],
  },
  // Feet variants
  {
    id: 'plate_boots',
    name: 'Plate Boots',
    description: 'Armored boots of tempered steel.',
    slot: 'feet',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 3, stealth: -2 },
    value: 150,
    sources: ['shop', 'loot'],
    variantOf: 'combat_boots',
    variantType: 'medieval',
  },
  
  // ============== HANDS - Core Items ==============
  {
    id: 'leather_gloves',
    name: 'Leather Gloves',
    description: 'Sturdy leather gloves for protection and grip.',
    slot: 'hands',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 1 },
    value: 25,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'tactical_gloves',
    name: 'Tactical Gloves',
    description: 'Reinforced gloves with knuckle protection.',
    slot: 'hands',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2, intimidation: 1 },
    value: 65,
    sources: ['shop', 'loot'],
  },
  {
    id: 'fingerless_gloves',
    name: 'Fingerless Gloves',
    description: 'Gloves with exposed fingers for dexterity.',
    slot: 'hands',
    style: 'streetwear',
    rarity: 'common',
    stats: { perception: 1 },
    value: 20,
    sources: ['shop', 'loot'],
  },
  
  // ============== ACCESSORY - Core Items ==============
  {
    id: 'leather_belt',
    name: 'Leather Belt',
    description: 'A sturdy belt for holding gear.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['shop', 'starting'],
  },
  {
    id: 'satchel',
    name: 'Leather Satchel',
    description: 'A practical bag for carrying essentials.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 35,
    sources: ['shop', 'starting'],
  },
  {
    id: 'silver_pendant',
    name: 'Silver Pendant',
    description: 'An ornate silver necklace.',
    slot: 'accessory',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { charisma: 1 },
    value: 100,
    sources: ['shop', 'quest', 'gift'],
  },
  {
    id: 'dog_tags',
    name: 'Dog Tags',
    description: 'Military identification tags on a chain.',
    slot: 'accessory',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['loot', 'starting'],
  },
];

// ============================================================================
// CLOTHING SETS
// ============================================================================
export const CLOTHING_SETS: ClothingSet[] = [
  {
    id: 'street_survivor',
    name: 'Street Survivor',
    description: 'Urban tactical gear for modern operators.',
    pieces: ['leather_jacket', 'cargo_pants', 'combat_boots', 'tactical_gloves'],
    bonuses: [
      { piecesRequired: 2, stats: { defense: 1, stealth: 1 } },
      { piecesRequired: 4, stats: { defense: 3, stealth: 2, intimidation: 2 } },
    ],
  },
  {
    id: 'adventurer_basic',
    name: 'Adventurer\'s Kit',
    description: 'Basic traveling gear for any journey.',
    pieces: ['leather_armor', 'leather_boots', 'leather_gloves', 'travel_cloak'],
    bonuses: [
      { piecesRequired: 2, stats: { defense: 1, perception: 1 } },
      { piecesRequired: 4, stats: { defense: 3, perception: 2, stealth: 1 } },
    ],
  },
  {
    id: 'formal_attire',
    name: 'Formal Attire',
    description: 'Elegant clothing for high society.',
    pieces: ['silk_suit', 'dress_pants', 'dress_shoes'],
    bonuses: [
      { piecesRequired: 2, stats: { charisma: 2 } },
      { piecesRequired: 3, stats: { charisma: 5, luck: 2 } },
    ],
  },
  {
    id: 'combat_ready',
    name: 'Combat Ready',
    description: 'Full tactical combat loadout.',
    pieces: ['tactical_vest', 'cargo_pants', 'combat_boots', 'tactical_helmet', 'tactical_gloves'],
    bonuses: [
      { piecesRequired: 3, stats: { defense: 3, intimidation: 2 } },
      { piecesRequired: 5, stats: { defense: 6, intimidation: 4 } },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getClothingById(id: string): ClothingItem | undefined {
  return CLOTHING_DATABASE.find(item => item.id === id);
}

export function getClothingBySlot(slot: ClothingSlot): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.slot === slot);
}

export function getClothingByStyle(style: ClothingStyle): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.style === style);
}

export function getClothingByRarity(rarity: ClothingRarity): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.rarity === rarity);
}

export function getStarterClothing(): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.sources.includes('starting'));
}

export function getSetById(id: string): ClothingSet | undefined {
  return CLOTHING_SETS.find(set => set.id === id);
}

export function calculateSetBonus(equippedIds: string[], set: ClothingSet): ClothingStats {
  const matchingPieces = equippedIds.filter(id => set.pieces.includes(id)).length;
  
  let totalBonus: ClothingStats = {};
  
  for (const bonus of set.bonuses) {
    if (matchingPieces >= bonus.piecesRequired) {
      totalBonus = { ...totalBonus, ...bonus.stats };
    }
  }
  
  return totalBonus;
}

export function getActiveSetBonuses(equippedIds: string[]): { set: ClothingSet; bonus: ClothingStats }[] {
  const activeBonuses: { set: ClothingSet; bonus: ClothingStats }[] = [];
  
  for (const set of CLOTHING_SETS) {
    const bonus = calculateSetBonus(equippedIds, set);
    if (Object.keys(bonus).length > 0) {
      activeBonuses.push({ set, bonus });
    }
  }
  
  return activeBonuses;
}

/**
 * Get variants of a base clothing item
 */
export function getVariants(baseItemId: string): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => item.variantOf === baseItemId);
}

/**
 * Get all base items (items that are not variants)
 */
export function getBaseItems(): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => !item.variantOf);
}

/**
 * Get all items including variants for a specific base item
 */
export function getItemWithVariants(baseItemId: string): ClothingItem[] {
  const baseItem = getClothingById(baseItemId);
  if (!baseItem) return [];
  
  return [baseItem, ...getVariants(baseItemId)];
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Get color class for rarity
 */
export function getRarityColor(rarity: ClothingRarity): string {
  switch (rarity) {
    case 'common': return 'text-gray-400';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-amber-400';
    default: return 'text-gray-400';
  }
}

/**
 * Get background color class for rarity
 */
export function getRarityBgColor(rarity: ClothingRarity): string {
  switch (rarity) {
    case 'common': return 'bg-gray-500/20 border-gray-500/30';
    case 'uncommon': return 'bg-green-500/20 border-green-500/30';
    case 'rare': return 'bg-blue-500/20 border-blue-500/30';
    case 'epic': return 'bg-purple-500/20 border-purple-500/30';
    case 'legendary': return 'bg-amber-500/20 border-amber-500/30';
    default: return 'bg-gray-500/20 border-gray-500/30';
  }
}

/**
 * Get stat description for display
 */
export function getStatDescription(stat: string, value?: number): string {
  const statNames: Record<string, string> = {
    charisma: 'Charisma - Affects social interactions and persuasion',
    intimidation: 'Intimidation - Makes NPCs more likely to back down',
    defense: 'Defense - Reduces damage taken in combat',
    stealth: 'Stealth - Makes you harder to detect',
    perception: 'Perception - Helps notice hidden details',
    luck: 'Luck - Affects random outcomes and loot',
  };
  
  if (value !== undefined) {
    const prefix = value >= 0 ? '+' : '';
    const shortNames: Record<string, string> = {
      charisma: 'Charisma',
      intimidation: 'Intimidation',
      defense: 'Defense',
      stealth: 'Stealth',
      perception: 'Perception',
      luck: 'Luck',
    };
    return `${prefix}${value} ${shortNames[stat] || stat}`;
  }
  
  return statNames[stat] || stat;
}

/**
 * Get shop inventory - items available for purchase
 */
export function getShopInventory(playerLevel: number = 1, fashionScore: number = 0): ClothingItem[] {
  return CLOTHING_DATABASE.filter(item => {
    // Must be available in shops
    if (!item.sources.includes('shop')) return false;
    
    // Check level requirements
    if (item.requirements?.level && item.requirements.level > playerLevel) return false;
    
    // Check reputation requirements (use fashionScore as reputation proxy)
    if (item.requirements?.reputation && item.requirements.reputation > fashionScore) return false;
    
    return true;
  });
}

/**
 * Calculate total stats from multiple clothing items
 */
export function calculateTotalStats(items: ClothingItem[]): ClothingStats {
  const total: Record<string, number> = {};
  
  for (const item of items) {
    for (const [stat, value] of Object.entries(item.stats)) {
      if (stat === 'genreBonus') continue;
      if (typeof value === 'number') {
        total[stat] = (total[stat] || 0) + value;
      }
    }
  }
  
  return total as ClothingStats;
}
