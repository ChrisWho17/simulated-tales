import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryRollbackLedger } from '../inventoryRollbackLedger';

describe('InventoryRollbackLedger', () => {
  let ledger: InventoryRollbackLedger;

  beforeEach(() => {
    ledger = new InventoryRollbackLedger();
  });

  it('records add/remove entries with applied=true', () => {
    const e = ledger.record({ storyEntryId: 'n1', turn: 1, added: ['sword'], removed: [] });
    expect(e.applied).toBe(true);
    expect(ledger.list()).toHaveLength(1);
  });

  it('reverts entries AFTER the target id and inverts items', () => {
    ledger.record({ storyEntryId: 'n1', turn: 1, added: ['sword'], removed: [] });
    ledger.record({ storyEntryId: 'n2', turn: 2, added: ['potion'], removed: ['old map'] });
    ledger.record({ storyEntryId: 'n3', turn: 3, added: [], removed: ['potion'] });

    const r = ledger.revertAfter('n1');
    expect(r.reverted).toHaveLength(2);
    // n2 added potion + n3 removed potion → re-add includes "potion" once (from n3) and removes "potion" once (from n2 add)
    expect(r.itemsToRemove).toEqual(['potion']);          // n2.added
    expect(r.itemsToReAdd).toEqual(['old map', 'potion']); // n2.removed + n3.removed
    expect(ledger.list()).toHaveLength(1);
    expect(ledger.list()[0].storyEntryId).toBe('n1');
  });

  it('is idempotent — re-running revert to the same id is a no-op', () => {
    ledger.record({ storyEntryId: 'n1', turn: 1, added: ['sword'], removed: [] });
    ledger.record({ storyEntryId: 'n2', turn: 2, added: ['potion'], removed: [] });
    ledger.revertAfter('n1');
    const second = ledger.revertAfter('n1');
    expect(second.reverted).toEqual([]);
    expect(second.itemsToReAdd).toEqual([]);
    expect(second.itemsToRemove).toEqual([]);
  });

  it('does nothing when target id is unknown', () => {
    ledger.record({ storyEntryId: 'n1', turn: 1, added: ['x'], removed: [] });
    const r = ledger.revertAfter('does-not-exist');
    expect(r.reverted).toEqual([]);
    expect(ledger.list()).toHaveLength(1);
  });

  it('serializes and hydrates round-trip', () => {
    ledger.record({ storyEntryId: 'n1', turn: 1, added: ['a'], removed: [] });
    const dump = ledger.serialize();
    const fresh = new InventoryRollbackLedger();
    fresh.hydrate(dump);
    expect(fresh.list()).toHaveLength(1);
    expect(fresh.list()[0].added).toEqual(['a']);
  });
});
