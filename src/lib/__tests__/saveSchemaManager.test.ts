// ============================================================================
// SAVE SCHEMA MANAGER TESTS - Ensure schema normalization works correctly
// Phase 5: Critical Test Coverage
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  normalizeCampaign, 
  validateCampaign, 
  createMinimalCampaign,
  normalizeCheckpoint,
  SAVE_SCHEMA_VERSION,
} from '@/lib/saveSchemaManager';
import { CampaignData } from '@/types/campaign';

describe('SaveSchemaManager', () => {
  describe('normalizeCampaign', () => {
    it('should create a valid campaign from null input', () => {
      const result = normalizeCampaign(null);
      
      expect(result.wasModified).toBe(true);
      expect(result.campaign).toBeDefined();
      expect(result.campaign.id).toBeDefined();
      expect(result.campaign.player).toBeDefined();
      expect(result.campaign.settings).toBeDefined();
    });

    it('should create a valid campaign from undefined input', () => {
      const result = normalizeCampaign(undefined);
      
      expect(result.wasModified).toBe(true);
      expect(result.campaign).toBeDefined();
    });

    it('should preserve existing valid data', () => {
      const validCampaign: Partial<CampaignData> = {
        id: 'test-campaign-123',
        meta: {
          name: 'My Adventure',
          primaryGenre: 'fantasy',
          secondaryGenres: ['mystery'],
          createdAt: 1000,
          updatedAt: 2000,
          playTime: 3600,
          chapterCount: 5,
        },
        player: {
          name: 'Hero',
          classId: 'mage',
          backgroundId: 'scholar',
          level: 10,
          experience: 5000,
          currentHealth: 80,
          maxHealth: 100,
          stats: {
            strength: 8,
            dexterity: 12,
            constitution: 10,
            intelligence: 16,
            wisdom: 14,
            charisma: 11,
          },
          skills: ['arcana', 'history'],
          abilities: ['fireball'],
          inventory: [],
          gold: 500,
          traits: ['curious'],
        },
        narrativeHistory: [{ id: '1', role: 'narrator', content: 'Test', timestamp: Date.now() }],
        chapters: [{ number: 1, title: 'Beginning', startedAt: 1000 }],
        currentChapter: { number: 1, title: 'Beginning', startedAt: 1000 },
        escalationTier: 3,
        currentTick: 100,
        scenario: 'test scenario',
        checkpoints: [],
      };

      const result = normalizeCampaign(validCampaign);

      expect(result.campaign.id).toBe('test-campaign-123');
      expect(result.campaign.meta.name).toBe('My Adventure');
      expect(result.campaign.player.name).toBe('Hero');
      expect(result.campaign.player.level).toBe(10);
      expect(result.campaign.escalationTier).toBe(3);
      expect(result.campaign.currentTick).toBe(100);
    });

    it('should backfill missing directorSettings', () => {
      const campaignWithoutSettings: Partial<CampaignData> = {
        id: 'test-123',
        meta: { 
          name: 'Test', 
          primaryGenre: 'fantasy',
          secondaryGenres: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          playTime: 0,
          chapterCount: 1,
        },
        player: { name: 'Hero' } as any,
        settings: {
          adultContent: false,
          cheatMode: false,
          // Missing directorSettings
        } as any,
      };

      const result = normalizeCampaign(campaignWithoutSettings);

      expect(result.campaign.settings).toBeDefined();
      expect(result.campaign.settings?.directorSettings).toBeDefined();
      expect(result.campaign.settings?.directorSettings?.enabled).toBeDefined();
    });

    it('should backfill missing player stats', () => {
      const campaignWithPartialPlayer: Partial<CampaignData> = {
        id: 'test-123',
        player: {
          name: 'Partial Hero',
          level: 5,
          // Missing stats, skills, etc.
        } as any,
      };

      const result = normalizeCampaign(campaignWithPartialPlayer);

      expect(result.campaign.player.stats).toBeDefined();
      expect(result.campaign.player.stats.strength).toBeDefined();
      expect(result.campaign.player.stats.dexterity).toBeDefined();
      expect(result.campaign.player.skills).toEqual([]);
      expect(result.campaign.player.inventory).toEqual([]);
    });

    it('should convert non-array narrativeHistory to empty array', () => {
      const campaignWithBadHistory: Partial<CampaignData> = {
        id: 'test-123',
        narrativeHistory: 'not an array' as any,
      };

      const result = normalizeCampaign(campaignWithBadHistory);

      expect(Array.isArray(result.campaign.narrativeHistory)).toBe(true);
      expect(result.campaign.narrativeHistory).toEqual([]);
      expect(result.wasModified).toBe(true);
      // The conversion message may be added later after initial backfill
      expect(result.backfilledFields.some(f => f.includes('narrativeHistory'))).toBe(true);
    });

    it('should add schema version marker', () => {
      const result = normalizeCampaign({ id: 'test' });

      expect((result.campaign as any).__schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    });

    it('should report all backfilled fields', () => {
      const emptyCampaign = { id: 'test' };
      const result = normalizeCampaign(emptyCampaign);

      expect(result.backfilledFields.length).toBeGreaterThan(0);
      expect(result.wasModified).toBe(true);
    });
  });

  describe('validateCampaign', () => {
    it('should validate a complete campaign as valid', () => {
      const campaign = createMinimalCampaign();
      const result = validateCampaign(campaign);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null input', () => {
      const result = validateCampaign(null);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject campaign without id', () => {
      const result = validateCampaign({ meta: {}, player: {} });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('ID'))).toBe(true);
    });
  });

  describe('createMinimalCampaign', () => {
    it('should create a valid minimal campaign', () => {
      const campaign = createMinimalCampaign();

      expect(campaign.id).toMatch(/^recovery_/);
      expect(campaign.meta.name).toBe('Recovered Campaign');
      expect(campaign.player).toBeDefined();
      expect(campaign.settings).toBeDefined();
      expect(campaign.narrativeHistory).toEqual([]);
      expect(campaign.checkpoints).toEqual([]);
    });

    it('should pass validation', () => {
      const campaign = createMinimalCampaign();
      const validation = validateCampaign(campaign);

      expect(validation.isValid).toBe(true);
    });
  });

  describe('normalizeCheckpoint', () => {
    it('should return null for invalid input', () => {
      expect(normalizeCheckpoint(null)).toBeNull();
      expect(normalizeCheckpoint(undefined)).toBeNull();
      expect(normalizeCheckpoint('string')).toBeNull();
      expect(normalizeCheckpoint({})).toBeNull();
    });

    it('should normalize a valid checkpoint', () => {
      const checkpoint = {
        id: 'cp-1',
        label: 'Before boss fight',
        player: { name: 'Hero' },
      };

      const result = normalizeCheckpoint(checkpoint);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cp-1');
      expect(result?.label).toBe('Before boss fight');
      expect(result?.player.name).toBe('Hero');
      expect(result?.createdAt).toBeDefined();
      expect(result?.escalationTier).toBe(1);
    });

    it('should preserve existing checkpoint data', () => {
      const checkpoint = {
        id: 'cp-1',
        label: 'Test',
        createdAt: 12345,
        escalationTier: 5,
        currentTick: 100,
        player: { name: 'Hero', level: 10 },
        narrativeHistory: [{ id: '1', content: 'test' }],
      };

      const result = normalizeCheckpoint(checkpoint);

      expect(result?.createdAt).toBe(12345);
      expect(result?.escalationTier).toBe(5);
      expect(result?.currentTick).toBe(100);
      expect(result?.narrativeHistory).toHaveLength(1);
    });
  });
});
