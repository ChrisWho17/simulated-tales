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

// ============================================================================
// GENRE-SPECIFIC EQUIPMENT DATABASE
// ============================================================================

export type CombatRole = 'tank' | 'damage' | 'support' | 'ranged';

interface GenreEquipmentSet {
  weapons: CompanionEquipment[];
  armor: CompanionEquipment[];
  accessories: CompanionEquipment[];
}

// Role-appropriate equipment mapping for filtering
const ROLE_WEAPON_TAGS: Record<CombatRole, string[]> = {
  tank: ['shield', 'mace', 'axe', 'hammer', 'sword'],
  damage: ['sword', 'axe', 'dagger', 'blade'],
  support: ['staff', 'wand', 'tome', 'rod'],
  ranged: ['bow', 'crossbow', 'rifle', 'pistol', 'gun'],
};

const ROLE_ARMOR_TAGS: Record<CombatRole, string[]> = {
  tank: ['plate', 'heavy', 'shield', 'mail'],
  damage: ['leather', 'chain', 'light'],
  support: ['robes', 'cloth', 'light'],
  ranged: ['leather', 'cloak', 'light'],
};

// Genre-specific equipment databases
const GENRE_EQUIPMENT: Record<string, GenreEquipmentSet> = {
  fantasy: {
    weapons: [
      { id: 'f_longsword', name: 'Longsword', description: 'A balanced blade for skilled warriors.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 3, combatSkillBonus: 2 }, requirements: { combatRole: ['tank', 'damage'] } },
      { id: 'f_battleaxe', name: 'Battle Axe', description: 'A heavy cleaving weapon.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 5, agilityBonus: -3 }, requirements: { combatRole: ['tank', 'damage'] } },
      { id: 'f_staff', name: 'Oak Staff', description: 'A sturdy magical focus.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 1, healthBonus: 10 }, requirements: { combatRole: ['support'] } },
      { id: 'f_shortbow', name: 'Shortbow', description: 'A quick and accurate ranged weapon.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 2, agilityBonus: 3 }, requirements: { combatRole: ['ranged'] } },
      { id: 'f_healstaff', name: 'Healing Staff', description: 'Imbued with restorative magic.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 1, healthBonus: 15, specialEffect: 'Healing boost +15%' }, requirements: { combatRole: ['support'] } },
      { id: 'f_longbow', name: 'Elven Longbow', description: 'Crafted by skilled elven artisans.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 4, agilityBonus: 5, criticalChanceBonus: 5 }, requirements: { combatRole: ['ranged'] } },
    ],
    armor: [
      { id: 'f_leather', name: 'Leather Armor', description: 'Basic leather protection.', slot: 'armor', rarity: 'common', stats: { armorBonus: 2, healthBonus: 5 } },
      { id: 'f_chainmail', name: 'Chainmail', description: 'Interlocking metal rings.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 5, healthBonus: 15, agilityBonus: -2 } },
      { id: 'f_plate', name: 'Plate Armor', description: 'Heavy steel plate protection.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 10, healthBonus: 30, agilityBonus: -5 }, requirements: { combatRole: ['tank'] } },
      { id: 'f_robes', name: "Healer's Robes", description: 'Enchanted cloth for support.', slot: 'armor', rarity: 'common', stats: { armorBonus: 1, healthBonus: 10, specialEffect: 'Mana regen +10%' }, requirements: { combatRole: ['support'] } },
      { id: 'f_ranger', name: "Ranger's Garb", description: 'Light armor for mobility.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 3, agilityBonus: 5 }, requirements: { combatRole: ['ranged', 'damage'] } },
    ],
    accessories: [
      { id: 'f_amulet', name: 'Protective Amulet', description: 'A charm of protection.', slot: 'accessory', rarity: 'common', stats: { armorBonus: 1, moraleBonus: 5 } },
      { id: 'f_ring', name: 'Ring of Vigor', description: 'Enhances vitality.', slot: 'accessory', rarity: 'uncommon', stats: { healthBonus: 15, enduranceBonus: 5 } },
      { id: 'f_cloak', name: 'Traveler\'s Cloak', description: 'A warm and sturdy cloak.', slot: 'accessory', rarity: 'common', stats: { agilityBonus: 2, moraleBonus: 3 } },
    ],
  },
  war: {
    weapons: [
      { id: 'w_rifle', name: 'Combat Rifle', description: 'Standard issue military rifle.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 4, combatSkillBonus: 2 }, requirements: { combatRole: ['ranged', 'damage'] } },
      { id: 'w_smg', name: 'Submachine Gun', description: 'Compact automatic weapon.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 3, agilityBonus: 3 }, requirements: { combatRole: ['ranged', 'damage'] } },
      { id: 'w_sniper', name: 'Sniper Rifle', description: 'Precision long-range rifle.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 6, criticalChanceBonus: 10 }, requirements: { combatRole: ['ranged'] } },
      { id: 'w_shotgun', name: 'Combat Shotgun', description: 'Devastating at close range.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 5, agilityBonus: -2 }, requirements: { combatRole: ['tank', 'damage'] } },
      { id: 'w_medkit', name: 'Medic Kit', description: 'Advanced medical equipment.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 0, healthBonus: 20, specialEffect: 'Healing actions +25%' }, requirements: { combatRole: ['support'] } },
      { id: 'w_lmg', name: 'Light Machine Gun', description: 'Suppressive fire capability.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 5, armorBonus: 2, agilityBonus: -4 }, requirements: { combatRole: ['tank'] } },
    ],
    armor: [
      { id: 'w_fatigues', name: 'Military Fatigues', description: 'Standard combat uniform.', slot: 'armor', rarity: 'common', stats: { armorBonus: 2, agilityBonus: 2 } },
      { id: 'w_vest', name: 'Tactical Vest', description: 'Ballistic protection vest.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 5, healthBonus: 15 } },
      { id: 'w_heavy', name: 'Heavy Body Armor', description: 'Maximum ballistic protection.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 10, healthBonus: 30, agilityBonus: -5 }, requirements: { combatRole: ['tank'] } },
      { id: 'w_ghillie', name: 'Ghillie Suit', description: 'Camouflage for snipers.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 1, agilityBonus: 5, specialEffect: 'Stealth +20%' }, requirements: { combatRole: ['ranged'] } },
      { id: 'w_medic', name: 'Medic Uniform', description: 'Marked medical personnel gear.', slot: 'armor', rarity: 'common', stats: { armorBonus: 2, healthBonus: 10, specialEffect: 'Healing speed +15%' }, requirements: { combatRole: ['support'] } },
    ],
    accessories: [
      { id: 'w_dogtags', name: 'Dog Tags', description: 'Military identification.', slot: 'accessory', rarity: 'common', stats: { moraleBonus: 5 } },
      { id: 'w_nvg', name: 'Night Vision Goggles', description: 'Enhanced night combat.', slot: 'accessory', rarity: 'rare', stats: { combatSkillBonus: 5, criticalChanceBonus: 5, specialEffect: 'Night vision' } },
      { id: 'w_radio', name: 'Tactical Radio', description: 'Squad communication.', slot: 'accessory', rarity: 'uncommon', stats: { combatSkillBonus: 3, moraleBonus: 5 } },
    ],
  },
  cyberpunk: {
    weapons: [
      { id: 'c_pistol', name: 'Smart Pistol', description: 'Auto-targeting sidearm.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 3, criticalChanceBonus: 5 }, requirements: { combatRole: ['ranged', 'damage'] } },
      { id: 'c_katana', name: 'Mono-Katana', description: 'Molecular-edge blade.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 5, agilityBonus: 3 }, requirements: { combatRole: ['damage'] } },
      { id: 'c_techrifle', name: 'Tech Rifle', description: 'Charged projectile weapon.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 6, criticalChanceBonus: 8 }, requirements: { combatRole: ['ranged'] } },
      { id: 'c_nanomed', name: 'Nano-Medkit', description: 'Nanite healing system.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 0, healthBonus: 25, specialEffect: 'Rapid healing' }, requirements: { combatRole: ['support'] } },
      { id: 'c_mantis', name: 'Mantis Blades', description: 'Retractable arm blades.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 6, agilityBonus: 5, criticalChanceBonus: 5 }, requirements: { combatRole: ['damage'] } },
    ],
    armor: [
      { id: 'c_jacket', name: 'Armored Jacket', description: 'Lined with ballistic weave.', slot: 'armor', rarity: 'common', stats: { armorBonus: 3, agilityBonus: 1 } },
      { id: 'c_subdermal', name: 'Subdermal Armor', description: 'Implanted protection.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 8, healthBonus: 20 } },
      { id: 'c_netsuit', name: 'Netrunner Suit', description: 'Optimized for hacking.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 2, agilityBonus: 5, specialEffect: 'Hacking +20%' }, requirements: { combatRole: ['support', 'ranged'] } },
      { id: 'c_exo', name: 'Exoskeleton Frame', description: 'Powered armor frame.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 10, strengthBonus: 10, agilityBonus: -3 }, requirements: { combatRole: ['tank'] } },
    ],
    accessories: [
      { id: 'c_optics', name: 'Kiroshi Optics', description: 'Enhanced cyber-eyes.', slot: 'accessory', rarity: 'uncommon', stats: { criticalChanceBonus: 5, combatSkillBonus: 3 } },
      { id: 'c_sandevistan', name: 'Sandevistan', description: 'Time-dilation implant.', slot: 'accessory', rarity: 'rare', stats: { agilityBonus: 10, criticalChanceBonus: 10, specialEffect: 'Bullet time' } },
      { id: 'c_datajack', name: 'Data Jack', description: 'Neural interface port.', slot: 'accessory', rarity: 'common', stats: { combatSkillBonus: 2 } },
    ],
  },
  horror: {
    weapons: [
      { id: 'h_shotgun', name: 'Pump Shotgun', description: 'Reliable stopping power.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 4 }, requirements: { combatRole: ['damage', 'tank'] } },
      { id: 'h_revolver', name: 'Silver Revolver', description: 'Loaded with blessed rounds.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 4, specialEffect: 'Extra damage vs undead' }, requirements: { combatRole: ['ranged', 'damage'] } },
      { id: 'h_cross', name: 'Holy Symbol', description: 'A blessed protective focus.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 1, moraleBonus: 10, specialEffect: 'Repel evil' }, requirements: { combatRole: ['support'] } },
      { id: 'h_stake', name: 'Wooden Stakes', description: 'Essential vampire hunting gear.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 2, criticalChanceBonus: 10, specialEffect: 'Instant kill vs vampires' } },
      { id: 'h_flamethrower', name: 'Flamethrower', description: 'Burns everything.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 6, specialEffect: 'Fire damage, fear effect' }, requirements: { combatRole: ['damage', 'tank'] } },
    ],
    armor: [
      { id: 'h_coat', name: 'Heavy Coat', description: 'Thick protective layer.', slot: 'armor', rarity: 'common', stats: { armorBonus: 2, moraleBonus: 3 } },
      { id: 'h_vest', name: 'Protective Vest', description: 'Hidden body armor.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 4, healthBonus: 10 } },
      { id: 'h_hunter', name: "Monster Hunter's Garb", description: 'Traditional hunting attire.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 5, agilityBonus: 3, specialEffect: 'Resistance to fear' } },
    ],
    accessories: [
      { id: 'h_crucifix', name: 'Silver Crucifix', description: 'Holy protection.', slot: 'accessory', rarity: 'common', stats: { moraleBonus: 10, specialEffect: 'Ward vs evil' } },
      { id: 'h_garlic', name: 'Garlic Necklace', description: 'Traditional vampire ward.', slot: 'accessory', rarity: 'common', stats: { healthBonus: 5, specialEffect: 'Vampire repellent' } },
      { id: 'h_holywater', name: 'Holy Water Vial', description: 'Blessed by a priest.', slot: 'accessory', rarity: 'uncommon', stats: { damageBonus: 2, specialEffect: 'Burn undead' } },
    ],
  },
  western: {
    weapons: [
      { id: 'ws_revolver', name: 'Six-Shooter', description: 'Classic frontier revolver.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 3, combatSkillBonus: 2 }, requirements: { combatRole: ['ranged', 'damage'] } },
      { id: 'ws_rifle', name: 'Lever-Action Rifle', description: 'Reliable repeating rifle.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 4, criticalChanceBonus: 5 }, requirements: { combatRole: ['ranged'] } },
      { id: 'ws_shotgun', name: 'Coach Gun', description: 'Double-barreled shotgun.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 5, agilityBonus: -2 }, requirements: { combatRole: ['damage', 'tank'] } },
      { id: 'ws_knife', name: 'Bowie Knife', description: 'Large hunting knife.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 2, agilityBonus: 2 } },
      { id: 'ws_medical', name: 'Doctor\'s Bag', description: 'Frontier medical supplies.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 0, healthBonus: 20, specialEffect: 'Healing +20%' }, requirements: { combatRole: ['support'] } },
    ],
    armor: [
      { id: 'ws_duster', name: 'Leather Duster', description: 'Long protective coat.', slot: 'armor', rarity: 'common', stats: { armorBonus: 2, agilityBonus: 1 } },
      { id: 'ws_vest', name: 'Leather Vest', description: 'Sturdy frontier protection.', slot: 'armor', rarity: 'common', stats: { armorBonus: 3, healthBonus: 5 } },
      { id: 'ws_chaps', name: 'Riding Chaps', description: 'Protective leg wear.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 2, agilityBonus: 3 } },
    ],
    accessories: [
      { id: 'ws_hat', name: 'Cowboy Hat', description: 'Iconic western headwear.', slot: 'accessory', rarity: 'common', stats: { moraleBonus: 5, agilityBonus: 1 } },
      { id: 'ws_watch', name: 'Pocket Watch', description: 'Keeps perfect time.', slot: 'accessory', rarity: 'uncommon', stats: { combatSkillBonus: 3 } },
      { id: 'ws_badge', name: "Sheriff's Badge", description: 'Symbol of law.', slot: 'accessory', rarity: 'rare', stats: { moraleBonus: 10, armorBonus: 2, specialEffect: 'Intimidation' } },
    ],
  },
  scifi: {
    weapons: [
      { id: 's_blaster', name: 'Blaster Pistol', description: 'Standard energy sidearm.', slot: 'weapon', rarity: 'common', stats: { damageBonus: 3, agilityBonus: 2 }, requirements: { combatRole: ['ranged', 'damage'] } },
      { id: 's_rifle', name: 'Plasma Rifle', description: 'High-powered energy weapon.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 5, criticalChanceBonus: 5 }, requirements: { combatRole: ['ranged'] } },
      { id: 's_blade', name: 'Energy Blade', description: 'Plasma-edged melee weapon.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 6, agilityBonus: 4 }, requirements: { combatRole: ['damage'] } },
      { id: 's_medgun', name: 'Medi-Ray', description: 'Healing beam projector.', slot: 'weapon', rarity: 'uncommon', stats: { damageBonus: 0, healthBonus: 25, specialEffect: 'Ranged healing' }, requirements: { combatRole: ['support'] } },
      { id: 's_heavy', name: 'Heavy Cannon', description: 'Crew-served energy weapon.', slot: 'weapon', rarity: 'rare', stats: { damageBonus: 8, agilityBonus: -5, armorBonus: 2 }, requirements: { combatRole: ['tank'] } },
    ],
    armor: [
      { id: 's_jumpsuit', name: 'Space Jumpsuit', description: 'Standard crew attire.', slot: 'armor', rarity: 'common', stats: { armorBonus: 2, agilityBonus: 2 } },
      { id: 's_combat', name: 'Combat Suit', description: 'Military-grade protection.', slot: 'armor', rarity: 'uncommon', stats: { armorBonus: 5, healthBonus: 15 } },
      { id: 's_power', name: 'Power Armor', description: 'Powered exosuit.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 12, strengthBonus: 10, agilityBonus: -3 }, requirements: { combatRole: ['tank'] } },
      { id: 's_stealth', name: 'Stealth Suit', description: 'Active camouflage.', slot: 'armor', rarity: 'rare', stats: { armorBonus: 3, agilityBonus: 8, specialEffect: 'Cloaking' }, requirements: { combatRole: ['ranged', 'damage'] } },
    ],
    accessories: [
      { id: 's_helmet', name: 'Tactical Helmet', description: 'HUD-equipped headgear.', slot: 'accessory', rarity: 'common', stats: { armorBonus: 2, combatSkillBonus: 2 } },
      { id: 's_shield', name: 'Personal Shield', description: 'Energy barrier generator.', slot: 'accessory', rarity: 'rare', stats: { armorBonus: 5, healthBonus: 15, specialEffect: 'Shield regen' } },
      { id: 's_implant', name: 'Combat Implant', description: 'Neural combat enhancer.', slot: 'accessory', rarity: 'uncommon', stats: { agilityBonus: 5, criticalChanceBonus: 5 } },
    ],
  },
};

// Default equipment set for unrecognized genres
const DEFAULT_EQUIPMENT: GenreEquipmentSet = GENRE_EQUIPMENT.fantasy;

// ============================================================================
// ROLE-BASED EQUIPMENT GENERATION
// ============================================================================

/**
 * Get equipment appropriate for a specific combat role
 */
function filterEquipmentByRole(equipment: CompanionEquipment[], role: CombatRole): CompanionEquipment[] {
  return equipment.filter(item => {
    // If no role requirements, it's usable by anyone
    if (!item.requirements?.combatRole) return true;
    // Check if the item is compatible with the role
    return item.requirements.combatRole.includes(role);
  });
}

/**
 * Select random equipment from a list weighted by rarity
 */
function selectWeightedEquipment(
  equipment: CompanionEquipment[],
  maxRarity: EquipmentRarity = 'rare'
): CompanionEquipment | null {
  if (equipment.length === 0) return null;

  const rarityOrder: EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const maxIndex = rarityOrder.indexOf(maxRarity);
  const weights: Record<EquipmentRarity, number> = {
    common: 40,
    uncommon: 30,
    rare: 20,
    epic: 8,
    legendary: 2,
  };

  // Filter by max rarity and calculate total weight
  const eligibleEquipment = equipment.filter(
    item => rarityOrder.indexOf(item.rarity) <= maxIndex
  );

  if (eligibleEquipment.length === 0) return equipment[0]; // Fallback

  const totalWeight = eligibleEquipment.reduce((sum, item) => sum + weights[item.rarity], 0);
  let roll = Math.random() * totalWeight;

  for (const item of eligibleEquipment) {
    roll -= weights[item.rarity];
    if (roll <= 0) return item;
  }

  return eligibleEquipment[0];
}

/**
 * Generate a complete equipment loadout based on genre and combat role
 */
export function generateRoleBasedEquipment(
  genre: string,
  role: CombatRole,
  maxRarity: EquipmentRarity = 'uncommon'
): { weapon: CompanionEquipment | null; armor: CompanionEquipment | null; accessory: CompanionEquipment | null } {
  // Normalize genre and get equipment set
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]/g, '_');
  const genreSet = GENRE_EQUIPMENT[normalizedGenre] || DEFAULT_EQUIPMENT;

  // Filter equipment by role
  const roleWeapons = filterEquipmentByRole(genreSet.weapons, role);
  const roleArmor = filterEquipmentByRole(genreSet.armor, role);
  const roleAccessories = filterEquipmentByRole(genreSet.accessories, role);

  // Fallback to any genre weapons if role-specific not found
  const weaponPool = roleWeapons.length > 0 ? roleWeapons : genreSet.weapons;
  const armorPool = roleArmor.length > 0 ? roleArmor : genreSet.armor;
  const accessoryPool = roleAccessories.length > 0 ? roleAccessories : genreSet.accessories;

  return {
    weapon: selectWeightedEquipment(weaponPool, maxRarity),
    armor: selectWeightedEquipment(armorPool, maxRarity),
    accessory: Math.random() > 0.3 ? selectWeightedEquipment(accessoryPool, maxRarity) : null, // 70% chance for accessory
  };
}

/**
 * Get available equipment options for a specific genre and role (for UI display)
 */
export function getEquipmentOptionsForRole(
  genre: string,
  role: CombatRole,
  slot: EquipmentSlot
): CompanionEquipment[] {
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]/g, '_');
  const genreSet = GENRE_EQUIPMENT[normalizedGenre] || DEFAULT_EQUIPMENT;

  let pool: CompanionEquipment[];
  switch (slot) {
    case 'weapon':
      pool = genreSet.weapons;
      break;
    case 'armor':
      pool = genreSet.armor;
      break;
    case 'accessory':
      pool = genreSet.accessories;
      break;
  }

  return filterEquipmentByRole(pool, role);
}

/**
 * Get all genre equipment (for browsing all options)
 */
export function getGenreEquipment(genre: string): GenreEquipmentSet {
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]/g, '_');
  return GENRE_EQUIPMENT[normalizedGenre] || DEFAULT_EQUIPMENT;
}

/**
 * List all available genres with custom equipment
 */
export function getAvailableEquipmentGenres(): string[] {
  return Object.keys(GENRE_EQUIPMENT);
}
