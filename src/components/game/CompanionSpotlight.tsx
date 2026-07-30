import { PlayOverlayShell } from '@/components/game/PlayOverlayShell';
import { Button } from '@/components/ui/button';
import type { AutonomousAction, PlayerResponseOption } from '@/game/companion/companionAutonomy';
import type { CompanionState } from '@/game/companionSystem';
import { Heart, AlertTriangle } from 'lucide-react';

interface CompanionSpotlightProps {
  open: boolean;
  companion: CompanionState | null;
  action: AutonomousAction | null;
  onRespond: (response: PlayerResponseOption) => void;
  onDismiss: () => void;
}

export function CompanionSpotlight({
  open,
  companion,
  action,
  onRespond,
  onDismiss,
}: CompanionSpotlightProps) {
  if (!companion || !action) return null;

  const options = action.playerOptions?.length
    ? action.playerOptions
    : [
        {
          label: 'Hear them out',
          type: 'comfort' as const,
          affinityChange: 2,
          trustChange: 1,
          outcome: `${companion.name} softens, just a little.`,
        },
        {
          label: 'Stand your ground',
          type: 'disagree' as const,
          affinityChange: -1,
          trustChange: 0,
          outcome: `${companion.name} files it away — not forgotten.`,
        },
        {
          label: 'Not now',
          type: 'dismiss' as const,
          affinityChange: -2,
          trustChange: -1,
          outcome: `${companion.name} goes quiet. The moment cools.`,
        },
      ];

  const urgent = action.priority === 'high' || action.priority === 'critical';

  return (
    <PlayOverlayShell
      open={open}
      onClose={onDismiss}
      title={companion.name}
      subtitle={action.type.replace(/_/g, ' ')}
      icon={urgent ? <AlertTriangle className="h-4 w-4 text-warning" /> : <Heart className="h-4 w-4 text-primary" />}
      size="md"
      dismissOnBackdrop={false}
    >
      <div className="space-y-5 py-1">
        <p className="font-narrative text-lg leading-relaxed text-foreground">
          {action.dialogue}
        </p>
        {action.internalReason && (
          <p className="text-xs text-muted-foreground italic font-body">
            They won’t say it aloud: {action.internalReason}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <Button
              key={i}
              variant={opt.type === 'dismiss' ? 'ghost' : 'outline'}
              className="justify-start h-auto py-3 px-4 font-body text-left whitespace-normal"
              onClick={() => onRespond(opt)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </PlayOverlayShell>
  );
}
