// ============================================================================
// SAVE SYSTEM TEST SUITE - Comprehensive testing for storage operations
// ============================================================================

import { SaveSystem } from './SaveSystem';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

type TestFn = () => Promise<boolean | string>;

const TEST_PREFIX = '__test_';

// Clean up test keys
function cleanupTestKeys(): void {
  const keys = SaveSystem.getAllKeys().filter(k => k.startsWith(TEST_PREFIX));
  keys.forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}

// ============================================================================
// TEST DEFINITIONS
// ============================================================================

const tests: Array<{ name: string; category: string; fn: TestFn }> = [
  // Storage Availability Tests
  {
    name: 'localStorage read/write',
    category: 'Storage Availability',
    fn: async () => {
      try {
        localStorage.setItem(`${TEST_PREFIX}ls`, 'test');
        const result = localStorage.getItem(`${TEST_PREFIX}ls`);
        localStorage.removeItem(`${TEST_PREFIX}ls`);
        return result === 'test' || 'Read value does not match written value';
      } catch (e) {
        return `localStorage error: ${e}`;
      }
    },
  },
  {
    name: 'sessionStorage read/write',
    category: 'Storage Availability',
    fn: async () => {
      try {
        sessionStorage.setItem(`${TEST_PREFIX}ss`, 'test');
        const result = sessionStorage.getItem(`${TEST_PREFIX}ss`);
        sessionStorage.removeItem(`${TEST_PREFIX}ss`);
        return result === 'test' || 'Read value does not match written value';
      } catch (e) {
        return `sessionStorage error: ${e}`;
      }
    },
  },
  {
    name: 'Storage quota (1MB write)',
    category: 'Storage Availability',
    fn: async () => {
      const key = `${TEST_PREFIX}quota_1mb`;
      const data = 'x'.repeat(1024 * 1024);
      try {
        localStorage.setItem(key, data);
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        return `1MB write failed: ${e}`;
      }
    },
  },
  
  // Basic Operations Tests
  {
    name: 'Save and load string',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}string`;
      const data = 'Hello, World!';
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<string>(key);
      await SaveSystem.delete(key);
      return loaded === data || `Expected "${data}", got "${loaded}"`;
    },
  },
  {
    name: 'Save and load number',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}number`;
      const data = 42.5;
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<number>(key);
      await SaveSystem.delete(key);
      return loaded === data || `Expected ${data}, got ${loaded}`;
    },
  },
  {
    name: 'Save and load object',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}object`;
      const data = { name: 'Test', value: 123, nested: { a: 1, b: 2 } };
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<typeof data>(key);
      await SaveSystem.delete(key);
      return JSON.stringify(loaded) === JSON.stringify(data) || 'Object mismatch';
    },
  },
  {
    name: 'Save and load array',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}array`;
      const data = [1, 'two', { three: 3 }, [4, 5]];
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<typeof data>(key);
      await SaveSystem.delete(key);
      return JSON.stringify(loaded) === JSON.stringify(data) || 'Array mismatch';
    },
  },
  {
    name: 'Save with special characters',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}special`;
      const data = 'Line1\nLine2\t"quoted" \'apostrophe\' \\backslash';
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<string>(key);
      await SaveSystem.delete(key);
      return loaded === data || 'Special characters corrupted';
    },
  },
  {
    name: 'Save with unicode/emoji',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}unicode`;
      const data = '你好世界 🎮 🔥 émojis Ñoño';
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<string>(key);
      await SaveSystem.delete(key);
      return loaded === data || 'Unicode/emoji corrupted';
    },
  },
  {
    name: 'Delete existing key',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}delete`;
      await SaveSystem.saveImmediate(key, 'to delete');
      await SaveSystem.delete(key);
      return !SaveSystem.exists(key) || 'Key still exists after delete';
    },
  },
  {
    name: 'Delete non-existent key',
    category: 'Basic Operations',
    fn: async () => {
      const result = await SaveSystem.delete(`${TEST_PREFIX}nonexistent`);
      return result || 'Delete of non-existent key should succeed';
    },
  },
  {
    name: 'Check exists for existing key',
    category: 'Basic Operations',
    fn: async () => {
      const key = `${TEST_PREFIX}exists`;
      await SaveSystem.saveImmediate(key, 'exists');
      const exists = SaveSystem.exists(key);
      await SaveSystem.delete(key);
      return exists || 'Key should exist';
    },
  },
  {
    name: 'Check exists for non-existent key',
    category: 'Basic Operations',
    fn: async () => {
      return !SaveSystem.exists(`${TEST_PREFIX}nokey`) || 'Non-existent key should not exist';
    },
  },
  
  // Data Integrity Tests
  {
    name: 'Large object (100KB+)',
    category: 'Data Integrity',
    fn: async () => {
      const key = `${TEST_PREFIX}large`;
      const data = { large: 'x'.repeat(100 * 1024) };
      await SaveSystem.saveImmediate(key, data);
      const loaded = await SaveSystem.load<typeof data>(key);
      await SaveSystem.delete(key);
      return loaded?.large.length === data.large.length || 'Data truncated';
    },
  },
  {
    name: 'Checksum verification',
    category: 'Data Integrity',
    fn: async () => {
      const key = `${TEST_PREFIX}checksum`;
      await SaveSystem.saveImmediate(key, { test: 'data' });
      const result = SaveSystem.verify(key);
      await SaveSystem.delete(key);
      return result.valid && result.checksumMatch || `Verification failed: ${result.error}`;
    },
  },
  {
    name: 'Detect corrupted data',
    category: 'Data Integrity',
    fn: async () => {
      const key = `${TEST_PREFIX}corrupt`;
      await SaveSystem.saveImmediate(key, { test: 'original' });
      
      // Manually corrupt the data
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.data = { test: 'corrupted' }; // Change data without updating checksum
        localStorage.setItem(key, JSON.stringify(parsed));
      }
      
      const result = SaveSystem.verify(key);
      await SaveSystem.delete(key);
      return !result.checksumMatch || 'Corruption should be detected';
    },
  },
  
  // Race Condition Tests
  {
    name: 'Rapid saves (10 in 100ms)',
    category: 'Race Conditions',
    fn: async () => {
      const key = `${TEST_PREFIX}rapid`;
      const promises: Promise<boolean>[] = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(SaveSystem.save(key, { iteration: i }));
        await new Promise(r => setTimeout(r, 10));
      }
      
      await Promise.all(promises);
      await new Promise(r => setTimeout(r, 500)); // Wait for debounce
      
      const loaded = await SaveSystem.load<{ iteration: number }>(key);
      await SaveSystem.delete(key);
      
      // Should have the last value
      return loaded?.iteration === 9 || `Expected iteration 9, got ${loaded?.iteration}`;
    },
  },
  {
    name: 'Concurrent save/load',
    category: 'Race Conditions',
    fn: async () => {
      const key = `${TEST_PREFIX}concurrent`;
      await SaveSystem.saveImmediate(key, { value: 'initial' });
      
      const [, loaded] = await Promise.all([
        SaveSystem.saveImmediate(key, { value: 'updated' }),
        SaveSystem.load<{ value: string }>(key),
      ]);
      
      await SaveSystem.delete(key);
      
      // Either value is acceptable, just shouldn't crash
      return loaded?.value === 'initial' || loaded?.value === 'updated' || 
        `Got unexpected value: ${loaded?.value}`;
    },
  },
  
  // Recovery Tests
  {
    name: 'Load malformed JSON',
    category: 'Recovery',
    fn: async () => {
      const key = `${TEST_PREFIX}malformed`;
      localStorage.setItem(key, 'not valid json {{{');
      
      const loaded = await SaveSystem.load(key);
      localStorage.removeItem(key);
      
      return loaded === null || 'Should return null for malformed JSON';
    },
  },
  {
    name: 'Export/Import cycle',
    category: 'Recovery',
    fn: async () => {
      const key = `${TEST_PREFIX}export`;
      await SaveSystem.saveImmediate(key, { exportTest: true });
      
      const exported = SaveSystem.exportAll();
      await SaveSystem.delete(key);
      
      SaveSystem.importAll(exported);
      
      const loaded = await SaveSystem.load<{ exportTest: boolean }>(key);
      await SaveSystem.delete(key);
      
      return loaded?.exportTest === true || 'Export/import failed';
    },
  },
  
  // System Tests
  {
    name: 'Write/Read cycle test',
    category: 'System',
    fn: async () => {
      const result = await SaveSystem.testWriteReadCycle();
      return result.success || result.error || 'Unknown failure';
    },
  },
  {
    name: 'Storage info retrieval',
    category: 'System',
    fn: async () => {
      const info = SaveSystem.getStorageInfo();
      return (
        info.backend !== undefined &&
        typeof info.used === 'number' &&
        typeof info.quota === 'number'
      ) || 'Invalid storage info';
    },
  },
  {
    name: 'Operation logging',
    category: 'System',
    fn: async () => {
      const key = `${TEST_PREFIX}logging`;
      const initialLog = SaveSystem.getOperationLog().length;
      
      await SaveSystem.saveImmediate(key, 'test');
      await SaveSystem.load(key);
      await SaveSystem.delete(key);
      
      const finalLog = SaveSystem.getOperationLog().length;
      return finalLog >= initialLog + 3 || 'Operations not logged';
    },
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

export async function runAllTests(): Promise<TestSuiteResult> {
  const startTime = Date.now();
  const results: TestResult[] = [];
  
  // Cleanup before tests
  cleanupTestKeys();
  
  for (const test of tests) {
    const testStart = Date.now();
    let passed = false;
    let error: string | undefined;
    
    try {
      const result = await test.fn();
      if (result === true) {
        passed = true;
      } else if (typeof result === 'string') {
        error = result;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    
    results.push({
      name: test.name,
      category: test.category,
      passed,
      error,
      duration: Date.now() - testStart,
    });
  }
  
  // Cleanup after tests
  cleanupTestKeys();
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    duration: Date.now() - startTime,
    results,
  };
}

export async function runTestsByCategory(category: string): Promise<TestSuiteResult> {
  const filtered = tests.filter(t => t.category === category);
  const startTime = Date.now();
  const results: TestResult[] = [];
  
  cleanupTestKeys();
  
  for (const test of filtered) {
    const testStart = Date.now();
    let passed = false;
    let error: string | undefined;
    
    try {
      const result = await test.fn();
      if (result === true) {
        passed = true;
      } else if (typeof result === 'string') {
        error = result;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    
    results.push({
      name: test.name,
      category: test.category,
      passed,
      error,
      duration: Date.now() - testStart,
    });
  }
  
  cleanupTestKeys();
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    duration: Date.now() - startTime,
    results,
  };
}

export function getTestCategories(): string[] {
  return [...new Set(tests.map(t => t.category))];
}

export function getTestCount(): number {
  return tests.length;
}
