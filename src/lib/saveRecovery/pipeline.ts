// ============================================================================
// RECOVERY PIPELINE
// Main orchestration for the save recovery system
// ============================================================================

import {
  FailureSnapshot,
  RecoveryResult,
  RecoveryModeState,
  RecoveryOp,
  MigrationReport,
  InvariantResult,
  DryRunResult,
  RecoverySuggestion,
  DEFAULT_RECOVERY_CONFIG,
  RecoveryPipelineConfig,
} from './types';
import { generateFailureSignature, signatureFromViolations } from './signature';
import { runInvariants, runCriticalInvariants, summarizeViolations } from './invariants';
import { executeOps, dryRunOps } from './operations';
import { generateStageAOps, dryRunStageA, generateStageBSuggestions, generateStageCOptions } from './stages';
import { findRecipe, storeRecipe, createRecipe, incrementRecipeUsage, isAutoApplyable, validateRecipeOps } from './recipeCache';
import { validateMinimalShape, CURRENT_SAVE_VERSION, SUBSYSTEM_VERSIONS, ENGINE_VERSION } from '../saveSystem';

// ============================================================================
// BACKUP MANAGEMENT
// ============================================================================

const RECOVERY_BACKUP_KEY = 'untold-recovery-backup';
let inMemoryBackup: string | null = null;

/**
 * Create backup before any recovery operations
 */
export function createRecoveryBackup(save: unknown): void {
  try {
    const backup = JSON.stringify(save);
    inMemoryBackup = backup;
    
    // Also store in localStorage for persistence
    localStorage.setItem(RECOVERY_BACKUP_KEY, backup);
    console.log('[Recovery] Backup created');
  } catch (e) {
    console.error('[Recovery] Failed to create backup:', e);
  }
}

/**
 * Restore from backup
 */
export function restoreFromBackup(): unknown | null {
  try {
    // Prefer localStorage backup
    const stored = localStorage.getItem(RECOVERY_BACKUP_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Fall back to in-memory
    if (inMemoryBackup) {
      return JSON.parse(inMemoryBackup);
    }
  } catch (e) {
    console.error('[Recovery] Failed to restore backup:', e);
  }
  
  return null;
}

/**
 * Clear backup after successful recovery
 */
export function clearRecoveryBackup(): void {
  inMemoryBackup = null;
  localStorage.removeItem(RECOVERY_BACKUP_KEY);
}

// ============================================================================
// FAILURE SNAPSHOT CREATION
// ============================================================================

/**
 * Create a failure snapshot for recovery mode
 */
export function createFailureSnapshot(
  campaignId: string,
  save: unknown,
  errorCode: string,
  errorMessage: string,
  violations: InvariantResult
): FailureSnapshot {
  const brokenPaths = violations.violations.map(v => `${v.path}: ${v.message}`);
  const saveVersion = (save as Record<string, unknown>)?.saveVersion as number || 1;
  const subsystemVersions = (save as Record<string, unknown>)?.subsystemVersions as Record<string, number> || {};
  
  const signature = generateFailureSignature(
    errorCode,
    brokenPaths,
    saveVersion,
    subsystemVersions
  );
  
  return {
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    timestamp: Date.now(),
    originalSave: JSON.stringify(save),
    errorCode,
    errorMessage,
    brokenPaths,
    saveVersion,
    subsystemVersions,
    signature,
  };
}

// ============================================================================
// MAIN RECOVERY PIPELINE
// ============================================================================

export interface PipelineResult {
  success: boolean;
  save: unknown | null;
  needsRecovery: boolean;
  snapshot: FailureSnapshot | null;
  migrationReport: MigrationReport | null;
  invariantResult: InvariantResult;
  errors: string[];
  warnings: string[];
}

/**
 * Process a raw save through the complete pipeline
 * 
 * Pipeline stages:
 * 1. validateMinimalShape
 * 2. backupSave
 * 3. migrateSave (already in saveSystem)
 * 4. normalizeSave (already in saveSystem)
 * 5. runInvariants
 * 6. if brokenPaths not empty -> Recovery Mode
 * 7. if clean -> ready to load
 */
export function runRecoveryPipeline(
  rawSave: unknown,
  campaignId: string,
  config: RecoveryPipelineConfig = DEFAULT_RECOVERY_CONFIG
): PipelineResult {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Step 1: Validate minimal shape
  const validation = validateMinimalShape(rawSave);
  if (!validation.valid) {
    return {
      success: false,
      save: null,
      needsRecovery: true,
      snapshot: createFailureSnapshot(
        campaignId,
        rawSave,
        'VALIDATION_FAILED',
        validation.errors.join('; '),
        { valid: false, violations: validation.errors.map(e => ({
          path: '/',
          code: 'VALIDATION',
          message: e,
          severity: 'error' as const,
        }))}
      ),
      migrationReport: null,
      invariantResult: { valid: false, violations: [] },
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
  warnings.push(...validation.warnings);
  
  // Step 2: Create backup
  createRecoveryBackup(rawSave);
  
  // Step 3 & 4: Migration and normalization happen in saveSystem.processSaveForLoading
  // We assume the save has already been through that pipeline
  
  // Step 5: Run invariants
  const invariantResult = runInvariants(rawSave);
  
  if (!invariantResult.valid) {
    // Step 6: Recovery Mode needed
    const snapshot = createFailureSnapshot(
      campaignId,
      rawSave,
      'INVARIANT_VIOLATION',
      `${invariantResult.violations.length} invariant(s) violated`,
      invariantResult
    );
    
    // Check for cached recipe
    const cachedRecipe = findRecipe(snapshot.signature);
    
    if (cachedRecipe && config.enableRecipeCache && isAutoApplyable(cachedRecipe)) {
      // Try to apply cached recipe as dry-run first
      const { result, diffs, errors: opErrors } = dryRunOps(rawSave, cachedRecipe.ops);
      
      if (result) {
        const postInvariants = runInvariants(result);
        
        if (postInvariants.valid) {
          // Cached recipe works! Apply it
          console.log(`[Recovery] Applying cached recipe: ${cachedRecipe.humanLabel}`);
          const applyResult = executeOps(rawSave, cachedRecipe.ops);
          incrementRecipeUsage(snapshot.signature);
          
          return {
            success: true,
            save: rawSave,
            needsRecovery: false,
            snapshot: null,
            migrationReport: {
              fromVersion: snapshot.saveVersion,
              toVersion: CURRENT_SAVE_VERSION,
              appliedOpsCount: cachedRecipe.ops.length,
              lossyOps: cachedRecipe.stage !== 'A',
              timing: Date.now() - startTime,
              timestamp: Date.now(),
            },
            invariantResult: postInvariants,
            errors: [],
            warnings: [`Applied cached recipe: ${cachedRecipe.humanLabel}`],
          };
        }
      }
      
      // Cached recipe didn't work, fall through to recovery mode
      warnings.push('Cached recipe failed dry-run, entering recovery mode');
    }
    
    // Try Stage A auto-repair if enabled
    if (config.enableAutoStageA) {
      const stageADryRun = dryRunStageA(rawSave, invariantResult.violations);
      
      if (stageADryRun.wouldSucceed) {
        // Stage A would fix it - apply automatically
        console.log('[Recovery] Applying Stage A auto-repair');
        const { diffs, errors: opErrors } = executeOps(rawSave, stageADryRun.proposedOps);
        
        // Cache this as a recipe for future
        if (config.enableRecipeCache && stageADryRun.proposedOps.length > 0) {
          const recipe = createRecipe(
            snapshot.signature,
            'Auto-repair (Stage A)',
            stageADryRun.proposedOps,
            'A',
            'Automatically generated from Stage A repair'
          );
          storeRecipe(recipe);
        }
        
        const finalInvariants = runInvariants(rawSave);
        
        return {
          success: finalInvariants.valid,
          save: rawSave,
          needsRecovery: !finalInvariants.valid,
          snapshot: finalInvariants.valid ? null : snapshot,
          migrationReport: {
            fromVersion: snapshot.saveVersion,
            toVersion: CURRENT_SAVE_VERSION,
            appliedOpsCount: stageADryRun.proposedOps.length,
            lossyOps: false,
            timing: Date.now() - startTime,
            timestamp: Date.now(),
          },
          invariantResult: finalInvariants,
          errors: opErrors,
          warnings: ['Applied Stage A auto-repair'],
        };
      }
    }
    
    // Needs manual recovery
    return {
      success: false,
      save: rawSave,
      needsRecovery: true,
      snapshot,
      migrationReport: null,
      invariantResult,
      errors: summarizeViolations(invariantResult),
      warnings,
    };
  }
  
  // Step 7: Clean! Ready to load
  clearRecoveryBackup();
  
  return {
    success: true,
    save: rawSave,
    needsRecovery: false,
    snapshot: null,
    migrationReport: {
      fromVersion: (rawSave as Record<string, unknown>)?.saveVersion as number || 1,
      toVersion: CURRENT_SAVE_VERSION,
      appliedOpsCount: 0,
      lossyOps: false,
      timing: Date.now() - startTime,
      timestamp: Date.now(),
    },
    invariantResult,
    errors: [],
    warnings,
  };
}

// ============================================================================
// RECOVERY MODE STATE MANAGEMENT
// ============================================================================

/**
 * Initialize recovery mode state from a failure snapshot
 */
export function initializeRecoveryMode(snapshot: FailureSnapshot): RecoveryModeState {
  const save = JSON.parse(snapshot.originalSave);
  const violations = runInvariants(save).violations;
  
  return {
    active: true,
    snapshot,
    stageAResult: dryRunStageA(save, violations),
    stageBSuggestions: generateStageBSuggestions(save, violations),
    stageCOptions: generateStageCOptions(save, violations),
    selectedOps: [],
    appliedResult: null,
  };
}

/**
 * Apply selected recovery operations
 */
export function applyRecoveryOps(
  snapshot: FailureSnapshot,
  ops: RecoveryOp[],
  stageLabel: string
): RecoveryResult {
  const save = JSON.parse(snapshot.originalSave);
  
  // Get pre-recovery invariants
  const preInvariants = runInvariants(save);
  
  // Create backup
  createRecoveryBackup(save);
  
  // Apply operations
  const { success, diffs, errors } = executeOps(save, ops);
  
  // Check post-recovery invariants
  const postInvariants = success ? runInvariants(save) : null;
  
  // Cache as recipe if successful
  if (success && postInvariants?.valid) {
    const stage = ops.some(op => op.reason.includes('Emergency')) ? 'C' : 
                  ops.some(op => op.reason.includes('Remove') || op.reason.includes('Restore')) ? 'B' : 'A';
    
    const recipe = createRecipe(
      snapshot.signature,
      stageLabel,
      ops,
      stage,
      `Applied at ${new Date().toISOString()}`
    );
    storeRecipe(recipe);
  }
  
  return {
    success: success && (postInvariants?.valid ?? false),
    stage: ops.some(op => op.reason.includes('Emergency')) ? 'C' : 
           ops.some(op => op.reason.includes('Remove') || op.reason.includes('Restore')) ? 'B' : 'A',
    appliedOps: ops,
    recipeUsed: null,
    preInvariantStatus: preInvariants,
    postInvariantStatus: postInvariants,
    diffSummary: diffs,
    errors,
  };
}

/**
 * Export failure snapshot for bug reporting
 */
export function exportFailureReport(snapshot: FailureSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    exportedAt: Date.now(),
    engineVersion: ENGINE_VERSION,
    currentSaveVersion: CURRENT_SAVE_VERSION,
    subsystemVersions: SUBSYSTEM_VERSIONS,
  }, null, 2);
}

// ============================================================================
// TELEMETRY / LOGGING
// ============================================================================

export interface RecoveryLogEntry {
  timestamp: number;
  signature: string;
  campaignId: string;
  action: 'auto-repair' | 'manual-repair' | 'salvage' | 'export' | 'abort';
  opsApplied: number;
  success: boolean;
  lossyOps: boolean;
}

const RECOVERY_LOG_KEY = 'untold-recovery-log';
const MAX_LOG_ENTRIES = 100;

/**
 * Log a recovery action
 */
export function logRecoveryAction(entry: RecoveryLogEntry): void {
  try {
    const stored = localStorage.getItem(RECOVERY_LOG_KEY);
    const log: RecoveryLogEntry[] = stored ? JSON.parse(stored) : [];
    
    log.unshift(entry);
    
    // Keep only recent entries
    if (log.length > MAX_LOG_ENTRIES) {
      log.length = MAX_LOG_ENTRIES;
    }
    
    localStorage.setItem(RECOVERY_LOG_KEY, JSON.stringify(log));
  } catch (e) {
    console.error('[Recovery] Failed to log action:', e);
  }
}

/**
 * Get recovery history
 */
export function getRecoveryLog(): RecoveryLogEntry[] {
  try {
    const stored = localStorage.getItem(RECOVERY_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
