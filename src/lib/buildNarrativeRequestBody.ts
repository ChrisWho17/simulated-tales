/**
 * Shared adventure request-body builder.
 * Used by both streaming and non-streaming generation so play settings/systems
 * stay connected on the default (typewriter/streaming) path.
 */

import { RPGCharacter } from '@/types/rpgCharacter';
import { sanitizeCharacterForAPI } from '@/lib/sanitizeCharacterForAPI';
import { GameGenre } from '@/types/genreData';
import { StoryEntry } from '@/components/adventure/types';
import { cleanPlayerInputForPrompt } from '@/lib/narrativeGuard';
import {
  generateAntiDriftDirectives,
  SessionState,
} from '@/lib/narrativeQualitySystem';
import {
  compressConversationHistory,
  getLongSessionDirectives,
} from '@/lib/narrativeLeakagePrevention';
import {
  getGenreWritingInstructions,
  getGenreMicroEvents,
} from '@/lib/narrativeGenreEnforcement';
import { LanguageSystemState, buildLanguageContext } from '@/game/languageSystem';
import { ToneState, analyzePlayerTone, updateToneState, buildToneContext } from '@/game/toneSystem';
import { WEATHER_CONFIGS, WeatherState, getWeatherNarrativeContext, formatWeatherEffectsForAI } from '@/game/weatherSystem';
import { GameTimeState, buildTimeContext, TimeOfDayPeriod } from '@/game/timeProgressionSystem';
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
import { WorldBible } from '@/game/worldBible/types';
import { PressureState, getPressureAtmosphere } from '@/game/pressureClockSystem';
import { companionSystem } from '@/game/companionSystem';

/**
 * Depth/realism toggles the player configures in Settings. These used to live
 * only in the UI, so turning on Gun Nut or Hunger changed nothing the narrator
 * could see.
 */
export interface NarrativeInDepthSettings {
  worldTone?: 'cozy' | 'balanced' | 'brutal';
  enableHunger?: boolean;
  enableFatigue?: boolean;
  enableInjuryDetail?: boolean;
  enableEquipmentWear?: boolean;
  gunNutDepth?: 'standard' | 'gunnut' | 'gunnut_plus';
  socialWeight?: 'light' | 'balanced' | 'heavy';
  combatWeight?: 'light' | 'balanced' | 'heavy';
  mysteryDensity?: 'low' | 'medium' | 'high';
  microEventFrequency?: 'rare' | 'occasional' | 'frequent';
  consequenceIntensity?: 'forgiving' | 'balanced' | 'harsh';
}

export interface NarrativeRequestSettings {
  adultContent: boolean;
  enableMoodSystem: boolean;
  enableWeatherEffects: boolean;
  enableNPCSchedules?: boolean;
  enableNPCAccents?: boolean;
  enableMoodDialogue?: boolean;
  narratorConfig?: unknown;
  directorSettings?: DirectorSettings;
  forceVarianceSeedEnabled?: boolean;
  forceVarianceSeed?: string;
  inDepthSettings?: NarrativeInDepthSettings;
  enableAdrenalineSystem?: boolean;
  enableWoundSystem?: boolean;
  enableInventoryWeight?: boolean;
}

export interface BuildNarrativeRequestBodyInput {
  scenario: string;
  playerAction?: string;
  history?: StoryEntry[];
  diceRoll?: unknown;
  character: RPGCharacter;
  retryLevel?: number;
  extraDirectives?: string[];
  stream?: boolean;
  cheatMode: boolean;
  settings: NarrativeRequestSettings;
  diceMode: string;
  directorSettings: DirectorSettings | null;
  worldBible: WorldBible | null;
  scenarioSelection: { scenario: string; genre: GameGenre } | null;
  campaignMemory: { campaign?: { currentTick?: number } } | null;
  getCampaignContext?: (scope: string, entities: string[], tick: number) => unknown;
  currentMood: CoreMoodType;
  toneState: ToneState;
  /** When true, returns next tone state so the caller can commit it. */
  mutateTone?: boolean;
  languageState: LanguageSystemState;
  weatherState: WeatherState;
  timeState: GameTimeState;
  sceneNPCs: NPCGrudgeContext[];
  worldState: WorldStateChanges;
  narrativeQueue: string[];
  activeRumors: Rumor[];
  playerLocation: { zoneName: string; zoneType: string };
  activeConsequences: { description: string }[];
  pressureState: PressureState;
  getPressureContext: () => string;
  getNPCMotivation: (npcId: string, npcName: string) => any;
  getNPCMotivationContext: () => string;
  getUnsurfacedBitesForNPC: () => any[];
  getBiteContext: (npcId: string) => string | null;
  getSurfaceNarrativeForBite: (bite: any) => string;
  inventory: { state: InventoryState };
  getEnhancedPromptWithContract: (prompt: string) => string;
  sessionState: SessionState;
  sessionStartMs: number;
  pendingCompanionIntroduction?: unknown;
  pendingCompanionId?: string;
}

export interface BuildNarrativeRequestBodyResult {
  requestBody: Record<string, any>;
  nextToneState?: ToneState;
}

function formatEmotionalContext(
  mood: CoreMoodType,
  moodIntensity: number,
  genre: GameGenre
) {
  if (mood === 'neutral' && moodIntensity < 0.3) return null;
  const descriptor =
    GENRE_MOOD_DESCRIPTORS[genre]?.[mood] ||
    GENRE_MOOD_DESCRIPTORS.custom?.[mood] ||
    GENRE_MOOD_DESCRIPTORS.fantasy[mood];
  if (!descriptor) return null;
  return {
    currentMood: descriptor.label,
    moodIntensity,
    internalDescription: descriptor.internalState[Math.floor(Math.random() * descriptor.internalState.length)],
    physicalDescription: descriptor.physicalSigns.join(', '),
    dialogueTone: descriptor.dialogueTone,
    actionFlavor: descriptor.actionFlavor,
  };
}

/**
 * Turns the depth toggles into an explicit contract for the narrator. Only the
 * systems the player actually enabled are described, so a disabled system stays
 * silent instead of leaking survival/weapon chatter into a cosy story.
 */
function buildGameplaySystemsContext(settings: NarrativeRequestSettings) {
  const depth = settings.inDepthSettings || {};
  const activeSystems: string[] = [];
  const disabledSystems: string[] = [];

  const record = (enabled: boolean | undefined, onLabel: string, offLabel: string) => {
    if (enabled) activeSystems.push(onLabel);
    else disabledSystems.push(offLabel);
  };

  record(depth.enableHunger, 'HUNGER & THIRST: track and reference the character growing hungry/thirsty; meals, rations and water matter.', 'hunger/thirst');
  record(depth.enableFatigue, 'FATIGUE & SLEEP: track tiredness; long exertion without rest degrades performance and shows in the prose.', 'fatigue/sleep');
  record(depth.enableInjuryDetail, 'DETAILED INJURIES: describe wounds specifically (location, severity, bleeding, lingering pain) rather than abstract damage.', 'detailed injuries');
  record(depth.enableEquipmentWear, 'EQUIPMENT WEAR: gear degrades with use — note fouling, dulled edges, frayed straps, jams and the need for maintenance.', 'equipment wear');
  record(settings.enableAdrenalineSystem, 'ADRENALINE: under stress the character may not feel injuries; hide the true cost until the adrenaline drops, then land it hard.', 'adrenaline masking');
  record(settings.enableWoundSystem, 'WOUND TRACKING: persistent wounds carry between scenes until treated.', 'wound tracking');
  record(settings.enableInventoryWeight, 'ENCUMBRANCE: carrying capacity is finite; heavy loads slow the character and are worth mentioning.', 'encumbrance');

  const gunNut = depth.gunNutDepth && depth.gunNutDepth !== 'standard';
  if (gunNut) {
    activeSystems.push(
      depth.gunNutDepth === 'gunnut_plus'
        ? 'GUN NUT+ : use precise firearms terminology — specific calibers, actions, optics, muzzle devices, magazines, triggers, handling characteristics, recoil impulse and malfunction types. The character is an expert; write like one.'
        : 'GUN NUT: use accurate firearms detail — correct caliber, action type, optic and attachment names, realistic handling, recoil and reloading.'
    );
  } else {
    disabledSystems.push('firearms detail (keep weapon description general)');
  }

  const toneDirective = depth.worldTone === 'brutal'
    ? 'WORLD TONE — BRUTAL: the world is genuinely dangerous. Mistakes cost blood, resources and relationships. Do not soften outcomes.'
    : depth.worldTone === 'cozy'
      ? 'WORLD TONE — COZY: keep threat low and warmth high. Setbacks are inconvenient, not devastating.'
      : 'WORLD TONE — BALANCED: real stakes, fair outcomes.';

  const consequenceDirective = depth.consequenceIntensity === 'harsh'
    ? 'CONSEQUENCES — HARSH: failure bites, and it compounds.'
    : depth.consequenceIntensity === 'forgiving'
      ? 'CONSEQUENCES — FORGIVING: failure redirects rather than punishes.'
      : 'CONSEQUENCES — BALANCED: failure costs something proportionate.';

  return {
    worldTone: depth.worldTone || 'balanced',
    consequenceIntensity: depth.consequenceIntensity || 'balanced',
    socialWeight: depth.socialWeight || 'balanced',
    combatWeight: depth.combatWeight || 'balanced',
    mysteryDensity: depth.mysteryDensity || 'medium',
    microEventFrequency: depth.microEventFrequency || 'occasional',
    gunNutDepth: depth.gunNutDepth || 'standard',
    activeSystems,
    disabledSystems,
    directives: [toneDirective, consequenceDirective, ...activeSystems],
  };
}

function formatMemoryContextForAI(memContext: unknown, _characterName: string): { fullContext?: string } {
  if (!memContext) return {};
  return { fullContext: JSON.stringify(memContext).slice(0, 5000) };
}

function getGameTimeOfDay(hour: number): TimeOfDayPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function buildBackgroundNPCActionsContext(
  memContext: any,
  currentTick: number
): { actions: Array<{ description: string; involvedNPCs: string[]; location: string; hoursAgo: number }> } | undefined {
  const actions: Array<{ description: string; involvedNPCs: string[]; location: string; hoursAgo: number }> = [];
  if (memContext?.recentMemories) {
    for (const mem of memContext.recentMemories.slice(0, 8)) {
      if (mem?.type === 'npc_action' || mem?.kind === 'background') {
        const hoursAgo = Math.max(0, currentTick - (mem.tick || currentTick));
        actions.push({
          description: mem.description || mem.content || 'Someone acted nearby',
          involvedNPCs: mem.npcs || mem.involvedNPCs || [],
          location: mem.location || 'unknown',
          hoursAgo,
        });
      }
    }
  }
  const uniqueActions = actions
    .filter((action, index, self) => index === self.findIndex(a => a.description === action.description))
    .slice(0, 10);
  return uniqueActions.length > 0 ? { actions: uniqueActions } : undefined;
}

/**
 * Active party members were only reaching the AI through the pending-introduction
 * hook, so recruited companions were invisible to the narrator once introduced.
 */
function buildActivePartyContext() {
  let active: ReturnType<typeof companionSystem.getActiveCompanions>;
  try {
    active = companionSystem.getActiveCompanions();
  } catch (e) {
    console.warn('[buildNarrativeRequestBody] Failed to read companion party:', e);
    return undefined;
  }
  if (!active || active.length === 0) return undefined;

  return {
    partySize: active.length,
    members: active.map(companion => ({
      name: companion.name,
      mood: companion.mood,
      affinity: companion.affinity,
      trust: companion.trust,
      respect: companion.respect,
      combatRole: companion.combatRole || 'companion',
      skills: (companion.skills || []).slice(0, 5),
      internalThoughts: companion.internalThoughts || undefined,
      pendingReaction: companion.pendingReaction || undefined,
      wantsToSpeak: !!companion.wantsToSpeak,
    })),
    // Panel actions surface these; the narrator should honour them this turn.
    speakingCue: active
      .filter(c => c.wantsToSpeak || c.pendingReaction)
      .map(c => `${c.name}: ${c.pendingReaction || 'has something to say'}`)
      .join('\n') || undefined,
  };
}

export function buildNarrativeRequestBody(
  input: BuildNarrativeRequestBodyInput
): BuildNarrativeRequestBodyResult {
  const {
    scenario,
    playerAction,
    history = [],
    diceRoll,
    character: activeChar,
    retryLevel = 0,
    extraDirectives = [],
    stream = false,
    cheatMode,
    settings,
    diceMode,
    directorSettings,
    worldBible,
    scenarioSelection,
    campaignMemory,
    getCampaignContext,
    currentMood,
    toneState,
    mutateTone = false,
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
    sessionState,
    sessionStartMs,
    pendingCompanionIntroduction,
    pendingCompanionId,
  } = input;

  const genre = scenarioSelection?.genre || 'fantasy';
  const currentTick = campaignMemory?.campaign?.currentTick ?? 0;
  const memContext = getCampaignContext?.('current_scene', [], currentTick);
  const formattedMemory = formatMemoryContextForAI(memContext, activeChar.name);

  const emotionalContext = settings.enableMoodSystem
    ? formatEmotionalContext(currentMood, 0.6, genre)
    : null;

  const enhancedScenario = getEnhancedPromptWithContract(scenario);
  const cleanedPlayerAction = playerAction ? cleanPlayerInputForPrompt(playerAction) : undefined;

  let toneContextPayload: Record<string, unknown> | undefined;
  let nextToneState: ToneState | undefined;
  if (cleanedPlayerAction) {
    const playerTone = analyzePlayerTone(cleanedPlayerAction);
    const toneInstructions = buildToneContext(toneState, playerTone);
    toneContextPayload = {
      currentTone: playerTone.tone,
      intensity: playerTone.intensity,
      playerChaosLevel: toneState.playerChaosLevel,
      toneInstructions,
    };
    if (mutateTone) {
      nextToneState = updateToneState(toneState, playerTone);
    }
  }

  const languageInstructions = buildLanguageContext(languageState);
  const languageContextPayload = {
    playerKnownLanguages: languageState.playerKnownLanguages,
    translateEnabled: languageState.translateEnabled,
    languageInstructions,
  };

  let npcPsychologyPayload: { npcContexts: ReturnType<typeof buildSceneNPCContext> } | undefined;
  if (sceneNPCs.length > 0) {
    npcPsychologyPayload = { npcContexts: buildSceneNPCContext(sceneNPCs) };
  }

  let ripplePayload: Record<string, unknown> | undefined;
  if (narrativeQueue.length > 0 || worldState.securityLevel !== 'normal' || worldState.guardAlertLevel > 20) {
    ripplePayload = {
      consequenceContext: buildConsequenceContext(narrativeQueue),
      worldStateContext: buildWorldStateContext(worldState),
    };
  }

  let unreliableInfoPayload: { rumorContext: ReturnType<typeof buildRumorContext> } | undefined;
  if (activeRumors.length > 0) {
    unreliableInfoPayload = { rumorContext: buildRumorContext(activeRumors) };
  }

  const backgroundNPCActionsPayload = buildBackgroundNPCActionsContext(memContext, currentTick);

  const pressureClockPayload = {
    pressureContext: getPressureContext(),
    atmosphereLines: getPressureAtmosphere(pressureState),
    worldPressureLevel: pressureState.worldPressureLevel,
    activeEffects: pressureState.activeEffects,
  };

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

  const npcPersonalityPayload = (() => {
    const allNPCs = getAllRegisteredNPCs();
    if (allNPCs.length === 0) return undefined;
    const npcProfiles: Array<Record<string, string>> = [];
    for (const npc of allNPCs.slice(-10)) {
      const stored = getNPCPersonality(npc.permanent.id);
      if (!stored) continue;
      const template = getPersonalityById(stored.personalityId);
      if (!template) continue;
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
    if (npcProfiles.length === 0) return undefined;
    return {
      fullContext: getAllNPCPersonalityContext(),
      npcProfiles,
    };
  })();

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

  const includeAdvancedContext = retryLevel === 0;
  const includeIntermediateContext = retryLevel <= 1;
  const includeBasicContext = retryLevel <= 2;

  const hoursPlayed = (Date.now() - sessionStartMs) / (1000 * 60 * 60);
  const turnCount = sessionState.turnCount;

  const compressedHistoryResult = compressConversationHistory(history as StoryEntry[], {
    maxHistoryEntries: stream ? 10 : 16,
    maxEntryLength: stream ? 1500 : 1200,
    summaryThreshold: 24,
    dedupeSimilarityThreshold: 0.45,
    maxContextTokens: stream ? 6000 : 8000,
  });

  const finalHistory = compressedHistoryResult.summary
    ? [{ role: 'system' as const, content: compressedHistoryResult.summary }, ...compressedHistoryResult.entries]
    : compressedHistoryResult.entries;

  const antiDriftDirectives = generateAntiDriftDirectives(sessionState);
  const longSessionDirectives = getLongSessionDirectives(turnCount, hoursPlayed);
  const genreWritingInstructions = getGenreWritingInstructions(genre);
  const qualityDirectives = [
    ...antiDriftDirectives,
    ...longSessionDirectives,
    ...extraDirectives,
  ].filter(Boolean);

  const microEvents = turnCount > 10 ? getGenreMicroEvents(genre) : [];
  const selectedMicroEvent = microEvents.length > 0
    ? microEvents[Math.floor(Math.random() * microEvents.length)]
    : null;

  const sanitizedCharacter = sanitizeCharacterForAPI(activeChar);

  const requestBody: Record<string, any> = {
    scenario: enhancedScenario,
    playerAction: cleanedPlayerAction,
    conversationHistory: finalHistory,
    cheatMode,
    character: sanitizedCharacter,
    diceRoll,
    adultContent: settings.adultContent,
    characterAppearance: (sanitizedCharacter as any).appearanceDescription,
    narratorConfig: settings.narratorConfig,
    diceMode,
    enableNPCAccents: settings.enableNPCAccents !== false,
    ...(settings.enableMoodDialogue !== undefined ? { enableMoodDialogue: settings.enableMoodDialogue } : {}),
    ...(settings.forceVarianceSeedEnabled && settings.forceVarianceSeed
      ? { varianceSeed: settings.forceVarianceSeed }
      : {}),
    narrativeContractContext: (() => {
      const isOpening = history.length === 0;
      const characterClass = activeChar.classId || 'default';
      const characterInventory = inventory.state.items.map(i => ({
        name: i.name,
        quantity: i.quantity || 1,
      }));
      const spawnPacket = isOpening
        ? buildSpawnPacket(
            scenarioSelection?.scenario || scenario,
            genre,
            characterClass,
            activeChar.name,
            characterInventory,
            playerLocation.zoneName || 'Unknown Location'
          )
        : null;
      return {
        universalRules: UNIVERSAL_NARRATIVE_RULES,
        genreBible: `===== GENRE BIBLE =====\n${GENRE_BIBLE[genre] || GENRE_BIBLE['fantasy']}`,
        spawnPacket: spawnPacket ? formatSpawnPacket(spawnPacket) : null,
        isOpening,
      };
    })(),
    ...(stream ? { stream: true } : {}),
    ...(pendingCompanionIntroduction ? { pendingCompanionIntroduction } : {}),
    ...(pendingCompanionId ? { pendingCompanionId } : {}),
  };

  if (includeBasicContext) {
    requestBody.memoryContext = formattedMemory.fullContext ? formattedMemory : undefined;
    requestBody.emotionalContext = emotionalContext;
    requestBody.genreContract = worldBible?.contractSummary || null;
    requestBody.toneContext = toneContextPayload;
    requestBody.languageContext = languageContextPayload;
    requestBody.locationContext = locationContextPayload;
    requestBody.qualityEnforcement = {
      genreInstructions: genreWritingInstructions,
      antiDriftDirectives: qualityDirectives,
      suggestedMicroEvent: selectedMicroEvent,
      sessionMetrics: {
        turnCount,
        hoursPlayed: Math.floor(hoursPlayed * 10) / 10,
        historyCompressed: compressedHistoryResult.truncatedCount > 0,
      },
    };

    requestBody.gameplaySystemsContext = buildGameplaySystemsContext(settings);

    const activeDirectorSettings = settings.directorSettings || directorSettings;
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

    const partyContext = buildActivePartyContext();
    if (partyContext) {
      requestBody.companionPartyContext = partyContext;
    }

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

    if (settings.enableNPCSchedules !== false) {
      requestBody.npcScheduleContext = buildRegisteredNPCScheduleContext(
        playerLocation.zoneName || 'Unknown Location',
        timeState,
        []
      );
    }

    const clothingArmorContext = buildClothingArmorContextForAI();
    if (clothingArmorContext) {
      requestBody.clothingArmorContext = clothingArmorContext;
    }
  }

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

  console.log(
    `[buildNarrativeRequestBody] size=${JSON.stringify(requestBody).length} chars retry=${retryLevel} stream=${stream}`
  );

  return { requestBody, nextToneState };
}
