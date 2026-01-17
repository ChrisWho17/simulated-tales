// ============================================================================
// STORAGE HEALTH HOOK - React integration for StorageHealthMonitor
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { StorageHealthMonitor, StorageHealth } from '@/systems/StorageHealthMonitor';

export interface UseStorageHealthReturn {
  health: StorageHealth | null;
  isHealthy: boolean;
  isWarning: boolean;
  isCritical: boolean;
  quotaPercent: number;
  lastBackupAge: string;
  triggerBackup: () => Promise<boolean>;
  verifyAndRepair: (campaignId: string) => Promise<{
    wasCorrupted: boolean;
    repaired: boolean;
    details: string;
  }>;
}

export function useStorageHealth(): UseStorageHealthReturn {
  const [health, setHealth] = useState<StorageHealth | null>(null);

  useEffect(() => {
    // Subscribe to health changes
    const unsubscribe = StorageHealthMonitor.onHealthChange(setHealth);
    
    // Get initial health
    const initialHealth = StorageHealthMonitor.getHealth();
    if (initialHealth) {
      setHealth(initialHealth);
    }

    return unsubscribe;
  }, []);

  const triggerBackup = useCallback(async () => {
    return StorageHealthMonitor.triggerManualBackup();
  }, []);

  const verifyAndRepair = useCallback(async (campaignId: string) => {
    return StorageHealthMonitor.verifyAndRepair(campaignId);
  }, []);

  return {
    health,
    isHealthy: health?.status === 'healthy',
    isWarning: health?.status === 'warning',
    isCritical: health?.status === 'critical',
    quotaPercent: health?.quotaUsedPercent ?? 0,
    lastBackupAge: health?.lastBackupAge ?? 'Unknown',
    triggerBackup,
    verifyAndRepair,
  };
}

export default useStorageHealth;
