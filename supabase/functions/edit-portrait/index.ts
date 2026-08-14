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
    const rawStrength = typeof body?.strength === 'string' ? body.strength : 'moderate';
    const strength: 'subtle' | 'moderate' | 'major' =
      rawStrength === 'subtle' || rawStrength === 'major' ? rawStrength : 'moderate';

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

    // Denoise / transformation strength. Low by default so the source image
    // survives the edit instead of being reinterpreted from scratch.
    const strengthValue = strength === 'subtle' ? 0.2 : strength === 'major' ? 0.55 : 0.35;
    const strengthNote =
      strength === 'subtle'
        ? 'Use a very low transformation strength. Almost every pixel outside the edited region must stay identical.'
        : strength === 'major'
          ? 'Use a moderate transformation strength, but the person, pose, camera angle and background must still be recognisably the same image.'
          : 'Use a low transformation strength. Only the edited region may change.';

    const prompt = [
      'Edit the supplied image. Do not regenerate the entire scene.',
      'This is an IMAGE-TO-IMAGE EDIT of the provided source image, not a new illustration.',
      'The text below is NOT a character description — it names only the elements to modify.',
      'Preserve exactly: the original face, identity, skin tone, hair, gender, age, body proportions, pose, camera angle, framing, crop, aspect ratio, lighting and background.',
      'If added gear such as a helmet or armour covers part of the character, the same original person remains underneath — never substitute a different character or a generic figure.',
      'Mask and repaint only the objects or regions named in the request; leave every other pixel untouched.',
      strengthNote,
      `Requested change (edit these elements only): ${instruction}`,
      'Return the otherwise identical portrait at the same dimensions and composition.',
    ].join(' ');

    const result = await generateIllustration({
      prompt,
      referenceImages: [imageUrl],
      editOnly: true,
      extraBody: {
        strength: strengthValue,
        image_strength: 1 - strengthValue,
        input_fidelity: 'high',
      },
    });

    // Some providers reject the strength params outright. Retry the same
    // image-to-image edit without them rather than dropping to a text-only
    // regeneration, which is what produced brand-new characters before.
    if (!result.imageUrl) {
      console.warn('[edit-portrait] Retrying edit without strength params:', result.error);
      result = await generateIllustration({
        prompt,
        referenceImages: [imageUrl],
        editOnly: true,
      });
    }

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
