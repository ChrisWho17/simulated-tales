import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ruleset, genre, characterName } = await req.json();

    const raw = (ruleset || '').toString().trim();
    if (!raw) {
      return new Response(JSON.stringify({ error: "Ruleset is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (raw.length > 2000) {
      return new Response(JSON.stringify({ error: "Ruleset too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a narrative design assistant. The player has written informal "story rules" for the AI narrator to follow.
Your job: REWRITE and EXPAND their rules into a clearer, more detailed, well-structured ruleset the narrator can apply consistently.

STRICT REQUIREMENTS:
- Preserve the player's original intent EXACTLY. Do not add new themes, rules, or constraints they did not imply.
- Expand vague phrasing into specific, actionable narrator instructions (tone, pacing, NPC behavior, consequences, sensory detail, content limits).
- Organize as a clean bulleted list grouped under short ALL-CAPS headings (e.g. TONE, NPC BEHAVIOR, COMBAT, ROMANCE, CONTENT LIMITS). Only include headings relevant to what the player wrote.
- Each bullet: one concrete instruction, written in 2nd person to the narrator ("Treat...", "Never...", "When X, do Y").
- No meta commentary, no preface, no "Here is..." — output ONLY the ruleset.
- Keep total length under 900 characters.
- Do not invent character names, locations, or plot points.`;

    const userMessage = `Genre: ${genre || 'unspecified'}
Character: ${characterName || 'the player character'}

Player's raw ruleset:
"""
${raw}
"""

Rewrite it as a detailed, narrator-ready ruleset.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[enhance-ruleset] API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required to enhance." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Enhancement failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const enhanced = (data?.choices?.[0]?.message?.content || '').trim();

    return new Response(JSON.stringify({ enhanced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[enhance-ruleset] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
