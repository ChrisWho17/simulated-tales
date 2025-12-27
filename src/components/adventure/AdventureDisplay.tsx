import { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatBar, CircularStat } from '@/components/ui/stat-bar';
import { AtmosphericBackground } from '@/components/ui/particle-background';
import { Send, RotateCcw, Settings, Loader2, Heart, Coins, Backpack, ImageIcon, Zap, Brain, Shield, Sliders, ChevronDown, Package, Sparkles, Swords, Key, Gem, ScrollText, FlaskConical, CircleDollarSign, Wind, Cloud, CloudRain, CloudLightning, CloudFog, Sun, Snowflake, Flame, Timer } from 'lucide-react';
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
import { EventBusDebugPanel } from '@/components/game/EventBusDebugPanel';
import { ConsequenceFeed } from '@/components/game/ConsequenceFeed';
import { DirectorStatusIndicator } from '@/components/game/DirectorStatusIndicator';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useRegisteredNPCNames, parseTextForNPCLinks } from './NPCNameLink';
import { 
  addRelationshipMoment,
  MomentType, 
  MilestoneType 
} from '@/lib/relationshipJournal';
import { 
  processDialogueForNameReveals,
  resolveNPCId,
  NameRevealResult
} from '@/game/npcIdentityRegistry';
import { parseEnhancedCommand } from '@/game/commandParser';
import { playerAssessSelf, Wound } from '@/game/adrenalineCombatIntegration';
import { WeatherState, WeatherType, WEATHER_CONFIGS, createInitialWeatherState, tickWeather, forceWeather, getWeatherModifiers } from '@/game/weatherSystem';
import { WeatherModalParticles } from '@/components/ui/weather-modal-particles';
import { WeatherParticles } from '@/components/ui/weather-particles';

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
  const [showCheckSelfModal, setShowCheckSelfModal] = useState(false);
  const [checkSelfThoroughness, setCheckSelfThoroughness] = useState<'quick' | 'careful' | 'thorough'>('quick');
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [weatherState, setWeatherState] = useState<WeatherState>(() => createInitialWeatherState());
  const weatherTickRef = useRef(0);
  
  const gameContext = useGameOptional();
  const diceMode = gameContext?.diceMode ?? 'story';
  const { performRoll, shouldShowRoll, clearRoll } = useDiceRoll();
  const { toast } = useToast();
  
  // Get weather settings from game context (must come after gameContext declaration)
  const weatherEnabled = gameContext?.settings?.enableWeatherEffects ?? true;
  const weatherMode = gameContext?.settings?.weatherMode ?? 'auto';
  const manualWeatherType = gameContext?.settings?.manualWeatherType as WeatherType | undefined;
  const showWeatherParticles = gameContext?.settings?.showWeatherParticles ?? true;
  
  // Game loop for adrenaline system with player health for Director priority
  const [gameLoopState, gameLoopActions] = useGameLoop({
    playerHealth: character.currentHealth,
    playerMaxHealth: character.maxHealth,
  });
  
  // Get registered NPC names for clickable links in narrative
  const npcNameMap = useRegisteredNPCNames();
  
  // Player name for clickable link
  const playerName = character.name;
  const openCharacterSheet = useCallback(() => setShowCharacterSheet(true), []);

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

  // Handle manual weather mode
  useEffect(() => {
    if (weatherMode === 'manual' && manualWeatherType && weatherState.current !== manualWeatherType) {
      setWeatherState(prev => forceWeather(prev, manualWeatherType, weatherTickRef.current));
    }
  }, [weatherMode, manualWeatherType, weatherState.current]);

  // Detect new content when story updates and tick weather (only in auto mode)
  useEffect(() => {
    if (story.length > previousStoryLength.current) {
      if (!isAtBottom) {
        setHasNewContent(true);
      }
      // Tick weather on each new story entry (narrator turn = 1 tick) - only in auto mode
      if (weatherMode === 'auto') {
        weatherTickRef.current++;
        setWeatherState(prev => tickWeather(prev, weatherTickRef.current));
      }
    }
    previousStoryLength.current = story.length;
  }, [story.length, isAtBottom, weatherMode]);

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
      // Check for /checkself command
      const parsed = parseEnhancedCommand(input.trim());
      if (parsed.type === 'checkself') {
        const thoroughness = parsed.target === 'careful' ? 'careful' : 
                           parsed.target === 'thorough' ? 'thorough' : 'quick';
        setCheckSelfThoroughness(thoroughness);
        setShowCheckSelfModal(true);
        setInput('');
        return;
      }
      
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

  const handleCheckSelf = useCallback(() => {
    if (!gameLoopState.adrenalineState) return;
    
    const result = playerAssessSelf(gameLoopState.adrenalineState, checkSelfThoroughness, 0);
    
    // Update state via game loop
    console.log('[CheckSelf] Discovered', result.discoveredWounds.length, 'wounds');
    
    // Show result toast
    if (result.discoveredWounds.length > 0) {
      toast({
        title: `Discovered ${result.discoveredWounds.length} wound(s)!`,
        description: result.message,
        variant: 'destructive',
      });
    } else if (result.status === 'clean') {
      toast({
        title: 'No hidden injuries found',
        description: result.message,
      });
    } else {
      toast({
        title: 'Assessment inconclusive',
        description: result.message,
      });
    }
    
    setShowCheckSelfModal(false);
  }, [gameLoopState.adrenalineState, checkSelfThoroughness, toast]);

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
        const npcParsed = parseTextForNPCLinks(part, npcNameMap, `${keyPrefix}-b-${i}`, playerName, openCharacterSheet);
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
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-i-${i}-${j}`, playerName, openCharacterSheet);
            result.push(<em key={`${keyPrefix}-i-${i}-${j}`} className="text-muted-foreground">{npcParsed}</em>);
          } else if (iPart && moodConfig && tintableWords && tintableWords.size > 0) {
            // For non-italic text with active mood, check for tintable keywords (limited set)
            // Also parse for NPC names
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-mood-${i}-${j}`, playerName, openCharacterSheet);
            
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
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-t-${i}-${j}`, playerName, openCharacterSheet);
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
        
        // Process dialogue for potential name reveals (e.g., "My name is Marcus")
        // This auto-updates the NPC's aliases if they reveal their name/callsign
        const speakerNpcId = resolveNPCId(speakerName, { occupation: speakerName });
        const nameReveal = processDialogueForNameReveals(dialogueText, speakerNpcId);
        
        return (
          <div 
            key={idx} 
            className="my-4 pl-4 border-l-2 border-primary/50 glass-panel-subtle py-3 pr-4 rounded-r-lg transition-all duration-300"
          >
            <span 
              className="font-semibold transition-all duration-300" 
              style={moodConfig ? nameFrostStyle : { color: 'hsl(var(--primary))' }}
            >
              {/* Always use parseTextForNPCLinks - it will auto-register dialogue speakers */}
              {parseTextForNPCLinks(speakerName, npcNameMap, `dialogue-speaker-${idx}`, playerName, openCharacterSheet)}:
            </span>
            <span className="italic ml-2 text-foreground/90">
              &ldquo;{dialogueText}&rdquo;
            </span>
            {/* Show name reveal indicator if a name was just revealed */}
            {nameReveal && (
              <span className="ml-2 text-xs text-accent animate-fade-in">
                ✨ {nameReveal.type === 'name' ? 'Name revealed!' : 
                   nameReveal.type === 'callsign' ? 'Callsign revealed!' : 
                   nameReveal.type === 'title' ? 'Title revealed!' : 'Nickname revealed!'}
              </span>
            )}
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
      {/* Subtle atmospheric background with weather effects */}
      <div className="absolute inset-0 z-0 opacity-30">
        <AtmosphericBackground mood={currentMood} />
      </div>
      
      {/* Weather particle effects on main background */}
      {weatherEnabled && showWeatherParticles && (
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <WeatherParticles 
            mood={
              weatherState.current === 'storm' ? 'fearful' :
              weatherState.current === 'rain' ? 'sad' :
              weatherState.current === 'fog' ? 'depressed' :
              weatherState.current === 'heat_wave' ? 'mad' :
              weatherState.current === 'wind' ? 'annoyed' :
              weatherState.current === 'snow' ? 'suspicious' :
              weatherState.current === 'cloudy' ? 'neutral' :
              'happy'
            } 
            intensity={weatherState.intensity * 0.6}
          />
        </div>
      )}

      {/* Header */}
      <header className="relative z-20 glass-panel border-0 border-b border-[rgba(139,92,246,0.2)] rounded-none">
        <div className="flex items-center gap-2 px-2 md:px-4 py-2">
          {/* Logo - Fiery Gold Effect */}
          <h1 
            className="text-sm font-display font-bold tracking-wider shrink-0 fiery-gold-text"
            data-text="UNTOLD"
          >
            UNTOLD
          </h1>
          
          {/* Weather Button - Opens weather modal */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowWeatherModal(true)}
            className={`h-7 w-7 rounded-md frosted-button shrink-0 ${
              weatherState.current === 'storm' ? 'text-yellow-400 hover:text-yellow-300' : 
              weatherState.current === 'rain' ? 'text-blue-400 hover:text-blue-300' : 
              weatherState.current === 'fog' ? 'text-violet-400 hover:text-violet-300' : 
              weatherState.current === 'heat_wave' ? 'text-red-400 hover:text-red-300' : 
              weatherState.current === 'wind' ? 'text-orange-400 hover:text-orange-300' :
              weatherState.current === 'snow' ? 'text-cyan-400 hover:text-cyan-300' :
              weatherState.current === 'cloudy' ? 'text-slate-400 hover:text-slate-300' :
              'text-amber-400 hover:text-amber-300'
            }`}
            title={`Weather: ${WEATHER_CONFIGS[weatherState.current].name}`}
          >
            {weatherState.current === 'storm' ? (
              <CloudLightning className="w-4 h-4" />
            ) : weatherState.current === 'rain' ? (
              <CloudRain className="w-4 h-4" />
            ) : weatherState.current === 'fog' ? (
              <CloudFog className="w-4 h-4" />
            ) : weatherState.current === 'heat_wave' ? (
              <Flame className="w-4 h-4" />
            ) : weatherState.current === 'wind' ? (
              <Wind className="w-4 h-4" />
            ) : weatherState.current === 'snow' ? (
              <Snowflake className="w-4 h-4" />
            ) : weatherState.current === 'cloudy' ? (
              <Cloud className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          {/* Separator */}
          <div className="hidden md:block h-4 w-px bg-border/30 shrink-0" />

          {/* Character Quick Stats - Condensed frosted panels */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0">
            {/* Health with Mood Aura */}
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-sm bg-background/20 border border-border/20 shrink-0"
              style={currentMood !== 'neutral' ? {
                boxShadow: `0 0 8px ${MOOD_COLORS[currentMood]?.glow || 'transparent'}40`,
              } : undefined}
            >
              <CircularStat 
                value={character.currentHealth} 
                max={character.maxHealth} 
                type="health"
                size={28}
                strokeWidth={2}
                icon={<Heart className="w-3 h-3" />}
              />
              <div className="text-[10px]">
                <span className={`font-mono font-bold ${isCritical ? 'text-destructive animate-pulse' : 'text-success'}`}>
                  {character.currentHealth}
                </span>
                <span className="text-muted-foreground">/{character.maxHealth}</span>
              </div>
            </div>

            {/* Gold */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-sm bg-background/20 border border-border/20 shrink-0">
              <Coins className="w-3 h-3 text-warning" />
              <span className="font-mono text-[10px] font-semibold text-warning">{character.gold}</span>
            </div>

            {/* Level & XP */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm bg-background/20 border border-border/20 shrink-0">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground">Lv</span>
                <span className="font-mono text-xs font-bold text-primary">{character.level}</span>
              </div>
              <div className="w-10 h-1 bg-muted/30 rounded-full overflow-hidden" title={`${levelingState.currentXP}/${levelingState.xpThreshold} XP`}>
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70"
                  style={{ width: `${Math.min(100, (levelingState.currentXP / levelingState.xpThreshold) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground truncate max-w-12">{charClass?.name}</span>
            </div>
          </div>

          {/* Director Status - Debug only */}
          {(cheatMode || gameContext?.settings?.showEventBusDebug) && (
            <DirectorStatusIndicator compact className="shrink-0" />
          )}
          
          {cheatMode && (
            <span className="text-[8px] bg-primary/20 text-primary px-1 py-0.5 rounded-full border border-primary/30 animate-glow-pulse shrink-0">
              DEV
            </span>
          )}

          {/* Action Buttons - Frosted UI */}
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            <SavesDropdown />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInventory(true)}
              className="h-7 w-7 rounded-md frosted-button text-muted-foreground/70 hover:text-primary"
              title="Inventory (Ctrl+I)"
            >
              <Package className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCharacterSheet(true)}
              className="h-7 w-7 rounded-md frosted-button text-muted-foreground/70 hover:text-primary"
              title="Character Sheet"
            >
              <Backpack className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="h-7 w-7 rounded-md frosted-button text-muted-foreground/70 hover:text-primary"
              title="Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCheatMode}
              className="hidden xs:flex h-7 w-7 rounded-md frosted-button text-muted-foreground/70 hover:text-primary"
              title="Toggle Dev Mode"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onRestart}
              className="h-7 w-7 rounded-md frosted-button text-muted-foreground/70 hover:text-destructive"
              title="New Adventure"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
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
        onUseItem={(itemName, intention) => {
          // Send item usage to the AI as a player action with the item context
          const actionText = `[Uses ${itemName}]: ${intention}`;
          onPlayerAction(actionText);
        }}
      />
      
      {/* Event Bus Debug Panel - show if enabled in settings or cheat mode */}
      {(cheatMode || (gameContext?.settings?.showEventBusDebug ?? false)) && <EventBusDebugPanel />}
      
      {/* Consequence Feed - show if enabled in settings */}
      {(gameContext?.settings?.showConsequenceFeed ?? true) && <ConsequenceFeed compact={false} />}
      
      {/* Check Self Modal */}
      {showCheckSelfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/20">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Assess Yourself</h2>
                <p className="text-sm text-muted-foreground">Check for hidden injuries</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Take a moment to check your body for wounds you might not have noticed in the heat of the moment.
            </p>
            
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium">Thoroughness</label>
              <div className="flex gap-2">
                <Button
                  variant={checkSelfThoroughness === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCheckSelfThoroughness('quick')}
                  className="flex-1"
                >
                  Quick
                </Button>
                <Button
                  variant={checkSelfThoroughness === 'careful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCheckSelfThoroughness('careful')}
                  className="flex-1"
                >
                  Careful
                </Button>
                <Button
                  variant={checkSelfThoroughness === 'thorough' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCheckSelfThoroughness('thorough')}
                  className="flex-1"
                >
                  Thorough
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {checkSelfThoroughness === 'quick' && 'Fast check, may miss some injuries'}
                {checkSelfThoroughness === 'careful' && 'Balanced check, good chance to find injuries'}
                {checkSelfThoroughness === 'thorough' && 'Slow and methodical, high chance to find everything'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCheckSelfModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckSelf}
                className="flex-1"
              >
                Check Self
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Tip: Type <code className="bg-muted px-1 rounded">/checkself</code> or <code className="bg-muted px-1 rounded">/checkself thorough</code>
            </p>
          </div>
        </div>
      )}

      {/* Weather Modal with Particles */}
      {showWeatherModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowWeatherModal(false)}
        >
          <div 
            className="glass-panel p-6 max-w-md w-full mx-4 space-y-5 animate-scale-in relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Particle Effects Background */}
            <WeatherModalParticles weather={weatherState.current} intensity={weatherState.intensity} />
            
            <div className="text-center space-y-4 relative z-10">
              {/* Weather Icon with animation */}
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                weatherState.current === 'storm' ? 'bg-yellow-500/20 animate-pulse' : 
                weatherState.current === 'rain' ? 'bg-blue-500/20' : 
                weatherState.current === 'fog' ? 'bg-violet-500/20' : 
                weatherState.current === 'heat_wave' ? 'bg-red-500/20 animate-pulse' : 
                weatherState.current === 'wind' ? 'bg-orange-500/20' :
                weatherState.current === 'snow' ? 'bg-cyan-500/20' :
                weatherState.current === 'cloudy' ? 'bg-slate-500/20' :
                'bg-amber-500/20'
              }`}>
                {weatherState.current === 'storm' ? (
                  <CloudLightning className="w-10 h-10 text-yellow-400" />
                ) : weatherState.current === 'rain' ? (
                  <CloudRain className="w-10 h-10 text-blue-400" />
                ) : weatherState.current === 'fog' ? (
                  <CloudFog className="w-10 h-10 text-violet-400" />
                ) : weatherState.current === 'heat_wave' ? (
                  <Flame className="w-10 h-10 text-red-400" />
                ) : weatherState.current === 'wind' ? (
                  <Wind className="w-10 h-10 text-orange-400" />
                ) : weatherState.current === 'snow' ? (
                  <Snowflake className="w-10 h-10 text-cyan-400" />
                ) : weatherState.current === 'cloudy' ? (
                  <Cloud className="w-10 h-10 text-slate-400" />
                ) : (
                  <Sun className="w-10 h-10 text-amber-400" />
                )}
              </div>
              
              {/* Weather Title */}
              <h3 className={`text-3xl font-display font-bold ${
                weatherState.current === 'storm' ? 'text-yellow-300' : 
                weatherState.current === 'rain' ? 'text-blue-300' : 
                weatherState.current === 'fog' ? 'text-violet-300' : 
                weatherState.current === 'heat_wave' ? 'text-red-300' : 
                weatherState.current === 'wind' ? 'text-orange-300' :
                weatherState.current === 'snow' ? 'text-cyan-300' :
                weatherState.current === 'cloudy' ? 'text-slate-300' :
                'text-amber-300'
              }`}>
                {WEATHER_CONFIGS[weatherState.current].name}
              </h3>
              
              {/* Duration Bar */}
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Timer className="w-3 h-3" />
                <div className="w-24 h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      weatherState.current === 'storm' ? 'bg-yellow-500' : 
                      weatherState.current === 'rain' ? 'bg-blue-500' : 
                      weatherState.current === 'fog' ? 'bg-violet-500' : 
                      weatherState.current === 'heat_wave' ? 'bg-red-500' : 
                      weatherState.current === 'wind' ? 'bg-orange-500' :
                      weatherState.current === 'snow' ? 'bg-cyan-500' :
                      weatherState.current === 'cloudy' ? 'bg-slate-500' :
                      'bg-amber-500'
                    }`}
                    style={{ width: `${(weatherState.ticksRemaining / weatherState.totalDuration) * 100}%` }}
                  />
                </div>
                <span>{weatherState.ticksRemaining} turns</span>
              </div>
              
              {/* Main Description */}
              <p className="text-muted-foreground leading-relaxed">
                {WEATHER_CONFIGS[weatherState.current].description}
              </p>
              
              {/* Ambient Text */}
              <p className="text-sm text-foreground/70 italic">
                {WEATHER_CONFIGS[weatherState.current].ambientText}
              </p>
              
              {/* Weather Effects */}
              <div className={`mt-4 p-3 rounded-lg border ${
                weatherState.current === 'storm' ? 'border-yellow-500/30 bg-yellow-500/5' : 
                weatherState.current === 'rain' ? 'border-blue-500/30 bg-blue-500/5' : 
                weatherState.current === 'fog' ? 'border-violet-500/30 bg-violet-500/5' : 
                weatherState.current === 'heat_wave' ? 'border-red-500/30 bg-red-500/5' : 
                weatherState.current === 'wind' ? 'border-orange-500/30 bg-orange-500/5' :
                weatherState.current === 'snow' ? 'border-cyan-500/30 bg-cyan-500/5' :
                weatherState.current === 'cloudy' ? 'border-slate-500/30 bg-slate-500/5' :
                'border-amber-500/30 bg-amber-500/5'
              }`}>
                <p className="text-xs text-muted-foreground/80 mb-2">
                  {WEATHER_CONFIGS[weatherState.current].effects.join(' • ')}
                </p>
                
                {/* Gameplay Modifiers */}
                {weatherEnabled && (
                  <div className="border-t border-border/20 pt-2 mt-2">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Gameplay Effects:</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {(() => {
                        const mods = getWeatherModifiers(weatherState);
                        return (
                          <>
                            <span className={mods.visibilityMod >= 0 ? 'text-green-400' : 'text-red-400'}>
                              👁 Visibility: {mods.visibilityMod > 0 ? '+' : ''}{mods.visibilityMod}%
                            </span>
                            <span className={mods.movementMod >= 0 ? 'text-green-400' : 'text-red-400'}>
                              🦶 Movement: {mods.movementMod > 0 ? '+' : ''}{mods.movementMod}%
                            </span>
                            <span className={mods.rangedAccuracyMod >= 0 ? 'text-green-400' : 'text-red-400'}>
                              🎯 Ranged: {mods.rangedAccuracyMod > 0 ? '+' : ''}{mods.rangedAccuracyMod}%
                            </span>
                            <span className={mods.stealthMod >= 0 ? 'text-green-400' : 'text-red-400'}>
                              🥷 Stealth: {mods.stealthMod > 0 ? '+' : ''}{mods.stealthMod}%
                            </span>
                            <span className={mods.perceptionMod >= 0 ? 'text-green-400' : 'text-red-400'}>
                              👂 Perception: {mods.perceptionMod > 0 ? '+' : ''}{mods.perceptionMod}%
                            </span>
                            <span className={mods.fatigueRateMod <= 1 ? 'text-green-400' : 'text-red-400'}>
                              💤 Fatigue: ×{mods.fatigueRateMod.toFixed(1)}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Weather Transition Warning */}
              {weatherState.transitioningTo && (
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 animate-pulse">
                  <span>Weather changing to</span>
                  <span className="font-medium">{WEATHER_CONFIGS[weatherState.transitioningTo].name}</span>
                  <span>soon...</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => setShowWeatherModal(false)}
              className="w-full relative z-10"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}