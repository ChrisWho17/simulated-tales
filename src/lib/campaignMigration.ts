// ============================================================================
// CAMPAIGN MIGRATION UTILITY
// Converts existing localStorage saves to the new multi-campaign format
// AND upgrades old campaign versions to current format
// ============================================================================

import { CampaignData, CampaignMetadata, CampaignCheckpoint } from '@/types/campaign';
import { loadCampaignIndex, saveCampaign, canCreateCampaign } from '@/lib/campaignStorage';
import { GameSave, loadAllSaves, deleteSave } from '@/lib/saveSystem';
import { deserializeCampaignMemory } from '@/game/campaignMemorySystem';
import { deserializeWorldBible, createWorldBible } from '@/game/worldBible';
import { GameGenre } from '@/types/genreData';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';

// ============================================================================
// VERSION CONSTANTS
// ============================================================================

export const CURRENT_CAMPAIGN_VERSION = 3;

// Old localStorage keys
const OLD_STORY_KEY = 'untold-adventure-story';
const OLD_CHARACTER_KEY = 'untold-adventure-character';
const OLD_SCENARIO_KEY = 'untold-adventure-scenario';
const OLD_GENRE_KEY = 'untold-adventure-genre';
const OLD_WORLD_BIBLE_KEY = 'untold-world-bible';
const OLD_CAMPAIGN_MEMORY_KEY = 'untold-campaign-memory';
const OLD_MOOD_KEY = 'untold-player-mood';
const OLD_SAVES_KEY = 'untold-game-saves';

// Migration result for old format migration
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  campaigns: CampaignMetadata[];
}

// Migration result for version upgrades
export interface VersionMigrationResult {
  campaign: CampaignData;
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
  warnings: string[];
}

// ============================================================================
// CHECK IF MIGRATION IS NEEDED
// ============================================================================

export function needsMigration(): boolean {
  // Check if old format data exists
  const hasOldStory = !!localStorage.getItem(OLD_STORY_KEY);
  const hasOldCharacter = !!localStorage.getItem(OLD_CHARACTER_KEY);
  const hasOldSaves = !!localStorage.getItem(OLD_SAVES_KEY);
  
  // Check if already migrated (has campaigns)
  const existingCampaigns = loadCampaignIndex();
  
  // Need migration if old data exists and no campaigns yet
  return (hasOldStory || hasOldCharacter || hasOldSaves) && existingCampaigns.length === 0;
}

// ============================================================================
// GET MIGRATION PREVIEW
// ============================================================================

export function getMigrationPreview(): { currentSession: boolean; savedGames: number } {
  const hasCurrentSession = !!(
    localStorage.getItem(OLD_STORY_KEY) && 
    localStorage.getItem(OLD_CHARACTER_KEY)
  );
  
  const oldSaves = loadAllSaves();
  
  return {
    currentSession: hasCurrentSession,
    savedGames: oldSaves.length,
  };
}

// ============================================================================
// MIGRATE ALL DATA
// ============================================================================

export function migrateAllData(): MigrationResult {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    campaigns: [],
  };
  
  try {
    // 1. Migrate current session first (if exists)
    const currentSession = migrateCurrentSession();
    if (currentSession) {
      saveCampaign(currentSession);
      result.migratedCount++;
      console.log(`[Migration] Migrated current session: ${currentSession.meta.name}`);
    }
    
    // 2. Migrate saved games
    const oldSaves = loadAllSaves();
    for (const save of oldSaves) {
      if (!canCreateCampaign()) {
        result.errors.push(`Campaign limit reached, skipped save: ${save.characterName}`);
        break;
      }
      
      try {
        const campaign = migrateSavedGame(save);
        if (campaign) {
          saveCampaign(campaign);
          result.migratedCount++;
          console.log(`[Migration] Migrated saved game: ${campaign.meta.name}`);
        }
      } catch (e) {
        const error = `Failed to migrate save \"${save.characterName}\": ${e}`;
        result.errors.push(error);
        console.error(error);
      }
    }
    
    // 3. Get updated campaign list
    result.campaigns = loadCampaignIndex();
    
    // 4. Clean up old data (optional - keep for safety)
    // cleanupOldData();
    
    console.log(`[Migration] Complete: ${result.migratedCount} campaigns migrated`);
    
  } catch (e) {
    result.success = false;
    result.errors.push(`Migration failed: ${e}`);
    console.error('[Migration] Fatal error:', e);
  }
  
  return result;
}

// ============================================================================
// MIGRATE CURRENT SESSION
// ============================================================================

function migrateCurrentSession(): CampaignData | null {
  const storyJson = localStorage.getItem(OLD_STORY_KEY);
  const characterJson = localStorage.getItem(OLD_CHARACTER_KEY);
  
  if (!storyJson || !characterJson) return null;
  
  try {
    const story: StoryEntry[] = JSON.parse(storyJson);
    const character: RPGCharacter = JSON.parse(characterJson);
    const scenario = localStorage.getItem(OLD_SCENARIO_KEY) || 'Adventure awaits...';
    const genre = (localStorage.getItem(OLD_GENRE_KEY) || 'fantasy') as GameGenre;
    
    // Try to restore world bible
    let worldBible = null;
    const worldBibleJson = localStorage.getItem(OLD_WORLD_BIBLE_KEY);
    if (worldBibleJson) {
      worldBible = deserializeWorldBible(worldBibleJson);
    }
    
    // Create default world bible if not found
    if (!worldBible) {
      worldBible = createWorldBible({
        campaignName: `${character.name}'s Adventure`,
        primaryGenre: genre,
        secondaryGenres: [],
        hardLock: false,
        tabooList: [],
        intrusionBudget: 2,
      });
    }
    
    // Try to restore campaign memory
    let campaignMemory = null;
    const campaignMemoryJson = localStorage.getItem(OLD_CAMPAIGN_MEMORY_KEY);
    if (campaignMemoryJson) {
      campaignMemory = deserializeCampaignMemory(campaignMemoryJson);
    }
    
    // Get mood
    let currentMood = 'neutral';
    const moodJson = localStorage.getItem(OLD_MOOD_KEY);
    if (moodJson) {
      try {
        currentMood = JSON.parse(moodJson);
      } catch {}
    }
    
    const now = Date.now();
    const campaignId = `migrated_${character.name.toLowerCase().replace(/\s+/g, '_')}_${now}`;
    
    const campaign: CampaignData = {
      id: campaignId,
      meta: {
        name: `${character.name}'s Adventure`,
        primaryGenre: genre,
        secondaryGenres: [],
        createdAt: story[0]?.timestamp || now,
        updatedAt: now,
        playTime: estimatePlayTime(story),
        chapterCount: 1,
      },
      worldBible,
      player: character,
      chapters: [],
      currentChapter: {
        number: 1,
        title: 'Chapter 1',
        startedAt: story[0]?.timestamp || now,
      },
      narrativeHistory: story,
      escalationTier: 1,
      currentTick: story.length,
      scenario,
      checkpoints: [],
      campaignMemory: campaignMemory || undefined,
      currentMood,
      moodHistory: [],
      settings: {
        adultContent: false,
        cheatMode: false,
      },
    };
    
    return campaign;
    
  } catch (e) {
    console.error('[Migration] Failed to migrate current session:', e);
    return null;
  }
}

// ============================================================================
// MIGRATE SAVED GAME
// ============================================================================

function migrateSavedGame(save: GameSave): CampaignData | null {
  try {
    const gameData = save.gameData as {
      story?: StoryEntry[];
      character?: RPGCharacter;
    };
    
    if (!gameData.story || !gameData.character) {
      console.warn(`[Migration] Skipping incomplete save: ${save.id}`);
      return null;
    }
    
    const story = gameData.story;
    const character = gameData.character;
    const genre = (localStorage.getItem(OLD_GENRE_KEY) || 'fantasy') as GameGenre;
    const scenario = localStorage.getItem(OLD_SCENARIO_KEY) || 'Adventure continues...';
    
    // Try to restore campaign memory from save
    let campaignMemory = null;
    if (save.campaignMemory) {
      campaignMemory = deserializeCampaignMemory(save.campaignMemory);
    }
    
    // Create world bible
    const worldBible = createWorldBible({
      campaignName: `${character.name}'s Adventure`,
      primaryGenre: genre,
      secondaryGenres: [],
      hardLock: false,
      tabooList: [],
      intrusionBudget: 2,
    });
    
    const now = Date.now();
    const saveType = save.id.startsWith('auto-') ? 'auto' : 'manual';
    const campaignId = `migrated_${saveType}_${character.name.toLowerCase().replace(/\s+/g, '_')}_${save.timestamp}`;
    
    const campaign: CampaignData = {
      id: campaignId,
      meta: {
        name: `${character.name}'s Adventure${saveType === 'auto' ? ' (Auto)' : ''}`,
        primaryGenre: genre,
        secondaryGenres: [],
        createdAt: story[0]?.timestamp || save.timestamp,
        updatedAt: save.timestamp,
        playTime: estimatePlayTime(story),
        chapterCount: 1,
      },
      worldBible,
      player: character,
      chapters: [],
      currentChapter: {
        number: 1,
        title: 'Chapter 1',
        startedAt: story[0]?.timestamp || save.timestamp,
      },
      narrativeHistory: story,
      escalationTier: 1,
      currentTick: story.length,
      scenario,
      checkpoints: [],
      campaignMemory: campaignMemory || undefined,
      currentMood: 'neutral',
      moodHistory: [],
      settings: {
        adultContent: false,
        cheatMode: false,
      },
    };
    
    return campaign;
    
  } catch (e) {
    console.error(`[Migration] Failed to migrate save ${save.id}:`, e);
    return null;
  }
}

// ============================================================================
// ESTIMATE PLAY TIME
// ============================================================================

function estimatePlayTime(story: StoryEntry[]): number {
  if (story.length < 2) return 0;
  
  // Estimate based on story length (roughly 30 seconds per entry)
  return story.length * 30;
}

// ============================================================================
// CLEANUP OLD DATA (optional - call manually after confirming migration)
// ============================================================================

export function cleanupOldData(): void {
  localStorage.removeItem(OLD_STORY_KEY);
  localStorage.removeItem(OLD_CHARACTER_KEY);
  localStorage.removeItem(OLD_SCENARIO_KEY);
  localStorage.removeItem(OLD_GENRE_KEY);
  localStorage.removeItem(OLD_WORLD_BIBLE_KEY);
  localStorage.removeItem(OLD_CAMPAIGN_MEMORY_KEY);
  localStorage.removeItem(OLD_MOOD_KEY);
  localStorage.removeItem(OLD_SAVES_KEY);
  console.log('[Migration] Old data cleaned up');
}

// ============================================================================
// MIGRATION STATUS CHECK
// ============================================================================
// VERSION-BASED CAMPAIGN MIGRATION
// ============================================================================

function detectVersion(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  
  const obj = data as Record<string, unknown>;
  
  // Check for explicit version field
  if (typeof obj.version === 'number') {
    return obj.version;
  }
  
  // Check for saveVersion (old format)
  if (typeof obj.saveVersion === 'number') {
    return obj.saveVersion;
  }
  
  // Version 3: Has meta.name and player object directly (current format)
  if (obj.meta && typeof obj.meta === 'object' && 
      obj.player && typeof obj.player === 'object' &&
      !obj.gameData) {
    return 3;
  }
  
  // Version 2: Has gameData wrapper
  if (obj.gameData && typeof obj.gameData === 'object') {
    return 2;
  }
  
  // Version 1: Old flat structure
  if (typeof obj.characterName === 'string' || typeof obj.timestamp === 'number') {
    return 1;
  }
  
  return 1;
}

function getDefaultPlayer(): RPGCharacter {
  return {
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
}

type MigrationFn = (data: Record<string, unknown>, warnings: string[]) => Record<string, unknown>;

const versionMigrations: Record<number, MigrationFn> = {
  // Version 1 -> 2: Wrap game data
  1: (data, warnings) => {
    warnings.push('Migrated from legacy v1 format');
    
    const gameData = {
      player: data.character || data.player || getDefaultPlayer(),
      narrativeHistory: data.story || data.narrativeHistory || [],
      escalationTier: data.escalationTier || 1,
      currentTick: data.currentTick || 0,
    };
    
    return {
      id: data.id || `migrated_${Date.now()}`,
      saveVersion: 2,
      timestamp: data.timestamp || Date.now(),
      characterName: (data.character as { name?: string })?.name || 
                     (data.player as { name?: string })?.name || 
                     'Unknown',
      gameData,
    };
  },
  
  // Version 2 -> 3: Flatten to new CampaignData structure
  2: (data, warnings) => {
    warnings.push('Migrated from v2 to v3 format');
    
    const gameData = (data.gameData || {}) as Record<string, unknown>;
    const now = Date.now();
    
    let player = gameData.player as RPGCharacter | undefined;
    if (!player || typeof player !== 'object') {
      player = getDefaultPlayer();
      player.name = (data.characterName as string) || 'Unknown Hero';
      warnings.push('Player data reconstructed from defaults');
    }
    
    let narrativeHistory = gameData.narrativeHistory || gameData.story || [];
    if (!Array.isArray(narrativeHistory)) {
      narrativeHistory = [];
      warnings.push('Narrative history was missing or invalid');
    }
    
    const worldBible = gameData.worldBible || createWorldBible({
      campaignName: (data.characterName as string) || 'Migrated Campaign',
      primaryGenre: 'fantasy' as GameGenre,
      secondaryGenres: [],
      hardLock: false,
      tabooList: [],
      intrusionBudget: 2,
    });
    
    return {
      id: (data.id as string) || `campaign_${now}`,
      version: 3,
      meta: {
        name: (data.characterName as string) || 'Migrated Campaign',
        primaryGenre: 'fantasy',
        secondaryGenres: [],
        createdAt: (data.timestamp as number) || now,
        updatedAt: now,
        playTime: (gameData.playTime as number) || 0,
        chapterCount: 1,
      },
      worldBible,
      player,
      chapters: [],
      currentChapter: {
        number: 1,
        title: 'Continued Journey',
        startedAt: now,
      },
      narrativeHistory,
      escalationTier: (gameData.escalationTier as number) || 1,
      currentTick: (gameData.currentTick as number) || 0,
      scenario: (gameData.scenario as string) || '',
      checkpoints: migrateCheckpoints(gameData.checkpoints, warnings),
      currentMood: (gameData.currentMood as string) || 'neutral',
      moodHistory: (gameData.moodHistory as unknown[]) || [],
      settings: {
        adultContent: false,
        cheatMode: false,
      },
    };
  },
};

function migrateCheckpoints(checkpoints: unknown, warnings: string[]): CampaignCheckpoint[] {
  if (!Array.isArray(checkpoints)) return [];
  
  return checkpoints
    .filter((cp): cp is Record<string, unknown> => cp !== null && typeof cp === 'object')
    .map((cp, idx) => {
      const player = cp.player as RPGCharacter | undefined;
      if (!player) {
        warnings.push(`Checkpoint ${idx} missing player data`);
      }
      
      return {
        id: (cp.id as string) || `checkpoint_migrated_${idx}`,
        label: (cp.label as string) || `Checkpoint ${idx + 1}`,
        createdAt: (cp.createdAt as number) || Date.now(),
        player: player || getDefaultPlayer(),
        narrativeHistory: Array.isArray(cp.narrativeHistory) ? cp.narrativeHistory : [],
        escalationTier: (cp.escalationTier as number) || 1,
        currentTick: (cp.currentTick as number) || 0,
      };
    });
}

function ensureRequiredFields(data: Record<string, unknown>, warnings: string[]): Record<string, unknown> {
  const now = Date.now();
  
  // Ensure ID
  if (!data.id || typeof data.id !== 'string') {
    data.id = `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`;
    warnings.push('Generated new campaign ID');
  }
  
  // Ensure meta
  if (!data.meta || typeof data.meta !== 'object') {
    data.meta = {
      name: 'Untitled Campaign',
      primaryGenre: 'fantasy',
      secondaryGenres: [],
      createdAt: now,
      updatedAt: now,
      playTime: 0,
      chapterCount: 1,
    };
    warnings.push('Created default meta object');
  } else {
    const meta = data.meta as Record<string, unknown>;
    meta.name = meta.name || 'Untitled Campaign';
    meta.primaryGenre = meta.primaryGenre || 'fantasy';
    meta.secondaryGenres = Array.isArray(meta.secondaryGenres) ? meta.secondaryGenres : [];
    meta.createdAt = meta.createdAt || now;
    meta.updatedAt = meta.updatedAt || now;
    meta.playTime = typeof meta.playTime === 'number' ? meta.playTime : 0;
    meta.chapterCount = typeof meta.chapterCount === 'number' ? meta.chapterCount : 1;
  }
  
  // Ensure player
  if (!data.player || typeof data.player !== 'object') {
    data.player = getDefaultPlayer();
    warnings.push('Created default player');
  } else {
    const player = data.player as Record<string, unknown>;
    player.name = player.name || 'Unknown Hero';
    player.classId = player.classId || 'warrior';
    player.backgroundId = player.backgroundId || 'commoner';
    player.level = typeof player.level === 'number' ? player.level : 1;
    player.experience = typeof player.experience === 'number' ? player.experience : 0;
    player.currentHealth = typeof player.currentHealth === 'number' ? player.currentHealth : 
                           (typeof player.health === 'number' ? player.health : 100);
    player.maxHealth = typeof player.maxHealth === 'number' ? player.maxHealth : 100;
    
    // Handle old 'attributes' -> new 'stats' migration
    if (!player.stats || typeof player.stats !== 'object') {
      const attrs = player.attributes as Record<string, number> | undefined;
      player.stats = attrs || {
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10,
      };
    }
    
    player.skills = Array.isArray(player.skills) ? player.skills : [];
    player.abilities = Array.isArray(player.abilities) ? player.abilities : [];
    player.inventory = Array.isArray(player.inventory) ? player.inventory : [];
    player.gold = typeof player.gold === 'number' ? player.gold : 0;
    player.traits = Array.isArray(player.traits) ? player.traits : [];
  }
  
  // Ensure world bible
  if (!data.worldBible || typeof data.worldBible !== 'object') {
    const meta = data.meta as Record<string, unknown>;
    data.worldBible = createWorldBible({
      campaignName: (meta.name as string) || 'Migrated Campaign',
      primaryGenre: (meta.primaryGenre as GameGenre) || 'fantasy',
      secondaryGenres: [],
      hardLock: false,
      tabooList: [],
      intrusionBudget: 2,
    });
    warnings.push('Created default world bible');
  }
  
  // Ensure arrays and objects
  if (!Array.isArray(data.chapters)) data.chapters = [];
  
  if (!data.currentChapter || typeof data.currentChapter !== 'object') {
    data.currentChapter = { number: 1, title: 'The Journey Continues', startedAt: now };
  }
  
  if (!Array.isArray(data.narrativeHistory)) {
    data.narrativeHistory = [];
    warnings.push('Narrative history was missing');
  }
  
  data.escalationTier = typeof data.escalationTier === 'number' ? data.escalationTier : 1;
  data.currentTick = typeof data.currentTick === 'number' ? data.currentTick : 0;
  data.scenario = typeof data.scenario === 'string' ? data.scenario : '';
  
  if (!Array.isArray(data.checkpoints)) data.checkpoints = [];
  
  data.currentMood = data.currentMood || 'neutral';
  if (!Array.isArray(data.moodHistory)) data.moodHistory = [];
  
  if (!data.settings || typeof data.settings !== 'object') {
    data.settings = { adultContent: false, cheatMode: false };
  }
  
  return data;
}

export function migrateCampaign(data: unknown): VersionMigrationResult {
  const warnings: string[] = [];
  
  if (!data || typeof data !== 'object') {
    const now = Date.now();
    return {
      campaign: {
        id: `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`,
        meta: {
          name: 'Recovered Campaign',
          primaryGenre: 'fantasy' as GameGenre,
          secondaryGenres: [],
          createdAt: now,
          updatedAt: now,
          playTime: 0,
          chapterCount: 1,
        },
        worldBible: createWorldBible({
          campaignName: 'Recovered Campaign',
          primaryGenre: 'fantasy',
          secondaryGenres: [],
          hardLock: false,
          tabooList: [],
          intrusionBudget: 2,
        }),
        player: getDefaultPlayer(),
        chapters: [],
        currentChapter: { number: 1, title: 'New Beginning', startedAt: now },
        narrativeHistory: [],
        escalationTier: 1,
        currentTick: 0,
        scenario: '',
        checkpoints: [],
        currentMood: 'neutral',
        moodHistory: [],
        settings: { adultContent: false, cheatMode: false },
      },
      migrated: true,
      fromVersion: 0,
      toVersion: CURRENT_CAMPAIGN_VERSION,
      warnings: ['Campaign data was null or invalid, created empty campaign'],
    };
  }
  
  let current = data as Record<string, unknown>;
  const fromVersion = detectVersion(data);
  let currentVersion = fromVersion;
  
  // Apply migrations sequentially
  while (currentVersion < CURRENT_CAMPAIGN_VERSION) {
    const migrationFn = versionMigrations[currentVersion];
    if (migrationFn) {
      current = migrationFn(current, warnings);
      currentVersion++;
    } else {
      warnings.push(`No migration path from version ${currentVersion}`);
      break;
    }
  }
  
  // Ensure all required fields exist
  const campaign = ensureRequiredFields(current, warnings);
  campaign.version = CURRENT_CAMPAIGN_VERSION;
  
  return {
    campaign: campaign as unknown as CampaignData,
    migrated: fromVersion !== CURRENT_CAMPAIGN_VERSION,
    fromVersion,
    toVersion: CURRENT_CAMPAIGN_VERSION,
    warnings,
  };
}

export function isCampaignValid(data: unknown): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, issues: ['Data is null or not an object'] };
  }
  
  const obj = data as Record<string, unknown>;
  if (!obj.id) issues.push('Missing campaign ID');
  if (!obj.meta) issues.push('Missing meta object');
  if (!obj.player) issues.push('Missing player object');
  
  return { valid: issues.length === 0, issues };
}

export function getMigrationStatus(): {
  needsMigration: boolean;
  hasOldData: boolean;
  hasCampaigns: boolean;
  oldDataSummary: { currentSession: boolean; savedGames: number };
} {
  const hasOldStory = !!localStorage.getItem(OLD_STORY_KEY);
  const hasOldCharacter = !!localStorage.getItem(OLD_CHARACTER_KEY);
  const hasOldSaves = !!localStorage.getItem(OLD_SAVES_KEY);
  const hasOldData = hasOldStory || hasOldCharacter || hasOldSaves;
  
  const existingCampaigns = loadCampaignIndex();
  const hasCampaigns = existingCampaigns.length > 0;
  
  return {
    needsMigration: hasOldData && !hasCampaigns,
    hasOldData,
    hasCampaigns,
    oldDataSummary: getMigrationPreview(),
  };
}
