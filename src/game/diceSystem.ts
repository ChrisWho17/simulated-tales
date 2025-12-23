// ============================================================================
// D20 DICE SYSTEM - Story/Partial/Full Modes
// ============================================================================

export type DiceMode = 'story' | 'partial' | 'full';

export interface DiceModeInfo {
  id: DiceMode;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const DICE_MODES: Record<string, DiceModeInfo> = {
  STORY: {
    id: 'story',
    name: 'Story Mode',
    icon: '📖',
    description: 'Pure narrative experience. No dice rolls - outcomes are determined by story flow and player choices.',
    color: '#8b5cf6'
  },
  PARTIAL: {
    id: 'partial',
    name: 'Partial Dice',
    icon: '🎲',
    description: 'Dice rolls for major events only: combat, critical choices, dramatic moments, and high-stakes situations.',
    color: '#f59e0b'
  },
  FULL: {
    id: 'full',
    name: 'Full Dice',
    icon: '⚔️',
    description: 'D&D-style gameplay. Every action is resolved with dice: combat, dialogue, exploration, crafting, and more.',
    color: '#ef4444'
  }
};

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export type ActionCategory = 'major' | 'minor';
export type StatType = 'strength' | 'agility' | 'intelligence' | 'charisma' | 'perception' | 'endurance';

export interface ActionDefinition {
  category: ActionCategory;
  stat: StatType;
  baseDC: number;
  name: string;
}

export const ACTION_CATEGORIES: Record<string, ActionDefinition> = {
  // Major actions (Partial + Full mode)
  COMBAT_ATTACK: { category: 'major', stat: 'strength', baseDC: 12, name: 'Attack' },
  COMBAT_DEFEND: { category: 'major', stat: 'agility', baseDC: 10, name: 'Defend' },
  COMBAT_DODGE: { category: 'major', stat: 'agility', baseDC: 14, name: 'Dodge' },
  CRITICAL_CHOICE: { category: 'major', stat: 'intelligence', baseDC: 12, name: 'Critical Decision' },
  PERSUADE_MAJOR: { category: 'major', stat: 'charisma', baseDC: 14, name: 'Major Persuasion' },
  INTIMIDATE: { category: 'major', stat: 'charisma', baseDC: 13, name: 'Intimidate' },
  ESCAPE: { category: 'major', stat: 'agility', baseDC: 15, name: 'Escape' },
  RESIST_EFFECT: { category: 'major', stat: 'endurance', baseDC: 12, name: 'Resist' },
  SAVING_THROW: { category: 'major', stat: 'endurance', baseDC: 14, name: 'Saving Throw' },
  ROMANCE_ADVANCE: { category: 'major', stat: 'charisma', baseDC: 13, name: 'Romance' },
  
  // Minor actions (Full mode only)
  PERCEPTION_CHECK: { category: 'minor', stat: 'perception', baseDC: 10, name: 'Perception' },
  STEALTH: { category: 'minor', stat: 'agility', baseDC: 12, name: 'Stealth' },
  LOCKPICK: { category: 'minor', stat: 'agility', baseDC: 14, name: 'Lockpicking' },
  SEARCH: { category: 'minor', stat: 'perception', baseDC: 8, name: 'Search' },
  PERSUADE_MINOR: { category: 'minor', stat: 'charisma', baseDC: 10, name: 'Persuasion' },
  HAGGLE: { category: 'minor', stat: 'charisma', baseDC: 11, name: 'Haggle' },
  CRAFT: { category: 'minor', stat: 'intelligence', baseDC: 12, name: 'Craft' },
  HEAL: { category: 'minor', stat: 'intelligence', baseDC: 11, name: 'Heal' },
  CLIMB: { category: 'minor', stat: 'strength', baseDC: 10, name: 'Climb' },
  SWIM: { category: 'minor', stat: 'endurance', baseDC: 10, name: 'Swim' },
  JUMP: { category: 'minor', stat: 'agility', baseDC: 8, name: 'Jump' },
  LIFT: { category: 'minor', stat: 'strength', baseDC: 12, name: 'Lift' },
  RECALL: { category: 'minor', stat: 'intelligence', baseDC: 10, name: 'Recall Knowledge' },
  INSIGHT: { category: 'minor', stat: 'perception', baseDC: 12, name: 'Insight' },
  FLIRT: { category: 'minor', stat: 'charisma', baseDC: 10, name: 'Flirt' },
  ENDURE: { category: 'minor', stat: 'endurance', baseDC: 10, name: 'Endure' }
};

// ============================================================================
// DIFFICULTY MODIFIERS
// ============================================================================

export type DifficultyTier = 'TRIVIAL' | 'EASY' | 'NORMAL' | 'HARD' | 'VERY_HARD' | 'EXTREME' | 'LEGENDARY';

export interface DifficultyInfo {
  dc: number;
  label: string;
  color: string;
}

export const DIFFICULTY_MODIFIERS: Record<DifficultyTier, DifficultyInfo> = {
  TRIVIAL: { dc: -4, label: 'Trivial', color: '#10b981' },
  EASY: { dc: -2, label: 'Easy', color: '#22c55e' },
  NORMAL: { dc: 0, label: 'Normal', color: '#64748b' },
  HARD: { dc: 3, label: 'Hard', color: '#f59e0b' },
  VERY_HARD: { dc: 5, label: 'Very Hard', color: '#ef4444' },
  EXTREME: { dc: 8, label: 'Extreme', color: '#dc2626' },
  LEGENDARY: { dc: 12, label: 'Legendary', color: '#9333ea' }
};

// ============================================================================
// ROLL RESULTS
// ============================================================================

export type RollResultType = 'CRITICAL_FAILURE' | 'FAILURE' | 'PARTIAL' | 'SUCCESS' | 'CRITICAL_SUCCESS';

export interface RollResultInfo {
  label: string;
  color: string;
  icon: string;
  min?: number;
  max?: number;
}

export const ROLL_RESULTS: Record<RollResultType, RollResultInfo> = {
  CRITICAL_FAILURE: { min: 1, max: 1, label: 'Critical Failure', color: '#7f1d1d', icon: '💀' },
  FAILURE: { label: 'Failure', color: '#dc2626', icon: '✗' },
  PARTIAL: { label: 'Partial Success', color: '#f59e0b', icon: '◐' },
  SUCCESS: { label: 'Success', color: '#22c55e', icon: '✓' },
  CRITICAL_SUCCESS: { min: 20, max: 20, label: 'Critical Success', color: '#059669', icon: '⭐' }
};

// ============================================================================
// PLAYER STATS INTERFACE (for dice system)
// ============================================================================

export interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  perception: number;
  endurance: number;
}

export interface Wound {
  id: string;
  type: string;
  location: string;
  severity: number;
  treated: boolean;
  healingProgress: number;
  statPenalties?: Partial<PlayerStats>;
}

export interface StatusEffect {
  id: string;
  name: string;
  duration: number;
  statModifiers?: Partial<PlayerStats>;
}

export interface DicePlayer {
  stats: PlayerStats;
  wounds?: Wound[];
  statusEffects?: StatusEffect[];
}

export interface ModifierSource {
  source: string;
  value: number;
  isWound?: boolean;
}

export interface DiceRollResult {
  action: string;
  actionType: string;
  stat: StatType;
  effectiveStat: number;
  naturalRoll: number;
  totalModifier: number;
  totalRoll: number;
  targetDC: number;
  difficulty: string;
  difficultyColor: string;
  result: RollResultInfo;
  modifierBreakdown: ModifierSource[];
  isCritical: boolean;
  timestamp: number;
}

// ============================================================================
// DICE ROLLING FUNCTIONS
// ============================================================================

export const rollD20 = (): number => Math.floor(Math.random() * 20) + 1;

export const rollDice = (sides: number, count = 1): { rolls: number[]; total: number } => {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
};

/**
 * Convert stat (0-100) to D20 modifier (-5 to +10)
 * 50 = +0, every 10 points = +2
 */
export const calculateStatModifier = (statValue: number): number => {
  return Math.floor((statValue - 50) / 5);
};

/**
 * Get effective stat value after applying wounds and status effects
 */
export const getEffectiveStatWithWounds = (player: DicePlayer, statName: StatType): number => {
  let base = player.stats[statName] || 50;
  let modifier = 0;
  
  player.wounds?.forEach(wound => {
    if (wound.statPenalties?.[statName]) {
      modifier += wound.statPenalties[statName]!;
    }
  });
  
  player.statusEffects?.forEach(effect => {
    if (effect.statModifiers?.[statName]) {
      modifier += effect.statModifiers[statName]!;
    }
  });
  
  return Math.max(1, Math.min(100, base + modifier));
};

/**
 * Perform a full dice roll with all modifiers
 */
export const performDiceRoll = (
  player: DicePlayer,
  actionType: string,
  difficulty: DifficultyTier = 'NORMAL',
  contextModifiers: ModifierSource[] = []
): DiceRollResult | null => {
  const action = ACTION_CATEGORIES[actionType];
  if (!action) return null;
  
  const diffMod = DIFFICULTY_MODIFIERS[difficulty] || DIFFICULTY_MODIFIERS.NORMAL;
  const targetDC = action.baseDC + diffMod.dc;
  
  // Get stat and calculate modifier
  const effectiveStat = getEffectiveStatWithWounds(player, action.stat);
  const statModifier = calculateStatModifier(effectiveStat);
  
  // Roll the d20
  const naturalRoll = rollD20();
  
  // Calculate total modifiers
  let totalModifier = statModifier;
  const modifierBreakdown: ModifierSource[] = [
    { source: capitalize(action.stat), value: statModifier }
  ];
  
  // Add context modifiers
  contextModifiers.forEach(mod => {
    totalModifier += mod.value;
    modifierBreakdown.push(mod);
  });
  
  // Check for wounds affecting this stat
  player.wounds?.forEach(wound => {
    if (wound.statPenalties?.[action.stat]) {
      const penalty = Math.floor(wound.statPenalties[action.stat]! / 5);
      if (penalty !== 0) {
        modifierBreakdown.push({ 
          source: `${wound.type} (${wound.location})`, 
          value: penalty,
          isWound: true 
        });
      }
    }
  });
  
  const totalRoll = naturalRoll + totalModifier;
  
  // Determine result
  let result: RollResultInfo;
  if (naturalRoll === 1) {
    result = ROLL_RESULTS.CRITICAL_FAILURE;
  } else if (naturalRoll === 20) {
    result = ROLL_RESULTS.CRITICAL_SUCCESS;
  } else if (totalRoll >= targetDC + 5) {
    result = ROLL_RESULTS.SUCCESS;
  } else if (totalRoll >= targetDC) {
    result = ROLL_RESULTS.SUCCESS;
  } else if (totalRoll >= targetDC - 3) {
    result = ROLL_RESULTS.PARTIAL;
  } else {
    result = ROLL_RESULTS.FAILURE;
  }
  
  return {
    action: action.name,
    actionType,
    stat: action.stat,
    effectiveStat,
    naturalRoll,
    totalModifier,
    totalRoll,
    targetDC,
    difficulty: diffMod.label,
    difficultyColor: diffMod.color,
    result,
    modifierBreakdown,
    isCritical: naturalRoll === 1 || naturalRoll === 20,
    timestamp: Date.now()
  };
};

/**
 * Check if we should roll dice based on the current mode and action type
 */
export const shouldRollDice = (diceMode: DiceMode, actionType: string): boolean => {
  if (diceMode === 'story') return false;
  
  const action = ACTION_CATEGORIES[actionType];
  if (!action) return false;
  
  if (diceMode === 'partial') {
    return action.category === 'major';
  }
  
  // Full mode - all actions
  return true;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const capitalize = (str: string): string => {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
};

/**
 * Format a dice roll result for display in the narrative
 */
export const formatRollForNarrative = (roll: DiceRollResult): string => {
  const modSign = roll.totalModifier >= 0 ? '+' : '';
  const critText = roll.isCritical 
    ? (roll.naturalRoll === 20 ? ' (CRITICAL!)' : ' (Critical Fail!)')
    : '';
  
  return [
    `**${roll.action}** — ${roll.result.icon} ${roll.result.label}${critText}`,
    `Roll: ${roll.naturalRoll} ${modSign}${roll.totalModifier} = ${roll.totalRoll} vs DC ${roll.targetDC} (${roll.difficulty})`,
    roll.modifierBreakdown.length > 1 
      ? `Modifiers: ${roll.modifierBreakdown.map(m => `${m.source} ${m.value >= 0 ? '+' : ''}${m.value}`).join(', ')}`
      : ''
  ].filter(Boolean).join('\n');
};

/**
 * Get narrative flavor text for a roll result
 */
export const getRollNarrative = (roll: DiceRollResult): string => {
  const narratives: Record<string, string[]> = {
    CRITICAL_SUCCESS: [
      'A masterful execution that exceeds all expectations.',
      'Perfection. The kind of moment legends are made of.',
      'You surpass even your own abilities in this moment.'
    ],
    SUCCESS: [
      'Success. Your training serves you well.',
      'It works as intended.',
      'A solid performance.'
    ],
    PARTIAL: [
      'Partially successful, but with complications.',
      'It works... sort of. Not quite as planned.',
      'Success, but at a cost.'
    ],
    FAILURE: [
      'It doesn\'t work. Not this time.',
      'Your efforts fall short.',
      'Failure. Perhaps another approach?'
    ],
    CRITICAL_FAILURE: [
      'A catastrophic failure with dire consequences.',
      'Everything goes wrong in the worst possible way.',
      'Disaster strikes. This will have repercussions.'
    ]
  };
  
  const resultKey = Object.entries(ROLL_RESULTS).find(([_, v]) => v.label === roll.result.label)?.[0] || 'FAILURE';
  const options = narratives[resultKey] || narratives.FAILURE;
  return options[Math.floor(Math.random() * options.length)];
};

// ============================================================================
// DICE MODE STORAGE
// ============================================================================

const DICE_MODE_STORAGE_KEY = 'untold-dice-mode';

export const saveDiceMode = (mode: DiceMode): void => {
  localStorage.setItem(DICE_MODE_STORAGE_KEY, mode);
};

export const loadDiceMode = (): DiceMode => {
  const saved = localStorage.getItem(DICE_MODE_STORAGE_KEY);
  if (saved && ['story', 'partial', 'full'].includes(saved)) {
    return saved as DiceMode;
  }
  return 'story'; // Default
};
