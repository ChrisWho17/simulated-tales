import { useState, useMemo } from 'react';
import { 
  CharacterData, 
  DEFAULT_CHARACTER, 
  BACKGROUND_EFFECTS,
  SPAWN_POINTS,
  SpawnPointType,
  BodyTypeOption,
  HeightOption,
  HairLengthOption,
  DispositionOption,
  SocialStyleOption,
  BustSizeOption,
  CurvinessOption,
  MuscleOption,
  BodyHairOption,
} from '@/types/characterCreation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { User, Palette, BookOpen, Brain, Sparkles, Wand2, Loader2, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { BackstoryGenerator } from '@/components/adventure/BackstoryGenerator';
import { Backstory } from '@/game/characterDevelopmentSystem';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePortraitWithFlux } from '@/services/fluxImageGeneration';
import { buildPortraitPrompt } from '@/utils/portraitPrompts';

type CreationStep = 'basics' | 'appearance' | 'portrait' | 'backstory' | 'background' | 'personality' | 'summary';

const STEPS: CreationStep[] = ['basics', 'appearance', 'portrait', 'backstory', 'background', 'personality', 'summary'];

const STEP_LABELS: Record<CreationStep, string> = {
  basics: 'Basic Info',
  appearance: 'Appearance',
  portrait: 'Portrait',
  backstory: 'Backstory',
  background: 'Background',
  personality: 'Personality',
  summary: 'Summary',
};

interface CharacterCreationProps {
  onComplete: (character: CharacterData) => void;
  genre?: string;
}

export function CharacterCreation({ onComplete, genre = 'modern_life' }: CharacterCreationProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>('basics');
  const [character, setCharacter] = useState<CharacterData>(DEFAULT_CHARACTER);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [adultContentEnabled, setAdultContentEnabled] = useState(false);
  const [backstory, setBackstory] = useState<Backstory | null>(null);

  const backgroundEffect = useMemo(() => {
    return BACKGROUND_EFFECTS[character.background.origin];
  }, [character.background.origin]);

  const updateBasicInfo = <K extends keyof CharacterData['basicInfo']>(
    key: K, 
    value: CharacterData['basicInfo'][K]
  ) => {
    setCharacter(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [key]: value },
    }));
  };

  const updateAppearance = <K extends keyof CharacterData['appearance']>(
    key: K, 
    value: CharacterData['appearance'][K]
  ) => {
    setCharacter(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value },
    }));
  };

  const updateBackground = (key: 'origin' | 'spawnPoint', value: string) => {
    setCharacter(prev => ({
      ...prev,
      background: { ...prev.background, [key]: value },
    }));
  };

  const updatePersonality = <K extends keyof CharacterData['personality']>(
    key: K, 
    value: CharacterData['personality'][K]
  ) => {
    setCharacter(prev => ({
      ...prev,
      personality: { ...prev.personality, [key]: value },
    }));
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

  const canProceedFromStep = (step: CreationStep): boolean => {
    switch (step) {
      case 'basics': return character.basicInfo.name.trim().length > 0;
      case 'appearance': return true;
      case 'portrait': return true; // Portrait is optional
      case 'backstory': return true; // Backstory is optional
      case 'background': return true;
      case 'personality': return true;
      case 'summary': return true;
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < STEPS.length - 1 && canProceedFromStep(currentStep)) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleBackstoryComplete = (completedBackstory: Backstory) => {
    setBackstory(completedBackstory);
    goToNextStep();
  };

  const handleBackstorySkip = () => {
    goToNextStep();
  };

  const handleBeginJourney = () => {
    if (!character.basicInfo.name.trim()) {
      return;
    }
    // Attach backstory and portrait to character data
    const finalCharacter = {
      ...character,
      portraitUrl,
      backstory,
    };
    onComplete(finalCharacter as CharacterData);
  };

  const handleGeneratePortrait = async () => {
    setIsGeneratingPortrait(true);
    try {
      
      // Build character appearance data
      const characterData = {
        gender: character.basicInfo.gender || 'male',
        build: character.appearance.bodyType || 'average',
        height: character.appearance.height || 'average',
        hairColor: character.appearance.hairColor || 'brown',
        hairStyle: character.appearance.hairLength || 'medium',
        eyeColor: character.appearance.eyeColor || 'brown',
        skinTone: character.appearance.skinTone || 'medium',
      };
      
      const prompt = buildPortraitPrompt(characterData, 'modern', 'neutral');
      console.log('[FLUX] Generating portrait with prompt:', prompt);
      
      const imageUrl = await generatePortraitWithFlux(prompt);
      setPortraitUrl(imageUrl);
      toast.success('Portrait generated!');
    } catch (error) {
      console.error('Error generating portrait:', error);
      toast.error('Failed to generate portrait', { 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const characterSummary = useMemo(() => {
    const { basicInfo, appearance, background, personality } = character;
    return {
      name: basicInfo.name || 'Unnamed',
      description: `A ${basicInfo.age}-year-old ${basicInfo.gender || 'person'} with a ${appearance.height}, ${appearance.bodyType} build. ${appearance.hairLength.charAt(0).toUpperCase() + appearance.hairLength.slice(1)} ${appearance.hairColor} hair frames ${appearance.eyeColor} eyes.`,
      background: background.origin,
      personality: `${personality.disposition} and ${personality.socialStyle.toLowerCase()}`,
    };
  }, [character]);

  // Backstory step gets its own full-screen view
  if (currentStep === 'backstory') {
    return (
      <BackstoryGenerator
        genre={genre as any}
        characterName={character.basicInfo.name || 'Traveler'}
        onComplete={handleBackstoryComplete}
        onSkip={handleBackstorySkip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-border/50 bg-card/95 backdrop-blur shadow-deep">
        <CardHeader className="text-center border-b border-border/30 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-narrative text-gradient-gold">
            Create Your Character
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Shape who you will become in this world
          </p>
          
          {/* Step Progress Indicator */}
          <div className="flex gap-1 mt-6 max-w-xl mx-auto">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all cursor-pointer hover:opacity-80",
                  i <= currentStepIndex ? "bg-primary" : "bg-muted"
                )}
                onClick={() => i <= currentStepIndex && setCurrentStep(step)}
                title={STEP_LABELS[step]}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStepIndex + 1} of {STEPS.length}: {STEP_LABELS[currentStep]}
          </p>
        </CardHeader>

        <ScrollArea className="h-[60vh]">
          <CardContent className="p-6 space-y-8">
            {/* Portrait Step */}
            {currentStep === 'portrait' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Wand2 className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">AI Character Portrait</h2>
                </div>
                <Separator className="bg-border/30" />
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Portrait Preview - Full Body */}
                  <div className="w-40 h-64 rounded-lg border-2 border-dashed border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                    {portraitUrl ? (
                      <img 
                        src={portraitUrl} 
                        alt="Character portrait" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-muted-foreground/30" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">
                      Generate a unique full-body AI portrait based on your character's appearance settings.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeneratePortrait}
                      disabled={isGeneratingPortrait}
                      className="gap-2"
                    >
                      {isGeneratingPortrait ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          {portraitUrl ? 'Regenerate Portrait' : 'Generate Portrait'}
                        </>
                      )}
                    </Button>
                    {portraitUrl && (
                      <p className="text-xs text-muted-foreground">
                        Click to regenerate with current settings
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center pt-4">
                  Portrait generation is optional. You can skip this step and continue.
                </p>
              </section>
            )}

            {/* Basic Information Step */}
            {currentStep === 'basics' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <User className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Basic Information</h2>
                </div>
                <Separator className="bg-border/30" />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter character name"
                      value={character.basicInfo.name}
                      onChange={(e) => updateBasicInfo('name', e.target.value)}
                      className="bg-input/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={character.basicInfo.gender} 
                      onValueChange={(v) => updateBasicInfo('gender', v)}
                    >
                      <SelectTrigger className="bg-input/50">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="unspecified">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex justify-between">
                      <Label>Age</Label>
                      <span className="text-sm text-muted-foreground">{character.basicInfo.age}</span>
                    </div>
                    <Slider
                      value={[character.basicInfo.age]}
                      onValueChange={([v]) => updateBasicInfo('age', v)}
                      min={18}
                      max={50}
                      step={1}
                      className="py-2"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Appearance Step - includes additional features and main appearance */}
            {currentStep === 'appearance' && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles className="w-5 h-5" />
                      <h2 className="text-lg font-semibold">Additional Features</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="adult-content" className="text-sm text-muted-foreground">
                        {adultContentEnabled ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id="adult-content"
                        checked={adultContentEnabled}
                        onCheckedChange={setAdultContentEnabled}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable additional body customization options for more detailed character creation.
                  </p>
                  
                  {/* Custom AI Portrait Description */}
                  <div className="space-y-2 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <Label htmlFor="custom-description" className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      Custom Portrait Details
                    </Label>
                    <Textarea
                      id="custom-description"
                      placeholder="Add specific details for your AI portrait: facial features, scars, tattoos, accessories, clothing style, poses, expressions, unique characteristics..."
                      value={character.appearance.customDescription || ''}
                      onChange={(e) => updateAppearance('customDescription', e.target.value)}
                      className="bg-input/50 min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      These details will be combined with your character settings to generate a more precise portrait. ({character.appearance.customDescription?.length || 0}/500)
                    </p>
                  </div>
                </section>

            {/* Appearance */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Palette className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Appearance</h2>
              </div>
              <Separator className="bg-border/30" />

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Body Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['slim', 'average', 'athletic', 'curvy', 'heavy'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateAppearance('bodyType', type)}
                        className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                          character.appearance.bodyType === type
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-input/30 border-border/50 hover:bg-input/50'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Height</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['short', 'average', 'tall'] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => updateAppearance('height', h)}
                        className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                          character.appearance.height === h
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-input/30 border-border/50 hover:bg-input/50'
                        }`}
                      >
                        {h.charAt(0).toUpperCase() + h.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hair Color</Label>
                    <Select 
                      value={character.appearance.hairColor} 
                      onValueChange={(v) => updateAppearance('hairColor', v)}
                    >
                      <SelectTrigger className="bg-input/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['black', 'brown', 'blonde', 'red', 'gray', 'white', 'auburn'].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Hair Length</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['short', 'medium', 'long'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => updateAppearance('hairLength', l)}
                          className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all border ${
                            character.appearance.hairLength === l
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-input/30 border-border/50 hover:bg-input/50'
                          }`}
                        >
                          {l.charAt(0).toUpperCase() + l.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Eye Color</Label>
                    <Select 
                      value={character.appearance.eyeColor} 
                      onValueChange={(v) => updateAppearance('eyeColor', v)}
                    >
                      <SelectTrigger className="bg-input/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['brown', 'blue', 'green', 'hazel', 'gray', 'amber'].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Skin Tone</Label>
                    <Select 
                      value={character.appearance.skinTone} 
                      onValueChange={(v) => updateAppearance('skinTone', v)}
                    >
                      <SelectTrigger className="bg-input/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['very light', 'light', 'medium', 'olive', 'dark', 'very dark'].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional Features Body Options */}
                {adultContentEnabled && character.basicInfo.gender && (
                  <div className="space-y-4 p-4 rounded-lg border border-accent/30 bg-accent/5">
                    <p className="text-sm font-medium text-accent">Additional Body Options</p>
                    
                    {/* Female-specific options */}
                    {character.basicInfo.gender === 'female' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Bust Size</Label>
                          <div className="flex flex-wrap gap-2">
                            {(['small', 'medium', 'large', 'very large'] as const).map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => updateAppearance('bustSize', size)}
                                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all border ${
                                  character.appearance.bustSize === size
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-input/30 border-border/50 hover:bg-input/50'
                                }`}
                              >
                                {size.charAt(0).toUpperCase() + size.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Curviness</Label>
                          <div className="flex flex-wrap gap-2">
                            {(['subtle', 'moderate', 'pronounced', 'very curvy'] as const).map((curve) => (
                              <button
                                key={curve}
                                type="button"
                                onClick={() => updateAppearance('curviness', curve)}
                                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all border ${
                                  character.appearance.curviness === curve
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-input/30 border-border/50 hover:bg-input/50'
                                }`}
                              >
                                {curve.charAt(0).toUpperCase() + curve.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Male-specific options */}
                    {character.basicInfo.gender === 'male' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Muscle Definition</Label>
                          <div className="flex flex-wrap gap-2">
                            {(['lean', 'toned', 'muscular', 'very muscular'] as const).map((muscle) => (
                              <button
                                key={muscle}
                                type="button"
                                onClick={() => updateAppearance('muscles', muscle)}
                                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all border ${
                                  character.appearance.muscles === muscle
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-input/30 border-border/50 hover:bg-input/50'
                                }`}
                              >
                                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Body Hair</Label>
                          <div className="flex flex-wrap gap-2">
                            {(['none', 'light', 'moderate', 'heavy'] as const).map((hair) => (
                              <button
                                key={hair}
                                type="button"
                                onClick={() => updateAppearance('bodyHair', hair)}
                                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all border ${
                                  character.appearance.bodyHair === hair
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-input/30 border-border/50 hover:bg-input/50'
                                }`}
                              >
                                {hair.charAt(0).toUpperCase() + hair.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Non-binary / other options - show both */}
                    {character.basicInfo.gender && !['male', 'female'].includes(character.basicInfo.gender) && (
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Bust Size</Label>
                            <Select 
                              value={character.appearance.bustSize} 
                              onValueChange={(v) => updateAppearance('bustSize', v as BustSizeOption)}
                            >
                              <SelectTrigger className="bg-input/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(['small', 'medium', 'large', 'very large'] as const).map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size.charAt(0).toUpperCase() + size.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Curviness</Label>
                            <Select 
                              value={character.appearance.curviness} 
                              onValueChange={(v) => updateAppearance('curviness', v as CurvinessOption)}
                            >
                              <SelectTrigger className="bg-input/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(['subtle', 'moderate', 'pronounced', 'very curvy'] as const).map((curve) => (
                                  <SelectItem key={curve} value={curve}>
                                    {curve.charAt(0).toUpperCase() + curve.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Muscle Definition</Label>
                            <Select 
                              value={character.appearance.muscles} 
                              onValueChange={(v) => updateAppearance('muscles', v as MuscleOption)}
                            >
                              <SelectTrigger className="bg-input/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(['lean', 'toned', 'muscular', 'very muscular'] as const).map((muscle) => (
                                  <SelectItem key={muscle} value={muscle}>
                                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Body Hair</Label>
                            <Select 
                              value={character.appearance.bodyHair} 
                              onValueChange={(v) => updateAppearance('bodyHair', v as BodyHairOption)}
                            >
                              <SelectTrigger className="bg-input/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(['none', 'light', 'moderate', 'heavy'] as const).map((hair) => (
                                  <SelectItem key={hair} value={hair}>
                                    {hair.charAt(0).toUpperCase() + hair.slice(1)}
                                  </SelectItem>
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
            </section>
              </>
            )}

            {/* Background Step */}
            {currentStep === 'background' && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Background & Starting Point</h2>
              </div>
              <Separator className="bg-border/30" />

              <div className="space-y-6">
                {/* Spawn Point Selection */}
                <div className="space-y-3">
                  <Label>Starting Location</Label>
                  <p className="text-xs text-muted-foreground">Where does your story begin?</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.values(SPAWN_POINTS).map((spawn) => (
                      <div
                        key={spawn.id}
                        onClick={() => updateBackground('spawnPoint', spawn.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          character.background.spawnPoint === spawn.id
                            ? 'bg-primary/20 border-primary'
                            : 'bg-input/30 border-border/50 hover:bg-input/50'
                        }`}
                      >
                        <h4 className="font-medium mb-1">{spawn.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{spawn.startingLocation}</p>
                        <div className="text-xs space-y-1">
                          <p><span className="text-muted-foreground">Housing:</span> {spawn.housing}</p>
                          <p><span className="text-muted-foreground">Money:</span> ${spawn.money}</p>
                          <p><span className="text-muted-foreground">Stress:</span> {spawn.stress}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show spawn point details */}
                  {SPAWN_POINTS[character.background.spawnPoint] && (
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-2 text-sm">
                      <p className="font-medium text-accent">{SPAWN_POINTS[character.background.spawnPoint].narrativeHook}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Schedule:</span> {SPAWN_POINTS[character.background.spawnPoint].schedule}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Social Capital:</span> {SPAWN_POINTS[character.background.spawnPoint].socialCapital.join(', ')}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {SPAWN_POINTS[character.background.spawnPoint].uniqueEvents.map((event) => (
                          <span key={event} className="px-2 py-0.5 text-xs rounded-full bg-muted/50 text-muted-foreground">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Origin (personality background) */}
                <div className="space-y-2">
                  <Label>Personal History</Label>
                  <Select 
                    value={character.background.origin} 
                    onValueChange={(v) => updateBackground('origin', v)}
                  >
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(BACKGROUND_EFFECTS).map((origin) => (
                        <SelectItem key={origin} value={origin}>
                          {origin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {backgroundEffect && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Bonus Stress:</span> +{backgroundEffect.startingStress}</p>
                    <p><span className="text-muted-foreground">Bonus Money:</span> +${backgroundEffect.startingMoney}</p>
                    <p><span className="text-muted-foreground">Skills:</span> {backgroundEffect.skills.join(', ')}</p>
                    {backgroundEffect.traumaSeeds.length > 0 && (
                      <p className="text-destructive/80">
                        <span className="text-muted-foreground">Trauma Seeds:</span> {backgroundEffect.traumaSeeds.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
            )}

            {/* Personality Step */}
            {currentStep === 'personality' && (
              <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Brain className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Personality</h2>
              </div>
              <Separator className="bg-border/30" />

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Disposition</Label>
                  <p className="text-xs text-muted-foreground">Affects your approach to challenges and risks</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Bold', 'Cautious', 'Adaptable'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updatePersonality('disposition', d)}
                        className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                          character.personality.disposition === d
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-input/30 border-border/50 hover:bg-input/50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Social Style</Label>
                  <p className="text-xs text-muted-foreground">Affects how NPCs react to you</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Charming', 'Reserved', 'Blunt'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updatePersonality('socialStyle', s)}
                        className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                          character.personality.socialStyle === s
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-input/30 border-border/50 hover:bg-input/50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* Summary Step */}
            {currentStep === 'summary' && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-primary">Character Summary</h2>
                <Separator className="bg-border/30" />
                
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2 font-narrative">
                  {portraitUrl && (
                    <div className="w-24 h-32 rounded-lg overflow-hidden mb-3">
                      <img src={portraitUrl} alt="Character portrait" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-lg font-semibold text-foreground">{characterSummary.name}</p>
                  <p className="text-muted-foreground">{characterSummary.description}</p>
                  <p><span className="text-muted-foreground">Background:</span> {characterSummary.background}</p>
                  <p><span className="text-muted-foreground">Personality:</span> {characterSummary.personality}</p>
                  {backstory && (
                    <div className="pt-2 border-t border-border/30 mt-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Origin:</span> {backstory.origin.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Motivation:</span> {backstory.motivation.name}
                      </p>
                      {backstory.generatedNarrative && (
                        <p className="text-sm italic text-muted-foreground mt-2 line-clamp-3">
                          "{backstory.generatedNarrative}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </CardContent>
        </ScrollArea>

        {/* Step Navigation Footer */}
        <div className="p-6 border-t border-border/30">
          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={goToPrevStep}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            
            <div className="flex-1">
              {currentStep === 'summary' ? (
                <Button
                  onClick={handleBeginJourney}
                  disabled={!character.basicInfo.name.trim()}
                  className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
                >
                  Begin Your Journey
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  disabled={!canProceedFromStep(currentStep)}
                  className="w-full gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {currentStep === 'basics' && !character.basicInfo.name.trim() && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Please enter a name to continue
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
