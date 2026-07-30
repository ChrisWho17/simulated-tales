# Save Stack — Source of Truth (ADR)

**Status:** Accepted (Phase 1 — document + deprecate)  
**Date:** 2026-07-29  
**Context:** Creators Mark accrued multiple save layers via Lovable iteration. Cursor review asked for consolidation without risking Opera/campaign saves.

## Source of truth

| Layer | Path | Role |
|-------|------|------|
| **Canonical write path** | `src/services/unifiedSaveArchitecture.ts` + `unifiedSaveService.ts` + `saveTransaction.ts` | New writes, verify-on-write, cloud mirror hooks |
| **Campaign UX** | `src/contexts/CampaignContext.tsx` | Autosave, checkpoints, active campaign |
| **Recovery / cache** | `src/lib/indexedDBCache.ts`, `src/systems/StorageHealthMonitor.ts` | IndexedDB mirror, quota survival |
| **Legacy** | `src/systems/SaveSystem.ts`, older `src/lib/saveSystem.ts` | **Deprecated** — keep for read/compat; do not add callers |

## Rules for this pass

1. Route **new** save/load calls through UnifiedSave / CampaignContext only.
2. Mark legacy modules with `@deprecated` JSDoc pointing here.
3. Do **not** delete legacy layers until a later pass verifies zero live callers.
4. Prefer IndexedDB for large blobs; localStorage for small keys via `STORAGE_KEYS`.

## Follow-ups (Phase 2+)

- Audit imports of `systems/SaveSystem` and migrate remaining callers.
- Optional: remove dead layers after verification.
