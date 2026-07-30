# Ship checklist

What has to happen for the Cursor overhaul to actually reach players. Deploying
the frontend is not enough — three edge functions changed, and two of them are
what make the new play-trust behaviour real.

## 1. Redeploy these edge functions, in this order

| # | Function | Why it changed | If you skip it |
|---|----------|----------------|----------------|
| 1 | `generate-adventure` | Language barrier context, companion party context, gameplay systems context, quality enforcement | Language barriers never appear, active companions stay invisible to the narrator |
| 2 | `generate-scene-image` | Scene throttle + illustration profile from settings | Scene art ignores the graphics settings and re-renders too often |
| 3 | `scan-portrait-gear` | **New function.** Reads the generated portrait and returns the visible gear | Character creation falls back to the class kit only — portrait gear scan silently does nothing |

`scan-portrait-gear` is new, so it will not exist in the project until it is
deployed the first time. It is declared in `supabase/config.toml` with
`verify_jwt = false`, because it runs during character creation, often before
sign-in.

```bash
supabase functions deploy generate-adventure
supabase functions deploy generate-scene-image
supabase functions deploy scan-portrait-gear
```

Deploying all three at once is fine; the order above only matters if you are
staging them one at a time and want the most player-visible fix first.

### Secrets

All three read `LOVABLE_API_KEY` from the function environment. No new secret was
introduced by this pass. If `scan-portrait-gear` returns 500 on first call, check
that the key is set for the new function too — secrets are per-project, but a
brand-new function is a good place for a missing-env mistake to surface.

## 2. Then Lovable Publish

Publish the frontend **after** the functions are deployed. The client calls
`scan-portrait-gear` during character creation; if the frontend ships first,
players creating characters in that window get the class kit only.

## 3. Smoke test after publish

Fastest path through everything this pass touched:

1. **Create a character with a portrait.** The gear list should pick up things
   visible in the portrait, reconciled with the class kit. Skipping the portrait
   should leave the class kit alone. (Confirms `scan-portrait-gear`.)
2. **Edit the starting gear, then start.** The edits must survive into play —
   `customStartingGear` used to be dropped by `CampaignInventorySync`.
3. **Change class in the creator after editing gear.** The stale kit should clear.
4. **Play one turn**, then open `/inventory` and `/stats`. HUD numbers and the
   character sheet should agree.
5. **Run the slash commands**: `/quest`, `/relationships`, `/weather`, `/recap`,
   `/companions`. Each overlay should close on Escape and be full-screen on mobile.
6. **Toggle weather graphics off** in settings and confirm particles stop.
7. **Wait for an autosave** (5 minutes) or save manually, reload, and load the
   save. Weather, time, mood, tone, language state and adult-content flag should
   all come back.

## 4. Rulings this pass shipped under

- Workshop routes stay **dev-gated**, not deleted (`isWorkshopEnabled()`).
- Legacy save layers are **document-and-deprecate only** — no removal.
  `UnifiedSave` / `CampaignContext` is canonical. See `docs/SAVE_STACK.md`.
- **Simulation-first**: the world bible gate runs on every narrative path, not
  just player actions.
- **No Approve Lovable Build** for this cleanup — it is Cursor-owned.
- **ThemeGrid and the 37 presets are untouched.**

## 5. Known non-blockers

- `AdventureModals`, `SaveLoadMenu` and `WeaponInspectionModal` are unreferenced
  by design and annotated in-file. They ship as dead code rather than being
  deleted in a UI pass.
- `CheatModeSplash` keeps its own chrome. It is a ~3.9k-line dev panel behind
  cheat commands, so it was not worth a shell migration.
- The production bundle is a single ~3.3 MB chunk. Vite warns about it. Code
  splitting is a separate performance pass, not a ship blocker.
