import React, { useState, useCallback, createContext, useContext, useReducer, useEffect } from 'react';

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
  PRIMARY_WEAPON: { id: 'primaryWeapon', label: 'Primary', accepts: ['weapon'] },
  SIDEARM: { id: 'sidearm', label: 'Sidearm', accepts: ['weapon'] },
  HEAD: { id: 'head', label: 'Head', accepts: ['headwear'] },
  TORSO: { id: 'torso', label: 'Torso', accepts: ['armor'] },
  ACCESSORY_1: { id: 'accessory1', label: 'Accessory 1', accepts: ['accessory'] },
  ACCESSORY_2: { id: 'accessory2', label: 'Accessory 2', accepts: ['accessory'] },
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
};

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
      const { item, quantity = 1 } = action.payload;
      const existingIndex = state.items.findIndex(i => i.id === item.id && i.stackable);
      
      let newItems: InventoryItem[];
      if (existingIndex !== -1 && item.stackable) {
        newItems = state.items.map((i, idx) => 
          idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        // Initialize weapon condition if it's a weapon
        let newItem: InventoryItem = { ...item, quantity, instanceId: `${item.id}-${timestamp}` };
        if (item.category === 'weapons' && !item.condition) {
          newItem.condition = {
            barrelWear: 0,
            carbonBuildup: 0,
            springFatigue: 0,
            riflingWear: 0,
            roundsFired: 0,
            lastMaintenance: timestamp,
          };
          newItem.mods = item.mods || {};
        }
        newItems = [...state.items, newItem];
      }
      
      return {
        ...state,
        items: newItems,
        settings: { ...state.settings, currentWeight: calculateWeight(newItems) },
        lastAction: {
          type: 'ADD',
          item,
          quantity,
          timestamp,
          narrativeHook: `picked up ${quantity > 1 ? `${quantity}x ` : ''}${item.name}`,
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
      if (!item) return state;
      
      let newEquipped = { ...state.equipped };
      Object.keys(newEquipped).forEach(s => {
        if (newEquipped[s as keyof EquippedState] === instanceId) {
          (newEquipped as any)[s] = null;
        }
      });
      (newEquipped as any)[slot] = instanceId;
      
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
