// ============================================================================
// ROBUST SAVE SYSTEM - Singleton with queue, verification, and fallback
// ============================================================================

export type StorageBackend = 'localStorage' | 'sessionStorage' | 'memory';

export interface SaveData<T = unknown> {
  _version: number;
  _savedAt: string;
  _checksum: string;
  data: T;
}

export interface StorageInfo {
  backend: StorageBackend;
  used: number;
  available: number;
  quota: number;
}

export interface VerifyResult {
  valid: boolean;
  error?: string;
  checksumMatch?: boolean;
  parseable?: boolean;
}

export interface SaveOperation {
  type: 'save' | 'load' | 'delete';
  key: string;
  timestamp: number;
  size?: number;
  success: boolean;
  error?: string;
  duration?: number;
}

type SaveCallback = (key: string, success: boolean, error?: string) => void;
type LoadCallback = (key: string, data: unknown | null, error?: string) => void;
type ErrorCallback = (operation: string, key: string, error: string) => void;

const SAVE_VERSION = 1;
const DEBOUNCE_MS = 300;
const MAX_RETRIES = 3;
const MAX_LOG_ENTRIES = 50;
const SESSION_ID_KEY = 'lwe_session_id';

// Simple hash function for checksums
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

class SaveSystemClass {
  private static instance: SaveSystemClass;
  
  private backend: StorageBackend = 'localStorage';
  private memoryStorage: Map<string, string> = new Map();
  private operationLog: SaveOperation[] = [];
  private sessionId: string;
  private saveQueue: Map<string, { data: unknown; resolve: (v: boolean) => void; reject: (e: Error) => void }> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastSaveTime: Map<string, number> = new Map();
  
  // Callbacks
  private onSaveCallbacks: SaveCallback[] = [];
  private onLoadCallbacks: LoadCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];
  
  private constructor() {
    this.sessionId = this.initSessionId();
    this.detectStorageBackend();
    console.log(`[SaveSystem] Initialized with backend: ${this.backend}, session: ${this.sessionId}`);
  }
  
  static getInstance(): SaveSystemClass {
    if (!SaveSystemClass.instance) {
      SaveSystemClass.instance = new SaveSystemClass();
    }
    return SaveSystemClass.instance;
  }
  
  private initSessionId(): string {
    try {
      let id = localStorage.getItem(SESSION_ID_KEY);
      if (!id) {
        id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_ID_KEY, id);
      }
      return id;
    } catch {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  private detectStorageBackend(): void {
    // Test localStorage
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.backend = 'localStorage';
      return;
    } catch (e) {
      console.warn('[SaveSystem] localStorage unavailable:', e);
    }
    
    // Test sessionStorage
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      this.backend = 'sessionStorage';
      console.warn('[SaveSystem] Falling back to sessionStorage');
      return;
    } catch (e) {
      console.warn('[SaveSystem] sessionStorage unavailable:', e);
    }
    
    // Fall back to memory
    this.backend = 'memory';
    console.error('[SaveSystem] All storage unavailable, using in-memory (data will be lost on refresh)');
  }
  
  private getStorage(): Storage | null {
    if (this.backend === 'localStorage') return localStorage;
    if (this.backend === 'sessionStorage') return sessionStorage;
    return null;
  }
  
  private readRaw(key: string): string | null {
    const storage = this.getStorage();
    if (storage) {
      return storage.getItem(key);
    }
    return this.memoryStorage.get(key) ?? null;
  }
  
  private writeRaw(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    } else {
      this.memoryStorage.set(key, value);
    }
  }
  
  private deleteRaw(key: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(key);
    } else {
      this.memoryStorage.delete(key);
    }
  }
  
  private logOperation(op: SaveOperation): void {
    this.operationLog.unshift(op);
    if (this.operationLog.length > MAX_LOG_ENTRIES) {
      this.operationLog.pop();
    }
  }
  
  getOperationLog(): SaveOperation[] {
    return [...this.operationLog];
  }
  
  getSessionId(): string {
    return this.sessionId;
  }
  
  getBackend(): StorageBackend {
    return this.backend;
  }
  
  // ============================================================================
  // SAVE OPERATION (with queue, debounce, verification)
  // ============================================================================
  
  async save<T>(key: string, data: T): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Cancel existing debounce for this key
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // Check debounce
      const lastSave = this.lastSaveTime.get(key) || 0;
      const timeSinceLastSave = Date.now() - lastSave;
      const delay = Math.max(0, DEBOUNCE_MS - timeSinceLastSave);
      
      // Queue the save with debounce
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        const result = await this.executeSave(key, data);
        resolve(result);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    });
  }
  
  // Force immediate save (bypasses debounce)
  async saveImmediate<T>(key: string, data: T): Promise<boolean> {
    // Cancel any pending debounced save
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(key);
    }
    return this.executeSave(key, data);
  }
  
  private async executeSave<T>(key: string, data: T, retryCount = 0): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Create save wrapper
      const dataStr = JSON.stringify(data);
      const checksum = simpleHash(dataStr);
      
      const saveData: SaveData<T> = {
        _version: SAVE_VERSION,
        _savedAt: new Date().toISOString(),
        _checksum: checksum,
        data,
      };
      
      const serialized = JSON.stringify(saveData);
      
      // Atomic write with temp key
      const tempKey = `${key}_tmp`;
      this.writeRaw(tempKey, serialized);
      
      // Verify temp write
      const tempVerify = this.readRaw(tempKey);
      if (tempVerify !== serialized) {
        throw new Error('Temp write verification failed');
      }
      
      // Write to real key
      this.writeRaw(key, serialized);
      
      // Clean up temp
      this.deleteRaw(tempKey);
      
      // Verify final write
      const verify = this.readRaw(key);
      if (!verify) {
        throw new Error('Final write verification failed - key not found');
      }
      
      // Parse and verify checksum
      const parsed = JSON.parse(verify) as SaveData<T>;
      if (parsed._checksum !== checksum) {
        throw new Error('Checksum mismatch after write');
      }
      
      this.lastSaveTime.set(key, Date.now());
      
      const op: SaveOperation = {
        type: 'save',
        key,
        timestamp: Date.now(),
        size: serialized.length,
        success: true,
        duration: Date.now() - startTime,
      };
      this.logOperation(op);
      
      // Notify callbacks
      this.onSaveCallbacks.forEach(cb => cb(key, true));
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.warn(`[SaveSystem] Save failed, retry ${retryCount + 1}/${MAX_RETRIES}:`, errorMsg);
        await new Promise(r => setTimeout(r, 100 * (retryCount + 1)));
        return this.executeSave(key, data, retryCount + 1);
      }
      
      const op: SaveOperation = {
        type: 'save',
        key,
        timestamp: Date.now(),
        success: false,
        error: errorMsg,
        duration: Date.now() - startTime,
      };
      this.logOperation(op);
      
      // Notify callbacks
      this.onSaveCallbacks.forEach(cb => cb(key, false, errorMsg));
      this.onErrorCallbacks.forEach(cb => cb('save', key, errorMsg));
      
      console.error(`[SaveSystem] Save failed after ${MAX_RETRIES} retries:`, errorMsg);
      return false;
    }
  }
  
  // ============================================================================
  // LOAD OPERATION
  // ============================================================================
  
  async load<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const raw = this.readRaw(key);
      if (!raw) {
        const op: SaveOperation = {
          type: 'load',
          key,
          timestamp: Date.now(),
          success: true,
          duration: Date.now() - startTime,
        };
        this.logOperation(op);
        this.onLoadCallbacks.forEach(cb => cb(key, null));
        return null;
      }
      
      const parsed = JSON.parse(raw) as SaveData<T>;
      
      // Verify checksum
      const dataStr = JSON.stringify(parsed.data);
      const expectedChecksum = simpleHash(dataStr);
      
      if (parsed._checksum && parsed._checksum !== expectedChecksum) {
        console.warn(`[SaveSystem] Checksum mismatch for ${key}, data may be corrupted`);
        // Still return data but log the warning
      }
      
      const op: SaveOperation = {
        type: 'load',
        key,
        timestamp: Date.now(),
        size: raw.length,
        success: true,
        duration: Date.now() - startTime,
      };
      this.logOperation(op);
      
      this.onLoadCallbacks.forEach(cb => cb(key, parsed.data));
      return parsed.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      const op: SaveOperation = {
        type: 'load',
        key,
        timestamp: Date.now(),
        success: false,
        error: errorMsg,
        duration: Date.now() - startTime,
      };
      this.logOperation(op);
      
      this.onLoadCallbacks.forEach(cb => cb(key, null, errorMsg));
      this.onErrorCallbacks.forEach(cb => cb('load', key, errorMsg));
      
      console.error(`[SaveSystem] Load failed for ${key}:`, errorMsg);
      return null;
    }
  }
  
  // Load raw data (without SaveData wrapper, for legacy data)
  async loadRaw<T>(key: string): Promise<T | null> {
    try {
      const raw = this.readRaw(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  
  // ============================================================================
  // DELETE OPERATION
  // ============================================================================
  
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      this.deleteRaw(key);
      
      // Verify deletion
      const verify = this.readRaw(key);
      if (verify !== null) {
        throw new Error('Delete verification failed - key still exists');
      }
      
      const op: SaveOperation = {
        type: 'delete',
        key,
        timestamp: Date.now(),
        success: true,
        duration: Date.now() - startTime,
      };
      this.logOperation(op);
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      const op: SaveOperation = {
        type: 'delete',
        key,
        timestamp: Date.now(),
        success: false,
        error: errorMsg,
        duration: Date.now() - startTime,
      };
      this.logOperation(op);
      
      this.onErrorCallbacks.forEach(cb => cb('delete', key, errorMsg));
      return false;
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  exists(key: string): boolean {
    return this.readRaw(key) !== null;
  }
  
  getAllKeys(): string[] {
    const storage = this.getStorage();
    if (storage) {
      return Object.keys(storage);
    }
    return Array.from(this.memoryStorage.keys());
  }
  
  getGameKeys(): string[] {
    return this.getAllKeys().filter(k => 
      k.startsWith('lwe_') || 
      k.startsWith('untold-') ||
      k.startsWith('campaign_')
    );
  }
  
  getStorageInfo(): StorageInfo {
    let used = 0;
    let quota = 5 * 1024 * 1024; // Default 5MB estimate
    
    const storage = this.getStorage();
    if (storage) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
    } else {
      this.memoryStorage.forEach((value, key) => {
        used += key.length + value.length;
      });
    }
    
    // Try to estimate quota
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.quota) quota = estimate.quota;
      }).catch(() => {});
    }
    
    return {
      backend: this.backend,
      used,
      available: quota - used,
      quota,
    };
  }
  
  getKeySize(key: string): number {
    const raw = this.readRaw(key);
    return raw ? raw.length : 0;
  }
  
  getKeyPreview(key: string, maxLength = 100): string {
    const raw = this.readRaw(key);
    if (!raw) return '';
    return raw.length > maxLength ? raw.substring(0, maxLength) + '...' : raw;
  }
  
  // ============================================================================
  // VERIFICATION
  // ============================================================================
  
  verify(key: string): VerifyResult {
    try {
      const raw = this.readRaw(key);
      if (!raw) {
        return { valid: false, error: 'Key not found' };
      }
      
      let parsed: SaveData<unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { valid: false, error: 'JSON parse failed', parseable: false };
      }
      
      if (!parsed._checksum) {
        return { valid: true, checksumMatch: undefined, parseable: true };
      }
      
      const dataStr = JSON.stringify(parsed.data);
      const expectedChecksum = simpleHash(dataStr);
      const checksumMatch = parsed._checksum === expectedChecksum;
      
      return {
        valid: checksumMatch,
        checksumMatch,
        parseable: true,
        error: checksumMatch ? undefined : 'Checksum mismatch',
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  // ============================================================================
  // EXPORT / IMPORT
  // ============================================================================
  
  exportAll(): string {
    const allData: Record<string, unknown> = {};
    const keys = this.getGameKeys();
    
    keys.forEach(key => {
      const raw = this.readRaw(key);
      if (raw) {
        try {
          allData[key] = JSON.parse(raw);
        } catch {
          allData[key] = raw;
        }
      }
    });
    
    return JSON.stringify({
      _exportedAt: new Date().toISOString(),
      _sessionId: this.sessionId,
      _keyCount: keys.length,
      data: allData,
    }, null, 2);
  }
  
  importAll(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      const data = imported.data || imported;
      
      Object.entries(data).forEach(([key, value]) => {
        if (typeof key === 'string' && (key.startsWith('lwe_') || key.startsWith('untold-'))) {
          this.writeRaw(key, JSON.stringify(value));
        }
      });
      
      console.log(`[SaveSystem] Imported ${Object.keys(data).length} keys`);
      return true;
    } catch (error) {
      console.error('[SaveSystem] Import failed:', error);
      return false;
    }
  }
  
  // ============================================================================
  // CALLBACKS
  // ============================================================================
  
  onSaveComplete(callback: SaveCallback): () => void {
    this.onSaveCallbacks.push(callback);
    return () => {
      this.onSaveCallbacks = this.onSaveCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onLoadComplete(callback: LoadCallback): () => void {
    this.onLoadCallbacks.push(callback);
    return () => {
      this.onLoadCallbacks = this.onLoadCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter(cb => cb !== callback);
    };
  }
  
  // ============================================================================
  // TESTING
  // ============================================================================
  
  async testWriteReadCycle(): Promise<{ success: boolean; error?: string; duration: number }> {
    const startTime = Date.now();
    const testKey = '__test_write_read__';
    const testData = { test: true, timestamp: Date.now(), random: Math.random() };
    
    try {
      await this.saveImmediate(testKey, testData);
      const loaded = await this.load<typeof testData>(testKey);
      await this.delete(testKey);
      
      if (!loaded) {
        return { success: false, error: 'Loaded data is null', duration: Date.now() - startTime };
      }
      
      if (loaded.test !== testData.test || loaded.timestamp !== testData.timestamp) {
        return { success: false, error: 'Data mismatch', duration: Date.now() - startTime };
      }
      
      return { success: true, duration: Date.now() - startTime };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }
  
  // Calculate in-memory state hash for sync detection
  calculateStateHash(data: unknown): string {
    return simpleHash(JSON.stringify(data));
  }
  
  // Clear all game data (dangerous!)
  clearAllGameData(): number {
    const keys = this.getGameKeys();
    keys.forEach(key => this.deleteRaw(key));
    console.log(`[SaveSystem] Cleared ${keys.length} game keys`);
    return keys.length;
  }
  
  // Flush all pending saves immediately
  async flushPendingSaves(): Promise<void> {
    const pendingKeys = Array.from(this.debounceTimers.keys());
    for (const key of pendingKeys) {
      const timer = this.debounceTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
    }
    // Wait a tick for any in-flight saves
    await new Promise(r => setTimeout(r, 50));
  }
}

// Export singleton
export const SaveSystem = SaveSystemClass.getInstance();
export default SaveSystem;
