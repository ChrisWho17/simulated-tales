// ============================================================================
// COMPANION JOURNAL - Tracks relationship history, memorable moments, secrets
// ============================================================================

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book, Heart, Shield, Star, Eye, Clock, ChevronLeft,
  Flame, Skull, Brain, MessageCircle, Sparkles, Lock,
  ThumbsUp, ThumbsDown, Trophy, Swords, HandHeart, X, Users, GitBranch
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { CompanionComparisonView } from './CompanionComparisonView';
import { RelationshipTimelineHorizontal } from './RelationshipTimelineHorizontal';
import { CompanionState, CompanionMemory } from '@/game/companion/companionTypes';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CompanionJournalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionState;
  allCompanions?: CompanionState[]; // For comparison view
}

// ============================================================================
// JOURNAL ENTRY TYPES
// ============================================================================

// Memory categories for filtering
type MemoryCategory = 'all' | 'combat' | 'emotional' | 'conflict' | 'milestone' | 'romance';

const MEMORY_CATEGORIES: { id: MemoryCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'all', label: 'All', icon: Clock, color: 'text-muted-foreground' },
  { id: 'combat', label: 'Combat', icon: Swords, color: 'text-amber-400' },
  { id: 'emotional', label: 'Bonds', icon: HandHeart, color: 'text-emerald-400' },
  { id: 'conflict', label: 'Conflicts', icon: Flame, color: 'text-red-400' },
  { id: 'milestone', label: 'Milestones', icon: Trophy, color: 'text-primary' },
  { id: 'romance', label: 'Romance', icon: Heart, color: 'text-pink-400' },
];

interface JournalEntry {
  id: string;
  type: 'milestone' | 'positive' | 'negative' | 'secret' | 'quirk' | 'confession' | 'bonding';
  category: MemoryCategory;
  title: string;
  description: string;
  timestamp: number;
  affinityChange?: number;
  icon: React.ElementType;
  color: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getMemoryIcon(memory: CompanionMemory): React.ElementType {
  if (memory.affinityChange >= 10) return Trophy;
  if (memory.affinityChange > 0) return ThumbsUp;
  if (memory.affinityChange <= -10) return Skull;
  if (memory.affinityChange < 0) return ThumbsDown;
  return MessageCircle;
}

function getMemoryColor(memory: CompanionMemory): string {
  if (memory.affinityChange >= 10) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  if (memory.affinityChange > 0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (memory.affinityChange <= -10) return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (memory.affinityChange < 0) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  return 'text-muted-foreground bg-muted/20 border-border/30';
}

// ============================================================================
// JOURNAL SECTIONS
// ============================================================================

// Helper to determine memory category
function getMemoryCategory(memory: CompanionMemory): MemoryCategory {
  const desc = memory.description.toLowerCase();
  
  // Combat-related keywords
  if (desc.includes('combat') || desc.includes('battle') || desc.includes('fight') || 
      desc.includes('killed') || desc.includes('defeated') || desc.includes('victory') ||
      desc.includes('attack') || desc.includes('weapon') || memory.type === 'action' && desc.includes('enemy')) {
    return 'combat';
  }
  
  // Romance keywords
  if (desc.includes('love') || desc.includes('romance') || desc.includes('kiss') ||
      desc.includes('affection') || desc.includes('intimate') || desc.includes('flirt')) {
    return 'romance';
  }
  
  // Conflict/negative
  if (memory.affinityChange <= -5 || memory.type === 'betrayal' ||
      desc.includes('betray') || desc.includes('angry') || desc.includes('conflict') ||
      desc.includes('argument') || desc.includes('disagree')) {
    return 'conflict';
  }
  
  // Emotional bonds/positive
  if (memory.affinityChange >= 5 || memory.type === 'gift' ||
      desc.includes('gift') || desc.includes('helped') || desc.includes('saved') ||
      desc.includes('bond') || desc.includes('trust') || desc.includes('share')) {
    return 'emotional';
  }
  
  return 'milestone';
}

function RelationshipTimeline({ companion }: { companion: CompanionState }) {
  const [activeFilter, setActiveFilter] = useState<MemoryCategory>('all');
  
  const timeline = useMemo(() => {
    const entries: JournalEntry[] = [];
    
    // Add join event
    entries.push({
      id: 'joined',
      type: 'milestone',
      category: 'milestone',
      title: 'First Meeting',
      description: `${companion.name} joined your party.`,
      timestamp: companion.joinedAt,
      icon: HandHeart,
      color: 'text-primary bg-primary/10 border-primary/30',
    });
    
    // Add significant memories (high affinity change)
    companion.memories
      .filter(m => !m.forgotten && Math.abs(m.affinityChange) >= 5)
      .forEach((memory, index) => {
        const category = getMemoryCategory(memory);
        const isCombat = category === 'combat';
        const isRomance = category === 'romance';
        
        entries.push({
          id: `memory-${index}`,
          type: memory.affinityChange > 0 ? 'positive' : 'negative',
          category,
          title: memory.type === 'betrayal' ? 'Betrayal' : 
                 memory.type === 'gift' ? 'Gift Received' :
                 isCombat ? (memory.affinityChange > 0 ? 'Combat Victory' : 'Combat Failure') :
                 isRomance ? 'Romantic Moment' :
                 memory.affinityChange > 0 ? 'Positive Moment' : 'Conflict',
          description: memory.description,
          timestamp: memory.timestamp,
          affinityChange: memory.affinityChange,
          icon: isCombat ? Swords : isRomance ? Heart : getMemoryIcon(memory),
          color: isCombat ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                 isRomance ? 'text-pink-400 bg-pink-500/10 border-pink-500/30' :
                 getMemoryColor(memory),
        });
      });
    
    // Add confession if applicable
    if (companion.confessedLove) {
      entries.push({
        id: 'confession',
        type: 'confession',
        category: 'romance',
        title: 'Romantic Confession',
        description: `${companion.name} confessed their romantic feelings.`,
        timestamp: companion.lastSpoke || Date.now(),
        icon: Heart,
        color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      });
    }
    
    // Sort by timestamp (newest first)
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }, [companion]);
  
  const filteredTimeline = useMemo(() => {
    if (activeFilter === 'all') return timeline;
    return timeline.filter(entry => entry.category === activeFilter);
  }, [timeline, activeFilter]);
  
  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<MemoryCategory, number> = {
      all: timeline.length,
      combat: 0,
      emotional: 0,
      conflict: 0,
      milestone: 0,
      romance: 0,
    };
    timeline.forEach(entry => {
      counts[entry.category]++;
    });
    return counts;
  }, [timeline]);
  
  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No significant events yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-1.5">
        {MEMORY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = categoryCounts[cat.id];
          const isActive = activeFilter === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              )}
            >
              <Icon className={cn("w-3 h-3", isActive ? 'text-primary' : cat.color)} />
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  isActive ? "bg-primary/30 text-primary" : "bg-muted/40"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Timeline */}
      <AnimatePresence mode="popLayout">
        {filteredTimeline.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 text-muted-foreground"
          >
            <p className="text-sm">No events in this category</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTimeline.map((entry, index) => {
              const Icon = entry.icon;
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "relative flex items-start gap-3 p-3 rounded-lg border",
                    entry.color
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 p-2 rounded-lg",
                    entry.color.replace('text-', 'bg-').split(' ')[0] + '/20'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{entry.title}</h4>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                          MEMORY_CATEGORIES.find(c => c.id === entry.category)?.color,
                          "bg-current/10"
                        )}>
                          {entry.category}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {entry.description}
                    </p>
                    {entry.affinityChange && (
                      <span className={cn(
                        "inline-block mt-1 px-1.5 py-0.5 text-xs rounded font-mono",
                        entry.affinityChange > 0 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {entry.affinityChange > 0 ? '+' : ''}{entry.affinityChange} affinity
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DiscoveredSecrets({ companion }: { companion: CompanionState }) {
  const secrets = useMemo(() => {
    const items: { id: string; title: string; revealed: boolean; description?: string }[] = [];
    
    // Add discovered quirks
    companion.quirkDiscovery.discoveredQuirks.forEach((quirk, i) => {
      items.push({
        id: `quirk-${i}`,
        title: quirk,
        revealed: true,
        description: `A hidden aspect of ${companion.name}'s personality`,
      });
    });
    
    // Add hidden quirks (locked)
    const hiddenQuirks = companion.personality.hiddenQuirks || [];
    const undiscovered = hiddenQuirks.filter(
      q => !companion.quirkDiscovery.discoveredQuirks.includes(q)
    );
    
    undiscovered.forEach((_, i) => {
      items.push({
        id: `hidden-${i}`,
        title: '???',
        revealed: false,
        description: 'Build more trust to discover this secret',
      });
    });
    
    // Add main secret if applicable
    if (companion.hasSecret) {
      items.push({
        id: 'main-secret',
        title: companion.secretRevealed ? 'Their Hidden Truth' : '???',
        revealed: companion.secretRevealed,
        description: companion.secretRevealed 
          ? `${companion.name} shared their deepest secret with you`
          : 'A deep secret they guard closely',
      });
    }
    
    return items;
  }, [companion]);
  
  if (secrets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No secrets to discover</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 gap-2">
      {secrets.map((secret, index) => (
        <motion.div
          key={secret.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "p-3 rounded-lg border relative overflow-hidden",
            secret.revealed
              ? "bg-primary/5 border-primary/30"
              : "bg-muted/20 border-border/30"
          )}
        >
          {!secret.revealed && (
            <div className="absolute inset-0 backdrop-blur-sm bg-background/50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex items-start gap-2">
            {secret.revealed ? (
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h4 className={cn(
                "font-medium text-sm truncate",
                secret.revealed ? "text-foreground" : "text-muted-foreground"
              )}>
                {secret.title}
              </h4>
              {secret.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {secret.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ConversationTopics({ companion }: { companion: CompanionState }) {
  const sharedTopics = companion.conversationMemory.sharedTopics;
  
  if (sharedTopics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No deep conversations yet</p>
        <p className="text-xs mt-1 opacity-70">Share personal topics to build connection</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {sharedTopics.map((topic, index) => (
        <motion.div
          key={topic.topic}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              topic.responseType === 'honest' ? "bg-emerald-500/10" :
              topic.responseType === 'emotional' ? "bg-pink-500/10" :
              topic.responseType === 'lie' ? "bg-red-500/10" :
              "bg-muted/30"
            )}>
              <Brain className={cn(
                "w-4 h-4",
                topic.responseType === 'honest' ? "text-emerald-400" :
                topic.responseType === 'emotional' ? "text-pink-400" :
                topic.responseType === 'lie' ? "text-red-400" :
                "text-muted-foreground"
              )} />
            </div>
            <div>
              <h4 className="font-medium text-sm capitalize">{topic.topic}</h4>
              <p className="text-xs text-muted-foreground">
                Shared {topic.responseType === 'honest' ? 'honestly' : 
                         topic.responseType === 'emotional' ? 'with emotion' :
                         topic.responseType === 'lie' ? 'deceptively' : 'vaguely'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(topic.sharedAt)}
            </span>
            {topic.referencedCount > 0 && (
              <p className="text-xs text-primary mt-0.5">
                Referenced {topic.referencedCount}×
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RelationshipStats({ companion }: { companion: CompanionState }) {
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
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Relationship Strength */}
      <div className="col-span-2 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Relationship Strength</span>
          <span className="text-2xl font-bold text-primary">{stats.strengthScore}%</span>
        </div>
        <Progress value={stats.strengthScore} className="h-2" />
      </div>
      
      {/* Stats Grid */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <ThumbsUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-muted-foreground">Positive Moments</span>
        </div>
        <span className="text-lg font-bold">{stats.positiveMemories}</span>
      </div>
      
      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <span className="text-xs text-muted-foreground">Conflicts</span>
        </div>
        <span className="text-lg font-bold">{stats.negativeMemories}</span>
      </div>
      
      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Secrets Found</span>
        </div>
        <span className="text-lg font-bold">{stats.discoveredQuirks}/{stats.totalQuirks}</span>
      </div>
      
      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-muted-foreground">Days Together</span>
        </div>
        <span className="text-lg font-bold">{Math.max(1, stats.timeTogetherDays)}</span>
      </div>
      
      {/* Grievances Warning */}
      {stats.grievances > 0 && (
        <div className="col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <Flame className="w-5 h-5 text-red-400" />
          <div>
            <span className="text-sm font-medium text-red-400">
              {stats.grievances} Unresolved Grievance{stats.grievances > 1 ? 's' : ''}
            </span>
            <p className="text-xs text-red-400/70">Address these to prevent relationship damage</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN JOURNAL COMPONENT
// ============================================================================

type JournalTab = 'overview' | 'timeline' | 'journey' | 'secrets' | 'conversations';

export function CompanionJournal({ isOpen, onClose, companion, allCompanions = [] }: CompanionJournalProps) {
  const [activeTab, setActiveTab] = useState<JournalTab>('overview');
  const [showComparison, setShowComparison] = useState(false);
  
  // Reset comparison view when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setShowComparison(false);
    }
  }, [isOpen]);
  
  const tabs: { id: JournalTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'journey', label: 'Journey', icon: GitBranch },
    { id: 'timeline', label: 'History', icon: Clock },
    { id: 'secrets', label: 'Secrets', icon: Eye },
    { id: 'conversations', label: 'Topics', icon: MessageCircle },
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg max-h-[85vh] flex flex-col mx-4 rounded-2xl border border-primary/30 overflow-hidden"
            style={{
              background: 'rgba(15, 15, 25, 0.98)',
              backdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 80px rgba(139, 92, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col border-b border-border/40 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
              {/* Top Row */}
              <div className="flex items-center gap-4 p-4">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Avatar */}
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
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg text-foreground truncate">
                    {showComparison ? 'Party Comparison' : `${companion.name}'s Journal`}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {showComparison ? 'Side-by-side relationship stats' : 'Relationship History & Secrets'}
                  </p>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Comparison Toggle Row */}
              {allCompanions.length > 1 && (
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Compare All Companions</span>
                  </div>
                  <Switch
                    checked={showComparison}
                    onCheckedChange={setShowComparison}
                    aria-label="Toggle comparison view"
                  />
                </div>
              )}
            </div>
            
            {/* Tabs - Only show when not in comparison mode */}
            {!showComparison && (
              <div className="flex gap-1 p-2 border-b border-border/30 bg-muted/5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all",
                        activeTab === tab.id
                          ? "bg-primary/20 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {showComparison ? (
                    <motion.div
                      key="comparison"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CompanionComparisonView companions={allCompanions} />
                    </motion.div>
                  ) : (
                    <>
                      {activeTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RelationshipStats companion={companion} />
                        </motion.div>
                      )}
                      
                      {activeTab === 'journey' && (
                        <motion.div
                          key="journey"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RelationshipTimelineHorizontal companion={companion} />
                        </motion.div>
                      )}
                      
                      {activeTab === 'timeline' && (
                        <motion.div
                          key="timeline"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RelationshipTimeline companion={companion} />
                        </motion.div>
                      )}
                      
                      {activeTab === 'secrets' && (
                        <motion.div
                          key="secrets"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <DiscoveredSecrets companion={companion} />
                        </motion.div>
                      )}
                      
                      {activeTab === 'conversations' && (
                        <motion.div
                          key="conversations"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ConversationTopics companion={companion} />
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
