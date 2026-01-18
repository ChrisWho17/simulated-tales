// Portrait Clothing Mapper - Simplified genre-based starter clothing
// Uses command system for clothing identification instead of AI detection

import { ClothingItem, ClothingSlot, CLOTHING_DATABASE, getClothingById } from './clothingItemSystem';
import { BASIC_CLOTHING } from './starterClothingSystem';

export interface MappedClothingSet {
  items: Partial<Record<ClothingSlot, ClothingItem>>;
  description: string;
  source: 'genre_default';
}

// ============================================================================
// GENRE-BASED STARTER CLOTHING
// Maps genres to appropriate starting clothing item IDs
// ============================================================================

const GENRE_STARTER_CLOTHING: Record<string, {
  torso?: string;
  legs?: string;
  feet?: string;
  head?: string;
  hands?: string;
  accessory?: string;
  description: string;
}> = {
  // Fantasy genres
  fantasy: {
    torso: 'leather_armor',
    legs: 'wool_pants',
    feet: 'leather_boots',
    description: 'Sturdy leather armor with wool breeches and travel boots'
  },
  high_fantasy: {
    torso: 'mage_robes',
    legs: 'cloth_pants',
    feet: 'soft_boots',
    description: 'Flowing mage robes with soft boots for quiet movement'
  },
  dark_fantasy: {
    torso: 'leather_armor',
    legs: 'leather_pants',
    feet: 'leather_boots',
    head: 'leather_hood',
    description: 'Dark leather armor with hooded cloak for shadow work'
  },
  medieval: {
    torso: 'chainmail_shirt',
    legs: 'wool_pants',
    feet: 'leather_boots',
    description: 'Chainmail over wool garments with sturdy boots'
  },
  
  // Modern genres
  modern: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'Casual t-shirt, jeans, and sneakers'
  },
  contemporary: {
    torso: 'leather_jacket',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'Classic leather jacket over casual wear'
  },
  urban_fantasy: {
    torso: 'hoodie',
    legs: 'worn_jeans',
    feet: 'combat_boots',
    description: 'Street clothes with practical combat boots'
  },
  
  // Sci-Fi genres
  scifi: {
    torso: 'flight_suit',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    description: 'Practical flight suit with cargo pants and boots'
  },
  cyberpunk: {
    torso: 'leather_jacket',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    description: 'Leather jacket with tactical gear'
  },
  space_opera: {
    torso: 'flight_suit',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    description: 'Standard issue flight suit with military boots'
  },
  
  // Historical genres
  western: {
    torso: 'leather_jacket',
    legs: 'worn_jeans',
    feet: 'leather_boots',
    head: 'cowboy_hat',
    description: 'Frontier wear with cowboy hat and leather boots'
  },
  pirate: {
    torso: 'plain_tshirt',
    legs: 'wool_pants',
    feet: 'leather_boots',
    head: 'tricorn_hat',
    description: 'Seafarer garb with tricorn and sea boots'
  },
  victorian: {
    torso: 'silk_suit',
    legs: 'dress_pants',
    feet: 'dress_shoes',
    description: 'Fine period attire befitting the era'
  },
  steampunk: {
    torso: 'leather_jacket',
    legs: 'wool_pants',
    feet: 'leather_boots',
    accessory: 'goggles',
    description: 'Victorian-inspired attire with mechanical accessories'
  },
  
  // Dark/Horror genres
  horror: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'Everyday clothes, nothing to draw attention'
  },
  gothic_horror: {
    torso: 'silk_suit',
    legs: 'dress_pants',
    feet: 'dress_shoes',
    description: 'Dark formal attire with an air of mystery'
  },
  
  // Crime/Mystery genres
  noir: {
    torso: 'silk_suit',
    legs: 'dress_pants',
    feet: 'dress_shoes',
    head: 'fedora_noir',
    description: 'Sharp suit with a detective\'s fedora'
  },
  mystery: {
    torso: 'leather_jacket',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'Practical investigator attire'
  },
  
  // Military/Action genres
  war: {
    torso: 'tactical_vest',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    head: 'tactical_helmet',
    description: 'Full tactical combat gear with helmet'
  },
  military: {
    torso: 'tactical_vest',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    description: 'Standard military tactical equipment'
  },
  
  // Post-Apocalyptic
  postapoc: {
    torso: 'leather_jacket',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    description: 'Weathered survival gear patched together'
  },
  apocalyptic: {
    torso: 'leather_armor',
    legs: 'cargo_pants',
    feet: 'combat_boots',
    description: 'Makeshift armor and sturdy boots for the wasteland'
  },
  
  // Romance/Drama
  romance: {
    torso: 'silk_suit',
    legs: 'dress_pants',
    feet: 'dress_shoes',
    description: 'Elegant attire for any occasion'
  },
  
  // Default fallback
  default: {
    torso: 'plain_tshirt',
    legs: 'worn_jeans',
    feet: 'sneakers',
    description: 'Simple, practical everyday clothing'
  }
};

/**
 * Get starter clothing for a genre
 * Returns appropriate items from the clothing database
 */
export function getStarterClothingForGenre(genre: string): MappedClothingSet {
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]/g, '_');
  const config = GENRE_STARTER_CLOTHING[normalizedGenre] || GENRE_STARTER_CLOTHING.default;
  
  const items: Partial<Record<ClothingSlot, ClothingItem>> = {};
  
  // Map each slot to an actual clothing item
  const slots: ClothingSlot[] = ['torso', 'legs', 'feet', 'head', 'hands', 'accessory'];
  
  for (const slot of slots) {
    const itemId = config[slot as keyof typeof config];
    if (itemId && typeof itemId === 'string') {
      const item = getClothingById(itemId) || BASIC_CLOTHING[itemId];
      if (item) {
        items[slot] = item;
      }
    }
  }
  
  return {
    items,
    description: config.description,
    source: 'genre_default'
  };
}

/**
 * Get clothing item by command (from itemPromptCommands system)
 * Links the /command system to actual clothing items
 */
export function getClothingFromCommand(command: string): ClothingItem | null {
  // Map commands to clothing items
  const commandToItem: Record<string, string> = {
    '/jacket': 'leather_jacket',
    '/hoodie': 'hoodie',
    '/coat': 'travel_cloak',
    '/duster': 'leather_jacket', // variant
    '/trenchcoat': 'silk_suit', // formal variant
    '/cargopants': 'cargo_pants',
    '/jeans': 'worn_jeans',
    '/tacticalpants': 'cargo_pants', // variant
    '/combatboots': 'combat_boots',
    '/hikingboots': 'leather_boots', // variant
    '/sneakers': 'sneakers',
    '/gloves': 'leather_gloves',
    '/goggles': 'goggles',
    '/mask': 'bandana', // variant
    '/balaclava': 'leather_hood', // variant
    '/bandana': 'bandana',
    '/backpack': 'satchel', // variant
  };
  
  const normalizedCommand = command.toLowerCase().trim();
  const itemId = commandToItem[normalizedCommand];
  
  if (itemId) {
    return getClothingById(itemId) || null;
  }
  
  return null;
}

/**
 * Build clothing description for AI prompts
 */
export function buildClothingDescription(items: Partial<Record<ClothingSlot, ClothingItem>>): string {
  const descriptions: string[] = [];
  
  const slotOrder: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'accessory'];
  
  for (const slot of slotOrder) {
    const item = items[slot];
    if (item) {
      descriptions.push(item.name.toLowerCase());
    }
  }
  
  if (descriptions.length === 0) {
    return 'simple practical clothing';
  }
  
  return descriptions.join(', ');
}

// Re-export for backwards compatibility
export { GENRE_STARTER_CLOTHING };
