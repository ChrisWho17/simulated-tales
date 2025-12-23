import { useState, useCallback } from 'react';
import { AdventureCreator } from './AdventureCreator';
import { CharacterCreation } from './CharacterCreation';
import { AdventureDisplay } from './AdventureDisplay';
import { RPGCharacter } from '@/types/rpgCharacter';
import { toast } from 'sonner';

interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

interface GameMechanics {
  rollRequired?: { stat: string; difficulty: number; reason: string };
  xpGained?: { amount: number; reason: string };
  goldGained?: number;
  lootGained?: string;
  damage?: number;
  heal?: number;
}

const STORY_KEY = 'untold-adventure-story';
const CHARACTER_KEY = 'untold-adventure-character';

export function AdventureGame() {
  const [character, setCharacter] = useState<RPGCharacter | null>(() => {
    const saved = localStorage.getItem(CHARACTER_KEY);
    if (saved) try { return JSON.parse(saved); } catch { return null; }
    return null;
  });

  const [story, setStory] = useState<StoryEntry[]>(() => {
    const saved = localStorage.getItem(STORY_KEY);
    if (saved) try { return JSON.parse(saved); } catch { return []; }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [cheatMode, setCheatMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('');
  const [pendingMechanics, setPendingMechanics] = useState<GameMechanics | undefined>();
  const [generatingImageFor, setGeneratingImageFor] = useState<string | undefined>();

  const saveData = useCallback((newStory: StoryEntry[], newCharacter: RPGCharacter) => {
    localStorage.setItem(STORY_KEY, JSON.stringify(newStory));
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(newCharacter));
  }, []);

  const generateNarrative = useCallback(async (
    scenario: string,
    playerAction?: string,
    history: StoryEntry[] = [],
    diceRoll?: any
  ) => {
    if (!character) return null;
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-adventure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario,
            playerAction,
            conversationHistory: history.map(e => ({ role: e.role, content: e.content })),
            cheatMode,
            character,
            diceRoll,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate');
      
      if (data.mechanics) setPendingMechanics(data.mechanics);
      return data.narrative;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [character, cheatMode]);

  const handleCharacterComplete = useCallback(async (char: RPGCharacter, scenario: string) => {
    setCharacter(char);
    setCurrentScenario(scenario);
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(char));

    setIsLoading(true);
    const narrative = await generateNarrative(scenario, undefined, []);
    if (narrative) {
      const newStory: StoryEntry[] = [{
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrative,
        timestamp: Date.now(),
      }];
      setStory(newStory);
      saveData(newStory, char);
    }
    setIsLoading(false);
  }, [generateNarrative, saveData]);

  const handlePlayerAction = useCallback(async (action: string, diceRoll?: any) => {
    if (!character) return;

    const playerEntry: StoryEntry = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: action,
      timestamp: Date.now(),
    };
    
    const updatedStory = [...story, playerEntry];
    setStory(updatedStory);

    const narrative = await generateNarrative(currentScenario, action, updatedStory, diceRoll);
    if (narrative) {
      const narratorEntry: StoryEntry = {
        id: `narrator_${Date.now()}`,
        role: 'narrator',
        content: narrative,
        timestamp: Date.now(),
      };
      const finalStory = [...updatedStory, narratorEntry];
      setStory(finalStory);
      saveData(finalStory, character);
    }
  }, [story, currentScenario, character, generateNarrative, saveData]);

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
          body: JSON.stringify({ sceneDescription: entry.content.slice(0, 500) }),
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
  }, [story]);

  const handleRestart = useCallback(() => {
    setStory([]);
    setCharacter(null);
    setCurrentScenario('');
    localStorage.removeItem(STORY_KEY);
    localStorage.removeItem(CHARACTER_KEY);
  }, []);

  // No character - show character creation
  if (!character) {
    return <CharacterCreation onComplete={handleCharacterComplete} isLoading={isLoading} />;
  }

  // No story - shouldn't happen, but handle it
  if (story.length === 0 && !isLoading) {
    return <CharacterCreation onComplete={handleCharacterComplete} isLoading={isLoading} />;
  }

  return (
    <AdventureDisplay
      story={story}
      onPlayerAction={handlePlayerAction}
      onRestart={handleRestart}
      isLoading={isLoading}
      cheatMode={cheatMode}
      onToggleCheatMode={() => setCheatMode(p => !p)}
      character={character}
      onUpdateCharacter={setCharacter}
      pendingMechanics={pendingMechanics}
      onClearMechanics={() => setPendingMechanics(undefined)}
      onGenerateImage={handleGenerateImage}
      generatingImageFor={generatingImageFor}
    />
  );
}
