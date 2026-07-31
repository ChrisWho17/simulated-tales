// ============================================================================
// CHEST SCALE
// ----------------------------------------------------------------------------
// The chest size is stored as an exact continuous scalar (0 = completely flat,
// 1 = extremely large). UI labels and cup letters are DERIVED for readability;
// the scalar is what gets saved and what the prompt translator reads.
// ============================================================================

import { clampScalar, type ChestShape, type ScalarRange } from '@/types/visualProfile';

export interface ChestBand {
  label: string;
  /** Relative breast volume multiplier, 0.10x (flat) .. 8x (massive). */
  multiplier: number;
  /** Inclusive lower bound of the band. */
  min: number;
  /** Wording handed to the image model. */
  prompt: string;
}

export const CHEST_BANDS: ChestBand[] = [
  { label: 'Flat', min: 0.0, multiplier: 0.1, prompt: 'completely flat chest, no bust at all (breast volume 0.10x baseline)' },
  { label: 'Very Small', min: 0.06, multiplier: 0.5, prompt: 'very small bust, barely-there chest (breast volume 0.5x baseline)' },
  { label: 'Small', min: 0.16, multiplier: 1, prompt: 'small but clearly present bust, softly rounded chest (breast volume 1x baseline)' },
  { label: 'Medium', min: 0.3, multiplier: 2, prompt: 'full medium bust, distinctly rounded feminine chest (breast volume 2x baseline)' },
  { label: 'Large', min: 0.45, multiplier: 3.5, prompt: 'large heavy bust with deep cleavage, prominent chest (breast volume 3.5x baseline)' },
  { label: 'Very Large', min: 0.6, multiplier: 5, prompt: 'very large heavy bust, greatly enlarged chest straining the outfit (breast volume 5x baseline)' },
  { label: 'Huge', min: 0.75, multiplier: 6.5, prompt: 'huge bust, enormously heavy chest dominating the torso silhouette (breast volume 6.5x baseline)' },
  { label: 'Massive', min: 0.88, multiplier: 8, prompt: 'massive bust, extremely oversized heavy chest, dramatically exaggerated silhouette (breast volume 8x baseline)' },
];

/** Continuous volume multiplier: 0.10x at completely flat up to 8x at massive. */
export function chestVolumeMultiplier(value: ScalarRange): number {
  const v = clampScalar(value);
  const m = 0.1 + (8 - 0.1) * Math.pow(v, 1.35);
  return Math.round(m * 100) / 100;
}

/** Cup letters kept only as a legacy bridge for older saves and presets. */
export const CUP_LETTER_SCALARS: Record<string, number> = {
  AA: 0.0,
  A: 0.08,
  B: 0.18,
  C: 0.28,
  D: 0.38,
  DD: 0.46,
  E: 0.52,
  F: 0.6,
  G: 0.68,
  H: 0.76,
  I: 0.84,
  J: 0.92,
  K: 1.0,
  // very old free-text values
  flat: 0.0,
  small: 0.18,
  medium: 0.3,
  large: 0.5,
  'very large': 0.65,
  very_large: 0.65,
};

export function cupLetterToScalar(letter?: string | null, fallback = 0.3): ScalarRange {
  if (!letter) return clampScalar(fallback);
  const key = String(letter).trim();
  const direct = CUP_LETTER_SCALARS[key] ?? CUP_LETTER_SCALARS[key.toUpperCase()] ?? CUP_LETTER_SCALARS[key.toLowerCase()];
  return clampScalar(direct ?? fallback);
}

/** Nearest legacy cup letter, so older systems keep working. */
export function scalarToCupLetter(value: ScalarRange): string {
  const v = clampScalar(value);
  let best = 'C';
  let bestDelta = Infinity;
  for (const [letter, scalar] of Object.entries(CUP_LETTER_SCALARS)) {
    if (letter !== letter.toUpperCase()) continue; // skip legacy text keys
    const delta = Math.abs(scalar - v);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = letter;
    }
  }
  return best;
}

export function chestBandFor(value: ScalarRange): ChestBand {
  const v = clampScalar(value);
  let band = CHEST_BANDS[0];
  for (const candidate of CHEST_BANDS) {
    if (v >= candidate.min) band = candidate;
  }
  return band;
}

export function chestLabel(value: ScalarRange): string {
  return chestBandFor(value).label;
}

const SHAPE_WORDS: Record<ChestShape, string> = {
  flat: 'flat chest line',
  conical: 'conical shape',
  teardrop: 'teardrop shape',
  rounded_full: 'rounded full shape',
  wide_set_round: 'wide-set rounded shape',
  bell: 'bell shape, fuller at the base',
  athletic_flat: 'athletic flat chest',
  pectoral: 'defined pectoral chest',
};

function spacingWord(v: number): string {
  if (v < 0.35) return 'close-set';
  if (v > 0.65) return 'wide-set';
  return 'evenly set';
}

function positionWord(v: number): string {
  if (v < 0.35) return 'low-set on the torso';
  if (v > 0.65) return 'high-set on the torso';
  return 'naturally positioned';
}

function firmnessWord(v: number): string {
  if (v < 0.35) return 'soft and natural';
  if (v > 0.7) return 'firm';
  return 'natural';
}

export interface ChestPromptInput {
  chestSizeValue: number;
  chestShape?: ChestShape;
  chestSpacing?: number;
  chestPosition?: number;
  firmness?: number;
  supportGarmentInfluence?: string;
  /** Mature body wording is only produced for adults. */
  adultEligible: boolean;
  /** Only include when the chest is actually visible in the framing. */
  visuallyRelevant?: boolean;
}

/**
 * Translate the stored scalar into stable descriptive wording. The exact value
 * is never exposed to players — only this derived phrasing reaches the model.
 */
export function buildChestPrompt(input: ChestPromptInput): string {
  if (!input.adultEligible) return '';
  if (input.visuallyRelevant === false) return '';

  const value = clampScalar(input.chestSizeValue, 0.3);
  const band = chestBandFor(value);
  const parts: string[] = [
    band.prompt,
    `breast size multiplier ${chestVolumeMultiplier(value).toFixed(2)}x`,
    'curvy hourglass figure, wide full hips and a big round prominent butt',
  ];

  if (value > 0.05) {
    if (input.chestShape) parts.push(SHAPE_WORDS[input.chestShape] ?? '');
    if (typeof input.chestSpacing === 'number') parts.push(spacingWord(input.chestSpacing));
    if (typeof input.chestPosition === 'number') parts.push(positionWord(input.chestPosition));
    if (typeof input.firmness === 'number') parts.push(firmnessWord(input.firmness));
    if (input.supportGarmentInfluence) parts.push(input.supportGarmentInfluence);
  }

  return parts.filter(Boolean).join(', ');
}
