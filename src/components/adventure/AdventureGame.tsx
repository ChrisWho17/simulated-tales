import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SceneTrigger } from '@/components/game/SceneIllustration';
import { useWeatherTimeSystem } from '@/hooks/useWeatherTimeSystem';
import { useDirectorSettings } from '@/hooks/useDirectorSettings';
import { useCampaignSync } from '@/hooks/useCampaignSync';
import { usePlayerStateSync } from '@/hooks/usePlayerStateSync';
import { useSceneIllustration } from '@/hooks/useSceneIllustration';
import { useNarrativeGeneration } from '@/hooks/useNarrativeGeneration';
import { AdventureCreator, ScenarioSelection } from './AdventureCreator';
import { CharacterCreation } from './CharacterCreation';
import { AdventureDisplay } from './AdventureDisplay';
import { CrashRecoveryPrompt } from './CrashRecoveryPrompt';
import { NarratorSettingsModal } from './NarratorSettingsModal';
import { TestConfig, TestScenario } from './SystemsTestPanel';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ColorSelectionScreen } from '@/components/ui/ColorSelectionScreen';
import { FirstTimeWizard, useFirstTimeWizard } from '@/components/game/FirstTimeWizard';
import { SETTINGS_PRESETS } from '@/components/game/SettingsPresetSelector';
import { loadColorPreference, getSavedColorId } from '@/lib/colorTheme';
import { RPGCharacter, migrateCharacterHealth } from '@/types/rpgCharacter';
import { buildCharacterVisualProfile, CharacterVisualProfile } from '@/lib/characterConsistentIllustration';
import { playerStateManager } from '@/game/playerStateManager';
import { GameGenre, GENRE_DATA } from '@/types/genreData';
import { DiceMode, loadDiceMode, saveDiceMode } from '@/game/diceSystem';
import { useGame } from '@/contexts/GameContext';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { toast } from 'sonner';
import { generateNeutralContinuation } from '@/lib/narrativeFilter';
import { MechanicsSyncDebugPanel } from '@/components/debug/MechanicsSyncDebugPanel';
import { validateRestoredState } from '@/lib/saveConsistencyCheck';
import { inventoryRollbackLedger } from '@/lib/inventoryRollbackLedger';
import { GameSave, getMostRecentSave } from '@/lib/saveSystem';
import { setActiveCampaignId } from '@/lib/campaignStorage';
import { checkAndCleanupStorage, performCleanup, compressAndStore } from '@/lib/storageCleanup';
import { formatMemoryContextForAI, processActionForIdentity } from '@/game/campaignMemorySystem';
import { CoreMoodType, MOOD_COLORS, GENRE_MOOD_DESCRIPTORS } from '@/game/moodSystem';
import { 
  WeatherState, 
  getWeatherNarrativeContext,
  formatWeatherEffectsForAI,
  WEATHER_CONFIGS,
} from '@/game/weatherSystem';
import {
  GameTimeState,
  getTimeOfDay as getGameTimeOfDay,
  buildTimeContext,
  formatTimeContextForAI,
  TimeOfDayPeriod,
} from '@/game/timeProgressionSystem';
import {
  buildRegisteredNPCScheduleContext,
} from '@/game/npcScheduleSystem';
import { 
  ToneState, 
  createInitialToneState, 
  analyzePlayerTone, 
  updateToneState, 
  buildToneContext 
} from '@/game/toneSystem';
import { 
  LanguageSystemState, 
  createLanguageSystemState, 
  buildLanguageContext,
  postProcessLanguageInResponse,
  learnLanguage,
  getLanguageDisplayName
} from '@/game/languageSystem';
import {
  NPCGrudgeContext,
  buildSceneNPCContext,
} from '@/game/npcGrudgeSystem';
import {
  buildRumorContext,
} from '@/game/unreliableInformationSystem';
import {
  getPressureAtmosphere,
} from '@/game/pressureClockSystem';
// Inventory system integration
import { useInventory } from '@/game/inventorySystem';
import { buildInventoryContextForAI, getGenreClasses } from '@/game/storyInventoryBridge';
import { processStoryInventoryUpdate, MechanicsTags } from '@/game/storyInventorySync';
import { 
  UNIVERSAL_NARRATIVE_RULES, 
  GENRE_BIBLE, 
  buildSpawnPacket, 
  formatSpawnPacket,
  DELTA_LEDGER_INSTRUCTIONS,
} from '@/game/narrativeContract';
import {
  generateImmersiveOpening,
  getQuickGenreFallback,
} from '@/game/openingNarrativeGenerator';
import {
  buildNPCIdentityContext,
  validateNPCRelationships,
  repairNPCRelationships,
} from '@/game/npcIdentityRegistry';
import {
  isPlayerCorrection,
  parsePlayerCorrection,
  applyPlayerCorrection,
  recordCorrection,
  generateCorrectionAcknowledgment,
  buildPlayerCorrectionsContext,
} from '@/game/playerCorrectionSystem';
import {
  processNarrativeForNPCs,
  getRecentlyRegisteredNPCContext,
  getAllNPCPersonalityContext,
  setNPCAutoRegistrationGenre,
} from '@/game/npcAutoRegistration';
import {
  getNPCPersonality,
} from '@/game/npcPersonalityDialogue';
import { getPersonalityById } from '@/game/npcPersonalityTemplates';
import { 
  getAllRegisteredNPCs 
} from '@/game/npcIdentityRegistry';
import {
  buildConsequenceContext,
  buildWorldStateContext,
} from '@/game/rippleEffectSystem';
import {
  setJournalContext,
  clearJournalContext,
} from '@/lib/relationshipJournal';
import {
  LivingWorldEngine,
  buildLivingWorldContext,
  seedWorldForGenre,
  PropertySystem,
  RivalSystem,
  FactionSystem,
} from '@/game/livingWorld';
import { useGameLoop } from '@/hooks/useGameLoop';
import { UrbanZone, UrbanLocation } from '@/types/urbanZone';
import { StoryEntry } from './types';
import { 
  validateGenerationState, 
  isEchoResponse, 
  cleanPlayerInputForPrompt, 
  getContextualFallback,
  logGenerationDebug,
  acquireGenerationLock,
  releaseGenerationLock,
  cancelPendingGeneration,
  isGenerationInProgress,
  forceReleaseLock
} from '@/lib/narrativeGuard';
import { detectMissingLootTags, detectMissingDropTags, detectMissingDamageTags, detectMissingHealTags, detectMissingGoldTags } from '@/lib/narrativeLootParser';
import { 
  runMoveSync, 
  initializeMoveSyncState, 
  buildMoveSyncContextForAI,
  getMoveSyncState,
} from '@/game/moveSyncSystem';
import { processNarrativeForCombatAchievements } from '@/game/combatAchievementBridge';
import { useSessionStatsOptional } from '@/components/game/SessionStats';
import { buildClothingArmorContextForAI } from '@/game/clothingGameplayIntegration';
import { 
  incrementLifetimeStat, 
  recordGenrePlayed 
} from '@/lib/lifetimeStats';
import {
  DirectorSettings,
  DEFAULT_DIRECTOR_SETTINGS,
  buildDirectorPromptBlock,
  buildDirectorNarratorPrompt,
  getDirectorOpeningStyle,
} from '@/game/directorModeSystem';
import { useStreamingNarrative } from '@/hooks/useStreamingNarrative';
import {
  updateCompanionTurnTracking,
  getNextReadyCompanion,
  markCompanionDisplayed,
  buildCompanionIntroductionContext,
  markContextTrigger,
  PendingCompanionWithTiming,
} from '@/game/companionTimingSystem';

// Helper functions (formatEmotionalContext, buildBackgroundNPCActionsContext) moved to useNarrativeGeneration hook

import { GameMechanics } from './types';

type GamePhase = 'loading' | 'recovery' | 'scenario' | 'color' | 'character' | 'narrator' | 'playing';

import { STORAGE_KEYS } from '@/lib/storageKeys';

const STORY_KEY = STORAGE_KEYS.ADVENTURE_STORY;
const CHARACTER_KEY = STORAGE_KEYS.ADVENTURE_CHARACTER;
const SCENARIO_KEY = STORAGE_KEYS.ADVENTURE_SCENARIO;
const GENRE_KEY = STORAGE_KEYS.ADVENTURE_GENRE;
const COLOR_KEY = STORAGE_KEYS.UI_COLOR_THEME;

// Helper to sanitize character for API - strips large base64 data to reduce payload size
function sanitizeCharacterForAPI(char: RPGCharacter): RPGCharacter {
  const charAny = char as any;
  return {
    ...char,
    // Strip large base64 portrait data (>500 chars typically means base64)
    portraitUrl: charAny.portraitUrl && charAny.portraitUrl.length > 500 ? null : charAny.portraitUrl,
    // Limit appearance description length
    appearanceDescription: charAny.appearanceDescription?.slice(0, 2000) || null,
  } as RPGCharacter;
}

export function AdventureGame() {
  const navigate = useNavigate();
  const { 
    setDiceMode, 
    initializeCampaign, 
    restoreCampaignFromSave, 
    campaignMemory, 
    getCampaignContext, 
    advanceCampaignTime, 
    updateCampaignMemory, 
    emotionalState, 
    settings,
    updateSettings,
    diceMode,
    // World Bible
    initializeWorldBible,
    validateContent,
    getEnhancedPromptWithContract,
    worldBible,
    restoreWorldBible,
    // Pressure Clock System
    pressureState,
    getPressureContext,
    processNarrativeForPressure,
    tickPressureClocks,
    // NPC Motivation System
    getNPCMotivation,
    recordNPCInteraction,
    getNPCMotivationContext,
    // Memory Bite System
    createBite,
    getBitesForNPC,
    getUnsurfacedBitesForNPC,
    surfaceBite,
    getSurfaceNarrativeForBite,
    processNarrativeForBites,
    getBiteContext,
  } = useGame();
  
  // Campaign context (optional - may not be available)
  const campaignContext = useCampaignOptional();
  
  // Session stats for tracking gameplay metrics
  const sessionStats = useSessionStatsOptional();
  
  // Inventory system integration
  const inventory = useInventory();
  
  // Initial loading state - quick initialization
  const [initialLoading, setInitialLoading] = useState(true);

  // Load saved state - also check campaign system
  const [phase, setPhase] = useState<GamePhase>('loading');
  
  const [selectedColorId, setSelectedColorId] = useState<string | null>(() => getSavedColorId());
  const [scenarioSelection, setScenarioSelection] = useState<ScenarioSelection | null>(null);
  
  // Character and story - will be initialized from campaign or localStorage
  const [character, setCharacter] = useState<RPGCharacter | null>(null);
  const [story, setStory] = useState<StoryEntry[]>([]);
  
  // === USE HOOKS FOR EXTRACTED LOGIC ===
  // Weather and time system (replaces ~40 lines of inline sync logic)
  const { weatherState, setWeatherState, timeState, setTimeState } = useWeatherTimeSystem({
    isPlaying: phase === 'playing',
  });
  
  // Director settings (replaces ~20 lines of inline sync logic)
  const { directorSettings, setDirectorSettings } = useDirectorSettings({
    isPlaying: phase === 'playing',
  });
  
  // Track if we need to generate initial narrative for a restored campaign with empty history
  const needsInitialNarrative = useRef<boolean>(false);
  const hasInitialized = useRef<boolean>(false);
  
  // === WORLD REGENERATION & LOCK SYSTEM ===
  // Track if the starting world is locked (after regeneration or 2nd player action)
  const [worldLocked, setWorldLocked] = useState<boolean>(false);
  // Track the locked opening narrative for fallback
  const [lockedOpening, setLockedOpening] = useState<string | null>(null);
  // Count player actions to know when to lock world
  const playerActionCount = useRef<number>(0);
  // Pending character awaiting narrator settings confirmation
  const [pendingCharacter, setPendingCharacter] = useState<(RPGCharacter & { portraitUrl?: string }) | null>(null);
  
  // First-time wizard state
  const { shouldShow: shouldShowWizard } = useFirstTimeWizard();
  const [showWizard, setShowWizard] = useState(shouldShowWizard);
  
  // Initialize from active campaign or localStorage after initial loading completes
  useEffect(() => {
    // Skip if not done loading or already initialized
    if (initialLoading || hasInitialized.current) return;
    // Skip if not in loading phase
    if (phase !== 'loading') return;
    // Wait for campaign context to finish initializing
    if (campaignContext && !campaignContext.isInitialized) return;
    
    hasInitialized.current = true;
    
    // First check if there's an active campaign in the new system
    if (campaignContext?.activeCampaign) {
      const campaign = campaignContext.activeCampaign;
      console.log('[AdventureGame] Restoring active campaign:', campaign.meta.name);
      
      // Set relationship journal context for this campaign + character
      setJournalContext(campaign.id, campaign.player.name);
      
      // Migrate character health if needed (for old characters with low HP)
      const migratedPlayer = migrateCharacterHealth(campaign.player);
      
      // Character inventory is now stored in campaign.player - no global sync needed
      
      setCharacter(migratedPlayer);
      setStory(campaign.narrativeHistory);
      setScenarioSelection({
        scenario: campaign.scenario,
        genre: campaign.meta.primaryGenre,
        genreTitle: campaign.meta.name,
        diceMode: loadDiceMode(),
      });
      
      // Rebuild character visual profile from saved character data
      const playerAny = migratedPlayer as any;
      const restoredVisualProfile = buildCharacterVisualProfile({
        name: migratedPlayer.name,
        gender: playerAny.gender || 'male',
        role: playerAny.role || migratedPlayer.classId || 'soldier',
        build: playerAny.build,
        skinTone: playerAny.skinTone,
        hairColor: playerAny.hairColor,
        hairStyle: playerAny.hairStyle,
        eyeColor: playerAny.eyeColor,
        details: playerAny.details,
      }, campaign.meta.primaryGenre || 'fantasy');
      setCharacterVisualProfile(restoredVisualProfile);
      console.log('[Character Visual] Restored visual profile from campaign');
      
      // Restore world bible if available
      if (campaign.worldBible) {
        restoreWorldBible(JSON.stringify(campaign.worldBible));
      }
      
      // Restore weather state if available
      if (campaign.weatherState) {
        setWeatherState(campaign.weatherState);
        console.log('[AdventureGame] Restored weather:', campaign.weatherState.current);
      }
      
      // Restore time state if available
      if (campaign.timeState) {
        setTimeState(campaign.timeState);
        console.log('[AdventureGame] Restored time:', campaign.timeState.hour + ':' + campaign.timeState.minute);
      }
      
      // Restore director settings if available
      if (campaign.settings?.directorSettings) {
        setDirectorSettings(campaign.settings.directorSettings);
        console.log('[AdventureGame] Restored director settings:', campaign.settings.directorSettings.directorType);
      }
      
      // Check if we need to generate initial narrative (restored campaign with no history)
      if (campaign.narrativeHistory.length === 0) {
        console.log('[AdventureGame] Campaign has empty history, will generate initial narrative');
        needsInitialNarrative.current = true;
        setIsLoading(true);
      }
      
      setPhase('playing');
      return;
    }
    
    // Fall back to legacy localStorage check
    const savedChar = localStorage.getItem(CHARACTER_KEY);
    const savedStory = localStorage.getItem(STORY_KEY);
    const savedScenario = localStorage.getItem(SCENARIO_KEY);
    const savedGenre = localStorage.getItem(GENRE_KEY);
    
    if (savedChar && savedStory) {
      try {
        let char = JSON.parse(savedChar);
        const storyData = JSON.parse(savedStory);
        if (char && storyData.length > 0) {
          console.log('[AdventureGame] Restoring from localStorage');
          
          // Migrate character health if needed (for old characters with low HP)
          char = migrateCharacterHealth(char);
          
          // Character inventory is stored with character - no global sync needed
          
          setCharacter(char);
          setStory(storyData);
          if (savedScenario && savedGenre) {
            setScenarioSelection({
              scenario: savedScenario,
              genre: savedGenre as GameGenre,
              genreTitle: savedGenre,
              diceMode: loadDiceMode(),
            });
            
            // Rebuild character visual profile from localStorage character
            const charAny = char as any;
            const restoredVisualProfile = buildCharacterVisualProfile({
              name: char.name,
              gender: charAny.gender || 'male',
              role: charAny.role || char.classId || 'soldier',
              build: charAny.build,
              skinTone: charAny.skinTone,
              hairColor: charAny.hairColor,
              hairStyle: charAny.hairStyle,
              eyeColor: charAny.eyeColor,
              details: charAny.details,
            }, savedGenre as GameGenre);
            setCharacterVisualProfile(restoredVisualProfile);
          }
          setPhase('playing');
          return;
        }
      } catch (e) {
        console.error('[AdventureGame] Failed to parse localStorage save:', e);
      }
    }
    
    // Check if there are any saves - if so, show recovery prompt
    const recentSave = getMostRecentSave();
    if (recentSave) {
      console.log('[AdventureGame] Found recent save, showing recovery prompt');
      setPhase('recovery');
      return;
    }
    
    console.log('[AdventureGame] No saved state, starting fresh');
    setPhase('scenario');
  }, [initialLoading, phase, campaignContext?.activeCampaign, campaignContext?.isInitialized, restoreWorldBible]);
  
  // CRITICAL: Handle campaign switching - when a new campaign is loaded via Load Story,
  // this effect detects the campaign ID change and reinitializes the game state
  const lastCampaignIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentCampaignId = campaignContext?.activeCampaign?.id || null;
    
    // Skip if no campaign is active
    if (!currentCampaignId || !campaignContext?.activeCampaign) return;
    
    // Skip if this is the same campaign we already loaded
    if (lastCampaignIdRef.current === currentCampaignId) return;
    
    // A different campaign is now active - reinitialize!
    console.log('[AdventureGame] Campaign changed from', lastCampaignIdRef.current, 'to', currentCampaignId);
    lastCampaignIdRef.current = currentCampaignId;
    
    const campaign = campaignContext.activeCampaign;
    
    // Set relationship journal context for this campaign + character
    setJournalContext(campaign.id, campaign.player.name);
    
    // Migrate character health if needed
    const migratedPlayer = migrateCharacterHealth(campaign.player);
    
    setCharacter(migratedPlayer);
    setStory(campaign.narrativeHistory);
    setScenarioSelection({
      scenario: campaign.scenario,
      genre: campaign.meta.primaryGenre,
      genreTitle: campaign.meta.name,
      diceMode: loadDiceMode(),
    });
    
    // Rebuild character visual profile from saved character data
    const playerAny = migratedPlayer as any;
    const restoredVisualProfile = buildCharacterVisualProfile({
      name: migratedPlayer.name,
      gender: playerAny.gender || 'male',
      role: playerAny.role || migratedPlayer.classId || 'soldier',
      build: playerAny.build,
      skinTone: playerAny.skinTone,
      hairColor: playerAny.hairColor,
      hairStyle: playerAny.hairStyle,
      eyeColor: playerAny.eyeColor,
      details: playerAny.details,
    }, campaign.meta.primaryGenre || 'fantasy');
    setCharacterVisualProfile(restoredVisualProfile);
    
    // Restore world bible if available
    if (campaign.worldBible) {
      restoreWorldBible(JSON.stringify(campaign.worldBible));
    }
    
    // Restore weather state if available
    if (campaign.weatherState) {
      setWeatherState(campaign.weatherState);
    }
    
    // Restore time state if available
    if (campaign.timeState) {
      setTimeState(campaign.timeState);
    }
    
    // Restore director settings if available
    if (campaign.settings?.directorSettings) {
      setDirectorSettings(campaign.settings.directorSettings);
    }
    
    // Check if we need to generate initial narrative
    if (campaign.narrativeHistory.length === 0) {
      needsInitialNarrative.current = true;
      setIsLoading(true);
    }
    
    // Transition to playing phase
    setPhase('playing');
    console.log('[AdventureGame] Campaign switched, now playing:', campaign.meta.name);
  }, [campaignContext?.activeCampaign?.id, restoreWorldBible]);

  // === CAMPAIGN SYNC HOOK ===
  // Handles bidirectional sync between local state and campaign (replaces ~90 lines of inline sync logic)
  useCampaignSync({
    isPlaying: phase === 'playing',
    story,
    character,
    setStory,
    setCharacter,
  });
  
  // === PLAYER STATE SYNC HOOK ===
  // Handles HP, XP, currency sync with playerStateManager (replaces ~50 lines of inline sync logic)
  usePlayerStateSync({
    character,
    isPlaying: phase === 'playing',
    setCharacter,
  });

  // isLoading and pendingMechanics are now managed by useNarrativeGeneration hook (see below)
  const [cheatMode, setCheatMode] = useState(false);
  const [characterVisualProfile, setCharacterVisualProfile] = useState<CharacterVisualProfile | null>(null);
  
  // === SCENE ILLUSTRATION HOOK ===
  // Handles scene image generation (replaces ~70 lines of inline logic)
  const {
    sceneImageUrl,
    isGeneratingScene,
    generateSceneIllustration,
    checkSceneTriggers,
    closeSceneImage,
    generatingImageFor,
    setGeneratingImageFor,
  } = useSceneIllustration({
    genre: scenarioSelection?.genre || 'fantasy',
    characterVisualProfile,
    story,
    weatherState,
    timeState,
    worldBible,
    sceneIllustrationsEnabled: settings.sceneIllustrations,
  });
  
  // Streaming narrative hook for word-by-word AI response
  const streamingNarrative = useStreamingNarrative();
  
  // Helper to build streaming request body (simplified version for streaming)
  const buildStreamingRequestBody = useCallback(async (
    scenario: string,
    playerAction: string,
    history: StoryEntry[],
    diceRoll: any,
    char: RPGCharacter,
    context?: { isNewScene?: boolean; justFinishedCombat?: boolean; justRested?: boolean; locationChanged?: boolean }
  ): Promise<Record<string, any>> => {
    // Build minimal but complete request for streaming
    const conversationHistory = history.slice(-6).map(entry => ({
      role: entry.role === 'user' ? 'user' : 'narrator',
      content: entry.content.slice(0, 2000), // Truncate for speed
    }));
    
    // Check for pending companion that should appear
    const pendingCompanion = getNextReadyCompanion({
      turnNumber: campaignMemory?.campaign.currentTick || 0,
      isNewScene: context?.isNewScene,
      justFinishedCombat: context?.justFinishedCombat,
      justRested: context?.justRested,
      locationChanged: context?.locationChanged,
      narrativeContext: history.slice(-1)[0]?.content,
    });
    
    const companionContext = pendingCompanion 
      ? buildCompanionIntroductionContext(pendingCompanion)
      : null;
    
    return {
      scenario: scenario.slice(0, 1000),
      playerAction: cleanPlayerInputForPrompt(playerAction),
      conversationHistory,
      character: {
        name: char.name,
        classId: char.classId,
        backgroundId: char.backgroundId,
        traits: char.traits?.slice(0, 3) || [],
        stats: char.stats,
        maxHealth: char.maxHealth,
        currentHealth: char.currentHealth,
        level: char.level,
        inventory: char.inventory?.slice(0, 10).map(i => ({ name: i.name, quantity: i.quantity || 1 })) || [],
        abilities: char.abilities?.slice(0, 5) || [],
        skills: char.skills?.slice(0, 5) || [],
        gold: char.gold || 0,
      },
      adultContent: settings.adultContent,
      diceResult: diceRoll,
      stream: true, // Request streaming response
      // Include pending companion context if one should appear
      ...(companionContext && { pendingCompanionIntroduction: companionContext }),
      ...(pendingCompanion && { pendingCompanionId: pendingCompanion.companionId }),
    };
  }, [settings.adultContent, campaignMemory?.campaign.currentTick]);

  // lastFailedAction is now managed by useNarrativeGeneration hook
  const [retryRequested, setRetryRequested] = useState(false);
  
  // Mood state for narrative integration
  const [currentMood, setCurrentMood] = useState<CoreMoodType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_MOOD);
      if (saved) return JSON.parse(saved) as CoreMoodType;
    } catch {}
    return 'neutral';
  });
  const [moodHistory, setMoodHistory] = useState<Array<{ mood: CoreMoodType; timestamp: number; chapter: number; trigger: string }>>([]);
  
  // Tone adaptation system state
  const [toneState, setToneState] = useState<ToneState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TONE_STATE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return createInitialToneState();
  });
  
  // Language barrier system state
  const [languageState, setLanguageState] = useState<LanguageSystemState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE_STATE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return createLanguageSystemState();
  });
  
  // === GAME LOOP: Manages ripples, world state, rumors, NPCs ===
  const [gameLoopState, gameLoopActions] = useGameLoop({
    initialTurn: campaignMemory?.campaign.currentTick || 0,
    playerHealth: character?.currentHealth,
    playerMaxHealth: character?.maxHealth,
  });
  
  // Destructure for easier access
  const { worldState, narrativeQueue, activeRumors, sceneNPCs, playerLocation, activeConsequences } = gameLoopState;
  const { processPlayerAction: processActionForRipples, advanceTurn, setSceneNPCs, moveToZone, getLocationContext } = gameLoopActions;
  
  // Helper to get time of day based on in-game time state (not real time)
  const getTimeOfDay = useCallback((): TimeOfDayPeriod => {
    return getGameTimeOfDay(timeState.hour);
  }, [timeState.hour]);
  
  // Persist mood changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_MOOD, JSON.stringify(currentMood));
  }, [currentMood]);
  
  // Persist tone state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TONE_STATE, JSON.stringify(toneState));
  }, [toneState]);
  
  // Persist language state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE_STATE, JSON.stringify(languageState));
  }, [languageState]);
  
  // Sync language settings from GameContext
  useEffect(() => {
    if (settings.languageSettings) {
      setLanguageState(prev => ({
        ...prev,
        translateEnabled: settings.languageSettings.translateEnabled,
        playerKnownLanguages: settings.languageSettings.playerKnownLanguages || prev.playerKnownLanguages,
      }));
    }
  }, [settings.languageSettings]);
  
  // === PERIODIC VALIDATION: Run every 5 turns to catch drift ===
  // Note: Object registry validation removed - using campaign-isolated inventory system
  const lastValidationTurn = useRef<number>(0);
  useEffect(() => {
    const currentTurn = campaignMemory?.campaign.currentTick || 0;
    
    // Only run validation every 5 turns
    if (currentTurn - lastValidationTurn.current < 5) return;
    lastValidationTurn.current = currentTurn;
    
    console.log(`[Consistency Validation] Running at turn ${currentTurn}...`);
    
    // Validate NPC relationships
    const npcErrors = validateNPCRelationships();
    if (npcErrors.length > 0) {
      console.warn('[Consistency] NPC relationship errors detected:', npcErrors);
      repairNPCRelationships(npcErrors);
      toast.info(`Fixed ${npcErrors.length} NPC consistency issue(s)`, { duration: 3000 });
    }
    
    if (npcErrors.length === 0) {
      console.log('[Consistency Validation] No issues found.');
    }
  }, [campaignMemory?.campaign.currentTick]);
  
  const handleMoodChange = useCallback((mood: CoreMoodType) => {
    const prevMood = currentMood;
    setCurrentMood(mood);
    setMoodHistory(prev => [...prev.slice(-19), {
      mood,
      timestamp: Date.now(),
      chapter: campaignMemory?.campaign.currentTick || 1,
      trigger: 'manual_selection'
    }]);
    if (mood !== prevMood) {
      toast.success(`Mood changed to ${mood}`);
    }
  }, [currentMood, campaignMemory]);

  // Quick initial loading - just apply color theme
  useEffect(() => {
    loadColorPreference();
    // Minimal loading time - just enough for visual polish
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const saveData = useCallback((newStory: StoryEntry[], newCharacter: RPGCharacter, scenario: string, genre: GameGenre) => {
    // Proactive cleanup before save to prevent QuotaExceededError
    checkAndCleanupStorage();
    
    const attemptSave = () => {
      // Use compressed storage for story (largest data structure)
      compressAndStore(STORY_KEY, newStory);
      localStorage.setItem(CHARACTER_KEY, JSON.stringify(newCharacter));
      localStorage.setItem(SCENARIO_KEY, scenario);
      localStorage.setItem(GENRE_KEY, genre);
    };
    
    try {
      attemptSave();
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[SaveData] Quota exceeded, performing aggressive cleanup...');
        performCleanup(0.4); // Aggressive cleanup
        
        try {
          attemptSave();
          console.log('[SaveData] Save succeeded after cleanup');
        } catch (retryError) {
          console.error('[SaveData] Still failed after cleanup:', retryError);
          // Show user notification but don't crash - the game can still function
          toast.warning('Storage full. Some progress may not save locally. Consider clearing browser data or syncing to cloud.');
        }
      } else {
        console.error('[SaveData] Unexpected save error:', e);
      }
    }
    
    // Also sync to campaign system if available (this is more robust)
    if (campaignContext?.activeCampaign) {
      campaignContext.updatePlayer(newCharacter);
      // Note: narrative entries are added individually via addNarrativeEntry
    }
  }, [campaignContext]);

  // Scene illustration is now handled by useSceneIllustration hook

  // === NARRATIVE GENERATION HOOK ===
  // Handles AI narrative generation with retry logic (replaces ~650 lines of inline code)
  const {
    isLoading,
    lastFailedAction,
    pendingMechanics,
    latestMechanicsRef, // Synchronous mirror — fixes inventory race condition
    generateNarrative,
    setLastFailedAction,
    setPendingMechanics,
    setIsLoading,
  } = useNarrativeGeneration({
    character,
    scenarioSelection,
    cheatMode,
    settings: {
      adultContent: settings.adultContent,
      enableMoodSystem: settings.enableMoodSystem,
      enableWeatherEffects: settings.enableWeatherEffects,
      narratorConfig: settings.narratorConfig,
      directorSettings: settings.directorSettings,
    },
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
  });

  // === ZONE TRANSITION HANDLER ===
  // Generates narrative description when player moves to a new zone
  const handleZoneTransition = useCallback(async (
    newZone: UrbanZone,
    newLocation?: UrbanLocation | null,
    travelTime?: number
  ) => {
    if (!character || !scenarioSelection) return;
    
    // Store previous location for transition context
    const previousZone = {
      name: playerLocation.zoneName,
      type: playerLocation.zoneType,
      atmosphere: 'urban',
    };
    
    // Move to new zone (updates game loop state)
    moveToZone(newZone, newLocation);
    
    // Build zone transition context for AI
    const locationTransitionContext = {
      previousZone: previousZone.name !== newZone.name ? previousZone : undefined,
      currentZone: {
        name: newZone.name,
        type: newZone.type,
        description: newZone.description,
        atmosphere: newZone.atmosphere?.socialTone || 'neutral',
        crowdDensity: newZone.atmosphere?.crowdDensity || 'moderate',
        lighting: newZone.atmosphere?.lighting || 'well_lit',
        socialTone: newZone.atmosphere?.socialTone || 'neutral',
        surveillanceLevel: newZone.surveillance?.level || 30,
      },
      travelTime: travelTime || (newZone.travelTime ? Object.values(newZone.travelTime)[0] : 15),
      timeOfDay: getTimeOfDay() as 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night',
      isNewArrival: true,
      activeConsequences: activeConsequences.map(c => c.description),
      locationHistory: getLocationContext(),
    };
    
    setIsLoading(true);
    
    try {
      // Call AI to describe the transition
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            scenario: scenarioSelection.scenario,
            playerAction: `travel to ${newZone.name}`,
            conversationHistory: story.slice(-10).map(e => ({ role: e.role, content: e.content })),
            character: sanitizeCharacterForAPI(character),
            adultContent: settings.adultContent,
            genreContract: worldBible?.contractSummary || null,
            narratorConfig: settings.narratorConfig,
            locationContext: locationTransitionContext,
            // Include consistency context for zone transitions too
            consistencyContext: {
              objectOwnership: buildInventoryContextForAI(inventory.state),
              npcIdentity: buildNPCIdentityContext(),
              playerCorrections: buildPlayerCorrectionsContext(),
            },
            // Narrative contract for immersive zone transitions
            narrativeContractContext: {
              universalRules: UNIVERSAL_NARRATIVE_RULES,
              genreBible: `===== GENRE BIBLE =====\n${GENRE_BIBLE[scenarioSelection.genre] || GENRE_BIBLE['fantasy']}`,
              spawnPacket: null,
              isOpening: false,
            },
            // Time context for time-aware narrative
            timeContext: buildTimeContext(timeState),
            // Director context for zone transitions
            directorContext: settings.directorSettings ? {
              enabled: settings.directorSettings.enabled,
              rawGame: settings.directorSettings.rawGame,
              mode: settings.directorSettings.mode,
              directorType: settings.directorSettings.directorType,
              tightness: settings.directorSettings.tightness,
              descriptionLevel: settings.directorSettings.descriptionLevel,
              cruelty: settings.directorSettings.cruelty,
              weirdness: settings.directorSettings.weirdness,
              guidance: settings.directorSettings.guidance,
            } : undefined,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.narrative) {
        // Add transition narrative to story
        const transitionEntry: StoryEntry = {
          id: `narrator_${Date.now()}`,
          role: 'narrator',
          content: data.narrative,
          timestamp: Date.now(),
        };
        
        setStory(prev => [...prev, transitionEntry]);
        
        // Add to campaign if available
        if (campaignContext) {
          campaignContext.addNarrativeEntry(transitionEntry);
        }
        
        // FIX: Run the same post-processing pipeline that handlePlayerAction uses
        // (previously zone transitions skipped NPC registration & ripple effects)
        try {
          const turnNow = campaignMemory?.campaign.currentTick || 0;
          processNarrativeForNPCs(data.narrative, turnNow, character.name);
          processActionForRipples(`travel to ${newZone.name}`, false, 3);
        } catch (e) {
          console.warn('[Zone Transition] Post-processing failed:', e);
        }
        
        // Advance turn
        advanceTurn(travelTime || 15);
        
        toast.success(`Arrived at ${newZone.name}`);
      }
    } catch (error) {
      console.error('[Zone Transition] Error generating narrative:', error);
      
      // Fallback narrative
      const fallbackEntry: StoryEntry = {
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: `You make your way to ${newZone.name}. ${newZone.description || 'The area stretches before you, full of new possibilities.'}`,
        timestamp: Date.now(),
      };
      
      setStory(prev => [...prev, fallbackEntry]);
      advanceTurn(travelTime || 15);
    } finally {
      setIsLoading(false);
    }
  }, [character, scenarioSelection, playerLocation, moveToZone, activeConsequences, getLocationContext, story, settings.adultContent, worldBible, campaignContext, advanceTurn]);

  // Generate initial narrative for campaigns with empty history
  // Track the campaign ID we're generating for to prevent duplicate calls
  const generatingForCampaignId = useRef<string | null>(null);
  
  useEffect(() => {
    // Must be in playing phase with the flag set
    if (phase !== 'playing' || !needsInitialNarrative.current) return;
    // Must have required data
    if (!character || !scenarioSelection) return;
    
    // Get current campaign ID
    const currentCampaignId = campaignContext?.activeCampaign?.id || 'local';
    
    // Prevent duplicate calls for the same campaign
    if (generatingForCampaignId.current === currentCampaignId) return;
    
    // Mark as generating for this campaign and clear the flag
    generatingForCampaignId.current = currentCampaignId;
    needsInitialNarrative.current = false;
    
    console.log('[AdventureGame] Generating initial narrative for campaign:', currentCampaignId);
    
    // Get secondary genres from world bible for fallback
    const secondaryGenres = worldBible?.secondaryGenres || [];
    
    // Use an IIFE with timeout protection
    (async () => {
      const TIMEOUT_MS = 8000; // 8 second timeout
      
      try {
        // Race between API call and timeout
        const fetchPromise = fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              scenario: scenarioSelection.scenario,
              conversationHistory: [],
              character: sanitizeCharacterForAPI(character),
              adultContent: settings.adultContent,
              genreContract: worldBible?.contractSummary || null,
              narratorConfig: settings.narratorConfig,
              // Narrative contract for immersive opening scene
              narrativeContractContext: (() => {
                const characterClass = character.classId || 'default';
                const characterInventory = (character.inventory || []).map(i => ({
                  name: i.name,
                  quantity: i.quantity || 1,
                }));
                
                const spawnPacket = buildSpawnPacket(
                  scenarioSelection.scenario,
                  scenarioSelection.genre,
                  characterClass,
                  character.name,
                  characterInventory,
                  'Starting Location'
                );
                
                return {
                  universalRules: UNIVERSAL_NARRATIVE_RULES,
                  genreBible: `===== GENRE BIBLE =====\n${GENRE_BIBLE[scenarioSelection.genre] || GENRE_BIBLE['fantasy']}`,
                  spawnPacket: formatSpawnPacket(spawnPacket),
                  isOpening: true,
                };
              })(),
              // Time context for time-aware opening narrative
              timeContext: buildTimeContext(timeState),
              // Director context for initial narrative
              directorContext: settings.directorSettings ? {
                enabled: settings.directorSettings.enabled,
                rawGame: settings.directorSettings.rawGame,
                mode: settings.directorSettings.mode,
                directorType: settings.directorSettings.directorType,
                tightness: settings.directorSettings.tightness,
                descriptionLevel: settings.directorSettings.descriptionLevel,
                cruelty: settings.directorSettings.cruelty,
                weirdness: settings.directorSettings.weirdness,
                guidance: settings.directorSettings.guidance,
              } : undefined,
            }),
          }
        );
        
        const timeoutPromise = new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
        );
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[AdventureGame] Received narrative response:', !!data.narrative);
        
        const narrativeContent = data.narrative || generateImmersiveOpening({
          character,
          genre: scenarioSelection.genre,
          scenario: scenarioSelection.scenario,
          secondaryGenres,
        });
        
        const newStory: StoryEntry[] = [{
          id: `narrator_${Date.now()}`,
          role: 'narrator',
          content: narrativeContent,
          timestamp: Date.now(),
        }];
        
        setStory(newStory);
        saveData(newStory, character, scenarioSelection.scenario, scenarioSelection.genre);
        
        if (campaignContext) {
          campaignContext.addNarrativeEntry(newStory[0]);
        }
        
        console.log('[AdventureGame] Initial narrative set successfully');
      } catch (error) {
        console.error('[AdventureGame] Failed to generate initial narrative:', error);
        
        // Use genre-specific fallback (always works, never blocks)
        const fallbackContent = generateImmersiveOpening({
          character,
          genre: scenarioSelection.genre,
          scenario: scenarioSelection.scenario,
          secondaryGenres,
        });
        
        const fallbackStory: StoryEntry[] = [{
          id: `narrator_${Date.now()}`,
          role: 'narrator',
          content: fallbackContent,
          timestamp: Date.now(),
        }];
        setStory(fallbackStory);
        saveData(fallbackStory, character, scenarioSelection.scenario, scenarioSelection.genre);
        if (campaignContext) {
          campaignContext.addNarrativeEntry(fallbackStory[0]);
        }
      } finally {
        if (generatingForCampaignId.current === currentCampaignId) {
          generatingForCampaignId.current = null;
        }
        setIsLoading(false);
      }
    })();
  }, [phase, character, scenarioSelection, saveData, campaignContext, settings.adultContent, worldBible]);

  // Step 1: Scenario selection -> Color selection
  const handleScenarioSelect = useCallback((selection: ScenarioSelection) => {
    setScenarioSelection(selection);
    // Set the dice mode in the game context
    setDiceMode(selection.diceMode);
    
    // Convert secondary genres from percentage (0-50) to decimal (0-0.50) for World Bible
    const secondaryGenreBlends = (selection.genreContract?.secondaryGenres || []).map(sg => ({
      genreId: sg.genreId,
      blendStrength: sg.blendStrength / 100, // Convert percentage to decimal
      blendBehavior: 'additive' as const,
    }));
    
    // Initialize World Bible (Genre Contract System) with full genre contract
    initializeWorldBible({
      campaignName: selection.genreTitle || selection.scenario.slice(0, 50),
      primaryGenre: selection.genreContract?.primaryGenre || selection.genre,
      secondaryGenres: secondaryGenreBlends,
      hardLock: selection.genreContract?.hardLock || false,
      tabooList: [],
      intrusionBudget: 2,
    });
    console.log(`[World Bible] Created for genre: ${selection.genreContract?.primaryGenre || selection.genre} with ${secondaryGenreBlends.length} secondary genres`);
    
    // Initialize Move Sync state for per-action tracking
    initializeMoveSyncState({
      primaryGenre: (selection.genreContract?.primaryGenre || selection.genre) as GameGenre,
      secondaryGenres: secondaryGenreBlends.map(sg => ({
        genre: sg.genreId as GameGenre,
        strength: Math.round(sg.blendStrength * 100),
      })),
    });
    console.log(`[MoveSync] Initialized for ${selection.genreContract?.primaryGenre || selection.genre}`);
    
    // Skip color selection if already chosen before
    if (selectedColorId) {
      setPhase('character');
    } else {
      setPhase('color');
    }
  }, [selectedColorId, setDiceMode, initializeWorldBible]);

  // Step 2: Color selection complete
  const handleColorSelect = useCallback((colorId: string) => {
    setSelectedColorId(colorId);
    setPhase('character');
  }, []);

  // Step 2: Character creation complete -> show narrator settings before starting
  const handleCharacterComplete = useCallback(async (char: RPGCharacter & { portraitUrl?: string }, scenario: string) => {
    if (!scenarioSelection) {
      console.error('[AdventureGame] handleCharacterComplete called without scenarioSelection');
      return;
    }
    
    // Store character temporarily and show narrator settings modal
    setPendingCharacter(char);
    setPhase('narrator');
    console.log('[AdventureGame] Character created, showing narrator settings');
  }, [scenarioSelection]);

  // Step 3: Narrator settings confirmed -> start game
  const handleNarratorConfirm = useCallback(async (settings: DirectorSettings) => {
    const char = pendingCharacter;
    if (!char || !scenarioSelection) {
      console.error('[AdventureGame] handleNarratorConfirm called without pending character or scenario');
      return;
    }
    
    // Store the director settings
    setDirectorSettings(settings);
    
    // Clear pending character
    setPendingCharacter(null);
    
    // CRITICAL: Set character and transition to playing phase immediately
    setCharacter(char);
    setPhase('playing');
    setIsLoading(true);
    
    // Build and store character visual profile for consistent scene illustrations
    const charAny = char as any;
    const visualProfile = buildCharacterVisualProfile({
      name: char.name,
      gender: charAny.gender || 'male',
      role: charAny.role || char.classId || 'soldier',
      build: charAny.build,
      skinTone: charAny.skinTone,
      hairColor: charAny.hairColor,
      hairStyle: charAny.hairStyle,
      eyeColor: charAny.eyeColor,
      details: charAny.details,
    }, scenarioSelection.genre || 'fantasy');
    setCharacterVisualProfile(visualProfile);
    console.log('[Character Visual] Built visual profile:', visualProfile.fullVisualDescription.slice(0, 100) + '...');
    
    try {
      // Track lifetime stats for campaign start
      incrementLifetimeStat('campaignsStarted');
      if (scenarioSelection.genre) {
        recordGenrePlayed(scenarioSelection.genre);
      }
      
      // Initialize campaign memory for new adventure
      const campaignId = `campaign_${char.name}_${Date.now()}`;
      const toneProfile = scenarioSelection.genre ? [scenarioSelection.genre] : [];
      initializeCampaign(campaignId, char.name, toneProfile);
      console.log(`[Campaign Memory] Initialized new campaign: ${campaignId} for ${char.name}`);
      
      // Set NPC auto-registration genre for personality assignment
      if (scenarioSelection.genre) {
        setNPCAutoRegistrationGenre(scenarioSelection.genre);
      }
      
      // Set relationship journal context for this new campaign + character
      setJournalContext(campaignId, char.name);
      
      // Create campaign in new campaign system if available
      if (campaignContext && worldBible) {
        const newCampaign = await campaignContext.createCampaign(worldBible, char, scenarioSelection.scenario);
        console.log(`[Campaign System] Created campaign: ${newCampaign.meta.name}`);
        
        // Save director settings to the campaign
        campaignContext.updateCampaign({
          settings: {
            ...newCampaign.settings,
            directorSettings: settings,
          },
        });
        console.log(`[Campaign System] Saved director settings: ${settings.directorType}`);
      }

      // Generate narrative with timeout protection
      let narrative: string | null = null;
      try {
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Narrative generation timeout')), 30000)
        );
        narrative = await Promise.race([
          generateNarrative(scenarioSelection.scenario, undefined, [], undefined, char, true),
          timeoutPromise
        ]);
      } catch (genError) {
        console.error('[AdventureGame] Narrative generation failed:', genError);
      }
      
      // Create story entry (use blended fallback if narrative generation failed)
      // Use director-specific opening style if available
      const directorOpening = settings.enabled && !settings.rawGame 
        ? getDirectorOpeningStyle(settings.directorType)
        : undefined;
      // If AI narrative failed and we have a director opening, use that as the opening
      const narrativeContent = narrative || (directorOpening 
        ? `${directorOpening}\n\n${generateImmersiveOpening({
            character: char,
            genre: scenarioSelection.genre || 'fantasy',
            scenario: scenarioSelection.scenario,
            secondaryGenres: worldBible?.secondaryGenres || [],
          })}`
        : generateImmersiveOpening({
            character: char,
            genre: scenarioSelection.genre || 'fantasy',
            scenario: scenarioSelection.scenario,
            secondaryGenres: worldBible?.secondaryGenres || [],
          }));
      const newStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrativeContent,
        timestamp: Date.now(),
      }];
      setStory(newStory);
      saveData(newStory, char, scenarioSelection.scenario, scenarioSelection.genre || 'fantasy');
      
      // Add to campaign narrative history
      if (campaignContext) {
        campaignContext.addNarrativeEntry(newStory[0]);
      }
      
      console.log('[AdventureGame] Character created with director settings, game ready');
    } catch (error) {
      console.error('[AdventureGame] Character complete failed:', error);
      // Create fallback story so game can proceed
      const fallbackStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: generateImmersiveOpening({
          character: char,
          genre: scenarioSelection.genre || 'fantasy',
          scenario: scenarioSelection.scenario,
          secondaryGenres: worldBible?.secondaryGenres || [],
        }),
        timestamp: Date.now(),
      }];
      setStory(fallbackStory);
      saveData(fallbackStory, char, scenarioSelection.scenario, scenarioSelection.genre || 'fantasy');
    } finally {
      setIsLoading(false);
    }
  }, [pendingCharacter, scenarioSelection, generateNarrative, saveData, initializeCampaign, campaignContext, worldBible]);

  // Handler for skipping narrator settings
  const handleNarratorSkip = useCallback(() => {
    handleNarratorConfirm(DEFAULT_DIRECTOR_SETTINGS);
  }, [handleNarratorConfirm]);



  // Back to scenario selection
  const handleBackToScenario = useCallback(() => {
    setPhase('scenario');
    setScenarioSelection(null);
  }, []);

  // Player action during game
  const handlePlayerAction = useCallback(async (action: string, diceRoll?: any) => {
    if (!character || !scenarioSelection) return;
    
    const currentTurn = campaignMemory?.campaign.currentTick || 0;
    
    // === PLAYER CORRECTION HANDLING ===
    // Check if this is a meta-correction command (e.g., "AI correct: X and Y are siblings")
    if (isPlayerCorrection(action)) {
      const correction = parsePlayerCorrection(action);
      if (correction) {
        const result = applyPlayerCorrection(correction, currentTurn);
        recordCorrection(correction, result, currentTurn);
        
        // Generate acknowledgment response
        const acknowledgment = generateCorrectionAcknowledgment(correction, result);
        
        // Add correction as a system entry
        const correctionEntry: StoryEntry = {
          id: `narrator_${Date.now()}`,
          role: 'narrator',
          content: acknowledgment,
          timestamp: Date.now(),
        };
        
        const updatedStory = [...story, correctionEntry];
        setStory(updatedStory);
        saveData(updatedStory, character, scenarioSelection.scenario, scenarioSelection.genre);
        
        if (campaignContext) {
          campaignContext.addNarrativeEntry(correctionEntry);
        }
        
        if (result.success) {
          toast.success('Correction applied');
        } else {
          toast.error(result.message);
        }
        
        return; // Don't process as regular narrative
      }
    }

    // === WORLD LOCK: Increment player action count and lock after 2nd action ===
    playerActionCount.current += 1;
    if (playerActionCount.current >= 2 && !worldLocked) {
      console.log('[WorldLock] Locking world after 2nd player action');
      setWorldLocked(true);
      // Store current opening as fallback
      if (story.length > 0 && story[0].role === 'narrator' && !lockedOpening) {
        setLockedOpening(story[0].content);
      }
    }

    const playerEntry: StoryEntry = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: action,
      timestamp: Date.now(),
    };
    
    const updatedStory = [...story, playerEntry];
    setStory(updatedStory);
    
    // === STATS TRACKING: Record player choice ===
    if (sessionStats) {
      sessionStats.incrementStat('choicesMade');
    }
    
    // Add player action to campaign narrative
    if (campaignContext) {
      campaignContext.addNarrativeEntry(playerEntry);
    }
    
    // === RIPPLE EFFECT: Process player action for consequences ===
    // Detect if this action should trigger world consequences
    const isPublicAction = worldState.securityLevel !== 'normal' || action.toLowerCase().includes('public');
    processActionForRipples(action, isPublicAction, 5);
    
    // Advance game loop turn (processes pending ripples, decays grudges, spreads rumors)
    advanceTurn(1);
    
    // === COMPANION TIMING: Update turn tracking for pending companions ===
    updateCompanionTurnTracking();

    // Check if streaming is enabled (typewriter mode implies streaming support)
    const useStreaming = settings.typewriterEnabled && settings.textSpeed !== 'instant';
    
    let narrative: string | null = null;
    
    if (useStreaming) {
      // === STREAMING NARRATIVE GENERATION ===
      console.log('[handlePlayerAction] Using streaming narrative generation');
      setIsLoading(true);
      
      const streamResult = await streamingNarrative.streamNarrative(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        await buildStreamingRequestBody(scenarioSelection.scenario, action, updatedStory, diceRoll, character),
        {
          onComplete: (fullContent, mechanics) => {
            console.log('[handlePlayerAction] Streaming complete, mechanics:', mechanics);
            
            // Apply fallback detection for damage, heal, gold when streaming
            let enhancedMechanics = mechanics ? { ...(mechanics as Record<string, unknown>) } : {} as Record<string, unknown>;
            
            if (fullContent) {
              // === FALLBACK DAMAGE DETECTION (streaming) ===
              const detectedDamage = detectMissingDamageTags(fullContent, enhancedMechanics.damage as number | undefined, { minConfidence: 'high' });
              if (detectedDamage !== null) {
                console.log('[handlePlayerAction] Streaming fallback damage:', detectedDamage);
                enhancedMechanics.damage = detectedDamage;
              }
              
              // === FALLBACK HEAL DETECTION (streaming) ===
              const detectedHeal = detectMissingHealTags(fullContent, enhancedMechanics.heal as number | undefined, { minConfidence: 'high' });
              if (detectedHeal !== null) {
                console.log('[handlePlayerAction] Streaming fallback heal:', detectedHeal);
                enhancedMechanics.heal = detectedHeal;
              }
              
              // === FALLBACK GOLD DETECTION (streaming) ===
              const detectedGold = detectMissingGoldTags(fullContent, enhancedMechanics.goldGained as number | undefined, { minConfidence: 'high' });
              if (detectedGold !== null) {
                console.log('[handlePlayerAction] Streaming fallback gold:', detectedGold);
                enhancedMechanics.goldGained = detectedGold;
              }
              
              // === FALLBACK LOOT DETECTION (streaming) ===
              const existingLoot = Array.isArray(enhancedMechanics.lootGained) 
                ? enhancedMechanics.lootGained 
                : (enhancedMechanics.lootGained ? [enhancedMechanics.lootGained] : []);
              const detectedLoot = detectMissingLootTags(fullContent, existingLoot, { minConfidence: 'high' });
              if (detectedLoot.length > 0) {
                console.log('[handlePlayerAction] Streaming fallback loot:', detectedLoot);
                enhancedMechanics.lootGained = [...existingLoot, ...detectedLoot];
              }
            }
            
            if (Object.keys(enhancedMechanics).length > 0) {
              // Update synchronous ref FIRST so handlePlayerAction can read it immediately
              latestMechanicsRef.current = {
                ...(latestMechanicsRef.current || {}),
                ...(enhancedMechanics as GameMechanics),
              };
              setPendingMechanics(prev => ({ ...prev, ...enhancedMechanics }));
            }
          },
          onError: (errorMsg) => {
            console.error('[handlePlayerAction] Streaming error:', errorMsg);
            // Toast is shown by the else clause when narrative is null
          },
        }
      );
      
      narrative = streamResult?.content || null;
      setIsLoading(false);
      streamingNarrative.reset();
    } else {
      // === NON-STREAMING NARRATIVE GENERATION ===
      narrative = await generateNarrative(scenarioSelection.scenario, action, updatedStory, diceRoll);
    }
    
    if (narrative) {
      const narratorEntry: StoryEntry = {
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrative,
        timestamp: Date.now(),
      };
      const finalStory = [...updatedStory, narratorEntry];
      setStory(finalStory);
      saveData(finalStory, character, scenarioSelection.scenario, scenarioSelection.genre);
      
      // Add narrator response to campaign narrative
      if (campaignContext) {
        campaignContext.addNarrativeEntry(narratorEntry);
      }
      
// === NPC AUTO-REGISTRATION: Detect and register NPCs from narrative ===
      const npcResult = processNarrativeForNPCs(narrative, currentTurn, character.name);
      if (npcResult.registered.length > 0) {
        console.log(`[NPCAutoReg] Registered ${npcResult.registered.length} NPCs:`, npcResult.registered);
        
        // === STATS TRACKING: Record NPC encounters ===
        if (sessionStats) {
          npcResult.registered.forEach(npcName => {
            sessionStats.addNpcEncounter(typeof npcName === 'string' ? npcName : String(npcName));
          });
        }
      }
      
      // === COMBAT ACHIEVEMENT BRIDGE: Detect combat outcomes from narrative ===
      const combatResult = processNarrativeForCombatAchievements(narrative, currentTurn);
      if (combatResult.type) {
        console.log(`[CombatAchievements] Detected combat outcome: ${combatResult.type}`, combatResult);
      }
      
// === STORY-INVENTORY SYNC: Parse narrative for item pickups/drops ===
      // FIX: Read from synchronous ref (latestMechanicsRef.current) instead of state
      // (pendingMechanics). React state setters are batched, so the state value here
      // is stale on the same render. The ref is updated synchronously inside the
      // hook and inside the streaming onComplete callback above.
      const liveMechanics = latestMechanicsRef.current;
      const mechanicsTags: MechanicsTags = {
        loot: liveMechanics?.lootGained 
          ? (Array.isArray(liveMechanics.lootGained) ? liveMechanics.lootGained : [liveMechanics.lootGained])
          : [],
        drop: liveMechanics?.itemsDropped
          ? (Array.isArray(liveMechanics.itemsDropped) ? liveMechanics.itemsDropped : [liveMechanics.itemsDropped])
          : [],
        // Phase 2: Include consumed items from [USE:] tags
        use: liveMechanics?.itemsUsed
          ? (Array.isArray(liveMechanics.itemsUsed) ? liveMechanics.itemsUsed : [liveMechanics.itemsUsed])
          : [],
        // Also pass the edge function format for compatibility
        lootGained: liveMechanics?.lootGained as string[] | undefined,
        itemsDropped: liveMechanics?.itemsDropped as string[] | undefined,
        itemsUsed: liveMechanics?.itemsUsed as string[] | undefined,
      };
      
      // Use the enhanced sync system that actually adds AND removes items
      const inventoryResult = processStoryInventoryUpdate(narrative, mechanicsTags, inventory, {
        useFallbackParsing: true,
        minConfidence: 'high', // Only high confidence to avoid false positives
      });
      
      // Show toasts for added items
      if (inventoryResult.itemsAdded.length > 0) {
        console.log(`[StoryInv] Items added: ${inventoryResult.itemsAdded.length}`);
        
        // Group items by category for category-specific toasts
        const byCategory: Record<string, string[]> = {};
        inventoryResult.itemsAdded.forEach(item => {
          const cat = item.category || 'misc';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(item.name);
        });
        
        // Show category-specific toasts with different styles
        const categoryConfig: Record<string, { icon: string; style: 'success' | 'info' | 'warning'; label: string }> = {
          weapons: { icon: '⚔️', style: 'warning', label: 'Weapon acquired' },
          apparel: { icon: '🛡️', style: 'info', label: 'Gear acquired' },
          aid: { icon: '💊', style: 'success', label: 'Supplies acquired' },
          ammo: { icon: '🔫', style: 'info', label: 'Ammo acquired' },
          keyItems: { icon: '🔑', style: 'warning', label: 'Key item acquired' },
          misc: { icon: '📦', style: 'info', label: 'Item acquired' },
        };
        
        Object.entries(byCategory).forEach(([category, items]) => {
          const config = categoryConfig[category] || categoryConfig.misc;
          const itemList = items.slice(0, 2).join(', ');
          const moreText = items.length > 2 ? ` +${items.length - 2} more` : '';
          
          if (config.style === 'warning') {
            toast.warning(`${config.icon} ${itemList}${moreText}`, {
              duration: 4000,
              description: config.label,
            });
          } else if (config.style === 'success') {
            toast.success(`${config.icon} ${itemList}${moreText}`, {
              duration: 3000,
              description: config.label,
            });
          } else {
            toast.info(`${config.icon} ${itemList}${moreText}`, {
              duration: 3000,
              description: config.label,
            });
          }
        });
      }
      
      // Show toasts for removed items
      if (inventoryResult.itemsRemoved.length > 0) {
        console.log(`[StoryInv] Items removed: ${inventoryResult.itemsRemoved.length}`);
        
        inventoryResult.itemsRemoved.forEach(item => {
          const reasonConfig: Record<string, { icon: string; label: string }> = {
            drop: { icon: '📤', label: 'Dropped' },
            consume: { icon: '✓', label: 'Used' },
            give: { icon: '🤝', label: 'Given away' },
            destroy: { icon: '💥', label: 'Destroyed' },
            lose: { icon: '❌', label: 'Lost' },
          };
          
          const config = reasonConfig[item.reason] || reasonConfig.drop;
          toast.info(`${config.icon} ${item.name}`, {
            duration: 2500,
            description: config.label,
          });
        });
      }
      
      // Log warnings
      if (inventoryResult.warnings.length > 0) {
        console.log('[StoryInv] Warnings:', inventoryResult.warnings);
      }
      
      // Process action for identity anchors and advance time
      if (campaignMemory) {
        const updatedMemory = processActionForIdentity(campaignMemory, action, narrative, currentTurn);
        updateCampaignMemory(updatedMemory);
        advanceCampaignTime(1); // Each action is 1 tick
      }
      
      // === MOVE SYNC: Parse narrative for environment/player/genre state ===
      const moveSyncResult = runMoveSync(
        narrative,
        character.name,
        currentTurn,
        {
          primaryGenre: (worldBible?.primaryGenre || scenarioSelection?.genre) as GameGenre,
          secondaryGenres: worldBible?.secondaryGenres?.map(sg => ({
            genre: sg.genreId as GameGenre,
            strength: Math.round(sg.blendStrength * 100),
          })),
        }
      );
      if (moveSyncResult.genreViolations.length > 0) {
        console.log(`[MoveSync] Genre violations detected: ${moveSyncResult.genreViolations.length}`);
      }
      
      // === STATS TRACKING: Track location if changed ===
      if (sessionStats && moveSyncResult.environmentUpdates?.currentLocation) {
        sessionStats.addLocationVisit(moveSyncResult.environmentUpdates.currentLocation);
      }
      
      // Check for scene illustration triggers
      checkSceneTriggers('observation', narrative);
    } else {
      // === CRITICAL FIX: Handle null/empty narrative response ===
      // This prevents the "no response" bug where player action shows but narrator never responds
      console.error('[handlePlayerAction] Narrative generation returned null/empty');
      
      // Store the failed action for retry
      setLastFailedAction({
        action: action,
        diceRoll: diceRoll,
        storySnapshot: story, // Story before player entry was added
      });
      
      // Show error toast with retry option
      toast.error('AI response failed', {
        description: 'Tap "Retry" below to try again',
        duration: 10000,
        action: {
          label: 'Retry',
          onClick: () => setRetryRequested(true),
        },
      });
      
      // Add a fallback narrative so the story doesn't hang
      const fallbackNarrative = getContextualFallback(scenarioSelection?.genre);
      const fallbackEntry: StoryEntry = {
        id: `narrator_fallback_${Date.now()}`,
        role: 'narrator',
        content: fallbackNarrative,
        timestamp: Date.now(),
      };
      const fallbackStory = [...updatedStory, fallbackEntry];
      setStory(fallbackStory);
      
      // Save even with fallback to prevent data loss
      saveData(fallbackStory, character, scenarioSelection.scenario, scenarioSelection.genre);
      
      if (campaignContext) {
        campaignContext.addNarrativeEntry(fallbackEntry);
      }
    }
  }, [story, scenarioSelection, character, generateNarrative, saveData, checkSceneTriggers, campaignMemory, updateCampaignMemory, advanceCampaignTime, campaignContext, worldState.securityLevel, processActionForRipples, advanceTurn, inventory, sessionStats]);

  // Retry last failed action
  const retryLastAction = useCallback(async () => {
    if (!lastFailedAction || !character || !scenarioSelection) return;
    
    const { action, diceRoll, storySnapshot } = lastFailedAction;
    
    // Clear the failed action first
    setLastFailedAction(null);
    
    // Restore story to before the failed action's player entry was added
    // Then add the player entry again
    const playerEntry: StoryEntry = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: action,
      timestamp: Date.now(),
    };
    
    const updatedStory = [...storySnapshot, playerEntry];
    setStory(updatedStory);
    
    toast.info('Retrying...');
    
    // Try to generate narrative again
    const narrative = await generateNarrative(scenarioSelection.scenario, action, updatedStory, diceRoll);
    if (narrative) {
      const narratorEntry: StoryEntry = {
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrative,
        timestamp: Date.now(),
      };
      const finalStory = [...updatedStory, narratorEntry];
      setStory(finalStory);
      saveData(finalStory, character, scenarioSelection.scenario, scenarioSelection.genre);
      
      // Add to campaign narrative
      if (campaignContext) {
        campaignContext.addNarrativeEntry(playerEntry);
        campaignContext.addNarrativeEntry(narratorEntry);
      }
      
      toast.success('AI connected successfully');
    }
  }, [lastFailedAction, character, scenarioSelection, generateNarrative, saveData, campaignContext]);

  // Effect to handle retry when requested via toast action
  useEffect(() => {
    if (retryRequested && lastFailedAction) {
      setRetryRequested(false);
      retryLastAction();
    }
  }, [retryRequested, lastFailedAction, retryLastAction]);

  // === SYSTEMS TEST: Run test scenario with injected game state ===
  const handleRunSystemsTest = useCallback(async (testConfig: TestConfig, scenario: TestScenario) => {
    if (!character || !scenarioSelection) {
      toast.error('Start an adventure to run systems tests');
      return;
    }
    
    console.log('[SystemsTest] Running test scenario:', scenario.name);
    console.log('[SystemsTest] Test config:', testConfig);
    
    // Apply weather state if configured
    if (testConfig.weatherType !== 'clear') {
      const weatherMap: Record<string, typeof weatherState.current> = {
        'rain': 'rain',
        'storm': 'storm',
        'snow': 'snow',
        'fog': 'fog',
        'clear': 'clear',
      };
      const newWeather = weatherMap[testConfig.weatherType] || 'clear';
      setWeatherState(prev => ({
        ...prev,
        current: newWeather,
        intensity: testConfig.weatherType === 'storm' ? 0.9 : 0.7,
      }));
      console.log('[SystemsTest] Set weather to:', newWeather);
    }
    
    // Apply time state if configured  
    const timeMap: Record<string, number> = {
      'dawn': 6,
      'morning': 9,
      'afternoon': 14,
      'evening': 18,
      'night': 22,
    };
    const newHour = timeMap[testConfig.timeOfDay] || 14;
    setTimeState(prev => ({ ...prev, hour: newHour }));
    console.log('[SystemsTest] Set time to hour:', newHour);
    
    // Apply mood if configured
    if (testConfig.moodType !== 'neutral') {
      const moodMap: Record<string, CoreMoodType> = {
        'fearful': 'fearful',
        'angry': 'mad',
        'hopeful': 'happy',
        'melancholic': 'sad',
        'neutral': 'neutral',
      };
      const newMood = moodMap[testConfig.moodType] || 'neutral';
      setCurrentMood(newMood);
      console.log('[SystemsTest] Set mood to:', newMood);
    }
    
    // Build context hints for the AI prompt
    const contextHints: string[] = [];
    
    if (testConfig.armorType !== 'none') {
      contextHints.push(`[CONTEXT: The player is wearing ${testConfig.armorType} armor that affects their movement and appearance]`);
    }
    
    if (testConfig.woundLevel !== 'none') {
      contextHints.push(`[CONTEXT: The player has ${testConfig.woundLevel} wounds that are visibly bleeding/showing]`);
    }
    
    if (testConfig.exhaustionLevel !== 'fresh') {
      contextHints.push(`[CONTEXT: The player is ${testConfig.exhaustionLevel} and it shows in their movements and speech]`);
    }
    
    // Combine context with scenario test prompt
    const enhancedPrompt = contextHints.length > 0 
      ? `${contextHints.join(' ')} ${scenario.testPrompt}`
      : scenario.testPrompt;
    
    console.log('[SystemsTest] Enhanced prompt:', enhancedPrompt);
    
    // Trigger the AI narration with the test scenario
    await handlePlayerAction(enhancedPrompt);
    
    toast.success('Systems test triggered!', {
      description: `Check the narrative for ${scenario.systems.join(', ')} references`,
    });
  }, [character, scenarioSelection, handlePlayerAction, setWeatherState, setTimeState]);

  // Generate scene image
  const handleGenerateImage = useCallback(async (entryId: string) => {
    const entry = story.find(e => e.id === entryId);
    if (!entry) return;

    setGeneratingImageFor(entryId);
    try {
      // Get story context around this entry (up to 10 messages)
      const entryIndex = story.findIndex(e => e.id === entryId);
      const contextStart = Math.max(0, entryIndex - 9);
      const recentStory = story.slice(contextStart, entryIndex + 1);
      const lastNarratorMessage = recentStory.filter(e => e.role === 'narrator').slice(-1)[0]?.content || entry.content;
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
            genre: scenarioSelection?.genre || 'fantasy',
            era: worldBible?.warEra || worldBible?.techTier || undefined,
            timeOfDay: timeOfDayPeriod,
            weather: weatherState?.current || undefined,
          }),
        }
      );
      
      if (!response.ok) {
        console.error('[handleGenerateImage] Response not ok:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[handleGenerateImage] Response data:', { hasImageUrl: !!data.imageUrl, error: data.error });
      
      if (data.imageUrl) {
        setStory(prev => prev.map(e => 
          e.id === entryId ? { ...e, imageUrl: data.imageUrl } : e
        ));
        toast.success('Scene illustrated!');
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      console.error('[handleGenerateImage] Error:', error);
      toast.error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingImageFor(undefined);
    }
  }, [story, scenarioSelection, characterVisualProfile, weatherState, timeState, worldBible]);

  // Restart game
  const handleRestart = useCallback(() => {
    setStory([]);
    setCharacter(null);
    setScenarioSelection(null);
    setPhase('scenario');
    localStorage.removeItem(STORY_KEY);
    localStorage.removeItem(CHARACTER_KEY);
    localStorage.removeItem(SCENARIO_KEY);
    localStorage.removeItem(GENRE_KEY);
    // FIX: Also clear active campaign so we don't leave orphaned campaigns
    if (campaignContext?.activeCampaign) {
      campaignContext.deleteCampaign(campaignContext.activeCampaign.id).catch(err => {
        console.warn('[handleRestart] Failed to delete active campaign:', err);
      });
    }
    // Clear pending mechanics to avoid bleed-through
    setPendingMechanics(undefined);
    latestMechanicsRef.current = undefined;
  }, [campaignContext, setPendingMechanics, latestMechanicsRef]);

  // === REGENERATE WORLD: Generate a new opening narrative ===
  // Only available before the world is locked (before 2nd player action)
  const handleRegenerateWorld = useCallback(async () => {
    if (!character || !scenarioSelection || worldLocked) {
      toast.error('World is locked and cannot be regenerated');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('[RegenerateWorld] Generating new opening narrative...');
      
      // Get secondary genres from world bible for fallback
      const secondaryGenres = worldBible?.secondaryGenres || [];
      const genre = scenarioSelection.genre;
      
      const TIMEOUT_MS = 12000; // 12 second timeout for regeneration
      
      const fetchPromise = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            scenario: scenarioSelection.scenario,
            conversationHistory: [],
            character: sanitizeCharacterForAPI(character),
            adultContent: settings.adultContent,
            genreContract: worldBible?.contractSummary || null,
            narratorConfig: settings.narratorConfig,
            // Minimal context for regeneration (more likely to succeed)
            narrativeContractContext: {
              universalRules: UNIVERSAL_NARRATIVE_RULES,
              genreBible: `===== GENRE BIBLE =====\n${GENRE_BIBLE[genre] || GENRE_BIBLE['fantasy']}`,
              spawnPacket: formatSpawnPacket(buildSpawnPacket(
                scenarioSelection.scenario,
                genre,
                character.classId || 'default',
                character.name,
                (character.inventory || []).map(i => ({ name: i.name, quantity: i.quantity || 1 })),
                'Starting Location'
              )),
              isOpening: true,
            },
          }),
        }
      );
      
      const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
      );
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      let narrativeContent: string;
      
      if (!response.ok) {
        console.warn(`[RegenerateWorld] API returned ${response.status}, using fallback`);
        narrativeContent = generateImmersiveOpening({
          character,
          genre,
          scenario: scenarioSelection.scenario,
          secondaryGenres,
        });
      } else {
        try {
          const data = await response.json();
          narrativeContent = data.narrative || generateImmersiveOpening({
            character,
            genre,
            scenario: scenarioSelection.scenario,
            secondaryGenres,
          });
        } catch (parseError) {
          console.warn('[RegenerateWorld] Failed to parse response, using fallback:', parseError);
          narrativeContent = generateImmersiveOpening({
            character,
            genre,
            scenario: scenarioSelection.scenario,
            secondaryGenres,
          });
        }
      }
      
      // Replace the story with new opening
      const newStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrativeContent,
        timestamp: Date.now(),
      }];
      
      setStory(newStory);
      saveData(newStory, character, scenarioSelection.scenario, genre);
      
      // Sync to campaign
      if (campaignContext?.syncNarrativeHistory) {
        campaignContext.syncNarrativeHistory(newStory);
      }
      
      // Lock the world immediately after regeneration
      setWorldLocked(true);
      setLockedOpening(narrativeContent);
      playerActionCount.current = 0; // Reset count since we're starting fresh
      
      toast.success('World regenerated! This is now your starting point.');
      console.log('[RegenerateWorld] Successfully regenerated and locked world');
      
    } catch (error) {
      console.error('[RegenerateWorld] Failed:', error);
      // Even on complete failure, use fallback instead of error
      const fallbackNarrative = generateImmersiveOpening({
        character,
        genre: scenarioSelection.genre,
        scenario: scenarioSelection.scenario,
        secondaryGenres: worldBible?.secondaryGenres || [],
      });
      
      const newStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: fallbackNarrative,
        timestamp: Date.now(),
      }];
      
      setStory(newStory);
      saveData(newStory, character, scenarioSelection.scenario, scenarioSelection.genre);
      
      if (campaignContext?.syncNarrativeHistory) {
        campaignContext.syncNarrativeHistory(newStory);
      }
      
      setWorldLocked(true);
      setLockedOpening(fallbackNarrative);
      playerActionCount.current = 0;
      
      toast.success('World regenerated with fallback narrative.');
    } finally {
      setIsLoading(false);
    }
  }, [character, scenarioSelection, worldLocked, worldBible, settings.adultContent, settings.narratorConfig, saveData, campaignContext]);

  // Rollback story to a specific entry (discard everything after)
  // IMPORTANT: Cancel pending generation and block during active generation
  const handleRollbackToEntry = useCallback((entryIndex: number) => {
    if (!character || !scenarioSelection) return;
    
    // Cancel any pending generation requests to prevent race conditions
    if (isGenerationInProgress()) {
      console.log('[Story Rollback] Cancelling pending generation...');
      cancelPendingGeneration();
      setIsLoading(false);
    }
    
    // Block rollback during AI generation to prevent flickering/race conditions
    if (isLoading) {
      toast.error('Cannot rewind while AI is generating. Please wait...');
      return;
    }
    
    // Keep story up to and including the target entry
    const rolledBackStory = story.slice(0, entryIndex + 1);
    setStory(rolledBackStory);
    // FIX: Clear stale mechanics from the rolled-back turn so the next action
    // doesn't accidentally consume/drop items that were in the discarded future.
    setPendingMechanics(undefined);
    latestMechanicsRef.current = undefined;
    saveData(rolledBackStory, character, scenarioSelection.scenario, scenarioSelection.genre);
    
    // Also sync to campaign immediately
    if (campaignContext?.syncNarrativeHistory) {
      campaignContext.syncNarrativeHistory(rolledBackStory);
    }
    
    console.log(`[Story Rollback] Reverted to entry ${entryIndex}, discarded ${story.length - entryIndex - 1} entries`);
  }, [story, character, scenarioSelection, saveData, isLoading, campaignContext, setPendingMechanics, latestMechanicsRef]);

  // Load save with campaign memory restoration
  const handleLoadSave = useCallback((save: GameSave) => {
    const gameData = save.gameData as { story?: StoryEntry[]; character?: RPGCharacter };
    
    if (gameData.story && gameData.character) {
      // Migrate character health if needed (for old characters with low HP)
      const migratedCharacter = migrateCharacterHealth(gameData.character);
      
      // Character inventory is stored with character - no global sync needed
      
      setStory(gameData.story);
      setCharacter(migratedCharacter);
      
      // FIX: Restore world state that legacy saves silently dropped
      const saveAny = save as any;
      if (saveAny.weatherState) {
        try { setWeatherState(saveAny.weatherState); } catch (e) { console.warn('[handleLoadSave] Failed to restore weather:', e); }
      }
      if (saveAny.timeState) {
        try { setTimeState(saveAny.timeState); } catch (e) { console.warn('[handleLoadSave] Failed to restore time:', e); }
      }
      if (saveAny.directorSettings) {
        try { setDirectorSettings(saveAny.directorSettings); } catch (e) { console.warn('[handleLoadSave] Failed to restore director settings:', e); }
      }
      
      // Restore campaign memory if available
      if (save.campaignMemory) {
        const restored = restoreCampaignFromSave(save.campaignMemory);
        if (restored) {
          console.log(`[Campaign Memory] Restored campaign for ${save.characterName}`);
        } else {
          // Failed to restore, initialize a new one for continuity
          const campaignId = `campaign_${migratedCharacter.name}_restored_${Date.now()}`;
          initializeCampaign(campaignId, migratedCharacter.name, []);
          console.log(`[Campaign Memory] Initialized new campaign for restored save: ${campaignId}`);
        }
      } else {
        // Legacy save without campaign memory - initialize new
        const campaignId = `campaign_${migratedCharacter.name}_legacy_${Date.now()}`;
        initializeCampaign(campaignId, migratedCharacter.name, []);
        console.log(`[Campaign Memory] Initialized campaign for legacy save: ${campaignId}`);
      }
      
      // World Bible is auto-loaded from localStorage by GameContext
      // If it doesn't exist, we'll create a default one based on saved genre
      if (!worldBible) {
        const savedGenre = localStorage.getItem(GENRE_KEY) as GameGenre | null;
        if (savedGenre) {
          initializeWorldBible({
            campaignName: `${save.characterName}'s Adventure`,
            primaryGenre: savedGenre,
            secondaryGenres: [],
            hardLock: false,
            tabooList: [],
            intrusionBudget: 2,
          });
          console.log(`[World Bible] Initialized for restored save: ${savedGenre}`);
        }
      } else {
        console.log(`[World Bible] Using existing: ${worldBible.primaryGenre}`);
      }
      
      setPhase('playing');
      toast.success(`Loaded ${save.characterName}'s adventure`);
    }
  }, [restoreCampaignFromSave, initializeCampaign, worldBible, initializeWorldBible]);

  // Show loading screen on initial load or during initialization phase
  if (initialLoading || phase === 'loading') {
    return <LoadingScreen isLoading={true} message="Initializing The Untold Story Engine..." minDuration={500} />;
  }

  // Phase 0.5: Recovery prompt for returning players
  if (phase === 'recovery') {
    return (
      <CrashRecoveryPrompt
        onContinue={handleLoadSave}
        onNewGame={() => setPhase('scenario')}
      />
    );
  }

  // First-time wizard for new users
  if (showWizard && phase === 'scenario') {
    return (
      <FirstTimeWizard
        onComplete={(selections) => {
          // Apply the selected preset
          const selectedPreset = SETTINGS_PRESETS.find(p => p.id === selections.preset);
          if (selectedPreset) {
            // Update game settings with preset values
            updateSettings({
              adultContent: selections.adultContent,
              enableWoundSystem: selectedPreset.settings.enableWoundSystem,
              enableInventoryWeight: selectedPreset.settings.enableInventoryWeight,
              inDepthSettings: {
                ...settings.inDepthSettings,
                enableHunger: selectedPreset.settings.enableHunger,
                enableFatigue: selectedPreset.settings.enableFatigue,
                enableInjuryDetail: selectedPreset.settings.enableInjuryDetail,
                enableEquipmentWear: selectedPreset.settings.enableEquipmentWear,
                worldTone: selectedPreset.settings.worldTone,
                consequenceIntensity: selectedPreset.settings.consequenceIntensity,
                microEventFrequency: selectedPreset.settings.microEventFrequency,
              },
            });
            setDiceMode(selectedPreset.diceMode);
          }
          setShowWizard(false);
        }}
      />
    );
  }

  // Phase 1: Scenario selection
  if (phase === 'scenario') {
    return (
      <AdventureCreator 
        onSelect={handleScenarioSelect} 
        onLoadCampaign={(campaignId) => {
          console.log('[AdventureGame] Loading campaign:', campaignId);
          setActiveCampaignId(campaignId);
          setTimeout(() => window.location.reload(), 50);
        }}
        isLoading={isLoading} 
      />
    );
  }

  // Phase 1.5: Color selection
  if (phase === 'color' && scenarioSelection) {
    return (
      <ColorSelectionScreen
        onSelect={handleColorSelect}
        currentSelection={selectedColorId || 'violet'}
      />
    );
  }

  // Phase 2: Character creation
  if (phase === 'character' && scenarioSelection) {
    return (
      <CharacterCreation
        genre={scenarioSelection.genre}
        scenario={scenarioSelection.scenario}
        genreTitle={scenarioSelection.genreTitle}
        onComplete={handleCharacterComplete}
        onBack={handleBackToScenario}
        isLoading={isLoading}
        secondaryGenres={scenarioSelection.genreContract?.secondaryGenres}
        defaultClass={scenarioSelection.characterClass}
      />
    );
  }

  // Phase 2.5: Narrator settings selection
  if (phase === 'narrator' && pendingCharacter && scenarioSelection) {
    return (
      <NarratorSettingsModal
        open={true}
        onClose={handleNarratorSkip}
        onConfirm={handleNarratorConfirm}
        initialSettings={directorSettings}
      />
    );
  }

  // Phase 3: Playing
  if (phase === 'playing' && character) {
    return (
      <>
      <AdventureDisplay
        story={story}
        onPlayerAction={handlePlayerAction}
        onRestart={handleRestart}
        onLoadSave={handleLoadSave}
        onRollbackToEntry={handleRollbackToEntry}
        isLoading={isLoading}
        cheatMode={cheatMode}
        onToggleCheatMode={() => setCheatMode(p => !p)}
        character={character}
        onUpdateCharacter={setCharacter}
        pendingMechanics={pendingMechanics}
        onClearMechanics={() => setPendingMechanics(undefined)}
        onGenerateImage={handleGenerateImage}
        generatingImageFor={generatingImageFor}
        sceneImageUrl={sceneImageUrl}
        isGeneratingScene={isGeneratingScene}
        onCloseSceneImage={closeSceneImage}
        genre={scenarioSelection?.genre || 'fantasy'}
        currentMood={currentMood}
        moodHistory={moodHistory}
        onMoodChange={handleMoodChange}
        weatherState={weatherState}
        onWeatherStateChange={setWeatherState}
        timeState={timeState}
        onTimeStateChange={setTimeState}
        campaignId={campaignContext?.activeCampaignId || 'default_campaign'}
        onRegenerateWorld={!worldLocked && story.length === 1 ? handleRegenerateWorld : undefined}
        canRegenerateWorld={!worldLocked && story.length === 1 && !isLoading}
        onRunSystemsTest={handleRunSystemsTest}
        onCancelGeneration={() => {
          // Force release any stuck generation lock and reset loading state
          forceReleaseLock();
          cancelPendingGeneration();
          streamingNarrative.cancelStream();
          setIsLoading(false);
          toast.info('Generation cancelled. You can try again.', { duration: 3000 });
        }}
        streamingState={streamingNarrative.isStreaming ? {
          content: streamingNarrative.content,
          isStreaming: streamingNarrative.isStreaming,
          isComplete: streamingNarrative.isComplete,
          error: streamingNarrative.error,
        } : null}
      />
      <MechanicsSyncDebugPanel
        pendingMechanics={pendingMechanics}
        latestMechanicsRef={latestMechanicsRef}
      />
      </>
    );
  }

  // If we're in playing phase but waiting for character (during async completion)
  if (phase === 'playing' && !character) {
    return <LoadingScreen isLoading={true} message="Preparing your adventure..." minDuration={500} />;
  }

  // Fallback - only for truly unhandled states
  return (
    <AdventureCreator 
      onSelect={handleScenarioSelect} 
      onLoadCampaign={(campaignId) => {
        console.log('[AdventureGame] Loading campaign:', campaignId);
        setActiveCampaignId(campaignId);
        setTimeout(() => window.location.reload(), 50);
      }}
      isLoading={isLoading} 
    />
  );
}