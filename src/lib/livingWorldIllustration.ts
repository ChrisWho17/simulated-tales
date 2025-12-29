// ============================================================================
// LIVING WORLD ILLUSTRATION SYSTEM
// The world is the focus. The player exists within it, not at its center.
// ============================================================================

import { useState, useCallback } from 'react';

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

export type InvolvementLevel = 'none' | 'background' | 'participant' | 'focus';

export interface SceneAnalysis {
  sceneType: 'environment' | 'event' | 'action' | 'social' | 'personal';
  playerInvolvement: InvolvementLevel;
  primarySubject: string;
  worldEvent: string;
  location: {
    type: 'interior' | 'exterior' | 'vehicle' | 'transition';
    specific: string;
    scale: 'intimate' | 'room' | 'building' | 'street' | 'district' | 'landscape';
  };
  atmosphere: {
    timeOfDay: string | null;
    weather: string | null;
    mood: string;
    lighting: string;
  };
  npcsPresent: Array<{
    description: string;
    action: string;
    prominence: 'foreground' | 'midground' | 'background';
  }>;
  playerAction: string | null;
  playerPosition: 'foreground' | 'midground' | 'background' | 'not_visible';
  environmentDetails: string[];
  activeElements: string[];
}

export interface WorldIllustrationRequest {
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
    currentActivity?: string;
  }>;
}

// ============================================================================
// INVOLVEMENT DETECTION
// ============================================================================

function detectPlayerInvolvement(
  narratorMessage: string,
  userAction: string
): { level: InvolvementLevel; action: string | null; position: SceneAnalysis['playerPosition'] } {
  
  const narratorLower = narratorMessage.toLowerCase();
  const actionLower = userAction.toLowerCase();
  
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
    'i stay', 'i remain', 'i keep', 'look around', 'survey', 'examine from',
  ];
  
  if (passiveActions.some(pa => actionLower.includes(pa))) {
    return { level: 'none', action: 'observing', position: 'not_visible' };
  }
  
  const backgroundIndicators = [
    'you walk', 'you move through', 'you pass by', 'you enter', 'you exit',
    'you stand', 'you sit', 'you lean', 'around you', 'you find yourself',
    'you make your way', 'you continue', 'you head', 'you approach',
  ];
  
  const backgroundActions = [
    'i walk', 'i go', 'i move', 'i head', 'i enter', 'i exit', 'i leave',
    'i continue', 'i proceed', 'i make my way', 'i approach slowly',
  ];
  
  if (backgroundIndicators.some(ind => narratorLower.includes(ind)) ||
      backgroundActions.some(ba => actionLower.includes(ba))) {
    const actionMatch = userAction.match(/^i\s+(.+?)(?:\.|$)/i);
    const action = actionMatch ? actionMatch[1] : 'moving through';
    return { level: 'background', action, position: 'midground' };
  }
  
  const focusIndicators = [
    'you collapse', 'you fall to your knees', 'pain overwhelms',
    'you realize', 'tears', 'you scream', 'death', 'dying',
    'you hold the', 'you clutch', 'your vision', 'you feel yourself',
  ];
  
  if (focusIndicators.some(ind => narratorLower.includes(ind))) {
    const actionMatch = userAction.match(/^i\s+(.+?)(?:\.|$)/i);
    return { level: 'focus', action: actionMatch?.[1] || 'experiencing', position: 'foreground' };
  }
  
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
    const action = actionMatch ? actionMatch[1] : 'engaging';
    return { level: 'participant', action, position: 'midground' };
  }
  
  return { level: 'background', action: 'present', position: 'background' };
}

// ============================================================================
// SCENE TYPE DETECTION
// ============================================================================

function detectSceneType(narratorMessage: string, userAction: string): SceneAnalysis['sceneType'] {
  const context = `${narratorMessage} ${userAction}`.toLowerCase();
  
  const personalIndicators = ['you feel', 'you realize', 'memory', 'you remember', 'emotion', 'tears', 'heart'];
  if (personalIndicators.some(ind => context.includes(ind))) return 'personal';
  
  const actionIndicators = ['fight', 'attack', 'shoot', 'fire', 'explosion', 'chase', 'run', 'dodge', 'combat'];
  if (actionIndicators.some(ind => context.includes(ind))) return 'action';
  
  const socialIndicators = ['says', 'speaks', 'asks', 'tells', 'conversation', 'crowd', 'people', 'gather'];
  if (socialIndicators.some(ind => context.includes(ind))) return 'social';
  
  const eventIndicators = ['suddenly', 'explosion', 'alarm', 'sirens', 'commotion', 'happening', 'event'];
  if (eventIndicators.some(ind => context.includes(ind))) return 'event';
  
  return 'environment';
}

// ============================================================================
// EXTRACT WORLD ELEMENTS
// ============================================================================

function extractWorldElements(
  narratorMessage: string,
  messageHistory: Array<{ role: string; content: string }>
): { primarySubject: string; worldEvent: string; environmentDetails: string[]; activeElements: string[] } {
  
  const worldEventPatterns = [
    /(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:is|are)\s+(\w+ing[^.]*)/gi,
    /(\w+)\s+(?:continues?|keeps?|goes? on)\s+(\w+ing[^.]*)/gi,
    /(?:around you,?\s*)([^.]+)/gi,
    /(?:in the distance,?\s*)([^.]+)/gi,
    /(?:nearby,?\s*)([^.]+)/gi,
  ];
  
  const activeElements: string[] = [];
  let primarySubject = 'the environment';
  let worldEvent = 'the scene unfolds';
  
  for (const pattern of worldEventPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      if (match[1] && !match[1].toLowerCase().includes('you')) {
        activeElements.push(match[0].trim());
        if (primarySubject === 'the environment') {
          primarySubject = match[1];
          worldEvent = match[0];
        }
      }
    }
  }
  
  const environmentDetails: string[] = [];
  const envPatterns = [
    /(?:the\s+)?(street|road|building|room|corridor|sky|rain|fog|smoke|fire|lights?|shadows?|walls?|floor|ceiling)[^,.]*/gi,
    /(?:broken|ruined|destroyed|abandoned|empty|crowded|busy|quiet|dark|bright|wet|dusty)[^,.]*/gi,
  ];
  
  for (const pattern of envPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      environmentDetails.push(match[0].trim());
    }
  }
  
  const recentHistory = messageHistory.slice(-6);
  for (const msg of recentHistory) {
    if (msg.role === 'narrator') {
      const locMatch = msg.content.match(/(?:in|at|inside|outside)\s+(?:the|a)\s+([^,.]+)/i);
      if (locMatch && !environmentDetails.includes(locMatch[1])) {
        environmentDetails.push(locMatch[1]);
      }
    }
  }
  
  return {
    primarySubject,
    worldEvent: worldEvent || 'the world continues',
    environmentDetails: [...new Set(environmentDetails)].slice(0, 5),
    activeElements: [...new Set(activeElements)].slice(0, 4),
  };
}

// ============================================================================
// EXTRACT NPC ACTIVITY
// ============================================================================

function extractNPCActivity(
  narratorMessage: string,
  knownNPCs: WorldIllustrationRequest['knownNPCs'] = []
): SceneAnalysis['npcsPresent'] {
  
  const npcs: SceneAnalysis['npcsPresent'] = [];
  
  const npcPatterns = [
    /(?:the\s+)?(\w+)\s+(?:is|stands?|sits?|walks?|runs?|speaks?|says?|looks?|watches?|waits?|holds?|carries?)\s+([^.]+)/gi,
    /(?:a|an|the)\s+(soldier|guard|civilian|man|woman|figure|person|stranger|merchant|officer|worker)\s+([^.]+)/gi,
    /(\w+)\s+(?:turns? to|approaches?|moves? toward|backs? away)/gi,
  ];
  
  for (const pattern of npcPatterns) {
    let match;
    while ((match = pattern.exec(narratorMessage)) !== null) {
      const name = match[1];
      const action = match[2] || match[0];
      
      if (name.toLowerCase() === 'you' || name.toLowerCase() === 'your') continue;
      
      let prominence: 'foreground' | 'midground' | 'background' = 'midground';
      if (action.length > 30 || narratorMessage.indexOf(match[0]) < 50) {
        prominence = 'foreground';
      } else if (narratorMessage.indexOf(match[0]) > narratorMessage.length * 0.7) {
        prominence = 'background';
      }
      
      npcs.push({ description: name, action: action.trim(), prominence });
    }
  }
  
  for (const npc of knownNPCs) {
    if (narratorMessage.toLowerCase().includes(npc.name.toLowerCase())) {
      const existing = npcs.find(n => n.description.toLowerCase() === npc.name.toLowerCase());
      if (!existing) {
        npcs.push({
          description: npc.description || npc.name,
          action: npc.currentActivity || 'present in scene',
          prominence: 'midground',
        });
      }
    }
  }
  
  return npcs.slice(0, 4);
}

// ============================================================================
// LOCATION ANALYSIS
// ============================================================================

function analyzeLocation(
  narratorMessage: string,
  currentLocation?: string
): SceneAnalysis['location'] {
  
  const context = narratorMessage.toLowerCase();
  
  let type: SceneAnalysis['location']['type'] = 'exterior';
  if (/\b(room|building|interior|inside|corridor|hallway|office|bunker|shelter)\b/.test(context)) {
    type = 'interior';
  } else if (/\b(car|truck|vehicle|tank|ship|plane|helicopter)\b/.test(context)) {
    type = 'vehicle';
  } else if (/\b(doorway|threshold|entrance|exit|between)\b/.test(context)) {
    type = 'transition';
  }
  
  let specific = currentLocation || 'unknown location';
  const locMatch = narratorMessage.match(/(?:in|at|inside|outside|through)\s+(?:the|a)?\s*([^,.!?]+)/i);
  if (locMatch) {
    specific = locMatch[1].trim();
  }
  
  let scale: SceneAnalysis['location']['scale'] = 'street';
  if (/\b(vast|sprawling|city|district|horizon|landscape|wasteland)\b/.test(context)) {
    scale = 'landscape';
  } else if (/\b(building|warehouse|facility|complex)\b/.test(context)) {
    scale = 'building';
  } else if (/\b(room|office|cell|chamber)\b/.test(context)) {
    scale = 'room';
  } else if (/\b(corner|alcove|closet|tight)\b/.test(context)) {
    scale = 'intimate';
  } else if (/\b(street|road|alley|path|corridor)\b/.test(context)) {
    scale = 'street';
  } else if (/\b(block|square|plaza|area)\b/.test(context)) {
    scale = 'district';
  }
  
  return { type, specific, scale };
}

// ============================================================================
// ATMOSPHERE ANALYSIS
// ============================================================================

function analyzeAtmosphere(
  narratorMessage: string,
  overrideTime?: string,
  overrideWeather?: string
): SceneAnalysis['atmosphere'] {
  
  const context = narratorMessage.toLowerCase();
  
  let timeOfDay: string | null = overrideTime || null;
  if (!timeOfDay) {
    if (/\b(dawn|sunrise|morning|early light)\b/.test(context)) timeOfDay = 'dawn';
    else if (/\b(noon|midday|afternoon|bright sun)\b/.test(context)) timeOfDay = 'day';
    else if (/\b(dusk|sunset|evening|twilight|fading light)\b/.test(context)) timeOfDay = 'dusk';
    else if (/\b(night|dark|midnight|moon|stars)\b/.test(context)) timeOfDay = 'night';
  }
  
  let weather: string | null = overrideWeather || null;
  if (!weather) {
    if (/\b(rain|raining|storm|downpour|drizzle|wet)\b/.test(context)) weather = 'rain';
    else if (/\b(snow|snowing|blizzard|frost|ice)\b/.test(context)) weather = 'snow';
    else if (/\b(fog|mist|haze|murky)\b/.test(context)) weather = 'fog';
    else if (/\b(wind|windy|gust|blowing)\b/.test(context)) weather = 'wind';
  }
  
  let mood = 'neutral';
  if (/\b(tense|danger|threat|ominous|dread)\b/.test(context)) mood = 'tense';
  else if (/\b(peaceful|calm|quiet|serene|still)\b/.test(context)) mood = 'peaceful';
  else if (/\b(chaos|frantic|hectic|pandemonium)\b/.test(context)) mood = 'chaotic';
  else if (/\b(eerie|creepy|unsettling|wrong)\b/.test(context)) mood = 'eerie';
  else if (/\b(busy|bustling|crowded|active)\b/.test(context)) mood = 'busy';
  else if (/\b(empty|desolate|abandoned|lonely)\b/.test(context)) mood = 'desolate';
  
  let lighting = 'natural ambient lighting';
  if (timeOfDay === 'night') lighting = 'nighttime darkness with scattered light sources';
  else if (timeOfDay === 'dawn') lighting = 'soft golden morning light';
  else if (timeOfDay === 'dusk') lighting = 'warm orange sunset light with long shadows';
  else if (weather === 'fog') lighting = 'diffused foggy lighting, low visibility';
  else if (weather === 'rain') lighting = 'overcast gray light, wet reflections';
  else if (mood === 'tense') lighting = 'harsh dramatic shadows, contrast lighting';
  
  return { timeOfDay, weather, mood, lighting };
}

// ============================================================================
// FULL SCENE ANALYSIS
// ============================================================================

export function analyzeScene(request: WorldIllustrationRequest): SceneAnalysis {
  const {
    lastNarratorMessage,
    lastUserAction,
    messageHistory,
    currentLocation,
    timeOfDay,
    weather,
    knownNPCs,
  } = request;
  
  const involvement = detectPlayerInvolvement(lastNarratorMessage, lastUserAction);
  const sceneType = detectSceneType(lastNarratorMessage, lastUserAction);
  const worldElements = extractWorldElements(lastNarratorMessage, messageHistory);
  const npcsPresent = extractNPCActivity(lastNarratorMessage, knownNPCs);
  const location = analyzeLocation(lastNarratorMessage, currentLocation);
  const atmosphere = analyzeAtmosphere(lastNarratorMessage, timeOfDay, weather);
  
  return {
    sceneType,
    playerInvolvement: involvement.level,
    primarySubject: worldElements.primarySubject,
    worldEvent: worldElements.worldEvent,
    location,
    atmosphere,
    npcsPresent,
    playerAction: involvement.action,
    playerPosition: involvement.position,
    environmentDetails: worldElements.environmentDetails,
    activeElements: worldElements.activeElements,
  };
}

// ============================================================================
// GENRE STYLES (Environment focused)
// ============================================================================

export const GENRE_ENVIRONMENT_STYLES: Record<string, {
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
  medieval: {
    artStyle: 'epic fantasy landscape, sweeping wide shot',
    environmentFocus: 'medieval architecture, castles, villages, wilderness',
    lighting: 'dramatic fantasy lighting, torchlight, magical glow',
    colorPalette: 'rich earth tones, stone grays, forest greens, torch orange',
    atmosphericEffects: ['torchlight', 'mist', 'magical particles', 'smoke from chimneys'],
    worldDetails: ['horses', 'carts', 'market stalls', 'banners', 'peasants working'],
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
};

// ============================================================================
// COMPOSITION BY SCENE TYPE
// ============================================================================

const SCENE_COMPOSITIONS: Record<SceneAnalysis['sceneType'], {
  framing: string;
  camera: string;
  focus: string;
  characterPlacement: string;
}> = {
  environment: {
    framing: 'wide establishing shot showcasing the environment',
    camera: 'wide angle lens, environment fills frame, deep depth of field',
    focus: 'environment and atmosphere are the subject, architectural and natural details',
    characterPlacement: 'if visible, small figure in environment showing scale',
  },
  event: {
    framing: 'dynamic wide shot capturing the event unfolding',
    camera: 'action-oriented angle, captures the scope of what is happening',
    focus: 'the event itself is the subject, showing cause and effect',
    characterPlacement: 'characters as participants in larger event, not centered',
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
    characterPlacement: 'multiple figures, no single focus, crowd dynamics',
  },
  personal: {
    framing: 'intimate moment within larger context',
    camera: 'medium shot with environment visible',
    focus: 'emotional moment with environmental storytelling',
    characterPlacement: 'character more prominent but still within world',
  },
};

// ============================================================================
// PLAYER VISIBILITY BY INVOLVEMENT
// ============================================================================

export const PLAYER_VISIBILITY: Record<InvolvementLevel, {
  include: boolean;
  description: string;
  prominence: string;
  detail: string;
}> = {
  none: {
    include: false,
    description: '',
    prominence: 'not visible in frame',
    detail: 'player character is not in this scene',
  },
  background: {
    include: true,
    description: 'small figure visible',
    prominence: 'in background or edge of frame, not the focus',
    detail: 'recognizable but not detailed, part of the scene',
  },
  participant: {
    include: true,
    description: 'figure actively engaged',
    prominence: 'in midground, one of several elements',
    detail: 'visible and identifiable, sharing focus with environment',
  },
  focus: {
    include: true,
    description: 'prominent figure',
    prominence: 'in foreground, but environment still visible',
    detail: 'detailed and clear, but world context maintained',
  },
};

// ============================================================================
// MAIN PROMPT BUILDER
// ============================================================================

export function buildWorldIllustrationPrompt(request: WorldIllustrationRequest): string {
  const { characterProfile, genre } = request;
  
  const analysis = analyzeScene(request);
  const genreStyle = GENRE_ENVIRONMENT_STYLES[genre] || GENRE_ENVIRONMENT_STYLES.modern;
  const composition = SCENE_COMPOSITIONS[analysis.sceneType];
  const playerVis = PLAYER_VISIBILITY[analysis.playerInvolvement];
  
  // Environment description (PRIMARY FOCUS)
  const environmentDesc = [
    genreStyle.environmentFocus,
    `setting: ${analysis.location.specific}`,
    analysis.location.type === 'interior' ? 'interior space' : 'exterior environment',
    `scale: ${analysis.location.scale} view`,
    analysis.environmentDetails.slice(0, 3).join(', '),
  ].filter(Boolean).join(', ');
  
  // Atmosphere description
  const atmosphereDesc = [
    analysis.atmosphere.lighting,
    analysis.atmosphere.timeOfDay ? `${analysis.atmosphere.timeOfDay} time` : '',
    analysis.atmosphere.weather ? `${analysis.atmosphere.weather} weather` : '',
    `${analysis.atmosphere.mood} mood`,
    genreStyle.atmosphericEffects[Math.floor(Math.random() * genreStyle.atmosphericEffects.length)],
  ].filter(Boolean).join(', ');
  
  // World activity
  const worldActivityDesc = [
    analysis.worldEvent,
    analysis.activeElements.slice(0, 2).join(', '),
    genreStyle.worldDetails[Math.floor(Math.random() * genreStyle.worldDetails.length)],
  ].filter(Boolean).join(', ');
  
  // NPCs
  const npcDesc = analysis.npcsPresent.length > 0
    ? analysis.npcsPresent.map(npc => 
        `${npc.prominence}: ${npc.description} ${npc.action}`
      ).join(', ')
    : '';
  
  // Player description ONLY if involved
  let playerDesc = '';
  if (playerVis.include && analysis.playerAction) {
    let charDesc = '';
    
    if (analysis.playerInvolvement === 'background') {
      charDesc = `distant figure, ${characterProfile.gender}, ${characterProfile.hair.color} hair, ${characterProfile.roleAppearance.split(',')[0]}`;
    } else if (analysis.playerInvolvement === 'participant') {
      charDesc = `${characterProfile.gender}, ${characterProfile.physicalDescription.build}, ${characterProfile.hair.color} ${characterProfile.hair.style}, ${characterProfile.roleAppearance}`;
    } else if (analysis.playerInvolvement === 'focus') {
      charDesc = characterProfile.fullVisualDescription;
    }
    
    playerDesc = `${playerVis.prominence}: ${charDesc}, ${analysis.playerAction}`;
  }
  
  // Assemble prompt with ENVIRONMENT FIRST
  const promptParts = [
    'masterpiece, best quality, highly detailed digital illustration',
    genreStyle.artStyle,
    composition.framing,
    composition.camera,
    composition.focus,
    `PRIMARY FOCUS - ENVIRONMENT: ${environmentDesc}`,
    worldActivityDesc ? `WORLD ACTIVITY: ${worldActivityDesc}` : '',
    `ATMOSPHERE: ${atmosphereDesc}`,
    genreStyle.lighting,
    `color palette: ${genreStyle.colorPalette}`,
    npcDesc ? `OTHER CHARACTERS: ${npcDesc}` : '',
    playerDesc ? `PLAYER (${playerVis.prominence}): ${playerDesc}` : '',
    playerVis.include ? composition.characterPlacement : 'no player character visible',
    'cinematic composition, environmental storytelling, intricate world details, 8k resolution',
  ];
  
  return promptParts.filter(Boolean).join(', ');
}

// ============================================================================
// REACT HOOK
// ============================================================================

export function useWorldIllustration(apiKey: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateIllustration = useCallback(async (request: WorldIllustrationRequest) => {
    setIsGenerating(true);
    setError(null);
    try {
      const prompt = buildWorldIllustrationPrompt(request);
      console.log('[WORLD ILLUST] Prompt:', prompt);
      console.log('[WORLD ILLUST] Player involvement:', analyzeScene(request).playerInvolvement);
      
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
        const err = await response.json();
        throw new Error(`API error: ${err.error?.message || response.status}`);
      }
      
      const result = await response.json();
      return result.data[0].url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey]);
  
  return { generateIllustration, isGenerating, error };
}

export default {
  analyzeScene,
  buildWorldIllustrationPrompt,
  useWorldIllustration,
  PLAYER_VISIBILITY,
  GENRE_ENVIRONMENT_STYLES,
};
