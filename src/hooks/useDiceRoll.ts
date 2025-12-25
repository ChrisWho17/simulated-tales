import { useState, useCallback } from 'react';
import { useGameOptional } from '@/contexts/GameContext';
import { 
  DiceRollResult, 
  performDiceRoll, 
  shouldRollDice, 
  DifficultyTier,
  ModifierSource,
  DicePlayer,
  ACTION_CATEGORIES
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

// Map action types to skill check categories
const ACTION_TO_SKILL_MAP: Record<string, { category: SkillCategory; skill: string }> = {
  COMBAT_ATTACK: { category: 'physical', skill: 'combat' },
  COMBAT_DEFEND: { category: 'physical', skill: 'combat' },
  COMBAT_DODGE: { category: 'physical', skill: 'athletics' },
  ESCAPE: { category: 'physical', skill: 'athletics' },
  INTIMIDATE: { category: 'social', skill: 'intimidation' },
  PERSUADE_MAJOR: { category: 'social', skill: 'persuasion' },
  PERSUADE_MINOR: { category: 'social', skill: 'persuasion' },
  ROMANCE_ADVANCE: { category: 'social', skill: 'seduction' },
  STEALTH: { category: 'physical', skill: 'athletics' },
  PERCEPTION_CHECK: { category: 'social', skill: 'deception' }, // Using deception for insight
  FLIRT: { category: 'social', skill: 'charm' }
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
    } else {
      setState(prev => ({ ...prev, isRolling: false }));
    }
    
    return { diceRoll: result, skillCheck: null, shouldDisplay: true };
  }, [diceMode]);
  
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

// Convert player state to DicePlayer format
export function toDicePlayer(stats: {
  strength?: number;
  agility?: number;
  intelligence?: number;
  charisma?: number;
  perception?: number;
  endurance?: number;
}): DicePlayer {
  return {
    stats: {
      strength: stats.strength ?? 50,
      agility: stats.agility ?? 50,
      intelligence: stats.intelligence ?? 50,
      charisma: stats.charisma ?? 50,
      perception: stats.perception ?? 50,
      endurance: stats.endurance ?? 50
    },
    wounds: [],
    statusEffects: []
  };
}
