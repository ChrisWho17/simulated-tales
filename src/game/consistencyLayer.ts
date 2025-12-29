// ============================================================================
// UNIFIED CONSISTENCY LAYER - Single source of truth for drift prevention
// Checks for and corrects inconsistencies across game systems
// ============================================================================

import { NPC, GameState } from '@/types/game';
import { eventBus, KnowledgeEvent } from './eventBus';
import { getPlayerRelationship, syncFromNPC, syncToNPC } from './unifiedRelationshipStore';
// Note: Inventory system imports will be added when new inventory system is provided

// ============= CONSISTENCY RULES =============

export interface ConsistencyViolation {
  id: string;
  type: ConsistencyViolationType;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  autoFixable: boolean;
  entities: string[];
  timestamp: number;
  tick: number;
}

export type ConsistencyViolationType =
  | 'RELATIONSHIP_DRIFT'      // NPC relationship doesn't match store
  | 'INVENTORY_MISMATCH'      // Item claimed but not in registry
  | 'KNOWLEDGE_LEAK'          // NPC knows something they shouldn't
  | 'PRESENCE_VIOLATION'      // Action requires presence that doesn't exist
  | 'DUPLICATE_ITEM'          // Same unique item in multiple places
  | 'DEAD_REFERENCE'          // Reference to non-existent entity
  | 'STATE_DESYNC';           // General state inconsistency

// ============= CONSISTENCY STATE =============

interface ConsistencyState {
  violations: ConsistencyViolation[];
  lastCheck: number;
  checksPerformed: number;
  autoFixesApplied: number;
}

let state: ConsistencyState = {
  violations: [],
  lastCheck: 0,
  checksPerformed: 0,
  autoFixesApplied: 0,
};

// ============= PRESENCE TRACKING =============

interface ScenePresence {
  entityId: string;
  entityType: 'player' | 'npc' | 'object';
  locationId: string;
  enteredTick: number;
}

let currentScenePresence: ScenePresence[] = [];

export function setScenePresence(entities: ScenePresence[]): void {
  currentScenePresence = entities;
}

export function addToScene(entity: ScenePresence): void {
  if (!currentScenePresence.find(e => e.entityId === entity.entityId)) {
    currentScenePresence.push(entity);
  }
}

export function removeFromScene(entityId: string): void {
  currentScenePresence = currentScenePresence.filter(e => e.entityId !== entityId);
}

export function isInScene(entityId: string): boolean {
  return entityId === 'player' || currentScenePresence.some(e => e.entityId === entityId);
}

export function getEntitiesInScene(): string[] {
  return ['player', ...currentScenePresence.map(e => e.entityId)];
}

export function getScenePresence(): ScenePresence[] {
  return currentScenePresence;
}

// ============= KNOWLEDGE GATING =============

interface KnowledgeFact {
  factId: string;
  content: string;
  knownBy: string[];  // Entity IDs who know this fact
  learnedAt: Record<string, number>;  // entityId -> tick when learned
  source: Record<string, string>;     // entityId -> how they learned it
}

let knowledgeRegistry: Record<string, KnowledgeFact> = {};

export function registerFact(factId: string, content: string, initialKnower: string, tick: number, source: string = 'witnessed'): void {
  if (!knowledgeRegistry[factId]) {
    knowledgeRegistry[factId] = {
      factId,
      content,
      knownBy: [initialKnower],
      learnedAt: { [initialKnower]: tick },
      source: { [initialKnower]: source },
    };
  }
}

export function shareKnowledge(factId: string, fromEntity: string, toEntity: string, tick: number): boolean {
  const fact = knowledgeRegistry[factId];
  if (!fact) return false;
  
  // Can't share what you don't know
  if (!fact.knownBy.includes(fromEntity)) {
    logViolation({
      type: 'KNOWLEDGE_LEAK',
      severity: 'warning',
      description: `${fromEntity} tried to share fact \"${factId}\" but doesn't know it`,
      autoFixable: false,
      entities: [fromEntity, toEntity],
      tick,
    });
    return false;
  }
  
  // Must be in scene to share (unless via message/letter)
  if (!isInScene(fromEntity) || !isInScene(toEntity)) {
    logViolation({
      type: 'PRESENCE_VIOLATION',
      severity: 'warning',
      description: `Knowledge sharing requires both parties in scene: ${fromEntity} -> ${toEntity}`,
      autoFixable: false,
      entities: [fromEntity, toEntity],
      tick,
    });
    return false;
  }
  
  // Add to known
  if (!fact.knownBy.includes(toEntity)) {
    fact.knownBy.push(toEntity);
    fact.learnedAt[toEntity] = tick;
    fact.source[toEntity] = `told_by:${fromEntity}`;
    
    // Emit knowledge event
    eventBus.emit<KnowledgeEvent>({
      type: 'FACT_LEARNED',
      tick,
      source: 'consistencyLayer',
      priority: 'normal',
      data: {
        learnerEntity: toEntity,
        sourceEntity: fromEntity,
        fact: fact.content,
        factType: 'shared',
        reliability: 0.8,
      },
    });
  }
  
  return true;
}

export function doesEntityKnow(entityId: string, factId: string): boolean {
  const fact = knowledgeRegistry[factId];
  return fact?.knownBy.includes(entityId) || false;
}

export function getEntityKnowledge(entityId: string): KnowledgeFact[] {
  return Object.values(knowledgeRegistry).filter(f => f.knownBy.includes(entityId));
}

// ============= VIOLATION LOGGING =============

function logViolation(violation: Omit<ConsistencyViolation, 'id' | 'timestamp'>): void {
  const fullViolation: ConsistencyViolation = {
    ...violation,
    id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
  };
  
  state.violations.push(fullViolation);
  
  // Keep only last 100 violations
  if (state.violations.length > 100) {
    state.violations = state.violations.slice(-100);
  }
  
  // Log to console for debugging
  console.warn(`[Consistency] ${violation.severity.toUpperCase()}: ${violation.description}`);
}

// ============= CONSISTENCY CHECKS =============

/**
 * Check relationship consistency between NPC objects and unified store
 */
export function checkRelationshipConsistency(npcs: NPC[], tick: number): ConsistencyViolation[] {
  const violations: ConsistencyViolation[] = [];
  
  for (const npc of npcs) {
    const storeEdge = getPlayerRelationship(npc.id);
    const npcRel = npc.relationships?.player;
    
    if (!storeEdge && npcRel) {
      // NPC has relationship data but store doesn't - sync to store
      syncFromNPC(npc, tick);
      state.autoFixesApplied++;
    } else if (storeEdge && npcRel) {
      // Check for significant drift
      const drift = Math.abs(storeEdge.metrics.trust - (npcRel.trust ?? 0)) +
                   Math.abs(storeEdge.metrics.respect - (npcRel.respect ?? 0));
      
      if (drift > 20) {
        violations.push({
          id: `rel_drift_${npc.id}`,
          type: 'RELATIONSHIP_DRIFT',
          severity: 'warning',
          description: `Relationship drift detected for ${npc.meta.name}: store vs NPC differ by ${drift}`,
          autoFixable: true,
          entities: [npc.id, 'player'],
          timestamp: Date.now(),
          tick,
        });
        
        // Auto-fix: store is source of truth
        syncToNPC(npc);
        state.autoFixesApplied++;
      }
    }
  }
  
  return violations;
}

/**
 * Check inventory consistency - items mentioned must exist
 */
export function checkInventoryConsistency(claimedItems: string[], ownerId: string, tick: number): ConsistencyViolation[] {
  const violations: ConsistencyViolation[] = [];
  // Note: Inventory checking will be re-implemented when new inventory system is provided
  console.log('[ConsistencyLayer] Inventory check skipped - awaiting new inventory system');
  return violations;
}

/**
 * Check for knowledge leaks - NPC actions requiring unknown facts
 */
export function validateNPCAction(
  npcId: string,
  action: string,
  requiredFacts: string[],
  tick: number
): { valid: boolean; blockedBy: string[] } {
  const blockedBy: string[] = [];
  
  for (const factId of requiredFacts) {
    if (!doesEntityKnow(npcId, factId)) {
      blockedBy.push(factId);
      logViolation({
        type: 'KNOWLEDGE_LEAK',
        severity: 'error',
        description: `NPC ${npcId} attempted action \"${action}\" requiring unknown fact: ${factId}`,
        autoFixable: false,
        entities: [npcId],
        tick,
      });
    }
  }
  
  return {
    valid: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Validate that an action can occur given scene presence
 */
export function validatePresenceForAction(
  actorId: string,
  targetId: string,
  actionType: 'speak' | 'give' | 'attack' | 'observe',
  tick: number
): boolean {
  const actorPresent = isInScene(actorId);
  const targetPresent = isInScene(targetId);
  
  if (!actorPresent) {
    logViolation({
      type: 'PRESENCE_VIOLATION',
      severity: 'error',
      description: `Actor ${actorId} not in scene for ${actionType} action`,
      autoFixable: false,
      entities: [actorId],
      tick,
    });
    return false;
  }
  
  if (!targetPresent) {
    logViolation({
      type: 'PRESENCE_VIOLATION',
      severity: 'error',
      description: `Target ${targetId} not in scene for ${actionType} action`,
      autoFixable: false,
      entities: [targetId],
      tick,
    });
    return false;
  }
  
  return true;
}

// ============= FULL CONSISTENCY CHECK =============

export function runFullConsistencyCheck(
  gameState: GameState,
  tick: number
): ConsistencyViolation[] {
  state.checksPerformed++;
  
  // Convert npcs Record to array if needed
  const npcsArray = Array.isArray(gameState.npcs) 
    ? gameState.npcs 
    : Object.values(gameState.npcs);
  state.lastCheck = tick;
  
  const allViolations: ConsistencyViolation[] = [];
  
  // Check relationships
  allViolations.push(...checkRelationshipConsistency(npcsArray, tick));
  
  // Add violations to state
  for (const v of allViolations) {
    if (!state.violations.find(existing => existing.id === v.id)) {
      state.violations.push(v);
    }
  }
  
  return allViolations;
}

// ============= STATE ACCESS =============

export function getConsistencyState(): ConsistencyState {
  return { ...state };
}

export function getRecentViolations(count: number = 20): ConsistencyViolation[] {
  return state.violations.slice(-count);
}

export function clearViolations(): void {
  state.violations = [];
}

export function getKnowledgeRegistry(): Record<string, KnowledgeFact> {
  return { ...knowledgeRegistry };
}

export function clearKnowledgeRegistry(): void {
  knowledgeRegistry = {};
}

// ============= CONTEXT FOR AI =============

export function buildConsistencyContextForAI(): string {
  const lines: string[] = [];
  
  // Scene presence
  const present = getEntitiesInScene();
  if (present.length > 1) {
    lines.push('## SCENE PRESENCE');
    lines.push(`Entities in scene: ${present.join(', ')}`);
    lines.push('');
  }
  
  // Recent violations
  const recentViolations = state.violations.filter(v => v.severity !== 'warning').slice(-5);
  if (recentViolations.length > 0) {
    lines.push('## CONSISTENCY WARNINGS');
    for (const v of recentViolations) {
      lines.push(`- ${v.type}: ${v.description}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============= SERIALIZATION =============

export function serializeConsistencyState(): string {
  return JSON.stringify({
    violations: state.violations,
    knowledgeRegistry,
    scenePresence: currentScenePresence,
  });
}

export function deserializeConsistencyState(data: string): void {
  try {
    const parsed = JSON.parse(data);
    state.violations = parsed.violations || [];
    knowledgeRegistry = parsed.knowledgeRegistry || {};
    currentScenePresence = parsed.scenePresence || [];
  } catch (e) {
    console.error('[ConsistencyLayer] Failed to deserialize:', e);
  }
}
