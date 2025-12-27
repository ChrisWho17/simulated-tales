// ============================================================================
// STAGED RECOVERY - Safe Auto-Repair, Assisted Repair, Lossy Salvage
// ============================================================================

import {
  RecoveryOp,
  RecoverySuggestion,
  InvariantViolation,
  DryRunResult,
} from './types';
import { getAtPath, dryRunOps } from './operations';
import { runInvariants } from './invariants';

// ============================================================================
// STAGE A: SAFE AUTO-REPAIR (no confirmation needed)
// ============================================================================

/**
 * Generate Stage A repair operations
 * These are safe, deterministic repairs that don't lose data
 */
export function generateStageAOps(
  save: unknown,
  violations: InvariantViolation[]
): RecoveryOp[] {
  const ops: RecoveryOp[] = [];
  const gameData = getAtPath(save, '/gameData') as Record<string, unknown> | undefined;
  
  // ====== Ensure required arrays exist ======
  const requiredArrays = [
    { path: '/gameData/chapters', default: [] },
    { path: '/gameData/narrativeHistory', default: [] },
    { path: '/gameData/checkpoints', default: [] },
    { path: '/gameData/eventHistory', default: [] },
    { path: '/gameData/inventory', default: [] },
    { path: '/gameData/anchoredFacts', default: [] },
    { path: '/gameData/factHistory', default: [] },
  ];
  
  for (const { path, default: defaultVal } of requiredArrays) {
    const current = getAtPath(save, path);
    if (current === undefined || current === null) {
      ops.push({
        type: 'ensureDefault',
        path,
        defaultValue: defaultVal,
        reason: `Ensure ${path.split('/').pop()} array exists`,
      });
    }
  }
  
  // ====== Ensure required objects exist ======
  const requiredObjects = [
    { path: '/gameData', default: {} },
    { 
      path: '/gameData/needs', 
      default: {
        physical: { hunger: 80, thirst: 80, energy: 80, bladder: 20, hygiene: 80, health: 100 },
        psychological: { stress: 20, tension: 20, comfort: 80, social: 70, fulfillment: 60 },
      }
    },
    { path: '/gameData/factionRep', default: {} },
    { path: '/gameData/relationships', default: { edges: [], nodes: {} } },
  ];
  
  for (const { path, default: defaultVal } of requiredObjects) {
    const current = getAtPath(save, path);
    if (current === undefined || current === null) {
      ops.push({
        type: 'ensureDefault',
        path,
        defaultValue: defaultVal,
        reason: `Ensure ${path.split('/').pop()} object exists with defaults`,
      });
    }
  }
  
  // ====== Coerce obvious numeric fields stored as strings ======
  const numericPaths = [
    '/saveVersion',
    '/timestamp',
    '/slotNumber',
    '/gameData/player/hp',
    '/gameData/player/maxHp',
    '/gameData/player/level',
    '/gameData/escalationTier',
    '/gameData/currentTick',
  ];
  
  for (const path of numericPaths) {
    const value = getAtPath(save, path);
    if (typeof value === 'string') {
      const num = Number(value);
      if (!isNaN(num)) {
        ops.push({
          type: 'coerce',
          path,
          targetType: 'number',
          reason: `Convert ${path.split('/').pop()} from string to number`,
        });
      }
    }
  }
  
  // ====== Remove nulls from arrays where null is invalid ======
  const arraysToFilter = [
    '/gameData/narrativeHistory',
    '/gameData/inventory',
    '/gameData/eventHistory',
    '/gameData/checkpoints',
  ];
  
  for (const path of arraysToFilter) {
    const arr = getAtPath(save, path);
    if (Array.isArray(arr) && arr.some(item => item === null || item === undefined)) {
      ops.push({
        type: 'filterArray',
        path,
        predicateId: 'removeNulls',
        reason: `Remove null entries from ${path.split('/').pop()}`,
      });
    }
  }
  
  // ====== Ensure needs exist with defaults ======
  if (gameData) {
    const needs = gameData.needs as Record<string, unknown> | undefined;
    if (needs) {
      // Clamp out-of-range needs
      const physical = needs.physical as Record<string, unknown> | undefined;
      if (physical) {
        for (const [key, value] of Object.entries(physical)) {
          if (typeof value === 'number' && (isNaN(value) || value < 0 || value > 100)) {
            const clamped = isNaN(value) ? 50 : Math.max(0, Math.min(100, value));
            ops.push({
              type: 'set',
              path: `/gameData/needs/physical/${key}`,
              value: clamped,
              reason: `Clamp ${key} to valid range (was ${value})`,
            });
          }
        }
      }
    }
  }
  
  // ====== Cap event ledger size if it violates hard limit ======
  const MAX_EVENTS = 500;
  const events = getAtPath(save, '/gameData/eventHistory') as unknown[] | undefined;
  if (Array.isArray(events) && events.length > MAX_EVENTS * 1.5) {
    ops.push({
      type: 'truncate',
      path: '/gameData/eventHistory',
      maxLength: MAX_EVENTS,
      reason: `Cap event ledger to ${MAX_EVENTS} entries (was ${events.length})`,
    });
  }
  
  // ====== Ensure lastNeedTickTs exists ======
  if (gameData && gameData.lastNeedTickTs === undefined) {
    const timestamp = getAtPath(save, '/timestamp') as number || Date.now();
    ops.push({
      type: 'ensureDefault',
      path: '/gameData/lastNeedTickTs',
      defaultValue: timestamp,
      reason: 'Add lastNeedTickTs to prevent needs explosion on time jump',
    });
  }
  
  // ====== Add event IDs if missing ======
  if (Array.isArray(events) && events.some(e => typeof e === 'object' && e && !(e as Record<string, unknown>).eventId)) {
    ops.push({
      type: 'mapArray',
      path: '/gameData/eventHistory',
      mapperId: 'ensureEventId',
      reason: 'Ensure all events have unique IDs',
    });
  }
  
  return ops;
}

/**
 * Execute Stage A with dry-run preview
 */
export function dryRunStageA(save: unknown, violations: InvariantViolation[]): DryRunResult {
  const ops = generateStageAOps(save, violations);
  const { result, diffs, errors } = dryRunOps(save, ops);
  
  const predictedViolations = result ? runInvariants(result).violations : [];
  
  return {
    wouldSucceed: result !== null && predictedViolations.filter(v => v.severity === 'error').length === 0,
    proposedOps: ops,
    diffSummary: diffs,
    predictedViolations,
    warnings: errors,
  };
}

// ============================================================================
// STAGE B: ASSISTED REPAIR (requires confirmation)
// ============================================================================

/**
 * Generate Stage B repair suggestions
 * These require user confirmation because they modify canonical data
 */
export function generateStageBSuggestions(
  save: unknown,
  violations: InvariantViolation[]
): RecoverySuggestion[] {
  const suggestions: RecoverySuggestion[] = [];
  const gameData = getAtPath(save, '/gameData') as Record<string, unknown> | undefined;
  
  // ====== Drop orphan relationship edges ======
  const orphanViolations = violations.filter(v => v.code === 'ORPHAN_REFERENCE');
  if (orphanViolations.length > 0) {
    suggestions.push({
      id: 'remove-orphan-edges',
      label: 'Remove Orphan Relationships',
      description: `Remove ${orphanViolations.length} relationship edge(s) that reference missing characters`,
      stage: 'B',
      ops: [{
        type: 'filterArray',
        path: '/gameData/relationships/edges',
        predicateId: 'removeOrphanEdges',
        reason: `Remove ${orphanViolations.length} edges referencing deleted/missing characters`,
      }],
      isLossy: false,
      requiresConfirmation: true,
    });
  }
  
  // ====== Remap legacy fields if they exist ======
  if (gameData) {
    // Legacy npcMemory -> unified relationships
    if (gameData.npcMemory && gameData._relationshipsNeedUnification) {
      suggestions.push({
        id: 'migrate-npc-memory',
        label: 'Migrate Legacy NPC Memory',
        description: 'Convert old npcMemory format to unified relationship store',
        stage: 'B',
        ops: [
          {
            type: 'delete',
            path: '/gameData/_relationshipsNeedUnification',
            reason: 'Clear migration flag after processing',
          },
        ],
        isLossy: false,
        requiresConfirmation: true,
      });
    }
    
    // Legacy knowledge object -> tuple array
    const knowledge = gameData.knowledge;
    if (knowledge && typeof knowledge === 'object' && !Array.isArray(knowledge)) {
      const tuples = Object.entries(knowledge).map(([k, v]) => [k, v]);
      suggestions.push({
        id: 'migrate-knowledge-format',
        label: 'Migrate Knowledge Format',
        description: 'Convert legacy knowledge object to array format',
        stage: 'B',
        ops: [{
          type: 'set',
          path: '/gameData/knowledge',
          value: tuples,
          reason: 'Convert knowledge from object to tuple array format',
        }],
        isLossy: false,
        requiresConfirmation: true,
      });
    }
  }
  
  // ====== Trim narrative history if corrupt ======
  const narrativeViolations = violations.filter(v => 
    v.path.startsWith('/gameData/narrativeHistory') && v.severity === 'error'
  );
  if (narrativeViolations.length > 0) {
    // Find last valid checkpoint
    const checkpoints = getAtPath(save, '/gameData/checkpoints') as unknown[] | undefined;
    if (Array.isArray(checkpoints) && checkpoints.length > 0) {
      const lastCheckpoint = checkpoints[0] as Record<string, unknown>;
      const checkpointHistory = lastCheckpoint.narrativeHistory as unknown[] | undefined;
      
      if (Array.isArray(checkpointHistory)) {
        suggestions.push({
          id: 'restore-narrative-from-checkpoint',
          label: 'Restore Narrative from Checkpoint',
          description: `Restore narrative history from last checkpoint (${checkpointHistory.length} entries)`,
          stage: 'B',
          ops: [{
            type: 'set',
            path: '/gameData/narrativeHistory',
            value: checkpointHistory,
            reason: 'Restore narrative from last valid checkpoint due to corruption',
          }],
          isLossy: true,
          requiresConfirmation: true,
        });
      }
    }
  }
  
  // ====== Fix invalid inventory items ======
  const inventoryViolations = violations.filter(v => 
    v.path.startsWith('/gameData/inventory') && v.severity === 'error'
  );
  if (inventoryViolations.length > 0) {
    suggestions.push({
      id: 'filter-invalid-inventory',
      label: 'Remove Invalid Inventory Items',
      description: `Remove ${inventoryViolations.length} invalid item(s) from inventory`,
      stage: 'B',
      ops: [{
        type: 'filterArray',
        path: '/gameData/inventory',
        predicateId: 'removeInvalidIds',
        reason: 'Remove items without valid IDs',
      }],
      isLossy: true,
      requiresConfirmation: true,
    });
  }
  
  return suggestions;
}

// ============================================================================
// STAGE C: LOSSY SALVAGE (explicit confirmation required)
// ============================================================================

/**
 * Generate Stage C salvage options
 * These are last-resort operations that will lose significant data
 */
export function generateStageCOptions(
  save: unknown,
  violations: InvariantViolation[]
): RecoverySuggestion[] {
  const options: RecoverySuggestion[] = [];
  
  // ====== Reset relationships to defaults ======
  const relationshipViolations = violations.filter(v => 
    v.path.includes('relationships') && v.severity === 'error'
  );
  if (relationshipViolations.length > 2) {
    options.push({
      id: 'reset-relationships',
      label: '⚠️ Reset All Relationships',
      description: 'Delete all relationship data and start fresh. THIS CANNOT BE UNDONE.',
      stage: 'C',
      ops: [{
        type: 'set',
        path: '/gameData/relationships',
        value: { edges: [], nodes: {} },
        reason: 'Reset relationships to defaults due to severe corruption',
      }],
      isLossy: true,
      requiresConfirmation: true,
    });
  }
  
  // ====== Reset knowledge to defaults ======
  const knowledgeViolations = violations.filter(v => 
    v.path.includes('knowledge') && v.severity === 'error'
  );
  if (knowledgeViolations.length > 0) {
    options.push({
      id: 'reset-knowledge',
      label: '⚠️ Reset All Knowledge',
      description: 'Delete all discovered knowledge and facts. THIS CANNOT BE UNDONE.',
      stage: 'C',
      ops: [
        {
          type: 'set',
          path: '/gameData/knowledge',
          value: [],
          reason: 'Reset knowledge due to corruption',
        },
        {
          type: 'set',
          path: '/gameData/anchoredFacts',
          value: [],
          reason: 'Reset anchored facts along with knowledge',
        },
      ],
      isLossy: true,
      requiresConfirmation: true,
    });
  }
  
  // ====== Truncate narrative history aggressively ======
  const history = getAtPath(save, '/gameData/narrativeHistory') as unknown[] | undefined;
  if (Array.isArray(history) && history.length > 20) {
    options.push({
      id: 'truncate-narrative',
      label: '⚠️ Truncate Story History',
      description: `Keep only the last 10 story entries (currently ${history.length}). Earlier story will be lost.`,
      stage: 'C',
      ops: [{
        type: 'truncate',
        path: '/gameData/narrativeHistory',
        maxLength: 10,
        reason: 'Aggressive truncation to recover from corruption',
      }],
      isLossy: true,
      requiresConfirmation: true,
    });
  }
  
  // ====== Drop all checkpoints ======
  const checkpointViolations = violations.filter(v => 
    v.path.includes('checkpoints') && v.severity === 'error'
  );
  if (checkpointViolations.length > 0) {
    options.push({
      id: 'reset-checkpoints',
      label: '⚠️ Delete All Checkpoints',
      description: 'Remove all save checkpoints. You will lose restore points.',
      stage: 'C',
      ops: [{
        type: 'set',
        path: '/gameData/checkpoints',
        value: [],
        reason: 'Reset checkpoints due to corruption',
      }],
      isLossy: true,
      requiresConfirmation: true,
    });
  }
  
  // ====== Full reset to minimal viable state ======
  options.push({
    id: 'minimal-salvage',
    label: '🚨 EMERGENCY: Minimal Salvage',
    description: 'Keep only character name and basic stats. All story progress will be lost.',
    stage: 'C',
    ops: [
      {
        type: 'set',
        path: '/gameData/narrativeHistory',
        value: [],
        reason: 'Emergency reset - clear narrative',
      },
      {
        type: 'set',
        path: '/gameData/relationships',
        value: { edges: [], nodes: {} },
        reason: 'Emergency reset - clear relationships',
      },
      {
        type: 'set',
        path: '/gameData/knowledge',
        value: [],
        reason: 'Emergency reset - clear knowledge',
      },
      {
        type: 'set',
        path: '/gameData/eventHistory',
        value: [],
        reason: 'Emergency reset - clear events',
      },
      {
        type: 'set',
        path: '/gameData/checkpoints',
        value: [],
        reason: 'Emergency reset - clear checkpoints',
      },
    ],
    isLossy: true,
    requiresConfirmation: true,
  });
  
  return options;
}
