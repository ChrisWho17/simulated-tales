import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SceneImageRequest {
  sceneDescription: string;
  style?: string;
  mood?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sceneDescription, style = 'fantasy', mood = 'atmospheric' } = await req.json() as SceneImageRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build a detailed prompt for scene illustration
    const imagePrompt = `A ${mood} ${style} illustration scene: ${sceneDescription}. 
Cinematic lighting, highly detailed, atmospheric, painterly style, concept art quality. 
Wide aspect ratio suitable for a story header. No text or UI elements.`;

    console.log('Generating scene image with prompt:', imagePrompt.slice(0, 100) + '...');

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
            content: imagePrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          imageUrl: null 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        console.log('Usage limit reached, returning null image gracefully');
        return new Response(JSON.stringify({ 
          error: 'Usage limit reached',
          imageUrl: null 
        }), {
          status: 200, // Return 200 so client handles gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Image API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Image generation response received');

    // Extract image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.log('No image in response, returning null');
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageUrl: imageData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-scene-image:', error);
    return new Response(JSON.stringify({ 
      error: 'Unable to generate scene image at this time',
      imageUrl: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
