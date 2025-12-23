import { useState, useCallback, useEffect } from 'react';
import { GameState, GameEvent } from '@/types/game';
import { CharacterData } from '@/types/characterCreation';
import { 
  createInitialGameState, 
  processAction, 
  parseCommand,
  updateLocationNPCs,
  processDebugCommand,
} from '@/game/gameEngine';
import { createLifeSimFromCharacter, generateCharacterIntroNarrative } from '@/game/characterIntegration';
import { CharacterCreation } from './CharacterCreation';
import { NarrativeDisplay } from './NarrativeDisplay';
import { PlayerInput } from './PlayerInput';
import { Sidebar } from './Sidebar';
import { GameHeader } from './GameHeader';
import { toast } from 'sonner';
import { checkPlayerDeath, generateDeathNarrative } from '@/game/advancedDynamics';
import { calculateSimulationStats } from '@/game/metaSystems';

const STORAGE_KEY = 'living-world-save';
const CHARACTER_KEY = 'living-world-character';

export function GameUI() {
  const [showCharacterCreation, setShowCharacterCreation] = useState(() => {
    // Show character creation if no saved game and no saved character
    const saved = localStorage.getItem(STORAGE_KEY);
    const character = localStorage.getItem(CHARACTER_KEY);
    return !saved && !character;
  });
  
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load saved game
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
    // Save character data
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(character));
    
    // Create new game state with character's life sim data
    const newGameState = updateLocationNPCs(createInitialGameState());
    const lifeSimState = createLifeSimFromCharacter(character);
    
    // Apply character data to game state
    newGameState.lifeSim = lifeSimState;
    newGameState.player = {
      ...newGameState.player,
      name: character.basicInfo.name,
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
    
    // Generate intro narrative
    const introNarrative = generateCharacterIntroNarrative(character);
    const location = newGameState.locations[newGameState.player.currentLocation];
    const stats = calculateSimulationStats(newGameState);
    
    setDisplayEvents([{
      id: 'evt_intro',
      type: 'observation',
      content: `${introNarrative}\n\n---\n\nYou find yourself in **${location.name}**.\n\n${location.description}\n\n*Type "look" to examine your surroundings, or "help" for available commands.*\n\n*[Living World Engine active: ${stats.totalNPCs} NPCs, ${stats.totalRelationships} relationships tracked]*`,
      timestamp: 0,
    }]);
    
    setShowCharacterCreation(false);
    toast.success(`Welcome, ${character.basicInfo.name}!`);
  }, []);
  
  // Add welcome event on first load (if no character creation)
  useEffect(() => {
    if (displayEvents.length === 0 && !showCharacterCreation) {
      const location = gameState.locations[gameState.player.currentLocation];
      const stats = calculateSimulationStats(gameState);
      
      setDisplayEvents([{
        id: 'evt_welcome',
        type: 'observation',
        content: `You find yourself in **${location.name}**.\n\n${location.description}\n\n*Type "look" to examine your surroundings, or "help" for available commands.*\n\n*[Living World Engine active: ${stats.totalNPCs} NPCs, ${stats.totalRelationships} relationships tracked]*`,
        timestamp: 0,
      }]);
    }
  }, [showCharacterCreation]);
  
  const handleCommand = useCallback((input: string) => {
    setIsProcessing(true);
    
    // Add player command echo
    setDisplayEvents(prev => [...prev, {
      id: `cmd_${Date.now()}`,
      type: 'system' as const,
      content: `> ${input}`,
      timestamp: gameState.time.tick,
    }]);
    
    // Parse command - check for debug commands
    const action = parseCommand(input);
    
    // Handle debug commands
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
    
    // Process regular command
    const { newState, events } = processAction(gameState, action);
    
    // Check for player death
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
    
    // Update state and display
    setGameState(newState);
    setDisplayEvents(prev => [...prev, ...events]);
    setIsProcessing(false);
  }, [gameState]);
  
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
    // Clear saved data and show character creation
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHARACTER_KEY);
    setDisplayEvents([]);
    setShowCharacterCreation(true);
  }, []);
  
  // Show character creation screen
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
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden bg-parchment">
            <NarrativeDisplay events={displayEvents} />
          </div>
          <PlayerInput onSubmit={handleCommand} disabled={isProcessing} />
        </div>
        
        {/* Sidebar */}
        <aside className="w-72 hidden lg:block">
          <Sidebar gameState={gameState} />
        </aside>
      </div>
    </div>
  );
}
