// ============================================================================
// CHOICE ANCHOR MANAGER - Timeline Navigation & State Snapshots
// ============================================================================

import {
  ChoiceAnchor,
  ChoiceAnchorStore,
  ChoiceType,
  OccurredAt,
  StateSnapshot,
  RewindScope,
  createOccurredAt,
  generateAnchorId,
  generateSnapshotId,
  generateBranchId,
  createDefaultChoiceAnchorStore,
} from '@/types/choiceAnchor';
import { ModifierState } from './buffDebuffSystem';
import { GameState } from '@/types/game';

// ============================================================================
// CHOICE DETECTION - Determines if an action creates an anchor
// ============================================================================

export interface ChoiceContext {
  optionsPresented: number;       // How many options were given
  isIrreversible: boolean;        // Attack, betrayal, vow, etc.
  isInaction: boolean;            // Declined an opportunity
  causesStateChange: boolean;     // Injury, trauma, faction shift
  resolvesLoop: boolean;          // Resolved or escalated a narrative loop
  description: string;            // What the choice was
}

/**
 * Determine if an action should create a choice anchor
 */
export function shouldCreateAnchor(context: ChoiceContext): { create: boolean; type?: ChoiceType } {
  // Player selected between ≥2 divergent options
  if (context.optionsPresented >= 2) {
    return { create: true, type: 'divergent_options' };
  }
  
  // Player committed to an irreversible action
  if (context.isIrreversible) {
    return { create: true, type: 'irreversible_action' };
  }
  
  // Player declined an opportunity
  if (context.isInaction) {
    return { create: true, type: 'inaction_with_consequence' };
  }
  
  // Major state change occurred
  if (context.causesStateChange) {
    return { create: true, type: 'major_state_change' };
  }
  
  // Resolved or escalated a loop
  if (context.resolvesLoop) {
    return { create: true, type: 'loop_resolution' };
  }
  
  return { create: false };
}

// ============================================================================
// SNAPSHOT CREATION - Captures game state at an anchor
// ============================================================================

/**
 * Create a state snapshot for fast rewind
 */
export function createSnapshot(
  anchorId: string,
  gameState: GameState,
  modifierState: ModifierState,
  turnId: number,
  worldTime?: { day: number; hour: number }
): StateSnapshot {
  const snapshotId = generateSnapshotId(anchorId, turnId);
  
  // Extract NPC dispositions
  const npcDispositions: Record<string, { trust: number; fear: number; escalationState: string }> = {};
  for (const [npcId, npc] of Object.entries(gameState.npcs || {})) {
    const playerRelation = npc.socialRanking?.['player'];
    npcDispositions[npcId] = {
      trust: playerRelation?.trust ?? 0,
      fear: playerRelation?.fear ?? 0,
      escalationState: npc.escalationState || 'POLITE_DISTANCE',
    };
  }
  
  return {
    id: snapshotId,
    anchorId,
    createdAt: createOccurredAt(turnId, worldTime),
    
    // Player stats
    playerStats: {
      health: gameState.player?.stats?.health ?? 100,
      energy: gameState.player?.stats?.energy ?? 100,
      mood: gameState.player?.stats?.mood ?? 50,
      hunger: gameState.player?.stats?.hunger ?? 50,
      gold: gameState.player?.stats?.gold ?? 0,
    },
    
    // Modifier state
    activeModifiers: modifierState.activeModifiers.map(m => m.id),
    modifierState: JSON.stringify(modifierState),
    
    // World state
    location: gameState.player?.currentLocation || 'unknown',
    npcDispositions,
    
    // Narrative state
    activeLoops: [], // TODO: Integrate with loop system
    questStates: {}, // TODO: Integrate with quest system
    inventory: gameState.player?.inventory?.map(i => i.id) || [],
    
    // Flags
    gameFlags: gameState.flags || {},
    worldPressure: gameState.worldEvolution?.socialStability ?? 50,
  };
}

// ============================================================================
// ANCHOR MANAGEMENT
// ============================================================================

/**
 * Create a new choice anchor with snapshot
 */
export function createChoiceAnchor(
  store: ChoiceAnchorStore,
  gameState: GameState,
  modifierState: ModifierState,
  choiceContext: ChoiceContext,
  campaignId: string,
  turnId: number,
  worldTime?: { day: number; hour: number }
): { store: ChoiceAnchorStore; anchor: ChoiceAnchor } {
  const { create, type } = shouldCreateAnchor(choiceContext);
  
  if (!create || !type) {
    return { store, anchor: null as unknown as ChoiceAnchor };
  }
  
  const anchorId = generateAnchorId();
  const snapshot = createSnapshot(anchorId, gameState, modifierState, turnId, worldTime);
  
  const anchor: ChoiceAnchor = {
    anchorId,
    campaignId,
    turnId,
    occurredAt: createOccurredAt(turnId, worldTime),
    location: gameState.player?.currentLocation || 'unknown',
    choiceSummary: choiceContext.description,
    choiceType: type,
    stateSnapshotId: snapshot.id,
    flags: [],
    rewindScope: 'scene',
    playerVisible: true,
  };
  
  // Add flags based on context
  if (choiceContext.causesStateChange) {
    anchor.flags.push('state_change');
  }
  if (choiceContext.isIrreversible) {
    anchor.flags.push('irreversible_warning');
  }
  
  const newStore: ChoiceAnchorStore = {
    ...store,
    anchors: [...store.anchors, anchor],
    snapshots: {
      ...store.snapshots,
      [snapshot.id]: snapshot,
    },
  };
  
  return { store: newStore, anchor };
}

/**
 * Get the nearest anchor before a given turn
 */
export function getNearestAnchor(
  store: ChoiceAnchorStore,
  beforeTurn: number
): ChoiceAnchor | null {
  const validAnchors = store.anchors
    .filter(a => a.turnId < beforeTurn && a.playerVisible)
    .sort((a, b) => b.turnId - a.turnId);
  
  return validAnchors[0] || null;
}

/**
 * Get all visible anchors for timeline display
 */
export function getVisibleAnchors(store: ChoiceAnchorStore): ChoiceAnchor[] {
  return store.anchors
    .filter(a => a.playerVisible)
    .sort((a, b) => a.turnId - b.turnId);
}

// ============================================================================
// REWIND SYSTEM
// ============================================================================

export interface RewindResult {
  success: boolean;
  reason?: string;
  restoredState?: {
    modifierState: ModifierState;
    playerStats: Record<string, number>;
    location: string;
    gameFlags: Record<string, boolean>;
  };
  newBranchId?: string;
}

/**
 * Validate if rewind is possible
 */
export function canRewind(
  store: ChoiceAnchorStore,
  anchorId: string
): { canRewind: boolean; reason?: string } {
  const anchor = store.anchors.find(a => a.anchorId === anchorId);
  
  if (!anchor) {
    return { canRewind: false, reason: 'Anchor not found' };
  }
  
  const snapshot = store.snapshots[anchor.stateSnapshotId];
  if (!snapshot) {
    return { canRewind: false, reason: 'Snapshot corrupted or missing' };
  }
  
  // Check if this is the current active branch
  const activeBranch = store.branchHistory.find(b => b.status === 'active');
  if (!activeBranch) {
    return { canRewind: false, reason: 'No active branch' };
  }
  
  return { canRewind: true };
}

/**
 * Perform rewind to an anchor
 */
export function rewindToAnchor(
  store: ChoiceAnchorStore,
  anchorId: string
): { store: ChoiceAnchorStore; result: RewindResult } {
  const { canRewind: can, reason } = canRewind(store, anchorId);
  
  if (!can) {
    return { store, result: { success: false, reason } };
  }
  
  const anchor = store.anchors.find(a => a.anchorId === anchorId)!;
  const snapshot = store.snapshots[anchor.stateSnapshotId];
  
  // Create new branch
  const newBranchId = generateBranchId();
  const now = new Date();
  
  // Mark all anchors after this one as orphaned (in the old branch)
  const updatedAnchors = store.anchors.map(a => {
    if (a.turnId > anchor.turnId) {
      return { ...a, playerVisible: false }; // Hide from timeline but don't delete
    }
    return a;
  });
  
  // Update branch history
  const updatedBranchHistory = [
    ...store.branchHistory.map(b => 
      b.branchId === store.currentBranchId 
        ? { ...b, status: 'orphaned' as const }
        : b
    ),
    {
      branchId: newBranchId,
      parentBranchId: store.currentBranchId,
      createdAt: {
        deviceTime: now.toISOString(),
        unix: now.getTime(),
        worldTime: anchor.occurredAt.worldTime,
        turnId: anchor.turnId,
      },
      status: 'active' as const,
      originAnchorId: anchorId,
    },
  ];
  
  // Restore modifier state
  let restoredModifierState: ModifierState;
  try {
    restoredModifierState = JSON.parse(snapshot.modifierState);
  } catch {
    return { store, result: { success: false, reason: 'Failed to parse modifier state' } };
  }
  
  const newStore: ChoiceAnchorStore = {
    ...store,
    anchors: updatedAnchors,
    currentBranchId: newBranchId,
    branchHistory: updatedBranchHistory,
  };
  
  return {
    store: newStore,
    result: {
      success: true,
      restoredState: {
        modifierState: restoredModifierState,
        playerStats: snapshot.playerStats,
        location: snapshot.location,
        gameFlags: snapshot.gameFlags,
      },
      newBranchId,
    },
  };
}

// ============================================================================
// SERIALIZATION
// ============================================================================

export function serializeChoiceAnchorStore(store: ChoiceAnchorStore): string {
  return JSON.stringify(store);
}

export function deserializeChoiceAnchorStore(data: string): ChoiceAnchorStore | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Get anchor count for UI display
 */
export function getAnchorStats(store: ChoiceAnchorStore): {
  totalAnchors: number;
  visibleAnchors: number;
  currentBranch: string;
  branchCount: number;
} {
  return {
    totalAnchors: store.anchors.length,
    visibleAnchors: store.anchors.filter(a => a.playerVisible).length,
    currentBranch: store.currentBranchId,
    branchCount: store.branchHistory.length,
  };
}
