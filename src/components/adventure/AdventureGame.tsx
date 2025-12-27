import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { shouldIllustrateScene, SceneTrigger } from '@/components/game/SceneIllustration';
import { AdventureCreator, ScenarioSelection } from './AdventureCreator';
import { CharacterCreation } from './CharacterCreation';
import { AdventureDisplay } from './AdventureDisplay';
import { CrashRecoveryPrompt } from './CrashRecoveryPrompt';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ColorSelectionScreen } from '@/components/ui/ColorSelectionScreen';
import { loadColorPreference, getSavedColorId } from '@/lib/colorTheme';
import { RPGCharacter } from '@/types/rpgCharacter';
import { GameGenre, GENRE_DATA } from '@/types/genreData';
import { DiceMode, loadDiceMode, saveDiceMode } from '@/game/diceSystem';
import { useGame } from '@/contexts/GameContext';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { toast } from 'sonner';
import { generateNeutralContinuation } from '@/lib/narrativeFilter';
import { GameSave, getMostRecentSave } from '@/lib/saveSystem';
import { formatMemoryContextForAI, processActionForIdentity } from '@/game/campaignMemorySystem';
import { CoreMoodType, MOOD_COLORS, GENRE_MOOD_DESCRIPTORS } from '@/game/moodSystem';
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
  buildObjectOwnershipContext,
  validateObjectRegistry,
  repairObjectRegistry,
} from '@/game/objectRegistrySystem';
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
} from '@/game/npcAutoRegistration';
import {
  buildConsequenceContext,
  buildWorldStateContext,
} from '@/game/rippleEffectSystem';
import {
  setJournalContext,
  clearJournalContext,
} from '@/lib/relationshipJournal';
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
  isGenerationInProgress
} from '@/lib/narrativeGuard';

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

// Genre-specific fallback openings with blend support - moved outside component for reuse
interface SecondaryGenreBlend {
  genreId: string;
  blendStrength: number;
}

const GENRE_FLAVORS: Record<string, { tone: string; element: string; atmosphere: string }> = {
  fantasy: { tone: 'mystical', element: 'ancient magic hummed in the air', atmosphere: 'wonder and destiny' },
  scifi: { tone: 'technological', element: 'systems hummed with data', atmosphere: 'vast unknowns awaited' },
  horror: { tone: 'dread-filled', element: 'shadows seemed to watch', atmosphere: 'unease crept through every moment' },
  mystery: { tone: 'enigmatic', element: 'secrets lurked beneath the surface', atmosphere: 'truth waited to be uncovered' },
  pirate: { tone: 'adventurous', element: 'salt spray and distant horizons called', atmosphere: 'fortune and danger intertwined' },
  western: { tone: 'rugged', element: 'dust and determination defined the land', atmosphere: 'survival demanded grit' },
  cyberpunk: { tone: 'neon-drenched', element: 'data streams and chrome glinted', atmosphere: 'the megacorps controlled everything' },
  postapoc: { tone: 'desolate', element: 'ruins of the old world stood silent', atmosphere: 'every day was a fight' },
  war: { tone: 'tense', element: 'the calm before battle hung heavy', atmosphere: 'duty called without mercy' },
  cosmic_horror: { tone: 'insignificant', element: 'vast incomprehensible forces stirred', atmosphere: 'sanity was a fragile thing' },
  modern_life: { tone: 'relatable', element: 'the hum of city life surrounded everything', atmosphere: 'dreams and reality intertwined' },
};

function buildBlendedFallbackOpening(
  primaryGenre: string, 
  charName: string, 
  scenario: string,
  secondaryGenres: SecondaryGenreBlend[]
): string {
  const primaryFlavor = GENRE_FLAVORS[primaryGenre] || { tone: 'uncertain', element: 'possibilities unfolded', atmosphere: 'adventure awaited' };
  
  // Build base opening with primary genre
  let opening = `${charName} stood at a crossroads where ${primaryFlavor.element}. `;
  
  // Blend in secondary genres proportionally
  if (secondaryGenres.length > 0) {
    const blendedElements: string[] = [];
    for (const sg of secondaryGenres) {
      const flavor = GENRE_FLAVORS[sg.genreId];
      if (flavor && sg.blendStrength > 0.1) { // Only include if >10% blend
        blendedElements.push(flavor.element);
      }
    }
    if (blendedElements.length > 0) {
      opening += `Here, ${blendedElements.slice(0, 2).join(' and ')}. `;
    }
  }
  
  opening += `In this ${primaryFlavor.tone} world, ${primaryFlavor.atmosphere}. The path ahead was uncertain, but the first step waited to be taken.`;
  
  return opening;
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

type GamePhase = 'loading' | 'recovery' | 'scenario' | 'color' | 'character' | 'playing';

const STORY_KEY = 'untold-adventure-story';
const CHARACTER_KEY = 'untold-adventure-character';
const SCENARIO_KEY = 'untold-adventure-scenario';
const GENRE_KEY = 'untold-adventure-genre';
const COLOR_KEY = 'untold-ui-color-theme';

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
    diceMode,
    // World Bible
    initializeWorldBible,
    validateContent,
    getEnhancedPromptWithContract,
    worldBible,
    restoreWorldBible,
  } = useGame();
  
  // Campaign context (optional - may not be available)
  const campaignContext = useCampaignOptional();
  
  // Initial loading state - quick initialization
  const [initialLoading, setInitialLoading] = useState(true);

  // Load saved state - also check campaign system
  const [phase, setPhase] = useState<GamePhase>('loading');
  
  const [selectedColorId, setSelectedColorId] = useState<string | null>(() => getSavedColorId());
  const [scenarioSelection, setScenarioSelection] = useState<ScenarioSelection | null>(null);
  
  // Character and story - will be initialized from campaign or localStorage
  const [character, setCharacter] = useState<RPGCharacter | null>(null);
  const [story, setStory] = useState<StoryEntry[]>([]);
  
  // Track if we need to generate initial narrative for a restored campaign with empty history
  const needsInitialNarrative = useRef<boolean>(false);
  const hasInitialized = useRef<boolean>(false);
  
  // Initialize from active campaign or localStorage after initial loading completes
  useEffect(() => {
    // Skip if not done loading or already initialized
    if (initialLoading || hasInitialized.current) return;
    // Skip if not in loading phase
    if (phase !== 'loading') return;
    
    hasInitialized.current = true;
    
    // First check if there's an active campaign in the new system
    if (campaignContext?.activeCampaign) {
      const campaign = campaignContext.activeCampaign;
      console.log('[AdventureGame] Restoring active campaign:', campaign.meta.name);
      
      // Set relationship journal context for this campaign + character
      setJournalContext(campaign.id, campaign.player.name);
      
      setCharacter(campaign.player);
      setStory(campaign.narrativeHistory);
      setScenarioSelection({
        scenario: campaign.scenario,
        genre: campaign.meta.primaryGenre,
        genreTitle: campaign.meta.name,
        diceMode: loadDiceMode(),
      });
      
      // Restore world bible if available
      if (campaign.worldBible) {
        restoreWorldBible(JSON.stringify(campaign.worldBible));
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
        const char = JSON.parse(savedChar);
        const storyData = JSON.parse(savedStory);
        if (char && storyData.length > 0) {
          console.log('[AdventureGame] Restoring from localStorage');
          setCharacter(char);
          setStory(storyData);
          if (savedScenario && savedGenre) {
            setScenarioSelection({
              scenario: savedScenario,
              genre: savedGenre as GameGenre,
              genreTitle: savedGenre,
              diceMode: loadDiceMode(),
            });
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
  }, [initialLoading, phase, campaignContext?.activeCampaign, restoreWorldBible]);
  
  
  // Sync local state when campaign data changes (e.g., after checkpoint restore)
  const lastSyncedTick = useRef<number>(-1);
  useEffect(() => {
    if (phase !== 'playing' || !campaignContext?.activeCampaign) return;
    
    const campaign = campaignContext.activeCampaign;
    const currentTick = campaign.currentTick;
    
    // Only sync if tick changed (indicates checkpoint restore or external change)
    if (currentTick !== lastSyncedTick.current) {
      lastSyncedTick.current = currentTick;
      setStory(campaign.narrativeHistory);
      setCharacter(campaign.player);
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

  const [isLoading, setIsLoading] = useState(false);
  const [cheatMode, setCheatMode] = useState(false);
  const [pendingMechanics, setPendingMechanics] = useState<GameMechanics | undefined>();
  const [generatingImageFor, setGeneratingImageFor] = useState<string | undefined>();
  const lastIllustrationTick = useRef<number>(0);
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  
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
  const [gameLoopState, gameLoopActions] = useGameLoop(campaignMemory?.campaign.currentTick || 0);
  
  // Destructure for easier access
  const { worldState, narrativeQueue, activeRumors, sceneNPCs, playerLocation, activeConsequences } = gameLoopState;
  const { processPlayerAction: processActionForRipples, advanceTurn, setSceneNPCs, moveToZone, getLocationContext } = gameLoopActions;
  
  // Helper to get time of day based on system time (can be enhanced with in-game time)
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 2) return 'night';
    return 'late_night';
  };
  
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
  const lastValidationTurn = useRef<number>(0);
  useEffect(() => {
    const currentTurn = campaignMemory?.campaign.currentTick || 0;
    
    // Only run validation every 5 turns
    if (currentTurn - lastValidationTurn.current < 5) return;
    lastValidationTurn.current = currentTurn;
    
    console.log(`[Consistency Validation] Running at turn ${currentTurn}...`);
    
    // Validate object registry
    const objectErrors = validateObjectRegistry();
    if (objectErrors.length > 0) {
      console.warn('[Consistency] Object registry errors detected:', objectErrors);
      repairObjectRegistry(objectErrors);
      toast.info(`Fixed ${objectErrors.length} object consistency issue(s)`, { duration: 3000 });
    }
    
    // Validate NPC relationships
    const npcErrors = validateNPCRelationships();
    if (npcErrors.length > 0) {
      console.warn('[Consistency] NPC relationship errors detected:', npcErrors);
      repairNPCRelationships(npcErrors);
      toast.info(`Fixed ${npcErrors.length} NPC consistency issue(s)`, { duration: 3000 });
    }
    
    if (objectErrors.length === 0 && npcErrors.length === 0) {
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneDescription: description.slice(0, 500),
            style: scenarioSelection?.genre || 'fantasy',
            mood: trigger.type === 'combat_start' ? 'intense' : 
                  trigger.type === 'dramatic_moment' ? 'dramatic' :
                  trigger.type === 'romantic_scene' ? 'romantic' : 'atmospheric',
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
  }, [isGeneratingScene, scenarioSelection]);

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

  const generateNarrative = useCallback(async (
    scenario: string,
    playerAction?: string,
    history: StoryEntry[] = [],
    diceRoll?: any,
    char?: RPGCharacter,
    skipLoadingState?: boolean
  ) => {
    const activeChar = char || character;
    if (!activeChar) return null;
    
    // === RACE CONDITION FIX: Validate state before generation ===
    const generationState = {
      character: activeChar,
      worldBible: worldBible,
      scenario: scenario,
      genre: scenarioSelection?.genre || null,
    };
    
    const stateValidation = validateGenerationState(generationState);
    if (!stateValidation.ready) {
      console.warn('[generateNarrative] State not ready, using fallback. Missing:', stateValidation.missing);
      return getContextualFallback(scenarioSelection?.genre);
    }
    
    // === RACE CONDITION FIX: Acquire generation lock ===
    const requestId = `gen_${Date.now()}`;
    const lockAcquired = await acquireGenerationLock(requestId);
    if (!lockAcquired) {
      console.warn('[generateNarrative] Could not acquire lock, request cancelled');
      return null;
    }
    
    // Only manage loading state if not handled by caller
    if (!skipLoadingState) {
      setIsLoading(true);
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: enhancedScenario,
            playerAction: cleanedPlayerAction,
            conversationHistory: history.map(e => ({ role: e.role, content: e.content })),
            cheatMode,
            character: activeChar,
            diceRoll,
            memoryContext: formattedMemory.fullContext ? formattedMemory : undefined,
            emotionalContext,
            // Pass genre contract summary for AI awareness
            genreContract: worldBible?.contractSummary || null,
            // Pass adult content setting for NSFW control
            adultContent: settings.adultContent,
            // Pass narrator style configuration
            narratorConfig: settings.narratorConfig,
            // Pass tone adaptation context
            toneContext: toneContextPayload,
            // Pass language barrier context
            languageContext: languageContextPayload,
            // Pass dice mode for roll frequency
            diceMode: diceMode,
            // === NEW SYSTEMS ===
            // NPC Psychology (grudges, debts, relationships)
            npcPsychologyContext: npcPsychologyPayload,
            // Ripple effects and world state
            rippleContext: ripplePayload,
            // Unreliable information and rumors
            unreliableInfoContext: unreliableInfoPayload,
            // Location and zone context
            locationContext: locationContextPayload,
            // === CONSISTENCY SYSTEMS ===
            consistencyContext: {
              objectOwnership: buildObjectOwnershipContext(),
              npcIdentity: buildNPCIdentityContext(),
              playerCorrections: buildPlayerCorrectionsContext(),
            },
            // === LIVING WORLD: Background NPC actions ===
            backgroundNPCActionsContext: backgroundNPCActionsPayload,
          }),
        }
      );

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
      if (data.mechanics) {
        setPendingMechanics(data.mechanics);
        
        // Handle language learning from backend
        if (data.mechanics.languagesLearned && data.mechanics.languagesLearned.length > 0) {
          for (const learned of data.mechanics.languagesLearned) {
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
      toast.error('Failed to reach AI. Using fallback narrative.');
      return getContextualFallback(scenarioSelection?.genre);
    } finally {
      // === RACE CONDITION FIX: Always release lock ===
      releaseGenerationLock(requestId);
      
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [character, cheatMode, campaignMemory, getCampaignContext, currentMood, settings.enableMoodSystem, settings.adultContent, scenarioSelection?.genre, getEnhancedPromptWithContract, validateContent, worldBible, toneState, languageState, sceneNPCs, worldState, narrativeQueue, activeRumors, playerLocation, activeConsequences]);

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: scenarioSelection.scenario,
            playerAction: `travel to ${newZone.name}`,
            conversationHistory: story.slice(-10).map(e => ({ role: e.role, content: e.content })),
            character: character,
            adultContent: settings.adultContent,
            genreContract: worldBible?.contractSummary || null,
            narratorConfig: settings.narratorConfig,
            locationContext: locationTransitionContext,
            // Include consistency context for zone transitions too
            consistencyContext: {
              objectOwnership: buildObjectOwnershipContext(),
              npcIdentity: buildNPCIdentityContext(),
              playerCorrections: buildPlayerCorrectionsContext(),
            },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario: scenarioSelection.scenario,
              conversationHistory: [],
              character: character,
              adultContent: settings.adultContent,
              genreContract: worldBible?.contractSummary || null,
              narratorConfig: settings.narratorConfig,
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
        
        const narrativeContent = data.narrative || buildBlendedFallbackOpening(
          scenarioSelection.genre, 
          character.name, 
          scenarioSelection.scenario,
          secondaryGenres
        );
        
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
        const fallbackContent = buildBlendedFallbackOpening(
          scenarioSelection.genre,
          character.name,
          scenarioSelection.scenario,
          secondaryGenres
        );
        
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
    
    // Convert secondary genres from percentage (0-30) to decimal (0-0.30) for World Bible
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

  // Step 2: Character creation complete -> start game directly (no loadout)
  const handleCharacterComplete = useCallback(async (char: RPGCharacter & { portraitUrl?: string }, scenario: string) => {
    if (!scenarioSelection) return;
    
    setCharacter(char);
    setIsLoading(true);
    
    try {
      // Initialize campaign memory for new adventure
      const campaignId = `campaign_${char.name}_${Date.now()}`;
      const toneProfile = scenarioSelection.genre ? [scenarioSelection.genre] : [];
      initializeCampaign(campaignId, char.name, toneProfile);
      console.log(`[Campaign Memory] Initialized new campaign: ${campaignId} for ${char.name}`);
      
      // Set relationship journal context for this new campaign + character
      setJournalContext(campaignId, char.name);
      
      // Create campaign in new campaign system if available
      if (campaignContext && worldBible) {
        const newCampaign = campaignContext.createCampaign(worldBible, char, scenarioSelection.scenario);
        console.log(`[Campaign System] Created campaign: ${newCampaign.meta.name}`);
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
      const narrativeContent = narrative || buildBlendedFallbackOpening(
        scenarioSelection.genre || 'fantasy',
        char.name,
        scenarioSelection.scenario,
        worldBible?.secondaryGenres || []
      );
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
      
      console.log('[AdventureGame] Character created, transitioning to playing phase');
      setPhase('playing');
    } catch (error) {
      console.error('[AdventureGame] Character complete failed:', error);
      // Still transition to playing with blended fallback story
      const fallbackStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: buildBlendedFallbackOpening(
          scenarioSelection.genre || 'fantasy',
          char.name,
          scenarioSelection.scenario,
          worldBible?.secondaryGenres || []
        ),
        timestamp: Date.now(),
      }];
      setStory(fallbackStory);
      saveData(fallbackStory, char, scenarioSelection.scenario, scenarioSelection.genre || 'fantasy');
      setPhase('playing');
    } finally {
      setIsLoading(false);
    }
  }, [scenarioSelection, generateNarrative, saveData, initializeCampaign, campaignContext, worldBible]);



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

    const playerEntry: StoryEntry = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: action,
      timestamp: Date.now(),
    };
    
    const updatedStory = [...story, playerEntry];
    setStory(updatedStory);
    
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
      
      // Add narrator response to campaign narrative
      if (campaignContext) {
        campaignContext.addNarrativeEntry(narratorEntry);
      }
      
      // === NPC AUTO-REGISTRATION: Detect and register NPCs from narrative ===
      const npcResult = processNarrativeForNPCs(narrative, currentTurn, character.name);
      if (npcResult.registered.length > 0) {
        console.log(`[NPCAutoReg] Registered ${npcResult.registered.length} NPCs:`, npcResult.registered);
      }
      
      // Process action for identity anchors and advance time
      if (campaignMemory) {
        const updatedMemory = processActionForIdentity(campaignMemory, action, narrative, currentTurn);
        updateCampaignMemory(updatedMemory);
        advanceCampaignTime(1); // Each action is 1 tick
      }
      
      // Check for scene illustration triggers
      checkSceneTriggers('observation', narrative);
    }
  }, [story, scenarioSelection, character, generateNarrative, saveData, checkSceneTriggers, campaignMemory, updateCampaignMemory, advanceCampaignTime, campaignContext, worldState.securityLevel, processActionForRipples, advanceTurn]);

  // Generate scene image
  const handleGenerateImage = useCallback(async (entryId: string) => {
    const entry = story.find(e => e.id === entryId);
    if (!entry) return;

    setGeneratingImageFor(entryId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sceneDescription: entry.content.slice(0, 500),
            style: scenarioSelection?.genre || 'fantasy',
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
  }, [story, scenarioSelection]);

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
      setStory(gameData.story);
      setCharacter(gameData.character);
      
      // Restore campaign memory if available
      if (save.campaignMemory) {
        const restored = restoreCampaignFromSave(save.campaignMemory);
        if (restored) {
          console.log(`[Campaign Memory] Restored campaign for ${save.characterName}`);
        } else {
          // Failed to restore, initialize a new one for continuity
          const campaignId = `campaign_${gameData.character.name}_restored_${Date.now()}`;
          initializeCampaign(campaignId, gameData.character.name, []);
          console.log(`[Campaign Memory] Initialized new campaign for restored save: ${campaignId}`);
        }
      } else {
        // Legacy save without campaign memory - initialize new
        const campaignId = `campaign_${gameData.character.name}_legacy_${Date.now()}`;
        initializeCampaign(campaignId, gameData.character.name, []);
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

  // Show loading screen on initial load
  if (initialLoading) {
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

  // Phase 1: Scenario selection
  if (phase === 'scenario') {
    return <AdventureCreator onSelect={handleScenarioSelect} isLoading={isLoading} />;
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
      />
    );
  }

  // Fallback
  return <AdventureCreator onSelect={handleScenarioSelect} isLoading={isLoading} />;
}