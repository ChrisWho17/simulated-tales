// ============================================================================
// SAVE RECOVERY SYSTEM - Public API
// Deterministic, auditable, safe recovery for campaign saves
// ============================================================================

// Types
export type {
  RecoveryOp,
  RecoveryOpType,
  BuiltInPredicateId,
  BuiltInMapperId,
  CoercionTarget,
  FailureSnapshot,
  RecoveryRecipe,
  RecoveryStage,
  InvariantViolation,
  InvariantResult,
  MigrationReport,
  RecoveryResult,
  DiffEntry,
  DryRunResult,
  RecoveryModeState,
  RecoverySuggestion,
  RecipeCache,
  RecoveryPipelineConfig,
} from './types';

export { DEFAULT_RECOVERY_CONFIG } from './types';

// Signature
export {
  generateFailureSignature,
  signatureFromSnapshot,
  signatureFromViolations,
  normalizePath,
  signaturesMatch,
} from './signature';

// Operations
export {
  getAtPath,
  setAtPath,
  deleteAtPath,
  executeOp,
  executeOps,
  dryRunOps,
} from './operations';

// Invariants
export {
  runInvariants,
  runCriticalInvariants,
  summarizeViolations,
} from './invariants';

// Stages
export {
  generateStageAOps,
  dryRunStageA,
  generateStageBSuggestions,
  generateStageCOptions,
} from './stages';

// Recipe Cache
export {
  findRecipe,
  storeRecipe,
  createRecipe,
  deleteRecipe,
  clearRecipeCache,
  getAllRecipes,
  getRecipeCacheStats,
  validateRecipeOps,
  isAutoApplyable,
  incrementRecipeUsage,
} from './recipeCache';

// Pipeline
export {
  runRecoveryPipeline,
  createFailureSnapshot,
  createRecoveryBackup,
  restoreFromBackup,
  clearRecoveryBackup,
  initializeRecoveryMode,
  applyRecoveryOps,
  exportFailureReport,
  logRecoveryAction,
  getRecoveryLog,
} from './pipeline';
export type { PipelineResult, RecoveryLogEntry } from './pipeline';
