import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// PORTRAIT STYLE CONSTANTS - Realistic waist-up portraits
// ============================================================================

// Safe, professional prompt that avoids content filter triggers
const PORTRAIT_STYLE_BASE = [
  'professional character illustration',
  'high quality digital art',
  'three-quarter length portrait showing from knees to head',
  'detailed background environment',
  'natural lighting',
  'looking at camera',
  'detailed facial features',
  'appropriate professional attire',
  'clean composition',
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

// Genre styles with safe, non-triggering descriptions
const GENRE_STYLES: Record<string, string> = {
  modern: 'modern casual clothing, city street background',
  'modern-life': 'modern casual clothing, city street background',
  war: 'military uniform, outdoor field background',
  cyberpunk: 'futuristic clothing with tech accessories, neon city background',
  postapoc: 'worn practical clothing, desert landscape background',
  scifi: 'futuristic uniform, space station background',
  fantasy: 'medieval fantasy robes and light armor, forest background',
  medieval: 'medieval period clothing, castle courtyard background',
  horror: 'dark casual clothing, dimly lit room background',
  western: 'western frontier clothing, desert town background',
  noir: '1940s business attire, office with venetian blinds background',
  mystery: '1940s detective clothing, study room background',
  pirate: 'historical sailing era clothing, ship deck background',
  ww2: '1940s period uniform, European countryside background',
  survival: 'outdoor hiking gear, wilderness background',
  steampunk: 'Victorian era clothing with brass accessories, industrial background',
  apocalypse: 'rugged practical clothing, abandoned building background',
  vampire: 'elegant Victorian formal wear, mansion interior background',
  zombie: 'practical survivor clothing, empty street background',
  superhero: 'colorful athletic costume, city rooftop background',
  spy: 'formal business attire, modern office background',
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

function buildNPCPrompt(npc: any, config: any): string {
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
  
  // Keep it simple and professional to avoid content filters
  const prompt = [
    PORTRAIT_STYLE_BASE,
    npcDesc,
    genreStyle,
    emotionStyle,
  ].filter(Boolean).join(', ');
  
  return prompt;
}

// ============================================================================
// LOVABLE AI IMAGE GENERATION (Using Gemini Flash Image)
// ============================================================================

async function generateWithLovableAI(prompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log("Generating NPC portrait with Lovable AI (Gemini Flash Image)");
  console.log("Prompt:", prompt.substring(0, 200) + "...");

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        { 
          role: 'user', 
          content: `Create a professional character portrait for a game: ${prompt}. The character should be shown in appropriate attire for their setting.` 
        }
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Usage limit reached, please add credits.");
    }
    
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Lovable AI response received");
  
  // Extract the image URL from the response
  const imageData = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageData) {
    console.error("No image in response:", JSON.stringify(result).substring(0, 500));
    throw new Error("No image generated");
  }

  // Return the base64 data URL directly
  return imageData;
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

    const imageUrl = await generateWithLovableAI(finalPrompt);

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
