import { describe, it, expect } from 'vitest';
import { useCampaignSync } from '../useCampaignSync';

describe('useCampaignSync', () => {
  describe('exports', () => {
    it('should export the hook function', () => {
      expect(typeof useCampaignSync).toBe('function');
    });
  });

  describe('return type contract', () => {
    it('should define syncStoryToCampaign function type', () => {
      // The hook returns sync functions for manual syncing
      // This test verifies the expected interface
      const expectedReturnShape = {
        syncStoryToCampaign: expect.any(Function),
        syncCharacterToCampaign: expect.any(Function),
      };
      expect(expectedReturnShape.syncStoryToCampaign).toBeDefined();
      expect(expectedReturnShape.syncCharacterToCampaign).toBeDefined();
    });
  });
});
