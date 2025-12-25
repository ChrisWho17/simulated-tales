// ============================================================================
// CHOICE ANCHOR SYSTEM - Timeline Navigation & State Snapshots
// ============================================================================

// Choice anchor types - what makes a meaningful choice
export type ChoiceType = 
  | 'divergent_options'      // Player selected between ≥2 divergent options
  | 'irreversible_action'    // Attack, betrayal, vow, etc.
  | 'inaction_with_consequence' // Declined an opportunity
  | 'major_state_change'     // Injury, trauma, faction shift
  | 'loop_resolution';       // Resolved or escalated a narrative loop

export type RewindScope = 'local' | 'scene' | 'session';

// Structured timestamp for precise tracking
export interface OccurredAt {
  deviceTime: string;   // ISO 8601 format: "2025-01-14T21:47:32-05:00"
  unix: number;         // Unix timestamp for sorting
  worldTime: string;    // In-game time: "Day 18, 21:47"
  turnId: number;       // For replay/debug
}

// Trigger event structure - separates data from narrative
export interface TriggerEvent {
  eventId: string;
  type: 'physical_injury' | 'psychological_trigger' | 'environmental' | 'combat' | 'social' | 'narrative';
  source: string;       // What caused it: "overheard_conversation", "combat_damage", etc.
  details: {
    stimulus?: string;  // The specific thing that triggered it
    emotionalContext?: string[];
    perceivedThreat?: boolean;
    bodyPart?: string;
    damageType?: string;
    location?: string;
  };
}

// Choice Anchor - a hard bookmark in the timeline
export interface ChoiceAnchor {
  anchorId: string;
  campaignId: string;
  turnId: number;
  occurredAt: OccurredAt;
  location: string;
  choiceSummary: string;        // "You chose to stay silent and listen."
  choiceType: ChoiceType;
  linkedEventId?: string;       // Reference to the game event
  stateSnapshotId: string;
  flags: string[];              // ["psychological_risk", "hidden_consequence"]
  rewindScope: RewindScope;
  playerVisible: boolean;
}

// State snapshot for fast rewind
export interface StateSnapshot {
  id: string;
  anchorId: string;
  createdAt: OccurredAt;
  
  // Core state to restore
  playerStats: Record<string, number>;
  activeModifiers: string[];    // Serialized modifier IDs
  modifierState: string;        // Full serialized modifier state
  
  // World state
  location: string;
  npcDispositions: Record<string, {
    trust: number;
    fear: number;
    escalationState: string;
  }>;
  
  // Narrative state
  activeLoops: string[];
  questStates: Record<string, string>;
  inventory: string[];          // Item IDs
  
  // Flags and progress
  gameFlags: Record<string, boolean>;
  worldPressure: number;
}

// Choice anchor store
export interface ChoiceAnchorStore {
  anchors: ChoiceAnchor[];
  snapshots: Record<string, StateSnapshot>;
  currentBranchId: string;
  branchHistory: {
    branchId: string;
    parentBranchId?: string;
    createdAt: OccurredAt;
    status: 'active' | 'orphaned' | 'abandoned';
    originAnchorId?: string;
  }[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createOccurredAt(
  turnId: number,
  worldTime?: { day: number; hour: number }
): OccurredAt {
  const now = new Date();
  return {
    deviceTime: now.toISOString(),
    unix: now.getTime(),
    worldTime: worldTime 
      ? `Day ${worldTime.day}, ${String(worldTime.hour).padStart(2, '0')}:00`
      : 'Unknown',
    turnId,
  };
}

export function formatDeviceTime(deviceTime: string): string {
  try {
    const date = new Date(deviceTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' — ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Time Unknown';
  }
}

export function createTriggerEvent(
  eventId: string,
  type: TriggerEvent['type'],
  source: string,
  details: TriggerEvent['details'] = {}
): TriggerEvent {
  return {
    eventId,
    type,
    source,
    details,
  };
}

export function generateAnchorId(): string {
  return `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export function generateSnapshotId(anchorId: string, turnId: number): string {
  return `snapshot_${anchorId}_${turnId}`;
}

export function generateBranchId(): string {
  return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
}

// Validation - ensure required fields exist
export function validateModifierTimestamp(occurredAt?: OccurredAt): boolean {
  if (!occurredAt) return false;
  return !!(occurredAt.deviceTime && occurredAt.unix && occurredAt.turnId >= 0);
}

export function validateTriggerEvent(triggerEvent?: TriggerEvent): boolean {
  if (!triggerEvent) return false;
  return !!(triggerEvent.eventId && triggerEvent.type && triggerEvent.source);
}

// Initialize empty choice anchor store
export function createDefaultChoiceAnchorStore(campaignId: string): ChoiceAnchorStore {
  const now = new Date();
  const branchId = generateBranchId();
  
  return {
    anchors: [],
    snapshots: {},
    currentBranchId: branchId,
    branchHistory: [{
      branchId,
      createdAt: {
        deviceTime: now.toISOString(),
        unix: now.getTime(),
        worldTime: 'Campaign Start',
        turnId: 0,
      },
      status: 'active',
    }],
  };
}
