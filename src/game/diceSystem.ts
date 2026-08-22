// ============================================================================
// SPECIAL D20 RESOLUTION SYSTEM - Story / Partial / Full modes
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
    description: 'No visible dice. SPECIAL still shapes what is plausible and how the world reacts.',
    color: '#8b5cf6',
  },
  PARTIAL: {
    id: 'partial',
    name: 'Partial Dice',
    icon: '🎲',
    description: 'SPECIAL checks resolve major danger, combat, critical social pressure and high-stakes choices.',
    color: '#f59e0b',
  },
  FULL: {
    id: 'full',
    name: 'Full Dice',
    icon: '⚔️',
    description: 'Every uncertain action resolves with SPECIAL before the narrator writes the turn outcome.',
    color: '#ef4444',
  },
};

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export type ActionCategory = 'major' | 'minor';
export type StatType =
  | 'strength'
  | 'perception'
  | 'endurance'
  | 'charisma'
  | 'intelligence'
  | 'agility'
  | 'luck';

export interface ActionDefinition {
  category: ActionCategory;
  stat: StatType;
  baseDC: number;
  name: string;
  /** Luck assists the check in addition to the governing SPECIAL stat. */
  luckAssisted?: boolean;
}

export const ACTION_CATEGORIES: Record<string, ActionDefinition> = {
  // Major actions (Partial + Full)
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

  // Minor actions (Full mode)
  PERCEPTION_CHECK: { category: 'minor', stat: 'perception', baseDC: 10, name: 'Perception' },
  STEALTH: { category: 'minor', stat: 'agility', baseDC: 12, name: 'Stealth' },
  LOCKPICK: { category: 'minor', stat: 'agility', baseDC: 14, name: 'Lockpicking' },
  SEARCH: { category: 'minor', stat: 'perception', baseDC: 10, name: 'Search', luckAssisted: true },
  SCAVENGE: { category: 'minor', stat: 'perception', baseDC: 11, name: 'Scavenge', luckAssisted: true },
  LUCK_CHECK: { category: 'minor', stat: 'luck', baseDC: 10, name: 'Luck' },
  GAMBLE: { category: 'minor', stat: 'luck', baseDC: 11, name: 'Gamble' },
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
  ENDURE: { category: 'minor', stat: 'endurance', baseDC: 10, name: 'Endure' },
};

// ============================================================================
// DIFFICULTY
// ============================================================================

export type DifficultyTier = 'VERY_EASY' | 'EASY' | 'NORMAL' | 'HARD' | 'VERY_HARD';

export interface DifficultyInfo {
  modifier: number;
  label: string;
  color: string;
}

/** Difficulty changes the roll. The base target stays readable and stable. */
export const DIFFICULTY_MODIFIERS: Record<DifficultyTier, DifficultyInfo> = {
  VERY_EASY: { modifier: +4, label: 'Very Easy', color: '#10b981' },
  EASY: { modifier: +2, label: 'Easy', color: '#22c55e' },
  NORMAL: { modifier: 0, label: 'Normal', color: '#64748b' },
  HARD: { modifier: -2, label: 'Hard', color: '#f59e0b' },
  VERY_HARD: { modifier: -4, label: 'Very Hard', color: '#ef4444' },
};

export const BASE_DC = 10;

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
  CRITICAL_SUCCESS: { min: 20, max: 20, label: 'Critical Success', color: '#059669', icon: '⭐' },
};

// ============================================================================
// PLAYER STATS
// ============================================================================

export interface PlayerStats {
  strength: number;
  perception: number;
  endurance: number;
  charisma: number;
  intelligence: number;
  agility: number;
  luck: number;
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
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
  luck: number;
  timestamp: number;
}

// ============================================================================
// DICE ROLLING
// ============================================================================

export const rollD20 = (): number => Math.floor(Math.random() * 20) + 1;

export const rollDice = (sides: number, count = 1): { rolls: number[]; total: number } => {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
};

/** SPECIAL 5 is neutral. Each point above/below 5 is one d20 modifier. */
export const calculateStatModifier = (statValue: number): number => {
  if (typeof statValue !== 'number' || Number.isNaN(statValue)) return 0;
  return Math.floor(statValue - 5);
};

/**
 * Luck does not simply inflate every check. It changes improbable outcomes and
 * gives search/scavenging a modest fortune assist, closer to New Vegas than a
 * generic +LCK-to-everything stat.
 */
export const calculateLuckSearchModifier = (luck: number): number => {
  if (typeof luck !== 'number' || Number.isNaN(luck)) return 0;
  return Math.max(-2, Math.min(2, Math.trunc((luck - 5) / 2)));
};

export const getCriticalRange = (luck: number): { successAt: number; failureAt: number } => {
  const safeLuck = typeof luck === 'number' && !Number.isNaN(luck) ? luck : 1;
  return {
    // Exceptional Luck makes 19s critical. Very low Luck makes 2s dangerous.
    successAt: safeLuck >= 9 ? 19 : 20,
    failureAt: safeLuck <= 1 ? 2 : 1,
  };
};

/** Apply wounds and temporary buffs/debuffs directly on the SPECIAL scale. */
export const getEffectiveStatWithWounds = (player: DicePlayer, statName: StatType): number => {
  if (!player?.stats) return 1;
  const raw = player.stats[statName];
  let value = typeof raw === 'number' && !Number.isNaN(raw) ? raw : 1;

  for (const wound of player.wounds || []) {
    const delta = wound?.statPenalties?.[statName];
    if (typeof delta === 'number' && !Number.isNaN(delta)) value += delta;
  }
  for (const effect of player.statusEffects || []) {
    const delta = effect?.statModifiers?.[statName];
    if (typeof delta === 'number' && !Number.isNaN(delta)) value += delta;
  }

  // Base creation is 0-10; class/equipment/status effects may push above 10.
  return Math.max(0, Math.min(20, value));
};

/**
 * One authoritative SPECIAL check. The result is intended to exist BEFORE the
 * narrator writes consequences, so one player action remains one complete turn.
 */
export const performDiceRoll = (
  player: DicePlayer,
  actionType: string,
  difficulty: DifficultyTier = 'NORMAL',
  contextModifiers: ModifierSource[] = [],
  forcedNaturalRoll?: number,
): DiceRollResult | null => {
  if (!player || !actionType) return null;
  const action = ACTION_CATEGORIES[actionType];
  if (!action) {
    console.warn(`[DiceSystem] Unknown action type: ${actionType}`);
    return null;
  }

  const diff = DIFFICULTY_MODIFIERS[difficulty] || DIFFICULTY_MODIFIERS.NORMAL;
  const targetDC = action.baseDC || BASE_DC;
  const effectiveStat = getEffectiveStatWithWounds(player, action.stat);
  const statModifier = calculateStatModifier(effectiveStat);
  const luck = getEffectiveStatWithWounds(player, 'luck');
  const naturalRoll = typeof forcedNaturalRoll === 'number'
    ? Math.max(1, Math.min(20, Math.floor(forcedNaturalRoll)))
    : rollD20();

  let totalModifier = statModifier + diff.modifier;
  const modifierBreakdown: ModifierSource[] = [
    { source: capitalize(action.stat), value: statModifier },
    { source: `Difficulty (${diff.label})`, value: diff.modifier },
  ];

  if (action.luckAssisted && action.stat !== 'luck') {
    const luckMod = calculateLuckSearchModifier(luck);
    if (luckMod !== 0) {
      totalModifier += luckMod;
      modifierBreakdown.push({ source: 'Luck', value: luckMod });
    }
  }

  for (const mod of Array.isArray(contextModifiers) ? contextModifiers : []) {
    if (mod && typeof mod.value === 'number' && !Number.isNaN(mod.value)) {
      totalModifier += mod.value;
      modifierBreakdown.push(mod);
    }
  }

  const totalRoll = naturalRoll + totalModifier;
  const criticalRange = getCriticalRange(luck);
  const criticalSuccess = naturalRoll >= criticalRange.successAt;
  const criticalFailure = naturalRoll <= criticalRange.failureAt;

  let result: RollResultInfo;
  if (criticalFailure) result = ROLL_RESULTS.CRITICAL_FAILURE;
  else if (criticalSuccess) result = ROLL_RESULTS.CRITICAL_SUCCESS;
  else if (totalRoll >= targetDC) result = ROLL_RESULTS.SUCCESS;
  else if (totalRoll >= targetDC - 3) result = ROLL_RESULTS.PARTIAL;
  else result = ROLL_RESULTS.FAILURE;

  return {
    action: action.name,
    actionType,
    stat: action.stat,
    effectiveStat,
    naturalRoll,
    totalModifier,
    totalRoll,
    targetDC,
    difficulty: diff.label,
    difficultyColor: diff.color,
    result,
    modifierBreakdown,
    isCritical: criticalSuccess || criticalFailure,
    criticalSuccess,
    criticalFailure,
    luck,
    timestamp: Date.now(),
  };
};

export const shouldRollDice = (diceMode: DiceMode, actionType: string): boolean => {
  if (diceMode === 'story') return false;
  const action = ACTION_CATEGORIES[actionType];
  if (!action) return false;
  if (diceMode === 'partial') return action.category === 'major';
  return true;
};

// ============================================================================
// ACTION INFERENCE
// ============================================================================

export interface InferredAction {
  actionType: keyof typeof ACTION_CATEGORIES;
  confidence: 'high' | 'medium';
}

/**
 * Lightweight deterministic classifier used by local/manual rolls and mirrored
 * by the server turn resolver. It intentionally chooses broad SPECIAL checks,
 * not hundreds of pseudo-skills.
 */
export function inferActionType(input: string): InferredAction | null {
  const text = String(input || '').toLowerCase().trim();
  if (!text) return null;

  if (/\b(scavenge|loot the room|search for supplies|search the area|rummage|forage)\b/.test(text))
    return { actionType: 'SCAVENGE', confidence: 'high' };
  if (/\b(search|look around|examine|inspect|investigate|listen|spot|scan|notice|find)\b/.test(text))
    return { actionType: 'SEARCH', confidence: 'high' };
  if (/\b(gamble|bet|wager|chance it|try my luck)\b/.test(text))
    return { actionType: 'GAMBLE', confidence: 'high' };
  if (/\b(sneak|hide|stealth|creep|silently)\b/.test(text))
    return { actionType: 'STEALTH', confidence: 'high' };
  if (/\b(lockpick|pick the lock|bypass the lock)\b/.test(text))
    return { actionType: 'LOCKPICK', confidence: 'high' };
  if (/\b(dodge|evade|duck|sidestep)\b/.test(text))
    return { actionType: 'COMBAT_DODGE', confidence: 'high' };
  if (/\b(flee|escape|run away|break away)\b/.test(text))
    return { actionType: 'ESCAPE', confidence: 'high' };
  if (/\b(attack|shoot|fire at|stab|slash|strike|punch|kick|grapple)\b/.test(text))
    return { actionType: 'COMBAT_ATTACK', confidence: 'high' };
  if (/\b(persuade|convince|negotiate|talk .* into|reason with|appeal to)\b/.test(text))
    return { actionType: 'PERSUADE_MAJOR', confidence: 'high' };
  if (/\b(intimidate|threaten|scare|coerce)\b/.test(text))
    return { actionType: 'INTIMIDATE', confidence: 'high' };
  if (/\b(flirt|seduce|charm)\b/.test(text))
    return { actionType: 'FLIRT', confidence: 'high' };
  if (/\b(haggle|barter|lower the price|better price)\b/.test(text))
    return { actionType: 'HAGGLE', confidence: 'high' };
  if (/\b(hack|repair|fix|craft|build|decode|solve|calculate|research)\b/.test(text))
    return { actionType: 'CRAFT', confidence: 'high' };
  if (/\b(heal|treat|bandage|medicine|stitch)\b/.test(text))
    return { actionType: 'HEAL', confidence: 'high' };
  if (/\b(endure|resist|withstand|hold my breath|push through|pain|poison)\b/.test(text))
    return { actionType: 'ENDURE', confidence: 'high' };
  if (/\b(lift|break|force open|kick down|bend|shove)\b/.test(text))
    return { actionType: 'LIFT', confidence: 'high' };
  if (/\b(climb|scale)\b/.test(text)) return { actionType: 'CLIMB', confidence: 'high' };
  if (/\b(swim|dive across)\b/.test(text)) return { actionType: 'SWIM', confidence: 'high' };
  if (/\b(jump|leap|vault)\b/.test(text)) return { actionType: 'JUMP', confidence: 'high' };

  return null;
}

// ============================================================================
// FORMATTING
// ============================================================================

const capitalize = (str: string): string => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export const formatRollForNarrative = (roll: DiceRollResult): string => {
  const modSign = roll.totalModifier >= 0 ? '+' : '';
  return [
    `🎲 **${roll.action}** [${roll.stat.toUpperCase()} ${roll.effectiveStat}] — ${roll.result.icon} ${roll.result.label}`,
    `d20 ${roll.naturalRoll} ${modSign}${roll.totalModifier} = ${roll.totalRoll} vs ${roll.targetDC} (${roll.difficulty})`,
    roll.modifierBreakdown.length > 1
      ? `Modifiers: ${roll.modifierBreakdown.map(m => `${m.source} ${m.value >= 0 ? '+' : ''}${m.value}`).join(', ')}`
      : '',
  ].filter(Boolean).join('\n');
};

export const getRollNarrative = (roll: DiceRollResult): string => {
  const narratives: Record<string, string[]> = {
    CRITICAL_SUCCESS: ['Fortune and capability line up perfectly.', 'An exceptional break turns the attempt decisively in your favor.'],
    SUCCESS: ['The attempt works.', 'Your capability carries the action through.'],
    PARTIAL: ['You get what you wanted, but something comes with it.', 'The action works imperfectly and creates a complication.'],
    FAILURE: ['The attempt fails forward and changes the situation.', 'You fall short, but the failure creates a new consequence rather than a dead end.'],
    CRITICAL_FAILURE: ['Bad luck compounds the mistake into a serious complication.', 'The attempt goes catastrophically wrong and the world reacts.'],
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
  if (saved && ['story', 'partial', 'full'].includes(saved)) return saved as DiceMode;
  return 'story';
};
