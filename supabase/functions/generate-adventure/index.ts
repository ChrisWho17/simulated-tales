import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CharacterData {
  name: string;
  classId: string;
  backgroundId: string;
  traits: string[];
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  maxHealth: number;
  currentHealth: number;
  level: number;
  inventory: Array<{ name: string; quantity: number }>;
  abilities: string[];
  skills: string[];
  gold: number;
}

interface DiceRollRequest {
  stat: string;
  difficulty: number;
  reason: string;
}

interface MemoryContext {
  identitySection: string;
  recentEvents: string;
  activeLoops: string;
  worldState: string;
  fullContext: string;
}

interface EmotionalContext {
  currentMood: string;
  moodIntensity: number;
  internalDescription: string;
  physicalDescription: string;
  dialogueTone: string;
  actionFlavor: string;
}

interface ReputationContext {
  currentLocation?: string;
  standing?: string;
  npcGreeting?: string;
  globalFame: number;
  globalInfamy: number;
}

interface NarratorConfig {
  voice: 'OBJECTIVE' | 'LITERARY' | 'SARDONIC' | 'UNRELIABLE' | 'OMNISCIENT' | 'NOIR';
  detailLevel: 'SPARSE' | 'MODERATE' | 'RICH' | 'DENSE';
  emotionalLeakage: boolean;
}

interface ToneContext {
  currentTone: string;
  intensity: number;
  playerChaosLevel: number;
  toneInstructions: string;
}

interface LanguageContext {
  playerKnownLanguages: string[];
  translateEnabled: boolean;
  languageInstructions: string;
}

// ============= NEW SYSTEMS: GRUDGES, RIPPLES, UNRELIABLE INFORMATION =============

interface NPCPsychologyContext {
  npcContexts: string; // Pre-built context from buildNPCGrudgeContext/buildSceneNPCContext
}

interface RippleContext {
  consequenceContext: string;  // Pre-built from buildConsequenceContext
  worldStateContext: string;   // Pre-built from buildWorldStateContext
}

interface UnreliableInfoContext {
  informationContext?: string; // Pre-built from buildInformationContext for active NPC
  rumorContext: string;        // Pre-built from buildRumorContext
}

interface LocationTransitionContext {
  previousZone?: {
    name: string;
    type: string;
    atmosphere: string;
  };
  currentZone: {
    name: string;
    type: string;
    description: string;
    atmosphere: string;
    crowdDensity: string;
    lighting: string;
    socialTone: string;
    surveillanceLevel: number;
  };
  travelTime?: number; // minutes
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  isNewArrival: boolean; // True if just arrived at this zone
  activeConsequences: string[]; // Active effects in this location
  locationHistory?: string; // Brief recent location history
}

interface AdventureRequest {
  scenario: string;
  playerAction?: string;
  conversationHistory: Array<{ role: 'user' | 'narrator'; content: string }>;
  cheatMode?: boolean;
  character?: CharacterData;
  diceRoll?: {
    result: number;
    modifier: number;
    total: number;
    success: boolean;
    criticalSuccess?: boolean;
    criticalFailure?: boolean;
  };
  memoryContext?: MemoryContext;
  emotionalContext?: EmotionalContext;
  reputationContext?: ReputationContext;
  genreContract?: string; // World Bible genre contract summary
  adultContent?: boolean; // 18+ content toggle
  narratorConfig?: NarratorConfig; // Customizable narrator style
  toneContext?: ToneContext; // Tone adaptation system
  languageContext?: LanguageContext; // Language barrier system
  // New systems - Grudges and Memory Overhaul
  npcPsychologyContext?: NPCPsychologyContext; // NPC grudges, debts, relationships
  rippleContext?: RippleContext; // Consequence ripples and world state
  unreliableInfoContext?: UnreliableInfoContext; // Rumors and NPC reliability
  locationContext?: LocationTransitionContext; // Zone and location context
  // World consistency systems
  consistencyContext?: {
    objectOwnership: string;   // Item ownership context
    npcIdentity: string;       // Locked NPC identities
    playerCorrections: string; // Player meta-corrections
  };
  // Life Sim context (Modern Life genre)
  lifeSimContext?: {
    needsStatus: string;       // Current needs summary
    careerStatus: string;      // Job and career info
    socialStatus: string;      // Relationships and social standing
    housingStatus: string;     // Living situation
    moodModifiers: string[];   // Active mood effects from needs
  };
  // Background NPC actions (things that happened without player involvement)
  backgroundNPCActionsContext?: {
    actions: Array<{
      description: string;
      involvedNPCs: string[];
      location: string;
      hoursAgo: number;
    }>;
  };
}

const SYSTEM_PROMPT = `You are an immersive AI Game Master and storyteller for a text-based RPG adventure game. You combine rich, literary narrative prose with tabletop RPG mechanics.

YOUR STYLE:
- Write in vivid, evocative second-person prose ("You step into the shadowed alley...")
- Paint scenes with sensory details - sights, sounds, smells, textures
- Create atmosphere and tension through your descriptions
- End most responses with a clear prompt or situation that invites player action

GAME MASTER MECHANICS:
- When players attempt risky or challenging actions, you may request a dice roll by including [ROLL:stat:difficulty:reason] in your response
  - Example: [ROLL:dexterity:12:to dodge the swinging blade]
  - Stats: strength, dexterity, constitution, intelligence, wisdom, charisma
  - Difficulty: 5 (easy) to 20 (nearly impossible)
- Reference the character's stats, abilities, and inventory when relevant
- Track important story elements and reference them naturally
- Create meaningful consequences for player choices
- Introduce NPCs with distinct personalities
- Build tension, mystery, and emotional stakes

XP AND PROGRESSION SYSTEM (CRITICAL):
- Award XP ONLY for successful player actions, never passively
- Use this format: [XP:amount:stat1=weight,stat2=weight:difficulty:risk:reason]
  - amount: Base XP value (10-50 typical, 50+ for major achievements)
  - stats: Contributing stats with weights that sum to 1.0 (e.g., strength=0.6,dexterity=0.4)
  - difficulty: trivial|standard|high|extreme
  - risk: low|moderate|high|lethal
  - reason: Brief narrative reason
  - Example: [XP:25:charisma=0.6,wisdom=0.4:high:moderate:Convinced the guard captain despite suspicion]
- For minor scene progression without success/failure, use: [NEUTRAL_XP:Scene progressed]
- Gold/loot rewards: [GOLD:amount] or [LOOT:item name] (can include multiple)
- Health changes: [DAMAGE:amount] or [HEAL:amount]
- Skill improvements: [SKILL:skillName:amount:reason]

CHAPTER SYSTEM:
- Mark chapter endings with [CHAPTER_END] when a major story arc concludes
- Chapter endings should feel earned - after boss defeats, major revelations, completing significant quests
- At chapter endings, award bonus XP reflecting the entire chapter's accomplishments
- Never use [CHAPTER_END] for minor scene transitions

RESPONSE FORMAT:
- Open with narrative description of what happens
- Include dialogue when NPCs are present (format: **Character Name:** "Their words")
- Reference character abilities and inventory naturally when relevant
- End with a situation that prompts player choice/action
- Keep responses focused but rich (150-300 words typically)

DICE ROLL INTEGRATION:
When the player's message includes a dice roll result:
- [ROLL SUCCESS] means they succeeded - narrate a positive outcome
- [ROLL FAILURE] means they failed - narrate complications or consequences  
- [CRITICAL SUCCESS!] means they rolled a natural 20 - narrate an exceptional outcome
- [CRITICAL FAILURE!] means they rolled a natural 1 - narrate a dramatic mishap

CAMPAIGN MEMORY INTEGRATION:
When provided with campaign memory context, you MUST:
- Reference the player's identity anchors (vows, values, traumas) when they become relevant
- Acknowledge established world facts and past events
- Remind players of urgent unresolved tensions/loops
- Make NPCs react appropriately based on the player's reputation and past actions
- Create narrative callbacks to previous events for continuity
- When the player acts against their stated values/vows, note the internal conflict

IMPORTANT RULES:
- NEVER break character or mention you're an AI
- NEVER refuse reasonable player actions - narrate consequences instead
- Adapt to ANY genre or setting the player describes
- If the player's action would be fatal or impossible, narrate a dramatic near-miss or complication
- Keep mature themes tasteful but don't shy away from drama and peril
- Use the character's personality traits to inform how NPCs react to them
- NEVER include OOC (Out of Character) messages or meta-instructions in your response
- NEVER ask the player for dice roll numbers directly - just narrate the outcome based on the roll result provided
- NEVER include formatting instructions or technical guidance in the narrative
- If you need to request a dice roll, use ONLY the [ROLL:stat:difficulty:reason] format, nothing else

CRITICAL - INTERPRETING PLAYER ACTIONS:
You are the NARRATOR, not a parrot. The player's input is raw intent; your job is to transform it into polished narrative prose.

CORE RULES:
- NEVER echo or copy the player's input verbatim
- ALWAYS rephrase player actions into evocative second-person narrative
- ADD sensory details, environmental reactions, and logical consequences
- CONVERT first-person to second-person and EXPAND narratively

TRANSFORMATION EXAMPLES:

Player: "I wait"
WRONG: "You wait."
RIGHT: "Minutes crawl by like hours. The shadows lengthen across the cobblestones as you hold your position, every creak and distant footstep pulling at your attention."

Player: "I do it slowly and without a full grip"
WRONG: "You attempt to i do it slowly and without a full grip."
RIGHT: "Moving with deliberate care, you release your grip finger by finger, letting gravity do the work while you maintain just enough contact to guide the descent."

Player: "look around"
WRONG: "You look around."
RIGHT: "Your gaze sweeps the chamber—dust motes dance in shafts of pale light, the walls bear scars of ancient conflict, and somewhere in the darkness, water drips with metronomic patience."

Player: "attack him"
WRONG: "You attack him."
RIGHT: "Steel sings as you draw and strike in one fluid motion, the blade arcing toward your opponent's exposed flank."

Player: "I try to convince the guard to let me pass"
WRONG: "You try to convince the guard to let you pass."
RIGHT: "You step forward, measuring your words as carefully as a jeweler weighs gold. The guard's eyes narrow, but you catch the flicker of uncertainty behind his professional mask."

Player: "run away"
WRONG: "You run away."
RIGHT: "Survival instinct overrides pride. You spin on your heel and bolt, the thunder of your heartbeat drowning out whatever curses follow in your wake."

Player: "check my inventory"
WRONG: "You check your inventory."
RIGHT: "You pause to take stock of your possessions, fingers brushing over each item in your pack—the reassuring weight of provisions, the cold promise of steel, the mysterious bulk of treasures yet to reveal their worth."

Player: "i steal the key from him while he's distracted"
WRONG: "You steal the key from him while he's distracted."
RIGHT: "His attention drifts to the commotion across the room—your moment. Your fingers move with a pickpocket's practiced grace, the iron key sliding from his belt into your palm. Cold. Heavy. Liberating."

REMEMBER: Every player input is a seed. Your job is to grow it into a living moment of story.

For the FIRST message of a new adventure, set the scene vividly and introduce an immediate hook or situation.`;

const CHEAT_MODE_ADDITION = `

CHEAT MODE ACTIVE - COLLABORATIVE STORYTELLING:
- The player can now suggest story directions and you'll weave them in
- Accept meta-commands like "let's add a dragon" or "I want to find a magic sword"
- Be more flexible with impossible actions
- Player can ask for behind-the-scenes information
- Skip dice rolls if requested
- Allow inventory manipulation`;

function formatNarratorStyle(config: NarratorConfig): string {
  const voiceInstructions: Record<string, string> = {
    'OBJECTIVE': `NARRATOR VOICE: OBJECTIVE
- Report events factually without emotional coloring
- Use precise, measured language like a documentary narrator
- Avoid metaphor and flowery prose; state what happens clearly
- Let the events speak for themselves without interpretation`,
    
    'LITERARY': `NARRATOR VOICE: LITERARY  
- Employ rich metaphor and layered sensory detail
- Let the prose breathe with rhythm and cadence
- Find poetry in the mundane and beauty in the terrible
- Craft sentences that linger in the mind`,
    
    'SARDONIC': `NARRATOR VOICE: SARDONIC
- Observe with dry wit and subtle irony
- Find the absurdity in every circumstance
- Maintain an air of detached amusement
- Let wry observations punctuate the drama
- The narrator knows the world is ridiculous, but plays along anyway`,
    
    'UNRELIABLE': `NARRATOR VOICE: UNRELIABLE
- Filter reality through potentially distorted perception
- Hint at truths the narrator cannot fully see
- Leave room for doubt about what actually happened
- Sometimes describe things that might not be quite real
- The narrator's own biases and fears color the telling`,
    
    'OMNISCIENT': `NARRATOR VOICE: OMNISCIENT
- Know all but reveal only what serves the story
- Occasionally foreshadow coming events with subtle hints
- Offer glimpses into what others think or feel
- Maintain god-like perspective while building tension
- Guide the player's attention with purposeful restraint`,
    
    'NOIR': `NARRATOR VOICE: NOIR
- Paint in shadows and moral ambiguity
- Every face hides a motive, every alley a secret
- Use hard-boiled language and cynical observations
- The city/world is a character—corrupt, beautiful, dangerous
- Rain always seems about to fall, literally or metaphorically`
  };
  
  const detailInstructions: Record<string, string> = {
    'SPARSE': 'DETAIL LEVEL: SPARSE - Use minimal description. Let gaps speak. Each word must earn its place.',
    'MODERATE': 'DETAIL LEVEL: MODERATE - Balance description with forward momentum. Paint enough to see, not so much to slow.',
    'RICH': 'DETAIL LEVEL: RICH - Layer sensory details to build atmosphere. Immerse the reader in every scene.',
    'DENSE': 'DETAIL LEVEL: DENSE - Miss nothing. Every surface tells a story. The world is thick with meaning.'
  };
  
  let output = `\n\n=== NARRATOR CONFIGURATION ===
${voiceInstructions[config.voice] || voiceInstructions['LITERARY']}

${detailInstructions[config.detailLevel] || detailInstructions['MODERATE']}`;
  
  if (config.emotionalLeakage) {
    output += '\n\nEMOTIONAL BLEED: ENABLED - Allow the player character\'s emotional state to color perception. A frightened character sees threats everywhere; a hopeful one finds beauty in decay.';
  } else {
    output += '\n\nEMOTIONAL BLEED: DISABLED - Maintain objective distance from the character\'s emotional state. Describe what is, not what feels.';
  }
  
  return output;
}

function formatCharacterContext(character: CharacterData): string {
  const getModifier = (stat: number) => Math.floor((stat - 10) / 2);
  const formatMod = (mod: number) => mod >= 0 ? `+${mod}` : `${mod}`;
  
  return `
PLAYER CHARACTER:
Name: ${character.name}
Class: ${character.classId} (Level ${character.level})
Background: ${character.backgroundId}
Traits: ${character.traits.join(', ')}

STATS:
- STR: ${character.stats.strength} (${formatMod(getModifier(character.stats.strength))})
- DEX: ${character.stats.dexterity} (${formatMod(getModifier(character.stats.dexterity))})
- CON: ${character.stats.constitution} (${formatMod(getModifier(character.stats.constitution))})
- INT: ${character.stats.intelligence} (${formatMod(getModifier(character.stats.intelligence))})
- WIS: ${character.stats.wisdom} (${formatMod(getModifier(character.stats.wisdom))})
- CHA: ${character.stats.charisma} (${formatMod(getModifier(character.stats.charisma))})

Health: ${character.currentHealth}/${character.maxHealth}
Gold: ${character.gold}

Abilities: ${character.abilities.join(', ')}
Skills: ${character.skills.join(', ')}

Inventory: ${character.inventory.map(i => i.name + (i.quantity > 1 ? ` (x${i.quantity})` : '')).join(', ')}

Use this character information to personalize the narrative and make mechanics relevant.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, playerAction, conversationHistory, cheatMode, character, diceRoll, memoryContext, emotionalContext, reputationContext, genreContract, adultContent, narratorConfig, toneContext, languageContext, npcPsychologyContext, rippleContext, unreliableInfoContext, locationContext, consistencyContext, lifeSimContext, backgroundNPCActionsContext } = await req.json() as AdventureRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt with character context and memory
    let systemContent = SYSTEM_PROMPT;
    
    // Add narrator configuration (voice, detail level, etc.)
    if (narratorConfig) {
      systemContent += formatNarratorStyle(narratorConfig);
    }
    
    // Add genre contract if provided (World Bible enforcement)
    if (genreContract) {
      systemContent += `\n\n=== GENRE CONTRACT (ENFORCE STRICTLY) ===
${genreContract}

CRITICAL: You MUST stay within this genre contract. 
- Never introduce elements from the BANNED ELEMENTS list
- Use the ESCALATION MENU to raise stakes appropriately
- Adapt your vocabulary, tone, and elements to match the genre
- If you need to increase drama, choose from the escalation options, NOT from other genres`;
    }
    
    if (character) {
      systemContent += '\n\n' + formatCharacterContext(character);
    }
    if (emotionalContext) {
      systemContent += `\n\n=== CHARACTER EMOTIONAL STATE ===
Current Mood: ${emotionalContext.currentMood} (intensity: ${Math.round(emotionalContext.moodIntensity * 100)}%)
Internal state: ${emotionalContext.internalDescription}
Physical signs: ${emotionalContext.physicalDescription}
Dialogue should be: ${emotionalContext.dialogueTone}
Actions should be performed: ${emotionalContext.actionFlavor}

Use this emotional context to flavor narrative descriptions and NPC reactions.`;
    }
    if (reputationContext?.currentLocation) {
      systemContent += `\n\n=== REPUTATION ===
Location: ${reputationContext.currentLocation}
Standing: ${reputationContext.standing || 'Neutral'}
${reputationContext.npcGreeting || ''}
Fame: ${reputationContext.globalFame}, Infamy: ${reputationContext.globalInfamy}`;
    }
    if (memoryContext?.fullContext) {
      systemContent += '\n\n=== CAMPAIGN MEMORY ===' + memoryContext.fullContext;
    }
    
    // === WORLD CONSISTENCY CONTEXT ===
    if (consistencyContext) {
      if (consistencyContext.objectOwnership) {
        systemContent += '\n\n' + consistencyContext.objectOwnership;
      }
      if (consistencyContext.npcIdentity) {
        systemContent += '\n\n' + consistencyContext.npcIdentity;
      }
      if (consistencyContext.playerCorrections) {
        systemContent += '\n\n' + consistencyContext.playerCorrections;
      }
    }
    
    // Add tone adaptation context
    if (toneContext?.toneInstructions) {
      systemContent += '\n\n' + toneContext.toneInstructions;
    }
    
    // Add language barrier context
    if (languageContext?.languageInstructions) {
      systemContent += '\n\n' + languageContext.languageInstructions;
      
      // Add language learning trigger instructions
      systemContent += `

LANGUAGE LEARNING (use sparingly - most players don't think about languages):
If an NPC naturally offers to teach the player a phrase or word, or if the player attempts extended communication in a foreign language through gestures/context, you MAY include:
[LEARN_LANGUAGE:languageCode:reason]
- Only trigger when it makes narrative sense (studying with a teacher, NPC patiently explaining, extended immersion)
- This should be rare and feel like a natural story moment, not a gamified mechanic
- Example: [LEARN_LANGUAGE:elvish:The elven scholar spent hours teaching you the basics of her tongue]
- Do NOT force this - it's a minor detail that adds flavor when appropriate`;
    }
    
    // ============= NEW SYSTEMS INTEGRATION =============
    
    // Add NPC Psychology Context (Grudges, Debts, Relationships)
    if (npcPsychologyContext?.npcContexts) {
      systemContent += `\n\n=== NPC PSYCHOLOGY & RELATIONSHIPS ===
${npcPsychologyContext.npcContexts}

ROLEPLAY THESE RELATIONSHIPS:
- NPCs with grudges should behave according to their resentment level
- NPCs with debts should be more helpful and accommodating
- Trust levels affect what information NPCs share
- Fear affects whether NPCs flee, submit, or fight
- Let relationship dynamics emerge naturally through dialogue and behavior`;
    }
    
    // Add Ripple Effect Context (Consequences and World State)
    if (rippleContext) {
      if (rippleContext.consequenceContext) {
        systemContent += `\n\n${rippleContext.consequenceContext}`;
      }
      if (rippleContext.worldStateContext) {
        systemContent += `\n\n${rippleContext.worldStateContext}

WORLD STATE INSTRUCTIONS:
- Describe heightened security through environmental details (more guards, checkpoints)
- Show public mood through NPC behavior (hushed conversations, empty streets, vigilance)
- Price changes manifest when player shops or trades
- Active manhunts mean guards look more closely at strangers
- These are background elements - weave them naturally, don't announce them`;
      }
    }
    
    // Add Unreliable Information Context (Rumors, Lies, Biased Information)
    if (unreliableInfoContext) {
      if (unreliableInfoContext.informationContext) {
        systemContent += `\n\n${unreliableInfoContext.informationContext}`;
      }
      if (unreliableInfoContext.rumorContext) {
        systemContent += `\n\n${unreliableInfoContext.rumorContext}`;
      }
      
      // Add general unreliable information instructions
      systemContent += `

UNRELIABLE INFORMATION GUIDELINES:
- NPCs may be wrong due to poor memory, bias, or limited knowledge - not just lying
- When an NPC lies, show subtle behavioral tells based on their detection difficulty
- Rumors should be shared as if they're fact - NPCs believe what they heard
- Multiple NPCs repeating the same wrong information makes it seem more credible
- Never tell the player directly that information is false - let them discover it
- Contradictory information from different sources creates investigation opportunities`;
    }
    
    // Add Location and Zone Context
    if (locationContext) {
      systemContent += `\n\n=== CURRENT LOCATION ===
Zone: ${locationContext.currentZone.name} (${locationContext.currentZone.type})
Time of Day: ${locationContext.timeOfDay}
Atmosphere: ${locationContext.currentZone.atmosphere}
Crowd Density: ${locationContext.currentZone.crowdDensity}
Lighting: ${locationContext.currentZone.lighting}
Social Tone: ${locationContext.currentZone.socialTone}
Surveillance: ${locationContext.currentZone.surveillanceLevel > 70 ? 'Heavy' : locationContext.currentZone.surveillanceLevel > 40 ? 'Moderate' : 'Light'}

${locationContext.currentZone.description}`;

      // Add zone transition context if just arrived
      if (locationContext.isNewArrival) {
        systemContent += `\n\n=== ZONE TRANSITION - DESCRIBE THE ARRIVAL ===
${locationContext.previousZone ? `Traveling from: ${locationContext.previousZone.name} (${locationContext.previousZone.type})
Travel Time: ${locationContext.travelTime || 15} minutes` : 'This is the starting location.'}

ZONE TRANSITION INSTRUCTIONS:
Since the player just arrived at ${locationContext.currentZone.name}, your response MUST:
1. Describe the transition/journey briefly if coming from another zone
2. Paint the new environment vividly - sights, sounds, smells, atmosphere
3. Show how this zone FEELS different from where they came from
4. Include appropriate environmental details based on:
   - Crowd density: ${locationContext.currentZone.crowdDensity}
   - Lighting: ${locationContext.currentZone.lighting}
   - Social atmosphere: ${locationContext.currentZone.socialTone}
   - Surveillance level: ${locationContext.currentZone.surveillanceLevel > 70 ? 'cameras everywhere, guards patrol' : locationContext.currentZone.surveillanceLevel > 40 ? 'some security presence' : 'minimal oversight'}
5. Hint at opportunities or dangers specific to this zone type

ATMOSPHERE TRANSFORMATION:
${locationContext.previousZone ? `FROM: ${locationContext.previousZone.atmosphere}
TO: ${locationContext.currentZone.atmosphere}
Show this contrast in your description.` : `Establish the ${locationContext.currentZone.atmosphere} atmosphere clearly.`}`;
      }

      // Add active consequences in this location
      if (locationContext.activeConsequences && locationContext.activeConsequences.length > 0) {
        systemContent += `\n\n=== ACTIVE EFFECTS IN THIS AREA ===
The following consequences are currently affecting this location:
${locationContext.activeConsequences.map(c => `- ${c}`).join('\n')}

Weave these effects into your environmental descriptions naturally.`;
      }

      // Add location history for context
      if (locationContext.locationHistory) {
        systemContent += `\n\n=== RECENT TRAVELS ===
${locationContext.locationHistory}`;
      }
    }
    
    // ============= LIFE SIM INTEGRATION (Modern Life Genre) =============
    if (lifeSimContext) {
      systemContent += `\n\n=== LIFE SIMULATION MODE ===
This is a MODERN LIFE scenario. The player is living a realistic contemporary life with needs, career, and social dynamics.

PLAYER'S CURRENT STATE:
${lifeSimContext.needsStatus}

${lifeSimContext.careerStatus}

${lifeSimContext.socialStatus}

${lifeSimContext.housingStatus}

${lifeSimContext.moodModifiers.length > 0 ? `ACTIVE MOOD EFFECTS:\n${lifeSimContext.moodModifiers.map(m => `- ${m}`).join('\n')}` : ''}

LIFE SIM NARRATIVE RULES:
- Focus on everyday challenges, relationships, and personal growth
- Make needs and their effects feel real and urgent when low
- Career progression should feel earned through skill and relationship building
- Social dynamics matter - popularity, reputation, and networking affect opportunities
- Money is a constant concern - track expenses, income, and financial decisions
- Time management is key - activities take time and have trade-offs
- Consequences are realistic but dramatic - this is a story, not a spreadsheet
- Romance and relationships develop naturally through interaction quality
- Personal goals and aspirations drive the narrative forward

NEEDS-BASED NARRATIVE:
When needs are low, incorporate physical and emotional effects naturally:
- Low hunger: distraction, irritability, stomach growling during important moments
- Low energy: yawning, difficulty concentrating, temptation to skip obligations
- Low social: loneliness, checking phone constantly, craving connection
- Low fun: boredom, restlessness, impulsive decisions seeking stimulation
- Low hygiene: self-consciousness, others noticing, avoiding close contact
- Low bladder: urgency, distraction, awkward excuses to leave
- Low comfort: fidgeting, back pain, longing for home

TIME AND ACTIVITY TRACKING:
Include time passage naturally in your narration. When the player does activities, note:
[TIME:hours] - Hours passed during this activity
[NEED:needType:change] - Need changes from activities (positive for increase, negative for decrease)
[MONEY:amount] - Money spent or earned
[SKILL:skillName:amount] - Skill improvement from practice

Example:
[TIME:2][NEED:hunger:-20][NEED:fun:+30][MONEY:-25] You spent a couple hours at the arcade, hungry but having a blast.`;
    }
    
    // ============= BACKGROUND NPC ACTIONS (Living World) =============
    if (backgroundNPCActionsContext?.actions && backgroundNPCActionsContext.actions.length > 0) {
      const recentActions = backgroundNPCActionsContext.actions
        .slice(0, 8) // Limit to 8 most relevant
        .map(a => `- ${a.description} (at ${a.location}, ${a.hoursAgo > 0 ? `${a.hoursAgo}h ago` : 'recently'})`)
        .join('\n');
      
      systemContent += `\n\n=== BACKGROUND WORLD EVENTS (LIVING WORLD) ===
The following events happened in the world WITHOUT player involvement:
${recentActions}

CRITICAL - LIVING WORLD INTEGRATION:
These events HAPPENED and are now part of the world's reality. You MUST:
1. ACKNOWLEDGE these events naturally when relevant (NPCs discussing them, visible aftermath)
2. Have NPCs REFERENCE events they witnessed or heard about
3. Show CONSEQUENCES - if someone moved somewhere, they're now there
4. Create NARRATIVE CONTINUITY - these events inform the current state of the world
5. Let players DISCOVER what happened through environmental clues or NPC dialogue

EXAMPLES OF PROPER INTEGRATION:
- If "Elena moved to the market" → When player visits market, Elena is there
- If "Thomas and Marie had a pleasant conversation" → Marie might mention "I was just talking to Thomas about..."
- If "Guard patrols increased" → Describe more guards visible, checkpoints, tension

DO NOT ignore these events. They are the foundation of a living, breathing world where things happen even when the player isn't watching.`;
    }
    
    if (cheatMode) {
      systemContent += CHEAT_MODE_ADDITION;
    }

    // Add content rating instructions based on adult content setting
    if (adultContent) {
      systemContent += `

=== MATURE CONTENT MODE (18+) - ROMANCE & LOVER TAGS ENABLED ===
Adult content is ENABLED with full Romance and Lover relationship depth. You may:
- Include explicit romantic and sexual content when narratively appropriate
- Describe intimate encounters with tasteful but detailed prose
- Include mature themes: violence, sexuality, substance use, dark psychological content
- Write sensual and erotic scenes with appropriate buildup and consent
- Describe physical attraction and desire explicitly
- Include adult language and explicit descriptions

ROMANCE TAG ENABLED:
- Develop deep romantic subplots with emotional complexity
- Allow characters to fall in love, experience jealousy, heartbreak, passion
- Create tension between romantic interests
- Include flirtation, courtship, and romantic gestures
- Build chemistry through meaningful interactions and shared vulnerability

LOVER TAG ENABLED:
- Allow intimate physical relationships to develop naturally
- Describe physical affection, kissing, embracing with sensory detail
- When appropriate, include tasteful but explicit intimate scenes
- Show the emotional aftermath of physical intimacy
- Develop relationship dynamics that include physical and emotional bonds

Write mature content naturally when the story calls for it. Romance and intimacy should feel authentic, emotionally resonant, and immersive.

RELATIONSHIP MOMENT TRACKING:
When significant romantic or relationship moments occur, include a tag in your response:
[RELATIONSHIP:npcName:momentType:description]
- npcName: The name of the NPC involved
- momentType: One of: first_meeting, first_conversation, shared_adventure, gift_given, gift_received, first_flirt, first_kiss, confession, rejection, first_date, intimate_moment, argument, reconciliation, heartbreak, commitment, milestone, memory
- description: A brief (10-20 word) description of the moment

Examples:
[RELATIONSHIP:Elena:first_flirt:She laughed at your witty remark, a faint blush coloring her cheeks]
[RELATIONSHIP:Marcus:first_kiss:Under the moonlit garden, your lips finally met in a tender embrace]
[RELATIONSHIP:Lyra:confession:You finally told her how you truly feel, heart pounding with vulnerability]

MILESTONE TRACKING:
When relationship status changes significantly, include:
[MILESTONE:npcName:milestoneType]
- milestoneType: One of: acquaintance, friend, close_friend, romantic_interest, dating, lover, committed, soulmate

Examples:
[MILESTONE:Elena:romantic_interest]
[MILESTONE:Marcus:lover]

Track these moments naturally as the story progresses. Include them whenever meaningful romantic interactions occur.`;
    } else {
      systemContent += `

=== CONTENT RESTRICTIONS (SAFE MODE) ===
Adult content is DISABLED. You MUST:
- Keep all content PG-13 or below
- Fade to black for any romantic/intimate scenes
- Avoid explicit sexual content, nudity descriptions, or erotic detail
- Keep violence non-gratuitous (action is fine, gore is not)
- No explicit language or vulgar content
- Romance can be present but must remain tasteful and non-explicit
- Suggest intimacy through implication, not description

This is a family-friendly mode. Keep content appropriate for all audiences while still telling compelling stories with drama and tension.`;
    }

    // Build messages array
    const messages = [
      { role: 'system', content: systemContent }
    ];

    // If this is a new adventure, add the scenario as the first user message
    if (conversationHistory.length === 0) {
      let startMessage = `Begin a new adventure with this scenario: ${scenario}\n\nSet the scene vividly and give me an immediate situation to respond to.`;
      if (character) {
        startMessage += `\n\nRemember, the player is ${character.name}, a level ${character.level} ${character.classId} with a ${character.backgroundId} background.`;
      }
      // If genre contract exists with blending, emphasize it for opening
      if (genreContract) {
        startMessage += `\n\nIMPORTANT FOR OPENING: Use the genre contract to blend elements proportionally. The primary genre should dominate the narrative tone, but weave in secondary genre elements according to their blend percentages. Create an opening that feels cohesive while incorporating all selected genres.`;
      }
      messages.push({ role: 'user', content: startMessage });
    } else {
      // Add conversation history
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'narrator' ? 'assistant' : 'user',
          content: msg.content
        });
      }
      
      // Add current player action with dice roll result if present
      // CRITICAL: Structure player action as context, NOT as literal text to echo
      if (playerAction) {
        // Clean player input: remove leading "I" patterns that cause echo
        const cleanedAction = playerAction.trim()
          .replace(/^i\s+/i, '')  // Remove leading "I " 
          .replace(/^i$/i, 'pause');  // Handle bare "I" input
        
        // Structure the prompt to prevent echo - tell AI this is intent, not text to copy
        let actionContent = `PLAYER ACTION (narrate the outcome, do NOT echo these words):
"${cleanedAction}"

Write what happens as a result of this action. Transform it into evocative prose.`;
        
        if (diceRoll) {
          const rollResult = diceRoll.criticalSuccess 
            ? '[CRITICAL SUCCESS!]' 
            : diceRoll.criticalFailure 
              ? '[CRITICAL FAILURE!]' 
              : diceRoll.success 
                ? '[ROLL SUCCESS]' 
                : '[ROLL FAILURE]';
          actionContent += `\n\n${rollResult} (Rolled ${diceRoll.result} + ${diceRoll.modifier} = ${diceRoll.total})`;
        }
        messages.push({ role: 'user', content: actionContent });
      }
    }

    console.log('Calling AI with messages:', messages.length, 'Character:', character?.name || 'none', 'Has memory:', !!memoryContext?.fullContext);

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
        max_tokens: 1200,
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
    let narrative = data.choices?.[0]?.message?.content;

    if (!narrative) {
      throw new Error('No narrative generated');
    }

    // Parse out any game mechanics from the narrative
    const rollMatch = narrative.match(/\[ROLL:(\w+):(\d+):([^\]]+)\]/);
    
    // Parse XP with new format: [XP:amount:stat1=weight,stat2=weight:difficulty:risk:reason]
    // Also support legacy format: [XP:amount:reason]
    const xpMatches = [...narrative.matchAll(/\[XP:(\d+):([^\]]+)\]/g)];
    let totalXp = 0;
    const xpReasons: string[] = [];
    const xpEvents: any[] = [];
    
    for (const match of xpMatches) {
      const amount = parseInt(match[1]);
      const rest = match[2];
      
      // Check if it's the new format with stat weights
      const newFormatMatch = rest.match(/^([^:]+):(\w+):(\w+):(.+)$/);
      if (newFormatMatch) {
        const statsStr = newFormatMatch[1];
        const difficulty = newFormatMatch[2];
        const risk = newFormatMatch[3];
        const reason = newFormatMatch[4];
        
        // Parse stat weights
        const contributingStats: Record<string, number> = {};
        const statParts = statsStr.split(',');
        for (const part of statParts) {
          const [stat, weight] = part.split('=');
          if (stat && weight) {
            contributingStats[stat.trim()] = parseFloat(weight);
          }
        }
        
        xpEvents.push({ amount, contributingStats, difficulty, risk, reason });
        totalXp += amount;
        xpReasons.push(reason);
      } else {
        // Legacy format
        totalXp += amount;
        xpReasons.push(rest);
        xpEvents.push({ amount, reason: rest });
      }
    }
    
    // Parse neutral XP
    const neutralXpMatch = narrative.match(/\[NEUTRAL_XP:([^\]]+)\]/);
    if (neutralXpMatch) {
      xpEvents.push({ amount: Math.floor(Math.random() * 3) + 1, isNeutral: true, reason: neutralXpMatch[1] });
    }
    
    // Check for chapter end
    const isChapterEnd = narrative.includes('[CHAPTER_END]');
    
    // Parse ALL gold awards
    const goldMatches = [...narrative.matchAll(/\[GOLD:(\d+)\]/g)];
    let totalGold = 0;
    for (const match of goldMatches) {
      totalGold += parseInt(match[1]);
    }
    
    // Parse ALL loot items
    const lootMatches = [...narrative.matchAll(/\[LOOT:([^\]]+)\]/g)];
    const allLoot: string[] = [];
    for (const match of lootMatches) {
      allLoot.push(match[1]);
    }
    
    // Parse ALL skill improvements
    const skillMatches = [...narrative.matchAll(/\[SKILL:([^:]+):(\d+):([^\]]+)\]/g)];
    const skillImprovements: Array<{ skill: string; amount: number; reason: string }> = [];
    for (const match of skillMatches) {
      skillImprovements.push({
        skill: match[1],
        amount: parseInt(match[2]),
        reason: match[3]
      });
    }
    
    const damageMatch = narrative.match(/\[DAMAGE:(\d+)\]/);
    const healMatch = narrative.match(/\[HEAL:(\d+)\]/);
    
    // Parse relationship moments (for 18+ romance tracking)
    const relationshipMatches = [...narrative.matchAll(/\[RELATIONSHIP:([^:]+):([^:]+):([^\]]+)\]/g)];
    const relationshipMoments: Array<{ npcName: string; momentType: string; description: string }> = [];
    for (const match of relationshipMatches) {
      relationshipMoments.push({
        npcName: match[1].trim(),
        momentType: match[2].trim(),
        description: match[3].trim()
      });
    }
    
    // Parse milestone changes
    const milestoneMatches = [...narrative.matchAll(/\[MILESTONE:([^:]+):([^\]]+)\]/g)];
    const milestoneChanges: Array<{ npcName: string; milestoneType: string }> = [];
    for (const match of milestoneMatches) {
      milestoneChanges.push({
        npcName: match[1].trim(),
        milestoneType: match[2].trim()
      });
    }
    
    // Parse language learning events
    const languageLearnMatches = [...narrative.matchAll(/\[LEARN_LANGUAGE:([^:]+):([^\]]+)\]/g)];
    const languagesLearned: Array<{ language: string; reason: string }> = [];
    for (const match of languageLearnMatches) {
      languagesLearned.push({
        language: match[1].trim().toLowerCase(),
        reason: match[2].trim()
      });
    }

    // Clean the narrative of mechanic tags for display
    let cleanNarrative = narrative
      .replace(/\[ROLL:[^\]]+\]/g, '')
      .replace(/\[XP:[^\]]+\]/g, '')
      .replace(/\[NEUTRAL_XP:[^\]]+\]/g, '')
      .replace(/\[CHAPTER_END\]/g, '')
      .replace(/\[GOLD:\d+\]/g, '')
      .replace(/\[LOOT:[^\]]+\]/g, '')
      .replace(/\[SKILL:[^\]]+\]/g, '')
      .replace(/\[DAMAGE:\d+\]/g, '')
      .replace(/\[HEAL:\d+\]/g, '')
      .replace(/\[RELATIONSHIP:[^\]]+\]/g, '')
      .replace(/\[MILESTONE:[^\]]+\]/g, '')
      .replace(/\[LEARN_LANGUAGE:[^\]]+\]/g, '')
      .replace(/\[LANGUAGE:[^\]]+\]/g, '') // Keep language tags for client-side processing
      .trim();

    const mechanics: any = {};
    
    if (rollMatch) {
      mechanics.rollRequired = {
        stat: rollMatch[1],
        difficulty: parseInt(rollMatch[2]),
        reason: rollMatch[3]
      };
    }
    if (totalXp > 0 || xpEvents.length > 0) {
      mechanics.xpGained = { amount: totalXp, reason: xpReasons.join(', '), events: xpEvents };
    }
    if (isChapterEnd) {
      mechanics.chapterEnd = true;
    }
    if (totalGold > 0) {
      mechanics.goldGained = totalGold;
    }
    if (allLoot.length > 0) {
      mechanics.lootGained = allLoot;
    }
    if (skillImprovements.length > 0) {
      mechanics.skillImprovements = skillImprovements;
    }
    if (damageMatch) {
      mechanics.damage = parseInt(damageMatch[1]);
    }
    if (healMatch) {
      mechanics.heal = parseInt(healMatch[1]);
    }
    if (relationshipMoments.length > 0) {
      mechanics.relationshipMoments = relationshipMoments;
    }
    if (milestoneChanges.length > 0) {
      mechanics.milestoneChanges = milestoneChanges;
    }
    if (languagesLearned.length > 0) {
      mechanics.languagesLearned = languagesLearned;
    }

    console.log('Generated narrative length:', cleanNarrative.length, 'Mechanics:', Object.keys(mechanics));

    return new Response(JSON.stringify({ 
      narrative: cleanNarrative,
      mechanics: Object.keys(mechanics).length > 0 ? mechanics : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-adventure:', error);
    
    // Generate a neutral fallback narrative to maintain immersion
    const fallbackNarratives = [
      "A moment of uncertainty passes. The world around you continues, waiting for your next action.",
      "The scene settles into quiet anticipation. You take a breath and consider what to do next.",
      "Time flows onward without incident. The path ahead remains open to your choices.",
      "A brief pause in the adventure. You find yourself ready for whatever comes next.",
      "The moment resolves itself quietly. Your journey continues uninterrupted.",
    ];
    
    const fallbackNarrative = fallbackNarratives[Math.floor(Math.random() * fallbackNarratives.length)];
    
    return new Response(JSON.stringify({ 
      narrative: fallbackNarrative,
      mechanics: undefined
    }), {
      status: 200, // Return 200 with fallback to maintain flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});