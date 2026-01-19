import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates user is logged in
async function authenticateRequest(req: Request): Promise<{ userId: string | null; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { userId: data.user.id, error: null };
}

interface CompanionPersonality {
  traits: string[];
  values: Record<string, number>;
  approves: string[];
  disapproves: string[];
  speechPattern: string;
  catchphrases: string[];
  quirks: string[];
}

interface CompanionState {
  id: string;
  name: string;
  status: string;
  mood: string;
  moodIntensity: number;
  affinity: number;
  trust: number;
  respect: number;
  fear: number;
  romanticInterest: number;
  personality: CompanionPersonality;
  internalThoughts: string;
  combatRole?: string;
  confessedLove: boolean;
  wasBetrayed: boolean;
  hasSecret: boolean;
  secretRevealed: boolean;
}

interface CompanionDialogueRequest {
  companion: CompanionState;
  situation: string;
  playerAction?: string;
  recentEvents?: string[];
  location?: string;
  timeOfDay?: string;
  dialogueType: 'reaction' | 'ambient' | 'event' | 'romance' | 'betrayal' | 'farewell' | 'quirk';
  genre?: string;
  triggerQuirk?: string; // Specific quirk to reference in dialogue
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return auth.error;
  }
  console.log(`[generate-companion-dialogue] Authenticated user: ${auth.userId}`);

  try {
    const request: CompanionDialogueRequest = await req.json();
    const { companion, situation, playerAction, recentEvents, location, timeOfDay, dialogueType, genre, triggerQuirk } = request;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[generate-companion-dialogue] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          dialogue: generateFallbackDialogue(companion, dialogueType),
          mood: companion.mood,
          internalThought: "...",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = buildCompanionSystemPrompt(companion, genre);
    const userPrompt = buildDialoguePrompt(companion, situation, playerAction, recentEvents, location, timeOfDay, dialogueType, triggerQuirk);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "companion_response",
              description: "Generate the companion's dialogue and internal state",
              parameters: {
                type: "object",
                properties: {
                  dialogue: { 
                    type: "string", 
                    description: "The companion's spoken dialogue (1-3 sentences)" 
                  },
                  internalThought: { 
                    type: "string", 
                    description: "What the companion is thinking but not saying" 
                  },
                  physicalAction: { 
                    type: "string", 
                    description: "Optional physical action or gesture (*action*)" 
                  },
                  moodShift: { 
                    type: "string", 
                    enum: ["joyful", "content", "neutral", "annoyed", "angry", "sad", "fearful", "romantic", "betrayed"],
                    description: "The companion's new mood after this interaction" 
                  },
                  affinityDelta: {
                    type: "number",
                    description: "Change in affinity toward player (-20 to +20)"
                  },
                  wantsToSayMore: {
                    type: "boolean",
                    description: "Whether the companion has more to say"
                  },
                },
                required: ["dialogue", "internalThought", "moodShift"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "companion_response" } },
      }),
    });

    if (!response.ok) {
      console.error("[generate-companion-dialogue] API error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          dialogue: generateFallbackDialogue(companion, dialogueType),
          mood: companion.mood,
          internalThought: "...",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(
          JSON.stringify({
            dialogue: result.dialogue || generateFallbackDialogue(companion, dialogueType),
            internalThought: result.internalThought || "...",
            physicalAction: result.physicalAction,
            moodShift: result.moodShift || companion.mood,
            affinityDelta: result.affinityDelta || 0,
            wantsToSayMore: result.wantsToSayMore || false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error("Failed to parse tool call:", parseError);
      }
    }

    // Fallback
    return new Response(
      JSON.stringify({ 
        dialogue: generateFallbackDialogue(companion, dialogueType),
        mood: companion.mood,
        internalThought: "...",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Companion dialogue error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildCompanionSystemPrompt(companion: CompanionState, genre?: string): string {
  const traitDescriptions = companion.personality.traits.join(", ");
  const valueHighlights = Object.entries(companion.personality.values)
    .filter(([_, v]) => v > 60 || v < 30)
    .map(([k, v]) => `${k}: ${v > 60 ? 'high' : 'low'}`)
    .join(", ");

  return `You are ${companion.name}, a companion character in a ${genre || 'fantasy'} RPG.

PERSONALITY:
- Core traits: ${traitDescriptions}
- Values: ${valueHighlights}
- Speech pattern: ${companion.personality.speechPattern}
- Quirks: ${companion.personality.quirks.join("; ")}
- Favorite phrases: ${companion.personality.catchphrases.join("; ")}

CURRENT STATE:
- Mood: ${companion.mood} (intensity: ${companion.moodIntensity}/100)
- Affinity toward player: ${companion.affinity}/100 (${companion.affinity > 50 ? 'likes' : companion.affinity < -20 ? 'dislikes' : 'neutral'})
- Trust: ${companion.trust}/100
- Respect: ${companion.respect}/100
- Fear of player: ${companion.fear}/100
- Romantic interest: ${companion.romanticInterest}/100
- Status: ${companion.status}
${companion.confessedLove ? '- Has confessed romantic feelings' : ''}
${companion.wasBetrayed ? '- Has been betrayed before (cautious)' : ''}
${companion.hasSecret && !companion.secretRevealed ? '- Has a hidden secret' : ''}

WHAT THEY APPROVE OF: ${companion.personality.approves.join(", ")}
WHAT THEY DISAPPROVE OF: ${companion.personality.disapproves.join(", ")}

INTERNAL THOUGHTS (private):
${companion.internalThoughts}

INSTRUCTIONS:
- Stay in character at all times
- Use the speech pattern and quirks consistently
- React authentically based on personality and current mood
- Show emotions through actions and tone, not just words
- Keep dialogue concise (1-3 sentences max)
- Include physical actions/gestures when appropriate
- If mood shifts dramatically, reflect it in the response
- Never break character or acknowledge being AI`;
}

function buildDialoguePrompt(
  companion: CompanionState,
  situation: string,
  playerAction?: string,
  recentEvents?: string[],
  location?: string,
  timeOfDay?: string,
  dialogueType?: string,
  triggerQuirk?: string
): string {
  let prompt = `SITUATION: ${situation}\n`;
  
  if (location) prompt += `LOCATION: ${location}\n`;
  if (timeOfDay) prompt += `TIME: ${timeOfDay}\n`;
  if (playerAction) prompt += `PLAYER ACTION: ${playerAction}\n`;
  if (recentEvents?.length) prompt += `RECENT EVENTS:\n${recentEvents.map(e => `- ${e}`).join('\n')}\n`;
  
  prompt += `\nDIALOGUE TYPE: ${dialogueType || 'ambient'}\n`;
  
  switch (dialogueType) {
    case 'reaction':
      prompt += `\nGenerate ${companion.name}'s reaction to the player's action. Express approval or disapproval based on personality.`;
      break;
    case 'ambient':
      prompt += `\nGenerate ${companion.name}'s casual observation or comment about the current situation.`;
      break;
    case 'event':
      prompt += `\nGenerate ${companion.name}'s response to an important story event.`;
      break;
    case 'romance':
      prompt += `\nGenerate ${companion.name}'s romantic dialogue. Be subtle unless affinity is very high.`;
      break;
    case 'betrayal':
      prompt += `\nGenerate ${companion.name}'s reaction to betrayal. Express hurt, anger, or determination to leave.`;
      break;
    case 'farewell':
      prompt += `\nGenerate ${companion.name}'s farewell as they leave the party.`;
      break;
    case 'quirk':
      const quirkToUse = triggerQuirk || companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];
      prompt += `\nGenerate ${companion.name}'s dialogue that naturally incorporates their personality quirk: "${quirkToUse}".
The dialogue should:
- Show the quirk in action (e.g., if they "count coins when idle", have them doing it while talking)
- Feel natural and character-appropriate, not forced
- Include a brief physical action describing the quirk (in *asterisks*)
- Optionally reference or explain the quirk if it fits the moment
- Keep it short (1-2 sentences max)
Example formats:
- "*quirk action* Dialogue about something relevant."
- "Dialogue... *quirk action* More dialogue."`;
      break;
    default:
      prompt += `\nGenerate appropriate dialogue for ${companion.name}.`;
  }

  return prompt;
}

function generateFallbackDialogue(companion: CompanionState, dialogueType: string): string {
  const catchphrase = companion.personality.catchphrases[
    Math.floor(Math.random() * companion.personality.catchphrases.length)
  ];
  const quirk = companion.personality.quirks[
    Math.floor(Math.random() * companion.personality.quirks.length)
  ];

  switch (dialogueType) {
    case 'reaction':
      if (companion.affinity > 30) {
        return `*nods approvingly* ${catchphrase || "I can work with that."}`;
      } else if (companion.affinity < -20) {
        return `*frowns* I'm not sure about this...`;
      }
      return `*observes silently* ${catchphrase || "Interesting choice."}`;
    
    case 'ambient':
      return `*${quirk || 'looks around thoughtfully'}*`;
    
    case 'quirk':
      // Quirk-specific fallback dialogue
      const quirkFallbacks = [
        `*${quirk}* Sorry, it's just something I do.`,
        `*${quirk}* Don't mind me.`,
        `*${quirk}* Old habit. Can't help it.`,
        `*${quirk}* ...What? Everyone has their quirks.`,
      ];
      return quirkFallbacks[Math.floor(Math.random() * quirkFallbacks.length)];
    
    case 'romance':
      return `*glances at you with a hint of warmth* There's... something I've been meaning to say.`;
    
    case 'betrayal':
      return `I... I trusted you. This changes everything between us.`;
    
    case 'farewell':
      return `Our paths must part here. Perhaps we'll meet again.`;
    
    default:
      return catchphrase || `*${quirk || 'shifts uncomfortably'}*`;
  }
}

console.log("[generate-companion-dialogue] Edge function ready");
