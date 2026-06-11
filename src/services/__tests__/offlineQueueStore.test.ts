import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  enqueueOperation,
  listOperations,
  removeOperationById,
  clearOperations,
  getQueueStats,
  OFFLINE_QUEUE_SCHEMA_VERSION,
  type StoredOperation,
} from '../offlineQueueStore';

function makeOp(overrides: Partial<StoredOperation> = {}): StoredOperation {
  return {
    id: `op_${Math.random().toString(36).slice(2)}`,
    seq: 0,
    campaignId: 'camp-1',
    type: 'save',
    priority: 'normal',
    data: 'compressed-blob',
    checksum: 'abc',
    createdAt: Date.now(),
    retryCount: 0,
    tick: 0,
    ...overrides,
  };
}

describe('offlineQueueStore', () => {
  beforeEach(async () => {
    await clearOperations();
  });

  it('assigns a monotonic sequence id', async () => {
    const a = await enqueueOperation(makeOp({ campaignId: 'a' }));
    const b = await enqueueOperation(makeOp({ campaignId: 'b' }));
    const c = await enqueueOperation(makeOp({ campaignId: 'c' }));
    expect(a.seq).toBeGreaterThan(0);
    expect(b.seq).toBeGreaterThan(a.seq);
    expect(c.seq).toBeGreaterThan(b.seq);
  });

  it('dedupes by (campaignId, type) — latest wins, no duplicates', async () => {
    await enqueueOperation(makeOp({ campaignId: 'x', checksum: 'v1' }));
    await enqueueOperation(makeOp({ campaignId: 'x', checksum: 'v2' }));
    await enqueueOperation(makeOp({ campaignId: 'x', checksum: 'v3' }));
    const ops = await listOperations();
    const matching = ops.filter((o) => o.campaignId === 'x' && o.type === 'save');
    expect(matching).toHaveLength(1);
    expect(matching[0].checksum).toBe('v3');
  });

  it('keeps separate slots for different op types on the same campaign', async () => {
    await enqueueOperation(makeOp({ campaignId: 'y', type: 'save' }));
    await enqueueOperation(makeOp({ campaignId: 'y', type: 'delete' }));
    const ops = await listOperations();
    expect(ops.filter((o) => o.campaignId === 'y')).toHaveLength(2);
  });

  it('survives simulated reloads without losing or duplicating events', async () => {
    // Simulate three reload cycles: enqueue, "reload" (re-list), enqueue more.
    await enqueueOperation(makeOp({ campaignId: 'r1' }));
    await enqueueOperation(makeOp({ campaignId: 'r2' }));

    let after = await listOperations();
    expect(after.map((o) => o.campaignId).sort()).toEqual(['r1', 'r2']);

    // Reload #1 — re-enqueue the SAME logical save (newer tick). Must stay 2 total.
    await enqueueOperation(makeOp({ campaignId: 'r1', tick: 5 }));
    after = await listOperations();
    expect(after).toHaveLength(2);
    expect(after.find((o) => o.campaignId === 'r1')?.tick).toBe(5);

    // Reload #2 — add a new campaign, remove an existing one.
    await enqueueOperation(makeOp({ campaignId: 'r3' }));
    const r2 = (await listOperations()).find((o) => o.campaignId === 'r2')!;
    await removeOperationById(r2.id);
    after = await listOperations();
    expect(after.map((o) => o.campaignId).sort()).toEqual(['r1', 'r3']);

    // Reload #3 — concurrent enqueue/list shouldn't produce duplicates.
    await Promise.all([
      enqueueOperation(makeOp({ campaignId: 'r1', tick: 10 })),
      enqueueOperation(makeOp({ campaignId: 'r1', tick: 11 })),
      enqueueOperation(makeOp({ campaignId: 'r1', tick: 12 })),
    ]);
    const final = await listOperations();
    const r1s = final.filter((o) => o.campaignId === 'r1' && o.type === 'save');
    expect(r1s).toHaveLength(1);
    // The winner is whichever ran last; all candidates were valid.
    expect([10, 11, 12]).toContain(r1s[0].tick);
  });

  it('orders the queue by priority then FIFO', async () => {
    await enqueueOperation(makeOp({ campaignId: 'a', priority: 'low' }));
    await enqueueOperation(makeOp({ campaignId: 'b', priority: 'high' }));
    await enqueueOperation(makeOp({ campaignId: 'c', priority: 'normal' }));
    await enqueueOperation(makeOp({ campaignId: 'd', priority: 'high' }));
    const ops = await listOperations();
    expect(ops.map((o) => o.campaignId)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('exposes queue stats with a stable schema version', async () => {
    await enqueueOperation(makeOp({ campaignId: 'a' }));
    const stats = await getQueueStats();
    expect(stats.count).toBe(1);
    expect(stats.schemaVersion).toBe(OFFLINE_QUEUE_SCHEMA_VERSION);
    expect(stats.seq).toBeGreaterThan(0);
  });
});
