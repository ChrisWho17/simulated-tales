import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  dialogueType: 'reaction' | 'ambient' | 'event' | 'romance' | 'betrayal' | 'farewell';
  genre?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CompanionDialogueRequest = await req.json();
    const { companion, situation, playerAction, recentEvents, location, timeOfDay, dialogueType, genre } = request;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
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
    const userPrompt = buildDialoguePrompt(companion, situation, playerAction, recentEvents, location, timeOfDay, dialogueType);

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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error("AI gateway error:", response.status);
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
  dialogueType?: string
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
