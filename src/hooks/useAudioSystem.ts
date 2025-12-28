// Audio System Hook - Manages audio initialization and state
import { useState, useEffect, useCallback } from 'react';
import { audioEngine, AudioEngineState, AudioVolumes, AudioChannel } from '@/game/audioEngine';
import { weatherSoundManager } from '@/game/weatherSoundManager';
import { storySoundTrigger } from '@/game/storySoundTrigger';
import { acousticEnvironmentSystem, AcousticSpace, LocationAcoustics } from '@/game/acousticEnvironmentSystem';
import { soundPreloader, PreloadProgress, CachedSound } from '@/game/soundPreloader';
import { WeatherState } from '@/game/weatherSystem';

interface UseAudioSystemReturn {
  initialized: boolean;
  muted: boolean;
  volumes: AudioVolumes;
  unlocked: boolean;
  acousticSpace: AcousticSpace;
  isIndoors: boolean;
  preloadProgress: PreloadProgress | null;
  soundsReady: boolean;
  initializeAudio: () => Promise<void>;
  preloadSounds: (options?: { priorityOnly?: boolean; categories?: string[] }) => Promise<void>;
  setMasterVolume: (volume: number) => void;
  setChannelVolume: (channel: AudioChannel, volume: number) => void;
  toggleMute: () => void;
  syncWeather: (weatherState: WeatherState, timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk') => void;
  processNarrative: (text: string) => string[];
  playUISound: (sound: 'click' | 'notification' | 'success' | 'error' | 'level_up' | 'item_acquired') => void;
  playSoundFromCategory: (category: string, options?: { volume?: number; pitch?: number }) => Promise<boolean>;
  findSounds: (searchTerm: string) => CachedSound[];
  getLoadedCategories: () => string[];
  setIndoors: (isIndoors: boolean) => void;
  setLocation: (locationType: string) => void;
  getAcoustics: () => LocationAcoustics;
  stopAll: () => void;
}

export function useAudioSystem(): UseAudioSystemReturn {
  const [state, setState] = useState<AudioEngineState>({
    initialized: false,
    muted: false,
    unlocked: false,
    volumes: {
      master: 0.8,
      ambience: 0.6,
      effects: 0.9,
      music: 0.4,
      ui: 0.5
    }
  });

  const [acousticSpace, setAcousticSpace] = useState<AcousticSpace>('outdoor');
  const [isIndoorsState, setIsIndoorsState] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress | null>(null);
  const [soundsReady, setSoundsReady] = useState(false);

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((newState) => {
      setState(newState);
    });

    // Set initial state
    setState(audioEngine.getState());

    return unsubscribe;
  }, []);

  // Subscribe to acoustic environment changes
  useEffect(() => {
    const unsubscribe = acousticEnvironmentSystem.subscribe((acoustics) => {
      setAcousticSpace(acoustics.space);
      setIsIndoorsState(acoustics.space === 'indoor' || acoustics.space === 'underground');
    });

    // Set initial acoustic state
    setAcousticSpace(acousticEnvironmentSystem.getAcousticSpace());
    setIsIndoorsState(acousticEnvironmentSystem.isIndoors());

    return unsubscribe;
  }, []);

  // Subscribe to preload progress
  useEffect(() => {
    const unsubscribe = soundPreloader.onProgress((progress) => {
      setPreloadProgress(progress);
      if (progress.isComplete) {
        setSoundsReady(true);
      }
    });

    // Check if already preloaded
    setSoundsReady(soundPreloader.isReady());

    return unsubscribe;
  }, []);

  // Initialize audio on first user interaction - now also preloads sounds
  const initializeAudio = useCallback(async () => {
    await audioEngine.ensureContext();
    setState(audioEngine.getState());
    
    // Automatically preload sounds after audio context is ready
    console.log('[AudioSystem] Audio initialized, preloading sounds...');
    try {
      await soundPreloader.preloadAll({ priorityOnly: true });
      console.log('[AudioSystem] Priority sounds preloaded');
      
      // Load remaining sounds in background
      soundPreloader.preloadAll().then(() => {
        console.log('[AudioSystem] All sounds preloaded');
      });
    } catch (error) {
      console.error('[AudioSystem] Failed to preload sounds:', error);
    }
  }, []);

  // Preload sounds from storage (can be called manually for specific categories)
  const preloadSounds = useCallback(async (options?: { 
    priorityOnly?: boolean; 
    categories?: string[] 
  }) => {
    if (!state.initialized) {
      await initializeAudio();
    }
    await soundPreloader.preloadAll(options);
  }, [state.initialized, initializeAudio]);

  // Volume controls
  const setMasterVolume = useCallback((volume: number) => {
    audioEngine.setMasterVolume(volume);
  }, []);

  const setChannelVolume = useCallback((channel: AudioChannel, volume: number) => {
    audioEngine.setChannelVolume(channel, volume);
  }, []);

  const toggleMute = useCallback(() => {
    audioEngine.toggleMute();
  }, []);

  // Weather sync
  const syncWeather = useCallback((
    weatherState: WeatherState,
    timeOfDay: 'day' | 'night' | 'dawn' | 'dusk' = 'day'
  ) => {
    if (state.initialized && !state.muted) {
      weatherSoundManager.syncWithWeatherState(weatherState, timeOfDay);
    }
  }, [state.initialized, state.muted]);

  // Narrative processing (now with automatic location detection)
  const processNarrative = useCallback((text: string): string[] => {
    if (state.initialized && !state.muted) {
      return storySoundTrigger.processNarrativeText(text);
    }
    return [];
  }, [state.initialized, state.muted]);

  // UI sounds
  const playUISound = useCallback((
    sound: 'click' | 'notification' | 'success' | 'error' | 'level_up' | 'item_acquired'
  ) => {
    if (state.initialized && !state.muted) {
      storySoundTrigger.playUISound(sound);
    }
  }, [state.initialized, state.muted]);

  // Play sound from preloaded category
  const playSoundFromCategory = useCallback(async (
    category: string,
    options?: { volume?: number; pitch?: number }
  ): Promise<boolean> => {
    if (!state.initialized || state.muted) return false;
    return soundPreloader.playFromCategory(category, options);
  }, [state.initialized, state.muted]);

  // Find sounds by search term
  const findSounds = useCallback((searchTerm: string): CachedSound[] => {
    return soundPreloader.findSounds(searchTerm);
  }, []);

  // Get loaded categories
  const getLoadedCategories = useCallback((): string[] => {
    return soundPreloader.getLoadedCategories();
  }, []);

  // Indoor/outdoor (legacy support - now use setLocation instead)
  const setIndoors = useCallback((isIndoors: boolean) => {
    if (state.initialized) {
      weatherSoundManager.setIndoors(isIndoors);
      // Also update acoustic environment
      if (isIndoors) {
        acousticEnvironmentSystem.setLocation('indoor');
      } else {
        acousticEnvironmentSystem.setLocation('outdoor');
      }
    }
  }, [state.initialized]);

  // Set location with full acoustic environment update
  const setLocation = useCallback((locationType: string) => {
    acousticEnvironmentSystem.setLocation(locationType);
    storySoundTrigger.setLocationAmbience(locationType);
    
    // Also update weather manager
    const isIndoors = acousticEnvironmentSystem.isIndoors();
    weatherSoundManager.setIndoors(isIndoors);
  }, []);

  // Get current acoustics
  const getAcoustics = useCallback(() => {
    return acousticEnvironmentSystem.getAcoustics();
  }, []);

  // Stop all sounds
  const stopAll = useCallback(() => {
    audioEngine.stopAll();
    weatherSoundManager.stop();
    storySoundTrigger.stopAll();
  }, []);

  return {
    initialized: state.initialized,
    muted: state.muted,
    volumes: state.volumes,
    unlocked: state.unlocked,
    acousticSpace,
    isIndoors: isIndoorsState,
    preloadProgress,
    soundsReady,
    initializeAudio,
    preloadSounds,
    setMasterVolume,
    setChannelVolume,
    toggleMute,
    syncWeather,
    processNarrative,
    playUISound,
    playSoundFromCategory,
    findSounds,
    getLoadedCategories,
    setIndoors,
    setLocation,
    getAcoustics,
    stopAll
  };
}
