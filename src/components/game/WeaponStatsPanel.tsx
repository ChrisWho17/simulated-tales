/**
 * Weapon Stats Panel - MW3-style comprehensive weapon statistics display
 * Shows all stat categories with modifiers from attachments
 * Color coding: White = neutral, Green = increase, Red = decrease
 */

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crosshair,
  Target,
  Zap,
  Volume2,
  Timer,
  Gauge,
  Shield,
  Move,
  Hand,
  Flame,
  Wind,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  WeaponStatsProfile,
  getStatDisplayValue,
  getStatBarPercent,
} from '@/game/weaponStatsDatabase';
import { WeaponAttachment, AttachmentModifiers } from '@/game/weaponAttachmentSystem';

// ============= TYPES =============

interface StatRowProps {
  label: string;
  value: number;
  displayValue: string;
  barPercent: number;
  modifier?: number;
  modifierPercent?: number;
  inverted?: boolean;
  tooltip?: string;
}

interface StatCategoryProps {
  title: string;
  icon: typeof Crosshair;
  stats: StatRowProps[];
  defaultOpen?: boolean;
}

interface WeaponStatsPanelProps {
  weapon: WeaponStatsProfile;
  attachments?: Record<string, WeaponAttachment>;
  compact?: boolean;
}

// ============= STAT ROW COMPONENT =============

function StatBar({ 
  percent, 
  modifier = 0,
  inverted = false,
}: { 
  percent: number; 
  modifier?: number;
  inverted?: boolean;
}) {
  // For inverted stats (recoil, spread), positive modifier is bad
  const isPositive = inverted ? modifier < 0 : modifier > 0;
  const isNegative = inverted ? modifier > 0 : modifier < 0;
  
  return (
    <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden flex-1">
      {/* Base bar */}
      <div 
        className="absolute inset-y-0 left-0 bg-foreground/70 rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
      
      {/* Modifier overlay */}
      {modifier !== 0 && (
        <div 
          className={cn(
            "absolute inset-y-0 rounded-full transition-all duration-300",
            isPositive ? "bg-emerald-500/60" : "bg-red-500/60"
          )}
          style={{ 
            left: isPositive ? `${percent}%` : `${Math.max(0, percent + modifier)}%`,
            width: `${Math.abs(modifier)}%`,
          }}
        />
      )}
    </div>
  );
}

function StatRow({ 
  label, 
  value, 
  displayValue, 
  barPercent, 
  modifier = 0, 
  modifierPercent = 0,
  inverted = false,
  tooltip,
}: StatRowProps) {
  // Determine modifier display
  const hasModifier = modifier !== 0;
  const isPositive = inverted ? modifier < 0 : modifier > 0;
  const isNegative = inverted ? modifier > 0 : modifier < 0;
  
  const modifierColor = hasModifier 
    ? isPositive ? 'text-emerald-400' : 'text-red-400'
    : 'text-foreground';
  
  const ModifierIcon = hasModifier 
    ? isPositive ? ArrowUpRight : ArrowDownRight
    : Minus;
  
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground truncate cursor-help">
                  {label}
                </span>
              </TooltipTrigger>
              {tooltip && (
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-xs font-mono tabular-nums',
              modifierColor
            )}>
              {displayValue}
            </span>
            
            {hasModifier && (
              <span className={cn(
                'text-[10px] font-mono tabular-nums flex items-center',
                modifierColor
              )}>
                <ModifierIcon className="h-2.5 w-2.5" />
                {Math.abs(modifierPercent).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        
        <StatBar 
          percent={barPercent} 
          modifier={modifierPercent} 
          inverted={inverted}
        />
      </div>
    </div>
  );
}

// ============= STAT CATEGORY COMPONENT =============

function StatCategory({ 
  title, 
  icon: Icon, 
  stats,
  defaultOpen = true,
}: StatCategoryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Calculate category average for header
  const avgPercent = stats.length > 0 
    ? stats.reduce((sum, s) => sum + s.barPercent, 0) / stats.length 
    : 0;
  
  // Check if any stat has modifier
  const hasModifiers = stats.some(s => s.modifier !== 0);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/30 transition-colors group">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
          {hasModifiers && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/50 text-primary">
              MOD
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Category indicator bar */}
          <div className="w-16 h-1 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground/60 rounded-full"
              style={{ width: `${avgPercent}%` }}
            />
          </div>
          
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-2 pb-2">
        <div className="space-y-0.5 pt-1">
          {stats.map((stat, idx) => (
            <StatRow key={idx} {...stat} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============= MAIN COMPONENT =============

export function WeaponStatsPanel({ 
  weapon, 
  attachments = {},
  compact = false,
}: WeaponStatsPanelProps) {
  // Calculate total modifiers from all attachments
  const totalModifiers = useMemo(() => {
    const mods: AttachmentModifiers = {
      accuracy: 0,
      recoil: 0,
      ergonomics: 0,
      noise: 0,
      aimSpeed: 0,
      magCapacity: 0,
      muzzleVelocity: 0,
      weight: 0,
      hipfireSpread: 0,
    };
    
    for (const attachment of Object.values(attachments)) {
      if (attachment?.modifiers) {
        for (const [key, value] of Object.entries(attachment.modifiers)) {
          if (typeof value === 'number') {
            mods[key as keyof AttachmentModifiers] = 
              (mods[key as keyof AttachmentModifiers] || 0) + value;
          }
        }
      }
    }
    
    return mods;
  }, [attachments]);
  
  // Build stat categories
  const damageStats: StatRowProps[] = [
    {
      label: 'Headshot Damage',
      value: weapon.damage.headshotDamage,
      displayValue: `${weapon.damage.headshotDamage}`,
      barPercent: getStatBarPercent(weapon.damage.headshotDamage, 0, 200),
      tooltip: 'Damage dealt on headshots',
    },
    {
      label: 'Upper Torso Damage',
      value: weapon.damage.upperTorsoDamage,
      displayValue: `${weapon.damage.upperTorsoDamage}`,
      barPercent: getStatBarPercent(weapon.damage.upperTorsoDamage, 0, 150),
      tooltip: 'Damage dealt to upper chest',
    },
    {
      label: 'Lower Torso Damage',
      value: weapon.damage.lowerTorsoDamage,
      displayValue: `${weapon.damage.lowerTorsoDamage}`,
      barPercent: getStatBarPercent(weapon.damage.lowerTorsoDamage, 0, 130),
      tooltip: 'Damage dealt to stomach/lower body',
    },
    {
      label: 'Target Flinch',
      value: weapon.damage.targetFlinch,
      displayValue: `${weapon.damage.targetFlinch.toFixed(1)} N`,
      barPercent: getStatBarPercent(weapon.damage.targetFlinch, 0, 5),
      tooltip: 'How much targets flinch when hit',
    },
  ];
  
  const rangeStats: StatRowProps[] = [
    {
      label: 'Effective Damage Range',
      value: weapon.range.effectiveRange,
      displayValue: `${weapon.range.effectiveRange} m`,
      barPercent: getStatBarPercent(weapon.range.effectiveRange, 0, 200),
      modifier: totalModifiers.accuracy ? totalModifiers.accuracy * 0.5 : 0,
      modifierPercent: totalModifiers.accuracy ? totalModifiers.accuracy * 0.5 : 0,
      tooltip: 'Range before damage drop-off begins',
    },
    {
      label: 'Minimum Damage Range',
      value: weapon.range.minimumDamageRange,
      displayValue: `${weapon.range.minimumDamageRange} m`,
      barPercent: getStatBarPercent(weapon.range.minimumDamageRange, 0, 250),
      tooltip: 'Range where damage stops dropping',
    },
    {
      label: 'Bullet Velocity',
      value: weapon.range.bulletVelocity,
      displayValue: `${weapon.range.bulletVelocity} m/s`,
      barPercent: getStatBarPercent(weapon.range.bulletVelocity, 0, 1200),
      modifier: totalModifiers.muzzleVelocity || 0,
      modifierPercent: totalModifiers.muzzleVelocity || 0,
      tooltip: 'Speed of the projectile',
    },
  ];
  
  const fireRateStats: StatRowProps[] = [
    {
      label: 'Rate of Fire',
      value: weapon.fireRate.rateOfFire,
      displayValue: `${weapon.fireRate.rateOfFire} rpm`,
      barPercent: getStatBarPercent(weapon.fireRate.rateOfFire, 0, 1200),
      tooltip: 'Rounds per minute in full auto',
    },
  ];
  
  const accuracyStats: StatRowProps[] = [
    {
      label: 'Hipfire Spread Min',
      value: weapon.accuracy.hipfireSpreadMin,
      displayValue: `${weapon.accuracy.hipfireSpreadMin.toFixed(1)} °/s`,
      barPercent: getStatBarPercent(weapon.accuracy.hipfireSpreadMin, 15, 0),
      modifier: totalModifiers.hipfireSpread ? -totalModifiers.hipfireSpread * 0.1 : 0,
      modifierPercent: totalModifiers.hipfireSpread || 0,
      inverted: true,
      tooltip: 'Minimum hipfire spread (standing still)',
    },
    {
      label: 'Hipfire Spread Max',
      value: weapon.accuracy.hipfireSpreadMax,
      displayValue: `${weapon.accuracy.hipfireSpreadMax.toFixed(1)} °/s`,
      barPercent: getStatBarPercent(weapon.accuracy.hipfireSpreadMax, 30, 0),
      inverted: true,
      tooltip: 'Maximum hipfire spread',
    },
    {
      label: 'Flinch Resistance',
      value: weapon.accuracy.flinchResistance,
      displayValue: `${weapon.accuracy.flinchResistance.toFixed(2)} N`,
      barPercent: getStatBarPercent(weapon.accuracy.flinchResistance, 0, 1),
      tooltip: 'Resistance to aim flinch when hit',
    },
    {
      label: 'Tactical Stance Spread',
      value: weapon.accuracy.tacticalStanceSpread,
      displayValue: `${weapon.accuracy.tacticalStanceSpread.toFixed(1)} °/s`,
      barPercent: getStatBarPercent(weapon.accuracy.tacticalStanceSpread, 15, 0),
      inverted: true,
      tooltip: 'Spread when in tactical stance',
    },
  ];
  
  const recoilStats: StatRowProps[] = [
    {
      label: 'Recoil Gun Kick',
      value: weapon.recoil.gunKick,
      displayValue: `${weapon.recoil.gunKick.toFixed(1)} °/s`,
      barPercent: getStatBarPercent(weapon.recoil.gunKick, 10, 0),
      modifier: totalModifiers.recoil ? totalModifiers.recoil * -0.1 : 0,
      modifierPercent: totalModifiers.recoil || 0,
      inverted: true,
      tooltip: 'Camera shake per shot',
    },
    {
      label: 'Horizontal Recoil',
      value: weapon.recoil.horizontalRecoil,
      displayValue: `${weapon.recoil.horizontalRecoil.toFixed(2)} °/s`,
      barPercent: getStatBarPercent(weapon.recoil.horizontalRecoil, 5, 0),
      modifier: totalModifiers.recoil ? totalModifiers.recoil * -0.05 : 0,
      modifierPercent: totalModifiers.recoil ? totalModifiers.recoil * 0.5 : 0,
      inverted: true,
      tooltip: 'Left/right recoil per shot',
    },
    {
      label: 'Vertical Recoil',
      value: weapon.recoil.verticalRecoil,
      displayValue: `${weapon.recoil.verticalRecoil.toFixed(2)} °/s`,
      barPercent: getStatBarPercent(weapon.recoil.verticalRecoil, 8, 0),
      modifier: totalModifiers.recoil ? totalModifiers.recoil * -0.05 : 0,
      modifierPercent: totalModifiers.recoil ? totalModifiers.recoil * 0.5 : 0,
      inverted: true,
      tooltip: 'Upward recoil per shot',
    },
  ];
  
  const mobilityStats: StatRowProps[] = [
    {
      label: 'Movement Speed',
      value: weapon.mobility.movementSpeed,
      displayValue: `${weapon.mobility.movementSpeed.toFixed(1)} m/s`,
      barPercent: getStatBarPercent(weapon.mobility.movementSpeed, 0, 6),
      modifier: totalModifiers.ergonomics ? totalModifiers.ergonomics * 0.02 : 0,
      modifierPercent: totalModifiers.ergonomics ? totalModifiers.ergonomics * 0.4 : 0,
      tooltip: 'Walking speed while equipped',
    },
    {
      label: 'Crouch Movement Speed',
      value: weapon.mobility.crouchMovementSpeed,
      displayValue: `${weapon.mobility.crouchMovementSpeed.toFixed(1)} m/s`,
      barPercent: getStatBarPercent(weapon.mobility.crouchMovementSpeed, 0, 3.5),
      tooltip: 'Movement speed while crouched',
    },
    {
      label: 'Sprint Speed',
      value: weapon.mobility.sprintSpeed,
      displayValue: `${weapon.mobility.sprintSpeed.toFixed(1)} m/s`,
      barPercent: getStatBarPercent(weapon.mobility.sprintSpeed, 0, 8),
      tooltip: 'Normal sprint speed',
    },
    {
      label: 'Tactical Sprint Speed',
      value: weapon.mobility.tacticalSprintSpeed,
      displayValue: `${weapon.mobility.tacticalSprintSpeed.toFixed(1)} m/s`,
      barPercent: getStatBarPercent(weapon.mobility.tacticalSprintSpeed, 0, 10),
      tooltip: 'Maximum sprint speed',
    },
    {
      label: 'ADS Movement Speed',
      value: weapon.mobility.adsMovementSpeed,
      displayValue: `${weapon.mobility.adsMovementSpeed.toFixed(1)} m/s`,
      barPercent: getStatBarPercent(weapon.mobility.adsMovementSpeed, 0, 4),
      tooltip: 'Movement speed while aiming down sights',
    },
  ];
  
  const handlingStats: StatRowProps[] = [
    {
      label: 'ADS Speed',
      value: weapon.handling.adsSpeed,
      displayValue: `${weapon.handling.adsSpeed} ms`,
      barPercent: getStatBarPercent(weapon.handling.adsSpeed, 500, 100),
      modifier: totalModifiers.aimSpeed ? totalModifiers.aimSpeed * -2 : 0,
      modifierPercent: totalModifiers.aimSpeed ? totalModifiers.aimSpeed : 0,
      inverted: true,
      tooltip: 'Time to aim down sights (lower is better)',
    },
    {
      label: 'Reload Quickness',
      value: weapon.handling.reloadQuickness,
      displayValue: `${weapon.handling.reloadQuickness.toFixed(1)} s`,
      barPercent: getStatBarPercent(weapon.handling.reloadQuickness, 6, 1),
      inverted: true,
      tooltip: 'Time to reload (lower is better)',
    },
    {
      label: 'Sprint to Fire Speed',
      value: weapon.handling.sprintToFireSpeed,
      displayValue: `${weapon.handling.sprintToFireSpeed} ms`,
      barPercent: getStatBarPercent(weapon.handling.sprintToFireSpeed, 500, 100),
      modifier: totalModifiers.ergonomics ? totalModifiers.ergonomics * -1 : 0,
      modifierPercent: totalModifiers.ergonomics ? totalModifiers.ergonomics * 0.5 : 0,
      inverted: true,
      tooltip: 'Time to fire after sprinting',
    },
    {
      label: 'Swap Speed',
      value: weapon.handling.swapSpeed,
      displayValue: `${weapon.handling.swapSpeed} ms`,
      barPercent: getStatBarPercent(weapon.handling.swapSpeed, 1500, 400),
      inverted: true,
      tooltip: 'Time to switch to this weapon',
    },
  ];
  
  if (compact) {
    // Compact view - just key stats
    return (
      <div className="space-y-1">
        <StatCategory
          title="DAMAGE"
          icon={Flame}
          stats={damageStats.slice(0, 2)}
          defaultOpen
        />
        <StatCategory
          title="HANDLING"
          icon={Hand}
          stats={handlingStats.slice(0, 2)}
          defaultOpen
        />
        <StatCategory
          title="MOBILITY"
          icon={Move}
          stats={mobilityStats.slice(0, 2)}
          defaultOpen
        />
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-1">
        {/* Weapon header */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 mb-3">
          <h3 className="text-lg font-bold tracking-tight">{weapon.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{weapon.description}</p>
          
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px]">
              {weapon.caliber}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {weapon.category.replace('_', ' ').toUpperCase()}
            </Badge>
            {weapon.manufacturer && (
              <Badge variant="secondary" className="text-[10px]">
                {weapon.manufacturer}
              </Badge>
            )}
          </div>
          
          {/* Pros/Cons */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
            <div>
              <span className="text-emerald-400 font-medium">+ Pros</span>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {weapon.pros.map((pro, i) => (
                  <li key={i}>• {pro}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-red-400 font-medium">- Cons</span>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {weapon.cons.map((con, i) => (
                  <li key={i}>• {con}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 px-2 py-1 text-[10px] text-muted-foreground border-b border-border/30 mb-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-foreground/70" />
            <span>Baseline</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Increase</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Decrease</span>
          </div>
        </div>
        
        {/* Stat categories */}
        <StatCategory title="DAMAGE" icon={Flame} stats={damageStats} />
        <Separator className="my-1 opacity-30" />
        
        <StatCategory title="RANGE" icon={Target} stats={rangeStats} />
        <Separator className="my-1 opacity-30" />
        
        <StatCategory title="FIRE RATE" icon={Zap} stats={fireRateStats} />
        <Separator className="my-1 opacity-30" />
        
        <StatCategory title="ACCURACY" icon={Crosshair} stats={accuracyStats} />
        <Separator className="my-1 opacity-30" />
        
        <StatCategory title="RECOIL CONTROL" icon={Gauge} stats={recoilStats} />
        <Separator className="my-1 opacity-30" />
        
        <StatCategory title="MOBILITY" icon={Move} stats={mobilityStats} />
        <Separator className="my-1 opacity-30" />
        
        <StatCategory title="HANDLING" icon={Hand} stats={handlingStats} />
        
        {/* Magazine info */}
        <div className="mt-3 p-2 rounded-lg bg-muted/20 border border-border/30">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Info className="h-3 w-3" />
            Magazine & Ammo
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-mono">
                {weapon.magazineCapacity + (totalModifiers.magCapacity || 0)}
                {totalModifiers.magCapacity !== 0 && (
                  <span className={totalModifiers.magCapacity > 0 ? 'text-emerald-400 ml-1' : 'text-red-400 ml-1'}>
                    ({totalModifiers.magCapacity > 0 ? '+' : ''}{totalModifiers.magCapacity})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reserve</span>
              <span className="font-mono">{weapon.reserveAmmo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fire Modes</span>
              <span className="font-mono uppercase text-[10px]">
                {weapon.fireModes.join(' / ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-mono">{weapon.weight.toFixed(2)} kg</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export default WeaponStatsPanel;
