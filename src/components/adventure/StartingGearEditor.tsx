import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, Plus, X, Sword, Shield, Heart, Key, 
  Sparkles, AlertCircle, Check, ChevronDown, ChevronUp,
  Wand2, HelpCircle
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  parseItemPromptCommand,
  getCommandsGrouped,
  buildItemDescriptionFromPrompt,
  ItemPrompt,
} from '@/game/itemPromptCommands';

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
  const [showCommandHelp, setShowCommandHelp] = useState(false);
  const [appliedCommand, setAppliedCommand] = useState<string | null>(null);
  
  // Get the base gear for this genre/class
  const baseGear = useMemo(() => {
    const normalizedGenre = normalizeGenre(genre);
    const genreGear = STARTING_GEAR[normalizedGenre] || STARTING_GEAR.fantasy;
    return genreGear[characterClass.toLowerCase()] || genreGear.default || [];
  }, [genre, characterClass]);
  
  // Track gear modifications
  const [gear, setGear] = useState<StartingGearItem[]>(initialGear || baseGear);
  
  // Get grouped commands for help display
  const commandGroups = useMemo(() => getCommandsGrouped(), []);
  
  // Handle item prompt commands in description field
  const handleDescriptionChange = useCallback((value: string) => {
    setNewItemDescription(value);
    
    // Check if input starts with a command
    const trimmed = value.trim();
    if (trimmed.startsWith('/')) {
      const prompt = parseItemPromptCommand(trimmed);
      if (prompt) {
        // Auto-populate fields from command
        setNewItemName(prompt.name);
        setNewItemDescription(buildItemDescriptionFromPrompt(prompt));
        
        // Map category
        const categoryMap: Record<string, StartingGearItem['category']> = {
          'firearm': 'weapons',
          'melee': 'weapons',
          'armor': 'apparel',
          'clothing': 'apparel',
        };
        setNewItemCategory(categoryMap[prompt.category] || 'misc');
        setAppliedCommand(prompt.command);
        
        // Clear the applied indicator after a moment
        setTimeout(() => setAppliedCommand(null), 2000);
      }
    }
  }, []);
  
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
  
  // Apply a command directly from the help menu
  const applyCommand = (prompt: ItemPrompt) => {
    setNewItemName(prompt.name);
    setNewItemDescription(buildItemDescriptionFromPrompt(prompt));
    
    const categoryMap: Record<string, StartingGearItem['category']> = {
      'firearm': 'weapons',
      'melee': 'weapons',
      'armor': 'apparel',
      'clothing': 'apparel',
    };
    setNewItemCategory(categoryMap[prompt.category] || 'misc');
    setAppliedCommand(prompt.command);
    setShowCommandHelp(false);
    setTimeout(() => setAppliedCommand(null), 2000);
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Add Custom Item</span>
                  {appliedCommand && (
                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 animate-pulse">
                      <Wand2 className="w-3 h-3 mr-1" />
                      {appliedCommand} applied!
                    </Badge>
                  )}
                </div>
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
              
              {/* Description with command support */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">
                    Description (type /rifle, /sword, /vest etc. for templates)
                  </label>
                  <Popover open={showCommandHelp} onOpenChange={setShowCommandHelp}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                        <HelpCircle className="w-3 h-3" />
                        Commands
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-96 overflow-auto" align="end">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <h4 className="font-medium text-sm">Item Templates</h4>
                          <span className="text-xs text-muted-foreground">Case-insensitive</span>
                        </div>
                        {Object.entries(commandGroups).map(([group, prompts]) => (
                          <div key={group} className="space-y-1">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {group}
                            </h5>
                            <div className="grid grid-cols-2 gap-1">
                              {prompts.slice(0, 8).map((prompt) => (
                                <button
                                  key={prompt.command}
                                  onClick={() => applyCommand(prompt)}
                                  className="text-xs p-1.5 rounded bg-muted/50 hover:bg-primary/20 text-left truncate transition-colors"
                                >
                                  <span className="text-primary font-mono">{prompt.command}</span>
                                </button>
                              ))}
                            </div>
                            {prompts.length > 8 && (
                              <p className="text-xs text-muted-foreground">
                                +{prompts.length - 8} more...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={newItemDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Type /rifle or /sword to auto-fill, or write custom description..."
                  className="bg-background border-border/50 text-sm min-h-[80px]"
                />
              </div>
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
