# PlayOverlayShell

`src/components/game/PlayOverlayShell.tsx`

Shared chrome for every in-play overlay. Before this, each overlay hand-rolled its
own backdrop, header and scroll container — six different blur values, three
different close-button treatments, and no consistent Escape handling.

## What it provides

- Backdrop with an atmospheric wash (`--overlay-wash`) over a deep ink scrim
- One surface holding header / optional toolbar / scrollable body / optional footer
- Escape closes; Tab cycles within the overlay; focus returns to the trigger on close
- Body scroll lock while open
- Full-screen on mobile, centred card from the `sm` breakpoint up
- Enter/exit motion that collapses to a plain fade under `prefers-reduced-motion`
- Renders through a portal on `document.body`, so parent stacking contexts can't
  trap it

## Usage

```tsx
<PlayOverlayShell
  open={isOpen}
  onClose={onClose}
  title="Settings"
  subtitle={characterName}
  icon={<Settings className="w-5 h-5" />}
  size="md"
  toolbar={<TabRail />}
  footer={<button className="glow-button w-full">Done</button>}
>
  {content}
</PlayOverlayShell>
```

### Props worth knowing

| Prop | Why |
|------|-----|
| `zIndex` | Stacked overlays (level-up over the character sheet) need to sit above the base layer. Base overlays use the default 50; nested ones use 60–1000. |
| `dismissOnBackdrop` | Set false for flows where an accidental outside click loses work (level-up allocation, Arsenal). |
| `toolbar` | Rendered outside the scroll container, so tab rails and search bars stay pinned. |
| `size` | `sm`/`md`/`lg`/`xl` map to max-widths on desktop only; mobile is always full-screen. |

## Styling

The `.play-overlay-*` classes live in `src/index.css` under `@layer components`.
They read from `--surface-raised`, `--surface-sunken`, `--surface-edge` and
`--overlay-wash`. The surface tokens are accent-independent so overlay chrome
stays legible under every color preset; only the top hairline and active tab
underline pick up `--accent-primary`.

## Conventions

- One composition per overlay. The surface is the container — don't wrap sections
  in additional cards for visual separation. Cards are for interactive rows
  (a save slot, a companion, an inventory item).
- Use `--font-display` for the title (the shell already does), `--font-body` for
  the body, `--font-narrative` for prose passages.
- Keep motion to the shell's enter/exit plus at most one purposeful in-content
  animation.

## Migrated

`SettingsPanel`, `CharacterSheet`, `LevelUpModal`, `RelationshipJournalDetail`,
`InventoryScreen`, `ArsenalScreen`, `ItemActionModal`, `CompanionPanel`, and the
weather overlay inside `AdventureDisplay`.

## Sibling: the HUD bar

`.play-hud` in `src/index.css` is the overlay shell's counterpart for the bar
pinned above the story (`AdventureHeader`). It reads the same `--surface-*`
tokens, but at real opacity rather than glass — story text scrolls underneath it,
and a translucent bar made both illegible. Accent shows up only in the hairline
along its bottom edge, mirroring the overlay surface's top hairline.

`.play-hud-strip` is the quieter variant for what sits directly beneath the bar
(currently the scene illustration).

## Not migrated, and why

`SaveLoadMenu`, `WeaponInspectionModal` and `AdventureModals` have **no importers**
— verified repo-wide. They carry their own chrome and nothing reaches them, so
migrating them would change no pixel a player sees. Each now says so at the top of
the file. They were left in place rather than deleted: `SaveLoadMenu` sits on the
legacy save layer that `docs/SAVE_STACK.md` puts under document-and-deprecate, and
deleting components is a separate call from a UI pass.

`CheatModeSplash` **is** live (AdventureDisplay renders it) but is a ~3.9k-line dev
panel with its own nested screen router. It is not an easy migration and it is
gated behind cheat commands, so it keeps its own chrome for now.

The companion sub-modals inside `CheatModeSplash` are in the same bucket.
