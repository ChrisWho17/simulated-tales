// World Object Registry System - Ensures Object Permanence
// Items can only exist in ONE place at a time - no duplication

// ============= TYPES =============

export interface ObjectProperties {
  wearable: boolean;
  wearSlot?: 'head' | 'face' | 'neck' | 'torso' | 'hands' | 'waist' | 'legs' | 'feet' | 'ring' | 'weapon' | 'shield';
  stackable: boolean;
  unique: boolean;
  destructible: boolean;
  value?: number;
  weight?: number;
}

export interface WorldObject {
  id: string;
  type: 'weapon' | 'accessory' | 'consumable' | 'key_item' | 'currency' | 'material' | 'equipment' | 'misc';
  name: string;
  description: string;
  properties: ObjectProperties;
  condition: number; // 0-100
  customizations: string[];
  origin: {
    created: number; // Turn created/found
    source: string;
    originalOwner: string | null;
  };
}

export type OwnerType = 'player' | 'npc' | 'location' | 'container' | 'destroyed';

export interface ObjectOwnership {
  type: OwnerType;
  id: string;
}

export interface TransferRecord {
  objectId: string;
  objectName: string;
  from: ObjectOwnership | null;
  to: ObjectOwnership;
  reason: string;
  turn: number;
  timestamp: number;
}

export interface WorldObjectRegistry {
  objects: Record<string, WorldObject>;
  ownership: Record<string, ObjectOwnership>;
  history: TransferRecord[];
}

// ============= REGISTRY STATE =============

let registry: WorldObjectRegistry = {
  objects: {},
  ownership: {},
  history: [],
};

const STORAGE_KEY = 'untold-object-registry';

// ============= PERSISTENCE =============

export function loadObjectRegistry(): WorldObjectRegistry {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      registry = JSON.parse(saved);
    }
  } catch (e) {
    console.error('[ObjectRegistry] Failed to load:', e);
  }
  return registry;
}

export function saveObjectRegistry(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error('[ObjectRegistry] Failed to save:', e);
  }
}

export function getObjectRegistry(): WorldObjectRegistry {
  return registry;
}

export function setObjectRegistry(newRegistry: WorldObjectRegistry): void {
  registry = newRegistry;
  saveObjectRegistry();
}

// ============= OBJECT CREATION =============

export function createObject(
  type: WorldObject['type'],
  name: string,
  properties: Partial<ObjectProperties> = {},
  currentTurn: number = 0,
  source: string = 'created',
  description: string = ''
): string {
  const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const object: WorldObject = {
    id,
    type,
    name,
    description: description || `A ${type} called ${name}`,
    properties: {
      wearable: false,
      stackable: false,
      unique: false,
      destructible: true,
      ...properties,
    },
    condition: 100,
    customizations: [],
    origin: {
      created: currentTurn,
      source,
      originalOwner: null,
    },
  };
  
  registry.objects[id] = object;
  saveObjectRegistry();
  
  console.log(`[ObjectRegistry] Created: ${id} (${name})`);
  return id;
}

// ============= OBJECT TRANSFER - THE ONLY WAY TO MOVE ITEMS =============

export function transferObject(
  objectId: string,
  newOwnerType: OwnerType,
  newOwnerId: string,
  reason: string = 'transfer',
  currentTurn: number = 0
): boolean {
  // Validate object exists
  if (!registry.objects[objectId]) {
    console.error(`[ObjectRegistry] Transfer failed: Object ${objectId} does not exist`);
    return false;
  }
  
  // Get current ownership
  const currentOwnership = registry.ownership[objectId] || null;
  
  // Set new ownership (this is THE ONLY place ownership is set)
  registry.ownership[objectId] = {
    type: newOwnerType,
    id: newOwnerId,
  };
  
  // Record transfer history
  registry.history.push({
    objectId,
    objectName: registry.objects[objectId].name,
    from: currentOwnership,
    to: { type: newOwnerType, id: newOwnerId },
    reason,
    turn: currentTurn,
    timestamp: Date.now(),
  });
  
  // Trim history to last 100 entries
  if (registry.history.length > 100) {
    registry.history = registry.history.slice(-100);
  }
  
  saveObjectRegistry();
  
  console.log(`[ObjectRegistry] Transferred: ${objectId} -> ${newOwnerType}:${newOwnerId}`);
  return true;
}

// ============= OBJECT QUERIES =============

export function getObject(objectId: string): WorldObject | null {
  return registry.objects[objectId] || null;
}

export function getObjectOwner(objectId: string): ObjectOwnership | null {
  return registry.ownership[objectId] || null;
}

export function getInventory(ownerType: OwnerType, ownerId: string): WorldObject[] {
  const items: WorldObject[] = [];
  
  for (const [objId, ownership] of Object.entries(registry.ownership)) {
    if (ownership.type === ownerType && ownership.id === ownerId) {
      const obj = registry.objects[objId];
      if (obj) {
        items.push(obj);
      }
    }
  }
  
  return items;
}

export function findObjectByName(name: string): WorldObject | null {
  const lowerName = name.toLowerCase();
  
  for (const obj of Object.values(registry.objects)) {
    if (obj.name.toLowerCase() === lowerName ||
        obj.name.toLowerCase().includes(lowerName)) {
      return obj;
    }
  }
  
  return null;
}

// ============= OBJECT DESTRUCTION =============

export function destroyObject(
  objectId: string,
  reason: string = 'destroyed',
  currentTurn: number = 0
): boolean {
  const object = registry.objects[objectId];
  if (!object) return false;
  
  // Record destruction in history
  const currentOwnership = registry.ownership[objectId];
  registry.history.push({
    objectId,
    objectName: object.name,
    from: currentOwnership || null,
    to: { type: 'destroyed', id: 'void' },
    reason,
    turn: currentTurn,
    timestamp: Date.now(),
  });
  
  // Remove from registries
  delete registry.objects[objectId];
  delete registry.ownership[objectId];
  
  saveObjectRegistry();
  
  console.log(`[ObjectRegistry] Destroyed: ${objectId} (${object.name})`);
  return true;
}

// ============= VALIDATION =============

export interface ValidationError {
  type: 'DUPLICATE_OBJECT' | 'ORPHANED_OBJECT' | 'MISSING_OBJECT';
  objectId: string;
  objectName?: string;
  count?: number;
  message: string;
}

export function validateObjectRegistry(): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for orphaned objects (in registry but no owner)
  for (const objId of Object.keys(registry.objects)) {
    if (!registry.ownership[objId]) {
      errors.push({
        type: 'ORPHANED_OBJECT',
        objectId: objId,
        objectName: registry.objects[objId]?.name,
        message: `Object ${objId} has no owner`,
      });
    }
  }
  
  // Check for ownership pointing to missing objects
  for (const objId of Object.keys(registry.ownership)) {
    if (!registry.objects[objId]) {
      errors.push({
        type: 'MISSING_OBJECT',
        objectId: objId,
        message: `Ownership record for ${objId} but object doesn't exist`,
      });
    }
  }
  
  if (errors.length > 0) {
    console.error('[ObjectRegistry] Validation errors:', errors);
  }
  
  return errors;
}

export function repairObjectRegistry(errors: ValidationError[]): void {
  for (const error of errors) {
    switch (error.type) {
      case 'ORPHANED_OBJECT':
        // Assign to limbo location
        registry.ownership[error.objectId] = { type: 'location', id: 'limbo' };
        console.log(`[ObjectRegistry] Repaired: Assigned orphan ${error.objectId} to limbo`);
        break;
        
      case 'MISSING_OBJECT':
        // Remove orphaned ownership
        delete registry.ownership[error.objectId];
        console.log(`[ObjectRegistry] Repaired: Removed ownership for missing ${error.objectId}`);
        break;
    }
  }
  
  saveObjectRegistry();
}

// ============= CONTEXT BUILDER FOR AI =============

export function buildObjectOwnershipContext(): string {
  const playerItems = getInventory('player', 'player');
  
  if (playerItems.length === 0 && Object.keys(registry.objects).length === 0) {
    return '';
  }
  
  const lines: string[] = [
    '## OBJECT PERMANENCE - CRITICAL',
    '',
    'Items exist in ONE place only. When transferred, the giver NO LONGER HAS the item.',
    '',
  ];
  
  // Player inventory
  if (playerItems.length > 0) {
    lines.push('### Player Currently Has:');
    for (const item of playerItems) {
      lines.push(`- ${item.name} (${item.type})`);
    }
    lines.push('');
  }
  
  // Recent transfers (for context)
  const recentTransfers = registry.history.slice(-5);
  if (recentTransfers.length > 0) {
    lines.push('### Recent Item Transfers:');
    for (const transfer of recentTransfers) {
      const fromName = transfer.from 
        ? `${transfer.from.type}:${transfer.from.id}` 
        : 'nowhere';
      lines.push(`- ${transfer.objectName}: ${fromName} → ${transfer.to.type}:${transfer.to.id}`);
    }
    lines.push('');
  }
  
  lines.push('NEVER duplicate items. If player gives item away, they no longer have it.');
  
  return lines.join('\n');
}

// ============= INITIALIZATION =============

// Load on module import
loadObjectRegistry();
