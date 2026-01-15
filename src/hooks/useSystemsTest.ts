/**
 * useSystemsTest Hook
 * Provides functionality to run systems integration tests
 * that inject specific game states and trigger AI narration
 */

import { useCallback } from 'react';
import { TestConfig, TestScenario } from '@/components/adventure/SystemsTestPanel';
import { WeatherType } from '@/game/weatherSystem';
import { CoreMoodType } from '@/game/moodSystem';
import { toast } from 'sonner';

interface UseSystemsTestProps {
  onSubmitAction: (action: string, options?: {
    forceWeather?: WeatherType;
    forceMood?: CoreMoodType;
    forceTime?: { hour: number };
    forcePlayerState?: {
      armorType?: string;
      woundLevel?: string;
      exhaustionLevel?: string;
    };
  }) => Promise<void>;
  setWeather?: (weather: WeatherType) => void;
  setMood?: (mood: CoreMoodType) => void;
  setTime?: (hour: number) => void;
  isLoading?: boolean;
}

// Map test config values to game system values
const WEATHER_MAP: Record<string, WeatherType> = {
  'clear': 'clear',
  'rain': 'rain',
  'storm': 'storm',
  'snow': 'snow',
  'fog': 'fog'
};

const MOOD_MAP: Record<string, CoreMoodType> = {
  'neutral': 'neutral',
  'fearful': 'fearful',
  'angry': 'mad',
  'hopeful': 'happy',
  'melancholic': 'sad'
};

const TIME_MAP: Record<string, number> = {
  'dawn': 6,
  'morning': 9,
  'afternoon': 14,
  'evening': 18,
  'night': 22
};

export function useSystemsTest({
  onSubmitAction,
  setWeather,
  setMood,
  setTime,
  isLoading
}: UseSystemsTestProps) {
  
  const runTest = useCallback(async (testConfig: TestConfig, scenario: TestScenario) => {
    // Apply weather if setter available
    if (setWeather && testConfig.weatherType !== 'clear') {
      const weatherType = WEATHER_MAP[testConfig.weatherType] || 'clear';
      setWeather(weatherType);
      console.log('[SystemsTest] Set weather to:', weatherType);
    }
    
    // Apply mood if setter available
    if (setMood && testConfig.moodType !== 'neutral') {
      const moodType = MOOD_MAP[testConfig.moodType] || 'neutral';
      setMood(moodType);
      console.log('[SystemsTest] Set mood to:', moodType);
    }
    
    // Apply time if setter available
    if (setTime) {
      const hour = TIME_MAP[testConfig.timeOfDay] || 14;
      setTime(hour);
      console.log('[SystemsTest] Set time to:', hour);
    }
    
    // Build enhanced prompt with system context hints
    let enhancedPrompt = scenario.testPrompt;
    
    // Add context hints for systems the AI should reference
    const contextHints: string[] = [];
    
    if (testConfig.armorType !== 'none') {
      contextHints.push(`[CONTEXT: Player is wearing ${testConfig.armorType} armor]`);
    }
    
    if (testConfig.woundLevel !== 'none') {
      contextHints.push(`[CONTEXT: Player has ${testConfig.woundLevel} wounds visible]`);
    }
    
    if (testConfig.exhaustionLevel !== 'fresh') {
      contextHints.push(`[CONTEXT: Player is ${testConfig.exhaustionLevel}]`);
    }
    
    // Prepend context to prompt (these will be processed by the AI)
    if (contextHints.length > 0) {
      enhancedPrompt = `${contextHints.join(' ')} ${enhancedPrompt}`;
    }
    
    console.log('[SystemsTest] Running test with prompt:', enhancedPrompt);
    console.log('[SystemsTest] Config:', testConfig);
    console.log('[SystemsTest] Scenario:', scenario.name);
    
    toast.info('Running systems test...', {
      description: scenario.name
    });
    
    // Submit the action to trigger AI narration
    await onSubmitAction(enhancedPrompt, {
      forceWeather: WEATHER_MAP[testConfig.weatherType],
      forceMood: MOOD_MAP[testConfig.moodType],
      forceTime: { hour: TIME_MAP[testConfig.timeOfDay] },
      forcePlayerState: {
        armorType: testConfig.armorType,
        woundLevel: testConfig.woundLevel,
        exhaustionLevel: testConfig.exhaustionLevel
      }
    });
    
  }, [onSubmitAction, setWeather, setMood, setTime]);
  
  return {
    runTest,
    isLoading
  };
}

export default useSystemsTest;
