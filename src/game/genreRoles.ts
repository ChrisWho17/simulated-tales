// Genre-based generative roles for NPCs
// These roles help AI portrait generation be more accurate to the genre

import { GameGenre } from '@/types/genreData';

export interface GenreRole {
  id: string;
  name: string;
  description: string;
  portraitPromptHints: string[];
  clothingStyle: string;
  commonLocations: string[];
}

// Fantasy roles
const FANTASY_ROLES: GenreRole[] = [
  { id: 'tavern_keeper', name: 'Tavern Keeper', description: 'Runs the local inn and tavern', portraitPromptHints: ['apron', 'weathered hands', 'friendly expression', 'medieval tavern'], clothingStyle: 'simple medieval tunic with apron', commonLocations: ['tavern', 'inn'] },
  { id: 'blacksmith', name: 'Blacksmith', description: 'Forges weapons and armor', portraitPromptHints: ['muscular', 'soot-covered', 'leather apron', 'forge background'], clothingStyle: 'leather apron over bare chest or simple shirt', commonLocations: ['forge', 'market'] },
  { id: 'merchant', name: 'Merchant', description: 'Trades goods and wares', portraitPromptHints: ['fine clothes', 'calculating eyes', 'coin purse'], clothingStyle: 'rich but practical merchant garb', commonLocations: ['market', 'trade district'] },
  { id: 'guard', name: 'Town Guard', description: 'Maintains order and safety', portraitPromptHints: ['armor', 'alert stance', 'weapon at side', 'city watch'], clothingStyle: 'chainmail or leather armor with tabard', commonLocations: ['gates', 'streets', 'palace'] },
  { id: 'noble', name: 'Noble', description: 'Member of the aristocracy', portraitPromptHints: ['elegant clothes', 'jewelry', 'refined features', 'castle background'], clothingStyle: 'fine silk and velvet with gold trim', commonLocations: ['palace', 'manor', 'court'] },
  { id: 'priest', name: 'Priest', description: 'Serves the divine', portraitPromptHints: ['robes', 'holy symbol', 'serene expression', 'temple'], clothingStyle: 'ceremonial robes with religious symbols', commonLocations: ['temple', 'shrine', 'graveyard'] },
  { id: 'witch', name: 'Witch', description: 'Practitioner of folk magic', portraitPromptHints: ['mysterious', 'herbs', 'cottage', 'magical aura'], clothingStyle: 'dark robes with mystical accessories', commonLocations: ['forest', 'swamp', 'cottage'] },
  { id: 'bard', name: 'Bard', description: 'Traveling performer and storyteller', portraitPromptHints: ['instrument', 'colorful clothes', 'charming smile'], clothingStyle: 'flamboyant performer attire', commonLocations: ['tavern', 'square', 'court'] },
  { id: 'farmer', name: 'Farmer', description: 'Works the land', portraitPromptHints: ['sun-weathered', 'simple clothes', 'honest face'], clothingStyle: 'rough homespun clothes', commonLocations: ['farm', 'market', 'village'] },
  { id: 'beggar', name: 'Beggar', description: 'Survives on the streets', portraitPromptHints: ['ragged clothes', 'thin', 'desperate eyes'], clothingStyle: 'torn and dirty rags', commonLocations: ['streets', 'alleys', 'temple steps'] },
];

// Sci-Fi roles
const SCIFI_ROLES: GenreRole[] = [
  { id: 'station_officer', name: 'Station Officer', description: 'Manages station operations', portraitPromptHints: ['uniform', 'insignia', 'tech interface', 'space station'], clothingStyle: 'clean military-style uniform', commonLocations: ['command deck', 'station'] },
  { id: 'engineer', name: 'Engineer', description: 'Maintains and repairs technology', portraitPromptHints: ['tool belt', 'grease marks', 'tech goggles'], clothingStyle: 'practical jumpsuit with tools', commonLocations: ['engineering', 'maintenance'] },
  { id: 'trader', name: 'Space Trader', description: 'Deals in interstellar goods', portraitPromptHints: ['flight jacket', 'holstered weapon', 'weathered face'], clothingStyle: 'practical spacer clothing', commonLocations: ['docking bay', 'market', 'cantina'] },
  { id: 'scientist', name: 'Scientist', description: 'Researches the unknown', portraitPromptHints: ['lab coat', 'data pad', 'analytical expression'], clothingStyle: 'clean lab attire', commonLocations: ['lab', 'research station'] },
  { id: 'mercenary', name: 'Mercenary', description: 'Soldier for hire', portraitPromptHints: ['combat armor', 'scars', 'weapons', 'hardened expression'], clothingStyle: 'tactical combat gear', commonLocations: ['cantina', 'docking bay', 'frontier'] },
  { id: 'pilot', name: 'Pilot', description: 'Flies starships', portraitPromptHints: ['flight suit', 'confident stance', 'helmet nearby'], clothingStyle: 'flight suit or jacket', commonLocations: ['hangar', 'cockpit', 'cantina'] },
  { id: 'cyborg', name: 'Cyborg', description: 'Human with technological enhancements', portraitPromptHints: ['visible cybernetics', 'glowing implants', 'mechanical parts'], clothingStyle: 'clothes exposing cybernetic parts', commonLocations: ['tech district', 'clinic'] },
  { id: 'alien_diplomat', name: 'Alien Diplomat', description: 'Representative of another species', portraitPromptHints: ['non-human features', 'formal attire', 'otherworldly'], clothingStyle: 'alien formal wear', commonLocations: ['embassy', 'council'] },
];

// Cyberpunk roles
const CYBERPUNK_ROLES: GenreRole[] = [
  { id: 'fixer', name: 'Fixer', description: 'Arranges jobs and connections', portraitPromptHints: ['street smart', 'augmented eyes', 'neon lighting', 'dark clothes'], clothingStyle: 'sleek dark urban wear', commonLocations: ['bar', 'back alley', 'nightclub'] },
  { id: 'netrunner', name: 'Netrunner', description: 'Hacks the digital realm', portraitPromptHints: ['neural interface', 'glowing eyes', 'data cables', 'hooded'], clothingStyle: 'tech-enhanced streetwear', commonLocations: ['net cafe', 'safehouse'] },
  { id: 'corp_exec', name: 'Corporate Executive', description: 'High-ranking megacorp employee', portraitPromptHints: ['expensive suit', 'cold eyes', 'chrome accessories', 'skyscraper'], clothingStyle: 'expensive tailored suit', commonLocations: ['corporate tower', 'penthouse'] },
  { id: 'street_samurai', name: 'Street Samurai', description: 'Combat specialist for hire', portraitPromptHints: ['cyber limbs', 'weapons', 'tactical gear', 'battle scars'], clothingStyle: 'tactical urban combat gear', commonLocations: ['streets', 'combat zone'] },
  { id: 'ripperdoc', name: 'Ripperdoc', description: 'Black market cybernetics surgeon', portraitPromptHints: ['surgical mask', 'bloody apron', 'cyber tools', 'clinic'], clothingStyle: 'medical scrubs, often stained', commonLocations: ['back-alley clinic'] },
  { id: 'joytoy', name: 'Companion', description: 'Paid entertainment provider', portraitPromptHints: ['glamorous', 'neon makeup', 'revealing clothes', 'nightlife'], clothingStyle: 'flashy, revealing attire', commonLocations: ['nightclub', 'red district'] },
  { id: 'gang_member', name: 'Gang Member', description: 'Part of a street gang', portraitPromptHints: ['gang colors', 'tattoos', 'aggressive stance', 'weapons'], clothingStyle: 'gang-specific clothing and colors', commonLocations: ['streets', 'territory'] },
  { id: 'techie', name: 'Techie', description: 'Builds and modifies equipment', portraitPromptHints: ['work goggles', 'tool harness', 'grease stains'], clothingStyle: 'practical work clothes', commonLocations: ['workshop', 'market'] },
];

// Horror roles
const HORROR_ROLES: GenreRole[] = [
  { id: 'sheriff', name: 'Sheriff', description: 'Local law enforcement', portraitPromptHints: ['badge', 'tired eyes', 'uniform', 'small town'], clothingStyle: 'police uniform', commonLocations: ['station', 'streets'] },
  { id: 'priest', name: 'Priest', description: 'Religious authority', portraitPromptHints: ['clerical collar', 'cross', 'worried expression'], clothingStyle: 'black clerical attire', commonLocations: ['church', 'cemetery'] },
  { id: 'doctor', name: 'Doctor', description: 'Medical professional', portraitPromptHints: ['white coat', 'stethoscope', 'clinical environment'], clothingStyle: 'white lab coat', commonLocations: ['hospital', 'clinic'] },
  { id: 'occultist', name: 'Occultist', description: 'Dabbles in the forbidden', portraitPromptHints: ['mysterious', 'occult symbols', 'candles', 'dark room'], clothingStyle: 'dark, mystical clothing', commonLocations: ['antique shop', 'basement'] },
  { id: 'survivor', name: 'Survivor', description: 'Has seen things', portraitPromptHints: ['haunted eyes', 'disheveled', 'paranoid'], clothingStyle: 'worn, practical clothes', commonLocations: ['anywhere'] },
  { id: 'caretaker', name: 'Caretaker', description: 'Watches over an old place', portraitPromptHints: ['weathered', 'keys', 'lantern', 'old building'], clothingStyle: 'old work clothes', commonLocations: ['mansion', 'asylum'] },
  { id: 'medium', name: 'Medium', description: 'Communicates with the dead', portraitPromptHints: ['distant gaze', 'mystical jewelry', 'ethereal'], clothingStyle: 'flowing mystical garments', commonLocations: ['parlor', 'seance room'] },
];

// Western roles
const WESTERN_ROLES: GenreRole[] = [
  { id: 'sheriff', name: 'Sheriff', description: 'Law in these parts', portraitPromptHints: ['star badge', 'revolver', 'dusty hat', 'stern expression'], clothingStyle: 'sheriff attire with badge', commonLocations: ['jail', 'saloon', 'main street'] },
  { id: 'outlaw', name: 'Outlaw', description: 'Wanted dead or alive', portraitPromptHints: ['bandana', 'weathered face', 'guns', 'dangerous eyes'], clothingStyle: 'dusty trail clothes', commonLocations: ['hideout', 'trail', 'saloon'] },
  { id: 'saloon_keeper', name: 'Saloon Keeper', description: 'Runs the local watering hole', portraitPromptHints: ['apron', 'mustache', 'friendly but wary', 'bar background'], clothingStyle: 'vest and rolled sleeves', commonLocations: ['saloon'] },
  { id: 'saloon_girl', name: 'Saloon Girl', description: 'Entertainment and company', portraitPromptHints: ['corset', 'feathers', 'makeup', 'flirtatious'], clothingStyle: 'colorful saloon dress', commonLocations: ['saloon'] },
  { id: 'rancher', name: 'Rancher', description: 'Cattle and land owner', portraitPromptHints: ['weathered', 'cowboy hat', 'practical clothes'], clothingStyle: 'practical ranch wear', commonLocations: ['ranch', 'town'] },
  { id: 'prospector', name: 'Prospector', description: 'Searching for gold', portraitPromptHints: ['pickaxe', 'grizzled', 'dirty', 'hopeful or desperate'], clothingStyle: 'mining clothes', commonLocations: ['mine', 'camp', 'assay office'] },
  { id: 'gunslinger', name: 'Gunslinger', description: 'Fast draw, faster temper', portraitPromptHints: ['low-slung holster', 'cold eyes', 'dusty duster'], clothingStyle: 'gunfighter attire', commonLocations: ['saloon', 'main street'] },
  { id: 'native_scout', name: 'Native Scout', description: 'Knows the land like no other', portraitPromptHints: ['traditional dress', 'proud bearing', 'nature'], clothingStyle: 'traditional native attire', commonLocations: ['wilderness', 'trading post'] },
  { id: 'preacher', name: 'Preacher', description: 'Bringing salvation to the frontier', portraitPromptHints: ['black coat', 'bible', 'fervent expression'], clothingStyle: 'black preacher coat', commonLocations: ['church', 'town'] },
  { id: 'doctor', name: 'Frontier Doctor', description: 'Part sawbones, part miracle worker', portraitPromptHints: ['medical bag', 'spectacles', 'rolled sleeves'], clothingStyle: 'practical medical attire', commonLocations: ['clinic', 'anywhere needed'] },
];

// Mystery/Noir roles
const MYSTERY_ROLES: GenreRole[] = [
  { id: 'detective', name: 'Detective', description: 'Private or police investigator', portraitPromptHints: ['trench coat', 'fedora', 'cigarette', 'shadowy'], clothingStyle: 'classic detective attire', commonLocations: ['office', 'crime scene'] },
  { id: 'femme_fatale', name: 'Femme Fatale', description: 'Dangerous and alluring', portraitPromptHints: ['elegant dress', 'red lips', 'mysterious eyes', 'cigarette holder'], clothingStyle: 'glamorous evening wear', commonLocations: ['club', 'hotel'] },
  { id: 'cop', name: 'Police Officer', description: 'On the beat or corrupt', portraitPromptHints: ['uniform', 'badge', 'nightstick', 'hard expression'], clothingStyle: 'police uniform', commonLocations: ['precinct', 'streets'] },
  { id: 'mob_boss', name: 'Crime Boss', description: 'Runs the underworld', portraitPromptHints: ['expensive suit', 'cigar', 'power', 'shadowy office'], clothingStyle: 'expensive tailored suit', commonLocations: ['office', 'club'] },
  { id: 'journalist', name: 'Journalist', description: 'Chasing the story', portraitPromptHints: ['press badge', 'notepad', 'eager expression'], clothingStyle: 'practical city clothes', commonLocations: ['newspaper', 'crime scene'] },
  { id: 'bartender', name: 'Bartender', description: 'Hears everything', portraitPromptHints: ['vest', 'cleaning glass', 'knowing eyes'], clothingStyle: 'bartender attire', commonLocations: ['bar'] },
  { id: 'lounge_singer', name: 'Lounge Singer', description: 'Performs at the club', portraitPromptHints: ['evening gown', 'microphone', 'spotlight', 'sultry'], clothingStyle: 'glamorous performance dress', commonLocations: ['club', 'lounge'] },
];

// Post-apocalyptic roles
const POSTAPOC_ROLES: GenreRole[] = [
  { id: 'scavenger', name: 'Scavenger', description: 'Survives on salvage', portraitPromptHints: ['makeshift gear', 'goggles', 'backpack', 'wasteland'], clothingStyle: 'patched together survival gear', commonLocations: ['ruins', 'market'] },
  { id: 'warlord', name: 'Warlord', description: 'Rules through strength', portraitPromptHints: ['armor scraps', 'intimidating', 'trophies', 'throne of junk'], clothingStyle: 'imposing scavenged armor', commonLocations: ['stronghold', 'territory'] },
  { id: 'trader', name: 'Wasteland Trader', description: 'Travels between settlements', portraitPromptHints: ['pack animal', 'worn clothes', 'wary eyes'], clothingStyle: 'practical travel wear', commonLocations: ['market', 'road'] },
  { id: 'medic', name: 'Wasteland Medic', description: 'Heals with limited supplies', portraitPromptHints: ['medical bag', 'bloody bandages', 'tired'], clothingStyle: 'practical with medical cross', commonLocations: ['clinic', 'settlement'] },
  { id: 'cultist', name: 'Cultist', description: 'Worships the old world or new gods', portraitPromptHints: ['robes', 'strange symbols', 'fanatical eyes'], clothingStyle: 'cult robes and symbols', commonLocations: ['temple', 'ruins'] },
  { id: 'mutant', name: 'Mutant', description: 'Changed by radiation', portraitPromptHints: ['physical mutations', 'unique appearance', 'outcast'], clothingStyle: 'whatever fits', commonLocations: ['outskirts', 'underground'] },
  { id: 'raider', name: 'Raider', description: 'Takes what they want', portraitPromptHints: ['mohawk', 'spikes', 'war paint', 'aggressive'], clothingStyle: 'intimidating raider gear', commonLocations: ['roads', 'camps'] },
  { id: 'settler', name: 'Settler', description: 'Trying to rebuild', portraitPromptHints: ['work clothes', 'hopeful but weary', 'tools'], clothingStyle: 'practical farm clothes', commonLocations: ['settlement', 'farm'] },
];

// Pirate roles
const PIRATE_ROLES: GenreRole[] = [
  { id: 'captain', name: 'Captain', description: 'Commands the ship', portraitPromptHints: ['captain hat', 'coat', 'commanding presence', 'ship'], clothingStyle: 'captain coat and hat', commonLocations: ['ship', 'tavern'] },
  { id: 'first_mate', name: 'First Mate', description: 'Second in command', portraitPromptHints: ['practical clothes', 'cutlass', 'loyal expression'], clothingStyle: 'practical sailing clothes', commonLocations: ['ship'] },
  { id: 'sailor', name: 'Sailor', description: 'Works the ship', portraitPromptHints: ['striped shirt', 'weathered', 'tattoos'], clothingStyle: 'sailor clothes', commonLocations: ['ship', 'docks'] },
  { id: 'tavern_wench', name: 'Tavern Wench', description: 'Serves drinks at port', portraitPromptHints: ['corset', 'tankards', 'rowdy tavern'], clothingStyle: 'tavern serving attire', commonLocations: ['tavern'] },
  { id: 'merchant_captain', name: 'Merchant Captain', description: 'Legitimate trader', portraitPromptHints: ['fine clothes', 'nervous', 'wealthy'], clothingStyle: 'merchant attire', commonLocations: ['port', 'ship'] },
  { id: 'navy_officer', name: 'Navy Officer', description: 'Hunts pirates', portraitPromptHints: ['naval uniform', 'stern', 'medals'], clothingStyle: 'naval officer uniform', commonLocations: ['naval ship', 'port'] },
  { id: 'smuggler', name: 'Smuggler', description: 'Moves illegal goods', portraitPromptHints: ['shifty eyes', 'hidden pockets', 'dark clothes'], clothingStyle: 'nondescript dark clothes', commonLocations: ['docks', 'tavern'] },
];

// War roles - covers various war eras
const WAR_ROLES: GenreRole[] = [
  { id: 'soldier', name: 'Soldier', description: 'Front line fighter', portraitPromptHints: ['military uniform', 'weapon', 'combat ready', 'battlefield'], clothingStyle: 'military combat uniform', commonLocations: ['battlefield', 'barracks', 'trenches'] },
  { id: 'officer', name: 'Officer', description: 'Commands troops', portraitPromptHints: ['officer uniform', 'medals', 'commanding presence', 'stern'], clothingStyle: 'military officer dress', commonLocations: ['command post', 'headquarters'] },
  { id: 'medic', name: 'Combat Medic', description: 'Saves lives under fire', portraitPromptHints: ['medical bag', 'red cross', 'compassionate', 'blood stained'], clothingStyle: 'medic uniform with red cross', commonLocations: ['field hospital', 'battlefield'] },
  { id: 'civilian', name: 'Civilian', description: 'Caught in the crossfire', portraitPromptHints: ['worn clothes', 'frightened', 'carrying belongings', 'refugee'], clothingStyle: 'civilian clothes', commonLocations: ['village', 'city', 'shelter'] },
  { id: 'resistance', name: 'Resistance Fighter', description: 'Fights the occupiers', portraitPromptHints: ['hidden weapons', 'determined', 'civilian disguise', 'secretive'], clothingStyle: 'nondescript civilian with hidden weapons', commonLocations: ['safe house', 'underground'] },
  { id: 'spy', name: 'Military Spy', description: 'Gathers intelligence', portraitPromptHints: ['unremarkable appearance', 'sharp eyes', 'coded messages', 'disguise'], clothingStyle: 'varies by cover identity', commonLocations: ['enemy territory', 'embassy'] },
  { id: 'prisoner', name: 'POW', description: 'Captured by enemy', portraitPromptHints: ['worn uniform', 'thin', 'defiant eyes', 'camp setting'], clothingStyle: 'ragged prisoner attire', commonLocations: ['prison camp', 'cell'] },
];

// Map of genre to roles
export const GENRE_ROLES: Record<GameGenre, GenreRole[]> = {
  fantasy: FANTASY_ROLES,
  scifi: SCIFI_ROLES,
  cyberpunk: CYBERPUNK_ROLES,
  horror: HORROR_ROLES,
  western: WESTERN_ROLES,
  mystery: MYSTERY_ROLES,
  postapoc: POSTAPOC_ROLES,
  pirate: PIRATE_ROLES,
  war: WAR_ROLES,
  custom: FANTASY_ROLES, // Default to fantasy for custom
};

// Get a random role for a genre
export function getRandomRole(genre: GameGenre): GenreRole {
  const roles = GENRE_ROLES[genre] || FANTASY_ROLES;
  return roles[Math.floor(Math.random() * roles.length)];
}

// Get role by ID for a genre
export function getRoleById(genre: GameGenre, roleId: string): GenreRole | undefined {
  const roles = GENRE_ROLES[genre] || FANTASY_ROLES;
  return roles.find(role => role.id === roleId);
}

// Get all roles for a genre
export function getRolesForGenre(genre: GameGenre): GenreRole[] {
  return GENRE_ROLES[genre] || FANTASY_ROLES;
}

// Generate portrait prompt hints for a role
export function getRolePortraitPrompt(role: GenreRole, genre: GameGenre): string {
  const genreStyle: Record<GameGenre, string> = {
    fantasy: 'medieval fantasy, painted style',
    scifi: 'science fiction, futuristic, digital art',
    cyberpunk: 'cyberpunk, neon lights, dark atmosphere',
    horror: 'dark, unsettling, moody lighting',
    western: 'old west, dusty, warm tones',
    mystery: 'noir, dramatic shadows, 1940s style',
    postapoc: 'post-apocalyptic, wasteland, gritty',
    pirate: 'golden age of piracy, nautical, adventure',
    war: 'military, wartime, dramatic lighting, battlefield',
    custom: 'detailed portrait',
  };

  return `${role.name}, ${role.portraitPromptHints.join(', ')}, ${genreStyle[genre]}`;
}
