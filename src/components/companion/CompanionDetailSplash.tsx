// ============================================================================
// COMPANION DETAIL SPLASH - Full-screen scrollable companion detail view
// Replaces the buggy inline expansion in CompanionPanel
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, Star, AlertTriangle, Heart, Brain, MessageCircle,
  Sparkles, UserMinus, Book, ThumbsUp, ThumbsDown, Flame,
  Skull, Eye, Scale, HandHeart, Users, ChevronDown, ChevronUp,
  Target, Zap, Sword, History
} from 'lucide-react';
import { CompanionState, CompanionMood, PlayerActionType } from '@/game/companionSystem';
import { companionSystem } from '@/game/companionSystem';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MoodIndicator, CompanionGoalTracker, CompanionReactionLog } from '@/components/companion';

interface CompanionDetailSplashProps {
  companion: CompanionState;
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onSpeak?: (companion: CompanionState, dialogue: string) => void;
  onEnterScene?: (companion: CompanionState, introNarrative: string) => void;
  onOpenSheet: () => void;
  onOpenJournal: () => void;
  onResolveGrievance?: (grievance: { id: string; description: string; severity: number }) => void;
  genre?: string;
  currentScene?: string;
}

const moodColors: Record<CompanionMood, string> = {
  joyful: 'text-yellow-400',
  content: 'text-green-400',
  neutral: 'text-gray-400',
  annoyed: 'text-orange-400',
  angry: 'text-red-500',
  sad: 'text-blue-400',
  fearful: 'text-purple-400',
  disgusted: 'text-amber-600',
  romantic: 'text-pink-400',
  betrayed: 'text-red-700',
};

const roleIcons = {
  tank: Shield,
  damage: Sword,
  support: Heart,
  ranged: Zap,
};

const ACTION_LABELS: Partial<Record<PlayerActionType, { label: string; icon: React.ElementType }>> = {
  combat_kill: { label: 'Kill', icon: Skull },
  combat_spare: { label: 'Spare', icon: Heart },
  theft: { label: 'Theft', icon: Eye },
  charity: { label: 'Charity', icon: Heart },
  lie: { label: 'Lie', icon: Eye },
  truth: { label: 'Truth', icon: Scale },
  violence: { label: 'Violence', icon: Flame },
  diplomacy: { label: 'Diplomacy', icon: Scale },
  betrayal: { label: 'Betrayal', icon: Skull },
  loyalty: { label: 'Loyalty', icon: Shield },
  cowardice: { label: 'Cowardice', icon: AlertTriangle },
  bravery: { label: 'Bravery', icon: Shield },
  romance_flirt: { label: 'Flirt', icon: Heart },
  romance_reject: { label: 'Reject', icon: X },
  insult: { label: 'Insult', icon: Flame },
  compliment: { label: 'Praise', icon: Star },
  greed: { label: 'Greed', icon: Eye },
  sacrifice: { label: 'Sacrifice', icon: Heart },
  mercy: { label: 'Mercy', icon: Heart },
  cruelty: { label: 'Cruelty', icon: Skull },
};

export function CompanionDetailSplash({
  companion,
  isOpen,
  onClose,
  onDismiss,
  onSpeak,
  onEnterScene,
  onOpenSheet,
  onOpenJournal,
  onResolveGrievance,
  genre = 'fantasy',
  currentScene = '',
}: CompanionDetailSplashProps) {
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [isGeneratingEntry, setIsGeneratingEntry] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('stats');

  const RoleIcon = roleIcons[companion.combatRole as keyof typeof roleIcons] || Users;

  // Calculate relationship health
  const relationshipHealth = useMemo(() => {
    const avg = (companion.trust + companion.respect + Math.max(0, companion.affinity + 100) / 2) / 3;
    if (avg >= 70) return { status: 'Strong', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/40' };
    if (avg >= 40) return { status: 'Stable', color: 'text-primary', bg: 'from-primary/20 to-primary/5', border: 'border-primary/40' };
    if (avg >= 20) return { status: 'Strained', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/40' };
    return { status: 'Critical', color: 'text-red-400', bg: 'from-red-500/20 to-red-500/5', border: 'border-red-500/40' };
  }, [companion.trust, companion.respect, companion.affinity]);

  // Get grievances
  const grievances = useMemo(() => {
    return companionAutonomyManager.getUnresolvedGrievances(companion.id);
  }, [companion.id]);

  // Get recent memories
  const recentMemories = useMemo(() => {
    return companion.memories
      .filter(m => m.affinityChange !== 0 && !m.forgotten)
      .slice(-8)
      .reverse();
  }, [companion.memories]);

  const handleTalk = async () => {
    if (!onSpeak) return;
    setIsGeneratingDialogue(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-companion-dialogue`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          companion,
          situation: 'The player wants to chat',
          dialogueType: 'ambient',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        onSpeak(companion, data.dialogue || 'Hmm...');
        onClose();
      } else {
        const commentary = companionSystem.getCompanionCommentary('conversation');
        if (commentary) onSpeak(companion, commentary.comment);
        onClose();
      }
    } catch (error) {
      const commentary = companionSystem.getCompanionCommentary('conversation');
      if (commentary) onSpeak(companion, commentary.comment);
      onClose();
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  const handleEnterScene = async () => {
    if (!onEnterScene) return;
    setIsGeneratingEntry(true);
    try {
      const traitsDescription = companion.personality.traits.join(', ');
      const roleDescription = companion.combatRole || 'companion';
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-companion-dialogue`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          companion,
          situation: currentScene || 'The player is exploring the area',
          playerAction: 'companion_entrance',
          dialogueType: 'event',
          genre,
          customPrompt: `${companion.name} (a ${roleDescription} with traits: ${traitsDescription}) enters the current scene in a dramatic, personality-appropriate way.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onEnterScene(companion, data.dialogue || `${companion.name} arrives.`);
        toast.success(`${companion.name} enters the scene!`);
        onClose();
      } else {
        onEnterScene(companion, `${companion.name} steps forward.`);
        onClose();
      }
    } catch {
      onEnterScene(companion, `${companion.name} arrives.`);
      onClose();
    } finally {
      setIsGeneratingEntry(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md h-[90vh] max-h-[700px] mx-4 flex flex-col rounded-2xl border overflow-hidden"
          style={{
            background: 'rgba(15, 15, 25, 0.98)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.7), 0 0 60px rgba(139, 92, 246, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Portrait */}
          <div className={cn("relative p-6 bg-gradient-to-b", relationshipHealth.bg)}>
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Portrait & Basic Info */}
            <div className="flex flex-col items-center text-center">
              {/* Large Portrait */}
              <div className={cn(
                "w-24 h-24 rounded-full border-4 overflow-hidden mb-4 shadow-2xl",
                relationshipHealth.border
              )}>
                {companion.portrait ? (
                  <img src={companion.portrait} alt={companion.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-background text-4xl font-display">
                    {companion.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Mood indicator */}
              <MoodIndicator 
                mood={companion.mood} 
                moodIntensity={companion.moodIntensity}
                size="md"
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
              />

              {/* Name & Role */}
              <h2 className="text-2xl font-display font-bold text-foreground">{companion.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <RoleIcon className="w-4 h-4" />
                <span className="capitalize text-sm">{companion.combatRole || 'Companion'}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className={cn("text-sm capitalize", moodColors[companion.mood])}>{companion.mood}</span>
              </div>

              {/* Affinity Display */}
              <div className="mt-3 flex items-center gap-3">
                <span className={cn(
                  "text-lg font-bold",
                  companion.affinity > 30 && "text-emerald-400",
                  companion.affinity < -30 && "text-red-400",
                  companion.affinity >= -30 && companion.affinity <= 30 && "text-muted-foreground"
                )}>
                  {companion.affinity > 0 ? '+' : ''}{companion.affinity}
                </span>
                {companion.romanticInterest > 50 && (
                  <Heart className="w-5 h-5 text-pink-400 fill-pink-400/50" />
                )}
                <span className={cn("text-sm font-medium", relationshipHealth.color)}>
                  {relationshipHealth.status}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">
              {/* Stats Section */}
              <CollapsibleSection
                title="Relationship Stats"
                icon={<Heart className="w-4 h-4" />}
                isExpanded={expandedSection === 'stats'}
                onToggle={() => toggleSection('stats')}
              >
                <div className="grid grid-cols-2 gap-3 p-3">
                  <StatDisplay label="Trust" value={companion.trust} icon={Shield} color="text-cyan-400" />
                  <StatDisplay label="Respect" value={companion.respect} icon={Star} color="text-amber-400" />
                  <StatDisplay label="Fear" value={companion.fear} icon={AlertTriangle} color="text-purple-400" />
                  <StatDisplay label="Romance" value={companion.romanticInterest} icon={Heart} color="text-pink-400" />
                </div>
              </CollapsibleSection>

              {/* Personality Section */}
              <CollapsibleSection
                title="Personality"
                icon={<Brain className="w-4 h-4" />}
                isExpanded={expandedSection === 'personality'}
                onToggle={() => toggleSection('personality')}
              >
                <div className="p-3 space-y-3">
                  {/* Traits */}
                  <div className="flex flex-wrap gap-1.5">
                    {companion.personality.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 capitalize font-medium"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>

                  {/* Approves/Disapproves */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1.5">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="font-medium">Approves</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {companion.personality.approves.slice(0, 5).map(action => {
                          const config = ACTION_LABELS[action];
                          const Icon = config?.icon || Star;
                          return (
                            <span key={action} className="px-1.5 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <Icon className="w-2.5 h-2.5" />
                              {config?.label || action.replace(/_/g, ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-red-400 mb-1.5">
                        <ThumbsDown className="w-3 h-3" />
                        <span className="font-medium">Dislikes</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {companion.personality.disapproves.slice(0, 5).map(action => {
                          const config = ACTION_LABELS[action];
                          const Icon = config?.icon || AlertTriangle;
                          return (
                            <span key={action} className="px-1.5 py-0.5 text-xs rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                              <Icon className="w-2.5 h-2.5" />
                              {config?.label || action.replace(/_/g, ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Goals Section */}
              <CollapsibleSection
                title="Active Goals"
                icon={<Target className="w-4 h-4" />}
                isExpanded={expandedSection === 'goals'}
                onToggle={() => toggleSection('goals')}
              >
                <div className="p-3">
                  <CompanionGoalTracker companion={companion} compact={false} />
                </div>
              </CollapsibleSection>

              {/* Grievances Section */}
              {grievances.length > 0 && (
                <CollapsibleSection
                  title={`Grievances (${grievances.length})`}
                  icon={<Flame className="w-4 h-4 text-red-400" />}
                  isExpanded={expandedSection === 'grievances'}
                  onToggle={() => toggleSection('grievances')}
                  badgeColor="bg-red-500"
                >
                  <div className="p-3 space-y-2">
                    {grievances.map(g => (
                      <button
                        key={g.id}
                        onClick={() => onResolveGrievance?.(g)}
                        className="w-full text-left flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors group"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-300/80 flex-1">{g.description}</span>
                        <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <HandHeart className="w-3 h-3" />
                          Resolve
                        </span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Reaction Log Section - Enhanced with full stat breakdown */}
              <CollapsibleSection
                title="Reaction Log"
                icon={<History className="w-4 h-4" />}
                isExpanded={expandedSection === 'reactions'}
                onToggle={() => toggleSection('reactions')}
              >
                <div className="p-3">
                  <CompanionReactionLog 
                    companion={companion} 
                    maxEntries={15}
                    compact={false}
                  />
                </div>
              </CollapsibleSection>

              {/* Internal Thoughts (if high trust) */}
              {companion.trust > 60 && (
                <CollapsibleSection
                  title="Inner Thoughts"
                  icon={<Brain className="w-4 h-4 text-primary" />}
                  isExpanded={expandedSection === 'thoughts'}
                  onToggle={() => toggleSection('thoughts')}
                >
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground italic">{companion.internalThoughts}</p>
                  </div>
                </CollapsibleSection>
              )}

              {/* Warning for strained relationship */}
              {companion.affinity < companion.personality.departureThreshold + 20 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">May leave soon - relationship critically strained</span>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Action Bar */}
          <div className="p-4 border-t border-border/40 bg-background/50">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-background/50 hover:bg-background/80"
                onClick={handleTalk}
                disabled={isGeneratingDialogue || isGeneratingEntry}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                {isGeneratingDialogue ? 'Thinking...' : 'Talk'}
              </Button>
              {onEnterScene && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={handleEnterScene}
                  disabled={isGeneratingEntry || isGeneratingDialogue}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {isGeneratingEntry ? 'Entering...' : 'Enter Scene'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenJournal}
                className="text-primary hover:text-primary/80"
              >
                <Book className="w-4 h-4 mr-1.5" />
                Journal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                className="text-red-400 hover:text-red-300 hover:border-red-400/50 hover:bg-red-500/10"
              >
                <UserMinus className="w-4 h-4 mr-1.5" />
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badgeColor,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badgeColor?: string;
}) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badgeColor && (
            <span className={cn("w-2 h-2 rounded-full", badgeColor)} />
          )}
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/20"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat display component
function StatDisplay({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="p-2 rounded-lg bg-muted/20 border border-border/20">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className={cn("w-3 h-3", color)} />
          {label}
        </span>
        <span className={cn(
          "text-sm font-bold",
          value >= 70 && "text-emerald-400",
          value < 30 && "text-red-400",
          value >= 30 && value < 70 && color
        )}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            value >= 70 && "bg-emerald-400",
            value < 30 && "bg-red-400",
            value >= 30 && value < 70 && "bg-primary"
          )}
        />
      </div>
    </div>
  );
}
