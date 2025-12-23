// Phase 6: AI Context & Narrator System
// Dynamic prose generation, perception filtering, and unreliable narrator effects

import { GameState, NPC, GameEvent, Memory } from '@/types/game';
import { getTimePeriod } from './gameEngine';

// ============= NARRATOR PERSONA =============

export type NarratorVoice = 
  | 'OBJECTIVE'     // Neutral reporter
  | 'LITERARY'      // Poetic, metaphorical
  | 'SARDONIC'      // Dry, ironic observer
  | 'UNRELIABLE'    // Player's distorted perception
  | 'OMNISCIENT'    // Knows all, reveals selectively
  | 'NOIR';         // Hard-boiled detective style

export interface NarratorContract {
  voice: NarratorVoice;
  maxDetail: 'SPARSE' | 'MODERATE' | 'RICH' | 'DENSE';
  emotionalLeakage: boolean; // Does player mental state affect prose?
  timeCompression: boolean; // Compress mundane events?
  unreliabilityLevel: number; // 0-100, higher = more distortion
}

// ============= AI CONTEXT PACKAGING =============

export interface AIContextPackage {
  // Scene context
  location: string;
  timeOfDay: string;
  weather: string;
  ambiance: string;
  
  // Character context
  presentNPCs: {
    id: string;
    name: string;
    currentEmotion: string;
    relationshipToPlayer: string;
    currentActivity: string;
    stressLevel: number;
  }[];
  
  // Narrative context
  recentEvents: string[];
  pendingConsequences: string[];
  activeRumors: string[];
  
  // Player context
  playerStats: {
    health: number;
    energy: number;
    mood: number;
    hunger: number;
  };
  playerReputation: Record<string, number>;
  playerKnowledge: string[];
  
  // Narrator instructions
  narratorContract: NarratorContract;
  proseGuidelines: string[];
}

export function buildAIContext(state: GameState, narratorContract?: NarratorContract): AIContextPackage {
  const currentLocation = state.locations[state.player.currentLocation];
  const timePeriod = getTimePeriod(state.time.hour);
  
  const presentNPCs = Object.values(state.npcs)
    .filter(npc => npc.currentLocation === state.player.currentLocation)
    .map(npc => ({
      id: npc.id,
      name: npc.meta.name,
      currentEmotion: npc.emotionalState.current,
      relationshipToPlayer: describeRelationship(npc.relationships.player),
      currentActivity: npc.currentActivity,
      stressLevel: npc.stressLevel,
    }));
  
  const recentEvents = state.events.slice(-10).map(e => e.content);
  const activeRumors = state.worldEvents
    .filter(we => we.type === 'social')
    .slice(-5)
    .map(we => we.description);
  
  const defaultContract: NarratorContract = narratorContract || {
    voice: 'LITERARY',
    maxDetail: 'MODERATE',
    emotionalLeakage: true,
    timeCompression: true,
    unreliabilityLevel: 0,
  };
  
  return {
    location: currentLocation.name,
    timeOfDay: timePeriod,
    weather: getWeatherDescription(state),
    ambiance: generateAmbiance(currentLocation, state.time),
    presentNPCs,
    recentEvents,
    pendingConsequences: [], // Filled by consequence system
    activeRumors,
    playerStats: state.player.stats,
    playerReputation: state.player.reputation,
    playerKnowledge: state.player.knownInformation,
    narratorContract: defaultContract,
    proseGuidelines: getProseGuidelines(defaultContract),
  };
}

function describeRelationship(rel?: { affection: number; trust: number; fear: number; respect: number }): string {
  if (!rel) return 'stranger';
  
  const { affection, trust, fear, respect } = rel;
  
  if (fear > 60) return 'terrified';
  if (affection > 60 && trust > 60) return 'close friend';
  if (affection > 40) return 'friendly acquaintance';
  if (trust < -30) return 'distrustful';
  if (affection < -30) return 'hostile';
  if (respect > 50) return 'respectful';
  return 'neutral';
}

function getWeatherDescription(state: GameState): string {
  const season = state.time.season;
  const hour = state.time.hour;
  
  // Simplified weather based on season and time
  if (season === 'winter') return hour > 18 ? 'cold and dark' : 'crisp and cold';
  if (season === 'summer') return hour > 12 && hour < 18 ? 'hot and humid' : 'warm';
  if (season === 'autumn') return 'cool with a hint of decay';
  return 'mild and pleasant';
}

function generateAmbiance(location: { id: string; name: string }, time: { hour: number }): string {
  const ambianceMap: Record<string, Record<string, string>> = {
    loc_square: {
      morning: 'The square awakens with the shuffle of early risers and the creak of shop shutters.',
      afternoon: 'The square bustles with midday activity, voices mingling with the clatter of carts.',
      evening: 'Long shadows stretch across the cobblestones as merchants pack their wares.',
      night: 'The square lies quiet, lit only by scattered lanterns swaying in the breeze.',
    },
    loc_tavern: {
      morning: 'The tavern smells of last night\'s ale and fresh bread from the kitchen.',
      afternoon: 'A few patrons nurse drinks in the dim interior, escaping the daylight.',
      evening: 'The tavern fills with warmth, laughter, and the promise of stories told.',
      night: 'Shadows dance on the walls as the fire crackles and secrets flow like wine.',
    },
    default: {
      morning: 'The world stirs with new purpose.',
      afternoon: 'The day hangs heavy with possibility.',
      evening: 'Twilight softens every edge.',
      night: 'Darkness embraces the familiar, making it strange.',
    },
  };
  
  const timePeriod = getTimePeriod(time.hour);
  const locAmbiance = ambianceMap[location.id] || ambianceMap.default;
  return locAmbiance[timePeriod] || locAmbiance.afternoon;
}

function getProseGuidelines(contract: NarratorContract): string[] {
  const guidelines: string[] = [];
  
  switch (contract.voice) {
    case 'OBJECTIVE':
      guidelines.push('Report events factually without emotional coloring.');
      guidelines.push('Use precise, measured language.');
      break;
    case 'LITERARY':
      guidelines.push('Employ metaphor and sensory detail.');
      guidelines.push('Let the prose breathe with rhythm and cadence.');
      break;
    case 'SARDONIC':
      guidelines.push('Observe with dry wit and subtle irony.');
      guidelines.push('Find the absurdity in circumstances.');
      break;
    case 'UNRELIABLE':
      guidelines.push('Filter reality through distorted perception.');
      guidelines.push('Hint at truths the narrator cannot fully see.');
      break;
    case 'OMNISCIENT':
      guidelines.push('Know all but reveal only what serves the story.');
      guidelines.push('Occasionally foreshadow coming events.');
      break;
    case 'NOIR':
      guidelines.push('Paint in shadows and moral ambiguity.');
      guidelines.push('Every face hides a motive, every alley a secret.');
      break;
  }
  
  switch (contract.maxDetail) {
    case 'SPARSE':
      guidelines.push('Use minimal description. Let gaps speak.');
      break;
    case 'MODERATE':
      guidelines.push('Balance description with forward momentum.');
      break;
    case 'RICH':
      guidelines.push('Layer sensory details to build atmosphere.');
      break;
    case 'DENSE':
      guidelines.push('Miss nothing. Every surface tells a story.');
      break;
  }
  
  if (contract.emotionalLeakage) {
    guidelines.push('Allow player mental state to color perception of events.');
  }
  
  if (contract.timeCompression) {
    guidelines.push('Summarize routine events; expand moments of significance.');
  }
  
  return guidelines;
}

// ============= PERCEPTION FILTERING =============

export interface PerceptionFilter {
  reliabilityModifier: number; // -50 to 50
  emotionalBias: string;
  blindSpots: string[];
  heightenedAwareness: string[];
}

export function calculatePerceptionFilter(state: GameState): PerceptionFilter {
  const player = state.player;
  
  let reliabilityModifier = 0;
  let emotionalBias = 'neutral';
  const blindSpots: string[] = [];
  const heightenedAwareness: string[] = [];
  
  // Low energy affects perception
  if (player.stats.energy < 30) {
    reliabilityModifier -= 15;
    blindSpots.push('subtle social cues');
  }
  
  // Hunger affects focus
  if (player.stats.hunger < 30) {
    blindSpots.push('details unrelated to food');
    heightenedAwareness.push('mentions of food, markets, resources');
  }
  
  // Mood affects interpretation
  if (player.stats.mood < 30) {
    emotionalBias = 'pessimistic';
    reliabilityModifier -= 10;
  } else if (player.stats.mood > 70) {
    emotionalBias = 'optimistic';
    reliabilityModifier += 5;
  }
  
  // Health affects everything
  if (player.stats.health < 50) {
    reliabilityModifier -= 20;
    emotionalBias = 'fearful';
    heightenedAwareness.push('threats', 'danger', 'exits');
  }
  
  return {
    reliabilityModifier,
    emotionalBias,
    blindSpots,
    heightenedAwareness,
  };
}

// ============= UNRELIABLE NARRATOR EFFECTS =============

export interface NarrativeDistortion {
  type: 'omission' | 'exaggeration' | 'misattribution' | 'false_memory' | 'projection';
  source: string;
  effect: string;
}

export function generateNarrativeDistortions(state: GameState, contract: NarratorContract): NarrativeDistortion[] {
  const distortions: NarrativeDistortion[] = [];
  const unreliability = contract.unreliabilityLevel;
  
  if (unreliability < 10) return distortions;
  
  const filter = calculatePerceptionFilter(state);
  
  // Omissions based on blind spots
  if (filter.blindSpots.length > 0 && Math.random() * 100 < unreliability) {
    distortions.push({
      type: 'omission',
      source: filter.blindSpots[0],
      effect: `The narrator fails to notice ${filter.blindSpots[0]}`,
    });
  }
  
  // Exaggerations based on emotional state
  if (filter.emotionalBias !== 'neutral' && Math.random() * 100 < unreliability) {
    distortions.push({
      type: 'exaggeration',
      source: filter.emotionalBias,
      effect: `Events are colored by a ${filter.emotionalBias} lens`,
    });
  }
  
  // Projection of player fears onto NPCs
  if (state.player.stats.mood < 40 && Math.random() * 100 < unreliability * 0.5) {
    distortions.push({
      type: 'projection',
      source: 'player anxiety',
      effect: 'NPCs seem more hostile than they actually are',
    });
  }
  
  return distortions;
}

// ============= DYNAMIC PROSE GENERATION =============

export interface ProseFragment {
  text: string;
  type: 'description' | 'dialogue' | 'action' | 'internal' | 'sensory';
  emphasis: 'subtle' | 'normal' | 'emphasized';
  distortion?: NarrativeDistortion;
}

export function generateLocationProse(state: GameState, contract: NarratorContract): ProseFragment[] {
  const fragments: ProseFragment[] = [];
  const location = state.locations[state.player.currentLocation];
  const context = buildAIContext(state, contract);
  const distortions = generateNarrativeDistortions(state, contract);
  
  // Opening ambiance
  fragments.push({
    text: context.ambiance,
    type: 'sensory',
    emphasis: 'normal',
  });
  
  // Weather mention if relevant
  if (contract.voice === 'LITERARY' || contract.voice === 'NOIR') {
    fragments.push({
      text: `The air is ${context.weather}.`,
      type: 'sensory',
      emphasis: 'subtle',
    });
  }
  
  // NPC presence
  if (context.presentNPCs.length > 0) {
    const npcDescriptions = context.presentNPCs.map(npc => {
      const baseDesc = `${npc.name} is here, ${npc.currentActivity}`;
      
      // Apply distortion if present
      const projectionDistortion = distortions.find(d => d.type === 'projection');
      if (projectionDistortion && npc.relationshipToPlayer === 'neutral') {
        return `${npc.name} is here, watching you with an unreadable expression`;
      }
      
      // Emotional reading based on relationship
      if (npc.stressLevel > 60) {
        return `${baseDesc}. Something seems to weigh on them.`;
      }
      
      return baseDesc;
    });
    
    fragments.push({
      text: npcDescriptions.join('. ') + '.',
      type: 'description',
      emphasis: 'normal',
    });
  }
  
  return fragments;
}

export function generateEventProse(event: GameEvent, state: GameState, contract: NarratorContract): ProseFragment {
  const filter = calculatePerceptionFilter(state);
  
  let text = event.content;
  let emphasis: ProseFragment['emphasis'] = 'normal';
  
  // Apply voice styling
  switch (contract.voice) {
    case 'NOIR':
      if (event.type === 'observation') {
        text = text.replace(/You see/g, 'Your eyes find');
        text = text.replace(/There is/g, 'There lurks');
      }
      break;
    case 'SARDONIC':
      // Add subtle irony markers
      if (event.type === 'dialogue') {
        text += ' (As if that means anything in a place like this.)';
      }
      break;
    case 'UNRELIABLE':
      // Add uncertainty markers
      if (filter.reliabilityModifier < -10) {
        text = 'You think you see... ' + text.toLowerCase();
        emphasis = 'subtle';
      }
      break;
  }
  
  return {
    text,
    type: event.type === 'dialogue' ? 'dialogue' : 'description',
    emphasis,
  };
}

// ============= SUMMARY GENERATION =============

export function generateNarrativeSummary(
  events: GameEvent[],
  hoursElapsed: number,
  contract: NarratorContract
): string {
  if (events.length === 0) {
    switch (contract.voice) {
      case 'OBJECTIVE':
        return `${hoursElapsed} hour${hoursElapsed > 1 ? 's' : ''} passed without incident.`;
      case 'LITERARY':
        return `Time drifted by like leaves on still water. ${hoursElapsed} hour${hoursElapsed > 1 ? 's' : ''}, unmarked.`;
      case 'NOIR':
        return `The hours crawled past like they had nowhere better to be.`;
      case 'SARDONIC':
        return `Nothing happened. A small mercy in a world determined to be interesting.`;
      default:
        return `Time passes quietly. ${hoursElapsed} hours elapse.`;
    }
  }
  
  const significantEvents = events.filter(e => 
    e.type !== 'system' && e.content.length > 20
  ).slice(0, 3);
  
  const summaryParts = significantEvents.map(e => `• ${e.content.split('\n')[0]}`);
  
  let intro = '';
  switch (contract.voice) {
    case 'LITERARY':
      intro = `As the hours unfurl, the world continues its quiet drama:\n\n`;
      break;
    case 'NOIR':
      intro = `The city kept moving while you waited. Here's what went down:\n\n`;
      break;
    default:
      intro = `While ${hoursElapsed} hour${hoursElapsed > 1 ? 's' : ''} passed:\n\n`;
  }
  
  return intro + summaryParts.join('\n');
}

// ============= NARRATOR STATE =============

export interface NarratorState {
  contract: NarratorContract;
  currentFilter: PerceptionFilter;
  activeDistortions: NarrativeDistortion[];
  proseHistory: ProseFragment[];
}

export function createNarratorState(voice: NarratorVoice = 'LITERARY'): NarratorState {
  return {
    contract: {
      voice,
      maxDetail: 'MODERATE',
      emotionalLeakage: true,
      timeCompression: true,
      unreliabilityLevel: 0,
    },
    currentFilter: {
      reliabilityModifier: 0,
      emotionalBias: 'neutral',
      blindSpots: [],
      heightenedAwareness: [],
    },
    activeDistortions: [],
    proseHistory: [],
  };
}

export function updateNarratorState(
  narState: NarratorState,
  gameState: GameState
): NarratorState {
  return {
    ...narState,
    currentFilter: calculatePerceptionFilter(gameState),
    activeDistortions: generateNarrativeDistortions(gameState, narState.contract),
  };
}
