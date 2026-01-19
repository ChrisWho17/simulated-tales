// ============================================================================
// CAMPAIGN STORAGE SYSTEM - localStorage operations with COMPLETE ISOLATION
// ============================================================================

import {
  CampaignMetadata,
  CampaignData,
  CampaignCheckpoint,
  CAMPAIGN_STORAGE_PREFIX,
  CAMPAIGN_INDEX_KEY,
  ACTIVE_CAMPAIGN_KEY,
  INVENTORY_STORAGE_PREFIX,
  GAME_STATE_STORAGE_PREFIX,
  MAX_CAMPAIGNS,
  MAX_CHECKPOINTS,
  getCampaignStorageKeys,
} from '@/types/campaign';
import { WorldBible } from '@/game/worldBible/types';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';
import { GameGenre } from '@/types/genreData';
import { migrateCampaign, CURRENT_CAMPAIGN_VERSION } from './campaignMigration';
import { normalizeCampaign, validateCampaign } from './saveSchemaManager';
import { createInitialWeatherState } from '@/game/weatherSystem';
import { createInitialTimeState } from '@/game/timeProgressionSystem';
import { seedWorldForGenre, hasGenreSeed } from '@/game/livingWorld';
import { getNPCRegistry, setNPCRegistry, NPCIdentityRegistry, clearNPCRegistry } from '@/game/npcIdentityRegistry';
import { 
  clearPersonalityAssignments, 
  exportPersonalityMap, 
  importPersonalityMap 
} from '@/game/npcPersonalityDialogue';
import { setNPCAutoRegistrationGenre } from '@/game/npcAutoRegistration';
import { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';
import { checkAndCleanupStorage, performCleanup } from '@/lib/storageCleanup';
import { STORAGE_KEYS } from '@/lib/storageKeys';

// ============================================================================
// INDEX OPERATIONS
// ============================================================================

export function loadCampaignIndex(): CampaignMetadata[] {
  try {
    const saved = localStorage.getItem(CAMPAIGN_INDEX_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we always return an array
      if (Array.isArray(parsed)) {
        return parsed;
      }
      console.warn('[Campaign Storage] Campaign index was not an array, resetting');
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
    const migrationResult = migrateCampaign(parsed);
    
    if (migrationResult.migrated) {
      console.log(`[Campaign Storage] Migrated campaign ${campaignId} from v${migrationResult.fromVersion} to v${migrationResult.toVersion}`);
      if (migrationResult.warnings.length > 0) {
        console.warn('[Campaign Storage] Migration warnings:', migrationResult.warnings);
      }
    }
    
    // CRITICAL: Normalize campaign to ensure all fields exist with valid defaults
    // This prevents crashes when new fields are added in updates
    const normResult = normalizeCampaign(migrationResult.campaign);
    
    if (normResult.wasModified) {
      console.log(`[Campaign Storage] Normalized campaign, backfilled: ${normResult.backfilledFields.join(', ')}`);
      // Save the normalized version
      localStorage.setItem(key, JSON.stringify(normResult.campaign));
    }
    
    const campaign = normResult.campaign;
    
    // CRITICAL: Clear NPC registry and personality assignments before loading new campaign
    // This ensures old NPC data from previous campaigns doesn't bleed into new ones
    const emptyRegistry: NPCIdentityRegistry = {
      npcs: {},
      relationships: {},
      families: {},
      lockedIds: [],
    };
    setNPCRegistry(emptyRegistry);
    clearPersonalityAssignments();
    
    // Set the genre for auto-registration
    if (campaign.meta?.primaryGenre) {
      setNPCAutoRegistrationGenre(campaign.meta.primaryGenre);
    }
    
    // Restore NPC registry state from campaign save if available
    if (campaign.npcRegistryState) {
      const savedRegistry: NPCIdentityRegistry = {
        npcs: campaign.npcRegistryState.npcs as any || {},
        relationships: campaign.npcRegistryState.relationships as any || {},
        families: campaign.npcRegistryState.families as any || {},
        lockedIds: campaign.npcRegistryState.lockedIds || [],
      };
      setNPCRegistry(savedRegistry);
      console.log(`[Campaign Storage] Restored NPC registry with ${Object.keys(savedRegistry.npcs).length} NPCs`);
    } else {
      console.log(`[Campaign Storage] No NPC registry in save, starting fresh`);
    }
    
    // Restore NPC personality assignments
    if (campaign.npcPersonalityMap) {
      importPersonalityMap(campaign.npcPersonalityMap as any);
    }
    
    // CRITICAL: Restore companion localStorage data from campaign save
    try {
      if (campaign.companionAppearances && Object.keys(campaign.companionAppearances).length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPANION_APPEARANCES, JSON.stringify(campaign.companionAppearances));
        console.log(`[Campaign Storage] Restored ${Object.keys(campaign.companionAppearances).length} companion appearances`);
      }
      
      if (campaign.companionIntroductions && Object.keys(campaign.companionIntroductions).length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPANION_INTRODUCTIONS, JSON.stringify(campaign.companionIntroductions));
        console.log(`[Campaign Storage] Restored companion introductions`);
      }
      
      if (campaign.pendingCompanionIntroductions && campaign.pendingCompanionIntroductions.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PENDING_COMPANION_INTRODUCTIONS, JSON.stringify(campaign.pendingCompanionIntroductions));
        console.log(`[Campaign Storage] Restored ${campaign.pendingCompanionIntroductions.length} pending companion introductions`);
      }
    } catch (e) {
      console.warn('[Campaign Storage] Failed to restore companion localStorage data:', e);
    }
    
    return campaign;
  } catch (e) {
    console.error(`[Campaign Storage] Failed to load campaign ${campaignId}:`, e);
    return null;
  }
}

export function saveCampaign(campaign: CampaignData, autoSyncToCloud: boolean = true): void {
  try {
    // CRITICAL: Check and cleanup storage before saving to prevent quota errors
    checkAndCleanupStorage();
    
    // Capture current NPC registry state for this campaign
    const npcRegistry = getNPCRegistry();
    const personalityMap = exportPersonalityMap();
    
    // Capture companion data from localStorage if present
    let companionAppearances: Record<string, unknown> = {};
    let companionIntroductions: Record<string, string> = {};
    let pendingCompanionIntroductions: unknown[] = [];
    
    try {
      const appearances = localStorage.getItem(STORAGE_KEYS.COMPANION_APPEARANCES);
      if (appearances) companionAppearances = JSON.parse(appearances);
      
      const introductions = localStorage.getItem(STORAGE_KEYS.COMPANION_INTRODUCTIONS);
      if (introductions) companionIntroductions = JSON.parse(introductions);
      
      const pending = localStorage.getItem(STORAGE_KEYS.PENDING_COMPANION_INTRODUCTIONS);
      if (pending) pendingCompanionIntroductions = JSON.parse(pending);
    } catch (e) {
      console.warn('[Campaign Storage] Failed to capture companion localStorage data:', e);
    }
    
    const campaignWithNPCs: CampaignData = {
      ...campaign,
      npcRegistryState: {
        npcs: npcRegistry.npcs,
        relationships: npcRegistry.relationships,
        families: npcRegistry.families,
        lockedIds: npcRegistry.lockedIds,
      },
      npcPersonalityMap: personalityMap,
      // Preserve existing companion state if already present, or add localStorage data
      companionAppearances: campaign.companionAppearances || companionAppearances,
      companionIntroductions: campaign.companionIntroductions || companionIntroductions,
      pendingCompanionIntroductions: campaign.pendingCompanionIntroductions || pendingCompanionIntroductions,
    };
    
    const key = `${CAMPAIGN_STORAGE_PREFIX}${campaign.id}`;
    
    try {
      localStorage.setItem(key, JSON.stringify(campaignWithNPCs));
    } catch (e: any) {
      // Handle quota exceeded with aggressive cleanup and retry
      if (e.name === 'QuotaExceededError') {
        console.warn('[Campaign Storage] Quota exceeded, performing aggressive cleanup...');
        performCleanup(0.4); // Very aggressive cleanup
        
        try {
          localStorage.setItem(key, JSON.stringify(campaignWithNPCs));
        } catch (retryError) {
          console.error('[Campaign Storage] Still cannot save after cleanup:', retryError);
          throw retryError;
        }
      } else {
        throw e;
      }
    }
    
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
    
    // Auto-sync to cloud if enabled (async, non-blocking)
    if (autoSyncToCloud) {
      import('@/services/cloudSyncService').then(({ CloudSyncService }) => {
        CloudSyncService.autoSyncCampaign(campaign.id);
      }).catch(err => {
        console.warn('[Campaign Storage] Cloud sync import failed:', err);
      });
    }
  } catch (e) {
    console.error(`[Campaign Storage] Failed to save campaign:`, e);
  }
}

export function deleteCampaignData(campaignId: string): void {
  if (!campaignId) {
    console.error('[Campaign Storage] Cannot delete: no campaign ID provided');
    return;
  }
  
  try {
    console.log(`[Campaign Storage] FULL DELETE starting for: ${campaignId}`);
    
    // 1. Remove all known campaign-specific keys
    const keysToRemove = getCampaignStorageKeys(campaignId);
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[Campaign Storage] Removed: ${key}`);
    });
    
    // 2. Scan for ANY other keys containing this campaign ID (safety net)
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes(campaignId)) {
        localStorage.removeItem(key);
        console.log(`[Campaign Storage] Removed orphaned key: ${key}`);
      }
    });
    
    // 3. Update campaign index
    const index = loadCampaignIndex();
    const filtered = index.filter(c => c.id !== campaignId);
    saveCampaignIndex(filtered);
    
    // 4. Clear active campaign if this was active
    if (getActiveCampaignId() === campaignId) {
      setActiveCampaignId(null);
    }
    
    // 5. Also check for legacy key formats (migration support)
    const legacyKeys = [
      `simtales_campaign_${campaignId}`,
      `game_inventory_state`, // Old shared inventory key
      `inventory_${campaignId}`,
    ];
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`[Campaign Storage] Removed legacy key: ${key}`);
      }
    });
    
    console.log(`[Campaign Storage] FULL DELETE complete for: ${campaignId}`);
  } catch (e) {
    console.error(`[Campaign Storage] Failed to delete campaign:`, e);
  }
}

// Rename a campaign
export function renameCampaign(campaignId: string, newName: string): boolean {
  if (!campaignId || !newName.trim()) {
    console.error('[Campaign Storage] Cannot rename: invalid parameters');
    return false;
  }
  
  try {
    // Load the full campaign data
    const campaign = loadCampaign(campaignId);
    if (!campaign) {
      console.error('[Campaign Storage] Cannot rename: campaign not found');
      return false;
    }
    
    // Update campaign name
    campaign.meta.name = newName.trim();
    
    // Save the updated campaign
    saveCampaign(campaign, true);
    
    console.log(`[Campaign Storage] Renamed campaign ${campaignId} to: ${newName}`);
    return true;
  } catch (e) {
    console.error('[Campaign Storage] Failed to rename campaign:', e);
    return false;
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
  const genre = worldBible.primaryGenre as GameGenre;
  
  // Auto-seed living world based on genre
  let livingWorldState: CampaignData['livingWorldState'] = undefined;
  if (hasGenreSeed(genre)) {
    console.log(`[Campaign Storage] Auto-seeding living world for genre: ${genre}`);
    const seeded = seedWorldForGenre(genre);
    
    // Convert to serializable format for persistence
    livingWorldState = {
      properties: seeded.properties.map(p => [p.id, p]),
      playerProperties: [],
      rivals: seeded.rivals.map(r => [r.id, r]),
      playerRivalries: [],
      factions: seeded.factions.map(f => [f.id, f]),
      playerStanding: [],
      lastTick: 0,
    };
    console.log(`[Campaign Storage] Seeded ${seeded.properties.length} properties, ${seeded.rivals.length} rivals, ${seeded.factions.length} factions`);
  }
  
  const campaign: CampaignData = {
    id: campaignId,
    meta: {
      name: worldBible.campaignName,
      primaryGenre: genre,
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
    timeState: createInitialTimeState(),
    livingWorldState,
    settings: {
      adultContent: false,
      cheatMode: false,
      directorSettings: { ...DEFAULT_DIRECTOR_SETTINGS },
      timeMultiplier: 'fifteen_minutes',
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

// ============================================================================
// CAMPAIGN-SCOPED INVENTORY STORAGE
// ============================================================================

export function saveInventoryForCampaign(campaignId: string, inventoryState: unknown): boolean {
  if (!campaignId) {
    console.error('[Campaign Storage] Cannot save inventory: no campaign ID');
    return false;
  }
  
  try {
    const key = `${INVENTORY_STORAGE_PREFIX}${campaignId}`;
    localStorage.setItem(key, JSON.stringify(inventoryState));
    console.log(`[Campaign Storage] Saved inventory for campaign: ${campaignId}`);
    return true;
  } catch (e: any) {
    // Handle quota exceeded by cleaning up and retrying
    if (e.name === 'QuotaExceededError') {
      console.warn('[Campaign Storage] Quota exceeded for inventory, attempting cleanup...');
      performCleanup(0.3); // Aggressive cleanup
      
      try {
        const key = `${INVENTORY_STORAGE_PREFIX}${campaignId}`;
        localStorage.setItem(key, JSON.stringify(inventoryState));
        console.log(`[Campaign Storage] Saved inventory after cleanup for campaign: ${campaignId}`);
        return true;
      } catch (retryError) {
        console.error('[Campaign Storage] Still failed after cleanup:', retryError);
        return false;
      }
    }
    console.error('[Campaign Storage] Failed to save inventory:', e);
    return false;
  }
}

export function loadInventoryForCampaign(campaignId: string): unknown | null {
  if (!campaignId) {
    console.warn('[Campaign Storage] Cannot load inventory: no campaign ID');
    return null;
  }
  
  try {
    const key = `${INVENTORY_STORAGE_PREFIX}${campaignId}`;
    const saved = localStorage.getItem(key);
    if (!saved) {
      console.log(`[Campaign Storage] No saved inventory for campaign: ${campaignId}`);
      return null;
    }
    
    const parsed = JSON.parse(saved);
    console.log(`[Campaign Storage] Loaded inventory for campaign: ${campaignId} (${parsed.items?.length || 0} items)`);
    return parsed;
  } catch (e) {
    console.error('[Campaign Storage] Failed to load inventory:', e);
    return null;
  }
}

export function clearInventoryForCampaign(campaignId: string): void {
  if (!campaignId) return;
  
  const key = `${INVENTORY_STORAGE_PREFIX}${campaignId}`;
  localStorage.removeItem(key);
  console.log(`[Campaign Storage] Cleared inventory for campaign: ${campaignId}`);
}

// ============================================================================
// STORAGE INTEGRITY & CLEANUP
// ============================================================================

/**
 * Nuclear wipe - removes ALL game data from localStorage
 * Use with extreme caution - this is irreversible
 */
export function nuclearWipe(confirmationCode: string): { success: boolean; deletedCount?: number; error?: string } {
  // Safety check
  if (confirmationCode !== 'CONFIRM_WIPE') {
    return { success: false, error: 'Confirmation required: pass "CONFIRM_WIPE"' };
  }
  
  console.log('[NUCLEAR] Starting complete data wipe...');
  
  // Find all game-related keys
  const keysToDelete: string[] = [];
  const prefixes = ['lwe_', 'simtales_', 'untold-'];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && prefixes.some(prefix => key.startsWith(prefix))) {
      keysToDelete.push(key);
    }
  }
  
  // Delete them all
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[NUCLEAR] Removed: ${key}`);
  });
  
  // Reinitialize clean state
  localStorage.setItem(CAMPAIGN_INDEX_KEY, JSON.stringify([]));
  
  console.log(`[NUCLEAR] Deleted ${keysToDelete.length} keys, storage reinitialized`);
  
  return { success: true, deletedCount: keysToDelete.length };
}

/**
 * Perform startup cleanup to fix orphaned data and integrity issues
 * Should be called once when the app initializes
 */
export function performStartupCleanup(): { cleaned: number; issues: string[] } {
  console.log('[STARTUP] Running storage integrity check...');
  const issues: string[] = [];
  let cleaned = 0;
  
  // Get campaign index
  const index = loadCampaignIndex();
  const indexIds = new Set(index.map(c => c.id));
  
  // Step 1: Check each campaign in index actually exists
  const validCampaigns: CampaignMetadata[] = [];
  for (const campaign of index) {
    const key = `${CAMPAIGN_STORAGE_PREFIX}${campaign.id}`;
    const exists = localStorage.getItem(key);
    if (!exists) {
      issues.push(`Removed orphaned index entry: ${campaign.id}`);
      cleaned++;
    } else {
      validCampaigns.push(campaign);
    }
  }
  
  // Update index if changed
  if (validCampaigns.length !== index.length) {
    saveCampaignIndex(validCampaigns);
  }
  
  // Step 2: Find orphaned campaign data (has data but not in index)
  const allKeys = Object.keys(localStorage);
  const campaignDataKeys = allKeys.filter(k => k.startsWith(CAMPAIGN_STORAGE_PREFIX));
  
  for (const key of campaignDataKeys) {
    const id = key.replace(CAMPAIGN_STORAGE_PREFIX, '');
    if (!indexIds.has(id)) {
      // This campaign data exists but isn't in the index - orphaned
      console.log(`[CLEANUP] Found orphaned campaign data: ${key}`);
      localStorage.removeItem(key);
      
      // Also remove related data
      localStorage.removeItem(`${INVENTORY_STORAGE_PREFIX}${id}`);
      localStorage.removeItem(`${GAME_STATE_STORAGE_PREFIX}${id}`);
      
      issues.push(`Removed orphaned campaign data: ${id}`);
      cleaned++;
    }
  }
  
  // Step 3: Find orphaned inventory data
  const inventoryKeys = allKeys.filter(k => k.startsWith(INVENTORY_STORAGE_PREFIX));
  for (const key of inventoryKeys) {
    const id = key.replace(INVENTORY_STORAGE_PREFIX, '');
    if (!indexIds.has(id)) {
      console.log(`[CLEANUP] Removing orphaned inventory: ${key}`);
      localStorage.removeItem(key);
      issues.push(`Removed orphaned inventory: ${id}`);
      cleaned++;
    }
  }
  
  // Step 4: Find orphaned game state data
  const gameStateKeys = allKeys.filter(k => k.startsWith(GAME_STATE_STORAGE_PREFIX));
  for (const key of gameStateKeys) {
    const id = key.replace(GAME_STATE_STORAGE_PREFIX, '');
    if (!indexIds.has(id)) {
      console.log(`[CLEANUP] Removing orphaned game state: ${key}`);
      localStorage.removeItem(key);
      issues.push(`Removed orphaned game state: ${id}`);
      cleaned++;
    }
  }
  
  // Step 5: Verify active campaign still exists
  const activeId = getActiveCampaignId();
  if (activeId && !indexIds.has(activeId)) {
    console.log(`[CLEANUP] Active campaign ${activeId} no longer exists, clearing`);
    setActiveCampaignId(null);
    issues.push(`Cleared invalid active campaign reference`);
    cleaned++;
  }
  
  console.log(`[STARTUP] Cleanup complete. Cleaned ${cleaned} items.`);
  if (issues.length > 0) {
    console.log('[STARTUP] Issues fixed:', issues);
  }
  
  return { cleaned, issues };
}

/**
 * Verify a campaign has been completely deleted
 * Returns true if no traces remain
 */
export function verifyCampaignDeleted(campaignId: string): boolean {
  const allKeys = Object.keys(localStorage);
  const remainingKeys = allKeys.filter(k => k.includes(campaignId));
  
  if (remainingKeys.length > 0) {
    console.error(`[VERIFY] Campaign ${campaignId} still has ${remainingKeys.length} keys:`, remainingKeys);
    return false;
  }
  
  // Also check index
  const index = loadCampaignIndex();
  if (index.some(c => c.id === campaignId)) {
    console.error(`[VERIFY] Campaign ${campaignId} still in index`);
    return false;
  }
  
  console.log(`[VERIFY] Campaign ${campaignId} completely removed`);
  return true;
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): { 
  totalKeys: number; 
  gameKeys: number; 
  totalBytes: number;
  campaigns: { id: string; name: string; bytes: number }[];
} {
  const allKeys = Object.keys(localStorage);
  const prefixes = ['lwe_', 'simtales_', 'untold-'];
  const gameKeys = allKeys.filter(k => prefixes.some(p => k.startsWith(p)));
  
  let totalBytes = 0;
  gameKeys.forEach(k => {
    totalBytes += (localStorage.getItem(k)?.length || 0) * 2; // UTF-16 = 2 bytes per char
  });
  
  const index = loadCampaignIndex();
  const campaigns = index.map(c => {
    const key = `${CAMPAIGN_STORAGE_PREFIX}${c.id}`;
    const bytes = (localStorage.getItem(key)?.length || 0) * 2;
    return { id: c.id, name: c.name, bytes };
  });
  
  return {
    totalKeys: allKeys.length,
    gameKeys: gameKeys.length,
    totalBytes,
    campaigns,
  };
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

export function debugCampaignStorage(): void {
  const allKeys = Object.keys(localStorage).filter(k => 
    k.startsWith('lwe_') || k.startsWith('simtales_') || k.startsWith('untold-')
  );
  
  console.log('=== Campaign Storage Debug ===');
  console.log('Active campaign:', getActiveCampaignId());
  console.log('Campaign index:', loadCampaignIndex().map(c => ({ id: c.id, name: c.name })));
  console.log('Storage keys:');
  allKeys.forEach(k => {
    const size = localStorage.getItem(k)?.length || 0;
    console.log(`  ${k}: ${size} bytes`);
  });
  console.log('Stats:', getStorageStats());
  console.log('==============================');
}

// Expose debug functions globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugCampaignStorage = debugCampaignStorage;
  (window as any).nuclearWipe = nuclearWipe;
  (window as any).performStartupCleanup = performStartupCleanup;
  (window as any).getStorageStats = getStorageStats;
}
