/**
 * Personality-based social reactions — saying the wrong (or right) thing
 * hits people differently based on who they are, like real life.
 */

import {
  modifyRelationship,
  getPlayerRelationship,
  getOrCreateRelationship,
  type RelationshipMetrics,
} from '@/game/unifiedRelationshipStore';
import {
  getNPCPersonality,
  assignPersonalityToNPC,
} from '@/game/npcPersonalityDialogue';
import {
  getPersonalityById,
  getRandomPersonalityForGenre,
  type PersonalityTrait,
  type SocialDisposition,
} from '@/game/npcPersonalityTemplates';
import { getAllRegisteredNPCs } from '@/game/npcIdentityRegistry';
import {
  companionSystem,
  type CompanionState,
} from '@/game/companionSystem';

export type SocialAct =
  | 'insult'
  | 'threat'
  | 'lie'
  | 'order'
  | 'dismiss'
  | 'apology'
  | 'kindness'
  | 'praise'
  | 'flirt'
  | 'gift'
  | 'betrayal'
  | 'honesty'
  | 'help'
  | 'humor'
  | 'neutral';

export interface SocialReaction {
  npcId: string;
  npcName: string;
  act: SocialAct;
  deltas: Partial<RelationshipMetrics>;
  statusAfter: string;
  reactionCue: string;
  intensity: 'mild' | 'clear' | 'sharp';
}

export interface SocialReactionBatch {
  reactions: SocialReaction[];
  /** Injected into the next GM prompt so people respond in-character */
  promptBlock: string;
}

const ACT_PATTERNS: Array<{ act: SocialAct; re: RegExp }> = [
  { act: 'insult', re: /\b(idiot|fool|stupid|worthless|pathetic|shut up|trash|coward)\b/i },
  { act: 'threat', re: /\b(kill|hurt you|or else|watch yourself|i'?ll make you|threaten)\b/i },
  { act: 'lie', re: /\b(i swear(?!.*true)|trust me(?!.*honest)|never happened|i didn'?t)\b/i },
  { act: 'order', re: /\b(do as i say|that'?s an order|obey|you will)\b/i },
  { act: 'dismiss', re: /\b(whatever|don'?t care|not my problem|leave me alone|get lost)\b/i },
  { act: 'apology', re: /\b(i'?m sorry|forgive me|my fault|i apologize|i was wrong)\b/i },
  { act: 'kindness', re: /\b(are you (ok|alright|hurt)|let me help|i'?ve got you|take care)\b/i },
  { act: 'praise', re: /\b(thank you|well done|impressive|you'?re brave|i admire)\b/i },
  { act: 'flirt', re: /\b(beautiful|handsome|attractive|kiss|date|into you|charming)\b/i },
  { act: 'gift', re: /\b(for you|a gift|this is yours|brought you)\b/i },
  { act: 'betrayal', re: /\b(sold you out|lied to you|used you|double.?cross)\b/i },
  { act: 'honesty', re: /\b(truth is|i won'?t lie|honestly|to be frank|full truth)\b/i },
  { act: 'help', re: /\b(i'?ll help|side with you|stand with|protect you|cover you)\b/i },
  { act: 'humor', re: /\b(joke|kidding|laugh|funny|tease)\b/i },
];

export function classifyPlayerSocialAct(playerAction: string): SocialAct {
  const text = (playerAction || '').trim();
  if (!text || text.startsWith('[')) return 'neutral';
  for (const { act, re } of ACT_PATTERNS) {
    if (re.test(text)) return act;
  }
  // Soft heuristic: short rude fragments
  if (/^(no\.?|nah|shut it)\s*$/i.test(text)) return 'dismiss';
  return 'neutral';
}

function baseDeltas(act: SocialAct): Partial<RelationshipMetrics> {
  switch (act) {
    case 'insult':
      return { trust: -6, respect: -10, affection: -8, attachment: -4 };
    case 'threat':
      return { trust: -8, respect: -4, fear: 12, affection: -10 };
    case 'lie':
      return { trust: -14, respect: -6, affection: -4 };
    case 'order':
      return { respect: -5, trust: -2, fear: 3 };
    case 'dismiss':
      return { attachment: -6, affection: -5, respect: -3 };
    case 'apology':
      return { trust: 6, affection: 4, attachment: 3 };
    case 'kindness':
      return { trust: 5, affection: 8, attachment: 6, fear: -4 };
    case 'praise':
      return { respect: 8, affection: 5, trust: 3 };
    case 'flirt':
      return { attraction: 8, romance: 4, affection: 3, respect: 1 };
    case 'gift':
      return { affection: 6, attachment: 5, trust: 3 };
    case 'betrayal':
      return { trust: -30, respect: -15, affection: -20, attachment: -10, fear: 8 };
    case 'honesty':
      return { trust: 8, respect: 5 };
    case 'help':
      return { trust: 7, respect: 6, attachment: 5, affection: 4 };
    case 'humor':
      return { affection: 3, attachment: 2, respect: 1 };
    default:
      return { familiarity: 2 };
  }
}

function amplifyForPersonality(
  act: SocialAct,
  traits: PersonalityTrait[],
  disposition: SocialDisposition,
  deltas: Partial<RelationshipMetrics>
): Partial<RelationshipMetrics> {
  const out: Partial<RelationshipMetrics> = { ...deltas };
  const bump = (key: keyof RelationshipMetrics, factor: number) => {
    if (out[key] !== undefined) out[key] = Math.round((out[key] as number) * factor);
  };

  if (traits.includes('arrogant') || traits.includes('narcissistic')) {
    if (act === 'insult' || act === 'dismiss' || act === 'order') {
      bump('respect', 1.8);
      bump('affection', 1.4);
    }
    if (act === 'praise') bump('respect', 1.5);
  }
  if (traits.includes('vengeful') || traits.includes('grudging')) {
    if (act === 'insult' || act === 'betrayal' || act === 'threat') {
      bump('trust', 1.6);
      bump('fear', 1.3);
    }
    if (act === 'apology') bump('trust', 0.6); // hard to forgive
  }
  if (traits.includes('forgiving') || traits.includes('compassionate')) {
    if (act === 'apology' || act === 'kindness') {
      bump('trust', 1.5);
      bump('affection', 1.4);
    }
    if (act === 'insult') bump('trust', 0.7);
  }
  if (traits.includes('honest')) {
    if (act === 'lie') bump('trust', 1.8);
    if (act === 'honesty') bump('trust', 1.4);
  }
  if (traits.includes('deceptive') || traits.includes('manipulative')) {
    if (act === 'lie') bump('trust', 0.5); // they expect lies
    if (act === 'honesty') bump('respect', 1.3);
  }
  if (traits.includes('cowardly')) {
    if (act === 'threat') bump('fear', 1.7);
  }
  if (traits.includes('brave') || traits.includes('reckless')) {
    if (act === 'threat') {
      bump('fear', 0.4);
      out.respect = (out.respect || 0) - 4; // defiance
    }
  }
  if (traits.includes('loyal')) {
    if (act === 'help' || act === 'praise') bump('attachment', 1.5);
    if (act === 'betrayal' || act === 'dismiss') bump('attachment', 1.6);
  }

  if (disposition === 'hostile' || disposition === 'predatory' || disposition === 'rival') {
    if (act === 'kindness') bump('trust', 0.6);
    if (act === 'threat') bump('respect', 1.2);
  }
  if (disposition === 'friendly' || disposition === 'gregarious' || disposition === 'protective') {
    if (act === 'kindness' || act === 'humor') bump('affection', 1.4);
    if (act === 'insult') bump('affection', 1.5);
  }
  if (disposition === 'wary' || disposition === 'aloof' || disposition === 'reclusive') {
    if (act === 'flirt') bump('attraction', 0.5);
    if (act === 'honesty') bump('trust', 1.3);
  }

  return out;
}

function reactionLine(
  name: string,
  act: SocialAct,
  disposition: SocialDisposition,
  traits: PersonalityTrait[],
  intensity: SocialReaction['intensity']
): string {
  const sharp = intensity === 'sharp';
  switch (act) {
    case 'insult':
      if (traits.includes('vengeful')) return `${name} goes cold — that slight will be remembered.`;
      if (disposition === 'hostile') return `${name} smiles without warmth. "Say that again."`;
      return sharp
        ? `${name}'s face hardens. Respect just cracked.`
        : `${name} flinches at the slight, then looks away.`;
    case 'threat':
      if (traits.includes('brave')) return `${name} does not back down. Fear fails; contempt rises.`;
      return `${name}'s body language tightens — fear and calculation flicker together.`;
    case 'lie':
      if (traits.includes('honest')) return `${name} hears the false note immediately. Trust drains.`;
      return `${name} files the story away with a doubtful look.`;
    case 'apology':
      if (traits.includes('forgiving') || traits.includes('compassionate'))
        return `${name} softens. The apology lands.`;
      if (traits.includes('vengeful')) return `${name} nods once. Forgiveness is not free — but the door cracked.`;
      return `${name} exhales. Tension eases a little.`;
    case 'kindness':
    case 'help':
      return `${name} registers the care as real — something unguarded shows through.`;
    case 'praise':
      if (traits.includes('arrogant') || traits.includes('narcissistic'))
        return `${name} accepts the praise like owed tribute.`;
      return `${name} looks briefly surprised, then quietly pleased.`;
    case 'flirt':
      if (disposition === 'wary' || disposition === 'aloof')
        return `${name} deflects, reading intent carefully.`;
      return `${name}'s attention sharpens — interest or warning, hard to tell yet.`;
    case 'dismiss':
      return `${name} feels the brush-off. Attachment cools.`;
    case 'order':
      if (disposition === 'hostile' || traits.includes('arrogant') || traits.includes('narcissistic'))
        return `${name} bristles at being commanded.`;
      return `${name} weighs whether obedience is worth it.`;
    case 'betrayal':
      return `${name}'s trust collapses in real time. This will not heal quickly.`;
    case 'honesty':
      return `${name} recognizes candor — rare enough to matter.`;
    case 'humor':
      return `${name} cracks a real reaction — the room lightens a degree.`;
    case 'gift':
      return `${name} studies the gift, measuring the motive behind it.`;
    default:
      return `${name} takes the beat in and updates their read of you.`;
  }
}

function ensurePersonality(npcId: string, genre: string) {
  let stored = getNPCPersonality(npcId);
  if (stored) return stored;
  const template = getRandomPersonalityForGenre(genre);
  if (!template) return null;
  try {
    return assignPersonalityToNPC(npcId, template.id, genre);
  } catch {
    return null;
  }
}

function resolveSceneNpc(playerAction: string, explicitNames?: string[]): Array<{ id: string; name: string }> {
  const registered = getAllRegisteredNPCs();
  const found: Array<{ id: string; name: string }> = [];
  const lower = playerAction.toLowerCase();

  for (const npc of registered) {
    const name = npc.permanent.name;
    if (!name) continue;
    if (explicitNames?.some(n => n.toLowerCase() === name.toLowerCase())) {
      found.push({ id: npc.permanent.id, name });
      continue;
    }
    if (lower.includes(name.toLowerCase())) {
      found.push({ id: npc.permanent.id, name });
    }
  }

  // Fallback: most recently registered few if speaking "to them" / addressing party
  if (found.length === 0 && /\b(you|hey|listen|tell)\b/i.test(playerAction)) {
    for (const npc of registered.slice(-3)) {
      found.push({ id: npc.permanent.id, name: npc.permanent.name });
    }
  }

  return found.slice(0, 4);
}

/**
 * Apply personality-weighted reactions for a player line / action.
 */
export function applyPersonalitySocialReactions(options: {
  playerAction: string;
  genre?: string;
  tick?: number;
  focusNpc?: string[];
}): SocialReactionBatch {
  const act = classifyPlayerSocialAct(options.playerAction);
  if (act === 'neutral' && !options.focusNpc?.length) {
    return { reactions: [], promptBlock: '' };
  }

  const genre = options.genre || 'fantasy';
  const tick = options.tick ?? Date.now();
  const targets = resolveSceneNpc(options.playerAction, options.focusNpc);
  const reactions: SocialReaction[] = [];

  for (const target of targets) {
    const stored = ensurePersonality(target.id, genre);
    const template = stored ? getPersonalityById(stored.personalityId) : null;
    const traits = template?.primaryTraits || [];
    const disposition = template?.socialDisposition || 'indifferent';

    let deltas = baseDeltas(act);
    deltas = amplifyForPersonality(act, traits, disposition, deltas);
    deltas.familiarity = (deltas.familiarity || 0) + 2;

    const magnitude = Object.values(deltas).reduce((s, v) => s + Math.abs(v || 0), 0);
    const intensity: SocialReaction['intensity'] =
      magnitude >= 24 ? 'sharp' : magnitude >= 12 ? 'clear' : 'mild';

    // NPC's view of the player
    const edge = modifyRelationship(target.id, 'player', deltas, `${act}:${options.playerAction.slice(0, 80)}`, tick);
    // Mirror into player→npc quick access for UI
    modifyRelationship('player', target.id, deltas, `${act}:mirror`, tick);

    reactions.push({
      npcId: target.id,
      npcName: target.name,
      act,
      deltas,
      statusAfter: edge.status,
      intensity,
      reactionCue: reactionLine(target.name, act, disposition, traits, intensity),
    });
  }

  // Companions in party also hear you — affinity path
  if (act !== 'neutral') {
    for (const companion of companionSystem.getActiveCompanions().slice(0, 3)) {
      const companionDeltas = amplifyForPersonality(
        act,
        [],
        'friendly',
        baseDeltas(act)
      );
      companion.affinity = Math.max(
        -100,
        Math.min(100, companion.affinity + Math.round((companionDeltas.affection || companionDeltas.trust || 0) * 0.8))
      );
      companion.trust = Math.max(
        0,
        Math.min(100, companion.trust + Math.round((companionDeltas.trust || 0) * 0.6))
      );
      companion.respect = Math.max(
        0,
        Math.min(100, companion.respect + Math.round((companionDeltas.respect || 0) * 0.6))
      );
      if (Math.abs(companionDeltas.trust || 0) >= 6 || Math.abs(companionDeltas.affection || 0) >= 6) {
        companion.wantsToSpeak = true;
        companion.pendingReaction = reactionLine(
          companion.name,
          act,
          'friendly',
          [],
          'clear'
        );
        companionSystem.registerCompanion(companion);
        reactions.push({
          npcId: companion.id,
          npcName: companion.name,
          act,
          deltas: companionDeltas,
          statusAfter: `affinity ${companion.affinity}`,
          intensity: 'clear',
          reactionCue: companion.pendingReaction,
        });
      }
    }
  }

  const promptBlock =
    reactions.length === 0
      ? ''
      : [
          '=== LIVE SOCIAL REACTIONS (personality-weighted — portray these honestly) ===',
          `Player social act: ${act}`,
          ...reactions.map(
            r =>
              `- ${r.npcName}: ${r.reactionCue} [meters Δ trust=${r.deltas.trust ?? 0}, respect=${r.deltas.respect ?? 0}, affection=${r.deltas.affection ?? 0}, fear=${r.deltas.fear ?? 0}; now ${r.statusAfter}]`
          ),
          'People react according to their personality. They do not all feel the same way. Show it in dialogue and body language THIS turn.',
        ].join('\n');

  return { reactions, promptBlock };
}

/**
 * Recruit a companion from story dialogue (or create-from-NPC then recruit).
 * Custom-made companions still use CompanionCreator / createCompanion separately.
 */
export function recruitCompanionFromStory(options: {
  name: string;
  genre?: string;
  template?: keyof typeof import('@/game/companion/companionTemplates').COMPANION_TEMPLATES | string;
  reason?: string;
}): { success: boolean; message: string; companion?: CompanionState } {
  const name = options.name.trim();
  if (!name) return { success: false, message: 'No name to recruit.' };

  const id =
    'story_' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40);

  const existing =
    companionSystem.getCompanion(id) ||
    companionSystem.getAllCompanions().find(c => c.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    const result = companionSystem.recruitCompanion(existing.id);
    return { ...result, companion: existing };
  }

  const template = (options.template as keyof typeof import('@/game/companion/companionTemplates').COMPANION_TEMPLATES) || 'loyal_warrior';
  const created = companionSystem.createCompanion(id, name, template, {
    affinity: 15,
    trust: 40,
    respect: 35,
    internalThoughts: options.reason || 'They chose to stand with this person…',
  });
  const result = companionSystem.recruitCompanion(created.id);
  return { ...result, companion: created };
}

/** Parse recruit tags from raw narrative before strip. */
export function parseRecruitTags(narrative: string): string[] {
  const names: string[] = [];
  const patterns = [
    /\[RECRUIT:([^\]]+)\]/gi,
    /\[COMPANION_JOIN:([^:\]]+)(?::[^\]]*)?\]/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(narrative)) !== null) {
      const name = m[1]?.trim();
      if (name) names.push(name);
    }
  }
  return [...new Set(names)];
}

export interface StoryRelationshipMoment {
  npcName: string;
  momentType: string;
  description: string;
}

/** Parse [RELATIONSHIP:name:type:desc] tags from raw narrative before strip. */
export function parseRelationshipTags(narrative: string): StoryRelationshipMoment[] {
  if (!narrative) return [];
  const moments: StoryRelationshipMoment[] = [];
  const re = /\[RELATIONSHIP:([^:]+):([^:]+):([^\]]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(narrative)) !== null) {
    moments.push({
      npcName: m[1].trim(),
      momentType: m[2].trim(),
      description: m[3].trim(),
    });
  }
  return moments;
}

function momentTypeDeltas(momentType: string): Partial<RelationshipMetrics> {
  switch (momentType) {
    case 'first_meeting':
      return { familiarity: 10, trust: 2 };
    case 'first_conversation':
      return { familiarity: 5, trust: 3, affection: 2 };
    case 'shared_adventure':
      return { trust: 6, attachment: 6, respect: 4 };
    case 'gift_given':
    case 'gift_received':
      return { affection: 6, trust: 3, attachment: 4 };
    case 'first_flirt':
      return { attraction: 8, romance: 4, affection: 3 };
    case 'first_kiss':
      return { romance: 12, affection: 8, attraction: 5, intimacy: 6 };
    case 'confession':
      return { romance: 10, trust: 5, attachment: 8 };
    case 'rejection':
      return { romance: -10, affection: -5, attachment: -5 };
    case 'first_date':
      return { romance: 6, attachment: 5, affection: 4 };
    case 'intimate_moment':
      return { romance: 15, affection: 10, attachment: 8, intimacy: 12 };
    case 'argument':
      return { trust: -5, respect: -3, attachment: -4 };
    case 'reconciliation':
      return { trust: 8, affection: 6, attachment: 5 };
    case 'heartbreak':
      return { romance: -15, affection: -10, attachment: -8, trust: -5 };
    case 'commitment':
      return { romance: 10, attachment: 12, trust: 8 };
    case 'milestone':
      return { attachment: 5, trust: 3, familiarity: 3 };
    case 'memory':
    default:
      return { familiarity: 3, attachment: 2 };
  }
}

/**
 * Apply story [RELATIONSHIP:] moments into the unified meter store.
 * Journal/toast may still run separately via AdventureDisplay.
 */
export function applyStoryRelationshipMoments(options: {
  moments: StoryRelationshipMoment[];
  tick?: number;
}): number {
  const tick = options.tick ?? Date.now();
  let applied = 0;

  for (const moment of options.moments) {
    if (!moment.npcName) continue;
    const npcId =
      'rel_' +
      moment.npcName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 40);

    const deltas = momentTypeDeltas(moment.momentType);
    const reason = `${moment.momentType}:${moment.description.slice(0, 80)}`;

    modifyRelationship(npcId, 'player', deltas, reason, tick);
    modifyRelationship('player', npcId, deltas, reason, tick);
    applied++;
  }

  return applied;
}
