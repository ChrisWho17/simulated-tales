// Achievement Triggers Hook
// Listens to game events and triggers achievement unlocks (global + run)

import { useEffect, useCallback, useRef } from 'react';
import { eventBus } from '@/game/eventBus';
import { useAchievementsOptional } from '@/components/game/Achievements';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import {
  ACHIEVEMENT_GENRES,
  genreFirstPlayId,
} from '@/lib/achievementCatalog';
import type { GameGenre } from '@/types/genreData';
import { loadLifetimeStats } from '@/lib/lifetimeStats';

interface TrackedProgress {
  locationsVisited: Set<string>;
  npcsMetSet: Set<string>;
  combatsWon: number;
  questsCompleted: number;
  choicesMade: number;
  persuasionSuccesses: number;
  combatsDeescalated: number;
  tradesCompleted: number;
  tradeProfits: number;
  rareItemsFound: number;
  itemCategories: Set<string>;
  totalItemsOwned: number;
  alliancesFormed: number;
  conflictsResolved: number;
  factionsWithPositiveStanding: Set<string>;
  companionsRecruited: number;
  currentGenre: string | null;
}

function emptyProgress(): TrackedProgress {
  return {
    locationsVisited: new Set(),
    npcsMetSet: new Set(),
    combatsWon: 0,
    questsCompleted: 0,
    choicesMade: 0,
    persuasionSuccesses: 0,
    combatsDeescalated: 0,
    tradesCompleted: 0,
    tradeProfits: 0,
    rareItemsFound: 0,
    itemCategories: new Set(),
    totalItemsOwned: 0,
    alliancesFormed: 0,
    conflictsResolved: 0,
    factionsWithPositiveStanding: new Set(),
    companionsRecruited: 0,
    currentGenre: null,
  };
}

function parseProgress(parsed: Record<string, unknown>): TrackedProgress {
  return {
    locationsVisited: new Set((parsed.locationsVisited as string[]) || []),
    npcsMetSet: new Set((parsed.npcsMetSet as string[]) || []),
    combatsWon: (parsed.combatsWon as number) || 0,
    questsCompleted: (parsed.questsCompleted as number) || 0,
    choicesMade: (parsed.choicesMade as number) || 0,
    persuasionSuccesses: (parsed.persuasionSuccesses as number) || 0,
    combatsDeescalated: (parsed.combatsDeescalated as number) || 0,
    tradesCompleted: (parsed.tradesCompleted as number) || 0,
    tradeProfits: (parsed.tradeProfits as number) || 0,
    rareItemsFound: (parsed.rareItemsFound as number) || 0,
    itemCategories: new Set((parsed.itemCategories as string[]) || []),
    totalItemsOwned: (parsed.totalItemsOwned as number) || 0,
    alliancesFormed: (parsed.alliancesFormed as number) || 0,
    conflictsResolved: (parsed.conflictsResolved as number) || 0,
    factionsWithPositiveStanding: new Set(
      (parsed.factionsWithPositiveStanding as string[]) || []
    ),
    companionsRecruited: (parsed.companionsRecruited as number) || 0,
    currentGenre: (parsed.currentGenre as string) || null,
  };
}

export function useAchievementTriggers() {
  const achievements = useAchievementsOptional();
  const progressRef = useRef<TrackedProgress>(emptyProgress());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS);
      if (saved) {
        progressRef.current = parseProgress(JSON.parse(saved));
      }
    } catch (e) {
      console.error('[Achievements] Failed to load progress:', e);
    }
  }, []);

  // When a new tale starts, wipe in-memory run counters
  useEffect(() => {
    const onReset = () => {
      progressRef.current = emptyProgress();
    };
    window.addEventListener('achievements-run-reset', onReset);
    return () => window.removeEventListener('achievements-run-reset', onReset);
  }, []);

  const saveProgress = useCallback(() => {
    try {
      const p = progressRef.current;
      const toSave = {
        locationsVisited: Array.from(p.locationsVisited),
        npcsMetSet: Array.from(p.npcsMetSet),
        combatsWon: p.combatsWon,
        questsCompleted: p.questsCompleted,
        choicesMade: p.choicesMade,
        persuasionSuccesses: p.persuasionSuccesses,
        combatsDeescalated: p.combatsDeescalated,
        tradesCompleted: p.tradesCompleted,
        tradeProfits: p.tradeProfits,
        rareItemsFound: p.rareItemsFound,
        itemCategories: Array.from(p.itemCategories),
        totalItemsOwned: p.totalItemsOwned,
        alliancesFormed: p.alliancesFormed,
        conflictsResolved: p.conflictsResolved,
        factionsWithPositiveStanding: Array.from(p.factionsWithPositiveStanding),
        companionsRecruited: p.companionsRecruited,
        currentGenre: p.currentGenre,
      };
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENT_PROGRESS, JSON.stringify(toSave));
    } catch (e) {
      console.error('[Achievements] Failed to save progress:', e);
    }
  }, []);

  const syncGenreVarietyFromLifetime = useCallback(() => {
    if (!achievements) return;
    try {
      const stats = loadLifetimeStats();
      const played = Object.keys(stats.genresPlayed || {}).filter((g) =>
        ACHIEVEMENT_GENRES.some((ag) => ag.id === g)
      );
      const count = played.length;
      achievements.updateProgress('genre_variety_3', count);
      achievements.updateProgress('genre_variety_5', count);
      achievements.updateProgress('genre_variety_all', count);

      // Genre master: all first-play + custom
      const firstPlays = [...ACHIEVEMENT_GENRES.map((g) => genreFirstPlayId(g.id)), 'genre_first_custom'];
      const unlockedFirst = firstPlays.every((id) => achievements.getAchievement(id)?.unlockedAt);
      if (unlockedFirst) {
        achievements.unlockAchievement('genre_master');
      }

      // Chronicler: overall + genre first-plays (excluding completionists themselves)
      const chroniclerIds = [
        'dust_off_the_cover',
        'first_adventure',
        'campaigns_three',
        'campaigns_ten',
        'genre_variety_3',
        'genre_variety_5',
        'genre_variety_all',
        'companion_lifetime_first',
        'companion_lifetime_five',
        'romance_spark',
        ...firstPlays,
        'genre_master',
      ];
      if (chroniclerIds.every((id) => achievements.getAchievement(id)?.unlockedAt)) {
        achievements.unlockAchievement('global_completionist');
      }
    } catch (e) {
      console.warn('[Achievements] Genre variety sync failed:', e);
    }
  }, [achievements]);

  // Subscribe to game events
  useEffect(() => {
    if (!achievements) return;

    const handlers: Array<() => void> = [];

    const handleTutorialComplete = () => {
      achievements.unlockAchievement('dust_off_the_cover');
    };
    window.addEventListener('tutorial-completed', handleTutorialComplete);
    handlers.push(() => window.removeEventListener('tutorial-completed', handleTutorialComplete));

    const handleGenreStarted = (e: Event) => {
      const genre = (e as CustomEvent)?.detail?.genre;
      if (!genre) return;
      progressRef.current.currentGenre = genre;
      saveProgress();
      achievements.unlockAchievement(genreFirstPlayId(genre));
      achievements.unlockAchievement('first_adventure');
      try {
        const stats = loadLifetimeStats();
        const started = stats.campaignsStarted || 0;
        achievements.updateProgress('campaigns_three', started);
        achievements.updateProgress('campaigns_ten', started);
      } catch {
        // ignore
      }
      syncGenreVarietyFromLifetime();
    };
    window.addEventListener('achievement-genre-started', handleGenreStarted);
    handlers.push(() => window.removeEventListener('achievement-genre-started', handleGenreStarted));

    const handleGenreContext = (e: Event) => {
      const genre = (e as CustomEvent)?.detail?.genre;
      if (!genre) return;
      progressRef.current.currentGenre = genre;
      saveProgress();
    };
    window.addEventListener('achievement-genre-context', handleGenreContext);
    handlers.push(() => window.removeEventListener('achievement-genre-context', handleGenreContext));

    handlers.push(
      eventBus.subscribe(['LOCATION_ENTERED'], (event) => {
        const data = (event as any).data;
        if (!data?.locationId) return;

        const wasNew = !progressRef.current.locationsVisited.has(data.locationId);
        progressRef.current.locationsVisited.add(data.locationId);

        if (wasNew) {
          const count = progressRef.current.locationsVisited.size;
          if (count === 1) achievements.unlockAchievement('first_steps');
          achievements.updateProgress('wanderer', count);
          achievements.updateProgress('explorer', count);
          achievements.updateProgress('cartographer', count);
          saveProgress();
        }
      })
    );

    handlers.push(
      eventBus.subscribe(['DEATH', 'KNOCKOUT'], (event) => {
        const data = (event as any).data;
        if (data?.targetEntity && data.targetEntity !== 'player') {
          progressRef.current.combatsWon++;
          const wins = progressRef.current.combatsWon;
          if (wins === 1) achievements.unlockAchievement('first_blood');
          achievements.updateProgress('survivor', wins);
          achievements.updateProgress('warrior', wins);
          if (data.flawlessVictory) achievements.unlockAchievement('champion');

          const genre = progressRef.current.currentGenre;
          if (genre === 'horror') achievements.unlockAchievement('genre_run_horror_survive');
          if (genre === 'western') achievements.unlockAchievement('genre_run_western_draw');
          if (genre === 'war') achievements.updateProgress('genre_run_war_medal', wins);

          saveProgress();
        }
      })
    );

    handlers.push(
      eventBus.subscribe(['COMBAT_WON'], (event) => {
        const data = (event as any).data;
        progressRef.current.combatsWon++;
        const wins = progressRef.current.combatsWon;
        if (wins === 1) achievements.unlockAchievement('first_blood');
        achievements.updateProgress('survivor', wins);
        achievements.updateProgress('warrior', wins);
        if (data?.flawlessVictory) achievements.unlockAchievement('champion');

        const genre = progressRef.current.currentGenre;
        if (genre === 'horror') achievements.unlockAchievement('genre_run_horror_survive');
        if (genre === 'western') achievements.unlockAchievement('genre_run_western_draw');
        if (genre === 'war') achievements.updateProgress('genre_run_war_medal', wins);

        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['COMBAT_DEESCALATED'], (event) => {
        progressRef.current.combatsDeescalated++;
        achievements.updateProgress('pacifist', progressRef.current.combatsDeescalated);
        const data = (event as any).data;
        if (data?.method === 'persuasion' || data?.method === 'diplomacy') {
          progressRef.current.persuasionSuccesses++;
          achievements.updateProgress('silver_tongue', progressRef.current.persuasionSuccesses);
        }
        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['QUEST_COMPLETED'], () => {
        progressRef.current.questsCompleted++;
        const quests = progressRef.current.questsCompleted;
        if (quests === 1) achievements.unlockAchievement('chapter_one');
        achievements.updateProgress('storyteller', quests);
        achievements.updateProgress('legend', quests);

        const genre = progressRef.current.currentGenre;
        if (genre === 'fantasy') achievements.unlockAchievement('genre_run_fantasy_quest');
        if (genre === 'custom') achievements.unlockAchievement('genre_run_custom_world');

        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['RELATIONSHIP_CHANGED'], (event) => {
        const data = (event as any).data;
        if (!data?.targetEntity || data.targetEntity === 'player') return;

        const wasNew = !progressRef.current.npcsMetSet.has(data.targetEntity);
        progressRef.current.npcsMetSet.add(data.targetEntity);

        if (wasNew) {
          const count = progressRef.current.npcsMetSet.size;
          if (count === 1) achievements.unlockAchievement('hello_stranger');
          achievements.updateProgress('socialite', count);
          achievements.updateProgress('networker', count);

          if (progressRef.current.currentGenre === 'scifi') {
            achievements.unlockAchievement('genre_run_scifi_contact');
          }
        }

        if (data.metric === 'trust' && data.newValue >= 95) {
          achievements.unlockAchievement('trusted_ally');
        }

        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['ROMANCE_PROGRESSED'], () => {
        achievements.unlockAchievement('romance_spark');
      })
    );

    handlers.push(
      eventBus.subscribe(['COMPANION_RECRUITED'], () => {
        progressRef.current.companionsRecruited++;
        const n = progressRef.current.companionsRecruited;
        if (n === 1) {
          achievements.unlockAchievement('party_of_two');
          achievements.unlockAchievement('companion_lifetime_first');
        }
        achievements.updateProgress('full_party', n);

        let lifetimeTotal = 0;
        try {
          lifetimeTotal =
            Number(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_LIFETIME_COMPANIONS) || '0') + 1;
          localStorage.setItem(
            STORAGE_KEYS.ACHIEVEMENT_LIFETIME_COMPANIONS,
            String(lifetimeTotal)
          );
        } catch {
          lifetimeTotal = n;
        }
        achievements.updateProgress('companion_lifetime_five', lifetimeTotal);

        if (progressRef.current.currentGenre === 'modern_life') {
          achievements.unlockAchievement('genre_run_modern_bond');
        }
        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['TRADE_COMPLETED', 'ITEM_SOLD', 'ITEM_PURCHASED'], (event) => {
        const data = (event as any).data;
        progressRef.current.tradesCompleted++;
        const profit = typeof data?.profit === 'number' ? data.profit : 0;
        progressRef.current.tradeProfits += Math.max(0, profit);
        const trades = progressRef.current.tradesCompleted;
        if (trades === 1) achievements.unlockAchievement('first_sale');
        achievements.updateProgress('haggler', trades);
        achievements.updateProgress('shrewd_trader', trades);
        achievements.updateProgress('merchant_prince', progressRef.current.tradeProfits);
        if (data?.isBlackMarket) achievements.unlockAchievement('black_market');

        const genre = progressRef.current.currentGenre;
        if (genre === 'pirate') achievements.unlockAchievement('genre_run_pirate_plunder');
        if (genre === 'cyberpunk') achievements.unlockAchievement('genre_run_cyber_deal');

        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['RARE_ITEM_FOUND', 'LEGENDARY_ITEM_FOUND'], (event) => {
        const data = (event as any).data;
        const rarity = data?.rarity || (event.type === 'LEGENDARY_ITEM_FOUND' ? 'legendary' : 'rare');
        if (['rare', 'epic', 'legendary'].includes(rarity) && progressRef.current.rareItemsFound === 0) {
          achievements.unlockAchievement('magpie');
        }
        if (['rare', 'epic', 'legendary'].includes(rarity)) {
          progressRef.current.rareItemsFound++;
          achievements.updateProgress('treasure_hunter', progressRef.current.rareItemsFound);
        }
        if (rarity === 'legendary') achievements.unlockAchievement('legendary_finder');
        if (data?.category) {
          progressRef.current.itemCategories.add(data.category);
          achievements.updateProgress('curator', progressRef.current.itemCategories.size);
        }
        if (progressRef.current.currentGenre === 'postapoc') {
          achievements.unlockAchievement('genre_run_postapoc_scavenge');
        }
        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['INVENTORY_CHANGED'], (event) => {
        const data = (event as any).data;
        if (typeof data?.totalItems === 'number') {
          progressRef.current.totalItemsOwned = data.totalItems;
          achievements.updateProgress('hoarder', data.totalItems);
          saveProgress();
        }
      })
    );

    handlers.push(
      eventBus.subscribe(['ALLIANCE_FORMED'], (event) => {
        const data = (event as any).data;
        progressRef.current.alliancesFormed++;
        if (progressRef.current.alliancesFormed === 1) {
          achievements.unlockAchievement('ambassador');
        }
        achievements.updateProgress('grand_alliance', progressRef.current.alliancesFormed);
        if (data?.factionId) {
          progressRef.current.factionsWithPositiveStanding.add(data.factionId);
          achievements.updateProgress(
            'faction_friend',
            progressRef.current.factionsWithPositiveStanding.size
          );
        }
        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['CONFLICT_RESOLVED'], () => {
        progressRef.current.conflictsResolved++;
        achievements.updateProgress('peacekeeper', progressRef.current.conflictsResolved);
        saveProgress();
      })
    );

    handlers.push(
      eventBus.subscribe(['FACTION_STANDING_CHANGED', 'FACTION_REPUTATION_CHANGED'], (event) => {
        const data = (event as any).data;
        const factionId = data?.factionId;
        if (!factionId) return;
        const isPositive =
          data?.isPositive ??
          (typeof data?.standing === 'number' ? data.standing > 0 : !!data?.positive);
        if (isPositive) {
          progressRef.current.factionsWithPositiveStanding.add(factionId);
        } else {
          progressRef.current.factionsWithPositiveStanding.delete(factionId);
        }
        achievements.updateProgress(
          'faction_friend',
          progressRef.current.factionsWithPositiveStanding.size
        );
        if (data?.allFactionsPositive) {
          achievements.unlockAchievement('world_peace');
        }
        saveProgress();
      })
    );

    return () => {
      handlers.forEach((unsubscribe) => unsubscribe());
    };
  }, [achievements, saveProgress, syncGenreVarietyFromLifetime]);

  const onGenreStarted = useCallback(
    (genre: GameGenre | string) => {
      if (!achievements || !genre) return;

      progressRef.current.currentGenre = genre;
      saveProgress();

      achievements.unlockAchievement(genreFirstPlayId(genre));
      achievements.unlockAchievement('first_adventure');

      try {
        const stats = loadLifetimeStats();
        const started = stats.campaignsStarted || 0;
        achievements.updateProgress('campaigns_three', started);
        achievements.updateProgress('campaigns_ten', started);
      } catch {
        // ignore
      }

      syncGenreVarietyFromLifetime();
    },
    [achievements, saveProgress, syncGenreVarietyFromLifetime]
  );

  const onLocationVisited = useCallback(
    (locationId: string) => {
      if (!achievements) return;
      const wasNew = !progressRef.current.locationsVisited.has(locationId);
      progressRef.current.locationsVisited.add(locationId);
      if (wasNew) {
        const count = progressRef.current.locationsVisited.size;
        if (count === 1) achievements.unlockAchievement('first_steps');
        achievements.updateProgress('wanderer', count);
        achievements.updateProgress('explorer', count);
        achievements.updateProgress('cartographer', count);
        saveProgress();
      }
    },
    [achievements, saveProgress]
  );

  const onNPCMet = useCallback(
    (npcId: string) => {
      if (!achievements) return;
      const wasNew = !progressRef.current.npcsMetSet.has(npcId);
      progressRef.current.npcsMetSet.add(npcId);
      if (wasNew) {
        const count = progressRef.current.npcsMetSet.size;
        if (count === 1) achievements.unlockAchievement('hello_stranger');
        achievements.updateProgress('socialite', count);
        achievements.updateProgress('networker', count);
        if (progressRef.current.currentGenre === 'scifi') {
          achievements.unlockAchievement('genre_run_scifi_contact');
        }
        saveProgress();
      }
    },
    [achievements, saveProgress]
  );

  const onCombatWon = useCallback(
    (flawlessVictory: boolean = false) => {
      if (!achievements) return;
      progressRef.current.combatsWon++;
      const wins = progressRef.current.combatsWon;
      if (wins === 1) achievements.unlockAchievement('first_blood');
      achievements.updateProgress('survivor', wins);
      achievements.updateProgress('warrior', wins);
      if (flawlessVictory) achievements.unlockAchievement('champion');
      const genre = progressRef.current.currentGenre;
      if (genre === 'horror') achievements.unlockAchievement('genre_run_horror_survive');
      if (genre === 'western') achievements.unlockAchievement('genre_run_western_draw');
      if (genre === 'war') achievements.updateProgress('genre_run_war_medal', wins);
      saveProgress();
    },
    [achievements, saveProgress]
  );

  const onCombatDeescalated = useCallback(() => {
    if (!achievements) return;
    progressRef.current.combatsDeescalated++;
    achievements.updateProgress('pacifist', progressRef.current.combatsDeescalated);
    saveProgress();
  }, [achievements, saveProgress]);

  const onQuestCompleted = useCallback(() => {
    if (!achievements) return;
    progressRef.current.questsCompleted++;
    const quests = progressRef.current.questsCompleted;
    if (quests === 1) achievements.unlockAchievement('chapter_one');
    achievements.updateProgress('storyteller', quests);
    achievements.updateProgress('legend', quests);
    const genre = progressRef.current.currentGenre;
    if (genre === 'fantasy') achievements.unlockAchievement('genre_run_fantasy_quest');
    if (genre === 'custom') achievements.unlockAchievement('genre_run_custom_world');
    saveProgress();
  }, [achievements, saveProgress]);

  const onChoiceMade = useCallback(() => {
    if (!achievements) return;
    progressRef.current.choicesMade++;
    achievements.updateProgress('decisive', progressRef.current.choicesMade);
    if (progressRef.current.currentGenre === 'mystery') {
      achievements.updateProgress('genre_run_mystery_clue', progressRef.current.choicesMade);
    }
    saveProgress();
  }, [achievements, saveProgress]);

  const onDiceRoll = useCallback(
    (naturalRoll: number) => {
      if (!achievements) return;
      if (naturalRoll === 20) achievements.unlockAchievement('lucky_roll');
      else if (naturalRoll === 1) achievements.unlockAchievement('unlucky');
    },
    [achievements]
  );

  const onPersuasionSuccess = useCallback(() => {
    if (!achievements) return;
    progressRef.current.persuasionSuccesses++;
    achievements.updateProgress('silver_tongue', progressRef.current.persuasionSuccesses);
    saveProgress();
  }, [achievements, saveProgress]);

  const onMaxTrustReached = useCallback(() => {
    if (!achievements) return;
    achievements.unlockAchievement('trusted_ally');
  }, [achievements]);

  const onSessionTimeReached = useCallback(
    (hours: number) => {
      if (!achievements) return;
      if (hours >= 1) achievements.unlockAchievement('persistent');
      achievements.updateProgress('dedicated', hours);
      const currentHour = new Date().getHours();
      if (currentHour >= 0 && currentHour < 5) {
        achievements.unlockAchievement('night_owl');
      }
    },
    [achievements]
  );

  const onTradeCompleted = useCallback(
    (profit: number = 0, isBlackMarket: boolean = false) => {
      if (!achievements) return;
      progressRef.current.tradesCompleted++;
      progressRef.current.tradeProfits += Math.max(0, profit);
      const trades = progressRef.current.tradesCompleted;
      if (trades === 1) achievements.unlockAchievement('first_sale');
      achievements.updateProgress('haggler', trades);
      achievements.updateProgress('shrewd_trader', trades);
      achievements.updateProgress('merchant_prince', progressRef.current.tradeProfits);
      if (isBlackMarket) achievements.unlockAchievement('black_market');
      const genre = progressRef.current.currentGenre;
      if (genre === 'pirate') achievements.unlockAchievement('genre_run_pirate_plunder');
      if (genre === 'cyberpunk') achievements.unlockAchievement('genre_run_cyber_deal');
      saveProgress();
    },
    [achievements, saveProgress]
  );

  const onRareItemFound = useCallback(
    (
      itemRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
      category?: string
    ) => {
      if (!achievements) return;
      if (['rare', 'epic', 'legendary'].includes(itemRarity) && progressRef.current.rareItemsFound === 0) {
        achievements.unlockAchievement('magpie');
      }
      if (['rare', 'epic', 'legendary'].includes(itemRarity)) {
        progressRef.current.rareItemsFound++;
        achievements.updateProgress('treasure_hunter', progressRef.current.rareItemsFound);
      }
      if (itemRarity === 'legendary') achievements.unlockAchievement('legendary_finder');
      if (category) {
        progressRef.current.itemCategories.add(category);
        achievements.updateProgress('curator', progressRef.current.itemCategories.size);
      }
      if (progressRef.current.currentGenre === 'postapoc') {
        achievements.unlockAchievement('genre_run_postapoc_scavenge');
      }
      saveProgress();
    },
    [achievements, saveProgress]
  );

  const onInventoryChanged = useCallback(
    (totalItems: number) => {
      if (!achievements) return;
      progressRef.current.totalItemsOwned = totalItems;
      achievements.updateProgress('hoarder', totalItems);
      saveProgress();
    },
    [achievements, saveProgress]
  );

  const onAllianceFormed = useCallback(
    (factionId?: string) => {
      if (!achievements) return;
      progressRef.current.alliancesFormed++;
      if (progressRef.current.alliancesFormed === 1) {
        achievements.unlockAchievement('ambassador');
      }
      achievements.updateProgress('grand_alliance', progressRef.current.alliancesFormed);
      if (factionId) {
        progressRef.current.factionsWithPositiveStanding.add(factionId);
        achievements.updateProgress(
          'faction_friend',
          progressRef.current.factionsWithPositiveStanding.size
        );
      }
      saveProgress();
    },
    [achievements, saveProgress]
  );

  const onConflictResolved = useCallback(() => {
    if (!achievements) return;
    progressRef.current.conflictsResolved++;
    achievements.updateProgress('peacekeeper', progressRef.current.conflictsResolved);
    saveProgress();
  }, [achievements, saveProgress]);

  const onFactionStandingChanged = useCallback(
    (factionId: string, isPositive: boolean, allFactionsPositive: boolean = false) => {
      if (!achievements) return;
      if (isPositive) {
        progressRef.current.factionsWithPositiveStanding.add(factionId);
      } else {
        progressRef.current.factionsWithPositiveStanding.delete(factionId);
      }
      achievements.updateProgress(
        'faction_friend',
        progressRef.current.factionsWithPositiveStanding.size
      );
      if (allFactionsPositive) achievements.unlockAchievement('world_peace');
      saveProgress();
    },
    [achievements, saveProgress]
  );

  const onCompanionRecruited = useCallback(() => {
    if (!achievements) return;
    eventBus.emit({
      type: 'COMPANION_RECRUITED',
      timestamp: Date.now(),
      tick: 0,
      source: 'useAchievementTriggers',
      priority: 'normal',
      data: {},
    } as any);
  }, [achievements]);

  return {
    onGenreStarted,
    onLocationVisited,
    onNPCMet,
    onCombatWon,
    onCombatDeescalated,
    onQuestCompleted,
    onChoiceMade,
    onDiceRoll,
    onPersuasionSuccess,
    onMaxTrustReached,
    onSessionTimeReached,
    onTradeCompleted,
    onRareItemFound,
    onInventoryChanged,
    onAllianceFormed,
    onConflictResolved,
    onFactionStandingChanged,
    onCompanionRecruited,
    isAvailable: !!achievements,
  };
}

export default useAchievementTriggers;
