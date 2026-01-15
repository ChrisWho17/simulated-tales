// Radial Quick Menu - Skyrim-style centered radial menu
// Gear icon in header opens a full-screen centered radial menu

import React, { useState, useCallback } from 'react';
import { 
  Settings, ScrollText, Backpack, Bookmark, 
  Clock, CloudRain, RotateCcw, X, Info, FolderOpen, Sliders
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RadialQuickMenuProps {
  onOpenSettings: () => void;
  onOpenCharacterSheet: () => void;
  onOpenInventory: () => void;
  onOpenBookmarks: () => void;
  onOpenWeather: () => void;
  onOpenTime: () => void;
  onOpenRecap: () => void;
  onOpenSaves: () => void;
  onRestart: () => void;
}

interface RadialMenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
  glowColor: string;
}

// Gear button for the header
export function RadialMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden h-6 w-6 flex-shrink-0 frosted-button text-muted-foreground/70 hover:text-primary relative"
      title="Quick Menu"
    >
      <Settings className="w-4 h-4 transition-transform duration-300 hover:rotate-90" />
    </Button>
  );
}

export function RadialQuickMenu({
  onOpenSettings,
  onOpenCharacterSheet,
  onOpenInventory,
  onOpenBookmarks,
  onOpenWeather,
  onOpenTime,
  onOpenRecap,
  onOpenSaves,
  onRestart,
}: RadialQuickMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
    setHoveredIndex(null);
  }, []);

  const handleItemClick = useCallback((onClick: () => void) => {
    onClick();
    setIsOpen(false);
  }, []);

  // Listen for external trigger
  React.useEffect(() => {
    const handleOpenRadialMenu = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('open-radial-menu', handleOpenRadialMenu);
    return () => window.removeEventListener('open-radial-menu', handleOpenRadialMenu);
  }, []);

  const menuItems: RadialMenuItem[] = [
    {
      icon: <ScrollText className="w-5 h-5" />,
      label: 'Character',
      onClick: onOpenCharacterSheet,
      color: 'text-primary',
      glowColor: 'hsl(var(--primary))',
    },
    {
      icon: <Backpack className="w-5 h-5" />,
      label: 'Inventory',
      onClick: onOpenInventory,
      color: 'text-amber-400',
      glowColor: 'rgb(251 191 36)',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Time',
      onClick: onOpenTime,
      color: 'text-yellow-400',
      glowColor: 'rgb(250 204 21)',
    },
    {
      icon: <CloudRain className="w-5 h-5" />,
      label: 'Weather',
      onClick: onOpenWeather,
      color: 'text-blue-400',
      glowColor: 'rgb(96 165 250)',
    },
    {
      icon: <Bookmark className="w-5 h-5" />,
      label: 'Bookmarks',
      onClick: onOpenBookmarks,
      color: 'text-purple-400',
      glowColor: 'rgb(192 132 252)',
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: 'Recap',
      onClick: onOpenRecap,
      color: 'text-green-400',
      glowColor: 'rgb(74 222 128)',
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      label: 'Saves',
      onClick: onOpenSaves,
      color: 'text-cyan-400',
      glowColor: 'rgb(34 211 238)',
    },
    {
      icon: <Sliders className="w-5 h-5" />,
      label: 'Settings',
      onClick: onOpenSettings,
      color: 'text-muted-foreground',
      glowColor: 'hsl(var(--muted-foreground))',
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      label: 'New Story',
      onClick: onRestart,
      color: 'text-destructive',
      glowColor: 'hsl(var(--destructive))',
    },
  ];

  // Calculate radial positions - full circle around center
  const getItemPosition = (index: number, total: number) => {
    const startAngle = -90; // Start from top
    const angleStep = 360 / total;
    const angle = startAngle + (angleStep * index);
    const radians = (angle * Math.PI) / 180;
    
    // Radius sized for mobile screens
    const radius = 110;
    
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[100]">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={toggleMenu}
      />
      
      {/* Center container - positioned exactly at screen center */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '280px', height: '280px' }}
      >
        {/* Decorative rings */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 pointer-events-none"
          style={{
            width: '260px',
            height: '260px',
            animation: 'spin 30s linear infinite',
          }}
        />
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 pointer-events-none"
          style={{
            width: '300px',
            height: '300px',
            animation: 'spin 45s linear infinite reverse',
          }}
        />
        
        {/* Radial menu items */}
        {menuItems.map((item, index) => {
          const position = getItemPosition(index, menuItems.length);
          const isHovered = hoveredIndex === index;
          const delay = index * 30;
          
          return (
            <button
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(index)}
              onTouchEnd={() => setTimeout(() => setHoveredIndex(null), 150)}
              className={cn(
                "absolute flex items-center justify-center",
                "w-14 h-14 rounded-full",
                "bg-card/90 backdrop-blur-md border-2",
                "transition-all duration-300 ease-out",
                item.color
              )}
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `calc(50% + ${position.y}px)`,
                transform: `translate(-50%, -50%) scale(${isHovered ? 1.15 : 1})`,
                transitionDelay: `${delay}ms`,
                boxShadow: isHovered 
                  ? `0 0 25px 6px ${item.glowColor}, 0 0 50px 12px ${item.glowColor}40`
                  : '0 4px 15px rgba(0,0,0,0.4)',
                borderColor: isHovered ? item.glowColor : 'rgba(255,255,255,0.1)',
              }}
            >
              {item.icon}
              
              {/* Label below button */}
              <span 
                className={cn(
                  "absolute top-full mt-2 left-1/2 -translate-x-1/2",
                  "text-[11px] font-medium whitespace-nowrap",
                  "transition-all duration-200",
                  isHovered ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Central close button */}
        <button
          onClick={toggleMenu}
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "z-10 flex items-center justify-center",
            "w-16 h-16 rounded-full",
            "bg-card/95 border-2 border-primary/50",
            "transition-all duration-300",
            "hover:border-primary hover:scale-105 active:scale-95"
          )}
          style={{
            boxShadow: '0 0 30px 8px hsl(var(--primary) / 0.25), 0 0 60px 15px hsl(var(--primary) / 0.1)'
          }}
        >
          <X className="w-7 h-7 text-primary" />
        </button>
      </div>
    </div>
  );
}

export default RadialQuickMenu;
