import React, { useState } from 'react';
import { 
  X, Settings, Palette, Dices, Eye, Volume2, VolumeX, 
  Save, Moon, Sun, Sparkles, AlertTriangle
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DICE_MODES, DiceMode } from '@/game/diceSystem';
import { COLOR_PRESETS, applyColorTheme } from '@/lib/colorTheme';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, diceMode, setDiceMode, colorTheme, setColorTheme } = useGame();
  const [activeTab, setActiveTab] = useState<'gameplay' | 'display' | 'audio'>('gameplay');
  
  if (!isOpen) return null;
  
  const textSpeedLabels: Record<string, string> = {
    slow: 'Slow',
    normal: 'Normal', 
    fast: 'Fast',
    instant: 'Instant'
  };
  
  const textSpeedValues = ['slow', 'normal', 'fast', 'instant'] as const;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="glass-panel w-full max-w-lg max-h-[80vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="font-display text-lg">Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border/30">
          {(['gameplay', 'display', 'audio'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab 
                  ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {/* Gameplay Tab */}
          {activeTab === 'gameplay' && (
            <div className="space-y-6">
              {/* Dice Mode */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Dice Mode</h3>
                </div>
                <div className="grid gap-2">
                  {Object.values(DICE_MODES).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setDiceMode(mode.id as DiceMode)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        diceMode === mode.id
                          ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{mode.icon}</span>
                        <span className="font-medium text-sm">{mode.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Adult Content Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-sm font-medium">18+ Content</span>
                    <p className="text-xs text-muted-foreground">Enable mature themes and content</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.adultContent}
                  onCheckedChange={(checked) => updateSettings({ adultContent: checked })}
                />
              </div>
              
              {/* Auto Save */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <div>
                    <span className="text-sm font-medium">Auto Save</span>
                    <p className="text-xs text-muted-foreground">Save progress automatically</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                />
              </div>
              
              {/* Show Roll Details */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <div>
                    <span className="text-sm font-medium">Show Roll Details</span>
                    <p className="text-xs text-muted-foreground">Display dice roll breakdowns</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.showRollDetails}
                  onCheckedChange={(checked) => updateSettings({ showRollDetails: checked })}
                />
              </div>
            </div>
          )}
          
          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Color Theme */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Color Theme</h3>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setColorTheme(color.id)}
                      className={cn(
                        "w-10 h-10 rounded-full transition-all",
                        colorTheme.id === color.id 
                          ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105"
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                        boxShadow: colorTheme.id === color.id ? `0 0 20px ${color.glow}` : undefined
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Scene Illustrations */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <div>
                    <span className="text-sm font-medium">Scene Illustrations</span>
                    <p className="text-xs text-muted-foreground">Generate AI images for scenes</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.sceneIllustrations}
                  onCheckedChange={(checked) => updateSettings({ sceneIllustrations: checked })}
                />
              </div>
              
              {/* Text Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Text Speed</span>
                  <span className="text-xs text-[var(--accent-secondary)]">
                    {textSpeedLabels[settings.textSpeed]}
                  </span>
                </div>
                <Slider
                  value={[textSpeedValues.indexOf(settings.textSpeed)]}
                  min={0}
                  max={3}
                  step={1}
                  onValueChange={([index]) => {
                    updateSettings({ textSpeed: textSpeedValues[index] });
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Instant</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[var(--accent-secondary)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-sm font-medium">Sound Effects</span>
                    <p className="text-xs text-muted-foreground">Enable game sounds</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center py-8">
                More audio options coming soon...
              </p>
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <button 
            onClick={onClose}
            className="w-full glow-button py-2.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
