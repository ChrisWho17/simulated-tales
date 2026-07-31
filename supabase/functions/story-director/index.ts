/**
 * Story Director — the hidden dungeon master.
 *
 * Produces a compact JSON Director Brief. Never writes visible prose.
 * Runs on the gateway Responses API (streamed, then accumulated server-side)
 * because reasoning runs are too slow for a buffered request.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_DIRECTOR_MODEL = Deno.env.get('STORY_DIRECTOR_MODEL') || 'openai/gpt-5.6-sol';

const ALLOWED_MODELS = new Set([
  'openai/gpt-5.6-sol',
  'openai/gpt-5.5',
  'openai/gpt-5.4',
]);

const SYSTEM_PROMPT = `You are the STORY DIRECTOR for an interactive text RPG.

You are NOT the narrator. You never write prose the player will read.
You produce a compact, hidden planning brief that another model (the Live
Narrator) uses to steer the next stretch of story.

Your responsibilities:
- Long-term plot direction and pacing
- World evolution and major events
- Quest creation, branching, failure and completion
- Faction goals and conflicts
- NPC motives and private knowledge
- Mysteries, foreshadowing and delayed consequences
- Continuity repair (flag contradictions you notice in the material provided)
- Difficulty and tension management

Hard rules:
- Output ONLY a JSON object matching the required schema. No prose, no markdown.
- Be terse. Each string is one short sentence. This is a planning document.
- Never invent player stats, inventory, currency or dice results — game code owns those.
- Build on the previous brief when one is supplied; do not reset the story.
- "blockedEvents" lists things that must NOT happen yet (pacing guards).
- "continuityWarnings" lists contradictions the narrator must avoid repeating.

Required JSON shape:
{
  "storyObjective": "",
  "tension": 0,
  "npcMotives": [{ "npc": "", "motive": "", "privateKnowledge": "" }],
  "factionGoals": [{ "faction": "", "goal": "", "opposition": "" }],
  "hiddenFacts": [],
  "unresolvedThreads": [],
  "possibleConsequences": [],
  "blockedEvents": [],
  "continuityWarnings": [],
  "futureDevelopments": []
}`;

function extractJson(text: string): unknown | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const requestedModel = typeof body.model === 'string' ? body.model : '';
    const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_DIRECTOR_MODEL;

    const {
      triggerReason = 'manual',
      scenario = '',
      genre = '',
      characterName = '',
      location = '',
      previousBrief = null,
      sceneSummary = '',
      recentEvents = [],
      longTermMemories = [],
      unresolvedThreads = [],
      turnCount = 0,
      meaningfulTurnCount = 0,
    } = body ?? {};

    const userParts: string[] = [
      `TRIGGER: ${triggerReason}`,
      `TURNS: ${turnCount} total, ${meaningfulTurnCount} meaningful`,
    ];
    if (genre) userParts.push(`GENRE: ${genre}`);
    if (scenario) userParts.push(`SCENARIO: ${String(scenario).slice(0, 1500)}`);
    if (characterName) userParts.push(`PLAYER CHARACTER: ${characterName}`);
    if (location) userParts.push(`CURRENT LOCATION: ${location}`);
    if (previousBrief) {
      userParts.push(`PREVIOUS BRIEF (evolve it, do not discard it):\n${JSON.stringify(previousBrief).slice(0, 4000)}`);
    }
    if (sceneSummary) userParts.push(`SCENE SUMMARY SO FAR:\n${String(sceneSummary).slice(0, 2500)}`);
    if (Array.isArray(recentEvents) && recentEvents.length) {
      userParts.push(`RECENT EVENTS:\n${recentEvents.slice(-8).map((e: string, i: number) => `${i + 1}. ${String(e).slice(0, 500)}`).join('\n')}`);
    }
    if (Array.isArray(longTermMemories) && longTermMemories.length) {
      userParts.push(`LONG-TERM MEMORIES:\n${longTermMemories.slice(-24).map((m: string) => `- ${String(m).slice(0, 300)}`).join('\n')}`);
    }
    if (Array.isArray(unresolvedThreads) && unresolvedThreads.length) {
      userParts.push(`CURRENTLY UNRESOLVED THREADS:\n${unresolvedThreads.map((t: string) => `- ${t}`).join('\n')}`);
    }
    userParts.push('Produce the updated Director Brief now as JSON only.');

    const started = Date.now();

    // Responses API, streamed. A buffered reasoning call would exceed the
    // platform request timeout; we accumulate the SSE deltas server-side
    // because nothing here renders progressively.
    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': LOVABLE_API_KEY,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: userParts.join('\n\n'),
        stream: true,
        // Low effort: this is a compact planning document, not deep prose.
        reasoning: { effort: 'low', summary: 'auto' },
        max_output_tokens: 2000,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '');
      console.error('[story-director] gateway error', upstream.status, errText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: `Director unavailable (${upstream.status})`, brief: null }),
        {
          status: upstream.status === 429 || upstream.status === 402 ? upstream.status : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lastNewline = buffer.lastIndexOf('\n');
      if (lastNewline === -1) continue;
      const lines = buffer.slice(0, lastNewline).split('\n');
      buffer = buffer.slice(lastNewline + 1);

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
            text += evt.delta;
          } else if (evt.type === 'response.completed' && typeof evt.response?.output_text === 'string') {
            if (!text) text = evt.response.output_text;
          }
        } catch {
          /* skip malformed frame */
        }
      }
    }

    const parsed = extractJson(text);
    if (!parsed) {
      console.warn('[story-director] Model returned no parseable JSON');
      return new Response(JSON.stringify({ error: 'Invalid director output', brief: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[story-director] brief generated in ${Date.now() - started}ms via ${model}`);

    return new Response(
      JSON.stringify({ brief: parsed, model, latencyMs: Date.now() - started }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[story-director] unhandled error', err);
    return new Response(JSON.stringify({ error: 'Director failed', brief: null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
