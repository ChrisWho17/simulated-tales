// Mood History Dropdown - Collapsible timeline of emotional journey
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, History, Clock, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CoreMoodType, 
  MoodLogEntry, 
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
  moodHistory: MoodLogEntry[];
  genre: GameGenre;
  className?: string;
  manualMoodEnabled?: boolean;
  onMoodChange?: (mood: CoreMoodType) => void;
}

export function MoodHistoryDropdown({ 
  currentMood, 
  moodHistory, 
  genre, 
  className,
  manualMoodEnabled = false,
  onMoodChange
}: MoodHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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
  
  // Group history by chapter
  const groupedHistory = moodHistory.reduce((acc, entry) => {
    const chapter = entry.chapter || 1;
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(entry);
    return acc;
  }, {} as Record<number, MoodLogEntry[]>);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Dynamic glow style for animation
  const glowStyle = isGlowing ? {
    animation: 'mood-glow 0.6s ease-out',
    boxShadow: `0 0 20px ${currentConfig.glow}, 0 0 40px ${currentConfig.glow}`
  } : {
    boxShadow: `0 0 8px ${currentConfig.glow}`
  };

  return (
    <div className={cn("bg-background/30 rounded-lg border border-border/20", className)}>
      {/* Header - Always visible */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 flex-1">
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
            <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <History className="w-3 h-3" />
              Current Mood
            </div>
            <div className="font-semibold" style={{ color: currentConfig.primary }}>
              {currentDescriptor.label}
            </div>
          </div>
        </div>
        
        {/* History toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
        >
          {moodHistory.length > 0 && (
            <span className="text-xs bg-background/50 px-2 py-0.5 rounded-full">
              {moodHistory.length} changes
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
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

      {/* Expanded History */}
      {isOpen && (
        <div className="border-t border-border/20 max-h-64 overflow-y-auto">
          {moodHistory.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No mood changes recorded yet.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {Object.entries(groupedHistory)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([chapter, entries]) => (
                  <div key={chapter} className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 pt-2">
                      Chapter {chapter}
                    </div>
                    {entries
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((entry, idx) => {
                        const entryConfig = MOOD_COLORS[entry.mood] || MOOD_COLORS.neutral;
                        const entryDescriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[entry.mood] || GENRE_MOOD_DESCRIPTORS.custom[entry.mood];
                        
                        return (
                          <div 
                            key={`${entry.timestamp}-${idx}`}
                            className="flex items-start gap-2 p-2 rounded hover:bg-background/50 transition-colors"
                          >
                            {/* Color dot */}
                            <div 
                              className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                              style={{ 
                                backgroundColor: entryConfig.primary,
                                boxShadow: `0 0 6px ${entryConfig.glow}`
                              }}
                            />
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="text-sm font-medium"
                                  style={{ color: entryConfig.primary }}
                                >
                                  {entryDescriptor.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatTime(entry.timestamp)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {entry.trigger}
                              </div>
                              {entry.narrativeContext && (
                                <div className="text-xs text-muted-foreground/70 italic mt-0.5 line-clamp-2">
                                  "{entry.narrativeContext}"
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MoodHistoryDropdown;
