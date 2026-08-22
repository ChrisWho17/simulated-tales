// RPG Character Types

/**
 * Canonical player statistics.
 *
 * The game now resolves interactions on a Fallout-inspired 0-10 SPECIAL scale.
 * New characters begin at 1 in each SPECIAL stat. A player may deliberately
 * lower a base stat to 0. Class/origin/status modifiers are applied on top of
 * the base score and may temporarily push an effective score outside 0-10.
 *
 * dexterity/constitution/wisdom remain required compatibility aliases while
 * the older UI and save data are migrated. They mirror agility/endurance/
 * perception and MUST NOT be treated as separate attributes.
 */
export interface CharacterStats {
  strength: number;
  perception?: number;
  endurance?: number;
  charisma: number;
  intelligence: number;
  agility?: number;
  luck?: number;

  /** @deprecated compatibility alias for agility */
  dexterity: number;
  /** @deprecated compatibility alias for endurance */
  constitution: number;
  /** @deprecated compatibility alias for perception */
  wisdom: number;
}

export type SpecialStat =
  | 'strength'
  | 'perception'
  | 'endurance'
  | 'charisma'
  | 'intelligence'
  | 'agility'
  | 'luck';

export const SPECIAL_STATS: readonly SpecialStat[] = [
  'strength',
  'perception',
  'endurance',
  'charisma',
  'intelligence',
  'agility',
  'luck',
] as const;

export const SPECIAL_ABBR: Record<SpecialStat, string> = {
  strength: 'STR',
  perception: 'PER',
  endurance: 'END',
  charisma: 'CHA',
  intelligence: 'INT',
  agility: 'AGI',
  luck: 'LCK',
};

export const SPECIAL_DESCRIPTIONS: Record<SpecialStat, string> = {
  strength: 'Raw physical force, lifting, melee power and intimidation through presence.',
  perception: 'Awareness, searching, spotting danger, reading details and sensory accuracy.',
  endurance: 'Stamina, pain tolerance, resistance, health and surviving harsh conditions.',
  charisma: 'Persuasion, deception, leadership, intimidation, bargaining and social leverage.',
  intelligence: 'Reasoning, technical knowledge, medicine, hacking, crafting and deduction.',
  agility: 'Reflexes, stealth, aim, movement, lockpicking, driving and fine motor control.',
  luck: 'Critical odds, fortunate breaks, searches, scavenging, gambling and unlikely outcomes.',
};

export type LegacyStatKey = 'dexterity' | 'constitution' | 'wisdom';
export type StatBonusKey = SpecialStat | LegacyStatKey;
export type StatBonuses = Partial<Record<StatBonusKey, number>>;

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  statBonuses: StatBonuses;
  startingItems: string[];
  abilities: string[];
  portraitHints?: string[]; // AI portrait generation hints
  clothingStyle?: string; // Description for AI portrait clothing
}

export interface CharacterBackground {
  id: string;
  name: string;
  description: string;
  statBonuses: StatBonuses;
  startingItems: string[];
  skills: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'quest';
  effects?: {
    stat?: StatBonusKey;
    modifier?: number;
  };
}

export interface RPGCharacter {
  name: string;
  classId: string;
  backgroundId: string;
  traits: string[];
  stats: CharacterStats;
  maxHealth: number;
  currentHealth: number;
  experience: number;
  level: number;
  inventory: InventoryItem[];
  abilities: string[];
  skills: string[];
  gold: number;
}

export interface DiceRoll {
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
  result: number;
  modifier: number;
  total: number;
  stat?: SpecialStat | LegacyStatKey;
  success?: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
}

/** Map a legacy stat name onto the one authoritative SPECIAL attribute. */
export function canonicalizeStatKey(stat: string): SpecialStat | null {
  const key = stat.toLowerCase().trim();
  if (key === 'dexterity' || key === 'dex' || key === 'agi') return 'agility';
  if (key === 'constitution' || key === 'con' || key === 'end') return 'endurance';
  if (key === 'wisdom' || key === 'wis' || key === 'per') return 'perception';
  if (key === 'str') return 'strength';
  if (key === 'cha') return 'charisma';
  if (key === 'int') return 'intelligence';
  if (key === 'lck') return 'luck';
  return (SPECIAL_STATS as readonly string[]).includes(key) ? key as SpecialStat : null;
}

/**
 * Convert old 8-20-ish ability scores onto the SPECIAL 0-10 scale.
 * The conversion is only used for legacy saves/data that do not have canonical
 * SPECIAL fields yet. It preserves relative strengths instead of resetting a
 * long-running character.
 */
export function legacyAbilityToSpecial(value: number | undefined, fallback = 1): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  if (value >= 0 && value <= 10) return Math.round(value);
  // 8 -> 1, 10 -> 3, 12 -> 4, 14 -> 6, 16 -> 7, 18 -> 9, 20+ -> 10.
  return Math.max(0, Math.min(10, Math.round(1 + (value - 8) * 0.75)));
}

/** Read a SPECIAL stat from either new or legacy character data. */
export function getSpecialStat(stats: Partial<CharacterStats> | null | undefined, stat: SpecialStat): number {
  if (!stats) return 1;
  const direct = stats[stat];
  if (typeof direct === 'number' && !Number.isNaN(direct)) return direct;

  if (stat === 'agility') return legacyAbilityToSpecial(stats.dexterity, 1);
  if (stat === 'endurance') return legacyAbilityToSpecial(stats.constitution, 1);
  if (stat === 'perception') return legacyAbilityToSpecial(stats.wisdom, 1);
  if (stat === 'luck') return 1;

  const legacyDirect = stats[stat];
  return legacyAbilityToSpecial(typeof legacyDirect === 'number' ? legacyDirect : undefined, 1);
}

/**
 * Normalize any historical stat object and keep aliases synchronized. This is
 * intentionally idempotent so restore/load/save code can call it freely.
 */
export function normalizeSpecialStats(input?: Partial<CharacterStats> | null): CharacterStats {
  const hasCanonical =
    typeof input?.perception === 'number' ||
    typeof input?.endurance === 'number' ||
    typeof input?.agility === 'number' ||
    typeof input?.luck === 'number';

  const read = (stat: SpecialStat, legacy?: number): number => {
    const direct = input?.[stat];
    if (typeof direct === 'number' && !Number.isNaN(direct)) return direct;
    if (hasCanonical) return stat === 'luck' ? 1 : legacyAbilityToSpecial(legacy, 1);
    return legacyAbilityToSpecial(legacy ?? (input?.[stat] as number | undefined), 1);
  };

  const strength = read('strength', input?.strength);
  const perception = read('perception', input?.wisdom);
  const endurance = read('endurance', input?.constitution);
  const charisma = read('charisma', input?.charisma);
  const intelligence = read('intelligence', input?.intelligence);
  const agility = read('agility', input?.dexterity);
  const luck = read('luck');

  return {
    strength,
    perception,
    endurance,
    charisma,
    intelligence,
    agility,
    luck,
    // Compatibility aliases. Keep these synchronized until every old UI path
    // has moved to the canonical names.
    dexterity: agility,
    constitution: endurance,
    wisdom: perception,
  };
}

/** Normalize class/origin bonuses without rewriting every existing genre pack. */
export function normalizeStatBonuses(bonuses?: StatBonuses | null): Partial<Record<SpecialStat, number>> {
  const result: Partial<Record<SpecialStat, number>> = {};
  if (!bonuses) return result;

  for (const [rawKey, rawValue] of Object.entries(bonuses)) {
    if (typeof rawValue !== 'number' || Number.isNaN(rawValue) || rawValue === 0) continue;
    const stat = canonicalizeStatKey(rawKey);
    if (!stat) continue;
    result[stat] = (result[stat] || 0) + rawValue;
  }
  return result;
}

/**
 * Build final character stats from player base SPECIAL + mandatory class/origin
 * bonuses. Bonuses do not consume the player's allocation pool.
 */
export function buildSpecialStats(
  baseInput: Partial<Record<SpecialStat, number>> | Partial<CharacterStats>,
  classBonuses?: StatBonuses | null,
  originBonuses?: StatBonuses | null,
): CharacterStats {
  const classMods = normalizeStatBonuses(classBonuses);
  const originMods = normalizeStatBonuses(originBonuses);
  const values = {} as Record<SpecialStat, number>;

  for (const stat of SPECIAL_STATS) {
    const raw = (baseInput as any)?.[stat];
    const base = typeof raw === 'number' && !Number.isNaN(raw) ? raw : 1;
    // Base allocation is 0-10. Mandatory bonuses/debuffs are allowed to push
    // effective values outside that base band, with a floor of 0.
    values[stat] = Math.max(0, Math.min(10, base)) + (classMods[stat] || 0) + (originMods[stat] || 0);
    values[stat] = Math.max(0, values[stat]);
  }

  return {
    ...values,
    dexterity: values.agility,
    constitution: values.endurance,
    wisdom: values.perception,
  };
}

// Class definitions
export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'A master of combat, trained in weapons and armor.',
    statBonuses: { strength: 2, constitution: 1 },
    startingItems: ['Iron Sword', 'Leather Armor', 'Health Potion'],
    abilities: ['Power Strike', 'Shield Block'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A cunning operative skilled in stealth and subterfuge.',
    statBonuses: { dexterity: 2, charisma: 1 },
    startingItems: ['Daggers (pair)', 'Lockpicks', 'Smoke Bomb'],
    abilities: ['Sneak Attack', 'Vanish'],
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'A wielder of arcane forces and forbidden knowledge.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Oak Staff', 'Spellbook', 'Mana Potion'],
    abilities: ['Arcane Bolt', 'Magic Shield'],
  },
  {
    id: 'cleric',
    name: 'Cleric',
    description: 'A divine servant blessed with healing and protective powers.',
    statBonuses: { wisdom: 2, constitution: 1 },
    startingItems: ['Holy Mace', 'Prayer Beads', 'Healing Salve'],
    abilities: ['Heal Wounds', 'Divine Protection'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'A wilderness expert and deadly archer.',
    statBonuses: { dexterity: 1, wisdom: 1, constitution: 1 },
    startingItems: ['Longbow', 'Arrows (20)', 'Hunting Knife', 'Rope'],
    abilities: ['Precise Shot', 'Animal Companion'],
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'A charismatic performer who weaves magic through music.',
    statBonuses: { charisma: 2, dexterity: 1 },
    startingItems: ['Lute', 'Rapier', 'Fine Clothes'],
    abilities: ['Inspiring Song', 'Charm Person'],
  },
];

// Background definitions
export const CHARACTER_BACKGROUNDS: CharacterBackground[] = [
  {
    id: 'noble',
    name: 'Noble',
    description: 'Born into wealth and privilege, trained in etiquette and leadership.',
    statBonuses: { charisma: 1 },
    startingItems: ['Signet Ring', 'Fine Clothes', 'Purse of Gold'],
    skills: ['Persuasion', 'History', 'Etiquette'],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    description: 'A life of crime has taught you valuable survival skills.',
    statBonuses: { dexterity: 1 },
    startingItems: ['Crowbar', 'Dark Cloak', 'Thieves\' Tools'],
    skills: ['Stealth', 'Deception', 'Streetwise'],
  },
  {
    id: 'soldier',
    name: 'Soldier',
    description: 'Years of military service have hardened you for battle.',
    statBonuses: { strength: 1 },
    startingItems: ['Military Insignia', 'Dice Set', 'Trophy from Fallen Enemy'],
    skills: ['Athletics', 'Intimidation', 'Tactics'],
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'A lifetime of study has given you vast knowledge.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Research Notes', 'Quill & Ink', 'Rare Book'],
    skills: ['Arcana', 'Investigation', 'Lore'],
  },
  {
    id: 'outlander',
    name: 'Outlander',
    description: 'Raised far from civilization, at home in the wild.',
    statBonuses: { constitution: 1 },
    startingItems: ['Hunting Trap', 'Staff', 'Traveler\'s Clothes'],
    skills: ['Survival', 'Nature', 'Athletics'],
  },
  {
    id: 'acolyte',
    name: 'Acolyte',
    description: 'Devoted to a higher power, trained in temples and shrines.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Holy Symbol', 'Prayer Book', 'Incense'],
    skills: ['Religion', 'Insight', 'Medicine'],
  },
];

// Trait options
export const CHARACTER_TRAITS = [
  'Brave', 'Cautious', 'Cunning', 'Honest', 'Mysterious',
  'Hot-headed', 'Calm', 'Curious', 'Loyal', 'Ambitious',
  'Compassionate', 'Ruthless', 'Witty', 'Stoic', 'Optimistic', 'Lucky',
];

/** New-character default: every SPECIAL attribute starts at exactly 1. */
export function createDefaultStats(): CharacterStats {
  return normalizeSpecialStats({
    strength: 1,
    perception: 1,
    endurance: 1,
    charisma: 1,
    intelligence: 1,
    agility: 1,
    luck: 1,
    dexterity: 1,
    constitution: 1,
    wisdom: 1,
  });
}

/**
 * SPECIAL check modifier. 5 is neutral, 0 is -5 and 10 is +5.
 * Values above 10 can exist through buffs/classes and continue scaling.
 * Legacy scores above 10 retain the historical D&D modifier so old screens do
 * not become nonsense before their saved character is normalized.
 */
export function getStatModifier(statValue: number): number {
  if (typeof statValue !== 'number' || Number.isNaN(statValue)) return 0;
  if (statValue > 10) return Math.floor((statValue - 10) / 2);
  return Math.floor(statValue - 5);
}

export function rollDice(
  type: DiceRoll['type'],
  stat?: SpecialStat | LegacyStatKey,
  stats?: CharacterStats,
  difficulty?: number
): DiceRoll {
  const diceMax = parseInt(type.slice(1));
  const result = Math.floor(Math.random() * diceMax) + 1;
  const canonical = stat ? canonicalizeStatKey(stat) : null;
  const statValue = canonical && stats ? getSpecialStat(stats, canonical) : undefined;
  const modifier = typeof statValue === 'number' ? getStatModifier(statValue) : 0;
  const total = result + modifier;

  const luck = stats ? getSpecialStat(stats, 'luck') : 1;
  const critSuccessFloor = luck >= 9 ? 19 : 20;
  const critFailureCeiling = luck <= 1 ? 2 : 1;

  const roll: DiceRoll = {
    type,
    result,
    modifier,
    total,
    stat: canonical || stat,
  };

  if (type === 'd20') {
    roll.criticalSuccess = result >= critSuccessFloor;
    roll.criticalFailure = result <= critFailureCeiling;
    if (difficulty !== undefined) {
      roll.success = roll.criticalSuccess || (!roll.criticalFailure && total >= difficulty);
    }
  }

  return roll;
}

export function calculateMaxHealth(stats: CharacterStats, level: number): number {
  const endurance = getSpecialStat(stats, 'endurance');
  const baseHealth = 60 + Math.round(endurance * 6);
  const levelBonus = Math.max(0, level - 1) * (4 + Math.floor(endurance / 2));
  return Math.max(10, baseHealth + levelBonus);
}

// Migrate old character health AND old D&D-ish stats to the SPECIAL model.
export function migrateCharacterHealth(character: RPGCharacter): RPGCharacter {
  const normalizedStats = normalizeSpecialStats(character.stats);
  const correctMaxHealth = calculateMaxHealth(normalizedStats, character.level);
  const oldMax = Math.max(1, character.maxHealth || correctMaxHealth);
  const healthRatio = Math.max(0, Math.min(1, (character.currentHealth ?? oldMax) / oldMax));
  const statsChanged =
    character.stats.perception === undefined ||
    character.stats.endurance === undefined ||
    character.stats.agility === undefined ||
    character.stats.luck === undefined;
  const healthClearlyLegacy = Math.abs(oldMax - correctMaxHealth) > 20 || character.maxHealth < 50;

  if (statsChanged || healthClearlyLegacy) {
    const newCurrentHealth = Math.max(0, Math.min(correctMaxHealth, Math.round(healthRatio * correctMaxHealth)));
    console.log('[CharacterMigration] Migrating character to SPECIAL', {
      oldStats: character.stats,
      newStats: normalizedStats,
      oldHealth: character.maxHealth,
      newHealth: correctMaxHealth,
    });
    return {
      ...character,
      stats: normalizedStats,
      maxHealth: correctMaxHealth,
      currentHealth: newCurrentHealth,
    };
  }

  // Keep aliases synchronized even on already-migrated saves.
  return { ...character, stats: normalizedStats };
}

export function createCharacter(
  name: string,
  classId: string,
  backgroundId: string,
  traits: string[],
  statAllocation: Partial<CharacterStats>
): RPGCharacter {
  const characterClass = CHARACTER_CLASSES.find(c => c.id === classId)!;
  const background = CHARACTER_BACKGROUNDS.find(b => b.id === backgroundId)!;

  // Allocation values are the player's BASE SPECIAL values. Class and origin
  // bonuses are mandatory modifiers applied afterward and do not consume points.
  const stats = buildSpecialStats(
    {
      strength: statAllocation.strength ?? 1,
      perception: statAllocation.perception ?? statAllocation.wisdom ?? 1,
      endurance: statAllocation.endurance ?? statAllocation.constitution ?? 1,
      charisma: statAllocation.charisma ?? 1,
      intelligence: statAllocation.intelligence ?? 1,
      agility: statAllocation.agility ?? statAllocation.dexterity ?? 1,
      luck: statAllocation.luck ?? 1,
    },
    characterClass.statBonuses,
    background.statBonuses,
  );

  const maxHealth = calculateMaxHealth(stats, 1);

  const inventory: InventoryItem[] = [
    ...characterClass.startingItems.map((item, idx) => ({
      id: `class_${idx}`,
      name: item,
      description: `Starting ${characterClass.name} equipment`,
      quantity: 1,
      type: 'tool' as const,
    })),
    ...background.startingItems.map((item, idx) => ({
      id: `bg_${idx}`,
      name: item,
      description: `From your ${background.name} background`,
      quantity: 1,
      type: 'tool' as const,
    })),
  ];

  return {
    name,
    classId,
    backgroundId,
    traits,
    stats,
    maxHealth,
    currentHealth: maxHealth,
    experience: 0,
    level: 1,
    inventory,
    abilities: [...characterClass.abilities],
    skills: [...background.skills],
    gold: backgroundId === 'noble' ? 50 : 15,
  };
}

export function formatCharacterForAI(character: RPGCharacter): string {
  const characterClass = CHARACTER_CLASSES.find(c => c.id === character.classId);
  const background = CHARACTER_BACKGROUNDS.find(b => b.id === character.backgroundId);
  const stats = normalizeSpecialStats(character.stats);

  const specialLines = SPECIAL_STATS.map(stat => {
    const value = getSpecialStat(stats, stat);
    const mod = getStatModifier(value);
    return `- ${SPECIAL_ABBR[stat]} ${stat[0].toUpperCase()}${stat.slice(1)}: ${value} (${mod >= 0 ? '+' : ''}${mod})`;
  }).join('\n');

  return `
CHARACTER SHEET:
Name: ${character.name}
Class: ${characterClass?.name || character.classId} (Level ${character.level})
Background/Origin: ${background?.name || character.backgroundId}
Traits: ${character.traits.join(', ')}

SPECIAL:
${specialLines}

Health: ${character.currentHealth}/${character.maxHealth}
Gold: ${character.gold}

Abilities: ${character.abilities.join(', ')}
Skills: ${character.skills.join(', ')}

Inventory: ${character.inventory.map(i => i.name + (i.quantity > 1 ? ` (x${i.quantity})` : '')).join(', ')}
`.trim();
}
