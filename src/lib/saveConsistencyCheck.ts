// ============================================================================
// SAVE/LOAD CONSISTENCY CHECK
// Validates that restored weatherState, timeState, and directorSettings match
// the current schema. Logs structured mismatches and returns a repaired copy
// (filling missing fields with current defaults) so legacy saves still load.
// ============================================================================

import { DEFAULT_DIRECTOR_SETTINGS, DirectorSettings } from '@/game/directorModeSystem';

export interface ConsistencyResult<T> {
  ok: boolean;
  mismatches: string[];
  repaired: T;
}

const WEATHER_REQUIRED = ['current', 'intensity'] as const;
const TIME_REQUIRED = ['hour'] as const;

const DEFAULT_WEATHER = {
  current: 'clear',
  intensity: 1,
  transitionAt: 0,
};

const DEFAULT_TIME = {
  hour: 12,
  minute: 0,
  day: 1,
  tick: 0,
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateWeatherState(value: unknown): ConsistencyResult<Record<string, unknown>> {
  const mismatches: string[] = [];
  const repaired: Record<string, unknown> = { ...DEFAULT_WEATHER };
  if (!isObject(value)) {
    mismatches.push('weatherState: missing or wrong shape, defaulted');
    return { ok: false, mismatches, repaired };
  }
  for (const k of WEATHER_REQUIRED) {
    if (value[k] === undefined || value[k] === null) {
      mismatches.push(`weatherState.${k}: missing, defaulted to ${(DEFAULT_WEATHER as any)[k]}`);
    }
  }
  Object.assign(repaired, value);
  return { ok: mismatches.length === 0, mismatches, repaired };
}

export function validateTimeState(value: unknown): ConsistencyResult<Record<string, unknown>> {
  const mismatches: string[] = [];
  const repaired: Record<string, unknown> = { ...DEFAULT_TIME };
  if (!isObject(value)) {
    mismatches.push('timeState: missing or wrong shape, defaulted');
    return { ok: false, mismatches, repaired };
  }
  for (const k of TIME_REQUIRED) {
    if (value[k] === undefined || value[k] === null) {
      mismatches.push(`timeState.${k}: missing, defaulted to ${(DEFAULT_TIME as any)[k]}`);
    }
  }
  Object.assign(repaired, value);
  return { ok: mismatches.length === 0, mismatches, repaired };
}

export function validateDirectorSettings(value: unknown): ConsistencyResult<DirectorSettings> {
  const mismatches: string[] = [];
  const defaults = DEFAULT_DIRECTOR_SETTINGS as unknown as Record<string, unknown>;
  const repaired: Record<string, unknown> = { ...defaults };
  if (!isObject(value)) {
    mismatches.push('directorSettings: missing, defaulted');
    return { ok: false, mismatches, repaired: repaired as unknown as DirectorSettings };
  }
  for (const k of Object.keys(defaults)) {
    if (!(k in value)) {
      mismatches.push(`directorSettings.${k}: missing, defaulted`);
    }
  }
  Object.assign(repaired, value);
  return { ok: mismatches.length === 0, mismatches, repaired: repaired as unknown as DirectorSettings };
}

export interface RestoredStateInput {
  weatherState?: unknown;
  timeState?: unknown;
  directorSettings?: unknown;
}

export interface RestoredStateResult {
  ok: boolean;
  mismatches: string[];
  weatherState: Record<string, unknown>;
  timeState: Record<string, unknown>;
  directorSettings: DirectorSettings;
}

export function validateRestoredState(save: RestoredStateInput): RestoredStateResult {
  const w = validateWeatherState(save.weatherState);
  const t = validateTimeState(save.timeState);
  const d = validateDirectorSettings(save.directorSettings);
  const mismatches = [...w.mismatches, ...t.mismatches, ...d.mismatches];
  const ok = mismatches.length === 0;
  if (!ok) {
    console.warn('[SaveConsistency] Mismatches detected:', {
      count: mismatches.length,
      mismatches,
    });
  } else {
    console.log('[SaveConsistency] Restored state matches current schema');
  }
  return {
    ok,
    mismatches,
    weatherState: w.repaired,
    timeState: t.repaired,
    directorSettings: d.repaired,
  };
}
