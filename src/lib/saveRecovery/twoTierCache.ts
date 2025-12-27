// ============================================================================
// TWO-TIER FIX CACHE
// Inbox (untrusted) vs Approved (trusted) storage
// ============================================================================

import {
  FixProposal,
  FixInbox,
  ApprovedRecipe,
  ApprovedFixCache,
  RecoveryStage,
  GateResult,
  VerificationResult,
  ProofDisplay,
} from './types';
import { ENGINE_VERSION } from '../saveSystem';
import { verifyProposal, recordSuccessfulApplication } from './verificationGates';
import {
  calculateTrustScore,
  getInitialTrustScore,
  canAutoApply,
  shouldDemote,
  shouldRemove,
  recordSuccess,
  recordFailure,
  recordGeneralization,
} from './trustScoring';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const INBOX_KEY = 'untold-fix-inbox';
const APPROVED_KEY = 'untold-approved-fixes';

// ============================================================================
// INBOX MANAGEMENT
// ============================================================================

function loadInbox(): FixInbox {
  try {
    const stored = localStorage.getItem(INBOX_KEY);
    if (stored) {
      const inbox = JSON.parse(stored) as FixInbox;
      if (inbox.engineVersion === ENGINE_VERSION) {
        return inbox;
      }
      console.log('[TwoTierCache] Engine version mismatch, clearing inbox');
    }
  } catch (e) {
    console.error('[TwoTierCache] Failed to load inbox:', e);
  }
  return { engineVersion: ENGINE_VERSION, proposals: {}, lastUpdated: Date.now() };
}

function saveInbox(inbox: FixInbox): void {
  try {
    inbox.lastUpdated = Date.now();
    localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
  } catch (e) {
    console.error('[TwoTierCache] Failed to save inbox:', e);
  }
}

export function addToInbox(proposal: FixProposal): boolean {
  // Validate proposal structure
  if (!validateProposalStructure(proposal)) {
    console.warn('[TwoTierCache] Rejected malformed proposal');
    return false;
  }
  
  const inbox = loadInbox();
  inbox.proposals[proposal.id] = proposal;
  saveInbox(inbox);
  
  console.log(`[TwoTierCache] Added proposal ${proposal.id} to inbox`);
  return true;
}

export function getFromInbox(proposalId: string): FixProposal | null {
  const inbox = loadInbox();
  return inbox.proposals[proposalId] || null;
}

export function getInboxProposalsForSignature(signature: string): FixProposal[] {
  const inbox = loadInbox();
  return Object.values(inbox.proposals).filter(p => p.signature === signature);
}

export function removeFromInbox(proposalId: string): void {
  const inbox = loadInbox();
  delete inbox.proposals[proposalId];
  saveInbox(inbox);
}

export function clearInbox(): void {
  localStorage.removeItem(INBOX_KEY);
  console.log('[TwoTierCache] Inbox cleared');
}

export function getInboxStats(): { count: number; byStage: Record<RecoveryStage, number> } {
  const inbox = loadInbox();
  const proposals = Object.values(inbox.proposals);
  
  const byStage: Record<RecoveryStage, number> = { A: 0, B: 0, C: 0 };
  for (const p of proposals) {
    byStage[p.stage]++;
  }
  
  return { count: proposals.length, byStage };
}

// ============================================================================
// APPROVED CACHE MANAGEMENT
// ============================================================================

function loadApproved(): ApprovedFixCache {
  try {
    const stored = localStorage.getItem(APPROVED_KEY);
    if (stored) {
      const cache = JSON.parse(stored) as ApprovedFixCache;
      if (cache.engineVersion === ENGINE_VERSION) {
        return cache;
      }
      console.log('[TwoTierCache] Engine version mismatch, clearing approved cache');
    }
  } catch (e) {
    console.error('[TwoTierCache] Failed to load approved cache:', e);
  }
  return { engineVersion: ENGINE_VERSION, recipes: {}, lastUpdated: Date.now() };
}

function saveApproved(cache: ApprovedFixCache): void {
  try {
    cache.lastUpdated = Date.now();
    localStorage.setItem(APPROVED_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('[TwoTierCache] Failed to save approved cache:', e);
  }
}

export function getApprovedRecipe(signature: string): ApprovedRecipe | null {
  const cache = loadApproved();
  return cache.recipes[signature] || null;
}

export function getAllApprovedRecipes(): ApprovedRecipe[] {
  const cache = loadApproved();
  return Object.values(cache.recipes);
}

export function updateApprovedRecipe(recipe: ApprovedRecipe): void {
  const cache = loadApproved();
  cache.recipes[recipe.signature] = recipe;
  saveApproved(cache);
}

export function removeApprovedRecipe(signature: string): void {
  const cache = loadApproved();
  delete cache.recipes[signature];
  saveApproved(cache);
}

export function clearApprovedCache(): void {
  localStorage.removeItem(APPROVED_KEY);
  console.log('[TwoTierCache] Approved cache cleared');
}

// ============================================================================
// PROPOSAL VALIDATION
// ============================================================================

function validateProposalStructure(proposal: FixProposal): boolean {
  if (!proposal.id || typeof proposal.id !== 'string') return false;
  if (!proposal.signature || typeof proposal.signature !== 'string') return false;
  if (!['A', 'B', 'C'].includes(proposal.stage)) return false;
  if (!Array.isArray(proposal.ops)) return false;
  if (!Array.isArray(proposal.expectedOutcome)) return false;
  if (!['low', 'medium', 'high'].includes(proposal.risk)) return false;
  if (!proposal.reasoningSummary || proposal.reasoningSummary.length > 500) return false;
  if (!['ai', 'user', 'system'].includes(proposal.source)) return false;
  
  return true;
}

// ============================================================================
// PROMOTION: Inbox → Approved
// ============================================================================

export interface PromotionResult {
  success: boolean;
  recipe: ApprovedRecipe | null;
  verification: VerificationResult;
  reason: string;
}

export function promoteToApproved(
  proposal: FixProposal,
  save: unknown,
  options: { generalizationThreshold?: number; approvalSource?: 'auto' | 'user' | 'dev' } = {}
): PromotionResult {
  // Run verification gates
  const verification = verifyProposal(proposal, save, options);
  
  if (!verification.canApprove) {
    return {
      success: false,
      recipe: null,
      verification,
      reason: `Failed gates: ${verification.blockingGates.join(', ')}`,
    };
  }
  
  // Count lossy ops
  const lossyOpsCount = proposal.ops.filter(op =>
    op.type === 'delete' || op.type === 'truncate' ||
    (op.type === 'set' && op.reason.toLowerCase().includes('reset'))
  ).length;
  
  // Create approved recipe
  const recipe: ApprovedRecipe = {
    signature: proposal.signature,
    humanLabel: proposal.reasoningSummary.slice(0, 100),
    ops: proposal.ops,
    stage: proposal.stage,
    createdAt: Date.now(),
    appliedCount: 0,
    notes: `Source: ${proposal.source}`,
    
    // Extended fields
    trustScore: getInitialTrustScore(proposal.stage, proposal.ops.length, lossyOpsCount),
    successCount: 0,
    failureCount: 0,
    lossyOpsCount,
    diffSize: proposal.ops.length,
    generalizationCount: 0,
    lastApplied: 0,
    approvalSource: options.approvalSource ?? 'user',
    gatesPassed: verification.gateResults,
  };
  
  // Store in approved cache
  const cache = loadApproved();
  cache.recipes[recipe.signature] = recipe;
  saveApproved(cache);
  
  // Remove from inbox
  removeFromInbox(proposal.id);
  
  console.log(`[TwoTierCache] Promoted proposal ${proposal.id} to approved cache`);
  
  return {
    success: true,
    recipe,
    verification,
    reason: 'All gates passed',
  };
}

// ============================================================================
// APPLICATION TRACKING
// ============================================================================

export function recordRecipeApplication(
  signature: string,
  success: boolean,
  campaignId: string,
  userId?: string
): void {
  const recipe = getApprovedRecipe(signature);
  if (!recipe) return;
  
  let updated: ApprovedRecipe;
  
  if (success) {
    updated = recordSuccess(recipe);
    updated = recordGeneralization(updated);
    updated.appliedCount++;
    
    // Track for generalization gate
    recordSuccessfulApplication(signature, campaignId, userId);
  } else {
    updated = recordFailure(recipe);
  }
  
  // Update in cache
  updateApprovedRecipe(updated);
  
  // Check if should be demoted or removed
  if (shouldRemove(updated)) {
    console.log(`[TwoTierCache] Removing low-trust recipe: ${signature}`);
    removeApprovedRecipe(signature);
  } else if (shouldDemote(updated)) {
    console.log(`[TwoTierCache] Recipe trust is low: ${signature} (${updated.trustScore})`);
  }
}

// ============================================================================
// AUTO-APPLY LOOKUP
// ============================================================================

export function findAutoApplyableRecipe(signature: string): ApprovedRecipe | null {
  const recipe = getApprovedRecipe(signature);
  if (!recipe) return null;
  
  if (canAutoApply(recipe)) {
    return recipe;
  }
  
  return null;
}

// ============================================================================
// PROOF MODE DISPLAY
// ============================================================================

export function generateProofDisplay(
  proposal: FixProposal,
  verification: VerificationResult,
  existingRecipe: ApprovedRecipe | null
): ProofDisplay {
  // Extract fixed invariants from Gate C
  const gateC = verification.gateResults.find(g => g.gate === 'C');
  const fixedInvariants = (gateC as { fixedPaths?: string[] } | undefined)?.fixedPaths ?? [];
  
  // Extract changed paths from proposal
  const changedPaths = proposal.ops.map(op => op.path);
  
  return {
    fixedInvariants,
    changedPaths,
    seenBefore: existingRecipe !== null,
    trustScore: existingRecipe?.trustScore ?? getInitialTrustScore(proposal.stage, proposal.ops.length, 0),
    gateResults: verification.gateResults,
    risk: proposal.risk,
    isAutoApplyable: existingRecipe ? canAutoApply(existingRecipe) : false,
  };
}

// ============================================================================
// CACHE STATS
// ============================================================================

export function getTwoTierCacheStats(): {
  inbox: { count: number; byStage: Record<RecoveryStage, number> };
  approved: { count: number; avgTrust: number; autoApplyable: number };
} {
  const inboxStats = getInboxStats();
  
  const approved = getAllApprovedRecipes();
  const avgTrust = approved.length > 0
    ? approved.reduce((sum, r) => sum + r.trustScore, 0) / approved.length
    : 0;
  const autoApplyable = approved.filter(r => canAutoApply(r)).length;
  
  return {
    inbox: inboxStats,
    approved: {
      count: approved.length,
      avgTrust: Math.round(avgTrust),
      autoApplyable,
    },
  };
}
