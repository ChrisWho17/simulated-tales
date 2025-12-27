// ============================================================================
// SAVE RECOVERY SYSTEM - Type Definitions
// All data models for the deterministic recovery pipeline
// ============================================================================

// ============================================================================
// RECOVERY OPERATION ALLOWLIST
// Only these operations are permitted - no arbitrary code execution
// ============================================================================

export type RecoveryOpType =
  | 'set'
  | 'delete'
  | 'rename'
  | 'coerce'
  | 'truncate'
  | 'filterArray'
  | 'mapArray'
  | 'ensureDefault'
  | 'rebuildIndex';

// Built-in predicates for filterArray (no custom code allowed)
export type BuiltInPredicateId =
  | 'removeNulls'
  | 'removeUndefined'
  | 'removeEmptyStrings'
  | 'removeInvalidIds'
  | 'removeOrphanEdges'
  | 'removeDuplicates';

// Built-in mappers for mapArray (no custom code allowed)
export type BuiltInMapperId =
  | 'ensureEventId'
  | 'ensureTimestamp'
  | 'normalizeCharacterId'
  | 'compactEvent';

// Coercion target types
export type CoercionTarget = 'string' | 'number' | 'boolean' | 'array' | 'object';

// ============================================================================
// RECOVERY OPERATION
// ============================================================================

export interface RecoveryOpBase {
  type: RecoveryOpType;
  path: string; // JSON pointer style: "/gameData/relationships/edges/0/to"
  reason: string; // Human-readable explanation
}

export interface SetOp extends RecoveryOpBase {
  type: 'set';
  value: unknown;
}

export interface DeleteOp extends RecoveryOpBase {
  type: 'delete';
}

export interface RenameOp extends RecoveryOpBase {
  type: 'rename';
  newPath: string;
}

export interface CoerceOp extends RecoveryOpBase {
  type: 'coerce';
  targetType: CoercionTarget;
}

export interface TruncateOp extends RecoveryOpBase {
  type: 'truncate';
  maxLength: number;
}

export interface FilterArrayOp extends RecoveryOpBase {
  type: 'filterArray';
  predicateId: BuiltInPredicateId;
}

export interface MapArrayOp extends RecoveryOpBase {
  type: 'mapArray';
  mapperId: BuiltInMapperId;
}

export interface EnsureDefaultOp extends RecoveryOpBase {
  type: 'ensureDefault';
  defaultValue: unknown;
}

export interface RebuildIndexOp extends RecoveryOpBase {
  type: 'rebuildIndex';
  indexName: string;
}

export type RecoveryOp =
  | SetOp
  | DeleteOp
  | RenameOp
  | CoerceOp
  | TruncateOp
  | FilterArrayOp
  | MapArrayOp
  | EnsureDefaultOp
  | RebuildIndexOp;

// ============================================================================
// FAILURE SNAPSHOT
// ============================================================================

export interface FailureSnapshot {
  id: string;
  campaignId: string;
  timestamp: number;
  originalSave: string; // JSON stringified for safe storage
  errorCode: string;
  errorMessage: string;
  brokenPaths: string[]; // e.g., ["relationships.edges[4].to invalid", "needs.physical.hunger NaN"]
  saveVersion: number;
  subsystemVersions: Record<string, number>;
  signature: string; // Stable hash for caching repairs
}

// ============================================================================
// RECOVERY RECIPE
// ============================================================================

export interface RecoveryRecipe {
  signature: string;
  humanLabel: string;
  ops: RecoveryOp[];
  stage: RecoveryStage;
  createdAt: number;
  appliedCount: number;
  notes: string;
}

export type RecoveryStage = 'A' | 'B' | 'C';

// ============================================================================
// INVARIANT RESULT
// ============================================================================

export interface InvariantViolation {
  path: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface InvariantResult {
  valid: boolean;
  violations: InvariantViolation[];
}

// ============================================================================
// MIGRATION REPORT
// ============================================================================

export interface MigrationReport {
  fromVersion: number;
  toVersion: number;
  appliedOpsCount: number;
  lossyOps: boolean;
  timing: number;
  timestamp: number;
}

// ============================================================================
// RECOVERY RESULT
// ============================================================================

export interface RecoveryResult {
  success: boolean;
  stage: RecoveryStage | null;
  appliedOps: RecoveryOp[];
  recipeUsed: string | null;
  preInvariantStatus: InvariantResult;
  postInvariantStatus: InvariantResult | null;
  diffSummary: DiffEntry[];
  errors: string[];
}

export interface DiffEntry {
  path: string;
  before: unknown;
  after: unknown;
  op: RecoveryOpType;
  reason: string;
}

// ============================================================================
// DRY RUN RESULT
// ============================================================================

export interface DryRunResult {
  wouldSucceed: boolean;
  proposedOps: RecoveryOp[];
  diffSummary: DiffEntry[];
  predictedViolations: InvariantViolation[];
  warnings: string[];
}

// ============================================================================
// RECOVERY MODE STATE
// ============================================================================

export interface RecoveryModeState {
  active: boolean;
  snapshot: FailureSnapshot | null;
  stageAResult: DryRunResult | null;
  stageBSuggestions: RecoverySuggestion[];
  stageCOptions: RecoverySuggestion[];
  selectedOps: RecoveryOp[];
  appliedResult: RecoveryResult | null;
}

export interface RecoverySuggestion {
  id: string;
  label: string;
  description: string;
  stage: RecoveryStage;
  ops: RecoveryOp[];
  isLossy: boolean;
  requiresConfirmation: boolean;
}

// ============================================================================
// RECIPE CACHE (Legacy - single tier)
// ============================================================================

export interface RecipeCache {
  engineVersion: string;
  recipes: Record<string, RecoveryRecipe>;
  lastUpdated: number;
}

// ============================================================================
// FIX PROPOSAL - Strict structured format
// AI/user suggestions MUST use this format or be rejected
// ============================================================================

export type ProposalRisk = 'low' | 'medium' | 'high';

export interface FixProposal {
  id: string;
  signature: string;               // Failure signature this fixes
  stage: RecoveryStage;            // A/B/C
  ops: RecoveryOp[];               // ALLOWLIST ONLY
  expectedOutcome: string[];       // Which invariants should pass after
  risk: ProposalRisk;
  reasoningSummary: string;        // 1-3 lines max, human readable
  createdAt: number;
  source: 'ai' | 'user' | 'system';
  sourceId?: string;               // User ID or AI session ID
}

// ============================================================================
// TWO-TIER STORAGE: Inbox vs Approved
// ============================================================================

export interface FixInbox {
  engineVersion: string;
  proposals: Record<string, FixProposal>;  // Keyed by proposal ID
  lastUpdated: number;
}

export interface ApprovedFixCache {
  engineVersion: string;
  recipes: Record<string, ApprovedRecipe>; // Keyed by signature
  lastUpdated: number;
}

export interface ApprovedRecipe extends RecoveryRecipe {
  // Extended scoring fields
  trustScore: number;              // 0-100
  successCount: number;            // Times applied successfully
  failureCount: number;            // Times rolled back or failed
  lossyOpsCount: number;           // How many lossy ops
  diffSize: number;                // How many paths changed
  generalizationCount: number;     // How many unique saves/users
  lastApplied: number;             // Timestamp
  approvalSource: 'auto' | 'user' | 'dev';
  gatesPassed: GateResult[];
}

// ============================================================================
// VERIFICATION GATES
// ============================================================================

export type GateId = 'A' | 'B' | 'C' | 'D' | 'E';

export interface GateResult {
  gate: GateId;
  passed: boolean;
  reason: string;
  timestamp: number;
}

export interface VerificationResult {
  allPassed: boolean;
  gateResults: GateResult[];
  canApprove: boolean;
  blockingGates: GateId[];
  warnings: string[];
}

// Gate A: Determinism + Allowlist
export interface GateAResult extends GateResult {
  gate: 'A';
  invalidOps: string[];
  hasNetworkCalls: boolean;
  hasArbitraryCode: boolean;
  hasUnprovenIdMapping: boolean;
}

// Gate B: Dry-run diff sanity
export interface GateBResult extends GateResult {
  gate: 'B';
  diffSummary: DiffEntry[];
  hasDestructiveOps: boolean;
  requiresStageCConfirmation: boolean;
}

// Gate C: Invariants pass
export interface GateCResult extends GateResult {
  gate: 'C';
  preBrokenCount: number;
  postBrokenCount: number;
  fixedPaths: string[];
  newlyBrokenPaths: string[];
}

// Gate D: Regression check (smoke tests)
export interface GateDResult extends GateResult {
  gate: 'D';
  testsRun: string[];
  testsPassed: string[];
  testsFailed: string[];
}

// Gate E: Generalization threshold
export interface GateEResult extends GateResult {
  gate: 'E';
  uniqueSavesSucceeded: number;
  uniqueUsersSucceeded: number;
  manuallyApproved: boolean;
  meetsThreshold: boolean;
}

// ============================================================================
// TRUST SCORING
// ============================================================================

export interface TrustScoreFactors {
  successRate: number;         // 0-1, weight: high
  stageBonus: number;          // A=20, B=10, C=0
  diffSizeBonus: number;       // Smaller = better
  lossyPenalty: number;        // Lossy ops reduce score
  rollbackPenalty: number;     // Any rollbacks reduce score
  newViolationPenalty: number; // Creating new issues is bad
  ageDecay: number;            // Older recipes slightly decay
}

export const TRUST_THRESHOLDS = {
  autoApply: 80,               // Above this: can auto-apply
  suggest: 50,                 // Above this: show as suggestion
  demote: 20,                  // Below this: demote to inbox
  remove: 5,                   // Below this: remove from cache
} as const;

// ============================================================================
// AI SUPPORT PACKET
// ============================================================================

export interface SupportPacket {
  id: string;
  timestamp: number;
  
  // Failure context
  failureSignature: string;
  brokenPaths: string[];
  errorCode: string;
  errorMessage: string;
  
  // Migration context
  lastMigrationReport: MigrationReport | null;
  saveVersion: number;
  subsystemVersions: Record<string, number>;
  
  // Schema excerpt (minimal, not full save)
  schemaExcerpt: SchemaExcerpt;
  
  // Optional full save (only if user opts in)
  includeFullSave: boolean;
  fullSave?: string;
}

export interface SchemaExcerpt {
  hasPlayer: boolean;
  hasNeeds: boolean;
  hasRelationships: boolean;
  hasKnowledge: boolean;
  hasInventory: boolean;
  hasNarrativeHistory: boolean;
  hasEventHistory: boolean;
  hasCheckpoints: boolean;
  
  // Sizes (for context)
  narrativeHistoryLength: number;
  eventHistoryLength: number;
  relationshipEdgesCount: number;
  inventoryCount: number;
}

// ============================================================================
// PROOF MODE - Show verification details
// ============================================================================

export interface ProofDisplay {
  fixedInvariants: string[];     // ✅ which invariants it fixes
  changedPaths: string[];        // ⚠️ what it changes
  seenBefore: boolean;           // 🔁 whether it's seen before
  trustScore: number;            // ⭐ trustScore
  gateResults: GateResult[];     // Gate verification results
  risk: ProposalRisk;
  isAutoApplyable: boolean;
}

// ============================================================================
// RECOVERY PIPELINE CONFIG (Extended)
// ============================================================================

export interface RecoveryPipelineConfig {
  enableAutoStageA: boolean;
  enableRecipeCache: boolean;
  enableTwoTierCache: boolean;
  enableTrustScoring: boolean;
  enableProofMode: boolean;
  maxBackupSize: number;
  telemetryEnabled: boolean;
  trustAutoApplyThreshold: number;
  generalizationThreshold: number;
}

export const DEFAULT_RECOVERY_CONFIG: RecoveryPipelineConfig = {
  enableAutoStageA: true,
  enableRecipeCache: true,
  enableTwoTierCache: true,
  enableTrustScoring: true,
  enableProofMode: true,
  maxBackupSize: 5 * 1024 * 1024,
  telemetryEnabled: true,
  trustAutoApplyThreshold: TRUST_THRESHOLDS.autoApply,
  generalizationThreshold: 2,
};
