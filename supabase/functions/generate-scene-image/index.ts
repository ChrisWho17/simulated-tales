import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  momentType: 'quiet' | 'tense' | 'action' | 'discovery' | 'social' | 'transition' | 'emotional' | 'environmental';
  visualElements: string[];
  setting: string;
  atmosphereWords: string[];
  playerDoing: string | null;
  others: string[];
  objects: string[];
  sensoryDetails: string[];
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
    emotional: ['feel', 'heart', 'tears', 'laugh', 'cry', 'anger', 'joy', 'grief', 'relief', 'shock', 'hug', 'embrace', 'kiss', 'comfort'],
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
};

const LIGHTING_VARIATIONS = {
  natural: ['natural ambient lighting', 'soft diffused daylight', 'harsh direct sunlight with deep shadows', 'golden hour warm light'],
  dramatic: ['dramatic chiaroscuro lighting', 'harsh contrast lighting', 'single strong light source', 'rim lighting silhouettes'],
  atmospheric: ['volumetric light rays', 'hazy atmospheric lighting', 'god rays through dust', 'foggy diffused glow'],
  artificial: ['fluorescent harsh lighting', 'neon color cast', 'mixed artificial sources', 'flickering unstable light'],
  night: ['moonlight and shadows', 'scattered artificial lights in darkness', 'low-key nighttime lighting', 'fire/explosion illumination'],
};

const ATMOSPHERE_ADDITIONS = {
  particles: ['dust particles floating in air', 'ash drifting down', 'rain droplets visible', 'smoke wisps', 'sparks floating', 'debris in wind'],
  weather: ['rain puddles reflecting', 'wet surfaces glistening', 'fog rolling through', 'heat haze distortion', 'wind-blown elements'],
  environmental: ['distant activity visible', 'background movement', 'environmental storytelling details', 'signs of recent events', 'lived-in world details'],
};

const COMPOSITION_FOCUS = {
  environment: ['environment dominates frame', 'architecture and space as subject', 'landscape fills the view', 'setting is the story'],
  event: ['action captured mid-moment', 'event unfolding in frame', 'dynamic moment frozen', 'narrative beat visualized'],
  mood: ['atmosphere is palpable', 'mood conveyed through visuals', 'emotional resonance in composition'],
  detail: ['specific details tell the story', 'meaningful objects prominent', 'visual clues for narrative'],
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
}> = {
  modern: {
    baseStyles: ['modern urban realism', 'contemporary gritty aesthetic', 'photorealistic modern setting'],
    colorPalettes: ['muted earth tones and urban grays', 'concrete and steel colors', 'military greens and tans'],
    environmentTypes: ['urban streets and buildings', 'modern city environment', 'industrial urban landscape'],
    atmosphericElements: ['city smog', 'vehicle exhaust', 'street steam', 'rain on pavement', 'urban debris'],
    worldDetails: ['parked vehicles', 'street signs', 'power lines', 'graffiti', 'civilians'],
    lightingPreferences: ['natural', 'artificial', 'dramatic'],
  },
  cyberpunk: {
    baseStyles: ['cyberpunk neon noir', 'high-tech dystopian aesthetic', 'neo-noir futurism', 'rain-slicked neon future'],
    colorPalettes: ['neon pink and cyan on dark', 'electric blue and magenta', 'chrome and neon reflections'],
    environmentTypes: ['neon-lit megacity streets', 'towering corporate arcologies', 'high-tech slums'],
    atmosphericElements: ['neon signs everywhere', 'holographic advertisements', 'steam from vents', 'constant rain'],
    worldDetails: ['flying vehicles', 'augmented people', 'robots', 'street vendors', 'hackers'],
    lightingPreferences: ['atmospheric', 'artificial', 'night'],
  },
  postapoc: {
    baseStyles: ['post-apocalyptic desolation', 'wasteland survivor aesthetic', 'ruined civilization'],
    colorPalettes: ['rust oranges and dusty browns', 'faded sun-bleached colors', 'ash and ember tones'],
    environmentTypes: ['ruined cityscape', 'overgrown urban decay', 'desert wasteland'],
    atmosphericElements: ['dust storms', 'ash fall', 'toxic clouds', 'smoke from fires'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'makeshift shelters', 'scavengers'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  postapocalyptic: {
    baseStyles: ['post-apocalyptic desolation', 'wasteland survivor aesthetic', 'ruined civilization'],
    colorPalettes: ['rust oranges and dusty browns', 'faded sun-bleached colors', 'ash and ember tones'],
    environmentTypes: ['ruined cityscape', 'overgrown urban decay', 'desert wasteland'],
    atmosphericElements: ['dust storms', 'ash fall', 'toxic clouds', 'smoke from fires'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'makeshift shelters', 'scavengers'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  scifi: {
    baseStyles: ['science fiction vista', 'clean futuristic aesthetic', 'sleek technological environment'],
    colorPalettes: ['clean whites and chrome', 'holographic blue accents', 'high-tech metallic tones'],
    environmentTypes: ['space station interior', 'futuristic city', 'alien landscape'],
    atmosphericElements: ['holographic displays', 'energy fields', 'artificial atmosphere'],
    worldDetails: ['robots', 'drones', 'holographic interfaces', 'advanced vehicles'],
    lightingPreferences: ['artificial', 'natural', 'dramatic'],
  },
  ww2: {
    baseStyles: ['1940s wartime documentary', 'World War 2 historical', 'wartime grit and authenticity'],
    colorPalettes: ['desaturated sepia tones', 'military olive and brown', 'mud and blood colors'],
    environmentTypes: ['war-torn European village', 'battlefield trenches', 'bombed city ruins'],
    atmosphericElements: ['smoke from explosions', 'fog of war', 'rain and mud', 'artillery fire'],
    worldDetails: ['period vehicles', 'soldiers', 'sandbags', 'barbed wire', 'rubble'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  war: {
    baseStyles: ['war photography aesthetic', 'gritty military realism', 'battlefield chaos'],
    colorPalettes: ['muted greens and browns', 'smoke and fire colors', 'mud and blood tones'],
    environmentTypes: ['active battlefield', 'military positions', 'combat zones'],
    atmosphericElements: ['smoke', 'debris', 'explosions', 'tracer fire'],
    worldDetails: ['military vehicles', 'fortifications', 'destroyed equipment', 'soldiers'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  medieval: {
    baseStyles: ['epic medieval fantasy', 'dark fantasy aesthetic', 'gritty medieval realism'],
    colorPalettes: ['rich earth tones and gold', 'deep forest greens', 'torchlit warm oranges'],
    environmentTypes: ['castle and fortress', 'medieval village', 'dark forest'],
    atmosphericElements: ['torch smoke', 'morning mist', 'firelight flicker', 'rain'],
    worldDetails: ['horses', 'carts', 'market stalls', 'peasants', 'banners'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  fantasy: {
    baseStyles: ['high fantasy epic vista', 'magical realm aesthetic', 'mythical grandeur'],
    colorPalettes: ['rich jewel tones', 'magical purples and golds', 'ethereal blues and silvers'],
    environmentTypes: ['magical landscapes', 'enchanted forests', 'mystical structures', 'ancient ruins'],
    atmosphericElements: ['magical particles', 'ethereal mist', 'glowing runes', 'floating elements'],
    worldDetails: ['mythical creatures', 'ancient ruins', 'magical flora', 'arcane symbols'],
    lightingPreferences: ['atmospheric', 'dramatic', 'natural'],
  },
  horror: {
    baseStyles: ['dark horror atmosphere', 'survival horror aesthetic', 'psychological dread'],
    colorPalettes: ['desaturated sickly tones', 'deep shadows and pale highlights', 'blood red accents'],
    environmentTypes: ['abandoned building', 'dark forest', 'decrepit facility'],
    atmosphericElements: ['thick fog', 'unnatural shadows', 'flickering lights', 'decay'],
    worldDetails: ['abandoned objects', 'mysterious stains', 'broken things', 'unsettling shapes'],
    lightingPreferences: ['night', 'atmospheric', 'dramatic'],
  },
  western: {
    baseStyles: ['classic western vista', 'frontier aesthetic', 'dusty cowboy realism'],
    colorPalettes: ['warm browns and oranges', 'dusty desert tones', 'sunset reds and golds'],
    environmentTypes: ['dusty frontier town', 'desert landscape', 'saloon interior'],
    atmosphericElements: ['dust', 'tumbleweeds', 'heat haze', 'gun smoke'],
    worldDetails: ['horses', 'wagons', 'wooden buildings', 'cacti', 'cowboys'],
    lightingPreferences: ['natural', 'dramatic', 'atmospheric'],
  },
  noir: {
    baseStyles: ['film noir 1940s', 'moody detective aesthetic', 'black and white crime drama'],
    colorPalettes: ['black and white tones', 'deep shadows', 'high contrast'],
    environmentTypes: ['rain-slicked city streets', 'shadowy alleys', 'dimly lit interiors'],
    atmosphericElements: ['rain', 'neon signs', 'cigarette smoke', 'venetian blind shadows'],
    worldDetails: ['vintage cars', 'street lamps', 'wet pavement', 'fedoras'],
    lightingPreferences: ['dramatic', 'night', 'atmospheric'],
  },
  victorian: {
    baseStyles: ['victorian era aesthetic', 'gaslight atmosphere', 'period drama realism'],
    colorPalettes: ['brass and copper tones', 'deep burgundy', 'sepia and brown'],
    environmentTypes: ['Victorian streets', 'gaslit architecture', 'industrial factories'],
    atmosphericElements: ['steam', 'fog', 'gaslight', 'chimney smoke'],
    worldDetails: ['carriages', 'factory smoke', 'clockwork', 'ornate buildings'],
    lightingPreferences: ['atmospheric', 'natural', 'dramatic'],
  },
  steampunk: {
    baseStyles: ['Victorian steampunk', 'brass and copper aesthetic', 'clockwork fantasy'],
    colorPalettes: ['brass gold', 'copper', 'dark wood', 'leather brown'],
    environmentTypes: ['brass machinery city', 'Victorian industrial', 'airship deck'],
    atmosphericElements: ['steam', 'gears turning', 'brass machinery', 'pressure valves'],
    worldDetails: ['airships', 'clockwork automatons', 'pipes', 'goggles'],
    lightingPreferences: ['atmospheric', 'artificial', 'dramatic'],
  },
  pirate: {
    baseStyles: ['golden age of piracy', 'seafaring adventure', 'caribbean swashbuckler'],
    colorPalettes: ['ocean blues', 'weathered wood', 'gold accents', 'tropical greens'],
    environmentTypes: ['open seas', 'island harbors', 'ship decks', 'port towns'],
    atmosphericElements: ['sea spray', 'ship rigging', 'tropical clouds', 'cannon smoke'],
    worldDetails: ['sailing ships', 'palm trees', 'treasure', 'dock workers'],
    lightingPreferences: ['natural', 'dramatic', 'atmospheric'],
  },
  zombie: {
    baseStyles: ['zombie apocalypse', 'urban decay horror', 'survival horror'],
    colorPalettes: ['desaturated greens', 'grays', 'blood reds', 'decay browns'],
    environmentTypes: ['abandoned cities', 'overrun streets', 'survivor camps'],
    atmosphericElements: ['decay', 'abandoned buildings', 'fire smoke', 'blood splatter'],
    worldDetails: ['abandoned cars', 'barricades', 'graffiti', 'shambling figures'],
    lightingPreferences: ['atmospheric', 'dramatic', 'night'],
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
  const cameraAngle = pick(cameraOptions);

  const focusOptions = Object.keys(COMPOSITION_FOCUS) as Array<keyof typeof COMPOSITION_FOCUS>;
  const focusType = pick(focusOptions);
  const compositionFocus = pick(COMPOSITION_FOCUS[focusType]);

  // Determine lighting
  let lightingCategory: keyof typeof LIGHTING_VARIATIONS;
  if (request.timeOfDay === 'night' || essence.atmosphereWords.includes('dark')) {
    lightingCategory = 'night';
  } else if (essence.momentType === 'action' || essence.momentType === 'tense') {
    lightingCategory = Math.random() > 0.4 ? 'dramatic' : 'atmospheric';
  } else if (request.weather === 'fog' || request.weather === 'rain') {
    lightingCategory = 'atmospheric';
  } else {
    lightingCategory = pick(genreStyle.lightingPreferences) as keyof typeof LIGHTING_VARIATIONS;
  }
  const lighting = pick(LIGHTING_VARIATIONS[lightingCategory]);

  // Build atmosphere
  const atmosphereElements: string[] = [];
  if (request.weather) atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.weather, 1, 2));
  if (Math.random() > 0.4) atmosphereElements.push(pick(ATMOSPHERE_ADDITIONS.particles));
  if (Math.random() > 0.3) atmosphereElements.push(pick(ATMOSPHERE_ADDITIONS.environmental));
  atmosphereElements.push(...pickMultiple(genreStyle.atmosphericElements, 1, 2));
  if (essence.sensoryDetails.length > 0) atmosphereElements.push(...essence.sensoryDetails.slice(0, 2));

  // Determine player visibility
  let playerVisible = false;
  let playerDescription = '';
  let playerProminence = '';

  if (essence.playerDoing && characterProfile) {
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
  promptParts.push(`atmosphere: ${atmosphereElements.slice(0, 3).join(', ')}`);
  promptParts.push(`palette: ${colorPalette}`);

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

  promptParts.push('environmental storytelling, 8k resolution');

  const finalPrompt = promptParts.filter(Boolean).join(', ');
  console.log('Built prompt with player action:', essence.playerDoing || 'none');
  console.log('Built prompt with setting:', location);

  return {
    prompt: finalPrompt,
    negativePrompt: 'blurry, low quality, text, watermark, signature, UI elements, amateur, wrong era, cartoon, anime, wrong scene, incorrect action',
    debug: { essence, playerVisible, focusType, playerAction: essence.playerDoing, setting: location },
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

    // Normalize request
    let lastNarratorMessage = requestData.lastNarratorMessage || '';
    const lastUserAction = requestData.lastUserAction || requestData.playerAction || '';

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
