import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedStatBarProps {
  value: number;
  maxValue: number;
  label?: string;
  color?: 'health' | 'energy' | 'xp' | 'primary' | 'destructive';
  showChange?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_CLASSES = {
  health: 'bg-destructive',
  energy: 'bg-amber-500',
  xp: 'bg-primary',
  primary: 'bg-primary',
  destructive: 'bg-destructive',
};

const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function AnimatedStatBar({
  value,
  maxValue,
  label,
  color = 'primary',
  showChange = true,
  className,
  size = 'md',
}: AnimatedStatBarProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [change, setChange] = useState<{ amount: number; isPositive: boolean } | null>(null);
  const prevValue = useRef(value);
  const changeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== prevValue.current && showChange) {
      const diff = value - prevValue.current;
      setChange({ amount: Math.abs(diff), isPositive: diff > 0 });
      
      // Clear previous timeout
      if (changeTimeout.current) {
        clearTimeout(changeTimeout.current);
      }
      
      // Clear change indicator after animation
      changeTimeout.current = setTimeout(() => {
        setChange(null);
      }, 2000);
    }
    
    prevValue.current = value;
    setDisplayValue(value);
    
    return () => {
      if (changeTimeout.current) {
        clearTimeout(changeTimeout.current);
      }
    };
  }, [value, showChange]);

  const percentage = Math.min((displayValue / maxValue) * 100, 100);

  return (
    <div className={cn("relative", className)}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-mono">
            {displayValue}/{maxValue}
          </span>
        </div>
      )}
      
      <div className={cn(
        "w-full bg-muted/50 rounded-full overflow-hidden",
        SIZE_CLASSES[size]
      )}>
        <motion.div
          className={cn("h-full rounded-full", COLOR_CLASSES[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 0.5 
          }}
        />
      </div>
      
      {/* Change indicator */}
      <AnimatePresence>
        {change && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute -top-6 right-0 text-sm font-bold",
              change.isPositive ? "text-green-500" : "text-destructive"
            )}
          >
            {change.isPositive ? '+' : '-'}{change.amount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Number that animates when changed
interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({ value, className, prefix, suffix }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setIsAnimating(true);
      
      // Animate number counting
      const diff = value - prevValue.current;
      const steps = 10;
      const stepValue = diff / steps;
      let current = prevValue.current;
      let step = 0;
      
      const interval = setInterval(() => {
        step++;
        current += stepValue;
        setDisplayValue(Math.round(current));
        
        if (step >= steps) {
          clearInterval(interval);
          setDisplayValue(value);
          setIsAnimating(false);
        }
      }, 30);
      
      prevValue.current = value;
      
      return () => clearInterval(interval);
    }
  }, [value]);

  return (
    <span className={cn(
      "transition-all duration-200",
      isAnimating && "scale-110 text-primary",
      className
    )}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
