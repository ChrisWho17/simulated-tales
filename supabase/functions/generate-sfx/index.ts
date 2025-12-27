import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateSFXRequest {
  prompt: string;
  duration?: number;
  promptInfluence?: number;
  filename?: string;
  category?: string;
  forceRegenerate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      prompt, 
      duration = 5, 
      promptInfluence = 0.3, 
      filename = 'sound',
      category = 'misc',
      forceRegenerate = false
    }: GenerateSFXRequest = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storagePath = `${category}/${filename}.mp3`;
    const uniqueKey = `${category}/${filename}`;
    
    // Check if sound already exists in storage (unless force regenerate)
    if (!forceRegenerate) {
      const { data: existingSound } = await supabase
        .from('generated_sounds')
        .select('*')
        .eq('filename', uniqueKey)
        .single();

      if (existingSound) {
        console.log(`Returning cached sound: ${storagePath}`);
        return new Response(JSON.stringify({
          cached: true,
          publicUrl: existingSound.public_url,
          filename: existingSound.filename,
          storagePath: existingSound.storage_path,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Generating new sound: "${prompt}" (${duration}s)`);

    // Generate sound with ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);
    
    console.log(`Generated audio: ${audioData.byteLength} bytes`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('sound-effects')
      .upload(storagePath, audioData, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('sound-effects')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save to tracking table
    const { error: insertError } = await supabase
      .from('generated_sounds')
      .upsert({
        filename: uniqueKey,
        category,
        prompt,
        storage_path: storagePath,
        public_url: publicUrl,
        duration_seconds: duration,
      }, { onConflict: 'filename' });

    if (insertError) {
      console.error('Insert tracking error:', insertError);
    }

    console.log(`Sound saved to storage: ${publicUrl}`);

    // Return public URL and base64 for backward compatibility
    const base64Audio = base64Encode(audioBuffer);

    return new Response(JSON.stringify({
      cached: false,
      publicUrl,
      audioContent: base64Audio,
      format: 'mp3',
      filename: uniqueKey,
      storagePath,
      byteLength: audioData.byteLength,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-sfx:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
