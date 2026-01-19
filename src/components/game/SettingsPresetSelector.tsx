import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  SETTINGS_PRESETS, 
  PresetId, 
  applyPreset, 
  detectCurrentPreset,
  ApplyPresetResult
} from '@/lib/settingsPresets';
import { GameSettings } from '@/lib/gameSettings';
import { DiceMode } from '@/game/diceSystem';
import { Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPresetSelectorProps {
  currentSettings: GameSettings;
  currentDiceMode?: DiceMode;
  onApplyPreset: (result: ApplyPresetResult) => void;
  className?: string;
}

export function SettingsPresetSelector({
  currentSettings,
  currentDiceMode,
  onApplyPreset,
  className,
}: SettingsPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(
    detectCurrentPreset(currentSettings, currentDiceMode)
  );
  const [isApplying, setIsApplying] = useState(false);

  const handleSelectPreset = (presetId: PresetId) => {
    setSelectedPreset(presetId);
    setIsApplying(true);
    
    // Apply with slight delay for visual feedback
    setTimeout(() => {
      const result = applyPreset(currentSettings, presetId);
      onApplyPreset(result);
      setIsApplying(false);
    }, 300);
  };

  const currentPreset = detectCurrentPreset(currentSettings);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">Quick Presets</h3>
        {currentPreset && (
          <Badge variant="secondary" className="text-xs">
            {SETTINGS_PRESETS.find(p => p.id === currentPreset)?.name} Mode
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="wait">
          {SETTINGS_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            const isCurrent = currentPreset === preset.id;
            
            return (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2",
                    isSelected || isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    isApplying && isSelected && "animate-pulse"
                  )}
                  onClick={() => handleSelectPreset(preset.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{preset.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{preset.name}</p>
                        </div>
                      </div>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Presets adjust game difficulty, mechanics, and realism. Your theme and content preferences are preserved.
      </p>
    </div>
  );
}
