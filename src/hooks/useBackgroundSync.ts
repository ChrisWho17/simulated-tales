// ============================================================================
// USE BACKGROUND SYNC HOOK - React hook for background sync integration
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { 
  BackgroundSyncManager, 
  type BackgroundSyncStatus,
  type QueuedOperation 
} from '@/services/backgroundSyncManager';
import { IncrementalSaveService } from '@/services/incrementalSaveService';
import type { CampaignData } from '@/types/campaign';

// ============================================================================
// Types
// ============================================================================

export interface UseBackgroundSyncReturn {
  // Status
  status: BackgroundSyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  
  // Operations
  queueSave: (campaign: CampaignData) => Promise<void>;
  queueDelete: (campaignId: string) => Promise<void>;
  forceSyncNow: () => Promise<{ synced: number; failed: number }>;
  
  // Queue management
  getQueuedOperations: () => QueuedOperation[];
  clearQueue: () => Promise<void>;
  
  // Sync control
  pauseSync: () => void;
  resumeSync: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBackgroundSync(): UseBackgroundSyncReturn {
  const [status, setStatus] = useState<BackgroundSyncStatus>(
    BackgroundSyncManager.getStatus()
  );

  useEffect(() => {
    const unsubscribe = BackgroundSyncManager.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const queueSave = useCallback(async (campaign: CampaignData) => {
    // Use incremental save service which handles diffing and queueing
    await IncrementalSaveService.save(campaign);
  }, []);

  const queueDelete = useCallback(async (campaignId: string) => {
    await BackgroundSyncManager.enqueue(campaignId, 'delete', undefined, 'high');
    IncrementalSaveService.clearSnapshot(campaignId);
  }, []);

  const forceSyncNow = useCallback(async () => {
    return BackgroundSyncManager.forceSyncNow();
  }, []);

  const getQueuedOperations = useCallback(() => {
    return BackgroundSyncManager.getQueuedOperations();
  }, []);

  const clearQueue = useCallback(async () => {
    await BackgroundSyncManager.clearQueue();
  }, []);

  const pauseSync = useCallback(() => {
    BackgroundSyncManager.pauseSync();
  }, []);

  const resumeSync = useCallback(() => {
    BackgroundSyncManager.resumeSync();
  }, []);

  return {
    status,
    isOnline: status.isOnline,
    isSyncing: status.progress.inProgress,
    pendingCount: status.queueSize,
    
    queueSave,
    queueDelete,
    forceSyncNow,
    
    getQueuedOperations,
    clearQueue,
    
    pauseSync,
    resumeSync,
  };
}

// ============================================================================
// Utility Hook - Auto-save with incremental sync
// ============================================================================

export interface UseAutoSyncOptions {
  campaignId?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSync(
  campaign: CampaignData | null,
  options: UseAutoSyncOptions = {}
) {
  const { enabled = true, debounceMs = 2000 } = options;
  const { queueSave, status } = useBackgroundSync();
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!enabled || !campaign) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        await queueSave(campaign);
        setLastSaved(Date.now());
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [campaign, enabled, debounceMs, queueSave]);

  return {
    isSaving,
    lastSaved,
    isOnline: status.isOnline,
    pendingSync: status.queueSize > 0,
  };
}

export default useBackgroundSync;
