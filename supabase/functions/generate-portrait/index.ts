import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple genre backgrounds
const GENRE_STYLES: Record<string, { background: string; clothing: string }> = {
  fantasy: { background: 'fantasy setting', clothing: 'fantasy adventurer outfit' },
  medieval: { background: 'medieval castle', clothing: 'medieval period clothing' },
  cyberpunk: { background: 'neon city', clothing: 'cyberpunk techwear outfit' },
  scifi: { background: 'spaceship interior', clothing: 'sci-fi uniform' },
  sci_fi: { background: 'spaceship interior', clothing: 'sci-fi uniform' },
  horror: { background: 'dark atmosphere', clothing: 'casual modern clothes' },
  western: { background: 'wild west', clothing: 'western frontier outfit' },
  modern: { background: 'urban city', clothing: 'modern casual clothes' },
  modern_life: { background: 'urban city', clothing: 'everyday modern outfit' },
  contemporary: { background: 'urban city', clothing: 'contemporary fashion' },
  noir: { background: 'film noir shadows', clothing: 'classic noir attire' },
  steampunk: { background: 'brass and steam', clothing: 'steampunk outfit with goggles' },
  postapoc: { background: 'wasteland ruins', clothing: 'post-apocalyptic survivor gear' },
  post_apocalyptic: { background: 'wasteland ruins', clothing: 'wasteland survivor clothes' },
  romance: { background: 'romantic setting', clothing: 'elegant romantic attire' },
  vampire: { background: 'gothic manor', clothing: 'gothic elegant clothing' },
  dark_fantasy: { background: 'dark gothic realm', clothing: 'dark fantasy armor and robes' },
  high_fantasy: { background: 'magical realm', clothing: 'high fantasy elegant robes' },
  pirate: { background: 'ship deck', clothing: 'pirate outfit' },
  spy: { background: 'luxury casino', clothing: 'sleek spy suit' },
  war: { background: 'military base', clothing: 'military uniform' },
  ww2: { background: 'wartime setting', clothing: 'WWII era uniform' },
  superhero: { background: 'city rooftop', clothing: 'superhero costume' },
  slice_of_life: { background: 'cozy everyday place', clothing: 'casual comfortable clothes' },
  urban_fantasy: { background: 'modern city with magic', clothing: 'modern clothes with magical touches' },
  crime: { background: 'gritty urban night', clothing: 'street-smart urban outfit' },
  mystery: { background: 'detective office', clothing: 'investigator attire' },
  space_opera: { background: 'grand starship', clothing: 'dramatic space opera costume' },
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
  
  // Get genre style for background and clothing
  const genreKey = (genre || 'modern').toLowerCase().replace(/[\s-]/g, '_');
  const style = GENRE_STYLES[genreKey] || GENRE_STYLES.modern;
  
  // Add clothing to character description
  parts.push(style.clothing);
  
  const character = parts.join(', ');
  const prompt = `${character}, ${style.background}`;
  
  console.log('Portrait prompt:', prompt);
  
  return {
    prompt,
    negative: 'blurry, watermark, text',
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
