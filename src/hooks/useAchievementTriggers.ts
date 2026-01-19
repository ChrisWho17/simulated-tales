// Achievement Triggers Hook
// Listens to game events and triggers achievement unlocks

import { useEffect, useCallback, useRef } from 'react';
import { eventBus, GameEventType } from '@/game/eventBus';
import { useAchievementsOptional } from '@/components/game/Achievements';

interface TrackedProgress {
  locationsVisited: Set<string>;
  npcsMetSet: Set<string>;
  combatsWon: number;
  questsCompleted: number;
  choicesMade: number;
  persuasionSuccesses: number;
  combatsDeescalated: number;
  // Merchant progress
  tradesCompleted: number;
  tradeProfits: number;
  // Collector progress
  rareItemsFound: number;
  itemCategories: Set<string>;
  totalItemsOwned: number;
  // Diplomat progress
  alliancesFormed: number;
  conflictsResolved: number;
  factionsWithPositiveStanding: Set<string>;
}

export function useAchievementTriggers() {
  const achievements = useAchievementsOptional();
  const progressRef = useRef<TrackedProgress>({
    locationsVisited: new Set(),
    npcsMetSet: new Set(),
    combatsWon: 0,
    questsCompleted: 0,
    choicesMade: 0,
    persuasionSuccesses: 0,
    combatsDeescalated: 0,
    // Merchant
    tradesCompleted: 0,
    tradeProfits: 0,
    // Collector
    rareItemsFound: 0,
    itemCategories: new Set(),
    totalItemsOwned: 0,
    // Diplomat
    alliancesFormed: 0,
    conflictsResolved: 0,
    factionsWithPositiveStanding: new Set(),
  });
  
  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('untold-achievement-progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        progressRef.current = {
          locationsVisited: new Set(parsed.locationsVisited || []),
          npcsMetSet: new Set(parsed.npcsMetSet || []),
          combatsWon: parsed.combatsWon || 0,
          questsCompleted: parsed.questsCompleted || 0,
          choicesMade: parsed.choicesMade || 0,
          persuasionSuccesses: parsed.persuasionSuccesses || 0,
          combatsDeescalated: parsed.combatsDeescalated || 0,
          // Merchant
          tradesCompleted: parsed.tradesCompleted || 0,
          tradeProfits: parsed.tradeProfits || 0,
          // Collector
          rareItemsFound: parsed.rareItemsFound || 0,
          itemCategories: new Set(parsed.itemCategories || []),
          totalItemsOwned: parsed.totalItemsOwned || 0,
          // Diplomat
          alliancesFormed: parsed.alliancesFormed || 0,
          conflictsResolved: parsed.conflictsResolved || 0,
          factionsWithPositiveStanding: new Set(parsed.factionsWithPositiveStanding || []),
        };
      }
    } catch (e) {
      console.error('[Achievements] Failed to load progress:', e);
    }
  }, []);
  
  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    try {
      const toSave = {
        locationsVisited: Array.from(progressRef.current.locationsVisited),
        npcsMetSet: Array.from(progressRef.current.npcsMetSet),
        combatsWon: progressRef.current.combatsWon,
        questsCompleted: progressRef.current.questsCompleted,
        choicesMade: progressRef.current.choicesMade,
        persuasionSuccesses: progressRef.current.persuasionSuccesses,
        combatsDeescalated: progressRef.current.combatsDeescalated,
        // Merchant
        tradesCompleted: progressRef.current.tradesCompleted,
        tradeProfits: progressRef.current.tradeProfits,
        // Collector
        rareItemsFound: progressRef.current.rareItemsFound,
        itemCategories: Array.from(progressRef.current.itemCategories),
        totalItemsOwned: progressRef.current.totalItemsOwned,
        // Diplomat
        alliancesFormed: progressRef.current.alliancesFormed,
        conflictsResolved: progressRef.current.conflictsResolved,
        factionsWithPositiveStanding: Array.from(progressRef.current.factionsWithPositiveStanding),
      };
      localStorage.setItem('untold-achievement-progress', JSON.stringify(toSave));
    } catch (e) {
      console.error('[Achievements] Failed to save progress:', e);
    }
  }, []);
  
  // Subscribe to game events
  useEffect(() => {
    if (!achievements) return;

    const handlers: Array<() => void> = [];

    // Tutorial completion event (from OnboardingOverlay)
    const handleTutorialComplete = () => {
      achievements.unlockAchievement('dust_off_the_cover');
    };
    window.addEventListener('tutorial-completed', handleTutorialComplete);
    handlers.push(() => window.removeEventListener('tutorial-completed', handleTutorialComplete));

    // Location events
    handlers.push(eventBus.subscribe(['LOCATION_ENTERED'], (event) => {
      const data = (event as any).data;
      if (!data?.locationId) return;
      
      const wasNew = !progressRef.current.locationsVisited.has(data.locationId);
      progressRef.current.locationsVisited.add(data.locationId);
      
      if (wasNew) {
        const count = progressRef.current.locationsVisited.size;
        
        // First location
        if (count === 1) {
          achievements.unlockAchievement('first_steps');
        }
        
        // Progress achievements
        achievements.updateProgress('wanderer', count);
        achievements.updateProgress('explorer', count);
        achievements.updateProgress('cartographer', count);
        
        saveProgress();
      }
    }));

    // Combat events - DEATH/KNOCKOUT (NPC defeated)
    handlers.push(eventBus.subscribe(['DEATH', 'KNOCKOUT'], (event) => {
      const data = (event as any).data;
      
      // Player won combat (NPC died/knocked out)
      if (data?.targetEntity && data.targetEntity !== 'player') {
        progressRef.current.combatsWon++;
        const wins = progressRef.current.combatsWon;
        
        // First combat win
        if (wins === 1) {
          achievements.unlockAchievement('first_blood');
        }
        
        // Progress achievements
        achievements.updateProgress('survivor', wins);
        achievements.updateProgress('warrior', wins);
        
        // Check for flawless victory (champion achievement)
        if (data.flawlessVictory) {
          achievements.unlockAchievement('champion');
        }
        
        saveProgress();
      }
    }));

    // Combat won event (explicit combat resolution)
    handlers.push(eventBus.subscribe(['COMBAT_WON'], (event) => {
      const data = (event as any).data;
      
      progressRef.current.combatsWon++;
      const wins = progressRef.current.combatsWon;
      
      // First combat win
      if (wins === 1) {
        achievements.unlockAchievement('first_blood');
      }
      
      // Progress achievements
      achievements.updateProgress('survivor', wins);
      achievements.updateProgress('warrior', wins);
      
      // Check for flawless victory
      if (data?.flawlessVictory) {
        achievements.unlockAchievement('champion');
      }
      
      saveProgress();
    }));

    // Combat de-escalated (pacifist achievement)
    handlers.push(eventBus.subscribe(['COMBAT_DEESCALATED'], (event) => {
      progressRef.current.combatsDeescalated++;
      const deescalated = progressRef.current.combatsDeescalated;
      
      // Update pacifist progress
      achievements.updateProgress('pacifist', deescalated);
      
      // Also count as a persuasion success if method was persuasion
      const data = (event as any).data;
      if (data?.method === 'persuasion' || data?.method === 'diplomacy') {
        progressRef.current.persuasionSuccesses++;
        achievements.updateProgress('silver_tongue', progressRef.current.persuasionSuccesses);
      }
      
      saveProgress();
    }));

    // Combat fled - could be a tactical retreat
    handlers.push(eventBus.subscribe(['COMBAT_FLED'], () => {
      // Fleeing doesn't count toward achievements but we track it
      console.log('[Achievements] Combat fled - no achievement triggered');
    }));

    // Quest events
    handlers.push(eventBus.subscribe(['QUEST_COMPLETED'], () => {
      progressRef.current.questsCompleted++;
      const quests = progressRef.current.questsCompleted;
      
      // First quest
      if (quests === 1) {
        achievements.unlockAchievement('chapter_one');
      }
      
      // Progress achievements
      achievements.updateProgress('storyteller', quests);
      achievements.updateProgress('legend', quests);
      
      saveProgress();
    }));

    // Relationship events - meeting new NPCs
    handlers.push(eventBus.subscribe(['RELATIONSHIP_CHANGED'], (event) => {
      const data = (event as any).data;
      if (!data?.targetEntity || data.targetEntity === 'player') return;
      
      const wasNew = !progressRef.current.npcsMetSet.has(data.targetEntity);
      progressRef.current.npcsMetSet.add(data.targetEntity);
      
      if (wasNew) {
        const count = progressRef.current.npcsMetSet.size;
        
        // First NPC
        if (count === 1) {
          achievements.unlockAchievement('hello_stranger');
        }
        
        // Progress achievements
        achievements.updateProgress('socialite', count);
        achievements.updateProgress('networker', count);
        
        // Check for max trust
        if (data.metric === 'trust' && data.newValue >= 95) {
          achievements.unlockAchievement('trusted_ally');
        }
        
        saveProgress();
      }
    }));

    return () => {
      handlers.forEach(unsubscribe => unsubscribe());
    };
  }, [achievements, saveProgress]);

  // Manual trigger functions for game code to call
  const onLocationVisited = useCallback((locationId: string, locationName?: string) => {
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
  }, [achievements, saveProgress]);

  const onNPCMet = useCallback((npcId: string) => {
    if (!achievements) return;
    
    const wasNew = !progressRef.current.npcsMetSet.has(npcId);
    progressRef.current.npcsMetSet.add(npcId);
    
    if (wasNew) {
      const count = progressRef.current.npcsMetSet.size;
      
      if (count === 1) achievements.unlockAchievement('hello_stranger');
      achievements.updateProgress('socialite', count);
      achievements.updateProgress('networker', count);
      
      saveProgress();
    }
  }, [achievements, saveProgress]);

  const onCombatWon = useCallback((flawlessVictory: boolean = false) => {
    if (!achievements) return;
    
    progressRef.current.combatsWon++;
    const wins = progressRef.current.combatsWon;
    
    if (wins === 1) achievements.unlockAchievement('first_blood');
    achievements.updateProgress('survivor', wins);
    achievements.updateProgress('warrior', wins);
    
    if (flawlessVictory) {
      achievements.unlockAchievement('champion');
    }
    
    saveProgress();
  }, [achievements, saveProgress]);

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
    
    saveProgress();
  }, [achievements, saveProgress]);

  const onChoiceMade = useCallback(() => {
    if (!achievements) return;
    
    progressRef.current.choicesMade++;
    achievements.updateProgress('decisive', progressRef.current.choicesMade);
    saveProgress();
  }, [achievements, saveProgress]);

  const onDiceRoll = useCallback((naturalRoll: number) => {
    if (!achievements) return;
    
    if (naturalRoll === 20) {
      achievements.unlockAchievement('lucky_roll');
    } else if (naturalRoll === 1) {
      achievements.unlockAchievement('unlucky');
    }
  }, [achievements]);

  const onPersuasionSuccess = useCallback(() => {
    if (!achievements) return;
    
    progressRef.current.persuasionSuccesses++;
    achievements.updateProgress('silver_tongue', progressRef.current.persuasionSuccesses);
    saveProgress();
  }, [achievements, saveProgress]);

  const onMaxTrustReached = useCallback((npcId: string) => {
    if (!achievements) return;
    achievements.unlockAchievement('trusted_ally');
  }, [achievements]);

  const onSessionTimeReached = useCallback((hours: number) => {
    if (!achievements) return;
    
    if (hours >= 1) {
      achievements.unlockAchievement('persistent');
    }
    achievements.updateProgress('dedicated', hours);
    
    // Night owl - check if playing past midnight
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 5) {
      achievements.unlockAchievement('night_owl');
    }
  }, [achievements]);

  // Merchant triggers
  const onTradeCompleted = useCallback((profit: number = 0, isBlackMarket: boolean = false) => {
    if (!achievements) return;
    
    progressRef.current.tradesCompleted++;
    progressRef.current.tradeProfits += Math.max(0, profit);
    const trades = progressRef.current.tradesCompleted;
    
    // First trade
    if (trades === 1) {
      achievements.unlockAchievement('first_sale');
    }
    
    // Progress achievements
    achievements.updateProgress('haggler', trades);
    achievements.updateProgress('shrewd_trader', trades);
    achievements.updateProgress('merchant_prince', progressRef.current.tradeProfits);
    
    // Black market achievement
    if (isBlackMarket) {
      achievements.unlockAchievement('black_market');
    }
    
    saveProgress();
  }, [achievements, saveProgress]);

  // Collector triggers
  const onRareItemFound = useCallback((itemRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', category?: string) => {
    if (!achievements) return;
    
    // First rare item
    if (['rare', 'epic', 'legendary'].includes(itemRarity) && progressRef.current.rareItemsFound === 0) {
      achievements.unlockAchievement('magpie');
    }
    
    if (['rare', 'epic', 'legendary'].includes(itemRarity)) {
      progressRef.current.rareItemsFound++;
      achievements.updateProgress('treasure_hunter', progressRef.current.rareItemsFound);
    }
    
    // Legendary item
    if (itemRarity === 'legendary') {
      achievements.unlockAchievement('legendary_finder');
    }
    
    // Track categories
    if (category) {
      progressRef.current.itemCategories.add(category);
      achievements.updateProgress('curator', progressRef.current.itemCategories.size);
    }
    
    saveProgress();
  }, [achievements, saveProgress]);

  const onInventoryChanged = useCallback((totalItems: number) => {
    if (!achievements) return;
    
    progressRef.current.totalItemsOwned = totalItems;
    achievements.updateProgress('hoarder', totalItems);
    saveProgress();
  }, [achievements, saveProgress]);

  // Diplomat triggers
  const onAllianceFormed = useCallback((factionId?: string) => {
    if (!achievements) return;
    
    progressRef.current.alliancesFormed++;
    
    // First alliance
    if (progressRef.current.alliancesFormed === 1) {
      achievements.unlockAchievement('ambassador');
    }
    
    achievements.updateProgress('grand_alliance', progressRef.current.alliancesFormed);
    
    if (factionId) {
      progressRef.current.factionsWithPositiveStanding.add(factionId);
      achievements.updateProgress('faction_friend', progressRef.current.factionsWithPositiveStanding.size);
    }
    
    saveProgress();
  }, [achievements, saveProgress]);

  const onConflictResolved = useCallback(() => {
    if (!achievements) return;
    
    progressRef.current.conflictsResolved++;
    achievements.updateProgress('peacekeeper', progressRef.current.conflictsResolved);
    saveProgress();
  }, [achievements, saveProgress]);

  const onFactionStandingChanged = useCallback((factionId: string, isPositive: boolean, allFactionsPositive: boolean = false) => {
    if (!achievements) return;
    
    if (isPositive) {
      progressRef.current.factionsWithPositiveStanding.add(factionId);
    } else {
      progressRef.current.factionsWithPositiveStanding.delete(factionId);
    }
    
    achievements.updateProgress('faction_friend', progressRef.current.factionsWithPositiveStanding.size);
    
    // World peace - all factions positive
    if (allFactionsPositive) {
      achievements.unlockAchievement('world_peace');
    }
    
    saveProgress();
  }, [achievements, saveProgress]);

  return {
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
    // Merchant
    onTradeCompleted,
    // Collector
    onRareItemFound,
    onInventoryChanged,
    // Diplomat
    onAllianceFormed,
    onConflictResolved,
    onFactionStandingChanged,
    isAvailable: !!achievements,
  };
}

export default useAchievementTriggers;
