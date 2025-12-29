// ============================================================================
// CAMPAIGN CONTEXT - React context for campaign state management
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import {
  CampaignMetadata,
  CampaignData,
  CampaignCheckpoint,
  CampaignContextType,
  CampaignIsolationGuard,
  AUTO_SAVE_INTERVAL,
} from '@/types/campaign';
import {
  loadCampaignIndex,
  loadCampaign,
  saveCampaign,
  deleteCampaignData,
  createNewCampaign,
  duplicateCampaignData,
  createCheckpoint,
  addCheckpointToCampaign,
  restoreFromCheckpoint,
  exportCampaignToJson,
  importCampaignFromJson,
  getActiveCampaignId,
  setActiveCampaignId,
  canCreateCampaign,
  performStartupCleanup,
  verifyCampaignDeleted,
} from '@/lib/campaignStorage';
import { WorldBible } from '@/game/worldBible/types';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const CampaignContext = createContext<CampaignContextType | null>(null);

export const useCampaign = (): CampaignContextType => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export const useCampaignOptional = (): CampaignContextType | null => {
  return useContext(CampaignContext);
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface CampaignProviderProps {
  children: ReactNode;
}

export const CampaignProvider: React.FC<CampaignProviderProps> = ({ children }) => {
  // Run startup cleanup ONCE on mount
  const hasRunCleanup = useRef(false);
  useEffect(() => {
    if (!hasRunCleanup.current) {
      hasRunCleanup.current = true;
      const result = performStartupCleanup();
      if (result.cleaned > 0) {
        console.log(`[Campaign] Startup cleanup fixed ${result.cleaned} issues`);
      }
    }
  }, []);
  
  // Campaign list
  const [campaigns, setCampaigns] = useState<CampaignMetadata[]>(() => loadCampaignIndex());
  
  // Active campaign
  const [activeCampaign, setActiveCampaign] = useState<CampaignData | null>(() => {
    const activeId = getActiveCampaignId();
    if (activeId) {
      return loadCampaign(activeId);
    }
    return null;
  });
  
  // Dirty state for auto-save
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  // Play time tracking
  const playTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  
  // Isolation guard
  const isolationGuardRef = useRef<CampaignIsolationGuard | null>(null);
  
  // Update isolation guard when campaign changes
  useEffect(() => {
    if (activeCampaign) {
      isolationGuardRef.current = new CampaignIsolationGuard(activeCampaign.id);
    } else {
      isolationGuardRef.current = null;
    }
  }, [activeCampaign?.id]);
  
  // Play time tracking effect
  useEffect(() => {
    if (!activeCampaign) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      playTimeRef.current += elapsed;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeCampaign?.id]);
  
  // Save function ref to avoid stale closures
  const saveNowRef = useRef<() => void>(() => {});
  
  // Save now
  const saveNow = useCallback(() => {
    if (!activeCampaign) return;
    
    const updatedCampaign: CampaignData = {
      ...activeCampaign,
      meta: {
        ...activeCampaign.meta,
        playTime: activeCampaign.meta.playTime + playTimeRef.current,
        updatedAt: Date.now(),
      },
    };
    
    saveCampaign(updatedCampaign);
    setActiveCampaign(updatedCampaign);
    setIsDirty(false);
    setLastSaved(Date.now());
    playTimeRef.current = 0;
    
    // Refresh campaign list
    setCampaigns(loadCampaignIndex());
    console.log('[Campaign] Saved');
  }, [activeCampaign]);
  
  // Keep ref updated
  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);
  
  // Auto-save effect
  useEffect(() => {
    if (!activeCampaign || !isDirty) return;
    
    const timer = setTimeout(() => {
      saveNowRef.current();
    }, AUTO_SAVE_INTERVAL);
    
    return () => clearTimeout(timer);
  }, [activeCampaign, isDirty]);
  
  // Save on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeCampaign && isDirty) {
        saveNowRef.current();
      }
    };
    
    const handleBeforeUnload = () => {
      if (activeCampaign && isDirty) {
        saveNowRef.current();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeCampaign, isDirty]);
  
  // Mark dirty
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);
  
  // Refresh campaigns list
  const refreshCampaigns = useCallback(() => {
    setCampaigns(loadCampaignIndex());
  }, []);
  
  // Create campaign
  const createCampaignFunc = useCallback((
    worldBible: WorldBible,
    player: RPGCharacter,
    scenario: string
  ): CampaignData => {
    const campaign = createNewCampaign(worldBible, player, scenario);
    saveCampaign(campaign);
    setActiveCampaignId(campaign.id);
    setActiveCampaign(campaign);
    refreshCampaigns();
    console.log(`[Campaign] Created: ${campaign.meta.name}`);
    return campaign;
  }, [refreshCampaigns]);
  
  // Load campaign - CRITICAL: Clear previous state first
  const loadCampaignFunc = useCallback((campaignId: string): boolean => {
    // If loading a different campaign, save current one first
    if (activeCampaign && activeCampaign.id !== campaignId && isDirty) {
      console.log(`[Campaign] Saving current campaign before switch: ${activeCampaign.meta.name}`);
      saveNow();
    }
    
    // Clear current campaign state BEFORE loading new one
    if (activeCampaign && activeCampaign.id !== campaignId) {
      console.log(`[Campaign] Clearing state before loading new campaign`);
      setActiveCampaign(null);
      setActiveCampaignId(null);
    }
    
    // Load the new campaign
    const campaign = loadCampaign(campaignId);
    if (campaign) {
      setActiveCampaignId(campaignId);
      setActiveCampaign(campaign);
      lastTickRef.current = Date.now();
      playTimeRef.current = 0;
      setIsDirty(false);
      refreshCampaigns();
      console.log(`[Campaign] Loaded: ${campaign.meta.name} (ID: ${campaignId})`);
      return true;
    }
    console.error(`[Campaign] Failed to load campaign: ${campaignId}`);
    return false;
  }, [activeCampaign, isDirty, saveNow, refreshCampaigns]);
  
  // Unload campaign - Fully clear state
  const unloadCampaign = useCallback(() => {
    if (activeCampaign) {
      if (isDirty) {
        saveNow();
      }
      console.log(`[Campaign] Unloading: ${activeCampaign.meta.name}`);
    }
    setActiveCampaignId(null);
    setActiveCampaign(null);
    setIsDirty(false);
    playTimeRef.current = 0;
    refreshCampaigns();
    console.log('[Campaign] Unloaded and state cleared');
  }, [activeCampaign, isDirty, saveNow, refreshCampaigns]);
  
  // Delete campaign - Use proper full delete with verification
  const deleteCampaignFunc = useCallback((campaignId: string) => {
    console.log(`[Campaign] Starting delete: ${campaignId}`);
    
    // If deleting active campaign, unload first
    if (activeCampaign?.id === campaignId) {
      console.log(`[Campaign] Unloading active campaign before delete`);
      setActiveCampaignId(null);
      setActiveCampaign(null);
      setIsDirty(false);
    }
    
    // Perform the full delete (removes all related keys)
    deleteCampaignData(campaignId);
    
    // Verify deletion was successful
    const verified = verifyCampaignDeleted(campaignId);
    if (!verified) {
      console.error(`[Campaign] Delete verification failed for ${campaignId}, forcing cleanup`);
      // Force remove any remaining keys
      const allKeys = Object.keys(localStorage);
      allKeys.filter(k => k.includes(campaignId)).forEach(k => {
        localStorage.removeItem(k);
        console.log(`[Campaign] Force removed: ${k}`);
      });
    }
    
    refreshCampaigns();
    console.log(`[Campaign] Delete complete: ${campaignId}`);
  }, [activeCampaign, refreshCampaigns]);
  
  // Duplicate campaign
  const duplicateCampaignFunc = useCallback((campaignId: string, newName: string): CampaignData | null => {
    if (!canCreateCampaign()) {
      console.warn('[Campaign] Maximum campaigns reached');
      return null;
    }
    
    const duplicate = duplicateCampaignData(campaignId, newName);
    if (duplicate) {
      saveCampaign(duplicate);
      refreshCampaigns();
      console.log(`[Campaign] Duplicated: ${newName}`);
      return duplicate;
    }
    return null;
  }, [refreshCampaigns]);
  
  // Update campaign
  const updateCampaignFunc = useCallback((updates: Partial<CampaignData>) => {
    if (!activeCampaign) return;
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Update player
  const updatePlayer = useCallback((player: RPGCharacter) => {
    if (!activeCampaign) return;
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return { ...prev, player };
    });
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Add narrative entry
  const addNarrativeEntry = useCallback((entry: StoryEntry) => {
    if (!activeCampaign) return;
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        narrativeHistory: [...prev.narrativeHistory, entry],
        currentTick: prev.currentTick + 1,
      };
    });
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Sync full narrative history (for ensuring local story state matches campaign)
  const syncNarrativeHistory = useCallback((entries: StoryEntry[]) => {
    if (!activeCampaign) return;
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        narrativeHistory: entries,
      };
    });
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Advance chapter
  const advanceChapter = useCallback((title?: string) => {
    if (!activeCampaign) return;
    
    const now = Date.now();
    const newChapterNumber = activeCampaign.currentChapter.number + 1;
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        chapters: [
          ...prev.chapters,
          {
            ...prev.currentChapter,
            completedAt: now,
          },
        ],
        currentChapter: {
          number: newChapterNumber,
          title: title || `Chapter ${newChapterNumber}`,
          startedAt: now,
        },
      };
    });
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Create checkpoint
  const createCheckpointFunc = useCallback((label: string): CampaignCheckpoint | null => {
    if (!activeCampaign) return null;
    
    const checkpoint = createCheckpoint(activeCampaign, label);
    const updated = addCheckpointToCampaign(activeCampaign, checkpoint);
    setActiveCampaign(updated);
    markDirty();
    console.log(`[Campaign] Checkpoint created: ${label}`);
    return checkpoint;
  }, [activeCampaign, markDirty]);
  
  // Restore checkpoint
  const restoreCheckpointFunc = useCallback((checkpointId: string): boolean => {
    if (!activeCampaign) return false;
    
    const restored = restoreFromCheckpoint(activeCampaign, checkpointId);
    if (restored) {
      setActiveCampaign(restored);
      markDirty();
      console.log(`[Campaign] Restored checkpoint: ${checkpointId}`);
      return true;
    }
    return false;
  }, [activeCampaign, markDirty]);
  
  // Delete checkpoint
  const deleteCheckpointFunc = useCallback((checkpointId: string) => {
    if (!activeCampaign) return;
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checkpoints: prev.checkpoints.filter(c => c.id !== checkpointId),
      };
    });
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Export campaign
  const exportCampaignFunc = useCallback((campaignId: string): string | null => {
    return exportCampaignToJson(campaignId);
  }, []);
  
  // Import campaign
  const importCampaignFunc = useCallback((jsonData: string): CampaignData | null => {
    const campaign = importCampaignFromJson(jsonData);
    if (campaign) {
      saveCampaign(campaign);
      refreshCampaigns();
      console.log(`[Campaign] Imported: ${campaign.meta.name}`);
      return campaign;
    }
    return null;
  }, [refreshCampaigns]);
  
  // Verify access (isolation guard)
  const verifyAccess = useCallback((campaignId: string) => {
    if (isolationGuardRef.current) {
      isolationGuardRef.current.verify(campaignId);
    }
  }, []);
  
  const value: CampaignContextType = {
    campaigns,
    activeCampaign,
    activeCampaignId: activeCampaign?.id ?? null,
    createCampaign: createCampaignFunc,
    loadCampaign: loadCampaignFunc,
    unloadCampaign,
    deleteCampaign: deleteCampaignFunc,
    duplicateCampaign: duplicateCampaignFunc,
    updateCampaign: updateCampaignFunc,
    updatePlayer,
    addNarrativeEntry,
    syncNarrativeHistory,
    advanceChapter,
    createCheckpoint: createCheckpointFunc,
    restoreCheckpoint: restoreCheckpointFunc,
    deleteCheckpoint: deleteCheckpointFunc,
    exportCampaign: exportCampaignFunc,
    importCampaign: importCampaignFunc,
    isDirty,
    lastSaved,
    saveNow,
    verifyAccess,
  };
  
  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};
