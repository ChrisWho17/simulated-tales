/** OpenRouter access layer (server-side only). */
import { prepareSpecialTurnMessages } from './special-turn.ts';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const OPENROUTER_MODELS = {
  narrator: Deno.env.get('OPENROUTER_NARRATOR_MODEL') || 'aion-labs/aion-3.0',
  director: Deno.env.get('OPENROUTER_DIRECTOR_MODEL') || 'deepseek/deepseek-v4-pro',
  fallback: Deno.env.get('OPENROUTER_FALLBACK_MODEL') || 'deepseek/deepseek-v4-pro',
  utility: Deno.env.get('OPENROUTER_UTILITY_MODEL') || 'deepseek/deepseek-chat',
} as const;

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
  return requested && ALLOWED_NARRATOR_MODELS.has(requested) ? requested : OPENROUTER_MODELS.narrator;
}

export function resolveFallbackModel(requested?: string): string {
  return requested && ALLOWED_NARRATOR_MODELS.has(requested) ? requested : OPENROUTER_MODELS.fallback;
}

export function resolveDirectorModel(requested?: string): string {
  return requested && ALLOWED_DIRECTOR_MODELS.has(requested) ? requested : OPENROUTER_MODELS.director;
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
  timeoutMs?: number;
  turnId?: string;
  appLabel?: string;
}

export function isTerminalStatus(status: number): boolean {
  return [400, 401, 402, 403, 404, 429].includes(status);
}

function assistantContent(payload: unknown): string {
  const content = (payload as any)?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((part: any) => typeof part?.text === 'string' ? part.text : '').join('').trim();
  }
  return '';
}

function streamedAssistantContent(sseText: string): string {
  let content = '';
  for (const rawLine of sseText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      const token = parsed?.choices?.[0]?.delta?.content;
      if (typeof token === 'string') content += token;
    } catch {
      // Downstream uses the same tolerance for malformed frames.
    }
  }
  return content.trim();
}

function invalidProviderResponse(detail: string): Response {
  return new Response(JSON.stringify({ error: 'invalid_provider_response', detail }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Chat completion boundary.
 *
 * Narration calls containing the SPECIAL sentinel are preprocessed here. That
 * makes the dice result exist before the model writes the turn, and because the
 * resolver seeds from turnId + action, narrator retry/fallback attempts receive
 * the exact same roll instead of rerolling until the provider gets lucky.
 *
 * Provider HTTP 200 responses are also validated for real assistant content.
 */
export async function callOpenRouter(opts: OpenRouterCallOptions): Promise<Response> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');

  const {
    model,
    messages: rawMessages,
    stream = false,
    timeoutMs = 90_000,
    turnId,
    appLabel = 'The Untold Stories',
    ...sampling
  } = opts;

  const prepared = prepareSpecialTurnMessages(rawMessages, turnId);
  const messages = prepared.messages;
  if (prepared.result) {
    console.log(`[special-turn] ${JSON.stringify({
      turnId,
      actionType: prepared.result.rule.id,
      stat: prepared.result.rule.stat,
      naturalRoll: prepared.result.naturalRoll,
      total: prepared.result.total,
      target: prepared.result.target,
      outcome: prepared.result.outcome,
      luck: prepared.result.luckValue,
    })}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
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

    // Buffer inside the deadline so an empty/stalled provider cannot be
    // mistaken for a completed story turn.
    const text = await res.text();

    if (res.ok) {
      if (stream) {
        if (!streamedAssistantContent(text)) {
          return invalidProviderResponse('OpenRouter returned HTTP 200 SSE without usable assistant content.');
        }
      } else {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          return invalidProviderResponse('OpenRouter returned HTTP 200 with a non-JSON chat response.');
        }
        if (!assistantContent(parsed)) {
          return invalidProviderResponse('OpenRouter returned HTTP 200 without usable assistant content.');
        }
      }
    }

    return new Response(text, { status: res.status, headers: res.headers });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Usage logging
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
// Illustration route
// ---------------------------------------------------------------------------

export const OPENROUTER_IMAGE_MODELS = {
  heavy: Deno.env.get('OPENROUTER_IMAGE_MODEL') || 'black-forest-labs/flux.2-max',
  fallback: Deno.env.get('OPENROUTER_IMAGE_FALLBACK_MODEL') || 'openai/gpt-image-2',
} as const;

export interface ImageGenOptions {
  prompt: string;
  referenceImages?: string[];
  size?: string;
  timeoutMs?: number;
  totalBudgetMs?: number;
  turnId?: string;
  appLabel?: string;
  editOnly?: boolean;
  extraBody?: Record<string, unknown>;
}

export interface ImageGenResult {
  imageUrl: string | null;
  model: string | null;
  usedFallback: boolean;
  status: number | null;
  error?: string;
  costUsd?: number | null;
}

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
  withReferences: boolean,
  attemptMs: number,
): Promise<{ res: Response; body: any | null }> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), attemptMs);
  const body: Record<string, unknown> = {
    model,
    prompt: opts.prompt,
    n: 1,
    ...(opts.size ? { size: opts.size } : {}),
    ...(opts.extraBody ?? {}),
  };
  if (withReferences && opts.referenceImages?.length) body.image = opts.referenceImages.slice(0, 4);

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

/** Image generation is separate from narration and never breaks a story turn. */
export async function generateIllustration(opts: ImageGenOptions): Promise<ImageGenResult> {
  const models = [OPENROUTER_IMAGE_MODELS.heavy, OPENROUTER_IMAGE_MODELS.fallback];
  let lastStatus: number | null = null;
  let lastError = 'unknown error';
  const totalBudgetMs = opts.totalBudgetMs ?? 110_000;
  const perAttemptMs = opts.timeoutMs ?? 45_000;
  const deadline = Date.now() + totalBudgetMs;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const attempts = opts.referenceImages?.length
      ? (opts.editOnly ? [true] : [true, false])
      : [false];

    for (const withRefs of attempts) {
      const remaining = deadline - Date.now();
      if (remaining < 8_000) {
        return {
          imageUrl: null,
          model: null,
          usedFallback: true,
          status: lastStatus,
          error: `illustration timed out (${lastError})`,
        };
      }

      const started = Date.now();
      try {
        const { res, body } = await requestImage(
          model,
          opts,
          withRefs,
          Math.min(perAttemptMs, remaining - 2_000),
        );

        lastStatus = res.status;
        if (res.ok) {
          const imageUrl = extractImageUrl(body);
          if (imageUrl) {
            const costUsd = typeof body?.usage?.cost === 'number' ? body.usage.cost : null;
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
        if (res.status === 401 || res.status === 402 || res.status === 403) {
          return { imageUrl: null, model, usedFallback: i > 0, status: res.status, error: lastError };
        }
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        lastError = aborted ? `attempt timed out after ${Date.now() - started}ms` : String(err);
        logOpenRouterUsage({
          fn: 'illustration',
          role: 'illustration',
          model,
          turnId: opts.turnId,
          totalMs: Date.now() - started,
          usedFallback: i > 0,
          status: null,
          failureReason: lastError,
        });
        if (aborted) break;
      }
    }
  }

  return { imageUrl: null, model: null, usedFallback: true, status: lastStatus, error: lastError };
}
