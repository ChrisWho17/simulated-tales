// Consequence System - Tracks rippling effects of actions (Phase 2.4)

import { GameState, NPC } from '@/types/game';

// ============= CONSEQUENCE TYPES =============

export interface Consequence {
  id: string;
  sourceTick: number;
  sourceAction: string;
  sourceEntity: string;
  affectedEntities: string[];
  affectedSystems: ('reputation' | 'resources' | 'relationships' | 'knowledge' | 'physical')[];
  immediateEffects: ConsequenceEffect[];
  delayedEffects: DelayedEffect[];
  resolved: boolean;
}

export interface ConsequenceEffect {
  type: 'reputation_change' | 'relationship_change' | 'resource_change' | 'knowledge_gain' | 'injury' | 'death';
  target: string;
  value: number | string;
  description: string;
}

export interface DelayedEffect extends ConsequenceEffect {
  triggerCondition: TriggerCondition;
  triggerTick?: number; // Tick at which to check
  probability: number; // 0-100 chance of triggering when condition met
}

export type TriggerCondition = 
  | { type: 'time_passed'; ticks: number }
  | { type: 'entity_present'; entityId: string; locationId: string }
  | { type: 'entity_discovers'; entityId: string; factId: string }
  | { type: 'reputation_threshold'; entityId: string; threshold: number; direction: 'above' | 'below' }
  | { type: 'random'; probability: number };

// ============= CONSEQUENCE CREATION =============

export function createConsequence(
  sourceAction: string,
  sourceEntity: string,
  affectedEntities: string[],
  affectedSystems: Consequence['affectedSystems'],
  immediateEffects: ConsequenceEffect[],
  delayedEffects: DelayedEffect[],
  tick: number
): Consequence {
  return {
    id: `csq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sourceTick: tick,
    sourceAction,
    sourceEntity,
    affectedEntities,
    affectedSystems,
    immediateEffects,
    delayedEffects,
    resolved: false,
  };
}

// Pre-built consequence templates
export const consequenceTemplates = {
  theft: (thief: string, victim: string, item: string, witnessed: boolean, tick: number): Consequence => 
    createConsequence(
      `${thief} stole ${item} from ${victim}`,
      thief,
      [thief, victim],
      ['reputation', 'relationships', 'resources'],
      [
        { type: 'resource_change', target: victim, value: -1, description: `Lost ${item}` },
        { type: 'relationship_change', target: victim, value: -30, description: 'Trust destroyed by theft' },
      ],
      witnessed ? [
        { 
          type: 'reputation_change', 
          target: thief, 
          value: -20, 
          description: 'Known as a thief',
          triggerCondition: { type: 'time_passed', ticks: 5 },
          probability: 80,
        },
        {
          type: 'knowledge_gain',
          target: 'npc_guard_james',
          value: `${thief} is a thief`,
          description: 'Guard learns of the theft',
          triggerCondition: { type: 'time_passed', ticks: 10 },
          probability: 60,
        },
      ] : [],
      tick
    ),
    
  violence: (attacker: string, victim: string, severity: 'minor' | 'major' | 'lethal', tick: number): Consequence =>
    createConsequence(
      `${attacker} attacked ${victim}`,
      attacker,
      [attacker, victim],
      ['reputation', 'relationships', 'physical'],
      [
        { 
          type: severity === 'lethal' ? 'death' : 'injury', 
          target: victim, 
          value: severity === 'minor' ? -20 : severity === 'major' ? -50 : -100,
          description: `${severity} injury from attack`,
        },
        { type: 'relationship_change', target: victim, value: -100, description: 'Mortal enemies' },
      ],
      [
        {
          type: 'reputation_change',
          target: attacker,
          value: severity === 'minor' ? -10 : severity === 'major' ? -30 : -50,
          description: 'Known as violent',
          triggerCondition: { type: 'time_passed', ticks: 1 },
          probability: 90,
        },
      ],
      tick
    ),
    
  kindness: (helper: string, helped: string, description: string, tick: number): Consequence =>
    createConsequence(
      `${helper} helped ${helped}`,
      helper,
      [helper, helped],
      ['reputation', 'relationships'],
      [
        { type: 'relationship_change', target: helped, value: 15, description: 'Grateful for help' },
      ],
      [
        {
          type: 'reputation_change',
          target: helper,
          value: 5,
          description: 'Known as helpful',
          triggerCondition: { type: 'time_passed', ticks: 20 },
          probability: 40,
        },
      ],
      tick
    ),
    
  betrayal: (betrayer: string, betrayed: string, secret: string, tick: number): Consequence =>
    createConsequence(
      `${betrayer} revealed ${betrayed}'s secret`,
      betrayer,
      [betrayer, betrayed],
      ['reputation', 'relationships', 'knowledge'],
      [
        { type: 'relationship_change', target: betrayed, value: -50, description: 'Trust shattered' },
        { type: 'knowledge_gain', target: 'group_town', value: secret, description: 'Secret becomes public' },
      ],
      [
        {
          type: 'reputation_change',
          target: betrayer,
          value: -15,
          description: 'Cannot be trusted with secrets',
          triggerCondition: { type: 'time_passed', ticks: 15 },
          probability: 70,
        },
      ],
      tick
    ),
};

// ============= CONSEQUENCE PROCESSING =============

// Limits to prevent unbounded consequence growth
const MAX_ACTIVE_CONSEQUENCES = 50;
const MAX_DELAYED_EFFECTS_PER_CONSEQUENCE = 10;
const MAX_CONSEQUENCE_AGE_TICKS = 500;

export function processConsequences(state: GameState, consequences: Consequence[]): {
  updatedState: GameState;
  triggeredEffects: ConsequenceEffect[];
  updatedConsequences: Consequence[];
} {
  let updatedState = { ...state };
  const triggeredEffects: ConsequenceEffect[] = [];
  
  // Filter out old consequences first
  const currentTick = state.time?.tick || 0;
  const activeConsequences = consequences.filter(csq => 
    !csq.resolved && (currentTick - csq.sourceTick < MAX_CONSEQUENCE_AGE_TICKS)
  );
  
  const updatedConsequences = activeConsequences.map(csq => {
    if (csq.resolved) return csq;
    
    const remainingDelayed: DelayedEffect[] = [];
    
    // Limit effects per consequence
    const effectsToProcess = csq.delayedEffects.slice(0, MAX_DELAYED_EFFECTS_PER_CONSEQUENCE);
    
    for (const effect of effectsToProcess) {
      const triggered = checkTriggerCondition(effect.triggerCondition, csq.sourceTick, state);
      
      if (triggered && Math.random() * 100 < effect.probability) {
        // Apply the effect
        updatedState = applyEffect(updatedState, effect);
        triggeredEffects.push(effect);
      } else if (!triggered) {
        // Keep for later
        remainingDelayed.push(effect);
      }
      // If triggered but probability failed, remove it
    }
    
    return {
      ...csq,
      delayedEffects: remainingDelayed.slice(0, MAX_DELAYED_EFFECTS_PER_CONSEQUENCE),
      resolved: remainingDelayed.length === 0,
    };
  });
  
  // Limit total consequences
  const finalConsequences = updatedConsequences.length > MAX_ACTIVE_CONSEQUENCES
    ? updatedConsequences.slice(-MAX_ACTIVE_CONSEQUENCES)
    : updatedConsequences;
  
  return { updatedState, triggeredEffects, updatedConsequences: finalConsequences };
}

function checkTriggerCondition(condition: TriggerCondition, sourceTick: number, state: GameState): boolean {
  switch (condition.type) {
    case 'time_passed':
      return state.time.tick - sourceTick >= condition.ticks;
      
    case 'entity_present':
      const npc = state.npcs[condition.entityId];
      return npc?.currentLocation === condition.locationId;
      
    case 'random':
      return Math.random() * 100 < condition.probability;
      
    default:
      return false;
  }
}

function applyEffect(state: GameState, effect: ConsequenceEffect): GameState {
  const newState = { ...state };
  
  switch (effect.type) {
    case 'relationship_change':
      if (newState.npcs[effect.target]) {
        const npc = newState.npcs[effect.target];
        const playerRel = npc.relationships.player || { affection: 0, trust: 0, fear: 0, respect: 0 };
        newState.npcs = {
          ...newState.npcs,
          [effect.target]: {
            ...npc,
            relationships: {
              ...npc.relationships,
              player: {
                ...playerRel,
                trust: playerRel.trust + (effect.value as number),
                affection: playerRel.affection + (effect.value as number) / 2,
              },
            },
          },
        };
      }
      break;
      
    case 'reputation_change':
      newState.player = {
        ...newState.player,
        reputation: {
          ...newState.player.reputation,
          [effect.target]: (newState.player.reputation[effect.target] || 0) + (effect.value as number),
        },
      };
      break;
      
    case 'injury':
      if (effect.target === 'player') {
        newState.player = {
          ...newState.player,
          stats: {
            ...newState.player.stats,
            health: Math.max(0, newState.player.stats.health + (effect.value as number)),
          },
        };
      } else if (newState.npcs[effect.target]) {
        const npc = newState.npcs[effect.target];
        newState.npcs = {
          ...newState.npcs,
          [effect.target]: {
            ...npc,
            meta: {
              ...npc.meta,
              stats: {
                ...npc.meta.stats,
                health: Math.max(0, npc.meta.stats.health + (effect.value as number)),
              },
            },
          },
        };
      }
      break;
  }
  
  return newState;
}

// ============= ENVIRONMENTAL TIME PASSAGE (Phase 2.5) =============

export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface EnvironmentState {
  dayPhase: DayPhase;
  weather: {
    type: WeatherType;
    severity: number; // 1-5
    duration: number; // hours remaining
  };
  temperature: 'freezing' | 'cold' | 'mild' | 'warm' | 'hot';
}

export function getDayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 2) return 'night';
  return 'late_night';
}

export function getSeasonalTemperature(season: Season, hour: number): EnvironmentState['temperature'] {
  const isNight = hour < 6 || hour >= 21;
  
  switch (season) {
    case 'winter':
      return isNight ? 'freezing' : 'cold';
    case 'spring':
      return isNight ? 'cold' : 'mild';
    case 'summer':
      return isNight ? 'warm' : 'hot';
    case 'autumn':
      return isNight ? 'cold' : 'mild';
  }
}

export function updateWeather(current: EnvironmentState['weather'], season: Season): EnvironmentState['weather'] {
  // Reduce duration
  if (current.duration > 0) {
    return { ...current, duration: current.duration - 1 };
  }
  
  // Generate new weather
  const weatherChances: Record<Season, Record<WeatherType, number>> = {
    spring: { clear: 40, cloudy: 30, rain: 25, storm: 5, snow: 0, fog: 0 },
    summer: { clear: 60, cloudy: 25, rain: 10, storm: 5, snow: 0, fog: 0 },
    autumn: { clear: 30, cloudy: 35, rain: 25, storm: 5, snow: 0, fog: 5 },
    winter: { clear: 25, cloudy: 30, rain: 15, storm: 5, snow: 20, fog: 5 },
  };
  
  const chances = weatherChances[season];
  const roll = Math.random() * 100;
  let cumulative = 0;
  let newType: WeatherType = 'clear';
  
  for (const [type, chance] of Object.entries(chances)) {
    cumulative += chance;
    if (roll <= cumulative) {
      newType = type as WeatherType;
      break;
    }
  }
  
  const duration = newType === 'clear' ? 6 + Math.floor(Math.random() * 12) :
                   newType === 'storm' ? 1 + Math.floor(Math.random() * 3) :
                   2 + Math.floor(Math.random() * 6);
  
  const severity = newType === 'clear' ? 0 :
                   newType === 'storm' ? 3 + Math.floor(Math.random() * 3) :
                   1 + Math.floor(Math.random() * 3);
  
  return { type: newType, severity, duration };
}

export function generateTimeDescription(env: EnvironmentState, location: string): string {
  const phaseDescriptions: Record<DayPhase, string[]> = {
    dawn: [
      'The first light of dawn creeps over the horizon.',
      'Pink and gold streak the sky as the sun rises.',
      'Early birds begin their songs as darkness retreats.',
    ],
    morning: [
      'Morning sunlight bathes the area in warm light.',
      'The day is young and full of possibility.',
      'People go about their morning routines.',
    ],
    afternoon: [
      'The afternoon sun hangs overhead.',
      'The bustle of midday fills the air.',
      'Shadows grow shorter as the sun reaches its peak.',
    ],
    evening: [
      'Golden evening light paints long shadows.',
      'The day winds down as dusk approaches.',
      'Lanterns begin to flicker to life.',
    ],
    night: [
      'Darkness has settled over the land.',
      'Stars emerge in the velvet sky.',
      'The world grows quiet under the night sky.',
    ],
    late_night: [
      'The deepest hours of night press in.',
      'Only the brave or foolish are abroad at this hour.',
      'Silence reigns, broken only by distant sounds.',
    ],
  };
  
  const weatherDescriptions: Record<WeatherType, string[]> = {
    clear: ['The sky is clear.', 'Not a cloud in sight.', ''],
    cloudy: ['Clouds hang overhead.', 'A grey blanket covers the sky.', 'Overcast skies loom above.'],
    rain: ['Rain patters down steadily.', 'Water drips from every surface.', 'The rain shows no sign of stopping.'],
    storm: ['Thunder rumbles ominously.', 'Lightning flashes in the distance.', 'The storm rages on.'],
    snow: ['Snow falls gently.', 'White flakes drift down from above.', 'A blanket of snow covers everything.'],
    fog: ['Thick fog obscures the distance.', 'Mist swirls around you.', 'Visibility is poor in the fog.'],
  };
  
  const phase = phaseDescriptions[env.dayPhase][Math.floor(Math.random() * phaseDescriptions[env.dayPhase].length)];
  const weather = weatherDescriptions[env.weather.type][Math.floor(Math.random() * weatherDescriptions[env.weather.type].length)];
  
  return weather ? `${phase} ${weather}` : phase;
}

export function getEnvironmentalEffects(env: EnvironmentState): {
  npcScheduleModifier: number; // -1 to 1, affects how much NPCs deviate from schedule
  dangerModifier: number; // multiplier for danger
  visibilityModifier: number; // 0-1, affects detection
  movementModifier: number; // multiplier for travel time
} {
  let scheduleModifier = 0;
  let dangerModifier = 1;
  let visibilityModifier = 1;
  let movementModifier = 1;
  
  // Night effects
  if (env.dayPhase === 'night' || env.dayPhase === 'late_night') {
    dangerModifier *= 1.5;
    visibilityModifier *= 0.5;
  }
  
  // Weather effects
  switch (env.weather.type) {
    case 'rain':
      scheduleModifier -= 0.2;
      movementModifier *= 1.2;
      break;
    case 'storm':
      scheduleModifier -= 0.5;
      dangerModifier *= 1.3;
      visibilityModifier *= 0.3;
      movementModifier *= 1.5;
      break;
    case 'snow':
      scheduleModifier -= 0.3;
      movementModifier *= 1.4;
      break;
    case 'fog':
      visibilityModifier *= 0.4;
      dangerModifier *= 1.2;
      break;
  }
  
  // Temperature effects
  if (env.temperature === 'freezing') {
    scheduleModifier -= 0.3;
    movementModifier *= 1.3;
  } else if (env.temperature === 'hot') {
    scheduleModifier -= 0.1;
  }
  
  return { 
    npcScheduleModifier: scheduleModifier, 
    dangerModifier, 
    visibilityModifier, 
    movementModifier 
  };
}
