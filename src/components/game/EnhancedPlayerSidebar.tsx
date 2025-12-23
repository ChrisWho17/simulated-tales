import React, { useState } from 'react';
import { 
  Heart, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  User, Swords, Shield, Eye, Brain, Zap, Activity,
  Package, Coins, Droplet, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameOptional } from '@/contexts/GameContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wound } from '@/game/diceSystem';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerVitals {
  health: number;
  maxHealth: number;
  energy: number;
  stress: number;
}

interface PlayerNeeds {
  hunger: number;
  thirst: number;
  hygiene: number;
  rest: number;
  tension?: number;
}

interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  perception: number;
  endurance: number;
}

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
}

interface PlayerInventory {
  gold: number;
  currentWeight: number;
  maxWeight: number;
  items: InventoryItem[];
}

export interface EnhancedPlayerData {
  name: string;
  role: string;
  portrait?: string;
  vitals: PlayerVitals;
  needs: PlayerNeeds;
  stats: PlayerStats;
  wounds?: Wound[];
  inventory: PlayerInventory;
}

interface EnhancedPlayerSidebarProps {
  player: EnhancedPlayerData;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface VitalBarProps {
  label: string;
  current: number;
  max: number;
  color: 'health' | 'energy' | 'stress' | 'accent';
  icon: React.ReactNode;
  showValue?: boolean;
}

const VitalBar: React.FC<VitalBarProps> = ({ 
  label, current, max, color, icon, showValue = true 
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isCritical = percentage < 25;
  
  const colorClasses = {
    health: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    energy: 'bg-gradient-to-r from-yellow-500 to-orange-400',
    stress: 'bg-gradient-to-r from-red-500 to-rose-400',
    accent: 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]'
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        {showValue && (
          <span className="text-foreground font-medium">{current}/{max}</span>
        )}
      </div>
      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            colorClasses[color],
            isCritical && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface NeedBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

const NeedBar: React.FC<NeedBarProps> = ({ label, value, icon }) => {
  const level = value < 30 ? 'low' : value < 60 ? 'medium' : 'high';
  
  const levelColors = {
    low: 'from-red-500 to-orange-500',
    medium: 'from-yellow-500 to-amber-400',
    high: 'from-emerald-500 to-green-400'
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-muted-foreground w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full bg-gradient-to-r", levelColors[level])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

interface StatDisplayProps {
  label: string;
  value: number;
  base: number;
  icon: React.ReactNode;
}

const StatDisplay: React.FC<StatDisplayProps> = ({ label, value, base, icon }) => {
  const isPenalized = value < base;
  const isBuffed = value > base;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[var(--accent-secondary)]">{icon}</span>
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className={cn(
        "font-mono font-medium",
        isPenalized && "text-red-400",
        isBuffed && "text-emerald-400",
        !isPenalized && !isBuffed && "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
};

interface WoundTagProps {
  wound: Wound;
}

const WoundTag: React.FC<WoundTagProps> = ({ wound }) => {
  const severityColors = {
    1: 'border-yellow-500/50 bg-yellow-500/10',
    2: 'border-orange-500/50 bg-orange-500/10',
    3: 'border-red-500/50 bg-red-500/10',
    4: 'border-red-700/50 bg-red-700/10'
  };
  
  return (
    <div className={cn(
      "px-2 py-1 rounded text-xs border",
      severityColors[wound.severity as keyof typeof severityColors] || severityColors[1],
      wound.treated && "opacity-60"
    )}>
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3 text-red-400" />
        <span className="font-medium">{wound.type}</span>
      </div>
      <span className="text-muted-foreground">({wound.location})</span>
    </div>
  );
};

interface InventorySlotProps {
  item?: InventoryItem;
}

const InventorySlot: React.FC<InventorySlotProps> = ({ item }) => (
  <div className={cn(
    "w-9 h-9 rounded border flex items-center justify-center text-sm",
    item 
      ? "border-[var(--accent-border)] bg-[var(--accent-bg)]" 
      : "border-border/30 bg-black/20"
  )}>
    {item && <span>{item.icon}</span>}
  </div>
);

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, icon, children, collapsible = false, defaultCollapsed = false 
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-[var(--accent-secondary)]",
          collapsible && "cursor-pointer hover:text-[var(--accent-primary)]"
        )}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        {icon}
        <span className="uppercase tracking-wider">{title}</span>
        {collapsible && (
          <span className="ml-auto">
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </span>
        )}
      </div>
      {!collapsed && <div className="space-y-2">{children}</div>}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EnhancedPlayerSidebar: React.FC<EnhancedPlayerSidebarProps> = ({
  player,
  isExpanded,
  onToggle,
  className
}) => {
  const gameContext = useGameOptional();
  const adultContent = gameContext?.adultContent ?? false;
  
  const getEffectiveStat = (statName: keyof PlayerStats): number => {
    let base = player.stats[statName];
    let modifier = 0;
    player.wounds?.forEach(wound => {
      const penalties = wound.statPenalties as Partial<PlayerStats> | undefined;
      if (penalties?.[statName]) {
        modifier += penalties[statName]!;
      }
    });
    return Math.max(1, base + modifier);
  };
  
  return (
    <aside className={cn(
      "h-full flex flex-col transition-all duration-300 glass-panel border-r border-[var(--accent-border)]",
      isExpanded ? "w-64" : "w-16",
      className
    )}>
      {/* Toggle Button */}
      <button 
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 rounded-full bg-background border border-[var(--accent-border)] flex items-center justify-center hover:bg-[var(--accent-bg)] transition-colors"
        onClick={onToggle}
      >
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
      
      {/* Player Header */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          {/* Portrait */}
          <div className="relative shrink-0">
            <div 
              className="w-12 h-14 rounded-lg border-2 border-[var(--accent-primary)] overflow-hidden flex items-center justify-center bg-black/30"
              style={{ boxShadow: `0 0 20px var(--accent-glow)` }}
            >
              {player.portrait ? (
                <img src={player.portrait} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-[var(--accent-secondary)]" />
              )}
            </div>
            
            {/* Health overlay */}
            <div 
              className="absolute inset-0 rounded-lg bg-gradient-to-t from-red-900/80 to-transparent pointer-events-none"
              style={{ 
                height: `${100 - (player.vitals.health / player.vitals.maxHealth) * 100}%`,
                top: 'auto',
                bottom: 0 
              }}
            />
            
            {/* Wound indicator */}
            {player.wounds && player.wounds.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border border-background flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{player.wounds.length}</span>
              </div>
            )}
          </div>
          
          {isExpanded && (
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold text-foreground truncate">
                {player.name}
              </h2>
              <span className="text-xs text-[var(--accent-secondary)]">{player.role}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Scrollable Content */}
      {isExpanded && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            
            {/* Vitals */}
            <SidebarSection title="Vitals" icon={<Heart size={12} />}>
              <VitalBar 
                label="Health" 
                current={player.vitals.health} 
                max={player.vitals.maxHealth} 
                color="health" 
                icon={<span className="text-xs">❤️</span>}
              />
              <VitalBar 
                label="Energy" 
                current={player.vitals.energy} 
                max={100} 
                color="energy" 
                icon={<span className="text-xs">⚡</span>}
              />
              <VitalBar 
                label="Stress" 
                current={player.vitals.stress} 
                max={100} 
                color="stress" 
                icon={<span className="text-xs">😰</span>}
              />
              
              {/* Wounds */}
              {player.wounds && player.wounds.length > 0 && (
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Wounds</span>
                  <div className="flex flex-wrap gap-1">
                    {player.wounds.map((wound, i) => (
                      <WoundTag key={wound.id || i} wound={wound} />
                    ))}
                  </div>
                </div>
              )}
            </SidebarSection>
            
            {/* Needs */}
            <SidebarSection title="Needs" icon={<Droplet size={12} />} collapsible>
              <NeedBar label="Hunger" value={100 - player.needs.hunger} icon="🍖" />
              <NeedBar label="Thirst" value={100 - player.needs.thirst} icon="💧" />
              <NeedBar label="Hygiene" value={player.needs.hygiene} icon="🚿" />
              <NeedBar label="Rest" value={player.needs.rest} icon="😴" />
              {adultContent && player.needs.tension !== undefined && (
                <NeedBar label="Tension" value={player.needs.tension} icon="🔥" />
              )}
            </SidebarSection>
            
            {/* Attributes */}
            <SidebarSection title="Attributes" icon={<Swords size={12} />} collapsible>
              <StatDisplay 
                label="Strength" 
                value={getEffectiveStat('strength')} 
                base={player.stats.strength} 
                icon={<Swords size={10} />} 
              />
              <StatDisplay 
                label="Agility" 
                value={getEffectiveStat('agility')} 
                base={player.stats.agility} 
                icon={<Zap size={10} />} 
              />
              <StatDisplay 
                label="Intelligence" 
                value={getEffectiveStat('intelligence')} 
                base={player.stats.intelligence} 
                icon={<Brain size={10} />} 
              />
              <StatDisplay 
                label="Charisma" 
                value={getEffectiveStat('charisma')} 
                base={player.stats.charisma} 
                icon={<MessageCircle size={10} />} 
              />
              <StatDisplay 
                label="Perception" 
                value={getEffectiveStat('perception')} 
                base={player.stats.perception} 
                icon={<Eye size={10} />} 
              />
              <StatDisplay 
                label="Endurance" 
                value={getEffectiveStat('endurance')} 
                base={player.stats.endurance} 
                icon={<Shield size={10} />} 
              />
            </SidebarSection>
            
            {/* Inventory */}
            <SidebarSection title="Inventory" icon={<Package size={12} />} collapsible>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="flex items-center gap-1 text-amber-400">
                  <Coins size={12} />
                  {player.inventory.gold}
                </span>
                <span className="text-muted-foreground">
                  {player.inventory.currentWeight}/{player.inventory.maxWeight}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {player.inventory.items.slice(0, 10).map((item, i) => (
                  <InventorySlot key={item.id || i} item={item} />
                ))}
                {Array.from({ length: Math.max(0, 10 - player.inventory.items.length) }).map((_, i) => (
                  <InventorySlot key={`empty-${i}`} />
                ))}
              </div>
            </SidebarSection>
            
          </div>
        </ScrollArea>
      )}
    </aside>
  );
};

export default EnhancedPlayerSidebar;
