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
} from 'lucide-react';
import { WeaponConditionDisplay, WeaponConditionBadge } from './WeaponConditionDisplay';
import { 
  ExtendedWeapon, 
  WeaponAttachment, 
  AttachmentSlot,
  WeaponAttachmentSystem,
} from '@/game/weaponAttachmentSystem';
import { WeaponWearSystem } from '@/game/weaponWearSystem';

interface WeaponInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: ExtendedWeapon | null;
  onRepair?: (weapon: ExtendedWeapon, part?: string) => void;
  onModifyAttachment?: (weapon: ExtendedWeapon, slot: AttachmentSlot, attachment: WeaponAttachment | null) => void;
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
}: WeaponInspectionModalProps) {
  const [showDetailedMode, setShowDetailedMode] = useState(false);
  
  const overallCondition = useMemo(() => {
    if (!weapon) return 0;
    return WeaponAttachmentSystem.getOverallCondition(weapon);
  }, [weapon]);
  
  const compatibleSlots = useMemo(() => {
    if (!weapon) return [];
    return Object.keys(SLOT_CONFIG).filter(
      slot => WeaponAttachmentSystem.isSlotCompatible(weapon.type, slot as AttachmentSlot)
    ) as AttachmentSlot[];
  }, [weapon]);
  
  if (!weapon) return null;
  
  const stats = weapon.effectiveStats || WeaponAttachmentSystem.recalculateStats(weapon);
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
        
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parts">
              Parts & Condition
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments
              {Object.keys(weapon.attachments).length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                  {Object.keys(weapon.attachments).length}
                </Badge>
              )}
            </TabsTrigger>
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
                  onClick={() => onRepair?.(weapon)}
                  disabled={weapon.condition >= 95}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Field Clean
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => setShowDetailedMode(!showDetailedMode)}
                >
                  <Cog className="h-4 w-4 mr-2" />
                  {showDetailedMode ? 'Simple View' : 'Detailed View'}
                </Button>
              </div>
            </TabsContent>
            
            {/* Parts Tab */}
            <TabsContent value="parts" className="mt-0 space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  Core Components
                </h4>
                <div className="divide-y divide-border/50">
                  {Object.entries(PART_CONFIG).map(([key, config]) => (
                    <PartConditionRow
                      key={key}
                      label={config.label}
                      condition={weapon.partConditions[key as keyof typeof weapon.partConditions]}
                      description={config.description}
                    />
                  ))}
                </div>
              </div>
              
              {/* Average part condition */}
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <span className="text-sm text-muted-foreground">Average Part Condition: </span>
                <span className={cn(
                  'font-bold',
                  getConditionColor(WeaponAttachmentSystem.getAveragePartCondition(weapon) * 100)
                )}>
                  {Math.round(WeaponAttachmentSystem.getAveragePartCondition(weapon) * 100)}%
                </span>
              </div>
              
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
                      attachment={weapon.attachments[slot]}
                      isCompatible={true}
                      onModify={() => onModifyAttachment?.(weapon, slot, weapon.attachments[slot] || null)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Attachment summary */}
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Installed Attachments</span>
                  <span className="font-medium">
                    {Object.keys(weapon.attachments).length} / {compatibleSlots.length}
                  </span>
                </div>
                
                {Object.values(weapon.attachments).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.values(weapon.attachments).map(att => att && (
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
              {Object.values(weapon.attachments).some(Boolean) && (
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
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default WeaponInspectionModal;
