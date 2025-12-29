import React, { useState } from 'react';
import { useInventory, InventoryScreen, InventoryItem } from '@/game/inventorySystem';
import { createWeapon, createPistol, createRifle, createShotgun } from '@/game/weaponModsSystem';
import { Button } from '@/components/ui/button';

// Sample items for testing - using weapon generators for proper stats/mods
const SAMPLE_WEAPONS = [
  createPistol({
    id: 'pistol-m9',
    name: 'M9 Beretta',
    description: 'A reliable 9mm sidearm used by military forces worldwide.',
    rarity: 'common',
  }),
  createPistol({
    id: 'pistol-1911',
    name: 'Colt 1911',
    description: 'Classic .45 ACP pistol with stopping power.',
    rarity: 'uncommon',
    caliber: '.45 ACP',
  }),
  createRifle({
    id: 'rifle-ar15',
    name: 'AR-15 Rifle',
    description: 'Semi-automatic rifle chambered in 5.56mm.',
    rarity: 'uncommon',
    caliber: '5.56x45mm',
  }),
  createShotgun({
    id: 'shotgun-mossberg',
    name: 'Mossberg 500',
    description: 'Pump-action shotgun, reliable and powerful.',
    rarity: 'common',
  }),
  createWeapon({
    id: 'sniper-m24',
    name: 'M24 Sniper',
    description: 'Bolt-action precision rifle for long-range engagements.',
    weaponType: 'sniper',
    rarity: 'rare',
  }),
];

const SAMPLE_APPAREL: Partial<InventoryItem>[] = [
  {
    id: 'combat-helmet',
    name: 'Combat Helmet',
    description: 'Kevlar helmet with ballistic protection',
    category: 'apparel',
    type: 'helmet',
    icon: '🪖',
    weight: 3.0,
    value: 350,
    equipSlots: ['head'],
  },
  {
    id: 'tactical-vest',
    name: 'Tactical Vest',
    description: 'Plate carrier with MOLLE webbing',
    category: 'apparel',
    type: 'armor',
    icon: '🦺',
    weight: 8.0,
    value: 600,
    equipSlots: ['torso'],
  },
  {
    id: 'combat-boots',
    name: 'Combat Boots',
    description: 'Sturdy leather boots with steel toe',
    category: 'apparel',
    type: 'footwear',
    icon: '🥾',
    weight: 2.5,
    value: 120,
    equipSlots: ['feet'],
  },
  {
    id: 'tactical-gloves',
    name: 'Tactical Gloves',
    description: 'Reinforced knuckle gloves',
    category: 'apparel',
    type: 'gloves',
    icon: '🧤',
    weight: 0.3,
    value: 45,
    equipSlots: ['hands'],
  },
  {
    id: 'cargo-pants',
    name: 'Cargo Pants',
    description: 'Durable tactical pants with many pockets',
    category: 'apparel',
    type: 'pants',
    icon: '👖',
    weight: 1.2,
    value: 80,
    equipSlots: ['legs'],
  },
  {
    id: 'radio',
    name: 'Tactical Radio',
    description: 'Short-range communication device',
    category: 'misc',
    type: 'accessory',
    icon: '📻',
    weight: 0.5,
    value: 200,
    equipSlots: ['accessory1', 'accessory2'],
  },
  {
    id: 'watch',
    name: 'G-Shock Watch',
    description: 'Rugged digital watch with compass',
    category: 'misc',
    type: 'accessory',
    icon: '⌚',
    weight: 0.1,
    value: 150,
    equipSlots: ['accessory1', 'accessory2'],
  },
  {
    id: 'medkit',
    name: 'First Aid Kit',
    description: 'Basic medical supplies',
    category: 'aid',
    icon: '🩹',
    weight: 1.0,
    value: 75,
    stackable: true,
    consumable: true,
  },
  {
    id: 'ammo-9mm',
    name: '9mm Ammo',
    description: 'Box of 50 rounds',
    category: 'ammo',
    icon: '🔹',
    weight: 0.5,
    value: 25,
    stackable: true,
  },
];

// Combined sample items
const SAMPLE_ITEMS = [...SAMPLE_WEAPONS, ...SAMPLE_APPAREL];

export function InventoryTestPanel() {
  const inventory = useInventory();
  const [showInventory, setShowInventory] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const addSampleItem = (item: Partial<InventoryItem>) => {
    inventory.addItem(item as InventoryItem);
    addLog(`Added: ${item.name}`);
  };

  const addAllItems = () => {
    SAMPLE_ITEMS.forEach(item => {
      inventory.addItem(item as InventoryItem);
    });
    addLog('Added all sample items');
  };

  const clearInventory = () => {
    inventory.state.items.forEach(item => {
      inventory.dropItem(item.instanceId);
    });
    addLog('Cleared inventory');
  };

  return (
    <div className="p-4 bg-background border border-border rounded-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4">🧪 Inventory Test Panel</h2>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => setShowInventory(true)} variant="default">
          📦 Open Inventory ({inventory.state.items.length})
        </Button>
        <Button onClick={addAllItems} variant="secondary">
          ➕ Add All Items
        </Button>
        <Button onClick={clearInventory} variant="destructive">
          🗑️ Clear All
        </Button>
      </div>

      {/* Add Individual Items */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Add Individual Items:</h3>
        <div className="flex flex-wrap gap-1">
          {SAMPLE_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => addSampleItem(item)}
              className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded border border-border"
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current Equipped State */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-2">Equipped Slots:</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {Object.entries(inventory.state.equipped).map(([slot, instanceId]) => {
            const item = inventory.state.items.find(i => i.instanceId === instanceId);
            return (
              <div key={slot} className="flex items-center gap-1">
                <span className="text-muted-foreground">{slot}:</span>
                <span className={item ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {item ? `${item.icon} ${item.name}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log */}
      <div className="p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Log:</h3>
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground">No actions yet</p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="text-xs text-muted-foreground font-mono">{entry}</div>
          ))
        )}
      </div>

      {/* Inventory Screen Modal */}
      <InventoryScreen
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        availableMods={[]}
      />
    </div>
  );
}
