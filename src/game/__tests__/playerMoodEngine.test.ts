// ============================================================================
// PLAYER MOOD ENGINE - 30 SCENARIO INTEGRATION TEST
// ----------------------------------------------------------------------------
// Rapidly fires 30 diverse triggers in sequence against a single mood state,
// asserting each transition the engine should produce. This verifies:
//   - Every trigger kind drives a sensible mood
//   - Priorities correctly override or yield to the current mood
//   - Decay collapses to neutral over time
//   - Narrative text inference picks the dominant mood
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  applyTrigger,
  inferMoodFromText,
  evaluateTrigger,
  type MoodEvalContext,
  type MoodSnapshot,
  type MoodTrigger,
} from '../playerMoodEngine';
import type { CoreMoodType } from '../moodSystem';

interface Step {
  label: string;
  trigger: MoodTrigger;
  ticks?: number; // ticks since last change, default 1
  expect: CoreMoodType | 'unchanged';
}

// 30 rapid-fire scenarios covering every trigger kind and the priority/decay
// interactions between them.
const SCENARIOS: Step[] = [
  // 1-5: combat ramp-up
  { label: 'first scratch',           trigger: { kind: 'damage_received', amount: 5,  healthAfter: 95, healthMax: 100 }, expect: 'annoyed' },
  { label: 'big hit -> mad',          trigger: { kind: 'damage_received', amount: 30, healthAfter: 65, healthMax: 100 }, expect: 'mad' },
  { label: 'severely wounded',        trigger: { kind: 'damage_received', amount: 35, healthAfter: 30, healthMax: 100 }, expect: 'fearful' },
  { label: 'critical wound',          trigger: { kind: 'damage_received', amount: 20, healthAfter: 10, healthMax: 100 }, expect: 'fearful' },
  { label: 'flawless win after fear', trigger: { kind: 'combat_won', flawless: true }, expect: 'happy' },

  // 6-10: social
  { label: 'compliment',              trigger: { kind: 'compliment' }, expect: 'unchanged' /* already happy */ },
  { label: 'insult bounces off happy',trigger: { kind: 'insult' }, expect: 'unchanged' },
  { label: 'betrayal overrides all',  trigger: { kind: 'betrayal' }, expect: 'mad' },
  { label: 'romance after rage',      trigger: { kind: 'romance_progressed' }, expect: 'lusty' },
  { label: 'favor received',          trigger: { kind: 'favor_received' }, ticks: 6, expect: 'happy' },

  // 11-15: quests / loot
  { label: 'minor quest complete',    trigger: { kind: 'quest_completed', difficulty: 'minor' }, expect: 'determined' },
  { label: 'major quest complete',    trigger: { kind: 'quest_completed', difficulty: 'major' }, expect: 'happy' },
  { label: 'quest failed',            trigger: { kind: 'quest_failed' }, expect: 'depressed' },
  { label: 'legendary loot lifts',    trigger: { kind: 'legendary_loot' }, expect: 'happy' },
  { label: 'rare loot keeps happy',   trigger: { kind: 'rare_loot' }, expect: 'unchanged' },

  // 16-20: equipment & needs
  { label: 'weapon jam',              trigger: { kind: 'weapon_jam' }, ticks: 5, expect: 'annoyed' },
  { label: 'weapon destroyed',        trigger: { kind: 'weapon_destroyed' }, expect: 'mad' },
  { label: 'need low (thirst)',       trigger: { kind: 'need_low', need: 'thirst' }, expect: 'unchanged' /* mad outranks */ },
  { label: 'need critical (hunger)',  trigger: { kind: 'need_critical', need: 'hunger' }, ticks: 4, expect: 'fearful' },
  { label: 'healed up fully',         trigger: { kind: 'healed', amount: 80, healthAfter: 100, healthMax: 100 }, ticks: 8, expect: 'happy' },

  // 21-25: knowledge / reputation / relationships
  { label: 'revelation -> suspicious', trigger: { kind: 'revelation' }, expect: 'suspicious' },
  { label: 'trust dropped sharply',    trigger: { kind: 'trust_changed', delta: -50 }, expect: 'unchanged' /* same mood, refresh */ },
  { label: 'relationship damaged',     trigger: { kind: 'relationship_changed', delta: -30 }, ticks: 8, expect: 'sad' },
  { label: 'reputation rose',          trigger: { kind: 'reputation_changed', delta: 15 }, ticks: 8, expect: 'determined' },
  { label: 'compliment after grind',   trigger: { kind: 'compliment' }, ticks: 8, expect: 'happy' },

  // 26-30: narrative inference, stats, near-death cascade, decay
  { label: 'narrative cue: dread',    trigger: { kind: 'narrative_text', text: 'A wave of terror floods you. Cold sweat beads on your forehead as the shadow looms.' }, ticks: 8, expect: 'fearful' },
  { label: 'narrative cue: triumph',  trigger: { kind: 'narrative_text', text: 'Joy and elation burst through your chest — you grin and rejoice in the celebration.' }, ticks: 2, expect: 'unchanged' /* score not enough to beat fearful residual */ },
  { label: 'near death',              trigger: { kind: 'near_death', healthRatio: 0.08 }, expect: 'fearful' },
  { label: 'death',                   trigger: { kind: 'death' }, expect: 'depressed' },
  { label: 'tick decay to neutral',   trigger: { kind: 'tick_decay', ticksElapsed: 30 }, expect: 'neutral' },
];

describe('playerMoodEngine - 30 rapid-fire scenarios', () => {
  it('runs 30 diverse triggers and produces coherent mood transitions', () => {
    const ctx: MoodEvalContext = {
      currentMood: 'neutral',
      currentIntensity: 0,
      ticksSinceChange: 0,
    };

    const transitions: Array<{
      step: number;
      label: string;
      from: CoreMoodType;
      to: CoreMoodType;
      intensity: number;
      reason: string;
    }> = [];

    SCENARIOS.forEach((step, idx) => {
      ctx.ticksSinceChange = step.ticks ?? 1;
      const snap: MoodSnapshot | null = applyTrigger(ctx, step.trigger);

      const expected = step.expect;
      if (expected === 'unchanged') {
        expect(snap, `Step ${idx + 1} (${step.label}) should be unchanged but got ${snap?.mood}`).toBeNull();
      } else {
        expect(snap, `Step ${idx + 1} (${step.label}) should produce a snapshot`).not.toBeNull();
        expect(snap!.mood, `Step ${idx + 1} (${step.label})`).toBe(expected);
        expect(snap!.intensity).toBeGreaterThanOrEqual(0);
        expect(snap!.intensity).toBeLessThanOrEqual(1);
        transitions.push({
          step: idx + 1,
          label: step.label,
          from: ctx.currentMood,
          to: snap!.mood,
          intensity: Number(snap!.intensity.toFixed(2)),
          reason: snap!.reason,
        });
        ctx.currentMood = snap!.mood;
        ctx.currentIntensity = snap!.intensity;
        ctx.ticksSinceChange = 0;
      }
    });

    // Sanity: we ran all 30, and at least 20 produced real transitions
    expect(SCENARIOS).toHaveLength(30);
    expect(transitions.length).toBeGreaterThanOrEqual(20);

    // Final state must be neutral (decay scenario closes the run)
    expect(ctx.currentMood).toBe('neutral');
  });
});

describe('playerMoodEngine - text inference', () => {
  const cases: Array<{ text: string; mood: CoreMoodType }> = [
    { text: 'fury and rage burn through you, vengeance promised',         mood: 'mad' },
    { text: 'terror grips you, your spine chills, you tremble',           mood: 'fearful' },
    { text: 'joy and delight fill the room, easy laughter rises',         mood: 'happy' },
    { text: 'hollow ache, leaden bones, nothing matters anymore',         mood: 'depressed' },
    { text: 'grief weighs on you, sorrow mounts, mournful silence',       mood: 'sad' },
    { text: 'resolute, unwavering, iron will sets your jaw',              mood: 'determined' },
    { text: 'desire rises, tender warmth, a magnetic pull',               mood: 'lusty' },
    { text: 'wary, guarded, scrutinizing every false smile',              mood: 'suspicious' },
    { text: 'grinding restraint, clipped tone, forced smile',             mood: 'annoyed' },
  ];

  for (const { text, mood } of cases) {
    it(`infers ${mood} from anchored prose`, () => {
      const result = inferMoodFromText(text);
      expect(result).not.toBeNull();
      expect(result!.mood).toBe(mood);
      expect(result!.score).toBeGreaterThan(0);
    });
  }

  it('returns null for empty or anchor-less prose', () => {
    expect(inferMoodFromText('')).toBeNull();
    expect(inferMoodFromText('the cat sat on the mat')).toBeNull();
  });
});

describe('playerMoodEngine - priority rules', () => {
  it('betrayal overrides a strong happy mood', () => {
    const ctx: MoodEvalContext = { currentMood: 'happy', currentIntensity: 0.9, ticksSinceChange: 0 };
    const snap = applyTrigger(ctx, { kind: 'betrayal' });
    expect(snap?.mood).toBe('mad');
  });

  it('low-priority trigger does not override fresh high-intensity mood', () => {
    const ctx: MoodEvalContext = { currentMood: 'fearful', currentIntensity: 0.95, ticksSinceChange: 0 };
    const snap = applyTrigger(ctx, { kind: 'reputation_changed', delta: 10 });
    expect(snap).toBeNull();
  });

  it('decay collapses to neutral after long inactivity', () => {
    const ctx: MoodEvalContext = { currentMood: 'mad', currentIntensity: 0.5, ticksSinceChange: 0 };
    const snap = applyTrigger(ctx, { kind: 'tick_decay', ticksElapsed: 20 });
    expect(snap?.mood).toBe('neutral');
  });

  it('decay is no-op when already neutral', () => {
    const ctx: MoodEvalContext = { currentMood: 'neutral', currentIntensity: 0, ticksSinceChange: 0 };
    expect(applyTrigger(ctx, { kind: 'tick_decay', ticksElapsed: 50 })).toBeNull();
  });

  it('evaluateTrigger returns a candidate for every non-decay kind', () => {
    const samples: MoodTrigger[] = [
      { kind: 'damage_received', amount: 10, healthAfter: 80, healthMax: 100 },
      { kind: 'damage_dealt', amount: 10 },
      { kind: 'wound_inflicted', severity: 'major' },
      { kind: 'near_death', healthRatio: 0.05 },
      { kind: 'death' },
      { kind: 'knockout' },
      { kind: 'healed', amount: 40, healthAfter: 90, healthMax: 100 },
      { kind: 'combat_won' },
      { kind: 'combat_fled' },
      { kind: 'combat_deescalated' },
      { kind: 'betrayal' },
      { kind: 'insult' },
      { kind: 'compliment' },
      { kind: 'romance_progressed' },
      { kind: 'favor_received' },
      { kind: 'quest_completed', difficulty: 'major' },
      { kind: 'quest_failed' },
      { kind: 'rare_loot' },
      { kind: 'legendary_loot' },
      { kind: 'item_stolen' },
      { kind: 'weapon_jam' },
      { kind: 'weapon_destroyed' },
      { kind: 'need_critical', need: 'water' },
      { kind: 'need_low', need: 'food' },
      { kind: 'revelation' },
      { kind: 'secret_shared' },
    ];
    for (const s of samples) {
      expect(evaluateTrigger(s), `kind=${s.kind}`).not.toBeNull();
    }
  });
});
