// ============================================================================
// GOLDEN SAVE TEST FIXTURES
// Test saves for validating migration and recovery pipeline
// ============================================================================

import { GameSave } from '@/lib/saveSystem';

// ============================================================================
// V1 MINIMAL - Bare minimum save structure
// ============================================================================

export const V1_MINIMAL: Record<string, unknown> = {
  id: 'golden-v1-minimal',
  characterName: 'Test Hero',
  timestamp: 1700000000000,
  dateFormatted: '2023-11-14',
  slotNumber: 1,
  version: 1, // Legacy version field
  gameData: {
    player: {
      name: 'Test Hero',
      hp: 100,
      maxHp: 100,
      level: 1,
    },
  },
};

// ============================================================================
// V1 MIDGAME - More complete v1 save with progress
// ============================================================================

export const V1_MIDGAME: Record<string, unknown> = {
  id: 'golden-v1-midgame',
  characterName: 'Aria Shadowmend',
  timestamp: 1700100000000,
  dateFormatted: '2023-11-15',
  slotNumber: 2,
  version: 1,
  gameData: {
    player: {
      name: 'Aria Shadowmend',
      hp: 85,
      maxHp: 120,
      level: 5,
      xp: 2450,
      class: 'Rogue',
      stats: {
        strength: 12,
        dexterity: 18,
        constitution: 14,
        intelligence: 10,
        wisdom: 13,
        charisma: 15,
      },
    },
    // Legacy npcMemory format (should trigger migration)
    npcMemory: {
      'npc-tavern-keeper': {
        trust: 75,
        affection: 50,
        lastInteraction: 1700095000000,
      },
      'npc-merchant': {
        trust: 30,
        affection: 20,
        lastInteraction: 1700090000000,
      },
    },
    // Legacy knowledge object format
    knowledge: {
      'secret-passage-location': { discovered: true, tick: 150 },
      'mayor-corruption': { discovered: true, tick: 200 },
    },
    narrativeHistory: [
      { id: 'entry-1', type: 'narration', content: 'You arrive in the village.', tick: 1 },
      { id: 'entry-2', type: 'action', content: 'I look around.', tick: 2 },
      { id: 'entry-3', type: 'narration', content: 'The tavern beckons.', tick: 3 },
    ],
    inventory: [
      { id: 'item-1', name: 'Dagger', quantity: 1 },
      { id: 'item-2', name: 'Health Potion', quantity: 3 },
    ],
    currentTick: 250,
    escalationTier: 2,
  },
};

// ============================================================================
// V2 SOCIAL-HEAVY - Save with extensive relationship data
// ============================================================================

export const V2_SOCIAL_HEAVY: Record<string, unknown> = {
  id: 'golden-v2-social',
  characterName: 'Marcus Diplomaticus',
  timestamp: 1700200000000,
  dateFormatted: '2023-11-17',
  slotNumber: 3,
  saveVersion: 2,
  subsystemVersions: { relationships: 1 },
  gameData: {
    player: {
      name: 'Marcus Diplomaticus',
      hp: 100,
      maxHp: 100,
      level: 8,
    },
    relationships: {
      edges: [
        { from: 'player', to: 'npc-queen', type: 'ally', strength: 85 },
        { from: 'player', to: 'npc-advisor', type: 'rival', strength: -40 },
        { from: 'player', to: 'npc-guard-captain', type: 'friend', strength: 60 },
        { from: 'npc-queen', to: 'npc-advisor', type: 'distrust', strength: -20 },
        // Orphan edge - references non-existent NPC
        { from: 'player', to: 'npc-deleted-char', type: 'enemy', strength: -80 },
      ],
      nodes: {
        'npc-queen': { name: 'Queen Elara', role: 'ruler' },
        'npc-advisor': { name: 'Lord Vane', role: 'antagonist' },
        'npc-guard-captain': { name: 'Captain Ryker', role: 'ally' },
        // npc-deleted-char intentionally missing to test orphan detection
      },
    },
    factionRep: {
      'crown': 80,
      'merchants-guild': 45,
      'thieves-guild': -30,
    },
    narrativeHistory: Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i}`,
      type: i % 2 === 0 ? 'narration' : 'dialogue',
      content: `Story entry ${i}`,
      tick: i + 1,
    })),
    eventHistory: Array.from({ length: 100 }, (_, i) => ({
      type: 'social',
      data: { npc: `npc-${i % 5}`, action: 'talked' },
      ts: 1700200000000 + i * 1000,
    })),
  },
};

// ============================================================================
// V3 NEEDS-ACTIVE - Save with active needs system
// ============================================================================

export const V3_NEEDS_ACTIVE: Record<string, unknown> = {
  id: 'golden-v3-needs',
  characterName: 'Survivor Jane',
  timestamp: 1700300000000,
  dateFormatted: '2023-11-18',
  slotNumber: 4,
  saveVersion: 3,
  subsystemVersions: { relationships: 1, knowledge: 1 },
  gameData: {
    player: {
      name: 'Survivor Jane',
      hp: 65,
      maxHp: 100,
      level: 4,
    },
    // Needs with some out-of-range values (should be clamped)
    needs: {
      physical: {
        hunger: 25,
        thirst: 15,
        energy: 40,
        bladder: 80,
        hygiene: 30,
        health: 65,
      },
      psychological: {
        stress: 75,
        tension: 60,
        comfort: 25,
        social: 20,
        fulfillment: 35,
      },
    },
    // Missing lastNeedTickTs - should be added
    relationships: {
      edges: [],
      nodes: {},
    },
    knowledgeTuples: [
      ['water-source-location', { discovered: true, tick: 50 }],
      ['safe-shelter', { discovered: true, tick: 75 }],
    ],
    eventHistory: Array.from({ length: 50 }, (_, i) => ({
      eventId: `evt-${i}`,
      type: 'survival',
      ts: 1700300000000 + i * 60000,
    })),
    narrativeHistory: [
      { id: 'n-1', type: 'narration', content: 'The wasteland stretches before you.', tick: 1 },
      { id: 'n-2', type: 'action', content: 'I search for water.', tick: 2 },
    ],
    inventory: [
      { id: 'water-bottle', name: 'Water Bottle', quantity: 1 },
      { id: 'canned-food', name: 'Canned Food', quantity: 2 },
    ],
  },
};

// ============================================================================
// CORRUPTED PARTIAL - Intentionally broken save
// ============================================================================

export const CORRUPTED_PARTIAL: Record<string, unknown> = {
  id: 'golden-corrupted',
  characterName: 'Broken Save',
  timestamp: 1700400000000,
  dateFormatted: '2023-11-19',
  slotNumber: 5,
  saveVersion: 5,
  gameData: {
    player: {
      name: 'Broken Save',
      hp: 'invalid', // String instead of number
      maxHp: 100,
      level: '3', // String instead of number
    },
    // Missing needs entirely
    relationships: {
      edges: [
        null, // Null in array
        { from: 'player', to: 'npc-ghost', type: 'ally', strength: 50 },
        undefined, // Undefined in array
        { from: 'player', to: null, type: 'enemy', strength: -50 }, // Null reference
      ],
      nodes: {
        // npc-ghost intentionally missing
      },
    },
    // Corrupted narrative history
    narrativeHistory: [
      { id: 'n-1', type: 'narration', content: 'Valid entry.', tick: 1 },
      null,
      { id: 'n-3', content: 'Missing type field.', tick: 3 },
      undefined,
      { id: 'n-5', type: 'action', content: 'Another valid entry.', tick: 5 },
    ],
    // Huge event history (should be truncated)
    eventHistory: Array.from({ length: 1000 }, (_, i) => ({
      type: 'test',
      data: { index: i },
    })),
    // Missing inventory, checkpoints, etc.
    factionRep: null,
    knowledge: {
      'broken-format': 'should-be-object',
    },
  },
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

export const ALL_GOLDEN_SAVES = {
  v1_minimal: V1_MINIMAL,
  v1_midgame: V1_MIDGAME,
  v2_social_heavy: V2_SOCIAL_HEAVY,
  v3_needs_active: V3_NEEDS_ACTIVE,
  corrupted: CORRUPTED_PARTIAL,
};

/**
 * Clone a golden save for testing (avoid mutating originals)
 */
export function cloneGoldenSave(save: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(save));
}

/**
 * Validate that a save meets minimum requirements after processing
 */
export function validateProcessedSave(save: unknown): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!save || typeof save !== 'object') {
    return { valid: false, issues: ['Not an object'] };
  }
  
  const s = save as Record<string, unknown>;
  
  // Required top-level fields
  if (typeof s.id !== 'string') issues.push('Missing id');
  if (typeof s.characterName !== 'string') issues.push('Missing characterName');
  if (typeof s.timestamp !== 'number') issues.push('Missing timestamp');
  if (typeof s.saveVersion !== 'number') issues.push('Missing saveVersion');
  
  // gameData structure
  const gd = s.gameData as Record<string, unknown> | undefined;
  if (!gd || typeof gd !== 'object') {
    issues.push('Missing gameData');
  } else {
    // Check for required subsystems
    if (!gd.player) issues.push('Missing player');
    if (!Array.isArray(gd.narrativeHistory)) issues.push('narrativeHistory not array');
    if (!Array.isArray(gd.eventHistory)) issues.push('eventHistory not array');
  }
  
  return { valid: issues.length === 0, issues };
}
