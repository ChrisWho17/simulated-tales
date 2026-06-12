// Game Settings System - Including 18+ content toggle and feature toggles

import { 
  DirectorSettings, 
  DEFAULT_DIRECTOR_SETTINGS 
} from '@/game/directorModeSystem';

// Re-export director types for convenience
export type { DirectorSettings } from '@/game/directorModeSystem';
export { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';

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

// Audio settings - Simplified to weather-only ambient sounds
export interface AudioSettings {
  masterVolume: number;      // 0-100
  weatherVolume: number;     // 0-100 - Low background weather ambient
  enableWeatherSounds: boolean;
}

// Gun Nut depth levels
export type GunNutDepth = 'standard' | 'gunnut' | 'gunnut_plus';

// In-Depth Mode Toggles - Customizable gameplay intensity
export interface InDepthSettings {
  // Tone settings
  worldTone: 'cozy' | 'balanced' | 'brutal';           // Overall danger level
  
  // Realism toggles
  enableHunger: boolean;              // Track hunger/thirst
  enableFatigue: boolean;             // Track energy/sleep
  enableInjuryDetail: boolean;        // Detailed wound tracking
  enableEquipmentWear: boolean;       // Items degrade over time
  gunNutDepth: GunNutDepth;           // Weapon detail level when equipment wear enabled
  
  // Cheat mode
  cheatModeEnabled: boolean;          // Free access to attachments/items without crafting
  
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
  
  // Audio settings
  audioSettings: AudioSettings;
  
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
  weatherMode: 'auto' | 'manual';      // Automatic or manual weather control
  manualWeatherType?: string;          // Selected weather when in manual mode
  manualWeatherIntensity?: 1 | 2 | 3;  // Intensity when in manual mode (1=light, 2=moderate, 3=heavy)
  climateMode: 'auto' | 'manual';      // Automatic or manual climate zone
  manualClimateZone?: string;          // Selected climate zone when in manual mode
  showWeatherParticles: boolean;       // Show weather particle effects on background
  enableNPCSchedules: boolean;         // NPCs follow daily routines
  enableReputationSystem: boolean;     // Faction/NPC reputation tracking
  enableXPSystem: boolean;             // Experience and leveling
  enableInventoryWeight: boolean;      // Inventory capacity limits
  
  // Inventory settings
  enableInventoryDragDrop?: boolean;   // Enable drag-and-drop for inventory management
  
  // NPC Speech settings
  enableNPCAccents: boolean;           // NPCs speak with regional accents/dialects
  
  // Adrenaline system
  enableAdrenalineSystem?: boolean;    // Hidden wounds under stress
  
  // Developer/Debug toggles
  showEventBusDebug?: boolean;         // Event bus debug panel
  
  // UI toggles
  showConsequenceFeed?: boolean;       // Real-time consequence feedback
  
  // Director settings
  directorSettings: DirectorSettings;
  
  // Typewriter
  typewriterEnabled?: boolean;
  
  // System highlighting in narrative
  enableSystemHighlight?: boolean;

  // Testing — force deterministic variance seed for reproducible narratives
  forceVarianceSeedEnabled?: boolean;
  forceVarianceSeed?: string;

  // PWA — hide the install banner / button on the main menu for users
  // who don't want to install the app.
  hidePwaInstall?: boolean;

  // Hide the floating version/hotfix badge entirely (main menu top-right).
  hideHotfixBadge?: boolean;

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

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 50,
  weatherVolume: 25,  // Low background noise
  enableWeatherSounds: true,
};

export const DEFAULT_INDEPTH_SETTINGS: InDepthSettings = {
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
  
  // Audio settings
  audioSettings: DEFAULT_AUDIO_SETTINGS,
  
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
  
  // Inventory settings
  enableInventoryDragDrop: true,
  
  // NPC Speech settings
  enableNPCAccents: true,
  
  // Adrenaline system
  enableAdrenalineSystem: true,
  
  // Developer/Debug toggles
  showEventBusDebug: false,
  
  // UI toggles
  showConsequenceFeed: true,
  
  // Director settings
  directorSettings: DEFAULT_DIRECTOR_SETTINGS,
  
  // Typewriter
  typewriterEnabled: true,
  
  // System highlighting
  enableSystemHighlight: false,

  // Testing
  forceVarianceSeedEnabled: false,
  forceVarianceSeed: '',

  // PWA install banner visible by default
  hidePwaInstall: false,

  // Hotfix badge visible by default
  hideHotfixBadge: false,

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
