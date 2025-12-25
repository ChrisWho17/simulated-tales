import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LevelUpChoice } from '@/game/levelingSystem';
import { CharacterStats } from '@/types/rpgCharacter';
import { Sparkles, Star, ArrowUp, Shield, Zap, Brain, Heart, Eye, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpModalProps {
  isOpen: boolean;
  choices: LevelUpChoice[];
  currentLevel: number;
  isChapterReward: boolean;
  characterName: string;
  portraitUrl?: string;
  onSelectChoice: (choice: LevelUpChoice) => void;
}

const STAT_ICONS: Record<keyof CharacterStats, React.ReactNode> = {
  strength: <Shield className="w-4 h-4" />,
  dexterity: <Zap className="w-4 h-4" />,
  constitution: <Heart className="w-4 h-4" />,
  intelligence: <Brain className="w-4 h-4" />,
  wisdom: <Eye className="w-4 h-4" />,
  charisma: <Users className="w-4 h-4" />,
};

const STAT_COLORS: Record<keyof CharacterStats, string> = {
  strength: 'text-red-400',
  dexterity: 'text-green-400',
  constitution: 'text-orange-400',
  intelligence: 'text-blue-400',
  wisdom: 'text-purple-400',
  charisma: 'text-pink-400',
};

export function LevelUpModal({
  isOpen,
  choices,
  currentLevel,
  isChapterReward,
  characterName,
  portraitUrl,
  onSelectChoice,
}: LevelUpModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<LevelUpChoice | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Animate in content after modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setSelectedChoice(null);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleChoiceClick = (choice: LevelUpChoice) => {
    setSelectedChoice(choice);
    setIsConfirming(true);
  };

  const handleConfirm = () => {
    if (selectedChoice) {
      onSelectChoice(selectedChoice);
    }
  };

  const handleCancel = () => {
    setSelectedChoice(null);
    setIsConfirming(false);
  };

  const newLevel = currentLevel + (isChapterReward ? 2 : 1);
  const totalStatGain = isChapterReward ? 2 : 1;

  const formatStatChanges = (changes: Partial<CharacterStats>) => {
    return Object.entries(changes)
      .filter(([_, value]) => value && value > 0)
      .map(([stat, value]) => ({
        stat: stat as keyof CharacterStats,
        value: value as number,
      }));
  };

  return (
    <Dialog open={isOpen} modal>
      <DialogContent 
        className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-2 border-primary/50 p-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent animate-pulse" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-glow-pulse" />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Portrait */}
            {portraitUrl && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-primary/50 shadow-lg shadow-primary/30">
                <img 
                  src={portraitUrl} 
                  alt={characterName} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-primary">
                {isChapterReward ? 'Chapter Complete' : 'You Have Changed'}
              </h2>
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>

            <p className="text-lg text-muted-foreground mb-2">
              {characterName} has grown through experience
            </p>

            <div className="flex items-center justify-center gap-3">
              <span className="text-muted-foreground">Level</span>
              <span className="text-2xl font-bold text-primary">{currentLevel}</span>
              <ArrowUp className="w-5 h-5 text-success animate-bounce" />
              <span className="text-2xl font-bold text-success">{newLevel}</span>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              {isChapterReward 
                ? 'This milestone grants exceptional growth. Choose wisely—this decision shapes your future.'
                : 'Your journey has earned you new strength. Select the path of your growth.'}
            </p>
          </motion.div>

          {/* Choices Grid */}
          <AnimatePresence mode="wait">
            {!isConfirming ? (
              <motion.div 
                key="choices"
                className={`grid gap-4 ${isChapterReward ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {choices.map((choice, index) => {
                  const statChanges = formatStatChanges(choice.statChanges);
                  
                  return (
                    <motion.div
                      key={choice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <Card 
                        className="p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20 bg-card/50 backdrop-blur group"
                        onClick={() => handleChoiceClick(choice)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                            <Star className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                              {choice.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {choice.description}
                            </p>
                            
                            {/* Stat changes */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {statChanges.map(({ stat, value }) => (
                                <span 
                                  key={stat}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-current/10 ${STAT_COLORS[stat]}`}
                                >
                                  {STAT_ICONS[stat]}
                                  +{value} {stat.charAt(0).toUpperCase() + stat.slice(1, 3).toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                className="max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 bg-card/80 backdrop-blur border-primary/50">
                  <div className="text-center">
                    <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{selectedChoice?.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {selectedChoice?.narrativeFlavor}
                    </p>
                    
                    {/* Show stat changes */}
                    <div className="flex justify-center gap-3 mb-6">
                      {selectedChoice && formatStatChanges(selectedChoice.statChanges).map(({ stat, value }) => (
                        <div 
                          key={stat}
                          className={`flex flex-col items-center p-3 rounded-lg bg-current/10 ${STAT_COLORS[stat]}`}
                        >
                          {STAT_ICONS[stat]}
                          <span className="text-lg font-bold mt-1">+{value}</span>
                          <span className="text-xs uppercase">{stat.slice(0, 3)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleCancel}
                      >
                        Go Back
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={handleConfirm}
                      >
                        Confirm Growth
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer hint */}
          {!isConfirming && (
            <motion.p 
              className="text-center text-xs text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 0.7 : 0 }}
              transition={{ delay: 0.8 }}
            >
              {isChapterReward 
                ? `Select one path to gain +${totalStatGain} total stat points`
                : 'Select one path to gain +1 to a stat'}
            </motion.p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
