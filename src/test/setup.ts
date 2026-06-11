// Vitest setup: provides a real IndexedDB implementation in jsdom so the
// offlineQueueStore tests exercise the actual idb-keyval code paths.
import 'fake-indexeddb/auto';
