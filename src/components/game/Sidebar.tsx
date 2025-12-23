import { forwardRef } from 'react';
import { GameState } from '@/types/game';
import { formatTime, getNPCsAtLocation } from '@/game/gameEngine';
import { 
  Heart, 
  Zap, 
  Smile, 
  Coins, 
  UtensilsCrossed,
  MapPin,
  Clock,
  Users,
  ChevronDown,
  Sword,
  Package
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface SidebarProps {
  gameState: GameState;
}

interface StatBarProps {
  icon: React.ElementType; 
  label: string; 
  value: number; 
  max?: number;
  color: string;
}

const StatBar = forwardRef<HTMLDivElement, StatBarProps>(({ 
  icon: Icon, 
  label, 
  value, 
  max = 100, 
  color 
}, ref) => {
  const percentage = (value / max) * 100;
  
  return (
    <div ref={ref} className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <span className="font-mono text-xs">{value}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
StatBar.displayName = 'StatBar';

export function Sidebar({ gameState }: SidebarProps) {
  const [npcsOpen, setNpcsOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  
  const { player, time, locations } = gameState;
  const currentLocation = locations[player.currentLocation];
  const npcsHere = getNPCsAtLocation(gameState, player.currentLocation);
  
  return (
    <div className="h-full overflow-y-auto bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-parchment-dark">
        <h2 className="text-xl font-narrative text-gradient-gold glow-text">
          {player.name}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Adventurer</p>
      </div>
      
      {/* Time & Location */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary animate-pulse-slow" />
          <span className="font-mono text-xs">{formatTime(time)}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-copper mt-0.5" />
          <div>
            <p className="font-medium">{currentLocation?.name}</p>
            <p className="text-xs text-muted-foreground">
              Exits: {currentLocation?.connectedLocations.map(id => 
                locations[id]?.name.split(' - ')[0] || id
              ).join(', ')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4 space-y-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vitals
        </h3>
        <StatBar 
          icon={Heart} 
          label="Health" 
          value={player.stats.health} 
          color="bg-blood"
        />
        <StatBar 
          icon={Zap} 
          label="Energy" 
          value={player.stats.energy} 
          color="bg-gold"
        />
        <StatBar 
          icon={UtensilsCrossed} 
          label="Hunger" 
          value={player.stats.hunger} 
          color="bg-copper"
        />
        <StatBar 
          icon={Smile} 
          label="Mood" 
          value={player.stats.mood} 
          color="bg-forest"
        />
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>Gold</span>
          </div>
          <span className="font-mono text-gold">{player.stats.wealth}</span>
        </div>
      </div>
      
      {/* NPCs Present */}
      <Collapsible open={npcsOpen} onOpenChange={setNpcsOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">People Here</span>
            <span className="text-xs text-muted-foreground">({npcsHere.length})</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${npcsOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {npcsHere.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No one else is here.</p>
            ) : (
              npcsHere.map(npc => {
                const rel = npc.relationships.player;
                const disposition = rel?.affection > 20 ? 'Friendly' : 
                                   rel?.affection < -20 ? 'Hostile' : 'Neutral';
                return (
                  <div 
                    key={npc.id} 
                    className="p-2 rounded bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{npc.meta.name}</span>
                      <span className={`text-xs ${
                        disposition === 'Friendly' ? 'text-forest' :
                        disposition === 'Hostile' ? 'text-blood' : 'text-muted-foreground'
                      }`}>
                        {disposition}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{npc.meta.occupation}</p>
                    <p className="text-xs text-muted-foreground/70 italic mt-1">
                      {npc.currentActivity}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <Separator />
      
      {/* Inventory */}
      <Collapsible open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-copper" />
            <span className="text-sm font-medium">Inventory</span>
            <span className="text-xs text-muted-foreground">({player.inventory.length})</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {player.inventory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Your pockets are empty.</p>
            ) : (
              player.inventory.map(item => (
                <div 
                  key={item.id} 
                  className="p-2 rounded bg-secondary/50 border border-border flex items-start gap-2"
                >
                  {item.type === 'weapon' ? (
                    <Sword className="h-4 w-4 text-blood mt-0.5" />
                  ) : (
                    <Package className="h-4 w-4 text-copper mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="text-xs text-gold">{item.value}g</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
