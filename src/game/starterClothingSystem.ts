// Starter Clothing System - Provides genre-appropriate basic clothing for new characters
// Ensures characters always have basic coverage (shirt, pants, shoes) based on their genre

import { ClothingItem, ClothingSlot, CLOTHING_DATABASE, getClothingById } from './clothingItemSystem';

export interface StarterClothingSet {
  genre: string;
  items: {
    torso: ClothingItem;
    legs: ClothingItem;
    feet: ClothingItem;
  };
  description: string;
}

// Define basic clothing items that may not be in the main database
// These are genre-neutral fallbacks
const BASIC_CLOTHING: Record<string, ClothingItem> = {
  basic_shirt: {
    id: 'basic_shirt',
    name: 'Simple Shirt',
    description: 'A basic cotton shirt.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 5,
    sources: ['starting'],
  },
  basic_pants: {
    id: 'basic_pants',
    name: 'Simple Pants',
    description: 'Basic cotton trousers.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 10,
    sources: ['starting'],
  },
  basic_shoes: {
    id: 'basic_shoes',
    name: 'Simple Shoes',
    description: 'Basic leather shoes.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['starting'],
  },
  // Fantasy starters
  peasant_tunic: {
    id: 'peasant_tunic',
    name: 'Peasant Tunic',
    description: 'A simple homespun tunic common among travelers.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 10,
    sources: ['starting'],
  },
  travelers_breeches: {
    id: 'travelers_breeches',
    name: "Traveler's Breeches",
    description: 'Sturdy wool breeches suited for long journeys.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['starting'],
  },
  leather_boots: {
    id: 'leather_boots',
    name: 'Leather Boots',
    description: 'Well-worn leather boots with reinforced soles.',
    slot: 'feet',
    style: 'casual',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 25,
    sources: ['starting'],
  },
  // Sci-Fi starters
  utility_jumpsuit_top: {
    id: 'utility_jumpsuit_top',
    name: 'Utility Jumpsuit (Top)',
    description: 'Standard issue spacecraft crew top.',
    slot: 'torso',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['starting'],
  },
  utility_pants: {
    id: 'utility_pants',
    name: 'Utility Pants',
    description: 'Durable synthetic cargo pants with multiple pockets.',
    slot: 'legs',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['starting'],
  },
  mag_boots: {
    id: 'mag_boots',
    name: 'Mag-Boots',
    description: 'Standard magnetic boots for zero-g environments.',
    slot: 'feet',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 40,
    sources: ['starting'],
  },
  // Western starters
  cotton_work_shirt: {
    id: 'cotton_work_shirt',
    name: 'Cotton Work Shirt',
    description: 'A sturdy cotton shirt with rolled-up sleeves.',
    slot: 'torso',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 12,
    sources: ['starting'],
  },
  denim_trousers: {
    id: 'denim_trousers',
    name: 'Denim Trousers',
    description: 'Rugged denim pants built for hard work.',
    slot: 'legs',
    style: 'casual',
    rarity: 'common',
    stats: {},
    value: 18,
    sources: ['starting'],
  },
  cowboy_boots: {
    id: 'cowboy_boots',
    name: 'Cowboy Boots',
    description: 'Pointed leather boots with worn heels.',
    slot: 'feet',
    style: 'vintage',
    rarity: 'common',
    stats: {},
    value: 35,
    sources: ['starting'],
  },
  // Cyberpunk starters
  synth_jacket: {
    id: 'synth_jacket',
    name: 'Synth-Weave Jacket',
    description: 'A synthetic fabric jacket with subtle LED threading.',
    slot: 'torso',
    style: 'streetwear',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 30,
    sources: ['starting'],
  },
  cargo_joggers: {
    id: 'cargo_joggers',
    name: 'Cargo Joggers',
    description: 'Urban tactical joggers with hidden pockets.',
    slot: 'legs',
    style: 'streetwear',
    rarity: 'common',
    stats: {},
    value: 25,
    sources: ['starting'],
  },
  street_runners: {
    id: 'street_runners',
    name: 'Street Runners',
    description: 'Lightweight sneakers with shock-absorbing soles.',
    slot: 'feet',
    style: 'athletic',
    rarity: 'common',
    stats: { stealth: 1 },
    value: 45,
    sources: ['starting'],
  },
  // Post-apocalyptic starters
  patched_jacket: {
    id: 'patched_jacket',
    name: 'Patched Jacket',
    description: 'A heavily repaired jacket made from salvaged materials.',
    slot: 'torso',
    style: 'punk',
    rarity: 'common',
    stats: { defense: 1 },
    value: 15,
    sources: ['starting'],
  },
  scrap_pants: {
    id: 'scrap_pants',
    name: 'Scrap Pants',
    description: 'Reinforced pants with metal knee guards.',
    slot: 'legs',
    style: 'punk',
    rarity: 'common',
    stats: { defense: 1 },
    value: 20,
    sources: ['starting'],
  },
  wasteland_boots: {
    id: 'wasteland_boots',
    name: 'Wasteland Boots',
    description: 'Tough boots stitched together from various leather scraps.',
    slot: 'feet',
    style: 'punk',
    rarity: 'common',
    stats: {},
    value: 25,
    sources: ['starting'],
  },
  // Horror/Modern starters - use existing database items or casual defaults
  // War starters
  military_undershirt: {
    id: 'military_undershirt',
    name: 'Military Undershirt',
    description: 'Standard issue olive drab undershirt.',
    slot: 'torso',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['starting'],
  },
  bdu_pants: {
    id: 'bdu_pants',
    name: 'BDU Pants',
    description: 'Battle dress uniform trousers with cargo pockets.',
    slot: 'legs',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 25,
    sources: ['starting'],
  },
  jungle_boots: {
    id: 'jungle_boots',
    name: 'Jungle Boots',
    description: 'Military boots with drainage vents and reinforced soles.',
    slot: 'feet',
    style: 'military',
    rarity: 'common',
    stats: {},
    value: 35,
    sources: ['starting'],
  },
  // Pirate starters
  sailor_shirt: {
    id: 'sailor_shirt',
    name: 'Sailor Shirt',
    description: 'A loose-fitting cotton shirt with billowy sleeves.',
    slot: 'torso',
    style: 'vintage',
    rarity: 'common',
    stats: {},
    value: 12,
    sources: ['starting'],
  },
  canvas_breeches: {
    id: 'canvas_breeches',
    name: 'Canvas Breeches',
    description: 'Durable canvas pants cut off below the knee.',
    slot: 'legs',
    style: 'vintage',
    rarity: 'common',
    stats: {},
    value: 15,
    sources: ['starting'],
  },
  deck_shoes: {
    id: 'deck_shoes',
    name: 'Deck Shoes',
    description: 'Leather shoes with non-slip soles for wet decks.',
    slot: 'feet',
    style: 'vintage',
    rarity: 'common',
    stats: {},
    value: 20,
    sources: ['starting'],
  },
};

// Genre-specific starter clothing configurations
const GENRE_STARTERS: Record<string, { torso: string; legs: string; feet: string; description: string }> = {
  fantasy: {
    torso: 'peasant_tunic',
    legs: 'travelers_breeches',
    feet: 'leather_boots',
    description: 'wearing a simple peasant tunic, sturdy breeches, and worn leather boots',
  },
  scifi: {
    torso: 'utility_jumpsuit_top',
    legs: 'utility_pants',
    feet: 'mag_boots',
    description: 'wearing a standard utility jumpsuit and mag-boots',
  },
  western: {
    torso: 'cotton_work_shirt',
    legs: 'denim_trousers',
    feet: 'cowboy_boots',
    description: 'wearing a cotton work shirt, denim trousers, and cowboy boots',
  },
  cyberpunk: {
    torso: 'synth_jacket',
    legs: 'cargo_joggers',
    feet: 'street_runners',
    description: 'wearing a synth-weave jacket, cargo joggers, and street runners',
  },
  postapoc: {
    torso: 'patched_jacket',
    legs: 'scrap_pants',
    feet: 'wasteland_boots',
    description: 'wearing a patched jacket, reinforced scrap pants, and wasteland boots',
  },
  war: {
    torso: 'military_undershirt',
    legs: 'bdu_pants',
    feet: 'jungle_boots',
    description: 'wearing a military undershirt, BDU pants, and jungle boots',
  },
  pirate: {
    torso: 'sailor_shirt',
    legs: 'canvas_breeches',
    feet: 'deck_shoes',
    description: 'wearing a loose sailor shirt, canvas breeches, and deck shoes',
  },
  // Fallback for modern, horror, mystery, noir, etc.
  modern: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'wearing a plain t-shirt, jeans, and sneakers',
  },
  horror: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'wearing casual clothes - a t-shirt, jeans, and sneakers',
  },
  mystery: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'wearing everyday clothes - a simple shirt, pants, and shoes',
  },
  noir: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'wearing a plain shirt, dark pants, and worn shoes',
  },
  steampunk: {
    torso: 'peasant_tunic',
    legs: 'travelers_breeches',
    feet: 'leather_boots',
    description: 'wearing a linen shirt, sturdy trousers, and leather boots',
  },
};

/**
 * Get a clothing item by ID, checking both the main database and basic starters
 */
function getClothingItem(id: string): ClothingItem | undefined {
  return getClothingById(id) || BASIC_CLOTHING[id];
}

/**
 * Get the starter clothing set for a given genre
 */
export function getStarterClothingForGenre(genre: string): StarterClothingSet {
  const config = GENRE_STARTERS[genre.toLowerCase()] || GENRE_STARTERS.modern;
  
  const torso = getClothingItem(config.torso) || BASIC_CLOTHING.basic_shirt;
  const legs = getClothingItem(config.legs) || BASIC_CLOTHING.basic_pants;
  const feet = getClothingItem(config.feet) || BASIC_CLOTHING.basic_shoes;
  
  return {
    genre,
    items: { torso, legs, feet },
    description: config.description,
  };
}

/**
 * Build a clothing description for AI image generation based on equipped items
 * If no equipment is provided, returns genre-appropriate basic clothing description
 */
export function buildClothingDescriptionForAI(
  equippedItems: { slot: ClothingSlot; name: string; description?: string }[],
  genre: string = 'modern'
): string {
  // Check if we have any actual equipped clothing items (torso, legs, feet, outfit)
  const hasActualClothing = equippedItems.some(item => 
    ['torso', 'legs', 'feet', 'outfit'].includes(item.slot)
  );
  
  if (!hasActualClothing || equippedItems.length === 0) {
    // Return genre-appropriate basic clothing
    const starterSet = getStarterClothingForGenre(genre);
    return starterSet.description;
  }
  
  // Build description from equipped items
  const clothingParts: string[] = [];
  
  // Prioritize outfit if present
  const outfit = equippedItems.find(item => item.slot === 'outfit');
  if (outfit) {
    clothingParts.push(outfit.description || outfit.name);
  } else {
    // Build from individual pieces
    const slots: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'accessory'];
    for (const slot of slots) {
      const item = equippedItems.find(i => i.slot === slot);
      if (item) {
        clothingParts.push(item.name);
      }
    }
  }
  
  if (clothingParts.length === 0) {
    const starterSet = getStarterClothingForGenre(genre);
    return starterSet.description;
  }
  
  return `wearing ${clothingParts.join(', ')}`;
}

/**
 * Build a naked description for AI - only used when character is truly unclothed
 * No fallback to underwear - if naked, they're naked
 */
export function getNakedDescription(gender: string = 'male'): string {
  return 'naked, unclothed';
}

/**
 * Check if a character has minimum required clothing equipped
 */
export function hasMinimumClothing(equippedItems: { slot: ClothingSlot }[]): boolean {
  // Need at least torso OR an outfit
  const hasTorso = equippedItems.some(i => i.slot === 'torso');
  const hasOutfit = equippedItems.some(i => i.slot === 'outfit');
  
  return hasTorso || hasOutfit;
}

// Export all basic clothing for use elsewhere
export { BASIC_CLOTHING };
