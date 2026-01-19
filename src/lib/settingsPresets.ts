// Settings Presets System
// Provides one-click configurations for different playstyles

import { GameSettings } from '@/lib/gameSettings';
import { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';
import { DiceMode } from '@/game/diceSystem';

export type PresetId = 'casual' | 'story' | 'simulation' | 'hardcore';

// Extended settings that include dice mode (managed separately in GameContext)
export interface PresetSettings extends Partial<GameSettings> {
  diceMode?: DiceMode;
}

export interface SettingsPreset {
  id: PresetId;
  name: string;
  description: string;
  icon: string;
  settings: PresetSettings;
}

// Casual Mode: Minimal mechanics, focus on fun
const casualPreset: PresetSettings = {
  diceMode: 'story',
  showRollDetails: false,
  typewriterEnabled: true,
  enableMoodSystem: false,
  enableModifiers: false,
  enableWoundSystem: false,
  enableWeatherEffects: false,
  showWeatherParticles: false,
  enableReputationSystem: false,
  enableInventoryWeight: false,
  enableAdrenalineSystem: false,
  showConsequenceFeed: false,
  enableSystemHighlight: false,
  inDepthSettings: {
    worldTone: 'cozy',
    enableHunger: false,
    enableFatigue: false,
    enableInjuryDetail: false,
    enableEquipmentWear: false,
    gunNutDepth: 'standard',
    cheatModeEnabled: false,
    socialWeight: 'light',
    combatWeight: 'light',
    mysteryDensity: 'low',
    microEventFrequency: 'rare',
    consequenceIntensity: 'forgiving',
  },
  directorSettings: {
    ...DEFAULT_DIRECTOR_SETTINGS,
    enabled: true,
    mode: 'easy',
    cruelty: 'soft',
    guidance: 'coach',
  },
};

// Story Mode: Balanced experience with narrative focus
const storyPreset: PresetSettings = {
  diceMode: 'story',
  showRollDetails: true,
  typewriterEnabled: true,
  enableMoodSystem: true,
  enableModifiers: true,
  enableWoundSystem: true,
  enableWeatherEffects: true,
  showWeatherParticles: true,
  enableReputationSystem: true,
  enableInventoryWeight: false,
  enableAdrenalineSystem: false,
  showConsequenceFeed: true,
  enableSystemHighlight: false,
  inDepthSettings: {
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
  },
  directorSettings: {
    ...DEFAULT_DIRECTOR_SETTINGS,
    enabled: true,
    mode: 'fun',
    cruelty: 'honest',
    guidance: 'light',
  },
};

// Simulation Mode: Detailed mechanics and realism
const simulationPreset: PresetSettings = {
  diceMode: 'partial',
  showRollDetails: true,
  typewriterEnabled: true,
  enableMoodSystem: true,
  enableModifiers: true,
  enableWoundSystem: true,
  enableWeatherEffects: true,
  showWeatherParticles: true,
  enableReputationSystem: true,
  enableInventoryWeight: true,
  enableAdrenalineSystem: true,
  showConsequenceFeed: true,
  enableSystemHighlight: true,
  inDepthSettings: {
    worldTone: 'balanced',
    enableHunger: true,
    enableFatigue: true,
    enableInjuryDetail: true,
    enableEquipmentWear: true,
    gunNutDepth: 'gunnut',
    cheatModeEnabled: false,
    socialWeight: 'heavy',
    combatWeight: 'balanced',
    mysteryDensity: 'high',
    microEventFrequency: 'frequent',
    consequenceIntensity: 'balanced',
  },
  directorSettings: {
    ...DEFAULT_DIRECTOR_SETTINGS,
    enabled: true,
    mode: 'medium',
    cruelty: 'honest',
    guidance: 'none',
  },
};

// Hardcore Mode: Maximum challenge and consequences
const hardcorePreset: PresetSettings = {
  diceMode: 'full',
  showRollDetails: true,
  typewriterEnabled: false,
  enableMoodSystem: true,
  enableModifiers: true,
  enableWoundSystem: true,
  enableWeatherEffects: true,
  showWeatherParticles: true,
  enableReputationSystem: true,
  enableInventoryWeight: true,
  enableAdrenalineSystem: true,
  showConsequenceFeed: true,
  enableSystemHighlight: true,
  inDepthSettings: {
    worldTone: 'brutal',
    enableHunger: true,
    enableFatigue: true,
    enableInjuryDetail: true,
    enableEquipmentWear: true,
    gunNutDepth: 'gunnut_plus',
    cheatModeEnabled: false,
    socialWeight: 'heavy',
    combatWeight: 'heavy',
    mysteryDensity: 'high',
    microEventFrequency: 'frequent',
    consequenceIntensity: 'harsh',
  },
  directorSettings: {
    ...DEFAULT_DIRECTOR_SETTINGS,
    enabled: true,
    rawGame: true,
    mode: 'hard',
    cruelty: 'brutal',
    guidance: 'none',
  },
};

export const SETTINGS_PRESETS: SettingsPreset[] = [
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed gameplay with minimal tracking. Perfect for narrative exploration.',
    icon: '🎮',
    settings: casualPreset,
  },
  {
    id: 'story',
    name: 'Story',
    description: 'Balanced experience with narrative focus. Recommended for most players.',
    icon: '📖',
    settings: storyPreset,
  },
  {
    id: 'simulation',
    name: 'Simulation',
    description: 'Detailed mechanics and realism. Hunger, fatigue, equipment wear enabled.',
    icon: '🎯',
    settings: simulationPreset,
  },
  {
    id: 'hardcore',
    name: 'Hardcore',
    description: 'Maximum challenge. Brutal consequences, no hand-holding.',
    icon: '💀',
    settings: hardcorePreset,
  },
];

export function getPresetById(id: PresetId): SettingsPreset | undefined {
  return SETTINGS_PRESETS.find(p => p.id === id);
}

export interface ApplyPresetResult {
  settings: GameSettings;
  diceMode?: DiceMode;
}

export function applyPreset(currentSettings: GameSettings, presetId: PresetId): ApplyPresetResult {
  const preset = getPresetById(presetId);
  if (!preset) return { settings: currentSettings };
  
  // Extract dice mode (handled separately)
  const { diceMode, ...settingsOnly } = preset.settings;
  
  // Deep merge preset settings into current settings
  const merged: GameSettings = {
    ...currentSettings,
    ...settingsOnly,
    // Handle nested objects separately
    inDepthSettings: {
      ...currentSettings.inDepthSettings,
      ...settingsOnly.inDepthSettings,
    },
    directorSettings: {
      ...currentSettings.directorSettings,
      ...settingsOnly.directorSettings,
    },
    // Preserve user's personal preferences
    colorTheme: currentSettings.colorTheme,
    adultContent: currentSettings.adultContent,
    autoSave: currentSettings.autoSave,
    narratorConfig: currentSettings.narratorConfig,
  };
  
  return { settings: merged, diceMode };
}

export function detectCurrentPreset(settings: GameSettings, currentDiceMode?: DiceMode): PresetId | null {
  // Check if current settings closely match any preset
  for (const preset of SETTINGS_PRESETS) {
    if (settingsMatchPreset(settings, preset.settings, currentDiceMode)) {
      return preset.id;
    }
  }
  return null;
}

function settingsMatchPreset(current: GameSettings, preset: PresetSettings, currentDiceMode?: DiceMode): boolean {
  // Check dice mode if provided
  if (preset.diceMode && currentDiceMode && preset.diceMode !== currentDiceMode) {
    return false;
  }
  
  // Check key differentiating settings
  const keySettings: (keyof GameSettings)[] = [
    'enableMoodSystem',
    'enableWoundSystem',
    'enableInventoryWeight',
    'enableAdrenalineSystem',
  ];
  
  for (const key of keySettings) {
    if (preset[key] !== undefined && current[key] !== preset[key]) {
      return false;
    }
  }
  
  // Check in-depth settings
  if (preset.inDepthSettings) {
    if (current.inDepthSettings.worldTone !== preset.inDepthSettings.worldTone) {
      return false;
    }
    if (current.inDepthSettings.enableHunger !== preset.inDepthSettings.enableHunger) {
      return false;
    }
  }
  
  return true;
}
