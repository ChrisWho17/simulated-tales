// ============================================================================
// PERSISTENT STATE HOOK - React integration with SaveSystem
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { SaveSystem } from '@/systems/SaveSystem';

interface PersistentStateOptions<T> {
  debounceMs?: number;
  saveOnUnmount?: boolean;
  validateFn?: (data: unknown) => boolean;
  onError?: (error: string) => void;
}

interface PersistentStateExtras {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  forceSave: () => Promise<void>;
  forceLoad: () => Promise<void>;
  isInSync: boolean;
}

// Deep equality check
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;
  
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }
  
  return true;
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, PersistentStateExtras] {
  const {
    debounceMs = 300,
    saveOnUnmount = true,
    validateFn,
    onError,
  } = options;
  
  // State
  const [value, setValueInternal] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInSync, setIsInSync] = useState(true);
  
  // Refs for avoiding stale closures
  const valueRef = useRef<T>(defaultValue);
  const keyRef = useRef(key);
  const isMountedRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const pendingSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValueRef = useRef<T | null>(null);
  
  // Load on mount
  useEffect(() => {
    if (!isFirstMountRef.current) return; // Strict mode protection
    isFirstMountRef.current = false;
    isMountedRef.current = true;
    
    const loadData = async () => {
      try {
        const loaded = await SaveSystem.load<T>(key);
        
        if (loaded !== null) {
          // Validate if function provided
          if (validateFn && !validateFn(loaded)) {
            console.warn(`[usePersistentState] Validation failed for ${key}, using default`);
            setError('Loaded data failed validation');
          } else {
            setValueInternal(loaded);
            valueRef.current = loaded;
            lastSavedValueRef.current = loaded;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        onError?.(msg);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue && isMountedRef.current) {
        try {
          const parsed = JSON.parse(e.newValue);
          const data = parsed.data ?? parsed;
          if (!deepEqual(data, valueRef.current)) {
            setValueInternal(data);
            valueRef.current = data;
            lastSavedValueRef.current = data;
            setIsInSync(true);
          }
        } catch {
          // Ignore parse errors from other tabs
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      
      // Flush pending save on unmount if configured
      if (saveOnUnmount && pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
        pendingSaveRef.current = null;
        
        // Sync save on unmount
        if (!deepEqual(valueRef.current, lastSavedValueRef.current)) {
          SaveSystem.saveImmediate(keyRef.current, valueRef.current);
        }
      }
    };
  }, [key, validateFn, onError, saveOnUnmount]);
  
  // Update key ref when key changes
  useEffect(() => {
    keyRef.current = key;
  }, [key]);
  
  // Save with debounce
  const scheduleSave = useCallback((newValue: T) => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
    }
    
    setIsInSync(false);
    
    pendingSaveRef.current = setTimeout(async () => {
      pendingSaveRef.current = null;
      
      // Don't save if unchanged
      if (deepEqual(newValue, lastSavedValueRef.current)) {
        setIsInSync(true);
        return;
      }
      
      setIsSaving(true);
      try {
        const success = await SaveSystem.save(keyRef.current, newValue);
        if (success && isMountedRef.current) {
          setLastSaved(new Date());
          lastSavedValueRef.current = newValue;
          setIsInSync(true);
          setError(null);
        } else if (!success && isMountedRef.current) {
          setError('Save failed');
          onError?.('Save failed');
        }
      } catch (err) {
        if (isMountedRef.current) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          onError?.(msg);
        }
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    }, debounceMs);
  }, [debounceMs, onError]);
  
  // Set value wrapper
  const setValue = useCallback((newValueOrFn: T | ((prev: T) => T)) => {
    const newValue = typeof newValueOrFn === 'function'
      ? (newValueOrFn as (prev: T) => T)(valueRef.current)
      : newValueOrFn;
    
    valueRef.current = newValue;
    setValueInternal(newValue);
    scheduleSave(newValue);
  }, [scheduleSave]);
  
  // Force save immediately
  const forceSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
    
    setIsSaving(true);
    try {
      const success = await SaveSystem.saveImmediate(keyRef.current, valueRef.current);
      if (success) {
        setLastSaved(new Date());
        lastSavedValueRef.current = valueRef.current;
        setIsInSync(true);
        setError(null);
      } else {
        setError('Force save failed');
        onError?.('Force save failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      onError?.(msg);
    } finally {
      setIsSaving(false);
    }
  }, [onError]);
  
  // Force load
  const forceLoad = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await SaveSystem.load<T>(keyRef.current);
      if (loaded !== null) {
        if (validateFn && !validateFn(loaded)) {
          setError('Loaded data failed validation');
        } else {
          setValueInternal(loaded);
          valueRef.current = loaded;
          lastSavedValueRef.current = loaded;
          setIsInSync(true);
          setError(null);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  }, [validateFn, onError]);
  
  return [
    value,
    setValue,
    {
      isLoading,
      isSaving,
      lastSaved,
      error,
      forceSave,
      forceLoad,
      isInSync,
    },
  ];
}

export default usePersistentState;
