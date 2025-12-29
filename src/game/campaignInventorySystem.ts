// ============================================================================
// CAMPAIGN INVENTORY SYSTEM - Campaign-Isolated Inventory Management
// Single source of truth: character.inventory stored in CampaignData.player
// ============================================================================

import { InventoryItem, RPGCharacter } from '@/types/rpgCharacter';

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryChange {
  id: string;
  type: 'add' | 'remove';
  itemName: string;
  quantity: number;
  timestamp: number;
  campaignId: string;
}

export interface InventoryOperationResult {
  success: boolean;
  error?: string;
  updatedInventory: InventoryItem[];
  change?: InventoryChange;
}

// ============================================================================
// ITEM TYPE DETECTION
// ============================================================================

export function determineItemType(itemName: string): InventoryItem['type'] {
  const name = itemName.toLowerCase();
  
  if (name.includes('sword') || name.includes('blade') || name.includes('dagger') || 
      name.includes('axe') || name.includes('bow') || name.includes('staff') ||
      name.includes('wand') || name.includes('gun') || name.includes('pistol') ||
      name.includes('rifle') || name.includes('knife') || name.includes('spear')) {
    return 'weapon';
  }
  
  if (name.includes('armor') || name.includes('shield') || name.includes('helm') ||
      name.includes('helmet') || name.includes('boots') || name.includes('gloves') ||
      name.includes('vest') || name.includes('plate')) {
    return 'armor';
  }
  
  if (name.includes('potion') || name.includes('elixir') || name.includes('food') ||
      name.includes('drink') || name.includes('medicine') || name.includes('bandage') ||
      name.includes('ration') || name.includes('herb') || name.includes('medkit')) {
    return 'consumable';
  }
  
  if (name.includes('key') || name.includes('map') || name.includes('letter') ||
      name.includes('note') || name.includes('document') || name.includes('badge') ||
      name.includes('pass') || name.includes('photograph') || name.includes('diary')) {
    return 'quest';
  }
  
  if (name.includes('rope') || name.includes('torch') || name.includes('lantern') ||
      name.includes('pick') || name.includes('hammer') || name.includes('tool')) {
    return 'tool';
  }
  
  if (name.includes('gem') || name.includes('jewel') || name.includes('coin') ||
      name.includes('gold') || name.includes('silver') || name.includes('ruby') ||
      name.includes('diamond') || name.includes('treasure')) {
    return 'treasure';
  }
  
  return 'tool'; // Default
}

// ============================================================================
// ITEM ICON HELPER
// ============================================================================

export function getItemIcon(itemName: string): string {
  const name = itemName.toLowerCase();
  
  if (name.includes('sword') || name.includes('blade') || name.includes('dagger') || 
      name.includes('axe') || name.includes('weapon')) return '⚔️';
  if (name.includes('key')) return '🗝️';
  if (name.includes('potion') || name.includes('elixir') || name.includes('flask')) return '🧪';
  if (name.includes('gem') || name.includes('jewel') || name.includes('diamond') || 
      name.includes('ruby') || name.includes('emerald')) return '💎';
  if (name.includes('scroll') || name.includes('book') || name.includes('tome') || 
      name.includes('letter')) return '📜';
  if (name.includes('ring') || name.includes('amulet') || name.includes('necklace')) return '💍';
  if (name.includes('coin') || name.includes('gold') || name.includes('silver')) return '🪙';
  if (name.includes('armor') || name.includes('shield') || name.includes('helm')) return '🛡️';
  if (name.includes('food') || name.includes('bread') || name.includes('meat')) return '🍖';
  if (name.includes('bow') || name.includes('arrow')) return '🏹';
  if (name.includes('staff') || name.includes('wand') || name.includes('rod')) return '🪄';
  if (name.includes('map')) return '🗺️';
  if (name.includes('torch') || name.includes('lantern')) return '🔦';
  if (name.includes('gun') || name.includes('pistol') || name.includes('rifle')) return '🔫';
  if (name.includes('medicine') || name.includes('medkit') || name.includes('bandage')) return '💊';
  
  return '✨';
}

// ============================================================================
// FUZZY MATCHING FOR ITEM NAMES
// ============================================================================

/**
 * Finds an item in inventory by fuzzy matching the name.
 * Returns the index and exact match, or -1 if not found.
 */
export function findItemInInventory(
  inventory: InventoryItem[],
  itemName: string
): { index: number; item: InventoryItem | null } {
  const normalizedSearch = itemName.toLowerCase().trim();
  
  // Exact match first
  for (let i = 0; i < inventory.length; i++) {
    if (inventory[i].name.toLowerCase() === normalizedSearch) {
      return { index: i, item: inventory[i] };
    }
  }
  
  // Partial match (search term is contained in item name)
  for (let i = 0; i < inventory.length; i++) {
    if (inventory[i].name.toLowerCase().includes(normalizedSearch)) {
      return { index: i, item: inventory[i] };
    }
  }
  
  // Reverse partial match (item name is contained in search term)
  for (let i = 0; i < inventory.length; i++) {
    if (normalizedSearch.includes(inventory[i].name.toLowerCase())) {
      return { index: i, item: inventory[i] };
    }
  }
  
  return { index: -1, item: null };
}

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

/**
 * Add an item to character inventory.
 * Returns a NEW inventory array (immutable).
 */
export function addItemToInventory(
  currentInventory: InventoryItem[],
  itemName: string,
  quantity: number = 1,
  campaignId: string
): InventoryOperationResult {
  if (!itemName || itemName.trim() === '') {
    return {
      success: false,
      error: 'Invalid item name',
      updatedInventory: currentInventory,
    };
  }
  
  const normalizedName = itemName.trim();
  const newInventory = [...currentInventory];
  
  // Check if item already exists
  const { index, item } = findItemInInventory(newInventory, normalizedName);
  
  if (index !== -1 && item) {
    // Update existing item quantity
    newInventory[index] = {
      ...item,
      quantity: item.quantity + quantity,
    };
    console.log(`[CampaignInventory] Stacked ${quantity}x "${normalizedName}" (now ${newInventory[index].quantity})`);
  } else {
    // Create new item
    const newItem: InventoryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: normalizedName,
      description: `A ${normalizedName.toLowerCase()} found during your adventure.`,
      quantity: quantity,
      type: determineItemType(normalizedName),
    };
    newInventory.push(newItem);
    console.log(`[CampaignInventory] Added new item: "${normalizedName}"`);
  }
  
  const change: InventoryChange = {
    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'add',
    itemName: normalizedName,
    quantity,
    timestamp: Date.now(),
    campaignId,
  };
  
  return {
    success: true,
    updatedInventory: newInventory,
    change,
  };
}

/**
 * Remove an item from character inventory.
 * Returns a NEW inventory array (immutable).
 */
export function removeItemFromInventory(
  currentInventory: InventoryItem[],
  itemName: string,
  quantity: number = 1,
  campaignId: string
): InventoryOperationResult {
  if (!itemName || itemName.trim() === '') {
    return {
      success: false,
      error: 'Invalid item name',
      updatedInventory: currentInventory,
    };
  }
  
  const normalizedName = itemName.trim();
  const newInventory = [...currentInventory];
  
  // Find the item
  const { index, item } = findItemInInventory(newInventory, normalizedName);
  
  if (index === -1 || !item) {
    console.warn(`[CampaignInventory] Item "${normalizedName}" not found in inventory`);
    return {
      success: false,
      error: `Item "${normalizedName}" not found in inventory`,
      updatedInventory: currentInventory,
    };
  }
  
  const actualItemName = item.name; // Use the actual name from inventory
  
  if (item.quantity > quantity) {
    // Reduce quantity
    newInventory[index] = {
      ...item,
      quantity: item.quantity - quantity,
    };
    console.log(`[CampaignInventory] Reduced "${actualItemName}" by ${quantity} (now ${newInventory[index].quantity})`);
  } else {
    // Remove item entirely
    newInventory.splice(index, 1);
    console.log(`[CampaignInventory] Removed item: "${actualItemName}"`);
  }
  
  const change: InventoryChange = {
    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'remove',
    itemName: actualItemName,
    quantity: Math.min(quantity, item.quantity),
    timestamp: Date.now(),
    campaignId,
  };
  
  return {
    success: true,
    updatedInventory: newInventory,
    change,
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Process multiple loot items at once.
 */
export function processLootGained(
  currentInventory: InventoryItem[],
  lootItems: string[],
  campaignId: string
): { updatedInventory: InventoryItem[]; changes: InventoryChange[] } {
  let inventory = [...currentInventory];
  const changes: InventoryChange[] = [];
  
  for (const itemName of lootItems) {
    const result = addItemToInventory(inventory, itemName, 1, campaignId);
    if (result.success) {
      inventory = result.updatedInventory;
      if (result.change) {
        changes.push(result.change);
      }
    }
  }
  
  return { updatedInventory: inventory, changes };
}

/**
 * Process multiple dropped items at once.
 */
export function processItemsDropped(
  currentInventory: InventoryItem[],
  droppedItems: string[],
  campaignId: string
): { updatedInventory: InventoryItem[]; changes: InventoryChange[] } {
  let inventory = [...currentInventory];
  const changes: InventoryChange[] = [];
  
  for (const itemName of droppedItems) {
    const result = removeItemFromInventory(inventory, itemName, 1, campaignId);
    if (result.success) {
      inventory = result.updatedInventory;
      if (result.change) {
        changes.push(result.change);
      }
    }
  }
  
  return { updatedInventory: inventory, changes };
}

// ============================================================================
// INVENTORY CONTEXT FOR AI
// ============================================================================

/**
 * Build inventory context string for AI prompts.
 */
export function buildInventoryContext(inventory: InventoryItem[]): string {
  if (inventory.length === 0) {
    return 'Player inventory is empty.';
  }
  
  const lines: string[] = ['### Player Inventory:'];
  
  for (const item of inventory) {
    const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
    lines.push(`- ${item.name}${qty}`);
  }
  
  lines.push('');
  lines.push('CRITICAL: When player drops, gives away, or loses an item, it MUST be removed from inventory.');
  lines.push('When player picks up, receives, or finds an item, it MUST be added to inventory.');
  
  return lines.join('\n');
}

// ============================================================================
// CHARACTER UPDATE HELPER
// ============================================================================

/**
 * Apply inventory changes to a character and return a NEW character object.
 */
export function applyInventoryChangesToCharacter(
  character: RPGCharacter,
  lootGained: string[] = [],
  itemsDropped: string[] = [],
  campaignId: string
): {
  updatedCharacter: RPGCharacter;
  addedChanges: InventoryChange[];
  removedChanges: InventoryChange[];
} {
  let inventory = [...character.inventory];
  const addedChanges: InventoryChange[] = [];
  const removedChanges: InventoryChange[] = [];
  
  // Process loot first
  if (lootGained.length > 0) {
    const lootResult = processLootGained(inventory, lootGained, campaignId);
    inventory = lootResult.updatedInventory;
    addedChanges.push(...lootResult.changes);
  }
  
  // Process drops second
  if (itemsDropped.length > 0) {
    const dropResult = processItemsDropped(inventory, itemsDropped, campaignId);
    inventory = dropResult.updatedInventory;
    removedChanges.push(...dropResult.changes);
  }
  
  return {
    updatedCharacter: {
      ...character,
      inventory,
    },
    addedChanges,
    removedChanges,
  };
}

// ============================================================================
// DEBUG HELPERS
// ============================================================================

export function logInventoryState(inventory: InventoryItem[], label: string = 'Inventory'): void {
  console.log(`[CampaignInventory] ${label}:`, inventory.map(i => `${i.name} (x${i.quantity})`).join(', ') || '(empty)');
}
