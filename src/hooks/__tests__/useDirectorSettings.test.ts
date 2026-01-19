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

    it('should have disabled by default (rawGame mode)', () => {
      // Director mode starts disabled - rawGame is the default experience
      expect(DEFAULT_DIRECTOR_SETTINGS.enabled).toBe(false);
      expect(DEFAULT_DIRECTOR_SETTINGS.rawGame).toBe(true);
    });

    it('should have cinematic director type by default', () => {
      expect(DEFAULT_DIRECTOR_SETTINGS.directorType).toBe('cinematic');
    });

    it('should have valid tightness value', () => {
      expect(DEFAULT_DIRECTOR_SETTINGS.tightness).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_DIRECTOR_SETTINGS.tightness).toBeLessThanOrEqual(1);
    });

    it('should have string-based cruelty, weirdness, and guidance levels', () => {
      expect(typeof DEFAULT_DIRECTOR_SETTINGS.cruelty).toBe('string');
      expect(typeof DEFAULT_DIRECTOR_SETTINGS.weirdness).toBe('string');
      expect(typeof DEFAULT_DIRECTOR_SETTINGS.guidance).toBe('string');
    });
  });
});
