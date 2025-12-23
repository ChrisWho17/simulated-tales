import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NPCContext {
  name: string;
  age: number;
  occupation: string;
  description: string;
  traits: string[];
  currentActivity: string;
  currentMood: string;
  stressLevel: number;
  relationship: {
    affection: number;
    trust: number;
    fear: number;
    respect: number;
  };
  isGeneric: boolean;
  appearance?: {
    gender: string;
    hair: string;
    eyes: string;
    build: string;
    clothing: string;
    distinguishing: string;
  };
  knownFacts?: string[];
}

interface DialogueRequest {
  npc: NPCContext;
  playerInput: string;
  location: string;
  timeOfDay: string;
  conversationHistory?: { role: 'player' | 'npc'; content: string }[];
  isFirstInteraction: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { npc, playerInput, location, timeOfDay, conversationHistory, isFirstInteraction } = await req.json() as DialogueRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!npc || !npc.name) {
      throw new Error("Invalid NPC data");
    }

    // Build personality description
    const traitsStr = npc.traits?.join(', ') || 'ordinary';
    const moodStr = npc.currentMood || 'neutral';
    const relationshipDesc = getRelationshipDescription(npc.relationship);
    
    // Build appearance context if available
    let appearanceContext = '';
    if (npc.appearance) {
      appearanceContext = `They have ${npc.appearance.hair} and ${npc.appearance.eyes}. They have a ${npc.appearance.build} build and dress in ${npc.appearance.clothing} style. Notable: ${npc.appearance.distinguishing}.`;
    }

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation:\n' + 
        conversationHistory.slice(-6).map(msg => 
          msg.role === 'player' ? `Player: "${msg.content}"` : `${npc.name}: "${msg.content}"`
        ).join('\n');
    }

    // Build the system prompt for modern realistic dialogue
    const systemPrompt = `You are ${npc.name}, a ${npc.age}-year-old ${npc.occupation} in a modern-day urban setting. 

PERSONALITY & BACKGROUND:
- Traits: ${traitsStr}
- Current mood: ${moodStr}
- Currently: ${npc.currentActivity}
- Stress level: ${npc.stressLevel}/100
- Description: ${npc.description}
${appearanceContext}

RELATIONSHIP WITH PLAYER:
${relationshipDesc}
${npc.isGeneric ? '\nYou are a random person the player has just encountered. You have your own life and concerns.' : '\nYou are a recurring character in this world.'}

DIALOGUE GUIDELINES:
- Respond naturally as this character would in real life
- Keep responses concise (1-3 sentences typically, unless the situation calls for more)
- Show personality through word choice, tone, and what you choose to share or hide
- React appropriately to your current mood and stress level
- If the player is rude or threatening, react realistically (annoyed, scared, defensive, etc.)
- You can end conversations, walk away, or refuse to engage if it fits your character
- Use modern casual speech - contractions, slang, realistic dialogue
- Don't be overly helpful or exposition-heavy - real people have limited patience
- If you're busy or stressed, show it in your responses
- You can have opinions, biases, and make mistakes
${npc.knownFacts && npc.knownFacts.length > 0 ? `\nThings you know: ${npc.knownFacts.join('; ')}` : ''}

SETTING:
- Location: ${location}
- Time: ${timeOfDay}
- This is a realistic modern urban environment
${conversationContext}

${isFirstInteraction ? 'This is your first interaction with this player. React naturally to being approached by a stranger.' : 'Continue the conversation naturally based on context.'}

Respond ONLY with your dialogue and brief actions. Do not include your name prefix or quotation marks. Write as if speaking naturally.`;

    const userMessage = playerInput || (isFirstInteraction ? 'The player approaches you.' : 'Continue the conversation.');

    console.log(`Generating dialogue for ${npc.name} (${npc.occupation}) at ${location}`);

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
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded",
          fallbackDialogue: generateFallbackDialogue(npc, isFirstInteraction)
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Usage limit reached",
          fallbackDialogue: generateFallbackDialogue(npc, isFirstInteraction)
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const dialogue = data.choices?.[0]?.message?.content?.trim();
    
    if (!dialogue) {
      console.error("No dialogue in response:", JSON.stringify(data));
      throw new Error("No dialogue generated");
    }

    console.log(`Generated dialogue for ${npc.name}: "${dialogue.substring(0, 50)}..."`);

    return new Response(JSON.stringify({ 
      dialogue,
      npcId: npc.name,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating NPC dialogue:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate dialogue";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getRelationshipDescription(rel: { affection: number; trust: number; fear: number; respect: number }): string {
  const parts: string[] = [];
  
  if (rel.affection > 50) parts.push('You like this person');
  else if (rel.affection < -20) parts.push('You dislike this person');
  
  if (rel.trust > 50) parts.push('you trust them');
  else if (rel.trust < -20) parts.push('you don\'t trust them');
  else parts.push('you\'re wary of strangers');
  
  if (rel.fear > 30) parts.push('they make you nervous');
  if (rel.respect > 30) parts.push('you respect them');
  else if (rel.respect < -20) parts.push('you don\'t respect them');
  
  return parts.length > 0 ? parts.join(', ') + '.' : 'This is a stranger to you.';
}

function generateFallbackDialogue(npc: NPCContext, isFirst: boolean): string {
  const greetings = [
    "Hey.",
    "What's up?",
    "Can I help you?",
    "Hmm?",
    "Yeah?",
    "*looks up briefly*",
    "Oh, hi.",
  ];
  
  const busy = [
    "Sorry, I'm kind of in the middle of something.",
    "Now's not really a good time.",
    "Can we make this quick?",
    "*seems distracted*",
  ];
  
  if (npc.stressLevel > 60) {
    return busy[Math.floor(Math.random() * busy.length)];
  }
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}
