/**
 * Inventory Weapon Modal - Shows detailed weapon stats when clicking a weapon in inventory
 * Integrates with the existing inventory system and Gun Nut features
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wrench,
  Settings2,
  BarChart3,
  Box,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import { WeaponStatsPanel } from './WeaponStatsPanel';
import { WeaponConditionDisplay, WeaponConditionBadge } from './WeaponConditionDisplay';
import { AttachmentBrowser } from './AttachmentBrowser';
import { ExtendedWeapon, WeaponAttachment, AttachmentSlot, WeaponAttachmentSystem } from '@/game/weaponAttachmentSystem';
import { 
  WeaponStatsProfile, 
  BASE_WEAPON_STATS,
  getWeaponStats,
} from '@/game/weaponStatsDatabase';
import { GunNutDepth } from '@/lib/gameSettings';
import { Weapon } from '@/game/weaponWearSystem';

// ============= TYPES =============

interface InventoryWeaponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: Weapon | ExtendedWeapon | null;
  gunNutDepth?: GunNutDepth;
  cheatModeEnabled?: boolean;
  playerInventoryAttachments?: WeaponAttachment[];
  onOpenInspection?: () => void;
  onRepair?: () => void;
  onModify?: () => void;
  onWeaponUpdate?: (weapon: ExtendedWeapon) => void;
}

// ============= WEAPON STATS MAPPING =============

// Map weapon types to stats profiles
const WEAPON_TYPE_TO_STATS: Record<string, string> = {
  'pistol_basic': 'glock17',
  'pistol_quality': 'm1911',
  'revolver': 'm1911',
  'smg_cheap': 'mp5',
  'smg_quality': 'mp5',
  'assault_rifle': 'm4a1',
  'ak_variant': 'ak47',
  'sniper_rifle': 'm24',
  'shotgun_pump': 'spas12',
  'shotgun_auto': 'spas12',
  'lmg': 'pkm',
};

function getStatsForWeapon(weapon: Weapon): WeaponStatsProfile | null {
  // Try to get stats by weapon ID first
  let stats = getWeaponStats(weapon.id);
  
  // Fall back to type-based mapping
  if (!stats) {
    const mappedId = WEAPON_TYPE_TO_STATS[weapon.type];
    if (mappedId) {
      stats = getWeaponStats(mappedId);
    }
  }
  
  // Create a dynamic profile if no match
  if (!stats && weapon) {
    // Generate basic stats from weapon type
    return createDynamicStats(weapon);
  }
  
  return stats;
}

function createDynamicStats(weapon: Weapon): WeaponStatsProfile {
  // Base stats based on weapon type category
  const isRifle = weapon.type.includes('rifle') || weapon.type.includes('ak');
  const isPistol = weapon.type.includes('pistol') || weapon.type.includes('revolver');
  const isShotgun = weapon.type.includes('shotgun');
  const isSniper = weapon.type.includes('sniper');
  const isSmg = weapon.type.includes('smg');
  const isLmg = weapon.type.includes('lmg');
  
  const baseDamage = isSniper ? 95 : isShotgun ? 120 : isRifle ? 48 : isLmg ? 55 : isSmg ? 32 : 38;
  const baseRange = isSniper ? 120 : isShotgun ? 15 : isRifle ? 55 : isLmg ? 60 : isSmg ? 30 : 35;
  const baseRoF = isSniper ? 40 : isShotgun ? 80 : isLmg ? 650 : isRifle ? 700 : isSmg ? 800 : 450;
  
  return {
    id: weapon.id,
    name: weapon.name,
    type: weapon.type,
    era: 'modern',
    caliber: isPistol ? '9mm' : isRifle ? '5.56x45mm' : isShotgun ? '12ga' : isSniper ? '7.62x51mm' : '5.56x45mm',
    category: isPistol ? 'pistol' : isRifle ? 'assault_rifle' : isShotgun ? 'shotgun' : isSniper ? 'sniper' : isSmg ? 'smg' : isLmg ? 'lmg' : 'assault_rifle',
    damage: {
      headshotDamage: Math.round(baseDamage * 1.5),
      upperTorsoDamage: baseDamage,
      lowerTorsoDamage: Math.round(baseDamage * 0.85),
      limbDamage: Math.round(baseDamage * 0.7),
      targetFlinch: baseDamage / 50,
      armorPenetration: isSniper ? 80 : isRifle ? 45 : isShotgun ? 20 : 25,
    },
    range: {
      effectiveRange: baseRange,
      minimumDamageRange: baseRange * 1.4,
      bulletVelocity: isSniper ? 850 : isRifle ? 900 : isShotgun ? 400 : isPistol ? 350 : 600,
      dropoffMultiplier: 0.65,
    },
    fireRate: {
      rateOfFire: baseRoF,
      cycleTime: Math.round(60000 / baseRoF),
    },
    accuracy: {
      hipfireSpreadMin: isPistol ? 3.5 : isSmg ? 3.2 : isSniper ? 12 : 4.8,
      hipfireSpreadMax: isPistol ? 8 : isSmg ? 8 : isSniper ? 25 : 11,
      hipfireSpreadMoving: isPistol ? 10 : isSmg ? 10 : isSniper ? 30 : 14,
      flinchResistance: 0.4,
      tacticalStanceSpread: 5,
      adsAccuracy: isSniper ? 95 : isRifle ? 78 : 72,
    },
    recoil: {
      gunKick: isSniper ? 4.5 : isLmg ? 2.8 : isRifle ? 1.8 : isPistol ? 1.8 : 1.2,
      horizontalRecoil: 1.4,
      verticalRecoil: isSniper ? 5 : isLmg ? 3.2 : 2.5,
      recoilPattern: 'balanced',
      recoveryTime: 150,
    },
    mobility: {
      movementSpeed: isPistol ? 5.2 : isSmg ? 5.4 : isSniper ? 4.2 : isLmg ? 3.8 : 4.8,
      crouchMovementSpeed: 2.2,
      sprintSpeed: isPistol ? 6.8 : isSmg ? 7 : isSniper ? 5.2 : isLmg ? 4.8 : 6.2,
      tacticalSprintSpeed: isPistol ? 8.2 : isSmg ? 8.5 : isSniper ? 6 : isLmg ? 5.6 : 7.4,
      adsMovementSpeed: 2.6,
    },
    handling: {
      adsSpeed: isPistol ? 180 : isSmg ? 180 : isSniper ? 420 : isLmg ? 380 : 240,
      reloadQuickness: isPistol ? 1.8 : isSniper ? 3.2 : isLmg ? 5.5 : 2.1,
      sprintToFireSpeed: isPistol ? 150 : isSmg ? 160 : isSniper ? 380 : 220,
      swapSpeed: isPistol ? 600 : isSniper ? 1200 : isLmg ? 1400 : 900,
      dropShotSpeed: 380,
      slideToFireSpeed: 320,
    },
    magazineCapacity: weapon.maxAmmo,
    reserveAmmo: weapon.maxAmmo * 4,
    chamberRound: true,
    weight: isLmg ? 7.5 : isSniper ? 5.4 : isRifle ? 3 : isPistol ? 1 : 2.5,
    length: isSniper ? 1100 : isRifle ? 850 : isPistol ? 200 : 700,
    fireModes: ['semi', 'auto'],
    attachmentSlots: ['muzzle', 'optic', 'grip'],
    description: `${weapon.name} - ${weapon.type.replace('_', ' ')}`,
    pros: ['Reliable'],
    cons: ['Standard'],
    source: ['Generated'],
  };
}

// ============= MAIN COMPONENT =============

export function InventoryWeaponModal({
  open,
  onOpenChange,
  weapon,
  gunNutDepth = 'standard',
  cheatModeEnabled = false,
  playerInventoryAttachments = [],
  onOpenInspection,
  onRepair,
  onModify,
  onWeaponUpdate,
}: InventoryWeaponModalProps) {
  const [activeTab, setActiveTab] = useState('stats');
  const [attachmentBrowserOpen, setAttachmentBrowserOpen] = useState(false);
  
  // Get weapon stats profile
  const weaponStats = useMemo(() => {
    if (!weapon) return null;
    return getStatsForWeapon(weapon);
  }, [weapon]);
  
  // Get attachments if extended weapon
  const attachments = useMemo(() => {
    if (!weapon) return {};
    if ('attachments' in weapon) {
      return (weapon as ExtendedWeapon).attachments;
    }
    return {};
  }, [weapon]);
  
  if (!weapon || !weaponStats) return null;
  
  const isGunNut = gunNutDepth !== 'standard';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {weapon.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {weaponStats.description}
              </p>
            </div>
            <WeaponConditionBadge 
              condition={weapon.condition} 
              destroyed={weapon.destroyed} 
            />
          </div>
          
          {/* Quick condition bar */}
          <div className="mt-2">
            <WeaponConditionDisplay weapon={weapon} size="sm" showLabel={false} />
          </div>
        </DialogHeader>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="stats" className="text-xs">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs">
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              Attachments
              {Object.keys(attachments).length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[9px] px-1">
                  {Object.keys(attachments).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Stats Tab */}
          <TabsContent value="stats" className="flex-1 overflow-hidden mt-0 p-0">
            <div className="h-full overflow-auto">
              <WeaponStatsPanel 
                weapon={weaponStats} 
                attachments={attachments}
              />
            </div>
          </TabsContent>
          
          {/* Attachments Tab */}
          <TabsContent value="attachments" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {Object.keys(attachments).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Box className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attachments installed</p>
                    <p className="text-xs mt-1">Use the Modify button to add attachments</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setAttachmentBrowserOpen(true)}
                    >
                      <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                      Browse Attachments
                    </Button>
                  </div>
                ) : (
                  <>
                    {Object.entries(attachments).map(([slot, attachment]) => (
                      <AttachmentCard 
                        key={slot} 
                        slot={slot} 
                        attachment={attachment as WeaponAttachment}
                      />
                    ))}
                  </>
                )}
                
                {/* Available slots */}
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Available Slots
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {weaponStats.attachmentSlots.map(slot => (
                      <Badge 
                        key={slot}
                        variant={attachments[slot] ? 'default' : 'outline'}
                        className="text-[10px]"
                      >
                        {slot.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Modify button in attachments tab */}
                {Object.keys(attachments).length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => setAttachmentBrowserOpen(true)}
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                    Modify Attachments
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Footer actions */}
        <div className="p-3 border-t border-border/50 flex gap-2">
          {cheatModeEnabled && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mr-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Cheat Mode
            </Badge>
          )}
          
          {isGunNut && onOpenInspection && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onOpenInspection}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Full Inspection
            </Button>
          )}
          
          {onRepair && weapon.condition < 100 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onRepair}
            >
              <Wrench className="h-3.5 w-3.5 mr-1.5" />
              Repair
            </Button>
          )}
          
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => setAttachmentBrowserOpen(true)}
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            Modify
          </Button>
        </div>
      </DialogContent>
      
      {/* Attachment Browser Modal */}
      <AttachmentBrowser
        open={attachmentBrowserOpen}
        onOpenChange={setAttachmentBrowserOpen}
        weapon={weapon}
        cheatModeEnabled={cheatModeEnabled}
        playerInventoryAttachments={playerInventoryAttachments}
        onEquipAttachment={(extWeapon, attachment) => {
          WeaponAttachmentSystem.attachToWeapon(extWeapon, attachment);
          onWeaponUpdate?.(extWeapon);
        }}
        onUnequipAttachment={(extWeapon, slot) => {
          const removed = WeaponAttachmentSystem.detachFromWeapon(extWeapon, slot);
          onWeaponUpdate?.(extWeapon);
          return removed;
        }}
      />
    </Dialog>
  );
}

// ============= ATTACHMENT CARD =============

function AttachmentCard({ 
  slot, 
  attachment 
}: { 
  slot: string; 
  attachment: WeaponAttachment;
}) {
  const RARITY_COLORS = {
    common: 'border-muted-foreground/30',
    uncommon: 'border-green-500/50',
    rare: 'border-blue-500/50',
    epic: 'border-purple-500/50',
    legendary: 'border-amber-500/50',
  };
  
  const conditionColor = 
    attachment.condition >= 80 ? 'text-emerald-400' :
    attachment.condition >= 50 ? 'text-yellow-400' :
    'text-red-400';
  
  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card/50",
      RARITY_COLORS[attachment.rarity]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <h5 className="text-sm font-medium">{attachment.name}</h5>
          <p className="text-xs text-muted-foreground capitalize">
            {slot.replace('_', ' ')}
          </p>
        </div>
        <Badge variant="outline" className={cn('text-[10px]', conditionColor)}>
          {Math.round(attachment.condition)}%
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
        {attachment.description}
      </p>
      
      {/* Modifiers */}
      {attachment.modifiers && Object.keys(attachment.modifiers).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(attachment.modifiers).map(([stat, value]) => {
            if (typeof value !== 'number' || value === 0) return null;
            const isPositive = stat === 'recoil' || stat === 'noise' || stat === 'hipfireSpread'
              ? value < 0 
              : value > 0;
            return (
              <Badge 
                key={stat}
                variant="outline"
                className={cn(
                  'text-[9px] px-1.5',
                  isPositive ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'
                )}
              >
                {stat}: {value > 0 ? '+' : ''}{value}%
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InventoryWeaponModal;
