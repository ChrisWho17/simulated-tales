/**
 * Gun Nut Tactical Accessories Database - Part 4 from Universal Weapon Attachment Database
 * Weapon lights, lasers, and tactical accessories.
 * Sources: Far Cry Series, Stalker 2, Cyberpunk 2077, SCP 5K, Real-World Military
 */

import { WeaponEra, MountType } from './gunNutOpticsDatabase';
import { GunNutDepth } from '@/lib/gameSettings';

// ============= TACTICAL TYPES =============

export type TacticalCategory = 
  | 'weapon_light'
  | 'laser_visible'
  | 'laser_ir'
  | 'illuminator'
  | 'combo_device'
  | 'sling';

export type BatteryType = 
  | 'cr123a'
  | 'cr2032'
  | '18650'
  | 'aaa'
  | 'aa'
  | 'd_cell'
  | 'rechargeable'
  | 'scavenged';

// ============= TACTICAL INTERFACE =============

export interface GunNutTactical {
  id: string;
  name: string;
  category: TacticalCategory;
  era: WeaponEra;
  description: string;
  
  // Light specs (for lights)
  lumens?: number;
  candela?: number;
  beamDistance?: number;           // meters
  runtime?: number;                // hours
  
  // Laser specs (for lasers)
  laserClass?: 'visible' | 'ir' | 'dual';
  laserColor?: 'red' | 'green' | 'ir';
  laserPower?: number;             // mW
  
  // Performance modifiers
  ergoMod: number;
  hipfireSpreadMod?: number;       // Negative = tighter
  
  // Physical
  weight: number;                  // kg
  
  // Power
  batteryType?: BatteryType;
  batteryCount?: number;
  batteryLife?: number;            // hours
  
  // Compatibility
  mountType: MountType;
  weaponTypes: string[];
  specificWeapons?: string[];
  
  // Features
  features?: {
    momentarySwitch?: boolean;
    constantOn?: boolean;
    strobe?: boolean;
    dualFuel?: boolean;
    waterproof?: boolean;
    switchOptions?: string[];
    colorFilters?: string[];
    failureChance?: number;        // For improvised
  };
  
  // Condition (Gun Nut+)
  condition?: number;
  durability: number;
  
  // NPC Perception
  npcPerception: {
    intimidation: number;
    militaryGrade: boolean;
    recognizability: string;
    visibleWhenActive: boolean;
    tags: string[];
  };
  
  // Economy
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseCost: number;
  canCraft: boolean;
  craftingMaterials?: string[];
  
  source: string[];
}

// ============= WEAPON LIGHTS DATABASE =============

export const WEAPON_LIGHTS: Record<string, GunNutTactical> = {
  // Modern Rifle Lights
  light_surefire_m600: {
    id: 'light_surefire_m600',
    name: 'SureFire M600 Scout',
    category: 'weapon_light',
    era: 'modern',
    description: 'Standard rifle-mounted weapon light',
    lumens: 1000,
    candela: 11300,
    beamDistance: 213,
    runtime: 1.25,
    ergoMod: -2,
    weight: 0.14,
    batteryType: 'cr123a',
    batteryCount: 2,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    features: {
      momentarySwitch: true,
      constantOn: true,
      waterproof: true,
      switchOptions: ['tailcap', 'tape', 'pressure'],
    },
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'professional',
      visibleWhenActive: true,
      tags: ['surefire', 'quality', 'military'],
    },
    rarity: 'uncommon',
    baseCost: 250,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  light_surefire_m600df: {
    id: 'light_surefire_m600df',
    name: 'SureFire M600DF',
    category: 'weapon_light',
    era: 'modern',
    description: 'Dual Fuel Scout Light - high output',
    lumens: 1500,
    candela: 13500,
    beamDistance: 232,
    runtime: 1.5,
    ergoMod: -2,
    weight: 0.16,
    batteryType: '18650',
    batteryCount: 1,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    features: {
      dualFuel: true,
      waterproof: true,
      switchOptions: ['tailcap', 'tape', 'pressure'],
    },
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'professional',
      visibleWhenActive: true,
      tags: ['surefire', 'premium', 'bright'],
    },
    rarity: 'uncommon',
    baseCost: 320,
    canCraft: false,
    source: ['real_world'],
  },
  
  light_streamlight_protac: {
    id: 'light_streamlight_protac',
    name: 'Streamlight ProTac HL-X',
    category: 'weapon_light',
    era: 'modern',
    description: 'Budget-friendly high-lumen rifle light',
    lumens: 1000,
    candela: 27100,
    beamDistance: 330,
    runtime: 1.5,
    ergoMod: -2,
    weight: 0.16,
    batteryType: 'cr123a',
    batteryCount: 2,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    features: {
      momentarySwitch: true,
      constantOn: true,
      strobe: true,
      waterproof: true,
    },
    durability: 0.3,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'tactical',
      visibleWhenActive: true,
      tags: ['budget', 'bright', 'throw'],
    },
    rarity: 'common',
    baseCost: 130,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  light_modlite_okw: {
    id: 'light_modlite_okw',
    name: 'Modlite OKW',
    category: 'weapon_light',
    era: 'modern',
    description: 'Optimized for throw and distance',
    lumens: 680,
    candela: 69000,
    beamDistance: 525,
    runtime: 1.0,
    ergoMod: -2,
    weight: 0.12,
    batteryType: '18650',
    batteryCount: 1,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine'],
    features: {
      waterproof: true,
      switchOptions: ['tailcap', 'modbutton'],
    },
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'enthusiast',
      visibleWhenActive: true,
      tags: ['modlite', 'throw', 'premium'],
    },
    rarity: 'uncommon',
    baseCost: 350,
    canCraft: false,
    source: ['real_world'],
  },
  
  light_cloud_rein: {
    id: 'light_cloud_rein',
    name: 'Cloud Defensive REIN',
    category: 'weapon_light',
    era: 'modern',
    description: 'Complete weapon light system with integrated switch',
    lumens: 1100,
    candela: 55000,
    beamDistance: 470,
    runtime: 1.25,
    ergoMod: -2,
    weight: 0.18,
    batteryType: '18650',
    batteryCount: 1,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    features: {
      waterproof: true,
    },
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'enthusiast',
      visibleWhenActive: true,
      tags: ['cloud', 'complete_system', 'quality'],
    },
    rarity: 'uncommon',
    baseCost: 380,
    canCraft: false,
    source: ['real_world'],
  },
  
  // Pistol Lights
  light_surefire_x300: {
    id: 'light_surefire_x300',
    name: 'SureFire X300U',
    category: 'weapon_light',
    era: 'modern',
    description: 'Industry standard pistol light',
    lumens: 1000,
    candela: 11300,
    beamDistance: 213,
    runtime: 1.5,
    ergoMod: -1,
    weight: 0.12,
    batteryType: 'cr123a',
    batteryCount: 2,
    mountType: 'picatinny',
    weaponTypes: ['pistol'],
    features: {
      waterproof: true,
    },
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'professional',
      visibleWhenActive: true,
      tags: ['surefire', 'x300', 'standard'],
    },
    rarity: 'uncommon',
    baseCost: 280,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  light_streamlight_tlr1: {
    id: 'light_streamlight_tlr1',
    name: 'Streamlight TLR-1 HL',
    category: 'weapon_light',
    era: 'modern',
    description: 'Popular duty/home defense pistol light',
    lumens: 1000,
    candela: 20000,
    beamDistance: 283,
    runtime: 1.5,
    ergoMod: -1,
    weight: 0.11,
    batteryType: 'cr123a',
    batteryCount: 2,
    mountType: 'picatinny',
    weaponTypes: ['pistol'],
    features: {
      strobe: true,
    },
    durability: 0.25,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'duty',
      visibleWhenActive: true,
      tags: ['streamlight', 'duty', 'reliable'],
    },
    rarity: 'common',
    baseCost: 140,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  // Russian
  light_zenitco_klesh: {
    id: 'light_zenitco_klesh',
    name: 'Zenitco Klesh-2',
    category: 'weapon_light',
    era: 'modern',
    description: 'Russian tactical weapon light',
    lumens: 500,
    candela: 8000,
    beamDistance: 180,
    runtime: 2,
    ergoMod: -2,
    weight: 0.18,
    batteryType: 'cr123a',
    batteryCount: 2,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    specificWeapons: ['ak_variants'],
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'russian',
      visibleWhenActive: true,
      tags: ['zenitco', 'russian', 'tactical'],
    },
    rarity: 'uncommon',
    baseCost: 200,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  // Vintage
  light_ww2_flashlight: {
    id: 'light_ww2_flashlight',
    name: 'TL-122 Angle-Head',
    category: 'weapon_light',
    era: 'ww2',
    description: 'WWII-era angle-head flashlight, improvised mounting',
    lumens: 15,
    candela: 500,
    beamDistance: 45,
    runtime: 8,
    ergoMod: -5,
    weight: 0.35,
    batteryType: 'd_cell',
    batteryCount: 2,
    mountType: 'improvised',
    weaponTypes: ['rifle', 'smg'],
    features: {
      colorFilters: ['red', 'blue', 'green'],
    },
    durability: 0.2,
    npcPerception: {
      intimidation: 1,
      militaryGrade: true,
      recognizability: 'vintage',
      visibleWhenActive: true,
      tags: ['ww2', 'vintage', 'dim'],
    },
    rarity: 'rare',
    baseCost: 40,
    canCraft: false,
    source: ['real_world'],
  },
  
  // Post-apocalyptic
  light_improvised_led: {
    id: 'light_improvised_led',
    name: 'Salvaged LED Light',
    category: 'weapon_light',
    era: 'post_apocalyptic',
    description: 'Flashlight taped to weapon',
    lumens: 200,
    candela: 3000,
    beamDistance: 110,
    runtime: 4,
    ergoMod: -4,
    weight: 0.20,
    batteryType: 'scavenged',
    batteryCount: 3,
    mountType: 'improvised',
    weaponTypes: ['rifle', 'smg', 'shotgun', 'pistol'],
    features: {
      failureChance: 0.02,
    },
    durability: 0.6,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'scavenger',
      visibleWhenActive: true,
      tags: ['improvised', 'functional', 'crude'],
    },
    rarity: 'common',
    baseCost: 15,
    canCraft: true,
    craftingMaterials: ['flashlight', 'tape', 'wire'],
    source: ['far_cry_new_dawn', 'stalker_2'],
  },
};

// ============= LASER SIGHTS DATABASE =============

export const LASER_SIGHTS: Record<string, GunNutTactical> = {
  laser_peq15: {
    id: 'laser_peq15',
    name: 'AN/PEQ-15',
    category: 'combo_device',
    era: 'modern',
    description: 'Military IR laser/illuminator combo',
    laserClass: 'dual',
    laserColor: 'ir',
    laserPower: 50,
    lumens: 120,
    ergoMod: -3,
    hipfireSpreadMod: -25,
    weight: 0.21,
    batteryType: 'aa',
    batteryCount: 1,
    batteryLife: 6,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    features: {
      momentarySwitch: true,
      constantOn: true,
    },
    durability: 0.2,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'spec_ops',
      visibleWhenActive: false,
      tags: ['peq', 'military', 'ir'],
    },
    rarity: 'rare',
    baseCost: 1200,
    canCraft: false,
    source: ['real_world', 'scp_5k'],
  },
  
  laser_dbal_a3: {
    id: 'laser_dbal_a3',
    name: 'Steiner DBAL-A3',
    category: 'combo_device',
    era: 'modern',
    description: 'Civilian-legal IR/visible laser combo',
    laserClass: 'dual',
    laserColor: 'green',
    laserPower: 5,
    ergoMod: -2,
    hipfireSpreadMod: -22,
    weight: 0.18,
    batteryType: 'cr123a',
    batteryCount: 1,
    batteryLife: 4,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'tactical',
      visibleWhenActive: true,
      tags: ['steiner', 'dbal', 'dual'],
    },
    rarity: 'rare',
    baseCost: 1400,
    canCraft: false,
    source: ['real_world'],
  },
  
  laser_crimson_trace: {
    id: 'laser_crimson_trace',
    name: 'Crimson Trace Rail Master',
    category: 'laser_visible',
    era: 'modern',
    description: 'Compact red laser for pistols and carbines',
    laserClass: 'visible',
    laserColor: 'red',
    laserPower: 5,
    ergoMod: 0,
    hipfireSpreadMod: -18,
    weight: 0.03,
    batteryType: 'cr2032',
    batteryCount: 1,
    batteryLife: 4,
    mountType: 'picatinny',
    weaponTypes: ['pistol', 'carbine', 'smg'],
    durability: 0.35,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'civilian',
      visibleWhenActive: true,
      tags: ['crimson_trace', 'compact', 'red'],
    },
    rarity: 'common',
    baseCost: 80,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  laser_streamlight_tlr2: {
    id: 'laser_streamlight_tlr2',
    name: 'Streamlight TLR-2',
    category: 'combo_device',
    era: 'modern',
    description: 'Light/laser combo for pistols',
    laserClass: 'visible',
    laserColor: 'red',
    laserPower: 5,
    lumens: 800,
    ergoMod: -1,
    hipfireSpreadMod: -15,
    weight: 0.14,
    batteryType: 'cr123a',
    batteryCount: 2,
    batteryLife: 1.5,
    mountType: 'picatinny',
    weaponTypes: ['pistol'],
    durability: 0.3,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'duty',
      visibleWhenActive: true,
      tags: ['streamlight', 'combo', 'practical'],
    },
    rarity: 'uncommon',
    baseCost: 200,
    canCraft: false,
    source: ['real_world'],
  },
  
  // Cyberpunk
  laser_smart_link: {
    id: 'laser_smart_link',
    name: 'Smart Link Targeting',
    category: 'combo_device',
    era: 'cyberpunk',
    description: 'Neural-linked targeting system with threat detection',
    laserClass: 'dual',
    laserColor: 'ir',
    laserPower: 100,
    ergoMod: 5,
    hipfireSpreadMod: -40,
    weight: 0.02,
    mountType: 'proprietary',
    weaponTypes: ['smart_weapon'],
    durability: 0.15,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'cyberware',
      visibleWhenActive: false,
      tags: ['smart', 'neural', 'targeting'],
    },
    rarity: 'epic',
    baseCost: 5000,
    canCraft: false,
    source: ['cyberpunk_2077'],
  },
};

// ============= HELPER FUNCTIONS =============

/**
 * Check battery status for tactical devices
 */
export function checkBatteryStatus(
  device: GunNutTactical,
  hoursUsed: number
): { remaining: number; depleted: boolean } {
  if (!device.batteryLife) {
    return { remaining: 100, depleted: false };
  }
  
  const remainingHours = Math.max(0, device.batteryLife - hoursUsed);
  const remainingPercent = (remainingHours / device.batteryLife) * 100;
  
  return {
    remaining: remainingPercent,
    depleted: remainingHours <= 0,
  };
}

/**
 * Calculate light effectiveness at distance
 */
export function calculateLightEffectiveness(
  light: GunNutTactical,
  distance: number
): { illuminated: boolean; spotVisible: boolean } {
  if (!light.beamDistance) {
    return { illuminated: false, spotVisible: false };
  }
  
  return {
    illuminated: distance <= light.beamDistance * 0.5,
    spotVisible: distance <= light.beamDistance,
  };
}

/**
 * Get all tactical devices by category
 */
export function getTacticalByCategory(category: TacticalCategory): GunNutTactical[] {
  const allDevices = [
    ...Object.values(WEAPON_LIGHTS),
    ...Object.values(LASER_SIGHTS),
  ];
  
  return allDevices.filter(device => device.category === category);
}

export default {
  WEAPON_LIGHTS,
  LASER_SIGHTS,
  checkBatteryStatus,
  calculateLightEffectiveness,
  getTacticalByCategory,
};
