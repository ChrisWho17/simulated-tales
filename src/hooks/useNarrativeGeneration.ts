/**
 * useNarrativeGeneration Hook
 * 
 * Handles AI narrative generation with retry logic, context building,
 * and fallback handling. Extracted from AdventureGame.tsx to reduce complexity.
 */

import { useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import { RPGCharacter } from '@/types/rpgCharacter';
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
import { postProcessLanguageInResponse, learnLanguage, getLanguageDisplayName, LanguageSystemState } from '@/game/languageSystem';
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
  settings: {
    adultContent: boolean;
    enableMoodSystem: boolean;
    enableWeatherEffects: boolean;
    narratorConfig?: any;
    directorSettings?: DirectorSettings;
  };
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
  generateNarrative: (
    scenario: string,
    playerAction?: string,
    history?: StoryEntry[],
    diceRoll?: any,
    char?: RPGCharacter,
    skipLoadingState?: boolean
  ) => Promise<string | null>;
  setLastFailedAction: React.Dispatch<React.SetStateAction<{ action: string; diceRoll?: any; storySnapshot: StoryEntry[] } | null>>;
  setPendingMechanics: React.Dispatch<React.SetStateAction<GameMechanics | undefined>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============= HELPERS =============

function sanitizeCharacterForAPI(char: RPGCharacter): RPGCharacter {
  const charAny = char as any;
  return {
    ...char,
    portraitUrl: charAny.portraitUrl && charAny.portraitUrl.length > 500 ? null : charAny.portraitUrl,
    appearanceDescription: charAny.appearanceDescription?.slice(0, 2000) || null,
  } as RPGCharacter;
}

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
  const [lastFailedAction, setLastFailedAction] = useState<{
    action: string;
    diceRoll?: any;
    storySnapshot: StoryEntry[];
  } | null>(null);
  
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

  const generateNarrativeWithRetry = useCallback(async (
    scenario: string,
    playerAction?: string,
    history: StoryEntry[] = [],
    diceRoll?: any,
    char?: RPGCharacter,
    skipLoadingState?: boolean,
    retryLevel: number = 0
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

    try {
      if (playerAction) {
        logGenerationDebug(playerAction, generationState, {
          historyLength: history.length,
          hasDiceRoll: !!diceRoll,
          hasMemoryContext: !!campaignMemory,
        });
      }
      
      const currentTick = campaignMemory?.campaign.currentTick ?? 0;
      const memContext = getCampaignContext?.('current_scene', [], currentTick);
      const formattedMemory = formatMemoryContextForAI(memContext, activeChar.name);
      
      const emotionalContext = settings.enableMoodSystem 
        ? formatEmotionalContext(currentMood, 0.6, genre)
        : null;
      
      const enhancedScenario = getEnhancedPromptWithContract(scenario);
      const cleanedPlayerAction = playerAction ? cleanPlayerInputForPrompt(playerAction) : undefined;
      
      let toneContextPayload = undefined;
      if (cleanedPlayerAction) {
        const playerTone = analyzePlayerTone(cleanedPlayerAction);
        const toneInstructions = buildToneContext(toneState, playerTone);
        toneContextPayload = {
          currentTone: playerTone.tone,
          intensity: playerTone.intensity,
          playerChaosLevel: toneState.playerChaosLevel,
          toneInstructions,
        };
        setToneState(prev => updateToneState(prev, playerTone));
      }
      
      const languageInstructions = deps.languageState ? require('@/game/languageSystem').buildLanguageContext(deps.languageState) : '';
      const languageContextPayload = {
        playerKnownLanguages: languageState.playerKnownLanguages,
        translateEnabled: languageState.translateEnabled,
        languageInstructions,
      };
      
      // Build NPC psychology context
      let npcPsychologyPayload = undefined;
      if (sceneNPCs.length > 0) {
        npcPsychologyPayload = {
          npcContexts: buildSceneNPCContext(sceneNPCs),
        };
      }
      
      // Build ripple effect context
      let ripplePayload = undefined;
      if (narrativeQueue.length > 0 || worldState.securityLevel !== 'normal' || worldState.guardAlertLevel > 20) {
        ripplePayload = {
          consequenceContext: buildConsequenceContext(narrativeQueue),
          worldStateContext: buildWorldStateContext(worldState),
        };
      }
      
      // Unreliable information context
      let unreliableInfoPayload = undefined;
      if (activeRumors.length > 0) {
        unreliableInfoPayload = {
          rumorContext: buildRumorContext(activeRumors),
        };
      }
      
      const backgroundNPCActionsPayload = buildBackgroundNPCActionsContext(memContext, currentTick);
      
      // Pressure context
      const pressureClockPayload = {
        pressureContext: getPressureContext(),
        atmosphereLines: getPressureAtmosphere(pressureState),
        worldPressureLevel: pressureState.worldPressureLevel,
        activeEffects: pressureState.activeEffects,
      };
      
      // NPC Motivation context
      const npcMotivationPayload = {
        motivationContext: getNPCMotivationContext(),
        presentNPCMotivations: sceneNPCs.map(npc => {
          const npcName = npc.npcId.split('_').pop()?.replace(/^\w/, c => c.toUpperCase()) || npc.npcId;
          const motivation = getNPCMotivation(npc.npcId, npcName);
          return {
            npcName: motivation.npcName,
            desire: motivation.desire,
            fear: motivation.fear,
            leverage: motivation.leverage,
            line: motivation.line,
            trustLevel: motivation.trustLevel,
            stance: motivation.currentStance,
            behaviors: motivation.behaviors,
          };
        }),
      };
      
      // Memory Bite context
      const unsurfacedBites = getUnsurfacedBitesForNPC();
      const memoryBitePayload = {
        biteContext: sceneNPCs.length > 0 
          ? sceneNPCs.map(npc => getBiteContext(npc.npcId)).filter(Boolean).join('\n\n')
          : '',
        unsurfacedBites: unsurfacedBites.map(bite => ({
          npcName: bite.npcName,
          type: bite.type,
          context: bite.context,
          surfaceNarrative: getSurfaceNarrativeForBite(bite),
          emotionalWeight: bite.emotionalWeight,
        })),
      };
      
      // NPC Personality context
      const npcPersonalityPayload = (() => {
        const allNPCs = getAllRegisteredNPCs();
        if (allNPCs.length === 0) return undefined;
        
        const npcProfiles: Array<{
          npcName: string;
          archetypeName: string;
          mentalState: string;
          experienceLevel: string;
          disposition: string;
          speechPattern: string;
          quirk: string;
          motivation: string;
          fear: string;
          backstory: string;
        }> = [];
        
        for (const npc of allNPCs.slice(-10)) {
          const stored = getNPCPersonality(npc.permanent.id);
          if (stored) {
            const template = getPersonalityById(stored.personalityId);
            if (template) {
              npcProfiles.push({
                npcName: npc.permanent.name,
                archetypeName: template.name,
                mentalState: template.mentalState,
                experienceLevel: template.experienceLevel,
                disposition: template.socialDisposition,
                speechPattern: template.speechPatterns[0] || 'measured speech',
                quirk: stored.selectedQuirk,
                motivation: stored.selectedMotivation,
                fear: stored.selectedFear,
                backstory: stored.selectedBackstory,
              });
            }
          }
        }
        
        if (npcProfiles.length === 0) return undefined;
        
        return {
          fullContext: getAllNPCPersonalityContext(),
          npcProfiles,
        };
      })();
      
      // Location context
      const locationContextPayload = {
        currentZone: {
          name: playerLocation.zoneName,
          type: playerLocation.zoneType,
          description: `The ${playerLocation.zoneName} area`,
          atmosphere: 'urban',
          crowdDensity: 'moderate',
          lighting: 'well_lit',
          socialTone: 'neutral',
          surveillanceLevel: 30,
        },
        timeOfDay: getGameTimeOfDay(timeState.hour) as 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night',
        isNewArrival: false,
        activeConsequences: activeConsequences.map(c => c.description),
      };

      // Retry level context reduction
      const includeAdvancedContext = retryLevel === 0;
      const includeIntermediateContext = retryLevel <= 1;
      const includeBasicContext = retryLevel <= 2;
      
      const sanitizedCharacter = sanitizeCharacterForAPI(activeChar);
      
      const requestBody: Record<string, any> = {
        scenario: enhancedScenario,
        playerAction: cleanedPlayerAction,
        conversationHistory: history.map(e => ({ role: e.role, content: e.content })),
        cheatMode,
        character: sanitizedCharacter,
        diceRoll,
        adultContent: settings.adultContent,
        characterAppearance: (sanitizedCharacter as any).appearanceDescription,
        narratorConfig: settings.narratorConfig,
        diceMode: diceMode,
        narrativeContractContext: (() => {
          const isOpening = history.length === 0;
          const characterClass = activeChar.classId || 'default';
          const characterInventory = inventory.state.items.map(i => ({
            name: i.name,
            quantity: i.quantity || 1,
          }));
          
          const spawnPacket = isOpening ? buildSpawnPacket(
            scenarioSelection?.scenario || scenario,
            genre,
            characterClass,
            activeChar.name,
            characterInventory,
            playerLocation.zoneName || 'Unknown Location'
          ) : null;
          
          return {
            universalRules: UNIVERSAL_NARRATIVE_RULES,
            genreBible: `===== GENRE BIBLE =====\n${GENRE_BIBLE[genre] || GENRE_BIBLE['fantasy']}`,
            spawnPacket: spawnPacket ? formatSpawnPacket(spawnPacket) : null,
            isOpening,
          };
        })(),
      };
      
      // Basic context
      if (includeBasicContext) {
        requestBody.memoryContext = formattedMemory.fullContext ? formattedMemory : undefined;
        requestBody.emotionalContext = emotionalContext;
        requestBody.genreContract = worldBible?.contractSummary || null;
        requestBody.toneContext = toneContextPayload;
        requestBody.languageContext = languageContextPayload;
        requestBody.locationContext = locationContextPayload;
        
        const activeDirectorSettings = directorSettings || settings.directorSettings;
        if (activeDirectorSettings) {
          requestBody.directorContext = {
            enabled: activeDirectorSettings.enabled,
            rawGame: activeDirectorSettings.rawGame,
            mode: activeDirectorSettings.mode,
            directorType: activeDirectorSettings.directorType,
            tightness: activeDirectorSettings.tightness,
            descriptionLevel: activeDirectorSettings.descriptionLevel,
            cruelty: activeDirectorSettings.cruelty,
            weirdness: activeDirectorSettings.weirdness,
            guidance: activeDirectorSettings.guidance,
          };
        }
      }
      
      // Intermediate context
      if (includeIntermediateContext) {
        requestBody.npcPsychologyContext = npcPsychologyPayload;
        requestBody.rippleContext = ripplePayload;
        requestBody.unreliableInfoContext = unreliableInfoPayload;
        requestBody.consistencyContext = {
          objectOwnership: buildInventoryContextForAI(inventory.state),
          npcIdentity: buildNPCIdentityContext(),
          playerCorrections: buildPlayerCorrectionsContext(),
          moveSyncState: buildMoveSyncContextForAI(),
        };
        requestBody.npcPersonalityContext = npcPersonalityPayload;
        
        if (settings.enableWeatherEffects) {
          requestBody.weatherContext = {
            current: weatherState.current,
            intensity: weatherState.intensity > 1.2 ? 'intense' : weatherState.intensity < 0.7 ? 'mild' : 'moderate',
            name: WEATHER_CONFIGS[weatherState.current]?.name || weatherState.current,
            narrativeContext: getWeatherNarrativeContext(weatherState),
            effects: formatWeatherEffectsForAI(weatherState),
          };
        }
        
        requestBody.timeContext = buildTimeContext(timeState);
        requestBody.npcScheduleContext = buildRegisteredNPCScheduleContext(
          playerLocation.zoneName || 'Unknown Location',
          timeState,
          []
        );
        
        const clothingArmorContext = buildClothingArmorContextForAI();
        if (clothingArmorContext) {
          requestBody.clothingArmorContext = clothingArmorContext;
        }
      }
      
      // Advanced context
      if (includeAdvancedContext) {
        requestBody.backgroundNPCActionsContext = backgroundNPCActionsPayload;
        requestBody.pressureClockContext = pressureClockPayload;
        requestBody.npcMotivationContext = npcMotivationPayload;
        requestBody.memoryBiteContext = memoryBitePayload;
        requestBody.livingWorldContext = {
          propertyContext: PropertySystem.buildPropertyContext(),
          rivalContext: RivalSystem.buildRivalContext(),
          factionContext: FactionSystem.buildFactionContext(),
          fullContext: buildLivingWorldContext(),
        };
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
          console.error('[AI] Echo response detected, using contextual fallback');
          return getContextualFallback(genre);
        }
        
        const validation = validateContent(data.narrative);
        if (!validation.success) {
          console.warn('[World Bible] Narrative blocked, using fallback:', validation.log);
          return validation.content || getContextualFallback(genre);
        }
        
        const processedContent = postProcessLanguageInResponse(validation.content, languageState);
        return processedContent;
      }
      
      return getContextualFallback(genre);
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
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [
    character, cheatMode, campaignMemory, getCampaignContext, currentMood, 
    settings, scenarioSelection?.genre, scenarioSelection?.scenario,
    getEnhancedPromptWithContract, validateContent, worldBible, 
    toneState, setToneState, languageState, setLanguageState,
    sceneNPCs, worldState, narrativeQueue, activeRumors, 
    playerLocation, activeConsequences, pressureState, getPressureContext,
    getNPCMotivation, getNPCMotivationContext, getUnsurfacedBitesForNPC,
    getBiteContext, getSurfaceNarrativeForBite, inventory, diceMode,
    directorSettings, weatherState, timeState
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
    generateNarrative,
    setLastFailedAction,
    setPendingMechanics,
    setIsLoading,
  };
}
