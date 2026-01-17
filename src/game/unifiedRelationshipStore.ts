// ============================================================================
// UNIFIED RELATIONSHIP STORE - Single Source of Truth for All Relationships
// Both NPC memory and relationship graph derive from this store
// Allows both systems to coexist with different access patterns
// ============================================================================

import { NPC } from '@/types/game';
import { eventBus } from './eventBus';

// ============= CORE RELATIONSHIP DATA =============

export interface RelationshipMetrics {
  // Core 3-Meter System (primary authority)
  trust: number;       // -100 to 100: Will they believe you?
  respect: number;     // -100 to 100: Will they follow you?
  attachment: number;  // 0 to 100: Will they miss you?
  
  // Additional metrics
  fear: number;        // 0 to 100
  affection: number;   // -100 to 100 (derived primarily from trust+attachment)
  familiarity: number; // 0 to 100: How well do they know you?
  
  // Romance subsystem
  attraction: number;  // -100 to 100
  romance: number;     // 0 to 100
  intimacy: number;    // 0 to 100
}

export interface RelationshipEdge {
  sourceId: string;
  targetId: string;
  metrics: RelationshipMetrics;
  
  // Metadata
  firstMet: number;      // Tick when first interaction
  lastInteraction: number;
  interactionCount: number;
  
  // Derived status (updated when metrics change)
  status: RelationshipStatus;
  tensionFlags: RelationshipTension[];
  
  // Evidence trail (for memory system integration)
  significantEvents: RelationshipEvent[];
}

export type RelationshipStatus = 
  | 'enemy' | 'hostile' | 'disliked' | 'neutral' | 'acquaintance' 
  | 'friendly' | 'friend' | 'close_friend' 
  | 'romantic_interest' | 'lover' | 'partner';

export type RelationshipTension = 
  | 'respects_but_distrusts'
  | 'trusts_but_doesnt_respect'
  | 'attached_but_wary'
  | 'respected_but_distant'
  | 'clingy_without_respect'
  | 'none';

export interface RelationshipEvent {
  tick: number;
  type: string;
  description: string;
  impact: Partial<RelationshipMetrics>;
}

// ============= STORE STATE =============

// Limits to prevent unbounded growth
const MAX_RELATIONSHIP_EDGES = 300;
const MAX_SIGNIFICANT_EVENTS_PER_EDGE = 15;

interface RelationshipStore {
  edges: Record<string, RelationshipEdge>; // Key: "sourceId->targetId"
  playerRelationships: Record<string, RelationshipEdge>; // Quick access: NPC ID -> edge to player
}

let store: RelationshipStore = {
  edges: {},
  playerRelationships: {},
};

const STORAGE_KEY = 'untold-relationship-store';

// ============= EDGE KEY HELPERS =============

function makeEdgeKey(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`;
}

function parseEdgeKey(key: string): { sourceId: string; targetId: string } | null {
  const parts = key.split('->');
  if (parts.length !== 2) return null;
  return { sourceId: parts[0], targetId: parts[1] };
}

// ============= DEFAULT METRICS =============

export function createDefaultMetrics(): RelationshipMetrics {
  return {
    trust: 0,
    respect: 0,
    attachment: 0,
    fear: 0,
    affection: 0,
    familiarity: 0,
    attraction: 0,
    romance: 0,
    intimacy: 0,
  };
}

// ============= STATUS CALCULATION =============

function calculateStatus(metrics: RelationshipMetrics): RelationshipStatus {
  const { trust, respect, familiarity, fear, romance } = metrics;
  const overall = (trust * 0.4) + (respect * 0.3) + (familiarity * 0.2) - (fear * 0.1);
  
  // Romance statuses take priority
  if (romance >= 80) return 'partner';
  if (romance >= 50) return 'lover';
  if (romance >= 25) return 'romantic_interest';
  
  // Otherwise use overall feeling
  if (overall <= -60) return 'enemy';
  if (overall <= -30) return 'hostile';
  if (overall <= -10) return 'disliked';
  if (overall <= 10) return 'neutral';
  if (overall <= 25) return 'acquaintance';
  if (overall <= 45) return 'friendly';
  if (overall <= 65) return 'friend';
  return 'close_friend';
}

function calculateTensions(metrics: RelationshipMetrics): RelationshipTension[] {
  const { trust, respect, attachment } = metrics;
  const flags: RelationshipTension[] = [];
  const HIGH = 50;
  const LOW = 25;
  
  if (respect >= HIGH && trust < LOW) flags.push('respects_but_distrusts');
  if (trust >= HIGH && respect < LOW) flags.push('trusts_but_doesnt_respect');
  if (attachment >= HIGH && trust < LOW) flags.push('attached_but_wary');
  if (respect >= HIGH && attachment < LOW) flags.push('respected_but_distant');
  if (attachment >= HIGH && respect < LOW) flags.push('clingy_without_respect');
  
  return flags.length > 0 ? flags : ['none'];
}

// ============= CORE OPERATIONS =============

export function getRelationship(sourceId: string, targetId: string): RelationshipEdge | null {
  const key = makeEdgeKey(sourceId, targetId);
  return store.edges[key] || null;
}

export function getPlayerRelationship(npcId: string): RelationshipEdge | null {
  return store.playerRelationships[npcId] || null;
}

export function getOrCreateRelationship(
  sourceId: string, 
  targetId: string, 
  currentTick: number = 0
): RelationshipEdge {
  const key = makeEdgeKey(sourceId, targetId);
  
  if (!store.edges[key]) {
    // Check edge limit before creating new edge
    const edgeCount = Object.keys(store.edges).length;
    if (edgeCount >= MAX_RELATIONSHIP_EDGES) {
      // Prune oldest non-player edges with lowest interaction count
      const pruneableEdges = Object.entries(store.edges)
        .filter(([k]) => !k.includes('player'))
        .sort((a, b) => a[1].interactionCount - b[1].interactionCount);
      
      const toRemove = Math.ceil(pruneableEdges.length * 0.1); // Remove 10%
      for (let i = 0; i < Math.min(toRemove, pruneableEdges.length); i++) {
        delete store.edges[pruneableEdges[i][0]];
      }
      console.log(`[RelationshipStore] Pruned ${toRemove} edges to stay under limit`);
    }

    const metrics = createDefaultMetrics();
    const edge: RelationshipEdge = {
      sourceId,
      targetId,
      metrics,
      firstMet: currentTick,
      lastInteraction: currentTick,
      interactionCount: 0,
      status: calculateStatus(metrics),
      tensionFlags: ['none'],
      significantEvents: [],
    };
    
    store.edges[key] = edge;
    
    // Quick access for player relationships
    if (sourceId === 'player') {
      store.playerRelationships[targetId] = edge;
    } else if (targetId === 'player') {
      store.playerRelationships[sourceId] = edge;
    }
  }
  
  return store.edges[key];
}

export function modifyRelationship(
  sourceId: string,
  targetId: string,
  changes: Partial<RelationshipMetrics>,
  reason: string,
  currentTick: number
): RelationshipEdge {
  const edge = getOrCreateRelationship(sourceId, targetId, currentTick);
  
  // Apply changes with clamping
  const previousMetrics = { ...edge.metrics };
  
  for (const [key, delta] of Object.entries(changes)) {
    const metric = key as keyof RelationshipMetrics;
    const min = metric === 'trust' || metric === 'respect' || metric === 'affection' || metric === 'attraction' ? -100 : 0;
    const max = 100;
    edge.metrics[metric] = Math.max(min, Math.min(max, edge.metrics[metric] + (delta as number)));
    
    // Emit event for significant changes (only for core metrics)
    const coreMetrics = ['trust', 'respect', 'attachment', 'fear', 'affection', 'romance'];
    if (Math.abs(delta as number) >= 5 && coreMetrics.includes(metric)) {
      eventBus.emitRelationshipChanged(
        sourceId,
        targetId,
        metric as any,
        previousMetrics[metric],
        edge.metrics[metric],
        reason,
        currentTick
      );
    }
  }
  
  // Update derived values
  edge.metrics.affection = Math.round((edge.metrics.trust + edge.metrics.attachment) / 2);
  
  // Recalculate status and tensions
  edge.status = calculateStatus(edge.metrics);
  edge.tensionFlags = calculateTensions(edge.metrics);
  edge.lastInteraction = currentTick;
  edge.interactionCount++;
  
  // Record significant event (with tighter threshold)
  if (Object.values(changes).some(v => Math.abs(v as number) >= 10)) {
    edge.significantEvents.push({
      tick: currentTick,
      type: reason.slice(0, 50), // Limit reason length
      description: reason.slice(0, 100),
      impact: changes,
    });
    
    // Keep only last N events - reduced from 20
    if (edge.significantEvents.length > MAX_SIGNIFICANT_EVENTS_PER_EDGE) {
      edge.significantEvents = edge.significantEvents.slice(-MAX_SIGNIFICANT_EVENTS_PER_EDGE);
    }
  }
  
  saveRelationshipStore();
  return edge;
}

// ============= GIFT/STEAL MODIFIERS =============

export function applyGiftModifier(
  giver: string,
  receiver: string,
  itemValue: number,
  currentTick: number
): RelationshipEdge {
  // Gifts increase trust and attachment
  const trustBoost = Math.min(15, Math.floor(itemValue / 10) + 5);
  const attachmentBoost = Math.min(10, Math.floor(itemValue / 15) + 3);
  
  return modifyRelationship(
    receiver,
    giver,
    { trust: trustBoost, attachment: attachmentBoost, affection: trustBoost },
    'received_gift',
    currentTick
  );
}

export function applyStealModifier(
  thief: string,
  victim: string,
  itemValue: number,
  wasWitnessed: boolean,
  currentTick: number
): RelationshipEdge {
  // Theft destroys trust and increases fear
  const trustLoss = -(Math.min(40, Math.floor(itemValue / 5) + 15));
  const fearIncrease = wasWitnessed ? Math.min(30, Math.floor(itemValue / 10) + 10) : 0;
  const respectLoss = wasWitnessed ? -10 : -5;
  
  return modifyRelationship(
    victim,
    thief,
    { trust: trustLoss, fear: fearIncrease, respect: respectLoss, affection: trustLoss },
    wasWitnessed ? 'witnessed_theft' : 'discovered_theft',
    currentTick
  );
}

// ============= REPUTATION SEEDING =============

export function seedNPCRelationshipFromReputation(
  npcId: string,
  factionRep: number, // -100 to 100
  currentTick: number
): RelationshipEdge {
  // Faction reputation seeds initial trust
  // If player is hated by faction, NPC starts distrustful
  const initialTrust = Math.floor(factionRep * 0.5); // 50% of rep as starting trust
  const initialRespect = Math.floor(factionRep * 0.3); // 30% of rep as respect
  
  const edge = getOrCreateRelationship(npcId, 'player', currentTick);
  
  // Only apply if this is a new relationship
  if (edge.interactionCount === 0) {
    edge.metrics.trust = Math.max(-50, Math.min(50, initialTrust));
    edge.metrics.respect = Math.max(-30, Math.min(30, initialRespect));
    edge.status = calculateStatus(edge.metrics);
    saveRelationshipStore();
  }
  
  return edge;
}

// ============= SYNC FROM NPC =============

export function syncFromNPC(npc: NPC, currentTick: number): RelationshipEdge {
  const npcRel = npc.relationships?.player;
  if (!npcRel) {
    return getOrCreateRelationship(npc.id, 'player', currentTick);
  }
  
  const edge = getOrCreateRelationship(npc.id, 'player', currentTick);
  
  // Sync values from NPC's relationship data
  edge.metrics.trust = npcRel.trust ?? edge.metrics.trust;
  edge.metrics.respect = npcRel.respect ?? edge.metrics.respect;
  edge.metrics.fear = npcRel.fear ?? edge.metrics.fear;
  edge.metrics.affection = npcRel.affection ?? edge.metrics.affection;
  
  // Handle extended properties if they exist
  const extRel = npcRel as any;
  if (extRel.familiarity !== undefined) edge.metrics.familiarity = extRel.familiarity;
  if (extRel.attraction !== undefined) edge.metrics.attraction = extRel.attraction;
  if (extRel.romance !== undefined) edge.metrics.romance = extRel.romance;
  if (extRel.intimacy !== undefined) edge.metrics.intimacy = extRel.intimacy;
  if (extRel.attachment !== undefined) edge.metrics.attachment = extRel.attachment;
  
  // Recalculate derived
  edge.status = calculateStatus(edge.metrics);
  edge.tensionFlags = calculateTensions(edge.metrics);
  
  return edge;
}

// ============= SYNC TO NPC =============

export function syncToNPC(npc: NPC): NPC {
  const edge = getPlayerRelationship(npc.id);
  if (!edge) return npc;
  
  return {
    ...npc,
    relationships: {
      ...npc.relationships,
      player: {
        affection: edge.metrics.affection,
        trust: edge.metrics.trust,
        fear: edge.metrics.fear,
        respect: edge.metrics.respect,
        // Extended properties
        familiarity: edge.metrics.familiarity,
        attraction: edge.metrics.attraction,
        romance: edge.metrics.romance,
        intimacy: edge.metrics.intimacy,
        attachment: edge.metrics.attachment,
      } as any,
    },
  };
}

// ============= PERSISTENCE =============

export function loadRelationshipStore(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure before using
      if (parsed && typeof parsed === 'object' && parsed.edges && parsed.playerRelationships) {
        store = parsed;
      } else {
        console.warn('[RelationshipStore] Invalid store structure, using empty');
      }
    }
  } catch (e) {
    console.error('[RelationshipStore] Failed to load:', e);
    // Reset to empty on parse failure
    store = { edges: {}, playerRelationships: {} };
  }
}

export function saveRelationshipStore(): void {
  try {
    // Validate store size before saving
    const edgeCount = Object.keys(store.edges).length;
    if (edgeCount > MAX_RELATIONSHIP_EDGES * 1.5) {
      console.warn(`[RelationshipStore] Store exceeds safe limit (${edgeCount} edges), pruning...`);
      // Force prune
      const pruneableEdges = Object.entries(store.edges)
        .filter(([k]) => !k.includes('player'))
        .sort((a, b) => a[1].interactionCount - b[1].interactionCount);
      
      const toRemove = edgeCount - MAX_RELATIONSHIP_EDGES;
      for (let i = 0; i < Math.min(toRemove, pruneableEdges.length); i++) {
        delete store.edges[pruneableEdges[i][0]];
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('[RelationshipStore] Failed to save:', e);
  }
}

export function clearRelationshipStore(): void {
  store = { edges: {}, playerRelationships: {} };
  localStorage.removeItem(STORAGE_KEY);
}

export function getRelationshipStore(): RelationshipStore {
  return store;
}

export function setRelationshipStore(newStore: RelationshipStore): void {
  store = newStore;
  saveRelationshipStore();
}

// ============= CONTEXT BUILDER FOR AI =============

export function buildRelationshipContextForAI(npcIds: string[]): string {
  const lines: string[] = ['## RELATIONSHIP STATUS'];
  
  for (const npcId of npcIds) {
    const edge = getPlayerRelationship(npcId);
    if (!edge) continue;
    
    const { metrics, status, tensionFlags } = edge;
    lines.push(`\n### ${npcId}`);
    lines.push(`Status: ${status}`);
    lines.push(`Trust: ${metrics.trust} | Respect: ${metrics.respect} | Attachment: ${metrics.attachment}`);
    
    if (metrics.fear > 20) {
      lines.push(`Fear level: ${metrics.fear} (they're afraid of player)`);
    }
    
    if (metrics.romance > 0) {
      lines.push(`Romance: ${metrics.romance} (romantic interest active)`);
    }
    
    const tensions = tensionFlags.filter(t => t !== 'none');
    if (tensions.length > 0) {
      lines.push(`Tensions: ${tensions.join(', ')}`);
    }
  }
  
  return lines.join('\n');
}

// ============= INITIALIZE =============

loadRelationshipStore();
