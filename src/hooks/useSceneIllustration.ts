import { useState, useCallback, useRef } from 'react';
import { shouldIllustrateScene, SceneTrigger } from '@/components/game/SceneIllustration';
import { CharacterVisualProfile } from '@/lib/characterConsistentIllustration';
import { WeatherState } from '@/game/weatherSystem';
import { GameTimeState, getTimeOfDay as getGameTimeOfDay } from '@/game/timeProgressionSystem';
import { GameGenre } from '@/types/genreData';
import { StoryEntry } from '@/components/adventure/types';
import { revokeDisplayImageUrl, toDisplayImageUrl } from '@/lib/sceneImageUrl';
import { resolveSceneCast, type CompanionLike } from '@/lib/sceneCast';
import { companionSystem } from '@/game/companionSystem';
import {
  collectReferenceImages,
  referenceVersion,
  getVisualProfile,
  getVisualProfileV2,
  saveVisualProfileV2,
  migrateVisualProfiles,
  upsertVisualProfile,
} from '@/lib/visualProfileStore';
import { buildVisualProfile, buildNpcVisualProfile } from '@/lib/visualProfileBuilder';
import { buildCharacterPromptBlock } from '@/lib/visualProfilePrompt';
import { validateIllustration, buildStrictDirective } from '@/lib/visualProfileValidation';
import type { VisualProfileV2 } from '@/types/visualProfile';

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
  /** Illustrations attach only to this campaign. */
  campaignId?: string | null;
  /** Current scene identity, so an image can't land on the wrong beat. */
  sceneId?: string | null;
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
  campaignId,
  sceneId,
}: UseSceneIllustrationOptions): SceneIllustrationReturn {
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [generatingImageFor, setGeneratingImageFor] = useState<string | undefined>();
  const lastIllustrationTick = useRef<number>(0);
  const turnsSinceIllustration = useRef<number>(Number.MAX_SAFE_INTEGER);
  const displayUrlRef = useRef<string | null>(null);
  // Monotonic job counter. A slow illustration that resolves after a newer one
  // was started is dropped instead of attaching itself to the newer turn.
  const jobSeqRef = useRef<number>(0);

  const adoptDisplayUrl = useCallback((raw: string | null) => {
    const next = raw ? toDisplayImageUrl(raw) : null;
    if (displayUrlRef.current && displayUrlRef.current !== next) {
      revokeDisplayImageUrl(displayUrlRef.current);
    }
    displayUrlRef.current = next;
    setSceneImageUrl(next);
  }, []);

  const generateSceneIllustration = useCallback(async (description: string, trigger: SceneTrigger) => {
    if (isGeneratingScene) return;

    // Claim the cooldown up front. Booking it on success only meant a run of
    // failures could re-fire on every single turn.
    lastIllustrationTick.current = Date.now();
    turnsSinceIllustration.current = 0;

    const jobId = ++jobSeqRef.current;
    const jobCampaignId = campaignId || 'local';
    const jobSceneId = sceneId || trigger.location || 'scene';
    const jobTurnId = `${story.length}_${Date.now()}`;

    setIsGeneratingScene(true);
    console.log('[SceneIllustration] Starting generation for trigger:', trigger.type, { jobId, jobTurnId });
    
    try {
      // Get recent story entries for context (last 10 for better understanding)
      const recentStory = story.slice(-10);
      const lastNarratorMessage = recentStory.filter(e => e.role === 'narrator').slice(-1)[0]?.content || description;
      const lastPlayerAction = recentStory.filter(e => e.role === 'user').slice(-1)[0]?.content || '';
      const messageHistory = recentStory.slice(0, -2).map(e => ({
        role: e.role as 'narrator' | 'user' | 'system',
        content: e.content,
      }));

      // Who is actually in this moment? Illustrations were inventing genders
      // (a male protagonist for a female player, etc.) because the image prompt
      // only ever saw the player's profile and never the party.
      let activeCompanions: CompanionLike[] = [];
      try {
        activeCompanions = (companionSystem.getActiveCompanions() || []) as unknown as CompanionLike[];
      } catch {
        activeCompanions = [];
      }
      const sceneCast = resolveSceneCast({
        playerName: characterVisualProfile?.name,
        playerGender: characterVisualProfile?.gender,
        playerAppearance: characterVisualProfile?.fullVisualDescription,
        companions: activeCompanions,
        narratorText: lastNarratorMessage,
        recentText: recentStory.map(e => e.content),
      });

      // Keep the persistent Visual Profiles current before we read them back.
      if (characterVisualProfile?.name) {
        upsertVisualProfile(jobCampaignId, {
          id: characterVisualProfile.name,
          name: characterVisualProfile.name,
          canonicalPortraitUrl: characterVisualProfile.portraitUrl,
          permanentDescription: characterVisualProfile.fullVisualDescription,
          lockedTraits: [
            characterVisualProfile.gender,
            characterVisualProfile.physicalDescription?.build,
            characterVisualProfile.physicalDescription?.height,
            characterVisualProfile.physicalDescription?.skinTone,
            characterVisualProfile.hair?.color && `${characterVisualProfile.hair.color} hair`,
            characterVisualProfile.eyes?.color && `${characterVisualProfile.eyes.color} eyes`,
            characterVisualProfile.facialFeatures?.scars,
            characterVisualProfile.facialFeatures?.tattoos,
          ].filter(Boolean) as string[],
          currentClothing: characterVisualProfile.currentOutfit,
          currentEquipment: characterVisualProfile.currentEquipment,
        });
      }
      for (const companion of activeCompanions) {
        const c = companion as unknown as { id?: string; name?: string; portraitUrl?: string; appearance?: string };
        if (!c?.name) continue;
        upsertVisualProfile(jobCampaignId, {
          id: c.name,
          name: c.name,
          canonicalPortraitUrl: c.portraitUrl,
          permanentDescription: c.appearance || '',
        });
      }

      // ---- Structured Visual Profiles (v2) -------------------------------
      // Old saves get promoted first, then the player and every active
      // companion are guaranteed a structured profile so the prompt is built
      // from exact stored values instead of loose flavour text.
      migrateVisualProfiles(jobCampaignId);

      const structuredProfiles: VisualProfileV2[] = [];

      if (characterVisualProfile?.name) {
        const prev = getVisualProfileV2(jobCampaignId, characterVisualProfile.name);
        const player = prev ?? buildVisualProfile(
          {
            gender: characterVisualProfile.gender,
            age: characterVisualProfile.age,
            build: characterVisualProfile.physicalDescription?.build,
            height: characterVisualProfile.physicalDescription?.height,
            skinTone: characterVisualProfile.physicalDescription?.skinTone,
            faceShape: characterVisualProfile.physicalDescription?.faceShape,
            hairColor: characterVisualProfile.hair?.color,
            hairStyle: characterVisualProfile.hair?.style,
            hairLength: characterVisualProfile.hair?.length,
            eyeColor: characterVisualProfile.eyes?.color,
            scars: characterVisualProfile.facialFeatures?.scars ? [characterVisualProfile.facialFeatures.scars] : [],
            tattoos: characterVisualProfile.facialFeatures?.tattoos ? [characterVisualProfile.facialFeatures.tattoos] : [],
            piercings: characterVisualProfile.facialFeatures?.piercings ? [characterVisualProfile.facialFeatures.piercings] : [],
            currentOutfit: characterVisualProfile.currentOutfit,
            customDescription: characterVisualProfile.fullVisualDescription,
          },
          {
            characterId: characterVisualProfile.name,
            name: characterVisualProfile.name,
            isPlayer: true,
            matureContentAllowed: true,
          }
        );
        if (!prev) saveVisualProfileV2(jobCampaignId, player);
        structuredProfiles.push(player);
      }

      for (const companion of activeCompanions) {
        const c = companion as unknown as { id?: string; name?: string; gender?: string; appearance?: string };
        if (!c?.name) continue;
        const prev = getVisualProfileV2(jobCampaignId, c.name);
        const npc = prev ?? buildNpcVisualProfile({
          id: c.name,
          name: c.name,
          gender: c.gender,
          appearance: { customDescription: c.appearance },
        });
        if (!prev) saveVisualProfileV2(jobCampaignId, npc);
        structuredProfiles.push(npc);
      }

      // Structured, field-ordered character sheets — the identity contract the
      // image model must honour (exact chest scalar included).
      const characterSheets = structuredProfiles
        .map(p => buildCharacterPromptBlock(p, {
          emotion: trigger.type,
          location: trigger.location || undefined,
        }))
        .join('\n\n')
        .slice(0, 2400);

      // Approved references always beat text: never redraw an established
      // character from description when we hold a canonical portrait.
      const castIds = sceneCast.map(c => c.name);
      const referenceImages = collectReferenceImages(jobCampaignId, [
        characterVisualProfile?.name,
        ...castIds,
      ]);
      const profileVersion = referenceVersion(jobCampaignId, [
        characterVisualProfile?.name,
        ...castIds,
      ]);
      const playerProfile = characterVisualProfile?.name
        ? getVisualProfile(jobCampaignId, characterVisualProfile.name)
        : null;

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

      // One attempt = one image request. Validation may ask for exactly one
      // stricter retry; the canonical references are never overwritten by a
      // failed attempt.
      const requestImage = async (strictDirective: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
        try {
          return await fetch(
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
            cast: sceneCast,
            playerGender: characterVisualProfile?.gender,
            genre: genre || worldBible?.primaryGenre || 'fantasy',
            era: worldBible?.warEra || worldBible?.techTier || undefined,
            currentLocation: trigger.location || undefined,
            timeOfDay: timeOfDayPeriod,
            weather: weatherState?.current || undefined,
            worldLore,
            bannedElements: worldBible?.bannedElements?.slice(0, 16) || undefined,
            campaignId: jobCampaignId,
            sceneId: jobSceneId,
            turnId: jobTurnId,
            referenceImages,
            visualProfileVersion: profileVersion,
            clothing: playerProfile?.currentClothing || characterVisualProfile?.currentOutfit,
            equipment: playerProfile?.currentEquipment || characterVisualProfile?.currentEquipment,
            injuries: playerProfile?.currentInjuries,
            emotion: trigger.type,
            camera: trigger.priority <= 1 ? 'dynamic close action shot' : 'cinematic establishing shot',
            characterSheets: characterSheets || undefined,
            strictIdentity: strictDirective || undefined,
          }),
            }
          );
        } finally {
          clearTimeout(timeoutId);
        }
      };

      let data: { imageUrl?: string; error?: string; turnId?: string } | null = null;
      let strictDirective = '';

      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await requestImage(strictDirective);

        if (!response.ok) {
          console.error('[SceneIllustration] Response not OK:', response.status);
          return;
        }

        const payload = await response.json();
        console.log('[SceneIllustration] Response:', {
          attempt,
          hasImageUrl: !!payload.imageUrl,
          imageUrlLen: typeof payload.imageUrl === 'string' ? payload.imageUrl.length : 0,
          error: payload.error,
        });

        // Late arrival from a superseded turn — discard it.
        if (jobId !== jobSeqRef.current) {
          console.log('[SceneIllustration] Stale job discarded', { jobId, latest: jobSeqRef.current });
          return;
        }
        if (payload.turnId && payload.turnId !== jobTurnId) {
          console.log('[SceneIllustration] Turn mismatch, image discarded');
          return;
        }

        const validation = validateIllustration(
          {
            imageUrl: payload.imageUrl || null,
            campaignId: jobCampaignId,
            sceneId: jobSceneId,
            turnId: jobTurnId,
            castIds: structuredProfiles.map(pr => pr.identity.characterId),
            profileVersion,
            attempt,
          },
          {
            campaignId: jobCampaignId,
            sceneId: jobSceneId,
            turnId: jobTurnId,
            profiles: structuredProfiles,
          }
        );

        if (validation.valid) {
          data = payload;
          break;
        }

        console.warn('[SceneIllustration] Validation failed:', validation.issues);
        if (attempt === 0 && validation.shouldRetry) {
          strictDirective =
            validation.strictRetryDirective || buildStrictDirective(structuredProfiles);
          continue;
        }
        // Keep the existing image rather than adopting a bad one.
        return;
      }

      if (data?.imageUrl) {
        const display = toDisplayImageUrl(data.imageUrl);
        if (display) {
          adoptDisplayUrl(data.imageUrl);
        } else {
          console.error('[SceneIllustration] Image payload invalid or truncated');
        }
      } else if (data?.error) {
        console.error('[SceneIllustration] Generation error:', data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[SceneIllustration] Request timed out after 60s');
      } else {
        console.error('[SceneIllustration] Failed to generate:', error);
      }
    } finally {
      if (jobId === jobSeqRef.current) setIsGeneratingScene(false);
    }
  }, [isGeneratingScene, genre, characterVisualProfile, story, weatherState, timeState, worldBible, adoptDisplayUrl, campaignId, sceneId]);

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
    adoptDisplayUrl(null);
  }, [adoptDisplayUrl]);

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
