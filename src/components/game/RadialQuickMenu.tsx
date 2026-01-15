// Radial Quick Menu - Skyrim-style centered radial menu
// Gear icon in header opens a full-screen centered radial menu

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="md:hidden fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop with blur */}
          <motion.div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={toggleMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Center container - positioned exactly at screen center */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: '280px', height: '280px' }}
          >
            {/* Multiple decorative orbit rings */}
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
              style={{
                width: '220px',
                height: '220px',
                animation: 'spin 25s linear infinite',
              }}
            />
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.4, type: "spring" }}
              style={{
                width: '260px',
                height: '260px',
                animation: 'spin 35s linear infinite reverse',
              }}
            />
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15 pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
              style={{
                width: '300px',
                height: '300px',
                animation: 'spin 45s linear infinite',
              }}
            />
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.25, duration: 0.4, type: "spring" }}
              style={{
                width: '340px',
                height: '340px',
                animation: 'spin 60s linear infinite reverse',
              }}
            />
            
            {/* Radial menu items with staggered spring animation */}
            {menuItems.map((item, index) => {
              const position = getItemPosition(index, menuItems.length);
              const isHovered = hoveredIndex === index;
              
              return (
                <motion.button
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
                    item.color
                  )}
                  initial={{ 
                    left: '50%',
                    top: '50%',
                    x: '-50%',
                    y: '-50%',
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{ 
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    x: '-50%',
                    y: '-50%',
                    scale: isHovered ? 1.15 : 1,
                    opacity: 1,
                    boxShadow: isHovered 
                      ? `0 0 25px 6px ${item.glowColor}, 0 0 50px 12px ${item.glowColor}40`
                      : `0 0 12px 2px ${item.glowColor}30, 0 4px 15px rgba(0,0,0,0.4)`,
                    borderColor: isHovered ? item.glowColor : `${item.glowColor}40`,
                  }}
                  exit={{ 
                    left: '50%',
                    top: '50%',
                    x: '-50%',
                    y: '-50%',
                    scale: 0,
                    opacity: 0 
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: index * 0.04,
                    scale: { duration: 0.2 },
                    boxShadow: { duration: 0.3 },
                    borderColor: { duration: 0.2 },
                  }}
                  style={{
                    animation: !isHovered ? `radial-pulse-${index % 3} 2.5s ease-in-out infinite` : undefined,
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  {item.icon}
                  
                  {/* Label below button */}
                  <motion.span 
                    className={cn(
                      "absolute top-full mt-2 left-1/2 -translate-x-1/2",
                      "text-[11px] font-medium whitespace-nowrap",
                      isHovered ? "text-foreground" : "text-muted-foreground"
                    )}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ delay: 0.1 + index * 0.04 }}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
            
            {/* Central close button */}
            <motion.button
              onClick={toggleMenu}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "z-10 flex items-center justify-center",
                "w-16 h-16 rounded-full",
                "bg-card/95 border-2 border-primary/50",
                "hover:border-primary active:scale-95"
              )}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
              }}
              style={{
                boxShadow: '0 0 30px 8px hsl(var(--primary) / 0.25), 0 0 60px 15px hsl(var(--primary) / 0.1)'
              }}
            >
              <X className="w-7 h-7 text-primary" />
            </motion.button>
          </div>
          
          {/* CSS for idle pulse animation */}
          <style>{`
            @keyframes radial-pulse-0 {
              0%, 100% { box-shadow: 0 0 12px 2px currentColor, 0 4px 15px rgba(0,0,0,0.4); }
              50% { box-shadow: 0 0 18px 4px currentColor, 0 4px 15px rgba(0,0,0,0.4); }
            }
            @keyframes radial-pulse-1 {
              0%, 100% { box-shadow: 0 0 10px 2px currentColor, 0 4px 15px rgba(0,0,0,0.4); }
              50% { box-shadow: 0 0 16px 4px currentColor, 0 4px 15px rgba(0,0,0,0.4); }
            }
            @keyframes radial-pulse-2 {
              0%, 100% { box-shadow: 0 0 14px 3px currentColor, 0 4px 15px rgba(0,0,0,0.4); }
              50% { box-shadow: 0 0 20px 5px currentColor, 0 4px 15px rgba(0,0,0,0.4); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RadialQuickMenu;
