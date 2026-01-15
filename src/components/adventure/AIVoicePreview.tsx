import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Quote, RefreshCw } from 'lucide-react';
import { GameGenre } from '@/types/genreData';
import { generateVoicePreview, VoiceStyleRequest, VoiceStylePreview } from '@/game/characterAISystem';
import { PersonalityTrait, CharacterFlaw, Origin, Motivation } from '@/game/characterDevelopmentSystem';
import { cn } from '@/lib/utils';

interface AIVoicePreviewProps {
  characterName: string;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  origin?: Origin;
  motivation?: Motivation;
  genre: GameGenre;
  className?: string;
}

export function AIVoicePreview({
  characterName,
  traits,
  flaws,
  origin,
  motivation,
  genre,
  className,
}: AIVoicePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<VoiceStylePreview | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const request: VoiceStyleRequest = {
        characterName: characterName || 'The Character',
        traits,
        flaws,
        origin,
        motivation,
        genre,
        emotionalState: 'calm',
      };
      
      const result = await generateVoicePreview(request);
      setPreview(result);
    } catch (error) {
      console.error('Failed to generate voice preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!preview) {
    return (
      <div className={cn("p-4 rounded-lg border border-dashed border-border/50 bg-muted/20", className)}>
        <div className="text-center space-y-3">
          <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Generate a preview of how {characterName || 'your character'} would speak
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || traits.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Preview Voice Style
              </>
            )}
          </Button>
          {traits.length === 0 && (
            <p className="text-xs text-muted-foreground">Select personality traits first</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Voice Preview</h3>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="ghost"
          size="sm"
          className="gap-1"
        >
          <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Speaking Style */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
        <p className="text-sm">{preview.speakingStyle}</p>
      </div>

      {/* Sample Dialogues */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Sample Dialogue</Label>
        {preview.sampleDialogues.map((dialogue, index) => (
          <div key={index} className="flex gap-2 p-2 rounded bg-background/50 border border-border/30">
            <Quote className="w-4 h-4 text-primary/50 shrink-0 mt-0.5" />
            <p className="text-sm italic">{dialogue}</p>
          </div>
        ))}
      </div>

      {/* Verbal Tics & Expressions */}
      {(preview.verbalTics?.length || preview.favoriteExpressions?.length) && (
        <div className="flex flex-wrap gap-2">
          {preview.verbalTics?.map((tic, index) => (
            <span key={`tic-${index}`} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
              {tic}
            </span>
          ))}
          {preview.favoriteExpressions?.map((expr, index) => (
            <span key={`expr-${index}`} className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent-foreground border border-accent/20">
              {expr}
            </span>
          ))}
        </div>
      )}

      {/* Tonal Qualities */}
      {preview.tonalQualities.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tone:</span>
          <span className="text-foreground">{preview.tonalQualities.join(' • ')}</span>
        </div>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
