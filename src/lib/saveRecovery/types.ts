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
// RECIPE CACHE
// ============================================================================

export interface RecipeCache {
  engineVersion: string;
  recipes: Record<string, RecoveryRecipe>;
  lastUpdated: number;
}

// ============================================================================
// RECOVERY PIPELINE CONFIG
// ============================================================================

export interface RecoveryPipelineConfig {
  enableAutoStageA: boolean;
  enableRecipeCache: boolean;
  maxBackupSize: number; // bytes
  telemetryEnabled: boolean;
}

export const DEFAULT_RECOVERY_CONFIG: RecoveryPipelineConfig = {
  enableAutoStageA: true,
  enableRecipeCache: true,
  maxBackupSize: 5 * 1024 * 1024, // 5MB
  telemetryEnabled: true,
};
