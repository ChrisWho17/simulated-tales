// ============================================================================
// STORAGE KEYS - Centralized registry for all localStorage keys
// Phase 1 of hardening: Single source of truth for storage key management
// ============================================================================

/**
 * All localStorage keys used by the application.
 * NEVER use raw strings for localStorage keys - always import from here.
 */
export const STORAGE_KEYS = {
  // ============================================================================
  // CAMPAIGN SYSTEM
  // ============================================================================
  CAMPAIGN_INDEX: 'lwe_campaign_index',
  CAMPAIGN_PREFIX: 'lwe_campaign_',
  ACTIVE_CAMPAIGN: 'lwe_active_campaign_id',
  INVENTORY_PREFIX: 'lwe_inventory_',
  GAME_STATE_PREFIX: 'lwe_gamestate_',
  
  // ============================================================================
  // GAME SETTINGS
  // ============================================================================
  GAME_SETTINGS: 'untold-game-settings',
  COLOR_PREFERENCE: 'untold-color-id',
  DICE_MODE: 'untold-dice-mode',
  
  // ============================================================================
  // WORLD STATE
  // ============================================================================
  CAMPAIGN_MEMORY: 'untold-campaign-memory',
  EMOTIONAL_STATE: 'untold-emotional-state',
  WORLD_BIBLE: 'untold-world-bible',
  PRESSURE_STATE: 'untold-pressure-state',
  
  // ============================================================================
  // COMPANION SYSTEM
  // ============================================================================
  COMPANION_APPEARANCES: 'companion-appearances',
  COMPANION_INTRODUCTIONS: 'companion-introductions',
  PENDING_COMPANION_INTRODUCTIONS: 'pending-companion-introductions',
  
  // ============================================================================
  // SESSION & HEALTH MONITORING
  // ============================================================================
  SESSION_ID: 'lwe_session_id',
  STORAGE_HEALTH: 'lwe_storage_health',
  LAST_BACKUP: 'lwe_last_backup_time',
  LAST_CLEANUP: 'lwe_last_cleanup',
  
  // ============================================================================
  // CROSS-TAB SYNC
  // ============================================================================
  CROSS_TAB_HEARTBEAT: 'lwe_cross_tab_heartbeat',
  CROSS_TAB_PRIMARY: 'lwe_cross_tab_primary',
  
  // ============================================================================
  // WRITE-AHEAD LOG (WAL) & TRANSACTIONS
  // ============================================================================
  WAL_PREFIX: 'lwe_wal_',
  TRANSACTION_PREFIX: 'lwe_tx_',
  
  // ============================================================================
  // ACHIEVEMENTS & STATS
  // ============================================================================
  LIFETIME_STATS: 'lwe_lifetime_stats',
  ACHIEVEMENTS: 'lwe_achievements',
  
  // ============================================================================
  // UI STATE
  // ============================================================================
  ONBOARDING_COMPLETE: 'untold-onboarding-complete',
  WHATS_NEW_SEEN: 'untold-whats-new-seen',
  FIRST_TIME_WIZARD_COMPLETE: 'untold-first-time-wizard-complete',
  BOOKMARKS: 'untold-bookmarks',
  
  // ============================================================================
  // CACHE PREFIXES (low priority for cleanup)
  // ============================================================================
  PORTRAIT_CACHE_PREFIX: 'portrait-cache-',
  SCENE_ILLUSTRATION_PREFIX: 'scene-illustration-',
  NPC_PORTRAIT_PREFIX: 'npc-portrait-',
} as const;

// Type for storage keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the campaign-specific storage key
 */
export function getCampaignKey(campaignId: string): string {
  return `${STORAGE_KEYS.CAMPAIGN_PREFIX}${campaignId}`;
}

/**
 * Get the inventory storage key for a campaign
 */
export function getInventoryKey(campaignId: string): string {
  return `${STORAGE_KEYS.INVENTORY_PREFIX}${campaignId}`;
}

/**
 * Get the game state storage key for a campaign
 */
export function getGameStateKey(campaignId: string): string {
  return `${STORAGE_KEYS.GAME_STATE_PREFIX}${campaignId}`;
}

/**
 * Get the WAL entry key for a transaction
 */
export function getWALKey(transactionId: string): string {
  return `${STORAGE_KEYS.WAL_PREFIX}${transactionId}`;
}

/**
 * Get all storage keys for a campaign (for deletion)
 */
export function getAllCampaignKeys(campaignId: string): string[] {
  return [
    getCampaignKey(campaignId),
    getInventoryKey(campaignId),
    getGameStateKey(campaignId),
  ];
}

/**
 * Check if a key is a cache key (low priority for cleanup)
 */
export function isCacheKey(key: string): boolean {
  return (
    key.startsWith(STORAGE_KEYS.PORTRAIT_CACHE_PREFIX) ||
    key.startsWith(STORAGE_KEYS.SCENE_ILLUSTRATION_PREFIX) ||
    key.startsWith(STORAGE_KEYS.NPC_PORTRAIT_PREFIX)
  );
}

/**
 * Check if a key is a campaign data key
 */
export function isCampaignDataKey(key: string): boolean {
  return (
    key.startsWith(STORAGE_KEYS.CAMPAIGN_PREFIX) ||
    key.startsWith(STORAGE_KEYS.INVENTORY_PREFIX) ||
    key.startsWith(STORAGE_KEYS.GAME_STATE_PREFIX)
  );
}

/**
 * Check if a key is a WAL/transaction key
 */
export function isTransactionKey(key: string): boolean {
  return (
    key.startsWith(STORAGE_KEYS.WAL_PREFIX) ||
    key.startsWith(STORAGE_KEYS.TRANSACTION_PREFIX)
  );
}

/**
 * Get all WAL keys from storage
 */
export function getAllWALKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEYS.WAL_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Get all cache keys from storage (for cleanup)
 */
export function getAllCacheKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isCacheKey(key)) {
      keys.push(key);
    }
  }
  return keys;
}

console.log('[StorageKeys] Centralized storage key registry initialized');
