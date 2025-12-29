// ============================================================================
// CAMPAIGN STORAGE MIGRATION - Migrate from simtales_ to lwe_ keys
// ============================================================================

import {
  CAMPAIGN_STORAGE_PREFIX,
  CAMPAIGN_INDEX_KEY,
  ACTIVE_CAMPAIGN_KEY,
  INVENTORY_STORAGE_PREFIX,
} from '@/types/campaign';

// Old key formats
const LEGACY_PREFIXES = {
  CAMPAIGN_INDEX: 'simtales_campaign_index',
  CAMPAIGN_PREFIX: 'simtales_campaign_',
  ACTIVE_CAMPAIGN: 'simtales_active_campaign',
  LEGACY_INVENTORY: 'game_inventory_state',
};

const MIGRATION_FLAG = 'lwe_storage_migrated_v1';

export interface MigrationResult {
  migrated: boolean;
  campaignsMigrated: number;
  inventoriesMigrated: number;
  errors: string[];
}

/**
 * Check if migration has already been performed
 */
export function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === 'true';
}

/**
 * Run the full migration from simtales_ keys to lwe_ keys
 */
export function migrateStorageKeys(): MigrationResult {
  const result: MigrationResult = {
    migrated: false,
    campaignsMigrated: 0,
    inventoriesMigrated: 0,
    errors: [],
  };

  // Skip if already migrated
  if (isMigrated()) {
    console.log('[Migration] Already migrated - skipping');
    return result;
  }

  console.log('[Migration] Starting storage key migration...');

  try {
    // Step 1: Migrate campaign index
    const legacyIndex = localStorage.getItem(LEGACY_PREFIXES.CAMPAIGN_INDEX);
    if (legacyIndex) {
      // Check if new index already exists
      const existingNewIndex = localStorage.getItem(CAMPAIGN_INDEX_KEY);
      if (!existingNewIndex) {
        localStorage.setItem(CAMPAIGN_INDEX_KEY, legacyIndex);
        console.log('[Migration] Migrated campaign index');
      } else {
        // Merge indices - add any missing campaigns
        try {
          const oldCampaigns = JSON.parse(legacyIndex);
          const newCampaigns = JSON.parse(existingNewIndex);
          const existingIds = new Set(newCampaigns.map((c: any) => c.id));
          const toAdd = oldCampaigns.filter((c: any) => !existingIds.has(c.id));
          if (toAdd.length > 0) {
            const merged = [...newCampaigns, ...toAdd];
            localStorage.setItem(CAMPAIGN_INDEX_KEY, JSON.stringify(merged));
            console.log(`[Migration] Merged ${toAdd.length} campaigns into index`);
          }
        } catch (e) {
          result.errors.push('Failed to merge campaign indices');
        }
      }
    }

    // Step 2: Migrate individual campaign data
    const allKeys = Object.keys(localStorage);
    const legacyCampaignKeys = allKeys.filter(
      key => key.startsWith(LEGACY_PREFIXES.CAMPAIGN_PREFIX) && 
             key !== LEGACY_PREFIXES.CAMPAIGN_INDEX
    );

    for (const oldKey of legacyCampaignKeys) {
      try {
        const campaignId = oldKey.replace(LEGACY_PREFIXES.CAMPAIGN_PREFIX, '');
        const newKey = `${CAMPAIGN_STORAGE_PREFIX}${campaignId}`;
        
        // Only migrate if new key doesn't exist
        if (!localStorage.getItem(newKey)) {
          const data = localStorage.getItem(oldKey);
          if (data) {
            localStorage.setItem(newKey, data);
            result.campaignsMigrated++;
            console.log(`[Migration] Migrated campaign: ${campaignId}`);
          }
        }
      } catch (e) {
        result.errors.push(`Failed to migrate key: ${oldKey}`);
      }
    }

    // Step 3: Migrate active campaign reference
    const legacyActive = localStorage.getItem(LEGACY_PREFIXES.ACTIVE_CAMPAIGN);
    if (legacyActive && !localStorage.getItem(ACTIVE_CAMPAIGN_KEY)) {
      localStorage.setItem(ACTIVE_CAMPAIGN_KEY, legacyActive);
      console.log('[Migration] Migrated active campaign reference');
    }

    // Step 4: Handle legacy shared inventory
    // If there's a legacy shared inventory and an active campaign, associate it
    const legacyInventory = localStorage.getItem(LEGACY_PREFIXES.LEGACY_INVENTORY);
    const activeCampaign = localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
    
    if (legacyInventory && activeCampaign) {
      const inventoryKey = `${INVENTORY_STORAGE_PREFIX}${activeCampaign}`;
      if (!localStorage.getItem(inventoryKey)) {
        localStorage.setItem(inventoryKey, legacyInventory);
        result.inventoriesMigrated++;
        console.log(`[Migration] Associated legacy inventory with campaign: ${activeCampaign}`);
      }
    }

    // Step 5: Clean up legacy keys (optional - keep for safety)
    // We'll mark as migrated but keep old keys for now
    // Uncomment to delete old keys:
    // cleanupLegacyKeys();

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG, 'true');
    result.migrated = true;

    console.log('[Migration] Complete!', {
      campaignsMigrated: result.campaignsMigrated,
      inventoriesMigrated: result.inventoriesMigrated,
      errors: result.errors.length,
    });

  } catch (e) {
    result.errors.push(`Migration failed: ${e}`);
    console.error('[Migration] Failed:', e);
  }

  return result;
}

/**
 * Clean up legacy storage keys (call after confirming migration worked)
 */
export function cleanupLegacyKeys(): number {
  let cleaned = 0;
  const allKeys = Object.keys(localStorage);

  // Remove old campaign keys
  for (const key of allKeys) {
    if (key.startsWith('simtales_')) {
      localStorage.removeItem(key);
      cleaned++;
    }
  }

  // Remove legacy shared inventory
  if (localStorage.getItem(LEGACY_PREFIXES.LEGACY_INVENTORY)) {
    localStorage.removeItem(LEGACY_PREFIXES.LEGACY_INVENTORY);
    cleaned++;
  }

  console.log(`[Migration] Cleaned up ${cleaned} legacy keys`);
  return cleaned;
}

/**
 * Force re-run migration (for debugging)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG);
  console.log('[Migration] Reset migration flag - will re-run on next load');
}

/**
 * Debug utility: Show all storage keys and their sizes
 */
export function debugStorageState(): void {
  const allKeys = Object.keys(localStorage);
  const campaignKeys = allKeys.filter(k => 
    k.startsWith('lwe_') || k.startsWith('simtales_') || k === 'game_inventory_state'
  );

  console.log('=== Storage State Debug ===');
  console.log('Migration status:', isMigrated() ? 'DONE' : 'PENDING');
  console.log('');
  
  console.log('New format (lwe_):');
  campaignKeys.filter(k => k.startsWith('lwe_')).forEach(k => {
    const size = localStorage.getItem(k)?.length || 0;
    console.log(`  ${k}: ${size} bytes`);
  });
  
  console.log('');
  console.log('Legacy format (simtales_):');
  campaignKeys.filter(k => k.startsWith('simtales_')).forEach(k => {
    const size = localStorage.getItem(k)?.length || 0;
    console.log(`  ${k}: ${size} bytes`);
  });
  
  console.log('');
  console.log('Legacy shared inventory:', 
    localStorage.getItem('game_inventory_state') ? 'EXISTS' : 'NONE'
  );
  console.log('===========================');
}

// Expose debug functions globally
if (typeof window !== 'undefined') {
  (window as any).debugStorageState = debugStorageState;
  (window as any).cleanupLegacyKeys = cleanupLegacyKeys;
  (window as any).resetMigrationFlag = resetMigrationFlag;
}
