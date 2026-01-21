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

// ============================================================================
// RANDOMIZED VOICE PROFILE SYSTEM (inline for edge function)
// ============================================================================

type SpeechRhythm = 'staccato' | 'flowing' | 'halting' | 'measured' | 'rapid-fire' | 'drawling' | 'clipped' | 'melodic' | 'monotone' | 'breathless';
type WordChoice = 'simple' | 'elaborate' | 'crude' | 'refined' | 'technical' | 'poetic' | 'slang-heavy' | 'archaic' | 'modern' | 'mixed';
type EmotionalExpression = 'restrained' | 'explosive' | 'subtle' | 'dramatic' | 'deadpan' | 'sincere' | 'guarded' | 'theatrical' | 'understated' | 'volatile';
type HumorStyle = 'dry' | 'dark' | 'slapstick' | 'witty' | 'sardonic' | 'none' | 'self-deprecating' | 'observational' | 'absurdist' | 'sarcastic';
type ConfidenceLevel = 'cocky' | 'assured' | 'uncertain' | 'humble' | 'arrogant' | 'defensive' | 'quiet' | 'boastful' | 'modest' | 'nervous';

interface VoiceProfile {
  rhythm: SpeechRhythm;
  wordChoice: WordChoice;
  emotionalExpression: EmotionalExpression;
  humorStyle: HumorStyle;
  confidenceLevel: ConfidenceLevel;
  averageSentenceLength: string;
  usesContractions: boolean;
  usesQuestions: boolean;
  usesExclamations: boolean;
  usesEllipses: boolean;
  signaturePhrase: string;
  verbalTic: string | null;
  exclamation: string;
  curse: string;
  greeting: string;
  farewell: string;
  nervousHabit: string;
  thinkingHabit: string;
  angryTell: string;
  lyingTell: string;
  accentHint: string | null;
}

const SIGNATURE_PHRASES = [
  "The way I see it...", "Here's the thing...", "Truth be told...", "Mark my words...",
  "Look...", "So here's the deal...", "Thing is...", "Okay but listen...",
  "If I may...", "One might observe...", "In my estimation...",
  "Word of advice?", "No lie...", "Real talk...", "Straight up...",
  "Situation is...", "Here's the intel...", "Bottom line...",
  "The patterns suggest...", "Not all is as it seems...", "Curious, isn't it...",
  "I've seen this before...", "Trust me on this...", "Same story, different day...",
  "I just feel like...", "Can I be honest?", "From the heart...",
];

const VERBAL_TICS = [
  "you know?", "right?", "see?", "get me?", "yeah?", "understand?",
  "like", "basically", "literally", "honestly", "actually", "obviously",
  "hmm", "mm", "eh", "ah", "well", "so", "now then",
  "if you ask me", "from what I gather", "or something", "and stuff",
];

const EXCLAMATIONS = [
  "Oh!", "Ah!", "Well!", "My!", "Goodness!", "Dear me!",
  "Damn!", "Hell!", "Blast!", "Fire and fury!", "By the gods!",
  "Stars above!", "Blood and ashes!", "Mother of mercy!",
  "Shit!", "Son of a—!", "What the—!", "For fuck's sake!",
];

const CURSES = [
  "Dammit.", "Blast it.", "Confound it.", "Curses.",
  "Son of a bitch.", "To hell with this.", "Bloody hell.",
  "Rot and ruin.", "Ash and cinders.", "Plague take it.",
  "This displeases me greatly.", "How... unfortunate.",
];

const GREETINGS = [
  "Hey.", "Hi there.", "Oh, it's you.", "What's up?", "Yo.",
  "Greetings.", "Good day.", "Salutations.", "Well met.", "A pleasure.",
  "There you are!", "Good to see you!", "Welcome!",
  "You.", "What do you want?", "...Yes?", "Hmm.",
];

const FAREWELLS = [
  "Later.", "See ya.", "Take care.", "Bye.", "Catch you around.",
  "Farewell.", "Until next time.", "Be well.", "Safe travels.",
  "Watch your back.", "Don't die.", "Try not to get killed.",
];

const NERVOUS_HABITS = [
  "fidgets with hands", "shifts weight constantly", "avoids eye contact",
  "speaks faster", "voice goes higher", "laughs nervously",
  "touches face repeatedly", "crosses and uncrosses arms", "looks around constantly",
  "picks at fingernails", "taps foot", "clears throat often",
];

const THINKING_HABITS = [
  "looks up and to the left", "closes eyes briefly", "steeples fingers",
  "taps chin", "furrows brow deeply", "mutters to self",
  "paces in small circles", "stares at a fixed point", "hums quietly",
];

const ANGRY_TELLS = [
  "voice drops dangerously low", "speaks through gritted teeth",
  "goes very still", "muscles tense visibly", "eyes narrow",
  "hands clench into fists", "nostrils flare", "jaw clenches",
  "speaks with forced calm", "words become clipped",
];

const LYING_TELLS = [
  "avoids eye contact", "touches nose", "speaks more formally",
  "adds unnecessary details", "repeats the question first", "pauses too long",
  "becomes overly defensive", "changes subject quickly",
];

const ACCENT_HINTS = [
  null, null, null,
  "rough, working-class inflection", "refined, educated pronunciation",
  "slight foreign lilt", "regional drawl", "clipped military precision",
  "musical, lilting quality", "gruff, gravelly undertone",
];

// Seeded random for consistent voice per character
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pickRandom<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)];
}

// Generate voice profile from character ID + traits
function generateVoiceProfile(characterId: string, traits: string[] = []): VoiceProfile {
  const seed = hashString(characterId);
  const random = seededRandom(seed);
  
  const rhythmPool: SpeechRhythm[] = ['staccato', 'flowing', 'halting', 'measured', 'rapid-fire', 'drawling', 'clipped', 'melodic', 'monotone', 'breathless'];
  const wordPool: WordChoice[] = ['simple', 'elaborate', 'crude', 'refined', 'technical', 'poetic', 'slang-heavy', 'archaic', 'modern', 'mixed'];
  const emotionPool: EmotionalExpression[] = ['restrained', 'explosive', 'subtle', 'dramatic', 'deadpan', 'sincere', 'guarded', 'theatrical', 'understated', 'volatile'];
  const humorPool: HumorStyle[] = ['dry', 'dark', 'slapstick', 'witty', 'sardonic', 'none', 'self-deprecating', 'observational', 'absurdist', 'sarcastic'];
  const confPool: ConfidenceLevel[] = ['cocky', 'assured', 'uncertain', 'humble', 'arrogant', 'defensive', 'quiet', 'boastful', 'modest', 'nervous'];
  const sentencePool = ['very-short', 'short', 'medium', 'long', 'varied'];

  let profile: VoiceProfile = {
    rhythm: pickRandom(rhythmPool, random),
    wordChoice: pickRandom(wordPool, random),
    emotionalExpression: pickRandom(emotionPool, random),
    humorStyle: pickRandom(humorPool, random),
    confidenceLevel: pickRandom(confPool, random),
    averageSentenceLength: pickRandom(sentencePool, random),
    usesContractions: random() > 0.4,
    usesQuestions: random() > 0.5,
    usesExclamations: random() > 0.6,
    usesEllipses: random() > 0.7,
    signaturePhrase: pickRandom(SIGNATURE_PHRASES, random),
    verbalTic: random() > 0.4 ? pickRandom(VERBAL_TICS, random) : null,
    exclamation: pickRandom(EXCLAMATIONS, random),
    curse: pickRandom(CURSES, random),
    greeting: pickRandom(GREETINGS, random),
    farewell: pickRandom(FAREWELLS, random),
    nervousHabit: pickRandom(NERVOUS_HABITS, random),
    thinkingHabit: pickRandom(THINKING_HABITS, random),
    angryTell: pickRandom(ANGRY_TELLS, random),
    lyingTell: pickRandom(LYING_TELLS, random),
    accentHint: pickRandom(ACCENT_HINTS, random),
  };

  // Trait-based modifications (every trait influences voice)
  for (const trait of traits) {
    const t = trait.toLowerCase();
    if (t === 'honorable' || t === 'loyal') { profile.usesContractions = false; profile.emotionalExpression = 'sincere'; }
    if (t === 'ruthless' || t === 'cruel') { profile.rhythm = 'clipped'; profile.emotionalExpression = 'restrained'; profile.humorStyle = 'dark'; }
    if (t === 'kind' || t === 'generous') { profile.humorStyle = 'self-deprecating'; profile.confidenceLevel = 'humble'; }
    if (t === 'brave') { profile.confidenceLevel = 'assured'; profile.rhythm = 'measured'; }
    if (t === 'cowardly') { profile.confidenceLevel = 'nervous'; profile.rhythm = 'halting'; profile.usesEllipses = true; }
    if (t === 'greedy') { profile.wordChoice = 'elaborate'; profile.rhythm = 'rapid-fire'; }
    if (t === 'romantic') { profile.wordChoice = 'poetic'; profile.rhythm = 'flowing'; profile.emotionalExpression = 'dramatic'; }
    if (t === 'pragmatic') { profile.wordChoice = 'simple'; profile.rhythm = 'clipped'; }
    if (t === 'spiritual') { profile.wordChoice = 'poetic'; profile.rhythm = 'measured'; }
    if (t === 'skeptical') { profile.humorStyle = 'dry'; profile.usesQuestions = true; }
    if (t === 'vengeful') { profile.emotionalExpression = 'restrained'; profile.confidenceLevel = 'quiet'; }
    if (t === 'ambitious') { profile.confidenceLevel = 'assured'; profile.rhythm = 'rapid-fire'; }
    if (t === 'humble') { profile.confidenceLevel = 'modest'; profile.wordChoice = 'simple'; }
    if (t === 'treacherous') { profile.emotionalExpression = 'guarded'; profile.wordChoice = 'elaborate'; }
    if (t === 'forgiving') { profile.emotionalExpression = 'sincere'; }
  }

  return profile;
}

// Mood speech modifiers
const MOOD_MODIFIERS: Record<string, { volumeHint: string; paceHint: string }> = {
  joyful: { volumeHint: 'slightly louder', paceHint: 'animated and quick' },
  content: { volumeHint: 'relaxed', paceHint: 'unhurried' },
  neutral: { volumeHint: 'normal', paceHint: 'steady' },
  annoyed: { volumeHint: 'terse', paceHint: 'curt and quick' },
  angry: { volumeHint: 'raised', paceHint: 'intense, controlled fury' },
  sad: { volumeHint: 'quiet', paceHint: 'slow, with pauses' },
  fearful: { volumeHint: 'hushed or erratic', paceHint: 'rushed, nervous' },
  disgusted: { volumeHint: 'sharp', paceHint: 'dismissive' },
  romantic: { volumeHint: 'soft', paceHint: 'gentle, lingering' },
  betrayed: { volumeHint: 'strained', paceHint: 'measured with emotion bleeding through' },
};

// Build comprehensive voice instructions for AI
function buildVoiceInstructions(profile: VoiceProfile, mood: string, name: string): string {
  const moodMod = MOOD_MODIFIERS[mood] || MOOD_MODIFIERS.neutral;
  
  return `## UNIQUE VOICE PROFILE FOR ${name.toUpperCase()}

**Speech Rhythm:** ${profile.rhythm} - Words come in a ${profile.rhythm} pattern
**Word Choice:** ${profile.wordChoice} - Uses ${profile.wordChoice} vocabulary
**Emotional Expression:** ${profile.emotionalExpression} - Emotions are ${profile.emotionalExpression}
**Humor Style:** ${profile.humorStyle === 'none' ? 'Rarely jokes' : `Uses ${profile.humorStyle} humor`}
**Confidence:** ${profile.confidenceLevel}

### SENTENCE CONSTRUCTION
- Average length: ${profile.averageSentenceLength}
- ${profile.usesContractions ? 'Uses contractions (can\'t, won\'t)' : 'Avoids contractions (cannot, will not)'}
- ${profile.usesQuestions ? 'Often phrases things as questions' : 'Prefers statements'}
- ${profile.usesExclamations ? 'Uses exclamation marks when emotional' : 'Rarely uses exclamation marks'}
- ${profile.usesEllipses ? 'Trails off with ellipses...' : 'Finishes thoughts completely'}

### SIGNATURE VERBAL ELEMENTS (USE THESE!)
**Signature phrase (use naturally):** "${profile.signaturePhrase}"
${profile.verbalTic ? `**Verbal tic:** Frequently says "${profile.verbalTic}"` : ''}
**When surprised:** "${profile.exclamation}"
**When frustrated:** "${profile.curse}"
**Greeting style:** "${profile.greeting}"
**Farewell style:** "${profile.farewell}"

### BEHAVIORAL TELLS (show through *action beats*)
**When nervous:** ${profile.nervousHabit}
**When thinking:** ${profile.thinkingHabit}
**When angry:** ${profile.angryTell}
**When lying:** ${profile.lyingTell}

${profile.accentHint ? `### VOICE QUALITY\n${profile.accentHint}` : ''}

### CURRENT MOOD EFFECTS
**Current mood:** ${mood}
**Voice quality:** ${moodMod.volumeHint}
**Speaking pace:** ${moodMod.paceHint}

### CRITICAL VOICE RULES
- This character should be recognizable by dialogue ALONE
- Use their signature phrase naturally (not every line, but regularly)
- Match their speech rhythm and sentence construction
- Show behavioral tells through *action beats*
- EVERY trait influences their word choice and tone
- Mood temporarily shifts their baseline voice`;
}

// ============================================================================

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
  triggerQuirk?: string;
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

    // Generate unique voice profile for this companion
    const voiceProfile = generateVoiceProfile(companion.id, companion.personality.traits);
    const voiceInstructions = buildVoiceInstructions(voiceProfile, companion.mood, companion.name);

    const systemPrompt = buildCompanionSystemPrompt(companion, genre, voiceInstructions);
    const userPrompt = buildDialoguePrompt(companion, situation, playerAction, recentEvents, location, timeOfDay, dialogueType, triggerQuirk, voiceProfile);

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
                    description: "The companion's spoken dialogue (1-3 sentences) using their unique voice profile" 
                  },
                  internalThought: { 
                    type: "string", 
                    description: "What the companion is thinking but not saying" 
                  },
                  physicalAction: { 
                    type: "string", 
                    description: "Optional physical action showing their behavioral tell (*action*)" 
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

function buildCompanionSystemPrompt(companion: CompanionState, genre?: string, voiceInstructions?: string): string {
  const traitDescriptions = companion.personality.traits.join(", ");
  const valueHighlights = Object.entries(companion.personality.values)
    .filter(([_, v]) => v > 60 || v < 30)
    .map(([k, v]) => `${k}: ${v > 60 ? 'high' : 'low'}`)
    .join(", ");

  return `You are ${companion.name}, a companion character in a ${genre || 'fantasy'} RPG.

${voiceInstructions || ''}

PERSONALITY:
- Core traits: ${traitDescriptions}
- Values: ${valueHighlights}
- Original speech pattern: ${companion.personality.speechPattern}
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
- USE YOUR UNIQUE VOICE PROFILE - signature phrases, verbal tics, sentence structure
- React authentically based on personality and current mood
- Show emotions through actions and tone, not just words
- Keep dialogue concise (1-3 sentences max)
- Include physical actions/gestures showing behavioral tells
- If mood shifts dramatically, reflect it in the response
- Every personality trait should influence HOW you speak
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
  triggerQuirk?: string,
  voiceProfile?: VoiceProfile
): string {
  let prompt = `SITUATION: ${situation}\n`;
  
  if (location) prompt += `LOCATION: ${location}\n`;
  if (timeOfDay) prompt += `TIME: ${timeOfDay}\n`;
  if (playerAction) prompt += `PLAYER ACTION: ${playerAction}\n`;
  if (recentEvents?.length) prompt += `RECENT EVENTS:\n${recentEvents.map(e => `- ${e}`).join('\n')}\n`;
  
  prompt += `\nDIALOGUE TYPE: ${dialogueType || 'ambient'}\n`;
  
  // Add voice reminders
  if (voiceProfile) {
    prompt += `\nVOICE REMINDER: Use "${voiceProfile.signaturePhrase}" naturally. Speak in ${voiceProfile.rhythm} rhythm with ${voiceProfile.averageSentenceLength} sentences. ${voiceProfile.verbalTic ? `Add "${voiceProfile.verbalTic}" as verbal tic.` : ''}\n`;
  }
  
  switch (dialogueType) {
    case 'reaction':
      prompt += `\nGenerate ${companion.name}'s reaction using their unique voice. Express approval or disapproval through their speaking style.`;
      break;
    case 'ambient':
      prompt += `\nGenerate ${companion.name}'s casual observation in their distinctive voice pattern.`;
      break;
    case 'event':
      prompt += `\nGenerate ${companion.name}'s response to an important story event. Let their personality shine through word choice.`;
      break;
    case 'romance':
      prompt += `\nGenerate ${companion.name}'s romantic dialogue. Use their emotional expression style (${voiceProfile?.emotionalExpression || 'sincere'}).`;
      break;
    case 'betrayal':
      prompt += `\nGenerate ${companion.name}'s reaction to betrayal. Show their angry tell: "${voiceProfile?.angryTell || 'goes very still'}".`;
      break;
    case 'farewell':
      prompt += `\nGenerate ${companion.name}'s farewell using their farewell style: "${voiceProfile?.farewell || 'Take care.'}".`;
      break;
    case 'quirk':
      const quirkToUse = triggerQuirk || companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];
      prompt += `\nGenerate ${companion.name}'s dialogue that naturally incorporates their personality quirk: "${quirkToUse}".
Show the quirk through *action beats* while speaking in their unique voice.`;
      break;
    default:
      prompt += `\nGenerate appropriate dialogue for ${companion.name} using their unique voice profile.`;
  }

  return prompt;
}

function generateFallbackDialogue(companion: CompanionState, dialogueType: string): string {
  // Generate voice profile for fallback too
  const profile = generateVoiceProfile(companion.id, companion.personality.traits);
  const quirk = companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];

  switch (dialogueType) {
    case 'reaction':
      if (companion.affinity > 30) {
        return `*nods approvingly* ${profile.signaturePhrase} I can work with that.`;
      } else if (companion.affinity < -20) {
        return `*${profile.nervousHabit || 'frowns'}* ${profile.verbalTic ? profile.verbalTic + ' ' : ''}I'm not sure about this...`;
      }
      return `*${profile.thinkingHabit || 'observes silently'}* ${profile.signaturePhrase}`;
    
    case 'ambient':
      return `*${quirk || profile.thinkingHabit}* ${profile.verbalTic ? profile.verbalTic.charAt(0).toUpperCase() + profile.verbalTic.slice(1) + '...' : 'Hmm...'}`;
    
    case 'quirk':
      return `*${quirk}* ${profile.signaturePhrase} Old habit.`;
    
    case 'romance':
      return `*${profile.emotionalExpression === 'guarded' ? 'hesitates' : 'glances warmly'}* There's... something I've been meaning to say.`;
    
    case 'betrayal':
      return `*${profile.angryTell}* I... I trusted you. ${profile.curse}`;
    
    case 'farewell':
      return `${profile.farewell} ${profile.verbalTic ? profile.verbalTic : ''}`;
    
    default:
      return `${profile.signaturePhrase} *${quirk || profile.thinkingHabit}*`;
  }
}

console.log("[generate-companion-dialogue] Edge function ready with randomized voice system");
