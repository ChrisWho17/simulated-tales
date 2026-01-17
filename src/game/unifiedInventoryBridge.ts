// ============================================================================
// UNIFIED INVENTORY BRIDGE - Phase 3
// Single source of truth for inventory, bridging playerStateManager and inventorySystem
// ============================================================================

import { eventBus } from './eventBus';
import { InventoryItem, InventoryState, createInitialState, inventoryReducer, ACTIONS } from './inventorySystem';
import { detectItemType, GeneratedItem } from './itemCategorySystem';
import { generateFullItem } from './storyInventoryBridge';

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedInventoryItem {
  id: string;
  instanceId: string;
  name: string;
  description?: string;
  category: string;
  type?: string;
  quantity: number;
  weight?: number;
  value?: number;
  stackable?: boolean;
  consumable?: boolean;
  equipSlots?: string[];
  effects?: Record<string, number>;
  stats?: Record<string, any>;
  portraitPrompt?: string;
  // Weapon-specific
  weaponType?: string;
  caliber?: string;
  condition?: any;
  mods?: Record<string, any>;
  compatibleSlots?: string[];
}

export interface InventoryChangeEvent {
  type: 'add' | 'remove' | 'use' | 'equip' | 'unequip' | 'clear' | 'load';
  items?: UnifiedInventoryItem[];
  item?: UnifiedInventoryItem;
  reason?: string;
  quantity?: number;
  previousState?: InventoryState;
}

export type InventorySubscriber = (event: InventoryChangeEvent) => void;

// ============================================================================
// UNIFIED INVENTORY MANAGER - Single Source of Truth
// ============================================================================

class UnifiedInventoryManagerClass {
  private state: InventoryState;
  private subscribers: Set<InventorySubscriber>;
  private cheatModeEnabled: boolean;

  constructor() {
    this.state = createInitialState();
    this.subscribers = new Set();
    this.cheatModeEnabled = false;
  }

  // ============= CORE STATE ACCESS =============

  getState(): InventoryState {
    return this.state;
  }

  getItems(): InventoryItem[] {
    return this.state.items;
  }

  getItemCount(): number {
    return this.state.items.length;
  }

  getItemByInstanceId(instanceId: string): InventoryItem | null {
    return this.state.items.find(i => i.instanceId === instanceId) || null;
  }

  findItems(searchTerm: string): InventoryItem[] {
    const lower = searchTerm.toLowerCase().trim();
    return this.state.items.filter(item =>
      item.id?.toLowerCase() === lower ||
      item.instanceId?.toLowerCase() === lower ||
      item.name?.toLowerCase() === lower ||
      item.name?.toLowerCase().includes(lower)
    );
  }

  hasItem(itemIdOrName: string, quantity: number = 1): boolean {
    if (this.cheatModeEnabled) return true;
    const items = this.findItems(itemIdOrName);
    const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    return total >= quantity;
  }

  getItemQuantity(itemIdOrName: string): number {
    const items = this.findItems(itemIdOrName);
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  // ============= INVENTORY OPERATIONS =============

  addItem(
    itemData: Partial<UnifiedInventoryItem>,
    quantity: number = 1,
    options: { silent?: boolean; source?: string } = {}
  ): { success: boolean; item?: InventoryItem; stacked?: boolean; error?: string } {
    if (!itemData.name) {
      return { success: false, error: 'Item must have a name' };
    }

    // Detect item category if not provided
    const detection = detectItemType(itemData.name);
    const category = itemData.category || detection.category;

    // Generate full item with all properties
    const fullItem = generateFullItem({
      name: itemData.name,
      description: itemData.description,
      category: category as 'weapons' | 'apparel' | 'aid' | 'ammo' | 'keyItems' | 'misc',
      weaponType: (itemData.weaponType || detection.weaponType) as any,
      apparelType: detection.type as any,
    });

    // Merge with any additional provided data
    const mergedItem: Partial<InventoryItem> = {
      ...fullItem,
      ...itemData,
      id: itemData.id || fullItem.id,
      quantity: quantity,
    } as Partial<InventoryItem>;

    const previousState = { ...this.state };
    this.state = inventoryReducer(this.state, {
      type: ACTIONS.ADD_ITEM,
      payload: { item: mergedItem, quantity }
    });

    // Find the added item
    const addedItem = this.state.items.find(i => 
      i.name === mergedItem.name && 
      (!previousState.items.find(p => p.instanceId === i.instanceId) || 
       this.state.items.find(n => n.instanceId === i.instanceId)?.quantity !== 
       previousState.items.find(p => p.instanceId === i.instanceId)?.quantity)
    );

    if (!options.silent) {
      this.notifySubscribers({
        type: 'add',
        item: addedItem,
        quantity,
        reason: options.source || 'acquired',
        previousState,
      });

      // Emit EventBus event
      eventBus.emit({
        type: 'ITEM_ACQUIRED',
        tick: 0,
        source: 'unifiedInventory',
        priority: 'normal',
        data: {
          itemName: itemData.name,
          quantity,
          category,
          source: options.source,
        },
      } as any);
    }

    console.log(`[UnifiedInventory] Added: ${itemData.name} x${quantity}`);
    return { success: true, item: addedItem };
  }

  removeItem(
    itemIdOrName: string,
    quantity: number = 1,
    reason: string = 'removed'
  ): { success: boolean; item?: InventoryItem; error?: string } {
    const items = this.findItems(itemIdOrName);
    
    if (items.length === 0 && !this.cheatModeEnabled) {
      console.warn(`[UnifiedInventory] Cannot remove "${itemIdOrName}" - not found`);
      return { success: false, error: 'Item not found' };
    }

    if (this.cheatModeEnabled && items.length === 0) {
      return { success: true };
    }

    const item = items[0];
    const previousState = { ...this.state };

    // Check quantity
    if ((item.quantity || 1) < quantity && !this.cheatModeEnabled) {
      return { success: false, error: 'Insufficient quantity' };
    }

    this.state = inventoryReducer(this.state, {
      type: ACTIONS.DROP_ITEM,
      payload: { instanceId: item.instanceId }
    });

    this.notifySubscribers({
      type: 'remove',
      item,
      quantity,
      reason,
      previousState,
    });

    // Emit EventBus event
    eventBus.emit({
      type: 'ITEM_REMOVED',
      tick: 0,
      source: 'unifiedInventory',
      priority: 'normal',
      data: {
        itemName: item.name,
        instanceId: item.instanceId,
        quantity,
        reason,
      },
    } as any);

    console.log(`[UnifiedInventory] Removed: ${item.name} (${reason})`);
    return { success: true, item };
  }

  useItem(
    itemIdOrName: string,
    options: { 
      consume?: boolean; 
      description?: string;
    } = {}
  ): { success: boolean; item?: InventoryItem; consumed?: boolean; error?: string } {
    const items = this.findItems(itemIdOrName);
    
    if (items.length === 0 && !this.cheatModeEnabled) {
      return { success: false, error: 'Item not found' };
    }

    if (this.cheatModeEnabled && items.length === 0) {
      return { success: true, consumed: false };
    }

    const item = items[0];
    const shouldConsume = options.consume !== false && item.consumable !== false;
    const previousState = { ...this.state };

    this.state = inventoryReducer(this.state, {
      type: ACTIONS.USE_ITEM,
      payload: { 
        instanceId: item.instanceId, 
        useDescription: options.description || 'used',
        consumeOnUse: shouldConsume 
      }
    });

    this.notifySubscribers({
      type: 'use',
      item,
      reason: options.description || 'used',
      previousState,
    });

    // Emit EventBus event
    eventBus.emit({
      type: 'ITEM_USED',
      tick: 0,
      source: 'unifiedInventory',
      priority: 'normal',
      data: {
        itemName: item.name,
        instanceId: item.instanceId,
        consumed: shouldConsume,
        description: options.description,
      },
    } as any);

    console.log(`[UnifiedInventory] Used: ${item.name} (consumed: ${shouldConsume})`);
    return { success: true, item, consumed: shouldConsume };
  }

  // ============= EQUIPMENT OPERATIONS =============

  equipItem(instanceId: string, slot: string): { success: boolean; error?: string } {
    const item = this.getItemByInstanceId(instanceId);
    if (!item) return { success: false, error: 'Item not found' };

    const previousState = { ...this.state };
    this.state = inventoryReducer(this.state, {
      type: ACTIONS.EQUIP_ITEM,
      payload: { instanceId, slot }
    });

    this.notifySubscribers({
      type: 'equip',
      item,
      reason: `equipped to ${slot}`,
      previousState,
    });

    return { success: true };
  }

  unequipItem(slot: string): { success: boolean; error?: string } {
    const previousState = { ...this.state };
    const equippedId = this.state.equipped[slot as keyof typeof this.state.equipped];
    const item = equippedId ? this.getItemByInstanceId(equippedId) : null;

    this.state = inventoryReducer(this.state, {
      type: ACTIONS.UNEQUIP_ITEM,
      payload: { slot }
    });

    if (item) {
      this.notifySubscribers({
        type: 'unequip',
        item,
        reason: `unequipped from ${slot}`,
        previousState,
      });
    }

    return { success: true };
  }

  getEquipped(): Record<string, string | null> {
    return { ...this.state.equipped };
  }

  isEquipped(instanceId: string): boolean {
    return Object.values(this.state.equipped).includes(instanceId);
  }

  // ============= BULK OPERATIONS =============

  clearInventory(options: { silent?: boolean } = {}): void {
    const previousState = { ...this.state };
    this.state = inventoryReducer(this.state, { type: ACTIONS.CLEAR_INVENTORY });

    if (!options.silent) {
      this.notifySubscribers({
        type: 'clear',
        previousState,
      });
    }

    console.log('[UnifiedInventory] Cleared all items');
  }

  loadState(savedState: Partial<InventoryState>, options: { silent?: boolean } = {}): void {
    const previousState = { ...this.state };
    this.state = inventoryReducer(this.state, {
      type: ACTIONS.LOAD_STATE,
      payload: savedState
    });

    if (!options.silent) {
      this.notifySubscribers({
        type: 'load',
        items: this.state.items,
        previousState,
      });
    }

    console.log(`[UnifiedInventory] Loaded state with ${this.state.items.length} items`);
  }

  // ============= CHEAT MODE =============

  setCheatMode(enabled: boolean): void {
    this.cheatModeEnabled = enabled;
    console.log(`[UnifiedInventory] Cheat mode: ${enabled}`);
  }

  get isCheatModeEnabled(): boolean {
    return this.cheatModeEnabled;
  }

  // ============= SUBSCRIPTIONS =============

  subscribe(callback: InventorySubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(event: InventoryChangeEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (e) {
        console.error('[UnifiedInventory] Subscriber error:', e);
      }
    }
  }

  // ============= SERIALIZATION =============

  serialize(): string {
    return JSON.stringify(this.state);
  }

  getSerializableState(): InventoryState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // ============= SYNC WITH LEGACY SYSTEMS =============
  
  /**
   * Get dispatch function for React components using inventorySystem context
   */
  getDispatch(): (action: { type: string; payload?: any }) => void {
    return (action) => {
      this.state = inventoryReducer(this.state, action);
      
      // Map action types to events
      if (action.type === ACTIONS.ADD_ITEM) {
        this.notifySubscribers({ type: 'add', item: action.payload?.item });
      } else if (action.type === ACTIONS.DROP_ITEM || action.type === ACTIONS.REMOVE_ITEM) {
        this.notifySubscribers({ type: 'remove', reason: 'dropped' });
      } else if (action.type === ACTIONS.USE_ITEM) {
        this.notifySubscribers({ type: 'use' });
      }
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const unifiedInventory = new UnifiedInventoryManagerClass();

// ============================================================================
// BRIDGE FOR PLAYER STATE MANAGER
// ============================================================================

/**
 * Updates playerStateManager to use unifiedInventory as source of truth
 * Call this during initialization
 */
export function bridgePlayerStateToUnifiedInventory(): void {
  // Import dynamically to avoid circular deps
  import('./playerStateManager').then(({ playerStateManager }) => {
    // Override hasItem to use unified inventory
    const originalHasItem = playerStateManager.hasItem.bind(playerStateManager);
    playerStateManager.hasItem = (itemIdOrName: string, quantity: number = 1) => {
      return unifiedInventory.hasItem(itemIdOrName, quantity);
    };

    // Override findItems to use unified inventory
    const originalFindItems = playerStateManager.findItems.bind(playerStateManager);
    playerStateManager.findItems = (itemIdOrName: string) => {
      return unifiedInventory.findItems(itemIdOrName) as any;
    };

    // Override getItemQuantity
    const originalGetQuantity = playerStateManager.getItemQuantity.bind(playerStateManager);
    playerStateManager.getItemQuantity = (itemIdOrName: string) => {
      return unifiedInventory.getItemQuantity(itemIdOrName);
    };

    // Sync cheat mode
    const originalEnableCheat = playerStateManager.enableCheatMode.bind(playerStateManager);
    playerStateManager.enableCheatMode = () => {
      unifiedInventory.setCheatMode(true);
      return originalEnableCheat();
    };

    const originalDisableCheat = playerStateManager.disableCheatMode.bind(playerStateManager);
    playerStateManager.disableCheatMode = () => {
      unifiedInventory.setCheatMode(false);
      return originalDisableCheat();
    };

    console.log('[UnifiedInventory] Bridged to playerStateManager');
  });
}

// ============================================================================
// REACT HOOK FOR UNIFIED INVENTORY
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useUnifiedInventory() {
  const [items, setItems] = useState<InventoryItem[]>(unifiedInventory.getItems());
  const [equipped, setEquipped] = useState(unifiedInventory.getEquipped());

  useEffect(() => {
    const unsubscribe = unifiedInventory.subscribe((event) => {
      setItems([...unifiedInventory.getItems()]);
      setEquipped(unifiedInventory.getEquipped());
    });
    return unsubscribe;
  }, []);

  const addItem = useCallback((item: Partial<UnifiedInventoryItem>, qty = 1) => {
    return unifiedInventory.addItem(item, qty);
  }, []);

  const removeItem = useCallback((itemIdOrName: string, qty = 1, reason = 'removed') => {
    return unifiedInventory.removeItem(itemIdOrName, qty, reason);
  }, []);

  const useItem = useCallback((itemIdOrName: string, options = {}) => {
    return unifiedInventory.useItem(itemIdOrName, options);
  }, []);

  const hasItem = useCallback((itemIdOrName: string, qty = 1) => {
    return unifiedInventory.hasItem(itemIdOrName, qty);
  }, []);

  return {
    items,
    equipped,
    itemCount: items.length,
    addItem,
    removeItem,
    useItem,
    hasItem,
    findItems: unifiedInventory.findItems.bind(unifiedInventory),
    getItemQuantity: unifiedInventory.getItemQuantity.bind(unifiedInventory),
    equipItem: unifiedInventory.equipItem.bind(unifiedInventory),
    unequipItem: unifiedInventory.unequipItem.bind(unifiedInventory),
    clearInventory: unifiedInventory.clearInventory.bind(unifiedInventory),
    loadState: unifiedInventory.loadState.bind(unifiedInventory),
    getState: unifiedInventory.getState.bind(unifiedInventory),
  };
}
