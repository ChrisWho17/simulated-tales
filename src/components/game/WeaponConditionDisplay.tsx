/**
 * Weapon Condition Display - Visual condition indicator with rust/damage effects
 * Simple overview mode by default, expandable for gun enthusiasts
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  WeaponWearSystem, 
  Weapon, 
  ConditionThreshold 
} from '@/game/weaponWearSystem';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Zap, 
  Sparkles, 
  Skull,
  Shield,
  Wrench
} from 'lucide-react';

interface WeaponConditionDisplayProps {
  weapon: Weapon;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showWarnings?: boolean;
  className?: string;
}

// Condition colors using semantic tokens
const CONDITION_COLORS: Record<ConditionThreshold, { bg: string; text: string; glow: string }> = {
  PRISTINE: { 
    bg: 'bg-emerald-500/20', 
    text: 'text-emerald-400', 
    glow: 'shadow-emerald-500/30' 
  },
  GOOD: { 
    bg: 'bg-green-500/20', 
    text: 'text-green-400', 
    glow: 'shadow-green-500/20' 
  },
  WORN: { 
    bg: 'bg-yellow-500/20', 
    text: 'text-yellow-400', 
    glow: 'shadow-yellow-500/20' 
  },
  POOR: { 
    bg: 'bg-orange-500/20', 
    text: 'text-orange-400', 
    glow: 'shadow-orange-500/20' 
  },
  FAILING: { 
    bg: 'bg-red-500/20', 
    text: 'text-red-400', 
    glow: 'shadow-red-500/30' 
  },
  DESTROYED: { 
    bg: 'bg-destructive/20', 
    text: 'text-destructive', 
    glow: 'shadow-destructive/30' 
  },
};

const CONDITION_LABELS: Record<ConditionThreshold, string> = {
  PRISTINE: 'Pristine',
  GOOD: 'Good',
  WORN: 'Worn',
  POOR: 'Poor',
  FAILING: 'Failing',
  DESTROYED: 'Destroyed',
};

const CONDITION_ICONS: Record<ConditionThreshold, typeof Shield> = {
  PRISTINE: Sparkles,
  GOOD: Shield,
  WORN: Wrench,
  POOR: AlertTriangle,
  FAILING: Zap,
  DESTROYED: Skull,
};

export function WeaponConditionDisplay({
  weapon,
  size = 'md',
  showLabel = true,
  showWarnings = true,
  className,
}: WeaponConditionDisplayProps) {
  const visualState = useMemo(() => WeaponWearSystem.getVisualState(weapon), [weapon]);
  const threshold = useMemo(() => WeaponWearSystem.getConditionLabel(weapon.condition), [weapon.condition]);
  const colors = CONDITION_COLORS[threshold];
  const Icon = CONDITION_ICONS[threshold];
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };
  
  return (
    <div className={cn('space-y-1', className)}>
      {/* Header with label and percentage */}
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Icon className={cn('h-3.5 w-3.5', colors.text)} />
            <span className={cn('font-medium', colors.text)}>
              {CONDITION_LABELS[threshold]}
            </span>
          </div>
          <span className="text-muted-foreground tabular-nums">
            {Math.round(weapon.condition)}%
          </span>
        </div>
      )}
      
      {/* Condition bar with rust overlay effect */}
      <div className="relative">
        <Progress 
          value={weapon.condition} 
          className={cn(sizeClasses[size], 'bg-muted/50')}
        />
        
        {/* Rust/damage overlay */}
        {visualState.rustLevel > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, 
                transparent ${100 - visualState.rustLevel * 100}%, 
                rgba(139, 115, 85, ${visualState.rustLevel * 0.4}) 100%
              )`,
              borderRadius: 'inherit',
            }}
          />
        )}
        
        {/* Damage texture overlay */}
        {visualState.damageLevel > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, ${visualState.damageLevel * 0.3}) 2px,
                rgba(0, 0, 0, ${visualState.damageLevel * 0.3}) 4px
              )`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </div>
      
      {/* Warnings */}
      {showWarnings && (
        <div className="flex flex-wrap gap-1">
          {visualState.emitSparks && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/50 text-orange-400">
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              Sparking
            </Badge>
          )}
          {visualState.emitSmoke && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-400">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              Smoking
            </Badge>
          )}
          {weapon.destroyed && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              <Skull className="h-2.5 w-2.5 mr-0.5" />
              Destroyed
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// ============= COMPACT INLINE VERSION =============

interface WeaponConditionBadgeProps {
  condition: number;
  destroyed?: boolean;
  className?: string;
}

export function WeaponConditionBadge({ 
  condition, 
  destroyed = false,
  className 
}: WeaponConditionBadgeProps) {
  const threshold = WeaponWearSystem.getConditionLabel(condition);
  const colors = CONDITION_COLORS[threshold];
  const Icon = CONDITION_ICONS[threshold];
  
  if (destroyed) {
    return (
      <Badge variant="destructive" className={cn('text-[10px] px-1.5', className)}>
        <Skull className="h-3 w-3 mr-0.5" />
        Destroyed
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-[10px] px-1.5',
        colors.bg,
        colors.text,
        'border-current/30',
        className
      )}
    >
      <Icon className="h-3 w-3 mr-0.5" />
      {Math.round(condition)}%
    </Badge>
  );
}

export default WeaponConditionDisplay;
