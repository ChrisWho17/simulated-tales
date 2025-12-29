import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CORE STYLE TEMPLATE
// ============================================================================

const PORTRAIT_STYLE_BASE = [
  'masterpiece',
  'best quality', 
  'highly detailed digital illustration',
  'semi-realistic anime style',
  'dramatic cinematic lighting',
  'portrait',
  'upper body shot',
  'looking at viewer',
  'detailed face',
  'intricate details',
  '8k resolution',
].join(', ');

const PORTRAIT_NEGATIVE = [
  'worst quality',
  'low quality',
  'blurry',
  'bad anatomy',
  'bad hands',
  'missing fingers',
  'extra fingers',
  'watermark',
  'signature',
  'text',
  'logo',
  'cropped',
  'out of frame',
  'duplicate',
  'deformed',
  'disfigured',
  'ugly',
  'cartoon',
  '3d render',
  'plastic',
].join(', ');

// ============================================================================
// GENRE STYLES
// ============================================================================

const GENRE_STYLES: Record<string, { style: string; backgrounds: string[] }> = {
  modern: {
    style: 'modern military tactical, urban warfare, realistic military equipment, kevlar vest, tactical harness, combat gear',
    backgrounds: [
      'destroyed urban environment with smoke',
      'military base at dawn',
      'warzone cityscape with fire',
      'smoky battlefield',
      'ruined building interior',
    ],
  },
  cyberpunk: {
    style: 'cyberpunk aesthetic, neon lights, chrome cybernetic augmentations, high-tech armor, holographic elements, futuristic',
    backgrounds: [
      'neon-lit megacity at night',
      'cyberpunk alleyway with rain',
      'high-tech facility with holograms',
      'dystopian cityscape with neon signs',
      'corporate tower interior',
    ],
  },
  postapoc: {
    style: 'post-apocalyptic, weathered gear, scrap armor, dust and grime, survival equipment, makeshift repairs',
    backgrounds: [
      'wasteland desert with ruins',
      'ruined overgrown city',
      'abandoned military facility',
      'dust storm horizon',
      'makeshift shelter camp',
    ],
  },
  scifi: {
    style: 'sci-fi military, futuristic armor, energy weapons, sleek helmet design, advanced materials, clean tech',
    backgrounds: [
      'spaceship bridge interior',
      'alien planet surface',
      'space station corridor',
      'futuristic battlefield',
      'orbital station with planet view',
    ],
  },
  ww2: {
    style: '1940s military, world war 2 era, period accurate uniform, vintage military equipment, historical accuracy',
    backgrounds: [
      'European battlefield trenches',
      'war-torn French village',
      'military encampment tents',
      'bunker interior with maps',
      'normandy beach aftermath',
    ],
  },
  medieval: {
    style: 'medieval fantasy, plate armor, chainmail, leather straps, heraldic symbols, battle-worn metal',
    backgrounds: [
      'castle courtyard at sunset',
      'medieval battlefield',
      'dark enchanted forest',
      'throne room with banners',
      'siege warfare scene',
    ],
  },
  fantasy: {
    style: 'high fantasy, magical realm, enchanted equipment, mystical aura, epic heroic',
    backgrounds: [
      'ancient magical forest',
      'grand castle throne room',
      'mystical mountain peak',
      'enchanted village',
      'dragon lair entrance',
    ],
  },
  horror: {
    style: 'dark horror aesthetic, blood splatter, torn clothing, survival horror, gritty realism',
    backgrounds: [
      'abandoned hospital corridor',
      'fog-shrouded graveyard',
      'decrepit mansion interior',
      'dark forest at night',
      'apocalyptic hellscape',
    ],
  },
  western: {
    style: 'wild west aesthetic, cowboy gear, dusty leather, revolver holster, frontier era',
    backgrounds: [
      'dusty frontier town',
      'desert canyon at sunset',
      'saloon interior',
      'prairie landscape',
      'abandoned mining town',
    ],
  },
  noir: {
    style: 'film noir aesthetic, 1940s detective, fedora hat, trench coat, moody shadows, black and white feel',
    backgrounds: [
      'rainy city street at night',
      'smoky jazz club',
      'detective office with blinds',
      'dark alleyway',
      'dimly lit bar',
    ],
  },
  mystery: {
    style: 'noir detective style, 1940s film noir aesthetic, dramatic shadows, rain and cigarette smoke',
    backgrounds: [
      'rainy city street at night',
      'smoky jazz club',
      'detective office with blinds',
      'dark alleyway',
      'dimly lit bar',
    ],
  },
  pirate: {
    style: 'golden age of piracy, salty sea dog aesthetic, Caribbean adventure, weathered sailor look',
    backgrounds: [
      'ship deck at sunset',
      'tropical island cove',
      'port tavern interior',
      'stormy seas',
      'treasure cave',
    ],
  },
};

// ============================================================================
// ROLE/CLASS STYLES
// ============================================================================

const ROLE_STYLES: Record<string, string> = {
  // Military roles
  soldier: 'infantry soldier, assault rifle, tactical vest, combat helmet, dog tags, military boots',
  medic: 'combat medic, red cross armband, medical backpack with supplies, first aid pouch, blood-stained gloves',
  sniper: 'sniper specialist, ghillie suit elements, scoped rifle, camouflage face paint, patient calculating eyes',
  heavy: 'heavy weapons specialist, large machine gun, ammo belts across chest, reinforced armor plates, imposing stance',
  engineer: 'combat engineer, tool belt, explosive charges, welding goggles on head, grease-stained uniform',
  pilot: 'fighter pilot, flight suit, aviator helmet, oxygen mask around neck, flight patches',
  tank: 'tank commander, tanker helmet with goggles pushed up, intercom headset, leather tanker jacket, oil stains',
  officer: 'military officer, decorated uniform, command presence, medals on chest, stern authoritative expression',
  scout: 'recon scout, light tactical gear, binoculars, stealth equipment, agile lean build',
  spec_ops: 'special forces operator, night vision goggles on helmet, suppressed weapon, all black tactical gear',
  
  // Fantasy roles
  knight: 'armored knight, ornate plate armor, family crest on chest, noble bearing, battle scars on armor',
  rogue: 'rogue assassin, dark leather armor, hidden blades, hood shadowing face, mysterious dangerous',
  mage: 'battle mage, arcane symbols glowing, magical staff, armored robes, glowing eyes with power',
  wizard: 'powerful wizard, mystical robes, ancient tome, magical aura, wise eyes',
  ranger: 'wilderness ranger, bow and quiver, forest cloak, animal fur trim, weathered experienced',
  paladin: 'holy paladin, ornate blessed armor, divine symbols, righteous aura, glowing holy light',
  berserker: 'berserker warrior, war paint, massive weapon, scarred muscular, fierce wild expression',
  warrior: 'battle-hardened warrior, practical armor, veteran stance, scarred and experienced',
  cleric: 'holy cleric, religious vestments, divine symbol, healing aura, compassionate',
  bard: 'charismatic bard, colorful clothing, musical instrument, charming smile',
  
  // Civilian/Other
  survivor: 'apocalypse survivor, makeshift armor, scavenged mismatched gear, resourceful determined',
  mercenary: 'professional mercenary, mixed military gear from various sources, no insignia, pragmatic cold',
  detective: 'hardboiled detective, long coat, badge visible, cigarette, world-weary cynical',
  criminal: 'hardened criminal, street clothes with concealed weapon, facial scars, dangerous intimidating',
  scientist: 'field scientist, lab coat over tactical gear, data pad, protective goggles, analytical',
  rebel: 'resistance fighter, improvised gear, revolutionary symbols, defiant passionate',
  hacker: 'elite hacker, cyberpunk style, neural interface, holographic displays, tech-savvy',
  netrunner: 'netrunner specialist, cyber deck, data cables, neon accents, digital warrior',
  thief: 'skilled thief, dark practical clothing, lockpicks, stealthy posture',
  assassin: 'deadly assassin, dark hooded attire, concealed weapons, cold calculating eyes',
};

// ============================================================================
// PHYSICAL ATTRIBUTES
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
  petite: 'petite small frame, delicate build',
  tall: 'tall imposing height, long limbs',
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
  tattoos: 'military tattoos, sleeve tattoos, meaningful ink, tribal markings',
  cybernetics: 'cybernetic augmentations, mechanical parts, tech implants, chrome',
  eyepatch: 'eyepatch over one eye, missing eye',
  beard: 'tactical beard, facial hair, stubble',
  cleanShaven: 'clean shaven, smooth face',
  glasses: 'tactical glasses, combat eyewear, shades',
  goggles: 'goggles on forehead, protective eyewear',
  freckles: 'freckles across face and nose',
  weathered: 'weathered skin, sun-damaged, experienced looking',
  young: 'youthful face, young looking',
  aged: 'aged mature face, wrinkles, experienced',
  piercings: 'ear piercings, facial piercings',
  makeup: 'tactical face paint, war paint, camouflage makeup',
  mask: 'face mask, balaclava pulled down',
  helmet: 'combat helmet on head',
  helmetOff: 'helmet carried or nearby, hair visible',
  headset: 'tactical headset, communication gear',
  cigarette: 'cigarette in mouth, smoking',
  bloodied: 'blood splatter on face, fresh from combat',
  dirty: 'dirt and grime on face, unwashed',
  clean: 'clean well-maintained appearance',
};

// ============================================================================
// EMOTION MODIFIERS
// ============================================================================

const EMOTION_STYLES: Record<string, string> = {
  neutral: 'neutral calm expression, steady professional gaze',
  determined: 'determined fierce expression, intense focused eyes, set jaw',
  combat: 'combat ready expression, aggressive battle stance, war cry',
  wounded: 'wounded pained expression, blood on face, exhausted struggling',
  confident: 'confident slight smile, self-assured, victorious',
  angry: 'angry furious expression, snarling rage, intense',
  sad: 'melancholic expression, distant thousand-yard stare, sorrow',
  scared: 'fearful expression, wide eyes, tense anxious',
  serious: 'serious stoic expression, professional unreadable',
  smirk: 'confident smirk, cocky expression, knowing look',
  cold: 'cold emotionless expression, calculating, predatory',
  tired: 'exhausted tired expression, bags under eyes, weary',
  hopeful: 'hopeful expression, slight optimism, looking forward',
  grief: 'grief-stricken expression, tears, loss',
  happy: 'happy joyful expression, genuine smile',
  suspicious: 'suspicious wary expression, narrowed eyes',
};

// ============================================================================
// PROMPT BUILDER
// ============================================================================

interface CharacterData {
  name?: string;
  gender?: string;
  role?: string;
  build?: string;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
  details?: string[];
  customDescription?: string;
  customBackground?: string;
}

function buildPortraitPrompt(
  character: CharacterData, 
  genre: string = 'modern', 
  options: { emotion?: string; includeBackground?: boolean; customAdditions?: string } = {}
) {
  const {
    emotion = 'neutral',
    includeBackground = true,
    customAdditions = '',
  } = options;

  // Get genre configuration
  const genreConfig = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;
  
  // Build component strings
  const genderStr = GENDER_STYLES[character.gender || 'male'] || GENDER_STYLES.male;
  const buildStr = BUILD_STYLES[character.build || 'athletic'] || BUILD_STYLES.athletic;
  const skinStr = SKIN_TONES[character.skinTone || 'medium'] || SKIN_TONES.medium;
  const hairStyleStr = HAIR_STYLES[character.hairStyle || 'short'] || HAIR_STYLES.short;
  const hairColorStr = HAIR_COLORS[character.hairColor || 'brown'] || HAIR_COLORS.brown;
  const eyeColorStr = EYE_COLORS[character.eyeColor || 'brown'] || EYE_COLORS.brown;
  const roleStr = ROLE_STYLES[character.role || 'warrior'] || ROLE_STYLES.warrior;
  const emotionStr = EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;
  
  // Build details string from array
  const detailsStr = (character.details || [])
    .map(d => DETAIL_OPTIONS[d] || d)
    .filter(Boolean)
    .join(', ');
  
  // Select background
  const background = includeBackground 
    ? (character.customBackground || genreConfig.backgrounds[Math.floor(Math.random() * genreConfig.backgrounds.length)])
    : '';
  
  // Assemble the prompt
  const promptParts = [
    PORTRAIT_STYLE_BASE,
    genderStr,
    buildStr,
    skinStr,
    `${hairColorStr}, ${hairStyleStr}`,
    eyeColorStr,
    roleStr,
    genreConfig.style,
    emotionStr,
    detailsStr,
    character.customDescription || '',
    customAdditions,
    background ? `background: ${background}` : '',
  ].filter(Boolean);
  
  return {
    prompt: promptParts.join(', '),
    negative_prompt: PORTRAIT_NEGATIVE,
  };
}

// ============================================================================
// LEGACY PROMPT BUILDER (for existing character format)
// ============================================================================

function buildLegacyPrompt(requestData: any) {
  const { appearance, characterClass, genre, name, portraitHints, clothingStyle, equipmentPrompts, emotionVariant } = requestData;
  
  // Parse appearance string for attributes
  const appearanceLower = (appearance || '').toLowerCase();
  
  // Try to extract gender
  let gender = 'male';
  if (appearanceLower.includes('female') || appearanceLower.includes('woman') || appearanceLower.includes('she')) {
    gender = 'female';
  }
  
  // Try to extract build
  let build = 'athletic';
  for (const key of Object.keys(BUILD_STYLES)) {
    if (appearanceLower.includes(key)) {
      build = key;
      break;
    }
  }
  
  // Try to extract hair color
  let hairColor = 'brown';
  for (const key of Object.keys(HAIR_COLORS)) {
    if (appearanceLower.includes(key.toLowerCase())) {
      hairColor = key;
      break;
    }
  }
  
  // Try to extract eye color
  let eyeColor = 'brown';
  for (const key of Object.keys(EYE_COLORS)) {
    if (appearanceLower.includes(key.toLowerCase())) {
      eyeColor = key;
      break;
    }
  }
  
  // Map character class to role
  const classLower = (characterClass || '').toLowerCase();
  let role = 'warrior';
  for (const key of Object.keys(ROLE_STYLES)) {
    if (classLower.includes(key)) {
      role = key;
      break;
    }
  }
  
  // Build character data
  const character: CharacterData = {
    name,
    gender,
    role,
    build,
    hairColor,
    eyeColor,
    customDescription: appearance,
  };
  
  // Add equipment to custom description
  if (equipmentPrompts?.length) {
    character.customDescription += `, ${equipmentPrompts.join(', ')}`;
  }
  
  // Add clothing style
  if (clothingStyle) {
    character.customDescription += `, ${clothingStyle}`;
  }
  
  // Add portrait hints
  if (portraitHints?.length) {
    character.customDescription += `, ${portraitHints.join(', ')}`;
  }
  
  return buildPortraitPrompt(character, genre || 'fantasy', { 
    emotion: emotionVariant || 'neutral' 
  });
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION
// ============================================================================

async function generateWithTogetherAI(prompt: string, negativePrompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating portrait with Together.AI FLUX");
  console.log("Prompt:", prompt.substring(0, 300) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt,
      negative_prompt: negativePrompt,
      width: 512,
      height: 768,
      steps: 4,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Together.AI error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later.");
    }
    if (response.status === 402 || response.status === 401) {
      throw new Error("API key issue or credits exhausted.");
    }
    
    throw new Error(`Together.AI error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Together.AI response received");
  
  const imageUrl = result.data?.[0]?.url;
  
  if (!imageUrl) {
    console.error("No image URL in response:", JSON.stringify(result));
    throw new Error("No image generated");
  }

  return imageUrl;
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
    const { name, appearance, characterClass, genre, emotionVariant } = body;

    console.log("Portrait generation request for:", name || "Unknown");
    console.log("Genre:", genre, "Class:", characterClass, "Emotion:", emotionVariant);

    // Build prompt from request data
    const promptData = buildLegacyPrompt(body);

    console.log("Final prompt:", promptData.prompt.substring(0, 400) + "...");

    const imageUrl = await generateWithTogetherAI(promptData.prompt, promptData.negative_prompt);

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
