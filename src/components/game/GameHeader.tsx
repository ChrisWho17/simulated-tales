import { formatTime, getTimePeriod } from '@/game/gameEngine';
import { GameTime } from '@/types/game';
import { Sun, Moon, Sunrise, Sunset, Save, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GameHeaderProps {
  time: GameTime;
  onSave: () => void;
  onLoad: () => void;
  onNewGame?: () => void;
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

export function GameHeader({ time, onSave, onLoad, onNewGame }: GameHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
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
