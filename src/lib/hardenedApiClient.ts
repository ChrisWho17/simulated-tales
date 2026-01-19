// ============================================================================
// HARDENED API CLIENT - Resilient edge function calls
// Provides retry, timeout, circuit breaker, and offline handling
// ============================================================================

import { 
  withRetry, 
  withCircuitBreaker, 
  withTimeout, 
  getNetworkStatus,
  showUserFriendlyError,
  CircuitOpenError,
  TimeoutError,
} from '@/lib/resilienceUtils';
import { toast } from 'sonner';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  baseUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`,
  defaultTimeout: 60000,      // 60 seconds for AI calls
  streamingTimeout: 120000,   // 2 minutes for streaming
  maxRetries: 2,
  circuitFailureThreshold: 3,
  circuitResetTimeout: 60000, // 1 minute
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  retried?: number;
}

// ============================================================================
// REQUEST QUEUE FOR DEDUPLICATION
// ============================================================================

const pendingRequests = new Map<string, Promise<ApiResponse<unknown>>>();

function getRequestKey(endpoint: string, body: unknown): string {
  return `${endpoint}:${JSON.stringify(body)}`;
}

// ============================================================================
// CORE API CALL
// ============================================================================

async function makeApiCall<T>(
  endpoint: string,
  body: unknown,
  options: {
    timeout?: number;
    skipCircuitBreaker?: boolean;
    skipRetry?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  // Check network status first
  if (!getNetworkStatus()) {
    return {
      success: false,
      error: 'No internet connection',
      statusCode: 0,
    };
  }
  
  const fullUrl = `${API_CONFIG.baseUrl}/${endpoint}`;
  const timeout = options.timeout || API_CONFIG.defaultTimeout;
  
  const fetchFn = async (): Promise<ApiResponse<T>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle specific error codes
      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limited - please wait a moment',
          statusCode: 429,
        };
      }
      
      if (response.status === 402) {
        return {
          success: false,
          error: 'API credits depleted',
          statusCode: 402,
        };
      }
      
      if (response.status === 503) {
        throw new Error('Service unavailable'); // Will trigger retry
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          success: false,
          error: errorText,
          statusCode: response.status,
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data as T,
        statusCode: response.status,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeout}ms`);
      }
      
      throw error;
    }
  };
  
  // Apply circuit breaker
  let wrappedFn = fetchFn;
  if (!options.skipCircuitBreaker) {
    wrappedFn = () => withCircuitBreaker(endpoint, fetchFn, {
      failureThreshold: API_CONFIG.circuitFailureThreshold,
      resetTimeoutMs: API_CONFIG.circuitResetTimeout,
    });
  }
  
  // Apply retry
  if (!options.skipRetry) {
    return withRetry(wrappedFn, {
      maxRetries: API_CONFIG.maxRetries,
      baseDelayMs: 1000,
      shouldRetry: (error, attempt) => {
        // Don't retry on circuit open
        if (error instanceof CircuitOpenError) return false;
        // Don't retry on timeout (already waited long enough)
        if (error instanceof TimeoutError && attempt > 1) return false;
        // Retry on network errors
        return true;
      },
      onRetry: (error, attempt) => {
        console.log(`[API] Retrying ${endpoint} (attempt ${attempt + 1}):`, error);
      },
    });
  }
  
  return wrappedFn();
}

// ============================================================================
// ADVENTURE GENERATION API
// ============================================================================

export interface AdventureRequest {
  playerAction: string;
  character: unknown;
  storyContext: string;
  genre: string;
  scenario: string;
  inventoryContext?: string;
  systemContext?: string;
  consistencyContext?: string;
  memoryContext?: unknown;
  emotionalContext?: unknown;
  reputationContext?: unknown;
  diceMode?: string;
  worldBible?: unknown;
  pressureContext?: string;
  toneContext?: string;
  npcMotivationContext?: string;
  weatherContext?: string;
  timeContext?: unknown;
  knowledgeContext?: string;
  pendingRoll?: unknown;
  lastRollResult?: unknown;
  narratorConfig?: unknown;
  languageContext?: string;
  microEventContext?: string;
  npcContext?: string;
  rumorContext?: string;
  npcScheduleContext?: string;
  livingWorldContext?: string;
  inDepthSettings?: unknown;
  directorContext?: string;
  companionContext?: string;
  stream?: boolean;
}

export interface AdventureResponse {
  narrative: string;
  mechanics?: {
    damageDealt?: number;
    damageTaken?: number;
    xpGained?: number;
    goldChange?: number;
    itemsLooted?: string[];
    healingReceived?: number;
  };
  choices?: string[];
  npcDialogue?: {
    npcName: string;
    dialogue: string;
    mood?: string;
  };
}

export async function callGenerateAdventure(
  request: AdventureRequest
): Promise<ApiResponse<AdventureResponse>> {
  // Deduplicate identical requests
  const key = getRequestKey('generate-adventure', {
    playerAction: request.playerAction,
    storyContext: request.storyContext?.slice(-500), // Only compare recent context
  });
  
  const pending = pendingRequests.get(key);
  if (pending) {
    console.log('[API] Deduplicating generate-adventure request');
    return pending as Promise<ApiResponse<AdventureResponse>>;
  }
  
  const promise = makeApiCall<AdventureResponse>('generate-adventure', request, {
    timeout: request.stream ? API_CONFIG.streamingTimeout : API_CONFIG.defaultTimeout,
  });
  
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
}

// ============================================================================
// PORTRAIT GENERATION API
// ============================================================================

export interface PortraitRequest {
  character: unknown;
  genre: string;
  style?: string;
}

export interface PortraitResponse {
  imageUrl: string;
}

export async function callGeneratePortrait(
  request: PortraitRequest
): Promise<ApiResponse<PortraitResponse>> {
  return makeApiCall<PortraitResponse>('generate-portrait', request, {
    timeout: 30000, // 30 seconds for image generation
  });
}

// ============================================================================
// NPC PORTRAIT GENERATION API
// ============================================================================

export interface NPCPortraitRequest {
  npcName: string;
  npcDescription: string;
  genre: string;
  setting?: string;
}

export interface NPCPortraitResponse {
  imageUrl: string;
  npcId: string;
}

export async function callGenerateNPCPortrait(
  request: NPCPortraitRequest
): Promise<ApiResponse<NPCPortraitResponse>> {
  return makeApiCall<NPCPortraitResponse>('generate-npc-portrait', request, {
    timeout: 30000,
  });
}

// ============================================================================
// SCENE IMAGE GENERATION API
// ============================================================================

export interface SceneImageRequest {
  sceneDescription: string;
  genre: string;
  mood?: string;
  style?: string;
}

export interface SceneImageResponse {
  imageUrl: string;
}

export async function callGenerateSceneImage(
  request: SceneImageRequest
): Promise<ApiResponse<SceneImageResponse>> {
  return makeApiCall<SceneImageResponse>('generate-scene-image', request, {
    timeout: 30000,
  });
}

// ============================================================================
// NPC DIALOGUE GENERATION API
// ============================================================================

export interface NPCDialogueRequest {
  npcName: string;
  npcPersonality: string;
  playerMessage: string;
  conversationHistory?: string[];
  genre: string;
}

export interface NPCDialogueResponse {
  dialogue: string;
  mood?: string;
  action?: string;
}

export async function callGenerateNPCDialogue(
  request: NPCDialogueRequest
): Promise<ApiResponse<NPCDialogueResponse>> {
  return makeApiCall<NPCDialogueResponse>('generate-npc-dialogue', request, {
    timeout: 20000, // 20 seconds for dialogue
  });
}

// ============================================================================
// COMPANION DIALOGUE GENERATION API
// ============================================================================

export interface CompanionDialogueRequest {
  companionName: string;
  companionPersonality: string;
  situation: string;
  genre: string;
}

export interface CompanionDialogueResponse {
  dialogue: string;
  mood?: string;
}

export async function callGenerateCompanionDialogue(
  request: CompanionDialogueRequest
): Promise<ApiResponse<CompanionDialogueResponse>> {
  return makeApiCall<CompanionDialogueResponse>('generate-companion-dialogue', request, {
    timeout: 20000,
  });
}

// ============================================================================
// ERROR HANDLING HELPER
// ============================================================================

export function handleApiError<T>(
  result: ApiResponse<T>,
  context: string,
  showToast: boolean = true
): void {
  if (result.success) return;
  
  console.error(`[API Error] ${context}:`, result.error, `(status: ${result.statusCode})`);
  
  if (showToast) {
    if (result.statusCode === 429) {
      toast.error('Slow down!', { 
        description: 'Please wait a moment before trying again.',
        duration: 3000,
      });
    } else if (result.statusCode === 402) {
      toast.error('Credits depleted', { 
        description: 'Please add credits to continue.',
        duration: 5000,
      });
    } else {
      toast.error('Something went wrong', { 
        description: result.error || context,
        duration: 4000,
      });
    }
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    // Simple ping to check if the API is reachable
    const response = await fetch(`${API_CONFIG.baseUrl}/generate-adventure`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}
