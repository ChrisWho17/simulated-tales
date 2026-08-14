// ============================================================================
// D&D 5E-STYLE RESOLUTION ENGINE
// All uncertain actions resolve with d20 + ability modifier + proficiency.
// The Director never decides success/failure arbitrarily.
// ============================================================================

export type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export const ABILITIES: Ability[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
];

export const ABILITY_ABBR: Record<Ability, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

/** 5E skill list mapped to its governing ability. */
export const SKILL_ABILITY: Record<string, Ability> = {
  athletics: 'strength',
  acrobatics: 'dexterity',
  'sleight of hand': 'dexterity',
  stealth: 'dexterity',
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  religion: 'intelligence',
  'animal handling': 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  persuasion: 'charisma',
};

/** Standard 5E DC bands. */
export const DC_BANDS: Array<{ dc: number; label: string; descriptive: string }> = [
  { dc: 5, label: 'Very Easy', descriptive: 'trivial for anyone competent' },
  { dc: 10, label: 'Easy', descriptive: 'routine but not guaranteed' },
  { dc: 15, label: 'Medium', descriptive: 'a real test of skill' },
  { dc: 20, label: 'Hard', descriptive: 'daunting; training matters' },
  { dc: 25, label: 'Very Hard', descriptive: 'near the edge of possibility' },
  { dc: 30, label: 'Nearly Impossible', descriptive: 'legendary' },
];

export function describeDC(dc: number): string {
  let best = DC_BANDS[0];
  for (const band of DC_BANDS) if (dc >= band.dc) best = band;
  return best.label;
}

export function abilityModifier(score: number): number {
  return Math.floor((Number(score) - 10) / 2);
}

/** 5E proficiency bonus by character level (1-20). */
export function proficiencyBonus(level: number): number {
  const lvl = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return 2 + Math.floor((lvl - 1) / 4);
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
  level?: number;
  proficient?: boolean;
  expertise?: boolean;
  advantage?: RollAdvantage;
  /** Difficulty Class, or target Armor Class for attack rolls. */
  dc: number;
  /** Extra situational modifier (equipment, condition, spell). Must be explained. */
  situational?: number;
  situationalReason?: string;
  /** Hidden from the player (Director secret roll). */
  secret?: boolean;
  reason?: string;
  /** House rule: crit success/failure applies to ability checks too. */
  critOnAbilityChecks?: boolean;
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

export function resolveRoll(req: RollRequest): RollResult {
  const advantage: RollAdvantage = req.advantage || 'normal';
  const dice = advantage === 'normal' ? [d20()] : [d20(), d20()];
  const die =
    advantage === 'advantage' ? Math.max(...dice)
    : advantage === 'disadvantage' ? Math.min(...dice)
    : dice[0];

  const abilityMod = abilityModifier(req.abilityScore);
  const pb = proficiencyBonus(req.level ?? 1);
  const proficiencyMod = req.expertise ? pb * 2 : req.proficient ? pb : 0;
  const situational = req.situational ?? 0;
  const total = die + abilityMod + proficiencyMod + situational;

  // 5E: nat 20 / nat 1 auto-resolve attack rolls and death saves only,
  // unless the crit-on-ability-checks house rule is enabled.
  const autoCritKinds: RollKind[] = ['attack-roll', 'death-save'];
  const critApplies = autoCritKinds.includes(req.kind) || !!req.critOnAbilityChecks;
  const criticalSuccess = critApplies && die === 20;
  const criticalFailure = critApplies && die === 1;

  const success = criticalSuccess ? true : criticalFailure ? false : total >= req.dc;

  const parts = [
    `d20${advantage !== 'normal' ? ` (${advantage}: ${dice.join('/')})` : ''}=${die}`,
    `${ABILITY_ABBR[req.ability]} ${formatModifier(abilityMod)}`,
  ];
  if (proficiencyMod) parts.push(`${req.expertise ? 'expertise' : 'prof'} ${formatModifier(proficiencyMod)}`);
  if (situational) parts.push(`${req.situationalReason || 'situational'} ${formatModifier(situational)}`);

  const breakdown = `${req.skill ? `${req.skill} ` : ''}${req.kind.replace('-', ' ')}: ${parts.join(' ')} = ${total} vs ${
    req.kind === 'attack-roll' ? 'AC' : 'DC'
  } ${req.dc} → ${criticalSuccess ? 'CRITICAL SUCCESS' : criticalFailure ? 'CRITICAL FAILURE' : success ? 'SUCCESS' : 'FAILURE'}`;

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

/** Passive score: 10 + modifiers (+5 advantage, -5 disadvantage). */
export function passiveScore(opts: {
  abilityScore: number;
  level?: number;
  proficient?: boolean;
  expertise?: boolean;
  advantage?: RollAdvantage;
  situational?: number;
}): number {
  const pb = proficiencyBonus(opts.level ?? 1);
  const prof = opts.expertise ? pb * 2 : opts.proficient ? pb : 0;
  const adv = opts.advantage === 'advantage' ? 5 : opts.advantage === 'disadvantage' ? -5 : 0;
  return 10 + abilityModifier(opts.abilityScore) + prof + adv + (opts.situational ?? 0);
}

export interface ContestResult {
  actor: RollResult;
  opponent: RollResult;
  /** 5E: ties mean the situation does not change. */
  winner: 'actor' | 'opponent' | 'tie';
}

export function resolveContest(actor: RollRequest, opponent: RollRequest): ContestResult {
  const a = resolveRoll({ ...actor, dc: 0 });
  const o = resolveRoll({ ...opponent, dc: 0 });
  return {
    actor: a,
    opponent: o,
    winner: a.total > o.total ? 'actor' : o.total > a.total ? 'opponent' : 'tie',
  };
}

// ============= SETTINGS =============

export type DifficultyDisplay = 'hidden' | 'descriptive' | 'exact';

export interface RulesEngineSettings {
  /** Strict 5E vs. optional house rules. */
  strict5e: boolean;
  /** Director rolls shown to the player or kept secret. */
  directorRollsVisible: boolean;
  /** Player rolls automatically or manually. */
  playerRollMode: 'auto' | 'manual';
  /** Show the full roll breakdown in the narrative. */
  showRollBreakdown: boolean;
  /** Character sheet updates itself as conditions/resources change. */
  autoSheetUpdates: boolean;
  /** House rule: nat 1/20 also auto-resolve ability checks. */
  critOnAbilityChecks: boolean;
  /** How DCs are surfaced. */
  difficultyDisplay: DifficultyDisplay;
}

export const DEFAULT_RULES_SETTINGS: RulesEngineSettings = {
  strict5e: true,
  directorRollsVisible: false,
  playerRollMode: 'auto',
  showRollBreakdown: true,
  autoSheetUpdates: true,
  critOnAbilityChecks: false,
  difficultyDisplay: 'descriptive',
};

export function normalizeRulesSettings(input?: Partial<RulesEngineSettings> | null): RulesEngineSettings {
  return { ...DEFAULT_RULES_SETTINGS, ...(input || {}) };
}

// ============= PROMPT BLOCK =============

export interface RulesCharacterSnapshot {
  name?: string;
  level?: number;
  abilityScores?: Partial<Record<Ability, number>>;
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
  character?: RulesCharacterSnapshot | null
): string {
  const lines: string[] = [
    '## RESOLUTION RULES (D&D 5E STYLE) — MANDATORY',
    'Never decide success or failure arbitrarily. Every uncertain action resolves mechanically.',
    '- Formula: d20 + ability modifier + proficiency bonus (expertise doubles proficiency).',
    '- Ability modifier = floor((score - 10) / 2). Proficiency bonus = 2 + floor((level - 1) / 4).',
    '- Use the correct instrument: ability check, skill check, saving throw, or attack roll vs Armor Class.',
    '- Passive checks = 10 + relevant modifiers (+5 advantage, -5 disadvantage).',
    '- Opposed actions use contested checks; a tie means the situation does not change.',
    '- Apply advantage/disadvantage, resistance, immunity, and conditions per 5E.',
    settings.critOnAbilityChecks
      ? '- HOUSE RULE ACTIVE: natural 20 auto-succeeds and natural 1 auto-fails on ability checks too.'
      : '- Natural 20 / natural 1 auto-resolve ONLY attack rolls and death saves. They do NOT auto-resolve ability checks.',
    settings.strict5e
      ? '- Rules mode: STRICT 5E. No invented mechanics.'
      : '- Rules mode: HOUSE RULES allowed, but state any deviation openly.',
    settings.showRollBreakdown
      ? '- Show the roll breakdown for visible rolls: [ROLL: skill | d20=X | mod | prof | adv/dis | DC | outcome].'
      : '- Do not print raw roll math; narrate the outcome, still resolve it mechanically.',
    settings.directorRollsVisible
      ? '- Director rolls are VISIBLE: show hidden-information rolls after they resolve.'
      : '- Director rolls are HIDDEN: roll secretly for hidden info, traps, NPC deception/insight, and unseen perception. Never reveal the number.',
    settings.playerRollMode === 'manual'
      ? '- Player rolls are MANUAL: when a player check is needed, state the check and DC handling, then wait for the roll before narrating the result.'
      : '- Player rolls are AUTOMATIC: roll for the player and narrate the resolved outcome in the same turn.',
    settings.difficultyDisplay === 'exact'
      ? '- Difficulty display: EXACT — state the DC.'
      : settings.difficultyDisplay === 'descriptive'
        ? '- Difficulty display: DESCRIPTIVE — describe difficulty in words (easy/medium/hard), never the raw DC.'
        : '- Difficulty display: HIDDEN — never reveal or hint at the DC.',
    settings.autoSheetUpdates
      ? '- Character sheet auto-updates: emit tags for every stat, condition, resource, and injury change.'
      : '- Character sheet updates are manual: still state every change in plain language.',
    '',
    '## CHARACTER INTEGRATION',
    '- Statistics and mechanical proficiencies determine the NUMBER.',
    '- Personality, fears, role, origin, background, knowledge, injuries, equipment, relationships, and prior experience determine what is BELIEVABLE, what info is available, and when advantage/disadvantage or a shifted DC is justified.',
    '- Personality and fears never grant arbitrary numeric bonuses. They shape hesitation, stress, options, and consequences.',
    '- A character cannot use knowledge they never learned just because the player knows it.',
    '- The player describes an attempt. You choose the check and determine the result.',
    '- Failure must move the story: complications, lost time, exposure, injury, resource loss, or changed circumstances. Never a flat wall.',
    '- Never change statistics silently. Temporary modifiers and conditions must be named, recorded, and explained.',
  ];

  if (character) {
    const scores = character.abilityScores || {};
    const scoreLine = ABILITIES
      .filter(a => typeof scores[a] === 'number')
      .map(a => `${ABILITY_ABBR[a]} ${scores[a]} (${formatModifier(abilityModifier(scores[a] as number))})`)
      .join(', ');
    lines.push('', '## CHARACTER SHEET (authoritative for all rolls)');
    if (character.name) lines.push(`Name: ${character.name}`);
    lines.push(`Level: ${character.level ?? 1} — proficiency bonus ${formatModifier(proficiencyBonus(character.level ?? 1))}`);
    if (scoreLine) lines.push(`Abilities: ${scoreLine}`);
    if (typeof character.armorClass === 'number') lines.push(`Armor Class: ${character.armorClass}`);
    if (character.savingThrowProficiencies?.length)
      lines.push(`Save proficiencies: ${character.savingThrowProficiencies.map(a => ABILITY_ABBR[a]).join(', ')}`);
    if (character.proficientSkills?.length) lines.push(`Skill proficiencies: ${character.proficientSkills.join(', ')}`);
    if (character.expertiseSkills?.length) lines.push(`Expertise: ${character.expertiseSkills.join(', ')}`);
    if (character.conditions?.length) lines.push(`Active conditions: ${character.conditions.join(', ')}`);
    if (character.injuries?.length) lines.push(`Injuries: ${character.injuries.join(', ')}`);
    if (character.knowledge?.length) lines.push(`Known/learned: ${character.knowledge.slice(0, 12).join(', ')}`);
    if (character.fears?.length) lines.push(`Fears (behavioral, not numeric): ${character.fears.join(', ')}`);
  }

  return lines.join('\n');
}
