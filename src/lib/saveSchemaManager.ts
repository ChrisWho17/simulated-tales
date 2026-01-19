// ============================================================================
// SAVE SCHEMA MANAGER - Ensures save data resilience across updates
// Provides schema versioning, field backfilling, and runtime validation
// ============================================================================

import { CampaignData, CampaignCheckpoint } from '@/types/campaign';
import { RPGCharacter } from '@/types/rpgCharacter';
import { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';
import { createInitialWeatherState } from '@/game/weatherSystem';
import { createInitialTimeState } from '@/game/timeProgressionSystem';

// ============================================================================
// SCHEMA VERSION - Increment when adding new fields
// ============================================================================

export const SAVE_SCHEMA_VERSION = 4;

// ============================================================================
// DEFAULT FACTORIES - Create default values for all optional fields
// ============================================================================

const DEFAULT_PLAYER: RPGCharacter = {
  name: 'Unknown Hero',
  classId: 'warrior',
  backgroundId: 'commoner',
  level: 1,
  experience: 0,
  currentHealth: 100,
  maxHealth: 100,
  stats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  skills: [],
  abilities: [],
  inventory: [],
  gold: 0,
  traits: [],
};

function createDefaultMeta(existing?: Partial<CampaignData['meta']>): CampaignData['meta'] {
  const now = Date.now();
  return {
    name: existing?.name || 'Untitled Campaign',
    primaryGenre: existing?.primaryGenre || 'fantasy',
    secondaryGenres: existing?.secondaryGenres || [],
    createdAt: existing?.createdAt || now,
    updatedAt: existing?.updatedAt || now,
    playTime: existing?.playTime || 0,
    chapterCount: existing?.chapterCount || 1,
  };
}

function createDefaultSettings(existing?: Partial<CampaignData['settings']>): NonNullable<CampaignData['settings']> {
  return {
    adultContent: existing?.adultContent ?? false,
    cheatMode: existing?.cheatMode ?? false,
    directorSettings: existing?.directorSettings ?? { ...DEFAULT_DIRECTOR_SETTINGS },
    timeMultiplier: existing?.timeMultiplier ?? 'fifteen_minutes',
  };
}

function createDefaultCurrentChapter(existing?: Partial<CampaignData['currentChapter']>): CampaignData['currentChapter'] {
  return {
    number: existing?.number || 1,
    title: existing?.title || 'The Beginning',
    startedAt: existing?.startedAt || Date.now(),
  };
}

// ============================================================================
// FIELD DEFINITIONS - All fields with their default value factories
// ============================================================================

interface FieldDefinition<T> {
  path: string;
  defaultFactory: () => T;
  validator?: (value: unknown) => boolean;
  migrateFrom?: (data: unknown) => T | undefined;
}

const FIELD_DEFINITIONS: FieldDefinition<unknown>[] = [
  // Core identifiers
  {
    path: 'id',
    defaultFactory: () => `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    validator: (v) => typeof v === 'string' && v.length > 0,
  },
  
  // Meta block
  {
    path: 'meta',
    defaultFactory: () => createDefaultMeta(),
    validator: (v) => typeof v === 'object' && v !== null,
  },
  
  // Player
  {
    path: 'player',
    defaultFactory: () => ({ ...DEFAULT_PLAYER }),
    validator: (v) => typeof v === 'object' && v !== null && typeof (v as RPGCharacter).name === 'string',
  },
  
  // Story
  {
    path: 'narrativeHistory',
    defaultFactory: () => [],
    validator: (v) => Array.isArray(v),
  },
  {
    path: 'chapters',
    defaultFactory: () => [],
    validator: (v) => Array.isArray(v),
  },
  {
    path: 'currentChapter',
    defaultFactory: () => createDefaultCurrentChapter(),
    validator: (v) => typeof v === 'object' && v !== null,
  },
  {
    path: 'scenario',
    defaultFactory: () => '',
    validator: (v) => typeof v === 'string',
  },
  {
    path: 'checkpoints',
    defaultFactory: () => [],
    validator: (v) => Array.isArray(v),
  },
  
  // Game state
  {
    path: 'escalationTier',
    defaultFactory: () => 1,
    validator: (v) => typeof v === 'number' && v >= 1,
  },
  {
    path: 'currentTick',
    defaultFactory: () => 0,
    validator: (v) => typeof v === 'number' && v >= 0,
  },
  
  // Mood
  {
    path: 'currentMood',
    defaultFactory: () => 'neutral',
    validator: (v) => typeof v === 'string',
  },
  {
    path: 'moodHistory',
    defaultFactory: () => [],
    validator: (v) => Array.isArray(v),
  },
  
  // Settings
  {
    path: 'settings',
    defaultFactory: () => createDefaultSettings(),
    validator: (v) => typeof v === 'object' && v !== null,
  },
  
  // Weather
  {
    path: 'weatherState',
    defaultFactory: () => createInitialWeatherState(),
    validator: (v) => v === undefined || (typeof v === 'object' && v !== null),
  },
  
  // Time
  {
    path: 'timeState',
    defaultFactory: () => createInitialTimeState(),
    validator: (v) => v === undefined || (typeof v === 'object' && v !== null),
  },
  
  // Living World
  {
    path: 'livingWorldState',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  
  // NPC Registry
  {
    path: 'npcRegistryState',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  {
    path: 'npcPersonalityMap',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  
  // Companions
  {
    path: 'companionState',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  {
    path: 'companionAppearances',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  {
    path: 'companionIntroductions',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  {
    path: 'pendingCompanionIntroductions',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  
  // Campaign Memory
  {
    path: 'campaignMemory',
    defaultFactory: () => undefined,
    validator: () => true, // Optional field
  },
  
  // World Bible (required but complex)
  {
    path: 'worldBible',
    defaultFactory: () => null, // Will trigger a warning, but won't crash
    validator: (v) => v === null || (typeof v === 'object' && v !== null),
  },
];

// ============================================================================
// NESTED FIELD BACKFILL - Ensure nested objects have all their fields
// ============================================================================

function backfillPlayerFields(player: unknown): RPGCharacter {
  if (!player || typeof player !== 'object') {
    return { ...DEFAULT_PLAYER };
  }
  
  const p = player as Partial<RPGCharacter>;
  
  return {
    name: p.name ?? DEFAULT_PLAYER.name,
    classId: p.classId ?? DEFAULT_PLAYER.classId,
    backgroundId: p.backgroundId ?? DEFAULT_PLAYER.backgroundId,
    level: p.level ?? DEFAULT_PLAYER.level,
    experience: p.experience ?? DEFAULT_PLAYER.experience,
    currentHealth: p.currentHealth ?? DEFAULT_PLAYER.currentHealth,
    maxHealth: p.maxHealth ?? DEFAULT_PLAYER.maxHealth,
    stats: {
      strength: p.stats?.strength ?? DEFAULT_PLAYER.stats.strength,
      dexterity: p.stats?.dexterity ?? DEFAULT_PLAYER.stats.dexterity,
      constitution: p.stats?.constitution ?? DEFAULT_PLAYER.stats.constitution,
      intelligence: p.stats?.intelligence ?? DEFAULT_PLAYER.stats.intelligence,
      wisdom: p.stats?.wisdom ?? DEFAULT_PLAYER.stats.wisdom,
      charisma: p.stats?.charisma ?? DEFAULT_PLAYER.stats.charisma,
    },
    skills: Array.isArray(p.skills) ? p.skills : [],
    abilities: Array.isArray(p.abilities) ? p.abilities : [],
    inventory: Array.isArray(p.inventory) ? p.inventory : [],
    gold: p.gold ?? DEFAULT_PLAYER.gold,
    traits: Array.isArray(p.traits) ? p.traits : [],
    // Preserve any additional fields that might exist
    ...p,
  };
}

function backfillSettingsFields(settings: unknown): NonNullable<CampaignData['settings']> {
  if (!settings || typeof settings !== 'object') {
    return createDefaultSettings();
  }
  
  const s = settings as Partial<CampaignData['settings']>;
  
  return {
    adultContent: s.adultContent ?? false,
    cheatMode: s.cheatMode ?? false,
    directorSettings: s.directorSettings ?? { ...DEFAULT_DIRECTOR_SETTINGS },
    timeMultiplier: s.timeMultiplier ?? 'fifteen_minutes',
  };
}

function backfillMetaFields(meta: unknown): CampaignData['meta'] {
  if (!meta || typeof meta !== 'object') {
    return createDefaultMeta();
  }
  
  const m = meta as Partial<CampaignData['meta']>;
  return createDefaultMeta(m);
}

// ============================================================================
// MAIN NORMALIZATION FUNCTION
// ============================================================================

export interface NormalizationResult {
  campaign: CampaignData;
  wasModified: boolean;
  backfilledFields: string[];
  warnings: string[];
}

/**
 * Normalize a campaign to ensure all required fields exist with valid values.
 * This is the main entry point - call this on every load to ensure compatibility.
 */
export function normalizeCampaign(rawData: unknown): NormalizationResult {
  const result: NormalizationResult = {
    campaign: {} as CampaignData,
    wasModified: false,
    backfilledFields: [],
    warnings: [],
  };
  
  if (!rawData || typeof rawData !== 'object') {
    result.warnings.push('Campaign data was null or not an object, creating from scratch');
    result.wasModified = true;
    
    // Create minimal valid campaign
    result.campaign = createMinimalCampaign();
    return result;
  }
  
  const data = rawData as Record<string, unknown>;
  
  // Process each field definition
  for (const field of FIELD_DEFINITIONS) {
    const currentValue = getNestedValue(data, field.path);
    
    // Check if field is missing or invalid
    const isValid = field.validator ? field.validator(currentValue) : currentValue !== undefined;
    
    if (!isValid || currentValue === undefined) {
      const defaultValue = field.defaultFactory();
      setNestedValue(data, field.path, defaultValue);
      result.backfilledFields.push(field.path);
      result.wasModified = true;
    }
  }
  
  // Deep backfill for complex nested objects
  data.player = backfillPlayerFields(data.player);
  data.settings = backfillSettingsFields(data.settings);
  data.meta = backfillMetaFields(data.meta);
  data.currentChapter = createDefaultCurrentChapter(data.currentChapter as Partial<CampaignData['currentChapter']>);
  
  // Ensure arrays are actually arrays
  if (!Array.isArray(data.narrativeHistory)) {
    data.narrativeHistory = [];
    result.backfilledFields.push('narrativeHistory (converted to array)');
    result.wasModified = true;
  }
  
  if (!Array.isArray(data.chapters)) {
    data.chapters = [];
    result.backfilledFields.push('chapters (converted to array)');
    result.wasModified = true;
  }
  
  if (!Array.isArray(data.checkpoints)) {
    data.checkpoints = [];
    result.backfilledFields.push('checkpoints (converted to array)');
    result.wasModified = true;
  }
  
  // Add schema version marker
  (data as Record<string, unknown>).__schemaVersion = SAVE_SCHEMA_VERSION;
  
  result.campaign = data as unknown as CampaignData;
  
  if (result.backfilledFields.length > 0) {
    console.log(`[SaveSchema] Backfilled ${result.backfilledFields.length} fields:`, result.backfilledFields);
  }
  
  return result;
}

/**
 * Create a minimal valid campaign for emergency recovery
 */
export function createMinimalCampaign(): CampaignData {
  const now = Date.now();
  const id = `recovery_${now}_${Math.random().toString(36).slice(2, 11)}`;
  
  return {
    id,
    meta: createDefaultMeta({ name: 'Recovered Campaign' }),
    worldBible: null as unknown as CampaignData['worldBible'], // Will need reconstruction
    player: { ...DEFAULT_PLAYER },
    chapters: [],
    currentChapter: createDefaultCurrentChapter(),
    narrativeHistory: [],
    escalationTier: 1,
    currentTick: 0,
    scenario: '',
    checkpoints: [],
    currentMood: 'neutral',
    moodHistory: [],
    settings: createDefaultSettings(),
    weatherState: createInitialWeatherState(),
    timeState: createInitialTimeState(),
  };
}

// ============================================================================
// CHECKPOINT NORMALIZATION
// ============================================================================

export function normalizeCheckpoint(checkpoint: unknown): CampaignCheckpoint | null {
  if (!checkpoint || typeof checkpoint !== 'object') {
    return null;
  }
  
  const cp = checkpoint as Partial<CampaignCheckpoint>;
  
  if (!cp.id || !cp.label) {
    return null;
  }
  
  return {
    id: cp.id,
    label: cp.label,
    createdAt: cp.createdAt ?? Date.now(),
    player: backfillPlayerFields(cp.player),
    narrativeHistory: Array.isArray(cp.narrativeHistory) ? cp.narrativeHistory : [],
    escalationTier: cp.escalationTier ?? 1,
    currentTick: cp.currentTick ?? 0,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  
  current[parts[parts.length - 1]] = value;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a campaign without modifying it.
 * Use this to check if normalization is needed.
 */
export function validateCampaign(data: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };
  
  if (!data || typeof data !== 'object') {
    result.isValid = false;
    result.errors.push('Campaign data is null or not an object');
    return result;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Check critical fields
  if (!obj.id || typeof obj.id !== 'string') {
    result.errors.push('Missing or invalid campaign ID');
    result.isValid = false;
  }
  
  if (!obj.player || typeof obj.player !== 'object') {
    result.errors.push('Missing or invalid player data');
    result.isValid = false;
  }
  
  if (!obj.meta || typeof obj.meta !== 'object') {
    result.errors.push('Missing or invalid meta data');
    result.isValid = false;
  }
  
  // Check optional fields that might cause issues
  for (const field of FIELD_DEFINITIONS) {
    const value = getNestedValue(obj, field.path);
    if (value === undefined && field.defaultFactory() !== undefined) {
      result.warnings.push(`Field '${field.path}' is missing, will be backfilled`);
    }
  }
  
  return result;
}

// ============================================================================
// EXPORT SAFE VERSION
// ============================================================================

/**
 * Prepare a campaign for export by stripping internal markers
 */
export function prepareForExport(campaign: CampaignData): CampaignData {
  const copy = JSON.parse(JSON.stringify(campaign));
  delete (copy as Record<string, unknown>).__schemaVersion;
  return copy;
}
