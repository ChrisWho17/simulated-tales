// ============================================================================
// ACHIEVEMENT CATALOG — definitions with global | run scope
// ============================================================================
// global: persist across new saves / campaigns (account / app level)
// run:    reset when starting a new adventure so they can be re-earned
// ============================================================================

import type { GameGenre } from '@/types/genreData';

export type AchievementScope = 'global' | 'run';

export type AchievementCategory =
  | 'exploration'
  | 'combat'
  | 'social'
  | 'story'
  | 'secret'
  | 'merchant'
  | 'collector'
  | 'diplomat'
  | 'genre'
  | 'overall';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  /** Persistence scope — global never resets on new save; run resets each tale */
  scope: AchievementScope;
  maxProgress?: number;
  hasRewards?: boolean;
  /** Optional genre tag for genre-scoped achievements */
  genre?: GameGenre;
}

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🏆' },
  { id: 'overall', name: 'Overall', icon: '🌍' },
  { id: 'genre', name: 'Genre', icon: '🎨' },
  { id: 'exploration', name: 'Exploration', icon: '🗺️' },
  { id: 'combat', name: 'Combat', icon: '⚔️' },
  { id: 'social', name: 'Social', icon: '💬' },
  { id: 'story', name: 'Story', icon: '📖' },
  { id: 'merchant', name: 'Merchant', icon: '💰' },
  { id: 'collector', name: 'Collector', icon: '🎁' },
  { id: 'diplomat', name: 'Diplomat', icon: '🤝' },
  { id: 'secret', name: 'Secret', icon: '❓' },
] as const;

/** Genres that get first-play + in-run flavor achievements (excludes custom) */
export const ACHIEVEMENT_GENRES: Array<{ id: GameGenre; name: string; icon: string; firstPlayName: string; firstPlayDesc: string }> = [
  { id: 'fantasy', name: 'Fantasy', icon: '🧙', firstPlayName: 'Enter the Realm', firstPlayDesc: 'Begin a fantasy adventure' },
  { id: 'scifi', name: 'Sci-Fi', icon: '🚀', firstPlayName: 'To the Stars', firstPlayDesc: 'Begin a sci-fi adventure' },
  { id: 'horror', name: 'Horror', icon: '👻', firstPlayName: 'Into the Dark', firstPlayDesc: 'Begin a horror adventure' },
  { id: 'mystery', name: 'Mystery', icon: '🔍', firstPlayName: 'Case Opened', firstPlayDesc: 'Begin a mystery adventure' },
  { id: 'pirate', name: 'Pirate', icon: '🏴‍☠️', firstPlayName: 'Yo Ho Ho', firstPlayDesc: 'Begin a pirate adventure' },
  { id: 'western', name: 'Western', icon: '🤠', firstPlayName: 'Dusty Trails', firstPlayDesc: 'Begin a western adventure' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', firstPlayName: 'Jack In', firstPlayDesc: 'Begin a cyberpunk adventure' },
  { id: 'postapoc', name: 'Post-Apocalyptic', icon: '☢️', firstPlayName: 'Survive the Fall', firstPlayDesc: 'Begin a post-apocalyptic adventure' },
  { id: 'war', name: 'War', icon: '🎖️', firstPlayName: 'Enlisted', firstPlayDesc: 'Begin a war adventure' },
  { id: 'modern_life', name: 'Modern Life', icon: '🏙️', firstPlayName: 'Everyday Hero', firstPlayDesc: 'Begin a modern life adventure' },
];

export const STANDARD_GENRE_COUNT = ACHIEVEMENT_GENRES.length;

function genreFirstPlayAchievements(): AchievementDefinition[] {
  return ACHIEVEMENT_GENRES.map((g) => ({
    id: `genre_first_${g.id}`,
    name: g.firstPlayName,
    description: g.firstPlayDesc,
    icon: g.icon,
    category: 'genre' as const,
    rarity: 'common' as const,
    scope: 'global' as const,
    genre: g.id,
  }));
}

/** Run-scoped flavor unlocks earned during a tale of that genre */
function genreRunAchievements(): AchievementDefinition[] {
  return [
    { id: 'genre_run_fantasy_quest', name: 'Quest Accepted', description: 'Complete a quest in a fantasy tale', icon: '🗡️', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'fantasy' },
    { id: 'genre_run_scifi_contact', name: 'First Contact', description: 'Meet an NPC in a sci-fi tale', icon: '👽', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'scifi' },
    { id: 'genre_run_horror_survive', name: 'Still Breathing', description: 'Win a combat in a horror tale', icon: '🕯️', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'horror' },
    { id: 'genre_run_mystery_clue', name: 'Follow the Clues', description: 'Make 10 choices in a mystery tale', icon: '🧾', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'mystery', maxProgress: 10 },
    { id: 'genre_run_pirate_plunder', name: 'Plunder', description: 'Complete a trade in a pirate tale', icon: '💰', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'pirate' },
    { id: 'genre_run_western_draw', name: 'Quick Draw', description: 'Win a combat in a western tale', icon: '🔫', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'western' },
    { id: 'genre_run_cyber_deal', name: 'Street Deal', description: 'Complete a trade in a cyberpunk tale', icon: '💾', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'cyberpunk' },
    { id: 'genre_run_postapoc_scavenge', name: 'Scavenger', description: 'Find a rare item in a post-apocalyptic tale', icon: '🧰', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'postapoc' },
    { id: 'genre_run_war_medal', name: 'Field Commendation', description: 'Win 3 combats in a war tale', icon: '🏅', category: 'genre', rarity: 'rare', scope: 'run', genre: 'war', maxProgress: 3 },
    { id: 'genre_run_modern_bond', name: 'Real Connection', description: 'Recruit a companion in a modern life tale', icon: '☕', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'modern_life' },
    { id: 'genre_run_custom_world', name: 'House Rules', description: 'Complete a quest in a custom genre tale', icon: '✨', category: 'genre', rarity: 'uncommon', scope: 'run', genre: 'custom' },
  ];
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ========== OVERALL / APPLICATION (global) ==========
  { id: 'dust_off_the_cover', name: 'Dust Off the Cover', description: 'Complete the tutorial and begin your first adventure', icon: '📕', category: 'overall', rarity: 'common', scope: 'global' },
  { id: 'first_adventure', name: 'Once Upon a Time', description: 'Start your first adventure', icon: '📖', category: 'overall', rarity: 'common', scope: 'global' },
  { id: 'campaigns_three', name: 'Serial Storyteller', description: 'Start 3 different adventures', icon: '📚', category: 'overall', rarity: 'uncommon', scope: 'global', maxProgress: 3 },
  { id: 'campaigns_ten', name: 'Archive Keeper', description: 'Start 10 different adventures', icon: '🏛️', category: 'overall', rarity: 'rare', scope: 'global', maxProgress: 10 },
  { id: 'genre_variety_3', name: 'Genre Hopper', description: 'Play 3 different genres', icon: '🎨', category: 'overall', rarity: 'uncommon', scope: 'global', maxProgress: 3 },
  { id: 'genre_variety_5', name: 'Genre Explorer', description: 'Play 5 different genres', icon: '🌈', category: 'overall', rarity: 'rare', scope: 'global', maxProgress: 5 },
  { id: 'genre_variety_all', name: 'Polyglot Adventurer', description: 'Play every standard genre', icon: '🎭', category: 'overall', rarity: 'legendary', scope: 'global', maxProgress: STANDARD_GENRE_COUNT },
  { id: 'companion_lifetime_first', name: 'Never Walk Alone', description: 'Recruit your first companion (ever)', icon: '🤝', category: 'overall', rarity: 'common', scope: 'global' },
  { id: 'companion_lifetime_five', name: 'Found Family', description: 'Recruit 5 companions across all tales', icon: '👥', category: 'overall', rarity: 'rare', scope: 'global', maxProgress: 5 },
  { id: 'romance_spark', name: 'Sparks Fly', description: 'Progress a romance with an NPC', icon: '💕', category: 'overall', rarity: 'uncommon', scope: 'global' },

  // ========== GENRE FIRST-PLAY (global) ==========
  ...genreFirstPlayAchievements(),
  { id: 'genre_first_custom', name: 'Worldsmith', description: 'Begin a custom genre adventure', icon: '🧩', category: 'genre', rarity: 'uncommon', scope: 'global', genre: 'custom' },
  { id: 'genre_master', name: 'Genre Master', description: 'Unlock every genre first-play achievement', icon: '👑', category: 'genre', rarity: 'legendary', scope: 'global' },

  // ========== GENRE RUN FLAVOR ==========
  ...genreRunAchievements(),

  // ========== EXPLORATION (run) ==========
  { id: 'first_steps', name: 'First Steps', description: 'Visit your first location', icon: '👣', category: 'exploration', rarity: 'common', scope: 'run' },
  { id: 'wanderer', name: 'Wanderer', description: 'Visit 5 different locations', icon: '🗺️', category: 'exploration', rarity: 'uncommon', scope: 'run', maxProgress: 5 },
  { id: 'explorer', name: 'Explorer', description: 'Visit 15 different locations', icon: '🧭', category: 'exploration', rarity: 'rare', scope: 'run', maxProgress: 15 },
  { id: 'cartographer', name: 'Cartographer', description: 'Visit 30 different locations', icon: '📍', category: 'exploration', rarity: 'epic', scope: 'run', maxProgress: 30 },

  // ========== COMBAT (run) ==========
  { id: 'first_blood', name: 'First Blood', description: 'Win your first combat', icon: '⚔️', category: 'combat', rarity: 'common', scope: 'run' },
  { id: 'survivor', name: 'Survivor', description: 'Win 5 combats', icon: '🛡️', category: 'combat', rarity: 'uncommon', scope: 'run', maxProgress: 5 },
  { id: 'warrior', name: 'Warrior', description: 'Win 20 combats', icon: '🗡️', category: 'combat', rarity: 'rare', scope: 'run', maxProgress: 20 },
  { id: 'champion', name: 'Champion', description: 'Win a combat without taking damage', icon: '👑', category: 'combat', rarity: 'epic', scope: 'run' },
  { id: 'pacifist', name: 'Pacifist', description: 'De-escalate 5 potential combats', icon: '🕊️', category: 'combat', rarity: 'rare', scope: 'run', maxProgress: 5 },

  // ========== SOCIAL (run) ==========
  { id: 'hello_stranger', name: 'Hello, Stranger', description: 'Meet your first NPC', icon: '👋', category: 'social', rarity: 'common', scope: 'run' },
  { id: 'socialite', name: 'Socialite', description: 'Meet 10 different NPCs', icon: '🤝', category: 'social', rarity: 'uncommon', scope: 'run', maxProgress: 10 },
  { id: 'networker', name: 'Networker', description: 'Meet 25 different NPCs', icon: '🌐', category: 'social', rarity: 'rare', scope: 'run', maxProgress: 25 },
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Succeed in 10 persuasion checks', icon: '💬', category: 'social', rarity: 'rare', scope: 'run', maxProgress: 10 },
  { id: 'trusted_ally', name: 'Trusted Ally', description: 'Reach maximum trust with an NPC', icon: '💖', category: 'social', rarity: 'epic', scope: 'run' },
  { id: 'party_of_two', name: 'Party of Two', description: 'Recruit a companion in this tale', icon: '🧭', category: 'social', rarity: 'common', scope: 'run' },
  { id: 'full_party', name: 'Full Party', description: 'Recruit 3 companions in this tale', icon: '🏕️', category: 'social', rarity: 'rare', scope: 'run', maxProgress: 3 },

  // ========== STORY (run) ==========
  { id: 'chapter_one', name: 'Chapter One', description: 'Complete your first quest', icon: '📖', category: 'story', rarity: 'common', scope: 'run' },
  { id: 'storyteller', name: 'Storyteller', description: 'Complete 5 quests', icon: '📚', category: 'story', rarity: 'uncommon', scope: 'run', maxProgress: 5 },
  { id: 'legend', name: 'Legend', description: 'Complete 15 quests', icon: '🏆', category: 'story', rarity: 'rare', scope: 'run', maxProgress: 15 },
  { id: 'decisive', name: 'Decisive', description: 'Make 100 choices', icon: '🎯', category: 'story', rarity: 'rare', scope: 'run', maxProgress: 100 },

  // ========== MERCHANT (run) ==========
  { id: 'first_sale', name: 'First Sale', description: 'Complete your first trade', icon: '💰', category: 'merchant', rarity: 'common', scope: 'run' },
  { id: 'haggler', name: 'Haggler', description: 'Successfully negotiate 5 trades', icon: '🤑', category: 'merchant', rarity: 'uncommon', scope: 'run', maxProgress: 5 },
  { id: 'shrewd_trader', name: 'Shrewd Trader', description: 'Complete 20 profitable trades', icon: '📊', category: 'merchant', rarity: 'rare', scope: 'run', maxProgress: 20 },
  { id: 'merchant_prince', name: 'Merchant Prince', description: 'Amass 10,000 currency through trade', icon: '👑', category: 'merchant', rarity: 'epic', scope: 'run', maxProgress: 10000 },
  { id: 'black_market', name: 'Black Market', description: 'Trade illegal or contraband items', icon: '🕶️', category: 'merchant', rarity: 'rare', scope: 'run' },

  // ========== COLLECTOR (run) ==========
  { id: 'magpie', name: 'Magpie', description: 'Collect your first rare item', icon: '🎁', category: 'collector', rarity: 'common', scope: 'run' },
  { id: 'hoarder', name: 'Hoarder', description: 'Own 50 items simultaneously', icon: '📦', category: 'collector', rarity: 'uncommon', scope: 'run', maxProgress: 50 },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Find 10 rare or better items', icon: '💎', category: 'collector', rarity: 'rare', scope: 'run', maxProgress: 10 },
  { id: 'curator', name: 'Curator', description: 'Collect one item from 5 different categories', icon: '🏛️', category: 'collector', rarity: 'rare', scope: 'run', maxProgress: 5 },
  { id: 'legendary_finder', name: 'Legendary Finder', description: 'Discover a legendary artifact', icon: '⭐', category: 'collector', rarity: 'legendary', scope: 'run' },

  // ========== DIPLOMAT (run) ==========
  { id: 'ambassador', name: 'Ambassador', description: 'Form your first alliance', icon: '🤝', category: 'diplomat', rarity: 'common', scope: 'run' },
  { id: 'peacekeeper', name: 'Peacekeeper', description: 'Resolve 3 conflicts peacefully', icon: '☮️', category: 'diplomat', rarity: 'uncommon', scope: 'run', maxProgress: 3 },
  { id: 'faction_friend', name: 'Faction Friend', description: 'Gain positive standing with 3 factions', icon: '🏰', category: 'diplomat', rarity: 'rare', scope: 'run', maxProgress: 3 },
  { id: 'grand_alliance', name: 'Grand Alliance', description: 'Unite 5 different factions', icon: '🌍', category: 'diplomat', rarity: 'epic', scope: 'run', maxProgress: 5 },
  { id: 'world_peace', name: 'World Peace', description: 'Achieve positive standing with all factions', icon: '🕊️', category: 'diplomat', rarity: 'legendary', scope: 'run' },

  // ========== SECRET / META ==========
  { id: 'lucky_roll', name: 'Lucky Roll', description: 'Roll a natural 20', icon: '🎲', category: 'secret', rarity: 'uncommon', scope: 'run' },
  { id: 'unlucky', name: 'Unlucky', description: 'Roll a natural 1', icon: '💀', category: 'secret', rarity: 'uncommon', scope: 'run' },
  { id: 'persistent', name: 'Persistent', description: 'Play for 1 hour in a single session', icon: '⏰', category: 'secret', rarity: 'rare', scope: 'run' },
  { id: 'dedicated', name: 'Dedicated', description: 'Play for 5 hours total', icon: '🎮', category: 'secret', rarity: 'epic', scope: 'global', maxProgress: 5 },
  { id: 'marathon', name: 'Marathon Runner', description: 'Play for 10 consecutive hours', icon: '🏃', category: 'secret', rarity: 'legendary', scope: 'run', maxProgress: 10 },
  { id: 'night_owl', name: 'Night Owl', description: 'Play past midnight', icon: '🦉', category: 'secret', rarity: 'uncommon', scope: 'global' },
  { id: 'early_bird', name: 'Early Bird', description: 'Play between 5 AM and 7 AM', icon: '🌅', category: 'secret', rarity: 'uncommon', scope: 'global' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Play for 3+ hours on a weekend', icon: '🎯', category: 'secret', rarity: 'rare', scope: 'global' },
  { id: 'daily_player', name: 'Daily Player', description: 'Play for 3 consecutive days', icon: '📅', category: 'secret', rarity: 'uncommon', scope: 'global', maxProgress: 3 },
  { id: 'weekly_streak', name: 'Weekly Streak', description: 'Play for 7 consecutive days', icon: '📆', category: 'secret', rarity: 'rare', scope: 'global', maxProgress: 7 },
  { id: 'monthly_dedication', name: 'Monthly Dedication', description: 'Play for 30 consecutive days', icon: '🗓️', category: 'secret', rarity: 'legendary', scope: 'global', maxProgress: 30 },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Return after a 7+ day break', icon: '🔄', category: 'secret', rarity: 'uncommon', scope: 'global' },

  // Category completion (run) — re-earnable each tale
  { id: 'exploration_master', name: 'Exploration Master', description: 'Complete all exploration achievements in this tale', icon: '🗺️', category: 'secret', rarity: 'epic', scope: 'run' },
  { id: 'combat_master', name: 'Combat Master', description: 'Complete all combat achievements in this tale', icon: '⚔️', category: 'secret', rarity: 'epic', scope: 'run' },
  { id: 'social_master', name: 'Social Master', description: 'Complete all social achievements in this tale', icon: '💬', category: 'secret', rarity: 'epic', scope: 'run' },
  { id: 'story_master', name: 'Story Master', description: 'Complete all story achievements in this tale', icon: '📖', category: 'secret', rarity: 'epic', scope: 'run' },
  { id: 'merchant_master', name: 'Merchant Master', description: 'Complete all merchant achievements in this tale', icon: '💰', category: 'secret', rarity: 'epic', scope: 'run' },
  { id: 'collector_master', name: 'Collector Master', description: 'Complete all collector achievements in this tale', icon: '🎁', category: 'secret', rarity: 'epic', scope: 'run' },
  { id: 'diplomat_master', name: 'Diplomat Master', description: 'Complete all diplomat achievements in this tale', icon: '🤝', category: 'secret', rarity: 'epic', scope: 'run' },

  // Global completionists
  { id: 'global_completionist', name: 'Chronicler', description: 'Unlock every overall and genre first-play achievement', icon: '📜', category: 'overall', rarity: 'legendary', scope: 'global' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Unlock every achievement in the game', icon: '👑', category: 'secret', rarity: 'legendary', scope: 'global' },
  { id: 'cheater', name: 'I Saw What You Did', description: 'I saw what you did 👀', icon: '👀', category: 'secret', rarity: 'legendary', scope: 'global' },
];

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

export function getAchievementsByScope(scope: AchievementScope): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.scope === scope);
}

export function genreFirstPlayId(genre: string): string {
  return `genre_first_${genre}`;
}
