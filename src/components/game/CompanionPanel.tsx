import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Heart, Shield, Sword, Zap, Brain, 
  ChevronDown, ChevronUp, X, UserPlus, UserMinus,
  MessageCircle, Star, AlertTriangle, Wand2
} from 'lucide-react';
import { 
  companionSystem, 
  CompanionState, 
  CompanionMood,
  COMPANION_TEMPLATES 
} from '@/game/companionSystem';
import { companionCombatManager } from '@/game/companionCombatSystem';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CompanionCharacterSheet } from './CompanionCharacterSheet';
import { CompanionCreatorWizard } from '@/components/companion';

interface CompanionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanionSpeak?: (companion: CompanionState, dialogue: string) => void;
  genre?: string;
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

export function CompanionPanel({ isOpen, onClose, onCompanionSpeak, genre = 'fantasy' }: CompanionPanelProps) {
  const [companions, setCompanions] = useState<CompanionState[]>([]);
  const [activeCompanions, setActiveCompanions] = useState<CompanionState[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRecruitMenu, setShowRecruitMenu] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionState | null>(null);
  const [showCreatorWizard, setShowCreatorWizard] = useState(false);

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
      {/* Companion Creator Wizard */}
      <CompanionCreatorWizard
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
                  onOpenSheet={() => setSelectedCompanion(companion)}
                />
              ))}
            </div>
          )}

          {/* Waiting/Available Companions */}
          {companions.filter(c => c.status === 'waiting').length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Available to Recruit</h3>
              <div className="space-y-2">
                {companions.filter(c => c.status === 'waiting').map((companion) => (
                  <div
                    key={companion.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        "bg-background border border-border"
                      )}>
                        {companion.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{companion.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {companion.combatRole || 'companion'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecruit(companion.id)}
                      disabled={partySize.current >= partySize.max}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
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
  onOpenSheet: () => void;
}

function CompanionCard({ companion, isExpanded, onToggle, onDismiss, onSpeak, onOpenSheet }: CompanionCardProps) {
  const RoleIcon = roleIcons[companion.combatRole as keyof typeof roleIcons] || Users;
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);

  const handleTalk = async () => {
    if (!onSpeak) return;
    
    setIsGeneratingDialogue(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-companion-dialogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <motion.div
      layout
      className={cn(
        "rounded-lg border transition-colors",
        "bg-card/50 border-border/50",
        isExpanded && "border-primary/30"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with mood indicator */}
          <div className="relative">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
              "bg-background border-2 border-border"
            )}>
              {companion.name.charAt(0)}
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
              moodColors[companion.mood]
            )} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{companion.name}</span>
              <RoleIcon className="w-3 h-3 text-muted-foreground" />
              <CompanionHealthBadge companion={companion} onClick={onOpenSheet} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{companion.mood}</span>
              <span>•</span>
              <span>Affinity: {companion.affinity}</span>
              {companion.romanticInterest > 50 && (
                <>
                  <span>•</span>
                  <Heart className="w-3 h-3 text-pink-400" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {companion.wantsToSpeak && (
            <MessageCircle className="w-4 h-4 text-primary animate-pulse" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatBar label="Trust" value={companion.trust} color="bg-blue-400" />
                <StatBar label="Respect" value={companion.respect} color="bg-amber-400" />
                <StatBar label="Fear" value={companion.fear} color="bg-purple-400" />
                <StatBar label="Romance" value={companion.romanticInterest} color="bg-pink-400" />
              </div>

              {/* Personality Traits */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Personality</p>
                <div className="flex flex-wrap gap-1">
                  {companion.personality.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2 py-0.5 text-xs rounded-full bg-muted/50 capitalize"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Internal Thoughts (if high trust) */}
              {companion.trust > 60 && (
                <div className="p-2 rounded bg-muted/30 text-xs italic">
                  <Brain className="w-3 h-3 inline mr-1" />
                  <span className="opacity-70">Thinking:</span> {companion.internalThoughts}
                </div>
              )}

              {/* Warnings */}
              {companion.affinity < companion.personality.departureThreshold + 20 && (
                <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Relationship strained - may leave soon</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleTalk}
                  disabled={isGeneratingDialogue}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {isGeneratingDialogue ? 'Thinking...' : 'Talk'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:border-red-400/50"
                  onClick={onDismiss}
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
