/**
 * Story Director — the hidden dungeon master.
 *
 * Produces a compact JSON Director Brief. Never writes visible prose.
 * Runs on OpenRouter (DeepSeek V4 Pro by default) with a timeout and one retry.
 * The player never waits on this: the client keeps using the previous brief.
 */

import {
  callOpenRouter,
  extractUsage,
  isTerminalStatus,
  logOpenRouterUsage,
  resolveDirectorModel,
  getOpenRouterKey,
} from '../_shared/openrouter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    if (!getOpenRouterKey()) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured', brief: null }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const model = resolveDirectorModel(typeof body.model === 'string' ? body.model : undefined);
    const turnId = typeof body.turnId === 'string' ? body.turnId : undefined;

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

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userParts.join('\n\n') },
    ];

    const started = Date.now();
    let retries = 0;
    let response = await callOpenRouter({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      timeoutMs: 60_000,
      turnId,
    }).catch(() => null);

    // One retry, only for non-terminal failures.
    if (!response || (!response.ok && !isTerminalStatus(response.status))) {
      retries = 1;
      response = await callOpenRouter({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 2000,
        timeoutMs: 60_000,
        turnId,
      }).catch(() => null);
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 0;
      const errText = response ? await response.text().catch(() => '') : 'network/timeout';
      console.error('[story-director] OpenRouter error', status, errText.slice(0, 400));
      logOpenRouterUsage({
        fn: 'story-director',
        role: 'director',
        model,
        turnId,
        totalMs: Date.now() - started,
        retries,
        failureReason: `status=${status}`,
        status,
      });
      return new Response(
        JSON.stringify({ error: `Director unavailable (${status})`, brief: null }),
        {
          status: [429, 402, 403].includes(status) ? status : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = await response.json().catch(() => null);
    const msg = payload?.choices?.[0]?.message ?? {};
    // Reasoning models can put the JSON in `reasoning` when `content` is empty.
    const text: string = (typeof msg.content === 'string' && msg.content.trim())
      ? msg.content
      : (typeof msg.reasoning === 'string' ? msg.reasoning : '');
    if (!text) {
      console.warn('[story-director] Empty content', JSON.stringify(payload?.choices?.[0］ ?? {}).slice(0, 300));
    }
    const usage = extractUsage(payload);
    const totalMs = Date.now() - started;

    logOpenRouterUsage({
      fn: 'story-director',
      role: 'director',
      model,
      turnId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: usage.costUsd,
      totalMs,
      retries,
      usedFallback: false,
      status: response.status,
    });

    const parsed = extractJson(text);
    if (!parsed) {
      console.warn('[story-director] Model returned no parseable JSON');
      return new Response(JSON.stringify({ error: 'Invalid director output', brief: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[story-director] brief generated in ${totalMs}ms via ${model}`);

    return new Response(
      JSON.stringify({ brief: parsed, model, latencyMs: totalMs }),
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
