import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Immersive genre styles - vivid, evocative descriptions that capture the soul of each genre
const GENRE_STYLES: Record<string, { background: string; clothing: string; vibe: string }> = {
  // FANTASY
  fantasy: { 
    background: 'epic fantasy landscape with ancient ruins and mystical fog',
    clothing: 'battle-worn leather armor with enchanted runes, weathered traveling cloak, adventurer gear with pouches and straps',
    vibe: 'legendary hero ready for adventure'
  },
  medieval: { 
    background: 'torch-lit stone castle halls with tapestries and heraldic banners',
    clothing: 'historically accurate medieval garb - chainmail, surcoats, leather jerkins, period-appropriate tunics and cloaks',
    vibe: 'authentic medieval presence'
  },
  dark_fantasy: { 
    background: 'cursed gothic realm with twisted spires and blood-red sky',
    clothing: 'dark ornate armor with skull motifs, black leather and chains, corrupted holy symbols, battle-scarred plate',
    vibe: 'dark champion touched by shadow'
  },
  high_fantasy: { 
    background: 'crystalline magical citadel floating among clouds',
    clothing: 'magnificent enchanted robes with glowing sigils, elven-crafted armor, royal magical vestments',
    vibe: 'powerful arcane nobility'
  },
  
  // SCI-FI
  cyberpunk: { 
    background: 'rain-soaked neon megacity with holographic advertisements and flying vehicles',
    clothing: 'cutting-edge techwear with integrated circuitry, LED-lit jacket, tactical cyber-vest, augmented reality visor, neural interface ports visible on temples',
    vibe: 'chrome-augmented street samurai with visible cybernetic enhancements'
  },
  scifi: { 
    background: 'sleek starship bridge with holographic displays and viewport to stars',
    clothing: 'form-fitting flight suit with rank insignia, integrated life support, futuristic military uniform with tech accessories',
    vibe: 'seasoned space explorer'
  },
  sci_fi: { 
    background: 'advanced space station with panoramic view of nebula',
    clothing: 'high-tech jumpsuit with glowing accents, modular armor plates, wrist-mounted computer interface',
    vibe: 'interstellar professional'
  },
  space_opera: { 
    background: 'grand imperial starship throne room with galactic map hologram',
    clothing: 'dramatic flowing cape over ornate space armor, ceremonial uniform with medals, regal cosmic attire',
    vibe: 'galactic hero of legend'
  },
  
  // HORROR
  horror: { 
    background: 'abandoned asylum corridor with flickering lights and peeling walls',
    clothing: 'blood-stained survivor clothes, torn jacket, practical boots, flashlight holster, bandages',
    vibe: 'traumatized survivor of unspeakable things'
  },
  vampire: { 
    background: 'opulent Victorian manor with velvet drapes and candlelit shadows',
    clothing: 'aristocratic gothic finery - high collar cape, ornate waistcoat, antique jewelry, pale elegant formal wear',
    vibe: 'seductive eternal predator'
  },
  zombie: { 
    background: 'barricaded safe house with boarded windows and emergency supplies',
    clothing: 'post-outbreak tactical gear - cargo pants, combat boots, improvised armor, weapons strapped everywhere',
    vibe: 'hardened apocalypse survivor'
  },
  
  // HISTORICAL
  western: { 
    background: 'dusty frontier town at high noon with saloon and hitching posts',
    clothing: 'weathered leather duster, wide-brim cowboy hat, gun belt with revolver, spurred boots, bandana',
    vibe: 'dangerous gunslinger with a reputation'
  },
  pirate: { 
    background: 'deck of a galleon at sea with sails billowing and cannons ready',
    clothing: 'captain coat with gold trim, tricorn hat, cutlass at hip, pistol in belt, sea-worn leather boots',
    vibe: 'infamous pirate captain'
  },
  victorian: { 
    background: 'fog-shrouded London street with gas lamps and cobblestones',
    clothing: 'impeccable Victorian formal wear - top hat, tailored coat, cravat, walking cane, period-perfect attire',
    vibe: 'mysterious Victorian figure'
  },
  steampunk: { 
    background: 'brass-and-copper workshop filled with whirring clockwork machines',
    clothing: 'leather corset or vest with brass buckles, aviator goggles, mechanical arm prosthetic, pocket watch chains, cog-adorned accessories',
    vibe: 'mad inventor genius'
  },
  ww2: { 
    background: 'war-torn European battlefield with trenches and smoke',
    clothing: 'authentic WWII military uniform with accurate insignia, combat webbing, period weapons, dog tags',
    vibe: 'battle-hardened soldier'
  },
  
  // NOIR & THRILLER
  noir: { 
    background: 'rain-slicked 1940s city alley with neon signs reflected in puddles',
    clothing: 'classic fedora and trench coat, suit and tie, cigarette smoke, world-weary elegance',
    vibe: 'cynical private eye who has seen too much'
  },
  spy: { 
    background: 'Monte Carlo casino with chandeliers and high-stakes tables',
    clothing: 'immaculately tailored tuxedo or evening gown, concealed weapon, luxury watch, deadly elegance',
    vibe: 'lethal secret agent'
  },
  crime: { 
    background: 'gritty inner-city street corner at night with graffiti walls',
    clothing: 'street boss attire - expensive streetwear, gold chains, designer jacket, intimidating presence',
    vibe: 'dangerous criminal mastermind'
  },
  mystery: { 
    background: 'cluttered detective office with case files and smoke',
    clothing: 'rumpled but quality suit, loosened tie, investigator badge, notepad, observant eyes',
    vibe: 'brilliant investigator'
  },
  
  // POST-APOCALYPTIC
  postapoc: { 
    background: 'nuclear wasteland with rusted vehicles and collapsed buildings',
    clothing: 'scavenged tactical gear, gas mask around neck, patchwork armor from scrap metal, radiation badges, makeshift weapons',
    vibe: 'wasteland road warrior'
  },
  post_apocalyptic: { 
    background: 'overgrown city ruins reclaimed by nature',
    clothing: 'survivalist outfit with handmade leather armor, tribal modifications, salvaged military gear, practical and brutal',
    vibe: 'apex predator of the wastes'
  },
  
  // MODERN & CONTEMPORARY
  modern: { 
    background: 'sleek modern city with glass skyscrapers',
    clothing: 'stylish contemporary outfit - designer clothes, current fashion trends, urban sophistication',
    vibe: 'confident city dweller'
  },
  modern_life: { 
    background: 'trendy urban cafe or apartment',
    clothing: 'authentic everyday fashion - well-chosen casual wear, personal style expression',
    vibe: 'relatable modern person'
  },
  contemporary: { 
    background: 'fashionable city district',
    clothing: 'high-fashion contemporary look - runway-inspired, trend-forward, statement pieces',
    vibe: 'fashion-conscious urbanite'
  },
  slice_of_life: { 
    background: 'warm cozy home interior with personal touches',
    clothing: 'comfortable authentic casual wear - loungewear, favorite outfit, personal and real',
    vibe: 'warm approachable person'
  },
  romance: { 
    background: 'sunset rooftop terrace with city lights below',
    clothing: 'stunning date night attire - elegant dress or sharp suit, alluring and sophisticated',
    vibe: 'irresistibly attractive'
  },
  
  // SPECIAL
  superhero: { 
    background: 'dramatic city rooftop with lightning storm',
    clothing: 'iconic superhero costume with bold colors, cape flowing, emblem on chest, powerful heroic design',
    vibe: 'legendary protector of the innocent'
  },
  urban_fantasy: { 
    background: 'modern city alley with magical graffiti glowing',
    clothing: 'street clothes with hidden magical artifacts, enchanted jewelry, tattoos that shimmer with power',
    vibe: 'secret magic wielder in the modern world'
  },
  war: { 
    background: 'forward operating base with military equipment',
    clothing: 'modern tactical military gear - plate carrier, combat helmet, rifle slung, full battle rattle',
    vibe: 'elite special forces operator'
  },
};

function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, skinTone, 
    hairColor, hairStyle, eyeColor,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, nationality, ethnicity, origin,
    tattoos, piercings, scars, implants, prosthetics, mutations,
    bustSize, hipWidth,
  } = body;

  const parts: string[] = [];
  
  // Basic character description
  const charAge = age || 18;
  const eth = ethnicity || nationality || origin || '';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  
  parts.push(`${charAge} year old ${eth} ${genderWord}`.trim());
  
  // Body
  if (gender === 'female' || gender === 'other') {
    if (bustSize) parts.push(`${bustSize} bust`);
    if (hipWidth) parts.push(`${hipWidth} hips`);
  }
  if (build) parts.push(`${build} build`);
  if (skinTone) parts.push(`${skinTone} skin`);
  
  // Face and hair
  if (eyeColor) parts.push(`${eyeColor} eyes`);
  if (hairColor || hairStyle) {
    parts.push(`${hairColor || ''} ${hairStyle || ''} hair`.trim());
  }
  
  // Modifications
  if (tattoos?.length) parts.push('tattoos');
  if (piercings?.length) parts.push('piercings');
  if (scars?.length) parts.push('scars');
  if (implants?.length) parts.push('cybernetic implants');
  if (prosthetics?.length) parts.push('prosthetics');
  if (mutations?.length) parts.push('mutations');
  
  // Role
  if (characterClass) parts.push(characterClass);
  
  // User custom description - this is the main styling input
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  if (userDesc) parts.push(userDesc);
  
  // Get genre style for background, clothing, and vibe
  const genreKey = (genre || 'modern').toLowerCase().replace(/[\s-]/g, '_');
  const style = GENRE_STYLES[genreKey] || GENRE_STYLES.modern;
  
  // Add clothing to character description
  parts.push(style.clothing);
  
  const character = parts.join(', ');
  
  // Build immersive prompt with vibe
  const prompt = `${character}, ${style.vibe}, ${style.background}, cinematic portrait, detailed, high quality`;
  
  console.log('Portrait prompt:', prompt);
  
  return {
    prompt,
    negative: 'blurry, watermark, text, low quality, amateur',
  };
}

async function generateImage(prompt: string, negative: string): Promise<string> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) throw new Error("TOGETHER_API_KEY not configured");

  console.log("Generating portrait with Together.ai (FLUX.1-dev)");

  const response = await fetch("https://api.together.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-dev",
      prompt: prompt,
      negative_prompt: negative,
      width: 832,
      height: 1216,
      steps: 28,
      n: 1,
      response_format: "b64_json"
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Together.ai error:", response.status, error);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later");
    }
    throw new Error(`Generation failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const b64Data = data.data?.[0]?.b64_json;
  
  if (!b64Data) {
    console.error("No image in response:", JSON.stringify(data));
    throw new Error("No image returned from Together.ai");
  }

  return `data:image/png;base64,${b64Data}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Custom prompt mode
    if (body.customPrompt && !body.gender) {
      const imageUrl = await generateImage(body.customPrompt, '');
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, negative } = buildPrompt(body);
    const imageUrl = await generateImage(prompt, negative);

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
