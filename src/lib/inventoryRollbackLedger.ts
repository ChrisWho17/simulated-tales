// ============================================================================
// INVENTORY ROLLBACK LEDGER
// Append-only journal of loot/drop/use transfers, keyed by the story-entry id
// that produced them. Lets handleRollbackToEntry safely revert item movements
// that happened in the discarded future, without double-applying.
// ============================================================================

export type LedgerOp = 'loot' | 'drop' | 'use';

export interface LedgerEntry {
  storyEntryId: string;
  turn: number;
  timestamp: number;
  added: string[];   // items granted (loot)
  removed: string[]; // items removed (drop/use)
  applied: boolean;  // false once reverted
}

export interface RevertResult {
  reverted: LedgerEntry[];
  itemsToReAdd: string[];
  itemsToRemove: string[];
}

export class InventoryRollbackLedger {
  private entries: LedgerEntry[] = [];

  record(entry: Omit<LedgerEntry, 'applied' | 'timestamp'> & { timestamp?: number }): LedgerEntry {
    const full: LedgerEntry = {
      timestamp: entry.timestamp ?? Date.now(),
      applied: true,
      ...entry,
    };
    this.entries.push(full);
    return full;
  }

  /** All ledger entries, oldest first. */
  list(): LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Revert every entry recorded AFTER `storyEntryId`. The entry matching
   * `storyEntryId` itself is preserved (rollback target is inclusive).
   * Idempotent: entries already marked unapplied are skipped.
   */
  revertAfter(storyEntryId: string): RevertResult {
    const idx = this.entries.findIndex(e => e.storyEntryId === storyEntryId);
    // If the target id isn't in the ledger we still revert everything after
    // the most recent matching turn position the caller knows about — safest
    // default is to leave the ledger untouched when target is unknown.
    if (idx === -1) {
      return { reverted: [], itemsToReAdd: [], itemsToRemove: [] };
    }
    const toRevert = this.entries.slice(idx + 1).filter(e => e.applied);
    const itemsToReAdd: string[] = [];
    const itemsToRemove: string[] = [];
    for (const e of toRevert) {
      // Items the discarded future ADDED → must be removed now
      itemsToRemove.push(...e.added);
      // Items the discarded future REMOVED → must be re-added now
      itemsToReAdd.push(...e.removed);
      e.applied = false;
    }
    // Trim the ledger so a future rollback to the same id is a no-op
    this.entries = this.entries.slice(0, idx + 1);
    return { reverted: toRevert, itemsToReAdd, itemsToRemove };
  }

  /** Drop everything. Used on restart / load-save. */
  clear(): void {
    this.entries = [];
  }

  /** Serialize for persisting alongside the save blob. */
  serialize(): LedgerEntry[] {
    return this.list();
  }

  hydrate(entries: LedgerEntry[] | undefined): void {
    this.entries = Array.isArray(entries) ? [...entries] : [];
  }
}

// Module-level singleton so the inventory writer and the rollback handler
// share state without prop-drilling through 8 components.
export const inventoryRollbackLedger = new InventoryRollbackLedger();
