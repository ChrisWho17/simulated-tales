// Compact game settings menu for story first page
// Filtered to game settings only - no world/character/life settings

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Dices, Eye, Save, Sparkles, Volume2, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Swords, Trophy, Trash2, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useGame } from '@/contexts/GameContext';
import { DICE_MODES, DiceMode } from '@/game/diceSystem';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DataWipeModal } from './DataWipeModal';
import { BackupRestoreModal } from './BackupRestoreModal';

export interface GameSettingsMenuProps {
  className?: string;
}

export function GameSettingsMenu({ className }: GameSettingsMenuProps) {
  const navigate = useNavigate();
  const { settings, updateSettings, diceMode, setDiceMode } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);

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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50 text-sm hover:bg-muted/50"
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
                    "p-2 rounded-lg border text-center transition-all",
                    diceMode === mode.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <mode.icon className={cn(
                    "w-4 h-4 mx-auto mb-1",
                    diceMode === mode.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="text-xs font-medium">{mode.name}</div>
                  <div className="text-[10px] text-muted-foreground">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Toggles - Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Auto Save */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/30">
              <div className="flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Auto Save</span>
              </div>
              <Switch 
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                className="scale-75"
              />
            </div>
            
            {/* Show Roll Details */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/30">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Roll Details</span>
              </div>
              <Switch 
                checked={settings.showRollDetails}
                onCheckedChange={(checked) => updateSettings({ showRollDetails: checked })}
                className="scale-75"
              />
            </div>
            
            {/* 18+ Content */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs">18+ Content</span>
              </div>
              <Switch 
                checked={settings.adultContent}
                onCheckedChange={(checked) => updateSettings({ adultContent: checked })}
                className="scale-75"
              />
            </div>
            
            {/* Typewriter Effect */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Typewriter</span>
              </div>
              <Switch 
                checked={settings.typewriterEnabled}
                onCheckedChange={(checked) => updateSettings({ typewriterEnabled: checked })}
                className="scale-75"
              />
            </div>
          </div>
          
          {/* Weather Effects Toggle */}
          <div className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/30">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs">Weather Effects</span>
            </div>
            <Switch 
              checked={settings.enableWeatherEffects}
              onCheckedChange={(checked) => updateSettings({ enableWeatherEffects: checked })}
              className="scale-75"
            />
          </div>
          
          {/* Trophy Room Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/achievements')}
            className="w-full flex items-center justify-center gap-2 border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400/50"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm">Trophy Room</span>
          </Button>
          
          {/* Backup/Restore */}
          <div className="w-full">
            <BackupRestoreModal />
          </div>
          
          {/* Data Wipe Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWipeModal(true)}
            className="w-full flex items-center justify-center gap-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive"
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
    </Collapsible>
  );
}

export default GameSettingsMenu;
