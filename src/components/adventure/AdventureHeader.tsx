// AdventureHeader — the HUD bar above the story.
//
// Two clusters: world state on the left of the divider (pace, weather), the
// character's own screens on the right (sheet, pack, saves, settings). Anything
// a player reaches for once a session lives in the overflow menu rather than
// spending a permanent slot.

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ScrollText,
  Backpack,
  Bookmark,
  Sliders,
  RotateCcw,
  Globe,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Sun,
  Snowflake,
  Flame,
  Wind,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VERSION_STRING, BUILD_NUMBER } from '@/lib/version';
import { SavesDropdown } from '@/components/campaign';
import { PacingIndicator } from '@/components/game/PacingIndicator';
import { CloudSyncIndicator } from '@/components/game/CloudSyncIndicator';
import { RadialMenuTrigger } from '@/components/game/RadialQuickMenu';
import { WeatherState, WEATHER_CONFIGS, WeatherType } from '@/game/weatherSystem';
import { GameTimeState, TimeMultiplier } from '@/game/timeProgressionSystem';

export interface AdventureHeaderProps {
  // Weather state
  weatherState: WeatherState;
  weatherEnabled: boolean;
  
  // Time state  
  timeState: GameTimeState;
  onTimeMultiplierChange: (multiplier: TimeMultiplier) => void;
  
  // Ambient feed
  hasNewAmbientEvents: boolean;
  
  // Action handlers
  onOpenMobileQuickMenu: () => void;
  onOpenAmbientFeedModal: () => void;
  onOpenWeatherModal: () => void;
  onOpenCharacterSheet: () => void;
  onOpenInventory: () => void;
  onOpenBookmarks: () => void;
  onOpenSettings: () => void;
  onRestart: () => void;
}

const HUD_BUTTON_CLASS =
  'h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/80 hover:text-primary';

function getWeatherIcon(weatherType: WeatherType) {
  switch (weatherType) {
    case 'storm':
      return <CloudLightning className="w-4 h-4" />;
    case 'rain':
      return <CloudRain className="w-4 h-4" />;
    case 'fog':
      return <CloudFog className="w-4 h-4" />;
    case 'heat_wave':
      return <Flame className="w-4 h-4" />;
    case 'wind':
      return <Wind className="w-4 h-4" />;
    case 'snow':
      return <Snowflake className="w-4 h-4" />;
    case 'cloudy':
      return <Cloud className="w-4 h-4" />;
    default:
      return <Sun className="w-4 h-4" />;
  }
}

function getWeatherColorClass(weatherType: WeatherType): string {
  switch (weatherType) {
    case 'storm':
      return 'text-yellow-400';
    case 'rain':
      return 'text-blue-400';
    case 'fog':
      return 'text-violet-400';
    case 'heat_wave':
      return 'text-red-400';
    case 'wind':
      return 'text-orange-400';
    case 'snow':
      return 'text-cyan-400';
    case 'cloudy':
      return 'text-slate-400';
    default:
      return 'text-amber-400';
  }
}

export function AdventureHeader({
  weatherState,
  weatherEnabled,
  timeState,
  onTimeMultiplierChange,
  hasNewAmbientEvents,
  onOpenMobileQuickMenu,
  onOpenAmbientFeedModal,
  onOpenWeatherModal,
  onOpenCharacterSheet,
  onOpenInventory,
  onOpenBookmarks,
  onOpenSettings,
  onRestart,
}: AdventureHeaderProps) {
  const weatherName = WEATHER_CONFIGS[weatherState.current].name;
  
  return (
    <header className="play-hud relative z-20">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        {/* Title - Tappable on mobile */}
        <div className="flex min-w-0 items-center gap-1">
          <button
            onClick={onOpenMobileQuickMenu}
            className="text-[11px] font-display font-bold tracking-wide fiery-gold-text flex-shrink-0 md:cursor-default active:scale-95 transition-transform"
            data-text="UNTOLD"
          >
            UNTOLD
          </button>
          <span
            className="hidden sm:inline text-[8px] font-mono text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded border border-border/20 cursor-default"
            title={`Build: ${BUILD_NUMBER}`}
          >
            {VERSION_STRING}
          </span>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* World state: how fast time moves and what the sky is doing. */}
          <PacingIndicator
            currentMultiplier={timeState.multiplier}
            onMultiplierChange={onTimeMultiplierChange}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenWeatherModal}
            className={`${HUD_BUTTON_CLASS} ${
              weatherEnabled ? getWeatherColorClass(weatherState.current) : ''
            }`}
            title={
              weatherEnabled
                ? `Weather: ${weatherName}`
                : `Weather: ${weatherName} (effects off)`
            }
          >
            {getWeatherIcon(weatherState.current)}
          </Button>

          {/* World events — mobile keeps a dedicated button; on desktop it sits
              in the overflow menu below. */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAmbientFeedModal}
            className={`md:hidden relative ${HUD_BUTTON_CLASS}`}
            title="World Events"
          >
            <Globe className="w-4 h-4" />
            {hasNewAmbientEvents && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>

          <div className="play-hud-divider hidden md:block" aria-hidden="true" />

          {/* The character's own screens. */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCharacterSheet}
            className={`hidden md:flex ${HUD_BUTTON_CLASS}`}
            title="Character Sheet"
          >
            <ScrollText className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenInventory}
            className={`hidden md:flex ${HUD_BUTTON_CLASS}`}
            title="Inventory (Ctrl+I)"
          >
            <Backpack className="w-4 h-4" />
          </Button>

          {/* Trigger hidden on mobile; the dialog still opens from the quick menu. */}
          <SavesDropdown />

          <div className="hidden md:block">
            <CloudSyncIndicator />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className={`hidden md:flex ${HUD_BUTTON_CLASS}`}
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </Button>

          {/* Everything reached for once a session. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`hidden md:flex relative ${HUD_BUTTON_CLASS}`}
                title="More"
              >
                <MoreHorizontal className="w-4 h-4" />
                {hasNewAmbientEvents && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onOpenAmbientFeedModal} className="gap-2">
                <Globe className="w-4 h-4" />
                World Events
                {hasNewAmbientEvents && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenBookmarks} className="gap-2">
                <Bookmark className="w-4 h-4" />
                Bookmarks
                <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+B</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRestart}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <RotateCcw className="w-4 h-4" />
                New Adventure
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Radial Menu Trigger - Mobile only */}
          <RadialMenuTrigger
            onClick={() => window.dispatchEvent(new CustomEvent('open-radial-menu'))}
          />
        </div>
      </div>
    </header>
  );
}
