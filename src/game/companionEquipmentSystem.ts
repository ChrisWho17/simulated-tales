// ============================================================================
// COMPANION EQUIPMENT SYSTEM - Weapons and armor that affect combat stats
// ============================================================================

import { CompanionCombatStats } from './companionCombatSystem';

// ============================================================================
// TYPES
// ============================================================================

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EquipmentStats {
  damageBonus?: number;
  armorBonus?: number;
  strengthBonus?: number;
  agilityBonus?: number;
  enduranceBonus?: number;
  combatSkillBonus?: number;
  healthBonus?: number;
  moraleBonus?: number;
  criticalChanceBonus?: number;
  specialEffect?: string;
}

export interface CompanionEquipment {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  stats: EquipmentStats;
  icon?: string;
  flavorText?: string;
  requirements?: {
    minStrength?: number;
    minAgility?: number;
    combatRole?: string[];
  };
}

export interface CompanionLoadout {
  companionId: string;
  weapon?: CompanionEquipment;
  armor?: CompanionEquipment;
  accessory?: CompanionEquipment;
}

// ============================================================================
// EQUIPMENT DATABASE
// ============================================================================

export const EQUIPMENT_DATABASE: Record<string, CompanionEquipment> = {
  // WEAPONS
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    description: 'A worn blade that has seen better days.',
    slot: 'weapon',
    rarity: 'common',
    stats: { damageBonus: 2 },
    flavorText: 'It still cuts... mostly.',
  },
  iron_axe: {
    id: 'iron_axe',
    name: 'Iron Battle Axe',
    description: 'A heavy axe suited for cleaving enemies.',
    slot: 'weapon',
    rarity: 'common',
    stats: { damageBonus: 4, agilityBonus: -5 },
    flavorText: 'Slow but devastating.',
  },
  steel_longsword: {
    id: 'steel_longsword',
    name: 'Steel Longsword',
    description: 'A well-balanced blade of quality steel.',
    slot: 'weapon',
    rarity: 'uncommon',
    stats: { damageBonus: 5, combatSkillBonus: 3 },
  },
  hunter_bow: {
    id: 'hunter_bow',
    name: "Hunter's Bow",
    description: 'A reliable bow for ranged combat.',
    slot: 'weapon',
    rarity: 'uncommon',
    stats: { damageBonus: 3, agilityBonus: 5 },
    requirements: { combatRole: ['ranged'] },
  },
  flamebrand: {
    id: 'flamebrand',
    name: 'Flamebrand',
    description: 'A blade that burns with eternal fire.',
    slot: 'weapon',
    rarity: 'rare',
    stats: { damageBonus: 8, moraleBonus: 10, specialEffect: 'Burns enemies for extra damage' },
    flavorText: 'Forged in dragon fire.',
  },
  staff_of_healing: {
    id: 'staff_of_healing',
    name: 'Staff of Healing',
    description: 'A staff imbued with restorative magic.',
    slot: 'weapon',
    rarity: 'rare',
    stats: { damageBonus: 2, healthBonus: 20, specialEffect: 'Heal allies on critical success' },
    requirements: { combatRole: ['support'] },
  },
  dragonslayer: {
    id: 'dragonslayer',
    name: 'Dragonslayer',
    description: 'A legendary weapon forged to slay beasts.',
    slot: 'weapon',
    rarity: 'legendary',
    stats: { damageBonus: 15, strengthBonus: 10, criticalChanceBonus: 10 },
    flavorText: 'The blade hums with ancient power.',
  },
  shadow_daggers: {
    id: 'shadow_daggers',
    name: 'Shadow Daggers',
    description: 'Twin blades that move faster than the eye can see.',
    slot: 'weapon',
    rarity: 'epic',
    stats: { damageBonus: 6, agilityBonus: 15, criticalChanceBonus: 15, specialEffect: 'Double strike chance' },
    requirements: { minAgility: 50 },
  },

  // ARMOR
  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic protection from light leather.',
    slot: 'armor',
    rarity: 'common',
    stats: { armorBonus: 2, healthBonus: 10 },
  },
  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    description: 'Interlocking metal rings provide solid defense.',
    slot: 'armor',
    rarity: 'uncommon',
    stats: { armorBonus: 5, healthBonus: 20, agilityBonus: -3 },
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'Plate Armor',
    description: 'Heavy steel plates offer excellent protection.',
    slot: 'armor',
    rarity: 'rare',
    stats: { armorBonus: 10, healthBonus: 40, agilityBonus: -8 },
    requirements: { minStrength: 50, combatRole: ['tank'] },
  },
  shadow_cloak: {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    description: 'A cloak woven from shadows themselves.',
    slot: 'armor',
    rarity: 'epic',
    stats: { armorBonus: 3, agilityBonus: 12, specialEffect: 'Chance to evade attacks entirely' },
  },
  dragonscale_mail: {
    id: 'dragonscale_mail',
    name: 'Dragonscale Mail',
    description: 'Armor crafted from the scales of a fallen dragon.',
    slot: 'armor',
    rarity: 'legendary',
    stats: { armorBonus: 15, healthBonus: 50, enduranceBonus: 10, specialEffect: 'Fire resistance' },
    flavorText: 'Each scale remembers the dragon it came from.',
  },
  healer_robes: {
    id: 'healer_robes',
    name: "Healer's Robes",
    description: 'Enchanted robes that enhance healing abilities.',
    slot: 'armor',
    rarity: 'uncommon',
    stats: { armorBonus: 1, healthBonus: 15, specialEffect: 'Healing abilities +25%' },
    requirements: { combatRole: ['support'] },
  },

  // ACCESSORIES
  lucky_charm: {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'A small trinket that brings good fortune.',
    slot: 'accessory',
    rarity: 'common',
    stats: { criticalChanceBonus: 3, moraleBonus: 5 },
  },
  ring_of_strength: {
    id: 'ring_of_strength',
    name: 'Ring of Strength',
    description: 'A ring that enhances physical power.',
    slot: 'accessory',
    rarity: 'uncommon',
    stats: { strengthBonus: 10 },
  },
  amulet_of_endurance: {
    id: 'amulet_of_endurance',
    name: 'Amulet of Endurance',
    description: 'An amulet that bolsters constitution.',
    slot: 'accessory',
    rarity: 'uncommon',
    stats: { enduranceBonus: 10, healthBonus: 15 },
  },
  warriors_medallion: {
    id: 'warriors_medallion',
    name: "Warrior's Medallion",
    description: 'A medallion that inspires combat prowess.',
    slot: 'accessory',
    rarity: 'rare',
    stats: { combatSkillBonus: 8, moraleBonus: 15 },
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    description: 'A feather from a legendary phoenix.',
    slot: 'accessory',
    rarity: 'legendary',
    stats: { healthBonus: 30, moraleBonus: 25, specialEffect: 'Revive once per combat if knocked out' },
    flavorText: 'It glows with an inner fire that never dies.',
  },
  berserker_totem: {
    id: 'berserker_totem',
    name: 'Berserker Totem',
    description: 'A primal totem that enhances aggression.',
    slot: 'accessory',
    rarity: 'epic',
    stats: { damageBonus: 8, strengthBonus: 8, armorBonus: -3, specialEffect: 'Damage increases when health is low' },
  },
};

// ============================================================================
// RARITY COLORS
// ============================================================================

export const RARITY_COLORS: Record<EquipmentRarity, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

export const RARITY_BG_COLORS: Record<EquipmentRarity, string> = {
  common: 'bg-gray-500/10 border-gray-500/30',
  uncommon: 'bg-green-500/10 border-green-500/30',
  rare: 'bg-blue-500/10 border-blue-500/30',
  epic: 'bg-purple-500/10 border-purple-500/30',
  legendary: 'bg-yellow-500/10 border-yellow-500/30',
};

// ============================================================================
// EQUIPMENT MANAGER
// ============================================================================

class CompanionEquipmentManager {
  private loadouts: Map<string, CompanionLoadout> = new Map();

  // Get a companion's loadout
  getLoadout(companionId: string): CompanionLoadout {
    if (!this.loadouts.has(companionId)) {
      this.loadouts.set(companionId, { companionId });
    }
    return this.loadouts.get(companionId)!;
  }

  // Check if companion meets equipment requirements
  canEquip(
    companionId: string,
    equipment: CompanionEquipment,
    combatStats?: CompanionCombatStats,
    combatRole?: string
  ): { canEquip: boolean; reason?: string } {
    const req = equipment.requirements;
    if (!req) return { canEquip: true };

    if (req.minStrength && combatStats && combatStats.baseStrength < req.minStrength) {
      return { canEquip: false, reason: `Requires ${req.minStrength} Strength` };
    }
    if (req.minAgility && combatStats && combatStats.baseDexterity < req.minAgility) {
      return { canEquip: false, reason: `Requires ${req.minAgility} Dexterity` };
    }
    if (req.combatRole && combatRole && !req.combatRole.includes(combatRole)) {
      return { canEquip: false, reason: `Requires ${req.combatRole.join(' or ')} role` };
    }

    return { canEquip: true };
  }

  // Equip an item
  equip(companionId: string, equipment: CompanionEquipment): { success: boolean; unequipped?: CompanionEquipment } {
    const loadout = this.getLoadout(companionId);
    const slot = equipment.slot;
    const previousItem = loadout[slot];

    loadout[slot] = equipment;
    this.loadouts.set(companionId, loadout);

    return { success: true, unequipped: previousItem };
  }

  // Unequip an item from a slot
  unequip(companionId: string, slot: EquipmentSlot): CompanionEquipment | undefined {
    const loadout = this.getLoadout(companionId);
    const item = loadout[slot];
    loadout[slot] = undefined;
    this.loadouts.set(companionId, loadout);
    return item;
  }

  // Calculate total stat bonuses from equipment
  calculateEquipmentBonuses(companionId: string): EquipmentStats {
    const loadout = this.getLoadout(companionId);
    const bonuses: EquipmentStats = {
      damageBonus: 0,
      armorBonus: 0,
      strengthBonus: 0,
      agilityBonus: 0,
      enduranceBonus: 0,
      combatSkillBonus: 0,
      healthBonus: 0,
      moraleBonus: 0,
      criticalChanceBonus: 0,
    };

    const items = [loadout.weapon, loadout.armor, loadout.accessory].filter(Boolean) as CompanionEquipment[];

    for (const item of items) {
      bonuses.damageBonus! += item.stats.damageBonus || 0;
      bonuses.armorBonus! += item.stats.armorBonus || 0;
      bonuses.strengthBonus! += item.stats.strengthBonus || 0;
      bonuses.agilityBonus! += item.stats.agilityBonus || 0;
      bonuses.enduranceBonus! += item.stats.enduranceBonus || 0;
      bonuses.combatSkillBonus! += item.stats.combatSkillBonus || 0;
      bonuses.healthBonus! += item.stats.healthBonus || 0;
      bonuses.moraleBonus! += item.stats.moraleBonus || 0;
      bonuses.criticalChanceBonus! += item.stats.criticalChanceBonus || 0;
    }

    return bonuses;
  }

  // Get all special effects from equipment
  getSpecialEffects(companionId: string): string[] {
    const loadout = this.getLoadout(companionId);
    const effects: string[] = [];

    const items = [loadout.weapon, loadout.armor, loadout.accessory].filter(Boolean) as CompanionEquipment[];
    for (const item of items) {
      if (item.stats.specialEffect) {
        effects.push(item.stats.specialEffect);
      }
    }

    return effects;
  }

  // Serialize for save
  serialize(): Record<string, CompanionLoadout> {
    const data: Record<string, CompanionLoadout> = {};
    this.loadouts.forEach((loadout, id) => {
      data[id] = loadout;
    });
    return data;
  }

  // Deserialize from save
  deserialize(data: Record<string, CompanionLoadout>): void {
    this.loadouts.clear();
    Object.entries(data).forEach(([id, loadout]) => {
      this.loadouts.set(id, loadout);
    });
  }

  // Clear all loadouts
  reset(): void {
    this.loadouts.clear();
  }
}

export const companionEquipmentManager = new CompanionEquipmentManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getEquipmentById(id: string): CompanionEquipment | undefined {
  return EQUIPMENT_DATABASE[id];
}

export function getEquipmentBySlot(slot: EquipmentSlot): CompanionEquipment[] {
  return Object.values(EQUIPMENT_DATABASE).filter(e => e.slot === slot);
}

export function getEquipmentByRarity(rarity: EquipmentRarity): CompanionEquipment[] {
  return Object.values(EQUIPMENT_DATABASE).filter(e => e.rarity === rarity);
}

export function generateRandomEquipment(maxRarity: EquipmentRarity = 'rare'): CompanionEquipment {
  const rarityOrder: EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const maxIndex = rarityOrder.indexOf(maxRarity);
  
  // Weight towards lower rarities
  const weights = [40, 30, 20, 8, 2].slice(0, maxIndex + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  
  let selectedRarity: EquipmentRarity = 'common';
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      selectedRarity = rarityOrder[i];
      break;
    }
  }

  const equipmentOfRarity = getEquipmentByRarity(selectedRarity);
  return equipmentOfRarity[Math.floor(Math.random() * equipmentOfRarity.length)];
}
