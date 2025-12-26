// ============================================================================
// LOADOUT SCREEN - Character creation starting gear selection
// ============================================================================

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check, X, Package, Plus, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { 
  GenreLoadout, 
  LoadoutItem, 
  ItemCategory,
  getLoadoutForGenres,
  calculateLoadoutCost,
  buildPortraitDataFromLoadout,
  getCurrencyIcon,
  ITEM_CATEGORIES,
} from '@/game/loadoutSystem';
import { customItemManager, getCategoryOptions } from '@/game/customItemManager';
import { RPGCharacter } from '@/types/rpgCharacter';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadoutResult {
  selectedItems: LoadoutItem[];
  customItems: LoadoutItem[];
  totalCost: number;
  remainingCurrency: number;
  portraitData: Array<{ prompt: string; category: ItemCategory; position: string }>;
}

interface LoadoutScreenProps {
  selectedGenres: string[];
  character: RPGCharacter;
  onComplete: (result: LoadoutResult) => void;
  onBack: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LoadoutScreen({ selectedGenres, character, onComplete, onBack }: LoadoutScreenProps) {
  const loadout = useMemo(() => getLoadoutForGenres(selectedGenres), [selectedGenres]);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<LoadoutItem[]>([]);
  const [customItemInput, setCustomItemInput] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [pendingCustomItem, setPendingCustomItem] = useState<{ name: string; detectedCategory: ItemCategory } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('misc');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all items from loadout categories
  const allLoadoutItems = useMemo(() => {
    const items: LoadoutItem[] = [];
    for (const cat of Object.values(loadout.categories)) {
      items.push(...cat.options);
    }
    return items;
  }, [loadout]);

  // Calculate costs
  const { totalCost, selectedItems } = useMemo(() => {
    const selected = selectedItemIds
      .map(id => allLoadoutItems.find(item => item.id === id))
      .filter((item): item is LoadoutItem => item !== undefined);
    
    const allSelected = [...selected, ...customItems];
    const cost = calculateLoadoutCost(allSelected);
    
    return { totalCost: cost, selectedItems: allSelected };
  }, [selectedItemIds, customItems, allLoadoutItems]);

  const remainingCurrency = loadout.startingCurrency - totalCost;

  // Handle custom item creation with Enter key
  const handleCustomItemKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customItemInput.trim()) {
      e.preventDefault();
      
      const itemName = customItemInput.trim();
      const detectedCategory = customItemManager.detectCategory(itemName);
      
      // Show category picker for confirmation/override
      setPendingCustomItem({ name: itemName, detectedCategory });
      setSelectedCategory(detectedCategory);
      setShowCategoryPicker(true);
    }
  }, [customItemInput]);

  // Confirm custom item creation
  const confirmCustomItem = useCallback(() => {
    if (!pendingCustomItem) return;

    const newItem = customItemManager.createCustomItem(
      pendingCustomItem.name,
      selectedCategory,
      '',
      0
    );

    setCustomItems(prev => [...prev, newItem]);
    setCustomItemInput('');
    setPendingCustomItem(null);
    setShowCategoryPicker(false);
    setSelectedCategory('misc');
  }, [pendingCustomItem, selectedCategory]);

  // Cancel custom item
  const cancelCustomItem = useCallback(() => {
    setPendingCustomItem(null);
    setShowCategoryPicker(false);
    setSelectedCategory('misc');
    setCustomItemInput('');
  }, []);

  // Remove custom item
  const removeCustomItem = useCallback((itemId: string) => {
    customItemManager.removeCustomItem(itemId);
    setCustomItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  // Toggle standard item selection
  const toggleItem = useCallback((itemId: string, categoryKey: string) => {
    const cat = loadout.categories[categoryKey];
    const item = cat.options.find(o => o.id === itemId);
    if (!item) return;

    if (selectedItemIds.includes(itemId)) {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    } else {
      // Check slot limits
      const currentInCategory = selectedItemIds.filter(id =>
        cat.options.some(o => o.id === id)
      ).length;

      if (currentInCategory >= cat.maxSlots) {
        // Replace oldest item in category
        const toRemove = selectedItemIds.find(id => cat.options.some(o => o.id === id));
        setSelectedItemIds(prev => [...prev.filter(id => id !== toRemove), itemId]);
      } else if (remainingCurrency >= (item.cost || 0)) {
        setSelectedItemIds(prev => [...prev, itemId]);
      }
    }
  }, [selectedItemIds, loadout, remainingCurrency]);

  // Apply preset
  const applyPreset = useCallback((preset: { items: string[]; cost: number }) => {
    if (loadout.startingCurrency >= preset.cost) {
      setSelectedItemIds(preset.items);
    }
  }, [loadout.startingCurrency]);

  // Complete loadout selection
  const handleComplete = useCallback(() => {
    const portraitData = buildPortraitDataFromLoadout(selectedItems);
    
    onComplete({
      selectedItems,
      customItems,
      totalCost,
      remainingCurrency,
      portraitData,
    });
  }, [selectedItems, customItems, totalCost, remainingCurrency, onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 glass-panel border-b border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Choose Your Starting Gear</h1>
              <p className="text-sm text-muted-foreground">{loadout.name}</p>
            </div>
          </div>
          
          {/* Currency Display */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full glass-panel-subtle ${remainingCurrency < 0 ? 'border-destructive/50 text-destructive' : ''}`}>
            <span className="text-lg">{loadout.currencyIcon}</span>
            <span className="font-mono font-bold text-lg">{remainingCurrency}</span>
            <span className="text-sm text-muted-foreground">{loadout.currency} remaining</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Custom Item Input */}
          <Card className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Add Custom Item</h3>
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type item name and press Enter..."
                value={customItemInput}
                onChange={(e) => setCustomItemInput(e.target.value)}
                onKeyDown={handleCustomItemKeyDown}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to add. Category is auto-detected.
            </p>

            {/* Custom Items List */}
            {customItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {customItems.map(item => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="flex items-center gap-2 py-1.5 px-3"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ITEM_CATEGORIES[item.category]?.label}
                    </span>
                    <button
                      onClick={() => removeCustomItem(item.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Loadouts */}
          {loadout.presets.length > 0 && (
            <Card className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Quick Loadouts</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {loadout.presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    disabled={loadout.startingCurrency < preset.cost}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${loadout.startingCurrency >= preset.cost 
                        ? 'border-border hover:border-primary/50 hover:bg-primary/5' 
                        : 'border-border/30 opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                    <div className="text-sm text-primary mt-1">
                      {preset.cost} {loadout.currency}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Categories */}
          {Object.entries(loadout.categories).map(([catKey, category]) => (
            <Card key={catKey} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <h3 className="font-semibold">{category.label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedItemIds.filter(id => category.options.some(o => o.id === id)).length}
                    /{category.maxSlots}
                  </span>
                </div>
                {category.required && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {category.options.map(item => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const canAfford = remainingCurrency >= (item.cost || 0) || isSelected;

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id, catKey)}
                      disabled={!canAfford}
                      className={`
                        p-3 rounded-lg border text-left transition-all relative
                        ${isSelected 
                          ? 'border-primary bg-primary/10' 
                          : canAfford
                            ? 'border-border hover:border-primary/50 hover:bg-primary/5'
                            : 'border-border/30 opacity-50 cursor-not-allowed'}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            {item.name}
                            {item.fromGenre && (
                              <Badge variant="outline" className="text-[10px] py-0">
                                {item.fromGenre}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-sm font-mono ${item.cost < 0 ? 'text-success' : ''}`}>
                          {item.cost < 0 ? `+${Math.abs(item.cost)}` : item.cost} {loadout.currency}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="sticky bottom-0 z-20 glass-panel border-t border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedItems.length} items selected
          </div>
          <Button
            onClick={handleComplete}
            disabled={remainingCurrency < 0}
            className="gap-2"
          >
            {remainingCurrency < 0 ? 'Over Budget!' : 'Continue to Portrait'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Picker Dialog */}
      <Dialog open={showCategoryPicker} onOpenChange={setShowCategoryPicker}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle>What type of item is "{pendingCustomItem?.name}"?</DialogTitle>
            <DialogDescription>
              Detected: {ITEM_CATEGORIES[pendingCustomItem?.detectedCategory || 'misc']?.label}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-2 py-4">
            {getCategoryOptions().map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  p-3 rounded-lg border text-center transition-all
                  ${selectedCategory === cat.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'}
                `}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs">{cat.label}</div>
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelCustomItem}>
              Cancel
            </Button>
            <Button onClick={confirmCustomItem}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
