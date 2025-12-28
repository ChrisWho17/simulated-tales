// ============================================================================
// NPC NAME GENERATOR - Genre-appropriate name database
// Thousands of names organized by gender, genre, and cultural background
// ============================================================================

import { GameGenre } from '@/types/genreData';

export type Gender = 'male' | 'female' | 'neutral';

// ============================================================================
// FANTASY NAMES
// ============================================================================

const FANTASY_MALE = [
  // Common fantasy
  'Aldric', 'Baelin', 'Cedric', 'Darius', 'Edmund', 'Faelan', 'Gareth', 'Hadrian',
  'Ivar', 'Jareth', 'Kael', 'Lucian', 'Magnus', 'Neron', 'Orion', 'Percival',
  'Quinn', 'Roland', 'Silas', 'Theron', 'Ulric', 'Varian', 'Wystan', 'Xavier',
  'Yorick', 'Zephyr', 'Alaric', 'Bastian', 'Caspian', 'Dorian', 'Evander',
  // Elven-inspired
  'Aelindor', 'Caelum', 'Eldrin', 'Faelith', 'Galanor', 'Ithilion', 'Lorien',
  'Meliorn', 'Nimrodel', 'Orindir', 'Silvan', 'Thandril', 'Vaeris', 'Aerendyl',
  // Dwarven-inspired
  'Thorin', 'Balin', 'Dwalin', 'Gimrik', 'Borin', 'Gloin', 'Nori', 'Bombur',
  'Durin', 'Thrain', 'Fundin', 'Oin', 'Farin', 'Gror', 'Nain', 'Dain',
  // Noble/knightly
  'Alistair', 'Benedict', 'Constantine', 'Frederick', 'Geoffrey', 'Heinrich',
  'Leopold', 'Maximilian', 'Reginald', 'Sebastian', 'Theobald', 'Wolfgang',
  // Barbarian/tribal
  'Bjorn', 'Fenrir', 'Grimm', 'Hrothgar', 'Ragnar', 'Sigurd', 'Thorgrim',
  'Ulfric', 'Wulfgar', 'Yngvar', 'Korgan', 'Drogan', 'Varok', 'Grom',
];

const FANTASY_FEMALE = [
  // Common fantasy
  'Aelara', 'Brienne', 'Celeste', 'Dahlia', 'Elara', 'Freya', 'Gwendolyn',
  'Helena', 'Isolde', 'Jasmine', 'Katarina', 'Lyanna', 'Morgana', 'Nephele',
  'Ophelia', 'Persephone', 'Rowena', 'Seraphina', 'Theodora', 'Ursula',
  'Valentina', 'Willa', 'Xanthe', 'Yvaine', 'Zelda', 'Arianna', 'Beatrix',
  // Elven-inspired
  'Aelindra', 'Caelia', 'Elowen', 'Faelwen', 'Galadriel', 'Ithilwen', 'Lorelei',
  'Melisande', 'Nimue', 'Oriana', 'Sylvana', 'Thalassa', 'Vaeloria', 'Aeris',
  // Dwarven-inspired  
  'Disa', 'Gimli', 'Hilda', 'Thora', 'Bruna', 'Helga', 'Sigrid', 'Frida',
  // Noble/royal
  'Adelaide', 'Cordelia', 'Eleanor', 'Guinevere', 'Isabelle', 'Marguerite',
  'Rosalind', 'Victoria', 'Arabella', 'Cressida', 'Evangeline', 'Josephine',
  // Warrior
  'Artemis', 'Brynhildr', 'Cassandra', 'Diana', 'Eowyn', 'Freyja', 'Sigyn',
  'Valkyrie', 'Astrid', 'Ingrid', 'Sif', 'Thyra', 'Ragna', 'Ylva',
];

// ============================================================================
// SCIFI / CYBERPUNK NAMES
// ============================================================================

const SCIFI_MALE = [
  // Tech/Corporate
  'Axel', 'Blake', 'Cyrus', 'Dex', 'Eli', 'Flynn', 'Gage', 'Hiro', 'Ivan',
  'Jax', 'Kade', 'Leo', 'Max', 'Neo', 'Omar', 'Phoenix', 'Quentin', 'Rex',
  'Slade', 'Troy', 'Viktor', 'Wade', 'Xander', 'Zane', 'Ash', 'Cole',
  // Space/Military
  'Admiral', 'Captain', 'Commander', 'Corporal', 'Major', 'Sergeant',
  'Riker', 'Picard', 'Kirk', 'Spock', 'Solo', 'Skywalker', 'Kenobi',
  // Cyberpunk
  'Chrome', 'Razor', 'Spike', 'Vector', 'Cipher', 'Glitch', 'Havoc',
  'Jinx', 'Neon', 'Pixel', 'Riot', 'Static', 'Tron', 'Volt', 'Zero',
  // Asian-inspired
  'Akira', 'Daichi', 'Haruki', 'Kenji', 'Ryu', 'Shin', 'Takeshi', 'Yuki',
  'Jin', 'Ken', 'Masa', 'Nobu', 'Sato', 'Taro', 'Koji', 'Kenzo',
  // Slavic
  'Aleksei', 'Boris', 'Dimitri', 'Igor', 'Mikhail', 'Nikolai', 'Pavel',
  'Sergei', 'Vladimir', 'Yuri', 'Andrei', 'Fyodor', 'Konstantin', 'Oleg',
];

const SCIFI_FEMALE = [
  // Tech/Corporate
  'Ava', 'Brooklyn', 'Cleo', 'Delta', 'Echo', 'Freya', 'Genesis', 'Harper',
  'Iris', 'Jade', 'Kira', 'Luna', 'Mira', 'Nova', 'Onyx', 'Phoenix',
  'Quinn', 'Raven', 'Stella', 'Terra', 'Unity', 'Vega', 'Winter', 'Zara',
  // Space/Military
  'Ripley', 'Sarah', 'Trinity', 'Leia', 'Rey', 'Ahsoka', 'Padme',
  // Cyberpunk
  'Aria', 'Chrome', 'Elektra', 'Glitch', 'Hex', 'Ion', 'Jinx', 'Kairi',
  'Lyric', 'Mercy', 'Nyx', 'Oracle', 'Pixel', 'Raze', 'Sombra', 'Viper',
  // Asian-inspired
  'Akemi', 'Hana', 'Kaori', 'Mei', 'Naomi', 'Rei', 'Sakura', 'Yuki',
  'Aiko', 'Chika', 'Emiko', 'Haruka', 'Keiko', 'Mika', 'Suki', 'Yumi',
  // Slavic
  'Anastasia', 'Ekaterina', 'Irina', 'Katya', 'Natasha', 'Olga', 'Svetlana',
  'Tatiana', 'Valentina', 'Yelena', 'Daria', 'Galina', 'Ludmila', 'Zoya',
];

// ============================================================================
// NOIR / MYSTERY NAMES
// ============================================================================

const NOIR_MALE = [
  // Classic Noir
  'Sam', 'Jack', 'Frank', 'Tony', 'Vince', 'Eddie', 'Lou', 'Sal', 'Nick',
  'Mickey', 'Charlie', 'Bobby', 'Joe', 'Danny', 'Vinnie', 'Tommy', 'Jimmy',
  // Detective names
  'Marlowe', 'Spade', 'Archer', 'Hammer', 'Travis', 'Magnum', 'Rockford',
  // Surnames as first names
  'Cross', 'Stone', 'Drake', 'Steele', 'Wolfe', 'Chance', 'Bishop', 'Cole',
  // European
  'Antonio', 'Bruno', 'Carlo', 'Dante', 'Enzo', 'Franco', 'Giovanni',
  'Lorenzo', 'Marco', 'Paolo', 'Rico', 'Salvatore', 'Vittorio', 'Alberto',
];

const NOIR_FEMALE = [
  // Classic Noir femme fatale
  'Veronica', 'Rita', 'Gloria', 'Vivian', 'Evelyn', 'Carmen', 'Lana',
  'Marlene', 'Ava', 'Ingrid', 'Lauren', 'Bette', 'Joan', 'Barbara',
  // Modern noir
  'Natalie', 'Scarlett', 'Ivy', 'Ruby', 'Jade', 'Amber', 'Crystal',
  'Diamond', 'Pearl', 'Violet', 'Rose', 'Lily', 'Daisy', 'Jasmine',
  // Professional
  'Charlotte', 'Elizabeth', 'Katherine', 'Margaret', 'Patricia', 'Victoria',
  'Alexandra', 'Anastasia', 'Cassandra', 'Dominique', 'Francesca', 'Gabriella',
];

// ============================================================================
// WESTERN NAMES
// ============================================================================

const WESTERN_MALE = [
  // Classic Western
  'Wyatt', 'Doc', 'Jesse', 'Billy', 'Cole', 'Clint', 'John', 'Wayne',
  'Butch', 'Sundance', 'Wild', 'Bill', 'Hickok', 'Earp', 'Holliday',
  // Rancher/Cowboy
  'Buck', 'Colt', 'Duke', 'Hank', 'Jake', 'Jeb', 'Luke', 'Maverick',
  'Pete', 'Red', 'Rusty', 'Slim', 'Tex', 'Virgil', 'Wes', 'Zeke',
  // Spanish influence
  'Antonio', 'Carlos', 'Diego', 'Emilio', 'Fernando', 'Gustavo', 'Hector',
  'Jose', 'Juan', 'Luis', 'Manuel', 'Miguel', 'Pablo', 'Rafael', 'Santiago',
  // Native-inspired
  'Cheyenne', 'Dakota', 'Montana', 'Nevada', 'Rio', 'Sierra', 'Apache',
];

const WESTERN_FEMALE = [
  // Classic Western
  'Annie', 'Calamity', 'Jane', 'Belle', 'Starr', 'Pearl', 'Kitty',
  'Sadie', 'Rosie', 'Mary', 'Sarah', 'Emma', 'Clara', 'Hannah',
  // Frontier
  'Adelaide', 'Beatrice', 'Charlotte', 'Dorothea', 'Eliza', 'Frances',
  'Georgia', 'Harriet', 'Josephine', 'Louisa', 'Martha', 'Prudence',
  // Spanish influence
  'Carmen', 'Dolores', 'Elena', 'Isabella', 'Maria', 'Rosa', 'Sofia',
  'Valencia', 'Ximena', 'Catalina', 'Esperanza', 'Guadalupe', 'Lucia',
];

// ============================================================================
// HORROR NAMES
// ============================================================================

const HORROR_MALE = [
  // Gothic horror
  'Damien', 'Lucifer', 'Mortimer', 'Raven', 'Salem', 'Victor', 'Vincent',
  'Dorian', 'Edgar', 'Lestat', 'Marius', 'Mordecai', 'Poe', 'Vlad',
  // Creepy classics
  'Norman', 'Hannibal', 'Dexter', 'Michael', 'Jason', 'Freddy', 'Chucky',
  // Old-fashioned creepy
  'Alistair', 'Barnabas', 'Cornelius', 'Ebenezer', 'Ichabod', 'Malachi',
  'Obadiah', 'Silas', 'Thaddeus', 'Zachariah', 'Ambrose', 'Cassius',
  // Occult
  'Aleister', 'Balthazar', 'Crowley', 'Damian', 'Lazarus', 'Magnus',
  'Merlin', 'Nostradamus', 'Rasputin', 'Solomon', 'Abaddon', 'Azrael',
];

const HORROR_FEMALE = [
  // Gothic horror
  'Carmilla', 'Elvira', 'Lenore', 'Lilith', 'Morticia', 'Raven', 'Salem',
  'Selene', 'Tabitha', 'Wednesday', 'Belladonna', 'Circe', 'Delilah',
  // Classic horror
  'Carrie', 'Regan', 'Samara', 'Sadako', 'Annabelle', 'Esther', 'Clarice',
  // Old-fashioned creepy
  'Agatha', 'Bathsheba', 'Constance', 'Drusilla', 'Endora', 'Griselda',
  'Hester', 'Jezebel', 'Millicent', 'Prudence', 'Temperance', 'Winifred',
  // Occult
  'Hecate', 'Isis', 'Kali', 'Lamia', 'Medusa', 'Morgana', 'Pandora',
  'Persephone', 'Sybil', 'Thalia', 'Aradia', 'Baba', 'Cerridwen',
];

// ============================================================================
// PIRATE NAMES
// ============================================================================

const PIRATE_MALE = [
  // Classic pirate
  'Blackbeard', 'Calico', 'Captain', 'Cutlass', 'Hook', 'Long', 'Morgan',
  'Redbeard', 'Silvers', 'Sparrow', 'Flint', 'Barbossa', 'Bones', 'Silver',
  // Sailor names
  'Barnacle', 'Anchor', 'Reef', 'Tide', 'Storm', 'Wave', 'Gale', 'Port',
  // Real pirate names
  'Edward', 'Henry', 'Jack', 'James', 'John', 'Samuel', 'Thomas', 'William',
  'Bartholomew', 'Francis', 'Stede', 'Olivier', 'Charles', 'Benjamin',
  // Caribbean
  'Diego', 'Fernando', 'Gonzalo', 'Hernando', 'Pedro', 'Rafael', 'Salvador',
];

const PIRATE_FEMALE = [
  // Classic pirate
  'Anne', 'Mary', 'Grace', 'Elizabeth', 'Charlotte', 'Bonny', 'Read',
  // Pirate queens
  'Ching', 'Shih', 'Jacquotte', 'Jeanne', 'Sadie', 'Rachel', 'Flora',
  // Sailor/sea names
  'Coral', 'Marina', 'Pearl', 'Ariel', 'Oceana', 'Sailor', 'Storm',
  'Tempest', 'Waverly', 'Bay', 'Cove', 'Harbor', 'Isle', 'Reef',
  // Caribbean
  'Catalina', 'Isabella', 'Lucia', 'Marisol', 'Paloma', 'Rosita', 'Valentina',
];

// ============================================================================
// MODERN LIFE NAMES
// ============================================================================

const MODERN_MALE = [
  // Common modern
  'James', 'John', 'Michael', 'David', 'Robert', 'William', 'Richard',
  'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  // Trendy modern
  'Aiden', 'Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Mason', 'Logan',
  'Alexander', 'Sebastian', 'Benjamin', 'Henry', 'Jackson', 'Elijah',
  // Professional
  'Bradley', 'Cameron', 'Derek', 'Eric', 'Gary', 'Howard', 'Keith',
  'Lawrence', 'Nathan', 'Patrick', 'Raymond', 'Steven', 'Timothy', 'Vincent',
  // Diverse
  'Ahmed', 'Carlos', 'Diego', 'Hiroshi', 'Jamal', 'Kenji', 'Marcus',
  'Omar', 'Raj', 'Takeshi', 'Wei', 'Yusuf', 'Chen', 'Hassan',
];

const MODERN_FEMALE = [
  // Common modern
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan',
  'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret',
  // Trendy modern
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte',
  'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Ella', 'Madison',
  // Professional
  'Amanda', 'Brittany', 'Courtney', 'Diana', 'Heather', 'Kelly', 'Laura',
  'Michelle', 'Nicole', 'Rachel', 'Stephanie', 'Tiffany', 'Vanessa', 'Whitney',
  // Diverse
  'Aisha', 'Carmen', 'Fatima', 'Guadalupe', 'Keiko', 'Lakshmi', 'Ming',
  'Priya', 'Sakura', 'Suki', 'Yuki', 'Zara', 'Amara', 'Leila',
];

// ============================================================================
// WAR NAMES
// ============================================================================

const WAR_MALE = [
  // Military ranks as names
  'Major', 'Captain', 'Sergeant', 'Private', 'Lieutenant', 'Colonel',
  'General', 'Admiral', 'Commander', 'Corporal', 'Chief', 'Gunner',
  // WWII era
  'Frank', 'George', 'Harold', 'Henry', 'Jack', 'Joseph', 'Raymond',
  'Robert', 'Walter', 'William', 'Albert', 'Arthur', 'Charles', 'Donald',
  // Vietnam era
  'Billy', 'Bobby', 'Danny', 'Eddie', 'Gary', 'Jimmy', 'Johnny', 'Kenny',
  'Larry', 'Marvin', 'Randy', 'Ricky', 'Terry', 'Tommy', 'Wayne',
  // Modern military
  'Bravo', 'Delta', 'Echo', 'Fox', 'Ghost', 'Hawk', 'Phoenix', 'Reaper',
  'Shadow', 'Snake', 'Striker', 'Tank', 'Viper', 'Wolf', 'Apex',
];

const WAR_FEMALE = [
  // WWII era
  'Betty', 'Dorothy', 'Edith', 'Evelyn', 'Frances', 'Helen', 'Margaret',
  'Mary', 'Mildred', 'Ruth', 'Virginia', 'Alice', 'Catherine', 'Eleanor',
  // Modern military
  'Alex', 'Casey', 'Dakota', 'Jordan', 'Morgan', 'Riley', 'Sam', 'Taylor',
  // Combat callsigns
  'Phoenix', 'Raven', 'Hawk', 'Viper', 'Ghost', 'Shadow', 'Storm',
  'Thunder', 'Lightning', 'Blaze', 'Fury', 'Valkyrie', 'Athena', 'Artemis',
];

// ============================================================================
// NEUTRAL/UNISEX NAMES BY GENRE
// ============================================================================

const FANTASY_NEUTRAL = [
  'Ash', 'Avery', 'Blair', 'Brook', 'Casey', 'Drew', 'Eden', 'Ember',
  'Finley', 'Haven', 'Indigo', 'Jordan', 'Kai', 'Lane', 'Morgan', 'Phoenix',
  'Quinn', 'Reese', 'River', 'Rowan', 'Sage', 'Sky', 'Storm', 'Wren',
];

const SCIFI_NEUTRAL = [
  'Alpha', 'Beta', 'Cipher', 'Core', 'Data', 'Echo', 'Flux', 'Grid',
  'Hex', 'Ion', 'Jett', 'Kilo', 'Link', 'Nano', 'Omega', 'Proxy',
  'Quantum', 'Relay', 'Sync', 'Trace', 'Unit', 'Vector', 'Wire', 'Zero',
];

const MODERN_NEUTRAL = [
  'Alex', 'Angel', 'Avery', 'Bailey', 'Cameron', 'Casey', 'Charlie', 'Dakota',
  'Drew', 'Emery', 'Finley', 'Harper', 'Jamie', 'Jordan', 'Kelly', 'Kim',
  'Lee', 'Morgan', 'Parker', 'Pat', 'Peyton', 'Quinn', 'Riley', 'Sam',
  'Skyler', 'Taylor', 'Terry', 'Tracy',
];

// ============================================================================
// SURNAMES BY GENRE
// ============================================================================

const FANTASY_SURNAMES = [
  'Blackwood', 'Brightblade', 'Darkhollow', 'Dragonbane', 'Eaglecrest',
  'Frostfire', 'Goldleaf', 'Hawkwind', 'Ironforge', 'Lightbringer',
  'Moonwhisper', 'Nightshade', 'Oakenshield', 'Ravenclaw', 'Shadowmend',
  'Starweaver', 'Stormborn', 'Sunfire', 'Thornwood', 'Winterfell',
  'Ashford', 'Blackthorn', 'Coldwater', 'Dawnstar', 'Evenwood',
  'Fairweather', 'Greymoor', 'Hallowmere', 'Ironwood', 'Jadestone',
];

const SCIFI_SURNAMES = [
  'Anderson', 'Chen', 'Cross', 'Drake', 'Ellis', 'Fox', 'Grey', 'Hayes',
  'Kane', 'Lang', 'Morgan', 'Nash', 'Pierce', 'Quinn', 'Reyes', 'Shaw',
  'Stone', 'Tanaka', 'Vance', 'Webb', 'Yamamoto', 'Zhang', 'Kovac',
  'Volkov', 'Petrov', 'Nakamura', 'Kim', 'Park', 'Singh', 'Patel',
];

const NOIR_SURNAMES = [
  'Black', 'Carbone', 'Cross', 'Diamond', 'Drake', 'Falcone', 'Gold',
  'Marlowe', 'Noir', 'Romano', 'Russo', 'Santino', 'Shade', 'Silver',
  'Spade', 'Stone', 'Valentine', 'Vance', 'Velvet', 'Wolfe',
  'Bianchi', 'Colombo', 'DeVito', 'Esposito', 'Genovese', 'Luciano',
  'Moretti', 'Ricci', 'Scaletta', 'Vitale',
];

const WESTERN_SURNAMES = [
  'Black', 'Cassidy', 'Cody', 'Dalton', 'Earp', 'Garrett', 'Hickok',
  'Holiday', 'James', 'Kid', 'Longley', 'Masterson', 'Oakley', 'Ringo',
  'Starr', 'Texas', 'Walker', 'Younger', 'Carson', 'Crockett',
  'Brown', 'Davis', 'Evans', 'Foster', 'Green', 'Harris', 'Johnson',
  'Miller', 'Roberts', 'Smith', 'Taylor', 'Wilson',
];

const HORROR_SURNAMES = [
  'Black', 'Blood', 'Crow', 'Dark', 'Doom', 'Dread', 'Fear', 'Grave',
  'Grimm', 'Hollow', 'Mortis', 'Night', 'Pale', 'Raven', 'Shadow',
  'Shade', 'Skull', 'Thorn', 'Veil', 'Whisper', 'Ash', 'Bone',
  'Bane', 'Crypt', 'Dirge', 'Eerie', 'Frost', 'Ghoul', 'Hex', 'Lich',
];

const MODERN_SURNAMES = [
  'Adams', 'Baker', 'Brown', 'Carter', 'Davis', 'Evans', 'Foster', 'Garcia',
  'Harris', 'Jackson', 'Johnson', 'King', 'Lee', 'Martin', 'Miller', 'Moore',
  'Nelson', 'Parker', 'Roberts', 'Smith', 'Taylor', 'Thomas', 'Thompson',
  'Walker', 'White', 'Williams', 'Wilson', 'Wright', 'Young', 'Anderson',
  'Chen', 'Kim', 'Patel', 'Singh', 'Nguyen', 'Lopez', 'Martinez', 'Rodriguez',
];

// ============================================================================
// GENRE NAME POOLS
// ============================================================================

interface NamePool {
  male: string[];
  female: string[];
  neutral: string[];
  surnames: string[];
}

const NAME_POOLS: Record<string, NamePool> = {
  fantasy: { male: FANTASY_MALE, female: FANTASY_FEMALE, neutral: FANTASY_NEUTRAL, surnames: FANTASY_SURNAMES },
  scifi: { male: SCIFI_MALE, female: SCIFI_FEMALE, neutral: SCIFI_NEUTRAL, surnames: SCIFI_SURNAMES },
  cyberpunk: { male: SCIFI_MALE, female: SCIFI_FEMALE, neutral: SCIFI_NEUTRAL, surnames: SCIFI_SURNAMES },
  mystery: { male: NOIR_MALE, female: NOIR_FEMALE, neutral: MODERN_NEUTRAL, surnames: NOIR_SURNAMES },
  noir: { male: NOIR_MALE, female: NOIR_FEMALE, neutral: MODERN_NEUTRAL, surnames: NOIR_SURNAMES },
  western: { male: WESTERN_MALE, female: WESTERN_FEMALE, neutral: MODERN_NEUTRAL, surnames: WESTERN_SURNAMES },
  horror: { male: HORROR_MALE, female: HORROR_FEMALE, neutral: FANTASY_NEUTRAL, surnames: HORROR_SURNAMES },
  cosmic_horror: { male: HORROR_MALE, female: HORROR_FEMALE, neutral: FANTASY_NEUTRAL, surnames: HORROR_SURNAMES },
  pirate: { male: PIRATE_MALE, female: PIRATE_FEMALE, neutral: MODERN_NEUTRAL, surnames: WESTERN_SURNAMES },
  war: { male: WAR_MALE, female: WAR_FEMALE, neutral: MODERN_NEUTRAL, surnames: MODERN_SURNAMES },
  modern_life: { male: MODERN_MALE, female: MODERN_FEMALE, neutral: MODERN_NEUTRAL, surnames: MODERN_SURNAMES },
  postapoc: { male: WAR_MALE, female: WAR_FEMALE, neutral: SCIFI_NEUTRAL, surnames: MODERN_SURNAMES },
};

// ============================================================================
// NAME BLACKLIST - Hierarchy/rank terms that shouldn't be used as names
// ============================================================================

const NAME_BLACKLIST = new Set([
  // Military ranks (not names)
  'Command', 'Commander', 'Captain', 'Admiral', 'Major', 'Sergeant', 
  'Private', 'Lieutenant', 'Colonel', 'General', 'Corporal', 'Chief',
  'Officer', 'Ensign', 'Cadet', 'Marshal', 'Brigadier', 'Commodore',
  // Pirate/nautical ranks
  'Quartermaster', 'Boatswain', 'Mate', 'Skipper',
  // Generic titles
  'Doctor', 'Professor', 'Director', 'Manager', 'Boss', 'Leader',
  'Master', 'Lord', 'Lady', 'Sir', 'Dame', 'King', 'Queen', 'Prince',
  'Princess', 'Duke', 'Duchess', 'Count', 'Countess', 'Baron', 'Baroness',
  // Job titles that sound like names but aren't
  'Gunner', 'Driver', 'Pilot', 'Engineer', 'Medic', 'Scout',
]);

/**
 * Check if a name is blacklisted (hierarchy/rank term)
 */
export function isBlacklistedName(name: string): boolean {
  return NAME_BLACKLIST.has(name);
}

/**
 * Filter blacklisted names from an array
 */
function filterBlacklist(names: string[]): string[] {
  return names.filter(name => !NAME_BLACKLIST.has(name));
}

// ============================================================================
// NAME GENERATION FUNCTIONS
// ============================================================================

/**
 * Get a random element from an array using a seed for deterministic results
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

function randomFromArray<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generate a full NPC name based on genre and optional gender
 * Uses seeded randomness for deterministic results when campaignSeed is provided
 * Filters out blacklisted hierarchy/rank terms
 */
export function generateNPCName(
  genre: GameGenre,
  gender?: Gender,
  campaignSeed?: string,
  npcIndex?: number
): { firstName: string; lastName: string; fullName: string; gender: Gender } {
  const pool = NAME_POOLS[genre] || NAME_POOLS.modern_life;
  
  // Create seeded RNG if campaign seed provided
  const seedStr = campaignSeed ? `${campaignSeed}_npc_${npcIndex || Date.now()}` : String(Date.now());
  const rng = campaignSeed ? seededRandom(seedStr) : Math.random;
  
  // Determine gender if not provided
  const actualGender: Gender = gender || (rng() < 0.4 ? 'male' : rng() < 0.8 ? 'female' : 'neutral');
  
  // Select first name based on gender, filtering blacklisted terms
  let firstName: string;
  let namePool: string[];
  
  if (actualGender === 'neutral') {
    namePool = filterBlacklist(pool.neutral);
  } else if (actualGender === 'female') {
    namePool = filterBlacklist(pool.female);
  } else {
    namePool = filterBlacklist(pool.male);
  }
  
  firstName = randomFromArray(namePool, rng);
  
  // Select surname
  const lastName = randomFromArray(pool.surnames, rng);
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender: actualGender,
  };
}

/**
 * Generate multiple unique NPC names for a genre
 */
export function generateNPCNameBatch(
  genre: GameGenre,
  count: number,
  campaignSeed?: string
): Array<{ firstName: string; lastName: string; fullName: string; gender: Gender }> {
  const names = new Set<string>();
  const results: Array<{ firstName: string; lastName: string; fullName: string; gender: Gender }> = [];
  
  let attempts = 0;
  while (results.length < count && attempts < count * 3) {
    const name = generateNPCName(genre, undefined, campaignSeed, attempts);
    if (!names.has(name.fullName)) {
      names.add(name.fullName);
      results.push(name);
    }
    attempts++;
  }
  
  return results;
}

/**
 * Get available first names for a genre and gender (filtered)
 */
export function getFirstNames(genre: GameGenre, gender: Gender): string[] {
  const pool = NAME_POOLS[genre] || NAME_POOLS.modern_life;
  if (gender === 'neutral') return filterBlacklist(pool.neutral);
  if (gender === 'female') return filterBlacklist(pool.female);
  return filterBlacklist(pool.male);
}

/**
 * Get available surnames for a genre
 */
export function getSurnames(genre: GameGenre): string[] {
  const pool = NAME_POOLS[genre] || NAME_POOLS.modern_life;
  return pool.surnames;
}

/**
 * Check if a genre has a name pool defined
 */
export function hasNamePool(genre: string): boolean {
  return genre in NAME_POOLS;
}

/**
 * Get total name count for a genre
 */
export function getNamePoolSize(genre: GameGenre): { male: number; female: number; neutral: number; surnames: number } {
  const pool = NAME_POOLS[genre] || NAME_POOLS.modern_life;
  return {
    male: pool.male.length,
    female: pool.female.length,
    neutral: pool.neutral.length,
    surnames: pool.surnames.length,
  };
}
