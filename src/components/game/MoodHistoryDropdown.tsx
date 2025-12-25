// Mood Selection Component - Manual mood control for player character
import { useState, useEffect, useRef } from 'react';
import { Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CoreMoodType, 
  MOOD_COLORS, 
  GENRE_MOOD_DESCRIPTORS 
} from '@/game/moodSystem';
import { GameGenre } from '@/types/genreData';

const ALL_MOODS: CoreMoodType[] = [
  'lusty', 'mad', 'annoyed', 'neutral', 'happy', 
  'sad', 'depressed', 'fearful', 'determined', 'suspicious'
];

interface MoodHistoryDropdownProps {
  currentMood: CoreMoodType;
  moodHistory?: unknown[]; // Kept for backward compatibility but unused
  genre: GameGenre;
  className?: string;
  manualMoodEnabled?: boolean;
  onMoodChange?: (mood: CoreMoodType) => void;
}

export function MoodHistoryDropdown({ 
  currentMood, 
  genre, 
  className,
  manualMoodEnabled = false,
  onMoodChange
}: MoodHistoryDropdownProps) {
  const [isGlowing, setIsGlowing] = useState(false);
  const prevMoodRef = useRef(currentMood);
  
  const currentConfig = MOOD_COLORS[currentMood] || MOOD_COLORS.neutral;
  const currentDescriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[currentMood] || GENRE_MOOD_DESCRIPTORS.custom[currentMood];
  
  // Trigger glow animation when mood changes
  useEffect(() => {
    if (prevMoodRef.current !== currentMood) {
      setIsGlowing(true);
      const timer = setTimeout(() => setIsGlowing(false), 600);
      prevMoodRef.current = currentMood;
      return () => clearTimeout(timer);
    }
  }, [currentMood]);
  
  // Dynamic glow style for animation
  const glowStyle = isGlowing ? {
    animation: 'mood-glow 0.6s ease-out',
    boxShadow: `0 0 20px ${currentConfig.glow}, 0 0 40px ${currentConfig.glow}`
  } : {
    boxShadow: `0 0 8px ${currentConfig.glow}`
  };

  return (
    <div className={cn("bg-background/30 rounded-lg border border-border/20", className)}>
      {/* Header - Current Mood Display */}
      <div className="flex items-center gap-3 p-3">
        <div 
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300",
            isGlowing && "scale-110"
          )}
          style={{ 
            backgroundColor: `${currentConfig.primary}20`,
            border: `2px solid ${currentConfig.primary}`,
            ...glowStyle
          }}
        >
          {currentDescriptor.emoji}
        </div>
        <div className="text-left">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Current Mood
          </div>
          <div className="font-semibold" style={{ color: currentConfig.primary }}>
            {currentDescriptor.label}
          </div>
        </div>
      </div>

      {/* Manual Mood Selection Grid - Shows when manual control is enabled */}
      {manualMoodEnabled && onMoodChange && (
        <div className="border-t border-border/20 p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Edit3 className="w-3 h-3" />
            Select Mood
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ALL_MOODS.map((mood) => {
              const moodConfig = MOOD_COLORS[mood];
              const moodDescriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[mood] || GENRE_MOOD_DESCRIPTORS.custom[mood];
              const isSelected = mood === currentMood;
              return (
                <button
                  key={mood}
                  onClick={() => onMoodChange(mood)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-105",
                    isSelected 
                      ? "bg-primary/20 ring-2 ring-primary/50" 
                      : "bg-background/30 hover:bg-background/50"
                  )}
                  style={{
                    boxShadow: isSelected ? `0 0 12px ${moodConfig.glow}` : undefined
                  }}
                  title={moodDescriptor.label}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{ 
                      backgroundColor: `${moodConfig.primary}20`,
                      border: `2px solid ${moodConfig.primary}`,
                      boxShadow: `0 0 8px ${moodConfig.glow}`
                    }}
                  >
                    {moodDescriptor.emoji}
                  </div>
                  <span 
                    className="text-[10px] font-medium truncate w-full text-center"
                    style={{ color: moodConfig.primary }}
                  >
                    {moodDescriptor.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MoodHistoryDropdown;
