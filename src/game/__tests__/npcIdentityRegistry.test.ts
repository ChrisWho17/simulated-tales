import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createRegisteredNPC,
  lockNPCIdentity,
  isNPCLocked,
  registerRelationship,
  lockRelationship,
  getRelationship,
  getSiblings,
  getFamilyMembers,
  validateNPCRelationships,
  repairNPCRelationships,
  getNPCRegistry,
  setNPCRegistry,
  clearNPCRegistry,
  generateNPCStats,
  getAllRegisteredNPCs,
  getRegisteredNPC,
  updateNPCAliases,
  buildNPCIdentityContext,
} from '../npcIdentityRegistry';

describe('NPC Identity Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearNPCRegistry();
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  });

  describe('createRegisteredNPC', () => {
    it('should create an NPC with basic config', () => {
      const npcId = createRegisteredNPC({
        name: 'Elena',
        occupation: 'Merchant',
        currentTurn: 0,
      });

      expect(npcId).toContain('npc_');
      
      const npc = getRegisteredNPC(npcId);
      expect(npc).toBeDefined();
      expect(npc?.permanent.name).toBe('Elena');
      expect(npc?.semiPermanent.occupation).toBe('Merchant');
    });

    it('should create an NPC with custom ID', () => {
      const customId = 'npc_custom_test_123';
      const npcId = createRegisteredNPC({
        id: customId,
        name: 'Marcus',
        occupation: 'Guard',
      });

      expect(npcId).toBe(customId);
    });

    it('should create an NPC with aliases', () => {
      const npcId = createRegisteredNPC({
        name: 'John Smith',
        nickname: 'Shadow',
        callsign: 'Viper',
        title: 'Captain',
        occupation: 'Mercenary',
      });

      const npc = getRegisteredNPC(npcId);
      expect(npc?.permanent.aliases.fullName).toBe('John Smith');
      expect(npc?.permanent.aliases.nickname).toBe('Shadow');
      expect(npc?.permanent.aliases.callsign).toBe('Viper');
      expect(npc?.permanent.aliases.title).toBe('Captain');
    });

    it('should generate character stats by default', () => {
      const npcId = createRegisteredNPC({
        name: 'Test NPC',
        occupation: 'Soldier',
      });

      const npc = getRegisteredNPC(npcId);
      expect(npc?.permanent.characterStats).toBeDefined();
      expect(npc?.permanent.characterStats?.stats).toHaveProperty('strength');
      expect(npc?.permanent.characterStats?.stats).toHaveProperty('dexterity');
    });

    it('should skip stats generation when generateStats is false', () => {
      const npcId = createRegisteredNPC({
        name: 'Stat-less NPC',
        generateStats: false,
      });

      const npc = getRegisteredNPC(npcId);
      expect(npc?.permanent.characterStats).toBeUndefined();
    });
  });

  describe('lockNPCIdentity', () => {
    it('should lock an NPC identity', () => {
      const npcId = createRegisteredNPC({ name: 'Lockable NPC' });

      expect(isNPCLocked(npcId)).toBe(false);
      
      lockNPCIdentity(npcId, 'story_critical', 5);
      
      expect(isNPCLocked(npcId)).toBe(true);
    });

    it('should return false for non-existent NPC', () => {
      const result = lockNPCIdentity('non_existent_npc');
      expect(result).toBe(false);
    });
  });

  describe('registerRelationship', () => {
    it('should register a sibling relationship', () => {
      const npc1 = createRegisteredNPC({ name: 'Sister' });
      const npc2 = createRegisteredNPC({ name: 'Brother' });

      const result = registerRelationship(npc1, npc2, 'sibling', 0);
      expect(result).toBe(true);

      const relationship = getRelationship(npc1, npc2);
      expect(relationship).toBeDefined();
      expect(relationship?.type).toBe('sibling');
    });

    it('should return false when NPC does not exist', () => {
      const npc1 = createRegisteredNPC({ name: 'Real NPC' });
      const result = registerRelationship(npc1, 'fake_npc', 'friend', 0);
      expect(result).toBe(false);
    });
  });

  describe('lockRelationship', () => {
    it('should lock a relationship', () => {
      const npc1 = createRegisteredNPC({ name: 'NPC A' });
      const npc2 = createRegisteredNPC({ name: 'NPC B' });
      registerRelationship(npc1, npc2, 'friend', 0);

      lockRelationship(npc1, npc2, 'story_established');

      const relationship = getRelationship(npc1, npc2);
      expect(relationship?.locked).toBe(true);
    });
  });

  describe('getSiblings', () => {
    it('should return siblings for an NPC', () => {
      const npc1 = createRegisteredNPC({ name: 'Sibling 1' });
      const npc2 = createRegisteredNPC({ name: 'Sibling 2' });
      const npc3 = createRegisteredNPC({ name: 'Sibling 3' });
      
      registerRelationship(npc1, npc2, 'sibling', 0);
      registerRelationship(npc1, npc3, 'sibling', 0);

      const siblings = getSiblings(npc1);
      expect(siblings.length).toBe(2);
    });
  });

  describe('validateNPCRelationships', () => {
    it('should return validation errors array', () => {
      createRegisteredNPC({ name: 'Valid NPC' });
      const result = validateNPCRelationships();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('repairNPCRelationships', () => {
    it('should accept validation errors and attempt repair', () => {
      const errors = validateNPCRelationships();
      // Should not throw
      expect(() => repairNPCRelationships(errors)).not.toThrow();
    });
  });

  describe('generateNPCStats', () => {
    it('should generate valid stats', () => {
      const stats = generateNPCStats('soldier');

      expect(stats.stats.strength).toBeGreaterThanOrEqual(3);
      expect(stats.stats.strength).toBeLessThanOrEqual(20);
      expect(stats.level).toBeGreaterThanOrEqual(1);
      expect(stats.maxHealth).toBeGreaterThan(0);
    });

    it('should apply occupation bonuses', () => {
      // Run multiple times to get statistical significance
      const soldierStats = Array.from({ length: 10 }, () => generateNPCStats('soldier'));
      const scholarStats = Array.from({ length: 10 }, () => generateNPCStats('scholar'));

      const avgSoldierStr = soldierStats.reduce((sum, s) => sum + s.stats.strength, 0) / 10;
      const avgScholarInt = scholarStats.reduce((sum, s) => sum + s.stats.intelligence, 0) / 10;

      // Soldiers should generally have higher strength
      // Scholars should generally have higher intelligence
      // This is a probabilistic test
      expect(avgSoldierStr).toBeGreaterThan(8);
      expect(avgScholarInt).toBeGreaterThan(8);
    });
  });

  describe('getAllRegisteredNPCs', () => {
    it('should return all registered NPCs', () => {
      createRegisteredNPC({ name: 'NPC 1' });
      createRegisteredNPC({ name: 'NPC 2' });
      createRegisteredNPC({ name: 'NPC 3' });

      const allNPCs = getAllRegisteredNPCs();
      expect(allNPCs.length).toBe(3);
    });
  });

  describe('buildNPCIdentityContext', () => {
    it('should build context string', () => {
      createRegisteredNPC({ 
        name: 'Context NPC',
        occupation: 'Blacksmith',
      });

      const context = buildNPCIdentityContext();
      expect(typeof context).toBe('string');
    });
  });

  describe('updateNPCAliases', () => {
    it('should update NPC aliases', () => {
      const npcId = createRegisteredNPC({ name: 'Original Name' });

      updateNPCAliases(npcId, { playerNickname: 'My Buddy' });

      const npc = getRegisteredNPC(npcId);
      expect(npc?.permanent.aliases.playerNickname).toBe('My Buddy');
    });
  });

  describe('registry persistence', () => {
    it('should get and set registry', () => {
      const registry = getNPCRegistry();
      expect(registry).toHaveProperty('npcs');
      expect(registry).toHaveProperty('relationships');
      expect(registry).toHaveProperty('families');
      expect(registry).toHaveProperty('lockedIds');

      setNPCRegistry(registry);
    });

    it('should clear registry', () => {
      createRegisteredNPC({ name: 'To Be Cleared' });
      
      clearNPCRegistry();
      
      const allNPCs = getAllRegisteredNPCs();
      expect(allNPCs.length).toBe(0);
    });
  });
});
