// Weather Sound Manager - Layered, dynamic weather ambience
import { audioEngine, AudioChannel } from './audioEngine';
import { WeatherType, WeatherState } from './weatherSystem';
import { soundPreloader } from './soundPreloader';

interface WeatherSoundConfig {
  sounds: string[];
  baseVolume: number;
  minIntensity?: number;
  maxIntensity?: number;
  loop?: boolean;
  lowpass?: number;
  oneShot?: boolean;
  interval?: { min: number; max: number };
}

interface ActiveLayer {
  id: string;
  setVolume?: (vol: number, duration?: number) => void;
  stop?: (fadeOut?: number) => void;
}

type TimeOfDay = 'day' | 'night' | 'dawn' | 'dusk';

class WeatherSoundManager {
  // Current weather state
  private currentWeather = {
    type: 'clear' as WeatherType,
    intensity: 0.5,
    windSpeed: 0.3,
    timeOfDay: 'day' as TimeOfDay
  };

  // Active weather layers
  private activeLayers: Map<string, ActiveLayer> = new Map();

  // Indoor/Outdoor state
  private isIndoors = false;
  private indoorAttenuation = 0.3;
  private indoorLowpass = 600;

  // Thunder system
  private thunderInterval: ReturnType<typeof setTimeout> | null = null;
  private lastThunder = 0;

  // Wind gust interval
  private windGustInterval: ReturnType<typeof setTimeout> | null = null;

  // Event listeners
  private listeners: Array<(event: any) => void> = [];

  // Weather sound definitions - keys match generated sounds from database
  // WHERE: Maps weather types/conditions to layered sound configurations
  // WHEN: Selected based on WeatherState.current + intensity + timeOfDay + indoor/outdoor
  // HOW: Layers are calculated in calculateTargetLayers(), transitioned smoothly via transitionToLayers()
  // VOLUME: All set to subtle levels (0.15-0.35) to be noticeable but not intrusive
  private weatherSounds: Record<string, WeatherSoundConfig> = {
    // ═══════════════════════════════════════════════════════════
    // BASE AMBIENCE BY TIME OF DAY (from weather_clear sounds)
    // ═══════════════════════════════════════════════════════════
    ambience_day: {
      sounds: ['weather_clear/clear_day_birds_1', 'weather_clear/clear_day_birds_2', 'weather_clear/clear_day_cicadas'],
      baseVolume: 0.18
    },
    ambience_night: {
      sounds: ['weather_clear/clear_night_crickets'],
      baseVolume: 0.20
    },
    ambience_dawn: {
      sounds: ['weather_clear/clear_day_birds_1', 'weather_clear/clear_breeze_light'],
      baseVolume: 0.16
    },
    ambience_dusk: {
      sounds: ['weather_clear/clear_night_crickets', 'weather_clear/clear_breeze_light'],
      baseVolume: 0.18
    },

    // ═══════════════════════════════════════════════════════════
    // RAIN LAYERS - OUTDOOR (from weather_rain sounds)
    // ═══════════════════════════════════════════════════════════
    rain_light: {
      sounds: ['weather_rain/rain_light_loop', 'weather_rain/rain_drizzle_loop'],
      minIntensity: 0.1,
      maxIntensity: 0.4,
      baseVolume: 0.20
    },
    rain_medium: {
      sounds: ['weather_rain/rain_medium_loop'],
      minIntensity: 0.4,
      maxIntensity: 0.7,
      baseVolume: 0.25
    },
    rain_heavy: {
      sounds: ['weather_rain/rain_heavy_loop'],
      minIntensity: 0.7,
      maxIntensity: 1.0,
      baseVolume: 0.30
    },
    rain_torrential: {
      sounds: ['weather_rain/rain_torrential_loop'],
      minIntensity: 0.85,
      baseVolume: 0.35
    },
    
    // ═══════════════════════════════════════════════════════════
    // RAIN LAYERS - INDOOR/SURFACE (from weather_rain sounds)
    // ═══════════════════════════════════════════════════════════
    rain_on_window: {
      sounds: ['weather_rain/rain_on_window_loop'],
      minIntensity: 0.3,
      baseVolume: 0.15,
      lowpass: 600
    },
    rain_on_leaves: {
      sounds: ['weather_rain/rain_on_leaves_loop'],
      minIntensity: 0.3,
      baseVolume: 0.18
    },
    rain_on_metal: {
      sounds: ['weather_rain/rain_on_metal_loop'],
      minIntensity: 0.4,
      baseVolume: 0.22
    },
    rain_on_tent: {
      sounds: ['weather_rain/rain_on_tent_loop'],
      minIntensity: 0.3,
      baseVolume: 0.20
    },
    rain_on_umbrella: {
      sounds: ['weather_rain/rain_on_umbrella_loop'],
      minIntensity: 0.3,
      baseVolume: 0.18
    },
    rain_puddle: {
      sounds: ['weather_rain/rain_puddle_splashes_loop'],
      minIntensity: 0.4,
      baseVolume: 0.15
    },

    // ═══════════════════════════════════════════════════════════
    // THUNDER (from weather_storm sounds)
    // ═══════════════════════════════════════════════════════════
    thunder_distant: {
      sounds: ['weather_storm/thunder_distant_1', 'weather_storm/thunder_distant_2'],
      baseVolume: 0.22,
      oneShot: true
    },
    thunder_rumble: {
      sounds: ['weather_storm/thunder_rumble_1'],
      baseVolume: 0.28,
      oneShot: true
    },
    thunder_close: {
      sounds: ['weather_storm/thunder_close_1'],
      baseVolume: 0.35,
      oneShot: true
    },

    // ═══════════════════════════════════════════════════════════
    // WIND LAYERS (from weather_wind sounds)
    // ═══════════════════════════════════════════════════════════
    wind_light: {
      sounds: ['weather_wind/wind_light_loop'],
      minIntensity: 0.1,
      maxIntensity: 0.4,
      baseVolume: 0.15
    },
    wind_medium: {
      sounds: ['weather_wind/wind_medium_loop'],
      minIntensity: 0.4,
      maxIntensity: 0.7,
      baseVolume: 0.20
    },
    wind_strong: {
      sounds: ['weather_wind/wind_strong_loop'],
      minIntensity: 0.7,
      maxIntensity: 1.0,
      baseVolume: 0.28
    },
    wind_howl: {
      sounds: ['weather_wind/wind_howl_loop'],
      minIntensity: 0.6,
      baseVolume: 0.22
    },
    wind_gusts: {
      sounds: ['weather_wind/wind_gust_1', 'weather_wind/wind_gust_2'],
      oneShot: true,
      minIntensity: 0.5,
      interval: { min: 8000, max: 25000 },
      baseVolume: 0.25
    },

    // ═══════════════════════════════════════════════════════════
    // SNOW / WINTER (from weather_snow sounds)
    // ═══════════════════════════════════════════════════════════
    snow_ambient: {
      sounds: ['weather_snow/snow_falling_loop'],
      baseVolume: 0.12
    },
    snow_crunching: {
      sounds: ['weather_snow/snow_crunching_loop'],
      baseVolume: 0.20,
      oneShot: true
    },
    snow_wind: {
      sounds: ['weather_snow/snow_wind_loop'],
      minIntensity: 0.4,
      baseVolume: 0.20
    },
    arctic_blizzard: {
      sounds: ['weather_snow/blizzard_loop'],
      minIntensity: 0.7,
      baseVolume: 0.28
    },

    // ═══════════════════════════════════════════════════════════
    // STORM - COMBINED LAYERS (from weather_storm sounds)
    // ═══════════════════════════════════════════════════════════
    storm_ambient: {
      sounds: ['weather_storm/storm_ambient_loop'],
      baseVolume: 0.30
    },
    storm_rain: {
      sounds: ['weather_storm/storm_rain_loop'],
      baseVolume: 0.32
    },
    
    // ═══════════════════════════════════════════════════════════
    // HAIL (from weather_hail sounds)
    // ═══════════════════════════════════════════════════════════
    hail_light: {
      sounds: ['weather_hail/hail_light_loop'],
      minIntensity: 0.3,
      baseVolume: 0.20
    },
    hail_heavy: {
      sounds: ['weather_hail/hail_heavy_loop'],
      minIntensity: 0.6,
      baseVolume: 0.28
    },
    hail_on_roof: {
      sounds: ['weather_hail/hail_on_roof_loop'],
      minIntensity: 0.4,
      baseVolume: 0.25,
      lowpass: 800
    },

    // ═══════════════════════════════════════════════════════════
    // FOG (from weather_fog sounds)
    // ═══════════════════════════════════════════════════════════
    fog_ambient: {
      sounds: ['weather_fog/fog_ambient_1', 'weather_fog/fog_ambient_2'],
      baseVolume: 0.12,
      lowpass: 800
    },
    fog_eerie: {
      sounds: ['weather_fog/fog_eerie_1', 'weather_fog/fog_eerie_2'],
      baseVolume: 0.15,
      lowpass: 600
    },
    fog_dripping: {
      sounds: ['weather_fog/fog_dripping_1'],
      baseVolume: 0.18
    }
  };

  // ═══════════════════════════════════════════════════════════
  // WEATHER CONTROL
  // ═══════════════════════════════════════════════════════════

  async setWeather(
    weatherState: Partial<typeof this.currentWeather>,
    transitionTime = 3
  ): Promise<void> {
    // Skip if sounds aren't preloaded yet
    if (!soundPreloader.isReady()) {
      // Store intent for when sounds are ready
      this.currentWeather = { ...this.currentWeather, ...weatherState };
      return;
    }

    const previousWeather = { ...this.currentWeather };
    this.currentWeather = { ...this.currentWeather, ...weatherState };

    // Calculate which layers should be active
    const targetLayers = this.calculateTargetLayers();

    // Transition to new layers
    await this.transitionToLayers(targetLayers, transitionTime);

    // Handle thunder for storms
    if (this.currentWeather.type === 'storm') {
      this.startThunderCycle();
    } else {
      this.stopThunderCycle();
    }

    // Handle wind gusts
    if (this.currentWeather.windSpeed > 0.5) {
      this.startWindGustCycle();
    } else {
      this.stopWindGustCycle();
    }

    // Notify listeners
    this.notifyChange({
      type: 'weather_changed',
      previous: previousWeather,
      current: this.currentWeather
    });
  }

  // Sync with game weather state
  syncWithWeatherState(weatherState: WeatherState, timeOfDay: TimeOfDay = 'day'): void {
    this.setWeather({
      type: weatherState.current,
      intensity: weatherState.intensity,
      windSpeed: this.getWindSpeedForWeather(weatherState.current, weatherState.intensity),
      timeOfDay
    });
  }

  private getWindSpeedForWeather(weather: WeatherType, intensity: number): number {
    switch (weather) {
      case 'storm':
        return 0.7 + intensity * 0.3;
      case 'wind':
        return 0.5 + intensity * 0.5;
      case 'snow':
        return 0.2 + intensity * 0.3;
      case 'rain':
        return 0.1 + intensity * 0.3;
      default:
        return 0.1 + Math.random() * 0.2;
    }
  }

  // Calculate which sound layers should be playing
  private calculateTargetLayers(): Map<string, { sounds: string[]; volume: number; lowpass?: number }> {
    const layers = new Map<string, { sounds: string[]; volume: number; lowpass?: number }>();
    const weather = this.currentWeather;

    // Base ambience by time of day
    const ambienceKey = `ambience_${weather.timeOfDay}`;
    if (this.weatherSounds[ambienceKey]) {
      layers.set(ambienceKey, {
        sounds: this.weatherSounds[ambienceKey].sounds,
        volume: this.weatherSounds[ambienceKey].baseVolume
      });
    }

    // Weather-specific layers
    switch (weather.type) {
      case 'rain':
        this.addRainLayers(layers, weather.intensity);
        break;

      case 'storm':
        this.addRainLayers(layers, Math.max(0.7, weather.intensity));
        this.addWindLayers(layers, Math.max(0.6, weather.windSpeed));
        if (this.weatherSounds.storm_ambient) {
          layers.set('storm_ambient', {
            sounds: this.weatherSounds.storm_ambient.sounds,
            volume: 0.5 + weather.intensity * 0.3
          });
        }
        break;

      case 'snow':
        layers.set('snow_ambient', {
          sounds: this.weatherSounds.snow_ambient.sounds,
          volume: 0.2 + weather.intensity * 0.2
        });
        // Light wind with snow
        if (weather.windSpeed > 0.2) {
          this.addWindLayers(layers, weather.windSpeed * 0.7);
        }
        break;

      case 'fog':
        layers.set('fog_ambient', {
          sounds: this.weatherSounds.fog_ambient.sounds,
          volume: 0.2 + weather.intensity * 0.15,
          lowpass: this.weatherSounds.fog_ambient.lowpass
        });
        break;

      case 'wind':
      case 'cloudy':
        this.addWindLayers(layers, weather.windSpeed);
        break;

      case 'clear':
      default:
        // Just base ambience, maybe light breeze
        if (weather.windSpeed > 0.2) {
          this.addWindLayers(layers, weather.windSpeed * 0.5);
        }
        break;
    }

    return layers;
  }

  private addRainLayers(
    layers: Map<string, { sounds: string[]; volume: number; lowpass?: number }>,
    intensity: number
  ): void {
    // Select appropriate rain intensity layer
    if (intensity >= 0.7 && this.weatherSounds.rain_heavy) {
      layers.set('rain_heavy', {
        sounds: this.weatherSounds.rain_heavy.sounds,
        volume: this.weatherSounds.rain_heavy.baseVolume * intensity
      });
    } else if (intensity >= 0.4 && this.weatherSounds.rain_medium) {
      layers.set('rain_medium', {
        sounds: this.weatherSounds.rain_medium.sounds,
        volume: this.weatherSounds.rain_medium.baseVolume * intensity
      });
    } else if (intensity >= 0.1 && this.weatherSounds.rain_light) {
      layers.set('rain_light', {
        sounds: this.weatherSounds.rain_light.sounds,
        volume: this.weatherSounds.rain_light.baseVolume * intensity
      });
    }

    // Surface rain sounds
    if (intensity >= 0.3 && this.weatherSounds.rain_on_surface) {
      layers.set('rain_on_surface', {
        sounds: this.weatherSounds.rain_on_surface.sounds,
        volume: this.weatherSounds.rain_on_surface.baseVolume * intensity
      });
    }
  }

  private addWindLayers(
    layers: Map<string, { sounds: string[]; volume: number; lowpass?: number }>,
    windSpeed: number
  ): void {
    if (windSpeed >= 0.7 && this.weatherSounds.wind_strong) {
      layers.set('wind_strong', {
        sounds: this.weatherSounds.wind_strong.sounds,
        volume: this.weatherSounds.wind_strong.baseVolume * windSpeed
      });
    } else if (windSpeed >= 0.4 && this.weatherSounds.wind_medium) {
      layers.set('wind_medium', {
        sounds: this.weatherSounds.wind_medium.sounds,
        volume: this.weatherSounds.wind_medium.baseVolume * windSpeed
      });
    } else if (windSpeed >= 0.1 && this.weatherSounds.wind_light) {
      layers.set('wind_light', {
        sounds: this.weatherSounds.wind_light.sounds,
        volume: this.weatherSounds.wind_light.baseVolume * windSpeed
      });
    }
  }

  // Smoothly transition between layer sets
  private async transitionToLayers(
    targetLayers: Map<string, { sounds: string[]; volume: number; lowpass?: number }>,
    duration: number
  ): Promise<void> {
    const currentLayerIds = new Set(this.activeLayers.keys());
    const targetLayerIds = new Set(targetLayers.keys());

    // Layers to fade out
    for (const id of currentLayerIds) {
      if (!targetLayerIds.has(id)) {
        const layer = this.activeLayers.get(id);
        layer?.stop?.(duration);
        this.activeLayers.delete(id);
      }
    }

    // Layers to fade in or adjust
    for (const [id, config] of targetLayers) {
      const soundKey = config.sounds[0]; // Use first sound in list

      // Apply indoor attenuation
      let volume = config.volume;
      let lowpass = config.lowpass || null;

      if (this.isIndoors) {
        volume *= this.indoorAttenuation;
        lowpass = lowpass || this.indoorLowpass;
      }

      if (currentLayerIds.has(id)) {
        // Adjust existing layer volume
        const existing = this.activeLayers.get(id);
        existing?.setVolume?.(volume, duration);
      } else {
        // Start new layer
        const loop = await audioEngine.playLoop(soundKey, {
          id,
          volume,
          fadeIn: duration,
          lowpass
        });

        if (loop) {
          this.activeLayers.set(id, {
            id,
            setVolume: loop.setVolume,
            stop: loop.stop
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // THUNDER SYSTEM
  // ═══════════════════════════════════════════════════════════

  private startThunderCycle(): void {
    if (this.thunderInterval) return;

    const scheduleNextThunder = () => {
      // Random interval based on storm intensity
      const intensity = this.currentWeather.intensity;
      const minDelay = Math.max(5000, 30000 - intensity * 25000);
      const maxDelay = Math.max(15000, 60000 - intensity * 40000);
      const delay = minDelay + Math.random() * (maxDelay - minDelay);

      this.thunderInterval = setTimeout(() => {
        this.triggerThunder();
        scheduleNextThunder();
      }, delay);
    };

    // First thunder soon
    setTimeout(() => this.triggerThunder(), 2000 + Math.random() * 5000);
    scheduleNextThunder();
  }

  private stopThunderCycle(): void {
    if (this.thunderInterval) {
      clearTimeout(this.thunderInterval);
      this.thunderInterval = null;
    }
  }

  async triggerThunder(forceClose = false): Promise<void> {
    // Skip if sounds aren't ready
    if (!soundPreloader.isReady()) return;

    const intensity = this.currentWeather.intensity;
    const isClose = forceClose || Math.random() < intensity * 0.4;

    const thunderConfig = isClose
      ? this.weatherSounds.thunder_close
      : this.weatherSounds.thunder_distant;

    if (!thunderConfig) return;

    // Pick random thunder sound
    const soundKey = thunderConfig.sounds[
      Math.floor(Math.random() * thunderConfig.sounds.length)
    ];

    if (isClose) {
      // Trigger lightning flash (epilepsy-safe)
      this.triggerLightningFlash();

      // Small delay before thunder (sound travels slower than light)
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    }

    // Play thunder with echo
    await audioEngine.playSound(soundKey, {
      channel: 'effects',
      volume: isClose ? 1 : 0.6,
      echo: true,
      echoDelay: 0.4,
      echoDecay: 0.5
    });

    // Screen shake for close thunder (subtle)
    if (isClose) {
      this.triggerScreenShake(0.2);
    }

    this.lastThunder = Date.now();
  }

  private triggerLightningFlash(): void {
    // Dispatch event for UI to handle (epilepsy-safe settings)
    window.dispatchEvent(new CustomEvent('lightningFlash', {
      detail: { intensity: 0.3 + Math.random() * 0.2 } // Reduced intensity
    }));
  }

  private triggerScreenShake(intensity: number): void {
    window.dispatchEvent(new CustomEvent('screenShake', {
      detail: { intensity, duration: 200 }
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // WIND GUST SYSTEM
  // ═══════════════════════════════════════════════════════════

  private startWindGustCycle(): void {
    if (this.windGustInterval) return;

    const scheduleNextGust = () => {
      const config = this.weatherSounds.wind_gusts;
      if (!config?.interval) return;

      const delay = config.interval.min + Math.random() * (config.interval.max - config.interval.min);

      this.windGustInterval = setTimeout(() => {
        this.triggerWindGust();
        scheduleNextGust();
      }, delay);
    };

    scheduleNextGust();
  }

  private stopWindGustCycle(): void {
    if (this.windGustInterval) {
      clearTimeout(this.windGustInterval);
      this.windGustInterval = null;
    }
  }

  private async triggerWindGust(): Promise<void> {
    // Skip if sounds aren't ready
    if (!soundPreloader.isReady()) return;

    const config = this.weatherSounds.wind_gusts;
    if (!config) return;

    const soundKey = config.sounds[Math.floor(Math.random() * config.sounds.length)];
    const pan = Math.random() * 2 - 1; // Random left-right position

    await audioEngine.playSound(soundKey, {
      channel: 'ambience',
      volume: config.baseVolume * this.currentWeather.windSpeed,
      pan
    });
  }

  // ═══════════════════════════════════════════════════════════
  // INDOOR/OUTDOOR
  // ═══════════════════════════════════════════════════════════

  async setIndoors(isIndoors: boolean, transitionTime = 1.5): Promise<void> {
    if (this.isIndoors === isIndoors) return;

    this.isIndoors = isIndoors;

    // Recalculate and transition layers
    const targetLayers = this.calculateTargetLayers();
    await this.transitionToLayers(targetLayers, transitionTime);

    // Play door sound
    if (isIndoors) {
      await audioEngine.playSound('door_close', { channel: 'effects' });
    } else {
      await audioEngine.playSound('door_open', { channel: 'effects' });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════

  subscribe(callback: (event: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx > -1) this.listeners.splice(idx, 1);
    };
  }

  private notifyChange(event: any): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════

  stop(): void {
    this.stopThunderCycle();
    this.stopWindGustCycle();

    for (const [, layer] of this.activeLayers) {
      layer.stop?.(0.5);
    }
    this.activeLayers.clear();
  }

  // Get current state for debugging
  getState() {
    return {
      weather: this.currentWeather,
      activeLayers: Array.from(this.activeLayers.keys()),
      isIndoors: this.isIndoors
    };
  }
}

// Singleton instance
export const weatherSoundManager = new WeatherSoundManager();
