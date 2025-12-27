// ============================================================================
// TEST CORRUPTED SAVE - Utility to test recovery flow
// Injects a corrupted save into localStorage to trigger recovery
// ============================================================================

import { runInvariants } from '../invariants';
import { createFailureSnapshot } from '../pipeline';
import { ALL_GOLDEN_SAVES } from './goldenSaves';

/**
 * Injects a corrupted save into localStorage for testing recovery
 */
export function injectCorruptedSave(campaignId: string = 'test-campaign-corrupted'): void {
  const corruptedSave = ALL_GOLDEN_SAVES.corrupted;
  
  // Store in localStorage as a campaign
  const campaignData = {
    id: campaignId,
    meta: {
      id: campaignId,
      name: 'Corrupted Test Campaign',
      primaryGenre: 'fantasy',
      characterName: 'Test Hero',
      characterLevel: 5,
      playTime: 3600,
      chapterCount: 3,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    },
    player: null, // Missing player - will fail invariant
    worldBible: { genre: 'fantasy' },
    narrativeHistory: [null, undefined, 'invalid'], // Bad array entries
    chapters: [],
    currentChapter: { number: 1, title: 'Test', startedAt: Date.now() },
    checkpoints: [],
    currentTick: 10,
    gameData: corruptedSave.gameData,
    saveVersion: corruptedSave.saveVersion,
  };
  
  // Store campaign
  localStorage.setItem(`campaign_${campaignId}`, JSON.stringify(campaignData));
  
  // Update campaign index
  const indexKey = 'untold-campaign-index';
  const existingIndex = localStorage.getItem(indexKey);
  const index = existingIndex ? JSON.parse(existingIndex) : [];
  
  // Add if not already present
  if (!index.find((c: { id: string }) => c.id === campaignId)) {
    index.push(campaignData.meta);
    localStorage.setItem(indexKey, JSON.stringify(index));
  }
  
  console.log('[TestCorruptedSave] Injected corrupted save:', campaignId);
  console.log('[TestCorruptedSave] Reload the campaigns page to trigger recovery');
}

/**
 * Validates that a corrupted save would trigger recovery
 */
export function validateCorruptedSaveTriggersRecovery(): { 
  valid: boolean; 
  violations: { path: string; message: string; code: string; severity: string }[];
  wouldTriggerRecovery: boolean;
} {
  const corruptedSave = ALL_GOLDEN_SAVES.corrupted;
  const result = runInvariants(corruptedSave);
  
  return {
    valid: result.valid,
    violations: result.violations,
    wouldTriggerRecovery: !result.valid && result.violations.length > 0,
  };
}

/**
 * Creates a snapshot from corrupted save for testing
 */
export function createTestSnapshot(): ReturnType<typeof createFailureSnapshot> {
  const corruptedSave = ALL_GOLDEN_SAVES.corrupted;
  const invariantResult = runInvariants(corruptedSave);
  
  return createFailureSnapshot(
    'test-corrupted-campaign',
    corruptedSave,
    'TEST_CORRUPTION',
    'Manually triggered test corruption',
    invariantResult
  );
}

/**
 * Cleans up test data from localStorage
 */
export function cleanupTestData(campaignId: string = 'test-campaign-corrupted'): void {
  localStorage.removeItem(`campaign_${campaignId}`);
  
  const indexKey = 'untold-campaign-index';
  const existingIndex = localStorage.getItem(indexKey);
  if (existingIndex) {
    const index = JSON.parse(existingIndex);
    const filtered = index.filter((c: { id: string }) => c.id !== campaignId);
    localStorage.setItem(indexKey, JSON.stringify(filtered));
  }
  
  console.log('[TestCorruptedSave] Cleaned up test data');
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testRecovery = {
    injectCorruptedSave,
    validateCorruptedSaveTriggersRecovery,
    createTestSnapshot,
    cleanupTestData,
  };
  console.log('[TestCorruptedSave] Test utilities available at window.testRecovery');
}
