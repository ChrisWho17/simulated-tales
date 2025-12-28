/**
 * Weapon Crafting System - Materials, Recipes, and Repairs
 * For Gun Nut mode - craft parts, attachments, and repair weapons.
 */

import { isGunNutMode, getWeaponSettings, GunNutWeapon } from './gunNutSystem';

// ============= MATERIALS =============

export type MaterialRarity = 'common' | 'uncommon' | 'rare' | 'very_rare';

export interface CraftingMaterial {
  id: string;
  name: string;
  rarity: MaterialRarity;
  weight: number;
  description: string;
}

export const MATERIALS: Record<string, CraftingMaterial> = {
  steel_scrap: { id: 'steel_scrap', name: 'Steel Scrap', rarity: 'common', weight: 0.5, description: 'Salvaged steel pieces' },
  steel_rod: { id: 'steel_rod', name: 'Steel Rod', rarity: 'common', weight: 0.3, description: 'Solid steel rod' },
  steel_tube: { id: 'steel_tube', name: 'Steel Tube', rarity: 'uncommon', weight: 0.4, description: 'Hollow steel tubing' },
  steel_plate: { id: 'steel_plate', name: 'Steel Plate', rarity: 'uncommon', weight: 0.8, description: 'Flat steel plate' },
  aluminum_scrap: { id: 'aluminum_scrap', name: 'Aluminum Scrap', rarity: 'common', weight: 0.2, description: 'Lightweight aluminum pieces' },
  spring_steel: { id: 'spring_steel', name: 'Spring Steel Wire', rarity: 'uncommon', weight: 0.1, description: 'High-tension spring steel' },
  polymer_block: { id: 'polymer_block', name: 'Polymer Block', rarity: 'common', weight: 0.3, description: 'Moldable polymer material' },
  rubber_grip: { id: 'rubber_grip', name: 'Rubber Grip Material', rarity: 'uncommon', weight: 0.1, description: 'Textured rubber' },
  gas_block: { id: 'gas_block', name: 'Gas Block', rarity: 'rare', weight: 0.1, description: 'Precision gas system component' },
  roll_pin: { id: 'roll_pin', name: 'Roll Pin Set', rarity: 'common', weight: 0.05, description: 'Assorted roll pins' },
  grip_screw: { id: 'grip_screw', name: 'Grip Screw', rarity: 'common', weight: 0.02, description: 'Standard grip screws' },
  buffer_spring: { id: 'buffer_spring', name: 'Buffer Spring', rarity: 'uncommon', weight: 0.05, description: 'Recoil buffer spring' },
  firing_pin_blank: { id: 'firing_pin_blank', name: 'Firing Pin Blank', rarity: 'rare', weight: 0.02, description: 'Unfinished firing pin' },
  gun_oil: { id: 'gun_oil', name: 'Gun Oil', rarity: 'common', weight: 0.2, description: 'Lubricating oil' },
  solvent: { id: 'solvent', name: 'Cleaning Solvent', rarity: 'common', weight: 0.3, description: 'Carbon removing solvent' },
  threading_die: { id: 'threading_die', name: 'Threading Die Set', rarity: 'rare', weight: 0.5, description: 'For cutting threads' },
};

// ============= TOOLS =============

export type ToolType = 'workbench' | 'cleaning_kit' | 'tool_kit' | 'lathe' | 'drill' | 'mill' | 'gunsmith_bench' | 'file';

export const TOOLS: Record<ToolType, { name: string; description: string }> = {
  workbench: { name: 'Workbench', description: 'Basic crafting station' },
  cleaning_kit: { name: 'Cleaning Kit', description: 'Rods, brushes, patches' },
  tool_kit: { name: 'Tool Kit', description: 'Screwdrivers, wrenches, pliers' },
  lathe: { name: 'Lathe', description: 'For precision metalwork' },
  drill: { name: 'Drill Press', description: 'Precision drilling' },
  mill: { name: 'Milling Machine', description: 'Complex metal shaping' },
  gunsmith_bench: { name: 'Gunsmith Bench', description: 'Full weapon service station' },
  file: { name: 'File Set', description: 'For hand finishing' },
};

// ============= CRAFTING RECIPES =============

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'part' | 'attachment' | 'consumable';
  materials: Record<string, number>;
  tools: ToolType[];
  skillRequired: number;          // 0-100
  craftTime: number;              // minutes
  resultCondition: [number, number]; // [min, max]
  description: string;
}

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  // Parts
  craft_firing_pin: {
    id: 'craft_firing_pin',
    name: 'Craft Firing Pin',
    category: 'part',
    materials: { steel_rod: 1, spring_steel: 1 },
    tools: ['workbench', 'file'],
    skillRequired: 30,
    craftTime: 30,
    resultCondition: [60, 85],
    description: 'Forge a replacement firing pin',
  },
  craft_buffer_spring: {
    id: 'craft_buffer_spring',
    name: 'Craft Buffer Spring',
    category: 'part',
    materials: { spring_steel: 2 },
    tools: ['workbench'],
    skillRequired: 20,
    craftTime: 15,
    resultCondition: [50, 80],
    description: 'Wind a new buffer spring',
  },
  craft_gas_tube: {
    id: 'craft_gas_tube',
    name: 'Craft Gas Tube',
    category: 'part',
    materials: { steel_tube: 1, gas_block: 1, roll_pin: 1 },
    tools: ['workbench', 'drill'],
    skillRequired: 45,
    craftTime: 45,
    resultCondition: [55, 90],
    description: 'Assemble a gas system',
  },
  craft_pistol_grip: {
    id: 'craft_pistol_grip',
    name: 'Craft Pistol Grip',
    category: 'part',
    materials: { polymer_block: 1, grip_screw: 1 },
    tools: ['workbench'],
    skillRequired: 15,
    craftTime: 20,
    resultCondition: [65, 95],
    description: 'Mold a pistol grip',
  },
  
  // Attachments
  craft_flash_hider: {
    id: 'craft_flash_hider',
    name: 'Craft Flash Hider',
    category: 'attachment',
    materials: { steel_tube: 1 },
    tools: ['lathe'],
    skillRequired: 35,
    craftTime: 40,
    resultCondition: [50, 85],
    description: 'Machine a flash hider',
  },
  craft_compensator: {
    id: 'craft_compensator',
    name: 'Craft Compensator',
    category: 'attachment',
    materials: { steel_tube: 1, steel_scrap: 1 },
    tools: ['lathe', 'drill'],
    skillRequired: 50,
    craftTime: 60,
    resultCondition: [45, 80],
    description: 'Machine a compensator',
  },
  craft_muzzle_brake: {
    id: 'craft_muzzle_brake',
    name: 'Craft Muzzle Brake',
    category: 'attachment',
    materials: { steel_tube: 1, steel_plate: 1 },
    tools: ['lathe', 'mill'],
    skillRequired: 55,
    craftTime: 75,
    resultCondition: [40, 75],
    description: 'Machine a muzzle brake',
  },
  craft_vertical_foregrip: {
    id: 'craft_vertical_foregrip',
    name: 'Craft Vertical Foregrip',
    category: 'attachment',
    materials: { polymer_block: 2, steel_scrap: 1 },
    tools: ['workbench'],
    skillRequired: 25,
    craftTime: 30,
    resultCondition: [60, 90],
    description: 'Mold a vertical foregrip',
  },
  
  // Consumables
  assemble_cleaning_kit: {
    id: 'assemble_cleaning_kit',
    name: 'Assemble Cleaning Kit',
    category: 'consumable',
    materials: { gun_oil: 1, solvent: 1, steel_rod: 1 },
    tools: [],
    skillRequired: 5,
    craftTime: 5,
    resultCondition: [100, 100],
    description: 'Bundle cleaning supplies',
  },
};

// ============= REPAIR RECIPES =============

export interface RepairRecipe {
  id: string;
  name: string;
  materials: Record<string, number>;
  tools: ToolType[];
  skillRequired: number;
  repairTime: number;              // minutes
  conditionRestore: number;
  maxCondition: number;
  description: string;
}

export const REPAIR_RECIPES: Record<string, RepairRecipe> = {
  field_clean: {
    id: 'field_clean',
    name: 'Field Clean',
    materials: {},
    tools: [],
    skillRequired: 5,
    repairTime: 5,
    conditionRestore: 10,
    maxCondition: 60,
    description: 'Quick wipe-down. No tools needed.',
  },
  basic_cleaning: {
    id: 'basic_cleaning',
    name: 'Basic Cleaning',
    materials: { gun_oil: 0.1 },
    tools: ['cleaning_kit'],
    skillRequired: 10,
    repairTime: 15,
    conditionRestore: 20,
    maxCondition: 75,
    description: 'Standard cleaning with oil.',
  },
  full_cleaning: {
    id: 'full_cleaning',
    name: 'Full Detail Clean',
    materials: { gun_oil: 0.2, solvent: 0.2 },
    tools: ['cleaning_kit', 'workbench'],
    skillRequired: 20,
    repairTime: 30,
    conditionRestore: 35,
    maxCondition: 90,
    description: 'Complete disassembly and cleaning.',
  },
  minor_repair: {
    id: 'minor_repair',
    name: 'Minor Repair',
    materials: { gun_oil: 0.1 },
    tools: ['workbench', 'tool_kit'],
    skillRequired: 30,
    repairTime: 20,
    conditionRestore: 15,
    maxCondition: 85,
    description: 'Fix minor issues, replace small parts.',
  },
  major_repair: {
    id: 'major_repair',
    name: 'Major Repair',
    materials: { steel_scrap: 1, gun_oil: 0.2 },
    tools: ['workbench', 'tool_kit'],
    skillRequired: 50,
    repairTime: 45,
    conditionRestore: 40,
    maxCondition: 95,
    description: 'Significant repairs and part replacement.',
  },
  full_rebuild: {
    id: 'full_rebuild',
    name: 'Full Rebuild',
    materials: { steel_scrap: 2, gun_oil: 0.3, solvent: 0.2 },
    tools: ['gunsmith_bench'],
    skillRequired: 70,
    repairTime: 120,
    conditionRestore: 100,
    maxCondition: 100,
    description: 'Complete weapon rebuild. Can restore destroyed weapons.',
  },
};

// ============= CRAFTING FUNCTIONS =============

export interface CraftResult {
  success: boolean;
  reason?: string;
  item?: string;
  condition?: number;
  craftTime?: number;
  materialsConsumed?: Record<string, number>;
  required?: number;
  current?: number;
  missing?: string;
  have?: number;
  tool?: string;
}

export function attemptCraft(
  recipeId: string,
  playerSkill: number,
  availableMaterials: Record<string, number>,
  availableTools: ToolType[]
): CraftResult {
  const recipe = CRAFTING_RECIPES[recipeId];
  if (!recipe) {
    return { success: false, reason: 'unknown_recipe' };
  }
  
  // Check skill
  if (playerSkill < recipe.skillRequired) {
    return {
      success: false,
      reason: 'skill_too_low',
      required: recipe.skillRequired,
      current: playerSkill,
    };
  }
  
  // Check materials
  for (const [mat, amount] of Object.entries(recipe.materials)) {
    if (!availableMaterials[mat] || availableMaterials[mat] < amount) {
      return {
        success: false,
        reason: 'missing_materials',
        missing: mat,
        required: amount,
        have: availableMaterials[mat] || 0,
      };
    }
  }
  
  // Check tools
  for (const tool of recipe.tools) {
    if (!availableTools.includes(tool)) {
      return {
        success: false,
        reason: 'missing_tool',
        tool,
      };
    }
  }
  
  // Calculate result quality based on skill
  const skillBonus = (playerSkill - recipe.skillRequired) / 100;
  const baseQuality = recipe.resultCondition[0];
  const maxQuality = recipe.resultCondition[1];
  const qualityRange = maxQuality - baseQuality;
  
  const resultCondition = Math.min(
    maxQuality,
    baseQuality + (qualityRange * skillBonus) + (Math.random() * qualityRange * 0.3)
  );
  
  return {
    success: true,
    item: recipeId,
    condition: Math.floor(resultCondition),
    craftTime: recipe.craftTime,
    materialsConsumed: recipe.materials,
  };
}

export interface RepairResult {
  success: boolean;
  reason?: string;
  newCondition?: number;
  repairTime?: number;
  materialsConsumed?: Record<string, number>;
  required?: number;
  missing?: string;
  tool?: string;
}

export function attemptRepair(
  repairType: string,
  currentCondition: number,
  playerSkill: number,
  availableMaterials: Record<string, number>,
  availableTools: ToolType[]
): RepairResult {
  const repair = REPAIR_RECIPES[repairType];
  if (!repair) {
    return { success: false, reason: 'unknown_repair' };
  }
  
  // Check skill
  if (playerSkill < repair.skillRequired) {
    return {
      success: false,
      reason: 'skill_too_low',
      required: repair.skillRequired,
    };
  }
  
  // Check materials
  for (const [mat, amount] of Object.entries(repair.materials)) {
    if (!availableMaterials[mat] || availableMaterials[mat] < amount) {
      return {
        success: false,
        reason: 'missing_materials',
        missing: mat,
        required: amount,
      };
    }
  }
  
  // Check tools (only in gun nut mode with tool requirement)
  if (getWeaponSettings().gunNutSettings.requireToolsForRepair) {
    for (const tool of repair.tools) {
      if (!availableTools.includes(tool)) {
        return {
          success: false,
          reason: 'missing_tool',
          tool,
        };
      }
    }
  }
  
  // Calculate new condition
  const newCondition = Math.min(repair.maxCondition, currentCondition + repair.conditionRestore);
  
  return {
    success: true,
    newCondition,
    repairTime: repair.repairTime,
    materialsConsumed: repair.materials,
  };
}

/**
 * Perform a quick field repair on a weapon (no materials/tools needed)
 */
export function fieldCleanWeapon(weapon: GunNutWeapon): RepairResult {
  if (weapon.destroyed) {
    return { success: false, reason: 'weapon_destroyed' };
  }
  
  const maxRestore = 60;
  const restoreAmount = 10;
  
  weapon.condition = Math.min(maxRestore, weapon.condition + restoreAmount);
  
  // Also clean maintenance factors
  if (weapon.maintenance) {
    weapon.maintenance.foulingLevel = Math.max(0, weapon.maintenance.foulingLevel - 0.2);
    weapon.maintenance.carbonBuildup = Math.max(0, weapon.maintenance.carbonBuildup - 0.1);
    weapon.maintenance.roundsSinceClean = 0;
    weapon.maintenance.lastCleaned = Date.now();
  }
  
  return {
    success: true,
    newCondition: weapon.condition,
    repairTime: 5,
  };
}

/**
 * Full weapon service (at gunsmith)
 */
export function fullServiceWeapon(weapon: GunNutWeapon, quality: 'basic' | 'standard' | 'professional' = 'standard'): RepairResult {
  const services: Record<string, { restore: number; cost: number; time: number; canRestoreDestroyed?: boolean }> = {
    basic: { restore: 70, cost: 50, time: 15 },
    standard: { restore: 85, cost: 150, time: 30 },
    professional: { restore: 100, cost: 400, time: 120, canRestoreDestroyed: true },
  };
  
  const service = services[quality];
  
  if (weapon.destroyed && !service.canRestoreDestroyed) {
    return { success: false, reason: 'weapon_destroyed' };
  }
  
  weapon.condition = service.restore;
  weapon.destroyed = false;
  
  // Full maintenance reset
  if (weapon.maintenance) {
    weapon.maintenance.foulingLevel = 0;
    weapon.maintenance.carbonBuildup = 0;
    weapon.maintenance.lubeLevel = 1.0;
    weapon.maintenance.rustLevel = Math.max(0, weapon.maintenance.rustLevel - 0.5);
    weapon.maintenance.roundsSinceClean = 0;
    weapon.maintenance.lastCleaned = Date.now();
    weapon.maintenance.lastFullService = Date.now();
  }
  
  // Restore core parts
  if (weapon.coreParts) {
    for (const part of Object.values(weapon.coreParts)) {
      if (part) {
        part.condition = Math.min(part.maxCondition, part.condition + service.restore - weapon.condition);
      }
    }
  }
  
  return {
    success: true,
    newCondition: weapon.condition,
    repairTime: service.time,
  };
}

// ============= ATTACHMENT UNLOCK SYSTEM =============

export interface LootSource {
  id: string;
  name: string;
  description: string;
  attachmentDrops: { 
    attachmentId: string; 
    slot: string;
    dropChance: number; // 0-100
  }[];
  materialDrops: {
    materialId: string;
    dropChance: number;
    minQuantity: number;
    maxQuantity: number;
  }[];
}

export const LOOT_SOURCES: LootSource[] = [
  {
    id: 'military_crate',
    name: 'Military Supply Crate',
    description: 'Standard military equipment cache',
    attachmentDrops: [
      { attachmentId: 'flash_hider', slot: 'muzzle', dropChance: 25 },
      { attachmentId: 'compensator', slot: 'muzzle', dropChance: 15 },
      { attachmentId: 'red_dot', slot: 'optic', dropChance: 20 },
      { attachmentId: 'foregrip_vertical', slot: 'tactical_rail_bottom', dropChance: 20 },
      { attachmentId: 'extended_mag', slot: 'magazine', dropChance: 15 },
    ],
    materialDrops: [
      { materialId: 'steel_scrap', dropChance: 60, minQuantity: 2, maxQuantity: 5 },
      { materialId: 'polymer_block', dropChance: 40, minQuantity: 1, maxQuantity: 3 },
      { materialId: 'spring_steel', dropChance: 30, minQuantity: 1, maxQuantity: 2 },
    ],
  },
  {
    id: 'armory_locker',
    name: 'Armory Locker',
    description: 'Secured weapon storage facility',
    attachmentDrops: [
      { attachmentId: 'suppressor_small', slot: 'muzzle', dropChance: 15 },
      { attachmentId: 'muzzle_brake', slot: 'muzzle', dropChance: 20 },
      { attachmentId: 'acog_4x', slot: 'optic', dropChance: 12 },
      { attachmentId: 'precision_stock', slot: 'stock', dropChance: 10 },
    ],
    materialDrops: [
      { materialId: 'gas_block', dropChance: 50, minQuantity: 1, maxQuantity: 2 },
      { materialId: 'aluminum_scrap', dropChance: 40, minQuantity: 1, maxQuantity: 4 },
      { materialId: 'threading_die', dropChance: 25, minQuantity: 1, maxQuantity: 1 },
    ],
  },
  {
    id: 'abandoned_workshop',
    name: 'Abandoned Workshop',
    description: 'Old gunsmith workshop with scattered parts',
    attachmentDrops: [
      { attachmentId: 'ergonomic_grip', slot: 'grip', dropChance: 30 },
      { attachmentId: 'rubberized_grip', slot: 'grip', dropChance: 25 },
      { attachmentId: 'collapsible_stock', slot: 'stock', dropChance: 15 },
    ],
    materialDrops: [
      { materialId: 'steel_scrap', dropChance: 70, minQuantity: 3, maxQuantity: 8 },
      { materialId: 'rubber_grip', dropChance: 50, minQuantity: 2, maxQuantity: 5 },
      { materialId: 'spring_steel', dropChance: 45, minQuantity: 2, maxQuantity: 4 },
      { materialId: 'gun_oil', dropChance: 60, minQuantity: 1, maxQuantity: 2 },
    ],
  },
  {
    id: 'defeated_enemy',
    name: 'Enemy Combatant',
    description: 'Loot from defeated enemy',
    attachmentDrops: [
      { attachmentId: 'flash_hider', slot: 'muzzle', dropChance: 10 },
      { attachmentId: 'red_dot', slot: 'optic', dropChance: 8 },
      { attachmentId: 'standard_grip', slot: 'grip', dropChance: 15 },
    ],
    materialDrops: [
      { materialId: 'steel_scrap', dropChance: 50, minQuantity: 1, maxQuantity: 3 },
      { materialId: 'polymer_block', dropChance: 30, minQuantity: 1, maxQuantity: 2 },
    ],
  },
];

// Attachment recipes for the unlock system
export const ATTACHMENT_CRAFT_RECIPES: Record<string, { materials: Record<string, number>; successRate: number }> = {
  flash_hider: { materials: { steel_tube: 1 }, successRate: 95 },
  compensator: { materials: { steel_tube: 1, steel_scrap: 1 }, successRate: 85 },
  muzzle_brake: { materials: { steel_tube: 1, steel_plate: 1 }, successRate: 80 },
  suppressor_small: { materials: { aluminum_scrap: 3, rubber_grip: 2, steel_tube: 1 }, successRate: 70 },
  suppressor_large: { materials: { aluminum_scrap: 5, rubber_grip: 3, steel_tube: 2 }, successRate: 60 },
  red_dot: { materials: { aluminum_scrap: 2, steel_scrap: 1 }, successRate: 75 },
  holographic: { materials: { aluminum_scrap: 3, steel_scrap: 2 }, successRate: 70 },
  acog_4x: { materials: { aluminum_scrap: 2, gas_block: 1 }, successRate: 65 },
  sniper_scope: { materials: { aluminum_scrap: 4, gas_block: 2 }, successRate: 50 },
  standard_grip: { materials: { polymer_block: 2 }, successRate: 98 },
  ergonomic_grip: { materials: { polymer_block: 3, rubber_grip: 2 }, successRate: 90 },
  rubberized_grip: { materials: { rubber_grip: 4 }, successRate: 95 },
  fixed_stock: { materials: { polymer_block: 4, steel_scrap: 2 }, successRate: 85 },
  collapsible_stock: { materials: { polymer_block: 3, steel_scrap: 3, spring_steel: 2 }, successRate: 75 },
  folding_stock: { materials: { polymer_block: 2, steel_scrap: 4, gas_block: 1 }, successRate: 75 },
  precision_stock: { materials: { aluminum_scrap: 3, polymer_block: 2 }, successRate: 60 },
  extended_mag: { materials: { steel_scrap: 3, spring_steel: 2 }, successRate: 85 },
  drum_mag: { materials: { steel_scrap: 6, spring_steel: 4, gas_block: 1 }, successRate: 65 },
  foregrip_vertical: { materials: { polymer_block: 3, steel_scrap: 1 }, successRate: 90 },
  foregrip_angled: { materials: { polymer_block: 4, aluminum_scrap: 1 }, successRate: 85 },
  bipod: { materials: { aluminum_scrap: 4, spring_steel: 2, steel_scrap: 2 }, successRate: 75 },
  flashlight: { materials: { aluminum_scrap: 2 }, successRate: 90 },
  laser_red: { materials: { aluminum_scrap: 2, steel_scrap: 1 }, successRate: 75 },
  laser_green: { materials: { aluminum_scrap: 3, steel_scrap: 1 }, successRate: 70 },
};

/**
 * Check if player can craft an attachment
 */
export function canCraftAttachment(
  attachmentId: string,
  availableMaterials: Record<string, number>
): { canCraft: boolean; missing: { material: string; needed: number; have: number }[] } {
  const recipe = ATTACHMENT_CRAFT_RECIPES[attachmentId];
  if (!recipe) {
    return { canCraft: false, missing: [] };
  }

  const missing: { material: string; needed: number; have: number }[] = [];
  
  for (const [mat, amount] of Object.entries(recipe.materials)) {
    const have = availableMaterials[mat] || 0;
    if (have < amount) {
      missing.push({ material: mat, needed: amount, have });
    }
  }

  return { canCraft: missing.length === 0, missing };
}

/**
 * Attempt to craft an attachment
 */
export function craftAttachment(
  attachmentId: string,
  availableMaterials: Record<string, number>
): { success: boolean; materialsConsumed?: Record<string, number>; failReason?: string } {
  const { canCraft } = canCraftAttachment(attachmentId, availableMaterials);
  if (!canCraft) {
    return { success: false, failReason: 'missing_materials' };
  }

  const recipe = ATTACHMENT_CRAFT_RECIPES[attachmentId];
  
  // Consume materials
  const consumed: Record<string, number> = {};
  for (const [mat, amount] of Object.entries(recipe.materials)) {
    availableMaterials[mat] = (availableMaterials[mat] || 0) - amount;
    consumed[mat] = amount;
  }

  // Check success rate
  const roll = Math.random() * 100;
  if (roll > recipe.successRate) {
    return { success: false, materialsConsumed: consumed, failReason: 'craft_failed' };
  }

  return { success: true, materialsConsumed: consumed };
}

/**
 * Generate loot from a source
 */
export function generateLoot(sourceId: string): {
  attachments: { id: string; slot: string }[];
  materials: { id: string; quantity: number }[];
} {
  const source = LOOT_SOURCES.find(s => s.id === sourceId);
  if (!source) {
    return { attachments: [], materials: [] };
  }

  const attachments: { id: string; slot: string }[] = [];
  const materials: { id: string; quantity: number }[] = [];

  // Roll for attachments
  source.attachmentDrops.forEach(drop => {
    if (Math.random() * 100 < drop.dropChance) {
      attachments.push({ id: drop.attachmentId, slot: drop.slot });
    }
  });

  // Roll for materials
  source.materialDrops.forEach(drop => {
    if (Math.random() * 100 < drop.dropChance) {
      const quantity = Math.floor(
        Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
      );
      materials.push({ id: drop.materialId, quantity });
    }
  });

  return { attachments, materials };
}

/**
 * Get attachment unlock key
 */
export function getAttachmentKey(attachmentId: string, slot: string): string {
  return `${slot}:${attachmentId}`;
}

export default {
  MATERIALS,
  TOOLS,
  CRAFTING_RECIPES,
  REPAIR_RECIPES,
  LOOT_SOURCES,
  ATTACHMENT_CRAFT_RECIPES,
  attemptCraft,
  attemptRepair,
  fieldCleanWeapon,
  fullServiceWeapon,
  canCraftAttachment,
  craftAttachment,
  generateLoot,
  getAttachmentKey,
};
