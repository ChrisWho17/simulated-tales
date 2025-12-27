// ============================================================================
// RECIPE CACHE
// Stores confirmed repair recipes for automatic reuse
// ============================================================================

import { RecoveryRecipe, RecoveryOp, RecipeCache, RecoveryStage } from './types';
import { ENGINE_VERSION } from '../saveSystem';

const RECIPE_CACHE_KEY = 'untold-recovery-recipes';

// ============================================================================
// CACHE STORAGE
// ============================================================================

/**
 * Load the recipe cache from localStorage
 */
export function loadRecipeCache(): RecipeCache {
  try {
    const stored = localStorage.getItem(RECIPE_CACHE_KEY);
    if (stored) {
      const cache = JSON.parse(stored) as RecipeCache;
      
      // Check if cache is for current engine version
      if (cache.engineVersion !== ENGINE_VERSION) {
        console.log('[RecipeCache] Engine version mismatch, clearing cache');
        return createEmptyCache();
      }
      
      return cache;
    }
  } catch (e) {
    console.error('[RecipeCache] Failed to load cache:', e);
  }
  
  return createEmptyCache();
}

/**
 * Save the recipe cache to localStorage
 */
export function saveRecipeCache(cache: RecipeCache): void {
  try {
    cache.lastUpdated = Date.now();
    localStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('[RecipeCache] Failed to save cache:', e);
  }
}

/**
 * Create empty cache
 */
function createEmptyCache(): RecipeCache {
  return {
    engineVersion: ENGINE_VERSION,
    recipes: {},
    lastUpdated: Date.now(),
  };
}

// ============================================================================
// RECIPE OPERATIONS
// ============================================================================

/**
 * Look up a recipe by signature
 */
export function findRecipe(signature: string): RecoveryRecipe | null {
  const cache = loadRecipeCache();
  return cache.recipes[signature] || null;
}

/**
 * Store a new recipe
 */
export function storeRecipe(recipe: RecoveryRecipe): void {
  const cache = loadRecipeCache();
  
  // Don't cache Stage C recipes - too dangerous for auto-apply
  if (recipe.stage === 'C') {
    console.log('[RecipeCache] Not caching Stage C recipe');
    return;
  }
  
  cache.recipes[recipe.signature] = recipe;
  saveRecipeCache(cache);
  
  console.log(`[RecipeCache] Stored recipe "${recipe.humanLabel}" for signature ${recipe.signature}`);
}

/**
 * Update recipe applied count
 */
export function incrementRecipeUsage(signature: string): void {
  const cache = loadRecipeCache();
  const recipe = cache.recipes[signature];
  
  if (recipe) {
    recipe.appliedCount++;
    saveRecipeCache(cache);
  }
}

/**
 * Create a new recipe from applied operations
 */
export function createRecipe(
  signature: string,
  humanLabel: string,
  ops: RecoveryOp[],
  stage: RecoveryStage,
  notes: string = ''
): RecoveryRecipe {
  return {
    signature,
    humanLabel,
    ops,
    stage,
    createdAt: Date.now(),
    appliedCount: 0,
    notes,
  };
}

/**
 * Delete a recipe
 */
export function deleteRecipe(signature: string): void {
  const cache = loadRecipeCache();
  delete cache.recipes[signature];
  saveRecipeCache(cache);
}

/**
 * Clear all recipes
 */
export function clearRecipeCache(): void {
  localStorage.removeItem(RECIPE_CACHE_KEY);
  console.log('[RecipeCache] Cache cleared');
}

/**
 * Get all stored recipes
 */
export function getAllRecipes(): RecoveryRecipe[] {
  const cache = loadRecipeCache();
  return Object.values(cache.recipes);
}

/**
 * Get cache statistics
 */
export function getRecipeCacheStats(): {
  recipeCount: number;
  totalApplied: number;
  oldestRecipe: number | null;
  newestRecipe: number | null;
} {
  const cache = loadRecipeCache();
  const recipes = Object.values(cache.recipes);
  
  if (recipes.length === 0) {
    return {
      recipeCount: 0,
      totalApplied: 0,
      oldestRecipe: null,
      newestRecipe: null,
    };
  }
  
  const totalApplied = recipes.reduce((sum, r) => sum + r.appliedCount, 0);
  const times = recipes.map(r => r.createdAt);
  
  return {
    recipeCount: recipes.length,
    totalApplied,
    oldestRecipe: Math.min(...times),
    newestRecipe: Math.max(...times),
  };
}

// ============================================================================
// RECIPE VALIDATION
// ============================================================================

/**
 * Validate that a recipe's operations are all in the allowlist
 */
export function validateRecipeOps(recipe: RecoveryRecipe): boolean {
  const allowedTypes = [
    'set',
    'delete',
    'rename',
    'coerce',
    'truncate',
    'filterArray',
    'mapArray',
    'ensureDefault',
    'rebuildIndex',
  ];
  
  for (const op of recipe.ops) {
    if (!allowedTypes.includes(op.type)) {
      console.error(`[RecipeCache] Invalid operation type: ${op.type}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a recipe is safe to auto-apply (Stage A only)
 */
export function isAutoApplyable(recipe: RecoveryRecipe): boolean {
  return recipe.stage === 'A' && validateRecipeOps(recipe);
}
