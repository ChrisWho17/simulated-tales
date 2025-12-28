// ============================================================================
// CAMPAIGN STORAGE SYSTEM - localStorage operations
// ============================================================================

import {
  CampaignMetadata,
  CampaignData,
  CampaignCheckpoint,
  CAMPAIGN_STORAGE_PREFIX,
  CAMPAIGN_INDEX_KEY,
  ACTIVE_CAMPAIGN_KEY,
  MAX_CAMPAIGNS,
  MAX_CHECKPOINTS,
} from '@/types/campaign';
import { WorldBible } from '@/game/worldBible/types';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';
import { GameGenre } from '@/types/genreData';
import { migrateCampaign, CURRENT_CAMPAIGN_VERSION } from './campaignMigration';
import { createInitialWeatherState } from '@/game/weatherSystem';

// ============================================================================
// INDEX OPERATIONS
// ============================================================================

export function loadCampaignIndex(): CampaignMetadata[] {
  try {
    const saved = localStorage.getItem(CAMPAIGN_INDEX_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Campaign Storage] Failed to load index:', e);
  }
  return [];
}

export function saveCampaignIndex(campaigns: CampaignMetadata[]): void {
  try {
    localStorage.setItem(CAMPAIGN_INDEX_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error('[Campaign Storage] Failed to save index:', e);
  }
}

export function getActiveCampaignId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
  } catch {
    return null;
  }
}

export function setActiveCampaignId(campaignId: string | null): void {
  try {
    if (campaignId) {
      localStorage.setItem(ACTIVE_CAMPAIGN_KEY, campaignId);
    } else {
      localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    }
  } catch (e) {
    console.error('[Campaign Storage] Failed to set active campaign:', e);
  }
}

// ============================================================================
// CAMPAIGN CRUD
// ============================================================================

export function loadCampaign(campaignId: string): CampaignData | null {
  try {
    const key = `${CAMPAIGN_STORAGE_PREFIX}${campaignId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Run migration if needed
    const result = migrateCampaign(parsed);
    
    if (result.migrated) {
      console.log(`[Campaign Storage] Migrated campaign ${campaignId} from v${result.fromVersion} to v${result.toVersion}`);
      if (result.warnings.length > 0) {
        console.warn('[Campaign Storage] Migration warnings:', result.warnings);
      }
      // Save the migrated version
      localStorage.setItem(key, JSON.stringify(result.campaign));
    }
    
    return result.campaign;
  } catch (e) {
    console.error(`[Campaign Storage] Failed to load campaign ${campaignId}:`, e);
    return null;
  }
}

export function saveCampaign(campaign: CampaignData): void {
  try {
    const key = `${CAMPAIGN_STORAGE_PREFIX}${campaign.id}`;
    localStorage.setItem(key, JSON.stringify(campaign));
    
    // Update index
    const index = loadCampaignIndex();
    const existingIdx = index.findIndex(c => c.id === campaign.id);
    
    const metadata: CampaignMetadata = {
      id: campaign.id,
      name: campaign.meta.name,
      primaryGenre: campaign.meta.primaryGenre,
      secondaryGenres: campaign.meta.secondaryGenres,
      createdAt: campaign.meta.createdAt,
      updatedAt: Date.now(),
      playTime: campaign.meta.playTime,
      chapterCount: campaign.chapters.length + 1,
      characterName: campaign.player.name,
      characterLevel: campaign.player.level,
      isActive: getActiveCampaignId() === campaign.id,
    };
    
    if (existingIdx >= 0) {
      index[existingIdx] = metadata;
    } else {
      index.push(metadata);
    }
    
    saveCampaignIndex(index);
    console.log(`[Campaign Storage] Saved campaign: ${campaign.meta.name}`);
  } catch (e) {
    console.error(`[Campaign Storage] Failed to save campaign:`, e);
  }
}

export function deleteCampaignData(campaignId: string): void {
  try {
    const key = `${CAMPAIGN_STORAGE_PREFIX}${campaignId}`;
    localStorage.removeItem(key);
    
    // Update index
    const index = loadCampaignIndex();
    const filtered = index.filter(c => c.id !== campaignId);
    saveCampaignIndex(filtered);
    
    // Clear active if this was the active campaign
    if (getActiveCampaignId() === campaignId) {
      setActiveCampaignId(null);
    }
    
    console.log(`[Campaign Storage] Deleted campaign: ${campaignId}`);
  } catch (e) {
    console.error(`[Campaign Storage] Failed to delete campaign:`, e);
  }
}

// ============================================================================
// CAMPAIGN CREATION
// ============================================================================

export function createNewCampaign(
  worldBible: WorldBible,
  player: RPGCharacter,
  scenario: string
): CampaignData {
  const now = Date.now();
  const campaignId = `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`;
  
  const campaign: CampaignData = {
    id: campaignId,
    meta: {
      name: worldBible.campaignName,
      primaryGenre: worldBible.primaryGenre as GameGenre,
      secondaryGenres: worldBible.secondaryGenres.map(g => g.genreId as string),
      createdAt: now,
      updatedAt: now,
      playTime: 0,
      chapterCount: 1,
    },
    worldBible,
    player,
    chapters: [],
    currentChapter: {
      number: 1,
      title: 'The Beginning',
      startedAt: now,
    },
    narrativeHistory: [],
    escalationTier: 1,
    currentTick: 0,
    scenario,
    checkpoints: [],
    currentMood: 'neutral',
    moodHistory: [],
    weatherState: createInitialWeatherState(),
    settings: {
      adultContent: false,
      cheatMode: false,
    },
  };
  
  return campaign;
}

// ============================================================================
// CAMPAIGN DUPLICATION
// ============================================================================

export function duplicateCampaignData(
  campaignId: string,
  newName: string
): CampaignData | null {
  const original = loadCampaign(campaignId);
  if (!original) return null;
  
  // Check limit
  const index = loadCampaignIndex();
  if (index.length >= MAX_CAMPAIGNS) {
    console.warn('[Campaign Storage] Maximum campaigns reached');
    return null;
  }
  
  const now = Date.now();
  const newId = `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`;
  
  const duplicate: CampaignData = {
    ...original,
    id: newId,
    meta: {
      ...original.meta,
      name: newName,
      createdAt: now,
      updatedAt: now,
    },
    checkpoints: [], // Fresh checkpoints for the duplicate
  };
  
  return duplicate;
}

// ============================================================================
// CHECKPOINT OPERATIONS
// ============================================================================

export function createCheckpoint(
  campaign: CampaignData,
  label: string
): CampaignCheckpoint {
  const checkpoint: CampaignCheckpoint = {
    id: `checkpoint_${Date.now()}`,
    label,
    createdAt: Date.now(),
    player: { ...campaign.player },
    narrativeHistory: [...campaign.narrativeHistory], // Save full history
    escalationTier: campaign.escalationTier,
    currentTick: campaign.currentTick,
  };
  
  return checkpoint;
}

export function addCheckpointToCampaign(
  campaign: CampaignData,
  checkpoint: CampaignCheckpoint
): CampaignData {
  // Keep only the most recent checkpoints
  const checkpoints = [checkpoint, ...campaign.checkpoints].slice(0, MAX_CHECKPOINTS);
  
  return {
    ...campaign,
    checkpoints,
  };
}

export function restoreFromCheckpoint(
  campaign: CampaignData,
  checkpointId: string
): CampaignData | null {
  const checkpoint = campaign.checkpoints.find(c => c.id === checkpointId);
  if (!checkpoint) return null;
  
  // Create auto-checkpoint before restore
  const autoCheckpoint = createCheckpoint(campaign, `Auto-save before restore (${new Date().toLocaleTimeString()})`);
  
  return {
    ...campaign,
    player: { ...checkpoint.player },
    narrativeHistory: [...checkpoint.narrativeHistory],
    escalationTier: checkpoint.escalationTier,
    currentTick: checkpoint.currentTick,
    checkpoints: [autoCheckpoint, ...campaign.checkpoints].slice(0, MAX_CHECKPOINTS),
  };
}

// ============================================================================
// IMPORT/EXPORT
// ============================================================================

export function exportCampaignToJson(campaignId: string): string | null {
  const campaign = loadCampaign(campaignId);
  if (!campaign) return null;
  
  return JSON.stringify(campaign, null, 2);
}

export function importCampaignFromJson(jsonData: string): CampaignData | null {
  try {
    const parsed = JSON.parse(jsonData);
    
    // Run migration to ensure compatibility
    const result = migrateCampaign(parsed);
    const campaign = result.campaign;
    
    if (result.warnings.length > 0) {
      console.warn('[Campaign Storage] Import migration warnings:', result.warnings);
    }
    
    // Check limit
    const index = loadCampaignIndex();
    if (index.length >= MAX_CAMPAIGNS) {
      console.warn('[Campaign Storage] Maximum campaigns reached');
      return null;
    }
    
    // Assign new ID to avoid conflicts
    const now = Date.now();
    campaign.id = `campaign_${now}_${Math.random().toString(36).substr(2, 9)}`;
    campaign.meta.createdAt = now;
    campaign.meta.updatedAt = now;
    
    return campaign;
  } catch (e) {
    console.error('[Campaign Storage] Failed to import campaign:', e);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function canCreateCampaign(): boolean {
  const index = loadCampaignIndex();
  return index.length < MAX_CAMPAIGNS;
}

export function getCampaignCount(): number {
  return loadCampaignIndex().length;
}

export function formatPlayTime(seconds: number): string {
  if (seconds < 60) return 'Just started';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatLastPlayed(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
