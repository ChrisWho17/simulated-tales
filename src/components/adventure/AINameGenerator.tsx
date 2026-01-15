import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, RefreshCw, Check } from 'lucide-react';
import { GameGenre } from '@/types/genreData';
import { generateCharacterNames, GeneratedName, NameGenerationRequest } from '@/game/characterAISystem';
import { Origin, ORIGINS } from '@/game/characterDevelopmentSystem';
import { cn } from '@/lib/utils';

interface AINameGeneratorProps {
  genre: GameGenre;
  gender?: string;
  origin?: Origin;
  onSelectName: (name: string) => void;
  className?: string;
}

const NAME_STYLES = [
  { value: 'classic', label: 'Classic' },
  { value: 'exotic', label: 'Exotic' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'humble', label: 'Humble' },
  { value: 'noble', label: 'Noble' },
] as const;

export function AINameGenerator({ genre, gender, origin, onSelectName, className }: AINameGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [names, setNames] = useState<GeneratedName[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [nameStyle, setNameStyle] = useState<'classic' | 'exotic' | 'mysterious' | 'humble' | 'noble'>('classic');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSelectedName(null);
    
    try {
      const request: NameGenerationRequest = {
        genre,
        gender,
        origin,
        nameStyle,
        count: 5,
      };
      
      const generatedNames = await generateCharacterNames(request);
      setNames(generatedNames);
    } catch (error) {
      console.error('Failed to generate names:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectName = (name: string) => {
    setSelectedName(name);
    onSelectName(name);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Name Generator</h3>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Style</Label>
          <Select value={nameStyle} onValueChange={(v) => setNameStyle(v as any)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NAME_STYLES.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : names.length > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Names
              </>
            )}
          </Button>
        </div>
      </div>

      {names.length > 0 && (
        <div className="space-y-2">
          {names.map((nameData, index) => (
            <button
              key={index}
              onClick={() => handleSelectName(nameData.name)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all",
                selectedName === nameData.name
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/50 bg-background/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{nameData.name}</span>
                {selectedName === nameData.name && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              {nameData.meaning && (
                <p className="text-xs text-muted-foreground mt-1">{nameData.meaning}</p>
              )}
              {nameData.suitedFor && (
                <p className="text-xs text-primary/70 mt-0.5 italic">{nameData.suitedFor}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
