// ============================================
// GEOGRAPHIC CLIMATE SYSTEM
// Köppen-inspired climate classifications
// ============================================

export type ClimateZoneId = 
  | 'tropical'
  | 'arid'
  | 'mediterranean'
  | 'temperate'
  | 'continental'
  | 'subarctic'
  | 'polar'
  | 'highland'
  | 'oceanic';

export type GeographicWeatherType = 
  | 'clear'
  | 'overcast'
  | 'rain'
  | 'storm'
  | 'fog'
  | 'snow'
  | 'heatWave'
  | 'windy';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export interface ClimateZone {
  id: ClimateZoneId;
  name: string;
  description: string;
  baseTemperature: { min: number; max: number };
  humidity: { min: number; max: number };
  weatherWeights: Record<GeographicWeatherType, number>;
  seasonalVariation: 'minimal' | 'wet_winter' | 'full' | 'extreme' | 'cold_dominant' | 'polar' | 'altitude_dependent' | 'mild' | 'temperature_extreme';
  hasWetSeason?: boolean;
  wetSeasonMonths?: number[];
  elevationEffect?: boolean;
  features: string[];
}

export const CLIMATE_ZONES: Record<ClimateZoneId, ClimateZone> = {
  tropical: {
    id: 'tropical',
    name: 'Tropical',
    description: 'Hot and humid year-round',
    baseTemperature: { min: 20, max: 35 },
    humidity: { min: 70, max: 95 },
    weatherWeights: {
      clear: 20,
      overcast: 25,
      rain: 35,
      storm: 15,
      fog: 5,
      snow: 0,
      heatWave: 10,
      windy: 10
    },
    seasonalVariation: 'minimal',
    hasWetSeason: true,
    wetSeasonMonths: [5, 6, 7, 8, 9, 10],
    features: ['rainforest', 'jungle', 'mangrove']
  },

  arid: {
    id: 'arid',
    name: 'Arid/Desert',
    description: 'Hot days, cold nights, minimal rain',
    baseTemperature: { min: 5, max: 45 },
    humidity: { min: 5, max: 30 },
    weatherWeights: {
      clear: 60,
      overcast: 10,
      rain: 3,
      storm: 2,
      fog: 5,
      snow: 0,
      heatWave: 25,
      windy: 20
    },
    seasonalVariation: 'temperature_extreme',
    features: ['desert', 'dunes', 'mesa', 'canyon']
  },

  mediterranean: {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Hot dry summers, mild wet winters',
    baseTemperature: { min: 8, max: 32 },
    humidity: { min: 30, max: 70 },
    weatherWeights: {
      clear: 45,
      overcast: 20,
      rain: 15,
      storm: 5,
      fog: 10,
      snow: 2,
      heatWave: 15,
      windy: 15
    },
    seasonalVariation: 'wet_winter',
    features: ['coastal', 'vineyard', 'olive_grove', 'scrubland']
  },

  temperate: {
    id: 'temperate',
    name: 'Temperate',
    description: 'Four distinct seasons, moderate rainfall',
    baseTemperature: { min: -5, max: 28 },
    humidity: { min: 40, max: 80 },
    weatherWeights: {
      clear: 30,
      overcast: 25,
      rain: 20,
      storm: 8,
      fog: 12,
      snow: 10,
      heatWave: 5,
      windy: 15
    },
    seasonalVariation: 'full',
    features: ['forest', 'meadow', 'farmland', 'deciduous']
  },

  continental: {
    id: 'continental',
    name: 'Continental',
    description: 'Hot summers, cold winters, variable',
    baseTemperature: { min: -20, max: 35 },
    humidity: { min: 30, max: 75 },
    weatherWeights: {
      clear: 35,
      overcast: 20,
      rain: 15,
      storm: 10,
      fog: 8,
      snow: 20,
      heatWave: 8,
      windy: 15
    },
    seasonalVariation: 'extreme',
    features: ['steppe', 'prairie', 'boreal_edge']
  },

  subarctic: {
    id: 'subarctic',
    name: 'Subarctic/Boreal',
    description: 'Long cold winters, brief cool summers',
    baseTemperature: { min: -40, max: 20 },
    humidity: { min: 50, max: 85 },
    weatherWeights: {
      clear: 25,
      overcast: 30,
      rain: 10,
      storm: 5,
      fog: 15,
      snow: 40,
      heatWave: 0,
      windy: 20
    },
    seasonalVariation: 'cold_dominant',
    features: ['taiga', 'boreal_forest', 'tundra_edge']
  },

  polar: {
    id: 'polar',
    name: 'Polar/Arctic',
    description: 'Extreme cold year-round',
    baseTemperature: { min: -50, max: 5 },
    humidity: { min: 40, max: 70 },
    weatherWeights: {
      clear: 20,
      overcast: 25,
      rain: 2,
      storm: 10,
      fog: 15,
      snow: 50,
      heatWave: 0,
      windy: 30
    },
    seasonalVariation: 'polar',
    features: ['ice_sheet', 'tundra', 'glacier', 'permafrost']
  },

  highland: {
    id: 'highland',
    name: 'Highland/Alpine',
    description: 'Climate varies with elevation',
    baseTemperature: { min: -15, max: 20 },
    humidity: { min: 30, max: 90 },
    weatherWeights: {
      clear: 25,
      overcast: 25,
      rain: 15,
      storm: 12,
      fog: 20,
      snow: 25,
      heatWave: 0,
      windy: 25
    },
    seasonalVariation: 'altitude_dependent',
    elevationEffect: true,
    features: ['mountain', 'alpine_meadow', 'peak', 'valley']
  },

  oceanic: {
    id: 'oceanic',
    name: 'Oceanic',
    description: 'Mild, wet, cloudy year-round',
    baseTemperature: { min: 2, max: 22 },
    humidity: { min: 70, max: 90 },
    weatherWeights: {
      clear: 15,
      overcast: 35,
      rain: 30,
      storm: 8,
      fog: 20,
      snow: 5,
      heatWave: 2,
      windy: 20
    },
    seasonalVariation: 'mild',
    features: ['coastal', 'moor', 'heath', 'temperate_rainforest']
  }
};

// ============================================
// GEOGRAPHIC REGION
// ============================================

export interface RegionModifiers {
  temperatureOffset: number;
  humidityOffset: number;
  weatherAdjustments: Partial<Record<GeographicWeatherType, number>>;
}

export interface GeographicRegion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  continentality: number;
  proximityToWater: number;
  terrain: string;
  climate: ClimateZone;
  modifiers: RegionModifiers;
}

export interface GameDate {
  month: number;
  day: number;
  hour: number;
}

export interface GeneratedWeather {
  type: GeographicWeatherType;
  temperature: number;
  humidity: number;
  region: string;
  climate: ClimateZoneId;
  season: SeasonType;
  duration: number;
  intensity: 1 | 2 | 3;
}

// ============================================
// CLIMATE SYSTEM CLASS
// ============================================

class GeographicClimateSystemClass {
  
  // Determine climate zone from geographic parameters
  determineClimate(params: {
    latitude: number;
    elevation?: number;
    continentality?: number;
    proximityToWater?: number;
    terrain?: string;
  }): ClimateZoneId {
    const {
      latitude,
      elevation = 0,
      continentality = 0.5,
      proximityToWater = 0.5,
      terrain = 'plains'
    } = params;
    
    const absLatitude = Math.abs(latitude);
    
    // Polar regions
    if (absLatitude >= 66) {
      return 'polar';
    }
    
    // High elevation overrides most climate
    if (elevation > 2500) {
      return 'highland';
    }
    
    // Subarctic
    if (absLatitude >= 55) {
      return elevation > 1000 ? 'highland' : 'subarctic';
    }
    
    // Mid latitudes
    if (absLatitude >= 35) {
      if (continentality > 0.7) return 'continental';
      if (proximityToWater > 0.7) return 'oceanic';
      return 'temperate';
    }
    
    // Subtropics
    if (absLatitude >= 23) {
      if (proximityToWater > 0.6 && terrain !== 'desert') {
        return 'mediterranean';
      }
      if (continentality > 0.6) return 'arid';
      return 'temperate';
    }
    
    // Tropics
    if (continentality > 0.8 && proximityToWater < 0.2) {
      return 'arid'; // Tropical desert
    }
    return 'tropical';
  }

  // Create a region with its geographic properties
  createRegion(config: {
    id: string;
    name: string;
    latitude: number;
    longitude?: number;
    elevation?: number;
    continentality?: number;
    proximityToWater?: number;
    terrain?: string;
    customClimate?: ClimateZoneId | null;
  }): GeographicRegion {
    const {
      id,
      name,
      latitude,
      longitude = 0,
      elevation = 0,
      continentality = 0.5,
      proximityToWater = 0.5,
      terrain = 'plains',
      customClimate = null
    } = config;
    
    const climateId = customClimate || this.determineClimate({
      latitude,
      elevation,
      continentality,
      proximityToWater,
      terrain
    });
    
    return {
      id,
      name,
      latitude,
      longitude,
      elevation,
      continentality,
      proximityToWater,
      terrain,
      climate: CLIMATE_ZONES[climateId],
      modifiers: this.calculateModifiers({ elevation, proximityToWater, terrain })
    };
  }
  
  calculateModifiers(params: {
    elevation: number;
    proximityToWater: number;
    terrain: string;
  }): RegionModifiers {
    const { elevation, proximityToWater, terrain } = params;
    
    const modifiers: RegionModifiers = {
      temperatureOffset: 0,
      humidityOffset: 0,
      weatherAdjustments: {}
    };
    
    // Elevation: -6.5°C per 1000m
    modifiers.temperatureOffset -= (elevation / 1000) * 6.5;
    
    // Coastal areas: more moderate temps, more fog
    if (proximityToWater > 0.7) {
      modifiers.weatherAdjustments.fog = 1.5;
      modifiers.humidityOffset += 15;
    }
    
    // Terrain-specific modifiers
    const terrainEffects: Record<string, { humidityOffset?: number; fog?: number; rain?: number; windy?: number; snow?: number }> = {
      forest: { humidityOffset: 10, fog: 1.2 },
      swamp: { humidityOffset: 25, fog: 1.8, rain: 1.3 },
      valley: { fog: 2.0, windy: 0.5 },
      ridge: { windy: 1.8, fog: 0.5 },
      lake_adjacent: { fog: 1.5, humidityOffset: 15 },
      rainforest: { humidityOffset: 20, rain: 1.5 },
      desert: { humidityOffset: -20, rain: 0.3 },
      mountain: { windy: 1.5, snow: 1.5 }
    };
    
    const fx = terrainEffects[terrain];
    if (fx) {
      modifiers.humidityOffset += fx.humidityOffset || 0;
      if (fx.fog) modifiers.weatherAdjustments.fog = fx.fog;
      if (fx.rain) modifiers.weatherAdjustments.rain = fx.rain;
      if (fx.windy) modifiers.weatherAdjustments.windy = fx.windy;
    }
    
    return modifiers;
  }

  // Get season based on date and hemisphere
  getSeason(gameDate: GameDate, latitude: number): SeasonType {
    const month = gameDate.month;
    const southern = latitude < 0;
    
    const seasonMap: Record<'north' | 'south', Record<number, SeasonType>> = {
      north: {
        12: 'winter', 1: 'winter', 2: 'winter',
        3: 'spring', 4: 'spring', 5: 'spring',
        6: 'summer', 7: 'summer', 8: 'summer',
        9: 'autumn', 10: 'autumn', 11: 'autumn'
      },
      south: {
        12: 'summer', 1: 'summer', 2: 'summer',
        3: 'autumn', 4: 'autumn', 5: 'autumn',
        6: 'winter', 7: 'winter', 8: 'winter',
        9: 'spring', 10: 'spring', 11: 'spring'
      }
    };
    
    return southern ? seasonMap.south[month] : seasonMap.north[month];
  }

  // Apply seasonal modifiers to weather weights
  applySeasonalModifiers(
    weights: Record<GeographicWeatherType, number>,
    climate: ClimateZone,
    season: SeasonType,
    month: number
  ): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    
    // Wet season for tropical climates
    if (climate.hasWetSeason && climate.wetSeasonMonths) {
      const inWetSeason = climate.wetSeasonMonths.includes(month);
      if (inWetSeason) {
        modified.rain *= 2;
        modified.storm *= 1.5;
        modified.clear *= 0.5;
      } else {
        modified.rain *= 0.4;
        modified.clear *= 1.5;
      }
    }
    
    // Standard seasonal effects
    const seasonalMultipliers: Record<SeasonType, Partial<Record<GeographicWeatherType, number>>> = {
      winter: {
        snow: 3.0,
        rain: 0.7,
        heatWave: 0,
        clear: 0.6,
        fog: 1.3
      },
      spring: {
        rain: 1.4,
        storm: 1.2,
        snow: 0.3,
        clear: 1.1
      },
      summer: {
        heatWave: 2.5,
        storm: 1.3,
        snow: 0,
        clear: 1.4,
        fog: 0.6
      },
      autumn: {
        fog: 1.8,
        rain: 1.2,
        overcast: 1.4,
        clear: 0.8
      }
    };
    
    const multipliers = seasonalMultipliers[season];
    Object.entries(multipliers).forEach(([weather, mult]) => {
      const w = weather as GeographicWeatherType;
      modified[w] = (modified[w] || 0) * (mult || 1);
    });
    
    return modified;
  }

  // Apply regional modifiers
  applyRegionalModifiers(
    weights: Record<GeographicWeatherType, number>,
    modifiers: RegionModifiers
  ): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    
    Object.entries(modifiers.weatherAdjustments).forEach(([weather, mult]) => {
      const w = weather as GeographicWeatherType;
      if (typeof mult === 'number' && modified[w] !== undefined) {
        modified[w] *= mult;
      }
    });
    
    return modified;
  }

  // Apply elevation effects
  applyElevationEffects(
    weights: Record<GeographicWeatherType, number>,
    elevation: number,
    _season: SeasonType
  ): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    
    if (elevation > 1500) {
      modified.snow *= 1.5;
      modified.heatWave *= 0.3;
      modified.windy *= 1.3;
    }
    
    if (elevation > 3000) {
      modified.snow *= 2;
      modified.heatWave = 0;
      modified.rain *= 0.6;
    }
    
    return modified;
  }

  // Generate weather for a region
  generateWeather(region: GeographicRegion, gameDate: GameDate): GeneratedWeather {
    const climate = region.climate;
    const season = this.getSeason(gameDate, region.latitude);
    const month = gameDate.month;
    
    // Get seasonal weather weights
    let weights = { ...climate.weatherWeights };
    weights = this.applySeasonalModifiers(weights, climate, season, month);
    weights = this.applyRegionalModifiers(weights, region.modifiers);
    
    if (region.elevation > 0) {
      weights = this.applyElevationEffects(weights, region.elevation, season);
    }
    
    // Roll for weather
    const weather = this.weightedRandom(weights);
    const temperature = this.calculateTemperature(region, season, weather);
    const humidity = this.calculateHumidity(region, weather);
    
    return {
      type: weather,
      temperature,
      humidity,
      region: region.id,
      climate: climate.id,
      season,
      duration: this.rollDuration(weather, climate),
      intensity: this.rollIntensity()
    };
  }

  calculateTemperature(region: GeographicRegion, season: SeasonType, weather: GeographicWeatherType): number {
    const base = region.climate.baseTemperature;
    
    const seasonTemp: Record<SeasonType, number> = {
      winter: base.min + (base.max - base.min) * 0.1,
      spring: base.min + (base.max - base.min) * 0.4,
      summer: base.min + (base.max - base.min) * 0.9,
      autumn: base.min + (base.max - base.min) * 0.5
    };
    
    let temp = seasonTemp[season];
    
    const weatherTempMod: Record<GeographicWeatherType, number> = {
      clear: 3,
      heatWave: 10,
      overcast: -2,
      rain: -4,
      storm: -5,
      snow: -8,
      fog: -1,
      windy: -2
    };
    
    temp += weatherTempMod[weather] || 0;
    temp += region.modifiers.temperatureOffset;
    temp += (Math.random() - 0.5) * 6;
    
    return Math.round(temp);
  }

  calculateHumidity(region: GeographicRegion, weather: GeographicWeatherType): number {
    const climate = region.climate;
    let humidity = (climate.humidity.min + climate.humidity.max) / 2;
    
    const weatherHumidityMod: Record<GeographicWeatherType, number> = {
      clear: -15,
      heatWave: -20,
      overcast: 10,
      rain: 30,
      storm: 35,
      snow: 15,
      fog: 40,
      windy: -5
    };
    
    humidity += weatherHumidityMod[weather] || 0;
    humidity += region.modifiers.humidityOffset;
    humidity += (Math.random() - 0.5) * 10;
    
    return Math.round(Math.max(0, Math.min(100, humidity)));
  }

  rollDuration(weather: GeographicWeatherType, _climate: ClimateZone): number {
    const baseDurations: Record<GeographicWeatherType, { min: number; max: number }> = {
      clear: { min: 12, max: 72 },
      overcast: { min: 6, max: 48 },
      rain: { min: 2, max: 24 },
      storm: { min: 1, max: 6 },
      fog: { min: 2, max: 12 },
      snow: { min: 4, max: 36 },
      heatWave: { min: 24, max: 96 },
      windy: { min: 4, max: 24 }
    };
    
    const range = baseDurations[weather];
    return Math.floor(Math.random() * (range.max - range.min) + range.min);
  }

  rollIntensity(): 1 | 2 | 3 {
    const roll = Math.random();
    if (roll < 0.5) return 1;
    if (roll < 0.85) return 2;
    return 3;
  }

  weightedRandom(weights: Record<GeographicWeatherType, number>): GeographicWeatherType {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    
    for (const [weather, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) return weather as GeographicWeatherType;
    }
    
    return 'clear';
  }

  // Check if weather is possible in a region
  isWeatherPossible(region: GeographicRegion, weatherType: GeographicWeatherType): boolean {
    const weight = region.climate.weatherWeights[weatherType];
    return weight > 0;
  }

  // Get weather description
  describeWeather(weather: GeneratedWeather): string {
    const intensityWords: Record<1 | 2 | 3, string[]> = {
      1: ['light', 'gentle', 'mild'],
      2: ['moderate', 'steady', ''],
      3: ['heavy', 'intense', 'severe']
    };
    
    const intensity = intensityWords[weather.intensity];
    const word = intensity[Math.floor(Math.random() * intensity.length)];
    
    const descriptions: Record<GeographicWeatherType, string> = {
      clear: `${weather.temperature}°, clear skies`,
      overcast: `${weather.temperature}°, cloudy`,
      rain: `${weather.temperature}°, ${word} rain`.trim(),
      storm: `${weather.temperature}°, ${word} thunderstorm`.trim(),
      fog: `${weather.temperature}°, ${word} fog`.trim(),
      snow: `${weather.temperature}°, ${word} snow`.trim(),
      heatWave: `${weather.temperature}°, oppressive heat`,
      windy: `${weather.temperature}°, ${word} winds`.trim()
    };
    
    return descriptions[weather.type];
  }

  // Get a climate zone by ID for manual override
  getClimateZone(zoneId: ClimateZoneId): ClimateZone | null {
    return CLIMATE_ZONES[zoneId] || null;
  }

  // Create a region with a specific climate zone (for manual override)
  createRegionWithClimate(
    regionId: string,
    regionName: string,
    climateZoneId: ClimateZoneId
  ): GeographicRegion | null {
    const climate = CLIMATE_ZONES[climateZoneId];
    if (!climate) return null;

    return {
      id: regionId,
      name: regionName,
      latitude: this.getDefaultLatitudeForClimate(climateZoneId),
      longitude: 0,
      elevation: 0,
      continentality: 0.5,
      proximityToWater: 0.5,
      terrain: climate.features[0] || 'plains',
      climate,
      modifiers: {
        temperatureOffset: 0,
        humidityOffset: 0,
        weatherAdjustments: {}
      }
    };
  }

  // Helper to get reasonable latitude for a climate zone
  private getDefaultLatitudeForClimate(zoneId: ClimateZoneId): number {
    const latitudes: Record<ClimateZoneId, number> = {
      tropical: 5,
      arid: 25,
      mediterranean: 38,
      temperate: 45,
      continental: 50,
      subarctic: 60,
      polar: 75,
      highland: 40,
      oceanic: 50
    };
    return latitudes[zoneId] || 45;
  }

  // Get all climate zone IDs for iteration
  getAllClimateZoneIds(): ClimateZoneId[] {
    return Object.keys(CLIMATE_ZONES) as ClimateZoneId[];
  }
}

export const GeographicClimateSystem = new GeographicClimateSystemClass();
