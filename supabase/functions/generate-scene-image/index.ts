import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CHARACTER VISUAL PROFILE (matches frontend type)
// ============================================================================

interface CharacterVisualProfile {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  physicalDescription: {
    build: string;
    skinTone: string;
  };
  hair: {
    color: string;
    style: string;
    length: string;
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

interface StoryMessage {
  role: 'narrator' | 'user' | 'system';
  content: string;
}

interface SceneImageRequest {
  // Primary context
  lastNarratorMessage?: string;
  lastUserAction?: string;
  messageHistory?: StoryMessage[];
  
  // NEW: Full character visual profile
  characterProfile?: CharacterVisualProfile;
  
  // Campaign context
  genre?: string;
  era?: string;
  
  // Location/atmosphere
  currentLocation?: string;
  timeOfDay?: string;
  weather?: string;
  
  // NPCs in scene
  npcsPresent?: Array<{ name: string; description: string }>;
  
  // Legacy fields
  playerCharacter?: {
    name?: string;
    gender?: string;
    role?: string;
    build?: string;
    hairColor?: string;
    hairStyle?: string;
    skinTone?: string;
    eyeColor?: string;
    details?: string[];
  };
  sceneDescription?: string;
  recentStory?: string[];
  playerAction?: string;
  style?: string;
}

// ============================================================================
// GENRE VISUAL STYLES
// ============================================================================

const GENRE_STYLES: Record<string, {
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
  postapocalyptic: {
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
  war: {
    artStyle: 'war photography aesthetic, gritty realism',
    lighting: 'harsh directional light, explosion flashes',
    colorPalette: 'muted greens, browns, grays, fire oranges',
    atmosphere: ['smoke', 'debris', 'explosions', 'battlefield chaos'],
    equipment: 'military gear, period-appropriate weapons',
  },
  medieval: {
    artStyle: 'medieval fantasy epic, swords and sorcery',
    lighting: 'dramatic fantasy lighting, torchlight, magical glow',
    colorPalette: 'rich golds, deep reds, royal purples, forest greens',
    atmosphere: ['torchlight flicker', 'magical particles', 'mist'],
    equipment: 'plate armor, chainmail, swords, shields',
  },
  fantasy: {
    artStyle: 'high fantasy epic, magical world',
    lighting: 'dramatic fantasy lighting, ethereal glow',
    colorPalette: 'rich golds, deep blues, mystical purples',
    atmosphere: ['magic particles', 'mist', 'ethereal glow'],
    equipment: 'enchanted armor, magical weapons',
  },
  horror: {
    artStyle: 'dark horror aesthetic, survival horror',
    lighting: 'low key lighting, deep shadows',
    colorPalette: 'desaturated colors, sickly greens, blood reds',
    atmosphere: ['fog', 'darkness', 'blood', 'decay'],
    equipment: 'bloodied clothing, improvised weapons',
  },
  western: {
    artStyle: 'wild west frontier aesthetic, dusty towns',
    lighting: 'harsh desert sun, golden hour',
    colorPalette: 'warm browns, dusty oranges, sunset reds',
    atmosphere: ['dust', 'tumbleweeds', 'heat haze', 'gun smoke'],
    equipment: 'cowboy hat, duster coat, revolvers',
  },
  noir: {
    artStyle: 'film noir 1940s detective style',
    lighting: 'high contrast, venetian blind shadows',
    colorPalette: 'black and white tones, deep shadows',
    atmosphere: ['rain', 'neon signs', 'cigarette smoke'],
    equipment: 'fedora, trench coat, pistol',
  },
  victorian: {
    artStyle: 'victorian era steampunk elements',
    lighting: 'gaslight glow, fog-filtered',
    colorPalette: 'brass and copper, deep burgundy, forest green',
    atmosphere: ['steam', 'fog', 'gaslight'],
    equipment: 'Victorian fashion, clockwork gadgets',
  },
  steampunk: {
    artStyle: 'Victorian steampunk, brass and copper',
    lighting: 'warm gaslight, steam-filled',
    colorPalette: 'brass gold, copper, dark wood, leather',
    atmosphere: ['steam', 'gears', 'brass machinery'],
    equipment: 'brass machinery, Victorian fashion, goggles',
  },
  zombie: {
    artStyle: 'zombie apocalypse, urban decay',
    lighting: 'overcast grey atmosphere',
    colorPalette: 'desaturated greens, grays, blood reds',
    atmosphere: ['decay', 'abandoned buildings', 'danger'],
    equipment: 'survival gear, improvised weapons',
  },
  pirate: {
    artStyle: 'golden age of piracy, seafaring',
    lighting: 'tropical sunlight, stormy skies',
    colorPalette: 'ocean blues, weathered wood, gold',
    atmosphere: ['sea spray', 'ship rigging', 'tropical islands'],
    equipment: 'pirate attire, cutlass, flintlock',
  },
};

// ============================================================================
// SCENE COMPOSITIONS
// ============================================================================

const SCENE_COMPOSITIONS: Record<string, {
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
    camera: 'over-the-shoulder or hidden vantage point',
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
    camera: 'wide angle with character as focal point',
    characterPose: 'walking or standing observant, taking in surroundings',
    dynamicElements: 'detailed environment, atmospheric effects',
  },
  emotional: {
    framing: 'intimate medium shot showing emotion',
    camera: 'eye-level or slightly low',
    characterPose: 'showing clear emotion, expressive face',
    dynamicElements: 'atmospheric lighting matching mood',
  },
  action: {
    framing: 'high-energy action shot capturing movement',
    camera: 'dynamic angle following action',
    characterPose: 'mid-action, dynamic pose',
    dynamicElements: 'motion effects, environment interaction',
  },
};

// ============================================================================
// SCENE ANALYSIS
// ============================================================================

function analyzeScene(narratorMessage: string, userAction: string): {
  sceneType: string;
  characterAction: string;
  location: string;
  timeOfDay: string | null;
  weather: string | null;
  mood: string;
} {
  const fullContext = `${narratorMessage} ${userAction}`;
  const lowerContext = fullContext.toLowerCase();
  
  // Scene type detection
  let sceneType = 'exploration';
  const combatWords = ['fight', 'attack', 'shoot', 'fire', 'strike', 'slash', 'battle', 'combat', 'bullets', 'explosion', 'kill', 'wound', 'duck', 'cover', 'reload', 'tank', 'shell'];
  const stealthWords = ['sneak', 'hide', 'creep', 'shadow', 'silent', 'quiet', 'crouch', 'observe', 'spy'];
  const dialogueWords = ['say', 'speak', 'talk', 'ask', 'tell', 'discuss', 'negotiate', 'shout', 'whisper'];
  const emotionalWords = ['cry', 'laugh', 'smile', 'fear', 'anger', 'joy', 'sad', 'grief', 'relief', 'shock'];
  const actionWords = ['run', 'jump', 'climb', 'dodge', 'grab', 'throw', 'kick', 'break', 'smash'];
  
  if (combatWords.some(w => lowerContext.includes(w))) sceneType = 'combat';
  else if (stealthWords.some(w => lowerContext.includes(w))) sceneType = 'stealth';
  else if (dialogueWords.some(w => lowerContext.includes(w))) sceneType = 'dialogue';
  else if (emotionalWords.some(w => lowerContext.includes(w))) sceneType = 'emotional';
  else if (actionWords.some(w => lowerContext.includes(w))) sceneType = 'action';
  
  // Extract character action
  let characterAction = userAction.replace(/^i /i, '').trim();
  const youMatch = narratorMessage.match(/you\s+([^.!?]+)/i);
  if (youMatch) characterAction = youMatch[1].trim();
  
  // Location
  let location = 'the scene';
  const locationMatch = fullContext.match(/(?:in|inside|at|near|through)\s+(?:the|a)?\s*([^,.!?]+)/i);
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
  
  return { sceneType, characterAction, location, timeOfDay, weather, mood };
}

// ============================================================================
// LEGACY CHARACTER PROFILE BUILDER
// ============================================================================

function buildLegacyCharacterProfile(char: SceneImageRequest['playerCharacter']): CharacterVisualProfile | null {
  if (!char || !char.name) return null;
  
  const buildDescriptions: Record<string, string> = {
    athletic: 'athletic muscular build with toned physique',
    lean: 'lean agile build with wiry muscles',
    muscular: 'heavily muscular imposing build',
    stocky: 'stocky sturdy build',
    slim: 'slim slender build',
    average: 'average build',
  };
  
  const skinToneDescriptions: Record<string, string> = {
    pale: 'pale fair skin',
    light: 'light skin tone',
    medium: 'medium skin tone',
    tan: 'tanned skin',
    olive: 'olive skin tone',
    brown: 'brown skin tone',
    dark: 'dark skin tone',
  };
  
  const hairColorDescriptions: Record<string, string> = {
    black: 'jet black hair',
    brown: 'brown hair',
    darkBrown: 'dark brown hair',
    blonde: 'blonde hair',
    red: 'red auburn hair',
    white: 'white silver hair',
    gray: 'gray hair',
  };
  
  const hairStyleDescriptions: Record<string, string> = {
    short: 'short cropped hair',
    military: 'military buzz cut',
    shaved: 'shaved bald head',
    long: 'long flowing hair',
    ponytail: 'hair tied in tactical ponytail',
    messy: 'messy unkempt hair',
  };
  
  const eyeColorDescriptions: Record<string, string> = {
    brown: 'deep brown eyes',
    blue: 'bright blue eyes',
    green: 'striking green eyes',
    hazel: 'hazel eyes',
    gray: 'steel gray eyes',
  };
  
  const roleAppearances: Record<string, string> = {
    soldier: 'wearing military tactical gear, combat vest, armed with assault rifle',
    medic: 'wearing combat medic gear with red cross armband',
    sniper: 'wearing ghillie suit elements and camouflage',
    heavy: 'wearing heavy reinforced armor with machine gun',
    tank: 'wearing tanker jacket with oil stains, tanker helmet with goggles',
    pilot: 'wearing flight suit with patches',
    officer: 'wearing decorated officer uniform with rank insignia',
    knight: 'wearing ornate plate armor',
    rogue: 'wearing dark leather armor',
    mage: 'wearing armored battle robes',
    survivor: 'wearing scavenged makeshift armor',
  };
  
  const details = char.details || [];
  const facialFeatures: CharacterVisualProfile['facialFeatures'] = {};
  if (details.includes('scars')) facialFeatures.scars = 'visible battle scars on face';
  if (details.includes('tattoos')) facialFeatures.tattoos = 'military tattoos visible';
  if (details.includes('beard')) facialFeatures.beard = 'tactical beard with stubble';
  else facialFeatures.beard = 'clean shaven';
  
  const modifications: CharacterVisualProfile['modifications'] = {};
  if (details.includes('cybernetics')) modifications.cybernetics = 'visible cybernetic augmentations';
  if (details.includes('eyepatch')) modifications.other = 'eye patch over one eye';
  
  const buildDesc = buildDescriptions[char.build || 'athletic'] || 'athletic build';
  const skinDesc = skinToneDescriptions[char.skinTone || 'medium'] || 'medium skin tone';
  const hairColorDesc = hairColorDescriptions[char.hairColor || 'brown'] || 'brown hair';
  const hairStyleDesc = hairStyleDescriptions[char.hairStyle || 'short'] || 'short hair';
  const eyeColorDesc = eyeColorDescriptions[char.eyeColor || 'brown'] || 'brown eyes';
  const roleAppearance = roleAppearances[char.role || 'soldier'] || 'wearing tactical gear';
  
  const genderDesc = char.gender === 'female' 
    ? 'woman with feminine features and beautiful face'
    : char.gender === 'male'
    ? 'man with masculine features and strong jawline'
    : 'person';
  
  const facialFeaturesDesc = Object.values(facialFeatures).filter(Boolean).join(', ');
  const modificationsDesc = Object.values(modifications).filter(Boolean).join(', ');
  
  const fullVisualDescription = [
    genderDesc,
    buildDesc,
    skinDesc,
    `${hairColorDesc} in ${hairStyleDesc}`,
    eyeColorDesc,
    facialFeaturesDesc,
    modificationsDesc,
    roleAppearance,
  ].filter(Boolean).join(', ');
  
  return {
    name: char.name,
    gender: (char.gender as 'male' | 'female' | 'nonbinary') || 'male',
    physicalDescription: { build: buildDesc, skinTone: skinDesc },
    hair: { color: hairColorDesc, style: hairStyleDesc, length: 'short' },
    eyes: { color: eyeColorDesc },
    facialFeatures,
    modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
    role: char.role || 'soldier',
    roleAppearance,
    fullVisualDescription,
  };
}

// ============================================================================
// MAIN PROMPT BUILDER
// ============================================================================

function buildImagePrompt(
  sceneDescription: string,
  characterProfile: CharacterVisualProfile | null,
  genre: string,
  sceneAnalysis: ReturnType<typeof analyzeScene>,
  locationOverride?: string,
  timeOverride?: string,
  weatherOverride?: string,
  npcs?: Array<{ name: string; description: string }>
): string {
  const genreStyle = GENRE_STYLES[genre.toLowerCase()] || GENRE_STYLES.fantasy;
  const composition = SCENE_COMPOSITIONS[sceneAnalysis.sceneType] || SCENE_COMPOSITIONS.exploration;
  
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
  
  const timeDesc = timeDescriptions[timeOverride || sceneAnalysis.timeOfDay || ''] || '';
  const weatherDesc = weatherDescriptions[weatherOverride || sceneAnalysis.weather || ''] || '';
  const moodDesc = moodDescriptions[sceneAnalysis.mood] || '';
  const locationDesc = locationOverride || sceneAnalysis.location;
  
  // NPC descriptions
  const npcDesc = npcs && npcs.length > 0
    ? `other characters: ${npcs.map(n => n.description).join(', ')}`
    : '';
  
  // CHARACTER DESCRIPTION - THE KEY TO CONSISTENCY
  let characterDesc = '';
  if (characterProfile) {
    characterDesc = `PROTAGONIST (${characterProfile.name}): ${characterProfile.fullVisualDescription}, currently ${sceneAnalysis.characterAction}, ${composition.characterPose}`;
  }
  
  const promptParts = [
    // Quality
    'masterpiece, best quality, highly detailed digital illustration',
    'semi-realistic anime style, dramatic cinematic lighting',
    '8k resolution, professional concept art',
    
    // Composition
    composition.framing,
    composition.camera,
    
    // THE CHARACTER (most important for consistency!)
    characterDesc,
    
    // Genre styling
    genreStyle.artStyle,
    genreStyle.lighting,
    `color palette: ${genreStyle.colorPalette}`,
    
    // Scene
    `scene: ${sceneDescription}`,
    
    // NPCs
    npcDesc,
    
    // Environment
    `setting: ${locationDesc}`,
    timeDesc,
    weatherDesc,
    moodDesc,
    
    // Dynamic elements
    composition.dynamicElements,
    genreStyle.atmosphere[Math.floor(Math.random() * genreStyle.atmosphere.length)],
    
    // Final quality
    'intricate details, cinematic composition',
  ];
  
  const positive = promptParts.filter(Boolean).join(', ');
  const negative = 'blurry, low quality, text, watermark, signature, UI elements, amateur, wrong era, anachronistic elements';
  
  return `${positive}\n\nNegative: ${negative}`;
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
    
    if (!TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY is not configured');
    }

    const genre = requestData.genre || requestData.style || 'fantasy';
    const location = requestData.currentLocation;
    const timeOfDay = requestData.timeOfDay;
    const weather = requestData.weather;
    
    // Get story context
    let lastNarratorMessage = requestData.lastNarratorMessage || '';
    let lastUserAction = requestData.lastUserAction || requestData.playerAction || '';
    
    // Handle legacy format
    if (!lastNarratorMessage && requestData.recentStory && requestData.recentStory.length > 0) {
      lastNarratorMessage = requestData.recentStory[requestData.recentStory.length - 1] || '';
    }
    if (!lastNarratorMessage && requestData.sceneDescription) {
      lastNarratorMessage = requestData.sceneDescription;
    }

    console.log('Scene generation request:', {
      genre,
      hasNarratorMessage: !!lastNarratorMessage,
      hasUserAction: !!lastUserAction,
      hasCharacterProfile: !!requestData.characterProfile,
      hasLegacyCharacter: !!requestData.playerCharacter,
    });

    // Get character profile (prefer new format, fall back to legacy)
    const characterProfile = requestData.characterProfile || buildLegacyCharacterProfile(requestData.playerCharacter);
    
    if (characterProfile) {
      console.log('Using character profile:', characterProfile.fullVisualDescription.slice(0, 100) + '...');
    }
    
    // Analyze the scene
    const sceneAnalysis = analyzeScene(lastNarratorMessage, lastUserAction);
    console.log('Scene analysis:', sceneAnalysis);
    
    // Build final prompt
    const imagePrompt = buildImagePrompt(
      lastNarratorMessage,
      characterProfile,
      genre,
      sceneAnalysis,
      location,
      timeOfDay,
      weather,
      requestData.npcsPresent
    );

    console.log('Final prompt preview:', imagePrompt.slice(0, 500) + '...');

    // Generate image with FLUX
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1.1-pro',
        prompt: imagePrompt,
        width: 1408,
        height: 800,
        steps: 28,
        n: 1,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together.AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded', imageUrl: null }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402 || response.status === 401) {
        return new Response(JSON.stringify({ error: 'API limit reached', imageUrl: null }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Image API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scene image generated successfully');
    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-scene-image:', error);
    return new Response(JSON.stringify({ 
      error: 'Unable to generate scene image',
      imageUrl: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
