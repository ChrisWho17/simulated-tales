import { forwardRef, useState } from 'react';
import { GameState, NPC } from '@/types/game';
import { formatTime, getNPCsAtLocation } from '@/game/gameEngine';
import { 
  Heart, 
  Zap, 
  Coins, 
  UtensilsCrossed,
  MapPin,
  Clock,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sword,
  Package,
  Droplets,
  Sparkles,
  Brain,
  Home,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CharacterNameLink } from './CharacterNameLink';
import { 
  calculateRelationshipDisplay, 
  getShortRelLabel,
  RELATIONSHIP_COLORS 
} from '@/lib/relationshipSystem';
import { WoundDisplay } from './WoundDisplay';
import { Wound } from '@/lib/woundSystem';
import { getGameSettings } from '@/lib/gameSettings';

interface CharacterPanelProps {
  gameState: GameState;
  isOpen: boolean;
  onToggle: () => void;
  onStartConversation?: (npc: NPC) => void;
  wounds?: Wound[];
}

interface StatBarProps {
  icon: React.ElementType; 
  label: string; 
  value: number; 
  max?: number;
  color: string;
  compact?: boolean;
}

const StatBar = forwardRef<HTMLDivElement, StatBarProps>(({ 
  icon: Icon, 
  label, 
  value, 
  max = 100, 
  color,
  compact 
}, ref) => {
  const percentage = (value / max) * 100;
  
  if (compact) {
    return (
      <div ref={ref} className="flex items-center gap-1.5" title={`${label}: ${value}/${max}`}>
        <Icon className="h-3 w-3 text-muted-foreground" />
        <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
  
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

export function CharacterPanel({ gameState, isOpen, onToggle, onStartConversation, wounds = [] }: CharacterPanelProps) {
  const [npcsOpen, setNpcsOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [woundsOpen, setWoundsOpen] = useState(true);
  
  const { player, time, locations, lifeSim } = gameState;
  const currentLocation = locations[player.currentLocation];
  const npcsHere = getNPCsAtLocation(gameState, player.currentLocation);
  const settings = getGameSettings();
  const showTension = settings.adultContent;
  
  return (
    <>
      {/* Toggle button - always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed top-16 z-50 bg-card/90 backdrop-blur-sm border border-border shadow-lg hover:bg-secondary transition-all",
          isOpen ? "left-64 sm:left-72" : "left-2"
        )}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
      
      {/* Panel */}
      <aside 
        className={cn(
          "fixed left-0 top-12 h-[calc(100vh-48px)] z-40 bg-card border-r border-border transition-transform duration-300 ease-in-out overflow-hidden",
          "w-64 sm:w-72",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border bg-parchment-dark">
            <h2 className="text-lg sm:text-xl font-narrative text-gradient-gold glow-text">
              {player.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Adventurer</p>
          </div>
          
          {/* Time & Location */}
          <div className="p-3 sm:p-4 space-y-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary animate-pulse-slow" />
              <span className="font-mono text-xs">{formatTime(time)}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-copper mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{currentLocation?.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Exits: {currentLocation?.connectedLocations.map(id => 
                    locations[id]?.name.split(' - ')[0] || id
                  ).join(', ')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="p-3 sm:p-4 space-y-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vitals
            </h3>
            <StatBar 
              icon={Heart} 
              label="Health" 
              value={lifeSim?.needs.physical.health ?? player.stats.health} 
              color="bg-blood"
            />
            <StatBar 
              icon={Zap} 
              label="Energy" 
              value={lifeSim?.needs.physical.energy ?? player.stats.energy} 
              color="bg-gold"
            />
            <StatBar 
              icon={UtensilsCrossed} 
              label="Hunger" 
              value={lifeSim?.needs.physical.hunger ?? player.stats.hunger} 
              color="bg-copper"
            />
            <StatBar 
              icon={Droplets} 
              label="Thirst" 
              value={lifeSim?.needs.physical.thirst ?? 80} 
              color="bg-sky-500"
            />
            <StatBar 
              icon={Sparkles} 
              label="Hygiene" 
              value={lifeSim?.needs.physical.hygiene ?? 80} 
              color="bg-purple-400"
            />
            <StatBar 
              icon={Brain} 
              label="Stress" 
              value={100 - (lifeSim?.needs.psychological.stress ?? 20)} 
              color="bg-forest"
            />
            {/* Tension need - only visible with 18+ content enabled */}
            {showTension && (
              <StatBar 
                icon={Flame} 
                label="Tension" 
                value={lifeSim?.needs.psychological.tension ?? 50} 
                color="bg-pink-500"
              />
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                <span>Gold</span>
              </div>
              <span className="font-mono text-gold">{lifeSim?.economy.money ?? player.stats.wealth}</span>
            </div>
            {lifeSim && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-3.5 w-3.5" />
                  <span>Housing</span>
                </div>
                <span className="text-xs capitalize">{lifeSim.home?.type.replace('_', ' ') ?? 'None'}</span>
              </div>
            )}
            
            {/* Wound display */}
            {wounds.length > 0 && (
              <div className="pt-2 border-t border-border">
                <WoundDisplay wounds={wounds} compact />
              </div>
            )}
          </div>
          
          {/* NPCs Present */}
          <Collapsible open={npcsOpen} onOpenChange={setNpcsOpen}>
            <CollapsibleTrigger className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">People Here</span>
                <span className="text-xs text-muted-foreground">({npcsHere.length})</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${npcsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                {npcsHere.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No one else is here.</p>
                ) : (
                  npcsHere.map(npc => {
                    const relData = calculateRelationshipDisplay(npc);
                    const colors = RELATIONSHIP_COLORS[relData.displayColor];
                    
                    return (
                      <div 
                        key={npc.id} 
                        className="npc-sidebar-card"
                        style={{
                          '--card-rel-primary': colors.primary,
                          '--card-rel-glow': colors.glow,
                        } as React.CSSProperties}
                      >
                        {/* Left relationship bar */}
                        <div 
                          className="npc-rel-bar"
                          style={{ background: colors.gradient }}
                        />
                        
                        <div className="flex items-center justify-between flex-1 ml-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CharacterNameLink 
                                npc={npc} 
                                className="font-medium text-sm"
                                onStartConversation={onStartConversation}
                                playerLocation={player.currentLocation}
                              />
                              {/* Romance heart indicator */}
                              {relData.romanceUnlocked && relData.romance > 20 && (
                                <Heart 
                                  className="h-3 w-3" 
                                  style={{ color: colors.primary, fill: relData.romance > 50 ? colors.primary : 'none' }}
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{npc.meta.occupation}</p>
                            <p className="text-xs text-muted-foreground/70 italic mt-0.5 line-clamp-1">
                              {npc.currentActivity}
                            </p>
                          </div>
                          
                          {/* Relationship indicator */}
                          <div className="flex flex-col items-center gap-1 ml-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ 
                                background: colors.gradient,
                                boxShadow: `0 0 8px ${colors.glow}`
                              }}
                            />
                            <span className="text-sm">{getShortRelLabel(relData)}</span>
                          </div>
                        </div>
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
            <CollapsibleTrigger className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-copper" />
                <span className="text-sm font-medium">Inventory</span>
                <span className="text-xs text-muted-foreground">({player.inventory.length})</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                {player.inventory.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Your pockets are empty.</p>
                ) : (
                  player.inventory.map(item => (
                    <div 
                      key={item.id} 
                      className="p-2 rounded bg-secondary/50 border border-border flex items-start gap-2"
                    >
                      {item.type === 'weapon' ? (
                        <Sword className="h-4 w-4 text-blood mt-0.5 shrink-0" />
                      ) : (
                        <Package className="h-4 w-4 text-copper mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          <span className="text-xs text-gold shrink-0">{item.value}g</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </aside>
    </>
  );
}
