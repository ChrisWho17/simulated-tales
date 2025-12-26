// Inventory Command Palette - View items from the object registry
import { useState, useEffect, useCallback } from 'react';
import { Package, Search, X, Backpack, Shirt, Sword, Key, Gem, FlaskConical, Boxes, MoreHorizontal, User, MapPin, ArrowRight } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getInventory,
  getObjectRegistry,
  WorldObject,
  ObjectOwnership,
} from '@/game/objectRegistrySystem';
import { getRegisteredNPC, getAllRegisteredNPCs } from '@/game/npcIdentityRegistry';

interface InventoryCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Icon mapping for object types
const TYPE_ICONS: Record<string, typeof Package> = {
  weapon: Sword,
  accessory: Gem,
  consumable: FlaskConical,
  key_item: Key,
  currency: Gem,
  material: Boxes,
  equipment: Shirt,
  misc: MoreHorizontal,
};

// Color mapping for object types
const TYPE_COLORS: Record<string, string> = {
  weapon: 'text-red-400',
  accessory: 'text-purple-400',
  consumable: 'text-green-400',
  key_item: 'text-yellow-400',
  currency: 'text-amber-400',
  material: 'text-blue-400',
  equipment: 'text-cyan-400',
  misc: 'text-muted-foreground',
};

// Badge variants for ownership
const OWNER_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  player: 'default',
  npc: 'secondary',
  location: 'outline',
  container: 'outline',
};

function getOwnerName(ownership: ObjectOwnership): string {
  if (ownership.type === 'player') return 'You';
  if (ownership.type === 'npc') {
    const npc = getRegisteredNPC(ownership.id);
    return npc?.permanent.name || ownership.id;
  }
  if (ownership.type === 'location') return ownership.id;
  if (ownership.type === 'container') return `Container: ${ownership.id}`;
  return ownership.id;
}

function getConditionColor(condition: number): string {
  if (condition >= 80) return 'text-green-400';
  if (condition >= 50) return 'text-yellow-400';
  if (condition >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export function InventoryCommandPalette({ open, onOpenChange }: InventoryCommandPaletteProps) {
  const [playerItems, setPlayerItems] = useState<WorldObject[]>([]);
  const [worldItems, setWorldItems] = useState<{ item: WorldObject; owner: ObjectOwnership }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refresh inventory when opened
  useEffect(() => {
    if (open) {
      const registry = getObjectRegistry();
      
      // Get player inventory
      const pItems = getInventory('player', 'player');
      setPlayerItems(pItems);
      
      // Get all other items in the world
      const others: { item: WorldObject; owner: ObjectOwnership }[] = [];
      for (const [objId, obj] of Object.entries(registry.objects)) {
        const ownership = registry.ownership[objId];
        if (ownership && ownership.type !== 'player' && ownership.type !== 'destroyed') {
          others.push({ item: obj, owner: ownership });
        }
      }
      setWorldItems(others);
    }
  }, [open]);
  
  // Filter items based on search
  const filteredPlayerItems = playerItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredWorldItems = worldItems.filter(({ item }) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleItemClick = useCallback((item: WorldObject) => {
    // Could be extended to show item details or perform actions
    console.log('[Inventory] Selected item:', item);
  }, []);
  
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <Backpack className="mr-2 h-4 w-4 shrink-0 opacity-70" />
        <input
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <ScrollArea className="max-h-[400px]">
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-50" />
              <p>No items found.</p>
              <p className="text-xs mt-1">Items will appear here when acquired in-game.</p>
            </div>
          </CommandEmpty>
          
          {/* Player Inventory */}
          {filteredPlayerItems.length > 0 && (
            <CommandGroup heading="Your Inventory">
              {filteredPlayerItems.map((item) => {
                const Icon = TYPE_ICONS[item.type] || Package;
                const colorClass = TYPE_COLORS[item.type] || 'text-muted-foreground';
                
                return (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => handleItemClick(item)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className={`p-2 rounded-md bg-muted/50 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.type.replace('_', ' ')}
                        </Badge>
                        {item.properties.unique && (
                          <Badge variant="secondary" className="text-xs">
                            Unique
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    
                    {item.condition < 100 && (
                      <div className={`text-xs ${getConditionColor(item.condition)}`}>
                        {item.condition}%
                      </div>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          
          {filteredPlayerItems.length > 0 && filteredWorldItems.length > 0 && (
            <CommandSeparator />
          )}
          
          {/* World Items (with ownership) */}
          {filteredWorldItems.length > 0 && (
            <CommandGroup heading="Items in the World">
              {filteredWorldItems.map(({ item, owner }) => {
                const Icon = TYPE_ICONS[item.type] || Package;
                const colorClass = TYPE_COLORS[item.type] || 'text-muted-foreground';
                const ownerName = getOwnerName(owner);
                
                return (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => handleItemClick(item)}
                    className="flex items-center gap-3 py-3 opacity-75"
                  >
                    <div className={`p-2 rounded-md bg-muted/30 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        {owner.type === 'npc' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        <span>Held by {ownerName}</span>
                      </div>
                    </div>
                    
                    <Badge variant={OWNER_BADGE_VARIANTS[owner.type]} className="text-xs capitalize">
                      {owner.type}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          
          {/* Empty state for player inventory specifically */}
          {filteredPlayerItems.length === 0 && filteredWorldItems.length > 0 && !searchQuery && (
            <CommandGroup heading="Your Inventory">
              <div className="flex items-center gap-2 px-2 py-4 text-muted-foreground text-sm">
                <Backpack className="h-4 w-4" />
                <span>Your inventory is empty. Acquire items during your adventure!</span>
              </div>
            </CommandGroup>
          )}
        </CommandList>
      </ScrollArea>
      
      {/* Footer with stats */}
      <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Backpack className="h-3 w-3" />
            {playerItems.length} item{playerItems.length !== 1 ? 's' : ''} owned
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {worldItems.length} in world
          </span>
        </div>
        <span className="opacity-50">Press ESC to close</span>
      </div>
    </CommandDialog>
  );
}
