// ============================================================================
// CUSTOM ITEM MANAGER - Create and manage custom items
// ============================================================================

import { LoadoutItem, ItemCategory, PortraitPosition, ITEM_CATEGORIES } from './loadoutSystem';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomItem extends LoadoutItem {
  isCustom: true;
  createdAt: number;
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

const CATEGORY_PATTERNS: Record<ItemCategory, RegExp> = {
  weapons: /sword|knife|gun|pistol|rifle|blade|dagger|axe|bat|club|bow|spear|staff|katana|machete|hammer|mace|whip|crossbow|revolver|shotgun/i,
  armor: /armor|vest|plate|chainmail|shield|protection|chestplate|breastplate|pauldron|greaves/i,
  clothing: /shirt|pants|dress|robe|coat|jacket|cloak|suit|jeans|hoodie|uniform|tunic|gown|cape|trousers|skirt|blouse/i,
  accessories: /ring|necklace|bracelet|amulet|pendant|earring|watch|gloves|belt|scarf|charm|locket|brooch|tiara|crown/i,
  tech: /phone|computer|laptop|tablet|drone|scanner|cyberdeck|implant|chip|device|communicator|radio/i,
  tools: /flashlight|torch|rope|lockpick|toolkit|wrench|screwdriver|map|compass|camera|binoculars|crowbar|shovel/i,
  supplies: /potion|food|drink|pill|medicine|medkit|bandage|ration|water|snack|ammo|ammunition|bullets|first.?aid/i,
  consumables: /elixir|scroll|bomb|grenade|injection|stim|drug|serum|vial|flask/i,
  light: /lantern|candle|glow.?stick|flare|lamp|torch|flashlight/i,
  survival: /tent|sleeping.?bag|canteen|filter|compass|matches|fire.?starter|blanket/i,
  misc: /.*/,
};

const PORTRAIT_TEMPLATES: Record<ItemCategory, string> = {
  weapons: 'wielding/carrying a',
  armor: 'wearing',
  clothing: 'wearing',
  accessories: 'with',
  tech: 'holding/carrying a',
  tools: 'holding/carrying a',
  supplies: 'with',
  consumables: '',
  light: 'holding',
  survival: 'carrying',
  misc: 'with',
};

// ============================================================================
// CUSTOM ITEM MANAGER
// ============================================================================

class CustomItemManagerClass {
  private customItems: CustomItem[] = [];

  /**
   * Auto-detect category from item name
   */
  detectCategory(itemName: string): ItemCategory {
    const lower = itemName.toLowerCase();

    // Check each pattern in order (weapons first, misc last)
    const categoryOrder: ItemCategory[] = [
      'weapons', 'armor', 'clothing', 'accessories', 'tech', 
      'tools', 'supplies', 'consumables', 'light', 'survival', 'misc'
    ];

    for (const category of categoryOrder) {
      if (category === 'misc') continue; // Skip misc, it's the fallback
      if (CATEGORY_PATTERNS[category].test(lower)) {
        return category;
      }
    }

    return 'misc';
  }

  /**
   * Generate portrait prompt from item name and category
   */
  generatePortraitPrompt(itemName: string, category: ItemCategory): string {
    const template = PORTRAIT_TEMPLATES[category];
    if (!template) return '';
    
    // Don't generate prompts for consumables/supplies that aren't visible
    if (['consumables', 'supplies', 'survival'].includes(category)) {
      return '';
    }

    return `${template} ${itemName}`.trim();
  }

  /**
   * Create a custom item
   */
  createCustomItem(
    name: string,
    category?: ItemCategory,
    description?: string,
    cost: number = 0
  ): CustomItem {
    const detectedCategory = category || this.detectCategory(name);
    const categoryInfo = ITEM_CATEGORIES[detectedCategory];

    const customItem: CustomItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description || `A custom ${categoryInfo.label.toLowerCase()}`,
      category: detectedCategory,
      icon: categoryInfo.icon,
      stats: { ...categoryInfo.defaultStats },
      cost: cost,
      isCustom: true,
      portraitPrompt: this.generatePortraitPrompt(name, detectedCategory),
      portraitPosition: categoryInfo.portraitPosition,
      createdAt: Date.now(),
    };

    this.customItems.push(customItem);
    return customItem;
  }

  /**
   * Update an existing custom item
   */
  updateCustomItem(itemId: string, updates: Partial<CustomItem>): CustomItem | null {
    const index = this.customItems.findIndex(i => i.id === itemId);
    if (index === -1) return null;

    // Regenerate portrait prompt if name or category changed
    if (updates.name || updates.category) {
      const name = updates.name || this.customItems[index].name;
      const category = updates.category || this.customItems[index].category;
      updates.portraitPrompt = this.generatePortraitPrompt(name, category);
      updates.icon = ITEM_CATEGORIES[category]?.icon || '📦';
      updates.portraitPosition = ITEM_CATEGORIES[category]?.portraitPosition || 'none';
    }

    this.customItems[index] = { ...this.customItems[index], ...updates };
    return this.customItems[index];
  }

  /**
   * Remove a custom item
   */
  removeCustomItem(itemId: string): boolean {
    const index = this.customItems.findIndex(i => i.id === itemId);
    if (index === -1) return false;

    this.customItems.splice(index, 1);
    return true;
  }

  /**
   * Get all custom items
   */
  getAllCustomItems(): CustomItem[] {
    return [...this.customItems];
  }

  /**
   * Clear all custom items
   */
  clearAll(): void {
    this.customItems = [];
  }

  /**
   * Serialize for save
   */
  serialize(): CustomItem[] {
    return this.customItems;
  }

  /**
   * Deserialize from save
   */
  deserialize(data: CustomItem[]): void {
    this.customItems = data || [];
  }
}

// Export singleton instance
export const customItemManager = new CustomItemManagerClass();

/**
 * Get category options for UI selection
 */
export function getCategoryOptions(): Array<{ id: ItemCategory; label: string; icon: string }> {
  return Object.entries(ITEM_CATEGORIES).map(([id, cat]) => ({
    id: id as ItemCategory,
    label: cat.label,
    icon: cat.icon,
  }));
}
