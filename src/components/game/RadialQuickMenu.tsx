// Radial Quick Menu - Skyrim-style centered radial menu
// Gear icon in header opens a full-screen centered radial menu

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, ScrollText, Backpack, Bookmark, 
  RotateCcw, X, Info, FolderOpen, Sliders
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Floating particle component with varied properties
const FloatingParticle = ({ 
  delay, 
  duration, 
  size, 
  startAngle, 
  radius,
  color,
  opacity,
  speed 
}: { 
  delay: number; 
  duration: number; 
  size: number; 
  startAngle: number;
  radius: number;
  color: string;
  opacity: number;
  speed: number;
}) => {
  // Each particle has unique trajectory based on its properties
  const angleVariance = 30 + Math.random() * 60;
  const endAngle = startAngle + angleVariance * speed;
  const radiusVariance = 15 + Math.random() * 35;
  
  const startX = Math.cos((startAngle * Math.PI) / 180) * radius;
  const startY = Math.sin((startAngle * Math.PI) / 180) * radius;
  const midAngle = startAngle + angleVariance * 0.5;
  const midRadius = radius + radiusVariance * 0.7;
  const midX = Math.cos((midAngle * Math.PI) / 180) * midRadius;
  const midY = Math.sin((midAngle * Math.PI) / 180) * midRadius;
  const endX = Math.cos((endAngle * Math.PI) / 180) * (radius + radiusVariance);
  const endY = Math.sin((endAngle * Math.PI) / 180) * (radius + radiusVariance);
  
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        left: '50%',
        top: '50%',
        filter: size > 3 ? 'blur(0.5px)' : 'none',
      }}
      initial={{ 
        x: startX - size/2, 
        y: startY - size/2, 
        opacity: 0,
        scale: 0 
      }}
      animate={{ 
        x: [startX - size/2, midX - size/2, endX - size/2, startX - size/2],
        y: [startY - size/2, midY - size/2, endY - size/2, startY - size/2],
        opacity: [0, opacity * 0.9, opacity * 0.7, opacity * 0.4, 0],
        scale: [0, 1.1, 0.9, 0.6, 0],
      }}
      transition={{
        duration: duration / speed,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Generate particles with varied properties
const generateParticles = () => {
  const particles: Array<{
    key: string;
    delay: number;
    duration: number;
    size: number;
    startAngle: number;
    radius: number;
    color: string;
    opacity: number;
    speed: number;
  }> = [];
  
  // Layer 1: Larger, slower primary particles
  for (let i = 0; i < 8; i++) {
    particles.push({
      key: `large-${i}`,
      delay: i * 0.4 + Math.random() * 0.3,
      duration: 6 + Math.random() * 3,
      size: 4 + Math.random() * 3,
      startAngle: (i * 45) + Math.random() * 30,
      radius: 120 + Math.random() * 50,
      color: 'hsl(var(--primary))',
      opacity: 0.3 + Math.random() * 0.3,
      speed: 0.6 + Math.random() * 0.4,
    });
  }
  
  // Layer 2: Medium particles with varied colors
  for (let i = 0; i < 12; i++) {
    particles.push({
      key: `medium-${i}`,
      delay: i * 0.25 + Math.random() * 0.2,
      duration: 4 + Math.random() * 2,
      size: 2 + Math.random() * 2.5,
      startAngle: (i * 30) + Math.random() * 20,
      radius: 90 + Math.random() * 70,
      color: i % 3 === 0 ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.8)',
      opacity: 0.4 + Math.random() * 0.4,
      speed: 0.8 + Math.random() * 0.5,
    });
  }
  
  // Layer 3: Tiny fast sparkles
  for (let i = 0; i < 20; i++) {
    particles.push({
      key: `sparkle-${i}`,
      delay: i * 0.15 + Math.random() * 0.4,
      duration: 2.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 1.5,
      startAngle: (i * 18) + Math.random() * 15,
      radius: 70 + Math.random() * 100,
      color: 'rgba(255, 255, 255, 0.9)',
      opacity: 0.5 + Math.random() * 0.5,
      speed: 1 + Math.random() * 0.8,
    });
  }
  
  return particles;
};

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
  
  // Memoize particles so they don't regenerate on every render
  const particles = useMemo(() => generateParticles(), []);

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

  // Calculate radial positions - full circle around center (evenly distributed)
  const getItemPosition = (index: number, total: number) => {
    // Start from top (-90°) and distribute evenly around the full circle
    const startAngle = -90;
    const angleStep = 360 / total;
    const angle = startAngle + (angleStep * index);
    const radians = (angle * Math.PI) / 180;
    
    // Radius sized for mobile screens  
    const radius = 105;
    
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="md:hidden fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Inverted vignette backdrop - bright center, dark edges */}
          <motion.div 
            className="absolute inset-0"
            onClick={toggleMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `
                radial-gradient(
                  circle at center,
                  hsl(var(--primary) / 0.15) 0%,
                  hsl(var(--primary) / 0.08) 15%,
                  rgba(0, 0, 0, 0.7) 45%,
                  rgba(0, 0, 0, 0.92) 100%
                )
              `,
              backdropFilter: 'blur(8px)',
            }}
          />
          
          {/* Floating particles with varied properties */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {particles.map((particle) => (
              <FloatingParticle
                key={particle.key}
                delay={particle.delay}
                duration={particle.duration}
                size={particle.size}
                startAngle={particle.startAngle}
                radius={particle.radius}
                color={particle.color}
                opacity={particle.opacity}
                speed={particle.speed}
              />
            ))}
          </div>
          
          {/* Center container - menu items positioned around center */}
          <div 
            className="relative"
            style={{ width: '300px', height: '300px' }}
          >
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
            
            {/* Central close button - nudged slightly up-left for visual balance */}
            <motion.button
              onClick={toggleMenu}
              className={cn(
                "absolute z-10 flex items-center justify-center",
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
                left: 'calc(50% - 31px)',
                top: 'calc(50% - 31px)',
                transform: 'translate(-50%, -50%)',
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
