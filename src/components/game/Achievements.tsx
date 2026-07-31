import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, X, Sparkles, Globe, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AchievementParticles, LegendaryAchievementCelebration } from './AchievementParticles';
import {
  ACHIEVEMENT_CATEGORIES,
  type AchievementCategory,
  type AchievementRarity,
  type AchievementScope,
} from '@/lib/achievementCatalog';
import {
  mergeAchievementsWithCatalog,
  persistAchievements,
  resetRunAchievementStorage,
  type Achievement,
} from '@/lib/achievementPersistence';

export type { Achievement, AchievementCategory, AchievementRarity, AchievementScope };
export { ACHIEVEMENT_CATEGORIES };

interface AchievementsContextType {
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  unlockAchievement: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  getAchievement: (id: string) => Achievement | undefined;
  /** Clear This Tale (run) unlocks; keep Global */
  resetRunAchievements: () => void;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

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
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    mergeAchievementsWithCatalog()
  );

  const [pendingNotification, setPendingNotification] = useState<Achievement | null>(null);
  const [showLegendaryCelebration, setShowLegendaryCelebration] = useState(false);

  const notifiedThisSession = useRef<Set<string>>(new Set());

  const unlockedAchievements = useMemo(
    () => new Set(achievements.filter((a) => a.unlockedAt).map((a) => a.id)),
    [achievements]
  );

  useEffect(() => {
    persistAchievements(achievements);
  }, [achievements]);

  // New adventure / new save: wipe run progress, keep global
  useEffect(() => {
    const onReset = () => {
      notifiedThisSession.current.clear();
      setAchievements(mergeAchievementsWithCatalog());
    };
    window.addEventListener('achievements-run-reset', onReset);
    return () => window.removeEventListener('achievements-run-reset', onReset);
  }, []);

  const resetRunAchievements = useCallback(() => {
    resetRunAchievementStorage();
    notifiedThisSession.current.clear();
    setAchievements(mergeAchievementsWithCatalog());
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    if (notifiedThisSession.current.has(id)) return;

    setAchievements((prev) => {
      const achievement = prev.find((a) => a.id === id);
      if (!achievement || achievement.unlockedAt) return prev;

      notifiedThisSession.current.add(id);

      const updated = prev.map((a) =>
        a.id === id ? { ...a, unlockedAt: Date.now() } : a
      );

      const unlocked = updated.find((a) => a.id === id);
      if (unlocked) {
        setPendingNotification(unlocked);
        if (unlocked.rarity === 'legendary') {
          setShowLegendaryCelebration(true);
          setTimeout(() => setShowLegendaryCelebration(false), 3000);
        }
      }

      return updated;
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    if (notifiedThisSession.current.has(id)) return;

    setAchievements((prev) => {
      const achievement = prev.find((a) => a.id === id);
      if (!achievement || achievement.unlockedAt) return prev;

      const newProgress = Math.min(progress, achievement.maxProgress || progress);
      const shouldUnlock = achievement.maxProgress && newProgress >= achievement.maxProgress;

      if (shouldUnlock) {
        notifiedThisSession.current.add(id);

        const updated = prev.map((a) =>
          a.id === id ? { ...a, progress: newProgress, unlockedAt: Date.now() } : a
        );
        const unlocked = updated.find((a) => a.id === id);
        if (unlocked) {
          setPendingNotification(unlocked);
          if (unlocked.rarity === 'legendary') {
            setShowLegendaryCelebration(true);
            setTimeout(() => setShowLegendaryCelebration(false), 3000);
          }
        }
        return updated;
      }

      return prev.map((a) =>
        a.id === id ? { ...a, progress: newProgress } : a
      );
    });
  }, []);

  const getAchievement = useCallback(
    (id: string) => achievements.find((a) => a.id === id),
    [achievements]
  );

  useEffect(() => {
    if (pendingNotification) {
      toast.custom(() => <AchievementToast achievement={pendingNotification} />, {
        duration: pendingNotification.rarity === 'legendary' ? 6000 : 4000,
      });
      setPendingNotification(null);
    }
  }, [pendingNotification]);

  const contextValue = useMemo(
    () => ({
      achievements,
      unlockedAchievements,
      unlockAchievement,
      updateProgress,
      getAchievement,
      resetRunAchievements,
    }),
    [
      achievements,
      unlockedAchievements,
      unlockAchievement,
      updateProgress,
      getAchievement,
      resetRunAchievements,
    ]
  );

  return (
    <AchievementsContext.Provider value={contextValue}>
      {children}
      <LegendaryAchievementCelebration isActive={showLegendaryCelebration} />
    </AchievementsContext.Provider>
  );
}

function AchievementToast({ achievement }: { achievement: Achievement }) {
  const [showParticles, setShowParticles] = useState(true);

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

  useEffect(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch {
      // Audio not supported
    }
  }, [achievement.rarity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 overflow-hidden',
        'backdrop-blur-md bg-background/90',
        rarityColors[achievement.rarity],
        rarityGlows[achievement.rarity]
      )}
    >
      <AchievementParticles
        isActive={showParticles}
        rarity={achievement.rarity}
        onComplete={() => setShowParticles(false)}
      />

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
          <span className="font-bold text-sm">
            {achievement.scope === 'global' ? 'Global Achievement!' : 'Tale Achievement!'}
          </span>
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
  const [scopeFilter, setScopeFilter] = useState<'all' | AchievementScope>('all');

  const categories = ACHIEVEMENT_CATEGORIES.map((c) => c.id);

  const filteredAchievements = achievements.filter((a) => {
    if (scopeFilter !== 'all' && a.scope !== scopeFilter) return false;
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const globalUnlocked = achievements.filter((a) => a.scope === 'global' && a.unlockedAt).length;
  const globalTotal = achievements.filter((a) => a.scope === 'global').length;
  const runUnlocked = achievements.filter((a) => a.scope === 'run' && a.unlockedAt).length;
  const runTotal = achievements.filter((a) => a.scope === 'run').length;

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
            onClick={(e) => e.stopPropagation()}
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

            {/* Scope: Global vs This Tale */}
            <div className="p-3 border-b border-border/30 flex flex-wrap gap-2">
              <Button
                variant={scopeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScopeFilter('all')}
              >
                All
              </Button>
              <Button
                variant={scopeFilter === 'global' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScopeFilter('global')}
                className="gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                Global ({globalUnlocked}/{globalTotal})
              </Button>
              <Button
                variant={scopeFilter === 'run' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScopeFilter('run')}
                className="gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                This Tale ({runUnlocked}/{runTotal})
              </Button>
            </div>

            <div className="p-3 border-b border-border/30 overflow-x-auto">
              <div className="flex gap-2">
                {categories.map((cat) => (
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

            <ScrollArea className="p-4 max-h-[55vh]">
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
                        'p-3 rounded-lg border transition-all',
                        isUnlocked
                          ? rarityColors[achievement.rarity]
                          : 'border-border/20 opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'text-2xl relative',
                            !isUnlocked && 'grayscale opacity-50'
                          )}
                        >
                          {isUnlocked ? (
                            achievement.icon
                          ) : (
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={cn(
                                'font-medium text-sm truncate',
                                !isUnlocked && 'text-muted-foreground'
                              )}
                            >
                              {achievement.name}
                            </h3>
                            <span
                              className={cn(
                                'text-[10px] uppercase px-1.5 py-0.5 rounded font-medium',
                                rarityColors[achievement.rarity]
                                  .replace('border-', 'bg-')
                                  .replace('/30', '/20')
                              )}
                            >
                              {achievement.rarity}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {achievement.scope === 'global' ? 'Global' : 'This Tale'}
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
                                    width: `${
                                      ((achievement.progress || 0) / achievement.maxProgress) * 100
                                    }%`,
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
