import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortraitRequest {
  appearance: string;
  characterClass: string;
  genre: string;
  name: string;
  detailLevel: 'simple' | 'detailed' | 'all';
  portraitHints?: string[];
  clothingStyle?: string;
  referenceImageUrl?: string; // Base portrait for consistency
  emotionVariant?: string; // If generating an emotion variant
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      appearance, 
      characterClass, 
      genre, 
      name, 
      detailLevel, 
      portraitHints, 
      clothingStyle,
      referenceImageUrl,
      emotionVariant
    } = await req.json() as PortraitRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating character portrait for:", name, "in genre:", genre, "class:", characterClass);
    if (referenceImageUrl) {
      console.log("Using reference image for consistency, emotion:", emotionVariant);
    }

    // Genre-specific art styles
    const genreStyles: Record<string, string> = {
      fantasy: "high fantasy art style, magical realm aesthetic, detailed fantasy illustration, epic adventure feel",
      scifi: "sci-fi concept art, futuristic chrome and holographics, space opera aesthetic, sleek technology",
      horror: "dark horror atmosphere, moody dramatic lighting, unsettling beauty, survival horror aesthetic",
      mystery: "noir detective style, 1940s film noir aesthetic, dramatic shadows, rain and cigarette smoke",
      pirate: "golden age of piracy, salty sea dog aesthetic, Caribbean adventure, weathered sailor look",
      western: "old west frontier, dusty desert sun, rugged cowboy aesthetic, frontier justice vibe",
      cyberpunk: "neon-drenched cyberpunk, chrome implants, rain-slicked streets, corporate dystopia aesthetic",
      postapoc: "post-apocalyptic wasteland, worn and weathered gear, survival aesthetic, gritty realism",
      custom: "cinematic illustration style, highly detailed character portrait"
    };

    // Genre-specific costume guidance
    const genreCostumes: Record<string, string> = {
      fantasy: "medieval fantasy attire, leather and cloth armor, magical accessories, adventurer's gear",
      scifi: "futuristic jumpsuit or armor, tech accessories, space-age materials, practical gear",
      horror: "modern casual or practical clothing, survival gear, worn and stained from struggle",
      mystery: "1940s detective attire, trench coat and fedora, vintage style, professional wear",
      pirate: "pirate captain attire, tricorn hat, weathered coat, nautical accessories, cutlass",
      western: "cowboy duster coat, wide-brimmed hat, leather boots, gun belt, frontier wear",
      cyberpunk: "neon-accented clothing, leather and tech, cybernetic visible implants, street fashion",
      postapoc: "scavenged armor, gas mask or respirator, patched clothing, survival gear",
      custom: "appropriate attire for their role and setting"
    };

    const style = genreStyles[genre] || genreStyles.custom;
    const costume = clothingStyle || genreCostumes[genre] || genreCostumes.custom;
    const roleHints = portraitHints?.length ? portraitHints.join(', ') : '';

    let matureContentNote = "";
    if (detailLevel === 'all') {
      matureContentNote = "This is for a mature audience. Include tasteful sensuality appropriate to the character description while maintaining artistic quality.";
    }

    let prompt: string;
    let messages: any[];

    if (referenceImageUrl && emotionVariant) {
      // Generate emotion variant based on reference image
      prompt = `Look at this reference portrait and create a new portrait of THE EXACT SAME CHARACTER with a different expression.

CRITICAL - MAINTAIN CONSISTENCY WITH REFERENCE:
- SAME person/character identity
- SAME face shape, features, skin tone
- SAME hair color, style, and length  
- SAME clothing, armor, and accessories
- SAME art style and quality
- SAME background style and lighting mood

CHANGE ONLY THE EXPRESSION: ${emotionVariant}

The new portrait should look like a different frame of the same character showing this emotion. Keep everything else identical - face, costume, setting. Only the facial expression and subtle body language should change to convey the ${emotionVariant} emotion.

DO NOT: Change the character's appearance, clothes, or setting. This must be recognizably the same person.`;

      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: referenceImageUrl } }
          ]
        }
      ];
      
    } else {
      // Standard portrait generation (no reference)
      prompt = `Generate a character portrait for ${name}, an RPG adventure game protagonist.

ROLE: ${characterClass}
GENRE: ${genre}

PHYSICAL APPEARANCE: ${appearance}

COSTUME/ATTIRE: ${costume}
${roleHints ? `\nROLE-SPECIFIC DETAILS: ${roleHints}` : ''}

ART STYLE: ${style}

REQUIREMENTS:
- Portrait orientation, head and shoulders or upper body focus
- High quality detailed illustration
- Expressive eyes that convey personality and depth
- Professional quality game character concept art
- The character should look like a protagonist/hero ready for adventure
- Dramatic lighting appropriate to the genre
- Include role-specific visual elements that identify their profession
${matureContentNote}

DO NOT include: excessive gore, modern logos or brands, out-of-genre elements`;

      messages = [
        {
          role: "user",
          content: prompt,
        }
      ];
    }

    console.log("Portrait prompt prepared, using reference:", !!referenceImageUrl);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Portrait generation response received for:", name, emotionVariant ? `(${emotionVariant})` : '');
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response");
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      characterName: name,
      emotion: emotionVariant || 'neutral'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating character portrait:", error);
    return new Response(JSON.stringify({ error: "Unable to generate portrait at this time" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});