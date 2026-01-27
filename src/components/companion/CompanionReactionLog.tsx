// ============================================================================
// COMPANION REACTION LOG - Detailed history of stat changes and their causes
// ============================================================================

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Heart, Star, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, Filter,
  Clock, ChevronDown
} from 'lucide-react';
import { CompanionState, PlayerActionType } from '@/game/companionSystem';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

// Reaction log entry with full stat breakdown
export interface ReactionLogEntry {
  id: string;
  timestamp: number;
  actionType: PlayerActionType | string;
  description: string;
  changes: {
    affinity: number;
    trust: number;
    respect: number;
    fear: number;
    romance: number;
  };
  dialogue?: string;
  wasApproved?: boolean;
  wasDisapproved?: boolean;
}

interface CompanionReactionLogProps {
  companion: CompanionState;
  maxEntries?: number;
  compact?: boolean;
  className?: string;
}

const STAT_CONFIG = {
  affinity: { label: 'Affinity', icon: Heart, color: 'text-pink-400' },
  trust: { label: 'Trust', icon: Shield, color: 'text-cyan-400' },
  respect: { label: 'Respect', icon: Star, color: 'text-amber-400' },
  fear: { label: 'Fear', icon: AlertTriangle, color: 'text-purple-400' },
  romance: { label: 'Romance', icon: Heart, color: 'text-rose-400' },
};

type FilterType = 'all' | 'positive' | 'negative' | 'major';

export function CompanionReactionLog({
  companion,
  maxEntries = 20,
  compact = false,
  className,
}: CompanionReactionLogProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Extract reaction log from memories (the new enhanced format stores more data)
  const reactionLog = useMemo(() => {
    return companion.memories
      .filter(m => m.type === 'action' && !m.forgotten)
      .slice(-maxEntries)
      .reverse()
      .map((memory, i) => {
        // Parse additional stat changes from extended memory if available
        const extMem = memory as any;
        return {
          id: `${memory.timestamp}-${i}`,
          timestamp: memory.timestamp,
          actionType: memory.playerAction || 'unknown',
          description: memory.description,
          changes: {
            affinity: memory.affinityChange || 0,
            trust: extMem.trustChange || Math.round(memory.affinityChange * 0.5),
            respect: extMem.respectChange || Math.round(memory.affinityChange * 0.3),
            fear: extMem.fearChange || 0,
            romance: extMem.romanceChange || 0,
          },
          dialogue: extMem.dialogue,
          wasApproved: memory.affinityChange > 0,
          wasDisapproved: memory.affinityChange < 0,
        } as ReactionLogEntry;
      });
  }, [companion.memories, maxEntries]);

  // Apply filter
  const filteredLog = useMemo(() => {
    switch (filter) {
      case 'positive':
        return reactionLog.filter(e => e.changes.affinity > 0);
      case 'negative':
        return reactionLog.filter(e => e.changes.affinity < 0);
      case 'major':
        return reactionLog.filter(e => 
          Math.abs(e.changes.affinity) >= 10 ||
          Math.abs(e.changes.trust) >= 10 ||
          Math.abs(e.changes.respect) >= 10
        );
      default:
        return reactionLog;
    }
  }, [reactionLog, filter]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (reactionLog.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground text-sm", className)}>
        No reactions recorded yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter Bar */}
      {!compact && (
        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex gap-1">
            {(['all', 'positive', 'negative', 'major'] as FilterType[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'ghost'}
                className={cn(
                  "h-6 px-2 text-xs capitalize",
                  filter === f && "bg-primary/20 text-primary"
                )}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Reaction Entries */}
      <ScrollArea className={cn("max-h-[300px]", compact && "max-h-[200px]")}>
        <div className="space-y-2 pr-2">
          <AnimatePresence mode="popLayout">
            {filteredLog.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "rounded-lg border overflow-hidden transition-colors",
                  entry.wasApproved && "bg-emerald-500/5 border-emerald-500/20",
                  entry.wasDisapproved && "bg-red-500/5 border-red-500/20",
                  !entry.wasApproved && !entry.wasDisapproved && "bg-muted/10 border-border/20"
                )}
              >
                {/* Header Row - Always visible */}
                <button
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-muted/10 transition-colors text-left"
                >
                  {/* Trend Icon */}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    entry.changes.affinity > 0 && "bg-emerald-500/20",
                    entry.changes.affinity < 0 && "bg-red-500/20",
                    entry.changes.affinity === 0 && "bg-muted/30"
                  )}>
                    {entry.changes.affinity > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : entry.changes.affinity < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Action Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">
                        {formatAction(entry.actionType)}
                      </span>
                      {Math.abs(entry.changes.affinity) >= 15 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                          Major
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>

                  {/* Quick Stat Summary */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {Object.entries(entry.changes).map(([stat, value]) => {
                      if (value === 0) return null;
                      const config = STAT_CONFIG[stat as keyof typeof STAT_CONFIG];
                      const Icon = config.icon;
                      return (
                        <span
                          key={stat}
                          className={cn(
                            "flex items-center gap-0.5 text-[10px] font-mono",
                            value > 0 && "text-emerald-400",
                            value < 0 && "text-red-400"
                          )}
                          title={config.label}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {value > 0 ? '+' : ''}{value}
                        </span>
                      );
                    })}
                  </div>

                  {/* Expand Arrow */}
                  <motion.div
                    animate={{ rotate: expandedEntry === entry.id ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedEntry === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-t border-border/20"
                    >
                      <div className="p-3 space-y-3">
                        {/* Full Stat Breakdown */}
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(entry.changes).map(([stat, value]) => {
                            const config = STAT_CONFIG[stat as keyof typeof STAT_CONFIG];
                            const Icon = config.icon;
                            return (
                              <div
                                key={stat}
                                className="flex flex-col items-center p-2 rounded-lg bg-background/50"
                              >
                                <Icon className={cn("w-4 h-4 mb-1", config.color)} />
                                <span className={cn(
                                  "text-sm font-bold",
                                  value > 0 && "text-emerald-400",
                                  value < 0 && "text-red-400",
                                  value === 0 && "text-muted-foreground"
                                )}>
                                  {value > 0 ? '+' : ''}{value}
                                </span>
                                <span className="text-[9px] text-muted-foreground capitalize">
                                  {stat}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground">
                          {entry.description}
                        </p>

                        {/* Dialogue if present */}
                        {entry.dialogue && (
                          <div className="p-2 rounded bg-muted/20 border border-border/20">
                            <p className="text-xs italic text-foreground/80">
                              "{entry.dialogue}"
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Summary Stats */}
      {!compact && filteredLog.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredLog.length} reaction{filteredLog.length !== 1 ? 's' : ''} recorded</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">
                +{filteredLog.reduce((sum, e) => sum + Math.max(0, e.changes.affinity), 0)}
              </span>
              <span className="text-red-400">
                {filteredLog.reduce((sum, e) => sum + Math.min(0, e.changes.affinity), 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

console.log('[CompanionReactionLog] Component loaded');
