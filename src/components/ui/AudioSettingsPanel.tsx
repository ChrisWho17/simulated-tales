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
    <div className={cn("space-y-6", className)}>
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
          onCheckedChange={() => handleToggleAudio()}
        />
      </div>
      
      {settings.enabled && (
        <>
          {/* Master Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Master Volume
              </Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.masterVolume * 100]}
              onValueChange={handleMasterChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          {/* Music Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Music
              </Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.musicVolume * 100]}
              onValueChange={handleMusicChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          {/* SFX Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Sound Effects
              </Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.sfxVolume * 100]}
              onValueChange={handleSfxChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          {/* Ambient Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Ambient
              </Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.ambientVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.ambientVolume * 100]}
              onValueChange={handleAmbientChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          
          {/* Test Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testSound}
            className="w-full"
          >
            Test Sound (Dice Roll)
          </Button>
        </>
      )}
    </div>
  );
}
