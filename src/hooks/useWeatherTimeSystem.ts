import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  WeatherState, 
  createInitialWeatherState,
} from '@/game/weatherSystem';
import {
  GameTimeState,
  createInitialTimeState,
} from '@/game/timeProgressionSystem';
import { useCampaignOptional } from '@/contexts/CampaignContext';

interface UseWeatherTimeSystemOptions {
  initialWeather?: WeatherState;
  initialTime?: GameTimeState;
  isPlaying: boolean;
}

interface WeatherTimeSystemReturn {
  weatherState: WeatherState;
  setWeatherState: React.Dispatch<React.SetStateAction<WeatherState>>;
  timeState: GameTimeState;
  setTimeState: React.Dispatch<React.SetStateAction<GameTimeState>>;
}

/**
 * Custom hook to manage weather and time state with campaign synchronization.
 * Extracted from AdventureGame.tsx for better maintainability.
 */
export function useWeatherTimeSystem({
  initialWeather,
  initialTime,
  isPlaying,
}: UseWeatherTimeSystemOptions): WeatherTimeSystemReturn {
  const campaignContext = useCampaignOptional();

  // Weather state - synced from campaign or create fresh
  const [weatherState, setWeatherState] = useState<WeatherState>(() => {
    if (initialWeather) return initialWeather;
    if (campaignContext?.activeCampaign?.weatherState) {
      return campaignContext.activeCampaign.weatherState;
    }
    return createInitialWeatherState();
  });

  // Time state - synced from campaign or create fresh
  const [timeState, setTimeState] = useState<GameTimeState>(() => {
    if (initialTime) return initialTime;
    if (campaignContext?.activeCampaign?.timeState) {
      return campaignContext.activeCampaign.timeState;
    }
    return createInitialTimeState();
  });

  // Track synced weather hash to prevent unnecessary updates
  const lastSyncedWeatherRef = useRef<string>('');
  
  // CRITICAL: Sync weather state to campaign when weather changes
  useEffect(() => {
    if (!isPlaying || !campaignContext?.updateCampaign) return;

    const weatherHash = JSON.stringify({
      current: weatherState.current,
      ticksRemaining: weatherState.ticksRemaining,
      intensity: weatherState.intensity,
    });

    if (weatherHash !== lastSyncedWeatherRef.current) {
      lastSyncedWeatherRef.current = weatherHash;
      campaignContext.updateCampaign({ weatherState });
      console.log(`[Weather Sync] Synced weather to campaign - ${weatherState.current} (${weatherState.ticksRemaining} ticks remaining)`);
    }
  }, [isPlaying, weatherState, campaignContext]);

  // Track synced time hash to prevent unnecessary updates
  const lastSyncedTimeRef = useRef<string>('');

  // CRITICAL: Sync time state to campaign when time changes
  useEffect(() => {
    if (!isPlaying || !campaignContext?.updateCampaign) return;

    const timeHash = JSON.stringify({
      totalMinutes: timeState.totalMinutes,
      multiplier: timeState.multiplier,
    });

    if (timeHash !== lastSyncedTimeRef.current) {
      lastSyncedTimeRef.current = timeHash;
      campaignContext.updateCampaign({ timeState });
      console.log(`[Time Sync] Synced time to campaign - Day ${timeState.day}, ${timeState.hour}:${timeState.minute.toString().padStart(2, '0')}`);
    }
  }, [isPlaying, timeState, campaignContext]);

  // Restore weather/time from campaign when campaign changes
  useEffect(() => {
    if (!campaignContext?.activeCampaign) return;

    if (campaignContext.activeCampaign.weatherState) {
      setWeatherState(campaignContext.activeCampaign.weatherState);
    }
    if (campaignContext.activeCampaign.timeState) {
      setTimeState(campaignContext.activeCampaign.timeState);
    }
  }, [campaignContext?.activeCampaign?.id]);

  return {
    weatherState,
    setWeatherState,
    timeState,
    setTimeState,
  };
}
