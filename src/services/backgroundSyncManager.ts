// ============================================================================
// BACKGROUND SYNC MANAGER - Handles background synchronization with cloud
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { IndexedDBCache } from '@/lib/indexedDBCache';
import type { CampaignData } from '@/types/campaign';
import LZString from 'lz-string';

// ============================================================================
// Types
// ============================================================================

export type SyncPriority = 'high' | 'normal' | 'low';
export type OperationType = 'save' | 'delete' | 'sync';

export interface QueuedOperation {
  id: string;
  campaignId: string;
  type: OperationType;
  priority: SyncPriority;
  data?: string; // Compressed campaign data
  checksum?: string;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  metadata?: {
    campaignName?: string;
    characterName?: string;
  };
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  currentOperation?: string;
}

export interface BackgroundSyncStatus {
  isOnline: boolean;
  isPaused: boolean;
  queueSize: number;
  lastSyncTime: number | null;
  progress: SyncProgress;
}

type StatusCallback = (status: BackgroundSyncStatus) => void;

// ============================================================================
// Constants
// ============================================================================

const QUEUE_STORAGE_KEY = 'untold_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff
const SYNC_INTERVAL = 30000; // 30 seconds
const BATCH_SIZE = 5; // Process 5 operations at a time

// ============================================================================
// Compression utilities
// ============================================================================

function compressCampaign(campaign: CampaignData): string {
  return LZString.compressToUTF16(JSON.stringify(campaign));
}

function decompressCampaign(compressed: string): CampaignData | null {
  try {
    const json = LZString.decompressFromUTF16(compressed);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function generateChecksum(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// Background Sync Manager Class
// ============================================================================

class BackgroundSyncManagerClass {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private isPaused = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private statusCallbacks: Set<StatusCallback> = new Set();
  private lastSyncTime: number | null = null;
  private progress: SyncProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false,
  };

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    // Load queue from storage
    await this.loadQueue();
    
    // Set up online/offline listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Set up visibility change listener for background sync
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.resumeSync();
      }
    });
    
    // Start sync interval
    this.startSyncInterval();
    
    // Process queue if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    console.log('[BackgroundSync] Initialized with', this.queue.length, 'queued operations');
  }

  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isPaused && this.queue.length > 0) {
        this.processQueue();
      }
    }, SYNC_INTERVAL);
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  private async loadQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[BackgroundSync] Failed to load queue:', e);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('[BackgroundSync] Failed to save queue:', e);
    }
  }

  async enqueue(
    campaignId: string,
    type: OperationType,
    campaign?: CampaignData,
    priority: SyncPriority = 'normal'
  ): Promise<string> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Remove any existing operations for this campaign (latest wins)
    this.queue = this.queue.filter(op => 
      !(op.campaignId === campaignId && op.type === type)
    );
    
    let compressed: string | undefined;
    let checksum: string | undefined;
    
    if (campaign) {
      compressed = compressCampaign(campaign);
      checksum = await generateChecksum(compressed);
    }
    
    const operation: QueuedOperation = {
      id: operationId,
      campaignId,
      type,
      priority,
      data: compressed,
      checksum,
      createdAt: Date.now(),
      retryCount: 0,
      metadata: campaign ? {
        campaignName: campaign.meta?.name,
        characterName: campaign.player?.name,
      } : undefined,
    };
    
    // Insert based on priority
    const insertIndex = this.queue.findIndex(op => 
      this.getPriorityValue(op.priority) < this.getPriorityValue(priority)
    );
    
    if (insertIndex === -1) {
      this.queue.push(operation);
    } else {
      this.queue.splice(insertIndex, 0, operation);
    }
    
    await this.saveQueue();
    this.notifyStatusChange();
    
    // Cache in IndexedDB
    if (compressed && checksum) {
      await IndexedDBCache.cacheSave(campaignId, compressed, checksum, 'local');
    }
    
    // Trigger processing if online
    if (navigator.onLine && !this.isPaused) {
      this.processQueue();
    } else {
      // Offline — ask the SW to flush as soon as connectivity returns.
      // Lazy-imported to avoid circular deps and to keep this service
      // usable in non-browser contexts.
      void import('@/pwa/registerSW')
        .then((m) => m.requestBackgroundSync())
        .catch(() => {});
    }

    console.log('[BackgroundSync] Enqueued operation:', type, 'for', campaignId);
    return operationId;
  }


  private getPriorityValue(priority: SyncPriority): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
    }
  }

  async dequeue(operationId: string): Promise<void> {
    this.queue = this.queue.filter(op => op.id !== operationId);
    await this.saveQueue();
    this.notifyStatusChange();
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueuedOperations(): QueuedOperation[] {
    return [...this.queue];
  }

  // ============================================================================
  // Queue Processing
  // ============================================================================

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused || !navigator.onLine) {
      return;
    }
    
    if (this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    this.progress = {
      total: this.queue.length,
      completed: 0,
      failed: 0,
      inProgress: true,
    };
    this.notifyStatusChange();
    
    console.log('[BackgroundSync] Processing queue:', this.queue.length, 'operations');
    
    try {
      // Process in batches
      const batch = this.queue.slice(0, BATCH_SIZE);
      
      for (const operation of batch) {
        this.progress.currentOperation = operation.metadata?.campaignName || operation.campaignId;
        this.notifyStatusChange();
        
        const success = await this.processOperation(operation);
        
        if (success) {
          this.progress.completed++;
          await this.dequeue(operation.id);
        } else {
          this.progress.failed++;
          await this.handleOperationFailure(operation);
        }
      }
      
      this.lastSyncTime = Date.now();
    } catch (e) {
      console.error('[BackgroundSync] Queue processing error:', e);
    } finally {
      this.isProcessing = false;
      this.progress.inProgress = false;
      this.progress.currentOperation = undefined;
      this.notifyStatusChange();
      
      // Continue processing if more items
      if (this.queue.length > 0 && navigator.onLine) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private async processOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[BackgroundSync] Not authenticated, skipping cloud sync');
        return false;
      }
      
      switch (operation.type) {
        case 'save':
          return await this.processSaveOperation(operation, user.id);
        case 'delete':
          return await this.processDeleteOperation(operation, user.id);
        case 'sync':
          return await this.processSyncOperation(operation, user.id);
        default:
          console.warn('[BackgroundSync] Unknown operation type:', operation.type);
          return true; // Remove unknown operations
      }
    } catch (e) {
      console.error('[BackgroundSync] Operation failed:', e);
      operation.lastError = e instanceof Error ? e.message : 'Unknown error';
      return false;
    }
  }

  private async processSaveOperation(operation: QueuedOperation, userId: string): Promise<boolean> {
    if (!operation.data || !operation.checksum) {
      console.warn('[BackgroundSync] Save operation missing data');
      return true; // Remove invalid operations
    }
    
    const campaign = decompressCampaign(operation.data);
    if (!campaign) {
      console.warn('[BackgroundSync] Failed to decompress campaign data');
      return true;
    }
    
    // Check for existing save
    const { data: existing } = await supabase
      .from('cloud_saves')
      .select('id, version, checksum')
      .eq('campaign_id', operation.campaignId)
      .eq('user_id', userId)
      .maybeSingle();
    
    // Skip if checksum matches (no changes)
    if (existing?.checksum === operation.checksum) {
      console.log('[BackgroundSync] No changes detected, skipping upload');
      return true;
    }
    
    const saveData = {
      campaign_id: operation.campaignId,
      user_id: userId,
      campaign_name: campaign.meta?.name || 'Untitled Campaign',
      character_name: campaign.player?.name || 'Unknown',
      primary_genre: campaign.meta?.primaryGenre || 'Fantasy',
      chapter_count: campaign.chapters?.length || 0,
      character_level: campaign.player?.level || 1,
      play_time: campaign.meta?.playTime || 0,
      save_data: JSON.parse(JSON.stringify(campaign)),
      checksum: operation.checksum,
      version: (existing?.version || 0) + 1,
      last_synced_at: new Date().toISOString(),
    };
    
    const { error } = existing
      ? await supabase
          .from('cloud_saves')
          .update(saveData)
          .eq('id', existing.id)
      : await supabase
          .from('cloud_saves')
          .insert(saveData);
    
    if (error) {
      console.error('[BackgroundSync] Cloud save error:', error);
      return false;
    }
    
    console.log('[BackgroundSync] Successfully synced campaign to cloud:', operation.campaignId);
    return true;
  }

  private async processDeleteOperation(operation: QueuedOperation, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('cloud_saves')
      .delete()
      .eq('campaign_id', operation.campaignId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('[BackgroundSync] Cloud delete error:', error);
      return false;
    }
    
    console.log('[BackgroundSync] Successfully deleted from cloud:', operation.campaignId);
    return true;
  }

  private async processSyncOperation(operation: QueuedOperation, userId: string): Promise<boolean> {
    // For sync operations, we pull from cloud and merge
    const { data: cloudSave, error } = await supabase
      .from('cloud_saves')
      .select('*')
      .eq('campaign_id', operation.campaignId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[BackgroundSync] Cloud fetch error:', error);
      return false;
    }
    
    if (cloudSave) {
      // Cache the cloud version
      const compressed = compressCampaign(cloudSave.save_data as unknown as CampaignData);
      await IndexedDBCache.cacheSave(operation.campaignId, compressed, cloudSave.checksum, 'cloud');
    }
    
    return true;
  }

  private async handleOperationFailure(operation: QueuedOperation): Promise<void> {
    operation.retryCount++;
    
    if (operation.retryCount >= MAX_RETRIES) {
      console.warn('[BackgroundSync] Max retries reached, removing operation:', operation.id);
      await this.dequeue(operation.id);
      return;
    }
    
    // Move to end of queue with same priority
    this.queue = this.queue.filter(op => op.id !== operation.id);
    this.queue.push(operation);
    await this.saveQueue();
    
    // Schedule retry with backoff
    const delay = RETRY_DELAYS[operation.retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    console.log('[BackgroundSync] Retrying in', delay, 'ms');
  }

  // ============================================================================
  // Online/Offline Handling
  // ============================================================================

  private handleOnline(): void {
    console.log('[BackgroundSync] Online - resuming sync');
    this.notifyStatusChange();
    this.processQueue();
  }

  private handleOffline(): void {
    console.log('[BackgroundSync] Offline - pausing sync');
    this.notifyStatusChange();
  }

  pauseSync(): void {
    this.isPaused = true;
    this.notifyStatusChange();
    console.log('[BackgroundSync] Sync paused');
  }

  resumeSync(): void {
    this.isPaused = false;
    this.notifyStatusChange();
    if (navigator.onLine) {
      this.processQueue();
    }
    console.log('[BackgroundSync] Sync resumed');
  }

  // ============================================================================
  // Status & Callbacks
  // ============================================================================

  getStatus(): BackgroundSyncStatus {
    return {
      isOnline: navigator.onLine,
      isPaused: this.isPaused,
      queueSize: this.queue.length,
      lastSyncTime: this.lastSyncTime,
      progress: { ...this.progress },
    };
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    // Immediately call with current status
    callback(this.getStatus());
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(cb => cb(status));
  }

  // ============================================================================
  // Manual Sync
  // ============================================================================

  async forceSyncNow(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) {
      return { synced: 0, failed: 0 };
    }
    
    const initialQueue = this.queue.length;
    await this.processQueue();
    
    // Wait for processing to complete
    while (this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const synced = initialQueue - this.queue.length;
    return {
      synced,
      failed: this.progress.failed,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyStatusChange();
    console.log('[BackgroundSync] Queue cleared');
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.statusCallbacks.clear();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const BackgroundSyncManager = new BackgroundSyncManagerClass();

// Initialize on load
if (typeof window !== 'undefined') {
  BackgroundSyncManager.initialize().catch(console.error);
}
