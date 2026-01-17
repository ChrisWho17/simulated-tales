import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Brain, X } from 'lucide-react';
import { CompanionState, companionSystem } from '@/game/companionSystem';
import { 
  RelationshipEvent, 
  DialogueChoice,
  relationshipEventManager 
} from '@/game/companionRelationshipEvents';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RelationshipEventModalProps {
  companion: CompanionState;
  event: RelationshipEvent;
  isOpen: boolean;
  onClose: () => void;
  onChoiceMade?: (choice: DialogueChoice, response: string) => void;
}

const emotionColors: Record<string, string> = {
  supportive: 'hover:border-green-400/50 hover:bg-green-500/10',
  neutral: 'hover:border-gray-400/50 hover:bg-gray-500/10',
  dismissive: 'hover:border-orange-400/50 hover:bg-orange-500/10',
  romantic: 'hover:border-pink-400/50 hover:bg-pink-500/10',
  harsh: 'hover:border-red-400/50 hover:bg-red-500/10',
  humorous: 'hover:border-yellow-400/50 hover:bg-yellow-500/10',
};

const toneIcons: Record<string, string> = {
  supportive: '💚',
  neutral: '⚪',
  dismissive: '🔶',
  romantic: '💕',
  harsh: '🔴',
  humorous: '😄',
};

export function RelationshipEventModal({
  companion,
  event,
  isOpen,
  onClose,
  onChoiceMade,
}: RelationshipEventModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<DialogueChoice | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleChoiceSelect = (choice: DialogueChoice) => {
    setSelectedChoice(choice);
    setShowResponse(true);

    // Apply effects to companion
    if (choice.effects.affinity) {
      companionSystem.adjustAffinity(companion.id, choice.effects.affinity);
    }
    if (choice.effects.trust) {
      companionSystem.adjustTrust(companion.id, choice.effects.trust);
    }
    if (choice.effects.respect) {
      companionSystem.adjustRespect(companion.id, choice.effects.respect);
    }
    if (choice.effects.fear) {
      companionSystem.adjustFear(companion.id, choice.effects.fear);
    }
    if (choice.effects.romanticInterest) {
      companionSystem.adjustRomance(companion.id, choice.effects.romanticInterest);
    }
    if (choice.effects.moodChange) {
      companionSystem.setMood(companion.id, choice.effects.moodChange);
    }

    // Register event with manager
    relationshipEventManager.applyChoice(companion.id, event.id, choice);

    // Delay showing complete state
    setTimeout(() => {
      setIsComplete(true);
    }, 2000);
  };

  const handleComplete = () => {
    if (selectedChoice) {
      onChoiceMade?.(selectedChoice, selectedChoice.companionResponse);
    }
    onClose();
    // Reset state
    setSelectedChoice(null);
    setShowResponse(false);
    setIsComplete(false);
  };

  // Check which choices are available
  const getAvailableChoices = () => {
    return event.choices.filter(choice => {
      const req = choice.requirements;
      if (!req) return true;
      
      if (req.minAffinity && companion.affinity < req.minAffinity) return false;
      if (req.minTrust && companion.trust < req.minTrust) return false;
      if (req.minRomance && companion.romanticInterest < req.minRomance) return false;
      
      return true;
    });
  };

  if (!isOpen) return null;

  const availableChoices = getAvailableChoices();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="bg-card border border-border rounded-lg w-full max-w-xl mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-lg font-bold">
                {companion.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">{event.name}</h2>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {event.type.replace('_', ' ')} moment
                </p>
              </div>
            </div>
            {isComplete && (
              <Button variant="ghost" size="icon" onClick={handleComplete}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Setup Narrative */}
            <div className="text-sm text-muted-foreground italic">
              {event.setup}
            </div>

            {/* Companion Dialogue */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-primary">{companion.name}:</span>
                  <p className="mt-1">{event.companionDialogue}</p>
                </div>
              </div>
            </div>

            {/* Player Choices or Response */}
            <AnimatePresence mode="wait">
              {!showResponse ? (
                <motion.div
                  key="choices"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground">Choose your response:</p>
                  {availableChoices.map((choice) => (
                    <motion.button
                      key={choice.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleChoiceSelect(choice)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border border-border/50 transition-all",
                        "bg-card/50",
                        emotionColors[choice.emotionalTone]
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{toneIcons[choice.emotionalTone]}</span>
                        <span className="text-sm">{choice.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Your choice */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm italic">You: {selectedChoice?.text}</p>
                  </div>

                  {/* Companion response */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <p className="text-sm">{selectedChoice?.companionResponse}</p>
                    </div>
                  </motion.div>

                  {/* Internal thought (if high trust) */}
                  {companion.trust > 40 && selectedChoice && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
                    >
                      <div className="flex items-start gap-2 text-xs text-purple-300">
                        <Brain className="w-3 h-3 mt-0.5" />
                        <span className="italic">{selectedChoice.internalThought}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Effect indicators */}
                  {selectedChoice && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="flex flex-wrap gap-2 text-xs"
                    >
                      {selectedChoice.effects.affinity && (
                        <span className={selectedChoice.effects.affinity > 0 ? "text-green-400" : "text-red-400"}>
                          {selectedChoice.effects.affinity > 0 ? '+' : ''}{selectedChoice.effects.affinity} Affinity
                        </span>
                      )}
                      {selectedChoice.effects.trust && (
                        <span className={selectedChoice.effects.trust > 0 ? "text-blue-400" : "text-orange-400"}>
                          {selectedChoice.effects.trust > 0 ? '+' : ''}{selectedChoice.effects.trust} Trust
                        </span>
                      )}
                      {selectedChoice.effects.respect && (
                        <span className={selectedChoice.effects.respect > 0 ? "text-amber-400" : "text-red-400"}>
                          {selectedChoice.effects.respect > 0 ? '+' : ''}{selectedChoice.effects.respect} Respect
                        </span>
                      )}
                      {selectedChoice.effects.romanticInterest && (
                        <span className={selectedChoice.effects.romanticInterest > 0 ? "text-pink-400" : "text-gray-400"}>
                          {selectedChoice.effects.romanticInterest > 0 ? '+' : ''}{selectedChoice.effects.romanticInterest} Romance
                        </span>
                      )}
                      {selectedChoice.effects.fear && (
                        <span className="text-purple-400">
                          +{selectedChoice.effects.fear} Fear
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Continue button */}
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-2"
                    >
                      <Button onClick={handleComplete} className="w-full">
                        Continue
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
