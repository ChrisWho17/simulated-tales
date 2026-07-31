/**
 * OpenRouter access layer (server-side only).
 *
 * Every narration/director model call goes through this module. The
 * OPENROUTER_API_KEY never leaves the edge runtime — it is never returned in a
 * response body, a header, or a log line.
 *
 * Model ids live here (overridable via environment variables) so roles can be
 * re-pointed without touching application code.
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Role -> model id. Env vars win so ids can change without a deploy edit. */
export const OPENROUTER_MODELS = {
  narrator: Deno.env.get('OPENROUTER_NARRATOR_MODEL') || 'aion-labs/aion-3.0',
  director: Deno.env.get('OPENROUTER_DIRECTOR_MODEL') || 'deepseek/deepseek-v4-pro',
  fallback: Deno.env.get('OPENROUTER_FALLBACK_MODEL') || 'deepseek/deepseek-v4-pro',
  /** Small side-calls: NPC/companion dialogue, ruleset enhancement. */
  utility: Deno.env.get('OPENROUTER_UTILITY_MODEL') || 'deepseek/deepseek-chat',
} as const;

/**
 * Model ids a client is allowed to request. Anything else falls back to the
 * configured role default, so the settings UI can never point the game at an
 * arbitrary (or expensive) model.
 */
export const ALLOWED_NARRATOR_MODELS = new Set<string>([
  OPENROUTER_MODELS.narrator,
  OPENROUTER_MODELS.fallback,
  'aion-labs/aion-3.0',
  'deepseek/deepseek-v4-pro',
  'deepseek/deepseek-chat',
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-5.5',
]);

export const ALLOWED_DIRECTOR_MODELS = new Set<string>([
  OPENROUTER_MODELS.director,
  'deepseek/deepseek-v4-pro',
  'deepseek/deepseek-chat',
  'aion-labs/aion-3.0',
  'openai/gpt-5.5',
]);

export function resolveNarratorModel(requested?: string): string {
  return requested && ALLOWED_NARRATOR_MODELS.has(requested)
    ? requested
    : OPENROUTER_MODELS.narrator;
}

export function resolveFallbackModel(requested?: string): string {
  return requested && ALLOWED_NARRATOR_MODELS.has(requested)
    ? requested
    : OPENROUTER_MODELS.fallback;
}

export function resolveDirectorModel(requested?: string): string {
  return requested && ALLOWED_DIRECTOR_MODELS.has(requested)
    ? requested
    : OPENROUTER_MODELS.director;
}

export function getOpenRouterKey(): string | null {
  return Deno.env.get('OPENROUTER_API_KEY') || null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterCallOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  /** Hard timeout for the request. Streaming responses only time out on headers. */
  timeoutMs?: number;
  /** Correlates every log line for one player turn. */
  turnId?: string;
  /** Referer/title attribution shown in the OpenRouter dashboard. */
  appLabel?: string;
}

/** Terminal statuses: retrying only burns time and money. */
export function isTerminalStatus(status: number): boolean {
  return [400, 401, 402, 403, 404, 429].includes(status);
}

/**
 * One OpenRouter chat-completions request with a timeout.
 * Returns the raw Response so callers can stream or buffer as needed.
 */
export async function callOpenRouter(opts: OpenRouterCallOptions): Promise<Response> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');

  const {
    model,
    messages,
    stream = false,
    timeoutMs = 90_000,
    turnId,
    appLabel = 'The Untold Stories',
    ...sampling
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://theuntoldstories.lovable.app',
        'X-Title': appLabel,
        ...(turnId ? { 'X-Turn-Id': turnId } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        ...(stream ? { stream_options: { include_usage: true } } : {}),
        ...sampling,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Usage logging (server-side only, never returned to the browser)
// ---------------------------------------------------------------------------

export interface UsageLogEntry {
  fn: string;
  role: 'narrator' | 'director' | 'fallback' | 'illustration' | 'utility';
  model: string;
  turnId?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costUsd?: number | null;
  timeToFirstTokenMs?: number | null;
  totalMs?: number | null;
  retries?: number;
  usedFallback?: boolean;
  failureReason?: string | null;
  status?: number | null;
}

export function logOpenRouterUsage(entry: UsageLogEntry): void {
  try {
    console.log(`[openrouter-usage] ${JSON.stringify({ ts: new Date().toISOString(), ...entry })}`);
  } catch {
    /* logging must never break a turn */
  }
}

/** Pull usage/cost off a completed (non-streamed) OpenRouter payload. */
export function extractUsage(payload: unknown): {
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
} {
  const usage = (payload as { usage?: Record<string, unknown> } | null)?.usage;
  if (!usage) return { inputTokens: null, outputTokens: null, costUsd: null };
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  return {
    inputTokens: num(usage.prompt_tokens),
    outputTokens: num(usage.completion_tokens),
    costUsd: num(usage.cost) ?? num((usage as { total_cost?: number }).total_cost),
  };
}

// ---------------------------------------------------------------------------
// Illustration route (OpenRouter Images API)
// ---------------------------------------------------------------------------
//
// Illustration is a SEPARATE job from narration: it uses the same protected
// OPENROUTER_API_KEY and the same account, but its own models, its own
// endpoint and its own cost log role, so spend can be attributed per role.

export const OPENROUTER_IMAGE_MODELS = {
  heavy: Deno.env.get('OPENROUTER_IMAGE_MODEL') || 'black-forest-labs/flux.2-max',
  fallback: Deno.env.get('OPENROUTER_IMAGE_FALLBACK_MODEL') || 'openai/gpt-image-2',
} as const;

export interface ImageGenOptions {
  prompt: string;
  /** Approved reference images (canonical portrait / full body / location). */
  referenceImages?: string[];
  size?: string;
  timeoutMs?: number;
  turnId?: string;
  appLabel?: string;
}

export interface ImageGenResult {
  imageUrl: string | null;
  model: string | null;
  usedFallback: boolean;
  status: number | null;
  error?: string;
  costUsd?: number | null;
}

/** Pull the first usable image out of any of OpenRouter's response shapes. */
function extractImageUrl(payload: any): string | null {
  const d = payload?.data?.[0];
  if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
  if (typeof d?.url === 'string') return d.url;
  if (typeof d?.image_url?.url === 'string') return d.image_url.url;
  const msgImage = payload?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof msgImage === 'string') return msgImage;
  const direct = payload?.images?.[0];
  if (typeof direct === 'string') return direct;
  if (typeof direct?.image_url?.url === 'string') return direct.image_url.url;
  return null;
}

async function requestImage(
  model: string,
  opts: ImageGenOptions,
  withReferences: boolean
): Promise<{ res: Response; body: any | null }> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);

  const body: Record<string, unknown> = {
    model,
    prompt: opts.prompt,
    n: 1,
    ...(opts.size ? { size: opts.size } : {}),
  };
  if (withReferences && opts.referenceImages?.length) {
    body.image = opts.referenceImages.slice(0, 4);
  }

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://theuntoldstories.lovable.app',
        'X-Title': opts.appLabel ?? 'The Untold Stories',
        ...(opts.turnId ? { 'X-Turn-Id': opts.turnId } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let parsed: any = null;
    try {
      parsed = await res.clone().json();
    } catch {
      parsed = null;
    }
    return { res, body: parsed };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate one illustration. Heavy model first, documented fallback second.
 * Never throws for provider failures — the caller must be able to drop the
 * illustration without touching the story.
 */
export async function generateIllustration(opts: ImageGenOptions): Promise<ImageGenResult> {
  const models = [OPENROUTER_IMAGE_MODELS.heavy, OPENROUTER_IMAGE_MODELS.fallback];
  let lastStatus: number | null = null;
  let lastError = 'unknown error';

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    // Reference images first; if the model rejects that shape, retry text-only.
    const attempts = opts.referenceImages?.length ? [true, false] : [false];
    for (const withRefs of attempts) {
      const started = Date.now();
      try {
        const { res, body } = await requestImage(model, opts, withRefs);
        lastStatus = res.status;
        if (res.ok) {
          const imageUrl = extractImageUrl(body);
          if (imageUrl) {
            const costUsd =
              typeof body?.usage?.cost === 'number' ? body.usage.cost : null;
            logOpenRouterUsage({
              fn: 'illustration',
              role: 'illustration',
              model,
              turnId: opts.turnId,
              costUsd,
              totalMs: Date.now() - started,
              usedFallback: i > 0,
              status: res.status,
            });
            return { imageUrl, model, usedFallback: i > 0, status: res.status, costUsd };
          }
          lastError = 'no image in response';
          continue;
        }
        lastError = (await res.text()).slice(0, 400);
        logOpenRouterUsage({
          fn: 'illustration',
          role: 'illustration',
          model,
          turnId: opts.turnId,
          totalMs: Date.now() - started,
          usedFallback: i > 0,
          status: res.status,
          failureReason: lastError,
        });
        // Auth/credit problems affect every model — stop immediately.
        if (res.status === 401 || res.status === 402 || res.status === 403) {
          return { imageUrl: null, model, usedFallback: i > 0, status: res.status, error: lastError };
        }
      } catch (err) {
        lastError = String(err);
      }
    }
  }

  return { imageUrl: null, model: null, usedFallback: true, status: lastStatus, error: lastError };
}
