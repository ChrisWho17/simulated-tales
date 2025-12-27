// Weather System - Duration-based weather with spawn chances
// Weather lasts 30-120 ticks/turns with weighted spawn probabilities

export type WeatherType = 
  | 'clear'
  | 'cloudy' 
  | 'rain'
  | 'storm'
  | 'fog'
  | 'snow'
  | 'heat_wave'
  | 'wind';

export interface WeatherConfig {
  name: string;
  description: string;
  icon: string;
  spawnWeight: number; // Higher = more likely to spawn
  minDuration: number; // Min ticks
  maxDuration: number; // Max ticks
  effects: string[];
  ambientText: string;
  transitionText: string;
  moodInfluence?: string; // Optional mood this weather promotes
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: {
    name: 'Clear',
    description: 'The sky stretches endlessly blue, with not a cloud in sight. Perfect conditions for travel.',
    icon: '☀',
    spawnWeight: 35, // Highest chance
    minDuration: 60,
    maxDuration: 120,
    effects: ['✦ Excellent visibility', '✦ Comfortable temperature', '✦ Ideal travel conditions'],
    ambientText: 'Warm sunlight bathes the landscape. Birds sing in the distance.',
    transitionText: 'The clouds part, revealing a brilliant blue sky.',
  },
  cloudy: {
    name: 'Overcast',
    description: 'Gray clouds blanket the sky, diffusing the light into a soft, even glow. The air feels heavy with possibility.',
    icon: '☁',
    spawnWeight: 25,
    minDuration: 40,
    maxDuration: 100,
    effects: ['◌ Reduced visibility', '◌ Cooler temperature', '◌ Rain may be coming'],
    ambientText: 'A ceiling of gray stretches from horizon to horizon.',
    transitionText: 'Clouds roll in, dimming the light.',
    moodInfluence: 'neutral',
  },
  rain: {
    name: 'Rain',
    description: 'Steady rainfall patters against every surface. The world takes on a muted, contemplative quality.',
    icon: '🌧',
    spawnWeight: 15,
    minDuration: 30,
    maxDuration: 80,
    effects: ['🌧 Reduced visibility', '🌧 Wet conditions', '🌧 Slower travel', '🌧 Tracks wash away'],
    ambientText: 'Raindrops drum a steady rhythm. Puddles form in low places.',
    transitionText: 'The first drops begin to fall, quickly becoming a steady rain.',
    moodInfluence: 'sad',
  },
  storm: {
    name: 'Storm',
    description: 'Lightning splits the sky as thunder shakes the ground. Nature unleashes its fury.',
    icon: '⛈',
    spawnWeight: 5,
    minDuration: 30,
    maxDuration: 60,
    effects: ['⚡ Very poor visibility', '⚡ Lightning danger', '⚡ Travel hazardous', '⚡ Shelter advised'],
    ambientText: 'Thunder crashes overhead. Lightning illuminates the darkness in violent flashes.',
    transitionText: 'The sky darkens ominously as the first bolt of lightning tears across the heavens.',
    moodInfluence: 'fearful',
  },
  fog: {
    name: 'Fog',
    description: 'A thick mist blankets everything, reducing the world to ghostly silhouettes and muffled sounds.',
    icon: '🌫',
    spawnWeight: 8,
    minDuration: 30,
    maxDuration: 70,
    effects: ['🌫 Severely limited visibility', '🌫 Sounds distorted', '🌫 Easy to get lost', '🌫 Perfect for stealth'],
    ambientText: 'The fog swallows everything beyond a few paces. Sounds seem to come from everywhere and nowhere.',
    transitionText: 'Mist creeps in silently, tendrils wrapping around everything.',
    moodInfluence: 'suspicious',
  },
  snow: {
    name: 'Snow',
    description: 'Snowflakes drift down from leaden skies, blanketing the world in white silence.',
    icon: '❄',
    spawnWeight: 6,
    minDuration: 40,
    maxDuration: 90,
    effects: ['❄ Cold conditions', '❄ Tracks visible', '❄ Reduced speed', '❄ Beautiful scenery'],
    ambientText: 'Snowflakes dance on the wind, settling softly on every surface.',
    transitionText: 'The first snowflakes begin their gentle descent from gray skies.',
    moodInfluence: 'neutral',
  },
  heat_wave: {
    name: 'Heat Wave',
    description: 'Oppressive heat radiates from every surface. The air shimmers with intensity.',
    icon: '🔥',
    spawnWeight: 4,
    minDuration: 40,
    maxDuration: 80,
    effects: ['🔥 Exhausting conditions', '🔥 Dehydration risk', '🔥 Tempers may flare', '🔥 Seek shade'],
    ambientText: 'Heat rises in visible waves. Every breath feels thick and heavy.',
    transitionText: 'The temperature climbs relentlessly as the sun beats down without mercy.',
    moodInfluence: 'mad',
  },
  wind: {
    name: 'Windy',
    description: 'Strong gusts whip across the land, carrying dust and debris. Everything feels restless.',
    icon: '💨',
    spawnWeight: 10,
    minDuration: 30,
    maxDuration: 70,
    effects: ['💨 Ranged attacks affected', '💨 Debris hazard', '💨 Noise masks sounds', '💨 Fire spreads easily'],
    ambientText: 'The wind howls and gusts, never settling into any rhythm.',
    transitionText: 'A sudden gust announces the arrival of strong winds.',
    moodInfluence: 'annoyed',
  },
};

export interface WeatherState {
  current: WeatherType;
  ticksRemaining: number;
  totalDuration: number;
  intensity: number; // 0.5-1.5, affects severity
  transitioningTo: WeatherType | null;
  history: Array<{ weather: WeatherType; startedAt: number }>;
}

export function createInitialWeatherState(): WeatherState {
  return {
    current: 'clear',
    ticksRemaining: rollDuration('clear'),
    totalDuration: 90,
    intensity: 1.0,
    transitioningTo: null,
    history: [{ weather: 'clear', startedAt: 0 }],
  };
}

function rollDuration(weather: WeatherType): number {
  const config = WEATHER_CONFIGS[weather];
  return Math.floor(Math.random() * (config.maxDuration - config.minDuration + 1)) + config.minDuration;
}

function selectNextWeather(currentWeather: WeatherType): WeatherType {
  // Build weighted selection array
  const weights: Array<{ weather: WeatherType; weight: number }> = [];
  let totalWeight = 0;
  
  for (const [weather, config] of Object.entries(WEATHER_CONFIGS)) {
    // Slightly reduce chance of repeating same weather
    const weight = weather === currentWeather ? config.spawnWeight * 0.3 : config.spawnWeight;
    weights.push({ weather: weather as WeatherType, weight });
    totalWeight += weight;
  }
  
  // Random selection based on weights
  let roll = Math.random() * totalWeight;
  for (const { weather, weight } of weights) {
    roll -= weight;
    if (roll <= 0) {
      return weather;
    }
  }
  
  return 'clear'; // Fallback
}

export function tickWeather(state: WeatherState, currentTick: number): WeatherState {
  const newState = { ...state };
  newState.ticksRemaining--;
  
  // Weather is ending - select new weather
  if (newState.ticksRemaining <= 0) {
    const nextWeather = selectNextWeather(state.current);
    const duration = rollDuration(nextWeather);
    
    newState.current = nextWeather;
    newState.ticksRemaining = duration;
    newState.totalDuration = duration;
    newState.intensity = 0.5 + Math.random() * 1.0; // Random intensity
    newState.transitioningTo = null;
    newState.history = [
      ...state.history.slice(-9), // Keep last 10
      { weather: nextWeather, startedAt: currentTick }
    ];
  }
  // Warn of transition when 5 ticks remaining
  else if (newState.ticksRemaining <= 5 && !newState.transitioningTo) {
    newState.transitioningTo = selectNextWeather(state.current);
  }
  
  return newState;
}

export function forceWeather(state: WeatherState, weather: WeatherType, currentTick: number): WeatherState {
  const duration = rollDuration(weather);
  return {
    ...state,
    current: weather,
    ticksRemaining: duration,
    totalDuration: duration,
    intensity: 0.5 + Math.random() * 1.0,
    transitioningTo: null,
    history: [
      ...state.history.slice(-9),
      { weather, startedAt: currentTick }
    ],
  };
}

export function getWeatherProgress(state: WeatherState): number {
  return 1 - (state.ticksRemaining / state.totalDuration);
}

export function getWeatherNarrativeContext(state: WeatherState): string {
  const config = WEATHER_CONFIGS[state.current];
  const intensity = state.intensity > 1.2 ? 'intense' : state.intensity < 0.7 ? 'mild' : 'moderate';
  
  let context = `Current weather: ${config.name} (${intensity}). `;
  context += config.ambientText;
  
  if (state.transitioningTo) {
    const nextConfig = WEATHER_CONFIGS[state.transitioningTo];
    context += ` The weather appears to be changing—${nextConfig.name.toLowerCase()} conditions approach.`;
  }
  
  return context;
}

// Map weather to mood for synergy
export function getWeatherMoodSynergy(weather: WeatherType): string | null {
  return WEATHER_CONFIGS[weather].moodInfluence || null;
}
