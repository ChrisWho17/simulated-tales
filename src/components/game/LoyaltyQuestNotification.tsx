import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sword, Shield, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoyaltyQuest, getLoyaltyQuestTierName, getLoyaltyQuestTierDescription } from '@/game/companionLoyaltyQuestSystem';
import { CompanionState } from '@/game/companionSystem';

interface LoyaltyQuestNotificationProps {
  quest: LoyaltyQuest;
  companion: CompanionState;
  onAccept: () => void;
  onDefer: () => void;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'tier1': return Heart;
    case 'tier2': return Shield;
    case 'tier3': return Sword;
    case 'final': return Star;
    default: return Heart;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'tier1': return 'from-blue-500/20 to-blue-600/30 border-blue-500/50';
    case 'tier2': return 'from-purple-500/20 to-purple-600/30 border-purple-500/50';
    case 'tier3': return 'from-orange-500/20 to-orange-600/30 border-orange-500/50';
    case 'final': return 'from-yellow-500/20 to-yellow-600/30 border-yellow-500/50';
    default: return 'from-muted/20 to-muted/30 border-border';
  }
};

const getTierGlow = (tier: string) => {
  switch (tier) {
    case 'tier1': return 'shadow-blue-500/20';
    case 'tier2': return 'shadow-purple-500/20';
    case 'tier3': return 'shadow-orange-500/20';
    case 'final': return 'shadow-yellow-500/30';
    default: return '';
  }
};

export const LoyaltyQuestNotification: React.FC<LoyaltyQuestNotificationProps> = ({
  quest,
  companion,
  onAccept,
  onDefer
}) => {
  const TierIcon = getTierIcon(quest.tier);
  const tierColor = getTierColor(quest.tier);
  const tierGlow = getTierGlow(quest.tier);
  const tierName = getLoyaltyQuestTierName(quest.tier);
  const tierDescription = getLoyaltyQuestTierDescription(quest.tier);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative w-full max-w-lg bg-gradient-to-br ${tierColor} border rounded-lg shadow-2xl ${tierGlow} overflow-hidden`}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          </div>

          {/* Close button */}
          <button
            onClick={onDefer}
            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="p-3 rounded-full bg-background/50"
              >
                <TierIcon className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Loyalty Quest Unlocked
                </p>
                <h3 className="text-xl font-bold text-foreground">
                  {tierName}
                </h3>
              </div>
            </div>

            {/* Companion info */}
            <div className="p-3 bg-background/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{companion.name}</span> is ready to share something important with you.
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                {tierDescription}
              </p>
            </div>

            {/* Quest details */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground">
                {quest.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {quest.description}
              </p>
            </div>

            {/* First dialogue prompt */}
            {quest.dialoguePrompts[0] && (
              <div className="p-3 bg-background/20 rounded-lg border-l-2 border-primary/50">
                <p className="text-sm italic text-foreground/90">
                  "{quest.dialoguePrompts[0]}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  — {companion.name}
                </p>
              </div>
            )}

            {/* Requirements display */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-background/30 rounded">
                Trust: {quest.trigger.trustRequired}+
              </span>
              <span className="px-2 py-1 bg-background/30 rounded">
                Affinity: {quest.trigger.affinityRequired}+
              </span>
              {quest.trigger.respectRequired && (
                <span className="px-2 py-1 bg-background/30 rounded">
                  Respect: {quest.trigger.respectRequired}+
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onAccept}
                className="flex-1"
                variant="default"
              >
                <Heart className="w-4 h-4 mr-2" />
                Begin Quest
              </Button>
              <Button
                onClick={onDefer}
                variant="outline"
                className="flex-1"
              >
                Not Now
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
