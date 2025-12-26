import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardInteractive } from '@/components/ui/card';
import { Sparkles, Shuffle, Sword, Rocket, Search, Skull, Castle, Compass, Zap, Sun, Loader2, ChevronDown, Check, Shield, BookOpen, Dices, Swords, Lock, Plus, X } from 'lucide-react';
import { GameGenre, GENRE_DATA, WarEra, detectWarEra, getWarGenreData } from '@/types/genreData';
import { ColorPicker } from '@/components/ui/color-picker';
import { AtmosphericBackground } from '@/components/ui/particle-background';
import { detectGenreFromText, getAllGenres, getGenreTitle, GENRE_ICONS } from '@/lib/genreDetection';
import { DiceMode, DICE_MODES, saveDiceMode } from '@/game/diceSystem';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Genre Contract state shape
export interface SecondaryGenre {
  genreId: GameGenre;
  blendStrength: number; // 0-30
}

export interface GenreContractConfig {
  primaryGenre: GameGenre;
  secondaryGenres: SecondaryGenre[];
  hardLock: boolean;
}

export interface ScenarioSelection {
  scenario: string;
  genre: GameGenre;
  genreTitle: string;
  diceMode: DiceMode;
  genreContract?: GenreContractConfig;
}

interface AdventureCreatorProps {
  onSelect: (selection: ScenarioSelection) => void;
  isLoading: boolean;
}

const DICE_MODE_OPTIONS = [
  { 
    id: 'story' as DiceMode, 
    name: 'Story Mode', 
    icon: BookOpen,
    description: 'Pure narrative - no dice rolls',
    color: 'text-violet-400'
  },
  { 
    id: 'partial' as DiceMode, 
    name: 'Normal Mode', 
    icon: Dices,
    description: 'Dice for major actions & checks',
    color: 'text-amber-400'
  },
  { 
    id: 'full' as DiceMode, 
    name: 'Diced Out', 
    icon: Swords,
    description: 'Dice for every action',
    color: 'text-red-400'
  }
];

const PRESET_SCENARIOS = [
  { id: 'fantasy', genre: 'fantasy' as GameGenre, title: 'Fantasy Quest', description: 'Begin a fantasy adventure in a mystical realm where magic flows freely and ancient prophecies unfold.', icon: Castle, gradient: 'genre-fantasy' },
  { id: 'space', genre: 'scifi' as GameGenre, title: 'Space Explorer', description: 'Start a sci-fi journey aboard a deep space exploration vessel at the edge of known space.', icon: Rocket, gradient: 'genre-scifi' },
  { id: 'detective', genre: 'mystery' as GameGenre, title: 'Detective Mystery', description: 'Investigate a complex case in a noir mystery where nothing is quite what it seems.', icon: Search, gradient: 'genre-mystery' },
  { id: 'survival', genre: 'horror' as GameGenre, title: 'Survival Horror', description: 'Wake up in an abandoned facility with no memory. Something is hunting you in the dark.', icon: Skull, gradient: 'genre-horror' },
  { id: 'pirate', genre: 'pirate' as GameGenre, title: 'High Seas Adventure', description: 'Captain your own ship across treacherous waters in search of legendary treasure.', icon: Compass, gradient: 'genre-pirate' },
  { id: 'cyberpunk', genre: 'cyberpunk' as GameGenre, title: 'Neon Dystopia', description: 'Navigate the neon-lit streets of a corporate-controlled megacity as a skilled hacker or street samurai.', icon: Zap, gradient: 'genre-cyberpunk' },
  { id: 'war', genre: 'war' as GameGenre, title: 'Theater of War', description: 'Experience the chaos and heroism of warfare across any era - ancient battles, modern conflicts, or future wars.', icon: Shield, gradient: 'genre-western' },
  { id: 'western', genre: 'western' as GameGenre, title: 'Frontier Justice', description: 'Ride into a dusty frontier town where outlaws rule and justice needs a champion.', icon: Sun, gradient: 'genre-western' },
];

const RANDOM_SCENARIOS: Array<{ text: string; genre: GameGenre }> = [
  { text: "You are a thief who just discovered their target is actually their long-lost sibling.", genre: 'fantasy' },
  { text: "You're a time traveler stuck in ancient Rome with a smartphone that still works.", genre: 'scifi' },
  { text: "You wake up as the villain in a fairy tale, but you want to be a hero.", genre: 'fantasy' },
  { text: "You're a ghost trying to solve your own murder.", genre: 'mystery' },
  { text: "You're a chef in a post-apocalyptic wasteland, running the last fine dining restaurant.", genre: 'postapoc' },
  { text: "You're a dragon who was polymorphed into a human and forgot you were ever a dragon.", genre: 'fantasy' },
  { text: "You're a space bounty hunter whose ship AI has developed a crush on you.", genre: 'scifi' },
  { text: "You're a librarian who discovered a book that writes your future as you read it.", genre: 'horror' },
  { text: "You're a pirate captain whose crew has been replaced by the ghosts of your enemies.", genre: 'pirate' },
  { text: "You're a retired adventurer running a tavern, but trouble keeps finding you.", genre: 'fantasy' },
  { text: "You're a hacker who accidentally downloaded a rogue AI into your neural implant.", genre: 'cyberpunk' },
  { text: "You're a detective investigating a murder at a party where everyone is a suspect—including you.", genre: 'mystery' },
];

// Helper to get blend strength label
const getBlendLabel = (value: number): string => {
  if (value <= 10) return 'Light';
  if (value <= 20) return 'Moderate';
  return 'Strong';
};

// Contract badge component - vertical card layout for multiple genres
function ContractBadge({ config }: { config: GenreContractConfig }) {
  const allGenres = getAllGenres();
  const primaryName = allGenres.find(g => g.id === config.primaryGenre)?.name || config.primaryGenre;
  
  // Simple badge for primary-only
  if (config.secondaryGenres.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-sm">
        <span className="text-lg">{GENRE_ICONS[config.primaryGenre]}</span>
        <span className="text-primary font-medium">{primaryName}</span>
        {config.hardLock && <Lock className="w-3.5 h-3.5 text-amber-400" />}
      </div>
    );
  }

  // Vertical card layout for multiple genres
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-primary/20 border border-primary/30 text-sm min-w-[140px]">
      {/* Primary genre */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{GENRE_ICONS[config.primaryGenre]}</span>
        <span className="text-primary font-medium">{primaryName}</span>
      </div>
      
      {/* Secondary genres */}
      {config.secondaryGenres.map((s) => (
        <div key={s.genreId} className="flex items-center gap-1 text-muted-foreground text-xs">
          <span>+</span>
          <span className="text-base">{GENRE_ICONS[s.genreId]}</span>
          <span>{allGenres.find(g => g.id === s.genreId)?.name} ({s.blendStrength}%)</span>
        </div>
      ))}
      
      {/* Hard lock indicator */}
      {config.hardLock && <Lock className="w-3.5 h-3.5 text-amber-400 mt-1" />}
    </div>
  );
}

export function AdventureCreator({ onSelect, isLoading }: AdventureCreatorProps) {
  const [customScenario, setCustomScenario] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedDiceMode, setSelectedDiceMode] = useState<DiceMode>('story');
  
  // Genre Contract state
  const [primaryGenre, setPrimaryGenre] = useState<GameGenre>('fantasy');
  const [secondaryGenres, setSecondaryGenres] = useState<SecondaryGenre[]>([]);
  const [hardLock, setHardLock] = useState(false);

  const allGenres = getAllGenres();

  // Available genres for secondary selection (exclude primary and already selected)
  const availableSecondaryGenres = useMemo(() => {
    const selectedIds = [primaryGenre, ...secondaryGenres.map(s => s.genreId)];
    return allGenres.filter(g => !selectedIds.includes(g.id));
  }, [allGenres, primaryGenre, secondaryGenres]);

  // Build genre contract config
  const genreContract: GenreContractConfig = useMemo(() => ({
    primaryGenre,
    secondaryGenres,
    hardLock
  }), [primaryGenre, secondaryGenres, hardLock]);

  // Detect war era from text when war genre is active
  const detectedWarEra = useMemo(() => {
    return detectWarEra(customScenario);
  }, [customScenario]);

  // Get genre data - for war, use era-specific data
  const activeGenreData = useMemo(() => {
    if (primaryGenre === 'war') {
      return getWarGenreData(detectedWarEra);
    }
    return GENRE_DATA[primaryGenre];
  }, [primaryGenre, detectedWarEra]);

  const handleAddSecondaryGenre = () => {
    if (secondaryGenres.length >= 2 || availableSecondaryGenres.length === 0) return;
    setSecondaryGenres([...secondaryGenres, { 
      genreId: availableSecondaryGenres[0].id, 
      blendStrength: 15 
    }]);
  };

  const handleRemoveSecondaryGenre = (index: number) => {
    setSecondaryGenres(secondaryGenres.filter((_, i) => i !== index));
  };

  const handleSecondaryGenreChange = (index: number, genreId: GameGenre) => {
    const updated = [...secondaryGenres];
    updated[index] = { ...updated[index], genreId };
    setSecondaryGenres(updated);
  };

  const handleBlendStrengthChange = (index: number, value: number[]) => {
    const updated = [...secondaryGenres];
    updated[index] = { ...updated[index], blendStrength: value[0] };
    setSecondaryGenres(updated);
  };

  const handleRandomScenario = () => {
    const random = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
    saveDiceMode(selectedDiceMode);
    onSelect({ 
      scenario: random.text, 
      genre: random.genre, 
      genreTitle: getGenreTitle(random.genre), 
      diceMode: selectedDiceMode,
      genreContract: { primaryGenre: random.genre, secondaryGenres: [], hardLock: false }
    });
  };

  const handlePresetStart = (preset: typeof PRESET_SCENARIOS[0]) => {
    saveDiceMode(selectedDiceMode);
    onSelect({ 
      scenario: preset.description, 
      genre: preset.genre, 
      genreTitle: preset.title, 
      diceMode: selectedDiceMode,
      genreContract: { primaryGenre: preset.genre, secondaryGenres: [], hardLock: false }
    });
  };

  const handleCustomStart = () => {
    if (customScenario.trim()) {
      saveDiceMode(selectedDiceMode);
      onSelect({ 
        scenario: customScenario.trim(), 
        genre: primaryGenre, 
        genreTitle: getGenreTitle(primaryGenre),
        diceMode: selectedDiceMode,
        genreContract
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric Background */}
      <AtmosphericBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        {/* Color Picker - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <ColorPicker />
        </div>
        
        {/* Logo/Title */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient-primary mb-3 tracking-wider">
            UNTOLD
          </h1>
          <p className="text-muted-foreground uppercase tracking-[0.4em] text-sm">
            Begin Your Unique Adventure
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-3xl space-y-8">
          {/* Genre Contract Setup - Glass Panel */}
          <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-primary font-display text-xl tracking-wide">Genre Contract Setup</h2>
              <ContractBadge config={genreContract} />
            </div>

            {/* Primary Genre Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Primary Genre (locked)
                </label>
                <Select value={primaryGenre} onValueChange={(v) => setPrimaryGenre(v as GameGenre)}>
                  <SelectTrigger className="w-full bg-background/50 border-primary/30">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{GENRE_ICONS[primaryGenre]}</span>
                        <span>{allGenres.find(g => g.id === primaryGenre)?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allGenres.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{g.icon}</span>
                          <span>{g.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Genres Section - Hidden when Hard Lock is enabled */}
              {!hardLock && (
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-foreground">
                    Secondary Genres (optional, max 2)
                  </label>
                  
                  {/* Secondary genre rows */}
                  {secondaryGenres.map((secondary, index) => {
                    const availableForThis = allGenres.filter(
                      g => g.id !== primaryGenre && 
                      !secondaryGenres.some((s, i) => i !== index && s.genreId === g.id)
                    );
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/30">
                        {/* Genre Select */}
                        <Select 
                          value={secondary.genreId} 
                          onValueChange={(v) => handleSecondaryGenreChange(index, v as GameGenre)}
                        >
                          <SelectTrigger className="w-40 bg-background/50 border-border/50">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{GENRE_ICONS[secondary.genreId]}</span>
                                <span className="text-sm">{allGenres.find(g => g.id === secondary.genreId)?.name}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableForThis.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{g.icon}</span>
                                  <span>{g.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Blend Strength Slider */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Blend: {secondary.blendStrength}%</span>
                            <span className={`font-medium ${
                              secondary.blendStrength <= 10 ? 'text-green-400' :
                              secondary.blendStrength <= 20 ? 'text-yellow-400' : 'text-orange-400'
                            }`}>
                              {getBlendLabel(secondary.blendStrength)}
                            </span>
                          </div>
                          <Slider
                            value={[secondary.blendStrength]}
                            onValueChange={(v) => handleBlendStrengthChange(index, v)}
                            min={0}
                            max={30}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSecondaryGenre(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}

                  {/* Add Secondary Button */}
                  {secondaryGenres.length < 2 && availableSecondaryGenres.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSecondaryGenre}
                      className="gap-2 bg-background/30 border-dashed border-primary/30 hover:border-primary/50"
                    >
                      <Plus className="w-4 h-4" />
                      Add Secondary Genre
                    </Button>
                  )}
                </div>
              )}

              {/* Hard Lock Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  {hardLock && <Lock className="w-4 h-4 text-amber-400" />}
                  <label htmlFor="hard-lock" className="text-sm font-medium text-foreground">
                    Hard Lock: No outside elements allowed
                  </label>
                </div>
                <Switch
                  id="hard-lock"
                  checked={hardLock}
                  onCheckedChange={(checked) => {
                    setHardLock(checked);
                    // Clear secondary genres when hard lock is enabled
                    if (checked) {
                      setSecondaryGenres([]);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Custom Scenario - Glass Panel */}
          <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-primary font-display text-xl tracking-wide mb-4">Create Your Own Story</h2>
            
            <div className="flex gap-3">
              <Input
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Describe your scenario... (e.g., 'A hacker in a neon-lit city')"
                className="flex-1 bg-black/30 border-[rgba(139,92,246,0.3)] text-foreground placeholder:text-muted-foreground focus:border-primary focus:shadow-glow h-12"
                onKeyDown={(e) => e.key === 'Enter' && customScenario.trim() && handleCustomStart()}
                disabled={isLoading}
              />
              <Button 
                onClick={handleCustomStart}
                disabled={!customScenario.trim() || isLoading}
                variant="default"
                size="lg"
              >
                Begin
              </Button>
            </div>
            
            {/* Quick Start - use genre contract without custom scenario */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
            <Button
              onClick={() => {
                const genreName = allGenres.find(g => g.id === primaryGenre)?.name || primaryGenre;
                const defaultScenario = `Begin a ${genreName.toLowerCase()} adventure.`;
                saveDiceMode(selectedDiceMode);
                onSelect({
                  scenario: defaultScenario,
                  genre: primaryGenre,
                  genreTitle: getGenreTitle(primaryGenre),
                  diceMode: selectedDiceMode,
                  genreContract
                });
              }}
              disabled={isLoading}
              variant="outline"
              className="w-full mt-3 bg-background/30 border-primary/30 hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Quick Start with {allGenres.find(g => g.id === primaryGenre)?.name}
              {secondaryGenres.length > 0 && ` + ${secondaryGenres.length} blend${secondaryGenres.length > 1 ? 's' : ''}`}
            </Button>

            {/* Role Preview */}
            {customScenario.trim() && (
              <div className="mt-3 p-3 rounded-lg bg-background/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Available roles for {activeGenreData.name}
                  {primaryGenre === 'war' && ` (${detectedWarEra} era detected)`}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {activeGenreData.classes.slice(0, 6).map((cls) => (
                    <span 
                      key={cls.id}
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {cls.name}
                    </span>
                  ))}
                  {activeGenreData.classes.length > 6 && (
                    <span className="px-2 py-0.5 text-xs text-muted-foreground">
                      +{activeGenreData.classes.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dice Mode Selector */}
          <div className="glass-panel p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-primary font-display text-lg tracking-wide mb-4">Choose Your Play Style</h3>
            <div className="grid grid-cols-3 gap-3">
              {DICE_MODE_OPTIONS.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedDiceMode(mode.id)}
                  className={`relative p-4 rounded-xl border transition-all duration-300 text-left ${
                    selectedDiceMode === mode.id
                      ? 'border-primary bg-primary/10 shadow-glow'
                      : 'border-border/50 bg-background/30 hover:border-primary/50 hover:bg-background/50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <mode.icon className={`w-6 h-6 ${selectedDiceMode === mode.id ? 'text-primary' : mode.color}`} />
                    <span className={`font-medium text-sm ${selectedDiceMode === mode.id ? 'text-primary' : 'text-foreground'}`}>
                      {mode.name}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {mode.description}
                    </span>
                  </div>
                  {selectedDiceMode === mode.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider px-4">Or choose your fate</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* Random Button */}
          <Button
            variant="glass"
            className="w-full py-7 text-base group animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
            onClick={handleRandomScenario}
            disabled={isLoading}
          >
            <Sparkles className="w-5 h-5 mr-3 text-primary group-hover:animate-pulse" />
            <span>Surprise Me! Generate a Random Story</span>
            <Shuffle className="w-4 h-4 ml-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>

          {/* Preset Scenarios */}
          <div className="space-y-4">
            <h2 className="text-primary font-display text-xl tracking-wide animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Choose a Preset Scenario
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {PRESET_SCENARIOS.map((scenario, index) => (
                <CardInteractive
                  key={scenario.id}
                  onClick={() => handlePresetStart(scenario)}
                  onMouseEnter={() => setHoveredCard(scenario.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`p-5 ${scenario.gradient} animate-fade-in-up cursor-pointer ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-primary/20 border border-primary/30 transition-all duration-300 ${
                      hoveredCard === scenario.id ? 'shadow-glow scale-110' : ''
                    }`}>
                      <scenario.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg text-foreground tracking-wide">
                          {scenario.title}
                        </h3>
                      </div>
                      <span className="inline-block text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                        {scenario.genre}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                </CardInteractive>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center space-y-6 glass-panel p-10 rounded-2xl">
              <div className="relative inline-block">
                <div className="absolute inset-0 animate-glow-pulse rounded-full" />
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <p className="text-foreground font-display text-2xl tracking-wide">Preparing your adventure...</p>
              <div className="w-48 h-1 bg-black/50 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
