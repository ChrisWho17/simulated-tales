import { formatTime, getTimePeriod } from '@/game/gameEngine';
import { GameTime } from '@/types/game';
import { Sun, Moon, Sunrise, Sunset, Save, RotateCcw, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGame } from '@/contexts/GameContext';
import { getCachedPortrait, EMOTION_TO_PORTRAIT, EmotionType } from '@/game/portraitSystem';
import { RPGCharacter } from '@/types/rpgCharacter';

interface ExtendedCharacter extends RPGCharacter {
  id?: string;
  portraitUrl?: string;
}

interface GameHeaderProps {
  time: GameTime;
  onSave: () => void;
  onLoad: () => void;
  onNewGame?: () => void;
  character?: ExtendedCharacter | null;
}

function TimeIcon({ hour }: { hour: number }) {
  const period = getTimePeriod(hour);
  switch (period) {
    case 'morning':
      return <Sunrise className="h-5 w-5 text-gold" />;
    case 'afternoon':
      return <Sun className="h-5 w-5 text-gold animate-pulse-slow" />;
    case 'evening':
      return <Sunset className="h-5 w-5 text-copper" />;
    case 'night':
      return <Moon className="h-5 w-5 text-muted-foreground" />;
  }
}


function EmotionPortrait({ character }: { character: ExtendedCharacter }) {
  const { emotionalState } = useGame();
  
  // Map current mood to emotion type
  const moodToEmotion: Record<string, EmotionType> = {
    'neutral': 'neutral',
    'happy': 'happy',
    'excited': 'happy',
    'angry': 'angry',
    'frustrated': 'angry',
    'sad': 'sad',
    'melancholic': 'sad',
    'fearful': 'fearful',
    'anxious': 'fearful',
    'surprised': 'surprised',
    'curious': 'surprised',
    'flirty': 'flirty',
    'romantic': 'flirty',
    'suspicious': 'suspicious',
    'wary': 'suspicious',
    'disgusted': 'disgusted',
    'hurt': 'hurt',
    'smug': 'smug',
    'thoughtful': 'thoughtful',
  };
  
  const currentEmotion = moodToEmotion[emotionalState.currentMood] || 'neutral';
  
  // Use character name as ID fallback
  const characterId = character.id || character.name;
  
  // Try to get cached portrait for current emotion, fall back to neutral, then character portrait
  const emotionPortrait = getCachedPortrait(characterId, currentEmotion);
  const neutralPortrait = getCachedPortrait(characterId, 'neutral');
  const displayPortrait = emotionPortrait || neutralPortrait || character.portraitUrl;
  
  if (!displayPortrait) {
    return (
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/30">
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg cursor-pointer transition-transform hover:scale-105">
          <img 
            src={displayPortrait} 
            alt={character.name}
            className="w-full h-full object-cover"
          />
          {/* Emotion indicator dot */}
          {emotionalState.currentMood !== 'neutral' && emotionalState.moodIntensity > 0.3 && (
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-background"
              style={{
                backgroundColor: getEmotionColor(currentEmotion),
              }}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {character.name} • {emotionalState.currentMood}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function getEmotionColor(emotion: EmotionType): string {
  const colors: Record<EmotionType, string> = {
    neutral: 'hsl(var(--muted-foreground))',
    happy: 'hsl(50, 90%, 50%)',
    angry: 'hsl(0, 80%, 50%)',
    sad: 'hsl(210, 60%, 50%)',
    fearful: 'hsl(270, 60%, 50%)',
    surprised: 'hsl(30, 90%, 50%)',
    flirty: 'hsl(330, 80%, 60%)',
    suspicious: 'hsl(45, 70%, 40%)',
    disgusted: 'hsl(90, 50%, 35%)',
    hurt: 'hsl(350, 70%, 45%)',
    smug: 'hsl(280, 50%, 55%)',
    thoughtful: 'hsl(200, 40%, 50%)',
  };
  return colors[emotion] || colors.neutral;
}

export function GameHeader({ time, onSave, onLoad, onNewGame, character }: GameHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {character && <EmotionPortrait character={character} />}
        <h1 className="text-xl font-narrative text-gradient-gold glow-text tracking-wide">
          Living World
        </h1>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <TimeIcon hour={time.hour} />
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(time)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onNewGame && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onNewGame}
                className="hover:bg-secondary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Game</TooltipContent>
          </Tooltip>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onSave}
              className="hover:bg-secondary hover:text-primary"
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Game</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onLoad}
              className="hover:bg-secondary hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Load Game</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
