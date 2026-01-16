import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CORE STYLE TEMPLATE - Realistic waist-up portraits with detailed environments
// ============================================================================

// Realistic photo style - knees up to head framing (3/4 body shot)
const PORTRAIT_STYLE_BASE = [
  'ultra realistic photograph',
  'professional full body portrait photography',
  'IMPORTANT: three-quarter length portrait showing full body from knees up to head',
  'full torso visible',
  'hips and waist clearly visible',
  'arms and hands visible',
  'medium shot framing',
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
].join(', ');

const PORTRAIT_NEGATIVE = [
  'headshot only',
  'face closeup',
  'bust shot',
  'shoulders up only',
  'cropped body',
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
].join(', ');

// ============================================================================
// GENRE STYLES - Detailed environments for waist-up portraits
// ============================================================================

// Realistic environment backgrounds per genre
const GENRE_STYLES: Record<string, { style: string; backgrounds: string[] }> = {
  modern: {
    style: 'modern tactical clothing, practical combat gear, body armor, military-style equipment',
    backgrounds: ['urban city street with tall buildings', 'modern office interior with glass windows', 'suburban neighborhood at golden hour', 'parking garage with concrete pillars', 'rooftop overlooking city skyline'],
  },
  war: {
    style: 'military combat uniform, tactical body armor, ammunition pouches, dog tags, worn battle-ready gear',
    backgrounds: ['battlefield with smoke and debris', 'military base interior', 'desert terrain with vehicles', 'forest combat zone', 'bombed urban street'],
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
    style: 'sleek futuristic uniform, advanced fabric materials, subtle tech accessories, clean professional attire',
    backgrounds: ['spaceship interior with viewports', 'space station corridor', 'alien planet surface with strange sky', 'futuristic lab with holographic screens'],
  },
  ww2: {
    style: '1940s period military uniform, vintage combat gear, authentic era equipment, leather boots',
    backgrounds: ['European village street 1940s', 'military barracks interior', 'countryside battlefield', 'bunker with maps and radio'],
  },
  medieval: {
    style: 'realistic medieval clothing, period-accurate armor pieces, leather and wool fabrics, historical attire',
    backgrounds: ['stone castle courtyard', 'medieval village marketplace', 'forest clearing with ancient trees', 'torch-lit dungeon corridor'],
  },
  fantasy: {
    style: 'fantasy-inspired practical clothing, leather armor, cloth robes, mystical accessories',
    backgrounds: ['enchanted forest with soft magical lighting', 'stone castle interior with torches', 'mountain vista at sunset', 'ancient ruins with overgrown vegetation'],
  },
  horror: {
    style: 'worn everyday clothing, survival gear, blood-stained or torn fabric, practical horror survivor attire',
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
  survival: {
    style: 'outdoor survival gear, hiking clothing, practical backpack, weathered explorer attire',
    backgrounds: ['dense forest campsite', 'mountain trail with scenic view', 'abandoned cabin in woods', 'riverside with wilderness'],
  },
  steampunk: {
    style: 'victorian steampunk fashion, brass accessories, goggles, clockwork details, leather and copper',
    backgrounds: ['victorian industrial factory with steam', 'airship observation deck', 'clockwork laboratory', 'brass and copper workshop'],
  },
  vampire: {
    style: 'gothic aristocratic attire, dark elegant clothing, victorian formal wear, mysterious sophistication',
    backgrounds: ['gothic castle ballroom', 'moonlit cemetery with mist', 'victorian mansion parlor', 'dark forest with pale moonlight'],
  },
  zombie: {
    style: 'apocalypse survivor clothing, reinforced practical gear, weathered and stained attire',
    backgrounds: ['overrun city street with abandoned cars', 'barricaded building interior', 'empty shopping mall', 'foggy suburban neighborhood'],
  },
  superhero: {
    style: 'heroic costume or tactical suit, symbol or emblem, cape or mask optional, powerful presence',
    backgrounds: ['city rooftop at sunset', 'metropolis skyline', 'secret headquarters interior', 'dramatic sky with clouds'],
  },
  spy: {
    style: 'sleek formal attire, tailored suit, subtle tactical elements, sophisticated spy fashion',
    backgrounds: ['casino interior with chandeliers', 'luxury hotel lobby', 'secret underground base', 'exotic foreign city'],
  },
  modern_life: {
    style: 'contemporary casual clothing, modern everyday fashion, realistic modern attire',
    backgrounds: ['cozy coffee shop interior', 'modern apartment living room', 'city park with trees', 'busy urban sidewalk'],
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
  heavyset: 'heavyset large build, broad heavy frame, imposing presence',
  curvy: 'curvy hourglass figure, full bust, wide hips, narrow waist, voluptuous feminine silhouette',
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
// BODY MODIFICATION MAPPINGS - for detailed character customization
// ============================================================================

const PIERCING_PROMPT_MAP: Record<string, string> = {
  'ear_lobe': 'visible ear lobe piercings, multiple earrings',
  'ear_helix': 'helix ear piercing, cartilage piercings',
  'ear_industrial': 'industrial ear piercing bar',
  'nose_stud': 'nose stud piercing',
  'nose_ring': 'nose ring piercing',
  'septum': 'septum piercing, visible nose ring',
  'lip_ring': 'lip ring piercing',
  'labret': 'labret piercing below lip',
  'eyebrow': 'eyebrow piercing, barbell through brow',
  'tongue': 'tongue piercing visible',
  'navel': 'navel belly button piercing',
  'nipple': 'nipple piercings visible through clothing',
  'intimate': 'intimate body piercings',
};

const TATTOO_PROMPT_MAP: Record<string, string> = {
  'face': 'facial tattoos, face ink, tribal face markings',
  'neck': 'neck tattoo, throat ink design',
  'chest': 'chest tattoo, torso ink art',
  'back': 'back tattoo, spine ink design',
  'full_sleeve': 'full sleeve tattoos both arms, heavily inked arms',
  'half_sleeve': 'half sleeve tattoos on upper arms',
  'forearm': 'forearm tattoos, lower arm ink',
  'hand': 'hand tattoos, finger tattoos, knuckle ink',
  'leg': 'leg tattoos, thigh ink',
  'tribal': 'tribal pattern tattoos, bold black geometric',
  'japanese': 'japanese style tattoos, irezumi, koi dragons',
  'blackwork': 'blackwork tattoos, solid black ink designs',
  'realism': 'realistic portrait tattoos, photorealistic ink',
  'watercolor': 'watercolor style tattoos, colorful flowing ink',
  'traditional': 'traditional old school tattoos, bold colors',
};

const SCAR_PROMPT_MAP: Record<string, string> = {
  'facial': 'prominent facial scar, healed wound across face',
  'eye': 'scar across eye, through eyebrow',
  'cheek': 'cheek scar, slashing mark on face',
  'lip': 'scar through lip, healed cut',
  'body': 'body scars, torso wounds healed',
  'burn': 'burn scars, healed burn marks on skin',
  'surgical': 'surgical scars, medical procedure marks',
};

const IMPLANT_PROMPT_MAP: Record<string, string> = {
  'neural': 'neural interface implant on temple, glowing circuitry under skin, cybernetic brain jack',
  'eye': 'cybernetic eye implant, glowing mechanical eye, optical augmentation',
  'arm': 'cybernetic arm, mechanical prosthetic arm, chrome limb with visible mechanics',
  'hand': 'cybernetic hand, mechanical fingers, chrome knuckles with tech details',
  'spine': 'spinal implant visible, vertebrae augmentation, back cybernetics',
  'subdermal': 'subdermal implants, glowing patterns under skin, tech-enhanced skin',
  'ports': 'data ports on neck and arms, visible connection jacks, interface sockets',
};

const PROSTHETIC_PROMPT_MAP: Record<string, string> = {
  'arm': 'prosthetic arm, artificial limb, mechanical replacement arm',
  'leg': 'prosthetic leg, artificial limb, mechanical leg',
  'hand': 'prosthetic hand, mechanical fingers, artificial hand',
  'eye': 'prosthetic eye, glass eye, artificial eye',
};

const MUTATION_PROMPT_MAP: Record<string, string> = {
  'scales': 'mutated scales on skin, reptilian patches',
  'horns': 'small horns growing from head, mutant protrusions',
  'claws': 'claw-like fingernails, sharp mutated nails',
  'fangs': 'visible fangs, sharp mutated teeth',
  'extra_limbs': 'extra appendages, mutated limbs',
  'bioluminescent': 'bioluminescent patches on skin, glowing mutation',
};

const CLOTHING_STYLE_PROMPT_MAP: Record<string, string> = {
  'genre_default': '', // Use genre default
  'streetwear': 'urban streetwear fashion, hoodies, sneakers, casual cool',
  'formal': 'formal attire, suit and tie, elegant business wear',
  'casual': 'casual everyday clothing, relaxed fit, comfortable',
  'punk': 'punk fashion, leather jacket, spikes, chains, rebellious style',
  'goth': 'gothic fashion, black clothing, dark aesthetic, lace and leather',
  'military': 'military style clothing, tactical gear, combat fatigues',
  'sporty': 'athletic sportswear, track suit, sporty casual',
  'vintage': 'vintage retro fashion, classic old-school style',
  'haute_couture': 'high fashion, designer clothing, avant-garde style',
  'cyberpunk_street': 'cyberpunk streetwear, neon accents, tech-wear, futuristic urban',
  'corporate': 'corporate professional attire, business suit, executive style',
  'nomad': 'nomad wasteland clothing, dusty road-worn, scavenged gear',
  'rocker': 'rock and roll fashion, band shirts, leather, chains',
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
// LOVABLE AI IMAGE GENERATION (Using Gemini Flash Image)
// ============================================================================

async function generateWithTogetherAI(prompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating portrait with Together.ai (FLUX.1 Schnell)");
  console.log("Prompt:", prompt.substring(0, 300) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: `IMPORTANT: three-quarter length portrait from knees to head, full torso visible, medium shot, NOT a headshot, ${prompt}`,
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
    console.error("Together.ai error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later.");
    }
    if (response.status === 402 || response.status === 401) {
      throw new Error("API key issue or credits exhausted.");
    }
    
    throw new Error(`Together.ai error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Together.ai response received");
  
  const b64Data = result.data?.[0]?.b64_json;
  
  if (!b64Data) {
    console.error("No image in response:", JSON.stringify(result).substring(0, 500));
    throw new Error("No image generated");
  }

  // Return as data URL
  return `data:image/png;base64,${b64Data}`;
}

// ============================================================================
// LOCKED REFERENCE PROMPT BUILDER - Realistic portraits using character creation settings
// ============================================================================

function buildLockedReferencePrompt(body: any) {
  const { 
    customPrompt,
    name,
    gender, 
    build, 
    skinTone, 
    hairColor, 
    hairStyle, 
    eyeColor, 
    details, 
    characterClass,
    genre,
    portraitHints,
    environmentContext,
    age,
    height,
    facialFeatures,
    distinguishingMarks,
    // BODY MODIFICATIONS - extracted separately for emphasis
    piercings,
    tattoos,
    tattooStyle,
    scars,
    implants,
    prosthetics,
    mutations,
    clothingStyle,
    clothingDetails,
  } = body;
  
  // Log incoming data for debugging - including body mods
  console.log("Building prompt with character data:", JSON.stringify({
    gender, build, skinTone, hairColor, hairStyle, eyeColor, details, characterClass, genre,
    piercings, tattoos, implants, prosthetics, mutations, clothingStyle
  }));
  
  // Get genre config for style and backgrounds
  const genreConfig = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;
  
  // Build character physical description from creation settings
  const genderDesc = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  const ageDesc = age ? `${age} year old` : 'adult';
  
  // Helper function to find key in object (case-insensitive)
  const findKey = (obj: Record<string, string>, key: string | undefined): string => {
    if (!key) return '';
    // Try exact match first
    if (obj[key]) return obj[key];
    // Try lowercase match
    const lowerKey = key.toLowerCase();
    for (const k of Object.keys(obj)) {
      if (k.toLowerCase() === lowerKey) return obj[k];
    }
    // Return the raw value if no match found
    return key;
  };
  
  const buildDesc = findKey(BUILD_STYLES, build) || BUILD_STYLES.average;
  const heightDesc = height ? `${height} height` : '';
  const skinDesc = findKey(SKIN_TONES, skinTone) || SKIN_TONES.medium;
  const hairColorDesc = findKey(HAIR_COLORS, hairColor) || HAIR_COLORS.brown;
  const hairStyleDesc = findKey(HAIR_STYLES, hairStyle) || HAIR_STYLES.short;
  const eyeColorDesc = findKey(EYE_COLORS, eyeColor) || EYE_COLORS.brown;
  
  console.log("Resolved descriptions:", { buildDesc, skinDesc, hairColorDesc, hairStyleDesc, eyeColorDesc });
  
  // Map character class to appropriate role style
  const classLower = (characterClass || '').toLowerCase();
  let roleStyle = '';
  for (const key of Object.keys(ROLE_STYLES)) {
    if (classLower.includes(key)) {
      roleStyle = ROLE_STYLES[key];
      break;
    }
  }
  if (!roleStyle) {
    roleStyle = genreConfig.style;
  }
  
  // Build details from character creation
  const detailParts: string[] = [];
  if (details && Array.isArray(details)) {
    details.forEach((d: string) => {
      const mapped = DETAIL_OPTIONS[d];
      if (mapped) detailParts.push(mapped);
      else if (d) detailParts.push(d);
    });
  }
  if (facialFeatures) detailParts.push(facialFeatures);
  if (distinguishingMarks) detailParts.push(distinguishingMarks);
  
  // =========================================================================
  // BODY MODIFICATIONS - Critical for character accuracy
  // =========================================================================
  const bodyModParts: string[] = [];
  
  // Process PIERCINGS
  if (piercings && Array.isArray(piercings) && piercings.length > 0) {
    console.log("Processing piercings:", piercings);
    piercings.forEach((p: string) => {
      const mapped = findKey(PIERCING_PROMPT_MAP, p);
      if (mapped && mapped !== p) {
        bodyModParts.push(mapped);
      } else if (p) {
        bodyModParts.push(`${p} piercing`);
      }
    });
  }
  
  // Process TATTOOS with style
  if (tattoos && Array.isArray(tattoos) && tattoos.length > 0) {
    console.log("Processing tattoos:", tattoos, "style:", tattooStyle);
    tattoos.forEach((t: string) => {
      const mapped = findKey(TATTOO_PROMPT_MAP, t);
      if (mapped && mapped !== t) {
        bodyModParts.push(mapped);
      } else if (t) {
        bodyModParts.push(`${t} tattoo`);
      }
    });
    // Add tattoo style if specified
    if (tattooStyle) {
      const styleDesc = findKey(TATTOO_PROMPT_MAP, tattooStyle);
      if (styleDesc && styleDesc !== tattooStyle) {
        bodyModParts.push(styleDesc);
      }
    }
  }
  
  // Process SCARS
  if (scars && Array.isArray(scars) && scars.length > 0) {
    console.log("Processing scars:", scars);
    scars.forEach((s: string) => {
      const mapped = findKey(SCAR_PROMPT_MAP, s);
      if (mapped && mapped !== s) {
        bodyModParts.push(mapped);
      } else if (s) {
        bodyModParts.push(`${s} scar`);
      }
    });
  }
  
  // Process CYBERNETIC IMPLANTS - critical for cyberpunk
  if (implants && Array.isArray(implants) && implants.length > 0) {
    console.log("Processing cybernetic implants:", implants);
    implants.forEach((i: string) => {
      const mapped = findKey(IMPLANT_PROMPT_MAP, i);
      if (mapped && mapped !== i) {
        bodyModParts.push(mapped);
      } else if (i) {
        bodyModParts.push(`${i} cybernetic implant, chrome augmentation`);
      }
    });
  }
  
  // Process PROSTHETICS
  if (prosthetics && Array.isArray(prosthetics) && prosthetics.length > 0) {
    console.log("Processing prosthetics:", prosthetics);
    prosthetics.forEach((p: string) => {
      const mapped = findKey(PROSTHETIC_PROMPT_MAP, p);
      if (mapped && mapped !== p) {
        bodyModParts.push(mapped);
      } else if (p) {
        bodyModParts.push(`${p} prosthetic`);
      }
    });
  }
  
  // Process MUTATIONS
  if (mutations && Array.isArray(mutations) && mutations.length > 0) {
    console.log("Processing mutations:", mutations);
    mutations.forEach((m: string) => {
      const mapped = findKey(MUTATION_PROMPT_MAP, m);
      if (mapped && mapped !== m) {
        bodyModParts.push(mapped);
      } else if (m) {
        bodyModParts.push(`${m} mutation`);
      }
    });
  }
  
  // Process CLOTHING STYLE override
  let clothingOverride = '';
  if (clothingStyle && clothingStyle !== 'genre_default') {
    const styleDesc = findKey(CLOTHING_STYLE_PROMPT_MAP, clothingStyle);
    if (styleDesc && styleDesc !== clothingStyle) {
      clothingOverride = styleDesc;
    } else if (clothingStyle) {
      clothingOverride = `${clothingStyle} fashion style`;
    }
    console.log("Clothing style override:", clothingOverride);
  }
  
  // Process clothing details
  if (clothingDetails && Array.isArray(clothingDetails) && clothingDetails.length > 0) {
    clothingOverride += (clothingOverride ? ', ' : '') + clothingDetails.join(', ');
  }
  
  console.log("Body modifications found:", bodyModParts.length, "items");
  
  // Handle expression from environment mood
  let expression = 'calm neutral expression';
  if (environmentContext?.mood) {
    expression = EMOTION_STYLES[environmentContext.mood] || EMOTION_STYLES.neutral;
  }
  
  // Select appropriate background from genre
  let background = '';
  if (environmentContext?.location) {
    background = environmentContext.location;
    if (environmentContext.weather) {
      background += `, ${environmentContext.weather} weather`;
    }
    if (environmentContext.timeOfDay) {
      background += `, ${environmentContext.timeOfDay} lighting`;
    }
  } else {
    // Pick random genre-appropriate background
    background = genreConfig.backgrounds[Math.floor(Math.random() * genreConfig.backgrounds.length)];
  }
  
  // Add combat context if applicable
  if (environmentContext?.isInCombat) {
    expression = 'intense combat-ready expression, focused determined eyes';
  }
  
  // Determine final clothing - use override if specified, otherwise use role/genre default
  const finalClothing = clothingOverride || roleStyle;
  
  // Build the realistic portrait prompt with all character creation settings
  // CRITICAL: Body modifications MUST appear early in the prompt for FLUX to render them
  const promptParts = [
    // Core realistic photo style with knee-to-head framing
    PORTRAIT_STYLE_BASE,
    
    // Character identity - EXPLICIT for better prompt following
    `portrait of ${ageDesc} ${genderDesc}`,
    `body type: ${buildDesc}`,
    heightDesc,
    `skin: ${skinDesc}`,
    `hair: ${hairColorDesc}, ${hairStyleDesc}`,
    `eyes: ${eyeColorDesc}`,
  ];
  
  // BODY MODIFICATIONS - MUST be early in prompt for AI to render them
  // Split into visible facial/body mods for emphasis
  if (bodyModParts.length > 0) {
    // Categorize by visibility
    const facialMods = bodyModParts.filter(m => 
      m.toLowerCase().includes('face') || 
      m.toLowerCase().includes('eyebrow') || 
      m.toLowerCase().includes('nose') || 
      m.toLowerCase().includes('lip') || 
      m.toLowerCase().includes('tongue') || 
      m.toLowerCase().includes('ear') ||
      m.toLowerCase().includes('septum') ||
      m.toLowerCase().includes('monroe') ||
      m.toLowerCase().includes('labret') ||
      m.toLowerCase().includes('jaw') ||
      m.toLowerCase().includes('eye') ||
      m.toLowerCase().includes('cheek')
    );
    
    const bodyMods = bodyModParts.filter(m => !facialMods.includes(m));
    
    // Add facial modifications prominently
    if (facialMods.length > 0) {
      promptParts.push(`CLEARLY VISIBLE on face: ${facialMods.join(', ')}`);
    }
    
    // Add body modifications
    if (bodyMods.length > 0) {
      promptParts.push(`VISIBLE body features: ${bodyMods.join(', ')}`);
    }
    
    console.log("Facial mods emphasized:", facialMods.length, "Body mods:", bodyMods.length);
  }
  
  // Character details (other features)
  if (detailParts.length > 0) {
    promptParts.push(`additional features: ${detailParts.join(', ')}`);
  }
  
  // Add remaining prompt parts
  promptParts.push(
    // Clothing/gear based on class, genre, or custom style
    `clothing and gear: ${finalClothing}`,
    
    // Expression
    `expression: ${expression}`,
    
    // Portrait hints from class selection
    portraitHints?.join(', ') || '',
    
    // Genre-specific environment background
    `${genre} genre setting, realistic environment background: ${background}`,
    
    // Depth and atmosphere
    'shallow depth of field, background slightly blurred',
    'natural atmospheric lighting',
  );
  
  const finalPrompt = promptParts.filter(Boolean).join(', ');
  console.log("Built prompt length:", finalPrompt.length);
  console.log("Final prompt preview:", finalPrompt.substring(0, 600) + "...");
  
  return {
    prompt: finalPrompt,
    negative_prompt: PORTRAIT_NEGATIVE,
  };
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
    const { name, appearance, characterClass, genre, emotionVariant, customPrompt, gender } = body;

    console.log("Portrait generation request for:", name || "Unknown");
    console.log("Genre:", genre, "Class:", characterClass, "Emotion:", emotionVariant);
    
    let promptData;
    
    // Check if this is a gameplay regeneration with locked reference
    if (customPrompt || gender) {
      console.log("Using locked character reference for portrait generation");
      promptData = buildLockedReferencePrompt(body);
    } else {
      // Legacy mode - parse from appearance string
      promptData = buildLegacyPrompt(body);
    }

    console.log("Final prompt:", promptData.prompt.substring(0, 400) + "...");

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
