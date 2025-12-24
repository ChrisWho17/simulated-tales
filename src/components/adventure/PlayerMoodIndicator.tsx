// Player Mood Indicator - Shows current emotional state with portrait expression

import { cn } from '@/lib/utils';
import { MoodState, MOOD_NARRATIVE_DESCRIPTORS } from '@/game/emotionalStateSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Frown, Angry, AlertCircle, Heart, 
  Meh, Eye, Ghost, Zap, ThumbsUp, Brain, 
  Flame, Target, Star, Coffee, Moon, 
  Sparkles, Shield, Search
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlayerMoodIndicatorProps {
  currentMood: MoodState;
  moodIntensity: number;
  characterName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const MOOD_CONFIG: Record<MoodState, {
  icon: typeof Smile;
  color: string;
  bgColor: string;
  glowColor: string;
  label: string;
}> = {
  neutral: {
    icon: Meh,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    glowColor: 'shadow-muted/20',
    label: 'Calm'
  },
  happy: {
    icon: Smile,
    color: 'text-success',
    bgColor: 'bg-success/20',
    glowColor: 'shadow-success/30',
    label: 'Happy'
  },
  confident: {
    icon: Star,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/20',
    glowColor: 'shadow-amber-400/30',
    label: 'Confident'
  },
  proud: {
    icon: ThumbsUp,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    glowColor: 'shadow-amber-500/30',
    label: 'Proud'
  },
  loving: {
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20',
    glowColor: 'shadow-pink-500/30',
    label: 'Loving'
  },
  determined: {
    icon: Target,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    glowColor: 'shadow-orange-500/30',
    label: 'Determined'
  },
  curious: {
    icon: Search,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/20',
    glowColor: 'shadow-cyan-400/30',
    label: 'Curious'
  },
  calm: {
    icon: Coffee,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/20',
    glowColor: 'shadow-emerald-400/30',
    label: 'Calm'
  },
  anxious: {
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    glowColor: 'shadow-warning/30',
    label: 'Anxious'
  },
  afraid: {
    icon: Ghost,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20',
    glowColor: 'shadow-purple-400/30',
    label: 'Afraid'
  },
  terrified: {
    icon: Ghost,
    color: 'text-purple-600',
    bgColor: 'bg-purple-600/20',
    glowColor: 'shadow-purple-600/40',
    label: 'Terrified'
  },
  sad: {
    icon: Frown,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    glowColor: 'shadow-blue-400/30',
    label: 'Sad'
  },
  desperate: {
    icon: Flame,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    glowColor: 'shadow-red-500/30',
    label: 'Desperate'
  },
  heartbroken: {
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-600/20',
    glowColor: 'shadow-rose-600/30',
    label: 'Heartbroken'
  },
  angry: {
    icon: Angry,
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    glowColor: 'shadow-destructive/30',
    label: 'Angry'
  },
  enraged: {
    icon: Flame,
    color: 'text-red-600',
    bgColor: 'bg-red-600/20',
    glowColor: 'shadow-red-600/40',
    label: 'Enraged'
  },
  pained: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    glowColor: 'shadow-orange-400/30',
    label: 'In Pain'
  },
  exhausted: {
    icon: Moon,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/20',
    glowColor: 'shadow-slate-400/30',
    label: 'Exhausted'
  },
  greedy: {
    icon: Sparkles,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    glowColor: 'shadow-yellow-500/30',
    label: 'Greedy'
  },
  suspicious: {
    icon: Eye,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    glowColor: 'shadow-warning/30',
    label: 'Suspicious'
  }
};

const SIZE_CLASSES = {
  sm: {
    container: 'h-7 px-2 gap-1.5',
    icon: 'w-3.5 h-3.5',
    text: 'text-xs',
    intensity: 'w-12 h-1'
  },
  md: {
    container: 'h-9 px-3 gap-2',
    icon: 'w-4 h-4',
    text: 'text-sm',
    intensity: 'w-16 h-1.5'
  },
  lg: {
    container: 'h-11 px-4 gap-2.5',
    icon: 'w-5 h-5',
    text: 'text-base',
    intensity: 'w-20 h-2'
  }
};

export function PlayerMoodIndicator({ 
  currentMood, 
  moodIntensity, 
  characterName,
  showLabel = true,
  size = 'md'
}: PlayerMoodIndicatorProps) {
  const config = MOOD_CONFIG[currentMood] || MOOD_CONFIG.neutral;
  const Icon = config.icon;
  const sizeClasses = SIZE_CLASSES[size];
  const descriptors = MOOD_NARRATIVE_DESCRIPTORS[currentMood];
  
  // Get intensity description
  const intensityWord = moodIntensity > 0.7 ? 'Intensely' : 
                        moodIntensity > 0.4 ? 'Noticeably' : 'Slightly';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              "inline-flex items-center rounded-full",
              "transition-all duration-500 cursor-default",
              "border border-border/30 backdrop-blur-sm",
              config.bgColor,
              sizeClasses.container
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={currentMood}
          >
            {/* Mood Icon with pulse animation for high intensity */}
            <motion.div
              animate={moodIntensity > 0.7 ? {
                scale: [1, 1.15, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Icon className={cn(sizeClasses.icon, config.color)} />
            </motion.div>
            
            {showLabel && (
              <>
                <span className={cn("font-medium", sizeClasses.text, config.color)}>
                  {config.label}
                </span>
                
                {/* Intensity bar */}
                <div className={cn(
                  "rounded-full overflow-hidden bg-background/50",
                  sizeClasses.intensity
                )}>
                  <motion.div 
                    className={cn("h-full rounded-full", config.bgColor.replace('/20', '/60'))}
                    initial={{ width: 0 }}
                    animate={{ width: `${moodIntensity * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs glass-panel border-border/50"
        >
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2">
              <Icon className={cn("w-5 h-5", config.color)} />
              <span className="font-semibold">
                {characterName ? `${characterName} feels` : 'Feeling'} {intensityWord.toLowerCase()} {config.label.toLowerCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {descriptors?.internalState[0] || 'A complex mix of emotions'}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground/70">Physical signs:</span> {descriptors?.physicalSigns[0]}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for tight spaces
export function PlayerMoodIndicatorCompact({ 
  currentMood, 
  moodIntensity 
}: { 
  currentMood: MoodState; 
  moodIntensity: number;
}) {
  const config = MOOD_CONFIG[currentMood] || MOOD_CONFIG.neutral;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "transition-all duration-300 cursor-default",
              "border border-border/30",
              config.bgColor
            )}
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={currentMood}
          >
            <Icon className={cn("w-4 h-4", config.color)} />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="glass-panel border-border/50">
          <span className={cn("font-medium", config.color)}>{config.label}</span>
          <span className="text-muted-foreground ml-1">
            ({Math.round(moodIntensity * 100)}%)
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
