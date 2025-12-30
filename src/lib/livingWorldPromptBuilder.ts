/**
 * Living World Engine - Together.ai Image Prompt Builder
 * Generates ToS-compliant prompts with genre keywords and strong item adherence
 */

// ============================================================================
// GENRE KEYWORD BANKS
// ============================================================================

export const GENRE_KEYWORDS = {
  medieval: {
    environment: [
      'castle', 'fortress', 'tavern', 'village', 'kingdom', 'dungeon', 'throne room',
      'cobblestone streets', 'thatched roof', 'stone walls', 'moat', 'drawbridge',
      'great hall', 'blacksmith forge', 'market square', 'cathedral', 'monastery',
      'watchtower', 'ramparts', 'courtyard', 'stables', 'armory'
    ],
    atmosphere: [
      'torchlit', 'candlelit', 'misty morning', 'golden hour', 'dramatic shadows',
      'medieval ambiance', 'rustic', 'ancient', 'weathered stone', 'moss-covered',
      'battle-scarred', 'regal', 'mystical', 'enchanted', 'foreboding'
    ],
    items: [
      'longsword', 'broadsword', 'dagger', 'crossbow', 'longbow', 'war hammer',
      'battle axe', 'mace', 'flail', 'halberd', 'pike', 'shield', 'chainmail',
      'plate armor', 'leather armor', 'helmet', 'gauntlets', 'greaves',
      'goblet', 'chalice', 'tome', 'scroll', 'quill', 'wax seal', 'banner',
      'crown', 'scepter', 'amulet', 'ring', 'potion bottle', 'herbs'
    ],
    characters: [
      'knight', 'peasant', 'noble', 'king', 'queen', 'wizard', 'witch',
      'blacksmith', 'merchant', 'bard', 'monk', 'nun', 'squire', 'herald',
      'huntsman', 'stable hand', 'serving wench', 'court jester', 'alchemist'
    ],
    style: [
      'oil painting style', 'illuminated manuscript', 'tapestry art',
      'classical realism', 'romantic era painting', 'pre-raphaelite'
    ],
    everydayActivities: [
      'blacksmith hammering', 'baker kneading dough', 'washing clothes in stream',
      'tending livestock', 'harvesting crops', 'spinning wool', 'weaving tapestry'
    ],
    socialDynamics: [
      'lord addressing peasants', 'knights jousting', 'merchants haggling',
      'monks in prayer', 'nobles at feast', 'villagers at well'
    ],
    intimateMoments: [
      'sharing mead by firelight', 'dancing at harvest festival',
      'secret meeting in garden', 'reading poetry together'
    ]
  },

  modern: {
    environment: [
      'city street', 'apartment', 'office building', 'suburban home', 'coffee shop',
      'nightclub', 'restaurant', 'shopping mall', 'parking garage', 'hospital',
      'police station', 'courtroom', 'school', 'university', 'gym', 'park',
      'beach', 'highway', 'gas station', 'convenience store', 'warehouse'
    ],
    atmosphere: [
      'neon lights', 'fluorescent lighting', 'natural daylight', 'overcast',
      'rainy day', 'sunny afternoon', 'urban gritty', 'clean modern', 'cozy',
      'sterile', 'lived-in', 'bustling', 'quiet suburban', 'downtown busy'
    ],
    items: [
      'smartphone', 'laptop', 'car keys', 'wallet', 'credit card', 'coffee cup',
      'briefcase', 'backpack', 'sunglasses', 'wristwatch', 'headphones',
      'tablet', 'television', 'microwave', 'refrigerator', 'desk lamp',
      'office chair', 'filing cabinet', 'whiteboard', 'printer'
    ],
    weapons: [
      'handgun', 'pistol', 'revolver', 'rifle', 'shotgun', 'submachine gun',
      'assault rifle', 'sniper rifle', 'tactical knife', 'combat knife',
      'baton', 'taser', 'pepper spray', 'brass knuckles'
    ],
    characters: [
      'businessman', 'office worker', 'student', 'teacher', 'doctor', 'nurse',
      'police officer', 'firefighter', 'chef', 'waiter', 'bartender',
      'mechanic', 'construction worker', 'athlete', 'artist', 'musician'
    ],
    style: [
      'photorealistic', 'contemporary photography', 'urban photography',
      'lifestyle photography', 'documentary style', 'cinematic'
    ],
    everydayActivities: [
      'typing on laptop at cafe', 'jogging in park', 'grocery shopping',
      'commuting on subway', 'walking dog', 'cooking dinner'
    ],
    socialDynamics: [
      'coworkers at lunch', 'friends at bar', 'family dinner',
      'networking event', 'book club meeting', 'pickup basketball game'
    ],
    intimateMoments: [
      'slow dancing in kitchen', 'watching sunset from rooftop',
      'cuddling on couch with movie', 'breakfast in bed'
    ]
  },

  cyberpunk: {
    environment: [
      'megacity', 'neon-lit alley', 'corporate tower', 'underground club',
      'black market', 'hacker den', 'chrome bar', 'rooftop garden', 'slums',
      'elevated highway', 'holographic billboard district', 'data center',
      'cybernetic clinic', 'virtual reality arcade', 'smuggler hideout'
    ],
    atmosphere: [
      'neon-soaked', 'rain-slicked streets', 'holographic advertisements',
      'perpetual night', 'smog-filled sky', 'electric blue glow', 'pink neon',
      'harsh contrast lighting', 'dystopian', 'high-tech low-life',
      'corporate sterile', 'underground grimy', 'digital noise'
    ],
    items: [
      'cyberdeck', 'neural interface', 'holographic display', 'smart gun',
      'plasma pistol', 'laser rifle', 'EMP grenade', 'hacking tool',
      'augmented reality glasses', 'cybernetic arm', 'synthetic eye',
      'data chip', 'credstick', 'hover bike', 'drone', 'nano-injector'
    ],
    augmentations: [
      'chrome arm', 'cybernetic eye', 'neural implant', 'subdermal armor',
      'reflex booster', 'muscle grafts', 'dermal plating', 'tech hair',
      'LED tattoos', 'synthetic skin', 'mechanical spine'
    ],
    characters: [
      'netrunner', 'street samurai', 'corporate executive', 'fixer',
      'smuggler', 'bounty hunter', 'tech specialist', 'mercenary',
      'hacker', 'synth dealer', 'black market doc', 'gang member'
    ],
    style: [
      'cyberpunk aesthetic', 'blade runner style', 'neon noir',
      'futuristic digital art', 'sci-fi concept art', 'synthwave art'
    ],
    everydayActivities: [
      'jacking into the net', 'tuning cybernetics', 'trading data chips',
      'drinking synth-coffee', 'watching holo-news', 'maintaining augments'
    ],
    socialDynamics: [
      'hackers sharing intel', 'gang negotiations', 'corporate espionage meeting',
      'fixers making deals', 'mercs comparing chrome', 'street racing'
    ],
    intimateMoments: [
      'sharing neural link experience', 'watching neon rain together',
      'syncing augmented senses', 'quiet moment in neon-lit apartment'
    ]
  },

  postApocalyptic: {
    environment: [
      'ruined city', 'abandoned building', 'wasteland', 'bunker', 'settlement',
      'scrapyard', 'toxic swamp', 'crumbling highway', 'overgrown mall',
      'military base ruins', 'collapsed bridge', 'survivor camp',
      'radiation zone', 'desert wasteland', 'flooded streets'
    ],
    atmosphere: [
      'dust-filled air', 'orange hazed sky', 'desolate', 'eerie quiet',
      'harsh sunlight', 'perpetual overcast', 'radioactive glow',
      'nature reclaiming', 'crumbling decay', 'survival desperation',
      'makeshift repairs', 'scavenged aesthetics'
    ],
    items: [
      'gas mask', 'radiation suit', 'makeshift weapon', 'scrap armor',
      'water canteen', 'canned food', 'med kit', 'geiger counter',
      'survival knife', 'pipe rifle', 'molotov cocktail', 'crowbar',
      'flashlight', 'sleeping bag', 'rope', 'duct tape', 'toolbox'
    ],
    weapons: [
      'pipe rifle', 'sawed-off shotgun', 'machete', 'baseball bat with nails',
      'crossbow', 'hunting rifle', 'improvised spear', 'flamethrower',
      'tire iron', 'sledgehammer', 'combat shotgun', 'scoped rifle'
    ],
    characters: [
      'wasteland wanderer', 'scavenger', 'raider', 'settlement leader',
      'caravan guard', 'mutant', 'scientist survivor', 'mechanic',
      'doctor', 'trader', 'cult member', 'bounty hunter'
    ],
    style: [
      'post-apocalyptic art', 'fallout style', 'mad max aesthetic',
      'gritty realism', 'survival horror', 'wasteland concept art'
    ],
    everydayActivities: [
      'scavenging ruins', 'purifying water', 'repairing equipment',
      'tending crops in shelter', 'trading at market', 'standing watch'
    ],
    socialDynamics: [
      'survivors sharing fire', 'traders bartering', 'settlement meeting',
      'scavenger teams planning', 'defending camp', 'teaching newcomers'
    ],
    intimateMoments: [
      'sharing rations by fire', 'quiet moment watching stars',
      'finding beauty in ruins together', 'comfort after raid'
    ]
  },

  fantasy: {
    environment: [
      'enchanted forest', 'magical tower', 'elven city', 'dwarven mine',
      'dragon lair', 'fairy glen', 'crystal cave', 'floating island',
      'ancient ruins', 'magical academy', 'sacred grove', 'demon realm',
      'celestial palace', 'underwater kingdom', 'witch cottage'
    ],
    atmosphere: [
      'magical glow', 'ethereal mist', 'starlit', 'aurora borealis',
      'golden sunbeams', 'mystical fog', 'bioluminescent', 'enchanted',
      'otherworldly', 'divine radiance', 'dark magic aura', 'primal nature'
    ],
    items: [
      'magic wand', 'staff', 'spellbook', 'crystal ball', 'enchanted sword',
      'magic ring', 'flying carpet', 'potion', 'scroll', 'rune stone',
      'amulet', 'orb', 'magical gem', 'fairy dust', 'dragon scale',
      'phoenix feather', 'unicorn horn', 'enchanted mirror'
    ],
    creatures: [
      'dragon', 'unicorn', 'phoenix', 'griffin', 'fairy', 'elf', 'dwarf',
      'orc', 'goblin', 'troll', 'giant', 'mermaid', 'centaur', 'minotaur',
      'werewolf', 'vampire', 'demon', 'angel', 'elemental'
    ],
    characters: [
      'wizard', 'witch', 'sorcerer', 'paladin', 'ranger', 'druid', 'bard',
      'rogue', 'cleric', 'warlock', 'necromancer', 'elementalist',
      'beast tamer', 'enchanter', 'archmage'
    ],
    style: [
      'fantasy art', 'high fantasy illustration', 'magical realism',
      'fairy tale art', 'epic fantasy', 'dark fantasy'
    ],
    everydayActivities: [
      'brewing potions', 'studying ancient tomes', 'tending magical garden',
      'practicing spellwork', 'forging enchanted items', 'communing with spirits'
    ],
    socialDynamics: [
      'wizards debating magic', 'adventurers at tavern', 'elven council',
      'dwarven feast', 'guild meeting', 'marketplace of wonders'
    ],
    intimateMoments: [
      'stargazing from tower', 'dancing at fairy circle',
      'sharing magical bond', 'quiet moment in enchanted glade'
    ]
  },

  sciFi: {
    environment: [
      'space station', 'starship bridge', 'alien planet', 'moon base',
      'terraformed world', 'asteroid mining facility', 'orbital habitat',
      'hyperspace', 'alien ruins', 'research lab', 'cryo bay',
      'cargo hold', 'engineering deck', 'observation deck'
    ],
    atmosphere: [
      'zero gravity', 'sterile white', 'bioluminescent alien', 'starfield',
      'nebula backdrop', 'planetary rings', 'artificial lighting',
      'holographic displays', 'clean futuristic', 'deep space isolation',
      'alien atmosphere', 'harsh vacuum'
    ],
    items: [
      'laser pistol', 'plasma rifle', 'energy sword', 'force field',
      'teleporter', 'hologram projector', 'scanner', 'communicator',
      'space suit', 'jetpack', 'gravity boots', 'neural link',
      'stasis pod', 'med bay scanner', 'star map', 'power cell'
    ],
    vehicles: [
      'starship', 'shuttle', 'fighter craft', 'hover vehicle', 'mech suit',
      'space pod', 'dropship', 'cruiser', 'freighter', 'exploration vessel'
    ],
    characters: [
      'space captain', 'pilot', 'engineer', 'scientist', 'marine',
      'alien diplomat', 'bounty hunter', 'smuggler', 'colonist',
      'android', 'AI hologram', 'medic', 'xenobiologist'
    ],
    style: [
      'sci-fi concept art', 'space opera', 'hard science fiction',
      'retro futurism', 'clean sci-fi', 'alien aesthetic'
    ],
    everydayActivities: [
      'monitoring ship systems', 'running diagnostics', 'charting star routes',
      'exercising in low gravity', 'tending hydroponics', 'analyzing samples'
    ],
    socialDynamics: [
      'crew briefing', 'first contact protocol', 'trading with aliens',
      'diplomatic negotiations', 'engineering team solving problem'
    ],
    intimateMoments: [
      'watching stars from observation deck', 'sharing meal in quarters',
      'quiet moment before mission', 'reunion after long voyage'
    ]
  },

  horror: {
    environment: [
      'haunted house', 'abandoned asylum', 'dark forest', 'cemetery',
      'crypt', 'morgue', 'cursed village', 'fog-shrouded moor',
      'decrepit mansion', 'underground tunnel', 'sacrificial altar',
      'nightmare realm', 'twisted carnival', 'blood-stained room'
    ],
    atmosphere: [
      'oppressive darkness', 'flickering lights', 'thick fog', 'moonlit',
      'blood red', 'sickly green', 'shadow-filled', 'claustrophobic',
      'unsettling', 'dread-inducing', 'decay and rot', 'supernatural chill'
    ],
    items: [
      'candelabra', 'ouija board', 'cursed doll', 'ancient tome',
      'ritual knife', 'pentagram', 'skull', 'coffin', 'chains',
      'medical tools', 'bloody weapon', 'haunted photograph',
      'creepy music box', 'voodoo doll', 'crystal pendant'
    ],
    creatures: [
      'ghost', 'demon', 'vampire', 'werewolf', 'zombie', 'witch',
      'eldritch horror', 'shadow creature', 'possessed human',
      'serial killer', 'cult leader', 'mad scientist'
    ],
    style: [
      'horror art', 'gothic horror', 'psychological horror',
      'dark surrealism', 'nightmare fuel', 'eldritch art'
    ],
    everydayActivities: [
      'investigating strange sounds', 'reading forbidden texts',
      'performing protective rituals', 'searching for clues', 'fleeing danger'
    ],
    socialDynamics: [
      'survivors huddled together', 'occult gathering', 'investigation team',
      'villagers warning travelers', 'seance circle'
    ],
    intimateMoments: [
      'comfort in darkness', 'protecting each other from terror',
      'finding solace in nightmare', 'brief respite from horror'
    ]
  },

  western: {
    environment: [
      'dusty town', 'saloon', 'desert canyon', 'frontier settlement',
      'ranch', 'gold mine', 'train station', 'sheriff office', 'bank',
      'general store', 'livery stable', 'cemetery boot hill',
      'campfire under stars', 'river crossing', 'mountain pass'
    ],
    atmosphere: [
      'golden hour desert', 'high noon harsh light', 'dusty wind',
      'sunset silhouette', 'rustic frontier', 'lawless', 'weathered wood',
      'tumbleweeds', 'heat shimmer', 'starlit prairie'
    ],
    items: [
      'revolver', 'rifle', 'shotgun', 'lasso', 'cowboy hat', 'boots',
      'spurs', 'bandana', 'saddle', 'horseshoe', 'whiskey bottle',
      'poker chips', 'wanted poster', 'sheriff badge', 'bowie knife',
      'dynamite', 'gold nugget', 'oil lamp'
    ],
    characters: [
      'cowboy', 'outlaw', 'sheriff', 'deputy', 'saloon girl', 'bartender',
      'blacksmith', 'prospector', 'bounty hunter', 'Native American',
      'cavalry soldier', 'ranch hand', 'gambler', 'preacher'
    ],
    style: [
      'western art', 'spaghetti western', 'frontier painting',
      'cowboy illustration', 'old west photography style'
    ],
    everydayActivities: [
      'riding the range', 'tending cattle', 'playing poker',
      'panning for gold', 'breaking horses', 'mending fences'
    ],
    socialDynamics: [
      'showdown at high noon', 'saloon poker game', 'cattle drive',
      'town meeting', 'campfire stories', 'trading at post'
    ],
    intimateMoments: [
      'dancing at barn dance', 'stargazing on prairie',
      'quiet moment at sunset', 'sharing campfire warmth'
    ]
  },

  noir: {
    environment: [
      'rainy city street', 'detective office', 'smoky bar', 'jazz club',
      'back alley', 'warehouse', 'docks', 'luxury penthouse',
      'seedy motel', 'interrogation room', 'gambling den', 'newsroom'
    ],
    atmosphere: [
      'high contrast shadows', 'venetian blind lighting', 'cigarette smoke',
      'rain-slicked streets', 'neon sign glow', 'black and white',
      'moody lighting', 'mystery atmosphere', 'femme fatale ambiance',
      'danger lurking', '1940s aesthetic'
    ],
    items: [
      'fedora', 'trench coat', 'cigarette', 'whiskey glass', 'revolver',
      'typewriter', 'newspaper', 'magnifying glass', 'evidence folder',
      'camera', 'telephone', 'briefcase with money', 'switchblade'
    ],
    characters: [
      'private detective', 'femme fatale', 'corrupt cop', 'mob boss',
      'informant', 'nightclub singer', 'journalist', 'politician',
      'wealthy widow', 'hired muscle', 'mysterious stranger'
    ],
    style: [
      'film noir', 'classic noir photography', 'hardboiled detective',
      'neo-noir', 'chiaroscuro lighting', 'dramatic shadows'
    ],
    everydayActivities: [
      'staking out location', 'interviewing witnesses', 'following leads',
      'typing case notes', 'drinking at bar', 'developing photographs'
    ],
    socialDynamics: [
      'interrogation scene', 'meeting informant', 'confronting suspect',
      'negotiations in back room', 'tense standoff'
    ],
    intimateMoments: [
      'slow dance at jazz club', 'confession over whiskey',
      'quiet moment in rain', 'vulnerability in shadows'
    ]
  },

  steampunk: {
    environment: [
      'victorian city', 'airship dock', 'clockwork factory', 'inventor workshop',
      'brass-fitted mansion', 'underground laboratory', 'steam train',
      'gear-filled chamber', 'observatory', 'automaton factory',
      'sky pirate ship', 'coal-powered plant'
    ],
    atmosphere: [
      'brass and copper tones', 'steam clouds', 'gas lamp lighting',
      'industrial revolution', 'victorian elegance', 'mechanical wonder',
      'coal smoke', 'gear mechanisms visible', 'retrofuturistic'
    ],
    items: [
      'pocket watch', 'goggles', 'brass telescope', 'steam pistol',
      'clockwork device', 'mechanical arm', 'airship', 'top hat',
      'corset', 'cane sword', 'ray gun', 'aether device',
      'difference engine', 'pneumatic tube', 'dirigible'
    ],
    characters: [
      'inventor', 'airship captain', 'engineer', 'aristocrat',
      'street urchin', 'automaton', 'sky pirate', 'mad scientist',
      'clockwork mechanic', 'adventurer', 'society lady'
    ],
    style: [
      'steampunk art', 'victorian sci-fi', 'brass age aesthetic',
      'clockpunk', 'industrial fantasy', 'retrofuturism'
    ],
    everydayActivities: [
      'tinkering with gadgets', 'polishing brass fixtures', 'reading penny dreadfuls',
      'attending society events', 'maintaining automatons', 'brewing tea'
    ],
    socialDynamics: [
      'inventors guild meeting', 'high society ball', 'airship crew planning',
      'underground resistance', 'scientific debate', 'market bazaar'
    ],
    intimateMoments: [
      'dancing at gaslit ball', 'sharing invention discoveries',
      'quiet moment in observatory', 'watching city from airship'
    ]
  }
} as const;

// ============================================================================
// ITEM DETECTION & EMPHASIS SYSTEM
// ============================================================================

export interface DetectedItem {
  original: string;
  emphasized: string;
  category: 'weapon' | 'object' | 'color' | 'creature' | 'character' | 'environment' | 'style' | 'gesture';
  confidence: number;
}

// ============================================================================
// GESTURE & POSE DETECTION - Including Rocker Salute (Devil Horns)
// ============================================================================

/**
 * Rocker Salute / Devil Horns / Metal Horns
 * 
 * The iconic hand gesture of rock and metal culture:
 * - Index finger and pinky extended upward
 * - Middle and ring fingers curled into palm
 * - Thumb either tucked across curled fingers or extended
 * 
 * Also known as:
 * - "The Horns" / "Devil Horns" / "Metal Horns"
 * - "Mano Cornuta" (Italian: horned hand)
 * - "Sign of the Horns"
 * - "Rock on" gesture
 * - "Hook 'em Horns" (Texas Longhorns)
 * - "Corna" / "Cornuto"
 * - Popularized by Ronnie James Dio in heavy metal
 */
const ROCKER_SALUTE_PATTERNS = [
  // Direct references
  /\b(rocker\s*salute|rock\s*salute|metal\s*salute)\b/gi,
  /\b(devil\s*horns?|metal\s*horns?|rock\s*horns?|the\s*horns?)\b/gi,
  /\b(sign\s*of\s*(the\s*)?horns?|horns?\s*sign|horned\s*hand)\b/gi,
  /\b(mano\s*cornuta|corna|cornuto)\b/gi,
  
  // Action phrases
  /\b(throw(ing|s)?\s*(up\s*)?(the\s*)?(horns?|metal|devil))\b/gi,
  /\b(flash(ing|es)?\s*(the\s*)?(horns?|metal|devil))\b/gi,
  /\b(raise[sd]?\s*(the\s*)?(horns?|metal))\b/gi,
  /\b(rock(ing)?\s*on|rocks?\s*out)\b/gi,
  /\b(hook\s*'?em\s*horns?)\b/gi,
  
  // Finger descriptions
  /\b(index\s*and\s*pinky\s*(fingers?\s*)?(extended|up|raised))\b/gi,
  /\b(pinky\s*and\s*index\s*(fingers?\s*)?(extended|up|raised))\b/gi,
  
  // Cultural references
  /\b(dio\s*salute|ronnie\s*(james\s*)?dio\s*gesture)\b/gi,
  /\b(headbanger('s)?\s*(salute|gesture|sign))\b/gi,
  /\b(metalhead\s*(salute|gesture|sign))\b/gi
];

/**
 * Detailed prompt enhancement for accurate rocker salute rendering
 */
const ROCKER_SALUTE_EMPHASIS = {
  base: '((rocker salute hand gesture)), ((devil horns hand sign)), index finger and pinky finger extended upward, middle and ring fingers curled into palm, iconic metal gesture',
  anatomyDetails: 'correct hand anatomy, five fingers clearly visible, proper finger positioning, realistic hand proportions',
  styleVariants: {
    aggressive: 'aggressive rocker salute, powerful gesture, intense expression, rock attitude',
    casual: 'casual devil horns, relaxed rock gesture, friendly metal salute',
    triumphant: 'triumphant horns raised high, victory metal salute, celebratory rock gesture',
    subtle: 'subtle horn gesture, understated metal acknowledgment, cool rocker sign'
  },
  contextual: {
    concert: 'concert crowd throwing horns, live music atmosphere, stage lighting',
    portrait: 'portrait with rocker salute, character making devil horns gesture',
    action: 'dynamic rocker salute pose, energetic metal gesture, movement captured'
  }
};

// Other gesture patterns for detection
const GESTURE_PATTERNS = [
  // Peace/victory sign
  /\b(peace\s*sign|victory\s*sign|v\s*sign|two\s*fingers?\s*up)\b/gi,
  // Thumbs up/down
  /\b(thumbs?\s*up|thumbs?\s*down|thumb\s*gesture)\b/gi,
  // Pointing
  /\b(pointing\s*(finger|hand)?|finger\s*point(ing)?)\b/gi,
  // Fist
  /\b(raised?\s*fist|power\s*fist|clenched\s*fist)\b/gi,
  // Waves
  /\b(waving\s*(hand)?|hand\s*wave|wave\s*gesture)\b/gi,
  // OK sign
  /\b(ok\s*sign|okay\s*gesture|a-?ok)\b/gi,
  // Salutes
  /\b(military\s*salute|salut(ing|e))\b/gi,
  // Crossed arms
  /\b(crossed?\s*arms?|arms?\s*crossed?|folded\s*arms?)\b/gi,
  // Hands on hips
  /\b(hands?\s*on\s*hips?|akimbo)\b/gi,
  // Praying hands
  /\b(pray(ing)?\s*hands?|hands?\s*together|namaste)\b/gi,
  // Shrug
  /\b(shrug(ging)?|shoulders?\s*(shrug|raised))\b/gi,
  // Clapping
  /\b(clap(ping)?|applau(se|ding))\b/gi
];

// Color mappings for emphasis
const COLOR_VARIANTS: Record<string, string[]> = {
  red: ['crimson', 'scarlet', 'ruby', 'blood red', 'vermillion', 'cherry red'],
  blue: ['azure', 'cobalt', 'sapphire', 'navy', 'cerulean', 'royal blue', 'sky blue'],
  green: ['emerald', 'forest green', 'jade', 'olive', 'lime', 'mint', 'sage'],
  yellow: ['golden', 'amber', 'canary', 'lemon', 'mustard', 'sunflower'],
  purple: ['violet', 'lavender', 'amethyst', 'plum', 'magenta', 'grape'],
  orange: ['tangerine', 'coral', 'peach', 'rust', 'burnt orange', 'apricot'],
  pink: ['rose', 'blush', 'salmon', 'fuchsia', 'hot pink', 'coral pink'],
  black: ['onyx', 'jet black', 'obsidian', 'coal black', 'midnight black'],
  white: ['ivory', 'pearl', 'snow white', 'cream', 'alabaster', 'bone white'],
  brown: ['chestnut', 'mahogany', 'chocolate', 'coffee', 'bronze', 'tan'],
  gray: ['silver', 'slate', 'charcoal', 'ash gray', 'gunmetal', 'stone gray'],
  gold: ['golden', 'gilded', 'burnished gold', 'bright gold', 'antique gold']
};

// Weapon patterns for detection
const WEAPON_PATTERNS = [
  // Handguns
  /\b(m\d+[a-z]?\d*)\s*(handgun|pistol|revolver)?\b/gi,
  /\b(glock|beretta|colt|sig\s*sauer|smith\s*&?\s*wesson|walther)\s*\d*\b/gi,
  /\b(\d+mm|\.\d+|9mm|45acp|40sw)\s*(pistol|handgun|revolver)?\b/gi,
  // Rifles
  /\b(ar-?\d+|ak-?\d+|m-?\d+|m1[a-z]?\d*)\s*(rifle|carbine)?\b/gi,
  /\b(sniper|assault|hunting|battle)\s*rifle\b/gi,
  // Shotguns
  /\b(remington|mossberg|benelli)?\s*\d*\s*shotgun\b/gi,
  /\b(pump|semi-auto|double[- ]barrel)\s*shotgun\b/gi,
  // Melee
  /\b(katana|machete|combat\s*knife|tactical\s*knife|bowie\s*knife)\b/gi,
  /\b(longsword|broadsword|claymore|rapier|scimitar)\b/gi,
  // Sci-fi/Fantasy
  /\b(laser|plasma|energy|ion)\s*(pistol|rifle|cannon|sword|blade)\b/gi,
  /\b(lightsaber|force\s*blade|beam\s*sword)\b/gi
];

// Specific item patterns (non-weapon)
const ITEM_PATTERNS = [
  // Flowers
  /\b(red|blue|purple|yellow|white|pink|orange)\s*(flower|flowers|rose|roses|tulip|tulips|lily|lilies|orchid|orchids|daisy|daisies)\b/gi,
  // Vehicles
  /\b(car|truck|motorcycle|bike|helicopter|plane|ship|boat)\b/gi,
  // Clothing
  /\b(dress|suit|armor|coat|jacket|hat|boots|gloves)\b/gi,
  // Tech
  /\b(computer|phone|tablet|robot|drone|mech)\b/gi,
  // Musical instruments (relevant for rocker context)
  /\b(guitar|bass|drums?|keyboard|microphone|amp(lifier)?)\b/gi
];

/**
 * Determines the style/mood variant for rocker salute based on context
 */
function getRockerSaluteStyle(input: string): keyof typeof ROCKER_SALUTE_EMPHASIS.styleVariants {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('aggressive') || lowerInput.includes('intense') || lowerInput.includes('angry') || lowerInput.includes('scream')) {
    return 'aggressive';
  }
  if (lowerInput.includes('triumphant') || lowerInput.includes('victory') || lowerInput.includes('celebration') || lowerInput.includes('winning')) {
    return 'triumphant';
  }
  if (lowerInput.includes('subtle') || lowerInput.includes('quiet') || lowerInput.includes('understated') || lowerInput.includes('cool')) {
    return 'subtle';
  }
  return 'casual';
}

/**
 * Determines the contextual setting for rocker salute
 */
function getRockerSaluteContext(input: string): keyof typeof ROCKER_SALUTE_EMPHASIS.contextual {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('concert') || lowerInput.includes('stage') || lowerInput.includes('crowd') || lowerInput.includes('show') || lowerInput.includes('gig')) {
    return 'concert';
  }
  if (lowerInput.includes('action') || lowerInput.includes('dynamic') || lowerInput.includes('movement') || lowerInput.includes('jump')) {
    return 'action';
  }
  return 'portrait';
}

/**
 * Detects and extracts specific items from user input for emphasis
 */
export function detectItems(input: string): DetectedItem[] {
  const items: DetectedItem[] = [];
  
  // PRIORITY: Detect Rocker Salute / Devil Horns gestures first
  for (const pattern of ROCKER_SALUTE_PATTERNS) {
    let match: RegExpExecArray | null;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(input)) !== null) {
      if (!items.some(i => i.category === 'gesture' && i.original.toLowerCase().includes('rocker') || i.original.toLowerCase().includes('horn'))) {
        const styleVariant = getRockerSaluteStyle(input);
        const contextVariant = getRockerSaluteContext(input);
        
        const emphasis = [
          ROCKER_SALUTE_EMPHASIS.base,
          ROCKER_SALUTE_EMPHASIS.anatomyDetails,
          ROCKER_SALUTE_EMPHASIS.styleVariants[styleVariant],
          ROCKER_SALUTE_EMPHASIS.contextual[contextVariant]
        ].join(', ');
        
        items.push({
          original: match[0],
          emphasized: emphasis,
          category: 'gesture',
          confidence: 0.98 // High confidence for this specific gesture
        });
      }
    }
  }
  
  // Detect other gestures
  for (const pattern of GESTURE_PATTERNS) {
    let match: RegExpExecArray | null;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(input)) !== null) {
      if (!items.some(i => i.original.toLowerCase() === match![0].toLowerCase())) {
        items.push({
          original: match[0],
          emphasized: `((${match[0]})), clear hand gesture, accurate ${match[0]} pose, proper hand anatomy`,
          category: 'gesture',
          confidence: 0.9
        });
      }
    }
  }
  
  // Detect colors with objects
  for (const [baseColor, variants] of Object.entries(COLOR_VARIANTS)) {
    const colorPattern = new RegExp(`\\b(${baseColor}|${variants.join('|')})\\s+(\\w+)\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = colorPattern.exec(input)) !== null) {
      items.push({
        original: match[0],
        emphasized: `((${match[0]})), exact color: ${baseColor}, vibrant ${baseColor} hue`,
        category: 'color',
        confidence: 0.9
      });
    }
  }
  
  // Detect weapons
  for (const pattern of WEAPON_PATTERNS) {
    let match: RegExpExecArray | null;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(input)) !== null) {
      items.push({
        original: match[0],
        emphasized: `((${match[0]})), detailed weapon, accurate ${match[0]} design, realistic firearm details`,
        category: 'weapon',
        confidence: 0.95
      });
    }
  }
  
  // Detect other specific items
  for (const pattern of ITEM_PATTERNS) {
    let match: RegExpExecArray | null;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(input)) !== null) {
      if (!items.some(i => i.original.toLowerCase() === match![0].toLowerCase())) {
        items.push({
          original: match[0],
          emphasized: `((${match[0]})), detailed ${match[0]}, accurate depiction`,
          category: 'object',
          confidence: 0.85
        });
      }
    }
  }
  
  return items;
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

export type GenreType = keyof typeof GENRE_KEYWORDS;

export interface PromptConfig {
  genre: GenreType;
  subject: string;
  specificItems?: string[];
  mood?: string;
  lighting?: string;
  cameraAngle?: string;
  additionalDetails?: string;
  negativePrompt?: string;
  quality?: 'standard' | 'high' | 'ultra';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface GeneratedPrompt {
  positive: string;
  negative: string;
  detectedItems: DetectedItem[];
  genreKeywordsUsed: string[];
  config: {
    model: string;
    width: number;
    height: number;
    steps: number;
    guidance: number;
  };
}

/**
 * Quality presets for different detail levels
 */
const QUALITY_PRESETS = {
  standard: {
    suffix: 'good quality, detailed',
    steps: 20,
    guidance: 7
  },
  high: {
    suffix: 'high quality, highly detailed, sharp focus, professional',
    steps: 30,
    guidance: 7.5
  },
  ultra: {
    suffix: 'masterpiece, best quality, ultra detailed, sharp focus, professional photography, 8k uhd, high resolution',
    steps: 40,
    guidance: 8
  }
};

/**
 * Aspect ratio to dimensions mapping
 */
const ASPECT_RATIOS = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 }
};

/**
 * Default negative prompt for ToS compliance and quality
 */
const DEFAULT_NEGATIVE = [
  'nsfw', 'nude', 'naked', 'explicit', 'gore', 'graphic violence',
  'low quality', 'blurry', 'pixelated', 'distorted', 'deformed',
  'bad anatomy', 'wrong proportions', 'extra limbs', 'missing limbs',
  'floating limbs', 'disconnected limbs', 'mutation', 'mutated',
  'ugly', 'disgusting', 'poorly drawn', 'bad art', 'amateur',
  'watermark', 'signature', 'text', 'logo', 'copyright'
].join(', ');

/**
 * Selects random keywords from a category
 */
function selectKeywords(arr: readonly string[], count: number): string[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

/**
 * Main prompt builder function
 */
export function buildPrompt(config: PromptConfig): GeneratedPrompt {
  const genre = GENRE_KEYWORDS[config.genre];
  const quality = QUALITY_PRESETS[config.quality || 'high'];
  const dimensions = ASPECT_RATIOS[config.aspectRatio || '1:1'];
  
  // Detect items in the subject
  const detectedItems = detectItems(config.subject);
  
  // Add any explicitly specified items
  if (config.specificItems) {
    for (const item of config.specificItems) {
      const detected = detectItems(item);
      detectedItems.push(...detected);
    }
  }
  
  // Build the emphasized subject with detected items
  let emphasizedSubject = config.subject;
  for (const item of detectedItems) {
    emphasizedSubject = emphasizedSubject.replace(
      new RegExp(item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      item.emphasized
    );
  }
  
  // Select genre-appropriate keywords
  const genreKeywords: string[] = [];
  
  // Environment (1-2)
  if ('environment' in genre) {
    genreKeywords.push(...selectKeywords(genre.environment, 1));
  }
  
  // Atmosphere (1-2)
  if ('atmosphere' in genre) {
    genreKeywords.push(...selectKeywords(genre.atmosphere, 2));
  }
  
  // Style (1)
  if ('style' in genre) {
    genreKeywords.push(...selectKeywords(genre.style, 1));
  }
  
  // Build the positive prompt
  const promptParts: string[] = [];
  
  // Core subject with emphasis
  promptParts.push(emphasizedSubject);
  
  // Genre atmosphere and style
  if (genreKeywords.length > 0) {
    promptParts.push(genreKeywords.join(', '));
  }
  
  // Custom mood/lighting
  if (config.mood) {
    promptParts.push(`${config.mood} mood`);
  }
  if (config.lighting) {
    promptParts.push(`${config.lighting} lighting`);
  }
  if (config.cameraAngle) {
    promptParts.push(config.cameraAngle);
  }
  
  // Additional details
  if (config.additionalDetails) {
    promptParts.push(config.additionalDetails);
  }
  
  // Quality suffix
  promptParts.push(quality.suffix);
  
  // Combine positive prompt
  const positivePrompt = promptParts.join(', ');
  
  // Build negative prompt
  const negativePrompt = config.negativePrompt 
    ? `${DEFAULT_NEGATIVE}, ${config.negativePrompt}`
    : DEFAULT_NEGATIVE;
  
  return {
    positive: positivePrompt,
    negative: negativePrompt,
    detectedItems,
    genreKeywordsUsed: genreKeywords,
    config: {
      model: 'black-forest-labs/FLUX.1.1-pro',
      width: dimensions.width,
      height: dimensions.height,
      steps: quality.steps,
      guidance: quality.guidance
    }
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick generation with minimal config
 */
export function quickPrompt(
  genre: GenreType,
  subject: string,
  quality: 'standard' | 'high' | 'ultra' = 'high'
): GeneratedPrompt {
  return buildPrompt({ genre, subject, quality });
}

/**
 * Get all keywords for a genre (useful for UI autocomplete)
 */
export function getGenreKeywords(genre: GenreType): Record<string, readonly string[]> {
  return GENRE_KEYWORDS[genre] as Record<string, readonly string[]>;
}

/**
 * Get all available genres
 */
export function getAvailableGenres(): GenreType[] {
  return Object.keys(GENRE_KEYWORDS) as GenreType[];
}

/**
 * Validate that a genre exists
 */
export function isValidGenre(genre: string): genre is GenreType {
  return genre in GENRE_KEYWORDS;
}

/**
 * Map game genre strings to prompt builder genres
 */
export function mapGameGenreToPromptGenre(gameGenre: string): GenreType {
  const genreMap: Record<string, GenreType> = {
    'fantasy': 'fantasy',
    'scifi': 'sciFi',
    'sci-fi': 'sciFi',
    'science fiction': 'sciFi',
    'horror': 'horror',
    'western': 'western',
    'noir': 'noir',
    'postapocalyptic': 'postApocalyptic',
    'post-apocalyptic': 'postApocalyptic',
    'cyberpunk': 'cyberpunk',
    'medieval': 'medieval',
    'modern': 'modern',
    'contemporary': 'modern',
    'steampunk': 'steampunk',
    'victorian': 'steampunk'
  };
  
  const normalized = gameGenre.toLowerCase().trim();
  return genreMap[normalized] || 'fantasy';
}

export default {
  buildPrompt,
  quickPrompt,
  detectItems,
  getGenreKeywords,
  getAvailableGenres,
  isValidGenre,
  mapGameGenreToPromptGenre,
  GENRE_KEYWORDS
};
