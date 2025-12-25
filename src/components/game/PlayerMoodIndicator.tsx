// Player Mood Indicator Component
// Color-coded mood display that influences character behavior and dialogue

import { cn } from '@/lib/utils';

export type PlayerMoodType = 
  | 'lusty' 
  | 'angry' 
  | 'annoyed' 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'depressed'
  | 'fearful'
  | 'excited'
  | 'calm'
  | 'anxious'
  | 'content';

interface MoodConfig {
  color: string;
  bgColor: string;
  glowColor: string;
  label: string;
  emoji: string;
}

export const PLAYER_MOOD_CONFIG: Record<PlayerMoodType, MoodConfig> = {
  lusty: {
    color: '#ec4899', // pink-500
    bgColor: 'bg-pink-500/20',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    label: 'Lusty',
    emoji: '💋'
  },
  angry: {
    color: '#ef4444', // red-500
    bgColor: 'bg-red-500/20',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    label: 'Angry',
    emoji: '😠'
  },
  annoyed: {
    color: '#f97316', // orange-500
    bgColor: 'bg-orange-500/20',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    label: 'Annoyed',
    emoji: '😤'
  },
  neutral: {
    color: '#9ca3af', // gray-400
    bgColor: 'bg-gray-400/20',
    glowColor: 'rgba(156, 163, 175, 0.4)',
    label: 'Neutral',
    emoji: '😐'
  },
  happy: {
    color: '#22c55e', // green-500
    bgColor: 'bg-green-500/20',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    label: 'Happy',
    emoji: '😊'
  },
  sad: {
    color: '#3b82f6', // blue-500
    bgColor: 'bg-blue-500/20',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    label: 'Sad',
    emoji: '😢'
  },
  depressed: {
    color: '#8b5cf6', // purple-500
    bgColor: 'bg-purple-500/20',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    label: 'Depressed',
    emoji: '😞'
  },
  fearful: {
    color: '#a855f7', // violet-500
    bgColor: 'bg-violet-500/20',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    label: 'Fearful',
    emoji: '😨'
  },
  excited: {
    color: '#eab308', // yellow-500
    bgColor: 'bg-yellow-500/20',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    label: 'Excited',
    emoji: '🤩'
  },
  calm: {
    color: '#14b8a6', // teal-500
    bgColor: 'bg-teal-500/20',
    glowColor: 'rgba(20, 184, 166, 0.5)',
    label: 'Calm',
    emoji: '😌'
  },
  anxious: {
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-500/20',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    label: 'Anxious',
    emoji: '😰'
  },
  content: {
    color: '#10b981', // emerald-500
    bgColor: 'bg-emerald-500/20',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    label: 'Content',
    emoji: '🙂'
  }
};

// Derive mood from player stats/state
export function derivePlayerMood(stats: {
  stress?: number;
  health?: number;
  energy?: number;
  tension?: number;
  hunger?: number;
}): PlayerMoodType {
  const { stress = 20, health = 100, energy = 100, tension = 0, hunger = 0 } = stats;
  
  // High tension with adult content
  if (tension > 70) return 'lusty';
  
  // Very low health - fearful
  if (health < 30) return 'fearful';
  
  // High stress levels
  if (stress > 80) return 'anxious';
  if (stress > 60) return 'annoyed';
  
  // Depression from multiple low stats
  if (health < 50 && energy < 30 && stress > 50) return 'depressed';
  
  // Sadness from low energy/health
  if (health < 40 || energy < 20) return 'sad';
  
  // Anger from stress + hunger
  if (stress > 50 && hunger > 60) return 'angry';
  
  // Excitement from high energy + low stress
  if (energy > 80 && stress < 20) return 'excited';
  
  // Content when things are balanced
  if (health > 70 && energy > 60 && stress < 30) return 'content';
  
  // Happy when all good
  if (health > 80 && energy > 70 && stress < 20) return 'happy';
  
  // Calm when moderate
  if (stress < 40 && health > 50) return 'calm';
  
  return 'neutral';
}

interface PlayerMoodIndicatorProps {
  mood: PlayerMoodType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function PlayerMoodIndicator({ 
  mood, 
  size = 'md', 
  showLabel = false,
  className 
}: PlayerMoodIndicatorProps) {
  const config = PLAYER_MOOD_CONFIG[mood] || PLAYER_MOOD_CONFIG.neutral;
  
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm'
  };
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div 
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          config.bgColor
        )}
        style={{ 
          boxShadow: `0 0 12px ${config.glowColor}`,
          border: `2px solid ${config.color}`
        }}
        title={config.label}
      >
        <span>{config.emoji}</span>
      </div>
      {showLabel && (
        <span 
          className="text-xs font-medium"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact badge version for portrait overlay
export function MoodBadge({ mood }: { mood: PlayerMoodType }) {
  const config = PLAYER_MOOD_CONFIG[mood] || PLAYER_MOOD_CONFIG.neutral;
  
  return (
    <div 
      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-background z-10"
      style={{ 
        backgroundColor: config.color,
        boxShadow: `0 0 8px ${config.glowColor}`
      }}
      title={config.label}
    >
      {config.emoji}
    </div>
  );
}

export default PlayerMoodIndicator;
