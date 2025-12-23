import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CharacterStats, getStatModifier, rollDice, DiceRoll } from '@/types/rpgCharacter';
import { Dices, X } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full animate-fade-in">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">Skill Check Required</h2>
            <p className="text-muted-foreground text-sm mt-1">{reason}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center py-8">
          {/* Dice Display */}
          <div 
            className={`w-24 h-24 mx-auto mb-4 rounded-lg bg-background border-2 flex items-center justify-center text-4xl font-bold transition-all ${
              isRolling 
                ? 'border-primary animate-pulse' 
                : currentRoll?.criticalSuccess 
                  ? 'border-gold text-gold shadow-glow' 
                  : currentRoll?.criticalFailure 
                    ? 'border-destructive text-destructive' 
                    : currentRoll 
                      ? 'border-primary text-primary' 
                      : 'border-border'
            }`}
          >
            {displayNumber}
          </div>

          {/* Roll Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-center gap-4">
              <span className="text-muted-foreground">
                {stat.toUpperCase()}: {characterStats[stat]}
              </span>
              <span className="text-muted-foreground">
                Modifier: {modifier >= 0 ? '+' : ''}{modifier}
              </span>
            </div>
            <div className="text-muted-foreground">
              Difficulty: {difficulty}
            </div>
          </div>

          {/* Roll Result */}
          {currentRoll && !isRolling && (
            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border">
              {currentRoll.criticalSuccess && (
                <p className="text-lg font-bold text-gold">CRITICAL SUCCESS!</p>
              )}
              {currentRoll.criticalFailure && (
                <p className="text-lg font-bold text-destructive">CRITICAL FAILURE!</p>
              )}
              {!currentRoll.criticalSuccess && !currentRoll.criticalFailure && (
                <p className={`text-lg font-bold ${currentRoll.success ? 'text-forest' : 'text-destructive'}`}>
                  {currentRoll.success ? 'SUCCESS!' : 'FAILURE'}
                </p>
              )}
              <p className="text-muted-foreground mt-1">
                {currentRoll.result} + {currentRoll.modifier} = {currentRoll.total} vs DC {difficulty}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!currentRoll ? (
            <Button
              onClick={handleRoll}
              disabled={isRolling}
              className="flex-1 bg-primary text-primary-foreground"
            >
              <Dices className={`w-4 h-4 mr-2 ${isRolling ? 'animate-spin' : ''}`} />
              {isRolling ? 'Rolling...' : 'Roll d20'}
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-primary-foreground"
            >
              Continue Story
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
