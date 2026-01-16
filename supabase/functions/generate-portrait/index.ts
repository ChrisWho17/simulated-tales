import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// GAME-INTEGRATED PORTRAIT SYSTEM
// Generates character portraits from knee to head with blurred genre backgrounds
// =============================================================================

// Genre environments and default clothing
const GENRES: Record<string, { bg: string; clothes: string }> = {
  // Fantasy
  fantasy: { bg: 'medieval tavern, candlelight, warm wood tones', clothes: 'leather armor, adventurer gear' },
  medieval: { bg: 'castle interior, torchlight, stone walls', clothes: 'period medieval tunic and cloak' },
  dark_fantasy: { bg: 'dark cathedral, moonlight through stained glass', clothes: 'dark worn armor, tattered cloak' },
  high_fantasy: { bg: 'elven palace, magical light, crystalline', clothes: 'elegant enchanted robes' },
  grimdark: { bg: 'muddy battlefield, overcast sky', clothes: 'blood-stained plate armor' },
  
  // Sci-Fi
  scifi: { bg: 'spaceship bridge, blue LED lighting, screens', clothes: 'sleek space uniform' },
  sci_fi: { bg: 'space station corridor, cool lighting', clothes: 'utility jumpsuit with tech' },
  space_opera: { bg: 'starship interior, dramatic lighting', clothes: 'captain uniform with insignia' },
  cyberpunk: { bg: 'neon-lit alley, rain, pink and cyan lights', clothes: 'tech jacket, chrome accessories' },
  
  // Horror
  horror: { bg: 'abandoned building, harsh shadows, flickering light', clothes: 'everyday clothes, worn' },
  vampire: { bg: 'gothic manor, candlelight, red velvet', clothes: 'elegant Victorian coat' },
  lovecraft: { bg: '1920s study, gas lamp, leather books', clothes: 'tweed jacket, period attire' },
  zombie: { bg: 'barricaded room, harsh light', clothes: 'tactical survival gear' },
  
  // Western/Historical
  western: { bg: 'old west saloon, warm oil lamp', clothes: 'cowboy hat, duster coat' },
  pirate: { bg: 'ship cabin, lantern light, ocean view', clothes: 'pirate coat, bandana' },
  victorian: { bg: 'London street, gas lamps, fog', clothes: 'Victorian formal wear' },
  steampunk: { bg: 'brass workshop, steam, gears', clothes: 'Victorian with goggles and gears' },
  samurai: { bg: 'Japanese castle, paper lanterns', clothes: 'samurai armor or hakama' },
  wuxia: { bg: 'mountain temple, mist, lanterns', clothes: 'flowing martial arts robes' },
  renaissance: { bg: 'Italian palazzo, golden light', clothes: 'Renaissance doublet and cape' },
  ancient: { bg: 'Roman forum, Mediterranean sun', clothes: 'toga or gladiator armor' },
  
  // Modern/Contemporary
  modern: { bg: 'urban environment, natural daylight', clothes: 'casual modern clothes' },
  contemporary: { bg: 'city street, natural light', clothes: 'contemporary fashion' },
  noir: { bg: 'rain-slicked street, neon signs, shadows', clothes: 'sharp suit, trench coat' },
  mystery: { bg: 'detective office, venetian blind shadows', clothes: 'detective attire' },
  spy: { bg: 'luxury casino, elegant lighting', clothes: 'tailored formal suit' },
  crime: { bg: 'dark alley, neon, harsh shadows', clothes: 'street clothes, leather jacket' },
  
  // Post-Apocalyptic
  postapoc: { bg: 'wasteland ruins, harsh desert sun', clothes: 'scavenged tactical gear' },
  post_apocalyptic: { bg: 'collapsed city, dust haze', clothes: 'improvised armor' },
  fallout: { bg: 'retro bunker, fluorescent lights', clothes: 'vault suit or wasteland gear' },
  
  // War
  war: { bg: 'military base, harsh lighting', clothes: 'combat uniform, tactical vest' },
  ww1: { bg: 'WWI trench, overcast, mud', clothes: 'WWI uniform, greatcoat' },
  ww2: { bg: 'WWII bunker, harsh light', clothes: 'WWII military uniform' },
  cold_war: { bg: 'Soviet office, cold light', clothes: 'Cold War era suit' },
  
  // Other
  superhero: { bg: 'city rooftop at night, dramatic', clothes: 'hero costume with emblem' },
  supervillain: { bg: 'dark lair, dramatic underlighting', clothes: 'villain costume' },
  mecha: { bg: 'mech hangar, industrial', clothes: 'pilot suit' },
  dystopia: { bg: 'oppressive city, gray concrete', clothes: 'utilitarian uniform' },
  survival: { bg: 'wilderness, natural light', clothes: 'outdoor survival gear' },
  romance: { bg: 'elegant setting, soft golden light', clothes: 'formal elegant attire' },
  comedy: { bg: 'bright colorful environment', clothes: 'casual colorful clothes' },
  heist: { bg: 'museum at night, dramatic shadows', clothes: 'tactical black outfit' },
  mythology: { bg: 'ancient temple, divine light', clothes: 'mythic robes or armor' },
  urban_fantasy: { bg: 'modern city with magical hints', clothes: 'modern with hidden magical items' },
  slice_of_life: { bg: 'cozy home, warm light', clothes: 'comfortable everyday wear' },
};

// Role-specific clothing that overrides genre defaults
const ROLE_CLOTHES: Record<string, string> = {
  // Fantasy
  knight: 'polished plate armor, sword at hip, heraldic tabard',
  paladin: 'blessed white and gold armor, holy symbols',
  warrior: 'battle-worn heavy armor, weapons on back',
  barbarian: 'fur and leather, tribal markings, bare arms',
  rogue: 'dark leather armor, hood, visible daggers',
  assassin: 'black leather, hooded cloak, hidden blades',
  mage: 'mystical robes with arcane symbols, staff',
  wizard: 'long robes, pointy hat, spellbook',
  warlock: 'dark robes, eldritch symbols, glowing eyes',
  sorcerer: 'elegant robes with magical energy effects',
  cleric: 'religious vestments, holy symbol, blessed armor',
  druid: 'natural robes with leaves and vines, wooden staff',
  monk: 'simple robes, bare hands, prayer beads',
  ranger: 'green cloak, leather armor, bow and quiver',
  archer: 'light armor, quiver on back, bow',
  bard: 'colorful performer clothes, musical instrument',
  necromancer: 'black robes, skull motifs, dark magic effects',
  
  // Cyberpunk
  solo: 'tactical jacket with armor plates, cybernetic arm, weapons',
  netrunner: 'tech hoodie with LED strips, neural interface on temple',
  fixer: 'expensive street fashion, chrome jewelry, sleek suit',
  techie: 'work coveralls with tools, cybernetic eye lens',
  nomad: 'dusty leather jacket, road-worn boots, goggles',
  corpo: 'corporate suit, subtle chrome implants, expensive watch',
  
  // Sci-Fi
  captain: 'command uniform with rank insignia, confident pose',
  bounty_hunter: 'worn bounty hunter armor, multiple weapons',
  smuggler: 'roguish spacer clothes, blaster at hip',
  pilot: 'flight suit with patches and gear',
  
  // Horror/Investigation
  investigator: 'period suit, overcoat, investigation tools',
  survivor: 'everyday clothes with survival modifications',
  hunter: 'tactical gear with specialized monster-hunting weapons',
  detective: 'trench coat, fedora, sharp eyes',
  
  // Western
  gunslinger: 'cowboy hat, duster coat, dual revolvers in holsters',
  sheriff: 'star badge on vest, cowboy hat, rifle',
  outlaw: 'dusty worn clothes, bandana, weathered look',
  
  // Military
  soldier: 'military combat uniform, tactical gear, rifle',
  medic: 'combat medic uniform, medical pouches',
  sniper: 'ghillie elements, precision rifle',
  officer: 'military officer uniform, command presence',
  spec_ops: 'black tactical gear, advanced weapons',
  
  // General
  mercenary: 'mixed tactical gear, multiple weapons',
  noble: 'expensive fine clothing, jewelry, regal bearing',
  scholar: 'academic robes, glasses, books',
  merchant: 'quality traveling clothes, merchant tools',
  thief: 'dark practical clothes, lock picks visible',
};

// Skin tone descriptions
const SKIN_TONES: Record<string, string> = {
  porcelain: 'very pale porcelain skin',
  ivory: 'pale ivory skin',
  fair: 'fair skin',
  light: 'light skin',
  medium: 'medium skin tone',
  olive: 'olive skin tone',
  tan: 'tanned skin',
  caramel: 'caramel brown skin',
  brown: 'brown skin',
  'dark brown': 'dark brown skin',
  ebony: 'deep ebony skin',
  'pale blue': 'pale blue skin',
  green: 'green-tinted skin',
  purple: 'purple-tinted skin',
  gray: 'gray skin',
  silver: 'silvery skin',
};

// Build prompt from character data
function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, height, skinTone, hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, tattooStyle, scars, prosthetics, implants, mutations,
    clothingStyle, clothingDetails,
  } = body;

  // Get genre data
  const genreKey = (genre || 'fantasy').toLowerCase().replace(/[\s-]/g, '_');
  const genreData = GENRES[genreKey] || GENRES.fantasy;
  
  // Get role-specific clothing
  const roleKey = (characterClass || '').toLowerCase().replace(/[\s-]/g, '_');
  const roleClothes = ROLE_CLOTHES[roleKey];
  
  // User custom description takes priority
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  const hasUserClothing = /wearing|dressed|outfit|armor|suit|jacket|coat|dress|robe|uniform/.test(userDesc.toLowerCase());
  
  // Build description parts
  const parts: string[] = [];
  
  // === SUBJECT ===
  // Ethnicity defaults to American Caucasian unless specified
  const eth = ethnicity || nationality || origin || 'American Caucasian';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  const ageNum = age ? `${age} year old` : 'adult';
  parts.push(`${ageNum} ${eth} ${genderWord}`);
  
  // === PHYSICAL ===
  if (build && build !== 'average') parts.push(`${build} build`);
  if (height && height !== 'average') parts.push(`${height} height`);
  
  // Skin
  const skinDesc = SKIN_TONES[skinTone?.toLowerCase()] || (skinTone ? `${skinTone} skin` : '');
  if (skinDesc) parts.push(skinDesc);
  
  // Face
  if (faceShape) parts.push(`${faceShape} face`);
  if (eyeColor) parts.push(`${eyeColor} eyes`);
  
  // Hair
  if (hairColor || hairStyle) {
    parts.push(`${hairColor || ''} ${hairStyle || ''} hair`.trim());
  }
  
  // === FEATURES ===
  const features: string[] = [];
  if (details?.length) features.push(...details);
  if (distinguishingFeatures?.length) features.push(...distinguishingFeatures);
  if (accessories?.length) features.push(...accessories.map((a: string) => `wearing ${a}`));
  if (features.length) parts.push(features.join(', '));
  
  // === BODY MODIFICATIONS ===
  if (tattoos?.length) {
    const style = tattooStyle ? `${tattooStyle} style ` : '';
    parts.push(`${style}tattoos on ${tattoos.join(' and ')}`);
  }
  if (piercings?.length) parts.push(`piercings on ${piercings.join(' and ')}`);
  if (scars?.length) parts.push(`scars on ${scars.join(' and ')}`);
  if (implants?.length) parts.push(`cybernetic implants: ${implants.join(', ')}`);
  if (prosthetics?.length) parts.push(`prosthetics: ${prosthetics.join(', ')}`);
  if (mutations?.length) parts.push(`mutations: ${mutations.join(', ')}`);
  
  // === CLOTHING ===
  // Priority: user description > explicit clothingDetails > role-specific > genre default
  let clothes = '';
  if (hasUserClothing) {
    // User specified in description, will be added via userDesc
    clothes = '';
  } else if (clothingDetails?.length) {
    clothes = `wearing ${clothingDetails.join(', ')}`;
  } else if (clothingStyle && clothingStyle !== 'genre_default') {
    clothes = `wearing ${clothingStyle} style clothing`;
  } else if (roleClothes) {
    clothes = `wearing ${roleClothes}`;
  } else {
    clothes = `wearing ${genreData.clothes}`;
  }
  if (clothes) parts.push(clothes);
  
  // === ROLE ===
  if (characterClass && !hasUserClothing) {
    parts.push(characterClass);
  }
  
  // === USER CUSTOM DESCRIPTION ===
  if (userDesc) parts.push(userDesc);
  
  // === COMPOSE FINAL PROMPT ===
  const subject = parts.join(', ');
  
  // Wide lens, knee-to-head framing, looking at camera
  const prompt = [
    // Framing - wide lens, 3/4 body
    'Wide angle lens portrait',
    'three-quarter body shot from knees to head',
    'subject centered in frame',
    'body slightly angled',
    'face and eyes looking directly at camera',
    // Subject description
    subject,
    // Background
    `background: ${genreData.bg}`,
    'background softly blurred',
    // Quality
    'photorealistic',
    'sharp focus on subject',
    'professional photography',
    '8K quality',
  ].join(', ');
  
  console.log('Portrait prompt:', prompt);
  
  return {
    prompt,
    negative: 'anime, cartoon, 3d render, painting, illustration, looking away, profile, side view, close-up, headshot only, bust only, full body, feet visible, cropped, deformed, extra limbs, bad anatomy, bad hands, bad face, blurry, low quality',
  };
}

// Generate image with Together API
async function generateImage(prompt: string, negative: string): Promise<string> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) throw new Error("TOGETHER_API_KEY not configured");

  const response = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-dev",
      prompt,
      negative_prompt: negative,
      width: 768,
      height: 1024,
      steps: 28,
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Together API error:", error);
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  const base64 = data.data?.[0]?.b64_json;
  if (!base64) throw new Error("No image in response");

  return `data:image/png;base64,${base64}`;
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Portrait request:", body.name || "character", "| Genre:", body.genre, "| Class:", body.characterClass);

    // Handle legacy custom prompt requests
    if (body.customPrompt && !body.gender) {
      const imageUrl = await generateImage(body.customPrompt, 'anime, cartoon, deformed');
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, negative } = buildPrompt(body);
    const imageUrl = await generateImage(prompt, negative);

    console.log("Portrait generated for:", body.name || "character");
    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
