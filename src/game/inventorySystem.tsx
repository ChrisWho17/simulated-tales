import React, { useState, useCallback, createContext, useContext, useReducer, useEffect } from 'react';
import { populateWeaponData, getCompatibleModsArray, ALL_MODS, WeaponMod as WMod } from './weaponModsSystem';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

export const CATEGORIES = {
  WEAPONS: { id: 'weapons', label: 'Weapons', icon: '⚔️', color: '#ff6b6b' },
  APPAREL: { id: 'apparel', label: 'Apparel', icon: '🛡️', color: '#4ecdc4' },
  AID: { id: 'aid', label: 'Aid', icon: '💊', color: '#ffe66d' },
  MISC: { id: 'misc', label: 'Misc', icon: '📦', color: '#a8e6cf' },
  AMMO: { id: 'ammo', label: 'Ammo', icon: '🔹', color: '#ffd93d' },
  KEY_ITEMS: { id: 'keyItems', label: 'Key Items', icon: '🔑', color: '#c9b1ff' },
};

export const EQUIP_SLOTS = {
  PRIMARY_WEAPON: { id: 'primaryWeapon', label: 'Primary Weapon', accepts: ['weapon', 'rifle', 'shotgun'] },
  SIDEARM: { id: 'sidearm', label: 'Sidearm', accepts: ['weapon', 'pistol', 'handgun'] },
  HEAD: { id: 'head', label: 'Head', accepts: ['headwear', 'helmet', 'hat'] },
  TORSO: { id: 'torso', label: 'Torso', accepts: ['armor', 'clothing', 'vest', 'jacket'] },
  HANDS: { id: 'hands', label: 'Hands', accepts: ['gloves', 'handwear'] },
  LEGS: { id: 'legs', label: 'Legs', accepts: ['pants', 'legArmor', 'legwear'] },
  FEET: { id: 'feet', label: 'Feet', accepts: ['footwear', 'boots', 'shoes'] },
  ACCESSORY_1: { id: 'accessory1', label: 'Accessory 1', accepts: ['accessory', 'misc', 'jewelry'] },
  ACCESSORY_2: { id: 'accessory2', label: 'Accessory 2', accepts: ['accessory', 'misc', 'jewelry'] },
};

// Weapon modification slots
export const WEAPON_MOD_SLOTS = {
  OPTIC: { id: 'optic', label: 'Optic', icon: '🔭' },
  MUZZLE: { id: 'muzzle', label: 'Muzzle', icon: '◉' },
  BARREL: { id: 'barrel', label: 'Barrel', icon: '▬' },
  GRIP: { id: 'grip', label: 'Grip', icon: '✊' },
  MAGAZINE: { id: 'magazine', label: 'Magazine', icon: '▮' },
  STOCK: { id: 'stock', label: 'Stock', icon: '⌐' },
  UNDERBARREL: { id: 'underbarrel', label: 'Underbarrel', icon: '⊥' },
  SPECIAL: { id: 'special', label: 'Special', icon: '★' },
};

// Weapon detail levels (from your settings)
export const WEAPON_DETAIL_LEVELS = {
  STANDARD: 'standard',
  GUN_NUT: 'gunNut',
  GUN_NUT_PLUS: 'gunNutPlus',
};

export const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  USE_ITEM: 'USE_ITEM',
  DROP_ITEM: 'DROP_ITEM',
  EQUIP_ITEM: 'EQUIP_ITEM',
  UNEQUIP_ITEM: 'UNEQUIP_ITEM',
  // Weapon-specific
  ATTACH_MOD: 'ATTACH_MOD',
  DETACH_MOD: 'DETACH_MOD',
  MAINTAIN_WEAPON: 'MAINTAIN_WEAPON',
  FIRE_WEAPON: 'FIRE_WEAPON',
  UPDATE_WEAPON_CONDITION: 'UPDATE_WEAPON_CONDITION',
  // Settings
  SET_WEAPON_DETAIL_LEVEL: 'SET_WEAPON_DETAIL_LEVEL',
  TOGGLE_WEIGHT_SYSTEM: 'TOGGLE_WEIGHT_SYSTEM',
  SET_CAPACITY: 'SET_CAPACITY',
  // Patching
  PATCH_ITEMS: 'PATCH_ITEMS',
  // Campaign isolation
  CLEAR_INVENTORY: 'CLEAR_INVENTORY',
  LOAD_STATE: 'LOAD_STATE',
  // UI feedback
  CLEAR_RECENTLY_ADDED: 'CLEAR_RECENTLY_ADDED',
};

// ============================================================================
// AUTO-ASSIGN EQUIP SLOTS
// ============================================================================

// Default equip slots by category
const DEFAULT_EQUIP_SLOTS: Record<string, string[]> = {
  weapons: ['primaryWeapon', 'sidearm'],
  apparel: [], // Will be determined by type
  aid: [],     // Consumables don't equip
  misc: ['accessory1', 'accessory2'],
  ammo: [],    // Ammo doesn't equip
  keyItems: [],// Key items don't equip
};

// More specific slots by item type
const EQUIP_SLOTS_BY_TYPE: Record<string, string[]> = {
  // Weapons
  'weapon': ['primaryWeapon', 'sidearm'],
  'rifle': ['primaryWeapon'],
  'shotgun': ['primaryWeapon'],
  'smg': ['primaryWeapon', 'sidearm'],
  'pistol': ['primaryWeapon', 'sidearm'],
  'revolver': ['primaryWeapon', 'sidearm'],
  'melee': ['primaryWeapon', 'sidearm'],
  'knife': ['sidearm'],
  'grenade': [],
  
  // Apparel
  'headwear': ['head'],
  'helmet': ['head'],
  'hat': ['head'],
  'torso': ['torso'],
  'armor': ['torso'],
  'vest': ['torso'],
  'jacket': ['torso'],
  'clothing': ['torso'],
  'gloves': ['hands'],
  'pants': ['legs'],
  'legarmor': ['legs'],
  'footwear': ['feet'],
  'boots': ['feet'],
  'shoes': ['feet'],
  
  // Accessories
  'accessory': ['accessory1', 'accessory2'],
  'misc': ['accessory1', 'accessory2'],
  'radio': ['accessory1', 'accessory2'],
  'watch': ['accessory1', 'accessory2'],
};

// Auto-assign equipSlots to an item if missing
export function ensureEquipSlots<T extends Partial<InventoryItem>>(item: T): T {
  // If item already has valid equipSlots, return as-is
  if (item.equipSlots && Array.isArray(item.equipSlots) && item.equipSlots.length > 0) {
    return item;
  }
  
  let assignedSlots: string[] = [];
  
  // Try to determine slots from item type first (more specific)
  if (item.type) {
    const typeKey = item.type.toLowerCase();
    if (EQUIP_SLOTS_BY_TYPE[typeKey]) {
      assignedSlots = EQUIP_SLOTS_BY_TYPE[typeKey];
    }
  }
  
  // If no slots from type, try weaponType
  if (assignedSlots.length === 0 && item.weaponType) {
    const weaponTypeKey = item.weaponType.toLowerCase();
    if (EQUIP_SLOTS_BY_TYPE[weaponTypeKey]) {
      assignedSlots = EQUIP_SLOTS_BY_TYPE[weaponTypeKey];
    }
  }
  
  // If still no slots, fall back to category defaults
  if (assignedSlots.length === 0 && item.category) {
    assignedSlots = DEFAULT_EQUIP_SLOTS[item.category] || [];
  }
  
  // Special case: if category is 'weapons' and still no slots, default to primary+sidearm
  if (assignedSlots.length === 0 && item.category === 'weapons') {
    assignedSlots = ['primaryWeapon', 'sidearm'];
  }
  
  if (assignedSlots.length > 0) {
    console.log(`[EQUIP SLOTS] Auto-assigned "${item.name}" → [${assignedSlots.join(', ')}]`);
  }
  
  return {
    ...item,
    equipSlots: assignedSlots,
  };
}

// Helper functions for creating items with proper slots
export function createWeaponItem(baseData: Partial<InventoryItem>): Partial<InventoryItem> {
  return ensureEquipSlots({
    category: 'weapons',
    stackable: false,
    consumable: false,
    weight: 3,
    value: 50,
    stats: {
      damage: 50,
      accuracy: 50,
      fireRate: 50,
      range: 50,
      stability: 50,
      handling: 50,
    },
    ...baseData,
  });
}

export function createApparelItem(baseData: Partial<InventoryItem>): Partial<InventoryItem> {
  return ensureEquipSlots({
    category: 'apparel',
    stackable: false,
    consumable: false,
    weight: 1,
    value: 25,
    ...baseData,
  });
}

export function createConsumableItem(baseData: Partial<InventoryItem>): Partial<InventoryItem> {
  return {
    category: 'aid',
    stackable: true,
    consumable: true,
    equipSlots: [], // Consumables don't equip
    weight: 0.2,
    value: 10,
    ...baseData,
  };
}

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryItem {
  id: string;
  instanceId: string;
  name: string;
  description?: string;
  category: string;
  type?: string;
  icon?: string;
  weight?: number;
  value?: number;
  quantity: number;
  stackable?: boolean;
  consumable?: boolean;
  equipSlots?: string[];
  // Weapon specific
  weaponType?: string;
  caliber?: string;
  stats?: {
    damage?: number;
    accuracy?: number;
    fireRate?: number;
    range?: number;
    stability?: number;
    handling?: number;
  };
  condition?: {
    barrelWear: number;
    carbonBuildup: number;
    springFatigue: number;
    riflingWear: number;
    roundsFired: number;
    lastMaintenance: number;
  };
  mods?: Record<string, WeaponMod>;
  compatibleSlots?: string[];
}

export interface WeaponMod {
  id: string;
  name: string;
  slot: string;
  statModifiers?: Record<string, number>;
}

export interface EquippedState {
  primaryWeapon: string | null;
  sidearm: string | null;
  head: string | null;
  torso: string | null;
  hands: string | null;
  legs: string | null;
  feet: string | null;
  accessory1: string | null;
  accessory2: string | null;
}

export interface InventorySettings {
  weightSystemEnabled: boolean;
  maxCapacity: number;
  currentWeight: number;
  weaponDetailLevel: string;
  equipmentWearEnabled: boolean;
}

export interface InventoryAction {
  type: string;
  item?: InventoryItem;
  quantity?: number;
  timestamp: number;
  narrativeHook: string | null;
  useDescription?: string;
  consumed?: boolean;
  slot?: string;
  mod?: WeaponMod;
  maintenanceType?: string;
  roundsFired?: number;
}

export interface InventoryState {
  items: InventoryItem[];
  equipped: EquippedState;
  settings: InventorySettings;
  lastAction: InventoryAction | null;
  recentlyAddedItems: string[]; // Instance IDs of recently added items (for highlight)
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export const createInitialState = (): InventoryState => ({
  items: [],
  equipped: {
    primaryWeapon: null,
    sidearm: null,
    head: null,
    torso: null,
    hands: null,
    legs: null,
    feet: null,
    accessory1: null,
    accessory2: null,
  },
  settings: {
    weightSystemEnabled: true,
    maxCapacity: 150,
    currentWeight: 0,
    weaponDetailLevel: WEAPON_DETAIL_LEVELS.GUN_NUT_PLUS,
    equipmentWearEnabled: true,
  },
  lastAction: null,
  recentlyAddedItems: [],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const calculateWeight = (items: InventoryItem[]): number => 
  items.reduce((t, i) => t + (i.weight || 0) * (i.quantity || 1), 0);

export const calculateWeaponCondition = (weapon: InventoryItem): number => {
  if (!weapon.condition) return 100;
  const { barrelWear, carbonBuildup, springFatigue, riflingWear } = weapon.condition;
  // Weighted average - barrel and rifling most important
  return Math.round(
    (100 - barrelWear) * 0.3 +
    (100 - carbonBuildup) * 0.2 +
    (100 - springFatigue) * 0.2 +
    (100 - riflingWear) * 0.3
  );
};

export const getConditionColor = (condition: number): string => {
  if (condition >= 80) return '#22c55e';
  if (condition >= 60) return '#84cc16';
  if (condition >= 40) return '#f59e0b';
  if (condition >= 20) return '#f97316';
  return '#ef4444';
};

export const getConditionLabel = (condition: number): string => {
  if (condition >= 90) return 'Pristine';
  if (condition >= 75) return 'Good';
  if (condition >= 50) return 'Worn';
  if (condition >= 25) return 'Poor';
  return 'Critical';
};

// ============================================================================
// REDUCER
// ============================================================================

export function inventoryReducer(state: InventoryState, action: { type: string; payload?: any }): InventoryState {
  const timestamp = Date.now();
  
  switch (action.type) {
case ACTIONS.ADD_ITEM: {
      const { item, quantity = 1 } = action.payload || {};
      
      // Validate item exists and has required fields
      if (!item || !item.id || !item.name) {
        console.error('[Inventory] Cannot add item: missing required fields (id, name)');
        return state;
      }
      
      // Validate quantity
      const validQuantity = Math.max(1, Math.floor(quantity) || 1);
      
      // AUTO-ASSIGN EQUIP SLOTS if missing
      let processedItem = ensureEquipSlots(item);
      
      // AUTO-POPULATE weapon data (stats, compatibleSlots, etc.) if it's a weapon
      if (processedItem.category === 'weapons') {
        processedItem = populateWeaponData(processedItem) as typeof processedItem;
      }
      
      const existingIndex = state.items.findIndex(i => i.id === processedItem.id && i.stackable);
      
      let newItems: InventoryItem[];
      let addedInstanceId: string;
      
      if (existingIndex !== -1 && processedItem.stackable) {
        // Stacking - use existing instanceId
        addedInstanceId = state.items[existingIndex].instanceId;
        const existingQuantity = state.items[existingIndex].quantity || 0;
        newItems = state.items.map((i, idx) => 
          idx === existingIndex ? { ...i, quantity: existingQuantity + validQuantity } : i
        );
      } else {
        // Create new item with instanceId
        addedInstanceId = `${processedItem.id}-${timestamp}`;
        let newItem: InventoryItem = { 
          ...processedItem, 
          quantity: validQuantity, 
          instanceId: addedInstanceId 
        } as InventoryItem;
        
        newItems = [...state.items, newItem];
      }
      
      // Add to recently added items (for visual highlight)
      const updatedRecentlyAdded = [...state.recentlyAddedItems, addedInstanceId];
      
      return {
        ...state,
        items: newItems,
        settings: { ...state.settings, currentWeight: calculateWeight(newItems) },
        recentlyAddedItems: updatedRecentlyAdded,
        lastAction: {
          type: 'ADD',
          item: processedItem,
          quantity: validQuantity,
          timestamp,
          narrativeHook: `picked up ${quantity > 1 ? `${quantity}x ` : ''}${processedItem.name}`,
        },
      };
    }
    
    case ACTIONS.PATCH_ITEMS: {
      return {
        ...state,
        items: action.payload.items,
      };
    }
    
    // REMOVE_ITEM - Remove specific quantity of an item by ID
    case ACTIONS.REMOVE_ITEM: {
      const { id, instanceId, quantity = 1 } = action.payload || {};
      
      // Find item by instanceId first, then by id
      const itemIndex = state.items.findIndex(i => 
        instanceId ? i.instanceId === instanceId : i.id === id
      );
      
      if (itemIndex === -1) {
        console.warn('[Inventory] REMOVE_ITEM: item not found', { id, instanceId });
        return state;
      }
      
      const item = state.items[itemIndex];
      let newItems: InventoryItem[];
      let removedQuantity = quantity;
      
      // Handle stackable items - reduce quantity or remove
      if (item.stackable && item.quantity > quantity) {
        newItems = state.items.map((i, idx) =>
          idx === itemIndex ? { ...i, quantity: i.quantity - quantity } : i
        );
      } else {
        // Remove entirely
        removedQuantity = item.quantity;
        newItems = state.items.filter((_, idx) => idx !== itemIndex);
        
        // Also unequip if equipped
        let newEquipped = { ...state.equipped };
        Object.keys(newEquipped).forEach(slot => {
          if (newEquipped[slot as keyof EquippedState] === item.instanceId) {
            (newEquipped as any)[slot] = null;
          }
        });
        
        return {
          ...state,
          items: newItems,
          equipped: newEquipped,
          settings: { ...state.settings, currentWeight: calculateWeight(newItems) },
          lastAction: {
            type: 'REMOVE',
            item,
            quantity: removedQuantity,
            timestamp,
            narrativeHook: `lost ${removedQuantity > 1 ? `${removedQuantity}x ` : ''}${item.name}`,
          },
        };
      }
      
      return {
        ...state,
        items: newItems,
        settings: { ...state.settings, currentWeight: calculateWeight(newItems) },
        lastAction: {
          type: 'REMOVE',
          item,
          quantity: removedQuantity,
          timestamp,
          narrativeHook: `lost ${removedQuantity > 1 ? `${removedQuantity}x ` : ''}${item.name}`,
        },
      };
    }
    
    case ACTIONS.DROP_ITEM: {
      const { instanceId } = action.payload;
      const item = state.items.find(i => i.instanceId === instanceId);
      if (!item) return state;
      
      let newEquipped = { ...state.equipped };
      Object.keys(newEquipped).forEach(slot => {
        if (newEquipped[slot as keyof EquippedState] === instanceId) {
          (newEquipped as any)[slot] = null;
        }
      });
      
      const newItems = state.items.filter(i => i.instanceId !== instanceId);
      
      return {
        ...state,
        items: newItems,
        equipped: newEquipped,
        settings: { ...state.settings, currentWeight: calculateWeight(newItems) },
        lastAction: {
          type: 'DROP',
          item,
          timestamp,
          narrativeHook: `dropped ${item.name}`,
        },
      };
    }
    
    case ACTIONS.USE_ITEM: {
      const { instanceId, useDescription, consumeOnUse = true } = action.payload;
      const item = state.items.find(i => i.instanceId === instanceId);
      if (!item) return state;
      
      let newItems = state.items;
      let consumed = false;
      
      if (consumeOnUse && item.consumable) {
        if (item.quantity > 1) {
          newItems = state.items.map(i => 
            i.instanceId === instanceId ? { ...i, quantity: i.quantity - 1 } : i
          );
        } else {
          newItems = state.items.filter(i => i.instanceId !== instanceId);
        }
        consumed = true;
      }
      
      return {
        ...state,
        items: newItems,
        settings: { ...state.settings, currentWeight: calculateWeight(newItems) },
        lastAction: {
          type: 'USE',
          item,
          useDescription,
          consumed,
          timestamp,
          narrativeHook: `[${item.name}] Use: ${useDescription}`,
        },
      };
    }
    
    case ACTIONS.EQUIP_ITEM: {
      const { instanceId, slot } = action.payload;
      const item = state.items.find(i => i.instanceId === instanceId);
      
      if (!item) {
        console.error('[EQUIP] Item not found:', instanceId);
        return state;
      }
      
      // Validate slot exists in equipped state
      if (!(slot in state.equipped)) {
        console.error(`[EQUIP] Slot "${slot}" does not exist in equipped state. Valid slots:`, Object.keys(state.equipped));
        return state;
      }
      
      // Validate item can be equipped to this slot
      if (item.equipSlots && !item.equipSlots.includes(slot)) {
        console.error(`[EQUIP] Item "${item.name}" cannot equip to slot "${slot}". Valid slots:`, item.equipSlots);
        return state;
      }
      
      // Unequip from any current slot first
      let newEquipped = { ...state.equipped };
      Object.keys(newEquipped).forEach(s => {
        if (newEquipped[s as keyof EquippedState] === instanceId) {
          (newEquipped as any)[s] = null;
        }
      });
      
      // Equip to new slot
      (newEquipped as any)[slot] = instanceId;
      
      console.log(`[EQUIP] ✅ "${item.name}" → ${slot}`);
      
      return {
        ...state,
        equipped: newEquipped,
        lastAction: {
          type: 'EQUIP',
          item,
          slot,
          timestamp,
          narrativeHook: `equipped ${item.name}`,
        },
      };
    }
    
    case ACTIONS.UNEQUIP_ITEM: {
      const { slot } = action.payload;
      const instanceId = state.equipped[slot as keyof EquippedState];
      const item = state.items.find(i => i.instanceId === instanceId);
      
      return {
        ...state,
        equipped: { ...state.equipped, [slot]: null },
        lastAction: {
          type: 'UNEQUIP',
          item,
          slot,
          timestamp,
          narrativeHook: item ? `unequipped ${item.name}` : null,
        },
      };
    }
    
    // Weapon modification actions
    case ACTIONS.ATTACH_MOD: {
      const { instanceId, slot, mod } = action.payload;
      const itemIndex = state.items.findIndex(i => i.instanceId === instanceId);
      if (itemIndex === -1) return state;
      
      const item = state.items[itemIndex];
      const newMods = { ...item.mods, [slot]: mod };
      const newItems = state.items.map((i, idx) => 
        idx === itemIndex ? { ...i, mods: newMods } : i
      );
      
      return {
        ...state,
        items: newItems,
        lastAction: {
          type: 'ATTACH_MOD',
          item,
          mod,
          slot,
          timestamp,
          narrativeHook: `attached ${mod.name} to ${item.name}`,
        },
      };
    }
    
    case ACTIONS.DETACH_MOD: {
      const { instanceId, slot } = action.payload;
      const itemIndex = state.items.findIndex(i => i.instanceId === instanceId);
      if (itemIndex === -1) return state;
      
      const item = state.items[itemIndex];
      const removedMod = item.mods?.[slot];
      const newMods = { ...item.mods };
      delete newMods[slot];
      
      const newItems = state.items.map((i, idx) => 
        idx === itemIndex ? { ...i, mods: newMods } : i
      );
      
      return {
        ...state,
        items: newItems,
        lastAction: {
          type: 'DETACH_MOD',
          item,
          mod: removedMod,
          slot,
          timestamp,
          narrativeHook: removedMod ? `removed ${removedMod.name} from ${item.name}` : null,
        },
      };
    }
    
    case ACTIONS.MAINTAIN_WEAPON: {
      const { instanceId, maintenanceType } = action.payload;
      const itemIndex = state.items.findIndex(i => i.instanceId === instanceId);
      if (itemIndex === -1) return state;
      
      const item = state.items[itemIndex];
      let newCondition = { ...item.condition! };
      let narrativeDesc = '';
      
      switch (maintenanceType) {
        case 'clean':
          newCondition.carbonBuildup = Math.max(0, newCondition.carbonBuildup - 50);
          narrativeDesc = 'cleaned the barrel and action';
          break;
        case 'oil':
          newCondition.barrelWear = Math.max(0, newCondition.barrelWear - 10);
          newCondition.springFatigue = Math.max(0, newCondition.springFatigue - 15);
          narrativeDesc = 'oiled the moving parts';
          break;
        case 'fullService':
          newCondition.carbonBuildup = 0;
          newCondition.barrelWear = Math.max(0, newCondition.barrelWear - 20);
          newCondition.springFatigue = Math.max(0, newCondition.springFatigue - 30);
          newCondition.lastMaintenance = timestamp;
          narrativeDesc = 'performed a full field strip and service';
          break;
        case 'replaceSpring':
          newCondition.springFatigue = 0;
          narrativeDesc = 'replaced the recoil spring';
          break;
        default:
          break;
      }
      
      const newItems = state.items.map((i, idx) => 
        idx === itemIndex ? { ...i, condition: newCondition } : i
      );
      
      return {
        ...state,
        items: newItems,
        lastAction: {
          type: 'MAINTAIN_WEAPON',
          item,
          maintenanceType,
          timestamp,
          narrativeHook: `[${item.name}] ${narrativeDesc}`,
        },
      };
    }
    
    case ACTIONS.FIRE_WEAPON: {
      const { instanceId, roundsFired = 1 } = action.payload;
      const itemIndex = state.items.findIndex(i => i.instanceId === instanceId);
      if (itemIndex === -1) return state;
      
      const item = state.items[itemIndex];
      if (!item.condition) return state;
      
      // Calculate wear based on rounds fired
      const wearFactor = roundsFired * 0.1;
      const newCondition = {
        ...item.condition,
        roundsFired: item.condition.roundsFired + roundsFired,
        carbonBuildup: Math.min(100, item.condition.carbonBuildup + wearFactor * 2),
        barrelWear: Math.min(100, item.condition.barrelWear + wearFactor * 0.5),
        springFatigue: Math.min(100, item.condition.springFatigue + wearFactor * 0.3),
        riflingWear: Math.min(100, item.condition.riflingWear + wearFactor * 0.2),
      };
      
      const newItems = state.items.map((i, idx) => 
        idx === itemIndex ? { ...i, condition: newCondition } : i
      );
      
      return {
        ...state,
        items: newItems,
        lastAction: {
          type: 'FIRE_WEAPON',
          item,
          roundsFired,
          timestamp,
          narrativeHook: null, // Firing is handled by combat system
        },
      };
    }
    
    case ACTIONS.SET_WEAPON_DETAIL_LEVEL: {
      return {
        ...state,
        settings: { ...state.settings, weaponDetailLevel: action.payload.level },
      };
    }
    
    case ACTIONS.TOGGLE_WEIGHT_SYSTEM: {
      return {
        ...state,
        settings: { ...state.settings, weightSystemEnabled: !state.settings.weightSystemEnabled },
      };
    }
    
// CLEAR_INVENTORY - Reset to empty state (CRITICAL for campaign isolation)
    case ACTIONS.CLEAR_INVENTORY:
    case 'CLEAR_INVENTORY': {
      console.log('[INVENTORY] Clearing all items for campaign switch');
      return createInitialState();
    }
    
    // LOAD_STATE - For restoring inventory from save
    case ACTIONS.LOAD_STATE:
    case 'LOAD_STATE': {
      const loaded = action.payload;
      if (!loaded) {
        console.log('[INVENTORY] LOAD_STATE with empty payload - returning fresh state');
        return createInitialState();
      }
      console.log('[INVENTORY] Loading state with', loaded.items?.length || 0, 'items');
      return {
        ...state,
        items: loaded.items || [],
        equipped: loaded.equipped || createInitialState().equipped,
        settings: { 
          ...state.settings, 
          ...loaded.settings,
          currentWeight: calculateWeight(loaded.items || []),
        },
        lastAction: null,
        recentlyAddedItems: [], // Clear on load
      };
    }
    
    // CLEAR_RECENTLY_ADDED - Clear the highlight flags
    case ACTIONS.CLEAR_RECENTLY_ADDED:
    case 'CLEAR_RECENTLY_ADDED': {
      const { instanceId } = action.payload || {};
      if (instanceId) {
        // Clear specific item
        return {
          ...state,
          recentlyAddedItems: state.recentlyAddedItems.filter(id => id !== instanceId),
        };
      }
      // Clear all
      return {
        ...state,
        recentlyAddedItems: [],
      };
    }
    
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface InventoryContextType {
  state: InventoryState;
  dispatch: React.Dispatch<{ type: string; payload?: any }>;
  addItem: (item: Partial<InventoryItem>, qty?: number) => void;
  dropItem: (instanceId: string) => void;
  useItem: (instanceId: string, desc: string, consume?: boolean) => void;
  equipItem: (instanceId: string, slot: string) => void;
  unequipItem: (slot: string) => void;
  attachMod: (instanceId: string, slot: string, mod: WeaponMod) => void;
  detachMod: (instanceId: string, slot: string) => void;
  maintainWeapon: (instanceId: string, type: string) => void;
  fireWeapon: (instanceId: string, rounds?: number) => void;
  isEquipped: (instanceId: string) => boolean;
  getEquippedSlot: (instanceId: string) => string | undefined;
  getWeaponCondition: (weapon: InventoryItem) => number;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export interface InventoryProviderProps {
  children: React.ReactNode;
  onNarrativeAction?: (action: InventoryAction) => void;
}

export function InventoryProvider({ children, onNarrativeAction }: InventoryProviderProps) {
  const [state, dispatch] = useReducer(inventoryReducer, null, createInitialState);
  
  useEffect(() => {
    if (state.lastAction?.narrativeHook && onNarrativeAction) {
      onNarrativeAction(state.lastAction);
    }
  }, [state.lastAction, onNarrativeAction]);
  
  // Auto-clear "new" highlight after 5 seconds
  useEffect(() => {
    if (state.recentlyAddedItems.length === 0) return;
    
    const timer = setTimeout(() => {
      dispatch({ type: ACTIONS.CLEAR_RECENTLY_ADDED, payload: {} });
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [state.recentlyAddedItems]);
  
  const value: InventoryContextType = {
    state,
    dispatch,
    // Item actions
    addItem: (item, qty = 1) => dispatch({ type: ACTIONS.ADD_ITEM, payload: { item, quantity: qty } }),
    dropItem: (instanceId) => dispatch({ type: ACTIONS.DROP_ITEM, payload: { instanceId } }),
    useItem: (instanceId, desc, consume = true) => dispatch({ type: ACTIONS.USE_ITEM, payload: { instanceId, useDescription: desc, consumeOnUse: consume } }),
    equipItem: (instanceId, slot) => dispatch({ type: ACTIONS.EQUIP_ITEM, payload: { instanceId, slot } }),
    unequipItem: (slot) => dispatch({ type: ACTIONS.UNEQUIP_ITEM, payload: { slot } }),
    // Weapon actions
    attachMod: (instanceId, slot, mod) => dispatch({ type: ACTIONS.ATTACH_MOD, payload: { instanceId, slot, mod } }),
    detachMod: (instanceId, slot) => dispatch({ type: ACTIONS.DETACH_MOD, payload: { instanceId, slot } }),
    maintainWeapon: (instanceId, type) => dispatch({ type: ACTIONS.MAINTAIN_WEAPON, payload: { instanceId, maintenanceType: type } }),
    fireWeapon: (instanceId, rounds = 1) => dispatch({ type: ACTIONS.FIRE_WEAPON, payload: { instanceId, roundsFired: rounds } }),
    // Helpers
    isEquipped: (instanceId) => Object.values(state.equipped).includes(instanceId),
    getEquippedSlot: (instanceId) => Object.keys(state.equipped).find(s => state.equipped[s as keyof EquippedState] === instanceId),
    getWeaponCondition: (weapon) => calculateWeaponCondition(weapon),
  };
  
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextType {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}

export function useInventoryOptional(): InventoryContextType | null {
  return useContext(InventoryContext);
}

// ============================================================================
// EXPORTS FOR EXTERNAL USE
// ============================================================================

export {
  InventoryContext,
};

// Export a serialization helper for campaign persistence
export function serializeInventoryState(state: InventoryState): string {
  return JSON.stringify(state);
}

export function deserializeInventoryState(json: string): InventoryState {
  try {
    const parsed = JSON.parse(json);
    return {
      ...createInitialState(),
      ...parsed,
    };
  } catch {
    return createInitialState();
  }
}

// ============================================================================
// STYLES
// ============================================================================

const s = {
  bg: '#0a0a0f',
  bgSecondary: '#12121a',
  bgTertiary: '#1a1a25',
  bgQuaternary: '#222230',
  accent: 'var(--accent-primary)',
  accentHover: 'var(--accent-secondary)',
  accentMuted: 'var(--accent-bg)',
  cyan: '#22d3ee',
  cyanMuted: 'rgba(34, 211, 238, 0.15)',
  text: '#e4e4e7',
  textMuted: '#71717a',
  textDim: '#52525b',
  border: '#27272a',
  borderLight: '#3f3f46',
  danger: '#ef4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
  success: '#22c55e',
  successMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  orange: '#f97316',
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function EquippedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '18px', height: '18px', borderRadius: '4px',
      background: `linear-gradient(135deg, ${s.cyan}, ${s.accent})`,
      color: '#fff', fontSize: '10px', fontWeight: '700', marginLeft: '8px',
      boxShadow: `0 0 8px ${s.cyan}40`,
    }}>E</span>
  );
}

interface ConditionBarProps {
  condition: number;
  showLabel?: boolean;
  size?: 'normal' | 'small';
}

function ConditionBar({ condition, showLabel = true, size = 'normal' }: ConditionBarProps) {
  const color = getConditionColor(condition);
  const label = getConditionLabel(condition);
  const height = size === 'small' ? '3px' : '6px';
  
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
          <span style={{ color: s.textMuted }}>CONDITION</span>
          <span style={{ color }}>{label} ({condition}%)</span>
        </div>
      )}
      <div style={{ height, background: s.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${condition}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

interface EquipSlotsPanelProps {
  equipped: EquippedState;
  items: InventoryItem[];
  onSlotClick: (slotId: string, item: InventoryItem) => void;
}

function EquipSlotsPanel({ equipped, items, onSlotClick }: EquipSlotsPanelProps) {
  const getEquippedItem = (slotId: string): InventoryItem | null => {
    const instanceId = equipped[slotId as keyof EquippedState];
    return instanceId ? items.find(i => i.instanceId === instanceId) || null : null;
  };
  
  return (
    <div style={{ background: s.bgSecondary, borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ color: s.text, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: s.cyan }}>⚡</span>Equipped
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {Object.entries(EQUIP_SLOTS).map(([key, slot]) => {
          const item = getEquippedItem(slot.id);
          return (
            <button key={slot.id} onClick={() => item && onSlotClick(slot.id, item)} style={{
              padding: '10px 12px',
              background: item ? s.cyanMuted : s.bgTertiary,
              border: `1px solid ${item ? s.cyan + '40' : s.border}`,
              borderRadius: '6px',
              cursor: item ? 'pointer' : 'default',
              textAlign: 'left',
            }}>
              <div style={{ color: s.textDim, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{slot.label}</div>
              <div style={{ color: item ? s.cyan : s.textDim, fontSize: '12px', fontWeight: item ? '500' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item ? item.name : '—'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface WeightBarProps {
  current: number;
  max: number;
  enabled: boolean;
}

function WeightBar({ current, max, enabled }: WeightBarProps) {
  if (!enabled) return null;
  const percentage = Math.min((current / max) * 100, 100);
  const isOverweight = current > max;
  
  return (
    <div style={{ padding: '12px 16px', background: s.bgSecondary, borderTop: `1px solid ${s.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
        <span style={{ color: s.textMuted }}>CARRY WEIGHT</span>
        <span style={{ color: isOverweight ? s.danger : s.text }}>{current.toFixed(1)} / {max} lbs</span>
      </div>
      <div style={{ height: '4px', background: s.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: isOverweight ? s.danger : percentage > 80 ? s.warning : `linear-gradient(90deg, ${s.accent}, ${s.cyan})`,
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

interface CategoryDropdownProps {
  category: { id: string; label: string; icon: string; color: string };
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  equippedItems: string[];
  recentlyAddedItems: string[];
  onDismissNew: (instanceId: string) => void;
}

function CategoryDropdown({ category, items, onItemClick, equippedItems, recentlyAddedItems, onDismissNew }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const categoryItems = items.filter(item => item.category === category.id);
  const itemCount = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasNewItems = categoryItems.some(item => recentlyAddedItems.includes(item.instanceId));
  
  if (categoryItems.length === 0) return null;
  
  return (
    <div style={{ marginBottom: '4px' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: isOpen ? s.bgTertiary : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${category.color}`,
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>{category.icon}</span>
          <span style={{ color: s.text, fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {category.label}
          </span>
          <span style={{ color: s.textMuted, fontSize: '12px', background: s.bgSecondary, padding: '2px 8px', borderRadius: '10px' }}>
            {itemCount}
          </span>
          {hasNewItems && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: s.successMuted,
              color: s.success,
              fontWeight: '600',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}>NEW</span>
          )}
        </div>
        <span style={{ color: s.textMuted, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{ background: s.bgSecondary, borderLeft: `3px solid ${category.color}20` }}>
          {categoryItems.map(item => (
            <ItemRow 
              key={item.instanceId} 
              item={item} 
              isEquipped={equippedItems.includes(item.instanceId)}
              isNew={recentlyAddedItems.includes(item.instanceId)}
              categoryColor={category.color} 
              onClick={() => onItemClick(item)}
              onDismissNew={() => onDismissNew(item.instanceId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ItemRowProps {
  item: InventoryItem;
  isEquipped: boolean;
  isNew?: boolean;
  categoryColor: string;
  onClick: () => void;
  onDismissNew?: () => void;
}

function ItemRow({ item, isEquipped, isNew = false, categoryColor, onClick, onDismissNew }: ItemRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const condition = item.category === 'weapons' ? calculateWeaponCondition(item) : null;
  
  // Determine background based on state priority: new > equipped > hover
  const getBackground = () => {
    if (isNew) return `linear-gradient(90deg, ${s.successMuted}, transparent)`;
    if (isHovered) return isEquipped ? s.cyanMuted : s.accentMuted;
    return 'transparent';
  };
  
  return (
    <button onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px 10px 28px',
        background: getBackground(),
        border: 'none',
        borderBottom: `1px solid ${s.border}`,
        borderLeft: isNew ? `3px solid ${s.success}` : undefined,
        cursor: 'pointer',
        transition: 'background 0.3s ease, border-left 0.3s ease',
        animation: isNew ? 'fade-in 0.3s ease-out' : undefined,
      }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        background: isNew 
          ? `linear-gradient(135deg, ${s.success}30, ${s.success}10)` 
          : `linear-gradient(135deg, ${categoryColor}30, ${categoryColor}10)`,
        border: `1px solid ${isNew ? s.success : categoryColor}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        fontSize: '18px',
        position: 'relative',
        boxShadow: isNew ? `0 0 12px ${s.success}40` : undefined,
        transition: 'box-shadow 0.3s ease, background 0.3s ease',
      }}>
        {item.icon || '•'}
        {condition !== null && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: getConditionColor(condition),
            border: `2px solid ${s.bgSecondary}`,
          }} />
        )}
      </div>
      
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: isNew ? s.success : isEquipped ? s.cyan : s.text, fontSize: '14px', fontWeight: isEquipped || isNew ? '600' : '400' }}>
            {item.name}
          </span>
          {isNew && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onDismissNew?.();
              }}
              style={{
                marginLeft: '8px',
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '3px',
                background: s.success,
                color: '#fff',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Click to dismiss"
            >NEW</span>
          )}
          {isEquipped && <EquippedBadge />}
          {item.quantity > 1 && <span style={{ color: s.textMuted, fontSize: '12px', marginLeft: '8px' }}>×{item.quantity}</span>}
        </div>
        {item.description && <span style={{ color: s.textDim, fontSize: '11px', display: 'block', marginTop: '2px' }}>{item.description}</span>}
      </div>
      
      {(item.weight ?? 0) > 0 && <span style={{ color: s.textMuted, fontSize: '11px', marginLeft: '12px' }}>{((item.weight ?? 0) * item.quantity).toFixed(1)} lbs</span>}
    </button>
  );
}


interface ItemActionModalProps {
  item: InventoryItem;
  onClose: () => void;
  onUse: (description: string) => void;
  onDrop: () => void;
  onEquip: (slot: string) => void;
  onUnequip: (slot: string) => void;
  onArsenal: () => void;
  isEquipped: boolean;
  equippedSlot?: string;
  equippedState: EquippedState;
}

function ItemActionModal({ item, onClose, onUse, onDrop, onEquip, onUnequip, onArsenal, isEquipped, equippedSlot, equippedState }: ItemActionModalProps) {
  const [useDescription, setUseDescription] = useState('');
  const canEquip = item.equipSlots && item.equipSlots.length > 0;
  const isWeapon = item.category === 'weapons';
  
  // Smart equip - find first empty slot or use first valid slot
  const handleEquip = () => {
    if (!item.equipSlots || item.equipSlots.length === 0) {
      console.error('[EQUIP] Item has no valid equip slots');
      return;
    }
    
    // If single slot, use it directly
    if (item.equipSlots.length === 1) {
      onEquip(item.equipSlots[0]);
    } else {
      // Multiple slots - find first empty slot
      const firstEmptySlot = item.equipSlots.find(slotId => !equippedState[slotId as keyof EquippedState]);
      onEquip(firstEmptySlot || item.equipSlots[0]);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: `${s.bg}f0`,
        border: `1px solid ${s.border}`,
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        overflow: 'hidden',
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px ${s.accent}20`,
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${s.border}`, background: s.bgSecondary }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${s.accent}30, ${s.accent}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>{item.icon || '📦'}</div>
              <div>
                <h3 style={{ color: s.text, fontSize: '18px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center' }}>
                  {item.name}{isEquipped && <EquippedBadge />}
                </h3>
                <span style={{ color: s.textMuted, fontSize: '12px', textTransform: 'uppercase' }}>{item.type || item.category}</span>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: s.bgTertiary,
              color: s.textMuted,
              cursor: 'pointer',
              fontSize: '18px',
            }}>✕</button>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px' }}>
            {(item.weight ?? 0) > 0 && <span style={{ color: s.textMuted }}>Weight: <span style={{ color: s.text }}>{item.weight} lbs</span></span>}
            {(item.value ?? 0) > 0 && <span style={{ color: s.textMuted }}>Value: <span style={{ color: s.warning }}>${item.value}</span></span>}
            {item.quantity > 1 && <span style={{ color: s.textMuted }}>Qty: <span style={{ color: s.text }}>{item.quantity}</span></span>}
          </div>
          
          {isWeapon && item.condition && (
            <div style={{ marginTop: '12px' }}>
              <ConditionBar condition={calculateWeaponCondition(item)} size="small" />
            </div>
          )}
        </div>
        
        {item.description && (
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}`, color: s.textMuted, fontSize: '13px', lineHeight: '1.5' }}>
            {item.description}
          </div>
        )}
        
        {/* Use Section */}
        <div style={{ padding: '20px' }}>
          <label style={{ display: 'block', color: s.text, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            How do you want to use this?
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={useDescription} onChange={(e) => setUseDescription(e.target.value)}
              placeholder={`Use ${item.name} to...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: s.bgTertiary,
                border: `1px solid ${s.border}`,
                borderRadius: '8px',
                color: s.text,
                fontSize: '14px',
                outline: 'none',
              }} />
            <button onClick={() => { if (useDescription.trim()) onUse(useDescription); }}
              disabled={!useDescription.trim()}
              style={{
                padding: '12px 20px',
                background: useDescription.trim() ? `linear-gradient(135deg, ${s.accent}, ${s.accentHover})` : s.bgTertiary,
                border: 'none',
                borderRadius: '8px',
                color: useDescription.trim() ? '#fff' : s.textDim,
                fontSize: '14px',
                fontWeight: '600',
                cursor: useDescription.trim() ? 'pointer' : 'not-allowed',
              }}>Use</button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canEquip && !isEquipped && (
            <button onClick={handleEquip} style={{
              flex: 1,
              padding: '12px',
              background: s.cyanMuted,
              border: `1px solid ${s.cyan}40`,
              borderRadius: '8px',
              color: s.cyan,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>⚡ Equip</button>
          )}
          
          {isEquipped && equippedSlot && (
            <button onClick={() => onUnequip(equippedSlot)} style={{
              flex: 1,
              padding: '12px',
              background: s.bgTertiary,
              border: `1px solid ${s.border}`,
              borderRadius: '8px',
              color: s.textMuted,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>↩ Unequip</button>
          )}
          
          {isWeapon && (
            <button onClick={onArsenal} style={{
              flex: 1,
              padding: '12px',
              background: s.warningMuted,
              border: `1px solid ${s.warning}40`,
              borderRadius: '8px',
              color: s.warning,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>🔧 Arsenal</button>
          )}
          
          <button onClick={onDrop} style={{
            padding: '12px 16px',
            background: s.dangerMuted,
            border: `1px solid ${s.danger}30`,
            borderRadius: '8px',
            color: s.danger,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>↓ Drop</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ARSENAL / WEAPON EDITOR COMPONENTS
// ============================================================================

interface WeaponStatsProps {
  weapon: InventoryItem;
}

function WeaponStats({ weapon }: WeaponStatsProps) {
  const stats = weapon.stats || {};
  const mods = weapon.mods || {};
  
  const getModifiedStat = (baseStat: number, statKey: string): number => {
    let modified = baseStat;
    Object.values(mods).forEach(mod => {
      if (mod?.statModifiers?.[statKey]) {
        modified += mod.statModifiers[statKey];
      }
    });
    return modified;
  };
  
  const statItems = [
    { key: 'damage', label: 'Damage', base: stats.damage || 0, icon: '💥' },
    { key: 'accuracy', label: 'Accuracy', base: stats.accuracy || 0, icon: '🎯' },
    { key: 'fireRate', label: 'Fire Rate', base: stats.fireRate || 0, icon: '⚡' },
    { key: 'range', label: 'Range', base: stats.range || 0, icon: '📏' },
    { key: 'stability', label: 'Stability', base: stats.stability || 0, icon: '🔒' },
    { key: 'handling', label: 'Handling', base: stats.handling || 0, icon: '✋' },
  ];
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
      {statItems.map(stat => {
        const modified = getModifiedStat(stat.base, stat.key);
        const diff = modified - stat.base;
        
        return (
          <div key={stat.key} style={{
            padding: '10px 12px',
            background: s.bgTertiary,
            borderRadius: '6px',
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px' }}>{stat.icon}</span>
              <span style={{ color: s.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ color: s.text, fontSize: '18px', fontWeight: '600' }}>{modified}</span>
              {diff !== 0 && (
                <span style={{ color: diff > 0 ? s.success : s.danger, fontSize: '12px', fontWeight: '500' }}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              )}
            </div>
            <div style={{ marginTop: '6px', height: '3px', background: s.bgSecondary, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(modified, 100)}%`,
                background: diff > 0 ? s.success : diff < 0 ? s.danger : s.accent,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface WeaponConditionPanelProps {
  weapon: InventoryItem;
  detailLevel: string;
  onMaintain: (type: string) => void;
}

function WeaponConditionPanel({ weapon, detailLevel, onMaintain }: WeaponConditionPanelProps) {
  const condition = weapon.condition ?? {
    barrelWear: 0,
    carbonBuildup: 0,
    springFatigue: 0,
    riflingWear: 0,
    roundsFired: 0,
    lastMaintenance: 0,
  };
  const overallCondition = calculateWeaponCondition(weapon);
  
  const showDetailed = detailLevel === WEAPON_DETAIL_LEVELS.GUN_NUT || 
                       detailLevel === WEAPON_DETAIL_LEVELS.GUN_NUT_PLUS;
  const showFull = detailLevel === WEAPON_DETAIL_LEVELS.GUN_NUT_PLUS;
  
  const conditionItems = [
    { key: 'carbonBuildup', label: 'Carbon Buildup', value: condition.carbonBuildup, inverted: true },
    { key: 'barrelWear', label: 'Barrel Wear', value: condition.barrelWear, inverted: true },
    { key: 'springFatigue', label: 'Spring Fatigue', value: condition.springFatigue, inverted: true },
    { key: 'riflingWear', label: 'Rifling Wear', value: condition.riflingWear, inverted: true },
  ];
  
  return (
    <div style={{ background: s.bgSecondary, borderRadius: '8px', padding: '16px', border: `1px solid ${s.border}` }}>
      <h4 style={{
        color: s.text, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '16px', marginTop: 0,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ color: s.warning }}>🔧</span>Weapon Condition
      </h4>
      
      <div style={{ marginBottom: '16px' }}>
        <ConditionBar condition={overallCondition} />
      </div>
      
      {showDetailed && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: s.textDim, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Detailed Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conditionItems.map(item => {
              const displayValue = item.inverted ? 100 - item.value : item.value;
              const color = getConditionColor(displayValue);
              
              return (
                <div key={item.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span style={{ color: s.textMuted }}>{item.label}</span>
                    <span style={{ color }}>{item.value.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '4px', background: s.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.value}%`,
                      background: item.value > 50 ? s.danger : item.value > 25 ? s.warning : s.success,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {showFull && (
        <div style={{ padding: '12px', background: s.bgTertiary, borderRadius: '6px', marginBottom: '16px', fontSize: '11px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div>
              <span style={{ color: s.textDim }}>Rounds Fired: </span>
              <span style={{ color: s.text }}>{condition.roundsFired || 0}</span>
            </div>
            <div>
              <span style={{ color: s.textDim }}>Last Service: </span>
              <span style={{ color: s.text }}>
                {condition.lastMaintenance ? new Date(condition.lastMaintenance).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ color: s.textDim, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
        Maintenance
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={() => onMaintain('clean')} style={{
          padding: '8px 14px', background: s.bgTertiary, border: `1px solid ${s.border}`,
          borderRadius: '6px', color: s.text, fontSize: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>🧹 Clean</button>
        <button onClick={() => onMaintain('oil')} style={{
          padding: '8px 14px', background: s.bgTertiary, border: `1px solid ${s.border}`,
          borderRadius: '6px', color: s.text, fontSize: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>🛢️ Oil</button>
        <button onClick={() => onMaintain('fullService')} style={{
          padding: '8px 14px', background: s.accentMuted, border: `1px solid ${s.accent}40`,
          borderRadius: '6px', color: s.accent, fontSize: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>🔧 Full Service</button>
        {showFull && (condition.springFatigue ?? 0) > 50 && (
          <button onClick={() => onMaintain('replaceSpring')} style={{
            padding: '8px 14px', background: s.warningMuted, border: `1px solid ${s.warning}40`,
            borderRadius: '6px', color: s.warning, fontSize: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>🔄 Replace Spring</button>
        )}
      </div>
    </div>
  );
}

interface ModSlotProps {
  slot: { id: string; label: string; icon: string };
  currentMod: WeaponMod | null | undefined;
  availableMods: WeaponMod[];
  onAttach: (mod: WeaponMod) => void;
  onDetach: () => void;
}

function ModSlot({ slot, currentMod, availableMods, onAttach, onDetach }: ModSlotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <button onClick={() => setIsExpanded(!isExpanded)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: currentMod ? s.cyanMuted : s.bgTertiary,
        border: `1px solid ${currentMod ? s.cyan + '40' : s.border}`,
        borderRadius: isExpanded ? '6px 6px 0 0' : '6px', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', opacity: 0.7 }}>{slot.icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: s.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{slot.label}</div>
            <div style={{ color: currentMod ? s.cyan : s.textDim, fontSize: '13px', fontWeight: currentMod ? '500' : '400' }}>
              {currentMod ? currentMod.name : 'Empty'}
            </div>
          </div>
        </div>
        <span style={{ color: s.textMuted, fontSize: '12px', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      
      {isExpanded && (
        <div style={{ background: s.bgSecondary, border: `1px solid ${s.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '8px' }}>
          {currentMod && (
            <button onClick={() => { onDetach(); setIsExpanded(false); }} style={{
              width: '100%', padding: '10px 12px', marginBottom: '8px',
              background: s.dangerMuted, border: `1px solid ${s.danger}30`,
              borderRadius: '4px', color: s.danger, fontSize: '12px', cursor: 'pointer', textAlign: 'left',
            }}>✕ Remove {currentMod.name}</button>
          )}
          
          {availableMods.length > 0 ? availableMods.map(mod => (
            <button key={mod.id} onClick={() => { onAttach(mod); setIsExpanded(false); }} style={{
              width: '100%', padding: '10px 12px', marginBottom: '4px',
              background: s.bgTertiary, border: `1px solid ${s.border}`,
              borderRadius: '4px', color: s.text, fontSize: '12px', cursor: 'pointer',
              textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{mod.name}</span>
              {mod.statModifiers && (
                <span style={{ color: s.success, fontSize: '10px' }}>
                  {Object.entries(mod.statModifiers).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ')}
                </span>
              )}
            </button>
          )) : (
            <div style={{ padding: '12px', color: s.textDim, fontSize: '12px', textAlign: 'center' }}>
              No compatible mods available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ArsenalScreenProps {
  weapon: InventoryItem;
  onClose: () => void;
  availableMods?: WeaponMod[];
}

function ArsenalScreen({ weapon, onClose, availableMods = [] }: ArsenalScreenProps) {
  const inv = useInventory();
  const detailLevel = inv.state.settings.weaponDetailLevel;
  
  const handleMaintain = (type: string) => inv.maintainWeapon(weapon.instanceId, type);
  const handleAttachMod = (slot: string, mod: WeaponMod) => inv.attachMod(weapon.instanceId, slot, mod);
  const handleDetachMod = (slot: string) => inv.detachMod(weapon.instanceId, slot);
  
  const currentWeapon = inv.state.items.find(i => i.instanceId === weapon.instanceId) || weapon;
  const isEquipped = inv.isEquipped(weapon.instanceId);
  
  // Get mods from weaponModsSystem if not passed, based on weapon's compatible slots
  const weaponMods = availableMods.length > 0 
    ? availableMods 
    : getCompatibleModsArray(currentWeapon) as WeaponMod[];
  
  const getModsForSlot = (slotId: string) => weaponMods.filter(mod => 
    mod.slot === slotId && currentWeapon.mods?.[slotId]?.id !== mod.id
  );
  
  // Get compatible slots for this weapon (from weapon data or derive from type)
  const compatibleSlots = currentWeapon.compatibleSlots || ['optic', 'muzzle', 'grip', 'magazine'];
  
  // Debug logging
  useEffect(() => {
    console.log('[ARSENAL] Weapon:', currentWeapon.name);
    console.log('[ARSENAL] Stats:', currentWeapon.stats);
    console.log('[ARSENAL] Compatible slots:', compatibleSlots);
    console.log('[ARSENAL] Available mods:', weaponMods.length);
  }, [currentWeapon, weaponMods]);
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: s.bg, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}`, background: s.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
          background: 'transparent', border: 'none', color: s.textMuted, fontSize: '14px', cursor: 'pointer',
        }}>← Back to Inventory</button>
        <h2 style={{ color: s.warning, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔧 Arsenal
        </h2>
        <div style={{ width: '100px' }} />
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Weapon Header */}
        <div style={{ background: s.bgSecondary, borderRadius: '12px', padding: '20px', marginBottom: '16px', border: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${s.warning}30, ${s.warning}10)`,
              border: `1px solid ${s.warning}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
            }}>{currentWeapon.icon || '🔫'}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: s.text, fontSize: '20px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center' }}>
                {currentWeapon.name}{isEquipped && <EquippedBadge />}
              </h3>
              <div style={{ color: s.textMuted, fontSize: '12px', marginTop: '4px' }}>
                {currentWeapon.weaponType || 'Firearm'} • {currentWeapon.caliber || '9mm'}
              </div>
            </div>
          </div>
          <ConditionBar condition={calculateWeaponCondition(currentWeapon)} size="small" showLabel={false} />
        </div>
        
        {/* Stats Panel */}
        <div style={{ background: s.bgSecondary, borderRadius: '8px', padding: '16px', marginBottom: '16px', border: `1px solid ${s.border}` }}>
          <h4 style={{ color: s.text, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: 0 }}>
            Weapon Stats
          </h4>
          <WeaponStats weapon={currentWeapon} />
        </div>
        
        {/* Modifications Panel */}
        <div style={{ background: s.bgSecondary, borderRadius: '8px', padding: '16px', marginBottom: '16px', border: `1px solid ${s.border}` }}>
          <h4 style={{ color: s.text, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: s.cyan }}>⚙️</span>Modifications
          </h4>
          {compatibleSlots.map(slotId => {
            const slotDef = WEAPON_MOD_SLOTS[slotId.toUpperCase() as keyof typeof WEAPON_MOD_SLOTS] || 
              { id: slotId, label: slotId.charAt(0).toUpperCase() + slotId.slice(1), icon: '•' };
            return (
              <ModSlot key={slotId} slot={slotDef} currentMod={currentWeapon.mods?.[slotId]}
                availableMods={getModsForSlot(slotId)}
                onAttach={(mod) => handleAttachMod(slotId, mod)}
                onDetach={() => handleDetachMod(slotId)} />
            );
          })}
        </div>
        
        {/* Condition Panel */}
        {inv.state.settings.equipmentWearEnabled && (
          <WeaponConditionPanel weapon={currentWeapon} detailLevel={detailLevel} onMaintain={handleMaintain} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN INVENTORY SCREEN
// ============================================================================

export interface InventoryScreenProps {
  isOpen: boolean;
  onClose: () => void;
  availableMods?: WeaponMod[];
}

export function InventoryScreen({ isOpen, onClose, availableMods = [] }: InventoryScreenProps) {
  const inv = useInventory();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [arsenalWeapon, setArsenalWeapon] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const equippedIds = Object.values(inv.state.equipped).filter(Boolean) as string[];
  const filteredItems = searchQuery
    ? inv.state.items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : inv.state.items;
  
  const handleUse = (desc: string) => { 
    if (selectedItem) {
      inv.useItem(selectedItem.instanceId, desc); 
      setSelectedItem(null); 
      onClose(); 
    }
  };
  const handleDrop = () => { 
    if (selectedItem) {
      inv.dropItem(selectedItem.instanceId); 
      setSelectedItem(null); 
    }
  };
  const handleEquip = (slot: string) => { 
    if (selectedItem) {
      inv.equipItem(selectedItem.instanceId, slot); 
      setSelectedItem(null); 
    }
  };
  const handleUnequip = (slot: string) => { 
    inv.unequipItem(slot); 
    setSelectedItem(null); 
  };
  const handleArsenal = () => { 
    setArsenalWeapon(selectedItem); 
    setSelectedItem(null); 
  };
  
  if (!isOpen) return null;
  
  if (arsenalWeapon) {
    return <ArsenalScreen weapon={arsenalWeapon} onClose={() => setArsenalWeapon(null)} availableMods={availableMods} />;
  }
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: s.bg, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.bgSecondary }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: s.textMuted, fontSize: '14px', cursor: 'pointer' }}>
          ← Back
        </button>
        <h2 style={{ color: s.text, fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Inventory</h2>
        <div style={{ color: s.textMuted, fontSize: '12px' }}>{inv.state.items.length} items</div>
      </div>
      
      {/* Search */}
      <div style={{ padding: '12px 16px', background: s.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: s.bgSecondary, border: `1px solid ${s.border}`, borderRadius: '8px' }}>
          <span style={{ color: s.textDim }}>🔍</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: s.text, fontSize: '14px', outline: 'none' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: s.textDim, cursor: 'pointer' }}>✕</button>}
        </div>
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <EquipSlotsPanel equipped={inv.state.equipped} items={inv.state.items} onSlotClick={(_, item) => item && setSelectedItem(item)} />
{Object.values(CATEGORIES).map(cat => (
          <CategoryDropdown 
            key={cat.id} 
            category={cat} 
            items={filteredItems} 
            onItemClick={setSelectedItem} 
            equippedItems={equippedIds} 
            recentlyAddedItems={inv.state.recentlyAddedItems}
            onDismissNew={(instanceId) => inv.dispatch({ type: ACTIONS.CLEAR_RECENTLY_ADDED, payload: { instanceId } })}
          />
        ))}
      </div>
      
      <WeightBar current={inv.state.settings.currentWeight} max={inv.state.settings.maxCapacity} enabled={inv.state.settings.weightSystemEnabled} />
      
      {selectedItem && (
        <ItemActionModal item={selectedItem} onClose={() => setSelectedItem(null)}
          onUse={handleUse} onDrop={handleDrop} onEquip={handleEquip} onUnequip={handleUnequip} onArsenal={handleArsenal}
          isEquipped={inv.isEquipped(selectedItem.instanceId)} equippedSlot={inv.getEquippedSlot(selectedItem.instanceId)}
          equippedState={inv.state.equipped} />
      )}
    </div>
  );
}
