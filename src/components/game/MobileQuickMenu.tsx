// Mobile Quick Menu Splash Screen
// Shows when tapping the UNTOLD logo on mobile

import React from 'react';
import { 
  Settings, Trophy, ScrollText, Backpack, Bookmark, 
  Clock, CloudRain, RotateCcw, Save, X, Info, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileQuickMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenCharacterSheet: () => void;
  onOpenInventory: () => void;
  onOpenBookmarks: () => void;
  onOpenWeather: () => void;
  onOpenTime: () => void;
  onOpenRecap: () => void;
  onOpenSaves: () => void;
  onRestart: () => void;
  characterName?: string;
  currentTime?: string;
  currentWeather?: string;
}

interface QuickMenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  description?: string;
}

export const MobileQuickMenu = React.forwardRef<HTMLDivElement, MobileQuickMenuProps>(({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenCharacterSheet,
  onOpenInventory,
  onOpenBookmarks,
  onOpenWeather,
  onOpenTime,
  onOpenRecap,
  onOpenSaves,
  onRestart,
  characterName,
  currentTime,
  currentWeather,
}, ref) => {
  if (!isOpen) return null;

  const menuItems: QuickMenuItem[] = [
    {
      icon: <ScrollText className="w-5 h-5" />,
      label: 'Character',
      onClick: () => { onOpenCharacterSheet(); onClose(); },
      color: 'text-primary',
      description: characterName || 'View stats',
    },
    {
      icon: <Backpack className="w-5 h-5" />,
      label: 'Inventory',
      onClick: () => { onOpenInventory(); onClose(); },
      color: 'text-amber-400',
      description: 'Items & gear',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Time',
      onClick: () => { onOpenTime(); onClose(); },
      color: 'text-gold',
      description: currentTime || 'Game clock',
    },
    {
      icon: <CloudRain className="w-5 h-5" />,
      label: 'Weather',
      onClick: () => { onOpenWeather(); onClose(); },
      color: 'text-blue-400',
      description: currentWeather || 'Conditions',
    },
    {
      icon: <Bookmark className="w-5 h-5" />,
      label: 'Bookmarks',
      onClick: () => { onOpenBookmarks(); onClose(); },
      color: 'text-purple-400',
      description: 'Saved moments',
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: 'Recap',
      onClick: () => { onOpenRecap(); onClose(); },
      color: 'text-green-400',
      description: 'Story so far',
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      label: 'Saves',
      onClick: () => { onOpenSaves(); onClose(); },
      color: 'text-cyan-400',
      description: 'Save & Load',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      onClick: () => { onOpenSettings(); onClose(); },
      color: 'text-muted-foreground',
      description: 'Options',
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      label: 'New Story',
      onClick: () => { onRestart(); onClose(); },
      color: 'text-destructive',
      description: 'Start fresh',
    },
  ];

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 mb-4 glass-panel p-4 rounded-2xl border border-primary/30 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <div>
            <h2 className="text-lg font-display font-bold text-gradient-primary">UNTOLD</h2>
            <p className="text-xs text-muted-foreground">Quick Menu</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-4 gap-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl",
                "bg-background/30 hover:bg-background/50 active:scale-95",
                "border border-border/20 hover:border-primary/30",
                "transition-all duration-150"
              )}
            >
              <div className={cn("transition-colors", item.color)}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
          Tap outside to close
        </p>
      </div>
    </div>
  );
});

MobileQuickMenu.displayName = 'MobileQuickMenu';

export default MobileQuickMenu;
