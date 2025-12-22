import { useState, useCallback, useEffect } from 'react';
import { GameState, GameEvent } from '@/types/game';
import { 
  createInitialGameState, 
  processAction, 
  parseCommand,
  updateLocationNPCs 
} from '@/game/gameEngine';
import { NarrativeDisplay } from './NarrativeDisplay';
import { PlayerInput } from './PlayerInput';
import { Sidebar } from './Sidebar';
import { GameHeader } from './GameHeader';
import { toast } from 'sonner';

const STORAGE_KEY = 'living-world-save';

export function GameUI() {
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
  
  // Add welcome event on first load
  useEffect(() => {
    if (displayEvents.length === 0) {
      const location = gameState.locations[gameState.player.currentLocation];
      setDisplayEvents([{
        id: 'evt_welcome',
        type: 'observation',
        content: `You find yourself in **${location.name}**.\n\n${location.description}\n\n*Type "look" to examine your surroundings, or "help" for available commands.*`,
        timestamp: 0,
      }]);
    }
  }, []);
  
  const handleCommand = useCallback((input: string) => {
    setIsProcessing(true);
    
    // Add player command echo
    setDisplayEvents(prev => [...prev, {
      id: `cmd_${Date.now()}`,
      type: 'system' as const,
      content: `> ${input}`,
      timestamp: gameState.time.tick,
    }]);
    
    // Parse and process command
    const action = parseCommand(input);
    const { newState, events } = processAction(gameState, action);
    
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
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <GameHeader 
        time={gameState.time} 
        onSave={handleSave}
        onLoad={handleLoad}
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
