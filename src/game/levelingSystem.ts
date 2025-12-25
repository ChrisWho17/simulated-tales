// Automatic Leveling System
// XP is action-derived, stat-weighted, and genre-filtered
// Level-ups occur ONLY at chapter endings

import { CharacterStats } from '@/types/rpgCharacter';
import { GameGenre } from '@/types/genreData';

// ===== TYPES =====

export interface XPEvent {
  xp: number;
  source: XPSource;
  difficulty: XPDifficulty;
  risk: XPRisk;
  contributingStats: Partial<Record<keyof CharacterStats, number>>; // Stat weights (must total 1.0)
  genre: GameGenre;
  chapter: number;
  isNeutral?: boolean; // Neutral XP (small, no stat weight)
  narrativeReason?: string;
}

export type XPSource = 
  | 'combat_success' 
  | 'social_success' 
  | 'exploration_success' 
  | 'moral_success' 
  | 'quest_completion'
  | 'survival'
  | 'neutral_progression';

export type XPDifficulty = 'trivial' | 'standard' | 'high' | 'extreme';
export type XPRisk = 'low' | 'moderate' | 'high' | 'lethal';

// Stat momentum pool - accumulates influence from XP events
export interface StatMomentum {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Level-up choice presented to player
export interface LevelUpChoice {
  id: string;
  name: string;
  description: string;
  statChanges: Partial<CharacterStats>; // +1 or +2 stat changes
  narrativeFlavor: string;
}

// Player's leveling state
export interface LevelingState {
  currentXP: number;
  xpThreshold: number; // XP needed for next level
  currentChapter: number;
  statMomentum: StatMomentum;
  xpHistory: XPEvent[];
  pendingLevelUp: boolean;
  isChapterEnd: boolean;
  levelUpType: 'standard' | 'chapter_reward' | null;
}

// ===== CONSTANTS =====

const DIFFICULTY_MULTIPLIERS: Record<XPDifficulty, number> = {
  trivial: 0.5,
  standard: 1.0,
  high: 1.5,
  extreme: 2.0,
};

const RISK_MULTIPLIERS: Record<XPRisk, number> = {
  low: 0.8,
  moderate: 1.0,
  high: 1.3,
  lethal: 1.7,
};

const BASE_XP_THRESHOLD = 200; // Level 1 -> 2 requires 200 XP
const THRESHOLD_GROWTH_RATE = 1.10; // 10% increase per level

const NEUTRAL_XP_MIN = 1;
const NEUTRAL_XP_MAX = 3;

// Genre stat biases - filters which stats CAN appear in level-up choices
const GENRE_STAT_BIASES: Record<GameGenre, (keyof CharacterStats)[]> = {
  fantasy: ['strength', 'dexterity', 'constitution', 'wisdom', 'charisma', 'intelligence'],
  scifi: ['intelligence', 'dexterity', 'charisma', 'constitution', 'wisdom', 'strength'],
  horror: ['constitution', 'wisdom', 'charisma', 'dexterity', 'intelligence', 'strength'],
  mystery: ['intelligence', 'wisdom', 'charisma', 'dexterity', 'constitution', 'strength'],
  pirate: ['dexterity', 'constitution', 'charisma', 'strength', 'wisdom', 'intelligence'],
  western: ['dexterity', 'constitution', 'charisma', 'wisdom', 'strength', 'intelligence'],
  cyberpunk: ['intelligence', 'dexterity', 'charisma', 'constitution', 'wisdom', 'strength'],
  postapoc: ['constitution', 'dexterity', 'wisdom', 'strength', 'intelligence', 'charisma'],
  war: ['constitution', 'strength', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
  custom: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
};

// Thematic choice names by stat
const CHOICE_THEMES: Record<keyof CharacterStats, string[]> = {
  strength: ['Hardened Muscle', 'Raw Power', 'Iron Grip', 'Brutal Force', 'Titanic Might'],
  dexterity: ['Swift Reflexes', 'Shadow Step', 'Nimble Fingers', 'Cat\'s Grace', 'Blade Dancer'],
  constitution: ['Survivor\'s Will', 'Unbreakable', 'Scarred Endurance', 'Iron Constitution', 'Weathered Soul'],
  intelligence: ['Sharp Mind', 'Calculated Insight', 'Tactical Genius', 'Learned Scholar', 'Keen Analysis'],
  wisdom: ['Deep Insight', 'Sixth Sense', 'Sage\'s Eye', 'Intuitive Soul', 'Watchful Guardian'],
  charisma: ['Silver Tongue', 'Natural Leader', 'Magnetic Presence', 'Voice of Command', 'Inspiring Aura'],
};

// Combined choice themes for +1/+1 splits
const DUAL_STAT_THEMES: Record<string, string[]> = {
  'strength_dexterity': ['Steel and Speed', 'Warrior\'s Balance', 'Swift Striker'],
  'strength_constitution': ['Mountain\'s Resolve', 'Unmoving Titan', 'Bearer of Burdens'],
  'dexterity_constitution': ['Survivor\'s Instinct', 'Fleet-Footed Endurance', 'Untouchable'],
  'intelligence_wisdom': ['Grim Insight', 'Mind and Soul', 'Scholar\'s Wisdom'],
  'charisma_wisdom': ['Empathic Leader', 'Sage\'s Voice', 'Soul Reader'],
  'charisma_intelligence': ['Mind and Voice', 'Calculated Charm', 'Silver Mind'],
  'dexterity_wisdom': ['Predator\'s Calm', 'Hunter\'s Instinct', 'Watchful Blade'],
  'constitution_wisdom': ['Tested Will', 'Enduring Wisdom', 'Patient Survivor'],
  'strength_wisdom': ['Warrior Sage', 'Battle Wisdom', 'Tempered Might'],
  'strength_charisma': ['Commanding Presence', 'Battle Leader', 'Iron Voice'],
  'dexterity_charisma': ['Graceful Presence', 'Shadow Diplomat', 'Deft Charm'],
  'dexterity_intelligence': ['Clever Fingers', 'Quick Thinking', 'Tactical Speed'],
};

// ===== FUNCTIONS =====

/**
 * Initialize a fresh leveling state for a new character
 */
export function createLevelingState(startingLevel: number = 1): LevelingState {
  return {
    currentXP: 0,
    xpThreshold: calculateXPThreshold(startingLevel),
    currentChapter: 1,
    statMomentum: createEmptyMomentum(),
    xpHistory: [],
    pendingLevelUp: false,
    isChapterEnd: false,
    levelUpType: null,
  };
}

function createEmptyMomentum(): StatMomentum {
  return {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };
}

/**
 * Calculate XP threshold for a given level (10% increase per level)
 */
export function calculateXPThreshold(level: number): number {
  let threshold = BASE_XP_THRESHOLD;
  for (let i = 1; i < level; i++) {
    threshold = Math.ceil(threshold * THRESHOLD_GROWTH_RATE);
  }
  return threshold;
}

/**
 * Calculate base XP value with difficulty and risk multipliers
 */
export function calculateBaseXP(
  baseValue: number,
  difficulty: XPDifficulty,
  risk: XPRisk
): number {
  return Math.round(baseValue * DIFFICULTY_MULTIPLIERS[difficulty] * RISK_MULTIPLIERS[risk]);
}

/**
 * Process an XP event and update leveling state
 */
export function processXPEvent(
  state: LevelingState,
  event: XPEvent
): LevelingState {
  const newState = { ...state };
  
  // Add to history
  newState.xpHistory = [...state.xpHistory, event];
  
  // Add to total XP
  newState.currentXP = state.currentXP + event.xp;
  
  // Update stat momentum (only for non-neutral XP)
  if (!event.isNeutral && event.contributingStats) {
    const momentum = { ...state.statMomentum };
    for (const [stat, weight] of Object.entries(event.contributingStats)) {
      if (weight && weight > 0) {
        const statKey = stat as keyof CharacterStats;
        momentum[statKey] = (momentum[statKey] || 0) + (event.xp * weight);
      }
    }
    newState.statMomentum = momentum;
  }
  
  return newState;
}

/**
 * Create a neutral XP event (1-3 XP, no stat weighting)
 */
export function createNeutralXPEvent(
  chapter: number,
  genre: GameGenre,
  reason: string = 'Scene progression'
): XPEvent {
  const xp = Math.floor(Math.random() * (NEUTRAL_XP_MAX - NEUTRAL_XP_MIN + 1)) + NEUTRAL_XP_MIN;
  
  return {
    xp,
    source: 'neutral_progression',
    difficulty: 'trivial',
    risk: 'low',
    contributingStats: {},
    genre,
    chapter,
    isNeutral: true,
    narrativeReason: reason,
  };
}

/**
 * Check if level-up is available at chapter end
 */
export function checkLevelUp(
  state: LevelingState,
  isChapterEnd: boolean
): LevelingState {
  const newState = { ...state, isChapterEnd };
  
  if (!isChapterEnd) {
    return newState;
  }
  
  // Check if XP threshold is met
  if (state.currentXP >= state.xpThreshold) {
    newState.pendingLevelUp = true;
    newState.levelUpType = isChapterEnd ? 'chapter_reward' : 'standard';
  }
  
  return newState;
}

/**
 * Get top stats from momentum pool for choice generation
 */
function getTopStatsByMomentum(
  momentum: StatMomentum,
  count: number,
  genre: GameGenre
): (keyof CharacterStats)[] {
  const genreBias = GENRE_STAT_BIASES[genre] || GENRE_STAT_BIASES.fantasy;
  
  // Calculate total momentum
  const totalMomentum = Object.values(momentum).reduce((a, b) => a + b, 0);
  
  // Filter stats by minimum contribution (>10%)\\n  const eligibleStats = Object.entries(momentum)
  // Filter stats by minimum contribution (>10%)
  const eligibleStats = Object.entries(momentum)
    .filter(([_, value]) => totalMomentum === 0 || value / totalMomentum >= 0.10)
    .map(([stat]) => stat as keyof CharacterStats);
  
  // Sort by momentum value (descending)
  const sorted = (eligibleStats.length > 0 ? eligibleStats : genreBias.slice(0, 3))
    .sort((a, b) => momentum[b] - momentum[a]);
  
  // Apply genre filtering - prioritize stats that are in genre bias
  const genreFiltered = sorted.sort((a, b) => {
    const aIdx = genreBias.indexOf(a);
    const bIdx = genreBias.indexOf(b);
    // If momentum is equal-ish, prefer genre-favored stats
    const momDiff = Math.abs(momentum[a] - momentum[b]);
    if (momDiff < 5) {
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    }
    return momentum[b] - momentum[a];
  });
  
  return genreFiltered.slice(0, count);
}

/**
 * Generate level-up choices based on stat momentum and genre
 * Standard level-up: 3 choices, +1 stat each
 * Chapter reward: 6 choices, +2 stats each (stacked or split)
 */
export function generateLevelUpChoices(
  state: LevelingState,
  genre: GameGenre,
  characterClass?: string,
  isChapterReward: boolean = false
): LevelUpChoice[] {
  const choiceCount = isChapterReward ? 6 : 3;
  const statCount = isChapterReward ? 4 : 3; // More stats to work with for chapter reward
  
  const topStats = getTopStatsByMomentum(state.statMomentum, statCount, genre);
  const choices: LevelUpChoice[] = [];
  
  if (isChapterReward) {
    // Generate 6 choices with +2 total (stacked or split)
    // 2-3 stacked (+2 to one stat), 3-4 split (+1/+1)
    
    // Stacked choices (+2 to single stat)
    for (let i = 0; i < Math.min(2, topStats.length); i++) {
      const stat = topStats[i];
      const themes = CHOICE_THEMES[stat];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      
      choices.push({
        id: `stacked_${stat}_${i}`,
        name: theme,
        description: `Your experiences have forged unparalleled ${stat}.`,
        statChanges: { [stat]: 2 },
        narrativeFlavor: `You carry yourself differently now. The weight of your journey has strengthened your ${stat} beyond measure.`,
      });
    }
    
    // Split choices (+1/+1 to two stats)
    const usedPairs = new Set<string>();
    for (let i = 0; i < 4 && choices.length < 6; i++) {
      const stat1 = topStats[i % topStats.length];
      const stat2 = topStats[(i + 1) % topStats.length];
      
      if (stat1 === stat2) continue;
      
      const pairKey = [stat1, stat2].sort().join('_');
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      
      const dualThemes = DUAL_STAT_THEMES[pairKey] || [`${stat1} & ${stat2} Growth`];
      const theme = dualThemes[Math.floor(Math.random() * dualThemes.length)];
      
      choices.push({
        id: `split_${pairKey}_${i}`,
        name: theme,
        description: `Balance between ${stat1} and ${stat2}.`,
        statChanges: { [stat1]: 1, [stat2]: 1 },
        narrativeFlavor: `Your growth reflects the dual nature of your adventures, strengthening both ${stat1} and ${stat2}.`,
      });
    }
    
    // Fill remaining slots with additional stacked if needed
    while (choices.length < 6 && topStats.length > 0) {
      const stat = topStats[choices.length % topStats.length];
      const themes = CHOICE_THEMES[stat];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      
      if (!choices.some(c => c.id.includes(`stacked_${stat}`))) {
        choices.push({
          id: `stacked_${stat}_extra`,
          name: theme,
          description: `Deep mastery of ${stat}.`,
          statChanges: { [stat]: 2 },
          narrativeFlavor: `Your ${stat} reaches new heights.`,
        });
      } else {
        // Add a split with a new combination
        const otherStat = topStats.find(s => s !== stat) || 'wisdom';
        choices.push({
          id: `split_extra_${choices.length}`,
          name: `Balanced Growth`,
          description: `${stat} and ${otherStat} improve together.`,
          statChanges: { [stat]: 1, [otherStat as keyof CharacterStats]: 1 },
          narrativeFlavor: `Experience shapes both ${stat} and ${otherStat}.`,
        });
      }
    }
  } else {
    // Standard level-up: 3 choices, +1 stat each
    for (let i = 0; i < Math.min(3, topStats.length); i++) {
      const stat = topStats[i];
      const themes = CHOICE_THEMES[stat];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      
      choices.push({
        id: `standard_${stat}_${i}`,
        name: theme,
        description: `Your ${stat} has grown through experience.`,
        statChanges: { [stat]: 1 },
        narrativeFlavor: `People notice the change in you. Your ${stat} has been tempered by your journey.`,
      });
    }
    
    // Ensure we have at least 3 choices
    const allStats: (keyof CharacterStats)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    while (choices.length < 3) {
      const unusedStats = allStats.filter(s => !topStats.includes(s));
      const stat = unusedStats[Math.floor(Math.random() * unusedStats.length)] || 'constitution';
      const themes = CHOICE_THEMES[stat];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      
      choices.push({
        id: `standard_${stat}_fallback`,
        name: theme,
        description: `Unexpected growth in ${stat}.`,
        statChanges: { [stat]: 1 },
        narrativeFlavor: `Surprising yourself, your ${stat} has improved.`,
      });
    }
  }
  
  return choices.slice(0, choiceCount);
}

/**
 * Apply a level-up choice and update state
 */
export function applyLevelUp(
  state: LevelingState,
  choice: LevelUpChoice,
  currentLevel: number
): { newState: LevelingState; statChanges: Partial<CharacterStats>; newLevel: number } {
  const levelsGained = state.levelUpType === 'chapter_reward' ? 2 : 1;
  const newLevel = currentLevel + levelsGained;
  
  // Calculate new XP threshold based on new level
  const newThreshold = calculateXPThreshold(newLevel);
  
  // Carry over excess XP
  const excessXP = state.currentXP - state.xpThreshold;
  
  // Reset momentum for next level cycle (keeps some carry-over)
  const newMomentum: StatMomentum = {
    strength: state.statMomentum.strength * 0.3,
    dexterity: state.statMomentum.dexterity * 0.3,
    constitution: state.statMomentum.constitution * 0.3,
    intelligence: state.statMomentum.intelligence * 0.3,
    wisdom: state.statMomentum.wisdom * 0.3,
    charisma: state.statMomentum.charisma * 0.3,
  };

  const newState: LevelingState = {
    ...state,
    currentXP: Math.max(0, excessXP),
    xpThreshold: newThreshold,
    pendingLevelUp: false,
    levelUpType: null,
    isChapterEnd: false,
    statMomentum: newMomentum,
  };
  
  return {
    newState,
    statChanges: choice.statChanges,
    newLevel,
  };
}

/**
 * Advance to next chapter
 */
export function advanceChapter(state: LevelingState): LevelingState {
  return {
    ...state,
    currentChapter: state.currentChapter + 1,
    isChapterEnd: false,
  };
}

/**
 * Parse XP source from action description
 */
export function inferXPSource(action: string, narrative: string): XPSource {
  const lower = (action + ' ' + narrative).toLowerCase();
  
  if (lower.includes('combat') || lower.includes('fight') || lower.includes('attack') || lower.includes('defeat')) {
    return 'combat_success';
  }
  if (lower.includes('persuad') || lower.includes('convince') || lower.includes('charm') || lower.includes('negotiate')) {
    return 'social_success';
  }
  if (lower.includes('discover') || lower.includes('explore') || lower.includes('find') || lower.includes('search')) {
    return 'exploration_success';
  }
  if (lower.includes('save') || lower.includes('protect') || lower.includes('sacrifice') || lower.includes('moral')) {
    return 'moral_success';
  }
  if (lower.includes('quest') || lower.includes('complete') || lower.includes('mission') || lower.includes('objective')) {
    return 'quest_completion';
  }
  if (lower.includes('survive') || lower.includes('escape') || lower.includes('endure')) {
    return 'survival';
  }
  
  return 'neutral_progression';
}

/**
 * Infer contributing stats from XP source
 */
export function inferContributingStats(
  source: XPSource,
  action: string
): Partial<Record<keyof CharacterStats, number>> {
  const lower = action.toLowerCase();
  
  switch (source) {
    case 'combat_success':
      if (lower.includes('magic') || lower.includes('spell')) {
        return { intelligence: 0.6, wisdom: 0.4 };
      }
      if (lower.includes('dodge') || lower.includes('sneak') || lower.includes('quick')) {
        return { dexterity: 0.6, strength: 0.4 };
      }
      return { strength: 0.5, constitution: 0.3, dexterity: 0.2 };
      
    case 'social_success':
      if (lower.includes('intimidat')) {
        return { charisma: 0.5, strength: 0.3, constitution: 0.2 };
      }
      if (lower.includes('lie') || lower.includes('deceiv')) {
        return { charisma: 0.6, intelligence: 0.4 };
      }
      return { charisma: 0.6, wisdom: 0.4 };
      
    case 'exploration_success':
      if (lower.includes('trap') || lower.includes('lock')) {
        return { dexterity: 0.5, intelligence: 0.3, wisdom: 0.2 };
      }
      return { wisdom: 0.4, intelligence: 0.3, dexterity: 0.3 };
      
    case 'moral_success':
      return { wisdom: 0.5, charisma: 0.3, constitution: 0.2 };
      
    case 'quest_completion':
      return { wisdom: 0.3, intelligence: 0.3, charisma: 0.2, constitution: 0.2 };
      
    case 'survival':
      return { constitution: 0.5, dexterity: 0.3, wisdom: 0.2 };
      
    default:
      return {};
  }
}

/**
 * Create a structured XP event from raw data
 */
export function createXPEvent(
  amount: number,
  reason: string,
  action: string,
  genre: GameGenre,
  chapter: number,
  difficulty: XPDifficulty = 'standard',
  risk: XPRisk = 'moderate'
): XPEvent {
  const source = inferXPSource(action, reason);
  const contributingStats = inferContributingStats(source, action);
  
  return {
    xp: calculateBaseXP(amount, difficulty, risk),
    source,
    difficulty,
    risk,
    contributingStats,
    genre,
    chapter,
    narrativeReason: reason,
  };
}
