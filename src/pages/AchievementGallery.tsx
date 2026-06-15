import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Star, Lock, ArrowLeft, Calendar, Clock, Award, TrendingUp, Sparkles, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAchievements, Achievement, ACHIEVEMENT_CATEGORIES } from '@/components/game/Achievements';
import { AchievementExport } from '@/components/game/AchievementExport';
import { format } from 'date-fns';
import { SeoHead } from '@/components/seo/SeoHead';

const rarityColors = {
  common: 'from-slate-400 to-slate-500 border-slate-400',
  uncommon: 'from-green-400 to-green-600 border-green-400',
  rare: 'from-blue-400 to-blue-600 border-blue-400',
  epic: 'from-purple-400 to-purple-600 border-purple-400',
  legendary: 'from-amber-400 to-amber-600 border-amber-400',
};

const rarityBgs = {
  common: 'bg-slate-500/10',
  uncommon: 'bg-green-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-amber-500/10',
};

const rarityGlows = {
  common: '',
  uncommon: 'shadow-[0_0_15px_rgba(74,222,128,0.2)]',
  rare: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]',
  epic: 'shadow-[0_0_25px_rgba(168,85,247,0.4)]',
  legendary: 'shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse',
};

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const isUnlocked = !!achievement.unlockedAt;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, type: 'spring', damping: 20 }}
      whileHover={{ scale: isUnlocked ? 1.02 : 1, y: isUnlocked ? -4 : 0 }}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
        isUnlocked 
          ? `${rarityBgs[achievement.rarity]} ${rarityGlows[achievement.rarity]} border-${achievement.rarity === 'common' ? 'slate' : achievement.rarity === 'uncommon' ? 'green' : achievement.rarity === 'rare' ? 'blue' : achievement.rarity === 'epic' ? 'purple' : 'amber'}-400/50`
          : "bg-muted/30 border-border/30 opacity-60"
      )}
    >
      {/* Shimmer effect for legendary */}
      {isUnlocked && achievement.rarity === 'legendary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      )}
      
      {/* Icon */}
      <div className="flex items-start gap-4 relative z-10">
        <div className={cn(
          "text-4xl relative transition-all",
          !isUnlocked && "grayscale opacity-50"
        )}>
          {isUnlocked ? (
            <>
              {achievement.icon}
              {achievement.rarity === 'legendary' && (
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />
              )}
            </>
          ) : (
            <Lock className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-bold text-base truncate",
              !isUnlocked && "text-muted-foreground"
            )}>
              {achievement.name}
            </h3>
            <span className={cn(
              "text-[10px] uppercase px-2 py-0.5 rounded-full font-bold",
              isUnlocked ? `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white` : "bg-muted text-muted-foreground"
            )}>
              {achievement.rarity}
            </span>
          </div>
          
          {/* Description */}
          <p className={cn(
            "text-sm mb-2",
            isUnlocked ? "text-foreground/80" : "text-muted-foreground"
          )}>
            {achievement.description}
          </p>
          
          {/* Progress bar for incomplete */}
          {achievement.maxProgress && !isUnlocked && (
            <div className="mt-2">
              <Progress 
                value={((achievement.progress || 0) / achievement.maxProgress) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.progress || 0} / {achievement.maxProgress}
              </p>
            </div>
          )}
          
          {/* Unlock date */}
          {isUnlocked && achievement.unlockedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Calendar className="w-3 h-3" />
              <span>Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: typeof Trophy;
  color: string;
}) {
  return (
    <Card className={cn("border-2", color)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", color.replace('border-', 'bg-').replace('/30', '/20'))}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementGallery() {
  const navigate = useNavigate();
  const { achievements, unlockedAchievements } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'date' | 'name'>('date');
  
  // Compute stats
  const stats = useMemo(() => {
    const unlocked = achievements.filter(a => a.unlockedAt);
    const rarityCount = {
      common: unlocked.filter(a => a.rarity === 'common').length,
      uncommon: unlocked.filter(a => a.rarity === 'uncommon').length,
      rare: unlocked.filter(a => a.rarity === 'rare').length,
      epic: unlocked.filter(a => a.rarity === 'epic').length,
      legendary: unlocked.filter(a => a.rarity === 'legendary').length,
    };
    const mostRecent = unlocked.sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))[0];
    
    return {
      total: achievements.length,
      unlocked: unlocked.length,
      percentage: Math.round((unlocked.length / achievements.length) * 100),
      rarityCount,
      mostRecent,
    };
  }, [achievements]);
  
  // Filter and sort achievements
  const displayedAchievements = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? achievements 
      : achievements.filter(a => a.category === selectedCategory);
    
    // Sort
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    
    return [...filtered].sort((a, b) => {
      // Always show unlocked first
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      
      switch (sortBy) {
        case 'rarity':
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        case 'date':
          return (b.unlockedAt || 0) - (a.unlockedAt || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [achievements, selectedCategory, sortBy]);
  
  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; unlocked: number }> = {};
    for (const cat of ACHIEVEMENT_CATEGORIES) {
      if (cat.id === 'all') {
        counts.all = { total: achievements.length, unlocked: unlockedAchievements.size };
      } else {
        const catAchievements = achievements.filter(a => a.category === cat.id);
        counts[cat.id] = {
          total: catAchievements.length,
          unlocked: catAchievements.filter(a => a.unlockedAt).length,
        };
      }
    }
    return counts;
  }, [achievements, unlockedAchievements]);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <SeoHead
        title="Trophy Room — The Untold Stories"
        description="Browse your unlocked achievements, lifetime stats, and legendary feats earned across all campaigns."
        path="/achievements"
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-400" />
                Trophy Room
              </h1>
              <p className="text-muted-foreground">
                Your collection of accomplishments and legendary feats
              </p>
            </div>
          </div>
          
          {/* Export/Share Button */}
          <AchievementExport
            achievements={achievements}
            unlockedCount={stats.unlocked}
            totalCount={stats.total}
          />
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Achievements Unlocked" 
            value={`${stats.unlocked}/${stats.total}`}
            icon={Trophy}
            color="border-amber-400/30"
          />
          <StatCard 
            title="Completion Rate" 
            value={`${stats.percentage}%`}
            icon={TrendingUp}
            color="border-green-400/30"
          />
          <StatCard 
            title="Rare+ Unlocked" 
            value={stats.rarityCount.rare + stats.rarityCount.epic + stats.rarityCount.legendary}
            icon={Star}
            color="border-blue-400/30"
          />
          <StatCard 
            title="Legendary" 
            value={stats.rarityCount.legendary}
            icon={Award}
            color="border-purple-400/30"
          />
        </div>
        
        {/* Progress by Rarity */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress by Rarity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map(rarity => {
                const total = achievements.filter(a => a.rarity === rarity).length;
                const unlocked = stats.rarityCount[rarity];
                return (
                  <div key={rarity} className="text-center">
                    <div className={cn(
                      "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 border-2",
                      `bg-gradient-to-br ${rarityColors[rarity]}`
                    )}>
                      <span className="text-white font-bold text-sm">{unlocked}</span>
                    </div>
                    <p className="text-xs capitalize text-muted-foreground">{rarity}</p>
                    <p className="text-[10px] text-muted-foreground">{unlocked}/{total}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ACHIEVEMENT_CATEGORIES.map(cat => {
            const count = categoryCounts[cat.id];
            const isComplete = count && count.unlocked === count.total;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "gap-2",
                  isComplete && selectedCategory !== cat.id && "border-green-400/50 text-green-400"
                )}
              >
                <span>{cat.icon}</span>
                <span className="capitalize">{cat.name}</span>
                {count && (
                  <span className="text-xs opacity-70">
                    ({count.unlocked}/{count.total})
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        
        {/* Sort Options */}
        <div className="flex gap-2 mb-6">
          <span className="text-sm text-muted-foreground self-center">Sort by:</span>
          {(['date', 'rarity', 'name'] as const).map(sort => (
            <Button
              key={sort}
              variant={sortBy === sort ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy(sort)}
              className="capitalize"
            >
              {sort === 'date' ? 'Recent' : sort}
            </Button>
          ))}
        </div>
        
        {/* Achievement Grid */}
        <ScrollArea className="h-[calc(100vh-450px)] min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            <AnimatePresence mode="popLayout">
              {displayedAchievements.map((achievement, index) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
        
        {/* Most Recent Achievement */}
        {stats.mostRecent && (
          <div className="fixed bottom-4 right-4 hidden lg:block">
            <Card className="w-64 border-2 border-amber-400/30 bg-background/95 backdrop-blur">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Most Recent
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stats.mostRecent.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{stats.mostRecent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.mostRecent.unlockedAt && format(new Date(stats.mostRecent.unlockedAt), 'MMM d')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}