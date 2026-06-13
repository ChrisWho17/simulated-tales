import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollText, ArrowRight, SkipForward, Sparkles, Loader2, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StoryRulesetScreenProps {
  characterName: string;
  genreLabel: string;
  onConfirm: (ruleset: string) => void;
  onBack?: () => void;
}

const SUGGESTIONS = [
  'Keep romance subtle and slow-burn.',
  'No instant-death encounters; always give a way out.',
  'NPCs remember small kindnesses for a long time.',
  'Treat injuries seriously — wounds linger.',
  'Lean into mystery and unspoken motives.',
  'Avoid modern slang; keep language period-appropriate.',
];

const MAX_LEN = 1200;

export function StoryRulesetScreen({ characterName, genreLabel, onConfirm, onBack }: StoryRulesetScreenProps) {
  const [ruleset, setRuleset] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [preEnhanceBackup, setPreEnhanceBackup] = useState<string | null>(null);

  const append = (line: string) => {
    setRuleset(prev => {
      const next = prev.trim() ? `${prev.trim()}\n• ${line}` : `• ${line}`;
      return next.slice(0, MAX_LEN);
    });
  };

  const handleEnhance = async () => {
    const raw = ruleset.trim();
    if (!raw) {
      toast({ title: 'Nothing to enhance', description: 'Write a few rules first, then enhance.', variant: 'destructive' });
      return;
    }
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-ruleset', {
        body: { ruleset: raw, genre: genreLabel, characterName },
      });
      if (error) throw error;
      const enhanced = (data?.enhanced || '').toString().trim();
      if (!enhanced) throw new Error('Empty enhancement');
      setPreEnhanceBackup(raw);
      setRuleset(enhanced.slice(0, MAX_LEN));
      toast({ title: 'Ruleset enhanced', description: 'Expanded into a detailed narrator-ready ruleset.' });
    } catch (err: any) {
      console.error('[StoryRuleset] enhance failed:', err);
      toast({
        title: 'Enhancement failed',
        description: err?.message || 'Could not enhance ruleset. Try again.',
        variant: 'destructive',
      });
    } finally {
      setEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    if (preEnhanceBackup !== null) {
      setRuleset(preEnhanceBackup);
      setPreEnhanceBackup(null);
    }
  };

  const handleStart = () => onConfirm(ruleset.trim());
  const handleSkip = () => onConfirm('');

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.12),transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary backdrop-blur-sm">
            <ScrollText className="h-3 w-3" />
            Story Ruleset
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Set the tone for {characterName}'s tale
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Optional rules, vibes, or hard limits the narrator should honor while telling your {genreLabel} story.
          </p>
        </div>

        <div className="flex-1 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-xl shadow-glass sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Narrator instructions <span className="text-foreground/50">(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              {preEnhanceBackup !== null && !enhancing && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleUndoEnhance}
                  className="h-7 px-2 text-[11px]"
                  title="Restore your original text"
                >
                  <Undo2 className="h-3 w-3" />
                  Undo
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleEnhance}
                disabled={enhancing || !ruleset.trim()}
                className="h-7 gap-1 border-primary/40 bg-primary/10 px-2 text-[11px] text-primary hover:bg-primary/20"
                title="Rewrite your rules into a detailed, narrator-ready version"
              >
                {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {enhancing ? 'Enhancing…' : 'Enhance'}
              </Button>
            </div>
          </div>
          <Textarea
            value={ruleset}
            onChange={e => {
              setRuleset(e.target.value.slice(0, MAX_LEN));
              if (preEnhanceBackup !== null) setPreEnhanceBackup(null);
            }}
            placeholder={`e.g. "Keep things gritty. NPCs distrust strangers. Never break perspective. Slow-burn romance only."`}
            className="min-h-[180px] resize-none bg-background/60 text-sm leading-relaxed"
            disabled={enhancing}
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="text-primary/80">
              Tip: write a few rough rules, then tap <Sparkles className="inline h-2.5 w-2.5" /> Enhance to expand them into vivid detail.
            </span>
            <span>{ruleset.length} / {MAX_LEN}</span>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick add
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => append(s)}
                  className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-foreground/80 transition hover:border-primary/60 hover:bg-primary/15"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          {onBack ? (
            <Button variant="outline" onClick={onBack} className="sm:w-auto">
              Back
            </Button>
          ) : <span />}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={handleSkip} disabled={enhancing}>
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>
            <Button onClick={handleStart} disabled={enhancing}>
              Begin Story
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
