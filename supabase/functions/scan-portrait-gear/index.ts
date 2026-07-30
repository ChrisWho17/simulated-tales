// ============================================================================
// SCAN PORTRAIT GEAR
// Reads a character portrait and reports the equipment visible on it, so a new
// character starts with the gear the player can actually see.
//
// The client reconciles the result against the class kit (game/portraitGearScan)
// and re-validates everything, so this function stays deliberately narrow: look
// at the image, name what is worn or carried, refuse to invent the rest.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A 4MB portrait becomes ~5.5M characters of base64. Anything past that is not
// a portrait and would only burn gateway quota.
const MAX_IMAGE_CHARS = 6_000_000;

const ALLOWED_CATEGORIES = ['weapons', 'apparel', 'misc'] as const;
const ALLOWED_WEAPON_TYPES = [
  'pistol', 'revolver', 'smg', 'rifle', 'assaultRifle', 'shotgun', 'sniper', 'lmg', 'melee',
] as const;
const ALLOWED_APPAREL_TYPES = ['headwear', 'torso', 'hands', 'legs', 'feet'] as const;

const MAX_ITEMS = 12;

const SYSTEM_PROMPT = `You are an equipment scanner for a text RPG. You are shown one character portrait. List only the gear that is visibly worn, held, strapped or slung on the character.

RULES
- Report only what you can actually see. Never infer what might be in a pack, pocket or holster you cannot see into.
- Never list body parts, tattoos, scars, piercings, hairstyles, facial features, expressions, poses, lighting, weather or background scenery.
- Never list consumables, potions, rations, ammunition, currency or quest items — those come from the character's class, not the picture.
- Name each item the way a game inventory would: "Hooded Leather Cloak", "Worn Revolver", "Steel Gauntlets". Two to four words. No sentences, no brand names, no numbering.
- Group matched pairs as one item ("Leather Boots", not a left and a right).
- Give each item an honest confidence between 0 and 1. If you are guessing, score it below 0.5 and expect it to be discarded.
- If the portrait shows no distinct gear, return an empty list. An empty list is a valid, correct answer.

CATEGORIES
- "weapons" — anything used to fight: blades, firearms, bows, staves, clubs.
- "apparel" — worn protection or clothing. Also set apparelType to one of headwear, torso, hands, legs, feet.
- "misc" — carried or worn kit that is neither: packs, lanterns, pouches, tools, amulets, instruments.

For weapons also set weaponType to one of: pistol, revolver, smg, rifle, assaultRifle, shotgun, sniper, lmg, melee. Use "rifle" for bows and crossbows and "melee" for anything swung or thrust.

Respond with JSON only, in exactly this shape:
{"items":[{"name":"Hooded Leather Cloak","category":"apparel","apparelType":"torso","description":"one short clause describing how it looks","confidence":0.9}]}`;

interface ScannedItem {
  name: string;
  category: typeof ALLOWED_CATEGORIES[number];
  weaponType?: string;
  apparelType?: string;
  description?: string;
  confidence: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Only data URLs for images and plain https URLs are worth sending on. */
function validateImageUrl(imageUrl: unknown): { ok: true; url: string } | { ok: false; reason: string } {
  if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
    return { ok: false, reason: 'imageUrl is required' };
  }
  if (imageUrl.length > MAX_IMAGE_CHARS) {
    return { ok: false, reason: 'Portrait is too large to scan' };
  }
  if (imageUrl.startsWith('data:image/')) {
    return { ok: true, url: imageUrl };
  }
  if (imageUrl.startsWith('https://')) {
    return { ok: true, url: imageUrl };
  }
  return { ok: false, reason: 'imageUrl must be an image data URL or an https URL' };
}

/** Models wrap JSON in prose or fences often enough to be worth handling. */
function extractJsonObject(content: string): unknown | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : content).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * Shape and clamp the model output. The client validates again — this pass just
 * keeps obvious junk off the wire.
 */
function normalizeItems(parsed: unknown): ScannedItem[] {
  const rawItems = Array.isArray(parsed)
    ? parsed
    : (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)
      ? (parsed as { items: unknown[] }).items
      : []);

  const items: ScannedItem[] = [];

  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Record<string, unknown>;

    const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, 48) : '';
    if (name.length < 3) continue;

    const category = ALLOWED_CATEGORIES.includes(entry.category as ScannedItem['category'])
      ? (entry.category as ScannedItem['category'])
      : 'misc';

    const confidence = typeof entry.confidence === 'number'
      ? Math.max(0, Math.min(1, entry.confidence))
      : 0.5;

    const item: ScannedItem = { name, category, confidence };

    if (typeof entry.description === 'string' && entry.description.trim()) {
      item.description = entry.description.trim().slice(0, 240);
    }
    if (category === 'weapons' && ALLOWED_WEAPON_TYPES.includes(entry.weaponType as never)) {
      item.weaponType = entry.weaponType as string;
    }
    if (category === 'apparel' && ALLOWED_APPAREL_TYPES.includes(entry.apparelType as never)) {
      item.apparelType = entry.apparelType as string;
    }

    items.push(item);
    if (items.length >= MAX_ITEMS) break;
  }

  return items;
}

async function scanPortrait(
  imageUrl: string,
  context: { genre?: string; characterClass?: string }
): Promise<{ items: ScannedItem[]; error?: string }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('[scan-portrait-gear] LOVABLE_API_KEY not configured');
    return { items: [], error: 'Gear scanning is not configured' };
  }

  const contextLines = [
    context.genre ? `GENRE: ${context.genre}` : null,
    context.characterClass ? `ROLE: ${context.characterClass}` : null,
    'List the gear visible on this character.',
  ].filter(Boolean).join('\n');

  const started = Date.now();
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: contextLines },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 700,
      temperature: 0.2,
    }),
  });

  console.log(`[scan-portrait-gear] gateway responded ${response.status} in ${Date.now() - started}ms`);

  if (!response.ok) {
    const detail = await response.text();
    console.error('[scan-portrait-gear] gateway error:', response.status, detail.slice(0, 400));
    if (response.status === 429) return { items: [], error: 'Rate limit exceeded, please try again later' };
    if (response.status === 402) return { items: [], error: 'Service temporarily unavailable' };
    return { items: [], error: 'Gear scan failed' };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    console.error('[scan-portrait-gear] empty gateway content');
    return { items: [], error: 'Gear scan returned nothing' };
  }

  const parsed = extractJsonObject(content);
  if (parsed === null) {
    console.error('[scan-portrait-gear] unparseable content:', content.slice(0, 300));
    return { items: [], error: 'Gear scan returned an unreadable result' };
  }

  const items = normalizeItems(parsed);
  console.log(`[scan-portrait-gear] accepted ${items.length} item(s):`, items.map(i => i.name).join(', '));
  return { items };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const validated = validateImageUrl(body?.imageUrl);
    if (!validated.ok) {
      return jsonResponse({ items: [], error: validated.reason }, 400);
    }

    const result = await scanPortrait(validated.url, {
      genre: typeof body?.genre === 'string' ? body.genre.slice(0, 40) : undefined,
      characterClass: typeof body?.characterClass === 'string' ? body.characterClass.slice(0, 40) : undefined,
    });

    // A failed scan is not a failed character: the client falls back to the
    // class kit, so this stays a 200 with an explanation.
    return jsonResponse(result);
  } catch (error) {
    console.error('[scan-portrait-gear] error:', error);
    return jsonResponse({ items: [], error: 'Unable to scan the portrait right now' }, 500);
  }
});
