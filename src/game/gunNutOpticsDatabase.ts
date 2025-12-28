/**
 * Gun Nut Optics Database - Part 1 from Universal Weapon Attachment Database
 * Era-classified optics from iron sights to thermal/neural interfaces.
 * Sources: Far Cry Series, Stalker 2, Cyberpunk 2077, SCP 5K, Real-World Military
 */

import { GunNutDepth } from '@/lib/gameSettings';

// ============= ERA CLASSIFICATION =============

export type WeaponEra = 
  | 'primitive'
  | 'early_firearms'
  | 'civil_war'
  | 'ww1'
  | 'interwar'
  | 'ww2'
  | 'cold_war_early'
  | 'vietnam'
  | 'cold_war_late'
  | 'post_cold_war'
  | 'modern'
  | 'near_future'
  | 'cyberpunk'
  | 'far_future'
  | 'anomalous'
  | 'post_apocalyptic'
  | 'universal';

// ============= OPTIC TYPES =============

export type OpticCategory = 
  | 'irons'
  | 'red_dot'
  | 'holographic'
  | 'prism'
  | 'magnified'
  | 'lpvo'
  | 'thermal'
  | 'night_vision'
  | 'smart_optic'
  | 'neural_interface';

export type MountType = 
  | 'integrated'
  | 'picatinny'
  | 'mlok'
  | 'keymod'
  | 'dovetail'
  | 'side_rail'
  | 'proprietary'
  | 'improvised';

// ============= OPTIC INTERFACE =============

export interface GunNutOptic {
  id: string;
  name: string;
  category: OpticCategory;
  era: WeaponEra;
  description: string;
  
  // Optical properties
  magnification: number;           // 1x for no magnification
  magnificationRange?: [number, number]; // For variable optics
  fieldOfView: number;             // Degrees
  eyeRelief: number;               // mm
  
  // Performance modifiers
  aimSpeedMod: number;             // 0.7-1.2
  accuracyMod: number;             // -5 to +35
  ergoMod: number;                 // -20 to +5
  
  // Physical
  weight: number;                  // kg
  
  // Compatibility
  mountType: MountType;
  weaponTypes: string[];
  specificWeapons?: string[];
  excludeWeapons?: string[];
  
  // Power requirements (for electronic optics)
  batteryRequired?: boolean;
  batteryType?: string;
  batteryLife?: number;            // Hours
  
  // Condition (Gun Nut+)
  condition?: number;
  maxCondition?: number;
  durability: number;              // 0.1-1.0 (lower = more durable)
  
  // NPC Perception
  npcPerception: {
    intimidation: number;          // 0-5
    militaryGrade: boolean;
    recognizability: string;
    tags: string[];
  };
  
  // Economy
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseCost: number;
  canCraft: boolean;
  craftingMaterials?: string[];
  
  // Source
  source: string[];
}

// ============= IRON SIGHTS DATABASE =============

export const IRON_SIGHTS: Record<string, GunNutOptic> = {
  // WW1 Era
  iron_ladder: {
    id: 'iron_ladder',
    name: 'Ladder Sight',
    category: 'irons',
    era: 'ww1',
    description: 'Adjustable ladder rear sight for volley fire at range',
    magnification: 1,
    fieldOfView: 180,
    eyeRelief: 0,
    aimSpeedMod: 0.95,
    accuracyMod: 2,
    ergoMod: -1,
    weight: 0.08,
    mountType: 'integrated',
    weaponTypes: ['rifle', 'machine_gun'],
    specificWeapons: ['lee_enfield', 'gewehr_98', 'springfield_1903', 'mosin_nagant'],
    durability: 0.1,
    npcPerception: {
      intimidation: 0,
      militaryGrade: true,
      recognizability: 'period_military',
      tags: ['vintage', 'military', 'standard_issue'],
    },
    rarity: 'common',
    baseCost: 0,
    canCraft: false,
    source: ['real_world', 'hell_let_loose'],
  },
  
  // WW2 Era
  iron_peep_ww2: {
    id: 'iron_peep_ww2',
    name: 'Aperture Peep Sight',
    category: 'irons',
    era: 'ww2',
    description: 'Peep sight for faster target acquisition',
    magnification: 1,
    fieldOfView: 180,
    eyeRelief: 0,
    aimSpeedMod: 1.05,
    accuracyMod: 5,
    ergoMod: 0,
    weight: 0.04,
    mountType: 'integrated',
    weaponTypes: ['rifle', 'smg', 'carbine'],
    specificWeapons: ['m1_garand', 'm1_carbine', 'thompson', 'stg44'],
    durability: 0.1,
    npcPerception: {
      intimidation: 0,
      militaryGrade: true,
      recognizability: 'period_military',
      tags: ['vintage', 'military', 'effective'],
    },
    rarity: 'common',
    baseCost: 0,
    canCraft: false,
    source: ['real_world', 'hell_let_loose'],
  },
  
  // Modern Era
  iron_ar15_a2: {
    id: 'iron_ar15_a2',
    name: 'A2 Front Sight Post',
    category: 'irons',
    era: 'modern',
    description: 'Standard AR-15/M16 front sight tower',
    magnification: 1,
    fieldOfView: 180,
    eyeRelief: 0,
    aimSpeedMod: 1.0,
    accuracyMod: 3,
    ergoMod: -1,
    weight: 0.05,
    mountType: 'integrated',
    weaponTypes: ['rifle', 'carbine'],
    specificWeapons: ['m16', 'm4', 'ar15_variants'],
    durability: 0.1,
    npcPerception: {
      intimidation: 2,
      militaryGrade: true,
      recognizability: 'military_standard',
      tags: ['military', 'ar15', 'standard'],
    },
    rarity: 'common',
    baseCost: 0,
    canCraft: false,
    source: ['real_world', 'far_cry_3', 'far_cry_4', 'far_cry_5'],
  },
  
  iron_flip_magpul: {
    id: 'iron_flip_magpul',
    name: 'Magpul MBUS',
    category: 'irons',
    era: 'modern',
    description: 'Polymer flip-up backup sights',
    magnification: 1,
    fieldOfView: 180,
    eyeRelief: 0,
    aimSpeedMod: 1.02,
    accuracyMod: 4,
    ergoMod: 0,
    weight: 0.06,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.3,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'tactical_civilian',
      tags: ['backup', 'polymer', 'practical'],
    },
    rarity: 'common',
    baseCost: 50,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  iron_flip_troy: {
    id: 'iron_flip_troy',
    name: 'Troy Industries BUIS',
    category: 'irons',
    era: 'modern',
    description: 'Metal flip-up backup sights with HK-style front',
    magnification: 1,
    fieldOfView: 180,
    eyeRelief: 0,
    aimSpeedMod: 1.03,
    accuracyMod: 6,
    ergoMod: -1,
    weight: 0.10,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    durability: 0.2,
    npcPerception: {
      intimidation: 2,
      militaryGrade: true,
      recognizability: 'professional',
      tags: ['metal', 'quality', 'military'],
    },
    rarity: 'uncommon',
    baseCost: 150,
    canCraft: false,
    source: ['real_world'],
  },
};

// ============= RED DOT SIGHTS DATABASE =============

export const RED_DOT_SIGHTS: Record<string, GunNutOptic> = {
  reddot_aimpoint_pro: {
    id: 'reddot_aimpoint_pro',
    name: 'Aimpoint PRO',
    category: 'red_dot',
    era: 'modern',
    description: 'Professional-grade red dot with extreme battery life',
    magnification: 1,
    fieldOfView: 40,
    eyeRelief: 0,
    aimSpeedMod: 1.15,
    accuracyMod: 8,
    ergoMod: -2,
    weight: 0.21,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    batteryRequired: true,
    batteryType: 'cr2032',
    batteryLife: 30000,
    durability: 0.2,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'professional',
      tags: ['aimpoint', 'reliable', 'quality'],
    },
    rarity: 'uncommon',
    baseCost: 450,
    canCraft: false,
    source: ['real_world', 'far_cry_5'],
  },
  
  reddot_aimpoint_t2: {
    id: 'reddot_aimpoint_t2',
    name: 'Aimpoint Micro T-2',
    category: 'red_dot',
    era: 'modern',
    description: 'Compact professional red dot with improved lens clarity',
    magnification: 1,
    fieldOfView: 35,
    eyeRelief: 0,
    aimSpeedMod: 1.18,
    accuracyMod: 10,
    ergoMod: 0,
    weight: 0.084,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'pistol'],
    batteryRequired: true,
    batteryType: 'cr2032',
    batteryLife: 50000,
    durability: 0.15,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'high_end',
      tags: ['aimpoint', 'compact', 'premium'],
    },
    rarity: 'rare',
    baseCost: 850,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
  
  reddot_sig_romeo5: {
    id: 'reddot_sig_romeo5',
    name: 'SIG ROMEO5',
    category: 'red_dot',
    era: 'modern',
    description: 'Budget-friendly red dot with motion activation',
    magnification: 1,
    fieldOfView: 38,
    eyeRelief: 0,
    aimSpeedMod: 1.12,
    accuracyMod: 6,
    ergoMod: -1,
    weight: 0.15,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    batteryRequired: true,
    batteryType: 'aaa',
    batteryLife: 10000,
    durability: 0.35,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'tactical_civilian',
      tags: ['sig', 'budget', 'motion_activation'],
    },
    rarity: 'common',
    baseCost: 120,
    canCraft: false,
    source: ['real_world', 'far_cry_6'],
  },
  
  reddot_holosun_510c: {
    id: 'reddot_holosun_510c',
    name: 'Holosun 510C',
    category: 'red_dot',
    era: 'modern',
    description: 'Open reflex with solar backup and shake-awake',
    magnification: 1,
    fieldOfView: 45,
    eyeRelief: 0,
    aimSpeedMod: 1.14,
    accuracyMod: 7,
    ergoMod: 0,
    weight: 0.21,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    batteryRequired: true,
    batteryType: 'cr2032',
    batteryLife: 50000,
    durability: 0.3,
    npcPerception: {
      intimidation: 2,
      militaryGrade: false,
      recognizability: 'enthusiast',
      tags: ['holosun', 'solar', 'value'],
    },
    rarity: 'common',
    baseCost: 280,
    canCraft: false,
    source: ['real_world'],
  },
  
  // Post-apocalyptic
  reddot_improvised: {
    id: 'reddot_improvised',
    name: 'Salvaged Red Dot',
    category: 'red_dot',
    era: 'post_apocalyptic',
    description: 'Cracked and taped red dot sight - still functional',
    magnification: 1,
    fieldOfView: 30,
    eyeRelief: 0,
    aimSpeedMod: 1.05,
    accuracyMod: 2,
    ergoMod: -3,
    weight: 0.25,
    mountType: 'improvised',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    batteryRequired: true,
    batteryType: 'scavenged',
    batteryLife: 100,
    durability: 0.7,
    npcPerception: {
      intimidation: 1,
      militaryGrade: false,
      recognizability: 'scavenger',
      tags: ['improvised', 'damaged', 'functional'],
    },
    rarity: 'common',
    baseCost: 25,
    canCraft: true,
    craftingMaterials: ['broken_optic', 'tape', 'battery'],
    source: ['stalker_2', 'far_cry_new_dawn'],
  },
};

// ============= HOLOGRAPHIC SIGHTS DATABASE =============

export const HOLOGRAPHIC_SIGHTS: Record<string, GunNutOptic> = {
  holo_eotech_xps2: {
    id: 'holo_eotech_xps2',
    name: 'EOTech XPS2',
    category: 'holographic',
    era: 'modern',
    description: 'Compact holographic sight with 68 MOA ring reticle',
    magnification: 1,
    fieldOfView: 50,
    eyeRelief: 0,
    aimSpeedMod: 1.12,
    accuracyMod: 8,
    ergoMod: -1,
    weight: 0.26,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    batteryRequired: true,
    batteryType: 'cr123a',
    batteryLife: 600,
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'special_ops',
      tags: ['eotech', 'holographic', 'quality'],
    },
    rarity: 'uncommon',
    baseCost: 500,
    canCraft: false,
    source: ['real_world', 'far_cry_3', 'far_cry_4', 'far_cry_5'],
  },
  
  holo_eotech_exps3: {
    id: 'holo_eotech_exps3',
    name: 'EOTech EXPS3',
    category: 'holographic',
    era: 'modern',
    description: 'Night vision compatible holographic with QD mount',
    magnification: 1,
    fieldOfView: 55,
    eyeRelief: 0,
    aimSpeedMod: 1.14,
    accuracyMod: 10,
    ergoMod: -1,
    weight: 0.32,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    batteryRequired: true,
    batteryType: 'cr123a',
    batteryLife: 600,
    durability: 0.2,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'tier_one',
      tags: ['eotech', 'nv_compatible', 'premium'],
    },
    rarity: 'rare',
    baseCost: 700,
    canCraft: false,
    source: ['real_world', 'scp_5k'],
  },
  
  holo_vortex_uh1: {
    id: 'holo_vortex_uh1',
    name: 'Vortex UH-1 Huey',
    category: 'holographic',
    era: 'modern',
    description: 'Made-in-USA holographic with distinctive housing',
    magnification: 1,
    fieldOfView: 48,
    eyeRelief: 0,
    aimSpeedMod: 1.10,
    accuracyMod: 7,
    ergoMod: -2,
    weight: 0.33,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg', 'shotgun'],
    batteryRequired: true,
    batteryType: 'cr123a',
    batteryLife: 1500,
    durability: 0.25,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'enthusiast',
      tags: ['vortex', 'unique', 'american'],
    },
    rarity: 'uncommon',
    baseCost: 450,
    canCraft: false,
    source: ['real_world'],
  },
};

// ============= MAGNIFIED OPTICS DATABASE =============

export const MAGNIFIED_OPTICS: Record<string, GunNutOptic> = {
  scope_acog_4x: {
    id: 'scope_acog_4x',
    name: 'Trijicon ACOG 4x32',
    category: 'magnified',
    era: 'modern',
    description: 'Battle-proven fixed 4x prism scope with illuminated reticle',
    magnification: 4,
    fieldOfView: 7,
    eyeRelief: 38,
    aimSpeedMod: 0.88,
    accuracyMod: 18,
    ergoMod: -5,
    weight: 0.36,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.15,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'military_standard',
      tags: ['acog', 'trijicon', 'battle_proven'],
    },
    rarity: 'rare',
    baseCost: 1200,
    canCraft: false,
    source: ['real_world', 'far_cry_3', 'far_cry_4', 'far_cry_5'],
  },
  
  scope_lpvo_1_6x: {
    id: 'scope_lpvo_1_6x',
    name: 'LPVO 1-6x24',
    category: 'lpvo',
    era: 'modern',
    description: 'Variable power scope for versatile engagement ranges',
    magnification: 1,
    magnificationRange: [1, 6],
    fieldOfView: 16,
    eyeRelief: 90,
    aimSpeedMod: 0.92,
    accuracyMod: 15,
    ergoMod: -6,
    weight: 0.52,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine'],
    durability: 0.35,
    npcPerception: {
      intimidation: 3,
      militaryGrade: true,
      recognizability: 'modern_tactical',
      tags: ['lpvo', 'variable', 'versatile'],
    },
    rarity: 'uncommon',
    baseCost: 600,
    canCraft: false,
    source: ['real_world', 'far_cry_6'],
  },
  
  scope_sniper_8x: {
    id: 'scope_sniper_8x',
    name: 'Sniper Scope 8x',
    category: 'magnified',
    era: 'modern',
    description: 'Long range precision optic with mil-dot reticle',
    magnification: 8,
    fieldOfView: 4,
    eyeRelief: 85,
    aimSpeedMod: 0.75,
    accuracyMod: 28,
    ergoMod: -12,
    weight: 0.65,
    mountType: 'picatinny',
    weaponTypes: ['rifle'],
    durability: 0.4,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'sniper',
      tags: ['sniper', 'precision', 'long_range'],
    },
    rarity: 'rare',
    baseCost: 800,
    canCraft: false,
    source: ['real_world', 'stalker_2', 'far_cry_3'],
  },
  
  scope_sniper_12x: {
    id: 'scope_sniper_12x',
    name: 'Tactical Scope 12x50',
    category: 'magnified',
    era: 'modern',
    description: 'High magnification precision scope for extreme range',
    magnification: 12,
    fieldOfView: 2.5,
    eyeRelief: 90,
    aimSpeedMod: 0.65,
    accuracyMod: 35,
    ergoMod: -18,
    weight: 0.85,
    mountType: 'picatinny',
    weaponTypes: ['rifle'],
    durability: 0.45,
    npcPerception: {
      intimidation: 5,
      militaryGrade: true,
      recognizability: 'sniper_elite',
      tags: ['extreme_range', 'precision', 'heavy'],
    },
    rarity: 'epic',
    baseCost: 1500,
    canCraft: false,
    source: ['real_world', 'stalker_2'],
  },
};

// ============= THERMAL / NIGHT VISION DATABASE =============

export const THERMAL_NV_OPTICS: Record<string, GunNutOptic> = {
  thermal_flir: {
    id: 'thermal_flir',
    name: 'FLIR Thermal Scope',
    category: 'thermal',
    era: 'modern',
    description: 'See heat signatures through smoke, darkness, and foliage',
    magnification: 3,
    fieldOfView: 12,
    eyeRelief: 70,
    aimSpeedMod: 0.80,
    accuracyMod: 15,
    ergoMod: -15,
    weight: 0.75,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine'],
    batteryRequired: true,
    batteryType: 'cr123a',
    batteryLife: 4,
    durability: 0.6,
    npcPerception: {
      intimidation: 5,
      militaryGrade: true,
      recognizability: 'high_tech',
      tags: ['thermal', 'night_ops', 'premium'],
    },
    rarity: 'legendary',
    baseCost: 5000,
    canCraft: false,
    source: ['real_world', 'scp_5k'],
  },
  
  nvg_pvs14: {
    id: 'nvg_pvs14',
    name: 'PVS-14 Night Vision',
    category: 'night_vision',
    era: 'modern',
    description: 'Gen3 night vision monocular for weapon mounting',
    magnification: 1,
    fieldOfView: 40,
    eyeRelief: 0,
    aimSpeedMod: 0.85,
    accuracyMod: 5,
    ergoMod: -10,
    weight: 0.35,
    mountType: 'picatinny',
    weaponTypes: ['rifle', 'carbine', 'smg'],
    batteryRequired: true,
    batteryType: 'aa',
    batteryLife: 40,
    durability: 0.5,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'special_ops',
      tags: ['night_vision', 'gen3', 'military'],
    },
    rarity: 'epic',
    baseCost: 3500,
    canCraft: false,
    source: ['real_world', 'scp_5k', 'stalker_2'],
  },
};

// ============= CYBERPUNK / SCI-FI OPTICS =============

export const SCIFI_OPTICS: Record<string, GunNutOptic> = {
  smart_link: {
    id: 'smart_link',
    name: 'Smart Link Interface',
    category: 'smart_optic',
    era: 'cyberpunk',
    description: 'Direct neural interface for weapon targeting',
    magnification: 1,
    magnificationRange: [1, 8],
    fieldOfView: 120,
    eyeRelief: 0,
    aimSpeedMod: 1.30,
    accuracyMod: 25,
    ergoMod: 5,
    weight: 0.05,
    mountType: 'proprietary',
    weaponTypes: ['smart_weapon'],
    batteryRequired: true,
    batteryType: 'neural_power',
    batteryLife: 1000,
    durability: 0.3,
    npcPerception: {
      intimidation: 4,
      militaryGrade: true,
      recognizability: 'cyberware',
      tags: ['smart', 'neural', 'high_tech'],
    },
    rarity: 'epic',
    baseCost: 10000,
    canCraft: false,
    source: ['cyberpunk_2077'],
  },
  
  kiroshi_optics: {
    id: 'kiroshi_optics',
    name: 'Kiroshi Optical Scanner',
    category: 'neural_interface',
    era: 'cyberpunk',
    description: 'Cyberware optics with zoom, threat detection, and trajectory calculation',
    magnification: 1,
    magnificationRange: [1, 12],
    fieldOfView: 180,
    eyeRelief: 0,
    aimSpeedMod: 1.25,
    accuracyMod: 20,
    ergoMod: 0,
    weight: 0,
    mountType: 'proprietary',
    weaponTypes: ['any'],
    batteryRequired: false,
    durability: 0.1,
    npcPerception: {
      intimidation: 3,
      militaryGrade: false,
      recognizability: 'cyberware',
      tags: ['kiroshi', 'implant', 'scanner'],
    },
    rarity: 'rare',
    baseCost: 8000,
    canCraft: false,
    source: ['cyberpunk_2077'],
  },
};

// ============= HELPER FUNCTIONS =============

/**
 * Check if optic is compatible with weapon era
 */
export function isEraCompatible(
  opticEra: WeaponEra, 
  weaponEra: WeaponEra, 
  strictMode: boolean = false
): boolean {
  if (opticEra === 'universal') return true;
  if (opticEra === weaponEra) return true;
  
  // Anomalous/post-apocalyptic can blend with anything
  if (opticEra === 'anomalous' || opticEra === 'post_apocalyptic') return true;
  if (weaponEra === 'post_apocalyptic') return true;
  
  if (strictMode) return false;
  
  // Non-strict: allow adjacent eras
  const eraOrder: WeaponEra[] = [
    'primitive', 'early_firearms', 'civil_war', 'ww1', 'interwar', 'ww2',
    'cold_war_early', 'vietnam', 'cold_war_late', 'post_cold_war', 'modern',
    'near_future', 'cyberpunk', 'far_future'
  ];
  
  const opticIdx = eraOrder.indexOf(opticEra);
  const weaponIdx = eraOrder.indexOf(weaponEra);
  
  if (opticIdx === -1 || weaponIdx === -1) return false;
  
  // Allow 1 era forward (old gun with newer attachment)
  // Allow 2 eras back (new gun with older attachment)
  return opticIdx <= weaponIdx + 1 && opticIdx >= weaponIdx - 2;
}

/**
 * Get all valid optics for a weapon era
 */
export function getValidOptics(weaponEra: WeaponEra, strictMode: boolean = false): GunNutOptic[] {
  const allOptics = [
    ...Object.values(IRON_SIGHTS),
    ...Object.values(RED_DOT_SIGHTS),
    ...Object.values(HOLOGRAPHIC_SIGHTS),
    ...Object.values(MAGNIFIED_OPTICS),
    ...Object.values(THERMAL_NV_OPTICS),
    ...Object.values(SCIFI_OPTICS),
  ];
  
  return allOptics.filter(optic => isEraCompatible(optic.era, weaponEra, strictMode));
}

/**
 * Calculate optic's accuracy contribution based on condition
 */
export function calculateOpticAccuracy(
  optic: GunNutOptic, 
  depth: GunNutDepth = 'standard'
): number {
  let accuracy = optic.accuracyMod;
  
  if (depth !== 'standard' && optic.condition !== undefined) {
    // Condition affects accuracy in Gun Nut modes
    if (optic.condition < 80) {
      const penalty = ((80 - optic.condition) / 100) * (optic.accuracyMod * 0.3);
      accuracy -= penalty;
    }
  }
  
  return Math.max(0, accuracy);
}

export default {
  IRON_SIGHTS,
  RED_DOT_SIGHTS,
  HOLOGRAPHIC_SIGHTS,
  MAGNIFIED_OPTICS,
  THERMAL_NV_OPTICS,
  SCIFI_OPTICS,
  isEraCompatible,
  getValidOptics,
  calculateOpticAccuracy,
};
