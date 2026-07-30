import { PlayOverlayShell } from '@/components/game/PlayOverlayShell';
import { Button } from '@/components/ui/button';
import type { AwayRecapResult } from '@/lib/whileYouWereAway';
import { cn } from '@/lib/utils';

interface WhileYouWereAwaySplashProps {
  open: boolean;
  recap: AwayRecapResult | null;
  onContinue: () => void;
}

export function WhileYouWereAwaySplash({ open, recap, onContinue }: WhileYouWereAwaySplashProps) {
  if (!recap) return null;

  return (
    <PlayOverlayShell
      open={open}
      onClose={onContinue}
      title={recap.title}
      subtitle="The living world"
      size="md"
      footer={
        <Button className="w-full font-display tracking-wide" onClick={onContinue}>
          Continue
        </Button>
      }
    >
      <div className="space-y-4 py-2">
        <ul className="space-y-3">
          {recap.lines.map((line, i) => (
            <li
              key={i}
              className={cn(
                'font-narrative text-base leading-relaxed text-foreground/90 border-l-2 pl-4',
                recap.tone === 'urgent' && 'border-destructive/60',
                recap.tone === 'warm' && 'border-primary/50',
                recap.tone === 'uneasy' && 'border-warning/50',
                recap.tone === 'quiet' && 'border-border'
              )}
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </PlayOverlayShell>
  );
}
