/**
 * Story Director service.
 *
 * Owns the hidden Director Brief and the trimmed AI context for one campaign.
 * The Director runs in the background — nothing here ever blocks a player turn.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  DirectorState,
  DirectorBrief,
  DirectorTriggerReason,
  DirectorTriggerSignals,
  createDirectorState,
  evaluateDirectorTrigger,
  validateDirectorBrief,
  retrieveRelevantMemories,
  recordTurn,
  MEMORY_RETRIEVAL_LIMIT,
} from '@/game/storyDirectorSystem';
import {
  loadAiNarrationConfig,
  recordNarrationTelemetry,
} from '@/game/aiNarrationConfig';

const KEY_PREFIX = 'lwe_director_';

type Listener = (state: DirectorState) => void;

class StoryDirectorService {
  private campaignId: string | null = null;
  private state: DirectorState;
  private listeners = new Set<Listener>();
  private running = false;
  /** Signals raised while a run is in flight — merged into the next run. */
  private pendingSignals: DirectorTriggerSignals | null = null;

  constructor() {
    const cfg = loadAiNarrationConfig();
    this.state = createDirectorState(cfg.narratorModel, cfg.directorModel);
  }

  // -- lifecycle ------------------------------------------------------------

  attachCampaign(campaignId: string | null): void {
    if (this.campaignId === campaignId) return;
    this.campaignId = campaignId;
    const cfg = loadAiNarrationConfig();
    this.state = createDirectorState(cfg.narratorModel, cfg.directorModel);
    if (campaignId) {
      try {
        const raw = localStorage.getItem(`${KEY_PREFIX}${campaignId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DirectorState>;
          this.state = { ...this.state, ...parsed };
        }
      } catch {
        /* corrupt director state must never break a save */
      }
    }
    // Model choice always follows current settings, not the stale save.
    this.state.narratorModel = cfg.narratorModel;
    this.state.directorModel = cfg.directorModel;
    this.emit();
  }

  /** Hydrate from a campaign blob (used when loading an existing save). */
  hydrate(partial: Partial<DirectorState> | undefined | null): void {
    if (!partial) return;
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  getState(): DirectorState {
    return this.state;
  }

  getBrief(): DirectorBrief | null {
    return this.state.currentDirectorBrief;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach(l => {
      try {
        l(this.state);
      } catch {
        /* listener errors are never fatal */
      }
    });
  }

  private persist(): void {
    if (!this.campaignId) return;
    try {
      localStorage.setItem(`${KEY_PREFIX}${this.campaignId}`, JSON.stringify(this.state));
    } catch {
      /* storage pressure — the brief regenerates on the next trigger */
    }
  }

  // -- context --------------------------------------------------------------

  /**
   * The compact packet sent to the Live Narrator: scene summary, recent
   * events and up to 8 relevant long-term memories. Never the full transcript.
   */
  buildNarratorContext(playerAction: string): {
    directorBrief: DirectorBrief | null;
    sceneSummary: string;
    recentEvents: string[];
    relevantMemories: string[];
    turnCount: number;
    meaningfulTurnCount: number;
  } {
    const memories = retrieveRelevantMemories(
      this.state.longTermMemories,
      `${playerAction} ${this.state.currentSceneSummary.slice(-400)}`,
      MEMORY_RETRIEVAL_LIMIT
    );
    return {
      directorBrief: this.state.currentDirectorBrief,
      sceneSummary: this.state.currentSceneSummary,
      recentEvents: this.state.recentNarratorEvents.map(e => e.text.slice(0, 400)),
      relevantMemories: memories.map(m => m.text),
      turnCount: this.state.turnCount,
      meaningfulTurnCount: this.state.meaningfulTurnCount,
    };
  }

  // -- turn recording -------------------------------------------------------

  recordCompletedTurn(playerAction: string, narration: string): void {
    this.state = recordTurn(this.state, playerAction, narration);
    this.persist();
    this.emit();
  }

  setUnresolvedThreads(threads: string[]): void {
    this.state = { ...this.state, unresolvedPlotThreads: threads.slice(0, 12) };
    this.persist();
  }

  // -- director run ---------------------------------------------------------

  /** Fire-and-forget. Returns immediately; the brief lands when it lands. */
  maybeRunDirector(context: {
    scenario?: string;
    genre?: string;
    characterName?: string;
    location?: string;
    signals?: DirectorTriggerSignals;
  }): void {
    const cfg = loadAiNarrationConfig();
    const reason = evaluateDirectorTrigger(
      this.state,
      cfg.directorFrequency,
      context.signals ?? {}
    );
    if (!reason) {
      this.pendingSignals = null;
      return;
    }
    if (this.running) {
      // Several triggers in the same window collapse into ONE follow-up run.
      this.pendingSignals = { ...(this.pendingSignals ?? {}), ...(context.signals ?? {}) };
      return;
    }
    void this.runDirector(reason, context);
  }

  async runDirector(
    reason: DirectorTriggerReason,
    context: {
      scenario?: string;
      genre?: string;
      characterName?: string;
      location?: string;
      signals?: DirectorTriggerSignals;
    } = {}
  ): Promise<DirectorBrief | null> {
    if (this.running) return this.state.currentDirectorBrief;
    this.running = true;
    const cfg = loadAiNarrationConfig();
    const started = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('story-director', {
        body: {
          model: cfg.directorModel,
          triggerReason: reason,
          scenario: context.scenario ?? '',
          genre: context.genre ?? '',
          characterName: context.characterName ?? '',
          location: context.location ?? '',
          previousBrief: this.state.currentDirectorBrief,
          sceneSummary: this.state.currentSceneSummary.slice(-2500),
          recentEvents: this.state.recentNarratorEvents.map(e => e.text.slice(0, 500)),
          longTermMemories: this.state.longTermMemories.slice(-24).map(m => m.text),
          unresolvedThreads: this.state.unresolvedPlotThreads,
          turnCount: this.state.turnCount,
          meaningfulTurnCount: this.state.meaningfulTurnCount,
        },
      });

      if (error) throw error;

      const nextVersion = (this.state.briefVersion ?? 0) + 1;
      const brief = validateDirectorBrief(data?.brief ?? data, cfg.directorModel, reason, nextVersion);
      if (!brief) {
        // Invalid JSON — keep the previous brief, never block the player.
        console.warn('[StoryDirector] Invalid brief payload; keeping previous brief');
        return this.state.currentDirectorBrief;
      }

      // An out-of-order response can never replace a newer stored brief.
      if (brief.version <= (this.state.briefVersion ?? 0)) {
        console.warn('[StoryDirector] Stale brief discarded (version guard)');
        return this.state.currentDirectorBrief;
      }

      this.state = {
        ...this.state,
        currentDirectorBrief: brief,
        briefVersion: brief.version,
        unresolvedPlotThreads: brief.unresolvedThreads,
        lastDirectorRun: this.state.meaningfulTurnCount,
        directorTriggerReason: reason,
        directorModel: cfg.directorModel,
      };
      this.persist();
      this.emit();
      recordNarrationTelemetry({
        directorLatencyMs: Date.now() - started,
        directorModelUsed: cfg.directorModel,
      });
      return brief;
    } catch (err) {
      console.warn('[StoryDirector] Run failed, keeping previous brief:', err);
      return this.state.currentDirectorBrief;
    } finally {
      this.running = false;
      const queued = this.pendingSignals;
      this.pendingSignals = null;
      if (queued && Object.keys(queued).length > 0) {
        // Run the coalesced follow-up once the in-flight job settled.
        setTimeout(() => this.maybeRunDirector({ ...context, signals: queued }), 0);
      }
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

export const storyDirectorService = new StoryDirectorService();

// Bind the director state to whichever campaign is active, so briefs and
// long-term memory never leak between saves.
import { StateSyncBus } from '@/services/stateSyncBus';

StateSyncBus.subscribe('campaign:loaded', (event) => {
  storyDirectorService.attachCampaign(event.payload.campaignId);
});
StateSyncBus.subscribe('campaign:deleted', (event) => {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${event.payload.campaignId}`);
  } catch {
    /* nothing to clean */
  }
});

