// ============================================================================
// CLOTHING ITEM SYSTEM
// Acquirable clothing with stats, similar to Fallout's armor/clothing system
// ============================================================================

import { GameGenre } from '@/types/genreData';

// ============================================================================
// TYPES
// ============================================================================

export type ClothingSlot = 'head' | 'torso' | 'legs' | 'feet' | 'hands' | 'accessory' | 'outfit';

export interface ClothingStats {
  // Social stats
  charisma?: number;
  intimidation?: number;
  persuasion?: number;
  deception?: number;
  
  // Physical stats
  defense?: number;
  stealth?: number;
  agility?: number;
  endurance?: number;
  
  // Environmental
  coldResistance?: number;
  heatResistance?: number;
  radiationResistance?: number;
  
  // Special
  luck?: number;
  perception?: number;
  intelligence?: number;
  
  // Genre-specific bonuses
  genreBonus?: Partial<Record<GameGenre, number>>;
}

export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  slot: ClothingSlot;
  style: string;
  stats: ClothingStats;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  value: number;
  weight: number;
  sources: ClothingSource[];
  levelRequired?: number;
  reputationRequired?: number;
  icon?: string;
  visualDetails?: string[];
  setId?: string;
  genreBonuses?: Partial<Record<GameGenre, number>>;
}
  
  // Acquisition
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  value: number;
  weight: number;
  
  // Where it can be found
  sources: ClothingSource[];
  
  // Requirements
  levelRequired?: number;
  reputationRequired?: number;
  
  // Appearance
  icon?: string;
  visualDetails?: string[];
  
  // Set bonus
  setId?: string;
}

export interface ClothingSource {
  type: 'shop' | 'loot' | 'quest' | 'craft' | 'special';
  location?: string;
  npcSeller?: string;
  price?: number;
  dropChance?: number;
  questId?: string;
}

export interface ClothingSet {
  id: string;
  name: string;
  pieces: string[]; // Item IDs
  bonuses: {
    piecesRequired: number;
    stats: ClothingStats;
    specialEffect?: string;
  }[];
}

// ============================================================================
// CLOTHING DATABASE
// ============================================================================

export const CLOTHING_ITEMS: ClothingItem[] = [
  // ========== COMMON ITEMS ==========
  {
    id: 'basic_tunic',
    name: 'Basic Tunic',
    description: 'A simple, well-worn tunic. Nothing special, but it keeps you decent.',
    slot: 'torso',
    style: 'casual',
    stats: {},
    rarity: 'common',
    value: 5,
    weight: 0.5,
    sources: [
      { type: 'shop', location: 'general_store', price: 5 },
      { type: 'loot', dropChance: 0.3 }
    ]
  },
  {
    id: 'leather_boots',
    name: 'Leather Boots',
    description: 'Sturdy leather boots, good for walking long distances.',
    slot: 'feet',
    style: 'casual',
    stats: { agility: 1, endurance: 1 },
    rarity: 'common',
    value: 15,
    weight: 1,
    sources: [
      { type: 'shop', location: 'cobbler', price: 15 },
      { type: 'loot', dropChance: 0.2 }
    ]
  },
  {
    id: 'cloth_cap',
    name: 'Cloth Cap',
    description: 'A simple cap that keeps the sun out of your eyes.',
    slot: 'head',
    style: 'casual',
    stats: { perception: 1 },
    rarity: 'common',
    value: 3,
    weight: 0.1,
    sources: [{ type: 'shop', price: 3 }, { type: 'loot', dropChance: 0.4 }]
  },
  
  // ========== UNCOMMON ITEMS ==========
  {
    id: 'merchants_coat',
    name: "Merchant's Fine Coat",
    description: 'A well-tailored coat that makes you look trustworthy and prosperous.',
    slot: 'torso',
    style: 'formal',
    stats: { charisma: 3, persuasion: 2, deception: 1 },
    rarity: 'uncommon',
    value: 75,
    weight: 1.5,
    sources: [
      { type: 'shop', location: 'tailor', price: 75 },
      { type: 'quest', questId: 'help_merchant' }
    ]
  },
  {
    id: 'leather_duster',
    name: 'Leather Duster',
    description: 'A long leather coat that billows dramatically. Popular with gunslingers.',
    slot: 'torso',
    style: 'vintage',
    stats: { intimidation: 2, defense: 1, coldResistance: 2 },
    rarity: 'uncommon',
    value: 60,
    weight: 2,
    sources: [
      { type: 'shop', location: 'outfitter', price: 60 },
      { type: 'loot', dropChance: 0.1 }
    ],
    genreBonuses: { western: 3 }
  },
  {
    id: 'noble_attire',
    name: 'Noble Attire',
    description: 'Elegant clothing befitting minor nobility. Opens doors in high society.',
    slot: 'outfit',
    style: 'formal',
    stats: { charisma: 4, persuasion: 3, intimidation: -1 },
    rarity: 'uncommon',
    value: 150,
    weight: 2,
    sources: [{ type: 'shop', location: 'noble_district', price: 150 }],
    reputationRequired: 10
  },
  {
    id: 'tactical_vest',
    name: 'Tactical Vest',
    description: 'Military-grade protective vest with multiple pouches.',
    slot: 'torso',
    style: 'military',
    stats: { defense: 4, endurance: 2, agility: -1 },
    rarity: 'uncommon',
    value: 120,
    weight: 4,
    sources: [
      { type: 'shop', location: 'military_surplus', price: 120 },
      { type: 'loot', dropChance: 0.05 }
    ]
  },
  {
    id: 'stealth_cloak',
    name: 'Stealth Cloak',
    description: 'A dark, hooded cloak that helps you blend into shadows.',
    slot: 'torso',
    style: 'goth',
    stats: { stealth: 4, perception: 1, charisma: -1 },
    rarity: 'uncommon',
    value: 80,
    weight: 1,
    sources: [
      { type: 'shop', location: 'black_market', price: 80 },
      { type: 'loot', dropChance: 0.08 }
    ]
  },
  
  // ========== RARE ITEMS ==========
  {
    id: 'diplomats_suit',
    name: "Diplomat's Suit",
    description: 'An impeccably tailored suit that commands respect in any room.',
    slot: 'outfit',
    style: 'formal',
    stats: { charisma: 6, persuasion: 5, deception: 3, intelligence: 2 },
    rarity: 'rare',
    value: 500,
    weight: 2,
    sources: [{ type: 'quest', questId: 'diplomatic_mission' }],
    reputationRequired: 25
  },
  {
    id: 'combat_armor',
    name: 'Combat Armor',
    description: 'Heavy-duty armor designed for frontline combat.',
    slot: 'outfit',
    style: 'military',
    stats: { defense: 8, endurance: 3, agility: -3, stealth: -2 },
    rarity: 'rare',
    value: 400,
    weight: 10,
    sources: [
      { type: 'loot', dropChance: 0.02 },
      { type: 'quest', questId: 'military_contract' }
    ],
    levelRequired: 10
  },
  {
    id: 'street_legend_jacket',
    name: 'Street Legend Jacket',
    description: 'A custom jacket worn by someone who made their name on the streets.',
    slot: 'torso',
    style: 'streetwear',
    stats: { intimidation: 5, charisma: 3, luck: 2 },
    rarity: 'rare',
    value: 300,
    weight: 1.5,
    sources: [{ type: 'special' }],
    reputationRequired: 30
  },
  {
    id: 'enchanted_robes',
    name: 'Enchanted Robes',
    description: 'Robes imbued with mystical energy, glowing faintly in darkness.',
    slot: 'outfit',
    style: 'vintage',
    stats: { intelligence: 5, perception: 3, coldResistance: 3, charisma: 2 },
    rarity: 'rare',
    value: 450,
    weight: 1.5,
    sources: [{ type: 'quest', questId: 'mage_trial' }],
    genreBonuses: { fantasy: 5 }
  },
  
  // ========== LEGENDARY ITEMS ==========
  {
    id: 'emperors_regalia',
    name: "Emperor's Regalia",
    description: 'Clothing fit for royalty. All who see you know you are someone of great importance.',
    slot: 'outfit',
    style: 'extravagant',
    stats: { charisma: 10, persuasion: 8, intimidation: 5, intelligence: 3, luck: 3 },
    rarity: 'legendary',
    value: 2000,
    weight: 3,
    sources: [{ type: 'special' }],
    reputationRequired: 50,
    setId: 'imperial_set'
  },
  {
    id: 'shadow_assassin_garb',
    name: 'Shadow Assassin Garb',
    description: 'Legendary outfit worn by the deadliest killers. Seems to drink in the light.',
    slot: 'outfit',
    style: 'goth',
    stats: { stealth: 10, agility: 6, perception: 4, intimidation: 3, defense: 2 },
    rarity: 'legendary',
    value: 1500,
    weight: 1,
    sources: [{ type: 'quest', questId: 'assassin_master' }],
    levelRequired: 20
  },
  {
    id: 'power_armor_frame',
    name: 'Power Armor Frame',
    description: 'Advanced exoskeleton providing unmatched protection and strength.',
    slot: 'outfit',
    style: 'military',
    stats: { defense: 15, endurance: 8, intimidation: 6, agility: -5, stealth: -8 },
    rarity: 'legendary',
    value: 3000,
    weight: 25,
    sources: [{ type: 'quest', questId: 'advanced_tech' }],
    levelRequired: 25,
    genreBonuses: { scifi: 5, postapoc: 5 }
  },
];

export const CLOTHING_SETS: ClothingSet[] = [
  {
    id: 'imperial_set',
    name: 'Imperial Regalia',
    pieces: ['emperors_regalia', 'imperial_crown', 'imperial_scepter'],
    bonuses: [
      { piecesRequired: 2, stats: { charisma: 3, intimidation: 2 } },
      { piecesRequired: 3, stats: { charisma: 5, persuasion: 5 }, specialEffect: 'Commands absolute authority in social encounters' }
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getClothingById(id: string): ClothingItem | undefined {
  return CLOTHING_ITEMS.find(item => item.id === id);
}

export function getClothingByStyle(style: string): ClothingItem[] {
  return CLOTHING_ITEMS.filter(item => item.style === style);
}

export function getClothingBySlot(slot: ClothingSlot): ClothingItem[] {
  return CLOTHING_ITEMS.filter(item => item.slot === slot);
}

export function getClothingByRarity(rarity: ClothingItem['rarity']): ClothingItem[] {
  return CLOTHING_ITEMS.filter(item => item.rarity === rarity);
}

export function getShopInventory(shopType: string, playerLevel: number = 1, reputation: number = 0): ClothingItem[] {
  return CLOTHING_ITEMS.filter(item => {
    const hasSource = item.sources.some(s => 
      s.type === 'shop' && (!s.location || s.location === shopType)
    );
    const meetsLevel = !item.levelRequired || playerLevel >= item.levelRequired;
    const meetsRep = !item.reputationRequired || reputation >= item.reputationRequired;
    return hasSource && meetsLevel && meetsRep;
  });
}

export function rollLootDrop(playerLevel: number = 1): ClothingItem | null {
  const eligibleItems = CLOTHING_ITEMS.filter(item => {
    const hasLootSource = item.sources.some(s => s.type === 'loot');
    const meetsLevel = !item.levelRequired || playerLevel >= item.levelRequired;
    return hasLootSource && meetsLevel;
  });
  
  for (const item of eligibleItems) {
    const lootSource = item.sources.find(s => s.type === 'loot');
    if (lootSource?.dropChance && Math.random() < lootSource.dropChance) {
      return item;
    }
  }
  
  return null;
}

export function calculateTotalStats(equippedItems: ClothingItem[], genre?: string): ClothingStats {
  const totals: ClothingStats = {};
  
  for (const item of equippedItems) {
    for (const [stat, value] of Object.entries(item.stats)) {
      if (stat === 'genreBonus') continue;
      const current = (totals as any)[stat] || 0;
      (totals as any)[stat] = current + (value as number);
    }
    
    // Apply genre bonus if applicable
    if (genre && item.genreBonuses) {
      const bonus = item.genreBonuses[genre as GameGenre];
      if (bonus) {
        totals.charisma = (totals.charisma || 0) + bonus;
      }
    }
  }
  
  return totals;
}

export function getStatDescription(stat: keyof ClothingStats): string {
  const descriptions: Record<string, string> = {
    charisma: 'Affects first impressions and general likability',
    intimidation: 'Makes NPCs more likely to back down or comply out of fear',
    persuasion: 'Improves success in convincing others',
    deception: 'Helps when lying or bluffing',
    defense: 'Reduces damage from attacks',
    stealth: 'Makes you harder to detect',
    agility: 'Improves movement and reaction speed',
    endurance: 'Increases stamina and resistance to fatigue',
    coldResistance: 'Protection from cold environments',
    heatResistance: 'Protection from hot environments',
    radiationResistance: 'Protection from radiation',
    luck: 'Increases chance of favorable random events',
    perception: 'Improves ability to notice things',
    intelligence: 'Unlocks dialogue options and skill checks'
  };
  return descriptions[stat] || stat;
}

export function getRarityColor(rarity: ClothingItem['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-muted-foreground';
    case 'uncommon': return 'text-success';
    case 'rare': return 'text-primary';
    case 'legendary': return 'text-warning';
    default: return 'text-foreground';
  }
}

export function getRarityBgColor(rarity: ClothingItem['rarity']): string {
  switch (rarity) {
    case 'common': return 'bg-muted/30';
    case 'uncommon': return 'bg-success/10';
    case 'rare': return 'bg-primary/10';
    case 'legendary': return 'bg-warning/10';
    default: return 'bg-muted';
  }
}
