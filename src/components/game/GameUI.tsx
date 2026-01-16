import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameEvent, NPC } from '@/types/game';
import { CharacterData, SPAWN_POINTS } from '@/types/characterCreation';
import { useMessageNavigation } from '@/hooks/useMessageNavigation';
// Audio system removed - no sound in game
import { 
  createInitialGameState, 
  processAction, 
  parseCommand,
  updateLocationNPCs,
  processDebugCommand,
  getTimePeriod,
} from '@/game/gameEngine';
import { createLifeSimFromCharacter, generateCharacterIntroNarrative, getSpawnLocationId } from '@/game/characterIntegration';
import { generateGenericNPC, getSpawnCount, generateRandomEncounter } from '@/game/genericNPCSystem';
import { 
  NPCMemoryStore, 
  initializeMemoryStore, 
  createMemory, 
  recallMemories, 
  triggerMemory,
  formatMemoriesForAI,
  updateImpression,
  decayMemories,
  processNPCGossip,
  generateGossipEvents,
} from '@/game/memorySystem';
// RPG Systems
import { 
  WeatherState, 
  initializeWeather, 
  updateWeather, 
  getWeatherDescription,
  getWeatherEffects,
  generateAmbientEvent,
  AmbientEvent,
} from '@/game/worldEventsSystem';
import { 
  QuestLog, 
  initializeQuestLog, 
  startQuest, 
  updateObjectiveProgress,
  abandonQuest,
  checkQuestAvailability,
  QUEST_DEFINITIONS,
} from '@/game/questSystem';
import { 
  CombatEncounter, 
  CombatOutcome,
  initializeCombat,
} from '@/game/combatSystem';
import {
  shouldTriggerHostileEncounter,
  generateHostileEncounter,
  HostileEncounter,
  dangerousLocations,
} from '@/game/genericNPCSystem';
import { CharacterCreation } from './CharacterCreation';
import { NarrativeDisplay } from './NarrativeDisplay';
import { PlayerInput } from './PlayerInput';
import { CharacterPanel } from './CharacterPanel';
import { MapPanel } from './MapPanel';
import { GameHeader } from './GameHeader';
import { WeatherDisplay } from './WeatherDisplay';
import { QuestJournal } from './QuestJournal';
import { CombatUI } from './CombatUI';
import { StoryModeSidebar } from './StoryModeSidebar';
import { toast } from 'sonner';
import { checkPlayerDeath, generateDeathNarrative } from '@/game/advancedDynamics';
import { calculateSimulationStats } from '@/game/metaSystems';
import { cn } from '@/lib/utils';
import { useGame } from '@/contexts/GameContext';
import { 
  AdrenalineSystemState,
  initializeAdrenalineSystem,
  processCombatDamage,
  tickAdrenalineSystem,
  triggerSituationalAdrenaline,
} from '@/game/adrenalineCombatIntegration';
import { FloatingStatContainer, useStatChanges } from './FloatingStatChange';
import { useScreenEffectsOptional } from './ScreenEffects';
import { MiniSessionStats, useSessionStatsOptional, SessionStatsDisplay } from './SessionStats';
import { useAchievementsOptional, AchievementsDisplay } from './Achievements';
import { StoryRecap } from './StoryRecap';
import { ClothingShop } from './ClothingShop';
import { ClothingItem } from '@/game/clothingItemSystem';

const STORAGE_KEY = 'living-world-save';
const CHARACTER_KEY = 'living-world-character';
const MEMORY_STORE_KEY = 'living-world-npc-memories';

// Conversation session type for tracking ongoing dialogues
interface ConversationSession {
  npcId: string;
  npcName: string;
  startTick: number;
  exchanges: Array<{
    playerSaid: string;
    npcResponse: string;
    tick: number;
  }>;
  importantTopics: string[]; // Topics flagged as important for stronger memories
}

// Dialogue indicators from AI response
interface DialogueIndicators {
  memoryReferenced: boolean;
  memoryDetails?: string;
  traumaTriggered: boolean;
  contradictionDetected: boolean;
  contradictionDetails?: string;
  emotionalState?: string;
}

// Generate AI dialogue for NPCs with memory context and conversation history
async function generateAIDialogue(
  npc: NPC, 
  playerInput: string, 
  location: string, 
  timeOfDay: string, 
  isFirst: boolean,
  memoryStore?: NPCMemoryStore,
  conversationHistory?: Array<{ playerSaid: string; npcResponse: string }>,
  isFarewell?: boolean,
  genre?: string
): Promise<{ dialogue: string; importantTopics: string[]; indicators?: DialogueIndicators } | null> {
  try {
    // Build memory context for the NPC
    let memoryContext = '';
    let impression = undefined;
    let activeTrauma = false;
    let recentMemories: string[] = [];
    let patterns: string[] = [];
    
    if (memoryStore) {
      memoryContext = formatMemoriesForAI(memoryStore, 'player', 8);
      
      const playerImpression = memoryStore.impressions['player'];
      if (playerImpression) {
        impression = {
          overallSentiment: playerImpression.overallSentiment,
          trustLevel: playerImpression.trustLevel,
          traits: playerImpression.traits,
        };
      }
      
      // Check for trauma triggers
      const traumaResult = triggerMemory(memoryStore, { 
        entities: ['player'], 
        location,
        keywords: playerInput.split(' ').filter(w => w.length > 3)
      }, Date.now());
      activeTrauma = traumaResult.traumaTriggered;
      
      // Get recent relevant memories
      const { memories } = recallMemories(memoryStore, {
        entities: ['player'],
        location,
      }, 5, Date.now());
      recentMemories = memories.map(m => m.summary);
      
      // Get patterns
      patterns = memoryStore.patterns
        .filter(p => p.relatedEntities.some(e => e.toLowerCase().includes('player')))
        .map(p => `${p.pattern} (${p.confidence}% confident)`);
    }
    
    // Get clothing context for NPC reactions
    let playerClothingContext = '';
    try {
      const { buildClothingContextForDialogue } = await import('@/game/npcClothingReactionSystem');
      playerClothingContext = buildClothingContextForDialogue();
    } catch (e) {
      // Clothing system not available
    }
    
    // Get body modification context (piercings, tattoos) for NPC reactions
    let playerAppearanceContext = '';
    try {
      const { buildAppearanceContextForAI } = await import('@/game/appearanceReactionSystem');
      // Load character from localStorage
      const savedCharacter = localStorage.getItem(CHARACTER_KEY);
      if (savedCharacter) {
        const character = JSON.parse(savedCharacter);
        if (character?.appearance?.full) {
          const full = character.appearance.full;
          playerAppearanceContext = buildAppearanceContextForAI(
            full.piercingStyle,
            full.tattooStyle,
            full.piercings || [],
            full.tattoos || [],
            genre || 'urban'
          );
        }
      }
    } catch (e) {
      // Appearance reaction system not available
    }
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-npc-dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npc: {
          name: npc.meta.name,
          age: npc.meta.age,
          occupation: npc.meta.occupation,
          description: npc.meta.description,
          traits: npc.meta.traits,
          currentActivity: npc.currentActivity,
          currentMood: npc.emotionalState.current,
          stressLevel: npc.stressLevel,
          relationship: npc.relationships.player || { affection: 0, trust: 0, fear: 0, respect: 0 },
          isGeneric: (npc as any).isGeneric || false,
          appearance: (npc as any).appearance,
          knownFacts: npc.knownFacts?.map(f => f.fact),
          memoryContext,
          impression,
          activeTrauma,
          recentMemories,
          patterns,
          playerClothingContext,
          playerAppearanceContext,
        },
        playerInput,
        location,
        timeOfDay,
        isFirstInteraction: isFirst,
        conversationHistory: conversationHistory || [],
        isFarewell: isFarewell || false,
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      return data.fallbackDialogue ? { dialogue: data.fallbackDialogue, importantTopics: [], indicators: undefined } : null;
    }
    
    const data = await response.json();
    return { 
      dialogue: data.dialogue, 
      importantTopics: data.importantTopics || [],
      indicators: data.indicators,
    };
  } catch (error) {
    console.error('Error generating AI dialogue:', error);
    return null;
  }
}

// Detect important topics from conversation for stronger memories
function detectImportantTopics(playerSaid: string, npcResponse: string): string[] {
  const importantKeywords = [
    'secret', 'promise', 'love', 'hate', 'kill', 'death', 'family', 'money',
    'help', 'please', 'sorry', 'forgive', 'trust', 'betray', 'truth', 'lie',
    'remember', 'never', 'always', 'important', 'dangerous', 'fear', 'scared'
  ];
  
  const combined = `${playerSaid} ${npcResponse}`.toLowerCase();
  return importantKeywords.filter(keyword => combined.includes(keyword));
}

// Format dialogue with visual indicators
function formatDialogueWithIndicators(
  npcName: string, 
  dialogue: string, 
  indicators?: DialogueIndicators
): string {
  let indicatorBadges = '';
  
  if (indicators) {
    const badges: string[] = [];
    
    if (indicators.memoryReferenced) {
      badges.push('🧠 *Referencing memory*');
    }
    if (indicators.traumaTriggered) {
      badges.push('⚠️ *Trauma triggered*');
    }
    if (indicators.contradictionDetected) {
      badges.push('❓ *Suspicious of contradiction*');
    }
    
    if (badges.length > 0) {
      indicatorBadges = `\n${badges.join(' | ')}`;
    }
  }
  
  return `**${npcName}**: "${dialogue}"${indicatorBadges}`;
}

export function GameUI() {
  const [showCharacterCreation, setShowCharacterCreation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const character = localStorage.getItem(CHARACTER_KEY);
    // Show character creation if no valid saved game exists
    // A valid game requires both a character AND a game state
    if (!character) return true;
    if (!saved) return true;
    try {
      const parsedChar = JSON.parse(character);
      const parsedSave = JSON.parse(saved);
      // Verify both have essential data
      return !parsedChar?.basicInfo?.name || !parsedSave?.player;
    } catch {
      return true;
    }
  });
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [storyPanelOpen, setStoryPanelOpen] = useState(false);
  
  // RPG System States
  const [weather, setWeather] = useState<WeatherState>(() => initializeWeather('spring'));
  const [questLog, setQuestLog] = useState<QuestLog>(() => {
    const saved = localStorage.getItem('living-world-quests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load quest log:', e);
      }
    }
    return initializeQuestLog();
  });
  const [showQuestJournal, setShowQuestJournal] = useState(false);
  const [showStoryRecap, setShowStoryRecap] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSessionStats, setShowSessionStats] = useState(false);
  const [showClothingShop, setShowClothingShop] = useState(false);
  const [activeCombat, setActiveCombat] = useState<CombatEncounter | null>(null);
  const [combatNPC, setCombatNPC] = useState<NPC | null>(null);
  
  // Game polish systems (optional - gracefully degrade if not available)
  const screenEffects = useScreenEffectsOptional();
  const sessionStats = useSessionStatsOptional();
  const achievementsContext = useAchievementsOptional();
  const { changes: statChanges, addChange: addStatChange, removeChange: removeStatChange } = useStatChanges();
  
  // Adrenaline System State
  const [adrenalineState, setAdrenalineState] = useState<AdrenalineSystemState>(() => {
    const saved = localStorage.getItem('living-world-adrenaline');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initializeAdrenalineSystem();
      }
    }
    return initializeAdrenalineSystem();
  });
  const [adrenalineEvent, setAdrenalineEvent] = useState<{
    type: 'wound_revealed' | 'damage_hidden';
    message?: string;
    vagueSymptom?: string;
  } | null>(null);
  
  // NPC Memory stores - persisted per NPC
  const [npcMemories, setNpcMemories] = useState<Record<string, NPCMemoryStore>>(() => {
    const saved = localStorage.getItem(MEMORY_STORE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load NPC memories:', e);
      }
    }
    return {};
  });
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return updateLocationNPCs(parsed);
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    }
    return updateLocationNPCs(createInitialGameState());
  });
  
  const [displayEvents, setDisplayEvents] = useState<GameEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Active conversation session (for 'say' command)
  const [conversationSession, setConversationSession] = useState<ConversationSession | null>(null);
  
  // Message navigation for scroll-to-message functionality
  const messageNav = useMessageNavigation();
  
  // Audio system fully removed - no sound in game
  
  // Save memories when they change
  useEffect(() => {
    localStorage.setItem(MEMORY_STORE_KEY, JSON.stringify(npcMemories));
  }, [npcMemories]);
  
  // Save quest log when it changes
  useEffect(() => {
    localStorage.setItem('living-world-quests', JSON.stringify(questLog));
  }, [questLog]);
  
  // Save adrenaline state when it changes
  useEffect(() => {
    localStorage.setItem('living-world-adrenaline', JSON.stringify(adrenalineState));
  }, [adrenalineState]);
  
  // Update weather periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => updateWeather(prev, gameState.time.season, 1));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [gameState.time.season]);
  
  // Tick adrenaline system for decay and wound reveals
  useEffect(() => {
    const interval = setInterval(() => {
      const result = tickAdrenalineSystem(adrenalineState, 10); // 10 seconds
      if (result.state !== adrenalineState) {
        setAdrenalineState(result.state);
      }
      // Show revealed wounds
      if (result.revealedWounds.length > 0) {
        const firstWound = result.revealedWounds[0];
        setAdrenalineEvent({
          type: 'wound_revealed',
          message: firstWound.message,
        });
        // Apply the revealed damage
        if (gameState.lifeSim) {
          setGameState(prev => ({
            ...prev,
            lifeSim: prev.lifeSim ? {
              ...prev.lifeSim,
              needs: {
                ...prev.lifeSim.needs,
                physical: {
                  ...prev.lifeSim.needs.physical,
                  health: Math.max(0, prev.lifeSim.needs.physical.health - firstWound.damage)
                }
              }
            } : null
          }));
        }
        toast.error(firstWound.message);
        setTimeout(() => setAdrenalineEvent(null), 4000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [adrenalineState, gameState.lifeSim]);
  
  const handleCharacterComplete = useCallback((character: CharacterData) => {
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(character));
    
    const newGameState = updateLocationNPCs(createInitialGameState());
    const lifeSimState = createLifeSimFromCharacter(character);
    
    // Set spawn location based on character creation selection
    const spawnLocationId = getSpawnLocationId(character.background.spawnPoint);
    
    newGameState.lifeSim = lifeSimState;
    newGameState.player = {
      ...newGameState.player,
      name: character.basicInfo.name,
      currentLocation: spawnLocationId,
      stats: {
        ...newGameState.player.stats,
        hunger: lifeSimState.needs.physical.hunger,
        energy: lifeSimState.needs.physical.energy,
        health: lifeSimState.needs.physical.health,
        mood: 100 - lifeSimState.needs.psychological.stress,
        gold: lifeSimState.economy.money,
      },
    };
    
    setGameState(newGameState);
    
    const introNarrative = generateCharacterIntroNarrative(character);
    const location = newGameState.locations[newGameState.player.currentLocation];
    const stats = calculateSimulationStats(newGameState);
    
    // Safety check - if spawn location doesn't exist, fallback to town_square
    if (!location) {
      console.warn(`Spawn location ${newGameState.player.currentLocation} not found, falling back to town_square`);
      newGameState.player.currentLocation = 'town_square';
      const fallbackLocation = newGameState.locations['town_square'];
      setDisplayEvents([{
        id: 'evt_intro',
        type: 'observation',
        content: `${introNarrative}\n\n---\n\nYou find yourself in **${fallbackLocation.name}**.\n\n${fallbackLocation.description}\n\n*Type "look" to examine your surroundings, or "help" for available commands.*\n\n*[Living World Engine active: ${stats.totalNPCs} NPCs, ${stats.totalRelationships} relationships tracked]*`,
        timestamp: 0,
      }]);
    } else {
      setDisplayEvents([{
        id: 'evt_intro',
        type: 'observation',
        content: `${introNarrative}\n\n---\n\nYou find yourself in **${location.name}**.\n\n${location.description}\n\n*Type "look" to examine your surroundings, or "help" for available commands.*\n\n*[Living World Engine active: ${stats.totalNPCs} NPCs, ${stats.totalRelationships} relationships tracked]*`,
        timestamp: 0,
      }]);
    }
    
    setShowCharacterCreation(false);
    toast.success(`Welcome, ${character.basicInfo.name}!`);
  }, []);
  
  useEffect(() => {
    if (displayEvents.length === 0 && !showCharacterCreation) {
      const location = gameState.locations[gameState.player.currentLocation];
      if (!location) {
        console.warn(`Current location ${gameState.player.currentLocation} not found`);
        return;
      }
      const stats = calculateSimulationStats(gameState);
      
      setDisplayEvents([{
        id: 'evt_welcome',
        type: 'observation',
        content: `You find yourself in **${location.name}**.\n\n${location.description}\n\n*Type "look" to examine your surroundings, or "help" for available commands.*\n\n*[Living World Engine active: ${stats.totalNPCs} NPCs, ${stats.totalRelationships} relationships tracked]*`,
        timestamp: 0,
      }]);
    }
  }, [showCharacterCreation]);
  
  // Cache for NPC portraits to avoid regenerating
  const npcPortraitCache = useRef<Record<string, string>>({});
  
  const generateNPCPortrait = useCallback(async (npc: any): Promise<string | undefined> => {
    // Check cache first
    if (npcPortraitCache.current[npc.id]) {
      return npcPortraitCache.current[npc.id];
    }
    
    // Check if NPC already has a portrait
    if (npc.portrait) {
      npcPortraitCache.current[npc.id] = npc.portrait;
      return npc.portrait;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-npc-portrait`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ npc }),
      });

      if (!response.ok) {
        console.error('Failed to generate NPC portrait:', response.status);
        return undefined;
      }

      const data = await response.json();
      if (data.imageUrl) {
        npcPortraitCache.current[npc.id] = data.imageUrl;
        return data.imageUrl;
      }
    } catch (error) {
      console.error('Error generating NPC portrait:', error);
    }
    return undefined;
  }, []);
  
  const handleCommand = useCallback(async (input: string) => {
    // Audio system removed - no sound in game
    
    // Handle RPG system commands before normal processing
    const lowerInput = input.toLowerCase().trim();
    
    // Quest journal command
    if (lowerInput === 'journal' || lowerInput === 'quests' || lowerInput === 'j') {
      setShowQuestJournal(true);
      setIsProcessing(false);
      return;
    }
    
    // Weather command
    if (lowerInput === 'weather') {
      const timePeriod = getTimePeriod(gameState.time.hour);
      const weatherDesc = getWeatherDescription(weather, timePeriod);
      const effects = getWeatherEffects(weather);
      
      let effectsText = '';
      if (effects.visibilityMod !== 0 || effects.outdoorActivityMod !== 0 || effects.moodMod !== 0) {
        effectsText = '\n\n**Current Effects:**';
        if (effects.visibilityMod !== 0) effectsText += `\n- Visibility: ${effects.visibilityMod}%`;
        if (effects.outdoorActivityMod !== 0) effectsText += `\n- Outdoor Activity: ${effects.outdoorActivityMod}%`;
        if (effects.moodMod !== 0) effectsText += `\n- Mood: ${effects.moodMod > 0 ? '+' : ''}${effects.moodMod}`;
      }
      
      setDisplayEvents(prev => [...prev, {
        id: `weather_${Date.now()}`,
        type: 'observation' as const,
        content: `**Current Weather:** ${weather.intensity} ${weather.current}\n\n${weatherDesc}${effectsText}`,
        timestamp: gameState.time.tick,
      }]);
      setIsProcessing(false);
      return;
    }
    
    // Attack command - initiate combat
    if (lowerInput.startsWith('attack ') || lowerInput.startsWith('fight ')) {
      const targetName = input.slice(lowerInput.startsWith('attack ') ? 7 : 6).trim().toLowerCase();
      const npcsHere = Object.values(gameState.npcs).filter(npc => npc.currentLocation === gameState.player.currentLocation);
      const targetNPC = npcsHere.find(npc => npc.meta.name.toLowerCase().includes(targetName));
      
      if (!targetNPC) {
        setDisplayEvents(prev => [...prev, {
          id: `err_${Date.now()}`,
          type: 'system' as const,
          content: `*You don't see anyone named "${targetName}" to fight.*`,
          timestamp: gameState.time.tick,
        }]);
        setIsProcessing(false);
        return;
      }
      
      if (!gameState.lifeSim) {
        setDisplayEvents(prev => [...prev, {
          id: `err_${Date.now()}`,
          type: 'system' as const,
          content: `*Combat system requires life sim state.*`,
          timestamp: gameState.time.tick,
        }]);
        setIsProcessing(false);
        return;
      }
      
      // Initialize combat
      const encounter = initializeCombat(
        gameState.lifeSim,
        targetNPC,
        gameState.player.currentLocation,
        []
      );
      
      setActiveCombat(encounter);
      setCombatNPC(targetNPC);
      
      setDisplayEvents(prev => [...prev, {
        id: `combat_start_${Date.now()}`,
        type: 'combat' as const,
        content: `**Combat Initiated!** You engage ${targetNPC.meta.name} in combat!`,
        timestamp: gameState.time.tick,
      }]);
      
      toast.warning(`Combat started with ${targetNPC.meta.name}!`);
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    
    setDisplayEvents(prev => [...prev, {
      id: `cmd_${Date.now()}`,
      type: 'system' as const,
      content: `> ${input}`,
      timestamp: gameState.time.tick,
    }]);
    
    const action = parseCommand(input);
    
    if (action.debug) {
      const { newState, message } = processDebugCommand(gameState, action.debug);
      setGameState(newState);
      setDisplayEvents(prev => [...prev, {
        id: `debug_${Date.now()}`,
        type: 'system' as const,
        content: `*[DEBUG] ${message}*`,
        timestamp: newState.time.tick,
      }]);
      setIsProcessing(false);
      return;
    }
    
    let { newState, events } = processAction(gameState, action);
    
    // Update weather when time passes
    if (action.type === 'wait' || action.type === 'go') {
      setWeather(prev => updateWeather(prev, newState.time.season, 1));
    }
    
    // Check for quest objective updates
    if (action.type === 'go') {
      // Check if going to a quest location
      const locationId = newState.player.currentLocation;
      const timePeriod = getTimePeriod(newState.time.hour) as 'morning' | 'afternoon' | 'evening' | 'night';
      
      // Audio system removed - no indoor/outdoor audio tracking
      
      // Warn about dangerous locations
      const dangerInfo = dangerousLocations[locationId];
      if (dangerInfo) {
        const isNight = timePeriod === 'night';
        const isEvening = timePeriod === 'evening';
        const dangerLevel = isNight ? 'very dangerous' : isEvening ? 'dangerous' : 'somewhat dangerous';
        
        events.push({
          id: `danger_warning_${Date.now()}`,
          type: 'system' as const,
          content: `⚠️ *This area is ${dangerLevel}${isNight ? ' at night' : ''}. Stay alert for hostile encounters.*`,
          timestamp: newState.time.tick,
        });
      }
      
      Object.entries(questLog.quests).forEach(([questId, quest]) => {
        if (quest.status !== 'active') return;
        quest.objectives.forEach(obj => {
          if (obj.status === 'active' && obj.targetType === 'go' && obj.targetId === locationId) {
            const result = updateObjectiveProgress(questLog, questId, obj.id, 1);
            setQuestLog(result.questLog);
            if (result.message) {
              events.push({
                id: `quest_${Date.now()}`,
                type: 'system' as const,
                content: result.message,
                timestamp: newState.time.tick,
              });
            }
          }
        });
      });
      
      // Check for new available quests at this location
      const newQuests = checkQuestAvailability(questLog, newState);
      if (newQuests.length > 0) {
        setQuestLog(prev => ({
          ...prev,
          availableQuests: [...new Set([...prev.availableQuests, ...newQuests])],
        }));
      }
      const location = newState.locations[locationId];
      if (location) {
        const ambientEvent = generateAmbientEvent(
          locationId,
          location.name.toLowerCase(),
          weather,
          timePeriod,
          location.npcsPresent
        );
        if (ambientEvent) {
          events.push({
            id: `ambient_${Date.now()}`,
            type: 'observation' as const,
            content: `\n*${ambientEvent.description}*${ambientEvent.interactionPrompt ? ` ${ambientEvent.interactionPrompt}` : ''}`,
            timestamp: newState.time.tick,
          });
        }
      }
      
      // Check for hostile encounter in dangerous locations
      if (newState.lifeSim) {
        const playerStats = {
          health: newState.lifeSim.needs.physical.health,
          energy: newState.lifeSim.needs.physical.energy,
        };
        
        if (shouldTriggerHostileEncounter(locationId, timePeriod, playerStats)) {
          const hostileEncounter = generateHostileEncounter(locationId, timePeriod);
          
          if (hostileEncounter) {
            // Add hostile NPC to the game state
            newState.npcs[hostileEncounter.npc.id] = hostileEncounter.npc;
            
            // Show encounter message
            events.push({
              id: `hostile_${Date.now()}`,
              type: 'combat' as const,
              content: `**⚠️ DANGER!**\n\n${hostileEncounter.initiativeMessage}\n\n*A hostile ${hostileEncounter.npc.meta.occupation} confronts you! Combat difficulty: ${hostileEncounter.difficultyRating}*`,
              timestamp: newState.time.tick,
            });
            
            // Auto-initiate combat
            const encounter = initializeCombat(
              newState.lifeSim,
              hostileEncounter.npc,
              locationId,
              []
            );
            
            // Modify encounter based on hostile settings
            encounter.canFlee = hostileEncounter.canFlee;
            if (!hostileEncounter.canFlee) {
              encounter.maxFleeAttempts = 1;
            }
            
            setActiveCombat(encounter);
            setCombatNPC(hostileEncounter.npc);
            
            toast.error('You\'ve been ambushed!', { 
              description: `A ${hostileEncounter.npc.meta.occupation} attacks you!` 
            });
          }
        }
      }
    }
    
    // Check talk objectives
    if (action.type === 'talk' && action.target) {
      const targetName = action.target.toLowerCase();
      const targetNPC = Object.values(newState.npcs).find(npc => 
        npc.meta.name.toLowerCase().includes(targetName)
      );
      
      if (targetNPC) {
        Object.entries(questLog.quests).forEach(([questId, quest]) => {
          if (quest.status !== 'active') return;
          quest.objectives.forEach(obj => {
            if (obj.status === 'active' && obj.targetType === 'talk' && 
                (!obj.targetId || obj.targetId === targetNPC.id)) {
              const result = updateObjectiveProgress(questLog, questId, obj.id, 1);
              setQuestLog(result.questLog);
              if (result.message) {
                events.push({
                  id: `quest_${Date.now()}`,
                  type: 'system' as const,
                  content: result.message,
                  timestamp: newState.time.tick,
                });
              }
            }
          });
        });
        
        // Check for quest offers from this NPC
        const availableFromNPC = checkQuestAvailability(questLog, newState, targetNPC.id);
        if (availableFromNPC.length > 0) {
          availableFromNPC.forEach(questId => {
            const def = QUEST_DEFINITIONS[questId];
            if (def) {
              events.push({
                id: `quest_offer_${Date.now()}`,
                type: 'system' as const,
                content: `\n**Quest Available:** ${def.title}\n*${def.description}*\n\n*Type "accept ${questId}" to start this quest.*`,
                timestamp: newState.time.tick,
              });
            }
          });
        }
      }
    }
    
    // Handle look objectives  
    if (action.type === 'look') {
      Object.entries(questLog.quests).forEach(([questId, quest]) => {
        if (quest.status !== 'active') return;
        quest.objectives.forEach(obj => {
          if (obj.status === 'active' && obj.targetType === 'custom' && obj.id === 'obj_look_around') {
            const result = updateObjectiveProgress(questLog, questId, obj.id, 1);
            setQuestLog(result.questLog);
            if (result.message) {
              events.push({
                id: `quest_${Date.now()}`,
                type: 'system' as const,
                content: result.message,
                timestamp: newState.time.tick,
              });
            }
          }
        });
      });
    }
    
    // Spawn generic NPCs when entering a location or looking around
    if (action.type === 'go' || action.type === 'look') {
      const locationId = newState.player.currentLocation;
      const timePeriod = getTimePeriod(newState.time.hour) as 'morning' | 'afternoon' | 'evening' | 'night';
      const existingIds = new Set(Object.keys(newState.npcs));
      
      // Remove old generic NPCs from previous location
      const newNpcs = { ...newState.npcs };
      Object.keys(newNpcs).forEach(id => {
        if ((newNpcs[id] as any).isGeneric && newNpcs[id].currentLocation !== locationId) {
          delete newNpcs[id];
        }
      });
      
      // Spawn new generic NPCs for current location
      const spawnCount = getSpawnCount(locationId, timePeriod);
      for (let i = 0; i < spawnCount; i++) {
        const genericNPC = generateGenericNPC(locationId, timePeriod, existingIds);
        if (genericNPC) {
          newNpcs[genericNPC.id] = genericNPC;
          existingIds.add(genericNPC.id);
        }
      }
      newState = { ...newState, npcs: newNpcs };
      
      // Random encounter chance
      const encounter = generateRandomEncounter(locationId);
      if (encounter) {
        events.push({
          id: `enc_${Date.now()}`,
          type: 'observation' as const,
          content: `\n**Random Encounter:** ${encounter.description}`,
          timestamp: newState.time.tick,
        });
      }
    }
    
    // Handle talk command - starts a new conversation session
    if (action.type === 'talk' && action.target) {
      const targetName = action.target.toLowerCase();
      const npcsHere = Object.values(newState.npcs).filter(npc => npc.currentLocation === newState.player.currentLocation);
      const targetNPC = npcsHere.find(npc => npc.meta.name.toLowerCase().includes(targetName));
      
      if (targetNPC) {
        const timePeriod = getTimePeriod(newState.time.hour);
        const location = newState.locations[newState.player.currentLocation]?.name || 'unknown';
        const isFirst = !targetNPC.memory.some(m => m.involvedEntities.includes('player'));
        
        // Get or create memory store for this NPC
        const memoryStore = npcMemories[targetNPC.id] || initializeMemoryStore();
        
        const result = await generateAIDialogue(targetNPC, `greeting`, location, timePeriod, isFirst, memoryStore);
        
        if (result) {
          // Start a new conversation session
          const newSession: ConversationSession = {
            npcId: targetNPC.id,
            npcName: targetNPC.meta.name,
            startTick: newState.time.tick,
            exchanges: [{
              playerSaid: 'greeting',
              npcResponse: result.dialogue,
              tick: newState.time.tick,
            }],
            importantTopics: [...result.importantTopics, ...detectImportantTopics('greeting', result.dialogue)],
          };
          setConversationSession(newSession);
          
          // Replace the last dialogue event with AI-generated one with indicators
          const dialogueContent = formatDialogueWithIndicators(targetNPC.meta.name, result.dialogue, result.indicators);
          const lastDialogueIdx = events.findIndex(e => e.type === 'dialogue' && e.involvedNPCs?.includes(targetNPC.id));
          if (lastDialogueIdx >= 0) {
            events[lastDialogueIdx] = {
              ...events[lastDialogueIdx],
              content: `${dialogueContent}\n\n*[Conversation started - use "say <message>" to continue, or "bye" to end]*`,
            };
          } else {
            events.push({
              id: `dialogue_${Date.now()}`,
              type: 'dialogue' as const,
              content: `${dialogueContent}\n\n*[Conversation started - use "say <message>" to continue, or "bye" to end]*`,
              timestamp: newState.time.tick,
              involvedNPCs: [targetNPC.id],
            });
          }
          
          toast.info(`Talking to ${targetNPC.meta.name}`, { 
            description: 'Use "say <message>" to continue, or "bye" to end' 
          });
        }
      }
    }
    
    // Handle say command - continues an existing conversation
    if (action.type === 'say') {
      const playerMessage = action.args.join(' ');
      
      if (!conversationSession) {
        events.push({
          id: `err_${Date.now()}`,
          type: 'system' as const,
          content: `*You're not in a conversation. Use "talk <name>" to start talking to someone.*`,
          timestamp: newState.time.tick,
        });
      } else if (!playerMessage) {
        events.push({
          id: `err_${Date.now()}`,
          type: 'system' as const,
          content: `*What do you want to say? Use "say <your message>"*`,
          timestamp: newState.time.tick,
        });
      } else {
        const targetNPC = newState.npcs[conversationSession.npcId];
        
        if (!targetNPC || targetNPC.currentLocation !== newState.player.currentLocation) {
          // NPC left or is no longer here
          events.push({
            id: `err_${Date.now()}`,
            type: 'system' as const,
            content: `*${conversationSession.npcName} is no longer here.*`,
            timestamp: newState.time.tick,
          });
          setConversationSession(null);
        } else {
          const timePeriod = getTimePeriod(newState.time.hour);
          const location = newState.locations[newState.player.currentLocation]?.name || 'unknown';
          
          // Get or create memory store for this NPC
          const memoryStore = npcMemories[targetNPC.id] || initializeMemoryStore();
          
          // Pass conversation history for context
          const result = await generateAIDialogue(
            targetNPC, 
            playerMessage, 
            location, 
            timePeriod, 
            false,
            memoryStore,
            conversationSession.exchanges
          );
          
          if (result) {
            // Add to conversation session
            const newExchange = {
              playerSaid: playerMessage,
              npcResponse: result.dialogue,
              tick: newState.time.tick,
            };
            
            const detectedTopics = detectImportantTopics(playerMessage, result.dialogue);
            const updatedSession: ConversationSession = {
              ...conversationSession,
              exchanges: [...conversationSession.exchanges, newExchange],
              importantTopics: [...new Set([...conversationSession.importantTopics, ...result.importantTopics, ...detectedTopics])],
            };
            setConversationSession(updatedSession);
            
            events.push({
              id: `player_say_${Date.now()}`,
              type: 'dialogue' as const,
              content: `**You**: "${playerMessage}"`,
              timestamp: newState.time.tick,
            });
            
            // Format dialogue with visual indicators
            const dialogueContent = formatDialogueWithIndicators(targetNPC.meta.name, result.dialogue, result.indicators);
            events.push({
              id: `npc_reply_${Date.now()}`,
              type: 'dialogue' as const,
              content: dialogueContent,
              timestamp: newState.time.tick,
              involvedNPCs: [targetNPC.id],
            });
            
            // Calculate memory intensity based on conversation length and important topics
            const baseIntensity = 15;
            const topicBonus = detectedTopics.length * 15;
            const lengthBonus = Math.min(updatedSession.exchanges.length * 5, 25);
            const emotionalIntensity = Math.min(baseIntensity + topicBonus + lengthBonus, 80);
            
            // Create a memory of this exchange
            const sentiment = detectedTopics.some(t => 
              ['love', 'help', 'please', 'sorry', 'forgive', 'trust'].includes(t)
            ) ? 'positive' : detectedTopics.some(t => 
              ['hate', 'kill', 'death', 'betray', 'lie', 'fear', 'scared'].includes(t)
            ) ? 'negative' : 'neutral';
            
            const updatedMemory = createMemory(memoryStore, {
              type: 'experienced',
              summary: detectedTopics.length > 0 
                ? `Discussed ${detectedTopics.slice(0, 3).join(', ')} with the player`
                : `Had a conversation with the player`,
              details: `Player said: "${playerMessage}". I responded: "${result.dialogue.substring(0, 150)}..."`,
              entities: ['player'],
              location: newState.player.currentLocation,
              emotionalIntensity,
              sentiment,
              emotionTags: detectedTopics,
              source: 'firsthand',
              sharable: true,
              traumatic: detectedTopics.some(t => ['kill', 'death', 'betray'].includes(t)),
            }, newState.time.tick);
            
            // Update memories with decay
            const decayedMemory = decayMemories(updatedMemory, 1);
            
            setNpcMemories(prev => ({
              ...prev,
              [targetNPC.id]: decayedMemory,
            }));
          }
        }
      }
    }
    
    // Handle end_conversation command (bye, goodbye, farewell, etc.)
    if (action.type === 'end_conversation' && conversationSession) {
      const targetNPC = newState.npcs[conversationSession.npcId];
      
      if (targetNPC && targetNPC.currentLocation === newState.player.currentLocation) {
        const timePeriod = getTimePeriod(newState.time.hour);
        const location = newState.locations[newState.player.currentLocation]?.name || 'unknown';
        const memoryStore = npcMemories[targetNPC.id] || initializeMemoryStore();
        
        // Generate a farewell response
        const result = await generateAIDialogue(
          targetNPC, 
          'goodbye', 
          location, 
          timePeriod, 
          false,
          memoryStore,
          conversationSession.exchanges,
          true // isFarewell
        );
        
        if (result) {
          events.push({
            id: `player_bye_${Date.now()}`,
            type: 'dialogue' as const,
            content: `**You**: "Goodbye."`,
            timestamp: newState.time.tick,
          });
          
          const dialogueContent = formatDialogueWithIndicators(targetNPC.meta.name, result.dialogue, result.indicators);
          events.push({
            id: `npc_farewell_${Date.now()}`,
            type: 'dialogue' as const,
            content: dialogueContent,
            timestamp: newState.time.tick,
            involvedNPCs: [targetNPC.id],
          });
        }
        
        // Create a summary memory of the entire conversation
        const conversationLength = conversationSession.exchanges.length;
        const topics = conversationSession.importantTopics;
        const intensity = Math.min(25 + conversationLength * 5 + topics.length * 10, 75);
        
        const updatedMemory = createMemory(memoryStore, {
          type: 'experienced',
          summary: topics.length > 0 
            ? `Had a ${conversationLength}-exchange conversation about ${topics.slice(0, 3).join(', ')}. Ended politely.`
            : `Had a ${conversationLength}-exchange conversation with the player. Ended politely.`,
          details: `Full conversation: ${conversationSession.exchanges.map(e => 
            `Player: "${e.playerSaid}" - Me: "${e.npcResponse.substring(0, 50)}..."`
          ).join(' | ')}`,
          entities: ['player'],
          location: gameState.player.currentLocation,
          emotionalIntensity: intensity,
          sentiment: topics.some(t => ['love', 'help', 'trust'].includes(t)) ? 'positive' : 
                     topics.some(t => ['hate', 'kill', 'betray'].includes(t)) ? 'negative' : 'neutral',
          emotionTags: [...topics, 'polite_farewell'],
          source: 'firsthand',
          sharable: true,
        }, newState.time.tick);
        
        setNpcMemories(prev => ({
          ...prev,
          [targetNPC.id]: updatedMemory,
        }));
      }
      
      setConversationSession(null);
      toast.info('Conversation ended gracefully');
    } else if (action.type === 'end_conversation' && !conversationSession) {
      events.push({
        id: `err_${Date.now()}`,
        type: 'system' as const,
        content: `*You're not in a conversation.*`,
        timestamp: newState.time.tick,
      });
    }
    
    // End conversation when leaving (existing behavior)
    if (conversationSession && action.type === 'go') {
      const targetNPC = newState.npcs[conversationSession.npcId];
      if (targetNPC) {
        const memoryStore = npcMemories[targetNPC.id] || initializeMemoryStore();
        
        // Create a summary memory of the entire conversation
        const conversationLength = conversationSession.exchanges.length;
        const topics = conversationSession.importantTopics;
        const intensity = Math.min(20 + conversationLength * 5 + topics.length * 10, 70);
        
        const updatedMemory = createMemory(memoryStore, {
          type: 'experienced',
          summary: topics.length > 0 
            ? `Had a ${conversationLength}-exchange conversation about ${topics.slice(0, 3).join(', ')}. Player left abruptly.`
            : `Had a ${conversationLength}-exchange conversation with the player. Player left abruptly.`,
          details: `Full conversation: ${conversationSession.exchanges.map(e => 
            `Player: "${e.playerSaid}" - Me: "${e.npcResponse.substring(0, 50)}..."`
          ).join(' | ')}`,
          entities: ['player'],
          location: gameState.player.currentLocation,
          emotionalIntensity: intensity,
          sentiment: topics.some(t => ['love', 'help', 'trust'].includes(t)) ? 'positive' : 
                     topics.some(t => ['hate', 'kill', 'betray'].includes(t)) ? 'negative' : 'neutral',
          emotionTags: [...topics, 'abrupt_departure'],
          source: 'firsthand',
          sharable: true,
        }, newState.time.tick);
        
        setNpcMemories(prev => ({
          ...prev,
          [targetNPC.id]: updatedMemory,
        }));
      }
      
      setConversationSession(null);
      toast.info(`Conversation ended (you left)`);
    }
    
    // Process NPC-to-NPC gossip when looking around or entering a location
    if (action.type === 'go' || action.type === 'look') {
      const npcsHere = Object.values(newState.npcs)
        .filter(npc => npc.currentLocation === newState.player.currentLocation && !(npc as any).isGeneric)
        .map(npc => ({ id: npc.id, name: npc.meta.name }));
      
      if (npcsHere.length >= 2) {
        // Process gossip between NPCs
        const updatedMemories = processNPCGossip(npcMemories, npcsHere, newState.time.tick);
        setNpcMemories(updatedMemories);
        
        // Generate visible gossip events
        const gossipEvents = generateGossipEvents(npcMemories, npcsHere, newState.time.tick);
        gossipEvents.forEach(gossip => {
          events.push({
            id: `gossip_${Date.now()}_${Math.random()}`,
            type: 'observation' as const,
            content: `*You notice **${gossip.npc1}** and **${gossip.npc2}** whispering to each other. You catch fragments: "...${gossip.topic}..."*`,
            timestamp: newState.time.tick,
          });
        });
      }
    }
    
    const deathState = checkPlayerDeath(newState);
    if (deathState.isDead) {
      const deathNarrative = generateDeathNarrative(deathState, newState);
      events.push({
        id: `death_${Date.now()}`,
        type: 'system' as const,
        content: deathNarrative,
        timestamp: newState.time.tick,
      });
      toast.error('You have died', { description: deathState.causeOfDeath });
    }
    
    // Process dialogue events to add NPC portraits (sounds removed - weather only)
    const eventsWithPortraits = await Promise.all(
      events.map(async (event) => {
        if (event.type === 'dialogue' && event.involvedNPCs && event.involvedNPCs.length > 0) {
          const npcId = event.involvedNPCs[0];
          const npc = newState.npcs[npcId];
          if (npc) {
            const portrait = await generateNPCPortrait(npc);
            if (portrait) {
              newState.npcs[npcId] = { ...npc, portrait };
              return { ...event, npcPortrait: portrait };
            }
          }
        }
        return event;
      })
    );
    
    setGameState(newState);
    setDisplayEvents(prev => [...prev, ...eventsWithPortraits]);
    setIsProcessing(false);
  }, [gameState, generateNPCPortrait, npcMemories, conversationSession, weather, questLog]);
  
  // Combat handlers
  const handleCombatEnd = useCallback((outcome: CombatOutcome, updatedEncounter: CombatEncounter) => {
    setActiveCombat(null);
    setCombatNPC(null);
    
    // Apply combat aftermath to game state
    if (gameState.lifeSim) {
      const newLifeSim = {
        ...gameState.lifeSim,
        needs: {
          ...gameState.lifeSim.needs,
          physical: {
            ...gameState.lifeSim.needs.physical,
            health: updatedEncounter.playerStats.health,
            energy: Math.max(0, gameState.lifeSim.needs.physical.energy - 20),
          },
          psychological: {
            ...gameState.lifeSim.needs.psychological,
            stress: Math.min(100, gameState.lifeSim.needs.psychological.stress + 20),
          },
        },
      };
      
      setGameState(prev => ({
        ...prev,
        lifeSim: newLifeSim,
        player: {
          ...prev.player,
          stats: {
            ...prev.player.stats,
            health: updatedEncounter.playerStats.health,
            energy: Math.max(0, prev.player.stats.energy - 20),
          },
        },
      }));
    }
    
    setDisplayEvents(prev => [...prev, {
      id: `combat_end_${Date.now()}`,
      type: 'system' as const,
      content: `*Combat ended: ${outcome}*`,
      timestamp: gameState.time.tick,
    }]);
  }, [gameState]);
  
  const handleCombatUpdate = useCallback((encounter: CombatEncounter) => {
    setActiveCombat(encounter);
  }, []);
  
  // Quest handlers
  const handleStartQuest = useCallback((questId: string) => {
    const updated = startQuest(questLog, questId);
    setQuestLog(updated);
    toast.success(`Quest started: ${QUEST_DEFINITIONS[questId]?.title || questId}`);
  }, [questLog]);
  
  const handleAbandonQuest = useCallback((questId: string) => {
    const updated = abandonQuest(questLog, questId);
    setQuestLog(updated);
    toast.info(`Quest abandoned`);
  }, [questLog]);
  
  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      toast.success('Game saved!', {
        description: `Day ${gameState.time.day}, ${gameState.time.season}`,
      });
    } catch (e) {
      toast.error('Failed to save game');
    }
  }, [gameState]);
  
  const handleLoad = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      toast.error('No saved game found');
      return;
    }
    
    try {
      const parsed = JSON.parse(saved);
      setGameState(updateLocationNPCs(parsed));
      setDisplayEvents([{
        id: 'evt_loaded',
        type: 'system' as const,
        content: '*Game loaded successfully.*',
        timestamp: parsed.time.tick,
      }]);
      toast.success('Game loaded!');
    } catch (e) {
      toast.error('Failed to load game');
    }
  }, []);

  const handleNewGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHARACTER_KEY);
    localStorage.removeItem('living-world-quests');
    setDisplayEvents([]);
    setQuestLog(initializeQuestLog());
    setWeather(initializeWeather('spring'));
    setShowCharacterCreation(true);
  }, []);
  
  const handleTravel = useCallback((locationId: string) => {
    // Use the existing move action
    handleCommand(`go ${locationId}`);
  }, [handleCommand]);
  
  if (showCharacterCreation) {
    return <CharacterCreation onComplete={handleCharacterComplete} />;
  }
  
  // Handle clothing purchase
  const handleClothingPurchase = useCallback((item: ClothingItem, price: number) => {
    if (!gameState.lifeSim) return;
    
    // Deduct gold
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        stats: {
          ...prev.player.stats,
          gold: Math.max(0, prev.player.stats.gold - price),
        },
      },
      lifeSim: prev.lifeSim ? {
        ...prev.lifeSim,
        economy: {
          ...prev.lifeSim.economy,
          money: Math.max(0, prev.lifeSim.economy.money - price),
        },
      } : null,
    }));
    
    toast.success(`Purchased ${item.name} for ${price}g!`);
    addStatChange('gold', -price);
  }, [gameState.lifeSim, addStatChange]);
  
  // Handle clothing sale
  const handleClothingSell = useCallback((item: ClothingItem, sellPrice: number) => {
    // Add gold from sale
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        stats: {
          ...prev.player.stats,
          gold: prev.player.stats.gold + sellPrice,
        },
      },
      lifeSim: prev.lifeSim ? {
        ...prev.lifeSim,
        economy: {
          ...prev.lifeSim.economy,
          money: prev.lifeSim.economy.money + sellPrice,
        },
      } : null,
    }));
    
    toast.success(`Sold ${item.name} for ${sellPrice}g!`);
    addStatChange('gold', sellPrice);
  }, [addStatChange]);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <GameHeader 
        time={gameState.time} 
        playerGold={gameState.lifeSim?.economy.money || gameState.player.stats.gold}
        onSave={handleSave}
        onLoad={handleLoad}
        onNewGame={handleNewGame}
        onOpenShop={() => setShowClothingShop(true)}
      />
      
      {/* Weather Display - Top bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
        <WeatherDisplay weather={weather} timeOfDay={getTimePeriod(gameState.time.hour)} compact />
      </div>
      
      {/* Quest Journal & Story Recap Buttons */}
      <div className="absolute top-16 right-4 z-20 flex gap-2">
        <button
          onClick={() => setShowStoryRecap(true)}
          className="p-2 rounded-lg bg-muted/80 hover:bg-muted border border-border/50 transition-colors"
          title="Story Recap"
        >
          <span className="text-sm font-medium">📖 Recap</span>
        </button>
        <button
          onClick={() => setShowQuestJournal(true)}
          className="p-2 rounded-lg bg-muted/80 hover:bg-muted border border-border/50 transition-colors"
          title="Quest Journal (J)"
        >
          <span className="text-sm font-medium">📜 Journal</span>
          {questLog.currentActiveCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              {questLog.currentActiveCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Story Mode Sidebar - collapsible character panel */}
      <StoryModeSidebar 
        gameState={gameState}
        isOpen={storyPanelOpen}
        onToggle={() => setStoryPanelOpen(!storyPanelOpen)}
        adrenalineState={adrenalineState}
        adrenalineEvent={adrenalineEvent}
      />
      
      {/* Character Panel - slides out from left (legacy) */}
      <CharacterPanel 
        gameState={gameState}
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
      />
      
      {/* Map Panel - slides out from right */}
      <MapPanel
        gameState={gameState}
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        onTravel={handleTravel}
      />
      
      {/* Main Content - centered and adjusts when panels open */}
      <div 
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          (leftPanelOpen || storyPanelOpen) ? "ml-72" : "ml-0",
          rightPanelOpen ? "mr-64 sm:mr-72" : "mr-0"
        )}
      >
        <div className="flex-1 overflow-hidden bg-parchment">
          <NarrativeDisplay 
            events={displayEvents}
            highlightedMessageId={messageNav.highlightedMessageId}
            onRegisterMessage={messageNav.registerMessage}
            onContainerRef={messageNav.setContainer}
          />
        </div>
        <PlayerInput onSubmit={handleCommand} disabled={isProcessing || !!activeCombat} />
      </div>
      
      {/* Quest Journal Modal */}
      {showQuestJournal && (
        <QuestJournal
          questLog={questLog}
          onClose={() => setShowQuestJournal(false)}
          onStartQuest={handleStartQuest}
          onAbandonQuest={handleAbandonQuest}
        />
      )}
      
      {/* Combat UI Modal */}
      {activeCombat && combatNPC && gameState.lifeSim && (
        <CombatUI
          encounter={activeCombat}
          npc={combatNPC}
          playerState={gameState.lifeSim}
          onCombatEnd={handleCombatEnd}
          onEncounterUpdate={handleCombatUpdate}
        />
      )}
      
      {/* Story Recap Modal */}
      <StoryRecap
        isOpen={showStoryRecap}
        onClose={() => setShowStoryRecap(false)}
        storyEvents={displayEvents}
        characterName={gameState.player.name}
        currentLocation={gameState.locations[gameState.player.currentLocation]?.name || 'Unknown'}
      />
      
      {/* Floating Stat Changes */}
      <FloatingStatContainer 
        changes={statChanges} 
        onRemove={removeStatChange}
        position="top-right"
      />
      
      {/* Mini Session Stats */}
      <MiniSessionStats />
      
      {/* Achievements Modal */}
      {achievementsContext && (
        <AchievementsDisplay 
          isOpen={showAchievements} 
          onClose={() => setShowAchievements(false)} 
        />
      )}
      
      {/* Session Stats Modal */}
      {sessionStats && (
        <SessionStatsDisplay 
          isOpen={showSessionStats} 
          onClose={() => setShowSessionStats(false)} 
        />
      )}
      
      {/* Clothing Shop */}
      <ClothingShop
        playerGold={gameState.lifeSim?.economy.money || gameState.player.stats.gold}
        playerLevel={gameState.lifeSim?.skills.social.charm || 1}
        onPurchase={handleClothingPurchase}
        onSell={handleClothingSell}
        isOpen={showClothingShop}
        onOpenChange={setShowClothingShop}
      />
    </div>
  );
}
