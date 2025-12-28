// Temperature System - Environmental and body temperature tracking
// Body temp affected by weather, sickness, infection, blood loss etc.

import { WeatherType, WEATHER_CONFIGS } from './weatherSystem';

// Environmental temperature range by weather type (in Fahrenheit for display)
export const WEATHER_TEMPERATURE: Record<WeatherType, { min: number; max: number }> = {
  clear: { min: 68, max: 85 },
  cloudy: { min: 55, max: 72 },
  rain: { min: 50, max: 65 },
  storm: { min: 45, max: 60 },
  fog: { min: 48, max: 62 },
  snow: { min: 15, max: 32 },
  heat_wave: { min: 95, max: 115 },
  wind: { min: 40, max: 65 },
};

// Normal body temperature is 98.6°F
export const NORMAL_BODY_TEMP = 98.6;
export const HYPOTHERMIA_THRESHOLD = 95;
export const FEVER_THRESHOLD = 100.4;
export const HIGH_FEVER_THRESHOLD = 103;
export const CRITICAL_FEVER_THRESHOLD = 105;

export type BodyTempCondition = 
  | 'hypothermic' 
  | 'cold' 
  | 'normal' 
  | 'warm' 
  | 'fever' 
  | 'high_fever' 
  | 'critical';

export interface TemperatureState {
  environmental: number;  // Current environmental temperature
  bodyTemp: number;       // Player's body temperature
  lastUpdated: number;    // Timestamp
}

export interface BodyTempModifier {
  source: string;
  effect: number;  // Degrees change to body temp
  description: string;
}

// Conditions that affect body temperature (only sickness-related in realism mode)
export const REALISM_TEMP_MODIFIERS: Record<string, BodyTempModifier> = {
  infection: { source: 'Infection', effect: 2.5, description: 'Fighting infection' },
  sickness: { source: 'Sickness', effect: 1.8, description: 'Ill and feverish' },
  disease: { source: 'Disease', effect: 3.0, description: 'Severe illness' },
  poisoned: { source: 'Poisoned', effect: 1.5, description: 'Toxins in system' },
  hypothermia: { source: 'Hypothermia', effect: -4.0, description: 'Dangerously cold' },
  frostbite: { source: 'Frostbite', effect: -2.0, description: 'Cold exposure damage' },
  heat_exhaustion: { source: 'Heat Exhaustion', effect: 2.0, description: 'Overheated' },
};

// Blood loss modifier - applies in all modes but is descriptive only
export const BLOOD_LOSS_MODIFIER: BodyTempModifier = {
  source: 'Blood Loss',
  effect: -1.5,
  description: 'Losing body heat from blood loss',
};

export function createInitialTemperatureState(weather: WeatherType): TemperatureState {
  const tempRange = WEATHER_TEMPERATURE[weather] || WEATHER_TEMPERATURE.clear;
  const environmental = Math.round(tempRange.min + Math.random() * (tempRange.max - tempRange.min));
  
  return {
    environmental,
    bodyTemp: NORMAL_BODY_TEMP,
    lastUpdated: Date.now(),
  };
}

export function updateEnvironmentalTemp(
  state: TemperatureState, 
  weather: WeatherType,
  intensity: number = 1.0
): TemperatureState {
  const tempRange = WEATHER_TEMPERATURE[weather] || WEATHER_TEMPERATURE.clear;
  
  // Calculate base temp with intensity affecting extremes
  const baseTemp = (tempRange.min + tempRange.max) / 2;
  const variance = (tempRange.max - tempRange.min) / 2;
  const intensityOffset = (intensity - 1.0) * variance * 0.5;
  
  // Add small random variance
  const randomVariance = (Math.random() - 0.5) * 5;
  
  return {
    ...state,
    environmental: Math.round(baseTemp + intensityOffset + randomVariance),
    lastUpdated: Date.now(),
  };
}

export function calculateBodyTemp(
  baseTemp: number,
  activeConditions: string[],
  isRealismMode: boolean,
  hasBloodLoss: boolean
): { temp: number; modifiers: BodyTempModifier[] } {
  let temp = baseTemp;
  const modifiers: BodyTempModifier[] = [];
  
  // Apply realism-only modifiers (sickness, infection, etc.)
  if (isRealismMode) {
    activeConditions.forEach(condition => {
      const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
      const modifier = REALISM_TEMP_MODIFIERS[conditionKey];
      if (modifier) {
        temp += modifier.effect;
        modifiers.push(modifier);
      }
    });
  }
  
  // Blood loss is descriptive in all modes - shows the effect but doesn't mechanically hurt
  if (hasBloodLoss) {
    modifiers.push(BLOOD_LOSS_MODIFIER);
    // Only apply temp change if in realism mode
    if (isRealismMode) {
      temp += BLOOD_LOSS_MODIFIER.effect;
    }
  }
  
  return { temp: Math.round(temp * 10) / 10, modifiers };
}

export function getBodyTempCondition(temp: number): BodyTempCondition {
  if (temp < HYPOTHERMIA_THRESHOLD) return 'hypothermic';
  if (temp < 97) return 'cold';
  if (temp <= 99.5) return 'normal';
  if (temp < FEVER_THRESHOLD) return 'warm';
  if (temp < HIGH_FEVER_THRESHOLD) return 'fever';
  if (temp < CRITICAL_FEVER_THRESHOLD) return 'high_fever';
  return 'critical';
}

export function getBodyTempLabel(condition: BodyTempCondition): string {
  switch (condition) {
    case 'hypothermic': return 'Hypothermic';
    case 'cold': return 'Cold';
    case 'normal': return 'Normal';
    case 'warm': return 'Warm';
    case 'fever': return 'Fever';
    case 'high_fever': return 'High Fever';
    case 'critical': return 'Critical';
  }
}

export function getBodyTempColor(condition: BodyTempCondition): string {
  switch (condition) {
    case 'hypothermic': return 'text-blue-400';
    case 'cold': return 'text-blue-300';
    case 'normal': return 'text-green-400';
    case 'warm': return 'text-yellow-400';
    case 'fever': return 'text-orange-400';
    case 'high_fever': return 'text-red-400';
    case 'critical': return 'text-red-600';
  }
}

// Format temperature for display
export function formatTemp(temp: number, unit: 'F' | 'C' = 'F'): string {
  if (unit === 'C') {
    const celsius = (temp - 32) * 5 / 9;
    return `${celsius.toFixed(1)}°C`;
  }
  return `${temp.toFixed(1)}°F`;
}

// Get weather icon for temperature display consistency
export function getWeatherIconName(weather: WeatherType): string {
  return WEATHER_CONFIGS[weather]?.icon || '☀';
}
