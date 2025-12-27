// Audio System Hook - Manages audio initialization and state
import { useState, useEffect, useCallback } from 'react';
import { audioEngine, AudioEngineState, AudioVolumes, AudioChannel } from '@/game/audioEngine';
import { weatherSoundManager } from '@/game/weatherSoundManager';
import { storySoundTrigger } from '@/game/storySoundTrigger';
import { acousticEnvironmentSystem, AcousticSpace, LocationAcoustics } from '@/game/acousticEnvironmentSystem';
import { WeatherState } from '@/game/weatherSystem';

interface UseAudioSystemReturn {
  initialized: boolean;
  muted: boolean;
  volumes: AudioVolumes;
  acousticSpace: AcousticSpace;
  isIndoors: boolean;
  initializeAudio: () => Promise<void>;
  setMasterVolume: (volume: number) => void;
  setChannelVolume: (channel: AudioChannel, volume: number) => void;
  toggleMute: () => void;
  syncWeather: (weatherState: WeatherState, timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk') => void;
  processNarrative: (text: string) => string[];
  playUISound: (sound: 'click' | 'notification' | 'success' | 'error' | 'level_up' | 'item_acquired') => void;
  setIndoors: (isIndoors: boolean) => void;
  setLocation: (locationType: string) => void;
  getAcoustics: () => LocationAcoustics;
  stopAll: () => void;
}

export function useAudioSystem(): UseAudioSystemReturn {
  const [state, setState] = useState<AudioEngineState>({
    initialized: false,
    muted: false,
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

  // Initialize audio on first user interaction
  const initializeAudio = useCallback(async () => {
    await audioEngine.ensureContext();
    setState(audioEngine.getState());
  }, []);

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
    acousticSpace,
    isIndoors: isIndoorsState,
    initializeAudio,
    setMasterVolume,
    setChannelVolume,
    toggleMute,
    syncWeather,
    processNarrative,
    playUISound,
    setIndoors,
    setLocation,
    getAcoustics,
    stopAll
  };
}
