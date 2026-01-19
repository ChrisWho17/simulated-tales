// ============================================================================
// STATE SYNC BUS - Centralized pub/sub for cross-context state synchronization
// Phase 2 of hardening: Single source of truth for state change events
// ============================================================================

import { DirectorSettings } from '@/game/directorModeSystem';
import { CampaignData } from '@/types/campaign';

// ============================================================================
// EVENT TYPES
// ============================================================================

export type SyncEventType =
  | 'campaign:loaded'
  | 'campaign:saved'
  | 'campaign:deleted'
  | 'campaign:settings-changed'
  | 'settings:director-updated'
  | 'settings:global-updated'
  | 'player:state-changed'
  | 'storage:quota-warning'
  | 'storage:cleanup-needed'
  | 'sync:conflict-detected'
  | 'sync:cloud-synced'
  | 'error:save-failed'
  | 'error:load-failed';

export interface SyncEventPayloads {
  'campaign:loaded': {
    campaignId: string;
    campaignName: string;
    directorSettings?: DirectorSettings;
  };
  'campaign:saved': {
    campaignId: string;
    timestamp: number;
    syncedToCloud: boolean;
  };
  'campaign:deleted': {
    campaignId: string;
  };
  'campaign:settings-changed': {
    campaignId: string;
    settings: CampaignData['settings'];
  };
  'settings:director-updated': {
    directorSettings: DirectorSettings;
    source: 'campaign' | 'global' | 'user';
  };
  'settings:global-updated': {
    changes: Record<string, unknown>;
  };
  'player:state-changed': {
    playerId?: string;
    changes: Record<string, unknown>;
  };
  'storage:quota-warning': {
    usedBytes: number;
    totalBytes: number;
    percentUsed: number;
  };
  'storage:cleanup-needed': {
    reason: string;
  };
  'sync:conflict-detected': {
    campaignId: string;
    localVersion: number;
    cloudVersion: number;
  };
  'sync:cloud-synced': {
    campaignId: string;
    timestamp: number;
  };
  'error:save-failed': {
    campaignId: string;
    error: string;
    recoverable: boolean;
  };
  'error:load-failed': {
    campaignId: string;
    error: string;
    fallbackUsed: boolean;
  };
}

export interface SyncEvent<T extends SyncEventType = SyncEventType> {
  type: T;
  payload: SyncEventPayloads[T];
  timestamp: number;
  source: string;
}

type Callback<T extends SyncEventType> = (event: SyncEvent<T>) => void;
type Unsubscribe = () => void;

// ============================================================================
// STATE SYNC BUS IMPLEMENTATION
// ============================================================================

class StateSyncBusClass {
  private static instance: StateSyncBusClass;
  
  private subscribers: Map<SyncEventType, Set<Callback<any>>> = new Map();
  private globalSubscribers: Set<Callback<any>> = new Set();
  private eventHistory: SyncEvent[] = [];
  private maxHistorySize = 100;
  
  // Deduplication: prevent rapid-fire duplicate events
  private lastEvents: Map<string, number> = new Map();
  private dedupeWindowMs = 50;
  
  static getInstance(): StateSyncBusClass {
    if (!StateSyncBusClass.instance) {
      StateSyncBusClass.instance = new StateSyncBusClass();
    }
    return StateSyncBusClass.instance;
  }
  
  // ============================================================================
  // EMIT
  // ============================================================================
  
  emit<T extends SyncEventType>(
    type: T,
    payload: SyncEventPayloads[T],
    source: string = 'unknown'
  ): void {
    // Dedupe rapid-fire events
    const eventKey = `${type}:${JSON.stringify(payload)}`;
    const lastEmit = this.lastEvents.get(eventKey);
    const now = Date.now();
    
    if (lastEmit && now - lastEmit < this.dedupeWindowMs) {
      console.log(`[StateSyncBus] Deduped rapid event: ${type}`);
      return;
    }
    this.lastEvents.set(eventKey, now);
    
    // Create event
    const event: SyncEvent<T> = {
      type,
      payload,
      timestamp: now,
      source,
    };
    
    // Log
    console.log(`[StateSyncBus] Emit: ${type}`, payload);
    
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Notify type-specific subscribers
    const typeSubscribers = this.subscribers.get(type);
    if (typeSubscribers) {
      typeSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[StateSyncBus] Subscriber error for ${type}:`, error);
        }
      });
    }
    
    // Notify global subscribers
    this.globalSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[StateSyncBus] Global subscriber error:`, error);
      }
    });
    
    // Also dispatch as CustomEvent for legacy compatibility
    try {
      window.dispatchEvent(new CustomEvent(`state-sync:${type}`, {
        detail: event,
      }));
    } catch (e) {
      // Ignore if window not available (SSR)
    }
  }
  
  // ============================================================================
  // SUBSCRIBE
  // ============================================================================
  
  subscribe<T extends SyncEventType>(
    type: T,
    callback: Callback<T>
  ): Unsubscribe {
    let typeSubscribers = this.subscribers.get(type);
    if (!typeSubscribers) {
      typeSubscribers = new Set();
      this.subscribers.set(type, typeSubscribers);
    }
    
    typeSubscribers.add(callback);
    
    return () => {
      typeSubscribers?.delete(callback);
    };
  }
  
  /**
   * Subscribe to all events
   */
  subscribeAll(callback: Callback<SyncEventType>): Unsubscribe {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }
  
  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  /**
   * Get recent event history (for debugging)
   */
  getHistory(count: number = 20): SyncEvent[] {
    return this.eventHistory.slice(-count);
  }
  
  /**
   * Get last event of a specific type
   */
  getLastEvent<T extends SyncEventType>(type: T): SyncEvent<T> | null {
    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      if (this.eventHistory[i].type === type) {
        return this.eventHistory[i] as SyncEvent<T>;
      }
    }
    return null;
  }
  
  /**
   * Clear event history (for testing)
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.lastEvents.clear();
  }
  
  /**
   * Get subscriber counts (for debugging)
   */
  getSubscriberCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      global: this.globalSubscribers.size,
    };
    this.subscribers.forEach((subs, type) => {
      counts[type] = subs.size;
    });
    return counts;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const StateSyncBus = StateSyncBusClass.getInstance();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useState, useCallback } from 'react';

/**
 * React hook to subscribe to specific sync events
 */
export function useStateSyncSubscription<T extends SyncEventType>(
  type: T,
  callback: Callback<T>
): void {
  useEffect(() => {
    return StateSyncBus.subscribe(type, callback);
  }, [type, callback]);
}

/**
 * React hook to get the last event of a type
 */
export function useLastSyncEvent<T extends SyncEventType>(
  type: T
): SyncEvent<T> | null {
  const [lastEvent, setLastEvent] = useState<SyncEvent<T> | null>(
    () => StateSyncBus.getLastEvent(type)
  );
  
  useEffect(() => {
    return StateSyncBus.subscribe(type, (event) => {
      setLastEvent(event);
    });
  }, [type]);
  
  return lastEvent;
}

/**
 * React hook to emit events
 */
export function useStateSyncEmit() {
  return useCallback(<T extends SyncEventType>(
    type: T,
    payload: SyncEventPayloads[T],
    source: string = 'hook'
  ) => {
    StateSyncBus.emit(type, payload, source);
  }, []);
}

console.log('[StateSyncBus] Centralized state synchronization bus initialized');
