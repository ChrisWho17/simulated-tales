// ============================================================================
// DIRECTOR MODE SYSTEM - Difficulty modes, director types, and tightness shaping
// Controls DM manipulation features and narrative steering
// ============================================================================

// ============= TYPES =============

export type DirectiveMode = 'fun' | 'easy' | 'medium' | 'hard';

export type DirectorType = 
  // Story & Pacing
  | 'cinematic' | 'tight_editor' | 'slow_burn' | 'montage_maker' | 'revenge_arc'
  // Player-Freedom
  | 'sandbox' | 'yes_and' | 'choice_architect' | 'hands_off' | 'red_velvet'
  // Challenge & Consequence
  | 'old_school' | 'survival_warden' | 'tactician' | 'punishment_accountant'
  // Mystery & Mindgame
  | 'mystery_keeper' | 'conspiracy_weaver' | 'puzzle_master' | 'truth_serum'
  // Social & Relationship
  | 'romance_writer' | 'drama_producer' | 'courtroom_arbitrator' | 'community_sim'
  // Vibe & Tone
  | 'horror_curator' | 'comedic_goblin' | 'poet_narrator' | 'noir_narrator';

// ============= NARRATOR VOICE TYPES FOR DIRECTORS =============
export type DirectorNarratorVoice = 'OBJECTIVE' | 'LITERARY' | 'SARDONIC' | 'UNRELIABLE' | 'OMNISCIENT' | 'NOIR' | 'VENGEFUL' | 'THEATRICAL' | 'INTIMATE' | 'CLINICAL';

export interface DirectorNarratorProfile {
  voice: DirectorNarratorVoice;
  detailLevel: 'SPARSE' | 'MODERATE' | 'RICH' | 'DENSE';
  emotionalLeakage: boolean;
  narrativeHooks: string[];
  openingStyle: string;
}

export type PersonalityLevel = 'soft' | 'honest' | 'brutal';
export type WeirdnessLevel = 'grounded' | 'spicy' | 'unhinged';
export type GuidanceLevel = 'none' | 'light' | 'coach';

export interface DirectorKnobs {
  playerPullOnly: boolean;
  chatterFrequency: 'low' | 'medium' | 'high';
  worldPush: number;           // 0-1: How much world events intrude
  timePressure: number;        // 0-1: Urgency level
  consequenceSeverity: number; // 0-1: How hard failures hit
  resourceScarcity: number;    // 0-1: Resource availability
  uiHinting: number;           // 0-1: How much guidance shown
  failForwardStrength: number; // 0-1: Safety net on failures
  inventionBudget: number;     // 0-1: DM creativity allowance
}

export interface DirectorSettings {
  enabled: boolean;
  rawGame: boolean;
  mode: DirectiveMode;
  directorType: DirectorType;
  tightness: number; // 0-1, default 0.80
  allowMidCampaignSwap: boolean;
  // Personality toggles
  cruelty: PersonalityLevel;
  weirdness: WeirdnessLevel;
  guidance: GuidanceLevel;
}

// ============= DEFAULT SETTINGS =============

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  enabled: false,
  rawGame: true,
  mode: 'medium',
  directorType: 'cinematic',
  tightness: 0.80,
  allowMidCampaignSwap: true,
  cruelty: 'honest',
  weirdness: 'grounded',
  guidance: 'light',
};

// ============= MODE BASELINES =============

interface ModeBaseline {
  worldPush: number;
  timePressure: number;
  consequence: number;
  hints: number;
  failForward: number;
  scarcity: number;
  invention: number;
}

const MODE_BASELINES: Record<DirectiveMode, ModeBaseline> = {
  fun: {
    worldPush: 0.55,
    timePressure: 0.35,
    consequence: 0.35,
    hints: 0.65,
    failForward: 0.90,
    scarcity: 0.25,
    invention: 0.75,
  },
  easy: {
    worldPush: 0.45,
    timePressure: 0.35,
    consequence: 0.35,
    hints: 0.60,
    failForward: 0.85,
    scarcity: 0.30,
    invention: 0.55,
  },
  medium: {
    worldPush: 0.55,
    timePressure: 0.50,
    consequence: 0.55,
    hints: 0.35,
    failForward: 0.70,
    scarcity: 0.45,
    invention: 0.45,
  },
  hard: {
    worldPush: 0.70,
    timePressure: 0.70,
    consequence: 0.80,
    hints: 0.15,
    failForward: 0.55,
    scarcity: 0.75,
    invention: 0.35,
  },
};

// ============= DIRECTOR TYPE MODIFIERS =============

interface DirectorTypeProfile {
  name: string;
  description: string;
  category: 'story' | 'freedom' | 'challenge' | 'mystery' | 'social' | 'vibe';
  tags: string[];
  modifiers: Partial<ModeBaseline>;
  styleNotes: string[];
}

export const DIRECTOR_TYPES: Record<DirectorType, DirectorTypeProfile> = {
  // Story & Pacing
  cinematic: {
    name: 'Cinematic Director',
    description: 'Big scenes, clean pacing, dramatic reveals',
    category: 'story',
    tags: ['Drama', 'Action', 'Blockbuster'],
    modifiers: { invention: 0.15, worldPush: 0.10 },
    styleNotes: ['Likes cliffhangers', 'Avoids dead air', 'Scene transitions feel like cuts'],
  },
  tight_editor: {
    name: 'Tight Editor',
    description: 'Shorter outputs, fast turns, minimal fluff',
    category: 'story',
    tags: ['Mobile', 'Quick', 'Efficient'],
    modifiers: { worldPush: -0.10, timePressure: 0.05 },
    styleNotes: ['Brevity is king', 'Every word counts', 'Skip transitions'],
  },
  slow_burn: {
    name: 'Slow Burn Auteur',
    description: 'Subtle tension, atmosphere, longer build-ups',
    category: 'story',
    tags: ['Atmospheric', 'Dramatic', 'Payoff'],
    modifiers: { timePressure: -0.20, invention: 0.10, worldPush: -0.15 },
    styleNotes: ['Low frequency twists', 'High payoff moments', 'Let scenes breathe'],
  },
  montage_maker: {
    name: 'Montage Maker',
    description: 'Compresses travel and downtime into punchy sequences',
    category: 'story',
    tags: ['Travel', 'Downtime', 'Training'],
    modifiers: { timePressure: 0.15, worldPush: -0.05 },
    styleNotes: ['Great for wait/rest/train', 'Time skips feel earned'],
  },
  revenge_arc: {
    name: 'Revenge Arc Director',
    description: 'Vendetta-driven narrative, tracking grudges to their conclusion',
    category: 'story',
    tags: ['Vendetta', 'Payback', 'Justice', 'Obsession'],
    modifiers: { consequence: 0.20, worldPush: 0.15, invention: 0.15, timePressure: 0.10 },
    styleNotes: [
      'The world owes you a debt, and you will collect',
      'Every enemy has a name, a face, a weakness',
      'Victories are bittersweet, defeats fuel determination',
      'The journey matters—but the ending will be reckoning',
      'Memory is a weapon; grudges are sharpened daily',
    ],
  },

  // Player-Freedom
  sandbox: {
    name: 'Sandbox Facilitator',
    description: 'Player-led, low steering, sim-first',
    category: 'freedom',
    tags: ['Exploration', 'Freedom', 'Sim'],
    modifiers: { worldPush: -0.25, hints: -0.20, invention: -0.15 },
    styleNotes: ['DM intervenes to keep things moving', 'World reacts, rarely initiates'],
  },
  yes_and: {
    name: 'Yes-And Improviser',
    description: 'High creativity budget, embraces player ideas',
    category: 'freedom',
    tags: ['Roleplay', 'Creative', 'Chaotic'],
    modifiers: { invention: 0.25, failForward: 0.15, hints: 0.10 },
    styleNotes: ['Great for wild roleplay', 'Build on player proposals'],
  },
  choice_architect: {
    name: 'Choice Architect',
    description: 'Always presents 2–4 meaningful options',
    category: 'freedom',
    tags: ['Branching', 'Decisions', 'Clarity'],
    modifiers: { hints: 0.20, invention: 0.05 },
    styleNotes: ['Choices feel distinct', 'Consequences are telegraphed'],
  },
  hands_off: {
    name: 'Hands-Off Observer',
    description: 'Minimal narration, lots of world motion',
    category: 'freedom',
    tags: ['Minimal', 'Immersive', 'Sim'],
    modifiers: { worldPush: 0.10, hints: -0.30, invention: -0.20 },
    styleNotes: ['World evolves, you notice it', 'Sparse but meaningful narration'],
  },
  red_velvet: {
    name: 'Red Velvet',
    description: 'Intimate romance, sensual narratives, consensual adult interactions',
    category: 'freedom',
    tags: ['Romance', 'Sensual', 'Passion', 'Consent'],
    modifiers: { invention: 0.25, worldPush: -0.20, timePressure: -0.25, failForward: 0.20 },
    styleNotes: [
      'Desire is the compass, consent is the map',
      'NPCs communicate openly about attraction',
      'Emotional connection drives encounters',
      'Mutual desire unlocks story beats',
      'Sensual scenes feel natural, not forced',
    ],
  },

  // Challenge & Consequence
  old_school: {
    name: 'Old-School Referee',
    description: 'Rules, checks, resource tracking',
    category: 'challenge',
    tags: ['Classic', 'Crunchy', 'Fair'],
    modifiers: { consequence: 0.15, scarcity: 0.15, failForward: -0.15 },
    styleNotes: ['Fair but unforgiving', 'Rules are consistent'],
  },
  survival_warden: {
    name: 'Survival Warden',
    description: 'Scarcity, injuries matter, time pressure',
    category: 'challenge',
    tags: ['Survival', 'Horror', 'Hardcore'],
    modifiers: { scarcity: 0.25, timePressure: 0.20, consequence: 0.20, failForward: -0.20 },
    styleNotes: ['Small mistakes snowball', 'Resources are precious'],
  },
  tactician: {
    name: 'Tactician',
    description: 'Combat clarity, positioning language, threat logic',
    category: 'challenge',
    tags: ['Combat', 'Strategy', 'Military'],
    modifiers: { hints: 0.10, worldPush: 0.05, consequence: 0.10 },
    styleNotes: ['Great for WW2, sci-fi, survival', 'Tactical options clear'],
  },
  punishment_accountant: {
    name: 'Punishment Accountant',
    description: 'Consequences are consistent and remembered',
    category: 'challenge',
    tags: ['Consequences', 'Memory', 'Fair'],
    modifiers: { consequence: 0.25, failForward: -0.10, scarcity: 0.10 },
    styleNotes: ['Not mean, just relentlessly honest', 'Everything is tracked'],
  },

  // Mystery & Mindgame
  mystery_keeper: {
    name: 'Mystery Keeper',
    description: 'Clue economy, controlled reveals, avoids info dumps',
    category: 'mystery',
    tags: ['Detective', 'Noir', 'Investigation'],
    modifiers: { hints: -0.15, invention: 0.10, worldPush: -0.10 },
    styleNotes: ['Keeps notes like a detective', 'Information is currency'],
  },
  conspiracy_weaver: {
    name: 'Conspiracy Weaver',
    description: 'Everything connects, patterns emerge',
    category: 'mystery',
    tags: ['Thriller', 'Cyberpunk', 'Paranoia'],
    modifiers: { invention: 0.20, worldPush: 0.10, hints: -0.10 },
    styleNotes: ['Great for modern thriller', 'Red herrings carefully placed'],
  },
  puzzle_master: {
    name: 'Puzzle Master',
    description: 'Locks and keys, riddles, mechanisms',
    category: 'mystery',
    tags: ['Puzzles', 'Dungeon', 'Escape'],
    modifiers: { hints: 0.15, failForward: 0.10 },
    styleNotes: ['Always gives partial progress', 'No hard stuck moments'],
  },
  truth_serum: {
    name: 'Truth Serum',
    description: 'Forces clarity: what you know, what you assume',
    category: 'mystery',
    tags: ['Clarity', 'Logic', 'Precision'],
    modifiers: { hints: 0.25, worldPush: -0.10, invention: -0.10 },
    styleNotes: ['Great for preventing confusion', 'Facts clearly labeled'],
  },

  // Social & Relationship
  romance_writer: {
    name: 'Romance Writer',
    description: 'Emotional beats, relationship momentum, subtext',
    category: 'social',
    tags: ['Romance', 'Drama', 'Character'],
    modifiers: { invention: 0.15, worldPush: -0.15, timePressure: -0.15 },
    styleNotes: ['NPCs feel human', 'Not pushy about romance', 'Subtext matters'],
  },
  drama_producer: {
    name: 'Drama Producer',
    description: 'Social friction, jealousy, alliances, reputation',
    category: 'social',
    tags: ['Drama', 'Politics', 'Intrigue'],
    modifiers: { worldPush: 0.15, invention: 0.10, consequence: 0.10 },
    styleNotes: ['Choices become social consequences', 'NPCs remember slights'],
  },
  courtroom_arbitrator: {
    name: 'Courtroom Arbitrator',
    description: 'Negotiation, arguments, persuasion battles',
    category: 'social',
    tags: ['Debate', 'Law', 'Persuasion'],
    modifiers: { hints: 0.10, timePressure: 0.05 },
    styleNotes: ['Makes talking feel like combat', 'Arguments have weight'],
  },
  community_sim: {
    name: 'Community Sim Host',
    description: 'NPC routines, gossip, factions, schedules',
    category: 'social',
    tags: ['Cozy', 'Slice-of-Life', 'Community'],
    modifiers: { worldPush: 0.10, timePressure: -0.20, scarcity: -0.15 },
    styleNotes: ['Living world director', 'NPCs have lives'],
  },

  // Vibe & Tone
  horror_curator: {
    name: 'Horror Curator',
    description: 'Dread, sensory focus, unease beats',
    category: 'vibe',
    tags: ['Horror', 'Psychological', 'Tension'],
    modifiers: { worldPush: 0.10, hints: -0.20, scarcity: 0.15, timePressure: -0.10 },
    styleNotes: ['Uses silence as a weapon', 'Sensory details matter'],
  },
  comedic_goblin: {
    name: 'Comedic Timing Goblin',
    description: 'Quick punchlines, absurd coincidences, funny NPC chatter',
    category: 'vibe',
    tags: ['Comedy', 'Absurd', 'Light'],
    modifiers: { failForward: 0.20, invention: 0.20, consequence: -0.15 },
    styleNotes: ['Still respects stakes when it matters', 'Timing is everything'],
  },
  poet_narrator: {
    name: 'Poet-Narrator',
    description: 'Beautiful language, mood-heavy scenes, symbolic details',
    category: 'vibe',
    tags: ['Fantasy', 'Literary', 'Dreamlike'],
    modifiers: { invention: 0.15, worldPush: -0.10, timePressure: -0.15 },
    styleNotes: ['Great for fantasy, dreamlike, romance', 'Prose matters'],
  },
  noir_narrator: {
    name: 'Noir Narrator',
    description: 'Grit, cynicism, moral ambiguity, slow reveals',
    category: 'vibe',
    tags: ['Noir', 'Crime', 'Gritty'],
    modifiers: { consequence: 0.10, hints: -0.10, scarcity: 0.10 },
    styleNotes: ['Perfect for modern crime', 'Everyone has secrets'],
  },
};

// ============= KNOB COMPUTATION =============

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Compute effective director knobs based on mode, tightness, and director type
 */
export function computeDirectorKnobs(
  mode: DirectiveMode, 
  tightness: number,
  directorType?: DirectorType
): DirectorKnobs {
  const baseline = MODE_BASELINES[mode] || MODE_BASELINES.medium;
  const t = clamp01(tightness);
  
  // Start with mode baseline
  let b = { ...baseline };
  
  // Apply director type modifiers if specified
  if (directorType && DIRECTOR_TYPES[directorType]) {
    const typeProfile = DIRECTOR_TYPES[directorType];
    Object.entries(typeProfile.modifiers).forEach(([key, value]) => {
      if (value !== undefined && key in b) {
        (b as any)[key] = clamp01((b as any)[key] + value);
      }
    });
  }
  
  return {
    playerPullOnly: true,
    chatterFrequency: 'low',
    
    // Steering - tightness increases DM control
    worldPush: clamp01(lerp(b.worldPush * 0.70, b.worldPush * 1.15, t)),
    timePressure: clamp01(lerp(b.timePressure * 0.70, b.timePressure * 1.15, t)),
    
    // Consequences and resources
    consequenceSeverity: clamp01(lerp(b.consequence * 0.85, b.consequence * 1.10, t)),
    resourceScarcity: clamp01(lerp(b.scarcity * 0.90, b.scarcity * 1.10, t)),
    
    // Flow and guidance
    uiHinting: clamp01(lerp(b.hints * 0.70, b.hints * 1.10, t)),
    failForwardStrength: clamp01(lerp(b.failForward * 0.85, b.failForward * 1.05, t)),
    
    // Creativity budget
    inventionBudget: clamp01(lerp(b.invention * 0.80, b.invention * 1.10, t)),
  };
}

// ============= RAW GAME KNOBS =============

export function getRawGameKnobs(): DirectorKnobs {
  return {
    playerPullOnly: true,
    chatterFrequency: 'low',
    worldPush: 0.30,        // Baseline only
    timePressure: 0.30,
    consequenceSeverity: 0.50,
    resourceScarcity: 0.40,
    uiHinting: 0.20,        // Minimal hints
    failForwardStrength: 0.60,
    inventionBudget: 0.30,
  };
}

// ============= GET EFFECTIVE KNOBS =============

export function getEffectiveDirectorKnobs(settings: DirectorSettings): DirectorKnobs {
  // Raw game or disabled = minimal DM involvement
  if (settings.rawGame || !settings.enabled) {
    return getRawGameKnobs();
  }
  
  return computeDirectorKnobs(settings.mode, settings.tightness, settings.directorType);
}

// ============= PROMPT INJECTION =============

export function buildDirectorPromptBlock(settings: DirectorSettings): string {
  if (settings.rawGame || !settings.enabled) {
    return `## DIRECTOR: RAW GAME MODE
- No narrative steering beyond core rules
- Player actions create reactions
- No pacing nudges or DM pressure
- Core sim runs, DM stays hands-off`;
  }
  
  const knobs = getEffectiveDirectorKnobs(settings);
  const typeProfile = DIRECTOR_TYPES[settings.directorType];
  
  const lines: string[] = [
    '## DIRECTOR_MODE',
    `enabled: true`,
    `mode: ${settings.mode.toUpperCase()}`,
    `type: ${typeProfile.name}`,
    `tightness: ${settings.tightness.toFixed(2)}`,
    `playerPullOnly: true`,
    `chatterFrequency: low`,
    '',
    '## DIRECTOR KNOBS',
    `worldPush: ${knobs.worldPush.toFixed(2)}`,
    `timePressure: ${knobs.timePressure.toFixed(2)}`,
    `consequenceSeverity: ${knobs.consequenceSeverity.toFixed(2)}`,
    `uiHinting: ${knobs.uiHinting.toFixed(2)}`,
    `failForwardStrength: ${knobs.failForwardStrength.toFixed(2)}`,
    `resourceScarcity: ${knobs.resourceScarcity.toFixed(2)}`,
    `inventionBudget: ${knobs.inventionBudget.toFixed(2)}`,
    '',
    '## DIRECTOR STYLE',
    `Category: ${typeProfile.category}`,
    `Tags: ${typeProfile.tags.join(', ')}`,
    ...typeProfile.styleNotes.map(note => `- ${note}`),
    '',
    '## RULES',
    '- Player must initiate direct NPC engagement',
    '- Ambient chatter may occur but must not demand response',
    '- No retcons. Respect established facts and state',
    '- Every player action creates change, reaction, or pressure',
  ];
  
  return lines.join('\n');
}

// ============= ANTI-WHIPLASH =============

interface TransitionState {
  previousMode: DirectiveMode;
  previousKnobs: DirectorKnobs;
  turnsRemaining: number;
}

let transitionState: TransitionState | null = null;

/**
 * Apply anti-whiplash smoothing when changing modes mid-campaign
 */
export function smoothModeTransition(
  oldMode: DirectiveMode,
  newMode: DirectiveMode,
  tightness: number,
  directorType?: DirectorType
): DirectorKnobs {
  if (oldMode === newMode) {
    return computeDirectorKnobs(newMode, tightness, directorType);
  }
  
  // Start transition
  transitionState = {
    previousMode: oldMode,
    previousKnobs: computeDirectorKnobs(oldMode, tightness, directorType),
    turnsRemaining: 2, // Smooth over 2 turns
  };
  
  const targetKnobs = computeDirectorKnobs(newMode, tightness, directorType);
  const oldKnobs = transitionState.previousKnobs;
  
  // Clamp deltas to ±0.15 per turn
  const maxDelta = 0.15;
  
  return {
    playerPullOnly: true,
    chatterFrequency: 'low',
    worldPush: clamp01(oldKnobs.worldPush + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.worldPush - oldKnobs.worldPush))),
    timePressure: clamp01(oldKnobs.timePressure + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.timePressure - oldKnobs.timePressure))),
    consequenceSeverity: clamp01(oldKnobs.consequenceSeverity + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.consequenceSeverity - oldKnobs.consequenceSeverity))),
    resourceScarcity: clamp01(oldKnobs.resourceScarcity + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.resourceScarcity - oldKnobs.resourceScarcity))),
    uiHinting: clamp01(oldKnobs.uiHinting + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.uiHinting - oldKnobs.uiHinting))),
    failForwardStrength: clamp01(oldKnobs.failForwardStrength + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.failForwardStrength - oldKnobs.failForwardStrength))),
    inventionBudget: clamp01(oldKnobs.inventionBudget + Math.max(-maxDelta, Math.min(maxDelta, targetKnobs.inventionBudget - oldKnobs.inventionBudget))),
  };
}

export function tickTransition(): void {
  if (transitionState && transitionState.turnsRemaining > 0) {
    transitionState.turnsRemaining--;
    if (transitionState.turnsRemaining === 0) {
      transitionState = null;
    }
  }
}

export function isInTransition(): boolean {
  return transitionState !== null && transitionState.turnsRemaining > 0;
}

// ============= MODE METADATA =============

export interface DirectiveModeInfo {
  id: DirectiveMode;
  name: string;
  description: string;
  colorClass: string;
  icon: string;
}

export const DIRECTIVE_MODES: DirectiveModeInfo[] = [
  {
    id: 'fun',
    name: 'Fun',
    description: 'Playful, permissive, cinematic chaos allowed',
    colorClass: 'mode-fun',
    icon: '🎉',
  },
  {
    id: 'easy',
    name: 'Easy',
    description: 'Forgiving consequences, generous hints',
    colorClass: 'mode-easy',
    icon: '🌿',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Balanced, consequences matter',
    colorClass: 'mode-medium',
    icon: '⚖️',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'High stakes, low safety net',
    colorClass: 'mode-hard',
    icon: '💀',
  },
];

// ============= DIRECTOR TYPE CATEGORIES =============

export const DIRECTOR_TYPE_CATEGORIES = {
  story: { name: 'Story & Pacing', icon: '📖' },
  freedom: { name: 'Player-Freedom', icon: '🗺️' },
  challenge: { name: 'Challenge', icon: '⚔️' },
  mystery: { name: 'Mystery', icon: '🔍' },
  social: { name: 'Social', icon: '💬' },
  vibe: { name: 'Vibe & Tone', icon: '🎭' },
} as const;

export function getDirectorTypesByCategory(category: keyof typeof DIRECTOR_TYPE_CATEGORIES): DirectorType[] {
  return Object.entries(DIRECTOR_TYPES)
    .filter(([_, profile]) => profile.category === category)
    .map(([id]) => id as DirectorType);
}

// ============= DIRECTOR → NARRATOR PERSONALITY MAPPING =============

export const DIRECTOR_NARRATOR_PROFILES: Record<DirectorType, DirectorNarratorProfile> = {
  // Story & Pacing
  cinematic: {
    voice: 'THEATRICAL',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Cliffhangers at scene breaks', 'Dramatic reveals timed perfectly', 'Scene transitions feel like film cuts'],
    openingStyle: 'The camera finds you in medias res, already in motion, already in peril. The world unfolds like a blockbuster—every moment matters, every choice echoes.',
  },
  tight_editor: {
    voice: 'CLINICAL',
    detailLevel: 'SPARSE',
    emotionalLeakage: false,
    narrativeHooks: ['Brevity is power', 'No wasted words', 'Action over description'],
    openingStyle: 'You arrive. The situation is clear. Time to move.',
  },
  slow_burn: {
    voice: 'LITERARY',
    detailLevel: 'DENSE',
    emotionalLeakage: true,
    narrativeHooks: ['Tension builds imperceptibly', 'Small details foreshadow', 'Patience rewards the attentive'],
    openingStyle: 'Something is wrong. You can taste it in the air—a wrongness beneath the ordinary. The world holds its breath, and so do you.',
  },
  montage_maker: {
    voice: 'OBJECTIVE',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['Time flows like a training montage', 'Skip the boring parts', 'Summarize to significance'],
    openingStyle: 'Days blur together—training, preparation, waiting. When it matters, time slows. This is one of those moments.',
  },
  revenge_arc: {
    voice: 'VENGEFUL',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Every enemy is named and remembered', 'Setbacks fuel determination', 'The reckoning is inevitable'],
    openingStyle: 'They took everything from you. Your peace. Your purpose. Your people. But they left you alive—their first mistake, and their last. This is where the debt begins to be paid.',
  },
  
  // Player-Freedom
  sandbox: {
    voice: 'OBJECTIVE',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['The world waits for your decision', 'No rails, only consequences', 'You make the story'],
    openingStyle: 'The world stretches before you, indifferent to your presence. No quest markers. No destiny. Only possibility.',
  },
  yes_and: {
    voice: 'THEATRICAL',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Every idea finds a home', 'Chaos is opportunity', 'Reality bends to creativity'],
    openingStyle: 'Reality is more flexible than most believe. You\'ve always known this. Today, you prove it.',
  },
  choice_architect: {
    voice: 'OMNISCIENT',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['Choices are clearly framed', 'Consequences are telegraphed', 'Every path has meaning'],
    openingStyle: 'Three paths lie before you—each leading somewhere different, each closing doors behind it. Choose.',
  },
  hands_off: {
    voice: 'OBJECTIVE',
    detailLevel: 'SPARSE',
    emotionalLeakage: false,
    narrativeHooks: ['The world moves without you', 'Minimal narration, maximum immersion', 'You are a visitor here'],
    openingStyle: 'You are here. The world continues its business. What you do next is your concern.',
  },
  red_velvet: {
    voice: 'INTIMATE',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Desire guides the narrative', 'Emotional connection deepens', 'Sensuality is an art form'],
    openingStyle: 'The room is warm. The atmosphere electric. Eyes meet across the space, and something unspoken passes between you.',
  },
  
  // Challenge & Consequence
  old_school: {
    voice: 'OBJECTIVE',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['Rules are consistent', 'Fairness over drama', 'Consequences are earned'],
    openingStyle: 'The dungeon awaits. Your torch burns low. Your supplies are counted. The odds are what they are.',
  },
  survival_warden: {
    voice: 'CLINICAL',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Every resource matters', 'Injuries accumulate', 'Survival is the goal'],
    openingStyle: 'Hunger gnaws. Cold bites. Your supplies won\'t last. In this place, staying alive is victory enough.',
  },
  tactician: {
    voice: 'CLINICAL',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['Positioning matters', 'Tactical options clear', 'Combat is chess'],
    openingStyle: 'The battlefield takes shape. Cover to the left. High ground ahead. Hostiles: three visible, possibly more. Make your move.',
  },
  punishment_accountant: {
    voice: 'SARDONIC',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['Everything is tracked', 'Debts are remembered', 'Fairness is brutal'],
    openingStyle: 'The ledger doesn\'t forget. Neither does the world. Let\'s see where you stand.',
  },
  
  // Mystery & Mindgame
  mystery_keeper: {
    voice: 'UNRELIABLE',
    detailLevel: 'RICH',
    emotionalLeakage: false,
    narrativeHooks: ['Information is currency', 'Clues hide in plain sight', 'Nothing is coincidence'],
    openingStyle: 'Something doesn\'t add up. The details that should fit... don\'t. And you\'re the only one who seems to notice.',
  },
  conspiracy_weaver: {
    voice: 'UNRELIABLE',
    detailLevel: 'DENSE',
    emotionalLeakage: true,
    narrativeHooks: ['Everything connects', 'Paranoia is wisdom', 'Trust is dangerous'],
    openingStyle: 'They\'re watching. They\'ve always been watching. The question isn\'t whether the conspiracy exists—it\'s how deep it goes.',
  },
  puzzle_master: {
    voice: 'OMNISCIENT',
    detailLevel: 'RICH',
    emotionalLeakage: false,
    narrativeHooks: ['Locks have keys', 'Patterns reveal answers', 'Progress is always possible'],
    openingStyle: 'The mechanism waits. Complex, ancient, beautiful. Somewhere in its design lies the answer. Find it.',
  },
  truth_serum: {
    voice: 'OBJECTIVE',
    detailLevel: 'SPARSE',
    emotionalLeakage: false,
    narrativeHooks: ['Facts are labeled clearly', 'Assumptions are challenged', 'Clarity above all'],
    openingStyle: 'Here is what you know. Here is what you assume. Here is where they diverge.',
  },
  
  // Social & Relationship
  romance_writer: {
    voice: 'INTIMATE',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['NPCs feel human', 'Subtext matters', 'Hearts are complicated'],
    openingStyle: 'Their eyes meet yours across the room. Something passes between you—unspoken, unnamed, undeniable.',
  },
  drama_producer: {
    voice: 'THEATRICAL',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Social friction creates heat', 'Alliances shift', 'Reputation is everything'],
    openingStyle: 'The whispers stop when you enter. Everyone has an opinion about you here. Not all of them are kind.',
  },
  courtroom_arbitrator: {
    voice: 'OBJECTIVE',
    detailLevel: 'MODERATE',
    emotionalLeakage: false,
    narrativeHooks: ['Arguments have structure', 'Persuasion is combat', 'Words have weight'],
    openingStyle: 'The case is before you. Evidence on both sides. Everyone\'s watching how you\'ll argue.',
  },
  community_sim: {
    voice: 'LITERARY',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['NPCs have lives', 'Gossip flows naturally', 'The community breathes'],
    openingStyle: 'Morning light filters through familiar streets. Neighbors wave. The baker\'s already at work. Another day in a place that knows your name.',
  },
  
  // Vibe & Tone
  horror_curator: {
    voice: 'UNRELIABLE',
    detailLevel: 'DENSE',
    emotionalLeakage: true,
    narrativeHooks: ['Dread builds slowly', 'Senses become weapons', 'Fear is the point'],
    openingStyle: 'Something is wrong with the silence. Too empty. Too complete. As if the world itself is holding its breath—waiting for you to look behind you.',
  },
  comedic_goblin: {
    voice: 'SARDONIC',
    detailLevel: 'MODERATE',
    emotionalLeakage: true,
    narrativeHooks: ['Timing is everything', 'Stakes feel light', 'Life is absurd'],
    openingStyle: 'Well. This is fine. Everything is absolutely, completely fine. Narrator note: it is not, in fact, fine.',
  },
  poet_narrator: {
    voice: 'LITERARY',
    detailLevel: 'DENSE',
    emotionalLeakage: true,
    narrativeHooks: ['Beauty in everything', 'Prose breathes', 'Language is music'],
    openingStyle: 'There is a moment—between heartbeats, between breaths—where the world hangs suspended in amber light. This is such a moment. This is your beginning.',
  },
  noir_narrator: {
    voice: 'NOIR',
    detailLevel: 'RICH',
    emotionalLeakage: true,
    narrativeHooks: ['Shadows have secrets', 'Everyone lies', 'The city is cruel'],
    openingStyle: 'The rain hasn\'t stopped in three days. Neither have the lies. This city chews up the honest and spits out the survivors. You\'re still here. Make of that what you will.',
  },
};

/**
 * Get the narrator profile for a specific director type
 */
export function getDirectorNarratorProfile(directorType: DirectorType): DirectorNarratorProfile {
  return DIRECTOR_NARRATOR_PROFILES[directorType];
}

/**
 * Build narrator prompt block for AI based on director type
 */
export function buildDirectorNarratorPrompt(settings: DirectorSettings): string {
  if (!settings.enabled || settings.rawGame) {
    return '';
  }
  
  const narratorProfile = DIRECTOR_NARRATOR_PROFILES[settings.directorType];
  const typeProfile = DIRECTOR_TYPES[settings.directorType];
  
  const voiceInstructions: Record<DirectorNarratorVoice, string> = {
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
  
  const detailInstructions: Record<string, string> = {
    'SPARSE': 'Minimal description. Let gaps speak. Each word earns its place.',
    'MODERATE': 'Balance description with forward momentum. Paint enough to see, not so much to slow.',
    'RICH': 'Layer sensory details to build atmosphere. Immerse the reader in every scene.',
    'DENSE': 'Miss nothing. Every surface tells a story. The world is thick with meaning.',
  };
  
  return `
## DIRECTOR NARRATOR PERSONALITY: ${typeProfile.name.toUpperCase()}

NARRATOR VOICE: ${narratorProfile.voice}
${voiceInstructions[narratorProfile.voice]}

DETAIL LEVEL: ${narratorProfile.detailLevel}
${detailInstructions[narratorProfile.detailLevel]}

${narratorProfile.emotionalLeakage ? 'EMOTIONAL BLEED: ENABLED - Allow the player character\'s emotional state to color perception.' : 'EMOTIONAL BLEED: DISABLED - Maintain narrative distance from character emotions.'}

DIRECTOR STYLE NOTES:
${typeProfile.styleNotes.map(note => `• ${note}`).join('\n')}

NARRATIVE HOOKS TO USE:
${narratorProfile.narrativeHooks.map(hook => `• ${hook}`).join('\n')}
`;
}

/**
 * Get the opening narrative style for a director type
 */
export function getDirectorOpeningStyle(directorType: DirectorType): string {
  return DIRECTOR_NARRATOR_PROFILES[directorType].openingStyle;
}
