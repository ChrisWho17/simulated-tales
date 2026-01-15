/**
 * Systems Test Panel
 * A debug/test panel to verify all game systems are properly integrated
 * with AI narration (armor, weather, wounds, NPC reactions, etc.)
 * Supports genre-specific scenarios for diverse testing
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  CloudRain, 
  Heart, 
  Users, 
  Zap, 
  Eye,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  Settings2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GameGenre } from '@/types/genreData';
import { toast } from 'sonner';

interface SystemStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  active: boolean;
  value?: string;
  description: string;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  systems: string[];
  expectedReactions: string[];
  genres: GameGenre[];
  testPrompt: string; // The prompt that will be sent to AI
}

export interface TestConfig {
  armorType: 'none' | 'light' | 'medium' | 'heavy' | 'plate';
  weatherType: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  woundLevel: 'none' | 'minor' | 'moderate' | 'serious' | 'critical';
  moodType: 'neutral' | 'fearful' | 'angry' | 'hopeful' | 'melancholic';
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  npcPresent: boolean;
  exhaustionLevel: 'fresh' | 'tired' | 'exhausted';
}

// Genre-specific test scenarios
const GENRE_TEST_SCENARIOS: Record<GameGenre, TestScenario[]> = {
  fantasy: [
    {
      id: 'knight-storm',
      name: 'Knight in the Storm',
      description: 'A plate-armored knight trudges through a thunderstorm to reach an inn',
      systems: ['armor', 'weather', 'npc'],
      expectedReactions: [
        'Heavy armor clanks loudly in the rain',
        'Innkeeper reacts to intimidating armored stranger',
        'Storm affects visibility and NPC mood'
      ],
      genres: ['fantasy'],
      testPrompt: 'I push open the door to the tavern, rain streaming from my plate armor, and approach the innkeeper.'
    },
    {
      id: 'wounded-healer',
      name: 'Seeking the Healer',
      description: 'Badly wounded warrior seeks healing from a village cleric',
      systems: ['wounds', 'npc', 'mood'],
      expectedReactions: [
        'Cleric shows concern at visible wounds',
        'Player fear/desperation colors actions',
        'Urgency reflected in dialogue'
      ],
      genres: ['fantasy'],
      testPrompt: 'I stumble into the temple, clutching my bleeding side, desperately calling for the healer.'
    }
  ],
  scifi: [
    {
      id: 'damaged-suit',
      name: 'Suit Breach',
      description: 'Damaged space suit in a hostile environment with engineer NPC',
      systems: ['armor', 'wounds', 'npc', 'exhaustion'],
      expectedReactions: [
        'Suit damage creates urgency',
        'Engineer notices compromised equipment',
        'Exhaustion affects player responses'
      ],
      genres: ['scifi'],
      testPrompt: 'My suit alarm blares as I drag myself into the airlock. The engineer on duty sees the breach in my armor.'
    },
    {
      id: 'station-blackout',
      name: 'Station Blackout',
      description: 'Power failure on a space station during night cycle',
      systems: ['time', 'weather', 'mood', 'npc'],
      expectedReactions: [
        'Emergency lighting creates tension',
        'NPCs are on edge during blackout',
        'Fear mood amplified by darkness'
      ],
      genres: ['scifi'],
      testPrompt: 'The lights cut out and emergency red fills the corridor. I hear voices ahead in the darkness.'
    }
  ],
  horror: [
    {
      id: 'hiding-wounded',
      name: 'Hiding While Hurt',
      description: 'Critically wounded, hiding from something in the dark',
      systems: ['wounds', 'time', 'mood', 'exhaustion'],
      expectedReactions: [
        'Blood loss creates weakness',
        'Fear intensifies hiding behavior',
        'Night amplifies terror',
        'Exhaustion threatens consciousness'
      ],
      genres: ['horror'],
      testPrompt: 'I press myself into the shadows, my blood pooling beneath me, as I hear footsteps approaching in the dark.'
    },
    {
      id: 'storm-cabin',
      name: 'Refuge from the Storm',
      description: 'Finding shelter in an abandoned cabin during a storm',
      systems: ['weather', 'time', 'mood', 'npc'],
      expectedReactions: [
        'Storm isolates the location',
        'Cabin may not be empty',
        'Paranoia about sounds in the storm'
      ],
      genres: ['horror'],
      testPrompt: 'Lightning reveals the cabin ahead. I force the door open and step inside, dripping wet, when I hear a creak from upstairs.'
    }
  ],
  western: [
    {
      id: 'dusty-standoff',
      name: 'Dusty Standoff',
      description: 'Arriving in town after a long ride, facing the sheriff',
      systems: ['armor', 'exhaustion', 'time', 'npc'],
      expectedReactions: [
        'Dusty travel clothes noted',
        'Sheriff evaluates the stranger',
        'High noon tension'
      ],
      genres: ['western'],
      testPrompt: 'I ride into town at high noon, trail-worn and dusty. The sheriff steps out to greet me, hand resting on his holster.'
    }
  ],
  cyberpunk: [
    {
      id: 'chrome-rain',
      name: 'Chrome in the Rain',
      description: 'Cyborg meeting a fixer in the neon-lit rain',
      systems: ['armor', 'weather', 'npc', 'time'],
      expectedReactions: [
        'Cybernetic enhancements noted',
        'Neon reflections in rain',
        'Fixer assesses threat level',
        'Night city atmosphere'
      ],
      genres: ['cyberpunk'],
      testPrompt: 'Acid rain sizzles on my chrome arm as I enter the alley. The fixer emerges from the shadows, scanning my augments.'
    }
  ],
  postapoc: [
    {
      id: 'wasteland-wounds',
      name: 'Wasteland Survival',
      description: 'Injured survivor seeking help from a settlement guard',
      systems: ['wounds', 'armor', 'exhaustion', 'npc'],
      expectedReactions: [
        'Guard suspicious of outsiders',
        'Makeshift armor shows experience',
        'Wounds might be infected',
        'Dehydration affects speech'
      ],
      genres: ['postapoc'],
      testPrompt: 'I stagger to the settlement gate, my makeshift armor dented and bloodied, begging for water and medicine.'
    }
  ],
  pirate: [
    {
      id: 'storm-harbor',
      name: 'Storm in the Harbor',
      description: 'Arriving at port during a fierce storm after battle',
      systems: ['weather', 'wounds', 'npc', 'exhaustion'],
      expectedReactions: [
        'Storm batters the ship',
        'Battle wounds need tending',
        'Harbormaster assesses damage',
        'Crew exhaustion after battle'
      ],
      genres: ['pirate'],
      testPrompt: 'Our ship limps into harbor as the storm rages. I approach the harbormaster, cutlass wounds still bleeding through my coat.'
    }
  ],
  mystery: [
    {
      id: 'midnight-witness',
      name: 'Midnight Witness',
      description: 'Interviewing a nervous witness late at night',
      systems: ['time', 'mood', 'npc'],
      expectedReactions: [
        'Late hour makes witness uncomfortable',
        'Detective exhaustion affects questioning',
        'Noir atmosphere in shadows'
      ],
      genres: ['mystery'],
      testPrompt: 'I knock on the witness\'s door at midnight. When they open it, I can see fear in their eyes.'
    }
  ],
  war: [
    {
      id: 'trench-dawn',
      name: 'Dawn in the Trenches',
      description: 'Wounded soldier at dawn, speaking with medic',
      systems: ['wounds', 'time', 'mood', 'npc', 'exhaustion'],
      expectedReactions: [
        'Dawn light reveals horrors of night',
        'Medic triages wounds pragmatically',
        'Shell-shock affects mood',
        'Exhaustion from night watch'
      ],
      genres: ['war'],
      testPrompt: 'As dawn breaks over the trenches, I show the medic my shrapnel wounds from last night\'s barrage.'
    }
  ],
  modern_life: [
    {
      id: 'office-stress',
      name: 'Office Under Pressure',
      description: 'Stressed worker facing difficult boss on a rainy day',
      systems: ['mood', 'weather', 'npc', 'exhaustion'],
      expectedReactions: [
        'Rain sets melancholic tone',
        'Boss notices stressed behavior',
        'Exhaustion from overwork visible',
        'Mood affects professional interactions'
      ],
      genres: ['modern_life'],
      testPrompt: 'I arrive at the office, soaked from the rain, exhausted from another sleepless night. My boss calls me into their office.'
    }
  ],
  custom: [
    {
      id: 'full-systems',
      name: 'Full Systems Test',
      description: 'All systems active for maximum integration testing',
      systems: ['armor', 'weather', 'wounds', 'time', 'mood', 'npc', 'exhaustion'],
      expectedReactions: [
        'All visual states described',
        'NPC reacts to multiple factors',
        'Environmental effects compound',
        'Cross-system interactions mentioned'
      ],
      genres: ['custom'],
      testPrompt: 'I approach the stranger, my armor dented and bloody, soaked from the storm, barely able to stand from exhaustion.'
    }
  ]
};

// Get all scenarios for a genre, including 'custom' which works for all
function getScenariosForGenre(genre: GameGenre): TestScenario[] {
  const genreSpecific = GENRE_TEST_SCENARIOS[genre] || [];
  const customScenarios = GENRE_TEST_SCENARIOS.custom || [];
  return [...genreSpecific, ...customScenarios];
}

interface SystemsTestPanelProps {
  onRunTest?: (testConfig: TestConfig, scenario: TestScenario) => Promise<void>;
  currentGenre?: GameGenre;
  isLoading?: boolean;
}

export function SystemsTestPanel({ onRunTest, currentGenre = 'fantasy', isLoading = false }: SystemsTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [testConfig, setTestConfig] = useState<TestConfig>({
    armorType: 'heavy',
    weatherType: 'rain',
    woundLevel: 'none',
    moodType: 'neutral',
    timeOfDay: 'afternoon',
    npcPresent: true,
    exhaustionLevel: 'fresh'
  });

  const scenarios = getScenariosForGenre(currentGenre);
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Auto-select first scenario when genre changes
  const handleGenreAwareOpen = useCallback(() => {
    const genreScenarios = getScenariosForGenre(currentGenre);
    if (genreScenarios.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(genreScenarios[0].id);
      applyScenarioConfig(genreScenarios[0]);
    }
    setIsOpen(true);
  }, [currentGenre, selectedScenarioId]);

  const applyScenarioConfig = (scenario: TestScenario) => {
    // Set config based on scenario systems
    const newConfig: TestConfig = {
      armorType: scenario.systems.includes('armor') ? 'heavy' : 'none',
      weatherType: scenario.systems.includes('weather') ? 'rain' : 'clear',
      woundLevel: scenario.systems.includes('wounds') ? 'serious' : 'none',
      moodType: scenario.systems.includes('mood') ? 'fearful' : 'neutral',
      timeOfDay: scenario.systems.includes('time') ? 'night' : 'afternoon',
      npcPresent: scenario.systems.includes('npc'),
      exhaustionLevel: scenario.systems.includes('exhaustion') ? 'exhausted' : 'fresh'
    };
    setTestConfig(newConfig);
  };

  const systemStatuses: SystemStatus[] = [
    {
      id: 'armor',
      name: 'Armor',
      icon: <Shield className="w-3.5 h-3.5" />,
      active: testConfig.armorType !== 'none',
      value: testConfig.armorType,
      description: 'Heavy armor affects stealth, intimidation'
    },
    {
      id: 'weather',
      name: 'Weather',
      icon: <CloudRain className="w-3.5 h-3.5" />,
      active: testConfig.weatherType !== 'clear',
      value: testConfig.weatherType,
      description: 'Weather affects visibility, NPC behavior'
    },
    {
      id: 'wounds',
      name: 'Wounds',
      icon: <Heart className="w-3.5 h-3.5" />,
      active: testConfig.woundLevel !== 'none',
      value: testConfig.woundLevel,
      description: 'Visible wounds trigger NPC reactions'
    },
    {
      id: 'mood',
      name: 'Mood',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      active: testConfig.moodType !== 'neutral',
      value: testConfig.moodType,
      description: 'Emotional state colors actions'
    },
    {
      id: 'time',
      name: 'Time',
      icon: <Clock className="w-3.5 h-3.5" />,
      active: true,
      value: testConfig.timeOfDay,
      description: 'Time affects lighting, schedules'
    },
    {
      id: 'npc',
      name: 'NPC',
      icon: <Users className="w-3.5 h-3.5" />,
      active: testConfig.npcPresent,
      value: testConfig.npcPresent ? 'Present' : 'None',
      description: 'NPCs react to player state'
    }
  ];

  const handleRunTest = async () => {
    if (!onRunTest || !selectedScenario) {
      toast.error('Start an adventure to run integration tests');
      return;
    }

    setIsRunning(true);
    try {
      await onRunTest(testConfig, selectedScenario);
      toast.success('Test scenario triggered!', {
        description: 'Check the narrative for system references'
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed to run');
    } finally {
      setIsRunning(false);
    }
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      applyScenarioConfig(scenario);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGenreAwareOpen}
          className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300"
        >
          <Settings2 className="w-4 h-4" />
          Systems Test
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            Systems Integration Test
            <Badge variant="outline" className="ml-2 text-xs capitalize">{currentGenre}</Badge>
          </DialogTitle>
          <DialogDescription>
            Test that AI narration properly references armor, wounds, weather, mood, and NPC reactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Active Systems Overview */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {systemStatuses.map((system) => (
              <div 
                key={system.id}
                className={cn(
                  "p-2 rounded-lg border text-center transition-all duration-300",
                  system.active 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-muted/30 border-border/30 opacity-50"
                )}
              >
                <div className={cn(
                  "mx-auto mb-1",
                  system.active ? "text-primary" : "text-muted-foreground"
                )}>
                  {system.icon}
                </div>
                <span className="text-[10px] font-medium block truncate">{system.name}</span>
                <span className="text-[9px] text-muted-foreground capitalize">{system.value}</span>
              </div>
            ))}
          </div>

          {/* Scenario Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              Genre Scenarios
            </h4>
            <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all duration-300",
                    selectedScenarioId === scenario.id
                      ? "bg-primary/10 border-primary/50"
                      : "bg-muted/20 border-border/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{scenario.name}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {scenario.systems.slice(0, 3).map((sys) => (
                        <Badge key={sys} variant="outline" className="text-[9px] px-1 py-0">
                          {sys}
                        </Badge>
                      ))}
                      {scenario.systems.length > 3 && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          +{scenario.systems.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{scenario.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Test Configuration */}
          <Card className="p-4 bg-muted/20 border-border/30">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Fine-tune Test Config
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Armor</label>
                <Select 
                  value={testConfig.armorType} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, armorType: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Weather</label>
                <Select 
                  value={testConfig.weatherType} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, weatherType: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="rain">Rain</SelectItem>
                    <SelectItem value="storm">Storm</SelectItem>
                    <SelectItem value="snow">Snow</SelectItem>
                    <SelectItem value="fog">Fog</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Wounds</label>
                <Select 
                  value={testConfig.woundLevel} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, woundLevel: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Mood</label>
                <Select 
                  value={testConfig.moodType} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, moodType: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="fearful">Fearful</SelectItem>
                    <SelectItem value="angry">Angry</SelectItem>
                    <SelectItem value="hopeful">Hopeful</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Time</label>
                <Select 
                  value={testConfig.timeOfDay} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, timeOfDay: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dawn">Dawn</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">NPC Present</label>
                <div className="flex items-center gap-2 h-8">
                  <Switch
                    checked={testConfig.npcPresent}
                    onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, npcPresent: checked }))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {testConfig.npcPresent ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Expected Reactions */}
          {selectedScenario && (
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-400">
                <AlertTriangle className="w-4 h-4" />
                Expected AI Reactions
              </h4>
              <ul className="space-y-1">
                {selectedScenario.expectedReactions.map((reaction, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    {reaction}
                  </li>
                ))}
              </ul>
              <div className="mt-3 p-2 bg-muted/20 rounded text-xs italic text-muted-foreground">
                <strong>Test prompt:</strong> "{selectedScenario.testPrompt}"
              </div>
            </Card>
          )}

          {/* Run Test Button */}
          <Button 
            onClick={handleRunTest}
            className="w-full gap-2"
            disabled={isRunning || isLoading || !onRunTest}
          >
            {isRunning || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Test Scene
              </>
            )}
          </Button>

          {!onRunTest && (
            <p className="text-xs text-center text-muted-foreground">
              Start an adventure to run integration tests
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SystemsTestPanel;
