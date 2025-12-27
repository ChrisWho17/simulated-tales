// ============================================================================
// THE UNTOLD STORY ENGINE - Unified Player State Manager
// Connects inventory, currency, HP, XP with event system and story validation
// ============================================================================

import { GenreLoadout, GENRE_LOADOUTS, LoadoutItem } from './loadoutSystem';
import { RPGCharacter } from '@/types/rpgCharacter';

function getGenreLoadout(genre: string): GenreLoadout | null {
  return GENRE_LOADOUTS[genre.toLowerCase()] || GENRE_LOADOUTS[genre] || null;
}
// ============================================================================
// TYPES
// ============================================================================

export interface VitalState {
  current: number;
  max: number;
  regenRate: number;
  lastUpdate: number | null;
}

export interface XPState {
  current: number;
  level: number;
  toNextLevel: number;
  totalEarned: number;
}

export interface CurrencyState {
  amount: number;
  currencyName: string;
  currencySymbol: string;
  totalEarned: number;
  totalSpent: number;
}

export interface InventoryItemState {
  id: string;
  instanceId: string;
  name: string;
  description: string;
  quantity: number;
  category: string;
  weight: number;
  value: number;
  stackable: boolean;
  consumable: boolean;
  equipable: boolean;
  usable: boolean;
  effects: Record<string, number>;
  acquiredAt: number;
  acquiredTurn: number;
  portraitPrompt?: string;
  stats?: Record<string, number | boolean | string>;
}

export interface EquipmentSlots {
  weapon: InventoryItemState | null;
  armor: InventoryItemState | null;
  accessory: InventoryItemState | null;
  tool: InventoryItemState | null;
  clothing: InventoryItemState | null;
}

export interface InventoryState {
  items: InventoryItemState[];
  maxSlots: number;
  maxWeight: number;
  currentWeight: number;
}

export interface PlayerState {
  hp: VitalState;
  xp: XPState;
  currency: CurrencyState;
  inventory: InventoryState;
  equipment: EquipmentSlots;
}

export interface TransactionRecord {
  type: string;
  amount?: number;
  item?: string;
  reason: string;
  previousValue?: number;
  newValue?: number;
  timestamp: number;
}

export type PlayerStateEventType = 
  | 'initialize' | 'currency' | 'inventory' | 'hp' | 'xp' 
  | 'levelup' | 'death' | 'cheatmode' | 'restore' | 'all';

export type PlayerStateCallback = (data: unknown) => void;

// ============================================================================
// CURRENCY SYMBOL MAPPING
// ============================================================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  'dollars': '$',
  'gold': '🪙',
  'credits': '₵',
  'coins': '🪙',
  'caps': '⚙',
  'bits': '₿',
  'yen': '¥',
  'euros': '€',
  'pounds': '£',
  'doubloons': '🏴‍☠️',
  'rations': '🍞',
  'marks': '🪖',
  'simoleons': '§',
};

function getCurrencySymbol(currencyName: string | undefined): string {
  if (!currencyName) return '$';
  return CURRENCY_SYMBOLS[currencyName.toLowerCase()] || '$';
}

// ============================================================================
// PLAYER STATE MANAGER
// ============================================================================

class PlayerStateManagerClass {
  private state: PlayerState;
  private listeners: Map<PlayerStateEventType, PlayerStateCallback[]>;
  private transactionLog: TransactionRecord[];
  private _storyCheatMode: boolean;
  private genreConfig: GenreLoadout | null;

  constructor() {
    this.state = this.createDefaultState();
    this.listeners = new Map();
    this.transactionLog = [];
    this._storyCheatMode = false;
    this.genreConfig = null;
  }

  private createDefaultState(): PlayerState {
    return {
      hp: {
        current: 100,
        max: 100,
        regenRate: 1,
        lastUpdate: null,
      },
      xp: {
        current: 0,
        level: 1,
        toNextLevel: 100,
        totalEarned: 0,
      },
      currency: {
        amount: 0,
        currencyName: 'Gold',
        currencySymbol: '🪙',
        totalEarned: 0,
        totalSpent: 0,
      },
      inventory: {
        items: [],
        maxSlots: 50,
        maxWeight: 100,
        currentWeight: 0,
      },
      equipment: {
        weapon: null,
        armor: null,
        accessory: null,
        tool: null,
        clothing: null,
      },
    };
  }

  // ============= INITIALIZATION =============

  initialize(genre: string, character?: RPGCharacter): void {
    const genreConfig = getGenreLoadout(genre);
    this.genreConfig = genreConfig || null;

    if (genreConfig) {
      this.state.currency.amount = genreConfig.startingCurrency || 0;
      this.state.currency.currencyName = genreConfig.currency || 'Gold';
      this.state.currency.currencySymbol = getCurrencySymbol(genreConfig.currency);
    }

    // Character-based HP if provided
    if (character) {
      this.state.hp.max = character.maxHealth;
      this.state.hp.current = character.currentHealth;
      this.state.xp.level = character.level;
      this.state.xp.current = character.experience;
      this.state.xp.toNextLevel = this.calculateXPToNextLevel(character.level);
      
      // Sync inventory from character
      if (character.inventory) {
        for (const item of character.inventory) {
          this.addItem({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            category: item.type,
            weight: 1,
            value: 0,
            effects: item.effects ? { [item.effects.stat || 'bonus']: item.effects.modifier || 0 } : {},
          });
        }
      }
      
      // Sync gold
      this.state.currency.amount = character.gold || 0;
    }

    this.notifyListeners('initialize', this.state);
    console.log('[PlayerStateManager] Initialized for genre:', genre);
  }

  initializeFromLoadout(loadoutItems: LoadoutItem[], genre: string): void {
    const genreConfig = getGenreLoadout(genre);
    this.genreConfig = genreConfig || null;

    if (genreConfig) {
      this.state.currency.currencyName = genreConfig.currency || 'Gold';
      this.state.currency.currencySymbol = getCurrencySymbol(genreConfig.currency);
    }

    // Add loadout items to inventory
    for (const item of loadoutItems) {
      this.addItem({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: 1,
        category: item.category,
        weight: (item.stats?.weight as number) || 1,
        value: item.cost,
        effects: {},
        stats: item.stats,
        portraitPrompt: item.portraitPrompt,
      });
    }

    this.notifyListeners('initialize', this.state);
  }

  // ============= CURRENCY OPERATIONS =============

  get storyCheatMode(): boolean {
    return this._storyCheatMode;
  }

  canAfford(amount: number): boolean {
    if (this._storyCheatMode) return true;
    return this.state.currency.amount >= amount;
  }

  spendCurrency(amount: number, reason: string = 'purchase'): { success: boolean; error?: string; spent?: number; remaining?: number; change?: TransactionRecord } {
    if (amount <= 0) return { success: false, error: 'Invalid amount' };

    if (!this.canAfford(amount) && !this._storyCheatMode) {
      return {
        success: false,
        error: 'Insufficient funds',
      };
    }

    const previousAmount = this.state.currency.amount;
    this.state.currency.amount = Math.max(0, this.state.currency.amount - amount);
    this.state.currency.totalSpent += amount;

    const change: TransactionRecord = {
      type: 'currency_spent',
      amount: -amount,
      reason,
      previousValue: previousAmount,
      newValue: this.state.currency.amount,
      timestamp: Date.now(),
    };

    this.notifyListeners('currency', change);
    this.logTransaction(change);

    return {
      success: true,
      spent: amount,
      remaining: this.state.currency.amount,
      change,
    };
  }

  addCurrency(amount: number, source: string = 'reward'): { success: boolean; error?: string; gained?: number; total?: number; change?: TransactionRecord } {
    if (amount <= 0) return { success: false, error: 'Invalid amount' };

    const previousAmount = this.state.currency.amount;
    this.state.currency.amount += amount;
    this.state.currency.totalEarned += amount;

    const change: TransactionRecord = {
      type: 'currency_gained',
      amount: amount,
      reason: source,
      previousValue: previousAmount,
      newValue: this.state.currency.amount,
      timestamp: Date.now(),
    };

    this.notifyListeners('currency', change);
    this.logTransaction(change);

    return {
      success: true,
      gained: amount,
      total: this.state.currency.amount,
      change,
    };
  }

  getCurrencyDisplay(): string {
    return `${this.state.currency.currencySymbol}${this.state.currency.amount.toLocaleString()}`;
  }

  // ============= INVENTORY OPERATIONS =============

  hasItem(itemIdOrName: string, quantity: number = 1): boolean {
    if (this._storyCheatMode) return true;
    const items = this.findItems(itemIdOrName);
    let totalQuantity = 0;
    for (const item of items) {
      totalQuantity += item.quantity || 1;
    }
    return totalQuantity >= quantity;
  }

  findItems(itemIdOrName: string): InventoryItemState[] {
    const searchLower = itemIdOrName.toLowerCase();
    return this.state.inventory.items.filter(item =>
      item.id?.toLowerCase() === searchLower ||
      item.instanceId?.toLowerCase() === searchLower ||
      item.name?.toLowerCase() === searchLower ||
      item.name?.toLowerCase().includes(searchLower)
    );
  }

  getItem(instanceId: string): InventoryItemState | null {
    return this.state.inventory.items.find(item => item.instanceId === instanceId) || null;
  }

  getItemQuantity(itemIdOrName: string): number {
    const items = this.findItems(itemIdOrName);
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  addItem(item: Partial<InventoryItemState>, quantity: number = 1): { success: boolean; error?: string; item?: InventoryItemState; stacked?: boolean } {
    if (!item || !item.name) {
      return { success: false, error: 'Invalid item' };
    }

    // Check inventory space
    if (!this._storyCheatMode) {
      if (this.state.inventory.items.length >= this.state.inventory.maxSlots) {
        return { success: false, error: 'Inventory full' };
      }

      const itemWeight = (item.weight || 0) * quantity;
      if (this.state.inventory.currentWeight + itemWeight > this.state.inventory.maxWeight) {
        return { success: false, error: 'Too heavy to carry' };
      }
    }

    // Check if stackable and already exists
    if (item.stackable !== false) {
      const existing = this.findItems(item.id || item.name)[0];
      if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
        this.notifyListeners('inventory', { type: 'item_stacked', item: existing, addedQuantity: quantity });
        return { success: true, item: existing, stacked: true };
      }
    }

    // Create new item instance
    const newItem: InventoryItemState = {
      id: item.id || `item_${item.name?.toLowerCase().replace(/\s+/g, '_')}`,
      instanceId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || 'Unknown Item',
      description: item.description || '',
      quantity: quantity,
      category: item.category || 'misc',
      weight: item.weight || 0,
      value: item.value || 0,
      stackable: item.stackable !== false,
      consumable: item.consumable !== false,
      equipable: item.equipable || false,
      usable: item.usable !== false,
      effects: item.effects || {},
      acquiredAt: Date.now(),
      acquiredTurn: 0,
      portraitPrompt: item.portraitPrompt,
      stats: item.stats,
    };

    this.state.inventory.items.push(newItem);
    this.state.inventory.currentWeight += (item.weight || 0) * quantity;

    this.notifyListeners('inventory', { type: 'item_added', item: newItem });
    return { success: true, item: newItem };
  }

  removeItem(itemIdOrInstanceId: string, quantity: number = 1, reason: string = 'used'): { success: boolean; error?: string; item?: InventoryItemState } {
    const items = this.findItems(itemIdOrInstanceId);

    if (items.length === 0 && !this._storyCheatMode) {
      return { success: false, error: 'Item not found' };
    }

    if (this._storyCheatMode && items.length === 0) {
      return { success: true };
    }

    const item = items[0];
    const currentQuantity = item.quantity || 1;

    if (currentQuantity < quantity && !this._storyCheatMode) {
      return {
        success: false,
        error: 'Insufficient quantity',
      };
    }

    let removedItem: InventoryItemState;

    if (currentQuantity <= quantity) {
      // Remove entire item
      const index = this.state.inventory.items.indexOf(item);
      this.state.inventory.items.splice(index, 1);
      this.state.inventory.currentWeight -= (item.weight || 0) * currentQuantity;
      removedItem = { ...item };
    } else {
      // Reduce quantity
      item.quantity -= quantity;
      this.state.inventory.currentWeight -= (item.weight || 0) * quantity;
      removedItem = { ...item, quantity: quantity };
    }

    this.notifyListeners('inventory', { type: 'item_removed', item: removedItem, reason, quantityRemoved: quantity });
    return { success: true, item: removedItem };
  }

  useItem(itemIdOrInstanceId: string): { success: boolean; error?: string; effects?: { type: string; value: number }[] } {
    const items = this.findItems(itemIdOrInstanceId);

    if (items.length === 0 && !this._storyCheatMode) {
      return { success: false, error: 'Item not found' };
    }

    const item = items[0];
    if (!item) {
      // Cheat mode fallback
      return { success: true, effects: [] };
    }
    
    const effects = this.applyItemEffects(item);

    // Remove consumable items
    if (item.consumable !== false) {
      this.removeItem(item.instanceId || item.name, 1, 'consumed');
    }

    this.notifyListeners('inventory', { type: 'item_used', item, effects });
    return { success: true, effects };
  }

  private applyItemEffects(item: InventoryItemState): { type: string; value: number }[] {
    const effects: { type: string; value: number }[] = [];

    if (item.effects) {
      for (const [effect, value] of Object.entries(item.effects)) {
        switch (effect) {
          case 'hp':
          case 'heal':
            this.modifyHP(value);
            effects.push({ type: 'hp', value });
            break;
          case 'xp':
            this.addXP(value);
            effects.push({ type: 'xp', value });
            break;
          case 'currency':
          case 'money':
            this.addCurrency(value, 'item');
            effects.push({ type: 'currency', value });
            break;
        }
      }
    }

    return effects;
  }

  getInventorySummary(): { items: InventoryItemState[]; itemCount: number; maxSlots: number; slotsUsed: number; currentWeight: number; maxWeight: number } {
    return {
      items: this.state.inventory.items,
      itemCount: this.state.inventory.items.length,
      maxSlots: this.state.inventory.maxSlots,
      slotsUsed: this.state.inventory.items.length,
      currentWeight: this.state.inventory.currentWeight,
      maxWeight: this.state.inventory.maxWeight,
    };
  }

  // ============= HP OPERATIONS =============

  modifyHP(amount: number): TransactionRecord {
    const previousHP = this.state.hp.current;
    this.state.hp.current = Math.max(0, Math.min(this.state.hp.max, this.state.hp.current + amount));

    const change: TransactionRecord = {
      type: amount >= 0 ? 'hp_gained' : 'hp_lost',
      amount,
      reason: amount >= 0 ? 'heal' : 'damage',
      previousValue: previousHP,
      newValue: this.state.hp.current,
      timestamp: Date.now(),
    };

    this.notifyListeners('hp', { ...change, isDead: this.state.hp.current <= 0, maxHP: this.state.hp.max });

    if (this.state.hp.current <= 0) {
      this.handleDeath();
    }

    return change;
  }

  takeDamage(amount: number, source: string = 'unknown'): TransactionRecord {
    let damage = amount;
    if (this._storyCheatMode && amount > 0) {
      damage = Math.floor(amount / 2);
    }
    return this.modifyHP(-damage);
  }

  heal(amount: number): TransactionRecord {
    return this.modifyHP(Math.abs(amount));
  }

  private handleDeath(): void {
    const deathEvent = { type: 'player_death', hp: this.state.hp.current, timestamp: Date.now() };
    this.notifyListeners('death', deathEvent);
    console.log('[PlayerStateManager] Player death triggered');
  }

  getHPDisplay(): string {
    return `${this.state.hp.current}/${this.state.hp.max}`;
  }

  getHPPercentage(): number {
    if (this.state.hp.max === 0) return 100;
    return Math.round((this.state.hp.current / this.state.hp.max) * 100);
  }

  // ============= XP OPERATIONS =============

  addXP(amount: number, source: string = 'action'): { success: boolean; levelUps: { newLevel: number }[] } {
    if (amount <= 0) return { success: false, levelUps: [] };

    const previousXP = this.state.xp.current;
    const previousLevel = this.state.xp.level;

    this.state.xp.current += amount;
    this.state.xp.totalEarned += amount;

    const levelUps: { newLevel: number }[] = [];
    while (this.state.xp.current >= this.state.xp.toNextLevel) {
      this.state.xp.current -= this.state.xp.toNextLevel;
      this.state.xp.level++;
      this.state.xp.toNextLevel = this.calculateXPToNextLevel(this.state.xp.level);

      levelUps.push({ newLevel: this.state.xp.level });
      this.applyLevelUpRewards(this.state.xp.level);
    }

    this.notifyListeners('xp', {
      type: 'xp_gained',
      amount,
      source,
      previousXP,
      newXP: this.state.xp.current,
      previousLevel,
      newLevel: this.state.xp.level,
      levelUps,
      toNextLevel: this.state.xp.toNextLevel,
    });

    if (levelUps.length > 0) {
      this.notifyListeners('levelup', { levelUps, newLevel: this.state.xp.level });
    }

    return { success: true, levelUps };
  }

  private calculateXPToNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  private applyLevelUpRewards(level: number): void {
    // HP bonus on level up
    this.state.hp.max += 5;
    this.state.hp.current = this.state.hp.max; // Full heal on level up
  }

  getXPDisplay(): string {
    return `${this.state.xp.current}/${this.state.xp.toNextLevel}`;
  }

  getXPPercentage(): number {
    return Math.round((this.state.xp.current / this.state.xp.toNextLevel) * 100);
  }

  // ============= STORY CHEAT MODE =============

  enableCheatMode(): { success: boolean; message: string } {
    this._storyCheatMode = true;
    this.notifyListeners('cheatmode', { enabled: true });
    return { success: true, message: 'Story Cheat Mode enabled. Inventory restrictions bypassed.' };
  }

  disableCheatMode(): { success: boolean; message: string } {
    this._storyCheatMode = false;
    this.notifyListeners('cheatmode', { enabled: false });
    return { success: true, message: 'Story Cheat Mode disabled. Normal rules apply.' };
  }

  toggleCheatMode(): { success: boolean; message: string } {
    return this._storyCheatMode ? this.disableCheatMode() : this.enableCheatMode();
  }

  cheatSpawnItem(itemName: string, quantity: number = 1, properties: Partial<InventoryItemState> = {}): { success: boolean; error?: string; item?: InventoryItemState } {
    if (!this._storyCheatMode) {
      return { success: false, error: 'Cheat mode not enabled' };
    }

    return this.addItem({
      id: `spawned_${itemName.toLowerCase().replace(/\s+/g, '_')}`,
      name: itemName,
      description: properties.description || `Spawned ${itemName}`,
      quantity,
      stackable: properties.stackable !== false,
      value: properties.value || 0,
      weight: properties.weight || 0,
      effects: properties.effects || {},
      ...properties,
    }, quantity);
  }

  cheatSetCurrency(amount: number): { success: boolean; previous: number; newAmount: number } {
    if (!this._storyCheatMode) {
      return { success: false, previous: this.state.currency.amount, newAmount: this.state.currency.amount };
    }

    const previous = this.state.currency.amount;
    this.state.currency.amount = amount;
    this.notifyListeners('currency', { type: 'cheat_set', previous, newAmount: amount });
    return { success: true, previous, newAmount: amount };
  }

  cheatSetHP(current: number, max: number | null = null): { success: boolean; hp: VitalState } {
    if (!this._storyCheatMode) {
      return { success: false, hp: this.state.hp };
    }

    if (max !== null) {
      this.state.hp.max = max;
    }
    this.state.hp.current = Math.min(current, this.state.hp.max);
    this.notifyListeners('hp', { type: 'cheat_set', current: this.state.hp.current, max: this.state.hp.max });
    return { success: true, hp: this.state.hp };
  }

  // ============= EVENT SYSTEM =============

  subscribe(event: PlayerStateEventType, callback: PlayerStateCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(event: PlayerStateEventType, data: unknown): void {
    const listeners = this.listeners.get(event) || [];
    for (const callback of listeners) {
      try {
        callback(data);
      } catch (e) {
        console.error(`[PlayerStateManager] Error in ${event} listener:`, e);
      }
    }

    // Also notify 'all' listeners
    const allListeners = this.listeners.get('all') || [];
    for (const callback of allListeners) {
      try {
        callback({ event, data });
      } catch (e) {
        console.error(`[PlayerStateManager] Error in 'all' listener:`, e);
      }
    }
  }

  private logTransaction(transaction: TransactionRecord): void {
    this.transactionLog.push(transaction);
    if (this.transactionLog.length > 100) {
      this.transactionLog.shift();
    }
  }

  // ============= SERIALIZATION =============

  serialize(): { state: PlayerState; storyCheatMode: boolean; transactionLog: TransactionRecord[] } {
    return {
      state: this.state,
      storyCheatMode: this._storyCheatMode,
      transactionLog: this.transactionLog.slice(-50),
    };
  }

  deserialize(data: { state?: PlayerState; storyCheatMode?: boolean; transactionLog?: TransactionRecord[] }): void {
    if (data) {
      if (data.state) {
        this.state = data.state;
      }
      this._storyCheatMode = data.storyCheatMode || false;
      this.transactionLog = data.transactionLog || [];
      this.notifyListeners('restore', this.state);
    }
  }

  // ============= COMPLETE STATE FOR AI =============

  getCompleteState(): PlayerState & { cheatMode: boolean } {
    return {
      ...this.state,
      cheatMode: this._storyCheatMode,
    };
  }

  getState(): PlayerState {
    return this.state;
  }

  // ============= SYNC WITH RPG CHARACTER =============

  syncFromCharacter(character: RPGCharacter): void {
    this.state.hp.current = character.currentHealth;
    this.state.hp.max = character.maxHealth;
    this.state.xp.level = character.level;
    this.state.xp.current = character.experience;
    this.state.currency.amount = character.gold;
  }

  syncToCharacter(character: RPGCharacter): RPGCharacter {
    return {
      ...character,
      currentHealth: this.state.hp.current,
      maxHealth: this.state.hp.max,
      level: this.state.xp.level,
      experience: this.state.xp.current,
      gold: this.state.currency.amount,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const playerStateManager = new PlayerStateManagerClass();
