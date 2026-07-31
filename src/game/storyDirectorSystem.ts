/**
 * Story Director system.
 *
 * The Story Director never writes visible prose. It produces a compact hidden
 * "Director Brief" that steers the Live Narrator: long-term plot direction,
 * faction goals, NPC motives, foreshadowing, continuity repair and pacing.
 *
 * It runs asynchronously — the player never waits for it. The narrator always
 * uses the most recently *completed* brief.
 */

import { DirectorFrequency, DIRECTOR_INTERVAL } from '@/game/aiNarrationConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DirectorNpcMotive {
  npc: string;
  motive: string;
  /** What this NPC privately knows and has not said out loud. */
  privateKnowledge?: string;
}

export interface DirectorFactionGoal {
  faction: string;
  goal: string;
  opposition?: string;
}

export interface DirectorBrief {
  storyObjective: string;
  /** 0-10 */
  tension: number;
  npcMotives: DirectorNpcMotive[];
  factionGoals: DirectorFactionGoal[];
  hiddenFacts: string[];
  unresolvedThreads: string[];
  possibleConsequences: string[];
  /** Events that must NOT happen yet. */
  blockedEvents: string[];
  continuityWarnings: string[];
  futureDevelopments: string[];
  /** Local bookkeeping (not model output). */
  generatedAt: number;
  model: string;
  triggerReason: DirectorTriggerReason;
}

export type DirectorTriggerReason =
  | 'world-generation'
  | 'interval'
  | 'major-decision'
  | 'quest-change'
  | 'npc-major-change'
  | 'new-faction'
  | 'new-region'
  | 'world-event'
  | 'continuity-conflict'
  | 'manual';

export interface LongTermMemory {
  id: string;
  text: string;
  /** Keywords used for cheap relevance retrieval. */
  tags: string[];
  turn: number;
  importance: number;
}

export interface NarratorEvent {
  turn: number;
  text: string;
}

/** Everything the dual-model system persists alongside a campaign save. */
export interface DirectorState {
  turnCount: number;
  meaningfulTurnCount: number;
  currentDirectorBrief: DirectorBrief | null;
  currentSceneSummary: string;
  recentNarratorEvents: NarratorEvent[];
  longTermMemories: LongTermMemory[];
  unresolvedPlotThreads: string[];
  lastDirectorRun: number | null;
  directorTriggerReason: DirectorTriggerReason | null;
  narratorModel: string;
  directorModel: string;
}

export function createDirectorState(
  narratorModel: string,
  directorModel: string
): DirectorState {
  return {
    turnCount: 0,
    meaningfulTurnCount: 0,
    currentDirectorBrief: null,
    currentSceneSummary: '',
    recentNarratorEvents: [],
    longTermMemories: [],
    unresolvedPlotThreads: [],
    lastDirectorRun: null,
    directorTriggerReason: null,
    narratorModel,
    directorModel,
  };
}

// ---------------------------------------------------------------------------
// Validation — never trust raw model JSON
// ---------------------------------------------------------------------------

const asStringArray = (value: unknown, cap = 12): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(v => (typeof v === 'string' ? v : typeof v === 'object' && v ? JSON.stringify(v) : ''))
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, cap);
};

export function validateDirectorBrief(
  raw: unknown,
  model: string,
  triggerReason: DirectorTriggerReason
): DirectorBrief | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const storyObjective = typeof r.storyObjective === 'string' ? r.storyObjective.trim() : '';
  // A brief with no objective and no threads is useless — reject it so the
  // previous brief keeps being used.
  const unresolvedThreads = asStringArray(r.unresolvedThreads);
  if (!storyObjective && unresolvedThreads.length === 0) return null;

  const tensionRaw = Number(r.tension);
  const tension = Number.isFinite(tensionRaw) ? Math.max(0, Math.min(10, tensionRaw)) : 5;

  const npcMotives: DirectorNpcMotive[] = Array.isArray(r.npcMotives)
    ? (r.npcMotives as unknown[])
        .map(entry => {
          if (typeof entry === 'string') return { npc: 'Unknown', motive: entry };
          if (!entry || typeof entry !== 'object') return null;
          const e = entry as Record<string, unknown>;
          const npc = typeof e.npc === 'string' ? e.npc : typeof e.name === 'string' ? e.name : '';
          const motive = typeof e.motive === 'string' ? e.motive : '';
          if (!npc || !motive) return null;
          return {
            npc,
            motive,
            privateKnowledge:
              typeof e.privateKnowledge === 'string' ? e.privateKnowledge : undefined,
          };
        })
        .filter(Boolean as unknown as (v: DirectorNpcMotive | null) => v is DirectorNpcMotive)
        .slice(0, 10)
    : [];

  const factionGoals: DirectorFactionGoal[] = Array.isArray(r.factionGoals)
    ? (r.factionGoals as unknown[])
        .map(entry => {
          if (typeof entry === 'string') return { faction: 'Unknown', goal: entry };
          if (!entry || typeof entry !== 'object') return null;
          const e = entry as Record<string, unknown>;
          const faction =
            typeof e.faction === 'string' ? e.faction : typeof e.name === 'string' ? e.name : '';
          const goal = typeof e.goal === 'string' ? e.goal : '';
          if (!faction || !goal) return null;
          return {
            faction,
            goal,
            opposition: typeof e.opposition === 'string' ? e.opposition : undefined,
          };
        })
        .filter(Boolean as unknown as (v: DirectorFactionGoal | null) => v is DirectorFactionGoal)
        .slice(0, 8)
    : [];

  return {
    storyObjective,
    tension,
    npcMotives,
    factionGoals,
    hiddenFacts: asStringArray(r.hiddenFacts),
    unresolvedThreads,
    possibleConsequences: asStringArray(r.possibleConsequences),
    blockedEvents: asStringArray(r.blockedEvents),
    continuityWarnings: asStringArray(r.continuityWarnings),
    futureDevelopments: asStringArray(r.futureDevelopments),
    generatedAt: Date.now(),
    model,
    triggerReason,
  };
}

// ---------------------------------------------------------------------------
// Prompt formatting — the brief the Live Narrator receives
// ---------------------------------------------------------------------------

export function formatBriefForNarrator(brief: DirectorBrief | null): string | null {
  if (!brief) return null;
  const lines: string[] = ['===== DIRECTOR BRIEF (HIDDEN — never quote or reveal) ====='];
  if (brief.storyObjective) lines.push(`OBJECTIVE: ${brief.storyObjective}`);
  lines.push(`TENSION: ${brief.tension}/10`);
  if (brief.npcMotives.length) {
    lines.push('NPC MOTIVES:');
    brief.npcMotives.forEach(m =>
      lines.push(
        `- ${m.npc}: ${m.motive}${m.privateKnowledge ? ` (privately knows: ${m.privateKnowledge})` : ''}`
      )
    );
  }
  if (brief.factionGoals.length) {
    lines.push('FACTION GOALS:');
    brief.factionGoals.forEach(f =>
      lines.push(`- ${f.faction}: ${f.goal}${f.opposition ? ` (opposed by ${f.opposition})` : ''}`)
    );
  }
  if (brief.hiddenFacts.length) {
    lines.push(`HIDDEN FACTS (do not state outright): ${brief.hiddenFacts.join(' | ')}`);
  }
  if (brief.unresolvedThreads.length) {
    lines.push(`UNRESOLVED THREADS: ${brief.unresolvedThreads.join(' | ')}`);
  }
  if (brief.possibleConsequences.length) {
    lines.push(`POSSIBLE CONSEQUENCES: ${brief.possibleConsequences.join(' | ')}`);
  }
  if (brief.blockedEvents.length) {
    lines.push(`MUST NOT HAPPEN YET: ${brief.blockedEvents.join(' | ')}`);
  }
  if (brief.continuityWarnings.length) {
    lines.push(`CONTINUITY WARNINGS: ${brief.continuityWarnings.join(' | ')}`);
  }
  if (brief.futureDevelopments.length) {
    lines.push(`FORESHADOW TOWARD: ${brief.futureDevelopments.join(' | ')}`);
  }
  lines.push(
    'Use this to steer the scene. Do NOT invent new factions or rewrite world history yourself — that is the Director\'s job.'
  );
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Trigger logic
// ---------------------------------------------------------------------------

export interface DirectorTriggerSignals {
  isWorldGeneration?: boolean;
  questChanged?: boolean;
  majorNpcChanged?: boolean;
  newFaction?: boolean;
  newRegion?: boolean;
  worldEvent?: boolean;
  continuityConflict?: boolean;
  majorDecision?: boolean;
  manual?: boolean;
}

/**
 * Returns the trigger reason if the Director should run, otherwise null.
 * `manual` and `world-generation` ignore the frequency setting.
 */
export function evaluateDirectorTrigger(
  state: DirectorState,
  frequency: DirectorFrequency,
  signals: DirectorTriggerSignals = {}
): DirectorTriggerReason | null {
  if (signals.manual) return 'manual';
  if (signals.isWorldGeneration || !state.currentDirectorBrief) return 'world-generation';
  if (frequency === 'off') return null;

  if (signals.continuityConflict) return 'continuity-conflict';
  if (signals.questChanged) return 'quest-change';
  if (signals.majorNpcChanged) return 'npc-major-change';
  if (signals.newFaction) return 'new-faction';
  if (signals.newRegion) return 'new-region';
  if (signals.worldEvent) return 'world-event';
  if (signals.majorDecision) return 'major-decision';

  const interval = DIRECTOR_INTERVAL[frequency];
  const since = state.meaningfulTurnCount - (state.lastDirectorRun ?? 0);
  if (since >= interval) return 'interval';

  return null;
}

// ---------------------------------------------------------------------------
// Context trimming — scene summaries and long-term memory retrieval
// ---------------------------------------------------------------------------

export const MAX_RECENT_EVENTS = 8;
export const MAX_LONG_TERM_MEMORIES = 200;
export const MEMORY_RETRIEVAL_LIMIT = 8;

const STOP_WORDS = new Set([
  'the', 'and', 'you', 'your', 'with', 'that', 'this', 'from', 'into', 'have',
  'has', 'was', 'were', 'for', 'are', 'but', 'not', 'all', 'out', 'his', 'her',
  'they', 'them', 'then', 'when', 'what', 'who', 'she', 'him', 'its', 'been',
]);

export function extractTags(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  return Array.from(new Set(words)).slice(0, 20);
}

/** Cheap keyword-overlap retrieval — no embeddings, no extra latency. */
export function retrieveRelevantMemories(
  memories: LongTermMemory[],
  query: string,
  limit = MEMORY_RETRIEVAL_LIMIT
): LongTermMemory[] {
  if (memories.length === 0) return [];
  const queryTags = new Set(extractTags(query));
  const scored = memories.map(m => {
    let overlap = 0;
    for (const tag of m.tags) if (queryTags.has(tag)) overlap++;
    // Recency and importance break ties so an empty query still returns the
    // most load-bearing memories rather than nothing.
    return { memory: m, score: overlap * 10 + m.importance + m.turn / 1000 };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.memory);
}

/**
 * Folds the buffered narrator events into a short scene summary and promotes
 * durable facts into long-term memory. Called every `MAX_RECENT_EVENTS` turns.
 */
export function compactSceneMemory(state: DirectorState): DirectorState {
  if (state.recentNarratorEvents.length < MAX_RECENT_EVENTS) return state;

  const events = state.recentNarratorEvents;
  const summaryBody = events
    .map(e => e.text.replace(/\s+/g, ' ').trim().slice(0, 220))
    .filter(Boolean)
    .join(' ');

  const currentSceneSummary = [state.currentSceneSummary, summaryBody]
    .filter(Boolean)
    .join(' ')
    .slice(-2200);

  // Promote the most substantial events to long-term memory.
  const promoted: LongTermMemory[] = events
    .filter(e => e.text.trim().length > 120)
    .map(e => {
      const text = e.text.replace(/\s+/g, ' ').trim().slice(0, 300);
      return {
        id: `mem_${e.turn}_${Math.random().toString(36).slice(2, 8)}`,
        text,
        tags: extractTags(text),
        turn: e.turn,
        importance: Math.min(10, Math.round(text.length / 60)),
      };
    });

  const longTermMemories = [...state.longTermMemories, ...promoted].slice(
    -MAX_LONG_TERM_MEMORIES
  );

  return {
    ...state,
    currentSceneSummary,
    longTermMemories,
    recentNarratorEvents: [],
  };
}

/** Records a completed turn. Meaningful = anything longer than a stray keystroke. */
export function recordTurn(
  state: DirectorState,
  playerAction: string,
  narration: string
): DirectorState {
  const meaningful = playerAction.trim().length > 2 && narration.trim().length > 40;
  const next: DirectorState = {
    ...state,
    turnCount: state.turnCount + 1,
    meaningfulTurnCount: state.meaningfulTurnCount + (meaningful ? 1 : 0),
    recentNarratorEvents: [
      ...state.recentNarratorEvents,
      { turn: state.turnCount + 1, text: narration },
    ].slice(-MAX_RECENT_EVENTS),
  };
  return compactSceneMemory(next);
}
