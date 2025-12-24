import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DiceMode, loadDiceMode, saveDiceMode } from '@/game/diceSystem';
import { ColorPreset, COLOR_PRESETS, applyColorTheme, loadColorPreference } from '@/lib/colorTheme';
import { 
  CampaignMemoryStore, 
  Campaign,
  MemoryRetrievalContext 
} from '@/types/campaignMemory';
import {
  createCampaign,
  initializeCampaignMemoryStore,
  serializeCampaignMemory,
  deserializeCampaignMemory,
  retrieveMemoryContext,
  decayMemories,
  progressLoops,
  startSession,
  endSession,
} from '@/game/campaignMemorySystem';

// ============================================================================
// GAME SETTINGS
// ============================================================================

export interface GameSettings {
  diceMode: DiceMode;
  adultContent: boolean;
  sceneIllustrations: boolean;
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  soundEnabled: boolean;
  colorTheme: string;
  autoSave: boolean;
  showRollDetails: boolean;
}

const defaultSettings: GameSettings = {
  diceMode: 'story',
  adultContent: false,
  sceneIllustrations: true,
  textSpeed: 'normal',
  soundEnabled: true,
  colorTheme: 'violet',
  autoSave: true,
  showRollDetails: true
};

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface GameContextType {
  // Settings
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  
  // Dice Mode shortcuts
  diceMode: DiceMode;
  setDiceMode: (mode: DiceMode) => void;
  
  // Color Theme
  colorTheme: ColorPreset;
  setColorTheme: (themeId: string) => void;
  
  // Adult content
  adultContent: boolean;
  setAdultContent: (enabled: boolean) => void;
  
  // Campaign Memory System
  campaignMemory: CampaignMemoryStore | null;
  initializeCampaign: (name: string, characterName: string, toneProfile?: string[]) => void;
  loadCampaign: (campaignId: string) => boolean;
  restoreCampaignFromSave: (serializedMemory: string) => boolean;
  saveCampaignMemory: () => void;
  getCampaignContext: (location: string, entities: string[], tick: number) => MemoryRetrievalContext | null;
  advanceCampaignTime: (ticks: number) => void;
  endCurrentSession: (tick: number) => void;
  getCampaign: () => Campaign | null;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const GameContext = createContext<GameContextType | null>(null);

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Optional hook that doesn't throw
export const useGameOptional = (): GameContextType | null => {
  return useContext(GameContext);
};

// ============================================================================
// STORAGE
// ============================================================================

const SETTINGS_STORAGE_KEY = 'untold-game-settings';
const CAMPAIGN_MEMORY_KEY = 'untold-campaign-memory';

const loadSettings = (): GameSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load game settings:', e);
  }
  return defaultSettings;
};

const saveSettings = (settings: GameSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save game settings:', e);
  }
};

const loadCampaignMemoryFromStorage = (): CampaignMemoryStore | null => {
  try {
    const saved = localStorage.getItem(CAMPAIGN_MEMORY_KEY);
    if (saved) {
      return deserializeCampaignMemory(saved);
    }
  } catch (e) {
    console.error('Failed to load campaign memory:', e);
  }
  return null;
};

const saveCampaignMemoryToStorage = (store: CampaignMemoryStore): void => {
  try {
    localStorage.setItem(CAMPAIGN_MEMORY_KEY, serializeCampaignMemory(store));
  } catch (e) {
    console.error('Failed to save campaign memory:', e);
  }
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(() => {
    const loaded = loadSettings();
    // Override dice mode from its own storage if present
    const savedDiceMode = loadDiceMode();
    // Override color theme from its own storage
    const savedColorId = loadColorPreference();
    return {
      ...loaded,
      diceMode: savedDiceMode,
      colorTheme: savedColorId
    };
  });
  
  const [colorTheme, setColorThemeState] = useState<ColorPreset>(() => {
    return COLOR_PRESETS.find(c => c.id === settings.colorTheme) || COLOR_PRESETS[0];
  });
  
  // Campaign Memory State
  const [campaignMemory, setCampaignMemory] = useState<CampaignMemoryStore | null>(() => {
    return loadCampaignMemoryFromStorage();
  });
  
  // Apply color theme on mount
  useEffect(() => {
    applyColorTheme(colorTheme);
  }, []);
  
  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  
  // Auto-save campaign memory when it changes
  useEffect(() => {
    if (campaignMemory) {
      saveCampaignMemoryToStorage(campaignMemory);
    }
  }, [campaignMemory]);
  
  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);
  
  const setDiceMode = useCallback((mode: DiceMode) => {
    setSettings(prev => ({ ...prev, diceMode: mode }));
    saveDiceMode(mode);
  }, []);
  
  const setColorTheme = useCallback((themeId: string) => {
    const theme = COLOR_PRESETS.find(c => c.id === themeId);
    if (theme) {
      setColorThemeState(theme);
      setSettings(prev => ({ ...prev, colorTheme: themeId }));
      applyColorTheme(theme);
    }
  }, []);
  
  const setAdultContent = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, adultContent: enabled }));
  }, []);
  
  // Campaign Memory Functions
  const initializeCampaignFunc = useCallback((name: string, characterName: string, toneProfile: string[] = []) => {
    const campaign = createCampaign(name, characterName, toneProfile);
    const store = initializeCampaignMemoryStore(campaign);
    const activeStore = startSession(store);
    setCampaignMemory(activeStore);
    console.log(`[Campaign Memory] Initialized: ${name} for ${characterName}`);
  }, []);
  
  const loadCampaignFunc = useCallback((campaignId: string): boolean => {
    const saved = loadCampaignMemoryFromStorage();
    if (saved && saved.campaign.id === campaignId) {
      const activeStore = startSession(saved);
      setCampaignMemory(activeStore);
      console.log(`[Campaign Memory] Loaded: ${saved.campaign.name}`);
      return true;
    }
    return false;
  }, []);
  
  // Restore campaign memory from serialized save data
  const restoreCampaignFromSaveFunc = useCallback((serializedMemory: string): boolean => {
    try {
      const restored = deserializeCampaignMemory(serializedMemory);
      if (restored) {
        const activeStore = startSession(restored);
        setCampaignMemory(activeStore);
        console.log(`[Campaign Memory] Restored from save: ${restored.campaign.name}`);
        return true;
      }
    } catch (e) {
      console.error('[Campaign Memory] Failed to restore from save:', e);
    }
    return false;
  }, []);
  
  const saveCampaignMemoryFunc = useCallback(() => {
    if (campaignMemory) {
      saveCampaignMemoryToStorage(campaignMemory);
      console.log(`[Campaign Memory] Saved: ${campaignMemory.campaign.name}`);
    }
  }, [campaignMemory]);
  
  const getCampaignContextFunc = useCallback((location: string, entities: string[], tick: number): MemoryRetrievalContext | null => {
    if (!campaignMemory) return null;
    return retrieveMemoryContext(campaignMemory, location, entities, tick);
  }, [campaignMemory]);
  
  const advanceCampaignTimeFunc = useCallback((ticks: number) => {
    if (!campaignMemory) return;
    
    let updated = decayMemories(campaignMemory, ticks);
    updated = progressLoops(updated, ticks);
    updated = {
      ...updated,
      campaign: {
        ...updated.campaign,
        currentTick: updated.campaign.currentTick + ticks,
      },
    };
    
    setCampaignMemory(updated);
  }, [campaignMemory]);
  
  const endCurrentSessionFunc = useCallback((tick: number) => {
    if (!campaignMemory) return;
    const ended = endSession(campaignMemory, tick);
    setCampaignMemory(ended);
    console.log(`[Campaign Memory] Session ${campaignMemory.campaign.currentSession} ended`);
  }, [campaignMemory]);
  
  const getCampaignFunc = useCallback((): Campaign | null => {
    return campaignMemory?.campaign ?? null;
  }, [campaignMemory]);
  
  const value: GameContextType = {
    settings,
    updateSettings,
    diceMode: settings.diceMode,
    setDiceMode,
    colorTheme,
    setColorTheme,
    adultContent: settings.adultContent,
    setAdultContent,
    // Campaign Memory
    campaignMemory,
    initializeCampaign: initializeCampaignFunc,
    loadCampaign: loadCampaignFunc,
    restoreCampaignFromSave: restoreCampaignFromSaveFunc,
    saveCampaignMemory: saveCampaignMemoryFunc,
    getCampaignContext: getCampaignContextFunc,
    advanceCampaignTime: advanceCampaignTimeFunc,
    endCurrentSession: endCurrentSessionFunc,
    getCampaign: getCampaignFunc,
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
