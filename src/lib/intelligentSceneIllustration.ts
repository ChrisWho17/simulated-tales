// ============================================================================
// INTELLIGENT SCENE ILLUSTRATION SYSTEM
// Builds image prompts from story context, genre, era, and character details
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface StoryMessage {
  role: 'narrator' | 'user' | 'system';
  content: string;
  timestamp?: number;
}

export interface CharacterContext {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  role: string;
  build?: string;
  hairColor?: string;
  hairStyle?: string;
  skinTone?: string;
  details?: string[];
  portrait?: string;
  outfit?: string;
  equipment?: string[];
}

export interface CampaignContext {
  genre: string;
  era?: string;
  setting?: string;
  tone?: string;
  worldName?: string;
}

export interface SceneIllustrationRequest {
  // Last 2 messages (primary context)
  lastNarratorMessage: string;
  lastUserAction: string;
  
  // History (10 prior messages for consistency)
  messageHistory: StoryMessage[];
  
  // Character & Campaign context
  playerCharacter: CharacterContext;
  campaignContext: CampaignContext;
  
  // NPCs in scene (if any)
  npcsPresent?: CharacterContext[];
  
  // Current location
  currentLocation?: string;
  
  // Time of day / weather (if known)
  timeOfDay?: string;
  weather?: string;
}

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const BASE_STYLE = `masterpiece, best quality, highly detailed digital illustration, semi-realistic anime style, dramatic cinematic lighting, wide shot scene illustration, dynamic composition, intricate details, 8k resolution`;

const GENRE_VISUAL_STYLES: Record<string, {
  style: string;
  lighting: string;
  colorPalette: string;
  atmosphericElements: string[];
}> = {
  modern: {
    style: 'modern military tactical, realistic military equipment, contemporary urban setting',
    lighting: 'harsh realistic lighting, dramatic shadows',
    colorPalette: 'muted earth tones, military greens and tans, urban grays',
    atmosphericElements: ['dust particles', 'smoke', 'debris', 'rain'],
  },
  cyberpunk: {
    style: 'cyberpunk aesthetic, neon lights, high-tech low-life, chrome and holographics',
    lighting: 'neon lighting, purple and cyan highlights, volumetric light rays',
    colorPalette: 'neon pinks, electric blues, deep purples, chrome silver',
    atmosphericElements: ['rain', 'neon reflections', 'holographic ads', 'steam vents'],
  },
  postapoc: {
    style: 'post-apocalyptic wasteland, ruined civilization, scavenged technology, decay',
    lighting: 'harsh sunlight, dust-filtered rays, orange haze',
    colorPalette: 'rust oranges, dusty browns, faded yellows, desaturated',
    atmosphericElements: ['dust storms', 'ash', 'toxic fog', 'overgrown vegetation'],
  },
  postapocalyptic: {
    style: 'post-apocalyptic wasteland, ruined civilization, scavenged technology, decay',
    lighting: 'harsh sunlight, dust-filtered rays, orange haze',
    colorPalette: 'rust oranges, dusty browns, faded yellows, desaturated',
    atmosphericElements: ['dust storms', 'ash', 'toxic fog', 'overgrown vegetation'],
  },
  scifi: {
    style: 'science fiction, futuristic technology, sleek designs, advanced civilization',
    lighting: 'clean bright lighting, blue-white technological glow',
    colorPalette: 'clean whites, metallic silvers, holographic blues, accent colors',
    atmosphericElements: ['holographic displays', 'energy fields', 'stars', 'alien skies'],
  },
  ww2: {
    style: '1940s world war 2, historical military, period accurate, gritty realism',
    lighting: 'natural wartime lighting, overcast skies, muzzle flashes',
    colorPalette: 'sepia tones, military olive drab, muddy browns, desaturated',
    atmosphericElements: ['smoke', 'explosions', 'mud', 'rain', 'fog of war'],
  },
  medieval: {
    style: 'medieval fantasy, castles and kingdoms, swords and sorcery, epic fantasy',
    lighting: 'dramatic fantasy lighting, torchlight, magical glow',
    colorPalette: 'rich golds, deep reds, royal purples, forest greens',
    atmosphericElements: ['torchlight', 'magical particles', 'mist', 'banners'],
  },
  fantasy: {
    style: 'high fantasy, magical world, epic adventure, mythical creatures',
    lighting: 'dramatic fantasy lighting, ethereal glow, magical illumination',
    colorPalette: 'rich golds, deep blues, mystical purples, forest greens',
    atmosphericElements: ['magical particles', 'mist', 'glowing runes', 'arcane energy'],
  },
  horror: {
    style: 'dark horror, dread and terror, grotesque, survival horror',
    lighting: 'low key lighting, deep shadows, unsettling highlights',
    colorPalette: 'desaturated, sickly greens, blood reds, deep blacks',
    atmosphericElements: ['fog', 'darkness', 'blood', 'decay', 'flickering lights'],
  },
  western: {
    style: 'wild west, frontier americana, dusty towns, outlaws and lawmen',
    lighting: 'harsh desert sun, golden hour, saloon lamplight',
    colorPalette: 'warm browns, dusty oranges, sunset reds, weathered wood',
    atmosphericElements: ['dust', 'tumbleweeds', 'heat haze', 'gun smoke'],
  },
  noir: {
    style: 'film noir, 1940s detective, hard-boiled crime, femme fatale',
    lighting: 'high contrast, venetian blind shadows, single light source',
    colorPalette: 'black and white tones, deep shadows, harsh highlights',
    atmosphericElements: ['cigarette smoke', 'rain', 'neon signs', 'fedoras'],
  },
  victorian: {
    style: 'victorian era, steampunk elements, industrial revolution, gaslight',
    lighting: 'gaslight glow, fog-filtered streetlights, warm interiors',
    colorPalette: 'brass and copper, deep burgundy, forest green, cream',
    atmosphericElements: ['steam', 'fog', 'gears', 'gas lamps'],
  },
};

const ERA_MODIFIERS: Record<string, string> = {
  ancient: 'ancient civilization, bronze age, primitive technology, classical architecture',
  medieval: 'medieval period, castles, feudal society, pre-gunpowder',
  renaissance: 'renaissance era, early firearms, artistic flourishing, exploration age',
  victorian: 'victorian era, steam technology, industrial revolution, gothic elements',
  ww1: 'world war 1 era, trench warfare, early tanks, biplanes, mustard gas',
  ww2: 'world war 2 era, 1940s technology, combined arms warfare',
  coldwar: 'cold war era, 1960s-1980s, espionage, nuclear tension',
  modern: 'contemporary modern day, current technology, present day',
  nearfuture: 'near future, emerging technology, 2030-2050 aesthetic',
  farfuture: 'far future, advanced technology, space age, post-scarcity',
};

// ============================================================================
// SCENE ANALYSIS - Extract visual elements from text
// ============================================================================

// Action keywords that indicate scene type
const ACTION_PATTERNS: Record<string, string[]> = {
  combat: [
    'fight', 'attack', 'shoot', 'fire', 'strike', 'slash', 'stab', 'punch', 'kick',
    'battle', 'combat', 'engage', 'assault', 'defend', 'dodge', 'block', 'parry',
    'explosion', 'gunfire', 'bullets', 'blood', 'wound', 'kill', 'death',
  ],
  stealth: [
    'sneak', 'hide', 'creep', 'shadow', 'silent', 'quiet', 'crouch', 'crawl',
    'observe', 'watch', 'spy', 'infiltrate', 'avoid', 'evade',
  ],
  dialogue: [
    'say', 'speak', 'talk', 'ask', 'tell', 'explain', 'discuss', 'negotiate',
    'convince', 'persuade', 'argue', 'shout', 'whisper', 'respond', 'reply',
  ],
  exploration: [
    'walk', 'move', 'enter', 'exit', 'explore', 'search', 'look', 'examine',
    'investigate', 'discover', 'find', 'open', 'climb', 'descend', 'travel',
  ],
  emotional: [
    'cry', 'laugh', 'smile', 'frown', 'fear', 'anger', 'joy', 'sad', 'grief',
    'relief', 'shock', 'surprise', 'despair', 'hope', 'love', 'hate',
  ],
  rest: [
    'rest', 'sleep', 'sit', 'relax', 'eat', 'drink', 'heal', 'recover',
    'camp', 'shelter', 'wait', 'meditate', 'prepare',
  ],
};

// Location keywords
const LOCATION_PATTERNS: Record<string, string[]> = {
  indoor: [
    'room', 'building', 'inside', 'interior', 'hallway', 'corridor', 'office',
    'house', 'apartment', 'bunker', 'shelter', 'cave', 'basement', 'attic',
    'warehouse', 'factory', 'hospital', 'church', 'bar', 'restaurant',
  ],
  outdoor: [
    'outside', 'street', 'road', 'path', 'forest', 'woods', 'field', 'desert',
    'mountain', 'hill', 'river', 'lake', 'ocean', 'beach', 'city', 'town',
    'village', 'wasteland', 'ruins', 'rooftop', 'alley',
  ],
  vehicle: [
    'car', 'truck', 'tank', 'plane', 'helicopter', 'ship', 'boat', 'train',
    'spaceship', 'motorcycle', 'humvee', 'apc', 'sherman', 'panzer', 'tiger',
  ],
};

// Weather/atmosphere keywords
const ATMOSPHERE_PATTERNS = {
  weather: {
    rain: ['rain', 'raining', 'storm', 'downpour', 'drizzle', 'wet'],
    snow: ['snow', 'snowing', 'blizzard', 'ice', 'frozen', 'cold'],
    fog: ['fog', 'mist', 'haze', 'murky', 'visibility'],
    clear: ['clear', 'sunny', 'bright', 'cloudless'],
    overcast: ['cloudy', 'overcast', 'gray', 'gloomy'],
  },
  timeOfDay: {
    dawn: ['dawn', 'sunrise', 'morning', 'early'],
    day: ['day', 'noon', 'afternoon', 'midday', 'bright'],
    dusk: ['dusk', 'sunset', 'evening', 'twilight'],
    night: ['night', 'dark', 'midnight', 'darkness', 'moon'],
  },
  mood: {
    tense: ['tense', 'nervous', 'anxious', 'danger', 'threat', 'ominous'],
    peaceful: ['peaceful', 'calm', 'quiet', 'serene', 'tranquil'],
    chaotic: ['chaos', 'frantic', 'hectic', 'pandemonium', 'mayhem'],
    somber: ['somber', 'sad', 'melancholy', 'grief', 'mourning'],
    triumphant: ['victory', 'triumph', 'success', 'celebration', 'glory'],
  },
};

// ============================================================================
// TEXT ANALYSIS FUNCTIONS
// ============================================================================

export function analyzeSceneType(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedTypes: string[] = [];
  
  for (const [type, keywords] of Object.entries(ACTION_PATTERNS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detectedTypes.push(type);
    }
  }
  
  return detectedTypes.length > 0 ? detectedTypes : ['exploration'];
}

export function analyzeLocation(text: string): { type: string; specific: string | null } {
  const lowerText = text.toLowerCase();
  
  for (const [type, keywords] of Object.entries(LOCATION_PATTERNS)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw)) {
        return { type, specific: kw };
      }
    }
  }
  
  return { type: 'outdoor', specific: null };
}

export function analyzeAtmosphere(text: string): {
  weather: string | null;
  timeOfDay: string | null;
  mood: string | null;
} {
  const lowerText = text.toLowerCase();
  
  let weather: string | null = null;
  let timeOfDay: string | null = null;
  let mood: string | null = null;
  
  // Check weather
  for (const [type, keywords] of Object.entries(ATMOSPHERE_PATTERNS.weather)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      weather = type;
      break;
    }
  }
  
  // Check time of day
  for (const [type, keywords] of Object.entries(ATMOSPHERE_PATTERNS.timeOfDay)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      timeOfDay = type;
      break;
    }
  }
  
  // Check mood
  for (const [type, keywords] of Object.entries(ATMOSPHERE_PATTERNS.mood)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      mood = type;
      break;
    }
  }
  
  return { weather, timeOfDay, mood };
}

export function extractKeyPhrases(text: string): string[] {
  // Extract descriptive phrases that could be useful for image generation
  const phrases: string[] = [];
  
  // Look for descriptive patterns
  const descriptivePatterns = [
    /(?:the|a|an)\s+(\w+\s+\w+(?:\s+\w+)?)/gi,  // "the dark corridor"
    /(?:through|into|inside|outside)\s+(?:the|a)?\s*(\w+(?:\s+\w+)?)/gi,  // "through the forest"
    /(?:surrounded by|covered in|filled with)\s+(\w+(?:\s+\w+)?)/gi,  // "surrounded by enemies"
  ];
  
  for (const pattern of descriptivePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 3) {
        phrases.push(match[1].trim());
      }
    }
  }
  
  return [...new Set(phrases)].slice(0, 5); // Unique, max 5
}

// ============================================================================
// SCENE-TYPE SPECIFIC COMPOSITIONS
// ============================================================================

const SCENE_COMPOSITIONS: Record<string, {
  framing: string;
  cameraAngle: string;
  focus: string;
  dynamicElements: string[];
}> = {
  combat: {
    framing: 'dynamic action shot, motion blur on edges, intense focus',
    cameraAngle: 'dramatic low angle or dutch angle, emphasizing action',
    focus: 'character in combat stance, weapon visible, enemy presence',
    dynamicElements: ['muzzle flash', 'debris flying', 'impact effects', 'motion lines'],
  },
  stealth: {
    framing: 'atmospheric shot, deep shadows, limited visibility',
    cameraAngle: 'over-the-shoulder or hidden vantage point perspective',
    focus: 'character partially obscured, tense posture, environmental cover',
    dynamicElements: ['shadows', 'silhouettes', 'light beams', 'dust particles'],
  },
  dialogue: {
    framing: 'character-focused medium shot, conversational composition',
    cameraAngle: 'eye-level, natural perspective',
    focus: 'character expressions, body language, other participants visible',
    dynamicElements: ['gesture hands', 'environmental context', 'mood lighting'],
  },
  exploration: {
    framing: 'establishing shot showing environment, character in context',
    cameraAngle: 'wide angle showing surroundings, character as focal point',
    focus: 'interesting environment, character exploring or observing',
    dynamicElements: ['environmental details', 'lighting effects', 'atmosphere'],
  },
  emotional: {
    framing: 'intimate close-up or meaningful medium shot',
    cameraAngle: 'eye-level or slightly low for vulnerability',
    focus: 'character emotion, facial expression, body language',
    dynamicElements: ['atmospheric lighting matching mood', 'symbolic elements'],
  },
  rest: {
    framing: 'calm composed shot, peaceful atmosphere',
    cameraAngle: 'relaxed perspective, warm framing',
    focus: 'character at rest, safe environment, quiet moment',
    dynamicElements: ['soft lighting', 'warmth indicators', 'safety elements'],
  },
};

// ============================================================================
// HELPER BUILDERS
// ============================================================================

function buildCharacterDescription(char: CharacterContext, isNpc: boolean = false): string {
  const parts = [
    char.gender,
    char.build ? `${char.build} build` : '',
    char.hairColor && char.hairStyle ? `${char.hairColor} ${char.hairStyle} hair` : char.hairColor ? `${char.hairColor} hair` : '',
    char.role ? getRoleVisualDescription(char.role) : '',
    char.outfit || '',
    char.details?.includes('tattoos') ? 'visible tattoos' : '',
    char.details?.includes('scars') ? 'facial scars' : '',
    char.details?.includes('cybernetics') ? 'cybernetic augmentations' : '',
  ];
  
  return parts.filter(Boolean).join(', ');
}

function getRoleVisualDescription(role: string): string {
  const roleVisuals: Record<string, string> = {
    soldier: 'wearing tactical military gear, armed',
    medic: 'wearing medic gear with red cross markings, medical equipment',
    sniper: 'wearing camouflage gear, carrying scoped rifle',
    heavy: 'heavily armored, carrying heavy weapon',
    engineer: 'wearing utility gear with tools',
    pilot: 'wearing flight suit',
    tank: 'wearing tanker gear with goggles',
    officer: 'wearing officer uniform with insignia',
    scout: 'wearing light reconnaissance gear',
    knight: 'wearing plate armor',
    rogue: 'wearing dark leather armor',
    mage: 'wearing robes with arcane symbols',
    survivor: 'wearing scavenged gear',
    mercenary: 'wearing mixed military equipment',
    warrior: 'wearing battle armor, armed with weapons',
    ranger: 'wearing forest gear, bow or rifle ready',
    thief: 'wearing dark clothing, daggers concealed',
  };
  
  return roleVisuals[role.toLowerCase()] || 'appropriately equipped';
}

function buildAtmosphereDescription(
  analysis: { weather: string | null; timeOfDay: string | null; mood: string | null },
  timeOfDay?: string | null,
  weather?: string | null
): string {
  const parts: string[] = [];
  
  // Time of day
  const time = timeOfDay || analysis.timeOfDay;
  if (time) {
    const timeDescriptions: Record<string, string> = {
      dawn: 'early morning golden hour light, soft warm sunrise',
      day: 'bright daylight, clear visibility',
      dusk: 'dramatic sunset lighting, orange and purple sky',
      night: 'nighttime darkness, moonlight and artificial lights',
    };
    parts.push(timeDescriptions[time] || '');
  }
  
  // Weather
  const currentWeather = weather || analysis.weather;
  if (currentWeather) {
    const weatherDescriptions: Record<string, string> = {
      rain: 'rain falling, wet surfaces, reflections on ground',
      snow: 'snow falling, frost and ice, cold breath visible',
      fog: 'thick fog, limited visibility, mysterious atmosphere',
      clear: 'clear weather, good visibility',
      overcast: 'overcast cloudy sky, diffused lighting',
    };
    parts.push(weatherDescriptions[currentWeather] || '');
  }
  
  // Mood
  if (analysis.mood) {
    const moodDescriptions: Record<string, string> = {
      tense: 'tense atmosphere, sense of danger',
      peaceful: 'peaceful calm atmosphere',
      chaotic: 'chaotic scene, multiple elements in motion',
      somber: 'somber melancholy atmosphere, muted tones',
      triumphant: 'triumphant atmosphere, victorious mood',
    };
    parts.push(moodDescriptions[analysis.mood] || '');
  }
  
  return parts.filter(Boolean).join(', ');
}

function extractActionDescription(userAction: string, narratorResponse: string): string {
  // Combine user intent with narrator description
  // Prioritize the narrator's more descriptive text but incorporate user action
  
  const userActionClean = userAction
    .replace(/^(I |i )/g, 'the protagonist ')
    .replace(/^(my |My )/g, 'their ')
    .trim();
  
  // Extract the most descriptive sentence from narrator response
  const sentences = narratorResponse.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const descriptiveSentence = sentences.find(s => 
    s.toLowerCase().includes('you ') || 
    s.includes(userActionClean.split(' ')[0])
  ) || sentences[0] || '';
  
  // Combine into scene description
  const actionDesc = descriptiveSentence
    .replace(/^you /gi, 'the protagonist ')
    .replace(/ you /gi, ' the protagonist ')
    .trim();
  
  return actionDesc || userActionClean;
}

// ============================================================================
// MAIN PROMPT BUILDER
// ============================================================================

export function buildSceneIllustrationPrompt(request: SceneIllustrationRequest): string {
  const {
    lastNarratorMessage,
    lastUserAction,
    messageHistory,
    playerCharacter,
    campaignContext,
    npcsPresent = [],
    currentLocation,
    timeOfDay,
    weather,
  } = request;
  
  // Combine recent messages for analysis
  const primaryContext = `${lastNarratorMessage} ${lastUserAction}`;
  
  // Analyze the scene
  const sceneTypes = analyzeSceneType(primaryContext);
  const primarySceneType = sceneTypes[0];
  const locationAnalysis = analyzeLocation(primaryContext);
  const atmosphere = analyzeAtmosphere(primaryContext);
  const keyPhrases = extractKeyPhrases(lastNarratorMessage);
  
  // Get genre and era styles
  const genreKey = campaignContext.genre?.toLowerCase() || 'modern';
  const genreStyle = GENRE_VISUAL_STYLES[genreKey] || GENRE_VISUAL_STYLES.modern;
  const eraKey = campaignContext.era?.toLowerCase() || genreKey;
  const eraStyle = ERA_MODIFIERS[eraKey] || '';
  
  // Get scene composition
  const composition = SCENE_COMPOSITIONS[primarySceneType] || SCENE_COMPOSITIONS.exploration;
  
  // Build character description
  const characterDesc = buildCharacterDescription(playerCharacter);
  
  // Build NPC descriptions if present
  const npcDescs = npcsPresent.map(npc => buildCharacterDescription(npc, true)).join(', ');
  
  // Build location description
  const locationDesc = currentLocation || locationAnalysis.specific || 
    (locationAnalysis.type === 'indoor' ? 'interior environment' : 'exterior environment');
  
  // Build atmosphere description
  const atmosphereDesc = buildAtmosphereDescription(
    atmosphere,
    timeOfDay || atmosphere.timeOfDay,
    weather || atmosphere.weather
  );
  
  // Build action description from user action
  const actionDesc = extractActionDescription(lastUserAction, lastNarratorMessage);
  
  // Assemble the prompt
  const promptParts = [
    // Base style
    BASE_STYLE,
    
    // Genre/Era styling
    genreStyle.style,
    eraStyle,
    
    // Composition
    composition.framing,
    composition.cameraAngle,
    
    // Scene description
    `scene: ${actionDesc}`,
    
    // Main character
    characterDesc ? `protagonist: ${characterDesc}` : '',
    
    // NPCs if present
    npcDescs ? `other characters: ${npcDescs}` : '',
    
    // Location
    `setting: ${locationDesc}`,
    
    // Atmosphere
    atmosphereDesc,
    
    // Lighting
    genreStyle.lighting,
    
    // Color palette
    `color palette: ${genreStyle.colorPalette}`,
    
    // Key descriptive phrases from the narrative
    keyPhrases.length > 0 ? `details: ${keyPhrases.join(', ')}` : '',
    
    // Dynamic elements based on scene type
    composition.dynamicElements.slice(0, 2).join(', '),
    
    // Genre atmospheric elements
    genreStyle.atmosphericElements[Math.floor(Math.random() * genreStyle.atmosphericElements.length)],
  ];
  
  return promptParts.filter(Boolean).join(', ');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  GENRE_VISUAL_STYLES,
  ERA_MODIFIERS,
  SCENE_COMPOSITIONS,
  ACTION_PATTERNS,
  LOCATION_PATTERNS,
  ATMOSPHERE_PATTERNS,
};
