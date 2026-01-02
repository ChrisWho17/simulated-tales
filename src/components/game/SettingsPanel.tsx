import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Settings, Palette, Dices, Eye, Volume2, VolumeX, 
  Save, Sparkles, AlertTriangle, Clock, Trash2, Download, User,
  Brain, Heart, Zap, Swords, Cloud, Users, Star, Backpack, Activity, Languages, Bug,
  Sun, CloudRain, CloudLightning, CloudFog, Snowflake, Wind, Flame, Music, Headphones, Clapperboard
} from 'lucide-react';
import { DirectorSettingsTab } from './DirectorSettingsTab';
import { WeatherType, WEATHER_CONFIGS } from '@/game/weatherSystem';
import { ClimateZoneId, CLIMATE_ZONES } from '@/game/geographicClimateSystem';
import { useGame } from '@/contexts/GameContext';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { DICE_MODES, DiceMode } from '@/game/diceSystem';
import { COLOR_PRESETS } from '@/lib/colorTheme';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadAllSaves, deleteSave, GameSave, getAutoSaves, getManualSaves } from '@/lib/saveSystem';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { DEFAULT_DIRECTOR_SETTINGS, DirectorSettings } from '@/game/directorModeSystem';

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
  const campaignContext = useCampaignOptional();
  const { 
    initialized: audioInitialized,
    muted: audioMuted,
    volumes: audioVolumes,
    unlocked: audioUnlocked,
    soundsReady,
    preloadProgress,
    initializeAudio,
    setMasterVolume,
    setChannelVolume,
    toggleMute,
    playSoundFromCategory
  } = useAudioSystem();
  const [activeTab, setActiveTab] = useState<'gameplay' | 'saves' | 'display' | 'audio' | 'features' | 'director' | 'weather'>('gameplay');
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  
  // Clear all game data from localStorage
  const handleClearAllData = () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 5000);
      return;
    }
    
    // Get all localStorage keys related to the game
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Match game-related keys
        if (key.startsWith('campaign-') || 
            key.startsWith('untold-') ||
            key.startsWith('game-') ||
            key.startsWith('auto-') ||
            key.startsWith('manual-') ||
            key.startsWith('npc-') ||
            key.startsWith('inventory-') ||
            key.includes('Campaign') ||
            key.includes('Settings') ||
            key.includes('Save')) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove all matched keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setConfirmClearAll(false);
    
    // Reload the page to reset all state
    window.location.reload();
  };
  
  // Get director settings from campaign if available, otherwise use global settings
  const currentDirectorSettings = useMemo((): DirectorSettings => {
    if (campaignContext?.activeCampaign?.settings?.directorSettings) {
      return campaignContext.activeCampaign.settings.directorSettings;
    }
    return settings.directorSettings || DEFAULT_DIRECTOR_SETTINGS;
  }, [campaignContext?.activeCampaign?.settings?.directorSettings, settings.directorSettings]);
  
  // Update director settings - saves to campaign if active, otherwise global
  const handleDirectorSettingsUpdate = (newDirectorSettings: DirectorSettings) => {
    if (campaignContext?.activeCampaign) {
      // Update campaign-specific settings
      campaignContext.updateCampaign({
        settings: {
          ...campaignContext.activeCampaign.settings,
          directorSettings: newDirectorSettings,
        },
      });
    } else {
      // Fall back to global settings
      updateSettings({ directorSettings: newDirectorSettings });
    }
  };
  
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
        
        {/* Tabs - horizontal scroll only, static row */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2 overflow-x-auto overflow-y-hidden scrollbar-none">
          <div className="flex gap-1 min-w-max">
            {(['gameplay', 'features', 'director', 'weather', 'saves', 'display', 'audio'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-shrink-0 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-md flex items-center gap-1.5",
                  activeTab === tab 
                    ? "text-[var(--accent-primary)] bg-[var(--accent-bg)]/40 border border-[var(--accent-primary)]/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/30"
                )}
              >
                {tab === 'director' && <Clapperboard className="w-3 h-3" />}
                {tab === 'weather' && <Cloud className="w-3 h-3" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Subtle frosted divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent mx-4" />
        
        {/* Content - vertical scroll for settings */}
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4">
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
              
              {/* In-Depth Settings Section */}
              <div className="space-y-3 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">In-Depth Mode</h3>
                </div>
                
                {/* World Tone */}
                <div className="space-y-2 pl-1">
                  <span className="text-sm">World Tone</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cozy', 'balanced', 'brutal'] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => updateSettings({ 
                          inDepthSettings: { ...settings.inDepthSettings, worldTone: tone }
                        })}
                        className={cn(
                          "px-3 py-2 text-xs rounded-md border transition-colors capitalize",
                          settings.inDepthSettings?.worldTone === tone
                            ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                            : "border-border/50 hover:border-border"
                        )}
                      >
                        {tone === 'cozy' ? '🌸 Cozy' : tone === 'brutal' ? '💀 Brutal' : '⚖️ Balanced'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Realism Toggles */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm">Hunger & Thirst</span>
                    <p className="text-xs text-muted-foreground">Track survival needs</p>
                  </div>
                  <Switch 
                    checked={settings.inDepthSettings?.enableHunger ?? false}
                    onCheckedChange={(checked) => updateSettings({ 
                      inDepthSettings: { ...settings.inDepthSettings, enableHunger: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm">Fatigue System</span>
                    <p className="text-xs text-muted-foreground">Track energy and sleep</p>
                  </div>
                  <Switch 
                    checked={settings.inDepthSettings?.enableFatigue ?? false}
                    onCheckedChange={(checked) => updateSettings({ 
                      inDepthSettings: { ...settings.inDepthSettings, enableFatigue: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm">Equipment Wear</span>
                    <p className="text-xs text-muted-foreground">Items degrade over time</p>
                  </div>
                  <Switch 
                    checked={settings.inDepthSettings?.enableEquipmentWear ?? false}
                    onCheckedChange={(checked) => updateSettings({ 
                      inDepthSettings: { ...settings.inDepthSettings, enableEquipmentWear: checked }
                    })}
                  />
                </div>

                {/* Gun Nut Depth - only show when Equipment Wear is enabled */}
                {settings.inDepthSettings?.enableEquipmentWear && (
                  <div className="space-y-2 pl-4 border-l-2 border-[var(--accent-primary)]/30 ml-1">
                    <span className="text-sm">Weapon Detail Level</span>
                    <p className="text-xs text-muted-foreground mb-2">How deep to simulate weapon mechanics</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'standard', label: 'Standard', icon: '🔧' },
                        { id: 'gunnut', label: 'Gun Nut', icon: '⚙️' },
                        { id: 'gunnut_plus', label: 'Gun Nut+', icon: '🔬' }
                      ] as const).map((depth) => (
                        <button
                          key={depth.id}
                          onClick={() => updateSettings({ 
                            inDepthSettings: { 
                              ...settings.inDepthSettings,
                              gunNutDepth: depth.id
                            }
                          })}
                          className={cn(
                            "px-2 py-2 text-xs rounded-md border transition-colors flex flex-col items-center gap-1",
                            settings.inDepthSettings?.gunNutDepth === depth.id
                              ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                              : "border-border/50 hover:border-border"
                          )}
                        >
                          <span>{depth.icon}</span>
                          <span>{depth.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {settings.inDepthSettings?.gunNutDepth === 'gunnut_plus' 
                        ? 'Full simulation: magazine springs, carbon buildup, barrel rifling wear'
                        : settings.inDepthSettings?.gunNutDepth === 'gunnut'
                        ? 'Part-by-part condition tracking and detailed malfunctions'
                        : 'Simple overall durability for weapons'}
                    </p>
                  </div>
                )}

                {/* Cheat Mode Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm flex items-center gap-1.5">
                      ✨ Cheat Mode
                    </span>
                    <p className="text-xs text-muted-foreground">Free access to all attachments & items</p>
                  </div>
                  <Switch 
                    checked={settings.inDepthSettings?.cheatModeEnabled ?? false}
                    onCheckedChange={(checked) => updateSettings({ 
                      inDepthSettings: { ...settings.inDepthSettings, cheatModeEnabled: checked }
                    })}
                  />
                </div>

                {/* Content Focus */}
                <div className="space-y-2 pt-2">
                  <span className="text-sm">Social vs Combat Focus</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'balanced', 'heavy'] as const).map((weight) => (
                      <button
                        key={weight}
                        onClick={() => updateSettings({ 
                          inDepthSettings: { ...settings.inDepthSettings, socialWeight: weight }
                        })}
                        className={cn(
                          "px-3 py-2 text-xs rounded-md border transition-colors",
                          settings.inDepthSettings?.socialWeight === weight
                            ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                            : "border-border/50 hover:border-border"
                        )}
                      >
                        {weight === 'light' ? '⚔️ Combat' : weight === 'heavy' ? '💬 Social' : '⚖️ Both'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mystery Density */}
                <div className="space-y-2 pt-2">
                  <span className="text-sm">Mystery Density</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map((density) => (
                      <button
                        key={density}
                        onClick={() => updateSettings({ 
                          inDepthSettings: { ...settings.inDepthSettings, mysteryDensity: density }
                        })}
                        className={cn(
                          "px-3 py-2 text-xs rounded-md border transition-colors capitalize",
                          settings.inDepthSettings?.mysteryDensity === density
                            ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                            : "border-border/50 hover:border-border"
                        )}
                      >
                        {density === 'low' ? '📖 Clear' : density === 'high' ? '🔮 Dense' : '🎭 Medium'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adrenaline System */}
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-medium">Adrenaline System</h3>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 pl-1">
                    <div>
                      <span className="text-sm">Enable Adrenaline & Hidden Wounds</span>
                      <p className="text-xs text-muted-foreground">
                        Under stress, injuries may go unnoticed until adrenaline fades
                      </p>
                    </div>
                    <Switch 
                      checked={settings.enableAdrenalineSystem ?? false}
                      onCheckedChange={(checked) => updateSettings({ enableAdrenalineSystem: checked })}
                    />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-3 pt-4 border-t border-destructive/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  </div>
                  
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently delete all saved games, campaigns, and settings from this browser.
                      This action cannot be undone.
                    </p>
                    <button
                      onClick={handleClearAllData}
                      className={cn(
                        "w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        confirmClearAll
                          ? "bg-destructive text-destructive-foreground"
                          : "border border-destructive/50 text-destructive hover:bg-destructive/10"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                      {confirmClearAll ? 'Click Again to Confirm' : 'Clear All Game Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              {/* Mood System Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Mood System</h3>
                </div>
                
                <div className="space-y-2 pl-1">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Enable Mood Tracking</span>
                      <p className="text-xs text-muted-foreground">Track character emotional state</p>
                    </div>
                    <Switch 
                      checked={settings.enableMoodSystem ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableMoodSystem: checked })}
                    />
                  </div>
                  
                  {settings.enableMoodSystem && (
                    <>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-sm">Manual Mood Control</span>
                          <p className="text-xs text-muted-foreground">Allow manually setting mood</p>
                        </div>
                        <Switch 
                          checked={settings.manualMoodControl ?? false}
                          onCheckedChange={(checked) => updateSettings({ manualMoodControl: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-sm">Mood-Based Dialogue</span>
                          <p className="text-xs text-muted-foreground">AI adapts tone to mood</p>
                        </div>
                        <Switch 
                          checked={settings.enableMoodDialogue ?? true}
                          onCheckedChange={(checked) => updateSettings({ enableMoodDialogue: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Combat & Status Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Combat & Status</h3>
                </div>
                
                <div className="space-y-2 pl-1">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Active Conditions</span>
                      <p className="text-xs text-muted-foreground">Buffs, debuffs, and status effects</p>
                    </div>
                    <Switch 
                      checked={settings.enableModifiers ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableModifiers: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Wound System</span>
                      <p className="text-xs text-muted-foreground">Track injuries and healing</p>
                    </div>
                    <Switch 
                      checked={settings.enableWoundSystem ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableWoundSystem: checked })}
                    />
                  </div>
                </div>
              </div>
              
              {/* World Systems Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">World Systems</h3>
                </div>
                
                <div className="space-y-2 pl-1">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Weather Effects</span>
                      <p className="text-xs text-muted-foreground">Weather influences gameplay</p>
                    </div>
                    <Switch 
                      checked={settings.enableWeatherEffects ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableWeatherEffects: checked })}
                    />
                  </div>
                  
                  {settings.enableWeatherEffects && (
                    <>
                      {/* Weather Particles Toggle */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-sm">Weather Particles</span>
                          <p className="text-xs text-muted-foreground">Show visual weather effects</p>
                        </div>
                        <Switch 
                          checked={settings.showWeatherParticles ?? true}
                          onCheckedChange={(checked) => updateSettings({ showWeatherParticles: checked })}
                        />
                      </div>
                      
                      {/* Weather Mode Selection */}
                      <div className="space-y-2 pt-2">
                        <span className="text-sm">Weather Control</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateSettings({ weatherMode: 'auto' })}
                            className={cn(
                              "px-3 py-2 text-xs rounded-md border transition-colors",
                              settings.weatherMode === 'auto'
                                ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                                : "border-border/50 hover:border-border"
                            )}
                          >
                            🎲 Automatic
                          </button>
                          <button
                            onClick={() => updateSettings({ weatherMode: 'manual' })}
                            className={cn(
                              "px-3 py-2 text-xs rounded-md border transition-colors",
                              settings.weatherMode === 'manual'
                                ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                                : "border-border/50 hover:border-border"
                            )}
                          >
                            ✋ Manual
                          </button>
                        </div>
                      </div>
                      
                      {/* Manual Weather Selection */}
                      {settings.weatherMode === 'manual' && (
                        <div className="space-y-2 pt-2">
                          <span className="text-sm">Select Weather</span>
                          <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(WEATHER_CONFIGS) as WeatherType[]).map((weather) => {
                              const config = WEATHER_CONFIGS[weather];
                              return (
                                <button
                                  key={weather}
                                  onClick={() => updateSettings({ manualWeatherType: weather })}
                                  className={cn(
                                    "flex flex-col items-center gap-1 px-2 py-2 text-xs rounded-md border transition-colors",
                                    settings.manualWeatherType === weather
                                      ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                                      : "border-border/50 hover:border-border"
                                  )}
                                  title={config.name}
                                >
                                  {weather === 'clear' && <Sun className="w-4 h-4 text-amber-400" />}
                                  {weather === 'cloudy' && <Cloud className="w-4 h-4 text-slate-400" />}
                                  {weather === 'rain' && <CloudRain className="w-4 h-4 text-blue-400" />}
                                  {weather === 'storm' && <CloudLightning className="w-4 h-4 text-yellow-400" />}
                                  {weather === 'fog' && <CloudFog className="w-4 h-4 text-violet-400" />}
                                  {weather === 'snow' && <Snowflake className="w-4 h-4 text-cyan-400" />}
                                  {weather === 'heat_wave' && <Flame className="w-4 h-4 text-red-400" />}
                                  {weather === 'wind' && <Wind className="w-4 h-4 text-orange-400" />}
                                  <span className="text-[10px] truncate w-full text-center">{config.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">NPC Schedules</span>
                      <p className="text-xs text-muted-foreground">NPCs follow daily routines</p>
                    </div>
                    <Switch 
                      checked={settings.enableNPCSchedules ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableNPCSchedules: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Knowledge System</span>
                      <p className="text-xs text-muted-foreground">Progressive NPC info reveal</p>
                    </div>
                    <Switch 
                      checked={settings.enableKnowledgeSystem ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableKnowledgeSystem: checked })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Progression Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Progression</h3>
                </div>
                
                <div className="space-y-2 pl-1">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">XP & Leveling</span>
                      <p className="text-xs text-muted-foreground">Experience and level-ups</p>
                    </div>
                    <Switch 
                      checked={settings.enableXPSystem ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableXPSystem: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Reputation System</span>
                      <p className="text-xs text-muted-foreground">Faction and NPC reputation</p>
                    </div>
                    <Switch 
                      checked={settings.enableReputationSystem ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableReputationSystem: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Inventory Weight</span>
                      <p className="text-xs text-muted-foreground">Capacity limits on items</p>
                    </div>
                    <Switch 
                      checked={settings.enableInventoryWeight ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableInventoryWeight: checked })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Language & Translation Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Language & Speech</h3>
                </div>
                
                <div className="space-y-2 pl-1">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">NPC Accents & Dialects</span>
                      <p className="text-xs text-muted-foreground">NPCs speak with regional accents and verbal tics</p>
                    </div>
                    <Switch 
                      checked={settings.enableNPCAccents ?? true}
                      onCheckedChange={(checked) => updateSettings({ enableNPCAccents: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Show Translations</span>
                      <p className="text-xs text-muted-foreground">Display translations for foreign languages in purple italics</p>
                    </div>
                    <Switch 
                      checked={settings.languageSettings?.translateEnabled ?? false}
                      onCheckedChange={(checked) => updateSettings({ 
                        languageSettings: {
                          ...settings.languageSettings,
                          translateEnabled: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="py-2">
                    <span className="text-sm">Character's Languages</span>
                    <p className="text-xs text-muted-foreground mb-2">Languages your character understands</p>
                    <div className="flex flex-wrap gap-1">
                      {(settings.languageSettings?.playerKnownLanguages || ['en', 'common']).map(lang => (
                        <span 
                          key={lang} 
                          className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30"
                        >
                          {lang === 'en' ? 'English' : lang === 'common' ? 'Common Tongue' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">Learn new languages through gameplay</p>
                  </div>
                </div>
              </div>
              
              {/* Developer/Debug Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h3 className="text-sm font-medium">Developer Tools</h3>
                </div>
                
                <div className="space-y-2 pl-1">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Event Bus Debug Panel</span>
                      <p className="text-xs text-muted-foreground">Show real-time system events timeline</p>
                    </div>
                    <Switch 
                      checked={settings.showEventBusDebug ?? false}
                      onCheckedChange={(checked) => updateSettings({ showEventBusDebug: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">Consequence Feed</span>
                      <p className="text-xs text-muted-foreground">Show real-time feedback for trust, reputation, inventory changes</p>
                    </div>
                    <Switch 
                      checked={settings.showConsequenceFeed ?? true}
                      onCheckedChange={(checked) => updateSettings({ showConsequenceFeed: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Director Tab */}
          {activeTab === 'director' && (
            <DirectorSettingsTab
              directorSettings={currentDirectorSettings}
              onUpdate={handleDirectorSettingsUpdate}
            />
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
              {/* Audio Status Indicator */}
              {!audioUnlocked && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <VolumeX className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-sm font-medium text-amber-500">Audio Locked</span>
                    <p className="text-xs text-muted-foreground">
                      Click anywhere on the page to unlock audio playback
                    </p>
                  </div>
                </div>
              )}
              
              {audioUnlocked && !audioInitialized && (
                <button
                  onClick={initializeAudio}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-primary/40 
                             bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all group"
                >
                  <Headphones className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="font-medium text-sm text-primary">Enable Audio</span>
                    <p className="text-xs text-muted-foreground">Click to initialize the audio system</p>
                  </div>
                </button>
              )}
              
              {audioUnlocked && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500">Audio unlocked and ready</span>
                </div>
              )}
              
              {/* Master Sound Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled && !audioMuted ? (
                    <Volume2 className="w-4 h-4 text-[var(--accent-secondary)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-sm font-medium">Sound Effects</span>
                    <p className="text-xs text-muted-foreground">Enable all game sounds</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.soundEnabled && !audioMuted}
                  onCheckedChange={async (checked) => {
                    updateSettings({ soundEnabled: checked });
                    if (checked) {
                      // Initialize and preload sounds when enabling
                      if (!audioInitialized) {
                        await initializeAudio();
                      }
                      if (audioMuted) {
                        toggleMute();
                      }
                    } else {
                      if (!audioMuted) {
                        toggleMute();
                      }
                    }
                  }}
                />
              </div>
              
              {/* Sound Loading Status */}
              {audioInitialized && preloadProgress && !preloadProgress.isComplete && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-400">Loading Sounds...</span>
                    <p className="text-xs text-muted-foreground">
                      {preloadProgress.loaded} / {preloadProgress.total} ({preloadProgress.currentCategory})
                    </p>
                  </div>
                </div>
              )}
              
              {audioInitialized && soundsReady && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500">Sounds loaded and ready</span>
                </div>
              )}
              
              {settings.soundEnabled && audioInitialized && (
                <>
                  {/* Test Sound Button */}
                  <button
                    onClick={() => playSoundFromCategory('ui_click')}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-primary/40 
                               bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">Test Sound</span>
                  </button>
                  
                  {/* Master Volume */}
                  {/* Master Volume */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Master Volume</span>
                      <span className="text-xs text-[var(--accent-secondary)]">
                        {Math.round(audioVolumes.master * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[audioVolumes.master * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => setMasterVolume(value / 100)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Channel Volumes */}
                  <div className="space-y-4 pt-2 border-t border-border/30">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Music className="w-4 h-4 text-[var(--accent-secondary)]" />
                      Channel Volumes
                    </h3>
                    
                    {/* Ambience */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ambience</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.ambience * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.ambience * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('ambience', value / 100)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Effects */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Effects</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.effects * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.effects * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('effects', value / 100)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Music */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Music</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.music * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.music * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('music', value / 100)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* UI */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">UI Sounds</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.ui * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.ui * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('ui', value / 100)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Weather */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weather</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.weather * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.weather * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('weather', value / 100)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Voice */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Voice</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.voice * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.voice * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('voice', value / 100)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Dramatic */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dramatic</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioVolumes.dramatic * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[audioVolumes.dramatic * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setChannelVolume('dramatic', value / 100)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {/* Sound Type Toggles */}
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    <h3 className="text-sm font-medium">Sound Categories</h3>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm">Weather Sounds</span>
                        <p className="text-xs text-muted-foreground">Rain, thunder, wind ambience</p>
                      </div>
                      <Switch 
                        checked={settings.audioSettings?.enableWeatherSounds ?? true}
                        onCheckedChange={(checked) => updateSettings({ 
                          audioSettings: { ...settings.audioSettings, enableWeatherSounds: checked }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm">Story Sounds</span>
                        <p className="text-xs text-muted-foreground">Combat, doors, ambient effects</p>
                      </div>
                      <Switch 
                        checked={settings.audioSettings?.enableStorySounds ?? true}
                        onCheckedChange={(checked) => updateSettings({ 
                          audioSettings: { ...settings.audioSettings, enableStorySounds: checked }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm">UI Sounds</span>
                        <p className="text-xs text-muted-foreground">Clicks, notifications, feedback</p>
                      </div>
                      <Switch 
                        checked={settings.audioSettings?.enableUISounds ?? true}
                        onCheckedChange={(checked) => updateSettings({ 
                          audioSettings: { ...settings.audioSettings, enableUISounds: checked }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {!audioInitialized && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Click "Enable Audio" to access volume controls
                </p>
              )}
            </div>
          )}
          
          {/* Weather Tab */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Cloud className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-blue-400">Geographic Climate System</span>
                  <p className="text-xs text-muted-foreground">
                    Köppen-inspired climate zones with realistic weather patterns
                  </p>
                </div>
              </div>
              
              {/* Manual Weather Override */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[var(--accent-primary)]" />
                  Manual Override
                </h3>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm">Enable Manual Weather</span>
                    <p className="text-xs text-muted-foreground">Override automatic weather generation</p>
                  </div>
                  <Switch 
                    checked={settings.weatherMode === 'manual'}
                    onCheckedChange={(checked) => updateSettings({ 
                      weatherMode: checked ? 'manual' : 'auto'
                    })}
                  />
                </div>
                
                {settings.weatherMode === 'manual' && (
                  <div className="space-y-3 pl-1">
                    {/* Weather Type Selector */}
                    <div className="space-y-2">
                      <span className="text-sm">Select Weather</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'clear', icon: <Sun className="w-4 h-4" />, label: 'Clear', color: 'text-amber-500' },
                          { id: 'overcast', icon: <Cloud className="w-4 h-4" />, label: 'Overcast', color: 'text-gray-400' },
                          { id: 'rain', icon: <CloudRain className="w-4 h-4" />, label: 'Rain', color: 'text-blue-400' },
                          { id: 'storm', icon: <CloudLightning className="w-4 h-4" />, label: 'Storm', color: 'text-purple-400' },
                          { id: 'fog', icon: <CloudFog className="w-4 h-4" />, label: 'Fog', color: 'text-gray-300' },
                          { id: 'snow', icon: <Snowflake className="w-4 h-4" />, label: 'Snow', color: 'text-cyan-300' },
                          { id: 'heatWave', icon: <Flame className="w-4 h-4" />, label: 'Heat Wave', color: 'text-orange-500' },
                          { id: 'windy', icon: <Wind className="w-4 h-4" />, label: 'Windy', color: 'text-teal-400' },
                        ].map((weather) => (
                          <button
                            key={weather.id}
                            onClick={() => updateSettings({ 
                              manualWeatherType: weather.id
                            })}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left",
                              settings.manualWeatherType === weather.id
                                ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                                : "border-border/50 hover:border-border bg-background/30"
                            )}
                          >
                            <span className={weather.color}>{weather.icon}</span>
                            <span className="text-sm">{weather.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Intensity Selector */}
                    <div className="space-y-2 pt-2">
                      <span className="text-sm">Intensity</span>
                      <div className="grid grid-cols-3 gap-2">
                        {([1, 2, 3] as const).map((intensity) => (
                          <button
                            key={intensity}
                            onClick={() => updateSettings({ 
                              manualWeatherIntensity: intensity
                            })}
                            className={cn(
                              "px-3 py-2 text-xs rounded-md border transition-colors",
                              (settings.manualWeatherIntensity ?? 2) === intensity
                                ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                                : "border-border/50 hover:border-border"
                            )}
                          >
                            {intensity === 1 ? 'Light' : intensity === 2 ? 'Moderate' : 'Heavy'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Current Manual Weather Display */}
                    {settings.manualWeatherType && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--accent-bg)]/30 border border-[var(--accent-primary)]/30 mt-2">
                        <span className="text-sm">
                          Active: <span className="font-medium capitalize">{settings.manualWeatherType}</span>
                          {settings.manualWeatherIntensity && (
                            <span className="text-muted-foreground">
                              {' '}({['Light', 'Moderate', 'Heavy'][(settings.manualWeatherIntensity ?? 2) - 1]})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Climate Zone Override */}
              <div className="space-y-3 pt-2 border-t border-border/30">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Climate Zones
                </h3>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm">Enable Manual Climate</span>
                    <p className="text-xs text-muted-foreground">Override automatic climate detection</p>
                  </div>
                  <Switch 
                    checked={settings.climateMode === 'manual'}
                    onCheckedChange={(checked) => updateSettings({ 
                      climateMode: checked ? 'manual' : 'auto'
                    })}
                  />
                </div>
                
                {settings.climateMode === 'manual' && (
                  <div className="space-y-2 pl-1">
                    <span className="text-sm">Select Climate Zone</span>
                    <div className="grid gap-2">
                      {[
                        { id: 'tropical', icon: '🌴', label: 'Tropical', desc: 'Hot, humid, no snow' },
                        { id: 'arid', icon: '🏜️', label: 'Arid/Desert', desc: 'Extreme temps, rare rain' },
                        { id: 'mediterranean', icon: '🍇', label: 'Mediterranean', desc: 'Dry summers, wet winters' },
                        { id: 'temperate', icon: '🌲', label: 'Temperate', desc: 'Four distinct seasons' },
                        { id: 'continental', icon: '🌾', label: 'Continental', desc: 'Hot summers, cold winters' },
                        { id: 'subarctic', icon: '🌨️', label: 'Subarctic', desc: 'Long cold winters' },
                        { id: 'polar', icon: '❄️', label: 'Polar', desc: 'Extreme cold year-round' },
                        { id: 'highland', icon: '⛰️', label: 'Highland', desc: 'Altitude-dependent' },
                        { id: 'oceanic', icon: '🌊', label: 'Oceanic', desc: 'Mild, wet, cloudy' },
                      ].map((climate) => (
                        <button
                          key={climate.id}
                          onClick={() => updateSettings({ 
                            manualClimateZone: climate.id
                          })}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left",
                            settings.manualClimateZone === climate.id
                              ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                              : "border-border/50 hover:border-border bg-background/30"
                          )}
                        >
                          <span className="text-lg">{climate.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{climate.label}</span>
                            <p className="text-xs text-muted-foreground">{climate.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Current Climate Display */}
                    {settings.manualClimateZone && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--accent-bg)]/30 border border-[var(--accent-primary)]/30 mt-2">
                        <span className="text-sm">
                          Active Climate: <span className="font-medium capitalize">{settings.manualClimateZone}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {settings.climateMode !== 'manual' && (
                  <div className="grid gap-2 text-xs">
                    <div className="flex justify-between p-2 rounded bg-background/30">
                      <span>🌴 Tropical</span>
                      <span className="text-muted-foreground">Hot, humid, no snow</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-background/30">
                      <span>🏜️ Arid/Desert</span>
                      <span className="text-muted-foreground">Extreme temps, rare rain</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-background/30">
                      <span>🌲 Temperate</span>
                      <span className="text-muted-foreground">Four seasons</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-background/30">
                      <span>❄️ Polar/Subarctic</span>
                      <span className="text-muted-foreground">Cold dominant, heavy snow</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-background/30">
                      <span>⛰️ Highland</span>
                      <span className="text-muted-foreground">Altitude-dependent</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Weather Fronts Info */}
              <div className="space-y-3 pt-2 border-t border-border/30">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  Weather Fronts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dynamic weather fronts move across regions, affecting weather probabilities.
                </p>
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10">
                    <span>❄️ Cold Front</span>
                    <span className="text-muted-foreground">Brings snow/rain, drops temps</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-orange-500/10">
                    <span>☀️ Warm Front</span>
                    <span className="text-muted-foreground">Clears skies, raises temps</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10">
                    <span>⛈️ Storm System</span>
                    <span className="text-muted-foreground">Heavy storms, wind</span>
                  </div>
                </div>
              </div>
              
              {/* Transition Matrix Info */}
              <div className="space-y-3 pt-2 border-t border-border/30">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  Realistic Transitions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Weather follows logical patterns: rain often becomes overcast before clearing,
                  storms break to wind, fog burns off to clear skies. Season and time of day
                  affect probabilities.
                </p>
              </div>
            </div>
          )}
          </div>
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
