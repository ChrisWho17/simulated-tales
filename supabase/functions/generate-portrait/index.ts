import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppearanceData {
  bodyType: string;
  height: string;
  hairColor: string;
  hairLength: string;
  eyeColor: string;
  skinTone: string;
  bustSize?: string;
  curviness?: string;
  muscles?: string;
  bodyHair?: string;
  customDescription?: string;
}

interface BasicInfoData {
  name: string;
  age: number;
  gender: string;
}

interface BackgroundData {
  origin: string;
  spawnPoint: string;
}

interface PersonalityData {
  disposition: string;
  socialStyle: string;
}

interface PortraitRequest {
  appearance: AppearanceData;
  basicInfo: BasicInfoData;
  background: BackgroundData;
  personality: PersonalityData;
  additionalFeaturesEnabled: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appearance, basicInfo, background, personality, additionalFeaturesEnabled } = await req.json() as PortraitRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Validate required fields
    if (!appearance || !basicInfo) {
      throw new Error("Missing required appearance or basicInfo data");
    }

    // Build additional body details based on gender and features enabled
    let bodyDetails = `${appearance.height || 'average'} height, ${appearance.bodyType || 'average'} build`;
    
    if (additionalFeaturesEnabled && basicInfo.gender === 'female') {
      bodyDetails += `, ${appearance.bustSize || 'medium'} bust, ${appearance.curviness || 'moderate'} curves`;
    } else if (additionalFeaturesEnabled && basicInfo.gender === 'male') {
      bodyDetails += `, ${appearance.muscles || 'toned'} muscle definition, ${appearance.bodyHair || 'light'} body hair`;
    } else if (additionalFeaturesEnabled && basicInfo.gender) {
      bodyDetails += `, ${appearance.bustSize || 'medium'} bust, ${appearance.curviness || 'moderate'} curves, ${appearance.muscles || 'toned'} muscle definition`;
    }

    // Build custom description section if provided
    let customSection = '';
    if (appearance.customDescription && appearance.customDescription.trim().length > 0) {
      customSection = `\nAdditional specific details: ${appearance.customDescription.trim()}`;
    }

    // Build a detailed prompt for the character portrait - MODERN TIMES ONLY, FULL BODY
    const prompt = `Generate a full body portrait of a ${basicInfo.age}-year-old ${basicInfo.gender || 'person'} in modern day contemporary setting. 
Physical appearance: ${bodyDetails}, ${appearance.hairLength || 'medium'} ${appearance.hairColor || 'brown'} hair, ${appearance.eyeColor || 'brown'} eyes, ${appearance.skinTone || 'medium'} skin tone.
Personality: ${personality?.disposition || 'Adaptable'} disposition with a ${personality?.socialStyle || 'Charming'} social style.
Background: ${background?.origin || 'Stable upbringing'}.${customSection}
Style: Modern contemporary realistic full body portrait, professional photography style, natural lighting, present-day urban setting. Full body shot from head to feet. Modern casual clothing and hairstyle appropriate for current era. NO fantasy elements, NO historical costumes, NO futuristic elements. Ultra high resolution.`;

    console.log("Generating portrait with prompt:", prompt.substring(0, 200) + "...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
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
    console.log("AI response received for character:", basicInfo.name || "unnamed");
    
    // Extract image from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating portrait:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate portrait";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
