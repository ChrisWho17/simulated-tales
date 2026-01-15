import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectArcMoment, ArcMoment, ArcDetectionContext } from '@/game/characterAISystem';
import { Backstory, PersonalityTrait, CharacterFlaw } from '@/game/characterDevelopmentSystem';
import { cn } from '@/lib/utils';
import { 
  Sparkles, TrendingUp, TrendingDown, Lightbulb, 
  RotateCcw, Heart, Skull, X, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArcMomentNotificationProps {
  characterName: string;
  backstory?: Backstory;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  recentEvents: string[];
  currentSituation: string;
  emotionalState?: string;
  relationshipsChanged?: string[];
  majorChoicesMade?: string[];
  onDismiss?: () => void;
  onMilestoneAdd?: (milestone: string) => void;
  className?: string;
}

const ARC_TYPE_CONFIG = {
  growth: {
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/20 to-emerald-500/5',
    borderColor: 'border-emerald-500/30',
    label: 'Character Growth',
  },
  setback: {
    icon: TrendingDown,
    color: 'text-amber-400',
    bgColor: 'from-amber-500/20 to-amber-500/5',
    borderColor: 'border-amber-500/30',
    label: 'Setback',
  },
  revelation: {
    icon: Lightbulb,
    color: 'text-blue-400',
    bgColor: 'from-blue-500/20 to-blue-500/5',
    borderColor: 'border-blue-500/30',
    label: 'Revelation',
  },
  turning_point: {
    icon: RotateCcw,
    color: 'text-purple-400',
    bgColor: 'from-purple-500/20 to-purple-500/5',
    borderColor: 'border-purple-500/30',
    label: 'Turning Point',
  },
  redemption: {
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'from-pink-500/20 to-pink-500/5',
    borderColor: 'border-pink-500/30',
    label: 'Redemption',
  },
  corruption: {
    icon: Skull,
    color: 'text-red-400',
    bgColor: 'from-red-500/20 to-red-500/5',
    borderColor: 'border-red-500/30',
    label: 'Corruption',
  },
};

export function ArcMomentNotification({
  characterName,
  backstory,
  traits,
  flaws,
  recentEvents,
  currentSituation,
  emotionalState,
  relationshipsChanged,
  majorChoicesMade,
  onDismiss,
  onMilestoneAdd,
  className,
}: ArcMomentNotificationProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [arcMoment, setArcMoment] = useState<ArcMoment | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkForArcMoment = async () => {
      if (recentEvents.length === 0 || traits.length === 0) return;
      
      setIsChecking(true);
      
      try {
        const context: ArcDetectionContext = {
          characterName,
          backstory,
          traits,
          flaws,
          recentEvents,
          currentSituation,
          emotionalState,
          relationshipsChanged,
          majorChoicesMade,
        };
        
        const moment = await detectArcMoment(context);
        if (moment) {
          setArcMoment(moment);
          setIsDismissed(false);
        }
      } catch (error) {
        console.error('Arc detection failed:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Only check when there's meaningful content
    if (recentEvents.length >= 2 && currentSituation) {
      const timer = setTimeout(checkForArcMoment, 2000);
      return () => clearTimeout(timer);
    }
  }, [characterName, backstory, traits, flaws, recentEvents, currentSituation, emotionalState, relationshipsChanged, majorChoicesMade]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleAddMilestone = () => {
    if (arcMoment?.suggestedMilestone || arcMoment?.title) {
      onMilestoneAdd?.(arcMoment.suggestedMilestone || arcMoment.title);
    }
    handleDismiss();
  };

  if (!arcMoment || isDismissed) return null;

  const config = ARC_TYPE_CONFIG[arcMoment.type] || ARC_TYPE_CONFIG.growth;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={cn(
          "rounded-lg border overflow-hidden",
          `bg-gradient-to-br ${config.bgColor}`,
          config.borderColor,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full bg-background/50", config.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className={cn("text-xs font-medium", config.color)}>{config.label}</p>
              <p className="text-sm font-semibold">{arcMoment.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-3">
                <p className="text-sm text-muted-foreground">{arcMoment.description}</p>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    arcMoment.significance === 'pivotal' && "bg-primary/20 text-primary",
                    arcMoment.significance === 'major' && "bg-amber-500/20 text-amber-400",
                    arcMoment.significance === 'moderate' && "bg-blue-500/20 text-blue-400",
                    arcMoment.significance === 'minor' && "bg-muted text-muted-foreground"
                  )}>
                    {arcMoment.significance}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {arcMoment.emotionalImpact}
                  </span>
                </div>

                {arcMoment.futureImplications && (
                  <p className="text-xs text-muted-foreground italic">
                    → {arcMoment.futureImplications}
                  </p>
                )}

                {onMilestoneAdd && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleAddMilestone}
                  >
                    <Sparkles className="w-4 h-4" />
                    Add to Character Milestones
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
