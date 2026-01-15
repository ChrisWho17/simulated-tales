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
    isAvailable: !!achievements,
  };
}

export default useAchievementTriggers;
