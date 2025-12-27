// ============================================================================
// SIGNATURE HASHING
// Deterministic hash for failure fingerprinting and recipe matching
// ============================================================================

import { FailureSnapshot, InvariantViolation } from './types';

/**
 * Generate a stable signature for a failure.
 * Used to match failures to cached recipes.
 * 
 * Formula: hash(errorCode + sorted(brokenPaths) + saveVersion + subsystemVersions)
 */
export function generateFailureSignature(
  errorCode: string,
  brokenPaths: string[],
  saveVersion: number,
  subsystemVersions: Record<string, number>
): string {
  // Sort paths for determinism
  const sortedPaths = [...brokenPaths].sort();
  
  // Create stable representation of subsystem versions
  const sortedSubsystems = Object.entries(subsystemVersions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  
  // Build signature input
  const signatureInput = [
    errorCode,
    sortedPaths.join('|'),
    `v${saveVersion}`,
    sortedSubsystems,
  ].join('::');
  
  // Simple deterministic hash (FNV-1a variant)
  return fnv1aHash(signatureInput);
}

/**
 * Generate signature from a FailureSnapshot
 */
export function signatureFromSnapshot(snapshot: FailureSnapshot): string {
  return generateFailureSignature(
    snapshot.errorCode,
    snapshot.brokenPaths,
    snapshot.saveVersion,
    snapshot.subsystemVersions
  );
}

/**
 * Generate signature from invariant violations
 */
export function signatureFromViolations(
  violations: InvariantViolation[],
  saveVersion: number,
  subsystemVersions: Record<string, number>
): string {
  const brokenPaths = violations.map(v => `${v.path}:${v.code}`);
  const errorCode = violations.length > 0 ? violations[0].code : 'UNKNOWN';
  
  return generateFailureSignature(
    errorCode,
    brokenPaths,
    saveVersion,
    subsystemVersions
  );
}

/**
 * FNV-1a hash algorithm - fast, deterministic, good distribution
 */
function fnv1aHash(str: string): string {
  let hash = 2166136261;
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  // Convert to hex string, take first 16 chars
  return (hash >>> 0).toString(16).padStart(8, '0') + 
         Math.abs(hash ^ (hash >>> 16)).toString(16).padStart(8, '0');
}

/**
 * Normalize a path for consistent comparison
 */
export function normalizePath(path: string): string {
  // Convert various path formats to consistent JSON pointer
  return path
    .replace(/\[(\d+)\]/g, '/$1') // arr[0] -> arr/0
    .replace(/\./g, '/') // dot notation to slash
    .replace(/^\/+/, '/') // ensure single leading slash
    .replace(/\/+/g, '/'); // collapse multiple slashes
}

/**
 * Check if two signatures match (for cache lookup)
 */
export function signaturesMatch(a: string, b: string): boolean {
  return a === b;
}

/**
 * Create a partial signature for fuzzy matching
 * Useful when exact match fails but we want similar recipes
 */
export function createPartialSignature(
  errorCode: string,
  saveVersion: number
): string {
  return fnv1aHash(`${errorCode}::v${saveVersion}`);
}
