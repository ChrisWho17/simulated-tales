// ============================================================================
// CAMPAIGN CONTEXT - Cloud-first with Google auth, GUEST-LOCAL fallback
// Integrated with UnifiedSaveArchitecture for transactional saves
// Enhanced with StateSyncBus for cross-context synchronization
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
import { StateSyncBus } from '@/services/stateSyncBus';
import { STORAGE_KEYS } from '@/lib/storageKeys';
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
import { companionSystem } from '@/game/companionSystem';
import { checkAndCleanupStorage } from '@/lib/storageCleanup';

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
  // Initialization state
  isInitialized: boolean;
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
  
  // Initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  
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
      
      // Load campaigns with recovery handling
      try {
        const list = await UnifiedSaveArchitecture.listCampaigns();
        setCampaigns(list);
      } catch (e) {
        console.error('[CampaignContext] Failed to list campaigns, attempting recovery:', e);
        // Auto-repair corrupted index
        try {
          localStorage.removeItem('lwe_campaign_index');
          localStorage.removeItem('guest_local_campaigns');
          console.log('[CampaignContext] Corrupted campaign index removed');
        } catch {
          // Ignore
        }
        setCampaigns([]);
      }
      
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
      
      // Mark initialization complete
      setIsInitialized(true);
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
  
  // Setup NPC registry and companion state when loading a campaign
  const setupCampaignForLoad = useCallback((campaign: CampaignData) => {
    console.log('[Campaign] Setting up campaign for load:', campaign.id);
    console.log('[Campaign] Campaign settings:', campaign.settings);
    
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
    
    // CRITICAL: Restore companion state from campaign
    if (campaign.companionState) {
      console.log('[Campaign] Restoring companion state with', 
        (campaign.companionState.companions as unknown[])?.length || 0, 'companions');
      companionSystem.deserialize(campaign.companionState as { companions: any[]; activeIds: string[] });
    }
    
    // CRITICAL: Restore companion autonomy state (grievances, goals, recent actions)
    if (campaign.companionAutonomyState) {
      try {
        const { companionAutonomyManager } = require('@/game/companion/companionAutonomyIntegration');
        companionAutonomyManager.deserialize(campaign.companionAutonomyState as any);
        console.log('[Campaign] Restored companion autonomy state (grievances, goals)');
      } catch (e) {
        console.warn('[Campaign] Failed to restore companion autonomy state:', e);
      }
    }
    
    // Restore companion localStorage data from campaign
    try {
      if (campaign.companionAppearances && Object.keys(campaign.companionAppearances).length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPANION_APPEARANCES, JSON.stringify(campaign.companionAppearances));
        console.log('[Campaign] Restored companion appearances');
      }
      
      if (campaign.companionIntroductions && Object.keys(campaign.companionIntroductions).length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPANION_INTRODUCTIONS, JSON.stringify(campaign.companionIntroductions));
        console.log('[Campaign] Restored companion introductions');
      }
      
      if (campaign.pendingCompanionIntroductions && campaign.pendingCompanionIntroductions.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PENDING_COMPANION_INTRODUCTIONS, JSON.stringify(campaign.pendingCompanionIntroductions));
        console.log('[Campaign] Restored pending companion introductions');
      }
    } catch (e) {
      console.warn('[Campaign] Failed to restore companion localStorage data:', e);
    }
    
    // CRITICAL: Sync campaign director settings to global settings storage
    // This ensures the GameContext sees the campaign's director settings on next load
    if (campaign.settings?.directorSettings) {
      console.log('[Campaign] Syncing director settings from campaign:', campaign.settings.directorSettings);
      try {
        const storedSettings = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
        let parsed: Record<string, unknown>;
        
        if (storedSettings) {
          parsed = JSON.parse(storedSettings);
        } else {
          // Create default settings if none exist
          parsed = {};
        }
        
        // Always update director settings from campaign
        parsed.directorSettings = campaign.settings.directorSettings;
        localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(parsed));
        
        // Emit via StateSyncBus for cross-context synchronization
        // Use setTimeout to ensure this happens after the current React render cycle
        setTimeout(() => {
          StateSyncBus.emit('settings:director-updated', {
            directorSettings: campaign.settings.directorSettings!,
            source: 'campaign',
          }, 'CampaignContext');
          
          StateSyncBus.emit('campaign:loaded', {
            campaignId: campaign.id,
            campaignName: campaign.meta.name,
            directorSettings: campaign.settings.directorSettings,
          }, 'CampaignContext');
          
          console.log('[Campaign] Emitted campaign:loaded and settings:director-updated via StateSyncBus');
        }, 0);
      } catch (e) {
        console.warn('[Campaign] Failed to sync director settings:', e);
      }
    } else {
      console.log('[Campaign] Campaign has no director settings, using defaults');
      
      // Still emit campaign loaded event
      setTimeout(() => {
        StateSyncBus.emit('campaign:loaded', {
          campaignId: campaign.id,
          campaignName: campaign.meta.name,
        }, 'CampaignContext');
      }, 0);
    }
  }, []);
  
  // Prepare campaign for save (capture NPC state + companion state + autonomy state)
  const prepareCampaignForSave = useCallback((campaign: CampaignData): CampaignData => {
    const npcRegistry = getNPCRegistry();
    const personalityMap = exportPersonalityMap();
    
    // Capture companion state from the singleton
    const companionState = companionSystem.serialize();
    
    // Capture companion autonomy state (grievances, goals, recent actions)
    let companionAutonomyState: Record<string, unknown> = {};
    try {
      // Import dynamically to avoid circular dependencies
      const { companionAutonomyManager } = require('@/game/companion/companionAutonomyIntegration');
      companionAutonomyState = companionAutonomyManager.serialize();
    } catch (e) {
      console.warn('[Campaign] Failed to capture companion autonomy state:', e);
    }
    
    // Capture companion appearances from localStorage (will be embedded in campaign)
    let companionAppearances: Record<string, unknown> = {};
    let companionIntroductions: Record<string, string> = {};
    let pendingCompanionIntroductions: unknown[] = [];
    
    try {
      const appearances = localStorage.getItem(STORAGE_KEYS.COMPANION_APPEARANCES);
      if (appearances) companionAppearances = JSON.parse(appearances);
      
      const introductions = localStorage.getItem(STORAGE_KEYS.COMPANION_INTRODUCTIONS);
      if (introductions) companionIntroductions = JSON.parse(introductions);
      
      const pending = localStorage.getItem(STORAGE_KEYS.PENDING_COMPANION_INTRODUCTIONS);
      if (pending) pendingCompanionIntroductions = JSON.parse(pending);
    } catch (e) {
      console.warn('[Campaign] Failed to capture companion localStorage data:', e);
    }
    
    return {
      ...campaign,
      npcRegistryState: {
        npcs: npcRegistry.npcs,
        relationships: npcRegistry.relationships,
        families: npcRegistry.families,
        lockedIds: npcRegistry.lockedIds,
      },
      npcPersonalityMap: personalityMap,
      companionState: companionState,
      companionAutonomyState: companionAutonomyState, // NEW: Persists grievances & goals
      companionAppearances,
      companionIntroductions,
      pendingCompanionIntroductions,
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
  
  // Save now - using integrity-validated save with storage cleanup
  const saveNow = useCallback(async () => {
    if (!activeCampaign) {
      console.log('[Campaign] saveNow called but no active campaign');
      return;
    }
    
    console.log('[Campaign] saveNow triggered for:', activeCampaign.id);
    console.log('[Campaign] Current settings:', activeCampaign.settings);
    
    // CRITICAL: Check and cleanup storage BEFORE saving to prevent quota errors
    checkAndCleanupStorage();
    
    const updatedCampaign = prepareCampaignForSave({
      ...activeCampaign,
      meta: {
        ...activeCampaign.meta,
        playTime: activeCampaign.meta.playTime + playTimeRef.current,
        updatedAt: Date.now(),
      },
    });
    
    console.log('[Campaign] Prepared campaign for save, director settings:', updatedCampaign.settings?.directorSettings);
    
    setSyncStatus('syncing');
    
    // Use integrity-validated save
    const result = await DataIntegrityService.saveWithIntegrity(updatedCampaign);
    console.log('[Campaign] Integrity save result:', result.success, result.error || '');
    
    if (result.success) {
      // Also sync to cloud via UnifiedSaveArchitecture
      const cloudResult = await UnifiedSaveArchitecture.saveCampaign(updatedCampaign);
      console.log('[Campaign] Cloud save result:', cloudResult.success, cloudResult.syncedToCloud, cloudResult.error || '');
      
      setActiveCampaign(updatedCampaign);
      setIsDirty(false);
      setLastSaved(Date.now());
      playTimeRef.current = 0;
      setSyncStatus(cloudResult.syncedToCloud ? 'synced' : 'idle');
      
      // Refresh list
      const list = await UnifiedSaveArchitecture.listCampaigns();
      setCampaigns(list);
      
      console.log('[Campaign] Save completed successfully at', new Date().toISOString());
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
    
    // Save immediately using integrity service - MUST await to ensure save completes
    const integrityResult = await DataIntegrityService.saveWithIntegrity(campaign);
    if (!integrityResult.success) {
      console.error('[Campaign] Integrity save failed:', integrityResult.error);
    } else {
      console.log('[Campaign] Integrity save successful, checksum:', integrityResult.checksum);
    }
    
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
    
    // IMPORTANT: Don't clear activeCampaign to null before loading!
    // This causes race conditions with UI components that depend on activeCampaign.
    // Instead, directly replace with the new campaign when it's ready.
    
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
    // Initialization state
    isInitialized,
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
    importCampaign,
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
