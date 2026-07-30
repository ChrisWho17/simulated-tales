/**
 * useNarrativeGeneration Hook
 * 
 * Handles AI narrative generation with retry logic, context building,
 * and fallback handling. Extracted from AdventureGame.tsx to reduce complexity.
 */

import { useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import { RPGCharacter } from '@/types/rpgCharacter';
import { sanitizeCharacterForAPI } from '@/lib/sanitizeCharacterForAPI';
import { GameGenre } from '@/types/genreData';
import { StoryEntry } from '@/components/adventure/types';
import { 
  validateGenerationState, 
  isEchoResponse, 
  cleanPlayerInputForPrompt, 
  getContextualFallback,
  logGenerationDebug,
  acquireGenerationLock,
  releaseGenerationLock,
} from '@/lib/narrativeGuard';
import { 
  detectMissingLootTags, 
  detectMissingDropTags, 
  detectMissingDamageTags, 
  detectMissingHealTags, 
  detectMissingGoldTags 
} from '@/lib/narrativeLootParser';

// Quality Systems Integration
import { 
  validateNarrativeQuality, 
  createSessionState, 
  updateSessionState, 
  generateAntiDriftDirectives,
  SessionState,
} from '@/lib/narrativeQualitySystem';
import { 
  compressConversationHistory, 
  checkForRepetition, 
  getLongSessionDirectives,
} from '@/lib/narrativeLeakagePrevention';
import { 
  getGenreWritingInstructions, 
  validateGenreCompliance,
  getGenreMicroEvents,
} from '@/lib/narrativeGenreEnforcement';
import { buildNarrativeRequestBody, NarrativeRequestSettings } from '@/lib/buildNarrativeRequestBody';
import {
  getNextReadyCompanion,
  buildCompanionIntroductionContext,
} from '@/game/companionTimingSystem';
import { postProcessLanguageInResponse, learnLanguage, getLanguageDisplayName, LanguageSystemState, buildLanguageContext } from '@/game/languageSystem';
import { ToneState, analyzePlayerTone, updateToneState, buildToneContext } from '@/game/toneSystem';
import { WEATHER_CONFIGS, WeatherState, getWeatherNarrativeContext, formatWeatherEffectsForAI } from '@/game/weatherSystem';
import { GameTimeState, buildTimeContext } from '@/game/timeProgressionSystem';
import { buildRegisteredNPCScheduleContext } from '@/game/npcScheduleSystem';
import { NPCGrudgeContext, buildSceneNPCContext } from '@/game/npcGrudgeSystem';
import { buildRumorContext, Rumor } from '@/game/unreliableInformationSystem';
import { buildConsequenceContext, buildWorldStateContext, WorldStateChanges } from '@/game/rippleEffectSystem';
import { buildClothingArmorContextForAI } from '@/game/clothingGameplayIntegration';
import { UNIVERSAL_NARRATIVE_RULES, GENRE_BIBLE, buildSpawnPacket, formatSpawnPacket } from '@/game/narrativeContract';
import { buildNPCIdentityContext, getAllRegisteredNPCs } from '@/game/npcIdentityRegistry';
import { buildPlayerCorrectionsContext } from '@/game/playerCorrectionSystem';
import { buildInventoryContextForAI } from '@/game/storyInventoryBridge';
import { InventoryState } from '@/game/inventorySystem';
import { buildMoveSyncContextForAI } from '@/game/moveSyncSystem';
import { getNPCPersonality } from '@/game/npcPersonalityDialogue';
import { getPersonalityById } from '@/game/npcPersonalityTemplates';
import { getAllNPCPersonalityContext } from '@/game/npcAutoRegistration';
import { PropertySystem, RivalSystem, FactionSystem, buildLivingWorldContext } from '@/game/livingWorld';
import { CoreMoodType, GENRE_MOOD_DESCRIPTORS } from '@/game/moodSystem';
import { DirectorSettings } from '@/game/directorModeSystem';
import { TimeOfDayPeriod } from '@/game/timeProgressionSystem';
import { GameMechanics } from '@/components/adventure/types';
import { WorldBible } from '@/game/worldBible/types';
import { PressureState, getPressureAtmosphere } from '@/game/pressureClockSystem';

// Type alias for ripple events - these are passed in but not defined here
interface RippleEvent {
  description: string;
  [key: string]: unknown;
}

// ============= TYPES =============

export interface NarrativeGenerationDependencies {
  // Core state
  character: RPGCharacter | null;
  scenarioSelection: { scenario: string; genre: GameGenre } | null;
  cheatMode: boolean;
  
  // Settings
  settings: NarrativeRequestSettings;
  diceMode: string;
  directorSettings: DirectorSettings | null;
  
  // Game context
  worldBible: WorldBible | null;
  campaignMemory: any;
  getCampaignContext: ((scope: string, entities: string[], tick: number) => any) | undefined;
  
  // Mood & Tone state
  currentMood: CoreMoodType;
  toneState: ToneState;
  setToneState: React.Dispatch<React.SetStateAction<ToneState>>;
  
  // Language state
  languageState: LanguageSystemState;
  setLanguageState: React.Dispatch<React.SetStateAction<LanguageSystemState>>;
  
  // World systems - using WorldStateChanges from rippleEffectSystem
  weatherState: WeatherState;
  timeState: GameTimeState;
  sceneNPCs: NPCGrudgeContext[];
  worldState: WorldStateChanges;
  narrativeQueue: string[]; // Array of consequence descriptions
  activeRumors: Rumor[];
  playerLocation: { zoneName: string; zoneType: string };
  activeConsequences: { description: string }[];
  
  // Pressure system
  pressureState: PressureState;
  getPressureContext: () => string;
  
  // NPC Motivation system
  getNPCMotivation: (npcId: string, npcName: string) => any;
  getNPCMotivationContext: () => string;
  
  // Memory Bite system
  getUnsurfacedBitesForNPC: () => any[];
  getBiteContext: (npcId: string) => string | null;
  getSurfaceNarrativeForBite: (bite: any) => string;
  
  // Inventory
  inventory: { state: InventoryState };
  
  // World Bible functions
  getEnhancedPromptWithContract: (prompt: string) => string;
  validateContent: (content: string) => { success: boolean; content: string; log?: string | string[] };
}

export interface NarrativeGenerationResult {
  isLoading: boolean;
  lastFailedAction: { action: string; diceRoll?: any; storySnapshot: StoryEntry[] } | null;
  pendingMechanics: GameMechanics | undefined;
  /**
   * Synchronously-readable ref to the latest mechanics. Use this instead of
   * `pendingMechanics` when you need to read mechanics immediately after
   * generateNarrative resolves (avoids React state-batching race condition
   * that previously caused inventory loss in the streaming path).
   */
  latestMechanicsRef: React.MutableRefObject<GameMechanics | undefined>;
  generateNarrative: (
    scenario: string,
    playerAction?: string,
    history?: StoryEntry[],
    diceRoll?: any,
    char?: RPGCharacter,
    skipLoadingState?: boolean
  ) => Promise<string | null>;
  /**
   * Build the same rich request body used by non-streaming generation.
   * Streaming should call this so director/mood/weather/memory/lore stay connected.
   */
  buildRequestBody: (
    scenario: string,
    playerAction: string | undefined,
    history: StoryEntry[],
    diceRoll: any,
    char: RPGCharacter,
    options?: {
      stream?: boolean;
      retryLevel?: number;
      extraDirectives?: string[];
      mutateTone?: boolean;
      pendingCompanionIntroduction?: unknown;
      pendingCompanionId?: string;
    }
  ) => Record<string, any> | null;
  /**
   * Seed the settings used by the very next generation. Needed when play starts
   * in the same tick that the pre-play settings are written.
   */
  applyPendingSettings: (pending: {
    settings?: Partial<NarrativeRequestSettings>;
    directorSettings?: DirectorSettings;
  }) => void;
  setLastFailedAction: React.Dispatch<React.SetStateAction<{ action: string; diceRoll?: any; storySnapshot: StoryEntry[] } | null>>;
  setPendingMechanics: React.Dispatch<React.SetStateAction<GameMechanics | undefined>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============= HELPERS =============

function formatEmotionalContext(
  mood: CoreMoodType,
  moodIntensity: number,
  genre: GameGenre
): { currentMood: string; moodIntensity: number; internalDescription: string; physicalDescription: string; dialogueTone: string; actionFlavor: string } | null {
  if (mood === 'neutral' && moodIntensity < 0.3) {
    return null;
  }
  
  const descriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[mood] || GENRE_MOOD_DESCRIPTORS.custom?.[mood] || GENRE_MOOD_DESCRIPTORS.fantasy[mood];
  if (!descriptor) return null;
  
  return {
    currentMood: descriptor.label,
    moodIntensity,
    internalDescription: descriptor.internalState[Math.floor(Math.random() * descriptor.internalState.length)],
    physicalDescription: descriptor.physicalSigns.join(', '),
    dialogueTone: descriptor.dialogueTone,
    actionFlavor: descriptor.actionFlavor
  };
}

function buildBackgroundNPCActionsContext(
  memContext: any,
  currentTick: number
): { actions: Array<{ description: string; involvedNPCs: string[]; location: string; hoursAgo: number }> } | undefined {
  const actions: Array<{ description: string; involvedNPCs: string[]; location: string; hoursAgo: number }> = [];
  
  if (memContext?.sceneNow) {
    for (const mem of memContext.sceneNow) {
      if (mem.type === 'event' && mem.provenance !== 'observed') {
        const hoursAgo = Math.max(0, Math.floor((currentTick - mem.timestamp?.worldTime) || 0));
        actions.push({
          description: mem.summary || mem.details || 'Something happened in the world',
          involvedNPCs: mem.entities?.filter((e: string) => e.startsWith('npc_')) || [],
          location: mem.location || 'unknown',
          hoursAgo,
        });
      }
    }
  }
  
  if (memContext?.relevantMtmEvents) {
    for (const mem of memContext.relevantMtmEvents.slice(0, 5)) {
      if (mem.type === 'event' && mem.provenance !== 'observed') {
        const hoursAgo = Math.max(0, Math.floor((currentTick - mem.timestamp?.worldTime) || 0));
        actions.push({
          description: mem.summary || mem.details || 'A past event',
          involvedNPCs: mem.entities?.filter((e: string) => e.startsWith('npc_')) || [],
          location: mem.location || 'unknown',
          hoursAgo,
        });
      }
    }
  }
  
  const uniqueActions = actions.filter((action, index, self) =>
    index === self.findIndex(a => a.description === action.description)
  ).slice(0, 10);
  
  return uniqueActions.length > 0 ? { actions: uniqueActions } : undefined;
}

function formatMemoryContextForAI(memContext: any, characterName: string): { fullContext?: string } {
  // Simplified - the actual implementation is in campaignMemorySystem
  if (!memContext) return {};
  return { fullContext: JSON.stringify(memContext).slice(0, 5000) };
}

function getGameTimeOfDay(hour: number): TimeOfDayPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 5) return 'night';
  return 'night';
}

// ============= MAIN HOOK =============

export function useNarrativeGeneration(deps: NarrativeGenerationDependencies): NarrativeGenerationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMechanics, setPendingMechanics] = useState<GameMechanics | undefined>();
  // Synchronous ref mirror of pendingMechanics — readable immediately after generation
  // (state setter is batched, ref is not). Fixes inventory race condition.
  const latestMechanicsRef = useRef<GameMechanics | undefined>(undefined);
  const [lastFailedAction, setLastFailedAction] = useState<{
    action: string;
    diceRoll?: any;
    storySnapshot: StoryEntry[];
  } | null>(null);
  
  // Quality system state
  const sessionStateRef = useRef<SessionState>(createSessionState());
  const sessionStartRef = useRef<number>(Date.now());
  
  const {
    character,
    scenarioSelection,
    cheatMode,
    settings,
    diceMode,
    directorSettings,
    worldBible,
    campaignMemory,
    getCampaignContext,
    currentMood,
    toneState,
    setToneState,
    languageState,
    setLanguageState,
    weatherState,
    timeState,
    sceneNPCs,
    worldState,
    narrativeQueue,
    activeRumors,
    playerLocation,
    activeConsequences,
    pressureState,
    getPressureContext,
    getNPCMotivation,
    getNPCMotivationContext,
    getUnsurfacedBitesForNPC,
    getBiteContext,
    getSurfaceNarrativeForBite,
    inventory,
    getEnhancedPromptWithContract,
    validateContent,
  } = deps;

  // The pre-play flow writes settings (director, adult content, depth toggles)
  // and starts the opening generation in the same tick, so a render closure
  // would still hold the previous values. Mirror them into refs and let
  // `applyPendingSettings` seed the refs before that first generation runs.
  const settingsRef = useRef<NarrativeRequestSettings>(settings);
  const directorSettingsRef = useRef<DirectorSettings | null>(directorSettings);
  settingsRef.current = settings;
  directorSettingsRef.current = directorSettings;

  const applyPendingSettings = useCallback((pending: {
    settings?: Partial<NarrativeRequestSettings>;
    directorSettings?: DirectorSettings;
  }) => {
    if (pending.settings) {
      settingsRef.current = { ...settingsRef.current, ...pending.settings };
    }
    if (pending.directorSettings) {
      directorSettingsRef.current = pending.directorSettings;
      settingsRef.current = { ...settingsRef.current, directorSettings: pending.directorSettings };
    }
  }, []);

  const buildRequestBody = useCallback((
    scenario: string,
    playerAction: string | undefined,
    history: StoryEntry[],
    diceRoll: any,
    char: RPGCharacter,
    options?: {
      stream?: boolean;
      retryLevel?: number;
      extraDirectives?: string[];
      mutateTone?: boolean;
      pendingCompanionIntroduction?: unknown;
      pendingCompanionId?: string;
    }
  ): Record<string, any> | null => {
    let companionIntro = options?.pendingCompanionIntroduction;
    let companionId = options?.pendingCompanionId;

    // Keep companion introductions connected on non-streaming too
    if (!companionIntro && !companionId) {
      const pendingCompanion = getNextReadyCompanion({
        turnNumber: campaignMemory?.campaign?.currentTick || 0,
        narrativeContext: history.slice(-1)[0]?.content,
      });
      if (pendingCompanion) {
        companionIntro = buildCompanionIntroductionContext(pendingCompanion);
        companionId = pendingCompanion.companionId;
      }
    }

    const result = buildNarrativeRequestBody({
      scenario,
      playerAction,
      history,
      diceRoll,
      character: char,
      retryLevel: options?.retryLevel ?? 0,
      extraDirectives: options?.extraDirectives ?? [],
      stream: options?.stream ?? false,
      cheatMode,
      settings: settingsRef.current,
      diceMode,
      directorSettings: directorSettingsRef.current,
      worldBible,
      scenarioSelection,
      campaignMemory,
      getCampaignContext,
      currentMood,
      toneState,
      mutateTone: options?.mutateTone ?? false,
      languageState,
      weatherState,
      timeState,
      sceneNPCs,
      worldState,
      narrativeQueue,
      activeRumors,
      playerLocation,
      activeConsequences,
      pressureState,
      getPressureContext,
      getNPCMotivation,
      getNPCMotivationContext,
      getUnsurfacedBitesForNPC,
      getBiteContext,
      getSurfaceNarrativeForBite,
      inventory,
      getEnhancedPromptWithContract,
      sessionState: sessionStateRef.current,
      sessionStartMs: sessionStartRef.current,
      pendingCompanionIntroduction: companionIntro,
      pendingCompanionId: companionId,
    });

    if (result.nextToneState) {
      setToneState(result.nextToneState);
    }

    return result.requestBody;
  }, [
    cheatMode, diceMode, worldBible, scenarioSelection,
    campaignMemory, getCampaignContext, currentMood, toneState, setToneState,
    languageState, weatherState, timeState, sceneNPCs, worldState, narrativeQueue,
    activeRumors, playerLocation, activeConsequences, pressureState, getPressureContext,
    getNPCMotivation, getNPCMotivationContext, getUnsurfacedBitesForNPC,
    getBiteContext, getSurfaceNarrativeForBite, inventory, getEnhancedPromptWithContract,
  ]);

  const generateNarrativeWithRetry = useCallback(async (
    scenario: string,
    playerAction?: string,
    history: StoryEntry[] = [],
    diceRoll?: any,
    char?: RPGCharacter,
    skipLoadingState?: boolean,
    retryLevel: number = 0,
    extraDirectives: string[] = []
  ): Promise<string | null> => {
    const activeChar = char || character;
    if (!activeChar) return null;
    
    const genre = scenarioSelection?.genre || 'fantasy';
    
    const generationState = {
      character: activeChar,
      worldBible: worldBible,
      scenario: scenario,
      genre: genre,
    };
    
    const stateValidation = validateGenerationState(generationState);
    if (!stateValidation.ready) {
      console.warn('[generateNarrative] State not ready, using fallback. Missing:', stateValidation.missing);
      return getContextualFallback(genre);
    }
    
    const requestId = `gen_${Date.now()}_r${retryLevel}`;
    const lockAcquired = await acquireGenerationLock(requestId);
    if (!lockAcquired) {
      console.warn('[generateNarrative] Could not acquire lock, request cancelled');
      return null;
    }
    
    if (!skipLoadingState) {
      setIsLoading(true);
    }
    
    if (retryLevel > 0) {
      console.log(`[generateNarrative] Retry attempt ${retryLevel} with reduced context`);
    }

    // If set, finally releases the lock but keeps loading=true while we recurse once.
    let pendingRetryDirectives: string[] | null = null;

    try {
      if (playerAction) {
        logGenerationDebug(playerAction, generationState, {
          historyLength: history.length,
          hasDiceRoll: !!diceRoll,
          hasMemoryContext: !!campaignMemory,
        });
      }

      const requestBody = buildRequestBody(
        scenario,
        playerAction,
        history,
        diceRoll,
        activeChar,
        {
          retryLevel,
          extraDirectives,
          mutateTone: true,
        }
      );

      if (!requestBody) {
        return getContextualFallback(genre);
      }
      
      console.log(`[generateNarrative] Request body size: ${JSON.stringify(requestBody).length} chars (retryLevel: ${retryLevel})`);

      const FETCH_TIMEOUT_MS = 60000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[generateNarrative] Fetch timeout, aborting request');
        controller.abort();
      }, FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('[generateNarrative] Request timed out after', FETCH_TIMEOUT_MS, 'ms');
          toast.error('AI took too long to respond. Try again.', { duration: 5000 });
          return getContextualFallback(genre);
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.error('[AI] Rate limit exceeded (429)');
        toast.error('AI is busy. Please wait a moment and try again.', {
          duration: 5000,
          description: 'Rate limit exceeded'
        });
        return getContextualFallback(genre);
      }
      
      if (response.status === 402) {
        console.error('[AI] Payment required (402)');
        toast.error('AI credits depleted. Please add credits to continue.', {
          duration: 8000,
          description: 'Usage limit reached'
        });
        return getContextualFallback(genre);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('[AI] API returned error:', data.error);
        toast.error(data.error, { duration: 5000 });
        return getContextualFallback(genre);
      }
      
      let finalMechanics = data.mechanics ? { ...data.mechanics } : {};
      
      console.log('[useNarrativeGeneration] Raw mechanics:', JSON.stringify(data.mechanics, null, 2));
      
      // Fallback detection
      if (data.narrative) {
        const existingLoot = Array.isArray(finalMechanics.lootGained) 
          ? finalMechanics.lootGained 
          : (finalMechanics.lootGained ? [finalMechanics.lootGained] : []);
        
        const detectedLoot = detectMissingLootTags(data.narrative, existingLoot, { minConfidence: 'high' });
        if (detectedLoot.length > 0) {
          finalMechanics.lootGained = [...existingLoot, ...detectedLoot];
        }
        
        const existingDrops = Array.isArray(finalMechanics.itemsDropped) 
          ? finalMechanics.itemsDropped 
          : (finalMechanics.itemsDropped ? [finalMechanics.itemsDropped] : []);
        
        const playerInventoryNames = character?.inventory?.map(item => item.name) || [];
        const detectedDrops = detectMissingDropTags(data.narrative, existingDrops, playerInventoryNames, { minConfidence: 'high' });
        if (detectedDrops.length > 0) {
          finalMechanics.itemsDropped = [...existingDrops, ...detectedDrops];
        }
        
        const detectedDamage = detectMissingDamageTags(data.narrative, finalMechanics.damage, { minConfidence: 'high' });
        if (detectedDamage !== null) {
          finalMechanics.damage = detectedDamage;
        }
        
        const detectedHeal = detectMissingHealTags(data.narrative, finalMechanics.heal, { minConfidence: 'high' });
        if (detectedHeal !== null) {
          finalMechanics.heal = detectedHeal;
        }
        
        const detectedGold = detectMissingGoldTags(data.narrative, finalMechanics.goldGained, { minConfidence: 'high' });
        if (detectedGold !== null) {
          finalMechanics.goldGained = detectedGold;
        }
      }
      
      if (Object.keys(finalMechanics).length > 0) {
        latestMechanicsRef.current = finalMechanics; // Sync update — readable immediately
        setPendingMechanics(finalMechanics);
        
        if (finalMechanics.languagesLearned && finalMechanics.languagesLearned.length > 0) {
          for (const learned of finalMechanics.languagesLearned) {
            if (!languageState.playerKnownLanguages.includes(learned.language)) {
              setLanguageState(prev => learnLanguage(prev, learned.language));
              toast.success(`You've learned ${getLanguageDisplayName(learned.language)}!`, {
                description: learned.reason,
                duration: 5000,
              });
            }
          }
        }
      }
      
      if (data.narrative) {
        if (playerAction && isEchoResponse(data.narrative, playerAction)) {
          console.error('[AI] Echo response detected — retrying once with anti-echo directive');
          if (retryLevel < 1) {
            pendingRetryDirectives = [
              `ANTI-ECHO: Do NOT restate or paraphrase the player's action ("${playerAction.slice(0, 120)}"). Advance the scene with consequences, sensory detail, and NPC reaction. Never open with "You attempt/try/decide to…".`,
            ];
          } else {
            return getContextualFallback(genre);
          }
        }
        
        if (!pendingRetryDirectives) {
          // Quality validation
          const qualityResult = validateNarrativeQuality(
            data.narrative, 
            genre, 
            sessionStateRef.current.lastNarratives
          );
          
          if (!qualityResult.passed) {
            console.warn('[Quality] Narrative quality issues:', qualityResult.violations);
            if (qualityResult.violations.some(v => v.includes('High similarity')) && retryLevel < 1) {
              console.error('[Quality] Repetition detected — retrying once');
              pendingRetryDirectives = [
                `ANTI-REPETITION: Your last draft was too similar to earlier narration. Write a fresh continuation. Change opening, focus, and sensory details. Suggestions: ${(qualityResult.suggestions || []).slice(0, 3).join('; ')}`,
              ];
            }
          }
        }
        
        if (!pendingRetryDirectives) {
          // Genre compliance check
          const genreResult = validateGenreCompliance(data.narrative, genre);
          if (!genreResult.compliant) {
            console.warn('[Genre] Compliance issues:', genreResult.issues);
          }
          
          // Repetition check against recent history
          const repetitionCheck = checkForRepetition(data.narrative, history as StoryEntry[]);
          if (repetitionCheck.isRepetitive) {
            console.warn(`[Quality] High repetition (${(repetitionCheck.similarity * 100).toFixed(0)}%):`, repetitionCheck.matchedContent);
            if (retryLevel < 1 && playerAction) {
              console.error('[Quality] History repetition — retrying once');
              pendingRetryDirectives = [
                `ANTI-REPETITION: Avoid repeating recent beats. ${repetitionCheck.suggestions.join(' ')}`,
              ];
            }
          }
        }
        
        if (!pendingRetryDirectives) {
          // Update session state for drift prevention
          sessionStateRef.current = updateSessionState(sessionStateRef.current, data.narrative);
          
          const validation = validateContent(data.narrative);
          if (!validation.success) {
            console.warn('[World Bible] Narrative blocked, using fallback:', validation.log);
            return validation.content || getContextualFallback(genre);
          }
          
          const processedContent = postProcessLanguageInResponse(validation.content, languageState);
          return processedContent;
        }
      }
      
      if (!pendingRetryDirectives) {
        return getContextualFallback(genre);
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
      
      if (playerAction) {
        setLastFailedAction({
          action: playerAction,
          diceRoll: diceRoll,
          storySnapshot: history.slice(0, -1),
        });
        
        toast.error('Failed to reach AI', {
          description: 'Tap "Retry" to try again',
          duration: 10000,
        });
      } else {
        toast.error('Failed to reach AI. Using fallback narrative.');
      }
      
      return getContextualFallback(scenarioSelection?.genre);
    } finally {
      releaseGenerationLock(requestId);
      if (!skipLoadingState && !pendingRetryDirectives) {
        setIsLoading(false);
      }
    }

    if (pendingRetryDirectives) {
      try {
        return await generateNarrativeWithRetry(
          scenario,
          playerAction,
          history,
          diceRoll,
          activeChar,
          true,
          retryLevel + 1,
          pendingRetryDirectives
        );
      } finally {
        if (!skipLoadingState) {
          setIsLoading(false);
        }
      }
    }

    return getContextualFallback(genre);
  }, [
    character, scenarioSelection?.genre, scenarioSelection?.scenario, worldBible,
    campaignMemory, buildRequestBody, validateContent, languageState, setLanguageState,
    setLastFailedAction,
  ]);

  const generateNarrative = useCallback(async (
    scenario: string,
    playerAction?: string,
    history: StoryEntry[] = [],
    diceRoll?: any,
    char?: RPGCharacter,
    skipLoadingState?: boolean
  ): Promise<string | null> => {
    const MAX_RETRIES = 3;
    
    for (let retryLevel = 0; retryLevel <= MAX_RETRIES; retryLevel++) {
      try {
        const result = await generateNarrativeWithRetry(
          scenario,
          playerAction,
          history,
          diceRoll,
          char,
          skipLoadingState,
          retryLevel
        );
        
        if (result && !result.includes('The moment stretches') && !result.includes('You pause')) {
          return result;
        }
        
        if (retryLevel === 0 && result) {
          return result;
        }
        
        console.log(`[generateNarrative] Attempt ${retryLevel + 1} returned fallback, trying with reduced context...`);
      } catch (error) {
        console.error(`[generateNarrative] Attempt ${retryLevel + 1} failed:`, error);
        
        if (retryLevel === MAX_RETRIES) {
          return getContextualFallback(scenarioSelection?.genre);
        }
        
        console.log(`[generateNarrative] Retrying with reduced context (level ${retryLevel + 1})...`);
      }
    }
    
    return getContextualFallback(scenarioSelection?.genre);
  }, [generateNarrativeWithRetry, scenarioSelection?.genre]);

  return {
    isLoading,
    lastFailedAction,
    pendingMechanics,
    latestMechanicsRef,
    generateNarrative,
    buildRequestBody,
    applyPendingSettings,
    setLastFailedAction,
    setPendingMechanics,
    setIsLoading,
  };
}
