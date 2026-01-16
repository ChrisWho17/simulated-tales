// ============================================================================
// CLOUD SYNC SERVICE - Syncs local saves with cloud storage
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { CampaignData, CampaignMetadata } from '@/types/campaign';
import { loadCampaign, saveCampaign, loadCampaignIndex } from '@/lib/campaignStorage';
import LZString from 'lz-string';

// ============================================================================
// TYPES
// ============================================================================

export interface CloudSave {
  id: string;
  user_id: string;
  campaign_id: string;
  campaign_name: string;
  character_name: string;
  character_level: number;
  primary_genre: string;
  play_time: number;
  chapter_count: number;
  checksum: string;
  version: number;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

export interface SyncConflict {
  campaignId: string;
  localUpdatedAt: number;
  cloudUpdatedAt: string;
  localVersion: number;
  cloudVersion: number;
}

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: SyncConflict[];
  errors: string[];
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'conflict';

// ============================================================================
// CHECKSUM GENERATION
// ============================================================================

function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// COMPRESSION UTILITIES
// ============================================================================

function compressCampaign(campaign: CampaignData): string {
  return LZString.compressToUTF16(JSON.stringify(campaign));
}

function decompressCampaign(compressed: string): CampaignData | null {
  try {
    const decompressed = LZString.decompressFromUTF16(compressed);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch (e) {
    console.error('[CloudSync] Failed to decompress campaign:', e);
    return null;
  }
}

// ============================================================================
// CLOUD SYNC SERVICE
// ============================================================================

class CloudSyncServiceClass {
  private syncStatus: SyncStatus = 'idle';
  private lastSyncTime: number | null = null;
  private statusCallbacks: Set<(status: SyncStatus) => void> = new Set();
  private autoSyncEnabled: boolean = true;
  private syncedCampaigns: Set<string> = new Set();

  // Get current sync status
  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  // Get last sync time
  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  // Check if auto-sync is enabled
  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  // Enable/disable auto-sync
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    console.log(`[CloudSync] Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Check if a campaign is synced to cloud
  isCampaignSynced(campaignId: string): boolean {
    return this.syncedCampaigns.has(campaignId);
  }

  // Get synced campaign IDs
  getSyncedCampaignIds(): Set<string> {
    return new Set(this.syncedCampaigns);
  }

  // Subscribe to status changes
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.statusCallbacks.forEach(cb => cb(status));
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Get user ID
  async getUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  }

  // List all cloud saves for current user
  async listCloudSaves(): Promise<CloudSave[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('id, user_id, campaign_id, campaign_name, character_name, character_level, primary_genre, play_time, chapter_count, checksum, version, created_at, updated_at, last_synced_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[CloudSync] Error listing saves:', error);
        return [];
      }

      // Update synced campaigns set
      this.syncedCampaigns = new Set((data || []).map(s => s.campaign_id));

      return data || [];
    } catch (e) {
      console.error('[CloudSync] Failed to list saves:', e);
      return [];
    }
  }

  // Upload a single campaign to cloud
  async uploadCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const campaign = loadCampaign(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found locally' };
    }

    try {
      const compressed = compressCampaign(campaign);
      const checksum = generateChecksum(campaign);

      const { error } = await supabase
        .from('cloud_saves')
        .upsert({
          user_id: userId,
          campaign_id: campaignId,
          campaign_name: campaign.meta.name,
          character_name: campaign.player.name,
          character_level: Math.floor(campaign.player.level || 1),
          primary_genre: campaign.meta.primaryGenre,
          play_time: Math.floor(campaign.meta.playTime || 0),
          chapter_count: Math.floor(campaign.chapters.length + 1),
          save_data: { compressed },
          checksum,
          version: Date.now(),
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,campaign_id',
        });

      if (error) {
        console.error('[CloudSync] Upload error:', error);
        return { success: false, error: error.message };
      }

      // Mark campaign as synced
      this.syncedCampaigns.add(campaignId);
      console.log(`[CloudSync] Uploaded campaign: ${campaign.meta.name}`);
      return { success: true };
    } catch (e) {
      console.error('[CloudSync] Failed to upload:', e);
      return { success: false, error: 'Upload failed' };
    }
  }

  // Auto-sync a campaign after local save (called automatically)
  async autoSyncCampaign(campaignId: string): Promise<void> {
    if (!this.autoSyncEnabled) return;
    
    const isAuth = await this.isAuthenticated();
    if (!isAuth) return;

    console.log(`[CloudSync] Auto-syncing campaign: ${campaignId}`);
    const result = await this.uploadCampaign(campaignId);
    
    if (result.success) {
      this.lastSyncTime = Date.now();
      this.setStatus('synced');
    }
  }

  // Download a single campaign from cloud
  async downloadCampaign(campaignId: string): Promise<{ success: boolean; campaign?: CampaignData; error?: string }> {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('save_data')
        .eq('user_id', userId)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (error) {
        console.error('[CloudSync] Download error:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Save not found in cloud' };
      }

      const saveData = data.save_data as { compressed?: string };
      if (!saveData.compressed) {
        return { success: false, error: 'Invalid save data format' };
      }

      const campaign = decompressCampaign(saveData.compressed);
      if (!campaign) {
        return { success: false, error: 'Failed to decompress save' };
      }

      // Save to local storage
      saveCampaign(campaign);
      this.syncedCampaigns.add(campaignId);
      console.log(`[CloudSync] Downloaded campaign: ${campaign.meta.name}`);

      return { success: true, campaign };
    } catch (e) {
      console.error('[CloudSync] Failed to download:', e);
      return { success: false, error: 'Download failed' };
    }
  }

  // Delete a cloud save
  async deleteCloudSave(campaignId: string): Promise<{ success: boolean; error?: string }> {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('cloud_saves')
        .delete()
        .eq('user_id', userId)
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('[CloudSync] Delete error:', error);
        return { success: false, error: error.message };
      }

      this.syncedCampaigns.delete(campaignId);
      console.log(`[CloudSync] Deleted cloud save: ${campaignId}`);
      return { success: true };
    } catch (e) {
      console.error('[CloudSync] Failed to delete:', e);
      return { success: false, error: 'Delete failed' };
    }
  }

  // Full sync - upload all local saves and download any cloud-only saves
  async fullSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      uploaded: 0,
      downloaded: 0,
      conflicts: [],
      errors: [],
    };

    const userId = await this.getUserId();
    if (!userId) {
      result.success = false;
      result.errors.push('Not authenticated');
      return result;
    }

    this.setStatus('syncing');

    try {
      // Get local campaigns
      const localCampaigns = loadCampaignIndex();
      const localIds = new Set(localCampaigns.map(c => c.id));

      // Get cloud saves
      const cloudSaves = await this.listCloudSaves();
      const cloudMap = new Map(cloudSaves.map(s => [s.campaign_id, s]));

      // Upload local campaigns that are newer or don't exist in cloud
      for (const localMeta of localCampaigns) {
        const cloudSave = cloudMap.get(localMeta.id);

        if (!cloudSave) {
          // Not in cloud, upload
          const uploadResult = await this.uploadCampaign(localMeta.id);
          if (uploadResult.success) {
            result.uploaded++;
          } else {
            result.errors.push(`Failed to upload ${localMeta.name}: ${uploadResult.error}`);
          }
        } else {
          // Exists in both - check for conflicts
          const cloudUpdatedAt = new Date(cloudSave.updated_at).getTime();
          const localUpdatedAt = localMeta.updatedAt;

          // If local is significantly newer (more than 1 second difference), upload
          if (localUpdatedAt > cloudUpdatedAt + 1000) {
            const uploadResult = await this.uploadCampaign(localMeta.id);
            if (uploadResult.success) {
              result.uploaded++;
            }
          } else if (cloudUpdatedAt > localUpdatedAt + 1000) {
            // Cloud is newer - potential conflict
            result.conflicts.push({
              campaignId: localMeta.id,
              localUpdatedAt,
              cloudUpdatedAt: cloudSave.updated_at,
              localVersion: localUpdatedAt,
              cloudVersion: cloudSave.version,
            });
          }
        }
      }

      // Download cloud-only saves
      for (const cloudSave of cloudSaves) {
        if (!localIds.has(cloudSave.campaign_id)) {
          const downloadResult = await this.downloadCampaign(cloudSave.campaign_id);
          if (downloadResult.success) {
            result.downloaded++;
          } else {
            result.errors.push(`Failed to download ${cloudSave.campaign_name}: ${downloadResult.error}`);
          }
        }
      }

      this.lastSyncTime = Date.now();
      this.setStatus(result.conflicts.length > 0 ? 'conflict' : 'synced');

      console.log(`[CloudSync] Sync complete. Uploaded: ${result.uploaded}, Downloaded: ${result.downloaded}, Conflicts: ${result.conflicts.length}`);
    } catch (e) {
      console.error('[CloudSync] Sync failed:', e);
      result.success = false;
      result.errors.push('Sync failed unexpectedly');
      this.setStatus('error');
    }

    return result;
  }

  // Resolve a conflict by choosing local or cloud version
  async resolveConflict(
    campaignId: string, 
    resolution: 'local' | 'cloud'
  ): Promise<{ success: boolean; error?: string }> {
    if (resolution === 'local') {
      // Upload local version to cloud, overwriting cloud
      return this.uploadCampaign(campaignId);
    } else {
      // Download cloud version, overwriting local
      return this.downloadCampaign(campaignId);
    }
  }

  // Refresh synced campaigns list from cloud
  async refreshSyncedCampaigns(): Promise<void> {
    await this.listCloudSaves();
  }
}

// Export singleton instance
export const CloudSyncService = new CloudSyncServiceClass();
