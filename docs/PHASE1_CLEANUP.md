/**
 * Phase 1 Creators Mark cleanup plan (Cursor-owned implementation)
 *
 * Agreed Planning answers (do NOT leave Build to Lovable):
 * 1. Workshop routes (/loadout-test, /inventory-test, /debug/pwa): **Dev-only gate** — keep code, mount only when `isWorkshopEnabled()` (DEV or localStorage `untold-workshop=1`).
 * 2. Save-stack Phase 2: **Document + deprecate only** — UnifiedSave/CampaignContext is canonical; legacy layers get @deprecated + docs/SAVE_STACK.md.
 * 3. Phase 3 (later): deprecate + remove dead layers after verification of zero callers.
 *
 * Phase 1 scope (this pass):
 * - Patch pipeline: changelog.json + VersionHotfixesBadge empty-fixes hardening + tests
 * - Workshop gating in App.tsx
 * - Save stack ADR + deprecate legacy SaveSystem
 * - Safest god-file slices: extract pure helpers from AdventureGame (no behavior change)
 * - WhatsNew reads shared changelog source
 *
 * Done in Cursor (do not Approve Lovable Build for this cleanup):
 * [x] VersionHotfixesBadge empty fixes:[] + 4 tests
 * [x] Workshop routes gated via isWorkshopEnabled()
 * [x] docs/SAVE_STACK.md + @deprecated on systems/SaveSystem, lib/saveSystem, useGameSaves
 * [x] sanitizeCharacterForAPI shared lib (AdventureGame + useNarrativeGeneration)
 * [x] GamePhase extracted to types/gamePhase.ts
 * [ ] Larger AdventureDisplay / CheatModeSplash slices — deferred (safer follow-up)
 *
 * Pass 2 — Viability + Play Chrome Overhaul (Cursor):
 * [x] validateContent gate added to zone transitions, opening narrative, regenerate-world
 *     (previously only the player-action path ran the world bible)
 * [x] Active party companions reach the AI via companionPartyContext (was pending-intro only)
 * [x] Director settings: GameSettingsMenu now reads the campaign-aware source
 *     SettingsPanel already used; removed the duplicate StateSyncBus emit in AdventureGame
 *     so updateSettings is the single write path
 * [x] PlayOverlayShell — shared overlay chrome (backdrop, header, scroll body, footer,
 *     Escape close, focus trap, mobile full-screen). Migrated: SettingsPanel,
 *     CharacterSheet, LevelUpModal, RelationshipJournalDetail, InventoryScreen,
 *     ArsenalScreen, ItemActionModal, CompanionPanel
 * [x] SettingsPanel tabs grouped Play / World / Data / More (no features removed)
 * [x] Tokens: 'ink' (warm brass) is the new default preset; borders/glows in Button, Card
 *     and play chrome route through --accent-* so the color picker drives them
 * [ ] AdventureDisplay god-file slice — still deferred
 *
 * Pass 3 — Deferred items (Cursor):
 * [x] P1.8 Character-gen inventory from imagery. Generating a portrait now scans it for
 *     visible gear and reconciles that with the class kit; skipping the portrait keeps the
 *     class kit alone. New edge function scan-portrait-gear (NEEDS DEPLOY).
 *     See docs/PORTRAIT_GEAR_SCAN.md
 * [x] customStartingGear is finally read. It was written at character creation and dropped
 *     on the floor by CampaignInventorySync, so gear-editor edits never reached play.
 * [x] Class change clears stale gear edits (a mage kept the warrior's plate, because the
 *     gear editor only rebuilds its list while no custom gear is held)
 * [x] Header HUD: AdventureDisplay now renders the AdventureHeader it already had —
 *     ~170 lines of duplicated inline JSX gone, duplicate world-events button removed,
 *     low-frequency actions (world events, bookmarks, new adventure) moved to an overflow
 *     menu, clusters split by a divider
 * [x] Tokens: .play-hud / .play-hud-strip / .play-hud-divider read the surface tokens, so
 *     the bar stays legible with story text scrolling under it; glass-panel-subtle moved
 *     off its hardcoded slate onto --surface-sunken + --surface-tint
 * [x] Weather overlay migrated to PlayOverlayShell (Escape, focus trap, mobile full-screen)
 * [ ] AdventureDisplay god-file slice — still deferred, but ~200 lines lighter
 * [ ] CheatModeSplash overlay migration — still deferred (3.9k-line dev panel)
 */
