// Urban Zone System Types
// Comprehensive location system with surveillance, ownership, and access rules

export type ZoneType = 
  | 'downtown'
  | 'financial'
  | 'commercial'
  | 'residential_low'
  | 'residential_mid'
  | 'residential_high'
  | 'industrial'
  | 'entertainment'
  | 'institutional'
  | 'underground'
  | 'transit'
  | 'digital';

export type OwnershipType = 
  | 'corporate'
  | 'government'
  | 'private'
  | 'community'
  | 'disputed'
  | 'abandoned';

export type AccessLevel = 
  | 'public'
  | 'semi_public'
  | 'restricted'
  | 'private'
  | 'secured';

export type DataCollectionType =
  | 'facial_recognition'
  | 'license_plate'
  | 'purchase_tracking'
  | 'movement_heatmap'
  | 'social_media'
  | 'utility_usage'
  | 'financial_transactions'
  | 'biometric'
  | 'keycard_logs'
  | 'cctv'
  | 'none';

export interface OverstayConsequence {
  timeThresholdMinutes: number;
  consequence: string;
  severityLevel: 'warning' | 'minor' | 'moderate' | 'severe';
}

export interface AccessRule {
  timeOfDay: 'day' | 'night' | 'always';
  requirements: string[];
  modifiers: {
    attireBonus?: string;
    backgroundPenalty?: string;
    reputationThreshold?: number;
  };
}

export interface SurveillanceProfile {
  level: number; // 0-100
  types: DataCollectionType[];
  responseTime: number; // minutes for security to respond
  escapeRoutes: number; // number of viable exits
}

export interface ZoneAtmosphere {
  crowdDensity: 'empty' | 'sparse' | 'moderate' | 'busy' | 'crowded';
  noiseLevel: 'silent' | 'quiet' | 'moderate' | 'loud' | 'deafening';
  cleanliness: 'pristine' | 'clean' | 'average' | 'dirty' | 'decrepit';
  lighting: 'bright' | 'well_lit' | 'dim' | 'dark' | 'pitch_black';
  socialTone: 'welcoming' | 'neutral' | 'indifferent' | 'suspicious' | 'hostile';
}

export interface NPCReactionModifiers {
  appearance: Record<string, number>; // bodyType, attire, grooming
  background: Record<string, number>; // origin, class
  timeOfDay: Record<string, number>;
  surveillanceAwareness: number; // how cautious NPCs are
}

export interface UrbanZone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  
  // Ownership and control
  ownership: OwnershipType;
  controllingFaction?: string;
  
  // Surveillance and monitoring
  surveillance: SurveillanceProfile;
  
  // Access control
  accessLevel: AccessLevel;
  accessRules: AccessRule[];
  overstayConsequences: OverstayConsequence[];
  
  // Atmosphere
  atmosphere: ZoneAtmosphere;
  
  // NPC behavior modifiers
  npcReactions: NPCReactionModifiers;
  
  // Narrative elements
  narrativeFunctions: string[];
  possibleEvents: string[];
  
  // Connections
  connectedZones: string[];
  travelTime: Record<string, number>; // minutes to reach each connected zone
}

export interface UrbanLocation {
  id: string;
  name: string;
  zoneId: string;
  description: string;
  
  // Specific location overrides
  surveillanceOverride?: Partial<SurveillanceProfile>;
  atmosphereOverride?: Partial<ZoneAtmosphere>;
  accessOverride?: Partial<AccessRule>;
  
  // Location-specific features
  services: string[];
  hazards: string[];
  opportunities: string[];
  
  // NPCs typically found here
  typicalNPCs: string[];
  
  // Time-based descriptions
  timeDescriptions: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
    late_night: string;
  };
}

// Player zone interaction state
export interface ZoneInteractionState {
  currentZone: string;
  currentLocation: string;
  timeInZone: number; // minutes
  accessGranted: boolean;
  surveillanceAlerts: number;
  lastSecurityCheck: number;
  reputationInZone: Record<string, number>;
}

// Zone reaction result
export interface ZoneReactionResult {
  allowed: boolean;
  message: string;
  stressChange: number;
  reputationChange: Record<string, number>;
  alertTriggered: boolean;
  consequences: string[];
}
