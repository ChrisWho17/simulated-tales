// ============================================================================
// TRUST SCORING SYSTEM
// Calculates and manages trust scores for approved recipes
// ============================================================================

import {
  ApprovedRecipe,
  RecoveryStage,
  TrustScoreFactors,
  TRUST_THRESHOLDS,
} from './types';

// ============================================================================
// SCORE CALCULATION
// ============================================================================

const WEIGHTS = {
  successRate: 40,      // Most important
  stageBonus: 20,       // Stage A > B > C
  diffSizeBonus: 10,    // Smaller diffs are better
  lossyPenalty: 15,     // Lossy ops reduce trust
  rollbackPenalty: 10,  // Rollbacks are bad
  newViolation: 5,      // Creating new issues is bad
} as const;

export function calculateTrustScore(recipe: ApprovedRecipe): number {
  const factors = calculateFactors(recipe);
  
  // Base score from success rate
  let score = factors.successRate * WEIGHTS.successRate;
  
  // Stage bonus
  score += factors.stageBonus;
  
  // Diff size bonus (smaller = better)
  score += factors.diffSizeBonus;
  
  // Penalties
  score -= factors.lossyPenalty;
  score -= factors.rollbackPenalty;
  score -= factors.newViolationPenalty;
  
  // Age decay (very minor)
  score -= factors.ageDecay;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateFactors(recipe: ApprovedRecipe): TrustScoreFactors {
  const totalApplications = recipe.successCount + recipe.failureCount;
  
  // Success rate (0-1)
  const successRate = totalApplications > 0
    ? recipe.successCount / totalApplications
    : 0.5; // Default for new recipes
  
  // Stage bonus
  const stageBonus = getStageBonus(recipe.stage);
  
  // Diff size bonus (max 10 points for very small diffs)
  const diffSizeBonus = Math.max(0, 10 - recipe.diffSize * 2);
  
  // Lossy penalty (0-15 based on lossy op count)
  const lossyPenalty = Math.min(15, recipe.lossyOpsCount * 5);
  
  // Rollback penalty (5 points per failure)
  const rollbackPenalty = Math.min(10, recipe.failureCount * 5);
  
  // New violation penalty (not tracked per-recipe, so 0 for now)
  const newViolationPenalty = 0;
  
  // Age decay (0.1 points per day, max 5)
  const ageInDays = (Date.now() - recipe.createdAt) / (1000 * 60 * 60 * 24);
  const ageDecay = Math.min(5, ageInDays * 0.1);
  
  return {
    successRate,
    stageBonus,
    diffSizeBonus,
    lossyPenalty,
    rollbackPenalty,
    newViolationPenalty,
    ageDecay,
  };
}

function getStageBonus(stage: RecoveryStage): number {
  switch (stage) {
    case 'A': return 20;
    case 'B': return 10;
    case 'C': return 0;
    default: return 0;
  }
}

// ============================================================================
// TRUST DECISIONS (Stricter thresholds per stage)
// Stage A: 3 successes to auto-apply
// Stage B: 5 successes to auto-apply
// Stage C: NEVER auto-applies
// ============================================================================

const AUTO_APPLY_THRESHOLDS = {
  A: 3,  // Stage A needs 3 successes
  B: 5,  // Stage B needs 5 successes
  C: Infinity, // Stage C never auto-applies
} as const;

export function canAutoApply(recipe: ApprovedRecipe): boolean {
  // Stage C NEVER auto-applies
  if (recipe.stage === 'C') return false;
  
  const requiredSuccesses = AUTO_APPLY_THRESHOLDS[recipe.stage];
  
  return (
    recipe.trustScore >= TRUST_THRESHOLDS.autoApply &&
    recipe.successCount >= requiredSuccesses &&
    recipe.generalizationCount >= 2
  );
}

export function shouldSuggest(recipe: ApprovedRecipe): boolean {
  return recipe.trustScore >= TRUST_THRESHOLDS.suggest;
}

export function shouldDemote(recipe: ApprovedRecipe): boolean {
  return recipe.trustScore < TRUST_THRESHOLDS.demote;
}

export function shouldRemove(recipe: ApprovedRecipe): boolean {
  return recipe.trustScore < TRUST_THRESHOLDS.remove;
}

export function getRequiredSuccessesForAutoApply(stage: RecoveryStage): number {
  return AUTO_APPLY_THRESHOLDS[stage] === Infinity ? -1 : AUTO_APPLY_THRESHOLDS[stage];
}

// ============================================================================
// SCORE UPDATES
// ============================================================================

export function recordSuccess(recipe: ApprovedRecipe): ApprovedRecipe {
  const updated = {
    ...recipe,
    successCount: recipe.successCount + 1,
    lastApplied: Date.now(),
  };
  updated.trustScore = calculateTrustScore(updated);
  return updated;
}

export function recordFailure(recipe: ApprovedRecipe): ApprovedRecipe {
  const updated = {
    ...recipe,
    failureCount: recipe.failureCount + 1,
    lastApplied: Date.now(),
  };
  updated.trustScore = calculateTrustScore(updated);
  return updated;
}

export function recordGeneralization(recipe: ApprovedRecipe): ApprovedRecipe {
  const updated = {
    ...recipe,
    generalizationCount: recipe.generalizationCount + 1,
  };
  updated.trustScore = calculateTrustScore(updated);
  return updated;
}

// ============================================================================
// INITIAL SCORE FOR NEW RECIPES
// ============================================================================

export function getInitialTrustScore(stage: RecoveryStage, diffSize: number, lossyOpsCount: number): number {
  // Start with base score based on stage
  let score = 50;
  
  // Stage bonus
  score += getStageBonus(stage);
  
  // Diff size adjustment
  score += Math.max(0, 10 - diffSize * 2);
  
  // Lossy penalty
  score -= Math.min(15, lossyOpsCount * 5);
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// SCORE DISPLAY HELPERS
// ============================================================================

export function getTrustLabel(score: number): string {
  if (score >= TRUST_THRESHOLDS.autoApply) return 'Highly Trusted';
  if (score >= TRUST_THRESHOLDS.suggest) return 'Trusted';
  if (score >= TRUST_THRESHOLDS.demote) return 'Low Trust';
  return 'Untrusted';
}

export function getTrustColor(score: number): string {
  if (score >= TRUST_THRESHOLDS.autoApply) return 'text-green-500';
  if (score >= TRUST_THRESHOLDS.suggest) return 'text-amber-500';
  if (score >= TRUST_THRESHOLDS.demote) return 'text-orange-500';
  return 'text-destructive';
}

export function formatTrustFactors(factors: TrustScoreFactors): string[] {
  const lines: string[] = [];
  
  lines.push(`Success rate: ${(factors.successRate * 100).toFixed(0)}%`);
  lines.push(`Stage bonus: +${factors.stageBonus}`);
  
  if (factors.diffSizeBonus > 0) {
    lines.push(`Small diff: +${factors.diffSizeBonus.toFixed(1)}`);
  }
  
  if (factors.lossyPenalty > 0) {
    lines.push(`Lossy ops: -${factors.lossyPenalty}`);
  }
  
  if (factors.rollbackPenalty > 0) {
    lines.push(`Rollbacks: -${factors.rollbackPenalty}`);
  }
  
  if (factors.ageDecay > 0.5) {
    lines.push(`Age decay: -${factors.ageDecay.toFixed(1)}`);
  }
  
  return lines;
}
