import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Eye, MessageSquare, Backpack, Clock, HelpCircle } from 'lucide-react';
import { parseEnhancedCommand, getCommandTypeInfo } from '@/game/commandParser';
import { InputFormatGuide, InputHint } from './InputFormatGuide';
import { EmotionPicker } from './EmotionPicker';
import { OutfitChangeMenu } from './OutfitChangeMenu';
import { CoreMoodType } from '@/game/moodSystem';
import { GameGenre } from '@/types/genreData';
import { ClothingContext } from '@/game/clothingReactionSystem';

interface PlayerInputProps {
  onSubmit: (command: string, emotionalTone?: CoreMoodType | null) => void;
  disabled?: boolean;
  currentMood?: CoreMoodType;
  genre?: GameGenre;
  enableEmotionPicker?: boolean;
  currentClothing?: ClothingContext;
  onOutfitChange?: (newClothing: ClothingContext) => void;
}

const quickActions = [
  { label: 'Look', command: 'look', icon: Eye },
  { label: 'Status', command: 'status', icon: MessageSquare },
  { label: 'Inventory', command: 'inventory', icon: Backpack },
  { label: 'Wait', command: 'wait 1', icon: Clock },
  { label: 'Help', command: 'help', icon: HelpCircle },
];

export function PlayerInput({ 
  onSubmit, 
  disabled,
  currentMood = 'neutral',
  genre = 'fantasy',
  enableEmotionPicker = true,
  currentClothing,
  onOutfitChange
}: PlayerInputProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedEmotion, setSelectedEmotion] = useState<CoreMoodType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Parse current input for live feedback
  const parsedCommand = useMemo(() => {
    if (!input.trim()) return null;
    return parseEnhancedCommand(input);
  }, [input]);
  
  const commandInfo = parsedCommand ? getCommandTypeInfo(parsedCommand.type) : null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    
    // Pass the emotional tone (null means auto-use character mood)
    onSubmit(input.trim(), selectedEmotion);
    setHistory(prev => [...prev, input.trim()]);
    setHistoryIndex(-1);
    setInput('');
    // Reset emotion selection after submit (auto for next message)
    setSelectedEmotion(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInput(history[history.length - 1 - newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? '' : history[history.length - 1 - newIndex] || '');
    }
  };
  
  const handleQuickAction = (command: string) => {
    if (!disabled) {
      onSubmit(command);
      setHistory(prev => [...prev, command]);
    }
  };
  
  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3 sm:p-4">
      {/* Quick Actions */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 flex-wrap items-center">
        {quickActions.map(({ label, command, icon: Icon }) => (
          <Button
            key={command}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction(command)}
            disabled={disabled}
            className="text-xs gap-1 sm:gap-1.5 bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30 transition-all px-2 sm:px-3"
            aria-label={label}
            title={label}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
        
        {/* Outfit Change Button */}
        <OutfitChangeMenu
          genre={genre}
          currentClothing={currentClothing}
          onOutfitChange={onOutfitChange}
          compact
        />
        
        {/* Emotion Picker - shows after quick actions */}
        {enableEmotionPicker && (
          <div className="ml-auto">
            <EmotionPicker
              currentMood={currentMood}
              genre={genre}
              selectedEmotion={selectedEmotion}
              onEmotionSelect={setSelectedEmotion}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono">
            &gt;
          </span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="say, ask, take, go, look, use..."
            disabled={disabled}
            className="pl-8 pr-24 bg-background border-border focus:border-primary focus:ring-primary/20 font-mono text-sm"
          />
          {/* Command type indicator */}
          {commandInfo ? (
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs ${commandInfo.color}`}>
              <span>{commandInfo.icon}</span>
              <span className="hidden sm:inline">{commandInfo.label}</span>
            </div>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <InputHint inputText={input} />
            </div>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={disabled || !input.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          aria-label="Send command"
          title="Send (Enter)"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
      
      {/* Bottom row: Input guide + keyword hints */}
      <div className="flex items-center justify-between mt-2">
        <InputFormatGuide />
        <p className="text-[10px] text-muted-foreground">
          <span className="text-primary/70">"quotes"</span> = speech • <span className="text-primary/70">verbs</span> = action • <span className="text-primary/70">tactics</span> = approach
        </p>
      </div>
    </div>
  );
}

