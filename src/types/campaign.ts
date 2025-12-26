// ============================================================================
// MULTI-CAMPAIGN SAVE SYSTEM - Type Definitions
// Isolated campaign slots with full data separation
// ============================================================================

import { RPGCharacter } from './rpgCharacter';
import { WorldBible } from '@/game/worldBible/types';
import { GameGenre } from './genreData';
import { StoryEntry } from '@/components/adventure/types';
import { CampaignMemoryStore } from './campaignMemory';

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
  
  // Settings specific to this campaign
  settings?: {
    adultContent?: boolean;
    cheatMode?: boolean;
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
  createCampaign: (worldBible: WorldBible, player: RPGCharacter, scenario: string) => CampaignData;
  loadCampaign: (campaignId: string) => boolean;
  unloadCampaign: () => void;
  deleteCampaign: (campaignId: string) => void;
  duplicateCampaign: (campaignId: string, newName: string) => CampaignData | null;
  
  // Campaign updates
  updateCampaign: (updates: Partial<CampaignData>) => void;
  updatePlayer: (player: RPGCharacter) => void;
  addNarrativeEntry: (entry: StoryEntry) => void;
  advanceChapter: (title?: string) => void;
  
  // Checkpoints
  createCheckpoint: (label: string) => CampaignCheckpoint | null;
  restoreCheckpoint: (checkpointId: string) => boolean;
  deleteCheckpoint: (checkpointId: string) => void;
  
  // Import/Export
  exportCampaign: (campaignId: string) => string | null;
  importCampaign: (jsonData: string) => CampaignData | null;
  
  // Auto-save
  isDirty: boolean;
  lastSaved: number | null;
  saveNow: () => void;
  
  // Isolation guard
  verifyAccess: (campaignId: string) => void;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const CAMPAIGN_STORAGE_PREFIX = 'simtales_campaign_';
export const CAMPAIGN_INDEX_KEY = 'simtales_campaign_index';
export const ACTIVE_CAMPAIGN_KEY = 'simtales_active_campaign';
export const MAX_CAMPAIGNS = 20;
export const MAX_CHECKPOINTS = 5;
export const AUTO_SAVE_INTERVAL = 60000; // 60 seconds
