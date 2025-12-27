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
  // New types for filtered fix cache
  FixProposal,
  FixInbox,
  ApprovedFixCache,
  ApprovedRecipe,
  VerificationResult,
  GateResult,
  ProofDisplay,
  SupportPacket,
  TrustScoreFactors,
} from './types';

export { DEFAULT_RECOVERY_CONFIG, TRUST_THRESHOLDS } from './types';

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

// Recipe Cache (legacy)
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

// Two-Tier Cache (new filtered system)
export {
  addToInbox,
  getFromInbox,
  getInboxProposalsForSignature,
  removeFromInbox,
  clearInbox,
  getApprovedRecipe,
  getAllApprovedRecipes,
  promoteToApproved,
  recordRecipeApplication,
  findAutoApplyableRecipe,
  generateProofDisplay,
  getTwoTierCacheStats,
} from './twoTierCache';

// Verification Gates
export {
  runGateA,
  runGateB,
  runGateC,
  runGateD,
  runGateE,
  verifyProposal,
  recordSuccessfulApplication,
  markManuallyApproved,
} from './verificationGates';

// Trust Scoring
export {
  calculateTrustScore,
  canAutoApply,
  shouldSuggest,
  shouldDemote,
  getTrustLabel,
  getTrustColor,
  formatTrustFactors,
} from './trustScoring';

// Support Packet
export {
  generateSupportPacket,
  generatePromptContext,
  parseAIProposal,
  createManualProposal,
  createSystemProposal,
} from './supportPacket';
