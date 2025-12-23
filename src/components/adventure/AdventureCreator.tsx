import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardInteractive } from '@/components/ui/card';
import { Sparkles, Shuffle, Sword, Rocket, Search, Skull, Castle, Compass, Zap, Sun, Loader2 } from 'lucide-react';
import { GameGenre } from '@/types/genreData';
import { AtmosphericBackground } from '@/components/ui/particle-background';

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
  { id: 'fantasy', genre: 'fantasy' as GameGenre, title: 'Fantasy Quest', description: 'Begin a fantasy adventure in a mystical realm where magic flows freely and ancient prophecies unfold.', icon: Castle, gradient: 'genre-fantasy' },
  { id: 'space', genre: 'scifi' as GameGenre, title: 'Space Explorer', description: 'Start a sci-fi journey aboard a deep space exploration vessel at the edge of known space.', icon: Rocket, gradient: 'genre-scifi' },
  { id: 'detective', genre: 'mystery' as GameGenre, title: 'Detective Mystery', description: 'Investigate a complex case in a noir mystery where nothing is quite what it seems.', icon: Search, gradient: 'genre-mystery' },
  { id: 'survival', genre: 'horror' as GameGenre, title: 'Survival Horror', description: 'Wake up in an abandoned facility with no memory. Something is hunting you in the dark.', icon: Skull, gradient: 'genre-horror' },
  { id: 'pirate', genre: 'pirate' as GameGenre, title: 'High Seas Adventure', description: 'Captain your own ship across treacherous waters in search of legendary treasure.', icon: Compass, gradient: 'genre-pirate' },
  { id: 'cyberpunk', genre: 'cyberpunk' as GameGenre, title: 'Neon Dystopia', description: 'Navigate the neon-lit streets of a corporate-controlled megacity as a skilled hacker or street samurai.', icon: Zap, gradient: 'genre-cyberpunk' },
  { id: 'warrior', genre: 'fantasy' as GameGenre, title: 'Arena Champion', description: 'Fight your way to glory in the grand coliseum, facing ever deadlier opponents.', icon: Sword, gradient: 'genre-fantasy' },
  { id: 'western', genre: 'western' as GameGenre, title: 'Frontier Justice', description: 'Ride into a dusty frontier town where outlaws rule and justice needs a champion.', icon: Sun, gradient: 'genre-western' },
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleRandomScenario = () => {
    const random = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
    onSelect({ scenario: random.text, genre: random.genre, genreTitle: random.genre });
  };

  const handlePresetStart = (preset: typeof PRESET_SCENARIOS[0]) => {
    onSelect({ scenario: preset.description, genre: preset.genre, genreTitle: preset.title });
  };

  const handleCustomStart = () => {
    if (customScenario.trim()) {
      const lower = customScenario.toLowerCase();
      let genre: GameGenre = 'fantasy';
      if (lower.includes('space') || lower.includes('ship') || lower.includes('galaxy')) genre = 'scifi';
      else if (lower.includes('horror') || lower.includes('monster') || lower.includes('abandoned')) genre = 'horror';
      else if (lower.includes('detective') || lower.includes('mystery') || lower.includes('murder')) genre = 'mystery';
      else if (lower.includes('pirate') || lower.includes('treasure') || lower.includes('seas')) genre = 'pirate';
      else if (lower.includes('cyber') || lower.includes('hacker') || lower.includes('neon')) genre = 'cyberpunk';
      else if (lower.includes('western') || lower.includes('frontier') || lower.includes('cowboy')) genre = 'western';
      else if (lower.includes('apocalypse') || lower.includes('wasteland')) genre = 'postapoc';
      
      onSelect({ scenario: customScenario.trim(), genre, genreTitle: 'Custom Adventure' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric Background */}
      <AtmosphericBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        {/* Logo/Title */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient-primary mb-3 tracking-wider">
            UNTOLD
          </h1>
          <p className="text-muted-foreground uppercase tracking-[0.4em] text-sm">
            Begin Your Unique Adventure
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-3xl space-y-8">
          {/* Custom Scenario - Glass Panel */}
          <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-primary font-display text-xl mb-4 tracking-wide">Create Your Own Story</h2>
            <div className="flex gap-3">
              <Input
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Describe your scenario..."
                className="flex-1 bg-black/30 border-[rgba(139,92,246,0.3)] text-foreground placeholder:text-muted-foreground focus:border-primary focus:shadow-glow h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
                disabled={isLoading}
              />
              <Button 
                onClick={handleCustomStart}
                disabled={!customScenario.trim() || isLoading}
                variant="default"
                size="lg"
              >
                Begin
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider px-4">Or choose your fate</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* Random Button */}
          <Button
            variant="glass"
            className="w-full py-7 text-base group animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
            onClick={handleRandomScenario}
            disabled={isLoading}
          >
            <Sparkles className="w-5 h-5 mr-3 text-primary group-hover:animate-pulse" />
            <span>Surprise Me! Generate a Random Story</span>
            <Shuffle className="w-4 h-4 ml-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>

          {/* Preset Scenarios */}
          <div className="space-y-4">
            <h2 className="text-primary font-display text-xl tracking-wide animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Choose a Preset Scenario
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {PRESET_SCENARIOS.map((scenario, index) => (
                <CardInteractive
                  key={scenario.id}
                  onClick={() => handlePresetStart(scenario)}
                  onMouseEnter={() => setHoveredCard(scenario.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`p-5 ${scenario.gradient} animate-fade-in-up cursor-pointer ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-primary/20 border border-primary/30 transition-all duration-300 ${
                      hoveredCard === scenario.id ? 'shadow-glow scale-110' : ''
                    }`}>
                      <scenario.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg text-foreground tracking-wide">
                          {scenario.title}
                        </h3>
                      </div>
                      <span className="inline-block text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                        {scenario.genre}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                </CardInteractive>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center space-y-6 glass-panel p-10 rounded-2xl">
              <div className="relative inline-block">
                <div className="absolute inset-0 animate-glow-pulse rounded-full" />
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <p className="text-foreground font-display text-2xl tracking-wide">Preparing your adventure...</p>
              <div className="w-48 h-1 bg-black/50 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}