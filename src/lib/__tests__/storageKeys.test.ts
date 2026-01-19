// ============================================================================
// STORAGE KEYS TESTS - Ensure centralized key management works
// Phase 5: Critical Test Coverage
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEYS,
  getCampaignKey,
  getInventoryKey,
  getGameStateKey,
  getWALKey,
  getAllCampaignKeys,
  isCacheKey,
  isCampaignDataKey,
  isTransactionKey,
} from '@/lib/storageKeys';

describe('storageKeys', () => {
  describe('STORAGE_KEYS constants', () => {
    it('should have all required campaign keys', () => {
      expect(STORAGE_KEYS.CAMPAIGN_INDEX).toBe('lwe_campaign_index');
      expect(STORAGE_KEYS.CAMPAIGN_PREFIX).toBe('lwe_campaign_');
      expect(STORAGE_KEYS.ACTIVE_CAMPAIGN).toBe('lwe_active_campaign_id');
      expect(STORAGE_KEYS.INVENTORY_PREFIX).toBe('lwe_inventory_');
      expect(STORAGE_KEYS.GAME_STATE_PREFIX).toBe('lwe_gamestate_');
    });

    it('should have all required settings keys', () => {
      expect(STORAGE_KEYS.GAME_SETTINGS).toBe('untold-game-settings');
      expect(STORAGE_KEYS.COLOR_PREFERENCE).toBe('untold-color-id');
      expect(STORAGE_KEYS.DICE_MODE).toBe('untold-dice-mode');
    });

    it('should have companion system keys', () => {
      expect(STORAGE_KEYS.COMPANION_APPEARANCES).toBe('companion-appearances');
      expect(STORAGE_KEYS.COMPANION_INTRODUCTIONS).toBe('companion-introductions');
      expect(STORAGE_KEYS.PENDING_COMPANION_INTRODUCTIONS).toBe('pending-companion-introductions');
    });
  });

  describe('getCampaignKey', () => {
    it('should generate correct campaign key', () => {
      expect(getCampaignKey('abc123')).toBe('lwe_campaign_abc123');
      expect(getCampaignKey('test-campaign')).toBe('lwe_campaign_test-campaign');
    });
  });

  describe('getInventoryKey', () => {
    it('should generate correct inventory key', () => {
      expect(getInventoryKey('abc123')).toBe('lwe_inventory_abc123');
    });
  });

  describe('getGameStateKey', () => {
    it('should generate correct game state key', () => {
      expect(getGameStateKey('abc123')).toBe('lwe_gamestate_abc123');
    });
  });

  describe('getWALKey', () => {
    it('should generate correct WAL key', () => {
      expect(getWALKey('tx_123')).toBe('lwe_wal_tx_123');
    });
  });

  describe('getAllCampaignKeys', () => {
    it('should return all storage keys for a campaign', () => {
      const keys = getAllCampaignKeys('test123');
      
      expect(keys).toHaveLength(3);
      expect(keys).toContain('lwe_campaign_test123');
      expect(keys).toContain('lwe_inventory_test123');
      expect(keys).toContain('lwe_gamestate_test123');
    });
  });

  describe('isCacheKey', () => {
    it('should identify portrait cache keys', () => {
      expect(isCacheKey('portrait-cache-npc-123')).toBe(true);
      expect(isCacheKey('portrait-cache-player')).toBe(true);
    });

    it('should identify scene illustration keys', () => {
      expect(isCacheKey('scene-illustration-abc')).toBe(true);
    });

    it('should identify NPC portrait keys', () => {
      expect(isCacheKey('npc-portrait-merchant')).toBe(true);
    });

    it('should reject non-cache keys', () => {
      expect(isCacheKey('lwe_campaign_123')).toBe(false);
      expect(isCacheKey('untold-game-settings')).toBe(false);
    });
  });

  describe('isCampaignDataKey', () => {
    it('should identify campaign data keys', () => {
      expect(isCampaignDataKey('lwe_campaign_abc123')).toBe(true);
      expect(isCampaignDataKey('lwe_inventory_abc123')).toBe(true);
      expect(isCampaignDataKey('lwe_gamestate_abc123')).toBe(true);
    });

    it('should reject non-campaign keys', () => {
      expect(isCampaignDataKey('untold-game-settings')).toBe(false);
      expect(isCampaignDataKey('portrait-cache-123')).toBe(false);
    });
  });

  describe('isTransactionKey', () => {
    it('should identify WAL keys', () => {
      expect(isTransactionKey('lwe_wal_tx_123')).toBe(true);
    });

    it('should identify transaction keys', () => {
      expect(isTransactionKey('lwe_tx_abc')).toBe(true);
    });

    it('should reject non-transaction keys', () => {
      expect(isTransactionKey('lwe_campaign_123')).toBe(false);
      expect(isTransactionKey('untold-game-settings')).toBe(false);
    });
  });
});
