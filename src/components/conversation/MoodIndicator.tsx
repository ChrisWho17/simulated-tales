// Mood Indicator Component

import { cn } from '@/lib/utils';
import { EmotionType } from '@/game/portraitSystem';
import { EmotionalState } from '@/types/game';
import { 
  Smile, Frown, Angry, AlertCircle, Heart, 
  Meh, Eye, Ghost
} from 'lucide-react';

interface MoodIndicatorProps {
  emotion: EmotionType;
  emotionalState: EmotionalState;
}

const EMOTION_CONFIG: Record<EmotionType, {
  icon: typeof Smile;
  color: string;
  bgColor: string;
  label: string;
}> = {
  neutral: {
    icon: Meh,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    label: 'Calm'
  },
  happy: {
    icon: Smile,
    color: 'text-success',
    bgColor: 'bg-success/20',
    label: 'Happy'
  },
  angry: {
    icon: Angry,
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    label: 'Angry'
  },
  sad: {
    icon: Frown,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    label: 'Sad'
  },
  scared: {
    icon: Ghost,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20',
    label: 'Fearful'
  },
  flirty: {
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20',
    label: 'Flirty'
  },
  suspicious: {
    icon: Eye,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    label: 'Suspicious'
  }
};

export function MoodIndicator({ emotion, emotionalState }: MoodIndicatorProps) {
  const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.neutral;
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "transition-all duration-500",
        config.bgColor
      )}
    >
      <Icon className={cn("w-4 h-4", config.color)} />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}

// Compact version for UI headers
export function MoodIndicatorCompact({ emotion }: { emotion: EmotionType }) {
  const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.neutral;
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center",
        config.bgColor
      )}
      title={config.label}
    >
      <Icon className={cn("w-3 h-3", config.color)} />
    </div>
  );
}
