import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameEvent } from '@/types/game';
import { CharacterData, SPAWN_POINTS } from '@/types/characterCreation';
import { 
  createInitialGameState, 
  processAction, 
  parseCommand,
  updateLocationNPCs,
  processDebugCommand,
} from '@/game/gameEngine';
import { createLifeSimFromCharacter, generateCharacterIntroNarrative, getSpawnLocationId } from '@/game/characterIntegration';
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

export function GameUI() {
  const [showCharacterCreation, setShowCharacterCreation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const character = localStorage.getItem(CHARACTER_KEY);
    return !saved && !character;
  });
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
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
    
    const { newState, events } = processAction(gameState, action);
    
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
              // Also update the NPC in state with the portrait
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
  }, [gameState, generateNPCPortrait]);
  
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
