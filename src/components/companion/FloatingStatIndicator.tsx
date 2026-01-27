// ============================================================================
// FLOATING STAT INDICATOR - Visual feedback for companion stat changes
// Shows animated +/- indicators on companion portraits
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Heart, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatChange {
  id: string;
  stat: 'trust' | 'respect' | 'fear' | 'romance' | 'affinity';
  value: number;
  timestamp: number;
}

interface FloatingStatIndicatorProps {
  changes: StatChange[];
  onChangeComplete?: (id: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const STAT_CONFIG = {
  trust: { icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  respect: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  fear: { icon: AlertTriangle, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  romance: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  affinity: { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/20' },
};

const POSITION_CLASSES = {
  'top-left': '-top-2 -left-2',
  'top-right': '-top-2 -right-2',
  'bottom-left': '-bottom-2 -left-2',
  'bottom-right': '-bottom-2 -right-2',
};

export function FloatingStatIndicator({
  changes,
  onChangeComplete,
  position = 'top-right',
  className,
}: FloatingStatIndicatorProps) {
  return (
    <div className={cn(
      "absolute z-20 pointer-events-none",
      POSITION_CLASSES[position],
      className
    )}>
      <AnimatePresence mode="popLayout">
        {changes.slice(0, 3).map((change, index) => (
          <FloatingIndicator
            key={change.id}
            change={change}
            index={index}
            onComplete={() => onChangeComplete?.(change.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FloatingIndicatorProps {
  change: StatChange;
  index: number;
  onComplete: () => void;
}

function FloatingIndicator({ change, index, onComplete }: FloatingIndicatorProps) {
  const config = STAT_CONFIG[change.stat];
  const Icon = config.icon;
  const isPositive = change.value > 0;
  const isMajor = Math.abs(change.value) >= 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000 + index * 200); // Stagger completion
    return () => clearTimeout(timer);
  }, [onComplete, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        y: -20 - (index * 25), 
        scale: isMajor ? 1.2 : 1,
      }}
      exit={{ 
        opacity: 0, 
        y: -40 - (index * 25), 
        scale: 0.5,
      }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeOut',
        delay: index * 0.1,
      }}
      className={cn(
        "absolute flex items-center gap-1 px-2 py-1 rounded-full",
        "shadow-lg border backdrop-blur-sm",
        isPositive && "border-emerald-500/40 bg-emerald-500/20",
        !isPositive && "border-red-500/40 bg-red-500/20",
        isMajor && "ring-2",
        isMajor && isPositive && "ring-emerald-400/50",
        isMajor && !isPositive && "ring-red-400/50"
      )}
      style={{
        boxShadow: isPositive 
          ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
          : '0 4px 12px rgba(239, 68, 68, 0.3)',
      }}
    >
      <Icon className={cn("w-3 h-3", config.color)} />
      <span className={cn(
        "text-xs font-bold font-mono whitespace-nowrap",
        isPositive && "text-emerald-400",
        !isPositive && "text-red-400"
      )}>
        {isPositive ? '+' : ''}{change.value}
      </span>
    </motion.div>
  );
}

// Hook to manage stat change queue
export function useFloatingStats(companionId: string) {
  const [changes, setChanges] = useState<StatChange[]>([]);

  const addChange = useCallback((stat: StatChange['stat'], value: number) => {
    if (value === 0) return;
    
    const newChange: StatChange = {
      id: `${stat}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stat,
      value,
      timestamp: Date.now(),
    };
    
    setChanges(prev => [...prev.slice(-5), newChange]); // Keep max 6 changes
  }, []);

  const removeChange = useCallback((id: string) => {
    setChanges(prev => prev.filter(c => c.id !== id));
  }, []);

  const addMultipleChanges = useCallback((statChanges: Partial<Record<StatChange['stat'], number>>) => {
    const newChanges: StatChange[] = [];
    const delay = 100; // Stagger additions
    
    Object.entries(statChanges).forEach(([stat, value], index) => {
      if (value && Math.abs(value) >= 3) { // Only show significant changes
        setTimeout(() => {
          addChange(stat as StatChange['stat'], value);
        }, index * delay);
      }
    });
  }, [addChange]);

  return {
    changes,
    addChange,
    removeChange,
    addMultipleChanges,
  };
}

// Container component that wraps a portrait with floating indicators
interface StatIndicatorWrapperProps {
  companionId: string;
  children: React.ReactNode;
  className?: string;
}

export function StatIndicatorWrapper({ 
  companionId, 
  children, 
  className 
}: StatIndicatorWrapperProps) {
  const { changes, removeChange } = useFloatingStats(companionId);
  
  return (
    <div className={cn("relative", className)}>
      {children}
      <FloatingStatIndicator 
        changes={changes} 
        onChangeComplete={removeChange}
        position="top-right"
      />
    </div>
  );
}

console.log('[FloatingStatIndicator] Component loaded');
