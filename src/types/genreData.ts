// Genre-specific RPG Character Types and Data
import { CharacterClass, CharacterBackground, CharacterStats, InventoryItem, RPGCharacter, getStatModifier, calculateMaxHealth } from './rpgCharacter';

export type GameGenre = 'fantasy' | 'scifi' | 'horror' | 'mystery' | 'pirate' | 'western' | 'cyberpunk' | 'postapoc' | 'war' | 'custom';

// War Era type for era-specific roles
export type WarEra = 'past' | 'modern' | 'future';

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
  { id: 'warrior', name: 'Warrior', description: 'A master of combat, trained in weapons and armor.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Iron Sword', 'Leather Armor', 'Health Potion'], abilities: ['Power Strike', 'Shield Block'], portraitHints: ['armor', 'sword', 'muscular', 'battle-scarred', 'determined expression'], clothingStyle: 'medieval plate or chainmail armor with weapon' },
  { id: 'rogue', name: 'Rogue', description: 'A cunning operative skilled in stealth and subterfuge.', statBonuses: { dexterity: 2, charisma: 1 }, startingItems: ['Daggers', 'Lockpicks', 'Smoke Bomb'], abilities: ['Sneak Attack', 'Vanish'], portraitHints: ['hooded', 'shadowy', 'daggers', 'cunning eyes', 'leather armor'], clothingStyle: 'dark leather armor with hood and concealed weapons' },
  { id: 'mage', name: 'Mage', description: 'A wielder of arcane forces and forbidden knowledge.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Oak Staff', 'Spellbook', 'Mana Potion'], abilities: ['Arcane Bolt', 'Magic Shield'], portraitHints: ['robes', 'staff', 'mystical aura', 'arcane symbols', 'glowing eyes'], clothingStyle: 'flowing wizard robes with arcane symbols and staff' },
  { id: 'cleric', name: 'Cleric', description: 'A divine servant blessed with healing powers.', statBonuses: { wisdom: 2, constitution: 1 }, startingItems: ['Holy Mace', 'Prayer Beads', 'Healing Salve'], abilities: ['Heal Wounds', 'Divine Protection'], portraitHints: ['holy symbol', 'robes', 'serene expression', 'divine light', 'sacred vestments'], clothingStyle: 'religious robes with holy symbols and mace' },
  { id: 'ranger', name: 'Ranger', description: 'A wilderness expert and deadly archer.', statBonuses: { dexterity: 1, wisdom: 1, constitution: 1 }, startingItems: ['Longbow', 'Arrows', 'Hunting Knife'], abilities: ['Precise Shot', 'Animal Companion'], portraitHints: ['bow', 'forest background', 'leather armor', 'keen eyes', 'wilderness gear'], clothingStyle: 'practical green and brown leather with bow and quiver' },
  { id: 'bard', name: 'Bard', description: 'A charismatic performer who weaves magic through music.', statBonuses: { charisma: 2, dexterity: 1 }, startingItems: ['Lute', 'Rapier', 'Fine Clothes'], abilities: ['Inspiring Song', 'Charm Person'], portraitHints: ['instrument', 'colorful clothes', 'charming smile', 'performer', 'tavern'], clothingStyle: 'flamboyant colorful performer attire with musical instrument' },
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
  { id: 'marine', name: 'Space Marine', description: 'Elite soldier trained in zero-G combat and advanced weaponry.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Plasma Rifle', 'Combat Armor', 'Medkit'], abilities: ['Suppressing Fire', 'Combat Roll'], portraitHints: ['power armor', 'futuristic helmet', 'heavy weapon', 'battle-hardened', 'military insignia'], clothingStyle: 'heavy futuristic combat armor with integrated helmet' },
  { id: 'hacker', name: 'Netrunner', description: 'Master of networks, systems, and digital warfare.', statBonuses: { intelligence: 2, dexterity: 1 }, startingItems: ['Neural Interface', 'Hacking Deck', 'EMP Grenade'], abilities: ['System Override', 'Data Mine'], portraitHints: ['cybernetic implants', 'neural interface', 'holographic displays', 'tech-enhanced eyes', 'data cables'], clothingStyle: 'tech-enhanced urban wear with visible neural interface' },
  { id: 'pilot', name: 'Ace Pilot', description: 'Expert starship operator with unmatched reflexes.', statBonuses: { dexterity: 2, wisdom: 1 }, startingItems: ['Flight Suit', 'Laser Pistol', 'Navigation Module'], abilities: ['Evasive Maneuvers', 'Quick Draw'], portraitHints: ['flight suit', 'pilot helmet', 'confident stance', 'spacecraft cockpit', 'aviation patches'], clothingStyle: 'sleek flight suit with pilot insignia' },
  { id: 'medic', name: 'Combat Medic', description: 'Combat physician with advanced healing technology.', statBonuses: { wisdom: 2, intelligence: 1 }, startingItems: ['Medical Scanner', 'Nano-Injector', 'Stim Packs'], abilities: ['Emergency Heal', 'Stabilize'], portraitHints: ['medical equipment', 'healing tech', 'white and red uniform', 'scanner', 'compassionate'], clothingStyle: 'medical uniform with advanced healing equipment' },
  { id: 'engineer', name: 'Tech Specialist', description: 'Technology expert who builds and repairs anything.', statBonuses: { intelligence: 1, dexterity: 1, constitution: 1 }, startingItems: ['Multi-Tool', 'Repair Drone', 'Spare Parts'], abilities: ['Quick Fix', 'Deploy Turret'], portraitHints: ['tool belt', 'goggles', 'mechanical augments', 'workshop background', 'grease stains'], clothingStyle: 'practical work suit with many tools and pouches' },
  { id: 'diplomat', name: 'Ambassador', description: 'Negotiator and face of any operation.', statBonuses: { charisma: 2, wisdom: 1 }, startingItems: ['Translator Device', 'Encrypted Comm', 'Fine Attire'], abilities: ['Silver Tongue', 'Read Intentions'], portraitHints: ['elegant attire', 'diplomatic insignia', 'refined appearance', 'translator device', 'commanding presence'], clothingStyle: 'elegant formal futuristic attire with diplomatic insignia' },
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
  { id: 'investigator', name: 'Paranormal Investigator', description: 'Trained to uncover dark secrets and hidden truths.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Flashlight', 'Notebook', 'Camera'], abilities: ['Keen Eye', 'Research'], portraitHints: ['flashlight', 'concerned expression', 'notebook', 'dark environment', 'observant eyes'], clothingStyle: 'practical investigator clothing with flashlight and camera' },
  { id: 'survivor', name: 'Hardened Survivor', description: 'Hardened by trauma, refuses to die.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['First Aid Kit', 'Pocket Knife', 'Matches'], abilities: ['Adrenaline Rush', 'Play Dead'], portraitHints: ['worn clothes', 'scars', 'determined expression', 'survival gear', 'haunted eyes'], clothingStyle: 'torn and weathered practical clothing with survival gear' },
  { id: 'occultist', name: 'Occult Scholar', description: 'Dabbles in forbidden knowledge and dark arts.', statBonuses: { intelligence: 1, wisdom: 2 }, startingItems: ['Grimoire', 'Candles', 'Salt'], abilities: ['Ritual Ward', 'Sense Supernatural'], portraitHints: ['occult symbols', 'ancient book', 'mysterious aura', 'candles', 'dark robes'], clothingStyle: 'dark scholarly robes with occult accessories' },
  { id: 'protector', name: 'Guardian', description: 'Sworn to defend others from the darkness.', statBonuses: { strength: 2, wisdom: 1 }, startingItems: ['Crowbar', 'Protective Charm', 'Bandages'], abilities: ['Stand Guard', 'Inspiring Presence'], portraitHints: ['protective stance', 'improvised weapon', 'alert expression', 'protective gear', 'determined'], clothingStyle: 'practical protective clothing with makeshift armor' },
  { id: 'medic', name: 'Field Medic', description: 'Keeps people alive when help is not coming.', statBonuses: { wisdom: 2, dexterity: 1 }, startingItems: ['Medical Bag', 'Painkillers', 'Suture Kit'], abilities: ['Emergency Treatment', 'Calm Nerves'], portraitHints: ['medical bag', 'blood stains', 'focused expression', 'medical equipment', 'compassionate'], clothingStyle: 'medical scrubs or practical clothing with medical bag' },
  { id: 'scavenger', name: 'Resourceful Scavenger', description: 'Finds useful things where others see junk.', statBonuses: { dexterity: 2, intelligence: 1 }, startingItems: ['Backpack', 'Multitool', 'Rope'], abilities: ['Scrounger', 'Improvise Weapon'], portraitHints: ['backpack full of gear', 'tool belt', 'resourceful look', 'urban explorer', 'practical'], clothingStyle: 'layered practical clothing with many pockets and tools' },
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
  { id: 'detective', name: 'Private Eye', description: 'Seasoned investigator who always finds the truth.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Magnifying Glass', 'Notebook', 'Revolver'], abilities: ['Deduce', 'Interrogate'], portraitHints: ['trench coat', 'fedora', 'magnifying glass', 'noir lighting', 'sharp eyes'], clothingStyle: 'classic noir detective trench coat and fedora' },
  { id: 'journalist', name: 'Investigative Reporter', description: 'Chases stories others are afraid to tell.', statBonuses: { charisma: 2, intelligence: 1 }, startingItems: ['Press Badge', 'Camera', 'Recorder'], abilities: ['Expose', 'Connect Dots'], portraitHints: ['press badge', 'camera', 'notepad', 'determined look', 'city backdrop'], clothingStyle: 'professional journalist attire with press badge' },
  { id: 'enforcer', name: 'Street Enforcer', description: 'Muscle who knows when to apply pressure.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Brass Knuckles', 'Leather Jacket', 'Flask'], abilities: ['Intimidate', 'Tough It Out'], portraitHints: ['leather jacket', 'muscular build', 'intimidating stance', 'brass knuckles', 'tough'], clothingStyle: 'tough leather jacket and working-class tough guy attire' },
  { id: 'grifter', name: 'Con Artist', description: 'Silver tongue and quick hands make you dangerous.', statBonuses: { charisma: 2, dexterity: 1 }, startingItems: ['Fake IDs', 'Lockpick', 'Hidden Cash'], abilities: ['Fast Talk', 'Misdirection'], portraitHints: ['charming smile', 'expensive clothes', 'deceptive eyes', 'playing cards', 'smooth'], clothingStyle: 'well-tailored suit or dress with hidden pockets' },
  { id: 'fixer', name: 'Information Broker', description: 'Knows everyone and can get anything for a price.', statBonuses: { charisma: 1, intelligence: 1, wisdom: 1 }, startingItems: ['Contact Book', 'Burner Phone', 'Favors Owed'], abilities: ['Call In Favor', 'Street Knowledge'], portraitHints: ['shadowy figure', 'phone', 'knowing look', 'bar background', 'connected'], clothingStyle: 'understated but quality clothing that helps blend in' },
  { id: 'veteran', name: 'War Veteran', description: 'War taught you skills the world forgot.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['Service Pistol', 'Dog Tags', 'Lighter'], abilities: ['Combat Instinct', 'Stay Frosty'], portraitHints: ['dog tags', 'military bearing', 'thousand-yard stare', 'old wounds', 'disciplined'], clothingStyle: 'practical military-influenced civilian clothing' },
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
  { id: 'captain', name: 'Ship Captain', description: 'Born leader who commands respect and loyalty.', statBonuses: { charisma: 2, wisdom: 1 }, startingItems: ['Captain\'s Hat', 'Cutlass', 'Spyglass'], abilities: ['Rally Crew', 'Command'], portraitHints: ['captain hat', 'commanding presence', 'cutlass', 'ship deck', 'sea backdrop'], clothingStyle: 'ornate captain coat with tricorn hat and cutlass' },
  { id: 'swashbuckler', name: 'Dashing Swashbuckler', description: 'Dashing swordsman with unmatched agility.', statBonuses: { dexterity: 2, charisma: 1 }, startingItems: ['Rapier', 'Pistol', 'Rope'], abilities: ['Riposte', 'Acrobatics'], portraitHints: ['rapier', 'dashing smile', 'acrobatic pose', 'loose shirt', 'adventurous'], clothingStyle: 'loose billowing shirt and practical sailor pants with rapier' },
  { id: 'gunner', name: 'Master Gunner', description: 'Master of cannons and firearms.', statBonuses: { dexterity: 1, intelligence: 1, strength: 1 }, startingItems: ['Flintlock Pistols', 'Powder Horn', 'Cannon Fuse'], abilities: ['Dead Eye', 'Quick Reload'], portraitHints: ['multiple pistols', 'powder burns', 'focused aim', 'cannon background', 'intense'], clothingStyle: 'practical gunner attire with bandolier of pistols' },
  { id: 'navigator', name: 'Star Navigator', description: 'Reads the stars and charts unknown waters.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Compass', 'Sea Charts', 'Sextant'], abilities: ['Plot Course', 'Weather Sense'], portraitHints: ['sextant', 'sea charts', 'weathered face', 'stars', 'wise eyes'], clothingStyle: 'practical navigator clothing with many instruments' },
  { id: 'surgeon', name: 'Ship\'s Sawbones', description: 'Keeps the crew alive with limited resources.', statBonuses: { wisdom: 2, intelligence: 1 }, startingItems: ['Surgical Kit', 'Rum', 'Bandages'], abilities: ['Field Surgery', 'Diagnose'], portraitHints: ['surgical tools', 'blood-stained apron', 'tired but capable', 'medical equipment', 'stern'], clothingStyle: 'practical medical attire with leather apron' },
  { id: 'boatswain', name: 'Veteran Boatswain', description: 'Tough sailor who keeps the ship running.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Marlinspike', 'Rope', 'Whistle'], abilities: ['Ship Repair', 'Intimidate'], portraitHints: ['rope callused hands', 'whistle', 'muscular', 'deck background', 'commanding'], clothingStyle: 'tough working sailor attire with rope and tools' },
];

const PIRATE_BACKGROUNDS: CharacterBackground[] = [
  { id: 'navy', name: 'Navy Deserter', description: 'Turned your back on the Crown\'s fleet.', statBonuses: { strength: 1 }, startingItems: ['Naval Uniform', 'Cutlass'], skills: ['Sailing', 'Navigation', 'Discipline'] },
  { id: 'merchant', name: 'Merchant Sailor', description: 'Traded goods before trading lead.', statBonuses: { charisma: 1 }, startingItems: ['Trade Ledger', 'Contacts'], skills: ['Bargaining', 'Appraisal', 'Languages'] },
  { id: 'criminal', name: 'Wanted Criminal', description: 'The sea was your only escape.', statBonuses: { dexterity: 1 }, startingItems: ['Wanted Poster', 'Disguise Kit'], skills: ['Stealth', 'Deception', 'Escape'] },
  { id: 'islander', name: 'Island Native', description: 'Born to the sea and its secrets.', statBonuses: { wisdom: 1 }, startingItems: ['Tribal Charm', 'Fishing Net'], skills: ['Swimming', 'Survival', 'Weather'] },
  { id: 'noble', name: 'Disgraced Noble', description: 'Lost your title, seeking fortune at sea.', statBonuses: { charisma: 1 }, startingItems: ['Family Crest', 'Fine Dagger'], skills: ['Etiquette', 'Fencing', 'History'] },
  { id: 'slave', name: 'Freed Slave', description: 'Won your freedom through blood and cunning.', statBonuses: { constitution: 1 }, startingItems: ['Broken Chain', 'Hidden Blade'], skills: ['Endurance', 'Stealth', 'Determination'] },
];

// WESTERN Classes & Backgrounds - DEEPLY IMMERSIVE
const WESTERN_CLASSES: CharacterClass[] = [
  { id: 'gunslinger', name: 'Gunslinger', description: 'Fastest draw in the West. Your reputation precedes you.', statBonuses: { dexterity: 2, wisdom: 1 }, startingItems: ['Colt Peacemaker', 'Leather Holster', 'Box of Bullets'], abilities: ['Quick Draw', 'Fan the Hammer', 'Dead Eye'], portraitHints: ['low-slung holster', 'cold eyes', 'dusty clothes', 'revolver', 'dangerous'], clothingStyle: 'dusty trail clothes with low-slung gun belt' },
  { id: 'sheriff', name: 'Frontier Lawman', description: 'Star pinned to your chest, justice in your heart.', statBonuses: { charisma: 2, constitution: 1 }, startingItems: ['Sheriff Badge', 'Double-Barrel Shotgun', 'Iron Shackles'], abilities: ['Arrest', 'Rally Posse', 'Read Intentions'], portraitHints: ['sheriff badge', 'shotgun', 'stern expression', 'dusty town', 'authority'], clothingStyle: 'lawman attire with prominent badge and shotgun' },
  { id: 'outlaw', name: 'Desperado', description: 'Wanted dead or alive. You ride with the devil.', statBonuses: { dexterity: 2, charisma: 1 }, startingItems: ['Bandana Mask', 'Winchester Rifle', 'Bundle of Dynamite'], abilities: ['Ambush', 'Escape Artist', 'Intimidate'], portraitHints: ['bandana', 'rifle', 'dangerous eyes', 'wanted poster', 'outlaw'], clothingStyle: 'outlaw clothing with bandana and rifle' },
  { id: 'bounty_hunter', name: 'Bounty Hunter', description: 'You track men for blood money across the territories.', statBonuses: { wisdom: 2, dexterity: 1 }, startingItems: ['Wanted Posters', 'Lasso', 'Hunting Rifle'], abilities: ['Track Prey', 'Dead or Alive', 'Interrogate'], portraitHints: ['lasso', 'wanted posters', 'weathered tracker', 'keen eyes', 'dusty'], clothingStyle: 'practical hunter attire with lasso and rifle' },
  { id: 'gambler', name: 'Riverboat Gambler', description: 'You play cards, cheat at cards, and occasionally kill at cards.', statBonuses: { charisma: 2, intelligence: 1 }, startingItems: ['Marked Deck', 'Sleeve Derringer', 'Fancy Vest'], abilities: ['Cheat', 'Read Tell', 'Silver Tongue'], portraitHints: ['fancy vest', 'playing cards', 'smooth smile', 'hidden weapon', 'charming'], clothingStyle: 'elegant gambling attire with fancy vest and hidden derringer' },
  { id: 'frontier_doctor', name: 'Frontier Sawbones', description: 'Part physician, part butcher. You save lives in a land of death.', statBonuses: { wisdom: 2, intelligence: 1 }, startingItems: ['Leather Medical Bag', 'Bone Saw', 'Laudanum Bottle'], abilities: ['Field Amputation', 'Steady Hands', 'Diagnose'], portraitHints: ['medical bag', 'blood-stained apron', 'spectacles', 'tired eyes', 'capable'], clothingStyle: 'practical medical attire with leather bag and apron' },
  { id: 'snake_oil', name: 'Traveling Charlatan', description: 'Cure-alls, tonics, and lies. You sell hope in a bottle.', statBonuses: { charisma: 3 }, startingItems: ['Medicine Wagon', 'Miracle Elixirs', 'Top Hat'], abilities: ['Fast Talk', 'Distraction', 'Placebo Effect'], portraitHints: ['top hat', 'colorful bottles', 'showman', 'wagon', 'theatrical'], clothingStyle: 'theatrical showman attire with top hat and colorful bottles' },
  { id: 'cavalry', name: 'Cavalry Scout', description: 'Blue coat and saber. You ride ahead into danger.', statBonuses: { dexterity: 1, constitution: 1, wisdom: 1 }, startingItems: ['Cavalry Saber', 'Army Carbine', 'Bugle'], abilities: ['Mounted Combat', 'Signal', 'Endurance Ride'], portraitHints: ['cavalry uniform', 'saber', 'horse', 'bugle', 'military bearing'], clothingStyle: 'US cavalry uniform with saber and carbine' },
  { id: 'mountain_man', name: 'Grizzled Trapper', description: 'You live where others fear to tread. The wilderness is home.', statBonuses: { constitution: 2, wisdom: 1 }, startingItems: ['Bowie Knife', 'Bear Trap', 'Fur Pelts'], abilities: ['Wilderness Survival', 'Track Animal', 'Skin Game'], portraitHints: ['fur coat', 'bowie knife', 'beard', 'wilderness', 'rugged'], clothingStyle: 'heavy fur clothing with bowie knife and trapping gear' },
  { id: 'dancehall', name: 'Saloon Entertainer', description: 'Pretty face, sharp mind. You know everyones secrets.', statBonuses: { charisma: 2, dexterity: 1 }, startingItems: ['Corset Dress', 'Hidden Blade', 'Perfume'], abilities: ['Distract', 'Gather Information', 'Poison Drink'], portraitHints: ['elegant dress', 'feathers', 'alluring', 'saloon', 'sharp eyes'], clothingStyle: 'colorful saloon dress with feathers and hidden weapons' },
];

const WESTERN_BACKGROUNDS: CharacterBackground[] = [
  { id: 'rancher', name: 'Ranch Hand', description: 'Dust, cattle, and honest work under the burning sun.', statBonuses: { constitution: 1 }, startingItems: ['Leather Chaps', 'Branding Iron'], skills: ['Animal Handling', 'Riding', 'Roping'] },
  { id: 'prospector', name: 'Gold Prospector', description: 'Spent years panning streams and digging claims.', statBonuses: { wisdom: 1 }, startingItems: ['Pickaxe', 'Gold Pan', 'Mule'], skills: ['Mining', 'Survival', 'Appraisal'] },
  { id: 'native', name: 'Native Scout', description: 'These are your ancestors lands. You know every canyon.', statBonuses: { wisdom: 1 }, startingItems: ['Bow and Arrows', 'Medicine Bundle'], skills: ['Tracking', 'Nature Lore', 'Silent Movement'] },
  { id: 'saloon_worker', name: 'Saloon Keeper', description: 'Poured whiskey, broke up fights, heard every secret.', statBonuses: { charisma: 1 }, startingItems: ['Sawed-off Shotgun', 'Whiskey Bottle'], skills: ['Gossip', 'Bartending', 'Brawling'] },
  { id: 'confederate', name: 'Confederate Veteran', description: 'You wore the grey. The war still haunts you.', statBonuses: { strength: 1 }, startingItems: ['Rebel Kepi', 'Cavalry Sword'], skills: ['Tactics', 'Horsemanship', 'Bitterness'] },
  { id: 'union', name: 'Union Veteran', description: 'You wore the blue and saw too much death.', statBonuses: { constitution: 1 }, startingItems: ['Army Issue Revolver', 'Campaign Medal'], skills: ['Discipline', 'Firearms', 'March'] },
  { id: 'preacher', name: 'Fire-and-Brimstone Preacher', description: 'Gods word in one hand, sometimes a gun in the other.', statBonuses: { charisma: 1 }, startingItems: ['Well-worn Bible', 'Wooden Cross'], skills: ['Oratory', 'Faith', 'Redemption'] },
  { id: 'chinese_railroad', name: 'Railroad Worker', description: 'Built the iron road with blood and sweat.', statBonuses: { strength: 1 }, startingItems: ['Sledgehammer', 'Rice Hat'], skills: ['Endurance', 'Demolition', 'Languages'] },
  { id: 'undertaker', name: 'Undertaker', description: 'Business is always good in these parts.', statBonuses: { intelligence: 1 }, startingItems: ['Measuring Tape', 'Coffin Nails'], skills: ['Composure', 'Carpentry', 'Death Lore'] },
  { id: 'showgirl', name: 'Traveling Performer', description: 'Sang and danced across every dusty town.', statBonuses: { charisma: 1 }, startingItems: ['Stage Costume', 'Sheet Music'], skills: ['Performance', 'Acrobatics', 'Seduction'] },
];

// CYBERPUNK Classes & Backgrounds - DEEPLY IMMERSIVE
const CYBERPUNK_CLASSES: CharacterClass[] = [
  { id: 'netrunner', name: 'Netrunner', description: 'Jack in, burn ICE, steal data. The Net is your domain.', statBonuses: { intelligence: 2, dexterity: 1 }, startingItems: ['Military-Grade Cyberdeck', 'Neural Interface', 'Black ICE Breakers'], abilities: ['Deep Dive', 'Ghost Protocol', 'Data Spike'], portraitHints: ['neural interface', 'holographic displays', 'tech-enhanced eyes', 'data cables', 'hacker'], clothingStyle: 'tech-enhanced streetwear with visible neural interface and data cables' },
  { id: 'solo', name: 'Solo Mercenary', description: 'Chrome-enhanced killing machine. You are the bullet.', statBonuses: { dexterity: 2, constitution: 1 }, startingItems: ['Militech Smart Gun', 'Subdermal Armor', 'Combat Stims'], abilities: ['Combat Sense', 'Bullet Time', 'Kerenzikov Boost'], portraitHints: ['cybernetic arms', 'combat armor', 'weapons', 'battle scars', 'deadly'], clothingStyle: 'tactical combat gear with visible cybernetic enhancements' },
  { id: 'fixer', name: 'Underworld Fixer', description: 'Deals, connections, information. Everyone needs you.', statBonuses: { charisma: 2, intelligence: 1 }, startingItems: ['Contact Database', 'Encrypted Comm', 'Credchip Stash'], abilities: ['Make a Deal', 'Street Cred', 'Find Anything'], portraitHints: ['expensive suit', 'augmented eyes', 'neon lighting', 'confident', 'connected'], clothingStyle: 'sleek dark urban wear with subtle cybernetic enhancements' },
  { id: 'techie', name: 'Chrome Doctor', description: 'If it has circuits, you own it. Cybertech supreme.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Cybertech Toolkit', 'Implant Fabricator', 'Stolen Schematics'], abilities: ['Jury Rig', 'Install Chrome', 'EMP Surge'], portraitHints: ['tool harness', 'cyber goggles', 'mechanical arms', 'workshop', 'genius'], clothingStyle: 'practical tech wear with many tools and cyber-enhanced work gear' },
  { id: 'media', name: 'Rogue Journalist', description: 'Truth is the deadliest weapon. You point it at corps.', statBonuses: { charisma: 2, wisdom: 1 }, startingItems: ['Broadcast Rig', 'Hidden Camera', 'Press Badge'], abilities: ['Expose Truth', 'Go Viral', 'Source Network'], portraitHints: ['camera drone', 'press badge', 'determined expression', 'broadcast equipment', 'truth-seeker'], clothingStyle: 'journalist attire with concealed recording equipment' },
  { id: 'nomad', name: 'Wasteland Nomad', description: 'Family, road, freedom. The highway is your kingdom.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['Modified Combat Truck', 'Survival Gear', 'Clan Radio'], abilities: ['Road Warrior', 'Pack Tactics', 'Wasteland Drive'], portraitHints: ['desert goggles', 'vehicle parts', 'tribal markings', 'weathered', 'family bonds'], clothingStyle: 'rugged nomad attire with vehicle parts and tribal markings' },
  { id: 'rockerboy', name: 'Rockerboy', description: 'Your music incites riots. Your words inspire revolution.', statBonuses: { charisma: 3 }, startingItems: ['Modded Guitar', 'Stage Implants', 'Devoted Fans'], abilities: ['Inspire Crowd', 'Anthem of Rage', 'Face of the Movement'], portraitHints: ['stage presence', 'electric guitar', 'neon makeup', 'rebellious', 'charismatic'], clothingStyle: 'flashy rocker attire with stage implants and instrument' },
  { id: 'exec', name: 'Corporate Shark', description: 'Suit, smile, sociopath. You play the deadliest game.', statBonuses: { charisma: 2, intelligence: 1 }, startingItems: ['Corporate Clearance', 'Bodyguard Contact', 'Expense Account'], abilities: ['Corporate Resources', 'Hostile Takeover', 'Blackmail'], portraitHints: ['expensive suit', 'cold smile', 'corporate tower', 'power', 'calculating'], clothingStyle: 'expensive tailored corporate suit with subtle enhancements' },
  { id: 'trauma_team', name: 'Combat Paramedic', description: 'Armored ambulance, automatic weapons, and medical degrees.', statBonuses: { wisdom: 2, constitution: 1 }, startingItems: ['Combat Medkit', 'Trauma Armor', 'Quick-Clone Spray'], abilities: ['Combat Triage', 'Revive', 'Defensive Extraction'], portraitHints: ['trauma armor', 'medical equipment', 'helicopter', 'professional', 'life-saver'], clothingStyle: 'armored medical uniform with heavy protective gear' },
  { id: 'boostergang', name: 'Chrome Ganger', description: 'Chrome-junkie street warrior. More metal than meat.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Wolvers Implant', 'Gang Leathers', 'Combat Drugs'], abilities: ['Cyberpsycho Rage', 'Chrome Rush', 'Intimidate'], portraitHints: ['extensive cybernetics', 'gang colors', 'aggressive', 'chrome limbs', 'dangerous'], clothingStyle: 'gang leathers exposing extensive chrome cybernetics' },
];

const CYBERPUNK_BACKGROUNDS: CharacterBackground[] = [
  { id: 'corpo', name: 'Ex-Corporate', description: 'You wore the suit. You know how the machine devours.', statBonuses: { intelligence: 1 }, startingItems: ['Corporate Secrets', 'Encrypted Data'], skills: ['Business', 'Etiquette', 'Backstabbing'] },
  { id: 'street_kid', name: 'Street Kid', description: 'Neon-lit alleys were your playground. Survival your first lesson.', statBonuses: { dexterity: 1 }, startingItems: ['Gang Colors', 'Mono-Knife'], skills: ['Streetwise', 'Pickpocket', 'Running'] },
  { id: 'gang_member', name: 'Gang Soldier', description: 'Bled for your crew. They are the only family that matters.', statBonuses: { strength: 1 }, startingItems: ['Gang Tattoos', 'Spiked Chain'], skills: ['Intimidation', 'Loyalty', 'Territory'] },
  { id: 'lab_rat', name: 'Arasaka Experiment', description: 'They put things in you. Took things out. You escaped.', statBonuses: { constitution: 1 }, startingItems: ['Experimental Implant', 'Trauma Scars'], skills: ['Pain Tolerance', 'Biotech Knowledge', 'Paranoia'] },
  { id: 'refugee', name: 'Combat Zone Survivor', description: 'No law. No mercy. You learned to kill before reading.', statBonuses: { wisdom: 1 }, startingItems: ['Jury-Rigged Weapon', 'Survival Rations'], skills: ['Scavenging', 'Stealth', 'Urban Survival'] },
  { id: 'rich_kid', name: 'Fallen Corpo Brat', description: 'Daddy lost the corp war. Now you fight for scraps.', statBonuses: { charisma: 1 }, startingItems: ['Designer Threads', 'Fake SIN'], skills: ['Etiquette', 'Deception', 'Former Connections'] },
  { id: 'military', name: 'Ex-Military', description: 'Corp wars, proxy conflicts, black ops. You have seen it all.', statBonuses: { constitution: 1 }, startingItems: ['Military Cybernetics', 'Service Weapon'], skills: ['Tactics', 'Weapons', 'Discipline'] },
  { id: 'joytoy', name: 'Former Joytoy', description: 'You sold pleasure. Now you sell something else.', statBonuses: { charisma: 1 }, startingItems: ['Seductive Implants', 'Client List'], skills: ['Seduction', 'Reading People', 'Secrets'] },
  { id: 'cyberpsycho', name: 'Recovering Cyberpsycho', description: 'Too much chrome broke your mind. Therapy helps. Sometimes.', statBonuses: { strength: 1 }, startingItems: ['Therapy Meds', 'Chrome Limiters'], skills: ['Controlled Rage', 'Chrome Tolerance', 'Violence'] },
  { id: 'clone', name: 'Illegal Clone', description: 'You are a copy. But whose original? Does it matter?', statBonuses: { intelligence: 1 }, startingItems: ['Identity Crisis', 'Genetic Sample'], skills: ['Identity Fraud', 'Existential Crisis', 'Fast Learning'] },
];

// POST-APOCALYPTIC Classes & Backgrounds - DEEPLY IMMERSIVE
const POSTAPOC_CLASSES: CharacterClass[] = [
  { id: 'wastelander', name: 'Wasteland Survivor', description: 'Born in ash and radiation. The wasteland is mother and father.', statBonuses: { constitution: 2, wisdom: 1 }, startingItems: ['Scrap Armor', 'Purified Water', 'Rad-Treated Knife'], abilities: ['Wasteland Wisdom', 'Rad Resistance', 'Find Water'], portraitHints: ['scrap armor', 'weathered face', 'wasteland', 'survival gear', 'hardened'], clothingStyle: 'patched together scrap armor and survival gear' },
  { id: 'raider', name: 'War Raider', description: 'Chrome and blood! Witness me! You live, you die, you live again.', statBonuses: { strength: 2, dexterity: 1 }, startingItems: ['Spiked War Club', 'Chrome Paint', 'Raider Leathers'], abilities: ['Berserker Rage', 'Intimidate', 'Kamikaze Charge'], portraitHints: ['war paint', 'spikes', 'mohawk', 'intimidating', 'savage'], clothingStyle: 'savage raider gear with spikes and war paint' },
  { id: 'mechanic', name: 'Salvage Tech', description: 'Engines are sacred. You keep the old world machines alive.', statBonuses: { intelligence: 2, dexterity: 1 }, startingItems: ['Welding Torch', 'Salvaged Parts', 'Tool Belt'], abilities: ['Vehicle Repair', 'Scrap Genius', 'Hotwire'], portraitHints: ['tool belt', 'goggles', 'grease stains', 'machinery', 'inventive'], clothingStyle: 'practical work clothes with tool belt and welding gear' },
  { id: 'mutant', name: 'Rad-Touched', description: 'The Glow changed you. Made you more. Or less. But stronger.', statBonuses: { constitution: 2, strength: 1 }, startingItems: ['Mutation Salve', 'Lead-Lined Cloak'], abilities: ['Mutation Power', 'Rad Immunity', 'Unsettling Presence'], portraitHints: ['visible mutations', 'glowing veins', 'unusual features', 'otherworldly', 'powerful'], clothingStyle: 'concealing clothing that shows mutation features' },
  { id: 'trader', name: 'Caravan Master', description: 'Move goods, make deals, survive the roads. Commerce never dies.', statBonuses: { charisma: 2, wisdom: 1 }, startingItems: ['Trade Manifest', 'Pack Brahmin', 'Hidden Pistol'], abilities: ['Barter', 'Safe Passage', 'Read Market'], portraitHints: ['trade goods', 'weathered traveler', 'pack animal', 'shrewd eyes', 'merchant'], clothingStyle: 'practical trader clothing with many pockets' },
  { id: 'vault_dweller', name: 'Vault Dweller', description: 'Fresh from the bunker. The surface is strange and terrifying.', statBonuses: { intelligence: 2, charisma: 1 }, startingItems: ['Vault Jumpsuit', 'Pip-Boy Device', 'Clean Med Kit'], abilities: ['Pre-War Knowledge', 'Tech Savvy', 'Culture Shock'], portraitHints: ['vault jumpsuit', 'pip-boy', 'clean appearance', 'naive expression', 'bunker survivor'], clothingStyle: 'clean vault jumpsuit with pip-boy device' },
  { id: 'road_warrior', name: 'Road Warrior', description: 'Fuel, speed, and violence. The highway is your battleground.', statBonuses: { dexterity: 2, constitution: 1 }, startingItems: ['Modified Muscle Car', 'Shotgun', 'Spare Guzzoline'], abilities: ['Combat Driving', 'Vehicle Ramming', 'Wasteland Navigation'], portraitHints: ['driving goggles', 'leather jacket', 'road dust', 'vehicle parts', 'speed demon'], clothingStyle: 'road leather with driving goggles and vehicle parts' },
  { id: 'cult_priest', name: 'Atom Priest', description: 'Radiation is divine. The Glow is salvation. You preach the end.', statBonuses: { charisma: 2, constitution: 1 }, startingItems: ['Radioactive Relic', 'Holy Texts', 'Glowing Water'], abilities: ['Rad Blessing', 'Fanatical Followers', 'Immune to Fear'], portraitHints: ['glowing robes', 'radiation symbols', 'fanatical expression', 'radioactive', 'cult leader'], clothingStyle: 'glowing cult robes with radiation symbols' },
  { id: 'ghoul_hunter', name: 'Mutant Hunter', description: 'You track and exterminate what radiation creates.', statBonuses: { wisdom: 2, dexterity: 1 }, startingItems: ['Ghoul Trophy', 'Tracking Gear', 'Fire Axe'], abilities: ['Track Mutant', 'Know Weakness', 'Mercy Kill'], portraitHints: ['trophy collection', 'hunter gear', 'fire axe', 'grim determination', 'wasteland tracker'], clothingStyle: 'hunter gear with mutant trophies and tracking equipment' },
  { id: 'scribe', name: 'Knowledge Keeper', description: 'Preserve technology. Hoard knowledge. Humanity must not forget.', statBonuses: { intelligence: 2, wisdom: 1 }, startingItems: ['Technical Manuals', 'Salvaged Laptop', 'Brotherhood Robes'], abilities: ['Analyze Tech', 'Historical Knowledge', 'Repair Ancient Tech'], portraitHints: ['robes', 'old books', 'tech devices', 'scholarly', 'preserver'], clothingStyle: 'scholarly robes with technical equipment and books' },
];

const POSTAPOC_BACKGROUNDS: CharacterBackground[] = [
  { id: 'tribal', name: 'Tribal Warrior', description: 'Your people remember the old ways before the fire.', statBonuses: { wisdom: 1 }, startingItems: ['Tribal Tattoos', 'Bone Spear'], skills: ['Survival', 'Hunting', 'Oral History'] },
  { id: 'ghoul', name: 'Ghoul', description: 'Radiation preserved you grotesquely. Centuries old, decaying, wise.', statBonuses: { constitution: 1 }, startingItems: ['Pre-War Memories', 'RadAway Stash'], skills: ['History', 'Intimidation', 'Radiation Lore'] },
  { id: 'brotherhood', name: 'Brotherhood Exile', description: 'Cast out from the steel-clad hoarders of technology.', statBonuses: { intelligence: 1 }, startingItems: ['Power Armor Piece', 'Laser Pistol'], skills: ['Technology', 'Tactics', 'Discipline'] },
  { id: 'slave_escapee', name: 'Escaped Slave', description: 'Legion or slavers branded you. You broke free. Never again.', statBonuses: { dexterity: 1 }, startingItems: ['Broken Shackle', 'Hidden Shiv'], skills: ['Stealth', 'Endurance', 'Hatred'] },
  { id: 'caravan_guard', name: 'Caravan Guard', description: 'Protected traders across the dead lands. Seen every horror.', statBonuses: { strength: 1 }, startingItems: ['Combat Shotgun', 'Caravan Brand'], skills: ['Combat', 'Awareness', 'Escort Tactics'] },
  { id: 'scientist', name: 'Pre-War Cryosleep', description: 'You went to sleep before the bombs. Woke to hell.', statBonuses: { intelligence: 1 }, startingItems: ['Cryopod Jumpsuit', 'Pre-War Tech'], skills: ['Science', 'Medicine', 'Old World Knowledge'] },
  { id: 'settlement_born', name: 'Settlement Born', description: 'Raised in a struggling community. Walls mean safety.', statBonuses: { charisma: 1 }, startingItems: ['Community Token', 'Farming Tools'], skills: ['Agriculture', 'Community', 'Defense'] },
  { id: 'child_of_war', name: 'Child of the Pits', description: 'Raised in raider camps, fighting for survival since birth.', statBonuses: { strength: 1 }, startingItems: ['Fighting Scars', 'Makeshift Weapon'], skills: ['Brutality', 'Survival', 'Combat'] },
  { id: 'enclave', name: 'Enclave Deserter', description: 'You abandoned the remnants of government. They hunt you.', statBonuses: { intelligence: 1 }, startingItems: ['Enclave ID', 'Advanced Weapon'], skills: ['Technology', 'Government', 'Hunted'] },
  { id: 'water_merchant', name: 'Water Merchant', description: 'Liquid gold. You controlled the most precious resource.', statBonuses: { charisma: 1 }, startingItems: ['Water Purifier', 'Trade Connections'], skills: ['Bargaining', 'Water Lore', 'Greed'] },
];

// WAR Classes - Era-Specific (Past: Ancient to WWI, Modern: WWII to Present, Future: Sci-Fi warfare)
const WAR_CLASSES_PAST: CharacterClass[] = [
  { id: 'legionary', name: 'Roman Legionary', description: 'Disciplined soldier of the greatest empire. Shield wall and gladius.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Gladius', 'Scutum Shield', 'Pilum Javelin'], abilities: ['Shield Wall', 'Testudo Formation', 'Roman Discipline'], portraitHints: ['roman armor', 'red plume helmet', 'gladius', 'shield', 'disciplined'], clothingStyle: 'lorica segmentata armor with centurion helmet' },
  { id: 'knight', name: 'Medieval Knight', description: 'Armored warrior sworn to lord and code of chivalry.', statBonuses: { strength: 2, charisma: 1 }, startingItems: ['Longsword', 'Plate Armor', 'Warhorse'], abilities: ['Cavalry Charge', 'Challenge', 'Honorable Combat'], portraitHints: ['plate armor', 'sword', 'heraldry', 'noble bearing', 'knight'], clothingStyle: 'full plate armor with heraldic tabard' },
  { id: 'samurai', name: 'Samurai Warrior', description: 'Master of blade and bow, bound by bushido.', statBonuses: { dexterity: 2, wisdom: 1 }, startingItems: ['Katana', 'Wakizashi', 'Longbow'], abilities: ['Iaijutsu Strike', 'Meditation', 'Death Before Dishonor'], portraitHints: ['samurai armor', 'katana', 'topknot', 'stoic expression', 'bushido'], clothingStyle: 'traditional samurai armor with kabuto helmet' },
  { id: 'viking', name: 'Viking Raider', description: 'Norse warrior who fears nothing but a straw death.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Battle Axe', 'Round Shield', 'Seax Knife'], abilities: ['Berserker Rage', 'Shield Bash', 'Fearless'], portraitHints: ['viking helmet', 'battle axe', 'beard', 'fierce eyes', 'norse'], clothingStyle: 'chainmail with furs and viking helmet' },
  { id: 'archer', name: 'English Longbowman', description: 'The arrow storm that breaks cavalry charges.', statBonuses: { dexterity: 2, strength: 1 }, startingItems: ['English Longbow', 'Arrow Quiver', 'Buckler'], abilities: ['Volley Fire', 'Aimed Shot', 'Stake Defense'], portraitHints: ['longbow', 'leather armor', 'medieval', 'keen eyes', 'archer'], clothingStyle: 'leather jerkin with longbow and quiver' },
  { id: 'trench_soldier', name: 'WWI Trench Fighter', description: 'Survivor of the Great War. Mud, gas, and endless horror.', statBonuses: { constitution: 2, wisdom: 1 }, startingItems: ['Lee-Enfield Rifle', 'Gas Mask', 'Trench Club'], abilities: ['Trench Warfare', 'Gas Alert', 'Over the Top'], portraitHints: ['trench coat', 'brodie helmet', 'gas mask', 'muddy', 'haunted eyes'], clothingStyle: 'WWI uniform with brodie helmet and trench coat' },
];

const WAR_CLASSES_MODERN: CharacterClass[] = [
  { id: 'infantry', name: 'Infantry Grunt', description: 'Boots on the ground. You are the backbone of any army.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['Assault Rifle', 'Combat Helmet', 'First Aid Kit'], abilities: ['Suppressing Fire', 'Take Cover', 'Combat Buddy'], portraitHints: ['combat uniform', 'assault rifle', 'helmet', 'military', 'soldier'], clothingStyle: 'modern combat fatigues with tactical vest' },
  { id: 'sniper', name: 'Scout Sniper', description: 'One shot, one kill. Patient, precise, deadly.', statBonuses: { dexterity: 2, wisdom: 1 }, startingItems: ['Sniper Rifle', 'Ghillie Suit', 'Rangefinder'], abilities: ['Steady Aim', 'Camouflage', 'Spotter'], portraitHints: ['ghillie suit', 'sniper rifle', 'scope', 'patient', 'hidden'], clothingStyle: 'ghillie suit or tactical sniper attire' },
  { id: 'medic', name: 'Combat Medic', description: 'You save lives under fire. The most respected soldier.', statBonuses: { wisdom: 2, constitution: 1 }, startingItems: ['Medical Kit', 'Sidearm', 'Stretcher'], abilities: ['Field Surgery', 'Triage', 'Under Fire Treatment'], portraitHints: ['red cross', 'medical bag', 'compassionate', 'battlefield', 'healer'], clothingStyle: 'combat medic uniform with red cross insignia' },
  { id: 'tank_crew', name: 'Tank Commander', description: 'Steel beast commander. Armored fury on the battlefield.', statBonuses: { intelligence: 2, dexterity: 1 }, startingItems: ['Tank Commander Pistol', 'Radio Headset', 'Tactical Maps'], abilities: ['Hull Down', 'Coordinate Fire', 'Emergency Repairs'], portraitHints: ['tank helmet', 'headset', 'oil stains', 'commander', 'armored'], clothingStyle: 'tanker coveralls with communications headset' },
  { id: 'special_ops', name: 'Special Forces Operator', description: 'Elite tier-one operator. Trained for impossible missions.', statBonuses: { dexterity: 2, intelligence: 1 }, startingItems: ['Suppressed SMG', 'Night Vision', 'Breaching Charges'], abilities: ['Breach and Clear', 'Silent Takedown', 'Tactical Insertion'], portraitHints: ['tactical gear', 'night vision', 'elite', 'professional', 'dangerous'], clothingStyle: 'black tactical gear with advanced equipment' },
  { id: 'pilot', name: 'Combat Pilot', description: 'Soar above the battlefield. Air superiority is everything.', statBonuses: { dexterity: 2, wisdom: 1 }, startingItems: ['Flight Suit', 'Service Pistol', 'Survival Kit'], abilities: ['Evasive Maneuvers', 'Strafing Run', 'Eject'], portraitHints: ['flight suit', 'pilot helmet', 'cockpit', 'confident', 'aviator'], clothingStyle: 'flight suit with pilot helmet' },
];

const WAR_CLASSES_FUTURE: CharacterClass[] = [
  { id: 'power_armor', name: 'Power Armor Trooper', description: 'Walking tank in powered exoskeleton. Ultimate infantry.', statBonuses: { strength: 2, constitution: 1 }, startingItems: ['Heavy Plasma Gun', 'Power Armor Suit', 'Jump Jets'], abilities: ['Orbital Drop', 'Power Slam', 'Shield Generator'], portraitHints: ['power armor', 'heavy weapon', 'futuristic soldier', 'imposing', 'armored'], clothingStyle: 'heavy powered exoskeleton armor with integrated weapons' },
  { id: 'mech_pilot', name: 'Mech Pilot', description: 'Command a towering war machine. You are the weapon.', statBonuses: { dexterity: 2, intelligence: 1 }, startingItems: ['Neural Link', 'Mech Interface', 'Sidearm'], abilities: ['Mech Sync', 'Weapons Array', 'Emergency Eject'], portraitHints: ['neural interface', 'pilot suit', 'mech cockpit', 'focused', 'connected'], clothingStyle: 'sleek pilot suit with neural interface ports' },
  { id: 'clone_trooper', name: 'Clone Soldier', description: 'One of millions. Bred for war, programmed to obey.', statBonuses: { constitution: 2, dexterity: 1 }, startingItems: ['Blaster Rifle', 'Clone Armor', 'Thermal Detonator'], abilities: ['Squad Tactics', 'Genetic Enhancement', 'Execute Order'], portraitHints: ['clone armor', 'identical face', 'blaster', 'soldier', 'obedient'], clothingStyle: 'white clone trooper armor with blaster' },
  { id: 'combat_android', name: 'Combat Android', description: 'Machine soldier. No fear, no pain, perfect obedience.', statBonuses: { dexterity: 2, intelligence: 1 }, startingItems: ['Integrated Weapons', 'Repair Module', 'Tactical Database'], abilities: ['Machine Precision', 'Self-Repair', 'Threat Analysis'], portraitHints: ['robotic', 'military android', 'glowing eyes', 'mechanical', 'weapon systems'], clothingStyle: 'military android chassis with visible weapon systems' },
  { id: 'psi_soldier', name: 'Psionic Operative', description: 'Mind is the ultimate weapon. Trained psychic soldier.', statBonuses: { wisdom: 2, intelligence: 1 }, startingItems: ['Psi Amplifier', 'Light Armor', 'Mental Shielding'], abilities: ['Mind Blast', 'Telekinesis', 'Psi Shield'], portraitHints: ['glowing eyes', 'psi amp', 'psychic energy', 'mysterious', 'powerful'], clothingStyle: 'sleek psionic operative uniform with amplifier headgear' },
  { id: 'starship_marine', name: 'Starship Marine', description: 'Boarding actions and zero-G combat. Space is your battlefield.', statBonuses: { dexterity: 2, constitution: 1 }, startingItems: ['Mag Boots', 'Vacuum Suit', 'Railgun Carbine'], abilities: ['Zero-G Combat', 'Breach Assault', 'Void Walk'], portraitHints: ['space marine armor', 'vacuum suit', 'mag boots', 'starship', 'elite'], clothingStyle: 'space marine armor with magnetic boots and sealed helmet' },
];

const WAR_BACKGROUNDS: CharacterBackground[] = [
  { id: 'conscript', name: 'Drafted Conscript', description: 'You did not choose this war. It chose you.', statBonuses: { constitution: 1 }, startingItems: ['Letters from Home', 'Lucky Charm'], skills: ['Survival', 'Improvisation', 'Homesickness'] },
  { id: 'veteran', name: 'Combat Veteran', description: 'This is not your first war. The scars prove it.', statBonuses: { wisdom: 1 }, startingItems: ['Campaign Medals', 'Old Wounds'], skills: ['Tactics', 'Leadership', 'War Stories'] },
  { id: 'officer', name: 'Commissioned Officer', description: 'You lead men into battle. Their lives are your burden.', statBonuses: { charisma: 1 }, startingItems: ['Officer Insignia', 'Sidearm'], skills: ['Command', 'Strategy', 'Responsibility'] },
  { id: 'mercenary', name: 'Professional Mercenary', description: 'You fight for whoever pays. Loyalty is a luxury.', statBonuses: { dexterity: 1 }, startingItems: ['Contract', 'Personal Weapon'], skills: ['Negotiation', 'Survival', 'Pragmatism'] },
  { id: 'resistance', name: 'Resistance Fighter', description: 'Guerrilla warfare against an occupying force.', statBonuses: { dexterity: 1 }, startingItems: ['Hidden Weapons', 'Secret Codes'], skills: ['Stealth', 'Sabotage', 'Propaganda'] },
  { id: 'refugee', name: 'War Refugee', description: 'You lost everything. Now you fight to survive.', statBonuses: { constitution: 1 }, startingItems: ['Worn Photograph', 'Scavenged Supplies'], skills: ['Scavenging', 'Languages', 'Trauma'] },
  { id: 'spy', name: 'Military Intelligence', description: 'Information wins wars. You gather it by any means.', statBonuses: { intelligence: 1 }, startingItems: ['Cipher Machine', 'False Identity'], skills: ['Espionage', 'Interrogation', 'Deception'] },
  { id: 'prisoner', name: 'Former POW', description: 'You survived capture. The camp taught you endurance.', statBonuses: { constitution: 1 }, startingItems: ['Hidden Tools', 'Escape Plans'], skills: ['Endurance', 'Escape', 'Hatred'] },
];

const WAR_TRAITS = ['Brave', 'Shell-shocked', 'Disciplined', 'Rebellious', 'Patriotic', 'Cynical', 'Merciful', 'Ruthless', 'Loyal', 'Deserter', 'Heroic', 'Cowardly', 'Battle-hardened', 'Traumatized', 'Leader'];

// Helper to get war classes based on detected era
export function getWarClassesForEra(era: WarEra): CharacterClass[] {
  switch (era) {
    case 'past': return WAR_CLASSES_PAST;
    case 'modern': return WAR_CLASSES_MODERN;
    case 'future': return WAR_CLASSES_FUTURE;
    default: return WAR_CLASSES_MODERN;
  }
}

// Detect war era from text (years or keywords)
export function detectWarEra(text: string): WarEra {
  const lower = text.toLowerCase();
  
  // Check for explicit year ranges
  const yearMatch = text.match(/\b(1[0-9]{3}|20[0-9]{2}|2[1-9][0-9]{2}|[3-9][0-9]{3})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year < 1920) return 'past';
    if (year <= 2050) return 'modern';
    return 'future';
  }
  
  // Future warfare keywords
  if (lower.includes('space war') || lower.includes('galactic') || lower.includes('starship') || 
      lower.includes('mech') || lower.includes('android') || lower.includes('clone') ||
      lower.includes('psionic') || lower.includes('power armor') || lower.includes('plasma') ||
      lower.includes('laser') || lower.includes('future war') || lower.includes('interstellar')) {
    return 'future';
  }
  
  // Past warfare keywords
  if (lower.includes('roman') || lower.includes('medieval') || lower.includes('knight') ||
      lower.includes('samurai') || lower.includes('viking') || lower.includes('ancient') ||
      lower.includes('crusade') || lower.includes('longbow') || lower.includes('gladiator') ||
      lower.includes('trench') || lower.includes('wwi') || lower.includes('world war one') ||
      lower.includes('great war') || lower.includes('napoleonic') || lower.includes('civil war')) {
    return 'past';
  }
  
  // Default to modern
  return 'modern';
}

// Genre Trait Sets
const FANTASY_TRAITS = ['Brave', 'Cautious', 'Cunning', 'Honest', 'Mysterious', 'Hot-headed', 'Calm', 'Curious', 'Loyal', 'Ambitious', 'Compassionate', 'Ruthless', 'Witty', 'Stoic', 'Optimistic'];
const SCIFI_TRAITS = ['Analytical', 'Rebellious', 'Methodical', 'Reckless', 'Paranoid', 'Idealistic', 'Cynical', 'Tech-savvy', 'Lone Wolf', 'Team Player', 'By-the-book', 'Improviser', 'Cold', 'Empathetic', 'Resourceful'];
const HORROR_TRAITS = ['Paranoid', 'Skeptical', 'Faithful', 'Nihilistic', 'Protective', 'Self-preserving', 'Curious', 'Traumatized', 'Calm under pressure', 'Panicky', 'Obsessive', 'Detached', 'Compassionate', 'Ruthless', 'Determined'];
const MYSTERY_TRAITS = ['Observant', 'Suspicious', 'Charming', 'Blunt', 'Patient', 'Impulsive', 'Methodical', 'Intuitive', 'Cynical', 'Idealistic', 'Secretive', 'Honest', 'Manipulative', 'Empathetic', 'Cold'];
const PIRATE_TRAITS = ['Greedy', 'Honorable', 'Ruthless', 'Loyal', 'Superstitious', 'Skeptical', 'Reckless', 'Cautious', 'Charming', 'Intimidating', 'Cunning', 'Honest', 'Vengeful', 'Forgiving', 'Ambitious'];
const WESTERN_TRAITS = ['Stoic', 'Hot-headed', 'Honorable', 'Vengeful', 'Merciful', 'Greedy', 'Loyal', 'Loner', 'Charming', 'Gruff', 'Religious', 'Cynical', 'Brave', 'Cautious', 'Ruthless'];
const CYBERPUNK_TRAITS = ['Paranoid', 'Reckless', 'Cynical', 'Idealistic', 'Corporate', 'Anti-establishment', 'Augmented', 'Purist', 'Connected', 'Isolated', 'Street smart', 'Cold', 'Passionate', 'Calculating', 'Impulsive'];
const POSTAPOC_TRAITS = ['Hopeful', 'Nihilistic', 'Tribal', 'Isolationist', 'Trader', 'Raider mentality', 'Pacifist', 'Violent', 'Resourceful', 'Wasteful', 'Trusting', 'Paranoid', 'Mutant-friendly', 'Purist', 'Survivor'];

// Genre Data Map - War defaults to modern era, use getWarGenreData() for era-specific
export const GENRE_DATA: Record<GameGenre, GenreData> = {
  fantasy: { id: 'fantasy', name: 'Fantasy', classes: FANTASY_CLASSES, backgrounds: FANTASY_BACKGROUNDS, traits: FANTASY_TRAITS, currency: 'Gold', startingCurrency: 15 },
  scifi: { id: 'scifi', name: 'Sci-Fi', classes: SCIFI_CLASSES, backgrounds: SCIFI_BACKGROUNDS, traits: SCIFI_TRAITS, currency: 'Credits', startingCurrency: 500 },
  horror: { id: 'horror', name: 'Horror', classes: HORROR_CLASSES, backgrounds: HORROR_BACKGROUNDS, traits: HORROR_TRAITS, currency: 'Dollars', startingCurrency: 50 },
  mystery: { id: 'mystery', name: 'Mystery/Noir', classes: MYSTERY_CLASSES, backgrounds: MYSTERY_BACKGROUNDS, traits: MYSTERY_TRAITS, currency: 'Dollars', startingCurrency: 100 },
  pirate: { id: 'pirate', name: 'Pirate', classes: PIRATE_CLASSES, backgrounds: PIRATE_BACKGROUNDS, traits: PIRATE_TRAITS, currency: 'Doubloons', startingCurrency: 20 },
  western: { id: 'western', name: 'Western', classes: WESTERN_CLASSES, backgrounds: WESTERN_BACKGROUNDS, traits: WESTERN_TRAITS, currency: 'Dollars', startingCurrency: 25 },
  cyberpunk: { id: 'cyberpunk', name: 'Cyberpunk', classes: CYBERPUNK_CLASSES, backgrounds: CYBERPUNK_BACKGROUNDS, traits: CYBERPUNK_TRAITS, currency: 'Eddies', startingCurrency: 1000 },
  postapoc: { id: 'postapoc', name: 'Post-Apocalyptic', classes: POSTAPOC_CLASSES, backgrounds: POSTAPOC_BACKGROUNDS, traits: POSTAPOC_TRAITS, currency: 'Caps', startingCurrency: 30 },
  war: { id: 'war', name: 'War', classes: WAR_CLASSES_MODERN, backgrounds: WAR_BACKGROUNDS, traits: WAR_TRAITS, currency: 'Rations', startingCurrency: 10 },
  custom: { id: 'custom', name: 'Custom', classes: FANTASY_CLASSES, backgrounds: FANTASY_BACKGROUNDS, traits: FANTASY_TRAITS, currency: 'Gold', startingCurrency: 15 },
};

// Get war genre data with era-specific classes
export function getWarGenreData(era: WarEra): GenreData {
  return {
    id: 'war',
    name: `War (${era.charAt(0).toUpperCase() + era.slice(1)})`,
    classes: getWarClassesForEra(era),
    backgrounds: WAR_BACKGROUNDS,
    traits: WAR_TRAITS,
    currency: era === 'future' ? 'Credits' : era === 'past' ? 'Coin' : 'Rations',
    startingCurrency: era === 'future' ? 100 : era === 'past' ? 20 : 10,
  };
}

// Detect genre from scenario text
export function detectGenreFromScenario(scenario: string): GameGenre {
  const lower = scenario.toLowerCase();
  if (lower.includes('space') || lower.includes('starship') || lower.includes('galaxy') || lower.includes('alien') || lower.includes('planet')) return 'scifi';
  if (lower.includes('horror') || lower.includes('abandoned') || lower.includes('nightmare') || lower.includes('monster') || lower.includes('haunted')) return 'horror';
  if (lower.includes('detective') || lower.includes('mystery') || lower.includes('investigate') || lower.includes('murder') || lower.includes('noir')) return 'mystery';
  if (lower.includes('pirate') || lower.includes('ship') || lower.includes('treasure') || lower.includes('seas') || lower.includes('captain')) return 'pirate';
  if (lower.includes('cyberpunk') || lower.includes('neon') || lower.includes('hacker') || lower.includes('corporation') || lower.includes('dystopia') || lower.includes('chrome')) return 'cyberpunk';
  if (lower.includes('western') || lower.includes('cowboy') || lower.includes('frontier') || lower.includes('outlaw') || lower.includes('saloon') || lower.includes('sheriff')) return 'western';
  if (lower.includes('apocalypse') || lower.includes('wasteland') || lower.includes('survivor') || lower.includes('ruins') || lower.includes('fallout') || lower.includes('radiation')) return 'postapoc';
  if (lower.includes('magic') || lower.includes('dragon') || lower.includes('wizard') || lower.includes('kingdom') || lower.includes('quest') || lower.includes('fantasy')) return 'fantasy';
  return 'fantasy';
}

// Create character with genre-specific data
export function createGenreCharacter(
  name: string,
  classId: string,
  backgroundId: string,
  traits: string[],
  statAllocation: Partial<CharacterStats>,
  genre: GameGenre,
  portraitUrl?: string
): RPGCharacter & { portraitUrl?: string } {
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
    portraitUrl,
  };
}
