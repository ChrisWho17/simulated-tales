import { useEffect, useState } from 'react';
import { Pipette, RotateCcw } from 'lucide-react';
import {
  CustomUiColors,
  DEFAULT_CUSTOM_UI_COLORS,
  hasCustomUiColors,
  normalizeHex,
} from '@/lib/colorTheme';
import { cn } from '@/lib/utils';

type Slot = keyof CustomUiColors;

const SLOTS: { id: Slot; label: string; hint: string; fallback: string }[] = [
  {
    id: 'accent',
    label: 'Accent',
    hint: 'Hairlines, tabs, primary chrome',
    fallback: '#d0a05f',
  },
  {
    id: 'panel',
    label: 'Panel',
    hint: 'Wash over HUD and overlays',
    fallback: '#1a1620',
  },
  {
    id: 'text',
    label: 'Text',
    hint: 'Secondary labels and soft chrome',
    fallback: '#e3c48d',
  },
];

interface CustomUiColorPickerProps {
  value: CustomUiColors;
  onChange: (next: CustomUiColors) => void;
  className?: string;
}

/**
 * Optional chrome colour overrides that sit on top of ThemeGrid presets.
 * Leaving a slot empty keeps that channel on the active catalog palette.
 */
export function CustomUiColorPicker({ value, onChange, className }: CustomUiColorPickerProps) {
  const active = hasCustomUiColors(value);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start gap-2">
        <Pipette className="mt-0.5 h-4 w-4 text-[var(--accent-secondary)]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Custom chrome</h3>
            {active && (
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULT_CUSTOM_UI_COLORS })}
                className="ml-auto inline-flex items-center gap-1 rounded-md border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            Tint the active theme. Presets stay; only the slots you set override.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {SLOTS.map(slot => (
          <ColorSlotRow
            key={slot.id}
            label={slot.label}
            hint={slot.hint}
            fallback={slot.fallback}
            value={value[slot.id]}
            onChange={hex => onChange({ ...value, [slot.id]: hex })}
          />
        ))}
      </div>
    </div>
  );
}

function ColorSlotRow({
  label,
  hint,
  fallback,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  fallback: string;
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const preview = value ?? fallback;

  const commitHex = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange(null);
      setDraft('');
      return;
    }
    const normalized = normalizeHex(trimmed);
    if (normalized) {
      onChange(normalized);
      setDraft(normalized);
    } else {
      setDraft(value ?? '');
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-[var(--surface-sunken)]/60 px-2.5 py-2">
      <label className="relative h-9 w-9 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-[var(--surface-edge)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(145deg, ${preview} 0%, ${preview}cc 100%)`,
          }}
          aria-hidden="true"
        />
        <input
          type="color"
          value={preview}
          aria-label={`${label} colour`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={e => {
            const hex = normalizeHex(e.target.value);
            if (hex) {
              onChange(hex);
              setDraft(hex);
            }
          }}
        />
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
        </div>
        <input
          type="text"
          value={draft}
          placeholder={value ? undefined : 'Theme default'}
          spellCheck={false}
          className="mt-1 w-full border-0 bg-transparent p-0 font-mono text-[11px] text-[var(--accent-secondary)] outline-none placeholder:text-muted-foreground/70"
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commitHex(draft)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex-shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default CustomUiColorPicker;
