// ============================================================================
// GAME DATA WIPE - Complete reset of all game data
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { resetLifetimeStats } from './lifetimeStats';
import { resetLifetimeAchievements } from './lifetimeAchievements';

// All known storage key prefixes and exact keys used by the game
const STORAGE_KEY_PATTERNS = [
  // Campaign system
  'untold_campaign_',
  'untold_campaign_index',
  'untold_active_campaign',
  'untold_inventory_',
  'untold_gamestate_',
  
  // Legacy prefixes
  'simtales_',
  'campaign_',
  'game_',
  
  // Settings and preferences
  'untold_',
  'game_settings',
  'game_inventory_state',
  'inventory_',
  
  // Save system
  'save_',
  'autosave_',
  'checkpoint_',
  
  // Stats and achievements
  'untold_lifetime_stats',
  'untold_lifetime_achievements',
  'session_stats',
  
  // Other game data
  'npc_',
  'world_',
  'story_',
  'narrative_',
];

const EXACT_KEYS_TO_REMOVE = [
  'untold_campaign_index',
  'untold_active_campaign',
  'untold_lifetime_stats',
  'untold_lifetime_achievements',
  'game_settings',
  'game_inventory_state',
  'session_stats',
  'last_save_id',
  'auto_save_enabled',
  'onboarding_completed',
  'narrator_settings',
  'audio_settings',
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
  
  result.success = result.errors.length === 0;
  
  console.log('[GameDataWipe] Complete:', result);
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
