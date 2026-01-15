import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Relationship milestone types for romance progression
type MilestoneType = 
  | 'stranger' | 'acquaintance' | 'friend' | 'close_friend' 
  | 'crush' | 'dating' | 'partner' | 'lover' | 'soulmate' 
  | 'rival' | 'enemy';

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
  // Relationship milestone for romance system
  relationshipMilestone?: MilestoneType;
  // Clothing/fashion context
  playerClothingContext?: string;
}

interface ConversationExchange {
  playerSaid: string;
  npcResponse: string;
  tick?: number;
}

interface PlayerStateContext {
  // Armor and clothing
  currentOutfit?: string;
  armorType?: 'none' | 'light' | 'medium' | 'heavy';
  armorCondition?: 'pristine' | 'worn' | 'damaged' | 'destroyed';
  visibleWeapons?: string[];
  
  // Physical state
  wounds?: { location: string; severity: 'minor' | 'moderate' | 'severe' | 'critical' }[];
  bloodVisible?: boolean;
  exhaustionLevel?: number; // 0-100
  
  // Emotional state
  currentMood?: string;
  moodIntensity?: number; // 0-100
  visibleEmotions?: string[]; // trembling, crying, laughing, scowling, etc.
  
  // Environmental effects on player
  wetFromRain?: boolean;
  dirtyCovered?: boolean;
  coldShivering?: boolean;
}

interface DialogueRequest {
  npc: NPCContext;
  playerInput: string;
  location: string;
  timeOfDay: string;
  conversationHistory?: ConversationExchange[];
  isFirstInteraction: boolean;
  isFarewell?: boolean;
  playerState?: PlayerStateContext;
  weatherContext?: string;
}

interface DialogueIndicators {
  memoryReferenced: boolean;
  memoryDetails?: string;
  traumaTriggered: boolean;
  contradictionDetected: boolean;
  contradictionDetails?: string;
  emotionalState?: string;
}

interface MilestoneProgression {
  shouldProgress: boolean;
  currentMilestone: MilestoneType;
  suggestedMilestone?: MilestoneType;
  triggerType?: 'confession' | 'intimacy' | 'trust_built' | 'shared_moment' | 'romantic_gesture' | 'commitment' | 'deep_connection';
  triggerDescription?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { npc, playerInput, location, timeOfDay, conversationHistory, isFirstInteraction, isFarewell, playerState, weatherContext } = await req.json() as DialogueRequest;
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
    const relationshipDesc = getRelationshipDescription(npc.relationship, npc.relationshipMilestone);
    const milestoneModifiers = getMilestoneDialogueModifiers(npc.relationshipMilestone);
    
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

    // Clothing/fashion context
    let clothingContext = '';
    if (npc.playerClothingContext) {
      clothingContext = `\n\n${npc.playerClothingContext}\n\nYou may comment on the player's outfit if it seems remarkable (very stylish, intimidating, or poorly put together). Don't force comments - only mention clothing if it's genuinely noteworthy and fits the conversation naturally.`;
    }

    // ============= PLAYER STATE REACTIONS =============
    // Build comprehensive player state context for NPC reactions
    let playerStateContext = '';
    if (playerState) {
      playerStateContext = '\n\n===== PLAYER APPEARANCE (What You See) =====\n';
      playerStateContext += 'REACT NATURALLY to what you observe about this person:\n\n';
      
      // Armor/Clothing reactions
      if (playerState.armorType && playerState.armorType !== 'none') {
        const armorReactions: Record<string, string> = {
          light: 'They\'re wearing light protective gear. Unusual but not alarming.',
          medium: 'They\'re wearing medium armor/tactical gear. This is concerning - are they expecting trouble?',
          heavy: 'They\'re in HEAVY ARMOR - full tactical/combat gear. This is extremely intimidating and alarming. You should react with fear, suspicion, or at least strong curiosity.'
        };
        playerStateContext += `🛡️ ARMOR: ${armorReactions[playerState.armorType]}\n`;
        
        if (playerState.armorCondition && playerState.armorCondition !== 'pristine') {
          playerStateContext += `   - Armor condition: ${playerState.armorCondition} - ${playerState.armorCondition === 'damaged' ? 'Shows recent combat damage!' : 'Looks well-used'}\n`;
        }
      }
      
      if (playerState.currentOutfit) {
        playerStateContext += `👔 OUTFIT: ${playerState.currentOutfit}\n`;
      }
      
      if (playerState.visibleWeapons && playerState.visibleWeapons.length > 0) {
        playerStateContext += `⚔️ VISIBLE WEAPONS: ${playerState.visibleWeapons.join(', ')} - React appropriately! Armed strangers are concerning.\n`;
      }
      
      // Wound reactions - NPCs MUST react to visible injuries
      if (playerState.wounds && playerState.wounds.length > 0) {
        playerStateContext += '\n🩸 VISIBLE INJURIES (You MUST react to these):\n';
        playerState.wounds.forEach(wound => {
          const woundReactions: Record<string, string> = {
            minor: 'minor scratch/bruise - mention if conversation allows',
            moderate: 'noticeable injury - express concern or comment',
            severe: 'SERIOUS INJURY - express shock, offer help, or back away in alarm',
            critical: 'LIFE-THREATENING - this person is badly hurt! React with urgency!'
          };
          playerStateContext += `   - ${wound.severity.toUpperCase()} wound on ${wound.location}: ${woundReactions[wound.severity]}\n`;
        });
        
        if (playerState.bloodVisible) {
          playerStateContext += '   - ⚠️ BLOOD IS VISIBLE - Most people react strongly to seeing blood!\n';
        }
      }
      
      // Exhaustion
      if (playerState.exhaustionLevel && playerState.exhaustionLevel > 30) {
        if (playerState.exhaustionLevel > 70) {
          playerStateContext += '😫 EXHAUSTION: They look completely exhausted - dark circles, sluggish movement, barely staying upright\n';
        } else if (playerState.exhaustionLevel > 50) {
          playerStateContext += '😓 TIREDNESS: They look quite tired and worn out\n';
        } else {
          playerStateContext += '😐 FATIGUE: They seem a bit tired\n';
        }
      }
      
      // Emotional state reactions
      if (playerState.currentMood || playerState.visibleEmotions?.length) {
        playerStateContext += '\n💭 EMOTIONAL STATE (visible to you):\n';
        
        if (playerState.currentMood) {
          const intensity = playerState.moodIntensity || 50;
          const intensityWord = intensity > 70 ? 'intensely' : intensity > 40 ? 'visibly' : 'slightly';
          playerStateContext += `   - They appear ${intensityWord} ${playerState.currentMood}\n`;
        }
        
        if (playerState.visibleEmotions && playerState.visibleEmotions.length > 0) {
          playerStateContext += `   - Observable signs: ${playerState.visibleEmotions.join(', ')}\n`;
          
          // Specific emotion guidance
          if (playerState.visibleEmotions.includes('crying') || playerState.visibleEmotions.includes('tears')) {
            playerStateContext += '   - ⚠️ They appear to be crying/have tear tracks - respond with empathy or discomfort\n';
          }
          if (playerState.visibleEmotions.includes('trembling') || playerState.visibleEmotions.includes('shaking')) {
            playerStateContext += '   - ⚠️ They\'re visibly trembling - from fear, cold, or stress? React appropriately\n';
          }
          if (playerState.visibleEmotions.includes('rage') || playerState.visibleEmotions.includes('furious')) {
            playerStateContext += '   - ⚠️ They appear ANGRY - be cautious, defensive, or try to de-escalate\n';
          }
        }
      }
      
      // Environmental effects on player
      if (playerState.wetFromRain) {
        playerStateContext += '🌧️ They\'re soaking wet from the rain - dripping water, clothes clinging\n';
      }
      if (playerState.dirtyCovered) {
        playerStateContext += '🟤 They\'re covered in dirt/grime - have they been crawling through something?\n';
      }
      if (playerState.coldShivering) {
        playerStateContext += '❄️ They\'re shivering from cold - might offer warmth or comment\n';
      }
      
      playerStateContext += '\n** Your dialogue should ACKNOWLEDGE what you see when appropriate **\n';
    }

    // Weather context for environmental reactions
    let weatherSection = '';
    if (weatherContext) {
      weatherSection = `\n\nCURRENT WEATHER: ${weatherContext}\nThis affects the conversation naturally - reference weather if it makes sense.`;
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

RELATIONSHIP BEHAVIOR GUIDE:
${milestoneModifiers}
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

RELATIONSHIP PROGRESSION MARKERS (use when appropriate emotional moments occur):
[MILESTONE_TRIGGER:type:description] - Use when a significant relationship moment happens:
- confession: When feelings are confessed or revealed
- intimacy: When physical or emotional intimacy deepens
- trust_built: When deep trust is established through actions
- shared_moment: When a meaningful bonding experience occurs
- romantic_gesture: When romantic interest is shown or reciprocated
- commitment: When promises or commitments are made
- deep_connection: When souls connect on a profound level

Only include this marker when the conversation genuinely reaches such a moment.
These markers help the game system display appropriate visual cues.

SETTING:
- Location: ${location}
- Time: ${timeOfDay}
- This is a realistic modern urban environment
${conversationContext}
${farewellContext}
${clothingContext}
${playerStateContext}
${weatherSection}

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

    // Parse milestone trigger marker
    const milestoneProgression: MilestoneProgression = {
      shouldProgress: false,
      currentMilestone: npc.relationshipMilestone || 'stranger',
    };

    const milestoneTriggerMatch = dialogue.match(/\[MILESTONE_TRIGGER:(\w+):([^\]]+)\]/);
    if (milestoneTriggerMatch) {
      const triggerType = milestoneTriggerMatch[1] as MilestoneProgression['triggerType'];
      const triggerDescription = milestoneTriggerMatch[2].trim();
      
      milestoneProgression.shouldProgress = true;
      milestoneProgression.triggerType = triggerType;
      milestoneProgression.triggerDescription = triggerDescription;
      milestoneProgression.suggestedMilestone = calculateNextMilestone(
        npc.relationshipMilestone || 'stranger',
        triggerType,
        npc.relationship
      );
      
      console.log(`Milestone progression detected: ${triggerType} - ${triggerDescription}`);
    }

    // Clean markers from final dialogue
    dialogue = dialogue
      .replace(/\[MEMORY\]\s*/g, '')
      .replace(/\[TRAUMA\]\s*/g, '')
      .replace(/\[CONTRADICTION\]\s*/g, '')
      .replace(/\[MILESTONE_TRIGGER:[^\]]+\]\s*/g, '')
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
      milestoneProgression,
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

function getMilestoneDialogueModifiers(milestone: MilestoneType | undefined): string {
  const modifiers: Record<MilestoneType, string> = {
    stranger: `You don't know this person. Be appropriately distant and polite but not overly friendly.`,
    acquaintance: `You've met briefly before. Be friendly but not too familiar. Keep some professional distance.`,
    friend: `This is a friend. Be warm, use casual language, share some personal thoughts. You care about them.`,
    close_friend: `This is a close friend. Be very open, use inside jokes if appropriate, share concerns and personal matters freely.`,
    crush: `You have romantic feelings for this person but haven't expressed them. Be slightly nervous, extra attentive, maybe blush or stumble over words. Try to impress them subtly.`,
    dating: `You're romantically involved. Use pet names occasionally, be affectionate, reference shared experiences. Show comfort and intimacy in conversation.`,
    partner: `This is your committed partner. Deep intimacy and comfort. Use terms of endearment naturally, reference your relationship, show protectiveness and devotion.`,
    lover: `This is your lover. Be openly affectionate, use intimate language, reference physical and emotional closeness. Show passion and desire alongside emotional connection.`,
    soulmate: `This is your soulmate - the deepest connection possible. Finish each other's thoughts, show profound understanding, express eternal devotion. Every interaction reflects your unbreakable bond.`,
    rival: `This is a rival. Be competitive, slightly antagonistic, but with underlying respect. Try to one-up them.`,
    enemy: `This is an enemy. Be hostile, guarded, or dismissive. Show active dislike and distrust.`,
  };
  
  return milestone ? modifiers[milestone] : modifiers.stranger;
}

function getRelationshipDescription(rel: { affection: number; trust: number; fear: number; respect: number }, milestone?: MilestoneType): string {
  const parts: string[] = [];
  
  // Add milestone context first
  if (milestone && milestone !== 'stranger') {
    const milestoneLabels: Record<MilestoneType, string> = {
      stranger: 'stranger',
      acquaintance: 'an acquaintance',
      friend: 'a friend',
      close_friend: 'a close friend',
      crush: 'someone you have a crush on',
      dating: 'someone you\'re dating',
      partner: 'your committed partner',
      lover: 'your lover',
      soulmate: 'your soulmate',
      rival: 'your rival',
      enemy: 'your enemy',
    };
    parts.push(`This person is ${milestoneLabels[milestone]}`);
  }
  
  if (rel.affection > 50) parts.push('you like them deeply');
  else if (rel.affection > 20) parts.push('you like them');
  else if (rel.affection < -20) parts.push('you dislike them');
  
  if (rel.trust > 50) parts.push('you trust them completely');
  else if (rel.trust > 20) parts.push('you trust them');
  else if (rel.trust < -20) parts.push('you don\'t trust them');
  else if (!milestone || milestone === 'stranger') parts.push('you\'re wary of strangers');
  
  if (rel.fear > 30) parts.push('they make you nervous');
  if (rel.respect > 50) parts.push('you deeply respect them');
  else if (rel.respect > 20) parts.push('you respect them');
  else if (rel.respect < -20) parts.push('you don\'t respect them');
  
  return parts.length > 0 ? parts.join(', ') + '.' : 'This is a stranger to you.';
}

// Calculate the next milestone based on trigger type and current relationship stats
function calculateNextMilestone(
  currentMilestone: MilestoneType,
  triggerType: MilestoneProgression['triggerType'],
  relationship: { affection: number; trust: number; fear: number; respect: number }
): MilestoneType {
  // Define the romantic progression path
  const romanticPath: MilestoneType[] = [
    'stranger', 'acquaintance', 'friend', 'close_friend', 'crush', 'dating', 'partner', 'lover', 'soulmate'
  ];
  
  const currentIndex = romanticPath.indexOf(currentMilestone);
  
  // If not on romantic path (rival/enemy), handle separately
  if (currentIndex === -1) {
    // Rivals can become friends with enough positive interaction
    if (currentMilestone === 'rival' && relationship.affection > 30) {
      return 'acquaintance';
    }
    // Enemies can become rivals with reduced hostility
    if (currentMilestone === 'enemy' && relationship.affection > 0) {
      return 'rival';
    }
    return currentMilestone;
  }
  
  // Determine progression based on trigger type
  let progressionSteps = 1;
  
  switch (triggerType) {
    case 'confession':
      // Confessions can jump from friend/close_friend to crush, or crush to dating
      if (currentMilestone === 'friend' || currentMilestone === 'close_friend') {
        return 'crush';
      }
      if (currentMilestone === 'crush') {
        return 'dating';
      }
      break;
    case 'commitment':
      // Commitments advance dating to partner
      if (currentMilestone === 'dating') {
        return 'partner';
      }
      break;
    case 'deep_connection':
      // Deep connections can advance partner to lover or lover to soulmate
      if (currentMilestone === 'partner') {
        return 'lover';
      }
      if (currentMilestone === 'lover') {
        return 'soulmate';
      }
      break;
    case 'intimacy':
      // Intimacy advances dating to partner or partner to lover
      if (currentMilestone === 'dating' && relationship.trust > 40) {
        return 'partner';
      }
      if (currentMilestone === 'partner') {
        return 'lover';
      }
      break;
    case 'romantic_gesture':
      // Romantic gestures help with early progression
      if (currentMilestone === 'friend' && relationship.affection > 30) {
        return 'crush';
      }
      if (currentMilestone === 'crush') {
        return 'dating';
      }
      break;
    case 'trust_built':
    case 'shared_moment':
      // These generally advance by one step
      progressionSteps = 1;
      break;
  }
  
  // Default: advance by one step on the romantic path
  const nextIndex = Math.min(currentIndex + progressionSteps, romanticPath.length - 1);
  return romanticPath[nextIndex];
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
