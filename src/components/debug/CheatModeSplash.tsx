import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, X, Save, RefreshCw, Loader2, User, Heart, Shield, Sword, 
  Brain, Zap, Star, Coins, ChevronDown, ChevronUp, AlertTriangle,
  Shirt, Sparkles
} from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHARACTER_KEY = 'living-world-character';

interface CheatModeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  character?: RPGCharacter & { portraitUrl?: string };
  onUpdateCharacter?: (character: RPGCharacter & { portraitUrl?: string }) => void;
  genre?: string;
}

// Save character appearance to campaign for consistent image generation
function saveCharacterAppearanceToCampaign(
  characterData: any,
  genre: string
): void {
  try {
    // Update the player portrait reference with current appearance
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
    
    // Also update localStorage character
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
  genre = 'fantasy'
}: CheatModeSplashProps) {
  const achievements = useAchievementsOptional();
  const hasUnlockedCheaterAchievement = useRef(false);
  
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
    stats: true,
    appearance: false,
    equipment: false,
  });
  
  // Equipment override for portraits
  const [currentGear, setCurrentGear] = useState<string>('');
  const [hasEquippedGear, setHasEquippedGear] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  
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
          
          // Extract gear description from inventory or clothing
          const equipped = parsed.equipment?.equipped || [];
          if (equipped.length > 0) {
            setCurrentGear(equipped.map((e: any) => e.name || e).join(', '));
            setHasEquippedGear(true);
          } else {
            setHasEquippedGear(false);
          }
        }
        
        // Load RPG stats from character prop
        if (character) {
          setLevel(character.level);
          setGold(character.gold);
          setCurrentHealth(character.currentHealth);
          setMaxHealth(character.maxHealth);
          setExperience(character.experience);
          setStats(character.stats);
        }
      } catch (e) {
        console.error('[CheatMode] Failed to load character:', e);
      }
    }
  }, [isOpen, character]);
  
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
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update RPG character
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
      
      // Update localStorage character with appearance
      const savedChar = localStorage.getItem(CHARACTER_KEY);
      if (savedChar) {
        const parsed = JSON.parse(savedChar);
        const updated = {
          ...parsed,
          basicInfo: { ...parsed.basicInfo, name },
          appearance: appearance || parsed.appearance,
          // Update clothing style if changed
          ...(appearance?.full?.clothingStyle && {
            clothingOverride: appearance.full.clothingStyle
          }),
        };
        
        // Save to campaign for consistent portraits
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
  
  // Handle keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          {/* Main panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 w-full max-w-2xl max-h-[85vh] bg-card border border-amber-500/50 rounded-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Wand2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                    Cheat Mode
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                      Developer
                    </Badge>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Edit character stats, appearance & equipment
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Warning banner */}
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-400">
                Changes affect portrait generation. Regenerate portraits to see appearance updates.
              </span>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(85vh-200px)]">
              <div className="p-4 space-y-4">
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
                      {/* Level & Resources */}
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
                      
                      {/* Core Stats */}
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
                      {/* Simple Appearance */}
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
                      
                      {/* Detailed Appearance */}
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
                
                {/* Equipment/Clothing Section */}
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('equipment')}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Equipment & Clothing (Portrait)</span>
                    </div>
                    {expandedSections.equipment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {expandedSections.equipment && (
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Has Equipped Gear</Label>
                          <p className="text-xs text-muted-foreground">
                            When off, portraits show character in underwear (SFW)
                          </p>
                        </div>
                        <Switch
                          checked={hasEquippedGear}
                          onCheckedChange={setHasEquippedGear}
                        />
                      </div>
                      
                      {hasEquippedGear && (
                        <div className="space-y-2">
                          <Label className="text-sm">Current Gear Description</Label>
                          <Textarea
                            value={currentGear}
                            onChange={e => setCurrentGear(e.target.value)}
                            placeholder="e.g., leather armor, steel sword, traveling cloak..."
                            className="min-h-[60px] text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Describe equipment for AI portrait generation. Leave empty to use default class gear.
                          </p>
                        </div>
                      )}
                      
                      {appearance?.full && (
                        <div className="space-y-2">
                          <Label className="text-sm">Clothing Style</Label>
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
                                  <div>
                                    <div>{c.label}</div>
                                    <div className="text-xs text-muted-foreground">{c.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press ESC to close without saving
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for command detection
export function useCheatModeCommand() {
  const [isOpen, setIsOpen] = useState(false);

  const checkCommand = useCallback((input: string): boolean => {
    if (input.trim().toLowerCase() === '/imacheater') {
      setIsOpen(true);
      return true;
    }
    return false;
  }, []);

  return {
    isOpen,
    setIsOpen,
    checkCommand,
  };
}
