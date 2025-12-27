// ============================================================================
// INVARIANT CHECKING
// Validates save data integrity after loading/migration
// ============================================================================

import { InvariantViolation, InvariantResult } from './types';
import { getAtPath } from './operations';

// ============================================================================
// INVARIANT DEFINITIONS
// ============================================================================

type InvariantFn = (save: unknown) => InvariantViolation[];

interface InvariantDef {
  id: string;
  name: string;
  check: InvariantFn;
}

const INVARIANTS: InvariantDef[] = [
  // ============================================================================
  // CAMPAIGN INVARIANTS
  // ============================================================================
  {
    id: 'CAMPAIGN_ID',
    name: 'Campaign ID exists',
    check: (save) => {
      const id = getAtPath(save, '/id');
      if (typeof id !== 'string' || id.length === 0) {
        return [{
          path: '/id',
          code: 'CAMPAIGN_ID',
          message: 'Campaign ID is missing or invalid',
          severity: 'error',
        }];
      }
      return [];
    },
  },
  {
    id: 'CHARACTER_NAME',
    name: 'Character name exists',
    check: (save) => {
      const name = getAtPath(save, '/characterName');
      if (typeof name !== 'string' || name.length === 0) {
        return [{
          path: '/characterName',
          code: 'CHARACTER_NAME',
          message: 'Character name is missing or empty',
          severity: 'error',
        }];
      }
      return [];
    },
  },
  {
    id: 'TIMESTAMP_VALID',
    name: 'Timestamp is valid',
    check: (save) => {
      const ts = getAtPath(save, '/timestamp');
      if (typeof ts !== 'number' || ts <= 0 || isNaN(ts)) {
        return [{
          path: '/timestamp',
          code: 'TIMESTAMP_VALID',
          message: 'Timestamp is invalid or missing',
          severity: 'error',
        }];
      }
      return [];
    },
  },
  {
    id: 'SAVE_VERSION',
    name: 'Save version exists',
    check: (save) => {
      const version = getAtPath(save, '/saveVersion');
      if (typeof version !== 'number' || version < 1) {
        return [{
          path: '/saveVersion',
          code: 'SAVE_VERSION',
          message: 'Save version is missing or invalid',
          severity: 'warning',
        }];
      }
      return [];
    },
  },
  
  // ============================================================================
  // GAME DATA INVARIANTS
  // ============================================================================
  {
    id: 'GAME_DATA_EXISTS',
    name: 'Game data object exists',
    check: (save) => {
      const data = getAtPath(save, '/gameData');
      if (data === undefined || data === null) {
        return [{
          path: '/gameData',
          code: 'GAME_DATA_EXISTS',
          message: 'gameData is missing',
          severity: 'error',
        }];
      }
      if (typeof data !== 'object') {
        return [{
          path: '/gameData',
          code: 'GAME_DATA_EXISTS',
          message: 'gameData is not an object',
          severity: 'error',
        }];
      }
      return [];
    },
  },
  
  // ============================================================================
  // PLAYER/CHARACTER INVARIANTS
  // ============================================================================
  {
    id: 'PLAYER_HEALTH',
    name: 'Player health is valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const gameData = getAtPath(save, '/gameData') as Record<string, unknown> | undefined;
      
      if (!gameData) return [];
      
      // Check player object if it exists
      const player = gameData.player as Record<string, unknown> | undefined;
      if (player) {
        const hp = player.hp;
        const maxHp = player.maxHp;
        
        if (typeof hp !== 'number' || isNaN(hp)) {
          violations.push({
            path: '/gameData/player/hp',
            code: 'PLAYER_HEALTH',
            message: 'Player HP is not a valid number',
            severity: 'error',
          });
        } else if (hp < 0) {
          violations.push({
            path: '/gameData/player/hp',
            code: 'PLAYER_HEALTH',
            message: 'Player HP is negative',
            severity: 'warning',
          });
        }
        
        if (typeof maxHp !== 'number' || isNaN(maxHp) || maxHp <= 0) {
          violations.push({
            path: '/gameData/player/maxHp',
            code: 'PLAYER_HEALTH',
            message: 'Player maxHp is invalid',
            severity: 'warning',
          });
        }
      }
      
      return violations;
    },
  },
  
  // ============================================================================
  // NEEDS SYSTEM INVARIANTS
  // ============================================================================
  {
    id: 'NEEDS_VALID',
    name: 'Needs values are valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const needs = getAtPath(save, '/gameData/needs') as Record<string, unknown> | undefined;
      
      if (!needs) return []; // Missing needs is not an error, Stage A will fix
      
      // Check physical needs
      const physical = needs.physical as Record<string, unknown> | undefined;
      if (physical) {
        for (const [key, value] of Object.entries(physical)) {
          if (typeof value !== 'number' || isNaN(value)) {
            violations.push({
              path: `/gameData/needs/physical/${key}`,
              code: 'NEEDS_VALID',
              message: `Need "${key}" is not a valid number`,
              severity: 'error',
            });
          } else if (value < 0 || value > 100) {
            violations.push({
              path: `/gameData/needs/physical/${key}`,
              code: 'NEEDS_VALID',
              message: `Need "${key}" is out of range (0-100)`,
              severity: 'warning',
            });
          }
        }
      }
      
      // Check psychological needs
      const psychological = needs.psychological as Record<string, unknown> | undefined;
      if (psychological) {
        for (const [key, value] of Object.entries(psychological)) {
          if (typeof value !== 'number' || isNaN(value)) {
            violations.push({
              path: `/gameData/needs/psychological/${key}`,
              code: 'NEEDS_VALID',
              message: `Need "${key}" is not a valid number`,
              severity: 'error',
            });
          }
        }
      }
      
      return violations;
    },
  },
  
  // ============================================================================
  // RELATIONSHIP INVARIANTS
  // ============================================================================
  {
    id: 'RELATIONSHIP_EDGES_VALID',
    name: 'Relationship edges have valid references',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const gameData = getAtPath(save, '/gameData') as Record<string, unknown> | undefined;
      
      if (!gameData) return [];
      
      const relationships = gameData.relationships as Record<string, unknown> | undefined;
      if (!relationships) return [];
      
      const edges = relationships.edges as unknown[] | undefined;
      if (!Array.isArray(edges)) return [];
      
      // Collect all known character IDs
      const knownIds = new Set<string>();
      knownIds.add('player'); // Player is always valid
      
      const characters = gameData.characters as unknown[] | undefined;
      if (Array.isArray(characters)) {
        for (const char of characters) {
          if (typeof char === 'object' && char !== null) {
            const id = (char as Record<string, unknown>).id;
            if (typeof id === 'string') knownIds.add(id);
          }
        }
      }
      
      // Check each edge
      edges.forEach((edge, idx) => {
        if (typeof edge !== 'object' || edge === null) {
          violations.push({
            path: `/gameData/relationships/edges/${idx}`,
            code: 'RELATIONSHIP_EDGES_VALID',
            message: `Edge at index ${idx} is not an object`,
            severity: 'error',
          });
          return;
        }
        
        const e = edge as Record<string, unknown>;
        const from = e.from;
        const to = e.to;
        
        if (typeof from !== 'string') {
          violations.push({
            path: `/gameData/relationships/edges/${idx}/from`,
            code: 'RELATIONSHIP_EDGES_VALID',
            message: `Edge ${idx} has invalid 'from' field`,
            severity: 'error',
          });
        }
        
        if (typeof to !== 'string') {
          violations.push({
            path: `/gameData/relationships/edges/${idx}/to`,
            code: 'RELATIONSHIP_EDGES_VALID',
            message: `Edge ${idx} has invalid 'to' field`,
            severity: 'error',
          });
        }
        
        // Only warn about orphan references, don't error
        // Stage B will offer to clean these up
        if (typeof to === 'string' && !knownIds.has(to)) {
          violations.push({
            path: `/gameData/relationships/edges/${idx}/to`,
            code: 'ORPHAN_REFERENCE',
            message: `Edge ${idx} references unknown character "${to}"`,
            severity: 'warning',
          });
        }
      });
      
      return violations;
    },
  },
  
  // ============================================================================
  // INVENTORY INVARIANTS
  // ============================================================================
  {
    id: 'INVENTORY_VALID',
    name: 'Inventory items are valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const inventory = getAtPath(save, '/gameData/inventory') as unknown[] | undefined;
      
      if (!Array.isArray(inventory)) return [];
      
      inventory.forEach((item, idx) => {
        if (item === null || item === undefined) {
          violations.push({
            path: `/gameData/inventory/${idx}`,
            code: 'INVENTORY_VALID',
            message: `Inventory slot ${idx} contains null/undefined`,
            severity: 'warning',
          });
          return;
        }
        
        if (typeof item !== 'object') {
          violations.push({
            path: `/gameData/inventory/${idx}`,
            code: 'INVENTORY_VALID',
            message: `Inventory slot ${idx} is not an object`,
            severity: 'error',
          });
          return;
        }
        
        const i = item as Record<string, unknown>;
        if (!i.id || typeof i.id !== 'string') {
          violations.push({
            path: `/gameData/inventory/${idx}/id`,
            code: 'INVENTORY_VALID',
            message: `Item at ${idx} has invalid ID`,
            severity: 'error',
          });
        }
      });
      
      return violations;
    },
  },
  
  // ============================================================================
  // KNOWLEDGE INVARIANTS
  // ============================================================================
  {
    id: 'KNOWLEDGE_FORMAT',
    name: 'Knowledge entries are valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const gameData = getAtPath(save, '/gameData') as Record<string, unknown> | undefined;
      
      if (!gameData) return [];
      
      const knowledge = gameData.knowledge;
      
      // Knowledge can be array (new format) or object (legacy)
      if (knowledge === undefined) return [];
      
      if (Array.isArray(knowledge)) {
        // Tuple format: [[key, value], ...]
        knowledge.forEach((entry, idx) => {
          if (!Array.isArray(entry) || entry.length < 2) {
            violations.push({
              path: `/gameData/knowledge/${idx}`,
              code: 'KNOWLEDGE_FORMAT',
              message: `Knowledge entry ${idx} is not a valid tuple`,
              severity: 'warning',
            });
          }
        });
      } else if (typeof knowledge === 'object' && knowledge !== null) {
        // Object format is acceptable, will be migrated
      } else {
        violations.push({
          path: '/gameData/knowledge',
          code: 'KNOWLEDGE_FORMAT',
          message: 'Knowledge is not an array or object',
          severity: 'error',
        });
      }
      
      return violations;
    },
  },
  
  // ============================================================================
  // EVENT LEDGER INVARIANTS
  // ============================================================================
  {
    id: 'EVENT_LEDGER_SIZE',
    name: 'Event ledger is not oversized',
    check: (save) => {
      const MAX_EVENTS = 500;
      const events = getAtPath(save, '/gameData/eventHistory') as unknown[] | undefined;
      
      if (!Array.isArray(events)) return [];
      
      if (events.length > MAX_EVENTS * 1.5) {
        return [{
          path: '/gameData/eventHistory',
          code: 'EVENT_LEDGER_SIZE',
          message: `Event ledger has ${events.length} entries (max: ${MAX_EVENTS})`,
          severity: 'warning',
        }];
      }
      
      return [];
    },
  },
  
  // ============================================================================
  // NARRATIVE HISTORY INVARIANTS
  // ============================================================================
  {
    id: 'NARRATIVE_VALID',
    name: 'Narrative history is valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const history = getAtPath(save, '/gameData/narrativeHistory') as unknown[] | undefined;
      
      if (!Array.isArray(history)) return [];
      
      history.forEach((entry, idx) => {
        if (entry === null || entry === undefined) {
          violations.push({
            path: `/gameData/narrativeHistory/${idx}`,
            code: 'NARRATIVE_VALID',
            message: `Narrative entry ${idx} is null/undefined`,
            severity: 'warning',
          });
        }
      });
      
      return violations;
    },
  },
  
  // ============================================================================
  // CHECKPOINT INVARIANTS
  // ============================================================================
  {
    id: 'CHECKPOINTS_VALID',
    name: 'Checkpoints are valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const checkpoints = getAtPath(save, '/gameData/checkpoints') as unknown[] | undefined;
      
      if (!Array.isArray(checkpoints)) return [];
      
      checkpoints.forEach((cp, idx) => {
        if (typeof cp !== 'object' || cp === null) {
          violations.push({
            path: `/gameData/checkpoints/${idx}`,
            code: 'CHECKPOINTS_VALID',
            message: `Checkpoint ${idx} is not an object`,
            severity: 'error',
          });
          return;
        }
        
        const c = cp as Record<string, unknown>;
        if (!c.id || typeof c.id !== 'string') {
          violations.push({
            path: `/gameData/checkpoints/${idx}/id`,
            code: 'CHECKPOINTS_VALID',
            message: `Checkpoint ${idx} has invalid ID`,
            severity: 'error',
          });
        }
      });
      
      return violations;
    },
  },
];

// ============================================================================
// MAIN INVARIANT RUNNER
// ============================================================================

/**
 * Run all invariants on a save and return violations
 */
export function runInvariants(save: unknown): InvariantResult {
  const allViolations: InvariantViolation[] = [];
  
  for (const invariant of INVARIANTS) {
    try {
      const violations = invariant.check(save);
      allViolations.push(...violations);
    } catch (err) {
      // Invariant check itself failed - this is a serious issue
      allViolations.push({
        path: '/',
        code: 'INVARIANT_ERROR',
        message: `Invariant "${invariant.id}" threw error: ${err}`,
        severity: 'error',
      });
    }
  }
  
  const hasErrors = allViolations.some(v => v.severity === 'error');
  
  return {
    valid: !hasErrors,
    violations: allViolations,
  };
}

/**
 * Run only critical invariants (faster check for quick validation)
 */
export function runCriticalInvariants(save: unknown): InvariantResult {
  const criticalIds = ['CAMPAIGN_ID', 'CHARACTER_NAME', 'GAME_DATA_EXISTS'];
  const criticalInvariants = INVARIANTS.filter(i => criticalIds.includes(i.id));
  
  const allViolations: InvariantViolation[] = [];
  
  for (const invariant of criticalInvariants) {
    try {
      const violations = invariant.check(save);
      allViolations.push(...violations);
    } catch (err) {
      allViolations.push({
        path: '/',
        code: 'INVARIANT_ERROR',
        message: `Critical invariant "${invariant.id}" threw error: ${err}`,
        severity: 'error',
      });
    }
  }
  
  return {
    valid: allViolations.every(v => v.severity !== 'error'),
    violations: allViolations,
  };
}

/**
 * Get human-readable summary of violations
 */
export function summarizeViolations(result: InvariantResult): string[] {
  return result.violations.map(v => 
    `[${v.severity.toUpperCase()}] ${v.path}: ${v.message}`
  );
}
