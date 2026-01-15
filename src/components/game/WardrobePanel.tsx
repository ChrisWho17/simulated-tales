// Wardrobe Panel - View and equip owned clothing items

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shirt, 
  Crown, 
  Shield, 
  Sparkles, 
  CheckCircle, 
  Star,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { wardrobeManager, WardrobeItem, WardrobeState } from '@/game/wardrobeSystem';
import { fashionReputationManager, FashionReputation } from '@/game/fashionReputationSystem';
import { ClothingSlot, getRarityColor, getRarityBgColor, getStatDescription } from '@/game/clothingItemSystem';

interface WardrobePanelProps {
  trigger?: React.ReactNode;
}

export function WardrobePanel({ trigger }: WardrobePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeState>(wardrobeManager.getState());
  const [reputation, setReputation] = useState<FashionReputation>(fashionReputationManager.getState());
  const [activeTab, setActiveTab] = useState<string>('equipped');

  useEffect(() => {
    const unsubWardrobe = wardrobeManager.subscribe(setWardrobe);
    const unsubRep = fashionReputationManager.subscribe(setReputation);
    return () => {
      unsubWardrobe();
      unsubRep();
    };
  }, []);

  const levelInfo = fashionReputationManager.getLevelInfo();
  const equippedList = wardrobeManager.getEquippedList();
  const currentStats = wardrobeManager.getCurrentStats();

  const handleEquip = (itemId: string) => {
    wardrobeManager.equip(itemId);
  };

  const handleUnequip = (slot: ClothingSlot) => {
    wardrobeManager.unequip(slot);
  };

  const slotOrder: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'accessory', 'outfit'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Shirt className="w-4 h-4" />
            Wardrobe
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shirt className="w-5 h-5" />
            Wardrobe
          </DialogTitle>
        </DialogHeader>

        {/* Fashion Reputation Summary */}
        <div className={cn(
          "p-3 rounded-lg border mb-4",
          reputation.level === 'fashion_icon' ? 'bg-warning/10 border-warning/30' :
          reputation.level === 'fashionable' ? 'bg-primary/10 border-primary/30' :
          reputation.level === 'well_dressed' ? 'bg-success/10 border-success/30' :
          reputation.level === 'poorly_dressed' ? 'bg-orange-500/10 border-orange-500/30' :
          reputation.level === 'fashion_disaster' ? 'bg-destructive/10 border-destructive/30' :
          'bg-muted/30 border-border'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{levelInfo.icon}</span>
              <div>
                <div className={cn("font-medium text-sm", levelInfo.color)}>
                  {levelInfo.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {levelInfo.description}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{reputation.score}</div>
              <div className="text-xs text-muted-foreground">Reputation</div>
            </div>
          </div>
          {reputation.streak > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-success">
              <TrendingUp className="w-3 h-3" />
              {reputation.streak} interaction streak!
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipped">
              <CheckCircle className="w-4 h-4 mr-1" />
              Equipped
            </TabsTrigger>
            <TabsTrigger value="collection">
              <Crown className="w-4 h-4 mr-1" />
              Collection ({wardrobe.ownedItems.length})
            </TabsTrigger>
            <TabsTrigger value="perks">
              <Award className="w-4 h-4 mr-1" />
              Perks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipped" className="mt-4">
            <ScrollArea className="h-[350px] pr-2">
              {/* Current Stats from Clothing */}
              {Object.keys(currentStats).length > 0 && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Active Bonuses
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(currentStats).map(([stat, value]) => (
                      <TooltipProvider key={stat}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "text-xs px-2 py-1 rounded flex justify-between",
                              (value as number) > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            )}>
                              <span className="capitalize">{stat}</span>
                              <span>{(value as number) > 0 ? '+' : ''}{value}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getStatDescription(stat as any)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipped Slots */}
              <div className="space-y-2">
                {slotOrder.map(slot => {
                  const equipped = wardrobe.equipped[slot];
                  
                  return (
                    <div
                      key={slot}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        equipped ? getRarityBgColor(equipped.item.rarity) : "bg-muted/20 border-dashed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase text-muted-foreground w-16">
                            {slot}
                          </span>
                          {equipped ? (
                            <div>
                              <div className={cn("font-medium text-sm", getRarityColor(equipped.item.rarity))}>
                                {equipped.item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {equipped.item.style} style
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Empty</span>
                          )}
                        </div>
                        {equipped && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnequip(slot)}
                            className="text-xs"
                          >
                            Unequip
                          </Button>
                        )}
                      </div>
                      
                      {/* Show item stats */}
                      {equipped && Object.keys(equipped.item.stats).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(equipped.item.stats).map(([stat, value]) => {
                            if (stat === 'genreBonus') return null;
                            return (
                              <span 
                                key={stat}
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  (value as number) > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                )}
                              >
                                {stat}: {(value as number) > 0 ? '+' : ''}{value}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="collection" className="mt-4">
            <ScrollArea className="h-[350px] pr-2">
              {wardrobe.ownedItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No clothing items collected yet</p>
                  <p className="text-xs mt-1">Find, buy, or loot items to add to your wardrobe</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {wardrobe.ownedItems.map((wi) => {
                    const isEquipped = equippedList.some(e => e.item.id === wi.item.id);
                    
                    return (
                      <div
                        key={wi.item.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          getRarityBgColor(wi.item.rarity),
                          isEquipped && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium", getRarityColor(wi.item.rarity))}>
                                {wi.item.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {wi.item.slot}
                              </Badge>
                              {wi.item.rarity !== 'common' && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs", getRarityColor(wi.item.rarity))}
                                >
                                  {wi.item.rarity}
                                </Badge>
                              )}
                              {isEquipped && (
                                <CheckCircle className="w-4 h-4 text-success" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {wi.item.description}
                            </p>
                            
                            {/* Stats */}
                            {Object.keys(wi.item.stats).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(wi.item.stats).map(([stat, value]) => {
                                  if (stat === 'genreBonus') return null;
                                  return (
                                    <span 
                                      key={stat}
                                      className={cn(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        (value as number) > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                      )}
                                    >
                                      {stat}: {(value as number) > 0 ? '+' : ''}{value}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {!isEquipped && (
                            <Button
                              size="sm"
                              onClick={() => handleEquip(wi.item.id)}
                            >
                              Equip
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="perks" className="mt-4">
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-4">
                {/* Unlocked Perks */}
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-success" />
                    Unlocked Perks
                  </div>
                  {fashionReputationManager.getUnlockedPerks().length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Improve your fashion reputation to unlock perks!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {fashionReputationManager.getUnlockedPerks().map(perk => (
                        <div 
                          key={perk.id}
                          className="p-2 rounded bg-success/10 border border-success/30"
                        >
                          <div className="font-medium text-sm text-success">{perk.name}</div>
                          <div className="text-xs text-muted-foreground">{perk.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Locked Perks */}
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    Locked Perks
                  </div>
                  <div className="space-y-2">
                    {fashionReputationManager.getLockedPerks().map(perk => (
                      <div 
                        key={perk.id}
                        className="p-2 rounded bg-muted/30 border border-border opacity-60"
                      >
                        <div className="font-medium text-sm">{perk.name}</div>
                        <div className="text-xs text-muted-foreground">{perk.description}</div>
                        <div className="text-xs text-primary mt-1">
                          Requires: {perk.requiredLevel.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
