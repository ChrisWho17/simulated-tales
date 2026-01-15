import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Sparkles, Bell } from 'lucide-react';
import { Slider } from './slider';
import { Switch } from './switch';
import { Label } from './label';
import { Button } from './button';
import { useAudio } from '@/lib/audioSystem';
import { cn } from '@/lib/utils';

interface AudioSettingsPanelProps {
  className?: string;
}

export function AudioSettingsPanel({ className }: AudioSettingsPanelProps) {
  const { settings, updateSettings, playSound, isInitialized } = useAudio();
  
  const handleMasterChange = (value: number[]) => {
    updateSettings({ masterVolume: value[0] / 100 });
  };
  
  const handleMusicChange = (value: number[]) => {
    updateSettings({ musicVolume: value[0] / 100 });
  };
  
  const handleSfxChange = (value: number[]) => {
    updateSettings({ sfxVolume: value[0] / 100 });
    // Play a test sound
    playSound('click');
  };
  
  const handleAmbientChange = (value: number[]) => {
    updateSettings({ ambientVolume: value[0] / 100 });
  };
  
  const handleToggleAudio = () => {
    updateSettings({ enabled: !settings.enabled });
    if (!settings.enabled) {
      playSound('notification');
    }
  };
  
  const testSound = () => {
    playSound('dice_roll');
  };

  return (
    <div className={cn("space-y-6 relative", className)}>
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Volume2 className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <p className="font-medium text-foreground">Audio Coming Soon</p>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Ambient music and sound effects are in development
            </p>
          </div>
        </div>
      </div>
      
      {/* Blurred settings preview behind overlay */}
      <div className="opacity-50 pointer-events-none">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Volume2 className="w-5 h-5 text-primary" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label>Audio Enabled</Label>
              <p className="text-xs text-muted-foreground">
                {isInitialized ? 'Audio system ready' : 'Click anywhere to initialize'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            disabled
          />
        </div>
        
        {/* Volume Previews */}
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Master Volume
            </Label>
            <span className="text-sm text-muted-foreground">70%</span>
          </div>
          <Slider
            value={[70]}
            max={100}
            step={5}
            className="w-full"
            disabled
          />
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Music
            </Label>
            <span className="text-sm text-muted-foreground">50%</span>
          </div>
          <Slider
            value={[50]}
            max={100}
            step={5}
            className="w-full"
            disabled
          />
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Sound Effects
            </Label>
            <span className="text-sm text-muted-foreground">80%</span>
          </div>
          <Slider
            value={[80]}
            max={100}
            step={5}
            className="w-full"
            disabled
          />
        </div>
      </div>
    </div>
  );
}
