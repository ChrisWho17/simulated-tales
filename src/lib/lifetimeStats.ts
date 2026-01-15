// ============================================================================
// LIFETIME STATISTICS SYSTEM - Persistent cross-session player statistics
// ============================================================================

const STORAGE_KEY = 'untold_lifetime_stats';

export interface LifetimeStatistics {
  // Time
  totalPlaytimeSeconds: number;
  firstPlayedAt: number;
  lastPlayedAt: number;
  totalSessions: number;
  
  // Campaigns
  campaignsStarted: number;
  campaignsCompleted: number;
  longestCampaignTurns: number;
  longestCampaignName: string;
  
  // Combat records
  totalCombatEncounters: number;
  totalEnemiesDefeated: number;
  totalDeaths: number;
  highestDamageDealt: number;
  longestWinStreak: number;
  currentWinStreak: number;
  
  // Dice records
  totalDiceRolled: number;
  totalNaturalTwenties: number;
  totalNaturalOnes: number;
  totalCriticalSuccesses: number;
  totalCriticalFailures: number;
  
  // Economy
  totalGoldEarned: number;
  totalGoldSpent: number;
  mostGoldAtOnce: number;
  
  // Exploration
  totalLocationsVisited: number;
  totalNpcsEncountered: number;
  totalQuestsCompleted: number;
  totalSecretsDiscovered: number;
  
  // Items
  totalItemsAcquired: number;
  totalItemsCrafted: number;
  totalItemsUsed: number;
  
  // Social
  totalChoicesMade: number;
  totalDialogueExchanges: number;
  
  // Reputation
  totalReputationGained: number;
  totalReputationLost: number;
  factionsEncountered: number;
  
  // Genre diversity
  genresPlayed: Record<string, number>; // genre -> times played
}

export function createDefaultStats(): LifetimeStatistics {
  return {
    totalPlaytimeSeconds: 0,
    firstPlayedAt: Date.now(),
    lastPlayedAt: Date.now(),
    totalSessions: 0,
    
    campaignsStarted: 0,
    campaignsCompleted: 0,
    longestCampaignTurns: 0,
    longestCampaignName: '',
    
    totalCombatEncounters: 0,
    totalEnemiesDefeated: 0,
    totalDeaths: 0,
    highestDamageDealt: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    
    totalDiceRolled: 0,
    totalNaturalTwenties: 0,
    totalNaturalOnes: 0,
    totalCriticalSuccesses: 0,
    totalCriticalFailures: 0,
    
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    mostGoldAtOnce: 0,
    
    totalLocationsVisited: 0,
    totalNpcsEncountered: 0,
    totalQuestsCompleted: 0,
    totalSecretsDiscovered: 0,
    
    totalItemsAcquired: 0,
    totalItemsCrafted: 0,
    totalItemsUsed: 0,
    
    totalChoicesMade: 0,
    totalDialogueExchanges: 0,
    
    totalReputationGained: 0,
    totalReputationLost: 0,
    factionsEncountered: 0,
    
    genresPlayed: {},
  };
}

export function loadLifetimeStats(): LifetimeStatistics {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...createDefaultStats(), ...parsed };
    }
  } catch (e) {
    console.warn('[LifetimeStats] Failed to load:', e);
  }
  return createDefaultStats();
}

export function saveLifetimeStats(stats: LifetimeStatistics): void {
  try {
    stats.lastPlayedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('[LifetimeStats] Failed to save:', e);
  }
}

export function incrementLifetimeStat(
  key: keyof Omit<LifetimeStatistics, 'genresPlayed' | 'longestCampaignName' | 'firstPlayedAt' | 'lastPlayedAt'>,
  amount: number = 1
): void {
  const stats = loadLifetimeStats();
  if (typeof stats[key] === 'number') {
    (stats[key] as number) += amount;
    saveLifetimeStats(stats);
  }
}

export function updateLifetimeRecord(
  key: 'highestDamageDealt' | 'mostGoldAtOnce' | 'longestCampaignTurns' | 'longestWinStreak',
  value: number,
  campaignName?: string
): void {
  const stats = loadLifetimeStats();
  if (value > (stats[key] as number)) {
    (stats[key] as number) = value;
    if (key === 'longestCampaignTurns' && campaignName) {
      stats.longestCampaignName = campaignName;
    }
    saveLifetimeStats(stats);
  }
}

export function recordGenrePlayed(genre: string): void {
  const stats = loadLifetimeStats();
  stats.genresPlayed[genre] = (stats.genresPlayed[genre] || 0) + 1;
  saveLifetimeStats(stats);
}

export function recordSessionStart(): void {
  const stats = loadLifetimeStats();
  stats.totalSessions += 1;
  stats.lastPlayedAt = Date.now();
  saveLifetimeStats(stats);
}

export function addPlaytime(seconds: number): void {
  const stats = loadLifetimeStats();
  stats.totalPlaytimeSeconds += seconds;
  saveLifetimeStats(stats);
}

export function formatLifetimePlaytime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getTopGenres(stats: LifetimeStatistics, count: number = 3): { genre: string; count: number }[] {
  return Object.entries(stats.genresPlayed)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
}

export function mergeSessionStats(sessionStats: {
  combatEncounters?: number;
  enemiesDefeated?: number;
  deathCount?: number;
  damageDealt?: number;
  diceRolled?: number;
  naturalTwenties?: number;
  naturalOnes?: number;
  criticalSuccesses?: number;
  criticalFailures?: number;
  goldEarned?: number;
  goldSpent?: number;
  locationsVisited?: number;
  npcsEncountered?: number;
  questsCompleted?: number;
  secretsDiscovered?: number;
  itemsAcquired?: number;
  itemsCrafted?: number;
  itemsUsed?: number;
  choicesMade?: number;
  dialogueExchanges?: number;
  reputationGained?: number;
  reputationLost?: number;
}): void {
  const stats = loadLifetimeStats();
  
  if (sessionStats.combatEncounters) stats.totalCombatEncounters += sessionStats.combatEncounters;
  if (sessionStats.enemiesDefeated) stats.totalEnemiesDefeated += sessionStats.enemiesDefeated;
  if (sessionStats.deathCount) stats.totalDeaths += sessionStats.deathCount;
  if (sessionStats.damageDealt) stats.totalDiceRolled += sessionStats.damageDealt;
  if (sessionStats.diceRolled) stats.totalDiceRolled += sessionStats.diceRolled;
  if (sessionStats.naturalTwenties) stats.totalNaturalTwenties += sessionStats.naturalTwenties;
  if (sessionStats.naturalOnes) stats.totalNaturalOnes += sessionStats.naturalOnes;
  if (sessionStats.criticalSuccesses) stats.totalCriticalSuccesses += sessionStats.criticalSuccesses;
  if (sessionStats.criticalFailures) stats.totalCriticalFailures += sessionStats.criticalFailures;
  if (sessionStats.goldEarned) stats.totalGoldEarned += sessionStats.goldEarned;
  if (sessionStats.goldSpent) stats.totalGoldSpent += sessionStats.goldSpent;
  if (sessionStats.locationsVisited) stats.totalLocationsVisited += sessionStats.locationsVisited;
  if (sessionStats.npcsEncountered) stats.totalNpcsEncountered += sessionStats.npcsEncountered;
  if (sessionStats.questsCompleted) stats.totalQuestsCompleted += sessionStats.questsCompleted;
  if (sessionStats.secretsDiscovered) stats.totalSecretsDiscovered += sessionStats.secretsDiscovered;
  if (sessionStats.itemsAcquired) stats.totalItemsAcquired += sessionStats.itemsAcquired;
  if (sessionStats.itemsCrafted) stats.totalItemsCrafted += sessionStats.itemsCrafted;
  if (sessionStats.itemsUsed) stats.totalItemsUsed += sessionStats.itemsUsed;
  if (sessionStats.choicesMade) stats.totalChoicesMade += sessionStats.choicesMade;
  if (sessionStats.dialogueExchanges) stats.totalDialogueExchanges += sessionStats.dialogueExchanges;
  if (sessionStats.reputationGained) stats.totalReputationGained += sessionStats.reputationGained;
  if (sessionStats.reputationLost) stats.totalReputationLost += sessionStats.reputationLost;
  
  saveLifetimeStats(stats);
}

export function resetLifetimeStats(): void {
  localStorage.removeItem(STORAGE_KEY);
}
