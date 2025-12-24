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
  // Memory system additions
  memoryContext?: string;
  impression?: {
    overallSentiment: string;
    trustLevel: number;
    traits: string[];
  };
  activeTrauma?: boolean;
  recentMemories?: string[];
  patterns?: string[];
}

interface ConversationExchange {
  playerSaid: string;
  npcResponse: string;
  tick?: number;
}

interface DialogueRequest {
  npc: NPCContext;
  playerInput: string;
  location: string;
  timeOfDay: string;
  conversationHistory?: ConversationExchange[];
  isFirstInteraction: boolean;
  isFarewell?: boolean;
}

interface DialogueIndicators {
  memoryReferenced: boolean;
  memoryDetails?: string;
  traumaTriggered: boolean;
  contradictionDetected: boolean;
  contradictionDetails?: string;
  emotionalState?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { npc, playerInput, location, timeOfDay, conversationHistory, isFirstInteraction, isFarewell } = await req.json() as DialogueRequest;
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

    // Build conversation context from exchanges
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nCURRENT CONVERSATION (what was said in this session):\n' + 
        conversationHistory.slice(-8).map(exchange => 
          `Player: "${exchange.playerSaid}"\n${npc.name}: "${exchange.npcResponse}"`
        ).join('\n\n');
      conversationContext += '\n\nContinue the conversation naturally. Remember what was already discussed.';
    }

    // Build memory context
    let memorySection = '';
    if (npc.memoryContext) {
      memorySection = `\n\nYOUR MEMORIES ABOUT THIS PERSON:\n${npc.memoryContext}`;
    }
    
    if (npc.impression) {
      memorySection += `\n\nYOUR IMPRESSION: You feel ${npc.impression.overallSentiment} about them. Trust: ${npc.impression.trustLevel}/100.`;
      if (npc.impression.traits.length > 0) {
        memorySection += ` You think they are: ${npc.impression.traits.join(', ')}.`;
      }
    }
    
    if (npc.activeTrauma) {
      memorySection += '\n\n⚠️ TRAUMA TRIGGERED: Something about this interaction is bringing up painful memories. You may be distressed, defensive, or emotionally reactive.';
    }
    
    if (npc.recentMemories && npc.recentMemories.length > 0) {
      memorySection += '\n\nRELEVANT PAST EVENTS:\n' + npc.recentMemories.map(m => `- ${m}`).join('\n');
    }
    
    if (npc.patterns && npc.patterns.length > 0) {
      memorySection += `\n\nPATTERNS YOU'VE NOTICED: ${npc.patterns.join('; ')}`;
    }

    // Farewell context
    let farewellContext = '';
    if (isFarewell) {
      farewellContext = '\n\nThe player is saying goodbye and ending the conversation. Give a natural farewell response that reflects your relationship and the conversation you just had.';
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
${memorySection}

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
- NEVER include OOC (Out of Character) messages or technical instructions
- NEVER break character or reference game mechanics directly
- NEVER include meta-commentary about the conversation format
${npc.knownFacts && npc.knownFacts.length > 0 ? `\nThings you know: ${npc.knownFacts.join('; ')}` : ''}

MEMORY-BASED BEHAVIOR:
- Reference your memories naturally when relevant ("You helped me before...", "Last time we talked...", "I remember when...")
- If you have negative memories about the player, be appropriately guarded or hostile
- If you have positive memories, be warmer and more trusting
- If the player contradicts something you remember, express confusion or suspicion
- Traumatic memories may cause you to react strongly to certain topics

IMPORTANT - SPECIAL MARKERS:
When your dialogue references a memory, start that sentence with [MEMORY].
When you detect a contradiction with something you know, include [CONTRADICTION] at the start.
When trauma is affecting your response, include [TRAUMA] at the start.
These markers help the game system display appropriate visual cues.

SETTING:
- Location: ${location}
- Time: ${timeOfDay}
- This is a realistic modern urban environment
${conversationContext}
${farewellContext}

${isFirstInteraction ? 'This is your first interaction with this player. React naturally to being approached by a stranger.' : 'Continue the conversation naturally based on your memories and relationship.'}

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
    let dialogue = data.choices?.[0]?.message?.content?.trim();
    
    if (!dialogue) {
      console.error("No dialogue in response:", JSON.stringify(data));
      throw new Error("No dialogue generated");
    }

    console.log(`Generated dialogue for ${npc.name}: "${dialogue.substring(0, 50)}..."`);

    // Parse special markers from dialogue and build indicators
    const indicators: DialogueIndicators = {
      memoryReferenced: dialogue.includes('[MEMORY]'),
      traumaTriggered: dialogue.includes('[TRAUMA]') || npc.activeTrauma === true,
      contradictionDetected: dialogue.includes('[CONTRADICTION]'),
      emotionalState: npc.currentMood,
    };

    // Extract details from markers
    if (indicators.memoryReferenced) {
      const memoryMatch = dialogue.match(/\[MEMORY\]\s*([^.!?]+[.!?])/);
      if (memoryMatch) {
        indicators.memoryDetails = memoryMatch[1].trim();
      }
    }
    
    if (indicators.contradictionDetected) {
      const contradictionMatch = dialogue.match(/\[CONTRADICTION\]\s*([^.!?]+[.!?])/);
      if (contradictionMatch) {
        indicators.contradictionDetails = contradictionMatch[1].trim();
      }
    }

    // Clean markers from final dialogue
    dialogue = dialogue
      .replace(/\[MEMORY\]\s*/g, '')
      .replace(/\[TRAUMA\]\s*/g, '')
      .replace(/\[CONTRADICTION\]\s*/g, '')
      .trim();

    // Detect important topics mentioned in the response
    const importantKeywords = [
      'secret', 'promise', 'love', 'hate', 'kill', 'death', 'family', 'money',
      'help', 'please', 'sorry', 'forgive', 'trust', 'betray', 'truth', 'lie',
      'remember', 'never', 'always', 'important', 'dangerous', 'fear', 'scared'
    ];
    const dialogueLower = dialogue.toLowerCase();
    const inputLower = (playerInput || '').toLowerCase();
    const importantTopics = importantKeywords.filter(keyword => 
      dialogueLower.includes(keyword) || inputLower.includes(keyword)
    );

    return new Response(JSON.stringify({ 
      dialogue,
      npcId: npc.name,
      importantTopics,
      indicators,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating NPC dialogue:", error);
    return new Response(JSON.stringify({ error: "Unable to generate dialogue at this time" }), {
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
  // Mood-based greetings for more immersive fallback
  const neutralGreetings = [
    "Hey.",
    "What's up?",
    "Can I help you?",
    "Hmm?",
    "Yeah?",
    "*looks up briefly*",
    "Oh, hi.",
  ];
  
  const friendlyGreetings = [
    "Good to see you!",
    "Hey there!",
    "*smiles warmly*",
    "Oh, hello!",
  ];
  
  const guardedGreetings = [
    "*eyes you warily*",
    "What do you want?",
    "...yes?",
    "*keeps their distance*",
  ];
  
  const busyResponses = [
    "Sorry, I'm in the middle of something.",
    "Now's not really a good time.",
    "Can we make this quick?",
    "*seems distracted* Hang on a moment...",
    "I'm a bit tied up right now.",
  ];
  
  // Choose based on NPC state
  if (npc.stressLevel > 60) {
    return busyResponses[Math.floor(Math.random() * busyResponses.length)];
  }
  
  if (npc.relationship.affection > 30) {
    return friendlyGreetings[Math.floor(Math.random() * friendlyGreetings.length)];
  }
  
  if (npc.relationship.trust < -10 || npc.relationship.fear > 20) {
    return guardedGreetings[Math.floor(Math.random() * guardedGreetings.length)];
  }
  
  return neutralGreetings[Math.floor(Math.random() * neutralGreetings.length)];
}
