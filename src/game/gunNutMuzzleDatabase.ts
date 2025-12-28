/**
 * Gun Nut Muzzle Devices Database - Part 2 & 6 from Universal Weapon Attachment Database
 * Flash hiders, compensators, muzzle brakes, and suppressors.
 * Sources: Far Cry Series, Stalker 2, Cyberpunk 2077, SCP 5K, Real-World Military
 */

import { WeaponEra } from './gunNutOpticsDatabase';
import { GunNutDepth } from '@/lib/gameSettings';

// ============= MUZZLE DEVICE TYPES =============

export type MuzzleDeviceCategory = 
  | 'flash_hider'
  | 'compensator'
  | 'muzzle_brake'
  | 'suppressor'
  | 'hybrid'
  | 'blast_device';

export type ThreadSize = 
  | '1/2x28'        // Standard AR-15 / 5.56
  | '5/8x24'        // .308 / 7.62
  | '14x1_lh'       // AK 7.62x39
  | '24x1.5_rh'     // AK-74 5.45
  | 'm14x1_lh'      // AK-12
  | '9/16x24'       // 9mm
  | 'm15x1'         // European 9mm
  | 'proprietary';

// ============= MUZZLE DEVICE INTERFACE =============

export interface GunNutMuzzleDevice {
  id: string;
  name: string;
  category: MuzzleDeviceCategory;
  era: WeaponEra;
  description: string;
  
  // Performance modifiers
  flashReduction: number;          // 0-1 (0.9 = 90% reduction)
  recoilMod: number;               // Negative = less recoil
  horizontalRecoilMod?: number;    // Separate horizontal control
  noiseMod: number;                // Negative = quieter, positive = louder
  accuracyMod: number;
  ergoMod: number;
  velocityMod?: number;            // Muzzle velocity modifier
  
  // Stealth
  detectionRangeMod?: number;      // 0.1-2.0 multiplier on detection
  
  // Physical
  weight: number;                  // kg
  length?: number;                 // mm added to weapon
  
  // Compatibility
  threadSize: ThreadSize | ThreadSize[];
  weaponTypes: string[];
  specificWeapons?: string[];
  excludeWeapons?: string[];
  suppressorMount?: string;        // For flash hiders with suppressor QD
  
  // Condition (Gun Nut+)
  condition?: number;
  durability: number;              // 0.1-1.0
  wearRate?: number;               // Condition loss per shot
  
  // NPC Perception
  npcPerception: {
    intimidation: number;
    militaryGrade: boolean;
    recognizability: string;
    tags: string[];
  };
  
  // Economy
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseCost: number;
  canCraft: boolean;
  craftingMaterials?: string[];
  
  source: string[];
}

// ============= FLASH HIDERS DATABASE =============

export const FLASH_HIDERS: Record<string, GunNutMuzzleDevice> = {
  // WW2 Era
  flash_ww2_conical: {
    id: 'flash_ww2_conical',
    name: 'Conical Flash Hider',
    category: 'flash_hider',
    era: 'ww2',
    description: 'Simple cone-shaped flash suppressor',
    flashReduction: 0.50,
    recoilMod: 0,
    noiseMod: 0,
    accuracyMod: 0,
    ergoMod: 0,
    weight: 0.08,
    threadSize: 'proprietary',
    weaponTypes: ['rifle', 'smg'],
    specificWeapons: ['fg42', 'stg44'],
    durability: 0.2,
    npcPerception: {
      intimidation: 1,
      militaryGrade: true,
      recognizability: 'military_vintage',
      tags: ['vintage', 'german', 'functional'],
    },
    rarity: 'uncommon',
    baseCost: 30,
    canCraft: true,
    craftingMaterials: ['steel_tube'],
    source: ['real_world', 'hell_let_loose'],
  },
  
  // Cold War / Vietnam
  flash_xm177: {
    id: 'flash_xm177',
    name: 'XM177 3-Prong Flash Hider',
    category: 'flash_hider',
    era: 'vietnam',
    description: 'Early AR-15 flash hider, distinctive appearance',
    flashReduction: 0.70,
    recoilMod: -2,
    noiseMod: 0,
    accuracyMod: 0,
    ergoMod: 0,
    weight: 0.07,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['m16', 'm16a1', 'xm177', 'ar15_variants'],
    durability: 0.25,
    npcPerception: {
      intimidation: 2,
      militaryGrade: true,
      recognizability: 'vietnam_era',
      tags: ['vietnam', 'retro', 'distinctive'],
    },
    rarity: 'uncommon',
    baseCost: 40,
    canCraft: true,
    craftingMaterials: ['steel_tube', 'threading_die'],
    source: ['real_world'],
  },
  
  flash_ak_slant: {
    id: 'flash_ak_slant',
    name: 'AK Slant Brake',
    category: 'flash_hider',
    era: 'cold_war_early',
    description: 'Angled compensator/flash hider combo for AK',
    flashReduction: 0.30,
    recoilMod: -5,
    horizontalRecoilMod: -8,
    noiseMod: 2,
    accuracyMod: 0,
    ergoMod: 0,
    weight: 0.07,
    threadSize: '14x1_lh',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['ak47', 'akm', 'ak74', 'ak_variants'],
    durability: 0.15,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'soviet',
      tags: ['soviet', 'ak', 'common'],
    },
    rarity: 'common',
    baseCost: 15,
    canCraft: true,
    source: ['real_world', 'stalker_2', 'far_cry_2'],
  },
  
  flash_ak74_brake: {
    id: 'flash_ak74_brake',
    name: 'AK-74 Muzzle Brake',
    category: 'flash_hider',
    era: 'cold_war_late',
    description: 'Distinctive long muzzle device for AK-74',
    flashReduction: 0.40,
    recoilMod: -18,
    horizontalRecoilMod: -15,
    noiseMod: 8,
    accuracyMod: 2,
    ergoMod: -2,
    weight: 0.11,
    threadSize: '24x1.5_rh',
    weaponTypes: ['rifle'],
    specificWeapons: ['ak74', 'ak74m', 'aks74', 'rpk74'],
    durability: 0.2,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'russian',
      tags: ['soviet', 'distinctive', 'effective'],
    },
    rarity: 'common',
    baseCost: 35,
    canCraft: true,
    source: ['real_world', 'stalker_2'],
  },
  
  // Modern
  flash_a2: {
    id: 'flash_a2',
    name: 'A2 Flash Hider',
    category: 'flash_hider',
    era: 'modern',
    description: 'Standard US military birdcage flash hider',
    flashReduction: 0.75,
    recoilMod: -2,
    noiseMod: 0,
    accuracyMod: 0,
    ergoMod: 0,
    weight: 0.06,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['m16', 'm4', 'ar15_variants'],
    durability: 0.2,
    npcPerception: {
      intimidation: 2,
      militaryGrade: true,
      recognizability: 'military_standard',
      tags: ['military', 'standard', 'ar15'],
    },
    rarity: 'common',
    baseCost: 15,
    canCraft: true,
    source: ['real_world', 'far_cry_3', 'far_cry_4', 'far_cry_5'],
  },
  
  flash_surefire_warcomp: {
    id: 'flash_surefire_warcomp',
    name: 'SureFire WARCOMP',
    category: 'hybrid',
    era: 'modern',
    description: 'Hybrid flash hider/compensator with suppressor mount',
    flashReduction: 0.85,
    recoilMod: -8,
    horizontalRecoilMod: -6,
    noiseMod: 3,
    accuracyMod: 2,
    ergoMod: -1,
    weight: 0.10,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    suppressorMount: 'surefire_socom',
    durability: 0.25,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'high_end_tactical',
      tags: ['premium', 'hybrid', 'suppressor_ready'],
    },
    rarity: 'uncommon',
    baseCost: 150,
    canCraft: false,
    source: ['real_world', 'far_cry_5', 'far_cry_6'],
  },
  
  flash_surefire_sf3p: {
    id: 'flash_surefire_sf3p',
    name: 'SureFire SF3P',
    category: 'flash_hider',
    era: 'modern',
    description: 'Three-prong flash hider with suppressor interface',
    flashReduction: 0.90,
    recoilMod: -3,
    noiseMod: 0,
    accuracyMod: 0,
    ergoMod: 0,
    weight: 0.08,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    suppressorMount: 'surefire_socom',
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'spec_ops',
      tags: ['surefire', 'flash', 'quality'],
    },
    rarity: 'uncommon',
    baseCost: 130,
    canCraft: false,
    source: ['real_world'],
  },
  
  flash_dtk: {
    id: 'flash_dtk',
    name: 'Zenitco DTK-1',
    category: 'flash_hider',
    era: 'modern',
    description: 'Modern Russian tactical muzzle device',
    flashReduction: 0.70,
    recoilMod: -12,
    horizontalRecoilMod: -10,
    noiseMod: 5,
    accuracyMod: 1,
    ergoMod: -1,
    weight: 0.14,
    threadSize: '24x1.5_rh',
    weaponTypes: ['rifle'],
    specificWeapons: ['ak_variants'],
    durability: 0.25,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'russian_modern',
      tags: ['zenitco', 'tactical', 'russian'],
    },
    rarity: 'uncommon',
    baseCost: 120,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  // Post-apocalyptic
  flash_improvised_can: {
    id: 'flash_improvised_can',
    name: 'Tin Can Flash Hider',
    category: 'flash_hider',
    era: 'post_apocalyptic',
    description: 'Crude flash hider made from a can and wire',
    flashReduction: 0.25,
    recoilMod: 0,
    noiseMod: 3,
    accuracyMod: -2,
    ergoMod: -3,
    weight: 0.08,
    threadSize: 'proprietary',
    weaponTypes: ['rifle', 'smg', 'shotgun'],
    durability: 0.7,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'scavenger',
      tags: ['improvised', 'crude', 'functional'],
    },
    rarity: 'common',
    baseCost: 5,
    canCraft: true,
    craftingMaterials: ['tin_can', 'wire', 'tape'],
    source: ['stalker_2', 'far_cry_new_dawn'],
  },
};

// ============= COMPENSATORS DATABASE =============

export const COMPENSATORS: Record<string, GunNutMuzzleDevice> = {
  comp_cutts: {
    id: 'comp_cutts',
    name: 'Cutts Compensator',
    category: 'compensator',
    era: 'interwar',
    description: 'Classic gangster-era compensator for Thompson',
    flashReduction: 0.20,
    recoilMod: -20,
    horizontalRecoilMod: -15,
    noiseMod: 8,
    accuracyMod: 5,
    ergoMod: -3,
    weight: 0.18,
    threadSize: 'proprietary',
    weaponTypes: ['smg'],
    specificWeapons: ['thompson_m1928', 'thompson_m1'],
    durability: 0.15,
    npcPerception: {
      intimidation: 5,
      militaryGrade: true,
      recognizability: 'gangster_era',
      tags: ['classic', 'thompson', 'iconic'],
    },
    rarity: 'rare',
    baseCost: 120,
    canCraft: false,
    source: ['real_world'],
  },
  
  comp_precision_rifle: {
    id: 'comp_precision_rifle',
    name: 'Precision Rifle Compensator',
    category: 'compensator',
    era: 'modern',
    description: 'Competition-grade vertical recoil compensation',
    flashReduction: 0.10,
    recoilMod: -25,
    horizontalRecoilMod: -5,
    noiseMod: 12,
    accuracyMod: 5,
    ergoMod: -2,
    weight: 0.15,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.3,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'competition',
      tags: ['precision', 'competition', 'effective'],
    },
    rarity: 'uncommon',
    baseCost: 85,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  comp_vg6_epsilon: {
    id: 'comp_vg6_epsilon',
    name: 'VG6 Epsilon',
    category: 'compensator',
    era: 'modern',
    description: 'Aggressive hybrid brake/compensator',
    flashReduction: 0.40,
    recoilMod: -30,
    horizontalRecoilMod: -25,
    noiseMod: 15,
    accuracyMod: 3,
    ergoMod: -2,
    weight: 0.11,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.25,
    npcPerception: {
      intimidation: 4,
      militaryGrade: false,
      recognizability: 'enthusiast',
      tags: ['vg6', 'aggressive', 'loud'],
    },
    rarity: 'uncommon',
    baseCost: 90,
    canCraft: false,
    source: ['real_world'],
  },
};

// ============= MUZZLE BRAKES DATABASE =============

export const MUZZLE_BRAKES: Record<string, GunNutMuzzleDevice> = {
  brake_barrett: {
    id: 'brake_barrett',
    name: 'Barrett Muzzle Brake',
    category: 'muzzle_brake',
    era: 'modern',
    description: 'Massive brake for .50 BMG recoil control',
    flashReduction: 0.30,
    recoilMod: -50,
    horizontalRecoilMod: -40,
    noiseMod: 25,
    accuracyMod: 0,
    ergoMod: -5,
    weight: 0.45,
    threadSize: 'proprietary',
    weaponTypes: ['rifle'],
    specificWeapons: ['barrett_m82', 'barrett_m107'],
    durability: 0.15,
    npcPerception: {
      intimidation: 5,
      militaryGrade: true,
      recognizability: 'anti_material',
      tags: ['barrett', 'massive', 'intimidating'],
    },
    rarity: 'rare',
    baseCost: 500,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  brake_lantac_dragon: {
    id: 'brake_lantac_dragon',
    name: 'Lantac Dragon',
    category: 'muzzle_brake',
    era: 'modern',
    description: 'Self-timing brake with forward blast ports',
    flashReduction: 0.45,
    recoilMod: -35,
    horizontalRecoilMod: -30,
    noiseMod: 18,
    accuracyMod: 2,
    ergoMod: -1,
    weight: 0.09,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.2,
    npcPerception: {
      intimidation: 4,
      militaryGrade: false,
      recognizability: 'enthusiast',
      tags: ['lantac', 'dragon', 'effective'],
    },
    rarity: 'uncommon',
    baseCost: 130,
    canCraft: false,
    source: ['real_world'],
  },
};

// ============= SUPPRESSORS DATABASE =============

export const SUPPRESSORS: Record<string, GunNutMuzzleDevice> = {
  suppressor_osprey: {
    id: 'suppressor_osprey',
    name: 'SilencerCo Osprey',
    category: 'suppressor',
    era: 'modern',
    description: 'Eccentric design for pistol sights co-witness',
    flashReduction: 0.95,
    recoilMod: 5,
    noiseMod: -35,
    accuracyMod: 3,
    ergoMod: -8,
    velocityMod: -0.02,
    detectionRangeMod: 0.35,
    weight: 0.28,
    length: 178,
    threadSize: '9/16x24',
    weaponTypes: ['pistol'],
    durability: 0.4,
    wearRate: 0.002,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'professional',
      tags: ['silencerco', 'pistol', 'quality'],
    },
    rarity: 'rare',
    baseCost: 800,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  suppressor_surefire_socom: {
    id: 'suppressor_surefire_socom',
    name: 'SureFire SOCOM556',
    category: 'suppressor',
    era: 'modern',
    description: 'Military-grade rifle suppressor with fast-attach',
    flashReduction: 0.98,
    recoilMod: 8,
    noiseMod: -30,
    accuracyMod: 5,
    ergoMod: -10,
    velocityMod: -0.03,
    detectionRangeMod: 0.40,
    weight: 0.52,
    length: 180,
    threadSize: '1/2x28',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.3,
    wearRate: 0.003,
    npcPerception: {
      intimidation: 5,
      militaryGrade: true,
      recognizability: 'tier_one',
      tags: ['surefire', 'military', 'premium'],
    },
    rarity: 'epic',
    baseCost: 1500,
    canCraft: false,
    source: ['real_world', 'scp_5k'],
  },
  
  suppressor_pbs1: {
    id: 'suppressor_pbs1',
    name: 'PBS-1 Suppressor',
    category: 'suppressor',
    era: 'cold_war_late',
    description: 'Soviet-era suppressor for AK platforms',
    flashReduction: 0.90,
    recoilMod: 3,
    noiseMod: -25,
    accuracyMod: 2,
    ergoMod: -12,
    velocityMod: -0.05,
    detectionRangeMod: 0.45,
    weight: 0.58,
    length: 200,
    threadSize: '14x1_lh',
    weaponTypes: ['rifle'],
    specificWeapons: ['ak_variants'],
    durability: 0.35,
    wearRate: 0.004,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'soviet',
      tags: ['soviet', 'classic', 'ak'],
    },
    rarity: 'rare',
    baseCost: 400,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  suppressor_integral_vss: {
    id: 'suppressor_integral_vss',
    name: 'Integral VSS Suppressor',
    category: 'suppressor',
    era: 'cold_war_late',
    description: 'Factory-integrated suppressor system',
    flashReduction: 0.99,
    recoilMod: 10,
    noiseMod: -45,
    accuracyMod: 8,
    ergoMod: 0,
    velocityMod: 0,
    detectionRangeMod: 0.25,
    weight: 0,
    threadSize: 'proprietary',
    weaponTypes: ['rifle'],
    specificWeapons: ['vss_vintorez', 'as_val'],
    durability: 0.2,
    wearRate: 0.001,
    npcPerception: {
      intimidation: 5,
      militaryGrade: true,
      recognizability: 'spetsnaz',
      tags: ['integral', 'russian', 'whisper_quiet'],
    },
    rarity: 'epic',
    baseCost: 0,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  // Improvised
  suppressor_oil_filter: {
    id: 'suppressor_oil_filter',
    name: 'Oil Filter Suppressor',
    category: 'suppressor',
    era: 'post_apocalyptic',
    description: 'Automotive oil filter adapted as improvised suppressor',
    flashReduction: 0.70,
    recoilMod: 0,
    noiseMod: -15,
    accuracyMod: -3,
    ergoMod: -15,
    velocityMod: -0.08,
    detectionRangeMod: 0.60,
    weight: 0.35,
    length: 150,
    threadSize: 'proprietary',
    weaponTypes: ['pistol', 'rifle', 'smg'],
    durability: 0.8,
    wearRate: 0.02,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'scavenger',
      tags: ['improvised', 'crude', 'disposable'],
    },
    rarity: 'common',
    baseCost: 20,
    canCraft: true,
    craftingMaterials: ['oil_filter', 'adapter', 'tape'],
    source: ['stalker_2', 'far_cry_new_dawn'],
  },
};

// ============= HELPER FUNCTIONS =============

/**
 * Calculate suppressor heat and wear
 */
export function calculateSuppressorWear(
  suppressor: GunNutMuzzleDevice,
  shotsFired: number,
  depth: GunNutDepth = 'standard'
): { newCondition: number; overheated: boolean } {
  if (depth === 'standard' || !suppressor.wearRate) {
    return { newCondition: suppressor.condition || 100, overheated: false };
  }
  
  const conditionLoss = suppressor.wearRate * shotsFired * 100;
  const newCondition = Math.max(0, (suppressor.condition || 100) - conditionLoss);
  
  // Suppressors overheat with rapid fire
  const overheated = shotsFired > 30;
  
  return { newCondition, overheated };
}

/**
 * Get effective noise reduction based on condition
 */
export function getEffectiveNoiseReduction(
  muzzleDevice: GunNutMuzzleDevice,
  depth: GunNutDepth = 'standard'
): number {
  if (muzzleDevice.category !== 'suppressor') {
    return muzzleDevice.noiseMod;
  }
  
  let effectiveness = muzzleDevice.noiseMod;
  
  if (depth !== 'standard' && muzzleDevice.condition !== undefined) {
    // Worn suppressors are less effective
    if (muzzleDevice.condition < 70) {
      const penalty = ((70 - muzzleDevice.condition) / 100) * Math.abs(effectiveness) * 0.5;
      effectiveness += penalty; // Add penalty (making it closer to 0)
    }
  }
  
  return effectiveness;
}

/**
 * Get all muzzle devices by category
 */
export function getMuzzleDevicesByCategory(category: MuzzleDeviceCategory): GunNutMuzzleDevice[] {
  const allDevices = [
    ...Object.values(FLASH_HIDERS),
    ...Object.values(COMPENSATORS),
    ...Object.values(MUZZLE_BRAKES),
    ...Object.values(SUPPRESSORS),
  ];
  
  return allDevices.filter(device => device.category === category);
}

export default {
  FLASH_HIDERS,
  COMPENSATORS,
  MUZZLE_BRAKES,
  SUPPRESSORS,
  calculateSuppressorWear,
  getEffectiveNoiseReduction,
  getMuzzleDevicesByCategory,
};
