import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Shuffle, Sword, Rocket, Search, Skull, Castle, Compass } from 'lucide-react';

interface AdventureCreatorProps {
  onStart: (scenario: string) => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  {
    id: 'fantasy',
    title: 'Fantasy Quest',
    description: 'Begin a fantasy adventure in a mystical realm where magic flows freely and ancient prophecies unfold.',
    icon: Castle,
  },
  {
    id: 'space',
    title: 'Space Explorer',
    description: 'Start a sci-fi journey aboard a deep space exploration vessel at the edge of known space.',
    icon: Rocket,
  },
  {
    id: 'detective',
    title: 'Detective Mystery',
    description: 'Investigate a complex case in a noir mystery where nothing is quite what it seems.',
    icon: Search,
  },
  {
    id: 'survival',
    title: 'Survival Horror',
    description: 'Wake up in an abandoned facility with no memory. Something is hunting you in the dark.',
    icon: Skull,
  },
  {
    id: 'pirate',
    title: 'High Seas Adventure',
    description: 'Captain your own ship across treacherous waters in search of legendary treasure.',
    icon: Compass,
  },
  {
    id: 'warrior',
    title: 'Arena Champion',
    description: 'Fight your way to glory in the grand coliseum, facing ever deadlier opponents.',
    icon: Sword,
  },
];

const RANDOM_SCENARIOS = [
  "You are a thief who just discovered their target is actually their long-lost sibling.",
  "You're a time traveler stuck in ancient Rome with a smartphone that still works.",
  "You wake up as the villain in a fairy tale, but you want to be a hero.",
  "You're a ghost trying to solve your own murder.",
  "You're a chef in a post-apocalyptic wasteland, running the last fine dining restaurant.",
  "You're a dragon who was polymorphed into a human and forgot you were ever a dragon.",
  "You're a space bounty hunter whose ship AI has developed a crush on you.",
  "You're a librarian who discovered a book that writes your future as you read it.",
  "You're the monster under the bed, but the kid above is scarier than you.",
  "You're a retired adventurer running a tavern, but trouble keeps finding you.",
];

export function AdventureCreator({ onStart, isLoading }: AdventureCreatorProps) {
  const [customScenario, setCustomScenario] = useState('');

  const handleRandomScenario = () => {
    const random = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
    onStart(random);
  };

  const handlePresetStart = (scenario: typeof PRESET_SCENARIOS[0]) => {
    onStart(scenario.description);
  };

  const handleCustomStart = () => {
    if (customScenario.trim()) {
      onStart(customScenario.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      {/* Logo/Title */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-narrative font-bold text-gradient-gold mb-2 tracking-wide">
          UNTOLD
        </h1>
        <p className="text-primary/80 uppercase tracking-[0.3em] text-sm">
          Begin Your Unique Adventure
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {/* Custom Scenario */}
        <div className="space-y-3">
          <h2 className="text-primary font-semibold text-lg">Create Your Own Story</h2>
          <div className="flex gap-2">
            <Input
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              placeholder="Describe your scenario..."
              className="flex-1 bg-card border-border/50 text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleCustomStart}
              disabled={!customScenario.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Begin
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Or try something random</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Random Button */}
        <Button
          variant="outline"
          className="w-full py-6 border-border/50 hover:border-primary/50 hover:bg-card transition-all group"
          onClick={handleRandomScenario}
          disabled={isLoading}
        >
          <Sparkles className="w-5 h-5 mr-3 text-primary group-hover:animate-pulse" />
          <span>Surprise Me! Generate a Random Story</span>
        </Button>

        {/* Preset Scenarios */}
        <div className="space-y-3">
          <h2 className="text-primary font-semibold text-lg">Or Choose a Preset Scenario</h2>
          <div className="grid gap-3">
            {PRESET_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handlePresetStart(scenario)}
                disabled={isLoading}
                className="w-full p-4 bg-card/50 border border-border/30 rounded-lg text-left hover:border-primary/50 hover:bg-card transition-all group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <scenario.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Shuffle className="w-12 h-12 text-primary mx-auto animate-spin" />
            <p className="text-foreground font-narrative text-xl">Weaving your tale...</p>
          </div>
        </div>
      )}
    </div>
  );
}
