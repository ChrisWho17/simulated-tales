import { useState, useEffect } from 'react';
import { 
  Package, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp,
  Sword, Shield, Shirt, Wrench, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { InventoryItem, CATEGORIES, useInventoryOptional } from '@/game/inventorySystem';
import { isGunNutMode, setGunNutMode } from '@/game/gunNutSystem';

// ============================================================================
// TYPES
// ============================================================================

interface CustomWeaponData {
  name: string;
  description: string;
  weaponType: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper' | 'melee';
  caliber: string;
  // Physical
  weight: number;
  length: number;
  // Stats
  damage: number;
  accuracy: number;
  fireRate: number;
  range: number;
  stability: number;
  handling: number;
  // Capacity
  magazineCapacity: number;
  // Mod slots
  allowedMods: string[];
  // Condition
  condition: number;
  value: number;
}

interface CustomArmorData {
  name: string;
  description: string;
  slot: 'head' | 'torso' | 'hands' | 'legs' | 'feet';
  armorType: 'light' | 'medium' | 'heavy';
  // Stats
  defense: number;
  stealth: number;
  mobility: number;
  intimidation: number;
  charisma: number;
  // Physical
  weight: number;
  value: number;
  // Style
  style: 'casual' | 'military' | 'formal' | 'streetwear' | 'punk';
}

const DEFAULT_WEAPON: CustomWeaponData = {
  name: 'Custom Weapon',
  description: 'A custom-made weapon',
  weaponType: 'pistol',
  caliber: '9mm',
  weight: 1.0,
  length: 200,
  damage: 30,
  accuracy: 70,
  fireRate: 400,
  range: 40,
  stability: 60,
  handling: 70,
  magazineCapacity: 15,
  allowedMods: ['optic', 'muzzle', 'grip', 'magazine'],
  condition: 100,
  value: 100,
};

const DEFAULT_ARMOR: CustomArmorData = {
  name: 'Custom Armor',
  description: 'Custom protective gear',
  slot: 'torso',
  armorType: 'medium',
  defense: 10,
  stealth: 0,
  mobility: 0,
  intimidation: 0,
  charisma: 0,
  weight: 2.0,
  value: 100,
  style: 'military',
};

const WEAPON_TYPES = [
  { value: 'pistol', label: 'Pistol' },
  { value: 'rifle', label: 'Assault Rifle' },
  { value: 'shotgun', label: 'Shotgun' },
  { value: 'smg', label: 'SMG' },
  { value: 'sniper', label: 'Sniper Rifle' },
  { value: 'melee', label: 'Melee' },
];

const CALIBERS = [
  '9mm', '.45 ACP', '.40 S&W', '5.56x45mm', '7.62x39mm', '7.62x51mm', 
  '.308 Win', '.50 BMG', '12 Gauge', '20 Gauge', 'N/A (Melee)'
];

const MOD_SLOTS = [
  { id: 'optic', label: 'Optic' },
  { id: 'muzzle', label: 'Muzzle' },
  { id: 'barrel', label: 'Barrel' },
  { id: 'grip', label: 'Grip' },
  { id: 'magazine', label: 'Magazine' },
  { id: 'stock', label: 'Stock' },
  { id: 'underbarrel', label: 'Underbarrel' },
  { id: 'special', label: 'Special' },
];

const ARMOR_SLOTS = [
  { value: 'head', label: 'Head' },
  { value: 'torso', label: 'Torso' },
  { value: 'hands', label: 'Hands' },
  { value: 'legs', label: 'Legs' },
  { value: 'feet', label: 'Feet' },
];

const ARMOR_TYPES = [
  { value: 'light', label: 'Light', defenseRange: '1-10' },
  { value: 'medium', label: 'Medium', defenseRange: '11-25' },
  { value: 'heavy', label: 'Heavy', defenseRange: '26-50' },
];

const STYLES = [
  { value: 'casual', label: 'Casual' },
  { value: 'military', label: 'Military' },
  { value: 'formal', label: 'Formal' },
  { value: 'streetwear', label: 'Streetwear' },
  { value: 'punk', label: 'Punk' },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface InventoryEditorProps {
  gunNutEnabled?: boolean;
}

export function InventoryEditor({ gunNutEnabled = false }: InventoryEditorProps) {
  const inventoryContext = useInventoryOptional();
  const [activeTab, setActiveTab] = useState<'browse' | 'create_weapon' | 'create_armor'>('browse');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [customWeapon, setCustomWeapon] = useState<CustomWeaponData>(DEFAULT_WEAPON);
  const [customArmor, setCustomArmor] = useState<CustomArmorData>(DEFAULT_ARMOR);
  const [gunNutModeEnabled, setGunNutModeEnabled] = useState(gunNutEnabled || isGunNutMode());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    weapons: true,
    apparel: false,
    aid: false,
    misc: false,
  });

  useEffect(() => {
    setGunNutMode(gunNutModeEnabled);
  }, [gunNutModeEnabled]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group items by category
  const items = inventoryContext?.state?.items || [];
  const itemsByCategory = items.reduce((acc, item) => {
    const cat = item.category || 'misc';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const handleAddItem = (item: Partial<InventoryItem>) => {
    if (inventoryContext?.addItem) {
      inventoryContext.addItem(item);
      toast.success(`Added ${item.name} to inventory`);
    }
  };

  const handleRemoveItem = (instanceId: string) => {
    if (inventoryContext?.dropItem) {
      inventoryContext.dropItem(instanceId);
      toast.success('Item removed');
    }
  };

  const handleCreateWeapon = () => {
    const weapon: Partial<InventoryItem> = {
      id: `custom_weapon_${Date.now()}`,
      name: customWeapon.name,
      description: customWeapon.description,
      category: 'weapons',
      type: customWeapon.weaponType,
      weaponType: customWeapon.weaponType,
      caliber: customWeapon.caliber,
      weight: customWeapon.weight,
      value: customWeapon.value,
      quantity: 1,
      stackable: false,
      stats: {
        damage: customWeapon.damage,
        accuracy: customWeapon.accuracy,
        fireRate: customWeapon.fireRate,
        range: customWeapon.range,
        stability: customWeapon.stability,
        handling: customWeapon.handling,
      },
      condition: {
        barrelWear: 100 - customWeapon.condition,
        carbonBuildup: 0,
        springFatigue: 0,
        riflingWear: 100 - customWeapon.condition,
        roundsFired: 0,
        lastMaintenance: Date.now(),
      },
      compatibleSlots: customWeapon.allowedMods,
      mods: {},
      equipSlots: ['primaryWeapon', 'sidearm'],
    };

    handleAddItem(weapon);
    setCustomWeapon(DEFAULT_WEAPON);
    setActiveTab('browse');
  };

  const handleCreateArmor = () => {
    const armor: Partial<InventoryItem> = {
      id: `custom_armor_${Date.now()}`,
      name: customArmor.name,
      description: customArmor.description,
      category: 'apparel',
      type: customArmor.slot,
      weight: customArmor.weight,
      value: customArmor.value,
      quantity: 1,
      stackable: false,
      stats: {
        damage: customArmor.defense, // Using damage slot for defense
        accuracy: customArmor.mobility,
        stability: customArmor.stealth,
        handling: customArmor.charisma,
      },
      equipSlots: [customArmor.slot],
    };

    handleAddItem(armor);
    setCustomArmor(DEFAULT_ARMOR);
    setActiveTab('browse');
  };

  const renderStatSlider = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min = 0,
    max = 100,
    step = 1
  ) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <Label>{label}</Label>
        <span className="font-mono text-primary">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="py-1"
      />
    </div>
  );

  const renderBrowseTab = () => (
    <div className="space-y-3">
      {/* Gun Nut Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
        <div>
          <Label className="text-sm font-medium">Gun Nut Mode</Label>
          <p className="text-xs text-muted-foreground">
            Enable detailed weapon stats and modifications
          </p>
        </div>
        <Switch
          checked={gunNutModeEnabled}
          onCheckedChange={setGunNutModeEnabled}
        />
      </div>

      {/* Inventory List */}
      {Object.entries(CATEGORIES).map(([key, cat]) => {
        const items = itemsByCategory[key] || [];
        if (items.length === 0) return null;

        return (
          <div key={key} className="border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(key)}
              className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="font-medium text-sm">{cat.label}</span>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              {expandedCategories[key] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedCategories[key] && (
              <div className="p-2 space-y-2">
                {items.map(item => (
                  <div key={item.instanceId} className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.name}</span>
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>
                        )}
                      </div>
                      {item.stats && (
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {item.stats.damage && <span>DMG: {item.stats.damage}</span>}
                          {item.stats.accuracy && <span>ACC: {item.stats.accuracy}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {gunNutModeEnabled && item.category === 'weapons' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingItem(item)}
                          title="Modify weapon"
                        >
                          <Wrench className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemoveItem(item.instanceId)}
                        title="Remove item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(itemsByCategory).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Inventory is empty</p>
        </div>
      )}
    </div>
  );

  const renderCreateWeaponTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-500 mb-4">
        <Sword className="w-5 h-5" />
        <h3 className="font-medium">Create Custom Weapon</h3>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={customWeapon.name}
            onChange={e => setCustomWeapon(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Weapon name..."
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={customWeapon.description}
            onChange={e => setCustomWeapon(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Weapon description..."
            className="min-h-[60px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={customWeapon.weaponType}
            onValueChange={v => setCustomWeapon(prev => ({ ...prev, weaponType: v as any }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEAPON_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Caliber</Label>
          <Select
            value={customWeapon.caliber}
            onValueChange={v => setCustomWeapon(prev => ({ ...prev, caliber: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CALIBERS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Physical Stats */}
      <div className="border-t border-border/50 pt-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Physical Properties</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderStatSlider('Weight (kg)', customWeapon.weight, v => setCustomWeapon(prev => ({ ...prev, weight: v })), 0.1, 15, 0.1)}
          {renderStatSlider('Length (mm)', customWeapon.length, v => setCustomWeapon(prev => ({ ...prev, length: v })), 100, 1500, 10)}
          {renderStatSlider('Magazine Capacity', customWeapon.magazineCapacity, v => setCustomWeapon(prev => ({ ...prev, magazineCapacity: v })), 1, 100)}
          {renderStatSlider('Value', customWeapon.value, v => setCustomWeapon(prev => ({ ...prev, value: v })), 0, 10000, 10)}
        </div>
      </div>

      {/* Combat Stats */}
      <div className="border-t border-border/50 pt-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Combat Stats</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderStatSlider('Damage', customWeapon.damage, v => setCustomWeapon(prev => ({ ...prev, damage: v })))}
          {renderStatSlider('Accuracy', customWeapon.accuracy, v => setCustomWeapon(prev => ({ ...prev, accuracy: v })))}
          {renderStatSlider('Fire Rate (RPM)', customWeapon.fireRate, v => setCustomWeapon(prev => ({ ...prev, fireRate: v })), 50, 1200, 10)}
          {renderStatSlider('Range (m)', customWeapon.range, v => setCustomWeapon(prev => ({ ...prev, range: v })), 5, 500)}
          {renderStatSlider('Stability', customWeapon.stability, v => setCustomWeapon(prev => ({ ...prev, stability: v })))}
          {renderStatSlider('Handling', customWeapon.handling, v => setCustomWeapon(prev => ({ ...prev, handling: v })))}
          {renderStatSlider('Starting Condition', customWeapon.condition, v => setCustomWeapon(prev => ({ ...prev, condition: v })))}
        </div>
      </div>

      {/* Modification Slots */}
      {gunNutModeEnabled && (
        <div className="border-t border-border/50 pt-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Allowed Modifications</h4>
          <div className="grid grid-cols-4 gap-2">
            {MOD_SLOTS.map(slot => (
              <label key={slot.id} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={customWeapon.allowedMods.includes(slot.id)}
                  onChange={e => {
                    setCustomWeapon(prev => ({
                      ...prev,
                      allowedMods: e.target.checked
                        ? [...prev.allowedMods, slot.id]
                        : prev.allowedMods.filter(m => m !== slot.id)
                    }));
                  }}
                  className="rounded"
                />
                {slot.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="pt-4 flex gap-2">
        <Button variant="outline" onClick={() => setActiveTab('browse')} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleCreateWeapon} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
          <Plus className="w-4 h-4 mr-1" /> Create Weapon
        </Button>
      </div>
    </div>
  );

  const renderCreateArmorTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-blue-500 mb-4">
        <Shield className="w-5 h-5" />
        <h3 className="font-medium">Create Custom Armor/Clothing</h3>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={customArmor.name}
            onChange={e => setCustomArmor(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Armor name..."
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={customArmor.description}
            onChange={e => setCustomArmor(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Armor description..."
            className="min-h-[60px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slot</Label>
          <Select
            value={customArmor.slot}
            onValueChange={v => setCustomArmor(prev => ({ ...prev, slot: v as any }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ARMOR_SLOTS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Armor Type</Label>
          <Select
            value={customArmor.armorType}
            onValueChange={v => setCustomArmor(prev => ({ ...prev, armorType: v as any }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ARMOR_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label} ({t.defenseRange})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Style</Label>
          <Select
            value={customArmor.style}
            onValueChange={v => setCustomArmor(prev => ({ ...prev, style: v as any }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STYLES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-border/50 pt-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Protection & Stats</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderStatSlider('Defense', customArmor.defense, v => setCustomArmor(prev => ({ ...prev, defense: v })), 0, 50)}
          {renderStatSlider('Stealth Modifier', customArmor.stealth, v => setCustomArmor(prev => ({ ...prev, stealth: v })), -30, 30)}
          {renderStatSlider('Mobility Modifier', customArmor.mobility, v => setCustomArmor(prev => ({ ...prev, mobility: v })), -30, 30)}
          {renderStatSlider('Intimidation', customArmor.intimidation, v => setCustomArmor(prev => ({ ...prev, intimidation: v })), 0, 20)}
          {renderStatSlider('Charisma', customArmor.charisma, v => setCustomArmor(prev => ({ ...prev, charisma: v })), -10, 20)}
        </div>
      </div>

      {/* Physical */}
      <div className="border-t border-border/50 pt-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Physical Properties</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderStatSlider('Weight (kg)', customArmor.weight, v => setCustomArmor(prev => ({ ...prev, weight: v })), 0.1, 20, 0.1)}
          {renderStatSlider('Value', customArmor.value, v => setCustomArmor(prev => ({ ...prev, value: v })), 0, 5000, 10)}
        </div>
      </div>

      {/* Create Button */}
      <div className="pt-4 flex gap-2">
        <Button variant="outline" onClick={() => setActiveTab('browse')} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleCreateArmor} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="w-4 h-4 mr-1" /> Create Armor
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'browse' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('browse')}
        >
          <Package className="w-4 h-4 mr-1" /> Browse
        </Button>
        <Button
          variant={activeTab === 'create_weapon' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('create_weapon')}
        >
          <Sword className="w-4 h-4 mr-1" /> Custom Weapon
        </Button>
        <Button
          variant={activeTab === 'create_armor' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('create_armor')}
        >
          <Shield className="w-4 h-4 mr-1" /> Custom Armor
        </Button>
      </div>

      {/* Tab Content */}
      <ScrollArea className="max-h-[400px]">
        {activeTab === 'browse' && renderBrowseTab()}
        {activeTab === 'create_weapon' && renderCreateWeaponTab()}
        {activeTab === 'create_armor' && renderCreateArmorTab()}
      </ScrollArea>
    </div>
  );
}
