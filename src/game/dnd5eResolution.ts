// ============================================================================
// SPECIAL RESOLUTION ENGINE
// Compatibility filename retained so existing imports do not fracture the app.
// The old D&D 5E ability model is intentionally gone from runtime semantics.
// ============================================================================

import {
  SpecialStat,
  SPECIAL_STATS,
  SPECIAL_ABBR,
  normalizeSpecialStats,
  getSpecialStat,
  getStatModifier,
} from '@/types/rpgCharacter';

export type Ability = SpecialStat;
export const ABILITIES: Ability[] = [...SPECIAL_STATS];
export const ABILITY_ABBR: Record<Ability, string> = SPECIAL_ABBR;

/** Broad skill → governing SPECIAL mapping. Skills give context, SPECIAL decides capability. */
export const SKILL_ABILITY: Record<string, Ability> = {
  athletics: 'strength',
  melee: 'strength',
  unarmed: 'strength',
  acrobatics: 'agility',
  stealth: 'agility',
  lockpicking: 'agility',
  piloting: 'agility',
  shooting: 'agility',
  investigation: 'perception',
  perception: 'perception',
  survival: 'perception',
  tracking: 'perception',
  insight: 'perception',
  medicine: 'intelligence',
  science: 'intelligence',
  hacking: 'intelligence',
  repair: 'intelligence',
  crafting: 'intelligence',
  history: 'intelligence',
  endurance: 'endurance',
  resistance: 'endurance',
  persuasion: 'charisma',
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  barter: 'charisma',
  gambling: 'luck',
  scavenging: 'luck',
};

export const DC_BANDS: Array<{ dc: number; label: string; descriptive: string }> = [
  { dc: 6, label: 'Very Easy', descriptive: 'routine unless badly impaired' },
  { dc: 8, label: 'Easy', descriptive: 'favors basic competence' },
  { dc: 10, label: 'Normal', descriptive: 'a meaningful but fair check' },
  { dc: 12, label: 'Hard', descriptive: 'strong SPECIAL or favorable circumstances matter' },
  { dc: 15, label: 'Very Hard', descriptive: 'exceptional capability or luck is needed' },
  { dc: 18, label: 'Extreme', descriptive: 'an extraordinary long shot' },
];

export function describeDC(dc: number): string {
  let best = DC_BANDS[0];
  for (const band of DC_BANDS) if (dc >= band.dc) best = band;
  return best.label;
}

/** SPECIAL 5 is neutral: 0=-5, 1=-4, 5=0, 10=+5. */
export function abilityModifier(score: number): number {
  return getStatModifier(Number(score));
}

/**
 * Compatibility export. Named skills stay useful, but level no longer grows a
 * D&D proficiency ladder. The small capped bonus keeps learned expertise useful
 * without overpowering SPECIAL.
 */
export function proficiencyBonus(level: number): number {
  const lvl = Math.max(1, Math.floor(level || 1));
  return Math.min(3, 1 + Math.floor((lvl - 1) / 8));
}

export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

// ============= ROLL RESOLUTION =============

export type RollKind = 'ability-check' | 'skill-check' | 'saving-throw' | 'attack-roll' | 'death-save';
export type RollAdvantage = 'normal' | 'advantage' | 'disadvantage';

export interface RollRequest {
  kind: RollKind;
  ability: Ability;
  skill?: string;
  abilityScore: number;
  /** Luck score affects critical ranges even when another SPECIAL governs the check. */
  luckScore?: number;
  level?: number;
  proficient?: boolean;
  expertise?: boolean;
  advantage?: RollAdvantage;
  dc: number;
  situational?: number;
  situationalReason?: string;
  secret?: boolean;
  reason?: string;
  /** Kept for settings compatibility; SPECIAL crit rules are Luck-driven. */
  critOnAbilityChecks?: boolean;
  /** Allows deterministic server-side rolls to survive narrator retries unchanged. */
  forcedDie?: number;
}

export interface RollResult {
  kind: RollKind;
  ability: Ability;
  skill?: string;
  dice: number[];
  die: number;
  advantage: RollAdvantage;
  abilityMod: number;
  proficiencyMod: number;
  situational: number;
  total: number;
  dc: number;
  success: boolean;
  criticalSuccess: boolean;
  criticalFailure: boolean;
  secret: boolean;
  reason?: string;
  breakdown: string;
}

function d20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function criticalRange(luckScore: number | undefined): { successAt: number; failureAt: number } {
  const luck = typeof luckScore === 'number' && !Number.isNaN(luckScore) ? luckScore : 1;
  return { successAt: luck >= 9 ? 19 : 20, failureAt: luck <= 1 ? 2 : 1 };
}

export function resolveRoll(req: RollRequest): RollResult {
  const advantage: RollAdvantage = req.advantage || 'normal';
  const forced = typeof req.forcedDie === 'number' ? Math.max(1, Math.min(20, Math.floor(req.forcedDie))) : null;
  const dice = forced !== null
    ? [forced]
    : advantage === 'normal' ? [d20()] : [d20(), d20()];
  const die = forced !== null
    ? forced
    : advantage === 'advantage' ? Math.max(...dice)
      : advantage === 'disadvantage' ? Math.min(...dice)
        : dice[0];

  const abilityMod = abilityModifier(req.abilityScore);
  const profBase = proficiencyBonus(req.level ?? 1);
  const proficiencyMod = req.expertise ? profBase + 1 : req.proficient ? profBase : 0;
  const situational = req.situational ?? 0;
  const total = die + abilityMod + proficiencyMod + situational;
  const range = criticalRange(req.luckScore);
  const criticalSuccess = die >= range.successAt;
  const criticalFailure = die <= range.failureAt;
  const success = criticalSuccess ? true : criticalFailure ? false : total >= req.dc;

  const parts = [
    `d20${advantage !== 'normal' && forced === null ? ` (${advantage}: ${dice.join('/')})` : ''}=${die}`,
    `${ABILITY_ABBR[req.ability]} ${formatModifier(abilityMod)}`,
  ];
  if (proficiencyMod) parts.push(`${req.expertise ? 'expertise' : 'skill'} ${formatModifier(proficiencyMod)}`);
  if (situational) parts.push(`${req.situationalReason || 'situational'} ${formatModifier(situational)}`);

  const breakdown = `${req.skill ? `${req.skill} ` : ''}${req.kind.replace('-', ' ')}: ${parts.join(' ')} = ${total} vs DC ${req.dc} → ${
    criticalSuccess ? 'CRITICAL SUCCESS' : criticalFailure ? 'CRITICAL FAILURE' : success ? 'SUCCESS' : 'FAILURE'
  }`;

  return {
    kind: req.kind,
    ability: req.ability,
    skill: req.skill,
    dice,
    die,
    advantage,
    abilityMod,
    proficiencyMod,
    situational,
    total,
    dc: req.dc,
    success,
    criticalSuccess,
    criticalFailure,
    secret: !!req.secret,
    reason: req.reason,
    breakdown,
  };
}

export function passiveScore(opts: {
  abilityScore: number;
  level?: number;
  proficient?: boolean;
  expertise?: boolean;
  advantage?: RollAdvantage;
  situational?: number;
}): number {
  const profBase = proficiencyBonus(opts.level ?? 1);
  const prof = opts.expertise ? profBase + 1 : opts.proficient ? profBase : 0;
  const adv = opts.advantage === 'advantage' ? 2 : opts.advantage === 'disadvantage' ? -2 : 0;
  return 10 + abilityModifier(opts.abilityScore) + prof + adv + (opts.situational ?? 0);
}

export interface ContestResult {
  actor: RollResult;
  opponent: RollResult;
  winner: 'actor' | 'opponent' | 'tie';
}

export function resolveContest(actor: RollRequest, opponent: RollRequest): ContestResult {
  const a = resolveRoll({ ...actor, dc: 0 });
  const o = resolveRoll({ ...opponent, dc: 0 });
  return { actor: a, opponent: o, winner: a.total > o.total ? 'actor' : o.total > a.total ? 'opponent' : 'tie' };
}

// ============= SETTINGS =============

export type DifficultyDisplay = 'hidden' | 'descriptive' | 'exact';

export interface RulesEngineSettings {
  /** Legacy UI flag. SPECIAL is always authoritative regardless of this value. */
  strict5e: boolean;
  directorRollsVisible: boolean;
  playerRollMode: 'auto' | 'manual';
  showRollBreakdown: boolean;
  autoSheetUpdates: boolean;
  critOnAbilityChecks: boolean;
  difficultyDisplay: DifficultyDisplay;
}

export const DEFAULT_RULES_SETTINGS: RulesEngineSettings = {
  strict5e: false,
  directorRollsVisible: false,
  // One player action must always resolve as one complete turn.
  playerRollMode: 'auto',
  showRollBreakdown: true,
  autoSheetUpdates: true,
  critOnAbilityChecks: true,
  difficultyDisplay: 'descriptive',
};

export function normalizeRulesSettings(input?: Partial<RulesEngineSettings> | null): RulesEngineSettings {
  return { ...DEFAULT_RULES_SETTINGS, ...(input || {}), playerRollMode: 'auto' };
}

// ============= PROMPT BLOCK =============

export interface RulesCharacterSnapshot {
  name?: string;
  level?: number;
  abilityScores?: Record<string, number> | null;
  proficientSkills?: string[];
  expertiseSkills?: string[];
  savingThrowProficiencies?: Ability[];
  armorClass?: number;
  conditions?: string[];
  injuries?: string[];
  knowledge?: string[];
  fears?: string[];
}

export function buildRulesPromptBlock(
  settings: RulesEngineSettings,
  character?: RulesCharacterSnapshot | null,
): string {
  const normalizedSettings = normalizeRulesSettings(settings);
  const raw = character?.abilityScores || {};
  const stats = normalizeSpecialStats({
    strength: raw.strength ?? 1,
    perception: raw.perception,
    endurance: raw.endurance,
    charisma: raw.charisma ?? 1,
    intelligence: raw.intelligence ?? 1,
    agility: raw.agility,
    luck: raw.luck,
    dexterity: raw.dexterity ?? raw.agility ?? 1,
    constitution: raw.constitution ?? raw.endurance ?? 1,
    wisdom: raw.wisdom ?? raw.perception ?? 1,
  });

  const values = SPECIAL_STATS.map(stat => `${SPECIAL_ABBR[stat]}=${getSpecialStat(stats, stat)}`).join(' ');
  const lines: string[] = [
    '## SPECIAL RESOLUTION — MANDATORY',
    'The game uses one authoritative Fallout-inspired SPECIAL model. D&D ability scores and 5E proficiency math do not exist here.',
    `SPECIAL_VALUES: ${values}`,
    '',
    '### TURN ORDER — HARD CONTRACT',
    'ONE player action = ONE complete turn.',
    '1. Read the player action.',
    '2. If uncertainty requires a check, use the AUTHORITATIVE TURN CHECK supplied by the game before narration.',
    '3. The check result is already rolled and immutable. Never reroll it.',
    '4. Narrate the action, consequence, NPC reaction, state changes, and resulting situation.',
    '5. End at the next meaningful decision point. Only then may the player take another action.',
    'NEVER emit [ROLL:...] or ask the player to roll after narration. NEVER split one action into an attempt-turn followed by a result-turn.',
    '',
    '### SPECIAL MEANING',
    '- STR Strength: force, lifting, melee power, grappling, breaking obstacles, physical intimidation.',
    '- PER Perception: searching, awareness, clues, reading details, spotting danger, sensory accuracy.',
    '- END Endurance: stamina, pain, poison, harsh conditions, sustained exertion and bodily resistance.',
    '- CHA Charisma: persuasion, deception, bargaining, leadership, intimidation, flirting and social leverage.',
    '- INT Intelligence: reasoning, hacking, repair, medicine, science, crafting, deduction and learned knowledge.',
    '- AGI Agility: reflexes, stealth, mobility, aiming, driving/piloting, lockpicking and fine motor work.',
    '- LCK Luck: critical odds, fortunate breaks, gambling, rare finds, scavenging and uncertain coincidence.',
    '',
    '### INTERACTION RULES',
    '- Stats alter interactions like a New Vegas-style RPG. High values unlock believable advantages/options; low or zero values create real limitations and different dialogue/outcomes.',
    '- Class and origin bonuses are mandatory modifiers already reflected in the effective SPECIAL values. Do not ignore them.',
    '- Buffs, debuffs, wounds, equipment and conditions may temporarily modify SPECIAL. Named temporary effects are authoritative.',
    '- Personality, fears, relationships, knowledge, inventory and history decide what approaches are believable and may justify situational modifiers, but they do not replace the governing SPECIAL.',
    '- Failure always moves the story. Use cost, exposure, injury, lost time/resources, changed attitude or a new complication instead of a dead stop.',
    '- A character cannot know information they have never learned just because the player knows it.',
    '',
    '### LUCK',
    '- Normal critical success is natural 20; LCK 9+ expands it to natural 19-20.',
    '- Normal critical failure is natural 1; LCK 0-1 expands bad-luck critical failure to natural 1-2.',
    '- Search/scavenge checks use PER as the primary capability and LCK as a fortune assist for unusual finds.',
    '- Do not turn Luck into a universal flat bonus. It bends improbable outcomes, rare finds and critical odds.',
    '',
    normalizedSettings.showRollBreakdown
      ? '- For a visible resolved check, a compact dice line may be shown BEFORE its prose consequence. Never ask for another roll.'
      : '- Keep resolved check math hidden and narrate only the outcome.',
    normalizedSettings.difficultyDisplay === 'exact'
      ? '- Exact check targets may be displayed.'
      : normalizedSettings.difficultyDisplay === 'descriptive'
        ? '- Describe difficulty in words rather than exposing raw target numbers unless the UI already shows them.'
        : '- Keep target difficulty hidden.',
  ];

  if (character) {
    lines.push('', '### CHARACTER CONTEXT');
    if (character.name) lines.push(`Name: ${character.name}`);
    lines.push(`Level: ${character.level ?? 1}`);
    lines.push(`SPECIAL: ${SPECIAL_STATS.map(s => `${SPECIAL_ABBR[s]} ${getSpecialStat(stats, s)}`).join(', ')}`);
    if (character.proficientSkills?.length) lines.push(`Learned skills: ${character.proficientSkills.join(', ')}`);
    if (character.expertiseSkills?.length) lines.push(`Expertise: ${character.expertiseSkills.join(', ')}`);
    if (character.conditions?.length) lines.push(`Conditions: ${character.conditions.join(', ')}`);
    if (character.injuries?.length) lines.push(`Injuries: ${character.injuries.join(', ')}`);
    if (character.knowledge?.length) lines.push(`Known/learned: ${character.knowledge.slice(0, 12).join(', ')}`);
    if (character.fears?.length) lines.push(`Fears: ${character.fears.join(', ')}`);
  }

  return lines.join('\n');
}
