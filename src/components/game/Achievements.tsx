import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AchievementParticles, LegendaryAchievementCelebration } from './AchievementParticles';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'exploration' | 'combat' | 'social' | 'story' | 'secret';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

// Pre-defined achievements
const ACHIEVEMENTS: Achievement[] = [
  // Exploration
  { id: 'first_steps', name: 'First Steps', description: 'Visit your first location', icon: '👣', category: 'exploration', rarity: 'common' },
  { id: 'wanderer', name: 'Wanderer', description: 'Visit 5 different locations', icon: '🗺️', category: 'exploration', rarity: 'uncommon', maxProgress: 5 },
  { id: 'explorer', name: 'Explorer', description: 'Visit 15 different locations', icon: '🧭', category: 'exploration', rarity: 'rare', maxProgress: 15 },
  { id: 'cartographer', name: 'Cartographer', description: 'Visit 30 different locations', icon: '📍', category: 'exploration', rarity: 'epic', maxProgress: 30 },
  
  // Combat
  { id: 'first_blood', name: 'First Blood', description: 'Win your first combat', icon: '⚔️', category: 'combat', rarity: 'common' },
  { id: 'survivor', name: 'Survivor', description: 'Win 5 combats', icon: '🛡️', category: 'combat', rarity: 'uncommon', maxProgress: 5 },
  { id: 'warrior', name: 'Warrior', description: 'Win 20 combats', icon: '🗡️', category: 'combat', rarity: 'rare', maxProgress: 20 },
  { id: 'champion', name: 'Champion', description: 'Win a combat without taking damage', icon: '👑', category: 'combat', rarity: 'epic' },
  { id: 'pacifist', name: 'Pacifist', description: 'De-escalate 5 potential combats', icon: '🕊️', category: 'combat', rarity: 'rare', maxProgress: 5 },
  
  // Social
  { id: 'hello_stranger', name: 'Hello, Stranger', description: 'Meet your first NPC', icon: '👋', category: 'social', rarity: 'common' },
  { id: 'socialite', name: 'Socialite', description: 'Meet 10 different NPCs', icon: '🤝', category: 'social', rarity: 'uncommon', maxProgress: 10 },
  { id: 'networker', name: 'Networker', description: 'Meet 25 different NPCs', icon: '🌐', category: 'social', rarity: 'rare', maxProgress: 25 },
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Succeed in 10 persuasion checks', icon: '💬', category: 'social', rarity: 'rare', maxProgress: 10 },
  { id: 'trusted_ally', name: 'Trusted Ally', description: 'Reach maximum trust with an NPC', icon: '💖', category: 'social', rarity: 'epic' },
  
  // Story
  { id: 'chapter_one', name: 'Chapter One', description: 'Complete your first quest', icon: '📖', category: 'story', rarity: 'common' },
  { id: 'storyteller', name: 'Storyteller', description: 'Complete 5 quests', icon: '📚', category: 'story', rarity: 'uncommon', maxProgress: 5 },
  { id: 'legend', name: 'Legend', description: 'Complete 15 quests', icon: '🏆', category: 'story', rarity: 'rare', maxProgress: 15 },
  { id: 'decisive', name: 'Decisive', description: 'Make 100 choices', icon: '🎯', category: 'story', rarity: 'rare', maxProgress: 100 },
  
  // Secret - Time-based
  { id: 'lucky_roll', name: 'Lucky Roll', description: 'Roll a natural 20', icon: '🎲', category: 'secret', rarity: 'uncommon' },
  { id: 'unlucky', name: 'Unlucky', description: 'Roll a natural 1', icon: '💀', category: 'secret', rarity: 'uncommon' },
  { id: 'persistent', name: 'Persistent', description: 'Play for 1 hour in a single session', icon: '⏰', category: 'secret', rarity: 'rare' },
  { id: 'dedicated', name: 'Dedicated', description: 'Play for 5 hours total', icon: '🎮', category: 'secret', rarity: 'epic', maxProgress: 5 },
  { id: 'marathon', name: 'Marathon Runner', description: 'Play for 10 consecutive hours', icon: '🏃', category: 'secret', rarity: 'legendary', maxProgress: 10 },
  { id: 'night_owl', name: 'Night Owl', description: 'Play past midnight', icon: '🦉', category: 'secret', rarity: 'uncommon' },
  { id: 'early_bird', name: 'Early Bird', description: 'Play between 5 AM and 7 AM', icon: '🌅', category: 'secret', rarity: 'uncommon' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Play for 3+ hours on a weekend', icon: '🎯', category: 'secret', rarity: 'rare' },
];

interface AchievementsContextType {
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  unlockAchievement: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  getAchievement: (id: string) => Achievement | undefined;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);
const STORAGE_KEY = 'untold-achievements';

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider');
  }
  return context;
}

export function useAchievementsOptional() {
  return useContext(AchievementsContext);
}

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved data with base achievements
        return ACHIEVEMENTS.map(base => ({
          ...base,
          ...parsed.find((p: Achievement) => p.id === base.id),
        }));
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
    return [...ACHIEVEMENTS];
  });

  const [pendingNotification, setPendingNotification] = useState<Achievement | null>(null);
  const [showLegendaryCelebration, setShowLegendaryCelebration] = useState(false);

  const unlockedAchievements = new Set(
    achievements.filter(a => a.unlockedAt).map(a => a.id)
  );

  // Save achievements
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
  }, [achievements]);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const achievement = prev.find(a => a.id === id);
      if (!achievement || achievement.unlockedAt) return prev;

      const updated = prev.map(a =>
        a.id === id ? { ...a, unlockedAt: Date.now() } : a
      );

      // Show notification
      const unlocked = updated.find(a => a.id === id);
      if (unlocked) {
        setPendingNotification(unlocked);
        
        // Show legendary celebration for legendary achievements
        if (unlocked.rarity === 'legendary') {
          setShowLegendaryCelebration(true);
          setTimeout(() => setShowLegendaryCelebration(false), 3000);
        }
      }

      return updated;
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setAchievements(prev => {
      const achievement = prev.find(a => a.id === id);
      if (!achievement || achievement.unlockedAt) return prev;

      const newProgress = Math.min(progress, achievement.maxProgress || progress);
      const shouldUnlock = achievement.maxProgress && newProgress >= achievement.maxProgress;

      if (shouldUnlock) {
        const updated = prev.map(a =>
          a.id === id ? { ...a, progress: newProgress, unlockedAt: Date.now() } : a
        );
        const unlocked = updated.find(a => a.id === id);
        if (unlocked) {
          setPendingNotification(unlocked);
          
          // Show legendary celebration for legendary achievements
          if (unlocked.rarity === 'legendary') {
            setShowLegendaryCelebration(true);
            setTimeout(() => setShowLegendaryCelebration(false), 3000);
          }
        }
        return updated;
      }

      return prev.map(a =>
        a.id === id ? { ...a, progress: newProgress } : a
      );
    });
  }, []);

  const getAchievement = (id: string) => achievements.find(a => a.id === id);

  // Show toast notification
  useEffect(() => {
    if (pendingNotification) {
      toast.custom(() => (
        <AchievementToast achievement={pendingNotification} />
      ), { duration: pendingNotification.rarity === 'legendary' ? 6000 : 4000 });
      setPendingNotification(null);
    }
  }, [pendingNotification]);

  return (
    <AchievementsContext.Provider value={{
      achievements,
      unlockedAchievements,
      unlockAchievement,
      updateProgress,
      getAchievement,
    }}>
      {children}
      {/* Legendary achievement celebration overlay */}
      <LegendaryAchievementCelebration isActive={showLegendaryCelebration} />
    </AchievementsContext.Provider>
  );
}

function AchievementToast({ achievement }: { achievement: Achievement }) {
  const [showParticles, setShowParticles] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const rarityColors = {
    common: 'border-slate-400 bg-slate-500/20',
    uncommon: 'border-green-400 bg-green-500/20',
    rare: 'border-blue-400 bg-blue-500/20',
    epic: 'border-purple-400 bg-purple-500/20',
    legendary: 'border-amber-400 bg-amber-500/20',
  };
  
  const rarityGlows = {
    common: '',
    uncommon: 'shadow-[0_0_15px_rgba(74,222,128,0.3)]',
    rare: 'shadow-[0_0_20px_rgba(96,165,250,0.4)]',
    epic: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]',
    legendary: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]',
  };
  
  // Play achievement sound on mount
  useEffect(() => {
    // Create a simple achievement unlock sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Different sounds based on rarity
      const frequencies = {
        common: [523, 659],
        uncommon: [523, 659, 784],
        rare: [392, 523, 659, 784],
        epic: [392, 523, 659, 784, 1047],
        legendary: [392, 494, 587, 698, 880, 1047],
      };
      
      const notes = frequencies[achievement.rarity];
      const duration = achievement.rarity === 'legendary' ? 0.15 : 0.1;
      
      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = achievement.rarity === 'legendary' ? 'sine' : 'triangle';
        
        const startTime = audioContext.currentTime + i * duration;
        const volume = 0.1;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration * 2);
      });
    } catch (e) {
      // Audio not supported, fail silently
      console.log('[Achievement] Audio not available');
    }
  }, [achievement.rarity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 overflow-hidden",
        "backdrop-blur-md bg-background/90",
        rarityColors[achievement.rarity],
        rarityGlows[achievement.rarity]
      )}
    >
      {/* Particle effects */}
      <AchievementParticles 
        isActive={showParticles} 
        rarity={achievement.rarity}
        onComplete={() => setShowParticles(false)}
      />
      
      {/* Shimmer effect for rare+ */}
      {['rare', 'epic', 'legendary'].includes(achievement.rarity) && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      )}
      
      <div className="relative z-10">
        <motion.span 
          className="text-2xl block"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.1, damping: 10 }}
        >
          {achievement.icon}
        </motion.span>
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
      </div>
      <div className="relative z-10">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-sm">Achievement Unlocked!</span>
        </motion.div>
        <motion.p 
          className="font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {achievement.name}
        </motion.p>
        <motion.p 
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          {achievement.description}
        </motion.p>
      </div>
    </motion.div>
  );
}

interface AchievementsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementsDisplay({ isOpen, onClose }: AchievementsDisplayProps) {
  const { achievements, unlockedAchievements } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'exploration', 'combat', 'social', 'story', 'secret'];
  
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const rarityColors = {
    common: 'text-slate-400 border-slate-400/30',
    uncommon: 'text-green-400 border-green-400/30',
    rare: 'text-blue-400 border-blue-400/30',
    epic: 'text-purple-400 border-purple-400/30',
    legendary: 'text-amber-400 border-amber-400/30',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="font-display text-lg">Achievements</h2>
                <span className="text-sm text-muted-foreground">
                  ({unlockedAchievements.size}/{achievements.length})
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Category Filter */}
            <div className="p-3 border-b border-border/30 overflow-x-auto">
              <div className="flex gap-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="capitalize whitespace-nowrap"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="p-4 max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredAchievements.map((achievement, index) => {
                  const isUnlocked = !!achievement.unlockedAt;
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        isUnlocked 
                          ? rarityColors[achievement.rarity]
                          : "border-border/20 opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "text-2xl relative",
                          !isUnlocked && "grayscale opacity-50"
                        )}>
                          {isUnlocked ? (
                            achievement.icon
                          ) : (
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              "font-medium text-sm truncate",
                              !isUnlocked && "text-muted-foreground"
                            )}>
                              {achievement.name}
                            </h3>
                            <span className={cn(
                              "text-[10px] uppercase px-1.5 py-0.5 rounded font-medium",
                              rarityColors[achievement.rarity].replace('border-', 'bg-').replace('/30', '/20')
                            )}>
                              {achievement.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {achievement.description}
                          </p>
                          {achievement.maxProgress && !isUnlocked && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[var(--accent-primary)] transition-all"
                                  style={{ 
                                    width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` 
                                  }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {achievement.progress || 0}/{achievement.maxProgress}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
