// ============================================================================
// PORTRAIT GEAR SCAN — turn visible equipment in a character portrait into a
// starting kit, then reconcile it against the class kit.
//
// Everything here is pure. The network call lives in
// services/portraitGearScanner; the vision model lives in the
// scan-portrait-gear edge function.
// ============================================================================

import { detectItemType, ApparelType, WeaponType } from './itemCategorySystem';
import { StartingGearItem, STARTING_GEAR } from './storyInventoryBridge';

export type GearScanCategory = StartingGearItem['category'];

/** One item the vision pass claims is visible on the character. */
export interface ScannedGearItem extends StartingGearItem {
  /** 0–1. Below MIN_CONFIDENCE the item is dropped as a guess. */
  confidence: number;
}

export interface GearScanResult {
  items: ScannedGearItem[];
  /** Set when the scan could not run; callers fall back to the class kit. */
  error?: string;
}

/** Where a resolved starting kit came from, recorded on the character. */
export type StartingGearSource = 'class' | 'portrait-scan';

export interface ReconciledStartingGear {
  gear: StartingGearItem[];
  /** Names taken from the portrait. */
  fromPortrait: string[];
  /** Names filled in from the class kit because the portrait didn't cover them. */
  fromClassKit: string[];
  /** Class-kit names skipped because the portrait already covers that item or slot. */
  skipped: string[];
}

// A portrait shows what a character wears and carries. It cannot show the
// contents of a pack, so consumables and quest items always come from the kit.
const PORTRAIT_VISIBLE_CATEGORIES: readonly GearScanCategory[] = ['weapons', 'apparel', 'misc'];

const MIN_CONFIDENCE = 0.45;
const MAX_SCANNED_ITEMS = 10;
const MAX_NAME_LENGTH = 48;

// Things a vision model reaches for when it runs out of gear: body parts,
// scenery, and abstractions. None of them belong in an inventory.
const NON_ITEM_WORDS = new Set([
  'hand', 'hands', 'arm', 'arms', 'leg', 'legs', 'face', 'hair', 'eye', 'eyes',
  'skin', 'body', 'torso', 'head', 'shoulder', 'shoulders', 'chest', 'back',
  'tattoo', 'tattoos', 'scar', 'scars', 'piercing', 'piercings', 'muscle',
  'background', 'sky', 'light', 'lighting', 'shadow', 'shadows', 'mist', 'fog',
  'smoke', 'dust', 'rain', 'wind', 'sun', 'moon', 'expression', 'pose', 'aura',
  'magic', 'glow', 'nothing', 'none', 'unknown', 'item', 'items', 'gear',
  'equipment', 'clothing', 'outfit', 'apparel', 'armor set', 'accessory',
]);

/** Apparel type to the `EquippedState` slot it occupies. */
const APPAREL_EQUIP_SLOT: Record<ApparelType, string> = {
  headwear: 'head',
  torso: 'torso',
  hands: 'hands',
  legs: 'legs',
  feet: 'feet',
};

/** A portrait can show at most a drawn weapon and a holstered one. */
const WEAPON_EQUIP_SLOTS = ['primaryWeapon', 'sidearm'] as const;

// Order matters: the garment noun decides the slot, so specific body-worn
// pieces are matched before headwear. "Hooded Cloak" is worn on the body — the
// hood is a description of the cloak, not a second item.
const APPAREL_SLOT_KEYWORDS: Array<[ApparelType, readonly string[]]> = [
  ['feet', ['boot', 'shoe', 'sandal', 'moccasin']],
  ['hands', ['glove', 'gauntlet', 'bracer', 'mitt', 'handwrap']],
  ['legs', ['trouser', 'pants', 'legging', 'breeches', 'kilt', 'skirt', 'chaps', 'greave']],
  ['torso', ['coat', 'cloak', 'cape', 'jacket', 'shirt', 'tunic', 'robe', 'vest', 'armor', 'armour', 'cuirass', 'breastplate', 'mail', 'poncho', 'duster', 'dress', 'jumpsuit', 'overalls', 'harness', 'jerkin', 'doublet']],
  ['headwear', ['helm', 'hood', 'hat', 'cap', 'crown', 'circlet', 'mask', 'goggles', 'visor', 'bandana', 'headband', 'headwrap', 'turban']],
];

/** Case- and article-insensitive key used for every duplicate check. */
export function gearNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(a|an|the|some|your|his|her|their)\s+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(s)\b/g, '')
    .trim()
    .replace(/s$/, '');
}

function titleCase(name: string): string {
  return name
    .split(/\s+/)
    .map(word => (word.length <= 2 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

function inferApparelType(name: string, description?: string): ApparelType | undefined {
  const text = `${name} ${description || ''}`.toLowerCase();
  for (const [slot, keywords] of APPAREL_SLOT_KEYWORDS) {
    if (keywords.some(keyword => text.includes(keyword))) return slot;
  }
  return undefined;
}

/**
 * The equip slot a starting-gear item would claim, or null when it does not
 * compete for one. Used to decide whether a class-kit item is redundant next to
 * something already visible in the portrait.
 */
export function gearSlotKey(item: StartingGearItem): string | null {
  if (item.autoEquip) return item.autoEquip;

  if (item.category === 'apparel') {
    const type = item.apparelType || inferApparelType(item.name, item.description);
    return type ? APPAREL_EQUIP_SLOT[type] : null;
  }

  // A kit weapon without an explicit slot still competes for a hand.
  if (item.category === 'weapons') return 'primaryWeapon';

  return null;
}

/**
 * Trim, validate and type the raw list a vision model returned. Anything that
 * looks like scenery, anatomy or a low-confidence guess is dropped, and
 * categories the portrait cannot honestly show are rejected.
 */
export function sanitizeScannedGear(raw: unknown): ScannedGearItem[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const items: ScannedGearItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;

    const rawName = typeof candidate.name === 'string' ? candidate.name.trim() : '';
    if (rawName.length < 3 || rawName.length > MAX_NAME_LENGTH) continue;

    const key = gearNameKey(rawName);
    if (!key || key.length < 3 || seen.has(key)) continue;
    if (NON_ITEM_WORDS.has(key)) continue;

    const confidence = typeof candidate.confidence === 'number' ? candidate.confidence : 0;
    if (confidence < MIN_CONFIDENCE) continue;

    const description = typeof candidate.description === 'string'
      ? candidate.description.trim().slice(0, 240)
      : undefined;

    const detection = detectItemType(rawName, description || '');
    const claimed = candidate.category as GearScanCategory | undefined;
    const category: GearScanCategory =
      claimed && PORTRAIT_VISIBLE_CATEGORIES.includes(claimed)
        ? claimed
        : (PORTRAIT_VISIBLE_CATEGORIES.includes(detection.category) ? detection.category : 'misc');

    const quantity = typeof candidate.quantity === 'number' && candidate.quantity > 1
      ? Math.min(Math.floor(candidate.quantity), 6)
      : 1;

    const item: ScannedGearItem = {
      name: titleCase(rawName),
      category,
      description: description || `Visible in your portrait: ${rawName.toLowerCase()}.`,
      quantity,
      confidence,
    };

    if (category === 'weapons') {
      item.weaponType = (candidate.weaponType as WeaponType) || detection.weaponType || 'melee';
    }
    if (category === 'apparel') {
      item.apparelType = (candidate.apparelType as ApparelType)
        || inferApparelType(rawName, description)
        || 'torso';
    }

    seen.add(key);
    items.push(item);
  }

  // Highest confidence first, so the cap keeps the surest reads.
  const ranked = items
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SCANNED_ITEMS);

  return assignEquipSlots(ranked);
}

/**
 * Anything visible in a portrait is being worn or carried, so it starts
 * equipped. One item per slot; the surest read wins a contested one.
 */
function assignEquipSlots(items: ScannedGearItem[]): ScannedGearItem[] {
  const taken = new Set<string>();
  let weaponsPlaced = 0;

  for (const item of items) {
    if (item.category === 'apparel' && item.apparelType) {
      const slot = APPAREL_EQUIP_SLOT[item.apparelType];
      if (slot && !taken.has(slot)) {
        taken.add(slot);
        item.autoEquip = slot;
      }
      continue;
    }

    if (item.category === 'weapons' && weaponsPlaced < WEAPON_EQUIP_SLOTS.length) {
      item.autoEquip = WEAPON_EQUIP_SLOTS[weaponsPlaced];
      taken.add(item.autoEquip);
      weaponsPlaced += 1;
    }
  }

  return items;
}

/** The class kit a genre/class pair would normally hand out. */
export function getClassKit(genre: string, characterClass = 'default'): StartingGearItem[] {
  const genreGear = STARTING_GEAR[normalizeGearGenre(genre)] || STARTING_GEAR.fantasy;
  return genreGear[characterClass.toLowerCase()] || genreGear.default || [];
}

const GEAR_GENRE_ALIASES: Record<string, string> = {
  modern: 'war',
  military: 'war',
  'sci-fi': 'scifi',
  'post-apocalyptic': 'postapoc',
  post_apocalyptic: 'postapoc',
  'post-apoc': 'postapoc',
  medieval: 'fantasy',
  dark_fantasy: 'fantasy',
  lovecraftian: 'cosmic_horror',
  slice_of_life: 'modern_life',
  noir: 'mystery',
};

export function normalizeGearGenre(genre: string): string {
  const key = genre.toLowerCase();
  return GEAR_GENRE_ALIASES[key] || key;
}

/**
 * Merge what the portrait shows with what the class provides.
 *
 * The portrait wins for anything it can actually show — a scanned longcoat
 * replaces the kit's leather jerkin rather than stacking with it. The kit then
 * fills every gap: consumables, ammo and quest items always survive, and
 * weapons or apparel come through whenever the portrait left that slot open.
 */
export function reconcileStartingGear(
  scanned: readonly StartingGearItem[],
  classKit: readonly StartingGearItem[]
): ReconciledStartingGear {
  const gear: StartingGearItem[] = [];
  const fromPortrait: string[] = [];
  const fromClassKit: string[] = [];
  const skipped: string[] = [];

  const takenNames = new Set<string>();
  const takenSlots = new Set<string>();

  for (const item of scanned) {
    const key = gearNameKey(item.name);
    if (takenNames.has(key)) continue;

    takenNames.add(key);
    const slot = gearSlotKey(item);
    if (slot) takenSlots.add(slot);

    gear.push(item);
    fromPortrait.push(item.name);
  }

  for (const item of classKit) {
    const key = gearNameKey(item.name);
    if (takenNames.has(key)) {
      skipped.push(item.name);
      continue;
    }

    const slot = gearSlotKey(item);
    const contestsVisibleSlot = slot !== null
      && PORTRAIT_VISIBLE_CATEGORIES.includes(item.category)
      && takenSlots.has(slot);

    if (contestsVisibleSlot) {
      skipped.push(item.name);
      continue;
    }

    takenNames.add(key);
    if (slot) takenSlots.add(slot);

    gear.push(item);
    fromClassKit.push(item.name);
  }

  return { gear, fromPortrait, fromClassKit, skipped };
}
