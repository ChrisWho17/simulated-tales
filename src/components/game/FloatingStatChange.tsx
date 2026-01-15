import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StatChange {
  id: string;
  stat: string;
  value: number;
  icon?: string;
  timestamp: number;
}

interface FloatingStatChangeProps {
  change: StatChange;
  onComplete: (id: string) => void;
}

const STAT_COLORS: Record<string, { positive: string; negative: string }> = {
  health: { positive: 'text-emerald-400', negative: 'text-red-400' },
  energy: { positive: 'text-yellow-400', negative: 'text-orange-400' },
  gold: { positive: 'text-amber-400', negative: 'text-amber-600' },
  mood: { positive: 'text-pink-400', negative: 'text-purple-400' },
  hunger: { positive: 'text-orange-400', negative: 'text-orange-600' },
  reputation: { positive: 'text-blue-400', negative: 'text-blue-600' },
  xp: { positive: 'text-violet-400', negative: 'text-violet-600' },
  default: { positive: 'text-green-400', negative: 'text-red-400' },
};

const STAT_ICONS: Record<string, string> = {
  health: '❤️',
  energy: '⚡',
  gold: '💰',
  mood: '😊',
  hunger: '🍖',
  reputation: '⭐',
  xp: '✨',
};

export function FloatingStatChange({ change, onComplete }: FloatingStatChangeProps) {
  const colors = STAT_COLORS[change.stat.toLowerCase()] || STAT_COLORS.default;
  const colorClass = change.value >= 0 ? colors.positive : colors.negative;
  const icon = change.icon || STAT_ICONS[change.stat.toLowerCase()] || '📊';
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(change.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [change.id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.6 }}
      transition={{ 
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={cn(
        "pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-black/60 backdrop-blur-sm border border-white/10",
        "font-bold text-sm shadow-lg",
        colorClass
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="font-mono">
        {change.value >= 0 ? '+' : ''}{change.value}
      </span>
      <span className="text-xs opacity-75 capitalize">{change.stat}</span>
    </motion.div>
  );
}

interface FloatingStatContainerProps {
  changes: StatChange[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export function FloatingStatContainer({ 
  changes, 
  onRemove,
  position = 'top-right' 
}: FloatingStatContainerProps) {
  const positionClasses = {
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'center': 'top-1/3 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={cn(
      "fixed z-50 flex flex-col gap-2",
      positionClasses[position]
    )}>
      <AnimatePresence mode="popLayout">
        {changes.map((change) => (
          <FloatingStatChange
            key={change.id}
            change={change}
            onComplete={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing stat changes
export function useStatChanges() {
  const [changes, setChanges] = useState<StatChange[]>([]);

  const addChange = (stat: string, value: number, icon?: string) => {
    const newChange: StatChange = {
      id: `${stat}-${Date.now()}-${Math.random()}`,
      stat,
      value,
      icon,
      timestamp: Date.now(),
    };
    setChanges(prev => [...prev, newChange]);
  };

  const removeChange = (id: string) => {
    setChanges(prev => prev.filter(c => c.id !== id));
  };

  return { changes, addChange, removeChange };
}
