/**
 * Attachment Browser UI - Browse and equip attachments for weapons
 * Supports cheat mode for free access or requires crafting/finding
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Box,
  Lock,
  Unlock,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Hammer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AttachmentSlot,
  WeaponAttachment,
  ExtendedWeapon,
  WeaponAttachmentSystem,
} from '@/game/weaponAttachmentSystem';
import { Weapon, WeaponType } from '@/game/weaponWearSystem';

// ============= TYPES =============

interface AttachmentBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: ExtendedWeapon | Weapon | null;
  cheatModeEnabled: boolean;
  playerInventoryAttachments?: WeaponAttachment[];
  onEquipAttachment?: (weapon: ExtendedWeapon, attachment: WeaponAttachment) => void;
  onUnequipAttachment?: (weapon: ExtendedWeapon, slot: AttachmentSlot) => WeaponAttachment | null;
}

// All available attachment templates by slot
const ALL_ATTACHMENTS: Record<AttachmentSlot, { id: string; slot: AttachmentSlot }[]> = {
  barrel: [
    { id: 'standard_barrel', slot: 'barrel' },
    { id: 'match_barrel', slot: 'barrel' },
    { id: 'short_barrel', slot: 'barrel' },
    { id: 'heavy_barrel', slot: 'barrel' },
  ],
  muzzle: [
    { id: 'flash_hider', slot: 'muzzle' },
    { id: 'compensator', slot: 'muzzle' },
    { id: 'muzzle_brake', slot: 'muzzle' },
    { id: 'suppressor_small', slot: 'muzzle' },
    { id: 'suppressor_large', slot: 'muzzle' },
  ],
  optic: [
    { id: 'iron_sights', slot: 'optic' },
    { id: 'red_dot', slot: 'optic' },
    { id: 'holographic', slot: 'optic' },
    { id: 'acog_4x', slot: 'optic' },
    { id: 'lpvo', slot: 'optic' },
    { id: 'sniper_scope', slot: 'optic' },
    { id: 'thermal', slot: 'optic' },
  ],
  sights: [
    { id: 'iron_sights', slot: 'sights' },
    { id: 'red_dot', slot: 'sights' },
  ],
  grip: [
    { id: 'standard_grip', slot: 'grip' },
    { id: 'ergonomic_grip', slot: 'grip' },
    { id: 'rubberized_grip', slot: 'grip' },
  ],
  stock: [
    { id: 'fixed_stock', slot: 'stock' },
    { id: 'collapsible_stock', slot: 'stock' },
    { id: 'folding_stock', slot: 'stock' },
    { id: 'precision_stock', slot: 'stock' },
  ],
  magazine: [
    { id: 'standard_mag', slot: 'magazine' },
    { id: 'extended_mag', slot: 'magazine' },
    { id: 'drum_mag', slot: 'magazine' },
    { id: 'reduced_mag', slot: 'magazine' },
  ],
  handguard: [
    { id: 'standard_grip', slot: 'handguard' },
    { id: 'ergonomic_grip', slot: 'handguard' },
  ],
  tactical_rail_top: [
    { id: 'flashlight', slot: 'tactical_rail_top' },
    { id: 'laser_red', slot: 'tactical_rail_top' },
    { id: 'laser_green', slot: 'tactical_rail_top' },
  ],
  tactical_rail_side: [
    { id: 'flashlight', slot: 'tactical_rail_side' },
    { id: 'laser_red', slot: 'tactical_rail_side' },
    { id: 'laser_ir', slot: 'tactical_rail_side' },
  ],
  tactical_rail_bottom: [
    { id: 'flashlight', slot: 'tactical_rail_bottom' },
    { id: 'foregrip_vertical', slot: 'tactical_rail_bottom' },
    { id: 'foregrip_angled', slot: 'tactical_rail_bottom' },
    { id: 'bipod', slot: 'tactical_rail_bottom' },
  ],
};

const SLOT_LABELS: Record<AttachmentSlot, string> = {
  barrel: 'Barrel',
  muzzle: 'Muzzle',
  optic: 'Optic',
  sights: 'Sights',
  grip: 'Grip',
  stock: 'Stock',
  magazine: 'Magazine',
  handguard: 'Handguard',
  tactical_rail_top: 'Top Rail',
  tactical_rail_side: 'Side Rail',
  tactical_rail_bottom: 'Bottom Rail',
};

const RARITY_COLORS = {
  common: 'border-muted-foreground/30 text-muted-foreground bg-muted/20',
  uncommon: 'border-green-500/50 text-green-400 bg-green-500/10',
  rare: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  epic: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
  legendary: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
};

// ============= ATTACHMENT CARD =============

interface AttachmentCardProps {
  attachment: WeaponAttachment;
  isEquipped: boolean;
  isOwned: boolean;
  cheatModeEnabled: boolean;
  onEquip: () => void;
  onUnequip: () => void;
}

function AttachmentCard({
  attachment,
  isEquipped,
  isOwned,
  cheatModeEnabled,
  onEquip,
  onUnequip,
}: AttachmentCardProps) {
  const canEquip = cheatModeEnabled || isOwned;
  
  return (
    <div className={cn(
      "relative p-3 rounded-lg border transition-all",
      isEquipped 
        ? "border-primary bg-primary/10 ring-1 ring-primary/50" 
        : RARITY_COLORS[attachment.rarity]
    )}>
      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      
      {/* Locked indicator */}
      {!canEquip && (
        <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{attachment.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {attachment.description}
          </p>
        </div>
        
        <Badge variant="outline" className={cn('text-[9px] shrink-0', RARITY_COLORS[attachment.rarity])}>
          {attachment.rarity}
        </Badge>
      </div>
      
      {/* Stat modifiers */}
      {attachment.modifiers && Object.keys(attachment.modifiers).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(attachment.modifiers).map(([stat, value]) => {
            if (typeof value !== 'number' || value === 0) return null;
            const isPositive = stat === 'recoil' || stat === 'noise' || stat === 'hipfireSpread'
              ? value < 0 
              : value > 0;
            const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
            return (
              <Badge 
                key={stat}
                variant="outline"
                className={cn(
                  'text-[9px] px-1.5 gap-0.5',
                  isPositive ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'
                )}
              >
                <Icon className="h-2.5 w-2.5" />
                {stat}: {value > 0 ? '+' : ''}{value}%
              </Badge>
            );
          })}
        </div>
      )}
      
      {/* Action button */}
      <div className="mt-3">
        {isEquipped ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-7 text-xs"
            onClick={onUnequip}
          >
            <X className="h-3 w-3 mr-1" />
            Unequip
          </Button>
        ) : canEquip ? (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full h-7 text-xs"
            onClick={onEquip}
          >
            <Check className="h-3 w-3 mr-1" />
            Equip
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-7 text-xs border-amber-500/30 text-amber-400"
                  onClick={onEquip}
                >
                  <Hammer className="h-3 w-3 mr-1" />
                  Craft / Find
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Craft this attachment or find it in the world</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Cheat mode indicator */}
      {cheatModeEnabled && !isOwned && (
        <div className="absolute bottom-1 right-1">
          <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Sparkles className="h-2 w-2 mr-0.5" />
            CHEAT
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============= SLOT SELECTOR =============

interface SlotSelectorProps {
  slots: AttachmentSlot[];
  selectedSlot: AttachmentSlot;
  equippedAttachments: Partial<Record<AttachmentSlot, WeaponAttachment>>;
  onSelectSlot: (slot: AttachmentSlot) => void;
}

function SlotSelector({
  slots,
  selectedSlot,
  equippedAttachments,
  onSelectSlot,
}: SlotSelectorProps) {
  return (
    <div className="space-y-1">
      {slots.map(slot => {
        const equipped = equippedAttachments[slot];
        const isSelected = slot === selectedSlot;
        
        return (
          <button
            key={slot}
            onClick={() => onSelectSlot(slot)}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors",
              isSelected 
                ? "bg-primary/20 border border-primary/50" 
                : "hover:bg-muted/50 border border-transparent"
            )}
          >
            <Box className={cn(
              "h-4 w-4",
              equipped ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{SLOT_LABELS[slot]}</span>
              {equipped && (
                <p className="text-xs text-muted-foreground truncate">
                  {equipped.name}
                </p>
              )}
            </div>
            {equipped && (
              <Badge variant="outline" className="text-[9px] shrink-0">
                Equipped
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}

// ============= MAIN COMPONENT =============

export function AttachmentBrowser({
  open,
  onOpenChange,
  weapon,
  cheatModeEnabled,
  playerInventoryAttachments = [],
  onEquipAttachment,
  onUnequipAttachment,
}: AttachmentBrowserProps) {
  const [selectedSlot, setSelectedSlot] = useState<AttachmentSlot>('muzzle');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get compatible slots for this weapon
  const compatibleSlots = useMemo(() => {
    if (!weapon) return [];
    return (Object.keys(SLOT_LABELS) as AttachmentSlot[]).filter(
      slot => WeaponAttachmentSystem.isSlotCompatible(weapon.type, slot)
    );
  }, [weapon]);
  
  // Get equipped attachments
  const equippedAttachments = useMemo(() => {
    if (!weapon || !('attachments' in weapon)) return {};
    return (weapon as ExtendedWeapon).attachments;
  }, [weapon]);
  
  // Get available attachments for selected slot
  const availableAttachments = useMemo(() => {
    const slotAttachments = ALL_ATTACHMENTS[selectedSlot] || [];
    
    return slotAttachments
      .map(({ id, slot }) => WeaponAttachmentSystem.createAttachment(id, slot))
      .filter((att): att is WeaponAttachment => att !== null)
      .filter(att => {
        if (!searchQuery) return true;
        return att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               att.description.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [selectedSlot, searchQuery]);
  
  // Check if player owns an attachment
  const isOwned = (attachmentName: string) => {
    return playerInventoryAttachments.some(att => att.name === attachmentName);
  };
  
  // Handle equip
  const handleEquip = (attachment: WeaponAttachment) => {
    if (!weapon || !onEquipAttachment) return;
    
    const extendedWeapon = 'attachments' in weapon 
      ? weapon as ExtendedWeapon
      : {
          ...weapon,
          attachments: {},
          partConditions: {
            receiver: 100,
            barrel: 100,
            trigger: 100,
            bolt: 100,
            feedSystem: 100,
          },
        } as ExtendedWeapon;
    
    onEquipAttachment(extendedWeapon, attachment);
  };
  
  // Handle unequip
  const handleUnequip = (slot: AttachmentSlot) => {
    if (!weapon || !onUnequipAttachment || !('attachments' in weapon)) return;
    onUnequipAttachment(weapon as ExtendedWeapon, slot);
  };
  
  // Set initial selected slot
  useMemo(() => {
    if (compatibleSlots.length > 0 && !compatibleSlots.includes(selectedSlot)) {
      setSelectedSlot(compatibleSlots[0]);
    }
  }, [compatibleSlots, selectedSlot]);
  
  if (!weapon) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">
                Attachment Browser
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {weapon.name} - Select slot and attachment
              </p>
            </div>
            
            {/* Cheat mode indicator */}
            {cheatModeEnabled && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Cheat Mode
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Slot sidebar */}
          <div className="w-48 border-r border-border/50 p-3 overflow-auto">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Attachment Slots
            </h4>
            <SlotSelector
              slots={compatibleSlots}
              selectedSlot={selectedSlot}
              equippedAttachments={equippedAttachments}
              onSelectSlot={setSelectedSlot}
            />
            
            {!cheatModeEnabled && (
              <div className="mt-4 p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Find or craft attachments to unlock</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Attachment list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attachments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            
            {/* Grid */}
            <ScrollArea className="flex-1">
              <div className="p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {SLOT_LABELS[selectedSlot]} Attachments ({availableAttachments.length})
                </h4>
                
                {availableAttachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Box className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attachments found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableAttachments.map(attachment => {
                      const equipped = equippedAttachments[selectedSlot];
                      const isEquipped = equipped?.name === attachment.name;
                      
                      return (
                        <AttachmentCard
                          key={attachment.id}
                          attachment={attachment}
                          isEquipped={isEquipped}
                          isOwned={isOwned(attachment.name)}
                          cheatModeEnabled={cheatModeEnabled}
                          onEquip={() => handleEquip(attachment)}
                          onUnequip={() => handleUnequip(selectedSlot)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-border/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {Object.keys(equippedAttachments).length} attachments equipped
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AttachmentBrowser;
