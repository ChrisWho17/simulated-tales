import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoryMessage {
  role: 'narrator' | 'user' | 'system';
  content: string;
}

interface CharacterContext {
  name?: string;
  gender?: string;
  role?: string;
  build?: string;
  hairColor?: string;
  hairStyle?: string;
  outfit?: string;
  details?: string[];
}

interface SceneImageRequest {
  // Primary context: last 2 messages
  lastNarratorMessage?: string;
  lastUserAction?: string;
  
  // Backstory: 10 prior messages
  messageHistory?: StoryMessage[];
  
  // Character info
  playerCharacter?: CharacterContext;
  
  // Campaign/genre info
  genre?: string;
  era?: string;
  setting?: string;
  
  // Location/atmosphere
  currentLocation?: string;
  timeOfDay?: string;
  weather?: string;
  
  // Legacy fields for compatibility
  sceneDescription?: string;
  recentStory?: string[];
  playerAction?: string;
  style?: string;
  mood?: string;
  location?: string;
}

// ============================================================================
// GENRE VISUAL STYLES
// ============================================================================

const GENRE_VISUAL_STYLES: Record<string, {
  style: string;
  lighting: string;
  colorPalette: string;
  visualFocus: string;
}> = {
  modern: {
    style: 'modern military tactical, realistic military equipment, contemporary urban setting',
    lighting: 'harsh realistic lighting, dramatic shadows',
    colorPalette: 'muted earth tones, military greens and tans, urban grays',
    visualFocus: 'modern weapons, tactical gear, urban environments, military vehicles',
  },
  cyberpunk: {
    style: 'cyberpunk aesthetic, neon lights, high-tech low-life, chrome and holographics',
    lighting: 'neon lighting, purple and cyan highlights, volumetric light rays',
    colorPalette: 'neon pinks, electric blues, deep purples, chrome silver',
    visualFocus: 'neon lights, cybernetics, megacities, holograms, rain-slicked chrome',
  },
  postapoc: {
    style: 'post-apocalyptic wasteland, ruined civilization, scavenged technology, decay',
    lighting: 'harsh sunlight, dust-filtered rays, orange haze',
    colorPalette: 'rust oranges, dusty browns, faded yellows, desaturated',
    visualFocus: 'ruins, wasteland, scavenged gear, overgrown cities, survival equipment',
  },
  postapocalyptic: {
    style: 'post-apocalyptic wasteland, ruined civilization, scavenged technology, decay',
    lighting: 'harsh sunlight, dust-filtered rays, orange haze',
    colorPalette: 'rust oranges, dusty browns, faded yellows, desaturated',
    visualFocus: 'ruins, wasteland, scavenged gear, overgrown cities, survival equipment',
  },
  scifi: {
    style: 'science fiction, futuristic technology, sleek designs, advanced civilization',
    lighting: 'clean bright lighting, blue-white technological glow',
    colorPalette: 'clean whites, metallic silvers, holographic blues, accent colors',
    visualFocus: 'spaceships, aliens, futuristic tech, planets, space stations',
  },
  ww2: {
    style: '1940s world war 2, historical military, period accurate, gritty realism',
    lighting: 'natural wartime lighting, overcast skies, muzzle flashes, battlefield smoke',
    colorPalette: 'sepia tones, military olive drab, muddy browns, desaturated',
    visualFocus: 'WW2 tanks (Sherman, Tiger, Panzer, M48 Patton), 1940s military gear, period uniforms, warplanes, bunkers, artillery',
  },
  war: {
    style: 'war photography aesthetic, gritty realism, dramatic shadows, battlefield chaos',
    lighting: 'harsh directional light, explosion flashes, smoke-filtered',
    colorPalette: 'muted greens, browns, grays, fire oranges',
    visualFocus: 'military vehicles, soldiers, explosions, trenches, battlefield debris',
  },
  medieval: {
    style: 'medieval period, castles, feudal society, pre-gunpowder',
    lighting: 'dramatic fantasy lighting, torchlight, natural sunlight',
    colorPalette: 'rich golds, deep reds, royal purples, forest greens',
    visualFocus: 'castles, knights, period weapons, torchlit scenes, stone architecture',
  },
  fantasy: {
    style: 'high fantasy, magical world, epic adventure, mythical creatures',
    lighting: 'dramatic fantasy lighting, ethereal glow, magical illumination',
    colorPalette: 'rich golds, deep blues, mystical purples, forest greens',
    visualFocus: 'magic, creatures, medieval architecture, enchanted items, mystical lighting',
  },
  horror: {
    style: 'dark horror, dread and terror, grotesque, survival horror',
    lighting: 'low key lighting, deep shadows, unsettling highlights',
    colorPalette: 'desaturated, sickly greens, blood reds, deep blacks',
    visualFocus: 'shadows, decay, monsters, unsettling environments, dark atmosphere',
  },
  western: {
    style: 'wild west, frontier americana, dusty towns, outlaws and lawmen',
    lighting: 'harsh desert sun, golden hour, saloon lamplight',
    colorPalette: 'warm browns, dusty oranges, sunset reds, weathered wood',
    visualFocus: 'horses, revolvers, saloons, desert, frontier towns',
  },
  noir: {
    style: 'film noir, 1940s detective, hard-boiled crime, femme fatale',
    lighting: 'high contrast, venetian blind shadows, single light source',
    colorPalette: 'black and white tones, deep shadows, harsh highlights',
    visualFocus: 'fedoras, rain, streetlights, shadowy figures, 1940s urban',
  },
  victorian: {
    style: 'victorian era, steampunk elements, industrial revolution, gaslight',
    lighting: 'gaslight glow, fog-filtered streetlights, warm interiors',
    colorPalette: 'brass and copper, deep burgundy, forest green, cream',
    visualFocus: 'brass machinery, airships, Victorian fashion, clockwork',
  },
  steampunk: {
    style: 'Victorian steampunk, brass and copper tones, mechanical details',
    lighting: 'warm gaslight, steam-filled atmosphere',
    colorPalette: 'brass gold, copper, dark wood, leather brown',
    visualFocus: 'brass machinery, airships, Victorian fashion, clockwork, gears',
  },
  zombie: {
    style: 'zombie apocalypse, desaturated colors, urban decay',
    lighting: 'overcast, grey atmosphere, emergency lighting',
    colorPalette: 'desaturated greens, grays, blood reds',
    visualFocus: 'undead, barricades, abandoned cities, survival gear',
  },
  vampire: {
    style: 'Gothic vampire aesthetic, romantic darkness, rich deep colors',
    lighting: 'moonlight, candlelight, dramatic shadows',
    colorPalette: 'deep reds, purples, blacks, silver accents',
    visualFocus: 'Gothic architecture, moonlight, elegant decay, dark romance',
  },
  pirate: {
    style: 'golden age of piracy, seafaring adventure, weathered textures',
    lighting: 'tropical sunlight, stormy skies, lantern light',
    colorPalette: 'ocean blues, weathered wood, gold accents, storm grays',
    visualFocus: 'ships, treasure, ports, tropical islands, naval combat',
  },
  spy: {
    style: 'espionage thriller, sleek modern aesthetic, international intrigue',
    lighting: 'dramatic shadows, neon signs, sophisticated ambiance',
    colorPalette: 'blacks, silvers, accent colors',
    visualFocus: 'gadgets, exotic locations, sleek vehicles, covert operations',
  },
};

const ERA_MODIFIERS: Record<string, string> = {
  ancient: 'ancient civilization, bronze age, primitive technology',
  medieval: 'medieval period, castles, feudal society',
  victorian: 'victorian era, steam technology, industrial revolution',
  ww1: 'world war 1 era, trench warfare, early tanks, biplanes',
  ww2: 'world war 2 era, 1940s technology, combined arms warfare, Sherman tanks, Tiger tanks',
  coldwar: 'cold war era, 1960s-1980s, espionage',
  modern: 'contemporary modern day, current technology',
  nearfuture: 'near future, emerging technology',
  farfuture: 'far future, advanced technology, space age',
};

// ============================================================================
// SCENE TYPE DETECTION
// ============================================================================

const ACTION_PATTERNS: Record<string, string[]> = {
  combat: [
    'fight', 'attack', 'shoot', 'fire', 'strike', 'slash', 'stab', 'punch',
    'battle', 'combat', 'engage', 'assault', 'defend', 'dodge', 'block',
    'explosion', 'gunfire', 'bullets', 'blood', 'wound', 'kill', 'death',
    'tank', 'shell', 'round', 'armor', 'turret', 'reload', 'aim',
  ],
  stealth: [
    'sneak', 'hide', 'creep', 'shadow', 'silent', 'quiet', 'crouch',
    'observe', 'watch', 'spy', 'infiltrate', 'avoid', 'evade',
  ],
  exploration: [
    'walk', 'move', 'enter', 'exit', 'explore', 'search', 'look',
    'investigate', 'discover', 'find', 'open', 'climb', 'travel',
  ],
};

const SCENE_COMPOSITIONS: Record<string, { framing: string; cameraAngle: string }> = {
  combat: {
    framing: 'dynamic action shot, motion blur on edges, intense focus',
    cameraAngle: 'dramatic low angle or dutch angle, emphasizing action',
  },
  stealth: {
    framing: 'atmospheric shot, deep shadows, limited visibility',
    cameraAngle: 'over-the-shoulder or hidden vantage point perspective',
  },
  exploration: {
    framing: 'establishing shot showing environment, character in context',
    cameraAngle: 'wide angle showing surroundings',
  },
};

function detectSceneType(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [type, keywords] of Object.entries(ACTION_PATTERNS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return type;
    }
  }
  return 'exploration';
}

// ============================================================================
// AI SCENE EXTRACTION - Uses last 2 messages + 10 backstory
// ============================================================================

async function extractSceneWithAI(
  lastNarratorMessage: string,
  lastUserAction: string,
  backstory: StoryMessage[],
  genre: string,
  era: string | undefined,
  location: string | undefined,
  apiKey: string
): Promise<string> {
  const genreStyle = GENRE_VISUAL_STYLES[genre.toLowerCase()] || GENRE_VISUAL_STYLES.fantasy;
  
  // Build backstory context (for consistency, NOT for illustration)
  const backstoryText = backstory
    .slice(-10)
    .map(m => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 200)}`)
    .join('\n');
  
  const prompt = `You are a PRECISE visual scene extractor for ${genre.toUpperCase()} image generation.

GENRE-SPECIFIC VISUAL ELEMENTS: ${genreStyle.visualFocus}
GENRE STYLE: ${genreStyle.style}
${era ? `ERA: ${ERA_MODIFIERS[era.toLowerCase()] || era}` : ''}
${location ? `LOCATION: ${location}` : ''}

=== BACKSTORY (for CONTEXT only - do NOT illustrate these past events) ===
${backstoryText || 'No backstory available'}

=== CURRENT SCENE (WHAT TO ILLUSTRATE) ===
PLAYER ACTION: ${lastUserAction}
RESULT: ${lastNarratorMessage}

YOUR TASK:
Create a SINGLE, PRECISE visual description of EXACTLY what is happening RIGHT NOW.

RULES:
1. Focus ONLY on the current action and its immediate result
2. Use SPECIFIC ${genre} elements: ${genreStyle.visualFocus}
3. Name exact vehicles/weapons/items (e.g., "M4 Sherman tank", "Tiger I", "Panzerfaust")
4. Describe the SPECIFIC environment from the scene
5. Include weather/lighting if mentioned

DO NOT:
- Describe past events from backstory
- Add generic elements not mentioned in the current scene
- Be vague - be EXTREMELY specific
- Add characters or objects not in the scene

OUTPUT: A single paragraph (2-3 sentences) describing ONLY the current visual moment with precise ${genre} details.`;

  try {
    console.log('Extracting scene with AI for genre:', genre);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('AI scene extraction failed:', response.status);
      return lastNarratorMessage;
    }

    const data = await response.json();
    const extractedScene = data.choices?.[0]?.message?.content?.trim();
    
    if (extractedScene && extractedScene.length > 30) {
      console.log('AI extracted scene:', extractedScene.slice(0, 200) + '...');
      return extractedScene;
    }
    
    return lastNarratorMessage;
  } catch (error) {
    console.error('AI scene extraction error:', error);
    return lastNarratorMessage;
  }
}

// ============================================================================
// CHARACTER DESCRIPTION BUILDER
// ============================================================================

function buildCharacterDescription(char: CharacterContext | undefined): string {
  if (!char) return '';
  
  const parts: string[] = [];
  if (char.gender) parts.push(char.gender);
  if (char.build) parts.push(`${char.build} build`);
  if (char.hairColor) {
    parts.push(char.hairStyle 
      ? `${char.hairColor} ${char.hairStyle} hair` 
      : `${char.hairColor} hair`);
  }
  if (char.role) parts.push(getRoleVisualDescription(char.role));
  if (char.outfit) parts.push(char.outfit);
  
  return parts.filter(Boolean).join(', ');
}

function getRoleVisualDescription(role: string): string {
  const roleVisuals: Record<string, string> = {
    soldier: 'wearing tactical military gear',
    tank: 'wearing tanker gear with goggles and headset',
    medic: 'wearing medic gear with red cross markings',
    sniper: 'wearing camouflage gear',
    pilot: 'wearing flight suit',
    officer: 'wearing officer uniform',
    knight: 'wearing plate armor',
    mage: 'wearing arcane robes',
    rogue: 'wearing dark leather',
    warrior: 'wearing battle armor',
  };
  return roleVisuals[role?.toLowerCase()] || '';
}

// ============================================================================
// MAIN PROMPT BUILDER
// ============================================================================

function buildImagePrompt(
  sceneDescription: string,
  genre: string,
  era: string | undefined,
  sceneType: string,
  characterDesc: string,
  location: string | undefined,
  timeOfDay: string | undefined,
  weather: string | undefined
): string {
  const genreStyle = GENRE_VISUAL_STYLES[genre.toLowerCase()] || GENRE_VISUAL_STYLES.fantasy;
  const composition = SCENE_COMPOSITIONS[sceneType] || SCENE_COMPOSITIONS.exploration;
  const eraDesc = era ? ERA_MODIFIERS[era.toLowerCase()] || era : '';
  
  const promptParts = [
    // Quality
    'masterpiece, best quality, highly detailed digital illustration',
    'cinematic scene illustration, wide landscape composition',
    '8k resolution, professional concept art',
    
    // Genre styling
    genreStyle.style,
    genreStyle.lighting,
    `color palette: ${genreStyle.colorPalette}`,
    
    // Era
    eraDesc,
    
    // Composition
    composition.framing,
    composition.cameraAngle,
    
    // Scene
    `scene: ${sceneDescription}`,
    
    // Character
    characterDesc ? `protagonist: ${characterDesc}` : '',
    
    // Environment
    location ? `setting: ${location}` : '',
    timeOfDay ? `time of day: ${timeOfDay}` : '',
    weather ? `weather: ${weather}` : '',
  ];
  
  const positive = promptParts.filter(Boolean).join(', ');
  
  const negative = 'blurry, low quality, text, watermark, signature, UI elements, amateur, wrong era, anachronistic elements, modern items in historical scenes';
  
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY is not configured');
    }

    // Extract data from request - support both new and legacy format
    const genre = requestData.genre || requestData.style || 'fantasy';
    const era = requestData.era;
    const location = requestData.currentLocation || requestData.location;
    const timeOfDay = requestData.timeOfDay;
    const weather = requestData.weather;
    
    // Get last 2 messages (primary context) and backstory
    let lastNarratorMessage = requestData.lastNarratorMessage || '';
    let lastUserAction = requestData.lastUserAction || requestData.playerAction || '';
    let backstory: StoryMessage[] = requestData.messageHistory || [];
    
    // Handle legacy format
    if (!lastNarratorMessage && requestData.recentStory && requestData.recentStory.length > 0) {
      const stories = requestData.recentStory;
      lastNarratorMessage = stories[stories.length - 1] || '';
      if (stories.length > 1) {
        backstory = stories.slice(0, -1).map(content => ({ 
          role: 'narrator' as const, 
          content 
        }));
      }
    }
    
    if (!lastNarratorMessage && requestData.sceneDescription) {
      lastNarratorMessage = requestData.sceneDescription;
    }

    console.log('Scene generation request:', {
      genre,
      era,
      hasNarratorMessage: !!lastNarratorMessage,
      hasUserAction: !!lastUserAction,
      backstoryCount: backstory.length,
    });

    // Use AI to extract precise scene
    let finalSceneDescription = lastNarratorMessage;
    if (LOVABLE_API_KEY && lastNarratorMessage) {
      finalSceneDescription = await extractSceneWithAI(
        lastNarratorMessage,
        lastUserAction,
        backstory,
        genre,
        era,
        location,
        LOVABLE_API_KEY
      );
    }

    // Detect scene type for composition
    const sceneType = detectSceneType(finalSceneDescription + ' ' + lastUserAction);
    console.log('Detected scene type:', sceneType);
    
    // Build character description
    const characterDesc = buildCharacterDescription(requestData.playerCharacter);
    
    // Build final prompt
    const imagePrompt = buildImagePrompt(
      finalSceneDescription,
      genre,
      era,
      sceneType,
      characterDesc,
      location,
      timeOfDay,
      weather
    );

    console.log('Final prompt preview:', imagePrompt.slice(0, 300) + '...');

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
