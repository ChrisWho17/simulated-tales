// ============================================================================
// SYSTEM INTEGRATIONS - Wires up event bus subscriptions between systems
// This is where the missing links get connected
// ============================================================================

import { eventBus, ItemEvent, RelationshipEvent, NeedEvent, ReputationEvent } from './eventBus';
import { 
  applyGiftModifier, 
  applyStealModifier, 
  seedNPCRelationshipFromReputation,
  getPlayerRelationship 
} from './unifiedRelationshipStore';
// Note: Inventory system imports will be added when new inventory system is provided
// Stub functions for now
function transferObject(...args: any[]): void {}
function getObject(id: string): any { return null; }
function getObjectOwner(id: string): any { return null; }
function getInventory(type: string, id: string): any[] { return []; }
import { processNeedDecay, checkDesperation, NEED_EFFECTS } from './needsSystem';
import { PlayerNeeds } from '@/types/lifeSim';
import { WorldReputation, getReputationLevel } from './reputationSystem';

// ============= INTEGRATION STATE =============

let isInitialized = false;
let currentTick = 0;

// ============= ITEM → RELATIONSHIP INTEGRATION =============

/**
 * When items are gifted, automatically update relationships
 */
function handleItemGifted(event: ItemEvent): void {
  const { fromEntity, toEntity, itemId } = event.data;
  if (!fromEntity || !toEntity) return;
  
  // Get item value for relationship modifier calculation
  const item = getObject(itemId);
  const itemValue = item?.properties.value || 10;
  
  // Apply gift modifier to relationship
  applyGiftModifier(fromEntity, toEntity, itemValue, event.tick);
  
  console.log(`[Integration] Gift from ${fromEntity} to ${toEntity} - relationship updated`);
}

/**
 * When items are stolen, automatically update relationships
 */
function handleItemStolen(event: ItemEvent): void {
  const { fromEntity, toEntity, itemId } = event.data;
  if (!fromEntity || !toEntity) return;
  
  const item = getObject(itemId);
  const itemValue = item?.properties.value || 10;
  
  // Check if theft was witnessed by looking at NPCs at the location
  // A theft is witnessed if there are other NPCs present at the tick
  const witnessEvents = eventBus.getEventsByType('LOCATION_ENTERED', 5);
  const recentLocationEvents = witnessEvents.filter(e => 
    e.tick >= event.tick - 1 && e.tick <= event.tick + 1
  );
  const wasWitnessed = recentLocationEvents.length > 0 || Math.random() < 0.3; // 30% chance even if no explicit witness
  
  // Apply steal modifier to relationship
  applyStealModifier(toEntity, fromEntity, itemValue, wasWitnessed, event.tick);
  
  console.log(`[Integration] Theft by ${toEntity} from ${fromEntity} - relationship damaged`);
}

// ============= FACT → INVENTORY INTEGRATION =============

/**
 * Process possession facts and sync to inventory
 * This is called when the narrative mentions the player getting/losing items
 */
export function processItemPossessionFact(
  entityId: string,
  itemName: string,
  action: 'gained' | 'lost' | 'transferred',
  targetEntity?: string,
  tick: number = 0
): void {
  // Find item in registry by name
  const allItems = [...getInventory('player', 'player')];
  const item = allItems.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
  
  if (action === 'gained' && !item) {
    // Item doesn't exist in registry - need to create it
    // This would be handled by the objectRegistrySystem
    console.log(`[Integration] Need to create item: ${itemName} for ${entityId}`);
    return;
  }
  
  if (action === 'lost' && item) {
    // Transfer item away from player
    const targetOwner = targetEntity || 'world';
    const targetType = targetEntity && targetEntity !== 'world' ? 'npc' : 'location';
    transferObject(item.id, targetType as any, targetOwner, 'narrative_fact', tick);
    
    eventBus.emit<ItemEvent>({
      type: 'ITEM_TRANSFERRED',
      tick,
      source: 'factProcessor',
      priority: 'normal',
      data: {
        itemId: item.id,
        itemName: item.name,
        fromEntity: entityId,
        toEntity: targetOwner,
        reason: 'narrative_fact',
      },
    });
  }
  
  if (action === 'transferred' && item && targetEntity) {
    const isGift = true; // Assume positive transfers are gifts
    if (isGift) {
      eventBus.emitItemGifted(item.id, item.name, entityId, targetEntity, tick);
    }
  }
}

// ============= REPUTATION → NPC TRUST SEEDING =============

/**
 * When player enters a new location, seed NPC relationships from faction/location reputation
 */
export function seedNPCsFromReputation(
  npcIds: string[],
  worldRep: WorldReputation,
  locationId: string,
  tick: number
): void {
  const locationRep = worldRep.locations[locationId];
  if (!locationRep) return;
  
  for (const npcId of npcIds) {
    // Check if NPC already has a relationship
    const existing = getPlayerRelationship(npcId);
    if (existing && existing.interactionCount > 0) continue;
    
    // Seed from location reputation
    seedNPCRelationshipFromReputation(npcId, locationRep.reputation, tick);
    console.log(`[Integration] Seeded ${npcId} trust from ${locationId} rep (${locationRep.reputation})`);
  }
}

// ============= NEEDS SYSTEM → CORE LOOP INTEGRATION =============

export interface NeedsTickResult {
  updatedNeeds: PlayerNeeds;
  criticalNeeds: string[];
  desperationState: ReturnType<typeof checkDesperation>;
  activeEffects: typeof NEED_EFFECTS;
}

/**
 * Process needs decay and emit events for critical states
 * This should be called from the game tick
 */
export function processNeedsTick(
  needs: PlayerNeeds,
  hoursElapsed: number,
  activityModifiers?: Record<string, number>,
  tick: number = 0
): NeedsTickResult {
  // Process decay
  const updatedNeeds = processNeedDecay(needs, hoursElapsed, activityModifiers as any);
  
  // Check for critical needs
  const criticalNeeds: string[] = [];
  
  // Physical needs
  if (updatedNeeds.physical.hunger <= 20) criticalNeeds.push('hunger');
  if (updatedNeeds.physical.thirst <= 20) criticalNeeds.push('thirst');
  if (updatedNeeds.physical.energy <= 20) criticalNeeds.push('energy');
  if (updatedNeeds.physical.health <= 30) criticalNeeds.push('health');
  if (updatedNeeds.physical.bladder >= 80) criticalNeeds.push('bladder');
  
  // Psychological needs (inverted - higher is worse)
  if (updatedNeeds.psychological.stress >= 70) criticalNeeds.push('stress');
  if (updatedNeeds.psychological.social <= 20) criticalNeeds.push('social');
  
  // Emit events for critical needs
  for (const need of criticalNeeds) {
    const value = need === 'bladder' ? updatedNeeds.physical.bladder :
                  need === 'stress' ? updatedNeeds.psychological.stress :
                  need in updatedNeeds.physical ? (updatedNeeds.physical as any)[need] :
                  (updatedNeeds.psychological as any)[need];
    
    eventBus.emitNeedCritical('player', need, value, tick);
  }
  
  // Check desperation state
  const desperationState = checkDesperation(updatedNeeds);
  
  // Get active effects based on current need levels
  const activeEffects = NEED_EFFECTS.filter(effect => {
    const value = effect.need in updatedNeeds.physical 
      ? (updatedNeeds.physical as any)[effect.need]
      : (updatedNeeds.psychological as any)[effect.need];
    
    // Inverted needs (higher is worse)
    if (effect.need === 'stress' || effect.need === 'tension' || effect.need === 'bladder') {
      return value >= effect.threshold;
    }
    return value <= effect.threshold;
  });
  
  return {
    updatedNeeds,
    criticalNeeds,
    desperationState,
    activeEffects,
  };
}

// ============= DIRECTOR / ARBITRATION LAYER =============

export type SystemPriority = 
  | 'SAFETY'      // Player death, critical needs
  | 'COMBAT'      // Active combat
  | 'SOCIAL'      // NPC interactions
  | 'EXPLORATION' // Movement, discovery
  | 'NARRATIVE'   // Story beats
  | 'AMBIENT';    // Background systems

export interface DirectorState {
  currentPriority: SystemPriority;
  cooldowns: Record<string, number>; // System -> tick when available
  escalationLevel: number; // 0-100 scene tension
  recentBeats: string[]; // Last N story beats for pacing
}

let directorState: DirectorState = {
  currentPriority: 'AMBIENT',
  cooldowns: {},
  escalationLevel: 0,
  recentBeats: [],
};

/**
 * Determine which system gets priority this tick
 */
export function resolveSystemPriority(context: {
  playerHealth: number;
  inCombat: boolean;
  criticalNeeds: string[];
  activeConversation: boolean;
  recentDamage: boolean;
}): SystemPriority {
  // SAFETY always wins
  if (context.playerHealth <= 10 || context.criticalNeeds.includes('health')) {
    return 'SAFETY';
  }
  
  // Combat takes precedence
  if (context.inCombat || context.recentDamage) {
    return 'COMBAT';
  }
  
  // Active social interactions
  if (context.activeConversation) {
    return 'SOCIAL';
  }
  
  // Critical needs that aren't health
  if (context.criticalNeeds.length > 0) {
    return 'SAFETY';
  }
  
  return 'AMBIENT';
}

/**
 * Check if a system is allowed to act based on cooldowns and priority
 */
export function canSystemAct(
  system: string,
  requiredPriority: SystemPriority,
  currentTick: number
): boolean {
  // Check cooldown
  const cooldownEnd = directorState.cooldowns[system] || 0;
  if (currentTick < cooldownEnd) return false;
  
  // Check priority hierarchy
  const priorityOrder: SystemPriority[] = ['SAFETY', 'COMBAT', 'SOCIAL', 'EXPLORATION', 'NARRATIVE', 'AMBIENT'];
  const currentPriorityIndex = priorityOrder.indexOf(directorState.currentPriority);
  const requiredIndex = priorityOrder.indexOf(requiredPriority);
  
  // Higher priority (lower index) can always act
  // Same priority can act
  // Lower priority (higher index) can only act if current priority is AMBIENT
  return requiredIndex <= currentPriorityIndex || directorState.currentPriority === 'AMBIENT';
}

/**
 * Set cooldown for a system
 */
export function setSystemCooldown(system: string, ticks: number, currentTick: number): void {
  directorState.cooldowns[system] = currentTick + ticks;
}

/**
 * Update director state for new tick
 */
export function updateDirectorState(
  newPriority: SystemPriority,
  storyBeat?: string,
  currentTick: number = 0
): void {
  directorState.currentPriority = newPriority;
  
  if (storyBeat) {
    directorState.recentBeats.push(storyBeat);
    if (directorState.recentBeats.length > 10) {
      directorState.recentBeats = directorState.recentBeats.slice(-10);
    }
  }
}

// ============= INITIALIZE INTEGRATIONS =============

export function initializeSystemIntegrations(): void {
  if (isInitialized) return;
  
  // Subscribe to item events
  eventBus.subscribe(['ITEM_GIFTED'], (event) => {
    handleItemGifted(event as ItemEvent);
  });
  
  eventBus.subscribe(['ITEM_STOLEN'], (event) => {
    handleItemStolen(event as ItemEvent);
  });
  
  // Subscribe to reputation events to potentially seed new NPCs
  eventBus.subscribe(['REPUTATION_CHANGED'], (event) => {
    const repEvent = event as ReputationEvent;
    console.log(`[Integration] Reputation changed at ${repEvent.data.locationId}: ${repEvent.data.previousValue} -> ${repEvent.data.newValue}`);
  });
  
  isInitialized = true;
  console.log('[SystemIntegrations] Initialized event bus subscriptions');
}

export function setIntegrationTick(tick: number): void {
  currentTick = tick;
  eventBus.setTick(tick);
}

// ============= CONTEXT BUILDER FOR AI =============

export function buildIntegratedSystemContext(context: {
  needs?: PlayerNeeds;
  worldRep?: WorldReputation;
  currentLocation?: string;
  tick?: number;
}): string {
  const lines: string[] = [];
  
  // Add needs context if critical
  if (context.needs) {
    const result = processNeedsTick(context.needs, 0, undefined, context.tick || 0);
    if (result.criticalNeeds.length > 0) {
      lines.push('## CRITICAL NEEDS');
      for (const need of result.criticalNeeds) {
        lines.push(`- ${need.toUpperCase()} is critically low`);
      }
      lines.push('');
    }
    
    if (result.desperationState.isDesparate) {
      lines.push('## DESPERATION');
      lines.push(`Player is desperate. Unlocked options: ${result.desperationState.unlockedOptions.join(', ')}`);
      lines.push('');
    }
  }
  
  // Add reputation context
  if (context.worldRep && context.currentLocation) {
    const locRep = context.worldRep.locations[context.currentLocation];
    if (locRep) {
      const level = getReputationLevel(locRep.reputation);
      lines.push(`## LOCATION REPUTATION`);
      lines.push(`Standing in ${locRep.locationName}: ${level.label} (${locRep.reputation})`);
      if (locRep.traits.length > 0) {
        lines.push(`Known for: ${locRep.traits.join(', ')}`);
      }
      lines.push('');
    }
  }
  
  // Add recent events from event bus
  const recentEvents = eventBus.getRecentEvents(5);
  if (recentEvents.length > 0) {
    lines.push('## RECENT EVENTS');
    for (const event of recentEvents) {
      const data = (event as any).data || {};
      lines.push(`- [${event.type}] ${Object.values(data).join(' ')}`);
    }
  }
  
  return lines.join('\n');
}

// Auto-initialize on import
initializeSystemIntegrations();
