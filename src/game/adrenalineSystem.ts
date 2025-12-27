// Adrenaline & Pressure System - Hidden damage mechanics inspired by Six Days in Fallujah
// Under high stress, you might not realize you've been stabbed until the adrenaline wears off

export type AdrenalineThreshold = 'calm' | 'alert' | 'stressed' | 'adrenaline' | 'maxAdrenaline';

export type WoundCategory = 
  | 'scratch' | 'cut' | 'deep_cut' | 'stab_wound' 
  | 'gunshot_graze' | 'gunshot_wound' | 'blunt_trauma' 
  | 'broken_bone' | 'internal_bleeding';

export type BodyLocation = 
  | 'head' | 'neck' | 'torso' 
  | 'arm_left' | 'arm_right' 
  | 'leg_left' | 'leg_right'
  | 'hand_left' | 'hand_right';

export type WoundSymptom = 
  | 'stinging' | 'warm_wetness' | 'impact' | 'throbbing' 
  | 'burning' | 'numbness' | 'pressure' | 'crack_sound' 
  | 'dizziness' | 'nausea' | 'weakness';

export interface Wound {
  id: string;
  type: WoundCategory;
  typeName: string;
  location: BodyLocation;
  locationName: string;
  severity: number;
  hpDamage: number;
  bleedRate: number;
  symptoms: WoundSymptom[];
  inflictedAt: number;
  inflictedTurn: number;
  source: string;
  revealed: boolean;
  revealedAt?: number;
  revealReason?: string;
  treated: boolean;
  treatmentType?: string;
  treatedAt?: number;
  hideThreshold: number;
  revealDelay: number;
  isHidden: boolean;
  accumulatedBleedDamage?: number;
}

export interface WoundType {
  name: string;
  severity: number;
  hpDamage: { min: number; max: number };
  bleedRate: number;
  hideThreshold: number;
  revealDelay: number;
  symptoms: WoundSymptom[];
  assessDifficulty: number;
  mobilityPenalty?: number;
  hidden?: boolean;
}

export interface BodyLocationData {
  name: string;
  vitalMultiplier: number;
  hideBonus: number;
  bleedMultiplier: number;
  mobilityAffected?: boolean;
}

export interface AdrenalineState {
  current: number;
  max: number;
  decayRate: number;
  decayDelay: number;
  lastTriggerTime: number;
  buildRate: number;
  thresholds: {
    calm: number;
    alert: number;
    stressed: number;
    adrenaline: number;
    maxAdrenaline: number;
  };
}

export interface HiddenDamageState {
  wounds: Wound[];
  totalHiddenHP: number;
  bleedingRate: number;
  revealedWounds: Wound[];
}

export interface AdrenalineSystemState {
  adrenaline: AdrenalineState;
  hiddenDamage: HiddenDamageState;
}

export interface ThresholdInfo {
  name: string;
  description: string;
  color: string;
  maskingLevel: number;
}

export interface AdrenalineEvent {
  type: string;
  [key: string]: any;
}

// Wound type definitions
export const WOUND_TYPES: Record<WoundCategory, WoundType> = {
  scratch: {
    name: 'Scratch',
    severity: 1,
    hpDamage: { min: 1, max: 5 },
    bleedRate: 0,
    hideThreshold: 20,
    revealDelay: 10,
    symptoms: ['stinging'],
    assessDifficulty: 1
  },
  cut: {
    name: 'Cut',
    severity: 2,
    hpDamage: { min: 5, max: 15 },
    bleedRate: 0.5,
    hideThreshold: 30,
    revealDelay: 30,
    symptoms: ['warm_wetness', 'stinging'],
    assessDifficulty: 2
  },
  deep_cut: {
    name: 'Deep Cut',
    severity: 3,
    hpDamage: { min: 10, max: 25 },
    bleedRate: 1,
    hideThreshold: 45,
    revealDelay: 45,
    symptoms: ['warm_wetness', 'throbbing'],
    assessDifficulty: 3
  },
  stab_wound: {
    name: 'Stab Wound',
    severity: 4,
    hpDamage: { min: 15, max: 40 },
    bleedRate: 2,
    hideThreshold: 60,
    revealDelay: 60,
    symptoms: ['impact', 'warm_wetness', 'pressure'],
    assessDifficulty: 4
  },
  gunshot_graze: {
    name: 'Gunshot Graze',
    severity: 3,
    hpDamage: { min: 10, max: 20 },
    bleedRate: 1.5,
    hideThreshold: 50,
    revealDelay: 20,
    symptoms: ['burning', 'impact'],
    assessDifficulty: 3
  },
  gunshot_wound: {
    name: 'Gunshot Wound',
    severity: 5,
    hpDamage: { min: 25, max: 60 },
    bleedRate: 3,
    hideThreshold: 75,
    revealDelay: 90,
    symptoms: ['impact', 'numbness', 'warm_wetness'],
    assessDifficulty: 5
  },
  blunt_trauma: {
    name: 'Blunt Trauma',
    severity: 3,
    hpDamage: { min: 10, max: 30 },
    bleedRate: 0,
    hideThreshold: 40,
    revealDelay: 120,
    symptoms: ['impact', 'throbbing'],
    assessDifficulty: 3
  },
  broken_bone: {
    name: 'Broken Bone',
    severity: 4,
    hpDamage: { min: 15, max: 35 },
    bleedRate: 0,
    hideThreshold: 70,
    revealDelay: 60,
    symptoms: ['crack_sound', 'numbness', 'weakness'],
    assessDifficulty: 4,
    mobilityPenalty: 50
  },
  internal_bleeding: {
    name: 'Internal Bleeding',
    severity: 5,
    hpDamage: { min: 5, max: 15 },
    bleedRate: 2.5,
    hideThreshold: 80,
    revealDelay: 180,
    symptoms: ['dizziness', 'nausea', 'weakness'],
    assessDifficulty: 6,
    hidden: true
  }
};

// Body location definitions
export const BODY_LOCATIONS: Record<BodyLocation, BodyLocationData> = {
  head: {
    name: 'Head',
    vitalMultiplier: 2.0,
    hideBonus: -20,
    bleedMultiplier: 1.5
  },
  neck: {
    name: 'Neck',
    vitalMultiplier: 2.5,
    hideBonus: -30,
    bleedMultiplier: 2.0
  },
  torso: {
    name: 'Torso',
    vitalMultiplier: 1.5,
    hideBonus: 10,
    bleedMultiplier: 1.0
  },
  arm_left: {
    name: 'Left Arm',
    vitalMultiplier: 0.8,
    hideBonus: 0,
    bleedMultiplier: 0.8
  },
  arm_right: {
    name: 'Right Arm',
    vitalMultiplier: 0.8,
    hideBonus: 0,
    bleedMultiplier: 0.8
  },
  leg_left: {
    name: 'Left Leg',
    vitalMultiplier: 0.9,
    hideBonus: 20,
    bleedMultiplier: 0.9,
    mobilityAffected: true
  },
  leg_right: {
    name: 'Right Leg',
    vitalMultiplier: 0.9,
    hideBonus: 20,
    bleedMultiplier: 0.9,
    mobilityAffected: true
  },
  hand_left: {
    name: 'Left Hand',
    vitalMultiplier: 0.5,
    hideBonus: -10,
    bleedMultiplier: 0.7
  },
  hand_right: {
    name: 'Right Hand',
    vitalMultiplier: 0.5,
    hideBonus: -10,
    bleedMultiplier: 0.7
  }
};

// Vague symptom descriptions
const SYMPTOM_MESSAGES: Record<WoundSymptom, string[]> = {
  stinging: [
    'You feel a sharp sting but push through it.',
    'Something stings but you ignore it.',
    'A brief sharp sensation, probably nothing.'
  ],
  warm_wetness: [
    'You feel something warm and wet.',
    "There's a warm sensation spreading.",
    'Something feels damp.'
  ],
  impact: [
    'You felt an impact but adrenaline masks the pain.',
    'Something hit you hard.',
    'You stagger from an impact.'
  ],
  throbbing: [
    'A dull throb pulses somewhere.',
    'Something aches distantly.',
    'You feel a rhythmic pain somewhere.'
  ],
  burning: [
    'A burning sensation flares briefly.',
    'Something burns but you push through.',
    'Heat flares across your body.'
  ],
  numbness: [
    'Part of you feels numb.',
    'A strange numbness spreads.',
    "You can't quite feel something."
  ],
  pressure: [
    'You feel intense pressure.',
    'Something presses painfully.',
    'Pressure builds somewhere.'
  ],
  crack_sound: [
    'You heard something crack.',
    'A concerning sound, but no time to check.',
    'Something made an awful noise.'
  ],
  dizziness: [
    'A wave of dizziness passes.',
    'You feel lightheaded briefly.',
    'The world tilts momentarily.'
  ],
  nausea: [
    'A wave of nausea hits.',
    'You feel sick but push through.',
    'Your stomach lurches.'
  ],
  weakness: [
    'You feel suddenly weak.',
    'Strength seems to drain away.',
    'Something feels very wrong.'
  ]
};

// Create initial state
export function createAdrenalineState(): AdrenalineSystemState {
  return {
    adrenaline: {
      current: 0,
      max: 100,
      decayRate: 2,
      decayDelay: 30,
      lastTriggerTime: 0,
      buildRate: 15,
      thresholds: {
        calm: 0,
        alert: 20,
        stressed: 40,
        adrenaline: 60,
        maxAdrenaline: 80
      }
    },
    hiddenDamage: {
      wounds: [],
      totalHiddenHP: 0,
      bleedingRate: 0,
      revealedWounds: []
    }
  };
}

// Get current threshold name
export function getCurrentThreshold(state: AdrenalineSystemState): AdrenalineThreshold {
  const level = state.adrenaline.current;
  const t = state.adrenaline.thresholds;
  if (level >= t.maxAdrenaline) return 'maxAdrenaline';
  if (level >= t.adrenaline) return 'adrenaline';
  if (level >= t.stressed) return 'stressed';
  if (level >= t.alert) return 'alert';
  return 'calm';
}

// Get threshold display info
export function getThresholdInfo(threshold: AdrenalineThreshold): ThresholdInfo {
  const info: Record<AdrenalineThreshold, ThresholdInfo> = {
    calm: {
      name: 'Calm',
      description: 'Full awareness of your condition',
      color: '#22c55e',
      maskingLevel: 0
    },
    alert: {
      name: 'Alert',
      description: 'Heightened awareness, minor injuries may go unnoticed',
      color: '#84cc16',
      maskingLevel: 1
    },
    stressed: {
      name: 'Stressed',
      description: 'Focus narrowing, moderate injuries masked',
      color: '#eab308',
      maskingLevel: 2
    },
    adrenaline: {
      name: 'Adrenaline Rush',
      description: 'Fight or flight active, significant injuries masked',
      color: '#f97316',
      maskingLevel: 3
    },
    maxAdrenaline: {
      name: 'Peak Adrenaline',
      description: 'Maximum survival mode, even severe injuries may go unnoticed',
      color: '#ef4444',
      maskingLevel: 4
    }
  };
  return info[threshold];
}

// Trigger adrenaline spike
export function triggerAdrenaline(
  state: AdrenalineSystemState,
  amount: number,
  _source: string = 'danger'
): { state: AdrenalineSystemState; gain: number } {
  const diminishingFactor = 1 - (state.adrenaline.current / state.adrenaline.max) * 0.5;
  const actualGain = amount * diminishingFactor;
  
  return {
    state: {
      ...state,
      adrenaline: {
        ...state.adrenaline,
        current: Math.min(state.adrenaline.max, state.adrenaline.current + actualGain),
        lastTriggerTime: Date.now()
      }
    },
    gain: actualGain
  };
}

// Process adrenaline decay
export function processDecay(
  state: AdrenalineSystemState,
  deltaSeconds: number
): { state: AdrenalineSystemState; revealedWounds: Wound[]; decayed: boolean } {
  const timeSinceTrigger = (Date.now() - state.adrenaline.lastTriggerTime) / 1000;
  
  if (timeSinceTrigger < state.adrenaline.decayDelay || state.adrenaline.current <= 0) {
    return { state, revealedWounds: [], decayed: false };
  }
  
  const decayAmount = state.adrenaline.decayRate * (deltaSeconds / 60);
  const newAdrenaline = Math.max(0, state.adrenaline.current - decayAmount);
  
  let newState: AdrenalineSystemState = {
    ...state,
    adrenaline: {
      ...state.adrenaline,
      current: newAdrenaline
    }
  };
  
  // Check for wound reveals
  const { state: revealState, revealedWounds } = checkWoundReveal(newState);
  
  return {
    state: revealState,
    revealedWounds,
    decayed: true
  };
}

// Get random body location
function getRandomLocation(): BodyLocation {
  const weights: Record<BodyLocation, number> = {
    head: 5,
    neck: 2,
    torso: 30,
    arm_left: 15,
    arm_right: 15,
    leg_left: 12,
    leg_right: 12,
    hand_left: 4,
    hand_right: 5
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [location, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return location as BodyLocation;
  }
  
  return 'torso';
}

// Get vague symptom message
function getVagueSymptom(wound: Wound): string {
  const symptomType = wound.symptoms[0];
  const options = SYMPTOM_MESSAGES[symptomType] || ['You feel something wrong.'];
  return options[Math.floor(Math.random() * options.length)];
}

// Receive damage
export function receiveDamage(
  state: AdrenalineSystemState,
  woundTypeId: WoundCategory,
  location: BodyLocation | null = null,
  source: string = 'combat',
  currentTurn: number = 0
): { 
  state: AdrenalineSystemState; 
  wound: Wound; 
  hidden: boolean; 
  vagueSymptom?: string;
  damage: number;
} {
  const woundType = WOUND_TYPES[woundTypeId];
  
  // Trigger adrenaline from being hurt
  const { state: adrenalineState } = triggerAdrenaline(state, woundType.severity * 8, source);
  
  // Determine body location
  const bodyLocation = location || getRandomLocation();
  const locationData = BODY_LOCATIONS[bodyLocation];
  
  // Calculate damage
  const baseDamage = woundType.hpDamage.min + 
    Math.floor(Math.random() * (woundType.hpDamage.max - woundType.hpDamage.min));
  const actualDamage = Math.floor(baseDamage * locationData.vitalMultiplier);
  
  // Calculate bleed rate
  const bleedRate = woundType.bleedRate * locationData.bleedMultiplier;
  
  // Create wound object
  const wound: Wound = {
    id: `wound_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: woundTypeId,
    typeName: woundType.name,
    location: bodyLocation,
    locationName: locationData.name,
    severity: woundType.severity,
    hpDamage: actualDamage,
    bleedRate: bleedRate,
    symptoms: [...woundType.symptoms],
    inflictedAt: Date.now(),
    inflictedTurn: currentTurn,
    source,
    revealed: false,
    treated: false,
    hideThreshold: woundType.hideThreshold + locationData.hideBonus,
    revealDelay: woundType.revealDelay,
    isHidden: woundType.hidden || false
  };
  
  // Determine if wound is hidden
  const isWoundHidden = adrenalineState.adrenaline.current >= wound.hideThreshold;
  
  if (isWoundHidden) {
    const vagueSymptom = getVagueSymptom(wound);
    
    return {
      state: {
        ...adrenalineState,
        hiddenDamage: {
          ...adrenalineState.hiddenDamage,
          wounds: [...adrenalineState.hiddenDamage.wounds, wound],
          totalHiddenHP: adrenalineState.hiddenDamage.totalHiddenHP + actualDamage,
          bleedingRate: adrenalineState.hiddenDamage.bleedingRate + bleedRate
        }
      },
      wound,
      hidden: true,
      vagueSymptom,
      damage: actualDamage
    };
  } else {
    wound.revealed = true;
    wound.revealedAt = Date.now();
    
    return {
      state: {
        ...adrenalineState,
        hiddenDamage: {
          ...adrenalineState.hiddenDamage,
          revealedWounds: [...adrenalineState.hiddenDamage.revealedWounds, wound]
        }
      },
      wound,
      hidden: false,
      damage: actualDamage
    };
  }
}

// Check if wounds should reveal
function checkWoundReveal(state: AdrenalineSystemState): { 
  state: AdrenalineSystemState; 
  revealedWounds: Wound[] 
} {
  const revealedNow: Wound[] = [];
  const currentTime = Date.now();
  const remainingHidden: Wound[] = [];
  let newTotalHiddenHP = state.hiddenDamage.totalHiddenHP;
  let newBleedingRate = state.hiddenDamage.bleedingRate;
  const newRevealed = [...state.hiddenDamage.revealedWounds];
  
  for (const wound of state.hiddenDamage.wounds) {
    const adrenalineReveals = state.adrenaline.current < wound.hideThreshold;
    const timePassed = (currentTime - wound.inflictedAt) / 1000;
    const timeReveals = timePassed >= wound.revealDelay;
    
    if (adrenalineReveals || timeReveals) {
      wound.revealed = true;
      wound.revealedAt = currentTime;
      wound.revealReason = adrenalineReveals ? 'adrenaline_drop' : 'time';
      
      revealedNow.push(wound);
      newRevealed.push(wound);
      newTotalHiddenHP -= wound.hpDamage;
      newBleedingRate -= wound.bleedRate;
    } else {
      remainingHidden.push(wound);
    }
  }
  
  return {
    state: {
      ...state,
      hiddenDamage: {
        wounds: remainingHidden,
        totalHiddenHP: Math.max(0, newTotalHiddenHP),
        bleedingRate: Math.max(0, newBleedingRate),
        revealedWounds: newRevealed
      }
    },
    revealedWounds: revealedNow
  };
}

// Emit wound reveal events to event bus (import dynamically to avoid circular deps)
export function emitWoundRevealEvents(revealedWounds: Wound[], tick: number): void {
  // Dynamic import to avoid circular dependency
  import('./eventBus').then((module) => {
    const { eventBus } = module;
    for (const wound of revealedWounds) {
      eventBus.emitDamageReceived(
        'player',
        wound.hpDamage,
        wound.type,
        false, // no longer hidden
        tick
      );
    }
  });
}

// Generate wound reveal message
export function getWoundRevealMessage(wound: Wound): string {
  const revealMessages: Record<string, string[]> = {
    adrenaline_drop: [
      `As the adrenaline fades, you realize you've been ${wound.typeName.toLowerCase()}ed in the ${wound.locationName.toLowerCase()}!`,
      `The pain hits you now - a ${wound.typeName.toLowerCase()} to your ${wound.locationName.toLowerCase()}.`,
      `Your ${wound.locationName.toLowerCase()} screams with pain. You've been wounded worse than you thought.`
    ],
    time: [
      `You finally notice the ${wound.typeName.toLowerCase()} on your ${wound.locationName.toLowerCase()}.`,
      `Blood seeps from a ${wound.typeName.toLowerCase()} on your ${wound.locationName.toLowerCase()}.`,
      `The ${wound.typeName.toLowerCase()} in your ${wound.locationName.toLowerCase()} demands attention.`
    ],
    assessment: [
      `You discover a ${wound.typeName.toLowerCase()} on your ${wound.locationName.toLowerCase()}.`,
      `Checking yourself, you find a ${wound.typeName.toLowerCase()} - ${wound.locationName.toLowerCase()}.`,
      `Your assessment reveals a ${wound.typeName.toLowerCase()} to the ${wound.locationName.toLowerCase()}.`
    ]
  };
  
  const messages = revealMessages[wound.revealReason || 'time'] || revealMessages.time;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Assess self (player action to discover hidden wounds)
export function assessSelf(
  state: AdrenalineSystemState,
  thoroughness: 'quick' | 'careful' | 'thorough' = 'quick',
  medicalSkill: number = 0
): {
  state: AdrenalineSystemState;
  discoveredWounds: Wound[];
  message: string;
  status: 'clean' | 'found' | 'partial' | 'missed';
} {
  const assessmentTypes = {
    quick: { discoverChance: 0.5, adrenalineCost: 0 },
    careful: { discoverChance: 0.8, adrenalineCost: -10 },
    thorough: { discoverChance: 0.95, adrenalineCost: -25 }
  };
  
  const assessment = assessmentTypes[thoroughness];
  
  // Apply adrenaline change
  let newAdrenaline = state.adrenaline.current;
  if (assessment.adrenalineCost) {
    newAdrenaline = Math.max(0, newAdrenaline + assessment.adrenalineCost);
  }
  
  const discoveredWounds: Wound[] = [];
  const remainingHidden: Wound[] = [];
  let newTotalHiddenHP = state.hiddenDamage.totalHiddenHP;
  let newBleedingRate = state.hiddenDamage.bleedingRate;
  const newRevealed = [...state.hiddenDamage.revealedWounds];
  
  for (const wound of state.hiddenDamage.wounds) {
    const woundType = WOUND_TYPES[wound.type];
    let discoverChance = assessment.discoverChance;
    discoverChance += medicalSkill * 0.05;
    discoverChance -= woundType.assessDifficulty * 0.1;
    
    if (wound.isHidden) {
      discoverChance *= 0.5;
    }
    
    discoverChance = Math.max(0.1, Math.min(0.99, discoverChance));
    
    if (Math.random() < discoverChance) {
      wound.revealed = true;
      wound.revealedAt = Date.now();
      wound.revealReason = 'assessment';
      
      discoveredWounds.push(wound);
      newRevealed.push(wound);
      newTotalHiddenHP -= wound.hpDamage;
      newBleedingRate -= wound.bleedRate;
    } else {
      remainingHidden.push(wound);
    }
  }
  
  // Generate message
  let message: string;
  let status: 'clean' | 'found' | 'partial' | 'missed';
  
  if (discoveredWounds.length === 0 && remainingHidden.length === 0) {
    message = 'You check yourself over. No wounds found.';
    status = 'clean';
  } else if (discoveredWounds.length === 0 && remainingHidden.length > 0) {
    message = "You check yourself but don't find anything obvious. Something still feels off...";
    status = 'missed';
  } else if (discoveredWounds.length > 0 && remainingHidden.length > 0) {
    message = `You discover ${discoveredWounds.length} wound(s), but something still doesn't feel right...`;
    status = 'partial';
  } else {
    message = `You discover ${discoveredWounds.length} wound(s).`;
    status = 'found';
  }
  
  return {
    state: {
      adrenaline: {
        ...state.adrenaline,
        current: newAdrenaline
      },
      hiddenDamage: {
        wounds: remainingHidden,
        totalHiddenHP: Math.max(0, newTotalHiddenHP),
        bleedingRate: Math.max(0, newBleedingRate),
        revealedWounds: newRevealed
      }
    },
    discoveredWounds,
    message,
    status
  };
}

// Treat a wound
export function treatWound(
  state: AdrenalineSystemState,
  woundId: string,
  treatmentType: 'pressure' | 'bandage' | 'first_aid' | 'medical' = 'bandage'
): {
  state: AdrenalineSystemState;
  success: boolean;
  healBonus: number;
  bleedingStopped: boolean;
  error?: string;
} {
  const treatments = {
    pressure: { bleedReduction: 0.5, healBonus: 0 },
    bandage: { bleedReduction: 1.0, healBonus: 5 },
    first_aid: { bleedReduction: 1.0, healBonus: 15 },
    medical: { bleedReduction: 1.0, healBonus: 30 }
  };
  
  const treatment = treatments[treatmentType];
  
  const woundIndex = state.hiddenDamage.revealedWounds.findIndex(w => w.id === woundId);
  if (woundIndex === -1) {
    return { state, success: false, healBonus: 0, bleedingStopped: false, error: 'Wound not found' };
  }
  
  const wound = state.hiddenDamage.revealedWounds[woundIndex];
  if (wound.treated) {
    return { state, success: false, healBonus: 0, bleedingStopped: false, error: 'Already treated' };
  }
  
  const newBleedRate = Math.max(0, wound.bleedRate - treatment.bleedReduction);
  const updatedWounds = [...state.hiddenDamage.revealedWounds];
  updatedWounds[woundIndex] = {
    ...wound,
    bleedRate: newBleedRate,
    treated: true,
    treatmentType,
    treatedAt: Date.now()
  };
  
  return {
    state: {
      ...state,
      hiddenDamage: {
        ...state.hiddenDamage,
        revealedWounds: updatedWounds
      }
    },
    success: true,
    healBonus: treatment.healBonus,
    bleedingStopped: newBleedRate === 0
  };
}

// Get total active bleeding
export function getTotalActiveBleeding(state: AdrenalineSystemState): number {
  let total = state.hiddenDamage.bleedingRate;
  for (const wound of state.hiddenDamage.revealedWounds) {
    if (!wound.treated) {
      total += wound.bleedRate;
    }
  }
  return total;
}

// Get status summary
export function getAdrenalineStatus(state: AdrenalineSystemState): {
  adrenaline: number;
  maxAdrenaline: number;
  threshold: AdrenalineThreshold;
  thresholdInfo: ThresholdInfo;
  hiddenWounds: number;
  hiddenDamage: number;
  hiddenBleeding: number;
  revealedWounds: number;
  treatedWounds: number;
  totalActiveBleeding: number;
} {
  const threshold = getCurrentThreshold(state);
  
  return {
    adrenaline: state.adrenaline.current,
    maxAdrenaline: state.adrenaline.max,
    threshold,
    thresholdInfo: getThresholdInfo(threshold),
    hiddenWounds: state.hiddenDamage.wounds.length,
    hiddenDamage: state.hiddenDamage.totalHiddenHP,
    hiddenBleeding: state.hiddenDamage.bleedingRate,
    revealedWounds: state.hiddenDamage.revealedWounds.filter(w => !w.treated).length,
    treatedWounds: state.hiddenDamage.revealedWounds.filter(w => w.treated).length,
    totalActiveBleeding: getTotalActiveBleeding(state)
  };
}

// Build context for AI
export function buildAdrenalineContext(state: AdrenalineSystemState): string {
  const status = getAdrenalineStatus(state);
  
  let context = `\n## ADRENALINE & CONDITION\n\n`;
  context += `Adrenaline: ${status.adrenaline.toFixed(0)}/${status.maxAdrenaline} (${status.thresholdInfo.name})\n`;
  context += `State: ${status.thresholdInfo.description}\n`;
  
  if (status.hiddenWounds > 0) {
    context += `\n⚠️ SOMETHING FEELS WRONG - Player may have unnoticed injuries\n`;
    context += `(${status.hiddenWounds} hidden wound(s), ${status.hiddenDamage} pending damage)\n`;
  }
  
  if (status.revealedWounds > 0) {
    context += `\n### KNOWN WOUNDS (${status.revealedWounds} untreated)\n`;
    for (const wound of state.hiddenDamage.revealedWounds.filter(w => !w.treated)) {
      context += `- ${wound.typeName} (${wound.locationName}): `;
      context += wound.bleedRate > 0 ? `Bleeding (${wound.bleedRate}/min)\n` : `Not bleeding\n`;
    }
  }
  
  if (status.totalActiveBleeding > 0) {
    context += `\n🩸 ACTIVE BLEEDING: ${status.totalActiveBleeding.toFixed(1)} HP/minute\n`;
  }
  
  return context;
}

// Adrenaline triggers for various situations
export const ADRENALINE_TRIGGERS: Record<string, number> = {
  combat_start: 25,
  being_attacked: 20,
  near_death: 40,
  being_chased: 30,
  witnessing_violence: 15,
  receiving_threat: 20,
  loud_noise: 10,
  surprise: 15,
  fear: 25,
  anger: 20,
  intense_exercise: 15,
  drug_stimulant: 35
};

// Combat damage mapping
export const COMBAT_WOUND_MAPPING: Record<string, WoundCategory> = {
  punch: 'blunt_trauma',
  kick: 'blunt_trauma',
  knife_slash: 'cut',
  knife_stab: 'stab_wound',
  sword_slash: 'deep_cut',
  sword_stab: 'stab_wound',
  bullet: 'gunshot_wound',
  bullet_graze: 'gunshot_graze',
  explosion: 'blunt_trauma',
  fall: 'blunt_trauma'
};

// Serialization
export function serializeAdrenalineState(state: AdrenalineSystemState): string {
  return JSON.stringify(state);
}

export function deserializeAdrenalineState(data: string): AdrenalineSystemState {
  try {
    return JSON.parse(data);
  } catch {
    return createAdrenalineState();
  }
}
