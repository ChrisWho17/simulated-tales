// Comprehensive Skill Check System - RPG dice-roll mechanics with AI integration
// Supports modifiers, degrees of success, contested checks, and skill progression

import { LifeSimPlayerState, PlayerSkills } from '@/types/lifeSim';

// ============= SKILL CHECK TYPES =============

export type SkillCategory = 'physical' | 'social' | 'practical' | 'intimate';
export type DifficultyLevel = 'trivial' | 'easy' | 'moderate' | 'hard' | 'very_hard' | 'legendary';
export type SuccessDegree = 'critical_fail' | 'fail' | 'partial' | 'success' | 'critical_success';

export interface SkillModifier {
  source: string;
  value: number;
  temporary?: boolean;
  duration?: number; // ticks
}

export interface SkillCheckResult {
  success: boolean;
  degree: SuccessDegree;
  roll: number;
  targetNumber: number;
  totalModifier: number;
  margin: number; // How much over/under the target
  skillUsed: string;
  narrativeHint: string;
  xpGained: number;
}

export interface ContestedCheckResult {
  winner: 'player' | 'npc' | 'tie';
  playerResult: SkillCheckResult;
  npcResult: SkillCheckResult;
  marginOfVictory: number;
  narrativeHint: string;
}

// ============= DIFFICULTY THRESHOLDS =============

export const DIFFICULTY_TARGETS: Record<DifficultyLevel, number> = {
  trivial: 20,
  easy: 35,
  moderate: 50,
  hard: 65,
  very_hard: 80,
  legendary: 95,
};

// ============= DICE ROLLING =============

/**
 * Roll a d100 with optional advantage/disadvantage
 */
export function rollD100(advantage: 'none' | 'advantage' | 'disadvantage' = 'none'): number {
  const roll1 = Math.floor(Math.random() * 100) + 1;
  
  if (advantage === 'none') return roll1;
  
  const roll2 = Math.floor(Math.random() * 100) + 1;
  
  if (advantage === 'advantage') {
    return Math.max(roll1, roll2);
  } else {
    return Math.min(roll1, roll2);
  }
}

/**
 * Get a skill value from the player state
 */
export function getSkillValue(skills: PlayerSkills, category: SkillCategory, skillName: string): number {
  const categorySkills = skills[category];
  if (!categorySkills) return 0;
  
  return (categorySkills as unknown as Record<string, number>)[skillName] || 0;
}

/**
 * Calculate the degree of success based on roll and target
 */
export function calculateSuccessDegree(roll: number, targetNumber: number, margin: number): SuccessDegree {
  // Critical results on extremes
  if (roll <= 5) return 'critical_success';
  if (roll >= 96) return 'critical_fail';
  
  // Normal degrees
  if (margin >= 20) return 'critical_success';
  if (margin >= 0) return 'success';
  if (margin >= -10) return 'partial';
  if (margin >= -30) return 'fail';
  return 'critical_fail';
}

/**
 * Generate narrative hint based on success degree
 */
function generateNarrativeHint(skillName: string, degree: SuccessDegree, context?: string): string {
  const hints: Record<SuccessDegree, string[]> = {
    critical_success: [
      `Your mastery of ${skillName} is undeniable.`,
      `A perfect execution that impresses everyone.`,
      `You exceed all expectations.`,
    ],
    success: [
      `You successfully apply your ${skillName}.`,
      `It works as intended.`,
      `A competent performance.`,
    ],
    partial: [
      `You partially succeed, but with complications.`,
      `It works, but not quite as planned.`,
      `A mixed result with unintended consequences.`,
    ],
    fail: [
      `Your ${skillName} proves insufficient.`,
      `Things don't go as planned.`,
      `You struggle and fail.`,
    ],
    critical_fail: [
      `A disastrous failure that may have consequences.`,
      `Everything goes wrong in the worst way.`,
      `Your overconfidence leads to catastrophe.`,
    ],
  };
  
  const options = hints[degree];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Perform a skill check
 */
export function performSkillCheck(
  skills: PlayerSkills,
  category: SkillCategory,
  skillName: string,
  difficulty: DifficultyLevel,
  modifiers: SkillModifier[] = [],
  advantage: 'none' | 'advantage' | 'disadvantage' = 'none'
): SkillCheckResult {
  const baseSkill = getSkillValue(skills, category, skillName);
  const totalModifier = modifiers.reduce((sum, m) => sum + m.value, 0);
  const effectiveSkill = baseSkill + totalModifier;
  
  const roll = rollD100(advantage);
  const targetNumber = DIFFICULTY_TARGETS[difficulty];
  
  // Skill check: roll under (skill - difficulty) + 50
  // Higher skill = better chance, higher difficulty = lower target
  const adjustedTarget = Math.min(95, Math.max(5, effectiveSkill - targetNumber + 50));
  const margin = adjustedTarget - roll;
  const success = roll <= adjustedTarget;
  
  const degree = calculateSuccessDegree(roll, adjustedTarget, margin);
  
  // XP based on difficulty and outcome
  let xpGained = 0;
  if (success) {
    xpGained = Math.floor((targetNumber / 20) * (degree === 'critical_success' ? 2 : 1));
  } else if (degree === 'partial') {
    xpGained = Math.floor(targetNumber / 40);
  }
  
  return {
    success,
    degree,
    roll,
    targetNumber: adjustedTarget,
    totalModifier,
    margin,
    skillUsed: `${category}.${skillName}`,
    narrativeHint: generateNarrativeHint(skillName, degree),
    xpGained,
  };
}

/**
 * Perform a contested check between player and NPC
 */
export function performContestedCheck(
  playerSkills: PlayerSkills,
  playerCategory: SkillCategory,
  playerSkillName: string,
  playerModifiers: SkillModifier[],
  npcSkillValue: number,
  npcModifiers: SkillModifier[] = []
): ContestedCheckResult {
  // Player roll
  const playerBase = getSkillValue(playerSkills, playerCategory, playerSkillName);
  const playerTotal = playerBase + playerModifiers.reduce((sum, m) => sum + m.value, 0);
  const playerRoll = rollD100();
  const playerMargin = playerTotal - playerRoll;
  
  // NPC roll
  const npcTotal = npcSkillValue + npcModifiers.reduce((sum, m) => sum + m.value, 0);
  const npcRoll = rollD100();
  const npcMargin = npcTotal - npcRoll;
  
  // Determine winner
  let winner: 'player' | 'npc' | 'tie';
  const marginDiff = playerMargin - npcMargin;
  
  if (Math.abs(marginDiff) < 5) {
    winner = 'tie';
  } else if (marginDiff > 0) {
    winner = 'player';
  } else {
    winner = 'npc';
  }
  
  const playerResult: SkillCheckResult = {
    success: playerMargin >= 0,
    degree: calculateSuccessDegree(playerRoll, playerTotal, playerMargin),
    roll: playerRoll,
    targetNumber: playerTotal,
    totalModifier: playerModifiers.reduce((sum, m) => sum + m.value, 0),
    margin: playerMargin,
    skillUsed: `${playerCategory}.${playerSkillName}`,
    narrativeHint: generateNarrativeHint(playerSkillName, calculateSuccessDegree(playerRoll, playerTotal, playerMargin)),
    xpGained: winner === 'player' ? 2 : 1,
  };
  
  const npcResult: SkillCheckResult = {
    success: npcMargin >= 0,
    degree: calculateSuccessDegree(npcRoll, npcTotal, npcMargin),
    roll: npcRoll,
    targetNumber: npcTotal,
    totalModifier: npcModifiers.reduce((sum, m) => sum + m.value, 0),
    margin: npcMargin,
    skillUsed: 'npc_skill',
    narrativeHint: '',
    xpGained: 0,
  };
  
  const narrativeHints: Record<string, string> = {
    player_critical: 'You completely outmatch your opponent.',
    player_win: 'You prevail in the contest.',
    tie: 'Neither side gains the upper hand.',
    npc_win: 'Your opponent bests you.',
    npc_critical: 'Your opponent utterly dominates.',
  };
  
  let narrativeHint = narrativeHints.tie;
  if (winner === 'player') {
    narrativeHint = playerResult.degree === 'critical_success' ? narrativeHints.player_critical : narrativeHints.player_win;
  } else if (winner === 'npc') {
    narrativeHint = npcResult.degree === 'critical_success' ? narrativeHints.npc_critical : narrativeHints.npc_win;
  }
  
  return {
    winner,
    playerResult,
    npcResult,
    marginOfVictory: Math.abs(marginDiff),
    narrativeHint,
  };
}

// ============= SITUATIONAL MODIFIERS =============

export interface SituationalModifiers {
  lighting: number;      // -20 (dark) to +10 (perfect)
  weather: number;       // -15 (storm) to +5 (clear)
  fatigue: number;       // -30 (exhausted) to 0 (rested)
  injury: number;        // -40 (critical) to 0 (healthy)
  tools: number;         // 0 (none) to +20 (masterwork)
  assistance: number;    // 0 (solo) to +15 (expert help)
  stress: number;        // -20 (panicked) to +5 (calm focus)
  relationship: number;  // -15 (hostile) to +15 (trusted)
}

export function calculateSituationalModifiers(
  playerState: LifeSimPlayerState,
  context: {
    lighting?: 'dark' | 'dim' | 'normal' | 'bright';
    weather?: 'storm' | 'rain' | 'cloudy' | 'clear';
    hasTools?: boolean;
    toolQuality?: 'poor' | 'normal' | 'good' | 'masterwork';
    hasAssistance?: boolean;
    relationshipLevel?: number; // -100 to 100
  }
): SkillModifier[] {
  const modifiers: SkillModifier[] = [];
  
  // Energy/fatigue
  if (playerState.needs.physical.energy <= 20) {
    modifiers.push({ source: 'Exhaustion', value: -25 });
  } else if (playerState.needs.physical.energy <= 40) {
    modifiers.push({ source: 'Fatigue', value: -10 });
  }
  
  // Health/injury
  if (playerState.needs.physical.health <= 30) {
    modifiers.push({ source: 'Serious Injury', value: -30 });
  } else if (playerState.needs.physical.health <= 60) {
    modifiers.push({ source: 'Minor Injury', value: -10 });
  }
  
  // Stress
  if (playerState.needs.psychological.stress >= 80) {
    modifiers.push({ source: 'Panicked', value: -20 });
  } else if (playerState.needs.psychological.stress >= 60) {
    modifiers.push({ source: 'Stressed', value: -10 });
  } else if (playerState.needs.psychological.stress <= 20) {
    modifiers.push({ source: 'Calm Focus', value: 5 });
  }
  
  // Hunger/thirst
  if (playerState.needs.physical.hunger <= 20) {
    modifiers.push({ source: 'Starving', value: -15 });
  }
  if (playerState.needs.physical.thirst <= 20) {
    modifiers.push({ source: 'Dehydrated', value: -15 });
  }
  
  // Lighting
  const lightingMods: Record<string, number> = {
    dark: -20,
    dim: -10,
    normal: 0,
    bright: 5,
  };
  if (context.lighting && context.lighting !== 'normal') {
    modifiers.push({ source: `Lighting (${context.lighting})`, value: lightingMods[context.lighting] });
  }
  
  // Weather
  const weatherMods: Record<string, number> = {
    storm: -15,
    rain: -10,
    cloudy: -5,
    clear: 0,
  };
  if (context.weather && weatherMods[context.weather] !== 0) {
    modifiers.push({ source: `Weather (${context.weather})`, value: weatherMods[context.weather] });
  }
  
  // Tools
  if (context.hasTools) {
    const toolMods: Record<string, number> = {
      poor: 5,
      normal: 10,
      good: 15,
      masterwork: 20,
    };
    modifiers.push({ source: `Tools (${context.toolQuality || 'normal'})`, value: toolMods[context.toolQuality || 'normal'] });
  }
  
  // Assistance
  if (context.hasAssistance) {
    modifiers.push({ source: 'Assistance', value: 10 });
  }
  
  // Relationship (for social checks)
  if (context.relationshipLevel !== undefined) {
    const relMod = Math.floor(context.relationshipLevel / 10);
    if (relMod !== 0) {
      modifiers.push({ source: 'Relationship', value: relMod });
    }
  }
  
  return modifiers;
}

// ============= SKILL PROGRESSION =============

export interface SkillProgress {
  currentXP: number;
  xpToNextLevel: number;
  recentChecks: number; // For diminishing returns
  lastUsedTick: number;
}

export function calculateXPToLevel(currentLevel: number): number {
  // Exponential XP curve
  return Math.floor(10 * Math.pow(1.5, Math.floor(currentLevel / 10)));
}

export function addSkillXP(
  skills: PlayerSkills,
  category: SkillCategory,
  skillName: string,
  xp: number
): { skills: PlayerSkills; levelUp: boolean; newLevel: number } {
  const currentValue = getSkillValue(skills, category, skillName);
  const xpNeeded = calculateXPToLevel(currentValue);
  
  // For simplicity, direct XP -> skill increase (1 XP per skill point threshold)
  const effectiveXP = xp;
  const shouldLevelUp = effectiveXP >= 5 && Math.random() < 0.2; // 20% chance per 5 XP
  
  if (!shouldLevelUp || currentValue >= 100) {
    return { skills, levelUp: false, newLevel: currentValue };
  }
  
  const newSkills = { ...skills };
  const categorySkills = { ...newSkills[category] } as Record<string, number>;
  categorySkills[skillName] = Math.min(100, currentValue + 1);
  newSkills[category] = categorySkills as any;
  
  return { skills: newSkills, levelUp: true, newLevel: categorySkills[skillName] };
}

// ============= ACTION SKILL MAPPINGS =============

export interface ActionSkillRequirement {
  primary: { category: SkillCategory; skill: string };
  secondary?: { category: SkillCategory; skill: string; weight: number };
  defaultDifficulty: DifficultyLevel;
}

export const ACTION_SKILL_MAP: Record<string, ActionSkillRequirement> = {
  // Physical actions
  climb: { primary: { category: 'physical', skill: 'athletics' }, defaultDifficulty: 'moderate' },
  run: { primary: { category: 'physical', skill: 'athletics' }, defaultDifficulty: 'easy' },
  fight: { primary: { category: 'physical', skill: 'combat' }, defaultDifficulty: 'moderate' },
  dodge: { primary: { category: 'physical', skill: 'athletics' }, defaultDifficulty: 'moderate' },
  dance: { primary: { category: 'physical', skill: 'dance' }, defaultDifficulty: 'moderate' },
  
  // Social actions
  persuade: { primary: { category: 'social', skill: 'persuasion' }, defaultDifficulty: 'moderate' },
  deceive: { primary: { category: 'social', skill: 'deception' }, defaultDifficulty: 'hard' },
  intimidate: { primary: { category: 'social', skill: 'intimidation' }, defaultDifficulty: 'moderate' },
  charm: { primary: { category: 'social', skill: 'charm' }, defaultDifficulty: 'moderate' },
  seduce: { 
    primary: { category: 'social', skill: 'seduction' }, 
    secondary: { category: 'intimate', skill: 'romance', weight: 0.3 },
    defaultDifficulty: 'hard' 
  },
  
  // Practical actions
  cook: { primary: { category: 'practical', skill: 'domestic' }, defaultDifficulty: 'easy' },
  craft: { primary: { category: 'practical', skill: 'crafting' }, defaultDifficulty: 'moderate' },
  heal: { primary: { category: 'practical', skill: 'medicine' }, defaultDifficulty: 'hard' },
  survive: { primary: { category: 'practical', skill: 'survival' }, defaultDifficulty: 'moderate' },
  forage: { primary: { category: 'practical', skill: 'survival' }, defaultDifficulty: 'easy' },
  
  // Stealth/cunning
  steal: { 
    primary: { category: 'social', skill: 'deception' }, 
    secondary: { category: 'physical', skill: 'athletics', weight: 0.3 },
    defaultDifficulty: 'hard' 
  },
  hide: { primary: { category: 'physical', skill: 'athletics' }, defaultDifficulty: 'moderate' },
  lockpick: { primary: { category: 'practical', skill: 'crafting' }, defaultDifficulty: 'hard' },
};

/**
 * Get the skill requirement for an action
 */
export function getActionSkillRequirement(action: string): ActionSkillRequirement | null {
  return ACTION_SKILL_MAP[action.toLowerCase()] || null;
}

/**
 * Perform an action skill check with all modifiers
 */
export function performActionCheck(
  action: string,
  playerState: LifeSimPlayerState,
  difficultyOverride?: DifficultyLevel,
  contextModifiers: SkillModifier[] = [],
  situationalContext?: Parameters<typeof calculateSituationalModifiers>[1]
): SkillCheckResult | null {
  const requirement = getActionSkillRequirement(action);
  if (!requirement) return null;
  
  const difficulty = difficultyOverride || requirement.defaultDifficulty;
  const situationalMods = situationalContext 
    ? calculateSituationalModifiers(playerState, situationalContext)
    : [];
  
  const allModifiers = [...contextModifiers, ...situationalMods];
  
  // Add secondary skill bonus if applicable
  if (requirement.secondary) {
    const secondaryValue = getSkillValue(
      playerState.skills,
      requirement.secondary.category,
      requirement.secondary.skill
    );
    allModifiers.push({
      source: `Secondary: ${requirement.secondary.skill}`,
      value: Math.floor(secondaryValue * requirement.secondary.weight),
    });
  }
  
  return performSkillCheck(
    playerState.skills,
    requirement.primary.category,
    requirement.primary.skill,
    difficulty,
    allModifiers
  );
}

// ============= NARRATIVE INTEGRATION =============

export function formatSkillCheckForNarrative(result: SkillCheckResult, actionDescription: string): string {
  const degreeText: Record<SuccessDegree, string> = {
    critical_success: '**Critical Success!**',
    success: '**Success**',
    partial: '*Partial Success*',
    fail: '*Failure*',
    critical_fail: '**Critical Failure!**',
  };
  
  const modifierText = result.totalModifier !== 0 
    ? ` (${result.totalModifier > 0 ? '+' : ''}${result.totalModifier} modifier)`
    : '';
  
  return `*[Skill Check: ${result.skillUsed}${modifierText}]*\n${degreeText[result.degree]} ${result.narrativeHint}\n\n${actionDescription}`;
}
