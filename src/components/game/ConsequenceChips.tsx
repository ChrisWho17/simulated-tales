import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ConsequenceChip {
  id: string;
  label: string;
  detail?: string;
}

interface ConsequenceChipsProps {
  chips: ConsequenceChip[];
  onDismiss?: (id: string) => void;
  onDismissAll?: () => void;
  className?: string;
}

/** Quiet “because…” row under a narrator beat — not a dashboard. */
export function ConsequenceChips({ chips, onDismiss, onDismissAll, className }: ConsequenceChipsProps) {
  if (!chips.length) return null;

  return (
    <div className={cn('mt-3 flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="group inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border/40 bg-background/40 px-2 py-1 text-[11px] font-body text-muted-foreground"
          title={chip.detail}
        >
          <span className="text-primary/80">because</span>
          <span className="text-foreground/85 truncate">{chip.label}</span>
          {onDismiss && (
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
              onClick={() => onDismiss(chip.id)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {onDismissAll && chips.length > 1 && (
        <button
          type="button"
          className="text-[10px] uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground"
          onClick={onDismissAll}
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function chipsFromMechanics(mechanics?: {
  lootGained?: Array<{ name?: string } | string>;
  damage?: number;
  heal?: number;
  healing?: number;
  xpGained?: number | { amount?: number };
  goldGained?: number;
  goldChange?: number;
  relationshipMoments?: Array<{ npcName?: string; change?: string; type?: string }>;
  languagesLearned?: string[];
}): ConsequenceChip[] {
  if (!mechanics) return [];
  const chips: ConsequenceChip[] = [];
  if (mechanics.damage && mechanics.damage > 0) {
    chips.push({ id: 'dmg', label: `you took ${mechanics.damage} damage` });
  }
  const heal = mechanics.heal || mechanics.healing;
  if (heal && heal > 0) {
    chips.push({ id: 'heal', label: `you recovered ${heal}` });
  }
  const xp = typeof mechanics.xpGained === 'number' ? mechanics.xpGained : mechanics.xpGained?.amount;
  if (xp && xp > 0) {
    chips.push({ id: 'xp', label: `+${xp} experience` });
  }
  const gold = mechanics.goldGained ?? mechanics.goldChange;
  if (gold) {
    chips.push({
      id: 'gold',
      label: gold > 0 ? `+${gold} coin` : `${gold} coin`,
    });
  }
  for (const item of mechanics.lootGained || []) {
    const name = typeof item === 'string' ? item : item.name;
    if (name) chips.push({ id: `loot-${name}`, label: `you gained ${name}` });
  }
  for (const rel of mechanics.relationshipMoments || []) {
    if (rel.npcName) {
      chips.push({
        id: `rel-${rel.npcName}`,
        label: `${rel.npcName} ${rel.change || rel.type || 'noticed'}`,
      });
    }
  }
  for (const lang of mechanics.languagesLearned || []) {
    chips.push({ id: `lang-${lang}`, label: `you grasped ${lang}` });
  }
  return chips.slice(0, 6);
}
