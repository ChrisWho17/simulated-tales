import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, X, Save, RefreshCw, Loader2, User, Heart, Shield, Sword, 
  Brain, Zap, Star, Coins, ChevronDown, ChevronUp, AlertTriangle,
  Shirt, Sparkles, Activity, Database, ShieldCheck, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Users, Plus, Trash2, Edit3, Package
} from 'lucide-react';
import { useAchievementsOptional } from '@/components/game/Achievements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  COMPANION_TEMPLATES
} from '@/game/companionSystem';
import { wardrobeManager, WardrobeState, WardrobeItem } from '@/game/wardrobeSystem';
import { getStarterClothingForGenre, buildClothingDescriptionForAI } from '@/game/starterClothingSystem';
import { ClothingSlot } from '@/game/clothingItemSystem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryEditor } from './InventoryEditor';

const CHARACTER_KEY = 'living-world-character';

// Screen types for navigation
type EditorScreen = 'character' | 'inventory' | 'companions';

const SCREENS: { id: EditorScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'character', label: 'Character', icon: <User className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'companions', label: 'Companions', icon: <Users className="w-4 h-4" /> },
];

interface CheatModeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  character?: RPGCharacter & { portraitUrl?: string };
  onUpdateCharacter?: (character: RPGCharacter & { portraitUrl?: string }) => void;
  genre?: string;
  initialMode?: DevPanelMode;
}

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
  const [currentScreen, setCurrentScreen] = useState<EditorScreen>('character');
  
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
  
  // Wardrobe state - actual equipped items
  const [wardrobeState, setWardrobeState] = useState<WardrobeState | null>(null);
  const [clothingDescription, setClothingDescription] = useState<string>('');
  
  // Companion state
  const [companions, setCompanions] = useState<CompanionState[]>([]);
  const [editingCompanion, setEditingCompanion] = useState<CompanionState | null>(null);
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [newCompanionTemplate, setNewCompanionTemplate] = useState<string>('loyal_warrior');
  const [newCompanionName, setNewCompanionName] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  
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
      
      // Reset to character screen when opening in cheat mode
      if (initialMode === 'cheat') {
        setCurrentScreen('character');
      }
      
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
        
        // Build clothing description from equipped items or use genre defaults
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
      }
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
  
  // Navigation
  const currentScreenIndex = SCREENS.findIndex(s => s.id === currentScreen);
  const canGoLeft = currentScreenIndex > 0;
  const canGoRight = currentScreenIndex < SCREENS.length - 1;
  
  const goToScreen = (screen: EditorScreen) => setCurrentScreen(screen);
  const goLeft = () => canGoLeft && setCurrentScreen(SCREENS[currentScreenIndex - 1].id);
  const goRight = () => canGoRight && setCurrentScreen(SCREENS[currentScreenIndex + 1].id);
  
  // Companion management
  const handleAddCompanion = () => {
    if (!newCompanionName.trim()) {
      toast.error('Please enter a companion name');
      return;
    }
    
    const companionId = `companion_${Date.now()}`;
    const companion = companionSystem.createCompanion(
      companionId,
      newCompanionName.trim(),
      newCompanionTemplate as keyof typeof COMPANION_TEMPLATES
    );
    
    if (companion) {
      companionSystem.recruitCompanion(companion.id);
      setCompanions(companionSystem.getActiveCompanions());
      setNewCompanionName('');
      setShowAddCompanion(false);
      toast.success(`${companion.name} joined the party!`);
    }
  };
  
  const handleRemoveCompanion = (companionId: string) => {
    companionSystem.dismissCompanion(companionId, 'player');
    setCompanions(companionSystem.getActiveCompanions());
    setEditingCompanion(null);
    toast.success('Companion dismissed');
  };
  
  const handleUpdateCompanion = (updated: CompanionState) => {
    // Update the companion in the system
    const allCompanions = companionSystem.getAllCompanions();
    const index = allCompanions.findIndex(c => c.id === updated.id);
    if (index !== -1) {
      allCompanions[index] = updated;
      // Force refresh
      setCompanions(companionSystem.getActiveCompanions());
      setEditingCompanion(null);
      toast.success(`${updated.name} updated!`);
    }
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
      
      toast.success('Character updated! Portrait regeneration will use new appearance.');
      onClose();
    } catch (error) {
      console.error('[CheatMode] Failed to save:', error);
      toast.error('Failed to save character changes');
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
        } else if (showAddCompanion) {
          setShowAddCompanion(false);
        } else {
          onClose();
        }
      }
      
      if (e.key === 'ArrowLeft' && !editingCompanion && !showAddCompanion) {
        goLeft();
      }
      if (e.key === 'ArrowRight' && !editingCompanion && !showAddCompanion) {
        goRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingCompanion, showAddCompanion, goLeft, goRight]);

  // Render screen content
  const renderCharacterScreen = () => (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Character Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter name..."
          className="bg-background/50"
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
            <span className="font-medium text-sm">Stats & Attributes</span>
          </div>
          {expandedSections.stats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.stats && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" /> Level
                </Label>
                <Input
                  type="number"
                  value={level}
                  onChange={e => setLevel(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-500" /> Gold
                </Label>
                <Input
                  type="number"
                  value={gold}
                  onChange={e => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" /> HP
                </Label>
                <Input
                  type="number"
                  value={currentHealth}
                  onChange={e => setCurrentHealth(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-300" /> Max HP
                </Label>
                <Input
                  type="number"
                  value={maxHealth}
                  onChange={e => setMaxHealth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(stats) as (keyof CharacterStats)[]).map(stat => (
                <div key={stat} className="space-y-1">
                  <Label className="text-xs capitalize flex items-center justify-between">
                    <span>{stat.slice(0, 3).toUpperCase()}</span>
                    <span className="font-mono text-primary">{stats[stat]}</span>
                  </Label>
                  <Slider
                    value={[stats[stat]]}
                    onValueChange={([val]) => handleStatChange(stat, val)}
                    min={1}
                    max={30}
                    step={1}
                    className="py-1"
                  />
                </div>
              ))}
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
            <User className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Appearance</span>
          </div>
          {expandedSections.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.appearance && appearance && (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Basic</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Gender</Label>
                  <Select
                    value={appearance.simple.gender}
                    onValueChange={v => handleAppearanceSimpleChange('gender', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
                    value={appearance.simple.height}
                    onValueChange={v => handleAppearanceSimpleChange('height', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
                    value={appearance.simple.build}
                    onValueChange={v => handleAppearanceSimpleChange('build', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
            </div>
            
            {appearance.detailed && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Skin Tone</Label>
                    <Select
                      value={appearance.detailed.skinTone}
                      onValueChange={v => handleAppearanceDetailedChange('skinTone', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
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
                      value={appearance.detailed.hairStyle}
                      onValueChange={v => handleAppearanceDetailedChange('hairStyle', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
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
                      value={appearance.detailed.hairColor}
                      onValueChange={v => handleAppearanceDetailedChange('hairColor', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_COLORS.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Eye Color</Label>
                    <Select
                      value={appearance.detailed.eyeColor}
                      onValueChange={v => handleAppearanceDetailedChange('eyeColor', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EYE_COLORS.map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
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
            {/* Current outfit display */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Shirt className="w-3 h-3" />
                Current Outfit (for AI portraits)
              </Label>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-foreground capitalize">
                  {clothingDescription || 'No clothing data available'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Characters always wear at least basic clothing based on genre. 
                Equip items in your inventory to change your outfit.
              </p>
            </div>
            
            {/* Equipped items breakdown */}
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
            
            {/* Genre default fallback info */}
            {(!wardrobeState || Object.keys(wardrobeState.equipped).length === 0) && (
              <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Using genre-default clothing for {genre || 'modern'} setting
                </div>
              </div>
            )}
            
            {appearance?.full && (
              <div className="space-y-2">
                <Label className="text-sm">Clothing Style Override</Label>
                <Select
                  value={appearance.full.clothingStyle || 'genre_default'}
                  onValueChange={v => handleAppearanceFullChange('clothingStyle', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLOTHING_STYLE_OPTIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Developer Tools Section */}
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

  const renderInventoryScreen = () => (
    <InventoryEditor gunNutEnabled={true} />
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
            Save Companion
          </Button>
        </div>
      </div>
    );
  };

  const renderAddCompanion = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Add New Companion</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowAddCompanion(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={newCompanionName}
          onChange={e => setNewCompanionName(e.target.value)}
          placeholder="Enter companion name..."
        />
      </div>
      
      <div className="space-y-2">
        <Label>Template</Label>
        <Select value={newCompanionTemplate} onValueChange={setNewCompanionTemplate}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(COMPANION_TEMPLATES).map(t => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => setShowAddCompanion(false)} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleAddCompanion} className="flex-1">
          Add Companion
        </Button>
      </div>
    </div>
  );

  const renderCompanionsScreen = () => (
    <div className="space-y-4">
      {showAddCompanion ? (
        renderAddCompanion()
      ) : editingCompanion ? (
        renderCompanionEditor()
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Active Companions ({companions.length})</h3>
            <Button variant="outline" size="sm" onClick={() => setShowAddCompanion(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          
          {companions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No companions yet</p>
              <p className="text-xs">Add companions to manage your party</p>
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
    switch (currentScreen) {
      case 'character':
        return renderCharacterScreen();
      case 'inventory':
        return renderInventoryScreen();
      case 'companions':
        return renderCompanionsScreen();
      default:
        return renderCharacterScreen();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ 
              type: "spring", 
              stiffness: 350, 
              damping: 30,
              mass: 0.8
            }}
            className="relative z-20 w-full max-w-2xl max-h-[85vh] bg-card border border-amber-500/50 rounded-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 rounded-lg bg-amber-500/20"
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Wand2 className="w-5 h-5 text-amber-400" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                    Cheat Mode
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                      Developer
                    </Badge>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Edit character, inventory & companions
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Screen Navigation */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={goLeft}
                disabled={!canGoLeft}
                className="gap-1 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {SCREENS.map((screen) => (
                  <motion.button
                    key={screen.id}
                    onClick={() => goToScreen(screen.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      currentScreen === screen.id
                        ? 'text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {currentScreen === screen.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary rounded-md"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {screen.icon}
                      <span className="hidden sm:inline">{screen.label}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goRight}
                disabled={!canGoRight}
                className="gap-1 transition-opacity"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Warning banner */}
            <motion.div 
              className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.2 }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-400">
                Changes affect gameplay. Use arrow keys to navigate screens.
              </span>
            </motion.div>

            {/* Content */}
            <ScrollArea className="h-[calc(85vh-240px)]">
              <div className="p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScreen}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.5
                    }}
                  >
                    {renderCurrentScreen()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <motion.div 
              className="flex items-center justify-between p-4 border-t border-amber-500/30 bg-muted/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <p className="text-xs text-muted-foreground">
                Press ESC to close • Arrow keys to navigate
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for command detection - supports multiple developer commands
export type DevPanelMode = 'cheat' | 'events' | 'integrity';

export function useCheatModeCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<DevPanelMode>('cheat');

  const checkCommand = useCallback((input: string): boolean => {
    const cmd = input.trim().toLowerCase();
    
    // Cheat mode commands
    if (cmd === '/imacheater' || cmd === '/cheat' || cmd === '/dev') {
      setInitialMode('cheat');
      setIsOpen(true);
      return true;
    }
    
    // Events command - opens cheat panel with developer section expanded
    if (cmd === '/events' || cmd === '/debug') {
      setInitialMode('events');
      setIsOpen(true);
      return true;
    }
    
    // Integrity command - opens cheat panel with developer section and runs scan
    if (cmd === '/integrity') {
      setInitialMode('integrity');
      setIsOpen(true);
      return true;
    }
    
    return false;
  }, []);

  return {
    isOpen,
    setIsOpen,
    checkCommand,
    initialMode,
  };
}
