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

// Pirate + Horror hybrids (Ghost Ships!)
const PIRATE_HORROR_CLASSES: HybridClass[] = [
  {
    id: 'ghost_ship_captain',
    name: 'Cursed Captain',
    description: 'Doomed to sail forever, commanding a crew of the damned.',
    statBonuses: { charisma: 2, constitution: 1 },
    startingItems: ['Cursed Compass', 'Spectral Cutlass', 'Damned Crew Contract'],
    abilities: ['Summon Ghostly Crew', 'Death\'s Anchor', 'Curse Transfer'],
    portraitHints: ['skeletal features', 'rotting captain coat', 'glowing eyes', 'ghost ship'],
    clothingStyle: 'decaying captain uniform with spectral energy and barnacles',
    sourceGenres: ['pirate', 'horror'],
    blendDescription: 'Captains of the cursed seas'
  },
  {
    id: 'deep_one_caller',
    name: 'Deep One Caller',
    description: 'Communes with ancient horrors from the ocean depths.',
    statBonuses: { wisdom: 2, intelligence: 1 },
    startingItems: ['Eldritch Conch', 'Deep One Token', 'Waterlogged Tome'],
    abilities: ['Summon Tentacles', 'Breathe Underwater', 'Maddening Whispers'],
    portraitHints: ['fish-like features', 'webbed hands', 'deep sea bioluminescence', 'tentacle accessories'],
    clothingStyle: 'barnacle-encrusted robes with deep sea creature motifs',
    sourceGenres: ['pirate', 'horror'],
    blendDescription: 'Servants of the deep horrors'
  },
  {
    id: 'drowned_revenant',
    name: 'Drowned Revenant',
    description: 'Sailors who returned from a watery grave seeking vengeance.',
    statBonuses: { constitution: 2, strength: 1 },
    startingItems: ['Waterlogged Blade', 'Drowned Man\'s Rope', 'Vengeful Anchor'],
    abilities: ['Undead Resilience', 'Drown Touch', 'Salt Water Curse'],
    portraitHints: ['bloated appearance', 'seaweed hair', 'pale skin', 'dripping water'],
    clothingStyle: 'rotting sailor clothes constantly dripping seawater',
    sourceGenres: ['pirate', 'horror'],
    blendDescription: 'The vengeful drowned'
  }
];

// Western + Sci-Fi hybrids (Space Western!)
const WESTERN_SCIFI_CLASSES: HybridClass[] = [
  {
    id: 'frontier_marshal_stellar',
    name: 'Stellar Marshal',
    description: 'Brings law to the lawless frontier planets.',
    statBonuses: { charisma: 2, dexterity: 1 },
    startingItems: ['Star Badge', 'Plasma Sixgun', 'Hoversteed'],
    abilities: ['Frontier Justice', 'Quick Draw Protocol', 'Wanted Database'],
    portraitHints: ['space cowboy hat', 'futuristic star badge', 'energy holster', 'dusty spaceport'],
    clothingStyle: 'space-age cowboy gear with energy weapons and star badge',
    sourceGenres: ['western', 'scifi'],
    blendDescription: 'Law of the cosmic frontier'
  },
  {
    id: 'cattle_runner',
    name: 'Bio-Herd Wrangler',
    description: 'Herds genetically modified livestock across alien plains.',
    statBonuses: { wisdom: 2, constitution: 1 },
    startingItems: ['Hover Lasso', 'Gene Scanner', 'Alien Steed'],
    abilities: ['Animal Bond', 'Terrain Adapt', 'Herd Control'],
    portraitHints: ['weathered space rancher', 'alien livestock', 'frontier planet', 'modified animals'],
    clothingStyle: 'practical ranching gear adapted for alien environments',
    sourceGenres: ['western', 'scifi'],
    blendDescription: 'Cowboys of alien worlds'
  },
  {
    id: 'claim_jumper',
    name: 'Asteroid Prospector',
    description: 'Stakes claims on asteroid mining sites in the cosmic frontier.',
    statBonuses: { constitution: 2, intelligence: 1 },
    startingItems: ['Mining Claim Beacon', 'Plasma Pickaxe', 'Ore Detector'],
    abilities: ['Zero-G Mining', 'Claim Defense', 'Mineral Sense'],
    portraitHints: ['dusty space suit', 'mining equipment', 'asteroid belt', 'rugged pioneer'],
    clothingStyle: 'worn mining suit with prospecting equipment',
    sourceGenres: ['western', 'scifi'],
    blendDescription: 'Pioneers of the cosmic gold rush'
  }
];

// Fantasy + Mystery hybrids
const FANTASY_MYSTERY_CLASSES: HybridClass[] = [
  {
    id: 'arcane_investigator',
    name: 'Arcane Investigator',
    description: 'Uses magical abilities to solve crimes and uncover hidden truths.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Divination Crystal', 'Truth Rune', 'Enchanted Magnifying Glass'],
    abilities: ['Detect Magic', 'Truth Sense', 'Psychometry'],
    portraitHints: ['wizard detective', 'magical monocle', 'investigation robes', 'mystical clues'],
    clothingStyle: 'scholarly robes with detective accessories and magical tools',
    sourceGenres: ['fantasy', 'mystery'],
    blendDescription: 'Magical sleuths'
  },
  {
    id: 'spirit_medium_detective',
    name: 'Spirit Consul',
    description: 'Speaks with the dead to solve crimes and find the truth.',
    statBonuses: { wisdom: 2, charisma: 1 },
    startingItems: ['Séance Candles', 'Spirit Board', 'Ghost Lantern'],
    abilities: ['Speak with Dead', 'Spirit Witness', 'Ethereal Vision'],
    portraitHints: ['mystical appearance', 'ghostly aura', 'medium robes', 'spirit companions'],
    clothingStyle: 'flowing robes with spiritual symbols and ghost-attracting charms',
    sourceGenres: ['fantasy', 'mystery'],
    blendDescription: 'Detectives of the spirit world'
  },
  {
    id: 'curse_breaker_detective',
    name: 'Curse Detective',
    description: 'Investigates supernatural crimes and breaks ancient curses.',
    statBonuses: { intelligence: 2, constitution: 1 },
    startingItems: ['Curse Detector', 'Hex Breaker Kit', 'Ancient Bestiary'],
    abilities: ['Identify Curse', 'Ward Creation', 'Curse Trace'],
    portraitHints: ['protective wards', 'investigation tools', 'curse marks', 'scholarly mage'],
    clothingStyle: 'protective robes covered in ward symbols with investigation gear',
    sourceGenres: ['fantasy', 'mystery'],
    blendDescription: 'Investigators of the supernatural'
  }
];

// Cyberpunk + Pirate hybrids (Tech Pirates!)
const CYBERPUNK_PIRATE_CLASSES: HybridClass[] = [
  {
    id: 'data_corsair',
    name: 'Data Corsair',
    description: 'Raids corporate networks and steals valuable data from the digital seas.',
    statBonuses: { intelligence: 2, dexterity: 1 },
    startingItems: ['Pirate Deck', 'Data Harpoon', 'Stolen Credentials'],
    abilities: ['Network Raid', 'Data Plunder', 'Corporate Sabotage'],
    portraitHints: ['hacker pirate', 'cyberdeck with skull', 'neon eyepatch', 'data streams'],
    clothingStyle: 'street pirate gear with integrated hacking equipment',
    sourceGenres: ['cyberpunk', 'pirate'],
    blendDescription: 'Raiders of the digital seas'
  },
  {
    id: 'chrome_buccaneer',
    name: 'Chrome Buccaneer',
    description: 'Cybernetically enhanced pirate captain of a smuggling crew.',
    statBonuses: { strength: 2, charisma: 1 },
    startingItems: ['Monofilament Cutlass', 'Smuggler Ship Keys', 'Crew Contracts'],
    abilities: ['Boarding Action', 'Crew Command', 'Escape Protocol'],
    portraitHints: ['cyborg pirate', 'metal arm', 'captain swagger', 'neon tattoos'],
    clothingStyle: 'street captain coat with visible cybernetics and weapons',
    sourceGenres: ['cyberpunk', 'pirate'],
    blendDescription: 'Captains of the urban underworld'
  },
  {
    id: 'signal_privateer',
    name: 'Signal Privateer',
    description: 'Licensed by megacorps to raid competitor networks and shipments.',
    statBonuses: { intelligence: 2, charisma: 1 },
    startingItems: ['Letter of Marque (Corporate)', 'Signal Jammer', 'Encrypted Comms'],
    abilities: ['Corporate Immunity', 'Signal Hijack', 'Licensed Plunder'],
    portraitHints: ['corporate pirate', 'legitimate criminal', 'corporate badge', 'signal equipment'],
    clothingStyle: 'semi-corporate attire with pirate flair and signal equipment',
    sourceGenres: ['cyberpunk', 'pirate'],
    blendDescription: 'Corporate-sanctioned raiders'
  }
];

// Horror + Sci-Fi hybrids
const HORROR_SCIFI_CLASSES: HybridClass[] = [
  {
    id: 'xenomorph_hunter',
    name: 'Xenomorph Hunter',
    description: 'Specialized in tracking and eliminating alien threats.',
    statBonuses: { dexterity: 2, wisdom: 1 },
    startingItems: ['Motion Tracker', 'Pulse Rifle', 'Acid-Proof Armor'],
    abilities: ['Track Alien', 'Acid Resistance', 'Final Girl Luck'],
    portraitHints: ['space marine', 'motion tracker', 'acid burns', 'determined survivor'],
    clothingStyle: 'battle-worn space marine armor with xenomorph trophies',
    sourceGenres: ['horror', 'scifi'],
    blendDescription: 'Hunters of cosmic horrors'
  },
  {
    id: 'void_touched',
    name: 'Void-Touched',
    description: 'Exposed to the horrors of deep space, changed forever.',
    statBonuses: { wisdom: 2, constitution: 1 },
    startingItems: ['Void Shard', 'Sanity Meds', 'Cosmic Insight Journal'],
    abilities: ['Void Sight', 'Cosmic Whispers', 'Maddening Presence'],
    portraitHints: ['space-touched', 'starfield eyes', 'cosmic marks', 'haunted expression'],
    clothingStyle: 'damaged space suit with void corruption visible',
    sourceGenres: ['horror', 'scifi'],
    blendDescription: 'Those touched by cosmic horror'
  },
  {
    id: 'quarantine_officer',
    name: 'Quarantine Officer',
    description: 'Specialist in containing space-borne biological horrors.',
    statBonuses: { intelligence: 2, constitution: 1 },
    startingItems: ['Containment Suit', 'Bio Scanner', 'Quarantine Protocols'],
    abilities: ['Identify Pathogen', 'Containment Field', 'Immune Boost'],
    portraitHints: ['hazmat suit', 'bio scanner', 'sterile environment', 'cautious stance'],
    clothingStyle: 'advanced hazmat suit with bio-containment equipment',
    sourceGenres: ['horror', 'scifi'],
    blendDescription: 'First line against space plagues'
  }
];

// Post-Apocalyptic + Fantasy hybrids
const POSTAPOC_FANTASY_CLASSES: HybridClass[] = [
  {
    id: 'radiation_druid',
    name: 'Rad-Druid',
    description: 'Communes with mutated nature spirits in the wasteland.',
    statBonuses: { wisdom: 2, constitution: 1 },
    startingItems: ['Mutant Plant Staff', 'Rad-Water Blessing', 'Beast Totem'],
    abilities: ['Mutant Shapeshifting', 'Radiation Blessing', 'Nature\'s Wrath'],
    portraitHints: ['mutated nature priest', 'glowing plants', 'wasteland shaman', 'nature corruption'],
    clothingStyle: 'robes made of mutated plants with radiation glow',
    sourceGenres: ['postapoc', 'fantasy'],
    blendDescription: 'Shamans of the irradiated wild'
  },
  {
    id: 'ruin_mage',
    name: 'Ruin Mage',
    description: 'Draws magical power from the residual energy of the apocalypse.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Apocalypse Focus', 'Ruin Spellbook', 'Energy Siphon'],
    abilities: ['Channel Destruction', 'Ruin Sight', 'Apocalypse Echo'],
    portraitHints: ['wasteland wizard', 'ruined cityscape', 'energy channeling', 'apocalyptic power'],
    clothingStyle: 'patched wizard robes powered by apocalyptic energy',
    sourceGenres: ['postapoc', 'fantasy'],
    blendDescription: 'Mages of the broken world'
  },
  {
    id: 'beast_lord',
    name: 'Mutant Beast Lord',
    description: 'Commands loyalty of mutated creatures in the wasteland.',
    statBonuses: { charisma: 2, constitution: 1 },
    startingItems: ['Beast Whistle', 'Pack Leader Token', 'Mutant Companion'],
    abilities: ['Beast Command', 'Pack Bond', 'Mutant Empathy'],
    portraitHints: ['wasteland beast master', 'mutant animals', 'tribal appearance', 'alpha presence'],
    clothingStyle: 'tribal wasteland gear with mutant beast trophies',
    sourceGenres: ['postapoc', 'fantasy'],
    blendDescription: 'Masters of mutated beasts'
  }
];

// War + Fantasy hybrids
const WAR_FANTASY_CLASSES: HybridClass[] = [
  {
    id: 'battle_mage',
    name: 'Battle Mage',
    description: 'Military-trained wizard specializing in combat magic.',
    statBonuses: { intelligence: 2, strength: 1 },
    startingItems: ['War Staff', 'Military Spellbook', 'Battle Robes'],
    abilities: ['Artillery Magic', 'Shield Wall', 'Tactical Casting'],
    portraitHints: ['armored wizard', 'military bearing', 'combat spells', 'battlefield backdrop'],
    clothingStyle: 'armored wizard robes with military insignia',
    sourceGenres: ['war', 'fantasy'],
    blendDescription: 'Magic artillery of the battlefield'
  },
  {
    id: 'dragon_cavalry',
    name: 'Dragon Rider',
    description: 'Elite aerial cavalry bonded with trained war dragons.',
    statBonuses: { dexterity: 2, charisma: 1 },
    startingItems: ['Dragon Saddle', 'Lance of the Sky', 'Dragon Bond Token'],
    abilities: ['Aerial Combat', 'Dragon Bond', 'Dive Bomb'],
    portraitHints: ['dragon riding warrior', 'aerial armor', 'lance weapon', 'dragon companion'],
    clothingStyle: 'lightweight aerial combat armor designed for dragon riding',
    sourceGenres: ['war', 'fantasy'],
    blendDescription: 'Lords of the dragon wings'
  },
  {
    id: 'siege_enchanter',
    name: 'Siege Enchanter',
    description: 'Military engineer who enhances siege equipment with magic.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['Enchanting Tools', 'Siege Manual', 'Rune Components'],
    abilities: ['Enchant Siege', 'Fortify Position', 'Breach Ward'],
    portraitHints: ['military engineer', 'magical tools', 'siege equipment', 'fortifications'],
    clothingStyle: 'practical engineer clothes with magical enhancement tools',
    sourceGenres: ['war', 'fantasy'],
    blendDescription: 'Magical siege masters'
  }
];

// Modern Life + Horror hybrids
const MODERN_HORROR_CLASSES: HybridClass[] = [
  {
    id: 'paranormal_investigator',
    name: 'Paranormal Investigator',
    description: 'Uses modern technology to investigate supernatural occurrences.',
    statBonuses: { intelligence: 2, wisdom: 1 },
    startingItems: ['EMF Detector', 'Night Vision Camera', 'Research Database'],
    abilities: ['Spirit Detection', 'Evidence Analysis', 'Debunk or Confirm'],
    portraitHints: ['ghost hunter', 'investigation equipment', 'modern setting', 'paranormal evidence'],
    clothingStyle: 'casual investigation gear with technological equipment',
    sourceGenres: ['modern_life', 'horror'],
    blendDescription: 'Scientific ghost hunters'
  },
  {
    id: 'urban_occultist',
    name: 'Urban Occultist',
    description: 'Practices dark arts while maintaining a normal day job.',
    statBonuses: { wisdom: 2, charisma: 1 },
    startingItems: ['Hidden Altar', 'Occult App', 'Secret Grimoire'],
    abilities: ['Ritual Magic', 'Hide in Plain Sight', 'Summon Minor'],
    portraitHints: ['normal appearance', 'hidden occult symbols', 'double life', 'secret knowledge'],
    clothingStyle: 'normal business attire with hidden occult accessories',
    sourceGenres: ['modern_life', 'horror'],
    blendDescription: 'Everyday dark practitioners'
  },
  {
    id: 'crisis_counselor',
    name: 'Trauma Counselor',
    description: 'Helps survivors of supernatural events process their experiences.',
    statBonuses: { wisdom: 2, charisma: 1 },
    startingItems: ['Therapy Notes', 'Survivor Network', 'Coping Techniques'],
    abilities: ['Calm Mind', 'Trauma Bond', 'Support Network'],
    portraitHints: ['professional therapist', 'understanding expression', 'safe space', 'helping hand'],
    clothingStyle: 'professional therapy attire with calming presence',
    sourceGenres: ['modern_life', 'horror'],
    blendDescription: 'Healers of supernatural trauma'
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

// Pirate + Horror backgrounds
const PIRATE_HORROR_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'ghost_ship_survivor',
    name: 'Ghost Ship Survivor',
    description: 'You survived an encounter with a cursed vessel and bear its mark.',
    statBonuses: { constitution: 1 },
    startingItems: ['Cursed Coin', 'Ghost Compass'],
    skills: ['See the Dead', 'Curse Lore', 'Survivor\'s Luck'],
    sourceGenres: ['pirate', 'horror'],
    blendDescription: 'Marked by the damned'
  },
  {
    id: 'deep_cultist',
    name: 'Deep One Convert',
    description: 'You once worshipped the things beneath the waves.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Forbidden Idol', 'Deep One Mark'],
    skills: ['Eldritch Knowledge', 'Breathe Deep', 'Cultist Past'],
    sourceGenres: ['pirate', 'horror'],
    blendDescription: 'Those who heard the deep call'
  }
];

// Western + Sci-Fi backgrounds (Space Western)
const WESTERN_SCIFI_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'frontier_colonist',
    name: 'Frontier Planet Settler',
    description: 'Raised on a distant colony world with frontier values.',
    statBonuses: { constitution: 1 },
    startingItems: ['Colony Deed', 'Plasma Rifle'],
    skills: ['Pioneer Spirit', 'Alien Terrain', 'Self-Reliance'],
    sourceGenres: ['western', 'scifi'],
    blendDescription: 'Pioneers of new worlds'
  },
  {
    id: 'asteroid_miner_family',
    name: 'Mining Family Legacy',
    description: 'Your family has mined asteroids for generations.',
    statBonuses: { strength: 1 },
    startingItems: ['Family Claim', 'Prospector Tools'],
    skills: ['Ore Knowledge', 'Zero-G Native', 'Hard Work Ethic'],
    sourceGenres: ['western', 'scifi'],
    blendDescription: 'Born to the cosmic frontier'
  }
];

// Fantasy + Mystery backgrounds
const FANTASY_MYSTERY_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'mage_detective',
    name: 'Arcane Investigator Apprentice',
    description: 'Trained under a legendary magical detective.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Mentor\'s Notes', 'Scrying Focus'],
    skills: ['Magical Forensics', 'Deduction', 'Arcane Law'],
    sourceGenres: ['fantasy', 'mystery'],
    blendDescription: 'Students of magical justice'
  },
  {
    id: 'spirit_touched',
    name: 'Spirit-Touched Witness',
    description: 'The dead speak to you, revealing truths hidden from the living.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Spirit Bell', 'Death Shroud'],
    skills: ['Ghost Speak', 'Truth Sense', 'Medium\'s Burden'],
    sourceGenres: ['fantasy', 'mystery'],
    blendDescription: 'Voices of the departed'
  }
];

// Cyberpunk + Pirate backgrounds
const CYBERPUNK_PIRATE_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'data_smuggler',
    name: 'Data Smuggler',
    description: 'You ran illegal data across corporate borders.',
    statBonuses: { dexterity: 1 },
    startingItems: ['Hidden Data Port', 'Smuggler Contacts'],
    skills: ['Data Running', 'Border Evasion', 'Black Market'],
    sourceGenres: ['cyberpunk', 'pirate'],
    blendDescription: 'Runners of forbidden data'
  },
  {
    id: 'neon_pirate_crew',
    name: 'Street Crew Member',
    description: 'Part of a notorious street gang that operates like pirates.',
    statBonuses: { charisma: 1 },
    startingItems: ['Crew Tattoo', 'Territory Map'],
    skills: ['Crew Loyalty', 'Street Code', 'Turf Knowledge'],
    sourceGenres: ['cyberpunk', 'pirate'],
    blendDescription: 'Urban buccaneers'
  }
];

// Horror + Sci-Fi backgrounds
const HORROR_SCIFI_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'colony_survivor',
    name: 'Colony Massacre Survivor',
    description: 'You survived when something killed everyone else on your colony.',
    statBonuses: { constitution: 1 },
    startingItems: ['Distress Beacon', 'Survivor\'s Guilt'],
    skills: ['Trauma Hardened', 'Alien Recognition', 'Lone Survivor'],
    sourceGenres: ['horror', 'scifi'],
    blendDescription: 'The ones who got away'
  },
  {
    id: 'void_exposed',
    name: 'Void-Exposed',
    description: 'You saw something in deep space that changed you forever.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Cosmic Fragment', 'Sanity Anchor'],
    skills: ['Void Sight', 'Cosmic Whispers', 'Touched by Stars'],
    sourceGenres: ['horror', 'scifi'],
    blendDescription: 'Those who glimpsed beyond'
  }
];

// Post-Apocalyptic + Fantasy backgrounds
const POSTAPOC_FANTASY_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'mutation_shaman',
    name: 'Mutation Tribe Shaman',
    description: 'Your tribe reveres mutations as magical gifts.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Mutation Totem', 'Rad-Blessing'],
    skills: ['Mutation Lore', 'Tribal Magic', 'Wasteland Spirits'],
    sourceGenres: ['postapoc', 'fantasy'],
    blendDescription: 'Shamans of the changed world'
  },
  {
    id: 'ruin_seeker',
    name: 'Ruin Temple Pilgrim',
    description: 'You worship the power that ended the old world.',
    statBonuses: { constitution: 1 },
    startingItems: ['Apocalypse Relic', 'Temple Teachings'],
    skills: ['Ruin Navigation', 'Old World Reverence', 'Radiation Resistance'],
    sourceGenres: ['postapoc', 'fantasy'],
    blendDescription: 'Seekers of apocalyptic power'
  }
];

// War + Fantasy backgrounds
const WAR_FANTASY_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'battle_mage_corps',
    name: 'Battle Mage Corps Veteran',
    description: 'Served in a military unit of combat wizards.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Corps Medal', 'Battle Spellbook'],
    skills: ['Military Magic', 'Unit Tactics', 'Battlefield Casting'],
    sourceGenres: ['war', 'fantasy'],
    blendDescription: 'Veterans of magical warfare'
  },
  {
    id: 'dragon_cavalry_rider',
    name: 'Dragon Corps Initiate',
    description: 'Trained from youth to bond with war dragons.',
    statBonuses: { charisma: 1 },
    startingItems: ['Dragon Scale Token', 'Rider\'s Goggles'],
    skills: ['Dragon Bond', 'Aerial Combat', 'Beast Empathy'],
    sourceGenres: ['war', 'fantasy'],
    blendDescription: 'Born to ride dragons'
  }
];

// Modern Life + Horror backgrounds
const MODERN_HORROR_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'haunted_house_survivor',
    name: 'Haunting Survivor',
    description: 'You lived in a haunted house and barely escaped with your sanity.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Protective Charm', 'Haunting Photos'],
    skills: ['Sense Presence', 'Resist Fear', 'Ghost Lore'],
    sourceGenres: ['modern_life', 'horror'],
    blendDescription: 'Those who survived the haunting'
  },
  {
    id: 'occult_family',
    name: 'Occult Family Legacy',
    description: 'Your family has always known about the supernatural.',
    statBonuses: { intelligence: 1 },
    startingItems: ['Family Grimoire', 'Warding Ring'],
    skills: ['Occult Knowledge', 'Family Secrets', 'Hidden World'],
    sourceGenres: ['modern_life', 'horror'],
    blendDescription: 'Keepers of dark family secrets'
  }
];

// Horror + Post-Apocalyptic backgrounds
const HORROR_POSTAPOC_BACKGROUNDS: HybridBackground[] = [
  {
    id: 'infected_survivor',
    name: 'Infection Survivor',
    description: 'You carry the mark of the plague that ended civilization.',
    statBonuses: { constitution: 1 },
    startingItems: ['Immunity Proof', 'Infection Scars'],
    skills: ['Disease Knowledge', 'Infected Empathy', 'Survivor Network'],
    sourceGenres: ['horror', 'postapoc'],
    blendDescription: 'Marked by the plague'
  },
  {
    id: 'cult_escapee',
    name: 'Doomsday Cult Escapee',
    description: 'You escaped a cult that worships the apocalypse.',
    statBonuses: { wisdom: 1 },
    startingItems: ['Cult Brand', 'Deprogramming Notes'],
    skills: ['Cult Recognition', 'Manipulation Resistance', 'Hidden Lore'],
    sourceGenres: ['horror', 'postapoc'],
    blendDescription: 'Those who broke free'
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
  'scifi-western': [...SCIFI_WESTERN_CLASSES, ...WESTERN_SCIFI_CLASSES],
  'western-scifi': [...SCIFI_WESTERN_CLASSES, ...WESTERN_SCIFI_CLASSES],
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
  // NEW HYBRID COMBINATIONS
  'pirate-horror': PIRATE_HORROR_CLASSES,
  'horror-pirate': PIRATE_HORROR_CLASSES,
  'fantasy-mystery': FANTASY_MYSTERY_CLASSES,
  'mystery-fantasy': FANTASY_MYSTERY_CLASSES,
  'cyberpunk-pirate': CYBERPUNK_PIRATE_CLASSES,
  'pirate-cyberpunk': CYBERPUNK_PIRATE_CLASSES,
  'horror-scifi': HORROR_SCIFI_CLASSES,
  'scifi-horror': HORROR_SCIFI_CLASSES,
  'postapoc-fantasy': POSTAPOC_FANTASY_CLASSES,
  'fantasy-postapoc': POSTAPOC_FANTASY_CLASSES,
  'war-fantasy': WAR_FANTASY_CLASSES,
  'fantasy-war': WAR_FANTASY_CLASSES,
  'modern_life-horror': MODERN_HORROR_CLASSES,
  'horror-modern_life': MODERN_HORROR_CLASSES,
};

const HYBRID_BACKGROUND_MAP: Record<string, HybridBackground[]> = {
  'fantasy-scifi': FANTASY_SCIFI_BACKGROUNDS,
  'scifi-fantasy': FANTASY_SCIFI_BACKGROUNDS,
  'western-fantasy': WESTERN_FANTASY_BACKGROUNDS,
  'fantasy-western': WESTERN_FANTASY_BACKGROUNDS,
  'cyberpunk-horror': CYBERPUNK_HORROR_BACKGROUNDS,
  'horror-cyberpunk': CYBERPUNK_HORROR_BACKGROUNDS,
  // NEW HYBRID BACKGROUNDS
  'pirate-horror': PIRATE_HORROR_BACKGROUNDS,
  'horror-pirate': PIRATE_HORROR_BACKGROUNDS,
  'western-scifi': WESTERN_SCIFI_BACKGROUNDS,
  'scifi-western': WESTERN_SCIFI_BACKGROUNDS,
  'fantasy-mystery': FANTASY_MYSTERY_BACKGROUNDS,
  'mystery-fantasy': FANTASY_MYSTERY_BACKGROUNDS,
  'cyberpunk-pirate': CYBERPUNK_PIRATE_BACKGROUNDS,
  'pirate-cyberpunk': CYBERPUNK_PIRATE_BACKGROUNDS,
  'horror-scifi': HORROR_SCIFI_BACKGROUNDS,
  'scifi-horror': HORROR_SCIFI_BACKGROUNDS,
  'postapoc-fantasy': POSTAPOC_FANTASY_BACKGROUNDS,
  'fantasy-postapoc': POSTAPOC_FANTASY_BACKGROUNDS,
  'war-fantasy': WAR_FANTASY_BACKGROUNDS,
  'fantasy-war': WAR_FANTASY_BACKGROUNDS,
  'modern_life-horror': MODERN_HORROR_BACKGROUNDS,
  'horror-modern_life': MODERN_HORROR_BACKGROUNDS,
  'horror-postapoc': HORROR_POSTAPOC_BACKGROUNDS,
  'postapoc-horror': HORROR_POSTAPOC_BACKGROUNDS,
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

// ============================================
// HYBRID TRAIT DEFINITIONS
// Special narrative-hook traits for blended genres
// ============================================

export interface HybridTrait {
  id: string;
  name: string;
  description: string;
  narrativeHook: string; // Special story hook this trait unlocks
  sourceGenres: [GameGenre, GameGenre];
}

const HYBRID_TRAITS: Record<string, HybridTrait[]> = {
  'fantasy-scifi': [
    { id: 'techno_mystic', name: 'Techno-Mystic', description: 'You sense the arcane in technology', narrativeHook: 'Can detect magical signatures in tech devices', sourceGenres: ['fantasy', 'scifi'] },
    { id: 'dual_power_wielder', name: 'Dual Power Wielder', description: 'Channel both magic and technology', narrativeHook: 'May combine spell effects with tech abilities', sourceGenres: ['fantasy', 'scifi'] },
  ],
  'pirate-horror': [
    { id: 'sea_cursed', name: 'Sea-Cursed', description: 'The ocean marked you with its darkness', narrativeHook: 'Ghosts of drowned sailors whisper secrets to you', sourceGenres: ['pirate', 'horror'] },
    { id: 'deep_touched', name: 'Deep-Touched', description: 'Something from the abyss left its mark', narrativeHook: 'Can sense deep one presence and understand their whispers', sourceGenres: ['pirate', 'horror'] },
  ],
  'western-scifi': [
    { id: 'frontier_born', name: 'Frontier Born', description: 'The cosmic frontier runs in your blood', narrativeHook: 'Gain bonus insights when exploring uncharted planets', sourceGenres: ['western', 'scifi'] },
    { id: 'star_wanderer', name: 'Star Wanderer', description: 'No planet holds you for long', narrativeHook: 'Always know the fastest routes between settlements', sourceGenres: ['western', 'scifi'] },
  ],
  'fantasy-mystery': [
    { id: 'truth_seer', name: 'Truth Seer', description: 'Magic reveals hidden truths to you', narrativeHook: 'Can detect lies through magical means once per scene', sourceGenres: ['fantasy', 'mystery'] },
    { id: 'ghost_witness', name: 'Ghost Witness', description: 'The dead share their final moments with you', narrativeHook: 'May question spirits about events they witnessed', sourceGenres: ['fantasy', 'mystery'] },
  ],
  'cyberpunk-pirate': [
    { id: 'data_corsair', name: 'Data Corsair', description: 'You raid the digital seas', narrativeHook: 'Can identify valuable data targets in any network', sourceGenres: ['cyberpunk', 'pirate'] },
    { id: 'street_captain', name: 'Street Captain', description: 'Command loyalty from the urban underworld', narrativeHook: 'Can recruit temporary crew members in any city', sourceGenres: ['cyberpunk', 'pirate'] },
  ],
  'horror-scifi': [
    { id: 'void_touched', name: 'Void-Touched', description: 'Something in space changed you', narrativeHook: 'Can sense when cosmic horrors are near', sourceGenres: ['horror', 'scifi'] },
    { id: 'survivor_instinct', name: 'Survivor Instinct', description: 'You know when death is coming', narrativeHook: 'Get warning flashes before lethal dangers', sourceGenres: ['horror', 'scifi'] },
  ],
  'postapoc-fantasy': [
    { id: 'mutation_blessed', name: 'Mutation Blessed', description: 'Your changes are gifts, not curses', narrativeHook: 'Mutations grant minor supernatural abilities', sourceGenres: ['postapoc', 'fantasy'] },
    { id: 'ruin_speaker', name: 'Ruin Speaker', description: 'The destroyed places speak to you', narrativeHook: 'Sense the history and secrets of ruined locations', sourceGenres: ['postapoc', 'fantasy'] },
  ],
  'war-fantasy': [
    { id: 'battle_touched', name: 'Battle-Touched', description: 'War magic flows through your veins', narrativeHook: 'Combat abilities become enhanced during mass battles', sourceGenres: ['war', 'fantasy'] },
    { id: 'commander_aura', name: 'Commander Aura', description: 'Others follow your lead naturally', narrativeHook: 'Can inspire troops to fight beyond normal limits', sourceGenres: ['war', 'fantasy'] },
  ],
  'modern_life-horror': [
    { id: 'mundane_ward', name: 'Mundane Ward', description: 'Your ordinary life protects you', narrativeHook: 'Supernatural entities find it harder to target you at home', sourceGenres: ['modern_life', 'horror'] },
    { id: 'hidden_sight', name: 'Hidden Sight', description: 'You see what others refuse to notice', narrativeHook: 'Spot supernatural influences disguised as normal events', sourceGenres: ['modern_life', 'horror'] },
  ],
  'cyberpunk-horror': [
    { id: 'digital_medium', name: 'Digital Medium', description: 'Ghosts speak through your implants', narrativeHook: 'Can communicate with digital spirits and AI echoes', sourceGenres: ['cyberpunk', 'horror'] },
    { id: 'chrome_corrupted', name: 'Chrome Corrupted', description: 'Your cybernetics attract dark entities', narrativeHook: 'Can trap malevolent digital beings in your hardware', sourceGenres: ['cyberpunk', 'horror'] },
  ],
  'fantasy-horror': [
    { id: 'dark_touched', name: 'Dark-Touched', description: 'Darkness recognizes one of its own', narrativeHook: 'Monsters may hesitate before attacking you', sourceGenres: ['fantasy', 'horror'] },
    { id: 'curse_bearer', name: 'Curse Bearer', description: 'You carry an ancient curse', narrativeHook: 'Can transfer curse effects to willing or unwilling targets', sourceGenres: ['fantasy', 'horror'] },
  ],
  'horror-postapoc': [
    { id: 'plague_touched', name: 'Plague-Touched', description: 'The infection changed but didn\'t kill you', narrativeHook: 'Infected creatures treat you as one of their own', sourceGenres: ['horror', 'postapoc'] },
    { id: 'end_watcher', name: 'End Watcher', description: 'You\'ve seen how worlds die', narrativeHook: 'Can predict disasters moments before they happen', sourceGenres: ['horror', 'postapoc'] },
  ],
};

/**
 * Get hybrid traits for a genre combination
 */
export function getHybridTraits(
  primaryGenre: GameGenre,
  secondaryGenres: SecondaryGenre[]
): HybridTrait[] {
  const hybridTraits: HybridTrait[] = [];
  
  for (const secondary of secondaryGenres) {
    const key = `${primaryGenre}-${secondary.genreId}`;
    const reverseKey = `${secondary.genreId}-${primaryGenre}`;
    
    const traits = HYBRID_TRAITS[key] || HYBRID_TRAITS[reverseKey];
    if (traits) {
      // Add more traits based on blend strength
      const traitCount = secondary.blendStrength >= 20 ? traits.length : 1;
      hybridTraits.push(...traits.slice(0, traitCount));
    }
  }
  
  return hybridTraits;
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
