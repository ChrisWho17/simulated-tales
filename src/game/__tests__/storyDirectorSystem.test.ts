import { describe, it, expect } from 'vitest';
import {
  createDirectorState,
  evaluateDirectorTrigger,
  validateDirectorBrief,
  recordTurn,
  retrieveRelevantMemories,
} from '@/game/storyDirectorSystem';

const baseState = () => createDirectorState('openai/gpt-5.5', 'openai/gpt-5.6-sol');

describe('director triggers', () => {
  it('runs world-generation when no brief exists yet', () => {
    expect(evaluateDirectorTrigger(baseState(), 'normal')).toBe('world-generation');
  });

  it('does not run on ordinary turns once a brief exists', () => {
    const state = { ...baseState(), currentDirectorBrief: { storyObjective: 'x' } as never };
    expect(evaluateDirectorTrigger(state, 'normal')).toBeNull();
  });

  it('runs on meaningful events', () => {
    const state = { ...baseState(), currentDirectorBrief: { storyObjective: 'x' } as never };
    expect(evaluateDirectorTrigger(state, 'normal', { questChanged: true })).toBe('quest-change');
    expect(evaluateDirectorTrigger(state, 'normal', { npcIntroduced: true })).toBe(
      'npc-major-change'
    );
    expect(evaluateDirectorTrigger(state, 'off', { manual: true })).toBe('manual');
  });
});

describe('brief validation', () => {
  it('rejects empty payloads and stamps a version', () => {
    expect(validateDirectorBrief(null, 'm', 'manual')).toBeNull();
    expect(validateDirectorBrief({ tension: 3 }, 'm', 'manual')).toBeNull();
    const brief = validateDirectorBrief(
      { storyObjective: 'Find the relic', tension: 42, unresolvedThreads: ['who lied?'] },
      'openai/gpt-5.6-sol',
      'interval',
      7
    );
    expect(brief?.version).toBe(7);
    expect(brief?.tension).toBe(10);
  });
});

describe('memory', () => {
  it('compacts recent events and retrieves relevant memories', () => {
    let state = baseState();
    for (let i = 0; i < 9; i++) {
      state = recordTurn(state, `action ${i}`, `The smuggler Kessa reveals a hidden harbor tunnel. `.repeat(4));
    }
    expect(state.turnCount).toBe(9);
    expect(state.longTermMemories.length).toBeGreaterThan(0);
    const hits = retrieveRelevantMemories(state.longTermMemories, 'Kessa harbor tunnel');
    expect(hits.length).toBeGreaterThan(0);
  });
});
