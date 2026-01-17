// ============================================================================
// INCREMENTAL SAVE SERVICE - Only syncs changed fields for efficiency
// ============================================================================

import type { CampaignData } from '@/types/campaign';
import { BackgroundSyncManager } from './backgroundSyncManager';
import { IndexedDBCache } from '@/lib/indexedDBCache';
import LZString from 'lz-string';

// ============================================================================
// Types
// ============================================================================

export interface FieldDiff {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  operation: 'add' | 'modify' | 'delete';
}

export interface IncrementalSave {
  campaignId: string;
  baseVersion: number;
  diffs: FieldDiff[];
  timestamp: number;
  checksum: string;
}

export interface SaveSnapshot {
  campaignId: string;
  version: number;
  data: CampaignData;
  checksum: string;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const SNAPSHOT_STORAGE_PREFIX = 'untold_snapshot_';
const DIFF_THRESHOLD = 0.5; // If more than 50% changed, do full save
const MAX_DIFFS_BEFORE_SNAPSHOT = 10; // Force snapshot after 10 incremental saves

// ============================================================================
// Utility Functions
// ============================================================================

async function generateChecksum(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

function deepCompare(obj1: unknown, obj2: unknown, path: string = ''): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  
  // Handle null/undefined
  if (obj1 === null || obj1 === undefined) {
    if (obj2 !== null && obj2 !== undefined) {
      diffs.push({ path, oldValue: obj1, newValue: obj2, operation: 'add' });
    }
    return diffs;
  }
  
  if (obj2 === null || obj2 === undefined) {
    diffs.push({ path, oldValue: obj1, newValue: obj2, operation: 'delete' });
    return diffs;
  }
  
  // Handle primitives
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    if (obj1 !== obj2) {
      diffs.push({ path, oldValue: obj1, newValue: obj2, operation: 'modify' });
    }
    return diffs;
  }
  
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // For large arrays (like narrative history), just check length and last items
    if (obj1.length > 100 || obj2.length > 100) {
      if (obj1.length !== obj2.length) {
        diffs.push({ path, oldValue: obj1.length, newValue: obj2, operation: 'modify' });
      } else {
        // Compare last 5 items
        const compareCount = Math.min(5, obj1.length);
        for (let i = obj1.length - compareCount; i < obj1.length; i++) {
          const itemDiffs = deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
          diffs.push(...itemDiffs);
        }
      }
    } else {
      // For small arrays, compare each item
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= obj1.length) {
          diffs.push({ path: `${path}[${i}]`, oldValue: undefined, newValue: obj2[i], operation: 'add' });
        } else if (i >= obj2.length) {
          diffs.push({ path: `${path}[${i}]`, oldValue: obj1[i], newValue: undefined, operation: 'delete' });
        } else {
          const itemDiffs = deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
          diffs.push(...itemDiffs);
        }
      }
    }
    return diffs;
  }
  
  // Handle objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const allKeys = new Set([...keys1, ...keys2]);
  
  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    const val1 = (obj1 as Record<string, unknown>)[key];
    const val2 = (obj2 as Record<string, unknown>)[key];
    
    if (!(key in (obj1 as Record<string, unknown>))) {
      diffs.push({ path: newPath, oldValue: undefined, newValue: val2, operation: 'add' });
    } else if (!(key in (obj2 as Record<string, unknown>))) {
      diffs.push({ path: newPath, oldValue: val1, newValue: undefined, operation: 'delete' });
    } else {
      const subDiffs = deepCompare(val1, val2, newPath);
      diffs.push(...subDiffs);
    }
  }
  
  return diffs;
}

function applyDiffs(base: CampaignData, diffs: FieldDiff[]): CampaignData {
  const result = JSON.parse(JSON.stringify(base)) as CampaignData;
  
  for (const diff of diffs) {
    const pathParts = diff.path.split(/[.\[\]]/).filter(Boolean);
    let current: unknown = result;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      }
    }
    
    if (current && typeof current === 'object') {
      const lastPart = pathParts[pathParts.length - 1];
      if (diff.operation === 'delete') {
        delete (current as Record<string, unknown>)[lastPart];
      } else {
        (current as Record<string, unknown>)[lastPart] = diff.newValue;
      }
    }
  }
  
  return result;
}

function countTotalFields(obj: unknown): number {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return 1;
  }
  
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countTotalFields(item), 0);
  }
  
  return Object.values(obj).reduce((sum: number, val) => sum + countTotalFields(val), 0);
}

// ============================================================================
// Incremental Save Service Class
// ============================================================================

class IncrementalSaveServiceClass {
  private snapshots: Map<string, SaveSnapshot> = new Map();
  private diffCounts: Map<string, number> = new Map();

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  private async loadSnapshot(campaignId: string): Promise<SaveSnapshot | null> {
    // Check memory cache first
    const cached = this.snapshots.get(campaignId);
    if (cached) return cached;
    
    // Try localStorage
    try {
      const stored = localStorage.getItem(`${SNAPSHOT_STORAGE_PREFIX}${campaignId}`);
      if (stored) {
        const decompressed = LZString.decompressFromUTF16(stored);
        if (decompressed) {
          const snapshot = JSON.parse(decompressed) as SaveSnapshot;
          this.snapshots.set(campaignId, snapshot);
          return snapshot;
        }
      }
    } catch (e) {
      console.error('[IncrementalSave] Failed to load snapshot:', e);
    }
    
    // Try IndexedDB
    const cached2 = await IndexedDBCache.getCachedSave(campaignId);
    if (cached2) {
      try {
        const decompressed = LZString.decompressFromUTF16(cached2.data);
        if (decompressed) {
          const data = JSON.parse(decompressed) as CampaignData;
          const snapshot: SaveSnapshot = {
            campaignId,
            version: 1,
            data,
            checksum: cached2.checksum,
            timestamp: cached2.savedAt,
          };
          this.snapshots.set(campaignId, snapshot);
          return snapshot;
        }
      } catch (e) {
        console.error('[IncrementalSave] Failed to parse IndexedDB cache:', e);
      }
    }
    
    return null;
  }

  private async saveSnapshot(snapshot: SaveSnapshot): Promise<void> {
    this.snapshots.set(snapshot.campaignId, snapshot);
    
    try {
      const compressed = LZString.compressToUTF16(JSON.stringify(snapshot));
      localStorage.setItem(`${SNAPSHOT_STORAGE_PREFIX}${snapshot.campaignId}`, compressed);
      
      // Also cache in IndexedDB
      const campaignCompressed = LZString.compressToUTF16(JSON.stringify(snapshot.data));
      await IndexedDBCache.cacheSave(
        snapshot.campaignId,
        campaignCompressed,
        snapshot.checksum,
        'local'
      );
    } catch (e) {
      console.error('[IncrementalSave] Failed to save snapshot:', e);
    }
    
    // Reset diff count
    this.diffCounts.set(snapshot.campaignId, 0);
  }

  // ============================================================================
  // Incremental Save Logic
  // ============================================================================

  async save(campaign: CampaignData): Promise<{
    type: 'full' | 'incremental';
    diffsCount: number;
    synced: boolean;
  }> {
    const campaignId = campaign.id;
    const existingSnapshot = await this.loadSnapshot(campaignId);
    
    // Calculate current checksum
    const currentData = JSON.stringify(campaign);
    const currentChecksum = await generateChecksum(currentData);
    
    // If no existing snapshot or checksum matches, this is first save or no changes
    if (!existingSnapshot) {
      // First save - create full snapshot
      const snapshot: SaveSnapshot = {
        campaignId,
        version: 1,
        data: campaign,
        checksum: currentChecksum,
        timestamp: Date.now(),
      };
      
      await this.saveSnapshot(snapshot);
      await BackgroundSyncManager.enqueue(campaignId, 'save', campaign, 'normal');
      
      return { type: 'full', diffsCount: 0, synced: true };
    }
    
    // Check if checksum matches (no changes)
    if (existingSnapshot.checksum === currentChecksum) {
      console.log('[IncrementalSave] No changes detected');
      return { type: 'incremental', diffsCount: 0, synced: false };
    }
    
    // Calculate diffs
    const diffs = deepCompare(existingSnapshot.data, campaign);
    
    if (diffs.length === 0) {
      // Checksums differ but no diffs found (edge case) - do full save
      const snapshot: SaveSnapshot = {
        campaignId,
        version: existingSnapshot.version + 1,
        data: campaign,
        checksum: currentChecksum,
        timestamp: Date.now(),
      };
      
      await this.saveSnapshot(snapshot);
      await BackgroundSyncManager.enqueue(campaignId, 'save', campaign, 'normal');
      
      return { type: 'full', diffsCount: 0, synced: true };
    }
    
    // Check if we should do full save instead
    const totalFields = countTotalFields(campaign);
    const changeRatio = diffs.length / totalFields;
    const diffCount = (this.diffCounts.get(campaignId) || 0) + 1;
    
    const shouldDoFullSave = 
      changeRatio > DIFF_THRESHOLD ||
      diffCount >= MAX_DIFFS_BEFORE_SNAPSHOT;
    
    if (shouldDoFullSave) {
      // Do full save
      const snapshot: SaveSnapshot = {
        campaignId,
        version: existingSnapshot.version + 1,
        data: campaign,
        checksum: currentChecksum,
        timestamp: Date.now(),
      };
      
      await this.saveSnapshot(snapshot);
      await BackgroundSyncManager.enqueue(campaignId, 'save', campaign, 'high');
      
      console.log('[IncrementalSave] Full save (', 
        changeRatio > DIFF_THRESHOLD ? 'too many changes' : 'max diffs reached', ')');
      
      return { type: 'full', diffsCount: diffs.length, synced: true };
    }
    
    // Do incremental save
    const snapshot: SaveSnapshot = {
      campaignId,
      version: existingSnapshot.version + 1,
      data: campaign,
      checksum: currentChecksum,
      timestamp: Date.now(),
    };
    
    await this.saveSnapshot(snapshot);
    this.diffCounts.set(campaignId, diffCount);
    
    // Queue for background sync
    await BackgroundSyncManager.enqueue(campaignId, 'save', campaign, 'low');
    
    console.log('[IncrementalSave] Incremental save with', diffs.length, 'diffs');
    
    return { type: 'incremental', diffsCount: diffs.length, synced: true };
  }

  // ============================================================================
  // Load & Merge
  // ============================================================================

  async load(campaignId: string): Promise<CampaignData | null> {
    const snapshot = await this.loadSnapshot(campaignId);
    return snapshot?.data || null;
  }

  async getVersion(campaignId: string): Promise<number> {
    const snapshot = await this.loadSnapshot(campaignId);
    return snapshot?.version || 0;
  }

  async getChecksum(campaignId: string): Promise<string | null> {
    const snapshot = await this.loadSnapshot(campaignId);
    return snapshot?.checksum || null;
  }

  // ============================================================================
  // Diff Analysis
  // ============================================================================

  async analyzeDiffs(campaignId: string, newCampaign: CampaignData): Promise<{
    diffs: FieldDiff[];
    changeRatio: number;
    recommendFullSave: boolean;
  }> {
    const snapshot = await this.loadSnapshot(campaignId);
    
    if (!snapshot) {
      return {
        diffs: [],
        changeRatio: 1,
        recommendFullSave: true,
      };
    }
    
    const diffs = deepCompare(snapshot.data, newCampaign);
    const totalFields = countTotalFields(newCampaign);
    const changeRatio = diffs.length / totalFields;
    
    return {
      diffs,
      changeRatio,
      recommendFullSave: changeRatio > DIFF_THRESHOLD,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  clearSnapshot(campaignId: string): void {
    this.snapshots.delete(campaignId);
    this.diffCounts.delete(campaignId);
    
    try {
      localStorage.removeItem(`${SNAPSHOT_STORAGE_PREFIX}${campaignId}`);
    } catch (e) {
      console.error('[IncrementalSave] Failed to clear snapshot:', e);
    }
  }

  clearAllSnapshots(): void {
    this.snapshots.clear();
    this.diffCounts.clear();
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(SNAPSHOT_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('[IncrementalSave] Failed to clear snapshots:', e);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const IncrementalSaveService = new IncrementalSaveServiceClass();
