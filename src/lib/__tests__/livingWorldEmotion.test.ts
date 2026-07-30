import { describe, expect, it } from 'vitest';
import { buildWhileYouWereAwayRecap } from '@/lib/whileYouWereAway';
import { buildSocialPresenceDirectives } from '@/lib/socialPresenceDirectives';

describe('whileYouWereAway', () => {
  it('builds atmospheric lines from world drift', () => {
    const recap = buildWhileYouWereAwayRecap({
      characterName: 'Asha',
      locationName: 'the quay',
      weatherName: 'Storm',
      weatherChanged: true,
      timeLabel: 'night',
      hoursAway: 3,
      companionBeats: [{ name: 'Rook', mood: 'tense', note: 'has been waiting to speak' }],
    });
    expect(recap.lines.length).toBeGreaterThanOrEqual(2);
    expect(recap.title.toLowerCase()).toContain('away');
    expect(recap.lines.some(l => /storm/i.test(l) || /Rook/.test(l))).toBe(true);
  });
});

describe('socialPresenceDirectives', () => {
  it('makes grim directors harden NPC and companion behavior', () => {
    const social = buildSocialPresenceDirectives(
      {
        adultContent: false,
        enableMoodSystem: true,
        enableWeatherEffects: true,
        enableWoundSystem: true,
        inDepthSettings: { worldTone: 'brutal', socialWeight: 'heavy', consequenceIntensity: 'harsh' },
        directorSettings: {
          enabled: true,
          rawGame: false,
          mode: 'medium',
          directorType: 'survival_warden',
          tightness: 0.8,
          descriptionLevel: 'balanced',
          allowMidCampaignSwap: true,
          cruelty: 'brutal',
          weirdness: 'grounded',
          guidance: 'light',
        } as any,
      },
      null
    );
    expect(social.npcCompanionGuidance).toMatch(/SOCIAL PRESENCE/i);
    expect(social.directives.some(d => /wounded|wound/i.test(d))).toBe(true);
    expect(social.emotionalRange.toLowerCase()).toMatch(/harsh|contempt|panic/);
  });
});
