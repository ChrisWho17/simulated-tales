import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RPGCharacter, getStatModifier, CharacterStats, calculateMaxHealth } from '@/types/rpgCharacter';
import { GENRE_DATA, GameGenre } from '@/types/genreData';
import { 
  X, Heart, Coins, Shield, Sword, Wand2, Star, Backpack, 
  Plus, Minus, Sparkles, User, RefreshCw, Loader2, Activity,
  BookHeart, ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ModifierDisplay, calculateEffectiveStats } from './ModifierDisplay';
import { ModifierState, Modifier } from '@/game/buffDebuffSystem';
import { MoodHistoryDropdown } from '@/components/game/MoodHistoryDropdown';
import { MoodState, deriveMoodFromStats, CoreMoodType } from '@/game/moodSystem';
import { useGame } from '@/contexts/GameContext';
import { 
  getRomanticJournals, 
  getAllJournals,
  getMomentTypeInfo, 
  getMilestoneInfo,
  NPCRelationshipJournal,
  RelationshipMoment,
  MilestoneType
} from '@/lib/relationshipJournal';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CharacterSheetProps {
  character: RPGCharacter & { portraitUrl?: string };
  onClose: () => void;
  onUpdateCharacter: (character: RPGCharacter & { portraitUrl?: string }) => void;
  modifierState?: ModifierState;
  moodState?: MoodState;
  genre?: GameGenre;
  onJumpToMessage?: (messageId: string, turnId: number) => void;
  onMoodChange?: (newMood: CoreMoodType) => void;
}

// Helper to find class/background across all genres
function findClassAcrossGenres(classId: string) {
  for (const genre of Object.keys(GENRE_DATA) as GameGenre[]) {
    const found = GENRE_DATA[genre].classes.find(c => c.id === classId);
    if (found) return found;
  }
  return null;
}

function findBackgroundAcrossGenres(backgroundId: string) {
  for (const genre of Object.keys(GENRE_DATA) as GameGenre[]) {
    const found = GENRE_DATA[genre].backgrounds.find(b => b.id === backgroundId);
    if (found) return found;
  }
  return null;
}

// Level up stat allocation component
function LevelUpModal({ 
  character, 
  onConfirm, 
  onCancel 
}: { 
  character: RPGCharacter; 
  onConfirm: (newStats: CharacterStats) => void; 
  onCancel: () => void;
}) {
  const POINTS_PER_LEVEL = 2;
  const [statAllocation, setStatAllocation] = useState<Record<keyof CharacterStats, number>>({
    strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0
  });

  const pointsSpent = Object.values(statAllocation).reduce((sum, val) => sum + val, 0);
  const pointsRemaining = POINTS_PER_LEVEL - pointsSpent;

  const adjustStat = (stat: keyof CharacterStats, delta: number) => {
    const current = statAllocation[stat];
    const newValue = current + delta;
    if (newValue < 0) return;
    if (delta > 0 && pointsRemaining <= 0) return;
    setStatAllocation(prev => ({ ...prev, [stat]: newValue }));
  };

  const handleConfirm = () => {
    const newStats: CharacterStats = {
      strength: character.stats.strength + statAllocation.strength,
      dexterity: character.stats.dexterity + statAllocation.dexterity,
      constitution: character.stats.constitution + statAllocation.constitution,
      intelligence: character.stats.intelligence + statAllocation.intelligence,
      wisdom: character.stats.wisdom + statAllocation.wisdom,
      charisma: character.stats.charisma + statAllocation.charisma,
    };
    onConfirm(newStats);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-card border-2 border-primary/50 rounded-lg w-full max-w-md animate-fade-in">
        <div className="p-6 border-b border-border text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
          <h2 className="text-2xl font-narrative font-bold text-gradient-gold">Level Up!</h2>
          <p className="text-muted-foreground mt-1">
            {character.name} has reached Level {character.level + 1}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <span className="text-lg font-semibold text-primary">{pointsRemaining}</span>
            <span className="text-muted-foreground"> stat points remaining</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => (
              <div key={stat} className="bg-background/50 rounded-lg p-3 border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">{stat.slice(0, 3)}</div>
                    <div className="font-bold">
                      {character.stats[stat]}
                      {statAllocation[stat] > 0 && (
                        <span className="text-primary ml-1">+{statAllocation[stat]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => adjustStat(stat, -1)}
                      disabled={statAllocation[stat] === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => adjustStat(stat, 1)}
                      disabled={pointsRemaining === 0}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Later
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            disabled={pointsRemaining > 0}
          >
            Confirm Level Up
          </Button>
        </div>
      </div>
    </div>
  );
}

// Simple Portrait Display Component
function PortraitDisplay({ 
  character,
  onUpdatePortrait 
}: { 
  character: RPGCharacter & { portraitUrl?: string };
  onUpdatePortrait: (url: string) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const charClass = findClassAcrossGenres(character.classId);

  const handleRegeneratePortrait = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-portrait', {
        body: {
          appearance: `Character portrait for ${character.name}, a Level ${character.level} ${charClass?.name || 'adventurer'}. Heroic, confident expression.`,
          characterClass: charClass?.name || 'Adventurer',
          genre: 'fantasy',
          name: character.name,
          detailLevel: 'detailed',
          portraitHints: charClass?.portraitHints || [],
          clothingStyle: charClass?.clothingStyle,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const url = response.data?.imageUrl;
      if (url) {
        onUpdatePortrait(url);
        toast.success('Portrait updated!');
      }
    } catch (error) {
      console.error('Failed to regenerate portrait:', error);
      toast.error('Failed to regenerate portrait');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Portrait Display */}
      <div className="relative">
        <div className="w-full aspect-square max-w-[200px] mx-auto rounded-lg border-2 border-primary/30 overflow-hidden bg-background/50">
          {character.portraitUrl ? (
            <img 
              src={character.portraitUrl} 
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Regenerate Button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2 h-8 text-xs"
          onClick={handleRegeneratePortrait}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function CharacterSheet({ character, onClose, onUpdateCharacter, modifierState, moodState, genre = 'fantasy', onJumpToMessage, onMoodChange }: CharacterSheetProps) {
  const { settings } = useGame();
  const charClass = findClassAcrossGenres(character.classId);
  const background = findBackgroundAcrossGenres(character.backgroundId);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const currentMood = moodState?.currentMood || deriveMoodFromStats({
    stress: 20,
    health: character.currentHealth,
    energy: 100
  });

  // Calculate effective stats with modifier effects
  const { effectiveStats, statChanges } = useMemo(() => {
    if (!modifierState || modifierState.activeModifiers.length === 0) {
      return { effectiveStats: character.stats, statChanges: {} };
    }
    const result = calculateEffectiveStats(
      character.stats as unknown as Record<string, number>,
      modifierState.activeModifiers
    );
    return { 
      effectiveStats: result.stats as unknown as CharacterStats, 
      statChanges: result.changes 
    };
  }, [character.stats, modifierState]);

  const formatMod = (stat: number, statKey?: string) => {
    const mod = getStatModifier(stat);
    const change = statKey ? (statChanges[statKey] || 0) : 0;
    const baseStr = mod >= 0 ? `+${mod}` : `${mod}`;
    return { baseStr, change };
  };

  const xpToNextLevel = character.level * 100;
  const xpProgress = (character.experience / xpToNextLevel) * 100;
  const canLevelUp = character.experience >= xpToNextLevel;

  const handleLevelUp = (newStats: CharacterStats) => {
    const newLevel = character.level + 1;
    const newMaxHealth = calculateMaxHealth(newStats, newLevel);
    const healthIncrease = newMaxHealth - character.maxHealth;
    
    onUpdateCharacter({
      ...character,
      level: newLevel,
      stats: newStats,
      maxHealth: newMaxHealth,
      currentHealth: character.currentHealth + healthIncrease,
      experience: character.experience - xpToNextLevel,
    });
    setShowLevelUp(false);
  };

  const handlePortraitUpdate = (url: string) => {
    onUpdateCharacter({
      ...character,
      portraitUrl: url,
    } as any);
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-2xl h-[85vh] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-start p-4 md:p-6 border-b border-border flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl md:text-2xl font-narrative font-bold text-gradient-gold">
                {character.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Level {character.level} {charClass?.name || 'Adventurer'} • {background?.name || 'Unknown Origin'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 md:p-6 space-y-6">
              {/* Portrait */}
              <PortraitDisplay 
                character={character}
                onUpdatePortrait={handlePortraitUpdate}
              />

              {/* Health & Resources */}
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="bg-background/50 rounded-lg p-3 md:p-4 border border-border/30">
                  <div className="flex items-center gap-1.5 md:gap-2 text-destructive mb-1 md:mb-2">
                    <Heart className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold text-xs md:text-sm">Health</span>
                  </div>
                  <div className="text-lg md:text-2xl font-bold">
                    {character.currentHealth}/{character.maxHealth}
                  </div>
                  <div className="h-1.5 md:h-2 bg-muted rounded-full mt-1.5 md:mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-destructive transition-all"
                      style={{ width: `${(character.currentHealth / character.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-3 md:p-4 border border-border/30">
                  <div className="flex items-center gap-1.5 md:gap-2 text-warning mb-1 md:mb-2">
                    <Coins className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold text-xs md:text-sm">Gold</span>
                  </div>
                  <div className="text-lg md:text-2xl font-bold">{character.gold}</div>
                </div>

                <div className="bg-background/50 rounded-lg p-3 md:p-4 border border-border/30 relative">
                  <div className="flex items-center gap-1.5 md:gap-2 text-primary mb-1 md:mb-2">
                    <Star className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-semibold text-xs md:text-sm">XP</span>
                  </div>
                  <div className="text-lg md:text-2xl font-bold">{character.experience}/{xpToNextLevel}</div>
                  <div className="h-1.5 md:h-2 bg-muted rounded-full mt-1.5 md:mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${canLevelUp ? 'bg-primary animate-pulse' : 'bg-primary'}`}
                      style={{ width: `${Math.min(xpProgress, 100)}%` }}
                    />
                  </div>
                  {canLevelUp && (
                    <Button
                      size="sm"
                      className="absolute -top-2 -right-2 h-7 text-xs animate-bounce"
                      onClick={() => setShowLevelUp(true)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Level Up!
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Shield className="w-4 h-4" />
                  Attributes
                </h3>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => {
                    const { baseStr, change } = formatMod(effectiveStats[stat], stat);
                    const hasChange = change !== 0;
                    return (
                      <div 
                        key={stat} 
                        className="bg-background/50 rounded-lg p-2 md:p-3 border border-border/30 text-center"
                      >
                        <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                          {stat.slice(0, 3)}
                        </div>
                        <div className="text-lg md:text-xl font-bold mt-0.5 flex items-center justify-center gap-1">
                          <span>{effectiveStats[stat]}</span>
                          {hasChange && (
                            <span className={`text-xs ${change > 0 ? 'text-modifier-buff' : 'text-modifier-critical'}`}>
                              ({change > 0 ? '+' : ''}{change})
                            </span>
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-primary">{baseStr}</div>
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Traits */}
              {character.traits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-3 text-sm md:text-base">Personality</h3>
                  <div className="flex flex-wrap gap-2">
                    {character.traits.map((trait) => (
                      <span 
                        key={trait}
                        className="px-2 md:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood Section */}
              <div className="space-y-3">
                <MoodHistoryDropdown
                  currentMood={currentMood}
                  moodHistory={moodState?.moodHistory || []}
                  genre={genre}
                  manualMoodEnabled={settings.manualMoodControl}
                  onMoodChange={onMoodChange}
                />
              </div>

              {/* Abilities & Skills */}
              <div className="grid md:grid-cols-2 gap-4">
                {character.abilities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                      <Wand2 className="w-4 h-4" />
                      Abilities
                    </h3>
                    <div className="space-y-2">
                      {character.abilities.map((ability) => (
                        <div 
                          key={ability}
                          className="px-3 py-2 bg-background/50 rounded border border-border/30 text-xs md:text-sm"
                        >
                          {ability}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {character.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                      <Sword className="w-4 h-4" />
                      Skills
                    </h3>
                    <div className="space-y-2">
                      {character.skills.map((skill) => (
                        <div 
                          key={skill}
                          className="px-3 py-2 bg-background/50 rounded border border-border/30 text-xs md:text-sm"
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Section - includes items and active effects */}
              <div className="space-y-4">
                <h3 className="font-semibold text-primary flex items-center gap-2 text-sm md:text-base">
                  <Backpack className="w-4 h-4" />
                  Inventory & Status
                </h3>
                
                {/* Items */}
                {character.inventory.length > 0 && (
                  <div className="bg-background/30 rounded-lg p-3 border border-border/20">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Items ({character.inventory.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {character.inventory.map((item) => (
                        <div 
                          key={item.id}
                          className="px-3 py-2 bg-background/50 rounded border border-border/30 text-xs md:text-sm"
                        >
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Effects (Buffs/Debuffs) */}
                {modifierState && (
                  <div className="bg-background/30 rounded-lg p-3 border border-border/20">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" />
                      Active Conditions
                    </h4>
                    <ModifierDisplay modifierState={modifierState} onJumpToMessage={onJumpToMessage} />
                  </div>
                )}
              </div>

              {/* Relationship Journal Section - Only shown when 18+ is enabled */}
              {settings.adultContent && <RelationshipJournalSection />}

              {/* Bottom padding for mobile safe area */}
              <div className="h-6 md:h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Level Up Modal */}
      {showLevelUp && (
        <LevelUpModal
          character={character}
          onConfirm={handleLevelUp}
          onCancel={() => setShowLevelUp(false)}
        />
      )}
    </>
  );
}

// Relationship Journal Section Component - Enhanced with color coding and detail modal
function RelationshipJournalSection() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<NPCRelationshipJournal | null>(null);
  const journals = useMemo(() => getAllJournals(), []);
  
  if (journals.length === 0) {
    return (
      <div className="space-y-3 border-t border-border/30 pt-4 mt-4">
        <h3 className="font-semibold text-primary flex items-center gap-2 text-sm md:text-base">
          <BookHeart className="w-4 h-4" />
          Relationship Journal
        </h3>
        <p className="text-xs text-muted-foreground italic px-3 py-4 bg-background/30 rounded-lg border border-border/20">
          Your journey has yet to begin. Meet characters and build meaningful connections to fill this journal.
        </p>
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-3 border-t border-border/30 pt-4 mt-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between hover:text-primary transition-colors">
            <h3 className="font-semibold text-primary flex items-center gap-2 text-sm md:text-base">
              <BookHeart className="w-4 h-4" />
              Relationship Journal
              <span className="text-xs text-muted-foreground font-normal">
                ({journals.length} {journals.length === 1 ? 'connection' : 'connections'})
              </span>
            </h3>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {journals.map(journal => (
                <JournalCard 
                  key={journal.npcId} 
                  journal={journal} 
                  onClick={() => setSelectedJournal(journal)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {/* Detail Modal */}
      {selectedJournal && (
        <JournalDetailModal 
          journal={selectedJournal} 
          onClose={() => setSelectedJournal(null)} 
        />
      )}
    </>
  );
}

// Color-coded clickable card for each NPC
function JournalCard({ journal, onClick }: { journal: NPCRelationshipJournal; onClick: () => void }) {
  const milestoneInfo = getMilestoneInfo(journal.currentMilestone);
  
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border ${milestoneInfo.borderColor} ${milestoneInfo.bgColor} 
        hover:scale-[1.02] hover:shadow-lg transition-all text-left group`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{milestoneInfo.icon}</span>
        <span className="font-medium text-sm truncate">{journal.npcName}</span>
      </div>
      <p className={`text-xs ${milestoneInfo.color} font-medium`}>
        {milestoneInfo.label}
      </p>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        {journal.romanticMoments > 0 && (
          <span className="text-pink-400">💕 {journal.romanticMoments}</span>
        )}
        <span>📝 {journal.totalMoments}</span>
      </div>
    </button>
  );
}

// Detailed modal for viewing full relationship history
function JournalDetailModal({ journal, onClose }: { journal: NPCRelationshipJournal; onClose: () => void }) {
  const milestoneInfo = getMilestoneInfo(journal.currentMilestone);
  const [filter, setFilter] = useState<'all' | 'romantic' | 'milestone'>('all');
  
  const filteredMoments = useMemo(() => {
    switch (filter) {
      case 'romantic':
        return journal.moments.filter(m => m.isRomantic);
      case 'milestone':
        return journal.moments.filter(m => m.isMilestone);
      default:
        return journal.moments;
    }
  }, [journal.moments, filter]);
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className={`bg-card border-2 ${milestoneInfo.borderColor} rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 ${milestoneInfo.bgColor} border-b ${milestoneInfo.borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{milestoneInfo.icon}</span>
              <div>
                <h3 className="text-xl font-narrative font-bold">{journal.npcName}</h3>
                <p className={`text-sm ${milestoneInfo.color} font-medium`}>{milestoneInfo.label}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-muted-foreground">
              📝 {journal.totalMoments} moments
            </span>
            {journal.romanticMoments > 0 && (
              <span className="text-pink-400">
                💕 {journal.romanticMoments} romantic
              </span>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 p-2 border-b border-border/30 bg-background/50">
          {(['all', 'romantic', 'milestone'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === tab 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {tab === 'all' && '📖 All'}
              {tab === 'romantic' && '💕 Romantic'}
              {tab === 'milestone' && '⭐ Milestones'}
            </button>
          ))}
        </div>
        
        {/* Moments List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredMoments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No {filter === 'all' ? '' : filter} moments recorded yet.
            </p>
          ) : (
            filteredMoments.map(moment => (
              <DetailedMomentEntry key={moment.id} moment={moment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Detailed moment entry for the modal
function DetailedMomentEntry({ moment }: { moment: RelationshipMoment }) {
  const typeInfo = getMomentTypeInfo(moment.type);
  const milestoneInfo = moment.milestoneType ? getMilestoneInfo(moment.milestoneType) : null;
  
  return (
    <div className={`p-3 rounded-lg bg-background/40 border-l-4 ${
      moment.isMilestone 
        ? milestoneInfo?.borderColor || 'border-l-amber-500' 
        : moment.isRomantic 
          ? 'border-l-pink-500' 
          : 'border-l-border'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{typeInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {moment.isMilestone && milestoneInfo && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${milestoneInfo.bgColor} ${milestoneInfo.color}`}>
                → {milestoneInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">{moment.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span>{moment.dateString}</span>
            {moment.emotionalImpact !== 0 && (
              <span className={moment.emotionalImpact > 0 ? 'text-green-400' : 'text-red-400'}>
                {moment.emotionalImpact > 0 ? '❤️' : '💔'} {moment.emotionalImpact > 0 ? '+' : ''}{moment.emotionalImpact}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Legacy components for backward compatibility
function JournalEntry({ journal }: { journal: NPCRelationshipJournal }) {
  const [expanded, setExpanded] = useState(false);
  const milestoneInfo = getMilestoneInfo(journal.currentMilestone);
  const recentMoments = journal.moments.slice(0, expanded ? 10 : 3);
  
  return (
    <div className={`rounded-lg border ${milestoneInfo.borderColor} ${milestoneInfo.bgColor} overflow-hidden`}>
      {/* NPC Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-background/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{milestoneInfo.icon}</span>
          <div className="text-left">
            <p className="font-medium text-sm">{journal.npcName}</p>
            <p className={`text-xs ${milestoneInfo.color}`}>{milestoneInfo.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {journal.romanticMoments > 0 && (
            <span className="text-xs text-pink-400">
              💕 {journal.romanticMoments}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {/* Moments */}
      <div className="px-3 pb-3 space-y-2">
        {recentMoments.map(moment => (
          <MomentEntry key={moment.id} moment={moment} />
        ))}
        
        {journal.moments.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors py-1"
          >
            {expanded 
              ? `Show less` 
              : `+ ${journal.moments.length - 3} more moments`
            }
          </button>
        )}
      </div>
    </div>
  );
}

// Individual Moment Entry
function MomentEntry({ moment }: { moment: RelationshipMoment }) {
  const typeInfo = getMomentTypeInfo(moment.type);
  
  return (
    <div className={`flex items-start gap-2 p-2 rounded bg-background/40 border-l-2 ${
      moment.isRomantic ? 'border-l-pink-500' : moment.isMilestone ? 'border-l-amber-500' : 'border-l-border'
    }`}>
      <span className="text-sm flex-shrink-0">{typeInfo.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed">{moment.description}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{moment.dateString}</p>
      </div>
    </div>
  );
}
