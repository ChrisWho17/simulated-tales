/**
 * Gun Nut Mode - Complete Weapon Condition & Customization System
 * Based on Far Cry 2 (simple) and Escape from Tarkov (detailed) weapon systems.
 * 
 * Two Modes:
 * - STANDARD MODE: Simple overall durability (Far Cry style)
 * - GUN NUT MODE: Full part-by-part detail (Tarkov style)
 */

import { WeaponType, Weapon } from './weaponWearSystem';

// ============= SETTINGS =============

export interface WeaponSystemSettings {
  // Master toggles
  equipmentWearEnabled: boolean;
  gunNutModeEnabled: boolean;
  
  // Wear settings (when equipmentWearEnabled = true)
  wearSettings: {
    degradationRate: number;        // Multiplier (0.5 = half speed, 2.0 = double)
    jamChanceMultiplier: number;    // How often jams happen
    repairCostMultiplier: number;   // Economy balance
    environmentalWear: boolean;     // Rain, mud, water damage
    visualWearEffects: boolean;     // Show rust/dirt textures
  };
  
  // Gun Nut settings (when gunNutModeEnabled = true)
  gunNutSettings: {
    partDegradation: boolean;       // Individual parts wear separately
    partBreakage: boolean;          // Parts can break completely
    requireToolsForRepair: boolean; // Need workbench/tools for repairs
    magazineTracking: boolean;      // Track individual magazine conditions
    barrelErosion: boolean;         // Barrel degrades based on rounds fired
    foulingSystem: boolean;         // Carbon buildup affects reliability
  };
}

export const DEFAULT_WEAPON_SETTINGS: WeaponSystemSettings = {
  equipmentWearEnabled: true,
  gunNutModeEnabled: false,
  
  wearSettings: {
    degradationRate: 1.0,
    jamChanceMultiplier: 1.0,
    repairCostMultiplier: 1.0,
    environmentalWear: true,
    visualWearEffects: true,
  },
  
  gunNutSettings: {
    partDegradation: true,
    partBreakage: true,
    requireToolsForRepair: true,
    magazineTracking: true,
    barrelErosion: true,
    foulingSystem: true,
  },
};

// Current settings (can be modified at runtime)
let currentSettings: WeaponSystemSettings = { ...DEFAULT_WEAPON_SETTINGS };

export function getWeaponSettings(): WeaponSystemSettings {
  return currentSettings;
}

export function setWeaponSettings(settings: Partial<WeaponSystemSettings>): void {
  currentSettings = { ...currentSettings, ...settings };
}

export function setGunNutMode(enabled: boolean): void {
  currentSettings.gunNutModeEnabled = enabled;
}

export function isGunNutMode(): boolean {
  return currentSettings.equipmentWearEnabled && currentSettings.gunNutModeEnabled;
}

// ============= DETAILED WEAPON STRUCTURE (Gun Nut Mode) =============

export interface GunNutMagazine {
  id: string;
  name: string;
  condition: number;
  maxCondition: number;
  capacity: number;
  currentAmmo: number;
  ammoType: string;
  material: 'aluminum' | 'steel' | 'polymer';
  weight: number;
  weightLoaded: number;
  
  // Magazine-specific condition factors
  springTension: number;        // Weak spring = feed issues
  followerCondition: number;
  feedLipsCondition: number;    // Damaged = double feeds, jams
  feedReliability: number;      // Calculated from above
  
  // Crafting/repair
  canCraft: boolean;
  repairCost: number;
}

export interface GunNutCoreParts {
  receiver: GunNutPart;
  barrel: GunNutBarrel;
  bolt: GunNutPart;
  gasSystem?: GunNutPart;
  trigger: GunNutPart;
  firingPin: GunNutPart;
  spring: GunNutPart;
}

export interface GunNutFurniture {
  stock?: GunNutPart;
  grip?: GunNutPart;
  handguard?: GunNutPart;
}

export interface GunNutPart {
  id: string;
  name: string;
  condition: number;
  maxCondition: number;
  material: string;
  weight: number;
  affects: string[];           // Stats this part influences
  compatibleWith: string[];    // Weapon platforms
  canCraft: boolean;
  craftingMaterials?: Record<string, number>;
  repairCost: number;
}

export interface GunNutBarrel extends GunNutPart {
  length: number;              // Inches
  profile: 'government' | 'mid' | 'rifle' | 'carbine' | 'heavy';
  rifling: 'polygonal' | 'conventional';
  twist: string;               // e.g., '1:7'
  roundsFired: number;
  maxRounds: number;
  erosionLevel: number;        // 0-1, derived from roundsFired/maxRounds
}

export interface GunNutMaintenance {
  totalRoundsFired: number;
  roundsSinceClean: number;
  lastCleaned: number | null;      // timestamp
  lastFullService: number | null;  // timestamp
  
  // Condition factors (0-1)
  foulingLevel: number;        // Affects reliability
  lubeLevel: number;           // Affects wear rate
  carbonBuildup: number;       // Affects cycling
  rustLevel: number;           // Affects everything
}

export interface GunNutWeapon extends Weapon {
  // Base weapon info
  baseWeapon: string;          // e.g., 'M4A1'
  manufacturer?: string;
  caliber: string;
  firingModes: ('semi' | 'burst' | 'auto')[];
  currentFiringMode: 'semi' | 'burst' | 'auto';
  
  // Detailed parts (Gun Nut only)
  coreParts?: GunNutCoreParts;
  furniture?: GunNutFurniture;
  magazine?: GunNutMagazine;
  maintenance?: GunNutMaintenance;
  
  // Calculated stats (derived from all parts + attachments)
  calculatedStats?: GunNutCalculatedStats;
}

export interface GunNutCalculatedStats {
  // Offensive
  damage: number;
  penetration: number;
  armorDamage: number;
  
  // Accuracy
  accuracy: number;             // MOA
  effectiveRange: number;       // meters
  muzzleVelocity: number;       // m/s
  
  // Handling
  ergonomics: number;
  aimSpeed: number;             // seconds to ADS
  hipfireSpread: number;        // MOA
  
  // Recoil
  verticalRecoil: number;
  horizontalRecoil: number;
  recoilPattern: 'standard' | 'left_bias' | 'right_bias';
  
  // Operation
  fireRate: number;             // RPM
  reloadSpeed: number;          // seconds
  checkChamberSpeed: number;
  
  // Reliability
  overallCondition: number;     // Weighted average
  jamChance: number;            // Per shot
  malfunctionTypes: string[];
  
  // Physical
  totalWeight: number;          // kg
  length: number;               // mm
  lengthFolded?: number;        // mm (if stock folds)
}

// ============= MALFUNCTION TYPES =============

export type MalfunctionType = 
  | 'failure_to_feed'
  | 'failure_to_eject'
  | 'failure_to_cycle'
  | 'light_strike'
  | 'short_stroke'
  | 'double_feed'
  | 'stovepipe'
  | 'barrel_failure';

export interface Malfunction {
  type: MalfunctionType;
  part: string;
  clearTime: number;
  catastrophic?: boolean;
  message: string;
}

// ============= PART DEGRADATION RATES =============

export const PART_DEGRADE_RATES: Record<string, number> = {
  receiver: 0.001,
  barrel: 0.001,
  bolt: 0.008,
  gasSystem: 0.005,
  trigger: 0.002,
  firingPin: 0.01,
  spring: 0.006,
};

export const PART_WEIGHTS: Record<string, number> = {
  receiver: 15,
  barrel: 20,
  bolt: 15,
  gasSystem: 10,
  trigger: 10,
  firingPin: 8,
  spring: 7,
  stock: 3,
  grip: 2,
  handguard: 3,
  magazine: 7,
};

// ============= CORE FUNCTIONS =============

/**
 * Calculate overall weapon condition from all parts
 */
export function calculateOverallCondition(weapon: GunNutWeapon): number {
  if (!weapon.coreParts || !currentSettings.gunNutModeEnabled) {
    return weapon.condition;
  }
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  // Core parts
  for (const [partName, weight] of Object.entries(PART_WEIGHTS)) {
    let condition = 100;
    
    if (weapon.coreParts[partName as keyof GunNutCoreParts]) {
      condition = weapon.coreParts[partName as keyof GunNutCoreParts]!.condition;
    } else if (weapon.furniture?.[partName as keyof GunNutFurniture]) {
      condition = weapon.furniture[partName as keyof GunNutFurniture]!.condition;
    } else if (partName === 'magazine' && weapon.magazine) {
      condition = (weapon.magazine.springTension + weapon.magazine.feedLipsCondition) / 2;
    } else {
      continue; // Skip parts that don't exist on this weapon
    }
    
    weightedSum += condition * weight;
    totalWeight += weight;
  }
  
  if (totalWeight === 0) return weapon.condition;
  
  let overall = weightedSum / totalWeight;
  
  // Apply maintenance penalties
  if (weapon.maintenance) {
    const maintenancePenalty = 
      (weapon.maintenance.foulingLevel * 5) +
      (weapon.maintenance.carbonBuildup * 3) +
      ((1 - weapon.maintenance.lubeLevel) * 2) +
      (weapon.maintenance.rustLevel * 10);
    overall = Math.max(0, overall - maintenancePenalty);
  }
  
  return Math.round(overall);
}

/**
 * Check for malfunctions based on part conditions
 */
export function checkForMalfunction(weapon: GunNutWeapon): Malfunction | null {
  if (!weapon.coreParts) return null;
  
  const malfunctions: Malfunction[] = [];
  const { coreParts, magazine, maintenance } = weapon;
  
  // Bolt issues - failure to extract/eject
  if (coreParts.bolt.condition < 70) {
    const chance = (70 - coreParts.bolt.condition) / 500;
    if (Math.random() < chance * currentSettings.wearSettings.jamChanceMultiplier) {
      malfunctions.push({
        type: 'failure_to_eject',
        part: 'bolt',
        clearTime: 2.0,
        message: 'Spent casing stuck in chamber. Bolt issues.',
      });
    }
  }
  
  // Magazine issues - failure to feed
  if (magazine && magazine.feedLipsCondition < 60) {
    const chance = (60 - magazine.feedLipsCondition) / 400;
    if (Math.random() < chance * currentSettings.wearSettings.jamChanceMultiplier) {
      malfunctions.push({
        type: 'failure_to_feed',
        part: 'magazine',
        clearTime: 1.5,
        message: 'Round fails to feed. Magazine lips damaged.',
      });
    }
  }
  
  // Spring issues - failure to cycle
  if (coreParts.spring.condition < 50) {
    const chance = (50 - coreParts.spring.condition) / 300;
    if (Math.random() < chance * currentSettings.wearSettings.jamChanceMultiplier) {
      malfunctions.push({
        type: 'failure_to_cycle',
        part: 'spring',
        clearTime: 1.8,
        message: 'Bolt doesn\'t fully cycle. Weak recoil spring.',
      });
    }
  }
  
  // Firing pin - light strike
  if (coreParts.firingPin.condition < 40) {
    const chance = (40 - coreParts.firingPin.condition) / 250;
    if (Math.random() < chance * currentSettings.wearSettings.jamChanceMultiplier) {
      malfunctions.push({
        type: 'light_strike',
        part: 'firingPin',
        clearTime: 0.5,
        message: 'Click. Light primer strike. Firing pin worn.',
      });
    }
  }
  
  // Gas system - short stroke
  if (coreParts.gasSystem && coreParts.gasSystem.condition < 45) {
    const chance = (45 - coreParts.gasSystem.condition) / 350;
    if (Math.random() < chance * currentSettings.wearSettings.jamChanceMultiplier) {
      malfunctions.push({
        type: 'short_stroke',
        part: 'gasSystem',
        clearTime: 1.2,
        message: 'Bolt short-strokes. Gas system fouled.',
      });
    }
  }
  
  // Barrel - catastrophic failure at very low condition
  if (coreParts.barrel.condition < 15 && currentSettings.gunNutSettings.partBreakage) {
    if (Math.random() < 0.02 * currentSettings.wearSettings.jamChanceMultiplier) {
      malfunctions.push({
        type: 'barrel_failure',
        part: 'barrel',
        clearTime: 0,
        catastrophic: true,
        message: 'CATASTROPHIC BARREL FAILURE! The barrel ruptures!',
      });
    }
  }
  
  // Carbon buildup affects cycling
  if (maintenance && maintenance.carbonBuildup > 0.7) {
    const chance = (maintenance.carbonBuildup - 0.7) * 0.1;
    if (Math.random() < chance) {
      malfunctions.push({
        type: 'failure_to_cycle',
        part: 'gasSystem',
        clearTime: 1.5,
        message: 'Action sluggish. Carbon buildup impeding cycling.',
      });
    }
  }
  
  // Return worst malfunction (prioritize catastrophic)
  if (malfunctions.length > 0) {
    return malfunctions.sort((a, b) => (b.catastrophic ? 1 : 0) - (a.catastrophic ? 1 : 0))[0];
  }
  
  return null;
}

/**
 * Degrade parts after firing
 */
export function degradeParts(weapon: GunNutWeapon, shots: number = 1): string[] {
  if (!weapon.coreParts || !currentSettings.gunNutModeEnabled) {
    return [];
  }
  
  const wornParts: string[] = [];
  const rate = currentSettings.wearSettings.degradationRate;
  
  for (const [partName, degradeAmount] of Object.entries(PART_DEGRADE_RATES)) {
    const part = weapon.coreParts[partName as keyof GunNutCoreParts];
    if (!part) continue;
    
    const oldCondition = part.condition;
    part.condition = Math.max(0, part.condition - degradeAmount * rate * shots);
    
    // Track significant condition changes
    if (Math.floor(oldCondition / 10) !== Math.floor(part.condition / 10)) {
      wornParts.push(partName);
    }
  }
  
  // Magazine degrades
  if (weapon.magazine) {
    weapon.magazine.springTension = Math.max(0, weapon.magazine.springTension - 0.003 * rate * shots);
    weapon.magazine.feedLipsCondition = Math.max(0, weapon.magazine.feedLipsCondition - 0.005 * rate * shots);
    weapon.magazine.feedReliability = (weapon.magazine.springTension + weapon.magazine.feedLipsCondition + weapon.magazine.followerCondition) / 3 / 100;
  }
  
  // Barrel round count & erosion
  if (weapon.coreParts.barrel) {
    weapon.coreParts.barrel.roundsFired += shots;
    weapon.coreParts.barrel.erosionLevel = weapon.coreParts.barrel.roundsFired / weapon.coreParts.barrel.maxRounds;
  }
  
  // Maintenance factors
  if (weapon.maintenance) {
    weapon.maintenance.totalRoundsFired += shots;
    weapon.maintenance.roundsSinceClean += shots;
    weapon.maintenance.foulingLevel = Math.min(1, weapon.maintenance.foulingLevel + 0.002 * rate * shots);
    weapon.maintenance.carbonBuildup = Math.min(1, weapon.maintenance.carbonBuildup + 0.001 * rate * shots);
    weapon.maintenance.lubeLevel = Math.max(0, weapon.maintenance.lubeLevel - 0.001 * rate * shots);
  }
  
  return wornParts;
}

/**
 * Apply environmental wear
 */
export type EnvironmentType = 'rain' | 'mud' | 'sand' | 'water' | 'salt_water' | 'humid' | 'dusty';

const ENVIRONMENTAL_EFFECTS: Record<EnvironmentType, { rust?: number; function?: number; jam?: number }> = {
  rain: { rust: 0.01, function: 0.005 },
  mud: { function: 0.02, jam: 0.01 },
  sand: { function: 0.03, jam: 0.02 },
  water: { rust: 0.02, function: 0.01 },
  salt_water: { rust: 0.05, function: 0.02 },
  humid: { rust: 0.005 },
  dusty: { function: 0.015, jam: 0.005 },
};

export function applyEnvironmentalWear(weapon: GunNutWeapon, environment: EnvironmentType, durationMinutes: number): void {
  if (!currentSettings.wearSettings.environmentalWear) return;
  
  const effect = ENVIRONMENTAL_EFFECTS[environment];
  if (!effect) return;
  
  const hours = durationMinutes / 60;
  
  if (effect.rust && weapon.maintenance) {
    weapon.maintenance.rustLevel = Math.min(1, weapon.maintenance.rustLevel + effect.rust * hours);
  }
  
  if (effect.function) {
    if (!currentSettings.gunNutModeEnabled) {
      // Simple mode
      weapon.condition = Math.max(0, weapon.condition - effect.function * hours * 100);
    } else if (weapon.coreParts) {
      // Gun nut mode - affect specific parts
      weapon.coreParts.bolt.condition -= effect.function * hours * 50;
      if (weapon.coreParts.gasSystem) {
        weapon.coreParts.gasSystem.condition -= effect.function * hours * 50;
      }
    }
  }
}

// ============= FACTORY FUNCTIONS =============

export function createDefaultMagazine(caliber: string, capacity: number = 30): GunNutMagazine {
  return {
    id: `mag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: `Standard ${capacity}-Round Magazine`,
    condition: 100,
    maxCondition: 100,
    capacity,
    currentAmmo: capacity,
    ammoType: caliber,
    material: 'polymer',
    weight: 0.11,
    weightLoaded: 0.45,
    springTension: 100,
    followerCondition: 100,
    feedLipsCondition: 100,
    feedReliability: 1.0,
    canCraft: false,
    repairCost: 15,
  };
}

export function createDefaultMaintenance(): GunNutMaintenance {
  return {
    totalRoundsFired: 0,
    roundsSinceClean: 0,
    lastCleaned: Date.now(),
    lastFullService: Date.now(),
    foulingLevel: 0,
    lubeLevel: 1.0,
    carbonBuildup: 0,
    rustLevel: 0,
  };
}

export function createDefaultCoreParts(weaponType: WeaponType, baseCondition: number = 100): GunNutCoreParts {
  const conditionVariance = () => baseCondition * (0.9 + Math.random() * 0.1);
  
  return {
    receiver: {
      id: `part_recv_${Date.now()}`,
      name: 'Receiver',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'aluminum',
      weight: 0.28,
      affects: ['durability', 'reliability'],
      compatibleWith: [],
      canCraft: false,
      repairCost: 150,
    },
    barrel: {
      id: `part_barrel_${Date.now()}`,
      name: 'Standard Barrel',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'steel',
      weight: 0.68,
      affects: ['accuracy', 'range', 'velocity'],
      compatibleWith: [],
      canCraft: false,
      repairCost: 200,
      length: 14.5,
      profile: 'government',
      rifling: 'conventional',
      twist: '1:7',
      roundsFired: 0,
      maxRounds: 15000,
      erosionLevel: 0,
    },
    bolt: {
      id: `part_bolt_${Date.now()}`,
      name: 'Bolt Carrier Group',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'steel',
      weight: 0.31,
      affects: ['reliability', 'cycleRate'],
      compatibleWith: [],
      canCraft: false,
      repairCost: 120,
    },
    gasSystem: {
      id: `part_gas_${Date.now()}`,
      name: 'Gas System',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'steel',
      weight: 0.12,
      affects: ['reliability', 'recoil', 'fouling'],
      compatibleWith: [],
      canCraft: true,
      craftingMaterials: { steel_tube: 1, gas_block: 1, roll_pin: 1 },
      repairCost: 60,
    },
    trigger: {
      id: `part_trig_${Date.now()}`,
      name: 'Trigger Group',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'steel',
      weight: 0.15,
      affects: ['accuracy', 'fireRate'],
      compatibleWith: [],
      canCraft: false,
      repairCost: 80,
    },
    firingPin: {
      id: `part_fp_${Date.now()}`,
      name: 'Firing Pin',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'steel',
      weight: 0.02,
      affects: ['reliability'],
      compatibleWith: [],
      canCraft: true,
      craftingMaterials: { steel_rod: 1, spring_steel: 1 },
      repairCost: 25,
    },
    spring: {
      id: `part_spring_${Date.now()}`,
      name: 'Buffer Spring',
      condition: conditionVariance(),
      maxCondition: 100,
      material: 'spring_steel',
      weight: 0.05,
      affects: ['cycleRate', 'reliability'],
      compatibleWith: [],
      canCraft: true,
      craftingMaterials: { spring_steel: 2 },
      repairCost: 15,
    },
  };
}

export function createGunNutWeapon(
  type: WeaponType,
  name: string,
  caliber: string = '5.56x45mm',
  baseCondition: number = 100
): GunNutWeapon {
  const weapon: GunNutWeapon = {
    id: `weapon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    name,
    condition: baseCondition,
    destroyed: false,
    mods: [],
    ammo: 30,
    maxAmmo: 30,
    shotsFired: 0,
    jamsCleared: 0,
    lastMaintenance: Date.now(),
    
    baseWeapon: name,
    caliber,
    firingModes: ['semi', 'auto'],
    currentFiringMode: 'semi',
    
    coreParts: createDefaultCoreParts(type, baseCondition),
    furniture: {
      stock: {
        id: `part_stock_${Date.now()}`,
        name: 'Collapsible Stock',
        condition: baseCondition,
        maxCondition: 100,
        material: 'polymer',
        weight: 0.22,
        affects: ['ergonomics', 'recoilControl', 'aimSpeed'],
        compatibleWith: [],
        canCraft: false,
        repairCost: 40,
      },
      grip: {
        id: `part_grip_${Date.now()}`,
        name: 'Pistol Grip',
        condition: baseCondition,
        maxCondition: 100,
        material: 'polymer',
        weight: 0.08,
        affects: ['ergonomics', 'recoilControl'],
        compatibleWith: [],
        canCraft: true,
        craftingMaterials: { polymer_block: 1, grip_screw: 1 },
        repairCost: 15,
      },
      handguard: {
        id: `part_hg_${Date.now()}`,
        name: 'Handguard',
        condition: baseCondition,
        maxCondition: 100,
        material: 'aluminum',
        weight: 0.35,
        affects: ['ergonomics', 'heatManagement'],
        compatibleWith: [],
        canCraft: false,
        repairCost: 60,
      },
    },
    magazine: createDefaultMagazine(caliber),
    maintenance: createDefaultMaintenance(),
  };
  
  return weapon;
}

export default {
  getWeaponSettings,
  setWeaponSettings,
  setGunNutMode,
  isGunNutMode,
  calculateOverallCondition,
  checkForMalfunction,
  degradeParts,
  applyEnvironmentalWear,
  createDefaultMagazine,
  createDefaultMaintenance,
  createDefaultCoreParts,
  createGunNutWeapon,
};
