import { describe, it, expect } from 'vitest';
import {
  sanitizeScannedGear,
  reconcileStartingGear,
  gearNameKey,
  gearSlotKey,
  getClassKit,
} from '../portraitGearScan';
import { StartingGearItem } from '../storyInventoryBridge';

describe('gearNameKey', () => {
  it('ignores articles, case and pluralisation', () => {
    expect(gearNameKey('The Leather Boots')).toBe(gearNameKey('leather boot'));
    expect(gearNameKey('a Worn Longcoat')).toBe(gearNameKey('Worn  Longcoat'));
  });
});

describe('sanitizeScannedGear', () => {
  it('drops low-confidence guesses', () => {
    const items = sanitizeScannedGear([
      { name: 'Iron Longsword', category: 'weapons', confidence: 0.9 },
      { name: 'Silver Ring', category: 'misc', confidence: 0.2 },
    ]);
    expect(items.map(i => i.name)).toEqual(['Iron Longsword']);
  });

  it('rejects anatomy and scenery the model mistook for gear', () => {
    const items = sanitizeScannedGear([
      { name: 'tattoos', category: 'misc', confidence: 0.95 },
      { name: 'background', category: 'misc', confidence: 0.9 },
      { name: 'Leather Gloves', category: 'apparel', confidence: 0.8 },
    ]);
    expect(items.map(i => i.name)).toEqual(['Leather Gloves']);
  });

  it('rejects categories a portrait cannot honestly show', () => {
    const items = sanitizeScannedGear([
      { name: 'Healing Potion', category: 'aid', confidence: 0.9 },
    ]);
    expect(items[0]?.category).not.toBe('aid');
  });

  it('infers apparel slots from the item name', () => {
    const items = sanitizeScannedGear([
      { name: 'Riding Boots', category: 'apparel', confidence: 0.8 },
      { name: 'Steel Gauntlets', category: 'apparel', confidence: 0.8 },
      { name: 'Leather Hood', category: 'apparel', confidence: 0.8 },
    ]);
    const slotFor = (name: string) => items.find(i => i.name === name)?.apparelType;
    expect(slotFor('Riding Boots')).toBe('feet');
    expect(slotFor('Steel Gauntlets')).toBe('hands');
    expect(slotFor('Leather Hood')).toBe('headwear');
  });

  it('lets the garment noun win over a describing modifier', () => {
    const items = sanitizeScannedGear([
      { name: 'Hooded Cloak', category: 'apparel', confidence: 0.8 },
      { name: 'Hooded Robe', category: 'apparel', confidence: 0.8 },
    ]);
    // Both are worn on the body; the hood describes the garment.
    expect(items.every(i => i.apparelType === 'torso')).toBe(true);
  });

  it('deduplicates and caps the list, keeping the surest reads', () => {
    const raw = Array.from({ length: 20 }, (_, i) => ({
      name: `Trinket Number ${i}`,
      category: 'misc',
      confidence: i / 20,
    }));
    raw.push({ name: 'trinket number 19', category: 'misc', confidence: 0.99 });

    const items = sanitizeScannedGear(raw);
    expect(items.length).toBeLessThanOrEqual(10);
    expect(new Set(items.map(i => gearNameKey(i.name))).size).toBe(items.length);
    expect(items[0].confidence).toBeGreaterThanOrEqual(items[items.length - 1].confidence);
  });

  it('returns nothing for malformed input', () => {
    expect(sanitizeScannedGear(null)).toEqual([]);
    expect(sanitizeScannedGear(['a string'])).toEqual([]);
    expect(sanitizeScannedGear([{ name: 'ok' }])).toEqual([]);
  });
});

describe('sanitizeScannedGear equip slots', () => {
  it('wears and wields what the portrait shows', () => {
    const items = sanitizeScannedGear([
      { name: 'Steel Longsword', category: 'weapons', confidence: 0.95 },
      { name: 'Belt Dagger', category: 'weapons', confidence: 0.8 },
      { name: 'Boot Knife', category: 'weapons', confidence: 0.6 },
      { name: 'Chainmail Hauberk', category: 'apparel', confidence: 0.9 },
      { name: 'Leather Boots', category: 'apparel', confidence: 0.85 },
    ]);

    const slotFor = (name: string) => items.find(i => i.name === name)?.autoEquip;
    expect(slotFor('Steel Longsword')).toBe('primaryWeapon');
    expect(slotFor('Belt Dagger')).toBe('sidearm');
    // Only two hands: the third weapon rides along unequipped.
    expect(slotFor('Boot Knife')).toBeUndefined();
    expect(slotFor('Chainmail Hauberk')).toBe('torso');
    expect(slotFor('Leather Boots')).toBe('feet');
  });

  it('never equips two items to the same slot', () => {
    const items = sanitizeScannedGear([
      { name: 'Woolen Cloak', category: 'apparel', confidence: 0.9 },
      { name: 'Padded Jerkin', category: 'apparel', confidence: 0.8 },
    ]);

    const slots = items.map(i => i.autoEquip).filter(Boolean);
    expect(new Set(slots).size).toBe(slots.length);
  });
});

describe('gearSlotKey', () => {
  it('prefers an explicit equip slot', () => {
    expect(gearSlotKey({ name: 'Vest', category: 'apparel', autoEquip: 'torso' })).toBe('torso');
  });

  it('reads the slot from the apparel type when none is set', () => {
    expect(gearSlotKey({ name: 'Steel Helm', category: 'apparel', apparelType: 'headwear' })).toBe('head');
  });

  it('claims no slot for consumables or loose kit', () => {
    expect(gearSlotKey({ name: 'Bandage', category: 'aid' })).toBeNull();
    expect(gearSlotKey({ name: 'Rope', category: 'misc' })).toBeNull();
  });
});

describe('reconcileStartingGear', () => {
  const classKit: StartingGearItem[] = [
    { name: 'Iron Sword', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon' },
    { name: 'Leather Armor', category: 'apparel', apparelType: 'torso' },
    { name: 'Travel Boots', category: 'apparel', apparelType: 'feet' },
    { name: 'Healing Potion', category: 'aid', quantity: 2 },
    { name: 'Rope', category: 'misc' },
  ];

  it('keeps the class kit intact when nothing was scanned', () => {
    const result = reconcileStartingGear([], classKit);
    expect(result.gear).toEqual(classKit);
    expect(result.fromPortrait).toEqual([]);
    expect(result.fromClassKit).toHaveLength(classKit.length);
  });

  it('lets portrait gear replace the kit item competing for the same slot', () => {
    const scanned: StartingGearItem[] = [
      { name: 'Chainmail Hauberk', category: 'apparel', apparelType: 'torso' },
    ];
    const result = reconcileStartingGear(scanned, classKit);

    expect(result.gear.map(i => i.name)).toContain('Chainmail Hauberk');
    expect(result.gear.map(i => i.name)).not.toContain('Leather Armor');
    expect(result.skipped).toContain('Leather Armor');
    // Untouched slots still come from the kit.
    expect(result.gear.map(i => i.name)).toContain('Travel Boots');
  });

  it('always fills consumables and quest items from the kit', () => {
    const scanned: StartingGearItem[] = [
      { name: 'Hunting Bow', category: 'weapons', weaponType: 'rifle' },
      { name: 'Chainmail Hauberk', category: 'apparel', apparelType: 'torso' },
    ];
    const result = reconcileStartingGear(scanned, classKit);

    expect(result.gear.map(i => i.name)).toContain('Healing Potion');
    expect(result.fromClassKit).toContain('Healing Potion');
  });

  it('never duplicates an item the portrait already showed', () => {
    const scanned: StartingGearItem[] = [
      { name: 'iron swords', category: 'weapons', weaponType: 'melee' },
    ];
    const result = reconcileStartingGear(scanned, classKit);

    const swords = result.gear.filter(i => gearNameKey(i.name) === gearNameKey('Iron Sword'));
    expect(swords).toHaveLength(1);
    expect(result.skipped).toContain('Iron Sword');
  });

  it('produces no duplicate names or contested slots end to end', () => {
    const scanned = sanitizeScannedGear([
      { name: 'Duster Coat', category: 'apparel', confidence: 0.9 },
      { name: 'Worn Revolver', category: 'weapons', confidence: 0.88 },
      { name: 'Bowie Knife', category: 'weapons', confidence: 0.7 },
      { name: 'Wide-Brimmed Hat', category: 'apparel', confidence: 0.65 },
    ]);
    const result = reconcileStartingGear(scanned, getClassKit('fantasy', 'warrior'));

    const names = result.gear.map(i => gearNameKey(i.name));
    expect(new Set(names).size).toBe(names.length);

    const slots = result.gear.map(gearSlotKey).filter((s): s is string => s !== null);
    expect(new Set(slots).size).toBe(slots.length);

    // The warrior kit's plate and helm lose to what the portrait actually shows.
    expect(result.gear.map(i => i.name)).toContain('Duster Coat');
    expect(result.skipped).toContain('Plate Armor');
  });
});

describe('getClassKit', () => {
  it('resolves genre aliases to the shared gear tables', () => {
    expect(getClassKit('medieval', 'warrior')).toEqual(getClassKit('fantasy', 'warrior'));
  });

  it('falls back to the genre default for an unknown class', () => {
    expect(getClassKit('fantasy', 'not-a-class').length).toBeGreaterThan(0);
  });
});
