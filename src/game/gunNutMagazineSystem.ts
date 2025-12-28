/**
 * Gun Nut Magazine System - Part 7 from Living World Engine
 * Comprehensive magazine and feed system with genre support.
 * Based on Escape from Tarkov, Stalker 2, and Far Cry mechanics.
 */

import { GunNutDepth } from '@/lib/gameSettings';

// ============= FEED TYPES =============

export type FeedType = 
  | 'box_magazine'
  | 'drum_magazine' 
  | 'belt_fed'
  | 'tubular'
  | 'revolver_cylinder'
  | 'single_shot'
  | 'energy_cell'
  | 'quiver'
  | 'magical';

export type MagazineMaterial = 'aluminum' | 'steel' | 'polymer' | 'composite';

// ============= MAGAZINE INTERFACE =============

export interface Magazine {
  id: string;
  name: string;
  feedType: FeedType;
  baseCapacity: number;
  currentAmmo: number;
  
  // Reload timings (seconds)
  tacticalReloadTime: number;   // Reload with ammo remaining
  emergencyReloadTime: number;  // Reload when empty
  
  // Reliability
  reliabilityRating: number;    // 0.8-1.0 multiplier
  magazineRetention: boolean;   // Whether partial mags are saved
  
  // Physical
  weightLoaded: number;         // kg
  weightEmpty: number;          // kg
  
  // Skill interaction
  reloadSkillModifier: number;  // 0.7-1.0 - how much skill affects reload speed
  
  // Compatible ammo types
  ammunitionTypes: string[];
  
  // Fire rate effect
  feedRateModifier: number;     // 0.8-1.2
  
  // Malfunction
  jamClearDifficulty: number;   // 1-10
  
  // Durability (Gun Nut+ only)
  wearRate: number;             // 0.001-0.05 per cycle
  condition: number;            // 0-100
  
  // Spring mechanics (Gun Nut+ only)
  springTension: number;        // 0-100
  followerCondition: number;    // 0-100
  feedLipsCondition: number;    // 0-100
  
  // Economy
  rarityTier: number;           // 0-5
  baseCost: number;
  
  // Special effects
  specialEffects?: MagazineEffect[];
}

export interface MagazineEffect {
  type: 'speed_bonus' | 'capacity_mod' | 'stealth' | 'incendiary_compatibility';
  value: number;
  description: string;
}

// ============= MAGAZINE CATEGORIES =============

export const BOX_MAGAZINES: Record<string, Partial<Magazine>> = {
  compact_pistol: {
    name: 'Compact Pistol Magazine',
    feedType: 'box_magazine',
    baseCapacity: 7,
    tacticalReloadTime: 2.2,
    emergencyReloadTime: 2.8,
    reliabilityRating: 0.95,
    weightLoaded: 0.15,
    weightEmpty: 0.06,
    feedRateModifier: 1.0,
    jamClearDifficulty: 2,
    specialEffects: [{ type: 'stealth', value: 0.1, description: 'Concealment bonus' }],
  },
  standard_pistol: {
    name: 'Standard Pistol Magazine',
    feedType: 'box_magazine',
    baseCapacity: 15,
    tacticalReloadTime: 2.4,
    emergencyReloadTime: 3.2,
    reliabilityRating: 0.98,
    weightLoaded: 0.25,
    weightEmpty: 0.08,
    feedRateModifier: 1.0,
    jamClearDifficulty: 2,
  },
  extended_pistol: {
    name: 'Extended Pistol Magazine',
    feedType: 'box_magazine',
    baseCapacity: 25,
    tacticalReloadTime: 2.8,
    emergencyReloadTime: 3.6,
    reliabilityRating: 0.94,
    weightLoaded: 0.35,
    weightEmpty: 0.12,
    feedRateModifier: 1.0,
    jamClearDifficulty: 3,
  },
  stanag_30: {
    name: 'STANAG 30-Round',
    feedType: 'box_magazine',
    baseCapacity: 30,
    tacticalReloadTime: 3.5,
    emergencyReloadTime: 4.2,
    reliabilityRating: 0.96,
    weightLoaded: 0.45,
    weightEmpty: 0.12,
    feedRateModifier: 1.0,
    jamClearDifficulty: 3,
  },
  pmag_30: {
    name: 'Magpul PMAG 30',
    feedType: 'box_magazine',
    baseCapacity: 30,
    tacticalReloadTime: 3.2,
    emergencyReloadTime: 3.8,
    reliabilityRating: 0.98,
    weightLoaded: 0.42,
    weightEmpty: 0.13,
    feedRateModifier: 1.0,
    jamClearDifficulty: 2,
  },
  ak_30: {
    name: 'AK 30-Round Magazine',
    feedType: 'box_magazine',
    baseCapacity: 30,
    tacticalReloadTime: 3.8,
    emergencyReloadTime: 4.5,
    reliabilityRating: 0.97,
    weightLoaded: 0.52,
    weightEmpty: 0.18,
    feedRateModifier: 1.0,
    jamClearDifficulty: 2,
  },
  extended_rifle_40: {
    name: 'Extended 40-Round Magazine',
    feedType: 'box_magazine',
    baseCapacity: 40,
    tacticalReloadTime: 4.2,
    emergencyReloadTime: 5.0,
    reliabilityRating: 0.92,
    weightLoaded: 0.65,
    weightEmpty: 0.18,
    feedRateModifier: 0.98,
    jamClearDifficulty: 4,
  },
};

export const DRUM_MAGAZINES: Record<string, Partial<Magazine>> = {
  drum_50: {
    name: '50-Round Drum',
    feedType: 'drum_magazine',
    baseCapacity: 50,
    tacticalReloadTime: 6.5,
    emergencyReloadTime: 8.0,
    reliabilityRating: 0.92,
    weightLoaded: 1.2,
    weightEmpty: 0.6,
    feedRateModifier: 0.95,
    jamClearDifficulty: 6,
    specialEffects: [{ type: 'capacity_mod', value: -0.15, description: '-15% movement speed' }],
  },
  drum_75: {
    name: '75-Round Drum',
    feedType: 'drum_magazine',
    baseCapacity: 75,
    tacticalReloadTime: 7.5,
    emergencyReloadTime: 9.2,
    reliabilityRating: 0.88,
    weightLoaded: 1.8,
    weightEmpty: 0.8,
    feedRateModifier: 0.92,
    jamClearDifficulty: 7,
    specialEffects: [{ type: 'capacity_mod', value: -0.20, description: '-20% movement speed' }],
  },
  drum_100: {
    name: '100-Round Drum',
    feedType: 'drum_magazine',
    baseCapacity: 100,
    tacticalReloadTime: 8.5,
    emergencyReloadTime: 10.5,
    reliabilityRating: 0.85,
    weightLoaded: 2.4,
    weightEmpty: 1.0,
    feedRateModifier: 0.88,
    jamClearDifficulty: 8,
    specialEffects: [{ type: 'capacity_mod', value: -0.25, description: '-25% movement speed' }],
  },
};

// ============= SPRING MECHANICS (Gun Nut+ only) =============

export interface SpringState {
  tension: number;              // 0-100
  cyclesSinceReplacement: number;
  maxCyclesBeforeWeakening: number;
  weakSpringJamChance: number;  // Added jam chance when weak
}

/**
 * Calculate spring degradation per reload cycle
 */
export function degradeMagazineSpring(magazine: Magazine, cycles: number = 1): void {
  const degradePerCycle = 0.05;
  magazine.springTension = Math.max(0, magazine.springTension - (degradePerCycle * cycles));
  
  // Weak springs affect reliability
  if (magazine.springTension < 80) {
    const reliability = magazine.reliabilityRating;
    const penalty = ((80 - magazine.springTension) / 100) * 0.1;
    magazine.reliabilityRating = Math.max(0.5, reliability - penalty);
  }
}

/**
 * Calculate feed reliability based on magazine condition
 */
export function calculateFeedReliability(magazine: Magazine): number {
  const springFactor = magazine.springTension / 100;
  const lipsFactor = magazine.feedLipsCondition / 100;
  const followerFactor = magazine.followerCondition / 100;
  
  // Weighted average - feed lips are most critical
  return (springFactor * 0.35) + (lipsFactor * 0.45) + (followerFactor * 0.20);
}

// ============= RELOAD MECHANICS =============

export interface ReloadContext {
  isEmergency: boolean;         // Empty magazine
  userSkill: number;            // 0-100
  stressLevel: number;          // 0-1
  armInjury: number;            // 0-1 severity
  environment: 'normal' | 'rain' | 'mud' | 'dark';
  retainMagazine: boolean;
}

export interface ReloadResult {
  success: boolean;
  actualTime: number;
  magazineRetained: boolean;
  jamOccurred: boolean;
  jamClearTime?: number;
  message?: string;
}

/**
 * Calculate reload time based on all factors
 */
export function calculateReloadTime(magazine: Magazine, context: ReloadContext): number {
  const baseTime = context.isEmergency 
    ? magazine.emergencyReloadTime 
    : magazine.tacticalReloadTime;
  
  // Skill modifier (reduces time)
  const skillMultiplier = 1 - ((context.userSkill / 100) * magazine.reloadSkillModifier * 0.3);
  
  // Stress penalty (increases time)
  const stressPenalty = context.stressLevel * 0.3;
  
  // Injury penalty (increases time)
  const injuryPenalty = context.armInjury * 0.5;
  
  // Environmental penalties
  const envPenalties: Record<string, number> = {
    normal: 0,
    rain: 0.1,
    mud: 0.15,
    dark: 0.2,
  };
  const environmentPenalty = envPenalties[context.environment] || 0;
  
  // Magazine retention adds time
  const retentionPenalty = context.retainMagazine && !context.isEmergency ? 0.25 : 0;
  
  // Emergency reload adds chamber loading time
  const chamberTime = context.isEmergency ? 0.8 : 0;
  
  return baseTime * skillMultiplier * (1 + stressPenalty + injuryPenalty + environmentPenalty + retentionPenalty) + chamberTime;
}

/**
 * Process a reload attempt
 */
export function processReload(
  magazine: Magazine, 
  newMagazine: Magazine, 
  context: ReloadContext,
  depth: GunNutDepth = 'standard'
): ReloadResult {
  const reloadTime = calculateReloadTime(newMagazine, context);
  
  // Check for reload jam (worn magazines)
  let jamOccurred = false;
  let jamClearTime = 0;
  
  if (depth !== 'standard' && newMagazine.condition < 50) {
    const jamChance = ((50 - newMagazine.condition) / 100) * 0.15;
    if (Math.random() < jamChance) {
      jamOccurred = true;
      jamClearTime = newMagazine.jamClearDifficulty * 0.3;
    }
  }
  
  // Magazine retention for tactical reload
  const retained = context.retainMagazine && !context.isEmergency && magazine.currentAmmo > 0;
  
  return {
    success: true,
    actualTime: reloadTime + jamClearTime,
    magazineRetained: retained,
    jamOccurred,
    jamClearTime: jamOccurred ? jamClearTime : undefined,
    message: jamOccurred 
      ? "Magazine seats poorly... needs adjustment." 
      : retained 
        ? "Tactical reload complete. Partial magazine retained."
        : "Magazine swapped.",
  };
}

// ============= MAGAZINE MALFUNCTION SYSTEM =============

export type MagazineMalfunctionType = 
  | 'failure_to_feed'
  | 'double_feed' 
  | 'nose_dive'
  | 'spring_failure'
  | 'feed_lip_damage';

export interface MagazineMalfunction {
  type: MagazineMalfunctionType;
  severity: 'minor' | 'major' | 'critical';
  clearTime: number;
  ammunitionLoss: number;
  message: string;
}

/**
 * Check for magazine-related malfunction
 */
export function checkMagazineMalfunction(
  magazine: Magazine, 
  depth: GunNutDepth = 'standard'
): MagazineMalfunction | null {
  if (depth === 'standard') return null;
  
  const baseFailureRate = 1 - magazine.reliabilityRating;
  let adjustedRate = baseFailureRate;
  
  // Gun Nut+ adds detailed mechanics
  if (depth === 'gunnut_plus') {
    const feedReliability = calculateFeedReliability(magazine);
    adjustedRate = baseFailureRate * (1 + (1 - feedReliability));
  }
  
  if (Math.random() < adjustedRate) {
    const malfunctions: MagazineMalfunction[] = [
      {
        type: 'failure_to_feed',
        severity: 'minor',
        clearTime: 1.5,
        ammunitionLoss: 0,
        message: 'Round fails to feed properly.',
      },
      {
        type: 'double_feed',
        severity: 'major',
        clearTime: 3.0,
        ammunitionLoss: 1,
        message: 'Double feed! Two rounds jammed in the chamber.',
      },
      {
        type: 'nose_dive',
        severity: 'minor',
        clearTime: 1.0,
        ammunitionLoss: 0,
        message: 'Round nose-dives into feed ramp.',
      },
    ];
    
    // Add critical failures for very worn magazines
    if (depth === 'gunnut_plus' && magazine.springTension < 30) {
      malfunctions.push({
        type: 'spring_failure',
        severity: 'critical',
        clearTime: 0,
        ammunitionLoss: magazine.currentAmmo,
        message: 'Magazine spring fails completely! Magazine unusable.',
      });
    }
    
    return malfunctions[Math.floor(Math.random() * malfunctions.length)];
  }
  
  return null;
}

// ============= MAGAZINE WEAR SYSTEM =============

export function processMagazineWear(
  magazine: Magazine, 
  cyclesSinceLastMaintenance: number,
  depth: GunNutDepth = 'standard'
): { critical: boolean; replacementRequired: boolean } {
  if (depth === 'standard') {
    return { critical: false, replacementRequired: false };
  }
  
  const wearAccumulation = magazine.wearRate * cyclesSinceLastMaintenance;
  magazine.condition = Math.max(0, magazine.condition - wearAccumulation * 100);
  
  // Calculate reliability degradation
  if (magazine.condition < 80) {
    magazine.reliabilityRating = Math.max(0.5, magazine.reliabilityRating * 0.98);
  }
  
  if (magazine.condition < 50) {
    magazine.reliabilityRating = Math.max(0.4, magazine.reliabilityRating * 0.95);
    magazine.tacticalReloadTime *= 1.05;
    magazine.emergencyReloadTime *= 1.05;
  }
  
  // Critical failure threshold
  if (magazine.condition < 20) {
    return {
      critical: true,
      replacementRequired: true,
    };
  }
  
  return { critical: false, replacementRequired: false };
}

// ============= FACTORY FUNCTIONS =============

export function createMagazine(
  templateId: string,
  caliber: string,
  condition: number = 100
): Magazine {
  const templates = { ...BOX_MAGAZINES, ...DRUM_MAGAZINES };
  const template = templates[templateId] || BOX_MAGAZINES.stanag_30;
  
  return {
    id: `mag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    feedType: 'box_magazine',
    baseCapacity: 30,
    currentAmmo: template.baseCapacity || 30,
    tacticalReloadTime: 3.5,
    emergencyReloadTime: 4.2,
    reliabilityRating: 0.96,
    magazineRetention: true,
    weightLoaded: 0.45,
    weightEmpty: 0.12,
    reloadSkillModifier: 0.85,
    ammunitionTypes: [caliber],
    feedRateModifier: 1.0,
    jamClearDifficulty: 3,
    wearRate: 0.01,
    condition,
    springTension: condition,
    followerCondition: condition,
    feedLipsCondition: condition,
    rarityTier: 1,
    baseCost: 25,
    ...template,
    name: template.name || 'Standard Magazine',
  };
}

export default {
  BOX_MAGAZINES,
  DRUM_MAGAZINES,
  createMagazine,
  calculateReloadTime,
  processReload,
  checkMagazineMalfunction,
  processMagazineWear,
  degradeMagazineSpring,
  calculateFeedReliability,
};
