import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CHARACTER VISUAL PROFILE
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
    length?: string;
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

type InvolvementLevel = 'none' | 'background' | 'participant' | 'focus';

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
// GENRE ENVIRONMENT STYLES (Environment focused)
// ============================================================================

const GENRE_ENVIRONMENT_STYLES: Record<string, {
  artStyle: string;
  environmentFocus: string;
  lighting: string;
  colorPalette: string;
  atmosphericEffects: string[];
  worldDetails: string[];
}> = {
  modern: {
    artStyle: 'photorealistic modern urban, cinematic wide shot',
    environmentFocus: 'urban cityscape, modern architecture, streets and buildings',
    lighting: 'realistic natural lighting with urban light sources',
    colorPalette: 'muted earth tones, concrete grays, urban colors',
    atmosphericEffects: ['city smog', 'street lights', 'traffic', 'crowds'],
    worldDetails: ['vehicles', 'signage', 'power lines', 'construction', 'debris'],
  },
  cyberpunk: {
    artStyle: 'cyberpunk neon noir, wide establishing shot',
    environmentFocus: 'neon-lit megacity streets, towering buildings, urban density',
    lighting: 'neon lighting reflecting on wet surfaces, volumetric light',
    colorPalette: 'neon pinks, electric blues, deep purples, rain-slicked chrome',
    atmosphericEffects: ['neon signs', 'holographic ads', 'rain', 'steam vents'],
    worldDetails: ['flying vehicles', 'screens everywhere', 'crowded streets', 'corporate logos'],
  },
  postapoc: {
    artStyle: 'post-apocalyptic desolation, wide environmental shot',
    environmentFocus: 'ruined civilization, overgrown decay, wasteland vistas',
    lighting: 'harsh sun through dust, orange apocalyptic haze',
    colorPalette: 'rust oranges, dusty browns, faded colors, decay',
    atmosphericEffects: ['dust clouds', 'ash', 'toxic fog', 'fire smoke'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'overgrown plants', 'makeshift shelters'],
  },
  postapocalyptic: {
    artStyle: 'post-apocalyptic desolation, wide environmental shot',
    environmentFocus: 'ruined civilization, overgrown decay, wasteland vistas',
    lighting: 'harsh sun through dust, orange apocalyptic haze',
    colorPalette: 'rust oranges, dusty browns, faded colors, decay',
    atmosphericEffects: ['dust clouds', 'ash', 'toxic fog', 'fire smoke'],
    worldDetails: ['rusted vehicles', 'collapsed buildings', 'overgrown plants', 'makeshift shelters'],
  },
  scifi: {
    artStyle: 'science fiction vista, cinematic wide angle',
    environmentFocus: 'futuristic architecture, advanced technology, alien environments',
    lighting: 'clean technological lighting, holographic glow',
    colorPalette: 'clean whites, metallic silver, holographic blue accents',
    atmosphericEffects: ['energy fields', 'holographic displays', 'ship trails', 'force fields'],
    worldDetails: ['advanced vehicles', 'robots', 'floating platforms', 'energy conduits'],
  },
  ww2: {
    artStyle: '1940s wartime documentary style, wide battlefield shot',
    environmentFocus: 'war-torn European landscape, military installations, battlefields',
    lighting: 'overcast wartime lighting, explosion flashes, fire glow',
    colorPalette: 'desaturated sepia, military olive, mud browns',
    atmosphericEffects: ['smoke', 'explosions', 'fog of war', 'artillery fire'],
    worldDetails: ['tanks', 'trenches', 'destroyed buildings', 'military equipment', 'barbed wire'],
  },
  war: {
    artStyle: 'war photography aesthetic, gritty realism, wide battlefield',
    environmentFocus: 'active battlefield, military positions, combat zones',
    lighting: 'harsh directional light, explosion flashes',
    colorPalette: 'muted greens, browns, grays, fire oranges',
    atmosphericEffects: ['smoke', 'debris', 'explosions', 'battlefield chaos'],
    worldDetails: ['military vehicles', 'fortifications', 'destroyed equipment', 'craters'],
  },
  medieval: {
    artStyle: 'epic fantasy landscape, sweeping wide shot',
    environmentFocus: 'medieval architecture, castles, villages, wilderness',
    lighting: 'dramatic fantasy lighting, torchlight, magical glow',
    colorPalette: 'rich earth tones, stone grays, forest greens, torch orange',
    atmosphericEffects: ['torchlight', 'mist', 'magical particles', 'smoke from chimneys'],
    worldDetails: ['horses', 'carts', 'market stalls', 'banners', 'peasants working'],
  },
  fantasy: {
    artStyle: 'high fantasy epic vista, sweeping landscape',
    environmentFocus: 'magical landscapes, enchanted forests, mystical structures',
    lighting: 'dramatic fantasy lighting, ethereal glow',
    colorPalette: 'rich golds, deep blues, mystical purples',
    atmosphericEffects: ['magic particles', 'mist', 'ethereal glow', 'floating lights'],
    worldDetails: ['magical creatures', 'enchanted objects', 'mystical architecture', 'ancient ruins'],
  },
  horror: {
    artStyle: 'dark horror atmosphere, unsettling wide shot',
    environmentFocus: 'decrepit locations, shadows, twisted environments',
    lighting: 'low-key horror lighting, deep shadows, sickly highlights',
    colorPalette: 'desaturated, sickly greens, blood reds, oppressive darkness',
    atmosphericEffects: ['fog', 'darkness', 'flickering lights', 'decay'],
    worldDetails: ['abandoned objects', 'blood stains', 'broken things', 'unsettling shapes'],
  },
  western: {
    artStyle: 'classic western vista, sweeping landscape',
    environmentFocus: 'dusty frontier towns, desert landscapes, saloons',
    lighting: 'harsh desert sun, golden hour warmth',
    colorPalette: 'warm browns, dusty oranges, sunset reds, weathered wood',
    atmosphericEffects: ['dust', 'tumbleweeds', 'heat haze', 'gun smoke'],
    worldDetails: ['horses', 'wagons', 'wooden buildings', 'cacti', 'hitching posts'],
  },
  noir: {
    artStyle: 'film noir 1940s detective style, moody wide shot',
    environmentFocus: 'rain-slicked city streets, shadowy alleys, dimly lit interiors',
    lighting: 'high contrast, venetian blind shadows',
    colorPalette: 'black and white tones, deep shadows',
    atmosphericEffects: ['rain', 'neon signs', 'cigarette smoke', 'street lamps'],
    worldDetails: ['vintage cars', 'street lamps', 'wet pavement', 'shadows'],
  },
  victorian: {
    artStyle: 'victorian era steampunk, atmospheric wide shot',
    environmentFocus: 'Victorian streets, gaslit architecture, industrial machinery',
    lighting: 'gaslight glow, fog-filtered',
    colorPalette: 'brass and copper, deep burgundy, forest green',
    atmosphericEffects: ['steam', 'fog', 'gaslight', 'chimney smoke'],
    worldDetails: ['carriages', 'factory smoke', 'clockwork', 'ornate buildings'],
  },
  steampunk: {
    artStyle: 'Victorian steampunk, brass and copper, wide vista',
    environmentFocus: 'brass machinery, Victorian industrial, clockwork city',
    lighting: 'warm gaslight, steam-filled',
    colorPalette: 'brass gold, copper, dark wood, leather',
    atmosphericEffects: ['steam', 'gears', 'brass machinery', 'smoke'],
    worldDetails: ['airships', 'clockwork automatons', 'pipes', 'Victorian architecture'],
  },
  zombie: {
    artStyle: 'zombie apocalypse, urban decay, wide environmental',
    environmentFocus: 'abandoned cities, overrun streets, survivor camps',
    lighting: 'overcast grey atmosphere',
    colorPalette: 'desaturated greens, grays, blood reds',
    atmosphericEffects: ['decay', 'abandoned buildings', 'danger', 'fire smoke'],
    worldDetails: ['abandoned cars', 'barricades', 'graffiti', 'shambling figures in distance'],
  },
  pirate: {
    artStyle: 'golden age of piracy, seafaring vista',
    environmentFocus: 'open seas, island harbors, ship decks, port towns',
    lighting: 'tropical sunlight, stormy skies',
    colorPalette: 'ocean blues, weathered wood, gold accents',
    atmosphericEffects: ['sea spray', 'ship rigging', 'tropical clouds', 'cannon smoke'],
    worldDetails: ['sailing ships', 'palm trees', 'treasure', 'dock workers'],
  },
};

// ============================================================================
// SCENE COMPOSITION BY TYPE (Environment primary)
// ============================================================================

const SCENE_COMPOSITIONS: Record<string, {
  framing: string;
  camera: string;
  focus: string;
  characterPlacement: string;
}> = {
  environment: {
    framing: 'wide establishing shot showcasing the environment',
    camera: 'wide angle lens, environment fills frame, deep depth of field',
    focus: 'environment and atmosphere are the subject',
    characterPlacement: 'if visible, small figure in environment showing scale',
  },
  event: {
    framing: 'dynamic wide shot capturing the event unfolding',
    camera: 'action-oriented angle, captures the scope',
    focus: 'the event itself is the subject',
    characterPlacement: 'characters as participants in larger event',
  },
  action: {
    framing: 'dynamic action shot with environment context',
    camera: 'dramatic angle showing both action and surroundings',
    focus: 'the conflict or action within the space',
    characterPlacement: 'characters engaged in action, environment frames them',
  },
  social: {
    framing: 'scene showing social dynamics and setting',
    camera: 'medium-wide shot showing people and place',
    focus: 'the social environment and interactions',
    characterPlacement: 'multiple figures, crowd dynamics',
  },
  personal: {
    framing: 'intimate moment within larger context',
    camera: 'medium shot with environment visible',
    focus: 'emotional moment with environmental storytelling',
    characterPlacement: 'character more prominent but still within world',
  },
  combat: {
    framing: 'dynamic combat scene with environment context',
    camera: 'dramatic angle capturing conflict and surroundings',
    focus: 'the battle within the environment',
    characterPlacement: 'combatants active, environment as battleground',
  },
  exploration: {
    framing: 'establishing shot showing location',
    camera: 'wide angle with environment as subject',
    focus: 'the location and its atmosphere',
    characterPlacement: 'small figure if visible, emphasizing scale',
  },
};

// ============================================================================
// PLAYER VISIBILITY BY INVOLVEMENT LEVEL
// ============================================================================

const PLAYER_VISIBILITY: Record<InvolvementLevel, {
  include: boolean;
  prominence: string;
  detail: string;
}> = {
  none: {
    include: false,
    prominence: 'not visible in frame',
    detail: 'player character is not in this scene',
  },
  background: {
    include: true,
    prominence: 'in background or edge of frame, not the focus',
    detail: 'recognizable but not detailed, part of the scene',
  },
  participant: {
    include: true,
    prominence: 'in midground, one of several elements',
    detail: 'visible and identifiable, sharing focus with environment',
  },
  focus: {
    include: true,
    prominence: 'in foreground, but environment still visible',
    detail: 'detailed and clear, but world context maintained',
  },
};

// ============================================================================
// INVOLVEMENT DETECTION
// ============================================================================

function detectPlayerInvolvement(narratorMessage: string, userAction: string): {
  level: InvolvementLevel;
  action: string | null;
  position: 'foreground' | 'midground' | 'background' | 'not_visible';
} {
  const narratorLower = narratorMessage.toLowerCase();
  const actionLower = userAction.toLowerCase();
  
  // NONE: Player is observing, not present
  const noneIndicators = [
    'you see in the distance', 'you notice from afar', 'you watch as',
    'you observe', 'from your vantage', 'you hear', 'somewhere nearby',
    'in another room', 'meanwhile', 'elsewhere', 'you remain hidden',
    'you stay back', 'you keep your distance',
  ];
  
  if (noneIndicators.some(ind => narratorLower.includes(ind))) {
    return { level: 'none', action: null, position: 'not_visible' };
  }
  
  const passiveActions = [
    'i watch', 'i look', 'i observe', 'i wait', 'i listen', 'i hide',
    'i stay', 'i remain', 'look around', 'survey', 'examine from',
  ];
  
  if (passiveActions.some(pa => actionLower.includes(pa))) {
    return { level: 'none', action: 'observing', position: 'not_visible' };
  }
  
  // FOCUS: Deeply personal moments
  const focusIndicators = [
    'you collapse', 'you fall to your knees', 'pain overwhelms',
    'you realize', 'tears', 'you scream', 'death', 'dying',
    'you hold the', 'you clutch', 'your vision', 'you feel yourself',
  ];
  
  if (focusIndicators.some(ind => narratorLower.includes(ind))) {
    const actionMatch = userAction.match(/^i\s+(.+?)(?:\.|$)/i);
    return { level: 'focus', action: actionMatch?.[1] || 'experiencing', position: 'foreground' };
  }
  
  // PARTICIPANT: Active engagement
  const participantIndicators = [
    'you attack', 'you fire', 'you shoot', 'you strike', 'you fight',
    'you say', 'you speak', 'you ask', 'you tell', 'you shout',
    'you grab', 'you take', 'you pick up', 'you open', 'you use',
    'you help', 'you push', 'you pull', 'you throw', 'you dodge',
    'you run', 'you sprint', 'you jump', 'you climb', 'you dive',
  ];
  
  const participantActions = [
    'i attack', 'i shoot', 'i fire', 'i fight', 'i strike',
    'i say', 'i speak', 'i ask', 'i tell', 'i talk',
    'i grab', 'i take', 'i use', 'i open', 'i help',
    'i run', 'i sprint', 'i dodge', 'i jump', 'i throw',
  ];
  
  if (participantIndicators.some(ind => narratorLower.includes(ind)) ||
      participantActions.some(pa => actionLower.includes(pa))) {
    const actionMatch = userAction.match(/^i\s+(.+?)(?:\.|$)/i);
    return { level: 'participant', action: actionMatch?.[1] || 'engaging', position: 'midground' };
  }
  
  // BACKGROUND: Player present but not the focus
  const backgroundIndicators = [
    'you walk', 'you move through', 'you pass by', 'you enter', 'you exit',
    'you stand', 'you sit', 'you lean', 'around you', 'you find yourself',
    'you make your way', 'you continue', 'you head', 'you approach',
  ];
  
  if (backgroundIndicators.some(ind => narratorLower.includes(ind))) {
    const actionMatch = userAction.match(/^i\s+(.+?)(?:\.|$)/i);
    return { level: 'background', action: actionMatch?.[1] || 'moving through', position: 'background' };
  }
  
  // Default: background presence
  return { level: 'background', action: 'present', position: 'background' };
}

// ============================================================================
// SCENE TYPE DETECTION
// ============================================================================

function detectSceneType(narratorMessage: string, userAction: string): string {
  const context = `${narratorMessage} ${userAction}`.toLowerCase();
  
  const personalIndicators = ['you feel', 'you realize', 'memory', 'you remember', 'emotion', 'tears', 'heart'];
  if (personalIndicators.some(ind => context.includes(ind))) return 'personal';
  
  const combatIndicators = ['fight', 'attack', 'shoot', 'fire', 'strike', 'battle', 'combat', 'explosion', 'tank', 'shell'];
  if (combatIndicators.some(ind => context.includes(ind))) return 'combat';
  
  const actionIndicators = ['run', 'jump', 'climb', 'dodge', 'chase', 'escape'];
  if (actionIndicators.some(ind => context.includes(ind))) return 'action';
  
  const socialIndicators = ['says', 'speaks', 'asks', 'tells', 'conversation', 'crowd', 'people', 'gather'];
  if (socialIndicators.some(ind => context.includes(ind))) return 'social';
  
  const eventIndicators = ['suddenly', 'alarm', 'sirens', 'commotion', 'happening'];
  if (eventIndicators.some(ind => context.includes(ind))) return 'event';
  
  return 'environment';
}

// ============================================================================
// WORLD ELEMENTS EXTRACTION
// ============================================================================

function extractWorldElements(narratorMessage: string): {
  worldEvent: string;
  environmentDetails: string[];
  activeElements: string[];
} {
  const worldEventPatterns = [
    /(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:is|are)\s+(\w+ing[^.]*)/gi,
    /(?:around you,?\s*)([^.]+)/gi,
    /(?:in the distance,?\s*)([^.]+)/gi,
  ];
  
  const activeElements: string[] = [];
  let worldEvent = 'the scene unfolds';
  
  for (const pattern of worldEventPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      if (match[1] && !match[1].toLowerCase().includes('you')) {
        activeElements.push(match[0].trim());
        if (worldEvent === 'the scene unfolds') {
          worldEvent = match[0];
        }
      }
    }
  }
  
  const environmentDetails: string[] = [];
  const envPatterns = [
    /(?:the\s+)?(street|road|building|room|corridor|sky|rain|fog|smoke|fire|lights?|shadows?|walls?)[^,.]*/gi,
    /(?:broken|ruined|destroyed|abandoned|empty|crowded|busy|quiet|dark|bright|wet|dusty)[^,.]*/gi,
  ];
  
  for (const pattern of envPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      environmentDetails.push(match[0].trim());
    }
  }
  
  return {
    worldEvent,
    environmentDetails: [...new Set(environmentDetails)].slice(0, 5),
    activeElements: [...new Set(activeElements)].slice(0, 4),
  };
}

// ============================================================================
// LOCATION ANALYSIS
// ============================================================================

function analyzeLocation(narratorMessage: string, currentLocation?: string): {
  type: string;
  specific: string;
  scale: string;
} {
  const context = narratorMessage.toLowerCase();
  
  let type = 'exterior';
  if (/\b(room|building|interior|inside|corridor|hallway|office|bunker|shelter)\b/.test(context)) {
    type = 'interior';
  } else if (/\b(car|truck|vehicle|tank|ship|plane|helicopter)\b/.test(context)) {
    type = 'vehicle';
  }
  
  let specific = currentLocation || 'the scene';
  const locMatch = narratorMessage.match(/(?:in|at|inside|outside|through)\s+(?:the|a)?\s*([^,.!?]+)/i);
  if (locMatch) specific = locMatch[1].trim();
  
  let scale = 'street';
  if (/\b(vast|sprawling|city|district|horizon|landscape|wasteland)\b/.test(context)) {
    scale = 'landscape';
  } else if (/\b(building|warehouse|facility)\b/.test(context)) {
    scale = 'building';
  } else if (/\b(room|office|cell|chamber)\b/.test(context)) {
    scale = 'room';
  }
  
  return { type, specific, scale };
}

// ============================================================================
// ATMOSPHERE ANALYSIS
// ============================================================================

function analyzeAtmosphere(narratorMessage: string, timeOverride?: string, weatherOverride?: string): {
  timeOfDay: string | null;
  weather: string | null;
  mood: string;
  lighting: string;
} {
  const context = narratorMessage.toLowerCase();
  
  let timeOfDay: string | null = timeOverride || null;
  if (!timeOfDay) {
    if (/\b(dawn|sunrise|morning)\b/.test(context)) timeOfDay = 'dawn';
    else if (/\b(noon|midday|afternoon)\b/.test(context)) timeOfDay = 'day';
    else if (/\b(dusk|sunset|evening|twilight)\b/.test(context)) timeOfDay = 'dusk';
    else if (/\b(night|dark|midnight)\b/.test(context)) timeOfDay = 'night';
  }
  
  let weather: string | null = weatherOverride || null;
  if (!weather) {
    if (/\b(rain|raining|storm)\b/.test(context)) weather = 'rain';
    else if (/\b(snow|snowing|blizzard)\b/.test(context)) weather = 'snow';
    else if (/\b(fog|mist|haze)\b/.test(context)) weather = 'fog';
  }
  
  let mood = 'neutral';
  if (/\b(tense|danger|threat|ominous)\b/.test(context)) mood = 'tense';
  else if (/\b(peaceful|calm|quiet)\b/.test(context)) mood = 'peaceful';
  else if (/\b(chaos|frantic)\b/.test(context)) mood = 'chaotic';
  else if (/\b(eerie|creepy|unsettling)\b/.test(context)) mood = 'eerie';
  else if (/\b(busy|bustling|crowded)\b/.test(context)) mood = 'busy';
  else if (/\b(empty|desolate|abandoned)\b/.test(context)) mood = 'desolate';
  
  let lighting = 'natural ambient lighting';
  if (timeOfDay === 'night') lighting = 'nighttime darkness with scattered light sources';
  else if (timeOfDay === 'dawn') lighting = 'soft golden morning light';
  else if (timeOfDay === 'dusk') lighting = 'warm orange sunset light with long shadows';
  else if (weather === 'fog') lighting = 'diffused foggy lighting';
  else if (weather === 'rain') lighting = 'overcast gray light, wet reflections';
  else if (mood === 'tense') lighting = 'harsh dramatic shadows';
  
  return { timeOfDay, weather, mood, lighting };
}

// ============================================================================
// EXTRACT NPC ACTIVITY
// ============================================================================

function extractNPCActivity(narratorMessage: string, knownNPCs?: Array<{ name: string; description: string; currentActivity?: string }>): Array<{
  description: string;
  action: string;
  prominence: string;
}> {
  const npcs: Array<{ description: string; action: string; prominence: string }> = [];
  
  const npcPatterns = [
    /(?:the\s+)?(\w+)\s+(?:is|stands?|sits?|walks?|runs?|speaks?|says?|looks?|watches?)\s+([^.]+)/gi,
    /(?:a|an|the)\s+(soldier|guard|civilian|man|woman|figure|person|stranger|officer)\s+([^.]+)/gi,
  ];
  
  for (const pattern of npcPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      const name = match[1];
      const action = match[2] || match[0];
      
      if (name.toLowerCase() === 'you' || name.toLowerCase() === 'your') continue;
      
      let prominence = 'midground';
      if (action.length > 30 || narratorMessage.indexOf(match[0]) < 50) {
        prominence = 'foreground';
      } else if (narratorMessage.indexOf(match[0]) > narratorMessage.length * 0.7) {
        prominence = 'background';
      }
      
      npcs.push({ description: name, action: action.trim(), prominence });
    }
  }
  
  // Add known NPCs if mentioned
  if (knownNPCs) {
    for (const npc of knownNPCs) {
      if (narratorMessage.toLowerCase().includes(npc.name.toLowerCase())) {
        const existing = npcs.find(n => n.description.toLowerCase() === npc.name.toLowerCase());
        if (!existing) {
          npcs.push({
            description: npc.description || npc.name,
            action: npc.currentActivity || 'present',
            prominence: 'midground',
          });
        }
      }
    }
  }
  
  return npcs.slice(0, 4);
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
    pale: 'pale fair skin', light: 'light skin tone', medium: 'medium skin tone',
    tan: 'tanned skin', olive: 'olive skin tone', brown: 'brown skin tone', dark: 'dark skin tone',
  };
  
  const hairColorDescriptions: Record<string, string> = {
    black: 'jet black hair', brown: 'brown hair', darkBrown: 'dark brown hair',
    blonde: 'blonde hair', red: 'red auburn hair', white: 'white silver hair', gray: 'gray hair',
  };
  
  const hairStyleDescriptions: Record<string, string> = {
    short: 'short cropped hair', military: 'military buzz cut', shaved: 'shaved bald head',
    long: 'long flowing hair', ponytail: 'hair tied in tactical ponytail', messy: 'messy unkempt hair',
  };
  
  const eyeColorDescriptions: Record<string, string> = {
    brown: 'deep brown eyes', blue: 'bright blue eyes', green: 'striking green eyes',
    hazel: 'hazel eyes', gray: 'steel gray eyes',
  };
  
  const roleAppearances: Record<string, string> = {
    soldier: 'wearing military tactical gear, combat vest, armed',
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
    ? 'woman with feminine features' : char.gender === 'male' ? 'man with masculine features' : 'person';
  
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
// MAIN PROMPT BUILDER (ENVIRONMENT FIRST)
// ============================================================================

function buildWorldIllustrationPrompt(
  request: SceneImageRequest,
  characterProfile: CharacterVisualProfile | null
): string {
  const genre = request.genre || request.style || 'fantasy';
  const narratorMessage = request.lastNarratorMessage || request.sceneDescription || '';
  const userAction = request.lastUserAction || request.playerAction || '';
  
  // Get genre style
  const genreStyle = GENRE_ENVIRONMENT_STYLES[genre.toLowerCase()] || GENRE_ENVIRONMENT_STYLES.fantasy;
  
  // Detect player involvement
  const involvement = detectPlayerInvolvement(narratorMessage, userAction);
  console.log('Player involvement:', involvement.level);
  
  // Detect scene type
  const sceneType = detectSceneType(narratorMessage, userAction);
  const composition = SCENE_COMPOSITIONS[sceneType] || SCENE_COMPOSITIONS.environment;
  
  // Get player visibility
  const playerVis = PLAYER_VISIBILITY[involvement.level];
  
  // Extract world elements
  const worldElements = extractWorldElements(narratorMessage);
  
  // Analyze location
  const location = analyzeLocation(narratorMessage, request.currentLocation);
  
  // Analyze atmosphere
  const atmosphere = analyzeAtmosphere(narratorMessage, request.timeOfDay, request.weather);
  
  // Extract NPCs
  const npcs = extractNPCActivity(narratorMessage, request.npcsPresent);
  
  // Build environment description (PRIMARY FOCUS)
  const environmentDesc = [
    genreStyle.environmentFocus,
    `setting: ${location.specific}`,
    location.type === 'interior' ? 'interior space' : 'exterior environment',
    `scale: ${location.scale} view`,
    worldElements.environmentDetails.slice(0, 3).join(', '),
  ].filter(Boolean).join(', ');
  
  // Build atmosphere description
  const atmosphereDesc = [
    atmosphere.lighting,
    atmosphere.timeOfDay ? `${atmosphere.timeOfDay} time` : '',
    atmosphere.weather ? `${atmosphere.weather} weather` : '',
    `${atmosphere.mood} mood`,
    genreStyle.atmosphericEffects[Math.floor(Math.random() * genreStyle.atmosphericEffects.length)],
  ].filter(Boolean).join(', ');
  
  // Build world activity
  const worldActivityDesc = [
    worldElements.worldEvent,
    worldElements.activeElements.slice(0, 2).join(', '),
    genreStyle.worldDetails[Math.floor(Math.random() * genreStyle.worldDetails.length)],
  ].filter(Boolean).join(', ');
  
  // Build NPC descriptions
  const npcDesc = npcs.length > 0
    ? npcs.map(npc => `${npc.prominence}: ${npc.description} ${npc.action}`).join(', ')
    : '';
  
  // Build player description ONLY if involved
  let playerDesc = '';
  if (playerVis.include && characterProfile && involvement.action) {
    let charDesc = '';
    
    if (involvement.level === 'background') {
      // Minimal description
      charDesc = `distant figure, ${characterProfile.gender}, ${characterProfile.hair.color} hair, ${characterProfile.roleAppearance.split(',')[0]}`;
    } else if (involvement.level === 'participant') {
      // Medium description
      charDesc = `${characterProfile.gender}, ${characterProfile.physicalDescription.build}, ${characterProfile.hair.color} ${characterProfile.hair.style}, ${characterProfile.roleAppearance}`;
    } else if (involvement.level === 'focus') {
      // Full description
      charDesc = characterProfile.fullVisualDescription;
    }
    
    playerDesc = `${playerVis.prominence}: ${charDesc}, ${involvement.action}`;
  }
  
  // Assemble prompt with ENVIRONMENT FIRST
  const promptParts = [
    'masterpiece, best quality, highly detailed digital illustration',
    'photorealistic style, dramatic cinematic lighting, 8k resolution',
    genreStyle.artStyle,
    composition.framing,
    composition.camera,
    composition.focus,
    
    // ENVIRONMENT FIRST (primary subject)
    `PRIMARY FOCUS - ENVIRONMENT: ${environmentDesc}`,
    
    // World activity
    worldActivityDesc ? `WORLD ACTIVITY: ${worldActivityDesc}` : '',
    
    // Atmosphere
    `ATMOSPHERE: ${atmosphereDesc}`,
    genreStyle.lighting,
    `color palette: ${genreStyle.colorPalette}`,
    
    // NPCs (often more prominent than player)
    npcDesc ? `OTHER CHARACTERS: ${npcDesc}` : '',
    
    // Player LAST and only if involved
    playerDesc ? `PLAYER (${playerVis.prominence}): ${playerDesc}` : '',
    playerVis.include ? composition.characterPlacement : 'no player character visible in frame',
    
    // Final quality
    'cinematic composition, environmental storytelling, intricate world details',
  ];
  
  const positive = promptParts.filter(Boolean).join(', ');
  const negative = 'blurry, low quality, text, watermark, signature, UI elements, amateur, wrong era, cartoon, anime, illustration';
  
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
    
    // Ensure we have the messages in the request
    requestData.lastNarratorMessage = lastNarratorMessage;
    requestData.lastUserAction = lastUserAction;

    console.log('Scene generation request:', {
      genre: requestData.genre,
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
    
    // Build the world-focused prompt
    const imagePrompt = buildWorldIllustrationPrompt(requestData, characterProfile);

    console.log('Final prompt preview:', imagePrompt.slice(0, 600) + '...');

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
