import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameEvent, NPC } from '@/types/game';
import { CharacterData, SPAWN_POINTS } from '@/types/characterCreation';
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
} from '@/game/memorySystem';
import { CharacterCreation } from './CharacterCreation';
import { NarrativeDisplay } from './NarrativeDisplay';
import { PlayerInput } from './PlayerInput';
import { CharacterPanel } from './CharacterPanel';
import { MapPanel } from './MapPanel';
import { GameHeader } from './GameHeader';
import { toast } from 'sonner';
import { checkPlayerDeath, generateDeathNarrative } from '@/game/advancedDynamics';
import { calculateSimulationStats } from '@/game/metaSystems';
import { cn } from '@/lib/utils';

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

// Generate AI dialogue for NPCs with memory context and conversation history
async function generateAIDialogue(
  npc: NPC, 
  playerInput: string, 
  location: string, 
  timeOfDay: string, 
  isFirst: boolean,
  memoryStore?: NPCMemoryStore,
  conversationHistory?: Array<{ playerSaid: string; npcResponse: string }>
): Promise<{ dialogue: string; importantTopics: string[] } | null> {
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
        },
        playerInput,
        location,
        timeOfDay,
        isFirstInteraction: isFirst,
        conversationHistory: conversationHistory || [],
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      return data.fallbackDialogue ? { dialogue: data.fallbackDialogue, importantTopics: [] } : null;
    }
    
    const data = await response.json();
    return { 
      dialogue: data.dialogue, 
      importantTopics: data.importantTopics || [] 
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

export function GameUI() {
  const [showCharacterCreation, setShowCharacterCreation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const character = localStorage.getItem(CHARACTER_KEY);
    return !saved && !character;
  });
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
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
  
  // Save memories when they change
  useEffect(() => {
    localStorage.setItem(MEMORY_STORE_KEY, JSON.stringify(npcMemories));
  }, [npcMemories]);
  
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
          
          // Replace the last dialogue event with AI-generated one
          const lastDialogueIdx = events.findIndex(e => e.type === 'dialogue' && e.involvedNPCs?.includes(targetNPC.id));
          if (lastDialogueIdx >= 0) {
            events[lastDialogueIdx] = {
              ...events[lastDialogueIdx],
              content: `**${targetNPC.meta.name}**: "${result.dialogue}"\n\n*[Conversation started - use "say <message>" to continue talking]*`,
            };
          } else {
            events.push({
              id: `dialogue_${Date.now()}`,
              type: 'dialogue' as const,
              content: `**${targetNPC.meta.name}**: "${result.dialogue}"\n\n*[Conversation started - use "say <message>" to continue talking]*`,
              timestamp: newState.time.tick,
              involvedNPCs: [targetNPC.id],
            });
          }
          
          toast.info(`Talking to ${targetNPC.meta.name}`, { 
            description: 'Use "say <message>" to continue the conversation' 
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
            
            events.push({
              id: `npc_reply_${Date.now()}`,
              type: 'dialogue' as const,
              content: `**${targetNPC.meta.name}**: "${result.dialogue}"`,
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
    
    // End conversation when leaving or doing other actions
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
            ? `Had a ${conversationLength}-exchange conversation about ${topics.slice(0, 3).join(', ')}`
            : `Had a ${conversationLength}-exchange conversation with the player`,
          details: `Full conversation: ${conversationSession.exchanges.map(e => 
            `Player: "${e.playerSaid}" - Me: "${e.npcResponse.substring(0, 50)}..."`
          ).join(' | ')}`,
          entities: ['player'],
          location: gameState.player.currentLocation,
          emotionalIntensity: intensity,
          sentiment: topics.some(t => ['love', 'help', 'trust'].includes(t)) ? 'positive' : 
                     topics.some(t => ['hate', 'kill', 'betray'].includes(t)) ? 'negative' : 'neutral',
          emotionTags: topics,
          source: 'firsthand',
          sharable: true,
        }, newState.time.tick);
        
        setNpcMemories(prev => ({
          ...prev,
          [targetNPC.id]: updatedMemory,
        }));
      }
      
      setConversationSession(null);
      toast.info(`Conversation ended`);
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
    
    // Process dialogue events to add NPC portraits
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
  }, [gameState, generateNPCPortrait, npcMemories]);
  
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
    setDisplayEvents([]);
    setShowCharacterCreation(true);
  }, []);
  
  const handleTravel = useCallback((locationId: string) => {
    // Use the existing move action
    handleCommand(`go ${locationId}`);
  }, [handleCommand]);
  
  if (showCharacterCreation) {
    return <CharacterCreation onComplete={handleCharacterComplete} />;
  }
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <GameHeader 
        time={gameState.time} 
        onSave={handleSave}
        onLoad={handleLoad}
        onNewGame={handleNewGame}
      />
      
      {/* Character Panel - slides out from left */}
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
          leftPanelOpen ? "ml-64 sm:ml-72" : "ml-0",
          rightPanelOpen ? "mr-64 sm:mr-72" : "mr-0"
        )}
      >
        <div className="flex-1 overflow-hidden bg-parchment">
          <NarrativeDisplay events={displayEvents} />
        </div>
        <PlayerInput onSubmit={handleCommand} disabled={isProcessing} />
      </div>
    </div>
  );
}
