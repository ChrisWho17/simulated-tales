import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Sword, Star, Check, Lock, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  LoyaltyQuest, 
  LoyaltyQuestTier,
  getLoyaltyQuestTierName,
  LOYALTY_TIER_THRESHOLDS 
} from '@/game/companionLoyaltyQuestSystem';
import { CompanionState } from '@/game/companionSystem';

interface LoyaltyQuestProgressProps {
  companion: CompanionState;
  quests: LoyaltyQuest[];
  onQuestClick?: (quest: LoyaltyQuest) => void;
}

const tierIcons: Record<LoyaltyQuestTier, React.ElementType> = {
  tier1: Heart,
  tier2: Shield,
  tier3: Sword,
  final: Star
};

const tierColors: Record<LoyaltyQuestTier, string> = {
  tier1: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
  tier2: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
  tier3: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
  final: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40'
};

export const LoyaltyQuestProgress: React.FC<LoyaltyQuestProgressProps> = ({
  companion,
  quests,
  onQuestClick
}) => {
  const tiers: LoyaltyQuestTier[] = ['tier1', 'tier2', 'tier3', 'final'];
  
  const getQuestForTier = (tier: LoyaltyQuestTier): LoyaltyQuest | undefined => {
    return quests.find(q => q.tier === tier);
  };

  const getTierProgress = (tier: LoyaltyQuestTier): number => {
    const thresholds = LOYALTY_TIER_THRESHOLDS[tier];
    const trustProgress = Math.min(100, (companion.trust / thresholds.trustRequired) * 100);
    const affinityProgress = Math.min(100, (companion.affinity / thresholds.affinityRequired) * 100);
    const respectProgress = thresholds.respectRequired 
      ? Math.min(100, (companion.respect / thresholds.respectRequired) * 100)
      : 100;
    
    return Math.floor((trustProgress + affinityProgress + respectProgress) / 3);
  };

  const canUnlock = (tier: LoyaltyQuestTier, quest?: LoyaltyQuest): boolean => {
    if (!quest) return false;
    const thresholds = LOYALTY_TIER_THRESHOLDS[tier];
    
    if (companion.trust < thresholds.trustRequired) return false;
    if (companion.affinity < thresholds.affinityRequired) return false;
    if (thresholds.respectRequired && companion.respect < thresholds.respectRequired) return false;
    
    // Check prerequisite
    if (quest.trigger.prerequisiteQuestId) {
      const prereq = quests.find(q => q.id.endsWith(quest.trigger.prerequisiteQuestId!));
      if (!prereq || prereq.status !== 'completed') return false;
    }
    
    return true;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        Loyalty Journey
      </h4>

      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const quest = getQuestForTier(tier);
          const Icon = tierIcons[tier];
          const colorClass = tierColors[tier];
          const progress = getTierProgress(tier);
          const isCompleted = quest?.status === 'completed';
          const isActive = quest?.status === 'active';
          const isAvailable = quest?.status === 'available' && canUnlock(tier, quest);
          const isLocked = !isCompleted && !isActive && !isAvailable;

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-3 rounded-lg border transition-all
                ${isCompleted ? 'bg-primary/10 border-primary/30' : ''}
                ${isActive ? `${colorClass} animate-pulse` : ''}
                ${isAvailable ? `${colorClass} cursor-pointer hover:scale-[1.02]` : ''}
                ${isLocked ? 'bg-muted/30 border-border opacity-60' : ''}
              `}
              onClick={() => {
                if ((isAvailable || isActive) && quest && onQuestClick) {
                  onQuestClick(quest);
                }
              }}
            >
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div className={`
                  p-2 rounded-full
                  ${isCompleted ? 'bg-primary/20' : ''}
                  ${isActive ? 'bg-background/50' : ''}
                  ${isAvailable ? 'bg-background/50' : ''}
                  ${isLocked ? 'bg-background/30' : ''}
                `}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Quest info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium truncate ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {getLoyaltyQuestTierName(tier)}
                    </p>
                    {(isAvailable || isActive) && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {quest && !isLocked && (
                    <p className="text-xs text-muted-foreground truncate">
                      {quest.title}
                    </p>
                  )}

                  {isLocked && (
                    <div className="mt-1">
                      <Progress value={progress} className="h-1" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {progress}% to unlock
                      </p>
                    </div>
                  )}

                  {isCompleted && quest?.chosenOutcomeId && (
                    <p className="text-xs text-primary/80 mt-0.5">
                      ✓ Completed
                    </p>
                  )}

                  {isActive && (
                    <p className="text-xs text-primary mt-0.5">
                      In Progress
                    </p>
                  )}
                </div>
              </div>

              {/* Connection line to next tier */}
              {index < tiers.length - 1 && (
                <div className={`
                  absolute -bottom-2 left-6 w-0.5 h-4
                  ${isCompleted ? 'bg-primary/50' : 'bg-border'}
                `} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trust/Affinity requirements hint */}
      <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
        Build trust and affinity through shared adventures and meaningful choices to unlock deeper bonds.
      </div>
    </div>
  );
};
