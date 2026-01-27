// ============================================================================
// MOOD INDICATOR - Visual mood display with tooltip for companions
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  Smile, Meh, Frown, Heart, Angry, AlertTriangle,
  Sparkles, Cloud, Skull, Snowflake
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CompanionMood } from '@/game/companion/companionTypes';
import { cn } from '@/lib/utils';

interface MoodIndicatorProps {
  mood: CompanionMood;
  moodIntensity?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Mood configuration with icons, colors, and descriptions
const MOOD_CONFIG: Record<CompanionMood, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
}> = {
  joyful: {
    icon: Sparkles,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/40',
    label: 'Joyful',
    description: 'Feeling happy and content with how things are going.',
  },
  content: {
    icon: Smile,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    label: 'Content',
    description: 'Satisfied with the current situation.',
  },
  neutral: {
    icon: Meh,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/40',
    label: 'Neutral',
    description: 'Neither particularly happy nor upset.',
  },
  annoyed: {
    icon: Frown,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    label: 'Annoyed',
    description: 'Something is bothering them.',
  },
  angry: {
    icon: Angry,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/40',
    label: 'Angry',
    description: 'Upset about recent events or actions.',
  },
  sad: {
    icon: Cloud,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    label: 'Sad',
    description: 'Feeling down or melancholic.',
  },
  fearful: {
    icon: AlertTriangle,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    label: 'Fearful',
    description: 'Anxious or worried about something.',
  },
  disgusted: {
    icon: Snowflake,
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/20',
    borderColor: 'border-amber-600/40',
    label: 'Disgusted',
    description: 'Repulsed by recent events or behavior.',
  },
  romantic: {
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/40',
    label: 'Romantic',
    description: 'Feeling affectionate and drawn to you.',
  },
  betrayed: {
    icon: Skull,
    color: 'text-red-700',
    bgColor: 'bg-red-700/20',
    borderColor: 'border-red-700/40',
    label: 'Betrayed',
    description: 'Deeply hurt by a breach of trust.',
  },
};

const SIZE_CLASSES = {
  sm: { container: 'w-4 h-4', icon: 'w-2.5 h-2.5' },
  md: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5' },
  lg: { container: 'w-8 h-8', icon: 'w-5 h-5' },
};

export function MoodIndicator({ 
  mood, 
  moodIntensity = 50, 
  size = 'md',
  showLabel = false,
  className 
}: MoodIndicatorProps) {
  const config = MOOD_CONFIG[mood];
  const Icon = config.icon;
  const sizeClasses = SIZE_CLASSES[size];
  
  // Intensity affects animation speed
  const pulseSpeed = moodIntensity > 70 ? 1 : moodIntensity > 40 ? 1.5 : 2;
  const shouldPulse = ['angry', 'fearful', 'betrayed', 'joyful', 'romantic'].includes(mood) && moodIntensity > 50;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "flex items-center gap-1.5 cursor-help",
              className
            )}
            animate={shouldPulse ? { scale: [1, 1.1, 1] } : undefined}
            transition={shouldPulse ? { duration: pulseSpeed, repeat: Infinity } : undefined}
          >
            <div className={cn(
              "rounded-full flex items-center justify-center border",
              sizeClasses.container,
              config.bgColor,
              config.borderColor
            )}>
              <Icon className={cn(sizeClasses.icon, config.color)} />
            </div>
            {showLabel && (
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="z-[200] bg-popover border border-border/50 backdrop-blur-sm"
        >
          <div className="space-y-1 max-w-48">
            <div className="flex items-center gap-2">
              <Icon className={cn("w-4 h-4", config.color)} />
              <span className={cn("font-medium", config.color)}>{config.label}</span>
              <span className="text-xs text-muted-foreground">
                ({moodIntensity}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact inline mood badge
export function MoodBadge({ mood, className }: { mood: CompanionMood; className?: string }) {
  const config = MOOD_CONFIG[mood];
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium cursor-help",
            config.bgColor,
            config.color,
            className
          )}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[200] bg-popover border border-border/50">
          <p className="text-xs max-w-48">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
