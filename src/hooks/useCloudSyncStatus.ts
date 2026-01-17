// ============================================================================
// USE CLOUD SYNC STATUS HOOK - React hook for unified save architecture state
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { 
  UnifiedSaveArchitecture, 
  UnifiedAccount, 
  SaveConflict, 
  SyncState 
} from '@/services/unifiedSaveArchitecture';

export interface CloudSyncStatus {
  account: UnifiedAccount;
  isCloudMode: boolean;
  lastSyncedAt: number | null;
  conflicts: SaveConflict[];
  overallState: SyncState;
}

export function useCloudSyncStatus() {
  const [account, setAccount] = useState<UnifiedAccount>(
    UnifiedSaveArchitecture.getAccount()
  );
  const [conflicts, setConflicts] = useState<SaveConflict[]>(
    UnifiedSaveArchitecture.getConflicts()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    // Initialize the architecture
    UnifiedSaveArchitecture.initialize();
    
    // Subscribe to account changes
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange(setAccount);
    
    // Subscribe to conflict changes
    const unsubConflicts = UnifiedSaveArchitecture.onConflictChange(setConflicts);
    
    return () => {
      unsubAccount();
      unsubConflicts();
    };
  }, []);
  
  const forceSync = useCallback(async () => {
    if (account.mode !== 'cloud') return { synced: 0, conflicts: 0 };
    
    setIsSyncing(true);
    try {
      const result = await UnifiedSaveArchitecture.syncWithCloud();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [account.mode]);
  
  const resolveConflict = useCallback(async (campaignId: string, resolution: 'local' | 'cloud') => {
    return UnifiedSaveArchitecture.resolveConflict(campaignId, resolution);
  }, []);
  
  // Calculate overall sync state
  const getOverallState = (): SyncState => {
    if (account.mode !== 'cloud') return 'offline';
    if (conflicts.length > 0) return 'conflict';
    if (isSyncing) return 'pending';
    return 'synced';
  };
  
  return {
    account,
    isCloudMode: account.mode === 'cloud',
    lastSyncedAt: account.lastSyncedAt || null,
    conflicts,
    hasConflicts: conflicts.length > 0,
    overallState: getOverallState(),
    isSyncing,
    forceSync,
    resolveConflict,
  };
}

export default useCloudSyncStatus;
