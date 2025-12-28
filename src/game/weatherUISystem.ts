// ============================================
// WEATHER UI DATA SYSTEM
// Provides full breakdown of weather probabilities for UI display
// ============================================

import {
  GeographicClimateSystem,
  GeographicRegion,
  GeographicWeatherType,
  ClimateZoneId,
  ClimateZone,
  SeasonType,
  GameDate,
  CLIMATE_ZONES
} from './geographicClimateSystem';

import {
  TurnBasedWeatherEngine,
  WeatherFront,
  RegionWeatherState,
  ActiveFrontInfo
} from './turnBasedWeatherEngine';

// ============================================
// TYPES
// ============================================

export interface WeatherProbabilityItem {
  weather: GeographicWeatherType;
  percent: number;
  icon: string;
  description: string;
}

export interface ProbabilityLayer {
  name: string;
  description: string;
  icon: string;
  probabilities: Record<GeographicWeatherType, number>;
  modifiers?: Array<{ weather: string; change: string; direction: 'up' | 'down' }>;
  factors?: Array<{ name: string; value: string; effect: string }>;
  effects?: Array<{ weather: string; change: string; direction: 'up' | 'down' }>;
  fronts?: Array<{
    type: string;
    strength: number;
    direction: string;
    description: string;
    effects: Array<{ weather: string; change: string; direction: 'up' | 'down' }>;
  }>;
  likelyNext?: Array<{ to: string; likelihood: string; reason: string }>;
}

export interface ImpossibleWeather {
  weather: GeographicWeatherType;
  icon: string;
  reason: string;
}

export interface ActiveModifier {
  type: string;
  name: string;
  icon: string;
  impact: string;
}

export interface CurrentConditions {
  weather: GeographicWeatherType;
  temperature: number;
  humidity: number;
  intensity: number;
  turnsRemaining: number;
  season: SeasonType;
}

export interface RegionInfo {
  id: string;
  name: string;
  climate: string;
  terrain: string;
  elevation: number;
  latitude: number;
  proximityToWater: number;
}

export interface WeatherBreakdown {
  region: RegionInfo;
  currentConditions: CurrentConditions;
  probabilityLayers: Record<string, ProbabilityLayer>;
  finalProbabilities: WeatherProbabilityItem[];
  activeModifiers: ActiveModifier[];
  impossibleWeather: ImpossibleWeather[];
}

// ============================================
// WEATHER UI SYSTEM
// ============================================

class WeatherUISystemClass {
  
  // Get complete breakdown of weather chances for UI
  getFullWeatherBreakdown(
    regionId: string,
    gameDate: GameDate,
    hour: number = 12
  ): WeatherBreakdown | null {
    const region = TurnBasedWeatherEngine.getRegion(regionId);
    const currentWeather = TurnBasedWeatherEngine.getRegionWeather(regionId);
    
    if (!region) {
      return null;
    }
    
    const climate = region.climate;
    const season = GeographicClimateSystem.getSeason(gameDate, region.latitude);
    
    // Build region info
    const regionInfo: RegionInfo = {
      id: regionId,
      name: region.name,
      climate: climate.name,
      terrain: region.terrain,
      elevation: region.elevation,
      latitude: region.latitude,
      proximityToWater: region.proximityToWater
    };
    
    // Build current conditions
    const currentConditions: CurrentConditions = {
      weather: currentWeather?.type || 'clear',
      temperature: currentWeather?.temperature || 20,
      humidity: currentWeather?.humidity || 50,
      intensity: currentWeather?.intensity || 1,
      turnsRemaining: currentWeather?.remainingTurns || 0,
      season
    };
    
    // Calculate probability layers
    const probabilityLayers = this.calculateAllLayers(region, gameDate, hour, currentWeather);
    
    // Calculate final probabilities
    const finalProbabilities = this.calculateFinalProbabilities(probabilityLayers);
    
    // Get impossible weather
    const impossibleWeather = this.getImpossibleWeather(region);
    
    // Get active modifiers
    const activeModifiers = this.getActiveModifiers(region, gameDate, hour, currentWeather);
    
    return {
      region: regionInfo,
      currentConditions,
      probabilityLayers,
      finalProbabilities,
      activeModifiers,
      impossibleWeather
    };
  }

  // Calculate all probability layers
  calculateAllLayers(
    region: GeographicRegion,
    gameDate: GameDate,
    hour: number,
    currentWeather: RegionWeatherState | null
  ): Record<string, ProbabilityLayer> {
    const climate = region.climate;
    const season = GeographicClimateSystem.getSeason(gameDate, region.latitude);
    const layers: Record<string, ProbabilityLayer> = {};

    // ========== LAYER 1: Base Climate ==========
    layers.baseClimate = {
      name: `${climate.name} Climate`,
      description: climate.description,
      icon: this.getClimateIcon(climate.id),
      probabilities: this.normalizeToPercent({ ...climate.weatherWeights })
    };

    // ========== LAYER 2: Season ==========
    let seasonalWeights = { ...climate.weatherWeights };
    seasonalWeights = GeographicClimateSystem.applySeasonalModifiers(
      seasonalWeights, climate, season, gameDate.month
    );
    
    layers.seasonal = {
      name: `${this.capitalize(season)} Season`,
      description: this.getSeasonDescription(season, climate),
      icon: this.getSeasonIcon(season),
      probabilities: this.normalizeToPercent(seasonalWeights),
      effects: this.getSeasonalModifierList(season)
    };

    // ========== LAYER 3: Geographic ==========
    let geoWeights = { ...seasonalWeights };
    geoWeights = GeographicClimateSystem.applyRegionalModifiers(geoWeights, region.modifiers);
    
    layers.geographic = {
      name: 'Geographic Factors',
      description: this.getGeographicDescription(region),
      icon: this.getTerrainIcon(region.terrain),
      probabilities: this.normalizeToPercent(geoWeights),
      factors: this.getGeographicFactors(region)
    };

    // ========== LAYER 4: Elevation ==========
    let elevationWeights = { ...geoWeights };
    if (region.elevation > 0) {
      elevationWeights = GeographicClimateSystem.applyElevationEffects(
        elevationWeights, region.elevation, season
      );
    }
    
    layers.elevation = {
      name: `Elevation: ${region.elevation}m`,
      description: this.getElevationDescription(region.elevation),
      icon: '⛰️',
      probabilities: this.normalizeToPercent(elevationWeights),
      effects: this.getElevationEffects(region.elevation)
    };

    // ========== LAYER 5: Time of Day ==========
    let timeWeights = { ...elevationWeights };
    timeWeights = this.applyTimeOfDay(timeWeights, hour);
    
    layers.timeOfDay = {
      name: this.getTimeOfDayName(hour),
      description: this.getTimeOfDayDescription(hour),
      icon: this.getTimeIcon(hour),
      probabilities: this.normalizeToPercent(timeWeights),
      effects: this.getTimeOfDayEffects(hour)
    };

    // ========== LAYER 6: Current Weather Transition ==========
    let transitionWeights = { ...timeWeights };
    if (currentWeather) {
      transitionWeights = this.applyTransitionMatrix(transitionWeights, currentWeather.type);
    }
    
    layers.transition = {
      name: `Transition from ${currentWeather?.type || 'none'}`,
      description: 'Weather patterns tend to follow certain progressions',
      icon: '🔄',
      probabilities: this.normalizeToPercent(transitionWeights),
      likelyNext: this.getLikelyTransitions(currentWeather?.type)
    };

    // ========== LAYER 7: Weather Fronts ==========
    const activeFronts = TurnBasedWeatherEngine.getFullFrontsForRegion(region.id);
    let frontWeights = { ...transitionWeights };
    
    activeFronts.forEach(front => {
      frontWeights = this.applyFrontInfluence(frontWeights, front);
    });
    
    layers.weatherFronts = {
      name: 'Weather Systems',
      description: activeFronts.length > 0
        ? `${activeFronts.length} active system(s) affecting this region`
        : 'No active weather systems',
      icon: '🌀',
      probabilities: this.normalizeToPercent(frontWeights),
      fronts: activeFronts.map(f => ({
        type: f.type,
        strength: f.strength,
        direction: f.direction,
        description: this.getFrontDescription(f),
        effects: this.getFrontEffects(f)
      }))
    };

    return layers;
  }

  // Calculate final probabilities from layers
  calculateFinalProbabilities(layers: Record<string, ProbabilityLayer>): WeatherProbabilityItem[] {
    const layerKeys = Object.keys(layers);
    const finalLayer = layers[layerKeys[layerKeys.length - 1]];
    
    const sorted = Object.entries(finalLayer.probabilities)
      .sort((a, b) => b[1] - a[1])
      .map(([weather, percent]) => ({
        weather: weather as GeographicWeatherType,
        percent: Math.round(percent * 10) / 10,
        icon: this.getWeatherIcon(weather as GeographicWeatherType),
        description: this.getWeatherDescription(weather as GeographicWeatherType)
      }));
    
    return sorted;
  }

  // Get impossible weather for a region
  getImpossibleWeather(region: GeographicRegion): ImpossibleWeather[] {
    const impossible: ImpossibleWeather[] = [];
    const climate = region.climate;
    
    Object.entries(climate.weatherWeights).forEach(([weather, weight]) => {
      if (weight === 0) {
        impossible.push({
          weather: weather as GeographicWeatherType,
          icon: this.getWeatherIcon(weather as GeographicWeatherType),
          reason: this.getImpossibilityReason(weather as GeographicWeatherType, region)
        });
      }
    });
    
    return impossible;
  }

  // Get active modifiers affecting weather
  getActiveModifiers(
    region: GeographicRegion,
    gameDate: GameDate,
    hour: number,
    currentWeather: RegionWeatherState | null
  ): ActiveModifier[] {
    const modifiers: ActiveModifier[] = [];
    const climate = region.climate;
    const season = GeographicClimateSystem.getSeason(gameDate, region.latitude);
    
    // Climate modifier
    modifiers.push({
      type: 'climate',
      name: climate.name,
      icon: this.getClimateIcon(climate.id),
      impact: 'Base weather patterns'
    });
    
    // Season modifier
    modifiers.push({
      type: 'season',
      name: this.capitalize(season),
      icon: this.getSeasonIcon(season),
      impact: this.getSeasonImpactSummary(season)
    });
    
    // Latitude modifier
    modifiers.push({
      type: 'latitude',
      name: `Latitude ${Math.abs(region.latitude)}°${region.latitude >= 0 ? 'N' : 'S'}`,
      icon: '🌍',
      impact: this.getLatitudeImpact(region.latitude)
    });
    
    // Elevation modifier
    if (region.elevation > 500) {
      modifiers.push({
        type: 'elevation',
        name: `${region.elevation}m elevation`,
        icon: '⛰️',
        impact: this.getElevationImpactSummary(region.elevation)
      });
    }
    
    // Coastal modifier
    if (region.proximityToWater > 0.5) {
      modifiers.push({
        type: 'coastal',
        name: 'Coastal Region',
        icon: '🌊',
        impact: '+Fog, +Humidity, Moderate temps'
      });
    }
    
    // Continental modifier
    if (region.continentality > 0.5) {
      modifiers.push({
        type: 'continental',
        name: 'Continental Interior',
        icon: '🏜️',
        impact: 'Extreme temperature swings'
      });
    }
    
    // Terrain modifier
    const terrainMod = this.getTerrainModifier(region.terrain);
    if (terrainMod) {
      modifiers.push({
        type: 'terrain',
        name: this.capitalize(region.terrain.replace('_', ' ')),
        icon: this.getTerrainIcon(region.terrain),
        impact: terrainMod
      });
    }
    
    // Time of day modifier
    const timeMod = this.getTimeModifier(hour);
    if (timeMod) {
      modifiers.push({
        type: 'timeOfDay',
        name: this.getTimeOfDayName(hour),
        icon: this.getTimeIcon(hour),
        impact: timeMod
      });
    }
    
    // Current weather influence
    if (currentWeather) {
      modifiers.push({
        type: 'currentWeather',
        name: `Current: ${currentWeather.type}`,
        icon: this.getWeatherIcon(currentWeather.type),
        impact: this.getTransitionImpact(currentWeather.type)
      });
    }
    
    // Weather fronts
    const activeFronts = TurnBasedWeatherEngine.getFullFrontsForRegion(region.id);
    activeFronts.forEach(front => {
      modifiers.push({
        type: 'front',
        name: this.getFrontLabel(front.type),
        icon: this.getFrontIcon(front.type),
        impact: this.getFrontImpactSummary(front)
      });
    });
    
    return modifiers;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  normalizeToPercent(weights: Record<GeographicWeatherType, number>): Record<GeographicWeatherType, number> {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};
    
    Object.entries(weights).forEach(([key, value]) => {
      normalized[key] = total > 0 ? (value / total) * 100 : 0;
    });
    
    return normalized as Record<GeographicWeatherType, number>;
  }

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ============================================
  // ICONS
  // ============================================

  getWeatherIcon(weather: GeographicWeatherType): string {
    const icons: Record<GeographicWeatherType, string> = {
      clear: '☀️',
      overcast: '☁️',
      rain: '🌧️',
      storm: '⛈️',
      fog: '🌫️',
      snow: '❄️',
      heatWave: '🔥',
      windy: '💨'
    };
    return icons[weather] || '🌡️';
  }

  getClimateIcon(climateId: ClimateZoneId): string {
    const icons: Record<ClimateZoneId, string> = {
      tropical: '🌴',
      arid: '🏜️',
      mediterranean: '🍇',
      temperate: '🌳',
      continental: '🌾',
      subarctic: '🌲',
      polar: '🧊',
      highland: '🏔️',
      oceanic: '🌊'
    };
    return icons[climateId] || '🌍';
  }

  getSeasonIcon(season: SeasonType): string {
    const icons: Record<SeasonType, string> = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️'
    };
    return icons[season] || '📅';
  }

  getTerrainIcon(terrain: string): string {
    const icons: Record<string, string> = {
      rainforest: '🌴',
      jungle: '🌿',
      desert: '🏜️',
      dunes: '🐪',
      forest: '🌳',
      meadow: '🌻',
      farmland: '🌾',
      mountain: '⛰️',
      coastal: '🏖️',
      swamp: '🐊',
      tundra: '🦌',
      taiga: '🌲',
      steppe: '🌾',
      valley: '🏞️',
      ridge: '🗻'
    };
    return icons[terrain] || '🗺️';
  }

  getTimeIcon(hour: number): string {
    if (hour >= 5 && hour < 8) return '🌅';
    if (hour >= 8 && hour < 12) return '🌤️';
    if (hour >= 12 && hour < 17) return '☀️';
    if (hour >= 17 && hour < 20) return '🌇';
    if (hour >= 20 && hour < 22) return '🌆';
    return '🌙';
  }

  getFrontIcon(frontType: string): string {
    const icons: Record<string, string> = {
      cold: '❄️',
      warm: '🌡️',
      storm: '⛈️',
      highPressure: '☀️'
    };
    return icons[frontType] || '🌀';
  }

  // ============================================
  // DESCRIPTIONS
  // ============================================

  getWeatherDescription(weather: GeographicWeatherType): string {
    const descriptions: Record<GeographicWeatherType, string> = {
      clear: 'Clear skies with good visibility',
      overcast: 'Cloudy with no precipitation',
      rain: 'Rainfall of varying intensity',
      storm: 'Thunderstorms with lightning',
      fog: 'Reduced visibility, damp conditions',
      snow: 'Snowfall and freezing temperatures',
      heatWave: 'Extreme heat, dangerous conditions',
      windy: 'Strong winds affecting travel'
    };
    return descriptions[weather] || 'Unknown conditions';
  }

  getSeasonDescription(season: SeasonType, climate: ClimateZone): string {
    if (climate.hasWetSeason) {
      return season === 'summer' || season === 'autumn' 
        ? 'Wet season - frequent heavy rains'
        : 'Dry season - reduced rainfall';
    }
    
    const descriptions: Record<SeasonType, string> = {
      spring: 'Warming temperatures, increasing rainfall, unstable weather',
      summer: 'Warmest period, afternoon storms possible, longer days',
      autumn: 'Cooling temperatures, morning fog common, harvest time',
      winter: 'Coldest period, snow possible, shorter days'
    };
    return descriptions[season];
  }

  getGeographicDescription(region: GeographicRegion): string {
    const parts: string[] = [];
    
    if (region.proximityToWater > 0.7) parts.push('Coastal');
    if (region.continentality > 0.7) parts.push('Continental interior');
    if (region.elevation > 1500) parts.push('High altitude');
    
    parts.push(this.capitalize(region.terrain.replace('_', ' ')));
    
    return parts.join(', ');
  }

  getElevationDescription(elevation: number): string {
    if (elevation < 500) return 'Low elevation - minimal altitude effects';
    if (elevation < 1500) return 'Moderate elevation - slightly cooler temperatures';
    if (elevation < 2500) return 'High elevation - noticeably cooler, more snow';
    if (elevation < 3500) return 'Mountain elevation - cold, frequent snow';
    return 'Extreme elevation - harsh alpine conditions';
  }

  getTimeOfDayName(hour: number): string {
    if (hour >= 5 && hour < 8) return 'Dawn';
    if (hour >= 8 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 14) return 'Midday';
    if (hour >= 14 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 20) return 'Evening';
    if (hour >= 20 && hour < 22) return 'Dusk';
    return 'Night';
  }

  getTimeOfDayDescription(hour: number): string {
    if (hour >= 5 && hour < 9) return 'Morning fog more likely, temperatures rising';
    if (hour >= 14 && hour < 19) return 'Peak heating, afternoon storms possible';
    if (hour >= 21 || hour < 5) return 'Cooling temperatures, fog may develop';
    return 'Standard conditions for this time';
  }

  getImpossibilityReason(weather: GeographicWeatherType, region: GeographicRegion): string {
    const climateId = region.climate.id;
    
    const reasons: Record<GeographicWeatherType, Record<string, string>> = {
      snow: {
        tropical: 'Too warm - tropical climate never reaches freezing',
        arid: 'Desert climate - insufficient moisture and too warm',
        mediterranean: 'Mild winters rarely cold enough for snow'
      },
      heatWave: {
        polar: 'Permanently cold - heat waves impossible',
        subarctic: 'Too cold for extreme heat events',
        highland: 'High altitude prevents extreme heat'
      },
      clear: {},
      overcast: {},
      rain: {
        polar: 'Too cold - precipitation falls as snow'
      },
      storm: {},
      fog: {},
      windy: {}
    };
    
    return reasons[weather]?.[climateId] || `Not possible in ${region.climate.name} climate`;
  }

  // ============================================
  // EFFECTS AND MODIFIERS
  // ============================================

  getSeasonalModifierList(season: SeasonType): Array<{ weather: string; change: string; direction: 'up' | 'down' }> {
    const effects: Record<SeasonType, Array<{ weather: string; change: string; direction: 'up' | 'down' }>> = {
      winter: [
        { weather: 'snow', change: '+200%', direction: 'up' },
        { weather: 'heatWave', change: '-100%', direction: 'down' },
        { weather: 'clear', change: '-40%', direction: 'down' },
        { weather: 'fog', change: '+30%', direction: 'up' }
      ],
      spring: [
        { weather: 'rain', change: '+40%', direction: 'up' },
        { weather: 'storm', change: '+20%', direction: 'up' },
        { weather: 'snow', change: '-70%', direction: 'down' }
      ],
      summer: [
        { weather: 'heatWave', change: '+150%', direction: 'up' },
        { weather: 'storm', change: '+30%', direction: 'up' },
        { weather: 'snow', change: '-100%', direction: 'down' },
        { weather: 'clear', change: '+40%', direction: 'up' }
      ],
      autumn: [
        { weather: 'fog', change: '+80%', direction: 'up' },
        { weather: 'rain', change: '+20%', direction: 'up' },
        { weather: 'overcast', change: '+40%', direction: 'up' },
        { weather: 'clear', change: '-20%', direction: 'down' }
      ]
    };
    return effects[season] || [];
  }

  getGeographicFactors(region: GeographicRegion): Array<{ name: string; value: string; effect: string }> {
    const factors: Array<{ name: string; value: string; effect: string }> = [];
    
    if (region.elevation > 0) {
      factors.push({
        name: 'Altitude',
        value: `${region.elevation}m`,
        effect: `${(-6.5 * region.elevation / 1000).toFixed(1)}°C temperature offset`
      });
    }
    
    if (region.proximityToWater > 0.5) {
      factors.push({
        name: 'Coastal Proximity',
        value: `${Math.round(region.proximityToWater * 100)}%`,
        effect: '+Fog chance, +Humidity, Moderate temperatures'
      });
    }
    
    if (region.continentality > 0.5) {
      factors.push({
        name: 'Continentality',
        value: `${Math.round(region.continentality * 100)}%`,
        effect: 'Greater temperature extremes'
      });
    }
    
    return factors;
  }

  getElevationEffects(elevation: number): Array<{ weather: string; change: string; direction: 'up' | 'down' }> {
    const effects: Array<{ weather: string; change: string; direction: 'up' | 'down' }> = [];
    
    if (elevation > 1500) {
      effects.push({ weather: 'snow', change: '+50%', direction: 'up' });
      effects.push({ weather: 'heatWave', change: '-70%', direction: 'down' });
      effects.push({ weather: 'windy', change: '+30%', direction: 'up' });
    }
    
    if (elevation > 3000) {
      effects.push({ weather: 'snow', change: '+100%', direction: 'up' });
      effects.push({ weather: 'heatWave', change: '-100%', direction: 'down' });
      effects.push({ weather: 'rain', change: '-40%', direction: 'down' });
    }
    
    return effects;
  }

  getTimeOfDayEffects(hour: number): Array<{ weather: string; change: string; direction: 'up' | 'down' }> {
    const effects: Array<{ weather: string; change: string; direction: 'up' | 'down' }> = [];
    
    if (hour >= 5 && hour <= 9) {
      effects.push({ weather: 'fog', change: '+100%', direction: 'up' });
    } else {
      effects.push({ weather: 'fog', change: '-40%', direction: 'down' });
    }
    
    if (hour >= 14 && hour <= 19) {
      effects.push({ weather: 'storm', change: '+50%', direction: 'up' });
      effects.push({ weather: 'heatWave', change: '+30%', direction: 'up' });
    }
    
    if (hour >= 21 || hour <= 5) {
      effects.push({ weather: 'heatWave', change: '-60%', direction: 'down' });
      effects.push({ weather: 'fog', change: '+30%', direction: 'up' });
    }
    
    return effects;
  }

  getLikelyTransitions(currentWeather: GeographicWeatherType | undefined): Array<{ to: string; likelihood: string; reason: string }> {
    if (!currentWeather) return [];
    
    const transitions: Record<GeographicWeatherType, Array<{ to: string; likelihood: string; reason: string }>> = {
      clear: [
        { to: 'clear', likelihood: 'Very Likely', reason: 'Clear weather tends to persist' },
        { to: 'overcast', likelihood: 'Likely', reason: 'Clouds often build gradually' },
        { to: 'heatWave', likelihood: 'Possible', reason: 'Can intensify to heat wave' }
      ],
      overcast: [
        { to: 'rain', likelihood: 'Very Likely', reason: 'Clouds often bring rain' },
        { to: 'overcast', likelihood: 'Likely', reason: 'Can persist for days' },
        { to: 'clear', likelihood: 'Possible', reason: 'May clear up' }
      ],
      rain: [
        { to: 'overcast', likelihood: 'Very Likely', reason: 'Rain usually tapers to clouds' },
        { to: 'storm', likelihood: 'Likely', reason: 'Can intensify to storms' },
        { to: 'fog', likelihood: 'Possible', reason: 'Fog often follows rain' }
      ],
      storm: [
        { to: 'rain', likelihood: 'Very Likely', reason: 'Storms weaken to rain' },
        { to: 'clear', likelihood: 'Possible', reason: 'Storms can break suddenly' },
        { to: 'windy', likelihood: 'Likely', reason: 'Wind often remains after' }
      ],
      fog: [
        { to: 'clear', likelihood: 'Very Likely', reason: 'Fog burns off in sun' },
        { to: 'overcast', likelihood: 'Likely', reason: 'May lift to clouds' }
      ],
      snow: [
        { to: 'snow', likelihood: 'Very Likely', reason: 'Snow tends to persist' },
        { to: 'overcast', likelihood: 'Likely', reason: 'May stop but stay cloudy' },
        { to: 'clear', likelihood: 'Possible', reason: 'Can clear after snowfall' }
      ],
      heatWave: [
        { to: 'heatWave', likelihood: 'Likely', reason: 'Heat waves persist' },
        { to: 'storm', likelihood: 'Possible', reason: 'Heat can trigger storms' }
      ],
      windy: [
        { to: 'clear', likelihood: 'Likely', reason: 'Wind clears conditions' },
        { to: 'storm', likelihood: 'Possible', reason: 'Can bring in storms' }
      ]
    };
    
    return transitions[currentWeather] || [];
  }

  getFrontDescription(front: WeatherFront): string {
    const descriptions: Record<string, string> = {
      cold: `Cold front moving ${front.direction}`,
      warm: `Warm front moving ${front.direction}`,
      storm: `Storm system moving ${front.direction}`,
      highPressure: 'High pressure system'
    };
    
    const strength = front.strength >= 2 ? 'Strong ' : '';
    return strength + (descriptions[front.type] || 'Weather system');
  }

  getFrontEffects(front: WeatherFront): Array<{ weather: string; change: string; direction: 'up' | 'down' }> {
    const effects: Record<string, Array<{ weather: string; change: string; direction: 'up' | 'down' }>> = {
      cold: [
        { weather: 'snow', change: '+150%', direction: 'up' },
        { weather: 'rain', change: '+30%', direction: 'up' },
        { weather: 'clear', change: '-60%', direction: 'down' },
        { weather: 'heatWave', change: '-100%', direction: 'down' }
      ],
      warm: [
        { weather: 'clear', change: '+50%', direction: 'up' },
        { weather: 'heatWave', change: '+100%', direction: 'up' },
        { weather: 'snow', change: '-90%', direction: 'down' }
      ],
      storm: [
        { weather: 'storm', change: '+200%', direction: 'up' },
        { weather: 'rain', change: '+100%', direction: 'up' },
        { weather: 'clear', change: '-80%', direction: 'down' },
        { weather: 'windy', change: '+100%', direction: 'up' }
      ],
      highPressure: [
        { weather: 'clear', change: '+150%', direction: 'up' },
        { weather: 'rain', change: '-80%', direction: 'down' },
        { weather: 'storm', change: '-90%', direction: 'down' },
        { weather: 'fog', change: '+50%', direction: 'up' }
      ]
    };
    
    return effects[front.type] || [];
  }

  // ============================================
  // IMPACT SUMMARIES
  // ============================================

  getSeasonImpactSummary(season: SeasonType): string {
    const summaries: Record<SeasonType, string> = {
      spring: '+Rain, +Storms, -Snow',
      summer: '+Heat, +Storms, +Clear, -Snow',
      autumn: '+Fog, +Overcast, +Rain',
      winter: '+Snow, +Fog, -Heat, -Clear'
    };
    return summaries[season];
  }

  getLatitudeImpact(latitude: number): string {
    const abs = Math.abs(latitude);
    if (abs < 23) return 'Tropical zone - no winter';
    if (abs < 35) return 'Subtropical - mild winters';
    if (abs < 55) return 'Temperate - four seasons';
    if (abs < 66) return 'Subarctic - long winters';
    return 'Polar - extreme cold';
  }

  getElevationImpactSummary(elevation: number): string {
    if (elevation < 1500) return 'Minimal altitude effect';
    if (elevation < 2500) return '+Snow, -Heat, cooler temps';
    return '+Snow ++, no heat waves, cold year-round';
  }

  getTerrainModifier(terrain: string): string | null {
    const mods: Record<string, string> = {
      forest: '+Humidity, +Fog',
      swamp: '++Humidity, ++Fog, +Rain',
      valley: '++Fog, -Wind',
      ridge: '++Wind, -Fog',
      coastal: '+Fog, +Humidity, moderate temps',
      desert: '-Rain, -Humidity, +Heat',
      mountain: '+Snow, +Wind, -Heat'
    };
    return mods[terrain] || null;
  }

  getTimeModifier(hour: number): string | null {
    if (hour >= 5 && hour <= 9) return 'Morning: +Fog';
    if (hour >= 14 && hour <= 19) return 'Afternoon: +Storms, +Heat';
    if (hour >= 21 || hour < 5) return 'Night: -Heat, +Fog';
    return null;
  }

  getTransitionImpact(currentWeather: GeographicWeatherType): string {
    const impacts: Record<GeographicWeatherType, string> = {
      clear: 'Likely to stay clear or cloud over',
      rain: 'May intensify to storm or taper off',
      storm: 'Likely to weaken to rain',
      snow: 'Likely to continue snowing',
      fog: 'Will likely burn off to clear',
      heatWave: 'May persist or trigger storms',
      overcast: 'Likely to rain or clear',
      windy: 'May clear conditions or bring storms'
    };
    return impacts[currentWeather] || 'Standard transition patterns';
  }

  getFrontLabel(frontType: string): string {
    const labels: Record<string, string> = {
      cold: 'Cold Front',
      warm: 'Warm Front',
      storm: 'Storm System',
      highPressure: 'High Pressure'
    };
    return labels[frontType] || 'Weather System';
  }

  getFrontImpactSummary(front: WeatherFront): string {
    const impacts: Record<string, string> = {
      cold: `Cold air: +Snow, +Rain, ${front.weatherInfluence?.temperatureOffset || -10}°C`,
      warm: `Warm air: +Clear, +Heat, +${front.weatherInfluence?.temperatureOffset || 8}°C`,
      storm: 'Storm system: ++Storms, ++Rain, ++Wind',
      highPressure: 'High pressure: ++Clear, -Rain, -Storms'
    };
    return impacts[front.type] || 'Weather influence';
  }

  // ============================================
  // WEATHER MODIFICATION HELPERS
  // ============================================

  applyTimeOfDay(weights: Record<GeographicWeatherType, number>, hour: number): Record<GeographicWeatherType, number> {
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

  applyTransitionMatrix(weights: Record<GeographicWeatherType, number>, currentWeather: GeographicWeatherType): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    
    const transitionModifiers: Record<GeographicWeatherType, Partial<Record<GeographicWeatherType, number>>> = {
      clear: { clear: 1.5, overcast: 1.3, rain: 0.5, storm: 0.3, fog: 0.8, snow: 0.4, heatWave: 1.4, windy: 1.0 },
      overcast: { clear: 0.8, overcast: 1.3, rain: 1.8, storm: 1.2, fog: 1.3, snow: 1.5, heatWave: 0.2, windy: 1.2 },
      rain: { clear: 0.6, overcast: 1.5, rain: 1.4, storm: 1.6, fog: 1.4, snow: 0.8, heatWave: 0.1, windy: 1.0 },
      storm: { clear: 0.8, overcast: 1.4, rain: 1.6, storm: 0.8, fog: 0.6, snow: 0.7, heatWave: 0.1, windy: 1.5 },
      fog: { clear: 1.8, overcast: 1.3, rain: 0.8, storm: 0.3, fog: 1.2, snow: 0.6, heatWave: 0.5, windy: 0.4 },
      snow: { clear: 0.9, overcast: 1.4, rain: 0.4, storm: 0.8, fog: 1.2, snow: 1.6, heatWave: 0, windy: 1.3 },
      heatWave: { clear: 1.5, overcast: 0.8, rain: 0.3, storm: 1.4, fog: 0.2, snow: 0, heatWave: 1.4, windy: 0.8 },
      windy: { clear: 1.4, overcast: 1.2, rain: 0.9, storm: 1.3, fog: 0.3, snow: 1.0, heatWave: 0.6, windy: 1.1 }
    };
    
    const modifiers = transitionModifiers[currentWeather] || {};
    
    Object.entries(modifiers).forEach(([weather, mult]) => {
      const w = weather as GeographicWeatherType;
      modified[w] = (modified[w] || 0) * (mult || 1);
    });
    
    return modified;
  }

  applyFrontInfluence(weights: Record<GeographicWeatherType, number>, front: WeatherFront): Record<GeographicWeatherType, number> {
    const modified = { ...weights };
    const influence = front.weatherInfluence || {};
    
    Object.entries(influence).forEach(([key, value]) => {
      if (key !== 'temperatureOffset' && typeof value === 'number') {
        const w = key as GeographicWeatherType;
        if (modified[w] !== undefined) {
          modified[w] *= value * front.strength;
        }
      }
    });
    
    return modified;
  }
}

export const WeatherUISystem = new WeatherUISystemClass();
