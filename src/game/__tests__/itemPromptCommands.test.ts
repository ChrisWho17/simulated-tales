/**
 * Tests for Item Prompt Commands and Item Reaction System
 */

import { describe, it, expect } from 'vitest';
import { 
  parseItemPromptCommand, 
  getCommandsByCategory,
  getCommandsGrouped,
  buildItemDescriptionFromPrompt,
  getAllItemCommands,
  isItemCommand,
  FIREARM_PROMPTS,
  MELEE_PROMPTS,
  ARMOR_PROMPTS,
  CLOTHING_PROMPTS,
} from '../itemPromptCommands';
import {
  generateItemReaction,
  inferNPCContextFromRole,
  buildItemReactionContext,
} from '../itemReactionSystem';

describe('Item Prompt Commands', () => {
  describe('parseItemPromptCommand', () => {
    it('should parse firearm commands case-insensitively', () => {
      const result1 = parseItemPromptCommand('/rifle');
      const result2 = parseItemPromptCommand('/RIFLE');
      const result3 = parseItemPromptCommand('/Rifle');
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result3).not.toBeNull();
      expect(result1?.name).toBe('Standard Rifle');
    });
    
    it('should parse melee commands', () => {
      const result = parseItemPromptCommand('/sword');
      expect(result).not.toBeNull();
      expect(result?.category).toBe('melee');
    });
    
    it('should parse armor commands', () => {
      const result = parseItemPromptCommand('/platecarrier');
      expect(result).not.toBeNull();
      expect(result?.category).toBe('armor');
    });
    
    it('should parse clothing commands', () => {
      const result = parseItemPromptCommand('/jacket');
      expect(result).not.toBeNull();
      expect(result?.category).toBe('clothing');
    });
    
    it('should parse bayonet command', () => {
      const result = parseItemPromptCommand('/bayonet');
      expect(result).not.toBeNull();
      expect(result?.category).toBe('melee');
    });
    
    it('should return null for non-item commands', () => {
      expect(parseItemPromptCommand('/help')).toBeNull();
      expect(parseItemPromptCommand('rifle')).toBeNull();
      expect(parseItemPromptCommand('/nonexistent')).toBeNull();
    });
  });
  
  describe('getCommandsByCategory', () => {
    it('should return only firearm commands', () => {
      const firearms = getCommandsByCategory('firearm');
      expect(firearms.length).toBeGreaterThan(0);
      expect(firearms.every(p => p.category === 'firearm')).toBe(true);
    });
    
    it('should return only melee commands', () => {
      const melee = getCommandsByCategory('melee');
      expect(melee.length).toBeGreaterThan(0);
      expect(melee.every(p => p.category === 'melee')).toBe(true);
    });
  });
  
  describe('getCommandsGrouped', () => {
    it('should return commands grouped by category', () => {
      const grouped = getCommandsGrouped();
      expect(grouped['Firearms']).toBeDefined();
      expect(grouped['Melee Weapons']).toBeDefined();
      expect(grouped['Armor']).toBeDefined();
      expect(grouped['Clothing']).toBeDefined();
    });
  });
  
  describe('buildItemDescriptionFromPrompt', () => {
    it('should build a complete description', () => {
      const prompt = parseItemPromptCommand('/rifle');
      expect(prompt).not.toBeNull();
      
      const description = buildItemDescriptionFromPrompt(prompt!);
      expect(description).toContain('rifle');
      expect(description).toContain('Visual Details');
    });
  });
  
  describe('isItemCommand', () => {
    it('should detect item commands', () => {
      expect(isItemCommand('/rifle')).toBe(true);
      expect(isItemCommand('/sword')).toBe(true);
      expect(isItemCommand('/help')).toBe(false);
    });
  });
  
  describe('Category separation', () => {
    it('should have separate weapons and armor/clothing', () => {
      // Weapons = firearms + melee
      const weaponCount = FIREARM_PROMPTS.length + MELEE_PROMPTS.length;
      // Armor/Clothing = armor + clothing
      const apparelCount = ARMOR_PROMPTS.length + CLOTHING_PROMPTS.length;
      
      expect(weaponCount).toBeGreaterThan(0);
      expect(apparelCount).toBeGreaterThan(0);
      
      // Verify bayonet is in melee
      expect(MELEE_PROMPTS.some(p => p.command === '/bayonet')).toBe(true);
    });
  });
});

describe('Item Reaction System', () => {
  describe('inferNPCContextFromRole', () => {
    it('should identify military NPCs', () => {
      const ctx = inferNPCContextFromRole('Palace Guard');
      expect(ctx.isMilitary).toBe(true);
      expect(ctx.isCivilian).toBe(false);
    });
    
    it('should identify civilian NPCs', () => {
      const ctx = inferNPCContextFromRole('Local Farmer');
      expect(ctx.isCivilian).toBe(true);
      expect(ctx.isMilitary).toBe(false);
    });
    
    it('should identify criminal NPCs', () => {
      const ctx = inferNPCContextFromRole('Street Thief');
      expect(ctx.isCriminal).toBe(true);
    });
    
    it('should identify noble NPCs', () => {
      const ctx = inferNPCContextFromRole('Duke of the Realm');
      expect(ctx.isNoble).toBe(true);
    });
    
    it('should identify merchant NPCs', () => {
      const ctx = inferNPCContextFromRole('Traveling Merchant');
      expect(ctx.isMerchant).toBe(true);
    });
  });
  
  describe('generateItemReaction', () => {
    it('should generate intimidated reaction for civilians seeing firearms', () => {
      const riflePrompt = parseItemPromptCommand('/rifle')!;
      const npcCtx = { isCivilian: true };
      
      const reaction = generateItemReaction(riflePrompt, npcCtx, 'modern', true);
      
      expect(reaction.type).toBe('intimidated');
      expect(reaction.severity).toBe('moderate');
      expect(reaction.trustModifier).toBeLessThan(0);
      expect(reaction.respectModifier).toBeGreaterThan(0);
    });
    
    it('should generate professional reaction for military NPCs', () => {
      const riflePrompt = parseItemPromptCommand('/rifle')!;
      const npcCtx = { isMilitary: true };
      
      const reaction = generateItemReaction(riflePrompt, npcCtx, 'war', true);
      
      expect(reaction.type).toBe('professional');
      expect(reaction.respectModifier).toBeGreaterThan(0);
    });
    
    it('should return neutral for non-visible items', () => {
      const riflePrompt = parseItemPromptCommand('/rifle')!;
      const npcCtx = { isCivilian: true };
      
      const reaction = generateItemReaction(riflePrompt, npcCtx, 'modern', false);
      
      expect(reaction.type).toBe('neutral');
      expect(reaction.severity).toBe('none');
    });
    
    it('should handle melee weapons in fantasy genre', () => {
      const swordPrompt = parseItemPromptCommand('/sword')!;
      const npcCtx = { isMilitary: true };
      
      const reaction = generateItemReaction(swordPrompt, npcCtx, 'fantasy', true);
      
      expect(reaction.type).toBe('professional');
      expect(reaction.severity).toBe('none');
    });
    
    it('should generate intimidated reaction for heavy armor', () => {
      const armorPrompt = parseItemPromptCommand('/platecarrier')!;
      const npcCtx = { isCivilian: true };
      
      const reaction = generateItemReaction(armorPrompt, npcCtx, 'modern', true);
      
      expect(reaction.type).toBe('intimidated');
      expect(reaction.severity).toBe('moderate');
    });
  });
  
  describe('buildItemReactionContext', () => {
    it('should build context for weapons', () => {
      const items = [
        { name: 'Combat Rifle', category: 'weapons', description: 'A military-grade rifle' }
      ];
      
      const context = buildItemReactionContext(items, 'modern');
      
      expect(context).toContain('PLAYER ARMAMENT');
      expect(context).toContain('Combat Rifle');
    });
    
    it('should build context for armor', () => {
      const items = [
        { name: 'Tactical Vest', category: 'armor', description: 'Ballistic protection' }
      ];
      
      const context = buildItemReactionContext(items, 'modern');
      
      expect(context).toContain('PLAYER PROTECTION');
      expect(context).toContain('Tactical Vest');
    });
    
    it('should return empty string for no items', () => {
      const context = buildItemReactionContext([], 'modern');
      expect(context).toBe('');
    });
  });
});
