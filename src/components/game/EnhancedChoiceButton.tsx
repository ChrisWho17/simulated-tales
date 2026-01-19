// ============================================================================
// ENHANCED CHOICE BUTTON - Animated choice buttons with hover effects
// Features: ripple animation, glow on hover, consequence preview hints
// ============================================================================

import { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, AlertTriangle, Heart, Skull, Coins, Shield } from 'lucide-react';

type ConsequenceHint = 'danger' | 'romance' | 'combat' | 'reward' | 'safe' | 'risky';

interface EnhancedChoiceButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  consequenceHint?: ConsequenceHint;
  isLoading?: boolean;
  className?: string;
  index?: number;
}

const CONSEQUENCE_ICONS: Record<ConsequenceHint, React.ReactNode> = {
  danger: <AlertTriangle className="w-3 h-3" />,
  romance: <Heart className="w-3 h-3" />,
  combat: <Skull className="w-3 h-3" />,
  reward: <Coins className="w-3 h-3" />,
  safe: <Shield className="w-3 h-3" />,
  risky: <Sparkles className="w-3 h-3" />,
};

const CONSEQUENCE_COLORS: Record<ConsequenceHint, string> = {
  danger: 'border-red-500/50 hover:border-red-500 hover:shadow-red-500/20',
  romance: 'border-pink-500/50 hover:border-pink-500 hover:shadow-pink-500/20',
  combat: 'border-orange-500/50 hover:border-orange-500 hover:shadow-orange-500/20',
  reward: 'border-amber-500/50 hover:border-amber-500 hover:shadow-amber-500/20',
  safe: 'border-green-500/50 hover:border-green-500 hover:shadow-green-500/20',
  risky: 'border-purple-500/50 hover:border-purple-500 hover:shadow-purple-500/20',
};

export function EnhancedChoiceButton({
  label,
  onClick,
  disabled = false,
  variant = 'default',
  consequenceHint,
  isLoading = false,
  className,
  index = 0,
}: EnhancedChoiceButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    // Create ripple effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      setRipples(prev => [...prev, { id, x, y }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onClick();
  };

  const variantStyles = {
    default: 'bg-background/80 hover:bg-background border-border',
    primary: 'bg-primary/10 hover:bg-primary/20 border-primary/50 hover:border-primary',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/50 hover:border-red-500',
    success: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/50 hover:border-green-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled || isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative overflow-hidden w-full justify-start text-left px-4 py-3 h-auto",
          "border backdrop-blur-sm transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          variantStyles[variant],
          consequenceHint && CONSEQUENCE_COLORS[consequenceHint],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        variant="outline"
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full bg-primary/30 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 20,
                height: 20,
                marginLeft: -10,
                marginTop: -10,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Hover glow effect */}
        <AnimatePresence>
          {isHovered && !disabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 w-full">
          {consequenceHint && (
            <span className={cn(
              "flex-shrink-0 transition-transform duration-200",
              isHovered && "scale-110"
            )}>
              {CONSEQUENCE_ICONS[consequenceHint]}
            </span>
          )}
          <span className="flex-1 line-clamp-2">{label}</span>
          {isLoading && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="flex-shrink-0"
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.span>
          )}
        </span>
      </Button>
    </motion.div>
  );
}

// Choice container with staggered animation
interface ChoiceContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChoiceContainer({ children, className }: ChoiceContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className={cn("space-y-2", className)}
    >
      {children}
    </motion.div>
  );
}

export default EnhancedChoiceButton;
