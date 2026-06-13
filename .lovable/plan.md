# Storage Pipeline Overhaul

## Problem
- `localStorage` is hitting `QuotaExceededError` on `lwe_wal` and campaign blobs (~5–10 MB cap).
- Saves silently fail and fall out of sync with cloud.
- No user-visible control over local vs cloud pipeline.

## Goal
Mirror every save to **both** device cache (IndexedDB, keyed by save name + version) **and** cloud, with a Storage Settings panel exposing the pipeline state.

## Architecture

```text
        ┌──────────────────────────────┐
        │     UnifiedSaveArchitecture   │
        └──────────────┬───────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  ┌─────────────┐            ┌──────────────┐
  │ LocalCache  │  mirror →  │ Cloud (sync) │
  │ IndexedDB   │  ← mirror  │ Supabase     │
  └──────┬──────┘            └──────┬───────┘
         │                          │
         ▼                          ▼
  key: {name}@{version}      campaigns table
```

`localStorage` keeps **only** small flags: campaign index, active id, settings. All campaign blobs, WAL, inventory, gamestate move to IndexedDB.

## Changes

### 1. New: `src/lib/idbCampaignStore.ts`
Tiny IndexedDB wrapper (no extra deps). Stores:
- `campaigns` object store, key = `{saveName}@{schemaVersion}` plus `campaignId` index
- `wal` object store
- `inventory`, `gamestate` object stores

Exposes `get/put/delete/list/clear` with quota-aware error mapping.

### 2. Refactor `src/services/unifiedSaveArchitecture.ts`
- `saveLocal()` writes to IndexedDB instead of localStorage; keeps tiny index in localStorage.
- `saveCampaign()` always writes local first, then enqueues cloud mirror (best-effort).
- On load: try local → fall back to cloud → re-hydrate local.

### 3. Refactor `src/services/saveTransaction.ts`
WAL moves to IndexedDB `wal` store — removes the `lwe_wal` quota crash.

### 4. Migration: `src/lib/campaignStorageMigration.ts`
On boot, copy any existing `lwe_campaign_*`, `lwe_inventory_*`, `lwe_gamestate_*`, `lwe_wal` entries into IndexedDB then delete the localStorage copies. Idempotent, runs once per session.

### 5. New: `src/components/settings/StoragePipelinePanel.tsx`
Storage Settings panel showing:
- Pipeline mode: **Local + Cloud (mirror)** [default] / Local-only / Cloud-only
- IndexedDB usage (via `navigator.storage.estimate()`)
- Cloud sync status + last synced
- Per-save list keyed by `name@version` with Local ✅ / Cloud ✅ chips and a Re-sync button

Wired into existing settings UI (DevOptionsPanel area).

### 6. `src/lib/gameSettings.ts`
Add `storagePipeline: 'mirror' | 'local' | 'cloud'` setting, default `'mirror'`.

## Out of scope (this pass)
- Conflict UI rework (existing `CloudConflictModal` stays as-is)
- Schema changes to the cloud `campaigns` table — already exists

## Risk
One-time migration touches every existing save. Migration is wrapped in try/per-key so a single corrupt entry doesn't block the rest, and old localStorage keys are only deleted after a successful IndexedDB write.
