// Wound System - Injuries affect stats and heal over time

export type WoundType = 'cut' | 'bruise' | 'fracture' | 'burn' | 'concussion' | 'sprain' | 'puncture';
export type WoundLocation = 'head' | 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg' | 'hands' | 'feet';

export interface Wound {
  id: string;
  type: WoundType;
  location: WoundLocation;
  severity: number;          // 1-5
  currentHealing: number;    // 0-100, wound heals at 100
  inflictedAt: number;       // Timestamp
  isHealing: boolean;        // Whether actively healing
  treated: boolean;          // Whether received medical treatment
}

export interface WoundEffect {
  stat: string;
  modifier: number;          // Percentage reduction
}

// Stat penalties by wound type
export const WOUND_EFFECTS: Record<WoundType, string[]> = {
  cut: ['agility', 'endurance'],
  bruise: ['strength', 'endurance'],
  fracture: ['strength', 'agility', 'endurance'],
  burn: ['agility', 'charisma'],
  concussion: ['intelligence', 'perception'],
  sprain: ['agility', 'strength'],
  puncture: ['endurance', 'strength'],
};

// Location-specific additional penalties
export const LOCATION_EFFECTS: Record<WoundLocation, string[]> = {
  head: ['intelligence', 'perception', 'charisma'],
  torso: ['endurance', 'strength'],
  left_arm: ['strength'],
  right_arm: ['strength', 'agility'],
  left_leg: ['agility'],
  right_leg: ['agility'],
  hands: ['agility'],
  feet: ['agility'],
};

// Severity multipliers
export const SEVERITY_MULTIPLIERS: Record<number, number> = {
  1: 0.05,  // 5% penalty
  2: 0.10,  // 10% penalty
  3: 0.15,  // 15% penalty
  4: 0.25,  // 25% penalty
  5: 0.40,  // 40% penalty
};

// Healing rates (per hour of rest)
export const HEALING_RATES: Record<WoundType, number> = {
  cut: 4,
  bruise: 6,
  fracture: 1,
  burn: 2,
  concussion: 2,
  sprain: 3,
  puncture: 2,
};

// Create a new wound
export function createWound(
  type: WoundType,
  location: WoundLocation,
  severity: number = 1
): Wound {
  return {
    id: `wound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    location,
    severity: Math.max(1, Math.min(5, severity)),
    currentHealing: 0,
    inflictedAt: Date.now(),
    isHealing: false,
    treated: false,
  };
}

// Calculate total stat penalties from all wounds
export function calculateWoundPenalties(wounds: Wound[]): Record<string, number> {
  const penalties: Record<string, number> = {};
  
  wounds.forEach(wound => {
    if (wound.currentHealing >= 100) return; // Fully healed
    
    const healingFactor = 1 - (wound.currentHealing / 100); // Reduced penalty as it heals
    const severityMod = SEVERITY_MULTIPLIERS[wound.severity] || 0.1;
    
    // Apply wound type effects
    const typeEffects = WOUND_EFFECTS[wound.type] || [];
    typeEffects.forEach(stat => {
      penalties[stat] = (penalties[stat] || 0) + (severityMod * healingFactor);
    });
    
    // Apply location effects
    const locationEffects = LOCATION_EFFECTS[wound.location] || [];
    locationEffects.forEach(stat => {
      penalties[stat] = (penalties[stat] || 0) + (severityMod * 0.5 * healingFactor);
    });
  });
  
  // Cap penalties at 80% for any stat
  Object.keys(penalties).forEach(stat => {
    penalties[stat] = Math.min(0.8, penalties[stat]);
  });
  
  return penalties;
}

// Apply penalty to a stat value
export function applyWoundPenalty(baseValue: number, penaltyPercent: number): number {
  return Math.round(baseValue * (1 - penaltyPercent));
}

// Progress wound healing
export function healWound(wound: Wound, hoursRested: number, isResting: boolean = true): Wound {
  const baseRate = HEALING_RATES[wound.type] || 2;
  const treatmentBonus = wound.treated ? 1.5 : 1;
  const restBonus = isResting ? 1 : 0.3;
  
  const healingGain = baseRate * hoursRested * treatmentBonus * restBonus;
  
  return {
    ...wound,
    currentHealing: Math.min(100, wound.currentHealing + healingGain),
    isHealing: true,
  };
}

// Treat a wound (medical attention)
export function treatWound(wound: Wound): Wound {
  return {
    ...wound,
    treated: true,
    currentHealing: Math.min(100, wound.currentHealing + 20), // Immediate healing boost
  };
}

// Check if wound is fully healed
export function isFullyHealed(wound: Wound): boolean {
  return wound.currentHealing >= 100;
}

// Filter out fully healed wounds
export function removeHealedWounds(wounds: Wound[]): Wound[] {
  return wounds.filter(w => !isFullyHealed(w));
}

// Get wound description for display
export function getWoundDescription(wound: Wound): string {
  const severityLabels = ['Minor', 'Light', 'Moderate', 'Severe', 'Critical'];
  const typeLabels: Record<WoundType, string> = {
    cut: 'Cut',
    bruise: 'Bruise',
    fracture: 'Fracture',
    burn: 'Burn',
    concussion: 'Concussion',
    sprain: 'Sprain',
    puncture: 'Puncture',
  };
  const locationLabels: Record<WoundLocation, string> = {
    head: 'Head',
    torso: 'Torso',
    left_arm: 'Left Arm',
    right_arm: 'Right Arm',
    left_leg: 'Left Leg',
    right_leg: 'Right Leg',
    hands: 'Hands',
    feet: 'Feet',
  };
  
  const severity = severityLabels[wound.severity - 1] || 'Unknown';
  const type = typeLabels[wound.type] || wound.type;
  const location = locationLabels[wound.location] || wound.location;
  
  return `${severity} ${type} (${location})`;
}

// Get wound color based on severity
export function getWoundColor(severity: number): string {
  switch (severity) {
    case 1: return '#fbbf24'; // Amber
    case 2: return '#f97316'; // Orange
    case 3: return '#ef4444'; // Red
    case 4: return '#dc2626'; // Dark red
    case 5: return '#991b1b'; // Deep red
    default: return '#ef4444';
  }
}

// Get affected stats list for display
export function getAffectedStats(wound: Wound): string[] {
  const stats = new Set<string>();
  
  WOUND_EFFECTS[wound.type]?.forEach(s => stats.add(s));
  LOCATION_EFFECTS[wound.location]?.forEach(s => stats.add(s));
  
  return Array.from(stats);
}
