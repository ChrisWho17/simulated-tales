/**
 * Weapon Inspection Modal - Tarkov-style detailed weapon view
 * Shows parts, attachments, and individual component conditions
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Crosshair,
  Target,
  Zap,
  Volume2,
  Weight,
  Timer,
  Gauge,
  Shield,
  Wrench,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Eye,
  Settings2,
  Cog,
  Box,
  Droplets,
  Flame,
  CircleDot,
  Sparkles,
} from 'lucide-react';
import { WeaponConditionDisplay, WeaponConditionBadge } from './WeaponConditionDisplay';
import { TriggerGroup } from '@/game/gunNutTriggerSystem';
import {
  ExtendedWeapon, 
  WeaponAttachment, 
  AttachmentSlot,
  WeaponAttachmentSystem,
} from '@/game/weaponAttachmentSystem';
import { WeaponWearSystem } from '@/game/weaponWearSystem';
import { 
  GunNutWeapon, 
  GunNutMagazine, 
  GunNutMaintenance,
  isGunNutMode,
  getWeaponSettings,
} from '@/game/gunNutSystem';

// Gun Nut+ depth levels
export type GunNutDepth = 'standard' | 'gunnut' | 'gunnut_plus';

interface WeaponInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: ExtendedWeapon | GunNutWeapon | null;
  onRepair?: (weapon: ExtendedWeapon, part?: string) => void;
  onModifyAttachment?: (weapon: ExtendedWeapon, slot: AttachmentSlot, attachment: WeaponAttachment | null) => void;
  gunNutDepth?: GunNutDepth;
  onGunNutDepthChange?: (depth: GunNutDepth) => void;
}

// Type guard for GunNutWeapon
function isGunNutWeapon(weapon: ExtendedWeapon | GunNutWeapon): weapon is GunNutWeapon {
  return 'maintenance' in weapon || 'coreParts' in weapon;
}

// Magazine detail row
function MagazineDetailRow({ 
  label, 
  value, 
  icon: Icon,
  warning = false 
}: { 
  label: string; 
  value: number; 
  icon: typeof Droplets;
  warning?: boolean;
}) {
  const color = value >= 70 ? 'text-emerald-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon className={cn('h-3.5 w-3.5', warning ? 'text-orange-400' : 'text-muted-foreground')} />
      <span className="text-xs flex-1">{label}</span>
      <div className="w-16">
        <Progress value={value} className="h-1" />
      </div>
      <span className={cn('text-xs font-mono tabular-nums w-10 text-right', color)}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

// Maintenance factor row
function MaintenanceFactorRow({ 
  label, 
  value,
  maxValue = 1,
  icon: Icon,
  inverted = false,
  unit = '%'
}: { 
  label: string; 
  value: number;
  maxValue?: number;
  icon: typeof Flame;
  inverted?: boolean;
  unit?: string;
}) {
  const normalizedValue = (value / maxValue) * 100;
  const displayValue = unit === '%' ? Math.round(normalizedValue) : Math.round(value * 100);
  
  // For inverted metrics (fouling, carbon), low is good
  const color = inverted
    ? normalizedValue <= 30 ? 'text-emerald-400' : normalizedValue <= 60 ? 'text-yellow-400' : 'text-red-400'
    : normalizedValue >= 70 ? 'text-emerald-400' : normalizedValue >= 40 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon className={cn(
        'h-3.5 w-3.5',
        inverted && normalizedValue > 60 ? 'text-orange-400 animate-pulse' : 'text-muted-foreground'
      )} />
      <span className="text-xs flex-1">{label}</span>
      <div className="w-16">
        <Progress 
          value={inverted ? 100 - normalizedValue : normalizedValue} 
          className={cn('h-1', inverted && normalizedValue > 70 && 'bg-red-900/50')} 
        />
      </div>
      <span className={cn('text-xs font-mono tabular-nums w-12 text-right', color)}>
        {displayValue}{unit}
      </span>
    </div>
  );
}

// Depth selector component
function GunNutDepthSelector({
  depth,
  onChange
}: {
  depth: GunNutDepth;
  onChange: (depth: GunNutDepth) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        <Cog className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium">Detail Level:</span>
      </div>
      <div className="flex gap-1">
        <Button
          variant={depth === 'standard' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onChange('standard')}
        >
          Standard
        </Button>
        <Button
          variant={depth === 'gunnut' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onChange('gunnut')}
        >
          Gun Nut
        </Button>
        <Button
          variant={depth === 'gunnut_plus' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onChange('gunnut_plus')}
        >
          Gun Nut+
        </Button>
      </div>
    </div>
  );
}

// Magazine details panel (Gun Nut+)
function MagazineDetailsPanel({ magazine }: { magazine: GunNutMagazine }) {
  const avgCondition = (magazine.springTension + magazine.feedLipsCondition + magazine.followerCondition) / 3;
  
  return (
    <div className="p-3 rounded-lg border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <Box className="h-4 w-4" />
          Magazine: {magazine.name}
        </h5>
        <Badge variant="outline" className={cn(
          'text-[10px]',
          avgCondition >= 70 ? 'border-emerald-500/50 text-emerald-400' :
          avgCondition >= 40 ? 'border-yellow-500/50 text-yellow-400' :
          'border-red-500/50 text-red-400'
        )}>
          {Math.round(avgCondition)}%
        </Badge>
      </div>
      
      <div className="space-y-0.5">
        <MagazineDetailRow 
          label="Spring Tension" 
          value={magazine.springTension} 
          icon={Zap}
          warning={magazine.springTension < 50}
        />
        <MagazineDetailRow 
          label="Feed Lips" 
          value={magazine.feedLipsCondition} 
          icon={ChevronUp}
          warning={magazine.feedLipsCondition < 60}
        />
        <MagazineDetailRow 
          label="Follower" 
          value={magazine.followerCondition} 
          icon={ChevronDown}
        />
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Material</span>
        <span className="capitalize">{magazine.material}</span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Capacity</span>
        <span className="font-mono">{magazine.currentAmmo}/{magazine.capacity}</span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Feed Reliability</span>
        <span className={cn(
          'font-mono',
          magazine.feedReliability >= 0.9 ? 'text-emerald-400' : 
          magazine.feedReliability >= 0.7 ? 'text-yellow-400' : 'text-red-400'
        )}>
          {Math.round(magazine.feedReliability * 100)}%
        </span>
      </div>
      
      {magazine.feedLipsCondition < 60 && (
        <div className="mt-2 p-2 rounded bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center gap-1.5 text-xs text-orange-400">
            <AlertTriangle className="h-3 w-3" />
            Damaged feed lips may cause double feeds
          </div>
        </div>
      )}
    </div>
  );
}

// Maintenance panel (Gun Nut+)
function MaintenancePanel({ maintenance }: { maintenance: GunNutMaintenance }) {
  const needsCleaning = maintenance.foulingLevel > 0.5 || maintenance.carbonBuildup > 0.6;
  const needsLube = maintenance.lubeLevel < 0.3;
  const hasRust = maintenance.rustLevel > 0.1;
  
  return (
    <div className="p-3 rounded-lg border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Maintenance Status
        </h5>
        {(needsCleaning || needsLube || hasRust) && (
          <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-400">
            Needs Attention
          </Badge>
        )}
      </div>
      
      <div className="space-y-0.5">
        <MaintenanceFactorRow 
          label="Fouling Level" 
          value={maintenance.foulingLevel}
          icon={Flame}
          inverted
        />
        <MaintenanceFactorRow 
          label="Carbon Buildup" 
          value={maintenance.carbonBuildup}
          icon={CircleDot}
          inverted
        />
        <MaintenanceFactorRow 
          label="Lubrication" 
          value={maintenance.lubeLevel}
          icon={Droplets}
        />
        <MaintenanceFactorRow 
          label="Rust Level" 
          value={maintenance.rustLevel}
          icon={Sparkles}
          inverted
        />
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Total Rounds Fired</span>
        <span className="font-mono">{maintenance.totalRoundsFired.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Rounds Since Clean</span>
        <span className={cn(
          'font-mono',
          maintenance.roundsSinceClean > 500 ? 'text-orange-400' : 'text-muted-foreground'
        )}>
          {maintenance.roundsSinceClean.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Last Cleaned</span>
        <span className="text-muted-foreground">
          {maintenance.lastCleaned 
            ? new Date(maintenance.lastCleaned).toLocaleDateString() 
            : 'Never'}
        </span>
      </div>
      
      {/* Warnings */}
      <div className="mt-2 space-y-1">
        {maintenance.foulingLevel > 0.7 && (
          <div className="p-1.5 rounded bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-1.5 text-[10px] text-red-400">
              <AlertTriangle className="h-3 w-3" />
              Heavy fouling - high malfunction risk
            </div>
          </div>
        )}
        {maintenance.lubeLevel < 0.2 && (
          <div className="p-1.5 rounded bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-1.5 text-[10px] text-orange-400">
              <Droplets className="h-3 w-3" />
              Low lubrication - accelerated wear
            </div>
          </div>
        )}
        {maintenance.rustLevel > 0.3 && (
          <div className="p-1.5 rounded bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-1.5 text-[10px] text-orange-400">
              <Sparkles className="h-3 w-3" />
              Rust forming - needs immediate cleaning
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Trigger Group details panel (Gun Nut+)
function TriggerGroupPanel({ trigger }: { trigger: TriggerGroup }) {
  const breakQualityColor = {
    crisp: 'text-emerald-400',
    creeping: 'text-yellow-400',
    rolling: 'text-orange-400',
  };
  
  return (
    <div className="p-3 rounded-lg border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Trigger: {trigger.name}
        </h5>
        <Badge variant="outline" className={cn(
          'text-[10px]',
          trigger.condition >= 70 ? 'border-emerald-500/50 text-emerald-400' :
          trigger.condition >= 40 ? 'border-yellow-500/50 text-yellow-400' :
          'border-red-500/50 text-red-400'
        )}>
          {Math.round(trigger.condition)}%
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pull Weight</span>
          <span className="font-mono">{trigger.pullWeight} lbs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Travel</span>
          <span className="font-mono">{trigger.travelDistance}"</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reset</span>
          <span className="font-mono">{trigger.resetDistance}"</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Break</span>
          <span className={cn('capitalize', breakQualityColor[trigger.breakQuality])}>
            {trigger.breakQuality}
          </span>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Accuracy Modifier</span>
        <span className={cn(
          'font-mono',
          trigger.accuracyModifier >= 1.1 ? 'text-emerald-400' : 
          trigger.accuracyModifier >= 1.0 ? 'text-muted-foreground' : 'text-orange-400'
        )}>
          {trigger.accuracyModifier >= 1 ? '+' : ''}{Math.round((trigger.accuracyModifier - 1) * 100)}%
        </span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Fire Rate Modifier</span>
        <span className="font-mono">
          {trigger.fireRateModifier >= 1 ? '+' : ''}{Math.round((trigger.fireRateModifier - 1) * 100)}%
        </span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Fire Modes</span>
        <span className="font-mono uppercase">{trigger.fireModes.join(' / ')}</span>
      </div>
      
      {trigger.condition < 50 && (
        <div className="mt-2 p-2 rounded bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center gap-1.5 text-xs text-orange-400">
            <AlertTriangle className="h-3 w-3" />
            Trigger feels gritty - service recommended
          </div>
        </div>
      )}
    </div>
  );
}

// Slot display configuration
const SLOT_CONFIG: Record<AttachmentSlot, { label: string; icon: typeof Crosshair }> = {
  barrel: { label: 'Barrel', icon: Box },
  muzzle: { label: 'Muzzle Device', icon: Target },
  handguard: { label: 'Handguard', icon: Box },
  grip: { label: 'Pistol Grip', icon: Box },
  stock: { label: 'Stock', icon: Box },
  magazine: { label: 'Magazine', icon: Box },
  sights: { label: 'Iron Sights', icon: Eye },
  optic: { label: 'Optic', icon: Crosshair },
  tactical_rail_top: { label: 'Top Rail', icon: Settings2 },
  tactical_rail_side: { label: 'Side Rail', icon: Settings2 },
  tactical_rail_bottom: { label: 'Bottom Rail', icon: Settings2 },
};

const PART_CONFIG = {
  receiver: { label: 'Receiver', description: 'Main weapon body' },
  barrel: { label: 'Barrel', description: 'Projectile guidance' },
  trigger: { label: 'Trigger Assembly', description: 'Fire control' },
  bolt: { label: 'Bolt/Slide', description: 'Cycling mechanism' },
  feedSystem: { label: 'Feed System', description: 'Magazine well & feed ramp' },
};

const RARITY_COLORS = {
  common: 'border-muted-foreground/30 text-muted-foreground',
  uncommon: 'border-green-500/50 text-green-400',
  rare: 'border-blue-500/50 text-blue-400',
  epic: 'border-purple-500/50 text-purple-400',
  legendary: 'border-amber-500/50 text-amber-400',
};

function getConditionColor(condition: number): string {
  if (condition >= 80) return 'text-emerald-400';
  if (condition >= 60) return 'text-green-400';
  if (condition >= 40) return 'text-yellow-400';
  if (condition >= 20) return 'text-orange-400';
  return 'text-red-400';
}

function PartConditionRow({ 
  label, 
  condition, 
  description 
}: { 
  label: string; 
  condition: number; 
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className={cn('text-xs tabular-nums font-mono', getConditionColor(condition))}>
            {Math.round(condition)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="w-20">
        <Progress value={condition} className="h-1.5" />
      </div>
    </div>
  );
}

function AttachmentSlotRow({
  slot,
  attachment,
  isCompatible,
  onModify,
}: {
  slot: AttachmentSlot;
  attachment: WeaponAttachment | undefined;
  isCompatible: boolean;
  onModify?: () => void;
}) {
  const config = SLOT_CONFIG[slot];
  const Icon = config.icon;
  
  if (!isCompatible) return null;
  
  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/30 transition-colors">
      <div className={cn(
        'p-2 rounded-md',
        attachment ? 'bg-primary/10' : 'bg-muted/50'
      )}>
        <Icon className={cn(
          'h-4 w-4',
          attachment ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {attachment ? attachment.name : config.label}
          </span>
          {attachment && (
            <Badge 
              variant="outline" 
              className={cn('text-[10px] px-1', RARITY_COLORS[attachment.rarity])}
            >
              {attachment.rarity}
            </Badge>
          )}
        </div>
        {attachment ? (
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-xs tabular-nums', getConditionColor(attachment.condition))}>
              {Math.round(attachment.condition)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {attachment.description.slice(0, 40)}...
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Empty slot</p>
        )}
      </div>
      
      {attachment && (
        <div className="w-16">
          <Progress value={attachment.condition} className="h-1" />
        </div>
      )}
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7"
        onClick={onModify}
      >
        {attachment ? <Settings2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function StatRow({ 
  icon: Icon, 
  label, 
  value, 
  unit = '', 
  inverted = false 
}: { 
  icon: typeof Crosshair; 
  label: string; 
  value: number; 
  unit?: string;
  inverted?: boolean;
}) {
  // For inverted stats (like recoil), lower is better
  const displayColor = inverted
    ? value <= 30 ? 'text-emerald-400' : value <= 50 ? 'text-yellow-400' : 'text-red-400'
    : value >= 70 ? 'text-emerald-400' : value >= 50 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      <span className={cn('text-sm font-mono tabular-nums', displayColor)}>
        {Math.round(value)}{unit}
      </span>
    </div>
  );
}

export function WeaponInspectionModal({
  open,
  onOpenChange,
  weapon,
  onRepair,
  onModifyAttachment,
  gunNutDepth: externalDepth,
  onGunNutDepthChange,
}: WeaponInspectionModalProps) {
  const [internalDepth, setInternalDepth] = useState<GunNutDepth>('standard');
  const gunNutDepth = externalDepth ?? internalDepth;
  const setGunNutDepth = onGunNutDepthChange ?? setInternalDepth;
  
  const isGunNut = gunNutDepth === 'gunnut' || gunNutDepth === 'gunnut_plus';
  const isGunNutPlus = gunNutDepth === 'gunnut_plus';
  
  // Cast to GunNutWeapon if applicable
  const gunNutWeapon = weapon && isGunNutWeapon(weapon) ? weapon : null;
  
  const overallCondition = useMemo(() => {
    if (!weapon) return 0;
    // Check if it's an ExtendedWeapon with attachments
    if ('attachments' in weapon && 'partConditions' in weapon) {
      return WeaponAttachmentSystem.getOverallCondition(weapon as ExtendedWeapon);
    }
    return weapon.condition;
  }, [weapon]);
  
  const compatibleSlots = useMemo(() => {
    if (!weapon) return [];
    return Object.keys(SLOT_CONFIG).filter(
      slot => WeaponAttachmentSystem.isSlotCompatible(weapon.type, slot as AttachmentSlot)
    ) as AttachmentSlot[];
  }, [weapon]);
  
  // Get attachments safely
  const attachments = 'attachments' in weapon ? weapon.attachments : {};
  const partConditions = 'partConditions' in weapon ? weapon.partConditions : null;
  const hasAttachments = Object.keys(attachments).length > 0;
  
  if (!weapon) return null;
  
  // Calculate stats - use weapon's effective stats or base stats
  const baseStats = { accuracy: 70, recoil: 50, ergonomics: 50, aimSpeed: 70, noise: 100, weight: 3000, magCapacity: 30 };
  const stats = 'effectiveStats' in weapon && weapon.effectiveStats 
    ? weapon.effectiveStats 
    : ('attachments' in weapon && 'partConditions' in weapon)
      ? WeaponAttachmentSystem.recalculateStats(weapon as ExtendedWeapon)
      : baseStats;
  const visualState = WeaponWearSystem.getVisualState(weapon);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{weapon.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {WeaponWearSystem.getConditionDescription(weapon.condition)}
              </p>
            </div>
            <WeaponConditionBadge condition={overallCondition} destroyed={weapon.destroyed} />
          </div>
        </DialogHeader>
        
        {/* Gun Nut+ Depth Selector */}
        <GunNutDepthSelector depth={gunNutDepth} onChange={setGunNutDepth} />
        
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className={cn(
            "grid w-full flex-shrink-0",
            isGunNutPlus ? "grid-cols-4" : "grid-cols-3"
          )}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parts">
              {isGunNut ? 'Parts' : 'Condition'}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments
              {hasAttachments && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                  {Object.keys(attachments).length}
                </Badge>
              )}
            </TabsTrigger>
            {isGunNutPlus && (
              <TabsTrigger value="maintenance">
                Maint.
                {gunNutWeapon?.maintenance && gunNutWeapon.maintenance.foulingLevel > 0.5 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1">!</Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Overall Condition */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Overall Durability
                  </h4>
                  <span className={cn(
                    'text-2xl font-bold tabular-nums',
                    getConditionColor(overallCondition)
                  )}>
                    {overallCondition}%
                  </span>
                </div>
                <WeaponConditionDisplay weapon={weapon} size="lg" showLabel={false} />
                
                {/* Visual effects indicator */}
                {(visualState.rustLevel > 0 || visualState.dirtLevel > 0) && (
                  <div className="mt-3 flex gap-3 text-xs">
                    {visualState.rustLevel > 0 && (
                      <div className="flex items-center gap-1 text-orange-400">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        Rust: {Math.round(visualState.rustLevel * 100)}%
                      </div>
                    )}
                    {visualState.dirtLevel > 0 && (
                      <div className="flex items-center gap-1 text-amber-700">
                        <div className="w-2 h-2 rounded-full bg-amber-700" />
                        Dirt: {Math.round(visualState.dirtLevel * 100)}%
                      </div>
                    )}
                    {visualState.damageLevel > 0 && (
                      <div className="flex items-center gap-1 text-red-400">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        Damage: {Math.round(visualState.damageLevel * 100)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Effective Stats */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Weapon Statistics
                </h4>
                <div className="grid grid-cols-2 gap-x-6">
                  <StatRow icon={Target} label="Accuracy" value={stats.accuracy} unit="%" />
                  <StatRow icon={Zap} label="Recoil" value={stats.recoil} unit="%" inverted />
                  <StatRow icon={Shield} label="Ergonomics" value={stats.ergonomics} />
                  <StatRow icon={Timer} label="Aim Speed" value={stats.aimSpeed} />
                  <StatRow icon={Volume2} label="Noise" value={stats.noise} unit="%" inverted />
                  <StatRow icon={Weight} label="Weight" value={stats.weight / 1000} unit="kg" />
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Magazine Capacity</span>
                  <span className="font-mono">{weapon.ammo} / {stats.magCapacity}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Total Shots Fired</span>
                  <span className="font-mono">{weapon.shotsFired}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Jams Cleared</span>
                  <span className="font-mono">{weapon.jamsCleared}</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    if ('attachments' in weapon && 'partConditions' in weapon) {
                      onRepair?.(weapon as ExtendedWeapon);
                    }
                  }}
                  disabled={weapon.condition >= 95}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Field Clean
                </Button>
              </div>
              
              {/* Gun Nut+ Magazine Preview */}
              {isGunNutPlus && gunNutWeapon?.magazine && (
                <MagazineDetailsPanel magazine={gunNutWeapon.magazine} />
              )}
            </TabsContent>
            
            {/* Parts Tab */}
            <TabsContent value="parts" className="mt-0 space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  {isGunNut ? 'Core Components' : 'Overall Condition'}
                </h4>
                
                {/* Standard mode - show simple part conditions if available */}
                {partConditions && (
                  <div className="divide-y divide-border/50">
                    {Object.entries(PART_CONFIG).map(([key, config]) => (
                      <PartConditionRow
                        key={key}
                        label={config.label}
                        condition={partConditions[key as keyof typeof partConditions] || 100}
                        description={config.description}
                      />
                    ))}
                  </div>
                )}
                
                {/* Gun Nut mode - show detailed parts from coreParts */}
                {isGunNut && gunNutWeapon?.coreParts && (
                  <div className="divide-y divide-border/50">
                    {Object.entries(gunNutWeapon.coreParts).map(([key, part]) => part && (
                      <PartConditionRow
                        key={key}
                        label={part.name || key}
                        condition={part.condition}
                        description={`Affects: ${part.affects?.join(', ') || 'multiple stats'}`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Fallback for simple weapons */}
                {!partConditions && !gunNutWeapon?.coreParts && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <WeaponConditionDisplay weapon={weapon} size="lg" showLabel={false} />
                  </div>
                )}
              </div>
              
              {/* Average part condition */}
              {partConditions && (
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <span className="text-sm text-muted-foreground">Average Part Condition: </span>
                  <span className={cn(
                    'font-bold',
                    getConditionColor(
                      Object.values(partConditions).reduce((a, b) => a + b, 0) / Object.keys(partConditions).length
                    )
                  )}>
                    {Math.round(Object.values(partConditions).reduce((a, b) => a + b, 0) / Object.keys(partConditions).length)}%
                  </span>
                </div>
              )}
              
              {/* Barrel Erosion (Gun Nut+) */}
              {isGunNutPlus && gunNutWeapon?.coreParts?.barrel && (
                <div className="p-3 rounded-lg border bg-card/50">
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Barrel Analysis
                  </h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rounds Fired</span>
                      <span className="font-mono">
                        {gunNutWeapon.coreParts.barrel.roundsFired.toLocaleString()} / {gunNutWeapon.coreParts.barrel.maxRounds.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Barrel Erosion</span>
                      <span className={cn(
                        'font-mono',
                        gunNutWeapon.coreParts.barrel.erosionLevel < 0.3 ? 'text-emerald-400' :
                        gunNutWeapon.coreParts.barrel.erosionLevel < 0.7 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {Math.round(gunNutWeapon.coreParts.barrel.erosionLevel * 100)}%
                      </span>
                    </div>
                    <Progress value={(1 - gunNutWeapon.coreParts.barrel.erosionLevel) * 100} className="h-1.5 mt-1" />
                  </div>
                </div>
              )}
              
              {/* Repair options */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Repair Options</h5>
                <div className="grid grid-cols-3 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          Basic
                          <Badge variant="secondary" className="ml-1 text-[10px]">$50</Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Restores to 70%. Quick field repair.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          Standard
                          <Badge variant="secondary" className="ml-1 text-[10px]">$150</Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Restores to 85%. Professional service.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="sm" className="w-full">
                          Full
                          <Badge variant="secondary" className="ml-1 text-[10px]">$400</Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Restores to 100%. Can repair destroyed weapons.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </TabsContent>
            
            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-0 space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Attachment Slots
                  <Badge variant="outline" className="ml-auto text-xs">
                    {compatibleSlots.length} slots
                  </Badge>
                </h4>
                
                <div className="divide-y divide-border/50">
                  {compatibleSlots.map(slot => (
                    <AttachmentSlotRow
                      key={slot}
                      slot={slot}
                      attachment={attachments[slot]}
                      isCompatible={true}
                      onModify={() => {
                        if ('attachments' in weapon && 'partConditions' in weapon) {
                          onModifyAttachment?.(weapon as ExtendedWeapon, slot, attachments[slot] || null);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Attachment summary */}
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Installed Attachments</span>
                  <span className="font-medium">
                    {Object.keys(attachments).length} / {compatibleSlots.length}
                  </span>
                </div>
                
                {hasAttachments && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.values(attachments).map(att => att && (
                      <Badge 
                        key={att.id} 
                        variant="secondary" 
                        className={cn('text-[10px]', RARITY_COLORS[att.rarity])}
                      >
                        {att.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Modifier summary */}
              {hasAttachments && (
                <div className="p-4 rounded-lg border bg-card">
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" />
                    Total Modifiers from Attachments
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {stats.accuracy !== 70 && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className={stats.accuracy > 70 ? 'text-green-400' : 'text-red-400'}>
                          {stats.accuracy > 70 ? '+' : ''}{Math.round(stats.accuracy - 70)}%
                        </span>
                      </div>
                    )}
                    {stats.recoil !== 50 && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Recoil:</span>
                        <span className={stats.recoil < 50 ? 'text-green-400' : 'text-red-400'}>
                          {stats.recoil < 50 ? '' : '+'}{Math.round(stats.recoil - 50)}%
                        </span>
                      </div>
                    )}
                    {stats.ergonomics !== 50 && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Ergonomics:</span>
                        <span className={stats.ergonomics > 50 ? 'text-green-400' : 'text-red-400'}>
                          {stats.ergonomics > 50 ? '+' : ''}{Math.round(stats.ergonomics - 50)}
                        </span>
                      </div>
                    )}
                    {stats.noise !== 100 && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Noise:</span>
                        <span className={stats.noise < 100 ? 'text-green-400' : 'text-red-400'}>
                          {stats.noise < 100 ? '' : '+'}{Math.round(stats.noise - 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Maintenance Tab (Gun Nut+ only) */}
            {isGunNutPlus && (
              <TabsContent value="maintenance" className="mt-0 space-y-4">
                {gunNutWeapon?.maintenance ? (
                  <>
                    <MaintenancePanel maintenance={gunNutWeapon.maintenance} />
                    
                    {/* Magazine details */}
                    {gunNutWeapon.magazine && (
                      <MagazineDetailsPanel magazine={gunNutWeapon.magazine} />
                    )}
                    
                    {/* Quick maintenance actions */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Maintenance Actions</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Droplets className="h-3.5 w-3.5 mr-1.5" />
                          Apply Lubricant
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Flame className="h-3.5 w-3.5 mr-1.5" />
                          Clean Fouling
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <CircleDot className="h-3.5 w-3.5 mr-1.5" />
                          Remove Carbon
                        </Button>
                        <Button variant="default" size="sm" className="w-full">
                          <Wrench className="h-3.5 w-3.5 mr-1.5" />
                          Full Service
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Cog className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Maintenance data not available for this weapon.
                    </p>
                    <p className="text-xs mt-1">
                      Upgrade to a Gun Nut+ compatible weapon for detailed tracking.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default WeaponInspectionModal;
