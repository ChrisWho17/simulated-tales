// ============================================================================
// ACHIEVEMENT STAT PERKS SYSTEM
// Optional stat bonuses from achievement rewards that can be toggled per campaign
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CharacterStats } from '@/types/rpgCharacter';
import { ACHIEVEMENT_REWARDS, AchievementReward, getCampaignRedeemedRewards } from './AchievementRewards';
import { useAchievements } from './Achievements';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trophy, Zap, Shield, Sword, Brain, Heart, Wind, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Storage key for perk toggle state per campaign
const PERKS_ENABLED_KEY = 'untold-achievement-perks-enabled';

// Stat perk definitions based on achievement categories
export interface StatPerk {
  achievementId: string;
  stat: keyof CharacterStats;
  bonus: number;
  source: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Define stat bonuses for achievement categories
const ACHIEVEMENT_STAT_PERKS: Record<string, StatPerk[]> = {
  // Exploration achievements → Wisdom & Dexterity
  first_steps: [{ achievementId: 'first_steps', stat: 'wisdom', bonus: 1, source: 'First Steps', rarity: 'common' }],
  wanderer: [{ achievementId: 'wanderer', stat: 'dexterity', bonus: 1, source: 'Wanderer', rarity: 'uncommon' }],
  explorer: [{ achievementId: 'explorer', stat: 'wisdom', bonus: 2, source: 'Explorer', rarity: 'rare' }],
  cartographer: [
    { achievementId: 'cartographer', stat: 'wisdom', bonus: 2, source: 'Cartographer', rarity: 'epic' },
    { achievementId: 'cartographer', stat: 'dexterity', bonus: 1, source: 'Cartographer', rarity: 'epic' },
  ],
  
  // Combat achievements → Strength & Constitution
  first_blood: [{ achievementId: 'first_blood', stat: 'strength', bonus: 1, source: 'First Blood', rarity: 'common' }],
  survivor: [{ achievementId: 'survivor', stat: 'constitution', bonus: 1, source: 'Survivor', rarity: 'uncommon' }],
  warrior: [{ achievementId: 'warrior', stat: 'strength', bonus: 2, source: 'Warrior', rarity: 'rare' }],
  champion: [
    { achievementId: 'champion', stat: 'strength', bonus: 2, source: 'Champion', rarity: 'epic' },
    { achievementId: 'champion', stat: 'constitution', bonus: 2, source: 'Champion', rarity: 'epic' },
  ],
  pacifist: [{ achievementId: 'pacifist', stat: 'wisdom', bonus: 2, source: 'Pacifist', rarity: 'rare' }],
  
  // Social achievements → Charisma & Intelligence
  hello_stranger: [{ achievementId: 'hello_stranger', stat: 'charisma', bonus: 1, source: 'Hello Stranger', rarity: 'common' }],
  socialite: [{ achievementId: 'socialite', stat: 'charisma', bonus: 1, source: 'Socialite', rarity: 'uncommon' }],
  networker: [{ achievementId: 'networker', stat: 'charisma', bonus: 2, source: 'Networker', rarity: 'rare' }],
  silver_tongue: [{ achievementId: 'silver_tongue', stat: 'charisma', bonus: 2, source: 'Silver Tongue', rarity: 'rare' }],
  trusted_ally: [
    { achievementId: 'trusted_ally', stat: 'charisma', bonus: 2, source: 'Trusted Ally', rarity: 'epic' },
    { achievementId: 'trusted_ally', stat: 'wisdom', bonus: 1, source: 'Trusted Ally', rarity: 'epic' },
  ],
  
  // Merchant achievements → Intelligence & Charisma
  first_sale: [{ achievementId: 'first_sale', stat: 'intelligence', bonus: 1, source: 'First Sale', rarity: 'common' }],
  haggler: [{ achievementId: 'haggler', stat: 'intelligence', bonus: 1, source: 'Haggler', rarity: 'uncommon' }],
  shrewd_trader: [{ achievementId: 'shrewd_trader', stat: 'intelligence', bonus: 2, source: 'Shrewd Trader', rarity: 'rare' }],
  merchant_prince: [
    { achievementId: 'merchant_prince', stat: 'intelligence', bonus: 2, source: 'Merchant Prince', rarity: 'epic' },
    { achievementId: 'merchant_prince', stat: 'charisma', bonus: 2, source: 'Merchant Prince', rarity: 'epic' },
  ],
  
  // Collector achievements → All-round bonuses
  magpie: [{ achievementId: 'magpie', stat: 'dexterity', bonus: 1, source: 'Magpie', rarity: 'common' }],
  treasure_hunter: [{ achievementId: 'treasure_hunter', stat: 'dexterity', bonus: 2, source: 'Treasure Hunter', rarity: 'rare' }],
  legendary_finder: [
    { achievementId: 'legendary_finder', stat: 'strength', bonus: 1, source: 'Legendary Finder', rarity: 'legendary' },
    { achievementId: 'legendary_finder', stat: 'dexterity', bonus: 1, source: 'Legendary Finder', rarity: 'legendary' },
    { achievementId: 'legendary_finder', stat: 'constitution', bonus: 1, source: 'Legendary Finder', rarity: 'legendary' },
    { achievementId: 'legendary_finder', stat: 'intelligence', bonus: 1, source: 'Legendary Finder', rarity: 'legendary' },
    { achievementId: 'legendary_finder', stat: 'wisdom', bonus: 1, source: 'Legendary Finder', rarity: 'legendary' },
    { achievementId: 'legendary_finder', stat: 'charisma', bonus: 1, source: 'Legendary Finder', rarity: 'legendary' },
  ],
  
  // Diplomat achievements → Charisma & Wisdom
  ambassador: [{ achievementId: 'ambassador', stat: 'charisma', bonus: 1, source: 'Ambassador', rarity: 'common' }],
  peacekeeper: [{ achievementId: 'peacekeeper', stat: 'wisdom', bonus: 1, source: 'Peacekeeper', rarity: 'uncommon' }],
  grand_alliance: [
    { achievementId: 'grand_alliance', stat: 'charisma', bonus: 2, source: 'Grand Alliance', rarity: 'epic' },
    { achievementId: 'grand_alliance', stat: 'wisdom', bonus: 1, source: 'Grand Alliance', rarity: 'epic' },
  ],
  world_peace: [
    { achievementId: 'world_peace', stat: 'charisma', bonus: 3, source: 'World Peace', rarity: 'legendary' },
    { achievementId: 'world_peace', stat: 'wisdom', bonus: 2, source: 'World Peace', rarity: 'legendary' },
  ],
  
  // Meta achievements → Constitution & All
  marathon: [
    { achievementId: 'marathon', stat: 'constitution', bonus: 2, source: 'Marathon', rarity: 'legendary' },
  ],
  perfectionist: [
    { achievementId: 'perfectionist', stat: 'strength', bonus: 2, source: 'Perfectionist', rarity: 'legendary' },
    { achievementId: 'perfectionist', stat: 'dexterity', bonus: 2, source: 'Perfectionist', rarity: 'legendary' },
    { achievementId: 'perfectionist', stat: 'constitution', bonus: 2, source: 'Perfectionist', rarity: 'legendary' },
    { achievementId: 'perfectionist', stat: 'intelligence', bonus: 2, source: 'Perfectionist', rarity: 'legendary' },
    { achievementId: 'perfectionist', stat: 'wisdom', bonus: 2, source: 'Perfectionist', rarity: 'legendary' },
    { achievementId: 'perfectionist', stat: 'charisma', bonus: 2, source: 'Perfectionist', rarity: 'legendary' },
  ],
  
  // Daily/Streak achievements
  daily_player: [{ achievementId: 'daily_player', stat: 'constitution', bonus: 1, source: 'Daily Player', rarity: 'uncommon' }],
  weekly_streak: [{ achievementId: 'weekly_streak', stat: 'constitution', bonus: 2, source: 'Weekly Streak', rarity: 'rare' }],
  monthly_dedication: [{ achievementId: 'monthly_dedication', stat: 'constitution', bonus: 3, source: 'Monthly Dedication', rarity: 'epic' }],
  
  // Category mastery
  exploration_master: [{ achievementId: 'exploration_master', stat: 'wisdom', bonus: 3, source: 'Exploration Master', rarity: 'epic' }],
  combat_master: [{ achievementId: 'combat_master', stat: 'strength', bonus: 3, source: 'Combat Master', rarity: 'epic' }],
  social_master: [{ achievementId: 'social_master', stat: 'charisma', bonus: 3, source: 'Social Master', rarity: 'epic' }],
  story_master: [{ achievementId: 'story_master', stat: 'intelligence', bonus: 3, source: 'Story Master', rarity: 'epic' }],
  merchant_master: [{ achievementId: 'merchant_master', stat: 'intelligence', bonus: 3, source: 'Merchant Master', rarity: 'epic' }],
  collector_master: [{ achievementId: 'collector_master', stat: 'dexterity', bonus: 3, source: 'Collector Master', rarity: 'epic' }],
  diplomat_master: [{ achievementId: 'diplomat_master', stat: 'charisma', bonus: 3, source: 'Diplomat Master', rarity: 'epic' }],
};

// Get perk toggle state for a campaign
export function getPerksEnabled(campaignId: string): boolean {
  try {
    const saved = localStorage.getItem(PERKS_ENABLED_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    return parsed[campaignId] ?? false;
  } catch {
    return false;
  }
}

// Save perk toggle state for a campaign
export function setPerksEnabled(campaignId: string, enabled: boolean): void {
  try {
    const saved = localStorage.getItem(PERKS_ENABLED_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    parsed[campaignId] = enabled;
    localStorage.setItem(PERKS_ENABLED_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('[StatPerks] Failed to save state:', e);
  }
}

// Calculate total stat bonuses from redeemed achievements
export function calculateStatBonuses(
  unlockedAchievements: string[],
  campaignId: string,
  onlyRedeemed: boolean = true
): Record<keyof CharacterStats, number> {
  const bonuses: Record<keyof CharacterStats, number> = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };
  
  // Get campaign-redeemed achievements if needed
  const campaignRedeemed = onlyRedeemed ? getCampaignRedeemedRewards() : null;
  const redeemedSet = campaignRedeemed?.[campaignId] || new Set<string>();
  
  for (const achievementId of unlockedAchievements) {
    // Check if achievement has been redeemed for this campaign (or if we're showing all)
    if (onlyRedeemed && !redeemedSet.has(achievementId)) continue;
    
    const perks = ACHIEVEMENT_STAT_PERKS[achievementId];
    if (!perks) continue;
    
    for (const perk of perks) {
      bonuses[perk.stat] += perk.bonus;
    }
  }
  
  return bonuses;
}

// Get active perks list with details
export function getActivePerks(
  unlockedAchievements: string[],
  campaignId: string
): StatPerk[] {
  const campaignRedeemed = getCampaignRedeemedRewards();
  const redeemedSet = campaignRedeemed[campaignId] || new Set<string>();
  
  const activePerks: StatPerk[] = [];
  
  for (const achievementId of unlockedAchievements) {
    if (!redeemedSet.has(achievementId)) continue;
    
    const perks = ACHIEVEMENT_STAT_PERKS[achievementId];
    if (perks) {
      activePerks.push(...perks);
    }
  }
  
  return activePerks;
}

// Hook for managing achievement stat perks
export function useAchievementStatPerks(campaignId?: string) {
  const { achievements } = useAchievements();
  const [enabled, setEnabled] = useState(() => 
    campaignId ? getPerksEnabled(campaignId) : false
  );
  
  // Get unlocked achievements
  const unlockedAchievements = useMemo(() => 
    achievements.filter(a => a.unlockedAt !== null).map(a => a.id),
    [achievements]
  );
  
  // Calculate bonuses
  const statBonuses = useMemo(() => {
    if (!enabled || !campaignId) {
      return { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    }
    return calculateStatBonuses(unlockedAchievements, campaignId);
  }, [enabled, campaignId, unlockedAchievements]);
  
  // Get active perks list
  const activePerks = useMemo(() => {
    if (!enabled || !campaignId) return [];
    return getActivePerks(unlockedAchievements, campaignId);
  }, [enabled, campaignId, unlockedAchievements]);
  
  // Total bonus count for display
  const totalBonus = useMemo(() => 
    Object.values(statBonuses).reduce((sum, val) => sum + val, 0),
    [statBonuses]
  );
  
  // Toggle perks
  const togglePerks = useCallback((newEnabled: boolean) => {
    if (!campaignId) return;
    setEnabled(newEnabled);
    setPerksEnabled(campaignId, newEnabled);
  }, [campaignId]);
  
  // Sync with campaign changes
  useEffect(() => {
    if (campaignId) {
      setEnabled(getPerksEnabled(campaignId));
    }
  }, [campaignId]);
  
  return {
    enabled,
    togglePerks,
    statBonuses,
    activePerks,
    totalBonus,
    hasPerks: activePerks.length > 0,
  };
}

// Stat icon component
const STAT_ICONS: Record<keyof CharacterStats, typeof Sword> = {
  strength: Sword,
  dexterity: Wind,
  constitution: Heart,
  intelligence: Brain,
  wisdom: Sparkles,
  charisma: Shield,
};

const RARITY_COLORS = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

// Component to display perk toggle and bonuses on character sheet
interface AchievementPerksToggleProps {
  campaignId?: string;
  className?: string;
}

export function AchievementPerksToggle({ campaignId, className }: AchievementPerksToggleProps) {
  const { enabled, togglePerks, statBonuses, activePerks, totalBonus, hasPerks } = useAchievementStatPerks(campaignId);
  
  if (!campaignId) return null;
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <Label htmlFor="achievement-perks" className="text-sm font-medium">
            Achievement Perks
          </Label>
        </div>
        <Switch
          id="achievement-perks"
          checked={enabled}
          onCheckedChange={togglePerks}
          disabled={!hasPerks}
        />
      </div>
      
      {enabled && hasPerks && (
        <div className="bg-background/50 rounded-lg p-3 border border-amber-500/20">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Active Bonuses (+{totalBonus} total)
          </div>
          
          {/* Stat bonus summary */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(Object.entries(statBonuses) as [keyof CharacterStats, number][])
              .filter(([, bonus]) => bonus > 0)
              .map(([stat, bonus]) => {
                const Icon = STAT_ICONS[stat];
                return (
                  <div 
                    key={stat}
                    className="flex items-center gap-1 text-xs bg-amber-500/10 rounded px-2 py-1"
                  >
                    <Icon className="w-3 h-3 text-amber-400" />
                    <span className="uppercase text-muted-foreground">{stat.slice(0, 3)}</span>
                    <span className="text-amber-400 font-medium">+{bonus}</span>
                  </div>
                );
              })}
          </div>
          
          {/* Perk sources */}
          <div className="text-[10px] text-muted-foreground space-y-1 max-h-20 overflow-y-auto">
            {activePerks.slice(0, 5).map((perk, i) => (
              <div key={`${perk.achievementId}-${perk.stat}-${i}`} className="flex items-center gap-1">
                <span className={RARITY_COLORS[perk.rarity]}>•</span>
                <span>{perk.source}</span>
                <span className="text-amber-400">+{perk.bonus} {perk.stat.slice(0, 3).toUpperCase()}</span>
              </div>
            ))}
            {activePerks.length > 5 && (
              <div className="text-muted-foreground/50">
                +{activePerks.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}
      
      {!hasPerks && (
        <p className="text-xs text-muted-foreground">
          Redeem achievement rewards to unlock stat bonuses
        </p>
      )}
    </div>
  );
}

export { ACHIEVEMENT_STAT_PERKS };
