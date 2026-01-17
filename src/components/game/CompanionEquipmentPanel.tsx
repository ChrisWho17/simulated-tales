import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sword, Shield, Star, ChevronRight,
  AlertCircle, Sparkles
} from 'lucide-react';
import { CompanionState } from '@/game/companionSystem';
import { CompanionCombatStats, companionCombatManager } from '@/game/companionCombatSystem';
import { 
  CompanionEquipment, 
  EquipmentSlot,
  EQUIPMENT_DATABASE,
  RARITY_COLORS,
  RARITY_BG_COLORS,
  companionEquipmentManager,
  getEquipmentBySlot
} from '@/game/companionEquipmentSystem';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CompanionEquipmentPanelProps {
  companion: CompanionState;
  isOpen: boolean;
  onClose: () => void;
}

const slotIcons: Record<EquipmentSlot, React.ReactNode> = {
  weapon: <Sword className="w-4 h-4" />,
  armor: <Shield className="w-4 h-4" />,
  accessory: <Star className="w-4 h-4" />,
};

const slotLabels: Record<EquipmentSlot, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
};

export function CompanionEquipmentPanel({ companion, isOpen, onClose }: CompanionEquipmentPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const combatStats = companionCombatManager.getCombatStats(companion.id);
  const loadout = companionEquipmentManager.getLoadout(companion.id);
  const bonuses = companionEquipmentManager.calculateEquipmentBonuses(companion.id);
  const specialEffects = companionEquipmentManager.getSpecialEffects(companion.id);

  const handleEquip = (equipment: CompanionEquipment) => {
    const canEquipResult = companionEquipmentManager.canEquip(
      companion.id,
      equipment,
      combatStats,
      companion.combatRole
    );

    if (!canEquipResult.canEquip) {
      toast.error(canEquipResult.reason || 'Cannot equip this item');
      return;
    }

    const result = companionEquipmentManager.equip(companion.id, equipment);
    if (result.success) {
      toast.success(`${companion.name} equipped ${equipment.name}`);
      if (result.unequipped) {
        toast.info(`Unequipped ${result.unequipped.name}`);
      }
    }
    setSelectedSlot(null);
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    const item = companionEquipmentManager.unequip(companion.id, slot);
    if (item) {
      toast.info(`${companion.name} unequipped ${item.name}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[85vh] overflow-hidden mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-bold">{companion.name}'s Equipment</h2>
                <p className="text-xs text-muted-foreground capitalize">{companion.combatRole || 'Companion'}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Current Equipment Slots */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Equipped</h3>
              {(['weapon', 'armor', 'accessory'] as EquipmentSlot[]).map((slot) => {
                const equipped = loadout[slot];
                return (
                  <div
                    key={slot}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      equipped 
                        ? RARITY_BG_COLORS[equipped.rarity]
                        : "bg-muted/20 border-border/50 hover:border-border",
                      selectedSlot === slot && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedSlot(selectedSlot === slot ? null : slot)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                          {slotIcons[slot]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{slotLabels[slot]}</span>
                          </div>
                          {equipped ? (
                            <span className={cn("font-medium", RARITY_COLORS[equipped.rarity])}>
                              {equipped.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Empty</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {equipped && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnequip(slot);
                            }}
                            className="text-xs text-muted-foreground hover:text-red-400"
                          >
                            Unequip
                          </Button>
                        )}
                        <ChevronRight className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          selectedSlot === slot && "rotate-90"
                        )} />
                      </div>
                    </div>
                    
                    {/* Stats preview */}
                    {equipped && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {equipped.stats.damageBonus && (
                          <span className="text-red-400">+{equipped.stats.damageBonus} DMG</span>
                        )}
                        {equipped.stats.armorBonus && (
                          <span className="text-blue-400">+{equipped.stats.armorBonus} ARM</span>
                        )}
                        {equipped.stats.healthBonus && (
                          <span className="text-green-400">+{equipped.stats.healthBonus} HP</span>
                        )}
                        {equipped.stats.strengthBonus && (
                          <span className="text-orange-400">+{equipped.stats.strengthBonus} STR</span>
                        )}
                        {equipped.stats.agilityBonus && (
                          <span className={equipped.stats.agilityBonus > 0 ? "text-cyan-400" : "text-red-400"}>
                            {equipped.stats.agilityBonus > 0 ? '+' : ''}{equipped.stats.agilityBonus} AGI
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Equipment Selection */}
            <AnimatePresence>
              {selectedSlot && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border border-border rounded-lg bg-muted/10 p-3">
                    <h3 className="text-sm font-medium mb-2">Available {slotLabels[selectedSlot]}s</h3>
                    <ScrollArea className="max-h-48">
                      <div className="space-y-2">
                        {getEquipmentBySlot(selectedSlot).map((equipment) => {
                          const canEquipResult = companionEquipmentManager.canEquip(
                            companion.id,
                            equipment,
                            combatStats,
                            companion.combatRole
                          );
                          
                          return (
                            <div
                              key={equipment.id}
                              className={cn(
                                "p-2 rounded border transition-all",
                                canEquipResult.canEquip 
                                  ? "cursor-pointer hover:border-primary/50" 
                                  : "opacity-50 cursor-not-allowed",
                                RARITY_BG_COLORS[equipment.rarity]
                              )}
                              onClick={() => canEquipResult.canEquip && handleEquip(equipment)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className={cn("font-medium text-sm", RARITY_COLORS[equipment.rarity])}>
                                    {equipment.name}
                                  </span>
                                  <p className="text-xs text-muted-foreground">{equipment.description}</p>
                                  {!canEquipResult.canEquip && (
                                    <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {canEquipResult.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1 text-xs">
                                {Object.entries(equipment.stats).map(([stat, value]) => {
                                  if (!value || stat === 'specialEffect') return null;
                                  const isNegative = typeof value === 'number' && value < 0;
                                  return (
                                    <span 
                                      key={stat} 
                                      className={isNegative ? "text-red-400" : "text-green-400"}
                                    >
                                      {isNegative ? '' : '+'}{value} {stat.replace('Bonus', '').toUpperCase()}
                                    </span>
                                  );
                                })}
                              </div>
                              {equipment.stats.specialEffect && (
                                <div className="flex items-center gap-1 text-xs text-purple-400 mt-1">
                                  <Sparkles className="w-3 h-3" />
                                  {equipment.stats.specialEffect}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total Bonuses Summary */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Total Equipment Bonuses
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {bonuses.damageBonus! > 0 && (
                  <span className="text-red-400">+{bonuses.damageBonus} Damage</span>
                )}
                {bonuses.armorBonus! > 0 && (
                  <span className="text-blue-400">+{bonuses.armorBonus} Armor</span>
                )}
                {bonuses.healthBonus! > 0 && (
                  <span className="text-green-400">+{bonuses.healthBonus} Health</span>
                )}
                {bonuses.strengthBonus! !== 0 && (
                  <span className={bonuses.strengthBonus! > 0 ? "text-orange-400" : "text-red-400"}>
                    {bonuses.strengthBonus! > 0 ? '+' : ''}{bonuses.strengthBonus} Strength
                  </span>
                )}
                {bonuses.agilityBonus! !== 0 && (
                  <span className={bonuses.agilityBonus! > 0 ? "text-cyan-400" : "text-red-400"}>
                    {bonuses.agilityBonus! > 0 ? '+' : ''}{bonuses.agilityBonus} Agility
                  </span>
                )}
                {bonuses.criticalChanceBonus! > 0 && (
                  <span className="text-yellow-400">+{bonuses.criticalChanceBonus}% Crit</span>
                )}
              </div>
              
              {/* Special Effects */}
              {specialEffects.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Special Effects:</p>
                  {specialEffects.map((effect, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-purple-400">
                      <Sparkles className="w-3 h-3" />
                      {effect}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
