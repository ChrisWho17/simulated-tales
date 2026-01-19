// ============================================================================
// MULTI-CAMPAIGN SAVE SYSTEM - Type Definitions
// Isolated campaign slots with full data separation
// ============================================================================

import { RPGCharacter } from './rpgCharacter';
import { WorldBible } from '@/game/worldBible/types';
import { GameGenre } from './genreData';
import { StoryEntry } from '@/components/adventure/types';
import { CampaignMemoryStore } from './campaignMemory';
import { WeatherState } from '@/game/weatherSystem';
import { DirectorSettings } from '@/game/directorModeSystem';
import { GameTimeState, TimeMultiplier } from '@/game/timeProgressionSystem';

// ============================================================================
// CAMPAIGN METADATA (for index)
// ============================================================================

export interface CampaignMetadata {
  id: string;
  name: string;
  primaryGenre: GameGenre;
  secondaryGenres: string[];
  createdAt: number;
  updatedAt: number;
  playTime: number; // seconds
  chapterCount: number;
  characterName: string;
  characterLevel: number;
  isActive: boolean;
}

// ============================================================================
// CHECKPOINT - Manual save points
// ============================================================================

export interface CampaignCheckpoint {
  id: string;
  label: string;
  createdAt: number;
  player: RPGCharacter;
  narrativeHistory: StoryEntry[]; // Last 10 entries
  escalationTier: number;
  currentTick: number;
}

// ============================================================================
// FULL CAMPAIGN DATA
// ============================================================================

export interface CampaignData {
  id: string;
  
  // Metadata
  meta: {
    name: string;
    primaryGenre: GameGenre;
    secondaryGenres: string[];
    createdAt: number;
    updatedAt: number;
    playTime: number;
    chapterCount: number;
  };
  
  // World Bible (Genre Contract)
  worldBible: WorldBible;
  
  // Player state
  player: RPGCharacter;
  
  // Story progression
  chapters: {
    number: number;
    title: string;
    startedAt: number;
    completedAt?: number;
  }[];
  currentChapter: {
    number: number;
    title: string;
    startedAt: number;
  };
  
  // Narrative history
  narrativeHistory: StoryEntry[];
  
  // Game state
  escalationTier: number;
  currentTick: number;
  
  // Scenario info
  scenario: string;
  
  // Checkpoints (max 5)
  checkpoints: CampaignCheckpoint[];
  
  // Campaign memory (optional - for full memory system)
  campaignMemory?: CampaignMemoryStore;
  
  // Mood state
  currentMood?: string;
  moodHistory?: Array<{ mood: string; timestamp: number; chapter: number; trigger: string }>;
  
  // Weather state (persisted for continuity)
  weatherState?: WeatherState;
  
  // Living World state (properties, rivals, factions)
  livingWorldState?: {
    properties: Array<[string, unknown]>;
    playerProperties: string[];
    rivals: Array<[string, unknown]>;
    playerRivalries: Array<[string, unknown]>;
    factions: Array<[string, unknown]>;
    playerStanding: Array<[string, unknown]>;
    lastTick: number;
  };
  
  // NPC Registry state - permanent NPC identities for this campaign
  npcRegistryState?: {
    npcs: Record<string, unknown>;
    relationships: Record<string, unknown>;
    families: Record<string, unknown>;
    lockedIds: string[];
  };
  
  // NPC Personality assignments - personality templates for NPCs
  npcPersonalityMap?: Record<string, unknown>;
  
  // Time progression state
  timeState?: GameTimeState;
  
  // Companion state - custom companions and their data
  companionState?: {
    companions: unknown[];
    activeIds: string[];
  };
  
  // Companion appearances - visual data for portrait generation
  companionAppearances?: Record<string, unknown>;
  
  // Companion introductions - story intro text for companions
  companionIntroductions?: Record<string, string>;
  
  // Pending companion introductions - companions waiting to be introduced
  pendingCompanionIntroductions?: unknown[];
  
  // Settings specific to this campaign
  settings?: {
    adultContent?: boolean;
    cheatMode?: boolean;
    directorSettings?: DirectorSettings;
    timeMultiplier?: TimeMultiplier;
  };
}

// ============================================================================
// ISOLATION GUARD - Prevents cross-campaign data access
// ============================================================================

export class CampaignIsolationGuard {
  private activeCampaignId: string;
  
  constructor(campaignId: string) {
    this.activeCampaignId = campaignId;
  }
  
  verify(requestedCampaignId: string): void {
    if (requestedCampaignId !== this.activeCampaignId) {
      throw new CampaignIsolationError(
        `Cross-campaign access attempted. Active: ${this.activeCampaignId}, Requested: ${requestedCampaignId}`
      );
    }
  }
  
  getActiveCampaignId(): string {
    return this.activeCampaignId;
  }
}

export class CampaignIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CampaignIsolationError';
  }
}

// ============================================================================
// CAMPAIGN CONTEXT TYPE
// ============================================================================

export interface CampaignContextType {
  // Campaign list
  campaigns: CampaignMetadata[];
  
  // Active campaign
  activeCampaign: CampaignData | null;
  activeCampaignId: string | null;
  
  // Campaign management
  createCampaign: (worldBible: WorldBible, player: RPGCharacter, scenario: string) => Promise<CampaignData>;
  loadCampaign: (campaignId: string) => Promise<boolean>;
  unloadCampaign: () => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  duplicateCampaign: (campaignId: string, newName: string) => Promise<CampaignData | null>;
  
  // Campaign updates
  updateCampaign: (updates: Partial<CampaignData>) => void;
  updatePlayer: (player: RPGCharacter) => void;
  addNarrativeEntry: (entry: StoryEntry) => void;
  syncNarrativeHistory: (entries: StoryEntry[]) => void;
  advanceChapter: (title?: string) => void;
  
  // Checkpoints
  createCheckpoint: (label: string) => CampaignCheckpoint | null;
  restoreCheckpoint: (checkpointId: string) => boolean;
  deleteCheckpoint: (checkpointId: string) => void;
  
  // Import/Export
  exportCampaign: (campaignId: string) => string | null;
  importCampaign: (jsonData: string) => Promise<CampaignData | null>;
  
  // Auto-save
  isDirty: boolean;
  lastSaved: number | null;
  saveNow: () => Promise<void>;
  
  // Isolation guard
  verifyAccess: (campaignId: string) => void;
}

// ============================================================================
// STORAGE KEYS - Complete isolation per campaign
// ============================================================================

export const CAMPAIGN_STORAGE_PREFIX = 'lwe_campaign_';
export const CAMPAIGN_INDEX_KEY = 'lwe_campaign_index';
export const ACTIVE_CAMPAIGN_KEY = 'lwe_active_campaign_id';
export const INVENTORY_STORAGE_PREFIX = 'lwe_inventory_';
export const GAME_STATE_STORAGE_PREFIX = 'lwe_gamestate_';
export const MAX_CAMPAIGNS = 20;
export const MAX_CHECKPOINTS = 5;
export const AUTO_SAVE_INTERVAL = 60000; // 60 seconds

// Get all storage keys for a campaign
export function getCampaignStorageKeys(campaignId: string): string[] {
  return [
    `${CAMPAIGN_STORAGE_PREFIX}${campaignId}`,
    `${INVENTORY_STORAGE_PREFIX}${campaignId}`,
    `${GAME_STATE_STORAGE_PREFIX}${campaignId}`,
  ];
}
