// Audio System Hook - Manages audio initialization and state
import { useState, useEffect, useCallback } from 'react';
import { audioEngine, AudioEngineState, AudioVolumes, AudioChannel } from '@/game/audioEngine';
import { weatherSoundManager } from '@/game/weatherSoundManager';
import { storySoundTrigger } from '@/game/storySoundTrigger';
import { WeatherState } from '@/game/weatherSystem';

interface UseAudioSystemReturn {
  initialized: boolean;
  muted: boolean;
  volumes: AudioVolumes;
  initializeAudio: () => Promise<void>;
  setMasterVolume: (volume: number) => void;
  setChannelVolume: (channel: AudioChannel, volume: number) => void;
  toggleMute: () => void;
  syncWeather: (weatherState: WeatherState, timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk') => void;
  processNarrative: (text: string) => string[];
  playUISound: (sound: 'click' | 'notification' | 'success' | 'error' | 'level_up' | 'item_acquired') => void;
  setIndoors: (isIndoors: boolean) => void;
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

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((newState) => {
      setState(newState);
    });

    // Set initial state
    setState(audioEngine.getState());

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

  // Narrative processing
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

  // Indoor/outdoor
  const setIndoors = useCallback((isIndoors: boolean) => {
    if (state.initialized) {
      weatherSoundManager.setIndoors(isIndoors);
    }
  }, [state.initialized]);

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
    initializeAudio,
    setMasterVolume,
    setChannelVolume,
    toggleMute,
    syncWeather,
    processNarrative,
    playUISound,
    setIndoors,
    stopAll
  };
}
