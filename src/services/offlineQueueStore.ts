// ============================================================================
// OFFLINE QUEUE STORE — versioned IndexedDB persistence for queued sync ops
// ============================================================================
// Why a dedicated store:
//   - localStorage is synchronous and capped at ~5MB; large compressed saves
//     blow that budget quickly.
//   - We need durable, deduped, monotonic ordering that survives multiple
//     reloads and concurrent background-sync attempts without losing or
//     double-flushing events.
//
// Schema:
//   key:    `op_<seq>` (seq = monotonically increasing across reloads)
//   value:  StoredOperation
// Metadata key: `__meta` -> { schemaVersion, seq, migratedFromLocalStorage }
//
// Dedup contract: at most one queued op per (campaignId, type). Newer wins,
// older is dropped — the seq column preserves submission order.

import { createStore, get, set, del, keys, getMany, clear } from 'idb-keyval';

const DB_NAME = 'untold-offline-queue';
const STORE_NAME = 'queue';
const META_KEY = '__meta';
const LEGACY_LS_KEY = 'untold_offline_queue';
export const OFFLINE_QUEUE_SCHEMA_VERSION = 1;

const store =
  typeof indexedDB !== 'undefined'
    ? createStore(DB_NAME, STORE_NAME)
    : (null as unknown as ReturnType<typeof createStore>);

export interface StoredOperation {
  id: string;                 // stable operation id
  seq: number;                // monotonic per-store; ordering source of truth
  campaignId: string;
  type: 'save' | 'delete' | 'sync';
  priority: 'high' | 'normal' | 'low';
  data?: string;              // compressed campaign payload
  checksum?: string;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  metadata?: { campaignName?: string; characterName?: string };
  // Used by conflict-resolution: snapshot of the in-game tick at enqueue time.
  tick?: number;
}

interface QueueMeta {
  schemaVersion: number;
  seq: number;
  migratedFromLocalStorage?: boolean;
}

function entryKey(seq: number): string {
  return `op_${String(seq).padStart(12, '0')}`;
}

async function readMeta(): Promise<QueueMeta> {
  if (!store) return { schemaVersion: OFFLINE_QUEUE_SCHEMA_VERSION, seq: 0 };
  const m = (await get<QueueMeta>(META_KEY, store)) ?? null;
  if (m && typeof m.seq === 'number') return m;
  const fresh: QueueMeta = { schemaVersion: OFFLINE_QUEUE_SCHEMA_VERSION, seq: 0 };
  await set(META_KEY, fresh, store);
  return fresh;
}

async function writeMeta(meta: QueueMeta): Promise<void> {
  if (!store) return;
  await set(META_KEY, meta, store);
}

async function nextSeq(): Promise<number> {
  const meta = await readMeta();
  const next = meta.seq + 1;
  await writeMeta({ ...meta, seq: next });
  return next;
}

async function migrateFromLocalStorageOnce(): Promise<void> {
  if (!store || typeof localStorage === 'undefined') return;
  const meta = await readMeta();
  if (meta.migratedFromLocalStorage) return;
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Omit<StoredOperation, 'seq'>>;
      if (Array.isArray(parsed)) {
        for (const op of parsed) {
          // Dedup against anything already there.
          await enqueueOperation(op as StoredOperation);
        }
      }
      localStorage.removeItem(LEGACY_LS_KEY);
    }
  } catch {
    /* ignore — best-effort migration */
  }
  await writeMeta({ ...(await readMeta()), migratedFromLocalStorage: true });
}

let initPromise: Promise<void> | null = null;
export function initOfflineQueue(): Promise<void> {
  if (!initPromise) initPromise = migrateFromLocalStorageOnce();
  return initPromise;
}

function priorityValue(p: StoredOperation['priority']): number {
  return p === 'high' ? 3 : p === 'low' ? 1 : 2;
}

/**
 * Enqueue or replace an operation. Dedups by (campaignId, type) — the latest
 * submission wins so we never double-apply the same logical save.
 */
export async function enqueueOperation(op: StoredOperation): Promise<StoredOperation> {
  if (!store) return op;
  await initOfflineQueue();
  // Remove any prior op with the same dedup key.
  const all = await listOperations();
  for (const existing of all) {
    if (existing.campaignId === op.campaignId && existing.type === op.type) {
      await del(entryKey(existing.seq), store);
    }
  }
  const seq = await nextSeq();
  const stored: StoredOperation = { ...op, seq };
  await set(entryKey(seq), stored, store);
  return stored;
}

export async function removeOperation(seq: number): Promise<void> {
  if (!store) return;
  await del(entryKey(seq), store);
}

export async function removeOperationById(id: string): Promise<void> {
  if (!store) return;
  const all = await listOperations();
  const target = all.find((o) => o.id === id);
  if (target) await del(entryKey(target.seq), store);
}

export async function listOperations(): Promise<StoredOperation[]> {
  if (!store) return [];
  const ks = (await keys(store)).filter(
    (k): k is string => typeof k === 'string' && k.startsWith('op_'),
  );
  if (ks.length === 0) return [];
  const values = await getMany<StoredOperation>(ks, store);
  return values
    .filter(Boolean)
    .sort((a, b) => {
      // High priority first, then FIFO by seq for stability.
      const dp = priorityValue(b.priority) - priorityValue(a.priority);
      return dp !== 0 ? dp : a.seq - b.seq;
    });
}

export async function clearOperations(): Promise<void> {
  if (!store) return;
  await clear(store);
  await writeMeta({ schemaVersion: OFFLINE_QUEUE_SCHEMA_VERSION, seq: 0, migratedFromLocalStorage: true });
}

export async function getQueueStats(): Promise<{ count: number; schemaVersion: number; seq: number }> {
  const meta = await readMeta();
  const ops = await listOperations();
  return { count: ops.length, schemaVersion: meta.schemaVersion, seq: meta.seq };
}
