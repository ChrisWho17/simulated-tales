// Universal Temporary State System (UTSS)
// Environment-Driven · Time-Aware · Memory-Safe · Genre-Neutral

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ModifierType = 'buff' | 'debuff';

export type ModifierCategory = 
  | 'injury' 
  | 'fatigue' 
  | 'nutrition' 
  | 'morale' 
  | 'environment' 
  | 'training' 
  | 'illness' 
  | 'chemical'
  | 'psychological'
  | 'routine'
  | 'phobia'; // Phobias only affect behavior/speech, not stats

// Modifier system limits to prevent overwhelming state
export const MODIFIER_LIMITS = {
  MAX_TOTAL_MODIFIERS: 12, // Max total active modifiers
  MAX_PER_CATEGORY: 3,     // Max per category
  MAX_BUFFS: 5,            // Max active buffs
  MAX_DEBUFFS: 8,          // Max active debuffs
  MIN_SEVERITY_THRESHOLD: 0.25, // Minimum severity to apply new modifier
};

export type StackingRule = 'exclusive' | 'additive' | 'diminishing';
export type DecayModel = 'linear' | 'staged' | 'conditional' | 'threshold' | 'reversible';
export type DurationType = 'time' | 'condition' | 'treatment' | 'behavior';
export type Visibility = 'player_only' | 'npc_visible' | 'hidden';
export type PromotionPolicy = 'expire' | 'scar' | 'trauma_flag' | 'chronic' | 'addiction';

export type InteractionType = 'amplification' | 'suppression' | 'mutation' | 'escalation' | 'cancellation';

export interface ModifierEffect {
  stat: string;
  value: number;
}

export interface ModifierDuration {
  type: DurationType;
  remaining: number; // in turns (message-based)
  total: number;
  appliedAtTurn?: number; // turn when modifier was applied
  condition?: string; // for condition-based
}

// Structured timestamp for precise tracking
export interface ModifierOccurredAt {
  deviceTime: string;   // ISO 8601 format: "2025-01-14T21:47:32-05:00"
  unix: number;         // Unix timestamp for sorting
  worldTime: string;    // In-game time: "Day 18, 21:47"
  turnId: number;       // For replay/debug
}

// Trigger event structure - separates data from narrative
export interface ModifierTriggerEvent {
  eventId: string;
  type: 'physical_injury' | 'psychological_trigger' | 'environmental' | 'combat' | 'social' | 'narrative' | 'phobia_trigger';
  source: string;       // What caused it: "overheard_conversation", "combat_damage", etc.
  phobia?: string;      // Named phobia if applicable: "arachnophobia", "claustrophobia", etc.
  details: {
    stimulus?: string;  // The specific thing that triggered it
    emotionalContext?: string[];
    perceivedThreat?: boolean;
    bodyPart?: string;
    damageType?: string;
    weapon?: string;
    action?: string;
  };
}

// Structured location for precise tracking
export interface ModifierLocation {
  locationId: string;
  name: string;
}

export interface Modifier {
  id: string;
  campaignId: string;
  entity: string;
  type: ModifierType;
  category: ModifierCategory;
  name: string;
  description: string;
  severity: number; // 0-1
  effects: ModifierEffect[];
  duration: ModifierDuration;
  stackingRule: StackingRule;
  decayModel: DecayModel;
  originEvent: string;
  
  // NEW: Structured timestamp (required for proper tracking)
  occurredAt?: ModifierOccurredAt;
  
  // NEW: Structured trigger event (separates data from narrative)
  triggerEvent?: ModifierTriggerEvent;
  
  // NEW: Structured location (required for proper tracking)
  location?: ModifierLocation;
  
  // Narrative excerpt (flavor text only)
  narrativeExcerpt?: string;
  
  // Rewind anchor ID for timeline navigation
  rewindAnchorId?: string;
  
  // LEGACY: Keep for backward compatibility
  originLocation?: string;
  originTimestamp?: string;
  originNarrative?: string;
  incidentDescription?: string;
  bodyPart?: string;
  triggerCause?: string;
  
  provenance: 'observed' | 'inferred' | 'reported';
  confidence: number;
  visibility: Visibility;
  resolutionPaths: string[];
  promotionPolicy: PromotionPolicy;
  recurrence: number;
  emotionalWeight: number;
  appliedAt: number; // tick
  stacks: number;
}

// Helper to create structured timestamp
export function createModifierOccurredAt(
  turnId: number,
  worldTime?: { day: number; hour: number }
): ModifierOccurredAt {
  const now = new Date();
  return {
    deviceTime: now.toISOString(),
    unix: now.getTime(),
    worldTime: worldTime 
      ? `Day ${worldTime.day}, ${String(worldTime.hour).padStart(2, '0')}:00`
      : 'Unknown',
    turnId,
  };
}

// Helper to create trigger event
export function createModifierTriggerEvent(
  eventId: string,
  type: ModifierTriggerEvent['type'],
  source: string,
  details: ModifierTriggerEvent['details'] = {}
): ModifierTriggerEvent {
  return { eventId, type, source, details };
}

// Validation - ensure required fields exist before creation
export function validateModifierData(occurredAt?: ModifierOccurredAt, triggerEvent?: ModifierTriggerEvent): { valid: boolean; reason?: string } {
  if (!occurredAt) {
    return { valid: false, reason: 'Missing occurredAt timestamp' };
  }
  if (!occurredAt.deviceTime || !occurredAt.unix) {
    return { valid: false, reason: 'Incomplete timestamp data' };
  }
  if (!triggerEvent) {
    return { valid: false, reason: 'Missing trigger event' };
  }
  if (!triggerEvent.type || !triggerEvent.source) {
    return { valid: false, reason: 'Incomplete trigger event data' };
  }
  return { valid: true };
}

export interface ModifierInteraction {
  categoryA: ModifierCategory;
  categoryB: ModifierCategory;
  type: InteractionType;
  multiplier: number;
  resultModifier?: string; // for mutations
  description: string;
}

export interface ModifierState {
  activeModifiers: Modifier[];
  modifierHistory: Modifier[];
  promotedModifiers: Modifier[]; // LTM
}

// ============================================================================
// MODIFIER TEMPLATES (120+ states)
// ============================================================================

export interface ModifierTemplate {
  name: string;
  type: ModifierType;
  category: ModifierCategory;
  description: string;
  baseSeverity: number;
  effects: ModifierEffect[];
  defaultDuration: Partial<ModifierDuration>;
  stackingRule: StackingRule;
  decayModel: DecayModel;
  resolutionPaths: string[];
  promotionPolicy: PromotionPolicy;
  visibility: Visibility;
}

// A) PHYSICAL INJURY STATES
export const INJURY_TEMPLATES: ModifierTemplate[] = [
  // Minor
  { name: 'Bruising', type: 'debuff', category: 'injury', description: 'Surface tissue damage causing discoloration and tenderness', baseSeverity: 0.15, effects: [{ stat: 'pain', value: 0.1 }, { stat: 'appearance', value: -0.05 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['rest', 'ice'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Muscle Strain', type: 'debuff', category: 'injury', description: 'Overstretched muscle fibers', baseSeverity: 0.2, effects: [{ stat: 'strength', value: -0.15 }, { stat: 'pain', value: 0.15 }], defaultDuration: { type: 'time', remaining: 72 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['rest', 'massage'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Shallow Cut', type: 'debuff', category: 'injury', description: 'Minor laceration of the skin', baseSeverity: 0.1, effects: [{ stat: 'pain', value: 0.05 }, { stat: 'bleedRisk', value: 0.1 }], defaultDuration: { type: 'time', remaining: 24 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['bandage', 'clean'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Minor Burn', type: 'debuff', category: 'injury', description: 'First-degree thermal damage', baseSeverity: 0.2, effects: [{ stat: 'pain', value: 0.2 }, { stat: 'dexterity', value: -0.1 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['cool_water', 'salve'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Abrasion', type: 'debuff', category: 'injury', description: 'Scraped skin surface', baseSeverity: 0.1, effects: [{ stat: 'pain', value: 0.08 }], defaultDuration: { type: 'time', remaining: 36 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['clean', 'bandage'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Nosebleed', type: 'debuff', category: 'injury', description: 'Nasal hemorrhage', baseSeverity: 0.15, effects: [{ stat: 'appearance', value: -0.1 }, { stat: 'focus', value: -0.1 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['pressure', 'rest'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  
  // Moderate
  { name: 'Sprained Ankle', type: 'debuff', category: 'injury', description: 'Stretched or torn ankle ligaments', baseSeverity: 0.4, effects: [{ stat: 'movement_speed', value: -0.4 }, { stat: 'pain', value: 0.3 }, { stat: 'agility', value: -0.3 }], defaultDuration: { type: 'time', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'ice', 'elevation', 'compression'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Sprained Wrist', type: 'debuff', category: 'injury', description: 'Stretched or torn wrist ligaments', baseSeverity: 0.35, effects: [{ stat: 'dexterity', value: -0.35 }, { stat: 'pain', value: 0.25 }, { stat: 'grip_strength', value: -0.4 }], defaultDuration: { type: 'time', remaining: 120 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['splint', 'rest', 'ice'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Hairline Fracture', type: 'debuff', category: 'injury', description: 'Micro-fracture in bone', baseSeverity: 0.5, effects: [{ stat: 'pain', value: 0.4 }, { stat: 'movement_speed', value: -0.3 }], defaultDuration: { type: 'time', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'immobilization', 'medical_treatment'], promotionPolicy: 'scar', visibility: 'hidden' },
  { name: 'Laceration', type: 'debuff', category: 'injury', description: 'Deep cut requiring treatment', baseSeverity: 0.45, effects: [{ stat: 'pain', value: 0.35 }, { stat: 'bleedRisk', value: 0.5 }, { stat: 'infection_risk', value: 0.3 }], defaultDuration: { type: 'treatment', remaining: 72 }, stackingRule: 'additive', decayModel: 'conditional', resolutionPaths: ['stitches', 'bandage', 'antibiotics'], promotionPolicy: 'scar', visibility: 'npc_visible' },
  { name: 'Deep Burn', type: 'debuff', category: 'injury', description: 'Second-degree thermal damage', baseSeverity: 0.55, effects: [{ stat: 'pain', value: 0.5 }, { stat: 'dexterity', value: -0.3 }, { stat: 'infection_risk', value: 0.4 }], defaultDuration: { type: 'treatment', remaining: 168 }, stackingRule: 'additive', decayModel: 'staged', resolutionPaths: ['medical_treatment', 'burn_cream', 'bandage'], promotionPolicy: 'scar', visibility: 'npc_visible' },
  { name: 'Mild Concussion', type: 'debuff', category: 'injury', description: 'Minor traumatic brain injury', baseSeverity: 0.45, effects: [{ stat: 'perception', value: -0.3 }, { stat: 'focus', value: -0.4 }, { stat: 'reaction_time', value: -0.25 }], defaultDuration: { type: 'time', remaining: 72 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'darkness', 'quiet'], promotionPolicy: 'expire', visibility: 'hidden' },
  { name: 'Dislocation', type: 'debuff', category: 'injury', description: 'Joint forced out of position', baseSeverity: 0.6, effects: [{ stat: 'pain', value: 0.7 }, { stat: 'limb_function', value: -0.9 }], defaultDuration: { type: 'treatment', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['reduction', 'medical_treatment'], promotionPolicy: 'scar', visibility: 'npc_visible' },
  
  // Severe
  { name: 'Broken Limb', type: 'debuff', category: 'injury', description: 'Complete bone fracture', baseSeverity: 0.75, effects: [{ stat: 'movement_speed', value: -0.6 }, { stat: 'pain', value: 0.8 }, { stat: 'stamina_regen', value: -0.5 }], defaultDuration: { type: 'time', remaining: 1008 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['splint', 'cast', 'medical_treatment', 'surgery'], promotionPolicy: 'scar', visibility: 'npc_visible' },
  { name: 'Bullet Wound', type: 'debuff', category: 'injury', description: 'Projectile penetration injury', baseSeverity: 0.8, effects: [{ stat: 'pain', value: 0.85 }, { stat: 'bleedRisk', value: 0.8 }, { stat: 'infection_risk', value: 0.6 }], defaultDuration: { type: 'treatment', remaining: 336 }, stackingRule: 'additive', decayModel: 'conditional', resolutionPaths: ['surgery', 'extraction', 'antibiotics', 'blood_transfusion'], promotionPolicy: 'scar', visibility: 'npc_visible' },
  { name: 'Shrapnel Embedded', type: 'debuff', category: 'injury', description: 'Foreign material lodged in tissue', baseSeverity: 0.7, effects: [{ stat: 'pain', value: 0.6 }, { stat: 'infection_risk', value: 0.7 }, { stat: 'movement_speed', value: -0.3 }], defaultDuration: { type: 'treatment', remaining: 240 }, stackingRule: 'additive', decayModel: 'conditional', resolutionPaths: ['surgery', 'extraction'], promotionPolicy: 'scar', visibility: 'hidden' },
  { name: 'Internal Bleeding', type: 'debuff', category: 'injury', description: 'Hemorrhage within body cavity', baseSeverity: 0.85, effects: [{ stat: 'stamina', value: -0.5 }, { stat: 'consciousness', value: -0.4 }, { stat: 'health_decay', value: 0.1 }], defaultDuration: { type: 'treatment', remaining: 12 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['emergency_surgery'], promotionPolicy: 'trauma_flag', visibility: 'hidden' },
  { name: 'Crushed Limb', type: 'debuff', category: 'injury', description: 'Severe compression trauma', baseSeverity: 0.9, effects: [{ stat: 'pain', value: 0.95 }, { stat: 'limb_function', value: -1.0 }, { stat: 'shock_risk', value: 0.8 }], defaultDuration: { type: 'treatment', remaining: 2016 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['surgery', 'amputation', 'rehabilitation'], promotionPolicy: 'chronic', visibility: 'npc_visible' },
  { name: 'Severe Concussion', type: 'debuff', category: 'injury', description: 'Significant traumatic brain injury', baseSeverity: 0.75, effects: [{ stat: 'perception', value: -0.6 }, { stat: 'focus', value: -0.7 }, { stat: 'memory', value: -0.4 }, { stat: 'consciousness', value: -0.3 }], defaultDuration: { type: 'time', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'medical_monitoring', 'medication'], promotionPolicy: 'trauma_flag', visibility: 'hidden' },
  { name: 'Organ Damage', type: 'debuff', category: 'injury', description: 'Internal organ trauma', baseSeverity: 0.9, effects: [{ stat: 'health_decay', value: 0.15 }, { stat: 'stamina', value: -0.6 }, { stat: 'pain', value: 0.7 }], defaultDuration: { type: 'treatment', remaining: 720 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['surgery', 'intensive_care'], promotionPolicy: 'chronic', visibility: 'hidden' },
  
  // Critical / Hidden
  { name: 'Infection', type: 'debuff', category: 'injury', description: 'Bacterial invasion of wound', baseSeverity: 0.5, effects: [{ stat: 'fever', value: 0.4 }, { stat: 'stamina', value: -0.3 }, { stat: 'healing_rate', value: -0.5 }], defaultDuration: { type: 'treatment', remaining: 120 }, stackingRule: 'additive', decayModel: 'threshold', resolutionPaths: ['antibiotics', 'wound_care', 'drainage'], promotionPolicy: 'expire', visibility: 'hidden' },
  { name: 'Sepsis Risk', type: 'debuff', category: 'injury', description: 'Systemic infection spreading', baseSeverity: 0.85, effects: [{ stat: 'fever', value: 0.8 }, { stat: 'consciousness', value: -0.4 }, { stat: 'health_decay', value: 0.2 }], defaultDuration: { type: 'treatment', remaining: 24 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['emergency_antibiotics', 'intensive_care'], promotionPolicy: 'trauma_flag', visibility: 'hidden' },
  { name: 'Nerve Damage', type: 'debuff', category: 'injury', description: 'Peripheral nerve injury', baseSeverity: 0.65, effects: [{ stat: 'sensation', value: -0.6 }, { stat: 'dexterity', value: -0.4 }], defaultDuration: { type: 'time', remaining: 4320 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['surgery', 'physical_therapy', 'time'], promotionPolicy: 'chronic', visibility: 'hidden' },
  { name: 'Shock', type: 'debuff', category: 'injury', description: 'Circulatory system failure', baseSeverity: 0.9, effects: [{ stat: 'consciousness', value: -0.7 }, { stat: 'reaction_time', value: -0.8 }, { stat: 'health_decay', value: 0.25 }], defaultDuration: { type: 'treatment', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['fluids', 'warmth', 'elevation', 'emergency_care'], promotionPolicy: 'trauma_flag', visibility: 'npc_visible' },
];

// B) FATIGUE & EXERTION STATES
export const FATIGUE_TEMPLATES: ModifierTemplate[] = [
  // Debuffs
  { name: 'Winded', type: 'debuff', category: 'fatigue', description: 'Short of breath from exertion', baseSeverity: 0.2, effects: [{ stat: 'stamina_regen', value: -0.3 }, { stat: 'speech', value: -0.1 }], defaultDuration: { type: 'time', remaining: 0.5 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: ['rest'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Fatigued', type: 'debuff', category: 'fatigue', description: 'General tiredness from activity', baseSeverity: 0.3, effects: [{ stat: 'stamina', value: -0.2 }, { stat: 'focus', value: -0.15 }, { stat: 'reaction_time', value: -0.1 }], defaultDuration: { type: 'time', remaining: 8 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['rest', 'sleep'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Exhausted', type: 'debuff', category: 'fatigue', description: 'Severe physical depletion', baseSeverity: 0.6, effects: [{ stat: 'stamina', value: -0.5 }, { stat: 'strength', value: -0.3 }, { stat: 'focus', value: -0.4 }, { stat: 'willpower', value: -0.2 }], defaultDuration: { type: 'time', remaining: 16 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['sleep', 'long_rest'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Overexerted', type: 'debuff', category: 'fatigue', description: 'Pushed beyond safe limits', baseSeverity: 0.5, effects: [{ stat: 'injury_risk', value: 0.3 }, { stat: 'stamina_regen', value: -0.6 }, { stat: 'recovery_rate', value: -0.4 }], defaultDuration: { type: 'time', remaining: 24 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['complete_rest'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Sleep Deprived', type: 'debuff', category: 'fatigue', description: 'Insufficient sleep accumulation', baseSeverity: 0.4, effects: [{ stat: 'focus', value: -0.35 }, { stat: 'perception', value: -0.25 }, { stat: 'mood', value: -0.3 }, { stat: 'reaction_time', value: -0.2 }], defaultDuration: { type: 'condition', remaining: 8 }, stackingRule: 'additive', decayModel: 'reversible', resolutionPaths: ['sleep'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Muscle Failure', type: 'debuff', category: 'fatigue', description: 'Muscles unable to continue', baseSeverity: 0.7, effects: [{ stat: 'strength', value: -0.7 }, { stat: 'movement_speed', value: -0.5 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'nutrition'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  
  // Buffs
  { name: 'Second Wind', type: 'buff', category: 'fatigue', description: 'Renewed energy surge', baseSeverity: 0.4, effects: [{ stat: 'stamina', value: 0.3 }, { stat: 'pain_resistance', value: 0.2 }], defaultDuration: { type: 'time', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Well Rested', type: 'buff', category: 'fatigue', description: 'Fully recovered from sleep', baseSeverity: 0.3, effects: [{ stat: 'stamina_regen', value: 0.25 }, { stat: 'focus', value: 0.15 }, { stat: 'healing_rate', value: 0.2 }], defaultDuration: { type: 'time', remaining: 12 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Heightened Alertness', type: 'buff', category: 'fatigue', description: 'Sharp and aware', baseSeverity: 0.25, effects: [{ stat: 'perception', value: 0.2 }, { stat: 'reaction_time', value: 0.15 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Momentum', type: 'buff', category: 'fatigue', description: 'In the zone, performing well', baseSeverity: 0.35, effects: [{ stat: 'all_actions', value: 0.1 }, { stat: 'confidence', value: 0.2 }], defaultDuration: { type: 'behavior', remaining: 2 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
];

// C) NUTRITION & HYDRATION
export const NUTRITION_TEMPLATES: ModifierTemplate[] = [
  // Buffs
  { name: 'Well Fed', type: 'buff', category: 'nutrition', description: 'Properly nourished', baseSeverity: 0.2, effects: [{ stat: 'stamina_regen', value: 0.15 }, { stat: 'healing_rate', value: 0.1 }, { stat: 'mood', value: 0.1 }], defaultDuration: { type: 'time', remaining: 8 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Hydrated', type: 'buff', category: 'nutrition', description: 'Optimal fluid levels', baseSeverity: 0.15, effects: [{ stat: 'stamina', value: 0.1 }, { stat: 'focus', value: 0.1 }, { stat: 'temperature_regulation', value: 0.15 }], defaultDuration: { type: 'time', remaining: 6 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Balanced Nutrition', type: 'buff', category: 'nutrition', description: 'Well-rounded diet benefits', baseSeverity: 0.25, effects: [{ stat: 'immune_system', value: 0.2 }, { stat: 'recovery_rate', value: 0.15 }], defaultDuration: { type: 'time', remaining: 24 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'High Protein Intake', type: 'buff', category: 'nutrition', description: 'Muscle-building nutrition', baseSeverity: 0.2, effects: [{ stat: 'strength_training', value: 0.2 }, { stat: 'muscle_recovery', value: 0.25 }], defaultDuration: { type: 'time', remaining: 12 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Electrolyte Balanced', type: 'buff', category: 'nutrition', description: 'Optimal mineral balance', baseSeverity: 0.15, effects: [{ stat: 'cramp_resistance', value: 0.3 }, { stat: 'endurance', value: 0.1 }], defaultDuration: { type: 'time', remaining: 8 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  
  // Debuffs
  { name: 'Hungry', type: 'debuff', category: 'nutrition', description: 'Needs food', baseSeverity: 0.2, effects: [{ stat: 'focus', value: -0.1 }, { stat: 'mood', value: -0.15 }, { stat: 'stamina_regen', value: -0.1 }], defaultDuration: { type: 'condition', remaining: 6 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['eat'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Dehydrated', type: 'debuff', category: 'nutrition', description: 'Insufficient fluid intake', baseSeverity: 0.35, effects: [{ stat: 'stamina', value: -0.25 }, { stat: 'focus', value: -0.2 }, { stat: 'headache', value: 0.3 }], defaultDuration: { type: 'condition', remaining: 8 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['drink'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Malnourished', type: 'debuff', category: 'nutrition', description: 'Prolonged poor nutrition', baseSeverity: 0.5, effects: [{ stat: 'strength', value: -0.2 }, { stat: 'immune_system', value: -0.3 }, { stat: 'healing_rate', value: -0.25 }], defaultDuration: { type: 'condition', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['balanced_diet'], promotionPolicy: 'chronic', visibility: 'npc_visible' },
  { name: 'Starving', type: 'debuff', category: 'nutrition', description: 'Critical lack of food', baseSeverity: 0.8, effects: [{ stat: 'strength', value: -0.5 }, { stat: 'stamina', value: -0.6 }, { stat: 'focus', value: -0.4 }, { stat: 'health_decay', value: 0.05 }], defaultDuration: { type: 'condition', remaining: 48 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['eat'], promotionPolicy: 'trauma_flag', visibility: 'npc_visible' },
  { name: 'Vitamin Deficiency', type: 'debuff', category: 'nutrition', description: 'Lacking essential vitamins', baseSeverity: 0.3, effects: [{ stat: 'immune_system', value: -0.2 }, { stat: 'energy', value: -0.15 }], defaultDuration: { type: 'condition', remaining: 336 }, stackingRule: 'additive', decayModel: 'reversible', resolutionPaths: ['supplements', 'varied_diet'], promotionPolicy: 'expire', visibility: 'hidden' },
];

// D) TRAINING & CONDITIONING
export const TRAINING_TEMPLATES: ModifierTemplate[] = [
  // Buffs
  { name: 'Muscle Activation', type: 'buff', category: 'training', description: 'Warmed up and ready', baseSeverity: 0.2, effects: [{ stat: 'strength', value: 0.1 }, { stat: 'injury_resistance', value: 0.15 }], defaultDuration: { type: 'time', remaining: 2 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Endurance Conditioning', type: 'buff', category: 'training', description: 'Improved cardiovascular fitness', baseSeverity: 0.25, effects: [{ stat: 'stamina', value: 0.15 }, { stat: 'stamina_regen', value: 0.2 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Improved Coordination', type: 'buff', category: 'training', description: 'Better muscle memory', baseSeverity: 0.2, effects: [{ stat: 'dexterity', value: 0.1 }, { stat: 'accuracy', value: 0.1 }], defaultDuration: { type: 'time', remaining: 24 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Reflex Conditioning', type: 'buff', category: 'training', description: 'Faster reactions', baseSeverity: 0.2, effects: [{ stat: 'reaction_time', value: 0.15 }, { stat: 'dodge_chance', value: 0.1 }], defaultDuration: { type: 'time', remaining: 24 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Cardiovascular Boost', type: 'buff', category: 'training', description: 'Heart pumping efficiently', baseSeverity: 0.15, effects: [{ stat: 'oxygen_efficiency', value: 0.2 }, { stat: 'endurance', value: 0.1 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  
  // Debuffs
  { name: 'Muscle Soreness', type: 'debuff', category: 'training', description: 'Post-exercise ache', baseSeverity: 0.25, effects: [{ stat: 'strength', value: -0.1 }, { stat: 'comfort', value: -0.2 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['rest', 'stretching', 'massage'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Joint Inflammation', type: 'debuff', category: 'training', description: 'Overused joints', baseSeverity: 0.35, effects: [{ stat: 'movement_speed', value: -0.15 }, { stat: 'pain', value: 0.2 }], defaultDuration: { type: 'time', remaining: 72 }, stackingRule: 'additive', decayModel: 'staged', resolutionPaths: ['rest', 'anti_inflammatory', 'ice'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Overtraining Syndrome', type: 'debuff', category: 'training', description: 'Pushed too hard too long', baseSeverity: 0.5, effects: [{ stat: 'all_physical', value: -0.2 }, { stat: 'mood', value: -0.3 }, { stat: 'immune_system', value: -0.25 }], defaultDuration: { type: 'time', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['complete_rest', 'deload'], promotionPolicy: 'expire', visibility: 'hidden' },
  { name: 'Microtears', type: 'debuff', category: 'training', description: 'Muscle fiber damage', baseSeverity: 0.2, effects: [{ stat: 'strength', value: -0.05 }, { stat: 'recovery_needed', value: 0.15 }], defaultDuration: { type: 'time', remaining: 72 }, stackingRule: 'additive', decayModel: 'staged', resolutionPaths: ['rest', 'protein'], promotionPolicy: 'expire', visibility: 'hidden' },
];

// E) ILLNESS & BIOLOGICAL
export const ILLNESS_TEMPLATES: ModifierTemplate[] = [
  { name: 'Fever', type: 'debuff', category: 'illness', description: 'Elevated body temperature', baseSeverity: 0.4, effects: [{ stat: 'focus', value: -0.25 }, { stat: 'stamina', value: -0.3 }, { stat: 'perception', value: -0.15 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'medication', 'fluids'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Common Cold', type: 'debuff', category: 'illness', description: 'Upper respiratory infection', baseSeverity: 0.3, effects: [{ stat: 'stamina', value: -0.15 }, { stat: 'speech', value: -0.1 }, { stat: 'social', value: -0.1 }], defaultDuration: { type: 'time', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'fluids', 'medication'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Flu', type: 'debuff', category: 'illness', description: 'Influenza infection', baseSeverity: 0.55, effects: [{ stat: 'all_physical', value: -0.35 }, { stat: 'fever', value: 0.5 }, { stat: 'pain', value: 0.3 }], defaultDuration: { type: 'time', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'fluids', 'medication'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Food Poisoning', type: 'debuff', category: 'illness', description: 'Gastrointestinal distress', baseSeverity: 0.5, effects: [{ stat: 'stamina', value: -0.4 }, { stat: 'nutrition_absorption', value: -0.8 }, { stat: 'comfort', value: -0.6 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['rest', 'fluids', 'time'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Parasites', type: 'debuff', category: 'illness', description: 'Internal parasitic infection', baseSeverity: 0.45, effects: [{ stat: 'nutrition_absorption', value: -0.4 }, { stat: 'stamina', value: -0.25 }, { stat: 'weight', value: -0.1 }], defaultDuration: { type: 'treatment', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['antiparasitic', 'medical_treatment'], promotionPolicy: 'expire', visibility: 'hidden' },
  { name: 'Radiation Sickness', type: 'debuff', category: 'illness', description: 'Ionizing radiation exposure', baseSeverity: 0.75, effects: [{ stat: 'all_stats', value: -0.4 }, { stat: 'health_decay', value: 0.1 }, { stat: 'nausea', value: 0.6 }], defaultDuration: { type: 'time', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['medical_treatment', 'radiation_therapy'], promotionPolicy: 'chronic', visibility: 'hidden' },
  { name: 'Incubation Phase', type: 'debuff', category: 'illness', description: 'Disease developing silently', baseSeverity: 0.1, effects: [{ stat: 'hidden_illness', value: 1.0 }], defaultDuration: { type: 'time', remaining: 72 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'hidden' },
  { name: 'Asymptomatic Carrier', type: 'debuff', category: 'illness', description: 'Carrying disease without symptoms', baseSeverity: 0.05, effects: [{ stat: 'contagious', value: 0.5 }], defaultDuration: { type: 'time', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: ['time', 'treatment'], promotionPolicy: 'expire', visibility: 'hidden' },
];

// F) PSYCHOLOGICAL STATES
export const PSYCHOLOGICAL_TEMPLATES: ModifierTemplate[] = [
  // Debuffs
  { name: 'Psychological Shock', type: 'debuff', category: 'psychological', description: 'Overwhelmed by trauma', baseSeverity: 0.7, effects: [{ stat: 'reaction_time', value: -0.5 }, { stat: 'decision_making', value: -0.6 }, { stat: 'awareness', value: -0.4 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['comfort', 'safety', 'time'], promotionPolicy: 'trauma_flag', visibility: 'npc_visible' },
  { name: 'Panic', type: 'debuff', category: 'psychological', description: 'Overwhelming fear response', baseSeverity: 0.65, effects: [{ stat: 'decision_making', value: -0.5 }, { stat: 'accuracy', value: -0.4 }, { stat: 'flee_impulse', value: 0.7 }], defaultDuration: { type: 'time', remaining: 0.5 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['safety', 'breathing', 'grounding'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Fear Triggered', type: 'debuff', category: 'psychological', description: 'Phobia or trauma activated', baseSeverity: 0.5, effects: [{ stat: 'willpower', value: -0.4 }, { stat: 'focus', value: -0.3 }, { stat: 'stress', value: 0.5 }], defaultDuration: { type: 'condition', remaining: 2 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['remove_trigger', 'coping', 'time'], promotionPolicy: 'trauma_flag', visibility: 'npc_visible' },
  { name: 'Guilt', type: 'debuff', category: 'psychological', description: 'Burdened by past action', baseSeverity: 0.35, effects: [{ stat: 'mood', value: -0.3 }, { stat: 'self_worth', value: -0.25 }, { stat: 'sleep_quality', value: -0.2 }], defaultDuration: { type: 'condition', remaining: 168 }, stackingRule: 'additive', decayModel: 'conditional', resolutionPaths: ['atonement', 'forgiveness', 'therapy'], promotionPolicy: 'trauma_flag', visibility: 'player_only' },
  { name: 'Stress Overload', type: 'debuff', category: 'psychological', description: 'Beyond coping capacity', baseSeverity: 0.55, effects: [{ stat: 'focus', value: -0.35 }, { stat: 'patience', value: -0.4 }, { stat: 'immune_system', value: -0.2 }], defaultDuration: { type: 'condition', remaining: 72 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['rest', 'relaxation', 'remove_stressors'], promotionPolicy: 'chronic', visibility: 'player_only' },
  { name: 'PTSD Response', type: 'debuff', category: 'psychological', description: 'Flashback or intrusive memory', baseSeverity: 0.6, effects: [{ stat: 'focus', value: -0.5 }, { stat: 'awareness', value: -0.4 }, { stat: 'stress', value: 0.6 }], defaultDuration: { type: 'time', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['grounding', 'safety', 'coping'], promotionPolicy: 'trauma_flag', visibility: 'player_only' },
  { name: 'Cognitive Fog', type: 'debuff', category: 'psychological', description: 'Mental cloudiness', baseSeverity: 0.35, effects: [{ stat: 'focus', value: -0.3 }, { stat: 'memory', value: -0.25 }, { stat: 'decision_making', value: -0.2 }], defaultDuration: { type: 'time', remaining: 12 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: ['rest', 'sleep', 'nutrition'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Dissociation', type: 'debuff', category: 'psychological', description: 'Detachment from reality', baseSeverity: 0.5, effects: [{ stat: 'awareness', value: -0.5 }, { stat: 'reaction_time', value: -0.3 }, { stat: 'pain_perception', value: -0.4 }], defaultDuration: { type: 'time', remaining: 2 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['grounding', 'safety'], promotionPolicy: 'trauma_flag', visibility: 'hidden' },
  
  // Buffs
  { name: 'Calm', type: 'buff', category: 'psychological', description: 'Peaceful state of mind', baseSeverity: 0.25, effects: [{ stat: 'stress_resistance', value: 0.3 }, { stat: 'decision_making', value: 0.15 }, { stat: 'patience', value: 0.2 }], defaultDuration: { type: 'time', remaining: 8 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Focused', type: 'buff', category: 'psychological', description: 'Sharp mental clarity', baseSeverity: 0.3, effects: [{ stat: 'focus', value: 0.3 }, { stat: 'accuracy', value: 0.15 }, { stat: 'perception', value: 0.1 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Determined', type: 'buff', category: 'psychological', description: 'Unwavering resolve', baseSeverity: 0.35, effects: [{ stat: 'willpower', value: 0.3 }, { stat: 'pain_resistance', value: 0.2 }, { stat: 'persistence', value: 0.25 }], defaultDuration: { type: 'behavior', remaining: 12 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Inspired', type: 'buff', category: 'psychological', description: 'Creatively energized', baseSeverity: 0.3, effects: [{ stat: 'creativity', value: 0.35 }, { stat: 'problem_solving', value: 0.2 }, { stat: 'mood', value: 0.2 }], defaultDuration: { type: 'time', remaining: 6 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Emotional Grounding', type: 'buff', category: 'psychological', description: 'Stable emotional state', baseSeverity: 0.2, effects: [{ stat: 'stress_resistance', value: 0.25 }, { stat: 'emotional_stability', value: 0.3 }], defaultDuration: { type: 'time', remaining: 12 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
];

// G) ENVIRONMENTAL STATES
export const ENVIRONMENT_TEMPLATES: ModifierTemplate[] = [
  // Cold
  { name: 'Chilled', type: 'debuff', category: 'environment', description: 'Uncomfortably cold', baseSeverity: 0.2, effects: [{ stat: 'dexterity', value: -0.1 }, { stat: 'comfort', value: -0.2 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['warmth', 'shelter', 'clothing'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Hypothermia Risk', type: 'debuff', category: 'environment', description: 'Dangerously cold', baseSeverity: 0.6, effects: [{ stat: 'dexterity', value: -0.4 }, { stat: 'focus', value: -0.3 }, { stat: 'stamina', value: -0.3 }], defaultDuration: { type: 'condition', remaining: 2 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['warmth', 'shelter', 'fire'], promotionPolicy: 'trauma_flag', visibility: 'npc_visible' },
  { name: 'Frostbite', type: 'debuff', category: 'environment', description: 'Tissue freezing damage', baseSeverity: 0.7, effects: [{ stat: 'pain', value: 0.5 }, { stat: 'dexterity', value: -0.6 }, { stat: 'tissue_damage', value: 0.4 }], defaultDuration: { type: 'treatment', remaining: 168 }, stackingRule: 'additive', decayModel: 'staged', resolutionPaths: ['medical_treatment', 'gradual_warming'], promotionPolicy: 'chronic', visibility: 'npc_visible' },
  
  // Heat
  { name: 'Heat Stress', type: 'debuff', category: 'environment', description: 'Uncomfortably hot', baseSeverity: 0.25, effects: [{ stat: 'stamina', value: -0.15 }, { stat: 'focus', value: -0.1 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['shade', 'water', 'rest'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Heat Exhaustion', type: 'debuff', category: 'environment', description: 'Body overheating', baseSeverity: 0.5, effects: [{ stat: 'stamina', value: -0.4 }, { stat: 'focus', value: -0.3 }, { stat: 'nausea', value: 0.3 }], defaultDuration: { type: 'condition', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['shade', 'water', 'rest', 'cooling'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Heat Stroke Risk', type: 'debuff', category: 'environment', description: 'Critical overheating', baseSeverity: 0.8, effects: [{ stat: 'consciousness', value: -0.5 }, { stat: 'all_stats', value: -0.3 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['emergency_cooling', 'medical_treatment'], promotionPolicy: 'trauma_flag', visibility: 'npc_visible' },
  
  // Atmosphere
  { name: 'Low Oxygen', type: 'debuff', category: 'environment', description: 'Thin air', baseSeverity: 0.4, effects: [{ stat: 'stamina', value: -0.3 }, { stat: 'focus', value: -0.2 }, { stat: 'exertion_cost', value: 0.3 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['lower_altitude', 'oxygen', 'acclimatization'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Toxic Air', type: 'debuff', category: 'environment', description: 'Harmful atmosphere', baseSeverity: 0.6, effects: [{ stat: 'health_decay', value: 0.1 }, { stat: 'breathing', value: -0.4 }], defaultDuration: { type: 'condition', remaining: 0.5 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['mask', 'leave_area'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Smoke Inhalation', type: 'debuff', category: 'environment', description: 'Lungs irritated by smoke', baseSeverity: 0.45, effects: [{ stat: 'stamina', value: -0.3 }, { stat: 'breathing', value: -0.35 }, { stat: 'perception', value: -0.2 }], defaultDuration: { type: 'time', remaining: 12 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['fresh_air', 'rest'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  
  // Weather
  { name: 'Rain-Soaked', type: 'debuff', category: 'environment', description: 'Wet and uncomfortable', baseSeverity: 0.2, effects: [{ stat: 'comfort', value: -0.25 }, { stat: 'grip', value: -0.15 }, { stat: 'cold_vulnerability', value: 0.2 }], defaultDuration: { type: 'condition', remaining: 2 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['dry_off', 'shelter', 'change_clothes'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'High Wind', type: 'debuff', category: 'environment', description: 'Strong winds affecting movement', baseSeverity: 0.25, effects: [{ stat: 'ranged_accuracy', value: -0.3 }, { stat: 'hearing', value: -0.2 }, { stat: 'balance', value: -0.15 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['shelter'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Poor Visibility', type: 'debuff', category: 'environment', description: 'Limited sight range', baseSeverity: 0.35, effects: [{ stat: 'perception', value: -0.4 }, { stat: 'ranged_accuracy', value: -0.35 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['wait', 'light_source'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Slippery Terrain', type: 'debuff', category: 'environment', description: 'Unstable footing', baseSeverity: 0.3, effects: [{ stat: 'balance', value: -0.3 }, { stat: 'movement_speed', value: -0.2 }, { stat: 'fall_risk', value: 0.25 }], defaultDuration: { type: 'condition', remaining: 1 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['careful_movement', 'proper_footwear'], promotionPolicy: 'expire', visibility: 'npc_visible' },
];

// H) CHEMICAL / MEDICAL / SUBSTANCE
export const CHEMICAL_TEMPLATES: ModifierTemplate[] = [
  // Buffs (dangerous)
  { name: 'Pain Suppression', type: 'buff', category: 'chemical', description: 'Reduced pain perception', baseSeverity: 0.4, effects: [{ stat: 'pain', value: -0.6 }, { stat: 'injury_awareness', value: -0.4 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'diminishing', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'addiction', visibility: 'player_only' },
  { name: 'Stimulant Effect', type: 'buff', category: 'chemical', description: 'Heightened alertness and energy', baseSeverity: 0.45, effects: [{ stat: 'focus', value: 0.3 }, { stat: 'reaction_time', value: 0.25 }, { stat: 'stamina', value: 0.2 }], defaultDuration: { type: 'time', remaining: 6 }, stackingRule: 'diminishing', decayModel: 'staged', resolutionPaths: [], promotionPolicy: 'addiction', visibility: 'player_only' },
  { name: 'Antibiotic Treatment', type: 'buff', category: 'chemical', description: 'Fighting bacterial infection', baseSeverity: 0.5, effects: [{ stat: 'infection_resistance', value: 0.6 }, { stat: 'healing_rate', value: 0.2 }], defaultDuration: { type: 'time', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Anti-Inflammatory', type: 'buff', category: 'chemical', description: 'Reduced swelling and pain', baseSeverity: 0.3, effects: [{ stat: 'pain', value: -0.25 }, { stat: 'swelling', value: -0.4 }], defaultDuration: { type: 'time', remaining: 8 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  
  // Debuffs
  { name: 'Addiction Risk', type: 'debuff', category: 'chemical', description: 'Developing dependency', baseSeverity: 0.3, effects: [{ stat: 'craving', value: 0.3 }, { stat: 'willpower', value: -0.1 }], defaultDuration: { type: 'behavior', remaining: 168 }, stackingRule: 'additive', decayModel: 'conditional', resolutionPaths: ['abstinence', 'therapy'], promotionPolicy: 'addiction', visibility: 'hidden' },
  { name: 'Withdrawal', type: 'debuff', category: 'chemical', description: 'Body craving substance', baseSeverity: 0.55, effects: [{ stat: 'all_stats', value: -0.2 }, { stat: 'mood', value: -0.5 }, { stat: 'pain', value: 0.4 }, { stat: 'craving', value: 0.8 }], defaultDuration: { type: 'time', remaining: 72 }, stackingRule: 'exclusive', decayModel: 'staged', resolutionPaths: ['substance', 'medical_detox', 'time'], promotionPolicy: 'addiction', visibility: 'npc_visible' },
  { name: 'Overdose Risk', type: 'debuff', category: 'chemical', description: 'Dangerous substance levels', baseSeverity: 0.8, effects: [{ stat: 'consciousness', value: -0.5 }, { stat: 'health_decay', value: 0.15 }], defaultDuration: { type: 'time', remaining: 6 }, stackingRule: 'exclusive', decayModel: 'threshold', resolutionPaths: ['emergency_treatment'], promotionPolicy: 'trauma_flag', visibility: 'hidden' },
  { name: 'Cognitive Impairment', type: 'debuff', category: 'chemical', description: 'Substance affecting thinking', baseSeverity: 0.4, effects: [{ stat: 'focus', value: -0.35 }, { stat: 'decision_making', value: -0.3 }, { stat: 'reaction_time', value: -0.25 }], defaultDuration: { type: 'time', remaining: 8 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: ['time', 'rest'], promotionPolicy: 'expire', visibility: 'npc_visible' },
  { name: 'Organ Stress', type: 'debuff', category: 'chemical', description: 'Organs working overtime', baseSeverity: 0.45, effects: [{ stat: 'stamina', value: -0.2 }, { stat: 'toxin_buildup', value: 0.3 }], defaultDuration: { type: 'time', remaining: 48 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['rest', 'hydration', 'abstinence'], promotionPolicy: 'chronic', visibility: 'hidden' },
  { name: 'Intoxicated', type: 'debuff', category: 'chemical', description: 'Impaired by alcohol or substances', baseSeverity: 0.5, effects: [{ stat: 'coordination', value: -0.4 }, { stat: 'judgment', value: -0.5 }, { stat: 'reaction_time', value: -0.3 }, { stat: 'inhibition', value: -0.4 }], defaultDuration: { type: 'time', remaining: 6 }, stackingRule: 'additive', decayModel: 'linear', resolutionPaths: ['time', 'rest', 'food'], promotionPolicy: 'addiction', visibility: 'npc_visible' },
  { name: 'Nausea', type: 'debuff', category: 'illness', description: 'Feeling sick to stomach', baseSeverity: 0.35, effects: [{ stat: 'focus', value: -0.2 }, { stat: 'comfort', value: -0.4 }, { stat: 'appetite', value: -0.6 }], defaultDuration: { type: 'time', remaining: 4 }, stackingRule: 'exclusive', decayModel: 'linear', resolutionPaths: ['rest', 'fresh_air', 'medication'], promotionPolicy: 'expire', visibility: 'player_only' },
  // Mutation result templates (used by interaction matrix)
  { name: 'Burnout', type: 'debuff', category: 'psychological', description: 'Complete mental and physical exhaustion', baseSeverity: 0.65, effects: [{ stat: 'all_stats', value: -0.3 }, { stat: 'motivation', value: -0.6 }, { stat: 'recovery_rate', value: -0.4 }], defaultDuration: { type: 'condition', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['extended_rest', 'lifestyle_change', 'therapy'], promotionPolicy: 'chronic', visibility: 'npc_visible' },
  { name: 'Complicated Wound', type: 'debuff', category: 'injury', description: 'Wound with secondary infection', baseSeverity: 0.7, effects: [{ stat: 'pain', value: 0.5 }, { stat: 'healing_rate', value: -0.6 }, { stat: 'fever', value: 0.3 }], defaultDuration: { type: 'treatment', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['antibiotics', 'surgery', 'wound_care'], promotionPolicy: 'scar', visibility: 'npc_visible' },
  { name: 'Dependency', type: 'debuff', category: 'chemical', description: 'Physical and psychological need for substance', baseSeverity: 0.6, effects: [{ stat: 'willpower', value: -0.4 }, { stat: 'craving', value: 0.7 }, { stat: 'mood_stability', value: -0.5 }], defaultDuration: { type: 'condition', remaining: 720 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['detox', 'therapy', 'rehabilitation'], promotionPolicy: 'addiction', visibility: 'hidden' },
  { name: 'PTSD Flag', type: 'debuff', category: 'psychological', description: 'Lasting psychological mark from trauma', baseSeverity: 0.5, effects: [{ stat: 'stress_vulnerability', value: 0.4 }, { stat: 'sleep_quality', value: -0.3 }, { stat: 'flashback_risk', value: 0.5 }], defaultDuration: { type: 'condition', remaining: 2160 }, stackingRule: 'additive', decayModel: 'conditional', resolutionPaths: ['therapy', 'time', 'support'], promotionPolicy: 'trauma_flag', visibility: 'hidden' },
];

// I) ROUTINE / LIFESTYLE
export const ROUTINE_TEMPLATES: ModifierTemplate[] = [
  // Buffs
  { name: 'Structured Routine', type: 'buff', category: 'routine', description: 'Consistent daily habits', baseSeverity: 0.2, effects: [{ stat: 'stress_resistance', value: 0.15 }, { stat: 'productivity', value: 0.1 }], defaultDuration: { type: 'behavior', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Regular Exercise', type: 'buff', category: 'routine', description: 'Consistent physical activity', baseSeverity: 0.25, effects: [{ stat: 'stamina', value: 0.15 }, { stat: 'mood', value: 0.1 }, { stat: 'sleep_quality', value: 0.15 }], defaultDuration: { type: 'behavior', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Consistent Sleep', type: 'buff', category: 'routine', description: 'Regular sleep schedule', baseSeverity: 0.2, effects: [{ stat: 'recovery_rate', value: 0.2 }, { stat: 'focus', value: 0.1 }], defaultDuration: { type: 'behavior', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Mental Stability', type: 'buff', category: 'routine', description: 'Emotionally balanced lifestyle', baseSeverity: 0.2, effects: [{ stat: 'stress_resistance', value: 0.2 }, { stat: 'emotional_stability', value: 0.25 }], defaultDuration: { type: 'behavior', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: [], promotionPolicy: 'expire', visibility: 'player_only' },
  
  // Debuffs
  { name: 'Irregular Sleep', type: 'debuff', category: 'routine', description: 'Disrupted sleep patterns', baseSeverity: 0.3, effects: [{ stat: 'recovery_rate', value: -0.2 }, { stat: 'mood', value: -0.15 }, { stat: 'focus', value: -0.15 }], defaultDuration: { type: 'behavior', remaining: 168 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['sleep_schedule'], promotionPolicy: 'chronic', visibility: 'player_only' },
  { name: 'Sedentary', type: 'debuff', category: 'routine', description: 'Lack of physical activity', baseSeverity: 0.25, effects: [{ stat: 'stamina', value: -0.15 }, { stat: 'flexibility', value: -0.1 }], defaultDuration: { type: 'behavior', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['exercise'], promotionPolicy: 'chronic', visibility: 'player_only' },
  { name: 'Chronic Stress', type: 'debuff', category: 'routine', description: 'Prolonged high stress', baseSeverity: 0.45, effects: [{ stat: 'immune_system', value: -0.25 }, { stat: 'sleep_quality', value: -0.3 }, { stat: 'mood', value: -0.25 }], defaultDuration: { type: 'condition', remaining: 336 }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['lifestyle_change', 'therapy', 'remove_stressors'], promotionPolicy: 'chronic', visibility: 'player_only' },
  { name: 'Poor Hygiene', type: 'debuff', category: 'routine', description: 'Neglected personal care', baseSeverity: 0.3, effects: [{ stat: 'social', value: -0.3 }, { stat: 'infection_risk', value: 0.2 }, { stat: 'self_worth', value: -0.15 }], defaultDuration: { type: 'condition', remaining: 72 }, stackingRule: 'exclusive', decayModel: 'reversible', resolutionPaths: ['hygiene_routine'], promotionPolicy: 'expire', visibility: 'npc_visible' },
];

// J) PHOBIAS - Behavioral only, do NOT affect stats
// These modifiers only influence character speech, reactions, and roleplay
export const PHOBIA_TEMPLATES: ModifierTemplate[] = [
  { name: 'Fear of Heights', type: 'debuff', category: 'phobia', description: 'Intense fear of high places', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'exposure_therapy'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Darkness', type: 'debuff', category: 'phobia', description: 'Intense fear of dark places', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'light_source'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Water', type: 'debuff', category: 'phobia', description: 'Intense fear of bodies of water', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'swimming_lessons'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Crowds', type: 'debuff', category: 'phobia', description: 'Intense discomfort in crowded spaces', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'avoidance'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Enclosed Spaces', type: 'debuff', category: 'phobia', description: 'Claustrophobia', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'breathing_exercises'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Spiders', type: 'debuff', category: 'phobia', description: 'Intense fear of arachnids', baseSeverity: 0.4, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Blood', type: 'debuff', category: 'phobia', description: 'Intense reaction to blood', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'desensitization'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Fire', type: 'debuff', category: 'phobia', description: 'Intense fear of flames', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Storms', type: 'debuff', category: 'phobia', description: 'Anxious during thunderstorms', baseSeverity: 0.4, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'shelter'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of the Dead', type: 'debuff', category: 'phobia', description: 'Uncomfortable around corpses', baseSeverity: 0.5, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'exposure'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Isolation', type: 'debuff', category: 'phobia', description: 'Afraid of being alone', baseSeverity: 0.45, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'companionship'], promotionPolicy: 'expire', visibility: 'player_only' },
  { name: 'Fear of Failure', type: 'debuff', category: 'phobia', description: 'Paralyzed by fear of failing', baseSeverity: 0.4, effects: [], defaultDuration: { type: 'condition', remaining: Infinity, total: Infinity }, stackingRule: 'exclusive', decayModel: 'conditional', resolutionPaths: ['therapy', 'small_victories'], promotionPolicy: 'expire', visibility: 'player_only' },
];

// Combine all templates
export const ALL_MODIFIER_TEMPLATES: ModifierTemplate[] = [
  ...INJURY_TEMPLATES,
  ...FATIGUE_TEMPLATES,
  ...NUTRITION_TEMPLATES,
  ...TRAINING_TEMPLATES,
  ...ILLNESS_TEMPLATES,
  ...PSYCHOLOGICAL_TEMPLATES,
  ...ENVIRONMENT_TEMPLATES,
  ...CHEMICAL_TEMPLATES,
  ...ROUTINE_TEMPLATES,
  ...PHOBIA_TEMPLATES,
];

// ============================================================================
// INTERACTION MATRIX
// ============================================================================

export const INTERACTION_MATRIX: ModifierInteraction[] = [
  // Amplification interactions
  { categoryA: 'environment', categoryB: 'fatigue', type: 'amplification', multiplier: 1.3, description: 'Cold/heat worsens fatigue effects' },
  { categoryA: 'injury', categoryB: 'nutrition', type: 'amplification', multiplier: 1.4, description: 'Malnutrition slows healing' },
  { categoryA: 'psychological', categoryB: 'injury', type: 'amplification', multiplier: 1.2, description: 'Fear/panic worsens injury perception' },
  { categoryA: 'environment', categoryB: 'nutrition', type: 'amplification', multiplier: 1.35, description: 'Heat accelerates dehydration' },
  { categoryA: 'fatigue', categoryB: 'psychological', type: 'amplification', multiplier: 1.25, description: 'Exhaustion worsens mental state' },
  { categoryA: 'illness', categoryB: 'nutrition', type: 'amplification', multiplier: 1.4, description: 'Sickness worsens with poor nutrition' },
  { categoryA: 'chemical', categoryB: 'psychological', type: 'amplification', multiplier: 1.3, description: 'Substances affect mental stability' },
  { categoryA: 'injury', categoryB: 'environment', type: 'amplification', multiplier: 1.25, description: 'Injuries heal slower in harsh conditions' },
  
  // Suppression interactions
  { categoryA: 'chemical', categoryB: 'injury', type: 'suppression', multiplier: 0.5, description: 'Painkillers suppress injury pain' },
  { categoryA: 'psychological', categoryB: 'fatigue', type: 'suppression', multiplier: 0.7, description: 'Determination reduces fatigue perception' },
  { categoryA: 'nutrition', categoryB: 'fatigue', type: 'suppression', multiplier: 0.8, description: 'Good nutrition reduces fatigue buildup' },
  { categoryA: 'training', categoryB: 'injury', type: 'suppression', multiplier: 0.85, description: 'Conditioning reduces minor injury severity' },
  { categoryA: 'routine', categoryB: 'psychological', type: 'suppression', multiplier: 0.75, description: 'Good habits buffer stress' },
  
  // Mutation interactions (create new conditions)
  { categoryA: 'injury', categoryB: 'illness', type: 'mutation', multiplier: 1.0, resultModifier: 'Complicated Wound', description: 'Wound + infection creates complex condition' },
  { categoryA: 'fatigue', categoryB: 'psychological', type: 'mutation', multiplier: 1.0, resultModifier: 'Burnout', description: 'Exhaustion + stress creates burnout' },
  { categoryA: 'chemical', categoryB: 'routine', type: 'mutation', multiplier: 1.0, resultModifier: 'Dependency', description: 'Repeated use + pattern creates addiction' },
  { categoryA: 'psychological', categoryB: 'injury', type: 'mutation', multiplier: 1.0, resultModifier: 'PTSD Flag', description: 'Trauma + severe injury creates lasting mark' },
  
  // Escalation interactions
  { categoryA: 'nutrition', categoryB: 'nutrition', type: 'escalation', multiplier: 1.5, description: 'Hunger escalates to starvation' },
  { categoryA: 'fatigue', categoryB: 'fatigue', type: 'escalation', multiplier: 1.4, description: 'Fatigue escalates to exhaustion' },
  { categoryA: 'illness', categoryB: 'illness', type: 'escalation', multiplier: 1.6, description: 'Untreated illness worsens' },
  { categoryA: 'injury', categoryB: 'injury', type: 'escalation', multiplier: 1.3, description: 'Untreated wounds worsen' },
  
  // Cancellation interactions
  { categoryA: 'nutrition', categoryB: 'nutrition', type: 'cancellation', multiplier: 0.0, description: 'Hydrated cancels dehydrated' },
  { categoryA: 'psychological', categoryB: 'psychological', type: 'cancellation', multiplier: 0.0, description: 'Calm cancels panic' },
  { categoryA: 'environment', categoryB: 'environment', type: 'cancellation', multiplier: 0.0, description: 'Warmth cancels cold' },
];

// ============================================================================
// EXECUTION FUNCTIONS
// ============================================================================

const LONG_DURATION_THRESHOLD = 168; // 1 week in hours
const REPEAT_THRESHOLD = 3;
const DIMINISHING_FACTOR = 0.7;

/**
 * Generate a unique modifier ID
 */
function generateModifierId(): string {
  return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a modifier from a template
 */
export function createModifierFromTemplate(
  template: ModifierTemplate,
  campaignId: string,
  entity: string,
  originEvent: string,
  tick: number,
  severityOverride?: number
): Modifier {
  return {
    id: generateModifierId(),
    campaignId,
    entity,
    type: template.type,
    category: template.category,
    name: template.name,
    description: template.description,
    severity: severityOverride ?? template.baseSeverity,
    effects: [...template.effects],
    duration: {
      type: template.defaultDuration.type || 'time',
      remaining: template.defaultDuration.remaining || 24,
      total: template.defaultDuration.remaining || 24,
      condition: template.defaultDuration.condition,
    },
    stackingRule: template.stackingRule,
    decayModel: template.decayModel,
    originEvent,
    provenance: 'observed',
    confidence: 1.0,
    visibility: template.visibility,
    resolutionPaths: [...template.resolutionPaths],
    promotionPolicy: template.promotionPolicy,
    recurrence: 0,
    emotionalWeight: template.category === 'psychological' ? 0.7 : 0.3,
    appliedAt: tick,
    stacks: 1,
  };
}

/**
 * Find a template by name
 */
export function findTemplateByName(name: string): ModifierTemplate | undefined {
  return ALL_MODIFIER_TEMPLATES.find(t => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Apply a modifier to an entity's state
 */
/**
 * Check if we can add a new modifier based on limits
 */
function canAddModifier(state: ModifierState, modifier: Modifier): boolean {
  const { MAX_TOTAL_MODIFIERS, MAX_PER_CATEGORY, MAX_BUFFS, MAX_DEBUFFS, MIN_SEVERITY_THRESHOLD } = MODIFIER_LIMITS;
  
  // Check severity threshold - too weak modifiers are ignored
  if (modifier.severity < MIN_SEVERITY_THRESHOLD) {
    return false;
  }
  
  // Check total limit
  if (state.activeModifiers.length >= MAX_TOTAL_MODIFIERS) {
    return false;
  }
  
  // Check buff/debuff limits
  const currentBuffs = state.activeModifiers.filter(m => m.type === 'buff').length;
  const currentDebuffs = state.activeModifiers.filter(m => m.type === 'debuff').length;
  
  if (modifier.type === 'buff' && currentBuffs >= MAX_BUFFS) {
    return false;
  }
  if (modifier.type === 'debuff' && currentDebuffs >= MAX_DEBUFFS) {
    return false;
  }
  
  // Check per-category limit (phobias are exempt - behavioral only)
  if (modifier.category !== 'phobia') {
    const categoryCount = state.activeModifiers.filter(m => m.category === modifier.category).length;
    if (categoryCount >= MAX_PER_CATEGORY) {
      return false;
    }
  }
  
  return true;
}

/**
 * Find if there's a weaker modifier of same type that can be replaced
 */
function findReplaceable(state: ModifierState, modifier: Modifier): number {
  // Severity takes over: find weaker modifier of same category to replace
  const candidates = state.activeModifiers
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => 
      m.category === modifier.category && 
      m.type === modifier.type &&
      m.severity < modifier.severity
    )
    .sort((a, b) => a.m.severity - b.m.severity);
  
  return candidates.length > 0 ? candidates[0].idx : -1;
}

export function applyModifier(state: ModifierState, modifier: Modifier): ModifierState {
  // Validate modifier has required fields
  if (!modifier.originEvent) {
    console.warn('Modifier applied without origin event:', modifier.name);
  }
  if (!modifier.duration) {
    console.warn('Modifier applied without duration:', modifier.name);
  }

  const newState = { ...state, activeModifiers: [...state.activeModifiers] };
  
  // Handle stacking rules - check for existing modifier of same name
  const existingIndex = newState.activeModifiers.findIndex(
    m => m.category === modifier.category && m.name === modifier.name
  );

  if (existingIndex >= 0) {
    const existing = newState.activeModifiers[existingIndex];
    
    switch (modifier.stackingRule) {
      case 'exclusive':
        // Keep only the stronger one (severity takes over)
        if (modifier.severity > existing.severity) {
          newState.activeModifiers[existingIndex] = modifier;
        }
        break;
        
      case 'additive':
        // Add severities (capped at 1.0)
        newState.activeModifiers[existingIndex] = {
          ...existing,
          severity: Math.min(1.0, existing.severity + modifier.severity),
          stacks: Math.min(existing.stacks + 1, 3), // Cap stacks at 3
          duration: {
            ...existing.duration,
            remaining: Math.max(existing.duration.remaining, modifier.duration.remaining),
          },
        };
        break;
        
      case 'diminishing':
        // Each stack less effective
        const diminishedSeverity = modifier.severity * Math.pow(DIMINISHING_FACTOR, existing.stacks);
        newState.activeModifiers[existingIndex] = {
          ...existing,
          severity: Math.min(1.0, existing.severity + diminishedSeverity),
          stacks: Math.min(existing.stacks + 1, 3),
        };
        break;
    }
    return newState;
  }
  
  // Check if we can add this new modifier
  if (canAddModifier(newState, modifier)) {
    newState.activeModifiers.push(modifier);
  } else {
    // Try to find a weaker modifier to replace (severity takes over)
    const replaceableIdx = findReplaceable(newState, modifier);
    if (replaceableIdx >= 0) {
      newState.activeModifiers[replaceableIdx] = modifier;
    }
    // Otherwise, modifier is not applied - limits exceeded
  }

  return newState;
}

/**
 * Process modifier decay over time
 */
export function tickModifiers(state: ModifierState, deltaHours: number): ModifierState {
  const newState = { 
    ...state, 
    activeModifiers: [],
    modifierHistory: [...state.modifierHistory],
  };

  for (const modifier of state.activeModifiers) {
    if (modifier.duration.type === 'time') {
      const updated = {
        ...modifier,
        duration: {
          ...modifier.duration,
          remaining: modifier.duration.remaining - deltaHours,
        },
      };

      if (updated.duration.remaining <= 0) {
        // Modifier expired - handle resolution
        const resolved = resolveModifier(updated, newState);
        newState.modifierHistory.push(updated);
        if (resolved.promotedModifier) {
          newState.promotedModifiers = [
            ...(newState.promotedModifiers || []),
            resolved.promotedModifier,
          ];
        }
      } else {
        // Apply decay based on model
        newState.activeModifiers.push(applyDecay(updated, deltaHours));
      }
    } else {
      // Condition-based modifiers don't decay with time
      newState.activeModifiers.push(modifier);
    }
  }

  return newState;
}

/**
 * Apply decay to a modifier based on its decay model
 */
function applyDecay(modifier: Modifier, deltaHours: number): Modifier {
  switch (modifier.decayModel) {
    case 'linear':
      // Severity decreases linearly with time
      const linearDecay = (deltaHours / modifier.duration.total) * modifier.severity * 0.5;
      return {
        ...modifier,
        severity: Math.max(0.05, modifier.severity - linearDecay),
      };
      
    case 'staged':
      // Decay happens in stages (25%, 50%, 75% of duration)
      const progress = 1 - (modifier.duration.remaining / modifier.duration.total);
      if (progress > 0.75) {
        return { ...modifier, severity: modifier.severity * 0.25 };
      } else if (progress > 0.5) {
        return { ...modifier, severity: modifier.severity * 0.5 };
      } else if (progress > 0.25) {
        return { ...modifier, severity: modifier.severity * 0.75 };
      }
      return modifier;
      
    case 'threshold':
      // No decay until threshold, then rapid
      if (modifier.duration.remaining < modifier.duration.total * 0.2) {
        return { ...modifier, severity: modifier.severity * 0.3 };
      }
      return modifier;
      
    case 'conditional':
    case 'reversible':
      // These don't decay naturally
      return modifier;
      
    default:
      return modifier;
  }
}

/**
 * Resolve an expired modifier
 */
function resolveModifier(
  modifier: Modifier, 
  state: ModifierState
): { promotedModifier?: Modifier } {
  switch (modifier.promotionPolicy) {
    case 'scar':
      // Create a permanent scar entry
      return {
        promotedModifier: {
          ...modifier,
          id: generateModifierId(),
          name: `Scar: ${modifier.name}`,
          description: `Lasting mark from ${modifier.name}`,
          severity: modifier.severity * 0.1,
          duration: { type: 'condition', remaining: Infinity, total: Infinity },
          promotionPolicy: 'expire',
        },
      };
      
    case 'trauma_flag':
      // Create a trauma memory
      return {
        promotedModifier: {
          ...modifier,
          id: generateModifierId(),
          name: `Trauma: ${modifier.name}`,
          description: `Psychological mark from ${modifier.name}`,
          category: 'psychological',
          severity: modifier.severity * 0.3,
          duration: { type: 'condition', remaining: Infinity, total: Infinity },
          visibility: 'hidden',
          promotionPolicy: 'expire',
        },
      };
      
    case 'chronic':
      // May become permanent condition
      if (modifier.recurrence >= REPEAT_THRESHOLD || modifier.duration.total > LONG_DURATION_THRESHOLD) {
        return {
          promotedModifier: {
            ...modifier,
            id: generateModifierId(),
            name: `Chronic: ${modifier.name}`,
            description: `Recurring condition: ${modifier.name}`,
            severity: modifier.severity * 0.5,
            duration: { type: 'condition', remaining: Infinity, total: Infinity },
            promotionPolicy: 'expire',
          },
        };
      }
      return {};
      
    case 'addiction':
      if (modifier.recurrence >= REPEAT_THRESHOLD) {
        return {
          promotedModifier: {
            ...modifier,
            id: generateModifierId(),
            name: `Addiction: ${modifier.name.replace('Pain Suppression', 'Painkillers').replace('Stimulant Effect', 'Stimulants')}`,
            description: `Dependency on substance`,
            category: 'chemical',
            type: 'debuff',
            severity: 0.5,
            duration: { type: 'condition', remaining: Infinity, total: Infinity },
            promotionPolicy: 'expire',
          },
        };
      }
      return {};
      
    case 'expire':
    default:
      return {};
  }
}

/**
 * Calculate interaction effects between modifiers
 */
export function recomputeInteractions(state: ModifierState): ModifierState {
  try {
    if (!state || !state.activeModifiers || state.activeModifiers.length === 0) {
      return state;
    }
    
    const newState = { ...state, activeModifiers: [...state.activeModifiers] };
    const mutations: Modifier[] = [];

  for (let i = 0; i < newState.activeModifiers.length; i++) {
    for (let j = i + 1; j < newState.activeModifiers.length; j++) {
      const modA = newState.activeModifiers[i];
      const modB = newState.activeModifiers[j];

      const interaction = INTERACTION_MATRIX.find(
        int => (int.categoryA === modA.category && int.categoryB === modB.category) ||
               (int.categoryA === modB.category && int.categoryB === modA.category)
      );

      if (interaction) {
        const impact = modA.severity * modB.severity * interaction.multiplier;

        switch (interaction.type) {
          case 'amplification':
            // Increase severity of both
            newState.activeModifiers[i] = {
              ...modA,
              severity: Math.min(1.0, modA.severity * (1 + impact * 0.2)),
            };
            newState.activeModifiers[j] = {
              ...modB,
              severity: Math.min(1.0, modB.severity * (1 + impact * 0.2)),
            };
            break;

          case 'suppression':
            // Reduce effect of target
            newState.activeModifiers[j] = {
              ...modB,
              severity: Math.max(0.05, modB.severity * interaction.multiplier),
            };
            break;

          case 'mutation':
            // Create new condition if both are severe enough
            if (modA.severity > 0.4 && modB.severity > 0.4 && interaction.resultModifier) {
              const template = findTemplateByName(interaction.resultModifier);
              if (template) {
                try {
                  mutations.push(createModifierFromTemplate(
                    template,
                    modA.campaignId,
                    modA.entity,
                    `mutation:${modA.id}+${modB.id}`,
                    modA.appliedAt,
                    (modA.severity + modB.severity) / 2
                  ));
                } catch (e) {
                  console.warn(`Failed to create mutation modifier: ${interaction.resultModifier}`, e);
                }
              }
            }
            break;

          case 'cancellation':
            // Opposite types cancel
            if (modA.type !== modB.type) {
              const strongerSeverity = Math.abs(modA.severity - modB.severity);
              if (modA.severity > modB.severity) {
                newState.activeModifiers[i] = { ...modA, severity: strongerSeverity };
                newState.activeModifiers[j] = { ...modB, severity: 0 };
              } else {
                newState.activeModifiers[i] = { ...modA, severity: 0 };
                newState.activeModifiers[j] = { ...modB, severity: strongerSeverity };
              }
            }
            break;
        }
      }
    }
  }

  // Add mutations and remove zeroed modifiers
    newState.activeModifiers = [
      ...newState.activeModifiers.filter(m => m.severity > 0),
      ...mutations,
    ];

    return newState;
  } catch (e) {
    console.warn('Error in recomputeInteractions:', e);
    return state; // Return original state on error
  }
}

/**
 * Calculate effective stats with all modifiers applied
 */
export function computeEffectiveStats(
  baseStats: Record<string, number>,
  state: ModifierState
): Record<string, number> {
  const effectiveStats = { ...baseStats };

  for (const modifier of state.activeModifiers) {
    for (const effect of modifier.effects) {
      if (effectiveStats[effect.stat] !== undefined) {
        effectiveStats[effect.stat] += effect.value * modifier.severity;
      } else {
        effectiveStats[effect.stat] = effect.value * modifier.severity;
      }
    }
  }

  // Clamp all values to reasonable ranges
  for (const stat in effectiveStats) {
    effectiveStats[stat] = Math.max(-1, Math.min(2, effectiveStats[stat]));
  }

  return effectiveStats;
}

/**
 * Check if a modifier should be promoted to LTM
 */
export function checkPromotion(modifier: Modifier): boolean {
  return (
    modifier.duration.total > LONG_DURATION_THRESHOLD ||
    modifier.recurrence > REPEAT_THRESHOLD ||
    modifier.emotionalWeight > 0.7
  );
}

/**
 * Resolve a condition-based modifier
 */
export function resolveCondition(
  state: ModifierState,
  modifierId: string,
  resolution: string
): ModifierState {
  const modifierIndex = state.activeModifiers.findIndex(m => m.id === modifierId);
  if (modifierIndex < 0) return state;

  const modifier = state.activeModifiers[modifierIndex];
  if (!modifier.resolutionPaths.includes(resolution)) {
    console.warn(`Invalid resolution path "${resolution}" for modifier "${modifier.name}"`);
    return state;
  }

  const newState = { ...state, activeModifiers: [...state.activeModifiers] };
  newState.activeModifiers.splice(modifierIndex, 1);
  newState.modifierHistory = [...state.modifierHistory, modifier];

  return newState;
}

/**
 * Create default modifier state
 */
export function createDefaultModifierState(): ModifierState {
  return {
    activeModifiers: [],
    modifierHistory: [],
    promotedModifiers: [],
  };
}

/**
 * Get modifiers visible to NPCs
 */
export function getNPCVisibleModifiers(state: ModifierState): Modifier[] {
  return state.activeModifiers.filter(m => m.visibility === 'npc_visible');
}

/**
 * Get active debuffs of a specific category
 */
export function getDebuffsByCategory(state: ModifierState, category: ModifierCategory): Modifier[] {
  return state.activeModifiers.filter(m => m.type === 'debuff' && m.category === category);
}

/**
 * Get active buffs of a specific category
 */
export function getBuffsByCategory(state: ModifierState, category: ModifierCategory): Modifier[] {
  return state.activeModifiers.filter(m => m.type === 'buff' && m.category === category);
}

/**
 * Validate modifier state integrity
 */
export function validateModifierState(state: ModifierState): string[] {
  const violations: string[] = [];

  for (const modifier of state.activeModifiers) {
    if (!modifier.originEvent) {
      violations.push(`Modifier "${modifier.name}" missing origin event`);
    }
    if (!modifier.duration) {
      violations.push(`Modifier "${modifier.name}" missing duration`);
    }
    if (modifier.severity < 0 || modifier.severity > 1) {
      violations.push(`Modifier "${modifier.name}" has invalid severity: ${modifier.severity}`);
    }
  }

  return violations;
}

/**
 * Get a summary of active modifiers for display
 */
export function getModifierSummary(state: ModifierState): {
  buffs: Array<{ name: string; severity: number; remaining: number; category: ModifierCategory }>;
  debuffs: Array<{ name: string; severity: number; remaining: number; category: ModifierCategory }>;
  totalBuffStrength: number;
  totalDebuffStrength: number;
} {
  const buffs = state.activeModifiers
    .filter(m => m.type === 'buff')
    .map(m => ({
      name: m.name,
      severity: m.severity,
      remaining: m.duration.remaining,
      category: m.category,
    }));

  const debuffs = state.activeModifiers
    .filter(m => m.type === 'debuff')
    .map(m => ({
      name: m.name,
      severity: m.severity,
      remaining: m.duration.remaining,
      category: m.category,
    }));

  return {
    buffs,
    debuffs,
    totalBuffStrength: buffs.reduce((sum, b) => sum + b.severity, 0),
    totalDebuffStrength: debuffs.reduce((sum, d) => sum + d.severity, 0),
  };
}
