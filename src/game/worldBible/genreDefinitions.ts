// Genre Definitions - Complete contracts for each supported genre
import { GenreDefinition, TechTier, MagicRule } from './types';

// ============================================
// FANTASY - The default high fantasy setting
// ============================================
export const FANTASY_DEFINITION: GenreDefinition = {
  id: 'fantasy',
  name: 'High Fantasy',
  
  techTier: 'medieval',
  magicDefault: 'overt',
  speciesDefault: ['human', 'elf', 'dwarf', 'halfling', 'orc'],
  
  coreElements: [
    'swords', 'magic', 'dragons', 'castles', 'kingdoms', 'quests',
    'taverns', 'guilds', 'forests', 'dungeons', 'treasure', 'prophecy',
    'elves', 'dwarves', 'orcs', 'goblins', 'wizards', 'knights',
    'horses', 'spells', 'enchantment', 'curses', 'potions', 'artifacts'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['debt', 'rivalry', 'lost love', 'missing person', 'stolen goods'] },
    { tier: 2, beats: ['guild politics', 'noble intrigue', 'cursed item', 'haunted location'] },
    { tier: 3, beats: ['monster attack', 'plague', 'war brewing', 'prophecy revealed'] },
    { tier: 4, beats: ['demon summoning', 'dragon awakens', 'kingdom falls', 'ancient evil stirs'] },
    { tier: 5, beats: ['dark lord rises', 'apocalypse begins', 'gods intervene', 'realm-wide war'] },
    { tier: 6, beats: ['world ending', 'divine conflict', 'reality breaking', 'cosmic threat'] }
  ],
  
  hardBanned: [
    'lasers', 'computers', 'spaceships', 'robots', 'cybernetics', 'internet',
    'guns', 'cars', 'planes', 'electricity', 'nuclear', 'aliens'
  ],
  
  reskinRules: {
    'advanced_tech': 'enchanted contraption / dwarven mechanism',
    'gun': 'crossbow / wand',
    'car': 'magical carriage',
    'robot': 'golem / animated construct',
    'computer': 'scrying crystal / magical tome',
    'alien': 'planar being / otherworldly creature'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['heroic', 'epic', 'mythic', 'magical', 'noble', 'ancient'],
  
  vocabulary: {
    greetings: ['Hail', 'Well met', 'Greetings', 'Good morrow'],
    exclamations: ['By the gods!', 'Zounds!', 'Blood and thunder!', 'Great heavens!'],
    titles: ['Lord', 'Lady', 'Sir', 'Dame', 'Master', 'Mistress'],
    locations: ['tavern', 'castle', 'forest', 'dungeon', 'village', 'kingdom'],
    items: ['sword', 'staff', 'potion', 'scroll', 'armor', 'shield']
  }
};

// ============================================
// SCI-FI - Space opera and hard science fiction
// ============================================
export const SCIFI_DEFINITION: GenreDefinition = {
  id: 'scifi',
  name: 'Science Fiction',
  
  techTier: 'spacefaring',
  magicDefault: 'none',
  speciesDefault: ['human', 'android', 'alien'],
  
  coreElements: [
    'spaceships', 'lasers', 'planets', 'aliens', 'robots', 'AI',
    'space stations', 'warp drive', 'cybernetics', 'holograms',
    'plasma', 'quantum', 'terraforming', 'cryosleep', 'nanobots'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['system malfunction', 'cargo dispute', 'crew tension', 'minor accident'] },
    { tier: 2, beats: ['pirate encounter', 'corporate sabotage', 'alien contact', 'quarantine'] },
    { tier: 3, beats: ['ship damage', 'hostile boarding', 'planet evacuation', 'AI rebellion'] },
    { tier: 4, beats: ['fleet engagement', 'war declaration', 'plague outbreak', 'sun dying'] },
    { tier: 5, beats: ['alien invasion', 'dimensional rift', 'rogue AI god', 'galactic war'] },
    { tier: 6, beats: ['universe ending', 'reality collapse', 'cosmic entity', 'time paradox'] }
  ],
  
  hardBanned: [
    'dragons', 'elves', 'dwarves', 'magic', 'spells', 'wizards',
    'castles', 'swords', 'horses', 'medieval', 'fantasy', 'enchantment'
  ],
  
  reskinRules: {
    'magic': 'advanced technology / psionic ability',
    'wizard': 'scientist / technomancer',
    'dragon': 'bio-engineered creature / alien megafauna',
    'sword': 'energy blade / vibroblade',
    'castle': 'space station / megastructure',
    'horse': 'hoverbike / personal transport'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['futuristic', 'technological', 'cosmic', 'advanced', 'scientific'],
  
  vocabulary: {
    greetings: ['Commander', 'Citizen', 'Designation', 'Acknowledged'],
    exclamations: ['Stars above!', 'Void take it!', 'System failure!', 'By the cosmos!'],
    titles: ['Captain', 'Commander', 'Admiral', 'Director', 'Engineer', 'Doctor'],
    locations: ['station', 'colony', 'ship', 'sector', 'nebula', 'planet'],
    items: ['blaster', 'datapad', 'medkit', 'scanner', 'beacon', 'suit']
  }
};

// ============================================
// HORROR - Survival horror and cosmic dread
// ============================================
export const HORROR_DEFINITION: GenreDefinition = {
  id: 'horror',
  name: 'Horror',
  
  techTier: 'modern',
  magicDefault: 'hidden',
  speciesDefault: ['human', 'vampire', 'werewolf', 'ghost', 'demon'],
  
  coreElements: [
    'darkness', 'fear', 'dread', 'monsters', 'survival', 'isolation',
    'madness', 'death', 'blood', 'screams', 'shadows', 'nightmares',
    'abandoned', 'cursed', 'haunted', 'possessed', 'ritual', 'sacrifice'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['strange noise', 'missing item', 'bad feeling', 'odd behavior'] },
    { tier: 2, beats: ['sighting', 'injury', 'separation', 'dead phone', 'locked door'] },
    { tier: 3, beats: ['attack', 'death witness', 'revelation', 'no escape', 'betrayal'] },
    { tier: 4, beats: ['possession', 'transformation', 'mass death', 'entity reveal'] },
    { tier: 5, beats: ['apocalypse', 'madness', 'dimensional breach', 'unstoppable evil'] },
    { tier: 6, beats: ['cosmic horror', 'reality breaks', 'death itself', 'eternal torment'] }
  ],
  
  hardBanned: [
    'comedy', 'jokes', 'puns', 'slapstick', 'happy ending guarantee',
    'superhero powers', 'easy victory', 'safety assured'
  ],
  
  reskinRules: {
    'weapon': 'improvised defense / desperate measure',
    'victory': 'temporary reprieve / narrow escape',
    'ally': 'uncertain survivor / possible threat',
    'safety': 'false security / temporary shelter'
  },
  
  blendBehavior: 'modifier',
  
  toneKeywords: ['dread', 'terror', 'isolation', 'hopeless', 'dark', 'unknown', 'sinister'],
  
  vocabulary: {
    greetings: ['...', 'Who\'s there?', 'Stay back', 'Please...'],
    exclamations: ['Oh god!', 'No no no!', 'It\'s here!', 'Run!'],
    titles: ['Survivor', 'Victim', 'The Thing', 'It', 'Them'],
    locations: ['basement', 'attic', 'woods', 'asylum', 'morgue', 'cabin'],
    items: ['flashlight', 'matches', 'keys', 'phone', 'weapon', 'medicine']
  }
};

// ============================================
// MYSTERY - Noir detective and investigation
// ============================================
export const MYSTERY_DEFINITION: GenreDefinition = {
  id: 'mystery',
  name: 'Mystery Noir',
  
  techTier: 'modern',
  magicDefault: 'none',
  speciesDefault: ['human'],
  
  coreElements: [
    'clues', 'suspects', 'investigation', 'crime', 'deception', 'secrets',
    'evidence', 'alibis', 'motives', 'interrogation', 'witnesses', 'truth',
    'corruption', 'betrayal', 'shadows', 'rain', 'noir', 'detective'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['missing person', 'stolen item', 'strange behavior', 'anonymous tip'] },
    { tier: 2, beats: ['death threat', 'witness disappears', 'evidence planted', 'cover-up'] },
    { tier: 3, beats: ['murder', 'frame job', 'betrayal revealed', 'conspiracy deepens'] },
    { tier: 4, beats: ['multiple deaths', 'organization exposed', 'hunted', 'trusted ally turns'] },
    { tier: 5, beats: ['serial killer', 'city-wide conspiracy', 'powerful enemy', 'no one to trust'] },
    { tier: 6, beats: ['truth destroys everything', 'impossible choice', 'pyrrhic victory'] }
  ],
  
  hardBanned: [
    'magic', 'dragons', 'spells', 'fantasy creatures', 'spaceships', 'aliens',
    'supernatural guaranteed', 'easy answers'
  ],
  
  reskinRules: {
    'magic': 'sleight of hand / unexplained phenomenon',
    'monster': 'serial killer / deranged individual',
    'supernatural': 'psychological / unexplained',
    'fantasy_creature': 'costumed criminal / urban legend'
  },
  
  blendBehavior: 'modifier',
  
  toneKeywords: ['cynical', 'gritty', 'morally grey', 'atmospheric', 'tense', 'noir'],
  
  vocabulary: {
    greetings: ['Detective', 'What do you want?', 'Make it quick', 'Got a light?'],
    exclamations: ['Damn!', 'Son of a...', 'I knew it!', 'The bastard!'],
    titles: ['Detective', 'Chief', 'Boss', 'Witness', 'Suspect', 'Victim'],
    locations: ['office', 'alley', 'bar', 'precinct', 'crime scene', 'warehouse'],
    items: ['gun', 'badge', 'cigarette', 'flask', 'evidence bag', 'case file']
  }
};

// ============================================
// PIRATE - Age of sail adventure
// ============================================
export const PIRATE_DEFINITION: GenreDefinition = {
  id: 'pirate',
  name: 'Pirate Adventure',
  
  techTier: 'sailing',
  magicDefault: 'subtle',
  speciesDefault: ['human'],
  
  coreElements: [
    'ships', 'treasure', 'ports', 'cutlasses', 'cannons', 'rum',
    'islands', 'maps', 'crew', 'captain', 'navy', 'plunder',
    'sailing', 'storms', 'sea', 'gold', 'pirates', 'adventure'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['debt', 'rivalry', 'lost love', 'cargo dispute'] },
    { tier: 2, beats: ['mutiny brewing', 'traitor aboard', 'supplies low', 'bounty posted'] },
    { tier: 3, beats: ['storm', 'ship damage', 'lost at sea', 'disease outbreak'] },
    { tier: 4, beats: ['rival pirates', 'navy pursuit', 'blockade', 'ambush'] },
    { tier: 5, beats: ['cursed treasure', 'ghost ship', 'sea monster', 'marooned'] },
    { tier: 6, beats: ['sea god\'s wrath', 'leviathan', 'the kraken', 'davy jones'] }
  ],
  
  hardBanned: [
    'elves', 'lasers', 'cybernetics', 'dragons', 'spaceships', 'robots',
    'computers', 'cars', 'planes', 'magic wands', 'wizards'
  ],
  
  reskinRules: {
    'magic_user': 'sea witch / voodoo practitioner',
    'advanced_tech': 'clockwork curiosity / foreign contraption',
    'monster': 'sea beast / kraken spawn',
    'fantasy_race': 'weather-beaten islander / foreign sailor',
    'weapon': 'cutlass / flintlock pistol'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['adventurous', 'swashbuckling', 'nautical', 'dangerous', 'treasure'],
  
  vocabulary: {
    greetings: ['Ahoy!', 'Avast!', 'Yarr!', 'Well met, matey'],
    exclamations: ['Shiver me timbers!', 'Blimey!', 'Sink me!', 'By Davy Jones!'],
    titles: ['Captain', 'Quartermaster', 'First Mate', 'Bosun', 'Swab'],
    locations: ['ship', 'port', 'island', 'tavern', 'cove', 'treasure cave'],
    items: ['cutlass', 'pistol', 'compass', 'map', 'rum', 'doubloon']
  }
};

// ============================================
// WESTERN - Frontier and gunslinger tales
// ============================================
export const WESTERN_DEFINITION: GenreDefinition = {
  id: 'western',
  name: 'Wild West',
  
  techTier: 'industrial',
  magicDefault: 'none',
  speciesDefault: ['human'],
  
  coreElements: [
    'horses', 'guns', 'saloons', 'sheriffs', 'outlaws', 'frontier',
    'desert', 'gold', 'trains', 'duels', 'bounties', 'justice',
    'cowboys', 'ranches', 'mining', 'wanted posters', 'stagecoach'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['bar fight', 'horse theft', 'card cheat', 'stranger in town'] },
    { tier: 2, beats: ['robbery', 'bounty hunter', 'land dispute', 'love triangle'] },
    { tier: 3, beats: ['shootout', 'posse chase', 'train heist', 'kidnapping'] },
    { tier: 4, beats: ['gang war', 'corrupt sheriff', 'siege', 'betrayal'] },
    { tier: 5, beats: ['legendary outlaw', 'army involvement', 'town massacre', 'final stand'] },
    { tier: 6, beats: ['last gunfighter', 'end of the frontier', 'redemption or damnation'] }
  ],
  
  hardBanned: [
    'magic', 'dragons', 'elves', 'spaceships', 'lasers', 'robots',
    'cybernetics', 'aliens', 'wizards', 'castles'
  ],
  
  reskinRules: {
    'magic': 'superstition / native mysticism',
    'monster': 'dangerous animal / legendary creature',
    'advanced_tech': 'newfangled invention / eastern contraption',
    'fantasy_race': 'foreigner / drifter'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['gritty', 'dusty', 'lawless', 'frontier', 'honor', 'revenge'],
  
  vocabulary: {
    greetings: ['Howdy', 'Partner', 'Stranger', 'Mornin\''],
    exclamations: ['Tarnation!', 'Consarn it!', 'Well I\'ll be!', 'Draw!'],
    titles: ['Sheriff', 'Deputy', 'Marshal', 'Doc', 'Ma\'am', 'Mister'],
    locations: ['saloon', 'ranch', 'mine', 'jail', 'canyon', 'prairie'],
    items: ['revolver', 'rifle', 'lasso', 'saddle', 'whiskey', 'badge']
  }
};

// ============================================
// CYBERPUNK - Dystopian high-tech low-life
// ============================================
export const CYBERPUNK_DEFINITION: GenreDefinition = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  
  techTier: 'nearfuture',
  magicDefault: 'none',
  speciesDefault: ['human', 'android', 'construct'],
  
  coreElements: [
    'cybernetics', 'hacking', 'corporations', 'neon', 'rain', 'megacities',
    'AI', 'neural interfaces', 'black markets', 'drones', 'surveillance',
    'inequality', 'body modification', 'virtual reality', 'street gangs'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['data theft', 'gang dispute', 'debt collection', 'missing person'] },
    { tier: 2, beats: ['corporate interest', 'cyberpsychosis', 'police attention', 'frame job'] },
    { tier: 3, beats: ['assassin contract', 'building siege', 'viral outbreak', 'system crash'] },
    { tier: 4, beats: ['corpo war', 'AI awakening', 'city lockdown', 'betrayal cascade'] },
    { tier: 5, beats: ['megacorp collapse', 'rogue AI god', 'mass uprising', 'nuclear option'] },
    { tier: 6, beats: ['system collapse', 'humanity\'s choice', 'transcendence or extinction'] }
  ],
  
  hardBanned: [
    'dragons', 'elves', 'magic', 'medieval', 'horses', 'swords',
    'castles', 'wizards', 'fantasy', 'enchantment'
  ],
  
  reskinRules: {
    'magic': 'advanced cyberware / experimental tech',
    'wizard': 'elite hacker / tech savant',
    'dragon': 'combat mech / corporate enforcer',
    'sword': 'monofilament blade / vibroblade',
    'fantasy_creature': 'genetic experiment / bio-mod'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['dark', 'neon', 'corporate', 'rebellious', 'augmented', 'dystopian'],
  
  vocabulary: {
    greetings: ['Choom', 'Netrunner', 'Corpo', 'Delta'],
    exclamations: ['Preem!', 'Nova!', 'Flatlined!', 'Zeroed!'],
    titles: ['Fixer', 'Edgerunner', 'Netrunner', 'Solo', 'Techie', 'Corpo'],
    locations: ['megabuilding', 'club', 'server farm', 'black market', 'corpo tower'],
    items: ['deck', 'chrome', 'credchip', 'stim', 'implant', 'piece']
  }
};

// ============================================
// POST-APOCALYPTIC - Survival after the fall
// ============================================
export const POSTAPOC_DEFINITION: GenreDefinition = {
  id: 'postapoc',
  name: 'Post-Apocalyptic',
  
  techTier: 'industrial', // Mix of scavenged modern and primitive
  magicDefault: 'none',
  speciesDefault: ['human', 'mutant'],
  
  coreElements: [
    'wasteland', 'survival', 'scavenging', 'radiation', 'ruins', 'tribes',
    'raiders', 'settlements', 'trade routes', 'water', 'food', 'shelter',
    'mutations', 'bunkers', 'vehicles', 'salvage', 'hope'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['supply shortage', 'stranger arrives', 'animal attack', 'weather danger'] },
    { tier: 2, beats: ['raider scouts', 'disease', 'resource conflict', 'betrayal'] },
    { tier: 3, beats: ['raider attack', 'settlement falls', 'radiation storm', 'mutation'] },
    { tier: 4, beats: ['war between settlements', 'plague', 'tyrant rises', 'exodus'] },
    { tier: 5, beats: ['army of raiders', 'nuclear fallout', 'mutant horde', 'bunker secrets'] },
    { tier: 6, beats: ['second apocalypse', 'humanity\'s last stand', 'new beginning or end'] }
  ],
  
  hardBanned: [
    'magic', 'dragons', 'elves', 'spaceships', 'working internet',
    'abundant resources', 'safe civilization', 'easy travel'
  ],
  
  reskinRules: {
    'magic': 'radiation mutation / unexplained phenomenon',
    'advanced_tech': 'pre-war relic / salvaged tech',
    'monster': 'irradiated beast / mutant creature',
    'fantasy_race': 'mutant strain / tribal variant'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['harsh', 'desperate', 'survival', 'hope', 'ruin', 'scarcity'],
  
  vocabulary: {
    greetings: ['Survivor', 'Wastelander', 'Outsider', 'Trader'],
    exclamations: ['Rad storms!', 'Raiders!', 'Clear skies!', 'Fresh water!'],
    titles: ['Elder', 'Scav', 'Trader', 'Raider', 'Settler', 'Wanderer'],
    locations: ['bunker', 'ruin', 'settlement', 'wasteland', 'oasis', 'vault'],
    items: ['caps', 'rations', 'rad-away', 'weapon', 'water', 'salvage']
  }
};

// ============================================
// WAR - Military conflict across eras
// ============================================
export const WAR_DEFINITION: GenreDefinition = {
  id: 'war',
  name: 'War',
  
  techTier: 'modern', // Default, overridden by era
  magicDefault: 'none',
  speciesDefault: ['human'],
  
  coreElements: [
    'combat', 'soldiers', 'tactics', 'command', 'sacrifice', 'brotherhood',
    'enemies', 'mission', 'supply lines', 'casualties', 'victory', 'defeat',
    'duty', 'honor', 'trauma', 'survival', 'leadership', 'frontline'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['patrol', 'supply run', 'new recruits', 'waiting'] },
    { tier: 2, beats: ['skirmish', 'ambush', 'casualties', 'equipment failure'] },
    { tier: 3, beats: ['major engagement', 'siege', 'retreat', 'surrounded'] },
    { tier: 4, beats: ['battle', 'heavy losses', 'command breakdown', 'POW'] },
    { tier: 5, beats: ['offensive', 'last stand', 'enemy breakthrough', 'city falls'] },
    { tier: 6, beats: ['total war', 'final battle', 'victory or annihilation'] }
  ],
  
  hardBanned: [
    'magic', 'dragons', 'elves', 'fantasy', 'easy victory',
    'war is glorious', 'no consequences'
  ],
  
  reskinRules: {
    'magic': 'advanced weapon / experimental tech',
    'monster': 'enemy soldier / war machine',
    'fantasy_creature': 'combat unit / specialized force'
  },
  
  blendBehavior: 'additive',
  
  toneKeywords: ['brutal', 'tense', 'heroic', 'tragic', 'duty', 'sacrifice'],
  
  vocabulary: {
    greetings: ['Soldier', 'Private', 'Sir', 'Comrade'],
    exclamations: ['Contact!', 'Incoming!', 'Move!', 'Medic!'],
    titles: ['Private', 'Sergeant', 'Lieutenant', 'Captain', 'Colonel', 'General'],
    locations: ['bunker', 'trench', 'HQ', 'field hospital', 'frontline', 'camp'],
    items: ['rifle', 'ammo', 'rations', 'helmet', 'radio', 'medkit']
  }
};

// ============================================
// COSMIC HORROR - Lovecraftian dread (modifier genre)
// ============================================
export const COSMIC_HORROR_DEFINITION: GenreDefinition = {
  id: 'cosmic_horror',
  name: 'Cosmic Horror',
  
  techTier: 'modern',
  magicDefault: 'forbidden',
  speciesDefault: ['human'],
  
  coreElements: [
    'insignificance', 'unknowable', 'madness', 'ancient', 'cosmic',
    'dread', 'forbidden knowledge', 'cultists', 'dreams', 'stars',
    'geometry', 'whispers', 'abyss', 'void', 'beyond'
  ],
  
  escalationLadder: [
    { tier: 1, beats: ['strange dreams', 'odd coincidence', 'unsettling art', 'wrong stars'] },
    { tier: 2, beats: ['whispers', 'sanity slip', 'time confusion', 'impossible geometry'] },
    { tier: 3, beats: ['cult discovery', 'entity glimpse', 'madness spreads', 'reality bends'] },
    { tier: 4, beats: ['transformation begins', 'stars align', 'mass madness', 'calling'] },
    { tier: 5, beats: ['gate opens', 'entity manifests', 'humanity irrelevant', 'choice'] },
    { tier: 6, beats: ['awakening', 'beyond time', 'eternal', 'the end is the beginning'] }
  ],
  
  hardBanned: [
    'understanding', 'victory against', 'defeating entity', 'safe ending',
    'comprehensible evil', 'simple answers'
  ],
  
  reskinRules: {
    'monster': 'that which cannot be named / the presence',
    'magic': 'the gift of knowing / corruption',
    'victory': 'temporary delay / merciful oblivion'
  },
  
  // This is a MODIFIER genre - it changes tone, not entities
  blendBehavior: 'modifier',
  
  toneKeywords: ['dread', 'cosmic', 'insignificant', 'unknowable', 'ancient', 'mad'],
  
  vocabulary: {
    greetings: ['...', 'You\'ve seen it too', 'They\'re watching', 'The stars...'],
    exclamations: ['It cannot be!', 'The geometry!', 'In the angles!', 'Ph\'nglui...'],
    titles: ['The Dreamer', 'The Witness', 'The Vessel', 'The Lost'],
    locations: ['the deep', 'beyond', 'the threshold', 'non-euclidean space'],
    items: ['tome', 'idol', 'star map', 'dreams', 'truth', 'madness']
  }
};

// ============================================
// GENRE REGISTRY
// ============================================
export const GENRE_DEFINITIONS: Record<string, GenreDefinition> = {
  'fantasy': FANTASY_DEFINITION,
  'scifi': SCIFI_DEFINITION,
  'horror': HORROR_DEFINITION,
  'mystery': MYSTERY_DEFINITION,
  'pirate': PIRATE_DEFINITION,
  'western': WESTERN_DEFINITION,
  'cyberpunk': CYBERPUNK_DEFINITION,
  'postapoc': POSTAPOC_DEFINITION,
  'war': WAR_DEFINITION,
  'cosmic_horror': COSMIC_HORROR_DEFINITION,
};

// Get definition with fallback
export function getGenreDefinition(genreId: string): GenreDefinition | null {
  return GENRE_DEFINITIONS[genreId] || null;
}

// Get all core elements for a genre (including blends)
export function getCoreElements(primaryId: string, secondaryIds: string[] = []): string[] {
  const primary = getGenreDefinition(primaryId);
  if (!primary) return [];
  
  const elements = [...primary.coreElements];
  
  for (const secId of secondaryIds) {
    const secondary = getGenreDefinition(secId);
    if (secondary && secondary.blendBehavior === 'additive') {
      // Only add a portion of secondary elements
      const portion = secondary.coreElements.slice(0, 10);
      elements.push(...portion);
    }
  }
  
  return [...new Set(elements)];
}

// Get combined banned elements
export function getBannedElements(primaryId: string, secondaryIds: string[] = []): string[] {
  const primary = getGenreDefinition(primaryId);
  if (!primary) return [];
  
  const banned = [...primary.hardBanned];
  
  // Secondary genres can remove items from banned list
  for (const secId of secondaryIds) {
    const secondary = getGenreDefinition(secId);
    if (secondary) {
      // Remove secondary's core elements from banned
      for (const elem of secondary.coreElements) {
        const idx = banned.indexOf(elem);
        if (idx > -1) banned.splice(idx, 1);
      }
    }
  }
  
  return [...new Set(banned)];
}
