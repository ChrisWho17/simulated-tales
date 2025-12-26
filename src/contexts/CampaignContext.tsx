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
  
  // Load campaign
  const loadCampaignFunc = useCallback((campaignId: string): boolean => {
    const campaign = loadCampaign(campaignId);
    if (campaign) {
      setActiveCampaignId(campaignId);
      setActiveCampaign(campaign);
      lastTickRef.current = Date.now();
      playTimeRef.current = 0;
      refreshCampaigns();
      console.log(`[Campaign] Loaded: ${campaign.meta.name}`);
      return true;
    }
    return false;
  }, [refreshCampaigns]);
  
  // Unload campaign
  const unloadCampaign = useCallback(() => {
    if (activeCampaign && isDirty) {
      saveNow();
    }
    setActiveCampaignId(null);
    setActiveCampaign(null);
    refreshCampaigns();
    console.log('[Campaign] Unloaded');
  }, [activeCampaign, isDirty, saveNow, refreshCampaigns]);
  
  // Delete campaign
  const deleteCampaignFunc = useCallback((campaignId: string) => {
    if (activeCampaign?.id === campaignId) {
      unloadCampaign();
    }
    deleteCampaignData(campaignId);
    refreshCampaigns();
    console.log(`[Campaign] Deleted: ${campaignId}`);
  }, [activeCampaign, unloadCampaign, refreshCampaigns]);
  
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
