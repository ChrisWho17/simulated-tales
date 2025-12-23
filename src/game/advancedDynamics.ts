// Phase 7: Advanced Dynamics
// NPC-NPC relationships, long-term world evolution, breakpoints, player death

import { GameState, NPC, GameEvent, Memory, Relationship } from '@/types/game';
import { createMemory, addMemory } from './worldSimulation';

// ============= BREAKPOINT SYSTEM =============

export type BreakpointType = 
  | 'TRUST_COLLAPSE'      // Relationship trust drops below threshold
  | 'IDENTITY_SHATTER'    // NPC's self-story is destroyed
  | 'NEED_CRISIS'         // Critical need unmet for too long
  | 'REVELATION'          // Major secret exposed
  | 'DEATH'               // Entity death
  | 'ALLIANCE_SHIFT'      // Faction allegiance change
  | 'POWER_VACUUM';       // Authority figure removed

export interface Breakpoint {
  id: string;
  type: BreakpointType;
  tick: number;
  trigger: string;
  affectedEntities: string[];
  worldStateChanges: WorldStateChange[];
  narrativeConsequences: string[];
  isResolved: boolean;
}

export interface WorldStateChange {
  type: 'relationship' | 'location' | 'npc_state' | 'faction' | 'resource';
  target: string;
  change: Record<string, any>;
}

export function detectBreakpoints(state: GameState, previousState?: GameState): Breakpoint[] {
  const breakpoints: Breakpoint[] = [];
  
  for (const npcId in state.npcs) {
    const npc = state.npcs[npcId];
    const prevNpc = previousState?.npcs[npcId];
    
    // Trust collapse detection
    const playerRelation = npc.relationships.player;
    const prevPlayerRelation = prevNpc?.relationships.player;
    if (playerRelation?.trust < -50 && (!prevPlayerRelation || prevPlayerRelation.trust >= -50)) {
      breakpoints.push({
        id: `bp_trust_${npcId}_${state.time.tick}`,
        type: 'TRUST_COLLAPSE',
        tick: state.time.tick,
        trigger: `${npc.meta.name}'s trust in you has shattered`,
        affectedEntities: [npcId, 'player'],
        worldStateChanges: [
          {
            type: 'relationship',
            target: npcId,
            change: { playerAccess: 'hostile', willShare: false },
          }
        ],
        narrativeConsequences: [
          `${npc.meta.name} will no longer confide in you`,
          `Other NPCs may hear about this betrayal`,
        ],
        isResolved: false,
      });
    }
    
    // Need crisis detection
    const criticalNeed = npc.needs.find(n => n.satisfaction < 10);
    const prevCriticalNeed = prevNpc?.needs.find(n => n.type === criticalNeed?.type);
    if (criticalNeed && (!prevCriticalNeed || prevCriticalNeed.satisfaction >= 10)) {
      breakpoints.push({
        id: `bp_need_${npcId}_${state.time.tick}`,
        type: 'NEED_CRISIS',
        tick: state.time.tick,
        trigger: `${npc.meta.name} is desperate - ${criticalNeed.type} need critical`,
        affectedEntities: [npcId],
        worldStateChanges: [
          {
            type: 'npc_state',
            target: npcId,
            change: { desperate: true, riskTolerance: 'high' },
          }
        ],
        narrativeConsequences: [
          `${npc.meta.name} may take drastic actions`,
          `Desperate people make dangerous allies - or enemies`,
        ],
        isResolved: false,
      });
    }
    
    // Identity shatter detection
    if (npc.stressLevel > 90 && npc.emotionalState.current === 'desperate') {
      breakpoints.push({
        id: `bp_identity_${npcId}_${state.time.tick}`,
        type: 'IDENTITY_SHATTER',
        tick: state.time.tick,
        trigger: `${npc.meta.name}'s sense of self is crumbling`,
        affectedEntities: [npcId],
        worldStateChanges: [
          {
            type: 'npc_state',
            target: npcId,
            change: { identityStable: false, behaviorPredictable: false },
          }
        ],
        narrativeConsequences: [
          `${npc.meta.name}'s behavior becomes erratic`,
          `Their relationships may shift unexpectedly`,
        ],
        isResolved: false,
      });
    }
  }
  
  return breakpoints;
}

// ============= NPC-NPC RELATIONSHIP DYNAMICS =============

export interface RelationshipDynamic {
  npc1: string;
  npc2: string;
  dynamicType: 'rivalry' | 'alliance' | 'romance' | 'mentorship' | 'enmity' | 'neutral';
  intensity: number; // 0-100
  stability: number; // 0-100, low = volatile
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  tick: number;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  impactOnDynamic: number; // -20 to +20
}

export function analyzeNPCRelationships(state: GameState): RelationshipDynamic[] {
  const dynamics: RelationshipDynamic[] = [];
  const npcIds = Object.keys(state.npcs);
  
  for (let i = 0; i < npcIds.length; i++) {
    for (let j = i + 1; j < npcIds.length; j++) {
      const npc1 = state.npcs[npcIds[i]];
      const npc2 = state.npcs[npcIds[j]];
      
      const ranking1 = npc1.socialRanking[npc2.id];
      const ranking2 = npc2.socialRanking[npc1.id];
      
      if (!ranking1 || !ranking2) continue;
      
      const avgTrust = (ranking1.trust + ranking2.trust) / 2;
      const avgIntimacy = (ranking1.intimacy + ranking2.intimacy) / 2;
      const avgFear = (ranking1.fear + ranking2.fear) / 2;
      
      let dynamicType: RelationshipDynamic['dynamicType'] = 'neutral';
      let intensity = Math.abs(avgTrust);
      
      if (avgTrust < -40) dynamicType = 'enmity';
      else if (avgTrust > 60 && avgIntimacy > 40) dynamicType = 'alliance';
      else if (avgIntimacy > 60 && avgTrust > 30) dynamicType = 'romance';
      else if (ranking1.fear > 50 || ranking2.fear > 50) dynamicType = 'rivalry';
      
      dynamics.push({
        npc1: npc1.id,
        npc2: npc2.id,
        dynamicType,
        intensity,
        stability: 100 - Math.abs(ranking1.trust - ranking2.trust), // Asymmetry = instability
        history: [],
      });
    }
  }
  
  return dynamics;
}

export function simulateRelationshipEvolution(
  dynamic: RelationshipDynamic,
  state: GameState
): { updatedDynamic: RelationshipDynamic; event?: RelationshipEvent } {
  const npc1 = state.npcs[dynamic.npc1];
  const npc2 = state.npcs[dynamic.npc2];
  
  if (!npc1 || !npc2) return { updatedDynamic: dynamic };
  
  // Check if they're in the same location
  if (npc1.currentLocation !== npc2.currentLocation) {
    // Distance might decay intensity slightly
    return {
      updatedDynamic: {
        ...dynamic,
        intensity: Math.max(0, dynamic.intensity - 0.1),
      },
    };
  }
  
  // They're together - relationship might evolve
  const chanceOfEvent = 0.1 + (100 - dynamic.stability) / 500; // Unstable = more events
  
  if (Math.random() > chanceOfEvent) {
    return { updatedDynamic: dynamic };
  }
  
  // Generate relationship event based on dynamic type
  let event: RelationshipEvent;
  
  switch (dynamic.dynamicType) {
    case 'enmity':
      event = {
        tick: state.time.tick,
        type: Math.random() > 0.7 ? 'positive' : 'negative',
        description: Math.random() > 0.7 
          ? `${npc1.meta.name} and ${npc2.meta.name} shared an unexpected civil moment`
          : `${npc1.meta.name} and ${npc2.meta.name} exchanged hostile glances`,
        impactOnDynamic: Math.random() > 0.7 ? -5 : 3,
      };
      break;
    case 'alliance':
      event = {
        tick: state.time.tick,
        type: 'positive',
        description: `${npc1.meta.name} and ${npc2.meta.name} reaffirmed their alliance`,
        impactOnDynamic: 2,
      };
      break;
    case 'romance':
      event = {
        tick: state.time.tick,
        type: Math.random() > 0.3 ? 'positive' : 'neutral',
        description: Math.random() > 0.3
          ? `${npc1.meta.name} and ${npc2.meta.name} shared a tender moment`
          : `${npc1.meta.name} and ${npc2.meta.name} seemed distant`,
        impactOnDynamic: Math.random() > 0.3 ? 3 : -2,
      };
      break;
    default:
      event = {
        tick: state.time.tick,
        type: 'neutral',
        description: `${npc1.meta.name} and ${npc2.meta.name} acknowledged each other`,
        impactOnDynamic: 1,
      };
  }
  
  return {
    updatedDynamic: {
      ...dynamic,
      intensity: Math.min(100, Math.max(0, dynamic.intensity + event.impactOnDynamic)),
      history: [...dynamic.history.slice(-10), event],
    },
    event,
  };
}

// ============= LONG-TERM WORLD EVOLUTION =============

export interface WorldEvolutionState {
  economicHealth: number; // 0-100
  socialStability: number; // 0-100
  resourceAvailability: Record<string, number>;
  powerStructure: PowerNode[];
  pendingShifts: WorldShift[];
}

export interface PowerNode {
  entityId: string;
  type: 'individual' | 'faction' | 'institution';
  influence: number;
  domain: string;
  rivals: string[];
  allies: string[];
}

export interface WorldShift {
  id: string;
  type: 'economic' | 'political' | 'social' | 'environmental';
  description: string;
  probability: number;
  ticksUntilResolution: number;
  potentialOutcomes: { description: string; probability: number }[];
}

export function initializeWorldEvolution(): WorldEvolutionState {
  return {
    economicHealth: 65,
    socialStability: 70,
    resourceAvailability: {
      food: 80,
      medicine: 60,
      labor: 75,
      wealth: 50,
    },
    powerStructure: [
      {
        entityId: 'npc_guard_james',
        type: 'individual',
        influence: 40,
        domain: 'security',
        rivals: [],
        allies: [],
      },
      {
        entityId: 'npc_martha',
        type: 'individual',
        influence: 30,
        domain: 'social',
        rivals: [],
        allies: ['npc_tom_merchant'],
      },
    ],
    pendingShifts: [],
  };
}

export function tickWorldEvolution(
  evolution: WorldEvolutionState,
  state: GameState
): { updated: WorldEvolutionState; events: string[] } {
  const events: string[] = [];
  let updated = { ...evolution };
  
  // Decay stability slightly over time
  updated.socialStability = Math.max(0, updated.socialStability - 0.05);
  
  // Resource fluctuation
  for (const resource in updated.resourceAvailability) {
    const fluctuation = (Math.random() - 0.5) * 2;
    updated.resourceAvailability[resource] = Math.max(0, Math.min(100,
      updated.resourceAvailability[resource] + fluctuation
    ));
    
    // Critical resource shortage
    if (updated.resourceAvailability[resource] < 20) {
      events.push(`${resource} supplies are critically low`);
      updated.socialStability = Math.max(0, updated.socialStability - 5);
    }
  }
  
  // Process pending shifts
  updated.pendingShifts = updated.pendingShifts.map(shift => ({
    ...shift,
    ticksUntilResolution: shift.ticksUntilResolution - 1,
  })).filter(shift => {
    if (shift.ticksUntilResolution <= 0) {
      // Resolve the shift
      const outcomeRoll = Math.random();
      let cumulative = 0;
      for (const outcome of shift.potentialOutcomes) {
        cumulative += outcome.probability;
        if (outcomeRoll <= cumulative) {
          events.push(`World shift resolved: ${outcome.description}`);
          break;
        }
      }
      return false;
    }
    return true;
  });
  
  // Generate new shifts occasionally
  if (Math.random() < 0.02) { // 2% chance per tick
    const newShift = generateRandomShift(state);
    updated.pendingShifts.push(newShift);
    events.push(`Rumors speak of ${newShift.description}`);
  }
  
  return { updated, events };
}

function generateRandomShift(state: GameState): WorldShift {
  const shiftTypes: WorldShift['type'][] = ['economic', 'political', 'social', 'environmental'];
  const type = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
  
  const shiftTemplates: Record<WorldShift['type'], { desc: string; outcomes: { description: string; probability: number }[] }[]> = {
    economic: [
      {
        desc: 'a merchant caravan approaching',
        outcomes: [
          { description: 'The caravan brings prosperity and new goods', probability: 0.6 },
          { description: 'The caravan was attacked by bandits', probability: 0.3 },
          { description: 'The caravan passes through without stopping', probability: 0.1 },
        ],
      },
    ],
    political: [
      {
        desc: 'tensions rising between factions',
        outcomes: [
          { description: 'A fragile peace is maintained', probability: 0.5 },
          { description: 'Open conflict erupts', probability: 0.3 },
          { description: 'A new alliance is formed', probability: 0.2 },
        ],
      },
    ],
    social: [
      {
        desc: 'whispers of a scandal',
        outcomes: [
          { description: 'The scandal proves baseless', probability: 0.4 },
          { description: 'A prominent figure is disgraced', probability: 0.4 },
          { description: 'The truth remains hidden', probability: 0.2 },
        ],
      },
    ],
    environmental: [
      {
        desc: 'changes in the weather patterns',
        outcomes: [
          { description: 'The weather returns to normal', probability: 0.5 },
          { description: 'A harsh season is coming', probability: 0.3 },
          { description: 'Unusual bounty from nature', probability: 0.2 },
        ],
      },
    ],
  };
  
  const template = shiftTemplates[type][Math.floor(Math.random() * shiftTemplates[type].length)];
  
  return {
    id: `shift_${Date.now()}`,
    type,
    description: template.desc,
    probability: 0.7 + Math.random() * 0.3,
    ticksUntilResolution: 24 + Math.floor(Math.random() * 72), // 1-4 days
    potentialOutcomes: template.outcomes,
  };
}

// ============= PLAYER DEATH HANDLING =============

export interface DeathState {
  isDead: boolean;
  causeOfDeath?: string;
  tick?: number;
  lastWords?: string;
  legacyEffects: LegacyEffect[];
}

export interface LegacyEffect {
  type: 'memory' | 'reputation' | 'item' | 'event';
  target: string;
  effect: string;
}

export function checkPlayerDeath(state: GameState): DeathState {
  const player = state.player;
  
  if (player.stats.health <= 0) {
    return {
      isDead: true,
      causeOfDeath: 'Your wounds proved fatal.',
      tick: state.time.tick,
      lastWords: 'The world grows dark...',
      legacyEffects: calculateLegacy(state),
    };
  }
  
  if (player.stats.hunger <= 0 && player.stats.health < 20) {
    return {
      isDead: true,
      causeOfDeath: 'Starvation claimed you.',
      tick: state.time.tick,
      lastWords: 'If only you had found food...',
      legacyEffects: calculateLegacy(state),
    };
  }
  
  return { isDead: false, legacyEffects: [] };
}

function calculateLegacy(state: GameState): LegacyEffect[] {
  const effects: LegacyEffect[] = [];
  
  // NPCs remember the player
  for (const npcId in state.npcs) {
    const npc = state.npcs[npcId];
    const relation = npc.relationships.player;
    
    if (relation) {
      if (relation.affection > 50) {
        effects.push({
          type: 'memory',
          target: npcId,
          effect: `${npc.meta.name} mourns your passing`,
        });
      } else if (relation.affection < -30) {
        effects.push({
          type: 'memory',
          target: npcId,
          effect: `${npc.meta.name} feels a grim satisfaction`,
        });
      }
    }
  }
  
  // Reputation becomes legend
  for (const faction in state.player.reputation) {
    const rep = state.player.reputation[faction];
    if (Math.abs(rep) > 50) {
      effects.push({
        type: 'reputation',
        target: faction,
        effect: rep > 0 
          ? `Your name is remembered fondly by ${faction}`
          : `Your infamy lives on among ${faction}`,
      });
    }
  }
  
  return effects;
}

export function generateDeathNarrative(death: DeathState, state: GameState): string {
  let narrative = `# The End\n\n`;
  narrative += `${death.causeOfDeath}\n\n`;
  narrative += `*${death.lastWords}*\n\n`;
  
  if (death.legacyEffects.length > 0) {
    narrative += `## Your Legacy\n\n`;
    death.legacyEffects.forEach(effect => {
      narrative += `• ${effect.effect}\n`;
    });
  }
  
  narrative += `\nYou survived ${state.time.day} days in this unforgiving world.`;
  
  return narrative;
}
