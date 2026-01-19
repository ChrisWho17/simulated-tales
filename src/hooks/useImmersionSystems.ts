// ============================================================================
// IMMERSION SYSTEMS INTEGRATION HOOK
// Central hook that wires all immersion systems together:
// - Screen effects (time of day, mood, weather, shake)
// - Floating stat changes
// - Event-driven feedback
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus, GameBusEvent, RelationshipEvent, NeedEvent, ItemEvent, CombatEvent } from '@/game/eventBus';
import { useScreenEffectsOptional, type TimeOfDay, type MoodLevel } from '@/components/game/ScreenEffects';
import { StatChange } from '@/components/game/FloatingStatChange';
import { CoreMoodType } from '@/game/moodSystem';

// ============= TIME OF DAY CONVERSION =============

export function getTimeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  if (hour >= 20 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 2) return 'night';
  return 'midnight';
}

// ============= MOOD TO SCREEN MOOD CONVERSION =============

export function getMoodLevelFromHealth(healthPercent: number, inCombat: boolean): MoodLevel {
  if (inCombat) {
    if (healthPercent < 25) return 'critical';
    if (healthPercent < 50) return 'anxious';
    return 'tense';
  }
  if (healthPercent >= 70) return 'calm';
  if (healthPercent >= 40) return 'tense';
  if (healthPercent >= 20) return 'anxious';
  return 'critical';
}

// Map game mood to screen mood level
export function getMoodLevelFromGameMood(mood: CoreMoodType): MoodLevel {
  switch (mood) {
    case 'fearful':
    case 'depressed':
      return 'critical';
    case 'mad':
    case 'annoyed':
      return 'anxious';
    case 'suspicious':
    case 'sad':
      return 'tense';
    default:
      return 'calm';
  }
}

// ============= WEATHER OVERLAY MAPPING =============

export function getWeatherOverlay(weather: string | null): string | null {
  if (!weather) return null;
  const weatherLower = weather.toLowerCase();
  
  if (weatherLower.includes('rain') || weatherLower.includes('shower') || weatherLower.includes('drizzle')) return 'rain';
  if (weatherLower.includes('storm') || weatherLower.includes('thunder')) return 'storm';
  if (weatherLower.includes('snow') || weatherLower.includes('blizzard')) return 'snow';
  if (weatherLower.includes('fog') || weatherLower.includes('mist')) return 'fog';
  if (weatherLower.includes('heat') || weatherLower.includes('hot') || weatherLower.includes('scorching')) return 'hot';
  if (weatherLower.includes('cold') || weatherLower.includes('freez') || weatherLower.includes('chill')) return 'cold';
  
  return null;
}

// ============= AMBIENT ENTRY TYPE =============

export interface AmbientEntry {
  id: string;
  text: string;
  type: 'micro_event' | 'chatter' | 'world';
  category?: string;
  timestamp: number;
  involvedNPCs?: string[];
  containsHook?: boolean;
}

// ============= MAIN HOOK =============

interface UseImmersionSystemsOptions {
  gameHour?: number;
  playerHealthPercent?: number;
  playerMaxHealth?: number;
  weather?: string | null;
  inCombat?: boolean;
  gameMood?: CoreMoodType;
  enabled?: boolean;
}

interface ImmersionState {
  statChanges: StatChange[];
  ambientEntries: AmbientEntry[];
}

export function useImmersionSystems(options: UseImmersionSystemsOptions = {}) {
  const screenEffects = useScreenEffectsOptional();
  const { 
    gameHour, 
    playerHealthPercent = 100, 
    weather, 
    inCombat = false,
    gameMood = 'neutral',
    enabled = true
  } = options;

  // State for floating stat changes
  const [statChanges, setStatChanges] = useState<StatChange[]>([]);
  
  // State for ambient feed entries
  const [ambientEntries, setAmbientEntries] = useState<AmbientEntry[]>([]);
  
  // Ref to track last screen shake to prevent rapid duplicates
  const lastShakeTime = useRef<number>(0);

  // Add a stat change popup
  const addStatChange = useCallback((stat: string, value: number, icon?: string) => {
    const newChange: StatChange = {
      id: `${stat}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      stat,
      value,
      icon,
      timestamp: Date.now(),
    };
    setStatChanges(prev => [...prev, newChange]);
  }, []);

  // Remove a stat change
  const removeStatChange = useCallback((id: string) => {
    setStatChanges(prev => prev.filter(c => c.id !== id));
  }, []);

  // Add an ambient entry
  const addAmbientEntry = useCallback((entry: Omit<AmbientEntry, 'id' | 'timestamp'>) => {
    const newEntry: AmbientEntry = {
      ...entry,
      id: `ambient-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setAmbientEntries(prev => [...prev.slice(-9), newEntry]); // Keep max 10
  }, []);

  // Clear old ambient entries
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 45000; // 45 seconds
      setAmbientEntries(prev => prev.filter(e => e.timestamp > cutoff));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update time of day based on game hour
  useEffect(() => {
    if (!screenEffects || !enabled || gameHour === undefined) return;
    const timeOfDay = getTimeOfDayFromHour(gameHour);
    screenEffects.setTimeOfDay(timeOfDay);
  }, [screenEffects, gameHour, enabled]);

  // Update mood based on health and combat state
  useEffect(() => {
    if (!screenEffects || !enabled) return;
    // Combine health-based mood with game mood for intensity
    const healthMood = getMoodLevelFromHealth(playerHealthPercent, inCombat);
    const gameMoodLevel = getMoodLevelFromGameMood(gameMood);
    // Use the more intense of the two
    const moodPriority: MoodLevel[] = ['calm', 'tense', 'anxious', 'critical'];
    const finalMood = moodPriority.indexOf(healthMood) > moodPriority.indexOf(gameMoodLevel) 
      ? healthMood 
      : gameMoodLevel;
    screenEffects.setMood(finalMood);
  }, [screenEffects, playerHealthPercent, inCombat, gameMood, enabled]);

  // Update weather overlay
  useEffect(() => {
    if (!screenEffects || !enabled) return;
    const overlay = getWeatherOverlay(weather || null);
    screenEffects.setWeatherOverlay(overlay);
  }, [screenEffects, weather, enabled]);

  // Subscribe to game events for stat changes and screen effects
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = eventBus.subscribe('*', (event: GameBusEvent) => {
      const now = Date.now();

      switch (event.type) {
        // Combat events - screen shake and damage popups
        case 'DAMAGE_RECEIVED': {
          const data = (event as CombatEvent).data;
          if (data.targetEntity === 'player' && data.amount) {
            addStatChange('health', -data.amount, '💔');
            
            // Screen shake for player damage
            if (screenEffects && now - lastShakeTime.current > 200) {
              lastShakeTime.current = now;
              if (data.amount >= 20) {
                screenEffects.triggerShake('heavy', 400);
                screenEffects.flashScreen('rgba(220, 38, 38, 0.4)', 300);
              } else if (data.amount >= 10) {
                screenEffects.triggerShake('medium', 300);
                screenEffects.flashScreen('rgba(220, 38, 38, 0.3)', 200);
              } else {
                screenEffects.triggerShake('light', 200);
                screenEffects.flashScreen('rgba(220, 38, 38, 0.2)', 150);
              }
            }
          }
          break;
        }
        
        case 'DAMAGE_DEALT': {
          const data = (event as CombatEvent).data;
          if (data.sourceEntity === 'player' && screenEffects && now - lastShakeTime.current > 150) {
            lastShakeTime.current = now;
            if ((data.amount || 0) >= 20) {
              screenEffects.triggerShake('medium', 250);
              screenEffects.flashScreen('rgba(251, 146, 60, 0.3)', 150);
            } else {
              screenEffects.triggerShake('light', 150);
            }
          }
          break;
        }

        case 'KNOCKOUT':
        case 'DEATH': {
          const data = (event as CombatEvent).data;
          if (screenEffects) {
            if (data.targetEntity === 'player') {
              screenEffects.triggerShake('heavy', 600);
              screenEffects.flashScreen('rgba(0, 0, 0, 0.6)', 500);
            } else {
              screenEffects.triggerShake('medium', 300);
              screenEffects.flashScreen('rgba(251, 191, 36, 0.4)', 200);
            }
          }
          break;
        }

        case 'COMBAT_WON': {
          if (screenEffects) {
            screenEffects.flashScreen('rgba(34, 197, 94, 0.3)', 400);
          }
          addStatChange('victory', 1, '🏆');
          break;
        }

        // Item events
        case 'ITEM_PICKED_UP':
        case 'ITEM_TRANSFERRED': {
          const data = (event as ItemEvent).data;
          if (data.toEntity === 'player') {
            // Check for gold/currency in item name
            const name = data.itemName.toLowerCase();
            if (name.includes('gold') || name.includes('coin') || name.includes('credit')) {
              const amount = parseInt(name.match(/\d+/)?.[0] || '1');
              addStatChange('gold', amount, '💰');
            } else {
              addStatChange('item', 1, '📦');
            }
          }
          break;
        }

        // Relationship events
        case 'RELATIONSHIP_CHANGED':
        case 'TRUST_CHANGED':
        case 'RESPECT_CHANGED': {
          const data = (event as RelationshipEvent).data;
          if (data.delta && Math.abs(data.delta) >= 5) {
            const icon = data.delta > 0 ? '💚' : '💔';
            addStatChange('trust', data.delta, icon);
          }
          break;
        }

        // Need events
        case 'NEED_CRITICAL': {
          const data = (event as NeedEvent).data;
          addAmbientEntry({
            text: `Your ${data.need} is critically low...`,
            type: 'world',
            category: 'warning',
          });
          break;
        }

        // Reputation events
        case 'REPUTATION_CHANGED': {
          const data = (event as any).data;
          const delta = data.newValue - data.previousValue;
          if (Math.abs(delta) >= 5) {
            addStatChange('reputation', delta, '⭐');
          }
          break;
        }
      }
    });

    return unsubscribe;
  }, [screenEffects, addStatChange, addAmbientEntry, enabled]);

  // Manual trigger functions for non-event-based effects
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

  const triggerVictory = useCallback(() => {
    if (!screenEffects) return;
    screenEffects.flashScreen('rgba(34, 197, 94, 0.4)', 400);
  }, [screenEffects]);

  const triggerDefeat = useCallback(() => {
    if (!screenEffects) return;
    screenEffects.triggerShake('heavy', 500);
    screenEffects.flashScreen('rgba(0, 0, 0, 0.5)', 400);
  }, [screenEffects]);

  const triggerLevelUp = useCallback(() => {
    if (!screenEffects) return;
    screenEffects.flashScreen('rgba(139, 92, 246, 0.5)', 500);
    addStatChange('level', 1, '⬆️');
  }, [screenEffects, addStatChange]);

  const triggerXPGain = useCallback((amount: number) => {
    addStatChange('xp', amount, '✨');
  }, [addStatChange]);

  const triggerGoldChange = useCallback((amount: number) => {
    addStatChange('gold', amount, '💰');
  }, [addStatChange]);

  const triggerHealthChange = useCallback((amount: number) => {
    addStatChange('health', amount, amount > 0 ? '💚' : '💔');
    if (amount < 0 && screenEffects) {
      screenEffects.flashScreen('rgba(220, 38, 38, 0.2)', 150);
    }
  }, [addStatChange, screenEffects]);

  return {
    // State
    statChanges,
    ambientEntries,
    
    // Stat change management
    addStatChange,
    removeStatChange,
    
    // Ambient entry management
    addAmbientEntry,
    
    // Manual triggers
    triggerCombatHit,
    triggerVictory,
    triggerDefeat,
    triggerLevelUp,
    triggerXPGain,
    triggerGoldChange,
    triggerHealthChange,
    
    // Availability
    isAvailable: !!screenEffects,
  };
}

export default useImmersionSystems;
