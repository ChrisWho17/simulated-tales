// ============================================================================
// ITEM KEYWORD DETECTION & CATEGORY ASSIGNMENT SYSTEM
// Fixes: Items tagged as Misc instead of correct category
// ============================================================================

import { createWeapon, BASE_WEAPON_STATS, COMPATIBLE_SLOTS_BY_TYPE, EQUIP_SLOTS_BY_WEAPON_TYPE, DEFAULT_CALIBERS } from './weaponModsSystem';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ItemCategory = 'weapons' | 'apparel' | 'aid' | 'ammo' | 'keyItems' | 'misc';
export type WeaponType = 'pistol' | 'revolver' | 'smg' | 'rifle' | 'assaultRifle' | 'shotgun' | 'sniper' | 'lmg' | 'melee';
export type ApparelType = 'headwear' | 'torso' | 'hands' | 'legs' | 'feet';

export interface ItemDetectionResult {
  category: ItemCategory;
  type: string;
  weaponType?: WeaponType;
  stackable?: boolean;
  consumable?: boolean;
  equipSlots?: string[];
}

export interface GeneratedItem extends ItemDetectionResult {
  id: string;
  name: string;
  description: string;
  icon: string;
  weight: number;
  value: number;
  caliber?: string;
  compatibleSlots?: string[];
  stats?: Record<string, number>;
  mods?: Record<string, unknown>;
  condition?: {
    barrelWear: number;
    carbonBuildup: number;
    springFatigue: number;
    riflingWear: number;
    roundsFired: number;
    lastMaintenance: number;
  };
  effects?: Record<string, number>;
}

export interface InventoryState {
  items: GeneratedItem[];
  equipped: Record<string, GeneratedItem | null>;
  settings: Record<string, unknown>;
}

// ============================================================================
// KEYWORD MAPPINGS
// ============================================================================

// Keywords that indicate WEAPONS category
export const WEAPON_KEYWORDS = [
  // Firearms
  'rifle', 'pistol', 'handgun', 'revolver', 'gun', 'firearm',
  'shotgun', 'smg', 'submachine', 'carbine', 'musket',
  'sniper', 'lmg', 'machine gun', 'machinegun',
  // Specific weapons
  'ak-47', 'ak47', 'm16', 'm4', 'ar-15', 'ar15', 'glock', 'beretta',
  'colt', 'remington', 'winchester', 'kalashnikov', 'uzi', 'mp5',
  'garand', 'm1', 'm228', 'luger', 'mauser', 'kar98', 'mosin',
  // Melee
  'knife', 'blade', 'sword', 'machete', 'axe', 'hatchet',
  'bat', 'club', 'crowbar', 'baton', 'brass knuckles',
  // Explosives
  'grenade', 'explosive', 'dynamite', 'mine', 'c4', 'bomb',
];

// Keywords that indicate APPAREL category
export const APPAREL_KEYWORDS = [
  // Head
  'helmet', 'hat', 'cap', 'beret', 'headgear', 'goggles', 'mask', 'balaclava',
  // Torso
  'armor', 'vest', 'jacket', 'coat', 'shirt', 'uniform', 'flak',
  'kevlar', 'plate carrier', 'body armor', 'chest rig',
  // Hands
  'gloves', 'gauntlets', 'mittens',
  // Legs
  'pants', 'trousers', 'leggings', 'leg armor',
  // Feet
  'boots', 'shoes', 'footwear', 'combat boots',
  // Full body
  'suit', 'hazmat', 'ghillie', 'camouflage', 'camo',
];

// Keywords that indicate AID/MEDICAL category
export const AID_KEYWORDS = [
  'bandage', 'medkit', 'med kit', 'first aid', 'firstaid',
  'medicine', 'medication', 'pills', 'tablets', 'capsules',
  'syringe', 'morphine', 'stimpack', 'stimpak', 'health',
  'antiseptic', 'tourniquet', 'splint', 'gauze', 'salve',
  'antidote', 'serum', 'vaccine', 'blood pack', 'iv',
  'painkiller', 'aspirin', 'ibuprofen', 'antibiotics',
  // Food/drink for healing
  'ration', 'mre', 'food', 'water', 'canteen', 'provisions',
];

// Keywords that indicate AMMO category
export const AMMO_KEYWORDS = [
  'ammo', 'ammunition', 'rounds', 'bullets', 'cartridge', 'cartridges',
  'magazine', 'mag', 'clip', 'shells', 'buckshot', 'slugs',
  '9mm', '.45', '.308', '5.56', '7.62', '12 gauge', '.357', '.44',
  'caliber', 'cal', 'nato', 'hollow point', 'fmj', 'ap rounds',
];

// Keywords that indicate KEY ITEMS category
export const KEY_ITEM_KEYWORDS = [
  'key', 'keycard', 'access card', 'id card', 'badge', 'credential',
  'document', 'papers', 'intel', 'intelligence', 'dossier', 'file',
  'map', 'blueprint', 'schematic', 'plans', 'coordinates',
  'photograph', 'photo', 'picture', 'evidence', 'clue',
  'letter', 'note', 'journal', 'diary', 'orders', 'mission',
  'code', 'password', 'cipher', 'encryption',
  'artifact', 'relic', 'quest', 'objective',
];

// Keywords that indicate MISC category (catch-all, but specific items)
export const MISC_KEYWORDS = [
  'radio', 'communicator', 'walkie', 'transceiver', 'comms',
  'flashlight', 'torch', 'lantern', 'light',
  'binoculars', 'scope', 'optic', 'night vision', 'nvg', 'thermal',
  'compass', 'gps', 'tracker', 'beacon',
  'rope', 'wire', 'cable', 'paracord',
  'tool', 'toolkit', 'wrench', 'screwdriver', 'pliers',
  'lock pick', 'lockpick', 'bobby pin',
  'cigarette', 'lighter', 'matches', 'flare',
  'watch', 'timepiece', 'clock',
  'bag', 'backpack', 'pouch', 'satchel', 'case',
];

// ============================================================================
// WEAPON TYPE DETECTION (for proper stats assignment)
// ============================================================================

export const WEAPON_TYPE_KEYWORDS: Record<WeaponType, string[]> = {
  pistol: ['pistol', 'handgun', 'glock', 'beretta', 'colt 1911', 'm9', 'p226', 'usp', 'five-seven', 'deagle', 'desert eagle'],
  revolver: ['revolver', '.357', '.44 magnum', 'magnum', 'python', 'peacemaker'],
  smg: ['smg', 'submachine', 'mp5', 'mp7', 'uzi', 'mac-10', 'p90', 'ump', 'vector', 'ppsh'],
  rifle: ['rifle', 'm1 garand', 'garand', 'kar98', 'mosin', 'lee enfield', 'springfield', 'm14', 'm228', 'sks', 'hunting rifle', 'battle rifle'],
  assaultRifle: ['assault rifle', 'ar-15', 'ar15', 'm16', 'm4', 'ak-47', 'ak47', 'akm', 'famas', 'aug', 'scar', 'acr', 'hk416'],
  shotgun: ['shotgun', 'remington', 'mossberg', 'spas', 'benelli', 'pump action', 'double barrel', '12 gauge'],
  sniper: ['sniper', 'sniper rifle', 'm24', 'awp', 'awm', 'barrett', 'dragunov', 'svd', 'l96', 'intervention', 'marksman'],
  lmg: ['lmg', 'machine gun', 'machinegun', 'm60', 'm249', 'saw', 'rpk', 'mg42', 'minigun', 'gatling'],
  melee: ['knife', 'blade', 'sword', 'machete', 'axe', 'hatchet', 'bat', 'club', 'crowbar', 'bayonet', 'combat knife', 'karambit'],
};

// ============================================================================
// APPAREL TYPE DETECTION (for proper equip slots)
// ============================================================================

export const APPAREL_TYPE_KEYWORDS: Record<ApparelType, string[]> = {
  headwear: ['helmet', 'hat', 'cap', 'beret', 'headgear', 'mask', 'goggles', 'balaclava', 'hood', 'bandana'],
  torso: ['armor', 'vest', 'jacket', 'coat', 'shirt', 'uniform', 'kevlar', 'plate carrier', 'body armor', 'chest', 'flak'],
  hands: ['gloves', 'gauntlets', 'mittens', 'hand wraps'],
  legs: ['pants', 'trousers', 'leggings', 'leg armor', 'knee pads'],
  feet: ['boots', 'shoes', 'footwear', 'sneakers', 'combat boots'],
};

// ============================================================================
// HELPER DETECTION FUNCTIONS
// ============================================================================

function detectWeaponType(searchText: string): WeaponType {
  for (const [type, keywords] of Object.entries(WEAPON_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return type as WeaponType;
      }
    }
  }
  // Default based on generic terms
  if (searchText.includes('rifle')) return 'rifle';
  if (searchText.includes('pistol') || searchText.includes('handgun')) return 'pistol';
  if (searchText.includes('shotgun')) return 'shotgun';
  return 'rifle'; // Default
}

function detectApparelType(searchText: string): ApparelType {
  for (const [type, keywords] of Object.entries(APPAREL_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return type as ApparelType;
      }
    }
  }
  return 'torso'; // Default
}

function getApparelEquipSlots(apparelType: ApparelType): string[] {
  const slotMap: Record<ApparelType, string[]> = {
    headwear: ['head'],
    torso: ['torso'],
    hands: ['hands'],
    legs: ['legs'],
    feet: ['feet'],
  };
  return slotMap[apparelType] || ['torso'];
}

function detectFromNamePattern(itemName: string): ItemDetectionResult {
  const name = itemName.toLowerCase();
  
  // Check for common patterns
  if (name.match(/\b(m\d+|ak|ar|mp\d+)\b/i)) {
    return { category: 'weapons', type: 'weapon', weaponType: 'assaultRifle' };
  }
  if (name.endsWith('gun') || name.endsWith('rifle')) {
    return { category: 'weapons', type: 'weapon', weaponType: 'rifle' };
  }
  if (name.includes('armor') || name.includes('vest')) {
    return { category: 'apparel', type: 'torso', equipSlots: ['torso'] };
  }
  
  // True fallback - misc
  return {
    category: 'misc',
    type: 'misc',
    stackable: false,
    consumable: false,
  };
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

export function detectItemType(itemName: string, itemDescription = ''): ItemDetectionResult {
  const searchText = `${itemName} ${itemDescription}`.toLowerCase();
  
  // Check each category in priority order
  
  // 1. Weapons (highest priority - very specific)
  for (const keyword of WEAPON_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        category: 'weapons',
        type: 'weapon',
        weaponType: detectWeaponType(searchText),
      };
    }
  }
  
  // 2. Ammo
  for (const keyword of AMMO_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        category: 'ammo',
        type: 'ammo',
        stackable: true,
        consumable: false,
      };
    }
  }
  
  // 3. Aid/Medical
  for (const keyword of AID_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        category: 'aid',
        type: 'medical',
        stackable: true,
        consumable: true,
      };
    }
  }
  
  // 4. Apparel
  for (const keyword of APPAREL_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      const apparelType = detectApparelType(searchText);
      return {
        category: 'apparel',
        type: apparelType,
        equipSlots: getApparelEquipSlots(apparelType),
      };
    }
  }
  
  // 5. Key Items
  for (const keyword of KEY_ITEM_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        category: 'keyItems',
        type: 'keyItem',
        stackable: false,
        consumable: false,
      };
    }
  }
  
  // 6. Misc (specific items)
  for (const keyword of MISC_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        category: 'misc',
        type: 'misc',
        equipSlots: ['accessory1', 'accessory2'],
      };
    }
  }
  
  // 7. Default fallback - try to guess from name patterns
  return detectFromNamePattern(itemName);
}

// ============================================================================
// DEFAULT VALUES HELPERS
// ============================================================================

function getDefaultIcon(category: ItemCategory, type: string): string {
  const icons: Record<string, Record<string, string>> = {
    weapons: {
      pistol: '🔫', revolver: '🔫', smg: '🔫', rifle: '🎯',
      assaultRifle: '🔫', shotgun: '🔫', sniper: '🎯', lmg: '🔫', melee: '🗡️',
      default: '🔫',
    },
    apparel: {
      headwear: '🪖', torso: '🦺', hands: '🧤', legs: '👖', feet: '👢',
      default: '👕',
    },
    aid: { default: '💊' },
    ammo: { default: '•' },
    keyItems: { default: '🔑' },
    misc: { default: '📦' },
  };
  
  const categoryIcons = icons[category] || icons.misc;
  return categoryIcons[type] || categoryIcons.default || '📦';
}

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
  const weights: Record<ApparelType, number> = { headwear: 1, torso: 3, hands: 0.3, legs: 1.5, feet: 1.2 };
  return weights[type] || 1;
}

function getApparelValue(type: ApparelType): number {
  const values: Record<ApparelType, number> = { headwear: 50, torso: 100, hands: 30, legs: 60, feet: 50 };
  return values[type] || 50;
}

function getApparelDefense(type: ApparelType): number {
  const defense: Record<ApparelType, number> = { headwear: 15, torso: 30, hands: 5, legs: 15, feet: 10 };
  return defense[type] || 10;
}

function getApparelMobility(type: ApparelType): number {
  const mobility: Record<ApparelType, number> = { headwear: -2, torso: -10, hands: -1, legs: -5, feet: -3 };
  return mobility[type] || -5;
}

// ============================================================================
// ITEM GENERATION FUNCTIONS
// ============================================================================

function generateWeaponItem(baseItem: Partial<GeneratedItem>, weaponType?: WeaponType): GeneratedItem {
  const type = weaponType || 'rifle';
  const baseStats = BASE_WEAPON_STATS[type] || {
    damage: 50, accuracy: 50, fireRate: 50, range: 50, stability: 50, handling: 50,
  };
  
  return {
    ...baseItem,
    category: 'weapons',
    type: 'weapon',
    weaponType: type,
    caliber: DEFAULT_CALIBERS[type] || '9mm',
    weight: getWeaponWeight(type),
    value: getWeaponValue(type),
    stackable: false,
    consumable: false,
    equipSlots: EQUIP_SLOTS_BY_WEAPON_TYPE[type] || ['primaryWeapon', 'sidearm'],
    compatibleSlots: COMPATIBLE_SLOTS_BY_TYPE[type] || ['optic', 'muzzle', 'grip'],
    stats: { ...baseStats },
    mods: {},
    condition: {
      barrelWear: 0,
      carbonBuildup: 0,
      springFatigue: 0,
      riflingWear: 0,
      roundsFired: 0,
      lastMaintenance: Date.now(),
    },
  } as GeneratedItem;
}

function generateApparelItem(baseItem: Partial<GeneratedItem>, apparelType: string): GeneratedItem {
  const type = apparelType as ApparelType;
  const equipSlots = getApparelEquipSlots(type);
  
  return {
    ...baseItem,
    category: 'apparel',
    type: type,
    weight: getApparelWeight(type),
    value: getApparelValue(type),
    stackable: false,
    consumable: false,
    equipSlots,
    stats: {
      defense: getApparelDefense(type),
      mobility: getApparelMobility(type),
    },
  } as GeneratedItem;
}

function generateAidItem(baseItem: Partial<GeneratedItem>): GeneratedItem {
  return {
    ...baseItem,
    category: 'aid',
    type: 'medical',
    weight: 0.2,
    value: 25,
    stackable: true,
    consumable: true,
    equipSlots: [],
    effects: {
      healing: 25,
    },
  } as GeneratedItem;
}

function generateAmmoItem(baseItem: Partial<GeneratedItem>): GeneratedItem {
  return {
    ...baseItem,
    category: 'ammo',
    type: 'ammo',
    weight: 0.01,
    value: 1,
    stackable: true,
    consumable: false,
    equipSlots: [],
  } as GeneratedItem;
}

function generateKeyItem(baseItem: Partial<GeneratedItem>): GeneratedItem {
  return {
    ...baseItem,
    category: 'keyItems',
    type: 'keyItem',
    weight: 0.1,
    value: 0,
    stackable: false,
    consumable: false,
    equipSlots: [],
  } as GeneratedItem;
}

function generateMiscItem(baseItem: Partial<GeneratedItem>): GeneratedItem {
  return {
    ...baseItem,
    category: 'misc',
    type: 'misc',
    weight: 0.5,
    value: 10,
    stackable: false,
    consumable: false,
    equipSlots: ['accessory1', 'accessory2'],
  } as GeneratedItem;
}

// ============================================================================
// COMPLETE ITEM GENERATOR FROM STORY TEXT
// ============================================================================

export function generateItemFromStory(
  itemName: string, 
  description = '', 
  _context: Record<string, unknown> = {}
): GeneratedItem {
  const detection = detectItemType(itemName, description);
  const timestamp = Date.now();
  
  const baseItem: Partial<GeneratedItem> = {
    id: `item-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    name: itemName,
    description: description || `${itemName} found during your adventure.`,
    icon: getDefaultIcon(detection.category, detection.type),
    ...detection,
  };
  
  // Category-specific processing
  switch (detection.category) {
    case 'weapons':
      return generateWeaponItem(baseItem, detection.weaponType);
    case 'apparel':
      return generateApparelItem(baseItem, detection.type);
    case 'aid':
      return generateAidItem(baseItem);
    case 'ammo':
      return generateAmmoItem(baseItem);
    case 'keyItems':
      return generateKeyItem(baseItem);
    case 'misc':
    default:
      return generateMiscItem(baseItem);
  }
}

// ============================================================================
// INVENTORY STATE PERSISTENCE
// ============================================================================

export const INVENTORY_STORAGE_KEY = 'game_inventory_state';

export function saveInventoryState(state: InventoryState): void {
  try {
    const serialized = JSON.stringify({
      items: state.items,
      equipped: state.equipped,
      settings: state.settings,
      savedAt: Date.now(),
    });
    localStorage.setItem(INVENTORY_STORAGE_KEY, serialized);
    console.log('[INVENTORY] State saved:', state.items.length, 'items');
  } catch (error) {
    console.error('[INVENTORY] Failed to save state:', error);
  }
}

export function loadInventoryState(): InventoryState | null {
  try {
    const serialized = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!serialized) return null;
    
    const saved = JSON.parse(serialized);
    console.log('[INVENTORY] State loaded:', saved.items?.length, 'items');
    return saved;
  } catch (error) {
    console.error('[INVENTORY] Failed to load state:', error);
    return null;
  }
}

export function clearInventoryState(): void {
  localStorage.removeItem(INVENTORY_STORAGE_KEY);
  console.log('[INVENTORY] State cleared');
}

// ============================================================================
// INTEGRATION HELPER - Use in story/narrative system
// ============================================================================

export interface InventoryHandler {
  addItem: (item: GeneratedItem, quantity: number) => void;
}

export function processStoryItemPickup(
  inventory: InventoryHandler, 
  itemText: string, 
  narrativeContext: Record<string, unknown> = {}
): GeneratedItem {
  // Parse item from story text
  // e.g., "You found a M228 Rifle" → extracts "M228 Rifle"
  
  const itemPatterns = [
    /(?:found|picked up|grabbed|took|received|obtained|acquired)\s+(?:a|an|the|some)?\s*(.+?)(?:\.|!|$)/i,
    /(?:you now have|added to inventory|got)\s+(?:a|an|the|some)?\s*(.+?)(?:\.|!|$)/i,
  ];
  
  let itemName = itemText;
  for (const pattern of itemPatterns) {
    const match = itemText.match(pattern);
    if (match) {
      itemName = match[1].trim();
      break;
    }
  }
  
  // Generate the full item
  const item = generateItemFromStory(itemName, '', narrativeContext);
  
  // Add to inventory
  inventory.addItem(item, 1);
  
  console.log('[STORY→INVENTORY] Added:', item.name, '| Category:', item.category, '| Type:', item.weaponType || item.type);
  
  return item;
}
