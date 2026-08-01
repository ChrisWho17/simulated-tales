import { describe, it, expect } from 'vitest';
import {
  getEffectiveProficiency,
  interpretAsFragments,
  interpretAsBroken,
  interpretSpeech,
  generateLocationLanguages,
  assignNPCLanguages,
  createDefaultCharacterLanguageProfile,
  calculateLanguagePointsSpent,
  LANGUAGE_POINT_POOL,
  lowerProficiency,
  companionTranslate,
  postProcessLanguageInResponse,
  createLanguageSystemState,
  applyCharacterProfileToState,
  areDistantDialects,
} from '../languageSystem';

describe('Language Barriers 2.0 — proficiency & dialect', () => {
  it('applies ~1 tier dialect penalty for isolated dialects', () => {
    const profile = createDefaultCharacterLanguageProfile('fantasy');
    // Native common / heartland
    expect(profile.nativeLanguage).toBe('common');

    const same = getEffectiveProficiency(profile, 'common', 'heartland', 'fantasy');
    expect(same).toBe('native');

    // Highland is isolated in fantasy catalog
    expect(areDistantDialects('fantasy', 'common', 'heartland', 'highland')).toBe(true);
    const distant = getEffectiveProficiency(profile, 'common', 'highland', 'fantasy');
    expect(distant).toBe(lowerProficiency('native', 1));
  });

  it('does not treat nearby same-language dialect as gibberish', () => {
    const profile = createDefaultCharacterLanguageProfile('fantasy');
    // coastal is not isolated vs heartland
    expect(areDistantDialects('fantasy', 'common', 'heartland', 'coastal')).toBe(false);
    expect(getEffectiveProficiency(profile, 'common', 'coastal', 'fantasy')).toBe('native');
  });

  it('unknown language stays unknown', () => {
    const profile = createDefaultCharacterLanguageProfile('fantasy');
    expect(getEffectiveProficiency(profile, 'elvish', 'wood', 'fantasy')).toBe('unknown');
  });
});

describe('Language Barriers 2.0 — interpretation', () => {
  const sample = 'Soldiers are moving east toward the bridge before morning.';

  it('basic yields fragment-style perception', () => {
    const frag = interpretAsFragments(sample);
    expect(frag).toMatch(/…/);
    expect(frag.toLowerCase()).not.toContain('are moving east toward');
  });

  it('broken yields approximate paraphrase with assumption', () => {
    const broken = interpretAsBroken(sample);
    expect(broken).toMatch(/Rough sense|gather/i);
  });

  it('interpretSpeech respects immersive proficiency tiers', () => {
    const full = interpretSpeech(sample, 'fluent', { mode: 'immersive' });
    expect(full.confirmed).toBe(true);
    expect(full.perceived).toBe(sample);

    const basic = interpretSpeech(sample, 'basic', { mode: 'immersive', language: 'elvish' });
    expect(basic.confirmed).toBe(false);
    expect(basic.displayHtml).toContain('foreign-text');
    expect(basic.partialGloss || basic.perceived).toBeTruthy();

    const unknown = interpretSpeech(sample, 'unknown', {
      mode: 'immersive',
      language: 'elvish',
      translateEnabled: true,
    });
    expect(unknown.displayHtml).toContain('translation');
    expect(unknown.displayHtml).toContain(sample);
  });

  it('disabled mode shows full speech', () => {
    const r = interpretSpeech(sample, 'unknown', { mode: 'disabled', language: 'elvish' });
    expect(r.confirmed).toBe(true);
    expect(r.perceived).toBe(sample);
  });
});

describe('Language Barriers 2.0 — location / NPC world logic', () => {
  it('quiet villages do not invent foreign speaker reasons', () => {
    const loc = generateLocationLanguages('fantasy', 'settlement', 'Greenfield Village');
    expect(loc.dominantLanguage).toBe('common');
    expect(loc.foreignSpeakerReasons.length).toBe(0);
  });

  it('ports get trade tongue and merchant/sailor reasons', () => {
    const loc = generateLocationLanguages('fantasy', 'port', 'Saltwind Harbor');
    expect(loc.foreignSpeakerReasons.length).toBeGreaterThan(0);
    expect(loc.foreignSpeakerReasons.some(r => /merchant|sailor|traveler/i.test(r))).toBe(true);
  });

  it('local NPC in village is not a random polyglot', () => {
    const loc = generateLocationLanguages('fantasy', 'settlement', 'Greenfield Village');
    const npc = assignNPCLanguages({
      genre: 'fantasy',
      location: loc,
      role: 'local',
      education: 'basic',
    });
    expect(npc.known.length).toBeLessThanOrEqual(2);
    expect(npc.primary).toBe(loc.dominantLanguage);
    expect(npc.foreignReason).toBeUndefined();
  });

  it('refugee at a camp may have a foreign primary with a reason', () => {
    const loc = generateLocationLanguages('fantasy', 'camp', 'Refugee Camp');
    const npc = assignNPCLanguages({
      genre: 'fantasy',
      location: loc,
      role: 'refugee',
      education: 'basic',
    });
    expect(npc.foreignReason || npc.known.length >= 1).toBeTruthy();
  });
});

describe('Language Barriers 2.0 — creation points & companions', () => {
  it('default native profile spends 0 points', () => {
    const profile = createDefaultCharacterLanguageProfile('fantasy');
    expect(calculateLanguagePointsSpent(profile)).toBe(0);
    expect(LANGUAGE_POINT_POOL).toBeGreaterThan(0);
  });

  it('companion translation biases when affinity/trust are low', () => {
    const hostile = companionTranslate(
      'I will help you escape the danger tonight.',
      { id: 'c1', name: 'Riven', affinity: -20, trust: 10, knownLanguages: ['elvish'] },
      'elvish'
    );
    expect(hostile.bias).toBe('hostile');
    expect(hostile.isAccurate).toBe(false);
    expect(hostile.displayHtml).toContain('Riven');
  });

  it('post-process respects character profile proficiency', () => {
    let state = createLanguageSystemState({ mode: 'immersive' });
    const profile = createDefaultCharacterLanguageProfile('fantasy');
    state = applyCharacterProfileToState(state, profile, 'immersive');
    const out = postProcessLanguageInResponse(
      '[LANGUAGE: elvish|wood] "Meet me at the eastern bridge before dawn."',
      state,
      'fantasy'
    );
    expect(out).toContain('foreign-text');
    expect(out).not.toContain('[LANGUAGE:');
  });
});
