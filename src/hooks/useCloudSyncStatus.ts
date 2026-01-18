// ============================================================================
// USE CLOUD SYNC STATUS HOOK - React hook for unified save architecture state
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
  const [migrationCount, setMigrationCount] = useState(0);
  
  useEffect(() => {
    // Initialize the architecture
    UnifiedSaveArchitecture.initialize();
    
    // Track previous mode to detect sign-in
    let previousMode = UnifiedSaveArchitecture.getAccount().mode;
    
    // Subscribe to account changes
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange((newAccount) => {
      // Detect transition from local-only to cloud (sign-in)
      const justSignedIn = previousMode === 'local-only' && newAccount.mode === 'cloud';
      previousMode = newAccount.mode;
      
      setAccount(newAccount);
      if (newAccount.lastSyncedAt) {
        setLastSyncedAt(newAccount.lastSyncedAt);
      }
      
      // Show welcome toast on sign-in
      if (justSignedIn && newAccount.displayName) {
        toast.success(`Welcome, ${newAccount.displayName}!`, {
          description: 'Your campaigns will sync to the cloud automatically.',
        });
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
      
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} campaign${result.synced > 1 ? 's' : ''}`);
      }
      if (result.conflicts > 0) {
        toast.warning(`${result.conflicts} conflict${result.conflicts > 1 ? 's' : ''} detected`);
      }
      
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [account.mode]);
  
  const resolveConflict = useCallback(async (campaignId: string, resolution: 'local' | 'cloud') => {
    const success = await UnifiedSaveArchitecture.resolveConflict(campaignId, resolution);
    if (success) {
      toast.success(`Conflict resolved (kept ${resolution} version)`);
    }
    return success;
  }, []);
  
  const signInWithGoogle = useCallback(async () => {
    return UnifiedSaveArchitecture.signInWithGoogle();
  }, []);
  
  const signOut = useCallback(async () => {
    await UnifiedSaveArchitecture.signOut();
    toast.info('Signed out - your saves are stored locally');
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
    migrationCount,
    forceSync,
    resolveConflict,
    signInWithGoogle,
    signOut,
  };
}

export default useCloudSyncStatus;
