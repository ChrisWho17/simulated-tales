// ============================================================================
// LIFETIME ACHIEVEMENTS - Achievements based on cross-session statistics
// ============================================================================

import { LifetimeStatistics } from '@/lib/lifetimeStats';

export interface LifetimeAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'veteran' | 'warrior' | 'explorer' | 'social' | 'collector' | 'economist';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  checkUnlock: (stats: LifetimeStatistics) => boolean;
  getProgress?: (stats: LifetimeStatistics) => { current: number; max: number };
}

export const LIFETIME_ACHIEVEMENTS: LifetimeAchievement[] = [
  // ============= VETERAN (Campaigns & Playtime) =============
  {
    id: 'lifetime_first_campaign',
    name: 'Story Begins',
    description: 'Start your first campaign',
    icon: '📖',
    category: 'veteran',
    rarity: 'common',
    checkUnlock: (s) => s.campaignsStarted >= 1,
  },
  {
    id: 'lifetime_5_campaigns',
    name: 'Seasoned Adventurer',
    description: 'Start 5 campaigns',
    icon: '📚',
    category: 'veteran',
    rarity: 'uncommon',
    checkUnlock: (s) => s.campaignsStarted >= 5,
    getProgress: (s) => ({ current: s.campaignsStarted, max: 5 }),
  },
  {
    id: 'lifetime_10_campaigns',
    name: 'Veteran Storyteller',
    description: 'Start 10 campaigns',
    icon: '🎭',
    category: 'veteran',
    rarity: 'rare',
    checkUnlock: (s) => s.campaignsStarted >= 10,
    getProgress: (s) => ({ current: s.campaignsStarted, max: 10 }),
  },
  {
    id: 'lifetime_25_campaigns',
    name: 'Master of Tales',
    description: 'Start 25 campaigns',
    icon: '👑',
    category: 'veteran',
    rarity: 'epic',
    checkUnlock: (s) => s.campaignsStarted >= 25,
    getProgress: (s) => ({ current: s.campaignsStarted, max: 25 }),
  },
  {
    id: 'lifetime_1hr_playtime',
    name: 'Getting Started',
    description: 'Play for 1 hour total',
    icon: '⏰',
    category: 'veteran',
    rarity: 'common',
    checkUnlock: (s) => s.totalPlaytimeSeconds >= 3600,
    getProgress: (s) => ({ current: Math.floor(s.totalPlaytimeSeconds / 60), max: 60 }),
  },
  {
    id: 'lifetime_10hr_playtime',
    name: 'Dedicated Player',
    description: 'Play for 10 hours total',
    icon: '🎮',
    category: 'veteran',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalPlaytimeSeconds >= 36000,
    getProgress: (s) => ({ current: Math.floor(s.totalPlaytimeSeconds / 3600), max: 10 }),
  },
  {
    id: 'lifetime_50hr_playtime',
    name: 'True Fan',
    description: 'Play for 50 hours total',
    icon: '💎',
    category: 'veteran',
    rarity: 'rare',
    checkUnlock: (s) => s.totalPlaytimeSeconds >= 180000,
    getProgress: (s) => ({ current: Math.floor(s.totalPlaytimeSeconds / 3600), max: 50 }),
  },
  {
    id: 'lifetime_100hr_playtime',
    name: 'Living Legend',
    description: 'Play for 100 hours total',
    icon: '🏆',
    category: 'veteran',
    rarity: 'legendary',
    checkUnlock: (s) => s.totalPlaytimeSeconds >= 360000,
    getProgress: (s) => ({ current: Math.floor(s.totalPlaytimeSeconds / 3600), max: 100 }),
  },
  {
    id: 'lifetime_100_sessions',
    name: 'Regular',
    description: 'Play 100 sessions',
    icon: '📅',
    category: 'veteran',
    rarity: 'epic',
    checkUnlock: (s) => s.totalSessions >= 100,
    getProgress: (s) => ({ current: s.totalSessions, max: 100 }),
  },

  // ============= WARRIOR (Combat) =============
  {
    id: 'lifetime_first_victory',
    name: 'First Victory',
    description: 'Win your first combat ever',
    icon: '⚔️',
    category: 'warrior',
    rarity: 'common',
    checkUnlock: (s) => s.totalCombatEncounters >= 1,
  },
  {
    id: 'lifetime_50_enemies',
    name: 'Seasoned Fighter',
    description: 'Defeat 50 enemies total',
    icon: '🗡️',
    category: 'warrior',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalEnemiesDefeated >= 50,
    getProgress: (s) => ({ current: s.totalEnemiesDefeated, max: 50 }),
  },
  {
    id: 'lifetime_100_enemies',
    name: 'Warrior',
    description: 'Defeat 100 enemies total',
    icon: '🛡️',
    category: 'warrior',
    rarity: 'rare',
    checkUnlock: (s) => s.totalEnemiesDefeated >= 100,
    getProgress: (s) => ({ current: s.totalEnemiesDefeated, max: 100 }),
  },
  {
    id: 'lifetime_500_enemies',
    name: 'Slayer',
    description: 'Defeat 500 enemies total',
    icon: '💀',
    category: 'warrior',
    rarity: 'epic',
    checkUnlock: (s) => s.totalEnemiesDefeated >= 500,
    getProgress: (s) => ({ current: s.totalEnemiesDefeated, max: 500 }),
  },
  {
    id: 'lifetime_1000_enemies',
    name: 'Death Incarnate',
    description: 'Defeat 1000 enemies total',
    icon: '☠️',
    category: 'warrior',
    rarity: 'legendary',
    checkUnlock: (s) => s.totalEnemiesDefeated >= 1000,
    getProgress: (s) => ({ current: s.totalEnemiesDefeated, max: 1000 }),
  },
  {
    id: 'lifetime_100_nat20s',
    name: 'Lucky Streak',
    description: 'Roll 100 natural 20s',
    icon: '🎲',
    category: 'warrior',
    rarity: 'rare',
    checkUnlock: (s) => s.totalNaturalTwenties >= 100,
    getProgress: (s) => ({ current: s.totalNaturalTwenties, max: 100 }),
  },
  {
    id: 'lifetime_10_deaths',
    name: 'Persistent',
    description: 'Die 10 times (and keep coming back)',
    icon: '💪',
    category: 'warrior',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalDeaths >= 10,
    getProgress: (s) => ({ current: s.totalDeaths, max: 10 }),
  },

  // ============= EXPLORER (World) =============
  {
    id: 'lifetime_50_locations',
    name: 'Traveler',
    description: 'Visit 50 locations total',
    icon: '🗺️',
    category: 'explorer',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalLocationsVisited >= 50,
    getProgress: (s) => ({ current: s.totalLocationsVisited, max: 50 }),
  },
  {
    id: 'lifetime_200_locations',
    name: 'World Wanderer',
    description: 'Visit 200 locations total',
    icon: '🧭',
    category: 'explorer',
    rarity: 'rare',
    checkUnlock: (s) => s.totalLocationsVisited >= 200,
    getProgress: (s) => ({ current: s.totalLocationsVisited, max: 200 }),
  },
  {
    id: 'lifetime_25_quests',
    name: 'Quest Hunter',
    description: 'Complete 25 quests total',
    icon: '📜',
    category: 'explorer',
    rarity: 'rare',
    checkUnlock: (s) => s.totalQuestsCompleted >= 25,
    getProgress: (s) => ({ current: s.totalQuestsCompleted, max: 25 }),
  },
  {
    id: 'lifetime_50_secrets',
    name: 'Secret Seeker',
    description: 'Discover 50 secrets total',
    icon: '🔮',
    category: 'explorer',
    rarity: 'rare',
    checkUnlock: (s) => s.totalSecretsDiscovered >= 50,
    getProgress: (s) => ({ current: s.totalSecretsDiscovered, max: 50 }),
  },

  // ============= SOCIAL (NPCs & Choices) =============
  {
    id: 'lifetime_100_npcs',
    name: 'Social Butterfly',
    description: 'Meet 100 NPCs total',
    icon: '👥',
    category: 'social',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalNpcsEncountered >= 100,
    getProgress: (s) => ({ current: s.totalNpcsEncountered, max: 100 }),
  },
  {
    id: 'lifetime_500_npcs',
    name: 'Legendary Networker',
    description: 'Meet 500 NPCs total',
    icon: '🌐',
    category: 'social',
    rarity: 'epic',
    checkUnlock: (s) => s.totalNpcsEncountered >= 500,
    getProgress: (s) => ({ current: s.totalNpcsEncountered, max: 500 }),
  },
  {
    id: 'lifetime_1000_choices',
    name: 'Decisive',
    description: 'Make 1000 choices total',
    icon: '🎯',
    category: 'social',
    rarity: 'rare',
    checkUnlock: (s) => s.totalChoicesMade >= 1000,
    getProgress: (s) => ({ current: s.totalChoicesMade, max: 1000 }),
  },
  {
    id: 'lifetime_5000_choices',
    name: 'Master of Fate',
    description: 'Make 5000 choices total',
    icon: '⚖️',
    category: 'social',
    rarity: 'legendary',
    checkUnlock: (s) => s.totalChoicesMade >= 5000,
    getProgress: (s) => ({ current: s.totalChoicesMade, max: 5000 }),
  },

  // ============= COLLECTOR (Items) =============
  {
    id: 'lifetime_100_items',
    name: 'Collector',
    description: 'Acquire 100 items total',
    icon: '📦',
    category: 'collector',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalItemsAcquired >= 100,
    getProgress: (s) => ({ current: s.totalItemsAcquired, max: 100 }),
  },
  {
    id: 'lifetime_500_items',
    name: 'Hoarder',
    description: 'Acquire 500 items total',
    icon: '🏛️',
    category: 'collector',
    rarity: 'rare',
    checkUnlock: (s) => s.totalItemsAcquired >= 500,
    getProgress: (s) => ({ current: s.totalItemsAcquired, max: 500 }),
  },
  {
    id: 'lifetime_50_crafted',
    name: 'Artisan',
    description: 'Craft 50 items total',
    icon: '🔨',
    category: 'collector',
    rarity: 'rare',
    checkUnlock: (s) => s.totalItemsCrafted >= 50,
    getProgress: (s) => ({ current: s.totalItemsCrafted, max: 50 }),
  },

  // ============= ECONOMIST (Gold) =============
  {
    id: 'lifetime_10k_gold',
    name: 'Wealthy',
    description: 'Earn 10,000 gold total',
    icon: '💰',
    category: 'economist',
    rarity: 'uncommon',
    checkUnlock: (s) => s.totalGoldEarned >= 10000,
    getProgress: (s) => ({ current: s.totalGoldEarned, max: 10000 }),
  },
  {
    id: 'lifetime_100k_gold',
    name: 'Tycoon',
    description: 'Earn 100,000 gold total',
    icon: '💎',
    category: 'economist',
    rarity: 'rare',
    checkUnlock: (s) => s.totalGoldEarned >= 100000,
    getProgress: (s) => ({ current: s.totalGoldEarned, max: 100000 }),
  },
  {
    id: 'lifetime_1m_gold',
    name: 'Dragon\'s Hoard',
    description: 'Earn 1,000,000 gold total',
    icon: '🐉',
    category: 'economist',
    rarity: 'legendary',
    checkUnlock: (s) => s.totalGoldEarned >= 1000000,
    getProgress: (s) => ({ current: s.totalGoldEarned, max: 1000000 }),
  },
  {
    id: 'lifetime_big_spender',
    name: 'Big Spender',
    description: 'Spend 50,000 gold total',
    icon: '💸',
    category: 'economist',
    rarity: 'rare',
    checkUnlock: (s) => s.totalGoldSpent >= 50000,
    getProgress: (s) => ({ current: s.totalGoldSpent, max: 50000 }),
  },

  // ============= GENRE DIVERSITY =============
  {
    id: 'lifetime_5_genres',
    name: 'Genre Explorer',
    description: 'Play 5 different genres',
    icon: '🎨',
    category: 'veteran',
    rarity: 'uncommon',
    checkUnlock: (s) => Object.keys(s.genresPlayed).length >= 5,
    getProgress: (s) => ({ current: Object.keys(s.genresPlayed).length, max: 5 }),
  },
  {
    id: 'lifetime_10_genres',
    name: 'Genre Master',
    description: 'Play 10 different genres',
    icon: '🌈',
    category: 'veteran',
    rarity: 'epic',
    checkUnlock: (s) => Object.keys(s.genresPlayed).length >= 10,
    getProgress: (s) => ({ current: Object.keys(s.genresPlayed).length, max: 10 }),
  },
];

// Storage key for lifetime achievement unlocks
const LIFETIME_ACHIEVEMENTS_KEY = 'untold_lifetime_achievements';

export interface LifetimeAchievementState {
  unlockedIds: string[];
  lastChecked: number;
}

export function loadLifetimeAchievementState(): LifetimeAchievementState {
  try {
    const stored = localStorage.getItem(LIFETIME_ACHIEVEMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[LifetimeAchievements] Failed to load state:', e);
  }
  return { unlockedIds: [], lastChecked: 0 };
}

export function saveLifetimeAchievementState(state: LifetimeAchievementState): void {
  try {
    localStorage.setItem(LIFETIME_ACHIEVEMENTS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[LifetimeAchievements] Failed to save state:', e);
  }
}

export function checkLifetimeAchievements(
  stats: LifetimeStatistics,
  onUnlock: (achievement: LifetimeAchievement) => void
): string[] {
  const state = loadLifetimeAchievementState();
  const newUnlocks: string[] = [];

  for (const achievement of LIFETIME_ACHIEVEMENTS) {
    if (state.unlockedIds.includes(achievement.id)) continue;

    if (achievement.checkUnlock(stats)) {
      newUnlocks.push(achievement.id);
      onUnlock(achievement);
    }
  }

  if (newUnlocks.length > 0) {
    state.unlockedIds.push(...newUnlocks);
    state.lastChecked = Date.now();
    saveLifetimeAchievementState(state);
  }

  return newUnlocks;
}

export function getLifetimeAchievementProgress(
  stats: LifetimeStatistics
): Array<LifetimeAchievement & { unlocked: boolean; progress?: { current: number; max: number } }> {
  const state = loadLifetimeAchievementState();

  return LIFETIME_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: state.unlockedIds.includes(a.id),
    progress: a.getProgress ? a.getProgress(stats) : undefined,
  }));
}
