// ============================================================================
// UNIFIED SAVE SERVICE - Cloud-first with Google auth, GUEST-LOCAL fallback
// Now with IndexedDB cache for reliable persistence
// Enhanced with auto-recovery, storage health monitoring, and cross-tab sync
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { CampaignData, CampaignMetadata } from '@/types/campaign';
import { GameGenre } from '@/types/genreData';
import LZString from 'lz-string';
import { IndexedDBCache } from '@/lib/indexedDBCache';
import { StorageHealthMonitor } from '@/systems/StorageHealthMonitor';
import { CrossTabSync } from '@/systems/CrossTabSync';
// ============================================================================
// TYPES
// ============================================================================

export type SaveMode = 'cloud' | 'guest-local';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SaveAccount {
  mode: SaveMode;
  userId: string | null;
  email: string | null;
  displayName: string | null;
}

export interface CloudSaveInfo {
  id: string;
  campaignId: string;
  campaignName: string;
  characterName: string;
  characterLevel: number;
  primaryGenre: string;
  playTime: number;
  chapterCount: number;
  updatedAt: string;
  version: number;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GUEST_PREFIX = 'guest_local_';
const GUEST_INDEX_KEY = 'guest_local_campaigns';
const ACTIVE_CAMPAIGN_KEY = 'lwe_active_campaign';

// ============================================================================
// COMPRESSION
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
    console.error('[UnifiedSave] Decompress failed:', e);
    return null;
  }
}

function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// UNIFIED SAVE SERVICE
// ============================================================================

class UnifiedSaveServiceClass {
  private account: SaveAccount = {
    mode: 'guest-local',
    userId: null,
    email: null,
    displayName: null,
  };
  
  private syncStatus: SyncStatus = 'idle';
  private syncProgress: number = 0; // 0-100
  private lastSyncTime: number | null = null;
  private statusCallbacks: Set<(status: SyncStatus) => void> = new Set();
  private accountCallbacks: Set<(account: SaveAccount) => void> = new Set();
  private lastSyncCallbacks: Set<(time: number | null) => void> = new Set();
  private progressCallbacks: Set<(progress: number) => void> = new Set();
  private initialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      this.account = {
        mode: 'cloud',
        userId: session.user.id,
        email: session.user.email || null,
        displayName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      };
      console.log('[UnifiedSave] Initialized with cloud account:', this.account.email);
    } else {
      this.account = {
        mode: 'guest-local',
        userId: 'GUEST-LOCAL',
        email: null,
        displayName: 'Guest (Local Only)',
      };
      console.log('[UnifiedSave] Initialized as GUEST-LOCAL');
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const wasGuest = this.account.mode === 'guest-local';
        
        this.account = {
          mode: 'cloud',
          userId: session.user.id,
          email: session.user.email || null,
          displayName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        };
        
        this.notifyAccountChange();
        
        // If was guest, offer to migrate local saves to cloud
        if (wasGuest) {
          await this.migrateGuestToCloud();
        }
      } else if (event === 'SIGNED_OUT') {
        this.account = {
          mode: 'guest-local',
          userId: 'GUEST-LOCAL',
          email: null,
          displayName: 'Guest (Local Only)',
        };
        this.notifyAccountChange();
      }
    });
    
    this.initialized = true;
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  getAccount(): SaveAccount {
    return { ...this.account };
  }

  isCloudEnabled(): boolean {
    return this.account.mode === 'cloud';
  }

  isGuest(): boolean {
    return this.account.mode === 'guest-local';
  }

  onAccountChange(callback: (account: SaveAccount) => void): () => void {
    this.accountCallbacks.add(callback);
    return () => this.accountCallbacks.delete(callback);
  }

  private notifyAccountChange(): void {
    this.accountCallbacks.forEach(cb => cb(this.account));
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private setStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.statusCallbacks.forEach(cb => cb(status));
    
    // Update last sync time when synced
    if (status === 'synced') {
      this.lastSyncTime = Date.now();
      this.lastSyncCallbacks.forEach(cb => cb(this.lastSyncTime));
    }
  }

  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  onLastSyncTimeChange(callback: (time: number | null) => void): () => void {
    this.lastSyncCallbacks.add(callback);
    return () => this.lastSyncCallbacks.delete(callback);
  }

  // Progress tracking
  getSyncProgress(): number {
    return this.syncProgress;
  }

  private setProgress(progress: number): void {
    this.syncProgress = Math.min(100, Math.max(0, progress));
    this.progressCallbacks.forEach(cb => cb(this.syncProgress));
  }

  onProgressChange(callback: (progress: number) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS - Unified API
  // ============================================================================

  async listCampaigns(): Promise<CampaignMetadata[]> {
    if (this.account.mode === 'cloud') {
      return this.listCloudCampaigns();
    }
    return this.listGuestCampaigns();
  }

  async saveCampaign(campaign: CampaignData): Promise<SaveResult> {
    // Check cross-tab sync before saving
    const canSave = CrossTabSync.canSaveCampaign(campaign.id);
    if (!canSave.allowed) {
      return { success: false, error: canSave.reason };
    }

    // Notify other tabs that we're saving
    CrossTabSync.notifySaveStarted(campaign.id, campaign.meta.name);

    // Always update campaign metadata
    campaign.meta.updatedAt = Date.now();
    
    let result: SaveResult;
    if (this.account.mode === 'cloud') {
      result = await this.saveToCloud(campaign);
    } else {
      result = await this.saveToGuest(campaign);
    }

    // Notify other tabs that save completed
    if (result.success) {
      CrossTabSync.notifySaveCompleted(campaign.id, campaign.meta.name);
    }

    return result;
  }

  async loadCampaign(campaignId: string): Promise<CampaignData | null> {
    let campaign: CampaignData | null;
    
    if (this.account.mode === 'cloud') {
      campaign = await this.loadFromCloud(campaignId);
    } else {
      // Use recovery-enabled loader for guest mode
      campaign = await this.loadFromGuestWithRecovery(campaignId);
    }

    // Notify other tabs about campaign being loaded
    if (campaign) {
      CrossTabSync.notifyCampaignLoaded(campaign.id, campaign.meta.name);
    }

    return campaign;
  }

  async deleteCampaign(campaignId: string): Promise<SaveResult> {
    if (this.account.mode === 'cloud') {
      return this.deleteFromCloud(campaignId);
    }
    return this.deleteFromGuest(campaignId);
  }

  getActiveCampaignId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
    } catch {
      return null;
    }
  }

  setActiveCampaignId(campaignId: string | null): void {
    try {
      if (campaignId) {
        localStorage.setItem(ACTIVE_CAMPAIGN_KEY, campaignId);
      } else {
        localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
      }
    } catch (e) {
      console.error('[UnifiedSave] Failed to set active campaign:', e);
    }
  }

  // ============================================================================
  // CLOUD OPERATIONS
  // ============================================================================

  private async listCloudCampaigns(): Promise<CampaignMetadata[]> {
    if (!this.account.userId || this.account.userId === 'GUEST-LOCAL') return [];

    try {
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('campaign_id, campaign_name, character_name, character_level, primary_genre, play_time, chapter_count, created_at, updated_at')
        .eq('user_id', this.account.userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[UnifiedSave] List cloud error:', error);
        return [];
      }

      return (data || []).map(save => ({
        id: save.campaign_id,
        name: save.campaign_name,
        characterName: save.character_name,
        characterLevel: save.character_level,
        primaryGenre: save.primary_genre as GameGenre,
        secondaryGenres: [],
        playTime: save.play_time,
        chapterCount: save.chapter_count,
        createdAt: new Date(save.created_at).getTime(),
        updatedAt: new Date(save.updated_at).getTime(),
        isActive: this.getActiveCampaignId() === save.campaign_id,
      }));
    } catch (e) {
      console.error('[UnifiedSave] List cloud failed:', e);
      return [];
    }
  }

  private async saveToCloud(campaign: CampaignData): Promise<SaveResult> {
    if (!this.account.userId || this.account.userId === 'GUEST-LOCAL') {
      return { success: false, error: 'Not authenticated' };
    }

    this.setStatus('syncing');
    this.setProgress(0);

    try {
      // Phase 1: Compress data (30%)
      this.setProgress(10);
      const compressed = compressCampaign(campaign);
      this.setProgress(30);
      
      // Phase 2: Generate checksum (40%)
      const checksum = generateChecksum(campaign);
      this.setProgress(40);

      // Phase 3: Upload to cloud (40% -> 90%)
      this.setProgress(50);
      const { error } = await supabase
        .from('cloud_saves')
        .upsert({
          user_id: this.account.userId,
          campaign_id: campaign.id,
          campaign_name: campaign.meta.name,
          character_name: campaign.player.name,
          character_level: campaign.player.level,
          primary_genre: campaign.meta.primaryGenre,
          play_time: campaign.meta.playTime,
          chapter_count: campaign.chapters.length + 1,
          save_data: { compressed },
          checksum,
          version: Date.now(),
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,campaign_id',
        });

      this.setProgress(90);

      if (error) {
        console.error('[UnifiedSave] Cloud save error:', error);
        this.setStatus('error');
        this.setProgress(0);
        return { success: false, error: error.message };
      }

      // Phase 4: Complete (100%)
      this.setProgress(100);
      this.setStatus('synced');
      console.log(`[UnifiedSave] Cloud saved: ${campaign.meta.name}`);
      
      // Reset progress after a short delay
      setTimeout(() => this.setProgress(0), 1000);
      
      return { success: true };
    } catch (e) {
      console.error('[UnifiedSave] Cloud save failed:', e);
      this.setStatus('error');
      this.setProgress(0);
      return { success: false, error: 'Save failed' };
    }
  }

  private async loadFromCloud(campaignId: string): Promise<CampaignData | null> {
    if (!this.account.userId || this.account.userId === 'GUEST-LOCAL') return null;

    try {
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('save_data')
        .eq('user_id', this.account.userId)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (error) {
        console.error('[UnifiedSave] Cloud load error:', error);
        return null;
      }

      if (!data) return null;

      const saveData = data.save_data as { compressed?: string };
      if (!saveData.compressed) return null;

      const campaign = decompressCampaign(saveData.compressed);
      console.log(`[UnifiedSave] Cloud loaded: ${campaign?.meta?.name}`);
      return campaign;
    } catch (e) {
      console.error('[UnifiedSave] Cloud load failed:', e);
      return null;
    }
  }

  private async deleteFromCloud(campaignId: string): Promise<SaveResult> {
    if (!this.account.userId || this.account.userId === 'GUEST-LOCAL') {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('cloud_saves')
        .delete()
        .eq('user_id', this.account.userId)
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('[UnifiedSave] Cloud delete error:', error);
        return { success: false, error: error.message };
      }

      // Clear active if this was it
      if (this.getActiveCampaignId() === campaignId) {
        this.setActiveCampaignId(null);
      }

      // CRITICAL: Also clean up ALL related localStorage keys for this campaign
      this.cleanupCampaignLocalStorage(campaignId);

      console.log(`[UnifiedSave] Cloud deleted: ${campaignId}`);
      return { success: true };
    } catch (e) {
      console.error('[UnifiedSave] Cloud delete failed:', e);
      return { success: false, error: 'Delete failed' };
    }
  }

  // ============================================================================
  // GUEST-LOCAL OPERATIONS
  // ============================================================================

  private listGuestCampaigns(): CampaignMetadata[] {
    try {
      const indexStr = localStorage.getItem(GUEST_INDEX_KEY);
      if (!indexStr) return [];
      
      const parsed = JSON.parse(indexStr);
      
      // CRITICAL: Defensive check - ensure we always return an array
      // This prevents "t.sort is not a function" crashes when localStorage is corrupted
      if (!Array.isArray(parsed)) {
        console.warn('[UnifiedSave] Guest index was not an array, resetting to empty');
        localStorage.setItem(GUEST_INDEX_KEY, '[]');
        return [];
      }
      
      return parsed as CampaignMetadata[];
    } catch (e) {
      console.error('[UnifiedSave] Failed to parse guest index:', e);
      // Reset corrupted index
      try {
        localStorage.setItem(GUEST_INDEX_KEY, '[]');
      } catch {
        // Ignore quota errors
      }
      return [];
    }
  }

  private saveGuestIndex(campaigns: CampaignMetadata[]): void {
    try {
      localStorage.setItem(GUEST_INDEX_KEY, JSON.stringify(campaigns));
    } catch (e) {
      console.error('[UnifiedSave] Failed to save guest index:', e);
    }
  }

  private saveToGuest(campaign: CampaignData): SaveResult {
    try {
      const key = `${GUEST_PREFIX}${campaign.id}`;
      const compressed = compressCampaign(campaign);
      localStorage.setItem(key, compressed);

      // Also cache to IndexedDB for redundancy
      const checksum = generateChecksum(campaign);
      IndexedDBCache.cacheSave(campaign.id, compressed, checksum, 'local').catch(e => {
        console.warn('[UnifiedSave] IndexedDB cache failed (non-critical):', e);
      });

      // Update index
      const index = this.listGuestCampaigns();
      const existing = index.findIndex(c => c.id === campaign.id);
      
      const meta: CampaignMetadata = {
        id: campaign.id,
        name: campaign.meta.name,
        primaryGenre: campaign.meta.primaryGenre,
        secondaryGenres: campaign.meta.secondaryGenres,
        createdAt: campaign.meta.createdAt,
        updatedAt: campaign.meta.updatedAt,
        playTime: campaign.meta.playTime,
        chapterCount: campaign.chapters.length + 1,
        characterName: campaign.player.name,
        characterLevel: campaign.player.level,
        isActive: this.getActiveCampaignId() === campaign.id,
      };

      if (existing >= 0) {
        index[existing] = meta;
      } else {
        index.push(meta);
      }

      this.saveGuestIndex(index);
      console.log(`[UnifiedSave] Guest saved: ${campaign.meta.name}`);
      return { success: true };
    } catch (e) {
      console.error('[UnifiedSave] Guest save failed:', e);
      return { success: false, error: 'Local save failed' };
    }
  }

  private async loadFromGuestWithRecovery(campaignId: string): Promise<CampaignData | null> {
    try {
      const key = `${GUEST_PREFIX}${campaignId}`;
      let compressed = localStorage.getItem(key);
      let recoverySource: string | null = null;
      
      // Step 1: If not in localStorage, try IndexedDB cache recovery
      if (!compressed) {
        console.log(`[UnifiedSave] Save not in localStorage, attempting recovery...`);
        compressed = await IndexedDBCache.recoverMissingSave(campaignId);
        if (compressed) {
          // Restore to localStorage
          localStorage.setItem(key, compressed);
          recoverySource = 'IndexedDB cache';
          console.log(`[UnifiedSave] Recovered save from ${recoverySource}: ${campaignId}`);
        }
      }
      
      if (!compressed) return null;

      // Step 2: Attempt to decompress
      let campaign = decompressCampaign(compressed);
      
      // Step 3: If decompression failed, try auto-recovery
      if (!campaign) {
        console.warn(`[UnifiedSave] Decompression failed, attempting auto-repair...`);
        
        // Try to get from IndexedDB cache (might have different version)
        const cached = await IndexedDBCache.getCachedSave(campaignId);
        if (cached && cached.data !== compressed) {
          campaign = decompressCampaign(cached.data);
          if (campaign) {
            // Restore good data to localStorage
            localStorage.setItem(key, cached.data);
            recoverySource = 'IndexedDB cache (auto-repair)';
            console.log(`[UnifiedSave] Auto-repaired from ${recoverySource}`);
          }
        }
        
        // If still null, try latest backup
        if (!campaign) {
          const backup = await IndexedDBCache.getLatestBackup();
          if (backup) {
            const backupSave = backup.saves.find(s => s.id === campaignId);
            if (backupSave) {
              campaign = decompressCampaign(backupSave.data);
              if (campaign) {
                localStorage.setItem(key, backupSave.data);
                recoverySource = 'backup snapshot (auto-repair)';
                console.log(`[UnifiedSave] Auto-repaired from ${recoverySource}`);
              }
            }
          }
        }
      }
      
      if (campaign && recoverySource) {
        console.log(`[UnifiedSave] Successfully recovered ${campaign.meta.name} from ${recoverySource}`);
      } else if (campaign) {
        console.log(`[UnifiedSave] Guest loaded: ${campaign.meta.name}`);
      }
      
      return campaign;
    } catch (e) {
      console.error('[UnifiedSave] Guest load failed:', e);
      return null;
    }
  }

  private loadFromGuest(campaignId: string): CampaignData | null {
    try {
      const key = `${GUEST_PREFIX}${campaignId}`;
      const compressed = localStorage.getItem(key);
      if (!compressed) return null;

      const campaign = decompressCampaign(compressed);
      console.log(`[UnifiedSave] Guest loaded: ${campaign?.meta?.name}`);
      return campaign;
    } catch (e) {
      console.error('[UnifiedSave] Guest load failed:', e);
      return null;
    }
  }

  private deleteFromGuest(campaignId: string): SaveResult {
    try {
      const key = `${GUEST_PREFIX}${campaignId}`;
      localStorage.removeItem(key);

      // Update index
      const index = this.listGuestCampaigns();
      const filtered = index.filter(c => c.id !== campaignId);
      this.saveGuestIndex(filtered);

      // Clear active if this was it
      if (this.getActiveCampaignId() === campaignId) {
        this.setActiveCampaignId(null);
      }

      // CRITICAL: Also clean up ALL related localStorage keys for this campaign
      this.cleanupCampaignLocalStorage(campaignId);

      console.log(`[UnifiedSave] Guest deleted: ${campaignId}`);
      return { success: true };
    } catch (e) {
      console.error('[UnifiedSave] Guest delete failed:', e);
      return { success: false, error: 'Delete failed' };
    }
  }

  // Clean up all localStorage keys related to a campaign
  private cleanupCampaignLocalStorage(campaignId: string): void {
    try {
      const keysToRemove: string[] = [];
      
      // Scan all localStorage keys for any containing this campaign ID
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(campaignId)) {
          keysToRemove.push(key);
        }
      }

      // Also check for known key patterns
      const knownPatterns = [
        `lwe_campaign_${campaignId}`,
        `lwe_inventory_${campaignId}`,
        `lwe_gamestate_${campaignId}`,
        `lwe_save_${campaignId}`,
        `lwe_autosave_${campaignId}`,
        `guest_local_${campaignId}`,
        `untold_campaign_${campaignId}`,
        `untold_inventory_${campaignId}`,
        `untold_gamestate_${campaignId}`,
        `campaign_${campaignId}`,
        `inventory_${campaignId}`,
      ];

      knownPatterns.forEach(pattern => {
        if (!keysToRemove.includes(pattern) && localStorage.getItem(pattern)) {
          keysToRemove.push(pattern);
        }
      });

      // Remove all found keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[UnifiedSave] Cleaned up key: ${key}`);
      });

      // Also update the lwe_campaign_index to remove this campaign
      try {
        const indexStr = localStorage.getItem('lwe_campaign_index');
        if (indexStr) {
          const index = JSON.parse(indexStr);
          if (Array.isArray(index)) {
            const filtered = index.filter((c: { id: string }) => c.id !== campaignId);
            localStorage.setItem('lwe_campaign_index', JSON.stringify(filtered));
          }
        }
      } catch { /* ignore index update errors */ }

      // Also update the lwe_saves_index
      try {
        const savesIndexStr = localStorage.getItem('lwe_saves_index');
        if (savesIndexStr) {
          const savesIndex = JSON.parse(savesIndexStr);
          if (Array.isArray(savesIndex)) {
            const filtered = savesIndex.filter((s: { id: string }) => s.id !== campaignId);
            localStorage.setItem('lwe_saves_index', JSON.stringify(filtered));
          }
        }
      } catch { /* ignore index update errors */ }

      console.log(`[UnifiedSave] Cleaned up ${keysToRemove.length} localStorage keys for campaign: ${campaignId}`);
    } catch (e) {
      console.error('[UnifiedSave] Cleanup failed:', e);
    }
  }

  // ============================================================================
  // MIGRATION: Guest -> Cloud
  // ============================================================================

  async migrateGuestToCloud(): Promise<{ migrated: number; failed: number }> {
    if (this.account.mode !== 'cloud') {
      return { migrated: 0, failed: 0 };
    }

    const guestCampaigns = this.listGuestCampaigns();
    if (guestCampaigns.length === 0) {
      return { migrated: 0, failed: 0 };
    }

    console.log(`[UnifiedSave] Migrating ${guestCampaigns.length} guest saves to cloud...`);
    let migrated = 0;
    let failed = 0;

    for (const meta of guestCampaigns) {
      const campaign = this.loadFromGuest(meta.id);
      if (campaign) {
        const result = await this.saveToCloud(campaign);
        if (result.success) {
          // Remove from guest storage after successful cloud save
          this.deleteFromGuest(meta.id);
          migrated++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    console.log(`[UnifiedSave] Migration complete: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
  }

  // ============================================================================
  // GOOGLE SIGN IN
  // ============================================================================

  async signInWithGoogle(): Promise<SaveResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Sign in failed' };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  // ============================================================================
  // CLEANUP ALL DATA
  // ============================================================================

  async wipeAllData(): Promise<void> {
    // Delete cloud saves if authenticated
    if (this.account.mode === 'cloud' && this.account.userId) {
      try {
        await supabase
          .from('cloud_saves')
          .delete()
          .eq('user_id', this.account.userId);
      } catch (e) {
        console.error('[UnifiedSave] Cloud wipe failed:', e);
      }
    }

    // Clear all local storage with comprehensive pattern matching
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith(GUEST_PREFIX) ||
        key.startsWith('lwe_') ||
        key.startsWith('simtales_') ||
        key.startsWith('untold_') ||  // Fixed: underscore not dash
        key.startsWith('untold-') ||
        key.startsWith('campaign_') ||
        key.startsWith('save_') ||
        key.startsWith('autosave_') ||
        key.startsWith('game_') ||
        key.startsWith('inventory_') ||
        key.startsWith('npc_') ||
        key.startsWith('world_') ||
        key.startsWith('story_') ||
        key.startsWith('narrative_') ||
        key.startsWith('checkpoint_') ||
        key === GUEST_INDEX_KEY ||
        key === ACTIVE_CAMPAIGN_KEY ||
        key === 'lwe_campaign_index' ||
        key === 'lwe_saves_index' ||
        key === 'session_stats' ||
        key === 'narrator_settings' ||
        key === 'audio_settings' ||
        key === 'game_settings' ||
        key === 'onboarding_completed'
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[UnifiedSave] Wiped ${keysToRemove.length} local keys`);
  }
}

// Export singleton
export const UnifiedSaveService = new UnifiedSaveServiceClass();

// Initialize on import
UnifiedSaveService.initialize().catch(console.error);
