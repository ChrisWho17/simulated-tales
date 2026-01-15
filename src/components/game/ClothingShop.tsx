// Clothing Shop Component - Browse and buy clothing based on reputation
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Crown, 
  Star, 
  Lock, 
  Check, 
  ChevronDown,
  Shirt,
  Shield,
  Eye,
  Sparkles,
  Zap,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ClothingItem,
  ClothingSlot,
  ClothingStats,
  CLOTHING_DATABASE,
  getShopInventory,
  getRarityColor,
  getRarityBgColor,
  getStatDescription,
} from '@/game/clothingItemSystem';
import { wardrobeManager } from '@/game/wardrobeSystem';
import { fashionReputationManager, FASHION_LEVELS } from '@/game/fashionReputationSystem';

interface ClothingShopProps {
  playerGold: number;
  playerLevel?: number;
  onPurchase: (item: ClothingItem, finalPrice: number) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SLOT_ICONS: Record<ClothingSlot, React.ReactNode> = {
  head: <Crown className="w-4 h-4" />,
  torso: <Shirt className="w-4 h-4" />,
  legs: <span className="text-xs">👖</span>,
  feet: <span className="text-xs">👟</span>,
  hands: <span className="text-xs">🧤</span>,
  accessory: <Star className="w-4 h-4" />,
  outfit: <Sparkles className="w-4 h-4" />,
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  charisma: <Heart className="w-3 h-3 text-pink-500" />,
  intimidation: <Zap className="w-3 h-3 text-red-500" />,
  defense: <Shield className="w-3 h-3 text-blue-500" />,
  stealth: <Eye className="w-3 h-3 text-purple-500" />,
  perception: <Eye className="w-3 h-3 text-amber-500" />,
  luck: <Star className="w-3 h-3 text-yellow-500" />,
};

export function ClothingShop({
  playerGold,
  playerLevel = 1,
  onPurchase,
  isOpen,
  onOpenChange,
}: ClothingShopProps) {
  const [selectedSlot, setSelectedSlot] = useState<ClothingSlot | 'all'>('all');
  const [fashionState, setFashionState] = useState(fashionReputationManager.getState());
  const [wardrobeState, setWardrobeState] = useState(wardrobeManager.getState());

  useEffect(() => {
    const unsubFashion = fashionReputationManager.subscribe(setFashionState);
    const unsubWardrobe = wardrobeManager.subscribe(setWardrobeState);
    return () => {
      unsubFashion();
      unsubWardrobe();
    };
  }, []);

  const discount = fashionReputationManager.getDiscount();
  const fashionLevel = fashionReputationManager.getLevelInfo();

  const availableItems = useMemo(() => {
    const inventory = getShopInventory(playerLevel, fashionState.score);
    if (selectedSlot === 'all') return inventory;
    return inventory.filter(item => item.slot === selectedSlot);
  }, [playerLevel, fashionState.score, selectedSlot]);

  const lockedItems = useMemo(() => {
    return CLOTHING_DATABASE.filter(item => {
      if (!item.sources.includes('shop')) return false;
      if (item.requirements?.level && item.requirements.level > playerLevel) return true;
      if (item.requirements?.reputation && item.requirements.reputation > fashionState.score) return true;
      return false;
    }).slice(0, 5); // Show only first 5 locked items
  }, [playerLevel, fashionState.score]);

  const calculatePrice = (item: ClothingItem): number => {
    const basePrice = item.value;
    const discountAmount = Math.floor(basePrice * (discount / 100));
    return basePrice - discountAmount;
  };

  const canAfford = (item: ClothingItem): boolean => {
    return playerGold >= calculatePrice(item);
  };

  const alreadyOwned = (item: ClothingItem): boolean => {
    return wardrobeManager.hasItem(item.id);
  };

  const handlePurchase = (item: ClothingItem) => {
    const finalPrice = calculatePrice(item);
    if (canAfford(item) && !alreadyOwned(item)) {
      wardrobeManager.addItem(item, 'shop');
      onPurchase(item, finalPrice);
    }
  };

  const renderStats = (stats: ClothingStats) => {
    const entries = Object.entries(stats).filter(
      ([key, val]) => key !== 'genreBonus' && typeof val === 'number' && val !== 0
    );
    if (entries.length === 0) return <span className="text-muted-foreground text-xs">No stat bonuses</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {entries.map(([stat, value]) => (
          <TooltipProvider key={stat}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs gap-1 px-1.5">
                  {STAT_ICONS[stat]}
                  {value > 0 ? '+' : ''}{value as number}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium capitalize">{stat}: {value > 0 ? '+' : ''}{value as number}</p>
                <p className="text-xs text-muted-foreground">{getStatDescription(stat as keyof Omit<ClothingStats, 'genreBonus'>)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  const renderItemCard = (item: ClothingItem, isLocked: boolean = false) => {
    const owned = alreadyOwned(item);
    const affordable = canAfford(item);
    const price = calculatePrice(item);
    const originalPrice = item.value;
    const hasDiscount = discount > 0;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          relative p-3 rounded-lg border transition-all
          ${getRarityBgColor(item.rarity)}
          ${isLocked ? 'opacity-50' : 'hover:shadow-md'}
        `}
      >
        {/* Rarity indicator */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className={`text-xs ${getRarityColor(item.rarity)}`}>
            {item.rarity}
          </Badge>
        </div>

        {/* Slot icon */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-background/50 border">
            {SLOT_ICONS[item.slot]}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate pr-16">{item.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-2">
          {renderStats(item.stats)}
        </div>

        {/* Style badge */}
        <div className="mt-2">
          <Badge variant="outline" className="text-xs capitalize">
            {item.style}
          </Badge>
        </div>

        {/* Price and action */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount && !isLocked && (
              <span className="text-xs text-muted-foreground line-through">{originalPrice}g</span>
            )}
            <span className={`font-medium ${!affordable && !owned && !isLocked ? 'text-destructive' : ''}`}>
              {isLocked ? '???' : `${price}g`}
            </span>
            {hasDiscount && !isLocked && (
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                -{discount}%
              </Badge>
            )}
          </div>

          {isLocked ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="secondary" disabled className="gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Requires:</p>
                  {item.requirements?.level && <p>Level {item.requirements.level}</p>}
                  {item.requirements?.reputation && <p>Fashion Rep: {item.requirements.reputation}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : owned ? (
            <Button size="sm" variant="secondary" disabled className="gap-1">
              <Check className="w-3 h-3" /> Owned
            </Button>
          ) : (
            <Button
              size="sm"
              variant={affordable ? 'default' : 'secondary'}
              disabled={!affordable}
              onClick={() => handlePurchase(item)}
              className="gap-1"
            >
              <ShoppingBag className="w-3 h-3" />
              Buy
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  const shopContent = (
    <div className="flex flex-col h-full">
      {/* Header with reputation */}
      <div className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Fashion Boutique</h3>
            <p className="text-sm text-muted-foreground">Browse exclusive apparel</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-lg">{fashionLevel.icon}</span>
              <span className={`font-medium ${fashionLevel.color}`}>{fashionLevel.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">Rep: {fashionState.score}</p>
          </div>
        </div>

        {/* Discount banner */}
        {discount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-2 rounded-md bg-green-500/10 border border-green-500/30 text-green-500 text-sm"
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Fashion Insider: {discount}% discount on all items!
          </motion.div>
        )}

        {/* Gold display */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-amber-500">💰</span>
          <span className="font-medium">{playerGold} gold</span>
        </div>
      </div>

      {/* Slot filter */}
      <div className="py-3">
        <Tabs value={selectedSlot} onValueChange={(v) => setSelectedSlot(v as ClothingSlot | 'all')}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="head" className="text-xs gap-1">{SLOT_ICONS.head} Head</TabsTrigger>
            <TabsTrigger value="torso" className="text-xs gap-1">{SLOT_ICONS.torso} Torso</TabsTrigger>
            <TabsTrigger value="legs" className="text-xs">Legs</TabsTrigger>
            <TabsTrigger value="feet" className="text-xs">Feet</TabsTrigger>
            <TabsTrigger value="hands" className="text-xs">Hands</TabsTrigger>
            <TabsTrigger value="accessory" className="text-xs gap-1">{SLOT_ICONS.accessory} Acc.</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Items grid */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          <AnimatePresence mode="popLayout">
            {availableItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No items available in this category</p>
                <p className="text-xs">Increase your fashion reputation to unlock more!</p>
              </motion.div>
            ) : (
              availableItems.map(item => renderItemCard(item))
            )}
          </AnimatePresence>

          {/* Locked items preview */}
          {lockedItems.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Unlock with higher reputation
              </h4>
              <div className="space-y-3 opacity-60">
                {lockedItems.map(item => renderItemCard(item, true))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reputation progress */}
      <div className="pt-4 border-t mt-4">
        <div className="text-xs text-muted-foreground mb-2">Fashion Progress</div>
        <div className="flex items-center gap-1">
          {FASHION_LEVELS.map((level, idx) => (
            <TooltipProvider key={level.level}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      flex-1 h-2 rounded-full transition-all
                      ${fashionState.score >= level.minScore 
                        ? 'bg-primary' 
                        : 'bg-muted'
                      }
                    `}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{level.icon} {level.label}</p>
                  <p className="text-xs text-muted-foreground">Requires {level.minScore}+ rep</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );

  // If controlled externally
  if (typeof isOpen !== 'undefined') {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Clothing Shop</SheetTitle>
            <SheetDescription>Browse and purchase clothing items</SheetDescription>
          </SheetHeader>
          {shopContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Self-contained with trigger
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShoppingBag className="w-4 h-4" />
          Shop
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Clothing Shop</SheetTitle>
          <SheetDescription>Browse and purchase clothing items</SheetDescription>
        </SheetHeader>
        {shopContent}
      </SheetContent>
    </Sheet>
  );
}
