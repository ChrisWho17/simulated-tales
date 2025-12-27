import { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatBar, CircularStat } from '@/components/ui/stat-bar';
import { AtmosphericBackground } from '@/components/ui/particle-background';
import { Send, RotateCcw, Settings, Loader2, Heart, Coins, Backpack, ImageIcon, Zap, Brain, Shield, Sliders, ChevronDown, Package, Sparkles, Swords, Key, Gem, ScrollText, FlaskConical, CircleDollarSign } from 'lucide-react';
import { RPGCharacter, InventoryItem, getStatModifier, CHARACTER_CLASSES, CHARACTER_BACKGROUNDS, CharacterStats, calculateMaxHealth } from '@/types/rpgCharacter';
import { DiceRollModal } from './DiceRollModal';
import { CharacterSheet } from './CharacterSheet';
import { StoryRollbackModal } from './StoryRollbackModal';
import { PlayerMoodIndicator } from './PlayerMoodIndicator';
import { LevelUpModal } from './LevelUpModal';
import { SavesDropdown } from '@/components/campaign';

import { SceneIllustration } from '@/components/game/SceneIllustration';
import { DiceRollDisplay } from '@/components/game/DiceRollDisplay';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { useDiceRoll, toDicePlayer } from '@/hooks/useDiceRoll';
import { useGameOptional } from '@/contexts/GameContext';
import { DiceRollResult, DifficultyTier } from '@/game/diceSystem';
import { cleanNarrativeForDisplay } from '@/lib/narrativeFilter';
import { saveGame, GameSave } from '@/lib/saveSystem';
import { useToast } from '@/hooks/use-toast';
import { ModifierManager, createEnvironmentContext, parseNarrativeForModifiers } from '@/game/environmentModifierIntegration';
import { createDefaultCondition } from '@/game/environmentSystem';
import { ModifierState, Modifier } from '@/game/buffDebuffSystem';
import { getModifierInlineColor } from './ModifierDisplay';
import { 
  LevelingState, 
  LevelUpChoice,
  createLevelingState, 
  processXPEvent, 
  checkLevelUp, 
  generateLevelUpChoices, 
  applyLevelUp,
  createXPEvent,
  advanceChapter
} from '@/game/levelingSystem';
import { GameGenre } from '@/types/genreData';
import { MOOD_COLORS, getAnchorWords, MAX_ANCHORS_PER_PARAGRAPH, isValidMoodAnchor } from '@/game/moodSystem';
import { CoreMoodType, MoodState as MoodSystemState, MoodLogEntry } from '@/game/moodSystem';
import { InventoryCommandPalette } from '@/components/game/InventoryCommandPalette';
import { useRegisteredNPCNames, parseTextForNPCLinks } from './NPCNameLink';
import { 
  addRelationshipMoment,
  MomentType, 
  MilestoneType 
} from '@/lib/relationshipJournal';

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

interface XPEventData {
  amount: number;
  contributingStats?: Record<string, number>;
  difficulty?: string;
  risk?: string;
  reason?: string;
  isNeutral?: boolean;
}

interface RelationshipMomentData {
  npcName: string;
  momentType: string;
  description: string;
}

interface MilestoneChangeData {
  npcName: string;
  milestoneType: string;
}

interface GameMechanics {
  rollRequired?: PendingRoll;
  xpGained?: { amount: number; reason: string; events?: XPEventData[] };
  goldGained?: number;
  lootGained?: string | string[];
  damage?: number;
  heal?: number;
  skillImprovements?: Array<{ skill: string; amount: number; reason: string }>;
  chapterEnd?: boolean;
  relationshipMoments?: RelationshipMomentData[];
  milestoneChanges?: MilestoneChangeData[];
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
  genre?: GameGenre;
  currentMood?: CoreMoodType;
  moodHistory?: MoodLogEntry[];
  onMoodChange?: (mood: CoreMoodType) => void;
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
  genre = 'fantasy',
  currentMood = 'neutral',
  moodHistory = [],
  onMoodChange,
}: AdventureDisplayProps) {
  const [input, setInput] = useState('');
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [currentDiceRoll, setCurrentDiceRoll] = useState<DiceRollResult | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ index: number; text: string } | null>(null);
  const [showRollbackHint, setShowRollbackHint] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewContent, setHasNewContent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousStoryLength = useRef(story.length);
  
  // Triple-tap detection refs and visual state
  const tapCountRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapIndexRef = useRef<number | null>(null);
  const tripleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapFeedback, setTapFeedback] = useState<{ index: number; count: number } | null>(null);
  const [rollbackSplash, setRollbackSplash] = useState<{ index: number } | null>(null);
  
  // Leveling system state
  const [levelingState, setLevelingState] = useState<LevelingState>(() => 
    createLevelingState(character.level)
  );
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpChoices, setLevelUpChoices] = useState<LevelUpChoice[]>([]);
  const [lastPlayerAction, setLastPlayerAction] = useState('');
  
  const gameContext = useGameOptional();
  const diceMode = gameContext?.diceMode ?? 'story';
  const { performRoll, shouldShowRoll, clearRoll } = useDiceRoll();
  const { toast } = useToast();
  
  // Get registered NPC names for clickable links in narrative
  const npcNameMap = useRegisteredNPCNames();

  // Initialize modifier manager for buff/debuff tracking
  const modifierManagerRef = useRef<ModifierManager | null>(null);
  if (!modifierManagerRef.current) {
    modifierManagerRef.current = new ModifierManager(
      gameContext?.campaignMemory?.campaign?.id || 'default_campaign',
      { narrativeParsingEnabled: true, autoApplyEnvironmental: true }
    );
  }

  // Hide hint after first interaction or after a few entries
  useEffect(() => {
    if (story.length > 4) {
      setShowRollbackHint(false);
    }
  }, [story.length]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+I or Cmd+I to open inventory
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setShowInventory(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track scroll position to show/hide scroll-to-bottom button
  const checkIfAtBottom = useCallback(() => {
    if (!scrollRef.current) return true;
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return true;
    const { scrollTop, scrollHeight, clientHeight } = viewport as HTMLElement;
    return scrollHeight - scrollTop - clientHeight <= 100;
  }, []);

  // Scroll event tracking
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const atBottom = checkIfAtBottom();
      setIsAtBottom(atBottom);
      if (atBottom) {
        setHasNewContent(false);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // Detect new content when story updates
  useEffect(() => {
    if (story.length > previousStoryLength.current && !isAtBottom) {
      setHasNewContent(true);
    }
    previousStoryLength.current = story.length;
  }, [story.length, isAtBottom]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    (viewport as HTMLElement).scrollTo({
      top: (viewport as HTMLElement).scrollHeight,
      behavior: 'smooth',
    });
    setHasNewContent(false);
    setIsAtBottom(true);
  }, []);

  // Parse new narrative entries for modifiers (buff/debuff detection)
  const lastProcessedStoryRef = useRef<number>(0);
  const [recentModifiers, setRecentModifiers] = useState<Modifier[]>([]);
  
  useEffect(() => {
    if (!modifierManagerRef.current) return;
    
    // Process only new story entries from the narrator
    const newEntries = story.slice(lastProcessedStoryRef.current);
    lastProcessedStoryRef.current = story.length;
    
    const newModifiers: Modifier[] = [];
    for (const entry of newEntries) {
      if (entry.role === 'narrator' && entry.content) {
        const results = modifierManagerRef.current.processNarrative(entry.content);
        for (const result of results) {
          if (result.modifier.severity > 0.2) {
            newModifiers.push(result.modifier);
          }
        }
      }
    }
    
    if (newModifiers.length > 0) {
      setRecentModifiers(prev => [...prev.slice(-5), ...newModifiers]);
    }
  }, [story]);

  // Get current modifier state for character sheet
  const getModifierState = useCallback((): ModifierState | undefined => {
    return modifierManagerRef.current?.getState();
  }, []);

  // Triple-tap handler for rollback with visual feedback
  const handleTripleTap = useCallback((index: number, text: string) => {
    if (index === 0) return;
    
    const now = Date.now();
    const TRIPLE_TAP_THRESHOLD = 400; // ms between taps
    
    // Check if this tap is on the same entry and within time threshold
    if (lastTapIndexRef.current === index && now - lastTapTimeRef.current < TRIPLE_TAP_THRESHOLD) {
      tapCountRef.current += 1;
    } else {
      // Reset tap count for new entry or timeout
      tapCountRef.current = 1;
    }
    
    lastTapTimeRef.current = now;
    lastTapIndexRef.current = index;
    
    // Update visual feedback
    setTapFeedback({ index, count: tapCountRef.current });
    
    // Clear any existing timer
    if (tripleTapTimer.current) {
      clearTimeout(tripleTapTimer.current);
    }
    
    // Check for triple tap
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setTapFeedback(null);
      
      // Show rollback splash
      setRollbackSplash({ index });
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      
      // After splash animation, show the rollback modal
      setTimeout(() => {
        setRollbackSplash(null);
        setRollbackTarget({ index, text });
        setShowRollbackHint(false);
      }, 600);
    } else {
      // Reset tap count and feedback after threshold
      tripleTapTimer.current = setTimeout(() => {
        tapCountRef.current = 0;
        setTapFeedback(null);
      }, TRIPLE_TAP_THRESHOLD);
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

  // Focus input only on initial mount, not on every loading change (prevents keyboard popup)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Process mechanics and trigger emotional state changes AND update character stats
  useEffect(() => {
    if (!pendingMechanics) return;

    let updatedCharacter = { ...character };
    let hasStatChanges = false;

    // Apply gold changes
    if (pendingMechanics.goldGained && pendingMechanics.goldGained > 0) {
      updatedCharacter.gold = (updatedCharacter.gold || 0) + pendingMechanics.goldGained;
      hasStatChanges = true;
      toast({
        title: `+${pendingMechanics.goldGained} Gold`,
        description: "Your wealth increases!",
        duration: 3000,
      });
    }

    // Apply damage
    if (pendingMechanics.damage && pendingMechanics.damage > 0) {
      updatedCharacter.currentHealth = Math.max(0, updatedCharacter.currentHealth - pendingMechanics.damage);
      hasStatChanges = true;
      toast({
        title: `-${pendingMechanics.damage} Health`,
        description: "You've taken damage!",
        variant: "destructive",
        duration: 3000,
      });
    }

    // Apply healing
    if (pendingMechanics.heal && pendingMechanics.heal > 0) {
      updatedCharacter.currentHealth = Math.min(
        updatedCharacter.maxHealth,
        updatedCharacter.currentHealth + pendingMechanics.heal
      );
      hasStatChanges = true;
      toast({
        title: `+${pendingMechanics.heal} Health`,
        description: "You feel restored!",
        duration: 3000,
      });
    }

    // Apply loot to inventory (now supports multiple items)
    if (pendingMechanics.lootGained) {
      const lootItems = Array.isArray(pendingMechanics.lootGained) 
        ? pendingMechanics.lootGained 
        : [pendingMechanics.lootGained];
      
      // Helper to determine item icon based on name
      const getItemIcon = (itemName: string) => {
        const name = itemName.toLowerCase();
        if (name.includes('sword') || name.includes('blade') || name.includes('dagger') || name.includes('axe') || name.includes('weapon')) return '⚔️';
        if (name.includes('key')) return '🗝️';
        if (name.includes('potion') || name.includes('elixir') || name.includes('flask')) return '🧪';
        if (name.includes('gem') || name.includes('jewel') || name.includes('diamond') || name.includes('ruby') || name.includes('emerald')) return '💎';
        if (name.includes('scroll') || name.includes('book') || name.includes('tome') || name.includes('letter')) return '📜';
        if (name.includes('ring') || name.includes('amulet') || name.includes('necklace')) return '💍';
        if (name.includes('coin') || name.includes('gold') || name.includes('silver')) return '🪙';
        if (name.includes('armor') || name.includes('shield') || name.includes('helm')) return '🛡️';
        if (name.includes('food') || name.includes('bread') || name.includes('meat')) return '🍖';
        if (name.includes('bow') || name.includes('arrow')) return '🏹';
        if (name.includes('staff') || name.includes('wand') || name.includes('rod')) return '🪄';
        if (name.includes('map')) return '🗺️';
        if (name.includes('torch') || name.includes('lantern')) return '🔦';
        return '✨'; // Default sparkle for misc items
      };
      
      for (const lootName of lootItems) {
        const existingItemIndex = updatedCharacter.inventory.findIndex(
          item => item.name.toLowerCase() === lootName.toLowerCase()
        );
        if (existingItemIndex !== -1) {
          // Update existing item quantity
          const newInventory = [...updatedCharacter.inventory];
          newInventory[existingItemIndex] = {
            ...newInventory[existingItemIndex],
            quantity: newInventory[existingItemIndex].quantity + 1
          };
          updatedCharacter.inventory = newInventory;
        } else {
          // Create new inventory item with required fields
          const newItem: InventoryItem = {
            id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: lootName,
            description: `A ${lootName.toLowerCase()} found during your adventure.`,
            quantity: 1,
            type: 'treasure' // Default type for dynamically acquired items
          };
          updatedCharacter.inventory = [...updatedCharacter.inventory, newItem];
        }
        
        const itemIcon = getItemIcon(lootName);
        toast({
          title: `${itemIcon} ${lootName}`,
          description: "Added to inventory",
          duration: 3500,
          className: "bg-primary/10 border-primary/30",
        });
      }
      hasStatChanges = true;
    }

    // Apply XP through leveling system
    if (pendingMechanics.xpGained && pendingMechanics.xpGained.amount > 0) {
      updatedCharacter.experience = (updatedCharacter.experience || 0) + pendingMechanics.xpGained.amount;
      hasStatChanges = true;
      
      // Process XP events through leveling system with stat weighting
      let newLevelingState = { ...levelingState };
      
      if (pendingMechanics.xpGained.events && pendingMechanics.xpGained.events.length > 0) {
        // New format with stat weights
        for (const event of pendingMechanics.xpGained.events) {
          const xpEvent = createXPEvent(
            event.amount,
            event.reason || pendingMechanics.xpGained.reason,
            lastPlayerAction,
            genre,
            newLevelingState.currentChapter,
            (event.difficulty as any) || 'standard',
            (event.risk as any) || 'moderate'
          );
          // Override with AI-provided stat weights if available
          if (event.contributingStats) {
            xpEvent.contributingStats = event.contributingStats as any;
          }
          xpEvent.isNeutral = event.isNeutral;
          newLevelingState = processXPEvent(newLevelingState, xpEvent);
        }
      } else {
        // Legacy format - infer stats from action
        const xpEvent = createXPEvent(
          pendingMechanics.xpGained.amount,
          pendingMechanics.xpGained.reason,
          lastPlayerAction,
          genre,
          newLevelingState.currentChapter
        );
        newLevelingState = processXPEvent(newLevelingState, xpEvent);
      }
      
      // Check for level-up at chapter end
      if (pendingMechanics.chapterEnd) {
        newLevelingState = checkLevelUp(newLevelingState, true);
        
        if (newLevelingState.pendingLevelUp) {
          // Generate level-up choices
          const isChapterReward = newLevelingState.levelUpType === 'chapter_reward';
          const choices = generateLevelUpChoices(newLevelingState, genre, character.classId, isChapterReward);
          setLevelUpChoices(choices);
          setShowLevelUpModal(true);
        } else {
          // No level-up, just advance chapter
          newLevelingState = advanceChapter(newLevelingState);
        }
      }
      
      setLevelingState(newLevelingState);
      
      // Show XP toast
      const xpToNextLevel = newLevelingState.xpThreshold;
      const progress = Math.round((newLevelingState.currentXP / xpToNextLevel) * 100);
      toast({
        title: `+${pendingMechanics.xpGained.amount} XP`,
        description: `${pendingMechanics.xpGained.reason} (${progress}% to next level)`,
        duration: 3000,
      });
    }
    
    // Handle chapter end without XP
    if (pendingMechanics.chapterEnd && !pendingMechanics.xpGained) {
      let newLevelingState = checkLevelUp(levelingState, true);
      
      if (newLevelingState.pendingLevelUp) {
        const isChapterReward = newLevelingState.levelUpType === 'chapter_reward';
        const choices = generateLevelUpChoices(newLevelingState, genre, character.classId, isChapterReward);
        setLevelUpChoices(choices);
        setShowLevelUpModal(true);
      } else {
        newLevelingState = advanceChapter(newLevelingState);
      }
      
      setLevelingState(newLevelingState);
    }

    // Apply skill improvements
    if (pendingMechanics.skillImprovements && pendingMechanics.skillImprovements.length > 0) {
      for (const improvement of pendingMechanics.skillImprovements) {
        // Add skill to character's skills array if not present, or note the improvement
        if (!updatedCharacter.skills.includes(improvement.skill)) {
          updatedCharacter.skills = [...updatedCharacter.skills, improvement.skill];
        }
        toast({
          title: `Skill Improved: ${improvement.skill}`,
          description: `+${improvement.amount} - ${improvement.reason}`,
          duration: 3000,
        });
      }
      hasStatChanges = true;
    }

    // Update character state if any stats changed
    if (hasStatChanges) {
      onUpdateCharacter(updatedCharacter);
    }

    // Trigger emotional events based on mechanics
    if (gameContext?.processGameEvent) {
      if (pendingMechanics.damage && pendingMechanics.damage > 0) {
        gameContext.processGameEvent('took_damage', updatedCharacter);
      }
      if (pendingMechanics.heal && pendingMechanics.heal > 0) {
        gameContext.processGameEvent('received_healing', updatedCharacter);
      }
      if (pendingMechanics.goldGained && pendingMechanics.goldGained > 0) {
        gameContext.processGameEvent('found_treasure', updatedCharacter);
      }
      if (pendingMechanics.xpGained && pendingMechanics.xpGained.amount > 0) {
        gameContext.processGameEvent('quest_completed', updatedCharacter);
      }
      if (pendingMechanics.lootGained) {
        gameContext.processGameEvent('found_treasure', updatedCharacter);
      }
    }

    // Process relationship moments from AI narrative
    if (pendingMechanics.relationshipMoments && pendingMechanics.relationshipMoments.length > 0) {
      for (const moment of pendingMechanics.relationshipMoments) {
        const npcId = moment.npcName.toLowerCase().replace(/\s+/g, '-');
        const validMomentTypes: MomentType[] = [
          'first_meeting', 'first_conversation', 'shared_adventure', 'gift_given', 
          'gift_received', 'first_flirt', 'first_kiss', 'confession', 'rejection',
          'first_date', 'intimate_moment', 'argument', 'reconciliation', 'heartbreak',
          'commitment', 'milestone', 'memory'
        ];
        const momentType: MomentType = validMomentTypes.includes(moment.momentType as MomentType) 
          ? (moment.momentType as MomentType) 
          : 'memory';
        
        const romanticTypes: MomentType[] = [
          'first_flirt', 'first_kiss', 'confession', 'first_date', 
          'intimate_moment', 'commitment'
        ];
        
        addRelationshipMoment(npcId, moment.npcName, momentType, moment.description, {
          isRomantic: romanticTypes.includes(momentType),
          emotionalImpact: romanticTypes.includes(momentType) ? 50 : 20,
        });
        
        toast({
          title: `💕 ${moment.npcName}`,
          description: moment.description,
          duration: 4000,
        });
      }
    }

    // Process milestone changes
    if (pendingMechanics.milestoneChanges && pendingMechanics.milestoneChanges.length > 0) {
      for (const milestone of pendingMechanics.milestoneChanges) {
        const npcId = milestone.npcName.toLowerCase().replace(/\s+/g, '-');
        const validMilestones: MilestoneType[] = [
          'acquaintance', 'friend', 'close_friend', 'romantic_interest',
          'dating', 'lover', 'committed', 'soulmate'
        ];
        const milestoneType: MilestoneType = validMilestones.includes(milestone.milestoneType as MilestoneType)
          ? (milestone.milestoneType as MilestoneType)
          : 'acquaintance';
        
        addRelationshipMoment(npcId, milestone.npcName, 'milestone', `Relationship evolved to: ${milestoneType}`, {
          isMilestone: true,
          milestoneType: milestoneType,
          isRomantic: ['romantic_interest', 'dating', 'lover', 'committed', 'soulmate'].includes(milestoneType),
          emotionalImpact: 75,
        });
        
        toast({
          title: `⭐ Milestone Reached!`,
          description: `${milestone.npcName}: ${milestoneType.replace(/_/g, ' ')}`,
          duration: 5000,
        });
      }
    }

    // Apply game mechanics to modifier system (buff/debuff integration)
    if (modifierManagerRef.current) {
      if (pendingMechanics.damage && pendingMechanics.damage > 0) {
        modifierManagerRef.current.processMechanicsEvent({
          type: 'damage',
          amount: pendingMechanics.damage,
          source: 'combat_damage'
        });
      }
      if (pendingMechanics.heal && pendingMechanics.heal > 0) {
        modifierManagerRef.current.processMechanicsEvent({
          type: 'heal',
          amount: pendingMechanics.heal
        });
      }
    }

    // Handle dice rolls
    if (pendingMechanics.rollRequired && diceMode !== 'story') {
      handlePendingRoll();
    } else if (pendingMechanics.rollRequired) {
      // Story mode - just pass through without dice
      onPlayerAction(`[Automatic success for: ${pendingMechanics.rollRequired.reason}]`);
      onClearMechanics();
    } else {
      // Clear mechanics after applying non-dice changes
      onClearMechanics();
    }
  }, [pendingMechanics, diceMode, gameContext, character, onUpdateCharacter, toast]);

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
    let difficultyTier: DifficultyTier = 'NORMAL';
    if (difficulty <= 5) difficultyTier = 'VERY_EASY';
    else if (difficulty <= 8) difficultyTier = 'EASY';
    else if (difficulty <= 12) difficultyTier = 'NORMAL';
    else if (difficulty <= 15) difficultyTier = 'HARD';
    else difficultyTier = 'VERY_HARD';
    
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

  // Handle level-up choice selection
  const handleLevelUpChoice = useCallback((choice: LevelUpChoice) => {
    const { newState, statChanges, newLevel } = applyLevelUp(levelingState, choice, character.level);
    
    // Apply stat changes to character
    const updatedStats = { ...character.stats };
    for (const [stat, value] of Object.entries(statChanges)) {
      if (value && value > 0) {
        updatedStats[stat as keyof CharacterStats] = (updatedStats[stat as keyof CharacterStats] || 0) + value;
      }
    }
    
    // Calculate new max health based on updated stats
    const newMaxHealth = calculateMaxHealth(updatedStats, newLevel);
    const healthIncrease = newMaxHealth - character.maxHealth;
    
    const updatedCharacter: RPGCharacter = {
      ...character,
      level: newLevel,
      stats: updatedStats,
      maxHealth: newMaxHealth,
      currentHealth: character.currentHealth + healthIncrease, // Heal by the health increase
    };
    
    onUpdateCharacter(updatedCharacter);
    setLevelingState(advanceChapter(newState)); // Advance chapter after level-up
    setShowLevelUpModal(false);
    setLevelUpChoices([]);
    
    // Show level-up toast
    const statNames = Object.entries(statChanges)
      .filter(([_, v]) => v && v > 0)
      .map(([s, v]) => `+${v} ${s.slice(0, 3).toUpperCase()}`)
      .join(', ');
    
    toast({
      title: `Level Up! Now Level ${newLevel}`,
      description: `${choice.name}: ${statNames}`,
      duration: 5000,
    });
  }, [levelingState, character, onUpdateCharacter, toast]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      // Track last action for XP stat inference
      setLastPlayerAction(input.trim());
      // Tick modifiers by 1 turn on each player action
      if (modifierManagerRef.current) {
        const beforeCount = modifierManagerRef.current.getState().activeModifiers.length;
        modifierManagerRef.current.tickTurn(1);
        const afterState = modifierManagerRef.current.getState();
        console.log(`[Modifiers] Ticked 1 turn. Before: ${beforeCount} modifiers, After: ${afterState.activeModifiers.length} modifiers`);
        afterState.activeModifiers.forEach(m => {
          console.log(`  - ${m.name}: ${m.duration.remaining}/${m.duration.total} turns remaining`);
        });
      }
      onPlayerAction(input.trim());
      setInput('');
    }
  };

  const handleDiceRollComplete = (roll: any) => {
    // Tick modifiers by 1 turn for dice roll actions too
    if (modifierManagerRef.current) {
      modifierManagerRef.current.tickTurn(1);
    }
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

  // Safe text formatting with mood-tinted keywords and NPC name links
  const formatTextSegment = (
    text: string, 
    keyPrefix: string, 
    moodConfig: typeof MOOD_COLORS[CoreMoodType] | null,
    tintableWords?: Set<string>
  ): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    // Split by bold markers first
    const boldParts = text.split(/\*\*(.+?)\*\*/g);
    
    boldParts.forEach((part, i) => {
      if (i % 2 === 1) {
        // Bold text - check for NPC names first, then apply mood color
        const npcParsed = parseTextForNPCLinks(part, npcNameMap, `${keyPrefix}-b-${i}`);
        result.push(
          <strong 
            key={`${keyPrefix}-b-${i}`} 
            className="font-semibold"
            style={{ 
              color: moodConfig?.primary || 'hsl(var(--primary))',
              textShadow: moodConfig 
                ? `0 0 ${moodConfig.glowRadius}px ${moodConfig.glow}` 
                : undefined
            }}
          >
            {npcParsed}
          </strong>
        );
      } else if (part) {
        // Check for italic within non-bold text
        const italicParts = part.split(/\*(.+?)\*/g);
        italicParts.forEach((iPart, j) => {
          if (j % 2 === 1) {
            // Italic text - also check for NPC names
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-i-${i}-${j}`);
            result.push(<em key={`${keyPrefix}-i-${i}-${j}`} className="text-muted-foreground">{npcParsed}</em>);
          } else if (iPart && moodConfig && tintableWords && tintableWords.size > 0) {
            // For non-italic text with active mood, check for tintable keywords (limited set)
            // Also parse for NPC names
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-mood-${i}-${j}`);
            
            // If NPC parsing returned components, add them directly
            if (npcParsed.length > 1 || typeof npcParsed[0] !== 'string') {
              npcParsed.forEach((node, nIdx) => {
                if (typeof node === 'string') {
                  // Process mood tinting for string parts
                  const words = node.split(/(\s+)/);
                  words.forEach((word, wIdx) => {
                    if (/^\s+$/.test(word)) {
                      result.push(<span key={`${keyPrefix}-ws-${i}-${j}-${nIdx}-${wIdx}`}>{word}</span>);
                    } else {
                      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                      if (tintableWords.has(cleanWord)) {
                        result.push(
                          <span 
                            key={`${keyPrefix}-tw-${i}-${j}-${nIdx}-${wIdx}`}
                            className="transition-all duration-300"
                            style={{ 
                              color: moodConfig.primary,
                              textShadow: `0 0 ${moodConfig.glowRadius}px ${moodConfig.glow}, 0 0 ${moodConfig.glowRadius * 1.5}px ${moodConfig.glow}`,
                              fontWeight: 500
                            }}
                          >
                            {word}
                          </span>
                        );
                      } else {
                        result.push(<span key={`${keyPrefix}-w-${i}-${j}-${nIdx}-${wIdx}`}>{word}</span>);
                      }
                    }
                  });
                } else {
                  // It's a React component (NPC link)
                  result.push(node);
                }
              });
            } else {
              // No NPC names found, process mood tinting normally
              const words = iPart.split(/(\s+)/);
              words.forEach((word, wIdx) => {
                if (/^\s+$/.test(word)) {
                  result.push(<span key={`${keyPrefix}-ws-${i}-${j}-${wIdx}`}>{word}</span>);
                } else {
                  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                  if (tintableWords.has(cleanWord)) {
                    result.push(
                      <span 
                        key={`${keyPrefix}-tw-${i}-${j}-${wIdx}`}
                        className="transition-all duration-300"
                        style={{ 
                          color: moodConfig.primary,
                          textShadow: `0 0 ${moodConfig.glowRadius}px ${moodConfig.glow}, 0 0 ${moodConfig.glowRadius * 1.5}px ${moodConfig.glow}`,
                          fontWeight: 500
                        }}
                      >
                        {word}
                      </span>
                    );
                  } else {
                    result.push(<span key={`${keyPrefix}-w-${i}-${j}-${wIdx}`}>{word}</span>);
                  }
                }
              });
            }
          } else if (iPart) {
            // Plain text - parse for NPC names
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-t-${i}-${j}`);
            result.push(<span key={`${keyPrefix}-t-${i}-${j}`}>{npcParsed}</span>);
          }
        });
      }
    });
    
    return result;
  };

  // Get modifier color class based on type
  const getModifierBadgeClass = (modifier: Modifier): string => {
    if (modifier.type === 'buff') return 'text-modifier-buff';
    if (modifier.severity >= 0.7) return 'text-modifier-critical';
    if (modifier.category === 'injury' || modifier.severity >= 0.4) return 'text-modifier-injury';
    return 'text-modifier-neutral';
  };

  const formatNarrativeContent = (content: string, entryIndex: number) => {
    // Clean the content to remove OOC messages and technical talk
    const cleanedContent = cleanNarrativeForDisplay(content);
    
    // Check if this is the latest narrator entry and has recent modifiers
    const isLatestNarratorEntry = story.filter(s => s.role === 'narrator').length - 1 === 
      story.slice(0, entryIndex + 1).filter(s => s.role === 'narrator').length - 1;
    const showModifiers = isLatestNarratorEntry && recentModifiers.length > 0;
    
    // Get mood styling for the latest entry (non-neutral moods add subtle frost effect)
    const moodConfig = currentMood !== 'neutral' && isLatestNarratorEntry ? MOOD_COLORS[currentMood] : null;
    
    // Pre-calculate anchor words for this content (strict: max 1-3 per paragraph)
    const tintableWords = moodConfig 
      ? getAnchorWords(cleanedContent, currentMood, MAX_ANCHORS_PER_PARAGRAPH) 
      : undefined;
    
    // Subtle frosty glow for character names - refined per PDF (translucent, not solid)
    const nameFrostStyle = moodConfig ? {
      textShadow: `0 0 ${moodConfig.glowRadius}px ${moodConfig.glowStrong}, 0 0 ${moodConfig.glowRadius * 2}px ${moodConfig.glow}`,
      color: moodConfig.primary,
    } : {};
    
    const paragraphs = cleanedContent.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      const dialogueMatch = paragraph.match(/^\*\*(.+?)\*\*:\s*"(.+)"$/);
      if (dialogueMatch) {
        const speakerName = dialogueMatch[1];
        const dialogueText = dialogueMatch[2];
        
        // Check if speaker is a registered NPC for clickable link
        const speakerNPC = npcNameMap.get(speakerName.toLowerCase());
        
        return (
          <div 
            key={idx} 
            className="my-4 pl-4 border-l-2 border-primary/50 glass-panel-subtle py-3 pr-4 rounded-r-lg transition-all duration-300"
          >
            <span 
              className="font-semibold transition-all duration-300" 
              style={moodConfig ? nameFrostStyle : { color: 'hsl(var(--primary))' }}
            >
              {speakerNPC ? (
                <>
                  {parseTextForNPCLinks(speakerName, npcNameMap, `dialogue-speaker-${idx}`)}:
                </>
              ) : (
                <>{speakerName}:</>
              )}
            </span>
            <span className="italic ml-2 text-foreground/90">
              &ldquo;{dialogueText}&rdquo;
            </span>
          </div>
        );
      }

      return (
        <p 
          key={idx} 
          className="my-4 leading-relaxed text-foreground/90 transition-all duration-300"
        >
          {formatTextSegment(paragraph, `p-${idx}`, moodConfig, tintableWords)}
        </p>
      );
    });

    // Add inline modifier badges at the end of the narrative
    if (showModifiers) {
      paragraphs.push(
        <div key="modifiers" className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {recentModifiers.map((mod, i) => (
            <span 
              key={`${mod.id}-${i}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getModifierBadgeClass(mod)} border-current/30 bg-current/10`}
            >
              {mod.type === 'buff' ? '↑' : '↓'} {mod.name}
            </span>
          ))}
        </div>
      );
      // Clear recent modifiers after displaying
      setTimeout(() => setRecentModifiers([]), 100);
    }

    return paragraphs;
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
              {/* Health with Mood Aura - Soft pulsing glow based on emotional state */}
              <div 
                className="flex items-center gap-2 relative"
                style={currentMood !== 'neutral' ? {
                  // Soft mood aura behind health indicator
                  filter: `drop-shadow(0 0 12px ${MOOD_COLORS[currentMood]?.glow || 'transparent'})`,
                } : undefined}
              >
                {/* Faint pulsing halo behind portrait/health */}
                {currentMood !== 'neutral' && (
                  <div 
                    className="absolute inset-0 -m-2 rounded-full opacity-40 animate-pulse pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${MOOD_COLORS[currentMood]?.glow || 'transparent'} 0%, transparent 70%)`,
                    }}
                  />
                )}
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

              {/* Mood Indicator - Compact label with glow */}
              {currentMood !== 'neutral' && (
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300"
                  style={{
                    backgroundColor: `${MOOD_COLORS[currentMood]?.primary}20`,
                    color: MOOD_COLORS[currentMood]?.primary,
                    boxShadow: `0 0 10px ${MOOD_COLORS[currentMood]?.glow}`,
                    border: `1px solid ${MOOD_COLORS[currentMood]?.primary}40`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: MOOD_COLORS[currentMood]?.primary }} />
                  {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
                </div>
              )}

              {/* Gold */}
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel-subtle rounded-full">
                <Coins className="w-4 h-4 text-warning" />
                <span className="font-mono font-semibold text-warning">{character.gold}</span>
              </div>

              {/* Class & Level with XP Progress */}
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel-subtle rounded-full">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Lv.</span>
                  <span className="font-mono font-bold text-primary">{character.level}</span>
                </div>
                <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden" title={`${levelingState.currentXP}/${levelingState.xpThreshold} XP`}>
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                    style={{ width: `${Math.min(100, (levelingState.currentXP / levelingState.xpThreshold) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{charClass?.name}</span>
              </div>
            </div>

            {/* Action Buttons - Compact on mobile */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {cheatMode && (
                <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-primary/30 animate-glow-pulse">
                  DEV
                </span>
              )}
              
              {/* Saves Dropdown */}
              <SavesDropdown />
              
              {/* Inventory */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInventory(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Inventory (Ctrl+I)"
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              {/* Character Sheet */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCharacterSheet(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Character Sheet"
              >
                <Backpack className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Settings"
              >
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              {/* Dev Mode toggle - hidden on very small screens */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCheatMode}
                className="hidden xs:flex h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Toggle Dev Mode"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRestart}
                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="New Adventure"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
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
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-8 overflow-x-hidden">
          {/* Initial loading state when story is empty */}
          {story.length === 0 && isLoading && (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-narrative text-lg">Your story is being written...</p>
            </div>
          )}

          {/* Empty state when no story and not loading */}
          {story.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
              <p className="text-muted-foreground font-narrative text-lg">Begin your adventure below...</p>
            </div>
          )}

          {/* Rollback hint for new players */}
          {showRollbackHint && story.length >= 2 && story.length <= 4 && (
            <div className="mb-6 text-center animate-fade-in">
              <p className="text-xs text-muted-foreground/70 italic">
                💡 Tip: Triple-tap any story moment to return to that point
              </p>
            </div>
          )}

          {story.map((entry, index) => (
            <div
              key={entry.id}
              className={`
                animate-fade-in-up mb-8 relative
                ${entry.role === 'user' ? 'text-right' : ''} 
                ${index > 0 ? 'cursor-pointer select-none' : ''}
                transition-all duration-150
              `}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleTripleTap(index, entry.content)}
              title={index > 0 ? "Triple-tap to return here" : undefined}
            >
              {/* Triple-tap feedback dots */}
              {tapFeedback?.index === index && tapFeedback.count > 0 && (
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex gap-1.5 animate-fade-in z-20">
                  {[1, 2, 3].map((dot) => (
                    <div
                      key={dot}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                        dot <= tapFeedback.count
                          ? 'bg-warning scale-110 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {/* Rollback splash overlay */}
              {rollbackSplash?.index === index && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="glass-panel border-warning/60 px-6 py-3 rounded-full animate-pulse shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                    <span className="text-warning font-medium flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      Rewinding...
                    </span>
                  </div>
                </div>
              )}
              
              {entry.role === 'user' ? (
                <div className="inline-block max-w-[90%] sm:max-w-[85%] glass-panel border-primary/30 px-4 sm:px-5 py-3 sm:py-4 text-left hover:border-primary/50 transition-all">
                  <p className="text-xs text-primary/70 mb-2 font-body uppercase tracking-wider">Your Action</p>
                  <p className="font-narrative text-base sm:text-lg text-foreground break-words">{entry.content}</p>
                </div>
              ) : (
                <Card className="border-0 bg-transparent shadow-none rounded-lg p-2 -m-2 transition-all hover:bg-primary/5">
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
                  
                  <div className="font-narrative text-base sm:text-lg text-foreground leading-relaxed break-words overflow-wrap-anywhere">
                    {formatNarrativeContent(entry.content, index)}
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

          {/* Loading indicator for ongoing narrative generation (only when story has content) */}
          {isLoading && story.length > 0 && (
            <div className="flex items-center gap-3 text-primary animate-pulse glass-panel-subtle px-4 py-3 rounded-xl inline-flex">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-narrative italic">The story unfolds...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to Latest Button - appears when scrolled above the last message */}
      {(!isAtBottom || hasNewContent) && story.length > 0 && (
        <button
          onClick={scrollToBottom}
          className={`
            absolute bottom-28 right-6 z-30
            p-3 rounded-full transition-all duration-300
            bg-primary/90 text-primary-foreground
            hover:bg-primary hover:scale-110
            border-2 border-primary-foreground/30
            ${hasNewContent ? 'animate-bounce' : ''}
          `}
          style={{
            boxShadow: hasNewContent 
              ? '0 0 20px hsl(var(--primary) / 0.7), 0 0 40px hsl(var(--primary) / 0.4), 0 4px 12px rgba(0,0,0,0.3)'
              : '0 0 15px hsl(var(--primary) / 0.5), 0 0 30px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0,0,0,0.3)'
          }}
          aria-label="Scroll to latest message"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Input Area */}
      <div className="relative z-20 glass-panel border-0 border-t border-[rgba(139,92,246,0.2)] rounded-none p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you do?"
              className="flex-1 bg-black/30 border-[rgba(139,92,246,0.3)] text-foreground placeholder:text-muted-foreground font-narrative text-base md:text-lg py-6 focus:border-primary focus:shadow-glow"
              style={{ fontSize: '16px' }}
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
          modifierState={getModifierState()}
          moodState={{ currentMood, moodIntensity: 0.6, moodHistory, lastChangeTimestamp: Date.now() }}
          genre={genre}
          onMoodChange={onMoodChange}
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

      {/* Level-Up Modal - unskippable */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        choices={levelUpChoices}
        currentLevel={character.level}
        isChapterReward={levelingState.levelUpType === 'chapter_reward'}
        characterName={character.name}
        onSelectChoice={handleLevelUpChoice}
      />
      
      {/* Inventory Command Palette */}
      <InventoryCommandPalette
        open={showInventory}
        onOpenChange={setShowInventory}
      />
    </div>
  );
}