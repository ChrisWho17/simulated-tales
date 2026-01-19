// Storage Cleanup Utilities
// Automatic cleanup of localStorage when approaching quota limits

import LZString from 'lz-string';

const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of quota
const STORAGE_CRITICAL_THRESHOLD = 0.95; // 95% of quota

// Keys that should never be deleted
const PROTECTED_KEYS = [
  'untold-game-settings',
  'living-world-settings',
  'untold-color-preference',
  'supabase.auth.token',
];

// Keys that can be safely cleaned up (ordered by priority - lower index = delete first)
const CLEANUP_PRIORITY = [
  // Old/temp data
  { pattern: /^temp_/, priority: 1 },
  { pattern: /^cache_/, priority: 1 },
  // Portrait cache (can be regenerated)
  { pattern: /^npc_portrait_/, priority: 2 },
  { pattern: /^portrait_cache_/, priority: 2 },
  // Scene illustrations (can be regenerated)
  { pattern: /^scene_illustration_/, priority: 3 },
  // Old session data
  { pattern: /^session_/, priority: 4 },
  // Backup saves (keep main saves)
  { pattern: /^backup_/, priority: 5 },
  // Auto-save slots beyond the first 3
  { pattern: /^autosave_[3-9]/, priority: 6 },
];

export interface StorageStats {
  used: number;
  quota: number;
  percentage: number;
  itemCount: number;
  isWarning: boolean;
  isCritical: boolean;
}

export function getStorageStats(): StorageStats {
  try {
    // Calculate current usage
    let totalSize = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          itemCount++;
        }
      }
    }
    
    // Estimate quota (most browsers are 5-10MB)
    // We'll use a conservative 5MB estimate
    const estimatedQuota = 5 * 1024 * 1024; // 5MB in bytes
    const usedBytes = totalSize * 2; // UTF-16 encoding
    const percentage = usedBytes / estimatedQuota;
    
    return {
      used: usedBytes,
      quota: estimatedQuota,
      percentage,
      itemCount,
      isWarning: percentage >= STORAGE_WARNING_THRESHOLD,
      isCritical: percentage >= STORAGE_CRITICAL_THRESHOLD,
    };
  } catch (e) {
    console.error('[StorageCleanup] Failed to get stats:', e);
    return {
      used: 0,
      quota: 5 * 1024 * 1024,
      percentage: 0,
      itemCount: 0,
      isWarning: false,
      isCritical: false,
    };
  }
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function performCleanup(targetReduction: number = 0.2): number {
  console.log('[StorageCleanup] Starting cleanup, target reduction:', targetReduction);
  
  const initialStats = getStorageStats();
  const targetUsage = initialStats.percentage - targetReduction;
  
  // Collect all keys with their sizes and priorities
  const cleanupCandidates: Array<{
    key: string;
    size: number;
    priority: number;
  }> = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Skip protected keys
    if (PROTECTED_KEYS.some(pk => key === pk || key.startsWith(pk))) {
      continue;
    }
    
    const value = localStorage.getItem(key);
    if (!value) continue;
    
    // Determine priority
    let priority = 10; // Default low priority
    for (const rule of CLEANUP_PRIORITY) {
      if (rule.pattern.test(key)) {
        priority = rule.priority;
        break;
      }
    }
    
    cleanupCandidates.push({
      key,
      size: (key.length + value.length) * 2,
      priority,
    });
  }
  
  // Sort by priority (lower = delete first), then by size (larger = delete first)
  cleanupCandidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.size - a.size;
  });
  
  // Delete until we reach target
  let freedBytes = 0;
  let deletedCount = 0;
  
  for (const candidate of cleanupCandidates) {
    const currentStats = getStorageStats();
    if (currentStats.percentage <= targetUsage) {
      break;
    }
    
    try {
      localStorage.removeItem(candidate.key);
      freedBytes += candidate.size;
      deletedCount++;
      console.log(`[StorageCleanup] Deleted: ${candidate.key} (${formatStorageSize(candidate.size)})`);
    } catch (e) {
      console.error(`[StorageCleanup] Failed to delete ${candidate.key}:`, e);
    }
  }
  
  console.log(`[StorageCleanup] Complete. Deleted ${deletedCount} items, freed ${formatStorageSize(freedBytes)}`);
  
  return freedBytes;
}

export function compressAndStore(key: string, data: any): boolean {
  try {
    const json = JSON.stringify(data);
    const compressed = LZString.compressToUTF16(json);
    
    // Only use compression if it actually saves space
    if (compressed.length < json.length) {
      localStorage.setItem(key, `LZ:${compressed}`);
    } else {
      localStorage.setItem(key, json);
    }
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      // Try cleanup and retry
      console.warn('[StorageCleanup] Quota exceeded, attempting cleanup...');
      performCleanup(0.3);
      
      try {
        const json = JSON.stringify(data);
        const compressed = LZString.compressToUTF16(json);
        localStorage.setItem(key, `LZ:${compressed}`);
        return true;
      } catch (retryError) {
        console.error('[StorageCleanup] Still failed after cleanup:', retryError);
        return false;
      }
    }
    console.error('[StorageCleanup] Store failed:', e);
    return false;
  }
}

export function decompressAndLoad<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    
    // Check if compressed
    if (stored.startsWith('LZ:')) {
      const decompressed = LZString.decompressFromUTF16(stored.slice(3));
      return decompressed ? JSON.parse(decompressed) : fallback;
    }
    
    return JSON.parse(stored);
  } catch (e) {
    console.error(`[StorageCleanup] Failed to load ${key}:`, e);
    return fallback;
  }
}

// Run automatic cleanup check
export function checkAndCleanupStorage(): void {
  const stats = getStorageStats();
  
  if (stats.isCritical) {
    console.warn('[StorageCleanup] Critical storage usage detected:', stats.percentage * 100, '%');
    performCleanup(0.3); // Aggressive cleanup
  } else if (stats.isWarning) {
    console.warn('[StorageCleanup] High storage usage detected:', stats.percentage * 100, '%');
    performCleanup(0.15); // Moderate cleanup
  }
}
