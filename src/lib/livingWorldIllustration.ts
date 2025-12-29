// ============================================================================
// LIVING WORLD ILLUSTRATION SYSTEM v2
// Flexible, organic scene generation with controlled randomness
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface CharacterVisualProfile {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  physicalDescription: {
    build: string;
    skinTone: string;
  };
  hair: {
    color: string;
    style: string;
  };
  eyes: {
    color: string;
  };
  facialFeatures: {
    scars?: string;
    tattoos?: string;
    beard?: string;
    other?: string;
  };
  modifications?: {
    cybernetics?: string;
    other?: string;
  };
  role: string;
  roleAppearance: string;
  fullVisualDescription: string;
}

export interface IllustrationRequest {
  lastNarratorMessage: string;
  lastUserAction: string;
  messageHistory: Array<{ role: string; content: string }>;
  characterProfile: CharacterVisualProfile;
  genre: string;
  era?: string;
  currentLocation?: string;
  timeOfDay?: string;
  weather?: string;
  knownNPCs?: Array<{
    name: string;
    description: string;
  }>;
}

export interface SceneEssence {
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

export function extractSceneEssence(
  narratorMessage: string,
  userAction: string,
  history: Array<{ role: string; content: string }>
): SceneEssence {
  const combined = `${narratorMessage} ${userAction}`;
  const lowerCombined = combined.toLowerCase();

  // Extract core action
  let coreAction = '';
  const actionPatterns = [
    /(?:you\s+)(\w+(?:\s+\w+){0,4})/gi,
    /(?:the\s+\w+\s+)(\w+s?\s+[^.]+)/gi,
    /(?:suddenly,?\s*)([^.]+)/gi,
    /(?:there(?:'s| is)\s+)([^.]+)/gi,
  ];

  for (const pattern of actionPatterns) {
    const match = pattern.exec(narratorMessage);
    if (match && match[1]) {
      coreAction = match[1].trim();
      break;
    }
  }

  if (!coreAction) {
    coreAction = narratorMessage.split(/[.!?]/)[0].trim();
  }

  // Determine moment type
  let momentType: SceneEssence['momentType'] = 'environmental';
  const momentIndicators: Record<SceneEssence['momentType'], string[]> = {
    action: ['fight', 'attack', 'shoot', 'fire', 'run', 'chase', 'dodge', 'explosion', 'combat', 'battle', 'sprint', 'jump', 'crash'],
    tense: ['careful', 'danger', 'threat', 'watch', 'listen', 'quiet', 'sneak', 'hide', 'wait', 'shadows', 'nervous', 'uneasy'],
    quiet: ['rest', 'sleep', 'peaceful', 'calm', 'still', 'silent', 'empty', 'alone', 'reflect', 'remember'],
    discovery: ['find', 'discover', 'notice', 'see', 'reveal', 'uncover', 'realize', 'learn', 'spot', 'strange'],
    social: ['say', 'speak', 'talk', 'ask', 'tell', 'crowd', 'people', 'gather', 'meeting', 'conversation'],
    transition: ['enter', 'exit', 'leave', 'arrive', 'move', 'travel', 'walk', 'head', 'continue', 'approach'],
    emotional: ['feel', 'heart', 'tears', 'laugh', 'cry', 'anger', 'joy', 'grief', 'relief', 'shock'],
    environmental: ['rain', 'wind', 'sun', 'storm', 'landscape', 'city', 'building', 'street', 'forest'],
  };

  for (const [type, indicators] of Object.entries(momentIndicators)) {
    if (indicators.some(ind => lowerCombined.includes(ind))) {
      momentType = type as SceneEssence['momentType'];
      break;
    }
  }

  // Extract visual elements
  const visualElements: string[] = [];
  const visualPatterns = [
    /(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(?:is|are|stands?|lies?|hangs?)/gi,
    /(?:broken|ruined|old|new|large|small|dark|bright)\s+(\w+)/gi,
    /(\w+)\s+(?:everywhere|around|nearby|ahead|behind)/gi,
  ];

  for (const pattern of visualPatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      if (match[1] && match[1].length > 2) {
        visualElements.push(match[1].trim());
      }
    }
  }

  // Extract setting
  let setting = 'the area';
  const settingPatterns = [
    /(?:in|inside|within|at)\s+(?:the|a)?\s*([^,.!?]+)/i,
    /(?:the|a)\s+(street|room|building|forest|city|town|base|camp|ruins|wasteland|market|alley|corridor|hall)[^,.!?]*/i,
    /(?:outside|outdoors)\s*(?:the|a)?\s*([^,.!?]*)/i,
  ];

  for (const pattern of settingPatterns) {
    const match = combined.match(pattern);
    if (match) {
      setting = (match[1] || match[0]).trim();
      break;
    }
  }

  // Check history for location continuity
  for (let i = history.length - 1; i >= Math.max(0, history.length - 4); i--) {
    const msg = history[i];
    if (msg.role === 'narrator') {
      const locMatch = msg.content.match(/(?:in|at|inside)\s+(?:the|a)\s+([^,.!?]+)/i);
      if (locMatch && setting === 'the area') {
        setting = locMatch[1].trim();
        break;
      }
    }
  }

  // Extract atmosphere words
  const atmosphereWords: string[] = [];
  const atmospherePatterns = [
    /\b(dark|bright|dim|shadowy|lit|glowing|flickering)\b/gi,
    /\b(cold|hot|warm|freezing|humid|dry)\b/gi,
    /\b(quiet|loud|noisy|silent|echoing|rumbling)\b/gi,
    /\b(crowded|empty|busy|desolate|abandoned|lively)\b/gi,
    /\b(tense|peaceful|chaotic|eerie|welcoming|hostile)\b/gi,
  ];

  for (const pattern of atmospherePatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      atmosphereWords.push(match[1].toLowerCase());
    }
  }

  // What is player doing?
  let playerDoing: string | null = null;
  const actionMatch = userAction.match(/^i\s+(.+?)(?:\.|$)/i);
  if (actionMatch) {
    const action = actionMatch[1].toLowerCase();
    const invisibleActions = ['think', 'wonder', 'consider', 'decide', 'remember', 'feel', 'hope', 'wish'];
    const observeActions = ['watch', 'look', 'observe', 'listen', 'wait', 'hide', 'stay'];

    if (invisibleActions.some(a => action.includes(a))) {
      playerDoing = null;
    } else if (observeActions.some(a => action.includes(a))) {
      playerDoing = null;
    } else {
      playerDoing = action;
    }
  }

  const narratorPlayerAction = narratorMessage.match(/you\s+(\w+(?:\s+\w+){0,3})/i);
  if (narratorPlayerAction && !playerDoing) {
    const action = narratorPlayerAction[1].toLowerCase();
    if (!['see', 'notice', 'hear', 'feel', 'sense', 'realize'].includes(action.split(' ')[0])) {
      playerDoing = action;
    }
  }

  // Extract others
  const others: string[] = [];
  const otherPatterns = [
    /(?:the|a|an)\s+(soldier|guard|man|woman|figure|stranger|merchant|officer|creature|beast|group|crowd|people)[s]?/gi,
    /(\w+)\s+(?:says?|speaks?|shouts?|attacks?|approaches?|stands?)/gi,
  ];

  for (const pattern of otherPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      const other = match[1];
      if (other && !['you', 'your'].includes(other.toLowerCase())) {
        others.push(other);
      }
    }
  }

  // Extract objects
  const objects: string[] = [];
  const objectPatterns = [
    /(?:the|a|an)\s+(door|window|table|chair|weapon|gun|knife|box|crate|vehicle|car|body|corpse|terminal|screen|sign|poster)[s]?/gi,
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
    /\b(rain|wind|thunder|gunfire|screams|music|silence|smoke|dust|blood)\b/gi,
  ];

  for (const pattern of sensoryPatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      sensoryDetails.push(match[1] || match[0]);
    }
  }

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

export const CAMERA_ANGLES = {
  wide: [
    'wide establishing shot',
    'sweeping wide angle view',
    'panoramic vista',
    'extreme wide shot showing scale',
    'bird\'s eye establishing shot',
  ],
  medium: [
    'medium wide shot',
    'environmental medium shot',
    'balanced composition showing scene',
    'mid-range framing',
    'standard scene composition',
  ],
  dynamic: [
    'dutch angle adding tension',
    'dramatic low angle',
    'high angle looking down',
    'canted frame',
    'asymmetric dynamic composition',
  ],
  intimate: [
    'close environmental shot',
    'tight framing on details',
    'intimate scene composition',
    'focused close view',
  ],
};

export const LIGHTING_VARIATIONS = {
  natural: [
    'natural ambient lighting',
    'soft diffused daylight',
    'harsh direct sunlight with deep shadows',
    'overcast even lighting',
    'golden hour warm light',
  ],
  dramatic: [
    'dramatic chiaroscuro lighting',
    'harsh contrast lighting',
    'single strong light source',
    'rim lighting silhouettes',
    'spotlight effect',
  ],
  atmospheric: [
    'volumetric light rays',
    'hazy atmospheric lighting',
    'god rays through dust',
    'foggy diffused glow',
    'smoke-filtered light',
  ],
  artificial: [
    'fluorescent harsh lighting',
    'neon color cast',
    'mixed artificial sources',
    'flickering unstable light',
    'warm tungsten glow',
  ],
  night: [
    'moonlight and shadows',
    'scattered artificial lights in darkness',
    'low-key nighttime lighting',
    'city lights ambient glow',
    'fire/explosion illumination',
  ],
};

const ATMOSPHERE_ADDITIONS = {
  particles: [
    'dust particles floating in air',
    'ash drifting down',
    'rain droplets visible',
    'snow flurries',
    'smoke wisps',
    'sparks floating',
    'debris in wind',
  ],
  weather: [
    'rain puddles reflecting',
    'wet surfaces glistening',
    'fog rolling through',
    'heat haze distortion',
    'wind-blown elements',
    'storm clouds overhead',
  ],
  environmental: [
    'distant activity visible',
    'background movement',
    'environmental storytelling details',
    'signs of recent events',
    'lived-in world details',
  ],
};

const COMPOSITION_FOCUS = {
  environment: [
    'environment dominates frame',
    'architecture and space as subject',
    'landscape fills the view',
    'setting is the story',
  ],
  event: [
    'action captured mid-moment',
    'event unfolding in frame',
    'dynamic moment frozen',
    'narrative beat visualized',
  ],
  mood: [
    'atmosphere is palpable',
    'mood conveyed through visuals',
    'emotional resonance in composition',
    'feeling over specifics',
  ],
  detail: [
    'specific details tell the story',
    'meaningful objects prominent',
    'visual clues for narrative',
    'environmental storytelling',
  ],
};

// ============================================================================
// GENRE STYLES
// ============================================================================

export const GENRE_STYLES: Record<string, {
  baseStyles: string[];
  colorPalettes: string[];
  environmentTypes: string[];
  atmosphericElements: string[];
  worldDetails: string[];
  lightingPreferences: string[];
}> = {
  modern: {
    baseStyles: ['modern urban realism', 'contemporary gritty aesthetic', 'photorealistic modern setting', 'urban tactical environment'],
    colorPalettes: ['muted earth tones and urban grays', 'concrete and steel colors', 'military greens and tans', 'desaturated realistic palette'],
    environmentTypes: ['urban streets and buildings', 'modern city environment', 'industrial urban landscape', 'contemporary architecture'],
    atmosphericElements: ['city smog', 'vehicle exhaust', 'construction dust', 'street steam', 'rain on pavement', 'urban debris'],
    worldDetails: ['parked vehicles', 'street signs', 'power lines', 'graffiti', 'trash', 'construction barriers', 'civilians'],
    lightingPreferences: ['natural', 'artificial', 'dramatic'],
  },
  cyberpunk: {
    baseStyles: ['cyberpunk neon noir', 'high-tech dystopian aesthetic', 'neo-noir futurism', 'rain-slicked neon future'],
    colorPalettes: ['neon pink and cyan on dark', 'electric blue and magenta', 'purple and orange neon contrast', 'chrome and neon reflections'],
    environmentTypes: ['neon-lit megacity streets', 'towering corporate arcologies', 'cramped urban sprawl', 'high-tech slums'],
    atmosphericElements: ['neon signs everywhere', 'holographic advertisements', 'steam from vents', 'constant rain', 'smog and haze'],
    worldDetails: ['flying vehicles', 'augmented people', 'robots', 'street vendors', 'corporate drones', 'hackers', 'implant shops'],
    lightingPreferences: ['atmospheric', 'artificial', 'night'],
  },
  postapoc: {
    baseStyles: ['post-apocalyptic desolation', 'wasteland survivor aesthetic', 'ruined civilization', 'overgrown decay'],
    colorPalettes: ['rust oranges and dusty browns', 'faded sun-bleached colors', 'toxic greens and grays', 'ash and ember tones'],
    environmentTypes: ['ruined cityscape', 'overgrown urban decay', 'desert wasteland', 'collapsed infrastructure'],
    atmosphericElements: ['dust storms', 'ash fall', 'toxic clouds', 'radiation haze', 'smoke from fires', 'sand and debris'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'makeshift shelters', 'scavengers', 'mutated plants', 'salvage piles', 'bones'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  scifi: {
    baseStyles: ['science fiction vista', 'clean futuristic aesthetic', 'advanced civilization', 'sleek technological environment'],
    colorPalettes: ['clean whites and chrome', 'holographic blue accents', 'minimalist future colors', 'high-tech metallic tones'],
    environmentTypes: ['space station interior', 'futuristic city', 'alien landscape', 'advanced facility'],
    atmosphericElements: ['holographic displays', 'energy fields', 'clean recycled air', 'artificial atmosphere'],
    worldDetails: ['robots', 'drones', 'holographic interfaces', 'advanced vehicles', 'alien flora', 'energy conduits'],
    lightingPreferences: ['artificial', 'natural', 'dramatic'],
  },
  ww2: {
    baseStyles: ['1940s wartime documentary', 'World War 2 historical', 'period military realism', 'wartime grit and authenticity'],
    colorPalettes: ['desaturated sepia tones', 'military olive and brown', 'mud and blood colors', 'period-accurate muted palette'],
    environmentTypes: ['war-torn European village', 'battlefield trenches', 'military encampment', 'bombed city ruins'],
    atmosphericElements: ['smoke from explosions', 'fog of war', 'rain and mud', 'artillery fire', 'burning buildings'],
    worldDetails: ['period vehicles', 'soldiers', 'sandbags', 'barbed wire', 'propaganda posters', 'rubble', 'equipment'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  medieval: {
    baseStyles: ['epic medieval fantasy', 'dark fantasy aesthetic', 'high fantasy grandeur', 'gritty medieval realism'],
    colorPalettes: ['rich earth tones and gold', 'deep forest greens and browns', 'torchlit warm oranges', 'stone gray and banner colors'],
    environmentTypes: ['castle and fortress', 'medieval village', 'dark forest', 'battlefield'],
    atmosphericElements: ['torch smoke', 'morning mist', 'firelight flicker', 'dust and hay', 'rain'],
    worldDetails: ['horses', 'carts', 'market stalls', 'peasants', 'soldiers', 'banners', 'livestock'],
    lightingPreferences: ['natural', 'atmospheric', 'dramatic'],
  },
  fantasy: {
    baseStyles: ['high fantasy art', 'magical realm aesthetic', 'epic fantasy illustration', 'mythical world'],
    colorPalettes: ['vibrant magical colors', 'ethereal glows and rich tones', 'mystical purples and golds', 'enchanted forest greens'],
    environmentTypes: ['enchanted forest', 'magical city', 'ancient ruins', 'mystical realm'],
    atmosphericElements: ['magical particles', 'ethereal glow', 'mystical fog', 'floating lights', 'arcane energy'],
    worldDetails: ['magical creatures', 'ancient artifacts', 'spell effects', 'mystical flora', 'enchanted objects'],
    lightingPreferences: ['atmospheric', 'dramatic', 'natural'],
  },
  horror: {
    baseStyles: ['dark horror atmosphere', 'survival horror aesthetic', 'psychological dread', 'unsettling wrongness'],
    colorPalettes: ['desaturated sickly tones', 'deep shadows and pale highlights', 'blood red accents on gray', 'corrupt and wrong colors'],
    environmentTypes: ['abandoned building', 'dark forest', 'decrepit facility', 'nightmare landscape'],
    atmosphericElements: ['thick fog', 'unnatural shadows', 'flickering lights', 'decay and rot', 'blood'],
    worldDetails: ['abandoned objects', 'mysterious stains', 'broken things', 'unsettling shapes', 'evidence of violence'],
    lightingPreferences: ['night', 'atmospheric', 'dramatic'],
  },
  western: {
    baseStyles: ['classic western aesthetic', 'frontier realism', 'dusty frontier town', 'wild west atmosphere'],
    colorPalettes: ['dusty browns and tans', 'sunset oranges and reds', 'weathered wood tones', 'desert earth colors'],
    environmentTypes: ['frontier town', 'desert landscape', 'saloon interior', 'canyon vista'],
    atmosphericElements: ['dust clouds', 'tumbleweeds', 'heat shimmer', 'desert wind', 'campfire smoke'],
    worldDetails: ['horses', 'wagons', 'wooden buildings', 'wanted posters', 'cowboy gear', 'cacti'],
    lightingPreferences: ['natural', 'dramatic', 'atmospheric'],
  },
  noir: {
    baseStyles: ['film noir aesthetic', 'hard-boiled detective atmosphere', '1940s noir style', 'shadow and mystery'],
    colorPalettes: ['high contrast black and white', 'deep shadows with highlights', 'muted blues and grays', 'smoky atmosphere'],
    environmentTypes: ['rain-slicked city streets', 'dimly lit office', 'smoky bar', 'dark alleyway'],
    atmosphericElements: ['cigarette smoke', 'venetian blind shadows', 'neon signs', 'rain', 'fog'],
    worldDetails: ['vintage cars', 'fedoras', 'trench coats', 'rotary phones', 'newspapers', 'jazz clubs'],
    lightingPreferences: ['dramatic', 'night', 'atmospheric'],
  },
  victorian: {
    baseStyles: ['Victorian era aesthetic', 'gothic Victorian atmosphere', '19th century realism', 'gaslight era'],
    colorPalettes: ['rich burgundies and greens', 'dark wood tones', 'brass and copper accents', 'muted period colors'],
    environmentTypes: ['Victorian mansion', 'foggy London streets', 'industrial factory', 'ornate parlor'],
    atmosphericElements: ['gaslight glow', 'coal smoke', 'London fog', 'steam from pipes', 'candlelight'],
    worldDetails: ['horse carriages', 'top hats', 'pocket watches', 'ornate furniture', 'gas lamps', 'cobblestones'],
    lightingPreferences: ['atmospheric', 'dramatic', 'artificial'],
  },
  steampunk: {
    baseStyles: ['steampunk aesthetic', 'Victorian sci-fi fusion', 'brass and gears style', 'retro-futuristic Victorian'],
    colorPalettes: ['brass and copper tones', 'steam and smoke grays', 'leather browns', 'aged metal patina'],
    environmentTypes: ['airship deck', 'clockwork factory', 'steam-powered city', 'inventor workshop'],
    atmosphericElements: ['steam clouds', 'gear mechanisms', 'coal smoke', 'brass pipes', 'clockwork sounds'],
    worldDetails: ['airships', 'automatons', 'brass goggles', 'mechanical limbs', 'steam engines', 'cog wheels'],
    lightingPreferences: ['atmospheric', 'artificial', 'dramatic'],
  },
  pirate: {
    baseStyles: ['golden age of piracy', 'swashbuckling adventure', 'Caribbean seas aesthetic', 'maritime adventure'],
    colorPalettes: ['ocean blues and greens', 'sun-bleached wood', 'golden treasure tones', 'tropical colors'],
    environmentTypes: ['pirate ship deck', 'tropical island', 'port town', 'hidden cove'],
    atmosphericElements: ['sea spray', 'tropical storms', 'cannon smoke', 'salt air', 'sunset on waves'],
    worldDetails: ['sailing ships', 'treasure chests', 'cutlasses', 'parrots', 'rum barrels', 'skull flags'],
    lightingPreferences: ['natural', 'dramatic', 'atmospheric'],
  },
  zombie: {
    baseStyles: ['zombie apocalypse aesthetic', 'survival horror style', 'undead wasteland', 'post-outbreak world'],
    colorPalettes: ['sickly greens and grays', 'blood reds on muted tones', 'decay browns', 'pale death colors'],
    environmentTypes: ['overrun city', 'abandoned mall', 'survivor camp', 'quarantine zone'],
    atmosphericElements: ['decay smell implied', 'flies and insects', 'dark clouds', 'emergency lights', 'fire and smoke'],
    worldDetails: ['shambling undead', 'barricades', 'abandoned cars', 'makeshift weapons', 'survivor graffiti', 'corpses'],
    lightingPreferences: ['atmospheric', 'night', 'dramatic'],
  },
};

// ============================================================================
// BUILD PROMPT
// ============================================================================

export function buildIllustrationPrompt(request: IllustrationRequest): {
  prompt: string;
  debug: {
    essence: SceneEssence;
    playerVisible: boolean;
    focusType: string;
  };
} {
  const {
    lastNarratorMessage,
    lastUserAction,
    messageHistory,
    characterProfile,
    genre,
    currentLocation,
    timeOfDay,
    weather,
  } = request;

  // Extract scene essence
  const essence = extractSceneEssence(lastNarratorMessage, lastUserAction, messageHistory);

  // Get genre style
  const genreStyle = GENRE_STYLES[genre] || GENRE_STYLES.modern;

  const baseStyle = pick(genreStyle.baseStyles);
  const colorPalette = pick(genreStyle.colorPalettes);
  const envType = pick(genreStyle.environmentTypes);

  // Determine composition
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

  // Pick composition focus
  const focusOptions = Object.keys(COMPOSITION_FOCUS) as Array<keyof typeof COMPOSITION_FOCUS>;
  const focusType = pick(focusOptions);
  const compositionFocus = pick(COMPOSITION_FOCUS[focusType]);

  // Determine lighting
  let lightingCategory: keyof typeof LIGHTING_VARIATIONS;
  if (timeOfDay === 'night' || essence.atmosphereWords.includes('dark')) {
    lightingCategory = 'night';
  } else if (essence.momentType === 'action' || essence.momentType === 'tense') {
    lightingCategory = Math.random() > 0.4 ? 'dramatic' : 'atmospheric';
  } else if (weather === 'fog' || weather === 'rain') {
    lightingCategory = 'atmospheric';
  } else {
    lightingCategory = pick(genreStyle.lightingPreferences) as keyof typeof LIGHTING_VARIATIONS;
  }
  const lighting = pick(LIGHTING_VARIATIONS[lightingCategory]);

  // Build atmosphere elements
  const atmosphereElements: string[] = [];
  if (weather) {
    atmosphereElements.push(...pickMultiple(ATMOSPHERE_ADDITIONS.weather, 1, 2));
  }
  if (Math.random() > 0.4) {
    atmosphereElements.push(pick(ATMOSPHERE_ADDITIONS.particles));
  }
  if (Math.random() > 0.3) {
    atmosphereElements.push(pick(ATMOSPHERE_ADDITIONS.environmental));
  }
  atmosphereElements.push(...pickMultiple(genreStyle.atmosphericElements, 1, 2));
  if (essence.sensoryDetails.length > 0) {
    atmosphereElements.push(...essence.sensoryDetails.slice(0, 2));
  }

  // Determine player visibility
  let playerVisible = false;
  let playerDescription = '';
  let playerProminence = '';

  if (essence.playerDoing) {
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
  } else {
    if (Math.random() > 0.7 && essence.momentType !== 'environmental') {
      playerVisible = true;
      playerProminence = 'barely visible in frame';
      playerDescription = 'distant figure observing';
    }
  }

  // Build world activity
  const worldActivity: string[] = [];
  if (essence.others.length > 0) {
    const otherDesc = essence.others.map(o => {
      const actions = ['present', 'visible', 'in scene', 'nearby'];
      return `${o} ${pick(actions)}`;
    });
    worldActivity.push(...otherDesc.slice(0, 2));
  }
  worldActivity.push(...pickMultiple(genreStyle.worldDetails, 1, 3));

  // Assemble prompt
  const promptParts: string[] = [];

  const qualityTags = [
    'masterpiece, best quality, highly detailed',
    'exceptional quality, intricate details',
    'masterwork, superb detail and composition',
  ];
  promptParts.push(pick(qualityTags));

  promptParts.push('digital illustration, cinematic');
  promptParts.push(baseStyle);
  promptParts.push(cameraAngle);
  promptParts.push(compositionFocus);

  const sceneDescription = [
    essence.coreAction,
    `setting: ${currentLocation || essence.setting}`,
    essence.visualElements.slice(0, 3).join(', '),
  ].filter(Boolean).join(', ');

  promptParts.push(`SCENE: ${sceneDescription}`);
  promptParts.push(envType);

  if (essence.objects.length > 0) {
    promptParts.push(`details: ${essence.objects.slice(0, 3).join(', ')}`);
  }

  if (worldActivity.length > 0) {
    promptParts.push(`world: ${worldActivity.slice(0, 3).join(', ')}`);
  }

  if (playerVisible && playerDescription) {
    promptParts.push(`${playerProminence}: ${playerDescription}`);
  }

  promptParts.push(lighting);
  promptParts.push(`atmosphere: ${atmosphereElements.slice(0, 3).join(', ')}`);
  promptParts.push(`palette: ${colorPalette}`);

  if (timeOfDay) {
    const timeDescs: Record<string, string[]> = {
      dawn: ['early morning light', 'sunrise glow', 'golden dawn'],
      day: ['daylight', 'midday sun', 'afternoon light'],
      dusk: ['sunset colors', 'twilight', 'evening glow'],
      night: ['nighttime', 'darkness', 'moonlit'],
    };
    promptParts.push(pick(timeDescs[timeOfDay] || ['']));
  }

  if (weather) {
    const weatherDescs: Record<string, string[]> = {
      rain: ['rain falling', 'wet environment', 'rainy'],
      snow: ['snow falling', 'winter scene', 'snowy'],
      fog: ['fog obscuring', 'misty', 'hazy visibility'],
    };
    promptParts.push(pick(weatherDescs[weather] || ['']));
  }

  promptParts.push('environmental storytelling, 8k resolution');

  const prompt = promptParts.filter(Boolean).join(', ');

  return {
    prompt,
    debug: {
      essence,
      playerVisible,
      focusType,
    },
  };
}

// ============================================================================
// GENERATE ILLUSTRATION (API CALL)
// ============================================================================

export async function generateIllustration(
  request: IllustrationRequest,
  apiKey: string
): Promise<{ imageUrl: string; debug: any }> {
  
  const { prompt, debug } = buildIllustrationPrompt(request);
  
  console.log('[ILLUSTRATION] Generated prompt:', prompt);
  console.log('[ILLUSTRATION] Debug info:', debug);
  
  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: prompt,
      width: 1280,
      height: 720,
      steps: 4,
      n: 1,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ILLUSTRATION] API error:', response.status, errorText);
    throw new Error(`Together API error: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.data || !result.data[0] || !result.data[0].url) {
    console.error('[ILLUSTRATION] Invalid response:', result);
    throw new Error('Invalid response from Together API');
  }
  
  const imageUrl = result.data[0].url;
  console.log('[ILLUSTRATION] Generated image:', imageUrl);
  
  return { imageUrl, debug };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  buildIllustrationPrompt,
  extractSceneEssence,
  generateIllustration,
  GENRE_STYLES,
  CAMERA_ANGLES,
  LIGHTING_VARIATIONS,
};
