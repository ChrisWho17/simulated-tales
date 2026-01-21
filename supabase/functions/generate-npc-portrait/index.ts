import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates user if logged in, allows anonymous access
async function authenticateRequest(req: Request): Promise<{ userId: string | null; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  // Allow anonymous access - no auth header is fine
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[generate-npc-portrait] No auth header - allowing anonymous access');
    return { userId: null, error: null };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  // Check if it's just the anon key (not a real user token)
  const token = authHeader.replace('Bearer ', '');
  if (token === supabaseAnonKey || token.length < 100) {
    console.log('[generate-npc-portrait] Anon key detected - allowing anonymous access');
    return { userId: null, error: null };
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    // Token validation failed, but still allow anonymous access
    console.log('[generate-npc-portrait] Token validation failed - allowing anonymous access:', error?.message);
    return { userId: null, error: null };
  }

  console.log('[generate-npc-portrait] Authenticated user:', data.user.id);
  return { userId: data.user.id, error: null };
}

// ============================================================================
// PORTRAIT STYLE CONSTANTS - Realistic knee-to-head portraits
// ============================================================================

const PORTRAIT_STYLE_BASE = [
  'ultra realistic photograph',
  'professional full body portrait photography',
  'CRITICAL: three-quarter length portrait showing full body from knees up to head',
  'full torso visible',
  'hips and waist clearly visible',
  'arms and hands visible',
  'medium shot framing from knees to head',
  'subject standing',
  'sharp focus on face',
  'natural skin texture',
  'photorealistic',
  'detailed facial features',
  'looking at viewer',
  'studio quality lighting',
  'high resolution',
  'detailed eyes with natural reflections',
  'natural hair texture',
  'authentic clothing fabric textures',
  'full outfit visible from knees to head',
  'full environment visible in background',
  'character in foreground with detailed background scenery',
].join(', ');

const PORTRAIT_NEGATIVE = [
  'headshot only',
  'face closeup',
  'bust shot',
  'shoulders up only',
  'cropped body',
  'portrait from chest up',
  'cartoon',
  'anime',
  'illustration',
  'painting',
  'drawing',
  'sketch',
  'digital art',
  'CGI',
  '3D render',
  'blurry',
  'bad anatomy',
  'distorted face',
  'extra limbs',
  'watermark',
  'text',
  'logo',
  'plastic skin',
  'mannequin',
  'doll-like',
  'oversaturated',
  'overexposed',
  'simple background',
  'plain background',
  'white background',
].join(', ');

// ============================================================================
// GENRE STYLES - Detailed environments matching genre
// ============================================================================

const GENRE_STYLES: Record<string, { style: string; backgrounds: string[] }> = {
  modern: {
    style: 'modern casual clothing, practical gear',
    backgrounds: ['urban city street with tall buildings', 'modern office interior with glass windows', 'suburban neighborhood at golden hour', 'rooftop overlooking city skyline'],
  },
  'modern-life': {
    style: 'contemporary casual clothing, modern everyday fashion',
    backgrounds: ['cozy coffee shop interior', 'modern apartment living room', 'city park with trees', 'busy urban sidewalk'],
  },
  war: {
    style: 'military combat uniform, tactical body armor, worn battle-ready gear',
    backgrounds: ['battlefield with smoke and debris', 'military base interior', 'desert terrain with vehicles', 'forest combat zone'],
  },
  cyberpunk: {
    style: 'futuristic streetwear, neon accents, subtle cybernetic enhancements, tech-wear fashion',
    backgrounds: ['neon-lit city street at night with rain', 'futuristic nightclub interior', 'high-tech apartment with holographic displays', 'crowded asian-inspired night market'],
  },
  postapoc: {
    style: 'weathered survival clothing, patched leather jacket, scavenged accessories, dust-covered gear',
    backgrounds: ['desolate wasteland with ruined buildings', 'abandoned highway with wrecked cars', 'makeshift survivor camp', 'overgrown city ruins with nature reclaiming'],
  },
  scifi: {
    style: 'sleek futuristic uniform, advanced fabric materials, subtle tech accessories',
    backgrounds: ['spaceship interior with viewports', 'space station corridor', 'alien planet surface with strange sky', 'futuristic lab with holographic screens'],
  },
  fantasy: {
    style: 'fantasy-inspired practical clothing, leather armor, cloth robes, mystical accessories',
    backgrounds: ['enchanted forest with soft magical lighting', 'stone castle interior with torches', 'mountain vista at sunset', 'ancient ruins with overgrown vegetation'],
  },
  medieval: {
    style: 'realistic medieval clothing, period-accurate armor pieces, leather and wool fabrics',
    backgrounds: ['stone castle courtyard', 'medieval village marketplace', 'forest clearing with ancient trees', 'torch-lit dungeon corridor'],
  },
  horror: {
    style: 'worn everyday clothing, survival gear, practical horror survivor attire',
    backgrounds: ['abandoned hospital corridor with flickering lights', 'foggy graveyard at night', 'decrepit mansion interior', 'dark forest path'],
  },
  western: {
    style: 'authentic wild west attire, leather duster, cowboy hat, period-accurate western clothing',
    backgrounds: ['dusty frontier town main street', 'desert canyon at sunset', 'wooden saloon interior', 'open prairie under dramatic sky'],
  },
  noir: {
    style: 'classic 1940s detective attire, fedora, trench coat, vintage formal wear',
    backgrounds: ['rainy city street at night with streetlamps', 'smoky detective office with venetian blinds', 'dimly lit jazz bar', 'dark alleyway with neon signs'],
  },
  mystery: {
    style: 'professional investigator attire, smart casual clothing, detective accessories',
    backgrounds: ['victorian study with bookshelves', 'crime scene with police tape', 'foggy london street', 'library interior with old books'],
  },
  pirate: {
    style: 'golden age pirate attire, weathered sea clothing, captain coat, nautical accessories',
    backgrounds: ['ship deck with ocean horizon', 'tropical island beach', 'port tavern interior', 'hidden cove with anchored ships'],
  },
  ww2: {
    style: '1940s period military uniform, vintage combat gear, authentic era equipment',
    backgrounds: ['European village street 1940s', 'military barracks interior', 'countryside battlefield', 'bunker with maps and radio'],
  },
  survival: {
    style: 'outdoor survival gear, hiking clothing, practical backpack, weathered explorer attire',
    backgrounds: ['dense forest campsite', 'mountain trail with scenic view', 'abandoned cabin in woods', 'riverside with wilderness'],
  },
  steampunk: {
    style: 'victorian steampunk fashion, brass accessories, goggles, clockwork details, leather and copper',
    backgrounds: ['victorian industrial factory with steam', 'airship observation deck', 'clockwork laboratory', 'brass and copper workshop'],
  },
  apocalypse: {
    style: 'rugged practical clothing, reinforced gear, weathered attire',
    backgrounds: ['desolate wasteland with ruined buildings', 'abandoned highway', 'makeshift survivor camp'],
  },
  vampire: {
    style: 'gothic aristocratic attire, dark elegant clothing, victorian formal wear, mysterious sophistication',
    backgrounds: ['gothic castle ballroom', 'moonlit cemetery with mist', 'victorian mansion parlor', 'dark forest with pale moonlight'],
  },
  zombie: {
    style: 'apocalypse survivor clothing, reinforced practical gear, weathered attire',
    backgrounds: ['overrun city street with abandoned cars', 'barricaded building interior', 'empty shopping mall', 'foggy suburban neighborhood'],
  },
  superhero: {
    style: 'heroic costume or tactical suit, symbol or emblem, cape or mask optional, powerful presence',
    backgrounds: ['city rooftop at sunset', 'metropolis skyline', 'secret headquarters interior', 'dramatic sky with clouds'],
  },
  spy: {
    style: 'sleek formal attire, tailored suit, subtle tactical elements, sophisticated fashion',
    backgrounds: ['casino interior with chandeliers', 'luxury hotel lobby', 'secret underground base', 'exotic foreign city'],
  },
};

// ============================================================================
// PHYSICAL ATTRIBUTE STYLES
// ============================================================================

const GENDER_STYLES: Record<string, string> = {
  male: 'male, masculine features, strong defined jawline',
  female: 'female, feminine features, beautiful face, soft cheekbones',
  nonbinary: 'androgynous features, ambiguous gender presentation',
};

const BUILD_STYLES: Record<string, string> = {
  athletic: 'athletic muscular build, toned physique, fit',
  lean: 'lean agile build, wiry muscles, quick',
  muscular: 'heavily muscular imposing build, broad shoulders, powerful',
  average: 'average build, normal proportions',
  slim: 'slim slender build, thin frame',
  stocky: 'stocky sturdy build, compact powerful',
  large: 'large heavy build, big frame, intimidating size',
  heavyset: 'heavyset large build, broad heavy frame, imposing presence',
  curvy: 'curvy hourglass figure, full figured, voluptuous feminine silhouette',
  petite: 'petite small frame, delicate build',
  tall: 'tall imposing height, long limbs',
  thick: 'thick curvy build, full figured, soft curves',
  lithe: 'lithe graceful build, elegant slender, dancer physique',
};

const SKIN_TONES: Record<string, string> = {
  pale: 'pale fair skin',
  light: 'light skin tone',
  fair: 'fair skin tone',
  medium: 'medium skin tone',
  tan: 'tanned skin',
  olive: 'olive skin tone',
  brown: 'brown skin tone',
  dark: 'dark skin tone',
  ebony: 'deep ebony skin tone',
};

const HAIR_STYLES: Record<string, string> = {
  short: 'short cropped hair',
  military: 'military buzz cut, regulation length',
  mohawk: 'mohawk hairstyle, shaved sides',
  shaved: 'completely shaved head, bald',
  bald: 'bald head',
  long: 'long flowing hair',
  ponytail: 'hair tied back in ponytail',
  braided: 'braided hair, warrior braids',
  undercut: 'undercut hairstyle, longer on top',
  messy: 'messy unkempt hair',
  slicked: 'slicked back hair',
  curly: 'curly textured hair',
  dreads: 'dreadlocks hairstyle',
  wavy: 'wavy flowing hair',
  spiky: 'spiky styled hair',
};

const HAIR_COLORS: Record<string, string> = {
  black: 'jet black hair',
  brown: 'brown hair',
  darkBrown: 'dark brown hair',
  lightBrown: 'light brown hair',
  blonde: 'blonde hair',
  dirtyBlonde: 'dirty blonde hair',
  platinum: 'platinum blonde hair',
  red: 'red hair, auburn',
  auburn: 'auburn red hair',
  ginger: 'ginger orange hair',
  white: 'white silver hair',
  gray: 'gray graying hair',
  silver: 'silver white hair',
  blue: 'blue dyed hair',
  pink: 'pink dyed hair',
  purple: 'purple dyed hair',
  green: 'green dyed hair',
};

const EYE_COLORS: Record<string, string> = {
  brown: 'brown eyes',
  blue: 'blue eyes',
  green: 'green eyes',
  hazel: 'hazel eyes',
  gray: 'gray eyes',
  amber: 'amber golden eyes',
  heterochromia: 'heterochromia different colored eyes',
  cybernetic: 'glowing cybernetic eyes',
  violet: 'violet purple eyes',
};

// ============================================================================
// DETAIL OPTIONS
// ============================================================================

const DETAIL_OPTIONS: Record<string, string> = {
  scars: 'facial scars, battle damage marks, healed wounds',
  tattoos: 'tattoos, sleeve tattoos, meaningful ink, tribal markings',
  cybernetics: 'cybernetic augmentations, mechanical parts, tech implants, chrome',
  eyepatch: 'eyepatch over one eye, missing eye',
  beard: 'beard, facial hair, stubble',
  cleanShaven: 'clean shaven, smooth face',
  glasses: 'glasses, eyewear',
  goggles: 'goggles on forehead, protective eyewear',
  freckles: 'freckles across face and nose',
  weathered: 'weathered skin, sun-damaged, experienced looking',
  young: 'youthful face, young looking',
  aged: 'aged mature face, wrinkles, experienced',
  piercings: 'ear piercings, facial piercings',
  makeup: 'makeup, face paint',
  mask: 'face mask, balaclava pulled down',
  helmet: 'combat helmet on head',
  headset: 'headset, communication gear',
  dirty: 'dirt and grime on face, unwashed',
  clean: 'clean well-maintained appearance',
};

// ============================================================================
// ROLE/OCCUPATION STYLES
// ============================================================================

const ROLE_STYLES: Record<string, string> = {
  soldier: 'soldier, assault rifle, tactical vest, combat helmet, dog tags',
  medic: 'combat medic, medical supplies, first aid pouch',
  sniper: 'sniper specialist, scoped rifle, camouflage',
  heavy: 'heavy weapons specialist, large weapon, ammo belts, reinforced armor',
  engineer: 'engineer, tool belt, welding goggles, work uniform',
  pilot: 'pilot, flight suit, aviator gear',
  officer: 'officer, decorated uniform, command presence, medals',
  scout: 'scout, light tactical gear, binoculars, stealth equipment',
  knight: 'armored knight, plate armor, noble bearing',
  rogue: 'rogue, dark leather armor, hidden blades, hood',
  mage: 'mage, mystical robes, magical staff, arcane symbols',
  wizard: 'wizard, mystical robes, ancient tome, magical aura',
  ranger: 'ranger, bow and quiver, forest cloak, animal fur trim',
  paladin: 'paladin, blessed armor, divine symbols, holy light',
  warrior: 'battle-hardened warrior, practical armor, veteran stance',
  cleric: 'cleric, religious vestments, divine symbol',
  bard: 'bard, colorful clothing, musical instrument',
  survivor: 'survivor, makeshift armor, scavenged gear',
  mercenary: 'mercenary, mixed military gear, no insignia',
  detective: 'detective, long coat, badge visible',
  criminal: 'criminal, street clothes, dangerous look',
  scientist: 'scientist, lab coat, data pad, protective goggles',
  rebel: 'resistance fighter, improvised gear, revolutionary symbols',
  hacker: 'hacker, cyberpunk style, neural interface',
  thief: 'thief, dark practical clothing, lockpicks',
  assassin: 'assassin, dark hooded attire, concealed weapons',
  merchant: 'merchant, fine clothing, money pouch',
  noble: 'noble, elegant expensive clothing, jewelry',
  peasant: 'peasant, simple worn clothing, humble appearance',
  bartender: 'bartender, apron, rolled sleeves',
  innkeeper: 'innkeeper, casual work clothing, welcoming demeanor',
  guard: 'guard, uniform, weapon at side, vigilant',
  sheriff: 'sheriff, star badge, western lawman attire',
  doctor: 'doctor, medical attire, professional demeanor',
  priest: 'priest, religious robes, holy symbols',
  blacksmith: 'blacksmith, leather apron, muscular arms, soot marks',
  farmer: 'farmer, work clothes, weathered hands',
};

// ============================================================================
// EMOTION STYLES
// ============================================================================

const EMOTION_STYLES: Record<string, string> = {
  neutral: 'neutral calm expression, steady professional gaze',
  happy: 'happy joyful expression, genuine smile',
  angry: 'angry furious expression, intense',
  sad: 'melancholic expression, distant sorrowful eyes',
  scared: 'fearful expression, wide eyes, tense anxious',
  suspicious: 'suspicious wary expression, narrowed eyes',
  confident: 'confident slight smile, self-assured',
  friendly: 'friendly warm expression, welcoming smile',
  hostile: 'hostile aggressive expression, threatening',
  nervous: 'nervous anxious expression, worried',
  determined: 'determined fierce expression, intense focused eyes, set jaw',
  serious: 'serious stoic expression, professional unreadable',
  cold: 'cold emotionless expression, calculating',
  tired: 'exhausted tired expression, bags under eyes, weary',
  smirk: 'confident smirk, cocky expression, knowing look',
  hopeful: 'hopeful expression, slight optimism',
  grief: 'grief-stricken expression, loss',
};

// ============================================================================
// PROMPT BUILDER FOR NPCs - Using Character Creation Settings
// ============================================================================

function buildNPCPrompt(npc: any, config: any): string {
  const genre = config?.genre || 'fantasy';
  const emotion = config?.emotion || npc.meta?.emotion || 'neutral';
  
  const genreConfig = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;
  const emotionStyle = EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;
  
  // Extract character creation settings from NPC meta
  const meta = npc.meta || {};
  
  // Build physical description from character creation settings
  const physicalParts: string[] = [];
  
  // Gender
  const genderKey = (meta.gender || 'male').toLowerCase();
  physicalParts.push(GENDER_STYLES[genderKey] || GENDER_STYLES.male);
  
  // Age
  if (meta.age) {
    physicalParts.push(`${meta.age} year old`);
  }
  
  // Build
  const buildKey = (meta.build || 'average').toLowerCase();
  if (BUILD_STYLES[buildKey]) {
    physicalParts.push(BUILD_STYLES[buildKey]);
  }
  
  // Skin tone
  const skinKey = (meta.skinTone || meta.skin || 'medium').toLowerCase();
  if (SKIN_TONES[skinKey]) {
    physicalParts.push(SKIN_TONES[skinKey]);
  }
  
  // Hair color
  const hairColorKey = (meta.hairColor || 'brown').toLowerCase();
  if (HAIR_COLORS[hairColorKey]) {
    physicalParts.push(HAIR_COLORS[hairColorKey]);
  }
  
  // Hair style
  const hairStyleKey = (meta.hairStyle || 'short').toLowerCase();
  if (HAIR_STYLES[hairStyleKey]) {
    physicalParts.push(HAIR_STYLES[hairStyleKey]);
  }
  
  // Eye color
  const eyeColorKey = (meta.eyeColor || 'brown').toLowerCase();
  if (EYE_COLORS[eyeColorKey]) {
    physicalParts.push(EYE_COLORS[eyeColorKey]);
  }
  
  // Details (scars, tattoos, etc.)
  if (meta.details && Array.isArray(meta.details)) {
    meta.details.forEach((detail: string) => {
      const detailKey = detail.toLowerCase();
      if (DETAIL_OPTIONS[detailKey]) {
        physicalParts.push(DETAIL_OPTIONS[detailKey]);
      } else if (detail) {
        physicalParts.push(detail);
      }
    });
  }
  
  // Role/occupation
  let roleStyle = '';
  const occupationKey = (meta.occupation || meta.role || '').toLowerCase();
  for (const key of Object.keys(ROLE_STYLES)) {
    if (occupationKey.includes(key)) {
      roleStyle = ROLE_STYLES[key];
      break;
    }
  }
  
  // If no specific role found, use genre style
  if (!roleStyle) {
    roleStyle = genreConfig.style;
  }
  
  // Name for context
  const nameContext = meta.name ? `portrait of ${meta.name}` : 'character portrait';
  
  // Custom description if provided
  const customDesc = meta.description || '';
  
  // Select random background from genre that matches the setting
  const background = genreConfig.backgrounds[Math.floor(Math.random() * genreConfig.backgrounds.length)];
  
  // Build complete realistic prompt with all character creation settings
  const promptParts = [
    PORTRAIT_STYLE_BASE,
    nameContext,
    physicalParts.join(', '),
    roleStyle,
    emotionStyle,
    customDesc,
    `background: ${background}`,
  ].filter(Boolean);
  
  return promptParts.join(', ');
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION (Using FLUX.1 Schnell)
// ============================================================================

async function generateWithTogetherAI(prompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    console.error("[generate-npc-portrait] TOGETHER_API_KEY not configured");
    throw new Error("Service configuration error");
  }

  console.log("Generating NPC portrait with Together.ai (FLUX.1 Schnell)");
  console.log("Prompt:", prompt.substring(0, 300) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: `IMPORTANT: three-quarter length portrait from knees to head, full torso visible, medium shot, ${prompt}`,
      width: 832,
      height: 1216,
      steps: 4,
      n: 1,
      response_format: 'b64_json',
      negative_prompt: PORTRAIT_NEGATIVE,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[generate-npc-portrait] API error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later");
    }
    if (response.status === 402 || response.status === 401) {
      throw new Error("Service temporarily unavailable");
    }
    
    throw new Error("Image generation failed");
  }

  const result = await response.json();
  console.log("Together.ai response received");
  
  const b64Data = result.data?.[0]?.b64_json;
  
  if (!b64Data) {
    console.error("[generate-npc-portrait] No image in response:", JSON.stringify(result).substring(0, 500));
    throw new Error("Image generation failed");
  }

  // Return as data URL
  return `data:image/png;base64,${b64Data}`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return auth.error;
  }
  console.log(`[generate-npc-portrait] Authenticated user: ${auth.userId}`);

  try {
    const { npc, prompt, config } = await req.json();

    if (!npc || !npc.meta) {
      throw new Error("Invalid request data");
    }

    console.log("Generating NPC portrait for:", npc.meta.name);

    // Use provided prompt or build from NPC data
    let finalPrompt: string;
    
    if (prompt) {
      finalPrompt = `${PORTRAIT_STYLE_BASE}, ${prompt}`;
    } else {
      finalPrompt = buildNPCPrompt(npc, config);
    }

    console.log("Final prompt:", finalPrompt.substring(0, 200) + "...");

    const imageUrl = await generateWithTogetherAI(finalPrompt);

    console.log("NPC portrait generated successfully for:", npc.meta.name);

    return new Response(JSON.stringify({ 
      imageUrl,
      npcId: npc.id,
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-npc-portrait] Error:", error);
    return new Response(JSON.stringify({ 
      error: "Unable to generate portrait at this time",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
