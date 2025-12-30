// Emotion Picker - Allows players to optionally set their emotional tone
// Auto-selects based on character mood if not manually specified

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CoreMoodType, MOOD_COLORS, GENRE_MOOD_DESCRIPTORS } from '@/game/moodSystem';
import { GameGenre } from '@/types/genreData';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmotionPickerProps {
  currentMood: CoreMoodType;
  genre: GameGenre;
  selectedEmotion: CoreMoodType | null;
  onEmotionSelect: (emotion: CoreMoodType | null) => void;
  disabled?: boolean;
}

// Emotion display with color
function EmotionBadge({ 
  mood, 
  genre, 
  selected, 
  onClick,
  size = 'sm'
}: { 
  mood: CoreMoodType; 
  genre: GameGenre;
  selected: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}) {
  const moodColor = MOOD_COLORS[mood];
  const descriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[mood] || GENRE_MOOD_DESCRIPTORS.fantasy[mood];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full transition-all",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        selected 
          ? "ring-2 ring-offset-1 ring-offset-background" 
          : "hover:opacity-80",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
      style={{
        backgroundColor: `${moodColor.primary}20`,
        borderColor: moodColor.primary,
        color: moodColor.primary,
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: selected ? `0 0 8px ${moodColor.glow}` : undefined,
      }}
      disabled={!onClick}
    >
      <span>{descriptor.emoji}</span>
      <span>{descriptor.label}</span>
    </button>
  );
}

// Main emotion options
const EMOTION_OPTIONS: CoreMoodType[] = [
  'neutral',
  'happy',
  'sad',
  'mad',
  'fearful',
  'determined',
  'lusty',
  'suspicious',
  'annoyed',
  'depressed',
];

export function EmotionPicker({
  currentMood,
  genre,
  selectedEmotion,
  onEmotionSelect,
  disabled = false,
}: EmotionPickerProps) {
  const [open, setOpen] = useState(false);
  
  // The display emotion - either selected or auto from mood
  const displayEmotion = selectedEmotion ?? currentMood;
  const isAuto = selectedEmotion === null;
  
  const handleSelect = (emotion: CoreMoodType) => {
    if (emotion === currentMood) {
      // Selecting current mood = auto mode
      onEmotionSelect(null);
    } else {
      onEmotionSelect(emotion);
    }
    setOpen(false);
  };
  
  const handleClear = () => {
    onEmotionSelect(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-7 gap-1 px-2 text-xs border",
            isAuto ? "opacity-70" : ""
          )}
          style={{
            borderColor: MOOD_COLORS[displayEmotion].primary + '40',
            backgroundColor: MOOD_COLORS[displayEmotion].primary + '10',
          }}
        >
          <span>{GENRE_MOOD_DESCRIPTORS[genre]?.[displayEmotion]?.emoji || '😐'}</span>
          <span className="hidden sm:inline">
            {isAuto ? 'Auto' : GENRE_MOOD_DESCRIPTORS[genre]?.[displayEmotion]?.label}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3" 
        align="start"
        side="top"
      >
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground flex items-center justify-between">
            <span>Emotional Tone</span>
            {!isAuto && (
              <button 
                onClick={handleClear}
                className="text-primary hover:underline text-[10px]"
              >
                Reset to Auto
              </button>
            )}
          </div>
          
          {/* Current auto mood indicator */}
          <div className="text-[10px] text-muted-foreground">
            Character mood: <EmotionBadge 
              mood={currentMood} 
              genre={genre} 
              selected={isAuto}
              size="sm"
            />
          </div>
          
          {/* Emotion grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {EMOTION_OPTIONS.map((emotion) => (
              <EmotionBadge
                key={emotion}
                mood={emotion}
                genre={genre}
                selected={displayEmotion === emotion && !isAuto}
                onClick={() => handleSelect(emotion)}
                size="sm"
              />
            ))}
          </div>
          
          <p className="text-[10px] text-muted-foreground mt-2">
            Set how your character delivers their next action. 
            {isAuto && " Currently using character's natural mood."}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
