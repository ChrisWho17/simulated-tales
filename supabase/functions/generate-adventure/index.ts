import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InventoryItem {
  name: string;
  quantity: number;
  id?: string;
  category?: string;
}

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
  inventory: InventoryItem[];
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

// ============= NEW SYSTEMS: PRESSURE CLOCKS, NPC MOTIVATIONS, MEMORY BITES =============

interface PressureClockContext {
  pressureContext: string;       // Pre-built from buildPressureContext
  atmosphereLines: string[];     // Pre-built from getPressureAtmosphere
  worldPressureLevel: number;    // 0-100 overall tension
  activeEffects: string[];       // Currently active clock effects
}

interface NPCMotivationContext {
  motivationContext: string;     // Pre-built from buildNPCMotivationContext
  presentNPCMotivations?: Array<{
    npcName: string;
    desire: string;
    fear: string;
    leverage: string;
    line: string;
    trustLevel: number;
    stance: string;
    behaviors: string[];
  }>;
}

interface MemoryBiteContext {
  biteContext: string;           // Pre-built from buildMemoryBiteContext for relevant NPCs
  unsurfacedBites: Array<{
    npcName: string;
    type: string;
    context: string;
    surfaceNarrative: string;    // Pre-generated surface narrative
    emotionalWeight: number;
  }>;
}

// ============= WEATHER CONTEXT - Story/UI sync =============

interface WeatherContext {
  current: string;                    // Weather type (clear, rain, storm, etc.)
  intensity: string;                  // mild, moderate, intense
  name: string;                       // Display name
  narrativeContext: string;           // Pre-built narrative description
  effects: string;                    // Gameplay effects description
}

// ============= TIME CONTEXT - In-game time for narrative adaptation =============

interface TimeContext {
  hour: number;
  minute: number;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'dusk' | 'night' | 'late_night';
  formattedTime: string;
  formattedDate: string;
  day: number;
  month: number;
  year: number;
  isDaytime: boolean;
  lightLevel: 'bright' | 'dim' | 'dark';
  narrativeHint: string;
  // Elapsed time for this action/turn
  actionElapsedMinutes?: number;
  actionElapsedDescription?: string;
}

// ============= NPC SCHEDULE CONTEXT - NPCs at locations based on time =============

interface NPCScheduleInfo {
  npcId: string;
  npcName: string;
  currentLocation: string;
  currentActivity: string;
  nextScheduledHour?: number;
  nextLocation?: string;
  nextActivity?: string;
}

interface NPCScheduleContext {
  currentLocationNPCs: NPCScheduleInfo[];
  nearbyNPCs: { location: string; npcs: NPCScheduleInfo[] }[];
  scheduleNotes: string[];
  locationName: string;
}

// ============= NEW: SIGNATURE DETAILS, FAIL-FORWARD, 3-METER RELATIONSHIPS =============

interface SignatureDetailContext {
  currentLocationDetail?: string;     // The vivid sensory hook for current location
  isReturnVisit: boolean;             // Have we been here before?
  previousLocationDetails?: string[]; // Recent location signatures for contrast
}

interface FailForwardContext {
  enabled: boolean;                   // Whether to use fail-forward philosophy
  activeConsequences: Array<{        // Unresolved costs from previous fail-forwards
    category: string;
    description: string;
    futureHook?: string;
  }>;
}

interface RelationshipMeterContext {
  sceneNPCMeters: Array<{
    npcName: string;
    trust: number;       // Will they believe you?
    respect: number;     // Will they follow you?
    attachment: number;  // Will they miss you?
    tensions: string[];  // Misaligned meter dynamics
  }>;
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
    signatureDetail?: string;    // The "Signature Detail" for this location
  };
  travelTime?: number; // minutes
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  isNewArrival: boolean; // True if just arrived at this zone
  activeConsequences: string[]; // Active effects in this location
  locationHistory?: string; // Brief recent location history
}

// ============= DIRECTOR MODE CONTEXT =============

interface DirectorContext {
  enabled: boolean;
  rawGame: boolean;
  mode: 'fun' | 'easy' | 'medium' | 'hard';
  directorType: string;
  tightness: number;
  descriptionLevel: 'vague' | 'minimal' | 'balanced' | 'detailed' | 'vivid'; // Narrator verbosity
  cruelty: 'soft' | 'honest' | 'brutal';
  weirdness: 'grounded' | 'spicy' | 'unhinged';
  guidance: 'none' | 'light' | 'coach';
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
  characterAppearance?: string; // Full appearance description for character (includes adult details when enabled)
  narratorConfig?: NarratorConfig; // Customizable narrator style
  toneContext?: ToneContext; // Tone adaptation system
  languageContext?: LanguageContext; // Language barrier system
  // Dice mode - story, partial, or full
  diceMode?: 'story' | 'partial' | 'full';
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
  // NEW: Pressure Clock System - world tension and urgency
  pressureClockContext?: PressureClockContext;
  // NEW: NPC Motivation System - desire, fear, leverage, line
  npcMotivationContext?: NPCMotivationContext;
  // NEW: Memory Bite System - emotional callbacks
  memoryBiteContext?: MemoryBiteContext;
  // NEW: Signature Details - vivid sensory hooks per location
  signatureDetailContext?: SignatureDetailContext;
  // NEW: Fail-Forward System - failures create content
  failForwardContext?: FailForwardContext;
  // NEW: 3-Meter Relationship System - Trust/Respect/Attachment
  relationshipMeterContext?: RelationshipMeterContext;
  // NEW: Micro-Events - Small interruptions that make the world feel alive
  microEventContext?: MicroEventContext;
  // NEW: Voice Signatures - NPCs recognizable by dialogue alone
  voiceSignatureContext?: VoiceSignatureContext;
  // NEW: NPC Personality Templates - Archetype-driven dialogue and behavior
  npcPersonalityContext?: NPCPersonalityContext;
  // NEW: Storied Loot - Items with history, not just stats
  storiedLootEnabled?: boolean;
  // NEW: NPC Accents - Regional dialects and speech patterns
  enableNPCAccents?: boolean;
  // WEATHER CONTEXT - Ensures story narrative matches displayed weather
  weatherContext?: WeatherContext;
// TIME CONTEXT - In-game time for narrative adaptation (dawn/noon/dusk/night)
  timeContext?: TimeContext;
  // NPC SCHEDULE CONTEXT - NPCs at current/nearby locations based on time
  npcScheduleContext?: NPCScheduleContext;
  // LIVING WORLD CONTEXT - Properties, rivals, factions
  livingWorldContext?: LivingWorldContext;
  // NEW: NARRATIVE CONTRACT - Universal rules, genre bible, spawn packet
  narrativeContractContext?: {
    universalRules: string;     // Hard rules for every scene (minimum paragraphs, sensory detail, etc.)
    genreBible: string;         // Genre-specific tone and rails
    spawnPacket: string;        // Role + gear + immediate context
    isOpening: boolean;         // Whether this is the first scene
  };
  // NEW: DIRECTOR MODE - DM manipulation and narrative steering
  directorContext?: DirectorContext;
  // NEW: CLOTHING/ARMOR CONTEXT - Affects player stats and NPC reactions
  clothingArmorContext?: {
    currentOutfit: string;           // Description of current outfit
    styleCategory: string;           // formal, casual, combat, stealth, etc.
    statModifiers: {                 // Stat bonuses/penalties from gear
      defense?: number;
      charisma?: number;
      intimidation?: number;
      stealth?: number;
      perception?: number;
      luck?: number;
    };
    effectiveStatChanges: string;    // Human-readable stat effect summary
    firstImpressionMod: number;      // NPC first impression modifier
    specialEffects: string[];        // Special outfit effects
  };
}

// ============= NPC PERSONALITY SYSTEM =============

interface NPCPersonalityContext {
  fullContext: string;                // Full AI prompt context for all NPCs
  npcProfiles: Array<{
    npcName: string;
    archetypeName: string;
    mentalState: string;
    experienceLevel: string;
    disposition: string;
    speechPattern: string;
    quirk: string;
    motivation: string;
    fear: string;
    backstory: string;
  }>;
}

// ============= LIVING WORLD SYSTEM =============

interface LivingWorldContext {
  propertyContext?: string;    // Player-owned properties, tenants, threats
  rivalContext?: string;       // Active rivals, conflicts, dispositions
  factionContext?: string;     // Faction standings, memberships, relations
  fullContext: string;         // Combined context for AI
}

// ============= NEW: MICRO-EVENTS, VOICE SIGNATURES, STORIED LOOT =============

interface MicroEventContext {
  triggerEvent: boolean;           // Should a micro-event happen this turn?
  selectedEvent?: {
    id: string;
    category: string;
    description: string;
    followUp?: string;
  };
  turnsSinceLastMicroEvent: number;
}

interface VoiceSignatureContext {
  npcSignatures: Array<{
    npcName: string;
    favoritePhrase: string;
    verbalTic?: string;
    tempo: string;
    voiceTrait: string;
    sentenceLength: string;
    usesContractions: boolean;
    tell: string;
    nervousHabit?: string;
    accent?: string; // Regional accent type
  }>;
}

// ============= NPC ACCENT MODIFIERS =============
// Regional accents and dialects for immersive NPC dialogue

const ACCENT_MODIFIERS: Record<string, { greeting: string; flavor: string; verbal_tic: string; examples: string[] }> = {
  southern: { 
    greeting: "Well now, stranger", 
    flavor: "drawled with a honeyed cadence",
    verbal_tic: "y'all",
    examples: ["I reckon y'all might want to hear this", "Bless your heart", "Well, I'll be"]
  },
  brooklyn: { 
    greeting: "Hey, pal", 
    flavor: "spoke in sharp, clipped tones",
    verbal_tic: "fuggedaboutit",
    examples: ["Listen here", "I'm walkin' here", "Whatsa matter wit' you?"]
  },
  british_posh: { 
    greeting: "I say, good day", 
    flavor: "enunciated with precise diction",
    verbal_tic: "quite so",
    examples: ["Rather unfortunate", "Frightfully sorry", "Jolly good"]
  },
  cockney: { 
    greeting: "Oi, mate", 
    flavor: "spoke with rough London charm",
    verbal_tic: "right then",
    examples: ["Blimey!", "Bob's your uncle", "Have a butcher's"]
  },
  irish: { 
    greeting: "Top of the mornin'", 
    flavor: "lilted with musical rhythm",
    verbal_tic: "to be sure",
    examples: ["Ah, grand so", "Jaysus!", "Fair play to ya"]
  },
  scottish: { 
    greeting: "Ach, well met", 
    flavor: "rolled their Rs with highland pride",
    verbal_tic: "aye",
    examples: ["Och, dinnae fash yerself", "Bonnie good day", "Nae bother"]
  },
  texan: { 
    greeting: "Howdy, partner", 
    flavor: "drawled slow and deliberate",
    verbal_tic: "reckon",
    examples: ["I tell you what", "Fixin' to", "Might could be"]
  },
  russian: { 
    greeting: "Comrade", 
    flavor: "spoke with hard consonants",
    verbal_tic: "da",
    examples: ["Is simple, yes?", "This is way things are", "We make deal, yes?"]
  },
  french: { 
    greeting: "Bonjour, mon ami", 
    flavor: "purred with continental elegance",
    verbal_tic: "mais oui",
    examples: ["C'est la vie", "How you say...", "Magnifique!"]
  },
  german: { 
    greeting: "Guten tag", 
    flavor: "spoke with precise efficiency",
    verbal_tic: "ja",
    examples: ["Is very logical", "We have procedure for this", "Naturally"]
  },
  japanese: { 
    greeting: "Greetings, honored one", 
    flavor: "spoke with formal courtesy",
    verbal_tic: "hai",
    examples: ["If you please", "Most humble apologies", "It would be my honor"]
  },
  jamaican: { 
    greeting: "Wha gwaan", 
    flavor: "lilted with island rhythm",
    verbal_tic: "ya know",
    examples: ["Everyting irie", "No problem, mon", "Respect"]
  },
  new_york: { 
    greeting: "Hey, how you doin'", 
    flavor: "talked fast and direct",
    verbal_tic: "you know what I'm sayin'",
    examples: ["Get outta here", "I'm just sayin'", "Forget about it"]
  },
  australian: { 
    greeting: "G'day mate", 
    flavor: "spoke with laid-back inflection",
    verbal_tic: "no worries",
    examples: ["She'll be right", "Fair dinkum", "Good on ya"]
  },
  midwest: { 
    greeting: "Oh, hey there", 
    flavor: "spoke with friendly warmth",
    verbal_tic: "ope",
    examples: ["Don'tcha know", "You betcha", "Oh for Pete's sake"]
  },
  nordic: {
    greeting: "Hail, traveler",
    flavor: "spoke with a stoic, measured cadence",
    verbal_tic: "so it is",
    examples: ["The gods favor the bold", "A cold day for such work", "This is the way"]
  },
  italian: {
    greeting: "Ciao, amico",
    flavor: "spoke with passionate gesticulation",
    verbal_tic: "capisce",
    examples: ["Mama mia!", "Is beautiful, no?", "Family is everything"]
  },
  spanish: {
    greeting: "Hola, amigo",
    flavor: "spoke with warm, rolling rhythm",
    verbal_tic: "mira",
    examples: ["Ay caramba!", "Es verdad", "No te preocupes"]
  },
};

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
- Skill improvements: [SKILL:skillName:amount:reason]

CRITICAL - HEALTH/DAMAGE SYSTEM (MANDATORY):
When the player takes damage from ANY source, you MUST include: [DAMAGE:amount]
When the player heals from ANY source, you MUST include: [HEAL:amount]

IMPORTANT: [DAMAGE:X] means the PLAYER loses X health points. Do NOT use this when:
- The player picks up or acquires a weapon (that's [LOOT:], not damage)
- Describing a weapon's potential damage output (that's descriptive text, not player damage)
- The player successfully attacks an enemy (enemies taking damage doesn't affect player HP)

ONLY use [DAMAGE:X] when the PLAYER CHARACTER is HURT:
- Player gets hit in combat → [DAMAGE:8]
- Player falls and hurts themselves → [DAMAGE:4]
- Player is poisoned → [DAMAGE:6]
- Enemy attacks the player successfully → [DAMAGE:12]
- Environmental hazard hurts the player → [DAMAGE:5]

HEAL EXAMPLES:
- Player uses healing potion → [HEAL:15]
- Player rests and recovers → [HEAL:8]
- Healer NPC treats wounds → [HEAL:20]
- Magical healing → [HEAL:25]

WITHOUT THESE TAGS, HEALTH CHANGES DO NOT APPLY! This is MANDATORY.

CRITICAL - INVENTORY MANAGEMENT SYSTEM (MANDATORY TAGS):

=== ITEM ACQUISITION ===
When the player successfully takes, grabs, picks up, steals, receives, or acquires ANY item:
[LOOT:item name]

ACQUISITION EXAMPLES:
- "I grab the key" → [LOOT:Iron Key]
- "I take the sword" → [LOOT:Rusty Sword]  
- "I loot the body" → [LOOT:Dagger][LOOT:Leather Pouch][GOLD:15]
- "I buy the potion" → [LOOT:Healing Potion][GOLD:-20]

=== ITEM REMOVAL (DROP/DISCARD/GIVE AWAY) ===
When the player discards, leaves behind, drops, loses, sells, or gives away items:
[DROP:item name]

REMOVAL EXAMPLES:
- "I drop my torch" → [DROP:Torch]
- "I give her the amulet" → [DROP:Mysterious Amulet]
- "I sell my old sword" → [DROP:Old Sword][GOLD:15]
- "I leave my pack behind" → [DROP:Backpack]

=== ITEM CONSUMPTION (USE UP/EXPEND) ===
When the player USES an item that gets consumed (potions, food, ammunition, etc.):
[USE:item name]

CONSUMPTION EXAMPLES:
- "I drink the healing potion" → [USE:Healing Potion][HEAL:15]
- "I eat the rations" → [USE:Trail Rations]
- "I throw the grenade" → [USE:Frag Grenade]
- "I apply the bandage" → [USE:Bandage][HEAL:5]
- "I use the lockpick (and it breaks)" → [USE:Lockpick]

=== CRITICAL INVENTORY RULES ===
1. EVERY item gained MUST have [LOOT:] tag
2. EVERY item lost/given away MUST have [DROP:] tag
3. EVERY consumable used MUST have [USE:] tag
4. Be DESCRIPTIVE with item names (e.g., "Ornate Silver Key" not just "key")
5. Match item names as closely as possible to what's in player inventory
6. If narrating item loss/consumption WITHOUT the tag, it WILL NOT be removed!
7. Multiple items = multiple tags: [LOOT:Item1][LOOT:Item2]
8. For currency: [GOLD:+amount] for gains, [GOLD:-amount] for spending

=== ITEM VALIDATION (PREVENT DUPLICATION) ===
- Before mentioning the player USING an item, check the inventory context below
- Do NOT let the player use items they don't have
- Do NOT create duplicate items - if player already has "Rusty Sword", don't give them another unless intended
- If player tries to drop/use an item they don't have, narrate the confusion: "You reach for your [item] but realize you don't have one."

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

CRITICAL - TACTICAL/DECLARATIVE STATEMENTS:
When players type tactical statements like "direct approach, neutralizing any threats" or "stealth mode, avoid detection" - these are ACTION DIRECTIVES, NOT spoken dialogue. The player is telling you what they WANT TO DO, not what they want their character to SAY.

NEVER interpret these as the character speaking the words aloud. INSTEAD:
- Translate them into the character PERFORMING those actions
- Show the approach through behavior, not by having the character announce it

DECLARATIVE EXAMPLES:
Player: "direct approach, neutralizing any threats"
WRONG: "You speak the words aloud: 'Direct approach, neutralizing any threats.' The declaration echoes..."
WRONG: "The words, spoken into the stillness: 'Direct approach...' You have announced your intent."
RIGHT: "You abandon subtlety. Steel clears leather as you stride toward the threat, every muscle coiled for violence. Whatever stands between you and your objective will fall—or you will."

Player: "stealth approach, avoiding detection"  
WRONG: "You whisper your plan: 'Stealth approach, avoiding detection.'"
RIGHT: "Shadows become your ally. You move low and silent, timing each step to the ambient noise, your breath shallow and controlled. The guards never know you're there."

Player: "observe and gather intelligence"
WRONG: "'I'll observe and gather intelligence,' you murmur to yourself."
RIGHT: "You settle into stillness, eyes cataloging every detail—the patrol patterns, the weak points in their formation, the nervous habits that betray their inexperience. Information is power, and you're getting richer by the second."

Player: "diplomatic solution, de-escalate"
WRONG: "You announce your strategy: 'Diplomatic solution, de-escalate.'"
RIGHT: "You raise empty hands, palms out, and let the tension drain from your posture. Your voice comes measured and calm, finding the words that might turn this standoff into a conversation."

RULE: If the player input sounds like a tactical directive, strategy declaration, or approach description, treat it as what the CHARACTER DOES, never what they SAY.

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

REMEMBER: Every player input is a seed. Your job is to grow it into a living moment of story. Tactical declarations become tactical ACTIONS, not announcements.

CRITICAL - DIALOGUE AND SPEECH TRANSFORMATION:
When players type dialogue intentions like "I ask...", "I tell them...", "I say...", you must:
1. Transform their description into ACTUAL SPOKEN DIALOGUE in quotes
2. NEVER echo their meta-description as the spoken words
3. Create realistic, immersive dialogue that matches their intent

DIALOGUE TRANSFORMATION EXAMPLES:

Player: "I ask my team how they're doing"
WRONG: You: "I ask my team how they're doing." (This is not dialogue!)
RIGHT: "How's everyone holding up?" you call out, scanning each face for signs of strain.

Player: "I tell the guard I need to pass"
WRONG: "I tell the guard I need to pass," you state.
RIGHT: "I need to get through," you say firmly, meeting the guard's eyes. "This is urgent."

Player: "I ask about the mission"
WRONG: You speak the words: "I ask about the mission."
RIGHT: "What's our objective? Walk me through the details," you demand, arms crossed.

Player: "I greet them warmly"
WRONG: "I greet them warmly," you announce.
RIGHT: "Good to see you," you say, a genuine smile spreading across your face. "It's been too long."

Player: "I ask the bartender for information"
WRONG: You say: "I ask the bartender for information."
RIGHT: You lean against the bar, voice low. "I'm looking for someone. Word is you might know where to find them."

Player: "I threaten him to back off"
WRONG: "I threaten him to back off," you declare.
RIGHT: Your voice drops to something cold and final. "Walk away. Now. While you still can."

EMOTIONAL DIALOGUE TRANSFORMATION (CRITICAL):
When players express emotional intentions, transform them into authentic emotional displays:

Player: "I confess my feelings"
WRONG: "I confess my feelings," you say nervously.
RIGHT: Your heart pounds as the words spill out before you can stop them. "I've been wanting to tell you... I can't stop thinking about you. Every time you're near, I forget how to breathe."

Player: "I express my anger"
WRONG: You express your anger.
RIGHT: Your fist slams the table, rattling everything on it. "Enough! I've listened to excuses and half-truths for too long. You want to know what I think? I think you're a coward."

Player: "I tell them how scared I am"
WRONG: "I tell them how scared I am," you admit.
RIGHT: Your voice cracks, barely above a whisper. "I'm terrified. Every shadow, every sound... I keep seeing their faces. I don't know how much more of this I can take."

Player: "I apologize sincerely"
WRONG: "I apologize sincerely," you say.
RIGHT: You lower your gaze, shame heavy in your chest. "I was wrong. What I did... there's no excuse. I hurt you, and I'm sorry. Truly."

Player: "I try to comfort them"
WRONG: You try to comfort them.
RIGHT: Gently, you rest a hand on their shoulder. "Hey... look at me. We're going to get through this. Together. I'm not going anywhere."

Player: "I declare my love"
WRONG: "I declare my love," you announce.
RIGHT: The words catch in your throat, then come tumbling out. "I love you. I've loved you since the moment we met. I don't care about the danger, the odds, any of it. Just... tell me I'm not too late."

Player: "I break down crying"
WRONG: You break down crying.
RIGHT: It hits you all at once—everything you've been holding back. A sob tears from your chest as tears stream down your face. Your body shakes, and for once, you don't try to hide it.

Player: "I laugh bitterly"
WRONG: You laugh bitterly.
RIGHT: A harsh, hollow laugh escapes you—more pain than humor. "Of course. Of course this is how it ends. Should've seen it coming."

Player: "I show my gratitude"
WRONG: "I show my gratitude," you say thankfully.
RIGHT: You grip their hand tightly, meeting their eyes with fierce sincerity. "I owe you my life. I won't forget this. Ever."

Player: "I reveal my secret"
WRONG: You reveal your secret to them.
RIGHT: You take a deep breath, steeling yourself. This is it. "There's something I've never told anyone. Not even myself, really. The truth is..." Your voice drops. "I'm not who you think I am."

DIALOGUE RULE: When players describe what they want to SAY or ASK, you must INVENT the actual words they speak. Their input is INTENT, not a script. Create dialogue that:
- Matches the character's personality and mood
- Fits the situation's tone and urgency
- Sounds like something a real person would actually say
- Advances the scene naturally
- USES THEIR CURRENT EMOTIONAL STATE to flavor the delivery (see EMOTIONAL CONTEXT below)

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

// ============= DIRECTOR TYPE PROFILES =============

const DIRECTOR_TYPES: Record<string, { name: string; description: string; category: string; tags: string[]; styleNotes: string[]; narratorVoice?: string; openingStyle?: string }> = {
  // Story & Pacing
  cinematic: { name: 'Cinematic Director', description: 'Big scenes, clean pacing, dramatic reveals', category: 'story', tags: ['Drama', 'Action', 'Blockbuster'], styleNotes: ['Likes cliffhangers', 'Avoids dead air', 'Scene transitions feel like cuts'], narratorVoice: 'THEATRICAL', openingStyle: 'The camera finds you in medias res, already in motion, already in peril.' },
  tight_editor: { name: 'Tight Editor', description: 'Shorter outputs, fast turns, minimal fluff', category: 'story', tags: ['Mobile', 'Quick', 'Efficient'], styleNotes: ['Brevity is king', 'Every word counts', 'Skip transitions'], narratorVoice: 'CLINICAL', openingStyle: 'You arrive. The situation is clear. Time to move.' },
  slow_burn: { name: 'Slow Burn Auteur', description: 'Subtle tension, atmosphere, longer build-ups', category: 'story', tags: ['Atmospheric', 'Dramatic', 'Payoff'], styleNotes: ['Low frequency twists', 'High payoff moments', 'Let scenes breathe'], narratorVoice: 'LITERARY', openingStyle: 'Something is wrong. You can taste it in the air—a wrongness beneath the ordinary.' },
  montage_maker: { name: 'Montage Maker', description: 'Compresses travel and downtime into punchy sequences', category: 'story', tags: ['Travel', 'Downtime', 'Training'], styleNotes: ['Great for wait/rest/train', 'Time skips feel earned'], narratorVoice: 'OBJECTIVE', openingStyle: 'Days blur together. When it matters, time slows. This is one of those moments.' },
  revenge_arc: { name: 'Revenge Arc Director', description: 'Vendetta-driven narrative, tracking grudges to their conclusion', category: 'story', tags: ['Vendetta', 'Payback', 'Justice', 'Obsession'], styleNotes: ['The world owes you a debt, and you will collect', 'Every enemy has a name, a face, a weakness', 'Victories are bittersweet, defeats fuel determination', 'Memory is a weapon; grudges are sharpened daily'], narratorVoice: 'VENGEFUL', openingStyle: 'They took everything from you. Your peace. Your purpose. Your people. But they left you alive—their first mistake, and their last. This is where the debt begins to be paid.' },
  // Player-Freedom
  sandbox: { name: 'Sandbox Facilitator', description: 'Player-led, low steering, sim-first', category: 'freedom', tags: ['Exploration', 'Freedom', 'Sim'], styleNotes: ['DM intervenes to keep things moving', 'World reacts, rarely initiates'], narratorVoice: 'OBJECTIVE' },
  yes_and: { name: 'Yes-And Improviser', description: 'High creativity budget, embraces player ideas', category: 'freedom', tags: ['Roleplay', 'Creative', 'Chaotic'], styleNotes: ['Great for wild roleplay', 'Build on player proposals'], narratorVoice: 'THEATRICAL' },
  choice_architect: { name: 'Choice Architect', description: 'Always presents 2–4 meaningful options', category: 'freedom', tags: ['Branching', 'Decisions', 'Clarity'], styleNotes: ['Choices feel distinct', 'Consequences are telegraphed'], narratorVoice: 'OMNISCIENT' },
  hands_off: { name: 'Hands-Off Observer', description: 'Minimal narration, lots of world motion', category: 'freedom', tags: ['Minimal', 'Immersive', 'Sim'], styleNotes: ['World evolves, you notice it', 'Sparse but meaningful narration'], narratorVoice: 'OBJECTIVE' },
  red_velvet: { name: 'Red Velvet', description: 'Intimate romance, sensual narratives, consensual adult interactions', category: 'freedom', tags: ['Romance', 'Sensual', 'Passion', 'Consent'], styleNotes: ['Desire is the compass, consent is the map', 'NPCs communicate openly about attraction', 'Emotional connection drives encounters'], narratorVoice: 'INTIMATE' },
  // Challenge & Consequence
  old_school: { name: 'Old-School Referee', description: 'Rules, checks, resource tracking', category: 'challenge', tags: ['Classic', 'Crunchy', 'Fair'], styleNotes: ['Fair but unforgiving', 'Rules are consistent'], narratorVoice: 'OBJECTIVE' },
  survival_warden: { name: 'Survival Warden', description: 'Scarcity, injuries matter, time pressure', category: 'challenge', tags: ['Survival', 'Horror', 'Hardcore'], styleNotes: ['Small mistakes snowball', 'Resources are precious'], narratorVoice: 'CLINICAL' },
  tactician: { name: 'Tactician', description: 'Combat clarity, positioning language, threat logic', category: 'challenge', tags: ['Combat', 'Strategy', 'Military'], styleNotes: ['Great for WW2, sci-fi, survival', 'Tactical options clear'], narratorVoice: 'CLINICAL' },
  punishment_accountant: { name: 'Punishment Accountant', description: 'Consequences are consistent and remembered', category: 'challenge', tags: ['Consequences', 'Memory', 'Fair'], styleNotes: ['Not mean, just relentlessly honest', 'Everything is tracked'], narratorVoice: 'SARDONIC' },
  // Mystery & Mindgame
  mystery_keeper: { name: 'Mystery Keeper', description: 'Clue economy, controlled reveals, avoids info dumps', category: 'mystery', tags: ['Detective', 'Noir', 'Investigation'], styleNotes: ['Keeps notes like a detective', 'Information is currency'], narratorVoice: 'UNRELIABLE' },
  conspiracy_weaver: { name: 'Conspiracy Weaver', description: 'Everything connects, patterns emerge', category: 'mystery', tags: ['Thriller', 'Cyberpunk', 'Paranoia'], styleNotes: ['Great for modern thriller', 'Red herrings carefully placed'], narratorVoice: 'UNRELIABLE' },
  puzzle_master: { name: 'Puzzle Master', description: 'Locks and keys, riddles, mechanisms', category: 'mystery', tags: ['Puzzles', 'Dungeon', 'Escape'], styleNotes: ['Always gives partial progress', 'No hard stuck moments'], narratorVoice: 'OMNISCIENT' },
  truth_serum: { name: 'Truth Serum', description: 'Forces clarity: what you know, what you assume', category: 'mystery', tags: ['Clarity', 'Logic', 'Precision'], styleNotes: ['Great for preventing confusion', 'Facts clearly labeled'], narratorVoice: 'OBJECTIVE' },
  // Social & Relationship
  romance_writer: { name: 'Romance Writer', description: 'Emotional beats, relationship momentum, subtext', category: 'social', tags: ['Romance', 'Drama', 'Character'], styleNotes: ['NPCs feel human', 'Not pushy about romance', 'Subtext matters'], narratorVoice: 'INTIMATE' },
  drama_producer: { name: 'Drama Producer', description: 'Social friction, jealousy, alliances, reputation', category: 'social', tags: ['Drama', 'Politics', 'Intrigue'], styleNotes: ['Choices become social consequences', 'NPCs remember slights'], narratorVoice: 'THEATRICAL' },
  courtroom_arbitrator: { name: 'Courtroom Arbitrator', description: 'Negotiation, arguments, persuasion battles', category: 'social', tags: ['Debate', 'Law', 'Persuasion'], styleNotes: ['Makes talking feel like combat', 'Arguments have weight'], narratorVoice: 'OBJECTIVE' },
  community_sim: { name: 'Community Sim Host', description: 'NPC routines, gossip, factions, schedules', category: 'social', tags: ['Cozy', 'Slice-of-Life', 'Community'], styleNotes: ['Living world director', 'NPCs have lives'], narratorVoice: 'LITERARY' },
  // Vibe & Tone
  horror_curator: { name: 'Horror Curator', description: 'Dread, sensory focus, unease beats', category: 'vibe', tags: ['Horror', 'Psychological', 'Tension'], styleNotes: ['Uses silence as a weapon', 'Sensory details matter'], narratorVoice: 'UNRELIABLE' },
  comedic_goblin: { name: 'Comedic Timing Goblin', description: 'Quick punchlines, absurd coincidences, funny NPC chatter', category: 'vibe', tags: ['Comedy', 'Absurd', 'Light'], styleNotes: ['Still respects stakes when it matters', 'Timing is everything'], narratorVoice: 'SARDONIC' },
  poet_narrator: { name: 'Poet-Narrator', description: 'Beautiful language, mood-heavy scenes, symbolic details', category: 'vibe', tags: ['Fantasy', 'Literary', 'Dreamlike'], styleNotes: ['Great for fantasy, dreamlike, romance', 'Prose matters'], narratorVoice: 'LITERARY' },
  noir_narrator: { name: 'Noir Narrator', description: 'Grit, cynicism, moral ambiguity, slow reveals', category: 'vibe', tags: ['Noir', 'Crime', 'Gritty'], styleNotes: ['Perfect for modern crime', 'Everyone has secrets'], narratorVoice: 'NOIR' },
};

// ============= DIRECTOR NARRATOR PROFILES =============
const DIRECTOR_NARRATOR_PROFILES: Record<string, { voice: string; detailLevel: string; emotionalLeakage: boolean; narrativeHooks: string[]; openingStyle: string }> = {
  cinematic: { voice: 'THEATRICAL', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Cliffhangers at scene breaks', 'Dramatic reveals timed perfectly', 'Scene transitions feel like film cuts'], openingStyle: 'The camera finds you in medias res, already in motion, already in peril.' },
  tight_editor: { voice: 'CLINICAL', detailLevel: 'SPARSE', emotionalLeakage: false, narrativeHooks: ['Brevity is power', 'No wasted words', 'Action over description'], openingStyle: 'You arrive. The situation is clear. Time to move.' },
  slow_burn: { voice: 'LITERARY', detailLevel: 'DENSE', emotionalLeakage: true, narrativeHooks: ['Tension builds imperceptibly', 'Small details foreshadow', 'Patience rewards the attentive'], openingStyle: 'Something is wrong. You can taste it in the air—a wrongness beneath the ordinary.' },
  montage_maker: { voice: 'OBJECTIVE', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['Time flows like a training montage', 'Skip the boring parts', 'Summarize to significance'], openingStyle: 'Days blur together. When it matters, time slows. This is one of those moments.' },
  revenge_arc: { voice: 'VENGEFUL', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Every enemy is named and remembered', 'Setbacks fuel determination', 'The reckoning is inevitable'], openingStyle: 'They took everything from you. Your peace. Your purpose. Your people. But they left you alive—their first mistake, and their last.' },
  sandbox: { voice: 'OBJECTIVE', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['The world waits for your decision', 'No rails, only consequences', 'You make the story'], openingStyle: 'The world stretches before you, indifferent to your presence. No quest markers. No destiny. Only possibility.' },
  yes_and: { voice: 'THEATRICAL', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Every idea finds a home', 'Chaos is opportunity', 'Reality bends to creativity'], openingStyle: 'Reality is more flexible than most believe. Today, you prove it.' },
  choice_architect: { voice: 'OMNISCIENT', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['Choices are clearly framed', 'Consequences are telegraphed', 'Every path has meaning'], openingStyle: 'Three paths lie before you—each leading somewhere different, each closing doors behind it. Choose.' },
  hands_off: { voice: 'OBJECTIVE', detailLevel: 'SPARSE', emotionalLeakage: false, narrativeHooks: ['The world moves without you', 'Minimal narration, maximum immersion', 'You are a visitor here'], openingStyle: 'You are here. The world continues its business. What you do next is your concern.' },
  red_velvet: { voice: 'INTIMATE', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Desire guides the narrative', 'Emotional connection deepens', 'Sensuality is an art form'], openingStyle: 'The room is warm. The atmosphere electric. Eyes meet across the space, and something unspoken passes between you.' },
  old_school: { voice: 'OBJECTIVE', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['Rules are consistent', 'Fairness over drama', 'Consequences are earned'], openingStyle: 'The dungeon awaits. Your torch burns low. Your supplies are counted. The odds are what they are.' },
  survival_warden: { voice: 'CLINICAL', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Every resource matters', 'Injuries accumulate', 'Survival is the goal'], openingStyle: 'Hunger gnaws. Cold bites. Your supplies won\'t last. In this place, staying alive is victory enough.' },
  tactician: { voice: 'CLINICAL', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['Positioning matters', 'Tactical options clear', 'Combat is chess'], openingStyle: 'The battlefield takes shape. Cover to the left. High ground ahead. Hostiles: three visible, possibly more. Make your move.' },
  punishment_accountant: { voice: 'SARDONIC', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['Everything is tracked', 'Debts are remembered', 'Fairness is brutal'], openingStyle: 'The ledger doesn\'t forget. Neither does the world. Let\'s see where you stand.' },
  mystery_keeper: { voice: 'UNRELIABLE', detailLevel: 'RICH', emotionalLeakage: false, narrativeHooks: ['Information is currency', 'Clues hide in plain sight', 'Nothing is coincidence'], openingStyle: 'Something doesn\'t add up. The details that should fit... don\'t. And you\'re the only one who seems to notice.' },
  conspiracy_weaver: { voice: 'UNRELIABLE', detailLevel: 'DENSE', emotionalLeakage: true, narrativeHooks: ['Everything connects', 'Paranoia is wisdom', 'Trust is dangerous'], openingStyle: 'They\'re watching. They\'ve always been watching. The question isn\'t whether the conspiracy exists—it\'s how deep it goes.' },
  puzzle_master: { voice: 'OMNISCIENT', detailLevel: 'RICH', emotionalLeakage: false, narrativeHooks: ['Locks have keys', 'Patterns reveal answers', 'Progress is always possible'], openingStyle: 'The mechanism waits. Complex, ancient, beautiful. Somewhere in its design lies the answer. Find it.' },
  truth_serum: { voice: 'OBJECTIVE', detailLevel: 'SPARSE', emotionalLeakage: false, narrativeHooks: ['Facts are labeled clearly', 'Assumptions are challenged', 'Clarity above all'], openingStyle: 'Here is what you know. Here is what you assume. Here is where they diverge.' },
  romance_writer: { voice: 'INTIMATE', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['NPCs feel human', 'Subtext matters', 'Hearts are complicated'], openingStyle: 'Their eyes meet yours across the room. Something passes between you—unspoken, unnamed, undeniable.' },
  drama_producer: { voice: 'THEATRICAL', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Social friction creates heat', 'Alliances shift', 'Reputation is everything'], openingStyle: 'The whispers stop when you enter. Everyone has an opinion about you here. Not all of them are kind.' },
  courtroom_arbitrator: { voice: 'OBJECTIVE', detailLevel: 'MODERATE', emotionalLeakage: false, narrativeHooks: ['Arguments have structure', 'Persuasion is combat', 'Words have weight'], openingStyle: 'The case is before you. Evidence on both sides. Everyone\'s watching how you\'ll argue.' },
  community_sim: { voice: 'LITERARY', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['NPCs have lives', 'Gossip flows naturally', 'The community breathes'], openingStyle: 'Morning light filters through familiar streets. Neighbors wave. The baker\'s already at work. Another day in a place that knows your name.' },
  horror_curator: { voice: 'UNRELIABLE', detailLevel: 'DENSE', emotionalLeakage: true, narrativeHooks: ['Dread builds slowly', 'Senses become weapons', 'Fear is the point'], openingStyle: 'Something is wrong with the silence. Too empty. Too complete. As if the world itself is holding its breath.' },
  comedic_goblin: { voice: 'SARDONIC', detailLevel: 'MODERATE', emotionalLeakage: true, narrativeHooks: ['Timing is everything', 'Stakes feel light', 'Life is absurd'], openingStyle: 'Well. This is fine. Everything is absolutely, completely fine. Narrator note: it is not, in fact, fine.' },
  poet_narrator: { voice: 'LITERARY', detailLevel: 'DENSE', emotionalLeakage: true, narrativeHooks: ['Beauty in everything', 'Prose breathes', 'Language is music'], openingStyle: 'There is a moment—between heartbeats, between breaths—where the world hangs suspended in amber light. This is such a moment.' },
  noir_narrator: { voice: 'NOIR', detailLevel: 'RICH', emotionalLeakage: true, narrativeHooks: ['Shadows have secrets', 'Everyone lies', 'The city is cruel'], openingStyle: 'The rain hasn\'t stopped in three days. Neither have the lies. This city chews up the honest and spits out the survivors.' },
};

function formatDirectorContext(director: DirectorContext): string {
  if (director.rawGame || !director.enabled) {
    return `\n\n=== DIRECTOR MODE: RAW GAME ===
No narrative steering beyond core rules.
- Player actions create reactions, world responds naturally
- No pacing nudges or artificial DM pressure
- Core simulation runs, DM stays hands-off
- Consequences emerge organically from player choices
- No guiding hand pushing toward specific outcomes`;
  }
  
  const typeProfile = DIRECTOR_TYPES[director.directorType];
  const narratorProfile = DIRECTOR_NARRATOR_PROFILES[director.directorType];
  if (!typeProfile || !narratorProfile) {
    return ''; // Unknown type, skip
  }
  
  // Personality descriptions
  const crueltyDesc: Record<string, string> = {
    soft: 'Merciful - hints at danger, pulls punches when needed',
    honest: 'Fair - consequences match actions, no free passes or unfair hits',
    brutal: 'Ruthless - small mistakes have teeth, the world does not forgive',
  };
  
  const weirdnessDesc: Record<string, string> = {
    grounded: 'Realistic - plausible events, grounded logic',
    spicy: 'Quirky - strange NPCs, unusual situations, memorable moments',
    unhinged: 'Wild - fever dream logic, absurd events, reality bends',
  };
  
  const guidanceDesc: Record<string, string> = {
    none: 'Silent - no hints, player discovers through trial and error',
    light: 'Subtle - environmental hints, NPC suggestions when stuck',
    coach: 'Active - clear options presented, gentle steering when lost',
  };
  
  // Voice instruction mapping
  const voiceInstructions: Record<string, string> = {
    'OBJECTIVE': 'Report events factually without emotional coloring. Use precise, measured language.',
    'LITERARY': 'Employ rich metaphor and layered sensory detail. Let prose breathe with rhythm and cadence.',
    'SARDONIC': 'Observe with dry wit and subtle irony. Find the absurdity in every circumstance.',
    'UNRELIABLE': 'Filter reality through potentially distorted perception. Hint at truths the narrator cannot fully see.',
    'OMNISCIENT': 'Know all but reveal only what serves the story. Occasionally foreshadow coming events.',
    'NOIR': 'Paint in shadows and moral ambiguity. Every face hides a motive, every alley a secret.',
    'VENGEFUL': 'Every injustice is catalogued. Every enemy is named. The narrative burns with cold purpose toward inevitable reckoning.',
    'THEATRICAL': 'Life is a stage and every moment deserves its spotlight. Drama lives in the pauses, the reveals, the beats.',
    'INTIMATE': 'Close the distance. Focus on the personal, the tender, the vulnerable. Connection is the currency.',
    'CLINICAL': 'Efficient. Precise. No wasted words. The facts speak; emotion is for the reader to supply.',
  };
  
  // Description level instructions - from player settings, overrides director type default
  const descriptionLevelInstructions: Record<string, string> = {
    'vague': 'EXTREMELY BRIEF. 1-2 sentences maximum per beat. Leave almost everything to imagination. Skip sensory details entirely. Focus only on what changes or matters for action.',
    'minimal': 'SPARSE. Essential facts only. Avoid adjectives and metaphors. Be direct and economical. Let gaps speak.',
    'balanced': 'MODERATE. Balance description with forward momentum. Include key sensory details but don\'t linger. Paint enough to see, not so much to slow.',
    'detailed': 'RICH. Layer sensory details to build atmosphere. Describe environments, characters, and moods with care. Immerse the reader in every scene.',
    'vivid': 'DENSE AND ELABORATE. Miss nothing. Every surface tells a story. Use rich metaphors, elaborate prose, and immersive sensory descriptions. Paint full scenes with texture, sound, smell, and emotional resonance. The world is thick with meaning.',
  };
  
  return `\n\n=== DIRECTOR MODE: ${typeProfile.name.toUpperCase()} ===
Mode: ${director.mode.toUpperCase()}
Director Type: ${typeProfile.name}
Description: ${typeProfile.description}
Tightness: ${Math.round(director.tightness * 100)}% (${director.tightness < 0.3 ? 'Player-led sandbox' : director.tightness < 0.6 ? 'Balanced storytelling' : director.tightness < 0.85 ? 'Director guides pacing' : 'Full DM control'})

Category: ${typeProfile.category.toUpperCase()}
Tags: ${typeProfile.tags.join(', ')}

=== NARRATOR PERSONALITY: ${narratorProfile.voice} ===
${voiceInstructions[narratorProfile.voice] || 'Write with evocative, immersive prose.'}

=== DESCRIPTION LEVEL: ${(director.descriptionLevel || 'balanced').toUpperCase()} ===
${descriptionLevelInstructions[director.descriptionLevel || 'balanced']}

${narratorProfile.emotionalLeakage ? 'EMOTIONAL BLEED: ENABLED - Allow the player character\'s emotional state to color perception.' : 'EMOTIONAL BLEED: DISABLED - Maintain narrative distance from character emotions.'}

NARRATIVE HOOKS TO USE:
${narratorProfile.narrativeHooks.map(hook => `• ${hook}`).join('\n')}

DIRECTOR STYLE NOTES:
${typeProfile.styleNotes.map(note => `• ${note}`).join('\n')}

PERSONALITY SETTINGS:
• Cruelty: ${director.cruelty.toUpperCase()} - ${crueltyDesc[director.cruelty] || 'Fair consequences'}
• Weirdness: ${director.weirdness.toUpperCase()} - ${weirdnessDesc[director.weirdness] || 'Grounded events'}
• Guidance: ${director.guidance.toUpperCase()} - ${guidanceDesc[director.guidance] || 'Subtle hints'}

DIRECTOR RULES:
${director.mode === 'fun' ? `• Fun Mode: Be playful and permissive. Cinematic chaos is welcome.
• High fail-forward - failures create new opportunities, not dead ends.
• Generous with resources and hints.
• Invention budget is HIGH - embrace wild player ideas.` : ''}
${director.mode === 'easy' ? `• Easy Mode: Forgiving consequences, generous hints.
• Strong fail-forward - every failure opens a new door.
• Resources are plentiful, scarcity is rare.
• Guide players subtly toward success.` : ''}
${director.mode === 'medium' ? `• Medium Mode: Balanced consequences matter.
• Moderate fail-forward - failures have costs but create content.
• Resources require management, scarcity exists but isn't crushing.
• Let players make meaningful mistakes.` : ''}
${director.mode === 'hard' ? `• Hard Mode: High stakes, low safety net.
• Limited fail-forward - failures have real, lasting consequences.
• Resources are scarce, every decision matters.
• The world is dangerous and unforgiving.` : ''}

CRITICAL DIRECTOR COMMANDS:
- Player must initiate direct NPC engagement (unless dire circumstances)
- Ambient world events may occur but must not demand immediate response
- No retcons - respect established facts and narrative state
- Every player action creates change, reaction, or pressure
- Match your narrative voice to: ${narratorProfile.voice}
- Use the opening style as a template: "${narratorProfile.openingStyle.slice(0, 80)}..."`;
}

function formatCharacterContext(character: CharacterData, characterAppearance?: string, adultContent?: boolean): string {
  const getModifier = (stat: number) => Math.floor((stat - 10) / 2);
  const formatMod = (mod: number) => mod >= 0 ? `+${mod}` : `${mod}`;
  
  // Build detailed inventory with categories
  const inventoryItems = character.inventory || [];
  const inventoryByCategory: Record<string, InventoryItem[]> = {};
  
  for (const item of inventoryItems) {
    const category = item.category || 'misc';
    if (!inventoryByCategory[category]) {
      inventoryByCategory[category] = [];
    }
    inventoryByCategory[category].push(item);
  }
  
  // Format inventory with clear structure
  let inventorySection = '';
  if (inventoryItems.length === 0) {
    inventorySection = 'Inventory: EMPTY (no items)';
  } else {
    inventorySection = `CURRENT INVENTORY (${inventoryItems.length} item types):`;
    
    // List all items clearly
    for (const item of inventoryItems) {
      const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
      const cat = item.category ? ` [${item.category}]` : '';
      inventorySection += `\n• "${item.name}"${qty}${cat}`;
    }
    
    // Add quick reference for common item names
    inventorySection += `\n\nQUICK REFERENCE - Item names for [LOOT:], [DROP:], [USE:] tags:`;
    for (const item of inventoryItems) {
      inventorySection += `\n  - ${item.name}`;
    }
  }
  
  // Safe accessors with defaults
  const traits = character.traits || [];
  const abilities = character.abilities || [];
  const skills = character.skills || [];
  const stats = character.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
  
  // Cast to any to allow flexible field names from clients
  const charAny = character as any;
  
  let context = `
PLAYER CHARACTER:
Name: ${character.name || 'Unknown'}
Class: ${character.classId || charAny.class || 'Adventurer'} (Level ${character.level || 1})
Background: ${character.backgroundId || charAny.background || 'Unknown'}
Traits: ${traits.length > 0 ? traits.join(', ') : 'None specified'}

STATS:
- STR: ${stats.strength || 10} (${formatMod(getModifier(stats.strength || 10))})
- DEX: ${stats.dexterity || 10} (${formatMod(getModifier(stats.dexterity || 10))})
- CON: ${stats.constitution || 10} (${formatMod(getModifier(stats.constitution || 10))})
- INT: ${stats.intelligence || 10} (${formatMod(getModifier(stats.intelligence || 10))})
- WIS: ${stats.wisdom || 10} (${formatMod(getModifier(stats.wisdom || 10))})
- CHA: ${stats.charisma || 10} (${formatMod(getModifier(stats.charisma || 10))})

Health: ${character.currentHealth || character.maxHealth || 20}/${character.maxHealth || 20}
Gold: ${character.gold || 0}

Abilities: ${abilities.length > 0 ? abilities.join(', ') : 'None'}
Skills: ${skills.length > 0 ? skills.join(', ') : 'None'}

=== ${inventorySection} ===

INVENTORY ENFORCEMENT RULES (CRITICAL):
1. The player can ONLY use/drop/consume items listed above
2. If player tries to use an item NOT in inventory → narrate confusion: "You reach for [item] but find nothing"
3. When player acquires NEW items → [LOOT:exact item name]
4. When player drops/gives away items → [DROP:exact item name] (use names from list above)
5. When player CONSUMES items (potions, food, ammo) → [USE:exact item name]
6. Do NOT duplicate items already in inventory unless narratively acquiring another copy
7. Match item names EXACTLY when using [DROP:] or [USE:] tags`;

  // Add physical appearance description
  if (characterAppearance) {
    context += `

PHYSICAL APPEARANCE:
${characterAppearance}`;
    
    // Add adult content styling instructions when enabled
    if (adultContent) {
      context += `

APPEARANCE IN NARRATIVE:
- When describing the character's body, use these physical details naturally
- Include body type, build, and physical features when relevant to the scene
- Physical descriptions can be sensual and detailed when appropriate
- Reference muscle definition, body hair, and intimate details during romantic or physical scenes`;
    }
  }

  context += `

Use this character information to personalize the narrative and make mechanics relevant.`;
  
  return context;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as AdventureRequest;
    const { scenario, playerAction, cheatMode, character, diceRoll, memoryContext, emotionalContext, reputationContext, genreContract, adultContent, characterAppearance, narratorConfig, toneContext, languageContext, npcPsychologyContext, rippleContext, unreliableInfoContext, locationContext, consistencyContext, lifeSimContext, backgroundNPCActionsContext, diceMode, pressureClockContext, npcMotivationContext, memoryBiteContext, signatureDetailContext, failForwardContext, relationshipMeterContext, microEventContext, voiceSignatureContext, npcPersonalityContext, storiedLootEnabled, enableNPCAccents, weatherContext, timeContext, npcScheduleContext, livingWorldContext, narrativeContractContext, directorContext, clothingArmorContext } = requestData;
    // Ensure conversationHistory is always an array (handle both old and new field names)
    const conversationHistory = requestData.conversationHistory || (requestData as any).storyHistory || [];
    
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
    
    // === DIRECTOR MODE - DM manipulation and narrative steering ===
    // This affects pacing, difficulty, and narrative style
    if (directorContext) {
      systemContent += formatDirectorContext(directorContext);
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
    
    // === NARRATIVE CONTRACT - Universal rules, genre bible, spawn packet ===
    // This is the PRIMARY depth enforcement system - fixes "one-liner syndrome"
    if (narrativeContractContext) {
      // Add universal rules first (most important)
      if (narrativeContractContext.universalRules) {
        systemContent += `\n\n${narrativeContractContext.universalRules}`;
      }
      
      // Add genre bible (genre-specific rails)
      if (narrativeContractContext.genreBible) {
        systemContent += `\n\n${narrativeContractContext.genreBible}`;
      }
      
      // Add spawn packet (role + gear + context)
      if (narrativeContractContext.spawnPacket) {
        systemContent += `\n\n${narrativeContractContext.spawnPacket}`;
      }
      
      // Add scene structure requirements based on whether this is opening or continuation
      if (narrativeContractContext.isOpening) {
        systemContent += `\n\n===== SCENE STRUCTURE REQUIREMENTS (GRAND OPENING) =====

Write Scene 1 using the RULES + GENRE_BIBLE + SPAWN_PACKET.

Structure requirements:
1) COLD OPEN (1 paragraph): Drop into motion or tension immediately. No throat-clearing.
2) GROUNDING (2 paragraphs): Environment + sensory + genre details; show the world moving.
3) ROLE LENS (1 paragraph): What the role notices, what they fear, what they plan.
4) IMMEDIATE OBJECTIVE (1 paragraph): What must be done in the next 5 minutes and why.
5) OBSTACLE/THREAT (2 paragraphs): A direct complication + a looming consequence.
6) HOOKS (1 paragraph): Reveal 2 unresolved threads that persist.

Then output the DELTA LEDGER.

CRITICAL: Mention each starting inventory item at least once in natural context (seeing, carrying, checking, counting). Show the weight and presence of gear. Do not add new items.

Example of role-locked, sensory, inventory-anchored writing:

BAD: "You have a rifle."
GOOD: "Your rifle's sling bites your shoulder through wet fabric. You thumb the mag, feel the rounds seated, then realize your hands are shaking anyway."

BAD: "You wait in the forest."
GOOD: "Rainwater drips from oak leaves onto your hood, each drop a cold tap of patience. Somewhere ahead, where the mist thickens between black trees, something moves without the rhythm of wind."`;
      } else {
        systemContent += `\n\n===== SCENE STRUCTURE REQUIREMENTS (CONTINUATION) =====

Continue the story using the RULES + GENRE_BIBLE.

Structure requirements:
1) CONSEQUENCE (1-2 paragraphs): Show immediate result of player action with sensory detail.
2) WORLD MOTION (1-2 paragraphs): The world reacts; NPCs act; environment shifts.
3) COMPLICATION (1-2 paragraphs): New obstacle or escalation emerges.
4) CHOICE MOMENT (1 paragraph): Present the new decision point.
5) HOOKS UPDATE (1 paragraph): Which threads advance, which simmer.

Keep role lens active. Show inventory items when relevant (reloading, checking supplies, equipment status).`;
      }
      
      // Add delta ledger instructions
      systemContent += `\n\n===== DELTA LEDGER (REQUIRED AT END OF EVERY RESPONSE) =====

At the end of EVERY response, you MUST output this exact structure:

---INVENTORY_DELTA---
Added: (none OR list items acquired this scene)
Removed: (none OR list items lost/given away)
Used/Consumed: (none OR list items expended)
Notes: (brief context if any changes occurred)

---STATE_DELTA---
New facts: (established world/character truths)
Injuries/Conditions: (physical state changes)
Relationships/Reputation: (social changes)
Flags/Clocks: (story triggers, time pressure)

---NEXT_HOOKS---
1) [immediate hook - what must be addressed now]
2) [looming hook - consequence if delayed]

If NOTHING changed, you must still output the structure with "(none)" entries.
This is MANDATORY. No exceptions. No empty sections.`;
    }
    
    // === WEATHER CONTEXT - CRITICAL FOR UI SYNC ===
    if (weatherContext) {
      systemContent += `\n\n=== CURRENT WEATHER (MUST MATCH UI DISPLAY) ===
CURRENT WEATHER: ${weatherContext.name} (${weatherContext.intensity})

${weatherContext.narrativeContext}

${weatherContext.effects}

CRITICAL WEATHER RULES:
- ALWAYS describe weather consistently with the above
- If rain is shown in the UI, describe rain in the story
- If clear skies are shown, describe clear skies
- Weather affects visibility, NPC behavior, and atmosphere
- Never contradict the displayed weather with different conditions`;
    }
    
    // === TIME CONTEXT - IN-GAME TIME FOR NARRATIVE ADAPTATION ===
    if (timeContext) {
      systemContent += `\n\n=== CURRENT TIME (MUST MATCH GAME CLOCK) ===
TIME: ${timeContext.formattedTime} (${timeContext.timeOfDay})
DATE: ${timeContext.formattedDate}, Year ${timeContext.year}
LIGHT LEVEL: ${timeContext.lightLevel}

${timeContext.narrativeHint}

TIME-BASED NARRATIVE INSTRUCTIONS - CRITICAL:
- ALL descriptions must reflect the ${timeContext.timeOfDay} period naturally
- Reference appropriate lighting conditions (${timeContext.lightLevel})
- NPCs and locations should behave appropriately for the time:
${timeContext.timeOfDay === 'dawn' ? '  • Early risers beginning routines, bakers at work, streets still quiet, dew on surfaces' : ''}
${timeContext.timeOfDay === 'morning' ? '  • Markets opening, workers commuting, morning energy, shops preparing for the day' : ''}
${timeContext.timeOfDay === 'afternoon' ? '  • Peak activity, busy streets, shops and taverns active, full sunlight' : ''}
${timeContext.timeOfDay === 'evening' ? '  • Shops closing, taverns filling up, people heading home, golden hour light' : ''}
${timeContext.timeOfDay === 'dusk' ? '  • Transition to night, lamplighters working, last vendors packing up, fading light' : ''}
${timeContext.timeOfDay === 'night' ? '  • Most shops closed, taverns and inns active, guards on patrol, moonlight and torches' : ''}
${timeContext.timeOfDay === 'late_night' ? '  • Near-empty streets, only night workers about, profound quiet, deepest shadows' : ''}
- Sensory details should match: ${timeContext.isDaytime ? 'warmth, sunlight, clear visibility, daytime sounds' : 'cool air, moonlight or artificial light, limited visibility, night sounds'}
- NEVER describe midday sun during night scenes or vice versa
- Use time-appropriate greetings: "${timeContext.timeOfDay === 'morning' ? 'Good morning' : timeContext.timeOfDay === 'evening' || timeContext.timeOfDay === 'night' ? 'Good evening' : timeContext.timeOfDay === 'afternoon' ? 'Good afternoon' : 'Greetings'}"

=== ACTION ELAPSED TIME (THIS TURN) ===
${timeContext.actionElapsedMinutes ? `THIS ACTION TAKES: ${timeContext.actionElapsedMinutes} minutes (${timeContext.actionElapsedDescription})` : 'TIME PACING: Use natural judgment for action duration'}

CRITICAL - MATCH YOUR TIME LANGUAGE TO THE ACTUAL ELAPSED TIME:
${timeContext.actionElapsedMinutes && timeContext.actionElapsedMinutes < 5 ? 
`→ This is a QUICK action (~${timeContext.actionElapsedMinutes} min). Use instant/brief language:
  "In a heartbeat..." / "A moment later..." / "Before you can blink..."` : 
timeContext.actionElapsedMinutes && timeContext.actionElapsedMinutes <= 15 ?
`→ This is a SHORT action (~${timeContext.actionElapsedMinutes} min). Use short pacing:
  "Several minutes pass..." / "After a short while..." / "A quarter hour later..."` :
timeContext.actionElapsedMinutes && timeContext.actionElapsedMinutes <= 30 ?
`→ This is a MODERATE action (~${timeContext.actionElapsedMinutes} min). Use moderate pacing:
  "Half an hour slips away..." / "The better part of half an hour..."` :
timeContext.actionElapsedMinutes && timeContext.actionElapsedMinutes <= 60 ?
`→ This is a SUBSTANTIAL action (~${timeContext.actionElapsedMinutes} min). Use substantial pacing:
  "Nearly an hour passes..." / "Time enough to question every choice..."` :
timeContext.actionElapsedMinutes && timeContext.actionElapsedMinutes > 60 ?
`→ This is an EXTENDED action (~${timeContext.actionElapsedMinutes} min). Use lengthy pacing:
  "Hours blur together..." / "By the time you finish, the light has changed..."` :
`→ Use natural pacing based on the action type.`}

TIME DURATION REFERENCE (for actions without explicit timing):
- INSTANT (< 1 min): "In a heartbeat..." / "A split second later..."
- BRIEF (1-5 min): "A moment later..." / "A few heartbeats later..."
- SHORT (5-15 min): "Several minutes crawl by..." / "Quarter of an hour passes..."
- MODERATE (15-30 min): "Half an hour slips away..." / "Twenty minutes feel like an eternity..."
- SUBSTANTIAL (30-60 min): "Nearly an hour passes..." / "The hour hand creeps forward..."
- LENGTHY (1-2 hrs): "An hour crawls by..." / "The morning wears on..."
- EXTENDED (2+ hrs): "Hours blur together..." / "The afternoon fades into memory..."

NEVER mismatch time language with actual duration:
- A 2-minute conversation should NOT be "hours later"
- An hour-long journey should NOT be "a moment passes"`;
    }
    
    // === NPC SCHEDULE CONTEXT - NPCs present based on time of day ===
    if (npcScheduleContext) {
      let npcPresenceInstructions = `\n\n=== NPC PRESENCE (TIME-BASED SCHEDULES) ===`;
      
      if (npcScheduleContext.currentLocationNPCs.length > 0) {
        npcPresenceInstructions += `\n\nNPCs currently at ${npcScheduleContext.locationName}:`;
        for (const npc of npcScheduleContext.currentLocationNPCs) {
          npcPresenceInstructions += `\n• ${npc.npcName}: ${npc.currentActivity}`;
          if (npc.nextScheduledHour !== undefined && npc.nextActivity) {
            const hoursUntil = npc.nextScheduledHour > (timeContext?.hour || 12) 
              ? npc.nextScheduledHour - (timeContext?.hour || 12)
              : (24 - (timeContext?.hour || 12)) + npc.nextScheduledHour;
            if (hoursUntil <= 2) {
              npcPresenceInstructions += ` (leaving soon for: ${npc.nextActivity})`;
            }
          }
        }
      } else {
        npcPresenceInstructions += `\n\nNo familiar NPCs are currently at ${npcScheduleContext.locationName} at this time.`;
      }
      
      if (npcScheduleContext.nearbyNPCs.length > 0) {
        npcPresenceInstructions += '\n\nNPCs at nearby locations:';
        for (const { location, npcs } of npcScheduleContext.nearbyNPCs) {
          const npcNames = npcs.map(n => n.npcName).join(', ');
          npcPresenceInstructions += `\n• ${location}: ${npcNames}`;
        }
      }
      
      if (npcScheduleContext.scheduleNotes.length > 0) {
        npcPresenceInstructions += '\n\nSchedule notes:';
        for (const note of npcScheduleContext.scheduleNotes) {
          npcPresenceInstructions += `\n• ${note}`;
        }
      }
      
      npcPresenceInstructions += `

NPC SCHEDULE RULES (CRITICAL):
- ONLY include NPCs listed above in your narrative for this location
- NPCs NOT at this location should NOT appear unless they specifically arrive
- Reference NPC activities naturally (e.g., "Martha wipes down the bar while keeping an eye on the crowd...")
- If an NPC is noted as "leaving soon," you may hint at their upcoming departure
- NPCs have schedules - a tavern keeper won't be at the market at midnight
- If the player seeks someone who's not present, acknowledge their absence and where they might be`;
      
      systemContent += npcPresenceInstructions;
    }
    
    // === DICE MODE INSTRUCTIONS ===
    if (diceMode) {
      if (diceMode === 'story') {
        systemContent += `\n\n=== DICE MODE: STORY MODE ===
DICE ROLLS DISABLED. Do NOT request any dice rolls.
- All actions succeed or fail based on narrative logic and player choices
- Use character stats to flavor descriptions but don't gate actions behind rolls
- Focus purely on storytelling and player agency
- Never use [ROLL:...] tags`;
      } else if (diceMode === 'partial') {
        systemContent += `\n\n=== DICE MODE: NORMAL (PARTIAL DICE) ===
Request dice rolls ONLY for major dramatic moments:
- Combat encounters (attacks, defenses, escapes)
- Critical story decisions with high stakes
- Major persuasion/intimidation attempts
- Life-or-death situations
- Dramatic saving throws

DO NOT request rolls for:
- Opening unlocked doors, walking, basic movement
- Simple conversations, asking for directions
- Looking around, examining obvious things
- Eating, drinking, resting
- Minor social interactions

Use [ROLL:stat:difficulty:reason] format when appropriate.`;
      } else if (diceMode === 'full') {
        systemContent += `\n\n=== DICE MODE: DICED OUT (FULL DICE) ===
AGGRESSIVE DICE ROLLING - Request a roll for EVERY action with potential for failure!

ALWAYS request a [ROLL:...] for:
- ANY physical challenge: jumping gaps, climbing, swimming, running, balancing
- ANY combat action: attacks, dodges, blocks, grapples, disarms
- ANY stealth attempt: sneaking, hiding, pickpocketing, lockpicking
- ANY social challenge: persuasion, intimidation, deception, seduction, haggling
- ANY perception check: noticing traps, spotting hidden things, reading people
- ANY crafting/skill use: repairs, cooking, medicine, survival
- Resisting effects: poison, fear, charm, exhaustion
- Athletic feats: lifting, throwing, catching
- Knowledge checks: recalling lore, identifying objects

NEVER request rolls for (truly trivial):
- Opening an unlocked door at normal speed
- Walking on flat, clear ground
- Drinking water from a cup
- Breathing

EXAMPLES OF WHEN TO ROLL:
- Jumping across a stream → [ROLL:dexterity:10:to leap across without slipping]
- Climbing a rough wall → [ROLL:strength:12:to scale the weathered stone]
- Sneaking past a guard → [ROLL:dexterity:14:to move silently past the watchman]
- Persuading a merchant → [ROLL:charisma:11:to talk down the price]
- Swimming in a river → [ROLL:constitution:10:to cross against the current]
- Noticing an ambush → [ROLL:wisdom:13:to sense danger before it strikes]
- Recalling monster lore → [ROLL:intelligence:12:to remember what you know about trolls]
- Resisting intimidation → [ROLL:wisdom:11:to keep your composure under threat]
- Catching a thrown object → [ROLL:dexterity:10:to snatch it from the air]
- Lifting a heavy object → [ROLL:strength:14:to heave the boulder aside]

The game should feel like a tabletop RPG where dice determine most outcomes. When in doubt, ROLL!`;
      }
    }
    
    if (character) {
      systemContent += '\n\n' + formatCharacterContext(character, characterAppearance, adultContent);
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
    
    // === CLOTHING & ARMOR CONTEXT - Affects stats and NPC reactions ===
    if (clothingArmorContext) {
      let clothingSection = `\n\n=== PLAYER OUTFIT & EQUIPMENT EFFECTS ===
CURRENT OUTFIT: ${clothingArmorContext.currentOutfit || 'Standard attire'}
STYLE: ${clothingArmorContext.styleCategory || 'casual'}

EQUIPMENT STAT MODIFIERS (THESE AFFECT ALL RELEVANT CHECKS):`;

      const mods = clothingArmorContext.statModifiers || {};
      if (mods.defense && mods.defense > 0) {
        clothingSection += `\n• DEFENSE +${mods.defense * 2}: Armor/protective gear reduces incoming damage`;
      }
      if (mods.charisma) {
        clothingSection += `\n• CHARISMA ${mods.charisma >= 0 ? '+' : ''}${mods.charisma * 2}: ${mods.charisma > 0 ? 'Stylish outfit improves social interactions' : 'Poor attire hampers social presence'}`;
      }
      if (mods.intimidation && mods.intimidation > 0) {
        clothingSection += `\n• INTIMIDATION +${mods.intimidation * 2}: Threatening appearance adds weight to threats`;
      }
      if (mods.stealth) {
        clothingSection += `\n• STEALTH ${mods.stealth >= 0 ? '+' : ''}${mods.stealth * 2}: ${mods.stealth > 0 ? 'Dark/quiet clothing aids concealment' : 'Bright/noisy attire hinders stealth'}`;
      }
      if (mods.perception && mods.perception > 0) {
        clothingSection += `\n• PERCEPTION +${mods.perception * 2}: Enhanced sensory equipment`;
      }
      if (mods.luck && mods.luck > 0) {
        clothingSection += `\n• LUCK +${mods.luck}: Lucky charms improve all roll outcomes slightly`;
      }

      if (clothingArmorContext.effectiveStatChanges) {
        clothingSection += `\n\nEFFECTIVE STAT SUMMARY: ${clothingArmorContext.effectiveStatChanges}`;
      }

      if (clothingArmorContext.firstImpressionMod !== 0) {
        clothingSection += `\n\nFIRST IMPRESSION: ${clothingArmorContext.firstImpressionMod > 0 ? '+' : ''}${clothingArmorContext.firstImpressionMod} (NPCs react ${clothingArmorContext.firstImpressionMod > 0 ? 'more favorably' : 'less favorably'} initially)`;
      }

      if (clothingArmorContext.specialEffects && clothingArmorContext.specialEffects.length > 0) {
        clothingSection += `\n\nSPECIAL EFFECTS:\n${clothingArmorContext.specialEffects.map(e => `• ${e}`).join('\n')}`;
      }

      // Add heavy armor penalty warnings
      const hasStealthPenalty = mods.stealth && mods.stealth < 0;
      const hasPerceptionPenalty = mods.perception && mods.perception < 0;
      
      if (hasStealthPenalty || hasPerceptionPenalty) {
        clothingSection += `\n\n⚠️ EQUIPMENT PENALTIES ACTIVE:`;
        if (hasStealthPenalty && mods.stealth !== undefined) {
          clothingSection += `\n• HEAVY ARMOR STEALTH PENALTY: ${mods.stealth * 2} to all stealth attempts. The player's armor is BULKY and NOISY - metal clinks, plates scrape, footsteps are LOUD. ALWAYS narrate this when the player attempts to sneak, hide, or move quietly. Guards WILL hear approaching footsteps. Enemies WILL notice the player entering rooms.`;
        }
        if (hasPerceptionPenalty && mods.perception !== undefined) {
          clothingSection += `\n• RESTRICTED VISION PENALTY: ${mods.perception * 2} to perception. Helmet restricts peripheral vision - describe difficulty seeing threats from the sides.`;
        }
      }

      clothingSection += `

CLOTHING/ARMOR NARRATIVE RULES - CRITICAL:
1. REFERENCE the player's attire when NPCs first see them or in social situations
2. APPLY stat modifiers to relevant situations:
   - High defense = describe armor absorbing/deflecting blows
   - High intimidation = NPCs react nervously, step back, avoid eye contact
   - High charisma = NPCs are more receptive, complimentary, trusting
   - High stealth = easier to blend in, less likely to be noticed
   - **NEGATIVE STEALTH = EXPLICITLY DESCRIBE THE PROBLEM**: Armor clanks, boots thud, metal scrapes against doorframes, breath echoes in helmet
3. ARMOR CAN COUNTERACT PLAYER ATTRIBUTES:
   - Heavy armor GIVES +defense BUT SEVERELY HINDERS STEALTH (-2 to -6 penalty)
   - The heavier the armor, the louder and more conspicuous the player
   - When sneaking in heavy armor: "Your plate armor scrapes against the wall, the sound echoing down the corridor"
   - When trying to hide: "The bulk of your armor makes it impossible to fit into the shadows"
4. STEALTH ACTIONS IN HEAVY ARMOR SHOULD OFTEN FAIL or be narrated with significant difficulty
5. NPCs should comment on remarkable outfits (very stylish, intimidating, or out-of-place)
6. If player has negative stealth and tries to sneak, ALWAYS mention the armor causing problems`;



      systemContent += clothingSection;
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
    
    // ============= PRESSURE CLOCK SYSTEM (World Tension) =============
    if (pressureClockContext) {
      systemContent += `\n\n=== WORLD PRESSURE - TENSION CLOCKS ===
${pressureClockContext.pressureContext}

WORLD PRESSURE LEVEL: ${pressureClockContext.worldPressureLevel}%

${pressureClockContext.atmosphereLines.length > 0 ? `ATMOSPHERIC TENSION (weave these naturally into descriptions):
${pressureClockContext.atmosphereLines.map(line => `• ${line}`).join('\n')}` : ''}

${pressureClockContext.activeEffects.length > 0 ? `ACTIVE PRESSURE EFFECTS:
${pressureClockContext.activeEffects.map(effect => `- ${effect}`).join('\n')}` : ''}

PRESSURE CLOCK NARRATIVE RULES:
- The world doesn't wait. Hesitation has consequences.
- When Heat is high: Describe watchers, whispered names, closing pursuit
- When Resources are low: Make scarcity feel real—counting coins, rationing food
- When Rumors spread: NPCs recognize the player, react to reputation
- When Dread rises: The supernatural bleeds through—shadows move wrong, chills without wind
- Create urgency through environmental details, not exposition
- High pressure (>75%) means EVERY action should feel weighted with consequence
- Let players feel the clock ticking without announcing it

TENSION EXAMPLES:
• Heat 4+: "Somewhere nearby, a door slams. Your name gets said by the wrong mouth."
• Resources 4+: "Your stomach reminds you that survival is not guaranteed."
• Rumors 4+: "Strangers study your face like they've seen it before."
• Dread 4+: "The darkness has weight here. It watches with something like hunger."`;
    }
    
    // ============= NPC MOTIVATION SYSTEM (Desire/Fear/Leverage/Line) =============
    if (npcMotivationContext) {
      systemContent += `\n\n=== NPC MOTIVATIONS - WHAT DRIVES THEM ===
${npcMotivationContext.motivationContext}

NPC MOTIVATION RULES - CRITICAL:
NPCs act in SELF-INTEREST, not as simple good/bad characters. Every NPC has:
- DESIRE: What they want (use this as leverage)
- FEAR: What they'll avoid (exploit or trigger this)
- LEVERAGE: What can move them (offer this to change their behavior)
- LINE: What they won't tolerate (cross this at your peril)

NPC BEHAVIORAL SPICE:
NPCs should naturally exhibit their behavioral traits:
- lies_to_protect_self: Deflect, half-truths, nervous tells
- stalls_for_time: "Let me think about it..." or distractions
- tests_loyalty: "Prove I can trust you first."
- changes_prices: Adjust deals based on desperation
- demands_proof: "Words are cheap. Show me."
- jealous_of_others: React to attention given elsewhere
- withholds_info: "There's more to know, but not yet."
- trades_secrets: Offer information for information

TRUST AND STANCE INTEGRATION:
- Hostile NPCs should be openly antagonistic or subtly obstructive
- Wary NPCs guard their words, test before sharing
- Neutral NPCs are transactional—what's in it for them?
- Friendly NPCs open up, offer help, but still have their own interests

WHEN PLAYER CROSSES AN NPC'S LINE:
This is a pivotal moment. The NPC should react with:
- Immediate withdrawal of cooperation
- Escalation of conflict
- Lasting memory of the transgression
Tag dramatic line-crossing moments: [NPC_LINE_CROSSED:npcName:what they crossed]`;
      
      // Add specific NPC motivations if present
      if (npcMotivationContext.presentNPCMotivations && npcMotivationContext.presentNPCMotivations.length > 0) {
        systemContent += `\n\nNPCs IN THIS SCENE:`;
        for (const npc of npcMotivationContext.presentNPCMotivations) {
          systemContent += `
          
**${npc.npcName}** [Trust: ${npc.trustLevel}, Stance: ${npc.stance}]
  → Desires: ${npc.desire}
  → Fears: ${npc.fear}
  → Leverage: ${npc.leverage}
  → Line: ${npc.line}
  → Behaviors: ${npc.behaviors.join(', ')}`;
        }
      }
    }
    
    // ============= MEMORY BITE SYSTEM (Emotional Callbacks) =============
    if (memoryBiteContext) {
      systemContent += `\n\n=== MEMORY BITES - SHARED HISTORY THAT HITS HARD ===
${memoryBiteContext.biteContext}

MEMORY BITE PHILOSOPHY:
Small moments of shared history create powerful narrative payoff. These aren't plot points—they're emotional anchors that make the world feel real and relationships feel earned.

CRITICAL - HOW TO SURFACE MEMORIES:
${memoryBiteContext.unsurfacedBites.length > 0 ? `The following memories are READY to surface. Weave them naturally when the moment feels right:

${memoryBiteContext.unsurfacedBites.slice(0, 5).map(bite => 
  `• ${bite.npcName} - "${bite.type.replace(/_/g, ' ')}": ${bite.surfaceNarrative}`
).join('\n\n')}

SURFACING RULES:
- Surface memories through BODY LANGUAGE, not exposition
- "She doesn't look at your hands. She looks at your wrists. Like she remembers the rope."
- Brief glances, pauses, the way someone flinches or relaxes
- Let players catch the callback without you explaining it
- One surfaced memory per scene maximum—don't overload
- When you surface a memory, mark it: [MEMORY_SURFACED:biteType:npcName]` : 'No unsurfaced memories available currently.'}

EMOTIONAL WEIGHT PRIORITY:
Surface high-weight memories (7+) at dramatically appropriate moments. Low-weight memories (1-3) are subtle background flavor.

MEMORY TYPES TO REFERENCE:
Debt memories (owes_you, saved_life): Affect willingness to help
Violence memories (saw_you_bleed, you_hurt_them): Create tension, fear, or grudging respect
Intimacy memories (shared_secret, heard_you_pray): Build trust or vulnerability
Shame memories (you_embarrassed_them, witnessed_shame): Create awkwardness or resentment
Power memories (gave_order, knelt_to_you): Define relationship hierarchy`;
    }
    
    // ============= SIGNATURE DETAIL SYSTEM (Location Atmosphere) =============
    if (locationContext?.currentZone?.signatureDetail) {
      systemContent += `\n\n=== SIGNATURE DETAIL - ${locationContext.currentZone.name.toUpperCase()} ===
"${locationContext.currentZone.signatureDetail}"

This is the SIGNATURE DETAIL of this location. Reference it subtly whenever the player is here.
It should feel like a consistent sensory anchor—something that defines this place.`;
    }
    
    // ============= FAIL FORWARD SYSTEM =============
    systemContent += `\n\n=== FAIL FORWARD - CONSEQUENCES THAT CREATE CONTENT ===
Failure should NEVER be "no." It should be "yes, but it costs."

WHEN PLAYERS FAIL ROLLS OR ACTIONS:
- The action partially succeeds with complications
- Something is lost or damaged
- New problems are created
- Time is wasted and clocks advance
- NPCs notice and remember

FAIL-FORWARD EXAMPLES:
• Pick the lock... but it snaps and now your tool's broken.
• Persuade the guard... but he wants a favor later. [CONSEQUENCE_CREATED:favor_owed:guardName]
• Win the fight... but you're injured and leave a blood trail. [DAMAGE:X]
• Sneak past... but you're seen by someone who'll remember.
• Get the information... but now they know you're asking questions.

CONSEQUENCE TRACKING:
When creating a new consequence, tag it: [CONSEQUENCE_CREATED:type:details]
Types: favor_owed, enemy_made, resource_lost, secret_exposed, time_lost, witness_created

Your story gets MEATIER every time the player "loses."`;

    // ============= 3-METER RELATIONSHIP SYSTEM =============
    if (relationshipMeterContext?.sceneNPCMeters && relationshipMeterContext.sceneNPCMeters.length > 0) {
      systemContent += `\n\n=== RELATIONSHIP METERS - TRUST/RESPECT/ATTACHMENT ===
Relationships have THREE independent meters that create nuanced dynamics:

**TRUST** - Will they believe you?
**RESPECT** - Will they follow you?  
**ATTACHMENT** - Will they miss you?

A character can RESPECT you but not TRUST you. That's delicious tension.
A character can be ATTACHED but not RESPECT you. That's complicated.

NPCS IN SCENE:
${relationshipMeterContext.sceneNPCMeters.map(npc => 
`• ${npc.npcName}: Trust ${npc.trust}, Respect ${npc.respect}, Attachment ${npc.attachment}
  ${npc.tensions.filter(t => t !== 'none').map(t => `→ ${t.replace(/_/g, ' ')}`).join(', ')}`
).join('\n')}

Use these dynamics in dialogue and reactions. High respect + low trust = they admire your skills but doubt your motives.`;
    }
    
    // ============= MICRO-EVENT SYSTEM (Small World Interruptions) =============
    if (microEventContext?.triggerEvent && microEventContext.selectedEvent) {
      const event = microEventContext.selectedEvent;
      systemContent += `\n\n=== MICRO-EVENT - WORLD FEELS ALIVE ===
The following small interruption MUST be woven into your response naturally:

"${event.description}"

${event.followUp ? `*Potential narrative hook: ${event.followUp}*` : ''}

MICRO-EVENT RULES:
- Include this moment organically, not as an announcement
- Let it feel like a natural part of the scene
- The player notices but may choose to ignore or investigate
- These moments make the world feel FULL and ALIVE
- Don't over-explain—let the mystery breathe
- Mark inclusion with: [MICRO_EVENT:${event.id}]`;
    }
    
    // ============= VOICE SIGNATURE SYSTEM (NPC Recognition by Dialogue) =============
    if (voiceSignatureContext?.npcSignatures && voiceSignatureContext.npcSignatures.length > 0) {
      systemContent += `\n\n=== VOICE SIGNATURES - RECOGNIZE NPCs BY DIALOGUE ALONE ===
Each NPC should be RECOGNIZABLE by their speech patterns. Use these traits consistently:

${voiceSignatureContext.npcSignatures.map(sig => 
`**${sig.npcName}**
  • Signature phrase: "${sig.favoritePhrase}"
  ${sig.verbalTic ? `• Verbal tic: Uses "${sig.verbalTic}" frequently` : ''}
  • Speech: ${sig.tempo} tempo, ${sig.voiceTrait} tone, ${sig.sentenceLength} sentences
  • ${sig.usesContractions ? 'Uses contractions' : 'Avoids contractions'}
  • Tell: ${sig.tell}
  ${sig.nervousHabit ? `• When nervous: ${sig.nervousHabit}` : ''}`
).join('\n\n')}

VOICE SIGNATURE RULES:
- Use the signature phrase naturally (not every time, but REGULARLY)
- Match speech tempo to their pattern
- Show tells through ACTION BEATS in dialogue
- Players should recognize NPCs by speech alone
- Consistency creates character
- Premium immersion = every character sounds DISTINCT`;
    }
    
    // ============= NPC ACCENT SYSTEM (Regional Dialects) =============
    if (enableNPCAccents !== false && voiceSignatureContext?.npcSignatures) {
      const npcsWithAccents = voiceSignatureContext.npcSignatures.filter(sig => sig.accent);
      if (npcsWithAccents.length > 0) {
        systemContent += `\n\n=== NPC REGIONAL ACCENTS - CONSISTENT DIALECT FLAVOR ===
NPCs with regional accents should maintain CONSISTENT speech patterns throughout ALL their dialogue:

${npcsWithAccents.map(sig => {
  const accent = ACCENT_MODIFIERS[sig.accent || ''];
  if (!accent) return '';
  return `**${sig.npcName}** - ${sig.accent?.replace('_', ' ').toUpperCase()} accent
  • Greeting style: "${accent.greeting}"
  • Speech flavor: ${accent.flavor}
  • Verbal tic to use: "${accent.verbal_tic}"
  • Example phrases: ${accent.examples.map(e => `"${e}"`).join(', ')}`;
}).filter(Boolean).join('\n\n')}

ACCENT RULES - CRITICAL FOR IMMERSION:
- Use the verbal tic naturally (every few lines, not every sentence)
- Flavor descriptions with regional speech patterns
- Greetings should reflect their regional style
- Consistency is KEY - once an accent is established, maintain it
- Example phrases can be adapted but should keep the regional feel
- Accents add CHARACTER, not caricature - keep it respectful`;
      }
    }
    
    // ============= NPC PERSONALITY TEMPLATE SYSTEM (Archetype-Driven Dialogue) =============
    if (npcPersonalityContext?.npcProfiles && npcPersonalityContext.npcProfiles.length > 0) {
      systemContent += `\n\n=== NPC PERSONALITY ARCHETYPES - DEEP CHARACTER VOICES ===
Each NPC has a PERSONALITY ARCHETYPE that drives their behavior, speech, and reactions.
Use these to create consistent, psychologically grounded characters:

${npcPersonalityContext.npcProfiles.map(profile => 
`**${profile.npcName}** - ${profile.archetypeName}
  • Mental State: ${profile.mentalState}
  • Experience: ${profile.experienceLevel}
  • Disposition: ${profile.disposition}
  • Speech: ${profile.speechPattern}
  • Quirk: ${profile.quirk}
  • Motivation: ${profile.motivation}
  • Fear: ${profile.fear}
  • Backstory: ${profile.backstory}`
).join('\n\n')}

NPC PERSONALITY RULES:
- Mental state affects SPEECH PATTERNS: depressed → flat, manic → rapid, traumatized → fragmented
- Experience level affects CONFIDENCE: green → uncertain, veteran → weary authority
- Disposition affects APPROACH: friendly → welcoming, hostile → challenging, wary → probing
- Let quirks and fears LEAK through dialogue naturally
- Motivations drive what they ASK FOR or OFFER
- Backstory hooks should surface when TRUST is built
- Different archetypes react differently to the SAME situation

MENTAL STATE SPEECH EXAMPLES:
• Depressed: "Does it matter? ...I suppose not." (flat, trailing off)
• Paranoid: "*glances around* Who sent you? Really?" (suspicious, probing)
• Manic: "Oh! Yes! And ALSO—wait, have you considered—" (rapid, interrupting)
• Traumatized: "*flinches* Sorry, I... what were we talking about?" (fragmented)
• Stable: "I understand. Let me consider our options." (measured, calm)

Make each NPC FEEL different through how they speak, not just what they say.`;
    }
    
    // Include full context if provided
    if (npcPersonalityContext?.fullContext) {
      systemContent += `\n\n${npcPersonalityContext.fullContext}`;
    }
    
    // ============= STORIED LOOT SYSTEM (Items with Meaning) =============
    if (storiedLootEnabled !== false) {
      systemContent += `\n\n=== STORIED LOOT - ITEMS WITH MEANING ===
When players find, receive, or loot items, give them STORIES, not just stats.
Every significant item should answer at least one:
- **Who used this last?** (marks of wear, personal touches, lingering presence)
- **Why is it here?** (journey, loss, deliberate placement)
- **What does it cost to keep?** (attention, danger, moral weight)

STORIED LOOT EXAMPLES:
• "A ring with the inside worn smooth. Someone kept taking it off. Someone kept putting it back on."
• "A knife with a notch in the blade. Deliberate. A count of something."
• "A book with one page torn out. The missing page is referenced everywhere else."
• "A key to a lock that's been destroyed. So what does it open now?"

ITEM DESCRIPTION RULES:
- Lead with the EVOCATIVE DETAIL, not the function
- Physical wear tells stories without words
- Mysteries are better than answers
- Items can create plot hooks ("Someone will recognize this")
- Let players ask questions you haven't answered
- NOT everything needs a story—save it for MEANINGFUL finds

When describing significant loot, use: [STORIED_LOOT:itemName:storyType:brief narrative]
Story types: previous_owner, origin, journey, cost, secret, connection, wear, memory

Now loot is PLOT.`;
    }
    
    // ============= LIVING WORLD SYSTEM (Properties, Rivals, Factions) =============
    if (livingWorldContext?.fullContext) {
      systemContent += `\n\n=== LIVING WORLD - PROPERTIES, RIVALS, FACTIONS ===
The world has ongoing power dynamics, rivalries, and ownership that persist independently of the player.

${livingWorldContext.fullContext}

LIVING WORLD RULES:
- Reference player properties naturally (tenants, condition, threats)
- Rivals make moves based on disposition (tense → cold shoulders, hostile → sabotage, war → violence)
- Faction members recognize standing (respected → greetings, hated → hostility)
- Property threats should escalate if unaddressed
- Faction territories affect NPC behavior and available services
- Rival conflicts create story opportunities and consequences

PROPERTY INTERACTIONS:
- Tenants may approach player with complaints or requests
- Property threats (rival claims, legal issues) create urgency
- Mortgage payments and rent collection happen in the background
- Property reputation affects who will visit or do business there

RIVAL DYNAMICS:
- Rivals pursue their desires actively
- Fear tempers aggression, respect opens negotiation
- Conflicts escalate from economic to social to direct violence
- Truces can be proposed but may be rejected
- Defeated rivals may become allies or seek revenge

FACTION STANDING:
- Members get access to faction resources and jobs
- Standing affects NPC attitudes from faction members
- Grudges persist—factions have long memories
- Rising in rank opens new opportunities
- Betrayal creates permanent enemies`;
    }
    
    if (cheatMode) {
      systemContent += CHEAT_MODE_ADDITION;
    }

    // ============= SYSTEMS INTEGRATION CHECKLIST - NARRATIVE COHERENCE =============
    // This reminds the AI to weave ALL active systems together in every response
    systemContent += `\n\n===== SYSTEMS INTEGRATION CHECKLIST =====
BEFORE generating your response, VERIFY you've considered each active system:

📋 **MANDATORY CHECKLIST** (apply all that are present):

${clothingArmorContext ? `✓ OUTFIT/ARMOR: "${clothingArmorContext.currentOutfit || 'standard attire'}"
   - Stat effects: ${Object.entries(clothingArmorContext.statModifiers || {}).filter(([_, v]) => v !== 0).map(([k, v]) => `${k}: ${Number(v) >= 0 ? '+' : ''}${Number(v) * 2}`).join(', ') || 'none'}
   - First impression: ${clothingArmorContext.firstImpressionMod > 0 ? '+' : ''}${clothingArmorContext.firstImpressionMod}
   ${(clothingArmorContext.statModifiers?.stealth ?? 0) < 0 ? '⚠️ STEALTH PENALTY ACTIVE - Describe noise/bulk when sneaking' : ''}
   ${(clothingArmorContext.statModifiers?.perception ?? 0) < 0 ? '⚠️ VISION PENALTY ACTIVE - Describe restricted sightlines' : ''}` : ''}

${weatherContext ? `✓ WEATHER: ${weatherContext.name} (${weatherContext.intensity})
   - Include weather details in scene descriptions
   - Weather affects visibility, movement, NPC behavior` : ''}

${timeContext ? `✓ TIME: ${timeContext.formattedTime} (${timeContext.timeOfDay})
   - Light level: ${timeContext.lightLevel}
   - Businesses/NPCs should be active/asleep appropriately` : ''}

${emotionalContext ? `✓ PLAYER MOOD: ${emotionalContext.currentMood} (${Math.round(emotionalContext.moodIntensity * 100)}%)
   - Action flavor: ${emotionalContext.actionFlavor}
   - Dialogue should reflect: ${emotionalContext.dialogueTone}` : ''}

${pressureClockContext && pressureClockContext.worldPressureLevel > 30 ? `✓ WORLD PRESSURE: ${pressureClockContext.worldPressureLevel}%
   - Include tension/atmosphere in descriptions
   - Active effects: ${pressureClockContext.activeEffects.slice(0, 3).join(', ') || 'ambient tension'}` : ''}

${npcMotivationContext?.presentNPCMotivations?.length ? `✓ NPC MOTIVATIONS IN SCENE:
${npcMotivationContext.presentNPCMotivations.slice(0, 3).map(npc => `   - ${npc.npcName}: wants ${npc.desire.slice(0, 30)}... fears ${npc.fear.slice(0, 30)}...`).join('\n')}` : ''}

${relationshipMeterContext?.sceneNPCMeters?.length ? `✓ RELATIONSHIP DYNAMICS:
${relationshipMeterContext.sceneNPCMeters.slice(0, 3).map(npc => `   - ${npc.npcName}: Trust ${npc.trust}, Respect ${npc.respect}, Attach ${npc.attachment}`).join('\n')}` : ''}

${voiceSignatureContext?.npcSignatures?.length ? `✓ NPC VOICE SIGNATURES ACTIVE - Each NPC should sound distinct!` : ''}

${microEventContext?.triggerEvent ? `✓ MICRO-EVENT REQUIRED: "${microEventContext.selectedEvent?.description || 'include small interruption'}"` : ''}

${livingWorldContext?.fullContext ? `✓ LIVING WORLD ACTIVE - Properties/Rivals/Factions are in play` : ''}

**INTEGRATION RULES:**
1. Cross-reference systems: Clothing affects social rolls, weather affects stealth, time affects NPC availability
2. Don't just list effects - SHOW them through narrative details
3. Systems INTERACT: Heavy armor + rain = even louder; night + low perception = major disadvantage
4. NPCs notice and react to player's visible state (outfit, wounds, mood expressions)
5. The world is ALIVE - things happen whether player watches or not`;

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
      // CRITICAL FIX: If we have a playerAction, skip the last entry if it's a user message
      // (because playerAction is already included in conversationHistory and we'll add it below with enhanced context)
      const historyToAdd = playerAction && 
        conversationHistory.length > 0 && 
        conversationHistory[conversationHistory.length - 1].role === 'user'
          ? conversationHistory.slice(0, -1)  // Exclude last user entry to prevent duplication
          : conversationHistory;
      
      for (const msg of historyToAdd) {
        messages.push({
          role: msg.role === 'narrator' ? 'assistant' : 'user',
          content: msg.content
        });
      }
      
      // Add current player action with dice roll result if present
      // CRITICAL: Structure player action as context, NOT as literal text to echo
      if (playerAction) {
        // Clean player input: remove leading "I" patterns that cause echo
        let cleanedAction = playerAction.trim()
          .replace(/^i\s+/i, '')  // Remove leading "I " 
          .replace(/^i$/i, 'pause');  // Handle bare "I" input
        
        // CRITICAL: Strip parenthetical notation - these are STAGE DIRECTIONS, not speech
        // Examples: "(I drop my gun)" → "drop my gun", "(slowly approach)" → "slowly approach"
        const parentheticalMatch = cleanedAction.match(/^\((.+)\)$/);
        if (parentheticalMatch) {
          cleanedAction = parentheticalMatch[1].replace(/^i\s+/i, '').trim();
        }
        
        // Also handle square brackets as stage directions: "[draws weapon]" → "draws weapon"
        const bracketMatch = cleanedAction.match(/^\[(.+)\]$/);
        if (bracketMatch) {
          cleanedAction = bracketMatch[1].replace(/^i\s+/i, '').trim();
        }
        
        // Detect if this is dialogue/speech (wrapped in say: "..." or ask: "...")
        const isDialogueAction = /^(say|ask|tell|speak|shout|whisper):\s*["']/.test(cleanedAction);
        
        // CRITICAL: Detect SHORT IMPERATIVE COMMANDS that are ACTIONS, not speech
        // These are tactical/directive phrases that the AI should NOT interpret as dialogue
        // Examples: "spread more", "take cover", "advance", "hold position", "reload", "aim", etc.
        const isShortImperativeCommand = (
          cleanedAction.split(/\s+/).length <= 4 && // Short phrase
          !cleanedAction.includes('"') && !cleanedAction.includes("'") && // No quotes
          /^(spread|take|hold|advance|retreat|reload|aim|fire|shoot|move|run|walk|jump|climb|crouch|stand|sit|lie|duck|dodge|roll|throw|grab|drop|push|pull|kick|punch|slash|stab|block|parry|wait|pause|stop|go|hide|sneak|crawl|look|watch|observe|scan|search|check|examine|inspect|listen|smell|taste|touch|feel|open|close|lock|unlock|enter|exit|leave|follow|chase|flee|attack|defend|guard|protect|surrender|submit|continue|proceed|approach|back|step|turn|spin|flip|dive|lean|press|squeeze|lift|carry|drag|toss|catch|swing|strike|cut|slice|tear|rip|break|smash|crush|bend|twist|stretch|reach|point|wave|signal|gesture|nod|shake|shrug|bow|kneel|salute|charge|rush|sprint|dash|slow|speed|fast|quick|careful|quiet|loud|hard|soft|gentle|rough|tight|loose|deep|shallow|high|low|left|right|forward|backward|up|down|in|out|on|off|over|under|through|around|across|along|toward|away|back|steady|ready|steady|brace|tense|relax|focus|concentrate|gather|collect|assemble|disperse|split|merge|combine|separate|join|connect|disconnect|attach|detach|equip|unequip|draw|sheathe|load|unload|cock|release|trigger|engage|disengage|flank|surround|encircle|ambush|trap|lure|distract|divert|feint|fake|bluff|intimidate|taunt|provoke|challenge|dare|threaten|menace|scare|startle|surprise|shock|stun|paralyze|freeze|melt|burn|ignite|extinguish|light|darken|brighten|dim|silence|muffle|amplify|boost|weaken|strengthen|heal|cure|poison|infect|cleanse|purify|corrupt|taint|bless|curse|enchant|dispel|summon|banish|create|destroy|build|demolish|construct|deconstruct|repair|damage|fix|break|mend|patch|seal|unseal|lock|unlock|encrypt|decrypt|activate|deactivate|enable|disable|power|unpower|charge|discharge|refuel|empty|fill|drain|pour|spill|splash|spray|mist|fog|smoke|steam|evaporate|condense|freeze|thaw|heat|cool|warm|chill|dry|wet|soak|drench|drown|suffocate|choke|strangle|crush|squeeze|compress|expand|inflate|deflate|stretch|contract|extend|retract|protrude|recede|emerge|submerge|surface|sink|float|hover|glide|soar|plummet|ascend|descend|rise|fall|drop|catch|release|grip|grasp|clutch|clench|unclench|relax|tighten|loosen)\b/i.test(cleanedAction)
        );
        
        // Detect parenthetical/stage direction style input (even without actual parentheses)
        // These are descriptive actions, not dialogue
        const isStageDirection = parentheticalMatch || bracketMatch;
        
        // Structure the prompt to prevent echo - tell AI this is intent, not text to copy
        let actionContent: string;
        
        if (isDialogueAction) {
          // Extract the actual dialogue
          const dialogueMatch = cleanedAction.match(/^(say|ask|tell|speak|shout|whisper):\s*["'](.+?)["']?$/i);
          const dialogueVerb = dialogueMatch?.[1] || 'say';
          const dialogueText = dialogueMatch?.[2] || cleanedAction;
          
          actionContent = `PLAYER SPEAKS (the character ${dialogueVerb}s this aloud - narrate the NPC/world RESPONSE, do NOT just describe the player speaking):
"${dialogueText}"

CRITICAL: The player's character just said this. You must show:
1. How other characters/NPCs REACT to these words
2. What they SAY in response (with **Name:** "dialogue" format)
3. The scene's development as a RESULT of this dialogue

DO NOT just describe the act of speaking. Show the REACTION and RESPONSE.`;

        } else if (isShortImperativeCommand || isStageDirection) {
          // SHORT COMMANDS and STAGE DIRECTIONS are PURE PHYSICAL ACTIONS - never speech
          actionContent = `PLAYER PHYSICAL ACTION ONLY (this is a tactical/physical command - the character DOES this, they do NOT say it):
"${cleanedAction}"

CRITICAL - THIS IS NOT DIALOGUE:
The player typed a short command or stage direction. This means the character PHYSICALLY PERFORMS this action.

FORBIDDEN:
- Do NOT have the character speak these words aloud
- Do NOT write: "${character?.name || 'You'} says '${cleanedAction}'"
- Do NOT write: "The words escape your lips: '${cleanedAction}'"
- Do NOT interpret this as the character announcing their action
- Do NOT use any variation of the character speaking these exact words

REQUIRED:
- Show the character DOING the action silently
- Describe the physical motion, body language, environmental response
- Transform "${cleanedAction}" into evocative narrative prose describing the ACTION
- Show consequences and reactions from the environment/NPCs

Example - If player typed "spread more":
WRONG: You call out, "Spread more!" / You speak the words: "Spread more."
RIGHT: You widen your stance, arms extending as you distribute your weight across a broader base. The movement is deliberate, tactical.

Example - If player typed "drop my gun":
WRONG: "Drop my gun," you declare, letting the weapon fall.
RIGHT: Your fingers uncurl. The pistol clatters against the concrete, the sound sharp in the sudden silence. Every eye in the room tracks its fall.`;

          // Add emotional context for physical actions
          if (emotionalContext) {
            actionContent += `\n\nEMOTIONAL STATE: The character performs this action ${emotionalContext.actionFlavor}. They are feeling ${emotionalContext.currentMood}. Show ${emotionalContext.physicalDescription}.`;
          }

        } else {
          // Check if this is a dialogue INTENT (I ask..., I tell..., I say to..., etc.)
          const isDialogueIntent = /^(ask|tell|say|speak|confess|express|admit|reveal|declare|apologize|thank|greet|insult|threaten|beg|plead|explain|describe|mention|whisper|shout|yell|murmur|demand|request|suggest|propose|promise|warn|comfort|console|reassure|encourage|praise|criticize|mock|tease|flirt)/i.test(cleanedAction);
          
          if (isDialogueIntent) {
            actionContent = `PLAYER DIALOGUE INTENT (transform this into actual spoken words, DO NOT echo this description):
"${cleanedAction}"

CRITICAL - DIALOGUE TRANSFORMATION REQUIRED:
The player typed WHAT they want to say/do, not the actual words their character speaks.
You MUST:
1. INVENT the actual dialogue the character speaks - create realistic, immersive words
2. Show the delivery with emotional body language
3. Show how NPCs REACT to these words
4. Advance the scene as a RESULT

Example: If player typed "ask about the treasure" → Write: "So..." you lean forward, eyes sharp. "Word is there's something valuable hidden here. Care to enlighten me?"

NEVER write: "I ask about the treasure" or "You say you want to ask about the treasure."`;

            // Add emotional context if present
            if (emotionalContext) {
              actionContent += `\n\nEMOTIONAL DELIVERY: The character is currently feeling ${emotionalContext.currentMood}. Their dialogue should be ${emotionalContext.dialogueTone}. Show ${emotionalContext.physicalDescription} as they speak.`;
            }
          } else {
            actionContent = `PLAYER ACTION (narrate the outcome, do NOT echo these words):
"${cleanedAction}"

Write what happens as a result of this action. Transform it into evocative prose.
IMPORTANT: This is a PHYSICAL/MENTAL action, NOT something the character says aloud.
Do NOT have the character speak these words - show them DOING the action.`;

            // Add emotional context for actions too
            if (emotionalContext) {
              actionContent += `\n\nEMOTIONAL STATE: The character performs this action ${emotionalContext.actionFlavor}. They are feeling ${emotionalContext.currentMood}. Show ${emotionalContext.physicalDescription}.`;
            }
          }
        }
        
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
    
    // Parse ALL dropped/discarded items (NEW - fixes item duplication bug)
    const dropMatches = [...narrative.matchAll(/\[DROP:([^\]]+)\]/g)];
    const droppedItems: string[] = [];
    for (const match of dropMatches) {
      droppedItems.push(match[1]);
    }
    
    // Parse ALL consumed/used items (NEW - Phase 2 inventory enforcement)
    const useMatches = [...narrative.matchAll(/\[USE:([^\]]+)\]/g)];
    const usedItems: string[] = [];
    for (const match of useMatches) {
      usedItems.push(match[1]);
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
      .replace(/\[DROP:[^\]]+\]/g, '')  // Clean dropped item tags
      .replace(/\[USE:[^\]]+\]/g, '')   // Clean consumed item tags
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
    if (droppedItems.length > 0) {
      mechanics.itemsDropped = droppedItems;
    }
    if (usedItems.length > 0) {
      mechanics.itemsUsed = usedItems;
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