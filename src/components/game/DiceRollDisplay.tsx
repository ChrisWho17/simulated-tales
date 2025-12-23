import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices } from 'lucide-react';
import { DiceRollResult, ROLL_RESULTS } from '@/game/diceSystem';
import { cn } from '@/lib/utils';

interface DiceRollDisplayProps {
  roll: DiceRollResult;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const DiceRollDisplay: React.FC<DiceRollDisplayProps> = ({
  roll,
  onClose,
  autoClose = true,
  autoCloseDelay = 4000
}) => {
  const [isRolling, setIsRolling] = useState(true);
  const [displayedRoll, setDisplayedRoll] = useState<number>(1);
  
  // Animate the dice roll
  useEffect(() => {
    let frame = 0;
    const totalFrames = 20;
    const interval = setInterval(() => {
      if (frame < totalFrames) {
        setDisplayedRoll(Math.floor(Math.random() * 20) + 1);
        frame++;
      } else {
        setDisplayedRoll(roll.naturalRoll);
        setIsRolling(false);
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [roll.naturalRoll]);
  
  // Auto close after delay
  useEffect(() => {
    if (autoClose && !isRolling) {
      const timeout = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timeout);
    }
  }, [autoClose, autoCloseDelay, isRolling, onClose]);
  
  const resultKey = Object.entries(ROLL_RESULTS).find(
    ([_, v]) => v.label === roll.result.label
  )?.[0] || 'FAILURE';
  
  const resultColors: Record<string, string> = {
    CRITICAL_SUCCESS: 'from-emerald-500 to-teal-400',
    SUCCESS: 'from-green-500 to-emerald-400',
    PARTIAL: 'from-amber-500 to-yellow-400',
    FAILURE: 'from-red-500 to-orange-400',
    CRITICAL_FAILURE: 'from-red-700 to-red-500'
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-panel p-6 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
          
          {/* Action name */}
          <div className="text-center mb-4">
            <h3 className="font-display text-lg text-[var(--accent-secondary)]">
              {roll.action}
            </h3>
            <p className="text-xs text-muted-foreground">
              {roll.stat.charAt(0).toUpperCase() + roll.stat.slice(1)} Check
            </p>
          </div>
          
          {/* Dice display */}
          <div className="flex justify-center mb-4">
            <motion.div
              animate={isRolling ? { 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              } : {}}
              transition={isRolling ? { 
                duration: 0.3, 
                repeat: Infinity 
              } : {}}
              className={cn(
                "w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold",
                "border-2 shadow-lg",
                roll.isCritical && !isRolling
                  ? roll.naturalRoll === 20 
                    ? "border-emerald-400 text-emerald-400 bg-emerald-500/20" 
                    : "border-red-400 text-red-400 bg-red-500/20"
                  : "border-[var(--accent-primary)] text-foreground bg-black/40"
              )}
              style={{
                boxShadow: roll.isCritical && !isRolling
                  ? roll.naturalRoll === 20
                    ? '0 0 30px rgba(16, 185, 129, 0.5)'
                    : '0 0 30px rgba(239, 68, 68, 0.5)'
                  : '0 0 20px var(--accent-glow)'
              }}
            >
              {isRolling ? <Dices className="w-10 h-10 animate-spin" /> : displayedRoll}
            </motion.div>
          </div>
          
          {/* Roll breakdown */}
          {!isRolling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Modifiers */}
              <div className="text-center text-sm mb-3 space-x-2">
                <span className="font-mono">{roll.naturalRoll}</span>
                {roll.totalModifier !== 0 && (
                  <>
                    <span className="text-muted-foreground">
                      {roll.totalModifier >= 0 ? '+' : ''}{roll.totalModifier}
                    </span>
                    <span className="text-muted-foreground">=</span>
                    <span className="font-mono font-bold">{roll.totalRoll}</span>
                  </>
                )}
                <span className="text-muted-foreground">vs DC</span>
                <span 
                  className="font-mono font-bold"
                  style={{ color: roll.difficultyColor }}
                >
                  {roll.targetDC}
                </span>
                <span className="text-muted-foreground text-xs">({roll.difficulty})</span>
              </div>
              
              {/* Modifier breakdown */}
              {roll.modifierBreakdown.length > 1 && (
                <div className="text-xs text-muted-foreground text-center mb-3 space-x-2">
                  {roll.modifierBreakdown.map((mod, i) => (
                    <span 
                      key={i}
                      className={cn(mod.isWound && "text-red-400")}
                    >
                      {mod.source}: {mod.value >= 0 ? '+' : ''}{mod.value}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Result */}
              <div 
                className={cn(
                  "text-center py-3 rounded-lg bg-gradient-to-r",
                  resultColors[resultKey]
                )}
              >
                <span className="text-2xl mr-2">{roll.result.icon}</span>
                <span className="font-display text-lg text-white font-semibold">
                  {roll.result.label}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DiceRollDisplay;
