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
import { StoryEntry } from './types';

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
    // World Bible
    initializeWorldBible,
    validateContent,
    getEnhancedPromptWithContract,
    worldBible,
    restoreWorldBible,
  } = useGame();
  
  // Campaign context (optional - may not be available)
  const campaignContext = useCampaignOptional();
  
  // Initial loading state
  const [initialLoading, setInitialLoading] = useState(true);

  // Load saved state - also check campaign system
  const [phase, setPhase] = useState<GamePhase>('loading');
  
  const [selectedColorId, setSelectedColorId] = useState<string | null>(() => getSavedColorId());
  const [scenarioSelection, setScenarioSelection] = useState<ScenarioSelection | null>(null);
  
  // Character and story - will be initialized from campaign or localStorage
  const [character, setCharacter] = useState<RPGCharacter | null>(null);
  const [story, setStory] = useState<StoryEntry[]>([]);
  
  // Initialize from active campaign or localStorage after initial loading completes
  // Track if we need to generate initial narrative for a campaign with empty history
  const needsInitialNarrative = useRef<boolean>(false);
  
  useEffect(() => {
    // Wait for initial loading to complete
    if (initialLoading) return;
    // Skip if already initialized (not in loading phase)
    if (phase !== 'loading') return;
    
    // First check if there's an active campaign in the new system
    if (campaignContext?.activeCampaign) {
      const campaign = campaignContext.activeCampaign;
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
      
      // Check if we need to generate initial narrative
      if (campaign.narrativeHistory.length === 0) {
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
      } catch {}
    }
    
    // Check if there are any saves - if so, show recovery prompt
    const recentSave = getMostRecentSave();
    if (recentSave) {
      setPhase('recovery');
      return;
    }
    
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
  
  // Persist mood changes
  useEffect(() => {
    localStorage.setItem('untold-player-mood', JSON.stringify(currentMood));
  }, [currentMood]);
  
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

  // Handle initial loading complete and load color
  useEffect(() => {
    loadColorPreference();
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2500);
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
    
    // Only manage loading state if not handled by caller
    if (!skipLoadingState) {
      setIsLoading(true);
    }

    try {
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: enhancedScenario,
            playerAction,
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
          }),
        }
      );

      const data = await response.json();
      
      // Use the narrative even if response wasn't "ok" - the edge function now returns fallbacks
      if (data.mechanics) setPendingMechanics(data.mechanics);
      
      // If we have a narrative, validate it through World Bible
      if (data.narrative) {
        const validation = validateContent(data.narrative);
        if (!validation.success) {
          console.warn('[World Bible] Narrative blocked, using fallback:', validation.log);
          // Use modified content or fallback
          return validation.content || generateNeutralContinuation({ lastAction: playerAction });
        }
        // Return validated (possibly reskinned) content
        return validation.content;
      }
      
      // If no narrative at all, generate a local neutral continuation
      return generateNeutralContinuation({ lastAction: playerAction });
    } catch (error) {
      // Network or parsing error - generate local fallback to maintain immersion
      console.error('Error generating narrative:', error);
      return generateNeutralContinuation({ lastAction: playerAction });
    } finally {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [character, cheatMode, campaignMemory, getCampaignContext, currentMood, settings.enableMoodSystem, settings.adultContent, scenarioSelection?.genre, getEnhancedPromptWithContract, validateContent, worldBible]);

  // Generate initial narrative for campaigns with empty history
  useEffect(() => {
    if (phase !== 'playing' || !needsInitialNarrative.current) return;
    if (!character || !scenarioSelection) return;
    
    needsInitialNarrative.current = false;
    
    const generateInitialStory = async () => {
      console.log('[AdventureGame] Generating initial narrative for campaign with empty history');
      
      const narrative = await generateNarrative(
        scenarioSelection.scenario,
        undefined,
        [],
        undefined,
        character,
        true // skipLoadingState - we manage it here
      );
      
      const narrativeContent = narrative || `You find yourself at the beginning of a new adventure. The world awaits your first move.`;
      const newStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrativeContent,
        timestamp: Date.now(),
      }];
      
      setStory(newStory);
      saveData(newStory, character, scenarioSelection.scenario, scenarioSelection.genre);
      
      // Add to campaign narrative history
      if (campaignContext) {
        campaignContext.addNarrativeEntry(newStory[0]);
      }
      
      setIsLoading(false);
    };
    
    generateInitialStory();
  }, [phase, character, scenarioSelection, generateNarrative, saveData, campaignContext]);

  // Step 1: Scenario selection -> Color selection
  const handleScenarioSelect = useCallback((selection: ScenarioSelection) => {
    setScenarioSelection(selection);
    // Set the dice mode in the game context
    setDiceMode(selection.diceMode);
    
    // Initialize World Bible (Genre Contract System)
    initializeWorldBible({
      campaignName: selection.genreTitle || selection.scenario.slice(0, 50),
      primaryGenre: selection.genre,
      secondaryGenres: [],
      hardLock: false,
      tabooList: [],
      intrusionBudget: 2,
    });
    console.log(`[World Bible] Created for genre: ${selection.genre}`);
    
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

  // Step 2: Character creation complete
  const handleCharacterComplete = useCallback(async (char: RPGCharacter & { portraitUrl?: string }, scenario: string) => {
    setCharacter(char);
    setIsLoading(true);
    
    // Initialize campaign memory for new adventure
    const campaignId = `campaign_${char.name}_${Date.now()}`;
    const toneProfile = scenarioSelection?.genre ? [scenarioSelection.genre] : [];
    initializeCampaign(campaignId, char.name, toneProfile);
    console.log(`[Campaign Memory] Initialized new campaign: ${campaignId} for ${char.name}`);
    
    // Create campaign in new campaign system if available
    if (campaignContext && worldBible) {
      const newCampaign = campaignContext.createCampaign(worldBible, char, scenario);
      console.log(`[Campaign System] Created campaign: ${newCampaign.meta.name}`);
    }

    // Pass skipLoadingState=true since we manage loading ourselves
    const narrative = await generateNarrative(scenario, undefined, [], undefined, char, true);
    
    // Create story entry (use fallback if narrative generation failed)
    const narrativeContent = narrative || `You find yourself at the beginning of a new adventure. The world awaits your first move.`;
    const newStory: StoryEntry[] = [{
      id: `narrator_${Date.now()}`,
      role: 'narrator',
      content: narrativeContent,
      timestamp: Date.now(),
    }];
    setStory(newStory);
    saveData(newStory, char, scenario, scenarioSelection?.genre || 'fantasy');
    
    // Add to campaign narrative history
    if (campaignContext) {
      campaignContext.addNarrativeEntry(newStory[0]);
    }
    
    // Set playing BEFORE clearing loading so the transition happens while loading overlay is still visible
    setPhase('playing');
    setIsLoading(false);
  }, [generateNarrative, saveData, scenarioSelection, initializeCampaign, campaignContext, worldBible]);

  // Back to scenario selection
  const handleBackToScenario = useCallback(() => {
    setPhase('scenario');
    setScenarioSelection(null);
  }, []);

  // Player action during game
  const handlePlayerAction = useCallback(async (action: string, diceRoll?: any) => {
    if (!character || !scenarioSelection) return;

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
      
      // Process action for identity anchors and advance time
      if (campaignMemory) {
        const currentTick = campaignMemory.campaign.currentTick;
        const updatedMemory = processActionForIdentity(campaignMemory, action, narrative, currentTick);
        updateCampaignMemory(updatedMemory);
        advanceCampaignTime(1); // Each action is 1 tick
      }
      
      // Check for scene illustration triggers
      checkSceneTriggers('observation', narrative);
    }
  }, [story, scenarioSelection, character, generateNarrative, saveData, checkSceneTriggers, campaignMemory, updateCampaignMemory, advanceCampaignTime, campaignContext]);

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
  const handleRollbackToEntry = useCallback((entryIndex: number) => {
    if (!character || !scenarioSelection) return;
    
    // Keep story up to and including the target entry
    const rolledBackStory = story.slice(0, entryIndex + 1);
    setStory(rolledBackStory);
    saveData(rolledBackStory, character, scenarioSelection.scenario, scenarioSelection.genre);
    
    console.log(`[Story Rollback] Reverted to entry ${entryIndex}, discarded ${story.length - entryIndex - 1} entries`);
  }, [story, character, scenarioSelection, saveData]);

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
    return <LoadingScreen isLoading={true} message="Initializing Living World Engine..." />;
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