import React, { useState } from 'react';
import { 
  Clapperboard, AlertTriangle, Sparkles, Gauge, Users, 
  Skull, Laugh, Compass, Info, ChevronDown, ChevronRight,
  Zap, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DirectorSettings,
  DirectiveMode,
  DirectorType,
  DescriptionLevel,
  DIRECTIVE_MODES,
  DIRECTOR_TYPES,
  DIRECTOR_TYPE_CATEGORIES,
  getDirectorTypesByCategory,
  computeDirectorKnobs,
  getRawGameKnobs,
} from '@/game/directorModeSystem';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Description level steps with labels - maps to DescriptionLevel type
const DESCRIPTION_LEVEL_CONFIG: { value: number; id: DescriptionLevel; label: string; description: string }[] = [
  { value: 0, id: 'vague', label: 'Vague', description: 'Minimal details, room for imagination' },
  { value: 1, id: 'minimal', label: 'Light', description: 'Key details only' },
  { value: 2, id: 'balanced', label: 'Balanced', description: 'Standard descriptions' },
  { value: 3, id: 'detailed', label: 'Rich', description: 'Detailed world painting' },
  { value: 4, id: 'vivid', label: 'Vivid', description: 'Maximum sensory detail' },
];

// Map DescriptionLevel to numeric index
const descriptionLevelToIndex = (level: DescriptionLevel): number => {
  const idx = DESCRIPTION_LEVEL_CONFIG.findIndex(c => c.id === level);
  return idx >= 0 ? idx : 2; // Default to balanced (index 2)
};

// Map numeric index to DescriptionLevel
const indexToDescriptionLevel = (index: number): DescriptionLevel => {
  return DESCRIPTION_LEVEL_CONFIG[index]?.id || 'balanced';
};

interface DirectorSettingsTabProps {
  directorSettings: DirectorSettings;
  onUpdate: (settings: DirectorSettings) => void;
}

export const DirectorSettingsTab: React.FC<DirectorSettingsTabProps> = ({
  directorSettings,
  onUpdate,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Get current description level as index
  const currentDescriptionIndex = descriptionLevelToIndex(directorSettings.descriptionLevel || 'balanced');
  
  // Director Mode OFF = everything disabled
  // Director Mode ON + Raw Game ON = only difficulty modes enabled
  // Director Mode ON + Raw Game OFF = all settings enabled (full manipulation)
  const isDirectorOff = !directorSettings.enabled;
  const isDifficultyOnly = directorSettings.enabled && directorSettings.rawGame;
  const isFullyEnabled = directorSettings.enabled && !directorSettings.rawGame;
  
  // Advanced settings disabled unless fully enabled (Raw OFF)
  const isAdvancedDisabled = !isFullyEnabled;
  
  // Get current knobs for preview
  const currentKnobs = !isFullyEnabled
    ? getRawGameKnobs()
    : computeDirectorKnobs(
        directorSettings.mode, 
        directorSettings.tightness, 
        directorSettings.directorType
      );

  const handleModeChange = (mode: DirectiveMode) => {
    onUpdate({ ...directorSettings, mode });
  };

  const handleTypeChange = (type: DirectorType) => {
    onUpdate({ ...directorSettings, directorType: type });
  };

  const handleTightnessChange = (value: number[]) => {
    onUpdate({ ...directorSettings, tightness: value[0] / 100 });
  };

  const handleDescriptionLevelChange = (value: number[]) => {
    onUpdate({ ...directorSettings, descriptionLevel: indexToDescriptionLevel(value[0]) });
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-medium">Director Mode</h3>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-medium">Enable Director</span>
            <p className="text-xs text-muted-foreground">
              DM manipulation features active
            </p>
          </div>
          <Switch 
            checked={directorSettings.enabled}
            onCheckedChange={(checked) => onUpdate({ 
              ...directorSettings, 
              enabled: checked,
              rawGame: !checked ? true : directorSettings.rawGame 
            })}
          />
        </div>
        
        {/* Raw Game Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-medium">Raw Game</span>
            <p className="text-xs text-muted-foreground">
              No narrative steering, pure simulation
            </p>
          </div>
          <Switch 
            checked={directorSettings.rawGame}
            disabled={!directorSettings.enabled}
            onCheckedChange={(checked) => onUpdate({ ...directorSettings, rawGame: checked })}
          />
        </div>
        
        {/* Warning when Raw Game is enabled */}
        {directorSettings.rawGame && directorSettings.enabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-200/80">
              Director features disabled. Core sim still runs.
            </p>
          </div>
        )}
        
        {/* Narrator Description Level - visible when Director is enabled */}
        {directorSettings.enabled && (
          <div className="space-y-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent-secondary)]" />
              <h3 className="text-sm font-medium">Narrator Description</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Vague</span>
                <span className="text-foreground font-medium">
                  {DESCRIPTION_LEVEL_CONFIG[currentDescriptionIndex]?.label || 'Balanced'}
                </span>
                <span>Vivid</span>
              </div>
              
              {/* Slider with tick marks */}
              <div className="relative">
                <Slider
                  value={[currentDescriptionIndex]}
                  onValueChange={handleDescriptionLevelChange}
                  min={0}
                  max={4}
                  step={1}
                  className="w-full"
                />
                {/* Tick marks */}
                <div className="absolute top-4 left-0 right-0 flex justify-between px-1 pointer-events-none">
                  {DESCRIPTION_LEVEL_CONFIG.map((level, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "w-0.5 h-2 rounded-full transition-colors",
                        idx <= currentDescriptionIndex 
                          ? "bg-[var(--accent-primary)]" 
                          : "bg-border/50"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                {DESCRIPTION_LEVEL_CONFIG[currentDescriptionIndex]?.description || 'Standard descriptions'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Directive Modes - Frosted Cards (available when Director is ON) */}
      <div className={cn("space-y-3", isDirectorOff && "opacity-40 pointer-events-none")}>
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[var(--accent-secondary)]" />
          <h3 className="text-sm font-medium">Difficulty Mode</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {DIRECTIVE_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              disabled={isDirectorOff}
              className={cn(
                "director-mode-card p-3 rounded-xl border text-left transition-all",
                "backdrop-blur-md",
                directorSettings.mode === mode.id 
                  ? `${mode.colorClass} active` 
                  : "border-border/30 bg-background/20 hover:bg-background/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{mode.icon}</span>
                <span className="font-medium text-sm">{mode.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tightness Slider (only when Raw is OFF) */}
      <div className={cn("space-y-3", isAdvancedDisabled && "opacity-40 pointer-events-none")}>
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[var(--accent-secondary)]" />
          <h3 className="text-sm font-medium">Narrative Tightness</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Player-led</span>
            <span className="text-foreground font-medium">
              {Math.round(directorSettings.tightness * 100)}%
            </span>
            <span>DM-led</span>
          </div>
          
          <Slider
            value={[directorSettings.tightness * 100]}
            onValueChange={handleTightnessChange}
            min={0}
            max={100}
            step={5}
            disabled={isAdvancedDisabled}
            className="w-full"
          />
          
          <p className="text-[10px] text-muted-foreground text-center">
            {directorSettings.tightness < 0.3 
              ? "Sandbox mode - you lead the story"
              : directorSettings.tightness < 0.6
                ? "Balanced - shared storytelling"
                : directorSettings.tightness < 0.85
                  ? "Director's cut - DM guides pacing"
                  : "Full control - DM drives momentum"}
          </p>
        </div>
      </div>
      
      {/* Director Types (only when Raw is OFF) */}
      <div className={cn("space-y-3", isAdvancedDisabled && "opacity-40 pointer-events-none")}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--accent-secondary)]" />
          <h3 className="text-sm font-medium">Director Type</h3>
        </div>
        
        <div className="space-y-2">
          {Object.entries(DIRECTOR_TYPE_CATEGORIES).map(([categoryId, category]) => {
            const types = getDirectorTypesByCategory(categoryId as keyof typeof DIRECTOR_TYPE_CATEGORIES);
            const isExpanded = expandedCategory === categoryId;
            const hasActiveType = types.includes(directorSettings.directorType);
            
            return (
              <Collapsible 
                key={categoryId}
                open={isExpanded}
                onOpenChange={(open) => setExpandedCategory(open ? categoryId : null)}
              >
                <CollapsibleTrigger
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg",
                    "border border-border/30 bg-background/20 hover:bg-background/30",
                    "transition-all",
                    hasActiveType && "border-[var(--accent-primary)]/50 bg-[var(--accent-bg)]/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                    {hasActiveType && (
                      <span className="text-xs text-[var(--accent-primary)]">
                        • {DIRECTOR_TYPES[directorSettings.directorType].name}
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2 space-y-1 pl-2">
                  {types.map((typeId) => {
                    const type = DIRECTOR_TYPES[typeId];
                    return (
                      <button
                        key={typeId}
                        onClick={() => handleTypeChange(typeId)}
                        className={cn(
                          "w-full p-2 rounded-lg text-left transition-all",
                          "border border-border/20",
                          directorSettings.directorType === typeId
                            ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                            : "bg-background/10 hover:bg-background/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{type.name}</span>
                          <div className="flex gap-1">
                            {type.tags.slice(0, 2).map((tag) => (
                              <span 
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-background/30 text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {type.description}
                        </p>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
      
      {/* Personality Toggles */}
      <div className={cn("space-y-3", isAdvancedDisabled && "opacity-40 pointer-events-none")}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
          <h3 className="text-sm font-medium">Personality</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Cruelty */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Skull className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs">Cruelty</span>
            </div>
            <div className="flex flex-col gap-1">
              {(['soft', 'honest', 'brutal'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdate({ ...directorSettings, cruelty: level })}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded border transition-all capitalize",
                    directorSettings.cruelty === level
                      ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                      : "border-border/30 hover:border-border/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          {/* Weirdness */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs">Weirdness</span>
            </div>
            <div className="flex flex-col gap-1">
              {(['grounded', 'spicy', 'unhinged'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdate({ ...directorSettings, weirdness: level })}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded border transition-all capitalize",
                    directorSettings.weirdness === level
                      ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                      : "border-border/30 hover:border-border/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          {/* Guidance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs">Guidance</span>
            </div>
            <div className="flex flex-col gap-1">
              {(['none', 'light', 'coach'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdate({ ...directorSettings, guidance: level })}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded border transition-all capitalize",
                    directorSettings.guidance === level
                      ? "border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]"
                      : "border-border/30 hover:border-border/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Allow Mid-Campaign Swap */}
      <div className={cn(isAdvancedDisabled && "opacity-40 pointer-events-none")}>
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-medium">Allow Mid-Campaign Swap</span>
            <p className="text-xs text-muted-foreground">
              Change mode during active campaign (with smoothing)
            </p>
          </div>
          <Switch 
            checked={directorSettings.allowMidCampaignSwap}
            disabled={isAdvancedDisabled}
            onCheckedChange={(checked) => onUpdate({ 
              ...directorSettings, 
              allowMidCampaignSwap: checked 
            })}
          />
        </div>
      </div>
      
      {/* Knobs Preview */}
      <div className="space-y-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Current Knobs</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <KnobBar label="World Push" value={currentKnobs.worldPush} />
          <KnobBar label="Time Pressure" value={currentKnobs.timePressure} />
          <KnobBar label="Consequences" value={currentKnobs.consequenceSeverity} />
          <KnobBar label="Scarcity" value={currentKnobs.resourceScarcity} />
          <KnobBar label="UI Hints" value={currentKnobs.uiHinting} />
          <KnobBar label="Fail Forward" value={currentKnobs.failForwardStrength} />
          <KnobBar label="Invention" value={currentKnobs.inventionBudget} />
        </div>
      </div>
    </div>
  );
};

// Mini progress bar for knob visualization
const KnobBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-0.5">
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="h-1 bg-background/30 rounded-full overflow-hidden">
      <div 
        className="h-full bg-[var(--accent-primary)]/60 rounded-full transition-all"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

export default DirectorSettingsTab;
