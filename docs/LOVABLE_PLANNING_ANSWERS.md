# Paste into Lovable Planning (if still waiting)

**Workshop routes** (`/loadout-test`, `/inventory-test`, `/debug/pwa`):
→ **Dev-only gate** — keep the code; only mount when DEV or `localStorage.setItem('untold-workshop','1')`. Do not delete routes.

**Save-stack Phase 2 aggressiveness**:
→ **Document + deprecate only** — UnifiedSave / CampaignContext is source of truth; mark legacy SaveSystem layers `@deprecated`; no deletions this phase.

**Phase 3 (later)**:
→ Deprecate + remove dead layers **after** verification of zero callers.

**Implementation owner**:
→ **Do not Approve / run Lovable Build for this cleanup.** Cursor is implementing Phase 1 in the Desktop repo (`simulated-tales-main`). Sync/publish from Cursor when ready.

**Already implemented in Cursor** (as of this note):
- Workshop gating, hotfix empty-state badge + tests, changelog pipeline, SAVE_STACK ADR + deprecations, shared `sanitizeCharacterForAPI`, `GamePhase` extract.
- Play-path wiring: shared `buildNarrativeRequestBody`, streaming world-bible `validateContent`, legacy GameSave + CampaignContext dual-write for living-world fields (no legacy deletion).
