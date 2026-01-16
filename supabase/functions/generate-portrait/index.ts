import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple genre settings
const GENRES: Record<string, { setting: string; clothing: string }> = {
  fantasy: { setting: 'medieval tavern with candlelight', clothing: 'leather armor and adventurer gear' },
  medieval: { setting: 'castle interior with torchlight', clothing: 'period medieval clothing' },
  dark_fantasy: { setting: 'dark cathedral with moonlight', clothing: 'dark worn armor and tattered cloak' },
  cyberpunk: { setting: 'neon-lit alley with rain reflections', clothing: 'tech-enhanced jacket and tactical gear' },
  scifi: { setting: 'spaceship interior with blue lighting', clothing: 'sleek space uniform' },
  sci_fi: { setting: 'space station with screen glow', clothing: 'utility space suit' },
  horror: { setting: 'abandoned building with harsh shadows', clothing: 'worn everyday clothes' },
  western: { setting: 'old west saloon with warm light', clothing: 'cowboy hat and duster coat' },
  postapoc: { setting: 'wasteland ruins with harsh sunlight', clothing: 'scavenged tactical gear' },
  post_apocalyptic: { setting: 'collapsed city with dust haze', clothing: 'improvised survival armor' },
  noir: { setting: 'rain-slicked street with neon signs', clothing: 'sharp suit and trench coat' },
  modern: { setting: 'urban environment with natural light', clothing: 'casual modern clothes' },
  steampunk: { setting: 'Victorian factory with brass machinery', clothing: 'Victorian attire with goggles and gears' },
  victorian: { setting: 'London street with gas lamps', clothing: 'period Victorian formal wear' },
  vampire: { setting: 'gothic castle with candlelight', clothing: 'elegant Victorian velvet coat' },
  pirate: { setting: 'ship deck with ocean background', clothing: 'pirate coat and bandana' },
  samurai: { setting: 'Japanese castle with natural light', clothing: 'samurai armor or hakama' },
  spy: { setting: 'elegant casino with dramatic lighting', clothing: 'tailored formal suit' },
  superhero: { setting: 'city rooftop at night', clothing: 'hero costume with emblem' },
  zombie: { setting: 'barricaded building', clothing: 'blood-stained survival gear' },
  war: { setting: 'military base', clothing: 'combat uniform and tactical vest' },
};

// Role to clothing mapping
const ROLE_CLOTHING: Record<string, string> = {
  knight: 'plate armor with sword',
  mage: 'mystical robes with staff',
  rogue: 'leather armor with hood and daggers',
  warrior: 'battle-worn heavy armor',
  soldier: 'military combat gear',
  detective: 'trench coat and fedora',
  gunslinger: 'cowboy hat with dual revolvers',
  captain: 'command uniform with insignia',
  bounty_hunter: 'worn bounty hunter armor',
  solo: 'tactical jacket with cybernetic arm',
  netrunner: 'tech hoodie with neural interface',
  survivor: 'practical survival clothes',
};

function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    gender, age, build, skinTone, hairColor, hairStyle, eyeColor,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, scars,
  } = body;

  // User additions override everything
  const userDetails = additionalDetails || characterAdditionals || customDescription || '';
  
  // Genre
  const genreKey = (genre || 'fantasy').toLowerCase().replace(/[\s-]/g, '_');
  const genreData = GENRES[genreKey] || GENRES.fantasy;
  
  // Role
  const roleKey = (characterClass || '').toLowerCase().replace(/[\s-]/g, '_');
  const roleClothing = ROLE_CLOTHING[roleKey];
  
  // Build description parts
  const parts: string[] = [];
  
  // Subject
  const eth = ethnicity || nationality || origin || 'American Caucasian';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  parts.push(`${age || 'adult'} year old ${eth} ${genderWord}`);
  
  // Physical
  if (build) parts.push(build + ' build');
  if (skinTone) parts.push(skinTone + ' skin');
  if (hairColor || hairStyle) parts.push(`${hairColor || ''} ${hairStyle || ''} hair`.trim());
  if (eyeColor) parts.push(eyeColor + ' eyes');
  
  // Features
  const featureList: string[] = [];
  if (details?.length) featureList.push(...details);
  if (distinguishingFeatures?.length) featureList.push(...distinguishingFeatures);
  if (accessories?.length) featureList.push(...accessories.map((a: string) => 'wearing ' + a));
  if (tattoos?.length) featureList.push('tattoos on ' + tattoos.join(' and '));
  if (piercings?.length) featureList.push('piercings on ' + piercings.join(' and '));
  if (scars?.length) featureList.push('scars on ' + scars.join(' and '));
  if (featureList.length) parts.push(featureList.join(', '));
  
  // Clothing - priority: user > role > genre
  const hasUserClothing = userDetails.toLowerCase().match(/wearing|dressed|outfit|armor|suit|jacket|coat|dress|robe/);
  if (!hasUserClothing) {
    parts.push('wearing ' + (roleClothing || genreData.clothing));
  }
  
  // User details
  if (userDetails) parts.push(userDetails);
  
  // Role label
  if (characterClass && !hasUserClothing) parts.push(characterClass);
  
  // Compose final prompt
  const subject = parts.join(', ');
  const prompt = `Portrait from knees to head, ${subject}, looking at camera, ${genreData.setting}, blurred background, photorealistic, sharp focus, 8K`;
  
  console.log("Portrait prompt:", prompt);
  
  return {
    prompt,
    negative: 'anime, cartoon, 3d render, painting, looking away, profile view, deformed, cropped, headshot only, full body, feet visible'
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
    console.error("Together API error:", error);
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  const base64 = data.data?.[0]?.b64_json;
  if (!base64) throw new Error("No image in response");

  return `data:image/png;base64,${base64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Portrait request:", body.name || "unnamed");

    // Handle legacy prompt-only requests
    if (body.customPrompt && !body.gender) {
      const result = await generateImage(body.customPrompt, 'anime, cartoon, deformed');
      return new Response(JSON.stringify({ imageUrl: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, negative } = buildPrompt(body);
    const imageUrl = await generateImage(prompt, negative);

    console.log("Portrait generated for:", body.name || "unnamed");
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
