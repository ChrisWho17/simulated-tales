/**
 * SPECIAL turn resolver for narration calls.
 *
 * The old flow let the narrator write a scene, emit [ROLL:...], then made the
 * player resolve that roll as a second action. That breaks turn order. This
 * helper resolves one immutable check BEFORE the model writes consequences and
 * injects that result as the final system message.
 *
 * Rolls are pseudo-random but stable for a turnId + action. A provider retry or
 * fallback therefore cannot secretly reroll a bad result.
 */

export interface SpecialChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type DiceMode = 'story' | 'partial' | 'full';
type SpecialStat = 'strength' | 'perception' | 'endurance' | 'charisma' | 'intelligence' | 'agility' | 'luck';
type Difficulty = 'VERY_EASY' | 'EASY' | 'NORMAL' | 'HARD' | 'VERY_HARD';

type CheckOutcome = 'CRITICAL_FAILURE' | 'FAILURE' | 'PARTIAL' | 'SUCCESS' | 'CRITICAL_SUCCESS';

interface ActionRule {
  id: string;
  stat: SpecialStat;
  category: 'major' | 'minor';
  dc: number;
  label: string;
  luckAssist?: boolean;
}

interface SpecialValues {
  strength: number;
  perception: number;
  endurance: number;
  charisma: number;
  intelligence: number;
  agility: number;
  luck: number;
}

export interface ResolvedSpecialTurn {
  action: string;
  rule: ActionRule;
  difficulty: Difficulty;
  naturalRoll: number;
  statValue: number;
  statModifier: number;
  luckValue: number;
  luckModifier: number;
  difficultyModifier: number;
  total: number;
  target: number;
  outcome: CheckOutcome;
  criticalSuccess: boolean;
  criticalFailure: boolean;
}

const SPECIAL_DEFAULTS: SpecialValues = {
  strength: 1,
  perception: 1,
  endurance: 1,
  charisma: 1,
  intelligence: 1,
  agility: 1,
  luck: 1,
};

const DIFFICULTY_MODS: Record<Difficulty, number> = {
  VERY_EASY: 4,
  EASY: 2,
  NORMAL: 0,
  HARD: -2,
  VERY_HARD: -4,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

/** FNV-1a, sufficient for stable gameplay dispersion without external state. */
function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function stableD20(seed: string): number {
  return (hash32(seed) % 20) + 1;
}

function parseDiceMode(messages: SpecialChatMessage[]): DiceMode | null {
  const all = messages.map(m => m.content).join('\n');
  if (all.includes('=== DICE MODE: STORY MODE ===')) return 'story';
  if (all.includes('=== DICE MODE: NORMAL (PARTIAL DICE) ===')) return 'partial';
  if (all.includes('=== DICE MODE: DICED OUT (FULL DICE) ===')) return 'full';
  return null;
}

function parseSpecialValues(messages: SpecialChatMessage[]): SpecialValues | null {
  const block = messages
    .filter(m => m.role === 'system' && m.content.includes('## SPECIAL RESOLUTION'))
    .map(m => m.content)
    .join('\n');
  if (!block) return null;

  const line = block.match(/SPECIAL_VALUES:\s*STR=([-\d.]+)\s+PER=([-\d.]+)\s+END=([-\d.]+)\s+CHA=([-\d.]+)\s+INT=([-\d.]+)\s+AGI=([-\d.]+)\s+LCK=([-\d.]+)/i);
  if (!line) return { ...SPECIAL_DEFAULTS };

  const nums = line.slice(1, 8).map(v => Number(v));
  if (nums.some(v => !Number.isFinite(v))) return { ...SPECIAL_DEFAULTS };
  return {
    strength: nums[0],
    perception: nums[1],
    endurance: nums[2],
    charisma: nums[3],
    intelligence: nums[4],
    agility: nums[5],
    luck: nums[6],
  };
}

/**
 * The generate-adventure prompt wraps the actual action in the first quoted
 * line of its final user message. Extract that instead of classifying all the
 * instruction/examples that follow it.
 */
function extractAction(messages: SpecialChatMessage[]): string | null {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser?.content) return null;
  const text = lastUser.content;

  if (/\[(?:ROLL SUCCESS|ROLL FAILURE|CRITICAL SUCCESS|CRITICAL FAILURE)\]/i.test(text)) {
    return null;
  }

  const labeled = text.match(/PLAYER[^\n]*(?:ACTION|DIALOGUE)[^\n]*:\s*\n\s*["“]([\s\S]*?)["”]\s*(?:\n|$)/i);
  if (labeled?.[1]?.trim()) return labeled[1].trim();

  const quotedLine = text.match(/^\s*["“]([^\n"”]{1,500})["”]\s*$/m);
  if (quotedLine?.[1]?.trim()) return quotedLine[1].trim();

  // Raw retry/test calls may send the player text without the wrapper.
  if (text.length <= 500 && !/CRITICAL|FORBIDDEN|REQUIRED|PLAYER ACTION/i.test(text)) {
    return text.trim();
  }
  return null;
}

function inferDifficulty(action: string): Difficulty {
  const text = action.toLowerCase();
  if (/\b(impossible|extreme|against all odds|under heavy fire|certain death)\b/.test(text)) return 'VERY_HARD';
  if (/\b(hard|difficult|dangerous|risky|while wounded|under fire|without being seen|before .* catches)\b/.test(text)) return 'HARD';
  if (/\b(easy|simple|carefully|with help|assisted)\b/.test(text)) return 'EASY';
  return 'NORMAL';
}

function inferActionRule(action: string): ActionRule | null {
  const t = action.toLowerCase();

  if (/\b(scavenge|rummage|forage|loot the room|search for supplies|search the area)\b/.test(t))
    return { id: 'SCAVENGE', stat: 'perception', category: 'minor', dc: 11, label: 'Scavenge', luckAssist: true };
  if (/\b(search|look around|examine|inspect|investigate|listen|spot|scan|notice|find)\b/.test(t))
    return { id: 'SEARCH', stat: 'perception', category: 'minor', dc: 10, label: 'Search', luckAssist: true };
  if (/\b(gamble|bet|wager|try my luck|chance it)\b/.test(t))
    return { id: 'GAMBLE', stat: 'luck', category: 'minor', dc: 11, label: 'Gamble' };
  if (/\b(sneak|hide|stealth|creep|silently|without being seen)\b/.test(t))
    return { id: 'STEALTH', stat: 'agility', category: 'minor', dc: 12, label: 'Stealth' };
  if (/\b(lockpick|pick the lock|bypass the lock)\b/.test(t))
    return { id: 'LOCKPICK', stat: 'agility', category: 'minor', dc: 14, label: 'Lockpick' };
  if (/\b(dodge|evade|duck|sidestep)\b/.test(t))
    return { id: 'COMBAT_DODGE', stat: 'agility', category: 'major', dc: 14, label: 'Dodge' };
  if (/\b(flee|escape|break away|run away)\b/.test(t))
    return { id: 'ESCAPE', stat: 'agility', category: 'major', dc: 15, label: 'Escape' };
  if (/\b(shoot|fire at|stab|slash|strike|punch|kick|attack|grapple|disarm)\b/.test(t))
    return { id: 'COMBAT_ATTACK', stat: 'strength', category: 'major', dc: 12, label: 'Attack' };
  if (/\b(persuade|convince|negotiate|talk .* into|reason with|appeal to)\b/.test(t))
    return { id: 'PERSUADE_MAJOR', stat: 'charisma', category: 'major', dc: 14, label: 'Persuade' };
  if (/\b(intimidate|threaten|coerce|scare .* into)\b/.test(t))
    return { id: 'INTIMIDATE', stat: 'charisma', category: 'major', dc: 13, label: 'Intimidate' };
  if (/\b(flirt|seduce|charm)\b/.test(t))
    return { id: 'FLIRT', stat: 'charisma', category: 'minor', dc: 10, label: 'Flirt' };
  if (/\b(haggle|barter|better price|lower the price)\b/.test(t))
    return { id: 'HAGGLE', stat: 'charisma', category: 'minor', dc: 11, label: 'Barter' };
  if (/\b(heal|treat|bandage|stitch|medicine)\b/.test(t))
    return { id: 'HEAL', stat: 'intelligence', category: 'minor', dc: 11, label: 'Medicine' };
  if (/\b(hack|repair|fix|craft|build|decode|solve|calculate|research)\b/.test(t))
    return { id: 'TECH', stat: 'intelligence', category: 'minor', dc: 12, label: 'Technical' };
  if (/\b(endure|resist|withstand|hold my breath|push through|poison|pain)\b/.test(t))
    return { id: 'ENDURE', stat: 'endurance', category: 'major', dc: 12, label: 'Endure' };
  if (/\b(lift|force open|break|kick down|bend|shove)\b/.test(t))
    return { id: 'LIFT', stat: 'strength', category: 'minor', dc: 12, label: 'Strength' };
  if (/\b(climb|scale)\b/.test(t))
    return { id: 'CLIMB', stat: 'strength', category: 'minor', dc: 10, label: 'Climb' };
  if (/\b(swim|dive across)\b/.test(t))
    return { id: 'SWIM', stat: 'endurance', category: 'minor', dc: 10, label: 'Swim' };
  if (/\b(jump|leap|vault)\b/.test(t))
    return { id: 'JUMP', stat: 'agility', category: 'minor', dc: 8, label: 'Jump' };

  // Ordinary movement and normal conversation are choices, not skill checks.
  return null;
}

function resolveTurn(
  action: string,
  rule: ActionRule,
  stats: SpecialValues,
  seed: string,
): ResolvedSpecialTurn {
  const difficulty = inferDifficulty(action);
  const naturalRoll = stableD20(seed);
  const statValue = Number.isFinite(stats[rule.stat]) ? stats[rule.stat] : 1;
  const luckValue = Number.isFinite(stats.luck) ? stats.luck : 1;
  const statModifier = Math.floor(statValue - 5);
  const difficultyModifier = DIFFICULTY_MODS[difficulty];
  const luckModifier = rule.luckAssist && rule.stat !== 'luck'
    ? clamp(Math.trunc((luckValue - 5) / 2), -2, 2)
    : 0;
  const total = naturalRoll + statModifier + difficultyModifier + luckModifier;
  const successAt = luckValue >= 9 ? 19 : 20;
  const failureAt = luckValue <= 1 ? 2 : 1;
  const criticalSuccess = naturalRoll >= successAt;
  const criticalFailure = naturalRoll <= failureAt;

  let outcome: CheckOutcome;
  if (criticalFailure) outcome = 'CRITICAL_FAILURE';
  else if (criticalSuccess) outcome = 'CRITICAL_SUCCESS';
  else if (total >= rule.dc) outcome = 'SUCCESS';
  else if (total >= rule.dc - 3) outcome = 'PARTIAL';
  else outcome = 'FAILURE';

  return {
    action,
    rule,
    difficulty,
    naturalRoll,
    statValue,
    statModifier,
    luckValue,
    luckModifier,
    difficultyModifier,
    total,
    target: rule.dc,
    outcome,
    criticalSuccess,
    criticalFailure,
  };
}

function resultSystemMessage(result: ResolvedSpecialTurn): SpecialChatMessage {
  const stat = result.rule.stat.toUpperCase();
  const parts = [
    `d20=${result.naturalRoll}`,
    `${stat} ${result.statValue} (${signed(result.statModifier)})`,
    `difficulty ${signed(result.difficultyModifier)}`,
  ];
  if (result.luckModifier) parts.push(`LCK search fortune ${signed(result.luckModifier)}`);

  return {
    role: 'system',
    content: [
      '## AUTHORITATIVE TURN CHECK — ALREADY RESOLVED',
      `Player action: ${result.action}`,
      `Check: ${result.rule.label} using ${stat}`,
      `Difficulty: ${result.difficulty}`,
      `Roll: ${parts.join(' · ')} = ${result.total} vs ${result.target}`,
      `Outcome: ${result.outcome.replace('_', ' ')}`,
      `Luck: LCK ${result.luckValue}${result.criticalSuccess ? ' expanded the critical-success range' : ''}${result.criticalFailure ? ' expanded the critical-failure range' : ''}`,
      '',
      'This result is IMMUTABLE for this turn. It was generated by the game engine before narration.',
      'Do NOT reroll. Do NOT emit [ROLL:...] and do NOT ask the player for a dice result.',
      'Narrate the attempted action and this exact outcome now, including consequences, NPC reactions and state changes.',
      'Failure/partial success must fail forward rather than stop the scene.',
      'If dice are visible, begin with one compact line like: 🎲 PER 7 · d20 12 +2 = 14 · SUCCESS. Then continue with prose.',
      'Finish at the NEXT decision point. The player gets another action only after this turn is complete.',
    ].join('\n'),
  };
}

/**
 * Add an authoritative pre-narration check to a narration request when needed.
 * Non-narrator calls do not contain the SPECIAL rules sentinel and pass through.
 */
export function prepareSpecialTurnMessages(
  messages: SpecialChatMessage[],
  turnId?: string,
): { messages: SpecialChatMessage[]; result: ResolvedSpecialTurn | null } {
  const stats = parseSpecialValues(messages);
  if (!stats) return { messages, result: null };

  const mode = parseDiceMode(messages);
  if (!mode || mode === 'story') return { messages, result: null };

  const action = extractAction(messages);
  if (!action) return { messages, result: null };

  const rule = inferActionRule(action);
  if (!rule) return { messages, result: null };
  if (mode === 'partial' && rule.category !== 'major') return { messages, result: null };

  const seed = `${turnId || 'turn'}|${action}|${JSON.stringify(stats)}|${rule.id}`;
  const result = resolveTurn(action, rule, stats, seed);
  return { messages: [...messages, resultSystemMessage(result)], result };
}
