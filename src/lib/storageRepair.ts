// ============================================================================
// STORAGE REPAIR - Detect and repair corrupted localStorage data
// Prevents "t.sort is not a function" and similar runtime errors
// ============================================================================

import { STORAGE_KEYS } from './storageKeys';
import { toast } from 'sonner';

// Keys that MUST be arrays
const ARRAY_KEYS = [
  'lwe_campaign_index',
  'lwe_guest_campaigns',
  'guest_local_campaigns',
  'untold_campaign_index',
];

// Keys that MUST be objects (not arrays, not primitives)
const OBJECT_KEYS = [
  'untold-game-settings',
  'game_settings',
];

export interface RepairResult {
  repaired: string[];
  errors: string[];
  wasCorrupted: boolean;
}

/**
 * Detects and repairs corrupted localStorage data on app startup.
 * This prevents runtime crashes caused by malformed data structures.
 */
export function repairCorruptedStorage(): RepairResult {
  const result: RepairResult = {
    repaired: [],
    errors: [],
    wasCorrupted: false,
  };
  
  console.log('[StorageRepair] Running corruption check...');
  
  // Check array keys
  for (const key of ARRAY_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Invalid JSON - reset to empty array
          console.warn(`[StorageRepair] Key "${key}" has invalid JSON, resetting`);
          localStorage.setItem(key, '[]');
          result.repaired.push(key);
          result.wasCorrupted = true;
          continue;
        }
        
        if (!Array.isArray(parsed)) {
          console.warn(`[StorageRepair] Key "${key}" is not an array (type: ${typeof parsed}), resetting`);
          localStorage.setItem(key, '[]');
          result.repaired.push(key);
          result.wasCorrupted = true;
        }
      }
    } catch (e) {
      console.error(`[StorageRepair] Error checking key "${key}":`, e);
      result.errors.push(`${key}: ${e}`);
    }
  }
  
  // Check object keys
  for (const key of OBJECT_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Invalid JSON - reset to empty object
          console.warn(`[StorageRepair] Key "${key}" has invalid JSON, resetting`);
          localStorage.setItem(key, '{}');
          result.repaired.push(key);
          result.wasCorrupted = true;
          continue;
        }
        
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          console.warn(`[StorageRepair] Key "${key}" is not an object (type: ${typeof parsed}), resetting`);
          localStorage.setItem(key, '{}');
          result.repaired.push(key);
          result.wasCorrupted = true;
        }
      }
    } catch (e) {
      console.error(`[StorageRepair] Error checking key "${key}":`, e);
      result.errors.push(`${key}: ${e}`);
    }
  }
  
  // Check for orphaned campaign data (campaign data without index entry)
  try {
    const indexRaw = localStorage.getItem('lwe_campaign_index');
    let validCampaignIds: string[] = [];
    
    if (indexRaw) {
      try {
        const parsed = JSON.parse(indexRaw);
        if (Array.isArray(parsed)) {
          validCampaignIds = parsed.map((c: { id?: string }) => c?.id).filter(Boolean);
        }
      } catch {
        // Index already repaired above
      }
    }
    
    // Find all campaign keys
    const allKeys = Object.keys(localStorage);
    const campaignDataKeys = allKeys.filter(k => k.startsWith('lwe_campaign_'));
    
    for (const key of campaignDataKeys) {
      // Extract campaign ID from key like "lwe_campaign_abc123"
      const campaignId = key.replace('lwe_campaign_', '');
      
      // Check if this campaign exists in the index
      if (campaignId && !validCampaignIds.includes(campaignId) && campaignId !== 'index') {
        console.log(`[StorageRepair] Found orphaned campaign data: ${key}`);
        // Don't auto-delete orphaned campaigns - just log for now
        // They might be recoverable if the index is rebuilt
      }
    }
  } catch (e) {
    console.error('[StorageRepair] Error checking orphaned campaigns:', e);
  }
  
  if (result.repaired.length > 0) {
    console.warn('[StorageRepair] Repaired corrupted keys:', result.repaired);
  } else {
    console.log('[StorageRepair] No corruption detected');
  }
  
  return result;
}

/**
 * Shows a toast notification if storage was repaired.
 * Should be called after React has mounted.
 */
export function notifyIfRepaired(result: RepairResult): void {
  if (result.wasCorrupted) {
    toast.warning('Corrupted save data was auto-repaired', {
      description: `Fixed ${result.repaired.length} storage issue(s). Your campaigns may need to be re-synced.`,
      duration: 5000,
    });
  }
}

/**
 * Performs a complete storage reset for recovery purposes.
 * This is more aggressive than the repair function.
 */
export function emergencyStorageReset(): number {
  console.warn('[StorageRepair] EMERGENCY RESET - Clearing all game storage');
  
  let removed = 0;
  const allKeys = Object.keys(localStorage);
  
  // Game-related prefixes
  const gamePatterns = [
    'lwe_',
    'guest_local_',
    'untold_',
    'campaign_',
    'save_',
    'game_',
    'npc_',
    'world_',
    'story_',
    'narrative_',
    'companion_',
    'inventory_',
    'session_',
    'streaming_',
    'generation_',
    'COMPANION_',
    'NPC_',
    'TRANSACTION_',
  ];
  
  for (const key of allKeys) {
    if (gamePatterns.some(p => key.startsWith(p) || key.toLowerCase().startsWith(p.toLowerCase()))) {
      try {
        localStorage.removeItem(key);
        removed++;
      } catch {
        // Ignore
      }
    }
  }
  
  console.warn(`[StorageRepair] Emergency reset removed ${removed} keys`);
  return removed;
}

/**
 * Validates that a campaign index is properly formatted.
 */
export function validateCampaignIndex(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  
  // Each entry should have at least an id
  return raw.every(item => 
    item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'
  );
}

/**
 * Safe parse helper that always returns an array for index keys.
 */
export function safeParseArrayKey(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    
    console.warn(`[StorageRepair] Key "${key}" was not an array, returning empty`);
    return [];
  } catch {
    console.warn(`[StorageRepair] Key "${key}" failed to parse, returning empty`);
    return [];
  }
}
