// ============================================================================
// GAME DATA WIPE - Complete reset of all game data
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { resetLifetimeStats } from './lifetimeStats';
import { resetLifetimeAchievements } from './lifetimeAchievements';

// All known storage key prefixes and exact keys used by the game
// COMPREHENSIVE LIST - covers ALL game-related data for complete wipe
const STORAGE_KEY_PATTERNS = [
  // PRIMARY: LWE (Living World Engine) system - current save system
  'lwe_',
  'lwe_campaign_',
  'lwe_save_',
  'lwe_saves_index',
  'lwe_autosave_',
  'lwe_active_campaign',
  'lwe_inventory_',
  'lwe_gamestate_',
  'lwe_transaction_',
  'lwe_wal',
  
  // Guest local saves (UnifiedSaveService)
  'guest_local_',
  'guest_local_campaigns',
  
  // Campaign system (legacy and current)
  'untold_campaign_',
  'untold_campaign_index',
  'untold_active_campaign',
  'untold_inventory_',
  'untold_gamestate_',
  'untold-',
  
  // Settings and preferences
  'untold_',
  'game_settings',
  'game_inventory_state',
  'inventory_',
  
  // Legacy prefixes
  'simtales_',
  'campaign_',
  'game_',
  
  // Save system internals
  'save_',
  'autosave_',
  'checkpoint_',
  
  // Stats and achievements
  'untold_lifetime_stats',
  'untold_lifetime_achievements',
  'session_stats',
  'lifetime_',
  
  // NPC and world data
  'npc_',
  'NPC_',
  'world_',
  'story_',
  'narrative_',
  'narrative_meta_',
  
  // Companion system
  'companion_',
  'COMPANION_',
  'companion_portrait_',
  
  // Streaming and generation caches
  'streaming_',
  'generation_',
  'generation_cache_',
  
  // Transaction logs
  'TRANSACTION_',
  'transaction_',
  
  // IndexedDB cache markers
  'idb_',
  'indexeddb_',
];

const EXACT_KEYS_TO_REMOVE = [
  // LWE system - CRITICAL
  'lwe_campaign_index',
  'lwe_saves_index',
  'lwe_active_campaign',
  'lwe_active_campaign_id',
  'guest_local_campaigns',
  'lwe_guest_campaigns',
  
  // Legacy campaign system
  'untold_campaign_index',
  'untold_active_campaign',
  'untold_lifetime_stats',
  'untold_lifetime_achievements',
  
  // Settings
  'game_settings',
  'untold-game-settings',
  'game_inventory_state',
  'session_stats',
  'last_save_id',
  'auto_save_enabled',
  'onboarding_completed',
  'narrator_settings',
  'audio_settings',
  
  // Companion localStorage keys
  'COMPANION_APPEARANCES',
  'COMPANION_INTRODUCTIONS', 
  'PENDING_COMPANION_INTRODUCTIONS',
  
  // Cross-tab sync
  'cross_tab_leader',
  'cross_tab_heartbeat',
];

export interface WipeResult {
  success: boolean;
  localKeysRemoved: number;
  cloudSavesDeleted: number;
  cloudStatsDeleted: boolean;
  errors: string[];
}

export async function wipeAllGameData(options: {
  wipeLocal?: boolean;
  wipeCloudSaves?: boolean;
  wipeCloudStats?: boolean;
  wipeAchievements?: boolean;
} = {}): Promise<WipeResult> {
  const { 
    wipeLocal = true, 
    wipeCloudSaves = true, 
    wipeCloudStats = true,
    wipeAchievements = true,
  } = options;
  
  const result: WipeResult = {
    success: true,
    localKeysRemoved: 0,
    cloudSavesDeleted: 0,
    cloudStatsDeleted: false,
    errors: [],
  };
  
  // 1. Wipe local storage
  if (wipeLocal) {
    try {
      const allKeys = Object.keys(localStorage);
      
      for (const key of allKeys) {
        // Check if key matches any pattern
        const shouldRemove = STORAGE_KEY_PATTERNS.some(pattern => key.startsWith(pattern)) ||
                             EXACT_KEYS_TO_REMOVE.includes(key);
        
        if (shouldRemove) {
          localStorage.removeItem(key);
          result.localKeysRemoved++;
          console.log(`[GameDataWipe] Removed: ${key}`);
        }
      }
      
      // Also reset lifetime stats and achievements through their functions
      resetLifetimeStats();
      if (wipeAchievements) {
        resetLifetimeAchievements();
      }
      
      console.log(`[GameDataWipe] Removed ${result.localKeysRemoved} local storage keys`);
    } catch (e) {
      result.errors.push(`Local storage wipe failed: ${e}`);
      console.error('[GameDataWipe] Local storage error:', e);
    }
  }
  
  // 2. Wipe cloud saves
  if (wipeCloudSaves) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('cloud_saves')
          .delete()
          .eq('user_id', session.user.id)
          .select('id');
        
        if (error) {
          result.errors.push(`Cloud saves delete failed: ${error.message}`);
          console.error('[GameDataWipe] Cloud saves error:', error);
        } else {
          result.cloudSavesDeleted = data?.length || 0;
          console.log(`[GameDataWipe] Deleted ${result.cloudSavesDeleted} cloud saves`);
        }
      } else {
        console.log('[GameDataWipe] Not authenticated, skipping cloud saves wipe');
      }
    } catch (e) {
      result.errors.push(`Cloud saves wipe failed: ${e}`);
      console.error('[GameDataWipe] Cloud saves error:', e);
    }
  }
  
  // 3. Wipe cloud lifetime stats
  if (wipeCloudStats) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { error } = await supabase
          .from('lifetime_stats')
          .delete()
          .eq('user_id', session.user.id);
        
        if (error) {
          result.errors.push(`Cloud stats delete failed: ${error.message}`);
          console.error('[GameDataWipe] Cloud stats error:', error);
        } else {
          result.cloudStatsDeleted = true;
          console.log(`[GameDataWipe] Deleted cloud lifetime stats`);
        }
      } else {
        console.log('[GameDataWipe] Not authenticated, skipping cloud stats wipe');
      }
    } catch (e) {
      result.errors.push(`Cloud stats wipe failed: ${e}`);
      console.error('[GameDataWipe] Cloud stats error:', e);
    }
  }
  
  // 4. Wipe IndexedDB caches (if they exist)
  if (wipeLocal) {
    try {
      // Try to delete game-related IndexedDB databases
      const idbDatabases = ['lwe_cache', 'campaign_cache', 'game_cache', 'save_cache'];
      
      for (const dbName of idbDatabases) {
        try {
          const deleteRequest = indexedDB.deleteDatabase(dbName);
          await new Promise<void>((resolve, reject) => {
            deleteRequest.onsuccess = () => {
              console.log(`[GameDataWipe] Deleted IndexedDB: ${dbName}`);
              resolve();
            };
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onblocked = () => {
              console.warn(`[GameDataWipe] IndexedDB ${dbName} blocked, continuing...`);
              resolve();
            };
          });
        } catch {
          // Database might not exist, ignore
        }
      }
    } catch (e) {
      console.warn('[GameDataWipe] IndexedDB cleanup error (non-critical):', e);
    }
  }
  
  result.success = result.errors.length === 0;
  
  console.log('[GameDataWipe] Complete:', result);
  return result;
}

/**
 * NUCLEAR OPTION: Wipes absolutely everything from localStorage.
 * Use only as a last resort when normal wipe doesn't work.
 */
export async function nuclearWipe(): Promise<WipeResult> {
  console.warn('[GameDataWipe] NUCLEAR WIPE - Clearing ALL localStorage');
  
  const result: WipeResult = {
    success: true,
    localKeysRemoved: 0,
    cloudSavesDeleted: 0,
    cloudStatsDeleted: false,
    errors: [],
  };
  
  try {
    // Clear absolutely everything from localStorage
    const keyCount = localStorage.length;
    localStorage.clear();
    result.localKeysRemoved = keyCount;
    console.log(`[GameDataWipe] Nuclear wipe cleared ${keyCount} keys`);
    
    // Also wipe cloud data
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      // Delete cloud saves
      const { data: saves, error: savesError } = await supabase
        .from('cloud_saves')
        .delete()
        .eq('user_id', session.user.id)
        .select('id');
      
      if (!savesError) {
        result.cloudSavesDeleted = saves?.length || 0;
      }
      
      // Delete lifetime stats
      const { error: statsError } = await supabase
        .from('lifetime_stats')
        .delete()
        .eq('user_id', session.user.id);
      
      if (!statsError) {
        result.cloudStatsDeleted = true;
      }
    }
    
    // Try to clear IndexedDB
    try {
      const databases = await indexedDB.databases?.();
      if (databases) {
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch {
      // Browser might not support indexedDB.databases()
    }
    
  } catch (e) {
    result.errors.push(`Nuclear wipe failed: ${e}`);
    result.success = false;
  }
  
  return result;
}

export function getStorageUsageInfo(): { 
  gameKeys: string[]; 
  totalSize: number; 
  formattedSize: string;
} {
  const gameKeys: string[] = [];
  let totalSize = 0;
  
  const allKeys = Object.keys(localStorage);
  
  for (const key of allKeys) {
    const shouldCount = STORAGE_KEY_PATTERNS.some(pattern => key.startsWith(pattern)) ||
                         EXACT_KEYS_TO_REMOVE.includes(key);
    
    if (shouldCount) {
      gameKeys.push(key);
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // UTF-16 = 2 bytes per char
      }
    }
  }
  
  const formattedSize = totalSize < 1024 
    ? `${totalSize} B`
    : totalSize < 1024 * 1024
      ? `${(totalSize / 1024).toFixed(1)} KB`
      : `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
  
  return { gameKeys, totalSize, formattedSize };
}

/**
 * Returns ALL localStorage keys (not just game-related) for diagnostic purposes.
 */
export function getAllStorageKeys(): string[] {
  return Object.keys(localStorage);
}

/**
 * Checks if localStorage is in a healthy state.
 */
export function isStorageHealthy(): { healthy: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check campaign index
  try {
    const raw = localStorage.getItem('lwe_campaign_index');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        issues.push('Campaign index is not an array');
      }
    }
  } catch {
    issues.push('Campaign index has invalid JSON');
  }
  
  // Check guest campaigns
  try {
    const raw = localStorage.getItem('guest_local_campaigns');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        issues.push('Guest campaigns index is not an array');
      }
    }
  } catch {
    issues.push('Guest campaigns index has invalid JSON');
  }
  
  return {
    healthy: issues.length === 0,
    issues,
  };
}
