import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Palette, Dices, Eye, Volume2, VolumeX, 
  Save, Sparkles, AlertTriangle, Clock, Trash2, Download, User
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DICE_MODES, DiceMode } from '@/game/diceSystem';
import { COLOR_PRESETS } from '@/lib/colorTheme';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadAllSaves, deleteSave, GameSave, getAutoSaves, getManualSaves } from '@/lib/saveSystem';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSave?: (save: GameSave) => void;
  onManualSave?: () => void;
  currentCharacterName?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  onLoadSave, 
  onManualSave,
  currentCharacterName 
}) => {
  const { settings, updateSettings, diceMode, setDiceMode, colorTheme, setColorTheme } = useGame();
  const [activeTab, setActiveTab] = useState<'gameplay' | 'saves' | 'display' | 'audio'>('gameplay');
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Load saves when tab changes to saves
  useEffect(() => {
    if (activeTab === 'saves') {
      setSaves(loadAllSaves());
    }
  }, [activeTab]);
  
  if (!isOpen) return null;
  
  const textSpeedLabels: Record<string, string> = {
    slow: 'Slow',
    normal: 'Normal', 
    fast: 'Fast',
    instant: 'Instant'
  };
  
  const textSpeedValues = ['slow', 'normal', 'fast', 'instant'] as const;
  
  const handleDeleteSave = (saveId: string) => {
    if (confirmDelete === saveId) {
      deleteSave(saveId);
      setSaves(loadAllSaves());
      setConfirmDelete(null);
    } else {
      setConfirmDelete(saveId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };
  
  const handleManualSave = () => {
    if (onManualSave) {
      onManualSave();
      // Refresh saves list after saving
      setTimeout(() => setSaves(loadAllSaves()), 100);
    }
  };
  
  const handleLoadSave = (save: GameSave) => {
    if (onLoadSave) {
      onLoadSave(save);
      onClose();
    }
  };
  
  const autoSaves = saves.filter(s => s.id.startsWith('auto-')).sort((a, b) => b.timestamp - a.timestamp);
  const manualSaves = saves.filter(s => s.id.startsWith('manual-')).sort((a, b) => b.timestamp - a.timestamp);
  
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
          {(['gameplay', 'saves', 'display', 'audio'] as const).map((tab) => (
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
                    <p className="text-xs text-muted-foreground">Save progress every 5 minutes</p>
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
          
          {/* Saves Tab */}
          {activeTab === 'saves' && (
            <div className="space-y-6">
              {/* Manual Save Button */}
              {onManualSave && (
                <button
                  onClick={handleManualSave}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-primary/40 
                             bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all group"
                >
                  <Save className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="font-medium text-sm text-primary">Save Snapshot</span>
                    {currentCharacterName && (
                      <p className="text-xs text-muted-foreground">Save {currentCharacterName}'s current progress</p>
                    )}
                  </div>
                </button>
              )}
              
              {saves.length === 0 && !onManualSave ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Save className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No saves yet</p>
                  <p className="text-xs mt-1">Your adventure saves will appear here</p>
                </div>
              ) : saves.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-xs">No saves yet — create your first snapshot above!</p>
                </div>
              ) : (
                <>
                  {/* Auto Saves Section */}
                  {autoSaves.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--accent-secondary)]" />
                        <h3 className="text-sm font-medium">Auto Saves</h3>
                        <span className="text-xs text-muted-foreground">({autoSaves.length})</span>
                      </div>
                      <div className="space-y-2">
                        {autoSaves.map((save) => (
                          <SaveSlot 
                            key={save.id} 
                            save={save}
                            isConfirmingDelete={confirmDelete === save.id}
                            onLoad={() => handleLoadSave(save)}
                            onDelete={() => handleDeleteSave(save.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Manual Saves Section */}
                  {manualSaves.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4 text-[var(--accent-secondary)]" />
                        <h3 className="text-sm font-medium">Manual Saves</h3>
                        <span className="text-xs text-muted-foreground">({manualSaves.length})</span>
                      </div>
                      <div className="space-y-2">
                        {manualSaves.map((save) => (
                          <SaveSlot 
                            key={save.id} 
                            save={save}
                            isConfirmingDelete={confirmDelete === save.id}
                            onLoad={() => handleLoadSave(save)}
                            onDelete={() => handleDeleteSave(save.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
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

// ============================================================================
// SAVE SLOT COMPONENT
// ============================================================================

interface SaveSlotProps {
  save: GameSave;
  isConfirmingDelete: boolean;
  onLoad: () => void;
  onDelete: () => void;
}

const SaveSlot: React.FC<SaveSlotProps> = ({ save, isConfirmingDelete, onLoad, onDelete }) => {
  const isAutoSave = save.id.startsWith('auto-');
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:border-border transition-all group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          isAutoSave ? "bg-muted/50" : "bg-primary/10"
        )}>
          {isAutoSave ? (
            <Clock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{save.characterName}</span>
            {isAutoSave && (
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">Auto</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{save.dateFormatted}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onLoad}
          className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors"
          title="Load Save"
        >
          <Download size={16} />
        </button>
        <button
          onClick={onDelete}
          className={cn(
            "p-2 rounded-md transition-colors",
            isConfirmingDelete 
              ? "bg-destructive/20 text-destructive" 
              : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          )}
          title={isConfirmingDelete ? "Click again to confirm" : "Delete Save"}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
