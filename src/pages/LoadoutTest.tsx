// Test page for LoadoutScreen component
import { useState } from 'react';
import { LoadoutScreen, LoadoutResult } from '@/components/game/LoadoutScreen';
import { RPGCharacter } from '@/types/rpgCharacter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

// Mock character for testing
const MOCK_CHARACTER: RPGCharacter = {
  name: 'Test Character',
  level: 1,
  experience: 0,
  currentHealth: 100,
  maxHealth: 100,
  stats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  skills: [],
  inventory: [],
  traits: [],
  classId: 'warrior',
  backgroundId: 'adventurer',
  abilities: [],
  gold: 100,
};

export default function LoadoutTest() {
  const navigate = useNavigate();
  const [showLoadout, setShowLoadout] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['cyberpunk']);
  const [result, setResult] = useState<LoadoutResult | null>(null);

  const genres = ['cyberpunk', 'fantasy', 'noir', 'horror', 'postapoc'];

  const handleComplete = (loadoutResult: LoadoutResult) => {
    setResult(loadoutResult);
    setShowLoadout(false);
  };

  if (showLoadout) {
    return (
      <LoadoutScreen
        selectedGenres={selectedGenres}
        character={MOCK_CHARACTER}
        onComplete={handleComplete}
        onBack={() => setShowLoadout(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">LoadoutScreen Test</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Game
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Select Genres to Test</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (selectedGenres.includes(genre)) {
                    setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                  } else {
                    setSelectedGenres([...selectedGenres, genre]);
                  }
                }}
              >
                {genre}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => setShowLoadout(true)}
            disabled={selectedGenres.length === 0}
            className="w-full"
          >
            Open Loadout Screen
          </Button>
        </Card>

        {result && (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-green-500">Loadout Result</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Items Selected:</strong> {result.selectedItems.length}</p>
              <p><strong>Custom Items:</strong> {result.customItems.length}</p>
              <p><strong>Total Cost:</strong> {result.totalCost}</p>
              <p><strong>Remaining Currency:</strong> {result.remainingCurrency}</p>
              
              <div className="mt-4">
                <strong>Portrait Prompts:</strong>
                <ul className="list-disc list-inside mt-1">
                  {result.portraitData.map((p, i) => (
                    <li key={i} className="text-muted-foreground">
                      {p.prompt} ({p.category} - {p.position})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <strong>Selected Items:</strong>
                <ul className="list-disc list-inside mt-1">
                  {result.selectedItems.map((item) => (
                    <li key={item.id} className="text-muted-foreground">
                      {item.icon} {item.name} ({item.category})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
