// ============================================================================
// RESILIENCE UTILITIES - Comprehensive hardening for game systems
// Provides retry logic, circuit breakers, defensive loading, and error recovery
// ============================================================================

import { toast } from 'sonner';

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    if (error instanceof TypeError && error.message.includes('fetch')) return true;
    if (error instanceof Error && error.message.includes('timeout')) return true;
    if (error instanceof Response && error.status >= 500) return true;
    return true; // Default to retry
  },
  onRetry: (error, attempt) => {
    console.warn(`[Retry] Attempt ${attempt} failed:`, error);
  },
};

/**
 * Execute a function with automatic retry and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt > opts.maxRetries) {
        throw error;
      }
      
      if (!opts.shouldRetry(error, attempt)) {
        throw error;
      }
      
      opts.onRetry(error, attempt);
      
      // Exponential backoff with jitter
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200,
        opts.maxDelayMs
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  successesSinceHalfOpen: number;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

export interface CircuitBreakerOptions {
  failureThreshold?: number;     // Open circuit after this many failures
  resetTimeoutMs?: number;       // Try again after this time
  successThreshold?: number;     // Close circuit after this many successes in half-open
}

const DEFAULT_CIRCUIT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,         // 30 seconds
  successThreshold: 2,           // 2 successes to close
};

/**
 * Execute with circuit breaker pattern
 * Prevents cascade failures by stopping calls to failing services
 */
export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  options: CircuitBreakerOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_CIRCUIT_OPTIONS, ...options };
  
  let state = circuitBreakers.get(key);
  if (!state) {
    state = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      successesSinceHalfOpen: 0,
    };
    circuitBreakers.set(key, state);
  }
  
  // Check if circuit is open
  if (state.isOpen) {
    const timeSinceFailure = Date.now() - state.lastFailure;
    
    if (timeSinceFailure < opts.resetTimeoutMs) {
      throw new CircuitOpenError(`Circuit '${key}' is open. Retry after ${Math.ceil((opts.resetTimeoutMs - timeSinceFailure) / 1000)}s`);
    }
    
    // Half-open: allow one request through
    console.log(`[CircuitBreaker] '${key}' entering half-open state`);
  }
  
  try {
    const result = await fn();
    
    // Success: reset or close circuit
    if (state.isOpen) {
      state.successesSinceHalfOpen++;
      if (state.successesSinceHalfOpen >= opts.successThreshold) {
        console.log(`[CircuitBreaker] '${key}' closing after ${state.successesSinceHalfOpen} successes`);
        state.isOpen = false;
        state.failures = 0;
        state.successesSinceHalfOpen = 0;
      }
    } else {
      state.failures = 0;
    }
    
    return result;
  } catch (error) {
    state.failures++;
    state.lastFailure = Date.now();
    state.successesSinceHalfOpen = 0;
    
    if (state.failures >= opts.failureThreshold) {
      state.isOpen = true;
      console.error(`[CircuitBreaker] '${key}' opened after ${state.failures} failures`);
    }
    
    throw error;
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Reset a circuit breaker (for testing or manual recovery)
 */
export function resetCircuitBreaker(key: string): void {
  circuitBreakers.delete(key);
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(key: string): CircuitBreakerState | null {
  return circuitBreakers.get(key) || null;
}

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// DEFENSIVE JSON PARSING
// ============================================================================

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T
): T {
  if (!json) return fallback;
  
  try {
    const parsed = JSON.parse(json);
    
    // Basic type check - if fallback is an object, ensure parsed is too
    if (typeof fallback === 'object' && fallback !== null) {
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('[safeJsonParse] Parsed value is not an object, using fallback');
        return fallback;
      }
    }
    
    return parsed as T;
  } catch (error) {
    console.warn('[safeJsonParse] Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely stringify JSON with error handling
 */
export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('[safeJsonStringify] Failed to stringify:', error);
    return null;
  }
}

// ============================================================================
// DEFENSIVE LOCALSTORAGE
// ============================================================================

/**
 * Safe localStorage operations with quota handling
 */
export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return safeJsonParse(value, fallback);
    } catch (error) {
      console.warn(`[safeStorage] Failed to get '${key}':`, error);
      return fallback;
    }
  },
  
  set(key: string, value: unknown): boolean {
    try {
      const json = safeJsonStringify(value);
      if (json === null) return false;
      
      localStorage.setItem(key, json);
      return true;
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError') {
        console.warn(`[safeStorage] Quota exceeded for '${key}', attempting cleanup`);
        // Trigger cleanup and retry once
        try {
          // Clear old portrait caches first (lowest priority)
          const keysToTry = Object.keys(localStorage).filter(k => 
            k.includes('portrait-cache') || 
            k.includes('scene-illustration')
          );
          for (const k of keysToTry.slice(0, 10)) {
            localStorage.removeItem(k);
          }
          
          // Retry
          const json = safeJsonStringify(value);
          if (json) {
            localStorage.setItem(key, json);
            return true;
          }
        } catch {
          console.error(`[safeStorage] Failed to save '${key}' even after cleanup`);
        }
      }
      console.error(`[safeStorage] Failed to set '${key}':`, error);
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[safeStorage] Failed to remove '${key}':`, error);
      return false;
    }
  },
};

// ============================================================================
// OBJECT VALIDATION AND DEFAULTS
// ============================================================================

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Merge an object with defaults, ensuring all fields exist
 */
export function withDefaults<T extends Record<string, unknown>>(
  value: DeepPartial<T> | null | undefined,
  defaults: T
): T {
  if (value === null || value === undefined) {
    return { ...defaults };
  }
  
  const result: Record<string, unknown> = { ...defaults };
  
  for (const key of Object.keys(defaults)) {
    const defaultValue = defaults[key];
    const inputValue = (value as Record<string, unknown>)[key];
    
    if (inputValue === undefined) {
      result[key] = defaultValue;
    } else if (
      typeof defaultValue === 'object' && 
      defaultValue !== null && 
      !Array.isArray(defaultValue) &&
      typeof inputValue === 'object' &&
      inputValue !== null &&
      !Array.isArray(inputValue)
    ) {
      // Recursively merge nested objects
      result[key] = withDefaults(
        inputValue as Record<string, unknown>, 
        defaultValue as Record<string, unknown>
      );
    } else {
      result[key] = inputValue;
    }
  }
  
  return result as T;
}

// ============================================================================
// ASYNC QUEUE FOR SEQUENTIAL OPERATIONS
// ============================================================================

type QueuedOperation = {
  operation: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

const operationQueues = new Map<string, QueuedOperation[]>();
const processingQueues = new Set<string>();

/**
 * Queue operations to run sequentially (prevents race conditions)
 */
export async function queueOperation<T>(
  queueKey: string,
  operation: () => Promise<T>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let queue = operationQueues.get(queueKey);
    if (!queue) {
      queue = [];
      operationQueues.set(queueKey, queue);
    }
    
    queue.push({
      operation,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    
    processQueue(queueKey);
  });
}

async function processQueue(queueKey: string): Promise<void> {
  if (processingQueues.has(queueKey)) return;
  
  const queue = operationQueues.get(queueKey);
  if (!queue || queue.length === 0) return;
  
  processingQueues.add(queueKey);
  
  while (queue.length > 0) {
    const item = queue.shift()!;
    
    try {
      const result = await item.operation();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
  }
  
  processingQueues.delete(queueKey);
}

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

/**
 * Create a safe wrapper that catches errors and returns a fallback
 */
export function createSafeExecutor<T extends (...args: unknown[]) => unknown>(
  fn: T,
  fallback: ReturnType<T>,
  errorHandler?: (error: unknown) => void
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error) => {
          console.error('[SafeExecutor] Async error:', error);
          errorHandler?.(error);
          return fallback;
        }) as ReturnType<T>;
      }
      
      return result as ReturnType<T>;
    } catch (error) {
      console.error('[SafeExecutor] Sync error:', error);
      errorHandler?.(error);
      return fallback;
    }
  }) as T;
}

// ============================================================================
// DEBOUNCED STATE UPDATES
// ============================================================================

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  key: string,
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      fn(...args);
    }, delayMs);
    
    debounceTimers.set(key, timer);
  };
}

/**
 * Cancel a pending debounced call
 */
export function cancelDebounce(key: string): void {
  const timer = debounceTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(key);
  }
}

// ============================================================================
// NETWORK STATUS
// ============================================================================

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
const onlineListeners: ((online: boolean) => void)[] = [];

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    onlineListeners.forEach(cb => cb(true));
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
    onlineListeners.forEach(cb => cb(false));
  });
}

export function getNetworkStatus(): boolean {
  return isOnline;
}

export function onNetworkStatusChange(callback: (online: boolean) => void): () => void {
  onlineListeners.push(callback);
  return () => {
    const idx = onlineListeners.indexOf(callback);
    if (idx >= 0) onlineListeners.splice(idx, 1);
  };
}

// ============================================================================
// GRACEFUL ERROR DISPLAY
// ============================================================================

/**
 * Show user-friendly error message based on error type
 */
export function showUserFriendlyError(error: unknown, context?: string): void {
  let message = 'Something went wrong';
  let description = '';
  
  if (error instanceof TimeoutError) {
    message = 'Request timed out';
    description = 'The server took too long to respond. Please try again.';
  } else if (error instanceof CircuitOpenError) {
    message = 'Service temporarily unavailable';
    description = 'Please wait a moment before trying again.';
  } else if (!isOnline) {
    message = 'No internet connection';
    description = 'Please check your network and try again.';
  } else if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      message = 'Network error';
      description = 'Could not connect to the server.';
    } else if (error.message.includes('quota')) {
      message = 'Storage full';
      description = 'Please free up some space by deleting old saves.';
    }
  }
  
  if (context) {
    description = description ? `${description} (${context})` : context;
  }
  
  toast.error(message, { description, duration: 5000 });
}
