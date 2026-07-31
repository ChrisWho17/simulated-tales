/**
 * AI Narration configuration — dual-model narration.
 *
 * Live Narrator  : writes every visible turn (default openai/gpt-5.5)
 * Story Director : writes the hidden Director Brief (default openai/gpt-5.6-sol)
 * Fallback       : used only if the Live Narrator fails twice (default openai/gpt-5.4)
 *
 * Model ids are intentionally configurable so they can be swapped without a
 * code change. Lightweight models (flash / mini / nano / lite / luna) are
 * explicitly NOT offered for the Live Narrator.
 */

const STORAGE_KEY = 'untold-ai-narration-config';

export type DirectorFrequency = 'off' | 'rare' | 'normal' | 'frequent';

export interface AiNarrationConfig {
  /** Live Narrator model — every visible player turn. */
  narratorModel: string;
  /** Story Director model — hidden brief, runs in the background. */
  directorModel: string;
  /** Only used when the narrator fails twice. Never a lightweight model. */
  fallbackModel: string;
  /** How often the Story Director is allowed to run. */
  directorFrequency: DirectorFrequency;
  /** Stream narration tokens into the story panel as they arrive. */
  streaming: boolean;
  /** Show latency / token / Director Brief debug information. */
  debug: boolean;
}

/** OpenRouter model ids. The key itself lives only in the edge functions. */
export const NARRATOR_MODEL_OPTIONS = [
  { id: 'aion-labs/aion-3.0', label: 'Aion 3.0 (recommended)' },
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { id: 'openai/gpt-5.5', label: 'GPT-5.5' },
] as const;

export const DIRECTOR_MODEL_OPTIONS = [
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro (recommended)' },
  { id: 'aion-labs/aion-3.0', label: 'Aion 3.0' },
  { id: 'openai/gpt-5.5', label: 'GPT-5.5' },
] as const;

export const FALLBACK_MODEL_OPTIONS = [
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro (recommended)' },
  { id: 'aion-labs/aion-3.0', label: 'Aion 3.0' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
] as const;

export const DEFAULT_AI_NARRATION_CONFIG: AiNarrationConfig = {
  narratorModel: 'aion-labs/aion-3.0',
  directorModel: 'deepseek/deepseek-v4-pro',
  fallbackModel: 'deepseek/deepseek-v4-pro',
  directorFrequency: 'normal',
  streaming: true,
  debug: false,
};

/** Meaningful turns between automatic Director runs. */
export const DIRECTOR_INTERVAL: Record<DirectorFrequency, number> = {
  off: Number.POSITIVE_INFINITY,
  rare: 20,
  normal: 10,
  frequent: 5,
};

const ALLOWED_NARRATOR = new Set<string>(NARRATOR_MODEL_OPTIONS.map(o => o.id));
const ALLOWED_DIRECTOR = new Set<string>(DIRECTOR_MODEL_OPTIONS.map(o => o.id));
const ALLOWED_FALLBACK = new Set<string>(FALLBACK_MODEL_OPTIONS.map(o => o.id));

export function loadAiNarrationConfig(): AiNarrationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_NARRATION_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AiNarrationConfig>;
    const merged = { ...DEFAULT_AI_NARRATION_CONFIG, ...parsed };
    // Guard against stale/lightweight ids persisted by older builds.
    if (!ALLOWED_NARRATOR.has(merged.narratorModel)) {
      merged.narratorModel = DEFAULT_AI_NARRATION_CONFIG.narratorModel;
    }
    if (!ALLOWED_DIRECTOR.has(merged.directorModel)) {
      merged.directorModel = DEFAULT_AI_NARRATION_CONFIG.directorModel;
    }
    if (!ALLOWED_FALLBACK.has(merged.fallbackModel)) {
      merged.fallbackModel = DEFAULT_AI_NARRATION_CONFIG.fallbackModel;
    }
    return merged;
  } catch {
    return { ...DEFAULT_AI_NARRATION_CONFIG };
  }
}

export function saveAiNarrationConfig(config: AiNarrationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('ai-narration-config-changed', { detail: config }));
  } catch {
    /* storage full — settings are non-critical */
  }
}

// ---------------------------------------------------------------------------
// Live telemetry (latency / token usage) surfaced in the AI Narration panel
// ---------------------------------------------------------------------------

export interface NarrationTelemetry {
  lastLatencyMs: number | null;
  /** Time from request start to the first visible streamed token. */
  lastTimeToFirstTokenMs: number | null;
  lastInputTokens: number | null;
  lastOutputTokens: number | null;
  lastModelUsed: string | null;
  usedFallback: boolean;
  directorLatencyMs: number | null;
  directorModelUsed: string | null;
}

const telemetry: NarrationTelemetry = {
  lastLatencyMs: null,
  lastTimeToFirstTokenMs: null,
  lastInputTokens: null,
  lastOutputTokens: null,
  lastModelUsed: null,
  usedFallback: false,
  directorLatencyMs: null,
  directorModelUsed: null,
};

export function recordNarrationTelemetry(patch: Partial<NarrationTelemetry>): void {
  Object.assign(telemetry, patch);
  try {
    window.dispatchEvent(new CustomEvent('ai-narration-telemetry', { detail: { ...telemetry } }));
  } catch {
    /* non-browser context */
  }
}

export function getNarrationTelemetry(): NarrationTelemetry {
  return { ...telemetry };
}

/** Rough token estimate for prompt-size reporting (≈4 chars per token). */
export function estimateTokens(payload: unknown): number {
  try {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return Math.ceil(text.length / 4);
  } catch {
    return 0;
  }
}
