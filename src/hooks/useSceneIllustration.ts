import { useState, useCallback, useRef } from 'react';
import { shouldIllustrateScene, SceneTrigger } from '@/components/game/SceneIllustration';
import { CharacterVisualProfile } from '@/lib/characterConsistentIllustration';
import { WeatherState } from '@/game/weatherSystem';
import { GameTimeState, getTimeOfDay as getGameTimeOfDay } from '@/game/timeProgressionSystem';
import { GameGenre } from '@/types/genreData';
import { StoryEntry } from '@/components/adventure/types';

interface UseSceneIllustrationOptions {
  genre: GameGenre;
  characterVisualProfile: CharacterVisualProfile | null;
  story: StoryEntry[];
  weatherState?: WeatherState;
  timeState?: GameTimeState;
  worldBible?: { warEra?: string; techTier?: string } | null;
  sceneIllustrationsEnabled: boolean;
}

interface SceneIllustrationReturn {
  sceneImageUrl: string | null;
  isGeneratingScene: boolean;
  generateSceneIllustration: (description: string, trigger: SceneTrigger) => Promise<void>;
  checkSceneTriggers: (eventType: string, content: string) => void;
  closeSceneImage: () => void;
  generatingImageFor: string | undefined;
  setGeneratingImageFor: React.Dispatch<React.SetStateAction<string | undefined>>;
}

/**
 * Custom hook to manage scene illustration generation.
 * Extracted from AdventureGame.tsx for better maintainability.
 */
export function useSceneIllustration({
  genre,
  characterVisualProfile,
  story,
  weatherState,
  timeState,
  worldBible,
  sceneIllustrationsEnabled,
}: UseSceneIllustrationOptions): SceneIllustrationReturn {
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [generatingImageFor, setGeneratingImageFor] = useState<string | undefined>();
  const lastIllustrationTick = useRef<number>(0);

  const generateSceneIllustration = useCallback(async (description: string, trigger: SceneTrigger) => {
    if (isGeneratingScene) return;

    setIsGeneratingScene(true);
    try {
      // Get recent story entries for context (last 10 for better understanding)
      const recentStory = story.slice(-10);
      const lastNarratorMessage = recentStory.filter(e => e.role === 'narrator').slice(-1)[0]?.content || description;
      const lastPlayerAction = recentStory.filter(e => e.role === 'user').slice(-1)[0]?.content || '';
      const messageHistory = recentStory.slice(0, -2).map(e => ({
        role: e.role as 'narrator' | 'user' | 'system',
        content: e.content,
      }));

      // Derive time-of-day string from hour
      const timeOfDayPeriod = timeState ? getGameTimeOfDay(timeState.hour) : undefined;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastNarratorMessage: lastNarratorMessage.slice(0, 800),
            lastUserAction: lastPlayerAction,
            messageHistory,
            characterProfile: characterVisualProfile,
            genre: genre || 'fantasy',
            era: worldBible?.warEra || worldBible?.techTier || undefined,
            currentLocation: trigger.location || undefined,
            timeOfDay: timeOfDayPeriod,
            weather: weatherState?.current || undefined,
          }),
        }
      );
      const data = await response.json();
      if (data.imageUrl) {
        setSceneImageUrl(data.imageUrl);
        lastIllustrationTick.current = Date.now();
      }
    } catch (error) {
      console.error('Failed to generate scene illustration:', error);
    } finally {
      setIsGeneratingScene(false);
    }
  }, [isGeneratingScene, genre, characterVisualProfile, story, weatherState, timeState, worldBible]);

  const checkSceneTriggers = useCallback((eventType: string, content: string) => {
    // Respect the scene illustrations setting
    if (!sceneIllustrationsEnabled) return;

    const trigger = shouldIllustrateScene(
      eventType,
      content,
      lastIllustrationTick.current,
      Date.now(),
      5 // 5 ticks minimum between illustrations
    );

    if (trigger) {
      generateSceneIllustration(content, trigger);
    }
  }, [generateSceneIllustration, sceneIllustrationsEnabled]);

  const closeSceneImage = useCallback(() => {
    setSceneImageUrl(null);
  }, []);

  return {
    sceneImageUrl,
    isGeneratingScene,
    generateSceneIllustration,
    checkSceneTriggers,
    closeSceneImage,
    generatingImageFor,
    setGeneratingImageFor,
  };
}
