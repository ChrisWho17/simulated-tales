// ============================================================================
// CROSS-TAB SYNC HOOK - React integration for CrossTabSync
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { CrossTabSync, TabRole, ConflictWarning, TabInfo } from '@/systems/CrossTabSync';

export interface UseCrossTabSyncReturn {
  tabId: string;
  role: TabRole;
  isPrimary: boolean;
  tabCount: number;
  activeTabs: TabInfo[];
  latestConflict: ConflictWarning | null;
  canSave: (campaignId: string) => { allowed: boolean; reason?: string };
  notifyCampaignLoaded: (campaignId: string, campaignName: string) => void;
  notifySaveStarted: (campaignId: string, campaignName: string) => void;
  notifySaveCompleted: (campaignId: string, campaignName: string) => void;
  notifyCampaignDeleted: (campaignId: string, campaignName: string) => void;
}

export function useCrossTabSync(): UseCrossTabSyncReturn {
  const [role, setRole] = useState<TabRole>('unknown');
  const [tabCount, setTabCount] = useState(1);
  const [activeTabs, setActiveTabs] = useState<TabInfo[]>([]);
  const [latestConflict, setLatestConflict] = useState<ConflictWarning | null>(null);

  useEffect(() => {
    const unsubRole = CrossTabSync.onRoleChange(setRole);
    const unsubCount = CrossTabSync.onTabCountChange((count) => {
      setTabCount(count);
      setActiveTabs(CrossTabSync.getActiveTabs());
    });
    const unsubConflict = CrossTabSync.onConflict(setLatestConflict);

    return () => {
      unsubRole();
      unsubCount();
      unsubConflict();
    };
  }, []);

  const canSave = useCallback((campaignId: string) => {
    return CrossTabSync.canSaveCampaign(campaignId);
  }, []);

  const notifyCampaignLoaded = useCallback((campaignId: string, campaignName: string) => {
    CrossTabSync.notifyCampaignLoaded(campaignId, campaignName);
  }, []);

  const notifySaveStarted = useCallback((campaignId: string, campaignName: string) => {
    CrossTabSync.notifySaveStarted(campaignId, campaignName);
  }, []);

  const notifySaveCompleted = useCallback((campaignId: string, campaignName: string) => {
    CrossTabSync.notifySaveCompleted(campaignId, campaignName);
  }, []);

  const notifyCampaignDeleted = useCallback((campaignId: string, campaignName: string) => {
    CrossTabSync.notifyCampaignDeleted(campaignId, campaignName);
  }, []);

  return {
    tabId: CrossTabSync.getTabId(),
    role,
    isPrimary: role === 'primary',
    tabCount,
    activeTabs,
    latestConflict,
    canSave,
    notifyCampaignLoaded,
    notifySaveStarted,
    notifySaveCompleted,
    notifyCampaignDeleted,
  };
}

export default useCrossTabSync;
