// World Simulation System - Autonomous NPC behavior, memory, and world events

import { GameState, NPC, GameEvent, Memory } from '@/types/game';
import { getTimePeriod } from './gameEngine';
import { detectBreakpoints, analyzeNPCRelationships, simulateRelationshipEvolution, tickWorldEvolution, initializeWorldEvolution, Breakpoint } from './advancedDynamics';
import { addStress, relieveStress, getStressTier, checkTraumaTrigger, processPsychologicalTick, createDefaultPsychState } from './psychologicalSystem';
import { processConsequences, createConsequence, Consequence, getDayPhase, getEnvironmentalEffects } from './consequenceSystem';
// Unified ambient system removed - no sound in game
// Placeholder types for compatibility
type UnifiedAmbientEntry = { id: string; text: string; type: string; category?: string; timestamp: number; involvedNPCs?: string[]; containsHook?: boolean };
type AmbientTickResult = { newEntries: UnifiedAmbientEntry[]; activeChatter: any[] };
const initializeUnifiedAmbient = () => {};
const processAmbientTick = (): AmbientTickResult => ({ newEntries: [], activeChatter: [] });
const getUnifiedAmbientFeed = (): UnifiedAmbientEntry[] => [];
const setAmbientGenre = () => {};
import {
  npcWeatherReactionSystem, 
  NPCWeatherPersonality,
  WeatherImpact,
  PhysicalBehavior 
} from './npcWeatherReactionSystem';
import { WeatherType } from './weatherSystem';

// ============= WORLD EVENT TYPES =============

export interface WorldEvent {
  id: string;
  tick: number;
  type: 'npc_action' | 'npc_interaction' | 'environmental' | 'social' | 'resource';
  description: string;
  involvedEntities: string[];
  location: string;
  visibility: 'public' | 'witnessed' | 'private' | 'secret';
  consequences: string[];
}

export interface WorldState {
  events: WorldEvent[];
  rumors: Rumor[];
  resourceLevels: Record<string, number>;
  environmentalConditions: EnvironmentalConditions;
}

export interface Rumor {
  id: string;
  originTick: number;
  originEvent: string;
  currentVersion: string;
  truthValue: number; // 0-100
  spreadCount: number;
  carriers: string[];
  emotionalCharge: 'fear' | 'hope' | 'anger' | 'shame' | 'excitement';
  mutations: string[];
}

export interface EnvironmentalConditions {
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  weatherSeverity: number; // 1-5
  temperature: 'freezing' | 'cold' | 'mild' | 'warm' | 'hot';
}

// ============= NPC AUTONOMOUS ACTIONS =============

export type AutonomousAction = 
  | 'MOVE'       // Go to location relevant to needs
  | 'ACQUIRE'    // Obtain resources
  | 'SOCIALIZE'  // Interact with another NPC
  | 'WORK'       // Perform role/job
  | 'REST'       // Recover from fatigue
  | 'HIDE'       // Avoid perceived threats
  | 'CONFRONT'   // Address conflict with another NPC
  | 'GOSSIP';    // Spread or gather information

interface ActionDecision {
  action: AutonomousAction;
  target?: string;
  location?: string;
  priority: number;
  reasoning: string;
}

function evaluateNPCNeeds(npc: NPC): { mostPressing: string; satisfaction: number } {
  const lowestNeed = npc.needs.reduce((lowest, current) => 
    current.satisfaction < lowest.satisfaction ? current : lowest
  );
  return { mostPressing: lowestNeed.type, satisfaction: lowestNeed.satisfaction };
}

function calculateRiskTolerance(npc: NPC): number {
  // Higher stress = lower risk tolerance, unless desperate
  const desperationBonus = npc.needs.some(n => n.satisfaction < 20) ? 30 : 0;
  const baseRisk = 50 - npc.stressLevel * 0.5 + desperationBonus;
  
  // Personality modifiers
  if (npc.meta.traits.includes('brave')) return Math.min(100, baseRisk + 20);
  if (npc.meta.traits.includes('fearful')) return Math.max(0, baseRisk - 20);
  if (npc.meta.traits.includes('cunning')) return baseRisk + 10;
  
  return Math.max(0, Math.min(100, baseRisk));
}

function decideAutonomousAction(npc: NPC, state: GameState): ActionDecision {
  const { mostPressing, satisfaction } = evaluateNPCNeeds(npc);
  const riskTolerance = calculateRiskTolerance(npc);
  const timePeriod = getTimePeriod(state.time.hour);
  
  // Check schedule first
  const scheduleHours = Object.keys(npc.meta.schedule).map(Number).sort((a, b) => a - b);
  let scheduledActivity = npc.meta.schedule[scheduleHours[0]];
  for (const hour of scheduleHours) {
    if (state.time.hour >= hour) {
      scheduledActivity = npc.meta.schedule[hour];
    }
  }
  
  // If severely stressed, prioritize coping
  if (npc.stressLevel > 70) {
    if (npc.meta.traits.includes('secretive') || npc.threatModel.defaultDefense === 'avoidance') {
      return { action: 'HIDE', priority: 90, reasoning: 'Too stressed, seeking solitude' };
    }
    if (npc.meta.traits.includes('gossip')) {
      return { action: 'GOSSIP', priority: 85, reasoning: 'Stressed, seeking social relief through gossip' };
    }
    return { action: 'REST', priority: 80, reasoning: 'Too stressed, needs rest' };
  }
  
  // Critical need satisfaction
  if (satisfaction < 30) {
    switch (mostPressing) {
      case 'survival':
        return { action: 'ACQUIRE', priority: 95, reasoning: 'Survival needs critical' };
      case 'stability':
        return { action: 'WORK', location: scheduledActivity.location, priority: 85, reasoning: 'Seeking stability through routine' };
      case 'status':
        return { action: 'SOCIALIZE', priority: 75, reasoning: 'Need to improve social standing' };
      case 'belonging':
        return { action: 'SOCIALIZE', priority: 80, reasoning: 'Lonely, seeking connection' };
      case 'meaning':
        return { action: 'WORK', priority: 70, reasoning: 'Seeking purpose through work' };
    }
  }
  
  // Night behavior
  if (timePeriod === 'night') {
    if (scheduledActivity.activity.includes('sleep')) {
      return { action: 'REST', location: scheduledActivity.location, priority: 60, reasoning: 'Time to sleep' };
    }
  }
  
  // Check for unresolved conflicts
  const hasEnemies = Object.entries(npc.socialRanking).some(([id, rank]) => rank.trust < -50);
  if (hasEnemies && riskTolerance > 60 && npc.conflictStyle !== 'AVOIDANT') {
    return { action: 'CONFRONT', priority: 65, reasoning: 'Has unresolved conflicts' };
  }
  
  // Social NPCs gossip
  if (npc.meta.traits.includes('gossip') && Math.random() > 0.6) {
    return { action: 'GOSSIP', priority: 50, reasoning: 'Enjoys spreading information' };
  }
  
  // Default to scheduled activity
  if (scheduledActivity.activity.includes('work') || scheduledActivity.activity.includes('serving') || scheduledActivity.activity.includes('patrol')) {
    return { action: 'WORK', location: scheduledActivity.location, priority: 50, reasoning: 'Following daily routine' };
  }
  
  // Move to scheduled location if not there
  if (npc.currentLocation !== scheduledActivity.location) {
    return { action: 'MOVE', location: scheduledActivity.location, priority: 45, reasoning: 'Moving to scheduled location' };
  }
  
  // Fallback to socializing or resting
  if (npc.meta.stats.energy < 50) {
    return { action: 'REST', priority: 40, reasoning: 'Low energy' };
  }
  
  return { action: 'SOCIALIZE', priority: 30, reasoning: 'Nothing urgent, being social' };
}

// ============= MEMORY SYSTEM =============

export function createMemory(
  npc: NPC,
  event: string,
  type: Memory['type'],
  emotionalImpact: number,
  involvedEntities: string[],
  tick: number
): Memory {
  const sentiment = emotionalImpact > 20 ? 'grateful' :
                    emotionalImpact > 0 ? 'happy' :
                    emotionalImpact < -20 ? 'angry' :
                    emotionalImpact < 0 ? 'sad' : 'neutral';
  
  return {
    id: `mem_${npc.id}_${tick}`,
    tick,
    type,
    event,
    involvedEntities,
    emotionalImpact,
    sentiment,
    reliability: type === 'witnessed' || type === 'experienced' ? 'certain' : 'probable',
    decayRate: Math.abs(emotionalImpact) > 50 ? 0.1 : 0.5, // Strong emotions decay slower
    sharable: type !== 'caused' || emotionalImpact > 0, // Don't share shameful actions
  };
}

export function addMemory(npc: NPC, memory: Memory): NPC {
  return {
    ...npc,
    memory: [...npc.memory, memory],
  };
}

export function recallMemories(npc: NPC, context: { keywords: string[]; entities: string[] }): Memory[] {
  return npc.memory
    .filter(mem => {
      // Match by entities involved
      if (context.entities.some(e => mem.involvedEntities.includes(e))) return true;
      // Match by keyword in event description
      if (context.keywords.some(k => mem.event.toLowerCase().includes(k.toLowerCase()))) return true;
      return false;
    })
    .sort((a, b) => Math.abs(b.emotionalImpact) - Math.abs(a.emotionalImpact)) // Most emotional first
    .slice(0, 5); // Return top 5
}

export function decayMemories(npc: NPC, currentTick: number): NPC {
  const maxAge = 1000; // Memories older than this fully decay
  
  const updatedMemory = npc.memory
    .map(mem => {
      const age = currentTick - mem.tick;
      const decayFactor = 1 - (age / maxAge) * mem.decayRate;
      
      // Reduce emotional impact over time
      return {
        ...mem,
        emotionalImpact: Math.round(mem.emotionalImpact * Math.max(0.1, decayFactor)),
      };
    })
    .filter(mem => Math.abs(mem.emotionalImpact) > 5); // Remove insignificant memories
  
  return {
    ...npc,
    memory: updatedMemory,
  };
}

export function triggerMemory(npc: NPC, stimulus: string): Memory | null {
  const lowerStimulus = stimulus.toLowerCase();
  
  // Check if any memory is triggered by the stimulus
  const triggered = npc.memory.find(mem => {
    const eventWords = mem.event.toLowerCase().split(' ');
    return eventWords.some(word => word.length > 3 && lowerStimulus.includes(word));
  });
  
  // Also check scar triggers
  const scarTriggered = npc.emotionalState.scarTriggers.some(trigger => 
    lowerStimulus.includes(trigger.toLowerCase())
  );
  
  if (scarTriggered && npc.memory.length > 0) {
    // Return most traumatic memory
    return npc.memory.reduce((worst, current) => 
      current.emotionalImpact < worst.emotionalImpact ? current : worst
    );
  }
  
  return triggered || null;
}

// ============= NPC-NPC INTERACTIONS =============

interface InteractionOutcome {
  actor: NPC;
  target: NPC;
  description: string;
  actorMemory: Memory;
  targetMemory: Memory;
  relationshipChange: { trust: number; intimacy: number };
}

function simulateNPCInteraction(actor: NPC, target: NPC, tick: number): InteractionOutcome | null {
  // Check if they want to interact
  const actorRanking = actor.socialRanking[target.id];
  const targetRanking = target.socialRanking[actor.id];
  
  if (!actorRanking || !targetRanking) return null;
  
  // Hostile NPCs might confront each other
  if (actorRanking.trust < -30 && actor.conflictStyle !== 'AVOIDANT') {
    const description = `${actor.meta.name} confronted ${target.meta.name} about past grievances`;
    return {
      actor,
      target,
      description,
      actorMemory: createMemory(actor, description, 'experienced', -10, [target.id], tick),
      targetMemory: createMemory(target, description, 'experienced', -15, [actor.id], tick),
      relationshipChange: { trust: -5, intimacy: 0 },
    };
  }
  
  // Friendly NPCs socialize
  if (actorRanking.trust > 20 && actorRanking.intimacy > 10) {
    const description = `${actor.meta.name} and ${target.meta.name} had a pleasant conversation`;
    return {
      actor,
      target,
      description,
      actorMemory: createMemory(actor, description, 'experienced', 5, [target.id], tick),
      targetMemory: createMemory(target, description, 'experienced', 5, [actor.id], tick),
      relationshipChange: { trust: 2, intimacy: 1 },
    };
  }
  
  // Gossip exchange
  if (actor.meta.traits.includes('gossip') || target.meta.traits.includes('gossip')) {
    const description = `${actor.meta.name} and ${target.meta.name} exchanged gossip`;
    return {
      actor,
      target,
      description,
      actorMemory: createMemory(actor, description, 'experienced', 3, [target.id], tick),
      targetMemory: createMemory(target, description, 'experienced', 3, [actor.id], tick),
      relationshipChange: { trust: 1, intimacy: 2 },
    };
  }
  
  return null;
}

// ============= WORLD TICK =============

export interface WorldTickResult {
  updatedState: GameState;
  worldEvents: WorldEvent[];
  summary: string[];
  breakpoints: Breakpoint[];
  evolutionEvents: string[];
  ambientResult?: AmbientTickResult;
  ambientFeed?: UnifiedAmbientEntry[];
  weatherReactions?: Record<string, { impact: WeatherImpact; dialogue: string | null; behaviors: PhysicalBehavior[] }>;
}

// Extended NPC type with weather personality
interface NPCWithWeather extends NPC {
  weatherPersonality?: NPCWeatherPersonality;
  currentBehaviors?: PhysicalBehavior[];
  weatherSmallTalk?: { topic: 'weather'; line: string } | null;
}

// Track if ambient system is initialized
let ambientInitialized = false;

export function worldTick(state: GameState, previousState?: GameState): WorldTickResult {
  let updatedState = { ...state };
  const worldEvents: WorldEvent[] = [];
  const summary: string[] = [];
  const npcs = { ...state.npcs } as Record<string, NPCWithWeather>;
  let breakpoints: Breakpoint[] = [];
  let evolutionEvents: string[] = [];
  let ambientResult: AmbientTickResult | undefined;
  let ambientFeed: UnifiedAmbientEntry[] = [];
  const weatherReactions: Record<string, { impact: WeatherImpact; dialogue: string | null; behaviors: PhysicalBehavior[] }> = {};
  
  // Get current weather from state
  const currentWeather: WeatherType = (state as any).weather?.type || 
                                      (state as any).weatherState?.type || 
                                      'clear';
  
  // 0. Initialize world evolution if not present
  if (!updatedState.worldEvolution) {
    const evolution = initializeWorldEvolution();
    updatedState.worldEvolution = {
      economicHealth: evolution.economicHealth,
      socialStability: evolution.socialStability,
      resourceAvailability: evolution.resourceAvailability,
    };
  }
  
  // 0.5 Initialize ambient system if not already done
  if (!ambientInitialized) {
    const genre = (state as any).genre || (state as any).gameGenre || 'modern';
    initializeUnifiedAmbient(genre);
    ambientInitialized = true;
  } else {
    // Update genre if it changed
    const currentGenre = (state as any).genre || (state as any).gameGenre;
    if (currentGenre) {
      setAmbientGenre(currentGenre);
    }
  }
  
  // 1. Move NPCs according to schedules (already in simulateNPCs)
  // 2. Process NPC autonomous decisions
  for (const npcId in npcs) {
    const npc = npcs[npcId];
    const decision = decideAutonomousAction(npc, state);
    
    // Execute autonomous action
    switch (decision.action) {
      case 'MOVE':
        if (decision.location && decision.location !== npc.currentLocation) {
          const oldLocation = npc.currentLocation;
          npcs[npcId] = { ...npc, currentLocation: decision.location };
          worldEvents.push({
            id: `we_${Date.now()}_${npcId}`,
            tick: state.time.tick,
            type: 'npc_action',
            description: `${npc.meta.name} moved from ${oldLocation} to ${decision.location}`,
            involvedEntities: [npcId],
            location: decision.location,
            visibility: 'public',
            consequences: [],
          });
        }
        break;
        
      case 'SOCIALIZE':
      case 'GOSSIP':
        // Find another NPC at same location
        const othersHere = Object.values(npcs).filter(
          other => other.id !== npcId && other.currentLocation === npc.currentLocation
        );
        if (othersHere.length > 0) {
          const target = othersHere[Math.floor(Math.random() * othersHere.length)];
          const interaction = simulateNPCInteraction(npc, target, state.time.tick);
          
          if (interaction) {
            // Update memories
            npcs[npcId] = addMemory(npcs[npcId], interaction.actorMemory);
            npcs[target.id] = addMemory(npcs[target.id], interaction.targetMemory);
            
            // Update relationships
            const actorSocial = npcs[npcId].socialRanking[target.id] || { trust: 0, utility: 0, fear: 0, intimacy: 0 };
            npcs[npcId] = {
              ...npcs[npcId],
              socialRanking: {
                ...npcs[npcId].socialRanking,
                [target.id]: {
                  ...actorSocial,
                  trust: actorSocial.trust + interaction.relationshipChange.trust,
                  intimacy: actorSocial.intimacy + interaction.relationshipChange.intimacy,
                },
              },
            };
            
            worldEvents.push({
              id: `we_${Date.now()}_${npcId}_interact`,
              tick: state.time.tick,
              type: 'npc_interaction',
              description: interaction.description,
              involvedEntities: [npcId, target.id],
              location: npc.currentLocation,
              visibility: 'witnessed',
              consequences: [],
            });
            
            summary.push(interaction.description);
          }
        }
        break;
        
      case 'REST':
        // Recover energy
        npcs[npcId] = {
          ...npc,
          meta: {
            ...npc.meta,
            stats: {
              ...npc.meta.stats,
              energy: Math.min(100, npc.meta.stats.energy + 10),
            },
          },
          stressLevel: Math.max(0, npc.stressLevel - 5),
        };
        break;
        
      case 'WORK':
        // Maintain stability need
        const stabilityNeed = npcs[npcId].needs.find(n => n.type === 'stability');
        if (stabilityNeed) {
          npcs[npcId] = {
            ...npcs[npcId],
            needs: npcs[npcId].needs.map(n => 
              n.type === 'stability' ? { ...n, satisfaction: Math.min(100, n.satisfaction + 5) } : n
            ),
          };
        }
        break;
    }
    
    // Decay memories each tick
    npcs[npcId] = decayMemories(npcs[npcId], state.time.tick);
    
    // Update emotional state based on needs
    const avgSatisfaction = npcs[npcId].needs.reduce((sum, n) => sum + n.satisfaction, 0) / npcs[npcId].needs.length;
    if (avgSatisfaction < 30 && npcs[npcId].emotionalState.current !== 'desperate') {
      npcs[npcId] = {
        ...npcs[npcId],
        emotionalState: {
          ...npcs[npcId].emotionalState,
          current: 'anxious',
        },
      };
    } else if (avgSatisfaction > 70) {
      npcs[npcId] = {
        ...npcs[npcId],
        emotionalState: {
          ...npcs[npcId].emotionalState,
          current: npcs[npcId].emotionalState.baseline,
        },
      };
    }
    
    // Decay needs slightly each tick
    npcs[npcId] = {
      ...npcs[npcId],
      needs: npcs[npcId].needs.map(n => ({
        ...n,
        satisfaction: Math.max(0, n.satisfaction - 0.5),
      })),
    };
    
    // ========= WEATHER REACTION INTEGRATION =========
    // Ensure NPC has weather personality
    if (!npcs[npcId].weatherPersonality) {
      npcs[npcId].weatherPersonality = npcWeatherReactionSystem.generateWeatherPersonality();
    }
    
    const weatherPersonality = npcs[npcId].weatherPersonality!;
    
    // Calculate weather impact
    const weatherImpact = npcWeatherReactionSystem.getWeatherImpact(weatherPersonality, currentWeather);
    
    // Apply weather effects to NPC mood and energy (scaled for per-tick)
    const currentMood = npcs[npcId].meta.stats.mood || 50;
    const currentEnergy = npcs[npcId].meta.stats.energy || 50;
    
    npcs[npcId] = {
      ...npcs[npcId],
      meta: {
        ...npcs[npcId].meta,
        stats: {
          ...npcs[npcId].meta.stats,
          mood: Math.max(0, Math.min(100, currentMood + weatherImpact.moodModifier * 0.05)),
          energy: Math.max(0, Math.min(100, currentEnergy + weatherImpact.energyModifier * 0.05)),
        },
      },
    };
    
    // Get physical behaviors based on weather
    const weatherBehaviors = npcWeatherReactionSystem.getPhysicalBehaviors(weatherPersonality, currentWeather);
    npcs[npcId].currentBehaviors = weatherBehaviors;
    
    // Generate weather dialogue for small talk
    const weatherDialogue = npcWeatherReactionSystem.getWeatherSmallTalk(weatherPersonality, currentWeather);
    npcs[npcId].weatherSmallTalk = weatherDialogue;
    
    // Store weather reactions for UI consumption
    weatherReactions[npcId] = {
      impact: weatherImpact,
      dialogue: weatherDialogue?.line || null,
      behaviors: weatherBehaviors,
    };
    
    // If NPC really hates this weather, add stress
    if (weatherImpact.comfortLevel < 30) {
      npcs[npcId] = {
        ...npcs[npcId],
        stressLevel: Math.min(100, (npcs[npcId].stressLevel || 0) + 2),
      };
    }
    
    // Generate weather event if NPC is reacting strongly
    if (weatherImpact.comfortLevel < 25 && Math.random() < 0.1) {
      const description = npcWeatherReactionSystem.describeWeatherReaction(
        npcs[npcId].meta.name,
        weatherPersonality,
        currentWeather
      );
      worldEvents.push({
        id: `we_weather_${Date.now()}_${npcId}`,
        tick: state.time.tick,
        type: 'environmental',
        description,
        involvedEntities: [npcId],
        location: npcs[npcId].currentLocation,
        visibility: 'witnessed',
        consequences: [],
      });
      summary.push(description);
    }
  }
  
  // 3. Process ambient events (unified chatter + micro-events)
  try {
    ambientResult = processAmbientTick(updatedState);
    if (ambientResult.emitted && ambientResult.entry) {
      // Add ambient event to world events for logging
      worldEvents.push({
        id: `we_ambient_${Date.now()}`,
        tick: state.time.tick,
        type: ambientResult.type === 'chatter' ? 'social' : 'environmental',
        description: ambientResult.entry.text,
        involvedEntities: ambientResult.entry.involvedNPCs || [],
        location: (state as any).currentLocation || 'unknown',
        visibility: 'witnessed',
        consequences: [],
      });
      
      // Add to summary for narrative context
      summary.push(`[Ambient] ${ambientResult.entry.text}`);
    }
    
    // Get current ambient feed for UI
    ambientFeed = getUnifiedAmbientFeed();
  } catch (e) {
    // Ambient processing failed, continue without
    console.warn('[WorldTick] Ambient processing error:', e);
  }
  
  // 4. Check for random events (fallback if no ambient emitted)
  if (!ambientResult?.emitted && Math.random() < 0.03) { // Reduced chance since ambient handles this
    const randomEvents = [
      { desc: 'A cold wind blows through the area', type: 'environmental' as const },
      { desc: 'Distant sounds echo in the distance', type: 'environmental' as const },
      { desc: 'The atmosphere shifts subtly', type: 'environmental' as const },
    ];
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    worldEvents.push({
      id: `we_random_${Date.now()}`,
      tick: state.time.tick,
      type: event.type,
      description: event.desc,
      involvedEntities: [],
      location: (state as any).currentLocation || 'unknown',
      visibility: 'public',
      consequences: [],
    });
    summary.push(event.desc);
  }
  
  // 5. Detect breakpoints (Phase 7)
  try {
    breakpoints = detectBreakpoints(updatedState, previousState);
    breakpoints.forEach(bp => {
      summary.push(`[BREAKPOINT] ${bp.trigger}`);
      updatedState.breakpoints = [...(updatedState.breakpoints || []), {
        id: bp.id,
        type: bp.type,
        description: bp.trigger,
        tick: bp.tick,
      }];
    });
  } catch (e) {
    // Breakpoint detection failed, continue without
  }
  
  // 6. Tick world evolution (Phase 7)
  try {
    if (updatedState.worldEvolution) {
      const evolutionResult = tickWorldEvolution(
        {
          economicHealth: updatedState.worldEvolution.economicHealth,
          socialStability: updatedState.worldEvolution.socialStability,
          resourceAvailability: updatedState.worldEvolution.resourceAvailability,
          powerStructure: [],
          pendingShifts: [],
        },
        updatedState
      );
      
      updatedState.worldEvolution = {
        economicHealth: evolutionResult.updated.economicHealth,
        socialStability: evolutionResult.updated.socialStability,
        resourceAvailability: evolutionResult.updated.resourceAvailability,
      };
      
      evolutionEvents = evolutionResult.events;
      evolutionEvents.forEach(evt => summary.push(evt));
    }
  } catch (e) {
    // World evolution failed, continue without
  }
  
  // 7. Simulate NPC-NPC relationship evolution (Phase 7)
  try {
    const relationships = analyzeNPCRelationships(updatedState);
    relationships.slice(0, 3).forEach(rel => {
      const result = simulateRelationshipEvolution(rel, updatedState);
      if (result.event) {
        summary.push(result.event.description);
      }
    });
  } catch (e) {
    // Relationship evolution failed, continue without
  }
  
  return {
    updatedState,
    worldEvents,
    summary,
    breakpoints,
    evolutionEvents,
    ambientResult,
    ambientFeed,
    weatherReactions,
  };
}

export function generateTickSummary(events: WorldEvent[], hoursPassed: number): string {
  if (events.length === 0) {
    return `${hoursPassed} hour${hoursPassed > 1 ? 's' : ''} pass${hoursPassed === 1 ? 'es' : ''} quietly.`;
  }
  
  const significantEvents = events.filter(e => e.visibility !== 'secret').slice(0, 3);
  const summaryParts = significantEvents.map(e => e.description);
  
  return `As time passes...\n\n${summaryParts.map(s => `• ${s}`).join('\n')}`;
}
