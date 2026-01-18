// ============================================================================
// CAMPAIGN CONTEXT - Cloud-first with Google auth, GUEST-LOCAL fallback
// Integrated with UnifiedSaveArchitecture for transactional saves
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import {
  CampaignMetadata,
  CampaignData,
  CampaignCheckpoint,
  CampaignContextType,
  CampaignIsolationGuard,
  AUTO_SAVE_INTERVAL,
  MAX_CHECKPOINTS,
} from '@/types/campaign';
import { 
  UnifiedSaveArchitecture, 
  UnifiedAccount, 
  SyncState,
  SaveConflict,
  CampaignSyncStatus 
} from '@/services/unifiedSaveArchitecture';
import { DataIntegrityService } from '@/services/dataIntegrityService';
import { WorldBible } from '@/game/worldBible/types';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';
import { GameGenre } from '@/types/genreData';
import { createInitialWeatherState } from '@/game/weatherSystem';
import { createInitialTimeState } from '@/game/timeProgressionSystem';
import { seedWorldForGenre, hasGenreSeed } from '@/game/livingWorld';
import { getNPCRegistry, setNPCRegistry, NPCIdentityRegistry, clearNPCRegistry } from '@/game/npcIdentityRegistry';
import { clearPersonalityAssignments, exportPersonalityMap, importPersonalityMap } from '@/game/npcPersonalityDialogue';
import { setNPCAutoRegistrationGenre } from '@/game/npcAutoRegistration';
import { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';

// ============================================================================
// EXTENDED CONTEXT TYPE
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SaveAccount {
  mode: 'cloud' | 'guest-local';
  userId: string | null;
  email: string | null;
  displayName: string | null;
}

interface ExtendedCampaignContextType extends CampaignContextType {
  // Cloud/Account info
  account: SaveAccount;
  syncStatus: SyncStatus;
  isCloudEnabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  // New: Conflict management
  conflicts: SaveConflict[];
  resolveConflict: (campaignId: string, resolution: 'local' | 'cloud') => Promise<boolean>;
  getSyncState: (campaignId: string) => SyncState;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const CampaignContext = createContext<ExtendedCampaignContextType | null>(null);

export const useCampaign = (): ExtendedCampaignContextType => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export const useCampaignOptional = (): ExtendedCampaignContextType | null => {
  return useContext(CampaignContext);
};

// ============================================================================
// HELPER: Create checkpoint
// ============================================================================

function createCheckpointData(campaign: CampaignData, label: string): CampaignCheckpoint {
  return {
    id: `checkpoint_${Date.now()}`,
    label,
    createdAt: Date.now(),
    player: { ...campaign.player },
    narrativeHistory: [...campaign.narrativeHistory],
    escalationTier: campaign.escalationTier,
    currentTick: campaign.currentTick,
  };
}

// ============================================================================
// HELPER: Convert account types
// ============================================================================

function convertAccount(unified: UnifiedAccount): SaveAccount {
  return {
    mode: unified.mode === 'cloud' ? 'cloud' : 'guest-local',
    userId: unified.userId || null,
    email: unified.email || null,
    displayName: unified.displayName || null,
  };
}

function convertSyncStatus(state: SyncState): SyncStatus {
  switch (state) {
    case 'synced': return 'synced';
    case 'pending': return 'syncing';
    case 'conflict':
    case 'error':
    case 'offline':
      return 'error';
    default: return 'idle';
  }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface CampaignProviderProps {
  children: ReactNode;
}

export const CampaignProvider: React.FC<CampaignProviderProps> = ({ children }) => {
  // Account and sync state
  const [account, setAccount] = useState<SaveAccount>(() => 
    convertAccount(UnifiedSaveArchitecture.getAccount())
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [conflicts, setConflicts] = useState<SaveConflict[]>([]);
  const [syncStates, setSyncStates] = useState<Map<string, SyncState>>(new Map());
  
  // Campaign list
  const [campaigns, setCampaigns] = useState<CampaignMetadata[]>([]);
  
  // Active campaign
  const [activeCampaign, setActiveCampaign] = useState<CampaignData | null>(null);
  
  // Dirty state for auto-save
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  // Play time tracking
  const playTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  
  // Isolation guard
  const isolationGuardRef = useRef<CampaignIsolationGuard | null>(null);
  
  // Initialize
  useEffect(() => {
    const init = async () => {
      await UnifiedSaveArchitecture.initialize();
      setAccount(convertAccount(UnifiedSaveArchitecture.getAccount()));
      setConflicts(UnifiedSaveArchitecture.getConflicts());
      
      // Load campaigns
      const list = await UnifiedSaveArchitecture.listCampaigns();
      setCampaigns(list);
      
      // Load active campaign if any
      const activeId = UnifiedSaveArchitecture.getActiveCampaignId();
      if (activeId) {
        // Use integrity-validated load
        const { campaign, integrityResult } = await DataIntegrityService.loadWithValidation(activeId);
        if (campaign) {
          if (integrityResult.status === 'repaired') {
            console.log(`[Campaign] Loaded campaign was auto-repaired: ${integrityResult.repairedFrom}`);
          }
          setupCampaignForLoad(campaign);
          setActiveCampaign(campaign);
        }
      }
    };
    
    init();
    
    // Subscribe to account changes
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange((unified) => {
      setAccount(convertAccount(unified));
    });
    
    // Subscribe to conflict changes
    const unsubConflicts = UnifiedSaveArchitecture.onConflictChange(setConflicts);
    
    // Subscribe to sync status changes
    const unsubSync = UnifiedSaveArchitecture.onSyncStatusChange((status) => {
      setSyncStates(prev => new Map(prev).set(status.campaignId, status.state));
      setSyncStatus(convertSyncStatus(status.state));
    });
    
    return () => {
      unsubAccount();
      unsubConflicts();
      unsubSync();
    };
  }, []);
  
  // Setup NPC registry when loading a campaign
  const setupCampaignForLoad = useCallback((campaign: CampaignData) => {
    // Clear NPC registry before loading
    const emptyRegistry: NPCIdentityRegistry = {
      npcs: {},
      relationships: {},
      families: {},
      lockedIds: [],
    };
    setNPCRegistry(emptyRegistry);
    clearPersonalityAssignments();
    
    // Set genre for auto-registration
    if (campaign.meta?.primaryGenre) {
      setNPCAutoRegistrationGenre(campaign.meta.primaryGenre);
    }
    
    // Restore NPC registry from save
    if (campaign.npcRegistryState) {
      const savedRegistry: NPCIdentityRegistry = {
        npcs: campaign.npcRegistryState.npcs as any || {},
        relationships: campaign.npcRegistryState.relationships as any || {},
        families: campaign.npcRegistryState.families as any || {},
        lockedIds: campaign.npcRegistryState.lockedIds || [],
      };
      setNPCRegistry(savedRegistry);
    }
    
    // Restore personality map
    if (campaign.npcPersonalityMap) {
      importPersonalityMap(campaign.npcPersonalityMap as any);
    }
  }, []);
  
  // Prepare campaign for save (capture NPC state)
  const prepareCampaignForSave = useCallback((campaign: CampaignData): CampaignData => {
    const npcRegistry = getNPCRegistry();
    const personalityMap = exportPersonalityMap();
    
    return {
      ...campaign,
      npcRegistryState: {
        npcs: npcRegistry.npcs,
        relationships: npcRegistry.relationships,
        families: npcRegistry.families,
        lockedIds: npcRegistry.lockedIds,
      },
      npcPersonalityMap: personalityMap,
    };
  }, []);
  
  // Update isolation guard when campaign changes
  useEffect(() => {
    if (activeCampaign) {
      isolationGuardRef.current = new CampaignIsolationGuard(activeCampaign.id);
    } else {
      isolationGuardRef.current = null;
    }
  }, [activeCampaign?.id]);
  
  // Play time tracking
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
  
  // Save function ref
  const saveNowRef = useRef<() => Promise<void>>(async () => {});
  
  // Save now - using integrity-validated save
  const saveNow = useCallback(async () => {
    if (!activeCampaign) return;
    
    const updatedCampaign = prepareCampaignForSave({
      ...activeCampaign,
      meta: {
        ...activeCampaign.meta,
        playTime: activeCampaign.meta.playTime + playTimeRef.current,
        updatedAt: Date.now(),
      },
    });
    
    setSyncStatus('syncing');
    
    // Use integrity-validated save
    const result = await DataIntegrityService.saveWithIntegrity(updatedCampaign);
    
    if (result.success) {
      // Also sync to cloud via UnifiedSaveArchitecture
      await UnifiedSaveArchitecture.saveCampaign(updatedCampaign);
      
      setActiveCampaign(updatedCampaign);
      setIsDirty(false);
      setLastSaved(Date.now());
      playTimeRef.current = 0;
      setSyncStatus('synced');
      
      // Refresh list
      const list = await UnifiedSaveArchitecture.listCampaigns();
      setCampaigns(list);
    } else {
      console.error('[Campaign] Save failed:', result.error);
      setSyncStatus('error');
    }
  }, [activeCampaign, prepareCampaignForSave]);
  
  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);
  
  // Auto-save
  useEffect(() => {
    if (!activeCampaign || !isDirty) return;
    
    const timer = setTimeout(() => {
      saveNowRef.current();
    }, AUTO_SAVE_INTERVAL);
    
    return () => clearTimeout(timer);
  }, [activeCampaign, isDirty]);
  
  // Save on visibility change / beforeunload
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
  
  // Refresh campaigns
  const refreshCampaigns = useCallback(async () => {
    const list = await UnifiedSaveArchitecture.listCampaigns();
    setCampaigns(list);
  }, []);
  
  // Create campaign
  const createCampaign = useCallback(async (
    worldBible: WorldBible,
    player: RPGCharacter,
    scenario: string
  ): Promise<CampaignData> => {
    const now = Date.now();
    const campaignId = `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`;
    const genre = worldBible.primaryGenre as GameGenre;
    
    // Auto-seed living world
    let livingWorldState: CampaignData['livingWorldState'] = undefined;
    if (hasGenreSeed(genre)) {
      const seeded = seedWorldForGenre(genre);
      livingWorldState = {
        properties: seeded.properties.map(p => [p.id, p]),
        playerProperties: [],
        rivals: seeded.rivals.map(r => [r.id, r]),
        playerRivalries: [],
        factions: seeded.factions.map(f => [f.id, f]),
        playerStanding: [],
        lastTick: 0,
      };
    }
    
    const campaign: CampaignData = {
      id: campaignId,
      meta: {
        name: worldBible.campaignName,
        primaryGenre: genre,
        secondaryGenres: worldBible.secondaryGenres.map(g => g.genreId as string),
        createdAt: now,
        updatedAt: now,
        playTime: 0,
        chapterCount: 1,
      },
      worldBible,
      player,
      chapters: [],
      currentChapter: {
        number: 1,
        title: 'The Beginning',
        startedAt: now,
      },
      narrativeHistory: [],
      escalationTier: 1,
      currentTick: 0,
      scenario,
      checkpoints: [],
      currentMood: 'neutral',
      moodHistory: [],
      weatherState: createInitialWeatherState(),
      timeState: createInitialTimeState(),
      livingWorldState,
      settings: {
        adultContent: false,
        cheatMode: false,
        directorSettings: { ...DEFAULT_DIRECTOR_SETTINGS },
        timeMultiplier: 'fifteen_minutes',
      },
    };
    
    // Save immediately using integrity service
    DataIntegrityService.saveWithIntegrity(campaign);
    
    // Sync to cloud - await this to ensure it completes
    const saveResult = await UnifiedSaveArchitecture.saveCampaign(campaign);
    if (!saveResult.success) {
      console.warn('[Campaign] Cloud save failed on create:', saveResult.error);
    } else {
      console.log('[Campaign] Created and synced to cloud:', campaign.meta.name);
    }
    
    UnifiedSaveArchitecture.setActiveCampaignId(campaign.id);
    setActiveCampaign(campaign);
    await refreshCampaigns();
    
    return campaign;
  }, [refreshCampaigns]);
  
  // Load campaign - with integrity validation
  const loadCampaignFunc = useCallback(async (campaignId: string): Promise<boolean> => {
    // Save current if dirty
    if (activeCampaign && activeCampaign.id !== campaignId && isDirty) {
      await saveNow();
    }
    
    // Clear state before loading
    if (activeCampaign && activeCampaign.id !== campaignId) {
      setActiveCampaign(null);
      UnifiedSaveArchitecture.setActiveCampaignId(null);
    }
    
    // Use integrity-validated load
    const { campaign, integrityResult } = await DataIntegrityService.loadWithValidation(campaignId);
    
    if (campaign) {
      if (integrityResult.status === 'repaired') {
        console.log(`[Campaign] Campaign auto-repaired from ${integrityResult.repairedFrom}`);
      } else if (integrityResult.status === 'corrupted' || integrityResult.status === 'unrecoverable') {
        console.warn('[Campaign] Campaign has integrity issues:', integrityResult.issues);
      }
      
      setupCampaignForLoad(campaign);
      UnifiedSaveArchitecture.setActiveCampaignId(campaignId);
      setActiveCampaign(campaign);
      lastTickRef.current = Date.now();
      playTimeRef.current = 0;
      setIsDirty(false);
      return true;
    }
    return false;
  }, [activeCampaign, isDirty, saveNow, setupCampaignForLoad]);
  
  // Unload campaign
  const unloadCampaign = useCallback(async () => {
    if (activeCampaign && isDirty) {
      await saveNow();
    }
    UnifiedSaveArchitecture.setActiveCampaignId(null);
    setActiveCampaign(null);
    setIsDirty(false);
    playTimeRef.current = 0;
  }, [activeCampaign, isDirty, saveNow]);
  
  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string) => {
    if (activeCampaign?.id === campaignId) {
      UnifiedSaveArchitecture.setActiveCampaignId(null);
      setActiveCampaign(null);
      setIsDirty(false);
    }
    
    await UnifiedSaveArchitecture.deleteCampaign(campaignId);
    await refreshCampaigns();
  }, [activeCampaign, refreshCampaigns]);
  
  // Duplicate campaign
  const duplicateCampaign = useCallback(async (campaignId: string, newName: string): Promise<CampaignData | null> => {
    const { campaign: original } = await DataIntegrityService.loadWithValidation(campaignId);
    if (!original) return null;
    
    const now = Date.now();
    const newId = `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const duplicate: CampaignData = {
      ...original,
      id: newId,
      meta: {
        ...original.meta,
        name: newName,
        createdAt: now,
        updatedAt: now,
      },
      checkpoints: [],
    };
    
    await DataIntegrityService.saveWithIntegrity(duplicate);
    await UnifiedSaveArchitecture.saveCampaign(duplicate);
    await refreshCampaigns();
    return duplicate;
  }, [refreshCampaigns]);
  
  // Update campaign
  const updateCampaign = useCallback((updates: Partial<CampaignData>) => {
    if (!activeCampaign) return;
    setActiveCampaign(prev => prev ? { ...prev, ...updates } : null);
    markDirty();
  }, [activeCampaign, markDirty]);
  
  // Update player
  const updatePlayer = useCallback((player: RPGCharacter) => {
    if (!activeCampaign) return;
    setActiveCampaign(prev => prev ? { ...prev, player } : null);
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
  
  // Sync narrative history
  const syncNarrativeHistory = useCallback((entries: StoryEntry[]) => {
    if (!activeCampaign) return;
    setActiveCampaign(prev => prev ? { ...prev, narrativeHistory: entries } : null);
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
          { ...prev.currentChapter, completedAt: now },
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
    
    const checkpoint = createCheckpointData(activeCampaign, label);
    setActiveCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checkpoints: [checkpoint, ...prev.checkpoints].slice(0, MAX_CHECKPOINTS),
      };
    });
    markDirty();
    return checkpoint;
  }, [activeCampaign, markDirty]);
  
  // Restore checkpoint
  const restoreCheckpoint = useCallback((checkpointId: string): boolean => {
    if (!activeCampaign) return false;
    
    const checkpoint = activeCampaign.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) return false;
    
    // Auto-checkpoint before restore
    const autoCheckpoint = createCheckpointData(activeCampaign, `Auto-save before restore`);
    
    setActiveCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        player: { ...checkpoint.player },
        narrativeHistory: [...checkpoint.narrativeHistory],
        escalationTier: checkpoint.escalationTier,
        currentTick: checkpoint.currentTick,
        checkpoints: [autoCheckpoint, ...prev.checkpoints].slice(0, MAX_CHECKPOINTS),
      };
    });
    markDirty();
    return true;
  }, [activeCampaign, markDirty]);
  
  // Delete checkpoint
  const deleteCheckpoint = useCallback((checkpointId: string) => {
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
  const exportCampaign = useCallback((campaignId: string): string | null => {
    if (activeCampaign?.id === campaignId) {
      return JSON.stringify(activeCampaign, null, 2);
    }
    return null;
  }, [activeCampaign]);
  
  // Import campaign
  const importCampaign = useCallback(async (jsonData: string): Promise<CampaignData | null> => {
    try {
      const parsed = JSON.parse(jsonData);
      const now = Date.now();
      
      const campaign: CampaignData = {
        ...parsed,
        id: `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`,
        meta: {
          ...parsed.meta,
          createdAt: now,
          updatedAt: now,
        },
      };
      
      await DataIntegrityService.saveWithIntegrity(campaign);
      await UnifiedSaveArchitecture.saveCampaign(campaign);
      await refreshCampaigns();
      return campaign;
    } catch (e) {
      console.error('[Campaign] Import failed:', e);
      return null;
    }
  }, [refreshCampaigns]);
  
  // Verify access
  const verifyAccess = useCallback((campaignId: string) => {
    if (isolationGuardRef.current) {
      isolationGuardRef.current.verify(campaignId);
    }
  }, []);
  
  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    await UnifiedSaveArchitecture.signInWithGoogle();
  }, []);
  
  // Sign out
  const signOut = useCallback(async () => {
    await UnifiedSaveArchitecture.signOut();
  }, []);
  
  // Resolve conflict
  const resolveConflict = useCallback(async (campaignId: string, resolution: 'local' | 'cloud'): Promise<boolean> => {
    return UnifiedSaveArchitecture.resolveConflict(campaignId, resolution);
  }, []);
  
  // Get sync state for campaign
  const getSyncState = useCallback((campaignId: string): SyncState => {
    return syncStates.get(campaignId) || 'synced';
  }, [syncStates]);
  
  const value: ExtendedCampaignContextType = {
    campaigns,
    activeCampaign,
    activeCampaignId: activeCampaign?.id ?? null,
    createCampaign,
    loadCampaign: loadCampaignFunc,
    unloadCampaign,
    deleteCampaign,
    duplicateCampaign,
    updateCampaign,
    updatePlayer,
    addNarrativeEntry,
    syncNarrativeHistory,
    advanceChapter,
    createCheckpoint: createCheckpointFunc,
    restoreCheckpoint,
    deleteCheckpoint,
    exportCampaign,
    importCampaign: async (json) => {
      await importCampaign(json);
      return null;
    },
    isDirty,
    lastSaved,
    saveNow: async () => { await saveNow(); },
    verifyAccess,
    // Cloud/Account
    account,
    syncStatus,
    isCloudEnabled: account.mode === 'cloud',
    signInWithGoogle,
    signOut,
    refreshCampaigns,
    // Conflict management
    conflicts,
    resolveConflict,
    getSyncState,
  };
  
  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};
