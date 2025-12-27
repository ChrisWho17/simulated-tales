import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateSFXRequest {
  prompt: string;
  duration?: number; // 0.5-22 seconds
  promptInfluence?: number; // 0-1
  filename?: string; // For tracking purposes
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set');
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const body: GenerateSFXRequest = await req.json();
    const { prompt, duration = 10, promptInfluence = 0.3, filename } = body;

    if (!prompt) {
      console.error('Missing prompt in request');
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Generating SFX: "${prompt}" (duration: ${duration}s, influence: ${promptInfluence}, filename: ${filename || 'not specified'})`);

    const response = await fetch(
      'https://api.elevenlabs.io/v1/sound-generation',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: Math.min(Math.max(duration, 0.5), 22),
          prompt_influence: Math.min(Math.max(promptInfluence, 0), 1),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);
    
    console.log(`Successfully generated SFX: ${filename || prompt} (${audioBuffer.byteLength} bytes)`);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        format: 'mp3',
        filename: filename || prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_'),
        byteLength: audioBuffer.byteLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in generate-sfx function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
