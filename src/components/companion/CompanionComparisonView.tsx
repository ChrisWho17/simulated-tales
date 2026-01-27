// ============================================================================
// COMPANION COMPARISON VIEW - Side-by-side relationship stats for all party members
// ============================================================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Shield, Star, Users, Flame, Brain,
  ThumbsUp, ThumbsDown, Clock, MessageCircle, Sparkles
} from 'lucide-react';
import { CompanionState } from '@/game/companion/companionTypes';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CompanionComparisonViewProps {
  companions: CompanionState[];
}

// ============================================================================
// STAT BAR COMPONENT
// ============================================================================

function StatBar({ 
  label, 
  value, 
  maxValue = 100, 
  color,
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  maxValue?: number;
  color: string;
  icon: React.ElementType;
}) {
  const percentage = Math.max(0, Math.min(100, ((value + (maxValue === 200 ? 100 : 0)) / maxValue) * 100));
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("w-3 h-3", color)} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={cn("font-mono font-medium", color)}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn("h-full rounded-full", color.replace('text-', 'bg-'))}
        />
      </div>
    </div>
  );
}

// ============================================================================
// COMPANION CARD FOR COMPARISON
// ============================================================================

function CompanionComparisonCard({ 
  companion,
  index 
}: { 
  companion: CompanionState;
  index: number;
}) {
  const stats = useMemo(() => {
    const positiveMemories = companion.memories.filter(m => m.affinityChange > 0).length;
    const negativeMemories = companion.memories.filter(m => m.affinityChange < 0).length;
    const grievances = companionAutonomyManager.getUnresolvedGrievances(companion.id);
    const discoveredQuirks = companion.quirkDiscovery.discoveredQuirks.length;
    const totalQuirks = (companion.personality.hiddenQuirks || []).length;
    const conversationDepth = companion.conversationMemory.conversationDepth;
    
    // Calculate relationship strength score
    const strengthScore = Math.round(
      (companion.trust * 0.3) + 
      (companion.respect * 0.2) + 
      (Math.max(0, companion.affinity + 100) / 2 * 0.3) +
      (conversationDepth * 0.2)
    );
    
    return {
      positiveMemories,
      negativeMemories,
      grievances: grievances.length,
      discoveredQuirks,
      totalQuirks,
      conversationDepth,
      strengthScore,
      timeTogetherDays: Math.floor((Date.now() - companion.joinedAt) / 86400000),
    };
  }, [companion]);

  // Determine border color based on relationship health
  const borderColor = useMemo(() => {
    const avg = (companion.trust + companion.respect + (companion.affinity + 100) / 2) / 3;
    if (avg >= 70) return 'border-emerald-500/50';
    if (avg >= 40) return 'border-amber-500/50';
    return 'border-red-500/50';
  }, [companion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex-shrink-0 w-64 p-4 rounded-xl border-2 bg-background/60 backdrop-blur-sm",
        borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50">
            {companion.portrait ? (
              <img 
                src={companion.portrait} 
                alt={companion.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-lg font-bold">
                {companion.name.charAt(0)}
              </div>
            )}
          </div>
          {stats.grievances > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {stats.grievances}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">{companion.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{companion.mood}</p>
        </div>
      </div>

      {/* Strength Score */}
      <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Relationship</span>
          <span className="text-lg font-bold text-primary">{stats.strengthScore}%</span>
        </div>
        <Progress value={stats.strengthScore} className="h-1.5" />
      </div>

      {/* Core Stats */}
      <div className="space-y-3 mb-4">
        <StatBar 
          label="Affinity" 
          value={companion.affinity} 
          maxValue={200}
          color="text-pink-400" 
          icon={Heart} 
        />
        <StatBar 
          label="Trust" 
          value={companion.trust} 
          color="text-blue-400" 
          icon={Shield} 
        />
        <StatBar 
          label="Respect" 
          value={companion.respect} 
          color="text-amber-400" 
          icon={Star} 
        />
        {companion.fear > 10 && (
          <StatBar 
            label="Fear" 
            value={companion.fear} 
            color="text-red-400" 
            icon={Flame} 
          />
        )}
        {companion.romanticInterest > 20 && (
          <StatBar 
            label="Romance" 
            value={companion.romanticInterest} 
            color="text-rose-400" 
            icon={Heart} 
          />
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20">
          <ThumbsUp className="w-3 h-3 text-emerald-400" />
          <span className="text-muted-foreground">+{stats.positiveMemories}</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20">
          <ThumbsDown className="w-3 h-3 text-red-400" />
          <span className="text-muted-foreground">-{stats.negativeMemories}</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">{stats.discoveredQuirks}/{stats.totalQuirks}</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20">
          <MessageCircle className="w-3 h-3 text-cyan-400" />
          <span className="text-muted-foreground">{stats.conversationDepth}%</span>
        </div>
      </div>

      {/* Days Together */}
      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{Math.max(1, stats.timeTogetherDays)} days together</span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPARISON VIEW
// ============================================================================

export function CompanionComparisonView({ companions }: CompanionComparisonViewProps) {
  if (companions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No companions in your party</p>
        <p className="text-xs mt-1 opacity-70">Recruit companions during your adventure</p>
      </div>
    );
  }

  // Sort companions by relationship strength
  const sortedCompanions = useMemo(() => {
    return [...companions].sort((a, b) => {
      const strengthA = (a.trust * 0.3) + (a.respect * 0.2) + (Math.max(0, a.affinity + 100) / 2 * 0.3);
      const strengthB = (b.trust * 0.3) + (b.respect * 0.2) + (Math.max(0, b.affinity + 100) / 2 * 0.3);
      return strengthB - strengthA;
    });
  }, [companions]);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">
            {companions.length} Companion{companions.length > 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Sorted by relationship strength
        </span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-4 px-1 min-w-max">
          {sortedCompanions.map((companion, index) => (
            <CompanionComparisonCard 
              key={companion.id} 
              companion={companion}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-emerald-500" />
          <span>Strong (70%+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-amber-500" />
          <span>Moderate (40-69%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-red-500" />
          <span>Strained (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
}
