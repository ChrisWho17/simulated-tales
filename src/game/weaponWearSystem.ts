/**
 * Far Cry 2 Style Weapon Wear System
 * Implements realistic weapon degradation with jams, rust, and catastrophic failures.
 * 
 * Key mechanics:
 * - Weapons degrade with each shot/use
 * - Condition affects jam chance and critical failure risk
 * - Enemy weapons are always in poor condition (15-45%)
 * - Field cleaning vs full gunsmith repairs
 * - Visual states for UI rendering
 */

import { eventBus, WeaponEvent } from './eventBus';

// ============= TYPES =============

export interface Weapon {
  id: string;
  type: WeaponType;
  name: string;
  condition: number;        // 0-100
  destroyed: boolean;
  mods: string[];
  ammo: number;
  maxAmmo: number;
  
  // Tracking
  shotsFired: number;
  jamsCleared: number;
  lastMaintenance: number;  // timestamp
}

export type WeaponType = 
  // Pistols
  | 'pistol_basic' | 'pistol_quality' | 'revolver'
  // SMGs
  | 'smg_cheap' | 'smg_quality'
  // Rifles
  | 'assault_rifle' | 'ak_variant' | 'sniper_rifle'
  // Shotguns
  | 'shotgun_pump' | 'shotgun_auto'
  // Heavy
  | 'lmg' | 'rpg'
  // Melee
  | 'melee_knife' | 'melee_bat' | 'melee_machete'
  // Fantasy
  | 'sword_basic' | 'sword_quality' | 'sword_legendary'
  | 'bow_basic' | 'bow_quality' | 'crossbow'
  | 'staff_basic' | 'staff_enchanted'
  | 'axe_basic' | 'axe_war'
  // Sci-Fi
  | 'laser_pistol' | 'plasma_rifle' | 'pulse_cannon'
  | 'energy_blade';

export type ConditionThreshold = 
  | 'PRISTINE' | 'GOOD' | 'WORN' | 'POOR' | 'FAILING' | 'DESTROYED';

export type VisualState = 
  | 'clean' | 'minor_wear' | 'visible_rust' | 'heavy_rust' | 'falling_apart' | 'destroyed';

export type LootSource = 
  | 'enemy_basic' | 'enemy_elite' | 'stash' | 'armory' 
  | 'store_new' | 'store_used' | 'legendary' | 'crafted';

export interface FireResult {
  success: boolean;
  shotsFired: number;
  jammed: boolean;
  jamClearTime?: number;
  criticalFailure: boolean;
  playerDamage?: number;
  newCondition: number;
  visualState: VisualState;
  message?: string;
  reason?: string;
}

export interface ReloadResult {
  success: boolean;
  jammed?: boolean;
  message?: string;
  clearTime?: number;
  newCondition: number;
}

export interface MeleeResult {
  success: boolean;
  broken: boolean;
  newCondition: number;
  message?: string;
}

export interface MaintenanceResult {
  success: boolean;
  cost?: number;
  time?: number;
  newCondition: number;
  message: string;
}

export interface WeaponVisualState {
  visual: VisualState;
  condition: number;
  
  // For shader/texture effects (0-1 scale)
  rustLevel: number;
  dirtLevel: number;
  damageLevel: number;
  
  // Color tinting
  tint: string | null;
  
  // Particle effects
  emitSparks: boolean;
  emitSmoke: boolean;
}

// ============= CONDITION THRESHOLDS =============

interface ThresholdData {
  min: number;
  jamChance: number;
  critFailChance: number;
  visual: VisualState;
}

const THRESHOLDS: Record<ConditionThreshold, ThresholdData> = {
  PRISTINE:  { min: 90, jamChance: 0,      critFailChance: 0,      visual: 'clean' },
  GOOD:      { min: 70, jamChance: 0.01,   critFailChance: 0,      visual: 'minor_wear' },
  WORN:      { min: 50, jamChance: 0.05,   critFailChance: 0,      visual: 'visible_rust' },
  POOR:      { min: 30, jamChance: 0.15,   critFailChance: 0.005,  visual: 'heavy_rust' },
  FAILING:   { min: 10, jamChance: 0.30,   critFailChance: 0.02,   visual: 'falling_apart' },
  DESTROYED: { min: 0,  jamChance: 1.0,    critFailChance: 0.10,   visual: 'destroyed' },
};

// ============= WEAPON PROFILES =============

interface WeaponProfile {
  degradePerShot?: number;
  degradePerReload?: number;
  degradePerUse?: number;
  jamClearTime: number;
  breakChance?: number;
  baseDamage: number;
  
  // Genre-specific
  isMelee?: boolean;
  isEnergy?: boolean;
  isMagic?: boolean;
}

const WEAPON_PROFILES: Record<WeaponType, WeaponProfile> = {
  // Pistols
  pistol_basic:      { degradePerShot: 0.15, degradePerReload: 0.05, jamClearTime: 0.8, baseDamage: 12 },
  pistol_quality:    { degradePerShot: 0.08, degradePerReload: 0.02, jamClearTime: 0.6, baseDamage: 15 },
  revolver:          { degradePerShot: 0.05, degradePerReload: 0.01, jamClearTime: 0.3, baseDamage: 18 }, // Revolvers rarely jam
  
  // SMGs
  smg_cheap:         { degradePerShot: 0.20, degradePerReload: 0.08, jamClearTime: 1.0, baseDamage: 10 },
  smg_quality:       { degradePerShot: 0.10, degradePerReload: 0.04, jamClearTime: 0.8, baseDamage: 12 },
  
  // Rifles
  assault_rifle:     { degradePerShot: 0.12, degradePerReload: 0.05, jamClearTime: 1.2, baseDamage: 18 },
  ak_variant:        { degradePerShot: 0.06, degradePerReload: 0.02, jamClearTime: 1.0, baseDamage: 20 }, // AKs are tanks
  sniper_rifle:      { degradePerShot: 0.25, degradePerReload: 0.10, jamClearTime: 1.5, baseDamage: 45 },
  
  // Shotguns
  shotgun_pump:      { degradePerShot: 0.10, degradePerReload: 0.03, jamClearTime: 1.3, baseDamage: 35 },
  shotgun_auto:      { degradePerShot: 0.18, degradePerReload: 0.06, jamClearTime: 1.5, baseDamage: 30 },
  
  // Heavy
  lmg:               { degradePerShot: 0.08, degradePerReload: 0.10, jamClearTime: 2.0, baseDamage: 15 },
  rpg:               { degradePerShot: 2.00, degradePerReload: 0,    jamClearTime: 0,   baseDamage: 100 }, // Single use basically
  
  // Melee
  melee_knife:       { degradePerUse: 0.10, jamClearTime: 0, breakChance: 0.001, baseDamage: 15, isMelee: true },
  melee_bat:         { degradePerUse: 0.30, jamClearTime: 0, breakChance: 0.01,  baseDamage: 20, isMelee: true },
  melee_machete:     { degradePerUse: 0.15, jamClearTime: 0, breakChance: 0.005, baseDamage: 22, isMelee: true },
  
  // Fantasy - Swords
  sword_basic:       { degradePerUse: 0.12, jamClearTime: 0, breakChance: 0.008, baseDamage: 18, isMelee: true },
  sword_quality:     { degradePerUse: 0.06, jamClearTime: 0, breakChance: 0.003, baseDamage: 22, isMelee: true },
  sword_legendary:   { degradePerUse: 0.02, jamClearTime: 0, breakChance: 0.0005, baseDamage: 30, isMelee: true },
  
  // Fantasy - Ranged
  bow_basic:         { degradePerShot: 0.08, degradePerReload: 0, jamClearTime: 0.5, baseDamage: 14 },
  bow_quality:       { degradePerShot: 0.04, degradePerReload: 0, jamClearTime: 0.3, baseDamage: 18 },
  crossbow:          { degradePerShot: 0.15, degradePerReload: 0.05, jamClearTime: 1.0, baseDamage: 25 },
  
  // Fantasy - Magic
  staff_basic:       { degradePerUse: 0.10, jamClearTime: 0.5, breakChance: 0.005, baseDamage: 16, isMagic: true },
  staff_enchanted:   { degradePerUse: 0.05, jamClearTime: 0.3, breakChance: 0.001, baseDamage: 24, isMagic: true },
  
  // Fantasy - Axes
  axe_basic:         { degradePerUse: 0.15, jamClearTime: 0, breakChance: 0.01, baseDamage: 25, isMelee: true },
  axe_war:           { degradePerUse: 0.08, jamClearTime: 0, breakChance: 0.004, baseDamage: 32, isMelee: true },
  
  // Sci-Fi - Energy weapons (different failure mode)
  laser_pistol:      { degradePerShot: 0.10, degradePerReload: 0.02, jamClearTime: 0.5, baseDamage: 14, isEnergy: true },
  plasma_rifle:      { degradePerShot: 0.15, degradePerReload: 0.05, jamClearTime: 0.8, baseDamage: 28, isEnergy: true },
  pulse_cannon:      { degradePerShot: 0.25, degradePerReload: 0.10, jamClearTime: 1.2, baseDamage: 40, isEnergy: true },
  energy_blade:      { degradePerUse: 0.08, jamClearTime: 0.3, breakChance: 0.002, baseDamage: 26, isEnergy: true, isMelee: true },
};

// ============= LOOT CONDITION RANGES =============

const LOOT_CONDITION_RANGES: Record<LootSource, { min: number; max: number }> = {
  enemy_basic:  { min: 15, max: 45 },  // Street thugs have garbage
  enemy_elite:  { min: 35, max: 65 },  // Better enemies, better gear
  stash:        { min: 40, max: 70 },  // Hidden stashes
  armory:       { min: 80, max: 100 }, // Fresh from armory
  store_new:    { min: 95, max: 100 }, // Store bought
  store_used:   { min: 50, max: 75 },  // Pawn shop
  legendary:    { min: 60, max: 90 },  // Unique weapons vary
  crafted:      { min: 70, max: 95 },  // Player-crafted
};

// ============= MESSAGE GENERATORS =============

const JAM_MESSAGES = {
  firearm: [
    "Click. Nothing. The gun jams.",
    "The slide locks - jammed.",
    "Mechanism seizes up mid-fire.",
    "Misfire. Gotta clear it.",
    "The bolt catches. Damn rust.",
    "Feed jam. Round's stuck.",
    "Stovepipe jam. Casing won't eject.",
  ],
  energy: [
    "The capacitor sputters and dies.",
    "Power cell destabilizes - weapon offline.",
    "Overload warning. Systems resetting.",
    "Energy feed interrupted.",
    "Plasma conduit clogs. Clearing...",
  ],
  bow: [
    "The string catches on a worn notch.",
    "The nocking point slips.",
    "Bow limb creaks dangerously.",
  ],
  magic: [
    "The focus crystal dims and sputters.",
    "Arcane energy disperses chaotically.",
    "The enchantment flickers unstable.",
    "Power flows erratically through the staff.",
  ],
};

const JAM_CLEAR_MESSAGES = {
  firearm: [
    "Rack it. Good to go.",
    "Cleared. For now.",
    "Unjammed. This thing's on its last legs.",
    "Working again. Barely.",
    "Cleared the jam. Won't last much longer.",
  ],
  energy: [
    "Systems back online. Barely.",
    "Rerouted power. Holding for now.",
    "Capacitor stabilized. For now.",
  ],
  bow: [
    "String reset. Careful now.",
    "Adjusted the nock. Should hold.",
  ],
  magic: [
    "Refocused the energy. Unstable but functional.",
    "Enchantment realigned. Proceed with caution.",
  ],
};

const CRIT_FAIL_MESSAGES = {
  firearm: [
    "The weapon explodes in your hands!",
    "BANG - but not from the barrel. The receiver shatters.",
    "Catastrophic failure - the gun tears itself apart.",
    "The barrel ruptures. Gun's done.",
    "Chamber detonates. Weapon destroyed.",
  ],
  energy: [
    "The power cell overloads and explodes!",
    "Plasma containment fails - energy burst!",
    "Capacitor chain-reaction! The weapon melts.",
    "Critical overload. Energy discharge burns you.",
  ],
  bow: [
    "The bow snaps violently, string whipping back!",
    "Limb cracks and splinters fly!",
  ],
  magic: [
    "The staff shatters as wild magic erupts!",
    "Arcane backlash! The focus crystal explodes!",
    "Uncontrolled magical discharge tears the weapon apart!",
  ],
};

const MELEE_BREAK_MESSAGES: Partial<Record<WeaponType, string[]>> = {
  melee_knife: [
    "The blade snaps off at the handle.",
    "The knife shatters on impact.",
  ],
  melee_bat: [
    "The bat splinters on impact.",
    "The bat cracks and breaks in two.",
  ],
  melee_machete: [
    "The blade cracks and breaks.",
    "The machete snaps at the weak point.",
  ],
  sword_basic: [
    "The blade shatters along a stress fracture.",
    "The sword breaks at the crossguard.",
  ],
  sword_quality: [
    "Even quality steel has its limits - the blade snaps.",
  ],
  axe_basic: [
    "The axe head flies off the handle.",
    "The haft splinters apart.",
  ],
  axe_war: [
    "The war axe cracks through the blade.",
  ],
  energy_blade: [
    "The energy emitter overloads and burns out.",
    "The blade flickers and dies permanently.",
  ],
};

// ============= CORE FUNCTIONS =============

interface ThresholdResult extends ThresholdData {
  name: ConditionThreshold;
}

function getThreshold(condition: number): ThresholdResult {
  for (const [name, data] of Object.entries(THRESHOLDS)) {
    if (condition >= data.min) {
      return { name: name as ConditionThreshold, ...data };
    }
  }
  return { name: 'DESTROYED', ...THRESHOLDS.DESTROYED };
}

function getProfile(type: WeaponType): WeaponProfile {
  return WEAPON_PROFILES[type] || WEAPON_PROFILES.pistol_basic;
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function getWeaponCategory(profile: WeaponProfile): 'firearm' | 'energy' | 'bow' | 'magic' {
  if (profile.isMagic) return 'magic';
  if (profile.isEnergy) return 'energy';
  if (profile.isMelee) return 'firearm'; // Uses same messages for simplicity
  return 'firearm';
}

// ============= WEAPON WEAR SYSTEM =============

export const WeaponWearSystem = {
  
  // ─────────────────────────────────────────────────────────────────────────
  // Core Functions
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Fire weapon - returns result including potential jam/failure
   */
  fireWeapon(weapon: Weapon, burstSize: number = 1): FireResult {
    if (weapon.condition <= 0 || weapon.destroyed) {
      return { 
        success: false, 
        shotsFired: 0,
        jammed: false,
        criticalFailure: false,
        newCondition: weapon.condition,
        visualState: 'destroyed',
        reason: 'weapon_destroyed',
        message: "The weapon is too damaged to fire.",
      };
    }
    
    const profile = getProfile(weapon.type);
    const threshold = getThreshold(weapon.condition);
    const category = getWeaponCategory(profile);
    
    const result: FireResult = {
      success: true,
      shotsFired: 0,
      jammed: false,
      criticalFailure: false,
      newCondition: weapon.condition,
      visualState: threshold.visual,
    };
    
    for (let i = 0; i < burstSize; i++) {
      // Check for jam BEFORE shot
      if (Math.random() < threshold.jamChance) {
        result.jammed = true;
        result.jamClearTime = profile.jamClearTime;
        result.message = getRandomMessage(JAM_MESSAGES[category] || JAM_MESSAGES.firearm);
        
        // Emit jam event
        eventBus.emit<WeaponEvent>({
          type: 'WEAPON_JAM',
          tick: Date.now(),
          source: 'weaponWearSystem',
          priority: 'high',
          data: {
            weaponId: weapon.id,
            weaponType: weapon.type,
            condition: weapon.condition,
          },
        });
        
        break;
      }
      
      // Check for critical failure (weapon explodes/breaks)
      if (Math.random() < threshold.critFailChance) {
        result.criticalFailure = true;
        result.success = false;
        result.playerDamage = this.calculateBackfireDamage(weapon.type);
        result.message = getRandomMessage(CRIT_FAIL_MESSAGES[category] || CRIT_FAIL_MESSAGES.firearm);
        weapon.condition = 0;
        weapon.destroyed = true;
        
        // Emit catastrophic failure event
        eventBus.emit<WeaponEvent>({
          type: 'WEAPON_DESTROYED',
          tick: Date.now(),
          source: 'weaponWearSystem',
          priority: 'critical',
          data: {
            weaponId: weapon.id,
            weaponType: weapon.type,
            playerDamage: result.playerDamage,
            wasCriticalFailure: true,
          },
        });
        
        break;
      }
      
      // Shot succeeds
      result.shotsFired++;
      weapon.shotsFired++;
      weapon.condition = Math.max(0, weapon.condition - (profile.degradePerShot || 0));
    }
    
    result.newCondition = weapon.condition;
    result.visualState = getThreshold(weapon.condition).visual;
    
    return result;
  },
  
  /**
   * Reload weapon
   */
  reloadWeapon(weapon: Weapon): ReloadResult {
    const profile = getProfile(weapon.type);
    
    // Reloading causes minor wear
    weapon.condition = Math.max(0, weapon.condition - (profile.degradePerReload || 0));
    
    // Worn weapons might jam during reload
    const threshold = getThreshold(weapon.condition);
    if (weapon.condition < 30 && Math.random() < threshold.jamChance * 0.5) {
      return {
        success: false,
        jammed: true,
        message: "Magazine won't seat properly...",
        clearTime: profile.jamClearTime * 0.5,
        newCondition: weapon.condition,
      };
    }
    
    weapon.ammo = weapon.maxAmmo;
    return { success: true, newCondition: weapon.condition };
  },
  
  /**
   * Clear a jam
   */
  clearJam(weapon: Weapon): { success: boolean; clearTime: number; message: string; weaponUsable: boolean } {
    const profile = getProfile(weapon.type);
    const category = getWeaponCategory(profile);
    
    // Clearing jam causes slight wear
    weapon.condition = Math.max(0, weapon.condition - 0.5);
    weapon.jamsCleared++;
    
    // Very degraded weapons might fail to clear
    if (weapon.condition < 20 && Math.random() < 0.2) {
      return {
        success: false,
        clearTime: 0,
        message: "Can't clear it - the mechanism is too damaged.",
        weaponUsable: false,
      };
    }
    
    return {
      success: true,
      clearTime: profile.jamClearTime,
      message: getRandomMessage(JAM_CLEAR_MESSAGES[category] || JAM_CLEAR_MESSAGES.firearm),
      weaponUsable: true,
    };
  },
  
  /**
   * Use melee weapon
   */
  useMelee(weapon: Weapon): MeleeResult {
    const profile = getProfile(weapon.type);
    
    if (!profile.isMelee && !profile.isEnergy) {
      return { success: true, broken: false, newCondition: weapon.condition };
    }
    
    weapon.condition = Math.max(0, weapon.condition - (profile.degradePerUse || 0));
    
    // Check for break - scales with wear
    const baseBreakChance = profile.breakChance || 0;
    const breakChance = baseBreakChance * (1 + (100 - weapon.condition) / 50);
    
    if (Math.random() < breakChance) {
      weapon.condition = 0;
      weapon.destroyed = true;
      
      const breakMessages = MELEE_BREAK_MESSAGES[weapon.type] || ["The weapon breaks."];
      
      // Emit break event
      eventBus.emit<WeaponEvent>({
        type: 'WEAPON_DESTROYED',
        tick: Date.now(),
        source: 'weaponWearSystem',
        priority: 'high',
        data: {
          weaponId: weapon.id,
          weaponType: weapon.type,
          wasCriticalFailure: false,
        },
      });
      
      return {
        success: true,
        broken: true,
        newCondition: 0,
        message: getRandomMessage(breakMessages),
      };
    }
    
    return { success: true, broken: false, newCondition: weapon.condition };
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Maintenance
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Field clean weapon (partial restore)
   */
  fieldClean(weapon: Weapon): MaintenanceResult {
    if (weapon.destroyed) {
      return { 
        success: false, 
        newCondition: 0,
        message: "This weapon is beyond field repair.",
      };
    }
    
    const maxRestore = 60; // Can't get above 60% in field
    const restoreAmount = 15;
    
    weapon.condition = Math.min(maxRestore, weapon.condition + restoreAmount);
    weapon.lastMaintenance = Date.now();
    
    return {
      success: true,
      newCondition: weapon.condition,
      message: "Cleared the worst of the gunk. It'll do for now.",
    };
  },
  
  /**
   * Full repair at gunsmith/blacksmith/tech
   */
  fullRepair(weapon: Weapon, quality: 'basic' | 'standard' | 'professional' = 'standard'): MaintenanceResult {
    if (weapon.destroyed && quality !== 'professional') {
      return { 
        success: false, 
        newCondition: 0,
        message: "This weapon needs professional restoration.",
      };
    }
    
    const repairs: Record<string, { restore: number; cost: number; time: number; canRestoreDestroyed?: boolean }> = {
      basic:        { restore: 70, cost: 50,  time: 1 },
      standard:     { restore: 85, cost: 150, time: 2 },
      professional: { restore: 100, cost: 400, time: 4, canRestoreDestroyed: true },
    };
    
    const repair = repairs[quality] || repairs.standard;
    
    if (weapon.destroyed && !repair.canRestoreDestroyed) {
      return { 
        success: false, 
        newCondition: 0,
        message: "Repair level insufficient for this damage.",
      };
    }
    
    weapon.condition = repair.restore;
    weapon.destroyed = false;
    weapon.lastMaintenance = Date.now();
    
    return {
      success: true,
      cost: repair.cost,
      time: repair.time,
      newCondition: weapon.condition,
      message: `Weapon restored to ${repair.restore}% condition.`,
    };
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Pickup & Loot
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Generate condition for looted/enemy weapon (Far Cry style - usually garbage)
   */
  generateLootCondition(source: LootSource = 'enemy_basic'): number {
    const range = LOOT_CONDITION_RANGES[source] || LOOT_CONDITION_RANGES.enemy_basic;
    return Math.floor(range.min + Math.random() * (range.max - range.min));
  },
  
  /**
   * Create a weapon with appropriate condition
   */
  createWeapon(type: WeaponType, name: string, source: LootSource = 'enemy_basic'): Weapon {
    const profile = getProfile(type);
    
    return {
      id: `weapon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      name,
      condition: this.generateLootCondition(source),
      destroyed: false,
      mods: [],
      ammo: 0,
      maxAmmo: this.getDefaultMaxAmmo(type),
      shotsFired: 0,
      jamsCleared: 0,
      lastMaintenance: Date.now(),
    };
  },
  
  /**
   * Get default max ammo for weapon type
   */
  getDefaultMaxAmmo(type: WeaponType): number {
    const ammoDefaults: Partial<Record<WeaponType, number>> = {
      pistol_basic: 12, pistol_quality: 15, revolver: 6,
      smg_cheap: 30, smg_quality: 32,
      assault_rifle: 30, ak_variant: 30, sniper_rifle: 5,
      shotgun_pump: 6, shotgun_auto: 8,
      lmg: 100, rpg: 1,
      bow_basic: 20, bow_quality: 25, crossbow: 12,
      laser_pistol: 20, plasma_rifle: 15, pulse_cannon: 8,
    };
    return ammoDefaults[type] || 0; // 0 for melee
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  
  getThreshold,
  
  getConditionLabel(condition: number): ConditionThreshold {
    return getThreshold(condition).name as ConditionThreshold;
  },
  
  getBaseDamage(type: WeaponType): number {
    return getProfile(type).baseDamage;
  },
  
  /**
   * Calculate damage dealt to player on weapon backfire
   */
  calculateBackfireDamage(type: WeaponType): number {
    const baseDamage: Partial<Record<WeaponType, number>> = {
      pistol_basic: 15, pistol_quality: 15, revolver: 20,
      smg_cheap: 20, smg_quality: 20,
      assault_rifle: 30, ak_variant: 35, sniper_rifle: 40,
      shotgun_pump: 35, shotgun_auto: 40,
      lmg: 45, rpg: 100,
      plasma_rifle: 40, pulse_cannon: 60,
      staff_enchanted: 30,
    };
    return baseDamage[type] || 20;
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Visual State (for rendering)
  // ─────────────────────────────────────────────────────────────────────────
  
  getVisualState(weapon: Weapon): WeaponVisualState {
    const threshold = getThreshold(weapon.condition);
    
    return {
      visual: threshold.visual,
      condition: weapon.condition,
      
      // For shader/texture effects
      rustLevel: Math.max(0, (70 - weapon.condition) / 70),      // 0-1
      dirtLevel: Math.max(0, (85 - weapon.condition) / 85),      // 0-1
      damageLevel: Math.max(0, (50 - weapon.condition) / 50),    // 0-1
      
      // Color tinting
      tint: weapon.condition > 70 ? null : 
            weapon.condition > 40 ? '#8B7355' :  // Brown rust
            '#6B4423',  // Dark rust
      
      // Particle effects
      emitSparks: weapon.condition < 30,
      emitSmoke: weapon.condition < 20,
    };
  },
  
  /**
   * Get condition description for narrative
   */
  getConditionDescription(condition: number): string {
    if (condition >= 90) return "pristine and well-maintained";
    if (condition >= 70) return "in good condition with minor wear";
    if (condition >= 50) return "showing visible signs of wear and some rust";
    if (condition >= 30) return "heavily worn with significant rust and damage";
    if (condition >= 10) return "barely functional, falling apart";
    return "destroyed and unusable";
  },
  
  /**
   * Compare two weapons for swap decision
   * Returns true if newWeapon is worth keeping over currentWeapon
   */
  shouldSwapWeapon(currentWeapon: Weapon | null, newWeapon: Weapon): boolean {
    if (!currentWeapon) return true;
    if (newWeapon.destroyed) return false;
    if (currentWeapon.destroyed) return true;
    
    // Compare effective quality (condition * base damage)
    const currentProfile = getProfile(currentWeapon.type);
    const newProfile = getProfile(newWeapon.type);
    
    const currentValue = (currentWeapon.condition / 100) * currentProfile.baseDamage;
    const newValue = (newWeapon.condition / 100) * newProfile.baseDamage;
    
    // Need at least 20% improvement to swap
    return newValue > currentValue * 1.2;
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Time-based Degradation (for ambient wear)
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Apply ambient wear over time (weather, environment)
   */
  applyAmbientWear(weapon: Weapon, hoursElapsed: number, environment: 'normal' | 'humid' | 'dusty' | 'wet'): number {
    if (weapon.destroyed) return 0;
    
    const wearRates: Record<string, number> = {
      normal: 0.1,
      humid: 0.3,  // Humidity causes rust
      dusty: 0.2,  // Dust clogs mechanisms
      wet: 0.5,    // Water is worst
    };
    
    const wearAmount = hoursElapsed * (wearRates[environment] || 0.1);
    weapon.condition = Math.max(0, weapon.condition - wearAmount);
    
    return wearAmount;
  },
};

// Export types and system
export default WeaponWearSystem;
