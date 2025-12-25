import { useMemo } from 'react';
import { Modifier, ModifierState } from '@/game/buffDebuffSystem';
import { Shield, Zap, Heart, Brain, Thermometer, Dumbbell, Pill, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModifierDisplayProps {
  modifierState: ModifierState;
  compact?: boolean;
}

// Get icon based on modifier category
function getCategoryIcon(category: Modifier['category']) {
  switch (category) {
    case 'injury': return Heart;
    case 'fatigue': return Zap;
    case 'nutrition': return Activity;
    case 'morale': return Brain;
    case 'environment': return Thermometer;
    case 'training': return Dumbbell;
    case 'illness': return Pill;
    case 'chemical': return Pill;
    case 'psychological': return Brain;
    case 'routine': return Activity;
    default: return Shield;
  }
}

// Get color class based on modifier type and severity
function getModifierColorClass(modifier: Modifier): string {
  if (modifier.type === 'buff') {
    return 'text-modifier-buff bg-modifier-buff/10 border-modifier-buff/30';
  }
  
  // Debuffs - color by severity
  if (modifier.severity >= 0.7) {
    return 'text-modifier-critical bg-modifier-critical/10 border-modifier-critical/30';
  } else if (modifier.category === 'injury' || modifier.severity >= 0.4) {
    return 'text-modifier-injury bg-modifier-injury/10 border-modifier-injury/30';
  }
  
  return 'text-modifier-neutral bg-modifier-neutral/10 border-modifier-neutral/30';
}

// Get inline color for narrative display
export function getModifierInlineColor(modifier: Modifier): string {
  if (modifier.type === 'buff') {
    return 'hsl(var(--modifier-buff))';
  }
  if (modifier.severity >= 0.7) {
    return 'hsl(var(--modifier-critical))';
  }
  if (modifier.category === 'injury' || modifier.severity >= 0.4) {
    return 'hsl(var(--modifier-injury))';
  }
  return 'hsl(var(--modifier-neutral))';
}

// Format remaining duration
function formatDuration(remaining: number): string {
  if (remaining < 1) {
    return `${Math.round(remaining * 60)}m`;
  }
  if (remaining < 24) {
    return `${Math.round(remaining)}h`;
  }
  return `${Math.round(remaining / 24)}d`;
}

// Severity bar component
function SeverityBar({ severity, colorClass }: { severity: number; colorClass: string }) {
  return (
    <div className="h-1 w-full bg-background/50 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all", colorClass.split(' ')[0].replace('text-', 'bg-'))}
        style={{ width: `${severity * 100}%` }}
      />
    </div>
  );
}

// Individual modifier tag
function ModifierTag({ modifier, compact }: { modifier: Modifier; compact?: boolean }) {
  const Icon = getCategoryIcon(modifier.category);
  const colorClass = getModifierColorClass(modifier);
  
  if (compact) {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
          colorClass
        )}
        title={`${modifier.name}: ${modifier.description}`}
      >
        <Icon className="w-3 h-3" />
        <span className="font-medium">{modifier.name}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-1 p-2 rounded-lg border",
      colorClass
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          <span className="font-medium text-xs">{modifier.name}</span>
        </div>
        <span className="text-[10px] opacity-70">
          {formatDuration(modifier.duration.remaining)}
        </span>
      </div>
      <SeverityBar severity={modifier.severity} colorClass={colorClass} />
      <p className="text-[10px] opacity-70 leading-tight line-clamp-2">
        {modifier.description}
      </p>
    </div>
  );
}

export function ModifierDisplay({ modifierState, compact = false }: ModifierDisplayProps) {
  const { buffs, debuffs } = useMemo(() => {
    const active = modifierState.activeModifiers.filter(m => m.visibility !== 'hidden');
    return {
      buffs: active.filter(m => m.type === 'buff'),
      debuffs: active.filter(m => m.type === 'debuff')
    };
  }, [modifierState.activeModifiers]);

  if (buffs.length === 0 && debuffs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic text-center py-2">
        No active effects
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {buffs.map(m => <ModifierTag key={m.id} modifier={m} compact />)}
        {debuffs.map(m => <ModifierTag key={m.id} modifier={m} compact />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {buffs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-modifier-buff uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Active Buffs
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {buffs.map(m => <ModifierTag key={m.id} modifier={m} />)}
          </div>
        </div>
      )}
      
      {debuffs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-modifier-injury uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Active Debuffs
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {debuffs.map(m => <ModifierTag key={m.id} modifier={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// Calculate effective stats considering modifiers
export function calculateEffectiveStats(
  baseStats: Record<string, number>,
  modifiers: Modifier[]
): { stats: Record<string, number>; changes: Record<string, number> } {
  const stats = { ...baseStats };
  const changes: Record<string, number> = {};
  
  for (const modifier of modifiers) {
    for (const effect of modifier.effects) {
      const statKey = effect.stat.toLowerCase();
      
      // Map modifier stat names to character stat names
      const statMap: Record<string, string> = {
        'strength': 'strength',
        'dexterity': 'dexterity',
        'agility': 'dexterity',
        'constitution': 'constitution',
        'endurance': 'constitution',
        'intelligence': 'intelligence',
        'wisdom': 'wisdom',
        'perception': 'wisdom',
        'charisma': 'charisma',
      };
      
      const mappedStat = statMap[statKey];
      if (mappedStat && stats[mappedStat] !== undefined) {
        const change = Math.round(effect.value * 10 * modifier.severity);
        stats[mappedStat] = Math.max(1, stats[mappedStat] + change);
        changes[mappedStat] = (changes[mappedStat] || 0) + change;
      }
    }
  }
  
  return { stats, changes };
}
