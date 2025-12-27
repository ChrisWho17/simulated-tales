// ============================================================================
// VERIFICATION GATES
// Gates A-E for validating fix proposals before approval
// ============================================================================

import {
  FixProposal,
  RecoveryOp,
  RecoveryOpType,
  BuiltInPredicateId,
  BuiltInMapperId,
  GateResult,
  GateAResult,
  GateBResult,
  GateCResult,
  GateDResult,
  GateEResult,
  VerificationResult,
  DiffEntry,
  InvariantViolation,
} from './types';
import { dryRunOps, getAtPath } from './operations';
import { runInvariants } from './invariants';
import { processSaveForLoading } from '../saveSystem';

// ============================================================================
// ALLOWLISTS
// ============================================================================

const ALLOWED_OP_TYPES: RecoveryOpType[] = [
  'set', 'delete', 'rename', 'coerce', 'truncate',
  'filterArray', 'mapArray', 'ensureDefault', 'rebuildIndex',
];

const ALLOWED_PREDICATES: BuiltInPredicateId[] = [
  'removeNulls', 'removeUndefined', 'removeEmptyStrings',
  'removeInvalidIds', 'removeOrphanEdges', 'removeDuplicates',
];

const ALLOWED_MAPPERS: BuiltInMapperId[] = [
  'ensureEventId', 'ensureTimestamp', 'normalizeCharacterId', 'compactEvent',
];

// Forbidden patterns in values (no code injection)
const FORBIDDEN_PATTERNS = [
  /function\s*\(/i,
  /=>/,
  /eval\s*\(/i,
  /new\s+Function/i,
  /import\s*\(/i,
  /require\s*\(/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
];

// ============================================================================
// GATE A: Determinism + Allowlist
// ============================================================================

export function runGateA(proposal: FixProposal): GateAResult {
  const invalidOps: string[] = [];
  let hasNetworkCalls = false;
  let hasArbitraryCode = false;
  let hasUnprovenIdMapping = false;
  
  for (const op of proposal.ops) {
    // Check op type is allowed
    if (!ALLOWED_OP_TYPES.includes(op.type)) {
      invalidOps.push(`Invalid op type: ${op.type}`);
    }
    
    // Check filterArray uses allowed predicate
    if (op.type === 'filterArray') {
      const filterOp = op as { predicateId: BuiltInPredicateId };
      if (!ALLOWED_PREDICATES.includes(filterOp.predicateId)) {
        invalidOps.push(`Invalid predicate: ${filterOp.predicateId}`);
      }
    }
    
    // Check mapArray uses allowed mapper
    if (op.type === 'mapArray') {
      const mapOp = op as { mapperId: BuiltInMapperId };
      if (!ALLOWED_MAPPERS.includes(mapOp.mapperId)) {
        invalidOps.push(`Invalid mapper: ${mapOp.mapperId}`);
      }
    }
    
    // Check for forbidden patterns in set values
    if (op.type === 'set') {
      const setOp = op as { value: unknown };
      const valueStr = JSON.stringify(setOp.value);
      
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(valueStr)) {
          hasArbitraryCode = true;
          invalidOps.push(`Forbidden pattern detected: ${pattern.source}`);
        }
      }
      
      // Check for network-related strings
      if (/https?:\/\/|ws:\/\/|wss:\/\//i.test(valueStr)) {
        hasNetworkCalls = true;
        invalidOps.push('Network URL detected in value');
      }
    }
    
    // Check for ID mappings that seem guessed
    if (op.type === 'set' && op.path.includes('/id')) {
      const setOp = op as { value: unknown };
      if (typeof setOp.value === 'string' && setOp.value.startsWith('npc-') && !setOp.value.includes('_mapped_')) {
        // ID seems to be a guess, not a proven mapping
        hasUnprovenIdMapping = true;
      }
    }
  }
  
  const passed = invalidOps.length === 0 && !hasNetworkCalls && !hasArbitraryCode;
  
  return {
    gate: 'A',
    passed,
    reason: passed ? 'All operations are deterministic and allowlisted' : invalidOps.join('; '),
    timestamp: Date.now(),
    invalidOps,
    hasNetworkCalls,
    hasArbitraryCode,
    hasUnprovenIdMapping,
  };
}

// ============================================================================
// GATE B: Dry-run diff sanity
// ============================================================================

export function runGateB(proposal: FixProposal, save: unknown): GateBResult {
  const { diffs } = dryRunOps(save, proposal.ops);
  
  const hasDestructiveOps = proposal.ops.some(op => 
    op.type === 'delete' || op.type === 'truncate' ||
    (op.type === 'set' && (op.reason.toLowerCase().includes('reset') || op.reason.toLowerCase().includes('clear')))
  );
  
  const requiresStageCConfirmation = hasDestructiveOps && proposal.stage !== 'C';
  
  const passed = !requiresStageCConfirmation;
  
  return {
    gate: 'B',
    passed,
    reason: passed 
      ? `Diff sanity check passed (${diffs.length} changes)`
      : 'Destructive operations require Stage C confirmation',
    timestamp: Date.now(),
    diffSummary: diffs,
    hasDestructiveOps,
    requiresStageCConfirmation,
  };
}

// ============================================================================
// GATE C: Invariants pass
// ============================================================================

export function runGateC(proposal: FixProposal, save: unknown): GateCResult {
  // Get pre-application violations
  const preSave = JSON.parse(JSON.stringify(save));
  const preInvariants = runInvariants(preSave);
  const preBrokenCount = preInvariants.violations.filter(v => v.severity === 'error').length;
  const preBrokenPaths = preInvariants.violations.map(v => v.path);
  
  // Apply in isolated clone
  const clonedSave = JSON.parse(JSON.stringify(save));
  const { result } = dryRunOps(clonedSave, proposal.ops);
  
  if (!result) {
    return {
      gate: 'C',
      passed: false,
      reason: 'Proposal operations failed to apply',
      timestamp: Date.now(),
      preBrokenCount,
      postBrokenCount: preBrokenCount,
      fixedPaths: [],
      newlyBrokenPaths: [],
    };
  }
  
  // Get post-application violations
  const postInvariants = runInvariants(clonedSave);
  const postBrokenCount = postInvariants.violations.filter(v => v.severity === 'error').length;
  const postBrokenPaths = postInvariants.violations.map(v => v.path);
  
  // Calculate fixed and newly broken paths
  const fixedPaths = preBrokenPaths.filter(p => !postBrokenPaths.includes(p));
  const newlyBrokenPaths = postBrokenPaths.filter(p => !preBrokenPaths.includes(p));
  
  // Pass if we fixed something and didn't break anything new
  const passed = postBrokenCount <= preBrokenCount && newlyBrokenPaths.length === 0;
  
  return {
    gate: 'C',
    passed,
    reason: passed
      ? `Fixed ${fixedPaths.length} issues, ${postBrokenCount} remaining`
      : `Created ${newlyBrokenPaths.length} new violations`,
    timestamp: Date.now(),
    preBrokenCount,
    postBrokenCount,
    fixedPaths,
    newlyBrokenPaths,
  };
}

// ============================================================================
// GATE D: Regression check (smoke tests)
// ============================================================================

interface SmokeTest {
  name: string;
  run: (save: unknown) => boolean;
}

const SMOKE_TESTS: SmokeTest[] = [
  {
    name: 'campaign_list_renders',
    run: (save) => {
      const s = save as Record<string, unknown>;
      return s.id !== undefined && s.characterName !== undefined;
    },
  },
  {
    name: 'can_access_chapters',
    run: (save) => {
      const gd = (save as Record<string, unknown>).gameData as Record<string, unknown> | undefined;
      if (!gd) return true; // No gameData is not a failure for this test
      const chapters = gd.chapters;
      return chapters === undefined || Array.isArray(chapters);
    },
  },
  {
    name: 'inventory_accessible',
    run: (save) => {
      const gd = (save as Record<string, unknown>).gameData as Record<string, unknown> | undefined;
      if (!gd) return true;
      const inv = gd.inventory;
      return inv === undefined || Array.isArray(inv);
    },
  },
  {
    name: 'relationships_no_crash',
    run: (save) => {
      const gd = (save as Record<string, unknown>).gameData as Record<string, unknown> | undefined;
      if (!gd) return true;
      const rel = gd.relationships as Record<string, unknown> | undefined;
      if (!rel) return true;
      return Array.isArray(rel.edges) || rel.edges === undefined;
    },
  },
  {
    name: 'needs_no_nan',
    run: (save) => {
      const gd = (save as Record<string, unknown>).gameData as Record<string, unknown> | undefined;
      if (!gd) return true;
      const needs = gd.needs as Record<string, Record<string, unknown>> | undefined;
      if (!needs) return true;
      
      for (const category of Object.values(needs)) {
        if (typeof category === 'object' && category !== null) {
          for (const value of Object.values(category)) {
            if (typeof value === 'number' && isNaN(value)) {
              return false;
            }
          }
        }
      }
      return true;
    },
  },
  {
    name: 'narrative_history_valid',
    run: (save) => {
      const gd = (save as Record<string, unknown>).gameData as Record<string, unknown> | undefined;
      if (!gd) return true;
      const hist = gd.narrativeHistory;
      return hist === undefined || Array.isArray(hist);
    },
  },
];

export function runGateD(proposal: FixProposal, save: unknown): GateDResult {
  // Apply proposal to clone
  const clonedSave = JSON.parse(JSON.stringify(save));
  const { result } = dryRunOps(clonedSave, proposal.ops);
  
  if (!result) {
    return {
      gate: 'D',
      passed: false,
      reason: 'Could not apply proposal for regression testing',
      timestamp: Date.now(),
      testsRun: [],
      testsPassed: [],
      testsFailed: ['proposal_apply'],
    };
  }
  
  const testsRun: string[] = [];
  const testsPassed: string[] = [];
  const testsFailed: string[] = [];
  
  for (const test of SMOKE_TESTS) {
    testsRun.push(test.name);
    try {
      if (test.run(clonedSave)) {
        testsPassed.push(test.name);
      } else {
        testsFailed.push(test.name);
      }
    } catch {
      testsFailed.push(test.name);
    }
  }
  
  const passed = testsFailed.length === 0;
  
  return {
    gate: 'D',
    passed,
    reason: passed 
      ? `All ${testsRun.length} smoke tests passed`
      : `${testsFailed.length} smoke tests failed: ${testsFailed.join(', ')}`,
    timestamp: Date.now(),
    testsRun,
    testsPassed,
    testsFailed,
  };
}

// ============================================================================
// GATE E: Generalization threshold
// ============================================================================

interface GeneralizationData {
  savesSucceeded: Set<string>;  // Campaign IDs
  usersSucceeded: Set<string>;  // User IDs
  manuallyApproved: boolean;
}

// In-memory store (would be persistent in production)
const generalizationStore = new Map<string, GeneralizationData>();

export function recordSuccessfulApplication(signature: string, campaignId: string, userId?: string): void {
  let data = generalizationStore.get(signature);
  if (!data) {
    data = { savesSucceeded: new Set(), usersSucceeded: new Set(), manuallyApproved: false };
    generalizationStore.set(signature, data);
  }
  data.savesSucceeded.add(campaignId);
  if (userId) {
    data.usersSucceeded.add(userId);
  }
}

export function markManuallyApproved(signature: string): void {
  let data = generalizationStore.get(signature);
  if (!data) {
    data = { savesSucceeded: new Set(), usersSucceeded: new Set(), manuallyApproved: false };
    generalizationStore.set(signature, data);
  }
  data.manuallyApproved = true;
}

export function runGateE(proposal: FixProposal, threshold = 2): GateEResult {
  const data = generalizationStore.get(proposal.signature);
  
  const uniqueSavesSucceeded = data?.savesSucceeded.size ?? 0;
  const uniqueUsersSucceeded = data?.usersSucceeded.size ?? 0;
  const manuallyApproved = data?.manuallyApproved ?? false;
  
  const meetsThreshold = 
    uniqueSavesSucceeded >= threshold ||
    uniqueUsersSucceeded >= 2 ||
    manuallyApproved;
  
  // For new proposals, we allow them through with a warning
  // They just can't auto-apply until threshold is met
  const passed = meetsThreshold || uniqueSavesSucceeded === 0;
  
  return {
    gate: 'E',
    passed,
    reason: meetsThreshold
      ? `Generalization threshold met (${uniqueSavesSucceeded} saves, ${uniqueUsersSucceeded} users)`
      : uniqueSavesSucceeded === 0
        ? 'New proposal - will track generalization after first application'
        : `Threshold not met (${uniqueSavesSucceeded}/${threshold} saves needed)`,
    timestamp: Date.now(),
    uniqueSavesSucceeded,
    uniqueUsersSucceeded,
    manuallyApproved,
    meetsThreshold,
  };
}

// ============================================================================
// FULL VERIFICATION PIPELINE
// ============================================================================

export function verifyProposal(
  proposal: FixProposal,
  save: unknown,
  options: { generalizationThreshold?: number } = {}
): VerificationResult {
  const gateResults: GateResult[] = [];
  const blockingGates: ('A' | 'B' | 'C' | 'D' | 'E')[] = [];
  const warnings: string[] = [];
  
  // Gate A: Determinism + Allowlist (BLOCKING)
  const gateA = runGateA(proposal);
  gateResults.push(gateA);
  if (!gateA.passed) {
    blockingGates.push('A');
  }
  if (gateA.hasUnprovenIdMapping) {
    warnings.push('Contains unproven ID mapping - review carefully');
  }
  
  // Gate B: Dry-run diff sanity (BLOCKING for wrong stage)
  const gateB = runGateB(proposal, save);
  gateResults.push(gateB);
  if (!gateB.passed) {
    blockingGates.push('B');
  }
  if (gateB.hasDestructiveOps) {
    warnings.push('Contains destructive operations');
  }
  
  // Gate C: Invariants pass (BLOCKING)
  const gateC = runGateC(proposal, save);
  gateResults.push(gateC);
  if (!gateC.passed) {
    blockingGates.push('C');
  }
  if (gateC.newlyBrokenPaths.length > 0) {
    warnings.push(`Would break: ${gateC.newlyBrokenPaths.join(', ')}`);
  }
  
  // Gate D: Regression check (BLOCKING)
  const gateD = runGateD(proposal, save);
  gateResults.push(gateD);
  if (!gateD.passed) {
    blockingGates.push('D');
  }
  
  // Gate E: Generalization (SOFT - affects auto-apply, not approval)
  const gateE = runGateE(proposal, options.generalizationThreshold ?? 2);
  gateResults.push(gateE);
  if (!gateE.meetsThreshold && !gateE.manuallyApproved) {
    warnings.push('Low generalization - may not auto-apply');
  }
  
  const allPassed = blockingGates.length === 0;
  const canApprove = allPassed;
  
  return {
    allPassed,
    gateResults,
    canApprove,
    blockingGates,
    warnings,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ALLOWED_OP_TYPES,
  ALLOWED_PREDICATES,
  ALLOWED_MAPPERS,
  SMOKE_TESTS,
};
