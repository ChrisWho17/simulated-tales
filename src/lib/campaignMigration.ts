// ============================================================================
// CAMPAIGN MIGRATION UTILITY
// Converts existing localStorage saves to the new multi-campaign format
// ============================================================================

import { CampaignData, CampaignMetadata } from '@/types/campaign';
import { loadCampaignIndex, saveCampaign, canCreateCampaign } from '@/lib/campaignStorage';
import { GameSave, loadAllSaves, deleteSave } from '@/lib/saveSystem';
import { deserializeCampaignMemory } from '@/game/campaignMemorySystem';
import { deserializeWorldBible, createWorldBible } from '@/game/worldBible';
import { GameGenre } from '@/types/genreData';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';

// Old localStorage keys
const OLD_STORY_KEY = 'untold-adventure-story';
const OLD_CHARACTER_KEY = 'untold-adventure-character';
const OLD_SCENARIO_KEY = 'untold-adventure-scenario';
const OLD_GENRE_KEY = 'untold-adventure-genre';
const OLD_WORLD_BIBLE_KEY = 'untold-world-bible';
const OLD_CAMPAIGN_MEMORY_KEY = 'untold-campaign-memory';
const OLD_MOOD_KEY = 'untold-player-mood';
const OLD_SAVES_KEY = 'untold-game-saves';

// Migration status
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  campaigns: CampaignMetadata[];
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
