// Streaming Narrative Hook
// Provides word-by-word streaming for AI narrative generation
// With hardened error handling and retry logic

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getNetworkStatus } from '@/lib/resilienceUtils';

interface StreamingState {
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  retryCount: number;
}

interface StreamingOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullContent: string, mechanics?: unknown) => void;
  onError?: (error: string) => void;
  maxRetries?: number;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 120000; // 2 minutes
const DEFAULT_MAX_RETRIES = 1;

export function useStreamingNarrative() {
  const [state, setState] = useState<StreamingState>({
    content: '',
    isStreaming: false,
    isComplete: false,
    error: null,
    retryCount: 0,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<string>('');

  const streamNarrative = useCallback(async (
    endpoint: string,
    body: Record<string, unknown>,
    options: StreamingOptions = {}
  ): Promise<{ content: string; mechanics?: unknown } | null> => {
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    
    // Check network status first
    if (!getNetworkStatus()) {
      const errorMsg = 'No internet connection. Please check your network.';
      toast.error(errorMsg);
      setState(prev => ({ ...prev, error: errorMsg }));
      options.onError?.(errorMsg);
      return null;
    }
    
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    contentRef.current = '';
    
    setState({
      content: '',
      isStreaming: true,
      isComplete: false,
      error: null,
      retryCount: 0,
    });

    // Attempt streaming with retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ ...body, stream: true }),
          signal: abortControllerRef.current?.signal,
        });

        // Handle rate limit and payment errors (no retry)
        if (response.status === 429) {
          const errorMsg = 'AI is busy. Please wait a moment and try again.';
          toast.error(errorMsg, { duration: 5000, description: 'Rate limit exceeded' });
          setState(prev => ({ ...prev, isStreaming: false, error: errorMsg }));
          options.onError?.(errorMsg);
          return null;
        }
        
        if (response.status === 402) {
          const errorMsg = 'AI credits depleted. Please add credits to continue.';
          toast.error(errorMsg, { duration: 8000, description: 'Usage limit reached' });
          setState(prev => ({ ...prev, isStreaming: false, error: errorMsg }));
          options.onError?.(errorMsg);
          return null;
        }

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let mechanics: unknown = undefined;
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });

          // Process line-by-line as data arrives
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              
              // Handle narrative token
              const token = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (token) {
                contentRef.current += token;
                setState(prev => ({ ...prev, content: contentRef.current }));
                options.onToken?.(token);
              }
              
              // Handle mechanics (sent at the end)
              if (parsed.mechanics) {
                mechanics = parsed.mechanics;
              }
            } catch {
              // Incomplete JSON, put back and wait for more data
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const token = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (token) {
                contentRef.current += token;
                setState(prev => ({ ...prev, content: contentRef.current }));
                options.onToken?.(token);
              }
              if (parsed.mechanics) {
                mechanics = parsed.mechanics;
              }
            } catch { /* ignore partial leftovers */ }
          }
        }

        setState(prev => ({
          ...prev,
          isStreaming: false,
          isComplete: true,
        }));
        
        options.onComplete?.(contentRef.current, mechanics);
        
        return { content: contentRef.current, mechanics };
        
      } catch (error: unknown) {
        const err = error as Error;
        
        if (err.name === 'AbortError') {
          // Intentional abort - don't retry
          setState(prev => ({ ...prev, isStreaming: false }));
          return null;
        }
        
        // Log the error
        console.error(`[useStreamingNarrative] Attempt ${attempt + 1} failed:`, err);
        
        // If we have retries left, update state and continue
        if (attempt < maxRetries) {
          setState(prev => ({ ...prev, retryCount: attempt + 1 }));
          console.log(`[useStreamingNarrative] Retrying (${attempt + 1}/${maxRetries})...`);
          // Brief delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        // Final failure
        const errorMsg = err.message || 'Failed to stream narrative';
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: errorMsg,
        }));
        options.onError?.(errorMsg);
        return null;
      }
    }
    
    return null;
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  const reset = useCallback(() => {
    cancelStream();
    contentRef.current = '';
    setState({
      content: '',
      isStreaming: false,
      isComplete: false,
      error: null,
      retryCount: 0,
    });
  }, [cancelStream]);

  return {
    ...state,
    streamNarrative,
    cancelStream,
    reset,
  };
}
