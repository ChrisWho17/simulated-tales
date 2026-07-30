## Scope

Five coordinated additions across tests, save loading, debug UI, edge function, and rollback logic.

---

### 1. Regression tests for edge function parsing

**File:** `supabase/functions/generate-adventure/index_test.ts` (new)

- Extract pure helpers (`parseDamageHeal`, `calculateSimilarity`) into `supabase/functions/generate-adventure/parsers.ts` so they're testable without booting the function.
- Update `index.ts` to import from `parsers.ts` (no behavior change).
- Tests cover:
  - Single `[DAMAGE:X]` tag → correct sum
  - Multiple `[DAMAGE:X]` + `[HEAL:Y]` tags in one narrative → summed correctly (streaming + non-streaming code paths share the helper)
  - `calculateSimilarity` returns expected scores for identical, partial, and disjoint strings (hoisting regression — confirms module-scope availability)
  - `[LOOT:item]`, `[USE:item]`, `[DROP:item]` parsing arrays

**File:** `src/hooks/__tests__/useNarrativeGeneration.test.ts` (new)
- Mocks supabase invoke. Verifies `latestMechanicsRef.current` matches `pendingMechanics` immediately after a generation completes (sync mirror invariant).

---

### 2. Save/load consistency check

**File:** `src/lib/saveConsistencyCheck.ts` (new)

- `validateRestoredState(save)` returns `{ ok, mismatches: string[] }`.
- Checks `weatherState` has required fields (`current`, `intensity`, `transitionAt`), `timeState` (`hour`, `day`, `tick`), `directorSettings` (all keys present in current schema defaults).
- On mismatch: `console.warn` with structured log, fills missing fields with defaults, returns repaired state.

**Integration:** `AdventureGame.handleLoadSave` calls `validateRestoredState` before applying, surfaces toast if mismatches found.

---

### 3. Mechanics sync debug panel

**File:** `src/components/debug/MechanicsSyncDebugPanel.tsx` (new)

- Floating bottom-right panel (only when `?debug=mechanics` or dev flag).
- Shows side-by-side JSON of `pendingMechanics` vs `latestMechanicsRef.current`, highlights diffs red.
- Subscribes to a `rollback-cleared-mechanics` window event and shows a flash banner ("Rollback cleared stale mechanics at turn N").
- Add event dispatch in `handleRollbackToEntry` when mechanics are cleared.

Exposed via `useNarrativeGeneration` returning the ref alongside state.

---

### 4. Deterministic variance seed

**Edge function (`generate-adventure/index.ts`):**
- Accept optional `varianceSeed: string` in request body.
- When present, use it directly instead of generating one; log `[SEED:override]`.

**Client:**
- Add toggle + text input in `GameSettingsMenu` ("Testing → Force variance seed").
- Persisted to localStorage via `gameSettings`.
- `useNarrativeGeneration` reads setting and passes `varianceSeed` in payload when set.

---

### 5. Rollback safety for loot/drop/use

**File:** `src/lib/inventoryRollbackLedger.ts` (new)

- Append-only ledger keyed by `storyEntryId`: records `{ added: Item[], removed: Item[], used: Item[] }` whenever mechanics apply loot/drop/use.
- `revertToEntry(entryId)`: walks ledger entries after `entryId`, inverts each (re-add removed/used, remove added), then trims ledger.
- Idempotent: each ledger entry has a `applied` flag so re-running rollback can't double-revert.

**Integration:** 
- `CampaignInventorySync` (or wherever loot/use/drop is applied) writes ledger entries with the originating entry id.
- `AdventureGame.handleRollbackToEntry` calls `revertToEntry(entryId)` before clearing mechanics.
- Adds a regression test `src/lib/__tests__/inventoryRollbackLedger.test.ts` covering: revert single entry, revert multiple, idempotent re-run, no-op when entry not in ledger.

---

## Technical notes

- No DB schema changes. Ledger persists in same campaign save blob under `inventoryLedger`.
- Edge function tests run via `supabase--test_edge_functions`.
- Debug panel is dev-only — gated on `import.meta.env.DEV || URL flag` so it never ships to end users.
- Variance seed override is opt-in; default behavior unchanged.
- All new colors/styles use existing semantic tokens.

## Files touched

New: 6 (parsers.ts, index_test.ts, useNarrativeGeneration.test.ts, saveConsistencyCheck.ts, MechanicsSyncDebugPanel.tsx, inventoryRollbackLedger.ts, inventoryRollbackLedger.test.ts)
Edited: 5 (index.ts, AdventureGame.tsx, useNarrativeGeneration.ts, GameSettingsMenu.tsx, CampaignInventorySync.tsx)
