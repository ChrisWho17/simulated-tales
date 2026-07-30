import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../npcIdentityRegistry', () => ({
  getAllRegisteredNPCs: vi.fn(() => [
    { permanent: { id: 'npc_vengeful', name: 'Vex' } },
    { permanent: { id: 'npc_forgiving', name: 'Faye' } },
  ]),
}));

vi.mock('../companionSystem', () => ({
  companionSystem: {
    getActiveCompanions: () => [],
    getCompanion: () => undefined,
    getAllCompanions: () => [],
    createCompanion: vi.fn((id: string, name: string) => ({
      id,
      name,
      affinity: 15,
      trust: 40,
      respect: 35,
      status: 'waiting',
    })),
    recruitCompanion: vi.fn(() => ({ success: true, message: 'Joined the party.' })),
    registerCompanion: vi.fn(),
  },
}));

vi.mock('../unifiedRelationshipStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../unifiedRelationshipStore')>();
  return {
    ...actual,
    modifyRelationship: (
      sourceId: string,
      targetId: string,
      changes: Record<string, number>,
      reason: string,
      currentTick: number
    ) => ({
      sourceId,
      targetId,
      metrics: { ...changes },
      status: 'acquaintance',
      firstMet: currentTick,
      lastInteraction: currentTick,
      interactionCount: 1,
      tensionFlags: ['none'] as const,
      significantEvents: [],
    }),
    getPlayerRelationship: () => null,
    getOrCreateRelationship: () => ({
      metrics: {},
      status: 'acquaintance',
    }),
  };
});

import {
  classifyPlayerSocialAct,
  applyPersonalitySocialReactions,
  parseRecruitTags,
  parseRelationshipTags,
  recruitCompanionFromStory,
  applyStoryRelationshipMoments,
} from '../socialReactionSystem';
import { assignPersonalityToNPC, clearPersonalityAssignments } from '../npcPersonalityDialogue';
import { companionSystem } from '../companionSystem';

describe('socialReactionSystem', () => {
  beforeEach(() => {
    clearPersonalityAssignments();
    vi.mocked(companionSystem.createCompanion).mockClear();
    vi.mocked(companionSystem.recruitCompanion).mockClear();
  });

  describe('classifyPlayerSocialAct', () => {
    it('classifies insults, apologies, and kindness', () => {
      expect(classifyPlayerSocialAct('You idiot, get out of my way')).toBe('insult');
      expect(classifyPlayerSocialAct("I'm sorry, that was my fault")).toBe('apology');
      expect(classifyPlayerSocialAct('Are you alright? Let me help')).toBe('kindness');
    });

    it('returns neutral for empty or system actions', () => {
      expect(classifyPlayerSocialAct('')).toBe('neutral');
      expect(classifyPlayerSocialAct('[LOOK_AROUND]')).toBe('neutral');
      expect(classifyPlayerSocialAct('I walk toward the door')).toBe('neutral');
    });
  });

  describe('personality-weighted deltas', () => {
    it('hurts vengeful NPCs harder than forgiving ones on insult', () => {
      assignPersonalityToNPC('npc_vengeful', 'revenge_seeker', 'fantasy');
      assignPersonalityToNPC('npc_forgiving', 'reformed_monster', 'fantasy');

      const batch = applyPersonalitySocialReactions({
        playerAction: 'You are pathetic',
        genre: 'fantasy',
        focusNpc: ['Vex', 'Faye'],
        tick: 1,
      });

      const vex = batch.reactions.find(r => r.npcName === 'Vex');
      const faye = batch.reactions.find(r => r.npcName === 'Faye');
      expect(vex).toBeTruthy();
      expect(faye).toBeTruthy();
      // Vengeful amplifies trust damage; forgiving softens it
      expect(Math.abs(vex!.deltas.trust || 0)).toBeGreaterThan(Math.abs(faye!.deltas.trust || 0));
      expect(batch.promptBlock).toContain('LIVE SOCIAL REACTIONS');
      expect(batch.promptBlock).toContain('insult');
    });
  });

  describe('parseRecruitTags', () => {
    it('parses RECRUIT and COMPANION_JOIN tags', () => {
      const text =
        'She nods. [RECRUIT:Elena] Later Marcus steps forward. [COMPANION_JOIN:Marcus:He will see this through]';
      expect(parseRecruitTags(text)).toEqual(['Elena', 'Marcus']);
    });

    it('dedupes names', () => {
      expect(parseRecruitTags('[RECRUIT:Elena] [COMPANION_JOIN:Elena]')).toEqual(['Elena']);
    });
  });

  describe('parseRelationshipTags', () => {
    it('parses RELATIONSHIP moments', () => {
      const moments = parseRelationshipTags(
        '[RELATIONSHIP:Elena:first_flirt:She laughed at your witty remark]'
      );
      expect(moments).toEqual([
        {
          npcName: 'Elena',
          momentType: 'first_flirt',
          description: 'She laughed at your witty remark',
        },
      ]);
    });
  });

  describe('recruitCompanionFromStory', () => {
    it('creates then recruits a story companion', () => {
      const result = recruitCompanionFromStory({
        name: 'Elena',
        genre: 'fantasy',
        reason: 'Joined through the story',
      });
      expect(result.success).toBe(true);
      expect(companionSystem.createCompanion).toHaveBeenCalled();
      expect(companionSystem.recruitCompanion).toHaveBeenCalled();
      expect(result.companion?.name).toBe('Elena');
    });

    it('rejects empty names', () => {
      expect(recruitCompanionFromStory({ name: '  ' }).success).toBe(false);
    });
  });

  describe('applyStoryRelationshipMoments', () => {
    it('applies moment deltas without throwing', () => {
      const applied = applyStoryRelationshipMoments({
        moments: [
          { npcName: 'Elena', momentType: 'first_kiss', description: 'A tender moment' },
          { npcName: 'Marcus', momentType: 'argument', description: 'Harsh words' },
        ],
        tick: 42,
      });
      expect(applied).toBe(2);
    });
  });
});
