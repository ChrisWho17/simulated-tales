// ============================================================================
// LEGACY SAVE MIGRATION SYSTEM
// Migrates old localStorage saves to the new SaveSystem format
// ============================================================================

import { SaveSystem } from '@/systems/SaveSystem';
import { compressToBase64, decompressFromBase64 } from 'lz-string';

// Old key patterns to migrate
const LEGACY_KEY_PATTERNS = [
  'untold-adventure-story',
  'untold-adventure-character',
  'untold-adventure-scenario',
  'untold-adventure-genre',
  'untold-saves-',
  'simtales_',
  'lwe_campaign_',
];

// New key prefix for migrated data
const MIGRATED_PREFIX = 'lwe_';
const MIGRATION_FLAG = 'lwe_migration_completed_v2';
const LEGACY_BACKUP_PREFIX = 'legacy_backup_';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  warnings: string[];
  details: Array<{ key: string; status: 'migrated' | 'failed' | 'skipped'; reason?: string }>;
}

export interface LegacySavePreview {
  hasData: boolean;
  currentSession: boolean;
  savedGamesCount: number;
  campaignsCount: number;
  totalBytes: number;
}

/**
 * Check if migration has already been completed
 */
export function isMigrationCompleted(): boolean {
  try {
    return localStorage.getItem(MIGRATION_FLAG) === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if there's legacy data that needs migration
 */
export function hasLegacyData(): boolean {
  if (isMigrationCompleted()) return false;
  
  try {
    const allKeys = Object.keys(localStorage);
    return allKeys.some(key => 
      LEGACY_KEY_PATTERNS.some(pattern => key.startsWith(pattern) || key.includes(pattern))
    );
  } catch {
    return false;
  }
}

/**
 * Get preview of what will be migrated
 */
export function getLegacyDataPreview(): LegacySavePreview {
  const preview: LegacySavePreview = {
    hasData: false,
    currentSession: false,
    savedGamesCount: 0,
    campaignsCount: 0,
    totalBytes: 0,
  };
  
  try {
    const allKeys = Object.keys(localStorage);
    
    // Check for current session
    const hasStory = !!localStorage.getItem('untold-adventure-story');
    const hasCharacter = !!localStorage.getItem('untold-adventure-character');
    preview.currentSession = hasStory && hasCharacter;
    
    // Count saved games
    allKeys.forEach(key => {
      if (key.startsWith('untold-saves-')) {
        preview.savedGamesCount++;
      }
      if (key.startsWith('lwe_campaign_') || key.startsWith('simtales_campaign_')) {
        preview.campaignsCount++;
      }
      
      // Calculate total size
      if (LEGACY_KEY_PATTERNS.some(p => key.includes(p))) {
        const value = localStorage.getItem(key);
        if (value) {
          preview.totalBytes += key.length + value.length;
        }
      }
    });
    
    preview.hasData = preview.currentSession || preview.savedGamesCount > 0 || preview.campaignsCount > 0;
  } catch (e) {
    console.error('[LegacyMigration] Failed to get preview:', e);
  }
  
  return preview;
}

/**
 * Perform the migration
 */
export async function migrateLegacyData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    warnings: [],
    details: [],
  };
  
  try {
    const allKeys = Object.keys(localStorage);
    const legacyKeys = allKeys.filter(key =>
      LEGACY_KEY_PATTERNS.some(pattern => key.startsWith(pattern) || key.includes(pattern))
    );
    
    console.log(`[LegacyMigration] Found ${legacyKeys.length} legacy keys to process`);
    
    for (const key of legacyKeys) {
      try {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) {
          result.details.push({ key, status: 'skipped', reason: 'No value' });
          continue;
        }
        
        // Skip already-backed-up keys
        if (key.startsWith(LEGACY_BACKUP_PREFIX)) {
          result.details.push({ key, status: 'skipped', reason: 'Already a backup' });
          continue;
        }
        
        // Parse and validate data
        let data: unknown;
        try {
          data = JSON.parse(rawValue);
        } catch {
          result.warnings.push(`Could not parse ${key} as JSON`);
          result.details.push({ key, status: 'skipped', reason: 'Invalid JSON' });
          continue;
        }
        
        // Determine new key name
        let newKey = key;
        if (!key.startsWith(MIGRATED_PREFIX)) {
          newKey = `${MIGRATED_PREFIX}${key.replace(/^(untold-|simtales_)/, '')}`;
        }
        
        // Save to new system
        const saved = await SaveSystem.saveImmediate(newKey, data);
        
        if (saved) {
          // Backup original key
          localStorage.setItem(`${LEGACY_BACKUP_PREFIX}${key}`, rawValue);
          result.migratedCount++;
          result.details.push({ key, status: 'migrated' });
          console.log(`[LegacyMigration] Migrated: ${key} -> ${newKey}`);
        } else {
          result.failedCount++;
          result.details.push({ key, status: 'failed', reason: 'Save failed' });
        }
      } catch (e) {
        result.failedCount++;
        result.details.push({ key, status: 'failed', reason: String(e) });
      }
    }
    
    // Mark migration as complete
    if (result.failedCount === 0) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
    }
    
    result.success = result.failedCount === 0;
    console.log(`[LegacyMigration] Complete: ${result.migratedCount} migrated, ${result.failedCount} failed`);
  } catch (e) {
    result.success = false;
    result.warnings.push(`Migration error: ${e}`);
  }
  
  return result;
}

/**
 * Clean up legacy keys after confirming migration worked
 */
export function cleanupLegacyKeys(): number {
  let cleaned = 0;
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      // Only clean non-backup legacy keys after migration is complete
      if (isMigrationCompleted() && !key.startsWith(LEGACY_BACKUP_PREFIX)) {
        if (LEGACY_KEY_PATTERNS.some(p => key.startsWith(p)) && !key.startsWith(MIGRATED_PREFIX)) {
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    });
  } catch (e) {
    console.error('[LegacyMigration] Cleanup error:', e);
  }
  return cleaned;
}

/**
 * Reset migration flag (for testing)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG);
}

// ============================================================================
// SAVE CODES (Ultimate Fallback)
// ============================================================================

/**
 * Generate a compressed save code from game data
 */
export function generateSaveCode(data: unknown): string {
  try {
    const json = JSON.stringify(data);
    const compressed = compressToBase64(json);
    return compressed || '';
  } catch (e) {
    console.error('[SaveCode] Failed to generate:', e);
    return '';
  }
}

/**
 * Decode and decompress a save code
 */
export function decodeSaveCode<T = unknown>(code: string): T | null {
  try {
    const decompressed = decompressFromBase64(code);
    if (!decompressed) {
      console.error('[SaveCode] Decompression failed');
      return null;
    }
    return JSON.parse(decompressed) as T;
  } catch (e) {
    console.error('[SaveCode] Failed to decode:', e);
    return null;
  }
}

/**
 * Get a preview of what's in a save code without fully parsing
 */
export function getSaveCodePreview(code: string): { valid: boolean; preview?: string; error?: string } {
  try {
    const decompressed = decompressFromBase64(code);
    if (!decompressed) {
      return { valid: false, error: 'Invalid save code format' };
    }
    
    const data = JSON.parse(decompressed);
    
    // Try to extract useful info
    let preview = '';
    if (data.meta?.name) {
      preview = `Campaign: ${data.meta.name}`;
    } else if (data.player?.name) {
      preview = `Character: ${data.player.name}`;
    } else if (data.character?.name) {
      preview = `Character: ${data.character.name}`;
    } else {
      preview = `Data type: ${typeof data}`;
    }
    
    return { valid: true, preview };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}

/**
 * Export current campaign as save code
 */
export function exportCampaignAsSaveCode(campaign: unknown): string {
  return generateSaveCode(campaign);
}

/**
 * Calculate the compression ratio for display
 */
export function getCompressionStats(original: unknown, compressed: string): { 
  originalSize: number; 
  compressedSize: number; 
  ratio: number 
} {
  const originalJson = JSON.stringify(original);
  return {
    originalSize: originalJson.length,
    compressedSize: compressed.length,
    ratio: compressed.length / originalJson.length,
  };
}
