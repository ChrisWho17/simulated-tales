// Genre-specific RPG Character Types and Data
import { CharacterClass, CharacterBackground, CharacterStats, InventoryItem, RPGCharacter, getStatModifier, calculateMaxHealth } from './rpgCharacter';

export type GameGenre = 'fantasy' | 'scifi' | 'horror' | 'mystery' | 'pirate' | 'western' | 'cyberpunk' | 'postapoc' | 'custom';

export interface GenreData {
  id: GameGenre;
  name: string;
  classes: CharacterClass[];
  backgrounds: CharacterBackground[];
  traits: string[];
  currency: string;
  startingCurrency: number;
}

// Fantasy Classes & Backgrounds
const FANTASY_CLASSES: CharacterClass[] = [
  { id: 'warrior', name: 'Warrior', description: 'A master of combat, trained in weapons and armor.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Iron Sword', 'Leather Armor', 'Health Potion'], abilities: ['Power Strike', 'Shield Block'] },
  { id: 'rogue', name: 'Rogue', description: 'A cunning operative skilled in stealth and subterfuge.', statBonuses: { dexterity: 2, charisma: 1 }, startingItems: ['Daggers', 'Lockpicks', 'Smoke Bomb'], abilities: ['Sneak Attack', 'Vanish'] },
  { id: 'mage', name: 'Mage', description: 'A wielder of arcane forces and forbidden knowledge.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Oak Staff', 'Spellbook', 'Mana Potion'], abilities: ['Arcane Bolt', 'Magic Shield'] },
  { id: 'cleric', name: 'Cleric', description: 'A divine servant blessed with healing powers.', statBonuses: { wisdom: 2, constitution: 1 }, startingItems: ['Holy Mace', 'Prayer Beads', 'Healing Salve'], abilities: ['Heal Wounds', 'Divine Protection'] },
  { id: 'ranger', name: 'Ranger', description: 'A wilderness expert and deadly archer.', statBonuses: { dexterity: 1, wisdom: 1, constitution: 1 }, startingItems: ['Longbow', 'Arrows', 'Hunting Knife'], abilities: ['Precise Shot', 'Animal Companion'] },
  { id: 'bard', name: 'Bard', description: 'A charismatic performer who weaves magic through music.', statBonuses: { charisma: 2, dexterity: 1 }, startingItems: ['Lute', 'Rapier', 'Fine Clothes'], abilities: ['Inspiring Song', 'Charm Person'] },
];

const FANTASY_BACKGROUNDS: CharacterBackground[] = [
  { id: 'noble', name: 'Noble', description: 'Born into wealth and privilege.', statBonuses: { charisma: 1 }, startingItems: ['Signet Ring', 'Fine Clothes'], skills: ['Persuasion', 'History', 'Etiquette'] },
  { id: 'criminal', name: 'Criminal', description: 'A life of crime taught you survival skills.', statBonuses: { dexterity: 1 }, startingItems: ['Crowbar', 'Dark Cloak'], skills: ['Stealth', 'Deception', 'Streetwise'] },
  { id: 'soldier', name: 'Soldier', description: 'Years of military service hardened you.', statBonuses: { strength: 1 }, startingItems: ['Military Insignia', 'War Trophy'], skills: ['Athletics', 'Intimidation', 'Tactics'] },
  { id: 'scholar', name: 'Scholar', description: 'A lifetime of study gave you vast knowledge.', statBonuses: { intelligence: 1 }, startingItems: ['Research Notes', 'Rare Book'], skills: ['Arcana', 'Investigation', 'Lore'] },
  { id: 'outlander', name: 'Outlander', description: 'Raised far from civilization.', statBonuses: { constitution: 1 }, startingItems: ['Hunting Trap', 'Staff'], skills: ['Survival', 'Nature', 'Athletics'] },
  { id: 'acolyte', name: 'Acolyte', description: 'Devoted to a higher power.', statBonuses: { wisdom: 1 }, startingItems: ['Holy Symbol', 'Prayer Book'], skills: ['Religion', 'Insight', 'Medicine'] },
];

// Sci-Fi Classes & Backgrounds
const SCIFI_CLASSES: CharacterClass[] = [
  { id: 'marine', name: 'Marine', description: 'Elite soldier trained in zero-G combat and advanced weaponry.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Plasma Rifle', 'Combat Armor', 'Medkit'], abilities: ['Suppressing Fire', 'Combat Roll'] },
  { id: 'hacker', name: 'Hacker', description: 'Master of networks, systems, and digital warfare.', statBonuses: { intelligence: 2, dexterity: 1 }, startingItems: ['Neural Interface', 'Hacking Deck', 'EMP Grenade'], abilities: ['System Override', 'Data Mine'] },
  { id: 'pilot', name: 'Pilot', description: 'Ace starship operator with unmatched reflexes.', statBonuses: { dexterity: 2, wisdom: 1 }, startingItems: ['Flight Suit', 'Laser Pistol', 'Navigation Module'], abilities: ['Evasive Maneuvers', 'Quick Draw'] },
  { id: 'medic', name: 'Medic', description: 'Combat physician with advanced healing tech.', statBonuses: { wisdom: 2, intelligence: 1 }, startingItems: ['Medical Scanner', 'Nano-Injector', 'Stim Packs'], abilities: ['Emergency Heal', 'Stabilize'] },
  { id: 'engineer', name: 'Engineer', description: 'Tech specialist who builds and repairs anything.', statBonuses: { intelligence: 1, dexterity: 1, constitution: 1 }, startingItems: ['Multi-Tool', 'Repair Drone', 'Spare Parts'], abilities: ['Quick Fix', 'Deploy Turret'] },
  { id: 'diplomat', name: 'Diplomat', description: 'Negotiator and face of any operation.', statBonuses: { charisma: 2, wisdom: 1 }, startingItems: ['Translator Device', 'Encrypted Comm', 'Fine Attire'], abilities: ['Silver Tongue', 'Read Intentions'] },
];

const SCIFI_BACKGROUNDS: CharacterBackground[] = [
  { id: 'colonist', name: 'Colonist', description: 'Grew up on a frontier world, self-reliant.', statBonuses: { constitution: 1 }, startingItems: ['Survival Kit', 'Respirator'], skills: ['Survival', 'Repair', 'Piloting'] },
  { id: 'corporate', name: 'Corporate', description: 'Raised in mega-corp luxury with connections.', statBonuses: { charisma: 1 }, startingItems: ['Corporate ID', 'Credit Chip'], skills: ['Negotiation', 'Business', 'Etiquette'] },
  { id: 'military', name: 'Military', description: 'Served in the Fleet or Marines.', statBonuses: { strength: 1 }, startingItems: ['Dog Tags', 'Combat Knife'], skills: ['Tactics', 'Athletics', 'Intimidation'] },
  { id: 'scientist', name: 'Scientist', description: 'Dedicated researcher from a lab or institute.', statBonuses: { intelligence: 1 }, startingItems: ['Data Pad', 'Research Notes'], skills: ['Science', 'Analysis', 'Medicine'] },
  { id: 'smuggler', name: 'Smuggler', description: 'Made a living moving cargo others cannot.', statBonuses: { dexterity: 1 }, startingItems: ['Hidden Compartment', 'Fake ID'], skills: ['Deception', 'Piloting', 'Streetwise'] },
  { id: 'spacer', name: 'Spacer', description: 'Born in the void, never knew planetside life.', statBonuses: { wisdom: 1 }, startingItems: ['Vac Suit Patch Kit', 'Star Map'], skills: ['Zero-G', 'Navigation', 'Engineering'] },
];

// Horror Classes & Backgrounds  
const HORROR_CLASSES: CharacterClass[] = [
  { id: 'investigator', name: 'Investigator', description: 'Trained to uncover dark secrets and hidden truths.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Flashlight', 'Notebook', 'Camera'], abilities: ['Keen Eye', 'Research'] },
  { id: 'survivor', name: 'Survivor', description: 'Hardened by trauma, refuses to die.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['First Aid Kit', 'Pocket Knife', 'Matches'], abilities: ['Adrenaline Rush', 'Play Dead'] },
  { id: 'occultist', name: 'Occultist', description: 'Dabbles in forbidden knowledge and dark arts.', statBonuses: { intelligence: 1, wisdom: 2 }, startingItems: ['Grimoire', 'Candles', 'Salt'], abilities: ['Ritual Ward', 'Sense Supernatural'] },
  { id: 'protector', name: 'Protector', description: 'Sworn to defend others from the darkness.', statBonuses: { strength: 2, wisdom: 1 }, startingItems: ['Crowbar', 'Protective Charm', 'Bandages'], abilities: ['Stand Guard', 'Inspiring Presence'] },
  { id: 'medic', name: 'Medic', description: 'Keeps people alive when help is not coming.', statBonuses: { wisdom: 2, dexterity: 1 }, startingItems: ['Medical Bag', 'Painkillers', 'Suture Kit'], abilities: ['Emergency Treatment', 'Calm Nerves'] },
  { id: 'scavenger', name: 'Scavenger', description: 'Finds useful things where others see junk.', statBonuses: { dexterity: 2, intelligence: 1 }, startingItems: ['Backpack', 'Multitool', 'Rope'], abilities: ['Scrounger', 'Improvise Weapon'] },
];

const HORROR_BACKGROUNDS: CharacterBackground[] = [
  { id: 'traumatized', name: 'Traumatized', description: 'Witnessed something that broke you—and rebuilt you.', statBonuses: { wisdom: 1 }, startingItems: ['Medication', 'Keepsake'], skills: ['Insight', 'Stealth', 'Resolve'] },
  { id: 'skeptic', name: 'Skeptic', description: 'Never believed in the supernatural—until now.', statBonuses: { intelligence: 1 }, startingItems: ['Recording Device', 'Skeptic\'s Journal'], skills: ['Logic', 'Investigation', 'Persuasion'] },
  { id: 'believer', name: 'Believer', description: 'Faith guides you through the darkness.', statBonuses: { charisma: 1 }, startingItems: ['Holy Symbol', 'Scripture'], skills: ['Religion', 'Comfort', 'Determination'] },
  { id: 'criminal', name: 'Ex-Criminal', description: 'Your past taught you how to survive.', statBonuses: { dexterity: 1 }, startingItems: ['Lockpick Set', 'Burner Phone'], skills: ['Stealth', 'Lockpicking', 'Streetwise'] },
  { id: 'academic', name: 'Academic', description: 'Studied the unknown from safe distance—no longer.', statBonuses: { intelligence: 1 }, startingItems: ['Research Files', 'Laptop'], skills: ['Research', 'Occult', 'History'] },
  { id: 'loner', name: 'Loner', description: 'You work alone. Attachments get people killed.', statBonuses: { constitution: 1 }, startingItems: ['Survival Gear', 'Hidden Stash'], skills: ['Survival', 'Stealth', 'Awareness'] },
];

// Mystery/Detective Classes & Backgrounds
const MYSTERY_CLASSES: CharacterClass[] = [
  { id: 'detective', name: 'Private Detective', description: 'Seasoned investigator who always finds the truth.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Magnifying Glass', 'Notebook', 'Revolver'], abilities: ['Deduce', 'Interrogate'] },
  { id: 'journalist', name: 'Journalist', description: 'Chases stories others are afraid to tell.', statBonuses: { charisma: 2, intelligence: 1 }, startingItems: ['Press Badge', 'Camera', 'Recorder'], abilities: ['Expose', 'Connect Dots'] },
  { id: 'enforcer', name: 'Enforcer', description: 'Muscle who knows when to apply pressure.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Brass Knuckles', 'Leather Jacket', 'Flask'], abilities: ['Intimidate', 'Tough It Out'] },
  { id: 'grifter', name: 'Grifter', description: 'Con artist with a silver tongue and quick hands.', statBonuses: { charisma: 2, dexterity: 1 }, startingItems: ['Fake IDs', 'Lockpick', 'Hidden Cash'], abilities: ['Fast Talk', 'Misdirection'] },
  { id: 'fixer', name: 'Fixer', description: 'Knows everyone and can get anything.', statBonuses: { charisma: 1, intelligence: 1, wisdom: 1 }, startingItems: ['Contact Book', 'Burner Phone', 'Favors Owed'], abilities: ['Call In Favor', 'Street Knowledge'] },
  { id: 'veteran', name: 'Veteran', description: 'War taught you skills the world forgot.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['Service Pistol', 'Dog Tags', 'Lighter'], abilities: ['Combat Instinct', 'Stay Frosty'] },
];

const MYSTERY_BACKGROUNDS: CharacterBackground[] = [
  { id: 'cop', name: 'Former Cop', description: 'Badge is gone but instincts remain.', statBonuses: { wisdom: 1 }, startingItems: ['Old Badge', 'Police Scanner'], skills: ['Investigation', 'Intimidation', 'Procedures'] },
  { id: 'criminal', name: 'Reformed Criminal', description: 'Know the underworld from the inside.', statBonuses: { dexterity: 1 }, startingItems: ['Contacts List', 'Hidden Knife'], skills: ['Streetwise', 'Lockpicking', 'Deception'] },
  { id: 'wealthy', name: 'Wealthy Elite', description: 'Money opens doors others cannot see.', statBonuses: { charisma: 1 }, startingItems: ['Expensive Watch', 'Club Membership'], skills: ['Etiquette', 'Connections', 'Bribery'] },
  { id: 'academic', name: 'Academic', description: 'Knowledge is your weapon of choice.', statBonuses: { intelligence: 1 }, startingItems: ['Research Notes', 'University Access'], skills: ['Research', 'Analysis', 'History'] },
  { id: 'streetwise', name: 'Street Rat', description: 'The streets raised you tough and aware.', statBonuses: { constitution: 1 }, startingItems: ['Street Clothes', 'Hidden Stash'], skills: ['Survival', 'Pickpocket', 'Stealth'] },
  { id: 'veteran', name: 'War Veteran', description: 'Combat taught you to read people fast.', statBonuses: { strength: 1 }, startingItems: ['Service Medal', 'Combat Knife'], skills: ['Tactics', 'Firearms', 'Discipline'] },
];

// Pirate Classes & Backgrounds
const PIRATE_CLASSES: CharacterClass[] = [
  { id: 'captain', name: 'Captain', description: 'Born leader who commands respect and loyalty.', statBonuses: { charisma: 2, wisdom: 1 }, startingItems: ['Captain\'s Hat', 'Cutlass', 'Spyglass'], abilities: ['Rally Crew', 'Command'] },
  { id: 'swashbuckler', name: 'Swashbuckler', description: 'Dashing swordsman with unmatched agility.', statBonuses: { dexterity: 2, charisma: 1 }, startingItems: ['Rapier', 'Pistol', 'Rope'], abilities: ['Riposte', 'Acrobatics'] },
  { id: 'gunner', name: 'Gunner', description: 'Master of cannons and firearms.', statBonuses: { dexterity: 1, intelligence: 1, strength: 1 }, startingItems: ['Flintlock Pistols', 'Powder Horn', 'Cannon Fuse'], abilities: ['Dead Eye', 'Quick Reload'] },
  { id: 'navigator', name: 'Navigator', description: 'Reads the stars and charts unknown waters.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Compass', 'Sea Charts', 'Sextant'], abilities: ['Plot Course', 'Weather Sense'] },
  { id: 'surgeon', name: 'Ship\'s Surgeon', description: 'Keeps the crew alive with limited resources.', statBonuses: { wisdom: 2, intelligence: 1 }, startingItems: ['Surgical Kit', 'Rum', 'Bandages'], abilities: ['Field Surgery', 'Diagnose'] },
  { id: 'boatswain', name: 'Boatswain', description: 'Tough sailor who keeps the ship running.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Marlinspike', 'Rope', 'Whistle'], abilities: ['Ship Repair', 'Intimidate'] },
];

const PIRATE_BACKGROUNDS: CharacterBackground[] = [
  { id: 'navy', name: 'Navy Deserter', description: 'Turned your back on the Crown\'s fleet.', statBonuses: { strength: 1 }, startingItems: ['Naval Uniform', 'Cutlass'], skills: ['Sailing', 'Navigation', 'Discipline'] },
  { id: 'merchant', name: 'Merchant Sailor', description: 'Traded goods before trading lead.', statBonuses: { charisma: 1 }, startingItems: ['Trade Ledger', 'Contacts'], skills: ['Bargaining', 'Appraisal', 'Languages'] },
  { id: 'criminal', name: 'Wanted Criminal', description: 'The sea was your only escape.', statBonuses: { dexterity: 1 }, startingItems: ['Wanted Poster', 'Disguise Kit'], skills: ['Stealth', 'Deception', 'Escape'] },
  { id: 'islander', name: 'Island Native', description: 'Born to the sea and its secrets.', statBonuses: { wisdom: 1 }, startingItems: ['Tribal Charm', 'Fishing Net'], skills: ['Swimming', 'Survival', 'Weather'] },
  { id: 'noble', name: 'Disgraced Noble', description: 'Lost your title, seeking fortune at sea.', statBonuses: { charisma: 1 }, startingItems: ['Family Crest', 'Fine Dagger'], skills: ['Etiquette', 'Fencing', 'History'] },
  { id: 'slave', name: 'Freed Slave', description: 'Won your freedom through blood and cunning.', statBonuses: { constitution: 1 }, startingItems: ['Broken Chain', 'Hidden Blade'], skills: ['Endurance', 'Stealth', 'Determination'] },
];

// Genre Trait Sets
const FANTASY_TRAITS = ['Brave', 'Cautious', 'Cunning', 'Honest', 'Mysterious', 'Hot-headed', 'Calm', 'Curious', 'Loyal', 'Ambitious', 'Compassionate', 'Ruthless', 'Witty', 'Stoic', 'Optimistic'];
const SCIFI_TRAITS = ['Analytical', 'Rebellious', 'Methodical', 'Reckless', 'Paranoid', 'Idealistic', 'Cynical', 'Tech-savvy', 'Lone Wolf', 'Team Player', 'By-the-book', 'Improviser', 'Cold', 'Empathetic', 'Resourceful'];
const HORROR_TRAITS = ['Paranoid', 'Skeptical', 'Faithful', 'Nihilistic', 'Protective', 'Self-preserving', 'Curious', 'Traumatized', 'Calm under pressure', 'Panicky', 'Obsessive', 'Detached', 'Compassionate', 'Ruthless', 'Determined'];
const MYSTERY_TRAITS = ['Observant', 'Suspicious', 'Charming', 'Blunt', 'Patient', 'Impulsive', 'Methodical', 'Intuitive', 'Cynical', 'Idealistic', 'Secretive', 'Honest', 'Manipulative', 'Empathetic', 'Cold'];
const PIRATE_TRAITS = ['Greedy', 'Honorable', 'Ruthless', 'Loyal', 'Superstitious', 'Skeptical', 'Reckless', 'Cautious', 'Charming', 'Intimidating', 'Cunning', 'Honest', 'Vengeful', 'Forgiving', 'Ambitious'];

// Genre Data Map
export const GENRE_DATA: Record<GameGenre, GenreData> = {
  fantasy: { id: 'fantasy', name: 'Fantasy', classes: FANTASY_CLASSES, backgrounds: FANTASY_BACKGROUNDS, traits: FANTASY_TRAITS, currency: 'Gold', startingCurrency: 15 },
  scifi: { id: 'scifi', name: 'Sci-Fi', classes: SCIFI_CLASSES, backgrounds: SCIFI_BACKGROUNDS, traits: SCIFI_TRAITS, currency: 'Credits', startingCurrency: 500 },
  horror: { id: 'horror', name: 'Horror', classes: HORROR_CLASSES, backgrounds: HORROR_BACKGROUNDS, traits: HORROR_TRAITS, currency: 'Dollars', startingCurrency: 50 },
  mystery: { id: 'mystery', name: 'Mystery/Noir', classes: MYSTERY_CLASSES, backgrounds: MYSTERY_BACKGROUNDS, traits: MYSTERY_TRAITS, currency: 'Dollars', startingCurrency: 100 },
  pirate: { id: 'pirate', name: 'Pirate', classes: PIRATE_CLASSES, backgrounds: PIRATE_BACKGROUNDS, traits: PIRATE_TRAITS, currency: 'Doubloons', startingCurrency: 20 },
  western: { id: 'western', name: 'Western', classes: MYSTERY_CLASSES, backgrounds: MYSTERY_BACKGROUNDS, traits: MYSTERY_TRAITS, currency: 'Dollars', startingCurrency: 25 },
  cyberpunk: { id: 'cyberpunk', name: 'Cyberpunk', classes: SCIFI_CLASSES, backgrounds: SCIFI_BACKGROUNDS, traits: SCIFI_TRAITS, currency: 'Creds', startingCurrency: 1000 },
  postapoc: { id: 'postapoc', name: 'Post-Apocalyptic', classes: HORROR_CLASSES, backgrounds: HORROR_BACKGROUNDS, traits: HORROR_TRAITS, currency: 'Caps', startingCurrency: 30 },
  custom: { id: 'custom', name: 'Custom', classes: FANTASY_CLASSES, backgrounds: FANTASY_BACKGROUNDS, traits: FANTASY_TRAITS, currency: 'Gold', startingCurrency: 15 },
};

// Detect genre from scenario text
export function detectGenreFromScenario(scenario: string): GameGenre {
  const lower = scenario.toLowerCase();
  
  if (lower.includes('space') || lower.includes('starship') || lower.includes('galaxy') || lower.includes('alien') || lower.includes('planet')) return 'scifi';
  if (lower.includes('horror') || lower.includes('abandoned') || lower.includes('nightmare') || lower.includes('monster') || lower.includes('haunted')) return 'horror';
  if (lower.includes('detective') || lower.includes('mystery') || lower.includes('investigate') || lower.includes('murder') || lower.includes('noir')) return 'mystery';
  if (lower.includes('pirate') || lower.includes('ship') || lower.includes('treasure') || lower.includes('seas') || lower.includes('captain')) return 'pirate';
  if (lower.includes('cyberpunk') || lower.includes('neon') || lower.includes('hacker') || lower.includes('corporation') || lower.includes('dystopia')) return 'cyberpunk';
  if (lower.includes('western') || lower.includes('cowboy') || lower.includes('frontier') || lower.includes('outlaw') || lower.includes('saloon')) return 'western';
  if (lower.includes('apocalypse') || lower.includes('wasteland') || lower.includes('survivor') || lower.includes('ruins') || lower.includes('fallout')) return 'postapoc';
  if (lower.includes('magic') || lower.includes('dragon') || lower.includes('wizard') || lower.includes('kingdom') || lower.includes('quest') || lower.includes('fantasy')) return 'fantasy';
  
  return 'fantasy'; // Default
}

// Create character with genre-specific data
export function createGenreCharacter(
  name: string,
  classId: string,
  backgroundId: string,
  traits: string[],
  statAllocation: Partial<CharacterStats>,
  genre: GameGenre
): RPGCharacter {
  const genreData = GENRE_DATA[genre];
  const characterClass = genreData.classes.find(c => c.id === classId)!;
  const background = genreData.backgrounds.find(b => b.id === backgroundId)!;

  const stats: CharacterStats = {
    strength: 8 + (statAllocation.strength || 0) + (characterClass.statBonuses.strength || 0) + (background.statBonuses.strength || 0),
    dexterity: 8 + (statAllocation.dexterity || 0) + (characterClass.statBonuses.dexterity || 0) + (background.statBonuses.dexterity || 0),
    constitution: 8 + (statAllocation.constitution || 0) + (characterClass.statBonuses.constitution || 0) + (background.statBonuses.constitution || 0),
    intelligence: 8 + (statAllocation.intelligence || 0) + (characterClass.statBonuses.intelligence || 0) + (background.statBonuses.intelligence || 0),
    wisdom: 8 + (statAllocation.wisdom || 0) + (characterClass.statBonuses.wisdom || 0) + (background.statBonuses.wisdom || 0),
    charisma: 8 + (statAllocation.charisma || 0) + (characterClass.statBonuses.charisma || 0) + (background.statBonuses.charisma || 0),
  };

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
    gold: genreData.startingCurrency,
  };
}
