import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Utensils, 
  Battery, 
  Users, 
  Sparkles, 
  Droplet, 
  Toilet, 
  Sofa,
  AlertTriangle,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { 
  LifeSimNeed, 
  LifeSimNeedsState, 
  calculateLifeSimMood,
  LIFESIM_ACTIVITIES
} from '@/game/lifeSim/needsDefinitions';
import { cn } from '@/lib/utils';

type NeedType = keyof LifeSimNeedsState;

interface NeedsPanelProps {
  needs: LifeSimNeedsState;
  compact?: boolean;
  showMood?: boolean;
  onNeedClick?: (needType: NeedType) => void;
}

const NEED_ICONS: Record<NeedType, React.ElementType> = {
  hunger: Utensils,
  energy: Battery,
  social: Users,
  fun: Sparkles,
  hygiene: Droplet,
  bladder: Toilet,
  comfort: Sofa,
};

const NEED_COLORS: Record<NeedType, { base: string; low: string; critical: string }> = {
  hunger: { base: 'hsl(142 71% 45%)', low: 'hsl(48 96% 53%)', critical: 'hsl(0 84% 60%)' },
  energy: { base: 'hsl(48 96% 53%)', low: 'hsl(48 80% 40%)', critical: 'hsl(0 84% 60%)' },
  social: { base: 'hsl(217 91% 60%)', low: 'hsl(271 70% 50%)', critical: 'hsl(0 84% 60%)' },
  fun: { base: 'hsl(330 81% 60%)', low: 'hsl(330 60% 45%)', critical: 'hsl(0 84% 60%)' },
  hygiene: { base: 'hsl(187 85% 43%)', low: 'hsl(187 60% 35%)', critical: 'hsl(0 84% 60%)' },
  bladder: { base: 'hsl(25 95% 53%)', low: 'hsl(25 80% 40%)', critical: 'hsl(0 84% 60%)' },
  comfort: { base: 'hsl(271 91% 65%)', low: 'hsl(271 60% 50%)', critical: 'hsl(0 84% 60%)' },
};

const getNeedColor = (needType: NeedType, value: number): string => {
  const colors = NEED_COLORS[needType];
  if (value <= 15) return colors.critical;
  if (value <= 35) return colors.low;
  return colors.base;
};

const getNeedStatus = (value: number): 'critical' | 'low' | 'moderate' | 'good' | 'excellent' => {
  if (value <= 15) return 'critical';
  if (value <= 35) return 'low';
  if (value <= 55) return 'moderate';
  if (value <= 80) return 'good';
  return 'excellent';
};

const getStatusEmoji = (status: ReturnType<typeof getNeedStatus>): string => {
  switch (status) {
    case 'critical': return '😰';
    case 'low': return '😟';
    case 'moderate': return '😐';
    case 'good': return '😊';
    case 'excellent': return '😄';
  }
};

const getMoodEmoji = (mood: number): { emoji: string; label: string } => {
  if (mood >= 80) return { emoji: '🤩', label: 'Thriving' };
  if (mood >= 60) return { emoji: '😊', label: 'Happy' };
  if (mood >= 40) return { emoji: '😐', label: 'Fine' };
  if (mood >= 20) return { emoji: '😞', label: 'Unhappy' };
  return { emoji: '😫', label: 'Miserable' };
};

// Get satisfying activities for a need
const getSatisfyingActivities = (needType: NeedType): string[] => {
  return LIFESIM_ACTIVITIES
    .filter(activity => activity.effects[needType] && activity.effects[needType]! > 0)
    .slice(0, 3)
    .map(activity => activity.name);
};

const NeedBar: React.FC<{
  needType: NeedType;
  need: LifeSimNeed;
  compact?: boolean;
  onClick?: () => void;
}> = ({ needType, need, compact, onClick }) => {
  const Icon = NEED_ICONS[needType];
  const status = getNeedStatus(need.current);
  const color = getNeedColor(needType, need.current);
  const isCritical = status === 'critical';
  const isLow = status === 'low';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
              "hover:bg-muted/50",
              isCritical && "bg-destructive/10 animate-pulse",
              isLow && "bg-warning/10"
            )}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Icon */}
            <div 
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                isCritical ? "bg-destructive/20" : "bg-muted"
              )}
              style={{ color }}
            >
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {!compact && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate">
                    {need.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(need.current)}%
                    </span>
                  </div>
                </div>
              )}
              
              {/* Progress bar */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${need.current}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                
                {/* Critical warning pulse */}
                {isCritical && (
                  <motion.div
                    className="absolute inset-0 bg-destructive/30 rounded-full"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            </div>

            {/* Critical indicator */}
            <AnimatePresence>
              {isCritical && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getStatusEmoji(status)}</span>
              <span className="font-semibold">{need.name}</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="font-medium">{Math.round(need.current)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Decay Rate:</span>
                <span className="font-medium">{need.decayRate}/hr</span>
              </div>
            </div>
            {isCritical && (
              <div className="text-xs text-destructive">
                ⚠️ Critical! Find a way to satisfy this need soon.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const NeedsPanel: React.FC<NeedsPanelProps> = ({
  needs,
  compact = false,
  showMood = true,
  onNeedClick,
}) => {
  const overallMood = calculateLifeSimMood(needs);
  const moodInfo = getMoodEmoji(overallMood);
  
  // Sort needs by value (lowest first for priority)
  const sortedNeeds = (Object.entries(needs) as [NeedType, LifeSimNeed][]).sort(
    ([, a], [, b]) => a.current - b.current
  );

  // Get critical needs for warning
  const criticalNeeds = sortedNeeds.filter(
    ([, need]) => getNeedStatus(need.current) === 'critical'
  );

  return (
    <div className={cn(
      "bg-card/50 backdrop-blur-sm rounded-lg border border-border/50",
      compact ? "p-2" : "p-4"
    )}>
      {/* Header with mood */}
      {showMood && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodInfo.emoji}</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {moodInfo.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                Overall Mood: {Math.round(overallMood)}%
              </p>
            </div>
          </div>
          
          {/* Critical warning badge */}
          <AnimatePresence>
            {criticalNeeds.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 px-2 py-1 bg-destructive/20 text-destructive text-xs rounded-full"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{criticalNeeds.length} critical</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Needs list */}
      <div className={cn(
        "space-y-1",
        compact && "grid grid-cols-2 gap-1 space-y-0"
      )}>
        {sortedNeeds.map(([needType, need]) => (
          <NeedBar
            key={needType}
            needType={needType}
            need={need}
            compact={compact}
            onClick={() => onNeedClick?.(needType)}
          />
        ))}
      </div>

      {/* Quick tips for critical needs */}
      {!compact && criticalNeeds.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
          <div className="space-y-1">
            {criticalNeeds.slice(0, 2).map(([needType]) => {
              const activities = getSatisfyingActivities(needType);
              const suggestion = activities[0];
              return suggestion ? (
                <div 
                  key={needType}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <span className="text-primary">→</span>
                  <span>Try: {suggestion}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NeedsPanel;
