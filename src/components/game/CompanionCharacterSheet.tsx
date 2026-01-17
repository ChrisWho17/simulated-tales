import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Shield, Sword, Zap, Brain, Users,
  Star, TrendingUp, TrendingDown, Minus, Activity, Backpack
} from 'lucide-react';
import { CompanionState } from '@/game/companionSystem';
import { CompanionCombatStats, companionCombatManager } from '@/game/companionCombatSystem';
import { companionEquipmentManager, RARITY_COLORS } from '@/game/companionEquipmentSystem';
import { loyaltyQuestManager } from '@/game/companionLoyaltyQuestSystem';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CompanionEquipmentPanel } from './CompanionEquipmentPanel';
import { LoyaltyQuestProgress } from './LoyaltyQuestProgress';

interface CompanionCharacterSheetProps {
  companion: CompanionState;
  isOpen: boolean;
  onClose: () => void;
}

const roleIcons = {
  tank: Shield,
  damage: Sword,
  support: Heart,
  ranged: Zap,
};

const moraleColors: Record<string, string> = {
  demoralized: 'text-red-500',
  shaken: 'text-orange-400',
  steady: 'text-gray-400',
  confident: 'text-green-400',
  inspired: 'text-yellow-400',
};

const moraleIcons: Record<string, React.ReactNode> = {
  demoralized: <TrendingDown className="w-4 h-4" />,
  shaken: <TrendingDown className="w-3 h-3" />,
  steady: <Minus className="w-4 h-4" />,
  confident: <TrendingUp className="w-3 h-3" />,
  inspired: <TrendingUp className="w-4 h-4" />,
};

export function CompanionCharacterSheet({ companion, isOpen, onClose }: CompanionCharacterSheetProps) {
  const [showEquipmentPanel, setShowEquipmentPanel] = useState(false);
  const combatStats = companionCombatManager.getCombatStats(companion.id);
  const loadout = companionEquipmentManager.getLoadout(companion.id);
  const loyaltyQuests = loyaltyQuestManager.getAllQuestsForCompanion(companion.id);
  const RoleIcon = roleIcons[companion.combatRole as keyof typeof roleIcons] || Users;

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
          className="bg-card border border-border rounded-lg w-full max-w-md max-h-[85vh] overflow-auto mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-xl font-bold">
                {companion.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">{companion.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RoleIcon className="w-3 h-3" />
                  <span className="capitalize">{companion.combatRole || 'Companion'}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 space-y-5">
            {/* Health & Energy */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-red-400 font-medium">Health</span>
                  <span className="text-sm font-bold text-red-400">
                    {combatStats?.currentHealth || '?'}/{combatStats?.maxHealth || '?'}
                  </span>
                </div>
                <Progress 
                  value={combatStats ? (combatStats.currentHealth / combatStats.maxHealth) * 100 : 0} 
                  className="h-2"
                  indicatorClassName="bg-red-500"
                />
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-yellow-400 font-medium">Energy</span>
                  <span className="text-sm font-bold text-yellow-400">
                    {combatStats?.currentEnergy || '?'}/100
                  </span>
                </div>
                <Progress 
                  value={combatStats?.currentEnergy || 0} 
                  className="h-2"
                  indicatorClassName="bg-yellow-500"
                />
              </div>
            </div>

            {/* Morale */}
            {combatStats && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Morale
                  </span>
                  <span className={cn("text-sm font-bold capitalize flex items-center gap-1", moraleColors[combatStats.moraleState])}>
                    {moraleIcons[combatStats.moraleState]}
                    {combatStats.moraleState}
                  </span>
                </div>
                <Progress 
                  value={combatStats.morale} 
                  className="h-2"
                  indicatorClassName={cn(
                    combatStats.morale <= 30 && "bg-red-500",
                    combatStats.morale > 30 && combatStats.morale <= 70 && "bg-gray-400",
                    combatStats.morale > 70 && "bg-green-500"
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {combatStats.moraleState === 'demoralized' && 'Suffering -4 to all combat rolls'}
                  {combatStats.moraleState === 'shaken' && 'Suffering -2 to all combat rolls'}
                  {combatStats.moraleState === 'steady' && 'No morale modifier'}
                  {combatStats.moraleState === 'confident' && 'Gaining +2 to all combat rolls'}
                  {combatStats.moraleState === 'inspired' && 'Gaining +4 to all combat rolls!'}
                </p>
              </div>
            )}

            {/* Base Stats (Permanent) */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Combat Attributes
                <span className="text-xs text-muted-foreground">(permanent)</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {combatStats && (
                  <>
                    <StatBlock label="Strength" value={combatStats.baseStrength} />
                    <StatBlock label="Agility" value={combatStats.baseAgility} />
                    <StatBlock label="Endurance" value={combatStats.baseEndurance} />
                    <StatBlock label="Combat Skill" value={combatStats.baseCombatSkill} />
                  </>
                )}
              </div>
              {combatStats && (
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Size: <span className="text-foreground capitalize">{combatStats.size}</span></span>
                  <span>Damage: <span className="text-foreground">{combatStats.weaponDamage}</span></span>
                  <span>Armor: <span className="text-foreground">{combatStats.armorProtection}</span></span>
                </div>
              )}
            </div>

            {/* Equipment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Backpack className="w-4 h-4 text-amber-400" />
                  Equipment
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEquipmentPanel(true)}
                  className="text-xs h-6"
                >
                  Manage
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
                  const item = loadout[slot];
                  return (
                    <div
                      key={slot}
                      className="p-2 rounded bg-muted/30 border border-border/50 text-center"
                    >
                      <div className="text-xs text-muted-foreground capitalize mb-1">{slot}</div>
                      {item ? (
                        <div className={cn("text-xs font-medium truncate", RARITY_COLORS[item.rarity])}>
                          {item.name}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Relationship Stats */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                Relationship
              </h3>
              <div className="space-y-2">
                <RelationshipBar label="Affinity" value={companion.affinity} min={-100} max={100} />
                <RelationshipBar label="Trust" value={companion.trust} />
                <RelationshipBar label="Respect" value={companion.respect} />
                {companion.romanticInterest > 0 && (
                  <RelationshipBar label="Romance" value={companion.romanticInterest} color="bg-pink-400" />
                )}
                {companion.fear > 0 && (
                  <RelationshipBar label="Fear" value={companion.fear} color="bg-purple-400" />
                )}
              </div>
            </div>

            {/* Personality */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Personality
              </h3>
              <div className="flex flex-wrap gap-1">
                {companion.personality.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 border border-primary/30 capitalize"
                  >
                    {trait}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="text-green-400">Approves: </span>
                {companion.personality.approves.slice(0, 3).map(a => a.replace(/_/g, ' ')).join(', ')}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-red-400">Disapproves: </span>
                {companion.personality.disapproves.slice(0, 3).map(a => a.replace(/_/g, ' ')).join(', ')}
              </div>
            </div>

            {/* Skills */}
            {companion.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {companion.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 text-xs rounded bg-muted/50 capitalize"
                    >
                      {skill.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Current Thoughts */}
            {companion.trust > 50 && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Brain className="w-3 h-3" />
                  Currently thinking...
                </div>
                <p className="text-sm italic">{companion.internalThoughts}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Equipment Panel */}
      <CompanionEquipmentPanel
        companion={companion}
        isOpen={showEquipmentPanel}
        onClose={() => setShowEquipmentPanel(false)}
      />
    </AnimatePresence>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-green-400';
    if (v >= 60) return 'text-blue-400';
    if (v >= 40) return 'text-foreground';
    if (v >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="p-2 rounded bg-muted/30 border border-border/50">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-bold", getColor(value))}>{value}</div>
    </div>
  );
}

function RelationshipBar({ 
  label, 
  value, 
  min = 0, 
  max = 100,
  color = 'bg-blue-400'
}: { 
  label: string; 
  value: number; 
  min?: number;
  max?: number;
  color?: string;
}) {
  // Normalize value for display
  const normalizedValue = ((value - min) / (max - min)) * 100;
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          value < 0 && "text-red-400",
          value >= 0 && value < 50 && "text-muted-foreground",
          value >= 50 && "text-foreground"
        )}>
          {value}
        </span>
      </div>
      <Progress value={normalizedValue} className="h-1.5" indicatorClassName={color} />
    </div>
  );
}