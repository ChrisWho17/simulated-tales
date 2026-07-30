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
  worldBible?: {
    warEra?: string;
    techTier?: string;
    magicRule?: string;
    primaryGenre?: string;
    contractSummary?: string;
    bannedElements?: string[];
    campaignName?: string;
  } | null;
  sceneIllustrationsEnabled: boolean;
}

/**
 * Illustration pacing. The previous throttle passed `5` as "ticks" while
 * comparing two `Date.now()` values, so the gate opened 5ms after the last
 * image and effectively every eligible turn produced one.
 */
const URGENT_COOLDOWN_MS = 45_000;
const ROUTINE_COOLDOWN_MS = 3 * 60_000;
const MIN_TURNS_BETWEEN = 3;

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
  const turnsSinceIllustration = useRef<number>(Number.MAX_SAFE_INTEGER);

  const generateSceneIllustration = useCallback(async (description: string, trigger: SceneTrigger) => {
    if (isGeneratingScene) return;

    // Claim the cooldown up front. Booking it on success only meant a run of
    // failures could re-fire on every single turn.
    lastIllustrationTick.current = Date.now();
    turnsSinceIllustration.current = 0;

    setIsGeneratingScene(true);
    console.log('[SceneIllustration] Starting generation for trigger:', trigger.type);
    
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

      // Compact lore contract so imagery respects world bible, not generic genre stock
      const worldLore = worldBible
        ? [
            worldBible.campaignName ? `World: ${worldBible.campaignName}` : null,
            worldBible.primaryGenre ? `Primary genre: ${worldBible.primaryGenre}` : null,
            worldBible.techTier ? `Tech tier: ${worldBible.techTier}` : null,
            worldBible.magicRule ? `Magic: ${worldBible.magicRule}` : null,
            worldBible.warEra ? `Era: ${worldBible.warEra}` : null,
            worldBible.bannedElements?.length
              ? `Banned visuals: ${worldBible.bannedElements.slice(0, 12).join(', ')}`
              : null,
            worldBible.contractSummary
              ? `Lore contract: ${worldBible.contractSummary.slice(0, 600)}`
              : null,
          ].filter(Boolean).join('\n')
        : undefined;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            lastNarratorMessage: lastNarratorMessage.slice(0, 800),
            lastUserAction: lastPlayerAction,
            messageHistory,
            characterProfile: characterVisualProfile,
            genre: genre || worldBible?.primaryGenre || 'fantasy',
            era: worldBible?.warEra || worldBible?.techTier || undefined,
            currentLocation: trigger.location || undefined,
            timeOfDay: timeOfDayPeriod,
            weather: weatherState?.current || undefined,
            worldLore,
            bannedElements: worldBible?.bannedElements?.slice(0, 16) || undefined,
          }),
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('[SceneIllustration] Response not OK:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('[SceneIllustration] Response:', { hasImageUrl: !!data.imageUrl, error: data.error });
      
      if (data.imageUrl) {
        setSceneImageUrl(data.imageUrl);
      } else if (data.error) {
        console.error('[SceneIllustration] Generation error:', data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[SceneIllustration] Request timed out after 60s');
      } else {
        console.error('[SceneIllustration] Failed to generate:', error);
      }
    } finally {
      setIsGeneratingScene(false);
    }
  }, [isGeneratingScene, genre, characterVisualProfile, story, weatherState, timeState, worldBible]);

  const checkSceneTriggers = useCallback((eventType: string, content: string) => {
    // Respect the scene illustrations setting
    if (!sceneIllustrationsEnabled) return;

    turnsSinceIllustration.current += 1;

    const trigger = shouldIllustrateScene(
      eventType,
      content,
      lastIllustrationTick.current,
      Date.now(),
      URGENT_COOLDOWN_MS
    );

    if (!trigger) return;

    // shouldIllustrateScene only enforces the short fuse, which is reserved for
    // high-priority beats (combat, dramatic turns). Everything else waits for
    // the full cooldown so ordinary turns stop generating an image apiece.
    const elapsed = Date.now() - lastIllustrationTick.current;
    const isUrgent = trigger.priority <= 1;
    if (!isUrgent && elapsed < ROUTINE_COOLDOWN_MS) return;
    if (turnsSinceIllustration.current < MIN_TURNS_BETWEEN) return;

    // Defer off the critical play path so narrative paint isn't hitching on image work
    const schedule =
      typeof requestIdleCallback !== 'undefined'
        ? (cb: () => void) => requestIdleCallback(() => cb(), { timeout: 1500 })
        : (cb: () => void) => setTimeout(cb, 250);
    schedule(() => generateSceneIllustration(content, trigger));
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
