import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { shouldIllustrateScene, SceneTrigger } from '@/components/game/SceneIllustration';
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
import { GameSave, getMostRecentSave } from '@/lib/saveSystem';
import { setActiveCampaignId } from '@/lib/campaignStorage';
import { formatMemoryContextForAI, processActionForIdentity } from '@/game/campaignMemorySystem';
import { CoreMoodType, MOOD_COLORS, GENRE_MOOD_DESCRIPTORS } from '@/game/moodSystem';
import { 
  WeatherState, 
  createInitialWeatherState, 
  getWeatherNarrativeContext,
  formatWeatherEffectsForAI,
  WEATHER_CONFIGS,
} from '@/game/weatherSystem';
import {
  GameTimeState,
  createInitialTimeState,
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

// Helper to format emotional context for AI
function formatEmotionalContext(
  mood: CoreMoodType,
  moodIntensity: number,
  genre: GameGenre
): { currentMood: string; moodIntensity: number; internalDescription: string; physicalDescription: string; dialogueTone: string; actionFlavor: string } | null {
  // If mood is neutral with low intensity, return null to skip mood injection
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

import { GameMechanics } from './types';

// SecondaryGenreBlend interface kept for type compatibility
interface SecondaryGenreBlend {
  genreId: string;
  blendStrength: number;
}

// Helper to build background NPC actions context for AI
function buildBackgroundNPCActionsContext(
  memContext: any,
  currentTick: number
): { actions: Array<{ description: string; involvedNPCs: string[]; location: string; hoursAgo: number }> } | undefined {
  const actions: Array<{ description: string; involvedNPCs: string[]; location: string; hoursAgo: number }> = [];
  
  // Extract from STM and MTM memories that are NOT player-initiated
  if (memContext?.sceneNow) {
    for (const mem of memContext.sceneNow) {
      if (mem.type === 'event' && mem.provenance !== 'observed') {
        // This is a background event (not player-observed)
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
  
  // Also check recent MTM events for important background happenings
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
  
  // Deduplicate and limit
  const uniqueActions = actions.filter((action, index, self) =>
    index === self.findIndex(a => a.description === action.description)
  ).slice(0, 10);
  
  return uniqueActions.length > 0 ? { actions: uniqueActions } : undefined;
}

type GamePhase = 'loading' | 'recovery' | 'scenario' | 'color' | 'character' | 'narrator' | 'playing';

const STORY_KEY = 'untold-adventure-story';
const CHARACTER_KEY = 'untold-adventure-character';
const SCENARIO_KEY = 'untold-adventure-scenario';
const GENRE_KEY = 'untold-adventure-genre';
const COLOR_KEY = 'untold-ui-color-theme';

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
  
  // Weather state - synced from AdventureDisplay for AI context
  // Initialize from campaign if available, otherwise create fresh
  const [weatherState, setWeatherState] = useState<WeatherState>(() => {
    if (campaignContext?.activeCampaign?.weatherState) {
      return campaignContext.activeCampaign.weatherState;
    }
    return createInitialWeatherState();
  });
  
  // Time state - synced from AdventureDisplay for AI context and campaign persistence
  const [timeState, setTimeState] = useState<GameTimeState>(() => {
    if (campaignContext?.activeCampaign?.timeState) {
      return campaignContext.activeCampaign.timeState;
    }
    return createInitialTimeState();
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
  
  // === DIRECTOR/NARRATOR SETTINGS ===
  // Stores the chosen director settings for this campaign
  const [directorSettings, setDirectorSettings] = useState<DirectorSettings>(DEFAULT_DIRECTOR_SETTINGS);
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

  // Sync local state when campaign data changes (e.g., after checkpoint restore)
  // CRITICAL: Only sync when tick DECREASES (rollback) or on initial load, not on every narrative entry
  const lastSyncedTick = useRef<number>(-1);
  const lastSyncedCampaignId = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== 'playing' || !campaignContext?.activeCampaign) return;
    
    const campaign = campaignContext.activeCampaign;
    const currentTick = campaign.currentTick;
    
    // Reset sync state when campaign ID changes
    if (lastSyncedCampaignId.current !== campaign.id) {
      lastSyncedCampaignId.current = campaign.id;
      lastSyncedTick.current = currentTick;
      console.log('[Campaign Sync] New campaign detected, initialized sync state');
      return;
    }
    
    // Initial load case - sync everything
    if (lastSyncedTick.current === -1) {
      lastSyncedTick.current = currentTick;
      setStory(campaign.narrativeHistory);
      setCharacter(campaign.player);
      console.log('[Campaign Sync] Initial sync from campaign');
      return;
    }
    
    // Only sync if tick DECREASED (indicates checkpoint restore/rollback)
    // Don't sync when tick increases - that's normal narrative progression
    if (currentTick < lastSyncedTick.current) {
      console.log('[Campaign Sync] Checkpoint restore detected, syncing from campaign');
      lastSyncedTick.current = currentTick;
      setStory(campaign.narrativeHistory);
      setCharacter(campaign.player);
    } else {
      // Just update the reference tick, don't overwrite local state
      lastSyncedTick.current = currentTick;
    }
  }, [phase, campaignContext?.activeCampaign?.currentTick]);

  // CRITICAL: Sync local story state to campaign before auto-save triggers
  // This ensures narrator responses are properly persisted
  const lastSyncedStoryLength = useRef<number>(0);
  useEffect(() => {
    if (phase !== 'playing' || !campaignContext?.syncNarrativeHistory) return;
    
    // Only sync if story has changed since last sync
    if (story.length !== lastSyncedStoryLength.current && story.length > 0) {
      lastSyncedStoryLength.current = story.length;
      campaignContext.syncNarrativeHistory(story);
      console.log(`[Story Sync] Synced ${story.length} entries to campaign`);
    }
  }, [phase, story, campaignContext]);

  // CRITICAL: Sync local character state to campaign when character changes
  // This ensures health, gold, XP, inventory are persisted
  const lastSyncedCharacterRef = useRef<string>('');
  useEffect(() => {
    if (phase !== 'playing' || !character || !campaignContext?.updatePlayer) return;
    
    // Create a hash of character state to detect actual changes
    const characterHash = JSON.stringify({
      currentHealth: character.currentHealth,
      maxHealth: character.maxHealth,
      gold: character.gold,
      experience: character.experience,
      level: character.level,
      // Include full inventory content to detect item additions/removals
      inventory: character.inventory.map(i => ({ name: i.name, quantity: i.quantity })),
      stats: character.stats,
    });
    
    // Only sync if character data has actually changed
    if (characterHash !== lastSyncedCharacterRef.current) {
      lastSyncedCharacterRef.current = characterHash;
      campaignContext.updatePlayer(character);
      console.log(`[Character Sync] Synced character to campaign - HP: ${character.currentHealth}/${character.maxHealth}, Gold: ${character.gold}, XP: ${character.experience}`);
    }
  }, [phase, character, campaignContext]);
  
  // CRITICAL: Sync weather state to campaign when weather changes
  // This ensures weather is persisted across save/load
  const lastSyncedWeatherRef = useRef<string>('');
  useEffect(() => {
    if (phase !== 'playing' || !campaignContext?.updateCampaign) return;
    
    // Create a hash of weather state to detect actual changes
    const weatherHash = JSON.stringify({
      current: weatherState.current,
      ticksRemaining: weatherState.ticksRemaining,
      intensity: weatherState.intensity,
    });
    
    // Only sync if weather data has actually changed
    if (weatherHash !== lastSyncedWeatherRef.current) {
      lastSyncedWeatherRef.current = weatherHash;
      campaignContext.updateCampaign({ weatherState });
      console.log(`[Weather Sync] Synced weather to campaign - ${weatherState.current} (${weatherState.ticksRemaining} ticks remaining)`);
    }
  }, [phase, weatherState, campaignContext]);
  
  // CRITICAL: Sync time state to campaign when time changes
  // This ensures game time is persisted across save/load
  const lastSyncedTimeRef = useRef<string>('');
  useEffect(() => {
    if (phase !== 'playing' || !campaignContext?.updateCampaign) return;
    
    // Create a hash of time state to detect actual changes
    const timeHash = JSON.stringify({
      totalMinutes: timeState.totalMinutes,
      multiplier: timeState.multiplier,
    });
    
    // Only sync if time data has actually changed
    if (timeHash !== lastSyncedTimeRef.current) {
      lastSyncedTimeRef.current = timeHash;
      campaignContext.updateCampaign({ timeState });
      console.log(`[Time Sync] Synced time to campaign - Day ${timeState.day}, ${timeState.hour}:${timeState.minute.toString().padStart(2, '0')}`);
    }
  }, [phase, timeState, campaignContext]);
  
  // CRITICAL: Sync director settings FROM campaign when campaign changes
  // This ensures in-game settings panel changes are reflected in local state
  useEffect(() => {
    if (phase !== 'playing' || !campaignContext?.activeCampaign?.settings?.directorSettings) return;
    
    const campaignSettings = campaignContext.activeCampaign.settings.directorSettings;
    // Only update if settings actually differ (compare stringified to avoid reference issues)
    const campaignHash = JSON.stringify(campaignSettings);
    const localHash = JSON.stringify(directorSettings);
    
    if (campaignHash !== localHash) {
      setDirectorSettings(campaignSettings);
      console.log(`[Director Sync] Synced director settings from campaign: ${campaignSettings.directorType}`);
    }
  }, [phase, campaignContext?.activeCampaign?.settings?.directorSettings]);

  // === PLAYER STATE MANAGER SYNC ===
  // Initialize playerStateManager with character and sync changes back to React state
  useEffect(() => {
    if (!character || phase !== 'playing') return;
    
    // Initialize playerStateManager with current character data
    playerStateManager.syncFromCharacter(character);
    console.log('[PlayerStateManager] Initialized with character:', character.name);
    
    // Subscribe to HP changes
    const unsubHp = playerStateManager.subscribe('hp', (data: any) => {
      console.log('[PlayerStateManager] HP change event:', data);
      setCharacter(prev => {
        if (!prev) return prev;
        const newHealth = data.newValue ?? prev.currentHealth;
        const maxHealth = data.maxHP ?? prev.maxHealth;
        if (newHealth === prev.currentHealth && maxHealth === prev.maxHealth) return prev;
        return { ...prev, currentHealth: newHealth, maxHealth };
      });
    });
    
    // Subscribe to XP changes
    const unsubXp = playerStateManager.subscribe('xp', (data: any) => {
      console.log('[PlayerStateManager] XP change event:', data);
      setCharacter(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          experience: data.newXP ?? prev.experience,
          level: data.newLevel ?? prev.level,
        };
      });
    });
    
    // Subscribe to currency changes  
    const unsubCurrency = playerStateManager.subscribe('currency', (data: any) => {
      console.log('[PlayerStateManager] Currency change event:', data);
      setCharacter(prev => {
        if (!prev) return prev;
        const newGold = data.newValue ?? prev.gold;
        if (newGold === prev.gold) return prev;
        return { ...prev, gold: newGold };
      });
    });
    
    return () => {
      unsubHp();
      unsubXp();
      unsubCurrency();
    };
  }, [character?.name, phase]); // Only re-subscribe when character name changes (new character)

  const [isLoading, setIsLoading] = useState(false);
  const [cheatMode, setCheatMode] = useState(false);
  const [pendingMechanics, setPendingMechanics] = useState<GameMechanics | undefined>();
  const [generatingImageFor, setGeneratingImageFor] = useState<string | undefined>();
  const lastIllustrationTick = useRef<number>(0);
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [characterVisualProfile, setCharacterVisualProfile] = useState<CharacterVisualProfile | null>(null);
  
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

  // Retry mechanism for failed AI calls
  const [lastFailedAction, setLastFailedAction] = useState<{
    action: string;
    diceRoll?: any;
    storySnapshot: StoryEntry[];
  } | null>(null);
  const [retryRequested, setRetryRequested] = useState(false);
  
  // Mood state for narrative integration
  const [currentMood, setCurrentMood] = useState<CoreMoodType>(() => {
    try {
      const saved = localStorage.getItem('untold-player-mood');
      if (saved) return JSON.parse(saved) as CoreMoodType;
    } catch {}
    return 'neutral';
  });
  const [moodHistory, setMoodHistory] = useState<Array<{ mood: CoreMoodType; timestamp: number; chapter: number; trigger: string }>>([]);
  
  // Tone adaptation system state
  const [toneState, setToneState] = useState<ToneState>(() => {
    try {
      const saved = localStorage.getItem('untold-tone-state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return createInitialToneState();
  });
  
  // Language barrier system state
  const [languageState, setLanguageState] = useState<LanguageSystemState>(() => {
    try {
      const saved = localStorage.getItem('untold-language-state');
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
    localStorage.setItem('untold-player-mood', JSON.stringify(currentMood));
  }, [currentMood]);
  
  // Persist tone state
  useEffect(() => {
    localStorage.setItem('untold-tone-state', JSON.stringify(toneState));
  }, [toneState]);
  
  // Persist language state
  useEffect(() => {
    localStorage.setItem('untold-language-state', JSON.stringify(languageState));
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
    // Save to legacy localStorage (backward compatibility)
    localStorage.setItem(STORY_KEY, JSON.stringify(newStory));
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(newCharacter));
    localStorage.setItem(SCENARIO_KEY, scenario);
    localStorage.setItem(GENRE_KEY, genre);
    
    // Also sync to campaign system if available
    if (campaignContext?.activeCampaign) {
      campaignContext.updatePlayer(newCharacter);
      // Note: narrative entries are added individually via addNarrativeEntry
    }
  }, [campaignContext]);

  // Generate scene illustration based on triggers
  const generateSceneIllustration = useCallback(async (
    description: string,
    trigger: SceneTrigger
  ) => {
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
            genre: scenarioSelection?.genre || 'fantasy',
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
  }, [isGeneratingScene, scenarioSelection, characterVisualProfile, story]);

  // Check for scene illustration triggers
  const checkSceneTriggers = useCallback((eventType: string, content: string) => {
    // Respect the scene illustrations setting
    if (!settings.sceneIllustrations) return;
    
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
  }, [generateSceneIllustration, settings.sceneIllustrations]);

  // === RETRY WITH REDUCED CONTEXT HELPER ===
  // Retry levels: 0 = full context, 1 = reduced, 2 = minimal, 3 = basic only
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
    
    // === RACE CONDITION FIX: Validate state before generation ===
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
    
    // === RACE CONDITION FIX: Acquire generation lock ===
    const requestId = `gen_${Date.now()}_r${retryLevel}`;
    const lockAcquired = await acquireGenerationLock(requestId);
    if (!lockAcquired) {
      console.warn('[generateNarrative] Could not acquire lock, request cancelled');
      return null;
    }
    
    // Only manage loading state if not handled by caller
    if (!skipLoadingState) {
      setIsLoading(true);
    }
    
    // Log retry attempt
    if (retryLevel > 0) {
      console.log(`[generateNarrative] Retry attempt ${retryLevel} with reduced context`);
    }

    try {
      // === DEBUG LOGGING ===
      if (playerAction) {
        logGenerationDebug(playerAction, generationState, {
          historyLength: history.length,
          hasDiceRoll: !!diceRoll,
          hasMemoryContext: !!campaignMemory,
        });
      }
      
      // Get memory context for AI
      const currentTick = campaignMemory?.campaign.currentTick ?? 0;
      const memContext = getCampaignContext?.('current_scene', [], currentTick);
      const formattedMemory = formatMemoryContextForAI(memContext, activeChar.name);
      
      // Get emotional context for AI (only if mood system is enabled and not neutral)
      const genre = scenarioSelection?.genre || 'fantasy';
      const emotionalContext = settings.enableMoodSystem 
        ? formatEmotionalContext(currentMood, 0.6, genre)
        : null;
      
      // Enhance scenario with genre contract if world bible exists
      const enhancedScenario = getEnhancedPromptWithContract(scenario);
      
      // === RACE CONDITION FIX: Clean player input to prevent echo ===
      const cleanedPlayerAction = playerAction ? cleanPlayerInputForPrompt(playerAction) : undefined;
      
      // === TONE ADAPTATION: Analyze player input and build context ===
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
        // Update tone state after building context
        setToneState(prev => updateToneState(prev, playerTone));
      }
      
      // === LANGUAGE BARRIER: Build language context ===
      const languageInstructions = buildLanguageContext(languageState);
      const languageContextPayload = {
        playerKnownLanguages: languageState.playerKnownLanguages,
        translateEnabled: languageState.translateEnabled,
        languageInstructions,
      };
      
      // === NEW SYSTEMS: Build context for grudges, ripples, unreliable info ===
      
      // NPC Psychology Context (grudges, debts, relationships)
      let npcPsychologyPayload = undefined;
      if (sceneNPCs.length > 0) {
        npcPsychologyPayload = {
          npcContexts: buildSceneNPCContext(sceneNPCs),
        };
      }
      
      // Ripple Effect Context (consequences and world state)
      let ripplePayload = undefined;
      if (narrativeQueue.length > 0 || worldState.securityLevel !== 'normal' || worldState.guardAlertLevel > 20) {
        ripplePayload = {
          consequenceContext: buildConsequenceContext(narrativeQueue),
          worldStateContext: buildWorldStateContext(worldState),
        };
      }
      
      // Unreliable Information Context (rumors)
      let unreliableInfoPayload = undefined;
      if (activeRumors.length > 0) {
        unreliableInfoPayload = {
          rumorContext: buildRumorContext(activeRumors),
        };
      }
      
      // Background NPC Actions Context (living world - things that happened without player)
      const backgroundNPCActionsPayload = buildBackgroundNPCActionsContext(memContext, currentTick);
      
      // === NEW PHASE 10 SYSTEMS: Pressure, Motivation, Memory Bites ===
      
      // Pressure Clock Context (world tension)
      const pressureClockPayload = {
        pressureContext: getPressureContext(),
        atmosphereLines: getPressureAtmosphere(pressureState),
        worldPressureLevel: pressureState.worldPressureLevel,
        activeEffects: pressureState.activeEffects,
      };
      
      // NPC Motivation Context (desire/fear/leverage/line)
      // Note: sceneNPCs is NPCGrudgeContext[] which only has npcId, not name/role
      // We use the npcId to get motivations from the motivation system
      const npcMotivationPayload = {
        motivationContext: getNPCMotivationContext(),
        presentNPCMotivations: sceneNPCs.map(npc => {
          // Extract a display name from npcId (e.g., "npc_merchant_elena" -> "Elena")
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
      
      // Memory Bite Context (emotional callbacks)
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
      
      // === NPC PERSONALITY CONTEXT - Archetype-driven dialogue ===
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
        
        // Get personality profiles for recent NPCs (max 10)
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
      
      // Location Context - always include for spatial awareness
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
        timeOfDay: getTimeOfDay() as 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night',
        isNewArrival: false,
        activeConsequences: activeConsequences.map(c => c.description),
      };

      // === RETRY LEVEL CONTEXT REDUCTION ===
      // retryLevel 0: full context
      // retryLevel 1: drop living world, pressure, motivation, memory bites
      // retryLevel 2: also drop NPC psychology, ripples, unreliable info, consistency
      // retryLevel 3: minimal - just scenario, character, and basic narrative contract
      
      const includeAdvancedContext = retryLevel === 0;
      const includeIntermediateContext = retryLevel <= 1;
      const includeBasicContext = retryLevel <= 2;
      
      // Sanitize character data - strip out large base64 data that inflates payload
      const sanitizedCharacter = sanitizeCharacterForAPI(activeChar);
      
      const requestBody: Record<string, any> = {
        scenario: enhancedScenario,
        playerAction: cleanedPlayerAction,
        conversationHistory: history.map(e => ({ role: e.role, content: e.content })),
        cheatMode,
        character: sanitizedCharacter,
        diceRoll,
        // Pass adult content setting for NSFW control
        adultContent: settings.adultContent,
        // Pass character appearance description for narrative (includes adult details when enabled)
        characterAppearance: (sanitizedCharacter as any).appearanceDescription,
        // Pass narrator style configuration
        narratorConfig: settings.narratorConfig,
        // Pass dice mode for roll frequency
        diceMode: diceMode,
        // === NARRATIVE CONTRACT - Always include (core requirement) ===
        narrativeContractContext: (() => {
          const isOpening = history.length === 0;
          const characterClass = activeChar.classId || 'default';
          const characterInventory = inventory.state.items.map(i => ({
            name: i.name,
            quantity: i.quantity || 1,
          }));
          
          // Build spawn packet for opening scene
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
      
      // === BASIC CONTEXT (retryLevel <= 2) ===
      if (includeBasicContext) {
        requestBody.memoryContext = formattedMemory.fullContext ? formattedMemory : undefined;
        requestBody.emotionalContext = emotionalContext;
        requestBody.genreContract = worldBible?.contractSummary || null;
        requestBody.toneContext = toneContextPayload;
        requestBody.languageContext = languageContextPayload;
        requestBody.locationContext = locationContextPayload;
        
        // Director context - use local directorSettings (set during narrator phase) or fall back to settings
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
      
      // === INTERMEDIATE CONTEXT (retryLevel <= 1) ===
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
        
        // Weather context
        if (settings.enableWeatherEffects) {
          requestBody.weatherContext = {
            current: weatherState.current,
            intensity: weatherState.intensity > 1.2 ? 'intense' : weatherState.intensity < 0.7 ? 'mild' : 'moderate',
            name: WEATHER_CONFIGS[weatherState.current]?.name || weatherState.current,
            narrativeContext: getWeatherNarrativeContext(weatherState),
            effects: formatWeatherEffectsForAI(weatherState),
          };
        }
        
        // Time context - always include for time-aware narratives
        requestBody.timeContext = buildTimeContext(timeState);
        
        // NPC Schedule context - NPCs present based on time of day
        requestBody.npcScheduleContext = buildRegisteredNPCScheduleContext(
          playerLocation.zoneName || 'Unknown Location',
          timeState,
          [] // Nearby locations could be added if available
        );
        
        // Clothing/Armor context - affects stats and NPC reactions
        const clothingArmorContext = buildClothingArmorContextForAI();
        if (clothingArmorContext) {
          requestBody.clothingArmorContext = clothingArmorContext;
        }
      }
      
      // === ADVANCED CONTEXT (retryLevel === 0 only) ===
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

      // Add timeout to fetch to prevent hanging forever
      const FETCH_TIMEOUT_MS = 60000; // 60 seconds
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

      // CRITICAL: Surface rate limit and payment errors to user with toast
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
      
      // Check for error in response body (edge function may return 200 with error)
      if (data.error) {
        console.error('[AI] API returned error:', data.error);
        toast.error(data.error, { duration: 5000 });
        return getContextualFallback(genre);
      }
      
      // Use the narrative even if response wasn't "ok" - the edge function now returns fallbacks
      let finalMechanics = data.mechanics ? { ...data.mechanics } : {};
      
      // Log received mechanics from backend
      console.log('[AdventureGame] ========== MECHANICS FROM BACKEND ==========');
      console.log('[AdventureGame] Raw data.mechanics:', JSON.stringify(data.mechanics, null, 2));
      console.log('[AdventureGame] Damage:', finalMechanics.damage, 'Heal:', finalMechanics.heal, 'Gold:', finalMechanics.goldGained);
      
      // === FALLBACK LOOT DETECTION ===
      // If AI forgot to use [LOOT:] tags, try to detect item pickups from narrative
      if (data.narrative) {
        const existingLoot = Array.isArray(finalMechanics.lootGained) 
          ? finalMechanics.lootGained 
          : (finalMechanics.lootGained ? [finalMechanics.lootGained] : []);
        
        const detectedLoot = detectMissingLootTags(data.narrative, existingLoot, { 
          minConfidence: 'high' // Only high confidence to avoid false positives
        });
        
        if (detectedLoot.length > 0) {
          console.log('[AdventureGame] Fallback loot detection found:', detectedLoot);
          // Merge with existing loot
          const allLoot = [...existingLoot, ...detectedLoot];
          finalMechanics.lootGained = allLoot;
        }
        
        // === FALLBACK DROP DETECTION ===
        // If AI forgot to use [DROP:] tags, try to detect item drops from narrative
        const existingDrops = Array.isArray(finalMechanics.itemsDropped) 
          ? finalMechanics.itemsDropped 
          : (finalMechanics.itemsDropped ? [finalMechanics.itemsDropped] : []);
        
        const playerInventoryNames = character.inventory.map(item => item.name);
        const detectedDrops = detectMissingDropTags(data.narrative, existingDrops, playerInventoryNames, { 
          minConfidence: 'high' // Only high confidence to avoid removing wrong items
        });
        
        if (detectedDrops.length > 0) {
          console.log('[AdventureGame] Fallback drop detection found:', detectedDrops);
          // Merge with existing drops
          const allDrops = [...existingDrops, ...detectedDrops];
          finalMechanics.itemsDropped = allDrops;
        }
        
        // === FALLBACK DAMAGE DETECTION ===
        // If AI forgot to use [DAMAGE:X] tags, try to detect damage from narrative
        const detectedDamage = detectMissingDamageTags(data.narrative, finalMechanics.damage, {
          minConfidence: 'high'
        });
        if (detectedDamage !== null) {
          console.log('[AdventureGame] Fallback damage detection found:', detectedDamage);
          finalMechanics.damage = detectedDamage;
        }
        
        // === FALLBACK HEAL DETECTION ===
        // If AI forgot to use [HEAL:X] tags, try to detect healing from narrative
        const detectedHeal = detectMissingHealTags(data.narrative, finalMechanics.heal, {
          minConfidence: 'high'
        });
        if (detectedHeal !== null) {
          console.log('[AdventureGame] Fallback heal detection found:', detectedHeal);
          finalMechanics.heal = detectedHeal;
        }
        
        // === FALLBACK GOLD DETECTION ===
        // If AI forgot to use [GOLD:X] tags, try to detect gold gains from narrative
        const detectedGold = detectMissingGoldTags(data.narrative, finalMechanics.goldGained, {
          minConfidence: 'high'
        });
        if (detectedGold !== null) {
          console.log('[AdventureGame] Fallback gold detection found:', detectedGold);
          finalMechanics.goldGained = detectedGold;
        }
        
        // Log mechanics for debugging
        console.log('[AdventureGame] Final mechanics:', finalMechanics);
      }
      
      if (Object.keys(finalMechanics).length > 0) {
        setPendingMechanics(finalMechanics);
        
        // Handle language learning from backend
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
      
      // If we have a narrative, validate it through World Bible
      if (data.narrative) {
        // === RACE CONDITION FIX: Detect echo responses ===
        if (playerAction && isEchoResponse(data.narrative, playerAction)) {
          console.error('[AI] Echo response detected, using contextual fallback');
          return getContextualFallback(genre);
        }
        
        const validation = validateContent(data.narrative);
        if (!validation.success) {
          console.warn('[World Bible] Narrative blocked, using fallback:', validation.log);
          // Use modified content or fallback
          return validation.content || getContextualFallback(genre);
        }
        
        // Post-process for language formatting (client-side)
        const processedContent = postProcessLanguageInResponse(validation.content, languageState);
        
        // Return validated and language-processed content
        return processedContent;
      }
      
      // If no narrative at all, generate a local neutral continuation
      return getContextualFallback(genre);
    } catch (error) {
      // Network or parsing error - generate local fallback to maintain immersion
      console.error('Error generating narrative:', error);
      
      // Store the failed action for retry (if this was a player action)
      if (playerAction) {
        setLastFailedAction({
          action: playerAction,
          diceRoll: diceRoll,
          storySnapshot: history.slice(0, -1), // Story before the player action was added
        });
        
        toast.error('Failed to reach AI', {
          description: 'Tap "Retry" to try again',
          duration: 10000,
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryRequested(true);
            },
          },
        });
      } else {
        toast.error('Failed to reach AI. Using fallback narrative.');
      }
      
      return getContextualFallback(scenarioSelection?.genre);
    } finally {
      // === RACE CONDITION FIX: Always release lock ===
      releaseGenerationLock(requestId);
      
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [character, cheatMode, campaignMemory, getCampaignContext, currentMood, settings.enableMoodSystem, settings.adultContent, scenarioSelection?.genre, getEnhancedPromptWithContract, validateContent, worldBible, toneState, languageState, sceneNPCs, worldState, narrativeQueue, activeRumors, playerLocation, activeConsequences]);

  // === WRAPPER: generateNarrative with automatic retry on failure ===
  // This wraps generateNarrativeWithRetry and handles automatic retry with reduced context
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
        
        // If we got a valid narrative (not a fallback), return it
        if (result && !result.includes('The moment stretches') && !result.includes('You pause')) {
          return result;
        }
        
        // If we got any result on the first try, use it
        if (retryLevel === 0 && result) {
          return result;
        }
        
        // Otherwise continue to next retry level with reduced context
        console.log(`[generateNarrative] Attempt ${retryLevel + 1} returned fallback, trying with reduced context...`);
        
      } catch (error) {
        console.error(`[generateNarrative] Attempt ${retryLevel + 1} failed:`, error);
        
        // If this was the last retry, return fallback
        if (retryLevel === MAX_RETRIES) {
          return getContextualFallback(scenarioSelection?.genre);
        }
        
        // Otherwise continue to next retry level
        console.log(`[generateNarrative] Retrying with reduced context (level ${retryLevel + 1})...`);
      }
    }
    
    return getContextualFallback(scenarioSelection?.genre);
  }, [generateNarrativeWithRetry, scenarioSelection?.genre]);

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
              setPendingMechanics(prev => ({ ...prev, ...enhancedMechanics }));
            }
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
      // Build mechanics tags from pending mechanics (includes new itemsUsed from Phase 2)
      const mechanicsTags: MechanicsTags = {
        loot: pendingMechanics?.lootGained 
          ? (Array.isArray(pendingMechanics.lootGained) ? pendingMechanics.lootGained : [pendingMechanics.lootGained])
          : [],
        drop: pendingMechanics?.itemsDropped
          ? (Array.isArray(pendingMechanics.itemsDropped) ? pendingMechanics.itemsDropped : [pendingMechanics.itemsDropped])
          : [],
        // Phase 2: Include consumed items from [USE:] tags
        use: pendingMechanics?.itemsUsed
          ? (Array.isArray(pendingMechanics.itemsUsed) ? pendingMechanics.itemsUsed : [pendingMechanics.itemsUsed])
          : [],
        // Also pass the edge function format for compatibility
        lootGained: pendingMechanics?.lootGained as string[] | undefined,
        itemsDropped: pendingMechanics?.itemsDropped as string[] | undefined,
        itemsUsed: pendingMechanics?.itemsUsed as string[] | undefined,
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
      const data = await response.json();
      if (data.imageUrl) {
        setStory(prev => prev.map(e => 
          e.id === entryId ? { ...e, imageUrl: data.imageUrl } : e
        ));
      }
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setGeneratingImageFor(undefined);
    }
  }, [story, scenarioSelection, characterVisualProfile]);

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
  }, []);

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
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      const narrativeContent = data.narrative || generateImmersiveOpening({
        character,
        genre,
        scenario: scenarioSelection.scenario,
        secondaryGenres,
      });
      
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
      toast.error('Failed to regenerate world. Please try again.');
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
    saveData(rolledBackStory, character, scenarioSelection.scenario, scenarioSelection.genre);
    
    // Also sync to campaign immediately
    if (campaignContext?.syncNarrativeHistory) {
      campaignContext.syncNarrativeHistory(rolledBackStory);
    }
    
    console.log(`[Story Rollback] Reverted to entry ${entryIndex}, discarded ${story.length - entryIndex - 1} entries`);
  }, [story, character, scenarioSelection, saveData, isLoading, campaignContext]);

  // Load save with campaign memory restoration
  const handleLoadSave = useCallback((save: GameSave) => {
    const gameData = save.gameData as { story?: StoryEntry[]; character?: RPGCharacter };
    
    if (gameData.story && gameData.character) {
      // Migrate character health if needed (for old characters with low HP)
      const migratedCharacter = migrateCharacterHealth(gameData.character);
      
      // Character inventory is stored with character - no global sync needed
      
      setStory(gameData.story);
      setCharacter(migratedCharacter);
      
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
        onCloseSceneImage={() => setSceneImageUrl(null)}
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