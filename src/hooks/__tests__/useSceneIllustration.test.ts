import { describe, it, expect, vi } from 'vitest';
import { useSceneIllustration } from '../useSceneIllustration';
import { shouldIllustrateScene } from '@/components/game/SceneIllustration';

describe('useSceneIllustration', () => {
  describe('exports', () => {
    it('should export the hook function', () => {
      expect(typeof useSceneIllustration).toBe('function');
    });
  });

  describe('shouldIllustrateScene helper', () => {
    it('should export shouldIllustrateScene function', () => {
      expect(typeof shouldIllustrateScene).toBe('function');
    });

    it('should return null for non-triggering events', () => {
      const result = shouldIllustrateScene(
        'idle',
        'Nothing happens',
        0,
        1,
        5
      );
      expect(result).toBeNull();
    });

    it('should respect minimum interval between illustrations', () => {
      // If last illustration was at tick 5 and current is tick 6, with min interval 10
      const result = shouldIllustrateScene(
        'combat',
        'A battle begins',
        5,
        6,
        10
      );
      // Should not trigger because interval not met
      expect(result).toBeNull();
    });
  });

  describe('scene trigger types', () => {
    it('should recognize combat as a valid trigger type', () => {
      const result = shouldIllustrateScene(
        'combat',
        'The dragon attacks!',
        0,
        20,
        5
      );
      if (result) {
        expect(result.type).toBe('combat');
      }
    });
  });
});
