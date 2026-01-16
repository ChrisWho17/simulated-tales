import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple genre backgrounds
const GENRE_BACKGROUNDS: Record<string, string> = {
  fantasy: 'fantasy setting',
  medieval: 'medieval castle',
  cyberpunk: 'neon city',
  scifi: 'spaceship interior',
  horror: 'dark atmosphere',
  western: 'wild west',
  modern: 'urban city',
  noir: 'film noir shadows',
  steampunk: 'brass and steam',
  postapoc: 'wasteland ruins',
  romance: 'romantic setting',
  vampire: 'gothic manor',
  pirate: 'ship deck',
  spy: 'luxury casino',
  war: 'military base',
  superhero: 'city rooftop',
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
  
  // Background from genre
  const genreKey = (genre || 'modern').toLowerCase().replace(/[\s-]/g, '_');
  const background = GENRE_BACKGROUNDS[genreKey] || GENRE_BACKGROUNDS.modern;
  
  const character = parts.join(', ');
  const prompt = `${character}, ${background}`;
  
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
