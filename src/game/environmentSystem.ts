// Environment as Active Force - Phase 5
// Environmental pressure, resource scarcity, decay systems

import { NPC, Player, GameState, Location } from '@/types/game';

// ============= ENVIRONMENTAL PRESSURE VECTORS (5.1) =============

export interface EnvironmentalPressure {
  exposure: number;      // Weather, temperature effects (0-100)
  scarcity: number;      // Resource availability pressure (0-100)
  attrition: number;     // Fatigue, hunger, wear (0-100)
  uncertainty: number;   // Incomplete information (0-100)
  decay: number;         // Things breaking down (0-100)
}

export interface PlayerCondition {
  warmth: number;        // 0-100, affected by weather/clothing/shelter
  satiation: number;     // 0-100, hunger inverse
  hydration: number;     // 0-100, thirst inverse
  fatigue: number;       // 0-100 (100 = exhausted)
  condition: number;     // Equipment condition 0-100
}

export function createDefaultCondition(): PlayerCondition {
  return {
    warmth: 70,
    satiation: 70,
    hydration: 80,
    fatigue: 20,
    condition: 90,
  };
}

export interface LocationEnvironment {
  shelter: number;       // 0-100, protection from elements
  safety: number;        // 0-100, danger level inverse
  resources: number;     // 0-100, available resources
  infrastructure: number; // 0-100, services/facilities
}

export const locationEnvironments: Record<string, LocationEnvironment> = {
  tavern_main: { shelter: 95, safety: 85, resources: 70, infrastructure: 80 },
  tavern_kitchen: { shelter: 100, safety: 90, resources: 85, infrastructure: 75 },
  tavern_upstairs: { shelter: 100, safety: 95, resources: 30, infrastructure: 60 },
  town_square: { shelter: 20, safety: 70, resources: 40, infrastructure: 50 },
  market: { shelter: 30, safety: 75, resources: 90, infrastructure: 70 },
  alley: { shelter: 40, safety: 30, resources: 20, infrastructure: 10 },
};

export function calculateEnvironmentalPressure(
  condition: PlayerCondition,
  location: LocationEnvironment,
  weather: { type: string; severity: number },
  timeOfDay: string
): EnvironmentalPressure {
  // Exposure based on shelter and weather
  let exposure = 0;
  if (weather.type !== 'clear') {
    const weatherPressure = weather.severity * 15;
    const shelterReduction = location.shelter * 0.8;
    exposure = Math.max(0, weatherPressure - shelterReduction);
  }
  if (timeOfDay === 'night' || timeOfDay === 'late_night') {
    exposure += 10;
  }
  
  // Scarcity based on location resources
  const scarcity = 100 - location.resources;
  
  // Attrition based on current condition
  const attrition = (
    (100 - condition.satiation) * 0.3 +
    (100 - condition.hydration) * 0.3 +
    condition.fatigue * 0.4
  );
  
  // Uncertainty based on safety and time
  let uncertainty = 100 - location.safety;
  if (timeOfDay === 'night' || timeOfDay === 'late_night') {
    uncertainty += 20;
  }
  
  // Decay based on infrastructure
  const decay = 100 - location.infrastructure;
  
  return {
    exposure: Math.min(100, exposure),
    scarcity: Math.min(100, scarcity),
    attrition: Math.min(100, attrition),
    uncertainty: Math.min(100, uncertainty),
    decay: Math.min(100, decay),
  };
}

export function getEnvironmentalStressContribution(pressure: EnvironmentalPressure): number {
  // Each pressure type contributes to stress
  return (
    pressure.exposure * 0.2 +
    pressure.scarcity * 0.15 +
    pressure.attrition * 0.25 +
    pressure.uncertainty * 0.2 +
    pressure.decay * 0.1
  );
}

// ============= RESOURCE SCARCITY SYSTEM (5.2) =============

export type ResourceType = 
  | 'food'
  | 'water'
  | 'fuel'
  | 'medicine'
  | 'tools'
  | 'currency'
  | 'information'
  | 'trust';

export interface Resource {
  type: ResourceType;
  quantity: number;
  quality: number;        // 0-100, affects effectiveness
  decay: number;          // Rate of degradation per tick
  location: string;       // Where stored
  visibility: 'hidden' | 'visible' | 'obvious';
}

export interface ResourcePool {
  resources: Resource[];
  lastUpdated: number;
}

export type ScarcityLevel = 
  | 'abundant'     // Comfort, no stress
  | 'adequate'     // Slight inconvenience
  | 'rationing'    // Forced choices
  | 'competition'  // Conflict over access
  | 'desperation'; // Violence/betrayal normalized

export function calculateScarcityLevel(quantity: number, need: number): ScarcityLevel {
  const ratio = quantity / need;
  
  if (ratio >= 1.5) return 'abundant';
  if (ratio >= 1.0) return 'adequate';
  if (ratio >= 0.6) return 'rationing';
  if (ratio >= 0.3) return 'competition';
  return 'desperation';
}

export function getScarcityEffects(level: ScarcityLevel): {
  stressModifier: number;
  socialTension: number;
  moralFlexibility: number;
  description: string;
} {
  switch (level) {
    case 'abundant':
      return { 
        stressModifier: -5, 
        socialTension: 0, 
        moralFlexibility: 0,
        description: 'Resources are plentiful. People are relaxed.',
      };
    case 'adequate':
      return { 
        stressModifier: 0, 
        socialTension: 5, 
        moralFlexibility: 0,
        description: 'There is enough, but people are mindful.',
      };
    case 'rationing':
      return { 
        stressModifier: 10, 
        socialTension: 20, 
        moralFlexibility: 10,
        description: 'Supplies are carefully managed. Tensions rise.',
      };
    case 'competition':
      return { 
        stressModifier: 25, 
        socialTension: 40, 
        moralFlexibility: 30,
        description: 'Not enough for everyone. Conflict is common.',
      };
    case 'desperation':
      return { 
        stressModifier: 50, 
        socialTension: 70, 
        moralFlexibility: 60,
        description: 'Survival at any cost. Normal rules suspended.',
      };
  }
}

export function processResourceDecay(resources: Resource[], tick: number): Resource[] {
  return resources
    .map(r => ({
      ...r,
      quality: Math.max(0, r.quality - r.decay),
      quantity: r.quality <= 10 ? Math.max(0, r.quantity - 1) : r.quantity,
    }))
    .filter(r => r.quantity > 0);
}

// ============= DECAY & DEGRADATION (5.3) =============

export interface DecayableEntity {
  id: string;
  type: 'equipment' | 'relationship' | 'memory' | 'infrastructure' | 'health' | 'knowledge';
  currentCondition: number; // 0-100
  maxCondition: number;
  decayRate: number;        // Per tick
  lastMaintained: number;   // Tick of last repair/refresh
  qualityGrade: 'poor' | 'average' | 'good' | 'excellent';
}

export function createDecayable(
  id: string,
  type: DecayableEntity['type'],
  quality: DecayableEntity['qualityGrade'],
  tick: number
): DecayableEntity {
  const gradeMultipliers = {
    poor: { max: 60, decay: 0.5 },
    average: { max: 80, decay: 0.3 },
    good: { max: 100, decay: 0.2 },
    excellent: { max: 100, decay: 0.1 },
  };
  
  const grade = gradeMultipliers[quality];
  
  return {
    id,
    type,
    currentCondition: grade.max,
    maxCondition: grade.max,
    decayRate: grade.decay,
    lastMaintained: tick,
    qualityGrade: quality,
  };
}

export function processDecay(entity: DecayableEntity, tick: number): DecayableEntity {
  const ticksSinceMaintenance = tick - entity.lastMaintained;
  
  // Decay accelerates with time since maintenance
  const accelerator = 1 + Math.floor(ticksSinceMaintenance / 100) * 0.1;
  const actualDecay = entity.decayRate * accelerator;
  
  return {
    ...entity,
    currentCondition: Math.max(0, entity.currentCondition - actualDecay),
  };
}

export function maintainEntity(entity: DecayableEntity, skillLevel: number, tick: number): DecayableEntity {
  // Repair amount based on skill (0-100)
  const repairAmount = 10 + skillLevel * 0.3;
  
  // Never fully restored - scars remain
  const maxRestoration = entity.maxCondition * 0.95;
  
  return {
    ...entity,
    currentCondition: Math.min(maxRestoration, entity.currentCondition + repairAmount),
    lastMaintained: tick,
    // Repeated repairs reduce max condition slightly
    maxCondition: Math.max(50, entity.maxCondition - 1),
  };
}

export function getDecayEffects(entity: DecayableEntity): {
  functional: boolean;
  effectiveness: number;
  failureRisk: number;
  description: string;
} {
  const condition = entity.currentCondition;
  
  if (condition <= 0) {
    return {
      functional: false,
      effectiveness: 0,
      failureRisk: 100,
      description: 'Completely broken/lost',
    };
  }
  
  if (condition <= 20) {
    return {
      functional: true,
      effectiveness: 0.3,
      failureRisk: 50,
      description: 'Barely functional, may fail at any moment',
    };
  }
  
  if (condition <= 50) {
    return {
      functional: true,
      effectiveness: 0.6,
      failureRisk: 20,
      description: 'Worn but usable, reduced effectiveness',
    };
  }
  
  if (condition <= 75) {
    return {
      functional: true,
      effectiveness: 0.85,
      failureRisk: 5,
      description: 'Some wear showing, mostly reliable',
    };
  }
  
  return {
    functional: true,
    effectiveness: 1.0,
    failureRisk: 1,
    description: 'Good condition',
  };
}

// Relationship decay special handling
export function processRelationshipDecay(
  lastInteraction: number,
  currentTick: number,
  currentTrust: number,
  intimacy: number
): { newTrust: number; newIntimacy: number } {
  const ticksSinceContact = currentTick - lastInteraction;
  
  // Relationships need maintenance
  if (ticksSinceContact > 50) {
    const decayFactor = Math.min(0.5, (ticksSinceContact - 50) / 200);
    
    // High intimacy decays slower
    const intimacyProtection = intimacy * 0.01;
    const effectiveDecay = Math.max(0, decayFactor - intimacyProtection);
    
    return {
      newTrust: Math.max(-100, currentTrust - effectiveDecay * 20),
      newIntimacy: Math.max(0, intimacy - effectiveDecay * 10),
    };
  }
  
  return { newTrust: currentTrust, newIntimacy: intimacy };
}

// ============= ENVIRONMENT TICK PROCESSING =============

export interface EnvironmentTickResult {
  conditionChanges: Partial<PlayerCondition>;
  stressChange: number;
  events: string[];
  warnings: string[];
}

export function processEnvironmentTick(
  playerCondition: PlayerCondition,
  locationId: string,
  weather: { type: string; severity: number },
  timeOfDay: string
): EnvironmentTickResult {
  const location = locationEnvironments[locationId] || {
    shelter: 50,
    safety: 50,
    resources: 50,
    infrastructure: 50,
  };
  
  const pressure = calculateEnvironmentalPressure(
    playerCondition,
    location,
    weather,
    timeOfDay
  );
  
  const result: EnvironmentTickResult = {
    conditionChanges: {},
    stressChange: 0,
    events: [],
    warnings: [],
  };
  
  // Process warmth
  if (pressure.exposure > 30) {
    const warmthLoss = Math.floor(pressure.exposure * 0.1);
    result.conditionChanges.warmth = -warmthLoss;
    if (playerCondition.warmth - warmthLoss < 30) {
      result.warnings.push('You are getting dangerously cold.');
    }
  } else if (location.shelter > 70) {
    result.conditionChanges.warmth = 5; // Recover warmth in shelter
  }
  
  // Process hunger (satiation decreases over time)
  result.conditionChanges.satiation = -2;
  if (playerCondition.satiation < 20) {
    result.warnings.push('Hunger gnaws at you.');
    result.stressChange += 5;
  }
  
  // Process fatigue
  if (timeOfDay === 'night' || timeOfDay === 'late_night') {
    result.conditionChanges.fatigue = 3;
    if (playerCondition.fatigue > 80) {
      result.warnings.push('Exhaustion weighs heavily on you.');
      result.stressChange += 10;
    }
  }
  
  // Environmental stress contribution
  result.stressChange += getEnvironmentalStressContribution(pressure) * 0.1;
  
  // Equipment decay
  if (pressure.decay > 50) {
    result.conditionChanges.condition = -1;
    if (playerCondition.condition < 30) {
      result.warnings.push('Your equipment is falling apart.');
    }
  }
  
  return result;
}
