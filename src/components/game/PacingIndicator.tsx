// Compact pacing indicator for game header
// Shows current time multiplier with visual icon and dropdown for quick changes

import React from 'react';
import { Timer, Swords, MessageSquare, Footprints, Mountain, Compass, ChevronDown } from 'lucide-react';
import { TimeMultiplier, TIME_MULTIPLIER_CONFIG } from '@/game/timeProgressionSystem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PacingIndicatorProps {
  currentMultiplier: TimeMultiplier;
  onMultiplierChange: (multiplier: TimeMultiplier) => void;
  className?: string;
}

// Visual pacing config with icons and colors
const PACING_DISPLAY: Record<TimeMultiplier, {
  icon: React.ReactNode;
  label: string;
  shortLabel: string;
  color: string;
  emoji: string;
}> = {
  minute_per_turn: {
    icon: <Swords className="w-3 h-3" />,
    label: '1 min/turn',
    shortLabel: '1m',
    color: 'text-red-400',
    emoji: '⚔️',
  },
  five_minutes: {
    icon: <MessageSquare className="w-3 h-3" />,
    label: '5 min/turn',
    shortLabel: '5m',
    color: 'text-orange-400',
    emoji: '💬',
  },
  fifteen_minutes: {
    icon: <Footprints className="w-3 h-3" />,
    label: '15 min/turn',
    shortLabel: '15m',
    color: 'text-yellow-400',
    emoji: '🚶',
  },
  thirty_minutes: {
    icon: <Mountain className="w-3 h-3" />,
    label: '30 min/turn',
    shortLabel: '30m',
    color: 'text-green-400',
    emoji: '🏔️',
  },
  hour_per_turn: {
    icon: <Compass className="w-3 h-3" />,
    label: '1 hour/turn',
    shortLabel: '1h',
    color: 'text-blue-400',
    emoji: '🗺️',
  },
};

export function PacingIndicator({ 
  currentMultiplier, 
  onMultiplierChange,
  className 
}: PacingIndicatorProps) {
  const current = PACING_DISPLAY[currentMultiplier];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-1.5 gap-0.5 frosted-button",
            current.color,
            className
          )}
          title={`Pacing: ${current.label}`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">{current.shortLabel}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/30 mb-1">
          Time Pacing
        </div>
        {(Object.entries(PACING_DISPLAY) as [TimeMultiplier, typeof PACING_DISPLAY[TimeMultiplier]][]).map(([id, config]) => (
          <DropdownMenuItem
            key={id}
            onClick={() => onMultiplierChange(id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currentMultiplier === id && "bg-primary/10"
            )}
          >
            <span className="text-base">{config.emoji}</span>
            <div className="flex-1">
              <div className={cn("text-sm font-medium", currentMultiplier === id && "text-primary")}>
                {TIME_MULTIPLIER_CONFIG[id].label}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {TIME_MULTIPLIER_CONFIG[id].description}
              </div>
            </div>
            {currentMultiplier === id && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PacingIndicator;
