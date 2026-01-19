import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LivingWorldEngine, buildLivingWorldContext } from '../livingWorld/livingWorldEngine';
import { PropertySystem } from '../livingWorld/propertySystem';
import { RivalSystem } from '../livingWorld/rivalSystem';
import { FactionSystem } from '../livingWorld/factionSystem';

describe('LivingWorldEngine', () => {
  beforeEach(() => {
    // Reset systems before each test using safe methods
    vi.spyOn(PropertySystem, 'processTick').mockImplementation(() => {});
    vi.spyOn(RivalSystem, 'processTick').mockImplementation(() => {});
    vi.spyOn(FactionSystem, 'processTick').mockImplementation(() => {});
  });

  describe('processTick', () => {
    it('should process tick on all subsystems', () => {
      const propertySpy = vi.spyOn(PropertySystem, 'processTick');
      const rivalSpy = vi.spyOn(RivalSystem, 'processTick');
      const factionSpy = vi.spyOn(FactionSystem, 'processTick');

      LivingWorldEngine.processTick(1);

      expect(propertySpy).toHaveBeenCalledWith(1);
      expect(rivalSpy).toHaveBeenCalledWith(1);
      expect(factionSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('getPlayerAssets', () => {
    it('should return aggregated player assets', () => {
      const assets = LivingWorldEngine.getPlayerAssets();

      expect(assets).toHaveProperty('properties');
      expect(assets).toHaveProperty('factions');
      expect(assets).toHaveProperty('activeRivals');
      expect(assets).toHaveProperty('totalPropertyValue');
      expect(assets).toHaveProperty('monthlyRent');
      expect(assets).toHaveProperty('monthlyMortgage');
      expect(Array.isArray(assets.properties)).toBe(true);
      expect(Array.isArray(assets.factions)).toBe(true);
      expect(typeof assets.totalPropertyValue).toBe('number');
    });
  });

  describe('getZoneControl', () => {
    it('should return zone control information', () => {
      const control = LivingWorldEngine.getZoneControl('downtown');

      expect(control).toHaveProperty('properties');
      expect(control).toHaveProperty('rivals');
      expect(control).toHaveProperty('factions');
      expect(Array.isArray(control.properties)).toBe(true);
    });
  });

  describe('getPlayerStandingSummary', () => {
    it('should return player standing summary', () => {
      const summary = LivingWorldEngine.getPlayerStandingSummary();

      expect(Array.isArray(summary)).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should serialize state', () => {
      const serialized = LivingWorldEngine.serialize();

      expect(serialized).toHaveProperty('properties');
      expect(serialized).toHaveProperty('rivals');
      expect(serialized).toHaveProperty('factions');
      expect(serialized).toHaveProperty('lastTick');
    });

    it('should handle partial deserialization', () => {
      expect(() => LivingWorldEngine.deserialize({})).not.toThrow();
      expect(() => LivingWorldEngine.deserialize({ lastTick: 12345 })).not.toThrow();
    });
  });

  describe('event system', () => {
    it('should allow event subscription and unsubscription', () => {
      const callback = vi.fn();
      const unsubscribe = LivingWorldEngine.addEventListener(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('buildFullContext', () => {
    it('should build full context string', () => {
      const context = LivingWorldEngine.buildFullContext();
      expect(typeof context).toBe('string');
    });
  });

  describe('buildLivingWorldContext helper', () => {
    it('should return context from engine', () => {
      const context = buildLivingWorldContext();
      expect(typeof context).toBe('string');
    });
  });

  describe('cross-system interactions', () => {
    it('rivalContestProperty should handle non-existent entities gracefully', () => {
      // Should not throw when entities don't exist
      expect(() => {
        LivingWorldEngine.rivalContestProperty('nonexistent_rival', 'nonexistent_property');
      }).not.toThrow();
    });

    it('factionClaimTerritory should handle non-existent factions gracefully', () => {
      expect(() => {
        LivingWorldEngine.factionClaimTerritory('nonexistent_faction', 'zone_1');
      }).not.toThrow();
    });
  });
});
