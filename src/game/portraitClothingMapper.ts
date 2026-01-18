// Portrait Clothing Mapper - Maps AI-detected clothing from portraits to inventory items
// This replaces hardcoded starter clothing with dynamic detection based on generated portraits

import { ClothingItem, ClothingSlot, CLOTHING_DATABASE, getClothingById } from './clothingItemSystem';
import { BASIC_CLOTHING } from './starterClothingSystem';
import { DetectedClothingItem } from '@/services/fluxImageGeneration';

export interface MappedClothingSet {
  items: Partial<Record<ClothingSlot, ClothingItem>>;
  description: string;
  source: 'portrait_detected' | 'genre_fallback';
}

// Extended clothing database for mapping - includes common variations
const CLOTHING_ALIASES: Record<string, string[]> = {
  // Torso variations
  'plain_tshirt': ['t-shirt', 'tshirt', 'shirt', 'top'],
  'basic_shirt': ['shirt', 'blouse', 'top'],
  'peasant_tunic': ['tunic', 'jerkin', 'doublet'],
  'leather_jacket': ['jacket', 'coat', 'outerwear'],
  'synth_jacket': ['jacket', 'synth jacket', 'tech jacket'],
  'utility_jumpsuit_top': ['jumpsuit', 'utility top', 'crew top'],
  'patched_jacket': ['jacket', 'scavenged jacket', 'wasteland jacket'],
  'cotton_work_shirt': ['work shirt', 'cotton shirt', 'ranch shirt'],
  'military_undershirt': ['undershirt', 'military shirt', 'uniform top'],
  'sailor_shirt': ['sailor shirt', 'billowy shirt', 'pirate shirt'],
  'tactical_vest': ['vest', 'tactical vest', 'combat vest', 'armor'],
  
  // Legs variations
  'worn_jeans': ['jeans', 'denim', 'pants'],
  'basic_pants': ['pants', 'trousers', 'slacks'],
  'travelers_breeches': ['breeches', 'leather pants', 'riding pants'],
  'cargo_pants': ['cargo pants', 'tactical pants', 'utility pants'],
  'cargo_joggers': ['joggers', 'cargo joggers', 'street pants'],
  'utility_pants': ['utility pants', 'work pants', 'crew pants'],
  'scrap_pants': ['scrap pants', 'patched pants', 'wasteland pants'],
  'denim_trousers': ['denim', 'jeans', 'work pants'],
  'bdu_pants': ['bdu pants', 'military pants', 'combat pants'],
  'canvas_breeches': ['canvas pants', 'sailor pants', 'deck pants'],
  
  // Feet variations
  'sneakers': ['sneakers', 'running shoes', 'athletic shoes', 'trainers'],
  'basic_shoes': ['shoes', 'footwear'],
  'leather_boots': ['boots', 'leather boots', 'walking boots'],
  'combat_boots': ['combat boots', 'military boots', 'tactical boots'],
  'street_runners': ['runners', 'street shoes', 'urban sneakers'],
  'mag_boots': ['mag-boots', 'magnetic boots', 'space boots'],
  'wasteland_boots': ['wasteland boots', 'scrap boots', 'survivor boots'],
  'cowboy_boots': ['cowboy boots', 'western boots', 'riding boots'],
  'jungle_boots': ['jungle boots', 'military boots', 'combat boots'],
  'deck_shoes': ['deck shoes', 'boat shoes', 'sailing shoes'],
  'heavy_armored_boots': ['armored boots', 'heavy boots', 'plate boots'],
  'dress_shoes': ['dress shoes', 'oxfords', 'formal shoes', 'loafers'],
  
  // Head variations
  'worn_cap': ['cap', 'baseball cap', 'hat'],
  'fedora_noir': ['fedora', 'detective hat', 'trilby'],
  'tactical_helmet': ['helmet', 'tactical helmet', 'combat helmet'],
  
  // Hands variations
  'fingerless_gloves': ['fingerless gloves', 'punk gloves'],
  'tactical_gloves': ['gloves', 'tactical gloves', 'combat gloves', 'gauntlets'],
  
  // Accessories
  'dog_tags': ['dog tags', 'tags', 'military tags'],
};

// Genre-specific item preferences
const GENRE_ITEM_PREFERENCES: Record<string, Partial<Record<ClothingSlot, string[]>>> = {
  fantasy: {
    torso: ['peasant_tunic', 'leather_jacket'],
    legs: ['travelers_breeches', 'basic_pants'],
    feet: ['leather_boots'],
  },
  medieval: {
    torso: ['peasant_tunic'],
    legs: ['travelers_breeches'],
    feet: ['leather_boots'],
  },
  dark_fantasy: {
    torso: ['peasant_tunic', 'leather_jacket'],
    legs: ['travelers_breeches'],
    feet: ['leather_boots', 'combat_boots'],
  },
  cyberpunk: {
    torso: ['synth_jacket', 'leather_jacket'],
    legs: ['cargo_joggers', 'cargo_pants'],
    feet: ['street_runners', 'combat_boots'],
  },
  scifi: {
    torso: ['utility_jumpsuit_top'],
    legs: ['utility_pants'],
    feet: ['mag_boots'],
  },
  western: {
    torso: ['cotton_work_shirt', 'basic_shirt'],
    legs: ['denim_trousers', 'worn_jeans'],
    feet: ['cowboy_boots'],
  },
  modern: {
    torso: ['plain_tshirt', 'basic_shirt'],
    legs: ['worn_jeans', 'basic_pants'],
    feet: ['sneakers'],
  },
  horror: {
    torso: ['plain_tshirt', 'basic_shirt'],
    legs: ['worn_jeans'],
    feet: ['sneakers'],
  },
  noir: {
    torso: ['basic_shirt'],
    legs: ['basic_pants'],
    feet: ['dress_shoes'],
  },
  war: {
    torso: ['military_undershirt', 'tactical_vest'],
    legs: ['bdu_pants', 'cargo_pants'],
    feet: ['jungle_boots', 'combat_boots'],
  },
  postapoc: {
    torso: ['patched_jacket'],
    legs: ['scrap_pants'],
    feet: ['wasteland_boots'],
  },
  steampunk: {
    torso: ['peasant_tunic', 'basic_shirt'],
    legs: ['travelers_breeches'],
    feet: ['leather_boots'],
  },
  pirate: {
    torso: ['sailor_shirt'],
    legs: ['canvas_breeches'],
    feet: ['deck_shoes'],
  },
};

/**
 * Find a clothing item by detected keyword
 */
function findClothingByKeyword(keyword: string, slot: ClothingSlot, genre: string): ClothingItem | undefined {
  const normalizedKeyword = keyword.toLowerCase();
  
  // First, check aliases to find matching item IDs
  for (const [itemId, aliases] of Object.entries(CLOTHING_ALIASES)) {
    if (aliases.some(alias => normalizedKeyword.includes(alias) || alias.includes(normalizedKeyword))) {
      // Found a match - try to get the item
      const item = getClothingById(itemId) || BASIC_CLOTHING[itemId];
      if (item && item.slot === slot) {
        return item;
      }
    }
  }
  
  // Check genre preferences for this slot
  const genrePrefs = GENRE_ITEM_PREFERENCES[genre]?.[slot] || GENRE_ITEM_PREFERENCES.modern?.[slot];
  if (genrePrefs) {
    for (const itemId of genrePrefs) {
      const item = getClothingById(itemId) || BASIC_CLOTHING[itemId];
      if (item) {
        return item;
      }
    }
  }
  
  // Fallback: search the database directly
  const dbItem = CLOTHING_DATABASE.find(item => 
    item.slot === slot && 
    (item.name.toLowerCase().includes(normalizedKeyword) || 
     item.description.toLowerCase().includes(normalizedKeyword))
  );
  
  return dbItem;
}

/**
 * Get default clothing for a slot based on genre
 */
function getDefaultForSlot(slot: ClothingSlot, genre: string): ClothingItem | undefined {
  const genrePrefs = GENRE_ITEM_PREFERENCES[genre] || GENRE_ITEM_PREFERENCES.modern;
  const preferredItems = genrePrefs[slot];
  
  if (preferredItems && preferredItems.length > 0) {
    for (const itemId of preferredItems) {
      const item = getClothingById(itemId) || BASIC_CLOTHING[itemId];
      if (item) return item;
    }
  }
  
  // Ultimate fallbacks
  switch (slot) {
    case 'torso': return BASIC_CLOTHING.basic_shirt;
    case 'legs': return BASIC_CLOTHING.basic_pants;
    case 'feet': return BASIC_CLOTHING.basic_shoes;
    default: return undefined;
  }
}

/**
 * Map detected clothing items from portrait to actual inventory items
 */
export function mapPortraitClothingToInventory(
  detectedItems: DetectedClothingItem[],
  genre: string
): MappedClothingSet {
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]+/g, '_');
  const items: Partial<Record<ClothingSlot, ClothingItem>> = {};
  const descriptions: string[] = [];
  
  // Process each detected item
  for (const detected of detectedItems) {
    const slot = detected.slot as ClothingSlot;
    
    // Skip if we already have an item for this slot (first match wins)
    if (items[slot]) continue;
    
    // Try to find a matching clothing item
    const matchedItem = findClothingByKeyword(detected.item, slot, normalizedGenre);
    
    if (matchedItem) {
      items[slot] = matchedItem;
      descriptions.push(matchedItem.name);
    }
  }
  
  // Ensure minimum coverage (torso, legs, feet)
  const requiredSlots: ClothingSlot[] = ['torso', 'legs', 'feet'];
  for (const slot of requiredSlots) {
    if (!items[slot]) {
      const defaultItem = getDefaultForSlot(slot, normalizedGenre);
      if (defaultItem) {
        items[slot] = defaultItem;
        descriptions.push(defaultItem.name);
      }
    }
  }
  
  return {
    items,
    description: descriptions.length > 0 
      ? `wearing ${descriptions.join(', ')}`
      : 'wearing basic clothing',
    source: detectedItems.length > 0 ? 'portrait_detected' : 'genre_fallback',
  };
}

/**
 * Build a clothing description from mapped items for AI context
 */
export function buildClothingDescriptionFromMapped(mappedSet: MappedClothingSet): string {
  const parts: string[] = [];
  
  const slotOrder: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'accessory'];
  
  for (const slot of slotOrder) {
    const item = mappedSet.items[slot];
    if (item) {
      parts.push(item.name);
    }
  }
  
  // Check for outfit (replaces torso+legs)
  const outfit = mappedSet.items.outfit;
  if (outfit) {
    return `wearing ${outfit.name}`;
  }
  
  return parts.length > 0 ? `wearing ${parts.join(', ')}` : 'wearing basic clothing';
}

/**
 * Convert mapped clothing set to wardrobe-compatible format
 */
export function convertMappedToWardrobe(mappedSet: MappedClothingSet): {
  equippedItems: { itemId: string; slot: ClothingSlot }[];
  ownedItems: ClothingItem[];
} {
  const equippedItems: { itemId: string; slot: ClothingSlot }[] = [];
  const ownedItems: ClothingItem[] = [];
  
  for (const [slot, item] of Object.entries(mappedSet.items)) {
    if (item) {
      equippedItems.push({ itemId: item.id, slot: slot as ClothingSlot });
      ownedItems.push(item);
    }
  }
  
  return { equippedItems, ownedItems };
}

// Export for testing
export { CLOTHING_ALIASES, GENRE_ITEM_PREFERENCES };
