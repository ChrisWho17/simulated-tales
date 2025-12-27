// RPG Character Types

export interface CharacterStats {
  strength: number;      // Physical power, melee damage
  dexterity: number;     // Agility, stealth, ranged attacks
  constitution: number;  // Health, endurance, resistance
  intelligence: number;  // Knowledge, magic, problem-solving
  wisdom: number;        // Perception, intuition, willpower
  charisma: number;      // Social influence, persuasion, leadership
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  statBonuses: Partial<CharacterStats>;
  startingItems: string[];
  abilities: string[];
  portraitHints?: string[]; // AI portrait generation hints
  clothingStyle?: string; // Description for AI portrait clothing
}

export interface CharacterBackground {
  id: string;
  name: string;
  description: string;
  statBonuses: Partial<CharacterStats>;
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
    stat?: keyof CharacterStats;
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
  stat?: keyof CharacterStats;
  success?: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
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
  'Compassionate', 'Ruthless', 'Witty', 'Stoic', 'Optimistic',
];

// Helper functions
export function createDefaultStats(): CharacterStats {
  return {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };
}

export function getStatModifier(statValue: number): number {
  return Math.floor((statValue - 10) / 2);
}

export function rollDice(
  type: DiceRoll['type'], 
  stat?: keyof CharacterStats, 
  stats?: CharacterStats,
  difficulty?: number
): DiceRoll {
  const diceMax = parseInt(type.slice(1));
  const result = Math.floor(Math.random() * diceMax) + 1;
  const modifier = stat && stats ? getStatModifier(stats[stat]) : 0;
  const total = result + modifier;

  const roll: DiceRoll = {
    type,
    result,
    modifier,
    total,
    stat,
  };

  if (type === 'd20') {
    roll.criticalSuccess = result === 20;
    roll.criticalFailure = result === 1;
    if (difficulty !== undefined) {
      roll.success = roll.criticalSuccess || (!roll.criticalFailure && total >= difficulty);
    }
  }

  return roll;
}

export function calculateMaxHealth(stats: CharacterStats, level: number): number {
  // Base health: 90 at 10 CON (0 modifier), +1.75 HP per point above 10
  const conMod = getStatModifier(stats.constitution);
  const baseHealth = 90;
  const conBonus = Math.floor(conMod * 1.75);
  const levelBonus = (level - 1) * 6;
  return baseHealth + conBonus + (conMod * (level - 1)) + levelBonus;
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

  // Base stats + allocation + class bonuses + background bonuses
  const stats: CharacterStats = {
    strength: 8 + (statAllocation.strength || 0) + (characterClass.statBonuses.strength || 0) + (background.statBonuses.strength || 0),
    dexterity: 8 + (statAllocation.dexterity || 0) + (characterClass.statBonuses.dexterity || 0) + (background.statBonuses.dexterity || 0),
    constitution: 8 + (statAllocation.constitution || 0) + (characterClass.statBonuses.constitution || 0) + (background.statBonuses.constitution || 0),
    intelligence: 8 + (statAllocation.intelligence || 0) + (characterClass.statBonuses.intelligence || 0) + (background.statBonuses.intelligence || 0),
    wisdom: 8 + (statAllocation.wisdom || 0) + (characterClass.statBonuses.wisdom || 0) + (background.statBonuses.wisdom || 0),
    charisma: 8 + (statAllocation.charisma || 0) + (characterClass.statBonuses.charisma || 0) + (background.statBonuses.charisma || 0),
  };

  const maxHealth = calculateMaxHealth(stats, 1);

  // Build starting inventory
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

  return `
CHARACTER SHEET:
Name: ${character.name}
Class: ${characterClass?.name || character.classId} (Level ${character.level})
Background: ${background?.name || character.backgroundId}
Traits: ${character.traits.join(', ')}

STATS:
- Strength: ${character.stats.strength} (${getStatModifier(character.stats.strength) >= 0 ? '+' : ''}${getStatModifier(character.stats.strength)})
- Dexterity: ${character.stats.dexterity} (${getStatModifier(character.stats.dexterity) >= 0 ? '+' : ''}${getStatModifier(character.stats.dexterity)})
- Constitution: ${character.stats.constitution} (${getStatModifier(character.stats.constitution) >= 0 ? '+' : ''}${getStatModifier(character.stats.constitution)})
- Intelligence: ${character.stats.intelligence} (${getStatModifier(character.stats.intelligence) >= 0 ? '+' : ''}${getStatModifier(character.stats.intelligence)})
- Wisdom: ${character.stats.wisdom} (${getStatModifier(character.stats.wisdom) >= 0 ? '+' : ''}${getStatModifier(character.stats.wisdom)})
- Charisma: ${character.stats.charisma} (${getStatModifier(character.stats.charisma) >= 0 ? '+' : ''}${getStatModifier(character.stats.charisma)})

Health: ${character.currentHealth}/${character.maxHealth}
Gold: ${character.gold}

Abilities: ${character.abilities.join(', ')}
Skills: ${character.skills.join(', ')}

Inventory: ${character.inventory.map(i => i.name + (i.quantity > 1 ? ` (x${i.quantity})` : '')).join(', ')}
`.trim();
}
