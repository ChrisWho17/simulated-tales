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
      icon: <ScrollText className="w-6 h-6" />,
      label: 'Character',
      onClick: onOpenCharacterSheet,
      color: 'text-primary',
      glowColor: 'hsl(var(--primary))',
    },
    {
      icon: <Backpack className="w-6 h-6" />,
      label: 'Inventory',
      onClick: onOpenInventory,
      color: 'text-amber-400',
      glowColor: 'rgb(251 191 36)',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Time',
      onClick: onOpenTime,
      color: 'text-yellow-400',
      glowColor: 'rgb(250 204 21)',
    },
    {
      icon: <CloudRain className="w-6 h-6" />,
      label: 'Weather',
      onClick: onOpenWeather,
      color: 'text-blue-400',
      glowColor: 'rgb(96 165 250)',
    },
    {
      icon: <Bookmark className="w-6 h-6" />,
      label: 'Bookmarks',
      onClick: onOpenBookmarks,
      color: 'text-purple-400',
      glowColor: 'rgb(192 132 252)',
    },
    {
      icon: <Info className="w-6 h-6" />,
      label: 'Recap',
      onClick: onOpenRecap,
      color: 'text-green-400',
      glowColor: 'rgb(74 222 128)',
    },
    {
      icon: <FolderOpen className="w-6 h-6" />,
      label: 'Saves',
      onClick: onOpenSaves,
      color: 'text-cyan-400',
      glowColor: 'rgb(34 211 238)',
    },
    {
      icon: <Sliders className="w-6 h-6" />,
      label: 'Settings',
      onClick: onOpenSettings,
      color: 'text-muted-foreground',
      glowColor: 'hsl(var(--muted-foreground))',
    },
    {
      icon: <RotateCcw className="w-6 h-6" />,
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
    
    // Larger radius for Skyrim-style menu
    const radius = 120;
    
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={toggleMenu}
      />
      
      {/* Center container */}
      <div className="relative">
        {/* Radial menu items */}
        {menuItems.map((item, index) => {
          const position = getItemPosition(index, menuItems.length);
          const isHovered = hoveredIndex === index;
          const delay = index * 40; // Staggered animation
          
          return (
            <button
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(index)}
              onTouchEnd={() => {
                // Small delay before clearing hover to show the effect
                setTimeout(() => setHoveredIndex(null), 100);
              }}
              className={cn(
                "absolute flex flex-col items-center justify-center",
                "w-16 h-16 rounded-full",
                "bg-card/90 backdrop-blur-md border-2 border-border/50",
                "transition-all duration-300 ease-out",
                "-translate-x-1/2 -translate-y-1/2",
                item.color
              )}
              style={{
                left: position.x,
                top: position.y,
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${isHovered ? 1.2 : 1})`,
                transitionDelay: `${delay}ms`,
                boxShadow: isHovered 
                  ? `0 0 30px 8px ${item.glowColor}, 0 0 60px 16px ${item.glowColor}40, inset 0 0 20px ${item.glowColor}30`
                  : '0 4px 20px rgba(0,0,0,0.4)',
                borderColor: isHovered ? item.glowColor : undefined,
                animation: isHovered ? 'pulse 1.5s infinite' : undefined,
              }}
            >
              <div className={cn(
                "transition-all duration-200",
                isHovered && "scale-110"
              )}>
                {item.icon}
              </div>
              
              {/* Label - always visible for Skyrim style */}
              <span className={cn(
                "absolute -bottom-7 left-1/2 -translate-x-1/2",
                "text-xs font-medium whitespace-nowrap",
                "transition-all duration-200",
                isHovered ? "text-foreground scale-110" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Central close button */}
        <button
          onClick={toggleMenu}
          className={cn(
            "relative z-10 flex items-center justify-center",
            "w-20 h-20 rounded-full",
            "bg-gradient-to-br from-card/95 to-card/80",
            "border-2 border-primary/50",
            "shadow-2xl",
            "transition-all duration-300",
            "hover:border-primary hover:scale-105"
          )}
          style={{
            boxShadow: '0 0 40px 10px hsl(var(--primary) / 0.3), 0 0 80px 20px hsl(var(--primary) / 0.15)'
          }}
        >
          <X className="w-8 h-8 text-primary" />
        </button>
        
        {/* Decorative ring */}
        <div 
          className="absolute inset-0 w-20 h-20 rounded-full border border-primary/20 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none"
          style={{
            width: '280px',
            height: '280px',
            animation: 'spin 30s linear infinite',
          }}
        />
        <div 
          className="absolute inset-0 w-20 h-20 rounded-full border border-primary/10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none"
          style={{
            width: '320px',
            height: '320px',
            animation: 'spin 45s linear infinite reverse',
          }}
        />
      </div>
    </div>
  );
}

export default RadialQuickMenu;
