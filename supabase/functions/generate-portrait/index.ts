import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STRUCTURED LAYERED PROMPT SYSTEM
// Priority: Layer 1 (Identity) → Layer 2 (Physical) → Layer 3 (Context) → Layer 4 (Style)
// ============================================================================

// LAYER 4: Photography Style (lowest priority - applied last)
const LAYER_STYLE = {
  medium: 'professional photograph',
  quality: 'sharp focus, natural skin texture, realistic lighting',
  framing: 'three-quarter body portrait, from thighs up',
};

// Negative prompts - minimal and focused
const NEGATIVE_PROMPT = 'cartoon, anime, illustration, 3d render, painting, artificial, plastic, oversaturated, blurry';

// ============================================================================
// LAYER 3: GENRE CONTEXT - Environment and Setting
// ============================================================================

const GENRE_CONTEXT: Record<string, { outfit: string; setting: string }> = {
  modern: {
    outfit: 'modern tactical gear, body armor, combat clothing',
    setting: 'urban cityscape, modern architecture',
  },
  war: {
    outfit: 'military combat uniform, tactical vest, dog tags',
    setting: 'battlefield, military base',
  },
  cyberpunk: {
    outfit: 'futuristic streetwear, neon accents, tech-wear',
    setting: 'neon-lit night city, rain-slicked streets, holographic signs',
  },
  postapoc: {
    outfit: 'weathered survival gear, patched leather, scavenged clothing',
    setting: 'wasteland ruins, abandoned buildings',
  },
  scifi: {
    outfit: 'sleek futuristic uniform, advanced materials',
    setting: 'spaceship interior, space station',
  },
  ww2: {
    outfit: '1940s military uniform, period equipment',
    setting: 'wartime Europe, military camp',
  },
  medieval: {
    outfit: 'medieval clothing, leather and wool, period armor',
    setting: 'stone castle, medieval village',
  },
  fantasy: {
    outfit: 'fantasy attire, leather armor, mystical accessories',
    setting: 'enchanted forest, ancient castle',
  },
  horror: {
    outfit: 'worn everyday clothes, survival gear',
    setting: 'abandoned building, foggy night',
  },
  western: {
    outfit: 'wild west attire, duster coat, cowboy hat',
    setting: 'dusty frontier town, desert canyon',
  },
  noir: {
    outfit: '1940s detective attire, fedora, trench coat',
    setting: 'rainy night street, dim office',
  },
  mystery: {
    outfit: 'professional attire, investigator look',
    setting: 'victorian study, foggy street',
  },
  pirate: {
    outfit: 'pirate attire, weathered sea clothing',
    setting: 'ship deck, tropical port',
  },
  survival: {
    outfit: 'outdoor survival gear, hiking clothing',
    setting: 'wilderness, forest campsite',
  },
  steampunk: {
    outfit: 'victorian steampunk fashion, brass goggles, clockwork',
    setting: 'steam-powered factory, airship',
  },
  vampire: {
    outfit: 'gothic aristocratic attire, dark elegant clothing',
    setting: 'gothic castle, moonlit cemetery',
  },
  zombie: {
    outfit: 'apocalypse survivor gear, reinforced clothing',
    setting: 'overrun city, barricaded building',
  },
  superhero: {
    outfit: 'heroic suit, emblem, powerful presence',
    setting: 'city rooftop, dramatic sky',
  },
  spy: {
    outfit: 'tailored suit, sophisticated attire',
    setting: 'luxury casino, secret base',
  },
  modern_life: {
    outfit: 'contemporary casual clothing, modern fashion',
    setting: 'coffee shop, modern apartment',
  },
};

// ============================================================================
// LAYER 2: PHYSICAL ATTRIBUTES - Core appearance
// ============================================================================

const PHYSICAL = {
  gender: {
    male: 'man',
    female: 'woman',
    nonbinary: 'person with androgynous features',
  } as Record<string, string>,
  
  build: {
    athletic: 'athletic build',
    lean: 'lean build',
    muscular: 'muscular build',
    average: 'average build',
    slim: 'slim build',
    stocky: 'stocky build',
    large: 'large build',
    heavyset: 'heavyset build',
    curvy: 'curvy figure',
    petite: 'petite build',
    tall: 'tall stature',
    thick: 'thick build',
    lithe: 'lithe build',
  } as Record<string, string>,
  
  skin: {
    pale: 'pale skin',
    light: 'light skin',
    fair: 'fair skin',
    medium: 'medium skin tone',
    tan: 'tanned skin',
    olive: 'olive skin',
    brown: 'brown skin',
    dark: 'dark skin',
    ebony: 'ebony skin',
    porcelain: 'porcelain skin',
  } as Record<string, string>,
  
  hairColor: {
    black: 'black hair',
    brown: 'brown hair',
    darkBrown: 'dark brown hair',
    lightBrown: 'light brown hair',
    blonde: 'blonde hair',
    dirtyBlonde: 'dirty blonde hair',
    platinum: 'platinum hair',
    red: 'red hair',
    auburn: 'auburn hair',
    ginger: 'ginger hair',
    white: 'white hair',
    gray: 'gray hair',
    silver: 'silver hair',
    blue: 'blue hair',
    pink: 'pink hair',
    purple: 'purple hair',
    green: 'green hair',
  } as Record<string, string>,
  
  hairStyle: {
    short: 'short hair',
    military: 'military cut',
    mohawk: 'mohawk',
    shaved: 'shaved head',
    bald: 'bald',
    long: 'long hair',
    ponytail: 'ponytail',
    braided: 'braided hair',
    undercut: 'undercut',
    messy: 'messy hair',
    slicked: 'slicked back hair',
    curly: 'curly hair',
    dreads: 'dreadlocks',
    wavy: 'wavy hair',
    spiky: 'spiky hair',
  } as Record<string, string>,
  
  eyeColor: {
    brown: 'brown eyes',
    blue: 'blue eyes',
    green: 'green eyes',
    hazel: 'hazel eyes',
    gray: 'gray eyes',
    amber: 'amber eyes',
    heterochromia: 'heterochromia eyes',
    cybernetic: 'glowing cybernetic eyes',
    violet: 'violet eyes',
    golden: 'golden eyes',
  } as Record<string, string>,
};

// ============================================================================
// LAYER 1: ROLE IDENTITY - Character class/role (highest priority)
// ============================================================================

const ROLE_IDENTITY: Record<string, string> = {
  // Combat roles
  soldier: 'soldier, tactical vest, rifle',
  medic: 'combat medic, medical gear, red cross',
  sniper: 'sniper, ghillie elements, scope',
  heavy: 'heavy weapons specialist, machine gun, ammo belt',
  engineer: 'combat engineer, tools, goggles',
  pilot: 'pilot, flight suit, aviator gear',
  tank: 'tank commander, tanker helmet',
  officer: 'military officer, decorated uniform',
  scout: 'recon scout, light gear',
  spec_ops: 'special forces, night vision, suppressed weapon',
  
  // Fantasy roles
  knight: 'armored knight, plate armor, sword',
  rogue: 'rogue, leather armor, daggers',
  mage: 'mage, magical robes, arcane glow',
  wizard: 'wizard, mystical robes, staff',
  ranger: 'ranger, bow, forest cloak',
  paladin: 'paladin, blessed armor, holy symbol',
  berserker: 'berserker, war paint, massive weapon',
  warrior: 'warrior, practical armor, veteran',
  cleric: 'cleric, religious vestments',
  bard: 'bard, colorful clothing, instrument',
  
  // Civilian/Other
  survivor: 'survivor, makeshift gear, determined',
  mercenary: 'mercenary, mixed military gear, no insignia',
  detective: 'detective, long coat, badge',
  criminal: 'criminal, street clothes, dangerous',
  scientist: 'scientist, lab coat, equipment',
  rebel: 'resistance fighter, improvised gear',
  hacker: 'hacker, cyberpunk style, tech gear',
  netrunner: 'netrunner, cyber deck, data cables',
  thief: 'thief, dark clothing, stealthy',
  assassin: 'assassin, hooded attire, concealed weapons',
  solo: 'solo mercenary, combat gear, weapons',
};

// ============================================================================
// LAYERED PROMPT BUILDER
// ============================================================================

interface PromptLayers {
  layer1_identity: string;   // WHO (role, gender, age)
  layer2_physical: string;   // WHAT THEY LOOK LIKE (build, skin, hair, eyes)
  layer3_context: string;    // WHERE/WHAT WEARING (genre outfit, setting)
  layer4_style: string;      // HOW TO RENDER (photography style)
}

function buildLayeredPrompt(body: any): { prompt: string; negative_prompt: string } {
  const {
    gender,
    build,
    skinTone,
    hairColor,
    hairStyle,
    eyeColor,
    characterClass,
    genre,
    age,
  } = body;

  console.log("=== LAYERED PROMPT BUILDER ===");
  console.log("Input:", JSON.stringify({ gender, build, skinTone, hairColor, hairStyle, eyeColor, characterClass, genre, age }));

  // Helper: find value in map (case-insensitive)
  const lookup = (map: Record<string, string>, key: string | undefined, fallback: string): string => {
    if (!key) return fallback;
    const directMatch = map[key];
    if (directMatch) return directMatch;
    const lowerKey = key.toLowerCase();
    for (const k of Object.keys(map)) {
      if (k.toLowerCase() === lowerKey) return map[k];
    }
    return key; // Return raw value if no match
  };

  // Get genre context
  const genreCtx = GENRE_CONTEXT[genre] || GENRE_CONTEXT.fantasy;

  // =========================================================================
  // LAYER 1: IDENTITY (Highest Priority - Who is this person?)
  // =========================================================================
  const genderStr = lookup(PHYSICAL.gender, gender, 'person');
  const ageStr = age ? `${age} year old` : 'adult';
  
  // Find role from character class
  let roleStr = '';
  const classLower = (characterClass || '').toLowerCase();
  for (const key of Object.keys(ROLE_IDENTITY)) {
    if (classLower.includes(key)) {
      roleStr = ROLE_IDENTITY[key];
      break;
    }
  }
  
  const layer1 = [ageStr, genderStr, roleStr].filter(Boolean).join(' ');
  console.log("Layer 1 (Identity):", layer1);

  // =========================================================================
  // LAYER 2: PHYSICAL (What do they look like?)
  // =========================================================================
  const buildStr = lookup(PHYSICAL.build, build, 'average build');
  const skinStr = lookup(PHYSICAL.skin, skinTone, 'medium skin tone');
  const hairColorStr = lookup(PHYSICAL.hairColor, hairColor, 'brown hair');
  const hairStyleStr = lookup(PHYSICAL.hairStyle, hairStyle, 'short hair');
  const eyeColorStr = lookup(PHYSICAL.eyeColor, eyeColor, 'brown eyes');
  
  const layer2 = [buildStr, skinStr, `${hairColorStr} styled in ${hairStyleStr}`, eyeColorStr].join(', ');
  console.log("Layer 2 (Physical):", layer2);

  // =========================================================================
  // LAYER 3: CONTEXT (What are they wearing? Where are they?)
  // =========================================================================
  const layer3 = `wearing ${genreCtx.outfit}, ${genreCtx.setting} background`;
  console.log("Layer 3 (Context):", layer3);

  // =========================================================================
  // LAYER 4: STYLE (How should this be rendered?)
  // =========================================================================
  const layer4 = `${LAYER_STYLE.medium}, ${LAYER_STYLE.framing}, ${LAYER_STYLE.quality}`;
  console.log("Layer 4 (Style):", layer4);

  // =========================================================================
  // ASSEMBLE FINAL PROMPT
  // Order: Style framing first (tells model what we're making), then identity → physical → context → quality
  // =========================================================================
  const finalPrompt = [
    LAYER_STYLE.medium,           // "professional photograph"
    LAYER_STYLE.framing,          // "three-quarter body portrait"
    layer1,                        // WHO: "adult woman solo mercenary"
    layer2,                        // LOOKS: "athletic build, olive skin, black hair..."
    layer3,                        // CONTEXT: "wearing futuristic streetwear, neon city"
    LAYER_STYLE.quality,          // QUALITY: "sharp focus, natural skin texture"
  ].join(', ');

  console.log("=== FINAL PROMPT ===");
  console.log("Length:", finalPrompt.length);
  console.log("Prompt:", finalPrompt);

  return {
    prompt: finalPrompt,
    negative_prompt: NEGATIVE_PROMPT,
  };
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION
// ============================================================================

async function generateWithTogetherAI(prompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating with FLUX.1 Schnell");
  console.log("Prompt preview:", prompt.substring(0, 200) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: prompt,
      width: 832,
      height: 1216,
      steps: 4,
      n: 1,
      response_format: 'b64_json',
      negative_prompt: NEGATIVE_PROMPT,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Together.ai error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later.");
    }
    if (response.status === 402 || response.status === 401) {
      throw new Error("API key issue or credits exhausted.");
    }
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const result = await response.json();
  console.log("Together.ai response received");
  
  const b64Data = result?.data?.[0]?.b64_json;
  if (!b64Data) {
    console.error("No image in response:", JSON.stringify(result).substring(0, 500));
    throw new Error("No image generated");
  }

  return `data:image/png;base64,${b64Data}`;
}

// ============================================================================
// LEGACY PROMPT BUILDER (for backwards compatibility)
// ============================================================================

function buildLegacyPrompt(requestData: any) {
  const { appearance, characterClass, genre, portraitHints, emotionVariant } = requestData;
  
  const appearanceLower = (appearance || '').toLowerCase();
  
  // Extract basic attributes from appearance string
  let gender = 'male';
  if (appearanceLower.includes('female') || appearanceLower.includes('woman')) {
    gender = 'female';
  }
  
  let build = 'average';
  for (const key of Object.keys(PHYSICAL.build)) {
    if (appearanceLower.includes(key)) {
      build = key;
      break;
    }
  }

  // Build using layered system
  return buildLayeredPrompt({
    gender,
    build,
    characterClass,
    genre: genre || 'fantasy',
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, gender, characterClass, genre, emotionVariant } = body;

    console.log("Portrait request for:", name || "Unknown");
    console.log("Genre:", genre, "| Class:", characterClass);
    
    let promptData;
    
    // Use layered builder for new-style requests (has gender field)
    if (gender) {
      console.log("Using layered prompt builder");
      promptData = buildLayeredPrompt(body);
    } else {
      // Legacy mode for old requests
      console.log("Using legacy prompt builder");
      promptData = buildLegacyPrompt(body);
    }

    const imageUrl = await generateWithTogetherAI(promptData.prompt);

    console.log("Portrait generated successfully for:", name);

    return new Response(JSON.stringify({ 
      imageUrl,
      characterName: name,
      emotion: emotionVariant || 'neutral',
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating portrait:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unable to generate portrait at this time",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
