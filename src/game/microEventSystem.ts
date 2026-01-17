// Micro-Event System - Small interruptions that make the world feel alive
// "A stranger hands you a note meant for someone else"

export type MicroEventCategory =
  | 'social'        // Stranger interaction, recognition, small talk
  | 'environmental' // Weather, noise, smell, atmosphere shifts
  | 'equipment'     // Item issues, discoveries, wear
  | 'npc_mood'      // NPC behavior changes, mysterious moods
  | 'omen'          // Foreshadowing, subtle warnings
  | 'memory'        // Flashbacks, deja vu, recognition
  | 'body'          // Hunger, fatigue, injury reminder
  | 'rumor';        // Overheard conversation, whispered name

export interface MicroEvent {
  id: string;
  category: MicroEventCategory;
  description: string;
  weight: number;           // Probability weight (higher = more common)
  conditions?: {
    timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[];
    minTurns?: number;      // Minimum turns into game
    requiresNPCsPresent?: boolean;
    requiresPublicSpace?: boolean;
    requiresPrivateSpace?: boolean;
    notDuringCombat?: boolean;
    playerReputationMin?: number;
    playerReputationMax?: number;
  };
  followUp?: string;        // Potential narrative hook
}

// Pre-defined micro-event templates
export const MICRO_EVENT_TEMPLATES: MicroEvent[] = [
  // SOCIAL - Stranger interactions
  {
    id: 'wrong_note',
    category: 'social',
    description: 'A hurrying stranger presses a folded note into your hand. "For Marcus—" they whisper, then freeze. "You\'re not Marcus." They snatch it back and vanish into the crowd.',
    weight: 2,
    conditions: { requiresPublicSpace: true, notDuringCombat: true },
    followUp: 'Who is Marcus? What was in that note?'
  },
  {
    id: 'child_recognizes',
    category: 'social',
    description: 'A child tugs at their parent\'s sleeve, pointing at you. "That\'s the one from the story!" The parent hushes them quickly, pulling them away without making eye contact.',
    weight: 2,
    conditions: { requiresPublicSpace: true, minTurns: 20, playerReputationMin: 20 },
    followUp: 'What story? What have people been saying?'
  },
  {
    id: 'mistaken_identity',
    category: 'social',
    description: 'Someone calls out a name that isn\'t yours, then waves apologetically. "Sorry, you look just like someone I used to know." Their smile doesn\'t reach their eyes.',
    weight: 3,
    conditions: { requiresPublicSpace: true, notDuringCombat: true }
  },
  {
    id: 'knowing_nod',
    category: 'social',
    description: 'A stranger across the room catches your eye and gives a slow, deliberate nod. When you look again, they\'re gone.',
    weight: 2,
    conditions: { requiresPublicSpace: true }
  },
  {
    id: 'old_debt',
    category: 'social',
    description: 'Someone you\'ve never seen before buys your drink. "Consider it repaid," they say, and leave before you can ask what they mean.',
    weight: 1,
    conditions: { requiresPublicSpace: true, minTurns: 30 },
    followUp: 'Who was that? What debt?'
  },

  // ENVIRONMENTAL - World atmosphere
  {
    id: 'sudden_silence',
    category: 'environmental',
    description: 'For just a moment, everything goes quiet. The ambient noise of the world holds its breath. Then continues, as if nothing happened.',
    weight: 3,
    conditions: { notDuringCombat: true }
  },
  {
    id: 'familiar_smell',
    category: 'environmental',
    description: 'A scent drifts past—something achingly familiar that you can\'t quite place. It\'s gone before you can identify it.',
    weight: 4,
    conditions: { notDuringCombat: true }
  },
  {
    id: 'temperature_drop',
    category: 'environmental',
    description: 'The temperature drops suddenly, just for an instant. No one else seems to notice.',
    weight: 3
  },
  {
    id: 'wrong_shadow',
    category: 'environmental',
    description: 'Your shadow moves wrong—just for a second—like it had somewhere else to be.',
    weight: 1,
    conditions: { timeOfDay: ['afternoon', 'evening'] }
  },
  {
    id: 'distant_sound',
    category: 'environmental',
    description: 'A sound in the distance that shouldn\'t be there. Music, maybe, or a voice. It stops when you try to listen.',
    weight: 3
  },

  // EQUIPMENT - Item issues
  {
    id: 'weapon_jams',
    category: 'equipment',
    description: 'Your weapon catches on something—a strap, a pocket, the fabric of the world. Nothing\'s wrong when you check.',
    weight: 2,
    conditions: { notDuringCombat: true }
  },
  {
    id: 'pocket_discovery',
    category: 'equipment',
    description: 'Your fingers find something in your pocket you don\'t remember putting there. A coin from somewhere you\'ve never been.',
    weight: 1,
    conditions: { minTurns: 10 },
    followUp: 'How did this get here? Where is it from?'
  },
  {
    id: 'item_warm',
    category: 'equipment',
    description: 'Something in your pack is warm. Not hot—just warm, like it remembers being held.',
    weight: 2
  },
  {
    id: 'string_loose',
    category: 'equipment',
    description: 'A thread comes loose from your clothing. You tug it, and more unravels than should.',
    weight: 3,
    conditions: { notDuringCombat: true }
  },

  // NPC MOOD - Mysterious behavior
  {
    id: 'friend_distant',
    category: 'npc_mood',
    description: 'Someone you know is quieter than usual. They say nothing\'s wrong. They\'re clearly lying.',
    weight: 2,
    conditions: { requiresNPCsPresent: true, minTurns: 15 },
    followUp: 'What\'s bothering them? Will they tell you?'
  },
  {
    id: 'npc_flinches',
    category: 'npc_mood',
    description: 'Someone nearby flinches at your approach, then covers it with a too-bright smile.',
    weight: 2,
    conditions: { requiresNPCsPresent: true }
  },
  {
    id: 'stopped_conversation',
    category: 'npc_mood',
    description: 'A conversation stops when you walk in. People suddenly find other things to look at.',
    weight: 2,
    conditions: { requiresPublicSpace: true, minTurns: 25, playerReputationMin: 15 }
  },
  {
    id: 'npc_watching',
    category: 'npc_mood',
    description: 'You catch someone watching you. They look away quickly, but their expression lingers—curiosity? Fear?',
    weight: 3,
    conditions: { requiresPublicSpace: true }
  },

  // OMEN - Foreshadowing
  {
    id: 'bird_omen',
    category: 'omen',
    description: 'A bird lands nearby and stares at you with unsettling intelligence. It leaves before you can look away.',
    weight: 2,
    conditions: { notDuringCombat: true }
  },
  {
    id: 'broken_mirror',
    category: 'omen',
    description: 'You pass a cracked mirror. For just a moment, your reflection moves differently than you do.',
    weight: 1
  },
  {
    id: 'bad_feeling',
    category: 'omen',
    description: 'A cold certainty settles in your stomach. Something is about to go wrong. You don\'t know what.',
    weight: 2,
    followUp: 'Trust your instincts?'
  },
  {
    id: 'bell_tolls',
    category: 'omen',
    description: 'A bell tolls in the distance—one you\'ve never heard before. It sounds like a warning.',
    weight: 2
  },

  // MEMORY - Recognition, flashbacks
  {
    id: 'deja_vu',
    category: 'memory',
    description: 'This moment feels familiar. Like you\'ve stood here before, said these words, made this choice.',
    weight: 2,
    conditions: { minTurns: 20 }
  },
  {
    id: 'smell_memory',
    category: 'memory',
    description: 'A smell triggers something—a fragment of memory you can\'t quite grasp. It slips away like water.',
    weight: 3
  },
  {
    id: 'forgotten_promise',
    category: 'memory',
    description: 'You suddenly remember something you promised to do. You can\'t remember who you promised.',
    weight: 1,
    conditions: { minTurns: 30 },
    followUp: 'What was the promise? Who was it to?'
  },

  // BODY - Physical reminders
  {
    id: 'old_scar_aches',
    category: 'body',
    description: 'An old scar aches—the kind of ache that comes with weather, or warnings.',
    weight: 3
  },
  {
    id: 'sudden_hunger',
    category: 'body',
    description: 'Hunger hits suddenly, intensely, like your body forgot to tell you it was starving.',
    weight: 2
  },
  {
    id: 'hand_trembles',
    category: 'body',
    description: 'Your hand trembles for just a moment. Fatigue, probably. Probably.',
    weight: 2,
    conditions: { minTurns: 25 }
  },

  // RUMOR - Overheard information
  {
    id: 'name_spoken',
    category: 'rumor',
    description: 'You hear your name spoken somewhere behind you. When you turn, no one is looking your way.',
    weight: 2,
    conditions: { requiresPublicSpace: true, minTurns: 20 }
  },
  {
    id: 'overheard_warning',
    category: 'rumor',
    description: '"—wouldn\'t go that way if I were—" The conversation moves out of earshot before you catch the rest.',
    weight: 2,
    conditions: { requiresPublicSpace: true }
  },
  {
    id: 'whispered_price',
    category: 'rumor',
    description: 'Someone mentions a price on someone\'s head. The number is high. Too high for anyone you know.',
    weight: 1,
    conditions: { requiresPublicSpace: true, minTurns: 30 },
    followUp: 'Whose price? Who\'s paying?'
  }
];

// Check if conditions are met for a micro-event
export function checkMicroEventConditions(
  event: MicroEvent,
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    currentTurn: number;
    npcsPresent: boolean;
    isPublicSpace: boolean;
    isInCombat: boolean;
    playerReputation: number;
  }
): boolean {
  const { conditions } = event;
  if (!conditions) return true;

  if (conditions.timeOfDay && !conditions.timeOfDay.includes(context.timeOfDay)) return false;
  if (conditions.minTurns && context.currentTurn < conditions.minTurns) return false;
  if (conditions.requiresNPCsPresent && !context.npcsPresent) return false;
  if (conditions.requiresPublicSpace && !context.isPublicSpace) return false;
  if (conditions.requiresPrivateSpace && context.isPublicSpace) return false;
  if (conditions.notDuringCombat && context.isInCombat) return false;
  if (conditions.playerReputationMin && context.playerReputation < conditions.playerReputationMin) return false;
  if (conditions.playerReputationMax && context.playerReputation > conditions.playerReputationMax) return false;

  return true;
}

// Select a random micro-event based on context
export function selectMicroEvent(
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    currentTurn: number;
    npcsPresent: boolean;
    isPublicSpace: boolean;
    isInCombat: boolean;
    playerReputation: number;
  },
  excludeIds: string[] = []
): MicroEvent | null {
  const eligible = MICRO_EVENT_TEMPLATES.filter(
    e => !excludeIds.includes(e.id) && checkMicroEventConditions(e, context)
  );

  if (eligible.length === 0) return null;

  // Weighted random selection
  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of eligible) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return eligible[0];
}

// Should a micro-event trigger this turn?
// Added rate limiting to prevent spam
const MICRO_EVENT_COOLDOWN = 3; // Minimum turns between micro-events
const MAX_MICRO_EVENTS_PER_SESSION = 100; // Limit total per session
let microEventCount = 0;

export function shouldTriggerMicroEvent(
  turnsSinceLastMicroEvent: number,
  worldPressureLevel: number = 50
): boolean {
  // Enforce cooldown
  if (turnsSinceLastMicroEvent < MICRO_EVENT_COOLDOWN) {
    return false;
  }
  
  // Limit total per session to prevent memory issues
  if (microEventCount >= MAX_MICRO_EVENTS_PER_SESSION) {
    return false;
  }
  
  // Base chance increases over time, modified by world pressure
  const baseChance = Math.min(0.15, turnsSinceLastMicroEvent * 0.02);
  const pressureModifier = worldPressureLevel > 70 ? 1.5 : worldPressureLevel < 30 ? 0.7 : 1.0;
  const shouldTrigger = Math.random() < baseChance * pressureModifier;
  
  if (shouldTrigger) {
    microEventCount++;
  }
  
  return shouldTrigger;
}

// Reset micro-event count (call on new game/session)
export function resetMicroEventCount(): void {
  microEventCount = 0;
}

// Build micro-event context for AI
export function buildMicroEventContext(event: MicroEvent | null): string {
  if (!event) return '';

  return `## MICRO-EVENT (MUST INCLUDE)
The following small interruption MUST be woven into your response naturally:

"${event.description}"

${event.followUp ? `*Narrative hook: ${event.followUp}*` : ''}

RULES:
- Include this moment organically, not as an announcement
- Let it feel like a natural part of the scene
- The player notices but may choose to ignore or investigate
- These moments make the world feel alive and full
- Don't over-explain—let the mystery breathe`;
}
