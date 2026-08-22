import { useState, useCallback } from 'react';
import { useGameOptional } from '@/contexts/GameContext';
import { useSessionStatsOptional } from '@/components/game/SessionStats';
import {
  DiceRollResult,
  performDiceRoll,
  shouldRollDice,
  DifficultyTier,
  ModifierSource,
  DicePlayer,
} from '@/game/diceSystem';
import {
  SkillCheckResult,
  performSkillCheck,
  DifficultyLevel,
  SkillCategory,
  SkillModifier,
} from '@/game/skillCheckSystem';
import { PlayerSkills } from '@/types/lifeSim';
import { normalizeSpecialStats, legacyAbilityToSpecial } from '@/types/rpgCharacter';

const DIFFICULTY_MAP: Record<DifficultyLevel, DifficultyTier> = {
  trivial: 'VERY_EASY',
  easy: 'EASY',
  moderate: 'NORMAL',
  hard: 'HARD',
  very_hard: 'VERY_HARD',
  legendary: 'VERY_HARD',
};

const ACTION_TO_SKILL_MAP: Record<string, { category: SkillCategory; skill: string }> = {
  COMBAT_ATTACK: { category: 'physical', skill: 'combat' },
  COMBAT_DEFEND: { category: 'physical', skill: 'combat' },
  COMBAT_DODGE: { category: 'physical', skill: 'athletics' },
  ESCAPE: { category: 'physical', skill: 'athletics' },
  RESIST_EFFECT: { category: 'physical', skill: 'athletics' },
  SAVING_THROW: { category: 'physical', skill: 'athletics' },
  INTIMIDATE: { category: 'social', skill: 'intimidation' },
  PERSUADE_MAJOR: { category: 'social', skill: 'persuasion' },
  PERSUADE_MINOR: { category: 'social', skill: 'persuasion' },
  ROMANCE_ADVANCE: { category: 'social', skill: 'seduction' },
  FLIRT: { category: 'social', skill: 'charm' },
  HAGGLE: { category: 'social', skill: 'persuasion' },
  STEALTH: { category: 'physical', skill: 'athletics' },
  CLIMB: { category: 'physical', skill: 'athletics' },
  SWIM: { category: 'physical', skill: 'athletics' },
  JUMP: { category: 'physical', skill: 'athletics' },
  LIFT: { category: 'physical', skill: 'athletics' },
  ENDURE: { category: 'physical', skill: 'athletics' },
  PERCEPTION_CHECK: { category: 'practical', skill: 'survival' },
  SEARCH: { category: 'practical', skill: 'survival' },
  SCAVENGE: { category: 'practical', skill: 'survival' },
  LOCKPICK: { category: 'practical', skill: 'crafting' },
  CRAFT: { category: 'practical', skill: 'crafting' },
  HEAL: { category: 'practical', skill: 'medicine' },
  RECALL: { category: 'practical', skill: 'medicine' },
  INSIGHT: { category: 'social', skill: 'charm' },
  CRITICAL_CHOICE: { category: 'practical', skill: 'survival' },
  LUCK_CHECK: { category: 'practical', skill: 'survival' },
  GAMBLE: { category: 'social', skill: 'charm' },
};

export interface DiceRollOptions {
  actionType: string;
  difficulty?: DifficultyTier;
  contextModifiers?: ModifierSource[];
  player: DicePlayer;
  playerSkills?: PlayerSkills;
  /** Server/client tests may provide a stable natural roll. Normal UI omits it. */
  forcedNaturalRoll?: number;
}

export interface DiceRollState {
  isRolling: boolean;
  currentRoll: DiceRollResult | null;
  lastSkillCheck: SkillCheckResult | null;
}

export interface UseDiceRollReturn {
  state: DiceRollState;
  performRoll: (options: DiceRollOptions) => Promise<{
    diceRoll: DiceRollResult | null;
    skillCheck: SkillCheckResult | null;
    shouldDisplay: boolean;
  }>;
  clearRoll: () => void;
  shouldShowRoll: (actionType: string) => boolean;
}

export function useDiceRoll(): UseDiceRollReturn {
  const gameContext = useGameOptional();
  const sessionStats = useSessionStatsOptional();
  const diceMode = gameContext?.diceMode ?? 'story';

  const [state, setState] = useState<DiceRollState>({
    isRolling: false,
    currentRoll: null,
    lastSkillCheck: null,
  });

  const shouldShowRoll = useCallback((actionType: string): boolean => {
    return shouldRollDice(diceMode, actionType);
  }, [diceMode]);

  const performRoll = useCallback(async (options: DiceRollOptions) => {
    const {
      actionType,
      difficulty = 'NORMAL',
      contextModifiers = [],
      player,
      playerSkills,
      forcedNaturalRoll,
    } = options;

    const shouldDisplay = shouldRollDice(diceMode, actionType);

    if (!shouldDisplay) {
      // Story mode retains the old hidden skill-check fallback for systems that
      // still depend on it, but no modal interrupts the narrative turn.
      if (playerSkills) {
        const skillMapping = ACTION_TO_SKILL_MAP[actionType];
        if (skillMapping) {
          const difficultyLevel = Object.entries(DIFFICULTY_MAP)
            .find(([_, v]) => v === difficulty)?.[0] as DifficultyLevel || 'moderate';
          const modifiers: SkillModifier[] = contextModifiers.map(m => ({ source: m.source, value: m.value }));
          const skillResult = performSkillCheck(
            playerSkills,
            skillMapping.category,
            skillMapping.skill,
            difficultyLevel,
            modifiers,
          );
          setState(prev => ({ ...prev, lastSkillCheck: skillResult }));
          return { diceRoll: null, skillCheck: skillResult, shouldDisplay: false };
        }
      }
      return { diceRoll: null, skillCheck: null, shouldDisplay: false };
    }

    setState(prev => ({ ...prev, isRolling: true }));
    const result = performDiceRoll(player, actionType, difficulty, contextModifiers, forcedNaturalRoll);

    if (result) {
      setState({ isRolling: false, currentRoll: result, lastSkillCheck: null });
      if (sessionStats) {
        sessionStats.incrementStat('diceRolled');
        if (result.naturalRoll === 20) sessionStats.incrementStat('naturalTwenties');
        if (result.naturalRoll === 1) sessionStats.incrementStat('naturalOnes');
        // The previous implementation counted *every* critical, including a
        // critical failure, as a criticalSuccess because isCritical was tested
        // first. Humans did invent Boolean logic and then this happened.
        if (result.criticalSuccess) sessionStats.incrementStat('criticalSuccesses');
        if (result.criticalFailure) sessionStats.incrementStat('criticalFailures');
      }
    } else {
      setState(prev => ({ ...prev, isRolling: false }));
    }

    return { diceRoll: result, skillCheck: null, shouldDisplay: true };
  }, [diceMode, sessionStats]);

  const clearRoll = useCallback(() => {
    setState({ isRolling: false, currentRoll: null, lastSkillCheck: null });
  }, []);

  return { state, performRoll, clearRoll, shouldShowRoll };
}

export function combatActionToDiceAction(action: string): string {
  const map: Record<string, string> = {
    attack: 'COMBAT_ATTACK',
    defend: 'COMBAT_DEFEND',
    dodge: 'COMBAT_DODGE',
    flee: 'ESCAPE',
    intimidate: 'INTIMIDATE',
    talk_down: 'PERSUADE_MAJOR',
    grapple: 'COMBAT_ATTACK',
    disarm: 'COMBAT_ATTACK',
  };
  return map[action] || 'COMBAT_ATTACK';
}

/**
 * Convert any character stat shape into the canonical SPECIAL DicePlayer.
 * New saves pass values through directly. Old D&D-ish saves are converted once
 * through normalizeSpecialStats instead of being inflated into a second 0-100
 * scale.
 */
export function toDicePlayer(stats: {
  strength?: number;
  perception?: number;
  endurance?: number;
  charisma?: number;
  intelligence?: number;
  agility?: number;
  luck?: number;
  dexterity?: number;
  constitution?: number;
  wisdom?: number;
}, _isPercentageScale = false): DicePlayer {
  const appearsLegacy =
    stats.perception === undefined &&
    stats.endurance === undefined &&
    stats.agility === undefined &&
    stats.luck === undefined;

  const normalized = appearsLegacy
    ? normalizeSpecialStats({
        strength: legacyAbilityToSpecial(stats.strength, 1),
        perception: legacyAbilityToSpecial(stats.wisdom, 1),
        endurance: legacyAbilityToSpecial(stats.constitution, 1),
        charisma: legacyAbilityToSpecial(stats.charisma, 1),
        intelligence: legacyAbilityToSpecial(stats.intelligence, 1),
        agility: legacyAbilityToSpecial(stats.dexterity, 1),
        luck: 1,
        dexterity: legacyAbilityToSpecial(stats.dexterity, 1),
        constitution: legacyAbilityToSpecial(stats.constitution, 1),
        wisdom: legacyAbilityToSpecial(stats.wisdom, 1),
      })
    : normalizeSpecialStats({
        strength: stats.strength ?? 1,
        perception: stats.perception ?? stats.wisdom ?? 1,
        endurance: stats.endurance ?? stats.constitution ?? 1,
        charisma: stats.charisma ?? 1,
        intelligence: stats.intelligence ?? 1,
        agility: stats.agility ?? stats.dexterity ?? 1,
        luck: stats.luck ?? 1,
        dexterity: stats.agility ?? stats.dexterity ?? 1,
        constitution: stats.endurance ?? stats.constitution ?? 1,
        wisdom: stats.perception ?? stats.wisdom ?? 1,
      });

  return {
    stats: {
      strength: normalized.strength,
      perception: normalized.perception ?? normalized.wisdom,
      endurance: normalized.endurance ?? normalized.constitution,
      charisma: normalized.charisma,
      intelligence: normalized.intelligence,
      agility: normalized.agility ?? normalized.dexterity,
      luck: normalized.luck ?? 1,
    },
    wounds: [],
    statusEffects: [],
  };
}
