// Weather Sound Manager - Layered, dynamic weather ambience
import { audioEngine, AudioChannel } from './audioEngine';
import { WeatherType, WeatherState } from './weatherSystem';

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

  // Weather sound definitions
  private weatherSounds: Record<string, WeatherSoundConfig> = {
    // Base ambience by time of day
    ambience_day: {
      sounds: ['amb_birds_light', 'amb_breeze_light'],
      baseVolume: 0.4
    },
    ambience_night: {
      sounds: ['amb_crickets', 'amb_night_breeze'],
      baseVolume: 0.5
    },
    ambience_dawn: {
      sounds: ['amb_birds_dawn', 'amb_morning_breeze'],
      baseVolume: 0.45
    },
    ambience_dusk: {
      sounds: ['amb_evening_birds', 'amb_evening_breeze'],
      baseVolume: 0.45
    },

    // Rain layers (by intensity)
    rain_light: {
      sounds: ['rain_light_loop'],
      minIntensity: 0.1,
      maxIntensity: 0.4,
      baseVolume: 0.5
    },
    rain_medium: {
      sounds: ['rain_medium_loop'],
      minIntensity: 0.4,
      maxIntensity: 0.7,
      baseVolume: 0.6
    },
    rain_heavy: {
      sounds: ['rain_heavy_loop'],
      minIntensity: 0.7,
      maxIntensity: 1.0,
      baseVolume: 0.7
    },
    rain_on_surface: {
      sounds: ['rain_on_roof', 'rain_on_leaves'],
      minIntensity: 0.3,
      baseVolume: 0.4
    },

    // Thunder (triggered separately)
    thunder_distant: {
      sounds: ['thunder_distant_1', 'thunder_distant_2', 'thunder_distant_3'],
      baseVolume: 0.6,
      oneShot: true
    },
    thunder_close: {
      sounds: ['thunder_close_1', 'thunder_close_2'],
      baseVolume: 1.0,
      oneShot: true
    },

    // Wind layers
    wind_light: {
      sounds: ['wind_light_loop'],
      minIntensity: 0.1,
      maxIntensity: 0.4,
      baseVolume: 0.4
    },
    wind_medium: {
      sounds: ['wind_medium_loop'],
      minIntensity: 0.4,
      maxIntensity: 0.7,
      baseVolume: 0.55
    },
    wind_strong: {
      sounds: ['wind_strong_loop', 'wind_howl_loop'],
      minIntensity: 0.7,
      maxIntensity: 1.0,
      baseVolume: 0.7
    },
    wind_gusts: {
      sounds: ['wind_gust_1', 'wind_gust_2', 'wind_gust_3'],
      oneShot: true,
      minIntensity: 0.5,
      interval: { min: 8000, max: 25000 },
      baseVolume: 0.6
    },

    // Snow
    snow_ambient: {
      sounds: ['snow_ambient_loop'],
      baseVolume: 0.3
    },

    // Storm
    storm_ambient: {
      sounds: ['storm_wind_loop', 'storm_rain_loop'],
      baseVolume: 0.75
    },

    // Fog (eerie, quiet)
    fog_ambient: {
      sounds: ['fog_ambient_loop'],
      baseVolume: 0.25,
      lowpass: 800
    }
  };

  // ═══════════════════════════════════════════════════════════
  // WEATHER CONTROL
  // ═══════════════════════════════════════════════════════════

  async setWeather(
    weatherState: Partial<typeof this.currentWeather>,
    transitionTime = 3
  ): Promise<void> {
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
