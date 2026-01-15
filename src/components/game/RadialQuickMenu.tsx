// Radial Quick Menu - Gear icon that opens a circular menu
// Items fan out in a radial pattern with glowing hover animations

import React, { useState, useCallback } from 'react';
import { 
  Settings, ScrollText, Backpack, Bookmark, 
  Clock, CloudRain, RotateCcw, X, Info, FolderOpen, Sliders
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const menuItems: RadialMenuItem[] = [
    {
      icon: <ScrollText className="w-5 h-5" />,
      label: 'Character',
      onClick: onOpenCharacterSheet,
      color: 'text-primary',
      glowColor: 'shadow-primary/60',
    },
    {
      icon: <Backpack className="w-5 h-5" />,
      label: 'Inventory',
      onClick: onOpenInventory,
      color: 'text-amber-400',
      glowColor: 'shadow-amber-400/60',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Time',
      onClick: onOpenTime,
      color: 'text-yellow-400',
      glowColor: 'shadow-yellow-400/60',
    },
    {
      icon: <CloudRain className="w-5 h-5" />,
      label: 'Weather',
      onClick: onOpenWeather,
      color: 'text-blue-400',
      glowColor: 'shadow-blue-400/60',
    },
    {
      icon: <Bookmark className="w-5 h-5" />,
      label: 'Bookmarks',
      onClick: onOpenBookmarks,
      color: 'text-purple-400',
      glowColor: 'shadow-purple-400/60',
    },
    {
      icon: <Info className="w-5 h-5" />,
      label: 'Recap',
      onClick: onOpenRecap,
      color: 'text-green-400',
      glowColor: 'shadow-green-400/60',
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      label: 'Saves',
      onClick: onOpenSaves,
      color: 'text-cyan-400',
      glowColor: 'shadow-cyan-400/60',
    },
    {
      icon: <Sliders className="w-5 h-5" />,
      label: 'Settings',
      onClick: onOpenSettings,
      color: 'text-muted-foreground',
      glowColor: 'shadow-foreground/40',
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      label: 'New Story',
      onClick: onRestart,
      color: 'text-destructive',
      glowColor: 'shadow-destructive/60',
    },
  ];

  // Calculate radial positions for menu items
  const getItemPosition = (index: number, total: number) => {
    // Start from top (-90 degrees) and go clockwise
    const startAngle = -90;
    const spreadAngle = 180; // Half circle (right side)
    const angleStep = spreadAngle / (total - 1);
    const angle = startAngle + (angleStep * index);
    const radians = (angle * Math.PI) / 180;
    
    // Radius from center
    const radius = 90;
    
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-50">
      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={toggleMenu}
        />
      )}
      
      {/* Radial menu items */}
      <div className="relative">
        {menuItems.map((item, index) => {
          const position = getItemPosition(index, menuItems.length);
          const isHovered = hoveredIndex === index;
          const delay = index * 30; // Staggered animation
          
          return (
            <button
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(index)}
              onTouchEnd={() => setHoveredIndex(null)}
              className={cn(
                "absolute flex flex-col items-center justify-center",
                "w-12 h-12 rounded-full",
                "bg-card/95 backdrop-blur-md border border-border/50",
                "transition-all duration-300 ease-out",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none",
                isHovered && "scale-110 border-primary/50",
                item.color
              )}
              style={{
                transform: isOpen 
                  ? `translate(${position.x}px, ${position.y}px) scale(${isHovered ? 1.15 : 1})`
                  : 'translate(0, 0) scale(0)',
                transitionDelay: isOpen ? `${delay}ms` : '0ms',
                boxShadow: isHovered 
                  ? `0 0 20px 4px var(--glow-color), 0 0 40px 8px var(--glow-color-faint)`
                  : 'none',
                '--glow-color': isHovered ? getGlowColor(item.color) : 'transparent',
                '--glow-color-faint': isHovered ? getGlowColorFaint(item.color) : 'transparent',
              } as React.CSSProperties}
            >
              <div className={cn(
                "transition-all duration-200",
                isHovered && "animate-pulse"
              )}>
                {item.icon}
              </div>
              
              {/* Label tooltip on hover */}
              {isHovered && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-card/95 rounded-md border border-border/50 shadow-lg animate-fade-in">
                    {item.label}
                  </span>
                </div>
              )}
            </button>
          );
        })}
        
        {/* Central gear button */}
        <button
          onClick={toggleMenu}
          className={cn(
            "relative z-10 flex items-center justify-center",
            "w-14 h-14 rounded-full",
            "bg-gradient-to-br from-primary/90 to-primary/70",
            "border-2 border-primary/50",
            "shadow-lg shadow-primary/30",
            "transition-all duration-300",
            "hover:shadow-xl hover:shadow-primary/40",
            "active:scale-95",
            isOpen && "rotate-180 bg-gradient-to-br from-destructive/90 to-destructive/70 border-destructive/50 shadow-destructive/30"
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Settings className={cn(
              "w-6 h-6 text-white",
              "transition-transform duration-700",
              "hover:rotate-90"
            )} />
          )}
          
          {/* Pulsing ring when closed */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
}

// Helper to get glow color from text color class
function getGlowColor(colorClass: string): string {
  const colorMap: Record<string, string> = {
    'text-primary': 'hsl(var(--primary))',
    'text-amber-400': 'rgb(251 191 36)',
    'text-yellow-400': 'rgb(250 204 21)',
    'text-blue-400': 'rgb(96 165 250)',
    'text-purple-400': 'rgb(192 132 252)',
    'text-green-400': 'rgb(74 222 128)',
    'text-cyan-400': 'rgb(34 211 238)',
    'text-muted-foreground': 'hsl(var(--muted-foreground))',
    'text-destructive': 'hsl(var(--destructive))',
  };
  return colorMap[colorClass] || 'hsl(var(--primary))';
}

function getGlowColorFaint(colorClass: string): string {
  const color = getGlowColor(colorClass);
  // Return a more transparent version
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', ' / 0.3)');
  }
  return color.replace(')', ' / 0.3)');
}

export default RadialQuickMenu;
