import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Shuffle, Sword, Rocket, Search, Skull, Castle, Compass, Zap, Sun } from 'lucide-react';
import { GameGenre } from '@/types/genreData';

interface ScenarioSelection {
  scenario: string;
  genre: GameGenre;
  genreTitle: string;
}

interface AdventureCreatorProps {
  onSelect: (selection: ScenarioSelection) => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  { id: 'fantasy', genre: 'fantasy' as GameGenre, title: 'Fantasy Quest', description: 'Begin a fantasy adventure in a mystical realm where magic flows freely and ancient prophecies unfold.', icon: Castle },
  { id: 'space', genre: 'scifi' as GameGenre, title: 'Space Explorer', description: 'Start a sci-fi journey aboard a deep space exploration vessel at the edge of known space.', icon: Rocket },
  { id: 'detective', genre: 'mystery' as GameGenre, title: 'Detective Mystery', description: 'Investigate a complex case in a noir mystery where nothing is quite what it seems.', icon: Search },
  { id: 'survival', genre: 'horror' as GameGenre, title: 'Survival Horror', description: 'Wake up in an abandoned facility with no memory. Something is hunting you in the dark.', icon: Skull },
  { id: 'pirate', genre: 'pirate' as GameGenre, title: 'High Seas Adventure', description: 'Captain your own ship across treacherous waters in search of legendary treasure.', icon: Compass },
  { id: 'cyberpunk', genre: 'cyberpunk' as GameGenre, title: 'Neon Dystopia', description: 'Navigate the neon-lit streets of a corporate-controlled megacity as a skilled hacker or street samurai.', icon: Zap },
  { id: 'warrior', genre: 'fantasy' as GameGenre, title: 'Arena Champion', description: 'Fight your way to glory in the grand coliseum, facing ever deadlier opponents.', icon: Sword },
  { id: 'western', genre: 'mystery' as GameGenre, title: 'Frontier Justice', description: 'Ride into a dusty frontier town where outlaws rule and justice needs a champion.', icon: Sun },
];

const RANDOM_SCENARIOS: Array<{ text: string; genre: GameGenre }> = [
  { text: "You are a thief who just discovered their target is actually their long-lost sibling.", genre: 'fantasy' },
  { text: "You're a time traveler stuck in ancient Rome with a smartphone that still works.", genre: 'scifi' },
  { text: "You wake up as the villain in a fairy tale, but you want to be a hero.", genre: 'fantasy' },
  { text: "You're a ghost trying to solve your own murder.", genre: 'mystery' },
  { text: "You're a chef in a post-apocalyptic wasteland, running the last fine dining restaurant.", genre: 'postapoc' },
  { text: "You're a dragon who was polymorphed into a human and forgot you were ever a dragon.", genre: 'fantasy' },
  { text: "You're a space bounty hunter whose ship AI has developed a crush on you.", genre: 'scifi' },
  { text: "You're a librarian who discovered a book that writes your future as you read it.", genre: 'horror' },
  { text: "You're a pirate captain whose crew has been replaced by the ghosts of your enemies.", genre: 'pirate' },
  { text: "You're a retired adventurer running a tavern, but trouble keeps finding you.", genre: 'fantasy' },
  { text: "You're a hacker who accidentally downloaded a rogue AI into your neural implant.", genre: 'cyberpunk' },
  { text: "You're a detective investigating a murder at a party where everyone is a suspect—including you.", genre: 'mystery' },
];

export function AdventureCreator({ onSelect, isLoading }: AdventureCreatorProps) {
  const [customScenario, setCustomScenario] = useState('');

  const handleRandomScenario = () => {
    const random = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
    onSelect({ scenario: random.text, genre: random.genre, genreTitle: random.genre });
  };

  const handlePresetStart = (preset: typeof PRESET_SCENARIOS[0]) => {
    onSelect({ scenario: preset.description, genre: preset.genre, genreTitle: preset.title });
  };

  const handleCustomStart = () => {
    if (customScenario.trim()) {
      // Auto-detect genre from custom scenario
      const lower = customScenario.toLowerCase();
      let genre: GameGenre = 'fantasy';
      if (lower.includes('space') || lower.includes('ship') || lower.includes('galaxy')) genre = 'scifi';
      else if (lower.includes('horror') || lower.includes('monster') || lower.includes('abandoned')) genre = 'horror';
      else if (lower.includes('detective') || lower.includes('mystery') || lower.includes('murder')) genre = 'mystery';
      else if (lower.includes('pirate') || lower.includes('treasure') || lower.includes('seas')) genre = 'pirate';
      else if (lower.includes('cyber') || lower.includes('hacker') || lower.includes('neon')) genre = 'cyberpunk';
      
      onSelect({ scenario: customScenario.trim(), genre, genreTitle: 'Custom Adventure' });
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {scenario.title}
                      </h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {scenario.genre}
                      </span>
                    </div>
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
            <p className="text-foreground font-narrative text-xl">Preparing your adventure...</p>
          </div>
        </div>
      )}
    </div>
  );
}
