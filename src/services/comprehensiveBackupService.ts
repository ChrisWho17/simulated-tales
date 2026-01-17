// ============================================================================
// COMPREHENSIVE BACKUP SERVICE - Zero data loss backup before save system overhaul
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { CampaignData, CampaignMetadata, CAMPAIGN_STORAGE_PREFIX, CAMPAIGN_INDEX_KEY } from '@/types/campaign';
import { loadCampaign, loadCampaignIndex } from '@/lib/campaignStorage';
import { loadLifetimeStats, LifetimeStatistics } from '@/lib/lifetimeStats';
import { loadLifetimeAchievementState } from '@/lib/lifetimeAchievements';
import { SAVES_KEY, loadAllSaves, GameSave } from '@/lib/saveSystem';
import LZString from 'lz-string';

// ============================================================================
// TYPES
// ============================================================================

export interface BackupManifest {
  version: number;
  formatVersion: string;
  createdAt: number;
  createdAtISO: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
  };
  checksums: {
    manifest: string;
    campaigns: Record<string, string>;
    overall: string;
  };
  summary: {
    totalCampaigns: number;
    cloudCampaigns: number;
    localCampaigns: number;
    legacySaves: number;
    totalPlayTimeSeconds: number;
    oldestCampaign: number | null;
    newestCampaign: number | null;
  };
}

export interface ComprehensiveBackup {
  manifest: BackupManifest;
  
  // Primary campaign data
  campaigns: {
    local: CampaignData[];
    cloud: CampaignData[];
    merged: CampaignData[]; // Deduplicated union of local + cloud
  };
  
  // Campaign indices
  indices: {
    localIndex: CampaignMetadata[];
    cloudIndex: CloudCampaignMetadata[];
    guestIndex: CampaignMetadata[];
  };
  
  // Legacy save system data
  legacySaves: GameSave[];
  
  // Player progression
  progression: {
    lifetimeStats: LifetimeStatistics | null;
    lifetimeAchievements: { unlockedIds: string[]; lastChecked: number } | null;
  };
  
  // All settings
  settings: Record<string, unknown>;
  
  // Raw localStorage snapshot for recovery
  localStorageSnapshot: Record<string, string>;
}

export interface CloudCampaignMetadata {
  id: string;
  campaignId: string;
  campaignName: string;
  characterName: string;
  characterLevel: number;
  primaryGenre: string;
  playTime: number;
  chapterCount: number;
  updatedAt: string;
  version: number;
}

export interface BackupProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

export interface BackupResult {
  success: boolean;
  backup: ComprehensiveBackup | null;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CHECKSUM GENERATION (SHA-256)
// ============================================================================

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function quickHash(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// DATA GATHERING
// ============================================================================

async function gatherLocalCampaigns(
  onProgress?: (progress: BackupProgress) => void
): Promise<{ campaigns: CampaignData[]; index: CampaignMetadata[]; errors: string[] }> {
  const errors: string[] = [];
  const campaigns: CampaignData[] = [];
  
  try {
    const index = loadCampaignIndex();
    onProgress?.({ phase: 'local', current: 0, total: index.length, message: 'Loading local campaigns...' });
    
    for (let i = 0; i < index.length; i++) {
      const meta = index[i];
      onProgress?.({ phase: 'local', current: i + 1, total: index.length, message: `Loading ${meta.name}...` });
      
      try {
        const campaign = loadCampaign(meta.id);
        if (campaign) {
          campaigns.push(campaign);
        } else {
          errors.push(`Failed to load local campaign: ${meta.name} (${meta.id})`);
        }
      } catch (e) {
        errors.push(`Error loading ${meta.name}: ${e}`);
      }
    }
    
    return { campaigns, index, errors };
  } catch (e) {
    errors.push(`Failed to load local campaign index: ${e}`);
    return { campaigns, index: [], errors };
  }
}

async function gatherCloudCampaigns(
  onProgress?: (progress: BackupProgress) => void
): Promise<{ campaigns: CampaignData[]; index: CloudCampaignMetadata[]; errors: string[] }> {
  const errors: string[] = [];
  const campaigns: CampaignData[] = [];
  const index: CloudCampaignMetadata[] = [];
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { campaigns, index, errors: ['Not authenticated - cloud campaigns skipped'] };
    }
    
    onProgress?.({ phase: 'cloud', current: 0, total: 1, message: 'Fetching cloud campaigns...' });
    
    const { data, error } = await supabase
      .from('cloud_saves')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (error) {
      errors.push(`Cloud fetch error: ${error.message}`);
      return { campaigns, index, errors };
    }
    
    if (!data || data.length === 0) {
      return { campaigns, index, errors };
    }
    
    onProgress?.({ phase: 'cloud', current: 0, total: data.length, message: 'Loading cloud campaigns...' });
    
    for (let i = 0; i < data.length; i++) {
      const save = data[i];
      onProgress?.({ phase: 'cloud', current: i + 1, total: data.length, message: `Loading ${save.campaign_name}...` });
      
      try {
        index.push({
          id: save.id,
          campaignId: save.campaign_id,
          campaignName: save.campaign_name,
          characterName: save.character_name,
          characterLevel: save.character_level,
          primaryGenre: save.primary_genre,
          playTime: save.play_time,
          chapterCount: save.chapter_count,
          updatedAt: save.updated_at,
          version: save.version,
        });
        
        const saveData = save.save_data as { compressed?: string };
        if (saveData?.compressed) {
          const decompressed = LZString.decompressFromUTF16(saveData.compressed);
          if (decompressed) {
            const campaign = JSON.parse(decompressed) as CampaignData;
            campaigns.push(campaign);
          } else {
            errors.push(`Failed to decompress cloud campaign: ${save.campaign_name}`);
          }
        }
      } catch (e) {
        errors.push(`Error processing cloud campaign ${save.campaign_name}: ${e}`);
      }
    }
    
    return { campaigns, index, errors };
  } catch (e) {
    errors.push(`Cloud gathering failed: ${e}`);
    return { campaigns, index, errors };
  }
}

async function gatherGuestCampaigns(): Promise<{ campaigns: CampaignData[]; index: CampaignMetadata[]; errors: string[] }> {
  const errors: string[] = [];
  const campaigns: CampaignData[] = [];
  
  try {
    const indexStr = localStorage.getItem('guest_local_campaigns');
    if (!indexStr) {
      return { campaigns, index: [], errors };
    }
    
    const index = JSON.parse(indexStr) as CampaignMetadata[];
    
    for (const meta of index) {
      try {
        const key = `guest_local_${meta.id}`;
        const compressed = localStorage.getItem(key);
        if (compressed) {
          const decompressed = LZString.decompressFromUTF16(compressed);
          if (decompressed) {
            campaigns.push(JSON.parse(decompressed));
          }
        }
      } catch (e) {
        errors.push(`Failed to load guest campaign ${meta.name}: ${e}`);
      }
    }
    
    return { campaigns, index, errors };
  } catch (e) {
    errors.push(`Guest campaign gathering failed: ${e}`);
    return { campaigns, index: [], errors };
  }
}

function gatherSettings(): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const settingsKeys = [
    'game_settings',
    'narrator_settings', 
    'audio_settings',
    'onboarding_completed',
    'lwe_active_campaign',
    'theme',
    'director_settings',
    'accessibility_settings',
  ];
  
  for (const key of settingsKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        settings[key] = JSON.parse(value);
      } catch {
        settings[key] = value;
      }
    }
  }
  
  return settings;
}

function gatherLocalStorageSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  
  // Capture all game-related keys
  const gameKeyPrefixes = [
    'campaign_',
    'guest_local_',
    'lwe_',
    'untold',
    'game_',
    'lifetime_',
    'achievement',
    'narrator',
    'audio',
    'director',
    'inventory_',
  ];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const isGameKey = gameKeyPrefixes.some(prefix => key.includes(prefix) || key.startsWith(prefix));
      if (isGameKey) {
        const value = localStorage.getItem(key);
        if (value) {
          snapshot[key] = value;
        }
      }
    }
  }
  
  return snapshot;
}

function mergeCampaigns(
  local: CampaignData[],
  cloud: CampaignData[],
  guest: CampaignData[]
): CampaignData[] {
  const campaignMap = new Map<string, CampaignData>();
  
  // Add all campaigns, preferring newer versions
  const allCampaigns = [...local, ...cloud, ...guest];
  
  for (const campaign of allCampaigns) {
    const existing = campaignMap.get(campaign.id);
    if (!existing || campaign.meta.updatedAt > existing.meta.updatedAt) {
      campaignMap.set(campaign.id, campaign);
    }
  }
  
  return Array.from(campaignMap.values());
}

// ============================================================================
// MAIN BACKUP FUNCTION
// ============================================================================

export async function createComprehensiveBackup(
  onProgress?: (progress: BackupProgress) => void
): Promise<BackupResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    onProgress?.({ phase: 'init', current: 0, total: 6, message: 'Initializing backup...' });
    
    // Phase 1: Gather local campaigns
    onProgress?.({ phase: 'local', current: 1, total: 6, message: 'Gathering local campaigns...' });
    const localResult = await gatherLocalCampaigns(onProgress);
    errors.push(...localResult.errors.map(e => `[Local] ${e}`));
    
    // Phase 2: Gather cloud campaigns
    onProgress?.({ phase: 'cloud', current: 2, total: 6, message: 'Gathering cloud campaigns...' });
    const cloudResult = await gatherCloudCampaigns(onProgress);
    if (cloudResult.errors.some(e => e.includes('Not authenticated'))) {
      warnings.push(...cloudResult.errors);
    } else {
      errors.push(...cloudResult.errors.map(e => `[Cloud] ${e}`));
    }
    
    // Phase 3: Gather guest campaigns
    onProgress?.({ phase: 'guest', current: 3, total: 6, message: 'Gathering guest campaigns...' });
    const guestResult = await gatherGuestCampaigns();
    errors.push(...guestResult.errors.map(e => `[Guest] ${e}`));
    
    // Phase 4: Gather legacy saves
    onProgress?.({ phase: 'legacy', current: 4, total: 6, message: 'Gathering legacy saves...' });
    const legacySaves = loadAllSaves();
    
    // Phase 5: Gather progression and settings
    onProgress?.({ phase: 'settings', current: 5, total: 6, message: 'Gathering settings...' });
    const lifetimeStats = loadLifetimeStats();
    const lifetimeAchievements = loadLifetimeAchievementState();
    const settings = gatherSettings();
    const localStorageSnapshot = gatherLocalStorageSnapshot();
    
    // Phase 6: Merge and generate checksums
    onProgress?.({ phase: 'finalize', current: 6, total: 6, message: 'Generating checksums...' });
    
    const mergedCampaigns = mergeCampaigns(
      localResult.campaigns,
      cloudResult.campaigns,
      guestResult.campaigns
    );
    
    // Calculate all play time
    const totalPlayTime = mergedCampaigns.reduce(
      (sum, c) => sum + (c.meta.playTime || 0),
      0
    );
    
    // Find oldest/newest
    const timestamps = mergedCampaigns.map(c => c.meta.createdAt).filter(Boolean);
    const oldestCampaign = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestCampaign = timestamps.length > 0 ? Math.max(...timestamps) : null;
    
    // Generate campaign checksums
    const campaignChecksums: Record<string, string> = {};
    for (const campaign of mergedCampaigns) {
      campaignChecksums[campaign.id] = await sha256(JSON.stringify(campaign));
    }
    
    const now = Date.now();
    
    const backup: ComprehensiveBackup = {
      manifest: {
        version: 2,
        formatVersion: '2.0.0',
        createdAt: now,
        createdAtISO: new Date(now).toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        checksums: {
          manifest: '',
          campaigns: campaignChecksums,
          overall: '',
        },
        summary: {
          totalCampaigns: mergedCampaigns.length,
          cloudCampaigns: cloudResult.campaigns.length,
          localCampaigns: localResult.campaigns.length + guestResult.campaigns.length,
          legacySaves: legacySaves.length,
          totalPlayTimeSeconds: totalPlayTime,
          oldestCampaign,
          newestCampaign,
        },
      },
      campaigns: {
        local: localResult.campaigns,
        cloud: cloudResult.campaigns,
        merged: mergedCampaigns,
      },
      indices: {
        localIndex: localResult.index,
        cloudIndex: cloudResult.index,
        guestIndex: guestResult.index,
      },
      legacySaves,
      progression: {
        lifetimeStats,
        lifetimeAchievements,
      },
      settings,
      localStorageSnapshot,
    };
    
    // Calculate overall checksum
    backup.manifest.checksums.manifest = quickHash(backup.manifest);
    backup.manifest.checksums.overall = await sha256(JSON.stringify(backup));
    
    return {
      success: errors.length === 0,
      backup,
      errors,
      warnings,
    };
  } catch (e) {
    errors.push(`Critical backup error: ${e}`);
    return {
      success: false,
      backup: null,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// BACKUP VERIFICATION
// ============================================================================

export async function verifyBackup(backup: ComprehensiveBackup): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    // Verify manifest
    if (!backup.manifest || !backup.manifest.version) {
      issues.push('Missing or invalid manifest');
    }
    
    // Verify campaign checksums
    for (const campaign of backup.campaigns.merged) {
      const expectedChecksum = backup.manifest.checksums.campaigns[campaign.id];
      if (expectedChecksum) {
        const actualChecksum = await sha256(JSON.stringify(campaign));
        if (actualChecksum !== expectedChecksum) {
          issues.push(`Checksum mismatch for campaign: ${campaign.meta.name}`);
        }
      }
    }
    
    // Verify all campaigns have required fields
    for (const campaign of backup.campaigns.merged) {
      if (!campaign.id) issues.push(`Campaign missing ID`);
      if (!campaign.meta?.name) issues.push(`Campaign ${campaign.id} missing name`);
      if (!campaign.player?.name) issues.push(`Campaign ${campaign.id} missing player`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (e) {
    issues.push(`Verification error: ${e}`);
    return { valid: false, issues };
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function compressBackup(backup: ComprehensiveBackup): string {
  const json = JSON.stringify(backup);
  return LZString.compressToBase64(json);
}

export function decompressBackup(compressed: string): ComprehensiveBackup | null {
  try {
    const json = LZString.decompressFromBase64(compressed);
    if (!json) return null;
    return JSON.parse(json) as ComprehensiveBackup;
  } catch {
    return null;
  }
}

export function getBackupFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `untold-complete-backup-${date}-${time}.untold`;
}

export function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
