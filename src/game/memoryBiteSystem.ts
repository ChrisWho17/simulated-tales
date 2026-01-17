// ============================================================================
// THE UNTOLD STORY ENGINE - Memory Bite System
// Tiny continuity flags that hit hard. Small moments create big payoff.
// ============================================================================

export type MemoryBiteType = 
  // Debt/obligation
  | 'owes_you'
  | 'you_owe_them'
  | 'saved_your_life'
  | 'you_saved_their_life'
  | 'broke_promise'
  | 'kept_promise'
  
  // Shame/humiliation
  | 'you_embarrassed_them'
  | 'they_embarrassed_you'
  | 'witnessed_your_shame'
  | 'you_witnessed_their_shame'
  | 'saw_you_cry'
  | 'saw_you_beg'
  
  // Violence/harm
  | 'saw_you_bleed'
  | 'you_hurt_them'
  | 'they_hurt_you'
  | 'saw_you_kill'
  | 'you_spared_them'
  | 'they_spared_you'
  
  // Intimacy/vulnerability
  | 'heard_you_pray'
  | 'shared_meal'
  | 'shared_secret'
  | 'they_confided'
  | 'saw_you_sleep'
  | 'touched_wound'
  
  // Crime/trust
  | 'caught_you_stealing'
  | 'you_caught_them_stealing'
  | 'lied_to_them'
  | 'they_lied_to_you'
  | 'covered_for_you'
  | 'you_covered_for_them'
  
  // Loss/grief
  | 'mourned_together'
  | 'witnessed_their_loss'
  | 'they_witnessed_your_loss'
  | 'failed_to_save'
  | 'saved_their_friend'
  | 'killed_their_friend'
  
  // Power dynamics
  | 'gave_order'
  | 'followed_order'
  | 'refused_order'
  | 'knelt_to_you'
  | 'you_knelt_to_them'
  | 'challenged_authority';

export interface MemoryBite {
  id: string;
  type: MemoryBiteType;
  npcId: string;
  npcName: string;
  context: string;        // Brief description of what happened
  timestamp: number;
  gameTick: number;
  location?: string;
  emotionalWeight: number; // 1-10, how impactful
  surfaced: boolean;       // Has this been referenced in narrative yet?
  surfaceCount: number;    // How many times has it been referenced
}

export interface MemoryBiteStore {
  bites: MemoryBite[];
  lastUpdate: number;
}

// ============================================================================
// NARRATIVE TEMPLATES
// ============================================================================

/**
 * Templates for surfacing memories in narrative
 * These are the "hits hard" moments that make players melt
 */
const SURFACE_TEMPLATES: Record<MemoryBiteType, string[]> = {
  owes_you: [
    'Their eyes carry the weight of an unpaid debt.',
    'You see them calculating what they owe.',
    'The balance between you remains unsettled.',
  ],
  you_owe_them: [
    'Their gaze reminds you of what you haven\'t repaid.',
    'The debt hangs between you, unspoken but present.',
    'You owe them. They haven\'t forgotten.',
  ],
  saved_your_life: [
    'You\'re only here because of them. You both know it.',
    'The life they gave back to you pulses in your veins.',
    'Every breath is a reminder of their mercy.',
  ],
  you_saved_their_life: [
    'They\'re alive because of you. That changes things.',
    'A life saved creates a bond that can\'t be undone.',
    'They look at you the way the rescued look at rescuers.',
  ],
  broke_promise: [
    'The broken promise sits between you like shattered glass.',
    'Your word, once given, now means nothing to them.',
    'They remember when you said you would. And didn\'t.',
  ],
  kept_promise: [
    'They remember that you kept your word. That matters.',
    'In a world of broken promises, you kept yours.',
    'Your word proved true. They won\'t forget that.',
  ],
  
  you_embarrassed_them: [
    'The humiliation you caused still burns in their eyes.',
    'Pride is slow to heal. Yours wounded theirs deeply.',
    'They haven\'t forgotten being made small.',
  ],
  they_embarrassed_you: [
    'The shame they caused echoes in this moment.',
    'You remember feeling small. They made you feel that way.',
    'Some wounds don\'t show on the skin.',
  ],
  witnessed_your_shame: [
    'They saw you at your lowest. That knowledge sits between you.',
    'Their eyes hold a memory you wish they didn\'t have.',
    'They know what you\'d rather forget.',
  ],
  you_witnessed_their_shame: [
    'You saw them broken. They know you remember.',
    'Some things, once seen, can\'t be unseen. You both know this.',
    'The vulnerability you witnessed shapes everything now.',
  ],
  saw_you_cry: [
    'They saw your tears. In their gaze, you see that memory.',
    'Tears are truth. They know what lies beneath your mask.',
    'They\'ve seen the salt water on your cheeks. That changes things.',
  ],
  saw_you_beg: [
    'They watched you beg. The memory lives in how they look at you.',
    'Once someone has seen you on your knees, standing feels different.',
    'You begged. They remember. Pride never fully recovers.',
  ],
  
  saw_you_bleed: [
    'She doesn\'t look at your hands. She looks at your wrists. Like she remembers the rope.',
    'Their eyes linger on the scar. They remember when it was fresh.',
    'Blood is intimate. They\'ve seen yours.',
  ],
  you_hurt_them: [
    'The wound you gave them may have healed. The memory hasn\'t.',
    'Pain has a long memory. Theirs carries your mark.',
    'They flinch, just slightly. Your hands did that.',
  ],
  they_hurt_you: [
    'Your body remembers what they did. Muscles tense unbidden.',
    'The phantom of old pain whispers when they\'re near.',
    'They hurt you once. Trust never quite recovers.',
  ],
  saw_you_kill: [
    'They\'ve seen your hands take life. That knowledge sits between you.',
    'Once someone watches you kill, they never see you the same way.',
    'The dead are between you. They saw you make them so.',
  ],
  you_spared_them: [
    'You held their life in your hands and gave it back.',
    'They breathe because you chose mercy. That\'s not forgotten.',
    'The death you didn\'t deal weighs differently than the ones you did.',
  ],
  they_spared_you: [
    'You\'re alive because they chose to let you be.',
    'Their mercy saved you. The debt is existential.',
    'They could have ended you. They didn\'t. Why?',
  ],
  
  heard_you_pray: [
    'They heard your prayers. They know who you call to in darkness.',
    'Your whispered pleas reached their ears. Faith is vulnerable.',
    'They\'ve heard you speak to gods. They know your hopes.',
  ],
  shared_meal: [
    'You\'ve broken bread together. That ancient trust remains.',
    'Those who share food share something deeper.',
    'The meal you shared was more than sustenance.',
  ],
  shared_secret: [
    'The secret between you is a bridge and a weapon.',
    'What you know about each other binds you together.',
    'Shared secrets are shared stakes.',
  ],
  they_confided: [
    'They trusted you with something precious. Handle it carefully.',
    'Their confession lives with you now. Guard it or use it.',
    'What they told you could break them. You both know this.',
  ],
  saw_you_sleep: [
    'They\'ve watched you sleep. They\'ve seen you defenseless.',
    'Sleep is surrender. They\'ve witnessed yours.',
    'In slumber, masks slip. They know your unguarded face.',
  ],
  touched_wound: [
    'Their hands have touched your wounds. Healing is intimate.',
    'Where others shied away, they pressed cloth to bleeding flesh.',
    'They\'ve touched where you hurt. That proximity lingers.',
  ],
  
  caught_you_stealing: [
    'They caught you with your hands where they shouldn\'t be.',
    'Your theft lives in their memory. A card they haven\'t played.',
    'They know you\'re a thief. They\'ve seen the proof.',
  ],
  you_caught_them_stealing: [
    'You know what they are. The evidence is yours to keep.',
    'Their guilt is your leverage. Use it wisely.',
    'Caught in the act. The memory is your weapon.',
  ],
  lied_to_them: [
    'Your lie sits between you. They may not know yet. But you do.',
    'The truth you withheld weighs on every word.',
    'Deception has a way of revealing itself. You wait for that moment.',
  ],
  they_lied_to_you: [
    'Their lie, once discovered, colors everything.',
    'Trust, once broken, warns against itself.',
    'You know they can lie. You\'ve heard them do it.',
  ],
  covered_for_you: [
    'They lied for you. That kind of loyalty isn\'t cheap.',
    'Their reputation took a hit to protect yours.',
    'They covered for you. The favor hasn\'t been returned.',
  ],
  you_covered_for_them: [
    'You protected them from consequences. They remember.',
    'The lie you told for them binds you together.',
    'Your protection was a gift. Gifts have weight.',
  ],
  
  mourned_together: [
    'Grief shared is a bond that doesn\'t break easily.',
    'You\'ve wept over the same loss. That connects you.',
    'Mourning together leaves traces in how you look at each other.',
  ],
  witnessed_their_loss: [
    'You saw them lose someone. That vulnerability is yours to honor.',
    'Their grief was witnessed. You carry that with you.',
    'Loss makes us raw. You\'ve seen their rawness.',
  ],
  they_witnessed_your_loss: [
    'They saw you lose. They know how deep it cut.',
    'Your grief was not private. They were there.',
    'What you lost, they watched you lose.',
  ],
  failed_to_save: [
    'You couldn\'t save them. That failure echoes.',
    'The one you didn\'t save stands between you.',
    'Failure to save is its own kind of wound.',
  ],
  saved_their_friend: [
    'Their friend breathes because of you. Gratitude has long roots.',
    'The life you saved was precious to them. Now you are too.',
    'Saving their friend saved a piece of them.',
  ],
  killed_their_friend: [
    'Their friend\'s blood is on your hands. They know it.',
    'What you took from them can\'t be returned.',
    'The dead one was theirs. You made them dead.',
  ],
  
  gave_order: [
    'You commanded. They obeyed. Power was established.',
    'Your word moved them. Authority has been claimed.',
    'The order you gave shaped events. They remember.',
  ],
  followed_order: [
    'You obeyed them. That submission is part of your history.',
    'Following their command defined a relationship.',
    'Their authority over you was exercised. Once was enough to remember.',
  ],
  refused_order: [
    'Your refusal to obey created a crack in the foundation.',
    'Disobedience is not forgotten. By either party.',
    'You said no. That no echoes.',
  ],
  knelt_to_you: [
    'They knelt before you. That submission shapes everything.',
    'Their knee touched earth for you. Power was defined.',
    'The one who kneels remembers. The one who stood over them, more so.',
  ],
  you_knelt_to_them: [
    'You knelt. That submission lives in memory.',
    'The ground you touched is part of your history now.',
    'Kneeling is not forgotten. Not by you. Not by them.',
  ],
  challenged_authority: [
    'You challenged them. That defiance was noted.',
    'Authority challenged is authority weakened. They remember.',
    'Your challenge still rings in the air between you.',
  ],
};

// ============================================================================
// MEMORY BITE MANAGEMENT
// ============================================================================

// LIMITS to prevent unbounded growth
const MAX_TOTAL_BITES = 150;
const MAX_BITES_PER_NPC = 20;
const MAX_SURFACE_COUNT = 5; // After this, bite is considered "played out"

const store: MemoryBiteStore = {
  bites: [],
  lastUpdate: Date.now()
};

/**
 * Prune memory bites to stay within limits
 */
function pruneBites(): void {
  // Remove over-surfaced bites first
  store.bites = store.bites.filter(b => b.surfaceCount < MAX_SURFACE_COUNT);
  
  // If still over limit, remove oldest low-weight bites
  if (store.bites.length > MAX_TOTAL_BITES) {
    store.bites.sort((a, b) => {
      // Keep high emotional weight
      const weightDiff = b.emotionalWeight - a.emotionalWeight;
      if (Math.abs(weightDiff) > 2) return weightDiff;
      // Keep recent
      return b.timestamp - a.timestamp;
    });
    store.bites = store.bites.slice(0, MAX_TOTAL_BITES);
  }
  
  // Also enforce per-NPC limits
  const npcCounts: Record<string, MemoryBite[]> = {};
  for (const bite of store.bites) {
    if (!npcCounts[bite.npcId]) npcCounts[bite.npcId] = [];
    npcCounts[bite.npcId].push(bite);
  }
  
  const prunedIds = new Set<string>();
  for (const [npcId, bites] of Object.entries(npcCounts)) {
    if (bites.length > MAX_BITES_PER_NPC) {
      // Sort by weight desc, keep top ones
      bites.sort((a, b) => b.emotionalWeight - a.emotionalWeight);
      const toRemove = bites.slice(MAX_BITES_PER_NPC);
      toRemove.forEach(b => prunedIds.add(b.id));
    }
  }
  
  if (prunedIds.size > 0) {
    store.bites = store.bites.filter(b => !prunedIds.has(b.id));
  }
}

/**
 * Create a new memory bite
 */
export function createMemoryBite(
  type: MemoryBiteType,
  npcId: string,
  npcName: string,
  context: string,
  options: {
    gameTick?: number;
    location?: string;
    emotionalWeight?: number;
  } = {}
): MemoryBite {
  const bite: MemoryBite = {
    id: `bite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    npcId,
    npcName,
    context,
    timestamp: Date.now(),
    gameTick: options.gameTick || 0,
    location: options.location,
    emotionalWeight: options.emotionalWeight || 5,
    surfaced: false,
    surfaceCount: 0
  };
  
  store.bites.push(bite);
  store.lastUpdate = Date.now();
  
  // Prune if needed
  pruneBites();
  
  console.log(`[MemoryBite] Created: ${type} with ${npcName} - "${context}"`);
  
  return bite;
}

/**
 * Get all bites involving a specific NPC
 */
export function getBitesForNPC(npcId: string): MemoryBite[] {
  return store.bites.filter(b => b.npcId === npcId);
}

/**
 * Get unsurfaced bites for potential narrative callback
 */
export function getUnsurfacedBites(npcId?: string): MemoryBite[] {
  return store.bites.filter(b => 
    !b.surfaced && 
    (!npcId || b.npcId === npcId)
  );
}

/**
 * Get the most emotionally significant bite for an NPC
 */
export function getMostSignificantBite(npcId: string): MemoryBite | null {
  const bites = getBitesForNPC(npcId);
  if (bites.length === 0) return null;
  
  return bites.reduce((a, b) => 
    a.emotionalWeight > b.emotionalWeight ? a : b
  );
}

/**
 * Mark a bite as surfaced in narrative
 */
export function markBiteSurfaced(biteId: string): void {
  const bite = store.bites.find(b => b.id === biteId);
  if (bite) {
    bite.surfaced = true;
    bite.surfaceCount++;
  }
}

/**
 * Get a surface template for a bite
 */
export function getSurfaceNarrative(bite: MemoryBite): string {
  const templates = SURFACE_TEMPLATES[bite.type];
  if (!templates || templates.length === 0) {
    return `There\'s history between you and ${bite.npcName}.`;
  }
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('their', bite.npcName + '\'s').replace('they', bite.npcName);
}

// ============================================================================
// NARRATIVE PARSING
// ============================================================================

/**
 * Parse narrative for potential memory bite triggers
 */
export function parseNarrativeForBites(
  narrative: string,
  npcId: string,
  npcName: string,
  gameTick: number
): MemoryBite[] {
  const created: MemoryBite[] = [];
  const lowerNarrative = narrative.toLowerCase();
  
  // Detect various bite triggers
  const triggers: Array<{ pattern: RegExp; type: MemoryBiteType; contextExtract: () => string }> = [
    { 
      pattern: /save[ds]?\s+(your|their)\s+life/i, 
      type: lowerNarrative.includes('your') ? 'they_spared_you' : 'you_saved_their_life',
      contextExtract: () => 'A life was saved.'
    },
    { 
      pattern: /blood\s+(flows|drips|pools|spills)/i, 
      type: 'saw_you_bleed',
      contextExtract: () => 'They witnessed blood.'
    },
    { 
      pattern: /(humiliat|embarrass|shame)/i, 
      type: 'you_embarrassed_them',
      contextExtract: () => 'Pride was wounded.'
    },
    { 
      pattern: /(beg|plead|kneel)/i, 
      type: lowerNarrative.includes('you ') ? 'saw_you_beg' : 'knelt_to_you',
      contextExtract: () => 'Submission was shown.'
    },
    { 
      pattern: /(steal|theft|thief|stole)/i, 
      type: 'caught_you_stealing',
      contextExtract: () => 'Theft was witnessed.'
    },
    { 
      pattern: /(cry|tears|weep)/i, 
      type: 'saw_you_cry',
      contextExtract: () => 'Tears were seen.'
    },
    { 
      pattern: /share[ds]?\s+(meal|food|drink)/i, 
      type: 'shared_meal',
      contextExtract: () => 'A meal was shared.'
    },
    { 
      pattern: /secret|confide|whisper/i, 
      type: 'shared_secret',
      contextExtract: () => 'A secret was shared.'
    },
    { 
      pattern: /kill|slay|murder|death/i, 
      type: 'saw_you_kill',
      contextExtract: () => 'Death was dealt.'
    },
    { 
      pattern: /spare|mercy|let.*go|release/i, 
      type: 'you_spared_them',
      contextExtract: () => 'Mercy was shown.'
    },
    { 
      pattern: /pray|god|faith|worship/i, 
      type: 'heard_you_pray',
      contextExtract: () => 'Prayer was heard.'
    },
    { 
      pattern: /mourn|grief|funeral|loss/i, 
      type: 'mourned_together',
      contextExtract: () => 'Loss was shared.'
    },
    { 
      pattern: /lie[ds]?|deceiv|trick|betray/i, 
      type: 'lied_to_them',
      contextExtract: () => 'Trust was betrayed.'
    },
    { 
      pattern: /promise.*keep|kept.*word/i, 
      type: 'kept_promise',
      contextExtract: () => 'A promise was honored.'
    },
    { 
      pattern: /broke.*promise|promise.*broke/i, 
      type: 'broke_promise',
      contextExtract: () => 'A promise was broken.'
    },
  ];
  
  for (const trigger of triggers) {
    if (trigger.pattern.test(narrative)) {
      const bite = createMemoryBite(
        trigger.type,
        npcId,
        npcName,
        trigger.contextExtract(),
        { gameTick, emotionalWeight: 5 + Math.floor(Math.random() * 5) }
      );
      created.push(bite);
      break; // Only create one bite per narrative to avoid spam
    }
  }
  
  return created;
}

// ============================================================================
// CONTEXT BUILDING FOR AI
// ============================================================================

/**
 * Build memory bite context for AI prompts
 */
export function buildMemoryBiteContext(npcId: string): string {
  const bites = getBitesForNPC(npcId);
  if (bites.length === 0) return '';
  
  const lines: string[] = ['### SHARED HISTORY (Surface naturally in narrative)'];
  
  // Sort by emotional weight
  const sortedBites = [...bites].sort((a, b) => b.emotionalWeight - a.emotionalWeight);
  
  // Take top 3 most significant
  for (const bite of sortedBites.slice(0, 3)) {
    const template = SURFACE_TEMPLATES[bite.type]?.[0] || bite.context;
    lines.push(`- ${bite.type.replace(/_/g, ' ')}: "${template}"`);
  }
  
  lines.push('');
  lines.push('*Reference these memories subtly through body language, glances, or brief mentions.*');
  
  return lines.join('\n');
}

/**
 * Get all memory bites for serialization
 */
export function getAllBites(): MemoryBite[] {
  return [...store.bites];
}

/**
 * Load memory bites from saved data
 */
export function loadBites(bites: MemoryBite[]): void {
  // Validate and limit on load
  if (!Array.isArray(bites)) {
    store.bites = [];
  } else {
    store.bites = bites.slice(0, MAX_TOTAL_BITES).filter(b => 
      b && typeof b.id === 'string' && typeof b.npcId === 'string'
    );
  }
  store.lastUpdate = Date.now();
  pruneBites();
}

/**
 * Clear all memory bites
 */
export function clearBites(): void {
  store.bites = [];
  store.lastUpdate = Date.now();
}

/**
 * Serialize memory bite store for saving
 */
export function serializeMemoryBites(): string {
  return JSON.stringify(store);
}

/**
 * Deserialize memory bite store from saved data
 */
export function deserializeMemoryBites(data: string): MemoryBiteStore {
  try {
    const parsed = JSON.parse(data);
    store.bites = parsed.bites || [];
    store.lastUpdate = parsed.lastUpdate || Date.now();
    return store;
  } catch {
    return { bites: [], lastUpdate: Date.now() };
  }
}
