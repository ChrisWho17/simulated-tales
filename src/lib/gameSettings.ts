// Game Settings System - Including 18+ content toggle and feature toggles

// Narrator style types
export type NarratorVoice = 'OBJECTIVE' | 'LITERARY' | 'SARDONIC' | 'UNRELIABLE' | 'OMNISCIENT' | 'NOIR';
export type NarratorDetailLevel = 'SPARSE' | 'MODERATE' | 'RICH' | 'DENSE';

export interface NarratorConfig {
  voice: NarratorVoice;
  detailLevel: NarratorDetailLevel;
  emotionalLeakage: boolean;
}

// Language settings
export interface LanguageSettings {
  translateEnabled: boolean;        // Show translations for foreign languages
  playerKnownLanguages: string[];   // Languages the player character knows
}

// In-Depth Mode Toggles - Customizable gameplay intensity
export interface InDepthSettings {
  // Tone settings
  worldTone: 'cozy' | 'balanced' | 'brutal';           // Overall danger level
  
  // Realism toggles
  enableHunger: boolean;              // Track hunger/thirst
  enableFatigue: boolean;             // Track energy/sleep
  enableInjuryDetail: boolean;        // Detailed wound tracking
  enableEquipmentWear: boolean;       // Items degrade over time
  
  // Content density
  socialWeight: 'light' | 'balanced' | 'heavy';        // Social vs action focus
  combatWeight: 'light' | 'balanced' | 'heavy';        // Combat frequency
  mysteryDensity: 'low' | 'medium' | 'high';           // Secrets and puzzles
  
  // Pacing
  microEventFrequency: 'rare' | 'occasional' | 'frequent'; // World interruptions
  consequenceIntensity: 'forgiving' | 'balanced' | 'harsh';  // How hard failures hit
}

export interface GameSettings {
  // Core toggles
  adultContent: boolean;        // 18+ content toggle
  autoSave: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  showTutorials: boolean;
  colorTheme: string;
  fontSize: 'small' | 'medium' | 'large';
  showRollDetails: boolean;
  sceneIllustrations: boolean;
  
  // Narrator customization
  narratorConfig: NarratorConfig;
  
  // Language settings
  languageSettings: LanguageSettings;
  
  // In-Depth Mode Toggles
  inDepthSettings: InDepthSettings;
  
  // Feature toggles
  enableMoodSystem: boolean;           // Mood tracking and display
  manualMoodControl: boolean;          // Allow player to manually set mood
  enableMoodDialogue: boolean;         // AI dialogue varies by mood
  enableModifiers: boolean;            // Active conditions/buffs/debuffs
  enableWoundSystem: boolean;          // Wound tracking
  enableKnowledgeSystem: boolean;      // Progressive NPC knowledge reveal
  enableWeatherEffects: boolean;       // Weather influences gameplay
  enableNPCSchedules: boolean;         // NPCs follow daily routines
  enableReputationSystem: boolean;     // Faction/NPC reputation tracking
  enableXPSystem: boolean;             // Experience and leveling
  enableInventoryWeight: boolean;      // Inventory capacity limits
  
  // Adrenaline system
  enableAdrenalineSystem?: boolean;    // Hidden wounds under stress
  
  // Developer/Debug toggles
  showEventBusDebug?: boolean;         // Event bus debug panel
  
  // UI toggles
  showConsequenceFeed?: boolean;       // Real-time consequence feedback
}

const SETTINGS_KEY = 'living-world-settings';

export const DEFAULT_NARRATOR_CONFIG: NarratorConfig = {
  voice: 'LITERARY',
  detailLevel: 'MODERATE',
  emotionalLeakage: true,
};

export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  translateEnabled: false,
  playerKnownLanguages: ['en', 'common'],
};

export const DEFAULT_INDEPTH_SETTINGS: InDepthSettings = {
  worldTone: 'balanced',
  enableHunger: false,
  enableFatigue: false,
  enableInjuryDetail: true,
  enableEquipmentWear: false,
  socialWeight: 'balanced',
  combatWeight: 'balanced',
  mysteryDensity: 'medium',
  microEventFrequency: 'occasional',
  consequenceIntensity: 'balanced',
};

// Default settings
export const DEFAULT_SETTINGS: GameSettings = {
  adultContent: false,
  autoSave: true,
  soundEnabled: true,
  musicVolume: 50,
  textSpeed: 'normal',
  showTutorials: true,
  colorTheme: 'violet',
  fontSize: 'medium',
  showRollDetails: true,
  sceneIllustrations: true,
  
  // Narrator customization
  narratorConfig: DEFAULT_NARRATOR_CONFIG,
  
  // Language settings
  languageSettings: DEFAULT_LANGUAGE_SETTINGS,
  
  // In-Depth settings
  inDepthSettings: DEFAULT_INDEPTH_SETTINGS,
  
  // Feature toggles - all enabled by default
  enableMoodSystem: true,
  manualMoodControl: false,
  enableMoodDialogue: true,
  enableModifiers: true,
  enableWoundSystem: true,
  enableKnowledgeSystem: true,
  enableWeatherEffects: true,
  enableNPCSchedules: true,
  enableReputationSystem: true,
  enableXPSystem: true,
  enableInventoryWeight: true,
  
  // Adrenaline system
  enableAdrenalineSystem: true,
  
  // Developer/Debug toggles
  showEventBusDebug: false,
  
  // UI toggles
  showConsequenceFeed: true,
};

// Get current settings (alias for loadSettings)
export function getGameSettings(): GameSettings {
  return loadSettings();
}

// Load settings from storage
export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

// Save settings to storage
export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Update a single setting
export function updateSetting<K extends keyof GameSettings>(
  key: K,
  value: GameSettings[K]
): GameSettings {
  const current = loadSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  return updated;
}

// Check if adult content is enabled
export function isAdultContentEnabled(): boolean {
  const settings = loadSettings();
  return settings.adultContent === true;
}

// Toggle adult content
export function toggleAdultContent(enabled: boolean): GameSettings {
  return updateSetting('adultContent', enabled);
}

// What 18+ toggle controls:
// When DISABLED:
// - No chest/hip size in appearance descriptions
// - No "tension" need bar in player sidebar
// - No attraction/intimacy/romance bars in relationship section
// - No orientation/preferences in NPC knowledge
// - No desire system for NPCs
// - Portrait prompts exclude body details
//
// When ENABLED:
// - Body details shown in appearance
// - Tension need visible in player stats
// - Full romance bars displayed
// - Orientation revealed through relationship
// - Preferences revealed at high intimacy
// - Portrait prompts can include tasteful body details

// Content filter types
export type ContentFilterLevel = 'safe' | 'suggestive' | 'mature';

// Get content filter level based on settings
export function getContentFilterLevel(): ContentFilterLevel {
  const settings = loadSettings();
  return settings.adultContent ? 'mature' : 'safe';
}

// Filter text content based on settings
export function filterContent(text: string, settings: GameSettings): string {
  if (settings.adultContent) {
    return text; // No filtering needed
  }
  
  // Basic filtering for safe mode
  // This is a simple implementation - could be expanded
  const adultTerms = [
    'breast', 'chest size', 'hip size', 'sensual', 'seductive',
    'aroused', 'desire', 'lustful', 'intimate touch',
  ];
  
  let filtered = text;
  adultTerms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    filtered = filtered.replace(regex, '[...]');
  });
  
  return filtered;
}

// Check if specific content type should be shown
export function shouldShowContent(contentType: 'tension' | 'attraction' | 'intimacy' | 'bodyDetails' | 'orientation'): boolean {
  return isAdultContentEnabled();
}

// Feature check helpers
export function isFeatureEnabled(feature: keyof GameSettings): boolean {
  const settings = loadSettings();
  return settings[feature] === true;
}
