// ============================================================================
// WARDROBE SYSTEM
// Manages player's clothing collection and equipped items
// ============================================================================

import { ClothingItem, ClothingSlot, ClothingStats, calculateTotalStats, getClothingById } from './clothingItemSystem';
import { ClothingContext, setPlayerClothingContext, setClothingReactionGenre } from './clothingReactionSystem';
import { eventBus } from './eventBus';

// ============================================================================
// TYPES
// ============================================================================

export interface WardrobeItem {
  item: ClothingItem;
  acquiredAt: number;
  source: string;
  condition: number; // 0-100
  customizations?: string[];
}

export interface EquippedClothing {
  head: WardrobeItem | null;
  torso: WardrobeItem | null;
  legs: WardrobeItem | null;
  feet: WardrobeItem | null;
  hands: WardrobeItem | null;
  accessory: WardrobeItem | null;
  outfit: WardrobeItem | null; // Full outfits override individual pieces
}

export interface WardrobeState {
  ownedItems: WardrobeItem[];
  equipped: EquippedClothing;
  activeStyle: string; // Current overall style based on equipped items
  currentStats: ClothingStats;
}

// ============================================================================
// WARDROBE MANAGER
// ============================================================================

class WardrobeManagerClass {
  private state: WardrobeState;
  private genre: string = 'fantasy';
  private listeners: ((state: WardrobeState) => void)[] = [];

  constructor() {
    this.state = this.createDefaultState();
  }

  private createDefaultState(): WardrobeState {
    return {
      ownedItems: [],
      equipped: {
        head: null,
        torso: null,
        legs: null,
        feet: null,
        hands: null,
        accessory: null,
        outfit: null
      },
      activeStyle: 'genre_default',
      currentStats: {}
    };
  }

  // ========== INITIALIZATION ==========
  
  initialize(genre: string, startingItems?: string[]): void {
    this.genre = genre;
    setClothingReactionGenre(genre);
    
    if (startingItems) {
      for (const itemId of startingItems) {
        this.addItem(itemId, 'starting_gear');
      }
    }
    
    this.updateClothingContext();
    this.notifyListeners();
  }

  setGenre(genre: string): void {
    this.genre = genre;
    setClothingReactionGenre(genre);
    this.recalculateStats();
    this.updateClothingContext();
  }

  // ========== ITEM MANAGEMENT ==========
  
  addItem(itemIdOrItem: string | ClothingItem, source: string = 'found'): WardrobeItem | null {
    const item = typeof itemIdOrItem === 'string' 
      ? getClothingById(itemIdOrItem) 
      : itemIdOrItem;
    
    if (!item) {
      console.warn(`[WARDROBE] Item not found: ${itemIdOrItem}`);
      return null;
    }
    
    // Check if already owned (no duplicates for now)
    const alreadyOwned = this.state.ownedItems.some(wi => wi.item.id === item.id);
    if (alreadyOwned) {
      console.log(`[WARDROBE] Already own ${item.name}`);
      return null;
    }
    
    const wardrobeItem: WardrobeItem = {
      item,
      acquiredAt: Date.now(),
      source,
      condition: 100
    };
    
    this.state.ownedItems.push(wardrobeItem);
    
    // Emit event
    eventBus.emit('clothing:acquired', {
      item,
      source,
      rarity: item.rarity
    });
    
    this.notifyListeners();
    return wardrobeItem;
  }

  removeItem(itemId: string): boolean {
    const index = this.state.ownedItems.findIndex(wi => wi.item.id === itemId);
    if (index === -1) return false;
    
    // Unequip if equipped
    this.unequipByItemId(itemId);
    
    this.state.ownedItems.splice(index, 1);
    this.notifyListeners();
    return true;
  }

  getOwnedItems(): WardrobeItem[] {
    return [...this.state.ownedItems];
  }

  getOwnedBySlot(slot: ClothingSlot): WardrobeItem[] {
    return this.state.ownedItems.filter(wi => wi.item.slot === slot);
  }

  getOwnedByStyle(style: string): WardrobeItem[] {
    return this.state.ownedItems.filter(wi => wi.item.style === style);
  }

  // ========== EQUIPPING ==========
  
  equip(itemId: string): boolean {
    const wardrobeItem = this.state.ownedItems.find(wi => wi.item.id === itemId);
    if (!wardrobeItem) {
      console.warn(`[WARDROBE] Cannot equip - not owned: ${itemId}`);
      return false;
    }
    
    const slot = wardrobeItem.item.slot;
    
    // If equipping an outfit, clear individual pieces
    if (slot === 'outfit') {
      this.state.equipped.head = null;
      this.state.equipped.torso = null;
      this.state.equipped.legs = null;
      this.state.equipped.feet = null;
      this.state.equipped.hands = null;
    }
    
    // If equipping individual piece while wearing outfit, unequip outfit
    if (slot !== 'outfit' && slot !== 'accessory' && this.state.equipped.outfit) {
      this.state.equipped.outfit = null;
    }
    
    this.state.equipped[slot] = wardrobeItem;
    
    this.recalculateStats();
    this.updateClothingContext();
    this.notifyListeners();
      item: wardrobeItem.item,
      slot
    });
    
    return true;
  }

  unequip(slot: ClothingSlot): boolean {
    if (!this.state.equipped[slot]) return false;
    
    const item = this.state.equipped[slot];
    this.state.equipped[slot] = null;
    
    this.recalculateStats();
    this.updateClothingContext();
    this.notifyListeners();
    
    eventBus.emit('clothing:unequipped', {
      item: item?.item,
      slot
    });
    
    return true;
  }

  private unequipByItemId(itemId: string): void {
    for (const slot of Object.keys(this.state.equipped) as ClothingSlot[]) {
      if (this.state.equipped[slot]?.item.id === itemId) {
        this.state.equipped[slot] = null;
      }
    }
    this.recalculateStats();
    this.updateClothingContext();
  }

  getEquipped(): EquippedClothing {
    return { ...this.state.equipped };
  }

  getEquippedList(): WardrobeItem[] {
    return Object.values(this.state.equipped).filter((item): item is WardrobeItem => item !== null);
  }

  // ========== STATS ==========
  
  private recalculateStats(): void {
    const equippedItems = this.getEquippedList().map(wi => wi.item);
    this.state.currentStats = calculateTotalStats(equippedItems, this.genre);
    this.updateActiveStyle();
  }

  private updateActiveStyle(): void {
    const equipped = this.getEquippedList();
    if (equipped.length === 0) {
      this.state.activeStyle = 'genre_default';
      return;
    }
    
    // Count styles
    const styleCounts: Record<string, number> = {};
    for (const wi of equipped) {
      const style = wi.item.style;
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    }
    
    // Find dominant style
    let maxCount = 0;
    let dominantStyle = 'genre_default';
    for (const [style, count] of Object.entries(styleCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantStyle = style;
      }
    }
    
    this.state.activeStyle = dominantStyle;
  }

  getCurrentStats(): ClothingStats {
    return { ...this.state.currentStats };
  }

  getStatModifier(stat: keyof ClothingStats): number {
    return this.state.currentStats[stat] || 0;
  }

  getActiveStyle(): string {
    return this.state.activeStyle;
  }

  // ========== CLOTHING CONTEXT SYNC ==========
  
  private updateClothingContext(): void {
    const equipped = this.getEquippedList();
    const details = equipped.flatMap(wi => wi.item.visualDetails || []);
    
    const context: ClothingContext = {
      clothingStyle: this.state.activeStyle,
      clothingDetails: details
    };
    
    setPlayerClothingContext(context);
  }

  // ========== SERIALIZATION ==========
  
  serialize(): string {
    return JSON.stringify({
      ownedItemIds: this.state.ownedItems.map(wi => ({
        id: wi.item.id,
        acquiredAt: wi.acquiredAt,
        source: wi.source,
        condition: wi.condition
      })),
      equippedIds: {
        head: this.state.equipped.head?.item.id || null,
        torso: this.state.equipped.torso?.item.id || null,
        legs: this.state.equipped.legs?.item.id || null,
        feet: this.state.equipped.feet?.item.id || null,
        hands: this.state.equipped.hands?.item.id || null,
        accessory: this.state.equipped.accessory?.item.id || null,
        outfit: this.state.equipped.outfit?.item.id || null
      },
      genre: this.genre
    });
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.state = this.createDefaultState();
      this.genre = parsed.genre || 'fantasy';
      
      // Restore owned items
      for (const itemData of parsed.ownedItemIds || []) {
        const item = getClothingById(itemData.id);
        if (item) {
          this.state.ownedItems.push({
            item,
            acquiredAt: itemData.acquiredAt,
            source: itemData.source,
            condition: itemData.condition
          });
        }
      }
      
      // Restore equipped
      for (const [slot, itemId] of Object.entries(parsed.equippedIds || {})) {
        if (itemId) {
          const wardrobeItem = this.state.ownedItems.find(wi => wi.item.id === itemId);
          if (wardrobeItem) {
            this.state.equipped[slot as ClothingSlot] = wardrobeItem;
          }
        }
      }
      
      this.recalculateStats();
      this.updateClothingContext();
      this.notifyListeners();
    } catch (e) {
      console.error('[WARDROBE] Failed to deserialize:', e);
    }
  }

  // ========== LISTENERS ==========
  
  subscribe(callback: (state: WardrobeState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  getState(): WardrobeState {
    return { ...this.state };
  }
}

export const wardrobeManager = new WardrobeManagerClass();
