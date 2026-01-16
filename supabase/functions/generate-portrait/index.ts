import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STRUCTURED LAYERED PROMPT SYSTEM
// Priority: Layer 1 (Identity) → Layer 2 (Physical) → Layer 2.5 (Details) → Layer 3 (Context) → Layer 4 (Style)
// ============================================================================

// LAYER 4: Photography Style
const LAYER_STYLE = {
  medium: 'professional photograph, RAW photo',
  quality: 'sharp focus, natural skin texture, realistic lighting, detailed eyes with catchlights',
  framing: 'three-quarter body portrait from thighs up, body slightly angled, face looking directly at camera, eye contact with viewer',
};

// Comprehensive negative prompts including body anomalies
const NEGATIVE_PROMPT = [
  // Style exclusions
  'cartoon, anime, illustration, 3d render, painting, digital art, artificial, plastic',
  // Body anomalies
  'extra limbs, extra arms, extra legs, extra fingers, missing fingers, fused fingers, too many fingers',
  'deformed hands, malformed hands, bad hands, mutated hands, poorly drawn hands',
  'deformed face, ugly face, disfigured, mutation, mutated, deformed body',
  'bad anatomy, bad proportions, gross proportions, malformed limbs, missing limbs',
  'long neck, extra head, duplicate, clone, twin',
  // Quality issues
  'blurry, out of focus, low quality, jpeg artifacts, watermark, text, signature',
  'cropped, cut off, poorly framed',
].join(', ');

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
    outfit: 'futuristic streetwear, neon accents, tech-wear jacket',
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
    other: 'person',
  } as Record<string, string>,
  
  build: {
    athletic: 'athletic muscular build',
    lean: 'lean agile build',
    muscular: 'heavily muscular build',
    average: 'average build',
    slim: 'slim slender build',
    stocky: 'stocky sturdy build',
    large: 'large imposing build',
    heavyset: 'heavyset large build',
    curvy: 'curvy hourglass figure',
    petite: 'petite small frame',
    tall: 'tall imposing stature',
    thick: 'thick curvy build',
    lithe: 'lithe graceful build',
  } as Record<string, string>,
  
  skin: {
    pale: 'pale fair skin',
    light: 'light skin',
    fair: 'fair skin',
    medium: 'medium skin tone',
    tan: 'tanned skin',
    olive: 'olive skin tone',
    brown: 'brown skin',
    dark: 'dark skin',
    ebony: 'deep ebony skin',
    porcelain: 'porcelain pale skin',
  } as Record<string, string>,
  
  hairColor: {
    black: 'jet black hair',
    brown: 'brown hair',
    darkBrown: 'dark brown hair',
    lightBrown: 'light brown hair',
    blonde: 'blonde hair',
    dirtyBlonde: 'dirty blonde hair',
    platinum: 'platinum blonde hair',
    red: 'red hair',
    auburn: 'auburn hair',
    ginger: 'ginger hair',
    white: 'white hair',
    gray: 'gray hair',
    silver: 'silver hair',
    blue: 'bright blue dyed hair',
    pink: 'pink dyed hair',
    purple: 'purple dyed hair',
    green: 'green dyed hair',
  } as Record<string, string>,
  
  hairStyle: {
    short: 'short cropped hair',
    medium: 'medium length hair',
    military: 'military buzz cut',
    mohawk: 'mohawk hairstyle',
    shaved: 'shaved head',
    bald: 'bald head',
    long: 'long flowing hair',
    ponytail: 'hair in ponytail',
    braided: 'braided hair',
    undercut: 'undercut hairstyle',
    messy: 'messy tousled hair',
    slicked: 'slicked back hair',
    curly: 'curly textured hair',
    dreads: 'dreadlocks',
    wavy: 'wavy hair',
    spiky: 'spiky styled hair',
  } as Record<string, string>,
  
  eyeColor: {
    brown: 'brown eyes',
    blue: 'blue eyes',
    green: 'green eyes',
    hazel: 'hazel eyes',
    gray: 'gray eyes',
    amber: 'amber eyes',
    heterochromia: 'heterochromia different colored eyes',
    cybernetic: 'glowing cybernetic eyes',
    violet: 'violet eyes',
    golden: 'golden eyes',
  } as Record<string, string>,
  
  faceShape: {
    oval: 'oval face shape',
    round: 'round face',
    square: 'square jawline',
    heart: 'heart-shaped face',
    long: 'long face',
    angular: 'angular sharp features',
  } as Record<string, string>,
};

// ============================================================================
// LAYER 2.5: DISTINGUISHING DETAILS - Important visual markers
// ============================================================================

const DETAIL_MAP: Record<string, string> = {
  // Facial features
  'Facial scar': 'prominent facial scar',
  'Dimples': 'cute dimples when smiling',
  'Freckles': 'freckles across face and nose',
  'Beauty mark': 'beauty mark on face',
  'Cleft chin': 'cleft chin',
  'High cheekbones': 'high pronounced cheekbones',
  'Strong jaw': 'strong defined jawline',
  'Soft features': 'soft gentle facial features',
  'Sharp features': 'sharp angular features',
  'Weathered': 'weathered experienced face',
  'Youthful': 'youthful smooth face',
  
  // Facial hair
  'Beard': 'full beard',
  'Stubble': 'stubble facial hair',
  'Mustache': 'mustache',
  'Goatee': 'goatee',
  'Clean shaven': 'clean shaven face',
  
  // Accessories
  'Necklace': 'wearing necklace',
  'Choker': 'wearing choker necklace',
  'Ring': 'wearing rings',
  'Bracelet': 'wearing bracelet',
  'Earrings': 'wearing earrings',
  'Glasses': 'wearing glasses',
  'Sunglasses': 'wearing sunglasses',
  'Eyepatch': 'eyepatch over one eye',
  'Bandana': 'wearing bandana',
  'Headband': 'wearing headband',
  'Hat': 'wearing hat',
  'Scarf': 'wearing scarf',
  
  // Makeup/cosmetic
  'Heavy makeup': 'wearing heavy dramatic makeup',
  'Natural makeup': 'natural subtle makeup',
  'War paint': 'war paint on face',
  'Tattoo face': 'facial tattoos',
};

// ============================================================================
// LAYER 1: ROLE IDENTITY - Character class/role (highest priority)
// ============================================================================

const ROLE_IDENTITY: Record<string, string> = {
  // Combat roles
  soldier: 'soldier with tactical vest and rifle',
  medic: 'combat medic with medical gear',
  sniper: 'sniper with scope and ghillie elements',
  heavy: 'heavy weapons specialist with machine gun',
  engineer: 'combat engineer with tools and goggles',
  pilot: 'pilot in flight suit',
  tank: 'tank commander with tanker helmet',
  officer: 'military officer in decorated uniform',
  scout: 'recon scout in light gear',
  spec_ops: 'special forces operator with night vision',
  
  // Fantasy roles
  knight: 'armored knight with plate armor and sword',
  rogue: 'rogue in leather armor with daggers',
  mage: 'mage in magical robes with arcane glow',
  wizard: 'wizard in mystical robes with staff',
  ranger: 'ranger with bow and forest cloak',
  paladin: 'paladin in blessed armor',
  berserker: 'berserker with war paint and massive weapon',
  warrior: 'warrior in practical armor',
  cleric: 'cleric in religious vestments',
  bard: 'bard in colorful clothing with instrument',
  
  // Cyberpunk roles
  solo: 'solo mercenary with combat implants',
  netrunner: 'netrunner with neural interface and data cables',
  fixer: 'fixer in stylish street clothes',
  techie: 'techie with tools and gadgets',
  nomad: 'nomad in road-worn gear',
  corpo: 'corporate agent in sleek business attire',
  
  // Civilian/Other
  survivor: 'survivor in makeshift gear',
  mercenary: 'mercenary with mixed military gear',
  detective: 'detective in long coat with badge',
  criminal: 'criminal in street clothes',
  scientist: 'scientist in lab coat',
  rebel: 'resistance fighter in improvised gear',
  hacker: 'hacker in cyberpunk style with tech gear',
  thief: 'thief in dark stealthy clothing',
  assassin: 'assassin in hooded attire',
};

// ============================================================================
// LAYERED PROMPT BUILDER
// ============================================================================

function buildLayeredPrompt(body: any): { prompt: string; negative_prompt: string } {
  const {
    gender,
    build,
    skinTone,
    hairColor,
    hairStyle,
    eyeColor,
    faceShape,
    characterClass,
    genre,
    age,
    height,
    // Distinguishing details - IMPORTANT
    details,
    distinguishingFeatures,
    accessories,
    facialFeatures,
    distinguishingMarks,
    // Body modifications
    piercings,
    tattoos,
    tattooStyle,
    scars,
    implants,
    prosthetics,
    mutations,
    // Portrait hints from class
    portraitHints,
  } = body;

  console.log("=== LAYERED PROMPT BUILDER ===");
  console.log("Input:", JSON.stringify({ 
    gender, build, skinTone, hairColor, hairStyle, eyeColor, characterClass, genre, age,
    detailsCount: details?.length || 0,
    distinguishingFeaturesCount: distinguishingFeatures?.length || 0,
    accessoriesCount: accessories?.length || 0,
  }));

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
  // Fallback to class name if no match
  if (!roleStr && characterClass) {
    roleStr = characterClass;
  }
  
  const layer1 = `${ageStr} ${genderStr}${roleStr ? `, ${roleStr}` : ''}`;
  console.log("Layer 1 (Identity):", layer1);

  // =========================================================================
  // LAYER 2: PHYSICAL (Core appearance)
  // =========================================================================
  const buildStr = lookup(PHYSICAL.build, build, 'average build');
  const skinStr = lookup(PHYSICAL.skin, skinTone, 'medium skin tone');
  const hairColorStr = lookup(PHYSICAL.hairColor, hairColor, 'brown hair');
  const hairStyleStr = lookup(PHYSICAL.hairStyle, hairStyle, 'short hair');
  const eyeColorStr = lookup(PHYSICAL.eyeColor, eyeColor, 'brown eyes');
  const faceStr = faceShape ? lookup(PHYSICAL.faceShape, faceShape, '') : '';
  
  const physicalParts = [buildStr, skinStr, `${hairColorStr} in ${hairStyleStr}`, eyeColorStr];
  if (faceStr) physicalParts.push(faceStr);
  if (height) physicalParts.push(`${height} height`);
  
  const layer2 = physicalParts.join(', ');
  console.log("Layer 2 (Physical):", layer2);

  // =========================================================================
  // LAYER 2.5: DISTINGUISHING DETAILS (Important visual markers)
  // =========================================================================
  const detailParts: string[] = [];
  
  // Process details array (combined features + accessories from character creation)
  if (details && Array.isArray(details)) {
    details.forEach((d: string) => {
      const mapped = DETAIL_MAP[d];
      if (mapped) {
        detailParts.push(mapped);
      } else if (d) {
        detailParts.push(d.toLowerCase());
      }
    });
  }
  
  // Process separate distinguishing features
  if (distinguishingFeatures && Array.isArray(distinguishingFeatures)) {
    distinguishingFeatures.forEach((f: string) => {
      const mapped = DETAIL_MAP[f];
      if (mapped && !detailParts.includes(mapped)) {
        detailParts.push(mapped);
      }
    });
  }
  
  // Process accessories
  if (accessories && Array.isArray(accessories)) {
    accessories.forEach((a: string) => {
      const mapped = DETAIL_MAP[a];
      if (mapped && !detailParts.includes(mapped)) {
        detailParts.push(mapped);
      }
    });
  }
  
  // Add facial features text
  if (facialFeatures) {
    detailParts.push(facialFeatures);
  }
  
  // Add distinguishing marks text
  if (distinguishingMarks) {
    detailParts.push(distinguishingMarks);
  }
  
  // Add portrait hints from class
  if (portraitHints && Array.isArray(portraitHints)) {
    portraitHints.forEach((hint: string) => {
      if (hint && !detailParts.includes(hint)) {
        detailParts.push(hint);
      }
    });
  }
  
  // Process body modifications if any
  if (scars && Array.isArray(scars) && scars.length > 0) {
    detailParts.push(`visible scars: ${scars.join(', ')}`);
  }
  if (tattoos && Array.isArray(tattoos) && tattoos.length > 0) {
    const tattooDesc = tattooStyle ? `${tattooStyle} style tattoos` : 'tattoos';
    detailParts.push(`${tattooDesc} on ${tattoos.join(', ')}`);
  }
  if (piercings && Array.isArray(piercings) && piercings.length > 0) {
    detailParts.push(`piercings: ${piercings.join(', ')}`);
  }
  if (implants && Array.isArray(implants) && implants.length > 0) {
    detailParts.push(`cybernetic implants: ${implants.join(', ')}`);
  }
  if (prosthetics && Array.isArray(prosthetics) && prosthetics.length > 0) {
    detailParts.push(`prosthetic: ${prosthetics.join(', ')}`);
  }
  if (mutations && Array.isArray(mutations) && mutations.length > 0) {
    detailParts.push(`mutations: ${mutations.join(', ')}`);
  }
  
  const layer25 = detailParts.length > 0 ? `IMPORTANT DETAILS: ${detailParts.join(', ')}` : '';
  console.log("Layer 2.5 (Details):", layer25 || "(none)");

  // =========================================================================
  // LAYER 3: CONTEXT (What are they wearing? Where are they?)
  // =========================================================================
  const layer3 = `wearing ${genreCtx.outfit}, ${genreCtx.setting} background`;
  console.log("Layer 3 (Context):", layer3);

  // =========================================================================
  // LAYER 4: STYLE (How should this be rendered?)
  // =========================================================================
  const layer4 = `${LAYER_STYLE.quality}`;
  console.log("Layer 4 (Style):", layer4);

  // =========================================================================
  // ASSEMBLE FINAL PROMPT
  // Structure: [Medium] [Framing/Pose] [Identity] [Physical] [DETAILS] [Context] [Quality]
  // =========================================================================
  const promptParts = [
    LAYER_STYLE.medium,           // "professional photograph, RAW photo"
    LAYER_STYLE.framing,          // "three-quarter body, slightly angled, looking at camera"
    layer1,                        // WHO: "adult woman solo mercenary"
    layer2,                        // LOOKS: "athletic build, olive skin, black hair..."
  ];
  
  // Add details with emphasis if present
  if (layer25) {
    promptParts.push(layer25);     // DETAILS: "IMPORTANT DETAILS: freckles, scar, necklace..."
  }
  
  promptParts.push(layer3);        // CONTEXT: "wearing futuristic streetwear, neon city"
  promptParts.push(layer4);        // QUALITY: "sharp focus, natural skin texture"

  const finalPrompt = promptParts.join(', ');

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
  console.log("Prompt preview:", prompt.substring(0, 250) + "...");

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
  const { appearance, characterClass, genre } = requestData;
  
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
