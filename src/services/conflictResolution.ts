// ============================================================================
// CONFLICT RESOLUTION — server-vs-local save merging
// ============================================================================
// Two policies are supported when an offline queue flushes a save and the
// server already has a row for that campaign:
//
//   - 'last-write-wins'  : the local payload wins, full overwrite (old default)
//   - 'merge-by-tick'    : the side with the higher in-game `currentTick` wins
//                          per top-level field; ties fall back to updatedAt.
//                          For nested objects we deep-merge with the same rule.
//
// The policy is configurable at runtime via localStorage so debug tooling and
// the e2e harness can flip it without rebuilding.

import type { CampaignData } from '@/types/campaign';

export type ConflictPolicy = 'last-write-wins' | 'merge-by-tick';

const STORAGE_KEY = 'untold.conflictPolicy.v1';
const DEFAULT_POLICY: ConflictPolicy = 'merge-by-tick';

export function getConflictPolicy(): ConflictPolicy {
  try {
    const raw = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || '';
    if (raw === 'last-write-wins' || raw === 'merge-by-tick') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_POLICY;
}

export function setConflictPolicy(policy: ConflictPolicy): void {
  try {
    localStorage.setItem(STORAGE_KEY, policy);
    window.dispatchEvent(new CustomEvent('untold:conflict-policy-changed', { detail: policy }));
  } catch {
    /* ignore */
  }
}

function tickOf(c: Partial<CampaignData> | null | undefined): number {
  if (!c) return -Infinity;
  return typeof c.currentTick === 'number' ? c.currentTick : -Infinity;
}

function updatedAtOf(c: Partial<CampaignData> | null | undefined): number {
  if (!c) return -Infinity;
  return typeof c.meta?.updatedAt === 'number' ? c.meta.updatedAt : -Infinity;
}

/**
 * Deep merge for plain objects only — arrays and primitives are replaced by
 * the winning side as a single unit. Game state has lots of arrays
 * (chapters, narrativeHistory) where partial merging would corrupt order.
 */
function mergeBranch(localBranch: unknown, serverBranch: unknown, localWins: boolean): unknown {
  const lIsObj = isPlainObject(localBranch);
  const sIsObj = isPlainObject(serverBranch);
  if (lIsObj && sIsObj) {
    const out: Record<string, unknown> = { ...(serverBranch as Record<string, unknown>) };
    for (const k of new Set([
      ...Object.keys(localBranch as Record<string, unknown>),
      ...Object.keys(serverBranch as Record<string, unknown>),
    ])) {
      const lv = (localBranch as Record<string, unknown>)[k];
      const sv = (serverBranch as Record<string, unknown>)[k];
      if (lv === undefined) {
        out[k] = sv;
      } else if (sv === undefined) {
        out[k] = lv;
      } else {
        out[k] = mergeBranch(lv, sv, localWins);
      }
    }
    return out;
  }
  return localWins ? localBranch : serverBranch;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export interface MergeResult {
  merged: CampaignData;
  winner: 'local' | 'server' | 'tie';
  policy: ConflictPolicy;
  localTick: number;
  serverTick: number;
}

/**
 * Resolve a conflict using the configured policy. Both sides are treated as
 * already-decompressed CampaignData. `serverCampaign` may be null when the
 * server has no row yet (first sync).
 */
export function resolveConflict(
  localCampaign: CampaignData,
  serverCampaign: CampaignData | null,
  policy: ConflictPolicy = getConflictPolicy(),
): MergeResult {
  if (!serverCampaign) {
    return {
      merged: localCampaign,
      winner: 'local',
      policy,
      localTick: tickOf(localCampaign),
      serverTick: -Infinity,
    };
  }

  const lt = tickOf(localCampaign);
  const st = tickOf(serverCampaign);

  if (policy === 'last-write-wins') {
    const lu = updatedAtOf(localCampaign);
    const su = updatedAtOf(serverCampaign);
    const localWins = lu >= su;
    return {
      merged: localWins ? localCampaign : serverCampaign,
      winner: lu === su ? 'tie' : localWins ? 'local' : 'server',
      policy,
      localTick: lt,
      serverTick: st,
    };
  }

  // merge-by-tick: highest tick wins per branch; tie -> updatedAt.
  let localWins: boolean;
  let winner: MergeResult['winner'];
  if (lt > st) { localWins = true; winner = 'local'; }
  else if (st > lt) { localWins = false; winner = 'server'; }
  else {
    const lu = updatedAtOf(localCampaign);
    const su = updatedAtOf(serverCampaign);
    localWins = lu >= su;
    winner = lu === su ? 'tie' : localWins ? 'local' : 'server';
  }

  const merged = mergeBranch(localCampaign, serverCampaign, localWins) as CampaignData;
  // Always keep the higher tick on the merged record so downstream consumers
  // never regress the simulation clock.
  merged.currentTick = Math.max(lt, st, 0);
  if (merged.meta) {
    merged.meta.updatedAt = Math.max(updatedAtOf(localCampaign), updatedAtOf(serverCampaign), Date.now());
  }
  return { merged, winner, policy, localTick: lt, serverTick: st };
}
