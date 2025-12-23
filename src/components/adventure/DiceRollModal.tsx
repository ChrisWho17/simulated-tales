import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CharacterStats, getStatModifier, rollDice, DiceRoll } from '@/types/rpgCharacter';
import { Dices, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DiceRollModalProps {
  stat: keyof CharacterStats;
  difficulty: number;
  reason: string;
  characterStats: CharacterStats;
  onRoll: (roll: DiceRoll) => void;
  onCancel: () => void;
}

export function DiceRollModal({
  stat,
  difficulty,
  reason,
  characterStats,
  onRoll,
  onCancel,
}: DiceRollModalProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<DiceRoll | null>(null);
  const [displayNumber, setDisplayNumber] = useState(20);

  const modifier = getStatModifier(characterStats[stat]);

  const handleRoll = () => {
    setIsRolling(true);
    
    // Animate the dice
    let rollCount = 0;
    const maxRolls = 15;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      rollCount++;
      
      if (rollCount >= maxRolls) {
        clearInterval(interval);
        
        // Perform actual roll
        const roll = rollDice('d20', stat, characterStats, difficulty);
        setCurrentRoll(roll);
        setDisplayNumber(roll.result);
        setIsRolling(false);
      }
    }, 80);
  };

  const handleConfirm = () => {
    if (currentRoll) {
      onRoll(currentRoll);
    }
  };

  const getResultColor = () => {
    if (!currentRoll) return 'border-border';
    if (currentRoll.criticalSuccess) return 'border-emerald-400 text-emerald-400';
    if (currentRoll.criticalFailure) return 'border-red-500 text-red-500';
    if (currentRoll.success) return 'border-green-500 text-green-500';
    return 'border-red-400 text-red-400';
  };

  const getResultGlow = () => {
    if (!currentRoll) return '0 0 20px var(--accent-glow)';
    if (currentRoll.criticalSuccess) return '0 0 30px rgba(16, 185, 129, 0.5)';
    if (currentRoll.criticalFailure) return '0 0 30px rgba(239, 68, 68, 0.5)';
    if (currentRoll.success) return '0 0 25px rgba(34, 197, 94, 0.4)';
    return '0 0 25px rgba(248, 113, 113, 0.4)';
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-panel bg-card border border-border rounded-xl p-6 max-w-md w-full"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-[var(--accent-primary)]">Skill Check Required</h2>
              <p className="text-muted-foreground text-sm mt-1">{reason}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-destructive/20">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center py-8">
            {/* Dice Display */}
            <motion.div 
              animate={isRolling ? { rotate: [0, 360], scale: [1, 1.1, 1] } : {}}
              transition={isRolling ? { duration: 0.3, repeat: Infinity } : {}}
              className={cn(
                "w-24 h-24 mx-auto mb-4 rounded-xl border-2 flex items-center justify-center text-4xl font-bold transition-all",
                isRolling ? 'border-[var(--accent-primary)]' : getResultColor(),
                !isRolling && currentRoll && 'bg-black/30'
              )}
              style={{ boxShadow: isRolling ? '0 0 25px var(--accent-glow)' : getResultGlow() }}
            >
              {isRolling ? (
                <Dices className="w-12 h-12 animate-spin text-[var(--accent-primary)]" />
              ) : (
                displayNumber
              )}
            </motion.div>

            {/* Roll Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-center gap-4">
                <span className="text-muted-foreground">
                  {stat.toUpperCase()}: {characterStats[stat]}
                </span>
                <span className="text-muted-foreground">
                  Modifier: <span className={modifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {modifier >= 0 ? '+' : ''}{modifier}
                  </span>
                </span>
              </div>
              <div className="text-muted-foreground">
                Difficulty: <span className="font-mono text-[var(--accent-secondary)]">{difficulty}</span>
              </div>
            </div>

            {/* Roll Result */}
            {currentRoll && !isRolling && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 p-4 rounded-lg bg-black/30 border border-border"
              >
                {currentRoll.criticalSuccess && (
                  <p className="text-lg font-bold text-emerald-400">⭐ CRITICAL SUCCESS!</p>
                )}
                {currentRoll.criticalFailure && (
                  <p className="text-lg font-bold text-red-500">💀 CRITICAL FAILURE!</p>
                )}
                {!currentRoll.criticalSuccess && !currentRoll.criticalFailure && (
                  <p className={cn("text-lg font-bold", currentRoll.success ? 'text-green-400' : 'text-red-400')}>
                    {currentRoll.success ? '✓ SUCCESS!' : '✗ FAILURE'}
                  </p>
                )}
                <p className="text-muted-foreground mt-1 font-mono text-sm">
                  {currentRoll.result} + {currentRoll.modifier} = {currentRoll.total} vs DC {difficulty}
                </p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!currentRoll ? (
              <Button
                onClick={handleRoll}
                disabled={isRolling}
                className="flex-1 bg-[var(--accent-gradient)] hover:opacity-90"
                style={{ background: 'var(--accent-gradient)' }}
              >
                <Dices className={cn("w-4 h-4 mr-2", isRolling && 'animate-spin')} />
                {isRolling ? 'Rolling...' : 'Roll d20'}
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                className="flex-1"
                style={{ background: 'var(--accent-gradient)' }}
              >
                Continue Story
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
