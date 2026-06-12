// ============================================================================
// CHARACTER-CONSISTENT ILLUSTRATION SYSTEM
// Uses portrait details to maintain character appearance across all generations
// ============================================================================

// ============================================================================
// CHARACTER VISUAL PROFILE
// ============================================================================

export interface CharacterVisualProfile {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  age?: 'young' | 'adult' | 'middleAged' | 'elderly';
  
  physicalDescription: {
    build: string;
    height?: string;
    skinTone: string;
    faceShape?: string;
  };
  
  hair: {
    color: string;
    style: string;
    length: string;
    texture?: string;
  };
  
  eyes: {
    color: string;
    shape?: string;
    notable?: string;
  };
  
  facialFeatures: {
    scars?: string;
    tattoos?: string;
    beard?: string;
    makeup?: string;
    piercings?: string;
    other?: string;
  };
  
  modifications?: {
    cybernetics?: string;
    prosthetics?: string;
    other?: string;
  };
  
  role: string;
  roleAppearance: string;
  currentOutfit?: string;
  currentEquipment?: string;
  fullVisualDescription: string;
  portraitUrl?: string;
  emotionPortraits?: Record<string, string>;
}

// ============================================================================
// BUILD VISUAL PROFILE DURING CHARACTER CREATION
// ============================================================================

const BUILD_DESCRIPTIONS: Record<string, string> = {
  athletic: 'athletic muscular build with toned physique',
  lean: 'lean agile build with wiry muscles',
  muscular: 'heavily muscular imposing build with broad shoulders',
  stocky: 'stocky sturdy build with compact powerful frame',
  slim: 'slim slender build with thin frame',
  average: 'average build with normal proportions',
  large: 'large heavy build with imposing frame',
};

const SKIN_TONE_DESCRIPTIONS: Record<string, string> = {
  pale: 'pale fair skin',
  light: 'light skin tone',
  medium: 'medium skin tone',
  tan: 'tanned sun-kissed skin',
  olive: 'olive skin tone',
  brown: 'brown skin tone',
  dark: 'dark skin tone',
};

const HAIR_COLOR_DESCRIPTIONS: Record<string, string> = {
  black: 'jet black hair',
  brown: 'brown hair',
  darkBrown: 'dark brown hair',
  lightBrown: 'light brown hair',
  blonde: 'blonde hair',
  dirtyBlonde: 'dirty blonde hair',
  platinum: 'platinum blonde hair',
  red: 'red auburn hair',
  ginger: 'ginger orange hair',
  white: 'white silver hair',
  gray: 'gray hair',
  blue: 'blue dyed hair',
  pink: 'pink dyed hair',
  purple: 'purple dyed hair',
};

const HAIR_STYLE_DESCRIPTIONS: Record<string, string> = {
  short: 'short cropped hair',
  military: 'military buzz cut',
  mohawk: 'mohawk with shaved sides',
  shaved: 'shaved bald head',
  long: 'long flowing hair',
  ponytail: 'hair tied in tactical ponytail',
  braided: 'braided hair',
  undercut: 'undercut hairstyle',
  messy: 'messy unkempt hair',
  slicked: 'slicked back hair',
};

const EYE_COLOR_DESCRIPTIONS: Record<string, string> = {
  brown: 'deep brown eyes',
  blue: 'bright blue eyes',
  green: 'striking green eyes',
  hazel: 'hazel eyes',
  gray: 'steel gray eyes',
  amber: 'amber golden eyes',
};

const ROLE_APPEARANCES: Record<string, string> = {
  soldier: 'wearing military tactical gear, combat vest with pouches, armed with assault rifle',
  medic: 'wearing combat medic gear with prominent red cross armband and medical backpack',
  sniper: 'wearing ghillie suit elements and camouflage, carrying scoped sniper rifle',
  heavy: 'wearing heavy reinforced armor, carrying large machine gun with ammo belts',
  engineer: 'wearing utility gear with tool belt and welding goggles pushed up',
  pilot: 'wearing flight suit with patches, aviator helmet nearby',
  tank: 'wearing tanker jacket with oil stains, tanker helmet with goggles',
  officer: 'wearing decorated officer uniform with rank insignia and medals',
  scout: 'wearing light tactical reconnaissance gear with binoculars',
  spec_ops: 'wearing all-black tactical gear with night vision goggles',
  knight: 'wearing ornate plate armor with family crest engraved',
  rogue: 'wearing dark leather armor with hidden blade sheaths',
  mage: 'wearing armored battle robes with glowing arcane symbols',
  survivor: 'wearing scavenged makeshift armor and gear',
  mercenary: 'wearing mixed military equipment with no identifying insignia',
};

const HEIGHT_DESCRIPTIONS: Record<string, string> = {
  'very short':  'very short petite stature, noticeably shorter than average, compact frame, low eye-line in frame',
  'very_short':  'very short petite stature, noticeably shorter than average, compact frame, low eye-line in frame',
  short:         'short below-average stature, smaller compact frame',
  'below average': 'slightly below-average height',
  average:       'average height with normal proportions',
  medium:        'average height with normal proportions',
  tall:          'tall above-average stature, long limbs, elongated proportions, higher eye-line',
  'above average': 'above-average height, long limbs',
  'very tall':   'very tall imposing towering stature, dramatically elongated proportions, head near top of frame',
  'very_tall':   'very tall imposing towering stature, dramatically elongated proportions, head near top of frame',
  giant:         'gigantic towering stature, massive imposing height',
};

export function buildCharacterVisualProfile(characterData: {
  name: string;
  gender: string;
  role: string;
  build?: string;
  height?: string;
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  details?: string[];
  customDescription?: string;
}, genre: string): CharacterVisualProfile {
  
  const details = characterData.details || [];
  const facialFeatures: CharacterVisualProfile['facialFeatures'] = {};
  
  if (details.includes('scars')) facialFeatures.scars = 'visible battle scars on face';
  if (details.includes('tattoos')) facialFeatures.tattoos = 'military tattoos visible on neck and arms';
  if (details.includes('beard')) facialFeatures.beard = 'tactical beard with stubble';
  else facialFeatures.beard = 'clean shaven';
  if (details.includes('freckles')) facialFeatures.other = 'freckles across nose and cheeks';
  if (details.includes('weathered')) {
    facialFeatures.other = (facialFeatures.other ? facialFeatures.other + ', ' : '') + 'weathered battle-hardened face';
  }
  
  const modifications: CharacterVisualProfile['modifications'] = {};
  if (details.includes('cybernetics')) modifications.cybernetics = 'visible cybernetic augmentations';
  if (details.includes('eyepatch')) modifications.other = 'eye patch over one eye';
  
  const buildDesc = BUILD_DESCRIPTIONS[characterData.build || 'athletic'] || 'athletic build';
  const heightKey = (characterData.height || '').toLowerCase().trim();
  const heightDesc = heightKey
    ? (HEIGHT_DESCRIPTIONS[heightKey] || (/\d/.test(heightKey)
        ? `character height ${characterData.height}, scale framing to this stature`
        : `${characterData.height} stature`))
    : '';
  const skinDesc = SKIN_TONE_DESCRIPTIONS[characterData.skinTone || 'medium'] || 'medium skin tone';
  const hairColorDesc = HAIR_COLOR_DESCRIPTIONS[characterData.hairColor || 'brown'] || 'brown hair';
  const hairStyleDesc = HAIR_STYLE_DESCRIPTIONS[characterData.hairStyle || 'short'] || 'short hair';
  const eyeColorDesc = EYE_COLOR_DESCRIPTIONS[characterData.eyeColor || 'brown'] || 'brown eyes';
  const roleAppearance = ROLE_APPEARANCES[characterData.role || 'soldier'] || 'wearing tactical gear';
  
  const genderDesc = characterData.gender === 'female' 
    ? 'woman with feminine features and beautiful face'
    : characterData.gender === 'male'
    ? 'man with masculine features and strong jawline'
    : 'person with androgynous features';
  
  const facialFeaturesDesc = Object.values(facialFeatures).filter(Boolean).join(', ');
  const modificationsDesc = Object.values(modifications || {}).filter(Boolean).join(', ');
  
  const fullVisualDescription = [
    genderDesc,
    buildDesc,
    heightDesc,
    skinDesc,
    `${hairColorDesc} in ${hairStyleDesc}`,
    eyeColorDesc,
    facialFeaturesDesc,
    modificationsDesc,
    roleAppearance,
    characterData.customDescription,
  ].filter(Boolean).join(', ');
  
  return {
    name: characterData.name,
    gender: characterData.gender as 'male' | 'female' | 'nonbinary',
    physicalDescription: { build: buildDesc, height: heightDesc || undefined, skinTone: skinDesc },
    hair: { color: hairColorDesc, style: hairStyleDesc, length: characterData.hairStyle?.includes('long') ? 'long' : 'short' },
    eyes: { color: eyeColorDesc },
    facialFeatures,
    modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
    role: characterData.role || 'soldier',
    roleAppearance,
    fullVisualDescription,
  };
}

// ============================================================================
// GENRE STYLES
// ============================================================================

export const GENRE_STYLES: Record<string, {
  artStyle: string;
  lighting: string;
  colorPalette: string;
  atmosphere: string[];
  equipment: string;
}> = {
  modern: {
    artStyle: 'modern military tactical realism, contemporary equipment',
    lighting: 'realistic harsh lighting with dramatic shadows',
    colorPalette: 'muted earth tones, military greens, urban grays',
    atmosphere: ['smoke and dust', 'urban debris', 'rain', 'muzzle flash'],
    equipment: 'modern tactical gear, kevlar vest, combat boots',
  },
  cyberpunk: {
    artStyle: 'cyberpunk neon-noir aesthetic, high-tech low-life',
    lighting: 'neon lighting with purple and cyan highlights',
    colorPalette: 'neon pinks, electric blues, deep purples, chrome silver',
    atmosphere: ['neon reflections', 'rain on chrome', 'holographic ads', 'steam'],
    equipment: 'high-tech armor with glowing elements, cybernetic augments',
  },
  postapoc: {
    artStyle: 'post-apocalyptic wasteland aesthetic, ruined civilization',
    lighting: 'harsh sunlight through dust, orange haze',
    colorPalette: 'rust oranges, dusty browns, faded yellows',
    atmosphere: ['dust clouds', 'ash particles', 'toxic fog', 'decay'],
    equipment: 'scavenged armor, makeshift weapons, gas mask',
  },
  scifi: {
    artStyle: 'science fiction military aesthetic, advanced technology',
    lighting: 'clean bright lighting, blue-white technological glow',
    colorPalette: 'clean whites, metallic silvers, holographic blues',
    atmosphere: ['holographic displays', 'energy shields', 'stars'],
    equipment: 'sleek futuristic armor, energy weapons',
  },
  ww2: {
    artStyle: '1940s world war 2 historical accuracy, period military',
    lighting: 'natural wartime lighting, overcast skies',
    colorPalette: 'sepia tones, olive drab, muddy browns',
    atmosphere: ['smoke', 'mud', 'rain', 'fog of war', 'explosions'],
    equipment: 'period accurate WW2 uniform, M1 helmet, vintage weapons',
  },
  medieval: {
    artStyle: 'medieval fantasy epic, swords and sorcery',
    lighting: 'dramatic fantasy lighting, torchlight, magical glow',
    colorPalette: 'rich golds, deep reds, royal purples, forest greens',
    atmosphere: ['torchlight flicker', 'magical particles', 'mist'],
    equipment: 'plate armor, chainmail, swords, shields',
  },
  horror: {
    artStyle: 'dark horror aesthetic, survival horror',
    lighting: 'low key lighting, deep shadows',
    colorPalette: 'desaturated colors, sickly greens, blood reds',
    atmosphere: ['fog', 'darkness', 'blood', 'decay', 'flickering lights'],
    equipment: 'bloodied clothing, improvised weapons',
  },
  western: {
    artStyle: 'wild west frontier aesthetic, dusty towns',
    lighting: 'harsh desert sun, golden hour, saloon lamplight',
    colorPalette: 'warm browns, dusty oranges, sunset reds',
    atmosphere: ['dust', 'tumbleweeds', 'heat haze', 'gun smoke'],
    equipment: 'cowboy hat, duster coat, revolvers, rifle',
  },
};

// ============================================================================
// SCENE COMPOSITIONS
// ============================================================================

export const SCENE_COMPOSITIONS: Record<string, {
  framing: string;
  camera: string;
  characterPose: string;
  dynamicElements: string;
}> = {
  combat: {
    framing: 'dynamic action shot with motion blur, intense dramatic moment',
    camera: 'dramatic low angle or dutch angle emphasizing action',
    characterPose: 'in aggressive combat stance, weapon raised or firing, intense expression',
    dynamicElements: 'muzzle flash, flying debris, impact effects, enemies visible',
  },
  stealth: {
    framing: 'atmospheric tense shot with deep shadows',
    camera: 'over-the-shoulder or hidden vantage point perspective',
    characterPose: 'crouched in shadows, alert and cautious, weapon ready',
    dynamicElements: 'dramatic shadows, light beams, silhouettes',
  },
  dialogue: {
    framing: 'character-focused medium shot showing expression',
    camera: 'eye-level natural perspective',
    characterPose: 'engaged in conversation, expressive body language',
    dynamicElements: 'other characters visible, environmental context',
  },
  exploration: {
    framing: 'establishing shot showing character in environment',
    camera: 'wide angle showing surroundings with character as focal point',
    characterPose: 'walking or standing observant, taking in surroundings',
    dynamicElements: 'detailed environment, atmospheric effects',
  },
  emotional: {
    framing: 'intimate close-up or meaningful medium shot',
    camera: 'eye-level or slightly low for vulnerability',
    characterPose: 'showing clear emotion, expressive face and body language',
    dynamicElements: 'atmospheric lighting matching mood',
  },
  rest: {
    framing: 'calm composed shot with peaceful atmosphere',
    camera: 'relaxed natural perspective, warm framing',
    characterPose: 'at rest, relaxed posture, safe moment',
    dynamicElements: 'soft warm lighting, safety indicators',
  },
  action: {
    framing: 'high-energy action shot capturing movement',
    camera: 'dynamic angle following the action',
    characterPose: 'mid-action, dynamic pose, full body movement',
    dynamicElements: 'motion effects, environment interaction',
  },
};

// ============================================================================
// SCENE ANALYSIS
// ============================================================================

export interface SceneAnalysis {
  sceneType: 'combat' | 'stealth' | 'dialogue' | 'exploration' | 'emotional' | 'rest' | 'action';
  characterInvolvement: 'protagonist_focus' | 'protagonist_present' | 'environmental';
  characterAction: string;
  location: string;
  timeOfDay: string | null;
  weather: string | null;
  mood: string;
  keyVisualElements: string[];
}

export function analyzeScene(
  narratorMessage: string,
  userAction: string
): SceneAnalysis {
  const fullContext = `${narratorMessage} ${userAction}`;
  const lowerContext = fullContext.toLowerCase();
  
  // Scene type detection
  let sceneType: SceneAnalysis['sceneType'] = 'exploration';
  
  const combatWords = ['fight', 'attack', 'shoot', 'fire', 'strike', 'slash', 'battle', 'combat', 'bullets', 'explosion', 'kill', 'wound', 'duck', 'cover', 'reload'];
  const stealthWords = ['sneak', 'hide', 'creep', 'shadow', 'silent', 'quiet', 'crouch', 'observe', 'spy', 'infiltrate'];
  const dialogueWords = ['say', 'speak', 'talk', 'ask', 'tell', 'explain', 'discuss', 'negotiate', 'shout', 'whisper'];
  const emotionalWords = ['cry', 'laugh', 'smile', 'fear', 'anger', 'joy', 'sad', 'grief', 'relief', 'shock'];
  const restWords = ['rest', 'sleep', 'sit', 'relax', 'eat', 'drink', 'heal', 'recover', 'camp', 'wait'];
  const actionWords = ['run', 'jump', 'climb', 'dodge', 'grab', 'throw', 'kick', 'break', 'smash', 'push'];
  
  if (combatWords.some(w => lowerContext.includes(w))) sceneType = 'combat';
  else if (stealthWords.some(w => lowerContext.includes(w))) sceneType = 'stealth';
  else if (dialogueWords.some(w => lowerContext.includes(w))) sceneType = 'dialogue';
  else if (emotionalWords.some(w => lowerContext.includes(w))) sceneType = 'emotional';
  else if (restWords.some(w => lowerContext.includes(w))) sceneType = 'rest';
  else if (actionWords.some(w => lowerContext.includes(w))) sceneType = 'action';
  
  // Character involvement
  const characterInvolvement: SceneAnalysis['characterInvolvement'] = 
    userAction.toLowerCase().startsWith('i ') || narratorMessage.toLowerCase().includes('you ')
      ? 'protagonist_focus' : 'protagonist_present';
  
  // Extract action
  let characterAction = userAction.replace(/^i /i, '').trim();
  const youMatch = narratorMessage.match(/you\s+([^.!?]+)/i);
  if (youMatch) characterAction = youMatch[1].trim();
  
  // Location
  let location = 'unknown location';
  const locationMatch = fullContext.match(/(?:in|inside|at|near)\s+(?:the|a)?\s*([^,.!?]+)/i);
  if (locationMatch) location = locationMatch[1].trim();
  
  // Time of day
  let timeOfDay: string | null = null;
  if (/\b(dawn|sunrise|morning)\b/i.test(fullContext)) timeOfDay = 'dawn';
  else if (/\b(noon|midday|afternoon|daylight)\b/i.test(fullContext)) timeOfDay = 'day';
  else if (/\b(dusk|sunset|evening|twilight)\b/i.test(fullContext)) timeOfDay = 'dusk';
  else if (/\b(night|dark|midnight)\b/i.test(fullContext)) timeOfDay = 'night';
  
  // Weather
  let weather: string | null = null;
  if (/\b(rain|raining|storm)\b/i.test(fullContext)) weather = 'rain';
  else if (/\b(snow|snowing|blizzard)\b/i.test(fullContext)) weather = 'snow';
  else if (/\b(fog|mist|haze)\b/i.test(fullContext)) weather = 'fog';
  
  // Mood
  let mood = 'neutral';
  if (/\b(tense|danger|threat)\b/i.test(fullContext)) mood = 'tense';
  else if (/\b(peaceful|calm|quiet)\b/i.test(fullContext)) mood = 'peaceful';
  else if (/\b(chaos|frantic)\b/i.test(fullContext)) mood = 'chaotic';
  
  // Key visual elements
  const keyVisualElements: string[] = [];
  const visualMatch = fullContext.match(/(?:holding|carrying|wielding|covered in)\s+([^,.!?]+)/gi);
  if (visualMatch) keyVisualElements.push(...visualMatch.map(m => m.trim()));
  
  return {
    sceneType,
    characterInvolvement,
    characterAction,
    location,
    timeOfDay,
    weather,
    mood,
    keyVisualElements: keyVisualElements.slice(0, 3),
  };
}

// ============================================================================
// MAIN PROMPT BUILDER
// ============================================================================

export interface SceneIllustrationRequest {
  lastNarratorMessage: string;
  lastUserAction: string;
  messageHistory: Array<{ role: string; content: string }>;
  characterProfile: CharacterVisualProfile;
  genre: string;
  era?: string;
  currentLocation?: string;
  timeOfDay?: string;
  weather?: string;
  npcsPresent?: Array<{ name: string; description: string }>;
}

export function buildScenePrompt(request: SceneIllustrationRequest): string {
  const {
    lastNarratorMessage,
    lastUserAction,
    characterProfile,
    genre,
    currentLocation,
    timeOfDay: overrideTime,
    weather: overrideWeather,
    npcsPresent = [],
  } = request;
  
  const analysis = analyzeScene(lastNarratorMessage, lastUserAction);
  const genreStyle = GENRE_STYLES[genre] || GENRE_STYLES.modern;
  const composition = SCENE_COMPOSITIONS[analysis.sceneType] || SCENE_COMPOSITIONS.exploration;
  
  const timeDescriptions: Record<string, string> = {
    dawn: 'early morning golden hour light, soft warm sunrise',
    day: 'bright daylight, clear visibility',
    dusk: 'dramatic sunset lighting, orange and purple sky',
    night: 'nighttime darkness, moonlight and artificial lights',
  };
  
  const weatherDescriptions: Record<string, string> = {
    rain: 'rain falling, wet surfaces with reflections',
    snow: 'snow falling, frost and ice',
    fog: 'thick fog limiting visibility',
  };
  
  const moodDescriptions: Record<string, string> = {
    tense: 'tense dangerous atmosphere',
    peaceful: 'peaceful calm atmosphere',
    chaotic: 'chaotic frantic scene',
    neutral: '',
  };
  
  const timeDesc = timeDescriptions[overrideTime || analysis.timeOfDay || ''] || '';
  const weatherDesc = weatherDescriptions[overrideWeather || analysis.weather || ''] || '';
  const moodDesc = moodDescriptions[analysis.mood] || '';
  const locationDesc = currentLocation || analysis.location;
  
  const npcDesc = npcsPresent.length > 0
    ? `other characters: ${npcsPresent.map(n => n.description).join(', ')}`
    : '';
  
  // THE KEY: Use exact character profile
  const characterDesc = `PROTAGONIST (${characterProfile.name}): ${characterProfile.fullVisualDescription}, currently ${analysis.characterAction}, ${composition.characterPose}`;
  
  const promptParts = [
    'masterpiece, best quality, highly detailed digital illustration',
    'semi-realistic anime style, dramatic cinematic lighting',
    composition.framing,
    composition.camera,
    characterDesc,
    genreStyle.artStyle,
    `scene: ${analysis.characterAction} in ${locationDesc}`,
    npcDesc,
    `setting: ${locationDesc}`,
    timeDesc,
    weatherDesc,
    moodDesc,
    genreStyle.lighting,
    `color palette: ${genreStyle.colorPalette}`,
    composition.dynamicElements,
    genreStyle.atmosphere[Math.floor(Math.random() * genreStyle.atmosphere.length)],
    analysis.keyVisualElements.join(', '),
    'intricate details, 8k resolution',
  ];
  
  return promptParts.filter(Boolean).join(', ');
}

// ============================================================================
// PORTRAIT PROMPT BUILDER (Uses same profile)
// ============================================================================

export function buildPortraitPrompt(
  characterProfile: CharacterVisualProfile,
  genre: string,
  emotion: string = 'neutral'
): string {
  const genreStyle = GENRE_STYLES[genre] || GENRE_STYLES.modern;
  
  const emotionDescriptions: Record<string, string> = {
    neutral: 'neutral calm expression, steady professional gaze',
    determined: 'determined fierce expression, intense focused eyes',
    combat: 'aggressive combat expression, battle-ready fierce look',
    wounded: 'pained wounded expression, exhausted but resilient',
    confident: 'confident slight smile, self-assured',
    angry: 'angry furious expression, snarling with rage',
    serious: 'serious stoic expression, unreadable professional',
    cold: 'cold emotionless expression, calculating gaze',
    smirk: 'confident smirk, cocky knowing expression',
    happy: 'genuine happy expression, warm smile',
    sad: 'sad melancholic expression, visible sorrow',
  };
  
  const emotionDesc = emotionDescriptions[emotion] || emotionDescriptions.neutral;
  
  return [
    'masterpiece, best quality, highly detailed digital illustration',
    'semi-realistic anime style, dramatic cinematic lighting',
    'portrait, upper body shot, looking at viewer',
    characterProfile.fullVisualDescription,
    emotionDesc,
    genreStyle.artStyle,
    genreStyle.lighting,
    `color palette: ${genreStyle.colorPalette}`,
    `background: ${genreStyle.atmosphere[0]} environment`,
    'detailed face, intricate details, 8k resolution',
  ].filter(Boolean).join(', ');
}
