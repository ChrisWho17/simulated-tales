// AdventureHeader - Extracted header component from AdventureDisplay
// Contains the title, toolbar buttons, and status indicators

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
} from 'lucide-react';
import { VERSION_STRING, BUILD_NUMBER } from '@/lib/version';
import { SavesDropdown } from '@/components/campaign';
import { PacingIndicator } from '@/components/game/PacingIndicator';
import { CloudSyncIndicator } from '@/components/game/CloudSyncIndicator';
import { RadialMenuTrigger } from '@/components/game/RadialQuickMenu';
import { WeatherState, WEATHER_CONFIGS, WeatherType } from '@/game/weatherSystem';
import { GameTimeState, TimeMultiplier, TIME_MULTIPLIER_CONFIG } from '@/game/timeProgressionSystem';

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

// Helper to get weather icon
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

// Helper to get weather button color class
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
  return (
    <header className="relative z-20 glass-panel border-0 border-b border-[rgba(139,92,246,0.2)] rounded-none">
      <div className="flex items-center justify-between px-2 py-1 gap-1">
        {/* Title - Tappable on mobile */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenMobileQuickMenu}
            className="text-[11px] font-display font-bold tracking-wide fiery-gold-text flex-shrink-0 md:cursor-default active:scale-95 transition-transform"
            data-text="UNTOLD"
          >
            UNTOLD
          </button>
          <span
            className="text-[8px] font-mono text-muted-foreground/50 bg-muted/20 px-1 py-0.5 rounded border border-border/20 cursor-default"
            title={`Build: ${BUILD_NUMBER}`}
          >
            {VERSION_STRING}
          </span>
        </div>

        {/* Toolbar buttons - grouped together with no-shrink */}
        <div className="flex items-center gap-0.5 flex-shrink-0 overflow-x-auto">
          {/* Ambient Feed Button - Mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAmbientFeedModal}
            className="md:hidden h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary relative"
            title="World Events"
          >
            <Globe className="w-4 h-4" />
            {hasNewAmbientEvents && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>

          {/* Ambient Feed Button - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAmbientFeedModal}
            className="hidden md:flex h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary relative"
            title="World Events"
          >
            <Globe className="w-4 h-4" />
            {hasNewAmbientEvents && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>

          {/* Pacing Indicator */}
          <PacingIndicator
            currentMultiplier={timeState.multiplier}
            onMultiplierChange={onTimeMultiplierChange}
          />

          {/* Weather Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenWeatherModal}
            className={`h-7 w-7 md:h-7 md:w-7 flex-shrink-0 frosted-button ${getWeatherColorClass(weatherState.current)}`}
            title={`Weather: ${WEATHER_CONFIGS[weatherState.current].name}`}
          >
            {getWeatherIcon(weatherState.current)}
          </Button>

          {/* Character Sheet Button - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCharacterSheet}
            className="hidden md:flex h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary"
            title="Character Sheet"
          >
            <ScrollText className="w-4 h-4" />
          </Button>

          {/* Inventory Button - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenInventory}
            className="hidden md:flex h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary"
            title="Inventory (Ctrl+I)"
          >
            <Backpack className="w-4 h-4" />
          </Button>

          {/* Bookmarks Button - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenBookmarks}
            className="hidden md:flex h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary"
            title="Bookmarks (Ctrl+B)"
          >
            <Bookmark className="w-4 h-4" />
          </Button>

          {/* Saves Dropdown */}
          <SavesDropdown />

          {/* Cloud Sync Indicator - Hidden on mobile */}
          <div className="hidden md:block">
            <CloudSyncIndicator />
          </div>

          {/* Settings - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="hidden md:flex h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </Button>

          {/* Restart - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestart}
            className="hidden md:flex h-7 w-7 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-destructive"
            title="New Adventure"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Radial Menu Trigger - Mobile only */}
          <RadialMenuTrigger
            onClick={() => window.dispatchEvent(new CustomEvent('open-radial-menu'))}
          />
        </div>
      </div>
    </header>
  );
}
