import { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatBar, CircularStat } from '@/components/ui/stat-bar';
import { AtmosphericBackground } from '@/components/ui/particle-background';
import { Send, RotateCcw, Settings, Loader2, Heart, Coins, Backpack, ImageIcon, Zap, Brain, Shield, Sliders } from 'lucide-react';
import { RPGCharacter, getStatModifier, CHARACTER_CLASSES, CHARACTER_BACKGROUNDS } from '@/types/rpgCharacter';
import { DiceRollModal } from './DiceRollModal';
import { CharacterSheet } from './CharacterSheet';
import { StoryRollbackModal } from './StoryRollbackModal';
import { SceneIllustration } from '@/components/game/SceneIllustration';
import { DiceRollDisplay } from '@/components/game/DiceRollDisplay';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { useDiceRoll, toDicePlayer } from '@/hooks/useDiceRoll';
import { useGameOptional } from '@/contexts/GameContext';
import { DiceRollResult } from '@/game/diceSystem';
import { cleanNarrativeForDisplay } from '@/lib/narrativeFilter';
import { saveGame, GameSave } from '@/lib/saveSystem';
import { useToast } from '@/hooks/use-toast';

interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

interface PendingRoll {
  stat: string;
  difficulty: number;
  reason: string;
}

interface GameMechanics {
  rollRequired?: PendingRoll;
  xpGained?: { amount: number; reason: string };
  goldGained?: number;
  lootGained?: string;
  damage?: number;
  heal?: number;
}

interface AdventureDisplayProps {
  story: StoryEntry[];
  onPlayerAction: (action: string, diceRoll?: any) => void;
  onRestart: () => void;
  onLoadSave?: (save: GameSave) => void;
  onRollbackToEntry?: (entryIndex: number) => void;
  isLoading: boolean;
  cheatMode: boolean;
  onToggleCheatMode: () => void;
  character: RPGCharacter;
  onUpdateCharacter: (character: RPGCharacter) => void;
  pendingMechanics?: GameMechanics;
  onClearMechanics: () => void;
  onGenerateImage: (entryId: string) => void;
  generatingImageFor?: string;
  sceneImageUrl?: string | null;
  isGeneratingScene?: boolean;
  onCloseSceneImage?: () => void;
}

export function AdventureDisplay({
  story,
  onPlayerAction,
  onRestart,
  onLoadSave,
  onRollbackToEntry,
  isLoading,
  cheatMode,
  onToggleCheatMode,
  character,
  onUpdateCharacter,
  pendingMechanics,
  onClearMechanics,
  onGenerateImage,
  generatingImageFor,
  sceneImageUrl,
  isGeneratingScene,
  onCloseSceneImage,
}: AdventureDisplayProps) {
  const [input, setInput] = useState('');
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentDiceRoll, setCurrentDiceRoll] = useState<DiceRollResult | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ index: number; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const gameContext = useGameOptional();
  const diceMode = gameContext?.diceMode ?? 'story';
  const { performRoll, shouldShowRoll, clearRoll } = useDiceRoll();
  const { toast } = useToast();

  // Long press handlers for story rollback
  const handleLongPressStart = useCallback((index: number, text: string) => {
    // Don't allow rollback to the very first entry
    if (index === 0) return;
    
    longPressTimer.current = setTimeout(() => {
      setRollbackTarget({ index, text });
    }, 600); // 600ms long press
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleRollbackConfirm = useCallback(() => {
    if (rollbackTarget && onRollbackToEntry) {
      onRollbackToEntry(rollbackTarget.index);
      toast({
        title: "Returned to earlier moment",
        description: "Your story continues from here...",
        duration: 3000,
      });
    }
    setRollbackTarget(null);
  }, [rollbackTarget, onRollbackToEntry, toast]);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    const gameState = {
      story,
      character,
      timestamp: Date.now()
    };
    
    // Include campaign memory in save if available
    const campaignMem = gameContext?.campaignMemory ?? undefined;
    saveGame(character.name, gameState, false, campaignMem);
    
    toast({
      title: "Adventure Saved",
      description: `${character.name}'s progress has been saved.`,
      duration: 3000,
    });
  }, [story, character, toast, gameContext?.campaignMemory]);

  // Load save handler - delegates to parent for actual state restoration
  const handleLoadSave = useCallback((save: GameSave) => {
    if (onLoadSave) {
      onLoadSave(save);
    }
    toast({
      title: "Save Loaded",
      description: `Restored ${save.characterName}'s adventure.`,
      duration: 3000,
    });
  }, [onLoadSave, toast]);

  // Auto-save every 5 minutes when enabled
  useEffect(() => {
    const autoSaveEnabled = gameContext?.settings?.autoSave ?? true;
    
    if (!autoSaveEnabled || !character?.name) return;
    
    const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const performAutoSave = () => {
      const gameState = {
        story,
        character,
        timestamp: Date.now()
      };
      
      // Include campaign memory in auto-save
      const campaignMem = gameContext?.campaignMemory ?? undefined;
      saveGame(character.name, gameState, true, campaignMem);
      
      // Subtle toast notification for auto-save
      toast({
        title: "Progress saved",
        description: `${character.name}'s adventure auto-saved`,
        duration: 2000,
      });
      
      console.log(`[Auto-Save] ${character.name}'s adventure saved at ${new Date().toLocaleTimeString()}`);
    };
    
    // Set up interval
    const intervalId = setInterval(performAutoSave, AUTO_SAVE_INTERVAL);
    
    // Cleanup on unmount or when settings change
    return () => clearInterval(intervalId);
  }, [gameContext?.settings?.autoSave, gameContext?.campaignMemory, character, story, toast]);

  // NOTE: No auto-scroll on new content - preserves reading position for immersion
  // User scrolls down manually to see new content

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    if (pendingMechanics?.rollRequired && diceMode !== 'story') {
      handlePendingRoll();
    } else if (pendingMechanics?.rollRequired) {
      // Story mode - just pass through without dice
      onPlayerAction(`[Automatic success for: ${pendingMechanics.rollRequired.reason}]`);
      onClearMechanics();
    }
  }, [pendingMechanics, diceMode]);

  // Map pending roll stat to action type
  const statToActionType = (stat: string): string => {
    const mapping: Record<string, string> = {
      strength: 'COMBAT_ATTACK',
      dexterity: 'COMBAT_DODGE',
      agility: 'COMBAT_DODGE',
      constitution: 'ENDURE',
      endurance: 'ENDURE',
      intelligence: 'RECALL',
      wisdom: 'PERCEPTION_CHECK',
      perception: 'PERCEPTION_CHECK',
      charisma: 'PERSUADE_MINOR',
      // Skill-based mappings
      lockpicking: 'LOCKPICK',
      stealth: 'STEALTH',
      persuasion: 'PERSUADE_MINOR',
      intimidation: 'INTIMIDATE',
      athletics: 'CLIMB',
      combat: 'COMBAT_ATTACK'
    };
    return mapping[stat.toLowerCase()] || 'PERCEPTION_CHECK';
  };

  const handlePendingRoll = async () => {
    if (!pendingMechanics?.rollRequired) return;
    
    const actionType = statToActionType(pendingMechanics.rollRequired.stat);
    
    // Check if this action should show dice based on mode
    if (!shouldShowRoll(actionType)) {
      // Story mode - auto success
      onPlayerAction(`[Check passed for: ${pendingMechanics.rollRequired.reason}]`);
      onClearMechanics();
      return;
    }
    
    // Convert character stats to player format
    const player = toDicePlayer({
      strength: character.stats.strength,
      agility: character.stats.dexterity,
      intelligence: character.stats.intelligence,
      charisma: character.stats.charisma,
      perception: character.stats.wisdom,
      endurance: character.stats.constitution
    });
    
    // Determine difficulty
    const difficulty = pendingMechanics.rollRequired.difficulty;
    let difficultyTier: 'TRIVIAL' | 'EASY' | 'NORMAL' | 'HARD' | 'VERY_HARD' | 'EXTREME' | 'LEGENDARY' = 'NORMAL';
    if (difficulty <= 5) difficultyTier = 'TRIVIAL';
    else if (difficulty <= 8) difficultyTier = 'EASY';
    else if (difficulty <= 12) difficultyTier = 'NORMAL';
    else if (difficulty <= 15) difficultyTier = 'HARD';
    else if (difficulty <= 18) difficultyTier = 'VERY_HARD';
    else if (difficulty <= 22) difficultyTier = 'EXTREME';
    else difficultyTier = 'LEGENDARY';
    
    const result = await performRoll({
      actionType,
      difficulty: difficultyTier,
      player
    });
    
    if (result.diceRoll) {
      setCurrentDiceRoll(result.diceRoll);
      setShowDiceRoll(true);
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onPlayerAction(input.trim());
      setInput('');
    }
  };

  const handleDiceRollComplete = (roll: any) => {
    setShowDiceRoll(false);
    setCurrentDiceRoll(null);
    onPlayerAction(`[Dice roll for: ${pendingMechanics?.rollRequired?.reason}]`, roll);
    onClearMechanics();
    clearRoll();
  };

  const handleNewDiceRollClose = () => {
    if (currentDiceRoll && pendingMechanics?.rollRequired) {
      handleDiceRollComplete(currentDiceRoll);
    } else {
      setShowDiceRoll(false);
      setCurrentDiceRoll(null);
      clearRoll();
    }
  };

  // Safe text formatting using React components instead of dangerouslySetInnerHTML
  const formatTextSegment = (text: string, keyPrefix: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    // Split by bold markers first
    const boldParts = text.split(/\*\*(.+?)\*\*/g);
    
    boldParts.forEach((part, i) => {
      if (i % 2 === 1) {
        // This is bold text
        result.push(<strong key={`${keyPrefix}-b-${i}`} className="text-primary font-semibold">{part}</strong>);
      } else if (part) {
        // Check for italic within non-bold text
        const italicParts = part.split(/\*(.+?)\*/g);
        italicParts.forEach((iPart, j) => {
          if (j % 2 === 1) {
            result.push(<em key={`${keyPrefix}-i-${i}-${j}`} className="text-muted-foreground">{iPart}</em>);
          } else if (iPart) {
            result.push(<span key={`${keyPrefix}-t-${i}-${j}`}>{iPart}</span>);
          }
        });
      }
    });
    
    return result;
  };

  const formatNarrativeContent = (content: string) => {
    // Clean the content to remove OOC messages and technical talk
    const cleanedContent = cleanNarrativeForDisplay(content);
    
    return cleanedContent.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      const dialogueMatch = paragraph.match(/^\*\*(.+?)\*\*:\s*"(.+)"$/);
      if (dialogueMatch) {
        return (
          <div key={idx} className="my-4 pl-4 border-l-2 border-primary/50 glass-panel-subtle py-3 pr-4 rounded-r-lg">
            <span className="font-semibold text-primary">{dialogueMatch[1]}:</span>
            <span className="italic ml-2 text-foreground/90">&ldquo;{dialogueMatch[2]}&rdquo;</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-4 leading-relaxed text-foreground/90">
          {formatTextSegment(paragraph, `p-${idx}`)}
        </p>
      );
    });
  };

  const charClass = CHARACTER_CLASSES.find(c => c.id === character.classId);
  const healthPercent = (character.currentHealth / character.maxHealth) * 100;
  const isCritical = healthPercent < 25;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Subtle atmospheric background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <AtmosphericBackground />
      </div>

      {/* Header */}
      <header className="relative z-20 glass-panel border-0 border-b border-[rgba(139,92,246,0.2)] rounded-none">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <h1 className="text-xl font-display font-bold text-gradient-primary tracking-wider">
            UNTOLD
          </h1>
          
          {/* Character Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">
              {/* Health */}
              <div className="flex items-center gap-2">
                <CircularStat 
                  value={character.currentHealth} 
                  max={character.maxHealth} 
                  type="health"
                  size={40}
                  strokeWidth={3}
                  icon={<Heart className="w-4 h-4" />}
                />
                <div className="text-xs">
                  <span className={`font-mono font-bold ${isCritical ? 'text-destructive animate-pulse' : 'text-success'}`}>
                    {character.currentHealth}
                  </span>
                  <span className="text-muted-foreground">/{character.maxHealth}</span>
                </div>
              </div>

              {/* Gold */}
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel-subtle rounded-full">
                <Coins className="w-4 h-4 text-warning" />
                <span className="font-mono font-semibold text-warning">{character.gold}</span>
              </div>

              {/* Class & Level */}
              <div className="px-3 py-1.5 glass-panel-subtle rounded-full">
                <span className="text-xs text-muted-foreground">Lv.</span>
                <span className="font-mono font-bold text-primary ml-1">{character.level}</span>
                <span className="text-muted-foreground mx-1.5">•</span>
                <span className="text-sm text-foreground">{charClass?.name}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {cheatMode && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30 animate-glow-pulse">
                  DEV
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCharacterSheet(true)}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Character Sheet"
              >
                <Backpack className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Settings"
              >
                <Sliders className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCheatMode}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Toggle Dev Mode"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRestart}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="New Adventure"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Auto-generated Scene Illustration */}
      {(sceneImageUrl || isGeneratingScene) && (
        <div className="relative z-20 p-4 bg-background/50 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <SceneIllustration
              imageUrl={sceneImageUrl}
              isLoading={isGeneratingScene}
              onClose={onCloseSceneImage}
              showControls={true}
            />
          </div>
        </div>
      )}

      {/* Story Content */}
      <ScrollArea className="flex-1 relative z-10" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          {story.map((entry, index) => (
            <div
              key={entry.id}
              className={`animate-fade-in-up mb-8 ${entry.role === 'user' ? 'text-right' : ''} ${index > 0 ? 'cursor-pointer' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onMouseDown={() => handleLongPressStart(index, entry.content)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(index, entry.content)}
              onTouchEnd={handleLongPressEnd}
              title={index > 0 ? "Hold to return here" : undefined}
            >
              {entry.role === 'user' ? (
                <div className="inline-block max-w-[85%] glass-panel border-primary/30 px-5 py-4 text-left hover:border-primary/50 transition-colors">
                  <p className="text-xs text-primary/70 mb-2 font-body uppercase tracking-wider">Your Action</p>
                  <p className="font-narrative text-lg text-foreground">{entry.content}</p>
                </div>
              ) : (
                <Card className="border-0 bg-transparent shadow-none hover:bg-primary/5 transition-colors rounded-lg p-2 -m-2">
                  {/* Scene Image */}
                  {entry.imageUrl && (
                    <div className="mb-6 rounded-xl overflow-hidden border border-[rgba(139,92,246,0.3)] shadow-glow">
                      <img 
                        src={entry.imageUrl} 
                        alt="Scene illustration" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  <div className="font-narrative text-lg text-foreground leading-relaxed">
                    {formatNarrativeContent(entry.content)}
                  </div>
                  
                  {/* Generate Image Button */}
                  {!entry.imageUrl && index === story.length - 1 && entry.role === 'narrator' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateImage(entry.id);
                      }}
                      disabled={!!generatingImageFor}
                      className="mt-4"
                    >
                      {generatingImageFor === entry.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Illustrate Scene
                        </>
                      )}
                    </Button>
                  )}
                </Card>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-primary animate-pulse glass-panel-subtle px-4 py-3 rounded-xl inline-flex">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-narrative italic">The story unfolds...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="relative z-20 glass-panel border-0 border-t border-[rgba(139,92,246,0.2)] rounded-none p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you do?"
              className="flex-1 bg-black/30 border-[rgba(139,92,246,0.3)] text-foreground placeholder:text-muted-foreground font-narrative text-lg py-6 focus:border-primary focus:shadow-glow"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              disabled={isLoading || showDiceRoll}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || showDiceRoll}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {character.abilities.slice(0, 4).map((ability) => (
              <button
                key={ability}
                onClick={() => setInput(`I use ${ability}`)}
                className="text-xs px-3 py-1 rounded-full glass-panel-subtle text-muted-foreground hover:text-primary hover:border-primary/50 transition-all border border-transparent"
              >
                {ability}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Dice Roll Display - for skill checks with animated modal */}
      {showDiceRoll && currentDiceRoll && (
        <DiceRollDisplay
          roll={currentDiceRoll}
          onClose={handleNewDiceRollClose}
          autoClose={true}
          autoCloseDelay={3500}
        />
      )}

      {/* Legacy Dice Roll Modal - fallback only when new system has no roll */}
      {showDiceRoll && !currentDiceRoll && pendingMechanics?.rollRequired && (
        <DiceRollModal
          stat={pendingMechanics.rollRequired.stat as any}
          difficulty={pendingMechanics.rollRequired.difficulty}
          reason={pendingMechanics.rollRequired.reason}
          characterStats={character.stats}
          onRoll={handleDiceRollComplete}
          onCancel={() => {
            setShowDiceRoll(false);
            onClearMechanics();
          }}
        />
      )}

      {/* Character Sheet Modal */}
      {showCharacterSheet && (
        <CharacterSheet
          character={character}
          onClose={() => setShowCharacterSheet(false)}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onManualSave={handleManualSave}
        onLoadSave={handleLoadSave}
        currentCharacterName={character.name}
      />

      {/* Story Rollback Modal */}
      <StoryRollbackModal
        isOpen={!!rollbackTarget}
        previewText={rollbackTarget?.text || ''}
        onConfirm={handleRollbackConfirm}
        onCancel={() => setRollbackTarget(null)}
      />
    </div>
  );
}