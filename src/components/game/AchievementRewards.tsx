// Achievement Rewards System - handles XP bonuses, special items, and cosmetic unlocks
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Sparkles, Star, Crown, Zap, Shield, Sword, 
  Palette, X, Check, PartyPopper, Gem, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Achievement } from './Achievements';
import { playerStateManager } from '@/game/playerStateManager';

// Reward types
export type RewardType = 'xp' | 'item' | 'cosmetic' | 'title' | 'badge_frame' | 'currency';

export interface AchievementReward {
  type: RewardType;
  id: string;
  name: string;
  description: string;
  icon: string;
  value?: number; // For XP/currency amounts
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Define rewards for each achievement
export const ACHIEVEMENT_REWARDS: Record<string, AchievementReward[]> = {
  // Exploration rewards
  first_steps: [
    { type: 'xp', id: 'xp_first_steps', name: 'Explorer\'s Bonus', description: '+50 XP', icon: '✨', value: 50, rarity: 'common' },
  ],
  wanderer: [
    { type: 'xp', id: 'xp_wanderer', name: 'Wanderer\'s Bonus', description: '+100 XP', icon: '✨', value: 100, rarity: 'uncommon' },
    { type: 'cosmetic', id: 'frame_wanderer', name: 'Wanderer\'s Frame', description: 'A simple bronze portrait frame', icon: '🖼️', rarity: 'uncommon' },
  ],
  explorer: [
    { type: 'xp', id: 'xp_explorer', name: 'Explorer\'s Bonus', description: '+250 XP', icon: '✨', value: 250, rarity: 'rare' },
    { type: 'title', id: 'title_explorer', name: 'The Explorer', description: 'Display title for your character', icon: '📜', rarity: 'rare' },
  ],
  cartographer: [
    { type: 'xp', id: 'xp_cartographer', name: 'Cartographer\'s Bonus', description: '+500 XP', icon: '✨', value: 500, rarity: 'epic' },
    { type: 'item', id: 'item_compass', name: 'Enchanted Compass', description: 'A magical compass that never loses its way', icon: '🧭', rarity: 'epic' },
    { type: 'badge_frame', id: 'frame_gold', name: 'Golden Frame', description: 'A prestigious golden portrait frame', icon: '👑', rarity: 'epic' },
  ],
  
  // Combat rewards
  first_blood: [
    { type: 'xp', id: 'xp_first_blood', name: 'Warrior\'s Bonus', description: '+50 XP', icon: '✨', value: 50, rarity: 'common' },
  ],
  survivor: [
    { type: 'xp', id: 'xp_survivor', name: 'Survivor\'s Bonus', description: '+100 XP', icon: '✨', value: 100, rarity: 'uncommon' },
    { type: 'item', id: 'item_bandage', name: 'Battle Bandages', description: 'A set of sturdy bandages', icon: '🩹', rarity: 'uncommon' },
  ],
  warrior: [
    { type: 'xp', id: 'xp_warrior', name: 'Warrior\'s Bonus', description: '+250 XP', icon: '✨', value: 250, rarity: 'rare' },
    { type: 'title', id: 'title_warrior', name: 'The Warrior', description: 'Display title for your character', icon: '📜', rarity: 'rare' },
    { type: 'cosmetic', id: 'frame_battle', name: 'Battle-Scarred Frame', description: 'A worn frame with battle marks', icon: '🖼️', rarity: 'rare' },
  ],
  champion: [
    { type: 'xp', id: 'xp_champion', name: 'Champion\'s Bonus', description: '+500 XP', icon: '✨', value: 500, rarity: 'epic' },
    { type: 'item', id: 'item_champion_medal', name: 'Champion\'s Medal', description: 'A prestigious medal of valor', icon: '🏅', rarity: 'epic' },
    { type: 'title', id: 'title_champion', name: 'The Undefeated', description: 'A title for the truly skilled', icon: '📜', rarity: 'epic' },
  ],
  pacifist: [
    { type: 'xp', id: 'xp_pacifist', name: 'Diplomat\'s Bonus', description: '+200 XP', icon: '✨', value: 200, rarity: 'rare' },
    { type: 'title', id: 'title_pacifist', name: 'The Peacekeeper', description: 'A title for those who avoid conflict', icon: '📜', rarity: 'rare' },
  ],
  
  // Social rewards
  hello_stranger: [
    { type: 'xp', id: 'xp_hello', name: 'Social Bonus', description: '+50 XP', icon: '✨', value: 50, rarity: 'common' },
  ],
  socialite: [
    { type: 'xp', id: 'xp_socialite', name: 'Socialite\'s Bonus', description: '+100 XP', icon: '✨', value: 100, rarity: 'uncommon' },
    { type: 'cosmetic', id: 'charm_social', name: 'Charming Aura', description: 'A subtle glow effect for your portrait', icon: '💫', rarity: 'uncommon' },
  ],
  networker: [
    { type: 'xp', id: 'xp_networker', name: 'Networker\'s Bonus', description: '+250 XP', icon: '✨', value: 250, rarity: 'rare' },
    { type: 'title', id: 'title_networker', name: 'The Connected', description: 'Display title for your character', icon: '📜', rarity: 'rare' },
  ],
  silver_tongue: [
    { type: 'xp', id: 'xp_silver', name: 'Persuader\'s Bonus', description: '+300 XP', icon: '✨', value: 300, rarity: 'rare' },
    { type: 'item', id: 'item_silver_tongue', name: 'Silver Tongue Ring', description: '+1 to persuasion checks', icon: '💍', rarity: 'rare' },
  ],
  trusted_ally: [
    { type: 'xp', id: 'xp_trusted', name: 'Ally\'s Bonus', description: '+500 XP', icon: '✨', value: 500, rarity: 'epic' },
    { type: 'badge_frame', id: 'frame_trusted', name: 'Trusted Frame', description: 'A warm, welcoming portrait frame', icon: '💖', rarity: 'epic' },
  ],
  
  // Merchant rewards
  first_sale: [
    { type: 'xp', id: 'xp_first_sale', name: 'Merchant\'s Bonus', description: '+50 XP', icon: '✨', value: 50, rarity: 'common' },
    { type: 'currency', id: 'gold_first_sale', name: 'Starter Gold', description: '+100 Gold', icon: '💰', value: 100, rarity: 'common' },
  ],
  haggler: [
    { type: 'xp', id: 'xp_haggler', name: 'Haggler\'s Bonus', description: '+100 XP', icon: '✨', value: 100, rarity: 'uncommon' },
    { type: 'currency', id: 'gold_haggler', name: 'Trade Bonus', description: '+250 Gold', icon: '💰', value: 250, rarity: 'uncommon' },
  ],
  shrewd_trader: [
    { type: 'xp', id: 'xp_shrewd', name: 'Trader\'s Bonus', description: '+250 XP', icon: '✨', value: 250, rarity: 'rare' },
    { type: 'title', id: 'title_trader', name: 'The Merchant', description: 'A title for savvy traders', icon: '📜', rarity: 'rare' },
    { type: 'item', id: 'item_merchant_ledger', name: 'Merchant\'s Ledger', description: 'Keep track of all your deals', icon: '📒', rarity: 'rare' },
  ],
  merchant_prince: [
    { type: 'xp', id: 'xp_prince', name: 'Prince\'s Bonus', description: '+1000 XP', icon: '✨', value: 1000, rarity: 'epic' },
    { type: 'currency', id: 'gold_prince', name: 'Royal Treasury', description: '+5000 Gold', icon: '💰', value: 5000, rarity: 'epic' },
    { type: 'badge_frame', id: 'frame_merchant', name: 'Gilded Frame', description: 'A luxurious gold-plated frame', icon: '👑', rarity: 'epic' },
    { type: 'title', id: 'title_prince', name: 'Merchant Prince', description: 'The ultimate trading title', icon: '📜', rarity: 'epic' },
  ],
  
  // Collector rewards
  magpie: [
    { type: 'xp', id: 'xp_magpie', name: 'Collector\'s Bonus', description: '+50 XP', icon: '✨', value: 50, rarity: 'common' },
  ],
  treasure_hunter: [
    { type: 'xp', id: 'xp_treasure', name: 'Hunter\'s Bonus', description: '+300 XP', icon: '✨', value: 300, rarity: 'rare' },
    { type: 'item', id: 'item_treasure_map', name: 'Treasure Map', description: 'Reveals hidden treasures nearby', icon: '🗺️', rarity: 'rare' },
    { type: 'title', id: 'title_hunter', name: 'Treasure Hunter', description: 'A title for dedicated collectors', icon: '📜', rarity: 'rare' },
  ],
  legendary_finder: [
    { type: 'xp', id: 'xp_legendary', name: 'Legendary Bonus', description: '+2000 XP', icon: '✨', value: 2000, rarity: 'legendary' },
    { type: 'badge_frame', id: 'frame_legendary', name: 'Legendary Frame', description: 'A mythical, glowing portrait frame', icon: '⭐', rarity: 'legendary' },
    { type: 'title', id: 'title_legendary', name: 'Relic Hunter', description: 'The pinnacle of collectors', icon: '📜', rarity: 'legendary' },
    { type: 'cosmetic', id: 'aura_legendary', name: 'Legendary Aura', description: 'A shimmering golden aura effect', icon: '✨', rarity: 'legendary' },
  ],
  
  // Diplomat rewards
  ambassador: [
    { type: 'xp', id: 'xp_ambassador', name: 'Ambassador\'s Bonus', description: '+50 XP', icon: '✨', value: 50, rarity: 'common' },
  ],
  peacekeeper: [
    { type: 'xp', id: 'xp_peace', name: 'Peace Bonus', description: '+150 XP', icon: '✨', value: 150, rarity: 'uncommon' },
    { type: 'title', id: 'title_peace', name: 'Peacemaker', description: 'A title for those who seek harmony', icon: '📜', rarity: 'uncommon' },
  ],
  grand_alliance: [
    { type: 'xp', id: 'xp_alliance', name: 'Alliance Bonus', description: '+500 XP', icon: '✨', value: 500, rarity: 'epic' },
    { type: 'badge_frame', id: 'frame_alliance', name: 'Alliance Frame', description: 'A frame adorned with faction symbols', icon: '🏰', rarity: 'epic' },
    { type: 'title', id: 'title_alliance', name: 'Grand Diplomat', description: 'The master of alliances', icon: '📜', rarity: 'epic' },
  ],
  world_peace: [
    { type: 'xp', id: 'xp_world', name: 'World Peace Bonus', description: '+3000 XP', icon: '✨', value: 3000, rarity: 'legendary' },
    { type: 'badge_frame', id: 'frame_peace', name: 'Dove\'s Frame', description: 'A serene, peaceful portrait frame', icon: '🕊️', rarity: 'legendary' },
    { type: 'title', id: 'title_world', name: 'Bringer of Peace', description: 'The ultimate diplomatic achievement', icon: '📜', rarity: 'legendary' },
    { type: 'cosmetic', id: 'aura_peace', name: 'Peaceful Aura', description: 'A calming blue glow effect', icon: '💙', rarity: 'legendary' },
  ],
  
  // Secret/Meta rewards
  marathon: [
    { type: 'xp', id: 'xp_marathon', name: 'Dedication Bonus', description: '+1500 XP', icon: '✨', value: 1500, rarity: 'legendary' },
    { type: 'badge_frame', id: 'frame_marathon', name: 'Endurance Frame', description: 'A frame showing true dedication', icon: '🏃', rarity: 'legendary' },
    { type: 'title', id: 'title_marathon', name: 'The Dedicated', description: 'For those who never stop', icon: '📜', rarity: 'legendary' },
  ],
  perfectionist: [
    { type: 'xp', id: 'xp_perfect', name: 'Perfection Bonus', description: '+5000 XP', icon: '✨', value: 5000, rarity: 'legendary' },
    { type: 'badge_frame', id: 'frame_perfect', name: 'Masterwork Frame', description: 'The ultimate portrait frame', icon: '👑', rarity: 'legendary' },
    { type: 'title', id: 'title_perfect', name: 'The Completionist', description: 'You\'ve done everything', icon: '📜', rarity: 'legendary' },
    { type: 'cosmetic', id: 'aura_perfect', name: 'Radiant Aura', description: 'A brilliant rainbow aura', icon: '🌈', rarity: 'legendary' },
  ],
};

// Storage keys
const CLAIMED_REWARDS_KEY = 'untold-claimed-rewards';
const EQUIPPED_COSMETICS_KEY = 'untold-equipped-cosmetics';
const CAMPAIGN_REDEEMED_KEY = 'untold-campaign-redeemed-rewards';

// Get claimed rewards from storage (globally claimed)
export function getClaimedRewards(): Set<string> {
  try {
    const saved = localStorage.getItem(CLAIMED_REWARDS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

// Save claimed rewards
export function saveClaimedRewards(rewards: Set<string>) {
  localStorage.setItem(CLAIMED_REWARDS_KEY, JSON.stringify([...rewards]));
}

// Get per-campaign redeemed rewards
export function getCampaignRedeemedRewards(): Record<string, Set<string>> {
  try {
    const saved = localStorage.getItem(CAMPAIGN_REDEEMED_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    const result: Record<string, Set<string>> = {};
    for (const [campaignId, rewards] of Object.entries(parsed)) {
      result[campaignId] = new Set(rewards as string[]);
    }
    return result;
  } catch {
    return {};
  }
}

// Save per-campaign redeemed rewards
export function saveCampaignRedeemedRewards(rewards: Record<string, Set<string>>) {
  const serializable: Record<string, string[]> = {};
  for (const [campaignId, rewardSet] of Object.entries(rewards)) {
    serializable[campaignId] = [...rewardSet];
  }
  localStorage.setItem(CAMPAIGN_REDEEMED_KEY, JSON.stringify(serializable));
}

// Get equipped cosmetics
export function getEquippedCosmetics(): Record<string, string> {
  try {
    const saved = localStorage.getItem(EQUIPPED_COSMETICS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Save equipped cosmetics
export function saveEquippedCosmetics(cosmetics: Record<string, string>) {
  localStorage.setItem(EQUIPPED_COSMETICS_KEY, JSON.stringify(cosmetics));
}

// Reward claiming modal with campaign redemption
interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement;
  rewards: AchievementReward[];
  onClaim: (rewards: AchievementReward[]) => void;
  campaignId?: string; // Current campaign for per-campaign redemption
  alreadyRedeemedInCampaign?: boolean;
}

export function RewardClaimModal({ 
  isOpen, 
  onClose, 
  achievement, 
  rewards, 
  onClaim,
  campaignId,
  alreadyRedeemedInCampaign = false
}: RewardClaimModalProps) {
  const [claimed, setClaimed] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [showRedeemOption, setShowRedeemOption] = useState(false);
  
  const handleClaim = () => {
    setClaimed(true);
    onClaim(rewards);
    
    // After claiming, show redeem option if in a campaign
    if (campaignId && !alreadyRedeemedInCampaign) {
      setShowRedeemOption(true);
    } else {
      setTimeout(onClose, 1500);
    }
  };
  
  const handleRedeem = () => {
    if (!campaignId) return;
    
    // Apply rewards to player state
    applyRewardsToPlayerState(rewards);
    setRedeemed(true);
    
    toast.success('Rewards applied to your character!', {
      description: 'XP, items, and currency have been added.',
    });
    
    setTimeout(onClose, 1500);
  };
  
  const rarityColors = {
    common: 'from-slate-400 to-slate-500',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 to-amber-600',
  };
  
  const rewardTypeIcons = {
    xp: Zap,
    item: Gift,
    cosmetic: Palette,
    title: Crown,
    badge_frame: Star,
    currency: Gem,
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Achievement Rewards
          </DialogTitle>
          {campaignId && !alreadyRedeemedInCampaign && (
            <DialogDescription className="text-xs">
              You can redeem these rewards once per campaign
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Already redeemed warning */}
          {alreadyRedeemedInCampaign && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Already redeemed in this campaign</span>
            </div>
          )}
          
          {/* Achievement info */}
          <div className={cn(
            "p-4 rounded-lg border-2 text-center",
            `bg-gradient-to-br ${rarityColors[achievement.rarity]} bg-opacity-20`
          )}>
            <span className="text-4xl block mb-2">{achievement.icon}</span>
            <h3 className="font-bold text-lg">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
          </div>
          
          {/* Rewards list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Rewards:</h4>
            {rewards.map((reward, index) => {
              const Icon = rewardTypeIcons[reward.type];
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    (claimed || redeemed) && "bg-green-500/10 border-green-500/30"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    `bg-gradient-to-br ${rarityColors[reward.rarity]}`
                  )}>
                    <span className="text-lg">{reward.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{reward.name}</span>
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </div>
                  {(claimed || redeemed) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Buttons */}
          {!claimed && !showRedeemOption ? (
            <Button 
              onClick={handleClaim} 
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              <PartyPopper className="w-4 h-4" />
              Claim Rewards
            </Button>
          ) : showRedeemOption && !redeemed ? (
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-green-500 mb-2"
              >
                <Check className="w-5 h-5 inline mr-1" />
                Rewards claimed!
              </motion.div>
              <Button 
                onClick={handleRedeem}
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Zap className="w-4 h-4" />
                Redeem for Current Campaign
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Save for Later
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-green-500 font-medium">
                {redeemed ? 'Rewards Applied to Character!' : 'Rewards Claimed!'}
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Apply rewards directly to player state
export function applyRewardsToPlayerState(rewards: AchievementReward[]): void {
  for (const reward of rewards) {
    switch (reward.type) {
      case 'xp':
        if (reward.value) {
          playerStateManager.addXP(reward.value, `Achievement: ${reward.name}`);
          console.log(`[AchievementRewards] Applied ${reward.value} XP`);
        }
        break;
      case 'currency':
        if (reward.value) {
          playerStateManager.addCurrency(reward.value, `Achievement: ${reward.name}`);
          console.log(`[AchievementRewards] Applied ${reward.value} currency`);
        }
        break;
      case 'item':
        playerStateManager.addItem({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          category: 'reward',
          value: reward.value || 50,
          stackable: false,
        });
        console.log(`[AchievementRewards] Added item: ${reward.name}`);
        break;
      // Cosmetics and titles are stored separately, not in player state
      default:
        break;
    }
  }
}

// Hook for managing achievement rewards with per-campaign tracking
export function useAchievementRewards(campaignId?: string) {
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(() => getClaimedRewards());
  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string>>(() => getEquippedCosmetics());
  const [campaignRedeemed, setCampaignRedeemed] = useState<Record<string, Set<string>>>(() => getCampaignRedeemedRewards());
  
  const claimReward = useCallback((rewardId: string) => {
    setClaimedRewards(prev => {
      const newSet = new Set(prev);
      newSet.add(rewardId);
      saveClaimedRewards(newSet);
      return newSet;
    });
  }, []);
  
  // Redeem rewards for a specific campaign (applies to player state)
  const redeemForCampaign = useCallback((achievementId: string, rewards: AchievementReward[], targetCampaignId?: string) => {
    const cid = targetCampaignId || campaignId;
    if (!cid) {
      console.warn('[AchievementRewards] No campaign ID provided for redemption');
      return false;
    }
    
    // Check if already redeemed
    if (campaignRedeemed[cid]?.has(achievementId)) {
      console.log(`[AchievementRewards] Already redeemed ${achievementId} in campaign ${cid}`);
      return false;
    }
    
    // Apply rewards to player state
    applyRewardsToPlayerState(rewards);
    
    // Mark as redeemed for this campaign
    setCampaignRedeemed(prev => {
      const newRedeemed = { ...prev };
      if (!newRedeemed[cid]) {
        newRedeemed[cid] = new Set();
      }
      newRedeemed[cid] = new Set([...newRedeemed[cid], achievementId]);
      saveCampaignRedeemedRewards(newRedeemed);
      return newRedeemed;
    });
    
    toast.success('Rewards applied!', {
      description: 'XP, items, and currency have been added to your character.',
    });
    
    return true;
  }, [campaignId, campaignRedeemed]);
  
  // Check if achievement was redeemed in current campaign
  const isRedeemedInCampaign = useCallback((achievementId: string, targetCampaignId?: string) => {
    const cid = targetCampaignId || campaignId;
    if (!cid) return false;
    return campaignRedeemed[cid]?.has(achievementId) || false;
  }, [campaignId, campaignRedeemed]);
  
  const equipCosmetic = useCallback((slot: string, cosmeticId: string) => {
    setEquippedCosmetics(prev => {
      const newEquipped = { ...prev, [slot]: cosmeticId };
      saveEquippedCosmetics(newEquipped);
      return newEquipped;
    });
  }, []);
  
  const unequipCosmetic = useCallback((slot: string) => {
    setEquippedCosmetics(prev => {
      const newEquipped = { ...prev };
      delete newEquipped[slot];
      saveEquippedCosmetics(newEquipped);
      return newEquipped;
    });
  }, []);
  
  const getUnclaimedRewards = useCallback((achievementId: string) => {
    const rewards = ACHIEVEMENT_REWARDS[achievementId] || [];
    return rewards.filter(r => !claimedRewards.has(r.id));
  }, [claimedRewards]);
  
  const getRewardsForAchievement = useCallback((achievementId: string) => {
    return ACHIEVEMENT_REWARDS[achievementId] || [];
  }, []);
  
  const getAllClaimedRewards = useCallback(() => {
    const all: AchievementReward[] = [];
    for (const [, rewards] of Object.entries(ACHIEVEMENT_REWARDS)) {
      for (const reward of rewards) {
        if (claimedRewards.has(reward.id)) {
          all.push(reward);
        }
      }
    }
    return all;
  }, [claimedRewards]);
  
  const getClaimedByType = useCallback((type: RewardType) => {
    return getAllClaimedRewards().filter(r => r.type === type);
  }, [getAllClaimedRewards]);
  
  // Get list of achievements with unclaimed rewards
  const getAchievementsWithRewards = useCallback((unlockedAchievementIds: string[]) => {
    return unlockedAchievementIds.filter(id => {
      const rewards = ACHIEVEMENT_REWARDS[id];
      return rewards && rewards.length > 0;
    });
  }, []);
  
  // Get count of unredeemed rewards for current campaign
  const getUnredeemedCount = useCallback((unlockedAchievementIds: string[]) => {
    if (!campaignId) return 0;
    return unlockedAchievementIds.filter(id => {
      const rewards = ACHIEVEMENT_REWARDS[id];
      return rewards && rewards.length > 0 && !isRedeemedInCampaign(id);
    }).length;
  }, [campaignId, isRedeemedInCampaign]);
  
  return {
    claimedRewards,
    equippedCosmetics,
    campaignRedeemed,
    claimReward,
    redeemForCampaign,
    isRedeemedInCampaign,
    equipCosmetic,
    unequipCosmetic,
    getUnclaimedRewards,
    getRewardsForAchievement,
    getAllClaimedRewards,
    getClaimedByType,
    getAchievementsWithRewards,
    getUnredeemedCount,
  };
}

export { ACHIEVEMENT_REWARDS as default };
