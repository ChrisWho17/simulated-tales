// Player Mood Indicator Component
// Genre-adaptive color-coded mood display per PDF design

import { cn } from '@/lib/utils';
import { CoreMoodType, MOOD_COLORS, GENRE_MOOD_DESCRIPTORS, deriveMoodFromStats } from '@/game/moodSystem';
import { GameGenre } from '@/types/genreData';

// Re-export for backward compatibility
export type PlayerMoodType = CoreMoodType;

export { deriveMoodFromStats as derivePlayerMood };

interface PlayerMoodIndicatorProps {
  mood: CoreMoodType;
  genre?: GameGenre;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function PlayerMoodIndicator({ 
  mood, 
  genre = 'fantasy',
  size = 'md', 
  showLabel = false,
  className 
}: PlayerMoodIndicatorProps) {
  const colorConfig = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
  const descriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[mood] || GENRE_MOOD_DESCRIPTORS.custom[mood];
  
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
          colorConfig.bg
        )}
        style={{ 
          boxShadow: `0 0 12px ${colorConfig.glow}`,
          border: `2px solid ${colorConfig.primary}`
        }}
        title={`${descriptor.label}: ${descriptor.internalState[0]}`}
      >
        <span>{descriptor.emoji}</span>
      </div>
      {showLabel && (
        <span 
          className="text-xs font-medium"
          style={{ color: colorConfig.primary }}
        >
          {descriptor.label}
        </span>
      )}
    </div>
  );
}

// Compact badge version for portrait overlay
export function MoodBadge({ mood, genre = 'fantasy' }: { mood: CoreMoodType; genre?: GameGenre }) {
  const colorConfig = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
  const descriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[mood] || GENRE_MOOD_DESCRIPTORS.custom[mood];
  
  return (
    <div 
      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-background z-10"
      style={{ 
        backgroundColor: colorConfig.primary,
        boxShadow: `0 0 8px ${colorConfig.glow}`
      }}
      title={descriptor.label}
    >
      {descriptor.emoji}
    </div>
  );
}

export default PlayerMoodIndicator;
