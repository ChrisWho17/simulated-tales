/**
 * Gun Nut Furniture Database - Part 3 from Universal Weapon Attachment Database
 * Foregrips, stocks, pistol grips, and handguards.
 * Sources: Far Cry Series, Stalker 2, Cyberpunk 2077, Real-World Military
 */

import { WeaponEra, MountType } from './gunNutOpticsDatabase';
import { GunNutDepth } from '@/lib/gameSettings';

// ============= FURNITURE TYPES =============

export type FurnitureCategory = 
  | 'vertical_foregrip'
  | 'angled_foregrip'
  | 'hand_stop'
  | 'bipod'
  | 'pistol_grip'
  | 'stock'
  | 'handguard';

export type StockType = 
  | 'fixed'
  | 'collapsible'
  | 'folding'
  | 'precision'
  | 'skeleton'
  | 'wire';

// ============= FURNITURE INTERFACE =============

export interface GunNutFurniture {
  id: string;
  name: string;
  category: FurnitureCategory;
  era: WeaponEra;
  description: string;
  
  // Performance modifiers
  recoilMod: number;
  horizontalRecoilMod: number;
  aimSpeedMod: number;               // 0.8-1.2 multiplier
  ergoMod: number;
  
  // Stock-specific
  stockType?: StockType;
  lengthOfPull?: number;             // Adjustable?
  cheekRiser?: boolean;
  
  // Physical
  weight: number;                    // kg
  
  // Compatibility
  mountType: MountType;
  weaponTypes: string[];
  specificWeapons?: string[];
  excludeWeapons?: string[];
  
  // Special features
  features?: {
    reversible?: boolean;
    storageCompartment?: boolean;
    qd?: boolean;                    // Quick detach
    barricadeSupport?: boolean;
  };
  
  // Condition (Gun Nut+)
  condition?: number;
  durability: number;
  
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

// ============= VERTICAL FOREGRIPS DATABASE =============

export const VERTICAL_FOREGRIPS: Record<string, GunNutFurniture> = {
  // Classic
  grip_thompson_vertical: {
    id: 'grip_thompson_vertical',
    name: 'Thompson Vertical Grip',
    category: 'vertical_foregrip',
    era: 'interwar',
    description: 'Iconic wooden vertical foregrip',
    recoilMod: -12,
    horizontalRecoilMod: -15,
    aimSpeedMod: 0.92,
    ergoMod: -3,
    weight: 0.18,
    mountType: 'proprietary',
    weaponTypes: ['smg'],
    specificWeapons: ['thompson_m1928', 'thompson_m1'],
    durability: 0.15,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'gangster_era',
      tags: ['classic', 'thompson', 'iconic'],
    },
    rarity: 'rare',
    baseCost: 80,
    canCraft: false,
    source: ['real_world', 'hell_let_loose'],
  },
  
  // Modern
  grip_kac_vertical: {
    id: 'grip_kac_vertical',
    name: 'KAC Vertical Grip',
    category: 'vertical_foregrip',
    era: 'modern',
    description: "Knight's Armament vertical foregrip - military standard",
    recoilMod: -10,
    horizontalRecoilMod: -12,
    aimSpeedMod: 0.95,
    ergoMod: -2,
    weight: 0.12,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'military_standard',
      tags: ['military', 'kac', 'proven'],
    },
    rarity: 'common',
    baseCost: 60,
    canCraft: false,
    source: ['real_world', 'far_cry_3', 'far_cry_4'],
  },
  
  grip_tango_down_stubby: {
    id: 'grip_tango_down_stubby',
    name: 'Tango Down Stubby',
    category: 'vertical_foregrip',
    era: 'modern',
    description: 'Short vertical grip with storage compartment',
    recoilMod: -8,
    horizontalRecoilMod: -10,
    aimSpeedMod: 0.97,
    ergoMod: 0,
    weight: 0.09,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    features: { storageCompartment: true },
    durability: 0.25,
    npcPerception: {
      intimidation: 2,
      militaryGrade: true,
      recognizability: 'professional',
      tags: ['stubby', 'compact', 'storage'],
    },
    rarity: 'common',
    baseCost: 45,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  grip_bcm_gunfighter: {
    id: 'grip_bcm_gunfighter',
    name: 'BCM Gunfighter Vertical',
    category: 'vertical_foregrip',
    era: 'modern',
    description: 'Slim vertical grip with aggressive texture',
    recoilMod: -9,
    horizontalRecoilMod: -11,
    aimSpeedMod: 0.96,
    ergoMod: 1,
    weight: 0.08,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.25,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'enthusiast',
      tags: ['bcm', 'slim', 'textured'],
    },
    rarity: 'common',
    baseCost: 75,
    canCraft: false,
    source: ['real_world'],
  },
  
  grip_magpul_rvg: {
    id: 'grip_magpul_rvg',
    name: 'Magpul RVG',
    category: 'vertical_foregrip',
    era: 'modern',
    description: 'Rail Vertical Grip - polymer construction',
    recoilMod: -8,
    horizontalRecoilMod: -10,
    aimSpeedMod: 0.97,
    ergoMod: 1,
    weight: 0.07,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.3,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'civilian_tactical',
      tags: ['magpul', 'polymer', 'lightweight'],
    },
    rarity: 'common',
    baseCost: 30,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  grip_zenitco_rk1: {
    id: 'grip_zenitco_rk1',
    name: 'Zenitco RK-1',
    category: 'vertical_foregrip',
    era: 'modern',
    description: 'Russian tactical vertical foregrip',
    recoilMod: -11,
    horizontalRecoilMod: -14,
    aimSpeedMod: 0.94,
    ergoMod: -1,
    weight: 0.14,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['ak_variants'],
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'russian_tactical',
      tags: ['zenitco', 'russian', 'quality'],
    },
    rarity: 'uncommon',
    baseCost: 100,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  // Post-apocalyptic
  grip_improvised_pipe: {
    id: 'grip_improvised_pipe',
    name: 'Pipe Handle',
    category: 'vertical_foregrip',
    era: 'post_apocalyptic',
    description: 'Bent pipe attached as foregrip',
    recoilMod: -5,
    horizontalRecoilMod: -5,
    aimSpeedMod: 0.95,
    ergoMod: -4,
    weight: 0.20,
    mountType: 'improvised',
    weaponTypes: ['rifle', 'smg', 'shotgun'],
    durability: 0.5,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'scavenger',
      tags: ['improvised', 'crude', 'functional'],
    },
    rarity: 'common',
    baseCost: 5,
    canCraft: true,
    craftingMaterials: ['pipe', 'wire', 'tape'],
    source: ['stalker_2', 'far_cry_new_dawn'],
  },
};

// ============= ANGLED FOREGRIPS DATABASE =============

export const ANGLED_FOREGRIPS: Record<string, GunNutFurniture> = {
  grip_magpul_afg: {
    id: 'grip_magpul_afg',
    name: 'Magpul AFG',
    category: 'angled_foregrip',
    era: 'modern',
    description: 'Angled Fore-Grip for natural hand position',
    recoilMod: -5,
    horizontalRecoilMod: -8,
    aimSpeedMod: 1.02,
    ergoMod: 3,
    weight: 0.06,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.3,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'tactical_civilian',
      tags: ['magpul', 'angled', 'ergonomic'],
    },
    rarity: 'common',
    baseCost: 35,
    canCraft: false,
    source: ['real_world', 'far_cry_3', 'far_cry_4'],
  },
  
  grip_magpul_afg2: {
    id: 'grip_magpul_afg2',
    name: 'Magpul AFG-2',
    category: 'angled_foregrip',
    era: 'modern',
    description: 'Updated angled foregrip with improved ergonomics',
    recoilMod: -6,
    horizontalRecoilMod: -9,
    aimSpeedMod: 1.03,
    ergoMod: 4,
    weight: 0.05,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.3,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'tactical_civilian',
      tags: ['magpul', 'ergonomic', 'popular'],
    },
    rarity: 'common',
    baseCost: 35,
    canCraft: false,
    source: ['real_world', 'far_cry_4', 'far_cry_5'],
  },
  
  grip_bcm_kag: {
    id: 'grip_bcm_kag',
    name: 'BCM KAG',
    category: 'angled_foregrip',
    era: 'modern',
    description: 'Kinesthetic Angled Grip - minimal profile',
    recoilMod: -4,
    horizontalRecoilMod: -6,
    aimSpeedMod: 1.04,
    ergoMod: 4,
    weight: 0.04,
    mountType: 'mlok',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.25,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'minimalist',
      tags: ['minimalist', 'lightweight', 'ergonomic'],
    },
    rarity: 'common',
    baseCost: 25,
    canCraft: false,
    source: ['real_world'],
  },
};

// ============= HAND STOPS DATABASE =============

export const HAND_STOPS: Record<string, GunNutFurniture> = {
  grip_bcm_handstop: {
    id: 'grip_bcm_handstop',
    name: 'BCM KAG Hand Stop',
    category: 'hand_stop',
    era: 'modern',
    description: 'Minimal barrier stop for C-clamp grip',
    recoilMod: -2,
    horizontalRecoilMod: -7,
    aimSpeedMod: 1.02,
    ergoMod: 3,
    weight: 0.05,
    mountType: 'mlok',
    weaponTypes: ['rifle', 'carbine'],
    features: { reversible: true },
    durability: 0.2,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'enthusiast',
      tags: ['minimal', 'handstop', 'practical'],
    },
    rarity: 'uncommon',
    baseCost: 50,
    canCraft: false,
    source: ['real_world'],
  },
  
  grip_emissary_handbrake: {
    id: 'grip_emissary_handbrake',
    name: 'Emissary Handbrake',
    category: 'hand_stop',
    era: 'modern',
    description: 'Premium hand stop with integrated barricade support',
    recoilMod: -3,
    horizontalRecoilMod: -5,
    aimSpeedMod: 1.04,
    ergoMod: 4,
    weight: 0.03,
    mountType: 'mlok',
    weaponTypes: ['rifle', 'carbine'],
    features: { barricadeSupport: true },
    durability: 0.2,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'premium',
      tags: ['premium', 'barricade', 'quality'],
    },
    rarity: 'common',
    baseCost: 20,
    canCraft: false,
    source: ['real_world'],
  },
};

// ============= STOCKS DATABASE =============

export const STOCKS: Record<string, GunNutFurniture> = {
  stock_m4_fixed: {
    id: 'stock_m4_fixed',
    name: 'A2 Fixed Stock',
    category: 'stock',
    era: 'modern',
    description: 'Full-length fixed rifle stock for maximum stability',
    recoilMod: -18,
    horizontalRecoilMod: -12,
    aimSpeedMod: 0.92,
    ergoMod: -5,
    weight: 0.38,
    stockType: 'fixed',
    lengthOfPull: 13.5,
    mountType: 'proprietary',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['m16', 'ar15_variants'],
    durability: 0.15,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'military',
      tags: ['fixed', 'stable', 'military'],
    },
    rarity: 'common',
    baseCost: 40,
    canCraft: false,
    source: ['real_world', 'far_cry_3'],
  },
  
  stock_magpul_ctr: {
    id: 'stock_magpul_ctr',
    name: 'Magpul CTR Stock',
    category: 'stock',
    era: 'modern',
    description: 'Compact/Type Restricted stock with friction lock',
    recoilMod: -12,
    horizontalRecoilMod: -8,
    aimSpeedMod: 0.98,
    ergoMod: 5,
    weight: 0.22,
    stockType: 'collapsible',
    lengthOfPull: 13.25,
    mountType: 'proprietary',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['ar15_variants'],
    features: { qd: true },
    durability: 0.25,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'tactical_civilian',
      tags: ['magpul', 'adjustable', 'popular'],
    },
    rarity: 'common',
    baseCost: 65,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  stock_vltor_emod: {
    id: 'stock_vltor_emod',
    name: 'VLTOR EMOD Stock',
    category: 'stock',
    era: 'modern',
    description: 'Enhanced modular stock with battery storage',
    recoilMod: -15,
    horizontalRecoilMod: -10,
    aimSpeedMod: 0.95,
    ergoMod: 3,
    weight: 0.32,
    stockType: 'collapsible',
    cheekRiser: true,
    mountType: 'proprietary',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['ar15_variants'],
    features: { storageCompartment: true, qd: true },
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'professional',
      tags: ['vltor', 'modular', 'storage'],
    },
    rarity: 'uncommon',
    baseCost: 120,
    canCraft: false,
    source: ['real_world'],
  },
  
  stock_precision_prs: {
    id: 'stock_precision_prs',
    name: 'Magpul PRS Gen 3',
    category: 'stock',
    era: 'modern',
    description: 'Precision Rifle/Sniper stock with full adjustability',
    recoilMod: -20,
    horizontalRecoilMod: -15,
    aimSpeedMod: 0.88,
    ergoMod: -3,
    weight: 0.62,
    stockType: 'precision',
    cheekRiser: true,
    lengthOfPull: 15.5,
    mountType: 'proprietary',
    weaponTypes: ['rifle'],
    features: { qd: true },
    durability: 0.15,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'precision',
      tags: ['precision', 'sniper', 'adjustable'],
    },
    rarity: 'rare',
    baseCost: 280,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  stock_ak_folding: {
    id: 'stock_ak_folding',
    name: 'AK Side-Folding Stock',
    category: 'stock',
    era: 'cold_war_late',
    description: 'Triangle folding stock for compact transport',
    recoilMod: -8,
    horizontalRecoilMod: -5,
    aimSpeedMod: 1.02,
    ergoMod: 8,
    weight: 0.25,
    stockType: 'folding',
    mountType: 'proprietary',
    weaponTypes: ['rifle'],
    specificWeapons: ['ak_variants', 'aks74'],
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'soviet',
      tags: ['folding', 'compact', 'ak'],
    },
    rarity: 'common',
    baseCost: 50,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  stock_wire: {
    id: 'stock_wire',
    name: 'Wire Stock',
    category: 'stock',
    era: 'vietnam',
    description: 'Minimalist wire stock for maximum compactness',
    recoilMod: -5,
    horizontalRecoilMod: -3,
    aimSpeedMod: 1.05,
    ergoMod: 10,
    weight: 0.15,
    stockType: 'wire',
    mountType: 'proprietary',
    weaponTypes: ['smg', 'pistol'],
    durability: 0.3,
    npcPerception: {
      intimidation: 2,
      militaryGrade: true,
      recognizability: 'compact',
      tags: ['wire', 'minimal', 'light'],
    },
    rarity: 'common',
    baseCost: 30,
    canCraft: false,
    source: ['real_world', 'far_cry_3'],
  },
};

// ============= BIPODS DATABASE =============

export const BIPODS: Record<string, GunNutFurniture> = {
  bipod_harris: {
    id: 'bipod_harris',
    name: 'Harris S-BRM Bipod',
    category: 'bipod',
    era: 'modern',
    description: 'Industry standard precision bipod with swivel',
    recoilMod: -35,
    horizontalRecoilMod: -30,
    aimSpeedMod: 0.85,
    ergoMod: -12,
    weight: 0.32,
    mountType: 'picatinny',
    weaponTypes: ['rifle'],
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'precision',
      tags: ['harris', 'stable', 'precision'],
    },
    rarity: 'uncommon',
    baseCost: 100,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  bipod_atlas: {
    id: 'bipod_atlas',
    name: 'Atlas PSR Bipod',
    category: 'bipod',
    era: 'modern',
    description: 'Premium precision bipod with panning and cant',
    recoilMod: -40,
    horizontalRecoilMod: -35,
    aimSpeedMod: 0.82,
    ergoMod: -10,
    weight: 0.38,
    mountType: 'picatinny',
    weaponTypes: ['rifle'],
    durability: 0.15,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'premium',
      tags: ['atlas', 'premium', 'adjustable'],
    },
    rarity: 'rare',
    baseCost: 350,
    canCraft: false,
    source: ['real_world'],
  },
  
  bipod_grip_pod: {
    id: 'bipod_grip_pod',
    name: 'Grip Pod',
    category: 'bipod',
    era: 'modern',
    description: 'Bipod and vertical grip combo',
    recoilMod: -20,
    horizontalRecoilMod: -18,
    aimSpeedMod: 0.90,
    ergoMod: -5,
    weight: 0.28,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.35,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'military',
      tags: ['combo', 'versatile', 'military'],
    },
    rarity: 'uncommon',
    baseCost: 85,
    canCraft: false,
    source: ['real_world', 'far_cry_4'],
  },
};

// ============= HELPER FUNCTIONS =============

/**
 * Get all furniture by category
 */
export function getFurnitureByCategory(category: FurnitureCategory): GunNutFurniture[] {
  const allFurniture = [
    ...Object.values(VERTICAL_FOREGRIPS),
    ...Object.values(ANGLED_FOREGRIPS),
    ...Object.values(HAND_STOPS),
    ...Object.values(STOCKS),
    ...Object.values(BIPODS),
  ];
  
  return allFurniture.filter(item => item.category === category);
}

/**
 * Calculate ergonomics bonus from furniture
 */
export function calculateFurnitureErgo(
  furniture: GunNutFurniture,
  depth: GunNutDepth = 'standard'
): number {
  let ergo = furniture.ergoMod;
  
  if (depth !== 'standard' && furniture.condition !== undefined) {
    if (furniture.condition < 70) {
      const penalty = ((70 - furniture.condition) / 100) * Math.abs(ergo) * 0.3;
      ergo -= Math.sign(ergo) * penalty;
    }
  }
  
  return ergo;
}

export default {
  VERTICAL_FOREGRIPS,
  ANGLED_FOREGRIPS,
  HAND_STOPS,
  STOCKS,
  BIPODS,
  getFurnitureByCategory,
  calculateFurnitureErgo,
};
