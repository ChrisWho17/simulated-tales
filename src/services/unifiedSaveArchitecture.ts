// ============================================================================
// UNIFIED SAVE ARCHITECTURE - Cloud-Primary, Local-Cache Model
// Phase 2: Single source of truth with transactional saves
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { CampaignData, CampaignMetadata, CAMPAIGN_INDEX_KEY } from '@/types/campaign';
import { TransactionManager, generateChecksum } from './saveTransaction';
import LZString from 'lz-string';

// ============================================================================
// TYPES
// ============================================================================

export type SaveMode = 'cloud' | 'local-only';
export type SyncState = 'synced' | 'pending' | 'conflict' | 'error' | 'offline';

export interface UnifiedAccount {
  mode: SaveMode;
  userId?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  lastSyncedAt?: number;
}

export interface CampaignSyncStatus {
  campaignId: string;
  localChecksum?: string;
  cloudChecksum?: string;
  localUpdatedAt?: number;
  cloudUpdatedAt?: number;
  state: SyncState;
}

export interface SaveConflict {
  campaignId: string;
  campaignName: string;
  localVersion: {
    checksum: string;
    updatedAt: number;
    chapterCount: number;
    playTime: number;
  };
  cloudVersion: {
    checksum: string;
    updatedAt: number;
    chapterCount: number;
    playTime: number;
  };
}

export interface SaveResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  syncedToCloud?: boolean;
}

// ============================================================================
// COMPRESSION
// ============================================================================

function compressCampaign(campaign: CampaignData): string {
  return LZString.compressToUTF16(JSON.stringify(campaign)) || '';
}

function decompressCampaign(compressed: string): CampaignData | null {
  try {
    const decompressed = LZString.decompressFromUTF16(compressed);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch {
    return null;
  }
}

// ============================================================================
// UNIFIED SAVE ARCHITECTURE SERVICE
// ============================================================================

class UnifiedSaveArchitectureClass {
  private static instance: UnifiedSaveArchitectureClass;
  
  private account: UnifiedAccount = { mode: 'local-only' };
  private syncStatuses: Map<string, CampaignSyncStatus> = new Map();
  private conflicts: SaveConflict[] = [];
  private initialized = false;
  
  // Callbacks
  private accountCallbacks: ((account: UnifiedAccount) => void)[] = [];
  private conflictCallbacks: ((conflicts: SaveConflict[]) => void)[] = [];
  private syncCallbacks: ((status: CampaignSyncStatus) => void)[] = [];
  
  static getInstance(): UnifiedSaveArchitectureClass {
    if (!UnifiedSaveArchitectureClass.instance) {
      UnifiedSaveArchitectureClass.instance = new UnifiedSaveArchitectureClass();
    }
    return UnifiedSaveArchitectureClass.instance;
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[UnifiedSave] Initializing...');
    
    // Recover any uncommitted transactions from WAL
    const recovery = await TransactionManager.recoverFromWAL();
    if (recovery.recovered > 0) {
      console.log(`[UnifiedSave] Recovered ${recovery.recovered} transactions from WAL`);
    }
    
    // Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      this.account = {
        mode: 'cloud',
        userId: session.user.id,
        email: session.user.email || undefined,
        displayName: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        avatarUrl: session.user.user_metadata?.avatar_url,
      };
      
      // Sync on init
      await this.syncWithCloud();
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.account = {
          mode: 'cloud',
          userId: session.user.id,
          email: session.user.email || undefined,
          displayName: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
        };
        this.notifyAccountChange();
        
        // Use setTimeout to defer async operations (prevents Supabase deadlock)
        setTimeout(async () => {
          // Migrate local saves to cloud
          const migrated = await this.migrateLocalToCloud();
          if (migrated > 0) {
            console.log(`[UnifiedSave] Auto-migrated ${migrated} local campaigns to cloud`);
          }
          // Also sync cloud saves down to local
          await this.syncCloudToLocal();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        this.account = { mode: 'local-only' };
        this.notifyAccountChange();
      }
    });
    
    this.initialized = true;
    console.log('[UnifiedSave] Initialized, mode:', this.account.mode);
  }
  
  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================
  
  getAccount(): UnifiedAccount {
    return { ...this.account };
  }
  
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    
    if (error) {
      console.error('[UnifiedSave] Google sign-in failed:', error);
      throw error;
    }
  }
  
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.account = { mode: 'local-only' };
    this.notifyAccountChange();
  }
  
  // ============================================================================
  // TRANSACTIONAL SAVE (LOCAL)
  // ============================================================================
  
  async saveLocal(campaign: CampaignData): Promise<SaveResult> {
    try {
      // Begin transaction
      const transaction = await TransactionManager.beginTransaction(campaign.id, campaign);
      
      // Commit transaction
      const committed = await TransactionManager.commit(transaction.id);
      
      if (!committed) {
        await TransactionManager.rollback(transaction.id);
        return { success: false, error: 'Transaction commit failed' };
      }
      
      // Update index
      await this.updateCampaignIndex(campaign);
      
      // Update sync status
      const checksum = await generateChecksum(JSON.stringify(campaign));
      this.updateSyncStatus(campaign.id, {
        localChecksum: checksum,
        localUpdatedAt: campaign.meta.updatedAt,
        state: this.account.mode === 'cloud' ? 'pending' : 'synced',
      });
      
      return { success: true, transactionId: transaction.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
  
  // ============================================================================
  // CLOUD SYNC
  // ============================================================================
  
  async saveToCloud(campaign: CampaignData): Promise<SaveResult> {
    if (this.account.mode !== 'cloud' || !this.account.userId) {
      return { success: false, error: 'Not signed in' };
    }
    
    try {
      const compressed = compressCampaign(campaign);
      const checksum = await generateChecksum(JSON.stringify(campaign));
      
      // Check for conflicts first
      const { data: existing } = await supabase
        .from('cloud_saves')
        .select('checksum, updated_at, version')
        .eq('campaign_id', campaign.id)
        .eq('user_id', this.account.userId)
        .maybeSingle();
      
      // Get local sync status
      const localStatus = this.syncStatuses.get(campaign.id);
      
      if (existing && localStatus?.cloudChecksum && existing.checksum !== localStatus.cloudChecksum) {
        // Conflict detected - cloud was modified since last sync
        this.addConflict(campaign, existing);
        return { success: false, error: 'Conflict detected' };
      }
      
      // Upsert to cloud
      const { error } = await supabase
        .from('cloud_saves')
        .upsert({
          campaign_id: campaign.id,
          user_id: this.account.userId,
          campaign_name: campaign.meta.name,
          character_name: campaign.player?.name || 'Unknown',
          character_level: Math.floor(campaign.player?.level || 1),
          primary_genre: campaign.meta.primaryGenre,
          chapter_count: Math.floor(campaign.meta.chapterCount || 1),
          play_time: Math.floor(campaign.meta.playTime || 0),
          save_data: { compressed },
          checksum,
          version: (existing?.version || 0) + 1,
          updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'campaign_id,user_id',
        });
      
      if (error) throw error;
      
      // Update sync status
      this.updateSyncStatus(campaign.id, {
        cloudChecksum: checksum,
        cloudUpdatedAt: Date.now(),
        state: 'synced',
      });
      
      this.account.lastSyncedAt = Date.now();
      this.notifyAccountChange();
      
      return { success: true, syncedToCloud: true };
    } catch (error) {
      console.error('[UnifiedSave] Cloud save failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
  
  async loadFromCloud(campaignId: string): Promise<CampaignData | null> {
    if (this.account.mode !== 'cloud' || !this.account.userId) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('save_data, checksum, updated_at')
        .eq('campaign_id', campaignId)
        .eq('user_id', this.account.userId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      const saveData = data.save_data as { compressed?: string };
      if (!saveData?.compressed) return null;
      
      const campaign = decompressCampaign(saveData.compressed);
      
      if (campaign) {
        // Update sync status
        this.updateSyncStatus(campaignId, {
          cloudChecksum: data.checksum,
          cloudUpdatedAt: new Date(data.updated_at).getTime(),
          state: 'synced',
        });
      }
      
      return campaign;
    } catch (error) {
      console.error('[UnifiedSave] Cloud load failed:', error);
      return null;
    }
  }
  
  // ============================================================================
  // UNIFIED SAVE (Cloud-Primary, Local-Cache)
  // ============================================================================
  
  async saveCampaign(campaign: CampaignData): Promise<SaveResult> {
    // Always save locally first (transactional)
    const localResult = await this.saveLocal(campaign);
    
    if (!localResult.success) {
      return localResult;
    }
    
    // If cloud mode, sync to cloud
    if (this.account.mode === 'cloud') {
      const cloudResult = await this.saveToCloud(campaign);
      
      if (!cloudResult.success && cloudResult.error !== 'Conflict detected') {
        // Cloud save failed but local succeeded - mark as pending
        this.updateSyncStatus(campaign.id, { state: 'pending' });
      }
      
      return {
        ...localResult,
        syncedToCloud: cloudResult.success,
        error: cloudResult.error,
      };
    }
    
    return localResult;
  }
  
  async loadCampaign(campaignId: string): Promise<CampaignData | null> {
    console.log(`[UnifiedSave] Loading campaign: ${campaignId}, mode: ${this.account.mode}`);
    
    // Try local first (faster)
    const localData = this.loadLocalCampaign(campaignId);
    
    if (this.account.mode === 'cloud') {
      // ALWAYS check cloud when signed in - this ensures cloud saves are visible
      try {
        const cloudData = await this.loadFromCloud(campaignId);
        
        if (cloudData && localData) {
          const localTime = localData.meta.updatedAt || 0;
          const cloudTime = cloudData.meta.updatedAt || 0;
          
          console.log(`[UnifiedSave] Comparing versions - local: ${localTime}, cloud: ${cloudTime}`);
          
          if (cloudTime > localTime) {
            // Cloud is newer - use cloud and update local cache
            console.log('[UnifiedSave] Cloud version is newer, using cloud data');
            await this.saveLocal(cloudData);
            return cloudData;
          } else if (localTime > cloudTime) {
            // Local is newer - sync to cloud
            console.log('[UnifiedSave] Local version is newer, syncing to cloud');
            this.updateSyncStatus(campaignId, { state: 'pending' });
            // Also trigger background sync
            this.saveToCloud(localData).catch(console.error);
          }
          // Local is same or newer, return local
          return localData;
        } else if (cloudData && !localData) {
          // Only in cloud - cache locally and return
          console.log('[UnifiedSave] Campaign only exists in cloud, caching locally');
          await this.saveLocal(cloudData);
          return cloudData;
        } else if (localData && !cloudData) {
          // Only local - sync to cloud
          console.log('[UnifiedSave] Campaign only exists locally, syncing to cloud');
          this.updateSyncStatus(campaignId, { state: 'pending' });
          this.saveToCloud(localData).catch(console.error);
        }
      } catch (error) {
        console.error('[UnifiedSave] Cloud load failed, using local:', error);
      }
    }
    
    return localData;
  }
  
  private loadLocalCampaign(campaignId: string): CampaignData | null {
    try {
      const raw = localStorage.getItem(`lwe_campaign_${campaignId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      // Delete locally
      localStorage.removeItem(`lwe_campaign_${campaignId}`);
      localStorage.removeItem(`lwe_inventory_${campaignId}`);
      localStorage.removeItem(`lwe_gamestate_${campaignId}`);
      
      // Update index
      const index = this.loadCampaignIndex();
      const filtered = index.filter(c => c.id !== campaignId);
      localStorage.setItem(CAMPAIGN_INDEX_KEY, JSON.stringify(filtered));
      
      // Delete from cloud if signed in
      if (this.account.mode === 'cloud' && this.account.userId) {
        await supabase
          .from('cloud_saves')
          .delete()
          .eq('campaign_id', campaignId)
          .eq('user_id', this.account.userId);
      }
      
      this.syncStatuses.delete(campaignId);
      
      return true;
    } catch (error) {
      console.error('[UnifiedSave] Delete failed:', error);
      return false;
    }
  }
  
  // ============================================================================
  // CAMPAIGN INDEX
  // ============================================================================
  
  async listCampaigns(): Promise<CampaignMetadata[]> {
    console.log('[UnifiedSave] Listing campaigns, mode:', this.account.mode);
    const localIndex = this.loadCampaignIndex();
    
    if (this.account.mode === 'cloud' && this.account.userId) {
      // Merge with cloud campaigns
      try {
        const { data: cloudSaves, error } = await supabase
          .from('cloud_saves')
          .select('campaign_id, campaign_name, primary_genre, character_name, character_level, chapter_count, play_time, updated_at, created_at')
          .eq('user_id', this.account.userId);
        
        if (error) {
          console.error('[UnifiedSave] Cloud list error:', error);
        }
        
        if (cloudSaves && cloudSaves.length > 0) {
          console.log(`[UnifiedSave] Found ${cloudSaves.length} cloud campaigns`);
          const cloudIds = new Set(cloudSaves.map(s => s.campaign_id));
          const localIds = new Set(localIndex.map(c => c.id));
          
          // Add cloud-only campaigns to index
          for (const cloud of cloudSaves) {
            if (!localIds.has(cloud.campaign_id)) {
              console.log(`[UnifiedSave] Adding cloud-only campaign: ${cloud.campaign_name}`);
              localIndex.push({
                id: cloud.campaign_id,
                name: cloud.campaign_name,
                primaryGenre: cloud.primary_genre as CampaignMetadata['primaryGenre'],
                secondaryGenres: [],
                createdAt: new Date(cloud.created_at || cloud.updated_at).getTime(),
                updatedAt: new Date(cloud.updated_at).getTime(),
                playTime: cloud.play_time,
                chapterCount: cloud.chapter_count,
                characterName: cloud.character_name,
                characterLevel: cloud.character_level,
                isActive: false,
              });
            } else {
              // Update existing local entry with cloud info if cloud is newer
              const localEntry = localIndex.find(c => c.id === cloud.campaign_id);
              const cloudTime = new Date(cloud.updated_at).getTime();
              if (localEntry && cloudTime > (localEntry.updatedAt || 0)) {
                localEntry.name = cloud.campaign_name;
                localEntry.updatedAt = cloudTime;
                localEntry.playTime = cloud.play_time;
                localEntry.chapterCount = cloud.chapter_count;
                localEntry.characterLevel = cloud.character_level;
              }
            }
          }
          
          // Mark local-only campaigns for sync
          for (const local of localIndex) {
            if (!cloudIds.has(local.id)) {
              this.updateSyncStatus(local.id, { state: 'pending' });
            } else {
              this.updateSyncStatus(local.id, { state: 'synced' });
            }
          }
          
          // Save updated index
          localStorage.setItem(CAMPAIGN_INDEX_KEY, JSON.stringify(localIndex));
        }
      } catch (error) {
        console.error('[UnifiedSave] Failed to fetch cloud campaigns:', error);
      }
    }
    
    return localIndex.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  private loadCampaignIndex(): CampaignMetadata[] {
    try {
      const raw = localStorage.getItem(CAMPAIGN_INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  
  private async updateCampaignIndex(campaign: CampaignData): Promise<void> {
    const index = this.loadCampaignIndex();
    const existing = index.findIndex(c => c.id === campaign.id);
    
    const meta: CampaignMetadata = {
      id: campaign.id,
      name: campaign.meta.name,
      primaryGenre: campaign.meta.primaryGenre,
      secondaryGenres: campaign.meta.secondaryGenres,
      createdAt: campaign.meta.createdAt,
      updatedAt: campaign.meta.updatedAt,
      playTime: campaign.meta.playTime,
      chapterCount: campaign.meta.chapterCount,
      characterName: campaign.player?.name || 'Unknown',
      characterLevel: campaign.player?.level || 1,
      isActive: true,
    };
    
    if (existing >= 0) {
      index[existing] = meta;
    } else {
      index.push(meta);
    }
    
    localStorage.setItem(CAMPAIGN_INDEX_KEY, JSON.stringify(index));
  }
  
  // ============================================================================
  // SYNC
  // ============================================================================
  
  async syncWithCloud(): Promise<{ synced: number; conflicts: number }> {
    if (this.account.mode !== 'cloud') {
      return { synced: 0, conflicts: 0 };
    }
    
    const result = { synced: 0, conflicts: 0 };
    const localIndex = this.loadCampaignIndex();
    
    for (const local of localIndex) {
      const status = this.syncStatuses.get(local.id);
      
      if (status?.state === 'pending' || !status) {
        const localData = this.loadLocalCampaign(local.id);
        if (localData) {
          const saveResult = await this.saveToCloud(localData);
          
          if (saveResult.success) {
            result.synced++;
          } else if (saveResult.error === 'Conflict detected') {
            result.conflicts++;
          }
        }
      }
    }
    
    return result;
  }
  
  async migrateLocalToCloud(): Promise<number> {
    if (this.account.mode !== 'cloud' || !this.account.userId) return 0;
    
    let migrated = 0;
    const localIndex = this.loadCampaignIndex();
    
    console.log(`[UnifiedSave] Checking ${localIndex.length} local campaigns for migration...`);
    
    // First, get all cloud campaigns for this user
    const { data: cloudSaves } = await supabase
      .from('cloud_saves')
      .select('campaign_id, updated_at')
      .eq('user_id', this.account.userId);
    
    const cloudCampaignMap = new Map(
      (cloudSaves || []).map(s => [s.campaign_id, new Date(s.updated_at).getTime()])
    );
    
    for (const local of localIndex) {
      const localData = this.loadLocalCampaign(local.id);
      if (!localData) continue;
      
      const cloudUpdatedAt = cloudCampaignMap.get(local.id);
      const localUpdatedAt = localData.meta.updatedAt || 0;
      
      // Only migrate if:
      // 1. Campaign doesn't exist in cloud, OR
      // 2. Local version is newer than cloud version
      if (!cloudUpdatedAt || localUpdatedAt > cloudUpdatedAt) {
        console.log(`[UnifiedSave] Migrating campaign "${local.name}" to cloud (local: ${localUpdatedAt}, cloud: ${cloudUpdatedAt || 'none'})`);
        const result = await this.saveToCloud(localData);
        if (result.success) {
          migrated++;
          this.updateSyncStatus(local.id, { state: 'synced' });
        } else {
          console.warn(`[UnifiedSave] Failed to migrate "${local.name}":`, result.error);
        }
      } else {
        // Cloud is same or newer, mark as synced
        this.updateSyncStatus(local.id, { state: 'synced' });
      }
    }
    
    console.log(`[UnifiedSave] Migrated ${migrated} campaigns to cloud`);
    return migrated;
  }
  
  async syncCloudToLocal(): Promise<number> {
    if (this.account.mode !== 'cloud' || !this.account.userId) return 0;
    
    let synced = 0;
    
    try {
      const { data: cloudSaves, error } = await supabase
        .from('cloud_saves')
        .select('campaign_id, campaign_name, save_data, updated_at, checksum')
        .eq('user_id', this.account.userId);
      
      if (error) {
        console.error('[UnifiedSave] Failed to fetch cloud saves:', error);
        return 0;
      }
      
      const localIndex = this.loadCampaignIndex();
      const localMap = new Map(localIndex.map(c => [c.id, c]));
      
      for (const cloud of cloudSaves || []) {
        const localMeta = localMap.get(cloud.campaign_id);
        const cloudUpdatedAt = new Date(cloud.updated_at).getTime();
        
        // Only download if cloud is newer or doesn't exist locally
        if (!localMeta || cloudUpdatedAt > (localMeta.updatedAt || 0)) {
          const saveData = cloud.save_data as { compressed?: string };
          if (saveData?.compressed) {
            const campaign = decompressCampaign(saveData.compressed);
            if (campaign) {
              console.log(`[UnifiedSave] Syncing cloud campaign "${cloud.campaign_name}" to local`);
              await this.saveLocal(campaign);
              synced++;
              this.updateSyncStatus(cloud.campaign_id, { 
                state: 'synced',
                cloudChecksum: cloud.checksum,
                cloudUpdatedAt: cloudUpdatedAt,
              });
            }
          }
        }
      }
      
      console.log(`[UnifiedSave] Synced ${synced} cloud campaigns to local`);
    } catch (error) {
      console.error('[UnifiedSave] Cloud-to-local sync failed:', error);
    }
    
    return synced;
  }
  
  // ============================================================================
  // CONFLICT MANAGEMENT
  // ============================================================================
  
  private addConflict(localCampaign: CampaignData, cloudData: { checksum: string; updated_at: string }): void {
    const existing = this.conflicts.find(c => c.campaignId === localCampaign.id);
    if (existing) return;
    
    this.conflicts.push({
      campaignId: localCampaign.id,
      campaignName: localCampaign.meta.name,
      localVersion: {
        checksum: '', // Will be calculated
        updatedAt: localCampaign.meta.updatedAt,
        chapterCount: localCampaign.meta.chapterCount,
        playTime: localCampaign.meta.playTime,
      },
      cloudVersion: {
        checksum: cloudData.checksum,
        updatedAt: new Date(cloudData.updated_at).getTime(),
        chapterCount: 0, // Would need separate fetch
        playTime: 0,
      },
    });
    
    this.updateSyncStatus(localCampaign.id, { state: 'conflict' });
    this.notifyConflictChange();
  }
  
  getConflicts(): SaveConflict[] {
    return [...this.conflicts];
  }
  
  async resolveConflict(campaignId: string, resolution: 'local' | 'cloud'): Promise<boolean> {
    const conflict = this.conflicts.find(c => c.campaignId === campaignId);
    if (!conflict) return false;
    
    try {
      if (resolution === 'local') {
        // Keep local, overwrite cloud
        const localData = this.loadLocalCampaign(campaignId);
        if (localData) {
          // Force overwrite by temporarily clearing cloud checksum tracking
          this.updateSyncStatus(campaignId, { cloudChecksum: undefined });
          await this.saveToCloud(localData);
        }
      } else {
        // Keep cloud, overwrite local
        const cloudData = await this.loadFromCloud(campaignId);
        if (cloudData) {
          await this.saveLocal(cloudData);
        }
      }
      
      // Remove conflict
      this.conflicts = this.conflicts.filter(c => c.campaignId !== campaignId);
      this.updateSyncStatus(campaignId, { state: 'synced' });
      this.notifyConflictChange();
      
      return true;
    } catch (error) {
      console.error('[UnifiedSave] Conflict resolution failed:', error);
      return false;
    }
  }
  
  // ============================================================================
  // SYNC STATUS
  // ============================================================================
  
  private updateSyncStatus(campaignId: string, update: Partial<CampaignSyncStatus>): void {
    const current = this.syncStatuses.get(campaignId) || { campaignId, state: 'pending' as SyncState };
    const updated = { ...current, ...update };
    this.syncStatuses.set(campaignId, updated);
    this.notifySyncChange(updated);
  }
  
  getSyncStatus(campaignId: string): CampaignSyncStatus | undefined {
    return this.syncStatuses.get(campaignId);
  }
  
  // ============================================================================
  // ACTIVE CAMPAIGN
  // ============================================================================
  
  getActiveCampaignId(): string | null {
    return localStorage.getItem('lwe_active_campaign_id');
  }
  
  setActiveCampaignId(campaignId: string | null): void {
    if (campaignId) {
      localStorage.setItem('lwe_active_campaign_id', campaignId);
    } else {
      localStorage.removeItem('lwe_active_campaign_id');
    }
  }
  
  // ============================================================================
  // CALLBACKS
  // ============================================================================
  
  onAccountChange(callback: (account: UnifiedAccount) => void): () => void {
    this.accountCallbacks.push(callback);
    return () => {
      this.accountCallbacks = this.accountCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onConflictChange(callback: (conflicts: SaveConflict[]) => void): () => void {
    this.conflictCallbacks.push(callback);
    return () => {
      this.conflictCallbacks = this.conflictCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onSyncStatusChange(callback: (status: CampaignSyncStatus) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }
  
  private notifyAccountChange(): void {
    this.accountCallbacks.forEach(cb => cb(this.account));
  }
  
  private notifyConflictChange(): void {
    this.conflictCallbacks.forEach(cb => cb(this.conflicts));
  }
  
  private notifySyncChange(status: CampaignSyncStatus): void {
    this.syncCallbacks.forEach(cb => cb(status));
  }
}

export const UnifiedSaveArchitecture = UnifiedSaveArchitectureClass.getInstance();
