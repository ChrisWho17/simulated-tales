/**
 * Gun Nut Trigger System - Part 8 from Living World Engine
 * Comprehensive trigger and fire control group mechanics.
 * Based on precision shooting mechanics from real-world systems.
 */

import { GunNutDepth } from '@/lib/gameSettings';

// ============= TRIGGER TYPES =============

export type TriggerType = 
  | 'single_stage'
  | 'two_stage'
  | 'progressive'
  | 'binary'
  | 'burst_control'
  | 'neural_interface'   // Sci-fi
  | 'arcane_activation'; // Fantasy

export type BreakQuality = 'crisp' | 'creeping' | 'rolling';

export type FireMode = 'semi' | 'burst_2' | 'burst_3' | 'burst_4' | 'auto';

// ============= TRIGGER INTERFACE =============

export interface TriggerGroup {
  id: string;
  name: string;
  triggerType: TriggerType;
  
  // Physical characteristics (in pounds/inches)
  pullWeight: number;              // 1.5-15.0 lbs
  travelDistance: number;          // 0.05-0.25 inches
  resetDistance: number;           // 0.02-0.15 inches
  breakQuality: BreakQuality;
  
  // Two-stage specific
  firstStageWeight?: number;       // First stage pull weight
  secondStageWeight?: number;      // Second stage pull weight
  wallDistance?: number;           // Distance to wall/break point
  
  // Modifiers
  accuracyModifier: number;        // 0.85-1.25
  fireRateModifier: number;        // 0.7-1.8
  userSkillDependency: number;     // 0.1-0.9 - how much user skill affects performance
  
  // Available fire modes
  fireModes: FireMode[];
  currentFireMode: FireMode;
  
  // Condition (Gun Nut+)
  condition: number;               // 0-100
  maintenanceInterval: number;     // Cycles between service
  cyclesSinceService: number;
  
  // Environmental factors
  environmentalResistance: number; // 0.3-1.0
  
  // Economy
  rarityTier: number;              // 0-5
  baseCost: number;
}

// ============= TRIGGER PROFILES =============

export const SINGLE_STAGE_TRIGGERS: Record<string, Partial<TriggerGroup>> = {
  mil_spec_standard: {
    name: 'Mil-Spec Standard',
    triggerType: 'single_stage',
    pullWeight: 6.5,
    travelDistance: 0.18,
    resetDistance: 0.10,
    breakQuality: 'creeping',
    accuracyModifier: 1.0,
    fireRateModifier: 1.0,
    userSkillDependency: 0.5,
    environmentalResistance: 0.85,
    maintenanceInterval: 10000,
    rarityTier: 0,
    baseCost: 30,
  },
  competition_single: {
    name: 'Competition Single-Stage',
    triggerType: 'single_stage',
    pullWeight: 3.5,
    travelDistance: 0.12,
    resetDistance: 0.06,
    breakQuality: 'crisp',
    accuracyModifier: 1.10,
    fireRateModifier: 1.15,
    userSkillDependency: 0.7,
    environmentalResistance: 0.65,
    maintenanceInterval: 5000,
    rarityTier: 2,
    baseCost: 180,
  },
  enhanced_mil_spec: {
    name: 'Enhanced Mil-Spec',
    triggerType: 'single_stage',
    pullWeight: 5.5,
    travelDistance: 0.15,
    resetDistance: 0.08,
    breakQuality: 'crisp',
    accuracyModifier: 1.05,
    fireRateModifier: 1.05,
    userSkillDependency: 0.55,
    environmentalResistance: 0.80,
    maintenanceInterval: 8000,
    rarityTier: 1,
    baseCost: 85,
  },
  heavy_duty: {
    name: 'Heavy Duty Trigger',
    triggerType: 'single_stage',
    pullWeight: 8.5,
    travelDistance: 0.20,
    resetDistance: 0.12,
    breakQuality: 'rolling',
    accuracyModifier: 0.95,
    fireRateModifier: 0.90,
    userSkillDependency: 0.4,
    environmentalResistance: 0.95,
    maintenanceInterval: 20000,
    rarityTier: 1,
    baseCost: 50,
  },
  hair_trigger: {
    name: 'Hair Trigger',
    triggerType: 'single_stage',
    pullWeight: 2.0,
    travelDistance: 0.08,
    resetDistance: 0.04,
    breakQuality: 'crisp',
    accuracyModifier: 1.20,
    fireRateModifier: 1.25,
    userSkillDependency: 0.85,
    environmentalResistance: 0.45,
    maintenanceInterval: 3000,
    rarityTier: 3,
    baseCost: 350,
  },
};

export const TWO_STAGE_TRIGGERS: Record<string, Partial<TriggerGroup>> = {
  match_two_stage: {
    name: 'Match Two-Stage',
    triggerType: 'two_stage',
    pullWeight: 3.5, // Total
    firstStageWeight: 1.5,
    secondStageWeight: 2.0,
    travelDistance: 0.16,
    wallDistance: 0.10,
    resetDistance: 0.05,
    breakQuality: 'crisp',
    accuracyModifier: 1.20,
    fireRateModifier: 0.95,
    userSkillDependency: 0.75,
    environmentalResistance: 0.60,
    maintenanceInterval: 4000,
    rarityTier: 3,
    baseCost: 280,
  },
  tactical_two_stage: {
    name: 'Tactical Two-Stage',
    triggerType: 'two_stage',
    pullWeight: 6.5,
    firstStageWeight: 2.5,
    secondStageWeight: 4.0,
    travelDistance: 0.18,
    wallDistance: 0.12,
    resetDistance: 0.07,
    breakQuality: 'crisp',
    accuracyModifier: 1.15,
    fireRateModifier: 1.0,
    userSkillDependency: 0.60,
    environmentalResistance: 0.75,
    maintenanceInterval: 6000,
    rarityTier: 2,
    baseCost: 180,
  },
  sniper_two_stage: {
    name: 'Sniper Two-Stage',
    triggerType: 'two_stage',
    pullWeight: 3.0,
    firstStageWeight: 1.0,
    secondStageWeight: 2.0,
    travelDistance: 0.14,
    wallDistance: 0.09,
    resetDistance: 0.04,
    breakQuality: 'crisp',
    accuracyModifier: 1.25,
    fireRateModifier: 0.85,
    userSkillDependency: 0.85,
    environmentalResistance: 0.55,
    maintenanceInterval: 3000,
    rarityTier: 4,
    baseCost: 450,
  },
};

export const SPECIAL_TRIGGERS: Record<string, Partial<TriggerGroup>> = {
  binary_trigger: {
    name: 'Binary Trigger',
    triggerType: 'binary',
    pullWeight: 4.5,
    travelDistance: 0.15,
    resetDistance: 0.15, // Fires on release too
    breakQuality: 'crisp',
    accuracyModifier: 0.95,
    fireRateModifier: 1.80,
    userSkillDependency: 0.80,
    environmentalResistance: 0.60,
    maintenanceInterval: 4000,
    rarityTier: 4,
    baseCost: 500,
  },
  burst_fire_control: {
    name: 'Burst Fire Control Group',
    triggerType: 'burst_control',
    pullWeight: 6.0,
    travelDistance: 0.16,
    resetDistance: 0.10,
    breakQuality: 'creeping',
    accuracyModifier: 1.0,
    fireRateModifier: 1.0,
    userSkillDependency: 0.50,
    environmentalResistance: 0.70,
    maintenanceInterval: 8000,
    rarityTier: 2,
    baseCost: 120,
  },
};

// ============= ACCURACY CALCULATION =============

export interface AccuracyContext {
  userSkill: number;           // 0-100
  fatigueLevel: number;        // 0-1
  stressLevel: number;         // 0-1
  environmentSeverity: number; // 0-1
  stanceStability: number;     // 0-1 (prone=1, standing=0.6, moving=0.3)
}

/**
 * Calculate trigger's contribution to shot accuracy
 */
export function calculateTriggerAccuracy(
  trigger: TriggerGroup,
  context: AccuracyContext,
  depth: GunNutDepth = 'standard'
): number {
  let baseAccuracy = trigger.accuracyModifier;
  
  // Skill interaction
  const skillBonus = (context.userSkill / 100) * trigger.userSkillDependency;
  
  // Break quality affects precision
  const breakQualityMod: Record<BreakQuality, number> = {
    crisp: 1.0,
    creeping: 0.92,
    rolling: 0.85,
  };
  const breakQuality = breakQualityMod[trigger.breakQuality];
  
  // Environmental resistance
  const envPenalty = 1 - ((1 - trigger.environmentalResistance) * context.environmentSeverity);
  
  // Fatigue effects
  const fatigueMod = 1 - (context.fatigueLevel * 0.25);
  
  // Stance stability
  const stanceMod = 0.7 + (context.stanceStability * 0.3);
  
  // Stress affects trigger control
  const stressMod = 1 - (context.stressLevel * 0.15);
  
  let finalAccuracy = baseAccuracy * (1 + skillBonus) * breakQuality * envPenalty * fatigueMod * stanceMod * stressMod;
  
  // Gun Nut+ adds condition-based degradation
  if (depth === 'gunnut_plus' && trigger.condition < 80) {
    const conditionPenalty = ((80 - trigger.condition) / 100) * 0.15;
    finalAccuracy *= (1 - conditionPenalty);
  }
  
  return Math.max(0.5, Math.min(1.5, finalAccuracy));
}

// ============= FIRE MODE MECHANICS =============

export interface BurstContext {
  roundNumber: number;        // Which round in the burst (1-indexed)
  burstSize: number;          // Total rounds in burst
  recoilControl: number;      // 0-1 player's recoil control skill
}

/**
 * Calculate accuracy degradation during burst fire
 */
export function calculateBurstAccuracy(
  trigger: TriggerGroup,
  context: BurstContext
): number {
  const baseAccuracy = trigger.accuracyModifier;
  
  // Each subsequent round in burst loses accuracy
  const roundPenalty = (context.roundNumber - 1) * 0.08;
  
  // Player recoil control mitigates penalty
  const mitigatedPenalty = roundPenalty * (1 - context.recoilControl * 0.5);
  
  return baseAccuracy * (1 - mitigatedPenalty);
}

/**
 * Get effective fire rate based on trigger and mode
 */
export function getEffectiveFireRate(
  trigger: TriggerGroup,
  baseRPM: number
): number {
  return baseRPM * trigger.fireRateModifier;
}

// ============= TRIGGER CONDITION SYSTEM =============

export interface TriggerWearResult {
  needsMaintenance: boolean;
  conditionDrop: number;
  message?: string;
}

/**
 * Apply wear to trigger group
 */
export function applyTriggerWear(
  trigger: TriggerGroup,
  shotsFired: number,
  depth: GunNutDepth = 'standard'
): TriggerWearResult {
  if (depth === 'standard') {
    return { needsMaintenance: false, conditionDrop: 0 };
  }
  
  trigger.cyclesSinceService += shotsFired;
  
  // Calculate condition degradation
  const wearRate = 0.002; // Per shot
  const conditionDrop = shotsFired * wearRate;
  trigger.condition = Math.max(0, trigger.condition - conditionDrop);
  
  // Check if maintenance needed
  const needsMaintenance = trigger.cyclesSinceService >= trigger.maintenanceInterval;
  
  let message: string | undefined;
  
  if (trigger.condition < 30) {
    message = 'Trigger group showing significant wear. Service recommended.';
  } else if (trigger.condition < 50) {
    message = 'Trigger feels gritty.';
  }
  
  return {
    needsMaintenance,
    conditionDrop,
    message,
  };
}

/**
 * Service/maintain trigger group
 */
export function serviceTrigger(trigger: TriggerGroup, quality: 'basic' | 'full' | 'professional'): void {
  const restoration: Record<string, number> = {
    basic: 20,
    full: 50,
    professional: 100,
  };
  
  trigger.condition = Math.min(100, trigger.condition + restoration[quality]);
  trigger.cyclesSinceService = 0;
}

// ============= TRIGGER MALFUNCTION SYSTEM =============

export type TriggerMalfunctionType = 
  | 'light_strike'
  | 'trigger_freeze'
  | 'reset_failure'
  | 'sear_slip';

export interface TriggerMalfunction {
  type: TriggerMalfunctionType;
  canClear: boolean;
  clearTime: number;
  message: string;
}

/**
 * Check for trigger-related malfunction
 */
export function checkTriggerMalfunction(
  trigger: TriggerGroup,
  depth: GunNutDepth = 'standard'
): TriggerMalfunction | null {
  if (depth === 'standard') return null;
  
  // Only check for malfunctions in poor condition
  if (trigger.condition > 40) return null;
  
  const malfunctionChance = ((40 - trigger.condition) / 100) * 0.05;
  
  if (Math.random() < malfunctionChance) {
    const malfunctions: TriggerMalfunction[] = [
      {
        type: 'light_strike',
        canClear: true,
        clearTime: 0.5,
        message: 'Click. Light primer strike - firing pin didn\'t hit hard enough.',
      },
      {
        type: 'trigger_freeze',
        canClear: true,
        clearTime: 1.5,
        message: 'Trigger won\'t reset. Debris in mechanism.',
      },
      {
        type: 'reset_failure',
        canClear: true,
        clearTime: 0.8,
        message: 'Trigger fails to reset. Tap it.',
      },
    ];
    
    // Critical failures at very low condition
    if (depth === 'gunnut_plus' && trigger.condition < 15) {
      malfunctions.push({
        type: 'sear_slip',
        canClear: false,
        clearTime: 0,
        message: 'Sear slips - trigger group needs gunsmith service!',
      });
    }
    
    return malfunctions[Math.floor(Math.random() * malfunctions.length)];
  }
  
  return null;
}

// ============= FACTORY FUNCTIONS =============

export function createTriggerGroup(
  templateId: string,
  fireModes: FireMode[] = ['semi'],
  condition: number = 100
): TriggerGroup {
  const templates = { 
    ...SINGLE_STAGE_TRIGGERS, 
    ...TWO_STAGE_TRIGGERS,
    ...SPECIAL_TRIGGERS,
  };
  const template = templates[templateId] || SINGLE_STAGE_TRIGGERS.mil_spec_standard;
  
  return {
    id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    triggerType: 'single_stage',
    pullWeight: 6.5,
    travelDistance: 0.18,
    resetDistance: 0.10,
    breakQuality: 'creeping',
    accuracyModifier: 1.0,
    fireRateModifier: 1.0,
    userSkillDependency: 0.5,
    fireModes,
    currentFireMode: fireModes[0] || 'semi',
    condition,
    maintenanceInterval: 10000,
    cyclesSinceService: 0,
    environmentalResistance: 0.85,
    rarityTier: 1,
    baseCost: 50,
    ...template,
    name: template.name || 'Standard Trigger',
  };
}

/**
 * Get next fire mode in rotation
 */
export function cycleFireMode(trigger: TriggerGroup): FireMode {
  const currentIndex = trigger.fireModes.indexOf(trigger.currentFireMode);
  const nextIndex = (currentIndex + 1) % trigger.fireModes.length;
  trigger.currentFireMode = trigger.fireModes[nextIndex];
  return trigger.currentFireMode;
}

export default {
  SINGLE_STAGE_TRIGGERS,
  TWO_STAGE_TRIGGERS,
  SPECIAL_TRIGGERS,
  createTriggerGroup,
  calculateTriggerAccuracy,
  calculateBurstAccuracy,
  getEffectiveFireRate,
  applyTriggerWear,
  serviceTrigger,
  checkTriggerMalfunction,
  cycleFireMode,
};
