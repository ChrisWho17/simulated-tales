import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Wand2, Shield, Check } from 'lucide-react';
import { GameGenre } from '@/types/genreData';
import { getBlendedClasses } from '@/game/genreBlendSystem';
import { SecondaryGenre } from './AdventureCreator';
import { SPECIAL_STATS, SPECIAL_ABBR, type SpecialStat } from '@/types/rpgCharacter';

interface CustomClassBuilderProps {
  genre: GameGenre;
  secondaryGenres: SecondaryGenre[];
  onComplete: (customClass: CustomClassData) => void;
  onCancel: () => void;
}

export interface CustomClassData {
  id: string;
  name: string;
  description: string;
  abilities: string[];
  statBonuses: Record<SpecialStat, number>;
  sourceClasses: string[];
}

const MAX_ABILITIES = 5;
const MAX_STAT_POINTS = 6;

function emptySpecialBonuses(): Record<SpecialStat, number> {
  return Object.fromEntries(SPECIAL_STATS.map(stat => [stat, 0])) as Record<SpecialStat, number>;
}

export function CustomClassBuilder({ genre, secondaryGenres, onComplete, onCancel }: CustomClassBuilderProps) {
  const allClasses = useMemo(() => getBlendedClasses(genre, secondaryGenres), [genre, secondaryGenres]);

  const allAbilities = useMemo(() => {
    const abilityMap = new Map<string, { ability: string; fromClass: string; classIcon: string }>();
    allClasses.forEach(cls => {
      cls.abilities.forEach(ability => {
        if (!abilityMap.has(ability)) {
          abilityMap.set(ability, { ability, fromClass: cls.name, classIcon: cls.id });
        }
      });
    });
    return Array.from(abilityMap.values());
  }, [allClasses]);

  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [statBonuses, setStatBonuses] = useState<Record<SpecialStat, number>>(emptySpecialBonuses);

  const totalStatPoints = Object.values(statBonuses).reduce((a, b) => a + b, 0);
  const remainingStatPoints = MAX_STAT_POINTS - totalStatPoints;

  const toggleAbility = (ability: string) => {
    if (selectedAbilities.includes(ability)) {
      setSelectedAbilities(prev => prev.filter(a => a !== ability));
    } else if (selectedAbilities.length < MAX_ABILITIES) {
      setSelectedAbilities(prev => [...prev, ability]);
    }
  };

  const adjustStat = (stat: SpecialStat, delta: number) => {
    const current = statBonuses[stat] || 0;
    const newValue = current + delta;
    if (newValue < 0 || newValue > 3) return;
    if (delta > 0 && remainingStatPoints <= 0) return;
    setStatBonuses(prev => ({ ...prev, [stat]: newValue }));
  };

  const sourceClasses = useMemo(() => {
    const sources = new Set<string>();
    selectedAbilities.forEach(ability => {
      const source = allAbilities.find(a => a.ability === ability);
      if (source) sources.add(source.fromClass);
    });
    return Array.from(sources);
  }, [selectedAbilities, allAbilities]);

  const canComplete = customName.trim().length >= 2 && selectedAbilities.length >= 2;

  const handleComplete = () => {
    onComplete({
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      description: customDescription.trim() || `A unique hybrid combining ${sourceClasses.join(' and ')} techniques.`,
      abilities: selectedAbilities,
      statBonuses,
      sourceClasses,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Custom Class Builder</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>

      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Create a hybrid role with up to {MAX_ABILITIES} abilities and {MAX_STAT_POINTS} mandatory SPECIAL bonus points.
          These bonuses are added after the character's base SPECIAL allocation and never consume base points.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Class Name</label>
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="e.g., Spell Blade, Tech Shaman, Shadow Priest..."
          className="bg-background border-border/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description (optional)</label>
        <Input
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="Describe your hybrid class..."
          className="bg-background border-border/50"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">SPECIAL Bonuses</label>
          <span className="text-xs text-muted-foreground">{remainingStatPoints} points remaining</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SPECIAL_STATS.map(stat => {
            const value = statBonuses[stat];
            return (
              <div
                key={stat}
                className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/30 min-w-0"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{SPECIAL_ABBR[stat]}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustStat(stat, -1)}
                    disabled={value <= 0}
                    className="w-5 h-5 rounded bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-30 text-xs"
                  >-</button>
                  <span className={`w-5 text-center text-sm font-medium ${value > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {value > 0 ? `+${value}` : '0'}
                  </span>
                  <button
                    onClick={() => adjustStat(stat, 1)}
                    disabled={remainingStatPoints <= 0 || value >= 3}
                    className="w-5 h-5 rounded bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-30 text-xs"
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-sm font-medium text-foreground">Select Abilities ({selectedAbilities.length}/{MAX_ABILITIES})</label>
          {sourceClasses.length > 0 && (
            <span className="text-xs text-accent">Hybrid of: {sourceClasses.join(', ')}</span>
          )}
        </div>

        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {allClasses.map(cls => (
              <div key={cls.id} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider pt-2">
                  <Shield className="w-3 h-3" />
                  {cls.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cls.abilities.map(ability => {
                    const isSelected = selectedAbilities.includes(ability);
                    const isDisabled = !isSelected && selectedAbilities.length >= MAX_ABILITIES;
                    return (
                      <button
                        key={`${cls.id}-${ability}`}
                        onClick={() => toggleAbility(ability)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : isDisabled
                              ? 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                              : 'bg-background/50 border border-border/30 hover:border-primary/50 text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {ability}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {selectedAbilities.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Selected Abilities:</p>
          <div className="flex flex-wrap gap-1">
            {selectedAbilities.map(ability => (
              <Badge
                key={ability}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleAbility(ability)}
              >
                {ability}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleComplete} disabled={!canComplete} className="w-full gap-2">
        <Sparkles className="w-4 h-4" />
        Create {customName || 'Custom Class'}
      </Button>

      {!canComplete && (
        <p className="text-xs text-center text-muted-foreground">
          {customName.trim().length < 2
            ? 'Enter a class name (2+ characters)'
            : 'Select at least 2 abilities'}
        </p>
      )}
    </div>
  );
}
