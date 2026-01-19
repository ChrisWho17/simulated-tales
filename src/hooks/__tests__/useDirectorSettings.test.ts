import { describe, it, expect } from 'vitest';
import { useDirectorSettings } from '../useDirectorSettings';
import { DEFAULT_DIRECTOR_SETTINGS } from '@/game/directorModeSystem';

describe('useDirectorSettings', () => {
  describe('default values', () => {
    it('should export the hook function', () => {
      expect(typeof useDirectorSettings).toBe('function');
    });

    it('should have correct default director settings structure', () => {
      expect(DEFAULT_DIRECTOR_SETTINGS).toHaveProperty('enabled');
      expect(DEFAULT_DIRECTOR_SETTINGS).toHaveProperty('directorType');
      expect(DEFAULT_DIRECTOR_SETTINGS).toHaveProperty('tightness');
      expect(DEFAULT_DIRECTOR_SETTINGS).toHaveProperty('cruelty');
      expect(DEFAULT_DIRECTOR_SETTINGS).toHaveProperty('weirdness');
      expect(DEFAULT_DIRECTOR_SETTINGS).toHaveProperty('guidance');
    });

    it('should have enabled by default', () => {
      expect(DEFAULT_DIRECTOR_SETTINGS.enabled).toBe(true);
    });

    it('should have balanced director type by default', () => {
      expect(DEFAULT_DIRECTOR_SETTINGS.directorType).toBe('balanced');
    });

    it('should have numeric sliders in valid range', () => {
      expect(DEFAULT_DIRECTOR_SETTINGS.tightness).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_DIRECTOR_SETTINGS.tightness).toBeLessThanOrEqual(1);
      expect(DEFAULT_DIRECTOR_SETTINGS.cruelty).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_DIRECTOR_SETTINGS.cruelty).toBeLessThanOrEqual(1);
    });
  });
});
