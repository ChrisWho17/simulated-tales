// Wardrobe System - Manages player's clothing collection and equipped items

import { 
  ClothingItem, 
  ClothingSlot, 
  ClothingStats, 
  CLOTHING_DATABASE,
  CLOTHING_SETS,
  getClothingById,
  calculateTotalStats
} from './clothingItemSystem';

export interface WardrobeItem {
  item: ClothingItem;
  acquiredAt: Date;
  acquiredFrom: string;
  timesWorn: number;
}

export interface EquippedClothing {
  head?: WardrobeItem;
  torso?: WardrobeItem;
  legs?: WardrobeItem;
  feet?: WardrobeItem;
  hands?: WardrobeItem;
  accessory?: WardrobeItem;
  outfit?: WardrobeItem;
}

export interface WardrobeState {
  ownedItems: WardrobeItem[];
  equipped: EquippedClothing;
  activeStyle: string;
  totalStats: ClothingStats;
  activeSets: { setId: string; piecesEquipped: number; bonuses: ClothingStats }[];
}

type WardrobeListener = (state: WardrobeState) => void;

const WARDROBE_STORAGE_KEY = 'wardrobe_state';

class WardrobeManager {
  private state: WardrobeState;
  private listeners: Set<WardrobeListener> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): WardrobeState {
    try {
      const saved = localStorage.getItem(WARDROBE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Rehydrate item references
        return {
          ...parsed,
          ownedItems: parsed.ownedItems.map((wi: any) => ({
            ...wi,
            item: getClothingById(wi.item.id) || wi.item,
            acquiredAt: new Date(wi.acquiredAt),
          })),
          equipped: Object.fromEntries(
            Object.entries(parsed.equipped).map(([slot, wi]: [string, any]) => [
              slot,
              wi ? {
                ...wi,
                item: getClothingById(wi.item.id) || wi.item,
                acquiredAt: new Date(wi.acquiredAt),
              } : undefined
            ])
          ),
        };
      }
    } catch (e) {
      console.error('Failed to load wardrobe state:', e);
    }

    return this.getDefaultState();
  }

  private getDefaultState(): WardrobeState {
    // Start with some basic clothing
    const starterItems: WardrobeItem[] = [
      {
        item: getClothingById('plain_tshirt')!,
        acquiredAt: new Date(),
        acquiredFrom: 'starting',
        timesWorn: 0,
      },
      {
        item: getClothingById('worn_jeans')!,
        acquiredAt: new Date(),
        acquiredFrom: 'starting',
        timesWorn: 0,
      },
      {
        item: getClothingById('sneakers')!,
        acquiredAt: new Date(),
        acquiredFrom: 'starting',
        timesWorn: 0,
      },
    ].filter(wi => wi.item);

    return {
      ownedItems: starterItems,
      equipped: {},
      activeStyle: 'casual',
      totalStats: {},
      activeSets: [],
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save wardrobe state:', e);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: WardrobeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): WardrobeState {
    return { ...this.state };
  }

  addItem(item: ClothingItem, source: string): boolean {
    // Check if already owned
    if (this.state.ownedItems.some(wi => wi.item.id === item.id)) {
      return false;
    }

    const wardrobeItem: WardrobeItem = {
      item,
      acquiredAt: new Date(),
      acquiredFrom: source,
      timesWorn: 0,
    };

    this.state.ownedItems.push(wardrobeItem);
    this.saveState();
    this.notify();
    return true;
  }

  removeItem(itemId: string): boolean {
    const index = this.state.ownedItems.findIndex(wi => wi.item.id === itemId);
    if (index === -1) return false;

    // Unequip if equipped
    for (const [slot, equipped] of Object.entries(this.state.equipped)) {
      if (equipped?.item.id === itemId) {
        delete this.state.equipped[slot as ClothingSlot];
      }
    }

    this.state.ownedItems.splice(index, 1);
    this.recalculateStats();
    this.saveState();
    this.notify();
    return true;
  }

  equip(itemId: string): boolean {
    const wardrobeItem = this.state.ownedItems.find(wi => wi.item.id === itemId);
    if (!wardrobeItem) return false;

    const slot = wardrobeItem.item.slot;
    
    // Handle outfit slot - unequips individual pieces
    if (slot === 'outfit') {
      this.state.equipped = { outfit: wardrobeItem };
    } else {
      // If wearing an outfit, remove it when equipping individual pieces
      if (this.state.equipped.outfit) {
        delete this.state.equipped.outfit;
      }
      this.state.equipped[slot] = wardrobeItem;
    }

    wardrobeItem.timesWorn++;
    this.recalculateStats();
    this.updateActiveStyle();
    this.saveState();
    this.notify();
    return true;
  }

  unequip(slot: ClothingSlot): boolean {
    if (!this.state.equipped[slot]) return false;

    delete this.state.equipped[slot];
    this.recalculateStats();
    this.updateActiveStyle();
    this.saveState();
    this.notify();
    return true;
  }

  private recalculateStats(): void {
    const equippedItems = Object.values(this.state.equipped)
      .filter((wi): wi is WardrobeItem => wi !== undefined)
      .map(wi => wi.item);

    // Base stats from individual items
    this.state.totalStats = calculateTotalStats(equippedItems);

    // Check for set bonuses
    this.state.activeSets = [];
    const equippedIds = new Set(equippedItems.map(item => item.id));

    for (const set of CLOTHING_SETS) {
      const piecesEquipped = set.pieces.filter(id => equippedIds.has(id)).length;
      if (piecesEquipped >= 2) {
        // Find highest applicable bonus
        const applicableBonuses = set.bonuses.filter(b => piecesEquipped >= b.piecesRequired);
        if (applicableBonuses.length > 0) {
          const highestBonus = applicableBonuses[applicableBonuses.length - 1];
          
          this.state.activeSets.push({
            setId: set.id,
            piecesEquipped,
            bonuses: highestBonus.stats,
          });

          // Add set bonus to total stats
          for (const [key, value] of Object.entries(highestBonus.stats)) {
            if (key === 'genreBonus') continue;
            const statKey = key as keyof Omit<ClothingStats, 'genreBonus'>;
            this.state.totalStats[statKey] = (this.state.totalStats[statKey] || 0) + (value as number);
          }
        }
      }
    }
  }

  private updateActiveStyle(): void {
    const styleCounts: Record<string, number> = {};
    
    for (const wi of Object.values(this.state.equipped)) {
      if (wi) {
        styleCounts[wi.item.style] = (styleCounts[wi.item.style] || 0) + 1;
      }
    }

    let maxStyle = 'casual';
    let maxCount = 0;
    for (const [style, count] of Object.entries(styleCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxStyle = style;
      }
    }

    this.state.activeStyle = maxStyle;
  }

  getEquippedList(): WardrobeItem[] {
    return Object.values(this.state.equipped).filter((wi): wi is WardrobeItem => wi !== undefined);
  }

  getCurrentStats(): ClothingStats {
    return { ...this.state.totalStats };
  }

  hasItem(itemId: string): boolean {
    return this.state.ownedItems.some(wi => wi.item.id === itemId);
  }

  getOwnedBySlot(slot: ClothingSlot): WardrobeItem[] {
    return this.state.ownedItems.filter(wi => wi.item.slot === slot);
  }

  // For AI context
  buildClothingContext(): string {
    const equipped = this.getEquippedList();
    if (equipped.length === 0) {
      return 'The player is wearing basic, unremarkable clothing.';
    }

    const lines: string[] = ['Current outfit:'];
    for (const wi of equipped) {
      lines.push(`- ${wi.item.name} (${wi.item.slot}): ${wi.item.description}`);
    }

    lines.push(`\nOverall style: ${this.state.activeStyle}`);

    if (Object.keys(this.state.totalStats).length > 0) {
      lines.push('Clothing bonuses:');
      for (const [stat, value] of Object.entries(this.state.totalStats)) {
        if (stat !== 'genreBonus' && typeof value === 'number') {
          lines.push(`- ${stat}: ${value > 0 ? '+' : ''}${value}`);
        }
      }
    }

    return lines.join('\n');
  }

  reset(): void {
    this.state = this.getDefaultState();
    this.saveState();
    this.notify();
  }
}

export const wardrobeManager = new WardrobeManager();
