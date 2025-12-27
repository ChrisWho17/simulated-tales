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

// ============= WEATHER GAMEPLAY EFFECTS =============

export interface WeatherGameplayModifiers {
  visibilityMod: number;      // -50 to +10 (percentage modifier)
  movementMod: number;        // -30 to +10 (percentage modifier)
  rangedAccuracyMod: number;  // -40 to +10 (percentage modifier)
  stealthMod: number;         // -20 to +30 (percentage modifier)
  perceptionMod: number;      // -40 to +10 (percentage modifier)
  fatigueRateMod: number;     // 0.5 to 2.0 (multiplier)
  description: string;
}

export const WEATHER_GAMEPLAY_EFFECTS: Record<WeatherType, WeatherGameplayModifiers> = {
  clear: {
    visibilityMod: 10,
    movementMod: 5,
    rangedAccuracyMod: 5,
    stealthMod: -10,
    perceptionMod: 10,
    fatigueRateMod: 0.9,
    description: 'Perfect conditions. Visibility excellent, travel easy.',
  },
  cloudy: {
    visibilityMod: -5,
    movementMod: 0,
    rangedAccuracyMod: 0,
    stealthMod: 5,
    perceptionMod: -5,
    fatigueRateMod: 1.0,
    description: 'Overcast skies provide some cover but no major hindrances.',
  },
  rain: {
    visibilityMod: -20,
    movementMod: -10,
    rangedAccuracyMod: -15,
    stealthMod: 15,
    perceptionMod: -15,
    fatigueRateMod: 1.2,
    description: 'Rain hampers visibility and makes footing treacherous. Sound is muffled.',
  },
  storm: {
    visibilityMod: -40,
    movementMod: -20,
    rangedAccuracyMod: -35,
    stealthMod: 25,
    perceptionMod: -30,
    fatigueRateMod: 1.5,
    description: 'Thunder masks sounds. Lightning blinds. Movement is hazardous.',
  },
  fog: {
    visibilityMod: -50,
    movementMod: -5,
    rangedAccuracyMod: -40,
    stealthMod: 30,
    perceptionMod: -40,
    fatigueRateMod: 1.1,
    description: 'Dense fog limits visibility to mere feet. Perfect for ambushes.',
  },
  snow: {
    visibilityMod: -25,
    movementMod: -20,
    rangedAccuracyMod: -10,
    stealthMod: -15,
    perceptionMod: -10,
    fatigueRateMod: 1.4,
    description: 'Snow slows movement and leaves tracks. Cold saps energy.',
  },
  heat_wave: {
    visibilityMod: -10,
    movementMod: -15,
    rangedAccuracyMod: -5,
    stealthMod: 0,
    perceptionMod: -5,
    fatigueRateMod: 1.8,
    description: 'Oppressive heat causes exhaustion. Mirages distort vision.',
  },
  wind: {
    visibilityMod: -15,
    movementMod: -10,
    rangedAccuracyMod: -25,
    stealthMod: 10,
    perceptionMod: -20,
    fatigueRateMod: 1.2,
    description: 'Strong winds affect projectiles and mask sounds.',
  },
};

export function getWeatherModifiers(state: WeatherState): WeatherGameplayModifiers {
  const base = WEATHER_GAMEPLAY_EFFECTS[state.current];
  
  // Scale modifiers by intensity (0.5-1.5)
  const intensityScale = state.intensity;
  
  return {
    visibilityMod: Math.round(base.visibilityMod * intensityScale),
    movementMod: Math.round(base.movementMod * intensityScale),
    rangedAccuracyMod: Math.round(base.rangedAccuracyMod * intensityScale),
    stealthMod: Math.round(base.stealthMod * intensityScale),
    perceptionMod: Math.round(base.perceptionMod * intensityScale),
    fatigueRateMod: 1 + (base.fatigueRateMod - 1) * intensityScale,
    description: base.description,
  };
}

// Get skill check modifier for weather
export function getWeatherSkillModifier(
  state: WeatherState, 
  skillType: 'ranged' | 'stealth' | 'perception' | 'athletics' | 'survival'
): number {
  const mods = getWeatherModifiers(state);
  
  switch (skillType) {
    case 'ranged': return mods.rangedAccuracyMod;
    case 'stealth': return mods.stealthMod;
    case 'perception': return mods.perceptionMod;
    case 'athletics': return mods.movementMod;
    case 'survival': return state.current === 'clear' ? 5 : -10;
    default: return 0;
  }
}

// Format weather effects for AI context
export function formatWeatherEffectsForAI(state: WeatherState): string {
  const config = WEATHER_CONFIGS[state.current];
  const mods = getWeatherModifiers(state);
  const intensity = state.intensity > 1.2 ? 'intense' : state.intensity < 0.7 ? 'mild' : 'moderate';
  
  let context = `Current weather: ${config.name} (${intensity}). `;
  context += mods.description + ' ';
  
  // Add specific mechanical effects
  const effects: string[] = [];
  if (mods.visibilityMod !== 0) effects.push(`Visibility ${mods.visibilityMod > 0 ? '+' : ''}${mods.visibilityMod}%`);
  if (mods.movementMod !== 0) effects.push(`Movement ${mods.movementMod > 0 ? '+' : ''}${mods.movementMod}%`);
  if (mods.rangedAccuracyMod !== 0) effects.push(`Ranged ${mods.rangedAccuracyMod > 0 ? '+' : ''}${mods.rangedAccuracyMod}%`);
  
  if (effects.length > 0) {
    context += `Effects: ${effects.join(', ')}.`;
  }
  
  return context;
}
