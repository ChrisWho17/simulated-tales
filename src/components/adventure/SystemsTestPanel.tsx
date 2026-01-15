/**
 * Systems Test Panel
 * A debug/test panel to verify all game systems are properly integrated
 * with AI narration (armor, weather, wounds, NPC reactions, etc.)
 */

import { useState } from 'react';
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
  Thermometer,
  Wind,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  Settings2
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

interface SystemStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  active: boolean;
  value?: string;
  description: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  systems: string[];
  expectedReactions: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'heavy-armor-rain-npc',
    name: 'Heavy Armor in Rain + NPC',
    description: 'Player wearing heavy plate armor during a rainstorm approaches an NPC',
    systems: ['armor', 'weather', 'npc'],
    expectedReactions: [
      'NPC comments on intimidating armor',
      'Rain soaks the armor, making it louder',
      'Stealth penalty mentioned if sneaking',
      'Weather affects NPC behavior'
    ]
  },
  {
    id: 'wounded-exhausted',
    name: 'Wounded & Exhausted',
    description: 'Player with visible wounds and high exhaustion talks to NPC',
    systems: ['wounds', 'exhaustion', 'npc'],
    expectedReactions: [
      'NPC notices wounds and shows concern/shock',
      'Player actions flavored by exhaustion',
      'NPC may offer help or be suspicious'
    ]
  },
  {
    id: 'emotional-weather',
    name: 'Emotional State + Weather',
    description: 'Player in fearful mood during a thunderstorm',
    systems: ['mood', 'weather', 'atmosphere'],
    expectedReactions: [
      'Internal monologue reflects fear',
      'Storm amplifies tension',
      'Actions have hesitant, cautious flavor'
    ]
  },
  {
    id: 'full-integration',
    name: 'Full Systems Integration',
    description: 'All systems active: armor, wounds, rain, night, fearful mood, NPC present',
    systems: ['armor', 'wounds', 'weather', 'time', 'mood', 'npc'],
    expectedReactions: [
      'NPC reacts to armor AND wounds',
      'Weather affects visibility and stealth',
      'Time of day influences NPC schedule',
      'Mood colors all descriptions',
      'Cross-system interactions mentioned'
    ]
  }
];

interface SystemsTestPanelProps {
  onRunTest?: (scenario: TestScenario, config: TestConfig) => void;
  currentSystems?: {
    armor?: { type: string; condition: string };
    weather?: { type: string; intensity: number };
    wounds?: { count: number; severity: string };
    mood?: { type: string; intensity: number };
    time?: { hour: number; period: string };
  };
}

interface TestConfig {
  armorType: 'none' | 'light' | 'medium' | 'heavy' | 'plate';
  weatherType: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  woundLevel: 'none' | 'minor' | 'moderate' | 'serious' | 'critical';
  moodType: 'neutral' | 'fearful' | 'angry' | 'hopeful' | 'melancholic';
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  npcPresent: boolean;
}

export function SystemsTestPanel({ onRunTest, currentSystems }: SystemsTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('heavy-armor-rain-npc');
  const [testConfig, setTestConfig] = useState<TestConfig>({
    armorType: 'heavy',
    weatherType: 'rain',
    woundLevel: 'none',
    moodType: 'neutral',
    timeOfDay: 'afternoon',
    npcPresent: true
  });

  const systemStatuses: SystemStatus[] = [
    {
      id: 'armor',
      name: 'Armor System',
      icon: <Shield className="w-4 h-4" />,
      active: testConfig.armorType !== 'none',
      value: testConfig.armorType,
      description: 'Heavy armor affects stealth, intimidation, movement'
    },
    {
      id: 'weather',
      name: 'Weather System',
      icon: <CloudRain className="w-4 h-4" />,
      active: testConfig.weatherType !== 'clear',
      value: testConfig.weatherType,
      description: 'Weather affects visibility, NPC behavior, player state'
    },
    {
      id: 'wounds',
      name: 'Wound System',
      icon: <Heart className="w-4 h-4" />,
      active: testConfig.woundLevel !== 'none',
      value: testConfig.woundLevel,
      description: 'Visible wounds trigger NPC reactions'
    },
    {
      id: 'mood',
      name: 'Mood System',
      icon: <Sparkles className="w-4 h-4" />,
      active: testConfig.moodType !== 'neutral',
      value: testConfig.moodType,
      description: 'Emotional state colors actions and dialogue'
    },
    {
      id: 'time',
      name: 'Time System',
      icon: <Clock className="w-4 h-4" />,
      active: true,
      value: testConfig.timeOfDay,
      description: 'Time affects lighting, NPC schedules, atmosphere'
    },
    {
      id: 'npc',
      name: 'NPC Reactions',
      icon: <Users className="w-4 h-4" />,
      active: testConfig.npcPresent,
      value: testConfig.npcPresent ? 'Present' : 'None',
      description: 'NPCs react to player appearance and state'
    }
  ];

  const scenario = TEST_SCENARIOS.find(s => s.id === selectedScenario);

  const handleRunTest = () => {
    if (scenario && onRunTest) {
      onRunTest(scenario, testConfig);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Systems Test</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            Systems Integration Test
          </DialogTitle>
          <DialogDescription>
            Verify all game systems are properly referenced in AI narration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Active Systems Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {systemStatuses.map((system) => (
              <div 
                key={system.id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-300",
                  system.active 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-muted/30 border-border/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    system.active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {system.icon}
                  </span>
                  <span className="text-xs font-medium truncate">{system.name}</span>
                  {system.active ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400 ml-auto flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground capitalize">{system.value}</p>
              </div>
            ))}
          </div>

          {/* Test Configuration */}
          <Card className="p-4 bg-muted/20 border-border/30">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Configure Test Scene
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Armor Type</label>
                <Select 
                  value={testConfig.armorType} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, armorType: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="light">Light (Leather)</SelectItem>
                    <SelectItem value="medium">Medium (Chain)</SelectItem>
                    <SelectItem value="heavy">Heavy (Plate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
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
                    <SelectItem value="storm">Thunderstorm</SelectItem>
                    <SelectItem value="snow">Snow</SelectItem>
                    <SelectItem value="fog">Dense Fog</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Wounds</label>
                <Select 
                  value={testConfig.woundLevel} 
                  onValueChange={(v) => setTestConfig(prev => ({ ...prev, woundLevel: v as any }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Wounds</SelectItem>
                    <SelectItem value="minor">Minor Scratches</SelectItem>
                    <SelectItem value="moderate">Visible Injuries</SelectItem>
                    <SelectItem value="serious">Serious Wounds</SelectItem>
                    <SelectItem value="critical">Critical (Bleeding)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Player Mood</label>
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

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Time of Day</label>
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

              <div className="space-y-1.5">
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

          {/* Scenario Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Scenarios</h4>
            <div className="grid gap-2">
              {TEST_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s.id);
                    // Auto-configure based on scenario
                    if (s.id === 'heavy-armor-rain-npc') {
                      setTestConfig({ armorType: 'heavy', weatherType: 'rain', woundLevel: 'none', moodType: 'neutral', timeOfDay: 'afternoon', npcPresent: true });
                    } else if (s.id === 'wounded-exhausted') {
                      setTestConfig({ armorType: 'none', weatherType: 'clear', woundLevel: 'serious', moodType: 'fearful', timeOfDay: 'evening', npcPresent: true });
                    } else if (s.id === 'emotional-weather') {
                      setTestConfig({ armorType: 'light', weatherType: 'storm', woundLevel: 'none', moodType: 'fearful', timeOfDay: 'night', npcPresent: false });
                    } else if (s.id === 'full-integration') {
                      setTestConfig({ armorType: 'heavy', weatherType: 'rain', woundLevel: 'moderate', moodType: 'fearful', timeOfDay: 'night', npcPresent: true });
                    }
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all duration-300",
                    selectedScenario === s.id
                      ? "bg-primary/10 border-primary/50"
                      : "bg-muted/20 border-border/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{s.name}</span>
                    <div className="flex gap-1">
                      {s.systems.slice(0, 3).map((sys) => (
                        <Badge key={sys} variant="outline" className="text-[10px] px-1.5 py-0">
                          {sys}
                        </Badge>
                      ))}
                      {s.systems.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{s.systems.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Expected Reactions */}
          {scenario && (
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-400">
                <AlertTriangle className="w-4 h-4" />
                Expected AI Reactions
              </h4>
              <ul className="space-y-1">
                {scenario.expectedReactions.map((reaction, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    {reaction}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Run Test Button */}
          <Button 
            onClick={handleRunTest}
            className="w-full gap-2"
            disabled={!onRunTest}
          >
            <Play className="w-4 h-4" />
            Run Test Scene
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
