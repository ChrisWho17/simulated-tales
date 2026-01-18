import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, X, Save, RefreshCw, Loader2, User, Heart, Shield, Sword, 
  Brain, Zap, Star, Coins, ChevronDown, ChevronUp, AlertTriangle,
  Shirt, Sparkles, Activity, Database, ShieldCheck, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Users, Plus, Trash2, Edit3, Package,
  Flame, Clock, MapPin, Infinity, Crown, Skull, Eye, Volume2, VolumeX,
  Crosshair, Target, Dices, RotateCcw, Settings, Gauge
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAchievementsOptional } from '@/components/game/Achievements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DataIntegrityService, IntegrityReport } from '@/services/dataIntegrityService';
import { EventBusDebugPanel } from '@/components/game/EventBusDebugPanel';
import { RPGCharacter, CharacterStats } from '@/types/rpgCharacter';
import { 
  TieredAppearance, 
  SimpleAppearance, 
  DetailedAppearance, 
  FullAppearance,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_COLORS,
  BUILD_OPTIONS,
  HEIGHT_OPTIONS,
  GENDER_OPTIONS,
  CLOTHING_STYLE_OPTIONS,
  Gender,
} from '@/types/characterCreation';
import { 
  PlayerPortraitReference, 
  savePlayerPortraitReference, 
  loadPlayerPortraitReference 
} from '@/game/playerPortraitReference';
import { 
  companionSystem,
  CompanionState,
  CompanionMood,
  CompanionStatus,
  COMPANION_TEMPLATES,
  PersonalityTrait,
} from '@/game/companionSystem';
import { wardrobeManager, WardrobeState, WardrobeItem } from '@/game/wardrobeSystem';
import { getStarterClothingForGenre, buildClothingDescriptionForAI } from '@/game/starterClothingSystem';
import { ClothingSlot } from '@/game/clothingItemSystem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryEditor } from './InventoryEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CHARACTER_KEY = 'living-world-character';

// Hook for detecting cheat mode commands
export function useCheatModeCommand() {
  const [isCheatModeOpen, setIsCheatModeOpen] = useState(false);
  const [devPanelMode, setDevPanelMode] = useState<DevPanelMode>('cheat');
  
  const checkForCheatCommand = useCallback((input: string): boolean => {
    const trimmed = input.trim().toLowerCase();
    
    if (trimmed === '/iamacheater' || trimmed === '/cheat') {
      setDevPanelMode('cheat');
      setIsCheatModeOpen(true);
      return true;
    }
    
    if (trimmed === '/events' || trimmed === '/eventbus') {
      setDevPanelMode('events');
      setIsCheatModeOpen(true);
      return true;
    }
    
    if (trimmed === '/integrity' || trimmed === '/scan') {
      setDevPanelMode('integrity');
      setIsCheatModeOpen(true);
      return true;
    }
    
    return false;
  }, []);
  
  const closeCheatMode = useCallback(() => {
    setIsCheatModeOpen(false);
  }, []);
  
  return {
    isCheatModeOpen,
    devPanelMode,
    checkForCheatCommand,
    closeCheatMode,
    setIsCheatModeOpen,
  };
}

// Screen types for navigation
type EditorScreen = 'cheats' | 'character' | 'inventory' | 'companions';

const SCREENS: { id: EditorScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'cheats', label: 'Cheats', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'character', label: 'Character', icon: <User className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'companions', label: 'Companions', icon: <Users className="w-4 h-4" /> },
];

// Available personality traits for companion creation
const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'honorable', 'ruthless', 'kind', 'cruel', 'brave', 'cowardly',
  'greedy', 'generous', 'loyal', 'treacherous', 'romantic', 'pragmatic',
  'spiritual', 'skeptical', 'vengeful', 'forgiving', 'ambitious', 'humble'
];

const COMBAT_ROLES = ['tank', 'damage', 'support', 'ranged'] as const;

interface CheatModeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  character?: RPGCharacter & { portraitUrl?: string };
  onUpdateCharacter?: (character: RPGCharacter & { portraitUrl?: string }) => void;
  genre?: string;
  initialMode?: DevPanelMode;
}

export type DevPanelMode = 'cheat' | 'events' | 'integrity';

// Cheat state interface
interface CheatState {
  godMode: boolean;
  infiniteGold: boolean;
  maxStats: boolean;
  instantKill: boolean;
  noClip: boolean;
  speedMultiplier: number;
  timeScale: number;
  unlockAll: boolean;
  invisibility: boolean;
  infiniteAmmo: boolean;
}

// Companion creator state
interface CompanionCreatorState {
  name: string;
  gender: Gender;
  height: string;
  build: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  traits: PersonalityTrait[];
  combatRole: typeof COMBAT_ROLES[number];
  backstory: string;
  skills: string[];
  speechPattern: string;
  catchphrases: string[];
}

const DEFAULT_COMPANION_CREATOR: CompanionCreatorState = {
  name: '',
  gender: 'other',
  height: 'average',
  build: 'average',
  skinTone: 'Medium',
  hairStyle: 'Medium',
  hairColor: 'Brown',
  eyeColor: 'Brown',
  traits: ['loyal', 'brave'],
  combatRole: 'damage',
  backstory: '',
  skills: [],
  speechPattern: 'casual, friendly',
  catchphrases: [],
};

// Save character appearance to campaign for consistent image generation
function saveCharacterAppearanceToCampaign(
  characterData: any,
  genre: string
): void {
  try {
    const portraitReference = loadPlayerPortraitReference();
    
    if (portraitReference && characterData.appearance) {
      const simple = characterData.appearance.simple;
      const detailed = characterData.appearance.detailed;
      const full = characterData.appearance.full;
      
      savePlayerPortraitReference(
        {
          name: characterData.name || portraitReference.name,
          gender: simple?.gender || portraitReference.gender,
          build: simple?.build || portraitReference.build,
          height: simple?.height || portraitReference.height,
          skinTone: detailed?.skinTone || portraitReference.skinTone,
          hairColor: detailed?.hairColor || portraitReference.hairColor,
          hairStyle: detailed?.hairStyle || portraitReference.hairStyle,
          eyeColor: detailed?.eyeColor || portraitReference.eyeColor,
          details: detailed?.distinguishingFeatures || portraitReference.details,
          tieredAppearance: characterData.appearance,
        },
        genre,
        portraitReference.className,
        portraitReference.portraitHints
      );
      
      console.log('[CheatMode] Updated character appearance in campaign');
    }
    
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
  } catch (error) {
    console.error('[CheatMode] Failed to save character appearance:', error);
  }
}

export function CheatModeSplash({ 
  isOpen, 
  onClose, 
  character, 
  onUpdateCharacter,
  genre = 'fantasy',
  initialMode = 'cheat'
}: CheatModeSplashProps) {
  const achievements = useAchievementsOptional();
  const hasUnlockedCheaterAchievement = useRef(false);
  
  // Current screen
  const [currentScreen, setCurrentScreen] = useState<EditorScreen>('cheats');
  
  // Cheat state
  const [cheats, setCheats] = useState<CheatState>({
    godMode: false,
    infiniteGold: false,
    maxStats: false,
    instantKill: false,
    noClip: false,
    speedMultiplier: 1,
    timeScale: 1,
    unlockAll: false,
    invisibility: false,
    infiniteAmmo: false,
  });
  
  // Character stats
  const [name, setName] = useState(character?.name || '');
  const [level, setLevel] = useState(character?.level || 1);
  const [gold, setGold] = useState(character?.gold || 0);
  const [currentHealth, setCurrentHealth] = useState(character?.currentHealth || 100);
  const [maxHealth, setMaxHealth] = useState(character?.maxHealth || 100);
  const [experience, setExperience] = useState(character?.experience || 0);
  
  // Stats
  const [stats, setStats] = useState<CharacterStats>(character?.stats || {
    strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10
  });
  
  // Appearance
  const [appearance, setAppearance] = useState<TieredAppearance | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stats: initialMode === 'cheat',
    appearance: false,
    equipment: false,
    developer: initialMode === 'events' || initialMode === 'integrity',
  });
  
  // Developer tools state
  const [showEventBus, setShowEventBus] = useState(initialMode === 'events');
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Wardrobe state
  const [wardrobeState, setWardrobeState] = useState<WardrobeState | null>(null);
  const [clothingDescription, setClothingDescription] = useState<string>('');
  
  // Companion state
  const [companions, setCompanions] = useState<CompanionState[]>([]);
  const [editingCompanion, setEditingCompanion] = useState<CompanionState | null>(null);
  const [showCompanionCreator, setShowCompanionCreator] = useState(false);
  const [companionCreator, setCompanionCreator] = useState<CompanionCreatorState>(DEFAULT_COMPANION_CREATOR);
  const [companionCreatorStep, setCompanionCreatorStep] = useState<'basics' | 'appearance' | 'personality' | 'combat'>('basics');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle initialMode changes when panel opens
  useEffect(() => {
    if (isOpen) {
      setExpandedSections({
        stats: initialMode === 'cheat',
        appearance: false,
        equipment: false,
        developer: initialMode === 'events' || initialMode === 'integrity',
      });
      setShowEventBus(initialMode === 'events');
      
      // Reset to cheats screen when opening
      setCurrentScreen('cheats');
      
      // Auto-run integrity scan when opened via /integrity command
      if (initialMode === 'integrity') {
        setIsScanning(true);
        DataIntegrityService.runFullScan().then(report => {
          setIntegrityReport(report);
          if (report.corrupted === 0 && report.unrecoverable === 0) {
            toast.success('All campaigns healthy!');
          } else {
            toast.warning(`Found ${report.corrupted + report.unrecoverable} issues`);
          }
        }).catch(() => {
          toast.error('Scan failed');
        }).finally(() => {
          setIsScanning(false);
        });
      }
    }
  }, [isOpen, initialMode]);
  
  // Unlock cheater achievement when cheat mode is first opened
  useEffect(() => {
    if (isOpen && !hasUnlockedCheaterAchievement.current && achievements) {
      achievements.unlockAchievement('cheater');
      hasUnlockedCheaterAchievement.current = true;
    }
  }, [isOpen, achievements]);
  
  // Load character data when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      const loadData = async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          const savedChar = localStorage.getItem(CHARACTER_KEY);
          if (savedChar) {
            const parsed = JSON.parse(savedChar);
            setName(parsed.basicInfo?.name || character?.name || '');
            setAppearance(parsed.appearance || null);
          }
          
          if (character) {
            setLevel(character.level);
            setGold(character.gold);
            setCurrentHealth(character.currentHealth);
            setMaxHealth(character.maxHealth);
            setExperience(character.experience);
            setStats(character.stats);
          }
          
          // Load wardrobe state
          const currentWardrobe = wardrobeManager.getState();
          setWardrobeState(currentWardrobe);
          
          // Build clothing description
          const equippedItems = Object.entries(currentWardrobe.equipped)
            .filter(([_, wi]) => wi !== undefined)
            .map(([slot, wi]) => ({
              slot: slot as ClothingSlot,
              name: wi!.item.name,
              description: wi!.item.description,
            }));
          
          const description = buildClothingDescriptionForAI(equippedItems, genre);
          setClothingDescription(description);
          
          // Load companions
          setCompanions(companionSystem.getActiveCompanions());
        } catch (e) {
          console.error('[CheatMode] Failed to load character:', e);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    } else {
      setIsLoading(true);
    }
  }, [isOpen, character, genre]);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleStatChange = (stat: keyof CharacterStats, value: number) => {
    setStats(prev => ({ ...prev, [stat]: Math.max(1, Math.min(30, value)) }));
  };
  
  const handleAppearanceSimpleChange = (key: keyof SimpleAppearance, value: any) => {
    setAppearance(prev => {
      if (!prev) return null;
      return {
        ...prev,
        simple: { ...prev.simple, [key]: value }
      };
    });
  };
  
  const handleAppearanceDetailedChange = (key: keyof DetailedAppearance, value: any) => {
    setAppearance(prev => {
      if (!prev) return null;
      return {
        ...prev,
        detailed: { ...prev.detailed, [key]: value } as DetailedAppearance
      };
    });
  };
  
  const handleAppearanceFullChange = (key: keyof FullAppearance, value: any) => {
    setAppearance(prev => {
      if (!prev) return null;
      return {
        ...prev,
        full: { ...prev.full, [key]: value } as FullAppearance
      };
    });
  };
  
  // Cheat actions
  const applyCheat = (cheatName: keyof CheatState, value: boolean | number) => {
    setCheats(prev => ({ ...prev, [cheatName]: value }));
    
    // Apply immediate effects
    if (cheatName === 'godMode' && value === true) {
      setCurrentHealth(maxHealth);
      toast.success('God Mode enabled! You are invincible.');
    }
    if (cheatName === 'infiniteGold' && value === true) {
      setGold(999999);
      toast.success('Infinite gold enabled!');
    }
    if (cheatName === 'maxStats' && value === true) {
      setStats({
        strength: 30, dexterity: 30, constitution: 30,
        intelligence: 30, wisdom: 30, charisma: 30
      });
      toast.success('All stats maxed to 30!');
    }
    if (cheatName === 'unlockAll' && value === true) {
      toast.success('All items and abilities unlocked!');
    }
  };
  
  const addInstantGold = (amount: number) => {
    setGold(prev => prev + amount);
    toast.success(`Added ${amount.toLocaleString()} gold!`);
  };
  
  const addInstantXP = (amount: number) => {
    setExperience(prev => prev + amount);
    toast.success(`Added ${amount.toLocaleString()} XP!`);
  };
  
  const levelUp = () => {
    setLevel(prev => Math.min(prev + 1, 100));
    toast.success(`Leveled up to ${level + 1}!`);
  };
  
  const fullHeal = () => {
    setCurrentHealth(maxHealth);
    toast.success('Fully healed!');
  };
  
  // Navigation
  const currentScreenIndex = SCREENS.findIndex(s => s.id === currentScreen);
  const canGoLeft = currentScreenIndex > 0;
  const canGoRight = currentScreenIndex < SCREENS.length - 1;
  
  const goToScreen = (screen: EditorScreen) => setCurrentScreen(screen);
  const goLeft = () => canGoLeft && setCurrentScreen(SCREENS[currentScreenIndex - 1].id);
  const goRight = () => canGoRight && setCurrentScreen(SCREENS[currentScreenIndex + 1].id);
  
  // Companion creator
  const createCompanionFromCreator = () => {
    if (!companionCreator.name.trim()) {
      toast.error('Please enter a companion name');
      return;
    }
    
    const companionId = `companion_${Date.now()}`;
    
    // Create custom personality based on selected traits
    const customPersonality = {
      traits: companionCreator.traits,
      values: {
        honor: companionCreator.traits.includes('honorable') ? 80 : companionCreator.traits.includes('ruthless') ? 20 : 50,
        wealth: companionCreator.traits.includes('greedy') ? 90 : companionCreator.traits.includes('generous') ? 20 : 50,
        power: companionCreator.traits.includes('ambitious') ? 80 : companionCreator.traits.includes('humble') ? 20 : 50,
        love: companionCreator.traits.includes('romantic') ? 80 : companionCreator.traits.includes('pragmatic') ? 30 : 50,
        freedom: 60,
        justice: companionCreator.traits.includes('kind') ? 70 : companionCreator.traits.includes('cruel') ? 20 : 50,
        knowledge: 50,
        family: 50,
      },
      approves: companionCreator.traits.includes('honorable') 
        ? ['truth', 'loyalty', 'bravery'] 
        : companionCreator.traits.includes('greedy')
        ? ['theft', 'greed']
        : ['diplomacy', 'mercy'],
      disapproves: companionCreator.traits.includes('kind')
        ? ['cruelty', 'betrayal']
        : companionCreator.traits.includes('ruthless')
        ? ['mercy', 'charity']
        : ['cowardice'],
      romanticInterest: {
        enabled: companionCreator.traits.includes('romantic'),
        preferredGender: 'any' as const,
        attractedToPlayer: companionCreator.traits.includes('romantic'),
        romanceThreshold: 70,
      },
      betrayalThreshold: companionCreator.traits.includes('loyal') ? -80 : -40,
      departureThreshold: companionCreator.traits.includes('loyal') ? -60 : -30,
      speechPattern: companionCreator.speechPattern,
      catchphrases: companionCreator.catchphrases.length > 0 
        ? companionCreator.catchphrases 
        : ['Interesting...', 'I see.'],
      quirks: [],
    };
    
    const companion: CompanionState = {
      id: companionId,
      name: companionCreator.name.trim(),
      status: 'active',
      mood: 'content',
      moodIntensity: 60,
      affinity: 30,
      trust: 40,
      respect: 40,
      fear: 0,
      romanticInterest: companionCreator.traits.includes('romantic') ? 20 : 0,
      personality: customPersonality as any,
      memories: [],
      internalThoughts: `Excited to begin this adventure with a new companion.`,
      wantsToSpeak: true,
      pendingReaction: `I'm glad to be traveling with you.`,
      combatRole: companionCreator.combatRole,
      skills: companionCreator.skills.length > 0 
        ? companionCreator.skills 
        : ['basic_attack', 'defend'],
      equipment: [],
      joinedAt: Date.now(),
      lastSpoke: 0,
      confessedLove: false,
      wasBetrayed: false,
      hasSecret: Math.random() > 0.5,
      secretRevealed: false,
    };
    
    // Store appearance data separately (this would be for portrait generation)
    const companionAppearance = {
      gender: companionCreator.gender,
      height: companionCreator.height,
      build: companionCreator.build,
      skinTone: companionCreator.skinTone,
      hairStyle: companionCreator.hairStyle,
      hairColor: companionCreator.hairColor,
      eyeColor: companionCreator.eyeColor,
    };
    
    // Save companion appearance to localStorage for portrait generation
    try {
      const companionAppearances = JSON.parse(localStorage.getItem('companion-appearances') || '{}');
      companionAppearances[companionId] = companionAppearance;
      localStorage.setItem('companion-appearances', JSON.stringify(companionAppearances));
    } catch (e) {
      console.error('Failed to save companion appearance:', e);
    }
    
    // Add to companion system
    companionSystem.getAllCompanions().push(companion);
    companionSystem.recruitCompanion(companion.id);
    
    setCompanions(companionSystem.getActiveCompanions());
    setShowCompanionCreator(false);
    setCompanionCreator(DEFAULT_COMPANION_CREATOR);
    setCompanionCreatorStep('basics');
    
    toast.success(`${companion.name} has joined your party!`);
  };
  
  const handleRemoveCompanion = (companionId: string) => {
    companionSystem.dismissCompanion(companionId, 'player');
    setCompanions(companionSystem.getActiveCompanions());
    setEditingCompanion(null);
    toast.success('Companion dismissed');
  };
  
  const handleUpdateCompanion = (updated: CompanionState) => {
    const allCompanions = companionSystem.getAllCompanions();
    const index = allCompanions.findIndex(c => c.id === updated.id);
    if (index !== -1) {
      allCompanions[index] = updated;
      setCompanions(companionSystem.getActiveCompanions());
      setEditingCompanion(null);
      toast.success(`${updated.name} updated!`);
    }
  };
  
  const toggleCompanionTrait = (trait: PersonalityTrait) => {
    setCompanionCreator(prev => {
      if (prev.traits.includes(trait)) {
        return { ...prev, traits: prev.traits.filter(t => t !== trait) };
      } else if (prev.traits.length < 5) {
        return { ...prev, traits: [...prev.traits, trait] };
      }
      return prev;
    });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (character && onUpdateCharacter) {
        const updatedCharacter: RPGCharacter & { portraitUrl?: string } = {
          ...character,
          name,
          level,
          gold,
          currentHealth: Math.min(currentHealth, maxHealth),
          maxHealth,
          experience,
          stats,
        };
        onUpdateCharacter(updatedCharacter);
      }
      
      const savedChar = localStorage.getItem(CHARACTER_KEY);
      if (savedChar) {
        const parsed = JSON.parse(savedChar);
        const updated = {
          ...parsed,
          basicInfo: { ...parsed.basicInfo, name },
          appearance: appearance || parsed.appearance,
          ...(appearance?.full?.clothingStyle && {
            clothingOverride: appearance.full.clothingStyle
          }),
        };
        
        saveCharacterAppearanceToCampaign(updated, genre);
      }
      
      // Save cheat state
      localStorage.setItem('cheat-mode-state', JSON.stringify(cheats));
      
      toast.success('All changes saved!');
      onClose();
    } catch (error) {
      console.error('[CheatMode] Failed to save:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (editingCompanion) {
          setEditingCompanion(null);
        } else if (showCompanionCreator) {
          setShowCompanionCreator(false);
        } else {
          onClose();
        }
      }
      
      if (e.key === 'ArrowLeft' && !editingCompanion && !showCompanionCreator) {
        goLeft();
      }
      if (e.key === 'ArrowRight' && !editingCompanion && !showCompanionCreator) {
        goRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingCompanion, showCompanionCreator]);

  // ==================== RENDER SCREENS ====================

  const renderCheatsScreen = () => (
    <div className="space-y-4">
      {/* Toggle Cheats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">God Mode</span>
          </div>
          <Switch
            checked={cheats.godMode}
            onCheckedChange={(v) => applyCheat('godMode', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">∞ Gold</span>
          </div>
          <Switch
            checked={cheats.infiniteGold}
            onCheckedChange={(v) => applyCheat('infiniteGold', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Max Stats</span>
          </div>
          <Switch
            checked={cheats.maxStats}
            onCheckedChange={(v) => applyCheat('maxStats', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium">Instant Kill</span>
          </div>
          <Switch
            checked={cheats.instantKill}
            onCheckedChange={(v) => applyCheat('instantKill', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Invisibility</span>
          </div>
          <Switch
            checked={cheats.invisibility}
            onCheckedChange={(v) => applyCheat('invisibility', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">Unlock All</span>
          </div>
          <Switch
            checked={cheats.unlockAll}
            onCheckedChange={(v) => applyCheat('unlockAll', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">∞ Ammo</span>
          </div>
          <Switch
            checked={cheats.infiniteAmmo}
            onCheckedChange={(v) => applyCheat('infiniteAmmo', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">No Clip</span>
          </div>
          <Switch
            checked={cheats.noClip}
            onCheckedChange={(v) => applyCheat('noClip', v)}
          />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Quick Actions</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addInstantGold(10000)}
            className="text-xs"
          >
            <Coins className="w-3 h-3 mr-1" /> +10K Gold
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addInstantXP(5000)}
            className="text-xs"
          >
            <Star className="w-3 h-3 mr-1" /> +5K XP
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={levelUp}
            className="text-xs"
          >
            <Zap className="w-3 h-3 mr-1" /> Level Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fullHeal}
            className="text-xs"
          >
            <Heart className="w-3 h-3 mr-1" /> Full Heal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addInstantGold(100000)}
            className="text-xs"
          >
            <Coins className="w-3 h-3 mr-1" /> +100K Gold
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExperience(prev => prev + 50000)}
            className="text-xs"
          >
            <Star className="w-3 h-3 mr-1" /> +50K XP
          </Button>
        </div>
      </div>
      
      {/* Speed/Time Sliders */}
      <div className="space-y-4 p-3 bg-muted/20 rounded-lg border border-border/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Speed Multiplier
            </Label>
            <span className="font-mono text-sm">{cheats.speedMultiplier}x</span>
          </div>
          <Slider
            value={[cheats.speedMultiplier]}
            onValueChange={([v]) => setCheats(prev => ({ ...prev, speedMultiplier: v }))}
            min={0.5}
            max={4}
            step={0.5}
            className="flex-1"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time Scale
            </Label>
            <span className="font-mono text-sm">{cheats.timeScale}x</span>
          </div>
          <Slider
            value={[cheats.timeScale]}
            onValueChange={([v]) => setCheats(prev => ({ ...prev, timeScale: v }))}
            min={0.25}
            max={4}
            step={0.25}
            className="flex-1"
          />
        </div>
      </div>
      
      {/* Current Stats Display */}
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
        <Label className="text-xs uppercase text-muted-foreground mb-2 block">Current Values</Label>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="font-mono text-lg text-primary">{level}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div>
            <div className="font-mono text-lg text-amber-400">{gold.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Gold</div>
          </div>
          <div>
            <div className="font-mono text-lg text-green-400">{currentHealth}/{maxHealth}</div>
            <div className="text-xs text-muted-foreground">Health</div>
          </div>
          <div>
            <div className="font-mono text-lg text-blue-400">{experience.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
        </div>
      </div>
      
      {/* Developer Tools */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('developer')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-sm">Developer Tools</span>
          </div>
          {expandedSections.developer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.developer && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Event Bus Monitor
                </Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEventBus(!showEventBus)}
                >
                  {showEventBus ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showEventBus && (
                <div className="mt-2">
                  <EventBusDebugPanel />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  Data Integrity
                </Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsScanning(true);
                    try {
                      const report = await DataIntegrityService.runFullScan();
                      setIntegrityReport(report);
                    } catch (e) {
                      toast.error('Scan failed');
                    } finally {
                      setIsScanning(false);
                    }
                  }}
                  disabled={isScanning}
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
                </Button>
              </div>
              
              {integrityReport && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Valid: {integrityReport.valid}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                    <span>Repaired: {integrityReport.repaired}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>Corrupted: {integrityReport.corrupted}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Unrecoverable: {integrityReport.unrecoverable}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCharacterScreen = () => (
    <div className="space-y-3">
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Character Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter name..."
          className="bg-background/50 h-8 text-sm"
        />
      </div>
      
      {/* Stats Section */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Stats & Resources</span>
          </div>
          {expandedSections.stats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.stats && (
          <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Level</Label>
                <Input
                  type="number"
                  value={level}
                  onChange={e => setLevel(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gold</Label>
                <Input
                  type="number"
                  value={gold}
                  onChange={e => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HP</Label>
                <Input
                  type="number"
                  value={currentHealth}
                  onChange={e => setCurrentHealth(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max HP</Label>
                <Input
                  type="number"
                  value={maxHealth}
                  onChange={e => setMaxHealth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-7 text-sm"
                />
              </div>
            </div>
            
            {/* Attributes */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Attributes</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(stats) as Array<keyof CharacterStats>).map(stat => (
                  <div key={stat} className="flex items-center gap-2">
                    <span className="text-xs capitalize w-12 truncate">{stat.slice(0, 3)}</span>
                    <Slider
                      value={[stats[stat]]}
                      onValueChange={([v]) => handleStatChange(stat, v)}
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="font-mono text-xs w-5 text-right">{stats[stat]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Appearance Section */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Appearance</span>
          </div>
          {expandedSections.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.appearance && appearance && (
          <div className="p-4 space-y-4">
            {/* Simple Appearance */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select
                  value={appearance.simple?.gender || 'other'}
                  onValueChange={v => handleAppearanceSimpleChange('gender', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height</Label>
                <Select
                  value={appearance.simple?.height || 'average'}
                  onValueChange={v => handleAppearanceSimpleChange('height', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map(h => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Build</Label>
                <Select
                  value={appearance.simple?.build || 'average'}
                  onValueChange={v => handleAppearanceSimpleChange('build', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILD_OPTIONS.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Detailed Appearance */}
            {appearance.detailed && (
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase">Detailed Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Skin Tone</Label>
                    <Select
                      value={appearance.detailed.skinTone || 'Medium'}
                      onValueChange={v => handleAppearanceDetailedChange('skinTone', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SKIN_TONES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hair Style</Label>
                    <Select
                      value={appearance.detailed.hairStyle || 'Medium'}
                      onValueChange={v => handleAppearanceDetailedChange('hairStyle', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_STYLES.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hair Color</Label>
                    <Select
                      value={appearance.detailed.hairColor || 'Brown'}
                      onValueChange={v => handleAppearanceDetailedChange('hairColor', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_COLORS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Eye Color</Label>
                    <Select
                      value={appearance.detailed.eyeColor || 'Brown'}
                      onValueChange={v => handleAppearanceDetailedChange('eyeColor', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EYE_COLORS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Equipment Section */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('equipment')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Equipment & Clothing</span>
          </div>
          {expandedSections.equipment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.equipment && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Shirt className="w-3 h-3" />
                Current Outfit
              </Label>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-foreground capitalize">
                  {clothingDescription || 'No clothing data available'}
                </p>
              </div>
            </div>
            
            {wardrobeState && Object.keys(wardrobeState.equipped).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Equipped Items</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(wardrobeState.equipped)
                    .filter(([_, wi]) => wi !== undefined)
                    .map(([slot, wi]) => (
                      <div 
                        key={slot}
                        className="flex items-center gap-2 p-2 bg-background/50 rounded text-xs"
                      >
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {slot}
                        </Badge>
                        <span className="truncate">{wi!.item.name}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderInventoryScreen = () => (
    <InventoryEditor gunNutEnabled={true} />
  );

  const renderCompanionCreator = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Create Companion</h3>
        <Button variant="ghost" size="sm" onClick={() => {
          setShowCompanionCreator(false);
          setCompanionCreatorStep('basics');
        }}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Step Tabs */}
      <Tabs value={companionCreatorStep} onValueChange={(v) => setCompanionCreatorStep(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="basics" className="text-xs">Basics</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">Look</TabsTrigger>
          <TabsTrigger value="personality" className="text-xs">Traits</TabsTrigger>
          <TabsTrigger value="combat" className="text-xs">Combat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basics" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={companionCreator.name}
              onChange={e => setCompanionCreator(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter companion name..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>Backstory</Label>
            <Textarea
              value={companionCreator.backstory}
              onChange={e => setCompanionCreator(prev => ({ ...prev, backstory: e.target.value }))}
              placeholder="Write their background story..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Speech Pattern</Label>
            <Input
              value={companionCreator.speechPattern}
              onChange={e => setCompanionCreator(prev => ({ ...prev, speechPattern: e.target.value }))}
              placeholder="e.g., formal, sarcastic, shy..."
            />
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={companionCreator.gender}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, gender: v as Gender }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Height</Label>
              <Select
                value={companionCreator.height}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, height: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEIGHT_OPTIONS.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Build</Label>
              <Select
                value={companionCreator.build}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, build: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUILD_OPTIONS.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Skin Tone</Label>
              <Select
                value={companionCreator.skinTone}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, skinTone: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKIN_TONES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Hair Style</Label>
              <Select
                value={companionCreator.hairStyle}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, hairStyle: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HAIR_STYLES.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Hair Color</Label>
              <Select
                value={companionCreator.hairColor}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, hairColor: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HAIR_COLORS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Eye Color</Label>
              <Select
                value={companionCreator.eyeColor}
                onValueChange={v => setCompanionCreator(prev => ({ ...prev, eyeColor: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EYE_COLORS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="personality" className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Personality Traits (pick 2-5)</Label>
              <span className="text-xs text-muted-foreground">{companionCreator.traits.length}/5</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TRAITS.map(trait => (
                <Badge
                  key={trait}
                  variant={companionCreator.traits.includes(trait) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleCompanionTrait(trait)}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Selected Traits</Label>
            <div className="p-3 bg-muted/30 rounded-lg min-h-[40px]">
              {companionCreator.traits.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {companionCreator.traits.map(t => (
                    <Badge key={t} className="capitalize">{t}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No traits selected</span>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="combat" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Combat Role</Label>
            <Select
              value={companionCreator.combatRole}
              onValueChange={v => setCompanionCreator(prev => ({ ...prev, combatRole: v as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMBAT_ROLES.map(role => (
                  <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-3 bg-muted/20 rounded-lg">
            <Label className="text-xs text-muted-foreground uppercase mb-2 block">Role Description</Label>
            <p className="text-sm">
              {companionCreator.combatRole === 'tank' && 'Heavy defense, draws enemy attention and protects allies.'}
              {companionCreator.combatRole === 'damage' && 'High damage output, focuses on eliminating threats quickly.'}
              {companionCreator.combatRole === 'support' && 'Healing and buffs, keeps the party alive and enhanced.'}
              {companionCreator.combatRole === 'ranged' && 'Attacks from distance, precise shots and area control.'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex gap-2 pt-4 border-t border-border/50">
        <Button 
          variant="outline" 
          onClick={() => {
            setShowCompanionCreator(false);
            setCompanionCreatorStep('basics');
          }} 
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={createCompanionFromCreator} 
          className="flex-1"
          disabled={!companionCreator.name.trim() || companionCreator.traits.length < 2}
        >
          <Plus className="w-4 h-4 mr-1" /> Create Companion
        </Button>
      </div>
    </div>
  );

  const renderCompanionCard = (companion: CompanionState) => (
    <div key={companion.id} className="border border-border/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{companion.name}</h4>
          <p className="text-xs text-muted-foreground capitalize">
            {companion.personality.traits.slice(0, 3).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={companion.status === 'active' ? 'default' : 'secondary'}>
            {companion.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingCompanion(companion)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveCompanion(companion.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Affinity</span>
          <div className="font-mono">{companion.affinity}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Trust</span>
          <div className="font-mono">{companion.trust}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Respect</span>
          <div className="font-mono">{companion.respect}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Mood</span>
          <div className="capitalize">{companion.mood}</div>
        </div>
      </div>
    </div>
  );

  const renderCompanionEditor = () => {
    if (!editingCompanion) return null;
    
    const comp = editingCompanion;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Editing: {comp.name}</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditingCompanion(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={comp.name}
            onChange={e => setEditingCompanion({ ...comp, name: e.target.value })}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={comp.status}
              onValueChange={v => setEditingCompanion({ ...comp, status: v as CompanionStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['active', 'waiting', 'left', 'hostile', 'dead', 'romance', 'rejected'] as CompanionStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mood</Label>
            <Select
              value={comp.mood}
              onValueChange={v => setEditingCompanion({ ...comp, mood: v as CompanionMood })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['joyful', 'content', 'neutral', 'annoyed', 'angry', 'sad', 'fearful', 'disgusted', 'romantic', 'betrayed'] as CompanionMood[]).map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Affinity (-100 to 100)</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[comp.affinity]}
              onValueChange={([v]) => setEditingCompanion({ ...comp, affinity: v })}
              min={-100}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="font-mono w-10 text-right">{comp.affinity}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Trust (0 to 100)</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[comp.trust]}
              onValueChange={([v]) => setEditingCompanion({ ...comp, trust: v })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="font-mono w-10 text-right">{comp.trust}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Respect (0 to 100)</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[comp.respect]}
              onValueChange={([v]) => setEditingCompanion({ ...comp, respect: v })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="font-mono w-10 text-right">{comp.respect}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Romantic Interest (0 to 100)</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[comp.romanticInterest]}
              onValueChange={([v]) => setEditingCompanion({ ...comp, romanticInterest: v })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="font-mono w-10 text-right">{comp.romanticInterest}</span>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setEditingCompanion(null)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => handleUpdateCompanion(comp)} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    );
  };

  const renderCompanionsScreen = () => (
    <div className="space-y-4">
      {showCompanionCreator ? (
        renderCompanionCreator()
      ) : editingCompanion ? (
        renderCompanionEditor()
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Party ({companions.length}/3)</h3>
            <Button variant="outline" size="sm" onClick={() => setShowCompanionCreator(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create New
            </Button>
          </div>
          
          {companions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No companions yet</p>
              <p className="text-xs mb-4">Create a custom companion to join your party</p>
              <Button variant="outline" size="sm" onClick={() => setShowCompanionCreator(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Companion
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {companions.map(renderCompanionCard)}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCurrentScreen = () => {
    if (isLoading && currentScreen === 'character') {
      return (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    
    switch (currentScreen) {
      case 'cheats':
        return renderCheatsScreen();
      case 'character':
        return renderCharacterScreen();
      case 'inventory':
        return renderInventoryScreen();
      case 'companions':
        return renderCompanionsScreen();
      default:
        return renderCheatsScreen();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-amber-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Wand2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Cheat Mode</h2>
                  <p className="text-xs text-muted-foreground">Bend the rules to your will</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Screen Navigation */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
              <Button
                variant="ghost"
                size="icon"
                onClick={goLeft}
                disabled={!canGoLeft}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {SCREENS.map((screen, i) => (
                  <button
                    key={screen.id}
                    onClick={() => goToScreen(screen.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      currentScreen === screen.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {screen.icon}
                    <span className="hidden sm:inline">{screen.label}</span>
                  </button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={goRight}
                disabled={!canGoRight}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              {renderCurrentScreen()}
            </ScrollArea>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Use ← → arrows to navigate
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save All
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
