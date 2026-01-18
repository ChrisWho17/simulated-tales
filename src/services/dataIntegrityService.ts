// ============================================================================
// DATA INTEGRITY SERVICE - SHA-256 validation, corruption detection, auto-repair
// Phase 3: Data integrity layer for zero data loss
// ============================================================================

import { CampaignData } from '@/types/campaign';
import { ComprehensiveBackup, decompressBackup, verifyBackup } from './comprehensiveBackupService';
import LZString from 'lz-string';

// ============================================================================
// TYPES
// ============================================================================

export type IntegrityStatus = 'valid' | 'corrupted' | 'repaired' | 'unrecoverable';

export interface IntegrityCheckResult {
  status: IntegrityStatus;
  campaignId: string;
  campaignName?: string;
  issues: IntegrityIssue[];
  repairedFrom?: 'backup' | 'cloud' | 'cache';
}

export interface IntegrityIssue {
  type: 'checksum_mismatch' | 'parse_error' | 'missing_field' | 'data_corruption' | 'version_mismatch';
  field?: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface IntegrityReport {
  checkedAt: number;
  totalCampaigns: number;
  valid: number;
  corrupted: number;
  repaired: number;
  unrecoverable: number;
  details: IntegrityCheckResult[];
}

interface CampaignIntegrityMeta {
  campaignId: string;
  checksum: string;
  savedAt: number;
  version: number;
  size: number;
}

const INTEGRITY_INDEX_KEY = 'lwe_integrity_index';
const BACKUP_CACHE_KEY = 'lwe_backup_cache';
const MAX_BACKUP_CACHE = 5; // Keep last 5 versions per campaign

// ============================================================================
// SHA-256 CHECKSUM
// ============================================================================

async function sha256(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// ============================================================================
// INTEGRITY INDEX MANAGEMENT
// ============================================================================

function loadIntegrityIndex(): Map<string, CampaignIntegrityMeta> {
  try {
    const raw = localStorage.getItem(INTEGRITY_INDEX_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Array<[string, CampaignIntegrityMeta]>;
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function saveIntegrityIndex(index: Map<string, CampaignIntegrityMeta>): void {
  try {
    const array = Array.from(index.entries());
    localStorage.setItem(INTEGRITY_INDEX_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('[Integrity] Failed to save index:', error);
  }
}

// ============================================================================
// BACKUP CACHE MANAGEMENT (for auto-repair)
// ============================================================================

interface BackupCacheEntry {
  campaignId: string;
  checksum: string;
  savedAt: number;
  data: string; // Compressed campaign data
}

function loadBackupCache(): Map<string, BackupCacheEntry[]> {
  try {
    const raw = localStorage.getItem(BACKUP_CACHE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Array<[string, BackupCacheEntry[]]>;
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function saveBackupCache(cache: Map<string, BackupCacheEntry[]>): void {
  try {
    const array = Array.from(cache.entries());
    localStorage.setItem(BACKUP_CACHE_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('[Integrity] Failed to save backup cache:', error);
  }
}

function addToBackupCache(campaign: CampaignData, checksum: string): void {
  const cache = loadBackupCache();
  const campaignCache = cache.get(campaign.id) || [];
  
  // Don't add duplicate checksums
  if (campaignCache.some(e => e.checksum === checksum)) {
    return;
  }
  
  const compressed = LZString.compressToUTF16(JSON.stringify(campaign));
  if (!compressed) return;
  
  campaignCache.unshift({
    campaignId: campaign.id,
    checksum,
    savedAt: Date.now(),
    data: compressed,
  });
  
  // Keep only last N versions
  while (campaignCache.length > MAX_BACKUP_CACHE) {
    campaignCache.pop();
  }
  
  cache.set(campaign.id, campaignCache);
  saveBackupCache(cache);
}

function getFromBackupCache(campaignId: string): CampaignData | null {
  const cache = loadBackupCache();
  const campaignCache = cache.get(campaignId);
  
  if (!campaignCache || campaignCache.length === 0) {
    return null;
  }
  
  // Try each cached version until one works
  for (const entry of campaignCache) {
    try {
      const decompressed = LZString.decompressFromUTF16(entry.data);
      if (decompressed) {
        const campaign = JSON.parse(decompressed) as CampaignData;
        if (campaign && campaign.id === campaignId) {
          return campaign;
        }
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

// ============================================================================
// CAMPAIGN VALIDATION
// ============================================================================

interface ValidationResult {
  valid: boolean;
  issues: IntegrityIssue[];
}

function validateCampaignStructure(campaign: unknown): ValidationResult {
  const issues: IntegrityIssue[] = [];
  
  if (!campaign || typeof campaign !== 'object') {
    issues.push({
      type: 'data_corruption',
      message: 'Campaign data is not a valid object',
      severity: 'critical',
    });
    return { valid: false, issues };
  }
  
  const c = campaign as Record<string, unknown>;
  
  // Required fields
  if (!c.id || typeof c.id !== 'string') {
    issues.push({
      type: 'missing_field',
      field: 'id',
      message: 'Campaign ID is missing or invalid',
      severity: 'critical',
    });
  }
  
  if (!c.meta || typeof c.meta !== 'object') {
    issues.push({
      type: 'missing_field',
      field: 'meta',
      message: 'Campaign metadata is missing',
      severity: 'critical',
    });
  } else {
    const meta = c.meta as Record<string, unknown>;
    if (!meta.name) {
      issues.push({
        type: 'missing_field',
        field: 'meta.name',
        message: 'Campaign name is missing',
        severity: 'error',
      });
    }
    if (typeof meta.createdAt !== 'number') {
      issues.push({
        type: 'missing_field',
        field: 'meta.createdAt',
        message: 'Campaign creation time is missing or invalid',
        severity: 'warning',
      });
    }
  }
  
  if (!c.player || typeof c.player !== 'object') {
    issues.push({
      type: 'missing_field',
      field: 'player',
      message: 'Player data is missing',
      severity: 'error',
    });
  } else {
    const player = c.player as Record<string, unknown>;
    if (!player.name) {
      issues.push({
        type: 'missing_field',
        field: 'player.name',
        message: 'Player name is missing',
        severity: 'warning',
      });
    }
  }
  
  if (!c.worldBible || typeof c.worldBible !== 'object') {
    issues.push({
      type: 'missing_field',
      field: 'worldBible',
      message: 'World Bible is missing',
      severity: 'error',
    });
  }
  
  if (!Array.isArray(c.narrativeHistory)) {
    issues.push({
      type: 'missing_field',
      field: 'narrativeHistory',
      message: 'Narrative history is missing or invalid',
      severity: 'warning',
    });
  }
  
  const hasCritical = issues.some(i => i.severity === 'critical');
  return { valid: !hasCritical, issues };
}

// ============================================================================
// INTEGRITY CHECK
// ============================================================================

async function checkCampaignIntegrity(campaignId: string): Promise<IntegrityCheckResult> {
  const issues: IntegrityIssue[] = [];
  
  try {
    // Load raw data
    const key = `lwe_campaign_${campaignId}`;
    const raw = localStorage.getItem(key);
    
    if (!raw) {
      return {
        status: 'unrecoverable',
        campaignId,
        issues: [{
          type: 'data_corruption',
          message: 'Campaign data not found in storage',
          severity: 'critical',
        }],
      };
    }
    
    // Try to parse
    let campaign: CampaignData;
    try {
      campaign = JSON.parse(raw);
    } catch (parseError) {
      issues.push({
        type: 'parse_error',
        message: `Failed to parse campaign data: ${parseError}`,
        severity: 'critical',
      });
      
      // Try to repair from backup cache
      const cached = getFromBackupCache(campaignId);
      if (cached) {
        localStorage.setItem(key, JSON.stringify(cached));
        return {
          status: 'repaired',
          campaignId,
          campaignName: cached.meta?.name,
          issues,
          repairedFrom: 'cache',
        };
      }
      
      return { status: 'unrecoverable', campaignId, issues };
    }
    
    // Validate structure
    const validation = validateCampaignStructure(campaign);
    issues.push(...validation.issues);
    
    // Verify checksum
    const integrityIndex = loadIntegrityIndex();
    const meta = integrityIndex.get(campaignId);
    
    if (meta) {
      const currentChecksum = await sha256(raw);
      if (currentChecksum !== meta.checksum) {
        issues.push({
          type: 'checksum_mismatch',
          message: 'Campaign data has been modified or corrupted since last save',
          severity: 'warning',
        });
      }
    }
    
    // If critical issues, try repair
    if (!validation.valid) {
      const cached = getFromBackupCache(campaignId);
      if (cached) {
        const cachedValidation = validateCampaignStructure(cached);
        if (cachedValidation.valid) {
          localStorage.setItem(key, JSON.stringify(cached));
          
          // Update integrity index
          const newChecksum = await sha256(JSON.stringify(cached));
          integrityIndex.set(campaignId, {
            campaignId,
            checksum: newChecksum,
            savedAt: Date.now(),
            version: (meta?.version || 0) + 1,
            size: JSON.stringify(cached).length,
          });
          saveIntegrityIndex(integrityIndex);
          
          return {
            status: 'repaired',
            campaignId,
            campaignName: cached.meta?.name,
            issues,
            repairedFrom: 'cache',
          };
        }
      }
      
      return { status: 'corrupted', campaignId, campaignName: campaign.meta?.name, issues };
    }
    
    return {
      status: issues.length > 0 ? 'corrupted' : 'valid',
      campaignId,
      campaignName: campaign.meta?.name,
      issues,
    };
  } catch (error) {
    return {
      status: 'unrecoverable',
      campaignId,
      issues: [{
        type: 'data_corruption',
        message: `Unexpected error: ${error}`,
        severity: 'critical',
      }],
    };
  }
}

// ============================================================================
// VALIDATED LOAD - Now with cloud-first support
// ============================================================================

export async function loadCampaignWithValidation(campaignId: string): Promise<{
  campaign: CampaignData | null;
  integrityResult: IntegrityCheckResult;
}> {
  // First, try to load from UnifiedSaveArchitecture which handles cloud
  try {
    const { UnifiedSaveArchitecture } = await import('./unifiedSaveArchitecture');
    const cloudCampaign = await UnifiedSaveArchitecture.loadCampaign(campaignId);
    
    if (cloudCampaign) {
      // Validate the loaded campaign
      const validation = validateCampaignStructure(cloudCampaign);
      
      if (validation.valid) {
        // Make sure it's also saved locally for integrity
        const key = `lwe_campaign_${campaignId}`;
        const dataString = JSON.stringify(cloudCampaign);
        localStorage.setItem(key, dataString);
        
        // Update integrity index
        const checksum = await sha256(dataString);
        const integrityIndex = loadIntegrityIndex();
        const existingMeta = integrityIndex.get(campaignId);
        integrityIndex.set(campaignId, {
          campaignId,
          checksum,
          savedAt: Date.now(),
          version: (existingMeta?.version || 0) + 1,
          size: dataString.length,
        });
        saveIntegrityIndex(integrityIndex);
        
        // Add to backup cache
        addToBackupCache(cloudCampaign, checksum);
        
        return {
          campaign: cloudCampaign,
          integrityResult: {
            status: 'valid',
            campaignId,
            campaignName: cloudCampaign.meta?.name,
            issues: validation.issues,
          },
        };
      }
    }
  } catch (error) {
    console.warn('[Integrity] Cloud load failed, falling back to local:', error);
  }
  
  // Fall back to local integrity check
  const result = await checkCampaignIntegrity(campaignId);
  
  if (result.status === 'unrecoverable') {
    return { campaign: null, integrityResult: result };
  }
  
  // Load the (possibly repaired) campaign
  try {
    const key = `lwe_campaign_${campaignId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { campaign: null, integrityResult: result };
    }
    
    const campaign = JSON.parse(raw) as CampaignData;
    return { campaign, integrityResult: result };
  } catch {
    return { campaign: null, integrityResult: { ...result, status: 'unrecoverable' } };
  }
}

// ============================================================================
// VALIDATED SAVE
// ============================================================================

export async function saveCampaignWithIntegrity(campaign: CampaignData): Promise<{
  success: boolean;
  checksum: string;
  error?: string;
}> {
  try {
    // Validate before saving
    const validation = validateCampaignStructure(campaign);
    if (!validation.valid) {
      const criticalIssues = validation.issues.filter(i => i.severity === 'critical');
      return {
        success: false,
        checksum: '',
        error: `Invalid campaign data: ${criticalIssues.map(i => i.message).join(', ')}`,
      };
    }
    
    const dataString = JSON.stringify(campaign);
    const checksum = await sha256(dataString);
    
    // Save to localStorage
    const key = `lwe_campaign_${campaign.id}`;
    localStorage.setItem(key, dataString);
    
    // Verify write
    const written = localStorage.getItem(key);
    if (!written) {
      return { success: false, checksum: '', error: 'Write verification failed' };
    }
    
    const writtenChecksum = await sha256(written);
    if (writtenChecksum !== checksum) {
      return { success: false, checksum: '', error: 'Write checksum mismatch' };
    }
    
    // Update integrity index
    const integrityIndex = loadIntegrityIndex();
    const existingMeta = integrityIndex.get(campaign.id);
    
    integrityIndex.set(campaign.id, {
      campaignId: campaign.id,
      checksum,
      savedAt: Date.now(),
      version: (existingMeta?.version || 0) + 1,
      size: dataString.length,
    });
    saveIntegrityIndex(integrityIndex);
    
    // Add to backup cache for auto-repair
    addToBackupCache(campaign, checksum);
    
    return { success: true, checksum };
  } catch (error) {
    return {
      success: false,
      checksum: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// FULL INTEGRITY SCAN
// ============================================================================

export async function runFullIntegrityScan(): Promise<IntegrityReport> {
  const details: IntegrityCheckResult[] = [];
  
  try {
    // Get all campaign IDs
    const indexRaw = localStorage.getItem('lwe_campaign_index');
    if (!indexRaw) {
      return {
        checkedAt: Date.now(),
        totalCampaigns: 0,
        valid: 0,
        corrupted: 0,
        repaired: 0,
        unrecoverable: 0,
        details: [],
      };
    }
    
    const index = JSON.parse(indexRaw) as Array<{ id: string }>;
    
    for (const campaign of index) {
      const result = await checkCampaignIntegrity(campaign.id);
      details.push(result);
    }
    
    return {
      checkedAt: Date.now(),
      totalCampaigns: details.length,
      valid: details.filter(d => d.status === 'valid').length,
      corrupted: details.filter(d => d.status === 'corrupted').length,
      repaired: details.filter(d => d.status === 'repaired').length,
      unrecoverable: details.filter(d => d.status === 'unrecoverable').length,
      details,
    };
  } catch (error) {
    console.error('[Integrity] Full scan failed:', error);
    return {
      checkedAt: Date.now(),
      totalCampaigns: 0,
      valid: 0,
      corrupted: 0,
      repaired: 0,
      unrecoverable: 0,
      details: [],
    };
  }
}

// ============================================================================
// REPAIR FROM BACKUP FILE
// ============================================================================

export async function repairFromBackupFile(
  backupData: string,
  campaignId?: string
): Promise<{
  success: boolean;
  repaired: string[];
  failed: string[];
  error?: string;
}> {
  const repaired: string[] = [];
  const failed: string[] = [];
  
  try {
    // Try to decompress
    let backup: ComprehensiveBackup | null = decompressBackup(backupData);
    
    // If decompression failed, try parsing as raw JSON
    if (!backup) {
      try {
        backup = JSON.parse(backupData) as ComprehensiveBackup;
      } catch {
        return { success: false, repaired, failed, error: 'Failed to parse backup file' };
      }
    }
    
    // Verify backup
    const verification = await verifyBackup(backup);
    if (!verification.valid) {
      console.warn('[Integrity] Backup verification issues:', verification.issues);
    }
    
    // Get campaigns to repair
    const campaignsToRepair = campaignId
      ? backup.campaigns.merged.filter(c => c.id === campaignId)
      : backup.campaigns.merged;
    
    for (const campaign of campaignsToRepair) {
      try {
        const result = await saveCampaignWithIntegrity(campaign);
        if (result.success) {
          repaired.push(campaign.id);
        } else {
          failed.push(campaign.id);
        }
      } catch {
        failed.push(campaign.id);
      }
    }
    
    // Restore progression data if full repair
    if (!campaignId && backup.progression) {
      if (backup.progression.lifetimeStats) {
        localStorage.setItem('lifetime_statistics', JSON.stringify(backup.progression.lifetimeStats));
      }
      if (backup.progression.lifetimeAchievements) {
        localStorage.setItem('lifetime_achievements', JSON.stringify(backup.progression.lifetimeAchievements));
      }
    }
    
    // Restore settings if full repair
    if (!campaignId && backup.settings) {
      for (const [key, value] of Object.entries(backup.settings)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    
    return {
      success: failed.length === 0,
      repaired,
      failed,
    };
  } catch (error) {
    return {
      success: false,
      repaired,
      failed,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const DataIntegrityService = {
  loadWithValidation: loadCampaignWithValidation,
  saveWithIntegrity: saveCampaignWithIntegrity,
  runFullScan: runFullIntegrityScan,
  repairFromBackup: repairFromBackupFile,
  checkCampaign: checkCampaignIntegrity,
  validateStructure: validateCampaignStructure,
};
