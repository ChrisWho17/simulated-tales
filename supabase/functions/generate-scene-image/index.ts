import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// ITEM DETECTION & EMPHASIS SYSTEM
// ============================================================================

interface DetectedItem {
  original: string;
  emphasized: string;
  category: 'weapon' | 'object' | 'color' | 'creature' | 'character' | 'environment' | 'style' | 'gesture';
  confidence: number;
}

// ============================================================================
// ROCKER SALUTE / DEVIL HORNS GESTURE DETECTION
// ============================================================================

/**
 * Rocker Salute / Devil Horns / Metal Horns
 * 
 * The iconic hand gesture of rock and metal culture:
 * - Index finger and pinky extended upward
 * - Middle and ring fingers curled into palm
 * - Thumb either tucked across curled fingers or extended
 * 
 * Also known as: "The Horns", "Devil Horns", "Metal Horns", "Mano Cornuta",
 * "Sign of the Horns", "Rock on", "Hook 'em Horns"
 * Popularized by Ronnie James Dio in heavy metal
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

const ROCKER_SALUTE_EMPHASIS = {
  base: '((rocker salute hand gesture)), ((devil horns hand sign)), index finger and pinky finger extended upward, middle and ring fingers curled into palm, iconic gesture of acknowledgement and celebration',
  anatomyDetails: 'correct hand anatomy, five fingers clearly visible, proper finger positioning, realistic hand proportions',
  styleVariants: {
    aggressive: 'aggressive rocker salute, powerful gesture, intense expression, fierce attitude',
    casual: 'casual devil horns, relaxed gesture, friendly acknowledgement salute',
    triumphant: 'triumphant horns raised high, victory salute, celebratory gesture, moment of glory',
    subtle: 'subtle horn gesture, understated acknowledgment, cool confident sign',
    celebratory: 'celebratory devil horns, joyful gesture, excitement and triumph',
    respectful: 'respectful horns gesture, acknowledging another, mutual recognition'
  },
  contextual: {
    concert: 'concert crowd throwing horns, live music atmosphere, stage lighting',
    portrait: 'portrait with rocker salute, character making devil horns gesture',
    action: 'dynamic rocker salute pose, energetic gesture, movement captured',
    celebration: 'celebratory scene, moment of victory, joyful atmosphere',
    greeting: 'acknowledgement gesture, mutual respect, recognition between characters',
    battle: 'battle-ready stance with horns salute, warrior acknowledgment, fierce respect',
    casual: 'casual everyday scene, relaxed environment, natural gesture'
  }
};

// Other gesture patterns
const GESTURE_PATTERNS = [
  /\b(peace\s*sign|victory\s*sign|v\s*sign|two\s*fingers?\s*up)\b/gi,
  /\b(thumbs?\s*up|thumbs?\s*down|thumb\s*gesture)\b/gi,
  /\b(pointing\s*(finger|hand)?|finger\s*point(ing)?)\b/gi,
  /\b(raised?\s*fist|power\s*fist|clenched\s*fist)\b/gi,
  /\b(waving\s*(hand)?|hand\s*wave|wave\s*gesture)\b/gi,
  /\b(ok\s*sign|okay\s*gesture|a-?ok)\b/gi,
  /\b(military\s*salute|salut(ing|e))\b/gi,
  /\b(crossed?\s*arms?|arms?\s*crossed?|folded\s*arms?)\b/gi,
  /\b(hands?\s*on\s*hips?|akimbo)\b/gi,
  /\b(pray(ing)?\s*hands?|hands?\s*together|namaste)\b/gi,
  /\b(shrug(ging)?|shoulders?\s*(shrug|raised))\b/gi,
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
  /\b(m\d+[a-z]?\d*)\s*(handgun|pistol|revolver)?\b/gi,
  /\b(glock|beretta|colt|sig\s*sauer|smith\s*&?\s*wesson|walther)\s*\d*\b/gi,
  /\b(\d+mm|\.\d+|9mm|45acp|40sw)\s*(pistol|handgun|revolver)?\b/gi,
  /\b(ar-?\d+|ak-?\d+|m-?\d+|m1[a-z]?\d*)\s*(rifle|carbine)?\b/gi,
  /\b(sniper|assault|hunting|battle)\s*rifle\b/gi,
  /\b(remington|mossberg|benelli)?\s*\d*\s*shotgun\b/gi,
  /\b(pump|semi-auto|double[- ]barrel)\s*shotgun\b/gi,
  /\b(katana|machete|combat\s*knife|tactical\s*knife|bowie\s*knife)\b/gi,
  /\b(longsword|broadsword|claymore|rapier|scimitar)\b/gi,
  /\b(laser|plasma|energy|ion)\s*(pistol|rifle|cannon|sword|blade)\b/gi,
  /\b(lightsaber|force\s*blade|beam\s*sword)\b/gi
];

// Specific item patterns (non-weapon)
const ITEM_PATTERNS = [
  /\b(red|blue|purple|yellow|white|pink|orange)\s*(flower|flowers|rose|roses|tulip|tulips|lily|lilies|orchid|orchids|daisy|daisies)\b/gi,
  /\b(car|truck|motorcycle|bike|helicopter|plane|ship|boat|starship|hover\s*car|hover\s*bike)\b/gi,
  /\b(dress|suit|armor|coat|jacket|hat|boots|gloves|cloak|cape|robe|uniform)\b/gi,
  /\b(computer|phone|tablet|robot|drone|mech|hologram|terminal|screen)\b/gi,
  /\b(coffee|tea|beer|wine|whiskey|ale|mead|potion|drink|meal|food|bread|meat)\b/gi,
  /\b(guitar|bass|drums?|keyboard|microphone|amp(lifier)?)\b/gi
];

/**
 * Determines the style/mood variant for rocker salute based on context
 */
function getRockerSaluteStyle(input: string): keyof typeof ROCKER_SALUTE_EMPHASIS.styleVariants {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('aggressive') || lowerInput.includes('intense') || lowerInput.includes('angry') || lowerInput.includes('scream') || lowerInput.includes('fierce')) {
    return 'aggressive';
  }
  if (lowerInput.includes('triumphant') || lowerInput.includes('victory') || lowerInput.includes('winning') || lowerInput.includes('won') || lowerInput.includes('success')) {
    return 'triumphant';
  }
  if (lowerInput.includes('celebrat') || lowerInput.includes('party') || lowerInput.includes('happy') || lowerInput.includes('joy') || lowerInput.includes('excited')) {
    return 'celebratory';
  }
  if (lowerInput.includes('respect') || lowerInput.includes('acknowledge') || lowerInput.includes('honor') || lowerInput.includes('salute') || lowerInput.includes('greeting')) {
    return 'respectful';
  }
  if (lowerInput.includes('subtle') || lowerInput.includes('quiet') || lowerInput.includes('understated') || lowerInput.includes('cool')) {
    return 'subtle';
  }
  return 'casual';
}

/**
 * Determines the contextual setting for rocker salute - works in ANY scene type
 */
function getRockerSaluteContext(input: string): keyof typeof ROCKER_SALUTE_EMPHASIS.contextual {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('concert') || lowerInput.includes('stage') || lowerInput.includes('crowd') || lowerInput.includes('show') || lowerInput.includes('gig') || lowerInput.includes('music')) {
    return 'concert';
  }
  if (lowerInput.includes('action') || lowerInput.includes('dynamic') || lowerInput.includes('movement') || lowerInput.includes('jump') || lowerInput.includes('running')) {
    return 'action';
  }
  if (lowerInput.includes('celebrat') || lowerInput.includes('victory') || lowerInput.includes('won') || lowerInput.includes('success') || lowerInput.includes('party')) {
    return 'celebration';
  }
  if (lowerInput.includes('greet') || lowerInput.includes('acknowledge') || lowerInput.includes('meet') || lowerInput.includes('hello') || lowerInput.includes('respect')) {
    return 'greeting';
  }
  if (lowerInput.includes('battle') || lowerInput.includes('fight') || lowerInput.includes('combat') || lowerInput.includes('warrior') || lowerInput.includes('war')) {
    return 'battle';
  }
  // Default to casual for any other scene - works everywhere
  return 'casual';
}

/**
 * Detects and extracts specific items from user input for emphasis
 */
function detectItems(input: string): DetectedItem[] {
  const items: DetectedItem[] = [];
  
  // PRIORITY: Detect Rocker Salute / Devil Horns gestures first
  for (const pattern of ROCKER_SALUTE_PATTERNS) {
    let match: RegExpExecArray | null;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(input)) !== null) {
      if (!items.some(i => i.category === 'gesture')) {
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
          confidence: 0.98
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
        emphasized: `((${match[0]})), detailed weapon, accurate ${match[0]} design, realistic details`,
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
// GENRE KEYWORD BANKS (Comprehensive)
// ============================================================================

const GENRE_KEYWORD_BANKS: Record<string, {
  environment: string[];
  atmosphere: string[];
  items: string[];
  characters: string[];
  style: string[];
}> = {
  medieval: {
    environment: ['castle', 'fortress', 'tavern', 'village', 'kingdom', 'dungeon', 'throne room', 'cobblestone streets', 'thatched roof', 'stone walls', 'moat', 'drawbridge', 'great hall', 'blacksmith forge', 'market square', 'cathedral', 'monastery', 'watchtower', 'ramparts', 'courtyard', 'stables', 'armory'],
    atmosphere: ['torchlit', 'candlelit', 'misty morning', 'golden hour', 'dramatic shadows', 'medieval ambiance', 'rustic', 'ancient', 'weathered stone', 'moss-covered', 'battle-scarred', 'regal', 'mystical', 'enchanted', 'foreboding'],
    items: ['longsword', 'broadsword', 'dagger', 'crossbow', 'longbow', 'war hammer', 'battle axe', 'mace', 'flail', 'halberd', 'pike', 'shield', 'chainmail', 'plate armor', 'leather armor', 'helmet', 'gauntlets', 'greaves', 'goblet', 'chalice', 'tome', 'scroll', 'quill', 'wax seal', 'banner', 'crown', 'scepter', 'amulet', 'ring', 'potion bottle', 'herbs'],
    characters: ['knight', 'peasant', 'noble', 'king', 'queen', 'wizard', 'witch', 'blacksmith', 'merchant', 'bard', 'monk', 'nun', 'squire', 'herald', 'huntsman', 'stable hand', 'serving wench', 'court jester', 'alchemist'],
    style: ['oil painting style', 'illuminated manuscript', 'tapestry art', 'classical realism', 'romantic era painting', 'pre-raphaelite']
  },
  modern: {
    environment: ['city street', 'apartment', 'office building', 'suburban home', 'coffee shop', 'nightclub', 'restaurant', 'shopping mall', 'parking garage', 'hospital', 'police station', 'courtroom', 'school', 'university', 'gym', 'park', 'beach', 'highway', 'gas station', 'convenience store', 'warehouse'],
    atmosphere: ['neon lights', 'fluorescent lighting', 'natural daylight', 'overcast', 'rainy day', 'sunny afternoon', 'urban gritty', 'clean modern', 'cozy', 'sterile', 'lived-in', 'bustling', 'quiet suburban', 'downtown busy'],
    items: ['smartphone', 'laptop', 'car keys', 'wallet', 'credit card', 'coffee cup', 'briefcase', 'backpack', 'sunglasses', 'wristwatch', 'headphones', 'tablet', 'television', 'microwave', 'refrigerator', 'desk lamp', 'office chair', 'filing cabinet', 'whiteboard', 'printer', 'handgun', 'pistol', 'revolver', 'rifle', 'shotgun', 'tactical knife', 'baton', 'taser'],
    characters: ['businessman', 'office worker', 'student', 'teacher', 'doctor', 'nurse', 'police officer', 'firefighter', 'chef', 'waiter', 'bartender', 'mechanic', 'construction worker', 'athlete', 'artist', 'musician'],
    style: ['photorealistic', 'contemporary photography', 'urban photography', 'lifestyle photography', 'documentary style', 'cinematic']
  },
  cyberpunk: {
    environment: ['megacity', 'neon-lit alley', 'corporate tower', 'underground club', 'black market', 'hacker den', 'chrome bar', 'rooftop garden', 'slums', 'elevated highway', 'holographic billboard district', 'data center', 'cybernetic clinic', 'virtual reality arcade', 'smuggler hideout'],
    atmosphere: ['neon-soaked', 'rain-slicked streets', 'holographic advertisements', 'perpetual night', 'smog-filled sky', 'electric blue glow', 'pink neon', 'harsh contrast lighting', 'dystopian', 'high-tech low-life', 'corporate sterile', 'underground grimy', 'digital noise'],
    items: ['cyberdeck', 'neural interface', 'holographic display', 'smart gun', 'plasma pistol', 'laser rifle', 'EMP grenade', 'hacking tool', 'augmented reality glasses', 'cybernetic arm', 'synthetic eye', 'data chip', 'credstick', 'hover bike', 'drone', 'nano-injector', 'chrome arm', 'cybernetic eye', 'neural implant', 'subdermal armor', 'reflex booster', 'LED tattoos'],
    characters: ['netrunner', 'street samurai', 'corporate executive', 'fixer', 'smuggler', 'bounty hunter', 'tech specialist', 'mercenary', 'hacker', 'synth dealer', 'black market doc', 'gang member'],
    style: ['cyberpunk aesthetic', 'blade runner style', 'neon noir', 'futuristic digital art', 'sci-fi concept art', 'synthwave art']
  },
  postapocalyptic: {
    environment: ['ruined city', 'abandoned building', 'wasteland', 'bunker', 'settlement', 'scrapyard', 'toxic swamp', 'crumbling highway', 'overgrown mall', 'military base ruins', 'collapsed bridge', 'survivor camp', 'radiation zone', 'desert wasteland', 'flooded streets'],
    atmosphere: ['dust-filled air', 'orange hazed sky', 'desolate', 'eerie quiet', 'harsh sunlight', 'perpetual overcast', 'radioactive glow', 'nature reclaiming', 'crumbling decay', 'survival desperation', 'makeshift repairs', 'scavenged aesthetics'],
    items: ['gas mask', 'radiation suit', 'makeshift weapon', 'scrap armor', 'water canteen', 'canned food', 'med kit', 'geiger counter', 'survival knife', 'pipe rifle', 'molotov cocktail', 'crowbar', 'flashlight', 'sleeping bag', 'rope', 'duct tape', 'toolbox', 'sawed-off shotgun', 'machete', 'baseball bat with nails', 'crossbow', 'hunting rifle', 'improvised spear'],
    characters: ['wasteland wanderer', 'scavenger', 'raider', 'settlement leader', 'caravan guard', 'mutant', 'scientist survivor', 'mechanic', 'doctor', 'trader', 'cult member', 'bounty hunter'],
    style: ['post-apocalyptic art', 'fallout style', 'mad max aesthetic', 'gritty realism', 'survival horror', 'wasteland concept art']
  },
  fantasy: {
    environment: ['enchanted forest', 'magical tower', 'elven city', 'dwarven mine', 'dragon lair', 'fairy glen', 'crystal cave', 'floating island', 'ancient ruins', 'magical academy', 'sacred grove', 'demon realm', 'celestial palace', 'underwater kingdom', 'witch cottage'],
    atmosphere: ['magical glow', 'ethereal mist', 'starlit', 'aurora borealis', 'golden sunbeams', 'mystical fog', 'bioluminescent', 'enchanted', 'otherworldly', 'divine radiance', 'dark magic aura', 'primal nature'],
    items: ['magic wand', 'staff', 'spellbook', 'crystal ball', 'enchanted sword', 'magic ring', 'flying carpet', 'potion', 'scroll', 'rune stone', 'amulet', 'orb', 'magical gem', 'fairy dust', 'dragon scale', 'phoenix feather', 'unicorn horn', 'enchanted mirror'],
    characters: ['wizard', 'witch', 'sorcerer', 'paladin', 'ranger', 'druid', 'bard', 'rogue', 'cleric', 'warlock', 'necromancer', 'elementalist', 'beast tamer', 'enchanter', 'archmage', 'dragon', 'unicorn', 'phoenix', 'griffin', 'fairy', 'elf', 'dwarf', 'orc', 'goblin', 'troll'],
    style: ['fantasy art', 'high fantasy illustration', 'magical realism', 'fairy tale art', 'epic fantasy', 'dark fantasy']
  },
  scifi: {
    environment: ['space station', 'starship bridge', 'alien planet', 'moon base', 'terraformed world', 'asteroid mining facility', 'orbital habitat', 'hyperspace', 'alien ruins', 'research lab', 'cryo bay', 'cargo hold', 'engineering deck', 'observation deck'],
    atmosphere: ['zero gravity', 'sterile white', 'bioluminescent alien', 'starfield', 'nebula backdrop', 'planetary rings', 'artificial lighting', 'holographic displays', 'clean futuristic', 'deep space isolation', 'alien atmosphere', 'harsh vacuum'],
    items: ['laser pistol', 'plasma rifle', 'energy sword', 'force field', 'teleporter', 'hologram projector', 'scanner', 'communicator', 'space suit', 'jetpack', 'gravity boots', 'neural link', 'stasis pod', 'med bay scanner', 'star map', 'power cell', 'starship', 'shuttle', 'fighter craft', 'mech suit'],
    characters: ['space captain', 'pilot', 'engineer', 'scientist', 'marine', 'alien diplomat', 'bounty hunter', 'smuggler', 'colonist', 'android', 'AI hologram', 'medic', 'xenobiologist'],
    style: ['sci-fi concept art', 'space opera', 'hard science fiction', 'retro futurism', 'clean sci-fi', 'alien aesthetic']
  },
  horror: {
    environment: ['haunted house', 'abandoned asylum', 'dark forest', 'cemetery', 'crypt', 'morgue', 'cursed village', 'fog-shrouded moor', 'decrepit mansion', 'underground tunnel', 'sacrificial altar', 'nightmare realm', 'twisted carnival', 'blood-stained room'],
    atmosphere: ['oppressive darkness', 'flickering lights', 'thick fog', 'moonlit', 'blood red', 'sickly green', 'shadow-filled', 'claustrophobic', 'unsettling', 'dread-inducing', 'decay and rot', 'supernatural chill'],
    items: ['candelabra', 'ouija board', 'cursed doll', 'ancient tome', 'ritual knife', 'pentagram', 'skull', 'coffin', 'chains', 'medical tools', 'bloody weapon', 'haunted photograph', 'creepy music box', 'voodoo doll', 'crystal pendant'],
    characters: ['ghost', 'demon', 'vampire', 'werewolf', 'zombie', 'witch', 'eldritch horror', 'shadow creature', 'possessed human', 'serial killer', 'cult leader', 'mad scientist'],
    style: ['horror art', 'gothic horror', 'psychological horror', 'dark surrealism', 'nightmare fuel', 'eldritch art']
  },
  western: {
    environment: ['dusty town', 'saloon', 'desert canyon', 'frontier settlement', 'ranch', 'gold mine', 'train station', 'sheriff office', 'bank', 'general store', 'livery stable', 'cemetery boot hill', 'campfire under stars', 'river crossing', 'mountain pass'],
    atmosphere: ['golden hour desert', 'high noon harsh light', 'dusty wind', 'sunset silhouette', 'rustic frontier', 'lawless', 'weathered wood', 'tumbleweeds', 'heat shimmer', 'starlit prairie'],
    items: ['revolver', 'rifle', 'shotgun', 'lasso', 'cowboy hat', 'boots', 'spurs', 'bandana', 'saddle', 'horseshoe', 'whiskey bottle', 'poker chips', 'wanted poster', 'sheriff badge', 'bowie knife', 'dynamite', 'gold nugget', 'oil lamp'],
    characters: ['cowboy', 'outlaw', 'sheriff', 'deputy', 'saloon girl', 'bartender', 'blacksmith', 'prospector', 'bounty hunter', 'Native American', 'cavalry soldier', 'ranch hand', 'gambler', 'preacher'],
    style: ['western art', 'spaghetti western', 'frontier painting', 'cowboy illustration', 'old west photography style']
  },
  noir: {
    environment: ['rainy city street', 'detective office', 'smoky bar', 'jazz club', 'back alley', 'warehouse', 'docks', 'luxury penthouse', 'seedy motel', 'interrogation room', 'gambling den', 'newsroom'],
    atmosphere: ['high contrast shadows', 'venetian blind lighting', 'cigarette smoke', 'rain-slicked streets', 'neon sign glow', 'black and white', 'moody lighting', 'mystery atmosphere', 'femme fatale ambiance', 'danger lurking', '1940s aesthetic'],
    items: ['fedora', 'trench coat', 'cigarette', 'whiskey glass', 'revolver', 'typewriter', 'newspaper', 'magnifying glass', 'evidence folder', 'camera', 'telephone', 'briefcase with money', 'switchblade'],
    characters: ['private detective', 'femme fatale', 'corrupt cop', 'mob boss', 'informant', 'nightclub singer', 'journalist', 'politician', 'wealthy widow', 'hired muscle', 'mysterious stranger'],
    style: ['film noir', 'classic noir photography', 'hardboiled detective', 'neo-noir', 'chiaroscuro lighting', 'dramatic shadows']
  },
  steampunk: {
    environment: ['victorian city', 'airship dock', 'clockwork factory', 'inventor workshop', 'brass-fitted mansion', 'underground laboratory', 'steam train', 'gear-filled chamber', 'observatory', 'automaton factory', 'sky pirate ship', 'coal-powered plant'],
    atmosphere: ['brass and copper tones', 'steam clouds', 'gas lamp lighting', 'industrial revolution', 'victorian elegance', 'mechanical wonder', 'coal smoke', 'gear mechanisms visible', 'retrofuturistic'],
    items: ['pocket watch', 'goggles', 'brass telescope', 'steam pistol', 'clockwork device', 'mechanical arm', 'airship', 'top hat', 'corset', 'cane sword', 'ray gun', 'aether device', 'difference engine', 'pneumatic tube', 'dirigible'],
    characters: ['inventor', 'airship captain', 'engineer', 'aristocrat', 'street urchin', 'automaton', 'sky pirate', 'mad scientist', 'clockwork mechanic', 'adventurer', 'society lady'],
    style: ['steampunk art', 'victorian sci-fi', 'brass age aesthetic', 'clockpunk', 'industrial fantasy', 'retrofuturism']
  }
};

/**
 * Get genre keywords and enhance prompt with them
 */
function enhanceWithGenreKeywords(input: string, genre: string): { enhanced: string; keywordsUsed: string[] } {
  const normalizedGenre = genre.toLowerCase().replace(/[-_\s]/g, '');
  const genreMap: Record<string, string> = {
    'postapoc': 'postapocalyptic',
    'scifi': 'scifi',
    'sci-fi': 'scifi',
    'sciencefiction': 'scifi',
  };
  
  const mappedGenre = genreMap[normalizedGenre] || normalizedGenre;
  const bank = GENRE_KEYWORD_BANKS[mappedGenre];
  
  if (!bank) {
    return { enhanced: input, keywordsUsed: [] };
  }
  
  const keywordsUsed: string[] = [];
  
  // Add 1-2 random environment keywords if not already present
  const envKeyword = bank.environment[Math.floor(Math.random() * bank.environment.length)];
  if (!input.toLowerCase().includes(envKeyword.toLowerCase())) {
    keywordsUsed.push(envKeyword);
  }
  
  // Add 1-2 random atmosphere keywords
  const atmKeywords = bank.atmosphere.sort(() => Math.random() - 0.5).slice(0, 2);
  keywordsUsed.push(...atmKeywords.filter(k => !input.toLowerCase().includes(k.toLowerCase())));
  
  // Add 1 style keyword
  const styleKeyword = bank.style[Math.floor(Math.random() * bank.style.length)];
  if (!input.toLowerCase().includes(styleKeyword.toLowerCase())) {
    keywordsUsed.push(styleKeyword);
  }
  
  // Enhance the input with detected items
  const detectedItems = detectItems(input);
  let enhanced = input;
  
  for (const item of detectedItems) {
    enhanced = enhanced.replace(
      new RegExp(item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      item.emphasized
    );
  }
  
  if (keywordsUsed.length > 0) {
    enhanced += `, GENRE ATMOSPHERE: ${keywordsUsed.join(', ')}`;
  }
  
  console.log('Genre keywords applied:', keywordsUsed.slice(0, 4));
  console.log('Items detected and emphasized:', detectedItems.length);
  
  return { enhanced, keywordsUsed };
}

// ============================================================================
// TYPES
// ============================================================================

interface CharacterVisualProfile {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  physicalDescription: { build: string; skinTone: string };
  hair: { color: string; style: string; length?: string };
  eyes: { color: string };
  facialFeatures: { scars?: string; tattoos?: string; beard?: string; other?: string };
  modifications?: { cybernetics?: string; other?: string };
  role: string;
  roleAppearance: string;
  fullVisualDescription: string;
}

interface SceneImageRequest {
  lastNarratorMessage?: string;
  lastUserAction?: string;
  messageHistory?: Array<{ role: string; content: string }>;
  characterProfile?: CharacterVisualProfile;
  genre?: string;
  era?: string;
  currentLocation?: string;
  timeOfDay?: string;
  weather?: string;
  npcsPresent?: Array<{ name: string; description: string; currentActivity?: string }>;
  // Legacy
  playerCharacter?: {
    name?: string; gender?: string; role?: string; build?: string;
    hairColor?: string; hairStyle?: string; skinTone?: string; eyeColor?: string; details?: string[];
  };
  sceneDescription?: string;
  recentStory?: string[];
  playerAction?: string;
  style?: string;
}

interface SceneEssence {
  coreAction: string;
  momentType: 'quiet' | 'tense' | 'action' | 'discovery' | 'social' | 'transition' | 'emotional' | 'environmental' | 'romantic' | 'casual' | 'intimate' | 'everyday';
  visualElements: string[];
  setting: string;
  atmosphereWords: string[];
  playerDoing: string | null;
  others: string[];
  objects: string[];
  sensoryDetails: string[];
  romanticContext?: {
    intimacyLevel: 'tender' | 'passionate' | 'playful' | 'longing';
    focusElements: string[];
  };
  casualContext?: {
    activityType: 'social' | 'personal' | 'work' | 'leisure' | 'domestic';
    mood: 'relaxed' | 'busy' | 'focused' | 'playful';
  };
}

// ============================================================================
// RANDOM UTILITY
// ============================================================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMultiple<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================================================
// SCENE ESSENCE EXTRACTION
// ============================================================================

function extractSceneEssence(
  narratorMessage: string,
  userAction: string,
  history: Array<{ role: string; content: string }> = []
): SceneEssence {
  const lowerNarrator = narratorMessage.toLowerCase();
  const lowerAction = userAction.toLowerCase();
  const combined = `${narratorMessage} ${userAction}`;
  const lowerCombined = combined.toLowerCase();

  // PRIORITY 1: Extract what the player ACTUALLY did from their action
  let playerDoing: string | null = null;
  
  // Clean the user action - remove "I " prefix and get the actual action
  const actionClean = userAction.replace(/^i\s+/i, '').trim();
  if (actionClean && actionClean.length > 2) {
    // Filter out purely mental actions that aren't visual
    const mentalOnly = ['think', 'wonder', 'consider', 'decide', 'remember', 'hope', 'wish', 'feel about'];
    const isMentalOnly = mentalOnly.some(m => actionClean.toLowerCase().startsWith(m));
    if (!isMentalOnly) {
      playerDoing = actionClean;
    }
  }

  // PRIORITY 2: Build the core scene description from narrator's message
  // Take the first 2-3 meaningful sentences that describe what's happening
  const sentences = narratorMessage.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let coreAction = '';
  
  // Build a scene summary from the narrator's actual words
  if (sentences.length > 0) {
    // Get the most descriptive sentences (avoid short filler)
    const meaningfulSentences = sentences
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 2);
    
    if (meaningfulSentences.length > 0) {
      coreAction = meaningfulSentences.join('. ');
    } else {
      coreAction = sentences[0].trim();
    }
  }
  
  // Limit core action length but keep it meaningful
  if (coreAction.length > 200) {
    coreAction = coreAction.slice(0, 200);
  }

  // Determine moment type from BOTH player action AND narrator response
  let momentType: SceneEssence['momentType'] = 'environmental';
  const momentIndicators: Record<SceneEssence['momentType'], string[]> = {
    action: ['fight', 'attack', 'shoot', 'fire', 'run', 'chase', 'dodge', 'explosion', 'combat', 'battle', 'sprint', 'jump', 'crash', 'punch', 'kick', 'throw', 'swing', 'slash', 'stab', 'dive', 'roll', 'flip', 'climb', 'break', 'smash'],
    tense: ['careful', 'danger', 'threat', 'watch', 'listen', 'sneak', 'hide', 'wait', 'shadows', 'nervous', 'uneasy', 'creep', 'stalk', 'prowl'],
    quiet: ['rest', 'sleep', 'peaceful', 'calm', 'still', 'silent', 'empty', 'alone', 'reflect', 'relax', 'sit', 'lie down', 'meditate'],
    discovery: ['find', 'discover', 'notice', 'reveal', 'uncover', 'realize', 'learn', 'spot', 'strange', 'examine', 'inspect', 'investigate', 'search', 'look at', 'pick up'],
    social: ['say', 'speak', 'talk', 'ask', 'tell', 'crowd', 'people', 'gather', 'meeting', 'conversation', 'greet', 'introduce', 'wave', 'nod', 'shake hands'],
    transition: ['enter', 'exit', 'leave', 'arrive', 'move', 'travel', 'walk', 'head', 'continue', 'approach', 'go to', 'head to', 'step into', 'open door', 'walk through'],
    emotional: ['feel', 'heart', 'tears', 'laugh', 'cry', 'anger', 'joy', 'grief', 'relief', 'shock', 'comfort'],
    romantic: ['kiss', 'embrace', 'hold hands', 'caress', 'cuddle', 'snuggle', 'lean close', 'whisper', 'gaze into', 'love', 'affection', 'tender', 'romantic', 'intimate', 'brush lips', 'stroke hair', 'touch cheek', 'pull close', 'wrap arms', 'nuzzle', 'sway together', 'dance together', 'rest head', 'intertwine', 'passion', 'longing', 'desire', 'flirt', 'wink', 'blush', 'smile softly', 'heart flutter'],
    // Everyday casual activities
    casual: ['drink', 'eat', 'coffee', 'tea', 'beer', 'wine', 'meal', 'food', 'breakfast', 'lunch', 'dinner', 'snack', 'smoke', 'cigarette', 'read', 'book', 'newspaper', 'write', 'draw', 'play cards', 'dice', 'gamble', 'bet', 'shop', 'buy', 'sell', 'trade', 'bargain', 'work', 'fix', 'repair', 'clean', 'wash', 'cook', 'bake', 'brew'],
    // Personal care and domestic moments
    everyday: ['morning', 'wake up', 'get dressed', 'undress', 'change clothes', 'bath', 'shower', 'swim', 'exercise', 'stretch', 'train', 'practice', 'groom', 'shave', 'brush', 'comb', 'put on', 'take off', 'pack', 'unpack', 'tidy', 'organize'],
    // Intimate but non-romantic personal moments
    intimate: ['confide', 'share secret', 'open up', 'vulnerable', 'trust', 'comfort', 'hug', 'pat back', 'shoulder to cry', 'listen closely', 'understand', 'empathize', 'support', 'encourage', 'reassure', 'care for', 'tend to', 'nurse', 'bandage', 'heal'],
    environmental: ['rain', 'wind', 'sun', 'storm', 'landscape', 'city', 'building', 'street', 'forest', 'look around', 'survey'],
  };

  // Check player action FIRST for moment type (more reliable indicator of current activity)
  for (const [type, indicators] of Object.entries(momentIndicators)) {
    if (indicators.some(ind => lowerAction.includes(ind))) {
      momentType = type as SceneEssence['momentType'];
      break;
    }
  }
  
  // If no match from player, check narrator
  if (momentType === 'environmental') {
    for (const [type, indicators] of Object.entries(momentIndicators)) {
      if (indicators.some(ind => lowerNarrator.includes(ind))) {
        momentType = type as SceneEssence['momentType'];
        break;
      }
    }
  }

  // Extract visual elements mentioned in the scene
  const visualElements: string[] = [];
  const visualPatterns = [
    /(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(?:is|are|stands?|lies?|hangs?|floats?)/gi,
    /(?:broken|ruined|old|new|large|small|dark|bright|glowing|shimmering)\s+(\w+)/gi,
    /(\w+)\s+(?:everywhere|around|nearby|ahead|behind)/gi,
    /(?:see|notice|spot)\s+(?:a|an|the)?\s*(\w+(?:\s+\w+)?)/gi,
  ];
  for (const pattern of visualPatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      if (match[1] && match[1].length > 2 && !['you', 'your', 'the', 'and', 'but'].includes(match[1].toLowerCase())) {
        visualElements.push(match[1].trim());
      }
    }
  }

  // Extract setting/location
  let setting = '';
  
  // First check explicit location patterns
  const locationPatterns = [
    /(?:in|inside|within|at|into)\s+(?:the|a)?\s*([^,.!?]{4,40})/gi,
    /(?:enter|arrive at|reach|approach)\s+(?:the|a)?\s*([^,.!?]{4,40})/gi,
    /(?:the|a)\s+(pool|room|building|street|alley|hall|corridor|forest|city|town|base|camp|ruins|wasteland|market|bar|club|office|warehouse|factory|ship|station|platform)[^,.!?]*/gi,
  ];
  
  for (const pattern of locationPatterns) {
    const match = combined.match(pattern);
    if (match) {
      setting = (match[1] || match[0]).trim().replace(/^(the|a|an)\s+/i, '');
      break;
    }
  }
  
  // Check for water/pool specifically since that's a common miss
  if (lowerCombined.includes('pool') || lowerCombined.includes('swim') || lowerCombined.includes('water') || lowerCombined.includes('dive')) {
    if (!setting.includes('pool') && !setting.includes('water')) {
      if (lowerCombined.includes('pool')) {
        setting = setting ? `${setting} with pool` : 'pool area';
      } else if (lowerCombined.includes('swim')) {
        setting = setting ? `${setting} with water` : 'water/swimming area';
      }
    }
  }
  
  if (!setting) setting = 'the scene';

  // Extract atmosphere words
  const atmosphereWords: string[] = [];
  const atmospherePatterns = [
    /\b(dark|bright|dim|shadowy|lit|glowing|flickering|neon|luminous)\b/gi,
    /\b(cold|hot|warm|freezing|humid|dry|steamy|icy)\b/gi,
    /\b(quiet|loud|noisy|silent|echoing|rumbling|buzzing)\b/gi,
    /\b(crowded|empty|busy|desolate|abandoned|lively|packed)\b/gi,
    /\b(tense|peaceful|chaotic|eerie|welcoming|hostile|calm)\b/gi,
    /\b(wet|damp|dry|dusty|misty|foggy|smoky)\b/gi,
  ];
  for (const pattern of atmospherePatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      atmosphereWords.push(match[1].toLowerCase());
    }
  }

  // Extract other characters/entities from narrator
  const others: string[] = [];
  const otherPatterns = [
    /(?:the|a|an)\s+(soldier|guard|man|woman|figure|stranger|merchant|officer|creature|beast|group|crowd|people|person|bartender|vendor|robot|android|cyborg|mutant)[s]?/gi,
    /([A-Z][a-z]+)\s+(?:says?|speaks?|shouts?|attacks?|approaches?|stands?|looks?|turns?)/gi,
  ];
  for (const pattern of otherPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      const other = match[1];
      if (other && !['you', 'your', 'the', 'They', 'She', 'He'].includes(other)) {
        others.push(other);
      }
    }
  }

  // Extract objects
  const objects: string[] = [];
  const objectPatterns = [
    /(?:the|a|an)\s+(door|window|table|chair|weapon|gun|knife|box|crate|vehicle|car|body|corpse|terminal|screen|sign|poster|bottle|glass|pool|water|fountain|statue|lamp|light)[s]?/gi,
  ];
  for (const pattern of objectPatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      objects.push(match[1]);
    }
  }

  // Extract sensory details
  const sensoryDetails: string[] = [];
  const sensoryPatterns = [
    /(?:smell|stench|odor|scent)\s+of\s+([^,.]+)/gi,
    /(?:sound|noise)\s+of\s+([^,.]+)/gi,
    /\b(rain|wind|thunder|gunfire|screams|music|silence|smoke|dust|blood|chlorine|steam|splash|ripples)\b/gi,
  ];
  for (const pattern of sensoryPatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      sensoryDetails.push(match[1] || match[0]);
    }
  }

  // ========================================
  // ROMANTIC CONTEXT DETECTION
  // ========================================
  let romanticContext: SceneEssence['romanticContext'] | undefined;
  
  if (momentType === 'romantic') {
    // Determine intimacy level based on specific keywords
    let intimacyLevel: 'tender' | 'passionate' | 'playful' | 'longing' = 'tender';
    const focusElements: string[] = [];
    
    // Passionate indicators
    const passionateKeywords = ['passion', 'desire', 'deeply', 'intensely', 'desperately', 'hungry', 'fire', 'burning', 'fierce'];
    // Playful indicators
    const playfulKeywords = ['playful', 'tease', 'wink', 'smirk', 'giggle', 'laugh', 'tickle', 'chase', 'flirt', 'mischievous'];
    // Longing indicators
    const longingKeywords = ['longing', 'yearn', 'miss', 'distant', 'gaze', 'dream', 'wish', 'hope', 'wait', 'separate'];
    
    if (passionateKeywords.some(k => lowerCombined.includes(k))) {
      intimacyLevel = 'passionate';
      focusElements.push('intense connection', 'close proximity', 'emotional intensity');
    } else if (playfulKeywords.some(k => lowerCombined.includes(k))) {
      intimacyLevel = 'playful';
      focusElements.push('light-hearted moment', 'shared joy', 'spontaneous affection');
    } else if (longingKeywords.some(k => lowerCombined.includes(k))) {
      intimacyLevel = 'longing';
      focusElements.push('emotional distance', 'yearning expression', 'bittersweet atmosphere');
    } else {
      focusElements.push('gentle moment', 'soft connection', 'quiet intimacy');
    }
    
    // Extract romantic visual elements
    const romanticVisualPatterns = [
      /\b(hands?\s+(?:touching|holding|intertwined))\b/gi,
      /\b(eyes?\s+(?:meeting|locked|gazing))\b/gi,
      /\b(close\s+together|side\s+by\s+side|face\s+to\s+face)\b/gi,
      /\b(sunset|moonlight|candlelight|starlight|firelight)\b/gi,
      /\b(flowers|rose|petals)\b/gi,
    ];
    
    for (const pattern of romanticVisualPatterns) {
      let match;
      while ((match = pattern.exec(combined)) !== null) {
        focusElements.push(match[0].toLowerCase());
      }
    }
    
    romanticContext = { intimacyLevel, focusElements: [...new Set(focusElements)].slice(0, 5) };
    console.log('Romantic context detected:', intimacyLevel, focusElements.slice(0, 3));
  }

  // ========================================
  // CASUAL/EVERYDAY CONTEXT DETECTION
  // ========================================
  let casualContext: SceneEssence['casualContext'] | undefined;
  
  if (momentType === 'casual' || momentType === 'everyday' || momentType === 'intimate') {
    let activityType: 'social' | 'personal' | 'work' | 'leisure' | 'domestic' = 'leisure';
    let mood: 'relaxed' | 'busy' | 'focused' | 'playful' = 'relaxed';
    
    // Determine activity type
    const socialKeywords = ['drink', 'toast', 'chat', 'laugh', 'party', 'gather', 'celebrate', 'share', 'together'];
    const personalKeywords = ['bath', 'shower', 'groom', 'dress', 'undress', 'change', 'exercise', 'stretch', 'wake'];
    const workKeywords = ['work', 'repair', 'fix', 'build', 'forge', 'craft', 'write', 'study', 'research'];
    const domesticKeywords = ['cook', 'clean', 'wash', 'tidy', 'organize', 'bake', 'brew', 'prepare'];
    
    if (socialKeywords.some(k => lowerCombined.includes(k))) {
      activityType = 'social';
      mood = Math.random() > 0.5 ? 'playful' : 'relaxed';
    } else if (personalKeywords.some(k => lowerCombined.includes(k))) {
      activityType = 'personal';
      mood = 'relaxed';
    } else if (workKeywords.some(k => lowerCombined.includes(k))) {
      activityType = 'work';
      mood = Math.random() > 0.5 ? 'focused' : 'busy';
    } else if (domesticKeywords.some(k => lowerCombined.includes(k))) {
      activityType = 'domestic';
      mood = 'relaxed';
    }
    
    casualContext = { activityType, mood };
    console.log('Casual context detected:', activityType, mood);
  }

  // Debug log with actual content
  console.log('Extracted player action:', playerDoing || 'none');
  console.log('Extracted setting:', setting);
  console.log('Core scene:', coreAction.slice(0, 100));

  return {
    coreAction,
    momentType,
    visualElements: [...new Set(visualElements)].slice(0, 6),
    setting,
    atmosphereWords: [...new Set(atmosphereWords)],
    playerDoing,
    others: [...new Set(others)].slice(0, 4),
    objects: [...new Set(objects)].slice(0, 5),
    sensoryDetails: [...new Set(sensoryDetails)].slice(0, 4),
    romanticContext,
    casualContext,
  };
}

// ============================================================================
// COMPOSITION VARIATIONS
// ============================================================================

const CAMERA_ANGLES = {
  wide: ['wide establishing shot', 'sweeping wide angle view', 'panoramic vista', 'extreme wide shot showing scale'],
  medium: ['medium wide shot', 'environmental medium shot', 'balanced composition showing scene', 'mid-range framing'],
  dynamic: ['dutch angle adding tension', 'dramatic low angle', 'high angle looking down', 'asymmetric dynamic composition'],
  intimate: ['close environmental shot', 'tight framing on details', 'intimate scene composition', 'focused close view'],
  romantic: ['soft focus intimate framing', 'close two-shot composition', 'tender moment captured', 'artistic romantic portrait style'],
  casual: ['comfortable medium shot', 'slice of life framing', 'candid moment composition', 'natural everyday perspective'],
  everyday: ['observational documentary style', 'lived-in scene framing', 'casual activity captured', 'natural lifestyle shot'],
};

const LIGHTING_VARIATIONS = {
  natural: ['natural ambient lighting', 'soft diffused daylight', 'harsh direct sunlight with deep shadows', 'golden hour warm light'],
  dramatic: ['dramatic chiaroscuro lighting', 'harsh contrast lighting', 'single strong light source', 'rim lighting silhouettes'],
  atmospheric: ['volumetric light rays', 'hazy atmospheric lighting', 'god rays through dust', 'foggy diffused glow'],
  artificial: ['fluorescent harsh lighting', 'neon color cast', 'mixed artificial sources', 'flickering unstable light'],
  night: ['moonlight and shadows', 'scattered artificial lights in darkness', 'low-key nighttime lighting', 'fire/explosion illumination'],
  romantic: ['soft golden hour glow', 'warm candlelight ambiance', 'dreamy backlit silhouettes', 'gentle moonlight romance', 'soft diffused intimate lighting'],
  casual: ['comfortable ambient lighting', 'warm interior glow', 'natural window light', 'cozy lamp light'],
  everyday: ['morning light through windows', 'afternoon sun', 'practical mixed lighting', 'natural everyday illumination'],
};

const ATMOSPHERE_ADDITIONS = {
  particles: ['dust particles floating in air', 'ash drifting down', 'rain droplets visible', 'smoke wisps', 'sparks floating', 'debris in wind'],
  weather: ['rain puddles reflecting', 'wet surfaces glistening', 'fog rolling through', 'heat haze distortion', 'wind-blown elements'],
  environmental: ['distant activity visible', 'background movement', 'environmental storytelling details', 'signs of recent events', 'lived-in world details'],
  romantic: ['soft bokeh background', 'gentle lens flare', 'flower petals drifting', 'warm color wash', 'dreamy soft focus edges'],
  casual: ['steam from drinks', 'smoke wisps', 'comfortable clutter', 'lived-in details', 'natural imperfections'],
  everyday: ['daily life in motion', 'background activity', 'ambient sounds implied', 'comfortable atmosphere'],
};

const COMPOSITION_FOCUS = {
  environment: ['environment dominates frame', 'architecture and space as subject', 'landscape fills the view', 'setting is the story'],
  event: ['action captured mid-moment', 'event unfolding in frame', 'dynamic moment frozen', 'narrative beat visualized'],
  mood: ['atmosphere is palpable', 'mood conveyed through visuals', 'emotional resonance in composition'],
  detail: ['specific details tell the story', 'meaningful objects prominent', 'visual clues for narrative'],
  connection: ['two figures as focal point', 'emotional bond visualized', 'intimate moment between characters', 'shared space and connection'],
  activity: ['activity as focal point', 'task being performed', 'hands and objects in focus', 'process captured'],
  lifestyle: ['slice of life moment', 'everyday beauty captured', 'candid natural scene', 'authentic moment frozen'],
};

// ============================================================================
// GENRE STYLE BANKS
// ============================================================================

const GENRE_STYLES: Record<string, {
  baseStyles: string[];
  colorPalettes: string[];
  environmentTypes: string[];
  atmosphericElements: string[];
  worldDetails: string[];
  lightingPreferences: string[];
  everydayActivities: string[];
  socialDynamics: string[];
  intimateMoments: string[];
  casualInteractions: string[];
  environmentalLife: string[];
}> = {
  modern: {
    baseStyles: ['modern urban realism', 'contemporary gritty aesthetic', 'photorealistic modern setting', 'slice of life urban'],
    colorPalettes: ['muted earth tones and urban grays', 'concrete and steel colors', 'military greens and tans', 'coffee shop warm browns'],
    environmentTypes: ['urban streets and buildings', 'modern city environment', 'industrial urban landscape', 'cozy apartment interior'],
    atmosphericElements: ['city smog', 'vehicle exhaust', 'street steam', 'rain on pavement', 'urban debris', 'morning sunlight through blinds'],
    worldDetails: ['parked vehicles', 'street signs', 'power lines', 'graffiti', 'civilians', 'coffee cups', 'smartphones'],
    lightingPreferences: ['natural', 'artificial', 'dramatic'],
    everydayActivities: ['drinking coffee', 'checking phone', 'walking dog', 'jogging in park', 'reading newspaper', 'grocery shopping', 'waiting for bus', 'enjoying street food'],
    socialDynamics: ['friends chatting at cafe', 'coworkers on lunch break', 'couple holding hands', 'neighbors greeting', 'strangers sharing umbrella', 'bartender serving drinks'],
    intimateMoments: ['quiet moment at window', 'comfortable silence together', 'cooking dinner together', 'watching sunset from rooftop', 'lazy morning in bed', 'slow dancing in kitchen'],
    casualInteractions: ['waving hello', 'sharing earbuds', 'splitting a meal', 'pointing at something interesting', 'laughing at joke', 'helping with groceries'],
    environmentalLife: ['birds on power lines', 'street cats', 'food vendors preparing', 'baristas making coffee', 'people rushing to work'],
  },
  cyberpunk: {
    baseStyles: ['cyberpunk neon noir', 'high-tech dystopian aesthetic', 'neo-noir futurism', 'rain-slicked neon future', 'blade runner atmosphere'],
    colorPalettes: ['neon pink and cyan on dark', 'electric blue and magenta', 'chrome and neon reflections', 'holographic rainbow on black'],
    environmentTypes: ['neon-lit megacity streets', 'towering corporate arcologies', 'high-tech slums', 'underground hacker dens', 'chrome nightclubs'],
    atmosphericElements: ['neon signs everywhere', 'holographic advertisements', 'steam from vents', 'constant rain', 'data streams visible', 'AR overlays'],
    worldDetails: ['flying vehicles', 'augmented people', 'robots', 'street vendors', 'hackers', 'chrome implants glowing', 'holographic pets'],
    lightingPreferences: ['atmospheric', 'artificial', 'night'],
    everydayActivities: ['interfacing with neural jack', 'browsing AR displays', 'ordering synth-food', 'charging cybernetics', 'streaming consciousness', 'upgrading implants at clinic'],
    socialDynamics: ['hackers sharing data', 'cyber-enhanced dancers', 'dealers in shadows', 'corpo workers on break', 'street racers meeting', 'netrunners collaborating'],
    intimateMoments: ['sharing neural link', 'rain-soaked embrace under neon', 'quiet moment in capsule hotel', 'watching city lights together', 'syncing heartbeats via implant'],
    casualInteractions: ['bumping fists with chrome hands', 'sharing bootleg software', 'exchanging crypto', 'checking each others mods', 'discussing latest corpo scandal'],
    environmentalLife: ['maintenance drones buzzing', 'holographic koi swimming', 'street food sizzling', 'neon flickering', 'AR advertisements following people'],
  },
  postapoc: {
    baseStyles: ['post-apocalyptic desolation', 'wasteland survivor aesthetic', 'ruined civilization', 'hope among ruins'],
    colorPalettes: ['rust oranges and dusty browns', 'faded sun-bleached colors', 'ash and ember tones', 'desert sunset golds'],
    environmentTypes: ['ruined cityscape', 'overgrown urban decay', 'desert wasteland', 'survivor settlement', 'reclaimed greenhouse'],
    atmosphericElements: ['dust storms', 'ash fall', 'toxic clouds', 'smoke from fires', 'creeping vegetation on ruins'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'makeshift shelters', 'scavengers', 'water collectors', 'jury-rigged solar panels'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
    everydayActivities: ['purifying water', 'tending rooftop garden', 'repairing gear', 'trading at market', 'standing watch', 'cooking over campfire', 'scavenging for parts'],
    socialDynamics: ['sharing rations around fire', 'teaching children to read', 'trading stories of before', 'community meal preparation', 'guards changing shift'],
    intimateMoments: ['watching stars from ruins', 'sharing last cigarette', 'quiet moment after long journey', 'finding beauty in wasteland flower', 'comfort after nightmare'],
    casualInteractions: ['sharing found food', 'checking each others gear', 'drawing map in dirt', 'teaching survival skills', 'repairing clothes together'],
    environmentalLife: ['crows circling', 'mutant plants growing', 'wild dogs scavenging', 'wind through broken buildings', 'rust flaking in breeze'],
  },
  postapocalyptic: {
    baseStyles: ['post-apocalyptic desolation', 'wasteland survivor aesthetic', 'ruined civilization', 'hope among ruins'],
    colorPalettes: ['rust oranges and dusty browns', 'faded sun-bleached colors', 'ash and ember tones', 'desert sunset golds'],
    environmentTypes: ['ruined cityscape', 'overgrown urban decay', 'desert wasteland', 'survivor settlement', 'reclaimed greenhouse'],
    atmosphericElements: ['dust storms', 'ash fall', 'toxic clouds', 'smoke from fires', 'creeping vegetation on ruins'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'makeshift shelters', 'scavengers', 'water collectors', 'jury-rigged solar panels'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
    everydayActivities: ['purifying water', 'tending rooftop garden', 'repairing gear', 'trading at market', 'standing watch', 'cooking over campfire', 'scavenging for parts'],
    socialDynamics: ['sharing rations around fire', 'teaching children to read', 'trading stories of before', 'community meal preparation', 'guards changing shift'],
    intimateMoments: ['watching stars from ruins', 'sharing last cigarette', 'quiet moment after long journey', 'finding beauty in wasteland flower', 'comfort after nightmare'],
    casualInteractions: ['sharing found food', 'checking each others gear', 'drawing map in dirt', 'teaching survival skills', 'repairing clothes together'],
    environmentalLife: ['crows circling', 'mutant plants growing', 'wild dogs scavenging', 'wind through broken buildings', 'rust flaking in breeze'],
  },
  scifi: {
    baseStyles: ['science fiction vista', 'clean futuristic aesthetic', 'sleek technological environment', 'optimistic space age'],
    colorPalettes: ['clean whites and chrome', 'holographic blue accents', 'high-tech metallic tones', 'starfield blacks with accent lights'],
    environmentTypes: ['space station interior', 'futuristic city', 'alien landscape', 'starship bridge', 'biodome habitat'],
    atmosphericElements: ['holographic displays', 'energy fields', 'artificial atmosphere', 'zero-g particles floating', 'climate-controlled mist'],
    worldDetails: ['robots', 'drones', 'holographic interfaces', 'advanced vehicles', 'alien flora', 'transparent lifts'],
    lightingPreferences: ['artificial', 'natural', 'dramatic'],
    everydayActivities: ['reviewing star charts', 'exercising in low-g', 'eating synthesized meal', 'video calling across galaxies', 'calibrating equipment', 'meditation in observation deck'],
    socialDynamics: ['crew playing zero-g sports', 'scientists debating discovery', 'pilots sharing stories', 'aliens and humans mingling', 'diplomatic reception'],
    intimateMoments: ['watching nebula together', 'floating embrace in zero-g', 'quiet in observation lounge', 'first contact moment', 'sharing oxygen after rescue'],
    casualInteractions: ['comparing alien souvenirs', 'trying exotic alien cuisine', 'teaching alien customs', 'fixing equipment together', 'betting on asteroid races'],
    environmentalLife: ['robots maintaining systems', 'alien pets moving about', 'plants in hydroponics', 'artificial gravity adjustments', 'stars moving past viewports'],
  },
  ww2: {
    baseStyles: ['1940s wartime documentary', 'World War 2 historical', 'wartime grit and authenticity', 'band of brothers realism'],
    colorPalettes: ['desaturated sepia tones', 'military olive and brown', 'mud and blood colors', 'vintage photograph warmth'],
    environmentTypes: ['war-torn European village', 'battlefield trenches', 'bombed city ruins', 'military camp', 'countryside farmhouse'],
    atmosphericElements: ['smoke from explosions', 'fog of war', 'rain and mud', 'artillery fire', 'morning mist over fields'],
    worldDetails: ['period vehicles', 'soldiers', 'sandbags', 'barbed wire', 'rubble', 'propaganda posters', 'ration tins'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
    everydayActivities: ['writing letters home', 'playing cards in barracks', 'cleaning rifle', 'sharing cigarettes', 'eating from mess kit', 'reading mail from home'],
    socialDynamics: ['soldiers singing together', 'medic treating wounded', 'officers planning mission', 'locals sharing bread', 'troops joking before battle'],
    intimateMoments: ['farewell before deployment', 'nurse comforting soldier', 'reading letter by candlelight', 'reunion embrace', 'finding photograph of loved one'],
    casualInteractions: ['lighting buddys cigarette', 'sharing chocolate ration', 'teaching local phrases', 'playing harmonica for group', 'trading war souvenirs'],
    environmentalLife: ['chickens in village yard', 'horses pulling supplies', 'children playing in ruins', 'laundry drying on line', 'farmers continuing work'],
  },
  war: {
    baseStyles: ['war photography aesthetic', 'gritty military realism', 'battlefield chaos', 'modern combat documentary'],
    colorPalettes: ['muted greens and browns', 'smoke and fire colors', 'mud and blood tones', 'night vision green'],
    environmentTypes: ['active battlefield', 'military positions', 'combat zones', 'forward operating base', 'urban warfare setting'],
    atmosphericElements: ['smoke', 'debris', 'explosions', 'tracer fire', 'helicopter downwash', 'dust kicked up'],
    worldDetails: ['military vehicles', 'fortifications', 'destroyed equipment', 'soldiers', 'medics', 'supply crates'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
    everydayActivities: ['field maintenance on weapons', 'eating MREs', 'setting up comms', 'patrolling perimeter', 'writing in journal', 'checking maps'],
    socialDynamics: ['squad briefing', 'medic training others', 'soldiers arm wrestling', 'sharing photos from home', 'memorial for fallen'],
    intimateMoments: ['video call with family', 'quiet prayer before mission', 'buddy checking wounds', 'moment of silence at sunset', 'receiving care package'],
    casualInteractions: ['fist bumping after mission', 'sharing energy drink', 'showing off tattoo', 'debating sports teams', 'teaching local kids soccer'],
    environmentalLife: ['stray dogs near base', 'local civilians cautiously watching', 'vendors near safe zone', 'birds startled by explosions', 'goats wandering ruins'],
  },
  medieval: {
    baseStyles: ['epic medieval fantasy', 'dark fantasy aesthetic', 'gritty medieval realism', 'historical drama'],
    colorPalettes: ['rich earth tones and gold', 'deep forest greens', 'torchlit warm oranges', 'castle stone grays'],
    environmentTypes: ['castle and fortress', 'medieval village', 'dark forest', 'bustling market square', 'tavern interior'],
    atmosphericElements: ['torch smoke', 'morning mist', 'firelight flicker', 'rain', 'woodsmoke from chimneys'],
    worldDetails: ['horses', 'carts', 'market stalls', 'peasants', 'banners', 'chickens in streets', 'hanging herbs'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
    everydayActivities: ['blacksmith hammering', 'bread baking', 'horses being brushed', 'clothes being washed in stream', 'children playing with sticks', 'ale being poured'],
    socialDynamics: ['merchants haggling', 'bards performing', 'nobles feasting', 'peasants gossiping at well', 'guards changing watch'],
    intimateMoments: ['dancing at festival', 'stolen kiss behind tavern', 'braiding lovers hair', 'sharing cloak in rain', 'midnight meeting in garden'],
    casualInteractions: ['toasting with tankards', 'arm wrestling at table', 'examining merchants wares', 'feeding horse treats', 'sharing bread and cheese'],
    environmentalLife: ['dogs chasing chickens', 'cats hunting mice', 'pigeons on rooftops', 'smoke rising from village', 'sheep grazing hillside'],
  },
  fantasy: {
    baseStyles: ['high fantasy epic vista', 'magical realm aesthetic', 'mythical grandeur', 'enchanted world wonder'],
    colorPalettes: ['rich jewel tones', 'magical purples and golds', 'ethereal blues and silvers', 'fairy tale colors'],
    environmentTypes: ['magical landscapes', 'enchanted forests', 'mystical structures', 'ancient ruins', 'crystal caverns'],
    atmosphericElements: ['magical particles', 'ethereal mist', 'glowing runes', 'floating elements', 'fairy lights'],
    worldDetails: ['mythical creatures', 'ancient ruins', 'magical flora', 'arcane symbols', 'floating islands', 'crystal formations'],
    lightingPreferences: ['atmospheric', 'dramatic', 'natural'],
    everydayActivities: ['brewing potions', 'reading ancient tomes', 'practicing spellwork', 'tending magical garden', 'enchanting items', 'feeding familiar'],
    socialDynamics: ['wizards debating arcana', 'elves and dwarves trading', 'apprentice learning from master', 'festival of the moons', 'council of races meeting'],
    intimateMoments: ['watching fireflies together', 'sharing magical revelation', 'dancing under enchanted stars', 'healing touch lingering', 'promise under fairy ring'],
    casualInteractions: ['sharing exotic tea', 'admiring magical trinket', 'playful spell exchange', 'debating best dragon breed', 'trying unusual magical food'],
    environmentalLife: ['fairies tending flowers', 'magical creatures grazing', 'animated brooms sweeping', 'crystal chimes singing', 'enchanted fountain flowing'],
  },
  horror: {
    baseStyles: ['dark horror atmosphere', 'survival horror aesthetic', 'psychological dread', 'gothic tension'],
    colorPalettes: ['desaturated sickly tones', 'deep shadows and pale highlights', 'blood red accents', 'moonlit blues'],
    environmentTypes: ['abandoned building', 'dark forest', 'decrepit facility', 'haunted mansion', 'foggy cemetery'],
    atmosphericElements: ['thick fog', 'unnatural shadows', 'flickering lights', 'decay', 'cobwebs'],
    worldDetails: ['abandoned objects', 'mysterious stains', 'broken things', 'unsettling shapes', 'old photographs'],
    lightingPreferences: ['night', 'atmospheric', 'dramatic'],
    everydayActivities: ['reading by candlelight', 'exploring with flashlight', 'locking doors nervously', 'researching old legends', 'checking shadows', 'setting up protective wards'],
    socialDynamics: ['survivors huddling together', 'investigating strange sounds', 'sharing ghost stories', 'comforting after nightmare', 'planning escape route'],
    intimateMoments: ['holding hands in darkness', 'protective embrace', 'whispered comfort', 'finding each other after fear', 'trust built through terror'],
    casualInteractions: ['nervous laughter at false alarm', 'sharing flashlight battery', 'checking on each other', 'passing food in hiding', 'signaling all clear'],
    environmentalLife: ['crows watching', 'rats scurrying', 'wind rattling windows', 'shadows moving', 'candles guttering'],
  },
  western: {
    baseStyles: ['classic western vista', 'frontier aesthetic', 'dusty cowboy realism', 'golden age western'],
    colorPalettes: ['warm browns and oranges', 'dusty desert tones', 'sunset reds and golds', 'weathered leather colors'],
    environmentTypes: ['dusty frontier town', 'desert landscape', 'saloon interior', 'canyon vista', 'ranch homestead'],
    atmosphericElements: ['dust', 'tumbleweeds', 'heat haze', 'gun smoke', 'campfire smoke'],
    worldDetails: ['horses', 'wagons', 'wooden buildings', 'cacti', 'cowboys', 'water troughs', 'hitching posts'],
    lightingPreferences: ['natural', 'dramatic', 'atmospheric'],
    everydayActivities: ['playing poker', 'tending horses', 'drinking whiskey at bar', 'rolling cigarette', 'playing harmonica', 'branding cattle', 'cleaning pistol'],
    socialDynamics: ['cowboys swapping tales', 'poker game in saloon', 'sheriff making rounds', 'ranchers at cattle auction', 'prospectors sharing claims'],
    intimateMoments: ['dancing at hoedown', 'watching sunset from porch', 'riding double on horse', 'meeting at watering hole', 'stealing kiss behind barn'],
    casualInteractions: ['tipping hat in greeting', 'buying round of drinks', 'examining horse teeth', 'comparing revolvers', 'trading trail advice'],
    environmentalLife: ['vultures circling', 'lizards on rocks', 'horses at trough', 'saloon piano playing', 'dogs sleeping in shade'],
  },
  noir: {
    baseStyles: ['film noir 1940s', 'moody detective aesthetic', 'black and white crime drama', 'hardboiled atmosphere'],
    colorPalettes: ['black and white tones', 'deep shadows', 'high contrast', 'cigarette amber and whiskey gold'],
    environmentTypes: ['rain-slicked city streets', 'shadowy alleys', 'dimly lit interiors', 'jazz club', 'private eye office'],
    atmosphericElements: ['rain', 'neon signs', 'cigarette smoke', 'venetian blind shadows', 'steam from grates'],
    worldDetails: ['vintage cars', 'street lamps', 'wet pavement', 'fedoras', 'cigarette holders', 'rotary phones'],
    lightingPreferences: ['dramatic', 'night', 'atmospheric'],
    everydayActivities: ['nursing whiskey at bar', 'reading newspaper', 'typing report', 'examining photographs', 'listening to jazz', 'reviewing case files'],
    socialDynamics: ['informant meeting in shadows', 'jazz band performing', 'bartender polishing glasses', 'couples slow dancing', 'poker in back room'],
    intimateMoments: ['lighting her cigarette', 'slow dance at jazz club', 'lingering glance across room', 'whispered secrets at bar', 'rain-soaked confession'],
    casualInteractions: ['passing envelope under table', 'sharing newspaper', 'nodding to regular', 'bumming cigarette', 'leaving generous tip'],
    environmentalLife: ['rain streaming down windows', 'neon reflecting in puddles', 'smoke curling to ceiling', 'jazz drifting from club', 'cats in alley'],
  },
  victorian: {
    baseStyles: ['victorian era aesthetic', 'gaslight atmosphere', 'period drama realism', 'Dickensian detail'],
    colorPalettes: ['brass and copper tones', 'deep burgundy', 'sepia and brown', 'foggy gray-greens'],
    environmentTypes: ['Victorian streets', 'gaslit architecture', 'industrial factories', 'opulent parlor', 'London fog'],
    atmosphericElements: ['steam', 'fog', 'gaslight', 'chimney smoke', 'coal dust'],
    worldDetails: ['carriages', 'factory smoke', 'clockwork', 'ornate buildings', 'street vendors', 'flower girls'],
    lightingPreferences: ['atmospheric', 'natural', 'dramatic'],
    everydayActivities: ['taking afternoon tea', 'reading by fireplace', 'writing letters', 'embroidery by window', 'playing piano', 'tending garden'],
    socialDynamics: ['society gathering in parlor', 'servants bustling below stairs', 'gentlemen at club', 'ladies promenading in park', 'street urchins playing'],
    intimateMoments: ['waltz at ball', 'brushed hands over teacups', 'secret glance at opera', 'walk in moonlit garden', 'carriage ride confession'],
    casualInteractions: ['tipping hat to lady', 'discussing weather', 'sharing cab in rain', 'admiring pocket watch', 'sampling tea selection'],
    environmentalLife: ['horses pulling carriages', 'newsboys calling headlines', 'flower sellers on corners', 'lamp lighters at dusk', 'pigeons on rooftops'],
  },
  steampunk: {
    baseStyles: ['Victorian steampunk', 'brass and copper aesthetic', 'clockwork fantasy', 'retro-futuristic Victorian'],
    colorPalettes: ['brass gold', 'copper', 'dark wood', 'leather brown', 'steam cloud whites'],
    environmentTypes: ['brass machinery city', 'Victorian industrial', 'airship deck', 'inventors workshop', 'clocktower interior'],
    atmosphericElements: ['steam', 'gears turning', 'brass machinery', 'pressure valves', 'coal smoke'],
    worldDetails: ['airships', 'clockwork automatons', 'pipes', 'goggles', 'mechanical limbs', 'pressure gauges'],
    lightingPreferences: ['atmospheric', 'artificial', 'dramatic'],
    everydayActivities: ['adjusting goggles', 'calibrating instruments', 'polishing brass', 'reading steam gauge', 'winding clockwork', 'testing invention'],
    socialDynamics: ['inventors comparing gadgets', 'airship crew working together', 'mechanics debating designs', 'aristocrats with gadgets', 'street vendors of curiosities'],
    intimateMoments: ['fixing partners clockwork heart', 'dancing amid steam and gears', 'watching sunset from airship', 'sharing discovery excitement', 'first flight together'],
    casualInteractions: ['examining new invention', 'trading spare parts', 'comparing pocket watches', 'showing off augmentation', 'sharing technical schematics'],
    environmentalLife: ['clockwork birds singing', 'steam venting rhythmically', 'gears turning in walls', 'automatons performing tasks', 'dirigibles passing overhead'],
  },
  pirate: {
    baseStyles: ['golden age of piracy', 'seafaring adventure', 'caribbean swashbuckler', 'treasure island adventure'],
    colorPalettes: ['ocean blues', 'weathered wood', 'gold accents', 'tropical greens', 'sunset oranges'],
    environmentTypes: ['open seas', 'island harbors', 'ship decks', 'port towns', 'hidden cove'],
    atmosphericElements: ['sea spray', 'ship rigging', 'tropical clouds', 'cannon smoke', 'salt mist'],
    worldDetails: ['sailing ships', 'palm trees', 'treasure', 'dock workers', 'exotic birds', 'rum barrels'],
    lightingPreferences: ['natural', 'dramatic', 'atmospheric'],
    everydayActivities: ['swabbing deck', 'navigating by stars', 'drinking rum', 'mending sails', 'fishing off stern', 'playing dice', 'singing sea shanties'],
    socialDynamics: ['crew sharing grog', 'captain at wheel', 'pirates dividing plunder', 'tavern arm wrestling', 'merchants negotiating'],
    intimateMoments: ['watching stars at sea', 'dancing in port tavern', 'sharing sunset at bow', 'first landfall together', 'promise to return'],
    casualInteractions: ['comparing scars', 'teaching knot tying', 'sharing exotic fruit', 'betting on cards', 'trading port stories'],
    environmentalLife: ['dolphins following ship', 'parrots on shoulders', 'gulls circling masts', 'crabs on beach', 'fish jumping at bow'],
  },
  zombie: {
    baseStyles: ['zombie apocalypse', 'urban decay horror', 'survival horror', 'walking dead atmosphere'],
    colorPalettes: ['desaturated greens', 'grays', 'blood reds', 'decay browns', 'sickly yellows'],
    environmentTypes: ['abandoned cities', 'overrun streets', 'survivor camps', 'barricaded buildings', 'quarantine zones'],
    atmosphericElements: ['decay', 'abandoned buildings', 'fire smoke', 'blood splatter', 'overgrown vegetation'],
    worldDetails: ['abandoned cars', 'barricades', 'graffiti', 'shambling figures', 'supply caches', 'warning signs'],
    lightingPreferences: ['atmospheric', 'dramatic', 'night'],
    everydayActivities: ['fortifying shelter', 'rationing supplies', 'keeping watch', 'sharpening weapons', 'searching for food', 'treating wounds', 'planning supply run'],
    socialDynamics: ['survivors voting on decisions', 'teaching combat skills', 'grieving lost companions', 'celebrating small victories', 'arguing over resources'],
    intimateMoments: ['comfort after close call', 'dancing in safe room', 'sharing last meal together', 'watch duty together', 'finding hope in each other'],
    casualInteractions: ['trading supplies', 'sharing food finds', 'showing off zombie kill count', 'comparing survival gear', 'telling stories of before'],
    environmentalLife: ['rats scurrying', 'crows on corpses', 'plants reclaiming buildings', 'distant groans', 'fires burning in distance'],
  },
};

// ============================================================================
// LEGACY CHARACTER PROFILE BUILDER
// ============================================================================

function buildLegacyCharacterProfile(char: SceneImageRequest['playerCharacter']): CharacterVisualProfile | null {
  if (!char || !char.name) return null;

  const buildDescs: Record<string, string> = {
    athletic: 'athletic muscular build', lean: 'lean agile build', muscular: 'heavily muscular build',
    stocky: 'stocky sturdy build', slim: 'slim slender build', average: 'average build',
  };
  const skinDescs: Record<string, string> = {
    pale: 'pale fair skin', light: 'light skin tone', medium: 'medium skin tone',
    tan: 'tanned skin', olive: 'olive skin tone', brown: 'brown skin tone', dark: 'dark skin tone',
  };
  const hairColorDescs: Record<string, string> = {
    black: 'jet black hair', brown: 'brown hair', darkBrown: 'dark brown hair',
    blonde: 'blonde hair', red: 'red auburn hair', white: 'white silver hair', gray: 'gray hair',
  };
  const hairStyleDescs: Record<string, string> = {
    short: 'short cropped hair', military: 'military buzz cut', shaved: 'shaved bald head',
    long: 'long flowing hair', ponytail: 'hair tied in tactical ponytail', messy: 'messy unkempt hair',
  };
  const eyeColorDescs: Record<string, string> = {
    brown: 'deep brown eyes', blue: 'bright blue eyes', green: 'striking green eyes',
    hazel: 'hazel eyes', gray: 'steel gray eyes',
  };
  const roleAppearances: Record<string, string> = {
    soldier: 'wearing military tactical gear, armed', medic: 'wearing combat medic gear with red cross',
    sniper: 'wearing ghillie suit elements', heavy: 'wearing heavy reinforced armor',
    tank: 'wearing tanker jacket with oil stains', pilot: 'wearing flight suit with patches',
    officer: 'wearing decorated officer uniform', knight: 'wearing ornate plate armor',
    rogue: 'wearing dark leather armor', mage: 'wearing armored battle robes',
    survivor: 'wearing scavenged makeshift armor',
  };

  const details = char.details || [];
  const facialFeatures: CharacterVisualProfile['facialFeatures'] = {};
  if (details.includes('scars')) facialFeatures.scars = 'visible battle scars on face';
  if (details.includes('tattoos')) facialFeatures.tattoos = 'military tattoos visible';
  facialFeatures.beard = details.includes('beard') ? 'tactical beard with stubble' : 'clean shaven';

  const modifications: CharacterVisualProfile['modifications'] = {};
  if (details.includes('cybernetics')) modifications.cybernetics = 'visible cybernetic augmentations';
  if (details.includes('eyepatch')) modifications.other = 'eye patch over one eye';

  const buildDesc = buildDescs[char.build || 'athletic'] || 'athletic build';
  const skinDesc = skinDescs[char.skinTone || 'medium'] || 'medium skin tone';
  const hairColorDesc = hairColorDescs[char.hairColor || 'brown'] || 'brown hair';
  const hairStyleDesc = hairStyleDescs[char.hairStyle || 'short'] || 'short hair';
  const eyeColorDesc = eyeColorDescs[char.eyeColor || 'brown'] || 'brown eyes';
  const roleAppearance = roleAppearances[char.role || 'soldier'] || 'wearing tactical gear';

  const genderDesc = char.gender === 'female' ? 'woman with feminine features' : char.gender === 'male' ? 'man with masculine features' : 'person';
  const facialFeaturesDesc = Object.values(facialFeatures).filter(Boolean).join(', ');
  const modificationsDesc = Object.values(modifications).filter(Boolean).join(', ');

  const fullVisualDescription = [
    genderDesc, buildDesc, skinDesc, `${hairColorDesc} in ${hairStyleDesc}`,
    eyeColorDesc, facialFeaturesDesc, modificationsDesc, roleAppearance,
  ].filter(Boolean).join(', ');

  return {
    name: char.name,
    gender: (char.gender as 'male' | 'female' | 'nonbinary') || 'male',
    physicalDescription: { build: buildDesc, skinTone: skinDesc },
    hair: { color: hairColorDesc, style: hairStyleDesc },
    eyes: { color: eyeColorDesc },
    facialFeatures,
    modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
    role: char.role || 'soldier',
    roleAppearance,
    fullVisualDescription,
  };
}

// ============================================================================
// BUILD PROMPT WITH CONTROLLED RANDOMNESS (v2)
// ============================================================================

function buildIllustrationPrompt(
  request: SceneImageRequest,
  characterProfile: CharacterVisualProfile | null
): { prompt: string; negativePrompt: string; debug: any } {
  const genre = (request.genre || request.style || 'fantasy').toLowerCase();
  const narratorMessage = request.lastNarratorMessage || request.sceneDescription || '';
  const userAction = request.lastUserAction || request.playerAction || '';
  const history = request.messageHistory || [];

  // Extract scene essence
  const essence = extractSceneEssence(narratorMessage, userAction, history);
  console.log('Scene essence:', essence.momentType, '-', essence.coreAction.slice(0, 50));

  // Get genre style
  const genreStyle = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;

  const baseStyle = pick(genreStyle.baseStyles);
  const colorPalette = pick(genreStyle.colorPalettes);
  const envType = pick(genreStyle.environmentTypes);

  // Determine composition based on moment type with randomness
  let cameraOptions: string[];
  let compositionFocus: string;
  let focusType: string;
  
  // ========================================
  // GENRE-ENHANCED SCENE TYPE HANDLING
  // ========================================
  
  // Build genre-specific context for this scene type
  let genreSceneContext: string[] = [];
  
  // Special handling for romantic scenes - blend with genre
  if (essence.momentType === 'romantic') {
    cameraOptions = CAMERA_ANGLES.romantic;
    focusType = 'connection';
    compositionFocus = pick(COMPOSITION_FOCUS.connection);
    
    // Add genre-specific intimate moments for immersion
    if (genreStyle.intimateMoments && genreStyle.intimateMoments.length > 0) {
      genreSceneContext.push(pick(genreStyle.intimateMoments));
    }
    // Add genre-specific environmental life as background
    if (genreStyle.environmentalLife && genreStyle.environmentalLife.length > 0) {
      genreSceneContext.push(pick(genreStyle.environmentalLife));
    }
    console.log('Romantic context enhanced with genre:', genre, genreSceneContext.slice(0, 2));
    
  } else if (essence.momentType === 'casual' || essence.momentType === 'everyday') {
    cameraOptions = CAMERA_ANGLES.casual;
    focusType = 'lifestyle';
    compositionFocus = pick(COMPOSITION_FOCUS.lifestyle);
    
    // Add genre-specific everyday activities
    if (genreStyle.everydayActivities && genreStyle.everydayActivities.length > 0) {
      genreSceneContext.push(pick(genreStyle.everydayActivities));
    }
    // Add genre-specific casual interactions
    if (genreStyle.casualInteractions && genreStyle.casualInteractions.length > 0) {
      genreSceneContext.push(pick(genreStyle.casualInteractions));
    }
    // Add environmental life for ambiance
    if (genreStyle.environmentalLife && genreStyle.environmentalLife.length > 0) {
      genreSceneContext.push(pick(genreStyle.environmentalLife));
    }
    console.log('Casual context enhanced with genre:', genre, genreSceneContext.slice(0, 2));
    
  } else if (essence.momentType === 'intimate') {
    cameraOptions = CAMERA_ANGLES.intimate;
    focusType = 'connection';
    compositionFocus = pick(COMPOSITION_FOCUS.connection);
    
    // Add genre-specific intimate moments (non-romantic emotional connection)
    if (genreStyle.intimateMoments && genreStyle.intimateMoments.length > 0) {
      genreSceneContext.push(pick(genreStyle.intimateMoments));
    }
    if (genreStyle.socialDynamics && genreStyle.socialDynamics.length > 0) {
      genreSceneContext.push(pick(genreStyle.socialDynamics));
    }
    console.log('Intimate context enhanced with genre:', genre, genreSceneContext.slice(0, 2));
    
  } else if (essence.momentType === 'social') {
    cameraOptions = CAMERA_ANGLES.medium;
    focusType = 'event';
    compositionFocus = pick(COMPOSITION_FOCUS.event);
    
    // Add genre-specific social dynamics
    if (genreStyle.socialDynamics && genreStyle.socialDynamics.length > 0) {
      genreSceneContext.push(pick(genreStyle.socialDynamics));
    }
    if (genreStyle.casualInteractions && genreStyle.casualInteractions.length > 0) {
      genreSceneContext.push(pick(genreStyle.casualInteractions));
    }
    if (genreStyle.environmentalLife && genreStyle.environmentalLife.length > 0) {
      genreSceneContext.push(pick(genreStyle.environmentalLife));
    }
    console.log('Social context enhanced with genre:', genre, genreSceneContext.slice(0, 2));
    
  } else {
    // Default scene type handling with genre backgrounds
    switch (essence.momentType) {
      case 'action':
        cameraOptions = Math.random() > 0.3 ? CAMERA_ANGLES.dynamic : CAMERA_ANGLES.medium;
        break;
      case 'quiet':
      case 'environmental':
        cameraOptions = Math.random() > 0.4 ? CAMERA_ANGLES.wide : CAMERA_ANGLES.medium;
        break;
      case 'emotional':
      case 'discovery':
        cameraOptions = Math.random() > 0.5 ? CAMERA_ANGLES.intimate : CAMERA_ANGLES.medium;
        break;
      default:
        cameraOptions = pick([CAMERA_ANGLES.wide, CAMERA_ANGLES.medium, CAMERA_ANGLES.dynamic]);
    }
    const focusOptions = Object.keys(COMPOSITION_FOCUS) as Array<keyof typeof COMPOSITION_FOCUS>;
    focusType = pick(focusOptions);
    compositionFocus = pick(COMPOSITION_FOCUS[focusType as keyof typeof COMPOSITION_FOCUS]);
    
    // Still add environmental life for all scenes for immersion
    if (genreStyle.environmentalLife && genreStyle.environmentalLife.length > 0 && Math.random() > 0.5) {
      genreSceneContext.push(pick(genreStyle.environmentalLife));
    }
  }
  const cameraAngle = pick(cameraOptions);

  // Determine lighting - scene type specific with genre influence
  let lightingCategory: keyof typeof LIGHTING_VARIATIONS;
  if (essence.momentType === 'romantic') {
    lightingCategory = 'romantic';
  } else if (essence.momentType === 'casual' || essence.momentType === 'everyday') {
    lightingCategory = pick(['casual', 'everyday', 'natural']) as keyof typeof LIGHTING_VARIATIONS;
  } else if (essence.momentType === 'intimate') {
    lightingCategory = Math.random() > 0.5 ? 'romantic' : 'atmospheric';
  } else if (request.timeOfDay === 'night' || essence.atmosphereWords.includes('dark')) {
    lightingCategory = 'night';
  } else if (essence.momentType === 'action' || essence.momentType === 'tense') {
    lightingCategory = Math.random() > 0.4 ? 'dramatic' : 'atmospheric';
  } else if (request.weather === 'fog' || request.weather === 'rain') {
    lightingCategory = 'atmospheric';
  } else {
    lightingCategory = pick(genreStyle.lightingPreferences) as keyof typeof LIGHTING_VARIATIONS;
  }
  const lighting = pick(LIGHTING_VARIATIONS[lightingCategory]);

  // Build atmosphere - scene type specific with genre elements
  const atmosphereElements: string[] = [];
  
  // Add scene-type specific atmosphere
  if (essence.momentType === 'romantic') {
    atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.romantic, 2, 3));
  } else if (essence.momentType === 'casual' || essence.momentType === 'everyday') {
    atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.casual, 1, 2));
    atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.everyday, 1, 2));
  } else if (essence.momentType === 'intimate') {
    atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.romantic, 1, 2));
  }
  
  if (request.weather) atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.weather, 1, 2));
  if (Math.random() > 0.4) atmosphereElements.push(pick(ATMOSPHERE_ADDITIONS.particles));
  if (Math.random() > 0.3) atmosphereElements.push(pick(ATMOSPHERE_ADDITIONS.environmental));
  
  // Add genre-specific atmospheric elements for immersion
  atmosphereElements.push(...pickMultiple(genreStyle.atmosphericElements, 2, 3));
  if (essence.sensoryDetails.length > 0) atmosphereElements.push(...essence.sensoryDetails.slice(0, 2));

  // Determine player visibility
  let playerVisible = false;
  let playerDescription = '';
  let playerProminence = '';
  let romanticSceneDescription = '';

  // Special handling for romantic scenes - focus on the interaction
  if (essence.momentType === 'romantic' && essence.romanticContext) {
    playerVisible = true;
    const rc = essence.romanticContext;
    
    // Build tasteful romantic scene description
    const intimacyDescriptions = {
      tender: ['gentle tender moment', 'soft affectionate connection', 'quiet intimate scene'],
      passionate: ['intense emotional connection', 'passionate embrace', 'deeply connected moment'],
      playful: ['playful romantic moment', 'lighthearted affection', 'joyful intimate exchange'],
      longing: ['wistful romantic tension', 'yearning glance', 'bittersweet connection'],
    };
    
    const actionMappings: Record<string, string> = {
      'kiss': 'gentle kiss, faces close together',
      'embrace': 'warm embrace, arms wrapped around each other',
      'hold hands': 'hands intertwined, fingers laced together',
      'caress': 'tender touch, soft caress',
      'cuddle': 'cuddling close together, comfortable intimacy',
      'lean close': 'leaning in close, foreheads nearly touching',
      'gaze into': 'gazing deeply into each others eyes',
      'whisper': 'whispering closely, lips near ear',
      'dance together': 'dancing closely together, elegant movement',
      'stroke hair': 'gentle fingers through hair, tender gesture',
      'touch cheek': 'hand cupping cheek gently',
      'pull close': 'pulling close together, intimate embrace',
      'nuzzle': 'nuzzling affectionately, soft intimate moment',
    };
    
    // Find matching action
    let romanticAction = pick(intimacyDescriptions[rc.intimacyLevel]);
    if (essence.playerDoing) {
      for (const [key, desc] of Object.entries(actionMappings)) {
        if (essence.playerDoing.toLowerCase().includes(key)) {
          romanticAction = desc;
          break;
        }
      }
    }
    
    playerProminence = 'central focus of scene';
    
    // Build character description for romantic scene
    if (characterProfile) {
      const charBase = `${characterProfile.gender}, ${characterProfile.hair.color} hair`;
      romanticSceneDescription = `ROMANTIC MOMENT: two figures, ${romanticAction}, ${charBase} visible, ${rc.focusElements.slice(0, 2).join(', ')}`;
    } else {
      romanticSceneDescription = `ROMANTIC MOMENT: two figures, ${romanticAction}, ${rc.focusElements.slice(0, 2).join(', ')}`;
    }
    
    playerDescription = romanticSceneDescription;
    console.log('Romantic scene detected:', rc.intimacyLevel, romanticAction);
  } else if (essence.playerDoing && characterProfile) {
    playerVisible = true;
    const prominenceRoll = Math.random();

    if (essence.momentType === 'emotional' || essence.momentType === 'discovery') {
      if (prominenceRoll > 0.3) {
        playerProminence = 'in midground, part of the scene';
        playerDescription = `figure: ${characterProfile.gender}, ${characterProfile.hair.color} hair, ${characterProfile.roleAppearance.split(',')[0]}, ${essence.playerDoing}`;
      } else {
        playerProminence = 'visible in scene';
        playerDescription = `${characterProfile.gender} figure ${essence.playerDoing}`;
      }
    } else if (essence.momentType === 'action') {
      playerProminence = pick(['in the action', 'mid-combat', 'engaged in scene']);
      playerDescription = `${characterProfile.gender}, ${characterProfile.roleAppearance.split(',')[0]}, ${essence.playerDoing}`;
    } else {
      if (prominenceRoll > 0.5) {
        playerProminence = 'visible in background';
        playerDescription = `distant figure ${essence.playerDoing}`;
      } else {
        playerProminence = 'part of the scene';
        playerDescription = `${characterProfile.gender} figure ${essence.playerDoing}`;
      }
    }
  } else if (characterProfile && Math.random() > 0.7 && essence.momentType !== 'environmental') {
    playerVisible = true;
    playerProminence = 'barely visible in frame';
    playerDescription = 'distant figure observing';
  }

  console.log('Player involvement:', playerVisible ? playerProminence : 'not visible');

  // Build world activity
  const worldActivity: string[] = [];
  if (essence.others.length > 0) {
    worldActivity.push(...essence.others.slice(0, 2).map(o => `${o} ${pick(['present', 'visible', 'in scene'])}`));
  }
  worldActivity.push(...pickMultiple(genreStyle.worldDetails, 1, 3));

  // Assemble prompt
  const promptParts: string[] = [];

  promptParts.push(pick(['masterpiece, best quality, highly detailed', 'exceptional quality, intricate details', 'masterwork, superb detail']));
  promptParts.push('digital illustration, cinematic, photorealistic');
  promptParts.push(baseStyle);
  promptParts.push(cameraAngle);
  promptParts.push(compositionFocus);

  // BUILD SCENE DESCRIPTION FROM ACTUAL NARRATIVE
  // Priority: Player action + what's actually happening in the story
  const sceneDescriptionParts: string[] = [];
  
  // 1. Location/Setting (most important for visual accuracy)
  const location = request.currentLocation || essence.setting;
  if (location && location !== 'the scene') {
    sceneDescriptionParts.push(`LOCATION: ${location}`);
  }
  
  // 2. What the player is DOING (critical for matching the image to the action)
  if (essence.playerDoing) {
    sceneDescriptionParts.push(`ACTION: character ${essence.playerDoing}`);
  }
  
  // 3. Core scene from narrator (what's actually happening)
  if (essence.coreAction && essence.coreAction.length > 10) {
    // Summarize the scene in visual terms
    sceneDescriptionParts.push(`SCENE: ${essence.coreAction.slice(0, 150)}`);
  }
  
  // 4. Visual elements
  if (essence.visualElements.length > 0) {
    sceneDescriptionParts.push(`ELEMENTS: ${essence.visualElements.slice(0, 4).join(', ')}`);
  }
  
  // 5. Objects present
  if (essence.objects.length > 0) {
    sceneDescriptionParts.push(`OBJECTS: ${essence.objects.slice(0, 3).join(', ')}`);
  }

  promptParts.push(sceneDescriptionParts.join('. '));
  
  // Add genre-specific scene context for immersion (romantic/casual/social/everyday)
  if (genreSceneContext.length > 0) {
    promptParts.push(`GENRE CONTEXT: ${genreSceneContext.join(', ')}`);
  }
  
  // Add genre environment only if it doesn't conflict with the actual scene
  if (!essence.setting || essence.setting === 'the scene') {
    promptParts.push(envType);
  }

  if (worldActivity.length > 0 && essence.others.length > 0) {
    promptParts.push(`CHARACTERS: ${essence.others.slice(0, 2).join(', ')}`);
  }
  
  if (playerVisible && playerDescription) {
    promptParts.push(`PLAYER: ${playerProminence}, ${playerDescription}`);
  }

  // Sensory details help with immersion
  if (essence.sensoryDetails.length > 0) {
    promptParts.push(`DETAILS: ${essence.sensoryDetails.slice(0, 3).join(', ')}`);
  }

  promptParts.push(lighting);
  promptParts.push(`atmosphere: ${atmosphereElements.slice(0, 4).join(', ')}`);
  promptParts.push(`palette: ${colorPalette}`);
  
  // Add genre-specific world details for background immersion
  if (genreStyle.worldDetails && genreStyle.worldDetails.length > 0) {
    promptParts.push(`WORLD: ${pickMultiple(genreStyle.worldDetails, 2, 3).join(', ')}`);
  }

  if (request.timeOfDay) {
    const timeDescs: Record<string, string[]> = {
      dawn: ['early morning light', 'sunrise glow'], day: ['daylight', 'midday sun'],
      dusk: ['sunset colors', 'twilight'], night: ['nighttime', 'moonlit'],
    };
    promptParts.push(pick(timeDescs[request.timeOfDay] || ['']));
  }

  if (request.weather) {
    const weatherDescs: Record<string, string[]> = {
      rain: ['rain falling', 'wet environment'], snow: ['snow falling', 'winter scene'], fog: ['fog obscuring', 'misty'],
    };
    promptParts.push(pick(weatherDescs[request.weather] || ['']));
  }

  // Add scene-type specific quality modifiers
  if (essence.momentType === 'romantic') {
    promptParts.push('tasteful, artistic, elegant, PG-13, romantic art style');
  } else if (essence.momentType === 'casual' || essence.momentType === 'everyday') {
    promptParts.push('slice of life, authentic moment, natural scene, lived-in atmosphere');
  } else if (essence.momentType === 'intimate') {
    promptParts.push('emotional depth, genuine connection, meaningful moment');
  } else if (essence.momentType === 'social') {
    promptParts.push('lively interaction, authentic social moment, dynamic exchange');
  }

  promptParts.push('environmental storytelling, 8k resolution');

  const finalPrompt = promptParts.filter(Boolean).join(', ');
  console.log('Built prompt with player action:', essence.playerDoing || 'none');
  console.log('Built prompt with setting:', location);
  console.log('Genre context added:', genreSceneContext.length > 0 ? genreSceneContext.join(', ') : 'none');

  // Build negative prompt - enhanced for romantic/intimate scenes to ensure ToS compliance
  let negativePrompt = 'blurry, low quality, text, watermark, signature, UI elements, amateur, wrong era, cartoon, anime, wrong scene, incorrect action';
  
  if (essence.momentType === 'romantic' || essence.momentType === 'intimate') {
    // Add explicit ToS-compliant negative prompts for romantic/intimate scenes
    negativePrompt += ', NSFW, explicit, nudity, sexual, inappropriate, adult content, suggestive, revealing clothing, undressed, erotic, provocative, lewd';
  }

  return {
    prompt: finalPrompt,
    negativePrompt,
    debug: { 
      essence, 
      playerVisible, 
      focusType, 
      playerAction: essence.playerDoing, 
      setting: location, 
      romanticContext: essence.romanticContext,
      casualContext: essence.casualContext,
      genreSceneContext: genreSceneContext,
      genre,
    },
  };
}

// ============================================================================
// CONTENT SOFTENING FOR MODERATION RETRIES
// ============================================================================

// Progressive softening levels - each level removes more intense elements
const CONTENT_SOFTENING = {
  // Level 1: Replace graphic terms with mild alternatives
  level1: {
    replacements: [
      // Violence softening
      [/\bblood\b/gi, 'red stains'],
      [/\bbloody\b/gi, 'stained'],
      [/\bcorpse\b/gi, 'fallen figure'],
      [/\bdead body\b/gi, 'still form'],
      [/\bkill\b/gi, 'defeat'],
      [/\bkilled\b/gi, 'defeated'],
      [/\bmurder\b/gi, 'conflict'],
      [/\bstab\b/gi, 'strike'],
      [/\bslash\b/gi, 'swing'],
      [/\bwound\b/gi, 'injury'],
      [/\bwounded\b/gi, 'injured'],
      [/\bgore\b/gi, 'damage'],
      [/\bviolent\b/gi, 'intense'],
      [/\bbrutal\b/gi, 'fierce'],
      // Horror softening
      [/\bmonster\b/gi, 'creature'],
      [/\bhorror\b/gi, 'tension'],
      [/\bterrifying\b/gi, 'unsettling'],
      [/\bscreaming?\b/gi, 'calling out'],
      [/\btorture\b/gi, 'restraint'],
      [/\bdemon\b/gi, 'dark figure'],
      [/\bmutilated\b/gi, 'damaged'],
      [/\bdecaying?\b/gi, 'aged'],
      [/\brotting\b/gi, 'weathered'],
    ],
    additions: ['dramatic lighting', 'cinematic composition'],
  },
  
  // Level 2: More aggressive softening + artistic framing
  level2: {
    replacements: [
      [/\bblood|bloody|gore\b/gi, ''],
      [/\bcorpse|dead body|body\b/gi, 'figure'],
      [/\bkill|murder|attack|stab|slash\b/gi, 'confront'],
      [/\bwound|injury|hurt\b/gi, ''],
      [/\bmonster|creature|beast|demon\b/gi, 'shadow'],
      [/\bscream|terror|horror\b/gi, 'tension'],
      [/\bfear|afraid|terrified\b/gi, 'cautious'],
      [/\bdark|darkness\b/gi, 'dim'],
      [/\bdeath|dying|dead\b/gi, 'still'],
      [/\bflesh|skin\b/gi, 'form'],
      [/\beyes|eyeless\b/gi, 'features'],
      [/\bclaws|fangs|teeth\b/gi, 'silhouette'],
    ],
    additions: ['artistic interpretation', 'atmospheric mood piece', 'stylized illustration'],
  },
  
  // Level 3: Maximum softening - focus on environment and mood only
  level3: {
    replacements: [
      // Remove character-focused elements entirely
      [/ACTION:.*?\./gi, ''],
      [/PLAYER:.*?\./gi, ''],
      [/character\s+\w+/gi, ''],
      [/figure\s+\w+/gi, ''],
      // Remove any remaining intensity
      [/\b(blood|gore|wound|injury|death|kill|murder|attack|horror|terror|scream|monster|demon|creature|beast|corpse|body)\b/gi, ''],
    ],
    additions: [
      'environmental mood piece',
      'no characters visible',
      'atmospheric landscape',
      'empty scene with dramatic lighting',
      'focus on environment only',
    ],
  },
};

function softenPrompt(originalPrompt: string, level: 1 | 2 | 3): string {
  const config = CONTENT_SOFTENING[`level${level}`];
  let softened = originalPrompt;
  
  // Apply replacements
  for (const [pattern, replacement] of config.replacements) {
    softened = softened.replace(pattern as RegExp, replacement as string);
  }
  
  // Clean up double spaces and commas
  softened = softened.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').trim();
  
  // Add softening additions
  const additions = config.additions.join(', ');
  softened = `${softened}, ${additions}`;
  
  console.log(`Softened prompt (level ${level}):`, softened.slice(0, 200) + '...');
  
  return softened;
}

function enhanceNegativePrompt(original: string, level: 1 | 2 | 3): string {
  const additions = {
    1: ', graphic violence, explicit content',
    2: ', violence, gore, blood, explicit content, disturbing imagery',
    3: ', violence, gore, blood, explicit, disturbing, graphic, injury, death, weapons, combat, NSFW',
  };
  return original + additions[level];
}

// ============================================================================
// IMAGE GENERATION WITH RETRY LOGIC
// ============================================================================

async function generateImageWithRetry(
  prompt: string,
  negativePrompt: string,
  apiKey: string,
  maxRetries: number = 3
): Promise<{ imageUrl: string | null; error?: string; softeningLevel: number }> {
  let currentPrompt = prompt;
  let currentNegative = negativePrompt;
  let softeningLevel = 0;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const finalPrompt = `${currentPrompt}\n\nNegative: ${currentNegative}`;
    
    console.log(`Image generation attempt ${attempt + 1}/${maxRetries + 1} (softening level: ${softeningLevel})`);
    
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1.1-pro',
        prompt: finalPrompt,
        width: 1408,
        height: 800,
        steps: 28,
        n: 1,
        response_format: 'url',
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (imageUrl) {
        console.log(`Image generated successfully at softening level ${softeningLevel}`);
        return { imageUrl, softeningLevel };
      }
      return { imageUrl: null, error: 'No image URL in response', softeningLevel };
    }
    
    // Handle specific error codes
    if (response.status === 429) {
      console.log('Rate limited, not retrying');
      return { imageUrl: null, error: 'Rate limit exceeded', softeningLevel };
    }
    
    if (response.status === 402 || response.status === 401) {
      console.log('API limit reached, not retrying');
      return { imageUrl: null, error: 'API limit reached', softeningLevel };
    }
    
    // Check for content moderation rejection
    const errorText = await response.text();
    console.error('API error:', response.status, errorText);
    
    const isContentRejection = response.status === 422 && 
      (errorText.toLowerCase().includes('nsfw') || 
       errorText.toLowerCase().includes('content') ||
       errorText.toLowerCase().includes('safety') ||
       errorText.toLowerCase().includes('moderation'));
    
    if (isContentRejection && attempt < maxRetries) {
      // Apply next level of softening
      softeningLevel = (attempt + 1) as 1 | 2 | 3;
      console.log(`Content rejected, applying softening level ${softeningLevel}`);
      currentPrompt = softenPrompt(prompt, softeningLevel as 1 | 2 | 3);
      currentNegative = enhanceNegativePrompt(negativePrompt, softeningLevel as 1 | 2 | 3);
      continue;
    }
    
    // Non-content error or max retries reached
    if (!isContentRejection) {
      return { imageUrl: null, error: `API error: ${response.status}`, softeningLevel };
    }
  }
  
  // All retries exhausted
  console.log('All retry attempts exhausted, returning environment-only fallback attempt');
  return { imageUrl: null, error: 'Content moderation failed after all retries', softeningLevel: 3 };
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as SceneImageRequest;
    const TOGETHER_API_KEY = Deno.env.get('TOGETHER_API_KEY');

    if (!TOGETHER_API_KEY) throw new Error('TOGETHER_API_KEY is not configured');

    // Normalize request - support both short and long keys
    const reqAny = requestData as any;
    let lastNarratorMessage = requestData.lastNarratorMessage || reqAny.narratorMessage || '';
    const lastUserAction = requestData.lastUserAction || requestData.playerAction || reqAny.userAction || '';

    if (!lastNarratorMessage && requestData.recentStory?.length) {
      lastNarratorMessage = requestData.recentStory[requestData.recentStory.length - 1] || '';
    }
    if (!lastNarratorMessage && requestData.sceneDescription) {
      lastNarratorMessage = requestData.sceneDescription;
    }

    requestData.lastNarratorMessage = lastNarratorMessage;
    requestData.lastUserAction = lastUserAction;

    console.log('Scene generation request:', {
      genre: requestData.genre,
      hasNarratorMessage: !!lastNarratorMessage,
      hasUserAction: !!lastUserAction,
      hasCharacterProfile: !!requestData.characterProfile,
      hasLegacyCharacter: !!requestData.playerCharacter,
    });

    const characterProfile = requestData.characterProfile || buildLegacyCharacterProfile(requestData.playerCharacter);

    if (characterProfile) {
      console.log('Using character profile:', characterProfile.fullVisualDescription.slice(0, 100) + '...');
    }

    const { prompt, negativePrompt, debug } = buildIllustrationPrompt(requestData, characterProfile);

    console.log('Initial prompt preview:', prompt.slice(0, 600) + '...');

    // Use retry logic with progressive softening
    const result = await generateImageWithRetry(prompt, negativePrompt, TOGETHER_API_KEY, 3);

    if (result.error === 'Rate limit exceeded') {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', imageUrl: null }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (result.error === 'API limit reached') {
      return new Response(JSON.stringify({ error: 'API limit reached', imageUrl: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!result.imageUrl) {
      console.error('Failed to generate image after all retries:', result.error);
      return new Response(JSON.stringify({ imageUrl: null, error: result.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scene image generated successfully', { softeningLevel: result.softeningLevel });
    return new Response(JSON.stringify({ 
      imageUrl: result.imageUrl,
      softeningApplied: result.softeningLevel > 0,
      softeningLevel: result.softeningLevel,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-scene-image:', error);
    return new Response(JSON.stringify({ error: 'Unable to generate scene image', imageUrl: null }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
