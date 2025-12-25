import { useState, useMemo } from 'react';
import { Modifier, ModifierState, MODIFIER_LIMITS } from '@/game/buffDebuffSystem';
import { Shield, Zap, Heart, Brain, Thermometer, Dumbbell, Pill, Activity, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModifierDetailModal } from './ModifierDetailModal';

interface ModifierDisplayProps {
  modifierState: ModifierState;
  compact?: boolean;
  onJumpToMessage?: (messageId: string, turnId: number) => void;
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
    case 'phobia': return Eye;
    case 'routine': return Activity;
    default: return Shield;
  }
}

// Get color class based on modifier type and severity
function getModifierColorClass(modifier: Modifier): string {
  // Phobias are always neutral - they only affect behavior
  if (modifier.category === 'phobia') {
    return 'text-modifier-neutral bg-modifier-neutral/10 border-modifier-neutral/30';
  }
  
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
  if (modifier.category === 'phobia') {
    return 'hsl(var(--modifier-neutral))';
  }
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
  if (remaining === Infinity) return '∞';
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

// Individual modifier tag (clickable)
function ModifierTag({ 
  modifier, 
  compact,
  onClick 
}: { 
  modifier: Modifier; 
  compact?: boolean;
  onClick: () => void;
}) {
  const Icon = getCategoryIcon(modifier.category);
  const colorClass = getModifierColorClass(modifier);
  
  if (compact) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border cursor-pointer",
          "hover:scale-105 hover:shadow-md transition-all",
          colorClass
        )}
        title={`Click for details: ${modifier.name}`}
      >
        <Icon className="w-3 h-3" />
        <span className="font-medium">{modifier.name}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-2 rounded-lg border text-left w-full cursor-pointer",
        "hover:scale-[1.02] hover:shadow-md transition-all",
        colorClass
      )}
    >
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
    </button>
  );
}

export function ModifierDisplay({ modifierState, compact = false, onJumpToMessage }: ModifierDisplayProps) {
  const [selectedModifier, setSelectedModifier] = useState<Modifier | null>(null);

  const { buffs, debuffs, phobias, limitInfo } = useMemo(() => {
    const active = modifierState.activeModifiers.filter(m => m.visibility !== 'hidden');
    const phobiaList = active.filter(m => m.category === 'phobia');
    const nonPhobias = active.filter(m => m.category !== 'phobia');
    
    return {
      buffs: nonPhobias.filter(m => m.type === 'buff'),
      debuffs: nonPhobias.filter(m => m.type === 'debuff'),
      phobias: phobiaList,
      limitInfo: {
        total: modifierState.activeModifiers.length,
        maxTotal: MODIFIER_LIMITS.MAX_TOTAL_MODIFIERS,
      }
    };
  }, [modifierState.activeModifiers]);

  if (buffs.length === 0 && debuffs.length === 0 && phobias.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic text-center py-2">
        No active effects
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {buffs.map(m => (
            <ModifierTag 
              key={m.id} 
              modifier={m} 
              compact 
              onClick={() => setSelectedModifier(m)}
            />
          ))}
          {debuffs.map(m => (
            <ModifierTag 
              key={m.id} 
              modifier={m} 
              compact 
              onClick={() => setSelectedModifier(m)}
            />
          ))}
        </div>
        {selectedModifier && (
          <ModifierDetailModal 
            modifier={selectedModifier} 
            onClose={() => setSelectedModifier(null)}
            onJumpToMessage={onJumpToMessage}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Capacity indicator */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Conditions: {limitInfo.total}/{limitInfo.maxTotal}</span>
          <span className="italic">Click any effect for details</span>
        </div>
        
        {buffs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-modifier-buff uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Buffs ({buffs.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {buffs.map(m => (
                <ModifierTag 
                  key={m.id} 
                  modifier={m} 
                  onClick={() => setSelectedModifier(m)}
                />
              ))}
            </div>
          </div>
        )}
        
        {debuffs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-modifier-injury uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              Debuffs ({debuffs.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {debuffs.map(m => (
                <ModifierTag 
                  key={m.id} 
                  modifier={m} 
                  onClick={() => setSelectedModifier(m)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Phobias - separate section, behavioral only */}
        {phobias.length > 0 && (
          <div className="space-y-2 border-t border-border/30 pt-3">
            <h4 className="text-xs font-semibold text-modifier-neutral uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Phobias (Behavioral)
            </h4>
            <p className="text-[10px] text-muted-foreground italic">
              Affects speech and reactions only, not stats
            </p>
            <div className="flex flex-wrap gap-1.5">
              {phobias.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModifier(m)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border cursor-pointer hover:scale-105 hover:shadow-md transition-all text-modifier-neutral bg-modifier-neutral/10 border-modifier-neutral/30"
                >
                  <Eye className="w-3 h-3" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedModifier && (
        <ModifierDetailModal 
          modifier={selectedModifier} 
          onClose={() => setSelectedModifier(null)}
          onJumpToMessage={onJumpToMessage}
        />
      )}
    </>
  );
}

// Calculate effective stats considering modifiers (phobias excluded from stat calculation)
export function calculateEffectiveStats(
  baseStats: Record<string, number>,
  modifiers: Modifier[]
): { stats: Record<string, number>; changes: Record<string, number> } {
  const stats = { ...baseStats };
  const changes: Record<string, number> = {};
  
  // Filter out phobias - they don't affect stats
  const statModifiers = modifiers.filter(m => m.category !== 'phobia');
  
  for (const modifier of statModifiers) {
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