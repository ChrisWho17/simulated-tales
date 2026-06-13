// ============================================================================
// BIG KV STORE — IndexedDB-backed storage for large blobs (campaigns, WAL, etc.)
//
// localStorage is capped at ~5–10 MB and was overflowing on lwe_wal / lwe_campaign_*.
// This module persists those large keys to IndexedDB instead, while keeping a
// synchronous in-memory mirror so existing call sites that read/write
// synchronously (the legacy localStorage pattern) keep working.
//
// Migration: on init(), any matching legacy localStorage entries are copied
// into IDB and then removed from localStorage to free quota.
// ============================================================================

const DB_NAME = 'lwe_bigkv';
const STORE = 'blobs';
const DB_VERSION = 1;

// Key prefixes we own (also: bare "lwe_wal", which is matched explicitly).
const OWNED_PREFIXES = [
  'lwe_campaign_',
  'lwe_inventory_',
  'lwe_gamestate_',
];
const OWNED_EXACT = new Set<string>([
  'lwe_wal',
  'lwe_backup_cache',
]);

export function isBigKey(key: string): boolean {
  if (OWNED_EXACT.has(key)) return true;
  // Skip lwe_campaign_index — that's a tiny array kept in localStorage.
  if (key === 'lwe_campaign_index') return false;
  return OWNED_PREFIXES.some(p => key.startsWith(p));
}

// In-memory mirror so sync getters work after init.
const mirror = new Map<string, string>();
let dbPromise: Promise<IDBDatabase> | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbAllKeys(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
    req.onerror = () => reject(req.error);
  });
}

// ============================================================================
// INIT — preload mirror from IDB + migrate legacy localStorage entries
// ============================================================================

export function initBigKV(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await openDB();

      // 1. Load existing IDB entries into mirror
      const keys = await idbAllKeys();
      for (const key of keys) {
        try {
          const val = await idbGet(key);
          if (val != null) mirror.set(key, val);
        } catch {
          /* skip corrupted */
        }
      }

      // 2. Migrate matching localStorage entries to IDB, then remove
      const toMigrate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && isBigKey(k)) toMigrate.push(k);
      }

      let migrated = 0;
      for (const k of toMigrate) {
        try {
          const v = localStorage.getItem(k);
          if (v == null) continue;
          await idbPut(k, v);
          mirror.set(k, v);
          localStorage.removeItem(k);
          migrated++;
        } catch (e) {
          console.warn('[BigKV] migration skipped for', k, e);
        }
      }

      initialized = true;
      if (migrated > 0) {
        console.log(`[BigKV] Migrated ${migrated} large entries from localStorage to IndexedDB`);
      } else {
        console.log('[BigKV] Initialized (no migration needed)');
      }
    } catch (e) {
      console.warn('[BigKV] Init failed, falling back to localStorage:', e);
      // mirror stays empty; getBig/setBig will defer to localStorage.
    }
  })();
  return initPromise;
}

// ============================================================================
// PUBLIC SYNC-LOOKING API
// Reads come from in-memory mirror. Writes update mirror immediately and
// persist to IDB asynchronously (fire-and-forget). For unknown keys or when
// IDB is unavailable, we fall back to localStorage.
// ============================================================================

export function getBig(key: string): string | null {
  if (!isBigKey(key)) return localStorage.getItem(key);
  if (mirror.has(key)) return mirror.get(key) ?? null;
  // Fallback: maybe init didn't run yet or IDB unavailable.
  return localStorage.getItem(key);
}

export function setBig(key: string, value: string): void {
  if (!isBigKey(key)) {
    localStorage.setItem(key, value);
    return;
  }
  mirror.set(key, value);
  if (initialized) {
    void idbPut(key, value).catch(err => {
      console.error('[BigKV] persist failed for', key, err);
    });
  } else {
    // Init hasn't finished — defer persist after init.
    void initBigKV().then(() => idbPut(key, value)).catch(err => {
      console.error('[BigKV] deferred persist failed for', key, err);
    });
  }
}

export function delBig(key: string): void {
  if (!isBigKey(key)) {
    localStorage.removeItem(key);
    return;
  }
  mirror.delete(key);
  // Also clean any stale localStorage copy.
  try { localStorage.removeItem(key); } catch { /* noop */ }
  if (initialized) {
    void idbDel(key).catch(err => {
      console.error('[BigKV] delete failed for', key, err);
    });
  }
}

export function listBigKeys(prefix?: string): string[] {
  const keys = Array.from(mirror.keys());
  return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
}

export async function estimateStorage(): Promise<StorageEstimate | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  try {
    const est = await navigator.storage.estimate();
    const usage = est.usage ?? 0;
    const quota = est.quota ?? 0;
    return {
      usageBytes: usage,
      quotaBytes: quota,
      usagePercent: quota > 0 ? (usage / quota) * 100 : 0,
    };
  } catch {
    return null;
  }
}

export function bigKVStats(): { entries: number; bytes: number } {
  let bytes = 0;
  for (const v of mirror.values()) bytes += v.length;
  return { entries: mirror.size, bytes };
}
