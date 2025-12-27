// ============================================================================
// RECOVERY OPERATIONS ENGINE
// Implements the allowlisted operations with dry-run and apply modes
// ============================================================================

import {
  RecoveryOp,
  SetOp,
  DeleteOp,
  RenameOp,
  CoerceOp,
  TruncateOp,
  FilterArrayOp,
  MapArrayOp,
  EnsureDefaultOp,
  RebuildIndexOp,
  BuiltInPredicateId,
  BuiltInMapperId,
  DiffEntry,
  CoercionTarget,
} from './types';
import { normalizePath } from './signature';

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Get value at JSON pointer path
 */
export function getAtPath(obj: unknown, path: string): unknown {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/**
 * Set value at JSON pointer path (mutates object)
 */
export function setAtPath(obj: unknown, path: string, value: unknown): boolean {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  
  if (parts.length === 0) return false;
  
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current === null || current === undefined) return false;
    if (typeof current !== 'object') return false;
    
    const next = (current as Record<string, unknown>)[part];
    if (next === undefined) {
      // Create intermediate object/array
      const nextPart = parts[i + 1];
      const isArrayIndex = /^\\d+$/.test(nextPart);
      (current as Record<string, unknown>)[part] = isArrayIndex ? [] : {};
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  if (current === null || typeof current !== 'object') return false;
  (current as Record<string, unknown>)[parts[parts.length - 1]] = value;
  return true;
}

/**
 * Delete value at JSON pointer path (mutates object)
 */
export function deleteAtPath(obj: unknown, path: string): boolean {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  
  if (parts.length === 0) return false;
  
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current === null || current === undefined) return false;
    if (typeof current !== 'object') return false;
    current = (current as Record<string, unknown>)[part];
  }
  
  if (current === null || typeof current !== 'object') return false;
  
  const lastPart = parts[parts.length - 1];
  if (Array.isArray(current)) {
    const index = parseInt(lastPart, 10);
    if (!isNaN(index)) {
      current.splice(index, 1);
      return true;
    }
  }
  
  delete (current as Record<string, unknown>)[lastPart];
  return true;
}

// ============================================================================
// BUILT-IN PREDICATES (for filterArray)
// ============================================================================

const PREDICATES: Record<BuiltInPredicateId, (item: unknown, index?: number, arr?: unknown[]) => boolean> = {
  removeNulls: (item) => item !== null,
  removeUndefined: (item) => item !== undefined,
  removeEmptyStrings: (item) => item !== '',
  removeInvalidIds: (item) => {
    if (typeof item !== 'object' || item === null) return true;
    const id = (item as Record<string, unknown>).id;
    return typeof id === 'string' && id.length > 0;
  },
  removeOrphanEdges: (item) => {
    if (typeof item !== 'object' || item === null) return true;
    const edge = item as Record<string, unknown>;
    return typeof edge.from === 'string' && typeof edge.to === 'string';
  },
  removeDuplicates: (item, index, arr) => {
    if (index === undefined || !arr) return true;
    const key = JSON.stringify(item);
    return arr.findIndex(x => JSON.stringify(x) === key) === index;
  },
};

// Extend filter to pass index and array
function filterWithPredicate(arr: unknown[], predicateId: BuiltInPredicateId): unknown[] {
  const pred = PREDICATES[predicateId];
  if (!pred) return arr;
  return arr.filter((item, index, array) => pred(item, index, array));
}

// ============================================================================
// BUILT-IN MAPPERS (for mapArray)
// ============================================================================

const MAPPERS: Record<BuiltInMapperId, (item: unknown, index: number) => unknown> = {
  ensureEventId: (item, index) => {
    if (typeof item !== 'object' || item === null) return item;
    const obj = { ...item as Record<string, unknown> };
    if (!obj.eventId) {
      obj.eventId = `evt_${Date.now()}_${index}`;
    }
    return obj;
  },
  ensureTimestamp: (item) => {
    if (typeof item !== 'object' || item === null) return item;
    const obj = { ...item as Record<string, unknown> };
    if (!obj.ts && !obj.timestamp) {
      obj.ts = Date.now();
    }
    return obj;
  },
  normalizeCharacterId: (item) => {
    if (typeof item !== 'object' || item === null) return item;
    const obj = { ...item as Record<string, unknown> };
    if (typeof obj.characterId === 'number') {
      obj.characterId = String(obj.characterId);
    }
    return obj;
  },
  compactEvent: (item) => {
    if (typeof item !== 'object' || item === null) return item;
    const obj = item as Record<string, unknown>;
    // Remove verbose fields, keep essential
    const { eventId, ts, type, payload } = obj;
    return { eventId, ts, type, payload };
  },
};

// ============================================================================
// COERCION FUNCTIONS
// ============================================================================

function coerceValue(value: unknown, target: CoercionTarget): unknown {
  switch (target) {
    case 'string':
      if (value === null || value === undefined) return '';
      return String(value);
    case 'number':
      if (typeof value === 'number') return value;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    case 'boolean':
      return Boolean(value);
    case 'array':
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined) return [];
      return [value];
    case 'object':
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value;
      return {};
    default:
      return value;
  }
}

// ============================================================================
// OPERATION EXECUTORS
// ============================================================================

export interface OpExecutionResult {
  success: boolean;
  diff: DiffEntry | null;
  error?: string;
}

function executeSet(save: unknown, op: SetOp): OpExecutionResult {
  const before = getAtPath(save, op.path);
  const success = setAtPath(save, op.path, op.value);
  
  return {
    success,
    diff: success ? {
      path: op.path,
      before,
      after: op.value,
      op: 'set',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to set at ${op.path}`,
  };
}

function executeDelete(save: unknown, op: DeleteOp): OpExecutionResult {
  const before = getAtPath(save, op.path);
  const success = deleteAtPath(save, op.path);
  
  return {
    success,
    diff: success ? {
      path: op.path,
      before,
      after: undefined,
      op: 'delete',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to delete at ${op.path}`,
  };
}

function executeRename(save: unknown, op: RenameOp): OpExecutionResult {
  const value = getAtPath(save, op.path);
  if (value === undefined) {
    return { success: false, diff: null, error: `No value at ${op.path}` };
  }
  
  const setSuccess = setAtPath(save, op.newPath, value);
  if (!setSuccess) {
    return { success: false, diff: null, error: `Failed to set at ${op.newPath}` };
  }
  
  deleteAtPath(save, op.path);
  
  return {
    success: true,
    diff: {
      path: op.path,
      before: { path: op.path, value },
      after: { path: op.newPath, value },
      op: 'rename',
      reason: op.reason,
    },
  };
}

function executeCoerce(save: unknown, op: CoerceOp): OpExecutionResult {
  const before = getAtPath(save, op.path);
  const after = coerceValue(before, op.targetType);
  const success = setAtPath(save, op.path, after);
  
  return {
    success,
    diff: success ? {
      path: op.path,
      before,
      after,
      op: 'coerce',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to coerce at ${op.path}`,
  };
}

function executeTruncate(save: unknown, op: TruncateOp): OpExecutionResult {
  const before = getAtPath(save, op.path);
  if (!Array.isArray(before)) {
    return { success: false, diff: null, error: `Value at ${op.path} is not an array` };
  }
  
  if (before.length <= op.maxLength) {
    return { success: true, diff: null }; // No change needed
  }
  
  const after = before.slice(-op.maxLength);
  const success = setAtPath(save, op.path, after);
  
  return {
    success,
    diff: success ? {
      path: op.path,
      before: { length: before.length },
      after: { length: after.length },
      op: 'truncate',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to truncate at ${op.path}`,
  };
}

function executeFilterArray(save: unknown, op: FilterArrayOp): OpExecutionResult {
  const before = getAtPath(save, op.path);
  if (!Array.isArray(before)) {
    return { success: false, diff: null, error: `Value at ${op.path} is not an array` };
  }
  
  const after = filterWithPredicate(before, op.predicateId);
  const success = setAtPath(save, op.path, after);
  
  const removed = before.length - after.length;
  
  return {
    success,
    diff: success && removed > 0 ? {
      path: op.path,
      before: { length: before.length },
      after: { length: after.length, removed },
      op: 'filterArray',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to filter at ${op.path}`,
  };
}

function executeMapArray(save: unknown, op: MapArrayOp): OpExecutionResult {
  const before = getAtPath(save, op.path);
  if (!Array.isArray(before)) {
    return { success: false, diff: null, error: `Value at ${op.path} is not an array` };
  }
  
  const mapper = MAPPERS[op.mapperId];
  if (!mapper) {
    return { success: false, diff: null, error: `Unknown mapper: ${op.mapperId}` };
  }
  
  const after = before.map(mapper);
  const success = setAtPath(save, op.path, after);
  
  return {
    success,
    diff: success ? {
      path: op.path,
      before: { length: before.length },
      after: { length: after.length, mapped: true },
      op: 'mapArray',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to map at ${op.path}`,
  };
}

function executeEnsureDefault(save: unknown, op: EnsureDefaultOp): OpExecutionResult {
  const current = getAtPath(save, op.path);
  
  if (current !== undefined && current !== null) {
    return { success: true, diff: null }; // Already exists
  }
  
  const success = setAtPath(save, op.path, op.defaultValue);
  
  return {
    success,
    diff: success ? {
      path: op.path,
      before: current,
      after: op.defaultValue,
      op: 'ensureDefault',
      reason: op.reason,
    } : null,
    error: success ? undefined : `Failed to set default at ${op.path}`,
  };
}

function executeRebuildIndex(save: unknown, op: RebuildIndexOp): OpExecutionResult {
  // Rebuild derived indices from canonical data
  // This is safe because indices are always derivable
  
  const gameData = getAtPath(save, '/gameData') as Record<string, unknown> | undefined;
  if (!gameData) {
    return { success: false, diff: null, error: 'No gameData found' };
  }
  
  switch (op.indexName) {
    case 'npcIdIndex': {
      // Rebuild NPC ID index from characters array
      const characters = gameData.characters as unknown[] | undefined;
      if (Array.isArray(characters)) {
        const index: Record<string, number> = {};
        characters.forEach((char, idx) => {
          if (typeof char === 'object' && char !== null) {
            const id = (char as Record<string, unknown>).id;
            if (typeof id === 'string') {
              index[id] = idx;
            }
          }
        });
        gameData._npcIdIndex = index;
        return {
          success: true,
          diff: {
            path: '/gameData/_npcIdIndex',
            before: undefined,
            after: index,
            op: 'rebuildIndex',
            reason: op.reason,
          },
        };
      }
      break;
    }
    case 'locationIndex': {
      // Rebuild location index from zones
      const zones = gameData.zones as unknown[] | undefined;
      if (Array.isArray(zones)) {
        const index: Record<string, string[]> = {};
        zones.forEach((zone) => {
          if (typeof zone === 'object' && zone !== null) {
            const z = zone as Record<string, unknown>;
            const id = z.id as string;
            const characters = z.presentCharacters as string[] | undefined;
            if (id && Array.isArray(characters)) {
              index[id] = characters;
            }
          }
        });
        gameData._locationIndex = index;
        return {
          success: true,
          diff: {
            path: '/gameData/_locationIndex',
            before: undefined,
            after: index,
            op: 'rebuildIndex',
            reason: op.reason,
          },
        };
      }
      break;
    }
  }
  
  return { success: true, diff: null }; // No-op if index not recognized
}

// ============================================================================
// MAIN OPERATION EXECUTOR
// ============================================================================

export function executeOp(save: unknown, op: RecoveryOp): OpExecutionResult {
  switch (op.type) {
    case 'set': return executeSet(save, op);
    case 'delete': return executeDelete(save, op);
    case 'rename': return executeRename(save, op);
    case 'coerce': return executeCoerce(save, op);
    case 'truncate': return executeTruncate(save, op);
    case 'filterArray': return executeFilterArray(save, op);
    case 'mapArray': return executeMapArray(save, op);
    case 'ensureDefault': return executeEnsureDefault(save, op);
    case 'rebuildIndex': return executeRebuildIndex(save, op);
    default:
      return { success: false, diff: null, error: `Unknown operation type` };
  }
}

/**
 * Execute multiple operations in sequence
 */
export function executeOps(
  save: unknown,
  ops: RecoveryOp[]
): { success: boolean; diffs: DiffEntry[]; errors: string[] } {
  const diffs: DiffEntry[] = [];
  const errors: string[] = [];
  let allSuccess = true;
  
  for (const op of ops) {
    const result = executeOp(save, op);
    if (!result.success) {
      allSuccess = false;
      if (result.error) errors.push(result.error);
    }
    if (result.diff) {
      diffs.push(result.diff);
    }
  }
  
  return { success: allSuccess, diffs, errors };
}

/**
 * Execute operations in dry-run mode (on a copy)
 */
export function dryRunOps(
  save: unknown,
  ops: RecoveryOp[]
): { result: unknown; diffs: DiffEntry[]; errors: string[] } {
  // Deep clone to avoid mutations
  const copy = JSON.parse(JSON.stringify(save));
  const { success, diffs, errors } = executeOps(copy, ops);
  
  return { result: success ? copy : null, diffs, errors };
}
