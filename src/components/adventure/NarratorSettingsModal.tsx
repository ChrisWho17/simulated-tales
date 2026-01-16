import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Clapperboard, Sparkles, ChevronDown, ChevronRight,
  BookOpen, Ghost, Skull, Heart, Laugh, Search,
  Sword, Compass, Users, MessageSquare, Zap
} from 'lucide-react';
import {
  DirectorSettings,
  DirectorType,
  DirectiveMode,
  DIRECTOR_TYPES,
  DIRECTOR_TYPE_CATEGORIES,
  DIRECTIVE_MODES,
  getDirectorTypesByCategory,
  getDirectorNarratorProfile,
  DEFAULT_DIRECTOR_SETTINGS,
} from '@/game/directorModeSystem';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useGame } from '@/contexts/GameContext';

interface NarratorSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (settings: DirectorSettings) => void;
  initialSettings?: DirectorSettings;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  story: <BookOpen className="w-4 h-4" />,
  freedom: <Compass className="w-4 h-4" />,
  challenge: <Sword className="w-4 h-4" />,
  mystery: <Search className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
  vibe: <Ghost className="w-4 h-4" />,
};

export function NarratorSettingsModal({
  open,
  onClose,
  onConfirm,
  initialSettings,
}: NarratorSettingsModalProps) {
  const { settings: gameSettings, updateSettings: updateGameSettings } = useGame();
  
  // Sync with global settings - use gameSettings.directorSettings as source of truth
  const [settings, setSettings] = useState<DirectorSettings>(
    initialSettings || gameSettings.directorSettings || DEFAULT_DIRECTOR_SETTINGS
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>('story');
  
  // Sync local state when global settings change
  useEffect(() => {
    if (gameSettings.directorSettings) {
      setSettings(gameSettings.directorSettings);
    }
  }, [gameSettings.directorSettings]);

  const handleModeChange = (mode: DirectiveMode) => {
    setSettings(prev => ({ ...prev, mode }));
  };

  const handleTypeChange = (type: DirectorType) => {
    setSettings(prev => ({ ...prev, directorType: type }));
  };

  const narratorProfile = settings.enabled && !settings.rawGame
    ? getDirectorNarratorProfile(settings.directorType)
    : null;

  const typeProfile = settings.enabled && !settings.rawGame
    ? DIRECTOR_TYPES[settings.directorType]
    : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            Choose Your Narrator
          </DialogTitle>
          <DialogDescription>
            Configure how your story will be told before you begin
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Enable Director Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
              <div>
                <h3 className="text-sm font-medium">Enable Director Mode</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Let a narrative director shape your story's pacing and tone
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  enabled: checked,
                  rawGame: !checked,
                }))}
              />
            </div>

            {settings.enabled && (
              <>
                {/* Raw Game Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div>
                    <h3 className="text-sm font-medium">Raw Game Mode</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pure simulation, no narrative steering
                    </p>
                  </div>
                  <Switch
                    checked={settings.rawGame}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      rawGame: checked,
                    }))}
                  />
                </div>

                {!settings.rawGame && (
                  <>
                    {/* Difficulty Mode Selection */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Difficulty Mode
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {DIRECTIVE_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => handleModeChange(mode.id)}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              settings.mode === mode.id
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-primary/50 bg-background/50"
                            )}
                          >
                            <div className="text-2xl mb-1">{mode.icon}</div>
                            <div className="text-xs font-medium">{mode.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tightness Slider */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Compass className="w-4 h-4 text-primary" />
                        Narrative Control
                      </h3>
                      <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Player-Led</span>
                          <span className="text-foreground font-medium">
                            {Math.round(settings.tightness * 100)}%
                          </span>
                          <span>Director-Led</span>
                        </div>
                        <Slider
                          value={[settings.tightness * 100]}
                          onValueChange={(value) => setSettings(prev => ({
                            ...prev,
                            tightness: value[0] / 100,
                          }))}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>

                    {/* Director Type Selection */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Director Personality
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(DIRECTOR_TYPE_CATEGORIES).map(([categoryId, category]) => {
                          const types = getDirectorTypesByCategory(categoryId as keyof typeof DIRECTOR_TYPE_CATEGORIES);
                          const isExpanded = expandedCategory === categoryId;
                          const hasActiveType = types.includes(settings.directorType);

                          return (
                            <Collapsible
                              key={categoryId}
                              open={isExpanded}
                              onOpenChange={(open) => setExpandedCategory(open ? categoryId : null)}
                            >
                              <CollapsibleTrigger
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-lg",
                                  "border transition-all",
                                  hasActiveType
                                    ? "border-primary bg-primary/10"
                                    : "border-border/50 bg-background/50 hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {CATEGORY_ICONS[categoryId] || <MessageSquare className="w-4 h-4" />}
                                  <span className="text-sm font-medium">{category.name}</span>
                                  {hasActiveType && (
                                    <span className="text-xs text-primary ml-2">
                                      • {DIRECTOR_TYPES[settings.directorType].name}
                                    </span>
                                  )}
                                </div>
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </CollapsibleTrigger>

                              <CollapsibleContent className="mt-2 space-y-1 pl-4">
                                {types.map((typeId) => {
                                  const type = DIRECTOR_TYPES[typeId];
                                  const profile = getDirectorNarratorProfile(typeId);
                                  const isSelected = settings.directorType === typeId;

                                  return (
                                    <button
                                      key={typeId}
                                      onClick={() => handleTypeChange(typeId)}
                                      className={cn(
                                        "w-full p-3 rounded-lg text-left transition-all border",
                                        isSelected
                                          ? "border-primary bg-primary/10"
                                          : "border-border/30 bg-background/30 hover:bg-muted/50"
                                      )}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{type.name}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                          {profile.voice}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{type.description}</p>
                                      {isSelected && (
                                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs italic text-muted-foreground">
                                          "{profile.openingStyle.slice(0, 100)}..."
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </div>

                    {/* Personality Modifiers */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Personality Tweaks</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Cruelty */}
                        <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Skull className="w-3 h-3" />
                            Cruelty
                          </div>
                          <div className="flex flex-col gap-1">
                            {(['soft', 'honest', 'brutal'] as const).map((level) => (
                              <button
                                key={level}
                                onClick={() => setSettings(prev => ({ ...prev, cruelty: level }))}
                                className={cn(
                                  "text-[10px] px-2 py-1.5 rounded border transition-all capitalize",
                                  settings.cruelty === level
                                    ? "border-primary bg-primary/20 text-primary"
                                    : "border-border/30 hover:border-primary/50"
                                )}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Weirdness */}
                        <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            Weirdness
                          </div>
                          <div className="flex flex-col gap-1">
                            {(['grounded', 'spicy', 'unhinged'] as const).map((level) => (
                              <button
                                key={level}
                                onClick={() => setSettings(prev => ({ ...prev, weirdness: level }))}
                                className={cn(
                                  "text-[10px] px-2 py-1.5 rounded border transition-all capitalize",
                                  settings.weirdness === level
                                    ? "border-primary bg-primary/20 text-primary"
                                    : "border-border/30 hover:border-primary/50"
                                )}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Guidance */}
                        <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Compass className="w-3 h-3" />
                            Guidance
                          </div>
                          <div className="flex flex-col gap-1">
                            {(['none', 'light', 'coach'] as const).map((level) => (
                              <button
                                key={level}
                                onClick={() => setSettings(prev => ({ ...prev, guidance: level }))}
                                className={cn(
                                  "text-[10px] px-2 py-1.5 rounded border transition-all capitalize",
                                  settings.guidance === level
                                    ? "border-primary bg-primary/20 text-primary"
                                    : "border-border/30 hover:border-primary/50"
                                )}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Preview */}
            {narratorProfile && typeProfile && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  How Your Story Will Begin
                </h4>
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{narratorProfile.openingStyle}"
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {typeProfile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!settings.enabled && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Director Mode disabled. You'll get the default narrator experience.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/50">
          <Button variant="outline" onClick={onClose}>
            Skip for Now
          </Button>
          <Button onClick={() => {
            // Sync to global settings first
            updateGameSettings({ directorSettings: settings });
            onConfirm(settings);
          }}>
            Begin Adventure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NarratorSettingsModal;
