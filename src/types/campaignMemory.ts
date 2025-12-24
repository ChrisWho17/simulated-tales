// ============================================================================
// CAMPAIGN MEMORY ARCHITECTURE TYPES
// Based on the Immersive Game Memory Architecture document
// Implements: STM/MTM/LTM, Fork-Safe, Drift-Resistant, Infinite-Run memory
// ============================================================================

// ============================================================================
// CORE ENUMS & TYPES
// ============================================================================

export type MemoryProvenance = 'observed' | 'inferred' | 'reported' | 'rumor';
export type MemoryClassification = 'fact' | 'belief' | 'rumor' | 'myth';
export type MemoryTier = 'stm' | 'mtm' | 'ltm';
export type MemoryObjectType = 
  | 'event' 
  | 'fact' 
  | 'belief' 
  | 'relationship' 
  | 'trait' 
  | 'location_state' 
  | 'commitment' 
  | 'loop' 
  | 'rule';

export type LoopState = 'active' | 'dormant' | 'escalating' | 'resolved' | 'failed';
export type ContradictionResolutionType = 'promoted' | 'reclassified' | 'outdated' | 'false';

// ============================================================================
// BASE MEMORY OBJECT (ALL TYPES)
// ============================================================================

export interface MemoryObject {
  id: string;
  type: MemoryObjectType;
  
  // Timestamps
  timestamp: {
    worldTime: number;  // In-game time (tick)
    realTime: number;   // Real-world timestamp
  };
  
  // Entities & Location
  entities: string[];
  location: string;
  
  // Branching (for fork management)
  campaignId: string;
  branchId: string;
  parentBranchId?: string;
  
  // Metadata
  tags: string[];
  importance: number;           // 0-100, how pivotal
  emotionalWeight: number;      // 0-100, emotional charge
  volatility: number;           // 0-100, likelihood of forgetting
  confidence: number;           // 0-100, certainty of accuracy
  provenance: MemoryProvenance;
  classification: MemoryClassification;
  
  // Causality chain
  causalParents: string[];      // IDs of events that caused this
  effects: string[];            // IDs of effects triggered
  
  // Contradiction handling
  contradictions: string[];     // IDs of contradicting memories
  
  // Tier management
  tier: MemoryTier;
  promotionScore: number;       // Score for promotion consideration
  expiryPolicy: MemoryTier;     // Target tier
  
  // Content
  summary: string;
  details: string;
  
  // State
  isCanon: boolean;
  isActive: boolean;
}

// ============================================================================
// EVENT OBJECT (Most common memory type)
// ============================================================================

export interface EventMemory extends MemoryObject {
  type: 'event';
  
  // Event-specific data
  action: string;
  result: string;
  stateChanges: StateChange[];
  knowledgeClaims: KnowledgeClaim[];
  timersAffected: string[];
  flagsSet: string[];
  flagsCleared: string[];
}

export interface StateChange {
  target: string;
  property: string;
  previousValue: unknown;
  newValue: unknown;
}

export interface KnowledgeClaim {
  claimant: string;
  claim: string;
  reliability: MemoryProvenance;
  witnesses: string[];
}

// ============================================================================
// IDENTITY ANCHOR (Player's soul - never compressed)
// ============================================================================

export interface IdentityAnchor {
  id: string;
  campaignId: string;
  type: 'vow' | 'trauma' | 'signature_item' | 'title' | 'reputation' | 'injury' | 'relationship' | 'value';
  
  anchor: string;               // The actual anchor (e.g., "never kills unarmed")
  description: string;
  
  // Triggers
  triggers: string[];           // What activates this anchor
  
  // Importance
  importance: number;           // 0-100
  createdAt: number;
  source: string;               // Event that created this
  
  // Status
  isActive: boolean;
  violationCount: number;       // How many times violated (for value anchors)
}

// ============================================================================
// OPEN LOOP (Unresolved tension)
// ============================================================================

export interface OpenLoop {
  id: string;
  campaignId: string;
  branchId: string;
  
  // Core loop data
  name: string;
  description: string;
  trigger: string;              // What started this
  
  // Timer
  startTick: number;
  currentTick: number;
  ticksRemaining: number;       // -1 for no deadline
  urgency: 'low' | 'medium' | 'high' | 'critical';
  
  // Escalation
  escalationStage: number;      // 0-N stages
  escalationLadder: LoopEscalation[];
  
  // Resolution
  resolutionPaths: LoopResolution[];
  state: LoopState;
  
  // Entities
  affectedEntities: string[];
  location: string;
  
  // Metadata
  tags: string[];
  importance: number;
}

export interface LoopEscalation {
  stage: number;
  tickThreshold: number;        // Ticks before escalation
  description: string;
  effects: string[];            // What happens at this stage
  urgencyAfter: OpenLoop['urgency'];
}

export interface LoopResolution {
  id: string;
  description: string;
  requirements: string[];       // What's needed to trigger this path
  outcome: 'success' | 'partial' | 'failure';
  consequences: string[];
}

// ============================================================================
// LOCATION STATE (World memory)
// ============================================================================

export interface LocationState {
  id: string;
  locationId: string;
  campaignId: string;
  
  // Physical state
  structuralDamage: number;     // 0-100
  damageDescriptions: string[];
  
  // Population
  populationChange: number;     // % change from baseline
  populationNotes: string[];
  
  // Security
  securityLevel: 'none' | 'low' | 'normal' | 'high' | 'martial_law';
  securityNotes: string[];
  
  // Economy
  economicModifier: number;     // -100 to 100
  priceModifiers: Record<string, number>;
  
  // Mood
  mood: 'festive' | 'normal' | 'tense' | 'fearful' | 'hostile' | 'mourning';
  moodReason: string;
  
  // Rumors
  activeRumors: string[];
  
  // Environment
  environmentalHazards: string[];
  
  // Scars (permanent changes)
  scars: LocationScar[];
  
  lastUpdated: number;
}

export interface LocationScar {
  id: string;
  description: string;
  cause: string;                // Event ID that caused this
  tick: number;
  isPermanent: boolean;
  visibleTo: 'all' | 'observant' | 'locals';
}

// ============================================================================
// CONTRADICTION RECORD
// ============================================================================

export interface ContradictionRecord {
  id: string;
  campaignId: string;
  
  // Conflicting memories
  memoryA: string;              // ID
  memoryB: string;              // ID
  
  // Discovery
  discoveredAt: number;
  discoveredBy: string;         // Entity who noticed
  
  // Evaluation
  confidenceA: number;
  confidenceB: number;
  provenanceA: MemoryProvenance;
  provenanceB: MemoryProvenance;
  
  // Resolution
  resolved: boolean;
  resolution?: ContradictionResolutionType;
  winner?: string;              // Which memory became canon
  loserReclassification?: MemoryClassification;
  resolutionReason: string;
}

// ============================================================================
// CAMPAIGN ROOT OBJECT
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  characterName: string;
  
  // Timestamps
  createdAt: number;
  lastPlayed: number;
  
  // Configuration
  rulesetVersion: string;
  worldSeed: string;
  toneProfile: string[];        // e.g., ['grim', 'slow-burn', 'low-magic']
  
  // Memory policy
  memoryPolicy: {
    stmLimit: number;           // Max STM entries (default: 60)
    mtmSessions: number;        // Sessions to keep in MTM (default: 8)
    ltmCap: number | 'unbounded';
  };
  
  // Fork policy
  forkPolicy: 'hard' | 'soft' | 'selective';
  crossCampaignLinks: boolean;
  
  // Status
  status: 'active' | 'archived' | 'frozen';
  
  // Current state references
  currentBranchId: string;
  currentTick: number;
  currentSession: number;
}

// ============================================================================
// CAMPAIGN MEMORY STORE
// ============================================================================

export interface CampaignMemoryStore {
  campaign: Campaign;
  
  // Three-tier memory
  stm: MemoryObject[];          // Short-term: scene consciousness
  mtm: MemoryObject[];          // Medium-term: session continuity
  ltm: MemoryObject[];          // Long-term: world canon
  
  // Identity anchors (player's soul)
  identityAnchors: IdentityAnchor[];
  
  // Open loops (unresolved tensions)
  openLoops: OpenLoop[];
  
  // Location states
  locationStates: Record<string, LocationState>;
  
  // Contradiction tracking
  contradictions: ContradictionRecord[];
  
  // Event journal (append-only, for reconstruction)
  deltaJournal: AtomicDelta[];
  
  // Session summaries
  sessionSummaries: SessionSummary[];
}

export interface AtomicDelta {
  id: string;
  tick: number;
  realTime: number;
  
  action: string;
  result: string;
  stateChanges: StateChange[];
  knowledgeClaims: KnowledgeClaim[];
  timersStarted: string[];
  timersStopped: string[];
  flagsSet: string[];
  flagsCleared: string[];
}

export interface SessionSummary {
  sessionNumber: number;
  startTick: number;
  endTick: number;
  realTimeStart: number;
  realTimeEnd: number;
  
  keyEvents: string[];          // Most important event IDs
  summary: string;              // Compressed narrative summary
  
  // Changes during session
  relationshipChanges: Record<string, number>;
  loopsResolved: string[];
  loopsCreated: string[];
  anchorsCreated: string[];
}

// ============================================================================
// MEMORY RETRIEVAL CONTEXT
// ============================================================================

export interface MemoryRetrievalContext {
  // Current scene (STM)
  sceneNow: MemoryObject[];
  
  // Identity (LTM)
  identityAnchors: IdentityAnchor[];
  
  // Active pressure
  activeLoops: OpenLoop[];
  
  // Recent history
  relevantMtmEvents: MemoryObject[];
  
  // NPC context
  npcCards: NPCMemoryCard[];
  
  // Location
  locationScars: LocationScar[];
  locationState: LocationState | null;
  
  // Canon
  canonFacts: MemoryObject[];
  
  // Unverified
  rumorsAndClaims: MemoryObject[];
}

export interface NPCMemoryCard {
  npcId: string;
  npcName: string;
  disposition: number;          // -100 to 100
  keyMemories: string[];        // Memory IDs
  beliefs: MemoryObject[];      // What they believe (may be wrong)
  observationLimits: string[];  // What they couldn't have seen
}

// ============================================================================
// MEMORY VALIDATION
// ============================================================================

export interface MemoryValidationResult {
  valid: boolean;
  errors: MemoryValidationError[];
  warnings: MemoryValidationWarning[];
}

export interface MemoryValidationError {
  code: string;
  message: string;
  memoryId?: string;
  severity: 'critical' | 'error';
  fix?: () => void;
}

export interface MemoryValidationWarning {
  code: string;
  message: string;
  memoryId?: string;
}

// ============================================================================
// INVARIANT CHECKS
// ============================================================================

export interface InvariantViolation {
  type: 'dead_speaking' | 'item_duplicated' | 'quest_state_invalid' | 'time_regression' | 'impossible_state';
  description: string;
  involvedEntities: string[];
  tick: number;
  suggestedFix: string;
}
