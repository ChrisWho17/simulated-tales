import React, { useState, useEffect, useCallback } from 'react';
import { generateInnerMonologue, InnerMonologue, InnerMonologueRequest } from '@/game/characterAISystem';
import { Backstory, PersonalityTrait, CharacterFlaw } from '@/game/characterDevelopmentSystem';
import { cn } from '@/lib/utils';
import { Brain, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InnerMonologueDisplayProps {
  characterName: string;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  backstory?: Backstory;
  currentSituation: string;
  emotionalState: string;
  recentEvent?: string;
  autoGenerate?: boolean;
  className?: string;
  compact?: boolean;
}

export function InnerMonologueDisplay({
  characterName,
  traits,
  flaws,
  backstory,
  currentSituation,
  emotionalState,
  recentEvent,
  autoGenerate = false,
  className,
  compact = false,
}: InnerMonologueDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [monologue, setMonologue] = useState<InnerMonologue | null>(null);
  const [lastSituation, setLastSituation] = useState<string>('');

  const generateMonologue = useCallback(async () => {
    if (!currentSituation || traits.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const request: InnerMonologueRequest = {
        characterName,
        traits,
        flaws,
        backstory,
        currentSituation,
        emotionalState,
        recentEvent,
      };
      
      const result = await generateInnerMonologue(request);
      setMonologue(result);
      setLastSituation(currentSituation);
    } catch (error) {
      console.error('Failed to generate inner monologue:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [characterName, traits, flaws, backstory, currentSituation, emotionalState, recentEvent]);

  // Auto-generate when situation changes significantly
  useEffect(() => {
    if (autoGenerate && currentSituation && currentSituation !== lastSituation && traits.length > 0) {
      const timer = setTimeout(() => {
        generateMonologue();
      }, 1000); // Debounce
      
      return () => clearTimeout(timer);
    }
  }, [autoGenerate, currentSituation, lastSituation, traits.length, generateMonologue]);

  if (!monologue && !isGenerating) {
    if (compact) {
      return (
        <Button
          onClick={generateMonologue}
          variant="ghost"
          size="sm"
          className={cn("gap-1 text-muted-foreground", className)}
          disabled={traits.length === 0}
        >
          <Brain className="w-3 h-3" />
          Inner Thought
        </Button>
      );
    }

    return (
      <div className={cn("p-3 rounded-lg border border-dashed border-border/50 bg-muted/10", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="w-4 h-4" />
            <span className="text-sm">Inner Monologue</span>
          </div>
          <Button
            onClick={generateMonologue}
            variant="ghost"
            size="sm"
            disabled={traits.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className={cn("p-3 rounded-lg bg-muted/20 border border-border/30", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm italic">Thinking...</span>
        </div>
      </div>
    );
  }

  if (!monologue) return null;

  if (compact) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        <Brain className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
        <p className="text-sm italic text-muted-foreground">{monologue.thought}</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4 rounded-lg bg-gradient-to-br from-primary/5 to-muted/20 border border-primary/20", className)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">{characterName}'s Thoughts</span>
        </div>
        <Button
          onClick={generateMonologue}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={isGenerating}
        >
          <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
        </Button>
      </div>
      
      <p className="text-sm italic leading-relaxed">"{monologue.thought}"</p>
      
      {monologue.subtext && (
        <p className="text-xs text-muted-foreground mt-2">
          {monologue.subtext}
        </p>
      )}
      
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded bg-muted/50">
          {monologue.emotionalTone}
        </span>
        {monologue.relatedTrait && (
          <span className="text-primary/70">↳ {monologue.relatedTrait}</span>
        )}
        {monologue.relatedFlaw && (
          <span className="text-amber-500/70">↳ {monologue.relatedFlaw}</span>
        )}
      </div>
    </div>
  );
}
