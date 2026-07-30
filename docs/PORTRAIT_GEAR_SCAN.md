# Portrait Gear Scan

Where a new character's starting inventory comes from.

## The rule

- **A portrait was generated** → the gear visible on it becomes the starting kit,
  and the class loadout fills whatever the picture doesn't cover.
- **No portrait** → the class loadout alone, exactly as before.

Nothing else changed about inventory. The scan produces `StartingGearItem[]`,
the same shape the class tables and the gear editor already produce, so
story-inventory sync, loot parsing and the equip system never learn that a
portrait was involved.

## The pieces

| Where | What |
|-------|------|
| `supabase/functions/scan-portrait-gear` | Vision pass. Sends the portrait to `google/gemini-2.5-flash` through the Lovable gateway and returns a JSON list of visible gear. |
| `game/portraitGearScan.ts` | All the judgement. Sanitising, slot inference, equip assignment, reconciliation. Pure and unit-tested. |
| `services/portraitGearScanner.ts` | The round trip, with a 25s ceiling. |
| `CharacterCreation` | Runs the scan when a portrait is generated, shows what it found, lets the player drop items, and writes the resolved kit onto the character. |
| `CampaignInventorySync` | Hands the resolved kit to `initializeStartingGear`. |

## Reconciliation

`reconcileStartingGear(scanned, classKit)`:

1. Everything scanned goes in first and claims its equip slot.
2. Class-kit items are then added unless the name is already present, or the
   item competes for a slot the portrait already filled.
3. Consumables, ammo and quest items claim no slot, so they always survive —
   a portrait can't show what's in a pack, and the class kit stays the authority
   on it.

A scanned longcoat therefore replaces the kit's leather jerkin instead of
stacking with it, while the kit's rations and quest map come through untouched.

## What the scan refuses

The vision prompt and `sanitizeScannedGear` both reject:

- anatomy, tattoos, scars, hair, expressions, poses
- scenery, lighting, weather, background
- consumables, ammunition, currency and quest items — not visible, not the
  picture's business
- anything under 0.45 confidence, and anything past the tenth item

Two items never land in the same equip slot, and a portrait can fill at most a
primary and a secondary weapon slot.

## Failure behaviour

Every failure path ends at the class kit:

- no `LOVABLE_API_KEY`, gateway 429/402, timeout, unparseable JSON → empty list,
  a note in the portrait step, class kit stands
- a stale edge deployment returning junk → the client sanitises again, so junk
  is dropped rather than written into an inventory

The scan is never awaited by the Begin Adventure button.

## Deploying

`scan-portrait-gear` is new. It needs a deploy, and it reuses the existing
`LOVABLE_API_KEY` secret — no new configuration:

```bash
supabase functions deploy scan-portrait-gear
```

`verify_jwt = false` in `supabase/config.toml`, matching the other generation
functions: character creation frequently happens before sign-in.

## Reading a resolved kit

The character carries the outcome:

- `customStartingGear: StartingGearItem[]` — the resolved kit
- `startingGearSource: 'portrait-scan' | 'class'`

Both live on `campaign.player` and persist with the save. Campaigns created
before this shipped have neither, and fall back to the class table.

Note that `customStartingGear` existed before this change and was written but
never read — the gear editor's edits were silently discarded at campaign start.
They now apply.
