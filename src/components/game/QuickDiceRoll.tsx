// Quick Dice Roll - Manual dice roll via /roll command
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuickDiceRollProps {
  open: boolean;
  onClose: () => void;
}

interface DiceResult {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
}

function parseDiceNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  // Parse formats like: d20, 2d6, d20+5, 3d8-2
  const match = notation.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;
  
  return {
    count: match[1] ? parseInt(match[1]) : 1,
    sides: parseInt(match[2]),
    modifier: match[3] ? parseInt(match[3]) : 0,
  };
}

function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

export function QuickDiceRoll({ open, onClose }: QuickDiceRollProps) {
  const [input, setInput] = useState('d20');
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [history, setHistory] = useState<DiceResult[]>([]);
  
  // Quick dice buttons
  const quickDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
  
  const performRoll = useCallback((notation: string) => {
    const parsed = parseDiceNotation(notation);
    if (!parsed) return;
    
    setIsRolling(true);
    setResult(null);
    
    // Animate rolling
    let frame = 0;
    const totalFrames = 15;
    const interval = setInterval(() => {
      if (frame < totalFrames) {
        setAnimatedTotal(Math.floor(Math.random() * (parsed.sides * parsed.count)) + parsed.count);
        frame++;
      } else {
        clearInterval(interval);
        
        // Final roll
        const rolls = rollDice(parsed.count, parsed.sides);
        const total = rolls.reduce((a, b) => a + b, 0) + parsed.modifier;
        
        const newResult: DiceResult = {
          dice: notation,
          rolls,
          modifier: parsed.modifier,
          total,
        };
        
        setResult(newResult);
        setAnimatedTotal(total);
        setIsRolling(false);
        setHistory(prev => [newResult, ...prev.slice(0, 9)]);
      }
    }, 50);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      performRoll(input.trim());
    }
  };
  
  // Reset on open
  useEffect(() => {
    if (open) {
      setResult(null);
      setInput('d20');
    }
  }, [open]);
  
  if (!open) return null;
  
  // Check for criticals on d20
  const isCrit20 = result?.dice.toLowerCase() === 'd20' && result?.rolls[0] === 20;
  const isCrit1 = result?.dice.toLowerCase() === 'd20' && result?.rolls[0] === 1;
  
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Quick Dice Roll</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Dice Display */}
          <div className="p-6">
            <motion.div
              animate={isRolling ? { rotate: [0, 360], scale: [1, 1.1, 1] } : {}}
              transition={isRolling ? { duration: 0.3, repeat: Infinity } : {}}
              className={cn(
                "w-24 h-24 mx-auto rounded-xl flex items-center justify-center text-4xl font-bold",
                "border-2 shadow-lg mb-4",
                isCrit20 && "border-emerald-400 text-emerald-400 bg-emerald-500/20",
                isCrit1 && "border-red-400 text-red-400 bg-red-500/20",
                !isCrit20 && !isCrit1 && "border-primary/50 text-foreground bg-primary/10"
              )}
              style={{
                boxShadow: isCrit20 
                  ? '0 0 30px rgba(16, 185, 129, 0.5)'
                  : isCrit1
                    ? '0 0 30px rgba(239, 68, 68, 0.5)'
                    : '0 0 20px hsl(var(--primary) / 0.3)'
              }}
            >
              {isRolling ? (
                <Dices className="w-12 h-12 animate-spin" />
              ) : result ? (
                animatedTotal
              ) : (
                '?'
              )}
            </motion.div>
            
            {/* Result breakdown */}
            {result && !isRolling && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {result.dice.toUpperCase()}
                </div>
                {result.rolls.length > 1 && (
                  <div className="text-xs text-muted-foreground">
                    Rolls: [{result.rolls.join(', ')}]
                    {result.modifier !== 0 && (
                      <span> {result.modifier > 0 ? '+' : ''}{result.modifier}</span>
                    )}
                  </div>
                )}
                {isCrit20 && (
                  <div className="flex items-center justify-center gap-1 text-emerald-400 mt-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold">Natural 20!</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                {isCrit1 && (
                  <div className="text-red-400 mt-2 font-semibold">
                    Critical Failure!
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Quick dice buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {quickDice.map(dice => (
                <Button
                  key={dice}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(dice);
                    performRoll(dice);
                  }}
                  className={cn(
                    "font-mono",
                    input.toLowerCase() === dice && "border-primary bg-primary/10"
                  )}
                >
                  {dice}
                </Button>
              ))}
            </div>
            
            {/* Custom input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. 2d6+3"
                className="font-mono text-center"
              />
              <Button type="submit" disabled={isRolling}>
                <Dices className="w-4 h-4 mr-2" />
                Roll
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              Format: NdX+M (e.g., 2d6+3, d20, 4d8-2)
            </p>
          </div>
          
          {/* Roll history */}
          {history.length > 0 && (
            <div className="border-t border-border p-3 bg-muted/20 max-h-32 overflow-y-auto">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Recent Rolls</div>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <div 
                    key={i}
                    className="px-2 py-1 rounded bg-background text-xs font-mono border border-border"
                  >
                    {h.dice}: <span className="font-bold">{h.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
