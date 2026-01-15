import { useState, useCallback } from 'react';
import { useGameOptional } from '@/contexts/GameContext';
import { useSessionStatsOptional } from '@/components/game/SessionStats';
import { 
  DiceRollResult, 
  performDiceRoll, 
  shouldRollDice, 
  DifficultyTier,
  ModifierSource,
  DicePlayer
} from '@/game/diceSystem';
import { 
  SkillCheckResult,
  performSkillCheck,
  DifficultyLevel,
  SkillCategory,
  SkillModifier
} from '@/game/skillCheckSystem';
import { PlayerSkills } from '@/types/lifeSim';

// Map skill check difficulties to dice difficulties
const DIFFICULTY_MAP: Record<DifficultyLevel, DifficultyTier> = {
  trivial: 'VERY_EASY',
  easy: 'EASY',
  moderate: 'NORMAL',
  hard: 'HARD',
  very_hard: 'VERY_HARD',
  legendary: 'VERY_HARD' // Cap at VERY_HARD
};

// Map action types to skill check categories - complete mapping for all dice actions
const ACTION_TO_SKILL_MAP: Record<string, { category: SkillCategory; skill: string }> = {
  // Combat actions
  COMBAT_ATTACK: { category: 'physical', skill: 'combat' },
  COMBAT_DEFEND: { category: 'physical', skill: 'combat' },
  COMBAT_DODGE: { category: 'physical', skill: 'athletics' },
  ESCAPE: { category: 'physical', skill: 'athletics' },
  RESIST_EFFECT: { category: 'physical', skill: 'athletics' },
  SAVING_THROW: { category: 'physical', skill: 'athletics' },
  
  // Social actions
  INTIMIDATE: { category: 'social', skill: 'intimidation' },
  PERSUADE_MAJOR: { category: 'social', skill: 'persuasion' },
  PERSUADE_MINOR: { category: 'social', skill: 'persuasion' },
  ROMANCE_ADVANCE: { category: 'social', skill: 'seduction' },
  FLIRT: { category: 'social', skill: 'charm' },
  HAGGLE: { category: 'social', skill: 'persuasion' },
  
  // Physical actions
  STEALTH: { category: 'physical', skill: 'athletics' },
  CLIMB: { category: 'physical', skill: 'athletics' },
  SWIM: { category: 'physical', skill: 'athletics' },
  JUMP: { category: 'physical', skill: 'athletics' },
  LIFT: { category: 'physical', skill: 'athletics' },
  ENDURE: { category: 'physical', skill: 'athletics' },
  
  // Practical/mental actions
  PERCEPTION_CHECK: { category: 'practical', skill: 'survival' },
  SEARCH: { category: 'practical', skill: 'survival' },
  LOCKPICK: { category: 'practical', skill: 'crafting' },
  CRAFT: { category: 'practical', skill: 'crafting' },
  HEAL: { category: 'practical', skill: 'medicine' },
  RECALL: { category: 'practical', skill: 'medicine' },
  INSIGHT: { category: 'social', skill: 'charm' },
  CRITICAL_CHOICE: { category: 'practical', skill: 'survival' },
};

export interface DiceRollOptions {
  // D20 system options
  actionType: string;
  difficulty?: DifficultyTier;
  contextModifiers?: ModifierSource[];
  player: DicePlayer;
  
  // Optional skill check backup (for story mode)
  playerSkills?: PlayerSkills;
}

export interface DiceRollState {
  isRolling: boolean;
  currentRoll: DiceRollResult | null;
  lastSkillCheck: SkillCheckResult | null;
}

export interface UseDiceRollReturn {
  state: DiceRollState;
  
  // Perform a dice roll based on current dice mode
  performRoll: (options: DiceRollOptions) => Promise<{
    diceRoll: DiceRollResult | null;
    skillCheck: SkillCheckResult | null;
    shouldDisplay: boolean;
  }>;
  
  // Clear current roll
  clearRoll: () => void;
  
  // Check if should show roll UI
  shouldShowRoll: (actionType: string) => boolean;
}

export function useDiceRoll(): UseDiceRollReturn {
  const gameContext = useGameOptional();
  const sessionStats = useSessionStatsOptional();
  const diceMode = gameContext?.diceMode ?? 'story';
  
  const [state, setState] = useState<DiceRollState>({
    isRolling: false,
    currentRoll: null,
    lastSkillCheck: null
  });
  
  const shouldShowRoll = useCallback((actionType: string): boolean => {
    return shouldRollDice(diceMode, actionType);
  }, [diceMode]);
  
  const performRoll = useCallback(async (options: DiceRollOptions) => {
    const { actionType, difficulty = 'NORMAL', contextModifiers = [], player, playerSkills } = options;
    
    // Check if we should roll based on dice mode
    const shouldDisplay = shouldRollDice(diceMode, actionType);
    
    if (!shouldDisplay) {
      // Story mode - use skill check system if skills available
      if (playerSkills) {
        const skillMapping = ACTION_TO_SKILL_MAP[actionType];
        if (skillMapping) {
          const difficultyLevel = Object.entries(DIFFICULTY_MAP)
            .find(([_, v]) => v === difficulty)?.[0] as DifficultyLevel || 'moderate';
          
          const modifiers: SkillModifier[] = contextModifiers.map(m => ({
            source: m.source,
            value: m.value
          }));
          
          const skillResult = performSkillCheck(
            playerSkills,
            skillMapping.category,
            skillMapping.skill,
            difficultyLevel,
            modifiers
          );
          
          setState(prev => ({ ...prev, lastSkillCheck: skillResult }));
          return { diceRoll: null, skillCheck: skillResult, shouldDisplay: false };
        }
      }
      
      return { diceRoll: null, skillCheck: null, shouldDisplay: false };
    }
    
    // Perform D20 roll
    setState(prev => ({ ...prev, isRolling: true }));
    
    const result = performDiceRoll(player, actionType, difficulty, contextModifiers);
    
    if (result) {
      setState({
        isRolling: false,
        currentRoll: result,
        lastSkillCheck: null
      });
      
      // Track dice roll stats
      if (sessionStats) {
        sessionStats.incrementStat('diceRolled');
        if (result.naturalRoll === 20) {
          sessionStats.incrementStat('naturalTwenties');
        } else if (result.naturalRoll === 1) {
          sessionStats.incrementStat('naturalOnes');
        }
        if (result.isCritical) {
          sessionStats.incrementStat('criticalSuccesses');
        } else if (result.result.label === 'Critical Failure') {
          sessionStats.incrementStat('criticalFailures');
        }
      }
    } else {
      setState(prev => ({ ...prev, isRolling: false }));
    }
    
    return { diceRoll: result, skillCheck: null, shouldDisplay: true };
  }, [diceMode, sessionStats]);
  
  const clearRoll = useCallback(() => {
    setState({
      isRolling: false,
      currentRoll: null,
      lastSkillCheck: null
    });
  }, []);
  
  return {
    state,
    performRoll,
    clearRoll,
    shouldShowRoll
  };
}

// Helper to convert combat action to dice action type
export function combatActionToDiceAction(action: string): string {
  const map: Record<string, string> = {
    attack: 'COMBAT_ATTACK',
    defend: 'COMBAT_DEFEND',
    dodge: 'COMBAT_DODGE',
    flee: 'ESCAPE',
    intimidate: 'INTIMIDATE',
    talk_down: 'PERSUADE_MAJOR',
    grapple: 'COMBAT_ATTACK',
    disarm: 'COMBAT_ATTACK'
  };
  return map[action] || 'COMBAT_ATTACK';
}

/**
 * Convert D&D-style stats (8-20 scale) to dice system format (0-100 scale)
 * Formula: ((stat - 10) * 5) + 50 = percentage
 * 10 = 50 (average), 20 = 100 (maximum), 8 = 40 (minimum typical)
 */
function convertDnDStatToPercentage(stat: number | undefined): number {
  if (stat === undefined || stat === null || isNaN(stat)) return 50;
  // Clamp D&D stat to reasonable range (3-30)
  const clampedStat = Math.max(3, Math.min(30, stat));
  // Convert: 10 = 50%, each point = 5%
  const converted = ((clampedStat - 10) * 5) + 50;
  // Clamp result to 0-100 range
  return Math.max(0, Math.min(100, converted));
}

/**
 * Convert player state to DicePlayer format
 * Handles both D&D-style stats (8-20) and percentage stats (0-100)
 */
export function toDicePlayer(stats: {
  strength?: number;
  agility?: number;
  intelligence?: number;
  charisma?: number;
  perception?: number;
  endurance?: number;
}, isPercentageScale = false): DicePlayer {
  // Auto-detect scale: D&D stats are typically 3-30, percentage is 0-100
  const values = Object.values(stats).filter(v => v !== undefined) as number[];
  const maxVal = Math.max(...values, 0);
  const isDnDScale = !isPercentageScale && maxVal <= 30;
  
  const convert = isDnDScale ? convertDnDStatToPercentage : (v: number | undefined) => {
    if (v === undefined || v === null || isNaN(v)) return 50;
    return Math.max(0, Math.min(100, v));
  };
  
  return {
    stats: {
      strength: convert(stats.strength),
      agility: convert(stats.agility),
      intelligence: convert(stats.intelligence),
      charisma: convert(stats.charisma),
      perception: convert(stats.perception),
      endurance: convert(stats.endurance)
    },
    wounds: [],
    statusEffects: []
  };
}
