// Bridge component that connects SessionStats play time to Achievement triggers
// This component should be placed inside both SessionStatsProvider and AchievementsProvider

import { useEffect, useRef } from 'react';
import { useSessionStatsOptional } from './SessionStats';
import { useAchievementsOptional } from './Achievements';

export function SessionAchievementBridge() {
  const sessionStats = useSessionStatsOptional();
  const achievements = useAchievementsOptional();
  const lastCheckedHour = useRef<number>(0);
  
  // Check play time achievements every second
  useEffect(() => {
    if (!sessionStats || !achievements) return;
    
    const checkPlayTimeAchievements = () => {
      const hours = sessionStats.getTotalPlayTimeHours();
      const currentHour = Math.floor(hours);
      
      // Only process if we've crossed a new hour threshold
      if (currentHour > lastCheckedHour.current) {
        lastCheckedHour.current = currentHour;
        
        // Persistent achievement - 1 hour of play
        if (currentHour >= 1) {
          achievements.unlockAchievement('persistent');
          console.log('[SessionAchievementBridge] Unlocked: Persistent (1 hour played)');
        }
        
        // Dedicated achievement - 5 hours of play (progress based)
        achievements.updateProgress('dedicated', currentHour);
        
        // Night owl check - playing between midnight and 5am
        const currentRealHour = new Date().getHours();
        if (currentRealHour >= 0 && currentRealHour < 5) {
          achievements.unlockAchievement('night_owl');
          console.log('[SessionAchievementBridge] Unlocked: Night Owl (playing late night)');
        }
      }
    };
    
    // Initial check
    checkPlayTimeAchievements();
    
    // Check every 10 seconds for efficiency
    const interval = setInterval(checkPlayTimeAchievements, 10000);
    
    return () => clearInterval(interval);
  }, [sessionStats, achievements]);
  
  // No UI - this is just a bridge component
  return null;
}

export default SessionAchievementBridge;
