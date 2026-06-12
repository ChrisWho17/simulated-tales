// ============================================================================
// PLAYER MOOD ENGINE
// ----------------------------------------------------------------------------
// Pure-function mood evaluator. The hook layer feeds it semantic triggers
// (combat outcomes, relationship shifts, narrative text, raw stats, time
// decay) and the engine returns the next `MoodSnapshot` to apply — or `null`
// when no change is warranted.
//
// Designed to be:
//   - Deterministic (no `Math.random`, no `Date.now`)
//   - Fully testable (see `__tests__/playerMoodEngine.test.ts`)
//   - Decoupled from React, EventBus and gameSettings
// ============================================================================

import { CoreMoodType, MOOD_ANCHORS, deriveMoodFromStats } from './moodSystem';

// ============= TRIGGER TYPES =============

export type MoodTrigger =
  // Combat & damage
  | { kind: 'damage_received'; amount: number; healthAfter: number; healthMax: number }
  | { kind: 'damage_dealt'; amount: number }
  | { kind: 'wound_inflicted'; severity?: 'minor' | 'major' | 'critical' }
  | { kind: 'near_death'; healthRatio: number }
  | { kind: 'death' }
  | { kind: 'knockout' }
  | { kind: 'healed'; amount: number; healthAfter: number; healthMax: number }
  | { kind: 'combat_won'; flawless?: boolean }
  | { kind: 'combat_fled' }
  | { kind: 'combat_deescalated' }
  // Social & relationship
  | { kind: 'betrayal' }
  | { kind: 'insult' }
  | { kind: 'compliment' }
  | { kind: 'romance_progressed' }
  | { kind: 'favor_received' }
  | { kind: 'trust_changed'; delta: number }
  | { kind: 'relationship_changed'; delta: number }
  // Story / quests / loot
  | { kind: 'quest_completed'; difficulty?: 'minor' | 'major' }
  | { kind: 'quest_failed' }
  | { kind: 'rare_loot' }
  | { kind: 'legendary_loot' }
  | { kind: 'item_stolen' }
  // Equipment problems
  | { kind: 'weapon_jam' }
  | { kind: 'weapon_destroyed' }
  // Needs
  | { kind: 'need_critical'; need: string }
  | { kind: 'need_low'; need: string }
  // Knowledge
  | { kind: 'revelation' }
  | { kind: 'secret_shared' }
  // Reputation
  | { kind: 'reputation_changed'; delta: number }
  // Narrative inference
  | { kind: 'narrative_text'; text: string }
  // Passive derivations
  | { kind: 'stat_derived'; stats: Parameters<typeof deriveMoodFromStats>[0] }
  | { kind: 'tick_decay'; ticksElapsed: number };

export interface MoodSnapshot {
  mood: CoreMoodType;
  intensity: number; // 0..1
  reason: string;
  trigger: string;
}

export interface MoodEvalContext {
  currentMood: CoreMoodType;
  currentIntensity: number; // 0..1
  ticksSinceChange: number; // game ticks (or turns) since last update
}

// ============= PRIORITY TIERS =============
// Higher priority candidates can override the existing mood floor.

const PRI_DEATH = 10;
const PRI_HIGH = 9;
const PRI_COMBAT = 8;
const PRI_EMOTIONAL = 7;
const PRI_MEDIUM = 5;
const PRI_LOW = 3;
const PRI_DECAY = 1;

// Decay rate per tick (intensity points lost per tick of inactivity)
const DECAY_PER_TICK = 0.08;
// Intensity floor below which we collapse to neutral
const NEUTRAL_COLLAPSE = 0.15;

interface Candidate {
  mood: CoreMoodType;
  intensity: number;
  priority: number;
  reason: string;
  trigger: string;
}

function c(
  mood: CoreMoodType,
  intensity: number,
  priority: number,
  reason: string,
  trigger: string,
): Candidate {
  return { mood, intensity: clamp01(intensity), priority, reason, trigger };
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// ============= TRIGGER EVALUATION =============

export function evaluateTrigger(t: MoodTrigger): Candidate | null {
  switch (t.kind) {
    case 'death':
      return c('depressed', 1, PRI_DEATH, 'death', t.kind);
    case 'near_death':
      return c('fearful', 0.95, PRI_HIGH, `near death (${Math.round(t.healthRatio * 100)}% hp)`, t.kind);
    case 'knockout':
      return c('fearful', 0.85, PRI_HIGH, 'knocked unconscious', t.kind);

    case 'damage_received': {
      const max = Math.max(1, t.healthMax);
      const ratio = t.healthAfter / max;
      const dmgRatio = t.amount / max;
      if (ratio < 0.15) return c('fearful', 0.95, PRI_HIGH, 'critically wounded', t.kind);
      if (ratio < 0.35) return c('fearful', 0.75, PRI_COMBAT, 'severely wounded', t.kind);
      if (dmgRatio > 0.25) return c('mad', 0.7, PRI_COMBAT, 'heavy hit', t.kind);
      return c('annoyed', 0.5, PRI_MEDIUM, 'took a hit', t.kind);
    }

    case 'damage_dealt':
      return c('determined', 0.55, PRI_MEDIUM, 'striking back', t.kind);

    case 'wound_inflicted': {
      const sev = t.severity ?? 'minor';
      if (sev === 'critical') return c('fearful', 0.9, PRI_HIGH, 'critical wound', t.kind);
      if (sev === 'major') return c('mad', 0.75, PRI_COMBAT, 'major wound', t.kind);
      return c('annoyed', 0.5, PRI_MEDIUM, 'minor wound', t.kind);
    }

    case 'healed': {
      const max = Math.max(1, t.healthMax);
      const ratio = t.healthAfter / max;
      if (ratio > 0.8 && t.amount > max * 0.3) {
        return c('happy', 0.7, PRI_MEDIUM, 'fully patched up', t.kind);
      }
      return c('determined', 0.55, PRI_MEDIUM, 'wounds tended', t.kind);
    }

    case 'combat_won':
      return t.flawless
        ? c('happy', 0.85, PRI_COMBAT, 'flawless victory', t.kind)
        : c('determined', 0.75, PRI_COMBAT, 'victorious', t.kind);
    case 'combat_fled':
      return c('fearful', 0.7, PRI_COMBAT, 'fled combat', t.kind);
    case 'combat_deescalated':
      return c('determined', 0.55, PRI_MEDIUM, 'defused the fight', t.kind);

    case 'betrayal':
      return c('mad', 0.95, PRI_DEATH - 1, 'betrayed', t.kind);
    case 'insult':
      return c('annoyed', 0.65, PRI_MEDIUM, 'insulted', t.kind);
    case 'compliment':
      return c('happy', 0.55, PRI_MEDIUM, 'complimented', t.kind);
    case 'romance_progressed':
      return c('lusty', 0.75, PRI_EMOTIONAL, 'romantic moment', t.kind);
    case 'favor_received':
      return c('happy', 0.5, PRI_MEDIUM, 'received a favor', t.kind);

    case 'trust_changed':
      if (t.delta < 0) {
        const intensity = clamp01(0.4 + Math.abs(t.delta) / 100);
        return c('suspicious', intensity, PRI_MEDIUM, 'trust eroded', t.kind);
      }
      if (t.delta > 0) {
        const intensity = clamp01(0.4 + t.delta / 100);
        return c('happy', Math.min(intensity, 0.7), PRI_LOW, 'trust grew', t.kind);
      }
      return null;

    case 'relationship_changed':
      if (t.delta <= -20) return c('sad', 0.65, PRI_MEDIUM, 'relationship damaged', t.kind);
      if (t.delta >= 20) return c('happy', 0.6, PRI_LOW, 'relationship strengthened', t.kind);
      return null;

    case 'quest_completed':
      return t.difficulty === 'major'
        ? c('happy', 0.85, PRI_EMOTIONAL, 'major quest complete', t.kind)
        : c('determined', 0.65, PRI_MEDIUM, 'quest complete', t.kind);
    case 'quest_failed':
      return c('depressed', 0.7, PRI_EMOTIONAL, 'quest failed', t.kind);

    case 'rare_loot':
      return c('happy', 0.7, PRI_MEDIUM, 'rare loot', t.kind);
    case 'legendary_loot':
      return c('happy', 0.95, PRI_EMOTIONAL, 'legendary find', t.kind);
    case 'item_stolen':
      return c('mad', 0.7, PRI_MEDIUM, 'item stolen', t.kind);

    case 'weapon_jam':
      return c('annoyed', 0.7, PRI_MEDIUM, 'weapon jammed', t.kind);
    case 'weapon_destroyed':
      return c('mad', 0.75, PRI_COMBAT, 'weapon destroyed', t.kind);

    case 'need_critical':
      return c('fearful', 0.7, PRI_COMBAT, `${t.need} critical`, t.kind);
    case 'need_low':
      return c('annoyed', 0.45, PRI_LOW, `${t.need} low`, t.kind);

    case 'revelation':
      return c('suspicious', 0.7, PRI_MEDIUM, 'sudden revelation', t.kind);
    case 'secret_shared':
      return c('suspicious', 0.55, PRI_LOW, 'secret shared', t.kind);

    case 'reputation_changed':
      if (t.delta < 0) return c('annoyed', 0.55, PRI_LOW, 'reputation slipped', t.kind);
      if (t.delta > 0) return c('determined', 0.55, PRI_LOW, 'reputation rose', t.kind);
      return null;

    case 'narrative_text': {
      const inferred = inferMoodFromText(t.text);
      if (!inferred) return null;
      // Score → intensity (each anchor hit adds ~0.1 intensity, capped).
      const intensity = clamp01(0.4 + inferred.score * 0.1);
      return c(inferred.mood, intensity, PRI_LOW, `narrative cue (${inferred.mood})`, t.kind);
    }

    case 'stat_derived': {
      const mood = deriveMoodFromStats(t.stats);
      if (mood === 'neutral') return null;
      return c(mood, 0.5, PRI_LOW, 'derived from stats', t.kind);
    }

    case 'tick_decay':
      return null; // decay handled in applyTrigger
  }
}

// ============= NARRATIVE TEXT INFERENCE =============

export interface InferenceResult {
  mood: CoreMoodType;
  score: number;
}

const MOOD_KEYS = (Object.keys(MOOD_ANCHORS) as CoreMoodType[]).filter((m) => m !== 'neutral');

export function inferMoodFromText(text: string): InferenceResult | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  const wordSet = new Set(lower.split(/[^a-z]+/).filter(Boolean));
  if (wordSet.size === 0) return null;

  let best: InferenceResult | null = null;
  for (const mood of MOOD_KEYS) {
    const anchors = MOOD_ANCHORS[mood];
    let score = 0;
    for (const w of anchors.nouns) if (wordSet.has(w)) score += 2;
    for (const w of anchors.adjectives) if (wordSet.has(w)) score += 2;
    for (const w of anchors.verbs) if (wordSet.has(w)) score += 1.5;
    for (const p of anchors.phrases) if (lower.includes(p)) score += 3;
    if (score > 0 && (!best || score > best.score)) {
      best = { mood, score };
    }
  }
  return best;
}

// ============= MAIN ENTRY POINT =============

/**
 * Evaluate a trigger against the current mood context.
 * Returns the next snapshot to apply, or `null` if nothing meaningful changed.
 */
export function applyTrigger(
  ctx: MoodEvalContext,
  trigger: MoodTrigger,
): MoodSnapshot | null {
  // Tick decay is a special case.
  if (trigger.kind === 'tick_decay') {
    return decayStep(ctx, trigger.ticksElapsed);
  }

  const candidate = evaluateTrigger(trigger);
  if (!candidate) return null;

  const sameMood = candidate.mood === ctx.currentMood;

  if (sameMood) {
    const intensity = Math.max(ctx.currentIntensity, candidate.intensity);
    if (Math.abs(intensity - ctx.currentIntensity) < 0.05) return null;
    return {
      mood: candidate.mood,
      intensity,
      reason: candidate.reason,
      trigger: candidate.trigger,
    };
  }

  // Different mood — must overcome the current mood's residual intensity
  // (which itself decays over time).
  const residual = Math.max(
    0,
    ctx.currentIntensity - ctx.ticksSinceChange * DECAY_PER_TICK,
  );

  const overrides =
    candidate.priority >= PRI_EMOTIONAL || candidate.intensity >= residual;

  if (!overrides) return null;

  return {
    mood: candidate.mood,
    intensity: candidate.intensity,
    reason: candidate.reason,
    trigger: candidate.trigger,
  };
}

function decayStep(ctx: MoodEvalContext, ticksElapsed: number): MoodSnapshot | null {
  if (ctx.currentMood === 'neutral') return null;
  const next = ctx.currentIntensity - ticksElapsed * DECAY_PER_TICK;
  if (next <= NEUTRAL_COLLAPSE) {
    return {
      mood: 'neutral',
      intensity: 0.3,
      reason: 'mood faded back to neutral',
      trigger: 'tick_decay',
    };
  }
  return null;
}
