// ============================================
// GENRE BLEND SYSTEM
// Creates hybrid roles and origins that combine elements from multiple genres
// ============================================

import { CharacterClass, CharacterBackground } from '@/types/rpgCharacter';
import { GameGenre, GENRE_DATA } from '@/types/genreData';
import { SecondaryGenre } from '@/components/adventure/AdventureCreator';

// ============================================
// HYBRID CLASS DEFINITIONS
// Each hybrid combines two genres for unique cross-genre roles
// ============================================

interface HybridClass extends CharacterClass {
  sourceGenres: [GameGenre, GameGenre];
  blendDescription: string;
}

interface HybridBackground extends CharacterBackground {
  sourceGenres: [GameGenre, GameGenre];
  blendDescription: string;
}

// Fantasy + Sci-Fi hybrids
const FANTASY_SCIFI_CLASSES: HybridClass[] = [
  {
    id: 'technomancer',
    name: 'Technomancer',
    description: 'Blends arcane magic with advanced technology, casting spells through circuits.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Spell-Tech Gauntlet', 'Runic Datapad', 'Mana Battery'],
    abilities: ['Tech-Spell Fusion', 'System Hex', 'Digital Familiar'],
    portraitHints: ['arcane circuits', 'glowing runes on tech', 'robes with wires', 'holographic spell effects'],
    clothingStyle: 'wizard robes integrated with glowing circuitry and tech accessories',
    sourceGenres: ['fantasy', 'scifi'],
    blendDescription: 'Where magic meets machine'
  },
  {
    id: 'void_knight',
    name: 'Void Knight',
    description: 'Space-faring warrior who wields enchanted power armor and plasma swords.',
    statBonuses: { strength: 2, constitution: 1 },
    startingItems: ['Enchanted Power Armor', 'Plasma Blade', 'Void Shield'],
    abilities: ['Warp Strike', 'Barrier of Light', 'Zero-G Combat'],
    portraitHints: ['power armor with runes', 'energy sword', 'space helmet with visor', 'cosmic background'],
    clothingStyle: 'ornate power armor with magical runes and energy weapons',
    sourceGenres: ['fantasy', 'scifi'],
    blendDescription: 'Holy warriors of the stars'
  },
  {
    id: 'gene_druid',
    name: 'Gene Druid',
    description: 'Masters genetic engineering and nature magic to reshape life itself.',
    statBonuses: { intelligence: 1, wisdom: 2 },
    startingItems: ['Bio-Staff', 'Gene Splicing Kit', 'Living Familiar'],
    abilities: ['Splice Life', 'Nature Protocol', 'Bio-Regeneration'],
    portraitHints: ['organic tech', 'plant-like cybernetics', 'DNA helixes', 'bio-luminescent'],
    clothingStyle: 'living robes that grow and shift with integrated bio-tech',
    sourceGenres: ['fantasy', 'scifi'],
    blendDescription: 'Life engineers of the new age'
  }
];

// Fantasy + Horror hybrids
const FANTASY_HORROR_CLASSES: HybridClass[] = [
  {
    id: 'dark_warlock',
    name: 'Dark Warlock',
    description: 'Draws power from eldritch horrors beyond mortal comprehension.',
    statBonuses: { intelligence: 2, constitution: 1 },
    startingItems: ['Tome of Shadows', 'Sacrificial Dagger', 'Eldritch Focus'],
    abilities: ['Summon Horror', 'Madness Touch', 'Dark Pact'],
    portraitHints: ['tentacle shadows', 'corrupted appearance', 'otherworldly eyes', 'dark robes'],
    clothingStyle: 'tattered black robes with writhing shadows and corruption marks',
    sourceGenres: ['fantasy', 'horror'],
    blendDescription: 'Servants of the outer dark'
  },
  {
    id: 'monster_hunter',
    name: 'Monster Hunter',
    description: 'Trained to track and slay supernatural creatures using enchanted weapons.',
    statBonuses: { dexterity: 2, wisdom: 1 },
    startingItems: ['Silver Sword', 'Monster Bestiary', 'Blessed Ammunition'],
    abilities: ['Track Creature', 'Weakness Exploit', 'Silver Strike'],
    portraitHints: ['leather armor', 'trophy collection', 'silver weapons', 'scarred veteran'],
    clothingStyle: 'practical hunting leathers adorned with monster trophies',
    sourceGenres: ['fantasy', 'horror'],
    blendDescription: 'Slayers of the supernatural'
  },
  {
    id: 'cursed_knight',
    name: 'Cursed Knight',
    description: 'A fallen warrior bound by dark curses, fighting for redemption.',
    statBonuses: { strength: 2, constitution: 1 },
    startingItems: ['Cursed Blade', 'Haunted Armor', 'Redemption Token'],
    abilities: ['Undying Will', 'Curse Transfer', 'Dark Resilience'],
    portraitHints: ['decayed armor', 'supernatural glow', 'tragic expression', 'spectral elements'],
    clothingStyle: 'ancient corroded armor wreathed in supernatural energy',
    sourceGenres: ['fantasy', 'horror'],
    blendDescription: 'Damned warriors seeking salvation'
  }
];

// Cyberpunk + Horror hybrids
const CYBERPUNK_HORROR_CLASSES: HybridClass[] = [
  {
    id: 'digital_exorcist',
    name: 'Digital Exorcist',
    description: 'Hunts rogue AIs and digital demons that possess networks and people.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Purge Program', 'Neural Firewall', 'Digital Holy Water'],
    abilities: ['System Cleanse', 'Trace Daemon', 'Firewall Soul'],
    portraitHints: ['religious iconography with tech', 'cross-shaped cyberdeck', 'glowing eyes', 'priest tech-robes'],
    clothingStyle: 'tech-priest robes with integrated purification hardware',
    sourceGenres: ['cyberpunk', 'horror'],
    blendDescription: 'Cleansers of digital corruption'
  },
  {
    id: 'bio_horror',
    name: 'Bio-Horror',
    description: 'Corporate experiment gone wrong, part machine, part nightmare.',
    statBonuses: { constitution: 2, strength: 1 },
    startingItems: ['Organic Weapons', 'Containment Suit', 'Suppression Meds'],
    abilities: ['Mutation Surge', 'Regenerate', 'Terror Form'],
    portraitHints: ['body horror elements', 'organic-tech fusion', 'unstable mutations', 'contained rage'],
    clothingStyle: 'containment suit barely controlling mutated bio-tech body',
    sourceGenres: ['cyberpunk', 'horror'],
    blendDescription: 'Corporate nightmares made flesh'
  },
  {
    id: 'mind_hacker',
    name: 'Psychic Netrunner',
    description: 'Uses forbidden psionic implants to invade minds directly.',
    statBonuses: { intelligence: 1, wisdom: 2 },
    startingItems: ['Psionic Interface', 'Mind Shield', 'Memory Extractor'],
    abilities: ['Mind Dive', 'Psychic Shock', 'Memory Theft'],
    portraitHints: ['third eye implant', 'neural crown', 'distant gaze', 'psychic energy'],
    clothingStyle: 'minimalist clothes with exposed cranial implants and psychic amplifiers',
    sourceGenres: ['cyberpunk', 'horror'],
    blendDescription: 'Invaders of the psyche'
  }
];

// Western + Fantasy hybrids
const WESTERN_FANTASY_CLASSES: HybridClass[] = [
  {
    id: 'spell_slinger',
    name: 'Spell Slinger',
    description: 'A frontier wizard who casts magic through enchanted revolvers.',
    statBonuses: { dexterity: 2, intelligence: 1 },
    startingItems: ['Enchanted Six-Shooter', 'Spell Cartridges', 'Duster of Warding'],
    abilities: ['Spell Shot', 'Quick Cast', 'Arcane Duel'],
    portraitHints: ['glowing revolver', 'mystical duster', 'arcane sigils', 'frontier wizard'],
    clothingStyle: 'frontier duster covered in arcane symbols with enchanted guns',
    sourceGenres: ['western', 'fantasy'],
    blendDescription: 'Magic meets the frontier'
  },
  {
    id: 'frontier_shaman',
    name: 'Spirit Walker',
    description: 'Channels the ancient spirits of the land to protect and heal.',
    statBonuses: { wisdom: 2, charisma: 1 },
    startingItems: ['Spirit Totem', 'Medicine Bag', 'Dreamcatcher'],
    abilities: ['Spirit Guide', 'Land Blessing', 'Vision Quest'],
    portraitHints: ['traditional garments', 'spirit animals', 'mystical aura', 'sage-like'],
    clothingStyle: 'traditional indigenous garments with spiritual totems',
    sourceGenres: ['western', 'fantasy'],
    blendDescription: 'Keepers of the old ways'
  },
  {
    id: 'dragon_wrangler',
    name: 'Dragon Wrangler',
    description: 'Frontier rancher who rides and herds dragons instead of cattle.',
    statBonuses: { constitution: 2, wisdom: 1 },
    startingItems: ['Dragon Lasso', 'Fire-Proof Chaps', 'Dragon Whistle'],
    abilities: ['Dragon Bond', 'Flame Resist', 'Aerial Lasso'],
    portraitHints: ['scaled leather', 'dragon nearby', 'fearless cowboy', 'fire-resistant gear'],
    clothingStyle: 'dragon-hide cowboy gear with special riding equipment',
    sourceGenres: ['western', 'fantasy'],
    blendDescription: 'Tamers of legendary beasts'
  }
];

// Sci-Fi + Western hybrids (Space Western)
const SCIFI_WESTERN_CLASSES: HybridClass[] = [
  {
    id: 'star_marshal',
    name: 'Star Marshal',
    description: 'Interstellar lawman keeping order on frontier planets.',
    statBonuses: { charisma: 2, dexterity: 1 },
    startingItems: ['Plasma Peacemaker', 'Star Marshal Badge', 'Hover Horse'],
    abilities: ['Galactic Authority', 'Quick Draw', 'Frontier Justice'],
    portraitHints: ['space cowboy', 'futuristic badge', 'plasma pistol', 'dusty spaceport'],
    clothingStyle: 'space-age duster and cowboy hat with integrated tech',
    sourceGenres: ['scifi', 'western'],
    blendDescription: 'Law of the galactic frontier'
  },
  {
    id: 'void_prospector',
    name: 'Asteroid Prospector',
    description: 'Mining precious minerals from the cosmic frontier.',
    statBonuses: { constitution: 2, wisdom: 1 },
    startingItems: ['Mining Laser', 'Prospector Ship', 'Mineral Scanner'],
    abilities: ['Ore Detection', 'Zero-G Mining', 'Claim Stake'],
    portraitHints: ['mining gear', 'space suit', 'asteroid belt', 'rugged pioneer'],
    clothingStyle: 'worn space suit with mining equipment and dust',
    sourceGenres: ['scifi', 'western'],
    blendDescription: 'Pioneers of the cosmic gold rush'
  },
  {
    id: 'bounty_hunter_elite',
    name: 'Galactic Bounty Hunter',
    description: 'Tracks fugitives across star systems with advanced tech.',
    statBonuses: { dexterity: 2, intelligence: 1 },
    startingItems: ['Tracking Module', 'Stun Bolas', 'Wanted Holo-Posters'],
    abilities: ['Hyperspace Track', 'Capture Protocol', 'Dead or Alive'],
    portraitHints: ['armored space cowboy', 'jetpack', 'multiple weapons', 'wanted posters'],
    clothingStyle: 'space-age bounty hunter armor with jetpack and gadgets',
    sourceGenres: ['scifi', 'western'],
    blendDescription: 'Hunters among the stars'
  }
];

// Pirate + Fantasy hybrids
const PIRATE_FANTASY_CLASSES: HybridClass[] = [
  {
    id: 'sea_witch',
    name: 'Sea Witch',
    description: 'Commands the ocean through ancient maritime magic.',
    statBonuses: { wisdom: 2, charisma: 1 },
    startingItems: ['Coral Staff', 'Tide Charm', 'Sea Creature Familiar'],
    abilities: ['Storm Call', 'Water Walking', 'Siren Song'],
    portraitHints: ['seaweed hair', 'glowing eyes', 'coral accessories', 'mystical ocean'],
    clothingStyle: 'flowing robes of kelp and shells with coral jewelry',
    sourceGenres: ['pirate', 'fantasy'],
    blendDescription: 'Masters of the mystical seas'
  },
  {
    id: 'ghost_captain',
    name: 'Phantom Captain',
    description: 'Undead pirate lord who commands a spectral crew.',
    statBonuses: { charisma: 2, constitution: 1 },
    startingItems: ['Cursed Cutlass', 'Ghost Ship Compass', 'Spectral Crew'],
    abilities: ['Phantom Crew', 'Death Gaze', 'Ship Phasing'],
    portraitHints: ['skeletal features', 'ghostly glow', 'captain regalia', 'phantom ship'],
    clothingStyle: 'decayed captain uniform with ghostly ethereal effects',
    sourceGenres: ['pirate', 'fantasy'],
    blendDescription: 'Cursed sailors of the damned'
  },
  {
    id: 'treasure_mage',
    name: 'Treasure Seeker',
    description: 'Uses divination magic to find legendary treasures.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Enchanted Map', 'Gold-Sensing Compass', 'Treasure Lore Tome'],
    abilities: ['Treasure Sense', 'Ward Breaker', 'Gold Transmutation'],
    portraitHints: ['magical compass', 'treasure maps', 'mystical explorer', 'gold artifacts'],
    clothingStyle: 'explorer robes with many pockets and magical trinkets',
    sourceGenres: ['pirate', 'fantasy'],
    blendDescription: 'Magical seekers of fortune'
  }
];

// Mystery + Cyberpunk hybrids
const MYSTERY_CYBERPUNK_CLASSES: HybridClass[] = [
  {
    id: 'data_detective',
    name: 'Data Detective',
    description: 'Investigates corporate crimes through digital forensics.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Forensic Deck', 'Data Analyzer', 'Evidence Drive'],
    abilities: ['Digital Forensics', 'Data Recovery', 'Trace Source'],
    portraitHints: ['holographic displays', 'detective coat', 'cyber eye', 'data streams'],
    clothingStyle: 'noir detective coat with integrated analysis tech',
    sourceGenres: ['mystery', 'cyberpunk'],
    blendDescription: 'Detectives of the digital age'
  },
  {
    id: 'memory_investigator',
    name: 'Memory Diver',
    description: 'Extracts truth from memories using braindance technology.',
    statBonuses: { wisdom: 2, intelligence: 1 },
    startingItems: ['Braindance Recorder', 'Memory Probe', 'Truth Serum Chip'],
    abilities: ['Memory Extract', 'Emotion Read', 'Truth Scan'],
    portraitHints: ['neural crown', 'closed eyes', 'memory fragments', 'investigation tech'],
    clothingStyle: 'clinical investigator attire with memory access hardware',
    sourceGenres: ['mystery', 'cyberpunk'],
    blendDescription: 'Seekers of hidden truths'
  },
  {
    id: 'noir_fixer',
    name: 'Neon Noir Detective',
    description: 'Classic detective methods enhanced with street-level tech.',
    statBonuses: { charisma: 2, intelligence: 1 },
    startingItems: ['Smart Revolver', 'AI Partner', 'Info Network'],
    abilities: ['Street Intel', 'Intimidate Scan', 'Cold Case Solver'],
    portraitHints: ['trench coat', 'neon lighting', 'cigarette', 'rain-soaked streets'],
    clothingStyle: 'classic noir detective with subtle cybernetic enhancements',
    sourceGenres: ['mystery', 'cyberpunk'],
    blendDescription: 'Old methods in a new world'
  }
];

// Post-Apocalyptic + Sci-Fi hybrids
const POSTAPOC_SCIFI_CLASSES: HybridClass[] = [
  {
    id: 'bunker_scientist',
    name: 'Vault Scientist',
    description: 'Pre-war genius preserving and rebuilding lost technology.',
    statBonuses: { intelligence: 3 },
    startingItems: ['Pre-War Database', 'Experimental Tech', 'Vault Lab Coat'],
    abilities: ['Reverse Engineer', 'Create Tech', 'Pre-War Knowledge'],
    portraitHints: ['lab coat', 'advanced tech', 'vault background', 'genius inventor'],
    clothingStyle: 'pristine pre-war lab coat with advanced experimental equipment',
    sourceGenres: ['postapoc', 'scifi'],
    blendDescription: 'Preservers of lost knowledge'
  },
  {
    id: 'synth_hunter',
    name: 'Synth Hunter',
    description: 'Tracks rogue androids and malfunctioning robots across the wastes.',
    statBonuses: { dexterity: 2, intelligence: 1 },
    startingItems: ['EMP Gun', 'Synth Detector', 'Robot Parts'],
    abilities: ['Identify Synth', 'EMP Pulse', 'Tech Salvage'],
    portraitHints: ['wasteland gear', 'emp weapon', 'robot hunting trophies', 'tech-savvy'],
    clothingStyle: 'wasteland hunter gear with anti-robot tech and EMP equipment',
    sourceGenres: ['postapoc', 'scifi'],
    blendDescription: 'Hunters of artificial life'
  },
  {
    id: 'space_survivor',
    name: 'Orbital Survivor',
    description: 'Descended from space station survivors with advanced knowledge.',
    statBonuses: { intelligence: 2, constitution: 1 },
    startingItems: ['Space Suit Remnants', 'Orbital Tech', 'Star Charts'],
    abilities: ['Zero-G Adapted', 'Advanced Tech Use', 'Orbital Contact'],
    portraitHints: ['patched space suit', 'orbital debris', 'advanced but worn tech', 'sky gazer'],
    clothingStyle: 'worn and patched space suit with scavenged orbital technology',
    sourceGenres: ['postapoc', 'scifi'],
    blendDescription: 'Children of the fallen stations'
  }
];

// War + Cyberpunk hybrids
const WAR_CYBERPUNK_CLASSES: HybridClass[] = [
  {
    id: 'cyber_soldier',
    name: 'Augmented Soldier',
    description: 'Military-grade cybernetics make this soldier a weapon of war.',
    statBonuses: { strength: 2, constitution: 1 },
    startingItems: ['Military Cyberlimbs', 'Smart Weapon', 'Combat Stims'],
    abilities: ['Combat Override', 'Weapon Integration', 'Tactical HUD'],
    portraitHints: ['military cybernetics', 'heavy weapons', 'soldier bearing', 'combat scars'],
    clothingStyle: 'military uniform integrated with extensive combat cybernetics',
    sourceGenres: ['war', 'cyberpunk'],
    blendDescription: 'Super soldiers of the future'
  },
  {
    id: 'drone_commander',
    name: 'Drone Commander',
    description: 'Controls swarms of military drones from behind the lines.',
    statBonuses: { intelligence: 2, dexterity: 1 },
    startingItems: ['Command Rig', 'Drone Swarm', 'Tactical Interface'],
    abilities: ['Drone Swarm', 'Tactical Overview', 'Remote Strike'],
    portraitHints: ['command interface', 'drone swarm', 'military officer', 'tactical displays'],
    clothingStyle: 'high-tech command uniform with drone control interfaces',
    sourceGenres: ['war', 'cyberpunk'],
    blendDescription: 'Masters of machine warfare'
  },
  {
    id: 'wetwork_operative',
    name: 'Black Ops Agent',
    description: 'Corporate-military assassin with cutting-edge stealth tech.',
    statBonuses: { dexterity: 2, intelligence: 1 },
    startingItems: ['Stealth Suit', 'Mono-Wire', 'Corporate Clearance'],
    abilities: ['Active Camo', 'Silent Kill', 'Extraction Protocol'],
    portraitHints: ['stealth suit', 'assassin', 'corporate military', 'deadly professional'],
    clothingStyle: 'high-tech stealth suit with concealed weapons',
    sourceGenres: ['war', 'cyberpunk'],
    blendDescription: 'Shadows of corporate wars'
  }
];

// Modern Life + Mystery hybrids
const MODERN_MYSTERY_CLASSES: HybridClass[] = [
  {
    id: 'true_crime_podcaster',
    name: 'True Crime Podcaster',
    description: 'Amateur detective who solves cold cases for their audience.',
    statBonuses: { charisma: 2, intelligence: 1 },
    startingItems: ['Podcast Equipment', 'Case Files', 'Devoted Listeners'],
    abilities: ['Crowdsource Intel', 'Public Pressure', 'Interview Expert'],
    portraitHints: ['microphone', 'evidence boards', 'obsessive researcher', 'social media'],
    clothingStyle: 'casual trendy attire with recording equipment and notebooks',
    sourceGenres: ['modern_life', 'mystery'],
    blendDescription: 'Detectives of the digital age'
  },
  {
    id: 'insurance_investigator',
    name: 'Insurance Investigator',
    description: 'Uncovers fraud and hidden truths for corporate clients.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Company Badge', 'Expense Account', 'Investigation Kit'],
    abilities: ['Fraud Detection', 'Background Check', 'Follow the Money'],
    portraitHints: ['business attire', 'suspicious', 'documentation', 'ordinary appearance'],
    clothingStyle: 'unremarkable business attire that helps blend in',
    sourceGenres: ['modern_life', 'mystery'],
    blendDescription: 'Seekers of corporate truth'
  },
  {
    id: 'social_media_sleuth',
    name: 'OSINT Investigator',
    description: 'Uses social media and public records to solve mysteries.',
    statBonuses: { intelligence: 2, charisma: 1 },
    startingItems: ['Multiple Devices', 'Fake Accounts', 'Data Scrapers'],
    abilities: ['Digital Trace', 'Social Engineering', 'Pattern Recognition'],
    portraitHints: ['multiple screens', 'coffee cups', 'home office', 'intense focus'],
    clothingStyle: 'comfortable home clothes with multiple devices and screens',
    sourceGenres: ['modern_life', 'mystery'],
    blendDescription: 'Online detectives and researchers'
  }
];

// Horror + Post-Apocalyptic hybrids
const HORROR_POSTAPOC_CLASSES: HybridClass[] = [
  {
    id: 'plague_survivor',
    name: 'Plague Survivor',
    description: 'Immune to the virus that created the monsters, hunted by both.',
    statBonuses: { constitution: 2, wisdom: 1 },
    startingItems: ['Immunity Proof', 'Medical Supplies', 'Monster Lore'],
    abilities: ['Disease Immunity', 'Infected Lore', 'Survivor Network'],
    portraitHints: ['protective mask', 'medical equipment', 'haunted eyes', 'survival gear'],
    clothingStyle: 'hazmat-influenced survival gear with medical supplies',
    sourceGenres: ['horror', 'postapoc'],
    blendDescription: 'Survivors of the infected world'
  },
  {
    id: 'cult_breaker',
    name: 'Cult Breaker',
    description: 'Fights the apocalyptic cults that worship the end times.',
    statBonuses: { charisma: 2, strength: 1 },
    startingItems: ['Anti-Cult Gear', 'Deprogramming Kit', 'Cult Intel'],
    abilities: ['Cult Knowledge', 'Deprogram', 'Resist Influence'],
    portraitHints: ['determined expression', 'cult symbols crossed out', 'rescue equipment', 'tough'],
    clothingStyle: 'practical rescue gear with anti-cult propaganda',
    sourceGenres: ['horror', 'postapoc'],
    blendDescription: 'Fighters against end-times madness'
  },
  {
    id: 'wasteland_medium',
    name: 'Wasteland Medium',
    description: 'Speaks to the countless dead to guide the living.',
    statBonuses: { wisdom: 2, charisma: 1 },
    startingItems: ['Spirit Tokens', 'Ghost Map', 'Séance Kit'],
    abilities: ['Speak with Dead', 'Ghost Warning', 'Final Messages'],
    portraitHints: ['ethereal appearance', 'ghostly companions', 'mystical trinkets', 'haunted'],
    clothingStyle: 'mystical wasteland robes with spirit-catching talismans',
    sourceGenres: ['horror', 'postapoc'],
    blendDescription: 'Voices of the fallen world'
  }
];

// ============================================
// HYBRID BACKGROUND DEFINITIONS
// ============================================

const FANTASY_SCIFI_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'arcane_colony',
    name: 'Arcane Colony Settler',
    description: 'Raised in a colony that blends magic and technology.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Colony ID', 'Spell-Tech Tool'],
    skills: ['Tech-Magic Integration', 'Colony Law', 'Dual Power'],
    sourceGenres: ['fantasy', 'scifi'],
    blendDescription: 'Children of two worlds'
  },
  {
    id: 'mage_guild_researcher',
    name: 'Techno-Mage Researcher',
    description: 'Studied in institutions that combine arcane and scientific methods.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Research Credentials', 'Hybrid Notes'],
    skills: ['Arcane Science', 'Laboratory Magic', 'Cross-Discipline'],
    sourceGenres: ['fantasy', 'scifi'],
    blendDescription: 'Seekers of unified knowledge'
  }
];

const WESTERN_FANTASY_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'mystic_native',
    name: 'Spirit-Touched Native',
    description: 'Your people have always known the magic of the land.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Spirit Medicine', 'Sacred Bundle'],
    skills: ['Land Magic', 'Spirit Sight', 'Ancient Ways'],
    sourceGenres: ['western', 'fantasy'],
    blendDescription: 'Keepers of ancient power'
  },
  {
    id: 'frontier_wizard',
    name: 'Frontier Hedge Wizard',
    description: 'Learned magic from wandering teachers and old books.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Worn Spellbook', 'Frontier Focus'],
    skills: ['Self-Taught Magic', 'Practical Spells', 'Frontier Survival'],
    sourceGenres: ['western', 'fantasy'],
    blendDescription: 'Self-made spellcasters'
  }
];

const CYBERPUNK_HORROR_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'corporate_experiment',
    name: 'Corporate Test Subject',
    description: 'Escaped a corp lab where they did terrible things.',
    statBonuses: { constitution: 1 },
    startingItems: ['Experimental Implant', 'Suppression Drugs'],
    skills: ['Trauma Resistance', 'Corp Knowledge', 'Unnatural Abilities'],
    sourceGenres: ['cyberpunk', 'horror'],
    blendDescription: 'Survivors of inhuman experiments'
  },
  {
    id: 'digital_haunted',
    name: 'Ghost in the Machine',
    description: 'A near-death experience left something else in your implants.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Haunted Cybernetics', 'Exorcism Patch'],
    skills: ['Digital Medium', 'Ghost Sight', 'System Possession'],
    sourceGenres: ['cyberpunk', 'horror'],
    blendDescription: 'Hosts to digital entities'
  }
];

// ============================================
// GENRE BLEND MATCHING AND GENERATION
// ============================================

// Map of genre pair keys to hybrid classes
const HYBRID_CLASS_MAP: Record<string, HybridClass[]> = {
  'fantasy-scifi': FANTASY_SCIFI_CLASSES,
  'scifi-fantasy': FANTASY_SCIFI_CLASSES,
  'fantasy-horror': FANTASY_HORROR_CLASSES,
  'horror-fantasy': FANTASY_HORROR_CLASSES,
  'cyberpunk-horror': CYBERPUNK_HORROR_CLASSES,
  'horror-cyberpunk': CYBERPUNK_HORROR_CLASSES,
  'western-fantasy': WESTERN_FANTASY_CLASSES,
  'fantasy-western': WESTERN_FANTASY_CLASSES,
  'scifi-western': SCIFI_WESTERN_CLASSES,
  'western-scifi': SCIFI_WESTERN_CLASSES,
  'pirate-fantasy': PIRATE_FANTASY_CLASSES,
  'fantasy-pirate': PIRATE_FANTASY_CLASSES,
  'mystery-cyberpunk': MYSTERY_CYBERPUNK_CLASSES,
  'cyberpunk-mystery': MYSTERY_CYBERPUNK_CLASSES,
  'postapoc-scifi': POSTAPOC_SCIFI_CLASSES,
  'scifi-postapoc': POSTAPOC_SCIFI_CLASSES,
  'war-cyberpunk': WAR_CYBERPUNK_CLASSES,
  'cyberpunk-war': WAR_CYBERPUNK_CLASSES,
  'modern_life-mystery': MODERN_MYSTERY_CLASSES,
  'mystery-modern_life': MODERN_MYSTERY_CLASSES,
  'horror-postapoc': HORROR_POSTAPOC_CLASSES,
  'postapoc-horror': HORROR_POSTAPOC_CLASSES,
};

const HYBRID_BACKGROUND_MAP: Record<string, HybridBackground[]> = {
  'fantasy-scifi': FANTASY_SCIFI_BACKGROUNDS,
  'scifi-fantasy': FANTASY_SCIFI_BACKGROUNDS,
  'western-fantasy': WESTERN_FANTASY_BACKGROUNDS,
  'fantasy-western': WESTERN_FANTASY_BACKGROUNDS,
  'cyberpunk-horror': CYBERPUNK_HORROR_BACKGROUNDS,
  'horror-cyberpunk': CYBERPUNK_HORROR_BACKGROUNDS,
};

/**
 * Get blended classes for a primary genre with secondary genres
 */
export function getBlendedClasses(
  primaryGenre: GameGenre,
  secondaryGenres: SecondaryGenre[]
): CharacterClass[] {
  // Start with primary genre classes
  const primaryClasses = [...GENRE_DATA[primaryGenre].classes];
  
  // Add hybrid classes for each secondary genre
  const hybridClasses: CharacterClass[] = [];
  for (const secondary of secondaryGenres) {
    const key = `${primaryGenre}-${secondary.genreId}`;
    const hybrids = HYBRID_CLASS_MAP[key];
    if (hybrids) {
      // Number of hybrids to add based on blend strength
      const hybridCount = Math.ceil(hybrids.length * (secondary.blendStrength / 30));
      hybridClasses.push(...hybrids.slice(0, hybridCount));
    }
    
    // Also add some classes from the secondary genre based on blend strength
    const secondaryClasses = GENRE_DATA[secondary.genreId].classes;
    const secondaryCount = Math.ceil(secondaryClasses.length * (secondary.blendStrength / 60));
    hybridClasses.push(...secondaryClasses.slice(0, secondaryCount));
  }
  
  // Combine and dedupe by id
  const allClasses = [...primaryClasses, ...hybridClasses];
  const seen = new Set<string>();
  return allClasses.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

/**
 * Get blended backgrounds for a primary genre with secondary genres
 */
export function getBlendedBackgrounds(
  primaryGenre: GameGenre,
  secondaryGenres: SecondaryGenre[]
): CharacterBackground[] {
  // Start with primary genre backgrounds
  const primaryBackgrounds = [...GENRE_DATA[primaryGenre].backgrounds];
  
  // Add hybrid backgrounds for each secondary genre
  const hybridBackgrounds: CharacterBackground[] = [];
  for (const secondary of secondaryGenres) {
    const key = `${primaryGenre}-${secondary.genreId}`;
    const hybrids = HYBRID_BACKGROUND_MAP[key];
    if (hybrids) {
      const hybridCount = Math.ceil(hybrids.length * (secondary.blendStrength / 30));
      hybridBackgrounds.push(...hybrids.slice(0, hybridCount));
    }
    
    // Also add some backgrounds from the secondary genre
    const secondaryBackgrounds = GENRE_DATA[secondary.genreId].backgrounds;
    const secondaryCount = Math.ceil(secondaryBackgrounds.length * (secondary.blendStrength / 60));
    hybridBackgrounds.push(...secondaryBackgrounds.slice(0, secondaryCount));
  }
  
  // Combine and dedupe
  const allBackgrounds = [...primaryBackgrounds, ...hybridBackgrounds];
  const seen = new Set<string>();
  return allBackgrounds.filter(b => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

/**
 * Get blended traits for a primary genre with secondary genres
 */
export function getBlendedTraits(
  primaryGenre: GameGenre,
  secondaryGenres: SecondaryGenre[]
): string[] {
  const primaryTraits = [...GENRE_DATA[primaryGenre].traits];
  
  for (const secondary of secondaryGenres) {
    const secondaryTraits = GENRE_DATA[secondary.genreId].traits;
    const traitCount = Math.ceil(secondaryTraits.length * (secondary.blendStrength / 50));
    primaryTraits.push(...secondaryTraits.slice(0, traitCount));
  }
  
  // Dedupe
  return [...new Set(primaryTraits)];
}

/**
 * Get a complete blended genre data object
 */
export function getBlendedGenreData(
  primaryGenre: GameGenre,
  secondaryGenres: SecondaryGenre[]
): {
  classes: CharacterClass[];
  backgrounds: CharacterBackground[];
  traits: string[];
  hybridCount: number;
} {
  const classes = getBlendedClasses(primaryGenre, secondaryGenres);
  const backgrounds = getBlendedBackgrounds(primaryGenre, secondaryGenres);
  const traits = getBlendedTraits(primaryGenre, secondaryGenres);
  
  // Count how many hybrids were added
  const primaryClassCount = GENRE_DATA[primaryGenre].classes.length;
  const hybridCount = classes.length - primaryClassCount;
  
  return {
    classes,
    backgrounds,
    traits,
    hybridCount
  };
}

/**
 * Check if a hybrid class exists for a genre combination
 */
export function hasHybridContent(genre1: GameGenre, genre2: GameGenre): boolean {
  const key = `${genre1}-${genre2}`;
  return !!HYBRID_CLASS_MAP[key];
}

/**
 * Get all available hybrid classes for display
 */
export function getAllHybridClasses(): HybridClass[] {
  const allHybrids: HybridClass[] = [];
  const seen = new Set<string>();
  
  for (const classes of Object.values(HYBRID_CLASS_MAP)) {
    for (const cls of classes) {
      if (!seen.has(cls.id)) {
        allHybrids.push(cls);
        seen.add(cls.id);
      }
    }
  }
  
  return allHybrids;
}

/**
 * Format hybrid class for AI prompts
 */
export function formatHybridForPrompt(hybrid: HybridClass): string {
  return `${hybrid.name} (${hybrid.blendDescription}): ${hybrid.description}. Abilities: ${hybrid.abilities.join(', ')}. Style: ${hybrid.clothingStyle}.`;
}
