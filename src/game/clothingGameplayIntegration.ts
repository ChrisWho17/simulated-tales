// Clothing Gameplay Integration - Connects wardrobe stats to skill checks and combat
// This module provides the bridge between clothing stats and game mechanics

import { ClothingStats } from './clothingItemSystem';
import { wardrobeManager } from './wardrobeSystem';
import { fashionReputationManager } from './fashionReputationSystem';
import { SkillModifier } from './skillCheckSystem';
import { CombatantStats } from './combatSystem';

// ============= SKILL CHECK INTEGRATION =============

/**
 * Get all clothing-based modifiers for skill checks
 * These modifiers stack with other situational modifiers
 */
export function getClothingSkillModifiers(
  skillCategory: 'physical' | 'social' | 'practical' | 'intimate',
  specificSkill: string
): SkillModifier[] {
  const modifiers: SkillModifier[] = [];
  const clothingStats = wardrobeManager.getCurrentStats();
  const fashionBonuses = fashionReputationManager.getStatBonuses();
  
  // Apply charisma bonus to social skills
  if (skillCategory === 'social') {
    const charismaTotal = (clothingStats.charisma || 0) + (fashionBonuses.charisma || 0);
    if (charismaTotal !== 0) {
      modifiers.push({
        source: 'Outfit Charisma',
        value: charismaTotal * 2, // Each point of charisma = +2 to social checks
      });
    }
  }
  
  // Apply intimidation bonus to specific skills
  if (specificSkill === 'intimidation' || specificSkill === 'combat') {
    const intimidationBonus = clothingStats.intimidation || 0;
    if (intimidationBonus > 0) {
      modifiers.push({
        source: 'Intimidating Attire',
        value: intimidationBonus * 2,
      });
    }
  }
  
  // Apply stealth bonus
  if (specificSkill === 'stealth' || specificSkill === 'pickpocket') {
    const stealthBonus = clothingStats.stealth || 0;
    if (stealthBonus !== 0) {
      modifiers.push({
        source: 'Outfit Stealth',
        value: stealthBonus * 2,
      });
    }
  }
  
  // Apply perception bonus
  if (specificSkill === 'observation' || specificSkill === 'investigation') {
    const perceptionBonus = clothingStats.perception || 0;
    if (perceptionBonus > 0) {
      modifiers.push({
        source: 'Enhanced Perception',
        value: perceptionBonus * 2,
      });
    }
  }
  
  // Apply luck bonus to any check (small universal bonus)
  const luckBonus = clothingStats.luck || 0;
  if (luckBonus > 0) {
    modifiers.push({
      source: 'Lucky Outfit',
      value: luckBonus, // Luck gives +1 per point (smaller but universal)
    });
  }
  
  return modifiers;
}

/**
 * Get a single combined modifier value for simpler integrations
 */
export function getClothingModifierTotal(
  skillCategory: 'physical' | 'social' | 'practical' | 'intimate',
  specificSkill: string
): number {
  const modifiers = getClothingSkillModifiers(skillCategory, specificSkill);
  return modifiers.reduce((sum, mod) => sum + mod.value, 0);
}

// ============= COMBAT INTEGRATION =============

/**
 * Apply clothing bonuses to combat stats
 * Returns modified combat stats with clothing effects applied
 */
export function applyClothingToCombatStats(baseStats: CombatantStats): CombatantStats {
  const clothingStats = wardrobeManager.getCurrentStats();
  const fashionBonuses = fashionReputationManager.getStatBonuses();
  
  return {
    ...baseStats,
    // Defense directly reduces damage taken
    armorProtection: baseStats.armorProtection + (clothingStats.defense || 0) * 2,
    
    // Intimidation improves intimidation skill in combat
    intimidationSkill: baseStats.intimidationSkill + 
      ((clothingStats.intimidation || 0) + (fashionBonuses.charisma || 0)) * 2,
    
    // Charisma improves persuasion (for talk_down action)
    persuasionSkill: baseStats.persuasionSkill + 
      ((clothingStats.charisma || 0) + (fashionBonuses.charisma || 0)) * 2,
    
    // Stealth affects dodge skill (can avoid attacks better)
    dodgeSkill: baseStats.dodgeSkill + (clothingStats.stealth || 0),
  };
}

/**
 * Get clothing-based combat modifiers as SkillModifiers for combat resolution
 */
export function getClothingCombatModifiers(): SkillModifier[] {
  const modifiers: SkillModifier[] = [];
  const clothingStats = wardrobeManager.getCurrentStats();
  
  if (clothingStats.defense && clothingStats.defense > 0) {
    modifiers.push({
      source: 'Protective Clothing',
      value: clothingStats.defense,
    });
  }
  
  if (clothingStats.intimidation && clothingStats.intimidation > 0) {
    modifiers.push({
      source: 'Intimidating Look',
      value: clothingStats.intimidation,
    });
  }
  
  return modifiers;
}

// ============= DICE ROLL INTEGRATION =============

/**
 * Get luck modifier for dice rolls
 * Luck affects critical hit/miss chances
 */
export function getLuckModifier(): { value: number; description: string } {
  const clothingStats = wardrobeManager.getCurrentStats();
  const luck = clothingStats.luck || 0;
  
  if (luck === 0) {
    return { value: 0, description: '' };
  }
  
  return {
    value: luck,
    description: luck > 0 
      ? `Lucky outfit (+${luck} to rolls)` 
      : `Unlucky outfit (${luck} to rolls)`,
  };
}

/**
 * Adjust critical threshold based on luck
 * Higher luck = better chance of criticals
 */
export function adjustCriticalThreshold(baseThreshold: number): number {
  const clothingStats = wardrobeManager.getCurrentStats();
  const luck = clothingStats.luck || 0;
  
  // Each point of luck reduces critical threshold by 1
  // (e.g., base 95 for crit success becomes 94 with 1 luck)
  return Math.max(80, baseThreshold - luck);
}

// ============= NPC REACTION INTEGRATION =============

/**
 * Get NPC first impression modifier based on clothing
 * Affects initial disposition of NPCs
 */
export function getFirstImpressionModifier(): {
  value: number;
  factors: { source: string; value: number }[];
} {
  const factors: { source: string; value: number }[] = [];
  const clothingStats = wardrobeManager.getCurrentStats();
  const fashionBonuses = fashionReputationManager.getStatBonuses();
  const wardrobeState = wardrobeManager.getState();
  
  // Charisma from clothing
  const charisma = (clothingStats.charisma || 0);
  if (charisma > 0) {
    factors.push({ source: 'Stylish outfit', value: charisma });
  }
  
  // Fashion reputation perks
  const fashionCharisma = fashionBonuses.charisma || 0;
  if (fashionCharisma > 0) {
    factors.push({ source: 'Fashion reputation', value: fashionCharisma });
  }
  
  // Style matching (higher value clothing = better impression in formal settings)
  if (wardrobeState.activeStyle === 'formal' || wardrobeState.activeStyle === 'elegant') {
    factors.push({ source: 'Formal attire', value: 2 });
  }
  
  // Intimidation can have negative first impression for non-combat situations
  const intimidation = clothingStats.intimidation || 0;
  if (intimidation > 2) {
    factors.push({ source: 'Threatening appearance', value: -1 });
  }
  
  const totalValue = factors.reduce((sum, f) => sum + f.value, 0);
  
  return { value: totalValue, factors };
}

// ============= GENRE-SPECIFIC BONUSES =============

/**
 * Get genre-specific clothing bonuses
 * Some clothing has special effects in certain genres
 */
export function getGenreClothingBonus(genre: string): {
  stat: string;
  value: number;
  description: string;
} | null {
  const equippedItems = wardrobeManager.getEquippedList();
  
  for (const wi of equippedItems) {
    const genreBonus = wi.item.stats.genreBonus;
    if (genreBonus && genreBonus.genre.toLowerCase() === genre.toLowerCase()) {
      return {
        stat: genreBonus.stat,
        value: genreBonus.value,
        description: `${wi.item.name} is especially effective in ${genre} settings`,
      };
    }
  }
  
  return null;
}

// ============= CONTEXT BUILDER FOR AI =============

/**
 * Build comprehensive clothing context for AI storytelling
 */
export function buildClothingGameplayContext(): string {
  const lines: string[] = [];
  const clothingStats = wardrobeManager.getCurrentStats();
  const fashionBonuses = fashionReputationManager.getStatBonuses();
  
  // Check if player has significant clothing bonuses
  const hasStats = Object.values(clothingStats).some(v => typeof v === 'number' && v !== 0);
  
  if (!hasStats && Object.keys(fashionBonuses).length === 0) {
    return '';
  }
  
  lines.push('CLOTHING EFFECTS ON GAMEPLAY:');
  
  // Combat effects
  const defense = clothingStats.defense || 0;
  const intimidation = (clothingStats.intimidation || 0);
  if (defense > 0 || intimidation > 0) {
    lines.push(`Combat: ${defense > 0 ? `+${defense * 2} armor protection` : ''}${defense > 0 && intimidation > 0 ? ', ' : ''}${intimidation > 0 ? `+${intimidation * 2} intimidation` : ''}`);
  }
  
  // Social effects
  const charisma = (clothingStats.charisma || 0) + (fashionBonuses.charisma || 0);
  if (charisma > 0) {
    lines.push(`Social: +${charisma * 2} to persuasion and social checks`);
  }
  
  // Stealth effects
  const stealth = clothingStats.stealth || 0;
  if (stealth !== 0) {
    lines.push(`Stealth: ${stealth > 0 ? '+' : ''}${stealth * 2} to stealth checks`);
  }
  
  // Luck effects
  const luck = clothingStats.luck || 0;
  if (luck > 0) {
    lines.push(`Luck: +${luck} universal bonus, improved critical chances`);
  }
  
  return lines.join('\n');
}

/**
 * Build structured clothing context for AI narration
 * This is passed to the edge function for comprehensive stat integration
 */
export function buildClothingArmorContextForAI(): {
  currentOutfit: string;
  styleCategory: string;
  statModifiers: {
    defense?: number;
    charisma?: number;
    intimidation?: number;
    stealth?: number;
    perception?: number;
    luck?: number;
  };
  effectiveStatChanges: string;
  firstImpressionMod: number;
  specialEffects: string[];
} | null {
  const clothingStats = wardrobeManager.getCurrentStats();
  const fashionBonuses = fashionReputationManager.getStatBonuses();
  const wardrobeState = wardrobeManager.getState();
  const equippedItems = wardrobeManager.getEquippedList();
  
  // Skip if no meaningful equipment
  const hasStats = Object.values(clothingStats).some(v => typeof v === 'number' && v !== 0);
  if (!hasStats && equippedItems.length === 0) {
    return null;
  }
  
  // Build outfit description
  const outfitParts = equippedItems.map(wi => wi.item.name);
  const currentOutfit = outfitParts.length > 0 
    ? outfitParts.join(', ')
    : 'Standard attire';
  
  // Determine style category
  let styleCategory = 'casual';
  if (wardrobeState.activeStyle) {
    styleCategory = wardrobeState.activeStyle;
  } else if (clothingStats.defense && clothingStats.defense > 2) {
    styleCategory = 'combat/armored';
  } else if (clothingStats.intimidation && clothingStats.intimidation > 2) {
    styleCategory = 'intimidating';
  } else if (clothingStats.stealth && clothingStats.stealth > 0) {
    styleCategory = 'stealth/tactical';
  } else if ((clothingStats.charisma || 0) + (fashionBonuses.charisma || 0) > 2) {
    styleCategory = 'formal/elegant';
  }
  
  // Compile stat modifiers
  const statModifiers: Record<string, number> = {};
  if (clothingStats.defense) statModifiers.defense = clothingStats.defense;
  if (clothingStats.charisma || fashionBonuses.charisma) {
    statModifiers.charisma = (clothingStats.charisma || 0) + (fashionBonuses.charisma || 0);
  }
  if (clothingStats.intimidation) statModifiers.intimidation = clothingStats.intimidation;
  if (clothingStats.stealth) statModifiers.stealth = clothingStats.stealth;
  if (clothingStats.perception) statModifiers.perception = clothingStats.perception;
  if (clothingStats.luck) statModifiers.luck = clothingStats.luck;
  
  // Build effective stat changes summary
  const changes: string[] = [];
  for (const [stat, value] of Object.entries(statModifiers)) {
    if (value !== 0) {
      changes.push(`${stat} ${value > 0 ? '+' : ''}${value * 2}`);
    }
  }
  const effectiveStatChanges = changes.length > 0 ? changes.join(', ') : 'No significant modifiers';
  
  // Get first impression modifier
  const firstImpressionData = getFirstImpressionModifier();
  
  // Compile special effects
  const specialEffects: string[] = [];
  
  // Check for genre bonuses on equipped items
  for (const wi of equippedItems) {
    if (wi.item.stats.genreBonus) {
      specialEffects.push(`${wi.item.name}: +${wi.item.stats.genreBonus.value} ${wi.item.stats.genreBonus.stat} in ${wi.item.stats.genreBonus.genre} settings`);
    }
  }
  
  // Add fashion level perks
  const unlockedPerks = fashionReputationManager.getUnlockedPerks();
  if (unlockedPerks.length > 0) {
    specialEffects.push(...unlockedPerks.map(p => `Fashion Perk: ${p.name} - ${p.description}`));
  }
  
  return {
    currentOutfit,
    styleCategory,
    statModifiers,
    effectiveStatChanges,
    firstImpressionMod: firstImpressionData.value,
    specialEffects,
  };
}

// ============= EXPORTS FOR EASY INTEGRATION =============

export const ClothingGameplay = {
  getSkillModifiers: getClothingSkillModifiers,
  getModifierTotal: getClothingModifierTotal,
  applyCombatStats: applyClothingToCombatStats,
  getCombatModifiers: getClothingCombatModifiers,
  getLuck: getLuckModifier,
  adjustCritical: adjustCriticalThreshold,
  getFirstImpression: getFirstImpressionModifier,
  getGenreBonus: getGenreClothingBonus,
  buildContext: buildClothingGameplayContext,
  buildAIContext: buildClothingArmorContextForAI,
};
