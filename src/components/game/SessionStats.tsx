import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Clock, Users, MapPin, Swords, MessageCircle, 
  Footprints, Star, Trophy, X, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SessionStatsData {
  sessionStartTime: number;
  totalPlayTime: number; // in seconds
  choicesMade: number;
  npcsEncountered: string[];
  locationsVisited: string[];
  combatEncounters: number;
  dialogueExchanges: number;
  distanceTraveled: number;
  itemsAcquired: number;
  itemsUsed: number;
  deathCount: number;
  criticalSuccesses: number;
  criticalFailures: number;
  questsCompleted: number;
  secretsDiscovered: number;
}

interface SessionStatsContextType {
  stats: SessionStatsData;
  incrementStat: (stat: keyof SessionStatsData, value?: number) => void;
  addNpcEncounter: (npcName: string) => void;
  addLocationVisit: (locationName: string) => void;
  resetSession: () => void;
  getFormattedPlayTime: () => string;
  getTotalPlayTimeHours: () => number;
}

const SessionStatsContext = createContext<SessionStatsContextType | null>(null);

const STORAGE_KEY = 'untold-session-stats';

const DEFAULT_STATS: SessionStatsData = {
  sessionStartTime: Date.now(),
  totalPlayTime: 0,
  choicesMade: 0,
  npcsEncountered: [],
  locationsVisited: [],
  combatEncounters: 0,
  dialogueExchanges: 0,
  distanceTraveled: 0,
  itemsAcquired: 0,
  itemsUsed: 0,
  deathCount: 0,
  criticalSuccesses: 0,
  criticalFailures: 0,
  questsCompleted: 0,
  secretsDiscovered: 0,
};

export function useSessionStats() {
  const context = useContext(SessionStatsContext);
  if (!context) {
    throw new Error('useSessionStats must be used within SessionStatsProvider');
  }
  return context;
}

export function useSessionStatsOptional() {
  return useContext(SessionStatsContext);
}

interface SessionStatsProviderProps {
  children: ReactNode;
  onPlayTimeReached?: (hours: number) => void;
}

export function SessionStatsProvider({ children, onPlayTimeReached }: SessionStatsProviderProps) {
  const [stats, setStats] = useState<SessionStatsData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATS, ...parsed, sessionStartTime: Date.now() };
      }
    } catch (e) {
      console.error('Failed to load session stats:', e);
    }
    return { ...DEFAULT_STATS };
  });

  // Track last reported hour milestone for achievement unlocks
  const lastReportedHour = useRef<number>(Math.floor(stats.totalPlayTime / 3600));

  // Track play time and trigger achievement milestones
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        const newPlayTime = prev.totalPlayTime + 1;
        const currentHour = Math.floor(newPlayTime / 3600);
        
        // Check if we've crossed a new hour milestone
        if (currentHour > lastReportedHour.current) {
          lastReportedHour.current = currentHour;
          // Trigger the callback for achievement system
          if (onPlayTimeReached) {
            onPlayTimeReached(currentHour);
          }
          console.log(`[SessionStats] Play time milestone reached: ${currentHour} hour(s)`);
        }
        
        return {
          ...prev,
          totalPlayTime: newPlayTime,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onPlayTimeReached]);

  // Save stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }, 10000);
    return () => clearInterval(interval);
  }, [stats]);

  const incrementStat = useCallback((stat: keyof SessionStatsData, value = 1) => {
    setStats(prev => ({
      ...prev,
      [stat]: typeof prev[stat] === 'number' ? (prev[stat] as number) + value : prev[stat],
    }));
  }, []);

  const addNpcEncounter = useCallback((npcName: string) => {
    setStats(prev => ({
      ...prev,
      npcsEncountered: prev.npcsEncountered.includes(npcName)
        ? prev.npcsEncountered
        : [...prev.npcsEncountered, npcName],
    }));
  }, []);

  const addLocationVisit = useCallback((locationName: string) => {
    setStats(prev => ({
      ...prev,
      locationsVisited: prev.locationsVisited.includes(locationName)
        ? prev.locationsVisited
        : [...prev.locationsVisited, locationName],
    }));
  }, []);

  const resetSession = useCallback(() => {
    setStats({ ...DEFAULT_STATS, sessionStartTime: Date.now() });
    lastReportedHour.current = 0;
  }, []);

  const getFormattedPlayTime = useCallback(() => {
    const hours = Math.floor(stats.totalPlayTime / 3600);
    const minutes = Math.floor((stats.totalPlayTime % 3600) / 60);
    const seconds = stats.totalPlayTime % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  }, [stats.totalPlayTime]);

  const getTotalPlayTimeHours = useCallback(() => {
    return stats.totalPlayTime / 3600;
  }, [stats.totalPlayTime]);

  return (
    <SessionStatsContext.Provider value={{ 
      stats, 
      incrementStat, 
      addNpcEncounter, 
      addLocationVisit, 
      resetSession,
      getFormattedPlayTime,
      getTotalPlayTimeHours,
    }}>
      {children}
    </SessionStatsContext.Provider>
  );
}

interface SessionStatsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionStatsDisplay({ isOpen, onClose }: SessionStatsDisplayProps) {
  const { stats, getFormattedPlayTime } = useSessionStats();

  const statItems = [
    { icon: Clock, label: 'Play Time', value: getFormattedPlayTime(), color: 'text-blue-400' },
    { icon: MessageCircle, label: 'Choices Made', value: stats.choicesMade, color: 'text-violet-400' },
    { icon: Users, label: 'NPCs Met', value: stats.npcsEncountered.length, color: 'text-emerald-400' },
    { icon: MapPin, label: 'Locations Visited', value: stats.locationsVisited.length, color: 'text-amber-400' },
    { icon: Swords, label: 'Combat Encounters', value: stats.combatEncounters, color: 'text-red-400' },
    { icon: MessageCircle, label: 'Dialogues', value: stats.dialogueExchanges, color: 'text-cyan-400' },
    { icon: Star, label: 'Critical Successes', value: stats.criticalSuccesses, color: 'text-yellow-400' },
    { icon: Activity, label: 'Critical Failures', value: stats.criticalFailures, color: 'text-orange-400' },
    { icon: Trophy, label: 'Quests Completed', value: stats.questsCompleted, color: 'text-purple-400' },
    { icon: Footprints, label: 'Secrets Found', value: stats.secretsDiscovered, color: 'text-pink-400' },
  ];

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
            className="glass-panel w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="font-display text-lg">Session Stats</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="p-4 max-h-[60vh]">
              <div className="grid grid-cols-2 gap-3">
                {statItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg bg-black/30 border border-border/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className={cn("w-4 h-4", item.color)} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="text-xl font-bold font-mono">
                      {item.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* NPCs List */}
              {stats.npcsEncountered.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-black/30 border border-border/30">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    NPCs Encountered
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {stats.npcsEncountered.slice(0, 10).map(npc => (
                      <span key={npc} className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                        {npc}
                      </span>
                    ))}
                    {stats.npcsEncountered.length > 10 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">
                        +{stats.npcsEncountered.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Locations List */}
              {stats.locationsVisited.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-black/30 border border-border/30">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    Locations Visited
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {stats.locationsVisited.slice(0, 8).map(loc => (
                      <span key={loc} className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                        {loc}
                      </span>
                    ))}
                    {stats.locationsVisited.length > 8 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">
                        +{stats.locationsVisited.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mini stats bar for in-game display
export function MiniSessionStats() {
  const [isExpanded, setIsExpanded] = useState(false);
  const statsContext = useSessionStatsOptional();
  
  if (!statsContext) return null;
  
  const { stats, getFormattedPlayTime } = statsContext;

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-panel-subtle flex items-center gap-2"
      >
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-mono">{getFormattedPlayTime()}</span>
        <ChevronUp className={cn(
          "w-3 h-3 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 glass-panel-subtle p-3 rounded-lg min-w-[200px]"
          >
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Choices:</span>
                <span className="font-mono">{stats.choicesMade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NPCs Met:</span>
                <span className="font-mono">{stats.npcsEncountered.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locations:</span>
                <span className="font-mono">{stats.locationsVisited.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Combats:</span>
                <span className="font-mono">{stats.combatEncounters}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
