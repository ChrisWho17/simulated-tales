// Bridge component that connects SessionStats play time to Achievement triggers
// This component should be placed inside both SessionStatsProvider and AchievementsProvider

import { useEffect, useRef } from 'react';
import { useSessionStatsOptional } from './SessionStats';
import { useAchievementsOptional } from './Achievements';

export function SessionAchievementBridge() {
  const sessionStats = useSessionStatsOptional();
  const achievements = useAchievementsOptional();
  const lastCheckedHour = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const weekendPlayTime = useRef<number>(0);
  
  // Check play time achievements every 10 seconds
  useEffect(() => {
    if (!sessionStats || !achievements) return;
    
    const checkPlayTimeAchievements = () => {
      const hours = sessionStats.getTotalPlayTimeHours();
      const currentHour = Math.floor(hours);
      const now = new Date();
      const currentRealHour = now.getHours();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Calculate consecutive session hours
      const sessionElapsedMs = Date.now() - sessionStartTime.current;
      const sessionHours = sessionElapsedMs / (1000 * 60 * 60);
      
      // Only process if we've crossed a new hour threshold
      if (currentHour > lastCheckedHour.current) {
        lastCheckedHour.current = currentHour;
        
        // Persistent achievement - 1 hour of play in single session
        if (sessionHours >= 1) {
          achievements.unlockAchievement('persistent');
          console.log('[SessionAchievementBridge] Unlocked: Persistent (1 hour session)');
        }
        
        // Dedicated achievement - 5 hours of play total (progress based)
        achievements.updateProgress('dedicated', currentHour);
        
        // Marathon achievement - 10 consecutive hours (progress based)
        const consecutiveHours = Math.floor(sessionHours);
        if (consecutiveHours > 0) {
          achievements.updateProgress('marathon', consecutiveHours);
          console.log(`[SessionAchievementBridge] Marathon progress: ${consecutiveHours}/10 hours`);
        }
      }
      
      // Time-of-day achievements (check every interval)
      
      // Night owl check - playing between midnight and 5am
      if (currentRealHour >= 0 && currentRealHour < 5) {
        achievements.unlockAchievement('night_owl');
      }
      
      // Early bird check - playing between 5am and 7am
      if (currentRealHour >= 5 && currentRealHour < 7) {
        achievements.unlockAchievement('early_bird');
        console.log('[SessionAchievementBridge] Unlocked: Early Bird (5-7 AM play)');
      }
      
      // Weekend warrior - track weekend play time
      if (isWeekend) {
        weekendPlayTime.current = sessionHours;
        if (weekendPlayTime.current >= 3) {
          achievements.unlockAchievement('weekend_warrior');
          console.log('[SessionAchievementBridge] Unlocked: Weekend Warrior (3+ hours on weekend)');
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
