// ============================================================================
// NPC NAME WHITELIST - Pre-approved character names per genre
// These names are whitelisted and will always be recognized as valid NPCs
// 50 names per genre, designed to interweave across storylines
// ============================================================================

import { GameGenre } from '@/types/genreData';

// ============================================================================
// FANTASY WHITELISTED NAMES (50)
// ============================================================================

export const FANTASY_WHITELIST = new Set([
  // Elven nobility & warriors
  'Aerendyl', 'Thandril', 'Elowen', 'Galanor', 'Sylvara',
  'Caelindra', 'Lorien', 'Faelith', 'Vaeris', 'Ithilwen',
  
  // Human knights & nobles
  'Aldric', 'Gareth', 'Brienne', 'Lucian', 'Seraphina',
  'Percival', 'Gwendolyn', 'Theron', 'Isolde', 'Roland',
  
  // Dwarven crafters & warriors
  'Thorin', 'Gimrik', 'Disa', 'Borin', 'Helga',
  'Thrain', 'Bruna', 'Durin', 'Sigrid', 'Fundin',
  
  // Mages & mystics
  'Alaric', 'Morgana', 'Merlin', 'Circe', 'Balthazar',
  'Nimue', 'Corvinus', 'Selene', 'Zephyrus', 'Ariadne',
  
  // Rogues & rangers
  'Kael', 'Lyanna', 'Fenris', 'Astrid', 'Silas',
  'Rowena', 'Grimm', 'Ylva', 'Dorian', 'Freya',
]);

// ============================================================================
// SCIFI / CYBERPUNK WHITELISTED NAMES (50)
// ============================================================================

export const SCIFI_WHITELIST = new Set([
  // Corporate executives & scientists
  'Viktor', 'Elara', 'Cyrus', 'Nova', 'Maxim',
  'Aurora', 'Zane', 'Stella', 'Dex', 'Genesis',
  
// Hackers & netrunners (avoiding common words like Static, Glitch, Neon)
  'Cipher', 'Neuromancer', 'Jackpoint', 'Pixel', 'Vector',
  'Hexcode', 'Chromatic', 'Razorgirl', 'Zerotrace', 'Datastream',
  
  // Military & security
  'Riker', 'Ripley', 'Phoenix', 'Viper', 'Ghost',
  'Hawk', 'Striker', 'Valkyrie', 'Reaper', 'Shadow',
  
  // Asian-inspired characters
  'Akira', 'Sakura', 'Kenji', 'Mei', 'Hiroshi',
  'Yuki', 'Takeshi', 'Hana', 'Ryu', 'Kaori',
  
  // Slavic-inspired characters
  'Natasha', 'Dimitri', 'Katya', 'Nikolai', 'Yelena',
  'Aleksei', 'Irina', 'Sergei', 'Olga', 'Vladimir',
]);

// ============================================================================
// NOIR / MYSTERY WHITELISTED NAMES (50)
// ============================================================================

export const NOIR_WHITELIST = new Set([
  // Detectives & investigators
  'Marlowe', 'Spade', 'Archer', 'Cross', 'Steele',
  'Bishop', 'Drake', 'Wolfe', 'Stone', 'Cole',
  
  // Femme fatales & dames
  'Veronica', 'Vivian', 'Carmen', 'Lana', 'Scarlett',
  'Gloria', 'Evelyn', 'Rita', 'Ivy', 'Ruby',
  
  // Mob figures & criminals
  'Vinnie', 'Sal', 'Tony', 'Mickey', 'Frankie',
  'Eddie', 'Lou', 'Paulie', 'Rico', 'Dante',
  
  // Society & upper class
  'Victoria', 'Reginald', 'Anastasia', 'Montgomery', 'Constance',
  'Hamilton', 'Cordelia', 'Sterling', 'Beatrice', 'Archibald',
  
  // Cops & officials
  'Detective', 'O\'Brien', 'Sullivan', 'Malone', 'Brennan',
  'McCarthy', 'Murphy', 'Kelly', 'Flynn', 'Donovan',
]);

// ============================================================================
// WESTERN WHITELISTED NAMES (50)
// ============================================================================

export const WESTERN_WHITELIST = new Set([
  // Lawmen & marshals
  'Wyatt', 'Virgil', 'Doc', 'Bat', 'Wild',
  'Hickok', 'Earp', 'Garrett', 'Masterson', 'Dalton',
  
  // Outlaws & bandits
  'Jesse', 'Billy', 'Butch', 'Sundance', 'Cole',
  'Cassidy', 'Bonnie', 'Belle', 'Starr', 'Younger',
  
  // Ranchers & cowboys
  'Buck', 'Colt', 'Duke', 'Hank', 'Maverick',
  'Tex', 'Rusty', 'Slim', 'Red', 'Jeb',
  
  // Spanish/Mexican influence
  'Diego', 'Esperanza', 'Rafael', 'Catalina', 'Santiago',
  'Isabella', 'Fernando', 'Lucia', 'Emilio', 'Valencia',
  
  // Frontier settlers
  'Clementine', 'Adelaide', 'Josephine', 'Eliza', 'Martha',
  'Abigail', 'Prudence', 'Sadie', 'Pearl', 'Clara',
]);

// ============================================================================
// HORROR WHITELISTED NAMES (50)
// ============================================================================

export const HORROR_WHITELIST = new Set([
  // Gothic aristocracy
  'Damien', 'Carmilla', 'Dorian', 'Lenore', 'Lestat',
  'Marius', 'Selene', 'Vlad', 'Drusilla', 'Mordecai',
  
  // Occultists & witches
  'Aleister', 'Lilith', 'Crowley', 'Hecate', 'Solomon',
  'Morgana', 'Rasputin', 'Circe', 'Nostradamus', 'Sybil',
  
  // Creepy townsfolk
  'Ezekiel', 'Prudence', 'Ichabod', 'Temperance', 'Obadiah',
  'Hester', 'Cornelius', 'Winifred', 'Silas', 'Griselda',
  
  // Supernatural entities
  'Azrael', 'Lamia', 'Abaddon', 'Medusa', 'Belial',
  'Persephone', 'Baphomet', 'Kali', 'Thanatos', 'Pandora',
  
  // Modern horror
  'Norman', 'Clarice', 'Hannibal', 'Regan', 'Samara',
  'Dexter', 'Wednesday', 'Annabelle', 'Carrie', 'Esther',
]);

// ============================================================================
// MODERN LIFE WHITELISTED NAMES (50)
// ============================================================================

export const MODERN_WHITELIST = new Set([
  // Professional / corporate
  'Marcus', 'Victoria', 'Jonathan', 'Elizabeth', 'Bradley',
  'Catherine', 'Gregory', 'Amanda', 'Kenneth', 'Patricia',
  
  // Young professionals
  'Aiden', 'Sophia', 'Ethan', 'Olivia', 'Mason',
  'Emma', 'Logan', 'Ava', 'Lucas', 'Isabella',
  
  // Diverse backgrounds
  'Raj', 'Priya', 'Jamal', 'Aisha', 'Wei',
  'Mei-Lin', 'Hassan', 'Fatima', 'Carlos', 'Elena',
  
  // Blue collar & service
  'Frank', 'Diane', 'Tony', 'Linda', 'Mike',
  'Barbara', 'Steve', 'Nancy', 'Bill', 'Susan',
  
  // Artists & creatives
  'Sebastian', 'Scarlett', 'Felix', 'Luna', 'Oscar',
  'Violet', 'Hugo', 'Aurora', 'Jasper', 'Ivy',
]);

// ============================================================================
// WAR / MILITARY WHITELISTED NAMES (50)
// ============================================================================

export const WAR_WHITELIST = new Set([
  // Officers & commanders
  'Sterling', 'Mackenzie', 'Barrett', 'Crawford', 'Reynolds',
  'Montgomery', 'Wellington', 'Patton', 'MacArthur', 'Eisenhower',
  
  // Enlisted & NCOs
  'Kowalski', 'Schmidt', 'Jackson', 'Williams', 'Johnson',
  'Martinez', 'Thompson', 'Garcia', 'Anderson', 'Wilson',
  
  // Callsigns & nicknames
  'Maverick', 'Goose', 'Iceman', 'Viper', 'Phoenix',
  'Reaper', 'Ghost', 'Hawk', 'Wolf', 'Blaze',
  
  // WWII era
  'Walter', 'Dorothy', 'Harold', 'Evelyn', 'Raymond',
  'Margaret', 'Albert', 'Ruth', 'Eugene', 'Betty',
  
  // Vietnam era
  'Jimmy', 'Peggy', 'Bobby', 'Gloria', 'Danny',
  'Sharon', 'Kenny', 'Debra', 'Terry', 'Donna',
]);

// ============================================================================
// PIRATE / NAUTICAL WHITELISTED NAMES (50)
// ============================================================================

export const PIRATE_WHITELIST = new Set([
  // Famous pirates (historical)
  'Blackbeard', 'Morgan', 'Kidd', 'Rackham', 'Bonny',
  'Read', 'Teach', 'Flint', 'Silver', 'Barbossa',
  
  // Ship captains
  'Bartholomew', 'Stede', 'Calico', 'Redbeard', 'Ironhook',
  'Cutlass', 'Bones', 'Sparrow', 'Davy', 'Jolly',
  
  // Crew members
  'Scurvy', 'Patches', 'Barnacle', 'Crow', 'Anchor',
  'Reef', 'Tide', 'Gale', 'Storm', 'Wave',
  
  // Caribbean influence
  'Catalina', 'Salvador', 'Marisol', 'Gonzalo', 'Rosita',
  'Hernando', 'Paloma', 'Diego', 'Valentina', 'Fernando',
  
  // Port town characters
  'Pearl', 'Coral', 'Marina', 'Oceana', 'Ariel',
  'Tempest', 'Siren', 'Cove', 'Harbor', 'Isle',
]);

// ============================================================================
// POST-APOCALYPTIC WHITELISTED NAMES (50)
// ============================================================================

export const POSTAPOC_WHITELIST = new Set([
  // Survivors & scavengers
  'Ash', 'Rust', 'Ember', 'Cinder', 'Dust',
  'Flint', 'Shale', 'Char', 'Soot', 'Ruin',
  
  // Faction leaders
  'Warlord', 'Prophet', 'Overseer', 'Elder', 'Chieftain',
  'Rex', 'Khan', 'Duke', 'Baron', 'Matriarch',
  
  // Tech & engineers
  'Gear', 'Bolt', 'Spark', 'Wire', 'Fuse',
  'Amp', 'Circuit', 'Diesel', 'Chrome', 'Piston',
  
  // Raiders & wastelanders
  'Razor', 'Bone', 'Fang', 'Thorn', 'Venom',
  'Skull', 'Scar', 'Wraith', 'Havoc', 'Chaos',
  
  // Remnants of old world
  'Grace', 'Hope', 'Faith', 'Haven', 'Eden',
  'Phoenix', 'Genesis', 'Trinity', 'Providence', 'Sanctuary',
]);

// ============================================================================
// CROSS-GENRE RECURRING CHARACTERS (Names that appear across multiple genres)
// ============================================================================

export const CROSSOVER_WHITELIST = new Set([
  // Universal archetypes
  'Phoenix', 'Shadow', 'Raven', 'Storm', 'Ghost',
  'Hawk', 'Wolf', 'Viper', 'Hunter', 'Reaper',
  
  // Names that transcend genres
  'Morgan', 'Cross', 'Drake', 'Stone', 'Cole',
  'Quinn', 'Blake', 'Riley', 'Jordan', 'Avery',
  
  // Mysterious figures
  'Cipher', 'Oracle', 'Prophet', 'Sage', 'Seer',
  'Watcher', 'Keeper', 'Guardian', 'Wanderer', 'Stranger',
]);

// ============================================================================
// MASTER WHITELIST - Combined set of all names
// ============================================================================

export const MASTER_NPC_WHITELIST = new Set([
  ...FANTASY_WHITELIST,
  ...SCIFI_WHITELIST,
  ...NOIR_WHITELIST,
  ...WESTERN_WHITELIST,
  ...HORROR_WHITELIST,
  ...MODERN_WHITELIST,
  ...WAR_WHITELIST,
  ...PIRATE_WHITELIST,
  ...POSTAPOC_WHITELIST,
  ...CROSSOVER_WHITELIST,
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the whitelist for a specific genre
 */
export function getGenreWhitelist(genre: GameGenre): Set<string> {
  const genreKey = genre.toLowerCase();
  
  switch (genreKey) {
    case 'fantasy':
    case 'high_fantasy':
    case 'dark_fantasy':
      return FANTASY_WHITELIST;
    
    case 'scifi':
    case 'cyberpunk':
    case 'space_opera':
      return SCIFI_WHITELIST;
    
    case 'noir':
    case 'mystery':
    case 'thriller':
      return NOIR_WHITELIST;
    
    case 'western':
    case 'frontier':
      return WESTERN_WHITELIST;
    
    case 'horror':
    case 'cosmic_horror':
    case 'gothic':
      return HORROR_WHITELIST;
    
    case 'modern_life':
    case 'contemporary':
    case 'slice_of_life':
      return MODERN_WHITELIST;
    
    case 'war':
    case 'military':
      return WAR_WHITELIST;
    
    case 'pirate':
    case 'nautical':
    case 'swashbuckler':
      return PIRATE_WHITELIST;
    
    case 'postapoc':
    case 'post_apocalyptic':
    case 'wasteland':
      return POSTAPOC_WHITELIST;
    
    default:
      return MODERN_WHITELIST;
  }
}

/**
 * Check if a name is whitelisted (case-insensitive)
 */
export function isWhitelistedName(name: string): boolean {
  // Check exact match first
  if (MASTER_NPC_WHITELIST.has(name)) return true;
  
  // Check case-insensitive
  const lowerName = name.toLowerCase();
  for (const whitelisted of MASTER_NPC_WHITELIST) {
    if (whitelisted.toLowerCase() === lowerName) return true;
  }
  
  return false;
}

/**
 * Check if a name is whitelisted for a specific genre
 */
export function isWhitelistedForGenre(name: string, genre: GameGenre): boolean {
  const genreWhitelist = getGenreWhitelist(genre);
  
  // Check exact match first
  if (genreWhitelist.has(name)) return true;
  
  // Check case-insensitive
  const lowerName = name.toLowerCase();
  for (const whitelisted of genreWhitelist) {
    if (whitelisted.toLowerCase() === lowerName) return true;
  }
  
  // Also check crossover names
  for (const whitelisted of CROSSOVER_WHITELIST) {
    if (whitelisted.toLowerCase() === lowerName) return true;
  }
  
  return false;
}

/**
 * Get a random whitelisted name for a genre
 */
export function getRandomWhitelistedName(genre: GameGenre): string {
  const whitelist = getGenreWhitelist(genre);
  const names = Array.from(whitelist);
  return names[Math.floor(Math.random() * names.length)];
}
