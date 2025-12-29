import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Plus, X, Sword, Shield, Heart, Key, 
  Sparkles, AlertCircle, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { GameGenre } from '@/types/genreData';
import { 
  STARTING_GEAR, 
  StartingGearItem,
  getGenreClasses
} from '@/game/storyInventoryBridge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StartingGearEditorProps {
  genre: GameGenre;
  characterClass: string;
  onGearChange: (gear: StartingGearItem[]) => void;
  initialGear?: StartingGearItem[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  weapons: <Sword className="w-4 h-4" />,
  apparel: <Shield className="w-4 h-4" />,
  aid: <Heart className="w-4 h-4" />,
  keyItems: <Key className="w-4 h-4" />,
  misc: <Package className="w-4 h-4" />,
  ammo: <Sparkles className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  weapons: 'Weapons',
  apparel: 'Armor & Clothing',
  aid: 'Medical & Consumables',
  keyItems: 'Key Items',
  misc: 'Miscellaneous',
  ammo: 'Ammunition',
};

// Map genre aliases to normalized genre keys
const normalizeGenre = (genre: string): string => {
  const genreMap: Record<string, string> = {
    'modern': 'war',
    'military': 'war',
    'scifi': 'scifi',
    'sci-fi': 'scifi',
    'post-apocalyptic': 'postapoc',
    'post_apocalyptic': 'postapoc',
    'post-apoc': 'postapoc',
    'medieval': 'fantasy',
    'dark_fantasy': 'fantasy',
    'lovecraftian': 'cosmic_horror',
    'slice_of_life': 'modern_life',
    'noir': 'mystery',
  };
  return genreMap[genre.toLowerCase()] || genre.toLowerCase();
};

export function StartingGearEditor({ genre, characterClass, onGearChange, initialGear }: StartingGearEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<StartingGearItem['category']>('misc');
  const [newItemDescription, setNewItemDescription] = useState('');
  
  // Get the base gear for this genre/class
  const baseGear = useMemo(() => {
    const normalizedGenre = normalizeGenre(genre);
    const genreGear = STARTING_GEAR[normalizedGenre] || STARTING_GEAR.fantasy;
    return genreGear[characterClass.toLowerCase()] || genreGear.default || [];
  }, [genre, characterClass]);
  
  // Track gear modifications
  const [gear, setGear] = useState<StartingGearItem[]>(initialGear || baseGear);
  
  // Reset gear when class changes
  useEffect(() => {
    if (!initialGear) {
      setGear(baseGear);
    }
  }, [baseGear, initialGear]);
  
  // Notify parent of changes
  useEffect(() => {
    onGearChange(gear);
  }, [gear, onGearChange]);
  
  const removeItem = (index: number) => {
    setGear(prev => prev.filter((_, i) => i !== index));
  };
  
  const addCustomItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: StartingGearItem = {
      name: newItemName.trim(),
      category: newItemCategory,
      description: newItemDescription.trim() || undefined,
    };
    
    setGear(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemDescription('');
    setShowAddItem(false);
  };
  
  const resetToDefault = () => {
    setGear(baseGear);
  };
  
  // Group gear by category
  const gearByCategory = useMemo(() => {
    const grouped: Record<string, StartingGearItem[]> = {};
    gear.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [gear]);
  
  const hasModifications = useMemo(() => {
    if (gear.length !== baseGear.length) return true;
    return gear.some((item, i) => item.name !== baseGear[i]?.name);
  }, [gear, baseGear]);
  
  return (
    <div className="space-y-3">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30 hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">Starting Gear</span>
          <Badge variant="outline" className="text-xs">
            {gear.length} items
          </Badge>
          {hasModifications && (
            <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
              Modified
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Customize your starting equipment. Remove items you don't want or add custom gear.
                This is optional - your class provides a balanced loadout by default.
              </span>
            </p>
          </div>
          
          {/* Gear List */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {Object.entries(gearByCategory).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                    {CATEGORY_ICONS[category]}
                    {CATEGORY_LABELS[category] || category}
                  </div>
                  <div className="space-y-1">
                    {items.map((item, idx) => {
                      const globalIndex = gear.findIndex(g => g === item);
                      return (
                        <div
                          key={`${item.name}-${idx}`}
                          className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/30 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">
                                {item.name}
                              </span>
                              {item.quantity && item.quantity > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  x{item.quantity}
                                </Badge>
                              )}
                              {item.autoEquip && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-equip
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(globalIndex)}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {gear.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No starting gear</p>
                  <p className="text-xs">Add items below or reset to defaults</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Add Custom Item */}
          {showAddItem ? (
            <div className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Add Custom Item</span>
                <button onClick={() => setShowAddItem(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name..."
                className="bg-background border-border/50"
              />
              <div className="flex gap-2">
                <Select value={newItemCategory} onValueChange={(v) => setNewItemCategory(v as StartingGearItem['category'])}>
                  <SelectTrigger className="flex-1 bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[key]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addCustomItem} disabled={!newItemName.trim()} size="sm">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
              <Input
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="bg-background border-border/50 text-sm"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddItem(true)}
                className="flex-1 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Custom Item
              </Button>
              {hasModifications && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefault}
                  className="text-muted-foreground"
                >
                  Reset to Default
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
