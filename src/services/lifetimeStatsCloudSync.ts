// ============================================================================
// LIFETIME STATS CLOUD SYNC SERVICE
// Syncs lifetime statistics to cloud when user is authenticated
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { LifetimeStatistics, loadLifetimeStats, saveLifetimeStats, createDefaultStats } from '@/lib/lifetimeStats';

export interface CloudLifetimeStats {
  id: string;
  user_id: string;
  stats_data: LifetimeStatistics;
  version: number;
  created_at: string;
  updated_at: string;
}

// Merge two stats objects, taking the higher value for numeric fields
function mergeStats(local: LifetimeStatistics, cloud: LifetimeStatistics): LifetimeStatistics {
  return {
    // Time - take earliest first played, latest last played, sum sessions
    totalPlaytimeSeconds: Math.max(local.totalPlaytimeSeconds, cloud.totalPlaytimeSeconds),
    firstPlayedAt: Math.min(local.firstPlayedAt, cloud.firstPlayedAt),
    lastPlayedAt: Math.max(local.lastPlayedAt, cloud.lastPlayedAt),
    totalSessions: Math.max(local.totalSessions, cloud.totalSessions),
    
    // Campaigns - take higher values
    campaignsStarted: Math.max(local.campaignsStarted, cloud.campaignsStarted),
    campaignsCompleted: Math.max(local.campaignsCompleted, cloud.campaignsCompleted),
    longestCampaignTurns: Math.max(local.longestCampaignTurns, cloud.longestCampaignTurns),
    longestCampaignName: local.longestCampaignTurns >= cloud.longestCampaignTurns 
      ? local.longestCampaignName 
      : cloud.longestCampaignName,
    
    // Combat records - take higher values
    totalCombatEncounters: Math.max(local.totalCombatEncounters, cloud.totalCombatEncounters),
    totalEnemiesDefeated: Math.max(local.totalEnemiesDefeated, cloud.totalEnemiesDefeated),
    totalDeaths: Math.max(local.totalDeaths, cloud.totalDeaths),
    highestDamageDealt: Math.max(local.highestDamageDealt, cloud.highestDamageDealt),
    longestWinStreak: Math.max(local.longestWinStreak, cloud.longestWinStreak),
    currentWinStreak: Math.max(local.currentWinStreak, cloud.currentWinStreak),
    
    // Dice records
    totalDiceRolled: Math.max(local.totalDiceRolled, cloud.totalDiceRolled),
    totalNaturalTwenties: Math.max(local.totalNaturalTwenties, cloud.totalNaturalTwenties),
    totalNaturalOnes: Math.max(local.totalNaturalOnes, cloud.totalNaturalOnes),
    totalCriticalSuccesses: Math.max(local.totalCriticalSuccesses, cloud.totalCriticalSuccesses),
    totalCriticalFailures: Math.max(local.totalCriticalFailures, cloud.totalCriticalFailures),
    
    // Economy
    totalGoldEarned: Math.max(local.totalGoldEarned, cloud.totalGoldEarned),
    totalGoldSpent: Math.max(local.totalGoldSpent, cloud.totalGoldSpent),
    mostGoldAtOnce: Math.max(local.mostGoldAtOnce, cloud.mostGoldAtOnce),
    
    // Exploration
    totalLocationsVisited: Math.max(local.totalLocationsVisited, cloud.totalLocationsVisited),
    totalNpcsEncountered: Math.max(local.totalNpcsEncountered, cloud.totalNpcsEncountered),
    totalQuestsCompleted: Math.max(local.totalQuestsCompleted, cloud.totalQuestsCompleted),
    totalSecretsDiscovered: Math.max(local.totalSecretsDiscovered, cloud.totalSecretsDiscovered),
    
    // Items
    totalItemsAcquired: Math.max(local.totalItemsAcquired, cloud.totalItemsAcquired),
    totalItemsCrafted: Math.max(local.totalItemsCrafted, cloud.totalItemsCrafted),
    totalItemsUsed: Math.max(local.totalItemsUsed, cloud.totalItemsUsed),
    
    // Social
    totalChoicesMade: Math.max(local.totalChoicesMade, cloud.totalChoicesMade),
    totalDialogueExchanges: Math.max(local.totalDialogueExchanges, cloud.totalDialogueExchanges),
    
    // Reputation
    totalReputationGained: Math.max(local.totalReputationGained, cloud.totalReputationGained),
    totalReputationLost: Math.max(local.totalReputationLost, cloud.totalReputationLost),
    factionsEncountered: Math.max(local.factionsEncountered, cloud.factionsEncountered),
    
    // Genre diversity - merge maps
    genresPlayed: mergeGenresPlayed(local.genresPlayed, cloud.genresPlayed),
  };
}

function mergeGenresPlayed(
  local: Record<string, number>, 
  cloud: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...local };
  for (const [genre, count] of Object.entries(cloud)) {
    merged[genre] = Math.max(merged[genre] || 0, count);
  }
  return merged;
}

class LifetimeStatsCloudSyncClass {
  private syncInProgress = false;
  
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  }
  
  async getUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  }
  
  async fetchCloudStats(): Promise<CloudLifetimeStats | null> {
    const userId = await this.getUserId();
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('lifetime_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[LifetimeStatsCloud] Failed to fetch:', error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        ...data,
        stats_data: data.stats_data as unknown as LifetimeStatistics,
      };
    } catch (e) {
      console.error('[LifetimeStatsCloud] Error fetching:', e);
      return null;
    }
  }
  
  async uploadStats(stats: LifetimeStatistics): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;
    
    try {
      const existing = await this.fetchCloudStats();
      
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('lifetime_stats')
          .update({
            stats_data: JSON.parse(JSON.stringify(stats)),
            version: existing.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error('[LifetimeStatsCloud] Failed to update:', error);
          return false;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('lifetime_stats')
          .insert([{
            user_id: userId,
            stats_data: JSON.parse(JSON.stringify(stats)),
            version: 1,
          }]);
        
        if (error) {
          console.error('[LifetimeStatsCloud] Failed to insert:', error);
          return false;
        }
      }
      
      console.log('[LifetimeStatsCloud] Stats uploaded successfully');
      return true;
    } catch (e) {
      console.error('[LifetimeStatsCloud] Error uploading:', e);
      return false;
    }
  }
  
  async syncStats(): Promise<{ success: boolean; merged: boolean }> {
    if (this.syncInProgress) {
      return { success: false, merged: false };
    }
    
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      return { success: false, merged: false };
    }
    
    this.syncInProgress = true;
    
    try {
      const localStats = loadLifetimeStats();
      const cloudData = await this.fetchCloudStats();
      
      if (!cloudData) {
        // No cloud data, just upload local
        const success = await this.uploadStats(localStats);
        return { success, merged: false };
      }
      
      // Merge local and cloud stats
      const cloudStats = { ...createDefaultStats(), ...cloudData.stats_data };
      const mergedStats = mergeStats(localStats, cloudStats);
      
      // Save merged stats locally
      saveLifetimeStats(mergedStats);
      
      // Upload merged stats to cloud
      const success = await this.uploadStats(mergedStats);
      
      console.log('[LifetimeStatsCloud] Stats synced and merged');
      return { success, merged: true };
    } catch (e) {
      console.error('[LifetimeStatsCloud] Sync error:', e);
      return { success: false, merged: false };
    } finally {
      this.syncInProgress = false;
    }
  }
  
  async downloadAndReplace(): Promise<boolean> {
    const cloudData = await this.fetchCloudStats();
    if (!cloudData) return false;
    
    const cloudStats = { ...createDefaultStats(), ...cloudData.stats_data };
    saveLifetimeStats(cloudStats);
    
    console.log('[LifetimeStatsCloud] Cloud stats downloaded and replaced local');
    return true;
  }
  
  async deleteCloudStats(): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('lifetime_stats')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error('[LifetimeStatsCloud] Failed to delete:', error);
        return false;
      }
      
      console.log('[LifetimeStatsCloud] Cloud stats deleted');
      return true;
    } catch (e) {
      console.error('[LifetimeStatsCloud] Error deleting:', e);
      return false;
    }
  }
}

export const LifetimeStatsCloudSync = new LifetimeStatsCloudSyncClass();
