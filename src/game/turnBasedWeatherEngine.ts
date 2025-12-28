// ============================================
// TURN-BASED WEATHER ENGINE
// Percentage-driven transitions and weather fronts
// ============================================

import { 
  GeographicClimateSystem, 
  GeographicRegion, 
  GeographicWeatherType, 
  GameDate,
  GeneratedWeather,
  SeasonType,
  ClimateZoneId,
  CLIMATE_ZONES
} from './geographicClimateSystem';

// ============================================
// TYPES
// ============================================

export type WeatherFrontType = 'cold' | 'warm' | 'storm' | 'highPressure';
export type Direction = 'north' | 'south' | 'east' | 'west';

export interface WeatherProbability {
  weight: number;
  percent: number;
  cumulative: number;
}

export interface RegionWeatherState extends GeneratedWeather {
  regionId: string;
  remainingTurns: number;
  totalTurns: number;
  rolledProbabilities?: Record<GeographicWeatherType, WeatherProbability>;
  roll?: number;
}

export interface WeatherFront {
  id: string;
  type: WeatherFrontType;
  strength: number;
  originRegion: string;
  affectedRegions: string[];
  direction: Direction;
  speed: number;
  turnsToMove: number;
  turnsPerMove: number;
  age: number;
  maxAge: number;
  weatherInfluence: Record<string, number>;
}

export interface WeatherChange {
  regionId: string;
  oldWeather: GeographicWeatherType | undefined;
  newWeather: GeographicWeatherType;
  probabilities: Record<GeographicWeatherType, WeatherProbability>;
  roll: number;
  temperature: number;
  humidity: number;
  durationTurns: number;
}

export interface FrontMovement {
  frontId: string;
  frontType: WeatherFrontType;
  enteredRegion: string;
  strength: number;
}

export interface TurnResults {
  weatherChanges: WeatherChange[];
  frontMovements: FrontMovement[];
}

export interface WeatherEngineConfig {
  turnsPerHour: number;
  hoursPerDay: number;
  checkTransitionEveryTurn: boolean;
}

export interface ForecastEntry {
  weather: GeographicWeatherType;
  chance: number;
  possible: boolean;
}

export interface WeatherDisplayData {
  type: GeographicWeatherType;
  temperature: number;
  humidity: number;
  intensity: 1 | 2 | 3;
  turnsRemaining: number;
  percentRemaining: number;
  description: string;
  probabilities?: Record<GeographicWeatherType, WeatherProbability>;
}

export interface ActiveFrontInfo {
  type: WeatherFrontType;
  strength: number;
  direction: Direction;
  description: string;
}

// ============================================
// WEATHER ENGINE
// ============================================

class TurnBasedWeatherEngineClass {
  regionWeather: Map<string, RegionWeatherState> = new Map();
  activeFronts: WeatherFront[] = [];
  regions: Map<string, GeographicRegion> = new Map();
  
  config: WeatherEngineConfig = {
    turnsPerHour: 1,
    hoursPerDay: 24,
    checkTransitionEveryTurn: true
  };

  // Region connections for front movement
  regionConnections: Record<string, Record<Direction, string | null>> = {};

  // ============================================
  // INITIALIZATION
  // ============================================

  registerRegion(region: GeographicRegion): void {
    this.regions.set(region.id, region);
  }

  setRegionConnections(connections: Record<string, Record<Direction, string | null>>): void {
    this.regionConnections = connections;
  }

  initializeRegion(regionId: string, gameDate: GameDate): RegionWeatherState | null {
    const region = this.regions.get(regionId);
    if (!region) return null;
    
    const weather = GeographicClimateSystem.generateWeather(region, gameDate);
    const durationHours = GeographicClimateSystem.rollDuration(weather.type, region.climate);
    
    const state: RegionWeatherState = {
      ...weather,
      regionId,
      remainingTurns: durationHours * this.config.turnsPerHour,
      totalTurns: durationHours * this.config.turnsPerHour
    };
    
    this.regionWeather.set(regionId, state);
    return state;
  }

  initializeAllRegions(gameDate: GameDate): void {
    this.regions.forEach((_, regionId) => {
      this.initializeRegion(regionId, gameDate);
    });
  }

  // ============================================
  // TURN PROCESSING
  // ============================================

  processTurn(gameDate: GameDate): TurnResults {
    const results: TurnResults = {
      weatherChanges: [],
      frontMovements: []
    };
    
    // Maybe spawn a new weather front
    this.maybeSpawnFront(gameDate);
    
    // Process each region
    this.regionWeather.forEach((_, regionId) => {
      const change = this.processRegionTurn(regionId, gameDate);
      if (change) {
        results.weatherChanges.push(change);
      }
    });
    
    // Move weather fronts
    results.frontMovements = this.processWeatherFronts(gameDate);
    
    return results;
  }

  private processRegionTurn(regionId: string, gameDate: GameDate): WeatherChange | null {
    const current = this.regionWeather.get(regionId);
    if (!current) return null;
    
    current.remainingTurns--;
    
    // Check for weather change
    if (current.remainingTurns <= 0) {
      return this.transitionWeather(regionId, gameDate);
    }
    
    // Check for random early transition
    const transitionChance = this.calculateEarlyTransitionChance(current, gameDate);
    if (Math.random() * 100 < transitionChance) {
      return this.transitionWeather(regionId, gameDate);
    }
    
    return null;
  }

  // ============================================
  // PROBABILITY CALCULATION
  // ============================================

  calculateWeatherProbabilities(
    regionId: string, 
    gameDate: GameDate
  ): Record<GeographicWeatherType, WeatherProbability> {
    const region = this.regions.get(regionId);
    const current = this.regionWeather.get(regionId);
    
    if (!region) {
      return this.getEmptyProbabilities();
    }
    
    const climate = region.climate;
    const season = GeographicClimateSystem.getSeason(gameDate, region.latitude);
    
    // Start with base climate weights
    let weights = { ...climate.weatherWeights };
    
    // Apply seasonal modifiers
    weights = GeographicClimateSystem.applySeasonalModifiers(weights, climate, season, gameDate.month);
    
    // Apply regional modifiers
    weights = GeographicClimateSystem.applyRegionalModifiers(weights, region.modifiers);
    
    // Apply elevation effects
    if (region.elevation > 0) {
      weights = GeographicClimateSystem.applyElevationEffects(weights, region.elevation, season);
    }
    
    // Apply transition matrix
    if (current) {
      weights = this.applyTransitionMatrix(weights, current.type);
    }
    
    // Apply active weather fronts
    this.activeFronts.forEach(front => {
      if (front.affectedRegions.includes(regionId)) {
        weights = this.applyFrontInfluence(weights, front);
      }
    });
    
    // Apply time of day effects
    weights = this.applyTimeOfDay(weights, gameDate.hour);
    
    // Convert to percentages
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const percentages: Record<GeographicWeatherType, WeatherProbability> = {} as any;
    
    Object.entries(weights).forEach(([weather, weight]) => {
      percentages[weather as GeographicWeatherType] = {
        weight,
        percent: total > 0 ? (weight / total) * 100 : 0,
        cumulative: 0
      };
    });
    
    // Calculate cumulative
    let cumulative = 0;
    Object.keys(percentages).forEach(weather => {
      cumulative += percentages[weather as GeographicWeatherType].percent;
      percentages[weather as GeographicWeatherType].cumulative = cumulative;
    });
    
    return percentages;
  }

  private getEmptyProbabilities(): Record<GeographicWeatherType, WeatherProbability> {
    const types: GeographicWeatherType[] = ['clear', 'overcast', 'rain', 'storm', 'fog', 'snow', 'heatWave', 'windy'];
    const result: Record<GeographicWeatherType, WeatherProbability> = {} as any;
    types.forEach(t => {
      result[t] = { weight: 0, percent: 0, cumulative: 0 };
    });
    return result;
  }

  // Transition matrix: what weather tends to follow what
  private applyTransitionMatrix(
    weights: Record<GeographicWeatherType, number>,
    currentWeather: GeographicWeatherType
  ): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    
    const transitionModifiers: Record<GeographicWeatherType, Partial<Record<GeographicWeatherType, number>>> = {
      clear: {
        clear: 1.5, overcast: 1.3, rain: 0.5, storm: 0.3,
        fog: 0.8, snow: 0.4, heatWave: 1.4, windy: 1.0
      },
      overcast: {
        clear: 0.8, overcast: 1.3, rain: 1.8, storm: 1.2,
        fog: 1.3, snow: 1.5, heatWave: 0.2, windy: 1.2
      },
      rain: {
        clear: 0.6, overcast: 1.5, rain: 1.4, storm: 1.6,
        fog: 1.4, snow: 0.8, heatWave: 0.1, windy: 1.0
      },
      storm: {
        clear: 0.8, overcast: 1.4, rain: 1.6, storm: 0.8,
        fog: 0.6, snow: 0.7, heatWave: 0.1, windy: 1.5
      },
      fog: {
        clear: 1.8, overcast: 1.3, rain: 0.8, storm: 0.3,
        fog: 1.2, snow: 0.6, heatWave: 0.5, windy: 0.4
      },
      snow: {
        clear: 0.9, overcast: 1.4, rain: 0.4, storm: 0.8,
        fog: 1.2, snow: 1.6, heatWave: 0, windy: 1.3
      },
      heatWave: {
        clear: 1.5, overcast: 0.8, rain: 0.3, storm: 1.4,
        fog: 0.2, snow: 0, heatWave: 1.4, windy: 0.8
      },
      windy: {
        clear: 1.4, overcast: 1.2, rain: 0.9, storm: 1.3,
        fog: 0.3, snow: 1.0, heatWave: 0.6, windy: 1.1
      }
    };
    
    const modifiers = transitionModifiers[currentWeather] || {};
    Object.entries(modifiers).forEach(([weather, mult]) => {
      const w = weather as GeographicWeatherType;
      modified[w] = (modified[w] || 0) * (mult || 1);
    });
    
    return modified;
  }

  // Time of day affects certain weather
  private applyTimeOfDay(
    weights: Record<GeographicWeatherType, number>,
    hour: number
  ): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    
    // Morning fog (5am - 9am)
    if (hour >= 5 && hour <= 9) {
      modified.fog *= 2.0;
    } else {
      modified.fog *= 0.6;
    }
    
    // Afternoon storms (2pm - 7pm)
    if (hour >= 14 && hour <= 19) {
      modified.storm *= 1.5;
      modified.heatWave *= 1.3;
    }
    
    // Night cooling
    if (hour >= 21 || hour <= 5) {
      modified.heatWave *= 0.4;
      modified.fog *= 1.3;
    }
    
    return modified;
  }

  private calculateEarlyTransitionChance(current: RegionWeatherState, gameDate: GameDate): number {
    const baseInstability: Record<GeographicWeatherType, number> = {
      clear: 2,
      overcast: 5,
      rain: 8,
      storm: 15,
      fog: 10,
      snow: 6,
      heatWave: 3,
      windy: 12
    };
    
    let chance = baseInstability[current.type] || 5;
    
    // Weather fronts increase instability
    this.activeFronts.forEach(front => {
      if (front.affectedRegions.includes(current.regionId)) {
        chance += 10;
      }
    });
    
    // Season transitions are unstable
    if ([3, 6, 9, 12].includes(gameDate.month)) {
      chance += 5;
    }
    
    return chance;
  }

  // ============================================
  // WEATHER TRANSITIONS
  // ============================================

  transitionWeather(regionId: string, gameDate: GameDate): WeatherChange | null {
    const region = this.regions.get(regionId);
    const oldWeather = this.regionWeather.get(regionId);
    
    if (!region) return null;
    
    const probabilities = this.calculateWeatherProbabilities(regionId, gameDate);
    
    // Roll for new weather
    const roll = Math.random() * 100;
    let newWeatherType: GeographicWeatherType = 'clear';
    
    for (const [weather, data] of Object.entries(probabilities)) {
      if (roll <= data.cumulative && data.percent > 0) {
        newWeatherType = weather as GeographicWeatherType;
        break;
      }
    }
    
    // Prevent impossible weather
    if (!GeographicClimateSystem.isWeatherPossible(region, newWeatherType)) {
      newWeatherType = 'clear';
    }
    
    // Generate full weather object
    const newWeather = GeographicClimateSystem.generateWeather(region, gameDate);
    newWeather.type = newWeatherType;
    
    // Calculate duration in turns
    const durationHours = GeographicClimateSystem.rollDuration(newWeatherType, region.climate);
    
    const state: RegionWeatherState = {
      ...newWeather,
      regionId,
      remainingTurns: durationHours * this.config.turnsPerHour,
      totalTurns: durationHours * this.config.turnsPerHour,
      rolledProbabilities: probabilities,
      roll
    };
    
    this.regionWeather.set(regionId, state);
    
    return {
      regionId,
      oldWeather: oldWeather?.type,
      newWeather: newWeatherType,
      probabilities,
      roll,
      temperature: newWeather.temperature,
      humidity: newWeather.humidity,
      durationTurns: state.remainingTurns
    };
  }

  // ============================================
  // WEATHER FRONTS
  // ============================================

  createWeatherFront(config: {
    type: WeatherFrontType;
    strength?: number;
    originRegion: string;
    direction: Direction;
    speed?: number;
    maxAge?: number;
  }): WeatherFront {
    const front: WeatherFront = {
      id: `front_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: config.type,
      strength: config.strength || 1,
      originRegion: config.originRegion,
      affectedRegions: [config.originRegion],
      direction: config.direction,
      speed: config.speed || 2,
      turnsToMove: 0,
      turnsPerMove: Math.floor(24 / (config.speed || 2)) * this.config.turnsPerHour,
      age: 0,
      maxAge: (config.maxAge || 72) * this.config.turnsPerHour,
      weatherInfluence: this.getFrontInfluence(config.type)
    };
    
    this.activeFronts.push(front);
    return front;
  }

  private getFrontInfluence(frontType: WeatherFrontType): Record<string, number> {
    const influences: Record<WeatherFrontType, Record<string, number>> = {
      cold: {
        snow: 2.5, rain: 1.3, clear: 0.4, heatWave: 0,
        storm: 1.2, temperatureOffset: -10
      },
      warm: {
        clear: 1.5, heatWave: 2.0, rain: 0.8, snow: 0.1,
        fog: 0.5, temperatureOffset: 8
      },
      storm: {
        storm: 3.0, rain: 2.0, clear: 0.2, overcast: 1.5,
        windy: 2.0, temperatureOffset: -3
      },
      highPressure: {
        clear: 2.5, overcast: 0.4, rain: 0.2, storm: 0.1,
        fog: 1.5, temperatureOffset: 3
      }
    };
    
    return influences[frontType] || {};
  }

  private applyFrontInfluence(
    weights: Record<GeographicWeatherType, number>,
    front: WeatherFront
  ): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    const influence = front.weatherInfluence;
    
    Object.entries(influence).forEach(([key, value]) => {
      if (key !== 'temperatureOffset' && modified[key as GeographicWeatherType] !== undefined) {
        modified[key as GeographicWeatherType] *= value * front.strength;
      }
    });
    
    return modified;
  }

  private processWeatherFronts(gameDate: GameDate): FrontMovement[] {
    const movements: FrontMovement[] = [];
    
    this.activeFronts = this.activeFronts.filter(front => {
      front.age++;
      front.turnsToMove++;
      
      if (front.turnsToMove >= front.turnsPerMove) {
        front.turnsToMove = 0;
        
        const lastRegion = front.affectedRegions[front.affectedRegions.length - 1];
        const nextRegion = this.getNextRegionInDirection(lastRegion, front.direction);
        
        if (nextRegion && !front.affectedRegions.includes(nextRegion)) {
          front.affectedRegions.push(nextRegion);
          
          movements.push({
            frontId: front.id,
            frontType: front.type,
            enteredRegion: nextRegion,
            strength: front.strength
          });
          
          // Front entering can trigger immediate weather change
          if (Math.random() < 0.6) {
            this.transitionWeather(nextRegion, gameDate);
          }
        }
        
        // Old regions leave influence
        if (front.affectedRegions.length > 3) {
          front.affectedRegions.shift();
        }
      }
      
      // Front weakens over time
      if (front.age > front.maxAge * 0.5) {
        front.strength = Math.max(0.5, front.strength - 0.01);
      }
      
      return front.age < front.maxAge;
    });
    
    return movements;
  }

  private getNextRegionInDirection(currentRegion: string, direction: Direction): string | null {
    const connections = this.regionConnections[currentRegion];
    return connections ? connections[direction] : null;
  }

  maybeSpawnFront(gameDate: GameDate): WeatherFront | null {
    // Low chance each turn
    if (Math.random() > 0.02) return null;
    
    const frontTypes: WeatherFrontType[] = ['cold', 'warm', 'storm', 'highPressure'];
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    const regionIds = Array.from(this.regions.keys());
    
    if (regionIds.length === 0) return null;
    
    // Seasonal bias
    const season = GeographicClimateSystem.getSeason(gameDate, 45);
    const typeWeights: Record<WeatherFrontType, number> = { cold: 1, warm: 1, storm: 1, highPressure: 1 };
    
    if (season === 'winter') {
      typeWeights.cold = 3;
      typeWeights.warm = 0.3;
    } else if (season === 'summer') {
      typeWeights.warm = 2;
      typeWeights.storm = 2;
      typeWeights.cold = 0.3;
    }
    
    const type = this.weightedRandomFromObject(typeWeights) as WeatherFrontType;
    
    return this.createWeatherFront({
      type,
      strength: Math.random() < 0.2 ? 2 : 1,
      originRegion: regionIds[Math.floor(Math.random() * regionIds.length)],
      direction: directions[Math.floor(Math.random() * directions.length)],
      speed: 1 + Math.floor(Math.random() * 3)
    });
  }

  private weightedRandomFromObject(weights: Record<string, number>): string {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    
    for (const [key, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) return key;
    }
    
    return Object.keys(weights)[0];
  }

  // ============================================
  // UI HELPERS
  // ============================================

  getWeatherDisplay(regionId: string): WeatherDisplayData | null {
    const weather = this.regionWeather.get(regionId);
    if (!weather) return null;
    
    const region = this.regions.get(regionId);
    const percentRemaining = (weather.remainingTurns / weather.totalTurns) * 100;
    
    return {
      type: weather.type,
      temperature: weather.temperature,
      humidity: weather.humidity,
      intensity: weather.intensity,
      turnsRemaining: weather.remainingTurns,
      percentRemaining,
      description: region ? GeographicClimateSystem.describeWeather(weather) : `${weather.temperature}°`,
      probabilities: weather.rolledProbabilities
    };
  }

  getForecast(regionId: string, gameDate: GameDate): ForecastEntry[] {
    const region = this.regions.get(regionId);
    if (!region) return [];
    
    const probs = this.calculateWeatherProbabilities(regionId, gameDate);
    
    return Object.entries(probs)
      .filter(([_, data]) => data.percent > 0)
      .sort((a, b) => b[1].percent - a[1].percent)
      .slice(0, 4)
      .map(([weather, data]) => ({
        weather: weather as GeographicWeatherType,
        chance: Math.round(data.percent),
        possible: GeographicClimateSystem.isWeatherPossible(region, weather as GeographicWeatherType)
      }));
  }

  getActiveFrontsForRegion(regionId: string): ActiveFrontInfo[] {
    return this.activeFronts
      .filter(f => f.affectedRegions.includes(regionId))
      .map(f => ({
        type: f.type,
        strength: f.strength,
        direction: f.direction,
        description: this.describeFront(f)
      }));
  }

  private describeFront(front: WeatherFront): string {
    const descriptions: Record<WeatherFrontType, string> = {
      cold: `Cold front moving ${front.direction}`,
      warm: `Warm front moving ${front.direction}`,
      storm: `Storm system moving ${front.direction}`,
      highPressure: `High pressure system`
    };
    
    const strength = front.strength >= 2 ? 'Strong ' : '';
    return strength + (descriptions[front.type] || 'Weather system');
  }

  // Get all regions
  getAllRegions(): GeographicRegion[] {
    return Array.from(this.regions.values());
  }

  // Get current weather for a region
  getCurrentWeather(regionId: string): RegionWeatherState | undefined {
    return this.regionWeather.get(regionId);
  }

  // Get all active fronts
  getAllActiveFronts(): WeatherFront[] {
    return [...this.activeFronts];
  }
}

export const TurnBasedWeatherEngine = new TurnBasedWeatherEngineClass();

// ============================================
// WORLD BUILDER HELPER
// ============================================

export function initializeDefaultWorld(): void {
  // Create default regions
  const regions = [
    GeographicClimateSystem.createRegion({
      id: 'amazon',
      name: 'The Great Jungle',
      latitude: -3,
      longitude: -60,
      elevation: 100,
      continentality: 0.6,
      proximityToWater: 0.3,
      terrain: 'rainforest'
    }),
    GeographicClimateSystem.createRegion({
      id: 'northlands',
      name: 'The Frozen North',
      latitude: 65,
      longitude: 25,
      elevation: 200,
      continentality: 0.4,
      proximityToWater: 0.5,
      terrain: 'taiga'
    }),
    GeographicClimateSystem.createRegion({
      id: 'sandlands',
      name: 'The Burning Sands',
      latitude: 25,
      longitude: 30,
      elevation: 400,
      continentality: 0.9,
      proximityToWater: 0.1,
      terrain: 'desert'
    }),
    GeographicClimateSystem.createRegion({
      id: 'heartland',
      name: 'The Heartlands',
      latitude: 48,
      longitude: -2,
      elevation: 150,
      continentality: 0.3,
      proximityToWater: 0.6,
      terrain: 'farmland'
    }),
    GeographicClimateSystem.createRegion({
      id: 'peaks',
      name: 'The High Peaks',
      latitude: 45,
      longitude: 10,
      elevation: 3200,
      continentality: 0.5,
      proximityToWater: 0.2,
      terrain: 'mountain'
    }),
    GeographicClimateSystem.createRegion({
      id: 'suncoast',
      name: 'The Sun Coast',
      latitude: 38,
      longitude: 15,
      elevation: 50,
      continentality: 0.1,
      proximityToWater: 0.95,
      terrain: 'coastal'
    })
  ];

  // Register regions
  regions.forEach(r => TurnBasedWeatherEngine.registerRegion(r));

  // Set region connections
  TurnBasedWeatherEngine.setRegionConnections({
    amazon: { north: 'heartland', south: null, east: 'suncoast', west: 'sandlands' },
    northlands: { north: null, south: 'heartland', east: 'peaks', west: null },
    sandlands: { north: 'heartland', south: null, east: 'amazon', west: null },
    heartland: { north: 'northlands', south: 'amazon', east: 'peaks', west: 'sandlands' },
    peaks: { north: 'northlands', south: 'suncoast', east: null, west: 'heartland' },
    suncoast: { north: 'peaks', south: null, east: null, west: 'heartland' }
  });
}

// ============================================
// MANUAL CLIMATE ZONE HELPER
// ============================================

/**
 * Sets up a region with a specific climate zone for manual override.
 * This allows players to force a specific climate for their current location.
 */
export function setManualClimateZone(
  regionId: string,
  climateZoneId: ClimateZoneId,
  gameDate: GameDate
): RegionWeatherState | null {
  const climate = CLIMATE_ZONES[climateZoneId];
  if (!climate) return null;

  // Create or update region with this climate
  const region = GeographicClimateSystem.createRegionWithClimate(
    regionId,
    `${climate.name} Region`,
    climateZoneId
  );

  if (!region) return null;

  // Register the region
  TurnBasedWeatherEngine.registerRegion(region);

  // Initialize weather for this region
  return TurnBasedWeatherEngine.initializeRegion(regionId, gameDate);
}

/**
 * Gets climate-appropriate weather weights for a given climate zone.
 * Useful for understanding what weather is possible in manual mode.
 */
export function getClimateWeatherWeights(climateZoneId: ClimateZoneId): Record<GeographicWeatherType, number> | null {
  const climate = CLIMATE_ZONES[climateZoneId];
  return climate?.weatherWeights || null;
}
