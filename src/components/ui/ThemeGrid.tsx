import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import {
  COLOR_PRESETS,
  COLOR_TONES,
  ColorPreset,
  ColorTone,
  THEME_GENRES,
  ThemeGenre,
  getPresetSwatch,
  getPresetTone,
} from '@/lib/colorTheme';
import { cn } from '@/lib/utils';

type ToneFilter = ColorTone | 'all';
type GenreFilter = ThemeGenre | 'all';

/** Camo swatches paint fabric, not a hue ramp — layered blobs / pixel blocks. */
function swatchBackground(preset: ColorPreset): string {
  const [start, middle, end] = getPresetSwatch(preset);

  if (preset.pattern === 'digital-camo') {
    return [
      `linear-gradient(135deg, ${middle} 25%, transparent 25%) 0 0 / 10px 10px`,
      `linear-gradient(225deg, ${end} 25%, transparent 25%) 5px 0 / 10px 10px`,
      `linear-gradient(45deg, ${middle} 25%, transparent 25%) 0 5px / 10px 10px`,
      `linear-gradient(315deg, ${end} 25%, transparent 25%) 5px 5px / 10px 10px`,
      `linear-gradient(0deg, ${start}, ${start})`,
    ].join(', ');
  }

  if (preset.pattern === 'camo') {
    return [
      `radial-gradient(circle at 20% 30%, ${middle} 0 22%, transparent 23%)`,
      `radial-gradient(circle at 68% 22%, ${end} 0 16%, transparent 17%)`,
      `radial-gradient(circle at 45% 78%, ${middle} 0 20%, transparent 21%)`,
      `radial-gradient(circle at 88% 70%, ${end} 0 18%, transparent 19%)`,
      `linear-gradient(0deg, ${start}, ${start})`,
    ].join(', ');
  }

  return `linear-gradient(120deg, ${start} 0%, ${middle} 55%, ${end} 100%)`;
}

interface ThemeGridProps {
  /** Currently applied preset id. */
  value: string;
  onSelect: (presetId: string) => void;
  /** Restrict the grid — the first-run wizard passes the featured short list. */
  presets?: ColorPreset[];
  /** `detailed` adds the palette name and atmosphere line under each swatch. */
  variant?: 'compact' | 'detailed';
  /** Tone rail. Off for short lists where filtering costs more than it saves. */
  showFilters?: boolean;
  className?: string;
}

/**
 * Shared palette picker. Every preset is a coherent combination rather than a
 * single hue, so a swatch shows all three of its stops — a flat dot of `primary`
 * hides the pairings (copper into verdigris, terracotta into dusk violet).
 */
export function ThemeGrid({
  value,
  onSelect,
  presets = COLOR_PRESETS,
  variant = 'detailed',
  showFilters = true,
  className,
}: ThemeGridProps) {
  const [tone, setTone] = useState<ToneFilter>('all');
  const [genre, setGenre] = useState<GenreFilter>('all');

  // Only show genre tabs that the supplied list can actually fill.
  const availableGenres = useMemo(() => {
    const present = new Set<ThemeGenre>();
    presets.forEach(preset => preset.genres?.forEach(g => present.add(g)));
    return THEME_GENRES.filter(entry => present.has(entry.id));
  }, [presets]);

  // Only offer tones that the supplied list can actually fill.
  const availableTones = useMemo(() => {
    const present = new Set(presets.map(getPresetTone));
    return COLOR_TONES.filter(entry => present.has(entry.id));
  }, [presets]);

  const visible = useMemo(() => {
    let list = presets;
    if (genre !== 'all') list = list.filter(preset => preset.genres?.includes(genre));
    if (tone !== 'all') list = list.filter(preset => getPresetTone(preset) === tone);
    return list;
  }, [presets, tone, genre]);

  return (
    <div className={cn('space-y-4', className)}>
      {showFilters && availableGenres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <ToneChip active={genre === 'all'} onClick={() => setGenre('all')} label="All genres" />
          {availableGenres.map(entry => (
            <ToneChip
              key={entry.id}
              active={genre === entry.id}
              onClick={() => setGenre(entry.id)}
              label={entry.label}
              title={`Palettes tuned for ${entry.label} stories`}
            />
          ))}
        </div>
      )}

      {showFilters && availableTones.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <ToneChip active={tone === 'all'} onClick={() => setTone('all')} label="All" />
          {availableTones.map(entry => (
            <ToneChip
              key={entry.id}
              active={tone === entry.id}
              onClick={() => setTone(entry.id)}
              label={entry.label}
              title={entry.hint}
            />
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No palettes match that combination. Try another tone or genre.
        </p>
      )}

      <div
        className={cn(
          'grid gap-2',
          variant === 'detailed'
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-3 sm:grid-cols-4'
        )}
      >
        {visible.map(preset => {
          const selected = value === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              aria-pressed={selected}
              className={cn(
                'group relative overflow-hidden rounded-xl border p-2 text-left transition-all duration-200',
                selected
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)]'
                  : 'border-border/40 hover:border-border/80 hover:bg-muted/20'
              )}
              title={preset.blurb ? `${preset.name} — ${preset.blurb}` : preset.name}
            >
              <span
                className={cn(
                  'block w-full rounded-lg',
                  variant === 'detailed' ? 'h-10' : 'h-9'
                )}
                style={{
                  background: swatchBackground(preset),
                  boxShadow: selected ? `0 0 18px ${preset.glow}` : undefined,
                }}
              />

              {selected && (
                <span
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-black/55"
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}

              {variant === 'detailed' ? (
                <span className="mt-2 block">
                  <span className="block truncate text-xs font-medium text-foreground">
                    {preset.name}
                  </span>
                  {preset.blurb && (
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
                      {preset.blurb}
                    </span>
                  )}
                </span>
              ) : (
                <span className="mt-1.5 block truncate text-[11px] text-muted-foreground group-hover:text-foreground">
                  {preset.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToneChip({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
        active
          ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-secondary)]'
          : 'border-border/40 text-muted-foreground hover:border-border/80 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

export default ThemeGrid;
