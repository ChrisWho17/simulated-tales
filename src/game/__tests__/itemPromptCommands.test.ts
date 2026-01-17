/**
 * Tests for Item Prompt Commands
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
