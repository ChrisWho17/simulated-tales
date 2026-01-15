import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Sparkles, User, Heart, Skull, Target, ChevronRight, 
  Loader2, Shuffle, BookOpen, Users, AlertTriangle, Zap
} from 'lucide-react';
import { GameGenre } from '@/types/genreData';
import {
  Origin,
  Motivation,
  CharacterFlaw,
  PersonalityTrait,
  SignificantPerson,
  Backstory,
  ORIGINS,
  MOTIVATIONS,
  CHARACTER_FLAWS,
  PERSONALITY_TRAITS,
  generateBackstoryPrompt,
} from '@/game/characterDevelopmentSystem';

interface BackstoryGeneratorProps {
  genre: GameGenre;
  characterName: string;
  onComplete: (backstory: Backstory) => void;
  onSkip: () => void;
}

type Step = 'origin' | 'motivation' | 'personality' | 'flaws' | 'people' | 'generate';

const RELATIONSHIP_TYPES = ['parent', 'sibling', 'mentor', 'rival', 'friend', 'lover', 'enemy', 'mysterious'] as const;
const STATUS_OPTIONS = ['alive', 'dead', 'missing', 'estranged', 'unknown'] as const;

export function BackstoryGenerator({ genre, characterName, onComplete, onSkip }: BackstoryGeneratorProps) {
  const [step, setStep] = useState<Step>('origin');
  const [selectedOrigin, setSelectedOrigin] = useState<Origin | null>(null);
  const [selectedMotivation, setSelectedMotivation] = useState<Motivation | null>(null);
  const [selectedTraits, setSelectedTraits] = useState<PersonalityTrait[]>([]);
  const [selectedFlaws, setSelectedFlaws] = useState<CharacterFlaw[]>([]);
  const [significantPeople, setSignificantPeople] = useState<SignificantPerson[]>([]);
  const [customNarrative, setCustomNarrative] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState<string | null>(null);

  // Get genre-specific origins or fallback to fantasy
  const genreOrigins = useMemo(() => {
    return ORIGINS[genre] || ORIGINS.fantasy;
  }, [genre]);

  const addSignificantPerson = () => {
    if (significantPeople.length >= 3) return;
    setSignificantPeople(prev => [...prev, {
      name: '',
      relationship: 'friend',
      status: 'alive',
      influence: '',
    }]);
  };

  const updatePerson = (index: number, updates: Partial<SignificantPerson>) => {
    setSignificantPeople(prev => prev.map((p, i) => 
      i === index ? { ...p, ...updates } : p
    ));
  };

  const removePerson = (index: number) => {
    setSignificantPeople(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTrait = (trait: PersonalityTrait) => {
    if (selectedTraits.find(t => t.id === trait.id)) {
      setSelectedTraits(prev => prev.filter(t => t.id !== trait.id));
    } else if (selectedTraits.length < 3) {
      // Check for opposing traits
      if (trait.opposingTrait && selectedTraits.find(t => t.id === trait.opposingTrait)) {
        setSelectedTraits(prev => [...prev.filter(t => t.id !== trait.opposingTrait), trait]);
      } else {
        setSelectedTraits(prev => [...prev, trait]);
      }
    }
  };

  const toggleFlaw = (flaw: CharacterFlaw) => {
    if (selectedFlaws.find(f => f.id === flaw.id)) {
      setSelectedFlaws(prev => prev.filter(f => f.id !== flaw.id));
    } else if (selectedFlaws.length < 2) {
      setSelectedFlaws(prev => [...prev, flaw]);
    }
  };

  const randomizeOrigin = () => {
    const randomOrigin = genreOrigins[Math.floor(Math.random() * genreOrigins.length)];
    setSelectedOrigin(randomOrigin);
  };

  const handleGenerateNarrative = async () => {
    if (!selectedOrigin || !selectedMotivation) return;
    
    setIsGenerating(true);
    try {
      const prompt = generateBackstoryPrompt(
        selectedOrigin,
        selectedMotivation,
        selectedTraits,
        selectedFlaws,
        genre
      );

      // Call AI to generate narrative
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'backstory',
          prompt,
          characterName,
          genre,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate backstory');
      
      const data = await response.json();
      setGeneratedNarrative(data.narrative || data.content || 'A mysterious past shrouded in shadow...');
    } catch (error) {
      console.error('Failed to generate backstory:', error);
      // Fallback narrative
      setGeneratedNarrative(`${characterName} grew up as a ${selectedOrigin.name.toLowerCase()}, shaped by ${selectedOrigin.description.toLowerCase()}. Driven by ${selectedMotivation.name.toLowerCase()}, they set out to answer the question: ${selectedMotivation.drivingQuestion}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!selectedOrigin || !selectedMotivation) return;

    const backstory: Backstory = {
      origin: selectedOrigin,
      lifeEvents: [], // Can be populated later
      motivation: selectedMotivation,
      significantPeople: significantPeople.filter(p => p.name.trim()),
      aspirations: selectedMotivation.relatedGoals,
      generatedNarrative: generatedNarrative || customNarrative,
    };

    onComplete(backstory);
  };

  const steps: Step[] = ['origin', 'motivation', 'personality', 'flaws', 'people', 'generate'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'origin': return selectedOrigin !== null;
      case 'motivation': return selectedMotivation !== null;
      case 'personality': return selectedTraits.length >= 1;
      case 'flaws': return true; // Optional
      case 'people': return true; // Optional
      case 'generate': return generatedNarrative || customNarrative;
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <BookOpen className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-narrative font-bold text-gradient-gold">
            {characterName}'s Origins
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Shape your character's past to inform their future
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                i <= currentStepIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            {step === 'origin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Where Do You Come From?
                  </h2>
                  <Button variant="ghost" size="sm" onClick={randomizeOrigin}>
                    <Shuffle className="w-4 h-4 mr-1" />
                    Random
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  {genreOrigins.map((origin) => (
                    <button
                      key={origin.id}
                      onClick={() => setSelectedOrigin(origin)}
                      className={cn(
                        "text-left p-4 rounded-lg border transition-all",
                        selectedOrigin?.id === origin.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50 bg-background/50"
                      )}
                    >
                      <div className="font-medium">{origin.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{origin.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {origin.startingAdvantages.slice(0, 2).map((adv) => (
                          <span key={adv} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            +{adv}
                          </span>
                        ))}
                        {origin.startingDisadvantages.slice(0, 1).map((dis) => (
                          <span key={dis} className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                            -{dis}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'motivation' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  What Drives You?
                </h2>
                
                <div className="grid gap-3">
                  {MOTIVATIONS.map((motivation) => (
                    <button
                      key={motivation.id}
                      onClick={() => setSelectedMotivation(motivation)}
                      className={cn(
                        "text-left p-4 rounded-lg border transition-all",
                        selectedMotivation?.id === motivation.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50 bg-background/50"
                      )}
                    >
                      <div className="font-medium">{motivation.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{motivation.description}</p>
                      <p className="text-xs text-primary/80 mt-2 italic">"{motivation.drivingQuestion}"</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'personality' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Who Are You? (Pick up to 3)
                </h2>
                
                <div className="grid grid-cols-2 gap-2">
                  {PERSONALITY_TRAITS.map((trait) => (
                    <button
                      key={trait.id}
                      onClick={() => toggleTrait(trait)}
                      className={cn(
                        "text-left p-3 rounded-lg border transition-all",
                        selectedTraits.find(t => t.id === trait.id)
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50 bg-background/50"
                      )}
                    >
                      <div className="font-medium text-sm">{trait.name}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{trait.description}</p>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Selected: {selectedTraits.map(t => t.name).join(', ') || 'None'}
                </p>
              </div>
            )}

            {step === 'flaws' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  What Are Your Flaws? (Pick up to 2)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Flaws create interesting drama and roleplay opportunities
                </p>
                
                <div className="grid gap-2">
                  {CHARACTER_FLAWS.map((flaw) => (
                    <button
                      key={flaw.id}
                      onClick={() => toggleFlaw(flaw)}
                      className={cn(
                        "text-left p-3 rounded-lg border transition-all",
                        selectedFlaws.find(f => f.id === flaw.id)
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border/50 hover:border-amber-500/50 bg-background/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{flaw.name}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          flaw.severity === 'major' ? 'bg-destructive/20 text-destructive' :
                          flaw.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {flaw.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{flaw.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'people' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Significant People (Optional)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add up to 3 people from your character's past
                </p>
                
                <div className="space-y-3">
                  {significantPeople.map((person, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={person.name}
                          onChange={(e) => updatePerson(index, { name: e.target.value })}
                          className="flex-1 px-3 py-1.5 text-sm rounded border border-border/50 bg-background"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removePerson(index)}>
                          ✕
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={person.relationship}
                          onChange={(e) => updatePerson(index, { relationship: e.target.value as any })}
                          className="flex-1 px-2 py-1.5 text-sm rounded border border-border/50 bg-background"
                        >
                          {RELATIONSHIP_TYPES.map(r => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                        <select
                          value={person.status}
                          onChange={(e) => updatePerson(index, { status: e.target.value as any })}
                          className="flex-1 px-2 py-1.5 text-sm rounded border border-border/50 bg-background"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="How did they influence you?"
                        value={person.influence}
                        onChange={(e) => updatePerson(index, { influence: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm rounded border border-border/50 bg-background"
                      />
                    </div>
                  ))}
                  
                  {significantPeople.length < 3 && (
                    <Button variant="outline" onClick={addSignificantPerson} className="w-full">
                      + Add Person
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 'generate' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Your Backstory
                </h2>
                
                {!generatedNarrative && !customNarrative && (
                  <div className="text-center py-8">
                    <Button 
                      onClick={handleGenerateNarrative} 
                      disabled={isGenerating}
                      size="lg"
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Weaving Your Story...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Backstory with AI
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                      Or write your own below
                    </p>
                  </div>
                )}

                <Textarea
                  placeholder="Write or edit your backstory..."
                  value={generatedNarrative || customNarrative}
                  onChange={(e) => {
                    if (generatedNarrative) {
                      setGeneratedNarrative(e.target.value);
                    } else {
                      setCustomNarrative(e.target.value);
                    }
                  }}
                  className="min-h-[200px] text-sm"
                />

                {generatedNarrative && (
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateNarrative}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                )}

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2 text-sm">
                  <div><strong>Origin:</strong> {selectedOrigin?.name}</div>
                  <div><strong>Motivation:</strong> {selectedMotivation?.name}</div>
                  <div><strong>Traits:</strong> {selectedTraits.map(t => t.name).join(', ') || 'None'}</div>
                  <div><strong>Flaws:</strong> {selectedFlaws.map(f => f.name).join(', ') || 'None'}</div>
                  {significantPeople.filter(p => p.name).length > 0 && (
                    <div><strong>People:</strong> {significantPeople.filter(p => p.name).map(p => `${p.name} (${p.relationship})`).join(', ')}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border/30">
            <Button variant="ghost" onClick={currentStepIndex === 0 ? onSkip : prevStep}>
              {currentStepIndex === 0 ? 'Skip All' : 'Back'}
            </Button>
            
            {step === 'generate' ? (
              <Button onClick={handleComplete} disabled={!canProceed()}>
                Complete Backstory
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackstoryGenerator;
