/**
 * NPC Background Chatter System
 * 
 * Creates ambient "crowd noise" that makes scenes feel alive without
 * NPCs jumping on the player every 6 seconds.
 * 
 * Core behaviors:
 * - NPCs generate ambient micro-moments between themselves
 * - Never interrupts player flow
 * - Never demands a response
 * - Can optionally leak tiny bits of world info (rarely)
 */

import type { NPC, GameState } from '@/types/game';

// ============================================================================
// TYPES & CONFIGURATION
// ============================================================================

export type ChatterFrequency = 'low' | 'medium' | 'high';

export type ChatterBeatType = 
  | 'npc_to_npc'      // Two NPCs talking
  | 'phone'           // NPC on phone/device
  | 'gesture'         // Non-verbal action
  | 'room_react'      // Reaction to environment
  | 'self_talk'       // Muttering to self
  | 'routine';        // Doing their job/task

export type ChatterTone = 
  | 'neutral' 
  | 'tense' 
  | 'funny' 
  | 'weary' 
  | 'secretive'
  | 'annoyed'
  | 'distracted'
  | 'nervous';

export type ChatterTopic = 
  | 'work'
  | 'local_rumor'
  | 'relationship'
  | 'weather'
  | 'money'
  | 'warning'
  | 'gossip'
  | 'complaint'
  | 'observation'
  | 'task'
  | 'memory'
  | 'food'
  | 'tech'
  | 'news';

export interface ChatterBeat {
  id: string;
  type: ChatterBeatType;
  tone: ChatterTone;
  topic: ChatterTopic;
  intensity: 1 | 2 | 3 | 4 | 5;  // Keep ambient at 1-2
  text: string;
  involvedNPCs: string[];
  timestamp: number;
  containsHook?: boolean;
  hookData?: {
    type: 'name' | 'place' | 'time' | 'object';
    value: string;
  };
}

export interface ChatterConfig {
  chatterFrequency: ChatterFrequency;
  playerPullOnly: boolean;
  
  // Turn-based cooldowns (in player actions)
  sceneCooldownActionsMin: number;
  sceneCooldownActionsMax: number;
  
  // Time-based cooldowns (in seconds)
  sceneCooldownSecondsMin: number;
  sceneCooldownSecondsMax: number;
  
  // Per-NPC cooldowns (in seconds)
  npcCooldownSecondsMin: number;
  npcCooldownSecondsMax: number;
  
  // Hook chances
  overheardHookChance: number;  // Low chance to drop a usable lead
  directToPlayerChance: number; // Forced 0 when playerPullOnly=true
  
  // Word limits
  minWords: number;
  maxWords: number;
  
  // Repetition control
  topicRepeatBlockTurns: number;
  beatRepeatBlockTurns: number;
  
  // Max ambient entries in feed
  maxFeedEntries: number;
  
  // Fade time for old entries (ms)
  feedFadeTime: number;
}

export const DEFAULT_CHATTER_CONFIG: ChatterConfig = {
  chatterFrequency: 'low',
  playerPullOnly: true,
  
  sceneCooldownActionsMin: 3,
  sceneCooldownActionsMax: 6,
  
  sceneCooldownSecondsMin: 45,
  sceneCooldownSecondsMax: 90,
  
  npcCooldownSecondsMin: 120,
  npcCooldownSecondsMax: 300,
  
  overheardHookChance: 0.08,
  directToPlayerChance: 0.0,
  
  minWords: 8,
  maxWords: 22,
  
  topicRepeatBlockTurns: 4,
  beatRepeatBlockTurns: 20,
  
  maxFeedEntries: 8,
  feedFadeTime: 30000,
};

// Frequency-based gate chances
const FREQUENCY_GATES: Record<ChatterFrequency, number> = {
  low: 0.35,
  medium: 0.65,
  high: 0.90,
};

// ============================================================================
// CHATTER BEAT TEMPLATES (Genre-Universal)
// ============================================================================

interface ChatterTemplate {
  type: ChatterBeatType;
  tone: ChatterTone;
  topic: ChatterTopic;
  intensity: 1 | 2;
  templates: string[];
  requiresMultipleNPCs: boolean;
  locationHints?: string[];
  timeHints?: ('morning' | 'afternoon' | 'evening' | 'night')[];
}

const CHATTER_TEMPLATES: ChatterTemplate[] = [
  // NPC to NPC conversations
  {
    type: 'npc_to_npc',
    tone: 'neutral',
    topic: 'work',
    intensity: 1,
    templates: [
      "Two {role}s discuss the day's schedule in hushed tones.",
      "{npc1} and {npc2} compare notes on yesterday's incident.",
      "A pair of workers debate who closed last night.",
      "{npc1} asks {npc2} to cover their shift, gets a reluctant nod.",
      "Two employees argue quietly about inventory counts.",
    ],
    requiresMultipleNPCs: true,
  },
  {
    type: 'npc_to_npc',
    tone: 'tense',
    topic: 'warning',
    intensity: 2,
    templates: [
      "{npc1} leans close to {npc2}, voice barely audible.",
      "Two figures exchange worried glances and fall silent.",
      "{npc1} grabs {npc2}'s arm, whispers something urgent.",
      "A hushed argument ends abruptly when someone walks by.",
      "Two workers stop talking the moment you get closer.",
    ],
    requiresMultipleNPCs: true,
  },
  {
    type: 'npc_to_npc',
    tone: 'funny',
    topic: 'gossip',
    intensity: 1,
    templates: [
      "{npc1} tells a joke; {npc2} snorts trying not to laugh.",
      "Two regulars share a knowing look and chuckle.",
      "Someone mimics the boss behind their back; stifled laughter follows.",
      "{npc1} and {npc2} share an exaggerated eye-roll.",
      "A burst of suppressed giggles from the corner booth.",
    ],
    requiresMultipleNPCs: true,
  },
  {
    type: 'npc_to_npc',
    tone: 'secretive',
    topic: 'local_rumor',
    intensity: 2,
    templates: [
      "Two regulars murmur about something 'seen behind {location}'.",
      "{npc1} slides something to {npc2} under the table.",
      "A whispered name passes between two figures, then silence.",
      "Two strangers exchange a look of recognition, then look away.",
      "{npc1} points at a map on their phone; {npc2} nods slowly.",
    ],
    requiresMultipleNPCs: true,
  },
  {
    type: 'npc_to_npc',
    tone: 'weary',
    topic: 'complaint',
    intensity: 1,
    templates: [
      "Two workers sigh in unison at a new announcement.",
      "{npc1} vents; {npc2} just nods, having heard it before.",
      "A tired exchange about hours, pay, and 'this place'.",
      "Someone complains about the weather; everyone agrees.",
      "{npc1} rubs their temples; {npc2} offers sympathy.",
    ],
    requiresMultipleNPCs: true,
  },
  
  // Phone/device interactions
  {
    type: 'phone',
    tone: 'neutral',
    topic: 'tech',
    intensity: 1,
    templates: [
      "Someone thumbs a text, smirks, and pockets their phone.",
      "{npc1} frowns at their screen, types furiously, then stops.",
      "A phone buzzes; the owner glances and ignores it.",
      "{npc1} takes a photo of something on the wall.",
      "Someone scrolls endlessly, occasionally huffing.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'phone',
    tone: 'tense',
    topic: 'news',
    intensity: 2,
    templates: [
      "{npc1} reads something, face going pale.",
      "A phone call ends abruptly; the caller looks shaken.",
      "Someone stares at their screen like they've seen a ghost.",
      "{npc1} shows their phone to {npc2}; both go quiet.",
      "An alert chimes; nearby people check their devices.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'phone',
    tone: 'annoyed',
    topic: 'relationship',
    intensity: 1,
    templates: [
      "{npc1} texts angrily, muttering under their breath.",
      "A call gets rejected; the rejector looks relieved.",
      "Someone types, deletes, types, deletes, gives up.",
      "{npc1} leaves a voicemail that sounds rehearsed.",
      "A phone rings persistently; the owner pretends not to hear.",
    ],
    requiresMultipleNPCs: false,
  },
  
  // Gestures and non-verbal
  {
    type: 'gesture',
    tone: 'neutral',
    topic: 'observation',
    intensity: 1,
    templates: [
      "Someone glances at you, then goes right back to their task.",
      "{npc1} stretches, yawns, and settles back into waiting.",
      "A subtle nod passes between two strangers.",
      "Someone checks the time, sighs, and keeps waiting.",
      "{npc1} waves to someone across the room.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'gesture',
    tone: 'nervous',
    topic: 'warning',
    intensity: 2,
    templates: [
      "{npc1} keeps glancing toward the door.",
      "Someone fidgets with their keys, alert to every sound.",
      "A figure in the corner tracks movement without moving.",
      "{npc1} touches their pocket repeatedly, reassuring themselves.",
      "Someone's leg bounces with barely contained tension.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'gesture',
    tone: 'distracted',
    topic: 'memory',
    intensity: 1,
    templates: [
      "{npc1} stares into middle distance, lost in thought.",
      "Someone traces patterns on the table absently.",
      "{npc1} mouths words to themselves, working something out.",
      "A faraway look crosses someone's face, then fades.",
      "Someone doodles in the margins of a newspaper.",
    ],
    requiresMultipleNPCs: false,
  },
  
  // Room reactions
  {
    type: 'room_react',
    tone: 'neutral',
    topic: 'observation',
    intensity: 1,
    templates: [
      "The background murmur shifts as someone new enters.",
      "A collective sigh as the music changes.",
      "Heads turn briefly toward a noise, then return.",
      "The room's rhythm adjusts to the hour.",
      "Someone opens a window; conversations drift in.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'room_react',
    tone: 'tense',
    topic: 'warning',
    intensity: 2,
    templates: [
      "Conversations pause as a siren wails outside.",
      "The room goes quiet at a loud noise, then slowly resumes.",
      "A power flicker; everyone looks up, then down.",
      "Someone's outburst draws stares before normalcy returns.",
      "The atmosphere shifts as new arrivals enter.",
    ],
    requiresMultipleNPCs: false,
  },
  
  // Self-talk
  {
    type: 'self_talk',
    tone: 'weary',
    topic: 'complaint',
    intensity: 1,
    templates: [
      "{npc1} mutters something about 'always the same'.",
      "A heavy sigh, followed by unintelligible grumbling.",
      "Someone counts under their breath, loses track, starts over.",
      "{npc1} shakes their head at nothing in particular.",
      "A quiet 'figures' escapes someone's lips.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'self_talk',
    tone: 'nervous',
    topic: 'task',
    intensity: 1,
    templates: [
      "{npc1} rehearses what they're going to say.",
      "Someone checks and rechecks their belongings.",
      "{npc1} mouths a list, touching fingers to count.",
      "A whispered pep talk, barely audible.",
      "Someone argues with themselves about a decision.",
    ],
    requiresMultipleNPCs: false,
  },
  
  // Routine actions
  {
    type: 'routine',
    tone: 'neutral',
    topic: 'task',
    intensity: 1,
    templates: [
      "{npc1} wipes down the counter for the hundredth time.",
      "Someone sorts through papers with practiced efficiency.",
      "{npc1} stocks shelves, humming tunelessly.",
      "A regular ritual plays out: check, adjust, move on.",
      "Someone makes their rounds, familiar with every step.",
    ],
    requiresMultipleNPCs: false,
  },
  {
    type: 'routine',
    tone: 'weary',
    topic: 'work',
    intensity: 1,
    templates: [
      "{npc1} goes through the motions, eyes elsewhere.",
      "The same task, the same way, the same tired hands.",
      "Someone cleans up a mess they've cleaned a hundred times.",
      "{npc1} performs their duty with mechanical precision.",
      "A rote action, done without thinking or caring.",
    ],
    requiresMultipleNPCs: false,
  },
  
  // Food-related
  {
    type: 'gesture',
    tone: 'neutral',
    topic: 'food',
    intensity: 1,
    templates: [
      "Someone unwraps a snack, careful not to make noise.",
      "{npc1} sips their drink, eyes wandering.",
      "A quick bite between tasks, barely chewed.",
      "Someone inspects their food with suspicion, then eats anyway.",
      "{npc1} shares a bite with {npc2}; old friends, clearly.",
    ],
    requiresMultipleNPCs: false,
  },
  
  // Money-related
  {
    type: 'npc_to_npc',
    tone: 'secretive',
    topic: 'money',
    intensity: 2,
    templates: [
      "Cash changes hands under the table, quick and quiet.",
      "{npc1} counts bills, shielding them from view.",
      "A debt gets settled with a handshake and a warning look.",
      "Someone palms something to {npc2}; neither acknowledge it.",
      "{npc1} slides an envelope across; {npc2} doesn't open it here.",
    ],
    requiresMultipleNPCs: true,
  },
];

// ============================================================================
// GENRE VARIABLE OVERLAYS
// ============================================================================

interface GenreChatterVariables {
  roleTerms: string[];
  locationTerms: string[];
  deviceTerms: string[];
  currencyTerms: string[];
  greetingTerms: string[];
  objectTerms: string[];
}

const GENRE_CHATTER_VARIABLES: Record<string, GenreChatterVariables> = {
  fantasy: {
    roleTerms: ['merchant', 'guard', 'scholar', 'pilgrim', 'healer', 'smith', 'courier', 'farmer'],
    locationTerms: ['the old ruins', 'the eastern gate', 'the temple', 'the market square', 'the forest edge'],
    deviceTerms: ['scroll', 'crystal', 'enchanted mirror', 'sending stone', 'rune tablet'],
    currencyTerms: ['coin', 'gold', 'silver', 'gemstone', 'trade goods'],
    greetingTerms: ['blessing', 'may the gods watch', 'safe travels', 'well met'],
    objectTerms: ['amulet', 'herb pouch', 'sealed letter', 'old map', 'mysterious key'],
  },
  scifi: {
    roleTerms: ['technician', 'pilot', 'engineer', 'security', 'medic', 'analyst', 'operative'],
    locationTerms: ['sector 7', 'the docking bay', 'level 3', 'the hub', 'the outer ring'],
    deviceTerms: ['datapad', 'comm unit', 'holodisplay', 'neural link', 'scanner'],
    currencyTerms: ['credits', 'crypto', 'ration chits', 'trade units'],
    greetingTerms: ['stay sharp', 'clear skies', 'patch in later', 'signal clear'],
    objectTerms: ['data chip', 'access card', 'sealed container', 'encrypted drive', 'bio-sample'],
  },
  noir: {
    roleTerms: ['barkeep', 'dealer', 'muscle', 'fixer', 'contact', 'informant', 'regular'],
    locationTerms: ['the back alley', 'pier 9', 'the old warehouse', 'downtown', 'the docks'],
    deviceTerms: ['phone', 'pager', 'radio', 'wire', 'recorder'],
    currencyTerms: ['cash', 'bills', 'marker', 'favor', 'IOUs'],
    greetingTerms: ['keep your head down', 'watch your back', 'stay clean', 'keep it quiet'],
    objectTerms: ['envelope', 'pistol', 'photo', 'key', 'ledger', 'package'],
  },
  horror: {
    roleTerms: ['local', 'stranger', 'caretaker', 'witness', 'survivor', 'believer', 'skeptic'],
    locationTerms: ['the old house', 'the basement', 'the woods', 'the cemetery', 'room 217'],
    deviceTerms: ['flashlight', 'radio', 'camera', 'recorder', 'phone'],
    currencyTerms: ['money', 'favors', 'protection', 'silence'],
    greetingTerms: ['be careful', 'don\'t go there', 'you shouldn\'t be here', 'it\'s not safe'],
    objectTerms: ['old photo', 'journal', 'key ring', 'strange symbol', 'warning sign'],
  },
  romance: {
    roleTerms: ['friend', 'coworker', 'neighbor', 'barista', 'artist', 'stranger', 'regular'],
    locationTerms: ['the café', 'the park', 'downtown', 'the gallery', 'the corner booth'],
    deviceTerms: ['phone', 'tablet', 'headphones', 'camera', 'notebook'],
    currencyTerms: ['coffee', 'drink', 'favor', 'promise', 'time'],
    greetingTerms: ['take care', 'see you around', 'call me', 'text me later'],
    objectTerms: ['note', 'gift', 'flower', 'photo', 'keepsake', 'letter'],
  },
  modern: {
    roleTerms: ['employee', 'customer', 'manager', 'delivery person', 'regular', 'passerby'],
    locationTerms: ['the break room', 'out back', 'the parking lot', 'across the street', 'upstairs'],
    deviceTerms: ['phone', 'laptop', 'tablet', 'earbuds', 'smartwatch'],
    currencyTerms: ['cash', 'card', 'Venmo', 'favor', 'IOUs'],
    greetingTerms: ['later', 'take it easy', 'catch you later', 'see ya'],
    objectTerms: ['package', 'USB drive', 'keycard', 'badge', 'folder', 'receipt'],
  },
  western: {
    roleTerms: ['rancher', 'sheriff', 'barkeep', 'drifter', 'merchant', 'outlaw', 'deputy'],
    locationTerms: ['the saloon', 'the stable', 'out past the ridge', 'the old mine', 'main street'],
    deviceTerms: ['telegram', 'letter', 'wanted poster', 'newspaper', 'map'],
    currencyTerms: ['dollars', 'gold', 'silver', 'deed', 'marker'],
    greetingTerms: ['ride safe', 'keep your iron close', 'watch the trail', 'good luck'],
    objectTerms: ['deed', 'pistol', 'locket', 'badge', 'wanted poster', 'gold nugget'],
  },
  cyberpunk: {
    roleTerms: ['runner', 'fixer', 'corp', 'hacker', 'dealer', 'merc', 'chrome doc'],
    locationTerms: ['the undercity', 'sector 5', 'the black market', 'the megablock', 'the strip'],
    deviceTerms: ['deck', 'burner', 'implant', 'drone', 'neural jack'],
    currencyTerms: ['eddies', 'crypto', 'favors', 'data', 'chrome'],
    greetingTerms: ['stay wired', 'ghost out', 'keep your head', 'don\'t flatline'],
    objectTerms: ['chip', 'shard', 'biometric key', 'prototype', 'black ICE', 'data spike'],
  },
  postapocalyptic: {
    roleTerms: ['scavenger', 'trader', 'survivor', 'guard', 'medic', 'scout', 'elder'],
    locationTerms: ['the wasteland', 'the bunker', 'old town', 'the trading post', 'the barrier'],
    deviceTerms: ['radio', 'geiger counter', 'solar charger', 'signal flare', 'old map'],
    currencyTerms: ['caps', 'rations', 'water', 'ammo', 'trade goods'],
    greetingTerms: ['stay safe', 'watch the rads', 'good hunting', 'don\'t trust outsiders'],
    objectTerms: ['water filter', 'med kit', 'ammo clip', 'old photo', 'key ring', 'map piece'],
  },
  steampunk: {
    roleTerms: ['engineer', 'inventor', 'airship crew', 'clockmaker', 'noble', 'mechanic', 'courier'],
    locationTerms: ['the workshop', 'the aerodrome', 'the factory', 'the parlor', 'the undercity'],
    deviceTerms: ['pocket watch', 'telegraph', 'pneumatic tube', 'brass communicator', 'aether scope'],
    currencyTerms: ['crowns', 'cogs', 'patents', 'shares', 'promissory notes'],
    greetingTerms: ['good fortune', 'steam be with you', 'fly safe', 'cogs turning'],
    objectTerms: ['blueprint', 'gear mechanism', 'aether crystal', 'brass key', 'sealed tube', 'clockwork piece'],
  },
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

interface ChatterState {
  config: ChatterConfig;
  sceneCooldownRemaining: number;  // Actions or seconds remaining
  npcCooldowns: Map<string, number>;  // NPC ID -> timestamp when available
  recentTopics: string[];  // For repetition blocking
  recentBeats: string[];   // Beat IDs for repetition blocking
  ambientFeed: ChatterBeat[];
  lastChatterTick: number;
  isTimeBased: boolean;  // true = use seconds, false = use actions
}

let chatterState: ChatterState = {
  config: { ...DEFAULT_CHATTER_CONFIG },
  sceneCooldownRemaining: 0,
  npcCooldowns: new Map(),
  recentTopics: [],
  recentBeats: [],
  ambientFeed: [],
  lastChatterTick: 0,
  isTimeBased: false,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBeatId(): string {
  return `chatter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getGenreVariables(genre?: string): GenreChatterVariables {
  if (genre && GENRE_CHATTER_VARIABLES[genre]) {
    return GENRE_CHATTER_VARIABLES[genre];
  }
  return GENRE_CHATTER_VARIABLES.modern;
}

// ============================================================================
// CORE SYSTEM FUNCTIONS
// ============================================================================

/**
 * Initialize or reset the chatter system
 */
export function initializeChatterSystem(config?: Partial<ChatterConfig>, isTimeBased: boolean = false): void {
  chatterState = {
    config: { ...DEFAULT_CHATTER_CONFIG, ...config },
    sceneCooldownRemaining: 0,
    npcCooldowns: new Map(),
    recentTopics: [],
    recentBeats: [],
    ambientFeed: [],
    lastChatterTick: Date.now(),
    isTimeBased,
  };
  
  // Force directToPlayerChance to 0 if playerPullOnly is true
  if (chatterState.config.playerPullOnly) {
    chatterState.config.directToPlayerChance = 0;
  }
  
  console.log('[ChatterSystem] Initialized with config:', chatterState.config);
}

/**
 * Update the chatter configuration
 */
export function updateChatterConfig(config: Partial<ChatterConfig>): void {
  chatterState.config = { ...chatterState.config, ...config };
  
  // Enforce playerPullOnly constraint
  if (chatterState.config.playerPullOnly) {
    chatterState.config.directToPlayerChance = 0;
  }
}

/**
 * Get frequency gate based on current setting
 */
function getFrequencyGate(): number {
  return FREQUENCY_GATES[chatterState.config.chatterFrequency];
}

/**
 * Check if scene cooldown has elapsed
 */
function isSceneCooldownReady(): boolean {
  return chatterState.sceneCooldownRemaining <= 0;
}

/**
 * Check if an NPC is available to chatter
 */
function isNPCAvailable(npcId: string): boolean {
  const cooldownEnd = chatterState.npcCooldowns.get(npcId);
  if (!cooldownEnd) return true;
  return Date.now() >= cooldownEnd;
}

/**
 * Set NPC cooldown after chattering
 */
function setNPCCooldown(npcId: string): void {
  const cooldownMs = randInt(
    chatterState.config.npcCooldownSecondsMin * 1000,
    chatterState.config.npcCooldownSecondsMax * 1000
  );
  chatterState.npcCooldowns.set(npcId, Date.now() + cooldownMs);
}

/**
 * Reset scene cooldown
 */
function resetSceneCooldown(): void {
  if (chatterState.isTimeBased) {
    chatterState.sceneCooldownRemaining = randInt(
      chatterState.config.sceneCooldownSecondsMin,
      chatterState.config.sceneCooldownSecondsMax
    );
  } else {
    chatterState.sceneCooldownRemaining = randInt(
      chatterState.config.sceneCooldownActionsMin,
      chatterState.config.sceneCooldownActionsMax
    );
  }
}

/**
 * Decrement scene cooldown (call after each player action if turn-based)
 */
export function decrementSceneCooldown(): void {
  if (!chatterState.isTimeBased && chatterState.sceneCooldownRemaining > 0) {
    chatterState.sceneCooldownRemaining--;
  }
}

/**
 * Update time-based cooldown (call with delta time in seconds)
 */
export function updateTimeCooldown(deltaSeconds: number): void {
  if (chatterState.isTimeBased && chatterState.sceneCooldownRemaining > 0) {
    chatterState.sceneCooldownRemaining -= deltaSeconds;
  }
}

/**
 * Check if a topic is blocked due to recent use
 */
function isTopicBlocked(topic: ChatterTopic): boolean {
  return chatterState.recentTopics.includes(topic);
}

/**
 * Add topic to recent list and maintain size
 */
function recordTopic(topic: ChatterTopic): void {
  chatterState.recentTopics.push(topic);
  while (chatterState.recentTopics.length > chatterState.config.topicRepeatBlockTurns) {
    chatterState.recentTopics.shift();
  }
}

/**
 * Check if a beat template is blocked
 */
function isBeatBlocked(templateIndex: number): boolean {
  return chatterState.recentBeats.includes(`template_${templateIndex}`);
}

/**
 * Record a beat template usage
 */
function recordBeat(templateIndex: number): void {
  chatterState.recentBeats.push(`template_${templateIndex}`);
  while (chatterState.recentBeats.length > chatterState.config.beatRepeatBlockTurns) {
    chatterState.recentBeats.shift();
  }
}

// ============================================================================
// NPC SELECTION LOGIC
// ============================================================================

interface NPCCluster {
  npcs: NPC[];
  location: string;
  canInteract: boolean;
}

/**
 * Build clusters of NPCs that could interact
 */
function buildNPCClusters(state: GameState): NPCCluster[] {
  const clusters: NPCCluster[] = [];
  const npcs = Object.values(state.npcs || {});
  
  // Group by location (use currentLocation or fallback)
  const byLocation = new Map<string, NPC[]>();
  for (const npc of npcs) {
    const loc = (npc as any).location || (npc as any).currentLocation || 'unknown';
    if (!byLocation.has(loc)) {
      byLocation.set(loc, []);
    }
    byLocation.get(loc)!.push(npc);
  }
  
  // Create clusters
  for (const [location, locationNPCs] of byLocation) {
    // Filter to available NPCs
    const availableNPCs = locationNPCs.filter(npc => isNPCAvailable(npc.id));
    
    if (availableNPCs.length > 0) {
      clusters.push({
        npcs: availableNPCs,
        location,
        canInteract: availableNPCs.length >= 2,
      });
    }
  }
  
  return clusters;
}

/**
 * Score an NPC pair for interaction likelihood
 */
function scoreNPCPair(npc1: NPC, npc2: NPC): number {
  let score = 1;
  
  // Prefer NPCs with existing relationship
  const relationships1 = Array.isArray(npc1.relationships) ? npc1.relationships : [];
  const relationships2 = Array.isArray(npc2.relationships) ? npc2.relationships : [];
  const hasRelationship = relationships1.some((r: any) => r.targetId === npc2.id) ||
                          relationships2.some((r: any) => r.targetId === npc1.id);
  if (hasRelationship) score += 2;
  
  // Prefer similar roles/occupations
  const role1 = (npc1 as any).role || (npc1 as any).occupation || '';
  const role2 = (npc2 as any).role || (npc2 as any).occupation || '';
  if (role1 && role1 === role2) score += 1;
  
  // Prefer NPCs with lower stress
  const mood1 = (npc1.emotionalState as any)?.currentMood || (npc1.emotionalState as any)?.mood || 'neutral';
  const mood2 = (npc2.emotionalState as any)?.currentMood || (npc2.emotionalState as any)?.mood || 'neutral';
  const stress1 = mood1 === 'stressed' || mood1 === 'anxious' ? 0.8 : 0.3;
  const stress2 = mood2 === 'stressed' || mood2 === 'anxious' ? 0.8 : 0.3;
  score += (1 - (stress1 + stress2) / 2);
  
  // Prefer NPCs who are idle
  const activity1 = (npc1 as any).currentActivity || '';
  const activity2 = (npc2 as any).currentActivity || '';
  if (!activity1 || activity1 === 'idle') score += 1;
  if (!activity2 || activity2 === 'idle') score += 1;
  
  return score;
}

/**
 * Select NPCs for a chatter beat
 */
function selectChatterNPCs(
  cluster: NPCCluster,
  requiresMultiple: boolean
): NPC[] {
  if (requiresMultiple && cluster.npcs.length < 2) {
    return [];
  }
  
  if (!requiresMultiple) {
    return [pickRandom(cluster.npcs)];
  }
  
  let bestPair: [NPC, NPC] | null = null;
  let bestScore = -1;
  
  for (let i = 0; i < cluster.npcs.length; i++) {
    for (let j = i + 1; j < cluster.npcs.length; j++) {
      const score = scoreNPCPair(cluster.npcs[i], cluster.npcs[j]);
      if (score > bestScore) {
        bestScore = score;
        bestPair = [cluster.npcs[i], cluster.npcs[j]];
      }
    }
  }
  
  return bestPair || [];
}

// ============================================================================
// BEAT GENERATION
// ============================================================================

/**
 * Select an appropriate template based on context
 */
function selectTemplate(
  cluster: NPCCluster,
  tensionLevel: number,
  genre?: string
): { template: ChatterTemplate; index: number } | null {
  // Filter templates by requirements
  const candidates = CHATTER_TEMPLATES
    .map((t, i) => ({ template: t, index: i }))
    .filter(({ template, index }) => {
      // Check NPC requirements
      if (template.requiresMultipleNPCs && cluster.npcs.length < 2) return false;
      
      // Check topic blocking
      if (isTopicBlocked(template.topic)) return false;
      
      // Check beat blocking
      if (isBeatBlocked(index)) return false;
      
      // Intensity check - higher tension allows higher intensity
      const maxIntensity = Math.min(2, 1 + Math.floor(tensionLevel / 2));
      if (template.intensity > maxIntensity) return false;
      
      return true;
    });
  
  if (candidates.length === 0) return null;
  
  // Weighted selection (prefer lower intensity for ambient)
  const weighted = candidates.map(c => ({
    ...c,
    weight: c.template.intensity === 1 ? 3 : 1,
  }));
  
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const candidate of weighted) {
    roll -= candidate.weight;
    if (roll <= 0) {
      return { template: candidate.template, index: candidate.index };
    }
  }
  
  return weighted[0];
}

/**
 * Fill template variables with actual values
 */
function fillTemplate(
  template: string,
  npcs: NPC[],
  genre?: string,
  location?: string
): string {
  const vars = getGenreVariables(genre);
  let result = template;
  
  // Replace NPC names (use identity or fallback)
  if (npcs[0]) {
    const name1 = (npcs[0].identity as any)?.name || (npcs[0] as any).name || 'Someone';
    result = result.replace(/{npc1}/g, name1);
  }
  if (npcs[1]) {
    const name2 = (npcs[1].identity as any)?.name || (npcs[1] as any).name || 'another person';
    result = result.replace(/{npc2}/g, name2);
  }
  
  // Replace role terms
  result = result.replace(/{role}/g, pickRandom(vars.roleTerms));
  
  // Replace location terms
  result = result.replace(/{location}/g, location || pickRandom(vars.locationTerms));
  
  // Replace device terms
  result = result.replace(/{device}/g, pickRandom(vars.deviceTerms));
  
  // Replace currency terms
  result = result.replace(/{currency}/g, pickRandom(vars.currencyTerms));
  
  // Replace object terms
  result = result.replace(/{object}/g, pickRandom(vars.objectTerms));
  
  return result;
}

/**
 * Generate a hook (rare breadcrumb of useful info)
 */
function generateHook(genre?: string): { type: 'name' | 'place' | 'time' | 'object'; value: string } | null {
  if (Math.random() > chatterState.config.overheardHookChance) {
    return null;
  }
  
  const vars = getGenreVariables(genre);
  const hookType = pickRandom(['name', 'place', 'time', 'object'] as const);
  
  switch (hookType) {
    case 'name':
      return { type: 'name', value: `"${pickRandom(['Marcus', 'Elena', 'The Old Man', 'Red', 'Doc'])}"` };
    case 'place':
      return { type: 'place', value: pickRandom(vars.locationTerms) };
    case 'time':
      return { type: 'time', value: pickRandom(['midnight', 'dawn', 'Tuesday', 'the 15th', 'next week']) };
    case 'object':
      return { type: 'object', value: pickRandom(vars.objectTerms) };
  }
}

/**
 * Generate a complete chatter beat
 */
function generateChatterBeat(
  state: GameState,
  cluster: NPCCluster
): ChatterBeat | null {
  const tensionLevel = (state as any).tensionLevel || (state as any).tension || 0;
  const genre = (state as any).genre || (state as any).gameGenre;
  
  // Select template
  const selection = selectTemplate(cluster, tensionLevel, genre);
  if (!selection) return null;
  
  const { template, index } = selection;
  
  // Select NPCs
  const selectedNPCs = selectChatterNPCs(cluster, template.requiresMultipleNPCs);
  if (selectedNPCs.length === 0) return null;
  
  // Pick a template string
  const templateString = pickRandom(template.templates);
  
  // Fill the template
  const text = fillTemplate(templateString, selectedNPCs, genre, cluster.location);
  
  // Check word count
  const wordCount = text.split(/\s+/).length;
  if (wordCount < chatterState.config.minWords || wordCount > chatterState.config.maxWords) {
    // Try to adjust - for now, just accept it
  }
  
  // Generate potential hook
  const hook = generateHook(genre);
  
  // Record usage
  recordTopic(template.topic);
  recordBeat(index);
  
  // Set NPC cooldowns
  for (const npc of selectedNPCs) {
    setNPCCooldown(npc.id);
  }
  
  return {
    id: generateBeatId(),
    type: template.type,
    tone: template.tone,
    topic: template.topic,
    intensity: template.intensity as 1 | 2,
    text,
    involvedNPCs: selectedNPCs.map(n => n.id),
    timestamp: Date.now(),
    containsHook: !!hook,
    hookData: hook || undefined,
  };
}

// ============================================================================
// MAIN API
// ============================================================================

export interface ChatterResult {
  emitted: boolean;
  beat?: ChatterBeat;
  reason?: string;
}

/**
 * Main function to potentially emit ambient chatter
 * Call this after each player action (turn-based) or on a timer (real-time)
 */
export function maybeEmitAmbientChatter(
  state: GameState,
  options?: {
    forceEmit?: boolean;
    modalOpen?: boolean;
  }
): ChatterResult {
  // Never interrupt if modal is open
  if (options?.modalOpen) {
    return { emitted: false, reason: 'modal_open' };
  }
  
  // Check scene cooldown (unless forced)
  if (!options?.forceEmit && !isSceneCooldownReady()) {
    return { emitted: false, reason: 'cooldown' };
  }
  
  // Roll against frequency gate (unless forced)
  if (!options?.forceEmit) {
    const roll = Math.random();
    if (roll > getFrequencyGate()) {
      return { emitted: false, reason: 'frequency_gate' };
    }
  }
  
  // Build NPC clusters
  const clusters = buildNPCClusters(state);
  if (clusters.length === 0) {
    return { emitted: false, reason: 'no_npcs' };
  }
  
  // Try to generate a beat from each cluster until one succeeds
  const playerLocation = (state as any).currentLocation || (state.player as any)?.location;
  for (const cluster of clusters) {
    // Skip if location doesn't match player's current location (for relevance)
    if (playerLocation && cluster.location !== playerLocation) {
      continue;
    }
    
    const beat = generateChatterBeat(state, cluster);
    if (beat) {
      // Add to ambient feed
      chatterState.ambientFeed.push(beat);
      
      // Trim feed if needed
      while (chatterState.ambientFeed.length > chatterState.config.maxFeedEntries) {
        chatterState.ambientFeed.shift();
      }
      
      // Reset cooldown
      resetSceneCooldown();
      
      return { emitted: true, beat };
    }
  }
  
  return { emitted: false, reason: 'no_valid_beat' };
}

/**
 * Get the current ambient feed
 */
export function getAmbientFeed(): ChatterBeat[] {
  // Filter out old entries
  const now = Date.now();
  const fadeTime = chatterState.config.feedFadeTime;
  
  return chatterState.ambientFeed.filter(beat => 
    now - beat.timestamp < fadeTime
  );
}

/**
 * Clear the ambient feed
 */
export function clearAmbientFeed(): void {
  chatterState.ambientFeed = [];
}

/**
 * Get the current chatter configuration
 */
export function getChatterConfig(): ChatterConfig {
  return { ...chatterState.config };
}

/**
 * Get chatter system stats for debugging
 */
export function getChatterStats(): {
  cooldownRemaining: number;
  npcCooldowns: number;
  recentTopics: string[];
  feedSize: number;
  isTimeBased: boolean;
} {
  return {
    cooldownRemaining: chatterState.sceneCooldownRemaining,
    npcCooldowns: chatterState.npcCooldowns.size,
    recentTopics: [...chatterState.recentTopics],
    feedSize: chatterState.ambientFeed.length,
    isTimeBased: chatterState.isTimeBased,
  };
}

// ============================================================================
// PLAYER-TRIGGERED ENGAGEMENT
// ============================================================================

export interface EngagementContext {
  nearestNPC: NPC | null;
  recentBeats: ChatterBeat[];
  suggestedOpener: string | null;
}

/**
 * When player wants to engage, get context from recent chatter
 */
export function getEngagementContext(
  state: GameState,
  playerLocation: string
): EngagementContext {
  // Find nearest NPC
  const npcsAtLocation = Object.values(state.npcs || {})
    .filter(npc => ((npc as any).location || (npc as any).currentLocation) === playerLocation);
  
  const nearestNPC = npcsAtLocation[0] || null;
  
  // Get recent beats involving this NPC or location
  const recentBeats = chatterState.ambientFeed
    .filter(beat => 
      beat.involvedNPCs.includes(nearestNPC?.id || '') ||
      beat.timestamp > Date.now() - 60000
    )
    .slice(-3);
  
  // Generate a suggested opener based on recent chatter
  let suggestedOpener: string | null = null;
  if (recentBeats.length > 0 && nearestNPC) {
    const npcName = (nearestNPC.identity as any)?.name || (nearestNPC as any).name || 'They';
    const lastBeat = recentBeats[recentBeats.length - 1];
    if (lastBeat.involvedNPCs.includes(nearestNPC.id)) {
      suggestedOpener = `${npcName} looks up from what they were doing.`;
    } else {
      suggestedOpener = `${npcName} pauses, aware of your approach.`;
    }
  }
  
  return {
    nearestNPC,
    recentBeats,
    suggestedOpener,
  };
}

// ============================================================================
// LLM PROMPT GENERATION
// ============================================================================

/**
 * Generate a prompt for LLM-based chatter generation
 */
export function generateChatterPrompt(context: {
  location: string;
  npcs: Array<{ name: string; role: string; mood: string; relationships?: string[] }>;
  tensionLevel: number;
  playerPullOnly: boolean;
  genre?: string;
}): string {
  const { location, npcs, tensionLevel, playerPullOnly, genre } = context;
  
  const npcContext = npcs.map(npc => 
    `- ${npc.name} (${npc.role}, mood: ${npc.mood}${npc.relationships?.length ? `, knows: ${npc.relationships.join(', ')}` : ''})`
  ).join('\n');
  
  return `SYSTEM / DEVELOPER STYLE RULES
Output exactly ONE ambient line.
Must be non-interrupting: no questions to player, no direct address.
${playerPullOnly ? 'If playerPullOnly=true, NPCs may notice player but cannot engage them.' : ''}
Keep it 8–22 words, grounded, routine-linked.
Genre: ${genre || 'modern'}

INPUT
Location: ${location}
NPCs present:
${npcContext}
Current tension level (0–5): ${tensionLevel}
Allowed types: npc_to_npc, phone, gesture, room_react
Allowed tones: neutral, tense, funny, weary, secretive

OUTPUT
A single line of ambient text.`;
}

// ============================================================================
// INTEGRATION HOOKS
// ============================================================================

/**
 * Hook to call after each player action (for turn-based games)
 */
export function onPlayerAction(state: GameState): ChatterResult {
  decrementSceneCooldown();
  return maybeEmitAmbientChatter(state);
}

/**
 * Hook to call on game tick (for real-time games)
 */
export function onGameTick(state: GameState, deltaSeconds: number): ChatterResult {
  updateTimeCooldown(deltaSeconds);
  return maybeEmitAmbientChatter(state);
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).chatterSystem = {
    initializeChatterSystem,
    updateChatterConfig,
    maybeEmitAmbientChatter,
    getAmbientFeed,
    clearAmbientFeed,
    getChatterConfig,
    getChatterStats,
    getEngagementContext,
    generateChatterPrompt,
    onPlayerAction,
    onGameTick,
    CHATTER_TEMPLATES,
    GENRE_CHATTER_VARIABLES,
  };
}
