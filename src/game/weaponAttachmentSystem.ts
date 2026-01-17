/**
 * Weapon Attachment System - Tarkov-style weapon customization
 * Manages weapon parts, attachments, and their individual conditions.
 */

import { WeaponType, WeaponWearSystem, Weapon } from './weaponWearSystem';

// ============= ATTACHMENT SLOT TYPES =============

export type AttachmentSlot = 
  | 'barrel'
  | 'muzzle'
  | 'handguard'
  | 'grip'
  | 'stock'
  | 'magazine'
  | 'sights'
  | 'optic'
  | 'tactical_rail_top'
  | 'tactical_rail_side'
  | 'tactical_rail_bottom'
  | 'bayonet';  // Added bayonet slot

export type TacticalAttachmentType =
  | 'flashlight'
  | 'laser_red'
  | 'laser_green'
  | 'laser_ir'
  | 'foregrip_vertical'
  | 'foregrip_angled'
  | 'bipod'
  | 'grenade_launcher'
  | 'bayonet_knife'      // Standard knife bayonet
  | 'bayonet_spike'      // Spike bayonet
  | 'bayonet_sword';     // Sword bayonet for ceremonial/older rifles

export type OpticType =
  | 'iron_sights'
  | 'red_dot'
  | 'holographic'
  | 'acog_4x'
  | 'lpvo_1_6x'
  | 'scope_8x'
  | 'scope_12x'
  | 'thermal'
  | 'night_vision';

export type MuzzleType =
  | 'flash_hider'
  | 'compensator'
  | 'muzzle_brake'
  | 'suppressor_small'
  | 'suppressor_large';

export type MagazineType =
  | 'standard'
  | 'extended'
  | 'drum'
  | 'reduced';

// ============= ATTACHMENT INTERFACE =============

export interface WeaponAttachment {
  id: string;
  name: string;
  slot: AttachmentSlot;
  subType?: TacticalAttachmentType | OpticType | MuzzleType | MagazineType;
  condition: number;         // 0-100
  maxCondition: number;      // Degrades over time
  durability: number;        // How fast it wears (lower = more durable)
  weight: number;            // In grams
  
  // Stat modifiers
  modifiers: AttachmentModifiers;
  
  // Visual
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface AttachmentModifiers {
  accuracy?: number;         // % change
  recoil?: number;           // % change (negative = less recoil)
  ergonomics?: number;       // Handling speed
  noise?: number;            // % change (negative = quieter)
  aimSpeed?: number;         // ADS speed modifier
  magCapacity?: number;      // Magazine size change
  muzzleVelocity?: number;   // Bullet speed %
  weight?: number;           // Total weight modifier
  hipfireSpread?: number;    // Hip fire accuracy
}

// ============= EXTENDED WEAPON WITH ATTACHMENTS =============

export interface ExtendedWeapon extends Weapon {
  attachments: Partial<Record<AttachmentSlot, WeaponAttachment>>;
  
  // Core part conditions (for detailed view)
  partConditions: {
    receiver: number;        // Main body
    barrel: number;
    trigger: number;
    bolt: number;
    feedSystem: number;      // Magazine well, feed ramp
  };
  
  // Computed stats
  effectiveStats?: WeaponEffectiveStats;
}

export interface WeaponEffectiveStats {
  baseDamage: number;
  accuracy: number;
  recoil: number;
  ergonomics: number;
  noise: number;
  weight: number;
  aimSpeed: number;
  effectiveRange: number;
  rateOfFire: number;
  magCapacity: number;
}

// ============= ATTACHMENT DEFINITIONS =============

const BARREL_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  standard_barrel: {
    name: 'Standard Barrel',
    durability: 0.5,
    weight: 400,
    modifiers: {},
    rarity: 'common',
    description: 'Factory standard barrel. Reliable but unremarkable.',
  },
  match_barrel: {
    name: 'Match Grade Barrel',
    durability: 0.3,
    weight: 450,
    modifiers: { accuracy: 15, muzzleVelocity: 5 },
    rarity: 'rare',
    description: 'Precision-manufactured for competitive accuracy.',
  },
  short_barrel: {
    name: 'Short Barrel',
    durability: 0.6,
    weight: 280,
    modifiers: { accuracy: -10, ergonomics: 10, noise: 15 },
    rarity: 'uncommon',
    description: 'Compact barrel for close quarters. Louder and less accurate.',
  },
  heavy_barrel: {
    name: 'Heavy Bull Barrel',
    durability: 0.2,
    weight: 700,
    modifiers: { accuracy: 20, recoil: -10, ergonomics: -15 },
    rarity: 'rare',
    description: 'Thick-walled barrel for sustained fire. Heavy but accurate.',
  },
};

const MUZZLE_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  flash_hider: {
    name: 'Flash Hider',
    subType: 'flash_hider',
    durability: 0.4,
    weight: 80,
    modifiers: { noise: -5 },
    rarity: 'common',
    description: 'Reduces muzzle flash. Standard military issue.',
  },
  compensator: {
    name: 'Compensator',
    subType: 'compensator',
    durability: 0.5,
    weight: 120,
    modifiers: { recoil: -15, noise: 10 },
    rarity: 'uncommon',
    description: 'Redirects gas to reduce vertical recoil. Louder.',
  },
  muzzle_brake: {
    name: 'Muzzle Brake',
    subType: 'muzzle_brake',
    durability: 0.5,
    weight: 140,
    modifiers: { recoil: -25, noise: 20 },
    rarity: 'rare',
    description: 'Aggressive recoil reduction. Very loud.',
  },
  suppressor_small: {
    name: 'Compact Suppressor',
    subType: 'suppressor_small',
    durability: 0.8,
    weight: 200,
    modifiers: { noise: -40, accuracy: 5, ergonomics: -5 },
    rarity: 'rare',
    description: 'Lightweight sound reduction. Limited durability.',
  },
  suppressor_large: {
    name: 'Full Suppressor',
    subType: 'suppressor_large',
    durability: 0.6,
    weight: 400,
    modifiers: { noise: -60, accuracy: 8, recoil: -5, ergonomics: -12 },
    rarity: 'epic',
    description: 'Maximum sound suppression. Significant added length.',
  },
};

const OPTIC_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  iron_sights: {
    name: 'Iron Sights',
    subType: 'iron_sights',
    durability: 0.1,
    weight: 50,
    modifiers: {},
    rarity: 'common',
    description: 'Standard open sights. Reliable but basic.',
  },
  red_dot: {
    name: 'Red Dot Sight',
    subType: 'red_dot',
    durability: 0.4,
    weight: 80,
    modifiers: { aimSpeed: 10, accuracy: 5 },
    rarity: 'common',
    description: 'Fast target acquisition. Battery powered.',
  },
  holographic: {
    name: 'Holographic Sight',
    subType: 'holographic',
    durability: 0.5,
    weight: 120,
    modifiers: { aimSpeed: 8, accuracy: 8 },
    rarity: 'uncommon',
    description: 'Wide field of view with quick acquisition.',
  },
  acog_4x: {
    name: 'ACOG 4x Scope',
    subType: 'acog_4x',
    durability: 0.3,
    weight: 300,
    modifiers: { accuracy: 20, aimSpeed: -10, ergonomics: -5 },
    rarity: 'rare',
    description: 'Fixed 4x magnification. Rugged and precise.',
  },
  lpvo: {
    name: 'LPVO 1-6x',
    subType: 'lpvo_1_6x',
    durability: 0.6,
    weight: 450,
    modifiers: { accuracy: 25, aimSpeed: -15, ergonomics: -8 },
    rarity: 'epic',
    description: 'Variable zoom for versatile engagement ranges.',
  },
  sniper_scope: {
    name: 'Sniper Scope 8x',
    subType: 'scope_8x',
    durability: 0.7,
    weight: 500,
    modifiers: { accuracy: 35, aimSpeed: -25, ergonomics: -15 },
    rarity: 'rare',
    description: 'Long range precision optic.',
  },
  thermal: {
    name: 'Thermal Scope',
    subType: 'thermal',
    durability: 0.9,
    weight: 600,
    modifiers: { accuracy: 20, aimSpeed: -20, ergonomics: -20 },
    rarity: 'legendary',
    description: 'See heat signatures through smoke and darkness.',
  },
};

const TACTICAL_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  flashlight: {
    name: 'Tactical Flashlight',
    subType: 'flashlight',
    durability: 0.3,
    weight: 100,
    modifiers: {},
    rarity: 'common',
    description: 'High-lumen weapon light. Essential for low light.',
  },
  laser_red: {
    name: 'Red Laser',
    subType: 'laser_red',
    durability: 0.4,
    weight: 60,
    modifiers: { hipfireSpread: -20 },
    rarity: 'common',
    description: 'Visible laser for quick point shooting.',
  },
  laser_green: {
    name: 'Green Laser',
    subType: 'laser_green',
    durability: 0.5,
    weight: 80,
    modifiers: { hipfireSpread: -25 },
    rarity: 'uncommon',
    description: 'Higher visibility than red. More power consumption.',
  },
  laser_ir: {
    name: 'IR Laser/Illuminator',
    subType: 'laser_ir',
    durability: 0.6,
    weight: 150,
    modifiers: { hipfireSpread: -15 },
    rarity: 'rare',
    description: 'Invisible to naked eye. Requires NVG.',
  },
  foregrip_vertical: {
    name: 'Vertical Foregrip',
    subType: 'foregrip_vertical',
    durability: 0.2,
    weight: 120,
    modifiers: { recoil: -10, ergonomics: 8 },
    rarity: 'common',
    description: 'Classic vertical grip for control.',
  },
  foregrip_angled: {
    name: 'Angled Foregrip',
    subType: 'foregrip_angled',
    durability: 0.2,
    weight: 90,
    modifiers: { recoil: -5, aimSpeed: 8, ergonomics: 5 },
    rarity: 'uncommon',
    description: 'Faster transitions and natural point.',
  },
  bipod: {
    name: 'Folding Bipod',
    subType: 'bipod',
    durability: 0.3,
    weight: 300,
    modifiers: { recoil: -30, ergonomics: -10 },
    rarity: 'uncommon',
    description: 'Stable platform when deployed. Heavy.',
  },
};

const GRIP_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  standard_grip: {
    name: 'Standard Grip',
    durability: 0.2,
    weight: 100,
    modifiers: {},
    rarity: 'common',
    description: 'Factory pistol grip.',
  },
  ergonomic_grip: {
    name: 'Ergonomic Grip',
    durability: 0.3,
    weight: 120,
    modifiers: { ergonomics: 10, recoil: -5 },
    rarity: 'uncommon',
    description: 'Contoured for natural hand position.',
  },
  rubberized_grip: {
    name: 'Rubberized Grip',
    durability: 0.4,
    weight: 110,
    modifiers: { ergonomics: 5, recoil: -8 },
    rarity: 'common',
    description: 'Better grip in wet conditions.',
  },
};

const STOCK_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  fixed_stock: {
    name: 'Fixed Stock',
    durability: 0.2,
    weight: 400,
    modifiers: { recoil: -15, ergonomics: -5 },
    rarity: 'common',
    description: 'Solid fixed stock. Maximum stability.',
  },
  collapsible_stock: {
    name: 'Collapsible Stock',
    durability: 0.4,
    weight: 280,
    modifiers: { recoil: -8, ergonomics: 10 },
    rarity: 'uncommon',
    description: 'Adjustable length of pull. Compact storage.',
  },
  folding_stock: {
    name: 'Folding Stock',
    durability: 0.5,
    weight: 250,
    modifiers: { recoil: -5, ergonomics: 15 },
    rarity: 'uncommon',
    description: 'Folds for transport. Quick deployment.',
  },
  precision_stock: {
    name: 'Precision Stock',
    durability: 0.3,
    weight: 500,
    modifiers: { recoil: -20, accuracy: 10, ergonomics: -10 },
    rarity: 'rare',
    description: 'Fully adjustable for precision shooting.',
  },
};

const MAGAZINE_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  standard_mag: {
    name: 'Standard Magazine',
    subType: 'standard',
    durability: 0.3,
    weight: 150,
    modifiers: {},
    rarity: 'common',
    description: 'Factory capacity magazine.',
  },
  extended_mag: {
    name: 'Extended Magazine',
    subType: 'extended',
    durability: 0.4,
    weight: 220,
    modifiers: { magCapacity: 15, ergonomics: -5 },
    rarity: 'uncommon',
    description: 'Higher capacity. Slightly heavier.',
  },
  drum_mag: {
    name: 'Drum Magazine',
    subType: 'drum',
    durability: 0.6,
    weight: 600,
    modifiers: { magCapacity: 50, ergonomics: -20, aimSpeed: -15 },
    rarity: 'rare',
    description: 'Massive capacity. Heavy and cumbersome.',
  },
  reduced_mag: {
    name: 'Reduced Magazine',
    subType: 'reduced',
    durability: 0.2,
    weight: 100,
    modifiers: { magCapacity: -5, ergonomics: 5 },
    rarity: 'common',
    description: 'Low profile for prone shooting.',
  },
};

// ============= BAYONET ATTACHMENTS =============

const BAYONET_ATTACHMENTS: Record<string, Partial<WeaponAttachment>> = {
  knife_bayonet: {
    name: 'Knife Bayonet',
    subType: 'bayonet_knife',
    durability: 0.3,
    weight: 350,
    modifiers: { ergonomics: -3 },
    rarity: 'common',
    description: 'Standard military knife bayonet. Turns your rifle into a spear.',
  },
  spike_bayonet: {
    name: 'Spike Bayonet',
    subType: 'bayonet_spike',
    durability: 0.2,
    weight: 200,
    modifiers: { ergonomics: -1 },
    rarity: 'uncommon',
    description: 'Triangular spike bayonet. Lightweight but causes severe wounds.',
  },
  sword_bayonet: {
    name: 'Sword Bayonet',
    subType: 'bayonet_sword',
    durability: 0.4,
    weight: 550,
    modifiers: { ergonomics: -8 },
    rarity: 'rare',
    description: 'Long blade bayonet for ceremonial or older rifles. Excellent reach.',
  },
  modern_bayonet: {
    name: 'Modern Combat Bayonet',
    subType: 'bayonet_knife',
    durability: 0.25,
    weight: 280,
    modifiers: { ergonomics: -2 },
    rarity: 'uncommon',
    description: 'Multi-purpose bayonet with wire cutter and saw back.',
  },
  serrated_bayonet: {
    name: 'Serrated Bayonet',
    subType: 'bayonet_knife',
    durability: 0.35,
    weight: 320,
    modifiers: { ergonomics: -4 },
    rarity: 'rare',
    description: 'Vicious serrated blade. Intimidating appearance.',
  },
};

// ============= ATTACHMENT SYSTEM =============

export const WeaponAttachmentSystem = {
  
  // ─────────────────────────────────────────────────────────────────────────
  // Attachment Management
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Create a new attachment
   */
  createAttachment(
    templateId: string, 
    slot: AttachmentSlot, 
    condition: number = 100
  ): WeaponAttachment | null {
    const templates: Record<AttachmentSlot, Record<string, Partial<WeaponAttachment>>> = {
      barrel: BARREL_ATTACHMENTS,
      muzzle: MUZZLE_ATTACHMENTS,
      optic: OPTIC_ATTACHMENTS,
      sights: OPTIC_ATTACHMENTS,
      tactical_rail_top: TACTICAL_ATTACHMENTS,
      tactical_rail_side: TACTICAL_ATTACHMENTS,
      tactical_rail_bottom: TACTICAL_ATTACHMENTS,
      grip: GRIP_ATTACHMENTS,
      stock: STOCK_ATTACHMENTS,
      magazine: MAGAZINE_ATTACHMENTS,
      handguard: GRIP_ATTACHMENTS, // Reuse grip for simplicity
      bayonet: BAYONET_ATTACHMENTS,
    };
    
    const slotTemplates = templates[slot];
    if (!slotTemplates) return null;
    
    const template = slotTemplates[templateId];
    if (!template) return null;
    
    return {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      slot,
      condition,
      maxCondition: 100,
      ...template,
      name: template.name || templateId,
      durability: template.durability || 0.5,
      weight: template.weight || 100,
      modifiers: template.modifiers || {},
      description: template.description || '',
      rarity: template.rarity || 'common',
    } as WeaponAttachment;
  },
  
  /**
   * Attach an attachment to a weapon
   */
  attachToWeapon(weapon: ExtendedWeapon, attachment: WeaponAttachment): boolean {
    if (!this.isSlotCompatible(weapon.type, attachment.slot)) {
      return false;
    }
    
    // Remove existing attachment if any
    if (weapon.attachments[attachment.slot]) {
      this.detachFromWeapon(weapon, attachment.slot);
    }
    
    weapon.attachments[attachment.slot] = attachment;
    this.recalculateStats(weapon);
    
    return true;
  },
  
  /**
   * Detach an attachment from a weapon
   */
  detachFromWeapon(weapon: ExtendedWeapon, slot: AttachmentSlot): WeaponAttachment | null {
    const attachment = weapon.attachments[slot];
    if (!attachment) return null;
    
    delete weapon.attachments[slot];
    this.recalculateStats(weapon);
    
    return attachment;
  },
  
  /**
   * Check if a slot is compatible with a weapon type
   */
  isSlotCompatible(weaponType: WeaponType, slot: AttachmentSlot): boolean {
    const slotCompatibility: Partial<Record<WeaponType, AttachmentSlot[]>> = {
      // Modern firearms - full customization
      assault_rifle: ['barrel', 'muzzle', 'handguard', 'grip', 'stock', 'magazine', 'sights', 'optic', 'tactical_rail_top', 'tactical_rail_side', 'tactical_rail_bottom'],
      ak_variant: ['barrel', 'muzzle', 'handguard', 'grip', 'stock', 'magazine', 'sights', 'optic', 'tactical_rail_side'],
      smg_cheap: ['muzzle', 'grip', 'stock', 'magazine', 'sights'],
      smg_quality: ['barrel', 'muzzle', 'grip', 'stock', 'magazine', 'sights', 'optic', 'tactical_rail_side'],
      
      // Pistols
      pistol_basic: ['muzzle', 'sights', 'magazine'],
      pistol_quality: ['barrel', 'muzzle', 'sights', 'optic', 'magazine', 'tactical_rail_bottom'],
      revolver: ['grip', 'sights'],
      
      // Shotguns
      shotgun_pump: ['barrel', 'muzzle', 'stock', 'sights', 'tactical_rail_side'],
      shotgun_auto: ['barrel', 'muzzle', 'stock', 'magazine', 'sights', 'optic', 'tactical_rail_side'],
      
      // Precision
      sniper_rifle: ['barrel', 'muzzle', 'stock', 'optic', 'magazine', 'tactical_rail_top'],
      
      // Heavy
      lmg: ['barrel', 'muzzle', 'grip', 'optic', 'tactical_rail_top'],
      
      // Sci-fi
      laser_pistol: ['optic', 'tactical_rail_bottom'],
      plasma_rifle: ['barrel', 'optic', 'grip', 'stock'],
    };
    
    const compatibleSlots = slotCompatibility[weaponType] || [];
    return compatibleSlots.includes(slot);
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Stats Calculation
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Recalculate weapon stats with all attachments
   */
  recalculateStats(weapon: ExtendedWeapon): WeaponEffectiveStats {
    // Base stats from weapon type
    const baseStats: WeaponEffectiveStats = {
      baseDamage: WeaponWearSystem.getBaseDamage(weapon.type),
      accuracy: 70,
      recoil: 50,
      ergonomics: 50,
      noise: 100,
      weight: 3000,
      aimSpeed: 50,
      effectiveRange: 100,
      rateOfFire: 600,
      magCapacity: weapon.maxAmmo,
    };
    
    // Apply condition modifier to base damage
    baseStats.baseDamage *= (weapon.condition / 100);
    
    // Apply all attachment modifiers
    for (const attachment of Object.values(weapon.attachments)) {
      if (!attachment) continue;
      
      // Condition affects attachment effectiveness
      const effectiveness = attachment.condition / 100;
      const mods = attachment.modifiers;
      
      if (mods.accuracy) baseStats.accuracy += mods.accuracy * effectiveness;
      if (mods.recoil) baseStats.recoil += mods.recoil * effectiveness;
      if (mods.ergonomics) baseStats.ergonomics += mods.ergonomics * effectiveness;
      if (mods.noise) baseStats.noise += mods.noise * effectiveness;
      if (mods.aimSpeed) baseStats.aimSpeed += mods.aimSpeed * effectiveness;
      if (mods.magCapacity) baseStats.magCapacity += mods.magCapacity;
      if (mods.weight) baseStats.weight += mods.weight;
      
      // Add attachment weight
      baseStats.weight += attachment.weight;
    }
    
    // Apply part condition modifiers
    const avgPartCondition = this.getAveragePartCondition(weapon);
    baseStats.accuracy *= (0.5 + avgPartCondition * 0.5);
    baseStats.ergonomics *= (0.7 + avgPartCondition * 0.3);
    
    // Clamp values
    baseStats.accuracy = Math.max(10, Math.min(100, baseStats.accuracy));
    baseStats.recoil = Math.max(0, Math.min(100, baseStats.recoil));
    baseStats.ergonomics = Math.max(10, Math.min(100, baseStats.ergonomics));
    baseStats.noise = Math.max(10, baseStats.noise);
    baseStats.aimSpeed = Math.max(10, Math.min(100, baseStats.aimSpeed));
    
    weapon.effectiveStats = baseStats;
    return baseStats;
  },
  
  /**
   * Get average part condition
   */
  getAveragePartCondition(weapon: ExtendedWeapon): number {
    const parts = weapon.partConditions;
    const total = parts.receiver + parts.barrel + parts.trigger + parts.bolt + parts.feedSystem;
    return (total / 500); // 5 parts, each 0-100
  },
  
  /**
   * Get overall weapon condition including parts and attachments
   */
  getOverallCondition(weapon: ExtendedWeapon): number {
    // Base weapon condition (40% weight)
    let overall = weapon.condition * 0.4;
    
    // Part conditions (40% weight)
    overall += this.getAveragePartCondition(weapon) * 100 * 0.4;
    
    // Attachment conditions (20% weight)
    const attachments = Object.values(weapon.attachments).filter(Boolean);
    if (attachments.length > 0) {
      const avgAttachmentCondition = attachments.reduce((sum, att) => sum + (att?.condition || 0), 0) / attachments.length;
      overall += avgAttachmentCondition * 0.2;
    } else {
      overall += 20; // No attachments = full credit for that portion
    }
    
    return Math.round(overall);
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Wear & Degradation
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Apply wear to weapon and all attachments
   */
  applyWear(weapon: ExtendedWeapon, amount: number): void {
    // Wear base weapon
    weapon.condition = Math.max(0, weapon.condition - amount);
    
    // Wear parts
    const partWear = amount * 0.8;
    weapon.partConditions.receiver = Math.max(0, weapon.partConditions.receiver - partWear * 0.3);
    weapon.partConditions.barrel = Math.max(0, weapon.partConditions.barrel - partWear * 1.2);
    weapon.partConditions.trigger = Math.max(0, weapon.partConditions.trigger - partWear * 0.5);
    weapon.partConditions.bolt = Math.max(0, weapon.partConditions.bolt - partWear * 1.0);
    weapon.partConditions.feedSystem = Math.max(0, weapon.partConditions.feedSystem - partWear * 0.8);
    
    // Wear attachments
    for (const attachment of Object.values(weapon.attachments)) {
      if (!attachment) continue;
      attachment.condition = Math.max(0, attachment.condition - amount * attachment.durability);
    }
    
    // Recalculate stats
    this.recalculateStats(weapon);
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Factory Methods
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Create an extended weapon with default parts
   */
  createExtendedWeapon(
    type: WeaponType, 
    name: string, 
    source: 'enemy_basic' | 'enemy_elite' | 'stash' | 'armory' | 'store_new' | 'store_used' | 'legendary' | 'crafted' = 'enemy_basic'
  ): ExtendedWeapon {
    const baseWeapon = WeaponWearSystem.createWeapon(type, name, source);
    const conditionFactor = baseWeapon.condition / 100;
    
    const extendedWeapon: ExtendedWeapon = {
      ...baseWeapon,
      attachments: {},
      partConditions: {
        receiver: 80 + Math.random() * 20 * conditionFactor,
        barrel: 70 + Math.random() * 30 * conditionFactor,
        trigger: 85 + Math.random() * 15 * conditionFactor,
        bolt: 75 + Math.random() * 25 * conditionFactor,
        feedSystem: 70 + Math.random() * 30 * conditionFactor,
      },
    };
    
    this.recalculateStats(extendedWeapon);
    return extendedWeapon;
  },
  
  /**
   * Get all available attachment templates for a slot
   */
  getAvailableAttachments(slot: AttachmentSlot): string[] {
    const templates: Record<AttachmentSlot, Record<string, Partial<WeaponAttachment>>> = {
      barrel: BARREL_ATTACHMENTS,
      muzzle: MUZZLE_ATTACHMENTS,
      optic: OPTIC_ATTACHMENTS,
      sights: OPTIC_ATTACHMENTS,
      tactical_rail_top: TACTICAL_ATTACHMENTS,
      tactical_rail_side: TACTICAL_ATTACHMENTS,
      tactical_rail_bottom: TACTICAL_ATTACHMENTS,
      grip: GRIP_ATTACHMENTS,
      stock: STOCK_ATTACHMENTS,
      magazine: MAGAZINE_ATTACHMENTS,
      handguard: GRIP_ATTACHMENTS,
      bayonet: BAYONET_ATTACHMENTS,
    };
    
    return Object.keys(templates[slot] || {});
  },
};

export default WeaponAttachmentSystem;
