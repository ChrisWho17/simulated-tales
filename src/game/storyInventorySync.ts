// ============================================================================
// ENHANCED STORY-INVENTORY SYNC SYSTEM
// Phase 1: Improved item detection + actual removal of dropped/consumed items
// With comprehensive debug logging for troubleshooting
// ============================================================================

import { InventoryItem, InventoryState } from './inventorySystem';
import { detectItemType, GeneratedItem, ApparelType } from './itemCategorySystem';
import { 
  parseNarrativeForLoot, 
  parseNarrativeForDrops,
  ParsedLoot,
  ParsedDrop,
} from '@/lib/narrativeLootParser';
import { generateFullItem } from './storyInventoryBridge';
import {
  logPickup,
  logDrop,
  logConsume,
  logLootTag,
  logDropTag,
  logUseTag,
  logMatchAttempt,
  logWarning,
  logError,
} from '@/services/inventorySyncLogger';

// ============================================================================
// ENHANCED PATTERNS - More robust detection
// ============================================================================

// Consumption patterns - items being used/consumed
const CONSUMPTION_PATTERNS = [
  // Eating/Drinking
  /you\s+(?:eat|consume|drink|devour|gulp|chew|swallow)\s+(?:your\s+|the\s+|a\s+|an\s+|some\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\.|,|!|\s+and|\s+to|\s+then)/gi,
  
  // Using medical items
  /you\s+(?:use|apply|inject|take|administer|bandage with)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\.|,|!|\s+on|\s+to)/gi,
  
  // Item depleted/ran out
  /(?:your\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+(?:is|are)\s+(?:now\s+)?(?:empty|depleted|used up|exhausted|gone)/gi,
  
  // "last of the X"
  /(?:the\s+)?last\s+(?:of\s+)?(?:your\s+|the\s+)?([A-Za-z][a-zA-Z\s-]+)/gi,
  
  // Reading/using key items (consume but might not remove)
  /you\s+(?:read|study|examine and pocket|burn|destroy)\s+(?:the\s+|your\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\.|,|!)/gi,
];

// Giving/trading away patterns
const GIVE_AWAY_PATTERNS = [
  // Giving to NPCs
  /you\s+(?:give|hand over|surrender|pass|trade|offer|present)\s+(?:your\s+|the\s+|a\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+to\s+/gi,
  
  // NPC takes from player
  /(?:takes?|grabs?|snatches?|confiscates?|claims?|demands?|receives?)\s+(?:your\s+|the\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+(?:from\s+you|away)/gi,
  
  // Paying with items
  /you\s+(?:pay|bribe|tip)\s+(?:with\s+)?(?:your\s+|the\s+)?([A-Za-z][a-zA-Z\s-]+)/gi,
];

// Breaking/losing patterns  
const DESTRUCTION_PATTERNS = [
  // Breaking items
  /(?:your\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+(?:breaks?|shatters?|snaps?|malfunctions?|explodes?|jams|misfires)/gi,
  
  // Losing items
  /you\s+(?:lose|lost|misplace)\s+(?:your\s+|the\s+)?([A-Za-z][a-zA-Z\s-]+)/gi,
  
  // Item destroyed
  /(?:your\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+(?:is|was)\s+(?:destroyed|ruined|broken|lost)/gi,
];

// Items the player should NEVER lose via parsing (key items, etc.)
const PROTECTED_ITEMS = new Set([
  'world map', 'prophecy map', 'journal', 'diary', 'quest log',
  'starting gear', 'keycard', 'id badge', 'passport',
]);

// ============================================================================
// SYNC RESULT INTERFACE
// ============================================================================

export interface StoryInventorySyncResult {
  itemsAdded: Array<{
    name: string;
    category: string;
    confidence: 'high' | 'medium' | 'low';
    source: 'pickup' | 'loot' | 'receive';
  }>;
  itemsRemoved: Array<{
    name: string;
    instanceId: string;
    reason: 'drop' | 'consume' | 'give' | 'destroy' | 'lose';
    confidence: 'high' | 'medium' | 'low';
  }>;
  warnings: string[];
}

// ============================================================================
// ITEM MATCHING - Fuzzy match narrative items to inventory
// ============================================================================

function findMatchingInventoryItem(
  itemName: string,
  inventory: InventoryItem[]
): InventoryItem | null {
  const lowerName = itemName.toLowerCase().trim();
  const inventoryNames = inventory.map(i => i.name);
  
  // 1. Exact match
  const exactMatch = inventory.find(i => i.name.toLowerCase() === lowerName);
  if (exactMatch) {
    logMatchAttempt(itemName, inventoryNames, exactMatch.name, 'exact');
    return exactMatch;
  }
  
  // 2. Contains match (either direction)
  const containsMatch = inventory.find(i => {
    const invLower = i.name.toLowerCase();
    return invLower.includes(lowerName) || lowerName.includes(invLower);
  });
  if (containsMatch) {
    logMatchAttempt(itemName, inventoryNames, containsMatch.name, 'contains');
    return containsMatch;
  }
  
  // 3. Word-based matching - check if significant words match
  const parsedWords = lowerName.split(/\s+/).filter(w => w.length >= 3);
  
  for (const item of inventory) {
    const invWords = item.name.toLowerCase().split(/\s+/);
    const matchingWords = parsedWords.filter(pw => 
      invWords.some(iw => iw === pw || iw.includes(pw) || pw.includes(iw))
    );
    
    // If at least half the parsed words match, it's probably the same item
    if (matchingWords.length >= Math.ceil(parsedWords.length / 2)) {
      logMatchAttempt(itemName, inventoryNames, item.name, 'word');
      return item;
    }
  }
  
  // 4. Type-based matching for generic references like "pistol", "rifle"
  const genericTypes = ['pistol', 'rifle', 'shotgun', 'knife', 'sword', 'shield', 'helmet', 'armor'];
  const matchedType = genericTypes.find(t => lowerName.includes(t));
  
  if (matchedType) {
    const typeMatch = inventory.find(i => 
      i.name.toLowerCase().includes(matchedType) ||
      i.type?.toLowerCase() === matchedType ||
      i.weaponType?.toLowerCase() === matchedType
    );
    if (typeMatch) {
      logMatchAttempt(itemName, inventoryNames, typeMatch.name, 'type');
      return typeMatch;
    }
  }
  
  // No match found
  logMatchAttempt(itemName, inventoryNames, null, 'none');
  return null;
}

// ============================================================================
// PARSE CONSUMPTIONS FROM NARRATIVE
// ============================================================================

function parseConsumptions(narrative: string, inventory: InventoryItem[]): ParsedDrop[] {
  const results: ParsedDrop[] = [];
  const foundItems = new Set<string>();
  
  const allPatterns = [
    ...CONSUMPTION_PATTERNS,
    ...GIVE_AWAY_PATTERNS,
    ...DESTRUCTION_PATTERNS,
  ];
  
  for (const pattern of allPatterns) {
    pattern.lastIndex = 0;
    let match;
    
    while ((match = pattern.exec(narrative)) !== null) {
      const rawItem = match[1]?.trim();
      if (!rawItem || rawItem.length < 3) continue;
      
      // Clean the item name
      const itemName = rawItem
        .replace(/^(a|an|the|your|some)\s+/i, '')
        .replace(/[.,!?;:]+$/, '')
        .trim();
      
      // Skip if already found
      if (foundItems.has(itemName.toLowerCase())) continue;
      
      // Check if this matches something in inventory
      const inventoryMatch = findMatchingInventoryItem(itemName, inventory);
      if (inventoryMatch) {
        // Don't remove protected items
        if (PROTECTED_ITEMS.has(inventoryMatch.name.toLowerCase())) continue;
        
        foundItems.add(itemName.toLowerCase());
        results.push({
          itemName: inventoryMatch.name, // Use actual inventory name
          confidence: 'high',
          matchedPattern: pattern.source.slice(0, 40) + '...',
        });
      }
    }
  }
  
  return results;
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

export interface InventoryDispatcher {
  state: InventoryState;
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

export function syncStoryWithInventory(
  narrative: string,
  inventory: InventoryDispatcher,
  options: {
    processPickups?: boolean;
    processDrops?: boolean;
    processConsumptions?: boolean;
    minConfidence?: 'high' | 'medium' | 'low';
    dryRun?: boolean; // If true, don't actually modify inventory
  } = {}
): StoryInventorySyncResult {
  const {
    processPickups = true,
    processDrops = true,
    processConsumptions = true,
    minConfidence = 'medium',
    dryRun = false,
  } = options;
  
  const result: StoryInventorySyncResult = {
    itemsAdded: [],
    itemsRemoved: [],
    warnings: [],
  };
  
  const currentItems = inventory.state.items;
  const inventoryNames = currentItems.map(i => i.name);
  
  // Confidence filter helper
  const confidenceOrder = ['high', 'medium', 'low'];
  const minConfidenceIndex = confidenceOrder.indexOf(minConfidence);
  const passesConfidence = (conf: string) => 
    confidenceOrder.indexOf(conf) <= minConfidenceIndex;
  
  // ========== PROCESS PICKUPS ==========
  if (processPickups) {
    const lootParsed = parseNarrativeForLoot(narrative, []);
    
    for (const loot of lootParsed) {
      if (!passesConfidence(loot.confidence)) continue;
      
      // Check if we already have this item (avoid duplicates)
      const alreadyHas = findMatchingInventoryItem(loot.itemName, currentItems);
      if (alreadyHas) {
        // Only add if it's stackable
        if (alreadyHas.stackable) {
          result.warnings.push(`Already have ${loot.itemName} (stackable)`);
        }
        continue;
      }
      
      // Generate the item
      const detection = detectItemType(loot.itemName);
      const newItem = generateFullItem({
        name: loot.itemName,
        category: detection.category as 'weapons' | 'apparel' | 'aid' | 'ammo' | 'keyItems' | 'misc',
        weaponType: detection.weaponType,
        apparelType: detection.type as ApparelType,
      });
      
      // Add to inventory
      if (!dryRun) {
        inventory.dispatch({ type: 'ADD_ITEM', payload: { item: newItem, quantity: 1 } });
      }
      
      result.itemsAdded.push({
        name: loot.itemName,
        category: detection.category,
        confidence: loot.confidence,
        source: 'pickup',
      });
      
      // Log to backend
      logPickup(loot.itemName, loot.confidence, 'narrative_parsing', loot.matchedPattern);
    }
  }
  
  // ========== PROCESS DROPS ==========
  if (processDrops) {
    const dropParsed = parseNarrativeForDrops(narrative, [], inventoryNames);
    
    for (const drop of dropParsed) {
      if (!passesConfidence(drop.confidence)) continue;
      
      // Find the actual inventory item
      const inventoryItem = findMatchingInventoryItem(drop.itemName, currentItems);
      if (!inventoryItem) {
        logWarning(`Drop detected but not in inventory`, { itemName: drop.itemName });
        result.warnings.push(`Drop detected but not in inventory: ${drop.itemName}`);
        continue;
      }
      
      // Don't drop protected items
      if (PROTECTED_ITEMS.has(inventoryItem.name.toLowerCase())) {
        logWarning(`Protected item cannot be dropped`, { itemName: inventoryItem.name });
        result.warnings.push(`Protected item cannot be dropped: ${inventoryItem.name}`);
        continue;
      }
      
      // Remove from inventory
      if (!dryRun) {
        inventory.dispatch({ type: 'DROP_ITEM', payload: { instanceId: inventoryItem.instanceId } });
      }
      
      result.itemsRemoved.push({
        name: inventoryItem.name,
        instanceId: inventoryItem.instanceId,
        reason: 'drop',
        confidence: drop.confidence,
      });
      
      // Log to backend
      logDrop(inventoryItem.name, inventoryItem.instanceId, drop.confidence, drop.matchedPattern);
    }
  }
  
  // ========== PROCESS CONSUMPTIONS ==========
  if (processConsumptions) {
    const consumptions = parseConsumptions(narrative, currentItems);
    
    for (const consumption of consumptions) {
      if (!passesConfidence(consumption.confidence)) continue;
      
      // Find the actual inventory item
      const inventoryItem = findMatchingInventoryItem(consumption.itemName, currentItems);
      if (!inventoryItem) continue; // Already checked in parseConsumptions
      
      // Determine if this is a true consumption (reduces quantity or removes)
      // vs just a use (reading a map, etc.)
      const isConsumable = inventoryItem.consumable === true;
      const isStackable = inventoryItem.stackable === true;
      
      // Use/consume the item
      if (!dryRun) {
        if (isConsumable || isStackable) {
          // Use item (will reduce quantity or remove if qty=1)
          inventory.dispatch({ 
            type: 'USE_ITEM', 
            payload: { 
              instanceId: inventoryItem.instanceId,
              useDescription: 'Used from story',
              consumeOnUse: true,
            } 
          });
        } else {
          // For non-consumables, only remove if the narrative clearly indicates loss
          // Check if this matched a destruction pattern
          const isDestruction = DESTRUCTION_PATTERNS.some(p => {
            p.lastIndex = 0;
            return p.test(narrative);
          });
          
          if (isDestruction) {
            inventory.dispatch({ 
              type: 'DROP_ITEM', 
              payload: { instanceId: inventoryItem.instanceId } 
            });
          } else {
            continue; // Don't remove non-consumables on normal use
          }
        }
      }
      
      result.itemsRemoved.push({
        name: inventoryItem.name,
        instanceId: inventoryItem.instanceId,
        reason: isConsumable ? 'consume' : 'destroy',
        confidence: consumption.confidence,
      });
      
      // Log to backend
      logConsume(inventoryItem.name, inventoryItem.instanceId, consumption.confidence, consumption.matchedPattern);
    }
  }
  
  return result;
}

// ============================================================================
// INTEGRATION HELPER - For use with AI mechanics tags
// ============================================================================

export interface MechanicsTags {
  loot?: string[];
  drop?: string[];
  use?: string[];
  // Aliases to match edge function response format
  lootGained?: string[];
  itemsDropped?: string[];
  itemsUsed?: string[];
}

export function processAIMechanicsTags(
  tags: MechanicsTags,
  inventory: InventoryDispatcher
): StoryInventorySyncResult {
  const result: StoryInventorySyncResult = {
    itemsAdded: [],
    itemsRemoved: [],
    warnings: [],
  };
  
  // Normalize tag names (support both formats)
  const lootItems = tags.loot || tags.lootGained || [];
  const dropItems = tags.drop || tags.itemsDropped || [];
  const useItems = tags.use || tags.itemsUsed || [];
  
  // Process [LOOT:] tags
  if (lootItems.length > 0) {
    for (const itemName of lootItems) {
      const detection = detectItemType(itemName);
      const newItem = generateFullItem({
        name: itemName,
        category: detection.category as 'weapons' | 'apparel' | 'aid' | 'ammo' | 'keyItems' | 'misc',
        weaponType: detection.weaponType,
        apparelType: detection.type as ApparelType,
      });
      
      inventory.dispatch({ type: 'ADD_ITEM', payload: { item: newItem, quantity: 1 } });
      
      result.itemsAdded.push({
        name: itemName,
        category: detection.category,
        confidence: 'high',
        source: 'loot',
      });
      
      // Log to backend
      logLootTag(itemName, detection.category);
    }
  }
  
  // Process [DROP:] tags
  if (dropItems.length > 0) {
    for (const itemName of dropItems) {
      const inventoryItem = findMatchingInventoryItem(itemName, inventory.state.items);
      
      if (inventoryItem) {
        inventory.dispatch({ type: 'DROP_ITEM', payload: { instanceId: inventoryItem.instanceId } });
        
        result.itemsRemoved.push({
          name: inventoryItem.name,
          instanceId: inventoryItem.instanceId,
          reason: 'drop',
          confidence: 'high',
        });
        
        // Log to backend
        logDropTag(itemName, inventoryItem.name, inventoryItem.instanceId);
      } else {
        logDropTag(itemName, null, null);
        result.warnings.push(`[DROP:] tag for item not in inventory: ${itemName}`);
      }
    }
  }
  
  // Process [USE:] tags (consume)
  if (useItems.length > 0) {
    for (const itemName of useItems) {
      const inventoryItem = findMatchingInventoryItem(itemName, inventory.state.items);
      
      if (inventoryItem) {
        inventory.dispatch({ 
          type: 'USE_ITEM', 
          payload: { 
            instanceId: inventoryItem.instanceId,
            useDescription: 'Used via mechanics tag',
            consumeOnUse: true,
          } 
        });
        
        result.itemsRemoved.push({
          name: inventoryItem.name,
          instanceId: inventoryItem.instanceId,
          reason: 'consume',
          confidence: 'high',
        });
        
        // Log to backend
        logUseTag(itemName, inventoryItem.name, inventoryItem.instanceId);
      } else {
        logUseTag(itemName, null, null);
        result.warnings.push(`[USE:] tag for item not in inventory: ${itemName}`);
      }
    }
  }
  
  return result;
}

// ============================================================================
// COMBINED PROCESSOR - Process both AI tags and narrative fallback
// ============================================================================

export function processStoryInventoryUpdate(
  narrative: string,
  mechanicsTags: MechanicsTags,
  inventory: InventoryDispatcher,
  options: {
    useFallbackParsing?: boolean;
    minConfidence?: 'high' | 'medium' | 'low';
  } = {}
): StoryInventorySyncResult {
  const { useFallbackParsing = true, minConfidence = 'high' } = options;
  
  // First, process explicit AI mechanics tags (highest priority)
  const tagsResult = processAIMechanicsTags(mechanicsTags, inventory);
  
  // Then, if fallback parsing is enabled, scan narrative for untagged items
  if (useFallbackParsing) {
    // Get items already processed by tags
    const alreadyAdded = new Set(tagsResult.itemsAdded.map(i => i.name.toLowerCase()));
    const alreadyRemoved = new Set(tagsResult.itemsRemoved.map(i => i.name.toLowerCase()));
    
    // Run narrative sync, but skip items already handled by tags
    const narrativeResult = syncStoryWithInventory(narrative, inventory, {
      processPickups: true,
      processDrops: true,
      processConsumptions: true,
      minConfidence,
    });
    
    // Merge results (avoid duplicates)
    for (const added of narrativeResult.itemsAdded) {
      if (!alreadyAdded.has(added.name.toLowerCase())) {
        tagsResult.itemsAdded.push(added);
      }
    }
    
    for (const removed of narrativeResult.itemsRemoved) {
      if (!alreadyRemoved.has(removed.name.toLowerCase())) {
        tagsResult.itemsRemoved.push(removed);
      }
    }
    
    tagsResult.warnings.push(...narrativeResult.warnings);
  }
  
  // Log summary
  if (tagsResult.itemsAdded.length > 0 || tagsResult.itemsRemoved.length > 0) {
    console.log('[STORY-INV SYNC] Summary:', {
      added: tagsResult.itemsAdded.length,
      removed: tagsResult.itemsRemoved.length,
      warnings: tagsResult.warnings.length,
    });
  }
  
  return tagsResult;
}

// ============================================================================
// DEBUG EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).debugStoryInventorySync = {
    syncStoryWithInventory,
    processAIMechanicsTags,
    processStoryInventoryUpdate,
    findMatchingInventoryItem,
    parseConsumptions,
  };
}
