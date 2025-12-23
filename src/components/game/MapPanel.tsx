import { useState } from 'react';
import { GameState } from '@/types/game';
import { 
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Home,
  Trees,
  Warehouse,
  BookOpen,
  ShoppingBag,
  Utensils,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface MapPanelProps {
  gameState: GameState;
  isOpen: boolean;
  onToggle: () => void;
  onTravel: (locationId: string) => void;
}

interface ZoneData {
  id: string;
  name: string;
  icon: React.ElementType;
  locations: string[];
  color: string;
}

const ZONES: ZoneData[] = [
  {
    id: 'university',
    name: 'University District',
    icon: BookOpen,
    locations: ['university_district', 'campus_quad', 'student_housing', 'university_library'],
    color: 'text-blue-400',
  },
  {
    id: 'residential',
    name: 'Residential Area',
    icon: Home,
    locations: ['mid_residential', 'family_home', 'local_park', 'corner_store'],
    color: 'text-green-400',
  },
  {
    id: 'downtown',
    name: 'Downtown',
    icon: Building2,
    locations: ['town_square', 'market', 'tavern_main'],
    color: 'text-amber-400',
  },
  {
    id: 'tavern',
    name: 'The Rusty Nail',
    icon: Utensils,
    locations: ['tavern_main', 'tavern_kitchen', 'tavern_upstairs'],
    color: 'text-orange-400',
  },
  {
    id: 'decaying',
    name: 'Decaying Sector',
    icon: Warehouse,
    locations: ['decaying_sector', 'underbridge', 'soup_kitchen', 'abandoned_warehouse'],
    color: 'text-red-400',
  },
  {
    id: 'other',
    name: 'Other Areas',
    icon: Trees,
    locations: ['alley'],
    color: 'text-purple-400',
  },
];

export function MapPanel({ gameState, isOpen, onToggle, onTravel }: MapPanelProps) {
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>(() => {
    // Start with the zone containing current location expanded
    const currentLoc = gameState.player.currentLocation;
    const result: Record<string, boolean> = {};
    ZONES.forEach(zone => {
      result[zone.id] = zone.locations.includes(currentLoc);
    });
    return result;
  });

  const { player, locations } = gameState;
  const currentLocation = locations[player.currentLocation];
  const connectedLocations = currentLocation?.connectedLocations || [];

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const getLocationIcon = (locId: string) => {
    if (locId.includes('tavern')) return Utensils;
    if (locId.includes('university') || locId.includes('library') || locId.includes('campus')) return BookOpen;
    if (locId.includes('home') || locId.includes('residential') || locId.includes('housing')) return Home;
    if (locId.includes('market') || locId.includes('store')) return ShoppingBag;
    if (locId.includes('warehouse') || locId.includes('underbridge') || locId.includes('decaying')) return Warehouse;
    if (locId.includes('park')) return Trees;
    return Building2;
  };

  const canTravelTo = (locId: string): boolean => {
    return connectedLocations.includes(locId);
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed top-16 z-50 bg-card/90 backdrop-blur-sm border border-border shadow-lg hover:bg-secondary transition-all",
          isOpen ? "right-64 sm:right-72" : "right-2"
        )}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
      
      {/* Panel */}
      <aside 
        className={cn(
          "fixed right-0 top-12 h-[calc(100vh-48px)] z-40 bg-card border-l border-border transition-transform duration-300 ease-in-out overflow-hidden",
          "w-64 sm:w-72",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border bg-parchment-dark">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-narrative text-gradient-gold glow-text">
                World Map
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Click to travel</p>
          </div>
          
          {/* Current Location */}
          <div className="p-3 sm:p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Current:</span>
            </div>
            <p className="font-medium text-sm mt-1 truncate">{currentLocation?.name}</p>
          </div>
          
          {/* Zone-based Map */}
          <div className="p-2">
            {ZONES.map((zone) => {
              const zoneLocations = zone.locations.filter(locId => locations[locId]);
              if (zoneLocations.length === 0) return null;
              
              const hasCurrentLocation = zone.locations.includes(player.currentLocation);
              const ZoneIcon = zone.icon;
              
              return (
                <Collapsible 
                  key={zone.id} 
                  open={expandedZones[zone.id]} 
                  onOpenChange={() => toggleZone(zone.id)}
                >
                  <CollapsibleTrigger className={cn(
                    "w-full p-2 rounded-md flex items-center justify-between hover:bg-muted/50 transition-colors",
                    hasCurrentLocation && "bg-primary/10"
                  )}>
                    <div className="flex items-center gap-2">
                      <ZoneIcon className={cn("h-4 w-4", zone.color)} />
                      <span className="text-sm font-medium">{zone.name}</span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedZones[zone.id] && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="ml-6 space-y-1 py-1">
                      {zoneLocations.map((locId) => {
                        const location = locations[locId];
                        if (!location) return null;
                        
                        const isCurrent = player.currentLocation === locId;
                        const canTravel = canTravelTo(locId);
                        const LocIcon = getLocationIcon(locId);
                        
                        return (
                          <button
                            key={locId}
                            type="button"
                            onClick={() => canTravel && onTravel(locId)}
                            disabled={isCurrent || !canTravel}
                            className={cn(
                              "w-full p-2 rounded text-left flex items-center gap-2 transition-all text-sm",
                              isCurrent && "bg-primary/20 text-primary border border-primary/30",
                              canTravel && !isCurrent && "hover:bg-muted/50 cursor-pointer",
                              !canTravel && !isCurrent && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <LocIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{location.name.split(' - ')[0]}</span>
                            {isCurrent && (
                              <span className="ml-auto text-xs text-primary">(Here)</span>
                            )}
                            {canTravel && !isCurrent && (
                              <span className="ml-auto text-xs text-muted-foreground">→</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="p-3 sm:p-4 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground mb-2">Legend:</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
                <span>Current location</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">→</span>
                <span>Can travel to</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted/30 opacity-40" />
                <span>Not connected</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
