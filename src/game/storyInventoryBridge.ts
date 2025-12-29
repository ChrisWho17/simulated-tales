// ============================================================================
// STORY-INVENTORY BRIDGE - Connects narrative with inventory system
// Fixes: Story mentions items but inventory is empty
// ============================================================================

import { GameGenre } from '@/types/genreData';
import { 
  detectItemType, 
  GeneratedItem,
  WeaponType,
  ApparelType,
} from './itemCategorySystem';
import { 
  BASE_WEAPON_STATS, 
  COMPATIBLE_SLOTS_BY_TYPE, 
  EQUIP_SLOTS_BY_WEAPON_TYPE, 
  DEFAULT_CALIBERS 
} from './weaponModsSystem';
import { InventoryItem, InventoryState, EquippedState } from './inventorySystem';

// ============================================================================
// STARTING GEAR DEFINITIONS BY GENRE
// ============================================================================

export interface StartingGearItem {
  name: string;
  category: 'weapons' | 'apparel' | 'aid' | 'ammo' | 'keyItems' | 'misc';
  weaponType?: WeaponType;
  apparelType?: ApparelType;
  description?: string;
  quantity?: number;
  autoEquip?: string; // Slot to auto-equip to
}

export interface GenreStartingGear {
  default: StartingGearItem[];
  [characterClass: string]: StartingGearItem[];
}

export const STARTING_GEAR: Record<string, GenreStartingGear> = {
  // Modern/War genres
  war: {
    default: [
      { name: 'Service Rifle', category: 'weapons', weaponType: 'rifle', autoEquip: 'primaryWeapon', description: 'Standard issue military rifle, well-maintained.' },
      { name: 'Combat Knife', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'A reliable blade for close quarters.' },
      { name: 'Tactical Vest', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Kevlar-lined vest with utility pouches.' },
      { name: 'Combat Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Standard military helmet.' },
      { name: 'First Aid Kit', category: 'aid', quantity: 2, description: 'Basic field medical supplies.' },
      { name: 'Rifle Ammunition', category: 'ammo', quantity: 60, description: 'Standard rifle rounds.' },
    ],
    soldier: [
      { name: 'M4 Carbine', category: 'weapons', weaponType: 'assaultRifle', autoEquip: 'primaryWeapon', description: 'Reliable assault rifle, fully automatic capable.' },
      { name: 'M9 Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'sidearm', description: 'Standard sidearm, 9mm.' },
      { name: 'Body Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Full ballistic protection.' },
      { name: 'Combat Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Advanced combat helmet with NVG mount.' },
      { name: 'Tactical Gloves', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Reinforced tactical gloves.' },
      { name: 'Combat Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Steel-toed military boots.' },
      { name: 'First Aid Kit', category: 'aid', quantity: 3, description: 'Military-grade medical supplies.' },
      { name: '5.56 NATO Rounds', category: 'ammo', quantity: 90, description: 'Standard assault rifle ammunition.' },
      { name: '9mm Rounds', category: 'ammo', quantity: 30, description: 'Pistol ammunition.' },
    ],
  },
  
  // Cyberpunk
  cyberpunk: {
    default: [
      { name: 'Heavy Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'Chrome-plated handgun with smart targeting.' },
      { name: 'Monofilament Blade', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Retractable forearm blade.' },
      { name: 'Armored Jacket', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Ballistic weave street jacket.' },
      { name: 'Stim Injector', category: 'aid', quantity: 2, description: 'Combat stim for emergency healing.' },
      { name: 'Credstick', category: 'misc', description: 'Digital currency storage.' },
    ],
    netrunner: [
      { name: 'Compact Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'Concealable smart pistol.' },
      { name: 'Neural Interface Deck', category: 'misc', description: 'Your personal hacking interface.' },
      { name: 'Light Armor Jacket', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Low-profile armored clothing.' },
      { name: 'Neural Stim', category: 'aid', quantity: 3, description: 'Boosts neural processing.' },
      { name: 'Credstick', category: 'misc', description: 'Digital currency storage.' },
    ],
  },
  
  // Post-Apocalyptic
  postapoc: {
    default: [
      { name: 'Hunting Rifle', category: 'weapons', weaponType: 'rifle', autoEquip: 'primaryWeapon', description: 'Well-worn but reliable hunting rifle.' },
      { name: 'Machete', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Trusted blade for survival.' },
      { name: 'Leather Jacket', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Worn leather jacket, patched many times.' },
      { name: 'Bandages', category: 'aid', quantity: 3, description: 'Makeshift medical bandages.' },
      { name: 'Canned Food', category: 'aid', quantity: 2, description: 'Pre-war canned goods.' },
      { name: 'Scavenged Ammo', category: 'ammo', quantity: 20, description: 'Mixed rifle ammunition.' },
    ],
    survivor: [
      { name: 'Shotgun', category: 'weapons', weaponType: 'shotgun', autoEquip: 'primaryWeapon', description: 'Sawed-off pump-action shotgun.' },
      { name: 'Pipe Wrench', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Heavy tool, doubles as a weapon.' },
      { name: 'Scrap Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Jury-rigged metal plate armor.' },
      { name: 'Gas Mask', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Filter mask for toxic areas.' },
      { name: 'Med-X', category: 'aid', quantity: 2, description: 'Pre-war painkillers.' },
      { name: 'Shotgun Shells', category: 'ammo', quantity: 24, description: '12 gauge buckshot.' },
    ],
  },
  
  // Fantasy
  fantasy: {
    default: [
      { name: 'Longsword', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A well-balanced steel longsword.' },
      { name: 'Leather Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Supple leather armor, good for mobility.' },
      { name: 'Health Potion', category: 'aid', quantity: 2, description: 'Restores vitality when consumed.' },
      { name: 'Coin Purse', category: 'misc', description: 'Contains your gold coins.' },
    ],
    warrior: [
      { name: 'Bastard Sword', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A heavy two-handed sword.' },
      { name: 'Chain Mail', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Interlocking metal rings for protection.' },
      { name: 'Steel Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'A sturdy steel helmet.' },
      { name: 'Health Potion', category: 'aid', quantity: 3, description: 'Restores vitality when consumed.' },
    ],
    mage: [
      { name: 'Staff of Power', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A wooden staff imbued with arcane energy.' },
      { name: 'Robes of the Arcane', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Enchanted robes that enhance magical ability.' },
      { name: 'Mana Potion', category: 'aid', quantity: 3, description: 'Restores magical energy.' },
      { name: 'Spellbook', category: 'keyItems', description: 'Your personal grimoire of spells.' },
    ],
    rogue: [
      { name: 'Daggers', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A matched pair of throwing daggers.' },
      { name: 'Leather Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Silent, dark leather for stealth.' },
      { name: 'Lockpicks', category: 'misc', description: 'A set of quality lockpicks.' },
      { name: 'Health Potion', category: 'aid', quantity: 2, description: 'Restores vitality when consumed.' },
    ],
  },
  
  // Sci-Fi
  scifi: {
    default: [
      { name: 'Plasma Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'Standard issue energy weapon.' },
      { name: 'Enviro-Suit', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Light environmental protection suit.' },
      { name: 'MediGel', category: 'aid', quantity: 2, description: 'Quick-healing medical gel.' },
      { name: 'Energy Cell', category: 'ammo', quantity: 3, description: 'Universal energy ammunition.' },
    ],
  },
  
  // Western
  western: {
    default: [
      { name: 'Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'A trusty six-shooter.' },
      { name: 'Bowie Knife', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Large hunting knife.' },
      { name: 'Leather Duster', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Long leather coat for trail riding.' },
      { name: 'Cowboy Hat', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Wide-brimmed felt hat.' },
      { name: 'Whiskey Flask', category: 'aid', quantity: 1, description: 'For courage or medicinal purposes.' },
      { name: '.45 Rounds', category: 'ammo', quantity: 24, description: 'Revolver ammunition.' },
    ],
    gunslinger: [
      { name: 'Peacemaker', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'Legendary Colt single-action revolver.' },
      { name: 'Backup Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'sidearm', description: 'A second revolver for emergencies.' },
      { name: 'Leather Vest', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Gunfighter\'s vest with quick-draw holster.' },
      { name: 'Cowboy Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Spurred riding boots.' },
      { name: '.45 Rounds', category: 'ammo', quantity: 48, description: 'Revolver ammunition.' },
    ],
  },
  
  // Horror
  horror: {
    default: [
      { name: 'Flashlight', category: 'misc', description: 'Your only defense against the dark.' },
      { name: 'Pocket Knife', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'A small folding knife.' },
      { name: 'First Aid Kit', category: 'aid', quantity: 1, description: 'Basic medical supplies.' },
      { name: 'Cell Phone', category: 'misc', description: 'Low battery, weak signal.' },
    ],
  },
  
  // Mystery
  mystery: {
    default: [
      { name: 'Notebook', category: 'keyItems', description: 'For recording clues and observations.' },
      { name: 'Magnifying Glass', category: 'misc', description: 'For examining evidence.' },
      { name: 'Pen', category: 'misc', description: 'A reliable ballpoint pen.' },
      { name: 'Business Cards', category: 'misc', description: 'Your professional credentials.' },
    ],
    detective: [
      { name: 'Service Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'Police-issue .38 special.' },
      { name: 'Detective Badge', category: 'keyItems', description: 'Your official credentials.' },
      { name: 'Notebook', category: 'keyItems', description: 'Case notes and observations.' },
      { name: 'Handcuffs', category: 'misc', description: 'Standard issue restraints.' },
      { name: '.38 Rounds', category: 'ammo', quantity: 18, description: 'Revolver ammunition.' },
    ],
  },
  
  // Pirate
  pirate: {
    default: [
      { name: 'Cutlass', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A curved pirate sword.' },
      { name: 'Flintlock Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'sidearm', description: 'Single-shot black powder pistol.' },
      { name: 'Tricorn Hat', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Classic pirate hat.' },
      { name: 'Rum Bottle', category: 'aid', quantity: 1, description: 'For courage on the high seas.' },
      { name: 'Black Powder', category: 'ammo', quantity: 10, description: 'Ammunition for flintlock.' },
    ],
  },
  
  // Cosmic Horror
  cosmic_horror: {
    default: [
      { name: 'Journal', category: 'keyItems', description: 'Your personal journal of strange occurrences.' },
      { name: 'Lantern', category: 'misc', description: 'An oil lantern against the darkness.' },
      { name: 'Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'A small-caliber revolver.' },
      { name: 'Laudanum', category: 'aid', quantity: 1, description: 'To calm the nerves... and the visions.' },
    ],
  },
  
  // Modern Life (Slice of Life)
  modern_life: {
    default: [
      { name: 'Smartphone', category: 'misc', description: 'Your connection to the world.' },
      { name: 'Wallet', category: 'misc', description: 'Contains cash and cards.' },
      { name: 'Keys', category: 'keyItems', description: 'Home and car keys.' },
      { name: 'Coffee Thermos', category: 'aid', quantity: 1, description: 'Hot coffee for energy.' },
    ],
  },
};

// ============================================================================
// GENERATE FULL ITEM FROM BASE DATA
// ============================================================================

export function generateFullItem(baseItem: StartingGearItem): InventoryItem {
  const timestamp = Date.now();
  const detection = detectItemType(baseItem.name, baseItem.description || '');
  
  const item: InventoryItem = {
    id: `item-${baseItem.name.toLowerCase().replace(/\s+/g, '_')}-${timestamp}`,
    instanceId: `inst-${timestamp}-${Math.random().toString(36).substr(2, 6)}`,
    name: baseItem.name,
    description: baseItem.description || `${baseItem.name} - part of your equipment.`,
    category: baseItem.category || detection.category,
    type: detection.type,
    quantity: baseItem.quantity || 1,
    stackable: detection.stackable ?? ['aid', 'ammo'].includes(baseItem.category),
    consumable: detection.consumable ?? baseItem.category === 'aid',
    weight: 1,
    value: 10,
  };
  
  // WEAPONS: Add full stats, slots, condition
  if (baseItem.category === 'weapons') {
    const wType = baseItem.weaponType || 'rifle';
    
    item.type = 'weapon';
    item.weaponType = wType;
    item.caliber = DEFAULT_CALIBERS[wType] || '9mm';
    item.weight = getWeaponWeight(wType);
    item.value = getWeaponValue(wType);
    item.equipSlots = EQUIP_SLOTS_BY_WEAPON_TYPE[wType] || ['primaryWeapon', 'sidearm'];
    item.compatibleSlots = COMPATIBLE_SLOTS_BY_TYPE[wType] || ['optic', 'muzzle', 'grip'];
    item.stats = { ...(BASE_WEAPON_STATS[wType] || {
      damage: 50, accuracy: 50, fireRate: 50, range: 50, stability: 50, handling: 50,
    })};
    item.mods = {};
    item.condition = {
      barrelWear: 0,
      carbonBuildup: 0,
      springFatigue: 0,
      riflingWear: 0,
      roundsFired: 0,
      lastMaintenance: Date.now(),
    };
  }
  
  // APPAREL: Add equip slots
  if (baseItem.category === 'apparel') {
    const aType = baseItem.apparelType || 'torso';
    const slotMap: Record<string, string[]> = { 
      headwear: ['head'], torso: ['torso'], hands: ['hands'], legs: ['legs'], feet: ['feet'] 
    };
    item.type = aType;
    item.equipSlots = slotMap[aType] || ['torso'];
    item.weight = getApparelWeight(aType);
    item.value = getApparelValue(aType);
  }
  
  // MISC: Can be equipped as accessory
  if (baseItem.category === 'misc') {
    item.equipSlots = ['accessory1', 'accessory2'];
    item.weight = 0.5;
  }
  
  // AID: Consumable items
  if (baseItem.category === 'aid') {
    item.weight = 0.2;
    item.value = 25;
  }
  
  // AMMO
  if (baseItem.category === 'ammo') {
    item.weight = 0.01;
    item.value = 1;
  }
  
  // KEY ITEMS
  if (baseItem.category === 'keyItems') {
    item.weight = 0.1;
    item.value = 0;
    item.stackable = false;
    item.consumable = false;
  }
  
  return item;
}

// Weight/value helpers
function getWeaponWeight(type: WeaponType): number {
  const weights: Record<WeaponType, number> = {
    pistol: 1.5, revolver: 2, smg: 3, rifle: 4.5,
    assaultRifle: 4, shotgun: 4, sniper: 6, lmg: 10, melee: 1,
  };
  return weights[type] || 3;
}

function getWeaponValue(type: WeaponType): number {
  const values: Record<WeaponType, number> = {
    pistol: 150, revolver: 200, smg: 300, rifle: 400,
    assaultRifle: 450, shotgun: 350, sniper: 600, lmg: 700, melee: 75,
  };
  return values[type] || 200;
}

function getApparelWeight(type: ApparelType): number {
  const weights: Record<ApparelType, number> = { 
    headwear: 1, torso: 3, hands: 0.3, legs: 1.5, feet: 1.2 
  };
  return weights[type] || 1;
}

function getApparelValue(type: ApparelType): number {
  const values: Record<ApparelType, number> = { 
    headwear: 50, torso: 100, hands: 30, legs: 60, feet: 50 
  };
  return values[type] || 50;
}

// ============================================================================
// INITIALIZE STARTING GEAR
// ============================================================================

export interface InventoryDispatcher {
  dispatch: (action: { type: string; payload?: any }) => void;
}

export function initializeStartingGear(
  inventory: InventoryDispatcher,
  genre: string,
  characterClass: string = 'default'
): { items: InventoryItem[]; equipped: Partial<EquippedState> } {
  // Map genre aliases
  const genreMap: Record<string, string> = {
    'modern': 'war',
    'military': 'war',
    'scifi': 'scifi',
    'sci-fi': 'scifi',
    'post-apocalyptic': 'postapoc',
    'post_apocalyptic': 'postapoc',
    'post-apoc': 'postapoc',
    'medieval': 'fantasy',
    'dark_fantasy': 'fantasy',
    'lovecraftian': 'cosmic_horror',
    'slice_of_life': 'modern_life',
    'noir': 'mystery',
  };
  
  const normalizedGenre = genreMap[genre.toLowerCase()] || genre.toLowerCase();
  const genreGear = STARTING_GEAR[normalizedGenre] || STARTING_GEAR.fantasy;
  const gearList = genreGear[characterClass.toLowerCase()] || genreGear.default;
  
  console.log(`[StartingGear] Initializing for genre: ${normalizedGenre}, class: ${characterClass}`);
  console.log(`[StartingGear] Adding ${gearList.length} items`);
  
  const addedItems: InventoryItem[] = [];
  const equippedSlots: Partial<EquippedState> = {};
  
  gearList.forEach(baseItem => {
    const fullItem = generateFullItem(baseItem);
    addedItems.push(fullItem);
    
    // Add to inventory
    inventory.dispatch({ 
      type: 'ADD_ITEM', 
      payload: { item: fullItem, quantity: baseItem.quantity || 1 } 
    });
    
    // Auto-equip if specified
    if (baseItem.autoEquip && fullItem.instanceId) {
      inventory.dispatch({
        type: 'EQUIP_ITEM',
        payload: { instanceId: fullItem.instanceId, slot: baseItem.autoEquip }
      });
      equippedSlots[baseItem.autoEquip as keyof EquippedState] = fullItem.instanceId;
    }
    
    console.log(`[StartingGear] Added: ${fullItem.name} (${fullItem.category})${baseItem.autoEquip ? ` → equipped to ${baseItem.autoEquip}` : ''}`);
  });
  
  return { items: addedItems, equipped: equippedSlots };
}

// ============================================================================
// STORY TEXT PARSING FOR ITEMS
// ============================================================================

const PICKUP_PATTERNS = [
  /(?:you\s+)?(?:pick(?:ed)?\s+up|grab(?:bed)?|found|take[sn]?|collect(?:ed)?|acquire[ds]?|obtain(?:ed)?|receive[ds]?)\s+(?:a\s+|an\s+|the\s+|some\s+|your\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
  /(?:you\s+)?(?:loot(?:ed)?|scavenge[ds]?)\s+(?:a\s+|an\s+|the\s+|some\s+)?([^.,!?]+?)(?:\s+from|\.|,|!|\?|$)/gi,
  /(?:hands?\s+you|gives?\s+you|offers?\s+you)\s+(?:a\s+|an\s+|the\s+|some\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
];

const DROP_PATTERNS = [
  /(?:you\s+)?(?:drop(?:ped)?|discard(?:ed)?|left\s+behind|threw\s+away|gave\s+away|sold)\s+(?:the\s+|your\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
  /(?:you\s+)?(?:use[ds]?\s+up|consumed?|ate|drank)\s+(?:the\s+|your\s+|a\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
];

// Words to filter out (not actual items)
const FILTER_WORDS = [
  'it', 'them', 'this', 'that', 'something', 'anything', 'nothing',
  'him', 'her', 'me', 'us', 'breath', 'step', 'moment', 'chance',
  'opportunity', 'time', 'look', 'glance', 'aim', 'shot', 'cover',
  'position', 'advantage', 'ground', 'stance', 'action', 'decision',
];

export function parseStoryForItems(storyText: string): string[] {
  const items: string[] = [];
  
  PICKUP_PATTERNS.forEach(pattern => {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(storyText)) !== null) {
      let itemName = match[1].trim();
      
      // Clean up the item name
      itemName = itemName
        .replace(/\s+/g, ' ')
        .replace(/^(a|an|the|some|your)\s+/i, '')
        .trim();
      
      // Validate
      if (
        itemName.length > 2 && 
        itemName.length < 50 &&
        !FILTER_WORDS.includes(itemName.toLowerCase()) &&
        !/^\d+$/.test(itemName) // Not just a number
      ) {
        items.push(itemName);
      }
    }
  });
  
  return [...new Set(items)]; // Remove duplicates
}

export function parseStoryForDroppedItems(storyText: string): string[] {
  const items: string[] = [];
  
  DROP_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(storyText)) !== null) {
      let itemName = match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/^(a|an|the|some|your)\s+/i, '')
        .trim();
      
      if (
        itemName.length > 2 && 
        itemName.length < 50 &&
        !FILTER_WORDS.includes(itemName.toLowerCase())
      ) {
        items.push(itemName);
      }
    }
  });
  
  return [...new Set(items)];
}

// ============================================================================
// STORY-INVENTORY SYNC PROCESSOR
// ============================================================================

export interface InventorySyncResult {
  added: Array<{ name: string; category: string }>;
  dropped: string[];
}

export function processStoryInventorySync(
  newStoryText: string,
  inventory: InventoryDispatcher
): InventorySyncResult {
  const result: InventorySyncResult = { added: [], dropped: [] };
  
  // Parse for new items
  const pickedUp = parseStoryForItems(newStoryText);
  pickedUp.forEach(itemName => {
    const detection = detectItemType(itemName);
    const item = generateFullItem({
      name: itemName,
      category: detection.category as any,
      weaponType: detection.weaponType,
      apparelType: detection.type as ApparelType,
    });
    
    inventory.dispatch({ type: 'ADD_ITEM', payload: { item, quantity: 1 } });
    result.added.push({ name: itemName, category: detection.category });
    console.log(`[STORY→INV] Added: ${itemName} (${detection.category})`);
  });
  
  // Parse for dropped items
  const dropped = parseStoryForDroppedItems(newStoryText);
  dropped.forEach(itemName => {
    // Note: We don't automatically remove items - that's too aggressive
    // Just log for now. The game mechanics system handles actual removal.
    result.dropped.push(itemName);
    console.log(`[STORY→INV] Noted drop: ${itemName} (requires explicit removal)`);
  });
  
  return result;
}

// ============================================================================
// BUILD INVENTORY CONTEXT FOR AI
// ============================================================================

export function buildInventoryContextForAI(state: InventoryState): string {
  if (!state.items || state.items.length === 0) {
    return `PLAYER INVENTORY: Empty - the player has no items yet.`;
  }
  
  const byCategory: Record<string, string[]> = {};
  
  for (const item of state.items) {
    const cat = item.category || 'misc';
    if (!byCategory[cat]) byCategory[cat] = [];
    
    let itemStr = item.name;
    if (item.quantity > 1) itemStr += ` (x${item.quantity})`;
    if (item.weaponType) itemStr += ` [${item.weaponType}]`;
    
    byCategory[cat].push(itemStr);
  }
  
  const lines: string[] = ['PLAYER INVENTORY:'];
  
  // Order categories
  const categoryOrder = ['weapons', 'apparel', 'aid', 'ammo', 'keyItems', 'misc'];
  for (const cat of categoryOrder) {
    if (byCategory[cat] && byCategory[cat].length > 0) {
      lines.push(`  ${cat.toUpperCase()}: ${byCategory[cat].join(', ')}`);
    }
  }
  
  // Add equipped info
  const equipped: string[] = [];
  if (state.equipped.primaryWeapon) {
    const item = state.items.find(i => i.instanceId === state.equipped.primaryWeapon);
    if (item) equipped.push(`Primary: ${item.name}`);
  }
  if (state.equipped.sidearm) {
    const item = state.items.find(i => i.instanceId === state.equipped.sidearm);
    if (item) equipped.push(`Sidearm: ${item.name}`);
  }
  if (state.equipped.torso) {
    const item = state.items.find(i => i.instanceId === state.equipped.torso);
    if (item) equipped.push(`Armor: ${item.name}`);
  }
  
  if (equipped.length > 0) {
    lines.push(`EQUIPPED: ${equipped.join(', ')}`);
  }
  
  lines.push('');
  lines.push('INVENTORY RULES FOR AI:');
  lines.push('- Only reference items the player actually has in inventory above');
  lines.push('- When player picks up new items, clearly state: "You pick up the [Item Name]"');
  lines.push('- When player uses consumables, state: "You use the [Item Name]"');
  lines.push('- The player can reach for equipped weapons at any time');
  
  return lines.join('\n');
}

// ============================================================================
// CHECK IF GEAR NEEDS INITIALIZATION
// ============================================================================

export function needsStartingGear(state: InventoryState): boolean {
  return !state.items || state.items.length === 0;
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).debugInventoryBridge = {
    STARTING_GEAR,
    parseStoryForItems,
    parseStoryForDroppedItems,
    generateFullItem,
  };
}
