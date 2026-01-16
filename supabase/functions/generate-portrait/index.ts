import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre backgrounds
const BACKGROUNDS: Record<string, string> = {
  fantasy: 'medieval tavern interior',
  medieval: 'castle stone corridor',
  dark_fantasy: 'gothic cathedral',
  high_fantasy: 'magical elven palace',
  cyberpunk: 'neon-lit rainy city alley',
  scifi: 'spaceship corridor',
  sci_fi: 'space station',
  space_opera: 'starship bridge',
  horror: 'abandoned dark building',
  vampire: 'gothic manor',
  zombie: 'barricaded room',
  western: 'old west saloon',
  pirate: 'ship deck',
  victorian: 'foggy London street',
  steampunk: 'brass gear workshop',
  noir: 'rain-slicked night street',
  mystery: 'detective office',
  spy: 'luxury casino',
  crime: 'dark urban alley',
  postapoc: 'wasteland ruins',
  post_apocalyptic: 'collapsed city',
  war: 'military base',
  ww2: 'WWII bunker',
  superhero: 'city rooftop night',
  modern: 'modern urban street',
  modern_life: 'contemporary city sidewalk',
  contemporary: 'trendy urban cafe',
  slice_of_life: 'cozy modern apartment',
  romance: 'elegant venue',
  urban_fantasy: 'modern city street',
};

function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, height, skinTone, 
    hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, scars, implants, prosthetics,
    clothingStyle, clothingDetails,
  } = body;

  // Build character description
  const desc: string[] = [];
  
  // Demographics
  const eth = ethnicity || nationality || origin || 'American Caucasian';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  desc.push(`${age || 'adult'} year old ${eth} ${genderWord}`);
  
  // Body
  if (build) desc.push(`${build} body type`);
  if (height) desc.push(`${height} stature`);
  if (skinTone) desc.push(`${skinTone} skin`);
  
  // Face
  if (faceShape) desc.push(`${faceShape} face shape`);
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
  if (tattoos?.length) desc.push('visible tattoos');
  if (piercings?.length) desc.push('visible piercings');
  if (scars?.length) desc.push('visible scars');
  if (implants?.length) desc.push('cybernetic implants');
  if (prosthetics?.length) desc.push('prosthetic limbs');
  
  // Clothing
  if (clothingDetails?.length) {
    desc.push(`wearing ${clothingDetails.join(' and ')}`);
  } else if (clothingStyle && clothingStyle !== 'genre_default') {
    desc.push(`wearing ${clothingStyle} style outfit`);
  }
  // Let AI pick clothing based on role/genre if not specified
  
  // Role/class
  if (characterClass) desc.push(`as a ${characterClass}`);
  
  // User's custom description
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  if (userDesc) desc.push(userDesc);
  
  // Background
  const genreKey = (genre || 'fantasy').toLowerCase().replace(/[\s-]/g, '_');
  const bg = BACKGROUNDS[genreKey] || BACKGROUNDS.modern;
  
  const character = desc.join(', ');
  
  // Strong framing instructions at the START of the prompt
  const prompt = `Three-quarter length portrait photograph showing the subject from knees up to head. Medium wide shot, subject fills 80% of the frame vertically. Full torso, arms, and hands must be visible. The subject is: ${character}. Standing in a ${bg}, soft bokeh background. Professional photography, natural lighting, sharp focus, 8K quality.`;
  
  console.log('Character:', name, '| Genre:', genre, '| Class:', characterClass);
  console.log('Full prompt:', prompt);
  
  return {
    prompt,
    negative: 'headshot, bust shot, close-up, face only, shoulders up, chest up, cropped at waist, cropped at hips, full body showing feet, anime, cartoon, illustration, painting, 3D render, deformed, bad anatomy, extra limbs, blurry',
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
