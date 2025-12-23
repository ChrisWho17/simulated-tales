// ============= LIFE SIM TYPES - PHASE 9 =============
// Sims-style needs + mature relationship systems

// ============= PHYSICAL & PSYCHOLOGICAL NEEDS =============

export interface PhysicalNeeds {
  hunger: number;      // 0-100, drops ~5/hour
  thirst: number;      // 0-100, drops ~8/hour
  energy: number;      // 0-100, drops with activity
  bladder: number;     // 0-100, fills over time
  hygiene: number;     // 0-100, drops slowly
  health: number;      // 0-100, affected by injury/neglect
}

export interface PsychologicalNeeds {
  stress: number;      // 0-100
  tension: number;     // 0-100, physical tension from various stimuli
  comfort: number;     // 0-100, environment/clothing/safety
  social: number;      // 0-100, drops in isolation
  fulfillment: number; // 0-100, meaningful activity
}

export interface PlayerNeeds {
  physical: PhysicalNeeds;
  psychological: PsychologicalNeeds;
}

export type NeedLevel = 'critical' | 'low' | 'moderate' | 'good' | 'excellent';

export interface NeedEffect {
  need: keyof PhysicalNeeds | keyof PsychologicalNeeds;
  threshold: number;
  effect: string;
  modifier: number;
}

// ============= BODY SYSTEM =============

export type BodyType = 'slim' | 'average' | 'athletic' | 'curvy' | 'heavy';
export type HairLength = 'shaved' | 'short' | 'medium' | 'long' | 'very_long';

export interface BodyMark {
  location: string;
  type: string;
  duration: number;    // ticks until healed, -1 for permanent
  origin?: string;
}

export interface BodyInjury {
  location: string;
  severity: number;    // 1-100
  age: number;         // ticks since occurred
  description?: string;
}

export interface BodyScar {
  location: string;
  description: string;
  origin: string;
}

export interface BodyAttributes {
  // Physical baseline
  height: number;      // in cm
  bodyType: BodyType;
  fitness: number;     // 0-100
  
  // Appearance
  hairColor: string;
  hairLength: HairLength;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  
  // Features
  attractiveness: number;  // 0-100
  distinctiveFeatures: string[];
  bodyShape: string;
  
  // Condition
  scars: BodyScar[];
  marks: BodyMark[];
  injuries: BodyInjury[];
  
  // Grooming
  grooming: number;    // 0-100
  
  // Current state
  cleanliness: number; // 0-100
  visibleFatigue: boolean;
  visibleDistress: boolean;
}

// ============= CLOTHING SYSTEM =============

export type ClothingSlot = 
  | 'head' | 'face' | 'neck' 
  | 'upper_body' | 'lower_body' 
  | 'underwear_top' | 'underwear_bottom'
  | 'legs' | 'feet' | 'hands' | 'accessories';

export type ClothingFormality = 'underwear' | 'casual' | 'nice' | 'formal' | 'work_specific';

export interface ClothingItem {
  id: string;
  name: string;
  slots: ClothingSlot[];
  
  // Coverage
  coverage: number;        // 0-100, how much body it conceals
  opacity: number;         // 0-100, transparency
  
  // Properties
  warmth: number;
  protection: number;
  durability: number;
  condition: number;       // 0-100
  
  // Social
  formality: ClothingFormality;
  provocativeness: number; // 0-100
  cost: number;
  
  // State
  wet: boolean;
  dirty: boolean;
  damaged: boolean;
}

export interface Outfit {
  slots: Record<ClothingSlot, ClothingItem | null>;
}

export type ExposureLevel = 'fully_clothed' | 'partially_covered' | 'minimally_covered' | 'unclothed';

// ============= TENSION SYSTEM =============

export interface TensionState {
  current: number;         // 0-100
  baselineRecovery: number;
  sensitivity: number;     // how easily it rises
  
  // Thresholds
  distractedAt: number;    // affects focus
  noticeableAt: number;    // NPCs might detect
  intenseAt: number;       // affects decisions
  overwhelmingAt: number;  // reduces options
}

export type TensionLevel = 'calm' | 'distracted' | 'noticeable' | 'intense' | 'overwhelming';

// ============= ENCOUNTER SYSTEM =============

export type EncounterType = 'flirtation' | 'romantic_contact' | 'intimate_encounter';
export type WillingnessLevel = 'eager' | 'willing' | 'reluctant' | 'pressured' | 'refusing';

export interface EncounterAction {
  id: string;
  actor: string;
  type: string;
  description: string;
  tensionEffect: number;
  satisfactionEffect: number;
}

export interface EncounterState {
  id: string;
  participants: string[];
  initiator: string;
  type: EncounterType;
  
  // Consent tracking
  playerWillingness: WillingnessLevel;
  playerCanDecline: boolean;
  
  // Progress
  stage: number;
  actions: EncounterAction[];
  
  // Outcomes
  tensionChange: Record<string, number>;
  satisfactionLevel: number;
  emotionalImpact: number;
  
  // Context
  witnessed: boolean;
  witnesses: string[];
  location: string;
  isPrivate: boolean;
}

// ============= NPC INTEREST SYSTEM =============

export interface NPCInterestSystem {
  // Preferences
  attractedTo: {
    types: BodyType[];
    personalities: string[];
  };
  
  // Drive
  interestLevel: number;      // 0-100
  currentTension: number;
  frustration: number;        // builds over time
  
  // Approach style
  boldness: number;           // 0-100
  persistence: number;        // 0-100
  respectsBoundaries: boolean;
  
  // With player specifically
  attractionToPlayer: number; // 0-100
  romanticHistory: boolean;
  timesIntimate: number;
  lastIntimateEncounter: number; // tick
  satisfaction: number;       // how good past encounters were
}

// ============= EXTENDED RELATIONSHIP =============

export type ExclusivityLevel = 'none' | 'casual' | 'dating' | 'committed' | 'partnered';

export interface ExtendedRelationship {
  // Base
  trust: number;
  fear: number;
  respect: number;
  
  // Romantic
  romanticInterest: number;   // 0-100
  romanticHistory: boolean;
  exclusivity: ExclusivityLevel;
  
  // Physical
  physicalTension: number;    // 0-100
  intimateHistory: boolean;
  compatibility: number;      // 0-100
  intimacyLevel: number;      // 0-5
  
  // Emotional
  jealousy: number;           // 0-100
  longing: number;            // 0-100
  resentment: number;         // 0-100
  attachment: number;         // 0-100
}

// ============= REPUTATION SYSTEM =============

export type ReputationTier = 'unknown' | 'noticed' | 'known' | 'famous' | 'notorious';

export interface ReputationAxis {
  romantic: number;    // -100 (reserved) to 100 (promiscuous)
  social: number;      // -100 (nobody) to 100 (influential)
  moral: number;       // -100 (virtuous) to 100 (corrupt)
  danger: number;      // -100 (harmless) to 100 (threatening)
  wealth: number;      // -100 (destitute) to 100 (wealthy)
}

export interface LocationReputation {
  locationId: string;
  tier: ReputationTier;
  axes: ReputationAxis;
  events: ReputationEvent[];
}

export interface ReputationEvent {
  id: string;
  tick: number;
  description: string;
  axisChanges: Partial<ReputationAxis>;
  witnesses: string[];
  spreadCount: number;
}

// ============= ECONOMY SYSTEM =============

export interface IncomeSource {
  source: string;
  amount: number;
  schedule: 'daily' | 'weekly' | 'monthly';
  lastPaid: number;    // tick
}

export interface Expense {
  type: string;
  amount: number;
  schedule: 'daily' | 'weekly' | 'monthly';
  nextDue: number;     // tick
}

export interface Debt {
  creditor: string;
  amount: number;
  interest: number;    // percentage
  dueDate: number;     // tick
  overdue: boolean;
}

export type HousingType = 'homeless' | 'shelter' | 'renting_room' | 'renting_apartment' | 'owns_home';

export interface EconomyState {
  money: number;
  income: IncomeSource[];
  expenses: Expense[];
  debts: Debt[];
  
  // Housing
  housing: HousingType;
  rent: number;
  rentDue: number;     // tick
  
  // Employment reference
  currentJobId: string | null;
}

// ============= JOB SYSTEM =============

export type JobCategory = 'service' | 'office' | 'labor' | 'entertainment' | 'companion' | 'underground';

export interface JobSchedule {
  days: number[];      // 0-6, Sunday = 0
  startHour: number;
  endHour: number;
}

export interface Job {
  id: string;
  title: string;
  category: JobCategory;
  employer: string;
  location: string;
  
  pay: number;
  paySchedule: 'daily' | 'weekly' | 'monthly';
  schedule: JobSchedule;
  
  performance: number;      // 0-100
  warnings: number;
  
  coworkers: string[];
  boss: string;
  
  // Requirements
  requiredSkills: Record<string, number>;
  dresscode: ClothingFormality | null;
  
  // Effects
  stressImpact: number;     // per shift
  reputationEffects: Partial<ReputationAxis>;
  encounterChance: number;  // 0-100
}

// ============= SKILLS SYSTEM =============

export interface PhysicalSkills {
  fitness: number;
  combat: number;
  athletics: number;
  dance: number;
}

export interface SocialSkills {
  persuasion: number;
  seduction: number;
  deception: number;
  intimidation: number;
  charm: number;
}

export interface PracticalSkills {
  domestic: number;
  crafting: number;
  medicine: number;
  survival: number;
}

export interface IntimateSkills {
  romance: number;
  attentiveness: number;
  technique: number;
  stamina: number;
}

export interface PlayerSkills {
  physical: PhysicalSkills;
  social: SocialSkills;
  practical: PracticalSkills;
  intimate: IntimateSkills;
}

// ============= HOME SYSTEM =============

export interface Room {
  id: string;
  type: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'storage' | 'other';
  furniture: Furniture[];
  cleanliness: number;
}

export interface Furniture {
  id: string;
  type: string;
  quality: number;
  condition: number;
  provides: string[];    // 'sleep', 'bathe', 'cook', 'store', 'relax'
}

export interface VisitEvent {
  id: string;
  visitorId: string;
  tick: number;
  type: 'invited' | 'unexpected' | 'forced';
  outcome: string;
}

export interface HomeState {
  type: HousingType;
  address: string;
  neighborhood: string;
  
  rooms: Room[];
  security: number;        // 0-100
  comfort: number;         // 0-100
  cleanliness: number;     // 0-100
  condition: number;       // 0-100
  
  owner: string;           // player or landlord id
  keyholders: string[];
  
  canBeInvaded: boolean;
  visitors: VisitEvent[];
}

// ============= LOCATION ENCOUNTER TABLE =============

export type LocationType = 'public' | 'semi_public' | 'private' | 'dangerous';

export interface EncounterTableEntry {
  type: string;
  chance: number;          // base probability 0-100
  modifiers: EncounterModifier[];
  participantTypes: string[];
}

export interface EncounterModifier {
  condition: string;
  modifier: number;
}

export interface LocationProfile {
  locationId: string;
  type: LocationType;
  
  crowdLevel: Record<string, number>;  // time period -> crowd size
  npcTypes: string[];
  
  encounterTable: EncounterTableEntry[];
  
  safetyLevel: number;     // 0-100
  authorityPresence: boolean;
  helpAvailable: boolean;
  
  dresscode: ClothingFormality | null;
  services: string[];
  reputation: string;
}

// ============= DANGER/COERCION SYSTEM =============

export type ResistOption = 'fight' | 'flee' | 'call_for_help' | 'submit' | 'negotiate';

export interface DangerEncounter {
  id: string;
  type: 'coercion';
  perpetratorId: string;
  
  resistOptions: ResistOption[];
  resistSuccess: number;   // 0-100 chance based on stats
  
  // Outcomes
  physicalDamage: number;
  psychologicalDamage: number;
  traumaCreated: boolean;
  
  // Context
  witnessed: boolean;
  reported: boolean;
  perpetratorKnown: boolean;
}

// ============= CONSEQUENCE SYSTEM (Optional) =============

export interface ConsequenceState {
  enabled: boolean;
  
  riskExposure: number;
  protectionUsed: boolean;
  
  consequenceActive: boolean;
  consequenceWeek: number;
  source: string | 'unknown';
  
  resolutionAvailable: boolean;
  resolutionDeadline: number; // tick
}

// ============= CONTENT SETTINGS =============

export type ContentDetailLevel = 'detailed' | 'moderate' | 'summary';
export type PursuitLevel = 'passive' | 'moderate' | 'aggressive';
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'brutal';
export type FrequencyLevel = 'low' | 'normal' | 'high';

export interface ContentSettings {
  matureContentDetail: ContentDetailLevel;
  
  allowCoercion: boolean;
  allowConsequences: boolean;
  
  npcPursuitLevel: PursuitLevel;
  
  economicPressure: DifficultyLevel;
  encounterFrequency: FrequencyLevel;
  
  showTensionIndicator: boolean;
  showBodyDetails: boolean;
}

// ============= EXTENDED PLAYER STATE =============

export interface LifeSimPlayerState {
  needs: PlayerNeeds;
  body: BodyAttributes;
  outfit: Outfit;
  tension: TensionState;
  skills: PlayerSkills;
  economy: EconomyState;
  home: HomeState | null;
  job: Job | null;
  jobHistory: Job[];
  reputation: Record<string, LocationReputation>;
  contentSettings: ContentSettings;
  consequence: ConsequenceState | null;
}

// ============= EXTENDED NPC STATE =============

export interface LifeSimNPCState {
  interest: NPCInterestSystem;
  extendedRelationship: ExtendedRelationship;
  body: BodyAttributes;
  outfit: Outfit;
}

// ============= DEFAULT FACTORIES =============

export function createDefaultPhysicalNeeds(): PhysicalNeeds {
  return {
    hunger: 80,
    thirst: 80,
    energy: 80,
    bladder: 20,
    hygiene: 80,
    health: 100,
  };
}

export function createDefaultPsychologicalNeeds(): PsychologicalNeeds {
  return {
    stress: 20,
    tension: 10,
    comfort: 70,
    social: 60,
    fulfillment: 50,
  };
}

export function createDefaultPlayerNeeds(): PlayerNeeds {
  return {
    physical: createDefaultPhysicalNeeds(),
    psychological: createDefaultPsychologicalNeeds(),
  };
}

export function createDefaultTensionState(): TensionState {
  return {
    current: 10,
    baselineRecovery: 2,
    sensitivity: 50,
    distractedAt: 30,
    noticeableAt: 50,
    intenseAt: 75,
    overwhelmingAt: 90,
  };
}

export function createDefaultBodyAttributes(): BodyAttributes {
  return {
    height: 170,
    bodyType: 'average',
    fitness: 50,
    hairColor: 'brown',
    hairLength: 'medium',
    hairStyle: 'natural',
    eyeColor: 'brown',
    skinTone: 'medium',
    attractiveness: 50,
    distinctiveFeatures: [],
    bodyShape: 'average',
    scars: [],
    marks: [],
    injuries: [],
    grooming: 70,
    cleanliness: 80,
    visibleFatigue: false,
    visibleDistress: false,
  };
}

export function createDefaultOutfit(): Outfit {
  return {
    slots: {
      head: null,
      face: null,
      neck: null,
      upper_body: {
        id: 'basic_shirt',
        name: 'Basic Shirt',
        slots: ['upper_body'],
        coverage: 70,
        opacity: 100,
        warmth: 30,
        protection: 5,
        durability: 80,
        condition: 90,
        formality: 'casual',
        provocativeness: 10,
        cost: 10,
        wet: false,
        dirty: false,
        damaged: false,
      },
      lower_body: {
        id: 'basic_pants',
        name: 'Basic Pants',
        slots: ['lower_body'],
        coverage: 80,
        opacity: 100,
        warmth: 40,
        protection: 10,
        durability: 85,
        condition: 85,
        formality: 'casual',
        provocativeness: 5,
        cost: 15,
        wet: false,
        dirty: false,
        damaged: false,
      },
      underwear_top: null,
      underwear_bottom: {
        id: 'basic_underwear',
        name: 'Basic Underwear',
        slots: ['underwear_bottom'],
        coverage: 30,
        opacity: 100,
        warmth: 5,
        protection: 0,
        durability: 70,
        condition: 80,
        formality: 'underwear',
        provocativeness: 20,
        cost: 5,
        wet: false,
        dirty: false,
        damaged: false,
      },
      legs: null,
      feet: {
        id: 'basic_shoes',
        name: 'Basic Shoes',
        slots: ['feet'],
        coverage: 100,
        opacity: 100,
        warmth: 20,
        protection: 30,
        durability: 90,
        condition: 80,
        formality: 'casual',
        provocativeness: 0,
        cost: 20,
        wet: false,
        dirty: false,
        damaged: false,
      },
      hands: null,
      accessories: null,
    },
  };
}

export function createDefaultPlayerSkills(): PlayerSkills {
  return {
    physical: {
      fitness: 30,
      combat: 10,
      athletics: 25,
      dance: 15,
    },
    social: {
      persuasion: 30,
      seduction: 20,
      deception: 15,
      intimidation: 10,
      charm: 35,
    },
    practical: {
      domestic: 40,
      crafting: 20,
      medicine: 15,
      survival: 25,
    },
    intimate: {
      romance: 25,
      attentiveness: 30,
      technique: 20,
      stamina: 40,
    },
  };
}

export function createDefaultEconomyState(): EconomyState {
  return {
    money: 50,
    income: [],
    expenses: [],
    debts: [],
    housing: 'renting_room',
    rent: 100,
    rentDue: 168, // one week in ticks
    currentJobId: null,
  };
}

export function createDefaultHomeState(): HomeState {
  return {
    type: 'renting_room',
    address: 'Room 3, The Rusty Nail',
    neighborhood: 'Town Center',
    rooms: [
      {
        id: 'room_1',
        type: 'bedroom',
        furniture: [
          { id: 'bed_1', type: 'bed', quality: 40, condition: 60, provides: ['sleep'] },
          { id: 'chest_1', type: 'chest', quality: 30, condition: 70, provides: ['store'] },
        ],
        cleanliness: 60,
      },
    ],
    security: 30,
    comfort: 40,
    cleanliness: 60,
    condition: 70,
    owner: 'npc_martha',
    keyholders: ['player', 'npc_martha'],
    canBeInvaded: true,
    visitors: [],
  };
}

export function createDefaultContentSettings(): ContentSettings {
  return {
    matureContentDetail: 'moderate',
    allowCoercion: false,
    allowConsequences: false,
    npcPursuitLevel: 'moderate',
    economicPressure: 'normal',
    encounterFrequency: 'normal',
    showTensionIndicator: true,
    showBodyDetails: true,
  };
}

export function createDefaultNPCInterest(): NPCInterestSystem {
  return {
    attractedTo: {
      types: ['average', 'athletic'],
      personalities: ['friendly', 'kind'],
    },
    interestLevel: 50,
    currentTension: 20,
    frustration: 10,
    boldness: 40,
    persistence: 30,
    respectsBoundaries: true,
    attractionToPlayer: 0,
    romanticHistory: false,
    timesIntimate: 0,
    lastIntimateEncounter: -1,
    satisfaction: 0,
  };
}

export function createDefaultExtendedRelationship(): ExtendedRelationship {
  return {
    trust: 0,
    fear: 0,
    respect: 0,
    romanticInterest: 0,
    romanticHistory: false,
    exclusivity: 'none',
    physicalTension: 0,
    intimateHistory: false,
    compatibility: 50,
    intimacyLevel: 0,
    jealousy: 0,
    longing: 0,
    resentment: 0,
    attachment: 0,
  };
}
