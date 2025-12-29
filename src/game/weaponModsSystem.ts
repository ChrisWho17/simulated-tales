// ============================================================================
// WEAPON & MODS SYSTEM
// Complete weapon generation with stats, mods, and compatibility
// ============================================================================

// ============================================================================
// WEAPON TYPES
// ============================================================================

export const WEAPON_TYPES = {
  PISTOL: 'pistol',
  REVOLVER: 'revolver',
  SMG: 'smg',
  RIFLE: 'rifle',
  ASSAULT_RIFLE: 'assaultRifle',
  SHOTGUN: 'shotgun',
  SNIPER: 'sniper',
  LMG: 'lmg',
  MELEE: 'melee',
  KNIFE: 'knife',
} as const;

export type WeaponType = typeof WEAPON_TYPES[keyof typeof WEAPON_TYPES];

// ============================================================================
// BASE WEAPON STATS BY TYPE
// ============================================================================

export const BASE_WEAPON_STATS: Record<string, {
  damage: number;
  accuracy: number;
  fireRate: number;
  range: number;
  stability: number;
  handling: number;
}> = {
  pistol: { damage: 35, accuracy: 65, fireRate: 70, range: 30, stability: 60, handling: 85 },
  revolver: { damage: 55, accuracy: 70, fireRate: 35, range: 35, stability: 45, handling: 70 },
  smg: { damage: 25, accuracy: 50, fireRate: 90, range: 25, stability: 40, handling: 75 },
  rifle: { damage: 65, accuracy: 80, fireRate: 40, range: 70, stability: 55, handling: 50 },
  assaultRifle: { damage: 45, accuracy: 70, fireRate: 75, range: 55, stability: 50, handling: 55 },
  shotgun: { damage: 85, accuracy: 40, fireRate: 25, range: 15, stability: 35, handling: 45 },
  sniper: { damage: 90, accuracy: 95, fireRate: 15, range: 95, stability: 60, handling: 30 },
  lmg: { damage: 50, accuracy: 45, fireRate: 85, range: 50, stability: 30, handling: 25 },
  melee: { damage: 40, accuracy: 90, fireRate: 50, range: 5, stability: 80, handling: 90 },
  knife: { damage: 25, accuracy: 95, fireRate: 80, range: 5, stability: 90, handling: 95 },
};

// ============================================================================
// COMPATIBLE MOD SLOTS BY WEAPON TYPE
// ============================================================================

export const COMPATIBLE_SLOTS_BY_TYPE: Record<string, string[]> = {
  pistol: ['optic', 'muzzle', 'grip', 'magazine'],
  revolver: ['optic', 'grip'],
  smg: ['optic', 'muzzle', 'grip', 'magazine', 'stock'],
  rifle: ['optic', 'muzzle', 'barrel', 'grip', 'magazine', 'stock'],
  assaultRifle: ['optic', 'muzzle', 'barrel', 'grip', 'magazine', 'stock', 'underbarrel'],
  shotgun: ['optic', 'muzzle', 'barrel', 'stock'],
  sniper: ['optic', 'muzzle', 'barrel', 'grip', 'magazine', 'stock'],
  lmg: ['optic', 'muzzle', 'barrel', 'grip', 'stock'],
  melee: [],
  knife: [],
};

// ============================================================================
// DEFAULT CALIBERS BY WEAPON TYPE
// ============================================================================

export const DEFAULT_CALIBERS: Record<string, string> = {
  pistol: '9mm',
  revolver: '.357 Magnum',
  smg: '9mm',
  rifle: '7.62x51mm',
  assaultRifle: '5.56x45mm',
  shotgun: '12 Gauge',
  sniper: '.308 Winchester',
  lmg: '7.62x51mm',
  melee: 'N/A',
  knife: 'N/A',
};

// ============================================================================
// EQUIP SLOTS BY WEAPON TYPE
// ============================================================================

export const EQUIP_SLOTS_BY_WEAPON_TYPE: Record<string, string[]> = {
  pistol: ['primaryWeapon', 'sidearm'],
  revolver: ['primaryWeapon', 'sidearm'],
  smg: ['primaryWeapon', 'sidearm'],
  rifle: ['primaryWeapon'],
  assaultRifle: ['primaryWeapon'],
  shotgun: ['primaryWeapon'],
  sniper: ['primaryWeapon'],
  lmg: ['primaryWeapon'],
  melee: ['primaryWeapon', 'sidearm'],
  knife: ['sidearm'],
};

// ============================================================================
// WEAPON MOD INTERFACE
// ============================================================================

export interface WeaponMod {
  id: string;
  name: string;
  slot: string;
  description?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight?: number;
  value?: number;
  statModifiers: {
    damage?: number;
    accuracy?: number;
    fireRate?: number;
    range?: number;
    stability?: number;
    handling?: number;
  };
  compatibleTypes?: string[]; // If empty, compatible with all
}

// ============================================================================
// COMPLETE MODS DATABASE
// ============================================================================

export const ALL_MODS: WeaponMod[] = [
  // ========== OPTICS ==========
  {
    id: 'optic-reflex',
    name: 'Reflex Sight',
    slot: 'optic',
    description: 'Fast-acquisition red dot sight',
    rarity: 'common',
    weight: 0.2,
    value: 75,
    statModifiers: { accuracy: 5, handling: -2 },
  },
  {
    id: 'optic-holographic',
    name: 'Holographic Sight',
    slot: 'optic',
    description: 'Quick target acquisition with wide field of view',
    rarity: 'uncommon',
    weight: 0.3,
    value: 150,
    statModifiers: { accuracy: 8, handling: -3 },
  },
  {
    id: 'optic-acog',
    name: 'ACOG 4x Scope',
    slot: 'optic',
    description: 'Medium-range magnified optic',
    rarity: 'uncommon',
    weight: 0.4,
    value: 250,
    statModifiers: { accuracy: 15, range: 10, handling: -8 },
    compatibleTypes: ['rifle', 'assaultRifle', 'sniper', 'lmg'],
  },
  {
    id: 'optic-sniper',
    name: 'Variable 6-24x Scope',
    slot: 'optic',
    description: 'Long-range precision scope with variable zoom',
    rarity: 'rare',
    weight: 0.6,
    value: 400,
    statModifiers: { accuracy: 25, range: 20, handling: -15 },
    compatibleTypes: ['sniper', 'rifle'],
  },
  {
    id: 'optic-thermal',
    name: 'Thermal Scope',
    slot: 'optic',
    description: 'Heat signature detection for low-visibility',
    rarity: 'epic',
    weight: 0.8,
    value: 800,
    statModifiers: { accuracy: 20, range: 15, handling: -10 },
  },
  {
    id: 'optic-irons',
    name: 'Tritium Night Sights',
    slot: 'optic',
    description: 'Glow-in-dark iron sights for low light',
    rarity: 'common',
    weight: 0.05,
    value: 50,
    statModifiers: { accuracy: 3 },
  },

  // ========== MUZZLE ==========
  {
    id: 'muzzle-suppressor',
    name: 'Suppressor',
    slot: 'muzzle',
    description: 'Reduces noise and muzzle flash',
    rarity: 'uncommon',
    weight: 0.4,
    value: 200,
    statModifiers: { accuracy: 5, range: -5, handling: -5 },
  },
  {
    id: 'muzzle-compensator',
    name: 'Compensator',
    slot: 'muzzle',
    description: 'Reduces vertical recoil',
    rarity: 'common',
    weight: 0.15,
    value: 80,
    statModifiers: { stability: 10, accuracy: -3 },
  },
  {
    id: 'muzzle-brake',
    name: 'Muzzle Brake',
    slot: 'muzzle',
    description: 'Reduces felt recoil significantly',
    rarity: 'uncommon',
    weight: 0.2,
    value: 120,
    statModifiers: { stability: 15, handling: -5 },
  },
  {
    id: 'muzzle-flash-hider',
    name: 'Flash Hider',
    slot: 'muzzle',
    description: 'Eliminates muzzle flash',
    rarity: 'common',
    weight: 0.1,
    value: 45,
    statModifiers: { accuracy: 2 },
  },
  {
    id: 'muzzle-choke',
    name: 'Full Choke',
    slot: 'muzzle',
    description: 'Tightens shotgun spread',
    rarity: 'uncommon',
    weight: 0.15,
    value: 90,
    statModifiers: { accuracy: 15, range: 5 },
    compatibleTypes: ['shotgun'],
  },
  {
    id: 'muzzle-extended',
    name: 'Extended Barrel',
    slot: 'muzzle',
    description: 'Increases muzzle velocity',
    rarity: 'rare',
    weight: 0.3,
    value: 180,
    statModifiers: { damage: 5, range: 10, handling: -8 },
  },

  // ========== BARREL ==========
  {
    id: 'barrel-heavy',
    name: 'Heavy Barrel',
    slot: 'barrel',
    description: 'Increased accuracy at cost of weight',
    rarity: 'uncommon',
    weight: 0.5,
    value: 150,
    statModifiers: { accuracy: 10, stability: 5, handling: -10 },
  },
  {
    id: 'barrel-lightweight',
    name: 'Lightweight Barrel',
    slot: 'barrel',
    description: 'Carbon fiber barrel for fast handling',
    rarity: 'rare',
    weight: -0.3,
    value: 280,
    statModifiers: { handling: 12, accuracy: -5 },
  },
  {
    id: 'barrel-match',
    name: 'Match-Grade Barrel',
    slot: 'barrel',
    description: 'Precision-machined for optimal accuracy',
    rarity: 'epic',
    weight: 0.2,
    value: 450,
    statModifiers: { accuracy: 15, range: 8, damage: 3 },
  },
  {
    id: 'barrel-chrome',
    name: 'Chrome-Lined Barrel',
    slot: 'barrel',
    description: 'Increased durability and longevity',
    rarity: 'uncommon',
    weight: 0.1,
    value: 120,
    statModifiers: { accuracy: 3, stability: 3 },
  },

  // ========== GRIP ==========
  {
    id: 'grip-rubberized',
    name: 'Rubberized Grip',
    slot: 'grip',
    description: 'Better control in wet conditions',
    rarity: 'common',
    weight: 0.05,
    value: 35,
    statModifiers: { stability: 5, handling: 3 },
  },
  {
    id: 'grip-stippled',
    name: 'Stippled Grip',
    slot: 'grip',
    description: 'Aggressive texture for firm hold',
    rarity: 'uncommon',
    weight: 0.05,
    value: 60,
    statModifiers: { stability: 8, handling: 5 },
  },
  {
    id: 'grip-ergonomic',
    name: 'Ergonomic Grip',
    slot: 'grip',
    description: 'Contoured for natural hand position',
    rarity: 'uncommon',
    weight: 0.08,
    value: 85,
    statModifiers: { handling: 10, stability: 3 },
  },
  {
    id: 'grip-vertical',
    name: 'Vertical Foregrip',
    slot: 'grip',
    description: 'Improved control during sustained fire',
    rarity: 'common',
    weight: 0.15,
    value: 55,
    statModifiers: { stability: 12, handling: -3 },
    compatibleTypes: ['rifle', 'assaultRifle', 'smg', 'lmg'],
  },
  {
    id: 'grip-angled',
    name: 'Angled Foregrip',
    slot: 'grip',
    description: 'Quick transitions and handling',
    rarity: 'uncommon',
    weight: 0.12,
    value: 75,
    statModifiers: { handling: 8, stability: 5 },
    compatibleTypes: ['rifle', 'assaultRifle', 'smg'],
  },
  {
    id: 'grip-skeleton',
    name: 'Skeleton Grip',
    slot: 'grip',
    description: 'Lightweight with reduced material',
    rarity: 'rare',
    weight: -0.05,
    value: 110,
    statModifiers: { handling: 6 },
  },

  // ========== MAGAZINE ==========
  {
    id: 'mag-extended',
    name: 'Extended Magazine',
    slot: 'magazine',
    description: '+50% magazine capacity',
    rarity: 'common',
    weight: 0.15,
    value: 45,
    statModifiers: { handling: -5 },
  },
  {
    id: 'mag-drum',
    name: 'Drum Magazine',
    slot: 'magazine',
    description: 'High-capacity drum magazine',
    rarity: 'uncommon',
    weight: 0.4,
    value: 120,
    statModifiers: { handling: -12, stability: -5 },
    compatibleTypes: ['rifle', 'assaultRifle', 'smg', 'lmg'],
  },
  {
    id: 'mag-quick',
    name: 'Quick-Release Magazine',
    slot: 'magazine',
    description: 'Faster reload speed',
    rarity: 'uncommon',
    weight: 0.1,
    value: 80,
    statModifiers: { handling: 8 },
  },
  {
    id: 'mag-coupled',
    name: 'Coupled Magazines',
    slot: 'magazine',
    description: 'Two magazines taped together for fast swap',
    rarity: 'common',
    weight: 0.2,
    value: 30,
    statModifiers: { handling: 3, stability: -3 },
  },

  // ========== STOCK ==========
  {
    id: 'stock-folding',
    name: 'Folding Stock',
    slot: 'stock',
    description: 'Compact storage, quick deployment',
    rarity: 'common',
    weight: -0.1,
    value: 65,
    statModifiers: { handling: 8, stability: -5 },
  },
  {
    id: 'stock-tactical',
    name: 'Tactical Stock',
    slot: 'stock',
    description: 'Adjustable length of pull',
    rarity: 'uncommon',
    weight: 0.2,
    value: 110,
    statModifiers: { stability: 8, handling: 3 },
  },
  {
    id: 'stock-precision',
    name: 'Precision Stock',
    slot: 'stock',
    description: 'Heavy stock for maximum stability',
    rarity: 'rare',
    weight: 0.4,
    value: 200,
    statModifiers: { stability: 15, accuracy: 5, handling: -8 },
    compatibleTypes: ['sniper', 'rifle'],
  },
  {
    id: 'stock-skeleton',
    name: 'Skeleton Stock',
    slot: 'stock',
    description: 'Lightweight skeletonized design',
    rarity: 'uncommon',
    weight: -0.15,
    value: 90,
    statModifiers: { handling: 10, stability: -3 },
  },
  {
    id: 'stock-buffer',
    name: 'Recoil Buffer Stock',
    slot: 'stock',
    description: 'Hydraulic buffer reduces felt recoil',
    rarity: 'rare',
    weight: 0.25,
    value: 180,
    statModifiers: { stability: 12, fireRate: 3 },
  },

  // ========== UNDERBARREL ==========
  {
    id: 'underbarrel-laser',
    name: 'Laser Sight',
    slot: 'underbarrel',
    description: 'Visible laser for quick target acquisition',
    rarity: 'common',
    weight: 0.1,
    value: 60,
    statModifiers: { accuracy: 5 },
  },
  {
    id: 'underbarrel-ir-laser',
    name: 'IR Laser Module',
    slot: 'underbarrel',
    description: 'Invisible laser for NVG use',
    rarity: 'rare',
    weight: 0.15,
    value: 250,
    statModifiers: { accuracy: 8 },
  },
  {
    id: 'underbarrel-flashlight',
    name: 'Tactical Flashlight',
    slot: 'underbarrel',
    description: 'High-lumen weapon light',
    rarity: 'common',
    weight: 0.2,
    value: 85,
    statModifiers: { handling: -2 },
  },
  {
    id: 'underbarrel-combo',
    name: 'Laser/Light Combo',
    slot: 'underbarrel',
    description: 'Integrated laser and flashlight',
    rarity: 'uncommon',
    weight: 0.25,
    value: 180,
    statModifiers: { accuracy: 5, handling: -3 },
  },
  {
    id: 'underbarrel-bipod',
    name: 'Bipod',
    slot: 'underbarrel',
    description: 'Deployable bipod for prone shooting',
    rarity: 'uncommon',
    weight: 0.35,
    value: 120,
    statModifiers: { stability: 20, accuracy: 10, handling: -15 },
    compatibleTypes: ['sniper', 'rifle', 'lmg'],
  },

  // ========== SPECIAL ==========
  {
    id: 'special-match-trigger',
    name: 'Match Trigger',
    slot: 'special',
    description: 'Precision trigger with reduced pull weight',
    rarity: 'rare',
    weight: 0.02,
    value: 200,
    statModifiers: { accuracy: 8, fireRate: 5 },
  },
  {
    id: 'special-bolt-carrier',
    name: 'Enhanced Bolt Carrier',
    slot: 'special',
    description: 'Lightweight titanium bolt carrier',
    rarity: 'epic',
    weight: -0.1,
    value: 350,
    statModifiers: { fireRate: 8, handling: 3 },
    compatibleTypes: ['rifle', 'assaultRifle'],
  },
  {
    id: 'special-recoil-spring',
    name: 'Tuned Recoil Spring',
    slot: 'special',
    description: 'Custom-tuned spring for smoother cycling',
    rarity: 'uncommon',
    weight: 0.02,
    value: 80,
    statModifiers: { stability: 5, fireRate: 3 },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all mods compatible with a weapon
 */
export function getCompatibleModsArray(weapon: {
  weaponType?: string;
  type?: string;
  compatibleSlots?: string[];
}): WeaponMod[] {
  const weaponType = (weapon.weaponType || weapon.type || 'rifle').toLowerCase();
  const compatibleSlots = weapon.compatibleSlots || COMPATIBLE_SLOTS_BY_TYPE[weaponType] || [];

  return ALL_MODS.filter(mod => {
    // Check if mod slot is compatible with weapon
    if (!compatibleSlots.includes(mod.slot)) {
      return false;
    }

    // Check if mod has type restrictions
    if (mod.compatibleTypes && mod.compatibleTypes.length > 0) {
      return mod.compatibleTypes.includes(weaponType);
    }

    return true;
  });
}

/**
 * Get mods for a specific slot
 */
export function getModsForSlot(
  weapon: { weaponType?: string; type?: string; compatibleSlots?: string[] },
  slotId: string
): WeaponMod[] {
  return getCompatibleModsArray(weapon).filter(mod => mod.slot === slotId);
}

/**
 * Determine weapon type from various item properties
 */
export function determineWeaponType(item: {
  weaponType?: string;
  type?: string;
  name?: string;
}): string {
  // Check explicit weaponType first
  if (item.weaponType) {
    const wt = item.weaponType.toLowerCase();
    if (BASE_WEAPON_STATS[wt]) return wt;
  }

  // Check type field
  if (item.type) {
    const t = item.type.toLowerCase();
    if (BASE_WEAPON_STATS[t]) return t;
    
    // Map common type names
    if (t.includes('pistol') || t.includes('handgun')) return 'pistol';
    if (t.includes('revolver')) return 'revolver';
    if (t.includes('smg') || t.includes('submachine')) return 'smg';
    if (t.includes('assault') || t.includes('ar')) return 'assaultRifle';
    if (t.includes('sniper') || t.includes('marksman')) return 'sniper';
    if (t.includes('shotgun')) return 'shotgun';
    if (t.includes('lmg') || t.includes('machine gun')) return 'lmg';
    if (t.includes('rifle')) return 'rifle';
    if (t.includes('knife') || t.includes('blade')) return 'knife';
    if (t.includes('melee')) return 'melee';
  }

  // Try to infer from name
  if (item.name) {
    const name = item.name.toLowerCase();
    if (name.includes('pistol') || name.includes('glock') || name.includes('beretta') || name.includes('1911')) return 'pistol';
    if (name.includes('revolver') || name.includes('magnum')) return 'revolver';
    if (name.includes('mp5') || name.includes('uzi') || name.includes('smg')) return 'smg';
    if (name.includes('m4') || name.includes('ar-15') || name.includes('ak')) return 'assaultRifle';
    if (name.includes('sniper') || name.includes('awp') || name.includes('bolt')) return 'sniper';
    if (name.includes('shotgun') || name.includes('mossberg') || name.includes('remington')) return 'shotgun';
    if (name.includes('rifle')) return 'rifle';
  }

  // Default to rifle
  return 'rifle';
}

// ============================================================================
// WEAPON GENERATORS
// ============================================================================

interface WeaponGeneratorOptions {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  weaponType?: string;
  type?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  caliber?: string;
  weight?: number;
  value?: number;
  stats?: Partial<{
    damage: number;
    accuracy: number;
    fireRate: number;
    range: number;
    stability: number;
    handling: number;
  }>;
  mods?: Record<string, WeaponMod>;
}

/**
 * Create a fully-populated weapon with all required fields
 */
export function createWeapon(options: WeaponGeneratorOptions) {
  const weaponType = determineWeaponType(options);
  const baseStats = BASE_WEAPON_STATS[weaponType] || BASE_WEAPON_STATS.rifle;

  // Apply rarity modifiers
  const rarityMultiplier = {
    common: 1,
    uncommon: 1.1,
    rare: 1.2,
    epic: 1.35,
    legendary: 1.5,
  }[options.rarity || 'common'];

  // Calculate stats with rarity bonus
  const stats = {
    damage: Math.round((options.stats?.damage ?? baseStats.damage) * rarityMultiplier),
    accuracy: Math.min(100, Math.round((options.stats?.accuracy ?? baseStats.accuracy) * rarityMultiplier)),
    fireRate: Math.min(100, Math.round((options.stats?.fireRate ?? baseStats.fireRate) * rarityMultiplier)),
    range: Math.min(100, Math.round((options.stats?.range ?? baseStats.range) * rarityMultiplier)),
    stability: Math.min(100, Math.round((options.stats?.stability ?? baseStats.stability) * rarityMultiplier)),
    handling: Math.min(100, Math.round((options.stats?.handling ?? baseStats.handling) * rarityMultiplier)),
  };

  // Get default values for this weapon type
  const defaultWeight = {
    pistol: 1.5, revolver: 1.8, smg: 3.5, rifle: 8, assaultRifle: 7,
    shotgun: 7.5, sniper: 10, lmg: 12, melee: 2, knife: 0.5,
  }[weaponType] || 5;

  const defaultValue = {
    common: 100, uncommon: 250, rare: 500, epic: 1000, legendary: 2500,
  }[options.rarity || 'common'];

  return {
    id: options.id,
    name: options.name,
    description: options.description || `A ${options.rarity || 'common'} ${weaponType}.`,
    category: 'weapons',
    type: options.type || weaponType,
    weaponType: weaponType,
    icon: options.icon || '🔫',
    weight: options.weight ?? defaultWeight,
    value: options.value ?? defaultValue,
    stackable: false,
    consumable: false,
    rarity: options.rarity || 'common',
    caliber: options.caliber || DEFAULT_CALIBERS[weaponType] || '9mm',
    stats,
    equipSlots: EQUIP_SLOTS_BY_WEAPON_TYPE[weaponType] || ['primaryWeapon', 'sidearm'],
    compatibleSlots: COMPATIBLE_SLOTS_BY_TYPE[weaponType] || ['optic', 'muzzle', 'grip', 'magazine'],
    mods: options.mods || {},
    condition: {
      barrelWear: 0,
      carbonBuildup: 0,
      springFatigue: 0,
      riflingWear: 0,
      roundsFired: 0,
      lastMaintenance: Date.now(),
    },
  };
}

// Convenience functions for specific weapon types
export const createPistol = (opts: Omit<WeaponGeneratorOptions, 'weaponType'>) =>
  createWeapon({ ...opts, weaponType: 'pistol', icon: opts.icon || '🔫' });

export const createRifle = (opts: Omit<WeaponGeneratorOptions, 'weaponType'>) =>
  createWeapon({ ...opts, weaponType: 'rifle', icon: opts.icon || '🎯' });

export const createShotgun = (opts: Omit<WeaponGeneratorOptions, 'weaponType'>) =>
  createWeapon({ ...opts, weaponType: 'shotgun', icon: opts.icon || '💥' });

export const createSniper = (opts: Omit<WeaponGeneratorOptions, 'weaponType'>) =>
  createWeapon({ ...opts, weaponType: 'sniper', icon: opts.icon || '🎯' });

export const createSMG = (opts: Omit<WeaponGeneratorOptions, 'weaponType'>) =>
  createWeapon({ ...opts, weaponType: 'smg', icon: opts.icon || '🔫' });

/**
 * Populate missing weapon data on an existing item
 */
export function populateWeaponData(item: Record<string, any>): Record<string, any> {
  if (item.category !== 'weapons') return item;

  const weaponType = determineWeaponType(item);
  const baseStats = BASE_WEAPON_STATS[weaponType] || BASE_WEAPON_STATS.rifle;

  const populated: Record<string, any> = { ...item };

  // Add stats if missing or all zeros
  if (!populated.stats || Object.values(populated.stats).every((v: any) => v === 0 || v === undefined)) {
    populated.stats = { ...baseStats };
  }

  // Add compatible slots if missing
  if (!populated.compatibleSlots || populated.compatibleSlots.length === 0) {
    populated.compatibleSlots = COMPATIBLE_SLOTS_BY_TYPE[weaponType] || ['optic', 'muzzle', 'grip', 'magazine'];
  }

  // Add equip slots if missing
  if (!populated.equipSlots || populated.equipSlots.length === 0) {
    populated.equipSlots = EQUIP_SLOTS_BY_WEAPON_TYPE[weaponType] || ['primaryWeapon', 'sidearm'];
  }

  // Add caliber if missing
  if (!populated.caliber) {
    populated.caliber = DEFAULT_CALIBERS[weaponType] || '9mm';
  }

  // Add weaponType if missing
  if (!populated.weaponType) {
    populated.weaponType = weaponType;
  }

  // Initialize condition if missing
  if (!populated.condition) {
    populated.condition = {
      barrelWear: 0,
      carbonBuildup: 0,
      springFatigue: 0,
      riflingWear: 0,
      roundsFired: 0,
      lastMaintenance: Date.now(),
    };
  }

  // Initialize mods if missing
  if (!populated.mods) {
    populated.mods = {};
  }

  console.log(`[WEAPON] Populated "${item.name}" as ${weaponType}:`, populated.stats);

  return populated;
}
