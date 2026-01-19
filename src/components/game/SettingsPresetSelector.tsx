import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DiceMode } from '@/game/diceSystem';
import { Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Preset definitions
export type PresetId = 'casual' | 'story' | 'simulation' | 'hardcore';

interface SettingsPreset {
  id: PresetId;
  name: string;
  icon: string;
  description: string;
  diceMode: DiceMode;
  settings: {
    enableHunger: boolean;
    enableFatigue: boolean;
    enableInjuryDetail: boolean;
    enableEquipmentWear: boolean;
    enableInventoryWeight: boolean;
    enableWoundSystem: boolean;
    worldTone: 'cozy' | 'balanced' | 'brutal';
    consequenceIntensity: 'forgiving' | 'balanced' | 'harsh';
    microEventFrequency: 'rare' | 'occasional' | 'frequent';
  };
}

export const SETTINGS_PRESETS: SettingsPreset[] = [
  {
    id: 'casual',
    name: 'Casual',
    icon: '🌸',
    description: 'Relaxed adventure with minimal survival mechanics. Focus on story and exploration.',
    diceMode: 'story',
    settings: {
      enableHunger: false,
      enableFatigue: false,
      enableInjuryDetail: false,
      enableEquipmentWear: false,
      enableInventoryWeight: false,
      enableWoundSystem: false,
      worldTone: 'cozy',
      consequenceIntensity: 'forgiving',
      microEventFrequency: 'rare',
    },
  },
  {
    id: 'story',
    name: 'Story',
    icon: '📖',
    description: 'Balanced experience with meaningful choices. Some mechanics add tension without overwhelming.',
    diceMode: 'partial',
    settings: {
      enableHunger: false,
      enableFatigue: false,
      enableInjuryDetail: true,
      enableEquipmentWear: false,
      enableInventoryWeight: false,
      enableWoundSystem: true,
      worldTone: 'balanced',
      consequenceIntensity: 'balanced',
      microEventFrequency: 'occasional',
    },
  },
  {
    id: 'simulation',
    name: 'Simulation',
    icon: '⚙️',
    description: 'Full survival mechanics and realism. Every resource matters.',
    diceMode: 'partial',
    settings: {
      enableHunger: true,
      enableFatigue: true,
      enableInjuryDetail: true,
      enableEquipmentWear: true,
      enableInventoryWeight: true,
      enableWoundSystem: true,
      worldTone: 'balanced',
      consequenceIntensity: 'balanced',
      microEventFrequency: 'frequent',
    },
  },
  {
    id: 'hardcore',
    name: 'Hardcore',
    icon: '💀',
    description: 'Maximum challenge. Brutal consequences, full realism, dice decide fate.',
    diceMode: 'full',
    settings: {
      enableHunger: true,
      enableFatigue: true,
      enableInjuryDetail: true,
      enableEquipmentWear: true,
      enableInventoryWeight: true,
      enableWoundSystem: true,
      worldTone: 'brutal',
      consequenceIntensity: 'harsh',
      microEventFrequency: 'frequent',
    },
  },
];

interface SettingsPresetSelectorProps {
  currentDiceMode?: DiceMode;
  onApplyPreset: (presetId: PresetId, preset: SettingsPreset) => void;
  className?: string;
}

export function SettingsPresetSelector({
  currentDiceMode,
  onApplyPreset,
  className,
}: SettingsPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleSelectPreset = (preset: SettingsPreset) => {
    setSelectedPreset(preset.id);
    setIsApplying(true);
    
    // Apply with slight delay for visual feedback
    setTimeout(() => {
      onApplyPreset(preset.id, preset);
      setIsApplying(false);
    }, 300);
  };

  // Detect current preset from dice mode (simple heuristic)
  const currentPreset = SETTINGS_PRESETS.find(p => p.diceMode === currentDiceMode)?.id;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
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
                      ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                      : "border-border hover:border-[var(--accent-primary)]/50",
                    isApplying && isSelected && "animate-pulse"
                  )}
                  onClick={() => handleSelectPreset(preset)}
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
                        <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
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
