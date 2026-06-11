// Compact game settings menu for story first page
// Filtered to game settings only - no world/character/life settings

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Dices, Eye, Save, Sparkles, Volume2, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Swords, Trophy, Trash2, Highlighter, Clapperboard, Zap, Check, Shield, ShieldCheck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useGame } from '@/contexts/GameContext';
import { DICE_MODES, DiceMode } from '@/game/diceSystem';
import { DEFAULT_DIRECTOR_SETTINGS, DIRECTOR_TYPES, DirectorType } from '@/game/directorModeSystem';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataWipeModal } from './DataWipeModal';
import { BackupRestoreModal } from './BackupRestoreModal';
import { PreMigrationBackupModal } from './PreMigrationBackupModal';
import { DataIntegrityPanel } from './DataIntegrityPanel';
import { SystemsTestPanel, TestConfig, TestScenario } from './SystemsTestPanel';
import { PwaDebugControls } from './PwaDebugControls';
import { InstallAppPromoBanner } from './InstallAppPromoBanner';
import { GameGenre } from '@/types/genreData';

export interface GameSettingsMenuProps {
  className?: string;
  currentGenre?: GameGenre;
  onRunSystemsTest?: (testConfig: TestConfig, scenario: TestScenario) => Promise<void>;
  isLoading?: boolean;
}

// Get curated list of director types for quick selection
const QUICK_DIRECTOR_TYPES: DirectorType[] = [
  'cinematic',
  'sandbox', 
  'old_school',
  'mystery_keeper',
  'romance_writer',
  'horror_curator',
  'yes_and',
  'revenge_arc',
  'red_velvet',
];

export function GameSettingsMenu({ className, currentGenre, onRunSystemsTest, isLoading }: GameSettingsMenuProps) {
  const navigate = useNavigate();
  const { settings, updateSettings, diceMode, setDiceMode } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [showPreMigrationBackup, setShowPreMigrationBackup] = useState(false);
  const [showIntegrityPanel, setShowIntegrityPanel] = useState(false);

  const DICE_MODE_OPTIONS = [
    { 
      id: 'story' as DiceMode, 
      name: 'Story Mode', 
      icon: BookOpen,
      description: 'Pure narrative',
    },
    { 
      id: 'partial' as DiceMode, 
      name: 'Normal', 
      icon: Dices,
      description: 'Major actions',
    },
    { 
      id: 'full' as DiceMode, 
      name: 'Hardcore', 
      icon: Swords,
      description: 'Every action',
    }
  ];

  const currentDirectorType = settings.directorSettings?.directorType || DEFAULT_DIRECTOR_SETTINGS.directorType;
  const isDirectorEnabled = settings.directorSettings?.enabled ?? DEFAULT_DIRECTOR_SETTINGS.enabled;

  const handleDirectorTypeChange = (type: DirectorType) => {
    updateSettings({
      directorSettings: {
        ...(settings.directorSettings || DEFAULT_DIRECTOR_SETTINGS),
        directorType: type,
        enabled: true,  // Auto-enable when selecting a type
        rawGame: false, // Disable raw game when selecting a director
      }
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50 text-sm hover:bg-muted/50 transition-all duration-300"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Game Settings</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3">
        <div className="glass-panel p-4 space-y-4 animate-fade-in">
          {/* Dice Mode Selection - Compact */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Dice Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DICE_MODE_OPTIONS.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setDiceMode(mode.id)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                    diceMode === mode.id
                      ? "border-primary bg-primary/10 shadow-[0_0_10px_var(--accent-glow)]"
                      : "border-border/50 hover:border-border hover:bg-muted/20"
                  )}
                >
                  <mode.icon className={cn(
                    "w-4 h-4 mx-auto mb-1 transition-colors",
                    diceMode === mode.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="text-xs font-medium">{mode.name}</div>
                  <div className="text-[10px] text-muted-foreground">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Toggles - Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Auto Save */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 min-w-0 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Save className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs truncate">Auto Save</span>
              </div>
              <Switch 
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                className="flex-shrink-0"
              />
            </div>
            
            {/* Show Roll Details */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 min-w-0 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Eye className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs truncate">Roll Details</span>
              </div>
              <Switch 
                checked={settings.showRollDetails}
                onCheckedChange={(checked) => updateSettings({ showRollDetails: checked })}
                className="flex-shrink-0"
              />
            </div>
            
            {/* 18+ Content */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 min-w-0 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-xs truncate">18+ Content</span>
              </div>
              <Switch 
                checked={settings.adultContent}
                onCheckedChange={(checked) => updateSettings({ adultContent: checked })}
                className="flex-shrink-0"
              />
            </div>
            
            {/* Typewriter Effect */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 min-w-0 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs truncate">Typewriter</span>
              </div>
              <Switch 
                checked={settings.typewriterEnabled}
                onCheckedChange={(checked) => updateSettings({ typewriterEnabled: checked })}
                className="flex-shrink-0"
              />
            </div>
          </div>
          
          {/* System Highlight Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-2">
              <Highlighter className="w-3.5 h-3.5 text-accent" />
              <div className="flex flex-col">
                <span className="text-xs">System Highlights</span>
                <span className="text-[10px] text-muted-foreground">Show when armor, weather, wounds etc. affect the story</span>
              </div>
            </div>
            <Switch 
              checked={settings.enableSystemHighlight}
              onCheckedChange={(checked) => updateSettings({ enableSystemHighlight: checked })}
            />
          </div>

          {/* Testing — deterministic variance seed */}
          <div className="p-2.5 rounded-lg border border-border/30 bg-background/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Highlighter className="w-3.5 h-3.5 text-accent" />
                <div className="flex flex-col">
                  <span className="text-xs">Force Variance Seed</span>
                  <span className="text-[10px] text-muted-foreground">Reproduce the same narrative variance for testing</span>
                </div>
              </div>
              <Switch
                checked={!!(settings as any).forceVarianceSeedEnabled}
                onCheckedChange={(checked) => updateSettings({ forceVarianceSeedEnabled: checked } as any)}
              />
            </div>
            {(settings as any).forceVarianceSeedEnabled && (
              <input
                type="text"
                value={(settings as any).forceVarianceSeed || ''}
                onChange={(e) => updateSettings({ forceVarianceSeed: e.target.value } as any)}
                placeholder="seed (e.g. test-001)"
                className="mt-2 w-full rounded border border-border/40 bg-background/50 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
          
          {/* Weather Effects Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs">Weather Effects</span>
            </div>
            <Switch 
              checked={settings.enableWeatherEffects}
              onCheckedChange={(checked) => updateSettings({ enableWeatherEffects: checked })}
            />
          </div>
          
          {/* Director Mode Section */}
          <div className="pt-3 border-t border-border/30 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Clapperboard className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Director Mode</span>
            </div>
            
            {/* Enable Director Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 hover:bg-muted/10 transition-colors">
              <div className="flex flex-col">
                <span className="text-xs">Enable Director</span>
                <span className="text-[10px] text-muted-foreground">DM manipulation features</span>
              </div>
              <Switch 
                checked={isDirectorEnabled}
                onCheckedChange={(checked) => updateSettings({ 
                  directorSettings: { 
                    ...(settings.directorSettings || DEFAULT_DIRECTOR_SETTINGS),
                    enabled: checked,
                    rawGame: !checked ? true : (settings.directorSettings?.rawGame ?? DEFAULT_DIRECTOR_SETTINGS.rawGame)
                  }
                })}
              />
            </div>
            
            {/* Director Type Selector - Quick Pick */}
            {isDirectorEnabled && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Director Style</span>
                <Select
                  value={currentDirectorType}
                  onValueChange={(value) => handleDirectorTypeChange(value as DirectorType)}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-background/50">
                    <SelectValue placeholder="Select director style..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50 max-h-60">
                    {QUICK_DIRECTOR_TYPES.map((typeId) => {
                      const type = DIRECTOR_TYPES[typeId];
                      return (
                        <SelectItem key={typeId} value={typeId} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{type.name}</span>
                            {currentDirectorType === typeId && (
                              <Check className="w-3 h-3 text-primary" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {DIRECTOR_TYPES[currentDirectorType] && (
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {DIRECTOR_TYPES[currentDirectorType].description}
                  </p>
                )}
              </div>
            )}
            
            {/* Raw Game Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30 hover:bg-muted/10 transition-colors">
              <div className="flex flex-col">
                <span className="text-xs">Raw Game</span>
                <span className="text-[10px] text-muted-foreground">Pure simulation, no steering</span>
              </div>
              <Switch 
                checked={settings.directorSettings?.rawGame ?? DEFAULT_DIRECTOR_SETTINGS.rawGame}
                disabled={!isDirectorEnabled}
                onCheckedChange={(checked) => updateSettings({ 
                  directorSettings: { 
                    ...(settings.directorSettings || DEFAULT_DIRECTOR_SETTINGS),
                    rawGame: checked
                  }
                })}
              />
            </div>
          </div>
          
          {/* Trophy Room Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/achievements')}
            className="w-full flex items-center justify-center gap-2 border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400/50 transition-all duration-300"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm">Trophy Room</span>
          </Button>
          
          {/* Systems Test Panel */}
          <div className="w-full">
            <SystemsTestPanel 
              currentGenre={currentGenre || 'fantasy'}
              onRunTest={onRunSystemsTest}
              isLoading={isLoading}
            />
          </div>
          
          {/* Backup/Restore */}
          <div className="w-full">
            <BackupRestoreModal />
          </div>
          
          {/* Pre-Migration Backup - For major updates */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreMigrationBackup(true)}
            className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm">Complete Backup (Pre-Update)</span>
          </Button>
          
          {/* Data Integrity Check */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIntegrityPanel(true)}
            className="w-full flex items-center justify-center gap-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 transition-all duration-300"
          >
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-sm">Data Integrity Check</span>
          </Button>
          
          {/* PWA install — lives in Game Settings only */}
          <div className="p-2 rounded-lg border border-border/30 bg-background/30">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold">Install App</span>
            </div>
            <InstallAppPromoBanner />
          </div>

          {/* PWA install debug */}
          <PwaDebugControls />

          {/* Data Wipe Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWipeModal(true)}
            className="w-full flex items-center justify-center gap-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive transition-all duration-300"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Wipe All Data</span>
          </Button>
        </div>
      </CollapsibleContent>
      
      <DataWipeModal 
        open={showWipeModal} 
        onOpenChange={setShowWipeModal}
      />
      
      <PreMigrationBackupModal
        open={showPreMigrationBackup}
        onOpenChange={setShowPreMigrationBackup}
      />
      
      <DataIntegrityPanel
        open={showIntegrityPanel}
        onClose={() => setShowIntegrityPanel(false)}
      />
    </Collapsible>
  );
}

export default GameSettingsMenu;
