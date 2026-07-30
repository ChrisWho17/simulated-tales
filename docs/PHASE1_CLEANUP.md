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
 */
