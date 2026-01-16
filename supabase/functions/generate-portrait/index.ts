import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre-specific styling with backgrounds and costume descriptions
const GENRE_STYLES: Record<string, { background: string; costume: string; lighting: string }> = {
  fantasy: { 
    background: 'medieval tavern with wooden beams and candlelight',
    costume: 'leather armor, fantasy robes, medieval adventurer garb',
    lighting: 'warm torchlight, mystical glow'
  },
  medieval: { 
    background: 'stone castle corridor with torches',
    costume: 'chainmail, surcoat, medieval noble attire',
    lighting: 'dramatic candlelight shadows'
  },
  dark_fantasy: { 
    background: 'gothic cathedral with stained glass',
    costume: 'dark ornate armor, black robes, gothic attire with silver accents',
    lighting: 'moonlight through stained glass, eerie glow'
  },
  high_fantasy: { 
    background: 'magical elven palace with floating crystals',
    costume: 'elegant elven robes, enchanted armor, magical accessories',
    lighting: 'ethereal magical luminescence'
  },
  cyberpunk: { 
    background: 'neon-lit rain-soaked megacity alley with holographic ads',
    costume: 'tactical combat vest, cybernetic implants visible, techwear jacket, combat boots, LED accents, mercenary tactical gear',
    lighting: 'harsh neon pink and cyan, rain reflections'
  },
  scifi: { 
    background: 'sleek spaceship corridor with glowing panels',
    costume: 'futuristic jumpsuit, space crew uniform, tech accessories',
    lighting: 'cool blue LED ambient'
  },
  sci_fi: { 
    background: 'orbital space station observation deck',
    costume: 'advanced sci-fi combat suit, utility belt, tech visor',
    lighting: 'starlight and holographic displays'
  },
  space_opera: { 
    background: 'grand starship bridge with view of nebula',
    costume: 'elegant space captain uniform, flowing cape, ornate medals',
    lighting: 'dramatic space lighting with nebula colors'
  },
  horror: { 
    background: 'abandoned asylum corridor with peeling walls',
    costume: 'torn clothing, survival gear, bloodstained attire',
    lighting: 'harsh flashlight beam, deep shadows'
  },
  vampire: { 
    background: 'Victorian gothic manor with red velvet',
    costume: 'elegant Victorian coat, high collar, gothic aristocrat attire',
    lighting: 'candlelit crimson atmosphere'
  },
  zombie: { 
    background: 'barricaded survivor camp with debris',
    costume: 'weathered survivor clothes, tactical vest, makeshift armor',
    lighting: 'gritty overcast, emergency lights'
  },
  western: { 
    background: 'dusty saloon with swinging doors',
    costume: 'cowboy hat, leather duster, gun belt, boots with spurs',
    lighting: 'golden hour desert sun'
  },
  pirate: { 
    background: 'wooden ship deck with sails and rigging',
    costume: 'pirate coat, tricorn hat, sash, cutlass belt, sea-worn boots',
    lighting: 'sunset over ocean, lantern glow'
  },
  victorian: { 
    background: 'foggy gaslit London street',
    costume: 'tailored Victorian suit, top hat, walking cane, pocket watch',
    lighting: 'atmospheric fog with gaslight'
  },
  steampunk: { 
    background: 'brass workshop with gears and steam pipes',
    costume: 'goggles, brass gadgets, leather corset/vest, Victorian steampunk attire',
    lighting: 'warm amber industrial lighting'
  },
  noir: { 
    background: 'rain-slicked city street at night',
    costume: 'trench coat, fedora hat, 1940s detective attire',
    lighting: 'dramatic film noir shadows, streetlight'
  },
  mystery: { 
    background: 'private detective office with case files',
    costume: 'smart casual investigator clothes, reading glasses',
    lighting: 'desk lamp creating dramatic shadows'
  },
  spy: { 
    background: 'luxury casino with chandeliers',
    costume: 'tailored black tactical suit, elegant formal spy attire',
    lighting: 'glamorous golden casino lighting'
  },
  crime: { 
    background: 'gritty urban alley with graffiti',
    costume: 'street clothes, leather jacket, urban tactical gear',
    lighting: 'harsh streetlight, urban night'
  },
  postapoc: { 
    background: 'wasteland ruins with rusted vehicles',
    costume: 'scavenged armor, gas mask, post-apocalyptic survivor gear, makeshift weapons',
    lighting: 'dusty orange apocalyptic sunset'
  },
  post_apocalyptic: { 
    background: 'collapsed city overgrown with vegetation',
    costume: 'patched together survival gear, scavenged military equipment',
    lighting: 'overcast wasteland atmosphere'
  },
  war: { 
    background: 'military forward operating base',
    costume: 'full military combat uniform, body armor, tactical gear',
    lighting: 'harsh military lighting'
  },
  ww2: { 
    background: 'WWII bunker with sandbags',
    costume: 'period-accurate military uniform, helmet, combat gear',
    lighting: 'gritty wartime atmosphere'
  },
  superhero: { 
    background: 'city rooftop at night with skyline',
    costume: 'superhero costume with cape, mask, emblem',
    lighting: 'dramatic moonlight and city lights'
  },
  modern: { 
    background: 'modern urban cityscape',
    costume: 'contemporary casual clothes, modern fashion',
    lighting: 'natural daylight'
  },
  modern_life: { 
    background: 'contemporary city sidewalk with shops',
    costume: 'everyday modern clothing, casual style',
    lighting: 'bright natural light'
  },
  contemporary: { 
    background: 'trendy urban cafe interior',
    costume: 'fashionable modern outfit, current trends',
    lighting: 'warm cafe ambiance'
  },
  slice_of_life: { 
    background: 'cozy modern apartment living room',
    costume: 'comfortable casual home clothes',
    lighting: 'soft natural window light'
  },
  romance: { 
    background: 'elegant ballroom or garden venue',
    costume: 'formal evening wear, elegant dress or suit',
    lighting: 'romantic soft golden hour'
  },
  urban_fantasy: { 
    background: 'modern city alley with magical elements',
    costume: 'modern clothes with hidden magical accessories, subtle supernatural hints',
    lighting: 'urban night with magical glow'
  },
};

function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, height, skinTone, 
    hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, tattooStyle, scars, implants, prosthetics, mutations,
    // Body shape
    bustSize, hipWidth, muscleDefinition,
  } = body;

  const desc: string[] = [];
  
  // Age defaults to 18
  const charAge = age || 18;
  
  // Demographics
  const eth = ethnicity || nationality || origin || 'American Caucasian';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  desc.push(`${charAge} year old ${eth} ${genderWord}`);
  
  // Body shape for female characters - breasts and butt only
  if (gender === 'female' || gender === 'other') {
    // Bust sizes: small/medium/large/extra
    const bustMap: Record<string, string> = {
      'small': 'small breasts',
      'medium': 'medium breasts',
      'large': 'large breasts',
      'extra': 'extra large breasts',
    };
    const bust = bustSize || 'medium';
    const bustDesc = bustMap[bust.toLowerCase()] || `${bust} breasts`;
    desc.push(bustDesc);
    
    // Hip sizes: small/medium/large/extra
    const hipMap: Record<string, string> = {
      'small': 'small butt',
      'medium': 'medium butt',
      'large': 'large butt',
      'extra': 'extra large butt',
    };
    const hip = hipWidth || 'medium';
    const hipDesc = hipMap[hip.toLowerCase()] || `${hip} butt`;
    desc.push(hipDesc);
  }
  
  // Build and muscle
  if (build) desc.push(`${build} body`);
  if (muscleDefinition && muscleDefinition !== 'none' && muscleDefinition !== 'toned') {
    desc.push(`${muscleDefinition} muscles`);
  }
  if (height) desc.push(`${height} height`);
  if (skinTone) desc.push(`${skinTone} skin`);
  
  // Face
  if (faceShape) desc.push(`${faceShape} face`);
  if (eyeColor) desc.push(`${eyeColor} eyes`);
  if (hairColor || hairStyle) {
    desc.push(`${hairColor || ''} ${hairStyle || 'styled'} hair`.trim());
  }
  
  // Features and accessories
  const allFeatures: string[] = [];
  if (details?.length) allFeatures.push(...details);
  if (distinguishingFeatures?.length) allFeatures.push(...distinguishingFeatures);
  if (accessories?.length) allFeatures.push(...accessories);
  if (allFeatures.length) desc.push(allFeatures.join(', '));
  
  // Body modifications
  if (tattoos?.length) {
    const style = tattooStyle ? `${tattooStyle} style ` : '';
    desc.push(`${style}tattoos`);
  }
  if (piercings?.length) desc.push('piercings');
  if (scars?.length) desc.push('scars');
  if (implants?.length) desc.push('cybernetic implants');
  if (prosthetics?.length) desc.push('prosthetic limbs');
  if (mutations?.length) desc.push('mutations');
  
  // Role/class
  if (characterClass) desc.push(characterClass);
  
  // User's custom description - HIGH PRIORITY for clothing/appearance overrides
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  
  // Get genre styling
  const genreKey = (genre || 'fantasy').toLowerCase().replace(/[\s-]/g, '_');
  const style = GENRE_STYLES[genreKey] || GENRE_STYLES.modern;
  
  const character = desc.join(', ');
  
  console.log('Portrait for:', name, '| Genre:', genre);
  console.log('Genre key:', genreKey);
  console.log('Genre style:', JSON.stringify(style));
  console.log('Additional details:', userDesc);
  console.log('Full description:', character);
  
  // Build prompt - user custom description takes priority over genre costume if specified
  // Put user description FIRST for maximum effect
  let clothingDesc = style.costume;
  if (userDesc) {
    // If user specified clothing/outfit, use their description prominently
    clothingDesc = `${userDesc}, ${style.costume}`;
  }
  
  const prompt = `Semi-realistic portrait, realistic skin texture with pores and subsurface scattering, soft cinematic lighting, stylized anime-inspired eyes, vibrant hair, clean line art, 4K detailed render, three-quarter body from knees to head, ${character}, wearing ${clothingDesc}, background: ${style.background}, ${style.lighting}`;
  
  console.log('Final prompt:', prompt);
  
  return {
    prompt,
    negative: 'headshot, bust shot, close-up, face only, shoulders up, full body with feet, casual modern clothes, t-shirt, jeans, deformed, bad anatomy, blurry, low quality',
  };
}

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
    console.error("API error:", error);
    throw new Error(`Generation failed: ${response.status}`);
  }

  const data = await response.json();
  const base64 = data.data?.[0]?.b64_json;
  if (!base64) throw new Error("No image returned");

  return `data:image/png;base64,${base64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
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
