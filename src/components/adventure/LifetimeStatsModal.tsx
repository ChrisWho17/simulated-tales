import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Clock, Swords, Coins, MapPin, Users, Scroll, Dice6, 
  TrendingUp, Skull, Heart, Star, BarChart3, Download, Copy, Check,
  Flame, Target, Sparkles, Lock
} from 'lucide-react';
import { 
  loadLifetimeStats, 
  formatLifetimePlaytime, 
  getTopGenres,
  resetLifetimeStats,
  LifetimeStatistics 
} from '@/lib/lifetimeStats';
import { 
  getLifetimeAchievementProgress,
  LifetimeAchievement 
} from '@/lib/lifetimeAchievements';
import { getGenreTitle } from '@/lib/genreDetection';
import { GameGenre } from '@/types/genreData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatRow({ icon, label, value, highlight }: StatRowProps) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${highlight ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-medium ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
}

interface RecordCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

function RecordCard({ icon, title, value, subtitle, color }: RecordCardProps) {
  return (
    <div className={`p-4 rounded-xl border ${color} bg-gradient-to-br from-background to-muted/20`}>
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wide">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

// Lifetime Achievements Display component
function LifetimeAchievementsDisplay({ stats }: { stats: LifetimeStatistics }) {
  const achievements = getLifetimeAchievementProgress(stats);
  
  const rarityColors = {
    common: 'border-slate-400/50 bg-slate-500/10',
    uncommon: 'border-green-400/50 bg-green-500/10',
    rare: 'border-blue-400/50 bg-blue-500/10',
    epic: 'border-purple-400/50 bg-purple-500/10',
    legendary: 'border-amber-400/50 bg-amber-500/10',
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground">
        <span className="text-primary font-medium">{unlockedCount}</span> / {achievements.length} achievements unlocked
      </div>
      
      <div className="grid gap-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              achievement.unlocked 
                ? rarityColors[achievement.rarity]
                : "border-border/30 bg-muted/10 opacity-60"
            )}
          >
            <div className="text-2xl">
              {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium text-sm",
                  achievement.unlocked ? "" : "text-muted-foreground"
                )}>
                  {achievement.name}
                </span>
                <span className={cn(
                  "text-[10px] uppercase px-1.5 py-0.5 rounded-full",
                  achievement.rarity === 'common' && "bg-slate-500/20 text-slate-400",
                  achievement.rarity === 'uncommon' && "bg-green-500/20 text-green-400",
                  achievement.rarity === 'rare' && "bg-blue-500/20 text-blue-400",
                  achievement.rarity === 'epic' && "bg-purple-500/20 text-purple-400",
                  achievement.rarity === 'legendary' && "bg-amber-500/20 text-amber-400"
                )}>
                  {achievement.rarity}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{achievement.description}</div>
              {achievement.progress && !achievement.unlocked && (
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress 
                    value={(achievement.progress.current / achievement.progress.max) * 100} 
                    className="h-1.5 flex-1"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {achievement.progress.current.toLocaleString()}/{achievement.progress.max.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {achievement.unlocked && (
              <Trophy className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LifetimeStatsModal() {
  const [stats, setStats] = useState<LifetimeStatistics | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStats(loadLifetimeStats());
    }
  }, [open]);

  const handleExportText = () => {
    if (!stats) return;
    
    const text = generateTextExport(stats);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Stats copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!stats) return;
    
    const text = generateTextExport(stats);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `untold-lifetime-stats-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Stats downloaded!');
  };

  const handleReset = () => {
    if (confirm('Reset all lifetime statistics? This cannot be undone.')) {
      resetLifetimeStats();
      setStats(loadLifetimeStats());
      toast.success('Statistics reset');
    }
  };

  if (!stats) return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Lifetime Stats</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </DialogContent>
    </Dialog>
  );

  const topGenres = getTopGenres(stats);
  const daysSinceFirstPlay = Math.floor((Date.now() - stats.firstPlayedAt) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Lifetime Stats</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-5 h-5 text-primary" />
            Lifetime Statistics
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Hero Records */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <RecordCard
              icon={<Clock className="w-4 h-4" />}
              title="Total Playtime"
              value={formatLifetimePlaytime(stats.totalPlaytimeSeconds)}
              subtitle={`${stats.totalSessions} sessions`}
              color="border-primary/30"
            />
            <RecordCard
              icon={<Scroll className="w-4 h-4" />}
              title="Campaigns"
              value={stats.campaignsStarted}
              subtitle={`${stats.campaignsCompleted} completed`}
              color="border-amber-500/30"
            />
            <RecordCard
              icon={<Swords className="w-4 h-4" />}
              title="Enemies Defeated"
              value={stats.totalEnemiesDefeated.toLocaleString()}
              subtitle={`${stats.totalCombatEncounters} battles`}
              color="border-red-500/30"
            />
            <RecordCard
              icon={<Coins className="w-4 h-4" />}
              title="Gold Earned"
              value={stats.totalGoldEarned.toLocaleString()}
              subtitle={`${stats.totalGoldSpent.toLocaleString()} spent`}
              color="border-yellow-500/30"
            />
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-4">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="combat" className="text-xs">Combat</TabsTrigger>
              <TabsTrigger value="exploration" className="text-xs">World</TabsTrigger>
              <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs">Badges</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-1">
              <StatRow icon={<Clock className="w-4 h-4" />} label="Days Since First Play" value={daysSinceFirstPlay} />
              <StatRow icon={<Target className="w-4 h-4" />} label="Choices Made" value={stats.totalChoicesMade.toLocaleString()} highlight />
              <StatRow icon={<Users className="w-4 h-4" />} label="NPCs Encountered" value={stats.totalNpcsEncountered.toLocaleString()} />
              <StatRow icon={<MapPin className="w-4 h-4" />} label="Locations Visited" value={stats.totalLocationsVisited.toLocaleString()} />
              <StatRow icon={<Scroll className="w-4 h-4" />} label="Quests Completed" value={stats.totalQuestsCompleted.toLocaleString()} highlight />
              <StatRow icon={<Sparkles className="w-4 h-4" />} label="Secrets Discovered" value={stats.totalSecretsDiscovered.toLocaleString()} />
              
              {topGenres.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Favorite Genres</div>
                  <div className="flex flex-wrap gap-2">
                    {topGenres.map(({ genre, count }) => (
                      <span key={genre} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {getGenreTitle(genre as GameGenre)} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="combat" className="space-y-1">
              <StatRow icon={<Swords className="w-4 h-4" />} label="Combat Encounters" value={stats.totalCombatEncounters.toLocaleString()} />
              <StatRow icon={<Target className="w-4 h-4" />} label="Enemies Defeated" value={stats.totalEnemiesDefeated.toLocaleString()} highlight />
              <StatRow icon={<Skull className="w-4 h-4" />} label="Deaths" value={stats.totalDeaths.toLocaleString()} />
              <StatRow icon={<Flame className="w-4 h-4" />} label="Highest Damage" value={stats.highestDamageDealt.toLocaleString()} highlight />
              <StatRow icon={<TrendingUp className="w-4 h-4" />} label="Longest Win Streak" value={stats.longestWinStreak} />
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Dice Statistics</div>
                <StatRow icon={<Dice6 className="w-4 h-4" />} label="Total Dice Rolled" value={stats.totalDiceRolled.toLocaleString()} />
                <StatRow icon={<Star className="w-4 h-4 text-amber-400" />} label="Natural 20s" value={stats.totalNaturalTwenties} highlight />
                <StatRow icon={<Skull className="w-4 h-4 text-red-400" />} label="Natural 1s" value={stats.totalNaturalOnes} />
                <StatRow icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Critical Successes" value={stats.totalCriticalSuccesses} />
                <StatRow icon={<TrendingUp className="w-4 h-4 text-red-400" />} label="Critical Failures" value={stats.totalCriticalFailures} />
              </div>
            </TabsContent>

            <TabsContent value="exploration" className="space-y-1">
              <StatRow icon={<MapPin className="w-4 h-4" />} label="Locations Visited" value={stats.totalLocationsVisited.toLocaleString()} highlight />
              <StatRow icon={<Users className="w-4 h-4" />} label="NPCs Met" value={stats.totalNpcsEncountered.toLocaleString()} />
              <StatRow icon={<Heart className="w-4 h-4" />} label="Dialogue Exchanges" value={stats.totalDialogueExchanges.toLocaleString()} />
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Items</div>
                <StatRow icon={<Scroll className="w-4 h-4" />} label="Items Acquired" value={stats.totalItemsAcquired.toLocaleString()} />
                <StatRow icon={<Sparkles className="w-4 h-4" />} label="Items Crafted" value={stats.totalItemsCrafted.toLocaleString()} highlight />
                <StatRow icon={<Target className="w-4 h-4" />} label="Items Used" value={stats.totalItemsUsed.toLocaleString()} />
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Reputation</div>
                <StatRow icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Reputation Gained" value={stats.totalReputationGained.toLocaleString()} />
                <StatRow icon={<TrendingUp className="w-4 h-4 text-red-400" />} label="Reputation Lost" value={stats.totalReputationLost.toLocaleString()} />
                <StatRow icon={<Users className="w-4 h-4" />} label="Factions Encountered" value={stats.factionsEncountered} />
              </div>
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <RecordCard
                  icon={<Flame className="w-4 h-4" />}
                  title="Highest Damage"
                  value={stats.highestDamageDealt.toLocaleString()}
                  color="border-orange-500/30"
                />
                <RecordCard
                  icon={<Coins className="w-4 h-4" />}
                  title="Most Gold At Once"
                  value={stats.mostGoldAtOnce.toLocaleString()}
                  color="border-yellow-500/30"
                />
                <RecordCard
                  icon={<Scroll className="w-4 h-4" />}
                  title="Longest Campaign"
                  value={`${stats.longestCampaignTurns} turns`}
                  subtitle={stats.longestCampaignName || 'N/A'}
                  color="border-primary/30"
                />
                <RecordCard
                  icon={<Swords className="w-4 h-4" />}
                  title="Longest Win Streak"
                  value={stats.longestWinStreak}
                  color="border-red-500/30"
                />
              </div>
              
              <div className="text-center text-xs text-muted-foreground pt-4">
                Keep playing to set new records!
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-3">
              <LifetimeAchievementsDisplay stats={stats} />
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive hover:text-destructive">
            Reset Stats
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportText} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateTextExport(stats: LifetimeStatistics): string {
  const topGenres = getTopGenres(stats, 5);
  const lines = [
    '═══════════════════════════════════════════',
    '          UNTOLD - LIFETIME STATISTICS',
    '═══════════════════════════════════════════',
    '',
    `📅 Playing Since: ${new Date(stats.firstPlayedAt).toLocaleDateString()}`,
    `⏱️  Total Playtime: ${formatLifetimePlaytime(stats.totalPlaytimeSeconds)}`,
    `🎮 Total Sessions: ${stats.totalSessions}`,
    '',
    '── CAMPAIGNS ──',
    `📖 Started: ${stats.campaignsStarted}`,
    `✅ Completed: ${stats.campaignsCompleted}`,
    `🏆 Longest: ${stats.longestCampaignTurns} turns${stats.longestCampaignName ? ` (${stats.longestCampaignName})` : ''}`,
    '',
    '── COMBAT ──',
    `⚔️  Battles: ${stats.totalCombatEncounters}`,
    `💀 Enemies Defeated: ${stats.totalEnemiesDefeated}`,
    `☠️  Deaths: ${stats.totalDeaths}`,
    `🔥 Highest Damage: ${stats.highestDamageDealt}`,
    `🏆 Longest Win Streak: ${stats.longestWinStreak}`,
    '',
    '── DICE ──',
    `🎲 Total Rolled: ${stats.totalDiceRolled}`,
    `⭐ Natural 20s: ${stats.totalNaturalTwenties}`,
    `💥 Natural 1s: ${stats.totalNaturalOnes}`,
    '',
    '── ECONOMY ──',
    `💰 Gold Earned: ${stats.totalGoldEarned}`,
    `💸 Gold Spent: ${stats.totalGoldSpent}`,
    `🏦 Most At Once: ${stats.mostGoldAtOnce}`,
    '',
    '── EXPLORATION ──',
    `📍 Locations: ${stats.totalLocationsVisited}`,
    `👥 NPCs Met: ${stats.totalNpcsEncountered}`,
    `📜 Quests: ${stats.totalQuestsCompleted}`,
    `🔮 Secrets: ${stats.totalSecretsDiscovered}`,
    '',
    '── CHOICES ──',
    `🎯 Decisions Made: ${stats.totalChoicesMade}`,
    `💬 Dialogues: ${stats.totalDialogueExchanges}`,
    '',
  ];

  if (topGenres.length > 0) {
    lines.push('── FAVORITE GENRES ──');
    topGenres.forEach(({ genre, count }, i) => {
      lines.push(`${i + 1}. ${getGenreTitle(genre as GameGenre)}: ${count} plays`);
    });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  
  return lines.join('\n');
}

export default LifetimeStatsModal;
