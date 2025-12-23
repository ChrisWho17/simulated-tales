// Urban Zone System - Phase 2
// Surveillance, access control, NPC reactions based on zones

import { 
  UrbanZone, 
  UrbanLocation, 
  ZoneInteractionState, 
  ZoneReactionResult,
  AccessLevel,
  SurveillanceProfile,
  ZoneAtmosphere,
  OverstayConsequence
} from '@/types/urbanZone';
import { Player, NPC } from '@/types/game';

// ============= ZONE ACCESS EVALUATION =============

export function evaluateZoneAccess(
  zone: UrbanZone,
  player: Player,
  timeOfDay: 'day' | 'night',
  playerAppearance: {
    attire: string;
    grooming: string;
    bodyType: string;
  },
  playerBackground: {
    origin: string;
    class: string;
  }
): ZoneReactionResult {
  let accessScore = 50; // Base score
  const consequences: string[] = [];
  let stressChange = 0;
  const reputationChange: Record<string, number> = {};

  // Apply access level base difficulty
  const accessDifficulty: Record<AccessLevel, number> = {
    public: 0,
    semi_public: -10,
    restricted: -30,
    private: -50,
    secured: -70
  };
  accessScore += accessDifficulty[zone.accessLevel];

  // Find applicable access rule
  const applicableRule = zone.accessRules.find(
    rule => rule.timeOfDay === timeOfDay || rule.timeOfDay === 'always'
  );

  if (applicableRule) {
    // Check attire bonus
    if (applicableRule.modifiers.attireBonus && 
        playerAppearance.attire.includes(applicableRule.modifiers.attireBonus)) {
      accessScore += 20;
    }

    // Check background penalty
    if (applicableRule.modifiers.backgroundPenalty &&
        playerBackground.origin.includes(applicableRule.modifiers.backgroundPenalty)) {
      accessScore -= 25;
      stressChange += 5;
    }

    // Check reputation threshold
    if (applicableRule.modifiers.reputationThreshold) {
      const zoneRep = player.reputation[zone.id] || 0;
      if (zoneRep < applicableRule.modifiers.reputationThreshold) {
        accessScore -= 20;
      }
    }
  }

  // Apply NPC reaction modifiers
  const appearanceMod = zone.npcReactions.appearance[playerAppearance.attire] || 0;
  const backgroundMod = zone.npcReactions.background[playerBackground.origin] || 0;
  const timeMod = zone.npcReactions.timeOfDay[timeOfDay] || 0;

  accessScore += appearanceMod + backgroundMod + timeMod;

  // High surveillance zones are more strict
  if (zone.surveillance.level > 70) {
    accessScore -= 10;
    stressChange += 3;
  }

  // Determine result
  const allowed = accessScore >= 40;
  
  if (!allowed) {
    consequences.push('Access denied');
    stressChange += 10;
    reputationChange[zone.id] = -5;
  }

  // Atmosphere affects stress
  const atmosphereStress = calculateAtmosphereStress(zone.atmosphere);
  stressChange += atmosphereStress;

  return {
    allowed,
    message: allowed 
      ? `You enter ${zone.name}.` 
      : `You are turned away from ${zone.name}.`,
    stressChange,
    reputationChange,
    alertTriggered: !allowed && zone.surveillance.level > 50,
    consequences
  };
}

// ============= OVERSTAY DETECTION =============

export function checkOverstay(
  zone: UrbanZone,
  timeInZone: number,
  hasAuthorization: boolean
): { triggered: boolean; consequence?: OverstayConsequence } {
  if (hasAuthorization) return { triggered: false };

  for (const consequence of zone.overstayConsequences) {
    if (timeInZone >= consequence.timeThresholdMinutes) {
      return { triggered: true, consequence };
    }
  }

  return { triggered: false };
}

// ============= SURVEILLANCE EFFECTS =============

export function calculateSurveillanceRisk(
  surveillance: SurveillanceProfile,
  playerActions: string[],
  timeSpent: number
): {
  detectionRisk: number;
  potentialFlags: string[];
  escapeViability: number;
} {
  let detectionRisk = surveillance.level * 0.5;
  const potentialFlags: string[] = [];

  // Suspicious actions increase risk
  const suspiciousActions = ['loitering', 'photographing', 'following', 'hiding'];
  for (const action of playerActions) {
    if (suspiciousActions.some(s => action.includes(s))) {
      detectionRisk += 15;
      potentialFlags.push(`Suspicious behavior: ${action}`);
    }
  }

  // Time increases detection
  if (timeSpent > 30) {
    detectionRisk += Math.floor(timeSpent / 30) * 5;
    potentialFlags.push('Extended presence noted');
  }

  // Facial recognition adds significant risk
  if (surveillance.types.includes('facial_recognition')) {
    detectionRisk += 20;
  }

  // Escape viability based on routes and response time
  const escapeViability = Math.min(100, 
    surveillance.escapeRoutes * 20 + surveillance.responseTime * 3
  );

  return {
    detectionRisk: Math.min(100, detectionRisk),
    potentialFlags,
    escapeViability
  };
}

// ============= NPC REACTION GENERATION =============

export interface NPCZoneReaction {
  disposition: 'friendly' | 'neutral' | 'wary' | 'hostile';
  approachability: number; // 0-100
  informationWillingness: number; // 0-100
  reportingLikelihood: number; // 0-100
  dialogueModifiers: string[];
}

export function generateNPCReaction(
  zone: UrbanZone,
  npc: NPC,
  player: Player,
  playerAppearance: {
    attire: string;
    grooming: string;
    bodyType: string;
  }
): NPCZoneReaction {
  let dispositionScore = 50;
  const dialogueModifiers: string[] = [];

  // Zone atmosphere affects baseline
  const atmosphereModifiers: Record<string, number> = {
    welcoming: 20,
    neutral: 0,
    indifferent: -10,
    suspicious: -25,
    hostile: -40
  };
  dispositionScore += atmosphereModifiers[zone.atmosphere.socialTone] || 0;

  // NPC personality interacts with zone
  if (npc.meta.traits.includes('suspicious')) {
    dispositionScore -= 15;
    dialogueModifiers.push('eyes_you_carefully');
  }
  if (npc.meta.traits.includes('friendly')) {
    dispositionScore += 15;
    dialogueModifiers.push('open_body_language');
  }

  // Zone-specific appearance reactions
  const appearanceEffect = zone.npcReactions.appearance[playerAppearance.attire] || 0;
  dispositionScore += appearanceEffect;

  // Surveillance awareness makes NPCs more cautious
  if (zone.surveillance.level > 60) {
    dispositionScore -= zone.npcReactions.surveillanceAwareness;
    dialogueModifiers.push('speaks_quietly');
  }

  // Calculate derived values
  const disposition = 
    dispositionScore >= 70 ? 'friendly' :
    dispositionScore >= 40 ? 'neutral' :
    dispositionScore >= 20 ? 'wary' : 'hostile';

  return {
    disposition,
    approachability: Math.max(0, Math.min(100, dispositionScore + 10)),
    informationWillingness: Math.max(0, Math.min(100, dispositionScore - 10)),
    reportingLikelihood: zone.surveillance.level > 50 
      ? Math.max(0, 60 - dispositionScore) 
      : 0,
    dialogueModifiers
  };
}

// ============= ATMOSPHERE EFFECTS =============

function calculateAtmosphereStress(atmosphere: ZoneAtmosphere): number {
  let stress = 0;

  // Crowd density
  const crowdStress: Record<string, number> = {
    empty: 2,
    sparse: 0,
    moderate: 1,
    busy: 3,
    crowded: 8
  };
  stress += crowdStress[atmosphere.crowdDensity] || 0;

  // Noise level
  const noiseStress: Record<string, number> = {
    silent: 1,
    quiet: 0,
    moderate: 1,
    loud: 4,
    deafening: 10
  };
  stress += noiseStress[atmosphere.noiseLevel] || 0;

  // Lighting
  const lightingStress: Record<string, number> = {
    bright: 0,
    well_lit: 0,
    dim: 3,
    dark: 8,
    pitch_black: 15
  };
  stress += lightingStress[atmosphere.lighting] || 0;

  // Social tone
  const toneStress: Record<string, number> = {
    welcoming: -3,
    neutral: 0,
    indifferent: 2,
    suspicious: 6,
    hostile: 12
  };
  stress += toneStress[atmosphere.socialTone] || 0;

  return stress;
}

// ============= ZONE DESCRIPTION GENERATION =============

export function generateZoneDescription(
  zone: UrbanZone,
  location: UrbanLocation | null,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night',
  playerBackground: { origin: string }
): string {
  const atmosphere = location?.atmosphereOverride 
    ? { ...zone.atmosphere, ...location.atmosphereOverride }
    : zone.atmosphere;

  // Base description
  let description = location 
    ? location.timeDescriptions[timeOfDay] 
    : zone.description;

  // Add atmosphere details
  const crowdDescriptions: Record<string, string> = {
    empty: 'The area is deserted.',
    sparse: 'A few people move about.',
    moderate: 'People go about their business.',
    busy: 'The space bustles with activity.',
    crowded: 'Bodies press together in the crush.'
  };
  description += ` ${crowdDescriptions[atmosphere.crowdDensity]}`;

  // Surveillance awareness based on background
  if (zone.surveillance.level > 60) {
    if (playerBackground.origin === 'homeless') {
      description += ' Security cameras track your every move.';
    } else if (playerBackground.origin === 'college') {
      description += ' You notice the ubiquitous security cameras.';
    } else {
      description += ' The area feels well-monitored.';
    }
  }

  // Social tone
  if (atmosphere.socialTone === 'hostile') {
    description += ' Eyes follow you with open hostility.';
  } else if (atmosphere.socialTone === 'suspicious') {
    description += ' Glances linger a moment too long.';
  }

  return description;
}

// ============= ZONE STATE MANAGEMENT =============

export function createDefaultZoneState(): ZoneInteractionState {
  return {
    currentZone: 'residential_mid',
    currentLocation: 'home',
    timeInZone: 0,
    accessGranted: true,
    surveillanceAlerts: 0,
    lastSecurityCheck: 0,
    reputationInZone: {}
  };
}

export function updateZoneState(
  state: ZoneInteractionState,
  minutesPassed: number,
  zone: UrbanZone
): ZoneInteractionState {
  const newState = { ...state };
  newState.timeInZone += minutesPassed;

  // Check for security patrols in high surveillance zones
  if (zone.surveillance.level > 50) {
    const checkInterval = Math.max(10, 60 - zone.surveillance.level);
    if (newState.timeInZone - newState.lastSecurityCheck >= checkInterval) {
      newState.lastSecurityCheck = newState.timeInZone;
      // Security check occurred - could trigger events
    }
  }

  return newState;
}

// ============= ZONE TRANSITION =============

export function processZoneTransition(
  fromZone: UrbanZone | null,
  toZone: UrbanZone,
  player: Player,
  playerAppearance: { attire: string; grooming: string; bodyType: string },
  playerBackground: { origin: string; class: string },
  timeOfDay: 'day' | 'night'
): {
  success: boolean;
  travelTime: number;
  events: string[];
  stressChange: number;
  newState: ZoneInteractionState;
} {
  const events: string[] = [];
  let stressChange = 0;

  // Calculate travel time
  const travelTime = fromZone 
    ? fromZone.travelTime[toZone.id] || 15 
    : 0;

  // Evaluate access to new zone
  const accessResult = evaluateZoneAccess(
    toZone,
    player,
    timeOfDay,
    playerAppearance,
    playerBackground
  );

  if (!accessResult.allowed) {
    events.push(accessResult.message);
    events.push(...accessResult.consequences);
    stressChange += accessResult.stressChange;

    return {
      success: false,
      travelTime,
      events,
      stressChange,
      newState: createDefaultZoneState()
    };
  }

  // Successful transition
  events.push(accessResult.message);
  stressChange += accessResult.stressChange;

  // Zone contrast can cause stress (e.g., homeless person entering financial district)
  if (fromZone && fromZone.type !== toZone.type) {
    const contrastStress = calculateZoneContrastStress(fromZone, toZone, playerBackground);
    stressChange += contrastStress;
    if (contrastStress > 5) {
      events.push('The change in environment is jarring.');
    }
  }

  const newState: ZoneInteractionState = {
    currentZone: toZone.id,
    currentLocation: '',
    timeInZone: 0,
    accessGranted: true,
    surveillanceAlerts: 0,
    lastSecurityCheck: 0,
    reputationInZone: { [toZone.id]: player.reputation[toZone.id] || 0 }
  };

  return {
    success: true,
    travelTime,
    events,
    stressChange,
    newState
  };
}

function calculateZoneContrastStress(
  fromZone: UrbanZone,
  toZone: UrbanZone,
  playerBackground: { origin: string }
): number {
  // Higher surveillance contrast = more stress
  const surveillanceDiff = Math.abs(
    toZone.surveillance.level - fromZone.surveillance.level
  );
  
  // Class-based zones have contrast
  const classZones = ['residential_high', 'financial', 'downtown'];
  const lowClassZones = ['underground', 'industrial', 'residential_low'];
  
  let contrastStress = surveillanceDiff * 0.1;

  if (classZones.includes(toZone.type) && lowClassZones.includes(fromZone.type)) {
    contrastStress += 5;
    if (playerBackground.origin === 'homeless') {
      contrastStress += 10;
    }
  }

  return contrastStress;
}
