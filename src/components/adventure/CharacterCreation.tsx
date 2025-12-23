import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CharacterStats,
  getStatModifier,
} from '@/types/rpgCharacter';
import { GameGenre, GENRE_DATA, createGenreCharacter } from '@/types/genreData';
import { ChevronRight, ChevronLeft, Sword, Shield, Wand2, Heart, Sparkles, Dices, Rocket, Skull, Search, Compass } from 'lucide-react';

interface CharacterCreationProps {
  genre: GameGenre;
  scenario: string;
  genreTitle: string;
  onComplete: (character: ReturnType<typeof createGenreCharacter>, scenario: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

type CreationStep = 'name' | 'class' | 'background' | 'stats' | 'traits';

const STAT_POINT_POOL = 15;

export function CharacterCreation({ genre, scenario, genreTitle, onComplete, onBack, isLoading }: CharacterCreationProps) {
  const genreData = GENRE_DATA[genre];
  
  const [step, setStep] = useState<CreationStep>('name');
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [statAllocation, setStatAllocation] = useState<Partial<CharacterStats>>({
    strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
  });

  const pointsSpent = Object.values(statAllocation).reduce((sum, val) => sum + (val || 0), 0);
  const pointsRemaining = STAT_POINT_POOL - pointsSpent;

  const adjustStat = (stat: keyof CharacterStats, delta: number) => {
    const current = statAllocation[stat] || 0;
    const newValue = current + delta;
    if (newValue < 0 || newValue > 7) return;
    if (delta > 0 && pointsRemaining <= 0) return;
    setStatAllocation(prev => ({ ...prev, [stat]: newValue }));
  };

  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(prev => prev.filter(t => t !== trait));
    } else if (selectedTraits.length < 3) {
      setSelectedTraits(prev => [...prev, trait]);
    }
  };

  const handleComplete = () => {
    const character = createGenreCharacter(name, selectedClass, selectedBackground, selectedTraits, statAllocation, genre);
    onComplete(character, scenario);
  };

  const canProceed = () => {
    switch (step) {
      case 'name': return name.trim().length >= 2;
      case 'class': return selectedClass !== '';
      case 'background': return selectedBackground !== '';
      case 'stats': return true;
      case 'traits': return selectedTraits.length >= 1;
    }
  };

  const steps: CreationStep[] = ['name', 'class', 'background', 'stats', 'traits'];
  
  const nextStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      onBack();
    }
  };

  const getClassIcon = (classId: string) => {
    if (genre === 'scifi' || genre === 'cyberpunk') return <Rocket className="w-5 h-5" />;
    if (genre === 'horror' || genre === 'postapoc') return <Skull className="w-5 h-5" />;
    if (genre === 'mystery') return <Search className="w-5 h-5" />;
    if (genre === 'pirate') return <Compass className="w-5 h-5" />;
    
    switch (classId) {
      case 'warrior': case 'marine': case 'enforcer': return <Sword className="w-5 h-5" />;
      case 'mage': case 'hacker': case 'occultist': return <Wand2 className="w-5 h-5" />;
      case 'cleric': case 'medic': return <Heart className="w-5 h-5" />;
      case 'rogue': case 'grifter': case 'scavenger': return <Sparkles className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
            {genreData.name} Adventure
          </span>
          <h1 className="text-3xl md:text-4xl font-narrative font-bold text-gradient-gold mt-3 mb-2">
            Create Your Hero
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {scenario.slice(0, 80)}...
          </p>
          <p className="text-muted-foreground mt-2">
            Step {steps.indexOf(step) + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-card/50 border border-border/30 rounded-lg p-6 mb-6 animate-fade-in">
          {/* Name Step */}
          {step === 'name' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">What is your name?</h2>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your character's name..."
                className="text-lg py-6 bg-background border-border/50"
                autoFocus
              />
            </div>
          )}

          {/* Class Step */}
          {step === 'class' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Choose your role</h2>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-3">
                  {genreData.classes.map((charClass) => (
                    <button
                      key={charClass.id}
                      onClick={() => setSelectedClass(charClass.id)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedClass === charClass.id 
                          ? 'bg-primary/20 border-2 border-primary' 
                          : 'bg-background/50 border border-border/30 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-primary mt-0.5">{getClassIcon(charClass.id)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{charClass.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{charClass.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-primary/80">
                            <span>+{Object.entries(charClass.statBonuses).map(([k, v]) => `${v} ${k.slice(0, 3).toUpperCase()}`).join(', +')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {charClass.abilities.map(ability => (
                              <span key={ability} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {ability}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Background Step */}
          {step === 'background' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">What is your origin?</h2>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-3">
                  {genreData.backgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg.id)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedBackground === bg.id 
                          ? 'bg-primary/20 border-2 border-primary' 
                          : 'bg-background/50 border border-border/30 hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-semibold text-foreground">{bg.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{bg.description}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {bg.skills.map(skill => (
                          <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Stats Step */}
          {step === 'stats' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary">Allocate your stats</h2>
                <span className={`text-sm font-mono ${pointsRemaining > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {pointsRemaining} points remaining
                </span>
              </div>
              <div className="grid gap-3">
                {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => {
                  const base = 8;
                  const allocated = statAllocation[stat] || 0;
                  const classBonus = genreData.classes.find(c => c.id === selectedClass)?.statBonuses[stat] || 0;
                  const bgBonus = genreData.backgrounds.find(b => b.id === selectedBackground)?.statBonuses[stat] || 0;
                  const total = base + allocated + classBonus + bgBonus;
                  const modifier = getStatModifier(total);

                  return (
                    <div key={stat} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                      <div>
                        <span className="font-medium capitalize">{stat}</span>
                        {(classBonus > 0 || bgBonus > 0) && (
                          <span className="text-xs text-primary ml-2">(+{classBonus + bgBonus})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => adjustStat(stat, -1)} disabled={allocated <= 0} className="h-8 w-8">-</Button>
                        <div className="w-16 text-center">
                          <span className="text-lg font-bold">{total}</span>
                          <span className="text-sm text-muted-foreground ml-1">({modifier >= 0 ? '+' : ''}{modifier})</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => adjustStat(stat, 1)} disabled={allocated >= 7 || pointsRemaining <= 0} className="h-8 w-8">+</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Traits Step */}
          {step === 'traits' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Select up to 3 personality traits</h2>
              <div className="flex flex-wrap gap-2">
                {genreData.traits.map((trait) => (
                  <button
                    key={trait}
                    onClick={() => toggleTrait(trait)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedTraits.includes(trait)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/50 border border-border/30 hover:border-primary/50'
                    }`}
                    disabled={!selectedTraits.includes(trait) && selectedTraits.length >= 3}
                  >
                    {trait}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Selected: {selectedTraits.length}/3</p>
              
              {/* Character Summary */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30 mt-6">
                <h3 className="font-semibold text-primary mb-2">Character Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {name}</div>
                  <div><span className="text-muted-foreground">Role:</span> {genreData.classes.find(c => c.id === selectedClass)?.name}</div>
                  <div><span className="text-muted-foreground">Background:</span> {genreData.backgrounds.find(b => b.id === selectedBackground)?.name}</div>
                  <div><span className="text-muted-foreground">Starting {genreData.currency}:</span> {genreData.startingCurrency}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {step === 'traits' ? (
            <Button onClick={handleComplete} disabled={!canProceed() || isLoading} className="gap-2 bg-primary text-primary-foreground">
              <Dices className="w-4 h-4" />
              Begin Adventure
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Dices className="w-12 h-12 text-primary mx-auto animate-spin" />
            <p className="text-foreground font-narrative text-xl">Your fate is being written...</p>
          </div>
        </div>
      )}
    </div>
  );
}
