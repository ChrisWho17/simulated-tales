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
`InventoryScreen`, `ArsenalScreen`, `ItemActionModal`, `CompanionPanel`.

Not yet migrated: `SaveLoadMenu`, `WeaponInspectionModal`, `CheatModeSplash`,
`AdventureModals` and the companion sub-modals. They still work; they just carry
their own chrome.
