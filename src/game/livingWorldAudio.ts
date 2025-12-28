// Living World Audio - Unified API for the complete audio system
// Combines AudioEngine, StorySoundTrigger, WeatherSoundManager, and LocationAmbientManager

import { audioEngine, AudioChannel } from './audioEngine';
import { storySoundTrigger } from './storySoundTrigger';
import { weatherSoundManager } from './weatherSoundManager';
import { locationAmbientManager } from './locationAmbientManager';
import { soundPreloader } from './soundPreloader';
import { acousticEnvironmentSystem } from './acousticEnvironmentSystem';
import { WeatherType, WeatherState } from './weatherSystem';

type TimeOfDay = 'day' | 'night' | 'dawn' | 'dusk';
type GenreType = 'modern' | 'medieval' | 'cyberpunk' | 'western' | 'horror' | 'fantasy' | 'post_apocalyptic' | 'scifi';

interface SceneOptions {
  location?: string;
  weather?: {
    type: WeatherType;
    intensity: number;
    windSpeed?: number;
  };
  timeOfDay?: TimeOfDay;
  indoors?: boolean;
  genre?: GenreType;
  transitionTime?: number;
}

interface NarrativeResult {
  sounds: string[];
  locationChanged: string | null;
}

interface DebugInfo {
  engine: {
    initialized: boolean;
    muted: boolean;
    unlocked: boolean;
    activeLoops: number;
    activeSources: number;
  };
  sounds: {
    lastTriggered: string[];
    cooldownsActive: number;
  };
  weather: {
    type: string;
    intensity: number;
    windSpeed: number;
    timeOfDay: string;
    activeLayers: string[];
  };
  location: {
    current: string | null;
    genre: string;
    activeLayers: string[];
  };
  preloader: {
    ready: boolean;
    loadedCategories: string[];
    totalSounds: number;
  };
}

class LivingWorldAudioClass {
  // References to subsystems
  readonly engine = audioEngine;
  readonly sounds = storySoundTrigger;
  readonly weather = weatherSoundManager;
  readonly location = locationAmbientManager;
  readonly preloader = soundPreloader;
  readonly acoustics = acousticEnvironmentSystem;

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Initialize the complete audio system
   * Should be called after user interaction (click/tap) due to browser autoplay policies
   */
  async initialize(): Promise<boolean> {
    const success = await audioEngine.initialize();
    if (success) {
      console.log('[LivingWorldAudio] ✓ Audio system initialized');
      
      // Start preloading priority sounds
      soundPreloader.preloadAll({ priorityOnly: true }).then(() => {
        console.log('[LivingWorldAudio] ✓ Priority sounds preloaded');
        
        // Continue with all sounds in background
        soundPreloader.preloadAll().then(() => {
          console.log('[LivingWorldAudio] ✓ All sounds preloaded');
        });
      });
    }
    return success;
  }

  /**
   * Check if audio system is ready
   */
  isReady(): boolean {
    return audioEngine.initialized && audioEngine.unlocked;
  }

  /**
   * Ensure audio is unlocked (call on user interaction)
   */
  async ensureUnlocked(): Promise<void> {
    await audioEngine.ensureContext();
  }

  // ═══════════════════════════════════════════════════════════
  // NARRATIVE PROCESSING
  // ═══════════════════════════════════════════════════════════

  /**
   * Process narrative text for sound triggers and location changes
   * This is the primary method for story-driven audio
   */
  async processNarrative(text: string, options: { transitionTime?: number } = {}): Promise<NarrativeResult> {
    // Trigger sounds from text patterns
    const triggeredSounds = storySoundTrigger.processNarrativeText(text);

    // Check for location changes
    const newLocation = await locationAmbientManager.processNarrativeText(text, options);

    // Update acoustic environment based on detected location
    const detectedLocation = acousticEnvironmentSystem.detectLocationFromText(text);
    if (detectedLocation) {
      acousticEnvironmentSystem.setLocation(detectedLocation);
    }

    return {
      sounds: triggeredSounds,
      locationChanged: newLocation
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SCENE CONTROL
  // ═══════════════════════════════════════════════════════════

  /**
   * Set complete scene (weather + location + time)
   * Use this for major scene transitions
   */
  async setScene(options: SceneOptions): Promise<void> {
    const {
      location,
      weather,
      timeOfDay,
      indoors = false,
      genre,
      transitionTime = 3
    } = options;

    // Set genre first (affects available locations)
    if (genre) {
      locationAmbientManager.setGenre(genre);
    }

    // Set indoor state for weather attenuation
    if (indoors !== locationAmbientManager.isIndoors()) {
      await weatherSoundManager.setIndoors(indoors, transitionTime * 0.5);
    }

    // Set location ambient
    if (location) {
      await locationAmbientManager.setLocation(location, { transitionTime });
      acousticEnvironmentSystem.setLocation(location);
    }

    // Set weather with time of day
    if (weather) {
      await weatherSoundManager.setWeather({
        type: weather.type,
        intensity: weather.intensity,
        windSpeed: weather.windSpeed || 0.3,
        timeOfDay: timeOfDay || 'day'
      }, transitionTime);
    } else if (timeOfDay) {
      // Just change time of day
      await weatherSoundManager.setWeather({ timeOfDay }, transitionTime);
    }

    console.log(`[LivingWorldAudio] Scene set: ${location || 'unchanged'}, ${weather?.type || 'unchanged'} weather, ${timeOfDay || 'unchanged'} time`);
  }

  /**
   * Sync with game weather state
   */
  syncWithWeather(weatherState: WeatherState, timeOfDay: TimeOfDay = 'day'): void {
    weatherSoundManager.syncWithWeatherState(weatherState, timeOfDay);
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECT SOUND CONTROL
  // ═══════════════════════════════════════════════════════════

  /**
   * Play a sound directly by category or key
   */
  async play(
    soundPath: string,
    options: {
      volume?: number;
      pitch?: number;
      pan?: number;
      channel?: AudioChannel;
    } = {}
  ): Promise<boolean> {
    // Try preloader first (category-based)
    const sounds = soundPreloader.findSounds(soundPath);
    if (sounds.length > 0) {
      return soundPreloader.playFromCategory(sounds[0].category, options);
    }

    // Fall back to direct play
    const result = await audioEngine.playSound(soundPath, {
      channel: options.channel || 'effects',
      volume: options.volume,
      pitch: options.pitch,
      pan: options.pan
    });
    
    return result !== null;
  }

  /**
   * Play a UI sound
   */
  playUI(sound: 'click' | 'notification' | 'success' | 'error' | 'level_up' | 'item_acquired'): void {
    storySoundTrigger.playUISound(sound);
  }

  /**
   * Start a looping sound
   */
  async startLoop(
    soundKey: string,
    options: {
      volume?: number;
      fadeIn?: number;
      channel?: AudioChannel;
      id?: string;
    } = {}
  ): Promise<string | null> {
    const result = await audioEngine.playLoop(soundKey, {
      channel: options.channel || 'ambience',
      volume: options.volume || 1,
      fadeIn: options.fadeIn || 2,
      id: options.id || soundKey
    });

    return result?.id || null;
  }

  /**
   * Stop a looping sound
   */
  async stopLoop(loopId: string, fadeOut = 2): Promise<void> {
    await audioEngine.stopLoop(loopId, { fadeOut });
  }

  // ═══════════════════════════════════════════════════════════
  // VOLUME CONTROL
  // ═══════════════════════════════════════════════════════════

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    audioEngine.setMasterVolume(volume);
  }

  /**
   * Set channel volume (0-1)
   */
  setChannelVolume(channel: AudioChannel, volume: number): void {
    audioEngine.setChannelVolume(channel, volume);
  }

  /**
   * Mute audio
   */
  mute(): void {
    audioEngine.mute();
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    audioEngine.unmute();
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    return audioEngine.toggleMute();
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return audioEngine.muted;
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP & CONTROL
  // ═══════════════════════════════════════════════════════════

  /**
   * Stop all sounds immediately
   */
  stopAll(): void {
    audioEngine.stopAll();
    weatherSoundManager.stop();
    locationAmbientManager.clearLocation(0);
    storySoundTrigger.stopAll();
  }

  /**
   * Stop all sounds with fade out
   */
  async fadeOut(duration = 2): Promise<void> {
    await weatherSoundManager.stop();
    await locationAmbientManager.clearLocation(duration);
    storySoundTrigger.stopAll();
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopAll();
    weatherSoundManager.stop();
  }

  // ═══════════════════════════════════════════════════════════
  // DEBUG & STATE
  // ═══════════════════════════════════════════════════════════

  /**
   * Get complete debug info for all subsystems
   */
  getDebugInfo(): DebugInfo {
    const weatherState = weatherSoundManager.getState?.();
    return {
      engine: {
        initialized: audioEngine.initialized,
        muted: audioEngine.muted,
        unlocked: audioEngine.unlocked,
        activeLoops: 0,
        activeSources: 0
      },
      sounds: {
        lastTriggered: [],
        cooldownsActive: 0
      },
      weather: {
        type: weatherState?.weather?.type || 'clear',
        intensity: weatherState?.weather?.intensity || 0.5,
        windSpeed: weatherState?.weather?.windSpeed || 0.3,
        timeOfDay: weatherState?.weather?.timeOfDay || 'day',
        activeLayers: weatherState?.activeLayers || []
      },
      location: {
        current: locationAmbientManager.getCurrentLocation(),
        genre: locationAmbientManager.getGenre(),
        activeLayers: locationAmbientManager.getState().activeLayers
      },
      preloader: {
        ready: soundPreloader.isReady(),
        loadedCategories: soundPreloader.getLoadedCategories(),
        totalSounds: soundPreloader.findSounds('').length
      }
    };
  }

  /**
   * Test pattern matching against text
   */
  testPatterns(text: string): string[] {
    return storySoundTrigger.processNarrativeText(text);
  }

  /**
   * Get available locations for current genre
   */
  getAvailableLocations(): Array<{ id: string; name: string }> {
    return locationAmbientManager.getAvailableLocations();
  }

  /**
   * Get current acoustic environment
   */
  getAcoustics() {
    return acousticEnvironmentSystem.getAcoustics();
  }
}

// Singleton export
export const livingWorldAudio = new LivingWorldAudioClass();

// Also export as default for convenience
export default livingWorldAudio;
