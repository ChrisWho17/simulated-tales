// Measurement unit utilities — imperial default, metric optional.

export type MeasurementUnit = 'imperial' | 'metric';

export const DEFAULT_UNIT: MeasurementUnit = 'imperial';

// ---- WEIGHT ----
export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462);
}
export function lbToKg(lb: number): number {
  return Math.round(lb / 2.20462);
}
export function formatWeight(kg: number, unit: MeasurementUnit = DEFAULT_UNIT): string {
  if (!kg || kg <= 0) return '—';
  return unit === 'imperial' ? `${kgToLb(kg)} lb` : `${kg} kg`;
}

// ---- HEIGHT ----
// Approximate height bands in cm for each preset (player + NPC).
export const HEIGHT_BAND_CM: Record<string, [number, number]> = {
  'very short': [140, 155],
  short:        [152, 162],
  average:      [163, 178],
  tall:         [178, 188],
  'very tall':  [188, 200],
  giant:        [200, 215],
};

export function formatHeight(cm: number, unit: MeasurementUnit = DEFAULT_UNIT): string {
  if (!cm || cm <= 0) return '—';
  if (unit === 'metric') return `${cm} cm`;
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${ft}'${inches}"`;
}

export function heightBandLabel(band: string, unit: MeasurementUnit = DEFAULT_UNIT): string {
  const r = HEIGHT_BAND_CM[band];
  if (!r) return band;
  return unit === 'metric'
    ? `${r[0]}–${r[1]} cm`
    : `${formatHeight(r[0], 'imperial')} – ${formatHeight(r[1], 'imperial')}`;
}

// Suggested weight range (kg) by combined height-band × build, used as slider default + NPC roll.
export function suggestedWeightRangeKg(heightBand: string, build: string): [number, number] {
  const [hMin, hMax] = HEIGHT_BAND_CM[heightBand] || HEIGHT_BAND_CM.average;
  // Base BMI-ish midpoint per build
  const bmiByBuild: Record<string, [number, number]> = {
    slim:      [17, 21],
    average:   [20, 25],
    athletic:  [21, 26],
    muscular:  [24, 30],
    heavyset:  [28, 38],
    curvy:     [23, 30],
    petite:    [17, 22],
  };
  const [bMin, bMax] = bmiByBuild[build] || bmiByBuild.average;
  const minM = hMin / 100;
  const maxM = hMax / 100;
  return [Math.round(bMin * minM * minM), Math.round(bMax * maxM * maxM)];
}
