// Tweak an existing portrait instead of regenerating it from scratch.
// The current image is passed back to the image model as a reference so the
// identity stays put and only the requested adjustment changes.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateIllustration } from "../_shared/openrouter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = authHeader.replace('Bearer ', '');
  if (token === supabaseAnonKey || token.length < 100) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

async function persistPortrait(sourceUrl: string, userId: string | null) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) throw new Error('Portrait storage is not configured');

  let bytes: Uint8Array;
  let contentType = 'image/png';

  if (sourceUrl.startsWith('data:image/')) {
    const comma = sourceUrl.indexOf(',');
    const semicolon = sourceUrl.indexOf(';');
    if (comma < 0 || semicolon < 0 || semicolon > comma) {
      throw new Error('Image provider returned malformed portrait data');
    }
    contentType = sourceUrl.slice(5, semicolon) || contentType;
    const binary = atob(sourceUrl.slice(comma + 1));
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } else {
    const imageResponse = await fetch(sourceUrl);
    if (!imageResponse.ok) throw new Error(`Unable to download edited portrait (${imageResponse.status})`);
    contentType = imageResponse.headers.get('content-type') || contentType;
    bytes = new Uint8Array(await imageResponse.arrayBuffer());
  }

  const extension = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png';
  const owner = (userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'guest';
  const storagePath = `players/${owner}/${crypto.randomUUID()}.${extension}`;
  const admin = createClient(supabaseUrl, serviceKey);
  const { error } = await admin.storage
    .from('npc-portraits')
    .upload(storagePath, bytes, { contentType, upsert: false });
  if (error) throw new Error(`Portrait storage upload failed: ${error.message}`);

  const { data } = admin.storage.from('npc-portraits').getPublicUrl(storagePath);
  if (!data.publicUrl) throw new Error('Portrait storage returned no public URL');
  return { imageUrl: data.publicUrl, storagePath };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : '';

    if (!imageUrl || !/^https?:\/\/|^data:image\//.test(imageUrl)) {
      return new Response(JSON.stringify({ error: 'A current image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (instruction.length < 3 || instruction.length > 600) {
      return new Response(JSON.stringify({ error: 'Describe the tweak in 3-600 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = await resolveUserId(req);

    const prompt = [
      'Edit the supplied reference photograph. This is a TWEAK, not a new image.',
      'Keep the exact same person, face, identity, body proportions, pose, framing, lighting and background unless the requested change explicitly targets them.',
      'Do not restyle, do not re-render as a different character, do not change age, ethnicity, build or camera angle.',
      `Requested adjustment: ${instruction}`,
      'Apply only that adjustment and return the otherwise identical portrait at the same quality.',
    ].join(' ');

    const result = await generateIllustration({
      prompt,
      referenceImages: [imageUrl],
      size: '1024x1024',
    });

    if (!result.imageUrl) {
      console.error('[edit-portrait] No image returned:', result.error);
      return new Response(JSON.stringify({ error: 'Unable to edit portrait at this time' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stored = await persistPortrait(result.imageUrl, userId);
    console.log('[edit-portrait] Stored edited portrait:', stored.storagePath, 'model:', result.model);

    return new Response(JSON.stringify(stored), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[edit-portrait] Error:', error);
    return new Response(JSON.stringify({ error: 'Unable to edit portrait at this time' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
