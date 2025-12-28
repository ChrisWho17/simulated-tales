/**
 * Weapon Stats Database - MW3-style comprehensive weapon statistics
 * Based on Gun Nut PDFs with detailed stat categories
 */

import { WeaponType } from './weaponWearSystem';
import { WeaponEra } from './gunNutOpticsDatabase';

// ============= STAT CATEGORIES =============

export interface WeaponDamageStats {
  headshotDamage: number;
  upperTorsoDamage: number;
  lowerTorsoDamage: number;
  limbDamage: number;
  targetFlinch: number;           // Newtons
  armorPenetration: number;       // 0-100
}

export interface WeaponRangeStats {
  effectiveRange: number;         // meters
  minimumDamageRange: number;     // meters where damage starts dropping
  bulletVelocity: number;         // m/s
  dropoffMultiplier: number;      // 0-1 damage at max range
}

export interface WeaponFireRateStats {
  rateOfFire: number;             // RPM
  burstDelay?: number;            // ms between bursts
  spinUpTime?: number;            // ms for LMGs/miniguns
  cycleTime: number;              // ms between shots
}

export interface WeaponAccuracyStats {
  hipfireSpreadMin: number;       // degrees
  hipfireSpreadMax: number;       // degrees
  hipfireSpreadMoving: number;    // degrees while moving
  flinchResistance: number;       // Newtons
  tacticalStanceSpread: number;   // degrees
  adsAccuracy: number;            // 0-100
}

export interface WeaponRecoilStats {
  gunKick: number;                // degrees per shot
  horizontalRecoil: number;       // degrees
  verticalRecoil: number;         // degrees
  recoilPattern: 'balanced' | 'left_bias' | 'right_bias' | 'random';
  recoveryTime: number;           // ms
}

export interface WeaponMobilityStats {
  movementSpeed: number;          // m/s while equipped
  crouchMovementSpeed: number;    // m/s
  sprintSpeed: number;            // m/s
  tacticalSprintSpeed: number;    // m/s
  adsMovementSpeed: number;       // m/s while aiming
}

export interface WeaponHandlingStats {
  adsSpeed: number;               // ms to aim
  reloadQuickness: number;        // seconds
  sprintToFireSpeed: number;      // ms
  swapSpeed: number;              // ms
  dropShotSpeed: number;          // ms to prone and fire
  slideToFireSpeed: number;       // ms
}

// ============= COMPLETE WEAPON PROFILE =============

export interface WeaponStatsProfile {
  id: string;
  name: string;
  manufacturer?: string;
  type: WeaponType;
  era: WeaponEra;
  caliber: string;
  category: 'pistol' | 'smg' | 'assault_rifle' | 'lmg' | 'sniper' | 'shotgun' | 'marksman' | 'melee' | 'energy' | 'fantasy';
  
  // Detailed stat categories
  damage: WeaponDamageStats;
  range: WeaponRangeStats;
  fireRate: WeaponFireRateStats;
  accuracy: WeaponAccuracyStats;
  recoil: WeaponRecoilStats;
  mobility: WeaponMobilityStats;
  handling: WeaponHandlingStats;
  
  // Capacity
  magazineCapacity: number;
  reserveAmmo: number;
  chamberRound: boolean;
  
  // Physical
  weight: number;                 // kg
  length: number;                 // mm
  
  // Fire modes
  fireModes: ('semi' | 'burst' | 'auto')[];
  
  // Available attachments
  attachmentSlots: string[];
  
  // Special properties
  specialProperties?: {
    dualWield?: boolean;
    explosive?: boolean;
    penetration?: 'light' | 'medium' | 'heavy';
    subsonic?: boolean;
  };
  
  // Flavor
  description: string;
  pros: string[];
  cons: string[];
  
  source: string[];               // Real-world/game inspiration
}

// ============= BASE WEAPON STATS BY TYPE =============

export const BASE_WEAPON_STATS: Record<string, Partial<WeaponStatsProfile>> = {
  // ============= PISTOLS =============
  m1911: {
    id: 'm1911',
    name: 'M1911A1',
    manufacturer: 'Colt',
    type: 'pistol_quality',
    era: 'ww2',
    caliber: '.45 ACP',
    category: 'pistol',
    damage: {
      headshotDamage: 62,
      upperTorsoDamage: 42,
      lowerTorsoDamage: 38,
      limbDamage: 32,
      targetFlinch: 0.9,
      armorPenetration: 25,
    },
    range: {
      effectiveRange: 35,
      minimumDamageRange: 45,
      bulletVelocity: 253,
      dropoffMultiplier: 0.7,
    },
    fireRate: {
      rateOfFire: 400,
      cycleTime: 150,
    },
    accuracy: {
      hipfireSpreadMin: 4.2,
      hipfireSpreadMax: 9.0,
      hipfireSpreadMoving: 12.0,
      flinchResistance: 0.3,
      tacticalStanceSpread: 4.5,
      adsAccuracy: 72,
    },
    recoil: {
      gunKick: 2.1,
      horizontalRecoil: 1.2,
      verticalRecoil: 2.8,
      recoilPattern: 'balanced',
      recoveryTime: 280,
    },
    mobility: {
      movementSpeed: 5.2,
      crouchMovementSpeed: 2.5,
      sprintSpeed: 6.8,
      tacticalSprintSpeed: 8.2,
      adsMovementSpeed: 3.1,
    },
    handling: {
      adsSpeed: 180,
      reloadQuickness: 1.8,
      sprintToFireSpeed: 150,
      swapSpeed: 600,
      dropShotSpeed: 320,
      slideToFireSpeed: 280,
    },
    magazineCapacity: 7,
    reserveAmmo: 35,
    chamberRound: true,
    weight: 1.1,
    length: 216,
    fireModes: ['semi'],
    attachmentSlots: ['muzzle', 'grip', 'optic', 'magazine', 'tactical_rail_bottom'],
    description: 'Legendary American service pistol. Heavy .45 caliber stopping power.',
    pros: ['High damage per shot', 'Fast handling', 'Classic reliability'],
    cons: ['Low magazine capacity', 'Strong recoil', 'Limited range'],
    source: ['US Military', 'Far Cry 2'],
  },

  glock17: {
    id: 'glock17',
    name: 'Glock 17',
    manufacturer: 'Glock',
    type: 'pistol_quality',
    era: 'modern',
    caliber: '9x19mm',
    category: 'pistol',
    damage: {
      headshotDamage: 54,
      upperTorsoDamage: 36,
      lowerTorsoDamage: 32,
      limbDamage: 28,
      targetFlinch: 0.6,
      armorPenetration: 18,
    },
    range: {
      effectiveRange: 40,
      minimumDamageRange: 50,
      bulletVelocity: 375,
      dropoffMultiplier: 0.6,
    },
    fireRate: {
      rateOfFire: 520,
      cycleTime: 115,
    },
    accuracy: {
      hipfireSpreadMin: 3.5,
      hipfireSpreadMax: 8.2,
      hipfireSpreadMoving: 10.5,
      flinchResistance: 0.25,
      tacticalStanceSpread: 3.9,
      adsAccuracy: 75,
    },
    recoil: {
      gunKick: 1.5,
      horizontalRecoil: 0.8,
      verticalRecoil: 2.0,
      recoilPattern: 'balanced',
      recoveryTime: 220,
    },
    mobility: {
      movementSpeed: 5.3,
      crouchMovementSpeed: 2.6,
      sprintSpeed: 7.0,
      tacticalSprintSpeed: 8.4,
      adsMovementSpeed: 3.2,
    },
    handling: {
      adsSpeed: 160,
      reloadQuickness: 1.5,
      sprintToFireSpeed: 130,
      swapSpeed: 550,
      dropShotSpeed: 300,
      slideToFireSpeed: 260,
    },
    magazineCapacity: 17,
    reserveAmmo: 68,
    chamberRound: true,
    weight: 0.91,
    length: 204,
    fireModes: ['semi'],
    attachmentSlots: ['muzzle', 'grip', 'optic', 'magazine', 'tactical_rail_bottom'],
    description: 'Polymer-framed striker-fired pistol. Reliable and ubiquitous worldwide.',
    pros: ['High capacity', 'Low recoil', 'Fast fire rate'],
    cons: ['Lower damage', 'Common/generic'],
    source: ['Real-World Military', 'Stalker 2'],
  },

  // ============= ASSAULT RIFLES =============
  m4a1: {
    id: 'm4a1',
    name: 'M4A1 Carbine',
    manufacturer: 'Colt',
    type: 'assault_rifle',
    era: 'modern',
    caliber: '5.56x45mm NATO',
    category: 'assault_rifle',
    damage: {
      headshotDamage: 72,
      upperTorsoDamage: 48,
      lowerTorsoDamage: 42,
      limbDamage: 36,
      targetFlinch: 0.8,
      armorPenetration: 45,
    },
    range: {
      effectiveRange: 55,
      minimumDamageRange: 70,
      bulletVelocity: 910,
      dropoffMultiplier: 0.65,
    },
    fireRate: {
      rateOfFire: 750,
      cycleTime: 80,
    },
    accuracy: {
      hipfireSpreadMin: 4.8,
      hipfireSpreadMax: 11.0,
      hipfireSpreadMoving: 14.5,
      flinchResistance: 0.4,
      tacticalStanceSpread: 5.2,
      adsAccuracy: 78,
    },
    recoil: {
      gunKick: 1.8,
      horizontalRecoil: 1.4,
      verticalRecoil: 2.6,
      recoilPattern: 'balanced',
      recoveryTime: 150,
    },
    mobility: {
      movementSpeed: 4.8,
      crouchMovementSpeed: 2.2,
      sprintSpeed: 6.2,
      tacticalSprintSpeed: 7.4,
      adsMovementSpeed: 2.6,
    },
    handling: {
      adsSpeed: 240,
      reloadQuickness: 2.1,
      sprintToFireSpeed: 220,
      swapSpeed: 900,
      dropShotSpeed: 380,
      slideToFireSpeed: 320,
    },
    magazineCapacity: 30,
    reserveAmmo: 120,
    chamberRound: true,
    weight: 2.88,
    length: 840,
    fireModes: ['semi', 'auto'],
    attachmentSlots: ['barrel', 'muzzle', 'handguard', 'grip', 'stock', 'optic', 'magazine', 'tactical_rail_top', 'tactical_rail_side', 'tactical_rail_bottom'],
    description: 'Standard issue US military carbine. Balanced all-rounder.',
    pros: ['Versatile', 'Accurate', 'Lots of attachments'],
    cons: ['Average TTK', 'Lower damage per shot'],
    source: ['US Military', 'Call of Duty MW3'],
  },

  ak47: {
    id: 'ak47',
    name: 'AK-47',
    manufacturer: 'Kalashnikov',
    type: 'ak_variant',
    era: 'cold_war_early',
    caliber: '7.62x39mm',
    category: 'assault_rifle',
    damage: {
      headshotDamage: 84,
      upperTorsoDamage: 56,
      lowerTorsoDamage: 48,
      limbDamage: 42,
      targetFlinch: 1.1,
      armorPenetration: 55,
    },
    range: {
      effectiveRange: 50,
      minimumDamageRange: 65,
      bulletVelocity: 715,
      dropoffMultiplier: 0.7,
    },
    fireRate: {
      rateOfFire: 600,
      cycleTime: 100,
    },
    accuracy: {
      hipfireSpreadMin: 5.5,
      hipfireSpreadMax: 12.5,
      hipfireSpreadMoving: 16.0,
      flinchResistance: 0.45,
      tacticalStanceSpread: 6.0,
      adsAccuracy: 70,
    },
    recoil: {
      gunKick: 2.6,
      horizontalRecoil: 2.2,
      verticalRecoil: 3.4,
      recoilPattern: 'right_bias',
      recoveryTime: 180,
    },
    mobility: {
      movementSpeed: 4.6,
      crouchMovementSpeed: 2.1,
      sprintSpeed: 5.9,
      tacticalSprintSpeed: 7.1,
      adsMovementSpeed: 2.4,
    },
    handling: {
      adsSpeed: 280,
      reloadQuickness: 2.4,
      sprintToFireSpeed: 260,
      swapSpeed: 1000,
      dropShotSpeed: 420,
      slideToFireSpeed: 360,
    },
    magazineCapacity: 30,
    reserveAmmo: 90,
    chamberRound: true,
    weight: 3.47,
    length: 870,
    fireModes: ['semi', 'auto'],
    attachmentSlots: ['barrel', 'muzzle', 'handguard', 'grip', 'stock', 'optic', 'magazine'],
    description: 'Legendary Soviet assault rifle. High damage, brutal reliability.',
    pros: ['High damage', 'Extremely reliable', 'Penetration'],
    cons: ['Heavy recoil', 'Less accurate', 'Heavier'],
    source: ['Soviet Military', 'Far Cry 2', 'Stalker 2'],
  },

  // ============= SMGs =============
  mp5: {
    id: 'mp5',
    name: 'MP5A3',
    manufacturer: 'H&K',
    type: 'smg_quality',
    era: 'cold_war_late',
    caliber: '9x19mm',
    category: 'smg',
    damage: {
      headshotDamage: 54,
      upperTorsoDamage: 36,
      lowerTorsoDamage: 32,
      limbDamage: 26,
      targetFlinch: 0.5,
      armorPenetration: 15,
    },
    range: {
      effectiveRange: 30,
      minimumDamageRange: 42,
      bulletVelocity: 400,
      dropoffMultiplier: 0.55,
    },
    fireRate: {
      rateOfFire: 800,
      cycleTime: 75,
    },
    accuracy: {
      hipfireSpreadMin: 3.2,
      hipfireSpreadMax: 8.0,
      hipfireSpreadMoving: 10.0,
      flinchResistance: 0.25,
      tacticalStanceSpread: 3.5,
      adsAccuracy: 74,
    },
    recoil: {
      gunKick: 1.2,
      horizontalRecoil: 0.9,
      verticalRecoil: 1.6,
      recoilPattern: 'balanced',
      recoveryTime: 120,
    },
    mobility: {
      movementSpeed: 5.4,
      crouchMovementSpeed: 2.7,
      sprintSpeed: 7.0,
      tacticalSprintSpeed: 8.5,
      adsMovementSpeed: 3.4,
    },
    handling: {
      adsSpeed: 180,
      reloadQuickness: 1.9,
      sprintToFireSpeed: 160,
      swapSpeed: 700,
      dropShotSpeed: 300,
      slideToFireSpeed: 260,
    },
    magazineCapacity: 30,
    reserveAmmo: 120,
    chamberRound: true,
    weight: 2.54,
    length: 660,
    fireModes: ['semi', 'burst', 'auto'],
    attachmentSlots: ['barrel', 'muzzle', 'handguard', 'grip', 'stock', 'optic', 'magazine', 'tactical_rail_bottom'],
    description: 'German precision SMG. Low recoil, high accuracy.',
    pros: ['Very accurate', 'Low recoil', 'Fast handling'],
    cons: ['Lower damage', 'Limited range'],
    source: ['H&K', 'Counter-Strike'],
  },

  // ============= SNIPER RIFLES =============
  m24: {
    id: 'm24',
    name: 'M24 SWS',
    manufacturer: 'Remington',
    type: 'sniper_rifle',
    era: 'post_cold_war',
    caliber: '7.62x51mm NATO',
    category: 'sniper',
    damage: {
      headshotDamage: 150,
      upperTorsoDamage: 95,
      lowerTorsoDamage: 85,
      limbDamage: 72,
      targetFlinch: 2.0,
      armorPenetration: 80,
    },
    range: {
      effectiveRange: 120,
      minimumDamageRange: 180,
      bulletVelocity: 853,
      dropoffMultiplier: 0.85,
    },
    fireRate: {
      rateOfFire: 40,
      cycleTime: 1500,
    },
    accuracy: {
      hipfireSpreadMin: 12.0,
      hipfireSpreadMax: 25.0,
      hipfireSpreadMoving: 30.0,
      flinchResistance: 0.6,
      tacticalStanceSpread: 10.0,
      adsAccuracy: 95,
    },
    recoil: {
      gunKick: 4.5,
      horizontalRecoil: 1.8,
      verticalRecoil: 5.2,
      recoilPattern: 'balanced',
      recoveryTime: 800,
    },
    mobility: {
      movementSpeed: 4.2,
      crouchMovementSpeed: 1.8,
      sprintSpeed: 5.2,
      tacticalSprintSpeed: 6.0,
      adsMovementSpeed: 1.5,
    },
    handling: {
      adsSpeed: 420,
      reloadQuickness: 3.2,
      sprintToFireSpeed: 380,
      swapSpeed: 1200,
      dropShotSpeed: 500,
      slideToFireSpeed: 450,
    },
    magazineCapacity: 5,
    reserveAmmo: 25,
    chamberRound: true,
    weight: 5.4,
    length: 1092,
    fireModes: ['semi'],
    attachmentSlots: ['barrel', 'muzzle', 'stock', 'optic', 'magazine', 'bipod'],
    description: 'Bolt-action precision rifle. One shot, one kill.',
    pros: ['One shot headshots', 'Extreme accuracy', 'Long range'],
    cons: ['Slow fire rate', 'Poor mobility', 'Limited close range'],
    source: ['US Army', 'Battlefield'],
  },

  // ============= SHOTGUNS =============
  spas12: {
    id: 'spas12',
    name: 'SPAS-12',
    manufacturer: 'Franchi',
    type: 'shotgun_pump',
    era: 'cold_war_late',
    caliber: '12 Gauge',
    category: 'shotgun',
    damage: {
      headshotDamage: 180,
      upperTorsoDamage: 120,
      lowerTorsoDamage: 100,
      limbDamage: 80,
      targetFlinch: 3.0,
      armorPenetration: 20,
    },
    range: {
      effectiveRange: 15,
      minimumDamageRange: 25,
      bulletVelocity: 400,
      dropoffMultiplier: 0.3,
    },
    fireRate: {
      rateOfFire: 80,
      cycleTime: 750,
    },
    accuracy: {
      hipfireSpreadMin: 8.0,
      hipfireSpreadMax: 18.0,
      hipfireSpreadMoving: 22.0,
      flinchResistance: 0.5,
      tacticalStanceSpread: 9.0,
      adsAccuracy: 60,
    },
    recoil: {
      gunKick: 5.0,
      horizontalRecoil: 2.5,
      verticalRecoil: 6.0,
      recoilPattern: 'balanced',
      recoveryTime: 500,
    },
    mobility: {
      movementSpeed: 4.4,
      crouchMovementSpeed: 2.0,
      sprintSpeed: 5.6,
      tacticalSprintSpeed: 6.6,
      adsMovementSpeed: 2.2,
    },
    handling: {
      adsSpeed: 280,
      reloadQuickness: 4.5,
      sprintToFireSpeed: 260,
      swapSpeed: 950,
      dropShotSpeed: 400,
      slideToFireSpeed: 340,
    },
    magazineCapacity: 8,
    reserveAmmo: 32,
    chamberRound: true,
    weight: 4.2,
    length: 1041,
    fireModes: ['semi'],
    attachmentSlots: ['barrel', 'muzzle', 'stock', 'optic', 'tactical_rail_bottom'],
    description: 'Iconic combat shotgun. Devastating at close range.',
    pros: ['Massive damage', 'Intimidating', 'Can use semi-auto mode'],
    cons: ['Very short range', 'Slow reload', 'Heavy'],
    source: ['Franchi', 'Far Cry 2', 'Jurassic Park'],
  },

  // ============= LMGs =============
  pkm: {
    id: 'pkm',
    name: 'PKM',
    manufacturer: 'Kalashnikov',
    type: 'lmg',
    era: 'cold_war_early',
    caliber: '7.62x54mmR',
    category: 'lmg',
    damage: {
      headshotDamage: 90,
      upperTorsoDamage: 60,
      lowerTorsoDamage: 52,
      limbDamage: 45,
      targetFlinch: 1.4,
      armorPenetration: 65,
    },
    range: {
      effectiveRange: 65,
      minimumDamageRange: 90,
      bulletVelocity: 825,
      dropoffMultiplier: 0.75,
    },
    fireRate: {
      rateOfFire: 650,
      cycleTime: 92,
    },
    accuracy: {
      hipfireSpreadMin: 7.0,
      hipfireSpreadMax: 16.0,
      hipfireSpreadMoving: 20.0,
      flinchResistance: 0.6,
      tacticalStanceSpread: 8.0,
      adsAccuracy: 72,
    },
    recoil: {
      gunKick: 2.8,
      horizontalRecoil: 2.0,
      verticalRecoil: 3.2,
      recoilPattern: 'left_bias',
      recoveryTime: 140,
    },
    mobility: {
      movementSpeed: 3.8,
      crouchMovementSpeed: 1.6,
      sprintSpeed: 4.8,
      tacticalSprintSpeed: 5.6,
      adsMovementSpeed: 1.8,
    },
    handling: {
      adsSpeed: 380,
      reloadQuickness: 5.5,
      sprintToFireSpeed: 350,
      swapSpeed: 1400,
      dropShotSpeed: 520,
      slideToFireSpeed: 480,
    },
    magazineCapacity: 100,
    reserveAmmo: 200,
    chamberRound: false,
    weight: 7.5,
    length: 1173,
    fireModes: ['auto'],
    attachmentSlots: ['barrel', 'muzzle', 'grip', 'stock', 'optic', 'bipod'],
    description: 'Soviet belt-fed machine gun. Sustained suppressive fire.',
    pros: ['High capacity', 'Good damage', 'Suppressive fire'],
    cons: ['Very slow mobility', 'Long reload', 'Heavy'],
    source: ['Soviet Military', 'Far Cry 2', 'Stalker 2'],
  },
};

// ============= UTILITY FUNCTIONS =============

export function getWeaponStats(weaponId: string): WeaponStatsProfile | null {
  return (BASE_WEAPON_STATS[weaponId] as WeaponStatsProfile) || null;
}

export function getWeaponsByCategory(category: string): WeaponStatsProfile[] {
  return Object.values(BASE_WEAPON_STATS)
    .filter(w => w.category === category) as WeaponStatsProfile[];
}

export function getWeaponsByEra(era: WeaponEra): WeaponStatsProfile[] {
  return Object.values(BASE_WEAPON_STATS)
    .filter(w => w.era === era) as WeaponStatsProfile[];
}

// ============= STAT MODIFIER CALCULATION =============

export interface StatModifier {
  stat: string;
  baseValue: number;
  modifiedValue: number;
  change: number;
  changePercent: number;
  source: string;
}

export function calculateStatModifiers(
  baseStats: WeaponStatsProfile,
  attachmentModifiers: Record<string, number>[]
): StatModifier[] {
  const modifiers: StatModifier[] = [];
  
  // Map attachment modifiers to stat changes
  for (const attachmentMod of attachmentModifiers) {
    for (const [stat, change] of Object.entries(attachmentMod)) {
      if (change !== 0) {
        modifiers.push({
          stat,
          baseValue: 0,
          modifiedValue: change,
          change,
          changePercent: change,
          source: 'attachment',
        });
      }
    }
  }
  
  return modifiers;
}

// ============= STAT DISPLAY HELPERS =============

export function getStatDisplayValue(value: number, statType: string): string {
  switch (statType) {
    case 'damage':
    case 'armorPenetration':
      return `${Math.round(value)}`;
    case 'range':
      return `${Math.round(value)} m`;
    case 'velocity':
      return `${Math.round(value)} m/s`;
    case 'rof':
      return `${Math.round(value)} rpm`;
    case 'spread':
    case 'recoil':
      return `${value.toFixed(1)} °/s`;
    case 'flinch':
      return `${value.toFixed(1)} N`;
    case 'time':
      return `${Math.round(value)} ms`;
    case 'speed':
      return `${value.toFixed(1)} m/s`;
    case 'reload':
      return `${value.toFixed(1)} s`;
    case 'weight':
      return `${value.toFixed(2)} kg`;
    case 'percent':
      return `${Math.round(value)}%`;
    default:
      return `${value}`;
  }
}

export function getStatBarPercent(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}
