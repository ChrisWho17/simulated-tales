import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Heart, Shield, Sword, Zap, Brain, 
  ChevronDown, ChevronUp, X, UserPlus, UserMinus,
  MessageCircle, Star, AlertTriangle, Wand2, Sparkles,
  ThumbsUp, ThumbsDown, Flame, Skull, Eye, Scale, HandHeart, Book
} from 'lucide-react';
import { 
  companionSystem, 
  CompanionState, 
  CompanionMood,
  COMPANION_TEMPLATES,
  PlayerActionType
} from '@/game/companionSystem';
import { companionCombatManager } from '@/game/companionCombatSystem';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CompanionCharacterSheet } from './CompanionCharacterSheet';
import { CompanionCreatorWizardV2, CompanionJournal, GrievanceResolutionDialog } from '@/components/companion';

interface CompanionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanionSpeak?: (companion: CompanionState, dialogue: string) => void;
  onEnterScene?: (companion: CompanionState, introNarrative: string) => void;
  genre?: string;
  currentScene?: string;
}

const roleIcons = {
  tank: Shield,
  damage: Sword,
  support: Heart,
  ranged: Zap,
};

const moodColors: Record<CompanionMood, string> = {
  joyful: 'bg-yellow-400',
  content: 'bg-green-400',
  neutral: 'bg-gray-400',
  annoyed: 'bg-orange-400',
  angry: 'bg-red-500',
  sad: 'bg-blue-400',
  fearful: 'bg-purple-400',
  disgusted: 'bg-amber-600',
  romantic: 'bg-pink-400',
  betrayed: 'bg-red-700',
};

// Action labels for display
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

// Compact health display component
function CompanionHealthBadge({ companion, onClick }: { companion: CompanionState; onClick: () => void }) {
  const combatStats = companionCombatManager.getCombatStats(companion.id);
  if (!combatStats) return null;
  
  const healthPercent = (combatStats.currentHealth / combatStats.maxHealth) * 100;
  
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "text-xs font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors",
        "hover:bg-red-500/30",
        healthPercent > 60 && "text-red-400",
        healthPercent <= 60 && healthPercent > 30 && "text-orange-400",
        healthPercent <= 30 && "text-red-500 animate-pulse"
      )}
      title="Click to view character sheet"
    >
      {combatStats.currentHealth}/{combatStats.maxHealth}
    </button>
  );
}

// Component showing what actions this companion likes/dislikes
function ActionPreferences({ companion, compact = false }: { companion: CompanionState; compact?: boolean }) {
  const approves = companion.personality.approves.slice(0, compact ? 3 : 5);
  const disapproves = companion.personality.disapproves.slice(0, compact ? 3 : 5);
  
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="flex items-center gap-0.5 text-emerald-400">
          <ThumbsUp className="w-3 h-3" />
          <span>{approves.length}</span>
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="flex items-center gap-0.5 text-red-400">
          <ThumbsDown className="w-3 h-3" />
          <span>{disapproves.length}</span>
        </span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {/* Approves */}
      <div>
        <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
          <ThumbsUp className="w-3 h-3" />
          <span className="font-medium">Approves</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {approves.map(action => {
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
      
      {/* Disapproves */}
      <div>
        <div className="flex items-center gap-1 text-xs text-red-400 mb-1">
          <ThumbsDown className="w-3 h-3" />
          <span className="font-medium">Dislikes</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {disapproves.map(action => {
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
  );
}

// Recent memory display showing positive/negative reactions
function RecentReactions({ 
  companion,
  onResolveGrievance 
}: { 
  companion: CompanionState;
  onResolveGrievance?: (grievance: { id: string; description: string; severity: number }) => void;
}) {
  // Get recent memories (last 5 with affinity changes)
  const recentMemories = useMemo(() => {
    return companion.memories
      .filter(m => m.affinityChange !== 0 && !m.forgotten)
      .slice(-5)
      .reverse();
  }, [companion.memories]);
  
  // Get grievances from autonomy manager
  const grievances = useMemo(() => {
    return companionAutonomyManager.getUnresolvedGrievances(companion.id);
  }, [companion.id]);
  
  if (recentMemories.length === 0 && grievances.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {/* Grievances (serious negative feelings) */}
      {grievances.length > 0 && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="flex items-center justify-between text-xs text-red-400 font-medium mb-2">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Grievances ({grievances.length})
            </span>
            {onResolveGrievance && (
              <span className="text-red-400/60 text-[10px]">Click to address</span>
            )}
          </div>
          <div className="space-y-1.5">
            {grievances.map(g => (
              <button
                key={g.id}
                onClick={() => onResolveGrievance?.(g)}
                disabled={!onResolveGrievance}
                className={cn(
                  "w-full text-left flex items-center gap-2 p-1.5 rounded transition-colors",
                  onResolveGrievance 
                    ? "hover:bg-red-500/20 cursor-pointer group"
                    : "cursor-default"
                )}
              >
                <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-300/80 flex-1 truncate">
                  {g.description}
                </span>
                {onResolveGrievance && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HandHeart className="w-3 h-3" />
                    Resolve
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent reactions */}
      <div>
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Brain className="w-3 h-3" />
          Recent Reactions
        </p>
        <div className="space-y-1">
          {recentMemories.map((memory, i) => (
            <div 
              key={`${memory.timestamp}-${i}`}
              className={cn(
                "flex items-center gap-2 text-xs px-2 py-1 rounded",
                memory.affinityChange > 0 
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              {memory.affinityChange > 0 ? (
                <ThumbsUp className="w-3 h-3 flex-shrink-0" />
              ) : (
                <ThumbsDown className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="truncate flex-1">{memory.description}</span>
              <span className={cn(
                "font-mono text-xs",
                memory.affinityChange > 0 ? "text-emerald-300" : "text-red-300"
              )}>
                {memory.affinityChange > 0 ? '+' : ''}{memory.affinityChange}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompanionPanel({ isOpen, onClose, onCompanionSpeak, onEnterScene, genre = 'fantasy', currentScene = '' }: CompanionPanelProps) {
  const [companions, setCompanions] = useState<CompanionState[]>([]);
  const [activeCompanions, setActiveCompanions] = useState<CompanionState[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRecruitMenu, setShowRecruitMenu] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionState | null>(null);
  const [showCreatorWizard, setShowCreatorWizard] = useState(false);
  
  // Grievance resolution state
  const [grievanceDialogOpen, setGrievanceDialogOpen] = useState(false);
  const [grievanceToResolve, setGrievanceToResolve] = useState<{
    companion: CompanionState;
    grievance: { id: string; description: string; severity: number };
  } | null>(null);
  
  // Journal state
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalCompanion, setJournalCompanion] = useState<CompanionState | null>(null);

  // Refresh companion list
  const refreshCompanions = () => {
    setCompanions(companionSystem.getAllCompanions());
    setActiveCompanions(companionSystem.getActiveCompanions());
  };

  useEffect(() => {
    if (isOpen) {
      refreshCompanions();
    }
  }, [isOpen]);

  const handleRecruit = (companionId: string) => {
    const partyFull = partySize.current >= partySize.max;
    
    // If party is full, dismiss the last active member first
    if (partyFull && activeCompanions.length > 0) {
      const lastActive = activeCompanions[activeCompanions.length - 1];
      companionSystem.dismissCompanion(lastActive.id, 'player');
      toast.info(`${lastActive.name} stepped aside.`);
    }
    
    const result = companionSystem.recruitCompanion(companionId);
    if (result.success) {
      toast.success(result.message);
      refreshCompanions();
    } else {
      toast.error(result.message);
    }
  };

  const handleDismiss = (companionId: string) => {
    const companion = companionSystem.getCompanion(companionId);
    if (companion) {
      companionSystem.dismissCompanion(companionId, 'player');
      toast.info(`${companion.name} has left the party.`);
      refreshCompanions();
    }
  };

  const handleCreateTestCompanion = (templateKey: string) => {
    const id = `companion_${Date.now()}`;
    const names: Record<string, string> = {
      loyal_warrior: 'Sir Roland',
      cunning_rogue: 'Vex Shadowmere',
      mysterious_mage: 'Arcana Veil',
      fierce_huntress: 'Sylva Windrunner',
    };
    
    companionSystem.createCompanion(
      id,
      names[templateKey] || 'Unknown',
      templateKey as keyof typeof COMPANION_TEMPLATES
    );
    
    toast.success(`${names[templateKey]} is now available to recruit!`);
    refreshCompanions();
    setShowRecruitMenu(false);
  };

  const handleCompanionCreated = (companion: CompanionState) => {
    refreshCompanions();
    setShowCreatorWizard(false);
    toast.success(`${companion.name} has been created!`, {
      description: 'They will appear when the time is right.',
    });
  };

  const partySize = companionSystem.getPartySize();

  if (!isOpen) return null;

  return (
    <>
      {/* Companion Creator Wizard V2 */}
      <CompanionCreatorWizardV2
        isOpen={showCreatorWizard}
        onClose={() => setShowCreatorWizard(false)}
        onCompanionCreated={handleCompanionCreated}
        genre={genre}
      />

      {/* Character Sheet Modal */}
      {selectedCompanion && (
        <CompanionCharacterSheet
          companion={selectedCompanion}
          isOpen={!!selectedCompanion}
          onClose={() => setSelectedCompanion(null)}
        />
      )}

      {/* Grievance Resolution Dialog */}
      {grievanceToResolve && (
        <GrievanceResolutionDialog
          open={grievanceDialogOpen}
          onOpenChange={setGrievanceDialogOpen}
          companion={grievanceToResolve.companion}
          grievance={grievanceToResolve.grievance}
          onResolved={() => {
            setGrievanceToResolve(null);
            refreshCompanions();
          }}
        />
      )}
      
      {/* Companion Journal */}
      {journalCompanion && (
        <CompanionJournal
          isOpen={journalOpen}
          onClose={() => {
            setJournalOpen(false);
            setJournalCompanion(null);
          }}
          companion={journalCompanion}
          allCompanions={companions}
        />
      )}
      
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 rounded-2xl border border-primary/30 overflow-hidden"
        style={{
          background: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg text-foreground">Companions</h2>
              <span className="text-sm text-muted-foreground">
                Party: {partySize.current}/{partySize.max}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreatorWizard(true)}
              className="gap-1.5 shadow-lg shadow-primary/20"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecruitMenu(!showRecruitMenu)}
              disabled={partySize.current >= partySize.max}
              className="bg-background/50 hover:bg-background/80"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5">Recruit</span>
            </Button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-destructive/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Recruit Menu */}
        <AnimatePresence>
          {showRecruitMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border/40 overflow-hidden"
            >
              <div className="p-4 bg-muted/10">
                <h3 className="text-sm font-medium mb-3 text-foreground">Quick Templates</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(COMPANION_TEMPLATES).map((key) => {
                    const existing = companions.find(c => c.id.includes(key));
                    return (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="justify-start bg-background/50 hover:bg-background/80"
                        onClick={() => handleCreateTestCompanion(key)}
                        disabled={!!existing}
                      >
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {existing && <span className="ml-auto text-xs opacity-50">✓</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Companions - Scrollable */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
          {activeCompanions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active companions</p>
              <p className="text-sm">Recruit companions to join your party</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCompanions.map((companion) => (
                <CompanionCard
                  key={companion.id}
                  companion={companion}
                  isExpanded={expandedId === companion.id}
                  onToggle={() => setExpandedId(expandedId === companion.id ? null : companion.id)}
                  onDismiss={() => handleDismiss(companion.id)}
                  onSpeak={onCompanionSpeak}
                  onEnterScene={onEnterScene}
                  onOpenSheet={() => setSelectedCompanion(companion)}
                  onOpenJournal={() => {
                    setJournalCompanion(companion);
                    setJournalOpen(true);
                  }}
                  onResolveGrievance={(grievance) => {
                    setGrievanceToResolve({ companion, grievance });
                    setGrievanceDialogOpen(true);
                  }}
                  genre={genre}
                  currentScene={currentScene}
                />
              ))}
            </div>
          )}

          {/* Waiting/Available Companions */}
          {companions.filter(c => c.status === 'waiting').length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Available to Recruit</h3>
              <div className="space-y-2">
                {companions.filter(c => c.status === 'waiting').map((companion) => {
                  const partyFull = partySize.current >= partySize.max;
                  return (
                    <div
                      key={companion.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden",
                          "bg-background border border-border"
                        )}>
                          {companion.portrait ? (
                            <img src={companion.portrait} alt={companion.name} className="w-full h-full object-cover" />
                          ) : (
                            companion.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{companion.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {companion.combatRole || 'companion'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={partyFull ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRecruit(companion.id)}
                        className={partyFull ? "bg-primary hover:bg-primary/90" : ""}
                        title={partyFull ? "Join (will swap with last member)" : "Recruit to party"}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        <span className="text-xs">Join</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
    </>
  );
}

interface CompanionCardProps {
  companion: CompanionState;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onSpeak?: (companion: CompanionState, dialogue: string) => void;
  onEnterScene?: (companion: CompanionState, introNarrative: string) => void;
  onOpenSheet: () => void;
  onOpenJournal: () => void;
  onResolveGrievance?: (grievance: { id: string; description: string; severity: number }) => void;
  genre?: string;
  currentScene?: string;
}

function CompanionCard({ companion, isExpanded, onToggle, onDismiss, onSpeak, onEnterScene, onOpenSheet, onOpenJournal, onResolveGrievance, genre = 'fantasy', currentScene = '' }: CompanionCardProps) {
  const RoleIcon = roleIcons[companion.combatRole as keyof typeof roleIcons] || Users;
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [isGeneratingEntry, setIsGeneratingEntry] = useState(false);

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
      } else {
        // Use fallback dialogue
        const commentary = companionSystem.getCompanionCommentary('conversation');
        if (commentary) {
          onSpeak(companion, commentary.comment);
        }
      }
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
      // Use fallback
      const commentary = companionSystem.getCompanionCommentary('conversation');
      if (commentary) {
        onSpeak(companion, commentary.comment);
      }
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  // Generate entrance narrative and inject into scene
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
          customPrompt: `${companion.name} (a ${roleDescription} with traits: ${traitsDescription}) enters the current scene in a dramatic, personality-appropriate way. Describe their entrance in 2-3 sentences that match the scene context and their personality. They should say something characteristic of their personality.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const narrative = data.dialogue || `${companion.name} arrives, ready to join you.`;
        onEnterScene(companion, narrative);
        toast.success(`${companion.name} enters the scene!`);
      } else {
        // Fallback narrative
        const fallbackNarrative = `${companion.name} steps forward, ready to accompany you on this journey.`;
        onEnterScene(companion, fallbackNarrative);
        toast.success(`${companion.name} enters the scene!`);
      }
    } catch (error) {
      console.error('Failed to generate entrance:', error);
      const fallbackNarrative = `${companion.name} arrives at your side.`;
      onEnterScene(companion, fallbackNarrative);
      toast.success(`${companion.name} enters the scene!`);
    } finally {
      setIsGeneratingEntry(false);
    }
  };

  // Calculate relationship health indicator
  const relationshipHealth = useMemo(() => {
    const avg = (companion.trust + companion.respect + Math.max(0, companion.affinity + 100) / 2) / 3;
    if (avg >= 70) return { status: 'strong', color: 'border-emerald-500/50', glow: 'shadow-emerald-500/20' };
    if (avg >= 40) return { status: 'stable', color: 'border-primary/50', glow: 'shadow-primary/20' };
    if (avg >= 20) return { status: 'strained', color: 'border-amber-500/50', glow: 'shadow-amber-500/20' };
    return { status: 'critical', color: 'border-red-500/50', glow: 'shadow-red-500/20' };
  }, [companion.trust, companion.respect, companion.affinity]);

  // Get grievance count
  const grievanceCount = useMemo(() => {
    return companionAutonomyManager.getUnresolvedGrievances(companion.id).length;
  }, [companion.id]);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border-2 transition-all duration-300",
        "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
        relationshipHealth.color,
        isExpanded && relationshipHealth.glow,
        isExpanded && "shadow-lg"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with mood indicator and relationship ring */}
          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden",
              "bg-background border-2 transition-all duration-300",
              relationshipHealth.color,
              "group-hover:scale-105"
            )}>
              {companion.portrait ? (
                <img src={companion.portrait} alt={companion.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-display">{companion.name.charAt(0)}</span>
              )}
            </div>
            {/* Mood indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card",
              moodColors[companion.mood]
            )} title={`Mood: ${companion.mood}`} />
            
            {/* Grievance indicator */}
            {grievanceCount > 0 && (
              <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 border-2 border-card flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{grievanceCount}</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-medium text-base">{companion.name}</span>
              <RoleIcon className="w-4 h-4 text-muted-foreground" />
              <CompanionHealthBadge companion={companion} onClick={onOpenSheet} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                "capitalize px-1.5 py-0.5 rounded",
                moodColors[companion.mood]?.replace('bg-', 'bg-opacity-20 text-').replace('-400', '-300').replace('-500', '-300')
              )}>{companion.mood}</span>
              <span className="text-muted-foreground/50">|</span>
              <span className={cn(
                companion.affinity > 30 && "text-emerald-400",
                companion.affinity < -30 && "text-red-400"
              )}>
                {companion.affinity > 0 ? '+' : ''}{companion.affinity}
              </span>
              {companion.romanticInterest > 50 && (
                <Heart className="w-3 h-3 text-pink-400 fill-pink-400/50" />
              )}
              {/* Compact action preferences */}
              <ActionPreferences companion={companion} compact />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {companion.wantsToSpeak && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <MessageCircle className="w-5 h-5 text-primary" />
            </motion.div>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 border-t border-border/30">
              {/* Stats Grid - Enhanced */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <EnhancedStatBar label="Trust" value={companion.trust} color="from-blue-500 to-cyan-400" icon={Shield} />
                <EnhancedStatBar label="Respect" value={companion.respect} color="from-amber-500 to-yellow-400" icon={Star} />
                <EnhancedStatBar label="Fear" value={companion.fear} color="from-purple-500 to-violet-400" icon={AlertTriangle} />
                <EnhancedStatBar label="Romance" value={companion.romanticInterest} color="from-pink-500 to-rose-400" icon={Heart} />
              </div>

              {/* Action Preferences - What they like/dislike */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <ActionPreferences companion={companion} />
              </div>

              {/* Recent Reactions & Grievances */}
              <RecentReactions 
                companion={companion} 
                onResolveGrievance={onResolveGrievance}
              />

              {/* Personality Traits */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Personality
                </p>
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
              </div>

              {/* Internal Thoughts (if high trust) */}
              {companion.trust > 60 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm italic"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-primary text-xs font-medium not-italic">Thinking...</span>
                  </div>
                  <p className="text-muted-foreground">{companion.internalThoughts}</p>
                </motion.div>
              )}

              {/* Warnings */}
              {companion.affinity < companion.personality.departureThreshold + 20 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">Relationship critically strained - may leave soon</span>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-background/50 hover:bg-background/80"
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
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
                    onClick={handleEnterScene}
                    disabled={isGeneratingEntry || isGeneratingDialogue}
                    title="Have this companion dramatically enter the current scene"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    {isGeneratingEntry ? 'Entering...' : 'Enter Scene'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary hover:text-primary/80 hover:border-primary/50 hover:bg-primary/10"
                  onClick={onOpenJournal}
                  title="View relationship journal"
                >
                  <Book className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:border-red-400/50 hover:bg-red-500/10"
                  onClick={onDismiss}
                  title="Dismiss from party"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorClassName={color} />
    </div>
  );
}

// Enhanced stat bar with gradient and icon
function EnhancedStatBar({ 
  label, 
  value, 
  color, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className={cn(
          "font-mono font-medium",
          value >= 70 && "text-emerald-400",
          value < 30 && "text-red-400"
        )}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            color
          )}
        />
      </div>
    </div>
  );
}
