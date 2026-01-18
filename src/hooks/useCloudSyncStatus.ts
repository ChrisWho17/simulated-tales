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
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(
    UnifiedSaveArchitecture.getAccount().lastSyncedAt || null
  );
  
  useEffect(() => {
    // Initialize the architecture
    UnifiedSaveArchitecture.initialize();
    
    // Subscribe to account changes
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange((newAccount) => {
      setAccount(newAccount);
      if (newAccount.lastSyncedAt) {
        setLastSyncedAt(newAccount.lastSyncedAt);
      }
    });
    
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
      setLastSyncedAt(Date.now());
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [account.mode]);
  
  const resolveConflict = useCallback(async (campaignId: string, resolution: 'local' | 'cloud') => {
    return UnifiedSaveArchitecture.resolveConflict(campaignId, resolution);
  }, []);
  
  const signInWithGoogle = useCallback(async () => {
    return UnifiedSaveArchitecture.signInWithGoogle();
  }, []);
  
  const signOut = useCallback(async () => {
    return UnifiedSaveArchitecture.signOut();
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
    lastSyncedAt,
    conflicts,
    hasConflicts: conflicts.length > 0,
    overallState: getOverallState(),
    isSyncing,
    forceSync,
    resolveConflict,
    signInWithGoogle,
    signOut,
  };
}

export default useCloudSyncStatus;
