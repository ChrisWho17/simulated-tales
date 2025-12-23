import { useState, useMemo } from 'react';
import { 
  CharacterData, 
  DEFAULT_CHARACTER, 
  BACKGROUND_EFFECTS,
  BodyTypeOption,
  HeightOption,
  HairLengthOption,
  DispositionOption,
  SocialStyleOption,
} from '@/types/characterCreation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Palette, BookOpen, Brain, Sparkles } from 'lucide-react';

interface CharacterCreationProps {
  onComplete: (character: CharacterData) => void;
}

export function CharacterCreation({ onComplete }: CharacterCreationProps) {
  const [character, setCharacter] = useState<CharacterData>(DEFAULT_CHARACTER);

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

  const updateBackground = (origin: string) => {
    setCharacter(prev => ({
      ...prev,
      background: { origin },
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

  const handleBeginJourney = () => {
    if (!character.basicInfo.name.trim()) {
      return;
    }
    onComplete(character);
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
        </CardHeader>

        <ScrollArea className="h-[60vh]">
          <CardContent className="p-6 space-y-8">
            {/* Basic Information */}
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
                  <RadioGroup
                    value={character.appearance.bodyType}
                    onValueChange={(v) => updateAppearance('bodyType', v as BodyTypeOption)}
                    className="flex flex-wrap gap-2"
                  >
                    {(['slim', 'average', 'athletic', 'curvy', 'heavy'] as const).map((type) => (
                      <div key={type} className="flex items-center">
                        <RadioGroupItem value={type} id={`body-${type}`} className="sr-only" />
                        <Label
                          htmlFor={`body-${type}`}
                          className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                            character.appearance.bodyType === type
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-input/30 border-border/50 hover:bg-input/50'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Height</Label>
                  <RadioGroup
                    value={character.appearance.height}
                    onValueChange={(v) => updateAppearance('height', v as HeightOption)}
                    className="flex flex-wrap gap-2"
                  >
                    {(['short', 'average', 'tall'] as const).map((h) => (
                      <div key={h} className="flex items-center">
                        <RadioGroupItem value={h} id={`height-${h}`} className="sr-only" />
                        <Label
                          htmlFor={`height-${h}`}
                          className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                            character.appearance.height === h
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-input/30 border-border/50 hover:bg-input/50'
                          }`}
                        >
                          {h.charAt(0).toUpperCase() + h.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
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
                    <RadioGroup
                      value={character.appearance.hairLength}
                      onValueChange={(v) => updateAppearance('hairLength', v as HairLengthOption)}
                      className="flex flex-wrap gap-2"
                    >
                      {(['short', 'medium', 'long'] as const).map((l) => (
                        <div key={l} className="flex items-center">
                          <RadioGroupItem value={l} id={`hair-${l}`} className="sr-only" />
                          <Label
                            htmlFor={`hair-${l}`}
                            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all border ${
                              character.appearance.hairLength === l
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-input/30 border-border/50 hover:bg-input/50'
                            }`}
                          >
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
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
              </div>
            </section>

            {/* Background */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Background</h2>
              </div>
              <Separator className="bg-border/30" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Select 
                    value={character.background.origin} 
                    onValueChange={updateBackground}
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
                    <p><span className="text-muted-foreground">Starting Stress:</span> {backgroundEffect.startingStress}</p>
                    <p><span className="text-muted-foreground">Starting Money:</span> ${backgroundEffect.startingMoney}</p>
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

            {/* Personality */}
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
                  <RadioGroup
                    value={character.personality.disposition}
                    onValueChange={(v) => updatePersonality('disposition', v as DispositionOption)}
                    className="flex flex-wrap gap-2"
                  >
                    {(['Bold', 'Cautious', 'Adaptable'] as const).map((d) => (
                      <div key={d} className="flex items-center">
                        <RadioGroupItem value={d} id={`disp-${d}`} className="sr-only" />
                        <Label
                          htmlFor={`disp-${d}`}
                          className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                            character.personality.disposition === d
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-input/30 border-border/50 hover:bg-input/50'
                          }`}
                        >
                          {d}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Social Style</Label>
                  <p className="text-xs text-muted-foreground">Affects how NPCs react to you</p>
                  <RadioGroup
                    value={character.personality.socialStyle}
                    onValueChange={(v) => updatePersonality('socialStyle', v as SocialStyleOption)}
                    className="flex flex-wrap gap-2"
                  >
                    {(['Charming', 'Reserved', 'Blunt'] as const).map((s) => (
                      <div key={s} className="flex items-center">
                        <RadioGroupItem value={s} id={`social-${s}`} className="sr-only" />
                        <Label
                          htmlFor={`social-${s}`}
                          className={`px-4 py-2 rounded-md cursor-pointer transition-all border ${
                            character.personality.socialStyle === s
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-input/30 border-border/50 hover:bg-input/50'
                          }`}
                        >
                          {s}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </section>

            {/* Character Summary */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-primary">Character Summary</h2>
              <Separator className="bg-border/30" />
              
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2 font-narrative">
                <p className="text-lg font-semibold text-foreground">{characterSummary.name}</p>
                <p className="text-muted-foreground">{characterSummary.description}</p>
                <p><span className="text-muted-foreground">Background:</span> {characterSummary.background}</p>
                <p><span className="text-muted-foreground">Personality:</span> {characterSummary.personality}</p>
              </div>
            </section>
          </CardContent>
        </ScrollArea>

        <div className="p-6 border-t border-border/30">
          <Button
            onClick={handleBeginJourney}
            disabled={!character.basicInfo.name.trim()}
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          >
            Begin Your Journey
          </Button>
          {!character.basicInfo.name.trim() && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Please enter a name to continue
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
