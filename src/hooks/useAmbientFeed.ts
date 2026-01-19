/**
 * useAmbientFeed - Hook to manage the ambient feed with NPC chatter and micro-events
 * 
 * Connects to:
 * - NPC Chatter System (background conversations)
 * - Micro-Event System (world flavor moments)
 * - Event Bus (for real-time updates)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '@/game/eventBus';
import { 
  getAmbientFeed as getChatterFeed, 
  ChatterBeat,
} from '@/game/npcChatterSystem';
import { 
  MICRO_EVENT_TEMPLATES, 
  MicroEvent 
} from '@/game/microEventSystem';

export interface AmbientEntry {
  id: string;
  text: string;
  type: 'micro_event' | 'chatter';
  category?: string;
  timestamp: number;
  involvedNPCs?: string[];
  containsHook?: boolean;
}

interface UseAmbientFeedOptions {
  enabled?: boolean;
  maxEntries?: number;
  microEventChance?: number; // 0-1, chance to trigger micro-event per tick
}

export function useAmbientFeed(options: UseAmbientFeedOptions = {}) {
  const {
    enabled = true,
    maxEntries = 10,
    microEventChance = 0.15,
  } = options;

  const [entries, setEntries] = useState<AmbientEntry[]>([]);
  const [isActive, setIsActive] = useState(false);
  const lastMicroEventTime = useRef<number>(0);
  const actionCountRef = useRef<number>(0);

  // Convert chatter beat to ambient entry
  const chatterToEntry = useCallback((beat: ChatterBeat): AmbientEntry => ({
    id: beat.id,
    text: beat.text,
    type: 'chatter',
    category: beat.topic,
    timestamp: beat.timestamp,
    involvedNPCs: beat.involvedNPCs,
    containsHook: beat.containsHook,
  }), []);

  // Pick a random micro-event based on conditions
  const pickMicroEvent = useCallback((context?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    isPublicSpace?: boolean;
    isPrivateSpace?: boolean;
    turnsPlayed?: number;
    inCombat?: boolean;
    playerReputation?: number;
  }): MicroEvent | null => {
    const validEvents = MICRO_EVENT_TEMPLATES.filter(event => {
      const c = event.conditions;
      if (!c) return true;

      if (c.timeOfDay && context?.timeOfDay && !c.timeOfDay.includes(context.timeOfDay)) {
        return false;
      }
      if (c.minTurns && (context?.turnsPlayed ?? 0) < c.minTurns) {
        return false;
      }
      if (c.requiresPublicSpace && !context?.isPublicSpace) {
        return false;
      }
      if (c.requiresPrivateSpace && !context?.isPrivateSpace) {
        return false;
      }
      if (c.notDuringCombat && context?.inCombat) {
        return false;
      }
      if (c.playerReputationMin !== undefined && 
          (context?.playerReputation ?? 0) < c.playerReputationMin) {
        return false;
      }
      if (c.playerReputationMax !== undefined && 
          (context?.playerReputation ?? 100) > c.playerReputationMax) {
        return false;
      }

      return true;
    });

    if (validEvents.length === 0) return null;

    // Weighted random selection
    const totalWeight = validEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const event of validEvents) {
      random -= event.weight;
      if (random <= 0) return event;
    }

    return validEvents[0];
  }, []);

  // Add an entry to the feed
  const addEntry = useCallback((entry: AmbientEntry) => {
    setEntries(prev => {
      const updated = [...prev, entry];
      // Trim to max entries
      if (updated.length > maxEntries) {
        return updated.slice(-maxEntries);
      }
      return updated;
    });
  }, [maxEntries]);

  // Add a micro-event
  const addMicroEvent = useCallback((event: MicroEvent) => {
    const entry: AmbientEntry = {
      id: `micro_${event.id}_${Date.now()}`,
      text: event.description,
      type: 'micro_event',
      category: event.category,
      timestamp: Date.now(),
      containsHook: !!event.followUp,
    };
    addEntry(entry);
    lastMicroEventTime.current = Date.now();
  }, [addEntry]);

  // Trigger a potential ambient event (called on player actions)
  const triggerAmbientTick = useCallback((context?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    isPublicSpace?: boolean;
    inCombat?: boolean;
    turnsPlayed?: number;
  }) => {
    if (!enabled) return;

    actionCountRef.current++;

    // Sync chatter feed from the chatter system
    const chatterBeats = getChatterFeed();
    const existingIds = new Set(entries.map(e => e.id));
    
    chatterBeats.forEach(beat => {
      if (!existingIds.has(beat.id)) {
        addEntry(chatterToEntry(beat));
      }
    });

    // Maybe trigger a micro-event (rate limited)
    const timeSinceLastMicro = Date.now() - lastMicroEventTime.current;
    const minMicroEventGap = 60000; // At least 1 minute between micro-events

    if (timeSinceLastMicro > minMicroEventGap && Math.random() < microEventChance) {
      const event = pickMicroEvent({
        timeOfDay: context?.timeOfDay,
        isPublicSpace: context?.isPublicSpace,
        inCombat: context?.inCombat,
        turnsPlayed: context?.turnsPlayed,
      });

      if (event) {
        addMicroEvent(event);
      }
    }
  }, [enabled, entries, addEntry, chatterToEntry, pickMicroEvent, addMicroEvent, microEventChance]);

  // Clear old entries (beyond fade time)
  const cleanupOldEntries = useCallback(() => {
    const fadeTime = 120000; // 2 minutes
    const now = Date.now();
    
    setEntries(prev => prev.filter(entry => now - entry.timestamp < fadeTime));
  }, []);

  // Listen to event bus for game events that should trigger ambient content
  useEffect(() => {
    if (!enabled) return;

    const handleAction = () => {
      setIsActive(true);
    };

    const handleNarrativeGenerated = () => {
      // After narrative, there's a chance for ambient content
      triggerAmbientTick();
    };

    // Subscribe to relevant events (using array format)
    const unsubAction = eventBus.subscribe(['STORY_BEAT'], handleAction);
    const unsubNarrative = eventBus.subscribe(['LOCATION_ENTERED', 'GAME_TICK'], handleNarrativeGenerated);

    return () => {
      unsubAction();
      unsubNarrative();
    };
  }, [enabled, triggerAmbientTick]);

  // Periodic cleanup
  useEffect(() => {
    const cleanup = setInterval(cleanupOldEntries, 30000);
    return () => clearInterval(cleanup);
  }, [cleanupOldEntries]);

  // Add a custom ambient message (for systems to inject content)
  const addCustomAmbient = useCallback((text: string, type: 'micro_event' | 'chatter' = 'micro_event', category?: string) => {
    addEntry({
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      type,
      category,
      timestamp: Date.now(),
    });
  }, [addEntry]);

  // Clear all entries
  const clearFeed = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    isActive,
    addEntry,
    addMicroEvent,
    addCustomAmbient,
    triggerAmbientTick,
    clearFeed,
    actionCount: actionCountRef.current,
  };
}

export default useAmbientFeed;
