import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// PORTRAIT STYLE CONSTANTS - Realistic waist-up portraits
// ============================================================================

const PORTRAIT_STYLE_BASE = [
  'masterpiece',
  'best quality',
  'ultra detailed digital painting',
  'realistic style',
  'cinematic lighting',
  'dramatic atmosphere',
  'three-quarter body shot from knees up',
  'full environment visible in background',
  'character in foreground with detailed background scenery',
  'looking at viewer',
  'highly detailed face and eyes',
  'intricate clothing and gear details',
  'professional illustration',
  '8k resolution',
  'volumetric lighting',
  'depth of field',
  'wide shot composition',
].join(', ');

const PORTRAIT_NEGATIVE = [
  'worst quality',
  'low quality',
  'blurry',
  'bad anatomy',
  'bad hands',
  'missing fingers',
  'extra fingers',
  'watermark',
  'signature',
  'text',
  'logo',
  'cropped',
  'out of frame',
  'duplicate',
  'deformed',
  'disfigured',
  'ugly',
  'anime',
  'cartoon',
  '3d render',
  'plastic',
  'cgi',
  'simple background',
  'plain background',
  'white background',
].join(', ');

// ============================================================================
// GENRE STYLES FOR NPCs
// ============================================================================

const GENRE_STYLES: Record<string, string> = {
  modern: 'modern military tactical gear, contemporary combat equipment, urban environment background',
  war: 'military combat uniform, tactical body armor, warzone battlefield background',
  cyberpunk: 'cyberpunk tactical gear, neon lights, chrome cybernetic augmentations, neon-lit megacity background',
  postapoc: 'post-apocalyptic scavenged gear, weathered leather and metal, wasteland ruins background',
  scifi: 'advanced sci-fi power armor, futuristic tech, spaceship or alien world background',
  fantasy: 'high fantasy armor and robes, magical enchanted equipment, mystical forest or castle background',
  medieval: 'realistic medieval plate armor, chainmail, castle or battlefield background',
  horror: 'survival horror gear, blood-stained clothing, abandoned dark location background',
  western: 'wild west attire, leather duster, cowboy hat, frontier town or desert background',
  noir: 'film noir attire, 1940s fedora and trench coat, rainy city street background',
  mystery: 'detective attire, 1940s style, dramatic shadows, noir office background',
  pirate: 'golden age pirate attire, captain coat, tricorn hat, ship deck or tropical cove background',
  ww2: '1940s military uniform, period-accurate gear, WW2 battlefield background',
  survival: 'rugged survival gear, outdoor clothing, wilderness campsite background',
  steampunk: 'Victorian steampunk attire, brass goggles, clockwork gadgets, industrial city background',
  apocalypse: 'post-apocalyptic survivor gear, scavenged armor, nuclear wasteland background',
  vampire: 'gothic vampire aristocrat attire, Victorian dark elegance, gothic castle background',
  zombie: 'zombie apocalypse survivor gear, blood-stained, overrun city background',
  superhero: 'superhero costume, dramatic heroic pose, city skyline background',
  spy: 'sleek spy attire, tactical stealth gear, casino or secret base background',
};

// ============================================================================
// EMOTION STYLES
// ============================================================================

const EMOTION_STYLES: Record<string, string> = {
  neutral: 'neutral calm expression, steady gaze',
  happy: 'happy joyful expression, genuine smile',
  angry: 'angry expression, furrowed brow, intense',
  sad: 'melancholic expression, sorrowful eyes',
  scared: 'fearful expression, wide eyes, tense',
  suspicious: 'suspicious wary expression, narrowed eyes',
  confident: 'confident expression, self-assured',
  friendly: 'friendly warm expression, welcoming smile',
  hostile: 'hostile aggressive expression, threatening',
  nervous: 'nervous anxious expression, worried',
};

// ============================================================================
// PROMPT BUILDER FOR NPCs
// ============================================================================

function buildNPCPrompt(npc: any, config: any): { prompt: string; negative_prompt: string } {
  const genre = config?.genre || 'fantasy';
  const emotion = config?.emotion || 'neutral';
  
  const genreStyle = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;
  const emotionStyle = EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;
  
  // Build NPC description from meta
  const npcParts = [];
  
  if (npc.meta?.name) {
    npcParts.push(`portrait of ${npc.meta.name}`);
  }
  
  if (npc.meta?.age) {
    npcParts.push(`${npc.meta.age} year old`);
  }
  
  if (npc.meta?.occupation) {
    npcParts.push(npc.meta.occupation);
  }
  
  if (npc.meta?.description) {
    npcParts.push(npc.meta.description);
  }
  
  const npcDesc = npcParts.join(', ') || 'character portrait';
  
  const prompt = [
    PORTRAIT_STYLE_BASE,
    npcDesc,
    genreStyle,
    emotionStyle,
  ].filter(Boolean).join(', ');
  
  return {
    prompt,
    negative_prompt: PORTRAIT_NEGATIVE,
  };
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION
// ============================================================================

async function generateWithTogetherAI(prompt: string, negativePrompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating NPC portrait with Together.AI FLUX");
  console.log("Prompt:", prompt.substring(0, 200) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1.1-pro',
      prompt,
      negative_prompt: negativePrompt,
      width: 768,
      height: 1024,
      steps: 28,
      n: 1,
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Together.AI error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later.");
    }
    if (response.status === 402 || response.status === 401) {
      throw new Error("API key issue or credits exhausted.");
    }
    
    throw new Error(`Together.AI error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Together.AI response received");
  
  const imageUrl = result.data?.[0]?.url;
  
  if (!imageUrl) {
    console.error("No image URL in response:", JSON.stringify(result));
    throw new Error("No image generated");
  }

  return imageUrl;
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
    let promptData: { prompt: string; negative_prompt: string };
    
    if (prompt) {
      promptData = {
        prompt: `${PORTRAIT_STYLE_BASE}, ${prompt}`,
        negative_prompt: PORTRAIT_NEGATIVE,
      };
    } else {
      promptData = buildNPCPrompt(npc, config);
    }

    console.log("Final prompt:", promptData.prompt.substring(0, 200) + "...");

    const imageUrl = await generateWithTogetherAI(promptData.prompt, promptData.negative_prompt);

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
