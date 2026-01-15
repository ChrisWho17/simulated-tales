// Achievement Badges - displayable badges for profiles and menus
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Crown, Shield, Award, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAchievements, Achievement } from './Achievements';
import { useAchievementRewards, AchievementReward } from './AchievementRewards';

// Badge styles based on rarity
const rarityStyles = {
  common: {
    bg: 'bg-gradient-to-br from-slate-400 to-slate-500',
    border: 'border-slate-400',
    glow: '',
    text: 'text-slate-400',
  },
  uncommon: {
    bg: 'bg-gradient-to-br from-green-400 to-green-600',
    border: 'border-green-400',
    glow: 'shadow-[0_0_8px_rgba(74,222,128,0.4)]',
    text: 'text-green-400',
  },
  rare: {
    bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_10px_rgba(96,165,250,0.5)]',
    text: 'text-blue-400',
  },
  epic: {
    bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
    border: 'border-purple-400',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    text: 'text-purple-400',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.6)]',
    text: 'text-amber-400',
  },
};

// Frame styles from unlocked cosmetics
const frameStyles: Record<string, { className: string; name: string }> = {
  frame_wanderer: { className: 'ring-2 ring-amber-700', name: 'Wanderer' },
  frame_battle: { className: 'ring-2 ring-red-600 ring-offset-1 ring-offset-background', name: 'Battle-Scarred' },
  frame_gold: { className: 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]', name: 'Golden' },
  frame_trusted: { className: 'ring-2 ring-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)]', name: 'Trusted' },
  frame_merchant: { className: 'ring-4 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]', name: 'Gilded' },
  frame_alliance: { className: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-background', name: 'Alliance' },
  frame_peace: { className: 'ring-4 ring-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]', name: 'Dove' },
  frame_legendary: { className: 'ring-4 ring-amber-400 animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.7)]', name: 'Legendary' },
  frame_marathon: { className: 'ring-2 ring-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]', name: 'Endurance' },
  frame_perfect: { className: 'ring-4 ring-gradient-to-r from-purple-500 via-pink-500 to-amber-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]', name: 'Masterwork' },
};

// Single achievement badge
interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onClick?: () => void;
}

export function AchievementBadge({ 
  achievement, 
  size = 'md',
  showTooltip = true,
  onClick 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-12 h-12 text-2xl',
  };
  
  const style = rarityStyles[achievement.rarity];
  
  const badge = (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center cursor-pointer transition-all",
        sizeClasses[size],
        style.bg,
        style.glow,
        onClick && "hover:brightness-110"
      )}
    >
      <span>{achievement.icon}</span>
    </motion.div>
  );
  
  if (!showTooltip) return badge;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-medium">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          <span className={cn("text-[10px] uppercase", style.text)}>
            {achievement.rarity}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Badge showcase row - shows top achievements
interface BadgeShowcaseProps {
  maxBadges?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  className?: string;
}

export function BadgeShowcase({ 
  maxBadges = 5, 
  size = 'sm',
  showEmpty = true,
  className 
}: BadgeShowcaseProps) {
  const { achievements } = useAchievements();
  
  // Get top unlocked achievements by rarity
  const topAchievements = useMemo(() => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    return achievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
      .slice(0, maxBadges);
  }, [achievements, maxBadges]);
  
  const emptySlots = showEmpty ? maxBadges - topAchievements.length : 0;
  
  if (topAchievements.length === 0 && !showEmpty) return null;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {topAchievements.map((achievement) => (
        <AchievementBadge 
          key={achievement.id} 
          achievement={achievement} 
          size={size}
        />
      ))}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className={cn(
            "rounded-full bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center",
            size === 'sm' && 'w-6 h-6',
            size === 'md' && 'w-8 h-8',
            size === 'lg' && 'w-12 h-12'
          )}
        >
          <Trophy className={cn(
            "text-muted-foreground/30",
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-6 h-6'
          )} />
        </div>
      ))}
    </div>
  );
}

// Title display with unlocked titles
interface TitleDisplayProps {
  className?: string;
  characterName?: string;
}

export function TitleDisplay({ className, characterName }: TitleDisplayProps) {
  const { getClaimedByType, equippedCosmetics, equipCosmetic } = useAchievementRewards();
  const [isOpen, setIsOpen] = useState(false);
  
  const unlockedTitles = useMemo(() => getClaimedByType('title'), [getClaimedByType]);
  const equippedTitle = equippedCosmetics.title;
  const currentTitle = unlockedTitles.find(t => t.id === equippedTitle);
  
  if (unlockedTitles.length === 0) return null;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-1 h-auto py-1 px-2", className)}
        >
          <Crown className="w-3 h-3 text-amber-400" />
          <span className="text-xs italic text-muted-foreground">
            {currentTitle ? currentTitle.name : 'Select Title'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 pb-1">
            Choose a title to display:
          </p>
          {unlockedTitles.map((title) => (
            <Button
              key={title.id}
              variant={equippedTitle === title.id ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                equipCosmetic('title', title.id);
                setIsOpen(false);
              }}
            >
              <span>{title.icon}</span>
              <span className="text-sm">{title.name}</span>
              {equippedTitle === title.id && (
                <Star className="w-3 h-3 ml-auto text-amber-400" />
              )}
            </Button>
          ))}
          {equippedTitle && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                equipCosmetic('title', '');
                setIsOpen(false);
              }}
            >
              Remove Title
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Frame selector for portraits
interface FrameSelectorProps {
  currentFrame?: string;
  onSelectFrame: (frameId: string) => void;
  className?: string;
}

export function FrameSelector({ currentFrame, onSelectFrame, className }: FrameSelectorProps) {
  const { getClaimedByType } = useAchievementRewards();
  const [isOpen, setIsOpen] = useState(false);
  
  const unlockedFrames = useMemo(() => getClaimedByType('badge_frame'), [getClaimedByType]);
  
  if (unlockedFrames.length === 0) return null;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("gap-2", className)}
        >
          <Award className="w-4 h-4" />
          <span>Portrait Frame</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="space-y-3">
          <p className="text-sm font-medium">Select Portrait Frame</p>
          <div className="grid grid-cols-3 gap-2">
            {/* Default (no frame) */}
            <button
              onClick={() => {
                onSelectFrame('');
                setIsOpen(false);
              }}
              className={cn(
                "aspect-square rounded-lg border-2 p-2 transition-all flex items-center justify-center",
                !currentFrame ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
              )}
            >
              <span className="text-2xl">👤</span>
            </button>
            {unlockedFrames.map((frame) => {
              const style = frameStyles[frame.id];
              return (
                <Tooltip key={frame.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        onSelectFrame(frame.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "aspect-square rounded-lg border-2 p-2 transition-all flex items-center justify-center",
                        currentFrame === frame.id ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground",
                        style?.className
                      )}
                    >
                      <span className="text-2xl">{frame.icon}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{frame.name}</p>
                    <p className="text-xs text-muted-foreground">{frame.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Profile badge display with stats
interface ProfileBadgesProps {
  className?: string;
  compact?: boolean;
}

export function ProfileBadges({ className, compact = false }: ProfileBadgesProps) {
  const { achievements, unlockedAchievements } = useAchievements();
  const { equippedCosmetics } = useAchievementRewards();
  
  const stats = useMemo(() => {
    const unlocked = achievements.filter(a => a.unlockedAt);
    return {
      total: achievements.length,
      unlocked: unlocked.length,
      legendary: unlocked.filter(a => a.rarity === 'legendary').length,
      epic: unlocked.filter(a => a.rarity === 'epic').length,
      rare: unlocked.filter(a => a.rarity === 'rare').length,
    };
  }, [achievements]);
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span>{stats.unlocked}/{stats.total}</span>
        </div>
        <BadgeShowcase maxBadges={3} size="sm" showEmpty={false} />
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-medium">{stats.unlocked}</span>
          <span className="text-muted-foreground">/ {stats.total}</span>
        </div>
        {stats.legendary > 0 && (
          <div className="flex items-center gap-1 text-amber-400">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs">{stats.legendary} Legendary</span>
          </div>
        )}
        {stats.epic > 0 && (
          <div className="flex items-center gap-1 text-purple-400">
            <Star className="w-3 h-3" />
            <span className="text-xs">{stats.epic} Epic</span>
          </div>
        )}
      </div>
      
      {/* Badge showcase */}
      <BadgeShowcase maxBadges={6} size="md" />
      
      {/* Title display */}
      <TitleDisplay />
    </div>
  );
}

// Menu bar badge indicator
export function MenuBadgeIndicator() {
  const { achievements } = useAchievements();
  
  const legendaryCount = useMemo(() => 
    achievements.filter(a => a.unlockedAt && a.rarity === 'legendary').length,
    [achievements]
  );
  
  const hasNewRewards = useMemo(() => {
    // Check if there are unclaimed rewards
    // This would need to be connected to the rewards system
    return false;
  }, []);
  
  if (legendaryCount === 0 && !hasNewRewards) return null;
  
  return (
    <div className="relative">
      {legendaryCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"
        >
          <span className="text-[10px] font-bold text-white">{legendaryCount}</span>
        </motion.div>
      )}
      {hasNewRewards && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
        />
      )}
    </div>
  );
}

export { frameStyles };
