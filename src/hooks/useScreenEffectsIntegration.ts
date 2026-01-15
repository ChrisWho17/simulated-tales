// Screen Effects Integration Hook
// Wires screen effects (shake, time-of-day, mood, weather) to game events

import { useEffect, useCallback } from 'react';
import { eventBus, CombatEvent } from '@/game/eventBus';
import { useScreenEffectsOptional, type TimeOfDay, type MoodLevel } from '@/components/game/ScreenEffects';

type WeatherType = string;

// Convert game hour (0-23) to time of day
function getTimeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  if (hour >= 20 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 2) return 'night';
  return 'midnight';
}

// Convert health percentage to mood level
function getMoodFromHealthPercent(healthPercent: number): MoodLevel {
  if (healthPercent >= 70) return 'calm';
  if (healthPercent >= 40) return 'tense';
  if (healthPercent >= 20) return 'anxious';
  return 'critical';
}

// Map weather string to overlay type
function getWeatherOverlay(weather: string | null): string | null {
  if (!weather) return null;
  const weatherLower = weather.toLowerCase();
  
  if (weatherLower.includes('rain') || weatherLower.includes('shower')) return 'rain';
  if (weatherLower.includes('storm') || weatherLower.includes('thunder')) return 'storm';
  if (weatherLower.includes('snow') || weatherLower.includes('blizzard')) return 'snow';
  if (weatherLower.includes('fog') || weatherLower.includes('mist')) return 'fog';
  if (weatherLower.includes('heat') || weatherLower.includes('hot') || weatherLower.includes('scorching')) return 'hot';
  if (weatherLower.includes('cold') || weatherLower.includes('freez') || weatherLower.includes('chill')) return 'cold';
  
  return null;
}

interface UseScreenEffectsIntegrationOptions {
  gameHour?: number;
  playerHealthPercent?: number;
  weather?: string | null;
  inCombat?: boolean;
}

export function useScreenEffectsIntegration(options: UseScreenEffectsIntegrationOptions = {}) {
  const screenEffects = useScreenEffectsOptional();
  const { gameHour, playerHealthPercent = 100, weather, inCombat } = options;

  // Update time of day based on game hour
  useEffect(() => {
    if (!screenEffects || gameHour === undefined) return;
    const timeOfDay = getTimeOfDayFromHour(gameHour);
    screenEffects.setTimeOfDay(timeOfDay);
  }, [screenEffects, gameHour]);

  // Update mood based on health
  useEffect(() => {
    if (!screenEffects) return;
    const mood = getMoodFromHealthPercent(playerHealthPercent);
    screenEffects.setMood(mood);
  }, [screenEffects, playerHealthPercent]);

  // Update weather overlay
  useEffect(() => {
    if (!screenEffects) return;
    const overlay = getWeatherOverlay(weather || null);
    screenEffects.setWeatherOverlay(overlay);
  }, [screenEffects, weather]);

  // Subscribe to combat events for screen shake
  useEffect(() => {
    if (!screenEffects) return;

    const unsubscribe = eventBus.subscribe(
      ['DAMAGE_RECEIVED', 'DAMAGE_DEALT', 'KNOCKOUT', 'DEATH'],
      (event) => {
        const combatEvent = event as CombatEvent;
        
        switch (combatEvent.type) {
          case 'DAMAGE_RECEIVED':
            // Player took damage - shake and flash red
            if (combatEvent.data.targetEntity === 'player') {
              const damage = combatEvent.data.amount || 10;
              if (damage >= 20) {
                screenEffects.triggerShake('heavy', 400);
                screenEffects.flashScreen('rgba(220, 38, 38, 0.4)', 300);
              } else if (damage >= 10) {
                screenEffects.triggerShake('medium', 300);
                screenEffects.flashScreen('rgba(220, 38, 38, 0.3)', 200);
              } else {
                screenEffects.triggerShake('light', 200);
                screenEffects.flashScreen('rgba(220, 38, 38, 0.2)', 150);
              }
            }
            break;
            
          case 'DAMAGE_DEALT':
            // Player dealt damage - light shake and flash
            if (combatEvent.data.sourceEntity === 'player') {
              const damage = combatEvent.data.amount || 10;
              if (damage >= 20) {
                screenEffects.triggerShake('medium', 250);
                screenEffects.flashScreen('rgba(251, 146, 60, 0.3)', 150);
              } else {
                screenEffects.triggerShake('light', 150);
              }
            }
            break;
            
          case 'KNOCKOUT':
            // Someone got knocked out
            if (combatEvent.data.targetEntity === 'player') {
              screenEffects.triggerShake('heavy', 500);
              screenEffects.flashScreen('rgba(0, 0, 0, 0.5)', 400);
            } else {
              screenEffects.triggerShake('medium', 300);
              screenEffects.flashScreen('rgba(251, 191, 36, 0.4)', 200);
            }
            break;
            
          case 'DEATH':
            // Someone died
            screenEffects.triggerShake('heavy', 600);
            if (combatEvent.data.targetEntity === 'player') {
              screenEffects.flashScreen('rgba(0, 0, 0, 0.6)', 500);
            } else {
              screenEffects.flashScreen('rgba(220, 38, 38, 0.5)', 300);
            }
            break;
        }
      }
    );

    return unsubscribe;
  }, [screenEffects]);

  // Manual trigger functions
  const triggerCombatHit = useCallback((damage: number, isCritical: boolean = false) => {
    if (!screenEffects) return;
    
    if (isCritical) {
      screenEffects.triggerShake('heavy', 400);
      screenEffects.flashScreen('rgba(251, 191, 36, 0.5)', 250);
    } else if (damage >= 15) {
      screenEffects.triggerShake('medium', 300);
      screenEffects.flashScreen('rgba(220, 38, 38, 0.3)', 200);
    } else {
      screenEffects.triggerShake('light', 200);
    }
  }, [screenEffects]);

  const triggerMiss = useCallback(() => {
    if (!screenEffects) return;
    screenEffects.flashScreen('rgba(100, 116, 139, 0.2)', 150);
  }, [screenEffects]);

  const triggerVictory = useCallback(() => {
    if (!screenEffects) return;
    screenEffects.flashScreen('rgba(34, 197, 94, 0.3)', 300);
  }, [screenEffects]);

  const triggerDefeat = useCallback(() => {
    if (!screenEffects) return;
    screenEffects.triggerShake('heavy', 500);
    screenEffects.flashScreen('rgba(0, 0, 0, 0.5)', 400);
  }, [screenEffects]);

  return {
    triggerCombatHit,
    triggerMiss,
    triggerVictory,
    triggerDefeat,
    isAvailable: !!screenEffects,
  };
}

export default useScreenEffectsIntegration;
