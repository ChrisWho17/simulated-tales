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

// ============================================================================
// EXPANDED CLOTHING DATABASE - Genre-Diverse Items
// ============================================================================
export const CLOTHING_DATABASE: ClothingItem[] = [
  // ============== HEAD ==============
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
    id: 'heavy_combat_helmet',
    name: 'Heavy Combat Helmet',
    description: 'Reinforced ballistic helmet with full face guard.',
    slot: 'head',
    style: 'military',
    rarity: 'epic',
    stats: { defense: 5, intimidation: 3, stealth: -3, perception: -2 },
    value: 500,
    sources: ['loot', 'quest'],
    requirements: { level: 6 },
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
  // Fantasy head items
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
    id: 'ranger_hood',
    name: 'Ranger Hood',
    description: 'A weathered hood favored by forest scouts and hunters.',
    slot: 'head',
    style: 'casual',
    rarity: 'uncommon',
    stats: { stealth: 2, perception: 1 },
    value: 45,
    sources: ['shop', 'loot'],
  },
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
  },
  {
    id: 'elven_circlet',
    name: 'Elven Circlet',
    description: 'A delicate silver circlet with leaf motifs.',
    slot: 'head',
    style: 'elegant',
    rarity: 'rare',
    stats: { charisma: 2, perception: 2 },
    value: 200,
    sources: ['quest', 'loot'],
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
    id: 'steel_helm',
    name: 'Steel Knight Helm',
    description: 'A polished steel helmet with visor.',
    slot: 'head',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 4, perception: -2 },
    value: 180,
    sources: ['shop', 'loot'],
  },
  {
    id: 'cyber_visor',
    name: 'Cyber-Optic Visor',
    description: 'AR-enabled visor with threat detection.',
    slot: 'head',
    style: 'streetwear',
    rarity: 'uncommon',
    stats: { perception: 2 },
    value: 100,
    sources: ['shop', 'loot'],
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
    id: 'flower_crown',
    name: 'Flower Crown',
    description: 'A delicate crown woven from fresh wildflowers.',
    slot: 'head',
    style: 'elegant',
    rarity: 'common',
    stats: { charisma: 1 },
    value: 15,
    sources: ['craft', 'gift'],
  },
  {
    id: 'beret',
    name: 'Woolen Beret',
    description: 'A stylish woolen cap tilted to one side.',
    slot: 'head',
    style: 'casual',
    rarity: 'common',
    stats: { charisma: 1 },
    value: 25,
    sources: ['shop'],
  },

  // ============== TORSO ==============
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
    id: 'heavy_plate_carrier',
    name: 'Heavy Plate Carrier',
    description: 'Military-grade ballistic armor with ceramic plates.',
    slot: 'torso',
    style: 'military',
    rarity: 'epic',
    stats: { defense: 8, intimidation: 3, stealth: -4 },
    value: 800,
    sources: ['loot', 'quest'],
    requirements: { level: 5 },
  },
  {
    id: 'riot_armor',
    name: 'Riot Control Armor',
    description: 'Full tactical armor designed for crowd control.',
    slot: 'torso',
    style: 'military',
    rarity: 'legendary',
    stats: { defense: 12, intimidation: 5, stealth: -6, perception: -1 },
    value: 2000,
    sources: ['quest'],
    requirements: { level: 8 },
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
  // Fantasy torso items
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
    id: 'ranger_leather',
    name: 'Ranger Leather Armor',
    description: 'Well-worn leather armor with forest camouflage patterns.',
    slot: 'torso',
    style: 'casual',
    rarity: 'uncommon',
    stats: { defense: 2, stealth: 2, perception: 1 },
    value: 95,
    sources: ['shop', 'loot'],
  },
  {
    id: 'studded_leather',
    name: 'Studded Leather Armor',
    description: 'Leather armor reinforced with metal studs.',
    slot: 'torso',
    style: 'casual',
    rarity: 'uncommon',
    stats: { defense: 3, intimidation: 1 },
    value: 85,
    sources: ['shop', 'loot'],
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
    id: 'scale_mail',
    name: 'Scale Mail Armor',
    description: 'Overlapping metal scales provide excellent protection.',
    slot: 'torso',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 5, stealth: -2 },
    value: 220,
    sources: ['shop', 'loot'],
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
  },
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
    id: 'hunters_vest',
    name: "Hunter's Vest",
    description: 'A practical leather vest with many pockets.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: { perception: 1 },
    value: 40,
    sources: ['shop', 'loot'],
  },
  {
    id: 'gambeson',
    name: 'Quilted Gambeson',
    description: 'Padded armor worn under heavier protection.',
    slot: 'torso',
    style: 'military',
    rarity: 'common',
    stats: { defense: 2 },
    value: 60,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'brigandine',
    name: 'Brigandine Armor',
    description: 'Leather armor with riveted steel plates inside.',
    slot: 'torso',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 5, stealth: -1 },
    value: 280,
    sources: ['shop', 'loot'],
  },
  {
    id: 'leather_corset',
    name: 'Leather Corset',
    description: 'A fitted leather corset providing light protection.',
    slot: 'torso',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { defense: 1, charisma: 2 },
    value: 70,
    sources: ['shop', 'loot'],
  },
  {
    id: 'bikini_armor',
    name: 'Ornate Battle Attire',
    description: 'Decorative armor that prioritizes mobility over coverage.',
    slot: 'torso',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { charisma: 3, defense: 1 },
    value: 100,
    sources: ['shop', 'loot'],
  },
  {
    id: 'jerkin',
    name: 'Leather Jerkin',
    description: 'A sleeveless leather vest worn over a tunic.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 1 },
    value: 30,
    sources: ['shop', 'starting'],
  },
  {
    id: 'fur_vest',
    name: 'Fur-Lined Vest',
    description: 'A warm vest lined with animal fur.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 35,
    sources: ['shop', 'loot'],
  },
  {
    id: 'druid_robes',
    name: 'Druid Robes',
    description: 'Natural-toned robes adorned with leaves and vines.',
    slot: 'torso',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { stealth: 2, perception: 1 },
    value: 80,
    sources: ['quest'],
  },
  {
    id: 'assassin_garb',
    name: 'Assassin Garb',
    description: 'Dark, close-fitting clothes designed for silent movement.',
    slot: 'torso',
    style: 'casual',
    rarity: 'rare',
    stats: { stealth: 4, defense: 1 },
    value: 200,
    sources: ['quest', 'loot'],
  },
  {
    id: 'noble_doublet',
    name: 'Noble Doublet',
    description: 'An elegant embroidered doublet of fine silk.',
    slot: 'torso',
    style: 'formal',
    rarity: 'uncommon',
    stats: { charisma: 3 },
    value: 120,
    sources: ['shop'],
  },
  {
    id: 'pirate_coat',
    name: 'Pirate Captain Coat',
    description: 'A dramatic long coat with gold trim.',
    slot: 'torso',
    style: 'vintage',
    rarity: 'uncommon',
    stats: { charisma: 2, intimidation: 1 },
    value: 100,
    sources: ['shop', 'loot'],
  },
  {
    id: 'linen_shirt',
    name: 'Linen Shirt',
    description: 'A simple linen shirt with loose sleeves.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['shop', 'starting'],
  },
  {
    id: 'cloth_wrap_top',
    name: 'Cloth Wrap',
    description: 'Simple cloth wrappings bound around the torso.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 8,
    sources: ['starting'],
  },
  {
    id: 'cyber_jacket',
    name: 'Neon-Trim Jacket',
    description: 'A sleek jacket with LED piping along the seams.',
    slot: 'torso',
    style: 'streetwear',
    rarity: 'uncommon',
    stats: { charisma: 2 },
    value: 90,
    sources: ['shop', 'loot'],
  },
  {
    id: 'hoodie',
    name: 'Dark Hoodie',
    description: 'A comfortable hooded sweatshirt.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 35,
    sources: ['shop', 'starting'],
  },
  {
    id: 'duster_coat',
    name: 'Long Duster Coat',
    description: 'A long weathered coat that sweeps to the ankles.',
    slot: 'torso',
    style: 'vintage',
    rarity: 'uncommon',
    stats: { charisma: 1, defense: 1 },
    value: 85,
    sources: ['shop', 'loot'],
  },
  {
    id: 'crop_top',
    name: 'Crop Top',
    description: 'A short top that shows the midriff.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['shop'],
  },
  {
    id: 'tank_top',
    name: 'Tank Top',
    description: 'A sleeveless athletic top.',
    slot: 'torso',
    style: 'athletic',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['shop', 'starting'],
  },
  {
    id: 'breastplate',
    name: 'Steel Breastplate',
    description: 'A polished steel breastplate with shoulder guards.',
    slot: 'torso',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 6, stealth: -2 },
    value: 350,
    sources: ['shop', 'loot'],
  },

  // ============== LEGS ==============
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
  // Fantasy leg items
  {
    id: 'leather_pants',
    name: 'Leather Pants',
    description: 'Fitted leather pants providing some protection.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 1, stealth: 1 },
    value: 40,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'chainmail_leggings',
    name: 'Chainmail Leggings',
    description: 'Protective leg armor made of interlocking rings.',
    slot: 'legs',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 3, stealth: -1 },
    value: 120,
    sources: ['shop', 'loot'],
  },
  {
    id: 'plate_greaves',
    name: 'Plate Leg Armor',
    description: 'Full plate protection for the legs.',
    slot: 'legs',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 5, stealth: -2 },
    value: 250,
    sources: ['shop', 'loot'],
  },
  {
    id: 'cloth_pants',
    name: 'Simple Cloth Pants',
    description: 'Basic cloth trousers.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 12,
    sources: ['shop', 'starting'],
  },
  {
    id: 'wool_breeches',
    name: 'Wool Breeches',
    description: 'Warm woolen breeches for cold climates.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 25,
    sources: ['shop', 'starting'],
  },
  {
    id: 'ranger_leggings',
    name: 'Ranger Leggings',
    description: 'Reinforced leather leggings with knee guards.',
    slot: 'legs',
    style: 'casual',
    rarity: 'uncommon',
    stats: { defense: 2, stealth: 1 },
    value: 75,
    sources: ['shop', 'loot'],
  },
  {
    id: 'skirt',
    name: 'Simple Skirt',
    description: 'A practical knee-length skirt.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['shop', 'starting'],
  },
  {
    id: 'battle_skirt',
    name: 'Armored Battle Skirt',
    description: 'A reinforced skirt with metal plates.',
    slot: 'legs',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2 },
    value: 80,
    sources: ['shop', 'loot'],
  },
  {
    id: 'loincloth',
    name: 'Simple Loincloth',
    description: 'Basic cloth covering.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 5,
    sources: ['starting'],
  },
  {
    id: 'shorts',
    name: 'Casual Shorts',
    description: 'Comfortable short pants.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 18,
    sources: ['shop', 'starting'],
  },
  {
    id: 'leather_tassets',
    name: 'Leather Tassets',
    description: 'Armored leather skirt-like protection for the thighs.',
    slot: 'legs',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2 },
    value: 65,
    sources: ['shop', 'loot'],
  },
  {
    id: 'cyber_pants',
    name: 'Tech-Weave Pants',
    description: 'Pants with integrated data ports and hidden pockets.',
    slot: 'legs',
    style: 'streetwear',
    rarity: 'uncommon',
    stats: { stealth: 1 },
    value: 70,
    sources: ['shop', 'loot'],
  },
  {
    id: 'leggings',
    name: 'Fitted Leggings',
    description: 'Stretchy fitted leggings.',
    slot: 'legs',
    style: 'athletic',
    rarity: 'common',
    stats: {},
    value: 25,
    sources: ['shop'],
  },
  {
    id: 'flowing_skirt',
    name: 'Flowing Long Skirt',
    description: 'An elegant floor-length skirt.',
    slot: 'legs',
    style: 'elegant',
    rarity: 'common',
    stats: { charisma: 1 },
    value: 35,
    sources: ['shop'],
  },

  // ============== FEET ==============
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
    stats: { defense: 2, intimidation: 1, stealth: -1 },
    value: 110,
    sources: ['shop', 'loot'],
  },
  {
    id: 'heavy_armored_boots',
    name: 'Heavy Armored Boots',
    description: 'Reinforced tactical boots with ankle protection.',
    slot: 'feet',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 4, intimidation: 2, stealth: -3 },
    value: 280,
    sources: ['loot', 'quest'],
    requirements: { level: 4 },
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
  // Fantasy foot items
  {
    id: 'leather_boots',
    name: 'Leather Boots',
    description: 'Sturdy leather boots for long journeys.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 35,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'high_boots',
    name: 'Knee-High Boots',
    description: 'Tall leather boots reaching to the knee.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 1 },
    value: 45,
    sources: ['shop', 'loot'],
  },
  {
    id: 'plate_boots',
    name: 'Plate Sabatons',
    description: 'Heavy plate armor for the feet.',
    slot: 'feet',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 4, stealth: -2 },
    value: 180,
    sources: ['shop', 'loot'],
  },
  {
    id: 'soft_boots',
    name: 'Soft Leather Boots',
    description: 'Quiet boots for stealthy movement.',
    slot: 'feet',
    style: 'casual',
    rarity: 'uncommon',
    stats: { stealth: 2 },
    value: 55,
    sources: ['shop', 'loot'],
  },
  {
    id: 'sandals',
    name: 'Simple Sandals',
    description: 'Basic leather sandals.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 10,
    sources: ['shop', 'starting'],
  },
  {
    id: 'elven_boots',
    name: 'Elven Boots',
    description: 'Beautifully crafted boots that make no sound.',
    slot: 'feet',
    style: 'elegant',
    rarity: 'rare',
    stats: { stealth: 3 },
    value: 250,
    sources: ['quest', 'loot'],
  },
  {
    id: 'thigh_high_boots',
    name: 'Thigh-High Boots',
    description: 'Tall fitted boots reaching to mid-thigh.',
    slot: 'feet',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { charisma: 2 },
    value: 85,
    sources: ['shop'],
  },
  {
    id: 'fur_boots',
    name: 'Fur-Lined Boots',
    description: 'Warm boots lined with animal fur.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 40,
    sources: ['shop', 'loot'],
  },
  {
    id: 'barefoot',
    name: 'Barefoot',
    description: 'No footwear equipped.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 0,
    sources: ['starting'],
  },
  {
    id: 'heeled_boots',
    name: 'Heeled Boots',
    description: 'Stylish boots with a raised heel.',
    slot: 'feet',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { charisma: 2 },
    value: 75,
    sources: ['shop'],
  },

  // ============== HANDS ==============
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
  // Fantasy hand items
  {
    id: 'leather_gloves',
    name: 'Leather Gloves',
    description: 'Simple leather work gloves.',
    slot: 'hands',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['shop', 'starting'],
  },
  {
    id: 'leather_bracers',
    name: 'Leather Bracers',
    description: 'Forearm guards made of hardened leather.',
    slot: 'hands',
    style: 'casual',
    rarity: 'common',
    stats: { defense: 1 },
    value: 30,
    sources: ['shop', 'loot', 'starting'],
  },
  {
    id: 'metal_bracers',
    name: 'Metal Bracers',
    description: 'Sturdy metal forearm guards.',
    slot: 'hands',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2 },
    value: 60,
    sources: ['shop', 'loot'],
  },
  {
    id: 'plate_gauntlets',
    name: 'Plate Gauntlets',
    description: 'Full plate armor for the hands and forearms.',
    slot: 'hands',
    style: 'military',
    rarity: 'rare',
    stats: { defense: 3, intimidation: 1 },
    value: 150,
    sources: ['shop', 'loot'],
  },
  {
    id: 'archer_gloves',
    name: 'Archer Gloves',
    description: 'Fitted gloves designed for drawing bowstrings.',
    slot: 'hands',
    style: 'casual',
    rarity: 'common',
    stats: { perception: 1 },
    value: 25,
    sources: ['shop', 'loot'],
  },
  {
    id: 'cloth_wraps',
    name: 'Hand Wraps',
    description: 'Simple cloth wrapped around the hands.',
    slot: 'hands',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 5,
    sources: ['starting'],
  },
  {
    id: 'ornate_bracers',
    name: 'Ornate Bracers',
    description: 'Decorative bracers with intricate engravings.',
    slot: 'hands',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { charisma: 1, defense: 1 },
    value: 80,
    sources: ['shop', 'loot'],
  },

  // ============== ACCESSORIES ==============
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
  // Fantasy accessories
  {
    id: 'leather_belt',
    name: 'Leather Belt',
    description: 'A sturdy belt with brass buckle.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['shop', 'starting'],
  },
  {
    id: 'adventurer_belt',
    name: "Adventurer's Belt",
    description: 'A belt with multiple pouches and loops.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: { perception: 1 },
    value: 35,
    sources: ['shop', 'loot'],
  },
  {
    id: 'quiver',
    name: 'Leather Quiver',
    description: 'A back-worn quiver for holding arrows.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 30,
    sources: ['shop', 'starting'],
  },
  {
    id: 'shoulder_cape',
    name: 'Shoulder Cape',
    description: 'A short cape draped over one shoulder.',
    slot: 'accessory',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { charisma: 1 },
    value: 50,
    sources: ['shop', 'loot'],
  },
  {
    id: 'pendant',
    name: 'Simple Pendant',
    description: 'A small pendant on a leather cord.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['shop', 'gift'],
  },
  {
    id: 'amulet',
    name: 'Protective Amulet',
    description: 'An amulet said to ward off evil.',
    slot: 'accessory',
    style: 'elegant',
    rarity: 'uncommon',
    stats: { luck: 1 },
    value: 75,
    sources: ['shop', 'quest'],
  },
  {
    id: 'shoulder_armor',
    name: 'Shoulder Pauldrons',
    description: 'Protective armor plates for the shoulders.',
    slot: 'accessory',
    style: 'military',
    rarity: 'uncommon',
    stats: { defense: 2, intimidation: 1 },
    value: 90,
    sources: ['shop', 'loot'],
  },
  {
    id: 'sash',
    name: 'Decorative Sash',
    description: 'A colored sash worn across the chest.',
    slot: 'accessory',
    style: 'elegant',
    rarity: 'common',
    stats: { charisma: 1 },
    value: 25,
    sources: ['shop'],
  },
  {
    id: 'bandolier',
    name: 'Leather Bandolier',
    description: 'A strap with loops for carrying ammunition or potions.',
    slot: 'accessory',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 35,
    sources: ['shop', 'loot'],
  },
  {
    id: 'scarf',
    name: 'Wool Scarf',
    description: 'A warm woolen scarf.',
    slot: 'accessory',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['shop'],
  },
  {
    id: 'choker',
    name: 'Leather Choker',
    description: 'A fitted leather band worn around the neck.',
    slot: 'accessory',
    style: 'punk',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['shop'],
  },
];

// ============================================================================
// CLOTHING SETS
// ============================================================================
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
