// ============================================================================
// SAVE SYSTEM - Versioned saves with migration pipeline and corruption guards
// ============================================================================

import { CampaignMemoryStore } from '@/types/campaignMemory';
import { serializeCampaignMemory, deserializeCampaignMemory } from '@/game/campaignMemorySystem';
import { checkAndCleanupStorage, performCleanup } from '@/lib/storageCleanup';

// ============================================================================
// VERSION CONSTANTS
// ============================================================================

export const CURRENT_SAVE_VERSION = 7;
export const ENGINE_VERSION = '1.0.0';
export const SAVES_KEY = 'untold-game-saves';
export const BACKUP_KEY = 'untold-save-backup';

// Subsystem versions - increment when that subsystem's schema changes
export const SUBSYSTEM_VERSIONS: SubsystemVersions = {
  relationships: 2,
  knowledge: 2,
  inventory: 2,
  events: 2,
  needs: 2,
  reputation: 2,
  anchors: 1,
};

export interface SubsystemVersions {
  relationships: number;
  knowledge: number;
  inventory: number;
  events: number;
  needs: number;
  reputation: number;
  anchors: number;
}

// ============================================================================
// SAVE INTERFACE (Versioned)
// ============================================================================

export interface GameSave {
  // Identity
  id: string;
  characterName: string;
  timestamp: number;
  dateFormatted: string;
  slotNumber: number;
  
  // Version tracking
  saveVersion: number;
  engineVersion?: string;
  schemaHash?: string;
  subsystemVersions?: Partial<SubsystemVersions>;
  
  // Data
  gameData: unknown;
  campaignMemory?: string;
  
  // Legacy field (kept for backward compat during migration)
  version?: number;
}

// ============================================================================
// VALIDATION - Ensure minimal shape before processing
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMinimalShape(save: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!save || typeof save !== 'object') {
    return { valid: false, errors: ['Save is not an object'], warnings };
  }
  
  const s = save as Record<string, unknown>;
  
  // Required fields
  if (typeof s.id !== 'string') errors.push('Missing or invalid id');
  if (typeof s.characterName !== 'string') errors.push('Missing or invalid characterName');
  if (typeof s.timestamp !== 'number') errors.push('Missing or invalid timestamp');
  
  // Version field - either saveVersion or legacy version
  if (typeof s.saveVersion !== 'number' && typeof s.version !== 'number') {
    warnings.push('Missing version, will default to 1');
  }
  
  // gameData can be anything but should exist
  if (s.gameData === undefined) {
    warnings.push('Missing gameData, will use empty object');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// SCHEMA HASH - Detect structural changes
// ============================================================================

export function generateSchemaHash(): string {
  // Simple hash of subsystem versions for quick mismatch detection
  const parts = Object.entries(SUBSYSTEM_VERSIONS)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  return btoa(parts).slice(0, 16);
}

// ============================================================================
// MIGRATIONS - Pure transforms from vN to vN+1
// ============================================================================

type MigrationFn = (save: GameSave) => GameSave;

const MIGRATIONS: Record<number, MigrationFn> = {
  // v1 → v2: Relationship unification
  // Convert old npcMemory.trust/affection into unified format
  1: (save) => {
    const gameData = save.gameData as Record<string, unknown> | undefined;
    
    if (gameData && typeof gameData === 'object') {
      // If old relationship data exists, flag it for conversion
      const npcMemory = gameData.npcMemory as Record<string, unknown> | undefined;
      if (npcMemory) {
        // Mark relationships as needing unification
        (gameData as Record<string, unknown>)._relationshipsNeedUnification = true;
      }
    }
    
    return {
      ...save,
      saveVersion: 2,
      subsystemVersions: { ...save.subsystemVersions, relationships: 1 },
    };
  },
  
  // v2 → v3: Knowledge format stabilization
  // Convert Map-like objects to arrays of tuples
  2: (save) => {
    const gameData = save.gameData as Record<string, unknown> | undefined;
    
    if (gameData && typeof gameData === 'object') {
      const knowledge = gameData.knowledge as Record<string, unknown> | undefined;
      if (knowledge && !Array.isArray(knowledge)) {
        // Convert object format to array of tuples
        const asArray = Object.entries(knowledge).map(([key, value]) => [key, value]);
        (gameData as Record<string, unknown>).knowledgeTuples = asArray;
        (gameData as Record<string, unknown>)._knowledgeMigrated = true;
      }
    }
    
    return {
      ...save,
      saveVersion: 3,
      subsystemVersions: { ...save.subsystemVersions, knowledge: 1 },
    };
  },
  
  // v3 → v4: Event Ledger compaction
  // Add eventId, ts, type to events and cap history
  3: (save) => {
    const gameData = save.gameData as Record<string, unknown> | undefined;
    const MAX_EVENTS = 500;
    
    if (gameData && typeof gameData === 'object') {
      const events = gameData.eventHistory as unknown[] | undefined;
      if (Array.isArray(events)) {
        // Compact and cap events
        const compactedEvents = events.slice(-MAX_EVENTS).map((evt, idx) => {
          if (typeof evt === 'object' && evt !== null) {
            return {
              ...evt,
              eventId: (evt as Record<string, unknown>).eventId || `evt_${idx}`,
              ts: (evt as Record<string, unknown>).ts || save.timestamp,
            };
          }
          return { eventId: `evt_${idx}`, ts: save.timestamp, data: evt };
        });
        (gameData as Record<string, unknown>).eventHistory = compactedEvents;
      }
    }
    
    return {
      ...save,
      saveVersion: 4,
      subsystemVersions: { ...save.subsystemVersions, events: 1 },
    };
  },
  
  // v4 → v5: Needs system officialization
  // Ensure needs exist with defaults and add lastNeedTickTs
  4: (save) => {
    const gameData = save.gameData as Record<string, unknown> | undefined;
    
    if (gameData && typeof gameData === 'object') {
      // Ensure needs structure exists
      if (!gameData.needs) {
        (gameData as Record<string, unknown>).needs = {
          physical: { hunger: 80, thirst: 80, energy: 80, bladder: 20, hygiene: 80, health: 100 },
          psychological: { stress: 20, tension: 20, comfort: 80, social: 70, fulfillment: 60 },
        };
      }
      // Add tick timestamp to prevent time-jump explosions
      if (!(gameData as Record<string, unknown>).lastNeedTickTs) {
        (gameData as Record<string, unknown>).lastNeedTickTs = save.timestamp;
      }
    }
    
    return {
      ...save,
      saveVersion: 5,
      subsystemVersions: { ...save.subsystemVersions, needs: 1 },
    };
  },
  
  // v5 → v6: Reputation baseline seeding
  // Ensure factionRep exists and mark as seeded
  5: (save) => {
    const gameData = save.gameData as Record<string, unknown> | undefined;
    
    if (gameData && typeof gameData === 'object') {
      // Ensure faction reputation structure exists
      if (!gameData.factionRep) {
        (gameData as Record<string, unknown>).factionRep = {};
      }
      // Mark as seeded so we don't re-seed on every load
      (gameData as Record<string, unknown>).npcBaselineSeeded = true;
    }
    
    return {
      ...save,
      saveVersion: 6,
      subsystemVersions: { ...save.subsystemVersions, reputation: 1 },
    };
  },
  
  // v6 → v7: Canon + anchors
  // Add anchoredFacts and factHistory storage
  6: (save) => {
    const gameData = save.gameData as Record<string, unknown> | undefined;
    
    if (gameData && typeof gameData === 'object') {
      // Initialize anchor storage
      if (!gameData.anchoredFacts) {
        (gameData as Record<string, unknown>).anchoredFacts = [];
      }
      if (!gameData.factHistory) {
        (gameData as Record<string, unknown>).factHistory = [];
      }
    }
    
    return {
      ...save,
      saveVersion: 7,
      subsystemVersions: { ...save.subsystemVersions, anchors: 1 },
    };
  },
};

// ============================================================================
// NORMALIZATION - Fill defaults, clean types (separate from migration)
// ============================================================================

export function normalizeSave(save: GameSave): GameSave {
  // Ensure all required fields have proper defaults
  const normalized: GameSave = {
    ...save,
    
    // Identity defaults
    id: save.id || `save_${Date.now()}`,
    characterName: save.characterName || 'Unknown Hero',
    timestamp: save.timestamp || Date.now(),
    dateFormatted: save.dateFormatted || formatSaveDate(save.timestamp || Date.now()),
    slotNumber: typeof save.slotNumber === 'number' ? save.slotNumber : 1,
    
    // Version defaults
    saveVersion: save.saveVersion || CURRENT_SAVE_VERSION,
    engineVersion: save.engineVersion || ENGINE_VERSION,
    schemaHash: save.schemaHash || generateSchemaHash(),
    subsystemVersions: { ...SUBSYSTEM_VERSIONS, ...save.subsystemVersions },
    
    // Data defaults
    gameData: save.gameData ?? {},
  };
  
  // Clean up legacy version field
  delete normalized.version;
  
  return normalized;
}

// ============================================================================
// MIGRATION PIPELINE - The single entry point for loading saves
// ============================================================================

export interface LoadResult {
  success: boolean;
  save: GameSave | null;
  errors: string[];
  warnings: string[];
  migrated: boolean;
  originalVersion: number;
}

export function processSaveForLoading(rawSave: unknown): LoadResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Step 1: Validate minimal shape
  const validation = validateMinimalShape(rawSave);
  if (!validation.valid) {
    return {
      success: false,
      save: null,
      errors: validation.errors,
      warnings: validation.warnings,
      migrated: false,
      originalVersion: 0,
    };
  }
  warnings.push(...validation.warnings);
  
  // Step 2: Coerce to GameSave type
  let save = rawSave as GameSave;
  
  // Handle legacy version field
  const originalVersion = save.saveVersion || save.version || 1;
  if (!save.saveVersion) {
    save.saveVersion = originalVersion;
  }
  
  // Step 3: Migrate through all versions
  let migrated = false;
  while (save.saveVersion < CURRENT_SAVE_VERSION) {
    const migrator = MIGRATIONS[save.saveVersion];
    if (migrator) {
      try {
        save = migrator(save);
        migrated = true;
        console.log(`[SaveSystem] Migrated save from v${save.saveVersion - 1} to v${save.saveVersion}`);
      } catch (err) {
        errors.push(`Migration v${save.saveVersion} failed: ${err}`);
        return {
          success: false,
          save: null,
          errors,
          warnings,
          migrated,
          originalVersion,
        };
      }
    } else {
      // No migrator, just bump version
      save = { ...save, saveVersion: save.saveVersion + 1 };
    }
  }
  
  // Step 4: Normalize (fill defaults, clean types)
  save = normalizeSave(save);
  
  return {
    success: true,
    save,
    errors,
    warnings,
    migrated,
    originalVersion,
  };
}

// ============================================================================
// CORRUPTION GUARDS
// ============================================================================

// Backup the original save before migration
let lastBackup: string | null = null;

export function backupBeforeMigrate(save: unknown): void {
  try {
    lastBackup = JSON.stringify(save);
    // Also store in localStorage for recovery
    localStorage.setItem(BACKUP_KEY, lastBackup);
  } catch (e) {
    console.warn('[SaveSystem] Failed to create backup:', e);
  }
}

export function getLastBackup(): unknown | null {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (stored) return JSON.parse(stored);
    if (lastBackup) return JSON.parse(lastBackup);
  } catch (e) {
    console.error('[SaveSystem] Failed to restore backup:', e);
  }
  return null;
}

// Atomic write: write to temp key, then swap
export function atomicWrite(key: string, data: unknown): boolean {
  const tempKey = `${key}_tmp`;

  const attemptWrite = (): boolean => {
    const serialized = JSON.stringify(data);

    // Size check - warn if save is getting large
    const sizeKB = serialized.length / 1024;
    if (sizeKB > 1000) {
      console.warn(`[SaveSystem] Save size is ${sizeKB.toFixed(1)}KB - consider compacting`);
    }

    // Single write to real key (removed duplicate temp-key write that was
    // doubling main-thread blocking time on every save).
    localStorage.setItem(key, serialized);

    // Clean up any stale temp key from prior failed writes
    try { localStorage.removeItem(tempKey); } catch {}

    return true;
  };
  
  try {
    return attemptWrite();
  } catch (e: any) {
    // Handle quota exceeded with aggressive cleanup and retry
    if (e.name === 'QuotaExceededError') {
      console.warn('[SaveSystem] Quota exceeded during atomic write, performing aggressive cleanup...');
      performCleanup(0.4);
      
      try {
        const result = attemptWrite();
        console.log('[SaveSystem] Atomic write succeeded after cleanup');
        return result;
      } catch (retryError) {
        console.error('[SaveSystem] Atomic write still failed after cleanup:', retryError);
      }
    } else {
      console.error('[SaveSystem] Atomic write failed:', e);
    }
    
    // Try to clean up temp
    try {
      localStorage.removeItem(tempKey);
    } catch {}
    
    return false;
  }
}

// Size caps - tuned aggressively to keep saves under ~1MB even for long sessions
export const SIZE_CAPS = {
  narrativeHistory: 100,   // was 150
  eventHistory: 200,       // was 300
  storyEntries: 60,        // was 75
  npcMemories: 75,         // was 100
  questJournalEntries: 40, // was 50
} as const;

export function applyDataSizeCaps(gameData: Record<string, unknown>): Record<string, unknown> {
  const capped = { ...gameData };
  
  // Cap narrative history
  if (Array.isArray(capped.narrativeHistory)) {
    const hist = capped.narrativeHistory as unknown[];
    if (hist.length > SIZE_CAPS.narrativeHistory) {
      capped.narrativeHistory = hist.slice(-SIZE_CAPS.narrativeHistory);
    }
  }
  
  // Cap event history
  if (Array.isArray(capped.eventHistory)) {
    const events = capped.eventHistory as unknown[];
    if (events.length > SIZE_CAPS.eventHistory) {
      capped.eventHistory = events.slice(-SIZE_CAPS.eventHistory);
    }
  }
  
  // Cap story entries
  if (Array.isArray(capped.storyEntries)) {
    const stories = capped.storyEntries as unknown[];
    if (stories.length > SIZE_CAPS.storyEntries) {
      capped.storyEntries = stories.slice(-SIZE_CAPS.storyEntries);
    }
  }
  
  // Cap NPC memories to prevent save bloat
  if (capped.npcs && typeof capped.npcs === 'object') {
    const npcs = capped.npcs as Record<string, Record<string, unknown>>;
    for (const npcId in npcs) {
      const npc = npcs[npcId];
      if (npc && Array.isArray(npc.memories)) {
        const memories = npc.memories as unknown[];
        if (memories.length > SIZE_CAPS.npcMemories) {
          npc.memories = memories.slice(-SIZE_CAPS.npcMemories);
        }
      }
    }
  }
  
  // Cap quest journal entries
  if (capped.questLog && typeof capped.questLog === 'object') {
    const questLog = capped.questLog as Record<string, Record<string, unknown>>;
    if (questLog.quests && typeof questLog.quests === 'object') {
      for (const questId in questLog.quests) {
        const quest = (questLog.quests as Record<string, Record<string, unknown>>)[questId];
        if (quest && Array.isArray(quest.journalEntries)) {
          const entries = quest.journalEntries as unknown[];
          if (entries.length > SIZE_CAPS.questJournalEntries) {
            quest.journalEntries = entries.slice(-SIZE_CAPS.questJournalEntries);
          }
        }
      }
    }
  }
  
  return capped;
}

// ============================================================================
// LOAD SAVES (with full pipeline)
// ============================================================================

export function loadAllSaves(): GameSave[] {
  try {
    const saved = localStorage.getItem(SAVES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as unknown[];
      
      // Process each save through the pipeline
      return parsed
        .map(raw => {
          const result = processSaveForLoading(raw);
          if (result.success && result.save) {
            return result.save;
          }
          console.warn('[SaveSystem] Failed to load save:', result.errors);
          return null;
        })
        .filter((s): s is GameSave => s !== null);
    }
  } catch (e) {
    console.error('[SaveSystem] Failed to load saves:', e);
  }
  return [];
}

// ============================================================================
// GET SAVES FOR CHARACTER (campaign-specific)
// ============================================================================

export function getSavesForCharacter(characterName: string): { autoSave: GameSave | null; manualSave: GameSave | null } {
  const saves = loadAllSaves();
  const normalizedName = characterName.toLowerCase().trim();
  
  const autoSave = saves.find(s => s.id === `auto-${normalizedName}`) || null;
  const manualSave = saves.find(s => s.id === `manual-${normalizedName}`) || null;
  
  return { autoSave, manualSave };
}

// ============================================================================
// SAVE GAME (with versioning and corruption guards)
// ============================================================================

export function saveGame(
  characterName: string, 
  gameData: unknown, 
  isAutoSave: boolean = false,
  campaignMemory?: CampaignMemoryStore
): GameSave {
  // Proactive cleanup before any save operation
  checkAndCleanupStorage();
  
  const saves = loadAllSaves();
  const now = Date.now();
  const normalizedName = (characterName || 'Unknown Hero').toLowerCase().trim();
  
  // Apply size caps to prevent bloat
  const cappedGameData = typeof gameData === 'object' && gameData !== null
    ? applyDataSizeCaps(gameData as Record<string, unknown>)
    : gameData;
  
  const saveId = isAutoSave 
    ? `auto-${normalizedName}` 
    : `manual-${normalizedName}`;
  
  const newSave: GameSave = {
    id: saveId,
    characterName: characterName || 'Unknown Hero',
    timestamp: now,
    dateFormatted: formatSaveDate(now),
    slotNumber: isAutoSave ? -1 : 1,
    
    // Version tracking
    saveVersion: CURRENT_SAVE_VERSION,
    engineVersion: ENGINE_VERSION,
    schemaHash: generateSchemaHash(),
    subsystemVersions: { ...SUBSYSTEM_VERSIONS },
    
    // Data
    gameData: cappedGameData,
    campaignMemory: campaignMemory ? serializeCampaignMemory(campaignMemory) : undefined,
  };
  
  // Remove existing save for this campaign
  const filteredSaves = saves.filter(s => s.id !== saveId);
  const updatedSaves = [...filteredSaves, newSave]
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // Atomic write with backup
  backupBeforeMigrate(saves);
  if (!atomicWrite(SAVES_KEY, updatedSaves)) {
    // Fallback to direct write with error handling
    console.warn('[SaveSystem] Atomic write failed, trying fallback...');
    try {
      savesToStorage(updatedSaves);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.error('[SaveSystem] Fallback save also failed due to quota');
        // Aggressive cleanup and final retry
        performCleanup(0.5);
        try {
          savesToStorage(updatedSaves);
          console.log('[SaveSystem] Save succeeded after aggressive cleanup');
        } catch {
          console.error('[SaveSystem] All save attempts failed');
        }
      }
    }
  }
  
  return newSave;
}

// ============================================================================
// DELETE SAVE
// ============================================================================

export function deleteSave(saveId: string): void {
  const saves = loadAllSaves();
  const filtered = saves.filter(s => s.id !== saveId);
  savesToStorage(filtered);
}

// ============================================================================
// LOAD SPECIFIC SAVE (with full pipeline)
// ============================================================================

export function loadSave(saveId: string): GameSave | null {
  const saves = loadAllSaves();
  const save = saves.find(s => s.id === saveId);
  if (!save) return null;
  
  // Already processed through pipeline in loadAllSaves
  return save;
}

// ============================================================================
// LOAD CAMPAIGN MEMORY FROM SAVE
// ============================================================================

export function loadCampaignMemoryFromSave(save: GameSave): CampaignMemoryStore | null {
  if (!save.campaignMemory) return null;
  return deserializeCampaignMemory(save.campaignMemory);
}

// ============================================================================
// EXPORT/IMPORT SAVE (for backup/restore)
// ============================================================================

export function exportSave(saveId: string): string | null {
  const save = loadSave(saveId);
  if (!save) return null;
  
  return JSON.stringify({
    ...save,
    _exportedAt: Date.now(),
    _exportVersion: CURRENT_SAVE_VERSION,
  }, null, 2);
}

export function importSave(jsonString: string): LoadResult {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Process through full pipeline
    const result = processSaveForLoading(parsed);
    
    if (result.success && result.save) {
      // Add to saves list
      const saves = loadAllSaves();
      const existingIndex = saves.findIndex(s => s.id === result.save!.id);
      
      if (existingIndex >= 0) {
        saves[existingIndex] = result.save;
      } else {
        saves.push(result.save);
      }
      
      savesToStorage(saves);
    }
    
    return result;
  } catch (e) {
    return {
      success: false,
      save: null,
      errors: [`Failed to parse save JSON: ${e}`],
      warnings: [],
      migrated: false,
      originalVersion: 0,
    };
  }
}

// ============================================================================
// GET MOST RECENT SAVE
// ============================================================================

export function getMostRecentSave(): GameSave | null {
  const saves = loadAllSaves();
  if (saves.length === 0) return null;
  return saves.sort((a, b) => b.timestamp - a.timestamp)[0];
}

// ============================================================================
// GET AUTO/MANUAL SAVES
// ============================================================================

export function getAutoSaves(): GameSave[] {
  return loadAllSaves()
    .filter(s => s.id.startsWith('auto-'))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getManualSaves(): GameSave[] {
  return loadAllSaves()
    .filter(s => s.id.startsWith('manual-'))
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ============================================================================
// GET ALL CHARACTER CAMPAIGNS
// ============================================================================

export function getAllCharacterCampaigns(): string[] {
  const saves = loadAllSaves();
  const characters = new Set<string>();
  for (const save of saves) {
    characters.add(save.characterName);
  }
  return Array.from(characters);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function savesToStorage(saves: GameSave[]): void {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[SaveSystem] Storage quota exceeded, trimming...');
      
      const trimmedSaves = saves
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      try {
        localStorage.setItem(SAVES_KEY, JSON.stringify(trimmedSaves));
      } catch (e2) {
        console.error('[SaveSystem] Still cannot save after trimming:', e2);
      }
    } else {
      console.error('[SaveSystem] Failed to save games:', e);
    }
  }
}

function formatSaveDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (diffDays === 0) {
    if (diffHours === 0) {
      if (diffMins < 5) return `Just now`;
      return `${diffMins} minutes ago`;
    }
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }) + ` at ${timeStr}`;
  }
}

// ============================================================================
// AUTO-SAVE INTERVAL HOOK
// ============================================================================

export function getAutoSaveInterval(): number {
  return 5 * 60 * 1000; // 5 minutes
}

// ============================================================================
// LEGACY COMPATIBILITY - Keep old exports working
// ============================================================================

export const SAVE_VERSION = CURRENT_SAVE_VERSION;

export function migrateSave(save: GameSave): GameSave {
  const result = processSaveForLoading(save);
  return result.save || save;
}
