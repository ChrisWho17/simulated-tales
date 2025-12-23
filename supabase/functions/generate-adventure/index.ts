import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdventureRequest {
  scenario: string;
  playerAction?: string;
  conversationHistory: Array<{ role: 'user' | 'narrator'; content: string }>;
  cheatMode?: boolean;
}

const SYSTEM_PROMPT = `You are an immersive AI Game Master and storyteller for a text-based adventure game. You combine rich, literary narrative prose with game master mechanics.

YOUR STYLE:
- Write in vivid, evocative second-person prose ("You step into the shadowed alley...")
- Paint scenes with sensory details - sights, sounds, smells, textures
- Create atmosphere and tension through your descriptions
- End most responses with a clear prompt or situation that invites player action

GAME MASTER MECHANICS:
- When players attempt actions, narrate the outcome dramatically
- Include subtle hints about possible actions without being explicit
- Track important story elements and reference them naturally
- Create meaningful consequences for player choices
- Introduce NPCs with distinct personalities when appropriate
- Build tension, mystery, and emotional stakes

RESPONSE FORMAT:
- Open with narrative description of what happens
- Include dialogue when NPCs are present (format: **Character Name:** "Their words")
- End with a situation that prompts player choice/action
- Keep responses focused but rich (150-300 words typically)

IMPORTANT RULES:
- NEVER break character or mention you're an AI
- NEVER refuse reasonable player actions - narrate consequences instead
- Adapt to ANY genre or setting the player describes
- If the player's action would be fatal or impossible, narrate a dramatic near-miss or complication
- Keep mature themes tasteful but don't shy away from drama and peril

For the FIRST message of a new adventure, set the scene vividly and introduce an immediate hook or situation.`;

const CHEAT_MODE_ADDITION = `

CHEAT MODE ACTIVE - COLLABORATIVE STORYTELLING:
- The player can now suggest story directions and you'll weave them in
- Accept meta-commands like "let's add a dragon" or "I want to find a magic sword"
- Be more flexible with impossible actions
- Player can ask for behind-the-scenes information`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, playerAction, conversationHistory, cheatMode } = await req.json() as AdventureRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build messages array
    const messages = [
      { 
        role: 'system', 
        content: SYSTEM_PROMPT + (cheatMode ? CHEAT_MODE_ADDITION : '')
      }
    ];

    // If this is a new adventure, add the scenario as the first user message
    if (conversationHistory.length === 0) {
      messages.push({
        role: 'user',
        content: `Begin a new adventure with this scenario: ${scenario}\n\nSet the scene vividly and give me an immediate situation to respond to.`
      });
    } else {
      // Add conversation history
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'narrator' ? 'assistant' : 'user',
          content: msg.content
        });
      }
      
      // Add current player action
      if (playerAction) {
        messages.push({
          role: 'user',
          content: playerAction
        });
      }
    }

    console.log('Calling AI with messages:', messages.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.85,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          narrative: null 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Usage limit reached. Please add credits to continue.',
          narrative: null 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const narrative = data.choices?.[0]?.message?.content;

    if (!narrative) {
      throw new Error('No narrative generated');
    }

    console.log('Generated narrative length:', narrative.length);

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-adventure:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      narrative: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
