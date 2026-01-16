import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// PORTRAIT STYLE CONSTANTS - Realistic waist-up portraits
// ============================================================================

// Realistic photo style - knees up to head framing
const PORTRAIT_STYLE_BASE = [
  'ultra realistic photograph',
  'professional portrait photography',
  'sharp focus on face',
  'natural skin texture',
  'photorealistic',
  'three-quarter body shot from knees up to head',
  'detailed facial features',
  'looking at viewer',
  'studio quality lighting',
  'high resolution',
  'detailed eyes with natural reflections',
  'natural hair texture',
  'authentic clothing fabric textures',
].join(', ');

const PORTRAIT_NEGATIVE = [
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
// GENRE STYLES FOR NPCs - Detailed environments
// ============================================================================

const GENRE_STYLES: Record<string, { style: string; backgrounds: string[] }> = {
  modern: {
    style: 'modern casual clothing, practical gear',
    backgrounds: ['urban city street with tall buildings', 'modern office interior with glass windows', 'suburban neighborhood at golden hour', 'rooftop overlooking city skyline'],
  },
  'modern-life': {
    style: 'contemporary casual clothing, modern everyday fashion',
    backgrounds: ['cozy coffee shop interior', 'modern apartment living room', 'city park with trees', 'busy urban sidewalk'],
  },
  war: {
    style: 'military combat uniform, tactical body armor, worn battle-ready gear',
    backgrounds: ['battlefield with smoke and debris', 'military base interior', 'desert terrain with vehicles', 'forest combat zone'],
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
    style: 'sleek futuristic uniform, advanced fabric materials, subtle tech accessories',
    backgrounds: ['spaceship interior with viewports', 'space station corridor', 'alien planet surface with strange sky', 'futuristic lab with holographic screens'],
  },
  fantasy: {
    style: 'fantasy-inspired practical clothing, leather armor, cloth robes, mystical accessories',
    backgrounds: ['enchanted forest with soft magical lighting', 'stone castle interior with torches', 'mountain vista at sunset', 'ancient ruins with overgrown vegetation'],
  },
  medieval: {
    style: 'realistic medieval clothing, period-accurate armor pieces, leather and wool fabrics',
    backgrounds: ['stone castle courtyard', 'medieval village marketplace', 'forest clearing with ancient trees', 'torch-lit dungeon corridor'],
  },
  horror: {
    style: 'worn everyday clothing, survival gear, practical horror survivor attire',
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
  ww2: {
    style: '1940s period military uniform, vintage combat gear, authentic era equipment',
    backgrounds: ['European village street 1940s', 'military barracks interior', 'countryside battlefield', 'bunker with maps and radio'],
  },
  survival: {
    style: 'outdoor survival gear, hiking clothing, practical backpack, weathered explorer attire',
    backgrounds: ['dense forest campsite', 'mountain trail with scenic view', 'abandoned cabin in woods', 'riverside with wilderness'],
  },
  steampunk: {
    style: 'victorian steampunk fashion, brass accessories, goggles, clockwork details, leather and copper',
    backgrounds: ['victorian industrial factory with steam', 'airship observation deck', 'clockwork laboratory', 'brass and copper workshop'],
  },
  apocalypse: {
    style: 'rugged practical clothing, reinforced gear, weathered attire',
    backgrounds: ['desolate wasteland with ruined buildings', 'abandoned highway', 'makeshift survivor camp'],
  },
  vampire: {
    style: 'gothic aristocratic attire, dark elegant clothing, victorian formal wear, mysterious sophistication',
    backgrounds: ['gothic castle ballroom', 'moonlit cemetery with mist', 'victorian mansion parlor', 'dark forest with pale moonlight'],
  },
  zombie: {
    style: 'apocalypse survivor clothing, reinforced practical gear, weathered attire',
    backgrounds: ['overrun city street with abandoned cars', 'barricaded building interior', 'empty shopping mall', 'foggy suburban neighborhood'],
  },
  superhero: {
    style: 'heroic costume or tactical suit, symbol or emblem, cape or mask optional, powerful presence',
    backgrounds: ['city rooftop at sunset', 'metropolis skyline', 'secret headquarters interior', 'dramatic sky with clouds'],
  },
  spy: {
    style: 'sleek formal attire, tailored suit, subtle tactical elements, sophisticated fashion',
    backgrounds: ['casino interior with chandeliers', 'luxury hotel lobby', 'secret underground base', 'exotic foreign city'],
  },
};

// ============================================================================
// EMOTION STYLES
// ============================================================================

const EMOTION_STYLES: Record<string, string> = {
  neutral: 'neutral calm expression, steady professional gaze',
  happy: 'happy joyful expression, genuine smile',
  angry: 'angry furious expression, snarling rage, intense',
  sad: 'melancholic expression, distant sorrowful eyes',
  scared: 'fearful expression, wide eyes, tense anxious',
  suspicious: 'suspicious wary expression, narrowed eyes',
  confident: 'confident slight smile, self-assured, victorious',
  friendly: 'friendly warm expression, welcoming smile',
  hostile: 'hostile aggressive expression, threatening',
  nervous: 'nervous anxious expression, worried',
  determined: 'determined fierce expression, intense focused eyes, set jaw',
  serious: 'serious stoic expression, professional unreadable',
  cold: 'cold emotionless expression, calculating, predatory',
  tired: 'exhausted tired expression, bags under eyes, weary',
};

// ============================================================================
// PROMPT BUILDER FOR NPCs
// ============================================================================

function buildNPCPrompt(npc: any, config: any): string {
  const genre = config?.genre || 'fantasy';
  const emotion = config?.emotion || 'neutral';
  
  const genreConfig = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;
  const emotionStyle = EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;
  
  // Build NPC description from meta
  const npcParts = [];
  
  if (npc.meta?.name) {
    npcParts.push(`portrait of ${npc.meta.name}`);
  }
  
  if (npc.meta?.age) {
    npcParts.push(`${npc.meta.age} year old`);
  }
  
  if (npc.meta?.gender) {
    npcParts.push(npc.meta.gender === 'female' ? 'woman' : npc.meta.gender === 'male' ? 'man' : 'person');
  }
  
  if (npc.meta?.occupation) {
    npcParts.push(npc.meta.occupation);
  }
  
  if (npc.meta?.description) {
    npcParts.push(npc.meta.description);
  }
  
  const npcDesc = npcParts.join(', ') || 'character portrait';
  
  // Select random background from genre
  const background = genreConfig.backgrounds[Math.floor(Math.random() * genreConfig.backgrounds.length)];
  
  // Build complete realistic prompt
  const prompt = [
    PORTRAIT_STYLE_BASE,
    npcDesc,
    genreConfig.style,
    emotionStyle,
    `background: ${background}`,
  ].filter(Boolean).join(', ');
  
  return prompt;
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION (Using FLUX.1 Schnell)
// ============================================================================

async function generateWithTogetherAI(prompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating NPC portrait with Together.ai (FLUX.1 Schnell)");
  console.log("Prompt:", prompt.substring(0, 300) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: prompt,
      width: 768,
      height: 1024,
      steps: 4,
      n: 1,
      response_format: 'b64_json',
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
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { npc, prompt, config } = await req.json();

    if (!npc || !npc.meta) {
      throw new Error("Invalid NPC data");
    }

    console.log("Generating NPC portrait for:", npc.meta.name);

    // Use provided prompt or build from NPC data
    let finalPrompt: string;
    
    if (prompt) {
      finalPrompt = `${PORTRAIT_STYLE_BASE}, ${prompt}`;
    } else {
      finalPrompt = buildNPCPrompt(npc, config);
    }

    console.log("Final prompt:", finalPrompt.substring(0, 200) + "...");

    const imageUrl = await generateWithTogetherAI(finalPrompt);

    console.log("NPC portrait generated successfully for:", npc.meta.name);

    return new Response(JSON.stringify({ 
      imageUrl,
      npcId: npc.id,
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating NPC portrait:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unable to generate portrait at this time",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
