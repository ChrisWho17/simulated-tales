// ============================================================================
// INDEXEDDB CACHE - Persistent browser cache for save data redundancy
// ============================================================================

const DB_NAME = 'UntoldStoriesCache';
const DB_VERSION = 1;
const SAVES_STORE = 'saves';
const BACKUP_STORE = 'backups';

export interface CachedSave {
  id: string;
  data: string; // Compressed campaign data
  checksum: string;
  savedAt: number;
  source: 'local' | 'cloud';
}

export interface CacheBackup {
  id: string;
  saves: CachedSave[];
  createdAt: number;
}

class IndexedDBCacheClass {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<boolean> | null = null;
  private isAvailable = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('[IndexedDBCache] IndexedDB not available');
        resolve(false);
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('[IndexedDBCache] Failed to open database:', request.error);
          this.isAvailable = false;
          resolve(false);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isAvailable = true;
          console.log('[IndexedDBCache] Database initialized successfully');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create saves store
          if (!db.objectStoreNames.contains(SAVES_STORE)) {
            const savesStore = db.createObjectStore(SAVES_STORE, { keyPath: 'id' });
            savesStore.createIndex('savedAt', 'savedAt', { unique: false });
            savesStore.createIndex('source', 'source', { unique: false });
          }

          // Create backups store for periodic snapshots
          if (!db.objectStoreNames.contains(BACKUP_STORE)) {
            const backupStore = db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
            backupStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };
      } catch (e) {
        console.error('[IndexedDBCache] Error initializing:', e);
        resolve(false);
      }
    });

    return this.initPromise;
  }

  isReady(): boolean {
    return this.isAvailable && this.db !== null;
  }

  // ============================================================================
  // SAVE OPERATIONS
  // ============================================================================

  async cacheSave(id: string, data: string, checksum: string, source: 'local' | 'cloud' = 'local'): Promise<boolean> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([SAVES_STORE], 'readwrite');
        const store = transaction.objectStore(SAVES_STORE);

        const cachedSave: CachedSave = {
          id,
          data,
          checksum,
          savedAt: Date.now(),
          source,
        };

        const request = store.put(cachedSave);

        request.onsuccess = () => {
          console.log(`[IndexedDBCache] Cached save: ${id}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Cache save error:', request.error);
          resolve(false);
        };
      } catch (e) {
        console.error('[IndexedDBCache] Cache save failed:', e);
        resolve(false);
      }
    });
  }

  async getCachedSave(id: string): Promise<CachedSave | null> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return null;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([SAVES_STORE], 'readonly');
        const store = transaction.objectStore(SAVES_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Get cached save error:', request.error);
          resolve(null);
        };
      } catch (e) {
        console.error('[IndexedDBCache] Get cached save failed:', e);
        resolve(null);
      }
    });
  }

  async getAllCachedSaves(): Promise<CachedSave[]> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return [];
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([SAVES_STORE], 'readonly');
        const store = transaction.objectStore(SAVES_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Get all cached saves error:', request.error);
          resolve([]);
        };
      } catch (e) {
        console.error('[IndexedDBCache] Get all cached saves failed:', e);
        resolve([]);
      }
    });
  }

  async deleteCachedSave(id: string): Promise<boolean> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([SAVES_STORE], 'readwrite');
        const store = transaction.objectStore(SAVES_STORE);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log(`[IndexedDBCache] Deleted cached save: ${id}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Delete cached save error:', request.error);
          resolve(false);
        };
      } catch (e) {
        console.error('[IndexedDBCache] Delete cached save failed:', e);
        resolve(false);
      }
    });
  }

  // ============================================================================
  // BACKUP OPERATIONS - Periodic full snapshots
  // ============================================================================

  async createBackup(): Promise<boolean> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return false;
    }

    try {
      const allSaves = await this.getAllCachedSaves();
      
      if (allSaves.length === 0) {
        console.log('[IndexedDBCache] No saves to backup');
        return true;
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([BACKUP_STORE], 'readwrite');
        const store = transaction.objectStore(BACKUP_STORE);

        const backup: CacheBackup = {
          id: `backup_${Date.now()}`,
          saves: allSaves,
          createdAt: Date.now(),
        };

        const request = store.put(backup);

        request.onsuccess = () => {
          console.log(`[IndexedDBCache] Created backup with ${allSaves.length} saves`);
          // Clean up old backups (keep last 5)
          this.cleanupOldBackups();
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Create backup error:', request.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.error('[IndexedDBCache] Create backup failed:', e);
      return false;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    if (!this.isReady()) return;

    try {
      const transaction = this.db!.transaction([BACKUP_STORE], 'readwrite');
      const store = transaction.objectStore(BACKUP_STORE);
      const index = store.index('createdAt');
      const request = index.getAll();

      request.onsuccess = () => {
        const backups = request.result as CacheBackup[];
        if (backups.length > 5) {
          // Sort by createdAt descending
          backups.sort((a, b) => b.createdAt - a.createdAt);
          
          // Delete oldest backups beyond 5
          for (let i = 5; i < backups.length; i++) {
            store.delete(backups[i].id);
          }
          console.log(`[IndexedDBCache] Cleaned up ${backups.length - 5} old backups`);
        }
      };
    } catch (e) {
      console.error('[IndexedDBCache] Cleanup backups failed:', e);
    }
  }

  async getLatestBackup(): Promise<CacheBackup | null> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return null;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([BACKUP_STORE], 'readonly');
        const store = transaction.objectStore(BACKUP_STORE);
        const index = store.index('createdAt');
        const request = index.openCursor(null, 'prev');

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            resolve(cursor.value);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDBCache] Get latest backup error:', request.error);
          resolve(null);
        };
      } catch (e) {
        console.error('[IndexedDBCache] Get latest backup failed:', e);
        resolve(null);
      }
    });
  }

  async restoreFromBackup(backupId?: string): Promise<number> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return 0;
    }

    try {
      let backup: CacheBackup | null = null;

      if (backupId) {
        // Get specific backup
        backup = await new Promise((resolve) => {
          const transaction = this.db!.transaction([BACKUP_STORE], 'readonly');
          const store = transaction.objectStore(BACKUP_STORE);
          const request = store.get(backupId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        });
      } else {
        // Get latest backup
        backup = await this.getLatestBackup();
      }

      if (!backup || !backup.saves.length) {
        console.log('[IndexedDBCache] No backup to restore');
        return 0;
      }

      // Restore all saves from backup
      let restored = 0;
      for (const save of backup.saves) {
        const success = await this.cacheSave(save.id, save.data, save.checksum, save.source);
        if (success) restored++;
      }

      console.log(`[IndexedDBCache] Restored ${restored} saves from backup`);
      return restored;
    } catch (e) {
      console.error('[IndexedDBCache] Restore from backup failed:', e);
      return 0;
    }
  }

  // ============================================================================
  // RECOVERY OPERATIONS
  // ============================================================================

  /**
   * Attempt to recover a save that might be missing from localStorage
   * but exists in IndexedDB cache
   */
  async recoverMissingSave(id: string): Promise<string | null> {
    const cached = await this.getCachedSave(id);
    if (cached) {
      console.log(`[IndexedDBCache] Recovered save from cache: ${id}`);
      return cached.data;
    }

    // Try to find in latest backup
    const backup = await this.getLatestBackup();
    if (backup) {
      const savedInBackup = backup.saves.find(s => s.id === id);
      if (savedInBackup) {
        console.log(`[IndexedDBCache] Recovered save from backup: ${id}`);
        return savedInBackup.data;
      }
    }

    return null;
  }

  /**
   * Sync localStorage saves to IndexedDB cache
   */
  async syncFromLocalStorage(keyPrefix: string, getChecksum: (data: string) => string): Promise<number> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return 0;
    }

    let synced = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(keyPrefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            const checksum = getChecksum(data);
            const id = key.replace(keyPrefix, '');
            const success = await this.cacheSave(id, data, checksum, 'local');
            if (success) synced++;
          }
        }
      }
      console.log(`[IndexedDBCache] Synced ${synced} saves from localStorage`);
    } catch (e) {
      console.error('[IndexedDBCache] Sync from localStorage failed:', e);
    }
    return synced;
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<boolean> {
    if (!this.isReady()) {
      await this.initialize();
      if (!this.isReady()) return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([SAVES_STORE, BACKUP_STORE], 'readwrite');
        
        transaction.objectStore(SAVES_STORE).clear();
        transaction.objectStore(BACKUP_STORE).clear();

        transaction.oncomplete = () => {
          console.log('[IndexedDBCache] Cleared all cached data');
          resolve(true);
        };

        transaction.onerror = () => {
          console.error('[IndexedDBCache] Clear all error:', transaction.error);
          resolve(false);
        };
      } catch (e) {
        console.error('[IndexedDBCache] Clear all failed:', e);
        resolve(false);
      }
    });
  }

  // ============================================================================
  // DIAGNOSTICS
  // ============================================================================

  async getDiagnostics(): Promise<{
    isAvailable: boolean;
    saveCount: number;
    backupCount: number;
    latestBackupDate: string | null;
    totalSize: number;
  }> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.isReady()) {
      return {
        isAvailable: false,
        saveCount: 0,
        backupCount: 0,
        latestBackupDate: null,
        totalSize: 0,
      };
    }

    try {
      const saves = await this.getAllCachedSaves();
      const backup = await this.getLatestBackup();
      
      // Estimate total size
      let totalSize = 0;
      for (const save of saves) {
        totalSize += save.data.length + save.id.length + save.checksum.length;
      }

      // Count backups
      const backupCount = await new Promise<number>((resolve) => {
        const transaction = this.db!.transaction([BACKUP_STORE], 'readonly');
        const store = transaction.objectStore(BACKUP_STORE);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      return {
        isAvailable: true,
        saveCount: saves.length,
        backupCount,
        latestBackupDate: backup ? new Date(backup.createdAt).toISOString() : null,
        totalSize,
      };
    } catch (e) {
      console.error('[IndexedDBCache] Diagnostics failed:', e);
      return {
        isAvailable: false,
        saveCount: 0,
        backupCount: 0,
        latestBackupDate: null,
        totalSize: 0,
      };
    }
  }
}

// Singleton instance
export const IndexedDBCache = new IndexedDBCacheClass();

// Initialize on load
IndexedDBCache.initialize().catch(console.error);
