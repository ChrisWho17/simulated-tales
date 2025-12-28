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
  // CAMPAIGN INVARIANTS - Updated to match CampaignData structure
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
      // Check player.name (CampaignData structure)
      const playerName = getAtPath(save, '/player/name');
      if (typeof playerName === 'string' && playerName.length > 0) {
        return [];
      }
      // Only error if player object exists but name is missing
      const player = getAtPath(save, '/player');
      if (player !== undefined) {
        return [{
          path: '/player/name',
          code: 'CHARACTER_NAME',
          message: 'Character name is missing or empty',
          severity: 'warning', // Downgrade to warning - recoverable
        }];
      }
      return []; // No player object yet is okay for new campaigns
    },
  },
  {
    id: 'META_EXISTS',
    name: 'Campaign meta exists',
    check: (save) => {
      const meta = getAtPath(save, '/meta');
      if (meta === undefined || meta === null || typeof meta !== 'object') {
        return [{
          path: '/meta',
          code: 'META_EXISTS',
          message: 'Campaign meta is missing',
          severity: 'warning', // Recoverable with defaults
        }];
      }
      return [];
    },
  },
  {
    id: 'META_NAME',
    name: 'Campaign name exists',
    check: (save) => {
      const name = getAtPath(save, '/meta/name');
      // Only check if meta exists
      const meta = getAtPath(save, '/meta');
      if (meta === undefined) return []; // Handled by META_EXISTS
      
      if (typeof name !== 'string' || name.length === 0) {
        return [{
          path: '/meta/name',
          code: 'META_NAME',
          message: 'Campaign name is missing',
          severity: 'warning',
        }];
      }
      return [];
    },
  },
  
  // ============================================================================
  // WORLD BIBLE INVARIANTS
  // ============================================================================
  {
    id: 'WORLD_BIBLE_EXISTS',
    name: 'World Bible exists',
    check: (save) => {
      const worldBible = getAtPath(save, '/worldBible');
      if (worldBible === undefined || worldBible === null) {
        return [{
          path: '/worldBible',
          code: 'WORLD_BIBLE_EXISTS',
          message: 'World Bible is missing',
          severity: 'warning', // Recoverable - can create minimal one
        }];
      }
      return [];
    },
  },
  
  // ============================================================================
  // PLAYER INVARIANTS - CampaignData has /player at root level
  // ============================================================================
  {
    id: 'PLAYER_EXISTS',
    name: 'Player object exists',
    check: (save) => {
      const player = getAtPath(save, '/player');
      if (player === undefined || player === null) {
        return [{
          path: '/player',
          code: 'PLAYER_EXISTS',
          message: 'Player object is missing',
          severity: 'warning', // Recoverable
        }];
      }
      if (typeof player !== 'object') {
        return [{
          path: '/player',
          code: 'PLAYER_EXISTS',
          message: 'Player is not an object',
          severity: 'error',
        }];
      }
      return [];
    },
  },
  {
    id: 'PLAYER_HEALTH',
    name: 'Player health is valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const player = getAtPath(save, '/player') as Record<string, unknown> | undefined;
      
      if (!player) return []; // Handled by PLAYER_EXISTS
      
      const hp = player.hp;
      const maxHp = player.maxHp;
      
      // Only check if these fields exist
      if (hp !== undefined) {
        if (typeof hp !== 'number' || isNaN(hp)) {
          violations.push({
            path: '/player/hp',
            code: 'PLAYER_HEALTH',
            message: 'Player HP is not a valid number',
            severity: 'warning',
          });
        } else if (hp < 0) {
          violations.push({
            path: '/player/hp',
            code: 'PLAYER_HEALTH',
            message: 'Player HP is negative',
            severity: 'warning',
          });
        }
      }
      
      if (maxHp !== undefined) {
        if (typeof maxHp !== 'number' || isNaN(maxHp) || maxHp <= 0) {
          violations.push({
            path: '/player/maxHp',
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
  // INVENTORY INVARIANTS - CampaignData has /player/inventory
  // ============================================================================
  {
    id: 'INVENTORY_VALID',
    name: 'Inventory items are valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const inventory = getAtPath(save, '/player/inventory') as unknown[] | undefined;
      
      if (!Array.isArray(inventory)) return []; // Missing inventory is okay
      
      inventory.forEach((item, idx) => {
        if (item === null || item === undefined) {
          violations.push({
            path: `/player/inventory/${idx}`,
            code: 'INVENTORY_VALID',
            message: `Inventory slot ${idx} contains null/undefined`,
            severity: 'warning',
          });
          return;
        }
        
        if (typeof item !== 'object') {
          violations.push({
            path: `/player/inventory/${idx}`,
            code: 'INVENTORY_VALID',
            message: `Inventory slot ${idx} is not an object`,
            severity: 'warning',
          });
        }
      });
      
      return violations;
    },
  },
  
  // ============================================================================
  // NARRATIVE HISTORY INVARIANTS - CampaignData has /narrativeHistory at root
  // ============================================================================
  {
    id: 'NARRATIVE_VALID',
    name: 'Narrative history is valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const history = getAtPath(save, '/narrativeHistory') as unknown[] | undefined;
      
      if (!Array.isArray(history)) return []; // Missing is okay for new campaigns
      
      history.forEach((entry, idx) => {
        if (entry === null || entry === undefined) {
          violations.push({
            path: `/narrativeHistory/${idx}`,
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
  // CHECKPOINT INVARIANTS - CampaignData has /checkpoints at root
  // ============================================================================
  {
    id: 'CHECKPOINTS_VALID',
    name: 'Checkpoints are valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const checkpoints = getAtPath(save, '/checkpoints') as unknown[] | undefined;
      
      if (!Array.isArray(checkpoints)) return []; // Missing is okay
      
      checkpoints.forEach((cp, idx) => {
        if (typeof cp !== 'object' || cp === null) {
          violations.push({
            path: `/checkpoints/${idx}`,
            code: 'CHECKPOINTS_VALID',
            message: `Checkpoint ${idx} is not an object`,
            severity: 'warning',
          });
          return;
        }
        
        const c = cp as Record<string, unknown>;
        if (!c.id || typeof c.id !== 'string') {
          violations.push({
            path: `/checkpoints/${idx}/id`,
            code: 'CHECKPOINTS_VALID',
            message: `Checkpoint ${idx} has invalid ID`,
            severity: 'warning',
          });
        }
      });
      
      return violations;
    },
  },
  
  // ============================================================================
  // CHAPTERS INVARIANTS
  // ============================================================================
  {
    id: 'CHAPTERS_VALID',
    name: 'Chapters structure is valid',
    check: (save) => {
      const violations: InvariantViolation[] = [];
      const chapters = getAtPath(save, '/chapters') as unknown[] | undefined;
      const currentChapter = getAtPath(save, '/currentChapter');
      
      // chapters array is optional
      if (chapters !== undefined && !Array.isArray(chapters)) {
        violations.push({
          path: '/chapters',
          code: 'CHAPTERS_VALID',
          message: 'Chapters is not an array',
          severity: 'warning',
        });
      }
      
      // currentChapter should exist if we have chapters
      if (currentChapter !== undefined && typeof currentChapter !== 'object') {
        violations.push({
          path: '/currentChapter',
          code: 'CHAPTERS_VALID',
          message: 'Current chapter is not an object',
          severity: 'warning',
        });
      }
      
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
 * Updated to match CampaignData structure - no GAME_DATA_EXISTS anymore
 */
export function runCriticalInvariants(save: unknown): InvariantResult {
  // Only check for campaign ID - other fields are optional/recoverable
  const criticalIds = ['CAMPAIGN_ID'];
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
