// Bridge component that connects SessionStats play time to Achievement triggers
// This component should be placed inside both SessionStatsProvider and AchievementsProvider

import { useEffect, useRef } from 'react';
import { useSessionStatsOptional } from './SessionStats';
import { useAchievementsOptional } from './Achievements';

// Storage keys for streak tracking
const STREAK_STORAGE_KEY = 'untold-play-streak';
const LAST_PLAY_DATE_KEY = 'untold-last-play-date';

interface StreakData {
  currentStreak: number;
  lastPlayDate: string; // ISO date string (YYYY-MM-DD)
  longestStreak: number;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getStreakData(): StreakData {
  try {
    const saved = localStorage.getItem(STREAK_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load streak data:', e);
  }
  return { currentStreak: 0, lastPlayDate: '', longestStreak: 0 };
}

function saveStreakData(data: StreakData) {
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function SessionAchievementBridge() {
  const sessionStats = useSessionStatsOptional();
  const achievements = useAchievementsOptional();
  const lastCheckedHour = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const weekendPlayTime = useRef<number>(0);
  const streakChecked = useRef<boolean>(false);
  
  // Check and update play streak on mount
  useEffect(() => {
    if (!achievements || streakChecked.current) return;
    streakChecked.current = true;
    
    const today = getToday();
    const streakData = getStreakData();
    
    // Check if this is a new day
    if (streakData.lastPlayDate !== today) {
      const daysSinceLastPlay = streakData.lastPlayDate 
        ? daysBetween(streakData.lastPlayDate, today)
        : 999;
      
      // Comeback kid - returning after 7+ days
      if (daysSinceLastPlay >= 7 && streakData.lastPlayDate !== '') {
        achievements.unlockAchievement('comeback_kid');
        console.log('[SessionAchievementBridge] Unlocked: Comeback Kid (7+ day break)');
      }
      
      // Update streak
      if (daysSinceLastPlay === 1) {
        // Consecutive day - increment streak
        streakData.currentStreak += 1;
      } else if (daysSinceLastPlay > 1) {
        // Streak broken - reset to 1
        streakData.currentStreak = 1;
      } else {
        // First ever play
        streakData.currentStreak = 1;
      }
      
      // Update longest streak
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak;
      }
      
      streakData.lastPlayDate = today;
      saveStreakData(streakData);
      
      // Check streak achievements
      achievements.updateProgress('daily_player', streakData.currentStreak);
      achievements.updateProgress('weekly_streak', streakData.currentStreak);
      achievements.updateProgress('monthly_dedication', streakData.currentStreak);
      
      console.log(`[SessionAchievementBridge] Play streak: ${streakData.currentStreak} days`);
    }
  }, [achievements]);
  
  // Check category completion achievements
  useEffect(() => {
    if (!achievements) return;
    
    const checkCategoryCompletion = () => {
      const allAchievements = achievements.achievements;
      
      // Category mappings
      const categories = [
        { id: 'exploration', masterId: 'exploration_master' },
        { id: 'combat', masterId: 'combat_master' },
        { id: 'social', masterId: 'social_master' },
        { id: 'story', masterId: 'story_master' },
        { id: 'merchant', masterId: 'merchant_master' },
        { id: 'collector', masterId: 'collector_master' },
        { id: 'diplomat', masterId: 'diplomat_master' },
      ];
      
      let completedCategories = 0;
      
      categories.forEach(cat => {
        const categoryAchievements = allAchievements.filter(
          a => a.category === cat.id && a.id !== cat.masterId
        );
        const unlockedInCategory = categoryAchievements.filter(a => a.unlockedAt);
        
        // Check if all non-master achievements in category are unlocked
        if (categoryAchievements.length > 0 && 
            unlockedInCategory.length === categoryAchievements.length) {
          achievements.unlockAchievement(cat.masterId);
          completedCategories++;
        }
      });
      
      // Check for perfectionist - all achievements unlocked
      const totalAchievements = allAchievements.filter(a => a.id !== 'perfectionist');
      const unlockedAchievements = totalAchievements.filter(a => a.unlockedAt);
      
      if (unlockedAchievements.length === totalAchievements.length) {
        achievements.unlockAchievement('perfectionist');
        console.log('[SessionAchievementBridge] Unlocked: Perfectionist (all achievements)');
      }
    };
    
    // Check on mount and periodically
    checkCategoryCompletion();
    const interval = setInterval(checkCategoryCompletion, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [achievements]);
  
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
