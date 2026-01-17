// Location Tracking System - Scopes ripple effects to player's current area
// Integrates with Urban Zone System for realistic spatial consequences

import {
  UrbanZone,
  UrbanLocation,
  ZoneInteractionState,
  ZoneType,
} from '@/types/urbanZone';
import { ActiveRipple, RipplePhase, RippleEffectType } from './rippleEffectSystem';

// ============= LOCATION STATE =============

export interface PlayerLocation {
  zoneId: string;
  zoneName: string;
  zoneType: ZoneType;
  locationId: string | null;
  locationName: string | null;
  region: string;
  district: string;
  timeEnteredZone: number;
  timeEnteredLocation: number;
}

export interface LocationHistory {
  entries: LocationHistoryEntry[];
  maxEntries: number;
}

export interface LocationHistoryEntry {
  location: PlayerLocation;
  enteredAt: number;
  leftAt: number | null;
  significantEvents: string[];
}

// ============= RIPPLE SCOPE TYPES =============

export type RippleScopeLevel = 
  | 'immediate'    // Same location only
  | 'local'        // Same zone
  | 'district'     // Connected zones
  | 'regional'     // All zones in region
  | 'global';      // Everywhere

export interface ScopedRipple extends ActiveRipple {
  scope: {
    level: RippleScopeLevel;
    originZone: string;
    originLocation: string | null;
    affectedZones: string[];
    spreadRate: number; // Hours to spread to next scope level
  };
}

// ============= SCOPE CONFIGURATION =============

// How different effect types propagate spatially
const EFFECT_SCOPE_MAP: Record<RippleEffectType, RippleScopeLevel> = {
  immediate: 'immediate',
  awareness: 'local',
  social: 'district',
  economic: 'regional',
  authority: 'district',
  political: 'regional',
  faction: 'regional',
  regional: 'global',
};

// Time in hours for ripples to spread to connected zones
const SPREAD_TIMING: Record<RippleScopeLevel, number> = {
  immediate: 0,
  local: 2,       // 2 hours to spread within zone
  district: 6,    // 6 hours to reach connected zones
  regional: 24,   // 1 day to reach the region
  global: 72,     // 3 days to reach everywhere
};

// ============= DEFAULT LOCATION =============

export function createDefaultLocation(): PlayerLocation {
  return {
    zoneId: 'residential_mid',
    zoneName: 'Midtown Residential',
    zoneType: 'residential_mid',
    locationId: 'home',
    locationName: 'Home',
    region: 'central_city',
    district: 'midtown',
    timeEnteredZone: 0,
    timeEnteredLocation: 0,
  };
}

// Location history limit - designed for 100k+ turn games
const MAX_LOCATION_HISTORY = 30; // Reduced for memory efficiency
const MAX_SIGNIFICANT_EVENTS_PER_LOCATION = 5;

export function createLocationHistory(): LocationHistory {
  return {
    entries: [],
    maxEntries: MAX_LOCATION_HISTORY,
  };
}

// ============= LOCATION TRACKING =============

export function updatePlayerLocation(
  current: PlayerLocation,
  newZone: UrbanZone,
  newLocation: UrbanLocation | null,
  currentTurn: number
): PlayerLocation {
  return {
    zoneId: newZone.id,
    zoneName: newZone.name,
    zoneType: newZone.type,
    locationId: newLocation?.id || null,
    locationName: newLocation?.name || null,
    region: extractRegion(newZone.id),
    district: extractDistrict(newZone.id),
    timeEnteredZone: current.zoneId !== newZone.id ? currentTurn : current.timeEnteredZone,
    timeEnteredLocation: currentTurn,
  };
}

export function addLocationHistoryEntry(
  history: LocationHistory,
  previousLocation: PlayerLocation,
  leftAt: number,
  significantEvents: string[] = []
): LocationHistory {
  // Limit significant events per entry - designed for 100k+ turns
  const trimmedEvents = significantEvents.slice(0, MAX_SIGNIFICANT_EVENTS_PER_LOCATION);
  
  const entry: LocationHistoryEntry = {
    location: previousLocation,
    enteredAt: previousLocation.timeEnteredLocation,
    leftAt,
    significantEvents: trimmedEvents,
  };

  const newEntries = [entry, ...history.entries].slice(0, MAX_LOCATION_HISTORY);
  
  return { ...history, entries: newEntries };
}

// ============= RIPPLE SCOPING =============

export function createScopedRipple(
  ripple: ActiveRipple,
  playerLocation: PlayerLocation,
  connectedZones: string[]
): ScopedRipple {
  // Determine initial scope based on highest effect type
  const maxScope = ripple.effects.reduce((max, effect) => {
    const effectScope = EFFECT_SCOPE_MAP[effect.type];
    return getScopeLevel(effectScope) > getScopeLevel(max) ? effectScope : max;
  }, 'immediate' as RippleScopeLevel);

  // Calculate affected zones based on scope
  const affectedZones = calculateAffectedZones(
    playerLocation.zoneId,
    maxScope,
    connectedZones,
    playerLocation.region
  );

  return {
    ...ripple,
    scope: {
      level: maxScope,
      originZone: playerLocation.zoneId,
      originLocation: playerLocation.locationId,
      affectedZones,
      spreadRate: SPREAD_TIMING[maxScope],
    },
  };
}

export function isRippleRelevantToLocation(
  ripple: ScopedRipple,
  playerLocation: PlayerLocation,
  currentTurn: number
): boolean {
  // Always relevant if player is in origin zone
  if (playerLocation.zoneId === ripple.scope.originZone) {
    return true;
  }

  // Check if ripple has spread to player's zone
  if (!ripple.scope.affectedZones.includes(playerLocation.zoneId)) {
    return false;
  }

  // Calculate if enough time has passed for spread
  const turnsSinceRipple = currentTurn - ripple.triggerTurn;
  const hoursForSpread = calculateSpreadTime(
    ripple.scope.originZone,
    playerLocation.zoneId,
    ripple.scope.level
  );

  return turnsSinceRipple >= hoursForSpread;
}

export function filterRipplesByLocation(
  ripples: ScopedRipple[],
  playerLocation: PlayerLocation,
  currentTurn: number
): ScopedRipple[] {
  return ripples.filter(ripple => 
    isRippleRelevantToLocation(ripple, playerLocation, currentTurn)
  );
}

// ============= EFFECT PHASE FILTERING =============

export function filterPhasesByLocation(
  ripple: ScopedRipple,
  phase: RipplePhase,
  playerLocation: PlayerLocation,
  currentTurn: number
): { relevant: boolean; intensity: number } {
  const effectScope = EFFECT_SCOPE_MAP[phase.type];
  
  // Origin zone gets full intensity
  if (playerLocation.zoneId === ripple.scope.originZone) {
    return { relevant: true, intensity: 1.0 };
  }

  // Calculate distance-based intensity falloff
  const distance = calculateZoneDistance(
    ripple.scope.originZone,
    playerLocation.zoneId
  );

  // Check if effect scope reaches this distance
  const scopeReach = getScopeLevel(effectScope);
  if (distance > scopeReach) {
    return { relevant: false, intensity: 0 };
  }

  // Calculate intensity based on distance (inverse square with floor)
  const intensity = Math.max(0.1, 1 / Math.pow(distance + 1, 0.5));

  // Add time delay for spread
  const spreadDelay = SPREAD_TIMING[effectScope] * distance;
  const turnsSinceRipple = currentTurn - ripple.triggerTurn;
  
  if (turnsSinceRipple < phase.delay + spreadDelay) {
    return { relevant: false, intensity: 0 };
  }

  return { relevant: true, intensity };
}

// ============= LOCATION-AWARE CONSEQUENCES =============

export interface LocationConsequence {
  description: string;
  zones: string[];
  intensity: number;
  timeRemaining: number;
}

export function getActiveConsequencesForLocation(
  ripples: ScopedRipple[],
  playerLocation: PlayerLocation,
  currentTurn: number
): LocationConsequence[] {
  const consequences: LocationConsequence[] = [];

  for (const ripple of ripples) {
    if (ripple.expired) continue;

    for (const effect of ripple.effects) {
      if (!effect.triggered) continue;

      const { relevant, intensity } = filterPhasesByLocation(
        ripple,
        effect,
        playerLocation,
        currentTurn
      );

      if (relevant && intensity > 0.2) {
        // Calculate remaining duration (effects fade over time)
        const effectAge = currentTurn - (ripple.triggerTurn + effect.delay);
        const baseDuration = getEffectDuration(effect.type, ripple.severity);
        const timeRemaining = Math.max(0, baseDuration - effectAge);

        if (timeRemaining > 0) {
          consequences.push({
            description: effect.description,
            zones: ripple.scope.affectedZones,
            intensity: intensity * (effect.magnitude / 100),
            timeRemaining,
          });
        }
      }
    }
  }

  return consequences;
}

// ============= HELPER FUNCTIONS =============

function getScopeLevel(scope: RippleScopeLevel): number {
  const levels: Record<RippleScopeLevel, number> = {
    immediate: 0,
    local: 1,
    district: 2,
    regional: 3,
    global: 4,
  };
  return levels[scope];
}

function calculateAffectedZones(
  originZone: string,
  scope: RippleScopeLevel,
  connectedZones: string[],
  region: string
): string[] {
  const zones = new Set<string>([originZone]);

  if (scope === 'immediate') {
    return [originZone];
  }

  if (scope === 'local') {
    return [originZone];
  }

  if (scope === 'district') {
    connectedZones.forEach(z => zones.add(z));
    return Array.from(zones);
  }

  if (scope === 'regional') {
    // All zones in region (simplified - would use zone data in full implementation)
    connectedZones.forEach(z => zones.add(z));
    // Add additional regional zones
    return Array.from(zones);
  }

  // Global - all zones
  return ['*']; // Special marker for all zones
}

function calculateSpreadTime(
  originZone: string,
  targetZone: string,
  scopeLevel: RippleScopeLevel
): number {
  const distance = calculateZoneDistance(originZone, targetZone);
  const baseTime = SPREAD_TIMING[scopeLevel];
  return baseTime * distance;
}

function calculateZoneDistance(zoneA: string, zoneB: string): number {
  if (zoneA === zoneB) return 0;

  // Simplified distance calculation based on zone type differences
  // In full implementation, would use actual zone graph distances
  const typeA = extractZoneType(zoneA);
  const typeB = extractZoneType(zoneB);

  // Adjacent zone types = distance 1, otherwise estimate based on category
  const adjacentTypes: Record<string, string[]> = {
    downtown: ['financial', 'commercial', 'entertainment'],
    financial: ['downtown', 'commercial', 'residential_high'],
    commercial: ['downtown', 'financial', 'residential_mid', 'entertainment'],
    residential_low: ['industrial', 'residential_mid'],
    residential_mid: ['commercial', 'residential_low', 'residential_high'],
    residential_high: ['financial', 'residential_mid', 'institutional'],
    industrial: ['residential_low', 'transit', 'underground'],
    entertainment: ['downtown', 'commercial'],
    institutional: ['residential_high', 'downtown'],
    underground: ['industrial', 'transit'],
    transit: ['industrial', 'underground', 'commercial'],
    digital: [], // Special case - affects all equally
  };

  if (adjacentTypes[typeA]?.includes(typeB)) {
    return 1;
  }

  // Calculate hop distance
  const visited = new Set<string>([typeA]);
  let queue = [typeA];
  let distance = 0;

  while (queue.length > 0 && distance < 5) {
    distance++;
    const nextQueue: string[] = [];
    
    for (const current of queue) {
      for (const adjacent of adjacentTypes[current] || []) {
        if (adjacent === typeB) {
          return distance;
        }
        if (!visited.has(adjacent)) {
          visited.add(adjacent);
          nextQueue.push(adjacent);
        }
      }
    }
    
    queue = nextQueue;
  }

  return 3; // Default distance for unconnected zones
}

function extractZoneType(zoneId: string): string {
  // Extract zone type from ID (e.g., "downtown_central" -> "downtown")
  const types: ZoneType[] = [
    'downtown', 'financial', 'commercial', 'residential_low',
    'residential_mid', 'residential_high', 'industrial',
    'entertainment', 'institutional', 'underground', 'transit', 'digital'
  ];
  
  for (const type of types) {
    if (zoneId.includes(type)) return type;
  }
  
  return zoneId.split('_')[0] || 'commercial';
}

function extractRegion(zoneId: string): string {
  // Extract region from zone ID (simplified)
  const parts = zoneId.split('_');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return 'central';
}

function extractDistrict(zoneId: string): string {
  // Extract district from zone ID (simplified)
  return zoneId.split('_').slice(0, -1).join('_') || zoneId;
}

function getEffectDuration(type: RippleEffectType, severity: string): number {
  // Duration in turns (hours) based on effect type and severity
  const baseDurations: Record<RippleEffectType, number> = {
    immediate: 1,
    awareness: 24,
    social: 72,
    economic: 168,   // 1 week
    authority: 48,
    political: 336,  // 2 weeks
    faction: 168,
    regional: 720,   // 1 month
  };

  const severityMultipliers: Record<string, number> = {
    trivial: 0.5,
    minor: 0.75,
    moderate: 1.0,
    major: 1.5,
    severe: 2.0,
    catastrophic: 3.0,
  };

  return baseDurations[type] * (severityMultipliers[severity] || 1.0);
}

// ============= AI CONTEXT BUILDER =============

export function buildLocationContext(
  playerLocation: PlayerLocation,
  history: LocationHistory,
  activeConsequences: LocationConsequence[]
): string {
  const lines: string[] = [
    '## LOCATION CONTEXT',
    '',
    `Current Zone: ${playerLocation.zoneName} (${playerLocation.zoneType})`,
    playerLocation.locationName ? `Specific Location: ${playerLocation.locationName}` : '',
    `Region: ${playerLocation.region}, District: ${playerLocation.district}`,
    '',
  ];

  // Recent locations
  if (history.entries.length > 0) {
    lines.push('### Recent Locations:');
    for (const entry of history.entries.slice(0, 5)) {
      const duration = entry.leftAt ? entry.leftAt - entry.enteredAt : 'ongoing';
      lines.push(`- ${entry.location.zoneName}: ${duration} turns`);
      if (entry.significantEvents.length > 0) {
        lines.push(`  Events: ${entry.significantEvents.join(', ')}`);
      }
    }
    lines.push('');
  }

  // Active consequences in this location
  if (activeConsequences.length > 0) {
    lines.push('### Active Effects Here:');
    for (const consequence of activeConsequences) {
      const intensityDesc = consequence.intensity > 0.7 ? 'Strong' :
                           consequence.intensity > 0.4 ? 'Moderate' : 'Faint';
      lines.push(`- ${intensityDesc}: ${consequence.description} (${consequence.timeRemaining}h remaining)`);
    }
    lines.push('');
  }

  return lines.filter(l => l !== '').join('\n');
}

export function buildRippleScopeContext(
  scopedRipples: ScopedRipple[],
  playerLocation: PlayerLocation,
  currentTurn: number
): string {
  const relevantRipples = filterRipplesByLocation(scopedRipples, playerLocation, currentTurn);
  
  if (relevantRipples.length === 0) {
    return '';
  }

  const lines: string[] = [
    '## CONSEQUENCE RIPPLES AFFECTING THIS AREA',
    '',
  ];

  for (const ripple of relevantRipples) {
    const distance = calculateZoneDistance(ripple.scope.originZone, playerLocation.zoneId);
    const distanceDesc = distance === 0 ? 'originated here' :
                        distance === 1 ? 'from nearby' :
                        distance === 2 ? 'from the district' : 'from afar';

    lines.push(`### ${ripple.triggerEvent} (${distanceDesc})`);
    lines.push(`Severity: ${ripple.severity}`);
    
    const pendingEffects = ripple.effects.filter(e => !e.triggered);
    if (pendingEffects.length > 0) {
      lines.push('Upcoming consequences:');
      for (const effect of pendingEffects.slice(0, 3)) {
        const turnsUntil = (ripple.triggerTurn + effect.delay) - currentTurn;
        if (turnsUntil > 0) {
          lines.push(`- In ${turnsUntil}h: ${effect.description}`);
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
