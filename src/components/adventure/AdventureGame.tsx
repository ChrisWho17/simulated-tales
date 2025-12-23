import { useState, useCallback } from 'react';
import { AdventureCreator } from './AdventureCreator';
import { AdventureDisplay } from './AdventureDisplay';
import { toast } from 'sonner';

interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'untold-adventure-save';

export function AdventureGame() {
  const [story, setStory] = useState<StoryEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cheatMode, setCheatMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string>('');

  const saveStory = useCallback((newStory: StoryEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStory));
  }, []);

  const generateNarrative = useCallback(async (
    scenario: string,
    playerAction?: string,
    history: StoryEntry[] = []
  ) => {
    setIsLoading(true);

    try {
      const conversationHistory = history.map(entry => ({
        role: entry.role,
        content: entry.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario,
            playerAction,
            conversationHistory,
            cheatMode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate narrative');
      }

      if (!data.narrative) {
        throw new Error('No narrative received');
      }

      return data.narrative;
    } catch (error) {
      console.error('Error generating narrative:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate story');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cheatMode]);

  const handleStartAdventure = useCallback(async (scenario: string) => {
    setCurrentScenario(scenario);
    const narrative = await generateNarrative(scenario);
    
    if (narrative) {
      const newStory: StoryEntry[] = [
        {
          id: `narrator_${Date.now()}`,
          role: 'narrator',
          content: narrative,
          timestamp: Date.now(),
        },
      ];
      setStory(newStory);
      saveStory(newStory);
    }
  }, [generateNarrative, saveStory]);

  const handlePlayerAction = useCallback(async (action: string) => {
    // Add player action to story immediately
    const playerEntry: StoryEntry = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: action,
      timestamp: Date.now(),
    };
    
    const updatedStory = [...story, playerEntry];
    setStory(updatedStory);

    // Generate AI response
    const narrative = await generateNarrative(currentScenario, action, updatedStory);
    
    if (narrative) {
      const narratorEntry: StoryEntry = {
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrative,
        timestamp: Date.now(),
      };
      
      const finalStory = [...updatedStory, narratorEntry];
      setStory(finalStory);
      saveStory(finalStory);
    }
  }, [story, currentScenario, generateNarrative, saveStory]);

  const handleRestart = useCallback(() => {
    setStory([]);
    setCurrentScenario('');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleToggleCheatMode = useCallback(() => {
    setCheatMode(prev => {
      const newMode = !prev;
      toast.info(newMode ? 'Cheat mode enabled - collaborative storytelling active' : 'Cheat mode disabled');
      return newMode;
    });
  }, []);

  // Show creator if no story exists
  if (story.length === 0) {
    return (
      <AdventureCreator
        onStart={handleStartAdventure}
        isLoading={isLoading}
      />
    );
  }

  // Show adventure display
  return (
    <AdventureDisplay
      story={story}
      onPlayerAction={handlePlayerAction}
      onRestart={handleRestart}
      isLoading={isLoading}
      cheatMode={cheatMode}
      onToggleCheatMode={handleToggleCheatMode}
    />
  );
}
