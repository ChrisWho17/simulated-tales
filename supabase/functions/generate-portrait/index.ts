import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple genre backgrounds - let AI decide appropriate clothing
const BACKGROUNDS: Record<string, string> = {
  fantasy: 'medieval tavern, candlelight',
  medieval: 'castle interior, torchlight',
  dark_fantasy: 'gothic cathedral, moonlight',
  high_fantasy: 'elven palace, magical glow',
  cyberpunk: 'neon city alley, rain, pink and blue lights',
  scifi: 'spaceship interior, blue lighting',
  sci_fi: 'space station corridor',
  space_opera: 'starship bridge, stars visible',
  horror: 'shadowy abandoned building',
  vampire: 'gothic manor, candlelight',
  zombie: 'barricaded shelter',
  western: 'old west saloon, warm light',
  pirate: 'ship deck, ocean backdrop',
  victorian: 'London street, fog, gas lamps',
  steampunk: 'brass workshop with gears',
  noir: 'rain-slicked street, neon signs',
  mystery: 'detective office, venetian blinds',
  spy: 'luxury casino',
  crime: 'dark urban alley',
  postapoc: 'wasteland ruins, harsh sun',
  post_apocalyptic: 'collapsed city',
  war: 'military base',
  ww2: 'WWII era bunker',
  superhero: 'city rooftop at night',
  modern: 'contemporary urban street, natural daylight',
  modern_life: 'modern city environment, casual setting',
  contemporary: 'trendy cafe or urban park',
  slice_of_life: 'cozy modern interior',
  romance: 'elegant modern venue, soft lighting',
  urban_fantasy: 'modern city with subtle magic',
};

// Build a simple, flexible prompt
function buildPrompt(body: any): string {
  const {
    name, gender, age, build, height, skinTone, 
    hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, scars, implants, prosthetics,
    clothingStyle, clothingDetails,
  } = body;

  const parts: string[] = [];
  
  // Basic subject
  const eth = ethnicity || nationality || origin || 'American Caucasian';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  parts.push(`${age || 'adult'} ${eth} ${genderWord}`);
  
  // Physical traits
  if (build) parts.push(`${build} build`);
  if (height) parts.push(`${height}`);
  if (skinTone) parts.push(`${skinTone} skin`);
  if (faceShape) parts.push(`${faceShape} face`);
  if (eyeColor) parts.push(`${eyeColor} eyes`);
  if (hairColor || hairStyle) parts.push(`${hairColor || ''} ${hairStyle || ''} hair`.trim());
  
  // Features
  if (details?.length) parts.push(details.join(', '));
  if (distinguishingFeatures?.length) parts.push(distinguishingFeatures.join(', '));
  if (accessories?.length) parts.push(accessories.join(', '));
  
  // Body mods
  if (tattoos?.length) parts.push(`tattoos`);
  if (piercings?.length) parts.push(`piercings`);
  if (scars?.length) parts.push(`visible scars`);
  if (implants?.length) parts.push(`cybernetic implants`);
  if (prosthetics?.length) parts.push(`prosthetics`);
  
  // Clothing - keep it simple, let AI interpret
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  if (clothingDetails?.length) {
    parts.push(clothingDetails.join(', '));
  } else if (clothingStyle && clothingStyle !== 'genre_default') {
    parts.push(`${clothingStyle} clothing`);
  }
  // If no clothing specified, AI will choose appropriate for genre/role
  
  // Role
  if (characterClass) parts.push(characterClass);
  
  // User custom details
  if (userDesc) parts.push(userDesc);
  
  // Get background
  const genreKey = (genre || 'fantasy').toLowerCase().replace(/[\s-]/g, '_');
  const bg = BACKGROUNDS[genreKey] || BACKGROUNDS.modern;
  
  // Simple prompt structure - give AI freedom
  const subject = parts.join(', ');
  
  console.log('Character:', name, '| Genre:', genre, '| Class:', characterClass);
  
  return `Portrait photo, knee to head framing, ${subject}, ${bg} background, photorealistic`;
}

// Generate image
async function generateImage(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) throw new Error("TOGETHER_API_KEY not configured");

  console.log('Prompt:', prompt);

  const response = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-dev",
      prompt,
      width: 768,
      height: 1024,
      steps: 25,
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
    
    // Legacy custom prompt
    if (body.customPrompt && !body.gender) {
      const imageUrl = await generateImage(body.customPrompt);
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(body);
    const imageUrl = await generateImage(prompt);

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
