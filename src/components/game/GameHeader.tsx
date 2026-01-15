import { useNavigate } from 'react-router-dom';
import { formatTime, getTimePeriod } from '@/game/gameEngine';
import { GameTime } from '@/types/game';
import { Sun, Moon, Sunrise, Sunset, Save, RotateCcw, Plus, User, ScrollText, Backpack, Trophy, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RPGCharacter } from '@/types/rpgCharacter';
import { AdrenalineBar } from './AdrenalineBar';
import { AdrenalineSystemState } from '@/game/adrenalineSystem';
import { CloudSyncIndicator } from '@/components/cloud/CloudSyncIndicator';
import { BadgeShowcase, MenuBadgeIndicator } from './AchievementBadges';

interface ExtendedCharacter extends RPGCharacter {
  id?: string;
  portraitUrl?: string;
}

interface GameHeaderProps {
  time: GameTime;
  onSave: () => void;
  onLoad: () => void;
  onNewGame?: () => void;
  onOpenCharacterSheet?: () => void;
  onOpenInventory?: () => void;
  onOpenAchievements?: () => void;
  onOpenSessionStats?: () => void;
  character?: ExtendedCharacter | null;
  adrenalineState?: AdrenalineSystemState | null;
  showAdrenaline?: boolean;
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

function CharacterPortrait({ character }: { character: ExtendedCharacter }) {
  if (!character.portraitUrl) {
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
            src={character.portraitUrl} 
            alt={character.name}
            className="w-full h-full object-cover"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{character.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function GameHeader({ 
  time, 
  onSave, 
  onLoad, 
  onNewGame,
  onOpenCharacterSheet,
  onOpenInventory,
  onOpenAchievements,
  onOpenSessionStats,
  character,
  adrenalineState,
  showAdrenaline = false
}: GameHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="min-h-16 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2">
        {character && <CharacterPortrait character={character} />}
        <h1 className="text-base font-narrative text-gradient-gold glow-text tracking-wide">
          Untold
        </h1>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <TimeIcon hour={time.hour} />
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(time)}
          </span>
        </div>
        
        {/* Adrenaline Bar */}
        {showAdrenaline && adrenalineState && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="w-32">
              <AdrenalineBar state={adrenalineState} compact />
            </div>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <CloudSyncIndicator />
        {onOpenCharacterSheet && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onOpenCharacterSheet}
                className="hover:bg-secondary hover:text-primary"
              >
                <ScrollText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Character Sheet</TooltipContent>
          </Tooltip>
        )}
        
        {onOpenInventory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onOpenInventory}
                className="hover:bg-secondary hover:text-primary"
              >
                <Backpack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inventory</TooltipContent>
          </Tooltip>
        )}
        
        {onOpenAchievements && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onOpenAchievements}
                className="hover:bg-secondary hover:text-primary"
              >
                <Trophy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Achievements</TooltipContent>
          </Tooltip>
        )}
        
        {/* Trophy Room Link with Badge Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/achievements')}
              className="hover:bg-amber-500/20 hover:text-amber-400 relative"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <MenuBadgeIndicator />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>Trophy Room</p>
              <BadgeShowcase maxBadges={3} size="sm" showEmpty={false} className="mt-1" />
            </div>
          </TooltipContent>
        </Tooltip>
        
        {onOpenSessionStats && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onOpenSessionStats}
                className="hover:bg-secondary hover:text-primary"
              >
                <Activity className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Session Stats</TooltipContent>
          </Tooltip>
        )}
        
        {(onOpenCharacterSheet || onOpenInventory || onOpenAchievements || onOpenSessionStats) && <div className="h-6 w-px bg-border" />}
        
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