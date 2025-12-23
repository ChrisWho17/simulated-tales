import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DiceMode, loadDiceMode, saveDiceMode } from '@/game/diceSystem';
import { ColorPreset, COLOR_PRESETS, applyColorTheme, loadColorPreference } from '@/lib/colorTheme';

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
  
  // Apply color theme on mount
  useEffect(() => {
    applyColorTheme(colorTheme);
  }, []);
  
  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  
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
  
  const value: GameContextType = {
    settings,
    updateSettings,
    diceMode: settings.diceMode,
    setDiceMode,
    colorTheme,
    setColorTheme,
    adultContent: settings.adultContent,
    setAdultContent
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
