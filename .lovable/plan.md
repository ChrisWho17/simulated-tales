## Goal

Reduce structural roughness without changing gameplay. Living world systems and Creators Mark tools stay exactly as they are. Zero new features. Every phase ends with the app behaving identically.

Verified current state:
- `src/components/debug/CheatModeSplash.tsx` — 3,906 lines
- `src/components/adventure/AdventureDisplay.tsx` — 2,993 lines
- `src/components/adventure/AdventureGame.tsx` — 2,559 lines
- `src/components/game/GameUI.tsx` — 1,765 lines (same class of problem)
- Save code lives in three parallel places: `src/lib/` (saveSystem, campaignStorage, saveRecovery, storageRepair…), `src/systems/` (SaveSystem, AutoSaveManager, CrossTabSync, StorageHealthMonitor), `src/services/` (unifiedSaveService, unifiedSaveArchitecture, saveTransaction, incrementalSaveService, comprehensiveBackupService…)
- `src/App.tsx` mounts `/loadout-test`, `/inventory-test`, `/debug/pwa` unconditionally, plus `StartupIntegrityMonitor` on every boot

---

## Phase 1 — Safest slice (1–2 days)

**1a. Prod gating (small, high value)**
- Wrap `/loadout-test`, `/inventory-test`, `/debug/pwa` in a `DevOnlyRoute` guard: rendered only when `import.meta.env.DEV` or the Creators Mark flag is active; otherwise they fall through to the 404 route. Pages stay in the codebase and get lazy-loaded so they leave the production bundle.
- `/cheat` / Creators Mark stays public-reachable exactly as today.
- `StartupIntegrityMonitor` and `StorageHealthMonitor` move from boot-blocking to on-demand: run in dev/Creators Mark always, in production only once via `requestIdleCallback` after first paint (or not at all if you prefer — call it out in review).
- Introduce a tiny `devLog` helper and route the noisiest always-on `console.*` in the save/storage/monitor paths through it so production builds are quiet. Errors still log.

**1b. Patch pipeline hardening**
- `VersionHotfixesBadge`: explicit empty state when `fixes[]` is empty or missing — badge does not render at all rather than rendering an empty popover; guard `undefined` fixes and non-array values.
- Add unit tests covering: empty `fixes[]`, missing `fixes` key, single fix, many fixes, and version with only `highlights`.
- Same guard applied where `WhatsNewModal` reads `fixes`.

**1c. First decomposition — the least entangled file**
- `CheatModeSplash.tsx` (3.9k) is a self-contained creator tool, so it carries the lowest gameplay risk. Split by tab/section into `src/components/debug/cheat/` — one file per panel plus a `useCheatState` hook holding the shared mutation handlers. The exported component keeps its name, props, and behavior.
- No logic edits during the move; a diff should be pure relocation.

**Phase 1 exit check:** app boots, story runs, cheat panels all still function, `/loadout-test` 404s in a production build, tests green.

---

## Phase 2 — AdventureDisplay + AdventureGame decomposition

Done after Phase 1 lands and you've played a session against it.

- `AdventureGame.tsx` → extract the flow state machine (`creator → character creation → story ruleset → play`) into `useAdventureFlow`, save/load wiring into `useAdventurePersistence`, and modal orchestration into the existing `AdventureModals`. Component becomes a thin composition root.
- `AdventureDisplay.tsx` → extract `useAutoSave`, `useTurnSubmission` (the AI call + tag filtering pipeline), and `useAmbientFeed`; move the header, narrative stream, and input bar into sibling components under `src/components/adventure/display/`.
- Rule for both: hooks are moved verbatim, dependency arrays untouched. Any behavior change found mid-move gets reported, not silently fixed.
- `GameUI.tsx` gets the same treatment if time allows; otherwise it rolls to Phase 4.

---

## Phase 3 — Save stack consolidation (deprecate + remove dead layers)

1. Produce a call-graph audit: for each module in `lib/`, `systems/`, `services/`, list live callers.
2. Write `docs/save-architecture.md` naming the single source of truth (expected: `services/unifiedSaveArchitecture` + `lib/bigKVStore` as the storage substrate, with `lib/saveRecovery` as the repair path). Everything else is either a caller or a migration-only read path.
3. Mark superseded modules `@deprecated` with a pointer to the replacement.
4. Delete modules with zero live callers — **but** anything that reads an old on-disk format stays, because existing player saves depend on it. Read-compat and migration code is explicitly out of scope for deletion.
5. Add a regression test that loads each golden save fixture in `lib/saveRecovery/__tests__/goldenSaves.ts` after the deletions.

Risk note: this is the only phase that can corrupt player data, so it lands alone, with a manual save/load/reload pass on a real campaign before it's called done.

---

## Phase 4 — Follow-ups (optional)

- Changelog schema validation (zod parse of `changelog.ts` at build/test time).
- `GameUI.tsx` decomposition if not covered in Phase 2.
- Lint rule banning new files over ~600 lines in `components/`.

---

## Technical notes

- No dependency changes, no schema changes, no edge function changes.
- All extractions preserve export names so import sites elsewhere don't churn.
- Each phase is independently revertible; nothing in Phase 1 depends on Phase 3.
