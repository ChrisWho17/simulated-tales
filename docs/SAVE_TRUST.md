# Save Trust

How saving works, what was wrong, and what can still bite. Read this before
touching anything under `src/services/save*` or `CampaignContext`.

## The stack

Three layers, in the order a write travels:

1. **`CampaignContext`** — owns `activeCampaign` in React, runs the autosave
   timer, and cuts checkpoints. Everything player-facing enters here.
2. **`dataIntegrityService`** — validates and auto-repairs a campaign before it
   is allowed to hit disk, and again after it is read back.
3. **`saveTransaction` / `unifiedSaveArchitecture`** — write-ahead log, checksum
   verification, and the actual `localStorage` commit.

`lib/saveSystem` is legacy. It is still referenced and is **deprecated, not
dead** — do not delete it without proving no load path reaches it.

## Guarantees we now have

- **Atomic commits.** A save writes to the WAL first, commits, then verifies by
  reading back and comparing checksums. A failed verify rolls back to the
  previous good value rather than leaving the slot half-written.
- **Version stamps.** Every record carries a schema version and a timestamp.
- **Validate before apply.** Loads run through integrity checks; a campaign that
  fails structural validation is repaired where possible, and only surfaced if
  it survives.
- **Quota survival.** `QuotaExceededError` during a write triggers a cleanup and
  one retry; if it still fails, the previous value is restored. A full disk no
  longer eats the existing save.
- **Autosave actually fires.** The timer effect keys on `activeCampaign?.id`, not
  the campaign object. Keying on the object meant every narrative entry
  re-created the interval and the timer never reached its deadline.
- **Loud recovery.** Repairs and unrecoverable corruption both raise a toast, so
  a silently-degraded campaign can't masquerade as a healthy one.

## Bugs this replaced

Recorded so they don't get reintroduced:

- **Stale WAL overwrote newer saves.** Recovery replayed any pending WAL entry on
  startup without comparing it to what was already on disk. A crash mid-write
  followed by a successful later save meant the next launch restored the older
  entry. Recovery now applies a WAL entry only when it is newer than the current
  save *and* passes checksum and parse checks.
- **Autosave starvation.** See above — the interval was continuously rebuilt.
- **Lost updates in `saveNow`.** The save read the campaign, awaited an async
  write, then wrote the whole object back, clobbering any narrative entries
  added during the await. It now merges only metadata fields via a functional
  `setActiveCampaign` update.

## Remaining risks

- **`localStorage` is the only local store.** It is synchronous, size-capped
  (~5MB in practice), and shared across tabs. Long campaigns with many
  illustrations will approach the cap. Cleanup exists but is reactive.
- **No cross-tab locking.** Two tabs on the same campaign will fight; last write
  wins. There is no leader election or `BroadcastChannel` coordination.
- **Cloud sync is best-effort.** If the network write fails, local remains the
  source of truth until the next successful sync. Divergence between devices is
  possible and is resolved by timestamp, not by merge.
- **Checksums detect corruption, not staleness.** A well-formed but semantically
  wrong save (e.g. written by a build with a different schema that still
  validates) will pass.
- **Repair is lossy by design.** `dataIntegrityService` can drop malformed
  entries to make a campaign loadable. The toast says so, but the dropped data
  is gone.

## If a player reports a lost save

1. Check the console for `[SaveTransaction]` and `[DataIntegrity]` lines — both
   log the campaign id and the failure mode.
2. Inspect the WAL key in `localStorage`; a lingering entry means a commit never
   completed.
3. Checkpoints are separate keys and survive a corrupted main record. Falling
   back to the most recent checkpoint is usually the fastest recovery.
