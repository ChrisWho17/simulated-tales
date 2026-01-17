// ============================================================================
// STORAGE HEALTH MONITOR - Background backup, auto-recovery, health tracking
// ============================================================================

import { IndexedDBCache, CachedSave } from '@/lib/indexedDBCache';
import LZString from 'lz-string';

// ============================================================================
// TYPES
// ============================================================================

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface StorageHealth {
  status: HealthStatus;
  localStorageAvailable: boolean;
  indexedDBAvailable: boolean;
  lastBackupTime: number | null;
  lastBackupAge: string;
  backupCount: number;
  cachedSaveCount: number;
  quotaUsedPercent: number;
  quotaUsedBytes: number;
  quotaTotalBytes: number;
  issues: string[];
  recommendations: string[];
}

export interface RecoveryResult {
  success: boolean;
  campaignId: string;
  source: 'cache' | 'backup' | 'none';
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BACKUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const HEALTH_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
const QUOTA_WARNING_THRESHOLD = 0.8; // 80%
const QUOTA_CRITICAL_THRESHOLD = 0.95; // 95%
const MAX_BACKUP_AGE_MS = 30 * 60 * 1000; // 30 minutes = stale warning

const GUEST_PREFIX = 'guest_local_';
const HEALTH_STATUS_KEY = 'lwe_storage_health';
const LAST_BACKUP_KEY = 'lwe_last_backup_time';

// ============================================================================
// STORAGE HEALTH MONITOR CLASS
// ============================================================================

class StorageHealthMonitorClass {
  private backupInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthCallbacks: Set<(health: StorageHealth) => void> = new Set();
  private currentHealth: StorageHealth | null = null;
  private initialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[StorageHealth] Initializing...');

    // Initialize IndexedDB cache
    await IndexedDBCache.initialize();

    // Sync existing localStorage saves to IndexedDB
    await this.syncLocalStorageToCache();

    // Start background processes
    this.startBackgroundBackups();
    this.startHealthChecks();

    // Initial health check
    await this.checkHealth();

    this.initialized = true;
    console.log('[StorageHealth] Initialized successfully');
  }

  shutdown(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('[StorageHealth] Shutdown complete');
  }

  // ============================================================================
  // BACKGROUND BACKUPS
  // ============================================================================

  private startBackgroundBackups(): void {
    // Clear existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Run initial backup after a short delay
    setTimeout(() => this.performBackup(), 5000);

    // Schedule periodic backups
    this.backupInterval = setInterval(() => {
      this.performBackup();
    }, BACKUP_INTERVAL_MS);

    console.log(`[StorageHealth] Background backups scheduled every ${BACKUP_INTERVAL_MS / 60000} minutes`);
  }

  private async performBackup(): Promise<boolean> {
    console.log('[StorageHealth] Performing background backup...');

    try {
      // First sync localStorage to cache
      await this.syncLocalStorageToCache();

      // Create backup snapshot
      const success = await IndexedDBCache.createBackup();

      if (success) {
        const now = Date.now();
        try {
          localStorage.setItem(LAST_BACKUP_KEY, now.toString());
        } catch {
          // Ignore localStorage errors
        }
        console.log('[StorageHealth] Background backup completed');
        
        // Refresh health status
        await this.checkHealth();
      }

      return success;
    } catch (e) {
      console.error('[StorageHealth] Background backup failed:', e);
      return false;
    }
  }

  private async syncLocalStorageToCache(): Promise<number> {
    let synced = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GUEST_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const campaignId = key.replace(GUEST_PREFIX, '');
            const checksum = this.generateChecksum(data);
            await IndexedDBCache.cacheSave(campaignId, data, checksum, 'local');
            synced++;
          }
        }
      }
    } catch (e) {
      console.warn('[StorageHealth] Sync to cache partially failed:', e);
    }
    return synced;
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  async checkHealth(): Promise<StorageHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check localStorage
    let localStorageAvailable = false;
    try {
      const testKey = '__health_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      localStorageAvailable = true;
    } catch {
      issues.push('localStorage is unavailable');
      recommendations.push('Enable cookies/storage in browser settings');
    }

    // Check IndexedDB
    const indexedDBAvailable = IndexedDBCache.isReady();
    if (!indexedDBAvailable) {
      issues.push('IndexedDB cache is unavailable');
      recommendations.push('IndexedDB provides backup protection - try refreshing the page');
    }

    // Get cache diagnostics
    const diagnostics = await IndexedDBCache.getDiagnostics();

    // Check quota usage
    let quotaUsedBytes = 0;
    let quotaTotalBytes = 5 * 1024 * 1024; // Default 5MB

    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        quotaUsedBytes = estimate.usage || 0;
        quotaTotalBytes = estimate.quota || quotaTotalBytes;
      } else {
        // Fallback: estimate from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              quotaUsedBytes += key.length * 2 + value.length * 2; // UTF-16
            }
          }
        }
      }
    } catch {
      // Ignore estimation errors
    }

    const quotaUsedPercent = quotaTotalBytes > 0 ? quotaUsedBytes / quotaTotalBytes : 0;

    if (quotaUsedPercent >= QUOTA_CRITICAL_THRESHOLD) {
      issues.push('Storage is almost full (95%+)');
      recommendations.push('Export saves to file and delete old campaigns');
    } else if (quotaUsedPercent >= QUOTA_WARNING_THRESHOLD) {
      issues.push('Storage usage is high (80%+)');
      recommendations.push('Consider exporting saves or cleaning up old data');
    }

    // Check backup age
    let lastBackupTime: number | null = null;
    try {
      const stored = localStorage.getItem(LAST_BACKUP_KEY);
      if (stored) {
        lastBackupTime = parseInt(stored, 10);
      }
    } catch {
      // Ignore
    }

    const lastBackupAge = lastBackupTime 
      ? this.formatTimeAgo(lastBackupTime)
      : 'Never';

    if (lastBackupTime && Date.now() - lastBackupTime > MAX_BACKUP_AGE_MS) {
      issues.push('Last backup is over 30 minutes old');
      recommendations.push('Background backups may be paused - keep the game open');
    }

    // Determine overall status
    let status: HealthStatus = 'healthy';
    if (!localStorageAvailable) {
      status = 'critical';
    } else if (quotaUsedPercent >= QUOTA_CRITICAL_THRESHOLD) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    // Add positive recommendations
    if (status === 'healthy') {
      recommendations.push('Storage is healthy - regular backups active');
    }

    const health: StorageHealth = {
      status,
      localStorageAvailable,
      indexedDBAvailable,
      lastBackupTime,
      lastBackupAge,
      backupCount: diagnostics.backupCount,
      cachedSaveCount: diagnostics.saveCount,
      quotaUsedPercent: Math.round(quotaUsedPercent * 100),
      quotaUsedBytes,
      quotaTotalBytes,
      issues,
      recommendations,
    };

    this.currentHealth = health;
    this.notifyHealthChange(health);

    // Cache health status
    try {
      localStorage.setItem(HEALTH_STATUS_KEY, JSON.stringify({
        status: health.status,
        lastCheck: Date.now(),
      }));
    } catch {
      // Ignore
    }

    return health;
  }

  getHealth(): StorageHealth | null {
    return this.currentHealth;
  }

  onHealthChange(callback: (health: StorageHealth) => void): () => void {
    this.healthCallbacks.add(callback);
    // Send current health immediately
    if (this.currentHealth) {
      callback(this.currentHealth);
    }
    return () => this.healthCallbacks.delete(callback);
  }

  private notifyHealthChange(health: StorageHealth): void {
    this.healthCallbacks.forEach(cb => cb(health));
  }

  // ============================================================================
  // AUTO-RECOVERY
  // ============================================================================

  async attemptRecovery(campaignId: string): Promise<RecoveryResult> {
    console.log(`[StorageHealth] Attempting recovery for: ${campaignId}`);

    // Step 1: Check IndexedDB cache
    const cached = await IndexedDBCache.getCachedSave(campaignId);
    if (cached) {
      console.log('[StorageHealth] Found save in IndexedDB cache');
      
      // Restore to localStorage
      const restored = await this.restoreToLocalStorage(campaignId, cached);
      if (restored) {
        return { success: true, campaignId, source: 'cache' };
      }
    }

    // Step 2: Check latest backup
    const backup = await IndexedDBCache.getLatestBackup();
    if (backup) {
      const backupSave = backup.saves.find(s => s.id === campaignId);
      if (backupSave) {
        console.log('[StorageHealth] Found save in backup snapshot');
        
        // Restore to localStorage
        const restored = await this.restoreToLocalStorage(campaignId, backupSave);
        if (restored) {
          return { success: true, campaignId, source: 'backup' };
        }
      }
    }

    console.log('[StorageHealth] No recovery source found');
    return { success: false, campaignId, source: 'none', error: 'No backup found' };
  }

  private async restoreToLocalStorage(campaignId: string, cached: CachedSave): Promise<boolean> {
    try {
      const key = `${GUEST_PREFIX}${campaignId}`;
      localStorage.setItem(key, cached.data);
      
      // Verify
      const verify = localStorage.getItem(key);
      if (verify === cached.data) {
        console.log(`[StorageHealth] Restored ${campaignId} to localStorage`);
        return true;
      }
    } catch (e) {
      console.error('[StorageHealth] Restore to localStorage failed:', e);
    }
    return false;
  }

  async verifyAndRepair(campaignId: string): Promise<{
    wasCorrupted: boolean;
    repaired: boolean;
    details: string;
  }> {
    const key = `${GUEST_PREFIX}${campaignId}`;
    
    try {
      const raw = localStorage.getItem(key);
      
      if (!raw) {
        // Missing - attempt recovery
        const recovery = await this.attemptRecovery(campaignId);
        if (recovery.success) {
          return {
            wasCorrupted: true,
            repaired: true,
            details: `Recovered from ${recovery.source}`,
          };
        }
        return {
          wasCorrupted: true,
          repaired: false,
          details: 'Save missing and no backup found',
        };
      }

      // Attempt to decompress
      const decompressed = LZString.decompressFromUTF16(raw);
      if (!decompressed) {
        // Try to recover
        const recovery = await this.attemptRecovery(campaignId);
        if (recovery.success) {
          return {
            wasCorrupted: true,
            repaired: true,
            details: `Data was corrupted, recovered from ${recovery.source}`,
          };
        }
        return {
          wasCorrupted: true,
          repaired: false,
          details: 'Data corrupted and no backup found',
        };
      }

      // Try to parse
      try {
        JSON.parse(decompressed);
        return {
          wasCorrupted: false,
          repaired: false,
          details: 'Save data is valid',
        };
      } catch {
        // JSON corrupted
        const recovery = await this.attemptRecovery(campaignId);
        if (recovery.success) {
          return {
            wasCorrupted: true,
            repaired: true,
            details: `JSON was corrupted, recovered from ${recovery.source}`,
          };
        }
        return {
          wasCorrupted: true,
          repaired: false,
          details: 'JSON corrupted and no backup found',
        };
      }
    } catch (e) {
      return {
        wasCorrupted: true,
        repaired: false,
        details: `Verification error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      };
    }
  }

  // ============================================================================
  // MANUAL BACKUP TRIGGER
  // ============================================================================

  async triggerManualBackup(): Promise<boolean> {
    console.log('[StorageHealth] Manual backup triggered');
    return this.performBackup();
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const StorageHealthMonitor = new StorageHealthMonitorClass();

// Auto-initialize when module loads (non-blocking)
if (typeof window !== 'undefined') {
  StorageHealthMonitor.initialize().catch(e => {
    console.warn('[StorageHealth] Background initialization failed:', e);
  });
}
