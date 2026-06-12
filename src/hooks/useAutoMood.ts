// ============================================================================
// useAutoMood
// ----------------------------------------------------------------------------
// Subscribes to EventBus events, watches new narrative text, and feeds them
// to the pure `playerMoodEngine` to keep `currentMood` in sync automatically.
// Disabled when the player has `manualMoodControl` turned on or when the
// mood system itself is disabled.
// ============================================================================

import { useEffect, useRef } from 'react';
import { eventBus, type GameBusEvent } from '@/game/eventBus';
import {
  applyTrigger,
  type MoodEvalContext,
  type MoodSnapshot,
  type MoodTrigger,
} from '@/game/playerMoodEngine';
import type { CoreMoodType } from '@/game/moodSystem';

interface UseAutoMoodOptions {
  enabled: boolean;                 // mood system on?
  manual: boolean;                  // manual control on? -> we do nothing
  currentMood: CoreMoodType;
  currentIntensity: number;         // 0..1
  currentTick: number;              // game turn / chapter
  storyTail?: { id: string; role: 'user' | 'narrator'; content: string } | null;
  apply: (snap: MoodSnapshot) => void;
}

export function useAutoMood(opts: UseAutoMoodOptions): void {
  const {
    enabled,
    manual,
    currentMood,
    currentIntensity,
    currentTick,
    storyTail,
    apply,
  } = opts;

  const active = enabled && !manual;

  // Keep a live ref of the current mood so EventBus handlers always see the
  // freshest state without re-subscribing on every change.
  const ctxRef = useRef<MoodEvalContext & { lastChangeTick: number }>({
    currentMood,
    currentIntensity,
    ticksSinceChange: 0,
    lastChangeTick: currentTick,
  });

  useEffect(() => {
    const elapsed = Math.max(0, currentTick - ctxRef.current.lastChangeTick);
    ctxRef.current = {
      currentMood,
      currentIntensity,
      ticksSinceChange: elapsed,
      lastChangeTick: ctxRef.current.lastChangeTick,
    };
  }, [currentMood, currentIntensity, currentTick]);

  // ----- Helper: dispatch a trigger and apply if engine returns a snapshot.
  const fire = useRef((trigger: MoodTrigger) => {
    if (!active) return;
    const snap = applyTrigger(ctxRef.current, trigger);
    if (!snap) return;
    ctxRef.current = {
      currentMood: snap.mood,
      currentIntensity: snap.intensity,
      ticksSinceChange: 0,
      lastChangeTick: currentTick,
    };
    apply(snap);
  });
  // Keep the closure fresh for `active`, `apply`, `currentTick`.
  useEffect(() => {
    fire.current = (trigger: MoodTrigger) => {
      if (!active) return;
      const snap = applyTrigger(ctxRef.current, trigger);
      if (!snap) return;
      ctxRef.current = {
        currentMood: snap.mood,
        currentIntensity: snap.intensity,
        ticksSinceChange: 0,
        lastChangeTick: currentTick,
      };
      apply(snap);
    };
  }, [active, apply, currentTick]);

  // ----- EventBus subscription -----------------------------------------------
  useEffect(() => {
    if (!active) return;

    const unsub = eventBus.subscribe('*', (event: GameBusEvent) => {
      const trigger = eventToTrigger(event);
      if (trigger) fire.current(trigger);
    }, 0);

    return unsub;
  }, [active]);

  // ----- Narrative text inference --------------------------------------------
  const lastSeenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !storyTail) return;
    if (storyTail.role !== 'narrator') return;
    if (storyTail.id === lastSeenIdRef.current) return;
    lastSeenIdRef.current = storyTail.id;
    // Strip mechanic tags before inference so brackets don't pollute scores.
    const cleaned = storyTail.content.replace(/\[[A-Z_]+:[^\]]*\]/g, ' ');
    fire.current({ kind: 'narrative_text', text: cleaned });
  }, [active, storyTail]);

  // ----- Tick decay ----------------------------------------------------------
  useEffect(() => {
    if (!active) return;
    const elapsed = currentTick - ctxRef.current.lastChangeTick;
    if (elapsed >= 6) {
      fire.current({ kind: 'tick_decay', ticksElapsed: elapsed });
    }
  }, [active, currentTick]);
}

// ============================================================================
// EVENT -> TRIGGER MAPPING
// ============================================================================

function eventToTrigger(event: GameBusEvent): MoodTrigger | null {
  switch (event.type) {
    case 'DAMAGE_RECEIVED': {
      const d = (event as any).data ?? {};
      const amount = Number(d.amount ?? 0);
      const healthAfter = Number(d.healthAfter ?? d.newValue ?? 0);
      const healthMax = Number(d.healthMax ?? d.maxValue ?? 100);
      if (!isFinite(amount) || amount <= 0) return null;
      return { kind: 'damage_received', amount, healthAfter, healthMax };
    }
    case 'DAMAGE_DEALT': {
      const amount = Number((event as any).data?.amount ?? 0);
      if (amount <= 0) return null;
      return { kind: 'damage_dealt', amount };
    }
    case 'WOUND_INFLICTED': {
      const sev = ((event as any).data?.woundType ?? 'minor').toString().toLowerCase();
      const severity: 'minor' | 'major' | 'critical' =
        sev.includes('critical') || sev.includes('severe') ? 'critical'
        : sev.includes('major') || sev.includes('deep') ? 'major'
        : 'minor';
      return { kind: 'wound_inflicted', severity };
    }
    case 'DEATH':       return { kind: 'death' };
    case 'KNOCKOUT':    return { kind: 'knockout' };
    case 'COMBAT_WON': {
      const flawless = !!(event as any).data?.flawlessVictory;
      return { kind: 'combat_won', flawless };
    }
    case 'COMBAT_FLED':         return { kind: 'combat_fled' };
    case 'COMBAT_DEESCALATED':  return { kind: 'combat_deescalated' };
    case 'BETRAYAL':            return { kind: 'betrayal' };
    case 'INSULT':              return { kind: 'insult' };
    case 'COMPLIMENT':          return { kind: 'compliment' };
    case 'ROMANCE_PROGRESSED':  return { kind: 'romance_progressed' };
    case 'FAVOR':               return { kind: 'favor_received' };
    case 'TRUST_CHANGED': {
      const delta = Number((event as any).data?.delta ?? 0);
      if (!delta) return null;
      return { kind: 'trust_changed', delta };
    }
    case 'RELATIONSHIP_CHANGED': {
      const delta = Number((event as any).data?.delta ?? 0);
      if (!delta) return null;
      return { kind: 'relationship_changed', delta };
    }
    case 'QUEST_COMPLETED': {
      const reason = ((event as any).data?.reason ?? '').toString().toLowerCase();
      const difficulty = reason.includes('major') || reason.includes('main') ? 'major' : 'minor';
      return { kind: 'quest_completed', difficulty };
    }
    case 'QUEST_FAILED':        return { kind: 'quest_failed' };
    case 'RARE_ITEM_FOUND':     return { kind: 'rare_loot' };
    case 'LEGENDARY_ITEM_FOUND':return { kind: 'legendary_loot' };
    case 'ITEM_STOLEN': {
      const from = (event as any).data?.fromEntity;
      if (from === 'player' || from === 'character') {
        return { kind: 'item_stolen' };
      }
      return null;
    }
    case 'WEAPON_JAM':          return { kind: 'weapon_jam' };
    case 'WEAPON_DESTROYED':    return { kind: 'weapon_destroyed' };
    case 'NEED_CRITICAL':       return { kind: 'need_critical', need: (event as any).data?.need ?? 'unknown' };
    case 'NEED_LOW':            return { kind: 'need_low',      need: (event as any).data?.need ?? 'unknown' };
    case 'REVELATION':          return { kind: 'revelation' };
    case 'SECRET_SHARED':       return { kind: 'secret_shared' };
    case 'REPUTATION_CHANGED':
    case 'FACTION_STANDING_CHANGED':
    case 'FACTION_REPUTATION_CHANGED': {
      const d = (event as any).data ?? {};
      const delta = Number(d.newValue ?? 0) - Number(d.previousValue ?? 0);
      if (!delta) return null;
      return { kind: 'reputation_changed', delta };
    }
    default:
      return null;
  }
}
