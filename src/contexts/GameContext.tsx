import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DiceMode, loadDiceMode, saveDiceMode } from '@/game/diceSystem';
import { DirectorSettings, DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';
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
import {
  EmotionalState,
  MoodState,
  createInitialEmotionalState,
  processEventForMood,
  decayMoodTowardsNeutral,
} from '@/game/emotionalStateSystem';
import { RPGCharacter } from '@/types/rpgCharacter';
import { 
  WorldBible, 
  WorldBibleOptions,
  createWorldBible,
  serializeWorldBible,
  deserializeWorldBible,
  validateAndProcess,
  startNewChapter,
  getEnhancedPrompt,
} from '@/game/worldBible';
import {
  PressureState,
  ClockType,
  ClockAdvanceResult,
  createPressureState,
  advanceClock,
  reduceClock,
  parseNarrativeForClockTriggers,
  tickTimeBasedClocks,
  buildPressureContext,
  serializePressureState,
  deserializePressureState,
} from '@/game/pressureClockSystem';
import {
  NPCMotivation,
  getOrCreateMotivation,
  updateMotivation,
  recordPlayerInteraction,
  getActiveMotivations,
  buildNPCMotivationContext,
  calculateNPCReaction,
  clearMotivations,
} from '@/game/npcMotivationSystem';
import {
  MemoryBite,
  MemoryBiteType,
  MemoryBiteStore,
  createMemoryBite,
  getBitesForNPC,
  getUnsurfacedBites,
  getMostSignificantBite,
  markBiteSurfaced,
  getSurfaceNarrative,
  parseNarrativeForBites,
  buildMemoryBiteContext,
} from '@/game/memoryBiteSystem';

// ============================================================================
// GAME SETTINGS
// ============================================================================

export type NarratorVoice = 'OBJECTIVE' | 'LITERARY' | 'SARDONIC' | 'UNRELIABLE' | 'OMNISCIENT' | 'NOIR';
export type NarratorDetailLevel = 'SPARSE' | 'MODERATE' | 'RICH' | 'DENSE';

export interface NarratorConfig {
  voice: NarratorVoice;
  detailLevel: NarratorDetailLevel;
  emotionalLeakage: boolean;
}

export interface LanguageSettings {
  translateEnabled: boolean;
  playerKnownLanguages: string[];
}

export interface AudioSettings {
  masterVolume: number;
  ambienceVolume: number;
  effectsVolume: number;
  musicVolume: number;
  uiVolume: number;
  enableWeatherSounds: boolean;
  enableStorySounds: boolean;
  enableUISounds: boolean;
}

// Gun Nut depth levels
export type GunNutDepth = 'standard' | 'gunnut' | 'gunnut_plus';

// In-Depth Mode Toggles
export interface InDepthSettings {
  worldTone: 'cozy' | 'balanced' | 'brutal';
  enableHunger: boolean;
  enableFatigue: boolean;
  enableInjuryDetail: boolean;
  enableEquipmentWear: boolean;
  gunNutDepth: GunNutDepth;  // Weapon detail level when equipment wear enabled
  cheatModeEnabled: boolean; // Free access to attachments/items
  socialWeight: 'light' | 'balanced' | 'heavy';
  combatWeight: 'light' | 'balanced' | 'heavy';
  mysteryDensity: 'low' | 'medium' | 'high';
  microEventFrequency: 'rare' | 'occasional' | 'frequent';
  consequenceIntensity: 'forgiving' | 'balanced' | 'harsh';
}

export interface GameSettings {
  diceMode: DiceMode;
  adultContent: boolean;
  sceneIllustrations: boolean;
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  soundEnabled: boolean;
  colorTheme: string;
  autoSave: boolean;
  showRollDetails: boolean;
  
  // Narrator customization
  narratorConfig: NarratorConfig;
  
  // Language settings
  languageSettings: LanguageSettings;
  
  // Audio settings
  audioSettings: AudioSettings;
  
  // In-Depth Mode Toggles
  inDepthSettings: InDepthSettings;
  
  // Feature toggles
  enableMoodSystem: boolean;
  manualMoodControl: boolean;
  enableMoodDialogue: boolean;
  enableModifiers: boolean;
  enableWoundSystem: boolean;
  enableKnowledgeSystem: boolean;
  enableWeatherEffects: boolean;
  weatherMode: 'auto' | 'manual';
  manualWeatherType?: string;
  manualWeatherIntensity?: 1 | 2 | 3;
  climateMode: 'auto' | 'manual';
  manualClimateZone?: string;
  showWeatherParticles: boolean;
  enableNPCSchedules: boolean;
  enableReputationSystem: boolean;
  enableXPSystem: boolean;
  enableInventoryWeight: boolean;
  enableInventoryDragDrop: boolean;
  enableAdrenalineSystem: boolean;
  
  // NPC Speech settings
  enableNPCAccents: boolean;
  
  // Developer/Debug toggles
  showEventBusDebug: boolean;
  
  // UI toggles
  showConsequenceFeed: boolean;
  
  // Display settings
  typewriterEnabled: boolean;
  
  // Director settings
  directorSettings: DirectorSettings;
}

const defaultNarratorConfig: NarratorConfig = {
  voice: 'LITERARY',
  detailLevel: 'MODERATE',
  emotionalLeakage: true,
};

const defaultLanguageSettings: LanguageSettings = {
  translateEnabled: false,
  playerKnownLanguages: ['en', 'common'],
};

const defaultAudioSettings: AudioSettings = {
  masterVolume: 80,
  ambienceVolume: 60,
  effectsVolume: 90,
  musicVolume: 40,
  uiVolume: 50,
  enableWeatherSounds: true,
  enableStorySounds: true,
  enableUISounds: true,
};

const defaultInDepthSettings: InDepthSettings = {
  worldTone: 'balanced',
  enableHunger: false,
  enableFatigue: false,
  enableInjuryDetail: true,
  enableEquipmentWear: false,
  gunNutDepth: 'standard',
  cheatModeEnabled: false,
  socialWeight: 'balanced',
  combatWeight: 'balanced',
  mysteryDensity: 'medium',
  microEventFrequency: 'occasional',
  consequenceIntensity: 'balanced',
};

const defaultSettings: GameSettings = {
  diceMode: 'story',
  adultContent: false,
  sceneIllustrations: true,
  textSpeed: 'normal',
  soundEnabled: true,
  colorTheme: 'violet',
  autoSave: true,
  showRollDetails: true,
  
  // Narrator customization
  narratorConfig: defaultNarratorConfig,
  
  // Language settings
  languageSettings: defaultLanguageSettings,
  
  // Audio settings
  audioSettings: defaultAudioSettings,
  
  // In-Depth Mode
  inDepthSettings: defaultInDepthSettings,
  
  // Feature toggles - all enabled by default
  enableMoodSystem: true,
  manualMoodControl: false,
  enableMoodDialogue: true,
  enableModifiers: true,
  enableWoundSystem: true,
  enableKnowledgeSystem: true,
  enableWeatherEffects: true,
  weatherMode: 'auto',
  manualWeatherType: undefined,
  manualWeatherIntensity: 2,
  climateMode: 'auto',
  manualClimateZone: undefined,
  showWeatherParticles: true,
  enableNPCSchedules: true,
  enableReputationSystem: true,
  enableXPSystem: true,
  enableInventoryWeight: true,
  enableInventoryDragDrop: true,
  enableAdrenalineSystem: false,
  
  // NPC Speech settings
  enableNPCAccents: true,
  
  // Developer/Debug toggles
  showEventBusDebug: false,
  
  // UI toggles
  showConsequenceFeed: true,
  
  // Display settings
  typewriterEnabled: true,
  
  // Director settings
  directorSettings: DEFAULT_DIRECTOR_SETTINGS,
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
  
  // Emotional State System
  emotionalState: EmotionalState;
  processGameEvent: (eventType: string, character: RPGCharacter) => void;
  setMood: (mood: MoodState, intensity?: number) => void;
  decayMood: () => void;
  
  // World Bible (Genre Contract System)
  worldBible: WorldBible | null;
  initializeWorldBible: (options: WorldBibleOptions) => WorldBible;
  validateContent: (content: string) => { success: boolean; content: string; log: string[] };
  getEnhancedPromptWithContract: (basePrompt: string) => string;
  advanceChapter: () => void;
  restoreWorldBible: (serialized: string) => boolean;
  getSerializedWorldBible: () => string | null;
  
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
  updateCampaignMemory: (updatedStore: CampaignMemoryStore) => void;
  
  // Pressure Clock System
  pressureState: PressureState;
  advancePressureClock: (clockType: ClockType, amount?: number, reason?: string) => ClockAdvanceResult | null;
  reducePressureClock: (clockType: ClockType, amount?: number, reason?: string) => void;
  processNarrativeForPressure: (narrative: string) => ClockAdvanceResult[];
  tickPressureClocks: (hoursPassed: number) => ClockAdvanceResult[];
  getPressureContext: () => string;
  
  // NPC Motivation System
  getNPCMotivation: (npcId: string, npcName: string, role?: string) => NPCMotivation;
  updateNPCMotivation: (npcId: string, updates: Partial<NPCMotivation>) => void;
  recordNPCInteraction: (npcId: string, action: string, type: 'positive' | 'negative' | 'neutral', impact: number) => void;
  getAllNPCMotivations: () => NPCMotivation[];
  getNPCMotivationContext: () => string;
  
  // Memory Bite System
  createBite: (type: MemoryBiteType, npcId: string, npcName: string, context: string, options?: { gameTick?: number; location?: string; emotionalWeight?: number }) => MemoryBite;
  getBitesForNPC: (npcId: string) => MemoryBite[];
  getUnsurfacedBitesForNPC: (npcId?: string) => MemoryBite[];
  surfaceBite: (biteId: string) => void;
  getSurfaceNarrativeForBite: (bite: MemoryBite) => string;
  processNarrativeForBites: (narrative: string, npcId: string, npcName: string, gameTick: number) => MemoryBite[];
  getBiteContext: (npcId: string) => string;
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
const EMOTIONAL_STATE_KEY = 'untold-emotional-state';
const WORLD_BIBLE_KEY = 'untold-world-bible';
const PRESSURE_STATE_KEY = 'untold-pressure-state';

const loadWorldBibleFromStorage = (): WorldBible | null => {
  try {
    const saved = localStorage.getItem(WORLD_BIBLE_KEY);
    if (saved) {
      return deserializeWorldBible(saved);
    }
  } catch (e) {
    console.error('Failed to load world bible:', e);
  }
  return null;
};

const saveWorldBibleToStorage = (bible: WorldBible): void => {
  try {
    localStorage.setItem(WORLD_BIBLE_KEY, serializeWorldBible(bible));
  } catch (e) {
    console.error('Failed to save world bible:', e);
  }
};

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

const loadEmotionalState = (): EmotionalState | null => {
  try {
    const saved = localStorage.getItem(EMOTIONAL_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load emotional state:', e);
  }
  return null;
};

const saveEmotionalState = (state: EmotionalState): void => {
  try {
    localStorage.setItem(EMOTIONAL_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save emotional state:', e);
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

const loadPressureStateFromStorage = (): PressureState => {
  try {
    const saved = localStorage.getItem(PRESSURE_STATE_KEY);
    if (saved) {
      return deserializePressureState(saved);
    }
  } catch (e) {
    console.error('Failed to load pressure state:', e);
  }
  return createPressureState();
};

const savePressureStateToStorage = (state: PressureState): void => {
  try {
    localStorage.setItem(PRESSURE_STATE_KEY, serializePressureState(state));
  } catch (e) {
    console.error('Failed to save pressure state:', e);
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
  
  // Emotional State - load from storage or create new
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(() => {
    const saved = loadEmotionalState();
    return saved || createInitialEmotionalState();
  });
  
  // World Bible State (Genre Contract System)
  const [worldBible, setWorldBible] = useState<WorldBible | null>(() => {
    return loadWorldBibleFromStorage();
  });
  
  // Pressure Clock State
  const [pressureState, setPressureState] = useState<PressureState>(() => {
    return loadPressureStateFromStorage();
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
  
  // Auto-save emotional state when it changes
  useEffect(() => {
    saveEmotionalState(emotionalState);
  }, [emotionalState]);
  
  // Auto-save world bible when it changes
  useEffect(() => {
    if (worldBible) {
      saveWorldBibleToStorage(worldBible);
    }
  }, [worldBible]);
  
  // Auto-save pressure state when it changes
  useEffect(() => {
    savePressureStateToStorage(pressureState);
  }, [pressureState]);
  
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
  
  // Emotional State Functions
  const processGameEvent = useCallback((eventType: string, character: RPGCharacter) => {
    setEmotionalState(prev => processEventForMood(prev, eventType, character));
  }, []);
  
  const setMood = useCallback((mood: MoodState, intensity: number = 0.6) => {
    setEmotionalState(prev => ({
      ...prev,
      currentMood: mood,
      moodIntensity: Math.min(1, Math.max(0, intensity)),
      moodHistory: [...prev.moodHistory.slice(-9), {
        from: prev.currentMood,
        to: mood,
        trigger: 'manual_set',
        intensity
      }]
    }));
  }, []);
  
  const decayMood = useCallback(() => {
    setEmotionalState(prev => decayMoodTowardsNeutral(prev));
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
  
  const updateCampaignMemoryFunc = useCallback((updatedStore: CampaignMemoryStore) => {
    setCampaignMemory(updatedStore);
  }, []);
  
  // World Bible Functions (Genre Contract System)
  const initializeWorldBibleFunc = useCallback((options: WorldBibleOptions): WorldBible => {
    const bible = createWorldBible(options);
    setWorldBible(bible);
    console.log(`[World Bible] Initialized: ${bible.campaignName} (${bible.primaryGenre})`);
    return bible;
  }, []);
  
  const validateContentFunc = useCallback((content: string): { success: boolean; content: string; log: string[] } => {
    if (!worldBible) {
      return { success: true, content, log: ['No world bible active - content passed without validation'] };
    }
    const result = validateAndProcess(content, worldBible);
    if (result.log.length > 0) {
      console.log(`[World Bible] Validation:`, result.log.join('\n'));
    }
    return result;
  }, [worldBible]);
  
  const getEnhancedPromptWithContractFunc = useCallback((basePrompt: string): string => {
    if (!worldBible) return basePrompt;
    return getEnhancedPrompt(worldBible, basePrompt);
  }, [worldBible]);
  
  const advanceChapterFunc = useCallback(() => {
    if (!worldBible) return;
    startNewChapter(worldBible);
    setWorldBible({ ...worldBible });
    console.log(`[World Bible] Advanced to chapter ${worldBible.currentChapter}`);
  }, [worldBible]);
  
  const restoreWorldBibleFunc = useCallback((serialized: string): boolean => {
    const restored = deserializeWorldBible(serialized);
    if (restored) {
      setWorldBible(restored);
      console.log(`[World Bible] Restored: ${restored.campaignName}`);
      return true;
    }
    return false;
  }, []);
  
  const getSerializedWorldBibleFunc = useCallback((): string | null => {
    if (!worldBible) return null;
    return serializeWorldBible(worldBible);
  }, [worldBible]);
  
  // ============================================================================
  // PRESSURE CLOCK SYSTEM FUNCTIONS
  // ============================================================================
  
  const advancePressureClockFunc = useCallback((
    clockType: ClockType,
    amount: number = 1,
    reason?: string
  ): ClockAdvanceResult | null => {
    const result = advanceClock(pressureState, clockType, amount, reason);
    setPressureState(result.state);
    return result.result;
  }, [pressureState]);
  
  const reducePressureClockFunc = useCallback((
    clockType: ClockType,
    amount: number = 1,
    reason?: string
  ): void => {
    const newState = reduceClock(pressureState, clockType, amount, reason);
    setPressureState(newState);
  }, [pressureState]);
  
  const processNarrativeForPressureFunc = useCallback((narrative: string): ClockAdvanceResult[] => {
    const result = parseNarrativeForClockTriggers(narrative, pressureState);
    setPressureState(result.state);
    return result.advances;
  }, [pressureState]);
  
  const tickPressureClocksFunc = useCallback((hoursPassed: number): ClockAdvanceResult[] => {
    const result = tickTimeBasedClocks(pressureState, hoursPassed);
    setPressureState(result.state);
    return result.advances;
  }, [pressureState]);
  
  const getPressureContextFunc = useCallback((): string => {
    return buildPressureContext(pressureState);
  }, [pressureState]);
  
  // ============================================================================
  // NPC MOTIVATION SYSTEM FUNCTIONS
  // ============================================================================
  
  const getNPCMotivationFunc = useCallback((
    npcId: string,
    npcName: string,
    role?: string
  ): NPCMotivation => {
    return getOrCreateMotivation(npcId, npcName, role);
  }, []);
  
  const updateNPCMotivationFunc = useCallback((
    npcId: string,
    updates: Partial<NPCMotivation>
  ): void => {
    updateMotivation(npcId, updates);
  }, []);
  
  const recordNPCInteractionFunc = useCallback((
    npcId: string,
    action: string,
    type: 'positive' | 'negative' | 'neutral',
    impact: number
  ): void => {
    recordPlayerInteraction(npcId, action, type, impact);
  }, []);
  
  const getAllNPCMotivationsFunc = useCallback((): NPCMotivation[] => {
    return getActiveMotivations();
  }, []);
  
  const getNPCMotivationContextFunc = useCallback((): string => {
    return buildNPCMotivationContext(getActiveMotivations());
  }, []);
  
  // ============================================================================
  // MEMORY BITE SYSTEM FUNCTIONS
  // ============================================================================
  
  const createBiteFunc = useCallback((
    type: MemoryBiteType,
    npcId: string,
    npcName: string,
    context: string,
    options?: { gameTick?: number; location?: string; emotionalWeight?: number }
  ): MemoryBite => {
    return createMemoryBite(type, npcId, npcName, context, options);
  }, []);
  
  const getBitesForNPCFunc = useCallback((npcId: string): MemoryBite[] => {
    return getBitesForNPC(npcId);
  }, []);
  
  const getUnsurfacedBitesForNPCFunc = useCallback((npcId?: string): MemoryBite[] => {
    return getUnsurfacedBites(npcId);
  }, []);
  
  const surfaceBiteFunc = useCallback((biteId: string): void => {
    markBiteSurfaced(biteId);
  }, []);
  
  const getSurfaceNarrativeForBiteFunc = useCallback((bite: MemoryBite): string => {
    return getSurfaceNarrative(bite);
  }, []);
  
  const processNarrativeForBitesFunc = useCallback((
    narrative: string,
    npcId: string,
    npcName: string,
    gameTick: number
  ): MemoryBite[] => {
    return parseNarrativeForBites(narrative, npcId, npcName, gameTick);
  }, []);
  
  const getBiteContextFunc = useCallback((npcId: string): string => {
    return buildMemoryBiteContext(npcId);
  }, []);
  
  const value: GameContextType = {
    settings,
    updateSettings,
    diceMode: settings.diceMode,
    setDiceMode,
    colorTheme,
    setColorTheme,
    adultContent: settings.adultContent,
    setAdultContent,
    // Emotional State
    emotionalState,
    processGameEvent,
    setMood,
    decayMood,
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
    updateCampaignMemory: updateCampaignMemoryFunc,
    // World Bible (Genre Contract System)
    worldBible,
    initializeWorldBible: initializeWorldBibleFunc,
    validateContent: validateContentFunc,
    getEnhancedPromptWithContract: getEnhancedPromptWithContractFunc,
    advanceChapter: advanceChapterFunc,
    restoreWorldBible: restoreWorldBibleFunc,
    getSerializedWorldBible: getSerializedWorldBibleFunc,
    // Pressure Clock System
    pressureState,
    advancePressureClock: advancePressureClockFunc,
    reducePressureClock: reducePressureClockFunc,
    processNarrativeForPressure: processNarrativeForPressureFunc,
    tickPressureClocks: tickPressureClocksFunc,
    getPressureContext: getPressureContextFunc,
    // NPC Motivation System
    getNPCMotivation: getNPCMotivationFunc,
    updateNPCMotivation: updateNPCMotivationFunc,
    recordNPCInteraction: recordNPCInteractionFunc,
    getAllNPCMotivations: getAllNPCMotivationsFunc,
    getNPCMotivationContext: getNPCMotivationContextFunc,
    // Memory Bite System
    createBite: createBiteFunc,
    getBitesForNPC: getBitesForNPCFunc,
    getUnsurfacedBitesForNPC: getUnsurfacedBitesForNPCFunc,
    surfaceBite: surfaceBiteFunc,
    getSurfaceNarrativeForBite: getSurfaceNarrativeForBiteFunc,
    processNarrativeForBites: processNarrativeForBitesFunc,
    getBiteContext: getBiteContextFunc,
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
