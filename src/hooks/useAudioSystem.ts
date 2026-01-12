// Audio System Hook - Simplified to weather-only ambient sounds
import { useState, useEffect, useCallback } from 'react';
import { audioEngine, AudioEngineState, AudioVolumes } from '@/game/audioEngine';
import { weatherSoundManager } from '@/game/weatherSoundManager';
import { WeatherType } from '@/game/weatherSystem';

// Simple weather state interface
interface SimpleWeatherState {
  current: WeatherType;
  intensity: number | 'light' | 'moderate' | 'heavy';
}

interface UseAudioSystemReturn {
  initialized: boolean;
  muted: boolean;
  unlocked: boolean;
  weatherVolume: number;
  initializeAudio: () => Promise<void>;
  setWeatherVolume: (volume: number) => void;
  toggleMute: () => void;
  syncWeather: (weatherState: SimpleWeatherState, timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk') => void;
  setIndoors: (isIndoors: boolean) => void;
  stopAll: () => void;
}

export function useAudioSystem(): UseAudioSystemReturn {
  const [state, setState] = useState<AudioEngineState>({
    initialized: false,
    muted: false,
    unlocked: false,
    volumes: {
      master: 0.5,
      ambience: 0.25,
      effects: 0,
      music: 0,
      ui: 0,
      weather: 0.25,
      voice: 0,
      dramatic: 0
    }
  });

  const [weatherVolume, setWeatherVolumeState] = useState(0.25);

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((newState) => {
      setState(newState);
    });
    setState(audioEngine.getState());
    return unsubscribe;
  }, []);

  // Initialize audio on first user interaction
  const initializeAudio = useCallback(async () => {
    await audioEngine.ensureContext();
    // Set low volumes for weather-only mode
    audioEngine.setMasterVolume(0.5);
    audioEngine.setChannelVolume('weather', 0.25);
    audioEngine.setChannelVolume('ambience', 0.25);
    // Disable all other channels
    audioEngine.setChannelVolume('effects', 0);
    audioEngine.setChannelVolume('music', 0);
    audioEngine.setChannelVolume('ui', 0);
    audioEngine.setChannelVolume('voice', 0);
    audioEngine.setChannelVolume('dramatic', 0);
    setState(audioEngine.getState());
    console.log('[AudioSystem] Initialized - weather-only mode');
  }, []);

  // Weather volume control
  const setWeatherVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioEngine.setChannelVolume('weather', clampedVolume);
    audioEngine.setChannelVolume('ambience', clampedVolume);
    setWeatherVolumeState(clampedVolume);
  }, []);

  const toggleMute = useCallback(() => {
    audioEngine.toggleMute();
  }, []);

  // Weather sync - the only sound that plays
  const syncWeather = useCallback((
    weatherState: SimpleWeatherState,
    timeOfDay: 'day' | 'night' | 'dawn' | 'dusk' = 'day'
  ) => {
    if (state.initialized && !state.muted) {
      const intensity = typeof weatherState.intensity === 'string' 
        ? { light: 0.3, moderate: 0.5, heavy: 0.8 }[weatherState.intensity] || 0.5
        : weatherState.intensity;
      
      weatherSoundManager.syncWithWeatherState(
        { current: weatherState.current, intensity } as any,
        timeOfDay
      );
    }
  }, [state.initialized, state.muted]);

  // Indoor/outdoor for weather attenuation
  const setIndoors = useCallback((isIndoors: boolean) => {
    if (state.initialized) {
      weatherSoundManager.setIndoors(isIndoors);
    }
  }, [state.initialized]);

  // Stop all sounds
  const stopAll = useCallback(() => {
    audioEngine.stopAll();
    weatherSoundManager.stop();
  }, []);

  return {
    initialized: state.initialized,
    muted: state.muted,
    unlocked: state.unlocked,
    weatherVolume,
    initializeAudio,
    setWeatherVolume,
    toggleMute,
    syncWeather,
    setIndoors,
    stopAll
  };
}
