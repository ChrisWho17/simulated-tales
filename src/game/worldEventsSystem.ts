// World Events System - Dynamic ambient events, weather, and world state changes
// Creates a living, breathing world with AI-enhanced event generation

import { GameState, GameTime, NPC, Location } from '@/types/game';

// ============= WEATHER SYSTEM =============

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow';
export type WeatherIntensity = 'light' | 'moderate' | 'heavy';

export interface WeatherState {
  current: WeatherType;
  intensity: WeatherIntensity;
  duration: number; // hours remaining
  transitioningTo?: WeatherType;
  seasonalModifier: number;
}

export function initializeWeather(season: GameTime['season']): WeatherState {
  const seasonalWeather: Record<string, { baseWeather: WeatherType; changeChance: number }> = {
    spring: { baseWeather: 'cloudy', changeChance: 0.4 },
    summer: { baseWeather: 'clear', changeChance: 0.2 },
    autumn: { baseWeather: 'cloudy', changeChance: 0.5 },
    winter: { baseWeather: 'cloudy', changeChance: 0.3 },
  };
  
  const seasonal = seasonalWeather[season];
  
  return {
    current: seasonal.baseWeather,
    intensity: 'moderate',
    duration: 4 + Math.floor(Math.random() * 8),
    seasonalModifier: seasonal.changeChance,
  };
}

export function updateWeather(weather: WeatherState, season: GameTime['season'], hoursElapsed: number): WeatherState {
  let updated = { ...weather };
  updated.duration -= hoursElapsed;
  
  if (updated.duration <= 0) {
    // Weather change
    const possibleWeather: Record<string, WeatherType[]> = {
      spring: ['clear', 'cloudy', 'rain', 'fog'],
      summer: ['clear', 'cloudy', 'rain', 'storm'],
      autumn: ['clear', 'cloudy', 'rain', 'fog', 'storm'],
      winter: ['clear', 'cloudy', 'snow', 'fog'],
    };
    
    const options = possibleWeather[season];
    const newWeather = options[Math.floor(Math.random() * options.length)];
    
    updated.current = newWeather;
    updated.intensity = ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)] as WeatherIntensity;
    updated.duration = 2 + Math.floor(Math.random() * 10);
    updated.transitioningTo = undefined;
  }
  
  return updated;
}

export function getWeatherDescription(weather: WeatherState, timePeriod: string): string {
  const descriptions: Record<WeatherType, Record<WeatherIntensity, string>> = {
    clear: {
      light: 'A few wisps of cloud drift across the sky.',
      moderate: 'The sky is clear and bright.',
      heavy: 'Not a cloud in sight.',
    },
    cloudy: {
      light: 'Light clouds scatter across the sky.',
      moderate: 'Gray clouds blanket the sky.',
      heavy: 'Heavy, dark clouds loom overhead.',
    },
    rain: {
      light: 'A light drizzle mists the air.',
      moderate: 'Steady rain drums against rooftops.',
      heavy: 'Heavy rain pours down in sheets.',
    },
    storm: {
      light: 'Distant thunder rumbles occasionally.',
      moderate: 'Thunder cracks and lightning flashes across the sky.',
      heavy: 'A violent storm rages, with deafening thunder and blinding lightning.',
    },
    fog: {
      light: 'A thin mist hangs in the air.',
      moderate: 'Fog obscures the distance.',
      heavy: 'Dense fog limits visibility to mere feet.',
    },
    snow: {
      light: 'Gentle snowflakes drift lazily down.',
      moderate: 'Snow falls steadily, covering everything in white.',
      heavy: 'A blizzard howls, driving snow horizontally.',
    },
  };
  
  const timeAdditions: Record<string, string> = {
    morning: 'Morning light filters through.',
    afternoon: 'The afternoon sun struggles through.',
    evening: 'Dusk casts long shadows.',
    night: 'Darkness envelops the world.',
  };
  
  return `${descriptions[weather.current][weather.intensity]} ${timeAdditions[timePeriod] || ''}`;
}

export function getWeatherEffects(weather: WeatherState): {
  visibilityMod: number;
  outdoorActivityMod: number;
  npcBehaviorMod: string;
  moodMod: number;
} {
  const effects = {
    visibilityMod: 0,
    outdoorActivityMod: 0,
    npcBehaviorMod: 'normal',
    moodMod: 0,
  };
  
  switch (weather.current) {
    case 'rain':
      effects.outdoorActivityMod = weather.intensity === 'heavy' ? -30 : -15;
      effects.npcBehaviorMod = 'seeking_shelter';
      effects.moodMod = -5;
      break;
    case 'storm':
      effects.visibilityMod = -20;
      effects.outdoorActivityMod = -50;
      effects.npcBehaviorMod = 'hiding_indoors';
      effects.moodMod = -10;
      break;
    case 'fog':
      effects.visibilityMod = weather.intensity === 'heavy' ? -40 : -20;
      effects.npcBehaviorMod = 'cautious';
      break;
    case 'snow':
      effects.outdoorActivityMod = weather.intensity === 'heavy' ? -40 : -20;
      effects.npcBehaviorMod = 'seeking_warmth';
      effects.moodMod = weather.intensity === 'light' ? 5 : -5;
      break;
    case 'clear':
      effects.moodMod = 5;
      effects.npcBehaviorMod = 'relaxed';
      break;
  }
  
  return effects;
}

// ============= AMBIENT EVENTS =============

export type AmbientEventType = 
  | 'npc_conversation' 
  | 'street_scene' 
  | 'atmospheric' 
  | 'rumor'
  | 'opportunity'
  | 'danger_hint'
  | 'world_change';

export interface AmbientEvent {
  id: string;
  type: AmbientEventType;
  location: string;
  description: string;
  timestamp: number;
  witnesses: string[];
  
  // For player interaction
  isInteractable: boolean;
  interactionPrompt?: string;
  interactionOutcomes?: string[];
  
  // Narrative relevance
  relatedNpcs?: string[];
  relatedQuests?: string[];
  foreshadowing?: string;
}

// Event templates by location type
const EVENT_TEMPLATES: Record<string, AmbientEvent[]> = {
  tavern: [
    {
      id: 'tavern_argument',
      type: 'npc_conversation',
      location: 'tavern_main',
      description: 'Two patrons argue loudly about politics at the bar.',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      interactionPrompt: 'You could intervene or listen in.',
    },
    {
      id: 'tavern_song',
      type: 'atmospheric',
      location: 'tavern_main',
      description: 'A traveling bard strums a melancholy tune about lost love.',
      timestamp: 0,
      witnesses: [],
      isInteractable: false,
    },
    {
      id: 'tavern_rumor',
      type: 'rumor',
      location: 'tavern_main',
      description: 'You overhear whispers about strange lights seen in the old ruins.',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      interactionPrompt: 'Ask about the rumors?',
      foreshadowing: 'ancient_treasure',
    },
  ],
  market: [
    {
      id: 'market_thief',
      type: 'street_scene',
      location: 'market',
      description: 'A commotion erupts as a vendor accuses someone of theft!',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      interactionPrompt: 'You could get involved or slip away.',
    },
    {
      id: 'market_deal',
      type: 'opportunity',
      location: 'market',
      description: 'A merchant seems desperate to offload some goods at a low price.',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      interactionPrompt: 'Investigate the deal?',
    },
    {
      id: 'market_gossip',
      type: 'rumor',
      location: 'market',
      description: 'Market gossip mentions a wealthy patron looking for \\"discreet help.\\"',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      foreshadowing: 'secret_job',
    },
  ],
  street: [
    {
      id: 'street_patrol',
      type: 'street_scene',
      location: 'town_square',
      description: 'A guard patrol marches through, their eyes scanning the crowd.',
      timestamp: 0,
      witnesses: [],
      isInteractable: false,
    },
    {
      id: 'street_beggar',
      type: 'street_scene',
      location: 'town_square',
      description: 'A ragged figure huddles in the shadows, asking for spare coin.',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      interactionPrompt: 'Give something or ignore them?',
    },
    {
      id: 'street_altercation',
      type: 'danger_hint',
      location: 'alley',
      description: 'Raised voices echo from a nearby alley. It sounds like trouble.',
      timestamp: 0,
      witnesses: [],
      isInteractable: true,
      interactionPrompt: 'Investigate or avoid?',
    },
  ],
  general: [
    {
      id: 'weather_change',
      type: 'atmospheric',
      location: 'any',
      description: 'The wind picks up, carrying the promise of changing weather.',
      timestamp: 0,
      witnesses: [],
      isInteractable: false,
    },
    {
      id: 'time_passage',
      type: 'atmospheric',
      location: 'any',
      description: 'Church bells ring in the distance, marking the hour.',
      timestamp: 0,
      witnesses: [],
      isInteractable: false,
    },
  ],
};

export function generateAmbientEvent(
  locationId: string,
  locationType: string,
  weather: WeatherState,
  timeOfDay: string,
  npcsPresent: string[]
): AmbientEvent | null {
  // 30% chance of ambient event per look/arrival
  if (Math.random() > 0.3) return null;
  
  // Get relevant templates
  let templates: AmbientEvent[] = [];
  
  if (locationType.includes('tavern')) {
    templates = [...EVENT_TEMPLATES.tavern];
  } else if (locationType.includes('market')) {
    templates = [...EVENT_TEMPLATES.market];
  } else {
    templates = [...EVENT_TEMPLATES.street];
  }
  
  // Always include general events
  templates = [...templates, ...EVENT_TEMPLATES.general];
  
  // Filter by conditions
  if (weather.current === 'storm' || weather.current === 'rain') {
    templates = templates.filter(t => 
      t.type !== 'street_scene' || t.location !== 'outdoor'
    );
  }
  
  if (timeOfDay === 'night') {
    templates = templates.filter(t => t.id !== 'market_deal');
  }
  
  if (templates.length === 0) return null;
  
  // Select random template
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    ...template,
    id: `${template.id}_${Date.now()}`,
    location: locationId,
    timestamp: Date.now(),
    witnesses: npcsPresent.slice(0, 2),
  };
}

// ============= TIME-BASED WORLD CHANGES =============

export interface WorldStateChange {
  type: 'npc_mood' | 'location_crowd' | 'shop_open' | 'event_trigger';
  target: string;
  change: string;
  narrative?: string;
}

export function getTimeBasedChanges(
  gameState: GameState,
  previousHour: number,
  currentHour: number
): WorldStateChange[] {
  const changes: WorldStateChange[] = [];
  
  // Shop hours (most shops: 8am-6pm)
  if (previousHour < 8 && currentHour >= 8) {
    changes.push({
      type: 'shop_open',
      target: 'market',
      change: 'opening',
      narrative: 'The market stalls begin to open for the day.',
    });
  }
  if (previousHour < 18 && currentHour >= 18) {
    changes.push({
      type: 'shop_open',
      target: 'market',
      change: 'closing',
      narrative: 'Merchants begin packing up their wares for the night.',
    });
  }
  
  // Tavern crowd
  if (previousHour < 18 && currentHour >= 18) {
    changes.push({
      type: 'location_crowd',
      target: 'tavern_main',
      change: 'increasing',
      narrative: 'The evening crowd begins to fill the tavern.',
    });
  }
  if (previousHour < 23 && currentHour >= 23) {
    changes.push({
      type: 'location_crowd',
      target: 'tavern_main',
      change: 'decreasing',
      narrative: 'The tavern grows quieter as patrons head home.',
    });
  }
  
  // Guard shift changes
  if (currentHour === 6 || currentHour === 14 || currentHour === 22) {
    changes.push({
      type: 'event_trigger',
      target: 'guards',
      change: 'shift_change',
      narrative: 'You notice guards changing their patrol shifts.',
    });
  }
  
  // Dawn/dusk transitions
  if (previousHour < 6 && currentHour >= 6) {
    changes.push({
      type: 'event_trigger',
      target: 'world',
      change: 'dawn',
      narrative: 'Dawn breaks, painting the sky in shades of gold and rose.',
    });
  }
  if (previousHour < 20 && currentHour >= 20) {
    changes.push({
      type: 'event_trigger',
      target: 'world',
      change: 'dusk',
      narrative: 'Dusk settles over the land as lanterns flicker to life.',
    });
  }
  
  return changes;
}

// ============= NPC DAILY ROUTINES =============

export interface NPCRoutineEvent {
  npcId: string;
  npcName: string;
  activity: string;
  location: string;
  narrative: string;
}

export function generateRoutineObservations(
  npcsPresent: NPC[],
  location: string,
  hour: number
): NPCRoutineEvent[] {
  const observations: NPCRoutineEvent[] = [];
  
  for (const npc of npcsPresent) {
    // Check if NPC just arrived or is doing something notable
    const scheduleEntry = npc.meta.schedule[hour];
    if (!scheduleEntry) continue;
    
    // 20% chance to generate observation for each NPC
    if (Math.random() > 0.2) continue;
    
    const activityNarratives: Record<string, string[]> = {
      'cooking': [
        `${npc.meta.name} is busy preparing food.`,
        `The smell of ${npc.meta.name}'s cooking fills the air.`,
      ],
      'serving': [
        `${npc.meta.name} moves between tables, taking orders.`,
        `${npc.meta.name} wipes down the bar, keeping busy.`,
      ],
      'patrol': [
        `${npc.meta.name} scans the area with a watchful eye.`,
        `${npc.meta.name} stands at attention, ever vigilant.`,
      ],
      'drinking': [
        `${npc.meta.name} nurses a drink, lost in thought.`,
        `${npc.meta.name} takes a long sip from their mug.`,
      ],
      'sleeping': [], // Don't generate for sleeping
      'story': [
        `${npc.meta.name} gestures animatedly, clearly in the middle of a tale.`,
      ],
    };
    
    // Find matching activity
    for (const [activityKey, narratives] of Object.entries(activityNarratives)) {
      if (npc.currentActivity.toLowerCase().includes(activityKey) && narratives.length > 0) {
        observations.push({
          npcId: npc.id,
          npcName: npc.meta.name,
          activity: npc.currentActivity,
          location,
          narrative: narratives[Math.floor(Math.random() * narratives.length)],
        });
        break;
      }
    }
  }
  
  return observations;
}

// ============= WORLD STATE TRACKER =============

// Limits to prevent unbounded growth
const MAX_AMBIENT_EVENTS = 10;
const MAX_PENDING_CHANGES = 20;
const MAX_RUMORS = 30;

export interface WorldState {
  weather: WeatherState;
  recentAmbientEvents: AmbientEvent[];
  pendingWorldChanges: WorldStateChange[];
  daysSinceLastMajorEvent: number;
  worldMood: 'peaceful' | 'tense' | 'chaotic'; // Affects random event frequency
  rumors: string[];
}

export function initializeWorldState(season: GameTime['season']): WorldState {
  return {
    weather: initializeWeather(season),
    recentAmbientEvents: [],
    pendingWorldChanges: [],
    daysSinceLastMajorEvent: 0,
    worldMood: 'peaceful',
    rumors: [
      'Strange lights have been seen near the old ruins.',
      'The merchants guild is tightening its grip on trade.',
      'A notorious figure has been spotted in the area.',
    ],
  };
}

export function updateWorldState(
  worldState: WorldState,
  gameState: GameState,
  hoursElapsed: number
): WorldState {
  // Update weather
  const newWeather = updateWeather(worldState.weather, gameState.time.season, hoursElapsed);
  
  // Clean up old ambient events with limit
  const recentEvents = worldState.recentAmbientEvents.slice(-MAX_AMBIENT_EVENTS);
  
  // Clean up pending world changes
  const pendingChanges = worldState.pendingWorldChanges.slice(-MAX_PENDING_CHANGES);
  
  // Limit rumors
  const rumors = worldState.rumors.slice(-MAX_RUMORS);
  
  // Increment days counter
  const daysSince = worldState.daysSinceLastMajorEvent + (hoursElapsed / 24);
  
  return {
    ...worldState,
    weather: newWeather,
    recentAmbientEvents: recentEvents,
    pendingWorldChanges: pendingChanges,
    rumors,
    daysSinceLastMajorEvent: daysSince,
  };
}

export function formatWorldStateForNarrative(worldState: WorldState, timePeriod: string): string {
  let narrative = getWeatherDescription(worldState.weather, timePeriod);
  
  // Add mood-based flavor
  if (worldState.worldMood === 'tense') {
    narrative += ' There is a palpable tension in the air.';
  } else if (worldState.worldMood === 'chaotic') {
    narrative += ' An air of unease pervades the area.';
  }
  
  return narrative;
}
