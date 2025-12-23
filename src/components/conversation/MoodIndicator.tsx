// Mood Indicator Component

import { cn } from '@/lib/utils';
import { EmotionType } from '@/game/portraitSystem';
import { EmotionalState } from '@/types/game';
import { 
  Smile, Frown, Angry, AlertCircle, Heart, 
  Meh, Eye, Ghost, Zap, ThumbsUp, Brain, HelpCircle
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
  fearful: {
    icon: Ghost,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20',
    label: 'Fearful'
  },
  surprised: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    label: 'Surprised'
  },
  disgusted: {
    icon: HelpCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Disgusted'
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
  },
  hurt: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    label: 'Hurt'
  },
  smug: {
    icon: ThumbsUp,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/20',
    label: 'Smug'
  },
  thoughtful: {
    icon: Brain,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/20',
    label: 'Thoughtful'
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
